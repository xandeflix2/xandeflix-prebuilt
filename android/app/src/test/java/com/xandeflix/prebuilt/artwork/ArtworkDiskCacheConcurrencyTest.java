package com.xandeflix.prebuilt.artwork;
import org.junit.*;
import org.junit.rules.TemporaryFolder;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.Assert.*;

public class ArtworkDiskCacheConcurrencyTest {
 @Rule public TemporaryFolder temporary=new TemporaryFolder();
 @Test public void warmHitDoesNotWaitForBlockedDownload()throws Exception{
  ArtworkDiskCache cache=new ArtworkDiskCache(temporary.newFolder(),1000,20,100000,100);
  File warm=cache.get("https://fixture.invalid/warm",10000,(u,o)->o.write(1),f->true);
  ExecutorService threads=Executors.newFixedThreadPool(2);CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);
  try{
   Future<File> cold=threads.submit(()->cache.get("https://fixture.invalid/cold",10001,(u,o)->{entered.countDown();await(release);o.write(2);},f->true));
   assertTrue(entered.await(3,TimeUnit.SECONDS));
   Future<File> hit=threads.submit(()->cache.get("https://fixture.invalid/warm",10002,(u,o)->{throw new IOException("UNEXPECTED_FETCH");},f->true));
   assertEquals(warm,hit.get(1,TimeUnit.SECONDS));release.countDown();assertTrue(cold.get(3,TimeUnit.SECONDS).exists());
  }finally{release.countDown();threads.shutdownNow();}
 }
 @Test public void separateDownloadsRunTogetherAndPruningPreservesOtherPartial()throws Exception{
  File dir=temporary.newFolder();ArtworkDiskCache cache=new ArtworkDiskCache(dir,1000,1,100000,100);
  ExecutorService threads=Executors.newFixedThreadPool(2);CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);
  try{
   Future<File> first=threads.submit(()->cache.get("https://fixture.invalid/slow",10000,(u,o)->{o.write(1);entered.countDown();await(release);o.write(2);},f->f.length()==2));
   assertTrue(entered.await(3,TimeUnit.SECONDS));
   Future<File> second=threads.submit(()->cache.get("https://fixture.invalid/quick",10001,(u,o)->o.write(3),f->true));
   File completed=second.get(1,TimeUnit.SECONDS);assertTrue(completed.exists());
   assertTrue(Arrays.stream(dir.listFiles()).anyMatch(f->f.getName().endsWith(".part")));
   release.countDown();File result=first.get(3,TimeUnit.SECONDS);assertTrue(result.exists());assertEquals(2,result.length());
   assertFalse(Arrays.stream(dir.listFiles()).anyMatch(f->f.getName().endsWith(".part")));
  }finally{release.countDown();threads.shutdownNow();}
 }
 @Test public void simultaneousSameImageHasOneFetchAndOnePromotion()throws Exception{
  File dir=temporary.newFolder();ArtworkDiskCache cache=new ArtworkDiskCache(dir,1000,20,100000,100);
  ExecutorService threads=Executors.newFixedThreadPool(8);CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);AtomicInteger count=new AtomicInteger();
  try{
   List<Future<File>> jobs=new ArrayList<>();for(int n=0;n<8;n++)jobs.add(threads.submit(()->cache.get("https://fixture.invalid/shared",10000,(u,o)->{count.incrementAndGet();entered.countDown();await(release);o.write(1);},f->true)));
   assertTrue(entered.await(3,TimeUnit.SECONDS));release.countDown();File first=jobs.get(0).get(3,TimeUnit.SECONDS);
   for(Future<File> job:jobs)assertEquals(first,job.get(3,TimeUnit.SECONDS));assertEquals(1,count.get());assertEquals(1,dir.listFiles().length);
  }finally{release.countDown();threads.shutdownNow();}
 }
 private static void await(CountDownLatch latch)throws IOException{try{if(!latch.await(5,TimeUnit.SECONDS))throw new IOException("TEST_WAIT");}catch(InterruptedException e){Thread.currentThread().interrupt();throw new IOException("TEST_INTERRUPTED");}}
}
