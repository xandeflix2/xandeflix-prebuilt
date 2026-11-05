package com.xandeflix.prebuilt.network;
import org.junit.Test;
import static org.junit.Assert.*;
public class NetworkStatusPluginTest {
    @Test public void offlineNeverReportsATransport() { assertEquals("none", NetworkStatusPlugin.transport(false,true,true,true,true)); }
    @Test public void wifiAndEthernetAreNotInferredFromLinkSpeed() { assertEquals("wifi",NetworkStatusPlugin.transport(true,false,false,true,false)); assertEquals("ethernet",NetworkStatusPlugin.transport(true,false,true,false,false)); }
    @Test public void mobileAndUnknownRemainDistinct() { assertEquals("cellular",NetworkStatusPlugin.transport(true,false,false,false,true)); assertEquals("other",NetworkStatusPlugin.transport(true,false,false,false,false)); }
    @Test public void vpnDoesNotPretendToBeAnUnderlyingWifi() { assertEquals("vpn",NetworkStatusPlugin.transport(true,true,false,true,true)); }
    @Test public void internetCapabilityAloneIsNotValidatedInternet() { assertFalse(NetworkStatusPlugin.validated(true,true,false,false)); }
    @Test public void captiveOrDisconnectedNeverBecomeGreen() { assertFalse(NetworkStatusPlugin.validated(true,true,true,true)); assertFalse(NetworkStatusPlugin.validated(false,true,true,false)); }
    @Test public void onlyCompleteValidatedCapabilitiesAllowGreen() { assertTrue(NetworkStatusPlugin.validated(true,true,true,false)); assertFalse(NetworkStatusPlugin.validated(true,false,true,false)); }
}
