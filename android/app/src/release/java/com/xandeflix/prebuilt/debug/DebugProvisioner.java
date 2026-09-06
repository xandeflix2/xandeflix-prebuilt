package com.xandeflix.prebuilt.debug;

import android.content.Intent;
import com.getcapacitor.BridgeActivity;

/**
 * Xandeflix Prebuilt — Release Provisioner Stub (Gate G11A / Production)
 *
 * Em builds de produção (Release), esta classe é um estrito NO-OP compilado.
 *
 * Princípios:
 * - RELEASE_TEST_TRUST_KEY_PRESENT = NAO
 * - RELEASE_DEBUG_IMPORT_ENTRYPOINT_PRESENT = NAO
 * - UNSIGNED_PRODUCTION_IMPORT_ALLOWED = NAO
 * - PRODUCTION_IMPORT_BYPASS = NAO
 */
public class DebugProvisioner {

    public static void handleIntent(BridgeActivity activity, Intent intent) {
        // STRICT NO-OP IN PRODUCTION RELEASE BUILDS
    }
}
