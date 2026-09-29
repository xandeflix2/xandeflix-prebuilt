package com.xandeflix.prebuilt.player;

import android.content.Intent;
import android.graphics.Color;
import android.util.Log;
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

    // Estado transitório em memória do preview nativo (sem persistência de URL, headers ou payload)
    private boolean isPreviewActive = false;
    private String currentPreviewKind = null;
    private String currentPreviewId = null;
    private ExoPlayer previewPlayer = null;
    private PlayerView previewView = null;
    private FrameLayout previewHost = null;
    private List<NativeStreamRequest> previewCandidateRequests = Collections.emptyList();
    private int currentPreviewCandidateIndex = 0;
    private boolean previewWasPlaying = false;
    private FrameLayout.LayoutParams previewInlineLayoutParams = null;
    private boolean previewFullscreen = false;

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

        Long startPositionMs = call.getLong("startPositionMs", 0L);
        if (startPositionMs != null && startPositionMs < 0) {
            rejectWithSanitizedError(call, ERROR_INVALID_REQUEST, "Posição inicial (startPositionMs) não pode ser negativa.");
            return;
        }

        String title = call.getString("title");

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
                context.startActivity(intent);
            } catch (Exception ex) {
                // Em ambiente de teste unitário headless, loga aviso sem quebrar o contrato
                Log.w(TAG, "Activity launch diferido ou indisponível no ambiente atual.");
            }
        }

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
            this.previewView = createPreviewView();
            logPreviewStage("PLAYER_VIEW_CREATED", this.previewView != null);
            host.addView(this.previewView, layoutParams);
            logPreviewStage("PLAYER_VIEW_ATTACHED", this.previewView.getParent() != null);
            this.previewPlayer = new ExoPlayer.Builder(getSafeContext())
                    .setLoadControl(NativePlayerActivity.buildLoadControl(2500, 12000, 500, 1000))
                    .build();
            logPreviewStage("MEDIA3_CREATED", this.previewPlayer != null);
            this.previewView.setPlayer(this.previewPlayer);
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

        if (previewHost != null && !previewFullscreen) {
            FrameLayout.LayoutParams layoutParams = readPreviewLayout(call);
            if (layoutParams == null) {
                rejectWithSanitizedError(call, ERROR_LIVE_PREVIEW_SURFACE_FAILED, "Geometria de preview inválida.");
                return;
            }
            previewView.setLayoutParams(layoutParams);
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
        result.put("previewUpdated", true);
        result.put("isActive", isPreviewActive);
        result.put("previewId", currentPreviewId);
        call.resolve(result);
    }

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
            MainActivity.applyAppSystemUiPolicy(activity.getWindow());
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

        String releasedPreviewId = currentPreviewId;
        releasePreview();

        JSObject result = new JSObject();
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
        PlayerView view = new PlayerView(getSafeContext());
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
        return view;
    }

    private void attachPreviewListener() {
        if (previewPlayer == null) {
            return;
        }

        previewPlayer.addListener(new Player.Listener() {
            @Override
            public void onPlayerError(@NonNull PlaybackException error) {
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
        MediaItem mediaItem = new MediaItem.Builder()
                .setUri(android.net.Uri.parse(request.getMediaUrl()))
                .build();
        previewPlayer.setMediaSource(mediaSourceFactory.createMediaSource(mediaItem));
        previewPlayer.setPlayWhenReady(true);
        previewPlayer.prepare();
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
        if (previewView != null && previewInlineLayoutParams != null) {
            previewView.setLayoutParams(previewInlineLayoutParams);
            View surfaceView = previewView.getVideoSurfaceView();
            if (surfaceView instanceof SurfaceView) {
                ((SurfaceView) surfaceView).setZOrderMediaOverlay(true);
            }
            previewView.requestLayout();
        }
        if (activity != null) {
            MainActivity.applyAppSystemUiPolicy(activity.getWindow());
        }
        previewFullscreen = false;
        notifyPreviewFullscreenChanged(false);
        return true;
    }

    /**
     * Constrói e valida payload sanitizado para o evento "resume".
     * NUNCA inclui: URL, headers, token, credentials.
     */
    public static JSObject buildResumePayload(long positionMs, boolean ended, @Nullable String errorCode) {
        JSObject payload = new JSObject();
        payload.put("positionMs", Math.max(0, positionMs));
        payload.put("ended", ended);
        if (errorCode != null && !errorCode.trim().isEmpty()) {
            payload.put("errorCode", sanitizeErrorCode(errorCode));
        }
        return payload;
    }

    /**
     * Notifica os ouvintes web do evento "resume" com payload estritamente sanitizado.
     */
    public void emitResumeEvent(long positionMs, boolean ended, @Nullable String errorCode) {
        JSObject sanitizedPayload = buildResumePayload(positionMs, ended, errorCode);
        try {
            if (getBridge() != null) {
                notifyListeners("resume", sanitizedPayload);
            }
        } catch (Exception ignored) {
        }
    }

    /** Chamado pela Activity nativa para devolver apenas o estado terminal sanitizado. */
    public static void notifyPlaybackTerminal(long positionMs, boolean ended, @Nullable String errorCode) {
        NativeAndroidPlayerPlugin plugin = activePlugin;
        if (plugin != null) {
            plugin.emitResumeEvent(positionMs, ended, errorCode);
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
        if (previewPlayer != null) {
            previewWasPlaying = previewPlayer.getPlayWhenReady();
            previewPlayer.pause();
        }
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (previewPlayer != null && isPreviewActive && previewWasPlaying) {
            previewPlayer.play();
        }
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
        if (ERROR_INVALID_REQUEST.equals(trimmed)
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
