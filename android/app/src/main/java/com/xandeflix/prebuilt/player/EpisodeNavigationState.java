package com.xandeflix.prebuilt.player;

/** Correlates one in-flight transition. A late bridge reply cannot reopen a closed player. */
public final class EpisodeNavigationState {
    private String playbackId;
    private String requestId;
    private boolean closed = true;

    public void started(String id) { playbackId = id; requestId = null; closed = false; }
    public boolean request(String id, String token) {
        if (closed || requestId != null || id == null || !id.equals(playbackId)
                || token == null || !token.matches("[A-Za-z0-9_-]{1,64}")) return false;
        requestId = token;
        return true;
    }
    public boolean accepts(String id, String token) {
        return !closed && requestId != null && requestId.equals(token) && playbackId != null && playbackId.equals(id);
    }
    public boolean acceptsVisible(String id,String token,boolean foreground,boolean pip) {
        return (foreground||pip)&&accepts(id,token);
    }
    public boolean pending() { return !closed && requestId != null; }
    public void close() { closed = true; requestId = null; }
}
