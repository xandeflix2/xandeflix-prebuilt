package com.xandeflix.prebuilt.player;
import org.junit.Test;
import static org.junit.Assert.*;

public class EpisodeNavigationStateTest {
    @Test public void dialogDismissUsesResumedActivityAndClosedPipNeverReopens() {
        EpisodeNavigationState state=new EpisodeNavigationState();state.started("watch1");state.request("watch1","token1");
        assertTrue(state.acceptsVisible("watch1","token1",true,false));
        assertTrue(state.acceptsVisible("watch1","token1",false,true));
        assertFalse(state.acceptsVisible("watch1","token1",false,false));
        state.close();assertFalse(state.acceptsVisible("watch1","token1",true,true));
    }
    @Test public void onlyActivePlaybackCanRequestOnce() {
        EpisodeNavigationState state=new EpisodeNavigationState();
        assertFalse(state.request("old","token1"));state.started("watch1");
        assertFalse(state.request("watch2","token1"));assertFalse(state.request("watch1","https://invalid"));
        assertTrue(state.request("watch1","token1"));assertTrue(state.pending());
        assertFalse(state.request("watch1","token2"));assertFalse(state.accepts("watch1","token2"));
        assertFalse(state.accepts("watch2","token1"));assertTrue(state.accepts("watch1","token1"));
    }
    @Test public void closedPipOrBackCannotAcceptDelayedReply() {
        EpisodeNavigationState state=new EpisodeNavigationState();state.started("watch1");state.request("watch1","token1");
        state.close();state.close();assertFalse(state.pending());assertFalse(state.accepts("watch1","token1"));
        assertFalse(state.request("watch1","token2"));
    }
    @Test public void successfulReplacementInvalidatesOldRequestAndAllowsNext() {
        EpisodeNavigationState state=new EpisodeNavigationState();state.started("watch1");state.request("watch1","token1");
        state.started("watch2");assertFalse(state.accepts("watch1","token1"));assertFalse(state.pending());
        assertTrue(state.request("watch2","token2"));assertTrue(state.accepts("watch2","token2"));
    }
}
