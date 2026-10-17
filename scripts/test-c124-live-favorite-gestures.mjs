import assert from 'node:assert/strict';
import {LiveChannelPress,LIVE_FAVORITE_HOLD_MS,isLiveConfirmKey} from '../src/ui/live-channel-press.ts';

let tests=0;function test(name,run){run();tests++;console.log('PASS '+name);}
const first={id:'channel:first',name:'Primeiro'},second={id:'channel:second',name:'Segundo'};
function fixture(){
  let now=0,serial=0;const timers=new Map(),selected=[],favorites=[];
  const clock={now:()=>now,delay:(run,ms)=>{const id=++serial;timers.set(id,{run,at:now+ms});return id;},clear:id=>timers.delete(id)};
  const press=new LiveChannelPress(channel=>selected.push(channel.id),channel=>favorites.push(channel.id),clock);
  return {press,selected,favorites,timers,advance(ms){now+=ms;for(const[id,timer]of[...timers])if(timer.at<=now){timers.delete(id);timer.run();}}};
}
test('SHORT_ENTER_WAITS_FOR_RELEASE_SELECTS_ONCE_AND_SUPPRESSES_DEFAULT_CLICK',()=>{
  const f=fixture();f.press.keyDown(first);assert.deepEqual(f.selected,[]);f.advance(1999);f.press.keyUp(first.id);f.press.click(first);
  assert.deepEqual(f.selected,[first.id]);assert.deepEqual(f.favorites,[]);assert.equal(f.timers.size,0);
});
test('HOLD_2000MS_FAVORITES_INACTIVE_TARGET_ONCE_WITHOUT_SELECTING',()=>{
  const f=fixture();assert.equal(LIVE_FAVORITE_HOLD_MS,2000);f.press.keyDown(second);f.advance(1999);assert.deepEqual(f.favorites,[]);
  f.advance(1);assert.deepEqual(f.favorites,[second.id]);for(let n=0;n<20;n++){f.press.keyDown(second,true);f.advance(200);}
  f.press.keyUp(second.id);f.press.click(second);assert.deepEqual(f.favorites,[second.id]);assert.deepEqual(f.selected,[]);
});
test('REPEAT_NEVER_REARMS_OR_STARTS_HOLD_AND_NEW_PHYSICAL_PRESS_IS_ALLOWED',()=>{
  const f=fixture();f.press.keyDown(first,true);f.advance(3000);assert.deepEqual(f.favorites,[]);
  f.press.keyDown(first);f.advance(2000);f.press.keyUp(first.id);f.press.keyDown(first);f.advance(50);f.press.keyUp(first.id);
  assert.deepEqual(f.favorites,[first.id]);assert.deepEqual(f.selected,[first.id]);
});
test('SHORT_POINTER_TAP_AND_MOUSE_CLICK_KEEP_SELECTION',()=>{
  const f=fixture();f.press.pointerDown(first,1,10,10);f.advance(1999);f.press.pointerUp(1);f.press.click(first);
  f.press.click(second);assert.deepEqual(f.selected,[first.id,second.id]);assert.deepEqual(f.favorites,[]);
});
test('TOUCH_LONG_HOLD_RELEASE_CLICK_CONSUMED_NEW_TAP_WORKS',()=>{
  const f=fixture();f.press.pointerDown(second,2,5,5);f.advance(2000);f.press.click(second);f.press.pointerUp(2);f.press.click(second);
  assert.deepEqual(f.favorites,[second.id]);assert.deepEqual(f.selected,[]);
  f.press.pointerDown(second,3,5,5);f.press.pointerUp(3);f.press.click(second);assert.deepEqual(f.selected,[second.id]);
});
test('SCROLL_MOTION_MORE_THAN_TEN_PX_CANCELS_WITHOUT_TAP_OR_HOLD',()=>{
  const f=fixture();f.press.pointerDown(first,1,0,0);f.press.pointerMove(1,0,10);f.advance(1999);assert.deepEqual(f.favorites,[]);
  f.press.pointerMove(1,0,11);f.advance(20);f.press.pointerUp(1);f.press.click(first);assert.deepEqual(f.favorites,[]);assert.deepEqual(f.selected,[]);assert.equal(f.timers.size,0);
});
test('POINTER_CANCEL_BLUR_VISIBILITY_UNMOUNT_CANCEL_PENDING_TIMER',()=>{
  for(const input of ['key','pointer']){const f=fixture();if(input==='key')f.press.keyDown(first);else f.press.pointerDown(first,1,0,0);
    f.advance(1500);f.press.cancel(first.id);f.advance(2000);f.press.keyUp(first.id);f.press.pointerUp(1);assert.deepEqual(f.favorites,[]);assert.deepEqual(f.selected,[]);assert.equal(f.timers.size,0);}
});
test('OLD_ROW_BLUR_AND_OTHER_POINTER_CANNOT_CANCEL_NEW_ROW_GESTURE',()=>{
  const f=fixture();f.press.pointerDown(first,1,0,0);f.advance(1000);f.press.pointerDown(second,2,0,0);f.press.cancel(first.id);f.press.pointerMove(1,100,100);f.press.pointerUp(1);
  f.advance(1999);assert.deepEqual(f.favorites,[]);f.advance(1);assert.deepEqual(f.favorites,[second.id]);assert.deepEqual(f.selected,[]);
});
test('DUPLICATE_NON_REPEAT_DOWN_SAME_KEY_DOES_NOT_RESET_TIMER',()=>{
  const f=fixture();f.press.keyDown(first);f.advance(1500);f.press.keyDown(first);f.advance(500);assert.deepEqual(f.favorites,[first.id]);
  f.press.cancel();f.advance(2000);assert.deepEqual(f.favorites,[first.id]);
});
test('CONFIRM_KEYS_AND_ARROW_KEYS_ARE_DISTINCT',()=>{
  for(const event of [{key:'Enter'},{key:' '},{key:'Unidentified',keyCode:23},{key:'Unidentified',keyCode:13},{key:'Unidentified',code:'NumpadEnter'}])assert.ok(isLiveConfirmKey(event));
  for(const key of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Escape','Tab'])assert.equal(isLiveConfirmKey({key}),false);
});
console.log('C124_LIVE_FAVORITE_GESTURES='+tests+'/PASS');
