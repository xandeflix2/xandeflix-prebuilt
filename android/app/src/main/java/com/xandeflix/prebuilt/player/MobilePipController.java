package com.xandeflix.prebuilt.player;

import android.app.Activity;
import android.app.PictureInPictureParams;
import android.app.PendingIntent;
import android.app.RemoteAction;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.drawable.Icon;
import android.content.pm.PackageManager;
import android.graphics.Rect;
import android.os.Build;
import android.util.Rational;
import androidx.media3.common.Player;
import androidx.media3.common.VideoSize;
import androidx.media3.ui.PlayerView;
import androidx.core.content.ContextCompat;
import java.util.Collections;
import java.util.UUID;

/** Per-view PiP lifecycle. No player or authorization is created here. */
public final class MobilePipController {
    private final Activity activity;
    private final PlayerView view;
    private final Player player;
    private boolean closed;
    private final boolean live;
    private final MobilePipActionState actions;
    private PendingIntent actionIntent;
    private boolean receiverRegistered;
    private final String actionName = "com.xandeflix.prebuilt.PIP." + UUID.randomUUID();
    private final BroadcastReceiver actionReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            if (closed || !actionName.equals(intent.getAction()) || Build.VERSION.SDK_INT < 26
                    || !activity.isInPictureInPictureMode() || player.getPlayerError() != null) return;
            actions.toggle(); update();
        }
    };
    private final android.view.View.OnLayoutChangeListener layoutListener =
            (v,l,t,r,b,ol,ot,or,ob) -> update();
    private final Player.Listener listener = new Player.Listener() {
        @Override public void onEvents(Player p, Player.Events events) { update(); }
    };

    public MobilePipController(Activity activity, PlayerView view, Player player, String kind) {
        this.activity = activity; this.view = view; this.player = player;
        this.live = "live".equals(kind);
        this.actions = new MobilePipActionState(new MobilePipActionState.Port() {
            public float volume() { return player.getVolume(); }
            public void volume(float value) { player.setVolume(value); }
            public boolean playing() { return player.getPlayWhenReady(); }
            public void play() { player.play(); }
            public void pause() { player.pause(); }
        }, live);
        if (Build.VERSION.SDK_INT >= 26) {
            ContextCompat.registerReceiver(activity, actionReceiver, new IntentFilter(actionName), ContextCompat.RECEIVER_NOT_EXPORTED);
            receiverRegistered = true;
            actionIntent = PendingIntent.getBroadcast(activity, 0, new Intent(actionName).setPackage(activity.getPackageName()), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        }
        player.addListener(listener);
        view.addOnLayoutChangeListener(layoutListener);
        update();
    }
    public boolean eligible() {
        return MobilePipPolicy.eligible(Build.VERSION.SDK_INT,
                activity.getResources().getConfiguration().uiMode,
                activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE),
                player.getPlayWhenReady(), player.getPlaybackState(),
                closed || activity.isFinishing() || player.getPlayerError() != null);
    }
    private PictureInPictureParams params() {
        VideoSize size = player.getVideoSize();
        double ratio = size.height > 0 ? size.width * (double)size.pixelWidthHeightRatio / size.height : 16.0/9;
        ratio = Math.max(0.42, Math.min(2.38, ratio));
        PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
                .setAspectRatio(new Rational((int)Math.round(ratio * 1000), 1000));
        Rect rect = new Rect(); if (view.getGlobalVisibleRect(rect)) builder.setSourceRectHint(rect);
        if (!closed && actionIntent != null) {
            boolean active = actions.activeIcon();
            String title = live ? (active ? "Silenciar" : "Ativar áudio") : (active ? "Pausar" : "Reproduzir");
            int icon = live ? (active ? android.R.drawable.ic_lock_silent_mode : android.R.drawable.ic_lock_silent_mode_off)
                    : (active ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
            builder.setActions(Collections.singletonList(new RemoteAction(Icon.createWithResource(activity, icon), title, title, actionIntent)));
        } else builder.setActions(Collections.emptyList());
        if (Build.VERSION.SDK_INT >= 31) builder.setAutoEnterEnabled(eligible()).setSeamlessResizeEnabled(true);
        return builder.build();
    }
    public void update() {
        if (Build.VERSION.SDK_INT < 26 || (activity.getResources().getConfiguration().uiMode & 0x0f) == 4) return;
        try { activity.setPictureInPictureParams(params()); } catch (RuntimeException ignored) {}
    }
    public void onLeave() {
        if (Build.VERSION.SDK_INT >= 26 && Build.VERSION.SDK_INT < 31 && eligible()) {
            try { activity.enterPictureInPictureMode(params()); } catch (RuntimeException ignored) {}
        }
    }
    public void modeChanged(boolean pip) {
        view.setUseController(!pip);
        if (pip) view.hideController();
    }
    public void close() {
        if (closed) return;
        closed = true;
        actions.close();
        update();
        if (actionIntent != null) { actionIntent.cancel(); actionIntent = null; }
        if (receiverRegistered) { activity.unregisterReceiver(actionReceiver); receiverRegistered = false; }
        player.removeListener(listener);
        view.removeOnLayoutChangeListener(layoutListener);
    }
}
