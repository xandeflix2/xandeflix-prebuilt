package com.xandeflix.prebuilt.player;
import org.junit.Test;
import static org.junit.Assert.*;

public class LivePlayerControlsTest {
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
