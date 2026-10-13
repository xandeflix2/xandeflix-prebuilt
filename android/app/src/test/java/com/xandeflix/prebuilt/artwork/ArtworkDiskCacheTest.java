package com.xandeflix.prebuilt.artwork;
import org.junit.*;
import org.junit.rules.TemporaryFolder;
import java.io.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.Assert.*;
public class ArtworkDiskCacheTest {
 @Rule public TemporaryFolder temporary=new TemporaryFolder();
 @Test public void restartHitTtlLruAndOpaqueDiskNames()throws Exception{
  File dir=temporary.newFolder();AtomicInteger reads=new AtomicInteger();
  ArtworkDiskCache.Fetcher fetch=(uri,out)->{reads.incrementAndGet();out.write(new byte[8]);};
  ArtworkDiskCache cache=new ArtworkDiskCache(dir,16,2,1000,20);
  File first=cache.get("https://fixture.invalid/a?fixture=1",10000,fetch,f->true);
  assertTrue(first.getName().matches("[0-9a-f]{64}-10000.img"));
  assertEquals("f195c7b5b6026b5cc7c255357743713a3e6c288a77f7ca61390f8bf902a36922-10000.img",first.getName());
  cache=new ArtworkDiskCache(dir,16,2,1000,20);
  assertEquals(first,cache.get("https://fixture.invalid/a?fixture=1",10020,fetch,f->true));assertEquals(1,reads.get());
  cache.get("https://fixture.invalid/b",10040,fetch,f->true);
  cache.get("https://fixture.invalid/a?fixture=1",10060,fetch,f->true);
  cache.get("https://fixture.invalid/c",10080,fetch,f->true);
  assertTrue(first.exists());assertEquals(2,dir.listFiles().length);
  cache.get("https://fixture.invalid/a?fixture=1",11001,fetch,f->true);assertEquals(4,reads.get());assertFalse(first.exists());
 }
 @Test public void failuresNeverPromoteOrRetainPartialBytes()throws Exception{
  File dir=temporary.newFolder();ArtworkDiskCache cache=new ArtworkDiskCache(dir,30,3,10000,10);
  try{cache.get("https://fixture.invalid/too-large",1000,(uri,out)->out.write(new byte[11]),f->true);fail();}catch(IOException expected){}
  try{cache.get("https://fixture.invalid/not-image",1000,(uri,out)->out.write(new byte[3]),f->false);fail();}catch(IOException expected){}
  assertEquals(0,dir.listFiles().length);
  try{cache.get("https://fixture.invalid/unavailable",1000,(uri,out)->{throw new IOException("CACHE_RESPONSE");},f->true);fail();}
  catch(IOException expected){assertTrue(ArtworkCacheFailurePolicy.sourceUnavailable(expected));}
  try{cache.get("https://fixture.invalid/write-failure",1000,(uri,out)->{throw new FileNotFoundException("synthetic disk failure");},f->true);fail();}
  catch(IOException expected){assertFalse(ArtworkCacheFailurePolicy.sourceUnavailable(expected));}
  assertEquals(0,dir.listFiles().length);
 }
 @Test public void largeWarmCacheDoesNotRelistOrStatDuringEvictionSort()throws Exception{
  File dir=temporary.newFolder();ArtworkDiskCache first=new ArtworkDiskCache(dir,10000,80,100000,20);
  for(int n=0;n<80;n++)first.get("https://fixture.invalid/bulk-"+n,10000+n,(uri,out)->out.write(new byte[8]),f->true);
  AtomicInteger lists=new AtomicInteger(),dates=new AtomicInteger();
  File counted=new File(dir.getAbsolutePath()) {
   @Override public File[] listFiles(){lists.incrementAndGet();File[] files=super.listFiles();
    if(files==null)return null;for(int n=0;n<files.length;n++){final String name=files[n].getAbsolutePath();files[n]=new File(name){@Override public long lastModified(){dates.incrementAndGet();return super.lastModified();}};}return files;}
  };
  ArtworkDiskCache cache=new ArtworkDiskCache(counted,10000,80,100000,20);
  for(int n=0;n<80;n++)assertNotNull(cache.getCached("https://fixture.invalid/bulk-"+n,11000+n));
  for(int n=0;n<10;n++)cache.get("https://fixture.invalid/new-"+n,12000+n,(uri,out)->out.write(new byte[8]),f->true);
  assertEquals("one directory inventory per cache instance",1,lists.get());
  assertEquals("filesystem dates read once, never by the sort comparator",80,dates.get());
  assertEquals(80,dir.listFiles().length);
  assertNull(cache.getCached("https://fixture.invalid/bulk-0",12100));
  assertNotNull(cache.getCached("https://fixture.invalid/bulk-79",12101));
 }
 @Test public void externallyDeletedEntryIsNotAHitAndDoesNotConsumeQuota()throws Exception{
  File dir=temporary.newFolder();AtomicInteger reads=new AtomicInteger();
  ArtworkDiskCache cache=new ArtworkDiskCache(dir,8,1,100000,20);
  ArtworkDiskCache.Fetcher fetch=(uri,out)->{reads.incrementAndGet();out.write(new byte[8]);};
  File old=cache.get("https://fixture.invalid/deleted",10000,fetch,f->true);assertTrue(old.delete());
  assertNull(cache.getCached("https://fixture.invalid/deleted",10001));
  File restored=cache.get("https://fixture.invalid/deleted",10002,fetch,f->true);
  assertTrue(restored.exists());assertEquals(2,reads.get());assertEquals(1,dir.listFiles().length);
  assertTrue(restored.delete());assertTrue(dir.delete());
  assertTrue(cache.get("https://fixture.invalid/deleted",10003,fetch,f->true).exists());
  assertEquals(3,reads.get());assertEquals(1,dir.listFiles().length);
 }
}
