package com.xandeflix.prebuilt.player;

/** Geometry and bounded seek math, independent from Android event delivery. */
final class VodSeekGesturePolicy {
    static final int NONE = 0;
    static final int BACK = -1;
    static final int FORWARD = 1;
    static final long STEP_MS = 10000L;

    static boolean isVod(String kind) {
        return "movie".equalsIgnoreCase(kind) || "series".equalsIgnoreCase(kind);
    }

    static int side(float x, float width) {
        if (Float.isNaN(x) || Float.isInfinite(x) || Float.isNaN(width)
                || Float.isInfinite(width) || width <= 0 || x < 0 || x >= width) return NONE;
        return x < width / 2f ? BACK : x > width / 2f ? FORWARD : NONE;
    }

    static int sameSide(float firstX, float secondX, float width) {
        int first = side(firstX, width);
        return first != NONE && first == side(secondX, width) ? first : NONE;
    }

    static long target(long position, long duration, int direction) {
        if (position < 0 || duration <= 0 || position > duration
                || (direction != BACK && direction != FORWARD)) return -1;
        return direction == BACK ? Math.max(0, position - STEP_MS)
                : position + Math.min(STEP_MS, duration - position);
    }
}
