package com.xandeflix.prebuilt.player;

import android.view.KeyEvent;
import androidx.media3.common.C;
import androidx.media3.common.Player;
import org.junit.Test;
import java.lang.reflect.Proxy;
import static org.junit.Assert.*;

public class VodDpadControllerTest {
    private static final int RIGHT = KeyEvent.KEYCODE_DPAD_RIGHT;
    private static final int LEFT = KeyEvent.KEYCODE_DPAD_LEFT;
    private static final int OK = KeyEvent.KEYCODE_DPAD_CENTER;

    private static final class Ui implements VodDpadController.Controls {
        boolean visible;
        int shows;
        int focused;
        public boolean visible() { return visible; }
        public void showAndFocusPlayPause() { visible = true; shows++; focused++; }
    }

    private static final class State {
        long position = 30000, duration = 100000;
        boolean playing = true, playWhenReady = true, seekable = true, command = true, ad;
        int seeks, pauses, plays;
        final Player player = (Player)Proxy.newProxyInstance(Player.class.getClassLoader(),
                new Class<?>[]{Player.class}, (proxy, method, args) -> {
                    switch (method.getName()) {
                        case "getCurrentPosition": return position;
                        case "getDuration": return duration;
                        case "isPlaying": return playing;
                        case "getPlayWhenReady": return playWhenReady;
                        case "isPlayingAd": return ad;
                        case "isCurrentMediaItemSeekable": return seekable;
                        case "isCommandAvailable":
                            assertEquals(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM, args[0]);
                            return command;
                        case "seekTo":
                            assertEquals(1, args.length);
                            position = (Long)args[0]; seeks++; return null;
                        case "pause": pauses++; playing = false; playWhenReady = false; return null;
                        case "play": plays++; playing = true; playWhenReady = true; return null;
                        default: throw new AssertionError("Unexpected player call: " + method.getName());
                    }
                });
    }

    private static final class Fixture {
        final VodDpadController router = new VodDpadController();
        final State state = new State();
        final Ui ui = new Ui();
        String kind = "movie";
        boolean enabled = true;
        boolean event(int key, int action, int repeat) {
            return router.dispatch(key, action, repeat, kind, enabled, state.player, ui);
        }
        boolean down(int key) { return event(key, KeyEvent.ACTION_DOWN, 0); }
        boolean up(int key) { return event(key, KeyEvent.ACTION_UP, 0); }
        void press(int key) { assertTrue(down(key)); assertTrue(up(key)); }
    }

    @Test public void movieRightMovesTenSecondsWithoutOpeningControlsOrPausing() {
        Fixture f = new Fixture(); f.press(RIGHT);
        assertEquals(40000, f.state.position); assertEquals(1, f.state.seeks);
        assertEquals(0, f.ui.shows); assertFalse(f.ui.visible);
        assertTrue(f.state.playing); assertTrue(f.state.playWhenReady);
        assertEquals(0, f.state.pauses); assertEquals(0, f.state.plays);
    }
    @Test public void movieLeftMovesTenSecondsWithoutOpeningControls() {
        Fixture f = new Fixture(); f.press(LEFT);
        assertEquals(20000, f.state.position); assertEquals(0, f.ui.shows);
        assertTrue(f.state.playing); assertTrue(f.state.playWhenReady);
    }
    @Test public void episodeSupportsBothDirections() {
        Fixture f = new Fixture(); f.kind = "series"; f.press(RIGHT);
        assertEquals(40000, f.state.position); f.press(LEFT);
        assertEquals(30000, f.state.position); assertEquals(0, f.ui.shows);
    }
    @Test public void consecutivePressesAccumulateThirtyForwardAndTwentyBack() {
        Fixture f = new Fixture(); for (int i=0;i<3;i++) f.press(RIGHT);
        assertEquals(60000, f.state.position);
        for (int i=0;i<2;i++) f.press(LEFT);
        assertEquals(40000, f.state.position); assertEquals(5, f.state.seeks);
    }
    @Test public void heldHorizontalKeyAccumulatesTenSecondsPerRepeat() {
        Fixture f = new Fixture(); assertTrue(f.down(RIGHT));
        assertTrue(f.event(RIGHT,KeyEvent.ACTION_DOWN,1));
        assertTrue(f.event(RIGHT,KeyEvent.ACTION_DOWN,2)); assertTrue(f.up(RIGHT));
        assertEquals(60000, f.state.position); assertEquals(0, f.ui.shows);
    }
    @Test public void clampsStartAndEndWithoutReloadOrPlayCalls() {
        Fixture f = new Fixture(); f.state.position=500; f.press(LEFT);
        assertEquals(0, f.state.position); f.press(LEFT); assertEquals(1, f.state.seeks);
        f.state.position=99000; f.press(RIGHT); assertEquals(100000, f.state.position);
        f.press(RIGHT); assertEquals(2, f.state.seeks);
        assertEquals(0, f.state.plays); assertEquals(0, f.state.pauses);
    }
    @Test public void okPausesShowsAndFocusesWithoutClickingAgainOnRelease() {
        Fixture f = new Fixture(); assertTrue(f.down(OK));
        assertFalse(f.state.playWhenReady); assertEquals(1, f.state.pauses);
        assertTrue(f.ui.visible); assertEquals(1, f.ui.shows); assertEquals(1, f.ui.focused);
        assertTrue(f.up(OK)); assertEquals(0, f.state.plays); assertEquals(1, f.state.pauses);
        assertFalse(f.down(OK)); assertFalse(f.up(OK)); // New press reaches the focused button.
    }
    @Test public void enterVariantsAndBufferingPauseRatherThanToggleToPlay() {
        for (int key : new int[]{OK,KeyEvent.KEYCODE_ENTER,KeyEvent.KEYCODE_NUMPAD_ENTER}) {
            Fixture f = new Fixture(); f.kind="series"; f.state.playing=false;
            f.state.playWhenReady=true; f.press(key);
            assertFalse(f.state.playWhenReady); assertEquals(1, f.state.pauses);
            assertEquals(0, f.state.plays); assertEquals(1, f.ui.shows);
        }
    }
    @Test public void heldOkNeverTriggersAnotherActionEvenAfterControlsBecomeVisible() {
        Fixture f = new Fixture(); assertTrue(f.down(OK));
        for (int n=1;n<5;n++) assertTrue(f.event(OK,KeyEvent.ACTION_DOWN,n));
        assertTrue(f.up(OK)); assertEquals(1,f.state.pauses);
        assertEquals(1,f.ui.shows); assertEquals(0,f.state.plays);
    }
    @Test public void hiddenAlreadyPausedDoesNotResumeOnOkOrHorizontalSeek() {
        Fixture f = new Fixture(); f.state.playing=false; f.state.playWhenReady=false;
        f.press(RIGHT); assertFalse(f.state.playWhenReady); assertFalse(f.ui.visible);
        f.press(OK); assertFalse(f.state.playWhenReady); assertTrue(f.ui.visible);
        assertEquals(0,f.state.plays);
    }
    @Test public void visibleDirectionsAndSelectionAlwaysReachNormalControls() {
        Fixture f = new Fixture(); f.ui.visible=true;
        for (int key:new int[]{LEFT,RIGHT,OK,KeyEvent.KEYCODE_ENTER,KeyEvent.KEYCODE_NUMPAD_ENTER,
                KeyEvent.KEYCODE_DPAD_UP,KeyEvent.KEYCODE_DPAD_DOWN}) {
            assertFalse(f.down(key)); assertFalse(f.up(key));
        }
        assertEquals(0,f.state.seeks); assertEquals(0,f.state.pauses); assertEquals(0,f.ui.shows);
    }
    @Test public void liveAndUnknownKindsAreNeverIntercepted() {
        for (String kind:new String[]{"live","LIVE","unknown","",null}) {
            Fixture f = new Fixture(); f.kind=kind;
            for (int key:new int[]{LEFT,RIGHT,OK}) { assertFalse(f.down(key)); assertFalse(f.up(key)); }
            assertEquals(0,f.state.seeks); assertEquals(0,f.state.pauses); assertEquals(0,f.ui.shows);
        }
    }
    @Test public void disabledContextOrMissingPlayerNeverActs() {
        Fixture f = new Fixture(); f.enabled=false;
        for(int key:new int[]{LEFT,RIGHT,OK}) assertFalse(f.down(key));
        assertFalse(f.router.dispatch(RIGHT,KeyEvent.ACTION_DOWN,0,"movie",true,null,f.ui));
        assertFalse(f.router.dispatch(RIGHT,KeyEvent.ACTION_DOWN,0,"movie",true,f.state.player,null));
        assertEquals(0,f.state.seeks); assertEquals(0,f.ui.shows); assertEquals(0,f.state.pauses);
    }
    @Test public void unseekableAdMissingCommandOrUnknownDurationNeverSeekOrOpenControls() {
        for (int n=0;n<6;n++) {
            Fixture f = new Fixture();
            if(n==0)f.state.seekable=false;if(n==1)f.state.ad=true;if(n==2)f.state.command=false;
            if(n==3)f.state.duration=C.TIME_UNSET;if(n==4)f.state.duration=0;if(n==5)f.state.position=-1;
            f.press(RIGHT); f.press(LEFT);
            assertEquals(0,f.state.seeks); assertEquals(0,f.ui.shows); assertEquals(0,f.state.pauses);
        }
    }
    @Test public void capturedReleaseIsConsumedAfterVisibilityOrEligibilityChanges() {
        Fixture f = new Fixture(); assertTrue(f.down(RIGHT)); f.ui.visible=true;
        assertTrue(f.event(RIGHT,KeyEvent.ACTION_DOWN,1)); f.enabled=false;
        assertTrue(f.up(RIGHT)); assertEquals(40000,f.state.position);
        f.enabled=true; assertFalse(f.down(RIGHT)); assertFalse(f.up(RIGHT));
    }
    @Test public void freshDownRecoversLostUpAndUncapturedUpDoesNothing() {
        Fixture f = new Fixture(); assertFalse(f.up(OK)); assertTrue(f.down(OK));
        assertFalse(f.down(OK)); assertFalse(f.up(OK)); assertEquals(1,f.state.pauses);
    }
    @Test public void mediaBackMenuVerticalAndOtherKeysAreNotCaptured() {
        Fixture f = new Fixture();
        for(int key:new int[]{KeyEvent.KEYCODE_MEDIA_PLAY,KeyEvent.KEYCODE_MEDIA_PAUSE,
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,KeyEvent.KEYCODE_MEDIA_NEXT,
                KeyEvent.KEYCODE_MEDIA_FAST_FORWARD,KeyEvent.KEYCODE_MEDIA_REWIND,
                KeyEvent.KEYCODE_DPAD_UP,KeyEvent.KEYCODE_DPAD_DOWN,KeyEvent.KEYCODE_BACK,
                KeyEvent.KEYCODE_MENU,KeyEvent.KEYCODE_A}) {
            assertFalse(f.down(key)); assertFalse(f.up(key));
        }
        assertFalse(f.event(RIGHT,KeyEvent.ACTION_MULTIPLE,0));
        assertEquals(0,f.state.seeks); assertEquals(0,f.state.pauses); assertEquals(0,f.ui.shows);
    }
}
