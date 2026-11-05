package com.xandeflix.prebuilt.intro;

/** Android-free policy shared by the native controller and its JVM tests. */
public final class AppIntroPolicy {
    private AppIntroPolicy() {}
    public static final long FIRST_FRAME_TIMEOUT_MS = 4000;
    public static final long TOTAL_TIMEOUT_MS = 13000;
    public static final long FALLBACK_MS = 250;
    public enum Media { VERTICAL, HORIZONTAL }
    public enum State { WAITING, PREPARING, PLAYING, FINISHED }
    public enum Reason { NOT_ELIGIBLE, ENDED, SKIPPED, LIFECYCLE, NEW_INTENT, DECODER_ERROR,
        RESOURCE_UNAVAILABLE, SURFACE_UNAVAILABLE, FIRST_FRAME_TIMEOUT, TOTAL_TIMEOUT, LOW_MEMORY, INITIALIZATION_ERROR }

    public static final class ProcessAdmission {
        private boolean decided;
        public synchronized boolean claim(boolean launcherMain, boolean restored, boolean hasUri) {
            if (decided) return false;
            decided = true;
            return launcherMain && !restored && !hasUri;
        }
    }
    public static Media media(boolean television, int windowWidth, int windowHeight) {
        if (windowWidth <= 0 || windowHeight <= 0) throw new IllegalArgumentException("WINDOW_NOT_READY");
        return television || windowWidth >= windowHeight ? Media.HORIZONTAL : Media.VERTICAL;
    }
    public static boolean audioAllowed(boolean normalRinger, int mediaVolume, boolean musicActive, boolean normalMode) {
        return normalRinger && mediaVolume > 0 && !musicActive && normalMode;
    }
    public static boolean skipKey(int code) { return code == 4 || code == 23 || code == 66 || code == 160; }
    public static final class KeyBarrier {
        private int held = -1;
        public boolean consume(boolean introActive, int action, int code, int repeatCount) {
            if (held == code) {
                if (action == 1) { held = -1; return true; }
                // A lost key-up while backgrounded must not eat the next distinct press.
                if (!introActive && action == 0 && repeatCount == 0) { held = -1; return false; }
                return true;
            }
            if (!introActive || !skipKey(code)) return false;
            if (action == 0) held = code;
            return true;
        }
    }
    public static final class Session {
        private State state;
        private Media selected;
        private Reason reason = Reason.NOT_ELIGIBLE;
        private boolean silentAudioFallbackTried;
        public Session(boolean eligible) { state = eligible ? State.WAITING : State.FINISHED; }
        public boolean prepare(boolean tv, int width, int height) {
            if (state != State.WAITING) return false;
            selected = media(tv, width, height);
            state = State.PREPARING;
            return true;
        }
        public void firstFrame() { if (state == State.PREPARING) state = State.PLAYING; }
        public boolean finish(Reason result) {
            if (state == State.FINISHED) return false;
            state = State.FINISHED; reason = result; return true;
        }
        public State state() { return state; }
        public Media selected() { return selected; }
        public Reason reason() { return reason; }
        public boolean active() { return state != State.FINISHED; }
        public boolean claimSilentAudioFallback() {
            if (!active() || silentAudioFallbackTried) return false;
            silentAudioFallbackTried = true; return true;
        }
    }
}
