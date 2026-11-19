export const GRID_OVERSCAN_ROWS=3;

/** Presentation-only seed also survives a details round trip, with no storage. */
export function categoryGridSeed(snapshot:string,kind:string,categoryId:string|undefined):number {
  let seed=2166136261;
  for(const char of JSON.stringify([snapshot,kind,categoryId]))seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  return seed||1;
}

/** Logical positions remain independent of the subset currently mounted. */
export function gridTarget(index:number,key:string,count:number,columns:number):number {
  const row=Math.floor(index/columns),column=index%columns;
  if(key==='ArrowLeft')return column>0?index-1:index;
  if(key==='ArrowRight')return column<columns-1&&index+1<count?index+1:index;
  if(key==='ArrowUp')return row>0?index-columns:index;
  if(key==='ArrowDown')return (row+1)*columns<count?Math.min(index+columns,count-1):index;
  return index;
}

/** Visible rows plus overscan and at most two retained focus/return rows. */
export function gridRowRanges(count:number,columns:number,firstRow:number,visibleRows:number,retained:readonly number[]=[]) {
  const total=Math.ceil(count/columns);
  if(!total)return [];
  const start=Math.max(0,Math.min(total-1,firstRow)-GRID_OVERSCAN_ROWS);
  const end=Math.min(total,Math.max(0,firstRow)+visibleRows+GRID_OVERSCAN_ROWS);
  const ranges=[{start,end:Math.max(start+1,end)}];
  for(const index of retained)if(index>=0&&index<count){const row=Math.floor(index/columns);ranges.push({start:row,end:row+1});}
  ranges.sort((a,b)=>a.start-b.start);
  const merged:typeof ranges=[];
  for(const range of ranges){const last=merged.at(-1);if(last&&range.start<=last.end)last.end=Math.max(last.end,range.end);else merged.push({...range});}
  return merged;
}
