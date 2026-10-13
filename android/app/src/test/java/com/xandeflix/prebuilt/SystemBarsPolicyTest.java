package com.xandeflix.prebuilt;

import android.content.res.Configuration;
import org.junit.Test;
import static org.junit.Assert.*;

public class SystemBarsPolicyTest {
    @Test public void fullscreenVideoHidesBarsOnHandheldsInBothThemes() {
        for (int night : new int[]{Configuration.UI_MODE_NIGHT_NO, Configuration.UI_MODE_NIGHT_YES}) {
            assertTrue(MainActivity.shouldUseImmersiveSystemBars(Configuration.UI_MODE_TYPE_NORMAL | night, true));
            assertFalse(MainActivity.shouldUseImmersiveSystemBars(Configuration.UI_MODE_TYPE_NORMAL | night, false));
        }
    }
    @Test public void fullscreenAndReturnKeepTelevisionImmersive() {
        assertTrue(MainActivity.shouldUseImmersiveSystemBars(Configuration.UI_MODE_TYPE_TELEVISION, true));
        assertTrue(MainActivity.shouldUseImmersiveSystemBars(Configuration.UI_MODE_TYPE_TELEVISION, false));
    }
    @Test public void handheldsKeepBarsInDayAndNightModes() {
        for (int night : new int[]{0, Configuration.UI_MODE_NIGHT_NO, Configuration.UI_MODE_NIGHT_YES}) {
            assertFalse(MainActivity.shouldUseImmersiveSystemBars(Configuration.UI_MODE_TYPE_NORMAL | night));
        }
    }
    @Test public void televisionKeepsImmersiveModeWithComposedFlags() {
        for (int night : new int[]{0, Configuration.UI_MODE_NIGHT_NO, Configuration.UI_MODE_NIGHT_YES}) {
            assertTrue(MainActivity.shouldUseImmersiveSystemBars(Configuration.UI_MODE_TYPE_TELEVISION | night));
        }
    }
    @Test public void unknownConfigurationDoesNotHideSystemNavigation() {
        assertFalse(MainActivity.shouldUseImmersiveSystemBars(0));
    }
    @Test public void desktopAndOtherModesDoNotBecomeTelevisions() {
        for (int mode : new int[]{Configuration.UI_MODE_TYPE_DESK, Configuration.UI_MODE_TYPE_CAR,
                Configuration.UI_MODE_TYPE_WATCH, Configuration.UI_MODE_TYPE_VR_HEADSET}) {
            assertFalse(MainActivity.shouldUseImmersiveSystemBars(mode | Configuration.UI_MODE_NIGHT_YES));
        }
    }
}
