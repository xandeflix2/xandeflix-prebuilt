import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {CastMember} from '../../artwork/series-presentation.service.ts';
import {personMetadataService,type PersonProfile} from '../../artwork/tmdb-person.service.ts';
import {loadActorTitles} from '../../catalog/actor-titles.service.ts';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {CatalogItemViewModel} from '../../catalog/catalog-view-model.ts';
import {getClientBootstrapService} from '../../bootstrap/client.ts';
import {CatalogGrid} from './CatalogGrid.tsx';
interface Props {person:CastMember;readModel:CatalogReadModel;onClose:()=>void;onSelectItem?:(item:CatalogItemViewModel)=>void}
/** Retained detail below a normal shell page; the existing menu remains accessible. */
export function ActorDetailPage({person,readModel,onClose,onSelectItem}:Props):React.ReactElement {
  const page=useRef<HTMLElement>(null),entry=useRef<HTMLHeadingElement>(null),lastFocus=useRef<HTMLElement|null>(null),close=useRef(onClose),returning=useRef(true);
  close.current=onClose;
  const host=document.querySelector<HTMLElement>('.app-content')||document.getElementById('root')||document.body;
  const [attempt,retry]=useState(0),[profile,setProfile]=useState<{id:number;value:PersonProfile|null}>(),[titles,setTitles]=useState<{id:number;model:CatalogReadModel;items:CatalogItemViewModel[];failed:boolean}>();
  useLayoutEffect(()=>{
    const previous=document.activeElement as HTMLElement|null,shell=host.closest('.app-shell'),scroll={x:window.scrollX,y:window.scrollY};
    const siblings=Array.from(host.children).filter((e):e is HTMLElement=>e instanceof HTMLElement&&e!==page.current).map(e=>({e,display:e.style.getPropertyValue('display'),priority:e.style.getPropertyPriority('display'),hidden:e.hidden,inert:e.getAttribute('inert'),aria:e.getAttribute('aria-hidden')}));
    for(const {e}of siblings){e.style.setProperty('display','none','important');e.hidden=true;e.setAttribute('inert','');e.setAttribute('aria-hidden','true');}
    shell?.classList.add('app-shell--actor-page');const shellObserver=new MutationObserver(()=>{if(shell&&!shell.classList.contains('app-shell--actor-page'))shell.classList.add('app-shell--actor-page');});if(shell)shellObserver.observe(shell,{attributes:true,attributeFilter:['class']});entry.current?.focus({preventScroll:true});window.scrollTo({top:0,left:0,behavior:'auto'});
    const nativeBack=(event:Event)=>{event.preventDefault();event.stopImmediatePropagation();close.current();};
    const menuRight=(event:KeyboardEvent)=>{const target=event.target;if(['Escape','GoBack','BrowserBack'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();close.current();return;}if(event.key==='ArrowRight'&&target instanceof HTMLElement&&shell?.classList.contains('app-shell--side-nav')&&target.closest('.app-header')){event.preventDefault();event.stopImmediatePropagation();(lastFocus.current?.isConnected?lastFocus.current:entry.current)?.focus({preventScroll:true});}};
    window.addEventListener('xandeflix:device-presentation-back',nativeBack);window.addEventListener('keydown',menuRight,true);
    return()=>{shellObserver.disconnect();window.removeEventListener('xandeflix:device-presentation-back',nativeBack);window.removeEventListener('keydown',menuRight,true);shell?.classList.remove('app-shell--actor-page');
      for(const {e,display,priority,hidden,inert,aria}of siblings){if(display)e.style.setProperty('display',display,priority);else e.style.removeProperty('display');e.hidden=hidden;if(inert===null)e.removeAttribute('inert');else e.setAttribute('inert',inert);if(aria===null)e.removeAttribute('aria-hidden');else e.setAttribute('aria-hidden',aria);}
      if(returning.current&&previous?.isConnected){previous.focus({preventScroll:true});window.scrollTo({top:scroll.y,left:scroll.x,behavior:'auto'});}
    };
  },[host]);
  useEffect(()=>{const controller=new AbortController();setProfile(undefined);setTitles(undefined);
    void personMetadataService.resolve(person.id).then(async value=>{if(controller.signal.aborted)return;setProfile({id:person.id,value});if(!value)return;
      try{const items=await loadActorTitles(readModel,value.credits,getClientBootstrapService().getStorage(),controller.signal);if(!controller.signal.aborted)setTitles({id:person.id,model:readModel,items,failed:false});}
      catch{if(!controller.signal.aborted)setTitles({id:person.id,model:readModel,items:[],failed:true});}
    }).catch(()=>{if(!controller.signal.aborted)setProfile({id:person.id,value:null});});return()=>controller.abort();
  },[person.id,readModel,attempt]);
  const data=profile?.id===person.id?profile.value:undefined,local=titles?.id===person.id&&titles.model===readModel?titles:undefined;
  const keyboard=(event:React.KeyboardEvent<HTMLElement>)=>{
    if(['Escape','GoBack','BrowserBack'].includes(event.key)){event.preventDefault();event.stopPropagation();onClose();return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    const current=document.activeElement as HTMLElement,items=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('.focusable-item:not([disabled])')).filter(e=>e.getClientRects().length>0),rect=current.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2,dx=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0,dy=event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:0;
    if(event.key==='ArrowLeft'&&current.closest('.actor-profile-top')){const shell=event.currentTarget.closest('.app-shell--side-nav'),menu=Array.from(shell?.querySelectorAll<HTMLElement>('.header-nav .nav-link:not([disabled])')||[]).filter(e=>e.getClientRects().length>0&&!e.closest('[hidden],[inert]')).sort((a,b)=>Number(b.classList.contains('active'))-Number(a.classList.contains('active')))[0];if(menu){event.preventDefault();event.stopPropagation();menu.focus();return;}}
    let target:HTMLElement|undefined,score=Infinity;
    for(const item of items){if(item===current)continue;const r=item.getBoundingClientRect(),a=r.left+r.width/2-x,b=r.top+r.height/2-y,primary=dx?a*dx:b*dy,secondary=dx?Math.abs(b):Math.abs(a);if(primary<=1)continue;const s=primary+secondary*2;if(s<score){target=item;score=s;}}
    event.preventDefault();event.stopPropagation();
    if(!target&&dx===-1){const shell=event.currentTarget.closest('.app-shell--side-nav'),menu=Array.from(shell?.querySelectorAll<HTMLElement>('.header-nav .nav-link:not([disabled])')||[]).filter(e=>e.getClientRects().length>0&&!e.closest('[hidden],[inert]')).sort((a,b)=>Number(b.classList.contains('active'))-Number(a.classList.contains('active')))[0];if(menu){menu.focus();return;}}
    if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest'});}else window.scrollBy({top:dy*160,left:0,behavior:'auto'});
  };
  const again=<button type="button" className="focusable-item btn-secondary" onClick={()=>retry(n=>n+1)}>Tentar novamente</button>;
  const dateLabel=(value:string)=>value.split('-').reverse().join('/');
  return createPortal(<main ref={page} className="actor-detail-page" aria-label={'Sobre '+(data?.name||person.name)} onKeyDown={keyboard} onFocusCapture={event=>{lastFocus.current=event.target as HTMLElement;}}>
    <div className="actor-profile-top">
      {(data?.profileUri||person.profileUri)?<img key={data?.profileUri||person.profileUri} className="actor-portrait" src={data?.profileUri||person.profileUri} alt={data?.name||person.name} referrerPolicy="no-referrer" onError={event=>{event.currentTarget.style.visibility='hidden';}}/>:null}
      <div className="actor-biography"><h1 ref={entry} className="focusable-item actor-name" tabIndex={0}>{data?.name||person.name}</h1>
        {data?<><dl>{data.birthday?<><dt>Nascimento</dt><dd>{dateLabel(data.birthday)}</dd></>:null}{data.birthplace?<><dt>Local de nascimento</dt><dd>{data.birthplace}</dd></>:null}{data.deathday?<><dt>Falecimento</dt><dd>{dateLabel(data.deathday)}</dd></>:null}{data.department?<><dt>Área de atuação</dt><dd>{data.department==='Acting'?'Atuação':data.department}</dd></>:null}</dl><h2>Biografia</h2><div className="focusable-item actor-biography-text" tabIndex={0}>{data.biography||'Biografia em português indisponível no TMDB.'}</div></>:data===null?<div role="status"><p>Não foi possível carregar os dados deste ator.</p>{again}</div>:<p role="status">Carregando dados do ator…</p>}
      </div>
    </div>
    {data?<section className="actor-filmography" aria-label="Filmes e séries do elenco"><h2>Filmes e séries na sua fonte</h2>{!local?<p role="status">Buscando títulos no catálogo local…</p>:local.failed?<div role="status"><p>Não foi possível consultar o catálogo local.</p>{again}</div>:<CatalogGrid items={local.items} showKindBadge getItemKey={item=>item.kind+':'+item.id} onItemClick={item=>{returning.current=false;onClose();onSelectItem?.(item);}} emptyMessage="Nenhum filme ou série deste ator disponível nesta fonte."/>}</section>:null}
  </main>,host);
}
