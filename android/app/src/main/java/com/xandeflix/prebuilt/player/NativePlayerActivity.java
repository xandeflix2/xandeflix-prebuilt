package com.xandeflix.prebuilt.player;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.PlayerView;

import com.xandeflix.prebuilt.R;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Activity dedicada para reprodução direta via AndroidX Media3 ExoPlayer.
 *
 * Princípios de Design e Segurança:
 * - EXPORTED=FALSE: Não acessível externamente por outras aplicações.
 * - SINGLE_INSTANCE_PER_ACTIVITY: Uma única instância de ExoPlayer gerenciada pelo ciclo de vida.
 * - CLEAN RELEASE: Liberação idempotente e completa do player em onDestroy.
 * - ZERO HEADER LOGGING: Headers de autenticação jamais são registrados em Logcat.
 * - DPAD READY: Suporte aos controles Media3 nativos para navegação por controle remoto / TV.
 */
public class NativePlayerActivity extends AppCompatActivity {

    private static final String TAG = "NativePlayerActivity";

    private PlayerView playerView;
    private ExoPlayer player;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Manter a tela ligada durante a reprodução
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_native_player);
        playerView = findViewById(R.id.native_player_view);

        // Ocultar decorações de sistema para experiência de tela cheia / TV
        hideSystemUi();

        Intent intent = getIntent();
        if (intent == null) {
            Log.e(TAG, "Intent de reprodução nula.");
            finish();
            return;
        }

        String uriString = intent.getStringExtra(PlaybackIntentContract.EXTRA_URI);
        try {
            PlaybackIntentContract.validatePlaybackUri(uriString);
        } catch (Exception e) {
            Log.e(TAG, "Validação de URI falhou: " + e.getMessage());
            finish();
            return;
        }

        String mimeType = intent.getStringExtra(PlaybackIntentContract.EXTRA_MIME_TYPE);
        long startPositionMs = intent.getLongExtra(PlaybackIntentContract.EXTRA_START_POSITION_MS, 0);
        ArrayList<String> headerKeys = intent.getStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_KEYS);
        ArrayList<String> headerValues = intent.getStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_VALUES);

        initializePlayer(uriString, mimeType, startPositionMs, headerKeys, headerValues);
    }

    private void initializePlayer(
            String uriString,
            @Nullable String mimeType,
            long startPositionMs,
            @Nullable ArrayList<String> headerKeys,
            @Nullable ArrayList<String> headerValues
    ) {
        if (player != null) {
            releasePlayer();
        }

        // Configuração de DataSource com headers efêmeros (sem logar valores)
        DefaultHttpDataSource.Factory httpDataSourceFactory = new DefaultHttpDataSource.Factory()
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(15000)
                .setReadTimeoutMs(20000);

        if (headerKeys != null && headerValues != null && headerKeys.size() == headerValues.size()) {
            Map<String, String> requestHeaders = new HashMap<>();
            for (int i = 0; i < headerKeys.size(); i++) {
                requestHeaders.put(headerKeys.get(i), headerValues.get(i));
            }
            httpDataSourceFactory.setDefaultRequestProperties(requestHeaders);
        }

        DefaultMediaSourceFactory mediaSourceFactory = new DefaultMediaSourceFactory(this)
                .setDataSourceFactory(httpDataSourceFactory);

        player = new ExoPlayer.Builder(this)
                .setMediaSourceFactory(mediaSourceFactory)
                .build();

        if (playerView != null) {
            playerView.setPlayer(player);
        }

        MediaItem.Builder mediaItemBuilder = new MediaItem.Builder()
                .setUri(Uri.parse(uriString));

        if (mimeType != null && !mimeType.trim().isEmpty()) {
            mediaItemBuilder.setMimeType(mimeType.trim());
        }

        player.setMediaItem(mediaItemBuilder.build());

        if (startPositionMs > 0) {
            player.seekTo(startPositionMs);
        }

        player.addListener(new Player.Listener() {
            @Override
            public void onPlayerError(PlaybackException error) {
                Log.e(TAG, "ExoPlayer error [code=" + error.errorCode + "]: " + error.getMessage());
            }

            @Override
            public void onPlaybackStateChanged(int playbackState) {
                if (playbackState == Player.STATE_ENDED) {
                    Log.i(TAG, "Reprodução finalizada (STATE_ENDED).");
                }
            }
        });

        player.prepare();
        player.play();

        Log.i(TAG, "Player inicializado com sucesso para URI: " + PlaybackIntentContract.sanitizeUriForLog(uriString));
    }

    private void hideSystemUi() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (player != null) {
            player.pause();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (player != null) {
            player.stop();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        releasePlayer();
    }

    /**
     * Liberação estritamente segura e idempotente do player.
     */
    private void releasePlayer() {
        if (playerView != null) {
            playerView.setPlayer(null);
        }
        if (player != null) {
            player.release();
            player = null;
            Log.i(TAG, "ExoPlayer liberado com sucesso (releasePlayer).");
        }
    }
}
