package com.xandeflix.prebuilt.player;

import org.junit.Test;
import java.util.List;
import static org.junit.Assert.*;

public class NativeWatchProgressJournalTest {
    @Test public void preservesExactPausePositionAndCompletionAfterRelease() {
        String value=NativeWatchProgressJournal.record("","watch-1",3300123,7200000,false,1000);
        List<NativeWatchProgressJournal.Event> events=NativeWatchProgressJournal.decode(value);
        assertEquals(3300123,events.get(0).positionMs);
        value=NativeWatchProgressJournal.record(value,"watch-1",7200000,7200000,true,2000);
        value=NativeWatchProgressJournal.record(value,"watch-1",0,0,false,3000);
        assertTrue(NativeWatchProgressJournal.decode(value).get(0).ended);
        assertEquals(7200000,NativeWatchProgressJournal.decode(value).get(0).positionMs);
    }
    @Test public void acceptsBackwardSeekButRejectsStaleEventAndKeepsOnlyFourNonces() {
        String value=NativeWatchProgressJournal.record("","watch",3000,5000,false,1000);
        value=NativeWatchProgressJournal.record(value,"watch",2000,5000,false,2000);
        value=NativeWatchProgressJournal.record(value,"watch",4000,5000,false,1500);
        assertEquals(2000,NativeWatchProgressJournal.decode(value).get(0).positionMs);
        for(int n=0;n<20;n++)value=NativeWatchProgressJournal.record(value,"watch-"+n,2000,5000,false,3000+n);
        assertEquals(4,NativeWatchProgressJournal.decode(value).size());
        assertTrue(value.length()<2048);
        assertEquals("watch-19",NativeWatchProgressJournal.decode(value).get(3).playbackId);
    }
    @Test public void rejectsSecretsMalformedOverflowAndNegativeCheckpoints() {
        for(String value:new String[]{"https://source.invalid/|1000|2000|3000|0","watch|NaN|2|3|0","watch|-1|2|3|0","watch|1|2|0|0","watch|1|2|3|yes","watch|9223372036854775808|2|3|0"})
            assertTrue(NativeWatchProgressJournal.decode(value).isEmpty());
        assertEquals("",NativeWatchProgressJournal.record("","https://source.invalid/",1000,2000,false,3000));
        String value=NativeWatchProgressJournal.record("","watch",1000,-1,false,3000);
        assertEquals(0,NativeWatchProgressJournal.decode(value).get(0).durationMs);
        assertFalse(value.contains("https"));
    }
}
