package com.xandeflix.prebuilt.artwork;
import org.junit.Test;
import java.io.*;
import java.net.*;
import javax.net.ssl.SSLException;
import static org.junit.Assert.*;
public class ArtworkCacheFailurePolicyTest {
    @Test public void knownTransportAndInvalidImageDoNotNeedAnotherIdenticalFetch() {
        for(String code:new String[]{"CACHE_TRANSPORT_FAILED","CACHE_RESPONSE","CACHE_TIMEOUT","CACHE_REDIRECT",
                "CACHE_REDIRECT_LIMIT","CACHE_PROTOCOL","CACHE_IMAGE_TOO_LARGE"})
            assertTrue(ArtworkCacheFailurePolicy.sourceUnavailable(new IOException("CACHE_FETCH_FAILED",new IOException(code))));
        for(Exception error:new Exception[]{new MalformedURLException(),new SocketTimeoutException(),new UnknownHostException(),new ConnectException(),new SSLException("synthetic")})
            assertTrue(ArtworkCacheFailurePolicy.sourceUnavailable(new IOException("CACHE_FETCH_FAILED",error)));
    }
    @Test public void diskAndUnknownFailuresStillPermitBrowserTransport() {
        for(String code:new String[]{"CACHE_DIRECTORY_FAILED","CACHE_PROMOTION_FAILED","CACHE_KEY_FAILED","CACHE_INTERRUPTED","CACHE_INVALID_IMAGE","unknown"})
            assertFalse(ArtworkCacheFailurePolicy.sourceUnavailable(new IOException("CACHE_FETCH_FAILED",new IOException(code))));
        assertFalse(ArtworkCacheFailurePolicy.sourceUnavailable(new IOException("CACHE_FETCH_FAILED",new FileNotFoundException())));
        assertFalse(ArtworkCacheFailurePolicy.sourceUnavailable(null));
    }
}
