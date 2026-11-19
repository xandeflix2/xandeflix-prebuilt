package com.xandeflix.prebuilt.intro;

import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.content.res.AssetFileDescriptor;
import android.graphics.Color;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import androidx.activity.OnBackPressedCallback;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.datasource.RawResourceDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.ExoPlaybackException;
import androidx.media3.exoplayer.source.ProgressiveMediaSource;
import androidx.media3.ui.AspectRatioFrameLayout;
import androidx.media3.ui.PlayerView;
import com.xandeflix.prebuilt.MainActivity;
import com.xandeflix.prebuilt.R;

/** Owns only local intro media. Never receives a source URI or catalog player. */
public final class AppIntroController {
    private static final String TAG = "XF_INTRO07";
    private final MainActivity activity;
    private final AppIntroPolicy.Session session;
    private final Runnable completed;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final AppIntroPolicy.KeyBarrier keys = new AppIntroPolicy.KeyBarrier();
    private FrameLayout overlay;
    private ImageView still;
    private PlayerView view;
    private ExoPlayer player;
    private AudioManager audio;
    private AudioFocusRequest focusRequest;
    private boolean focusHeld, delivered, resumed, scheduled;
    private long startedAt;
    private OnBackPressedCallback back;
    private final Runnable firstFrameDeadline = () -> finish(AppIntroPolicy.Reason.FIRST_FRAME_TIMEOUT, true);
    private final Runnable totalDeadline = () -> finish(AppIntroPolicy.Reason.TOTAL_TIMEOUT, true);
    private final Runnable begin = this::prepare;
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {
        if (change != AudioManager.AUDIOFOCUS_GAIN) {
            silence();
            releaseFocus();
            Log.i(TAG, "AUDIO_SILENT_FOCUS_CHANGE");
        }
    };

    public AppIntroController(MainActivity activity, AppIntroPolicy.Session session, Runnable completed) {
        this.activity = activity; this.session = session; this.completed = completed;
    }
    public void attach() {
        try {
            ViewGroup root = activity.findViewById(android.R.id.content);
            if (root == null) { finish(AppIntroPolicy.Reason.SURFACE_UNAVAILABLE, false); return; }
            overlay = (FrameLayout) activity.getLayoutInflater().inflate(R.layout.app_intro, root, false);
            still = overlay.findViewById(R.id.intro_still);
            root.addView(overlay, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            overlay.bringToFront(); overlay.requestFocus();
            back = new OnBackPressedCallback(true) {
                @Override public void handleOnBackPressed() { finish(AppIntroPolicy.Reason.SKIPPED, false); }
            };
            activity.getOnBackPressedDispatcher().addCallback(activity, back);
        } catch (RuntimeException | OutOfMemoryError error) { finish(AppIntroPolicy.Reason.INITIALIZATION_ERROR, false); }
    }
    public void onResume() {
        resumed = true;
        if (delivered || scheduled || !session.active()) return;
        scheduled = true; startedAt = SystemClock.elapsedRealtime();
        handler.postDelayed(firstFrameDeadline, AppIntroPolicy.FIRST_FRAME_TIMEOUT_MS);
        handler.postDelayed(totalDeadline, AppIntroPolicy.TOTAL_TIMEOUT_MS);
        handler.post(begin);
    }
    private boolean television() {
        return (activity.getResources().getConfiguration().uiMode & Configuration.UI_MODE_TYPE_MASK) == Configuration.UI_MODE_TYPE_TELEVISION
            || activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_LEANBACK)
            || activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEVISION);
    }
    private void prepare() {
        if (delivered || !resumed || !session.active() || overlay == null) return;
        if (overlay.getWidth() <= 0 || overlay.getHeight() <= 0) { handler.postDelayed(begin, 16); return; }
        try {
            ActivityManager manager = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo info = new ActivityManager.MemoryInfo();
            if (manager == null) { finish(AppIntroPolicy.Reason.LOW_MEMORY, true); return; }
            manager.getMemoryInfo(info);
            if (info.availMem < 16L * 1024L * 1024L) { finish(AppIntroPolicy.Reason.LOW_MEMORY, true); return; }
            if (!session.prepare(television(), overlay.getWidth(), overlay.getHeight())) return;
            int resource = session.selected() == AppIntroPolicy.Media.VERTICAL ? R.raw.intro_vertical : R.raw.intro_horizontal;
            try (AssetFileDescriptor ignored = activity.getResources().openRawResourceFd(resource)) {
                if (ignored == null) { finish(AppIntroPolicy.Reason.RESOURCE_UNAVAILABLE, true); return; }
            }
            view = new PlayerView(activity);
            view.setUseController(false); view.setFocusable(false); view.setShutterBackgroundColor(Color.BLACK);
            view.setResizeMode(AspectRatioFrameLayout.RESIZE_MODE_FIT); view.setKeepContentOnPlayerReset(false);
            overlay.addView(view, 0, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            Context app = activity.getApplicationContext();
            DefaultLoadControl load = new DefaultLoadControl.Builder().setBufferDurationsMs(500, 2000, 150, 250).build();
            player = new ExoPlayer.Builder(app).setLoadControl(load).build();
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(), false);
            if (acquireFocus()) player.setVolume(1f); else silence();
            player.addListener(new Player.Listener() {
                @Override public void onRenderedFirstFrame() {
                    if (delivered || !session.active()) return;
                    session.firstFrame(); handler.removeCallbacks(firstFrameDeadline);
                    if (still != null) still.setVisibility(View.GONE);
                    Log.i(TAG, "FIRST_FRAME elapsedMs=" + (SystemClock.elapsedRealtime() - startedAt));
                }
                @Override public void onPlaybackStateChanged(int state) { if (state == Player.STATE_ENDED) finish(AppIntroPolicy.Reason.ENDED, false); }
                @Override public void onPlayerError(PlaybackException error) {
                    if (!retrySilentAudio(error)) finish(AppIntroPolicy.Reason.DECODER_ERROR, true);
                }
            });
            view.setPlayer(player);
            // RawResourceDataSource cannot fetch HTTP/streaming content.
            Uri uri = Uri.parse("android.resource://" + activity.getPackageName() + "/" + resource);
            player.setMediaSource(new ProgressiveMediaSource.Factory(() -> new RawResourceDataSource(app)).createMediaSource(MediaItem.fromUri(uri)));
            Log.i(TAG, "PREPARE media=" + session.selected());
            player.prepare(); player.play();
        } catch (android.content.res.Resources.NotFoundException error) { finish(AppIntroPolicy.Reason.RESOURCE_UNAVAILABLE, true); }
          catch (RuntimeException | java.io.IOException | OutOfMemoryError error) { finish(AppIntroPolicy.Reason.INITIALIZATION_ERROR, true); }
    }
    private void silence() {
        if (player == null) return;
        try {
            player.setVolume(0f);
            player.setTrackSelectionParameters(player.getTrackSelectionParameters().buildUpon().setTrackTypeDisabled(C.TRACK_TYPE_AUDIO, true).build());
        } catch (RuntimeException error) { Log.i(TAG, "AUDIO_SILENT_CONFIGURATION_ERROR"); }
    }
    private boolean retrySilentAudio(PlaybackException error) {
        if (!(error instanceof ExoPlaybackException) || player == null || delivered) return false;
        ExoPlaybackException exo = (ExoPlaybackException) error;
        if (exo.type != ExoPlaybackException.TYPE_RENDERER || exo.rendererFormat == null
                || !MimeTypes.isAudio(exo.rendererFormat.sampleMimeType) || !session.claimSilentAudioFallback()) return false;
        try {
            silence(); releaseFocus(); Log.i(TAG, "AUDIO_SILENT_DECODER_FALLBACK");
            player.prepare(); player.play(); return true;
        } catch (RuntimeException | OutOfMemoryError failure) { return false; }
    }
    private boolean acquireFocus() {
        try {
            audio = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
            if (audio == null || !resumed || !AppIntroPolicy.audioAllowed(audio.getRingerMode() == AudioManager.RINGER_MODE_NORMAL,
                    audio.getStreamVolume(AudioManager.STREAM_MUSIC), audio.isMusicActive(), audio.getMode() == AudioManager.MODE_NORMAL)) {
                Log.i(TAG, "AUDIO_SILENT_SYSTEM_POLICY"); return false;
            }
            int result;
            if (Build.VERSION.SDK_INT >= 26) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_MOVIE).build())
                    .setWillPauseWhenDucked(true).setOnAudioFocusChangeListener(focusListener, handler).build();
                result = audio.requestAudioFocus(focusRequest);
            } else result = audio.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
            focusHeld = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
            Log.i(TAG, focusHeld ? "AUDIO_FOCUS_GRANTED" : "AUDIO_SILENT_FOCUS_DENIED");
            return focusHeld;
        } catch (RuntimeException error) { Log.i(TAG, "AUDIO_SILENT_FOCUS_ERROR"); return false; }
    }
    private void releaseFocus() {
        if (audio == null || !focusHeld) return;
        focusHeld = false;
        try { if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) audio.abandonAudioFocusRequest(focusRequest);
              else audio.abandonAudioFocus(focusListener); }
        catch (RuntimeException error) { Log.i(TAG, "AUDIO_RELEASE_ERROR"); }
        focusRequest = null;
    }
    private void releasePlayer() {
        handler.removeCallbacksAndMessages(null);
        if (view != null) { try { view.setPlayer(null); } catch (RuntimeException error) { Log.i(TAG, "VIEW_DETACH_ERROR"); } }
        ExoPlayer old = player; player = null;
        if (old != null) {
            try { old.stop(); old.clearMediaItems(); } catch (RuntimeException error) { Log.i(TAG, "PLAYER_STOP_ERROR"); }
            finally { try { old.release(); } catch (RuntimeException error) { Log.i(TAG, "PLAYER_RELEASE_ERROR"); } }
        }
        if (view != null && view.getParent() instanceof ViewGroup) ((ViewGroup) view.getParent()).removeView(view);
        view = null; releaseFocus(); audio = null;
    }
    public void finish(AppIntroPolicy.Reason reason, boolean fallback) {
        if (delivered) return;
        session.finish(reason); releasePlayer();
        if (fallback && resumed && overlay != null && !activity.isFinishing()) {
            try { still.setImageResource(reason == AppIntroPolicy.Reason.LOW_MEMORY ? R.mipmap.ic_launcher : R.drawable.intro_brand);
                  still.setVisibility(View.VISIBLE); handler.postDelayed(this::deliver, AppIntroPolicy.FALLBACK_MS); return; }
            catch (RuntimeException | OutOfMemoryError error) { Log.i(TAG, "STATIC_FALLBACK_UNAVAILABLE"); }
        }
        deliver();
    }
    private void deliver() {
        if (delivered) return;
        delivered = true; handler.removeCallbacksAndMessages(null);
        if (back != null) { back.remove(); back = null; }
        if (overlay != null) {
            if (overlay.getParent() instanceof ViewGroup) ((ViewGroup) overlay.getParent()).removeView(overlay);
        }
        overlay = null; still = null;
        Log.i(TAG, "RELEASED reason=" + session.reason() + " elapsedMs=" + (startedAt == 0 ? 0 : SystemClock.elapsedRealtime() - startedAt));
        completed.run();
    }
    public boolean dispatchKey(KeyEvent event) {
        boolean consumed = keys.consume(!delivered, event.getAction(), event.getKeyCode(), event.getRepeatCount());
        if (consumed && !delivered && event.getAction() == KeyEvent.ACTION_DOWN) finish(AppIntroPolicy.Reason.SKIPPED, false);
        return consumed;
    }
    public boolean skipBack() { if (delivered) return false; finish(AppIntroPolicy.Reason.SKIPPED, false); return true; }
    public void background() { resumed = false; finish(AppIntroPolicy.Reason.LIFECYCLE, false); }
}
