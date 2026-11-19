import assert from 'node:assert/strict';
import {gridTarget,gridRowRanges,categoryGridSeed,GRID_OVERSCAN_ROWS} from '../src/ui/catalog-grid-window.ts';
import {eligibleExpansionRail,installExpandedCards} from '../src/ui/expanded-card-controller.ts';
import {orderCategoryItems} from '../src/catalog/category-presentation.ts';
let checks=0;const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
function rail(context,pageContext=context,excluded=false,connected=true){
 const root={isConnected:connected,dataset:{cardExpansionContext:context},closest(selector){if(selector.startsWith('.media-rail-track'))return root;if(selector.startsWith('main'))return pageContext?{dataset:{cardExpansionPage:pageContext}}:null;return excluded?{}:null;}};
 return {closest:()=>root};
}
test('EXPLICIT_CATEGORY_CONTEXT_ACCEPTS_ONLY_THREE_MAIN_RAILS',()=>{for(const context of['home','movies','series'])assert.ok(eligibleExpansionRail(rail(context)));});
test('VIEW_CLASS_OR_GENERIC_CARD_NEVER_GRANTS_ELIGIBILITY',()=>{assert.equal(eligibleExpansionRail({closest:()=>null}),null);for(const context of[undefined,'','search','favorites','recent','collection'])assert.equal(eligibleExpansionRail(rail(context)),null);});
test('GRID_PERSONAL_MISMATCH_DISCONNECTED_AND_MISSING_PAGE_DENIED',()=>{
 for(const context of['home','movies','series']){
  assert.equal(eligibleExpansionRail(rail(context,context,true)),null);
  assert.equal(eligibleExpansionRail(rail(context,'search')),null);
  assert.equal(eligibleExpansionRail(rail(context,undefined,false,false)),null);
  assert.equal(eligibleExpansionRail(rail(context,'')),null);
 }
});
test('DISABLED_AND_INELIGIBLE_PAGES_INSTALL_NO_GLOBAL_LISTENERS_OR_OBSERVERS',()=>{
 const previous=globalThis.document;let queries=0;globalThis.document={querySelector(){queries++;return null;}};
 try{installExpandedCards(false,()=>assert.fail())();assert.equal(queries,0);installExpandedCards(true,()=>assert.fail())();assert.equal(queries,1);}finally{globalThis.document=previous;}
});
test('HORIZONTAL_NEVER_WRAPS_TO_ANOTHER_ROW',()=>{
 for(const columns of[1,2,3,4,5,6,8,12])for(const count of[1,2,7,48,101,10000])for(let index=0;index<count;index++)for(const key of['ArrowLeft','ArrowRight']){
  const target=gridTarget(index,key,count,columns);assert.equal(Math.floor(target/columns),Math.floor(index/columns));assert.ok(target>=0&&target<count);
 }
});
test('VERTICAL_PRESERVES_COLUMN_AND_CLAMPS_PARTIAL_FINAL_ROW',()=>{
 for(const columns of[1,2,3,4,7,12])for(const count of[1,2,7,48,101,10000])for(let index=0;index<count;index++){
  const down=gridTarget(index,'ArrowDown',count,columns),up=gridTarget(index,'ArrowUp',count,columns);
  assert.equal(up,index>=columns?index-columns:index);
  assert.equal(down,(Math.floor(index/columns)+1)*columns<count?Math.min(index+columns,count-1):index);
 }
});
test('ROW_WINDOW_THOUSANDS_BOUNDED_AND_CONTAINS_FOCUSED_PENDING_ROWS',()=>{
 const count=10000,visible=4;
 for(const columns of[1,2,4,7,12])for(const first of[0,1,10,100,Math.ceil(count/columns)-1]){
  const retained=[Math.min(count-1,columns+1),count-1],ranges=gridRowRanges(count,columns,first,visible,retained);
  const rows=ranges.reduce((n,r)=>n+r.end-r.start,0);
  assert.ok(rows<=visible+2*GRID_OVERSCAN_ROWS+2);
  for(const index of retained)assert.ok(ranges.some(r=>Math.floor(index/columns)>=r.start&&Math.floor(index/columns)<r.end));
  for(let n=0;n<ranges.length;n++){assert.ok(ranges[n].start>=0&&ranges[n].end<=Math.ceil(count/columns));if(n)assert.ok(ranges[n].start>ranges[n-1].end);}
 }
 assert.deepEqual(gridRowRanges(0,4,0,3),[]);
});
test('APPEND_KEEPS_LOGICAL_TARGET_AND_RETURNS_ALL_LAST_ITEMS',()=>{
 for(const count of[48,96,144,10000]){
  assert.equal(gridTarget(10,'ArrowDown',count,6),16);
  const last=count-1,ranges=gridRowRanges(count,6,Math.floor(last/6),3,[last]);assert.ok(ranges.some(r=>last>=r.start*6&&last<r.end*6));
 }
});
test('COLLECTION_PRESENTATION_SEED_SURVIVES_UNMOUNT_WITHOUT_PERSISTENCE',()=>{
 const data=Array.from({length:144},(_,id)=>({id})),seed=categoryGridSeed('snapshot','movies','category');
 assert.equal(seed,categoryGridSeed('snapshot','movies','category'));
 assert.notEqual(seed,categoryGridSeed('other','movies','category'));
 assert.deepEqual(orderCategoryItems(data,'Ação',seed),orderCategoryItems(data,'Ação',categoryGridSeed('snapshot','movies','category')));
 assert.deepEqual(orderCategoryItems(data.slice(0,48),'Ação',seed),orderCategoryItems(data,'Ação',seed).slice(0,48));
});
assert.equal(checks,9);console.log('DPAD_CARD_SCOPE_SEEALL_GRID=PASS');
