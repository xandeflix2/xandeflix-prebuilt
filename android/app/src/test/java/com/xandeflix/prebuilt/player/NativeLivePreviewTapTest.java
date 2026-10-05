package com.xandeflix.prebuilt.player;

import android.content.res.Configuration;
import org.junit.Test;
import java.util.Collections;
import java.util.Map;
import static org.junit.Assert.*;

public class NativeLivePreviewTapTest {
    @Test
    public void tabletBothOrientationsAndNightModeUseSamePolicy() {
        assertTrue(NativeAndroidPlayerPlugin.isTouchPreviewTapEnabled(600, Configuration.UI_MODE_TYPE_NORMAL));
        assertTrue(NativeAndroidPlayerPlugin.isTouchPreviewTapEnabled(800,
                Configuration.UI_MODE_TYPE_NORMAL | Configuration.UI_MODE_NIGHT_YES));
    }

    @Test
    public void phoneCanTapInlineButUndefinedSizeDoesNotAcquireGesture() {
        assertTrue(NativeAndroidPlayerPlugin.isTouchPreviewTapEnabled(360, Configuration.UI_MODE_TYPE_NORMAL));
        assertTrue(NativeAndroidPlayerPlugin.isTouchPreviewTapEnabled(599, Configuration.UI_MODE_TYPE_NORMAL));
        assertFalse(NativeAndroidPlayerPlugin.isTouchPreviewTapEnabled(0, Configuration.UI_MODE_TYPE_NORMAL));
    }

    @Test
    public void televisionNeverAcquiresTabletGestureEvenOnLargeScreen() {
        assertFalse(NativeAndroidPlayerPlugin.isTouchPreviewTapEnabled(960,
                Configuration.UI_MODE_TYPE_TELEVISION | Configuration.UI_MODE_NIGHT_YES));
    }

    @Test
    public void tapPayloadContainsOnlyOpaquePreviewId() {
        Map<String, Object> payload = NativeAndroidPlayerPlugin.buildPreviewTapData("preview-fixture", true, false);
        assertEquals(Collections.singleton("previewId"), payload.keySet());
        assertEquals("preview-fixture", payload.get("previewId"));
    }

    @Test
    public void inactiveOrFullscreenCannotEmitTapRequest() {
        assertTrue(NativeAndroidPlayerPlugin.buildPreviewTapData("preview-fixture", false, false).isEmpty());
        assertTrue(NativeAndroidPlayerPlugin.buildPreviewTapData("preview-fixture", true, true).isEmpty());
    }

    @Test
    public void missingPreviewIdCannotEmitTapRequest() {
        assertTrue(NativeAndroidPlayerPlugin.buildPreviewTapData(null, true, false).isEmpty());
        assertTrue(NativeAndroidPlayerPlugin.buildPreviewTapData("", true, false).isEmpty());
    }
}
