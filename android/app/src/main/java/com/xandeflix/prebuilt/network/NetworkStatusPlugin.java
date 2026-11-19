package com.xandeflix.prebuilt.network;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Read-only OS capabilities. No IP/SSID, probe, binding or network request. */
@CapacitorPlugin(name = "NetworkStatus")
public final class NetworkStatusPlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private ConnectivityManager.NetworkCallback callback;
    private volatile boolean watching;
    private volatile boolean blocked;
    private final Runnable publish = () -> { if (watching) notifyListeners("networkStatusChanged", snapshot()); };

    public static String transport(boolean connected, boolean vpn, boolean ethernet, boolean wifi, boolean cellular) {
        if (!connected) return "none";
        if (vpn) return "vpn";
        if (ethernet) return "ethernet";
        if (wifi) return "wifi";
        return cellular ? "cellular" : "other";
    }
    public static boolean validated(boolean connected, boolean internet, boolean validated, boolean captive) {
        return connected && internet && validated && !captive;
    }
    private ConnectivityManager manager() {
        return (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
    }
    private JSObject snapshot() {
        JSObject result = new JSObject();
        try {
            ConnectivityManager cm = manager();
            if (cm == null) throw new IllegalStateException();
            Network active = cm.getActiveNetwork();
            NetworkCapabilities caps = active == null ? null : cm.getNetworkCapabilities(active);
            if (active != null && caps == null) throw new IllegalStateException();
            boolean connected = caps != null;
            boolean captive = connected && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_CAPTIVE_PORTAL);
            result.put("available", true); result.put("connected", connected);
            result.put("validated", !blocked && validated(connected, connected && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET), connected && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED), captive));
            result.put("captive", captive);
            result.put("transport", transport(connected,
                    connected && caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN),
                    connected && caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET),
                    connected && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI),
                    connected && caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)));
        } catch (RuntimeException ignored) { result.put("available", false); }
        return result;
    }
    @PluginMethod public void getStatus(PluginCall call) { call.resolve(snapshot()); }
    private void changed() {
        // Read the current default network outside NetworkCallback, after capability updates settle.
        handler.removeCallbacks(publish); if (watching) handler.postDelayed(publish, 100);
    }
    @PluginMethod public synchronized void startWatch(PluginCall call) {
        if (!watching) {
            callback = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network network) { blocked = false; changed(); }
                @Override public void onLost(Network network) { changed(); }
                @Override public void onCapabilitiesChanged(Network network, NetworkCapabilities caps) { changed(); }
                @Override public void onBlockedStatusChanged(Network network, boolean value) { blocked = value; changed(); }
            };
            try {
                watching = true;
                if (Build.VERSION.SDK_INT >= 24) manager().registerDefaultNetworkCallback(callback);
                else manager().registerNetworkCallback(new NetworkRequest.Builder().build(), callback);
            } catch (RuntimeException ignored) { watching = false; callback = null; }
        }
        JSObject result = snapshot(); result.put("watching", watching); call.resolve(result);
    }
    private synchronized void stop() {
        watching = false; handler.removeCallbacks(publish);
        if (callback != null) { try { manager().unregisterNetworkCallback(callback); } catch (RuntimeException ignored) {} callback = null; }
    }
    @PluginMethod public void stopWatch(PluginCall call) { stop(); call.resolve(); }
    @Override protected void handleOnDestroy() { stop(); super.handleOnDestroy(); }
}
