type Direction='ArrowUp'|'ArrowDown'|'ArrowLeft'|'ArrowRight';
const remembered=new WeakMap<Element,HTMLElement>();
export function rememberSearchResult(current:HTMLElement):void {
  const page=current.closest('.search-page-container');
  if(page&&current.matches('.search-results-grid .media-card'))remembered.set(page,current);
}
/** Undefined delegates to the existing spatial engine; no query or state mutation. */
export function searchDpadTarget(current:HTMLElement,key:Direction):HTMLElement|null|undefined {
  if(current.closest('.modal-content,.player-overlay'))return undefined;
  const page=current.closest('.search-page-container')||(current.closest('.page-back-row')?document.querySelector('.search-page-container'):null);
  if(!page)return undefined;
  const input=page.querySelector<HTMLInputElement>('.search-input:not([disabled])');
  const filters=Array.from(page.querySelectorAll<HTMLElement>('.filter-chip:not([disabled])'));
  const selected=filters.find(node=>node.getAttribute('aria-selected')==='true')||filters[0];
  const cards=Array.from(page.querySelectorAll<HTMLElement>('.search-results-grid .media-card:not([disabled])'));
  const last=remembered.get(page),result=last&&cards.includes(last)?last:cards[0];
  if(current.closest('.page-back-row'))return key==='ArrowDown'||key==='ArrowLeft'||key==='ArrowRight'?input||selected||result||current:current;
  rememberSearchResult(current);
  if(current===input||current.matches('.search-clear-btn')){
    if(key==='ArrowDown')return selected||result||current;
    if(key==='ArrowUp')return document.querySelector<HTMLElement>('.page-back-row .focusable-item')||current;
    return undefined; // Preserve caret and IME horizontal navigation.
  }
  const filter=filters.indexOf(current);
  if(filter>=0){
    if(key==='ArrowUp')return input||current;
    if(key==='ArrowDown')return result||input||current;
    return filters[filter+(key==='ArrowRight'?1:-1)]||(key==='ArrowLeft'?input:current)||current;
  }
  const index=cards.indexOf(current);
  if(index>=0&&key==='ArrowUp'){
    const grid=current.closest('.search-results-grid');
    const columns=grid?Math.max(1,getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length):1;
    if(index<columns)return selected||input||current;
  }
  return undefined;
}
