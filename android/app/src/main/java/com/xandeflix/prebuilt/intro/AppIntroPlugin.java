package com.xandeflix.prebuilt.intro;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.xandeflix.prebuilt.MainActivity;
import java.util.ArrayList;
import java.util.List;

/** Read-only completion gate; accepts no media URL, auth or catalog payload. */
@CapacitorPlugin(name = "AppIntro")
public class AppIntroPlugin extends Plugin {
    private final List<PluginCall> pending = new ArrayList<>();
    @PluginMethod public void ready(PluginCall call) {
        if (getActivity() == null) { resolve(call, "LIFECYCLE"); return; }
        getActivity().runOnUiThread(() -> {
            if (!(getActivity() instanceof MainActivity)) { resolve(call, "NOT_SUPPORTED"); return; }
            MainActivity owner = (MainActivity) getActivity();
            if (owner.isAppIntroComplete()) { resolve(call, owner.appIntroReason()); return; }
            if (pending.size() >= 8) { call.reject("INTRO_WAIT_LIMIT"); return; }
            pending.add(call);
            owner.whenAppIntroComplete(() -> completePending(owner.appIntroReason()));
        });
    }
    private void resolve(PluginCall call, String reason) { JSObject result = new JSObject(); result.put("reason", reason); call.resolve(result); }
    private void completePending(String reason) {
        List<PluginCall> calls = new ArrayList<>(pending); pending.clear();
        for (PluginCall call : calls) resolve(call, reason);
    }
    @Override protected void handleOnDestroy() {
        completePending("LIFECYCLE");
        super.handleOnDestroy();
    }
}
