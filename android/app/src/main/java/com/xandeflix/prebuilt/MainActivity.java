package com.xandeflix.prebuilt;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.xandeflix.prebuilt.debug.DebugProvisioner;
import com.xandeflix.prebuilt.player.NativePlayerPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativePlayerPlugin.class);
        super.onCreate(savedInstanceState);
        DebugProvisioner.handleIntent(this, getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        DebugProvisioner.handleIntent(this, intent);
    }
}
