package com.xandeflix.prebuilt.player;

/** Changes only the existing player; retained volume is per session, in RAM. */
final class MobilePipActionState {
    interface Port { float volume(); void volume(float value); boolean playing(); void play(); void pause(); }
    private final Port port;
    private final boolean live;
    private float audibleVolume = 1f;
    private boolean closed;
    MobilePipActionState(Port port, boolean live) { this.port = port; this.live = live; }
    boolean activeIcon() { return live ? port.volume() > 0f : port.playing(); }
    void toggle() {
        if (closed) return;
        if (live) {
            float volume = port.volume();
            if (volume > 0f) { audibleVolume = volume; port.volume(0f); }
            else port.volume(audibleVolume);
        } else if (port.playing()) port.pause(); else port.play();
    }
    void close() { closed = true; }
}
