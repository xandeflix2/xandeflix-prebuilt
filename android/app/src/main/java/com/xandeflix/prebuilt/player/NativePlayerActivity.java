package com.xandeflix.prebuilt.player;

import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.Timeline;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.datasource.HttpDataSource;
import androidx.media3.datasource.DataSource;
import androidx.media3.datasource.DataSpec;
import androidx.media3.datasource.TransferListener;
import androidx.media3.datasource.okhttp.OkHttpDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.PlayerView;

import com.xandeflix.prebuilt.MainActivity;
import com.xandeflix.prebuilt.R;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import okhttp3.OkHttpClient;

/**
 * Xandeflix Prebuilt â€” NativePlayerActivity (Unidade de Transporte T3)
 *
 * Activity de reproduÃ§Ã£o imersiva em tela cheia baseada em AndroidX Media3 / ExoPlayer.
 *
 * PrincÃ­pios Normativos:
 * 1. RUNTIME_ONLY: Headers, tokens e credenciais nÃ£o sÃ£o persistidos em disco nem expostos em logs.
 * 2. SECRETS_PROTECTION: URLs de diagnÃ³stico sÃ£o mascaradas; credenciais nunca trafegam em plain text.
 * 3. T1_INTEGRATION: Consome estritamente o engine de NativeStreamRequest para candidatos e fallback.
 * 4. CANDIDATE_FALLBACK: Fallback acionado SOMENTE para cÃ³digos de erro HTTP invÃ¡lidos (HTTP 4xx/5xx).
 * 5. SYSTEM_BARS: Fullscreen video is immersive on every device; reapplied on focus.
 * 6. DPAD_NAVIGATION: Controles completos de TV/controle remoto (play/pause, seek Â±15s/5s, menu, back).
 * 7. CLEAN_RELEASE: LiberaÃ§Ã£o idempotente e completa de recursos em onDestroy.
 */
public class NativePlayerActivity extends AppCompatActivity {
    private MobilePipController pipController;
    private final MobilePipLifecycle pipLifecycle = new MobilePipLifecycle();
    private android.widget.ImageButton castButton;
    private boolean controlsVisible;
    private boolean inPipMode;
    private String watchPlaybackId;
    private boolean wasCasting;
    private boolean playerForeground;
    private PlayerControls controls;
    private final EpisodeNavigationState episodeNavigation = new EpisodeNavigationState();
    private Runnable episodeTimeout;
    private org.json.JSONObject episodeContext;
    private final Runnable watchProgressProbe=new Runnable(){@Override public void run(){emitWatchProgress(false);observabilityHandler.postDelayed(this,5000);}};
    private void emitWatchProgress(boolean ended) {
        if(player!=null && !wasCasting)NativeAndroidPlayerPlugin.notifyPlaybackProgress(watchPlaybackId,player.getCurrentPosition(),player.getDuration(),ended);
    }
    private static java.lang.ref.WeakReference<NativePlayerActivity> activeActivity = new java.lang.ref.WeakReference<>(null);
    public static void stopActivePlayback() {
        NativePlayerActivity activity=activeActivity.get();
        if(activity!=null)activity.runOnUiThread(() -> { activity.releasePlayer(); activity.finish(); });
    }
    public interface EpisodeReply { void accept(boolean accepted); }
    public static void replaceEpisode(Intent intent,String expectedId,String requestId,EpisodeReply completion) {
        NativePlayerActivity activity=activeActivity.get();
        if(activity==null){Log.i(TAG,"EPISODE_REPLACE_REJECT reason=NO_ACTIVITY");completion.accept(false);return;}
        activity.runOnUiThread(()->{
            if(activity.isFinishing()||activity.isDestroyed()||activity.player==null||activity.wasCasting
                    ||!activity.episodeNavigation.acceptsVisible(expectedId,requestId,activity.playerForeground,activity.inPipMode)) {
                Log.i(TAG,"EPISODE_REPLACE_REJECT foreground="+activity.playerForeground+" pip="+activity.inPipMode
                        +" finishing="+activity.isFinishing()+" player="+(activity.player!=null)+" cast="+activity.wasCasting
                        +" correlated="+activity.episodeNavigation.accepts(expectedId,requestId));
                completion.accept(false);return;
            }
            ParsedPlaybackIntent parsed=parseIntent(intent);
            if(!parsed.valid||!"series".equals(parsed.kind)){completion.accept(false);return;}
            activity.emitWatchProgress(activity.player.getPlaybackState()==Player.STATE_ENDED);
            if(activity.candidateRequests!=null&&activity.currentCandidateIndex<activity.candidateRequests.size())
                com.xandeflix.prebuilt.cast.CastController.get().detach(activity.candidateRequests.get(activity.currentCandidateIndex));
            activity.setupFromIntent(intent);
            activity.setIntent(intent);
            activity.watchPlaybackId=intent.getStringExtra("watchPlaybackId");
            activity.episodeNavigation.started(activity.watchPlaybackId);
            if(activity.episodeTimeout!=null)activity.observabilityHandler.removeCallbacks(activity.episodeTimeout);
            activity.terminalEventEmitted=false;activity.lastMedia3ErrorCode=-1;
            activity.bindEpisodeControls(intent);
            activity.playCandidate(0,activity.initialStartPositionMs);
            Log.i(TAG,"EPISODE_REPLACE_ACCEPT uptime="+android.os.SystemClock.uptimeMillis());
            completion.accept(true);
        });
    }
    public static void cancelEpisodeNavigation(String id,String requestId) {
        NativePlayerActivity activity=activeActivity.get();if(activity==null)return;
        activity.runOnUiThread(()->{if(activity.episodeNavigation.accepts(id,requestId))activity.failEpisodeTransition();});
    }
    private void bindEpisodeControls(Intent intent) {
        episodeContext=null;
        if("series".equals(currentKind))try{episodeContext=new org.json.JSONObject(intent.getStringExtra("episodeContext"));}catch(Exception ignored){}
        if(controls!=null)controls.bind(currentTitle,currentKind,episodeContext);
    }
    private boolean requestEpisode(String reason,@Nullable String episodeId) {
        if(controls==null||wasCasting||!"series".equals(currentKind)||episodeContext==null
                ||!NativeAndroidPlayerPlugin.validPlaybackId(watchPlaybackId)||isFinishing()
                ||("select".equals(reason)?!controls.containsEpisode(episodeId):!controls.hasNext()))return false;
        if(episodeNavigation.pending())return true;
        String requestId=java.util.UUID.randomUUID().toString();
        if(!episodeNavigation.request(watchPlaybackId,requestId))return false;
        Log.i(TAG,"EPISODE_NAVIGATION_REQUEST reason="+reason+" uptime="+android.os.SystemClock.uptimeMillis());
        emitWatchProgress("ended".equals(reason));
        if(player!=null)player.pause();
        controls.close();
        controls.setTransitioning(true);
        episodeTimeout=()->{if(episodeNavigation.accepts(watchPlaybackId,requestId))failEpisodeTransition();};
        observabilityHandler.postDelayed(episodeTimeout,30000);
        NativeAndroidPlayerPlugin.notifyEpisodeNavigation(watchPlaybackId,requestId,reason,episodeId);
        return true;
    }
    private void failEpisodeTransition() {
        Log.i(TAG,"EPISODE_NAVIGATION_FAILED uptime="+android.os.SystemClock.uptimeMillis());
        episodeNavigation.close();
        emitTerminalEvent(false,"NEXT_EPISODE_FAILED");releasePlayer();finish();
    }
    public static void terminateCastPlayback(boolean ended,String errorCode) {
        NativePlayerActivity activity=activeActivity.get();
        if(activity!=null && !activity.isFinishing())activity.runOnUiThread(()->{activity.emitTerminalEvent(ended,errorCode);activity.releasePlayer();activity.finish();});
        else NativeAndroidPlayerPlugin.notifyPlaybackTerminal(0,ended,errorCode);
    }

    public static final String TAG = "NativePlayerActivity";
    public static final int AUTO_HIDE_CONTROLLER_MS = 3500;
    public static final String PLAYER_ORIENTATION_POLICY = "SENSOR_LANDSCAPE_PREFERRED";

    private PlayerView playerView;
    private ExoPlayer player;

    private List<NativeStreamRequest> candidateRequests;
    private int currentCandidateIndex = 0;
    private String currentKind = "movie";
    private String currentTitle = "";
    private long initialStartPositionMs = 0L;
    private boolean terminalEventEmitted = false;
    private int lastMedia3ErrorCode = -1;
    private final Handler observabilityHandler = new Handler(Looper.getMainLooper());
    private boolean moviePositionAdvancedLogged = false;
    private final ExecutorService diagnosticExecutor = Executors.newSingleThreadExecutor();
    private String playAttemptId = "";
    private String lastPlaybackCheckpoint = "NATIVE_ACTIVITY_STARTED";
    private void checkpoint(String value) { lastPlaybackCheckpoint = value; Log.i(TAG, "playAttemptId=" + playAttemptId + " LAST_PLAYBACK_CHECKPOINT=" + value); }
    private final Runnable moviePositionProbe = new Runnable() {
        @Override
        public void run() {
            if (!"movie".equalsIgnoreCase(currentKind) || moviePositionAdvancedLogged) {
                return;
            }
            if (player != null && player.getCurrentPosition() > 0L) {
                moviePositionAdvancedLogged = true;
                Log.i(TAG, "MOVIE_POSITION_ADVANCED=SIM");
                return;
            }
            observabilityHandler.postDelayed(this, 1000L);
        }
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Manter a tela ligada durante a reproduÃ§Ã£o
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // OrientaÃ§Ã£o preferencial em modo paisagem para reproduÃ§Ã£o de mÃ­dia
        try {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        } catch (Exception e) {
            Log.w(TAG, "NÃ£o foi possÃ­vel definir orientaÃ§Ã£o via sensor landscape: " + e.getMessage());
        }

        setContentView(R.layout.activity_native_player);
        playerView = findViewById(R.id.native_player_view);
        activeActivity = new java.lang.ref.WeakReference<>(this);
        MainActivity.bindSafeInsets(playerView);
        controls=new PlayerControls(this,playerView,()->player,
                ()->{emitTerminalEvent(false,null);releasePlayer();finish();},
                ()->requestEpisode("next",null), id->requestEpisode("select",id));
        if(com.xandeflix.prebuilt.cast.CastController.mobile(this)) {
            castButton=com.xandeflix.prebuilt.cast.CastController.get().button(this);
            android.widget.FrameLayout slot=playerView.findViewById(R.id.player_cast_slot);
            slot.addView(castButton,new android.widget.FrameLayout.LayoutParams(-1,-1));
            controlsVisible=playerView.isControllerFullyVisible();
            playerView.setControllerVisibilityListener((PlayerView.ControllerVisibilityListener) visibility -> {
                controlsVisible=visibility==View.VISIBLE;
                updateCastButtonVisibility();
            });
            updateCastButtonVisibility();
        }

        // Fullscreen video hides system bars; browsing restores them on handhelds.
        applyImmersiveFullscreen(getWindow());

        Intent intent = getIntent();
        if (intent == null) {
            Log.e(TAG, "Intent de reproduÃ§Ã£o nula recebida.");
            finish();
            return;
        }

        boolean resolved = setupFromIntent(intent);
        if (!resolved) {
            Log.e(TAG, "Falha na validaÃ§Ã£o ou resoluÃ§Ã£o do contrato de Intent.");
            finish();
            return;
        }

        watchPlaybackId=intent.getStringExtra("watchPlaybackId");
        episodeNavigation.started(watchPlaybackId);
        bindEpisodeControls(intent);
        playCandidate(0, initialStartPositionMs);
        if(NativeAndroidPlayerPlugin.validPlaybackId(watchPlaybackId))observabilityHandler.postDelayed(watchProgressProbe,5000);
    }

    /**
     * Objeto de transferÃªncia com dados validados e sanitizados da Intent de reproduÃ§Ã£o.
     */
    public static class ParsedPlaybackIntent {
        public final boolean valid;
        public final String rawUri;
        public final String title;
        public final String kind;
        public final long startPositionMs;
        public final Map<String, String> headers;
        public final List<NativeStreamRequest> candidateRequests;

        public ParsedPlaybackIntent(
                boolean valid,
                String rawUri,
                String title,
                String kind,
                long startPositionMs,
                Map<String, String> headers,
                List<NativeStreamRequest> candidateRequests
        ) {
            this.valid = valid;
            this.rawUri = rawUri;
            this.title = title;
            this.kind = kind;
            this.startPositionMs = startPositionMs;
            this.headers = headers;
            this.candidateRequests = candidateRequests != null ? candidateRequests : Collections.emptyList();
        }
    }

    /**
     * Valida o contrato da Intent e resolve a lista determinÃ­stica de candidatos via NativeStreamRequest.
     */
    public static ParsedPlaybackIntent parseIntent(Intent intent) {
        if (intent == null) {
            return new ParsedPlaybackIntent(false, null, null, null, 0L, null, null);
        }

        String rawUri = intent.getStringExtra(PlaybackIntentContract.EXTRA_URI);
        if (rawUri == null || rawUri.trim().isEmpty()) {
            rawUri = intent.getStringExtra("rawUri");
        }
        if (rawUri == null || rawUri.trim().isEmpty()) {
            rawUri = intent.getStringExtra("uri");
        }

        if (rawUri == null || rawUri.trim().isEmpty()) {
            return new ParsedPlaybackIntent(false, null, null, null, 0L, null, null);
        }

        try {
            PlaybackIntentContract.validatePlaybackUri(rawUri);
        } catch (Exception e) {
            return new ParsedPlaybackIntent(false, rawUri, null, null, 0L, null, null);
        }

        String title = intent.getStringExtra(PlaybackIntentContract.EXTRA_TITLE);
        if (title == null) {
            title = "";
        }

        String kind = intent.getStringExtra("kind");
        if (kind == null || kind.trim().isEmpty()) {
            kind = "movie";
        } else {
            kind = kind.trim();
        }

        long startPositionMs = intent.getLongExtra(PlaybackIntentContract.EXTRA_START_POSITION_MS, 0L);

        ArrayList<String> headerKeys = intent.getStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_KEYS);
        ArrayList<String> headerValues = intent.getStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_VALUES);
        Map<String, String> explicitHeaders = new LinkedHashMap<>();
        if (headerKeys != null && headerValues != null && headerKeys.size() == headerValues.size()) {
            for (int i = 0; i < headerKeys.size(); i++) {
                explicitHeaders.put(headerKeys.get(i), headerValues.get(i));
            }
        }

        List<NativeStreamRequest> candidates = NativeStreamRequest.fromUrlWithHeaders(rawUri, explicitHeaders, null);
        if (candidates.isEmpty()) {
            return new ParsedPlaybackIntent(false, rawUri, title, kind, startPositionMs, explicitHeaders, null);
        }

        return new ParsedPlaybackIntent(true, rawUri, title, kind, startPositionMs, explicitHeaders, candidates);
    }

    /**
     * Extrai parÃ¢metros de reproduÃ§Ã£o e constrÃ³i a lista determinÃ­stica de candidatos via NativeStreamRequest.
     */
    public boolean setupFromIntent(Intent intent) {
        ParsedPlaybackIntent parsed = parseIntent(intent);
        if (!parsed.valid) {
            Log.e(TAG, "Falha na validaÃ§Ã£o ou resoluÃ§Ã£o dos parÃ¢metros da Intent.");
            return false;
        }

        this.currentTitle = parsed.title;
        this.currentKind = parsed.kind;
        this.initialStartPositionMs = parsed.startPositionMs;
        this.candidateRequests = parsed.candidateRequests;
        this.currentCandidateIndex = 0;
        return true;
    }

    /**
     * Prepara e inicia a reproduÃ§Ã£o do candidato informado.
     */
    public void playCandidate(int index, long resumePositionMs) {
        if (candidateRequests == null || index < 0 || index >= candidateRequests.size()) {
            return;
        }

        currentCandidateIndex = index;
        NativeStreamRequest request = candidateRequests.get(index);
        playAttemptId = SecurePlaybackDiagnosticProbe.newAttemptId();
        checkpoint("NATIVE_ACTIVITY_STARTED");
        if (SecurePlaybackDiagnosticProbe.enabled(this)) diagnosticExecutor.execute(() -> SecurePlaybackDiagnosticProbe.run(request, playAttemptId));
        if ("movie".equalsIgnoreCase(currentKind) && index == 0) {
            moviePositionAdvancedLogged = false;
        }

        // Log estritamente sanitizado (zero secrets exposure)
        Log.i(TAG, "PLAY_ATTEMPT_START playAttemptId=" + playAttemptId + " streamFp=" + request.getDiagnosticFingerprint() + " scheme=" + request.getDiagnosticScheme() + " portClass=" + request.getDiagnosticPortClass() + " container=" + request.getDiagnosticContainerHint() + " headerNames=" + request.getDiagnosticHeaderNames());

        HttpDataSource.Factory httpFactory = buildHttpDataSourceFactory(request, SecurePlaybackDiagnosticProbe.enabled(this));
        DefaultMediaSourceFactory mediaSourceFactory = new DefaultMediaSourceFactory(this)
                .setDataSourceFactory(httpFactory);
        PlaybackBufferPolicy.Profile bufferProfile = PlaybackBufferPolicy.forDevice(this, currentKind);
        bufferProfile.configureMediaSource(mediaSourceFactory);

        if (player == null) {
            DefaultLoadControl loadControl = bufferProfile.buildLoadControl();
            bufferProfile.logConfiguration();
            player = new ExoPlayer.Builder(this)
                    .setSeekBackIncrementMs(10000)
                    .setSeekForwardIncrementMs(10000)
                    .setLoadControl(loadControl)
                    .setMediaSourceFactory(mediaSourceFactory)
                    .build();

            if (playerView != null) {
                playerView.setPlayer(player);
                playerView.setControllerShowTimeoutMs(AUTO_HIDE_CONTROLLER_MS);
                pipController = new MobilePipController(this,playerView,player,currentKind);
            }

            player.addListener(new Player.Listener() {
                @Override public void onTracksChanged(@NonNull androidx.media3.common.Tracks tracks){if(controls!=null)controls.updateTracks();}
                @Override public void onIsPlayingChanged(boolean playing) {
                    if(!playing)emitWatchProgress(player!=null && player.getPlaybackState()==Player.STATE_ENDED);
                }
                @Override
                public void onPlayerError(@NonNull PlaybackException error) {
                    handlePlaybackError(error);
                }

                @Override
                public void onRenderedFirstFrame() {
                    checkpoint("FIRST_FRAME");
                    Log.i(TAG, "RENDERED_FIRST_FRAME playAttemptId=" + playAttemptId);
                    if ("movie".equalsIgnoreCase(currentKind)) {
                        Log.i(TAG, "MOVIE_FIRST_FRAME_RENDERED=SIM");
                    }
                }

                @Override
                public void onTimelineChanged(@NonNull Timeline timeline, int reason) {
                    if ("movie".equalsIgnoreCase(currentKind) && !timeline.isEmpty()) {
                        long durationMs = player != null ? player.getDuration() : 0L;
                        String durationClass = durationMs > 0L ? "KNOWN" : "UNKNOWN";
                        Log.i(TAG, "MOVIE_TIMELINE_AVAILABLE=SIM, durationClass=" + durationClass);
                    }
                }

                @Override
                public void onPlaybackStateChanged(int playbackState) {
                    Log.i(TAG, "PLAYBACK_STATE_" + movieStateName(playbackState) + " playAttemptId=" + playAttemptId);
                    if (player != null && (playbackState == Player.STATE_BUFFERING || playbackState == Player.STATE_READY)) {
                        Log.i(TAG, "BUFFER_STATE state=" + playbackState + " bufferedMs=" + player.getTotalBufferedDuration());
                    }
                    if (playbackState == Player.STATE_READY) checkpoint("PLAYER_READY");
                    if ("movie".equalsIgnoreCase(currentKind)) {
                        Log.i(TAG, "MOVIE_PLAYER_STATE=" + movieStateName(playbackState));
                    }
                    if (playbackState == Player.STATE_ENDED) {
                        Log.i(TAG, "ReproduÃ§Ã£o finalizada (STATE_ENDED).");
                        if(!requestEpisode("ended",null)){emitTerminalEvent(true, null);finish();}
                    }
                }
            });
        }

        MediaItem mediaItem = new MediaItem.Builder()
                .setUri(Uri.parse(request.getMediaUrl()))
                .build();

        androidx.media3.exoplayer.source.MediaSource mediaSource =
                mediaSourceFactory.createMediaSource(mediaItem);
        if ("movie".equalsIgnoreCase(currentKind)) {
            Log.i(TAG, "MOVIE_MEDIA_SOURCE_CREATED=SIM");
        }
        player.setMediaSource(mediaSource);
        checkpoint("DATASOURCE_OPEN");

        if (resumePositionMs > 0 && !"live".equalsIgnoreCase(currentKind)) {
            player.seekTo(resumePositionMs);
        }

        player.setPlayWhenReady(true);
        player.prepare();
        if(com.xandeflix.prebuilt.cast.CastController.mobile(this))com.xandeflix.prebuilt.cast.CastController.get().attach(this,request,currentTitle,currentKind,watchPlaybackId,
                ()->player!=null ? player.getCurrentPosition() : 0,
                ()->{wasCasting=true;if(player!=null)player.pause();},
                position->{wasCasting=false;if(player!=null){player.seekTo(position);player.play();}});
        if ("movie".equalsIgnoreCase(currentKind)) {
            Log.i(TAG, "MOVIE_PREPARE_CALLED=SIM");
            observabilityHandler.removeCallbacks(moviePositionProbe);
            observabilityHandler.postDelayed(moviePositionProbe, 1000L);
        }
    }

    /**
     * Tratamento sanitizado de erros do player com candidate fallback condicional.
     */
    public void handlePlaybackError(PlaybackException error) {
        String category = categorizeError(error);
        String statusCode = NativeStreamRequest.describeHttpStatus(error);
        int errorCode = error != null ? error.errorCode : -1;
        lastMedia3ErrorCode = errorCode;

        if ("movie".equalsIgnoreCase(currentKind)) {
            Log.e(TAG, "MOVIE_PLAYBACK_ERROR_CODE=" + category + ", httpStatus=" + statusCode);
        }
        Log.e(TAG, "PLAYER_ERROR playAttemptId=" + playAttemptId + " category=" + category + ", code=" + errorCode + ", httpStatus=" + statusCode + ", LAST_PLAYBACK_CHECKPOINT=" + lastPlaybackCheckpoint + ", rootExceptionClass=" + (error == null ? "none" : error.getClass().getSimpleName()));

        if (NativeStreamRequest.shouldTryNextCandidate(error)) {
            int nextIndex = currentCandidateIndex + 1;
            if (candidateRequests != null && nextIndex < candidateRequests.size()) {
                Log.i(TAG, "Falha de rede HTTP (" + statusCode + ") no candidato #" + (currentCandidateIndex + 1)
                        + ". Disparando prÃ³ximo candidato #" + (nextIndex + 1) + " de " + candidateRequests.size());
                long pos = player != null ? player.getCurrentPosition() : 0L;
                playCandidate(nextIndex, pos);
                return;
            } else {
                Log.w(TAG, "Todos os candidatos de streaming foram esgotados. Fallback indisponÃ­vel.");
                emitTerminalEvent(false, "NATIVE_ERROR", category, statusCode);
                finish();
            }
        } else {
            Log.w(TAG, "Erro da categoria " + category + " nÃ£o Ã© elegÃ­vel para fallback automÃ¡tico de candidato.");
            emitTerminalEvent(false, "NATIVE_ERROR", category, statusCode);
            finish();
        }
    }

    /**
     * CategorizaÃ§Ã£o padronizada e sanitizada de erros do Media3.
     */
    public static String categorizeError(PlaybackException error) {
        if (error == null) {
            return "UNKNOWN";
        }
        if (error.errorCode == PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS
                || NativeStreamRequest.findInvalidResponseCodeException(error) != null) {
            return "HTTP_ERROR";
        }
        if (error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_TIMEOUT
                || error.errorCode == PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED) {
            return "NETWORK_TIMEOUT";
        }
        if (error.errorCode == PlaybackException.ERROR_CODE_DECODER_INIT_FAILED
                || error.errorCode == PlaybackException.ERROR_CODE_DECODING_FAILED
                || error.errorCode == PlaybackException.ERROR_CODE_DECODER_QUERY_FAILED) {
            return "DECODER_ERROR";
        }
        if (error.errorCode >= 2000 && error.errorCode <= 2999) {
            return "SOURCE_UNAVAILABLE";
        }
        if (hasParserCause(error)) { return "MEDIA_PARSER_FAILURE"; }
        if (error.errorCode >= 3000 && error.errorCode <= 3999) {
            return "MEDIA_ERROR";
        }
        return "UNKNOWN";
    }

    /**
     * ConstrÃ³i DataSource HTTP alimentado com os dados e allowlist de NativeStreamRequest.
     */
    private static boolean hasParserCause(Throwable error) {
        Throwable current = error;
        while (current != null) {
            String name = current.getClass().getSimpleName();
            if ("ParserException".equals(name) || "UnrecognizedInputFormatException".equals(name) || current instanceof java.io.EOFException) return true;
            current = current.getCause();
        }
        return false;
    }
    private static String movieStateName(int playbackState) {
        switch (playbackState) {
            case Player.STATE_IDLE:
                return "IDLE";
            case Player.STATE_BUFFERING:
                return "BUFFERING";
            case Player.STATE_READY:
                return "READY";
            case Player.STATE_ENDED:
                return "ENDED";
            default:
                return "UNKNOWN";
        }
    }

    private static OkHttpClient sharedOkHttpClient = null;

    public static synchronized OkHttpClient getSharedOkHttpClient() {
        if (sharedOkHttpClient == null) {
            sharedOkHttpClient = new OkHttpClient.Builder()
                    .dns(new ResilientDns())
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(20, TimeUnit.SECONDS)
                    .followRedirects(true)
                    .followSslRedirects(true)
                    .build();
        }
        return sharedOkHttpClient;
    }

    public static synchronized void setSharedOkHttpClientForTesting(@Nullable OkHttpClient client) {
        sharedOkHttpClient = client;
    }

    public static HttpDataSource.Factory buildHttpDataSourceFactory(NativeStreamRequest request, boolean diagnosticsEnabled) {
        OkHttpDataSource.Factory factory = new OkHttpDataSource.Factory(getSharedOkHttpClient())
                .setUserAgent(request.getUserAgent());

        if (diagnosticsEnabled) factory.setTransferListener(new TransferListener() {
            private long total;
            private boolean first;
            private long requestedPosition;
            @Override public void onTransferInitializing(DataSource source, DataSpec spec, boolean network) { requestedPosition=spec.position; Log.i(TAG, "DATASOURCE_OPEN_REQUESTED"); }
            @Override public void onTransferStart(DataSource source, DataSpec spec, boolean network) { Log.i(TAG, "DATASOURCE_OPEN_SUCCESS DATASOURCE_TRANSFER_STARTED"); if(source instanceof HttpDataSource) { HttpDataSource http=(HttpDataSource)source; Log.i(TAG, describeHttpRange(requestedPosition,http.getResponseCode(),http.getResponseHeaders())); } }
            @Override public void onBytesTransferred(DataSource source, DataSpec spec, boolean network, int bytes) { total += bytes; if (!first && bytes > 0) { first=true; Log.i(TAG, "PLAYER_DATASOURCE_FIRST_BYTE"); } Log.i(TAG, "DATASOURCE_BYTES_TRANSFERRED=" + total); }
            @Override public void onTransferEnd(DataSource source, DataSpec spec, boolean network) { Log.i(TAG, "DATASOURCE_TRANSFER_ENDED DATASOURCE_CLOSED bytes=" + total); }
        });

        if (!request.getRequestHeaders().isEmpty()) {
            factory.setDefaultRequestProperties(new LinkedHashMap<>(request.getRequestHeaders()));
        }
        return factory;
    }

    /** Closed debug breadcrumb. Never formats a URL or a raw header value. */
    public static String describeHttpRange(long requestedPosition, int status, Map<String, java.util.List<String>> headers) {
        String result="ABSENT", start="UNAVAILABLE";
        if(headers!=null) for(Map.Entry<String,java.util.List<String>> entry:headers.entrySet()) {
            if(!"Content-Range".equalsIgnoreCase(entry.getKey())) continue;
            result="INVALID";
            if(entry.getValue()!=null && entry.getValue().size()==1 && entry.getValue().get(0)!=null) {
                java.util.regex.Matcher matcher=java.util.regex.Pattern.compile("(?i)bytes ([0-9]+)-([0-9]+)/([0-9]+|\\*)").matcher(entry.getValue().get(0));
                if(matcher.matches()) try {
                    long first=Long.parseLong(matcher.group(1)), last=Long.parseLong(matcher.group(2));
                    long total="*".equals(matcher.group(3))?Long.MAX_VALUE:Long.parseLong(matcher.group(3));
                    if(last>=first && total>last) { start=Long.toString(first); result=first==requestedPosition?"MATCH":"MISMATCH"; }
                } catch(NumberFormatException ignored) { }
            }
            break;
        }
        return "HTTP_RANGE requested="+(requestedPosition>=0?Long.toString(requestedPosition):"UNAVAILABLE")
                +" status="+(status>=100 && status<=599?Integer.toString(status):"UNAVAILABLE")
                +" start="+start+" result="+result;
    }

    /** Compatibility overload used by existing unit tests and non-diagnostic callers. */
    public static HttpDataSource.Factory buildHttpDataSourceFactory(NativeStreamRequest request) {
        return buildHttpDataSourceFactory(request, false);
    }

    /**
     * ConstrÃ³i o DefaultLoadControl com os buffers de referÃªncia canÃ´nicos.
     */
    public static DefaultLoadControl buildLoadControl(
            int minBufferMs,
            int maxBufferMs,
            int bufferForPlaybackMs,
            int bufferForPlaybackAfterRebufferMs
    ) {
        return new DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                        minBufferMs,
                        maxBufferMs,
                        bufferForPlaybackMs,
                        bufferForPlaybackAfterRebufferMs
                )
                .build();
    }

    /**
     * Applies the shared handheld/TV system-bar policy to the player window.
     */
    public static void applyImmersiveFullscreen(Window window) {
        if (window != null && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(lp);
        }
        MainActivity.applyAppSystemUiPolicy(window, true);
    }

    /**
     * Tratamento centralizado e testÃ¡vel dos eventos de controle remoto / D-pad e tecla BACK.
     */
    public boolean handleDpadKey(int keyCode, int action, String kind) {
        return handleDpadKey(keyCode, action, kind, this.player, this.playerView, () -> {
            emitTerminalEvent(false, null);
            releasePlayer();
            try {
                finish();
            } catch (Exception ignored) {
            }
        });
    }

    public static boolean handleDpadKey(
            int keyCode,
            int action,
            String kind,
            @Nullable Player targetPlayer,
            @Nullable PlayerView targetView
    ) {
        return handleDpadKey(keyCode, action, kind, targetPlayer, targetView, null);
    }

    public static boolean handleDpadKey(
            int keyCode,
            int action,
            String kind,
            @Nullable Player targetPlayer,
            @Nullable PlayerView targetView,
            @Nullable Runnable onBackAction
    ) {
        if (action != KeyEvent.ACTION_DOWN) {
            return false;
        }

        // Tecla BACK: encerra o player, libera recursos e finaliza a Activity
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (onBackAction != null) {
                onBackAction.run();
            }
            return true;
        }

        if (targetPlayer == null) {
            return false;
        }

        // D-PAD CENTER / ENTER: toggle play / pause e exibe controles
        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER
                || keyCode == KeyEvent.KEYCODE_ENTER
                || keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER) {
            if (targetPlayer.isPlaying()) {
                targetPlayer.pause();
            } else {
                targetPlayer.play();
            }
            if (targetView != null) {
                targetView.showController();
            }
            return true;
        }

        // Teclas de mÃ­dia direta
        if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY) {
            targetPlayer.play();
            return true;
        }

        if (keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE) {
            targetPlayer.pause();
            return true;
        }

        if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE) {
            if (targetPlayer.isPlaying()) {
                targetPlayer.pause();
            } else {
                targetPlayer.play();
            }
            return true;
        }

        boolean isLive = "live".equalsIgnoreCase(kind);

        // D-PAD RIGHT: avanÃ§a 15 segundos (apenas para VOD/filmes/sÃ©ries)
        if (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) {
            if (!isLive) {
                long newPos = targetPlayer.getCurrentPosition() + 15000L;
                long duration = targetPlayer.getDuration();
                if (duration > 0 && newPos > duration) {
                    newPos = duration;
                }
                targetPlayer.seekTo(newPos);
                if (targetView != null) {
                    targetView.showController();
                }
                return true;
            }
        }

        // D-PAD LEFT: retrocede 5 segundos (apenas para VOD/filmes/sÃ©ries)
        if (keyCode == KeyEvent.KEYCODE_DPAD_LEFT) {
            if (!isLive) {
                long newPos = Math.max(0, targetPlayer.getCurrentPosition() - 5000L);
                targetPlayer.seekTo(newPos);
                if (targetView != null) {
                    targetView.showController();
                }
                return true;
            }
        }

        // Tecla MENU: alternar visibilidade do controller
        if (keyCode == KeyEvent.KEYCODE_MENU) {
            if (targetView != null) {
                if (targetView.isControllerFullyVisible()) {
                    targetView.hideController();
                } else {
                    targetView.showController();
                }
            }
            return true;
        }

        return false;
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if(event!=null&&controls!=null) {
            int key=event.getKeyCode();
            if(episodeNavigation.pending()&&(key==KeyEvent.KEYCODE_MEDIA_PLAY||key==KeyEvent.KEYCODE_MEDIA_PAUSE||key==KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
                    ||key==KeyEvent.KEYCODE_MEDIA_FAST_FORWARD||key==KeyEvent.KEYCODE_MEDIA_REWIND))return true;
            if(controls.dialogOpen())return super.dispatchKeyEvent(event);
            if(key==KeyEvent.KEYCODE_MEDIA_NEXT){if(event.getAction()==KeyEvent.ACTION_DOWN)requestEpisode("next",null);return true;}
            if(key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT||key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN
                    ||key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER||key==KeyEvent.KEYCODE_NUMPAD_ENTER) {
                if(controls.locked())return super.dispatchKeyEvent(event);
                if(!playerView.isControllerFullyVisible()) {
                    if(event.getAction()==KeyEvent.ACTION_DOWN){playerView.showController();playerView.findViewById(androidx.media3.ui.R.id.exo_play_pause).requestFocus();}
                    return true;
                }
                return super.dispatchKeyEvent(event);
            }
        }
        if (event != null && handleDpadKey(event.getKeyCode(), event.getAction(), currentKind)) {
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveFullscreen(getWindow());
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        playerForeground=true;
        pipLifecycle.resumed();
        applyImmersiveFullscreen(getWindow());
    }

    @Override
    protected void onPause() {
        super.onPause();
        playerForeground=false;
        emitWatchProgress(false);
        if (player != null && (pipController == null || !pipController.eligible())) {
            player.pause();
        }
    }

    @Override
    protected void onStop() {
        pipLifecycle.stopped(true, isFinishing(), isChangingConfigurations(), wasCasting,
                () -> { if (player != null) player.pause(); },
                () -> {
                    emitTerminalEvent(false, null);
                    releasePlayer();
                    finish();
                });
        super.onStop();
    }

    @Override
    protected void onDestroy() {
        emitTerminalEvent(false, null);
        super.onDestroy();
        observabilityHandler.removeCallbacks(moviePositionProbe);
        observabilityHandler.removeCallbacks(watchProgressProbe);
        releasePlayer();
    }

    /**
     * LiberaÃ§Ã£o estritamente segura e idempotente do player e views associadas.
     */
    public void releasePlayer() {
        episodeNavigation.close();
        if(episodeTimeout!=null)observabilityHandler.removeCallbacks(episodeTimeout);
        if(controls!=null)controls.close();
        pipLifecycle.close();
        observabilityHandler.removeCallbacks(moviePositionProbe);
        observabilityHandler.removeCallbacks(watchProgressProbe);
        emitWatchProgress(false);
        if(candidateRequests!=null && currentCandidateIndex<candidateRequests.size())com.xandeflix.prebuilt.cast.CastController.get().detach(candidateRequests.get(currentCandidateIndex));
        if(pipController!=null){pipController.close();pipController=null;}
        if (playerView != null) {
            playerView.setPlayer(null);
        }
        if (player != null) {
            player.release();
            player = null;
            Log.i(TAG, "ExoPlayer liberado com sucesso (releasePlayer).");
        }
    }

    private void emitTerminalEvent(boolean ended, @Nullable String errorCode) {
        emitTerminalEvent(ended, errorCode, null, null);
    }

    private void emitTerminalEvent(boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus) {
        if (terminalEventEmitted) {
            return;
        }
        terminalEventEmitted = true;
        emitWatchProgress(ended);
        long positionMs = player != null ? Math.max(0L, player.getCurrentPosition()) : 0L;
        NativeAndroidPlayerPlugin.notifyPlaybackTerminal(positionMs, ended, errorCode, errorCategory, httpStatus,
                errorCategory != null && lastMedia3ErrorCode >= 1000 ? lastMedia3ErrorCode : null,
                errorCategory != null ? lastPlaybackCheckpoint : null);
    }

    // Getters para validaÃ§Ã£o e testes unitÃ¡rios
    public ExoPlayer getPlayer() {
        return player;
    }

    @Override protected void onUserLeaveHint() {
        super.onUserLeaveHint();if(pipController!=null)pipController.onLeave();
    }
    @Override public void onPictureInPictureModeChanged(boolean pip, android.content.res.Configuration config) {
        super.onPictureInPictureModeChanged(pip,config);
        pipLifecycle.modeChanged(pip);
        inPipMode=pip;
        if(pipController!=null)pipController.modeChanged(pip);
        updateCastButtonVisibility();
    }

    private void updateCastButtonVisibility() {
        if(castButton!=null)castButton.setVisibility(controlsVisible && !inPipMode ? View.VISIBLE : View.GONE);
    }

    public List<NativeStreamRequest> getCandidateRequests() {
        return candidateRequests;
    }

    public int getCurrentCandidateIndex() {
        return currentCandidateIndex;
    }

    public String getCurrentKind() {
        return currentKind;
    }

    public String getCurrentTitle() {
        return currentTitle;
    }

    public long getInitialStartPositionMs() {
        return initialStartPositionMs;
    }
}
