package com.xandeflix.prebuilt.cast;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

/** Authorized LAN output only. No source URI/headers leave RAM or get logged. */
public final class LocalCastRelay implements AutoCloseable {
    private final ServerSocket server;
    private final InetAddress receiver;
    private final String base;
    private final Map<String,URL> routes=new LinkedHashMap<>();
    private final Map<String,String> headers;
    private final Set<Socket> sockets=ConcurrentHashMap.newKeySet();
    private final Set<HttpURLConnection> upstreams=ConcurrentHashMap.newKeySet();
    private final ThreadPoolExecutor workers=new ThreadPoolExecutor(4,4,10,TimeUnit.SECONDS,new ArrayBlockingQueue<>(16));
    private final ScheduledExecutorService clock=Executors.newSingleThreadScheduledExecutor();
    private volatile long expires;
    private volatile boolean closed;
    private final long leaseMs;
    private final Runnable onExpired;
    private final java.util.function.Consumer<String> diagnostic;
    private static final Pattern ATTRIBUTE=Pattern.compile("URI=\"([^\"]+)\"");

    public LocalCastRelay(InetAddress local,InetAddress receiver,Map<String,String> headers,long leaseMs,Runnable onExpired) throws IOException {
        this(local,receiver,headers,leaseMs,onExpired,null);
    }
    public LocalCastRelay(InetAddress local,InetAddress receiver,Map<String,String> headers,long leaseMs,Runnable onExpired,java.util.function.Consumer<String> diagnostic) throws IOException {
        this.diagnostic=diagnostic;
        this.receiver=receiver;this.headers=new HashMap<>(headers);this.leaseMs=Math.min(120_000,Math.max(100,leaseMs));this.onExpired=onExpired;
        byte[] token=new byte[32];new SecureRandom().nextBytes(token);StringBuilder key=new StringBuilder();for(byte b:token)key.append(String.format(Locale.ROOT,"%02x",b & 255));
        server=new ServerSocket(0,16,local);base="http://"+local.getHostAddress()+":"+server.getLocalPort()+"/"+key+"/";renew();
        if(diagnostic!=null)diagnostic.accept("CAST_RELAY_BOUND");
        Thread listener=new Thread(this::accept,"cast-lan-output");listener.setDaemon(true);listener.start();
        clock.scheduleAtFixedRate(()->{if(!closed && System.currentTimeMillis()>=expires){close();onExpired.run();}},100,100,TimeUnit.MILLISECONDS);
    }
    public synchronized String route(URL source) throws IOException {
        if(closed || !("http".equals(source.getProtocol()) || "https".equals(source.getProtocol())))throw new IOException("CAST_RELAY_CLOSED");
        for(Map.Entry<String,URL> entry:routes.entrySet())if(entry.getValue().toExternalForm().equals(source.toExternalForm()))return base+entry.getKey();
        if(routes.size()>=2048)routes.remove(routes.keySet().iterator().next());
        String id=UUID.randomUUID().toString();routes.put(id,source);return base+id;
    }
    public void renew() {if(!closed)expires=System.currentTimeMillis()+leaseMs;}
    public boolean isClosed(){return closed;}
    private void accept() {
        while(!closed)try {Socket socket=server.accept();
            if(!socket.getInetAddress().equals(receiver)){if(diagnostic!=null)diagnostic.accept("CAST_PEER_DENIED");socket.close();continue;}
            if(diagnostic!=null)diagnostic.accept("CAST_PEER_ACCEPTED");
            sockets.add(socket);try{workers.execute(()->serve(socket));}catch(RejectedExecutionException ignored){sockets.remove(socket);socket.close();}
        }catch(IOException ignored){if(!closed)close();}
    }
    private static String line(InputStream input) throws IOException {
        ByteArrayOutputStream bytes=new ByteArrayOutputStream();int b;
        while((b=input.read())!=-1 && b!='\n'){if(bytes.size()>=8192)throw new IOException("CAST_HEADER_LIMIT");if(b!='\r')bytes.write(b);}
        return bytes.toString("US-ASCII");
    }
    private void serve(Socket socket) {
        HttpURLConnection upstream=null;
        long transferred=0;
        try(Socket client=socket) {
            client.setSoTimeout(10000);InputStream input=new BufferedInputStream(client.getInputStream());OutputStream output=client.getOutputStream();
            String[] request=line(input).split(" ");if(request.length!=3)return;
            String method=request[0];if(!method.equals("GET") && !method.equals("HEAD") && !method.equals("OPTIONS")){error(output,405);return;}
            Map<String,String> incoming=new HashMap<>();for(int i=0;i<64;i++){String h=line(input);if(h.isEmpty())break;int colon=h.indexOf(':');if(colon>0)incoming.put(h.substring(0,colon).toLowerCase(Locale.ROOT),h.substring(colon+1).trim());if(i==63)throw new IOException("CAST_HEADER_LIMIT");}
            String full="http://"+server.getInetAddress().getHostAddress()+":"+server.getLocalPort()+request[1];
            URL source; synchronized(this){source=full.startsWith(base) ? routes.get(full.substring(base.length())) : null;}
            if(closed || System.currentTimeMillis()>=expires || source==null){error(output,403);return;}
            if(method.equals("OPTIONS")){write(output,"HTTP/1.1 204 No Content\r\n"+cors()+"Content-Length: 0\r\nConnection: close\r\n\r\n");return;}
            URL current=source;
            for(int redirects=0;redirects<=5;redirects++) {
                if(!current.getProtocol().equals("https") && !current.getProtocol().equals("http"))throw new IOException("CAST_PROTOCOL");
                upstream=(HttpURLConnection)current.openConnection();upstreams.add(upstream);upstream.setConnectTimeout(10000);upstream.setReadTimeout(10000);upstream.setInstanceFollowRedirects(false);upstream.setRequestMethod(method);
                for(Map.Entry<String,String> header:headers.entrySet())upstream.setRequestProperty(header.getKey(),header.getValue());
                String range=incoming.get("range");if(range!=null && range.matches("bytes=[0-9]*-[0-9]*"))upstream.setRequestProperty("Range",range);
                int code=upstream.getResponseCode();if(diagnostic!=null)diagnostic.accept("CAST_UPSTREAM method="+method+" status="+(code>=100 && code<=599?Integer.toString(code):"UNAVAILABLE")+" ranged="+(range!=null));if(code>=300 && code<400){String next=upstream.getHeaderField("Location");if(next==null)throw new IOException("CAST_REDIRECT");current=new URL(current,next);upstreams.remove(upstream);upstream.disconnect();upstream=null;continue;}
                if(code!=200 && code!=206){error(output,502);return;}
                String type=upstream.getContentType();boolean playlist=current.getPath().toLowerCase(Locale.ROOT).endsWith(".m3u8") || type!=null && type.toLowerCase(Locale.ROOT).contains("mpegurl");
                byte[] rewritten=null;
                if(playlist && method.equals("GET")) {
                    try(InputStream body=upstream.getInputStream()){ByteArrayOutputStream data=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int read;while((read=body.read(buffer))!=-1){if(data.size()+read>1024*1024)throw new IOException("CAST_PLAYLIST_LIMIT");data.write(buffer,0,read);}rewritten=rewrite(data.toString("UTF-8"),current).getBytes(StandardCharsets.UTF_8);}
                }
                long length=rewritten!=null ? rewritten.length : upstream.getContentLengthLong();
                String response="HTTP/1.1 "+code+" OK\r\n"+cors()+"Connection: close\r\n"+(length>=0 ? "Content-Length: "+length+"\r\n" : "")+"Content-Type: "+(playlist ? "application/vnd.apple.mpegurl" : safeType(type))+"\r\n";
                String contentRange=upstream.getHeaderField("Content-Range");if(contentRange!=null && contentRange.matches("bytes [0-9]+-[0-9]+/[0-9*]+"))response+="Content-Range: "+contentRange+"\r\n";
                if(upstream.getHeaderField("Accept-Ranges")!=null)response+="Accept-Ranges: bytes\r\n";
                write(output,response+"\r\n");if(method.equals("HEAD"))return;
                if(rewritten!=null){output.write(rewritten);return;}
                try(InputStream body=upstream.getInputStream()){byte[] buffer=new byte[32768];int read;while(!closed && System.currentTimeMillis()<expires && (read=body.read(buffer))!=-1){output.write(buffer,0,read);transferred+=read;}}
                return;
            }
        } catch(Exception error) { if(diagnostic!=null)diagnostic.accept("CAST_RELAY_ERROR kind="+(error instanceof IOException?"IO":"OTHER")); }
        finally {if(diagnostic!=null)diagnostic.accept("CAST_RELAY_CLOSED bytes="+transferred);sockets.remove(socket);if(upstream!=null){upstreams.remove(upstream);upstream.disconnect();}}
    }
    private String rewrite(String playlist,URL current) throws IOException {
        if(playlist.contains("#EXT-X-ENDLIST") && playlist.split("\r?\n").length>2000)throw new IOException("CAST_STATIC_PLAYLIST_LIMIT");
        if(!playlist.startsWith("#EXTM3U"))throw new IOException("CAST_INVALID_PLAYLIST");StringBuilder out=new StringBuilder();
        for(String raw:playlist.split("\r?\n")){String value=raw.trim();
            if(value.startsWith("#EXT-X-SESSION-DATA") || value.startsWith("#") && !value.startsWith("#EXT"))continue;
            if(value.startsWith("#EXTINF:")){int comma=value.indexOf(',');if(comma>=0)value=value.substring(0,comma+1);}
            if(!value.isEmpty() && !value.startsWith("#"))value=route(new URL(current,value));
            else {Matcher matcher=ATTRIBUTE.matcher(value);StringBuffer replaced=new StringBuffer();while(matcher.find())matcher.appendReplacement(replaced,Matcher.quoteReplacement("URI=\""+route(new URL(current,matcher.group(1)))+"\""));matcher.appendTail(replaced);value=replaced.toString();}
            out.append(value).append('\n');
        }return out.toString();
    }
    private static String safeType(String value){return value!=null && value.matches("[a-zA-Z0-9.+/-]+(;[ a-zA-Z0-9=.+/-]+)?") ? value : "application/octet-stream";}
    private static String cors(){return "Cache-Control: no-store\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, HEAD, OPTIONS\r\nAccess-Control-Allow-Headers: Range\r\nAccess-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges\r\n";}
    private static void write(OutputStream output,String text)throws IOException{output.write(text.getBytes(StandardCharsets.US_ASCII));}
    private static void error(OutputStream output,int status)throws IOException{write(output,"HTTP/1.1 "+status+" Error\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");}
    @Override public void close() {
        if(closed)return;closed=true;try{server.close();}catch(IOException ignored){}
        for(Socket socket:sockets)try{socket.close();}catch(IOException ignored){}
        for(HttpURLConnection upstream:upstreams)upstream.disconnect();workers.shutdownNow();clock.shutdownNow();
        synchronized(this){routes.clear();headers.clear();}
    }
}
