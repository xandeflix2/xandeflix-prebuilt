package com.xandeflix.prebuilt.artwork;

import java.net.*;
import javax.net.ssl.SSLException;

/** Classifies known image failures without returning source URLs or exception text. */
public final class ArtworkCacheFailurePolicy {
    private ArtworkCacheFailurePolicy() {}
    public static boolean sourceUnavailable(Throwable error) {
        for(int depth=0;error!=null && depth<8;depth++,error=error.getCause()) {
            String message=error.getMessage();
            if("CACHE_DIRECTORY_FAILED".equals(message) || "CACHE_PROMOTION_FAILED".equals(message)
                    || "CACHE_KEY_FAILED".equals(message) || "CACHE_INTERRUPTED".equals(message))return false;
            if("CACHE_TRANSPORT_FAILED".equals(message) || "CACHE_RESPONSE".equals(message) || "CACHE_PROTOCOL".equals(message)
                    || "CACHE_REDIRECT".equals(message) || "CACHE_REDIRECT_LIMIT".equals(message)
                    || "CACHE_TIMEOUT".equals(message)
                    || "CACHE_IMAGE_TOO_LARGE".equals(message))return true;
            if(error instanceof MalformedURLException || error instanceof SocketTimeoutException || error instanceof UnknownHostException
                    || error instanceof ConnectException || error instanceof SSLException)return true;
        }
        return false;
    }
}
