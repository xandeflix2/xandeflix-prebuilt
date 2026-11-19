package com.xandeflix.prebuilt.player;
import org.junit.Test;
import android.view.KeyEvent;
import static org.junit.Assert.*;

public class LivePlayerControlsTest {
    @Test public void fullscreenPanelsReserveHeaderAndFooterAcrossScreenSizes() {
        for(int[] screen:new int[][]{{1920,1080,2},{1280,800,1},{960,540,1},{844,390,1},{390,844,1},{2400,1080,3}}){
            int width=screen[0],height=screen[1],density=screen[2],header=68*density,footer=64*density;
            for(boolean guide:new boolean[]{false,true}){
                int[] bounds=LivePlayerControls.panelBounds(width,height,density,header,footer,guide);
                assertTrue(bounds[0]>=0);assertTrue(bounds[1]>=header);
                assertTrue(bounds[2]>0);assertTrue(bounds[3]>0);
                assertTrue(bounds[0]+bounds[2]<=width);
                assertTrue(bounds[1]+bounds[3]<=height-footer);
                if(guide){assertTrue(bounds[2]>=width-24*density);assertTrue(bounds[3]<=232*density);}
                else {assertTrue(bounds[0]>0);assertTrue(bounds[2]<=400*density);}
            }
        }
    }
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
    @Test public void continuousChannelPositionsIncludeTheLastPartialWindow() {
        assertEquals(-1, LivePlayerControls.channelWindowOffset(-1));
        assertEquals(0, LivePlayerControls.channelWindowOffset(0));
        assertEquals(0, LivePlayerControls.channelWindowOffset(47));
        assertEquals(48, LivePlayerControls.channelWindowOffset(48));
        assertEquals(48, LivePlayerControls.channelWindowOffset(95));
        assertEquals(96, LivePlayerControls.channelWindowOffset(96));
        assertEquals(96, LivePlayerControls.channelWindowOffset(99));
        assertTrue(LivePlayerControls.validChannelWindow(0, 0, 0));
        assertTrue(LivePlayerControls.validChannelWindow(0, 1, 1));
        assertTrue(LivePlayerControls.validChannelWindow(0, 48, 100));
        assertTrue(LivePlayerControls.validChannelWindow(48, 48, 100));
        assertTrue(LivePlayerControls.validChannelWindow(96, 4, 100));
        assertTrue(LivePlayerControls.validChannelWindow(48, 15, 63));
        assertTrue(LivePlayerControls.validChannelWindow(96, 9, 105));
        assertFalse(LivePlayerControls.validChannelWindow(96, 5, 100));
        assertFalse(LivePlayerControls.validChannelWindow(47, 48, 100));
        assertFalse(LivePlayerControls.validChannelWindow(-1, 1, 63));
        assertFalse(LivePlayerControls.validChannelWindow(0, 0, 63));
        assertFalse(LivePlayerControls.validChannelWindow(Integer.MAX_VALUE, 2, Integer.MAX_VALUE));
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
