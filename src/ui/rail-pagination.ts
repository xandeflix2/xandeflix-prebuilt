import type {BrowseCursor,BrowsePage} from '../catalog/segmented-browse.service.ts';

export const HOME_RAIL_BATCH=20,RAIL_PREFETCH_REMAINING=6,RAIL_WINDOW_SIZE=24;
export interface RailPageState<T> {items:readonly T[];loading:boolean;error:boolean;done:boolean}
/** A first-fold cache is a seed, never proof that the category has ended. */
export class RailPagination<T extends {id:string}> {
  private state:RailPageState<T>;
  private cursor:BrowseCursor|null={segment:0,offset:0};
  private seen=new Set<string>();private listeners=new Set<()=>void>();
  private controller=new AbortController();private pending?:Promise<void>;
  private fetchPage:(cursor:BrowseCursor,size:number,signal:AbortSignal)=>Promise<BrowsePage<T>>;
  private accept:(item:T)=>boolean;
  constructor(seed:readonly T[],fetchPage:(cursor:BrowseCursor,size:number,signal:AbortSignal)=>Promise<BrowsePage<T>>,accept:(item:T)=>boolean=()=>true){
    this.fetchPage=fetchPage;this.accept=accept;
    const items=seed.filter(item=>{if(this.seen.has(item.id)||!accept(item))return false;this.seen.add(item.id);return true;});
    this.state={items,loading:false,error:false,done:false};
  }
  snapshot=()=>this.state;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private publish(patch:Partial<RailPageState<T>>){this.state={...this.state,...patch};for(const fn of this.listeners)fn();}
  approach(index:number){if(this.state.items.length-1-index<=RAIL_PREFETCH_REMAINING&&!this.state.error)void this.load();}
  load(retry=false):Promise<void>{
    if(this.pending)return this.pending;
    if(this.controller.signal.aborted||this.cursor===null||(this.state.error&&!retry))return Promise.resolve();
    this.publish({loading:true,error:false});
    const job=(async()=>{
      let added=0;
      try{
        while(this.cursor!==null&&added<HOME_RAIL_BATCH){
          const cursor=this.cursor,page=await this.fetchPage(cursor,HOME_RAIL_BATCH,this.controller.signal);
          if(this.controller.signal.aborted)return;
          const next=page.nextCursor;
          if(next&&(next.segment<cursor.segment||(next.segment===cursor.segment&&next.offset<=cursor.offset)))throw Error('RAIL_CURSOR_DID_NOT_ADVANCE');
          const fresh=page.items.filter(item=>{if(this.seen.has(item.id)||!this.accept(item))return false;this.seen.add(item.id);return true;});
          this.cursor=next;added+=fresh.length;
          if(fresh.length)this.publish({items:[...this.state.items,...fresh]});
          if(this.cursor!==null&&added<HOME_RAIL_BATCH)await new Promise<void>(resolve=>setTimeout(resolve,0));
        }
        if(!this.controller.signal.aborted)this.publish({done:this.cursor===null});
      }catch{if(!this.controller.signal.aborted)this.publish({error:true});}
      finally{if(!this.controller.signal.aborted)this.publish({loading:false});}
    })();
    this.pending=job;void job.finally(()=>{if(this.pending===job)this.pending=undefined;});return job;
  }
  dispose(){this.controller.abort();this.listeners.clear();this.seen.clear();}
}
export function railWindow(total:number,index:number){
  const start=Math.max(0,Math.min(Math.max(0,total-RAIL_WINDOW_SIZE),index-4));
  return {start,end:Math.min(total,start+RAIL_WINDOW_SIZE)};
}
