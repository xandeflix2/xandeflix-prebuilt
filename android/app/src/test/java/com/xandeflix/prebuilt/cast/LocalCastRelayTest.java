package com.xandeflix.prebuilt.cast;
import java.io.*;
import org.junit.Test;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.Assert.*;
public class LocalCastRelayTest {
 private static final class SourceServer implements AutoCloseable {
  final ServerSocket socket;volatile boolean closed;volatile String userAgent;
  SourceServer(InetAddress address)throws IOException{
   socket=new ServerSocket(0,16,address);Thread thread=new Thread(()->{while(!closed)try{Socket client=socket.accept();new Thread(()->serve(client)).start();}catch(IOException ignored){}});thread.setDaemon(true);thread.start();
  }
  void serve(Socket socket){try(Socket client=socket){BufferedReader input=new BufferedReader(new InputStreamReader(client.getInputStream(),StandardCharsets.US_ASCII));String request=input.readLine();String range=null,h;while((h=input.readLine())!=null && !h.isEmpty()){if(h.toLowerCase(Locale.ROOT).startsWith("range:"))range=h.substring(6).trim();if(h.toLowerCase(Locale.ROOT).startsWith("user-agent:"))userAgent=h.substring(11).trim();}
   boolean playlist=request.contains("playlist.m3u8"),head=request.startsWith("HEAD");int status=range!=null?206:200;
   String content=playlist ? "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"key.bin?fixture=1\"\n#EXTINF:3,\nvideo.mp4?fixture=2\n" : range!=null ? "234" : "0123456789";
   byte[] body=content.getBytes(StandardCharsets.UTF_8);String headers="HTTP/1.1 "+status+" OK\r\nContent-Type: "+(playlist?"application/vnd.apple.mpegurl":"video/mp4")+"\r\nContent-Length: "+body.length+"\r\n"+(range!=null?"Content-Range: bytes 2-4/10\r\n":"")+"Connection: close\r\n\r\n";
   client.getOutputStream().write(headers.getBytes(StandardCharsets.US_ASCII));if(!head)client.getOutputStream().write(body);
  }catch(IOException ignored){}}
  @Override public void close()throws IOException{closed=true;socket.close();}
 }
 @Test public void realHttpHlsRelativeKeysRangesAndTermination()throws Exception {
  InetAddress localhost=InetAddress.getByName("127.0.0.1");SourceServer source=new SourceServer(localhost);
  try(LocalCastRelay relay=new LocalCastRelay(localhost,localhost,Collections.emptyMap(),5000,()->{})) {
   String url=relay.route(new URL("http://127.0.0.1:"+source.socket.getLocalPort()+"/playlist.m3u8"));
   String playlist=new String(new URL(url).openStream().readAllBytes(),StandardCharsets.UTF_8);
   assertTrue(playlist.startsWith("#EXTM3U"));assertFalse(playlist.contains("fixture="));assertFalse(playlist.contains("video.mp4"));assertFalse(playlist.contains("key.bin"));
   String segment=Arrays.stream(playlist.split("\n")).filter(line->line.startsWith("http")).findFirst().get();
   HttpURLConnection request=(HttpURLConnection)new URL(segment).openConnection();request.setRequestProperty("Range","bytes=2-4");assertEquals(206,request.getResponseCode());assertEquals("bytes 2-4/10",request.getHeaderField("Content-Range"));assertEquals("234",new String(request.getInputStream().readAllBytes(),StandardCharsets.UTF_8));request.disconnect();
   HttpURLConnection head=(HttpURLConnection)new URL(segment).openConnection();head.setRequestMethod("HEAD");assertEquals(200,head.getResponseCode());assertEquals(0,head.getInputStream().readAllBytes().length);head.disconnect();
   HttpURLConnection denied=(HttpURLConnection)new URL(url+"-invalid").openConnection();assertEquals(403,denied.getResponseCode());denied.disconnect();
   relay.close();assertTrue(relay.isClosed());try{new URL(url).openStream();fail();}catch(java.io.IOException expected){}
  }finally{source.close();}
 }
 @Test public void leaseExpiresWithoutRenewAndProcessOwnedSocketsClose()throws Exception {
  InetAddress localhost=InetAddress.getByName("127.0.0.1");AtomicBoolean expired=new AtomicBoolean();
  try(LocalCastRelay relay=new LocalCastRelay(localhost,localhost,Collections.emptyMap(),150,()->expired.set(true))) {
   relay.renew();long deadline=System.currentTimeMillis()+2000;while(!expired.get() && System.currentTimeMillis()<deadline)Thread.sleep(10);
   assertTrue(expired.get());assertTrue(relay.isClosed());
  }
 }
 @Test public void rangeBytesAndConfiguredUserAgentReachSourceWhileDiagnosticStaysClosed()throws Exception {
  InetAddress local=InetAddress.getByName("127.0.0.1");List<String> events=new java.util.concurrent.CopyOnWriteArrayList<>();
  try(SourceServer source=new SourceServer(local);LocalCastRelay relay=new LocalCastRelay(local,local,Collections.singletonMap("User-Agent","FixturePlayer/private-agent"),5000,()->{},events::add)) {
   String url=relay.route(new URL("http://127.0.0.1:"+source.socket.getLocalPort()+"/video.mp4?fixture-secret=private"));
   HttpURLConnection request=(HttpURLConnection)new URL(url).openConnection();request.setRequestProperty("Range","bytes=2-4");
   assertEquals(206,request.getResponseCode());assertEquals("234",new String(request.getInputStream().readAllBytes(),StandardCharsets.UTF_8));request.disconnect();
   long until=System.currentTimeMillis()+2000;while(!events.contains("CAST_RELAY_CLOSED bytes=3") && System.currentTimeMillis()<until)Thread.sleep(10);
   assertEquals("FixturePlayer/private-agent",source.userAgent);
   assertTrue(events.contains("CAST_UPSTREAM method=GET status=206 ranged=true"));
   assertTrue(events.contains("CAST_RELAY_CLOSED bytes=3"));
   assertFalse(events.toString().contains("private"));assertFalse(events.toString().contains("http"));assertFalse(events.toString().contains("127.0.0.1"));
  }
 }
}
