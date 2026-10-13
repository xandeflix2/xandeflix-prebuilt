package com.xandeflix.prebuilt.player;

/** Pure policy: no activation, source access or TV behavior changes. */
public final class MobilePipPolicy {
    private MobilePipPolicy() {}
    public static boolean eligible(int sdk, int uiMode, boolean supported,
            boolean playWhenReady, int state, boolean closing) {
        return sdk >= 26 && (uiMode & 0x0f) != 4 && supported && !closing
                && playWhenReady && (state == 2 || state == 3);
    }
}
