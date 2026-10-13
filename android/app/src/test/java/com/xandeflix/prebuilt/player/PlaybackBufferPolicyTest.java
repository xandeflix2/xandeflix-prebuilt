package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import androidx.media3.common.C;
import androidx.media3.common.Timeline;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.LoadControl;
import androidx.media3.exoplayer.analytics.PlayerId;
import androidx.media3.exoplayer.source.MediaSource.MediaPeriodId;
import androidx.media3.exoplayer.upstream.Allocation;
import java.util.ArrayList;
import org.junit.Test;

public class PlaybackBufferPolicyTest {
    private static LoadControl.Parameters params(long bufferedMs, boolean rebuffer, long liveOffsetMs) {
        return new LoadControl.Parameters(PlayerId.UNSET, Timeline.EMPTY,
                new MediaPeriodId(new Object()), 0, bufferedMs * 1000, 1f, true,
                rebuffer, liveOffsetMs < 0 ? C.TIME_UNSET : liveOffsetMs * 1000);
    }

    private static DefaultLoadControl prepared(PlaybackBufferPolicy.Profile profile) {
        DefaultLoadControl control = profile.buildLoadControl();
        control.onPrepared(PlayerId.UNSET);
        return control;
    }

    @Test public void startSeekAndRebufferWaitForUsefulReserves() {
        for (String kind : new String[] {"live", "movie", "series", "vod", "episode", null}) {
            PlaybackBufferPolicy.Profile profile = PlaybackBufferPolicy.select(kind, true, false);
            DefaultLoadControl control = prepared(profile);
            assertFalse(control.shouldStartPlayback(params(500, false, -1)));
            assertFalse(control.shouldStartPlayback(params(profile.startMs - 1, false, -1)));
            assertTrue(control.shouldStartPlayback(params(profile.startMs, false, -1)));
            assertFalse(control.shouldStartPlayback(params(profile.startMs, true, -1)));
            assertTrue(control.shouldStartPlayback(params(profile.rebufferMs, true, -1)));
            assertEquals(0, control.getBackBufferDurationUs(PlayerId.UNSET));
            assertFalse(control.retainBackBufferFromKeyframe(PlayerId.UNSET));
            control.onReleased(PlayerId.UNSET);
        }
    }

    @Test public void loadingUsesHysteresisAndStopsAtTimeCeiling() {
        for (String kind : new String[] {"live", "movie"}) {
            PlaybackBufferPolicy.Profile profile = PlaybackBufferPolicy.select(kind, true, false);
            DefaultLoadControl control = prepared(profile);
            assertTrue(control.shouldContinueLoading(params(0, false, -1)));
            assertTrue(control.shouldContinueLoading(params(profile.maxMs - 1, false, -1)));
            assertFalse(control.shouldContinueLoading(params(profile.maxMs, false, -1)));
            assertFalse(control.shouldContinueLoading(params(profile.minMs + 1, false, -1)));
            assertTrue(control.shouldContinueLoading(params(profile.minMs - 1, false, -1)));
            control.onReleased(PlayerId.UNSET);
        }
    }

    @Test public void memoryTargetWinsOverLongVideoAndAvoidsStartupDeadlock() {
        PlaybackBufferPolicy.Profile profile = PlaybackBufferPolicy.select("movie", true, true);
        DefaultLoadControl control = prepared(profile);
        ArrayList<Allocation> allocations = new ArrayList<>();
        while (control.getAllocator().getTotalBytesAllocated() < profile.targetBytes) {
            allocations.add(control.getAllocator().allocate());
        }
        assertEquals(16 * 1024 * 1024, control.getAllocator().getTotalBytesAllocated());
        assertFalse(control.shouldContinueLoading(params(1000, false, -1)));
        // Very high bitrates may reach the byte target before the duration target.
        assertTrue(control.shouldStartPlayback(params(1000, true, -1)));
        for (Allocation allocation : allocations) control.getAllocator().release(allocation);
        control.onReleased(PlayerId.UNSET);
        assertEquals(0, control.getAllocator().getTotalBytesAllocated());
    }

    @Test public void profilesProtectTelevisionAndUnknownDevices() {
        assertEquals(24 * 1024 * 1024, PlaybackBufferPolicy.select("movie", true, false).targetBytes);
        assertEquals(48 * 1024 * 1024, PlaybackBufferPolicy.select("series", false, false).targetBytes);
        assertEquals(16 * 1024 * 1024, PlaybackBufferPolicy.select("live", true, false).targetBytes);
        assertEquals(24 * 1024 * 1024, PlaybackBufferPolicy.select("live", false, false).targetBytes);
        assertEquals(16 * 1024 * 1024, PlaybackBufferPolicy.forDevice(null, "movie").targetBytes);
        assertTrue(PlaybackBufferPolicy.select(" LIVE ", false, true).live);
        assertFalse(PlaybackBufferPolicy.select(null, false, true).live);
    }

    @Test public void shortLiveWindowsStillStartWithoutWaitingBeyondAvailableMedia() {
        DefaultLoadControl control = prepared(PlaybackBufferPolicy.select("live", true, false));
        assertFalse(control.shouldStartPlayback(params(1999, true, 4000)));
        assertTrue(control.shouldStartPlayback(params(2000, true, 4000)));
        control.onReleased(PlayerId.UNSET);
    }

    @Test public void simulatedTwentySecondOutageUsesReserveInsteadOfImmediateRebuffer() {
        DefaultLoadControl old = NativePlayerActivity.buildLoadControl(2500, 12000, 500, 1000);
        old.onPrepared(PlayerId.UNSET);
        DefaultLoadControl improved = prepared(PlaybackBufferPolicy.select("movie", true, false));
        assertFalse(old.shouldContinueLoading(params(12000, false, -1)));
        assertTrue(improved.shouldContinueLoading(params(12000, false, -1)));
        assertFalse(improved.shouldContinueLoading(params(60000, false, -1)));
        // Controlled outage, after filling: 12s old reserve is exhausted; 60s new has 40s left.
        long oldRemaining = Math.max(0, 12000 - 20000), newRemaining = 60000 - 20000;
        assertFalse(old.shouldStartPlayback(params(oldRemaining, true, -1)));
        assertTrue(improved.shouldStartPlayback(params(newRemaining, true, -1)));
        old.onReleased(PlayerId.UNSET);
        improved.onReleased(PlayerId.UNSET);
    }
}
