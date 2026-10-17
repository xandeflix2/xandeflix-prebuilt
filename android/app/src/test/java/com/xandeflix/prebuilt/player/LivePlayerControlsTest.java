package com.xandeflix.prebuilt.player;
import org.junit.Test;
import android.view.KeyEvent;
import static org.junit.Assert.*;

public class LivePlayerControlsTest {
    @Test public void channelKeysAreExplicitAndDoNotStealDpadMediaOrBack() {
        assertTrue(LivePlayerControls.isChannelKey(KeyEvent.KEYCODE_CHANNEL_UP));
        assertTrue(LivePlayerControls.isChannelKey(KeyEvent.KEYCODE_CHANNEL_DOWN));
        for(int key:new int[]{KeyEvent.KEYCODE_DPAD_UP,KeyEvent.KEYCODE_DPAD_DOWN,
                KeyEvent.KEYCODE_DPAD_LEFT,KeyEvent.KEYCODE_DPAD_RIGHT,KeyEvent.KEYCODE_DPAD_CENTER,
                KeyEvent.KEYCODE_BACK,KeyEvent.KEYCODE_MEDIA_NEXT,KeyEvent.KEYCODE_MEDIA_PREVIOUS,-1})
            assertFalse(LivePlayerControls.isChannelKey(key));
    }
    @Test public void remoteChannelKeysRouteInlineAndFullscreenOnlyForActiveNonPipLive() {
        for(int key:new int[]{KeyEvent.KEYCODE_CHANNEL_UP,KeyEvent.KEYCODE_CHANNEL_DOWN}) {
            assertTrue(NativeAndroidPlayerPlugin.shouldDispatchLiveKey(true,false,false,key));
            assertTrue(NativeAndroidPlayerPlugin.shouldDispatchLiveKey(true,true,false,key));
            assertFalse(NativeAndroidPlayerPlugin.shouldDispatchLiveKey(false,true,false,key));
            assertFalse(NativeAndroidPlayerPlugin.shouldDispatchLiveKey(true,true,true,key));
        }
        assertFalse(NativeAndroidPlayerPlugin.shouldDispatchLiveKey(true,false,false,KeyEvent.KEYCODE_DPAD_UP));
        assertTrue(NativeAndroidPlayerPlugin.shouldDispatchLiveKey(true,true,false,KeyEvent.KEYCODE_DPAD_UP));
    }
    @Test public void textDoesNotExposeUrlsAndIsBounded() {
        assertEquals("",LivePlayerControls.text("https://synthetic.invalid/private",180));
        assertEquals("",LivePlayerControls.text("Program http://synthetic.invalid/x",180));
        assertEquals("Canal teste",LivePlayerControls.text("Canal\nteste",180));
        assertEquals("ABC",LivePlayerControls.text("ABCDE",3));
        assertEquals("",LivePlayerControls.text(null,180));
    }
    @Test public void nativeActionsUseOnlyOpaqueBoundedIds() {
        assertTrue(LivePlayerControls.validId("live:channel:123"));
        assertFalse(LivePlayerControls.validId(null));
        assertFalse(LivePlayerControls.validId(""));
        assertFalse(LivePlayerControls.validId("https://synthetic.invalid/private"));
        assertFalse(LivePlayerControls.validId("live:channel\nextra"));
        assertFalse(LivePlayerControls.validId(new String(new char[513]).replace('\0','x')));
    }
}
