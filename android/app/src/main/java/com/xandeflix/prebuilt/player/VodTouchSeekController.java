package com.xandeflix.prebuilt.player;

import android.graphics.Rect;
import android.os.SystemClock;
import android.view.GestureDetector;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.widget.SeekBar;
import androidx.media3.ui.PlayerView;
import androidx.media3.ui.TimeBar;

/** Owns only image-area touch streams; controls retain their original dispatch. */
final class VodTouchSeekController {
    interface Enabled { boolean get(); }
    interface Seek { void accept(int direction); }
    private final PlayerView view;
    private final Enabled enabled;
    private final GestureDetector detector;
    private final Rect bounds = new Rect();
    private final int touchSlop;
    private boolean captured, aborted, doubleValid;
    private float firstX, secondX, secondY;

    VodTouchSeekController(PlayerView view, Enabled enabled, Seek seek) {
        this.view = view;
        this.enabled = enabled;
        touchSlop = ViewConfiguration.get(view.getContext()).getScaledTouchSlop();
        detector = new GestureDetector(view.getContext(), new GestureDetector.SimpleOnGestureListener() {
            @Override public boolean onDown(MotionEvent event) { return true; }
            @Override public boolean onScroll(MotionEvent first, MotionEvent current, float dx, float dy) {
                doubleValid = false;
                return true;
            }
            @Override public boolean onSingleTapConfirmed(MotionEvent event) {
                if (enabled.get()) view.performClick();
                return true;
            }
            @Override public boolean onDoubleTap(MotionEvent event) {
                firstX = event.getRawX();
                doubleValid = true;
                return true;
            }
            @Override public boolean onDoubleTapEvent(MotionEvent event) {
                int action = event.getActionMasked();
                if (action == MotionEvent.ACTION_DOWN) {
                    secondX = event.getRawX();
                    secondY = event.getRawY();
                } else if (action == MotionEvent.ACTION_MOVE
                        && (Math.abs(event.getRawX() - secondX) > touchSlop
                        || Math.abs(event.getRawY() - secondY) > touchSlop)) {
                    doubleValid = false;
                } else if (action == MotionEvent.ACTION_UP) {
                    boolean valid = doubleValid;
                    doubleValid = false;
                    if (valid && enabled.get() && event.getPointerCount() == 1
                            && Math.abs(event.getRawX() - secondX) <= touchSlop
                            && Math.abs(event.getRawY() - secondY) <= touchSlop
                            && event.getEventTime() - event.getDownTime() <= ViewConfiguration.getLongPressTimeout()
                            && view.getGlobalVisibleRect(bounds)) {
                        int direction = VodSeekGesturePolicy.sameSide(firstX - bounds.left,
                                secondX - bounds.left, bounds.width());
                        if (direction != VodSeekGesturePolicy.NONE) seek.accept(direction);
                    }
                } else if (action == MotionEvent.ACTION_CANCEL) doubleValid = false;
                return true;
            }
        });
        detector.setIsLongpressEnabled(false);
    }

    boolean dispatch(MotionEvent event) {
        if (event == null) return false;
        int action = event.getActionMasked();
        if (action == MotionEvent.ACTION_DOWN) {
            boolean primary = !event.isFromSource(InputDevice.SOURCE_MOUSE)
                    || (event.getButtonState() & MotionEvent.BUTTON_PRIMARY) != 0;
            boolean pointer = event.isFromSource(InputDevice.SOURCE_TOUCHSCREEN)
                    || event.isFromSource(InputDevice.SOURCE_MOUSE) || event.isFromSource(InputDevice.SOURCE_STYLUS);
            if (!primary || !pointer || !enabled.get() || event.getPointerCount() != 1
                    || !view.getGlobalVisibleRect(bounds) || !bounds.contains((int)event.getRawX(), (int)event.getRawY())
                    || overControl(view, event.getRawX(), event.getRawY())) {
                cancel();
                return false;
            }
            captured = true;
            aborted = false;
        }
        if (!captured) return false;
        if (event.getPointerCount() > 1 || !enabled.get()) {
            cancelDetector();
            aborted = true;
        }
        if (!aborted) detector.onTouchEvent(event);
        if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) captured = false;
        return true;
    }

    private boolean overControl(View node, float x, float y) {
        Rect hit = new Rect();
        if (node.getVisibility() != View.VISIBLE || !node.getGlobalVisibleRect(hit)
                || !hit.contains((int)x, (int)y)) return false;
        if (node != view && (node.isClickable() || node instanceof SeekBar || node instanceof TimeBar)) return true;
        if (node instanceof ViewGroup) {
            ViewGroup group = (ViewGroup)node;
            for (int i = group.getChildCount() - 1; i >= 0; i--)
                if (overControl(group.getChildAt(i), x, y)) return true;
        }
        return false;
    }

    void cancel() {
        cancelDetector();
        captured = aborted = doubleValid = false;
    }

    private void cancelDetector() {
        long now = SystemClock.uptimeMillis();
        MotionEvent cancel = MotionEvent.obtain(now, now, MotionEvent.ACTION_CANCEL, 0, 0, 0);
        detector.onTouchEvent(cancel);
        cancel.recycle();
        doubleValid = false;
    }
}
