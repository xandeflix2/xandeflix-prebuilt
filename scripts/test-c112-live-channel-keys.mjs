import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Execute the real Java dispatch/emit method bodies with controlled input/view
// adapters. This tests event routing, not Android hardware or provider playback.
const dir='tmp/c112-live-channel-keys/harness';fs.mkdirSync(dir,{recursive:true});
const source=name=>fs.readFileSync('android/app/src/main/java/com/xandeflix/prebuilt/'+name,'utf8');
const controls=source('player/LivePlayerControls.java'),plugin=source('player/NativeAndroidPlayerPlugin.java'),activity=source('MainActivity.java');
function method(text,signature){const start=text.indexOf(signature);assert.ok(start>=0,signature);let end=text.indexOf('{',start),depth=1;while(depth&&++end<text.length){if(text[end]==='{')depth++;else if(text[end]==='}')depth--;}assert.equal(depth,0);return text.slice(start,end+1);}
const sdk='C:/Users/Alexandre/AppData/Local/Android/Sdk/platforms/android-35/android.jar';
const constants=execFileSync('javap',['-constants','-classpath',sdk,'android.view.KeyEvent'],{encoding:'utf8'});
const names=['ACTION_DOWN','ACTION_UP','KEYCODE_UNKNOWN','KEYCODE_CHANNEL_UP','KEYCODE_CHANNEL_DOWN','KEYCODE_DPAD_CENTER','KEYCODE_ENTER','KEYCODE_DPAD_UP','KEYCODE_DPAD_DOWN','KEYCODE_DPAD_LEFT','KEYCODE_DPAD_RIGHT','KEYCODE_BACK','KEYCODE_MEDIA_NEXT'];
const fields=names.map(name=>{const value=constants.match(new RegExp('int '+name+' = (\\d+);'))?.[1];assert.ok(value,name);return 'public static final int '+name+'='+value+';';}).join('\n');
fs.mkdirSync(dir+'/android/view',{recursive:true});fs.writeFileSync(dir+'/android/view/KeyEvent.java',`package android.view;public class KeyEvent{${fields}private final int action,key,repeat;public KeyEvent(int action,int key,int repeat){this.action=action;this.key=key;this.repeat=repeat;}public int getAction(){return action;}public int getKeyCode(){return key;}public int getRepeatCount(){return repeat;}}`);
fs.mkdirSync(dir+'/androidx/media3/ui',{recursive:true});fs.writeFileSync(dir+'/androidx/media3/ui/R.java','package androidx.media3.ui;public class R{public static class id{public static final int exo_play_pause=1;}}');
const code=`import android.view.KeyEvent;import java.util.*;
public class C112KeyDispatchHarness {
 interface Action{void accept(String action,String id,String channelId);}
 static class Context{boolean busy;boolean optBoolean(String key){return busy;}String optString(String key){return "live:fixture";}}
 static class Player{float volume=.5f;float getVolume(){return volume;}void setVolume(float value){volume=value;}}
 static class Toast{static final int LENGTH_SHORT=0;static int shown,cancelled;static Toast makeText(Object activity,String message,int duration){check(message.startsWith("Volume do app:"),"VOLUME_MESSAGE");return new Toast();}void show(){shown++;}void cancel(){cancelled++;}}
 static class View{boolean visible=true,focused=true;int shown,focusRequests;Player player=new Player();Player getPlayer(){return player;}boolean isControllerFullyVisible(){return visible;}boolean hasFocus(){return focused;}void showController(){shown++;visible=true;}View findViewById(int id){return this;}void requestFocus(){focusRequests++;}}
 static class LivePlayerControls{Object dialog,activity;boolean disposing,fullscreen;int shortcutKey=KeyEvent.KEYCODE_UNKNOWN;Toast volumeToast;Context context=new Context();View view=new View();List<String> events=new ArrayList<>();Action action=(a,i,c)->{check(i==null&&"live:fixture".equals(c),"OPAQUE_CONTEXT_ONLY");events.add(a);};
 ${method(controls,'static boolean isChannelKey(')}
 ${method(controls,'private void emit(')}
 ${method(controls,'private void adjustVolume(')}
 ${method(controls,'boolean dispatchKey(')}
 }
 static class NativeAndroidPlayerPlugin{boolean isPreviewActive=true,previewFullscreen,previewInPip;LivePlayerControls liveControls=new LivePlayerControls();
 ${method(plugin,'public boolean dispatchLiveKey(')}
 ${method(plugin,'static boolean shouldDispatchLiveKey(')}
 }
 static class ActivityBase{int defaults;public boolean dispatchKeyEvent(KeyEvent event){defaults++;return false;}}
 static class MainActivity extends ActivityBase{NativeAndroidPlayerPlugin plugin=new NativeAndroidPlayerPlugin();NativeAndroidPlayerPlugin nativePlayerPlugin(){return plugin;}
 ${method(activity,'public boolean dispatchKeyEvent(')}
 }
 static void check(boolean v,String name){if(!v)throw new AssertionError(name);}
 static KeyEvent key(int code,int action,int repeat){return new KeyEvent(action,code,repeat);}
 public static void main(String[]args){
  MainActivity a=new MainActivity();LivePlayerControls c=a.plugin.liveControls;
  check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,0)),"INLINE_CH_UP");
  for(int n=1;n<8;n++)check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,n)),"CONSUME_REPEAT");
  check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_UP,0)),"CONSUME_UP");
  check(c.events.equals(Arrays.asList("next")),"ONE_NEXT_PER_PRESS");
  check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_DOWN,KeyEvent.ACTION_DOWN,0)),"INLINE_CH_DOWN");
  check(c.events.equals(Arrays.asList("next","previous")),"DOWN_IS_PREVIOUS");
  a.plugin.previewFullscreen=true;
  check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,0)),"FULLSCREEN_CH");check(c.events.size()==3,"FULLSCREEN_ONE_ACTION");
  c.context.busy=true;check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_DOWN,KeyEvent.ACTION_DOWN,0)),"BUSY_CONSUMES");check(c.events.size()==3,"BUSY_NO_EMISSION");c.context.busy=false;
  c.disposing=true;a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,0));check(c.events.size()==3,"DISPOSED_NO_EMISSION");c.disposing=false;
  c.dialog=new Object();check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,0)),"DIALOG_KEEPS_KEYS");check(c.events.size()==3,"DIALOG_NO_CHANNEL_CHANGE");c.dialog=null;
  a.plugin.previewInPip=true;check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,0)),"PIP_EXCLUDED");a.plugin.previewInPip=false;
  a.plugin.isPreviewActive=false;check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,0)),"INACTIVE_EXCLUDED");a.plugin.isPreviewActive=true;
  a.plugin.previewFullscreen=false;c.view.visible=false;c.view.focused=false;
  check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_DOWN,0)),"INLINE_DPAD_NOT_STOLEN");check(c.view.shown==0,"INLINE_FOCUS_UNCHANGED");
  a.plugin.previewFullscreen=true;c.fullscreen=true;
  check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_LEFT,KeyEvent.ACTION_DOWN,0)),"HIDDEN_LEFT_PREVIOUS");c.view.visible=true;
  a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_LEFT,KeyEvent.ACTION_DOWN,1));a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_LEFT,KeyEvent.ACTION_UP,0));
  check(c.events.size()==4&&c.events.get(3).equals("previous"),"LEFT_ONCE_EVEN_IF_CONTROLS_APPEAR");c.view.visible=false;
  a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_RIGHT,KeyEvent.ACTION_DOWN,0));a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_RIGHT,KeyEvent.ACTION_UP,0));check(c.events.size()==5&&c.events.get(4).equals("next"),"RIGHT_NEXT");
  a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_DOWN,0));a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_DOWN,1));a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_UP,0));check(Math.abs(c.view.player.volume-.55f)<.0001,"UP_VOLUME_ONCE");
  a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_DOWN,KeyEvent.ACTION_DOWN,0));a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_DOWN,KeyEvent.ACTION_UP,0));check(Math.abs(c.view.player.volume-.5f)<.0001,"DOWN_VOLUME");check(c.view.shown==0,"VOLUME_NEVER_OPENS_MENU");
  c.view.player.volume=1f;a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_DOWN,0));a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_UP,0));check(c.view.player.volume==1f,"VOLUME_MAX");
  c.view.player.volume=0f;a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_DOWN,KeyEvent.ACTION_DOWN,0));a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_DOWN,KeyEvent.ACTION_UP,0));check(c.view.player.volume==0f,"VOLUME_MIN");
  c.context.busy=true;a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_DOWN,0));a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_UP,0));check(c.view.player.volume==0f,"BUSY_VOLUME_UNCHANGED");c.context.busy=false;
  Player kept=c.view.player;c.view.player=null;check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_DOWN,0)),"MISSING_PLAYER_SAFE");a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_UP,KeyEvent.ACTION_UP,0));c.view.player=kept;
  c.view.visible=true;c.view.focused=true;check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_RIGHT,KeyEvent.ACTION_DOWN,0)),"MENU_ARROWS_KEEP_NAVIGATION");
  c.view.visible=false;c.view.focused=false;check(a.dispatchKeyEvent(key(KeyEvent.KEYCODE_DPAD_CENTER,KeyEvent.ACTION_DOWN,0)),"CENTER_REVEALS_CONTROLS");check(c.view.shown==1&&c.view.focusRequests==1,"CENTER_FOCUS");check(Toast.shown>0&&Toast.cancelled==Toast.shown-1,"ONE_TRANSIENT_VOLUME_OSD");
  check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_BACK,KeyEvent.ACTION_DOWN,0)),"BACK_UNCHANGED");check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_MEDIA_NEXT,KeyEvent.ACTION_DOWN,0)),"VOD_MEDIA_NEXT_UNCHANGED");
  a.plugin.liveControls=null;check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,0)),"NO_LIVE_CONTROLS");a.plugin=null;check(!a.dispatchKeyEvent(key(KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.ACTION_DOWN,0)),"NO_PLUGIN");
  check(c.events.size()==5,"NO_UNINTENDED_CHANNEL_ACTIONS");System.out.println("PASS_ACTUAL_JAVA_DISPATCH_CH_KEYS_FULLSCREEN_ARROWS_VOLUME_MENU_CENTER_REPEAT_BUSY_DIALOG_PIP_INACTIVE_BACK_VOD");
 }
}`;
fs.writeFileSync(dir+'/C112KeyDispatchHarness.java',code);
execFileSync('javac',['-encoding','UTF-8','-d',path.resolve(dir),dir+'/android/view/KeyEvent.java',dir+'/androidx/media3/ui/R.java',dir+'/C112KeyDispatchHarness.java'],{encoding:'utf8'});
console.log(execFileSync('java',['-cp',path.resolve(dir),'C112KeyDispatchHarness'],{encoding:'utf8'}).trim());
fs.writeFileSync('tmp/c112-live-channel-keys/dispatch-tests.json',JSON.stringify({result:'PASS',realJavaMethodBodies:true,realSdkKeyCodes:true,androidViewAndInputAdaptersMocked:true,providerOrHardwareValidated:false,networkRequests:0},null,2));
