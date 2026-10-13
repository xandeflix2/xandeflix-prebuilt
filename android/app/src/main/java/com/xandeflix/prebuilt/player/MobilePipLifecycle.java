package com.xandeflix.prebuilt.player;

/** Visibility, not a potentially stale PiP flag, is the playback boundary. */
public final class MobilePipLifecycle {
    private boolean enteredPip;
    private boolean closed;

    public void modeChanged(boolean pip) {
        // A false callback can precede onStop on dismissal. Only onResume
        // proves that the user actually returned to a visible Activity.
        if (pip) enteredPip = true;
    }

    public void resumed() { enteredPip = false; }
    public void close() { closed = true; }

    public void stopped(boolean fullscreenPlayer, boolean finishing,
            boolean changingConfigurations, boolean remotePlayback,
            Runnable pauseLocal, Runnable releaseLocal) {
        if (closed) return;
        boolean release = !changingConfigurations && !remotePlayback
                && (fullscreenPlayer || finishing || enteredPip);
        if (release) closed = true;
        try {
            pauseLocal.run();
        } finally {
            if (release) releaseLocal.run();
        }
    }
}
