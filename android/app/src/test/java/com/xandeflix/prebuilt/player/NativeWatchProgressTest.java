package com.xandeflix.prebuilt.player;
import org.junit.Test;
import java.util.*;
import static org.junit.Assert.*;

public class NativeWatchProgressTest {
    @Test public void progressContainsOnlyNonceNumbersAndCompletion() {
        Map<String,Object> data=NativeAndroidPlayerPlugin.buildProgressData("watch-123",123456,600000,true,1000);
        assertEquals(new HashSet<>(Arrays.asList("playbackId","positionMs","durationMs","ended","observedAt")),data.keySet());
        assertEquals(123456L,data.get("positionMs"));assertEquals(600000L,data.get("durationMs"));assertEquals(true,data.get("ended"));
        assertEquals(0L,NativeAndroidPlayerPlugin.buildProgressData("watch",-1,-1,false,1000).get("positionMs"));
        assertTrue(NativeAndroidPlayerPlugin.buildProgressData("https://source.invalid/",1,1,false,1).isEmpty());
        assertFalse(NativeAndroidPlayerPlugin.validPlaybackId(null));
    }
}
