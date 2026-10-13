package com.xandeflix.prebuilt.player;
import org.junit.Test;
import static org.junit.Assert.*;
public final class MobilePipActionStateTest {
    static class PlayerPort implements MobilePipActionState.Port {
        float volume = .37f; boolean playing = true; int plays, pauses;
        public float volume() { return volume; } public void volume(float value) { volume=value; }
        public boolean playing() { return playing; } public void play() { playing=true; plays++; } public void pause() { playing=false; pauses++; }
    }
    @Test public void liveMuteRestoresOriginalVolumeAndNeverPauses() {
        PlayerPort player = new PlayerPort(); MobilePipActionState actions = new MobilePipActionState(player,true);
        assertTrue(actions.activeIcon()); actions.toggle(); assertFalse(actions.activeIcon()); assertEquals(0f,player.volume,0f);
        actions.toggle(); assertEquals(.37f,player.volume,0f); player.volume=.72f; actions.toggle(); actions.toggle(); assertEquals(.72f,player.volume,0f);
        assertEquals(0,player.plays+player.pauses); actions.close(); actions.toggle(); assertEquals(.72f,player.volume,0f);
    }
    @Test public void vodPlayPauseUsesCurrentStateAndDoesNotChangeVolume() {
        PlayerPort player = new PlayerPort(); MobilePipActionState actions = new MobilePipActionState(player,false);
        actions.toggle(); assertFalse(actions.activeIcon()); assertEquals(1,player.pauses);
        actions.toggle(); assertTrue(actions.activeIcon()); assertEquals(1,player.plays); assertEquals(.37f,player.volume,0f);
        player.playing=false; actions.toggle(); assertEquals(2,player.plays); actions.close(); actions.toggle(); assertEquals(1,player.pauses);
    }
}
