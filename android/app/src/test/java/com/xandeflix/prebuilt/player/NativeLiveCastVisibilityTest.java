package com.xandeflix.prebuilt.player;

import org.junit.Test;
import static org.junit.Assert.*;

public class NativeLiveCastVisibilityTest {
    @Test public void inlineAndPipNeverAllowCast() {
        for (boolean pip : new boolean[]{false, true}) {
            assertFalse(NativeAndroidPlayerPlugin.shouldAllowPreviewCast(false, pip));
        }
        assertFalse(NativeAndroidPlayerPlugin.shouldAllowPreviewCast(true, true));
    }

    @Test public void enterTimeoutTouchPipReturnAndExitSequence() {
        assertTrue(NativeAndroidPlayerPlugin.shouldAllowPreviewCast(true, false));
        assertFalse(NativeAndroidPlayerPlugin.shouldAllowPreviewCast(true, true));
        assertTrue(NativeAndroidPlayerPlugin.shouldAllowPreviewCast(true, false));
        assertFalse(NativeAndroidPlayerPlugin.shouldAllowPreviewCast(false, false));
    }
}
