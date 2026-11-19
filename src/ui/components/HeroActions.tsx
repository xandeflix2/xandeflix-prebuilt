import React,{useEffect,useState}from'react';
import{createPortal}from'react-dom';
import{CastButton}from'./CastButton.tsx';
interface Props{content:React.RefObject<HTMLDivElement>;showBack:boolean;showCast:boolean;onBack?:()=>void}
/** Same controls/handlers, mounted inside the current hero rather than a separate row. */
export function HeroActions({content,showBack,showCast,onBack}:Props){
 const[state,setState]=useState<{hero:HTMLElement|null;actor:boolean;located:boolean}>({hero:null,actor:false,located:false}),hero=state.hero;
 useEffect(()=>{const root=content.current;if(!root||(!showBack&&!showCast)){setState({hero:null,actor:false,located:false});return;}let current:HTMLElement|null=null;
  const locate=()=>{const actor=!!root.querySelector('.actor-detail-page'),found=root.querySelector<HTMLElement>('.detail-hero-wide,.series-phone-hero,.hero-banner'),next=!actor&&found&&!found.closest('[hidden],[inert]')?found:null;if(current!==next){current?.classList.remove('hero-with-navigation');current=next;current?.classList.add('hero-with-navigation');}setState(previous=>previous.located&&previous.hero===next&&previous.actor===actor?previous:{hero:next,actor,located:true});};
  locate();const observer=new MutationObserver(locate);observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','inert']});return()=>{observer.disconnect();current?.classList.remove('hero-with-navigation');};
 },[content,showBack,showCast]);
 const controls=<>{showBack&&onBack?<button type="button" className="focusable-item btn-back" onClick={onBack} aria-label="Voltar para a tela anterior">← Voltar</button>:null}{showCast?<CastButton iconOnly/>:null}</>;
 return hero?createPortal(<div className="hero-top-actions" role="group" aria-label="Navegação do destaque">{controls}</div>,hero):state.located&&!state.actor&&showBack?<div className="page-back-row" role="group" aria-label="Navegação da página">{controls}</div>:null;
}
