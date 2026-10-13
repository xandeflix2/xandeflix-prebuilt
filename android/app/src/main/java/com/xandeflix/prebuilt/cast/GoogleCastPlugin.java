package com.xandeflix.prebuilt.cast;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name="GoogleCast")
public final class GoogleCastPlugin extends Plugin {
    @PluginMethod public void status(PluginCall call){getActivity().runOnUiThread(()->{JSObject data=new JSObject();data.put("mobile",CastController.mobile(getContext()));data.put("connected",CastController.get().connected());data.put("active",CastController.get().active());call.resolve(data);});}
    @PluginMethod public void picker(PluginCall call){getActivity().runOnUiThread(()->{CastController.get().picker(getActivity());call.resolve();});}
    @PluginMethod public void renew(PluginCall call){getActivity().runOnUiThread(()->{CastController.get().renew();call.resolve();});}
    @PluginMethod public void stop(PluginCall call){getActivity().runOnUiThread(()->{if(Boolean.TRUE.equals(call.getBoolean("returnLocal",false)))CastController.get().returnLocal();else CastController.get().clear();call.resolve();});}
    @Override public void load(){CastController.get().observe(active->{JSObject data=new JSObject();data.put("active",active);data.put("connected",CastController.get().connected());notifyListeners("state",data);});}
    @Override protected void handleOnDestroy(){CastController.get().clear();CastController.get().observe(null);super.handleOnDestroy();}
}
