package com.xandeflix.prebuilt.artwork;

import android.graphics.BitmapFactory;
import android.net.Uri;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.*;
import java.net.*;
import java.util.concurrent.*;

@CapacitorPlugin(name="ArtworkCache")
public class ArtworkCachePlugin extends Plugin {
    private final ThreadPoolExecutor executor=new ThreadPoolExecutor(2,2,30,TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(64),new ThreadPoolExecutor.AbortPolicy());
    private ArtworkDiskCache cache;
    @PluginMethod public void get(PluginCall call) {
        String uri=call.getString("uri");
        if(uri==null || !(uri.startsWith("https://") || uri.startsWith("http://"))) {call.reject("CACHE_INVALID_URI");return;}
        synchronized(this) { if(cache==null)cache=new ArtworkDiskCache(new File(getContext().getCacheDir(),"artwork-v1"),
                150L*1024*1024,1000,30L*24*60*60*1000,8L*1024*1024); }
        try {File hit=cache.getCached(uri,System.currentTimeMillis());if(hit!=null){resolve(call,hit);return;}}
        catch(IOException ignored){call.reject("CACHE_UNAVAILABLE");return;}
        try { executor.execute(() -> {
            try {
                File file=cache.get(uri,System.currentTimeMillis(),ArtworkCachePlugin::fetch,image -> {
                    BitmapFactory.Options options=new BitmapFactory.Options(); options.inJustDecodeBounds=true;
                    BitmapFactory.decodeFile(image.getAbsolutePath(),options);
                    return options.outWidth>0 && options.outHeight>0 && (long)options.outWidth*options.outHeight<=80_000_000;
                });
                resolve(call,file);
            } catch(Exception ignored) {
                String code=ArtworkCacheFailurePolicy.sourceUnavailable(ignored)?"CACHE_SOURCE_UNAVAILABLE":"CACHE_UNAVAILABLE";
                call.reject(code,code);
            }
        }); } catch(RejectedExecutionException ignored) {call.reject("CACHE_BUSY");}
    }
    private static void resolve(PluginCall call,File file){JSObject result=new JSObject();result.put("path",Uri.fromFile(file).toString());call.resolve(result);}
    private static int remaining(long start) throws IOException {
        long left=7000-TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start);
        if(left<=0 || Thread.currentThread().isInterrupted())throw new IOException("CACHE_TIMEOUT");
        return (int)Math.max(1,Math.min(3500,left));
    }
    private static void fetch(String uri,OutputStream out) throws IOException {
        URL current=new URL(uri);long start=System.nanoTime();
        for(int redirects=0;redirects<=5;redirects++) {
            if(!"http".equals(current.getProtocol()) && !"https".equals(current.getProtocol()))throw new IOException("CACHE_PROTOCOL");
            HttpURLConnection conn=(HttpURLConnection)current.openConnection();conn.setConnectTimeout(remaining(start));conn.setReadTimeout(remaining(start));
            conn.setInstanceFollowRedirects(false);conn.setRequestProperty("Accept","image/*");
            try {
                int status;
                try {status=conn.getResponseCode();}catch(IOException error){throw new IOException("CACHE_TRANSPORT_FAILED",error);}
                if(status>=300 && status<=399) {String location=conn.getHeaderField("Location");if(location==null)throw new IOException("CACHE_REDIRECT");current=new URL(current,location);continue;}
                if(status!=200 || conn.getContentLengthLong()>8L*1024*1024)throw new IOException("CACHE_RESPONSE");
                InputStream source;
                try {source=conn.getInputStream();}catch(IOException error){throw new IOException("CACHE_TRANSPORT_FAILED",error);}
                try(InputStream input=source) {byte[] buffer=new byte[32768];int read;while(true){
                    conn.setReadTimeout(remaining(start));
                    try {read=input.read(buffer);}catch(IOException error){throw new IOException("CACHE_TRANSPORT_FAILED",error);}
                    if(read==-1)break;out.write(buffer,0,read);
                }}
                return;
            } finally {conn.disconnect();}
        }
        throw new IOException("CACHE_REDIRECT_LIMIT");
    }
    @Override protected void handleOnDestroy() {executor.shutdownNow();super.handleOnDestroy();}
}
