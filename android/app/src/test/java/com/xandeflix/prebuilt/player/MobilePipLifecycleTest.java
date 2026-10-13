package com.xandeflix.prebuilt.player;

import org.junit.Test;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import static org.junit.Assert.*;

public class MobilePipLifecycleTest {
    private static final class Playback {
        final List<String> events = new ArrayList<>();
        boolean audible = true;
        boolean released;
        long position = 3300000L;
        long savedPosition;
        void pause() { audible = false; events.add("pause"); }
        void release() {
            savedPosition = position;
            events.add("save");
            released = true;
            events.add("release");
        }
    }

    @Test public void dismissReleasesWhileSystemStillReportsPipAndSavesExactPosition() {
        for (boolean fullscreen : new boolean[]{true, false}) {
            MobilePipLifecycle lifecycle = new MobilePipLifecycle();
            Playback playback = new Playback();
            lifecycle.resumed();
            lifecycle.modeChanged(true);
            assertTrue("PiP entry does not pause visible playback", playback.audible);
            lifecycle.stopped(fullscreen, false, false, false, playback::pause, playback::release);
            assertFalse(playback.audible);
            assertTrue(playback.released);
            assertEquals(3300000L, playback.savedPosition);
            assertEquals(Arrays.asList("pause", "save", "release"), playback.events);
        }
    }

    @Test public void falseModeCallbackBeforeStopStillReleasesPreview() {
        MobilePipLifecycle lifecycle = new MobilePipLifecycle();
        Playback playback = new Playback();
        lifecycle.modeChanged(true);
        lifecycle.modeChanged(false);
        lifecycle.stopped(false, false, false, false, playback::pause, playback::release);
        assertTrue(playback.released);
        assertFalse(playback.audible);
    }

    @Test public void returningFullscreenPreservesPlayerAndLaterPreviewPauseResume() {
        MobilePipLifecycle lifecycle = new MobilePipLifecycle();
        Playback playback = new Playback();
        lifecycle.modeChanged(true);
        lifecycle.modeChanged(false);
        lifecycle.resumed();
        assertTrue(playback.audible);
        lifecycle.stopped(false, false, false, false, playback::pause, playback::release);
        assertFalse(playback.audible);
        assertFalse(playback.released);
        assertEquals(Arrays.asList("pause"), playback.events);
    }

    @Test public void repeatedStopLateModeResumeAndDestroyCannotRepeatRelease() {
        MobilePipLifecycle lifecycle = new MobilePipLifecycle();
        Playback playback = new Playback();
        lifecycle.modeChanged(true);
        lifecycle.stopped(false, false, false, false, playback::pause, playback::release);
        lifecycle.modeChanged(false);
        lifecycle.resumed();
        lifecycle.stopped(true, true, false, false, playback::pause, playback::release);
        lifecycle.close();
        lifecycle.stopped(true, true, false, false, playback::pause, playback::release);
        assertEquals(Arrays.asList("pause", "save", "release"), playback.events);
        assertFalse(playback.audible);
    }

    @Test public void hiddenFullscreenClosesEvenWithoutPipSupport() {
        MobilePipLifecycle lifecycle = new MobilePipLifecycle();
        Playback playback = new Playback();
        lifecycle.stopped(true, false, false, false, playback::pause, playback::release);
        assertTrue(playback.released);
        assertFalse(playback.audible);
    }

    @Test public void finishingMainClosesPreviewEvenWithoutModeCallback() {
        MobilePipLifecycle lifecycle = new MobilePipLifecycle();
        Playback playback = new Playback();
        lifecycle.stopped(false, true, false, false, playback::pause, playback::release);
        assertTrue(playback.released);
        assertFalse(playback.audible);
    }

    @Test public void castAndConfigurationOnlyPauseLocalAndDoNotTerminateRemote() {
        for (boolean fullscreen : new boolean[]{true, false}) {
            for (boolean configuration : new boolean[]{true, false}) {
                MobilePipLifecycle lifecycle = new MobilePipLifecycle();
                Playback playback = new Playback();
                lifecycle.modeChanged(true);
                lifecycle.stopped(fullscreen, false, configuration, !configuration,
                        playback::pause, playback::release);
                assertFalse(playback.audible);
                assertFalse(playback.released);
                assertEquals(Arrays.asList("pause"), playback.events);
            }
        }
    }

    @Test public void releaseStillRunsIfPauseFails() {
        MobilePipLifecycle lifecycle = new MobilePipLifecycle();
        Playback playback = new Playback();
        try {
            lifecycle.stopped(true, false, false, false,
                    () -> { throw new IllegalStateException("pause failed"); }, playback::release);
            fail("exception should propagate after releasing");
        } catch (IllegalStateException expected) {
            assertTrue(playback.released);
            assertEquals(Arrays.asList("save", "release"), playback.events);
        }
    }
}
