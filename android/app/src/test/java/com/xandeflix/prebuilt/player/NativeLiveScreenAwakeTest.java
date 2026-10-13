package com.xandeflix.prebuilt.player;

import androidx.media3.common.Player;
import org.junit.Test;
import static org.junit.Assert.*;

/** Pure policy tests; Android View/window behavior is verified separately on device. */
public class NativeLiveScreenAwakeTest {
    private boolean keep(boolean active, boolean foreground, boolean requested,
            int state, boolean failed, boolean suppressed) {
        return NativeAndroidPlayerPlugin.shouldKeepPreviewScreenOn(
                active, foreground, requested, state, failed, suppressed);
    }

    @Test
    public void readyAndBufferingKeepTheScreenOn() {
        assertTrue(keep(true, true, true, Player.STATE_READY, false, false));
        assertTrue(keep(true, true, true, Player.STATE_BUFFERING, false, false));
    }

    @Test
    public void pauseReleasesInBothPlayableStates() {
        assertFalse(keep(true, true, false, Player.STATE_READY, false, false));
        assertFalse(keep(true, true, false, Player.STATE_BUFFERING, false, false));
    }

    @Test
    public void backgroundReleasesEvenIfPlaybackWasRequested() {
        assertFalse(keep(true, false, true, Player.STATE_READY, false, false));
        assertFalse(keep(true, false, true, Player.STATE_BUFFERING, false, false));
    }

    @Test
    public void inactiveOrReleasedSessionCannotReacquire() {
        assertFalse(keep(false, true, true, Player.STATE_READY, false, false));
        assertFalse(keep(false, true, true, Player.STATE_BUFFERING, false, false));
    }

    @Test
    public void idleEndedAndUnknownStatesDoNotHoldTheScreen() {
        for (int state : new int[]{Player.STATE_IDLE, Player.STATE_ENDED, -1, 0, 99}) {
            assertFalse(keep(true, true, true, state, false, false));
        }
    }

    @Test
    public void errorAndSuppressionAlwaysRelease() {
        for (int state : new int[]{Player.STATE_READY, Player.STATE_BUFFERING}) {
            assertFalse(keep(true, true, true, state, true, false));
            assertFalse(keep(true, true, true, state, false, true));
        }
    }

    @Test
    public void pauseResumeStopRetryAndBackgroundSequence() {
        assertTrue(keep(true, true, true, Player.STATE_READY, false, false));
        assertFalse(keep(true, true, false, Player.STATE_READY, false, false));
        assertTrue(keep(true, true, true, Player.STATE_READY, false, false));
        assertFalse(keep(true, false, true, Player.STATE_READY, false, false));
        assertTrue(keep(true, true, true, Player.STATE_READY, false, false));
        assertFalse(keep(true, true, true, Player.STATE_IDLE, true, false));
        assertTrue(keep(true, true, true, Player.STATE_BUFFERING, false, false));
        assertFalse(keep(false, true, true, Player.STATE_READY, false, false));
    }

    @Test
    public void everyBooleanCombinationFailsClosedExceptActiveRequestedPlayback() {
        for (int state : new int[]{Player.STATE_IDLE, Player.STATE_BUFFERING,
                Player.STATE_READY, Player.STATE_ENDED}) {
            for (int flags = 0; flags < 32; flags++) {
                boolean active = (flags & 1) != 0;
                boolean foreground = (flags & 2) != 0;
                boolean requested = (flags & 4) != 0;
                boolean failed = (flags & 8) != 0;
                boolean suppressed = (flags & 16) != 0;
                boolean expected = flags == 7
                        && (state == Player.STATE_READY || state == Player.STATE_BUFFERING);
                assertEquals("flags=" + flags + ",state=" + state, expected,
                        keep(active, foreground, requested, state, failed, suppressed));
            }
        }
    }
}
