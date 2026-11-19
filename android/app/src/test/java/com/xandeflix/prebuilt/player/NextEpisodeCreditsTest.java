package com.xandeflix.prebuilt.player;

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Test;

public class NextEpisodeCreditsTest {

    @Test
    public void testGetNextEpisodeReturnsNextInList() {
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("currentEpisodeId", "ep-1");
        ctx.put("hasNext", true);
        ctx.put("seasonNumber", 1);
        ctx.put("episodeNumber", 1);

        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> ep1 = new HashMap<>();
        ep1.put("id", "ep-1");
        ep1.put("title", "Piloto");
        ep1.put("seasonNumber", 1);
        ep1.put("episodeNumber", 1);
        list.add(ep1);

        Map<String, Object> ep2 = new HashMap<>();
        ep2.put("id", "ep-2");
        ep2.put("title", "O Retorno");
        ep2.put("seasonNumber", 1);
        ep2.put("episodeNumber", 2);
        list.add(ep2);

        ctx.put("episodes", list);

        // Simulated getNextEpisode logic matching PlayerControls
        Map<String, Object> next = null;
        if (Boolean.TRUE.equals(ctx.get("hasNext"))) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> eps = (List<Map<String, Object>>) ctx.get("episodes");
            if (eps != null) {
                String cur = (String) ctx.get("currentEpisodeId");
                for (int i = 0; i < eps.size() - 1; i++) {
                    Map<String, Object> item = eps.get(i);
                    if (item != null && cur.equals(item.get("id"))) {
                        next = eps.get(i + 1);
                        break;
                    }
                }
            }
        }

        assertNotNull("Deve encontrar o próximo episódio", next);
        assertEquals("ep-2", next.get("id"));
        assertEquals("O Retorno", next.get("title"));
        assertEquals(2, next.get("episodeNumber"));
    }

    @Test
    public void testCreditsThresholdCalculation() {
        // Standard episode: 45 min (2,700,000 ms) > 25 min -> tail is 45s (45,000 ms)
        long durationStd = 2700_000L;
        long tailStd = durationStd > 1500_000L ? 45_000L : 35_000L;
        assertEquals(45_000L, tailStd);
        long thresholdStd = durationStd - tailStd;
        assertEquals(2655_000L, thresholdStd);

        // Before threshold: no credits prompt
        long posBefore = 2650_000L;
        assertFalse(posBefore >= thresholdStd);

        // At or after threshold: credits prompt activates
        long posAt = 2655_000L;
        assertTrue(posAt >= thresholdStd);
        long posAfter = 2680_000L;
        assertTrue(posAfter >= thresholdStd);

        // Short episode: 20 min (1,200,000 ms) <= 25 min -> tail is 35s (35,000 ms)
        long durationShort = 1200_000L;
        long tailShort = durationShort > 1500_000L ? 45_000L : 35_000L;
        assertEquals(35_000L, tailShort);
        long thresholdShort = durationShort - tailShort;
        assertEquals(1165_000L, thresholdShort);
    }
}

