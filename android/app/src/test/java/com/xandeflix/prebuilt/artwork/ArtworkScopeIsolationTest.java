package com.xandeflix.prebuilt.artwork;

import java.io.*;
import java.nio.file.*;
import java.util.concurrent.atomic.AtomicInteger;

/** Real disk cache test, no Android runtime, network or source credentials. */
public final class ArtworkScopeIsolationTest {
    public static void main(String[] args) throws Exception {
        File root = Files.createTempDirectory("xf-artwork-scope-").toFile();
        try {
            ArtworkDiskCache cache = new ArtworkDiskCache(root,1024,10,100000,512);
            AtomicInteger calls = new AtomicInteger();
            String uri = "https://example.invalid/shared-image.jpg";
            ArtworkDiskCache.Fetcher fetch = (requested,out) -> {
                if(!uri.equals(requested)) throw new AssertionError("FETCH_URI_CHANGED");
                out.write(calls.incrementAndGet());
            };
            File a = cache.get(uri,"s_activation_A",1000,fetch,f -> true);
            File same = cache.get(uri,"s_activation_A",1001,fetch,f -> true);
            if(!a.equals(same) || calls.get()!=1) throw new AssertionError("SAME_SCOPE_NOT_CACHED");
            if(cache.getCached(uri,"s_activation_B",1002)!=null) throw new AssertionError("OLD_SCOPE_REUSED");
            File b = cache.get(uri,"s_activation_B",1002,fetch,f -> true);
            if(a.equals(b) || calls.get()!=2 || Files.readAllBytes(a.toPath())[0]!=1 || Files.readAllBytes(b.toPath())[0]!=2) throw new AssertionError("SCOPE_BYTES_NOT_ISOLATED");
            ArtworkDiskCache restarted = new ArtworkDiskCache(root,1024,10,100000,512);
            if(!b.equals(restarted.getCached(uri,"s_activation_B",1003))) throw new AssertionError("NAMESPACE_LOST_ON_RESTART");
            for(String invalid : new String[]{"../unsafe", "", "unverified", "s_short"}) {
                try { cache.get(uri,invalid,1004,fetch,f -> true); throw new AssertionError("INVALID_SCOPE_ACCEPTED"); }
                catch(IOException expected) { if(!"CACHE_INVALID_SCOPE".equals(expected.getMessage())) throw expected; }
            }
            cache.get(uri,1005,fetch,f -> true);
            if(calls.get()!=3 || cache.getCached(uri,"s_activation_C",1006)!=null) throw new AssertionError("LEGACY_SCOPE_LEAK");
            System.out.println("ARTWORK_SCOPE_ISOLATION=PASS");
        } finally {
            try(var paths=Files.walk(root.toPath())) {
                for(Path path : paths.sorted(java.util.Comparator.reverseOrder()).toList()) Files.delete(path);
            }
        }
    }
}
