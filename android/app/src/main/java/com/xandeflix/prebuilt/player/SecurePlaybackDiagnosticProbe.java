package com.xandeflix.prebuilt.player;

import android.util.Log;
import android.content.Context;
import java.io.EOFException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLException;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/** Debug-only, bounded transport breadcrumb. It deliberately never formats a URI or header value. */
final class SecurePlaybackDiagnosticProbe {
  static final int MAX_BYTES = 16 * 1024;
  private static final String TAG = "SecurePlayerProbe";
  private SecurePlaybackDiagnosticProbe() {}
  static String newAttemptId() { return UUID.randomUUID().toString().substring(0, 12); }
  static boolean enabled(Context context) { return context != null && (context.getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0; }
  static void run(NativeStreamRequest stream, String attemptId) {
    
    long start = System.nanoTime(); int bytes = 0; boolean firstByte = false;
    safe(attemptId, "PROBE_START streamFp=" + stream.getDiagnosticFingerprint()+" scheme="+stream.getDiagnosticScheme()+" portClass="+stream.getDiagnosticPortClass()+" container="+stream.getDiagnosticContainerHint()+" headerNames="+stream.getDiagnosticHeaderNames());
    OkHttpClient client = NativePlayerActivity.getSharedOkHttpClient().newBuilder().connectTimeout(12, TimeUnit.SECONDS).readTimeout(12, TimeUnit.SECONDS).build();
    try {
      Request.Builder b = new Request.Builder().url(stream.getMediaUrl()).get().header("Range", "bytes=0-16383");
      for (Map.Entry<String,String> e : stream.getRequestHeaders().entrySet()) b.header(e.getKey(), e.getValue());
      try (Response response = client.newCall(b.build()).execute()) {
        long headersMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start);
        safe(attemptId, "PROBE_HTTP_RESPONSE statusClass="+(response.code()/100)+"xx timeToHeadersMs="+headersMs+" contentTypeClass="+contentTypeClass(response.header("Content-Type")));
        if (response.code()==401) { safe(attemptId,"PROBE_RESULT=HTTP_AUTH_FAILURE"); return; }
        if (response.code()==403) { safe(attemptId,"PROBE_RESULT=HTTP_FORBIDDEN"); return; }
        if (response.code()==404) { safe(attemptId,"PROBE_RESULT=HTTP_NOT_FOUND"); return; }
        if (!response.isSuccessful() || response.body()==null) { safe(attemptId,"PROBE_RESULT=HTTP_RESPONSE_FAILURE"); return; }
        byte[] block = new byte[4096]; int n;
        while (bytes < MAX_BYTES && (n=response.body().byteStream().read(block,0,Math.min(block.length,MAX_BYTES-bytes)))>0) { bytes+=n; if(!firstByte){firstByte=true; safe(attemptId,"PROBE_FIRST_BYTE timeToFirstByteMs="+TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start));} }
        safe(attemptId,"PROBE_RESULT=SOURCE_FIRST_BYTE_PASS bytesRead="+bytes);
      }
    } catch (Throwable error) { safe(attemptId,"PROBE_RESULT="+classify(error, firstByte)+" rootExceptionClass="+error.getClass().getSimpleName()+" bytesRead="+bytes); }
    finally { safe(attemptId,"PROBE_RESOURCE_RELEASED=SIM"); }
  }
  static String classify(Throwable t, boolean afterBytes) { Throwable c=t; while(c!=null){ if(c instanceof UnknownHostException)return "DNS_FAILURE"; if(c instanceof ConnectException)return "TCP_CONNECT_FAILURE"; if(c instanceof SSLException)return "TLS_FAILURE"; if(c instanceof SocketTimeoutException)return afterBytes?"READ_TIMEOUT":"CONNECT_OR_RESPONSE_TIMEOUT"; c=c.getCause(); } return "UNKNOWN_TRANSPORT_FAILURE"; }
  static String contentTypeClass(String value) { if(value==null)return "absent"; String v=value.toLowerCase(); return v.contains("video")?"video":v.contains("mpegurl")?"hls":v.contains("audio")?"audio":"other"; }
  private static void safe(String id,String message){ Log.i(TAG,"playAttemptId="+id+" "+message); }
}
