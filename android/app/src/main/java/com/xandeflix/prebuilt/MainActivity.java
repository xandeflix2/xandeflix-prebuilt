package com.xandeflix.prebuilt;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.xandeflix.prebuilt.player.NativePlayerPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativePlayerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
