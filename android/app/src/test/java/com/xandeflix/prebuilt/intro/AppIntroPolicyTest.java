package com.xandeflix.prebuilt.intro;

import org.junit.Test;
import static org.junit.Assert.*;

public class AppIntroPolicyTest {
    @Test public void phoneAndTabletUseActualWindowShape() {
        for (int[] window : new int[][]{{411,807},{800,1280},{500,900}})
            assertEquals(AppIntroPolicy.Media.VERTICAL, AppIntroPolicy.media(false,window[0],window[1]));
        for (int[] window : new int[][]{{807,411},{1280,800},{700,500},{600,600}})
            assertEquals(AppIntroPolicy.Media.HORIZONTAL, AppIntroPolicy.media(false,window[0],window[1]));
    }
    @Test public void fireAndAndroidTvAlwaysUseHorizontal() {
        assertEquals(AppIntroPolicy.Media.HORIZONTAL, AppIntroPolicy.media(true,960,540));
        assertEquals(AppIntroPolicy.Media.HORIZONTAL, AppIntroPolicy.media(true,540,960));
    }
    @Test public void coldLauncherOnlyOncePerProcess() {
        AppIntroPolicy.ProcessAdmission gate = new AppIntroPolicy.ProcessAdmission();
        assertTrue(gate.claim(true,false,false));
        assertFalse(gate.claim(true,false,false));
        assertFalse(gate.claim(true,false,false));
    }
    @Test public void restoreAndDeepLinkNeverReplayLaterInSameProcess() {
        for (boolean[] entry : new boolean[][]{{true,true,false},{true,false,true},{false,false,false}}) {
            AppIntroPolicy.ProcessAdmission gate = new AppIntroPolicy.ProcessAdmission();
            assertFalse(gate.claim(entry[0],entry[1],entry[2]));
            assertFalse(gate.claim(true,false,false));
        }
    }
    @Test public void rotationAndDuplicatePrepareKeepOneMediaSelection() {
        AppIntroPolicy.Session session = new AppIntroPolicy.Session(true);
        assertTrue(session.prepare(false,411,807));
        assertFalse(session.prepare(false,807,411));
        assertEquals(AppIntroPolicy.Media.VERTICAL, session.selected());
        session.firstFrame();
        assertFalse(session.prepare(true,1920,1080));
        assertEquals(AppIntroPolicy.State.PLAYING, session.state());
    }
    @Test public void realEndTerminatesExactlyOnce() {
        AppIntroPolicy.Session session = new AppIntroPolicy.Session(true);
        session.prepare(false,1280,800);session.firstFrame();
        assertTrue(session.finish(AppIntroPolicy.Reason.ENDED));
        assertFalse(session.finish(AppIntroPolicy.Reason.SKIPPED));
        assertFalse(session.active());assertEquals(AppIntroPolicy.Reason.ENDED,session.reason());
        assertFalse(session.prepare(false,411,807));
    }
    @Test public void everyFailureAndLifecycleIsTerminalWithoutReplay() {
        for(AppIntroPolicy.Reason reason : AppIntroPolicy.Reason.values()) {
            if(reason==AppIntroPolicy.Reason.NOT_ELIGIBLE)continue;
            AppIntroPolicy.Session session = new AppIntroPolicy.Session(true);
            assertTrue(session.finish(reason));assertFalse(session.active());
            assertFalse(session.finish(AppIntroPolicy.Reason.ENDED));
            assertFalse(session.prepare(true,960,540));
            assertEquals(reason,session.reason());
        }
    }
    @Test public void normalVideoDoesNotUseEightSecondCutoff() {
        assertTrue(AppIntroPolicy.FIRST_FRAME_TIMEOUT_MS>0);
        assertTrue(AppIntroPolicy.TOTAL_TIMEOUT_MS>=AppIntroPolicy.FIRST_FRAME_TIMEOUT_MS+8000);
        assertTrue(AppIntroPolicy.FALLBACK_MS>0);
        AppIntroPolicy.Session session = new AppIntroPolicy.Session(true);
        session.prepare(true,960,540);session.firstFrame();
        assertTrue(session.active());assertEquals(AppIntroPolicy.State.PLAYING,session.state());
    }
    @Test public void skipPressRepeatAndReleaseNeverReachNextPage() {
        for(int code:new int[]{4,23,66,160}) {
            AppIntroPolicy.KeyBarrier barrier=new AppIntroPolicy.KeyBarrier();
            assertTrue(barrier.consume(true,0,code,0));
            assertTrue(barrier.consume(false,0,code,1));
            assertTrue(barrier.consume(false,1,code,0));
            assertFalse(barrier.consume(false,0,code,0));
        }
    }
    @Test public void systemVolumeRemainsAvailableAndIdleKeysAreNotIntercepted() {
        AppIntroPolicy.KeyBarrier barrier = new AppIntroPolicy.KeyBarrier();
        for(int code:new int[]{24,25,164})assertFalse(barrier.consume(true,0,code,0));
        for(int code:new int[]{4,23,66,160})assertFalse(barrier.consume(false,0,code,0));
    }
    @Test public void silentSystemExternalAudioAndCallsNeverPlayIntroSound() {
        assertTrue(AppIntroPolicy.audioAllowed(true,5,false,true));
        assertFalse(AppIntroPolicy.audioAllowed(false,5,false,true));
        assertFalse(AppIntroPolicy.audioAllowed(true,0,false,true));
        assertFalse(AppIntroPolicy.audioAllowed(true,5,true,true));
        assertFalse(AppIntroPolicy.audioAllowed(true,5,false,false));
    }
    @Test public void unavailableWindowDoesNotCreateAPlayer() {
        AppIntroPolicy.Session session=new AppIntroPolicy.Session(true);
        try { session.prepare(false,0,0);fail(); } catch(IllegalArgumentException expected) {}
        assertEquals(AppIntroPolicy.State.WAITING,session.state());assertNull(session.selected());
    }
    @Test public void ineligibleSessionIsImmediatelyComplete() {
        AppIntroPolicy.Session session=new AppIntroPolicy.Session(false);
        assertFalse(session.active());assertFalse(session.prepare(true,960,540));
        assertEquals(AppIntroPolicy.Reason.NOT_ELIGIBLE,session.reason());
    }
    @Test public void audioDecoderCanTrySilentOnlyOnceWithoutRestartingSession() {
        AppIntroPolicy.Session session=new AppIntroPolicy.Session(true);
        session.prepare(false,411,807);session.firstFrame();
        assertTrue(session.claimSilentAudioFallback());assertFalse(session.claimSilentAudioFallback());
        assertEquals(AppIntroPolicy.State.PLAYING,session.state());assertEquals(AppIntroPolicy.Media.VERTICAL,session.selected());
        session.finish(AppIntroPolicy.Reason.ENDED);assertFalse(session.claimSilentAudioFallback());
    }
    @Test public void missingKeyUpInBackgroundDoesNotSwallowNextDistinctPress() {
        AppIntroPolicy.KeyBarrier barrier=new AppIntroPolicy.KeyBarrier();
        assertTrue(barrier.consume(true,0,66,0));
        assertTrue(barrier.consume(false,0,66,2));
        assertFalse(barrier.consume(false,0,66,0));
    }
}
