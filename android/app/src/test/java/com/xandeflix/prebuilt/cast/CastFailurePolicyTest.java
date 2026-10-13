package com.xandeflix.prebuilt.cast;

import org.junit.Test;
import java.util.Map;
import com.xandeflix.prebuilt.player.NativeAndroidPlayerPlugin;
import static org.junit.Assert.*;

public class CastFailurePolicyTest {
    @Test public void relayPreservesResolvedUserAgentAndAuthorizedHeaders() {
        Map<String,String> explicit=new java.util.HashMap<>();
        explicit.put("Authorization","fixture-authorization");
        explicit.put("Referer","https://fixture.invalid/page");
        com.xandeflix.prebuilt.player.NativeStreamRequest request=com.xandeflix.prebuilt.player.NativeStreamRequest.fromUrlWithHeaders("https://fixture.invalid/episode.mp4",explicit,"FixturePlayer/1").get(0);
        Map<String,String> headers=CastController.relayHeaders(request);
        assertEquals("FixturePlayer/1",headers.get("User-Agent"));
        assertEquals("fixture-authorization",headers.get("Authorization"));
        assertEquals(request.getRequestHeaders().get("Referer"),headers.get("Referer"));
        assertEquals(request.getRequestHeaders().size()+1,headers.size());
        assertFalse(request.getRequestHeaders().containsKey("User-Agent"));
        headers.put("Accept","fixture-change");
        assertEquals("*/*",request.getRequestHeaders().get("Accept"));
    }
    @Test public void terminalCastCodesSurviveIpcWithoutInventedMedia3OrHttp() {
        for (String code : new String[]{"CAST_MEDIA_ERROR", "CAST_LEASE_EXPIRED", "CAST_LOAD_TIMEOUT", "CAST_WIFI_REQUIRED"}) {
            Map<String,Object> event=NativeAndroidPlayerPlugin.buildResumeData(1234L,false,code,null,null);
            assertEquals(code,event.get("errorCode"));
            assertEquals("UNKNOWN",event.get("errorCategory"));
            assertFalse(event.containsKey("media3ErrorCode"));
            assertFalse(event.containsKey("httpStatus"));
            assertEquals(1234L,event.get("positionMs"));
        }
        assertEquals(2,NativeAndroidPlayerPlugin.buildResumeData(1234L,true,null,null,null).size());
    }
    @Test public void closedPolicyAndLanExceptionKeepSecretsOut() {
        String raw="https://fixture.invalid/private?token=fixture-secret";
        for (String code : new String[]{null,"",raw,"CAST_LOAD_FAILED\n"+raw,"CAST_UNKNOWN"}) {
            assertFalse(CastFailurePolicy.known(code));
            assertEquals("NATIVE_ERROR",NativeAndroidPlayerPlugin.sanitizeErrorCode(code));
        }
        assertEquals("CAST_WIFI_REQUIRED",CastFailurePolicy.loadExceptionCode(new IllegalStateException("CAST_WIFI_REQUIRED")));
        assertEquals("CAST_LOAD_FAILED",CastFailurePolicy.loadExceptionCode(new RuntimeException("CAST_WIFI_REQUIRED")));
        assertEquals("CAST_LOAD_FAILED",CastFailurePolicy.loadExceptionCode(new IllegalStateException(raw)));
    }
}
