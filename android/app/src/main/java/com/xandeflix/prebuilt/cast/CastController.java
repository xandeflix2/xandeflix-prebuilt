package com.xandeflix.prebuilt.cast;

import android.content.Context;
import android.content.res.Configuration;
import android.net.*;
import android.os.*;
import androidx.fragment.app.FragmentActivity;
import androidx.mediarouter.app.MediaRouteChooserDialogFragment;
import androidx.mediarouter.app.MediaRouteControllerDialogFragment;
import com.google.android.gms.cast.*;
import com.google.android.gms.cast.framework.*;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.xandeflix.prebuilt.player.NativeStreamRequest;
import java.net.*;
import java.util.function.*;

/** Lazy sender; receiver gets only an opaque authorized LAN URI. */
public final class CastController implements SessionManagerListener<CastSession> {
    private static final CastController INSTANCE=new CastController();
    public static CastController get(){return INSTANCE;}
    private final Handler main=new Handler(Looper.getMainLooper());
    private CastContext context;
    private Context applicationContext;
    private LocalCastRelay relay;
    private NativeStreamRequest source;
    private String title,kind;
    private String playbackId;
    private final Runnable watchProbe=new Runnable(){@Override public void run(){if(casting){emitWatchProgress(false);main.postDelayed(this,5000);}}};
    private void emitWatchProgress(boolean ended){if(remote!=null && !"live".equals(kind))com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin.notifyPlaybackProgress(playbackId,remote.getApproximateStreamPosition(),remote.getStreamDuration(),ended);}
    private LongSupplier position;
    private Runnable pause;
    private LongConsumer resume;
    private Consumer<Boolean> observer;
    private boolean casting,loading;
    private volatile boolean connected;
    private long generation;
    private Consumer<String> loadingFailure;
    private RemoteMediaClient remote;
    private RemoteMediaClient.Callback remoteObserver;
    public static boolean mobile(Context context){return (context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_TYPE_MASK)!=Configuration.UI_MODE_TYPE_TELEVISION;}
    public void observe(Consumer<Boolean> listener){observer=listener;}
    private void publish(boolean active){casting=active;main.removeCallbacks(watchProbe);if(active)main.postDelayed(watchProbe,5000);if(observer!=null)observer.accept(active);}
    private CastContext context(Context application) {
        if(!mobile(application))throw new IllegalStateException("CAST_NOT_MOBILE");
        if(context==null){applicationContext=application.getApplicationContext();context=CastContext.getSharedInstance(applicationContext);context.getSessionManager().addSessionManagerListener(this,CastSession.class);}
        return context;
    }
    public boolean connected(){return connected;}
    public boolean active(){return casting;}
    public void picker(FragmentActivity activity) {
        try {
            CastContext cast=context(activity.getApplicationContext());
            if(connected()) {MediaRouteControllerDialogFragment dialog=new MediaRouteControllerDialogFragment();dialog.show(activity.getSupportFragmentManager(),"cast-control");}
            else {MediaRouteChooserDialogFragment dialog=new MediaRouteChooserDialogFragment();dialog.setRouteSelector(cast.getMergedSelector());dialog.show(activity.getSupportFragmentManager(),"cast-choose");}
        }catch(Exception ignored){android.widget.Toast.makeText(activity,"Google Cast indisponível neste dispositivo.",android.widget.Toast.LENGTH_LONG).show();}
    }
    public void attach(Context application,NativeStreamRequest request,String title,String kind,String playbackId,LongSupplier position,Runnable pause,LongConsumer resume) {
        stop(false);this.source=request;this.title=title;this.kind=kind;this.playbackId=playbackId;this.position=position;this.pause=pause;this.resume=resume;
        if(connected())start(application,()->{},code->android.widget.Toast.makeText(application,message(code),android.widget.Toast.LENGTH_LONG).show());
    }
    public void detach(NativeStreamRequest request){if(source==request){stop(false);source=null;position=null;pause=null;resume=null;}}
    public void startStandalone(Context application,NativeStreamRequest request,String title,String kind,String playbackId,long position,Runnable accepted,Consumer<String> failed) {
        stop(false);source=request;this.title=title;this.kind=kind;this.playbackId=playbackId;this.position=()->position;pause=()->{};
        resume=ms->{
            android.content.Intent intent=new android.content.Intent(application,com.xandeflix.prebuilt.player.NativePlayerActivity.class);
            intent.putExtra(com.xandeflix.prebuilt.player.PlaybackIntentContract.EXTRA_URI,request.getMediaUrl());
            intent.putExtra(com.xandeflix.prebuilt.player.PlaybackIntentContract.EXTRA_TITLE,title);
            intent.putExtra("kind",kind);intent.putExtra(com.xandeflix.prebuilt.player.PlaybackIntentContract.EXTRA_START_POSITION_MS,ms);
            if(com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin.validPlaybackId(playbackId))intent.putExtra("watchPlaybackId",playbackId);
            intent.putStringArrayListExtra(com.xandeflix.prebuilt.player.PlaybackIntentContract.EXTRA_HEADERS_KEYS,new java.util.ArrayList<>(request.getRequestHeaders().keySet()));
            intent.putStringArrayListExtra(com.xandeflix.prebuilt.player.PlaybackIntentContract.EXTRA_HEADERS_VALUES,new java.util.ArrayList<>(request.getRequestHeaders().values()));
            if(!(application instanceof android.app.Activity))intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            try{application.startActivity(intent);}catch(RuntimeException ignored){com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin.notifyPlaybackTerminal(ms,false,"NATIVE_ERROR");}
        };
        start(application,accepted,failed);
    }
    private static String mime(NativeStreamRequest request) {
        String path;try{path=new URI(request.getMediaUrl()).getPath().toLowerCase(java.util.Locale.ROOT);}catch(Exception ignored){return null;}
        if(path.endsWith(".m3u8"))return "application/vnd.apple.mpegurl";
        if(path.endsWith(".mp4") || path.endsWith(".m4v"))return "video/mp4";
        if(path.endsWith(".webm"))return "video/webm";return null;
    }
    public static String message(String code){return "CAST_UNSUPPORTED_MEDIA".equals(code) ? "Este formato não pode ser transmitido pelo Google Cast. Use a reprodução no aparelho." : "Não foi possível transmitir. Confira a TV e a rede Wi-Fi.";}
    public static java.util.Map<String,String> relayHeaders(NativeStreamRequest request) {
        java.util.Map<String,String> headers=new java.util.LinkedHashMap<>(request.getRequestHeaders());
        headers.put("User-Agent",request.getUserAgent());
        return headers;
    }
    private void start(Context application,Runnable accepted,Consumer<String> failed) {
        if(loading)return;
        if(source==null || !connected()){failed.accept("CAST_NOT_CONNECTED");return;}
        String type=mime(source);if(type==null){failed.accept("CAST_UNSUPPORTED_MEDIA");return;}
        try {
            CastSession session=context.getSessionManager().getCurrentCastSession();
            ConnectivityManager network=(ConnectivityManager)application.getSystemService(Context.CONNECTIVITY_SERVICE);
            LinkProperties links=network.getLinkProperties(network.getActiveNetwork());InetAddress local=null;
            if(links!=null)for(LinkAddress address:links.getLinkAddresses())if(address.getAddress() instanceof Inet4Address && address.getAddress().isSiteLocalAddress()){local=address.getAddress();break;}
            InetAddress receiver=session.getCastDevice().getInetAddress();
            if(local==null || !(receiver instanceof Inet4Address) || !receiver.isSiteLocalAddress())throw new IllegalStateException("CAST_WIFI_REQUIRED");
            boolean debug=(application.getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0;
            if(debug){NetworkCapabilities capabilities=network.getNetworkCapabilities(network.getActiveNetwork());android.util.Log.i("CastTransport","CAST_NETWORK wifi="+(capabilities!=null && capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI))+" cellular="+(capabilities!=null && capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR))+" vpn="+(capabilities!=null && capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)));}
            relay=new LocalCastRelay(local,receiver,relayHeaders(source),120_000,()->main.post(()->{
                clear();com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin.terminateCastPlayback(false,"CAST_LEASE_EXPIRED");
            }),debug ? event->android.util.Log.i("CastTransport",event) : null);
            String uri=relay.route(new URL(source.getMediaUrl()));
            MediaMetadata metadata=new MediaMetadata("live".equals(kind) ? MediaMetadata.MEDIA_TYPE_GENERIC : MediaMetadata.MEDIA_TYPE_MOVIE);
            metadata.putString(MediaMetadata.KEY_TITLE,title!=null ? title : "Xandeflix");
            MediaInfo info=new MediaInfo.Builder(uri).setContentType(type).setStreamType("live".equals(kind) ? MediaInfo.STREAM_TYPE_LIVE : MediaInfo.STREAM_TYPE_BUFFERED).setMetadata(metadata).build();
            long ticket=++generation;loading=true;loadingFailure=failed;
            RemoteMediaClient client=session.getRemoteMediaClient();
            remote=client;remoteObserver=new RemoteMediaClient.Callback(){
                @Override public void onStatusUpdated(){
                    MediaStatus status=client.getMediaStatus();
                    if(casting && status!=null && status.getPlayerState()==MediaStatus.PLAYER_STATE_IDLE
                            && (status.getIdleReason()==MediaStatus.IDLE_REASON_FINISHED || status.getIdleReason()==MediaStatus.IDLE_REASON_ERROR)) {
                        long at=client.getApproximateStreamPosition();boolean ended=status.getIdleReason()==MediaStatus.IDLE_REASON_FINISHED;
                        emitWatchProgress(ended);
                        clear();com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin.terminateCastPlayback(ended,ended ? null : "CAST_MEDIA_ERROR");
                    }
                }
            };client.registerCallback(remoteObserver);
            client.load(new MediaLoadRequestData.Builder().setMediaInfo(info).setAutoplay(true).setCurrentTime(Math.max(0,position.getAsLong())).build()).setResultCallback(result->{
                if(ticket!=generation)return;loading=false;loadingFailure=null;
                if(result.getStatus().isSuccess()){pause.run();publish(true);accepted.run();}
                else {stop(false);failed.accept("CAST_LOAD_FAILED");}
            });
            main.postDelayed(()->{if(loading && ticket==generation){loadingFailure=null;loading=false;stop(false);failed.accept("CAST_LOAD_TIMEOUT");}},30000);
        }catch(Exception error){loadingFailure=null;loading=false;stop(false);failed.accept(CastFailurePolicy.loadExceptionCode(error));}
    }
    public void renew(){if(relay!=null)relay.renew();}
    public void stop(boolean returnLocal) {
        emitWatchProgress(false);
        Consumer<String> cancelled=loading ? loadingFailure : null;loadingFailure=null;
        generation++;loading=false;long at=position!=null ? position.getAsLong() : 0;
        if(remote!=null && remoteObserver!=null)remote.unregisterCallback(remoteObserver);remote=null;remoteObserver=null;
        if(context!=null){CastSession session=context.getSessionManager().getCurrentCastSession();if(session!=null && session.getRemoteMediaClient()!=null && (relay!=null || casting)){at=session.getRemoteMediaClient().getApproximateStreamPosition();session.getRemoteMediaClient().stop();}}
        if(relay!=null){relay.close();relay=null;}boolean was=casting;publish(false);
        if(returnLocal && was && resume!=null)resume.accept(Math.max(0,at));
        if(cancelled!=null)cancelled.accept("CAST_LOAD_CANCELLED");
    }
    public void clear(){stop(false);source=null;position=null;pause=null;resume=null;}
    public void returnLocal(){
        // Disconnect first so resumed local Activity does not route back to Cast.
        LongConsumer callback=resume;long at=remote!=null ? remote.getApproximateStreamPosition() : position!=null ? position.getAsLong() : 0;boolean was=casting;
        connected=false;stop(false);if(context!=null)context.getSessionManager().endCurrentSession(true);
        if(was && callback!=null)callback.accept(Math.max(0,at));
    }
    @Override public void onSessionStarted(CastSession s,String id){connected=true;if(source!=null)start(applicationContext,()->{},code->android.widget.Toast.makeText(applicationContext,message(code),android.widget.Toast.LENGTH_LONG).show());}
    @Override public void onSessionEnded(CastSession s,int error){connected=false;stop(true);}
    @Override public void onSessionSuspended(CastSession s,int reason){connected=false;stop(true);}
    @Override public void onSessionResumed(CastSession s,boolean suspended){connected=true;}
    @Override public void onSessionStarting(CastSession s){}
    @Override public void onSessionStartFailed(CastSession s,int error){connected=false;stop(true);}
    @Override public void onSessionEnding(CastSession s){connected=false;stop(true);}
    @Override public void onSessionResuming(CastSession s,String id){}
    @Override public void onSessionResumeFailed(CastSession s,int error){connected=false;stop(true);}
    public android.widget.ImageButton button(FragmentActivity activity) {
        android.widget.ImageButton button=new android.widget.ImageButton(activity);
        button.setImageDrawable(androidx.core.content.ContextCompat.getDrawable(activity,com.xandeflix.prebuilt.R.drawable.ic_cast));
        button.setContentDescription("Transmitir pelo Google Cast");button.setBackgroundColor(0xAA121826);
        button.setOnClickListener(v->picker(activity));return button;
    }
}
