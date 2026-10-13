package com.xandeflix.prebuilt.cast;
import android.content.Context;
import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.cast.framework.OptionsProvider;
import com.google.android.gms.cast.framework.SessionProvider;
import java.util.List;
public final class CastOptions implements OptionsProvider {
    @Override public com.google.android.gms.cast.framework.CastOptions getCastOptions(Context context) {
        return new com.google.android.gms.cast.framework.CastOptions.Builder()
            .setCastMediaOptions(new com.google.android.gms.cast.framework.media.CastMediaOptions.Builder().setNotificationOptions(null).build())
            .setReceiverApplicationId(CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID)
            .setResumeSavedSession(false).setStopReceiverApplicationWhenEndingSession(true)
            .setEnableReconnectionService(false).build();
    }
    @Override public List<SessionProvider> getAdditionalSessionProviders(Context context){return null;}
}
