package com.xandeflix.prebuilt;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import org.junit.Test;
import static org.junit.Assert.*;

public class PhoneUiOrientationPolicyTest {
    @Test public void phoneUiIsPortraitInBothPhysicalOrientations() {
        for (int size : new int[]{320, 360, 599}) {
            assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
                    MainActivity.phoneUiOrientation(size, Configuration.UI_MODE_TYPE_NORMAL, false));
        }
    }
    @Test public void onlyPhoneFullscreenUsesSensorLandscape() {
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE,
                MainActivity.phoneUiOrientation(360, Configuration.UI_MODE_TYPE_NORMAL, true));
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT,
                MainActivity.phoneUiOrientation(360, Configuration.UI_MODE_TYPE_NORMAL, false));
    }
    @Test public void tabletsAreNotForcedInUiOrFullscreen() {
        for (int size : new int[]{600, 800}) for (boolean fullscreen : new boolean[]{false, true}) {
            assertEquals(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
                    MainActivity.phoneUiOrientation(size, Configuration.UI_MODE_TYPE_NORMAL, fullscreen));
        }
    }
    @Test public void televisionIsExcludedRegardlessOfSizeAndNightBits() {
        for (int size : new int[]{360, 960}) for (boolean fullscreen : new boolean[]{false, true}) {
            assertEquals(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
                    MainActivity.phoneUiOrientation(size, Configuration.UI_MODE_TYPE_TELEVISION
                            | Configuration.UI_MODE_NIGHT_YES, fullscreen));
        }
    }
    @Test public void unknownSizeNeverLocksOrientation() {
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
                MainActivity.phoneUiOrientation(0, Configuration.UI_MODE_TYPE_NORMAL, false));
    }
    @Test public void tabletUsesNormalWindowDimensionsInsteadOfPipBounds() {
        int smallestDp = MainActivity.smallestNormalWindowDp(2560, 1600, 1.875f, 546);
        assertEquals(853, smallestDp);
        assertEquals(853, MainActivity.smallestNormalWindowDp(1600, 2560, 1.875f, 546));
        assertEquals(546, MainActivity.smallestNormalWindowDp(0, 1600, 1.875f, 546));
        assertEquals(360, MainActivity.smallestNormalWindowDp(1080, 2400, 3f, 300));
        assertEquals(360, MainActivity.smallestNormalWindowDp(1080, 2400, Float.NaN, 360));
        assertEquals(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED,
                MainActivity.phoneUiOrientation(smallestDp, Configuration.UI_MODE_TYPE_NORMAL, false));
    }
    @Test public void tabletHostReleasesStaleRequestAndLeavesPhoneAndTvPolicyIntact() {
        assertTrue(MainActivity.shouldReleaseTabletOrientation(853, Configuration.UI_MODE_TYPE_NORMAL,
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        assertTrue(MainActivity.shouldReleaseTabletOrientation(600, Configuration.UI_MODE_TYPE_NORMAL,
                ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE));
        assertFalse(MainActivity.shouldReleaseTabletOrientation(853, Configuration.UI_MODE_TYPE_NORMAL,
                ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED));
        assertFalse(MainActivity.shouldReleaseTabletOrientation(599, Configuration.UI_MODE_TYPE_NORMAL,
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        assertFalse(MainActivity.shouldReleaseTabletOrientation(853, Configuration.UI_MODE_TYPE_TELEVISION,
                ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE));
    }
    @Test public void nullActivityDoesNotThrow() {
        MainActivity.applyPhoneUiOrientation(null, false);
        MainActivity.applyPhoneUiOrientation(null, true);
    }
}
