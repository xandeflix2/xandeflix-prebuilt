package com.xandeflix.prebuilt.player;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Four opaque progress checkpoints. Never contains a URI, title or credential. */
public final class NativeWatchProgressJournal {
    public static final int MAX_EVENTS = 4;
    private static final long MAX_POSITION_MS = 604800000L;

    public static final class Event {
        public final String playbackId;
        public final long positionMs, durationMs, observedAt;
        public final boolean ended;
        Event(String id, long position, long duration, long at, boolean complete) {
            playbackId=id; positionMs=position; durationMs=duration; observedAt=at; ended=complete;
        }
    }

    public static List<Event> decode(String value) {
        List<Event> result=new ArrayList<>();
        if(value==null || value.length()>2048)return result;
        String[] lines=value.split("\n");
        if(lines.length>MAX_EVENTS)return result;
        for(String line:lines) {
            String[] fields=line.split("\\|",-1);
            if(fields.length!=5 || !NativeAndroidPlayerPlugin.validPlaybackId(fields[0]))continue;
            if(!fields[4].equals("0") && !fields[4].equals("1"))continue;
            try {
                long position=Long.parseLong(fields[1]),duration=Long.parseLong(fields[2]),at=Long.parseLong(fields[3]);
                if(position<0 || duration<0 || position>MAX_POSITION_MS || duration>MAX_POSITION_MS || at<=0)continue;
                result.add(new Event(fields[0],position,duration,at,fields[4].equals("1")));
            } catch(NumberFormatException ignored) {}
        }
        return result;
    }

    public static String record(String previous, String id, long position, long duration, boolean ended, long at) {
        if(!NativeAndroidPlayerPlugin.validPlaybackId(id) || position<0 || at<=0)return previous==null?"":previous;
        Map<String,Event> events=new LinkedHashMap<>();
        for(Event event:decode(previous))events.put(event.playbackId,event);
        Event current=events.get(id);
        if(current!=null && (current.observedAt>at || current.ended))return encode(events.values());
        events.remove(id);
        events.put(id,new Event(id,Math.min(position,MAX_POSITION_MS),Math.min(Math.max(0,duration),MAX_POSITION_MS),at,ended));
        while(events.size()>MAX_EVENTS)events.remove(events.keySet().iterator().next());
        return encode(events.values());
    }

    private static String encode(Iterable<Event> events) {
        StringBuilder result=new StringBuilder();
        for(Event event:events) {
            if(result.length()>0)result.append('\n');
            result.append(event.playbackId).append('|').append(event.positionMs).append('|').append(event.durationMs)
                .append('|').append(event.observedAt).append('|').append(event.ended?'1':'0');
        }
        return result.toString();
    }

    private NativeWatchProgressJournal() {}
}
