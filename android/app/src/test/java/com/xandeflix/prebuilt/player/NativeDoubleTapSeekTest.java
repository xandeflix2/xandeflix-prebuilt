package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;
import androidx.media3.common.C;
import androidx.media3.common.Player;
import java.lang.reflect.Proxy;
import org.junit.Test;

public class NativeDoubleTapSeekTest {
    private static final class Playback {
        long position = 20000, duration = 60000, sought = -1;
        boolean seekable = true, command = true, ad;
        int seeks, playbackChanges;
        final Player player = (Player)Proxy.newProxyInstance(Player.class.getClassLoader(), new Class<?>[]{Player.class}, (proxy, method, args) -> {
            switch (method.getName()) {
                case "getCurrentPosition": return position;
                case "getDuration": return duration;
                case "isCurrentMediaItemSeekable": return seekable;
                case "isPlayingAd": return ad;
                case "isCommandAvailable":
                    assertEquals(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM, ((Integer)args[0]).intValue());
                    return command;
                case "seekTo": sought = (Long)args[0]; position = sought; seeks++; return null;
                case "play": case "pause": case "setPlayWhenReady": playbackChanges++; return null;
                default:
                    Class<?> type = method.getReturnType();
                    if (type == boolean.class) return false;
                    if (type == long.class) return 0L;
                    if (type == int.class) return 0;
                    if (type == float.class) return 0f;
                    return null;
            }
        });
    }

    @Test public void sideUsesPhysicalHalvesOnEverySize() {
        for (float width : new float[]{320, 777, 1000, 1920}) {
            assertEquals(VodSeekGesturePolicy.BACK, VodSeekGesturePolicy.side(width / 4, width));
            assertEquals(VodSeekGesturePolicy.FORWARD, VodSeekGesturePolicy.side(width * 3 / 4, width));
            assertEquals(VodSeekGesturePolicy.NONE, VodSeekGesturePolicy.side(width / 2, width));
        }
    }

    @Test public void geometryRejectsInvalidAndOutOfBoundsCoordinates() {
        for (float x : new float[]{Float.NaN, Float.POSITIVE_INFINITY, -1, 1000})
            assertEquals(0, VodSeekGesturePolicy.side(x, 1000));
        for (float width : new float[]{0, -1, Float.NaN, Float.POSITIVE_INFINITY})
            assertEquals(0, VodSeekGesturePolicy.side(1, width));
    }

    @Test public void pairMustStayOnSameSide() {
        assertEquals(-1, VodSeekGesturePolicy.sameSide(100, 110, 1000));
        assertEquals(1, VodSeekGesturePolicy.sameSide(800, 810, 1000));
        assertEquals(0, VodSeekGesturePolicy.sameSide(499, 501, 1000));
        assertEquals(0, VodSeekGesturePolicy.sameSide(500, 810, 1000));
        assertEquals(0, VodSeekGesturePolicy.sameSide(-1, 100, 1000));
    }

    @Test public void mathClampsBeginningAndEndWithoutOverflow() {
        assertEquals(0, VodSeekGesturePolicy.target(3000, 60000, -1));
        assertEquals(60000, VodSeekGesturePolicy.target(59000, 60000, 1));
        assertEquals(Long.MAX_VALUE, VodSeekGesturePolicy.target(Long.MAX_VALUE - 1, Long.MAX_VALUE, 1));
        assertEquals(Long.MAX_VALUE - 10000, VodSeekGesturePolicy.target(Long.MAX_VALUE, Long.MAX_VALUE, -1));
    }

    @Test public void invalidTimelineOrDirectionIsRejected() {
        assertEquals(-1, VodSeekGesturePolicy.target(-1, 60000, 1));
        assertEquals(-1, VodSeekGesturePolicy.target(10, C.TIME_UNSET, 1));
        assertEquals(-1, VodSeekGesturePolicy.target(10, 0, 1));
        assertEquals(-1, VodSeekGesturePolicy.target(60001, 60000, 1));
        assertEquals(-1, VodSeekGesturePolicy.target(10000, 60000, 0));
        assertEquals(-1, VodSeekGesturePolicy.target(10000, 60000, 2));
    }

    @Test public void actualMovieAndSeriesSeekForwardTenSecondsOnce() {
        for (String kind : new String[]{"movie", "series"}) {
            Playback p = new Playback();
            assertEquals(10000, NativePlayerActivity.seekFromDoubleTap(kind, 1, p.player));
            assertEquals(30000, p.sought);
            assertEquals(1, p.seeks);
            assertEquals(0, p.playbackChanges);
        }
    }

    @Test public void actualSeekBackTenSecondsPreservesPlayPause() {
        Playback p = new Playback();
        assertEquals(-10000, NativePlayerActivity.seekFromDoubleTap("series", -1, p.player));
        assertEquals(10000, p.sought);
        assertEquals(1, p.seeks);
        assertEquals(0, p.playbackChanges);
    }

    @Test public void actualClampedDeltaIsReturnedForFeedback() {
        Playback p = new Playback(); p.position = 59000;
        assertEquals(1000, NativePlayerActivity.seekFromDoubleTap("movie", 1, p.player));
        assertEquals(60000, p.sought);
        p.position = 3000;
        assertEquals(-3000, NativePlayerActivity.seekFromDoubleTap("movie", -1, p.player));
        assertEquals(0, p.sought);
    }

    @Test public void boundaryDoesNotIssueRedundantSeek() {
        Playback p = new Playback(); p.position = 0;
        assertEquals(0, NativePlayerActivity.seekFromDoubleTap("movie", -1, p.player));
        p.position = p.duration;
        assertEquals(0, NativePlayerActivity.seekFromDoubleTap("movie", 1, p.player));
        assertEquals(0, p.seeks);
    }

    @Test public void liveUnknownKindAndMissingPlayerNeverSeek() {
        Playback p = new Playback();
        for (String kind : new String[]{"live", "trailer", "", null})
            assertEquals(0, NativePlayerActivity.seekFromDoubleTap(kind, 1, p.player));
        assertEquals(0, NativePlayerActivity.seekFromDoubleTap("movie", 1, null));
        assertEquals(0, p.seeks);
    }

    @Test public void nonSeekableUnsupportedAndAdPlayersNeverSeek() {
        Playback p = new Playback(); p.seekable = false;
        assertEquals(0, NativePlayerActivity.seekFromDoubleTap("movie", 1, p.player));
        p.seekable = true; p.command = false;
        assertEquals(0, NativePlayerActivity.seekFromDoubleTap("movie", 1, p.player));
        p.command = true; p.ad = true;
        assertEquals(0, NativePlayerActivity.seekFromDoubleTap("movie", 1, p.player));
        assertEquals(0, p.seeks);
        assertEquals(0, p.playbackChanges);
    }

    @Test public void unknownDurationAndInvalidDirectionNeverSeek() {
        Playback p = new Playback(); p.duration = C.TIME_UNSET;
        assertEquals(0, NativePlayerActivity.seekFromDoubleTap("movie", 1, p.player));
        p.duration = 60000;
        assertEquals(0, NativePlayerActivity.seekFromDoubleTap("movie", 0, p.player));
        assertEquals(0, p.seeks);
    }

    @Test public void successiveCompletedGesturesUseCurrentPosition() {
        Playback p = new Playback();
        assertEquals(10000, NativePlayerActivity.seekFromDoubleTap("movie", 1, p.player));
        assertEquals(10000, NativePlayerActivity.seekFromDoubleTap("movie", 1, p.player));
        assertEquals(40000, p.position);
        assertEquals(2, p.seeks);
        assertEquals(0, p.playbackChanges);
    }
}
