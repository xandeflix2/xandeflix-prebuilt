import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parentalStorage } from '../src/parental/parental-storage.ts';
import { parentalControl } from '../src/parental/parental-control.store.ts';

// The older continuity fixture predates parental storage. Supply an isolated,
// empty local store; production parental/C9 checks and all assertions stay intact.
parentalStorage.read = async () => null;
parentalStorage.write = async () => { throw Error('FIXTURE_UNEXPECTED_WRITE'); };
await parentalControl.load();
assert.equal(parentalControl.getSnapshot().status, 'unconfigured');
await import('./test-c11-series-player-continuity.mjs');

const root = 'android/app/src/main/java/com/xandeflix/prebuilt/player/';
const source = name => fs.readFileSync(root + name + '.java', 'utf8');
const activity = source('NativePlayerActivity'), controls = source('PlayerControls'), live = source('LivePlayerControls'), plugin = source('NativeAndroidPlayerPlugin');
const method = (text, signature) => {
  const start = text.indexOf(signature); assert.ok(start >= 0, signature);
  let end = text.indexOf('{', start), depth = 1;
  while (depth && ++end < text.length) { if (text[end] === '{') depth++; else if (text[end] === '}') depth--; }
  assert.equal(depth, 0); return text.slice(start, end + 1).replaceAll('@Nullable ', '');
};
const dir = 'tmp/c161-live-fullscreen/navigation-harness'; fs.mkdirSync(dir, { recursive: true });
const write = (name, text) => { const file = path.join(dir, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); return file; };
const constants = execFileSync('javap', ['-constants', '-classpath', 'C:/Users/Alexandre/AppData/Local/Android/Sdk/platforms/android-35/android.jar', 'android.view.KeyEvent'], { encoding: 'utf8' });
const keys = ['ACTION_DOWN','ACTION_UP','KEYCODE_MEDIA_PLAY','KEYCODE_MEDIA_PAUSE','KEYCODE_MEDIA_PLAY_PAUSE','KEYCODE_MEDIA_FAST_FORWARD','KEYCODE_MEDIA_REWIND','KEYCODE_MEDIA_NEXT','KEYCODE_DPAD_LEFT','KEYCODE_DPAD_RIGHT','KEYCODE_DPAD_UP','KEYCODE_DPAD_DOWN','KEYCODE_DPAD_CENTER','KEYCODE_ENTER','KEYCODE_NUMPAD_ENTER'];
const fields = keys.map(name => { const n = constants.match(new RegExp('int ' + name + ' = (\\d+);'))?.[1]; assert.ok(n); return 'public static final int ' + name + '=' + n + ';'; }).join('');
const files = [write('android/view/KeyEvent.java', `package android.view;public class KeyEvent{${fields}int key,action;public KeyEvent(int action,int key){this.action=action;this.key=key;}public int getKeyCode(){return key;}public int getAction(){return action;}}`),
  write('android/os/SystemClock.java', 'package android.os;public class SystemClock{public static long uptimeMillis(){return 1;}}'),
  write('android/util/Log.java', 'package android.util;public class Log{public static int i(String tag,String message){return 0;}}'),
  write('androidx/media3/ui/R.java', 'package androidx.media3.ui;public class R{public static class id{public static final int exo_play_pause=2;}}'),
  write('com/xandeflix/prebuilt/player/EpisodeNavigationState.java', source('EpisodeNavigationState'))];
const binding = controls.match(/view\.findViewById\(R\.id\.player_next\)\.setOnClickListener\(v -> next\.run\(\)\);/)?.[0]; assert.ok(binding);
const liveBinding = live.match(/bindAction\(R\.id\.live_next,"next"\);/)?.[0]; assert.ok(liveBinding);
files.push(write('C161NavigationHarness.java', `
import java.util.*;import android.view.KeyEvent;import android.util.Log;import com.xandeflix.prebuilt.player.EpisodeNavigationState;
public class C161NavigationHarness {
 static class R{static class id{static final int player_next=1,live_next=3;}}
 interface Click{void accept(View v);}
 static class View{Map<Integer,View> children=new HashMap<>();Click click;boolean visible=true;View focused=this;
  View findViewById(int id){return children.computeIfAbsent(id,k->new View());}void setOnClickListener(Click c){click=c;}void performClick(){if(click!=null)click.accept(this);}
  boolean isControllerFullyVisible(){return visible;}void showController(){visible=true;}void requestFocus(){} }
 static class JSONObject{boolean hasNext=true,busy;String channelId="live1";boolean optBoolean(String name,boolean fallback){return hasNext;}boolean optBoolean(String name){return busy;}String optString(String name){return channelId;}JSONArray optJSONArray(String name){return null;}}
 static class JSONArray{int length(){return 0;}JSONObject optJSONObject(int i){return null;}}
 static class JSObject extends HashMap<String,Object>{}
 static class PlayerControls{JSONObject episodes;boolean pending,closed;PlayerControls(View view,Runnable next,JSONObject context){episodes=context;${binding}}
  ${method(controls,'boolean hasNext(')}
  ${method(controls,'boolean containsEpisode(')}
  void close(){closed=true;}void setTransitioning(boolean p){pending=p;}boolean dialogOpen(){return false;}boolean locked(){return false;}}
 static class Player{int pauses;void pause(){pauses++;}}
 static class Handler{Runnable timeout;long delay;void postDelayed(Runnable r,long ms){timeout=r;delay=ms;}}
 static class Base{View baseView;public boolean dispatchKeyEvent(KeyEvent event){if(event.getAction()==KeyEvent.ACTION_UP&&(event.getKeyCode()==KeyEvent.KEYCODE_DPAD_CENTER||event.getKeyCode()==KeyEvent.KEYCODE_ENTER)){baseView.focused.performClick();return true;}return false;}}
 static class NativePlayerActivity extends Base{static final String TAG="fixture";PlayerControls controls;boolean wasCasting,finishing;String currentKind="series",watchPlaybackId="watch1";JSONObject episodeContext=new JSONObject();EpisodeNavigationState episodeNavigation=new EpisodeNavigationState();Player player=new Player();View playerView=new View();Handler observabilityHandler=new Handler();Runnable episodeTimeout;int progress;boolean lastEnded;
  NativePlayerActivity(){baseView=playerView;episodeNavigation.started(watchPlaybackId);controls=new PlayerControls(playerView,()->requestEpisode("next",null),episodeContext);playerView.focused=playerView.findViewById(R.id.player_next);}
  boolean isFinishing(){return finishing;}void emitWatchProgress(boolean ended){progress++;lastEnded=ended;}void failEpisodeTransition(){}boolean handleDpadKey(int k,int a,String kind){return false;}
  ${method(activity,'private boolean requestEpisode(')}
  ${method(activity,'public boolean dispatchKeyEvent(')}
 }
 static class NativeAndroidPlayerPlugin{static NativeAndroidPlayerPlugin activePlugin=new NativeAndroidPlayerPlugin();List<JSObject> events=new ArrayList<>();boolean hasListeners(String name){return true;}void notifyListeners(String name,JSObject data){check(name.equals("episodeNavigation"),"EVENT_NAME");events.add(data);}
  ${method(plugin,'public static boolean validPlaybackId(')}
  ${method(plugin,'public static void notifyEpisodeNavigation(')}
 }
 interface Action{void accept(String action,String id,String channel);}
 static class LivePlayerControls{View view=new View();boolean disposing;JSONObject context=new JSONObject();List<String> events=new ArrayList<>();Action action=(a,i,c)->{check(i==null&&c.equals("live1"),"LIVE_CORRELATION");events.add(a);};LivePlayerControls(){${liveBinding}}
  ${method(live,'private void bindAction(')}
  ${method(live,'private void emit(')}
 }
 static void check(boolean v,String name){if(!v)throw new AssertionError(name);}
 static List<JSObject> events(){return NativeAndroidPlayerPlugin.activePlugin.events;}
 public static void main(String[] args){
  NativePlayerActivity a=new NativePlayerActivity();a.playerView.focused.performClick();
  check(events().size()==1&&a.controls.pending&&a.player.pauses==1&&a.controls.closed,"TOUCH_NEXT_REACHES_NATIVE_REQUEST");
  JSObject event=events().get(0);check(event.get("playbackId").equals("watch1")&&event.get("reason").equals("next")&&!event.containsKey("episodeId"),"EXACT_NEXT_EVENT");
  check(a.episodeNavigation.accepts("watch1",(String)event.get("requestId")),"TOKEN_MATCHES_NATIVE_PENDING");check(a.progress==1&&!a.lastEnded&&a.observabilityHandler.delay==30000,"SAVE_MANUAL_POSITION_AND_TIMEOUT");
  a.playerView.focused.performClick();check(events().size()==1,"DOUBLE_CLICK_ONE_TRANSITION");
  a.watchPlaybackId="watch2";a.episodeNavigation.started("watch2");a.controls.setTransitioning(false);
  a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_DPAD_CENTER));a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_DPAD_CENTER));
  check(events().size()==2&&events().get(1).get("playbackId").equals("watch2"),"FIRE_DPAD_CONFIRM_REACHES_BUTTON_NEXT");
  a.episodeNavigation.started("watch2");a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_MEDIA_NEXT));a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_MEDIA_NEXT));check(events().size()==3,"MEDIA_NEXT_ONE_REQUEST");
  for(int i=0;i<6;i++){NativePlayerActivity blocked=new NativePlayerActivity();if(i==0)blocked.wasCasting=true;if(i==1)blocked.currentKind="movie";if(i==2)blocked.episodeContext=null;if(i==3)blocked.episodeContext.hasNext=false;if(i==4)blocked.finishing=true;if(i==5)blocked.watchPlaybackId="https://invalid";blocked.playerView.focused.performClick();check(events().size()==3,"INVALID_CONTEXT_NEVER_ADVANCES_"+i);}
  LivePlayerControls c=new LivePlayerControls();c.view.findViewById(R.id.live_next).performClick();check(c.events.equals(Arrays.asList("next")),"LIVE_NEXT_BUTTON_BINDS_NEXT");c.context.busy=true;c.view.findViewById(R.id.live_next).performClick();c.context.busy=false;c.disposing=true;c.view.findViewById(R.id.live_next).performClick();check(c.events.size()==1,"LIVE_BUSY_DISPOSED_NO_NEXT");
  System.out.println("PASS_ACTUAL_NATIVE_NEXT_BUTTONS_DPAD_MEDIA_IPC_TOKEN_DUPLICATE_FINAL_CAST_BUSY_DISPOSAL");
 }
}`));
execFileSync('javac', ['-encoding','UTF-8','-d',path.resolve(dir), ...files], { encoding:'utf8' });
console.log(execFileSync('java', ['-cp',path.resolve(dir),'C161NavigationHarness'], { encoding:'utf8' }).trim());
console.log('PASS_C161_REAL_SERVICE_AND_NATIVE_METHODS_SYNTHETIC_IO_NO_PHYSICAL_DEVICE_CLAIM');
