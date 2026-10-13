package com.xandeflix.prebuilt.artwork;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;

/** Disposable byte cache. Persistent names contain only SHA256 + timestamp. */
public final class ArtworkDiskCache {
    public interface Fetcher { void fetch(String uri, OutputStream output) throws IOException; }
    public interface Validator { boolean valid(File file); }
    private final File directory;
    private final long maxBytes, ttl, maxImage;
    private final int maxCount;
    private final ConcurrentHashMap<String,FutureTask<File>> pending=new ConcurrentHashMap<>();
    private static final class Entry {
        final File file; final long created, bytes; long used;
        Entry(File file,long created,long bytes,long used) {this.file=file;this.created=created;this.bytes=bytes;this.used=used;}
    }
    private final Map<String,Entry> entries=new HashMap<>();
    private boolean indexed;
    private long totalBytes;
    public ArtworkDiskCache(File directory, long maxBytes, int maxCount, long ttl, long maxImage) {
        this.directory=directory; this.maxBytes=maxBytes; this.maxCount=maxCount;
        this.ttl=ttl; this.maxImage=maxImage;
    }
    private String key(String uri) throws IOException {
        try {
            byte[] hash=MessageDigest.getInstance("SHA-256").digest(uri.getBytes(StandardCharsets.UTF_8));
            char[] digits="0123456789abcdef".toCharArray(),out=new char[hash.length*2];
            for(int n=0;n<hash.length;n++){int value=hash[n]&255;out[n*2]=digits[value>>>4];out[n*2+1]=digits[value&15];}
            return new String(out);
        } catch(Exception ignored) { throw new IOException("CACHE_KEY_FAILED"); }
    }
    public File getCached(String uri,long now) throws IOException { return cached(key(uri),now); }
    private void index(long now) throws IOException {
        if(indexed)return;
        if(!directory.isDirectory() && !directory.mkdirs() && !directory.isDirectory())throw new IOException("CACHE_DIRECTORY_FAILED");
        File[] files=directory.listFiles();
        if(files==null)throw new IOException("CACHE_DIRECTORY_FAILED");
        for(File file:files) {
            String name=file.getName();if(name.endsWith(".part"))continue;
            long date=created(file),bytes=file.length();
            if(date<=0 || now-date>=ttl || bytes<=0 || !name.matches("[0-9a-f]{64}-[0-9]+\\.img")) {file.delete();continue;}
            String key=name.substring(0,64);Entry old=entries.get(key);
            if(old!=null && old.created>=date){file.delete();continue;}
            if(old!=null){totalBytes-=old.bytes;old.file.delete();}
            entries.put(key,new Entry(file,date,bytes,file.lastModified()));totalBytes+=bytes;
        }
        indexed=true;prune(now,null);
    }
    private synchronized File cached(String key,long now) throws IOException {
        if(indexed && !directory.isDirectory()) {
            if(!directory.mkdirs() && !directory.isDirectory())throw new IOException("CACHE_DIRECTORY_FAILED");
            entries.clear();totalBytes=0;indexed=false;
        }
        index(now);Entry entry=entries.get(key);
        if(entry!=null) {
            if(now-entry.created<ttl && entry.file.isFile() && entry.file.length()==entry.bytes) {
                entry.used=now;entry.file.setLastModified(now);return entry.file;
            }
            entries.remove(key);totalBytes-=entry.bytes;entry.file.delete();
        }
        return null;
    }
    public File get(String uri, long now, Fetcher fetcher, Validator validator) throws IOException {
        String key=key(uri);File hit=cached(key,now);if(hit!=null)return hit;
        FutureTask<File> task=new FutureTask<>(()->load(key,uri,now,fetcher,validator));
        FutureTask<File> existing=pending.putIfAbsent(key,task);
        if(existing!=null)task=existing;else task.run();
        try {return task.get();}
        catch(InterruptedException ignored){Thread.currentThread().interrupt();throw new IOException("CACHE_INTERRUPTED");}
        catch(ExecutionException ignored){throw new IOException("CACHE_FETCH_FAILED",ignored.getCause());}
        finally {if(existing==null)pending.remove(key,task);}
    }
    private File load(String key,String uri,long now,Fetcher fetcher,Validator validator)throws IOException {
        File hit=cached(key,now);if(hit!=null)return hit;
        File partial=new File(directory,key+".part");
        try {
            try(OutputStream raw=new FileOutputStream(partial); OutputStream bounded=new FilterOutputStream(raw) {
                private long count;
                @Override public void write(int value) throws IOException { if(++count>maxImage)throw new IOException("CACHE_IMAGE_TOO_LARGE"); out.write(value); }
                @Override public void write(byte[] data,int offset,int length) throws IOException { count+=length; if(count>maxImage)throw new IOException("CACHE_IMAGE_TOO_LARGE"); out.write(data,offset,length); }
            }) { fetcher.fetch(uri,bounded); }
            if(partial.length()==0 || partial.length()>maxBytes || maxCount<1 || !validator.valid(partial))throw new IOException("CACHE_INVALID_IMAGE");
            File destination=new File(directory,key+"-"+now+".img");
            synchronized(this) {
                if(!partial.renameTo(destination))throw new IOException("CACHE_PROMOTION_FAILED");
                destination.setLastModified(now);
                Entry old=entries.put(key,new Entry(destination,now,destination.length(),now));
                if(old!=null){totalBytes-=old.bytes;if(!old.file.equals(destination))old.file.delete();}
                totalBytes+=entries.get(key).bytes;prune(now,destination);
            }
            return destination;
        } finally { if(partial.exists())partial.delete(); }
    }
    private long created(File file) {
        String name=file.getName(); try{return Long.parseLong(name.substring(65,name.length()-4));}catch(RuntimeException ignored){return 0;}
    }
    private void prune(long now,File promoted) {
        Iterator<Map.Entry<String,Entry>> iterator=entries.entrySet().iterator();
        while(iterator.hasNext()) {
            Entry entry=iterator.next().getValue();
            if(now-entry.created>=ttl){if(entry.file.delete() || !entry.file.exists()){totalBytes-=entry.bytes;iterator.remove();}}
        }
        if(totalBytes<=maxBytes && entries.size()<=maxCount)return;
        List<Map.Entry<String,Entry>> oldest=new ArrayList<>(entries.entrySet());
        oldest.sort(Comparator.comparingLong(item->item.getValue().used));
        for(Map.Entry<String,Entry> item:oldest) {
            if(totalBytes<=maxBytes && entries.size()<=maxCount)break;
            Entry entry=item.getValue();if(entry.file.equals(promoted))continue;
            if(entry.file.delete() || !entry.file.exists()){totalBytes-=entry.bytes;entries.remove(item.getKey());}
        }
    }
}
