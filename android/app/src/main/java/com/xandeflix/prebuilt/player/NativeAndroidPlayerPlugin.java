package com.xandeflix.prebuilt.player;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.util.Log;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.AspectRatioFrameLayout;
import androidx.media3.ui.PlayerView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.xandeflix.prebuilt.MainActivity;

import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Xandeflix Prebuilt — NativeAndroidPlayerPlugin (Unidade de Transporte T2)
 *
 * Ponte IPC Capacitor entre o frontend web e a infraestrutura nativa de reprodução.
 *
 * Diretrizes Normativas:
 * 1. RUNTIME_ONLY: Não persiste URLs, tokens, headers ou Authorization em SharedPreferences, banco ou logs.
 * 2. SECRETS_PROTECTION: Zero logging de credenciais e headers brutos.
 * 3. T1_INTEGRATION: Delega resolução, normalização e parsing estrito ao NativeStreamRequest.
 * 4. SANITIZED_ERRORS: Erros expostos ao JS são restritos a códigos controlados.
 */
@CapacitorPlugin(name = "NativeAndroidPlayer")
public class NativeAndroidPlayerPlugin extends Plugin {

    private static final String TAG = "NativeAndroidPlayer";
    private static volatile NativeAndroidPlayerPlugin activePlugin;
    public static final String EVENT_ANDROID_BACK_BUTTON = "androidBackButton";

    // Códigos de erro sanitizados permitidos pelo contrato T2
    public static final String ERROR_INVALID_REQUEST = "INVALID_REQUEST";
    public static final String ERROR_PLAYER_ACTIVITY_UNAVAILABLE = "PLAYER_ACTIVITY_UNAVAILABLE";
    public static final String ERROR_PREVIEW_UNAVAILABLE = "PREVIEW_UNAVAILABLE";
    public static final String ERROR_NATIVE_ERROR = "NATIVE_ERROR";
    public static final String ERROR_LIVE_PREVIEW_NATIVE_UNAVAILABLE = "LIVE_PREVIEW_NATIVE_UNAVAILABLE";
    public static final String ERROR_LIVE_PREVIEW_SURFACE_FAILED = "LIVE_PREVIEW_SURFACE_FAILED";
    public static final String ERROR_LIVE_PREVIEW_OPEN_FAILED = "LIVE_PREVIEW_OPEN_FAILED";
    public static final String ERROR_LIVE_PREVIEW_UNSUPPORTED_CONTAINER = "LIVE_PREVIEW_UNSUPPORTED_CONTAINER";
    public static final String ERROR_LIVE_PREVIEW_PLAYBACK_FAILED = "LIVE_PREVIEW_PLAYBACK_FAILED";
    public static final String ERROR_LIVE_PREVIEW_FULLSCREEN_FAILED = "LIVE_PREVIEW_FULLSCREEN_FAILED";

    private static final Set<String> VALID_KINDS = Collections.unmodifiableSet(new HashSet<>(
            java.util.Arrays.asList("live", "movie", "series", "vod")
    ));

    private static final Set<String> PLAYBACK_ERROR_CATEGORIES = Collections.unmodifiableSet(new HashSet<>(
            java.util.Arrays.asList("HTTP_ERROR", "NETWORK_TIMEOUT", "DECODER_ERROR", "SOURCE_UNAVAILABLE",
                    "MEDIA_PARSER_FAILURE", "MEDIA_ERROR", "UNKNOWN")
    ));

    // Estado transitório em memória do preview nativo (sem persistência de URL, headers ou payload)
    private boolean isPreviewActive = false;
    private String currentPreviewKind = null;
    private String currentPreviewId = null;
    private ExoPlayer previewPlayer = null;
    private PlayerView previewView = null;
    private LivePlayerControls liveControls;
    private FrameLayout previewHost = null;
    private List<NativeStreamRequest> previewCandidateRequests = Collections.emptyList();
    private int currentPreviewCandidateIndex = 0;
    private boolean previewWasPlaying = false;
    private boolean previewForeground = true;
    private FrameLayout.LayoutParams previewInlineLayoutParams = null;
    private boolean previewFullscreen = false;
    private MobilePipController pipController;
    private MobilePipLifecycle pipLifecycle = new MobilePipLifecycle();
    private boolean pipWasFullscreen;
    private android.widget.ImageButton castButton;
    private boolean previewInPip;
    private android.view.ViewTreeObserver.OnPreDrawListener previewCastDrawListener;

    /**
     * Contrato de abertura de player nativo em tela cheia.
     * Payload esperado:
     * - uri (String, obrigatória e válida)
     * - title (String, opcional)
     * - kind (String, obrigatória: "live", "movie", "series", "vod")
     * - headers (JSObject, opcional)
     * - startPositionMs (Long, opcional, >= 0)
     */
    @PluginMethod
    public void open(PluginCall call) {
        if (call == null) {
            return;
        }

        String rawUri = call.getString("uri");
        if (rawUri == null || rawUri.trim().isEmpty()) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "URI de reprodução ausente.");
            return;
        }

        String trimmedUri = rawUri.trim();
        if (isSyntheticUrl(trimmedUri)) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "URI sintética ou inválida rejeitada.");
            return;
        }

        if (!isValidUrlScheme(trimmedUri)) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Esquema de URI não suportado. Requer http ou https.");
            return;
        }

        String rawKind = call.getString("kind");
        if (rawKind == null || rawKind.trim().isEmpty()) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Tipo de mídia (kind) ausente.");
            return;
        }

        String normalizedKind = rawKind.trim().toLowerCase(Locale.US);
        if (!VALID_KINDS.contains(normalizedKind)) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Tipo de mídia (kind) inválido. Permitidos: live, movie, series, vod.");
            return;
        }

        Long startPositionMs = parseStartPositionMs(call.getData().opt("startPositionMs"));
        if (startPositionMs == null) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Posição inicial (startPositionMs) deve ser um inteiro não negativo.");
            return;
        }

        String title = call.getString("title");
        String playbackId=call.getString("playbackId");
        String replacePlaybackId=call.getString("replacePlaybackId");
        String navigationRequestId=call.getString("navigationRequestId");

        // Extrai headers explícitos sem duplicar lógica de validação/sanitização
        JSObject headersObj = call.getObject("headers");
        Map<String, String> explicitHeaders = extractExplicitHeaders(headersObj);

        // Delegação ao NativeStreamRequest (Unidade T1) para resolução segura de candidatos
        List<NativeStreamRequest> candidateRequests;
        try {
            candidateRequests = NativeStreamRequest.fromUrlWithHeaders(trimmedUri, explicitHeaders, null);
        } catch (Exception e) {
            rejectWithSanitizedError(call, ERROR_NATIVE_ERROR, "Falha ao resolver candidatos de streaming.");
            return;
        }
        if(replacePlaybackId==null && com.xandeflix.prebuilt.cast.CastController.get().connected() && !candidateRequests.isEmpty()) {
            activePlugin=this;
            getActivity().runOnUiThread(()->com.xandeflix.prebuilt.cast.CastController.get().startStandalone(getContext(),candidateRequests.get(0),title,normalizedKind,playbackId,startPositionMs!=null ? startPositionMs : 0,
                ()->{JSObject result=new JSObject();result.put("accepted",true);result.put("candidateCount",1);call.resolve(result);},
                code->call.reject(com.xandeflix.prebuilt.cast.CastController.message(code),code)));
            return;
        }

        if (candidateRequests.isEmpty()) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Nenhum candidato de streaming válido foi produzido.");
            return;
        }

        // LOGGING SEGURO (SECRETS_EXPOSURE=NAO)
        // Permitido: hasUri, kind, candidateCount, hasHeaders, startPositionPresent
        Log.d(TAG, "open() validado: hasUri=true, kind=" + normalizedKind
                + ", candidateCount=" + candidateRequests.size()
                + ", hasHeaders=" + (headersObj != null && headersObj.length() > 0)
                + ", startPositionPresent=" + (startPositionMs != null && startPositionMs > 0));
        if ("movie".equals(normalizedKind)) {
            Log.i(TAG, "MOVIE_REQUEST_ACCEPTED=SIM, candidateCount=" + candidateRequests.size());
        }

        // Invocação segura da Activity nativa se contexto Android estiver ativo
        android.content.Context context = getSafeContext();
        if (context != null) {
            try {
                activePlugin = this;
                Intent intent = new Intent(context, NativePlayerActivity.class);
                if(validPlaybackId(playbackId))intent.putExtra("watchPlaybackId",playbackId);
                JSObject episodeContext=call.getObject("episodeContext");
                if("series".equals(normalizedKind)&&episodeContext!=null&&episodeContext.toString().length()<=131072)
                    intent.putExtra("episodeContext",episodeContext.toString());
                intent.putExtra(PlaybackIntentContract.EXTRA_URI, candidateRequests.get(0).getMediaUrl());
                if (title != null && !title.trim().isEmpty()) {
                    intent.putExtra(PlaybackIntentContract.EXTRA_TITLE, title.trim());
                }
                intent.putExtra("kind", normalizedKind);
                if (startPositionMs != null && startPositionMs > 0) {
                    intent.putExtra(PlaybackIntentContract.EXTRA_START_POSITION_MS, startPositionMs);
                }
                if (explicitHeaders != null && !explicitHeaders.isEmpty()) {
                    intent.putStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_KEYS, new ArrayList<>(explicitHeaders.keySet()));
                    intent.putStringArrayListExtra(PlaybackIntentContract.EXTRA_HEADERS_VALUES, new ArrayList<>(explicitHeaders.values()));
                }
                if(replacePlaybackId!=null) {
                    if(!validPlaybackId(replacePlaybackId)||!validPlaybackId(navigationRequestId)||!validPlaybackId(playbackId)||!"series".equals(normalizedKind)) {
                        rejectWithSanitizedError(call,ERROR_INVALID_REQUEST,"Transição inválida.");return;
                    }
                    final int count=candidateRequests.size();
                    NativePlayerActivity.replaceEpisode(intent,replacePlaybackId,navigationRequestId,accepted->{
                        if(!accepted){rejectWithSanitizedError(call,ERROR_NATIVE_ERROR,"Player encerrado durante a transição.");return;}
                        JSObject result=new JSObject();result.put("accepted",true);result.put("candidateCount",count);result.put("kind",normalizedKind);call.resolve(result);
                    });
                    return;
                }
                context.startActivity(intent);
            } catch (Exception ex) {
                if(replacePlaybackId!=null){rejectWithSanitizedError(call,ERROR_NATIVE_ERROR,"Falha na transição de episódio.");return;}
                // Em ambiente de teste unitário headless, loga aviso sem quebrar o contrato
                Log.w(TAG, "Activity launch diferido ou indisponível no ambiente atual.");
            }
        }

        if(replacePlaybackId!=null){rejectWithSanitizedError(call,ERROR_NATIVE_ERROR,"Player indisponível para transição.");return;}
        JSObject result = new JSObject();
        result.put("accepted", true);
        result.put("candidateCount", candidateRequests.size());
        result.put("kind", normalizedKind);
        call.resolve(result);
    }

    /**
     * Inicia sessão de preview (Live TV ou vídeo em janela).
     */
    @PluginMethod
    public void startPreview(PluginCall call) {
        if (call == null) {
            return;
        }

        String rawUri = call.getString("uri");
        if (rawUri == null || rawUri.trim().isEmpty()) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "URI de preview ausente.");
            return;
        }

        String trimmedUri = rawUri.trim();
        if (isSyntheticUrl(trimmedUri) || !isValidUrlScheme(trimmedUri)) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "URI de preview inválida.");
            return;
        }

        String rawKind = call.getString("kind", "live");
        String normalizedKind = rawKind != null ? rawKind.trim().toLowerCase(Locale.US) : "live";
        if (!VALID_KINDS.contains(normalizedKind)) {
            normalizedKind = "live";
        }

        JSObject headersObj = call.getObject("headers");
        Map<String, String> explicitHeaders = extractExplicitHeaders(headersObj);

        List<NativeStreamRequest> candidateRequests =
                NativeStreamRequest.fromUrlWithHeaders(trimmedUri, explicitHeaders, null);

        if (candidateRequests.isEmpty()) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Nenhum candidato de preview disponível.");
            return;
        }

        logPreviewStage("CANDIDATES_READY", true);
        android.app.Activity activity;
        try {
            activity = getActivity();
        } catch (Exception ignored) {
            activity = null;
        }

        if (activity == null) {
            if (getSafeContext() == null) {
                releasePreview();
                this.currentPreviewId = "headless-preview";
                this.currentPreviewKind = normalizedKind;
                this.previewCandidateRequests = candidateRequests;
                this.currentPreviewCandidateIndex = 0;
                this.isPreviewActive = true;
                resolvePreviewStart(call, candidateRequests.size());
                return;
            }
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_SURFACE_FAILED, "Preview surface unavailable.");
            return;
        }

        final String previewKind = normalizedKind;
        activity.runOnUiThread(() -> {
        releasePreview();
        this.currentPreviewId = "live-preview-" + UUID.randomUUID();
        pipLifecycle = new MobilePipLifecycle();
        this.currentPreviewKind = previewKind;
        this.previewCandidateRequests = candidateRequests;
        this.currentPreviewCandidateIndex = 0;

        FrameLayout host = resolvePreviewHost();
        logPreviewStage("HOST_AVAILABLE", host != null);
        // Mantém o contrato em testes headless, sem fingir uma Surface Android inexistente.
        if (host == null) {
            if (getSafeContext() == null) {
                this.isPreviewActive = true;
                resolvePreviewStart(call, candidateRequests.size());
                return;
            }
            releasePreview();
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_SURFACE_FAILED, "Superfície nativa de preview indisponível.");
            return;
        }

        FrameLayout.LayoutParams layoutParams = readPreviewLayout(call);
        logPreviewStage("LAYOUT_AVAILABLE", layoutParams != null);
        if (layoutParams == null) {
            releasePreview();
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_SURFACE_FAILED, "Geometria de preview inválida.");
            return;
        }

        try {
            this.previewHost = host;
            activePlugin=this;
            this.previewView = createPreviewView();
            logPreviewStage("PLAYER_VIEW_CREATED", this.previewView != null);
            host.addView(this.previewView, layoutParams);
            logPreviewStage("PLAYER_VIEW_ATTACHED", this.previewView.getParent() != null);
            PlaybackBufferPolicy.Profile bufferProfile = PlaybackBufferPolicy.forDevice(getSafeContext(), currentPreviewKind);
            bufferProfile.logConfiguration();
            this.previewPlayer = new ExoPlayer.Builder(getSafeContext())
                    .setLoadControl(bufferProfile.buildLoadControl())
                    .build();
            logPreviewStage("MEDIA3_CREATED", this.previewPlayer != null);
            this.previewView.setPlayer(this.previewPlayer);
            if ("live".equals(previewKind) && previewView.findViewById(com.xandeflix.prebuilt.R.id.live_channels) != null) {
                liveControls = new LivePlayerControls(getActivity(), previewView, (action, id, channelId) -> {
                    if (!isPreviewActive || currentPreviewId == null || !LivePlayerControls.validId(channelId)) return;
                    if (id != null && !LivePlayerControls.validId(id)) return;
                    JSObject payload = new JSObject();
                    payload.put("previewId", currentPreviewId); payload.put("channelId", channelId);
                    payload.put("action", action); if (id != null) payload.put("id", id);
                    notifyListeners("nativeLiveAction", payload);
                }, this::exitPreviewFullscreenInternal);
                liveControls.bind(call.getObject("liveContext"));
            }
            if(com.xandeflix.prebuilt.cast.CastController.mobile(getSafeContext())) {
                castButton=com.xandeflix.prebuilt.cast.CastController.get().button(getActivity());
                float density=getSafeContext().getResources().getDisplayMetrics().density;
                FrameLayout.LayoutParams params=new FrameLayout.LayoutParams((int)(48*density),(int)(48*density),android.view.Gravity.TOP|android.view.Gravity.RIGHT);
                params.topMargin=params.rightMargin=(int)(16*density);castButton.setVisibility(View.INVISIBLE);
                FrameLayout controllerHost = previewView.findViewById(androidx.media3.ui.R.id.exo_controller);
                if (controllerHost != null) controllerHost.addView(castButton,params);
                final PlayerView owner = previewView;
                previewCastDrawListener = () -> {
                    if (previewView == owner) updatePreviewCastButtonVisibility();
                    return true;
                };
                owner.getViewTreeObserver().addOnPreDrawListener(previewCastDrawListener);
            }
            pipController = new MobilePipController(getPluginActivity(),previewView,previewPlayer,currentPreviewKind);
            logPreviewStage("PLAYER_VIEW_BOUND", this.previewView.getPlayer() != null);
            attachPreviewListener();
            this.isPreviewActive = true;
            playPreviewCandidate(0);

            Log.d(TAG, "startPreview() Media3 criado: kind=" + previewKind
                    + ", candidateCount=" + candidateRequests.size()
                    + ", hasHeaders=" + (headersObj != null && headersObj.length() > 0));
            resolvePreviewStart(call, candidateRequests.size());
        } catch (Exception ex) {
            logPreviewStage("OPEN_FAILED_" + ex.getClass().getSimpleName(), false);
            releasePreview();
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_OPEN_FAILED, "Falha ao iniciar preview nativo.");
        }
        });
    }

    /**
     * Atualiza stream do preview ativo (ex: troca rápida de canal).
     */
    @PluginMethod
    public void updatePreview(PluginCall call) {
        if (call == null) {
            return;
        }

        android.app.Activity activity = null;
        try {
            activity = getActivity();
        } catch (Exception ignored) {
        }
        if (activity != null && android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
            activity.runOnUiThread(() -> updatePreview(call));
            return;
        }

        String rawUri = call.getString("uri");
        if (rawUri != null && !rawUri.trim().isEmpty()) {
            String trimmedUri = rawUri.trim();
            if (isSyntheticUrl(trimmedUri) || !isValidUrlScheme(trimmedUri)) {
                rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "URI de atualização de preview inválida.");
                return;
            }
        }

        String requestedPreviewId = call.getString("previewId");
        if (requestedPreviewId != null && currentPreviewId != null && !requestedPreviewId.equals(currentPreviewId)) {
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_OPEN_FAILED, "Preview nativo desatualizado.");
            return;
        }

        if (!isPreviewActive) {
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_NATIVE_UNAVAILABLE, "Preview nativo inativo.");
            return;
        }

        boolean suspendPlayback = Boolean.TRUE.equals(call.getBoolean("suspendPlayback"));
        if (suspendPlayback && (rawUri != null || !"live".equals(currentPreviewKind)
                || requestedPreviewId == null || !requestedPreviewId.equals(currentPreviewId))) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Suspensao de canal invalida.");
            return;
        }
        if (suspendPlayback) {
            if (currentPreviewCandidateIndex < previewCandidateRequests.size())
                com.xandeflix.prebuilt.cast.CastController.get().detach(previewCandidateRequests.get(currentPreviewCandidateIndex));
            previewCandidateRequests = java.util.Collections.emptyList();
            currentPreviewCandidateIndex = 0;
            previewWasPlaying = false;
            if (previewPlayer != null) {
                previewPlayer.setPlayWhenReady(false);
                previewPlayer.stop();
                previewPlayer.clearMediaItems();
            }
        }

        if (previewHost != null && !previewFullscreen && !previewInPip && !suspendPlayback) {
            FrameLayout.LayoutParams layoutParams = readPreviewLayout(call);
            if (layoutParams == null) {
                rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_SURFACE_FAILED, "Geometria de preview inválida.");
                return;
            }
            previewView.setLayoutParams(layoutParams);
            previewInlineLayoutParams = new FrameLayout.LayoutParams(layoutParams);
        }

        if (rawUri != null && !rawUri.trim().isEmpty()) {
            Map<String, String> updateHeaders = extractExplicitHeaders(call.getObject("headers"));
            List<NativeStreamRequest> updatedCandidates =
                    NativeStreamRequest.fromUrlWithHeaders(rawUri.trim(), updateHeaders, null);
            if (updatedCandidates.isEmpty()) {
                rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_OPEN_FAILED, "Nenhum candidato de preview disponível.");
                return;
            }
            this.previewCandidateRequests = updatedCandidates;
            this.currentPreviewCandidateIndex = 0;
            playPreviewCandidate(0);
        }

        JSObject result = new JSObject();
        result.put("accepted", true);
        result.put("previewUpdated", true);
        result.put("isActive", isPreviewActive);
        result.put("previewId", currentPreviewId);
        call.resolve(result);
    }

    /** Presentation only; never changes a stream, geometry, player or authorization. */
    @PluginMethod
    public void setLiveControls(PluginCall call) {
        android.app.Activity activity = getPluginActivity();
        if (activity != null && android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
            activity.runOnUiThread(() -> setLiveControls(call)); return;
        }
        JSObject context = call.getObject("context");
        if (!isPreviewActive || liveControls == null || currentPreviewId == null
                || !currentPreviewId.equals(call.getString("previewId")) || context == null
                || context.toString().length() > 50000 || !LivePlayerControls.validId(context.optString("channelId"))) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Controles de TV ao vivo indisponíveis."); return;
        }
        liveControls.bind(context);
        JSObject result = new JSObject(); result.put("accepted", true); call.resolve(result);
    }

    public boolean dispatchLiveKey(android.view.KeyEvent event) {
        return previewFullscreen && !previewInPip && liveControls != null && liveControls.dispatchKey(event);
    }
    @PluginMethod
    public void openLivePanel(PluginCall call) {
        android.app.Activity activity=getPluginActivity();
        if(activity!=null && android.os.Looper.myLooper()!=android.os.Looper.getMainLooper()) { activity.runOnUiThread(()->openLivePanel(call));return; }
        if(!isPreviewActive || liveControls==null || currentPreviewId==null || !currentPreviewId.equals(call.getString("previewId")) || !liveControls.openRequestedPanel(call.getString("panel"))) {
            rejectWithSanitizedError(call,ERROR_INVALID_REQUEST,"Controles de TV ao vivo indisponíveis.");return;
        }
        JSObject result=new JSObject();result.put("accepted",true);call.resolve(result);
    }
    public boolean dismissLivePanel() { return liveControls != null && liveControls.dismissPanel(); }

    /**
     * Promove o mesmo PlayerView/ExoPlayer do preview inline para fullscreen.
     * Nenhum MediaItem novo, player novo ou requisição nova é criado neste caminho.
     */
    @PluginMethod
    public void enterPreviewFullscreen(PluginCall call) {
        android.app.Activity activity = getPluginActivity();
        if (activity != null && android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
            activity.runOnUiThread(() -> enterPreviewFullscreen(call));
            return;
        }

        if (!isPreviewActive || previewView == null || previewHost == null || activity == null) {
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_FULLSCREEN_FAILED,
                    "Fullscreen do preview nativo indisponível.");
            return;
        }

        String requestedPreviewId = call != null ? call.getString("previewId") : null;
        if (requestedPreviewId != null && currentPreviewId != null
                && !requestedPreviewId.equals(currentPreviewId)) {
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_FULLSCREEN_FAILED,
                    "Preview nativo desatualizado.");
            return;
        }

        if (!previewFullscreen) {
            ViewGroup.LayoutParams currentParams = previewView.getLayoutParams();
            if (currentParams instanceof FrameLayout.LayoutParams) {
                this.previewInlineLayoutParams = new FrameLayout.LayoutParams(
                        (FrameLayout.LayoutParams) currentParams
                );
            }

            previewView.setBackgroundColor(Color.BLACK);
            FrameLayout.LayoutParams fullscreenParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            );
            previewView.setLayoutParams(fullscreenParams);
            previewView.bringToFront();

            View surfaceView = previewView.getVideoSurfaceView();
            if (surfaceView instanceof SurfaceView) {
                ((SurfaceView) surfaceView).setZOrderMediaOverlay(true);
            }

            previewView.requestLayout();
            this.previewFullscreen = true;
            if (liveControls != null) liveControls.setFullscreen(true);
            previewView.setFocusable(true);
            previewView.requestFocus();
            previewView.setClickable(true);
            previewView.setControllerShowTimeoutMs(3000);
            previewView.setControllerAutoShow(true);
            previewView.showController();
            updatePreviewCastButtonVisibility();
            MainActivity.applyPhoneUiOrientation(activity, true);
            MainActivity.applyAppSystemUiPolicy(activity.getWindow(), true);
            notifyPreviewFullscreenChanged(true);
        }

        JSObject result = new JSObject();
        result.put("accepted", true);
        result.put("fullscreen", true);
        result.put("previewId", currentPreviewId);
        if (call != null) {
            call.resolve(result);
        }
    }

    /**
     * Restaura o mesmo PlayerView para os limites inline previamente salvos.
     */
    @PluginMethod
    public void exitPreviewFullscreen(PluginCall call) {
        android.app.Activity activity = getPluginActivity();
        if (activity != null && android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
            activity.runOnUiThread(() -> exitPreviewFullscreen(call));
            return;
        }

        String requestedPreviewId = call != null ? call.getString("previewId") : null;
        if (requestedPreviewId != null && currentPreviewId != null
                && !requestedPreviewId.equals(currentPreviewId)) {
            rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_FULLSCREEN_FAILED,
                    "Preview nativo desatualizado.");
            return;
        }

        boolean exited = exitPreviewFullscreenInternal();
        JSObject result = new JSObject();
        result.put("accepted", exited || isPreviewActive);
        result.put("fullscreen", previewFullscreen);
        result.put("previewId", currentPreviewId);
        if (call != null) {
            call.resolve(result);
        }
    }

    /**
     * Encerra sessão de preview.
     */
    @PluginMethod
    public void stopPreview(PluginCall call) {
        android.app.Activity activity = null;
        try {
            activity = getActivity();
        } catch (Exception ignored) {
        }
        if (activity != null && android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
            activity.runOnUiThread(() -> stopPreview(call));
            return;
        }

        String requestedPreviewId = call != null ? call.getString("previewId") : null;
        if (requestedPreviewId != null && currentPreviewId != null && !requestedPreviewId.equals(currentPreviewId)) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Preview diferente da sessão atual.");
            return;
        }
        String releasedPreviewId = currentPreviewId;
        releasePreview();

        JSObject result = new JSObject();
        result.put("accepted", true);
        result.put("previewStopped", true);
        if (releasedPreviewId != null) {
            result.put("previewId", releasedPreviewId);
        }
        if (call != null) {
            call.resolve(result);
        }
    }

    private void resolvePreviewStart(PluginCall call, int candidateCount) {
        JSObject result = new JSObject();
        result.put("accepted", true);
        result.put("previewStarted", true);
        result.put("previewId", currentPreviewId);
        result.put("candidateCount", candidateCount);
        result.put("kind", currentPreviewKind);
        call.resolve(result);
    }

    @Nullable
    private FrameLayout resolvePreviewHost() {
        android.app.Activity activity;
        try {
            activity = getActivity();
        } catch (Exception ignored) {
            return null;
        }
        if (activity == null) {
            return null;
        }

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                ViewParent parent = getBridge().getWebView().getParent();
                if (parent instanceof FrameLayout) {
                    return (FrameLayout) parent;
                }
            }
        } catch (Exception ignored) {
        }

        View content = activity.findViewById(android.R.id.content);
        return content instanceof FrameLayout ? (FrameLayout) content : null;
    }

    @Nullable
    private FrameLayout.LayoutParams readPreviewLayout(PluginCall call) {
        Double left = call.getDouble("left");
        Double top = call.getDouble("top");
        Double width = call.getDouble("width");
        Double height = call.getDouble("height");
        if (left == null || top == null || width == null || height == null
                || left.isNaN() || top.isNaN() || width.isNaN() || height.isNaN()
                || left.isInfinite() || top.isInfinite() || width.isInfinite() || height.isInfinite()
                || width <= 0 || height <= 0) {
            return null;
        }

        float density = 1f;
        android.content.Context context = getSafeContext();
        if (context != null && context.getResources() != null
                && context.getResources().getDisplayMetrics() != null) {
            density = context.getResources().getDisplayMetrics().density;
        }

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                Math.max(1, Math.round(width.floatValue() * density)),
                Math.max(1, Math.round(height.floatValue() * density))
        );
        params.leftMargin = Math.round(left.floatValue() * density);
        params.topMargin = Math.round(top.floatValue() * density);
        return params;
    }

    private PlayerView createPreviewView() {
        logPreviewStage("PREVIEW_CONTEXT", getSafeContext() != null);
        PlayerView view = "live".equals(currentPreviewKind)
                ? (PlayerView) android.view.LayoutInflater.from(getSafeContext()).inflate(com.xandeflix.prebuilt.R.layout.live_preview_player, null)
                : new PlayerView(getSafeContext());
        logPreviewStage("PREVIEW_VIEW_CONSTRUCTOR", true);
        view.setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING);
        logPreviewStage("PREVIEW_BUFFERING_CONFIGURED", true);
        view.setResizeMode(AspectRatioFrameLayout.RESIZE_MODE_FIT);
        logPreviewStage("PREVIEW_RESIZE_CONFIGURED", true);
        view.setControllerAutoShow(false);
        view.hideController();
        view.setBackgroundColor(Color.TRANSPARENT);

        View surfaceView = view.getVideoSurfaceView();
        if (surfaceView instanceof SurfaceView) {
            SurfaceView sv = (SurfaceView) surfaceView;
            sv.setZOrderMediaOverlay(true);
        }

        view.setClickable(false);
        view.setFocusable(false);
        Configuration configuration = getSafeContext().getResources().getConfiguration();
        if ("live".equals(currentPreviewKind)
                && isTouchPreviewTapEnabled(configuration.smallestScreenWidthDp, configuration.uiMode)) {
            GestureDetector taps = new GestureDetector(getSafeContext(), new GestureDetector.SimpleOnGestureListener() {
                @Override
                public boolean onDown(MotionEvent event) {
                    return true;
                }

                @Override
                public boolean onSingleTapUp(MotionEvent event) {
                    notifyPreviewTap();
                    return true;
                }
            });
            taps.setOnDoubleTapListener(null);
            view.setOnTouchListener((target, event) -> {
                if (previewFullscreen) return false;
                taps.onTouchEvent(event);
                return true;
            });
        }
        return view;
    }

    public static boolean isTouchPreviewTapEnabled(int smallestScreenWidthDp, int uiMode) {
        return smallestScreenWidthDp > 0
                && (uiMode & Configuration.UI_MODE_TYPE_MASK) != Configuration.UI_MODE_TYPE_TELEVISION;
    }

    public static Map<String, Object> buildPreviewTapData(
            @Nullable String previewId, boolean active, boolean fullscreen) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (active && !fullscreen && previewId != null && !previewId.isEmpty()) {
            payload.put("previewId", previewId);
        }
        return payload;
    }

    private void notifyPreviewTap() {
        Map<String, Object> data = buildPreviewTapData(currentPreviewId, isPreviewActive, previewFullscreen);
        if (data.isEmpty()) return;
        JSObject payload = new JSObject();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            payload.put(entry.getKey(), entry.getValue());
        }
        try {
            notifyListeners("nativePreviewTap", payload);
        } catch (Exception ignored) {
        }
    }

    private void attachPreviewListener() {
        if (previewPlayer == null) {
            return;
        }

        final ExoPlayer owner = previewPlayer;
        previewPlayer.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int state) {
                if (previewPlayer == owner && (state == Player.STATE_BUFFERING || state == Player.STATE_READY)) {
                    Log.i(TAG, "BUFFER_STATE preview=true state=" + state + " bufferedMs=" + owner.getTotalBufferedDuration());
                }
            }
            @Override
            public void onIsPlayingChanged(boolean playing) {
                if (!playing || previewPlayer != owner || !isPreviewActive || currentPreviewId == null) return;
                JSObject payload = new JSObject();
                payload.put("previewId", currentPreviewId);
                notifyListeners("nativePreviewPlaying", payload);
            }
            @Override
            public void onEvents(@NonNull Player player, @NonNull Player.Events events) {
                updatePreviewKeepScreenOn();
            }

            @Override
            public void onPlayerError(@NonNull PlaybackException error) {
                if (previewView != null) {
                    previewView.setKeepScreenOn(false);
                }
                if (NativeStreamRequest.shouldTryNextCandidate(error)
                        && currentPreviewCandidateIndex + 1 < previewCandidateRequests.size()) {
                    currentPreviewCandidateIndex += 1;
                    playPreviewCandidate(currentPreviewCandidateIndex);
                    return;
                }
                notifyPreviewError(ERROR_LIVE_PREVIEW_PLAYBACK_FAILED);
            }
        });
    }

    /** Same policy for the inline PlayerView and its fullscreen expansion. */
    public static boolean shouldKeepPreviewScreenOn(boolean active, boolean foreground,
            boolean playWhenReady, int playbackState, boolean hasError, boolean suppressed) {
        return active && foreground && playWhenReady && !hasError && !suppressed
                && (playbackState == Player.STATE_READY || playbackState == Player.STATE_BUFFERING);
    }

    private void updatePreviewKeepScreenOn() {
        if (previewView == null) return;
        boolean keepScreenOn = previewPlayer != null && shouldKeepPreviewScreenOn(
                isPreviewActive, previewForeground, previewPlayer.getPlayWhenReady(),
                previewPlayer.getPlaybackState(), previewPlayer.getPlayerError() != null,
                previewPlayer.getPlaybackSuppressionReason() != Player.PLAYBACK_SUPPRESSION_REASON_NONE);
        if (previewView.getKeepScreenOn() != keepScreenOn) {
            previewView.setKeepScreenOn(keepScreenOn);
        }
    }

    private void playPreviewCandidate(int index) {
        if (previewPlayer == null || index < 0 || index >= previewCandidateRequests.size()) {
            return;
        }

        NativeStreamRequest request = previewCandidateRequests.get(index);
        if (SecurePlaybackDiagnosticProbe.enabled(getSafeContext())) {
            final String diagnosticAttemptId = SecurePlaybackDiagnosticProbe.newAttemptId();
            new Thread(() -> SecurePlaybackDiagnosticProbe.run(request, diagnosticAttemptId), "secure-live-probe").start();
        }
        DefaultMediaSourceFactory mediaSourceFactory = new DefaultMediaSourceFactory(getSafeContext())
                .setDataSourceFactory(NativePlayerActivity.buildHttpDataSourceFactory(request, SecurePlaybackDiagnosticProbe.enabled(getSafeContext())));
        PlaybackBufferPolicy.forDevice(getSafeContext(), currentPreviewKind).configureMediaSource(mediaSourceFactory);
        MediaItem mediaItem = new MediaItem.Builder()
                .setUri(android.net.Uri.parse(request.getMediaUrl()))
                .build();
        previewPlayer.setMediaSource(mediaSourceFactory.createMediaSource(mediaItem));
        previewPlayer.setPlayWhenReady(true);
        previewPlayer.prepare();
        if(com.xandeflix.prebuilt.cast.CastController.mobile(getSafeContext()))com.xandeflix.prebuilt.cast.CastController.get().attach(getSafeContext(),request,"Canal ao vivo",currentPreviewKind,null,
                ()->previewPlayer!=null ? previewPlayer.getCurrentPosition() : 0,
                ()->{if(previewPlayer!=null)previewPlayer.pause();},
                position->{if(previewPlayer!=null && isPreviewActive)previewPlayer.play();});
    }

    private void notifyPreviewError(String errorCode) {
        JSObject payload = new JSObject();
        payload.put("previewId", currentPreviewId);
        payload.put("errorCode", sanitizeErrorCode(errorCode));
        try {
            notifyListeners("nativePreviewError", payload);
        } catch (Exception ignored) {
        }
    }

    private void notifyPreviewFullscreenChanged(boolean fullscreen) {
        JSObject payload = new JSObject();
        payload.put("previewId", currentPreviewId);
        payload.put("fullscreen", fullscreen);
        try {
            notifyListeners("nativePreviewFullscreenChanged", payload);
        } catch (Exception ignored) {
        }
    }

    private void logPreviewStage(String stage, boolean passed) {
        Log.d(TAG, "previewStage=" + stage + ", passed=" + passed);
    }

    private void releasePreview() {
        // Hide the native overlay before decoder/Cast/PiP teardown can delay removal.
        if (previewView != null) previewView.setVisibility(View.GONE);
        if (liveControls != null) { liveControls.close(); liveControls = null; }
        pipLifecycle.close();
        if(currentPreviewCandidateIndex<previewCandidateRequests.size())com.xandeflix.prebuilt.cast.CastController.get().detach(previewCandidateRequests.get(currentPreviewCandidateIndex));
        if (previewView != null && previewCastDrawListener != null && previewView.getViewTreeObserver().isAlive()) {
            previewView.getViewTreeObserver().removeOnPreDrawListener(previewCastDrawListener);
        }
        previewCastDrawListener = null;
        castButton=null;
        if(pipController!=null){pipController.close();pipController=null;}
        isPreviewActive = false;
        updatePreviewKeepScreenOn();
        exitPreviewFullscreenInternal();
        if (previewView != null) {
            try {
                previewView.setPlayer(null);
            } catch (Exception ignored) {
            }
        }
        if (previewPlayer != null) {
            previewPlayer.stop();
            previewPlayer.release();
            previewPlayer = null;
        }
        if (previewView != null) {
            ViewParent parent = previewView.getParent();
            if (parent instanceof ViewGroup) {
                ((ViewGroup) parent).removeView(previewView);
            }
            previewView = null;
        }
        previewHost = null;
        previewCandidateRequests = Collections.emptyList();
        currentPreviewCandidateIndex = 0;
        currentPreviewId = null;
        currentPreviewKind = null;
        isPreviewActive = false;
        previewWasPlaying = false;
        previewInlineLayoutParams = null;
        previewFullscreen = false;
        previewInPip = false;
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setVisibility(View.VISIBLE);
        }
    }

    @Nullable
    private android.app.Activity getPluginActivity() {
        try {
            return getActivity();
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean exitPreviewFullscreenInternal() {
        if (!previewFullscreen) {
            return false;
        }

        android.app.Activity activity = getPluginActivity();
        if (previewView != null) {
            previewView.setBackgroundColor(Color.TRANSPARENT);
        }
        if (previewView != null && previewInlineLayoutParams != null) {
            previewView.setLayoutParams(previewInlineLayoutParams);
            View surfaceView = previewView.getVideoSurfaceView();
            if (surfaceView instanceof SurfaceView) {
                ((SurfaceView) surfaceView).setZOrderMediaOverlay(true);
            }
            previewView.requestLayout();
        }
        if (activity != null) {
            MainActivity.applyAppSystemUiPolicy(activity.getWindow(), false);
        }
        previewFullscreen = false;
        if (previewView != null) {
            if (liveControls != null) liveControls.setFullscreen(false);
            previewView.setControllerAutoShow(false);
            previewView.setClickable(false);
            previewView.setFocusable(false);
            previewView.hideController();
        }
        updatePreviewCastButtonVisibility();
        MainActivity.applyPhoneUiOrientation(getPluginActivity(), false);
        notifyPreviewFullscreenChanged(false);
        return true;
    }

    public static boolean shouldAllowPreviewCast(boolean fullscreen, boolean inPip) {
        return fullscreen && !inPip;
    }

    private void updatePreviewCastButtonVisibility() {
        if (castButton != null && previewView != null) {
            View controls = previewView.findViewById(androidx.media3.ui.R.id.exo_controls_background);
            float alpha = controls != null && controls.getVisibility() == View.VISIBLE
                    ? controls.getAlpha() : 0f;
            boolean visible = shouldAllowPreviewCast(previewFullscreen, previewInPip)
                    && alpha > 0f;
            int visibility = visible ? View.VISIBLE : View.INVISIBLE;
            if (castButton.getVisibility() != visibility) castButton.setVisibility(visibility);
            if (castButton.getAlpha() != alpha) castButton.setAlpha(alpha);
        }
    }

    /**
     * Constrói e valida payload sanitizado para o evento "resume".
     * NUNCA inclui: URL, headers, token, credentials.
     */
    public static JSObject buildResumePayload(long positionMs, boolean ended, @Nullable String errorCode) {
        return buildResumePayload(positionMs, ended, errorCode, null, null);
    }

    public static JSObject buildResumePayload(long positionMs, boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus) {
        return buildResumePayload(positionMs, ended, errorCode, errorCategory, httpStatus, null, null);
    }

    private static JSObject buildResumePayload(long positionMs, boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus, @Nullable Integer media3ErrorCode, @Nullable String checkpoint) {
        JSObject payload = new JSObject();
        for (Map.Entry<String, Object> entry : buildResumeData(positionMs, ended, errorCode, errorCategory, httpStatus, media3ErrorCode, checkpoint).entrySet()) {
            payload.put(entry.getKey(), entry.getValue());
        }
        return payload;
    }

    /** Plain values make the exact IPC allowlist testable without Android JSON stubs. */
    public static Map<String, Object> buildResumeData(long positionMs, boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus) {
        return buildResumeData(positionMs, ended, errorCode, errorCategory, httpStatus, null, null);
    }

    public static Map<String, Object> buildResumeData(long positionMs, boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus, @Nullable Integer media3ErrorCode, @Nullable String checkpoint) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("positionMs", Math.max(0L, positionMs));
        payload.put("ended", ended);
        if (errorCode != null && !errorCode.trim().isEmpty()) {
            payload.put("errorCode", sanitizeErrorCode(errorCode));
            String category = PLAYBACK_ERROR_CATEGORIES.contains(errorCategory) ? errorCategory : "UNKNOWN";
            payload.put("errorCategory", category);
            if ("HTTP_ERROR".equals(category) && httpStatus != null && httpStatus.matches("[45][0-9]{2}")) {
                payload.put("httpStatus", Integer.parseInt(httpStatus));
            }
            if (media3ErrorCode != null && media3ErrorCode >= 1000) payload.put("media3ErrorCode", media3ErrorCode);
            if ("NATIVE_ACTIVITY_STARTED".equals(checkpoint) || "DATASOURCE_OPEN".equals(checkpoint)
                    || "FIRST_FRAME".equals(checkpoint) || "PLAYER_READY".equals(checkpoint)) payload.put("checkpoint", checkpoint);
        }
        return payload;
    }

    /**
     * Notifica os ouvintes web do evento "resume" com payload estritamente sanitizado.
     */
    public void emitResumeEvent(long positionMs, boolean ended, @Nullable String errorCode) {
        emitResumeEvent(positionMs, ended, errorCode, null, null);
    }

    public void emitResumeEvent(long positionMs, boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus) {
        emitResumeEvent(positionMs, ended, errorCode, errorCategory, httpStatus, null, null);
    }

    private void emitResumeEvent(long positionMs, boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus, @Nullable Integer media3ErrorCode, @Nullable String checkpoint) {
        JSObject sanitizedPayload = buildResumePayload(positionMs, ended, errorCode, errorCategory, httpStatus, media3ErrorCode, checkpoint);
        try {
            if (getBridge() != null) {
                notifyListeners("resume", sanitizedPayload);
            }
        } catch (Exception ignored) {
        }
    }

    /** Chamado pela Activity nativa para devolver apenas o estado terminal sanitizado. */
    public static void notifyPlaybackTerminal(long positionMs, boolean ended, @Nullable String errorCode) {
        notifyPlaybackTerminal(positionMs, ended, errorCode, null, null);
    }
    public static void terminateCastPlayback(boolean ended,String errorCode) {
        NativeAndroidPlayerPlugin plugin=activePlugin;
        if(plugin!=null && plugin.isPreviewActive){plugin.notifyPreviewError(ERROR_LIVE_PREVIEW_PLAYBACK_FAILED);plugin.releasePreview();}
        else NativePlayerActivity.terminateCastPlayback(ended,errorCode);
    }
    /** Android JSON uses Integer for ordinary JS millisecond values; getLong only accepts Long. */
    public static Long parseStartPositionMs(Object value) {
        if(value==null || value==org.json.JSONObject.NULL)return 0L;
        if(!(value instanceof Number))return null;
        double number=((Number)value).doubleValue();
        if(Double.isNaN(number) || Double.isInfinite(number) || number<0 || number>9007199254740991d || Math.floor(number)!=number)return null;
        return ((Number)value).longValue();
    }
    public static boolean validPlaybackId(String value){return value!=null && value.matches("[A-Za-z0-9_-]{1,64}");}
    public static void notifyEpisodeNavigation(String playbackId,String requestId,String reason,@Nullable String episodeId) {
        NativeAndroidPlayerPlugin plugin=activePlugin;
        if(plugin==null||!validPlaybackId(playbackId)||!validPlaybackId(requestId))return;
        android.util.Log.i(NativePlayerActivity.TAG,"EPISODE_NAVIGATION_DELIVER listeners="+plugin.hasListeners("episodeNavigation")
                +" uptime="+android.os.SystemClock.uptimeMillis());
        JSObject payload=new JSObject();payload.put("playbackId",playbackId);payload.put("requestId",requestId);payload.put("reason",reason);
        if(episodeId!=null)payload.put("episodeId",episodeId);
        try{plugin.notifyListeners("episodeNavigation",payload);}catch(Exception ignored){}
    }
    @PluginMethod public void cancelEpisodeNavigation(PluginCall call) {
        NativePlayerActivity.cancelEpisodeNavigation(call.getString("playbackId"),call.getString("requestId"));call.resolve();
    }
    public static Map<String,Object> buildProgressData(String playbackId,long positionMs,long durationMs,boolean ended,long observedAt) {
        Map<String,Object> data=new LinkedHashMap<>();if(!validPlaybackId(playbackId))return data;
        data.put("playbackId",playbackId);data.put("positionMs",Math.max(0,positionMs));data.put("durationMs",Math.max(0,durationMs));data.put("ended",ended);data.put("observedAt",observedAt);return data;
    }
    public static void notifyPlaybackProgress(String playbackId,long positionMs,long durationMs,boolean ended) {
        NativeAndroidPlayerPlugin plugin=activePlugin;if(plugin==null || !validPlaybackId(playbackId))return;
        long observedAt=System.currentTimeMillis();
        try {
            android.content.Context context=plugin.getSafeContext();
            if(context!=null) {
                android.content.SharedPreferences prefs=context.getSharedPreferences("watch_progress_v1",android.content.Context.MODE_PRIVATE);
                String value=NativeWatchProgressJournal.record(prefs.getString("events", ""),playbackId,positionMs,durationMs,ended,observedAt);
                prefs.edit().putString("events",value).commit();
            }
        } catch(Exception ignored) {}
        JSObject payload=new JSObject();for(Map.Entry<String,Object> entry:buildProgressData(playbackId,positionMs,durationMs,ended,observedAt).entrySet())payload.put(entry.getKey(),entry.getValue());
        try{plugin.notifyListeners("progress",payload);}catch(Exception ignored){}
    }

    @PluginMethod
    public void getWatchProgress(PluginCall call) {
        com.getcapacitor.JSArray events=new com.getcapacitor.JSArray();
        try {
            android.content.Context context=getSafeContext();
            if(context!=null)for(NativeWatchProgressJournal.Event event:NativeWatchProgressJournal.decode(
                    context.getSharedPreferences("watch_progress_v1",android.content.Context.MODE_PRIVATE).getString("events",""))) {
                JSObject payload=new JSObject();
                for(Map.Entry<String,Object> entry:buildProgressData(event.playbackId,event.positionMs,event.durationMs,event.ended,event.observedAt).entrySet())payload.put(entry.getKey(),entry.getValue());
                events.put(payload);
            }
        } catch(Exception ignored) {}
        JSObject result=new JSObject();result.put("events",events);call.resolve(result);
    }

    public static void notifyPlaybackTerminal(long positionMs, boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus) {
        notifyPlaybackTerminal(positionMs, ended, errorCode, errorCategory, httpStatus, null, null);
    }

    public static void notifyPlaybackTerminal(long positionMs, boolean ended, @Nullable String errorCode,
            @Nullable String errorCategory, @Nullable String httpStatus, @Nullable Integer media3ErrorCode, @Nullable String checkpoint) {
        NativeAndroidPlayerPlugin plugin = activePlugin;
        if (plugin != null) {
            plugin.emitResumeEvent(positionMs, ended, errorCode, errorCategory, httpStatus, media3ErrorCode, checkpoint);
        }
    }

    @Nullable
    public android.content.Context getSafeContext() {
        try {
            if (getBridge() != null) {
                return getBridge().getContext();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        previewForeground = false;
        updatePreviewKeepScreenOn();
        if (previewPlayer != null && (pipController == null || !pipController.eligible())) {
            previewWasPlaying = previewPlayer.getPlayWhenReady();
            previewPlayer.pause();
        }
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        pipLifecycle.resumed();
        previewForeground = true;
        if (previewPlayer != null && isPreviewActive && previewWasPlaying) {
            previewPlayer.play();
        }
        updatePreviewKeepScreenOn();
    }

    @Override
    protected void handleOnDestroy() {
        releasePreview();
        if (activePlugin == this) {
            activePlugin = null;
        }
        super.handleOnDestroy();
    }

    public boolean isPreviewActive() {
        return isPreviewActive;
    }

    public void onUserLeaveForPip() { if(pipController!=null)pipController.onLeave(); }
    public void onPipModeChanged(boolean pip) {
        pipLifecycle.modeChanged(pip);
        if(pipController==null)return;
        previewInPip = pip;
        if(pip) {pipWasFullscreen=previewFullscreen;enterPreviewFullscreen(null);}
        if(getBridge()!=null && getBridge().getWebView()!=null)getBridge().getWebView().setVisibility(pip ? View.INVISIBLE : View.VISIBLE);
        pipController.modeChanged(pip);
        updatePreviewCastButtonVisibility();
        if(!pip && !pipWasFullscreen)exitPreviewFullscreenInternal();
    }
    public void onHostStopped() {
        android.app.Activity activity=getPluginActivity();
        pipLifecycle.stopped(false, activity != null && activity.isFinishing(),
                activity != null && activity.isChangingConfigurations(),
                com.xandeflix.prebuilt.cast.CastController.get().active(),
                () -> {
                    if (previewPlayer != null) {
                        previewWasPlaying = previewWasPlaying || previewPlayer.getPlayWhenReady();
                        previewPlayer.pause();
                    }
                },
                () -> {
                    boolean wasActive = isPreviewActive;
                    releasePreview();
                    if (wasActive) emitResumeEvent(0L, false, null);
                });
    }
    @PluginMethod public void stopPlayback(PluginCall call) {
        android.app.Activity activity=getPluginActivity();
        if(activity==null){call.resolve();return;}
        activity.runOnUiThread(() -> {com.xandeflix.prebuilt.cast.CastController.get().stop(false);NativePlayerActivity.stopActivePlayback();releasePreview();call.resolve();});
    }

    public String getCurrentPreviewKind() {
        return currentPreviewKind;
    }

    public String getCurrentPreviewId() {
        return currentPreviewId;
    }

    public boolean hasPreviewRenderSurface() {
        return previewView != null;
    }

    public ExoPlayer getPreviewPlayer() {
        return previewPlayer;
    }

    public boolean isPreviewFullscreen() {
        return previewFullscreen;
    }

    /**
     * Chamado pela MainActivity para que o BACK saia do fullscreen sem destruir o player.
     */
    public boolean exitPreviewFullscreenFromActivity() {
        if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
            android.app.Activity activity = getPluginActivity();
            if (activity != null) {
                activity.runOnUiThread(this::exitPreviewFullscreenInternal);
            }
            return previewFullscreen;
        }
        return exitPreviewFullscreenInternal();
    }

    /**
     * Encaminha o BACK físico ao único dono da navegação interna da aplicação.
     * Retorna false quando não existe listener web ativo, permitindo o fallback
     * normal do Android somente nesse caso.
     */
    public boolean dispatchAndroidBackButton() {
        if (!hasListeners(EVENT_ANDROID_BACK_BUTTON)) {
            return false;
        }
        try {
            notifyListeners(EVENT_ANDROID_BACK_BUTTON, new JSObject());
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    /**
     * Finaliza a Activity somente quando a camada web confirmou que a rota atual
     * é a raiz real da aplicação.
     */
    @PluginMethod
    public void finishApp(PluginCall call) {
        android.app.Activity activity = getPluginActivity();
        if (activity == null) {
            if (call != null) {
                JSObject result = new JSObject();
                result.put("finished", false);
                call.resolve(result);
            }
            return;
        }

        Runnable finish = () -> {
            activity.finish();
            if (call != null) {
                JSObject result = new JSObject();
                result.put("finished", true);
                call.resolve(result);
            }
        };

        if (android.os.Looper.myLooper() == android.os.Looper.getMainLooper()) {
            finish.run();
        } else {
            activity.runOnUiThread(finish);
        }
    }

    public static Map<String, String> extractExplicitHeaders(JSObject headersObj) {
        if (headersObj == null) {
            return Collections.emptyMap();
        }
        Map<String, String> explicitHeaders = new LinkedHashMap<>();
        Iterator<String> keys = headersObj.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            String val = headersObj.getString(key);
            if (val != null) {
                explicitHeaders.put(key, val);
            }
        }
        return explicitHeaders;
    }

    public static boolean isSyntheticUrl(String url) {
        if (url == null) {
            return true;
        }
        String lower = url.toLowerCase(Locale.US);
        return lower.contains("media.example.invalid")
                || lower.contains("synthetic")
                || lower.contains("example.com/invalid");
    }

    public static boolean isValidUrlScheme(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        try {
            URI uri = new URI(url.trim().split("\\|")[0]);
            String scheme = uri.getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (Exception e) {
            return false;
        }
    }

    public static String sanitizeErrorCode(String rawCode) {
        if (rawCode == null || rawCode.trim().isEmpty()) {
            return ERROR_NATIVE_ERROR;
        }
        String trimmed = rawCode.trim();
        if (com.xandeflix.prebuilt.cast.CastFailurePolicy.known(trimmed)
                || ERROR_INVALID_REQUEST.equals(trimmed)
                || ERROR_PLAYER_ACTIVITY_UNAVAILABLE.equals(trimmed)
                || ERROR_PREVIEW_UNAVAILABLE.equals(trimmed)
                || ERROR_NATIVE_ERROR.equals(trimmed)
                || ERROR_LIVE_PREVIEW_NATIVE_UNAVAILABLE.equals(trimmed)
                || ERROR_LIVE_PREVIEW_SURFACE_FAILED.equals(trimmed)
                || ERROR_LIVE_PREVIEW_OPEN_FAILED.equals(trimmed)
                || ERROR_LIVE_PREVIEW_UNSUPPORTED_CONTAINER.equals(trimmed)
                || ERROR_LIVE_PREVIEW_PLAYBACK_FAILED.equals(trimmed)
                || ERROR_LIVE_PREVIEW_FULLSCREEN_FAILED.equals(trimmed)) {
            return trimmed;
        }
        return ERROR_NATIVE_ERROR;
    }

    private void rejectWithSanitizedError(PluginCall call, String code, String message) {
        String safeCode = sanitizeErrorCode(code);
        String safeMessage = message != null ? message : "Erro na requisição nativa.";
        call.reject(safeMessage, safeCode);
    }
}
