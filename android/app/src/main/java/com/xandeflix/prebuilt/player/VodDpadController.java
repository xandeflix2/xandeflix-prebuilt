package com.xandeflix.prebuilt.player;

import android.view.KeyEvent;
import androidx.media3.common.Player;

/** Hidden VOD shortcuts. Visible controls keep their normal Media3 key routing. */
final class VodDpadController {
    interface Controls {
        boolean visible();
        void showAndFocusPlayPause();
    }

    private int capturedKeys;

    boolean dispatch(int keyCode, int action, int repeatCount, String kind, boolean enabled,
            Player player, Controls controls) {
        int key = keyMask(keyCode);
        if (!VodSeekGesturePolicy.isVod(kind) || key == 0) return false;

        // A fresh press also recovers from a lost UP without stealing visible navigation.
        if (action == KeyEvent.ACTION_DOWN && repeatCount == 0) capturedKeys &= ~key;
        if (action == KeyEvent.ACTION_UP) {
            boolean captured = (capturedKeys & key) != 0;
            capturedKeys &= ~key;
            return captured; // Includes canceled UP; never click a newly focused button.
        }
        if (action != KeyEvent.ACTION_DOWN) return false;

        if ((capturedKeys & key) != 0) {
            if (enabled && player != null && controls != null && !controls.visible()) {
                seek(keyCode, kind, player);
            }
            return true; // Holding OK must not toggle playback or activate a button.
        }
        if (!enabled || player == null || controls == null || controls.visible()) return false;

        capturedKeys |= key;
        if (keyCode == KeyEvent.KEYCODE_DPAD_LEFT || keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) {
            seek(keyCode, kind, player);
        } else {
            // pause(), rather than isPlaying() toggle, also pauses while buffering.
            player.pause();
            controls.showAndFocusPlayPause();
        }
        return true;
    }

    private static void seek(int keyCode, String kind, Player player) {
        if (keyCode == KeyEvent.KEYCODE_DPAD_LEFT || keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) {
            NativePlayerActivity.seekFromDoubleTap(kind,
                    keyCode == KeyEvent.KEYCODE_DPAD_RIGHT
                            ? VodSeekGesturePolicy.FORWARD : VodSeekGesturePolicy.BACK, player);
        }
    }

    private static int keyMask(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_DPAD_LEFT: return 1;
            case KeyEvent.KEYCODE_DPAD_RIGHT: return 2;
            case KeyEvent.KEYCODE_DPAD_CENTER: return 4;
            case KeyEvent.KEYCODE_ENTER: return 8;
            case KeyEvent.KEYCODE_NUMPAD_ENTER: return 16;
            default: return 0;
        }
    }
}
