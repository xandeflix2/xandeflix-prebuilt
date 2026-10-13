package com.xandeflix.prebuilt.player;

import android.app.ActivityManager;
import android.content.Context;
import android.content.res.Configuration;
import android.util.Log;

import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;

/** Device-local buffering; byte targets take precedence on memory constrained devices. */
public final class PlaybackBufferPolicy {
    private static final int MIB = 1024 * 1024;

    private PlaybackBufferPolicy() {}

    public static final class Profile {
        public final boolean live;
        public final int minMs, maxMs, startMs, rebufferMs, targetBytes;

        private Profile(boolean live, int targetBytes) {
            this.live = live;
            minMs = live ? 10000 : 30000;
            maxMs = live ? 20000 : 60000;
            startMs = live ? 2500 : 4000;
            rebufferMs = live ? 4000 : 6000;
            this.targetBytes = targetBytes;
        }

        public DefaultLoadControl buildLoadControl() {
            return new DefaultLoadControl.Builder()
                    .setBufferDurationsMs(minMs, maxMs, startMs, rebufferMs)
                    .setTargetBufferBytes(targetBytes)
                    .setPrioritizeTimeOverSizeThresholds(false)
                    .setBackBuffer(0, false)
                    .build();
        }

        public void configureMediaSource(DefaultMediaSourceFactory factory) {
            // Only adaptive live timelines use this offset; progressive streams have no DVR window.
            if (live) factory.setLiveTargetOffsetMs(10000);
        }

        public void logConfiguration() {
            Log.i("PlaybackBufferPolicy", "BUFFER_PROFILE kind=" + (live ? "live" : "vod")
                    + " minMs=" + minMs + " maxMs=" + maxMs + " startMs=" + startMs
                    + " rebufferMs=" + rebufferMs + " targetBytes=" + targetBytes);
        }
    }

    public static Profile select(String kind, boolean television, boolean constrainedMemory) {
        boolean live = kind != null && "live".equalsIgnoreCase(kind.trim());
        int bytes = constrainedMemory ? 16 * MIB
                : television ? (live ? 16 : 24) * MIB : (live ? 24 : 48) * MIB;
        return new Profile(live, bytes);
    }

    public static Profile forDevice(Context context, String kind) {
        boolean television = false, constrained = true;
        if (context != null) {
            try {
                television = (context.getResources().getConfiguration().uiMode
                        & Configuration.UI_MODE_TYPE_MASK) == Configuration.UI_MODE_TYPE_TELEVISION;
                ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
                if (manager != null) {
                    int memoryClass = manager.getMemoryClass();
                    constrained = manager.isLowRamDevice() || memoryClass <= 128;
                }
            } catch (RuntimeException ignored) {
                constrained = true;
            }
        }
        return select(kind, television, constrained);
    }
}
