import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parentalControls, parentalDpadTarget, parentalEntry } from '../src/ui/parental-dpad-navigation.ts';

// Execute the real hook against a DOM tree containing the production wrappers.
// Fixtures carry no catalog data and do not replace the navigation algorithm.
let document, rectReads = 0;
function matchesOne(node, selector) {
  if (selector.includes(':not([disabled])') && node.disabled) return false;
  if (selector.includes(':not([aria-hidden="true"])') && node.attributes['aria-hidden'] === 'true') return false;
  selector = selector.replace(/:not\([^)]*\)/g, '');
  const parts = selector.trim().split(/\s+/), own = parts.pop();
  const simple = (el, part) => {
    const tag = part.match(/^[a-z]+/)?.[0];
    if (tag && el.tag !== tag) return false;
    if (![...part.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)].every(m => m[2] === undefined ? m[1] in el.attributes : el.attributes[m[1]] === m[2])) return false;
    return [...part.matchAll(/\.([\w-]+)/g)].every(m => el.classes.has(m[1]));
  };
  if (!simple(node, own)) return false;
  let parent = node.parentElement;
  while (parts.length) {
    const part = parts.pop();
    while (parent && !simple(parent, part)) parent = parent.parentElement;
    if (!parent) return false;
    parent = parent.parentElement;
  }
  return true;
}
class Element {
  constructor(tag = 'div', classes = '') {
    this.tag = tag; this.classes = new Set(classes.split(/\s+/).filter(Boolean));
    this.classList = { contains: name => this.classes.has(name) };
    this.children = []; this.attributes = {}; this.isConnected = true;
    this.scrolls = []; this.scrollLeft = 0;
  }
  append(...nodes) { for (const node of nodes) { node.parentElement = this; this.children.push(node); } return this; }
  matches(selector) { return selector.split(',').some(part => matchesOne(this, part)); }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  querySelectorAll(selector) {
    const result = []; const walk = node => { for (const child of node.children) { if (child.matches(selector)) result.push(child); walk(child); } }; walk(this); return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  get nextElementSibling() { return this.parentElement?.children[this.parentElement.children.indexOf(this) + 1] || null; }
  get previousElementSibling() { return this.parentElement?.children[this.parentElement.children.indexOf(this) - 1] || null; }
  focus() { document.activeElement = this; }
  getClientRects() { return [{}]; }
  getBoundingClientRect() { rectReads++; return { left: 0, right: 120, top: 0, bottom: 50, width: 120, height: 50 }; }
  scrollIntoView(options) { this.scrolls.push(options); }
}
const button = cls => new Element('button', 'focusable-item ' + (cls || ''));
function rail(count, viewAll = true) {
  const root = new Element('section', 'media-rail'), track = new Element('div', 'media-rail-track');
  const cards = Array.from({ length: count }, () => button('media-card'));
  const action = viewAll ? button('rail-view-all') : null;
  if (action) root.append(new Element('div', 'media-rail-header').append(action));
  root.append(track.append(...cards)); return { root, track, cards, action };
}
function harness(fire = true) {
  const listeners = new Map(), frames = new Map(), cleanup = []; let id = 0, now = 0;
  document = new Element('body'); document.body = document; document.activeElement = null;
  const shell = new Element('div', 'app-shell--side-nav' + (fire ? ' app-shell--fire-stick' : ''));
  const menu = button('nav-link active'), header = new Element('header', 'app-header').append(new Element('nav', 'header-nav').append(menu));
  const main = new Element('main'), back = button('btn-back'), content = new Element('div', 'app-content').append(new Element('div', 'page-back-row').append(back), main);
  document.append(shell.append(header, content));
  const exports = {}, source = readFileSync(new URL('../src/ui/hooks/useDpadNavigation.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, document, HTMLElement: Element, HTMLInputElement: class extends Element {}, HTMLTextAreaElement: class extends Element {},
    performance: { now: () => now += 100 }, MutationObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; }, cancelAnimationFrame: frame => frames.delete(frame),
    getComputedStyle:()=>({scrollMarginTop:'16.2px'}),
    window: { scrollY:100,scrollX:0,scrollTo:options=>document.activeElement.closest('.hero-banner, .detail-hero-wide').scrolls.push(options), addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name), getComputedStyle: () => ({ gridTemplateColumns: '1fr 1fr' }), innerWidth: 960 },
    require: name => { if (name === '../parental-dpad-navigation.ts') return { parentalControls, parentalDpadTarget, parentalEntry }; assert.equal(name, 'react'); return { useRef: value => ({ current: value }), useCallback: fn => fn, useEffect: fn => { const dispose = fn(); if (dispose) cleanup.push(dispose); } }; },
  });
  exports.useDpadNavigation({ autoFocusFirst: false });
  const commit = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); };
  return { main, menu, back, content, key(key, prevented = false) { listeners.get('keydown')({ key, defaultPrevented: prevented, preventDefault() {}, repeat: false }); commit(); },
    focusin(target) { listeners.get('focusin')({ target }); commit(); }, dispose() { cleanup.forEach(fn => fn()); assert.equal(frames.size, 0); assert.equal(listeners.size, 0); } };
}

let h = harness(); h.main.classes.add('home-page');
const hero = new Element('div', 'hero-banner'), heroButton = button(); hero.append(new Element('div', 'hero-actions').append(heroButton));
const recent = rail(4), empty = rail(0), movies = rail(3), series = rail(5);
h.main.append(hero, new Element('section', 'recent-titles').append(recent.root), new Element('div', 'home-rails-container').append(empty.root, movies.root, series.root));
recent.cards[3].focus(); rectReads = 0; h.key('ArrowDown'); assert.equal(document.activeElement, movies.cards[2]);
h.key('ArrowDown'); assert.equal(document.activeElement, series.cards[2]); assert.equal(rectReads, 0);
h.key('ArrowUp'); assert.equal(document.activeElement, series.action);
h.key('ArrowUp'); assert.equal(document.activeElement, movies.action);
h.key('ArrowUp'); assert.equal(document.activeElement, recent.action);
h.key('ArrowUp'); assert.equal(document.activeElement, heroButton); assert.equal(hero.scrolls.at(-1).top, 83.8);
console.log('PASS_REAL_HOME_WRAPPED_RECENT_DOWN_COLUMN_CLAMP_EMPTY_SKIP_AND_VIEW_ALL_RETURN');

movies.cards[1].focus(); h.key('ArrowRight'); assert.equal(document.activeElement, movies.cards[2]);
h.key('ArrowLeft'); assert.equal(document.activeElement, movies.cards[1]);
movies.cards[0].focus(); h.key('ArrowLeft'); assert.equal(document.activeElement, h.menu);
h.key('ArrowRight'); assert.equal(document.activeElement, movies.cards[0]);
const before = document.activeElement; h.key('ArrowDown', true); assert.equal(document.activeElement, before);
h.dispose(); console.log('PASS_REAL_HORIZONTAL_SIDEBAR_RESTORE_LOCAL_KEY_HANDLERS_AND_CLEANUP');

h = harness(); h.main.classes.add('detail-page--wide');
const detailHero = new Element('div', 'detail-hero-wide'), watch = button(), trailer = button();
detailHero.append(new Element('div', 'detail-actions').append(watch, trailer));
const related = rail(8, false); h.main.append(new Element('div', 'detail-content').append(detailHero, related.root));
related.cards[5].focus(); h.key('ArrowUp'); assert.equal(document.activeElement, watch);
assert.equal(detailHero.scrolls.at(-1).top, 83.8); assert.equal(detailHero.scrolls.at(-1).behavior, 'auto');
h.key('ArrowUp'); assert.equal(document.activeElement, h.back);
watch.disabled = true; related.cards[0].focus(); h.key('ArrowUp'); assert.equal(document.activeElement, trailer);
const count = detailHero.scrolls.length; h.focusin(trailer); assert.equal(detailHero.scrolls.length, count + 1);
assert.equal(detailHero.scrolls.at(-1).top, 83.8);
const modalControl = button(), modal = new Element('dialog', 'modal-content').append(modalControl);
detailHero.children[0].append(modal);const beforeModal = detailHero.scrolls.length;
modalControl.focus();h.focusin(modalControl);assert.equal(detailHero.scrolls.length, beforeModal, 'Modal focus must not scroll the background hero');
h.dispose(); console.log('PASS_REAL_DETAIL_RELATED_UP_CURRENT_HERO_FULL_SCROLL_DISABLED_ACTION_TOP_BACK_AND_MODAL_ISOLATION');

h = harness(false); h.main.classes.add('detail-page--wide');
const tabletHero = new Element('div', 'detail-hero-wide'), tabletWatch = button(), tabletRelated = rail(2, false);
tabletHero.append(new Element('div', 'detail-actions').append(tabletWatch)); h.main.append(tabletHero, tabletRelated.root);
tabletRelated.cards[0].focus(); h.key('ArrowUp'); assert.equal(document.activeElement, tabletWatch);
assert.equal(tabletHero.scrolls.length, 0); assert.equal(tabletWatch.scrolls.at(-1).block, 'center');
h.focusin(tabletWatch); assert.equal(tabletHero.scrolls.length, 0);
const otherMain = new Element('main').append(new Element('div', 'hero-actions').append(button())); document.append(otherMain);
tabletHero.children[0].children.length = 0; tabletRelated.cards[0].focus(); h.key('ArrowUp'); assert.equal(document.activeElement, h.menu);
h.dispose(); console.log('PASS_REAL_MAIN_ISOLATION_AND_NON_FIRE_SCROLL_UNCHANGED');

// Episode action X varies with the resume notice; navigation follows rows.
function seriesFixture(seasonCount=2,episodeCount=3){
 const h=harness();h.main.classes.add('detail-page--wide');
 const hero=new Element('div','detail-hero-wide'),watch=button('detail-trailer-action');
 hero.append(new Element('div','detail-actions').append(watch));
 const tabs=new Element('div','series-detail-tabs'),episodeTab=button(),relatedTab=button();
 episodeTab.attributes['aria-selected']='true';tabs.append(episodeTab,relatedTab);
 const panel=new Element('div','series-detail-panel'),seasons=new Element('section','seasons-section');
 const seasonTabs=new Element('div','season-selector-tabs'),seasonButtons=Array.from({length:seasonCount},(_,i)=>button('season-tab'+(i===0?' active':'')));
 if(seasonCount)seasons.append(seasonTabs.append(...seasonButtons));
 const list=new Element('ul','episodes-list'),actions=Array.from({length:episodeCount},()=>button('btn-episode-play'));
 list.append(...actions.map(action=>new Element('li','episode-card').append(new Element('div','episode-info').append(new Element('div','episode-playback-action').append(action)))));
 seasons.append(list);panel.append(seasons);h.main.append(hero,new Element('div','series-detail-sections').append(tabs,panel));
 const rect=(el,x,y)=>{el.getBoundingClientRect=()=>{rectReads++;return {left:x,right:x+70,top:y,bottom:y+24,width:70,height:24};};};
 rect(watch,400,200);rect(episodeTab,80,300);rect(relatedTab,200,300);
 seasonButtons.forEach((el,i)=>rect(el,80+i*120,350));actions.forEach((el,i)=>rect(el,i===2?230:80,400+i*40));
 return {...h,hero,watch,episodeTab,relatedTab,seasonButtons,actions,seasons};
}
h=seriesFixture();h.actions[2].focus();rectReads=0;h.key('ArrowUp');assert.equal(document.activeElement,h.actions[1]);
h.key('ArrowUp');assert.equal(document.activeElement,h.actions[0]);h.key('ArrowUp');assert.equal(document.activeElement,h.seasonButtons[0]);
h.key('ArrowUp');assert.equal(document.activeElement,h.episodeTab);h.key('ArrowUp');assert.equal(document.activeElement,h.watch);
assert.equal(h.hero.scrolls.at(-1).top,83.8);assert.equal(rectReads,1,'Only hero framing reads geometry; episode target selection remains structural');
h.key('ArrowDown');assert.equal(document.activeElement,h.episodeTab);h.key('ArrowDown');assert.equal(document.activeElement,h.seasonButtons[0]);h.key('ArrowDown');assert.equal(document.activeElement,h.actions[0]);
assert.equal(h.actions[0].closest('.episode-card').scrolls.at(-1).block,'center');
h.key('ArrowDown');assert.equal(document.activeElement,h.actions[1]);h.key('ArrowDown');assert.equal(document.activeElement,h.actions[2]);h.key('ArrowDown');assert.equal(document.activeElement,h.actions[2]);
h.key('ArrowLeft');assert.equal(document.activeElement,h.menu);h.key('ArrowRight');assert.equal(document.activeElement,h.actions[2]);h.dispose();
console.log('PASS_REAL_SERIES_RESUME_X_OFFSET_EPISODE_ORDER_HERO_TABS_SEASONS_ROW_SCROLL_MENU_RESTORE');

h=seriesFixture(0);h.episodeTab.focus();h.key('ArrowDown');assert.equal(document.activeElement,h.actions[0]);
h.key('ArrowUp');assert.equal(document.activeElement,h.episodeTab);
h.actions[1].disabled=true;h.actions[0].focus();h.key('ArrowDown');assert.equal(document.activeElement,h.actions[2]);
h.key('ArrowUp');assert.equal(document.activeElement,h.actions[0]);h.dispose();
console.log('PASS_REAL_SERIES_NO_SEASON_BUTTONS_DISABLED_EPISODE_SKIP');
h=seriesFixture(2,0);h.episodeTab.focus();h.key('ArrowDown');assert.equal(document.activeElement,h.seasonButtons[0]);
h.key('ArrowRight');assert.equal(document.activeElement,h.seasonButtons[1]);h.key('ArrowDown');assert.equal(document.activeElement,h.seasonButtons[1]);
h.key('ArrowUp');assert.equal(document.activeElement,h.episodeTab);
const control=button(),dialog=new Element('dialog','modal-content').append(control);h.main.append(dialog);control.focus();h.key('ArrowDown');assert.equal(document.activeElement,control);h.dispose();
console.log('PASS_REAL_SERIES_EMPTY_LOADING_SEASON_HORIZONTAL_MODAL_ISOLATION');

h=seriesFixture(0,0);const panel=h.seasons.parentElement;panel.children.length=0;
const relatedPanel=rail(3);panel.append(relatedPanel.root);h.relatedTab.attributes['aria-selected']='true';h.episodeTab.attributes['aria-selected']='false';
h.relatedTab.focus();h.key('ArrowDown');assert.equal(document.activeElement,relatedPanel.cards[0]);h.dispose();
console.log('PASS_REAL_SERIES_RELATED_TAB_DOWN_FIRST_CARD_NOT_HEADER_ACTION');

h=seriesFixture(0);const personal=new Element('section','series-personal-actions'),group=new Element('div','series-personal-buttons');
const rate=button(),favorite=button(),share=button(),hidden=button(),closedModal=button();
hidden.getClientRects=()=>[];
personal.append(group.append(rate,favorite,hidden,share),new Element('dialog','modal-content').append(closedModal));
h.hero.children[0].append(personal);
h.watch.focus();h.key('ArrowRight');assert.equal(document.activeElement,rate);h.key('ArrowRight');assert.equal(document.activeElement,favorite);
h.key('ArrowRight');assert.equal(document.activeElement,share);h.key('ArrowRight');assert.equal(document.activeElement,share);
h.key('ArrowLeft');assert.equal(document.activeElement,favorite);favorite.disabled=true;share.focus();h.key('ArrowLeft');assert.equal(document.activeElement,rate);
h.key('ArrowLeft');assert.equal(document.activeElement,h.watch);h.key('ArrowLeft');assert.equal(document.activeElement,h.menu);
h.key('ArrowRight');assert.equal(document.activeElement,h.watch);h.key('ArrowUp');assert.equal(document.activeElement,h.back);h.key('ArrowDown');assert.equal(document.activeElement,h.watch);
h.episodeTab.focus();h.key('ArrowLeft');assert.equal(document.activeElement,h.menu);h.key('ArrowRight');assert.equal(document.activeElement,h.episodeTab);
h.actions[0].focus();h.key('ArrowLeft');h.actions[0].isConnected=false;h.key('ArrowRight');assert.equal(document.activeElement,h.watch);
h.dispose();console.log('PASS_REAL_SERIES_NESTED_HERO_HORIZONTAL_VISIBLE_ONLY_TAB_MENU_BACK_AND_STALE_RESTORE');

h=seriesFixture(0,0);const retry=button();h.seasons.parentElement.append(retry);retry.focus();h.key('ArrowUp');assert.equal(document.activeElement,h.episodeTab);
retry.focus();h.key('ArrowLeft');assert.equal(document.activeElement,h.menu);h.key('ArrowRight');assert.equal(document.activeElement,retry);
const relatedRows=rail(2,false);h.seasons.parentElement.append(relatedRows.root);h.relatedTab.attributes['aria-selected']='true';h.episodeTab.attributes['aria-selected']='false';
relatedRows.cards[1].focus();h.key('ArrowUp');assert.equal(document.activeElement,h.relatedTab);h.key('ArrowUp');assert.equal(document.activeElement,h.watch);
h.dispose();console.log('PASS_REAL_SERIES_RETRY_UP_MENU_AND_RELATED_UP_ACTIVE_TAB_HERO');
