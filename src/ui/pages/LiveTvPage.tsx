/**
 * Xandeflix Prebuilt — Live TV Three-Pane Layout (Gate R7C / Cycle R6B)
 *
 * Interface avançada de três painéis (Three-Pane Layout) para Live TV:
 * 1. Coluna Esquerda: Lista de Grupos / Categorias com contagem de canais
 * 2. Coluna Central: Lista de Canais do grupo selecionado com badges e logos
 * 3. Painel Direito: Preview Player com reprodução direta e seção inferior de EPG
 *
 * Princípios:
 * - PRESERVE_R6A_FIX: Derivação defensiva em memória de channelsByGroup; zero TypeError; zero tela preta.
 * - DETERMINISTIC_SELECTION: Seleção inicial do 1º canal; navegar grupos não troca o canal ativo.
 * - DIRECT_PLAYBACK: O player conecta diretamente da URL efêmera resolvida localmente sem proxies.
 * - SAFE_FALLBACK_EPG: Fallback visual seguro ("Guia de programação indisponível no momento.") sem dados fabricados.
 * - SAFE_STREAM_ERROR: Erro de reprodução exibido localmente no preview sem desmontar a página.
 * - DPAD_NAVIGATION_READY: Suporte a teclado/D-pad e retorno via Escape/Back.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { LiveCatalog, LiveChannel } from '../../catalog/live/live-tv.types.ts';
import { LiveCatalogService, resolveCanonicalLiveTotal, type LiveChannelPage } from '../../catalog/live/live-catalog.service.ts';
import {
  addNativePreviewErrorListener,
  addNativePreviewFullscreenListener,
  addNativePreviewTapListener,
  addNativePreviewPlayingListener,
  enterNativeAndroidPreviewFullscreen,
  exitNativeAndroidPreviewFullscreen,
  startNativeAndroidPreview,
  stopNativeAndroidPreview,
  updateNativeAndroidPreview,
} from '../../playback/native-android-player.bridge.ts';
import { getAuthorizedPlaybackSessionGuard } from '../../control-plane/client/playback-session.service.ts';
import { bootTelemetry } from '../../diagnostics/boot-telemetry.ts';
import { armCastAuthorization,stopGoogleCast } from '../../playback/google-cast.ts';
import { CastButton } from '../components/CastButton.tsx';
import { LiveEpgPanel } from '../components/LiveEpgPanel.tsx';
import { useLivePresentation } from '../hooks/useLivePresentation.ts';
import { chooseInitialLiveChannel, lastLiveChannel } from '../../playback/last-live-channel.ts';
import { liveChannelFingerprint } from '../../playback/last-live-channel.ts';
import { liveFavorites, liveFavoriteScope } from '../../playback/live-favorites.ts';
import { adjacentLiveChannel, favoriteLivePage, type FavoriteCursor } from '../../playback/live-player-navigation.ts';
import { addNativeLiveActionListener, setNativeLiveControls, openNativeLivePanel, type NativeLiveActionEvent, type NativeLiveContext } from '../../playback/native-android-player.bridge.ts';
import { liveEpgService, type LiveEpgResult } from '../../catalog/live/live-epg.service.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import './LiveTvPage.css';

interface LiveTvPageProps {
  onBack: () => void;
  onHome?: () => void;
  onOpenSourceSetup?: () => void;
}

const LIVE_GROUP_PAGE_SIZE = 48;
const EMPTY_LIVE_PAGE: LiveChannelPage = { channels: [], offset: 0, totalAvailable: 0, nextOffset: null };

export const LiveTvPage: React.FC<LiveTvPageProps> = ({ onBack, onHome, onOpenSourceSetup }) => {
  const [liveCatalog, setLiveCatalog] = useState<LiveCatalog | null>(null);
  const [canonicalGroupCounts, setCanonicalGroupCounts] = useState<Record<string, number> | null>(null);
  const [groupPage, setGroupPage] = useState<LiveChannelPage>(EMPTY_LIVE_PAGE);
  const [isGroupPageLoading, setIsGroupPageLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [previewRetryNonce, setPreviewRetryNonce] = useState(0);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const { tabletPortrait, stackedLive: isMobile, squareLive } = useLivePresentation();
  const [mobileTab, setMobileTab] = useState<'groups' | 'channels'>('channels');
  const [isEpgOpen, setIsEpgOpen] = useState(false);
  const [mobileHeaderTarget, setMobileHeaderTarget] = useState<HTMLElement | null>(null);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(() => new Set());
  const [favoriteScope, setFavoriteScope] = useState('');
  const [livePanel, setLivePanel] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const [liveBusy, setLiveBusy] = useState(false);
  const [controlsReady, setControlsReady] = useState(0);
  const [groupsOffset, setGroupsOffset] = useState(0);
  const [favoritePage, setFavoritePage] = useState<{ channels: LiveChannel[]; next: FavoriteCursor | null }>({ channels: [], next: null });
  const favoriteCursors = useRef<FavoriteCursor[]>([{ group: 0, offset: 0 }]);
  const [favoriteIndex, setFavoriteIndex] = useState(0);
  const [playerEpg, setPlayerEpg] = useState<LiveEpgResult | null>(null);
  const liveOperation = useRef<AbortController | null>(null);
  const previewLifecycle = useRef<Promise<void>>(Promise.resolve());
  const previewChannelId = useRef('');
  const resumeFullscreen = useRef(false);
  const switchingChannel = useRef(false);
  const previewMounted = useRef(false);
  const desiredPreviewChannel = useRef(selectedChannel);
  desiredPreviewChannel.current = selectedChannel;
  useEffect(() => {
    previewMounted.current = true;
    return () => { previewMounted.current = false; };
  }, []);

  useEffect(() => {
    let disposed = false;
    setFavoriteScope(''); setFavoriteKeys(new Set());
    void getClientBootstrapService().getStorage().readActiveManifest().then(manifest => {
      if (disposed || !liveCatalog || manifest?.snapshotId !== liveCatalog.snapshotId) return;
      const sourceId = (manifest as { metadata?: { sourceId?: string } })?.metadata?.sourceId;
      if (!sourceId) return;
      const scope = liveFavoriteScope(sourceId), keys = liveFavorites.keys(scope);
      setFavoriteScope(scope); setFavoriteKeys(keys);
    }).catch(() => { if (!disposed) setLiveMessage('Não foi possível carregar os favoritos.'); });
    return () => { disposed = true; };
  }, [liveCatalog?.snapshotId]);

  useEffect(() => {
    setMobileHeaderTarget(isMobile && !tabletPortrait ? document.getElementById('live-header-actions') : null);
  }, [isMobile, tabletPortrait]);

  // A recuperação de totais usa somente segmentos locais e não hidrata canais.
  useEffect(() => {
    let cancelled = false;
    void LiveCatalogService.loadCanonicalGroupCounts().then((counts) => {
      if (!cancelled) setCanonicalGroupCounts(counts);
    });
    return () => { cancelled = true; };
  }, []);

  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const previewIdRef = useRef<string | null>(null);
  const fullscreenRequestIdRef = useRef<string | null>(null);

  const getPreviewBounds = useCallback(() => {
    const element = previewContainerRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const mapPreviewErrorCode = useCallback((errorCode?: string) => {
    switch (errorCode) {
      case 'PREVIEW_UNAVAILABLE':
      case 'LIVE_PREVIEW_NATIVE_UNAVAILABLE':
        return 'LIVE_PREVIEW_NATIVE_UNAVAILABLE';
      case 'LIVE_PREVIEW_SURFACE_FAILED':
        return 'LIVE_PREVIEW_SURFACE_FAILED';
      case 'LIVE_PREVIEW_UNSUPPORTED_CONTAINER':
        return 'LIVE_PREVIEW_UNSUPPORTED_CONTAINER';
      case 'LIVE_PREVIEW_PLAYBACK_FAILED':
        return 'LIVE_PREVIEW_PLAYBACK_FAILED';
      default:
        return 'LIVE_PREVIEW_OPEN_FAILED';
    }
  }, []);

  // Carrega catálogo local ao inicializar e realiza seleção determinística
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    LiveCatalogService.loadLiveCatalog()
      .then(async (cat) => {
        if (!mounted) return;
        setLiveCatalog(cat);

        if (cat && Array.isArray(cat.groups) && cat.groups.length > 0) {
          const channel = await chooseInitialLiveChannel(cat, {
            loadPage: (groupId, offset, pageSize) => LiveCatalogService.loadChannelPageForGroup(groupId, offset, pageSize),
            activeSnapshot: async () => (await LiveCatalogService.loadLiveCatalog())?.snapshotId,
            signal: controller.signal,
          });
          if (!mounted) return;
          setSelectedGroupId(channel?.groupId || cat.groups[0].id);
          setSelectedChannel(channel || null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Grupo efetivo e canais do grupo
  const effectiveGroupId =
    selectedGroupId ||
    (liveCatalog && liveCatalog.groups && liveCatalog.groups.length > 0
      ? liveCatalog.groups[0].id
      : '');

  const groupRequest = useRef<AbortController | null>(null);
  const browseGroupRef = useRef(effectiveGroupId); browseGroupRef.current = effectiveGroupId;
  const channelListRef = useRef<HTMLDivElement | null>(null);
  const pendingPageFocus = useRef(false);
  const requestGroupPage = useCallback(async (groupId: string, offset: number, focusFirst = false) => {
    if (!liveCatalog) return;
    groupRequest.current?.abort();
    const controller = new AbortController(); groupRequest.current = controller;
    setIsGroupPageLoading(true);
    try {
      const page = await LiveCatalogService.loadChannelPageForGroup(groupId, offset, LIVE_GROUP_PAGE_SIZE);
      const active = await LiveCatalogService.loadLiveCatalog();
      if (controller.signal.aborted || browseGroupRef.current !== groupId || active?.snapshotId !== liveCatalog.snapshotId) return;
      pendingPageFocus.current = focusFirst;
      setGroupPage(page);
    } catch {
      if (!controller.signal.aborted) setLiveMessage('Não foi possível carregar os canais. Tente novamente.');
    } finally {
      if (groupRequest.current === controller) { groupRequest.current = null; setIsGroupPageLoading(false); }
    }
  }, [liveCatalog?.snapshotId]);
  useEffect(() => {
    const list = channelListRef.current;
    if (list) { list.scrollTop = 0; if (pendingPageFocus.current) list.querySelector<HTMLElement>('[data-live-channel]')?.focus({ preventScroll: true }); }
    pendingPageFocus.current = false;
  }, [groupPage]);
  // Hidrata uma página do grupo selecionado; nunca o catálogo Live completo.
  useEffect(() => {
    if (!liveCatalog || !effectiveGroupId) return;
    void requestGroupPage(effectiveGroupId, 0);
    return () => { groupRequest.current?.abort(); };
  }, [effectiveGroupId, requestGroupPage]);

  const currentGroupChannels = useMemo(() => {
    return groupPage.channels;
  }, [groupPage]);

  const currentGroupTotal = canonicalGroupCounts?.[effectiveGroupId]
    ?? groupPage.totalAvailable
    ?? 0;

  const loadNextGroupPage = useCallback(() => {
    if (!effectiveGroupId || groupPage.nextOffset === null || isGroupPageLoading) return;
    void requestGroupPage(effectiveGroupId, groupPage.nextOffset, true);
  }, [effectiveGroupId, groupPage.nextOffset, isGroupPageLoading, requestGroupPage]);
  const loadPreviousGroupPage = useCallback(() => {
    if (!effectiveGroupId || groupPage.offset === 0 || isGroupPageLoading) return;
    void requestGroupPage(effectiveGroupId, Math.max(0, groupPage.offset - LIVE_GROUP_PAGE_SIZE), true);
  }, [effectiveGroupId, groupPage.offset, isGroupPageLoading, requestGroupPage]);

  // Canais filtrados pelo campo de busca dentro do grupo
  const filteredChannels = useMemo(() => {
    if (!channelFilter.trim()) return currentGroupChannels;
    const q = channelFilter.toLowerCase().trim();
    return currentGroupChannels.filter((c) => c.name.toLowerCase().includes(q));
  }, [currentGroupChannels, channelFilter]);

  const liveContext = useMemo<NativeLiveContext>(() => {
    const text = (value: string | undefined, max: number) => value && !/https?:\/\//i.test(value) ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max) : '';
    const channels = livePanel === 'favorites' ? favoritePage.channels : currentGroupChannels;
    const epgMessage = !playerEpg ? 'Carregando programação…' : playerEpg.status === 'error' ? 'Não foi possível carregar a programação. Feche e abra o guia para tentar novamente.' : playerEpg.status === 'unavailable' || !playerEpg.programs.length ? 'Programação indisponível. A fonte não forneceu uma grade compatível.' : '';
    return {
      channelId: selectedChannel?.id || '', name: text(selectedChannel?.name, 180),
      groupName: text(selectedChannel?.groupName || liveCatalog?.groups.find(g => g.id === selectedChannel?.groupId)?.name, 120),
      favorite: !!selectedChannel && !!liveCatalog && favoriteKeys.has(liveChannelFingerprint(selectedChannel, liveCatalog)),
      browseName: livePanel === 'favorites' ? 'Favoritos' : text(liveCatalog?.groups.find(g => g.id === effectiveGroupId)?.name, 180),
      channels: channels.slice(0, 48).map(c => ({ id: c.id, name: text(c.name, 180), favorite: !!liveCatalog && favoriteKeys.has(liveChannelFingerprint(c, liveCatalog)) })),
      groups: (liveCatalog?.groups || []).slice(groupsOffset, groupsOffset + 48).map(g => ({ id: g.id, name: text(g.name, 180) })),
      nextPage: livePanel === 'favorites' ? favoritePage.next !== null : groupPage.nextOffset !== null,
      previousPage: livePanel === 'favorites' ? favoriteIndex > 0 : groupPage.offset > 0,
      nextGroups: groupsOffset + 48 < (liveCatalog?.groups.length || 0), previousGroups: groupsOffset > 0,
      busy: liveBusy || (livePanel === 'channels' && isGroupPageLoading), message: text(liveMessage, 240),
      epg: { message: epgMessage, programs: playerEpg?.status === 'ready' ? playerEpg.programs.filter(p => p.end > Date.now()).slice(0, 12).map(p => ({ title: text(p.title, 180), description: text(p.description, 700), start: p.start, end: p.end })) : [] },
    };
  }, [selectedChannel, liveCatalog, livePanel, currentGroupChannels, favoritePage, favoriteKeys, effectiveGroupId, groupsOffset, groupPage, favoriteIndex, liveBusy, isGroupPageLoading, liveMessage, playerEpg]);
  const liveContextRef = useRef(liveContext); liveContextRef.current = liveContext;
  useEffect(() => {
    const previewId = previewIdRef.current;
    if (previewId && previewChannelId.current === selectedChannel?.id) void setNativeLiveControls(previewId, liveContext).catch(() => {});
  }, [liveContext, controlsReady, selectedChannel?.id]);

  // O canal em reprodução independe da categoria, página ou filtro em navegação.
  const hasPreviewSurface = selectedChannel !== null;

  // Troca somente a lista de canais; preserva player, sessão e erro atuais.
  const handleGroupSelect = useCallback(
    (groupId: string) => {
      setChannelFilter('');
      if (groupId !== effectiveGroupId) {
        groupRequest.current?.abort();
        browseGroupRef.current = groupId;
        setSelectedGroupId(groupId);
        setGroupPage(EMPTY_LIVE_PAGE);
      }
      if (isMobile) {
        setMobileTab('channels');
      }
    },
    [effectiveGroupId, isMobile]
  );

  // Expande o PlayerView/ExoPlayer inline existente; não abre uma segunda Activity/player.
  const handleNativeLivePlayback = useCallback(async (channel: LiveChannel) => {
    if (!channel?.id) {
      setStreamError('LIVE_PREVIEW_NATIVE_UNAVAILABLE');
      return;
    }
    const previewId = previewIdRef.current;
    if (!previewId) {
      setStreamError('LIVE_PREVIEW_NATIVE_UNAVAILABLE');
      return;
    }
    if (fullscreenRequestIdRef.current === previewId) return;
    fullscreenRequestIdRef.current = previewId;

    try {
      const result = await enterNativeAndroidPreviewFullscreen({ previewId });
      if (previewIdRef.current !== previewId) return;

      if (!result.success) {
        setStreamError('LIVE_PREVIEW_FULLSCREEN_FAILED');
        return;
      }

      setIsPreviewFullscreen(true);
      resumeFullscreen.current = true;
      setStreamError(null);
    } catch {
      if (previewIdRef.current === previewId) setStreamError('LIVE_PREVIEW_FULLSCREEN_FAILED');
    } finally {
      if (fullscreenRequestIdRef.current === previewId) fullscreenRequestIdRef.current = null;
    }
  }, []);

  // O toque da camada Android usa o mesmo fullscreen do preview autorizado.
  useEffect(() => {
    let disposed = false;
    let listenerHandle: { remove: () => Promise<void> } | null = null;
    void addNativePreviewTapListener((event) => {
      if (disposed || !selectedChannel || !event.previewId
        || event.previewId !== previewIdRef.current) return;
      void handleNativeLivePlayback(selectedChannel);
    }).then((handle) => {
      if (disposed) void handle.remove();
      else listenerHandle = handle;
    }).catch(() => {
      // Confirmação pela lista permanece disponível se o gesto não existir.
    });
    return () => {
      disposed = true;
      if (listenerHandle) void listenerHandle.remove();
    };
  }, [handleNativeLivePlayback, selectedChannel]);

  // Escuta somente códigos sanitizados emitidos pelo ExoPlayer inline.
  useEffect(() => {
    let disposed = false;
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    void addNativePreviewErrorListener((event) => {
      if (disposed) return;
      if (event.previewId && previewIdRef.current && event.previewId !== previewIdRef.current) return;
      setStreamError(mapPreviewErrorCode(event.errorCode));
      const failedPreviewId = previewIdRef.current;
      previewIdRef.current = null;
      if (failedPreviewId) void stopNativeAndroidPreview({ previewId: failedPreviewId });
      void getAuthorizedPlaybackSessionGuard().releaseSession('MEDIA_ERROR');
    })
      .then((handle) => {
        if (disposed) {
          void handle.remove();
        } else {
          listenerHandle = handle;
        }
      })
      .catch(() => {
        // O fallback visual permanece sanitizado; a ausência do listener não expõe detalhes.
      });

    return () => {
      disposed = true;
      if (listenerHandle) {
        void listenerHandle.remove();
      }
    };
  }, [mapPreviewErrorCode]);

  // BACK/saída do fullscreen atualiza apenas o estado visual; o player permanece o mesmo.
  useEffect(() => {
    let disposed = false;
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    void addNativePreviewFullscreenListener((event) => {
      if (disposed) return;
      if (event.previewId && previewIdRef.current && event.previewId !== previewIdRef.current) return;
      setIsPreviewFullscreen(event.fullscreen);
      if (!switchingChannel.current) resumeFullscreen.current = event.fullscreen;
    })
      .then((handle) => {
        if (disposed) {
          void handle.remove();
        } else {
          listenerHandle = handle;
        }
      })
      .catch(() => {
        // Sem fallback que exponha dados da source.
      });

    return () => {
      disposed = true;
      if (listenerHandle) {
        void listenerHandle.remove();
      }
    };
  }, []);

  // Troca apenas a midia; superficie, fullscreen e PiP pertencem a pagina.
  useEffect(() => {
    if (!selectedChannel) return;

    let cancelled = false;
    let sessionGuard: ReturnType<typeof getAuthorizedPlaybackSessionGuard> | null = null;
    let sessionAcquired = false;
    let unsubscribeTermination: (() => void) | undefined;
    let playingListener: Awaited<ReturnType<typeof addNativePreviewPlayingListener>> | undefined;
    let firstPlayingId: string | undefined;
    const rememberPlayingChannel = () => { if (!cancelled && liveCatalog) lastLiveChannel.remember(selectedChannel, liveCatalog); };
    const closePreview = async () => {
      const id = previewIdRef.current;
      previewIdRef.current = null; previewChannelId.current = '';
      if (id) await stopNativeAndroidPreview({ previewId: id });
      if (previewMounted.current) setIsPreviewFullscreen(false);
    };
    const startPreview = async () => {
      bootTelemetry.mark('LIVE_CHANNEL_SELECTED');
      bootTelemetry.mark('LIVE_STREAMREF_REQUESTED');
      const streamRef = selectedChannel.streamRef;
      const directStreamUrl = streamRef?.directStreamUrl;
      const extension = streamRef?.containerExtension?.replace(/^\.+/, '').toLowerCase();

      if (!streamRef || !directStreamUrl || typeof directStreamUrl !== 'string' || !directStreamUrl.trim()) {
        await closePreview();
        bootTelemetry.mark('NATIVE_PREVIEW_ERROR_STAGE');
        setStreamError('LIVE_PREVIEW_OPEN_FAILED');
        return;
      }

      if (extension !== 'ts' && extension !== 'm3u8') {
        await closePreview();
        bootTelemetry.mark('NATIVE_PREVIEW_ERROR_STAGE');
        setStreamError('LIVE_PREVIEW_UNSUPPORTED_CONTAINER');
        return;
      }

      const bounds = getPreviewBounds();
      if (!bounds) {
        await closePreview();
        bootTelemetry.mark('NATIVE_PREVIEW_ERROR_STAGE');
        setStreamError('LIVE_PREVIEW_SURFACE_FAILED');
        return;
      }

      try {
        playingListener = await addNativePreviewPlayingListener(event => {
          if (cancelled) return;
          if (event.previewId === previewIdRef.current) rememberPlayingChannel();
          else firstPlayingId = event.previewId;
        });
        if (cancelled) { void playingListener.remove(); return; }
        bootTelemetry.mark('LIVE_STREAMREF_RESOLVED');
        sessionGuard = getAuthorizedPlaybackSessionGuard();
        bootTelemetry.mark('C9_ACQUIRE_REQUESTED');
        const sessionResult = await sessionGuard.acquireSession({
          contentKind: 'live',
          channelId: selectedChannel.id,
        });

        if (!sessionResult.allowed) {
          await closePreview();
          if (!cancelled) {
            setStreamError(sessionResult.code === 'SESSION_LIMIT_REACHED'
              ? 'SESSION_LIMIT_REACHED'
              : 'LIVE_PREVIEW_OPEN_FAILED');
          }
          return;
        }
        sessionAcquired = true;
        bootTelemetry.mark('C9_ACQUIRED');
        await armCastAuthorization();
        if (cancelled) { sessionAcquired = false; await sessionGuard.releaseSession('USER_EXIT'); return; }

        bootTelemetry.mark('NATIVE_PREVIEW_START_REQUESTED');
        const retainedId = previewIdRef.current;
        const result = retainedId
          ? await updateNativeAndroidPreview({ previewId: retainedId, uri: directStreamUrl, ...bounds })
          : await startNativeAndroidPreview({ uri: directStreamUrl, kind: 'live', liveContext: liveContextRef.current, ...bounds });
        if (result.success && result.previewId) previewIdRef.current = result.previewId;

        if (cancelled) {
          // Cleanup serializado suspende antes de liberar C9, inclusive em troca rapida.
          return;
        }

        if (!result.success || !result.previewId) {
          await closePreview();
          sessionAcquired = false;
          await sessionGuard.releaseSession('PLAYER_START_FAILED');
          setStreamError(mapPreviewErrorCode(result.errorCode));
          return;
        }

        previewIdRef.current = result.previewId;
        previewChannelId.current = selectedChannel.id;
        setControlsReady(v => v + 1);
        if (!retainedId && resumeFullscreen.current) {
          const full = await enterNativeAndroidPreviewFullscreen({ previewId: result.previewId });
          if (!cancelled) setIsPreviewFullscreen(full.success);
        }
        switchingChannel.current = false;
        if (firstPlayingId === result.previewId) rememberPlayingChannel();
        bootTelemetry.mark('NATIVE_PREVIEW_STARTED');
        setStreamError(null);
        unsubscribeTermination = sessionGuard.onTermination?.(() => {
          void stopGoogleCast();
          sessionAcquired = false;
          const activePreviewId = previewIdRef.current;
          previewIdRef.current = null;
          if (activePreviewId) void stopNativeAndroidPreview({ previewId: activePreviewId });
          if (!cancelled) setStreamError('LIVE_PREVIEW_OPEN_FAILED');
        });
      } catch {
        bootTelemetry.mark('NATIVE_PREVIEW_ERROR_STAGE');
        await closePreview();
        if (sessionAcquired && sessionGuard) {
          sessionAcquired = false;
          await sessionGuard.releaseSession('MEDIA_ERROR');
        }
        if (!cancelled) {
          setStreamError('LIVE_PREVIEW_OPEN_FAILED');
        }
      } finally {
        if (!cancelled) switchingChannel.current = false;
        if (cancelled || !previewIdRef.current) void playingListener?.remove();
      }
    };

    const task = previewLifecycle.current.then(() => { if (!cancelled) return startPreview(); });
    previewLifecycle.current = task.catch(() => {});

    return () => {
      cancelled = true;
      void playingListener?.remove();
      unsubscribeTermination?.();
      unsubscribeTermination = undefined;
      previewLifecycle.current = task.catch(() => {}).then(async () => {
        await stopGoogleCast();
        const previewId = previewIdRef.current;
        if (previewId && previewMounted.current && desiredPreviewChannel.current) {
          const suspended = await updateNativeAndroidPreview({ previewId, suspendPlayback: true });
          if (!suspended.success) await closePreview();
        } else await closePreview();
        if (sessionAcquired && sessionGuard) { sessionAcquired = false; await sessionGuard.releaseSession('USER_EXIT'); }
      }).catch(() => {});
    };
  }, [getPreviewBounds, mapPreviewErrorCode, previewRetryNonce, selectedChannel, liveCatalog]);

  // Mantém a PlayerView nativa alinhada à área DOM em resize, orientação, layout e scroll.
  useEffect(() => {
    const element = previewContainerRef.current;
    if (!element) return;

    const updateGeometry = () => {
      const previewId = previewIdRef.current;
      const bounds = getPreviewBounds();
      if (!previewId || !bounds || isPreviewFullscreen) return;
      void updateNativeAndroidPreview({ previewId, ...bounds });
    };

    let frame = 0;
    const scheduleGeometry = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(updateGeometry); };
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleGeometry) : null;
    resizeObserver?.observe(element);
    window.addEventListener('resize', scheduleGeometry);
    window.addEventListener('orientationchange', scheduleGeometry);
    window.addEventListener('scroll', scheduleGeometry, true);
    window.addEventListener('pageshow', scheduleGeometry);
    document.addEventListener('visibilitychange', scheduleGeometry);
    window.visualViewport?.addEventListener('resize', scheduleGeometry);
    scheduleGeometry();
    const timers = [80, 250, 600].map(delay => setTimeout(scheduleGeometry, delay));

    return () => {
      resizeObserver?.disconnect(); cancelAnimationFrame(frame); timers.forEach(clearTimeout);
      window.removeEventListener('resize', scheduleGeometry);
      window.removeEventListener('orientationchange', scheduleGeometry);
      window.removeEventListener('scroll', scheduleGeometry, true);
      window.removeEventListener('pageshow', scheduleGeometry);
      document.removeEventListener('visibilitychange', scheduleGeometry);
      window.visualViewport?.removeEventListener('resize', scheduleGeometry);
    };
  }, [getPreviewBounds, hasPreviewSurface, isPreviewFullscreen, isMobile, isEpgOpen, squareLive]);

  // Handler de seleção de canal
  const handleChannelSelect = useCallback((channel: LiveChannel) => {
    if (switchingChannel.current) return;
    if (selectedChannel?.id === channel.id) {
      if (previewIdRef.current) void handleNativeLivePlayback(channel);
      return;
    }
    resumeFullscreen.current = isPreviewFullscreen;
    switchingChannel.current = true;
    setSelectedChannel(channel);
    setStreamError(null);
    setLiveMessage('');
  }, [handleNativeLivePlayback, selectedChannel, isPreviewFullscreen]);

  const toggleFavorite = useCallback(() => {
    if (!selectedChannel || !liveCatalog || !favoriteScope) { setLiveMessage('Favoritos ainda indisponíveis. Aguarde o catálogo carregar.'); return; }
    try {
      const next = liveFavorites.toggle(favoriteScope, selectedChannel, liveCatalog);
      setFavoriteKeys(next); setLiveMessage(next.has(liveChannelFingerprint(selectedChannel, liveCatalog)) ? 'Canal adicionado aos favoritos.' : 'Canal removido dos favoritos.');
    } catch { setLiveMessage('Não foi possível salvar os favoritos neste aparelho.'); }
  }, [selectedChannel, liveCatalog, favoriteScope]);

  const handleLiveAction = useCallback(async (event: NativeLiveActionEvent) => {
    if (!liveCatalog || !selectedChannel || event.previewId !== previewIdRef.current || event.channelId !== selectedChannel.id) return;
    const action = event.action;
    if (action === 'closePanel') { liveOperation.current?.abort(); liveOperation.current = null; setLiveBusy(false); setLivePanel(null); return; }
    if (liveOperation.current && !liveOperation.current.signal.aborted) return;
    setLiveMessage('');
    if (action === 'favorite') { toggleFavorite(); return; }
    if (action === 'guide' || action === 'categories' || action === 'channels') { setLivePanel(action); return; }
    if (action === 'groupPrevious') { setGroupsOffset(v => Math.max(0, v - 48)); return; }
    if (action === 'groupNext') { setGroupsOffset(v => v + 48 < liveCatalog.groups.length ? v + 48 : v); return; }
    if (action === 'selectGroup') {
      if (!liveCatalog.groups.some(g => g.id === event.id)) return;
      setLivePanel('channels'); handleGroupSelect(event.id!); return;
    }
    if (action === 'selectChannel') {
      const channels = livePanel === 'favorites' ? favoritePage.channels : currentGroupChannels;
      const channel = channels.find(c => c.id === event.id);
      if (channel) { setLivePanel(null); if (selectedChannel.id !== channel.id) handleChannelSelect(channel); }
      return;
    }
    const controller = new AbortController(); liveOperation.current = controller; setLiveBusy(true);
    const current = () => !controller.signal.aborted && event.previewId === previewIdRef.current && event.channelId === selectedChannel.id;
    const port = { loadPage: (id: string, offset: number, size: number) => LiveCatalogService.loadChannelPageForGroup(id, offset, size), activeSnapshot: async () => (await LiveCatalogService.loadLiveCatalog())?.snapshotId };
    try {
      if (action === 'previous' || action === 'next') {
        const channel = await adjacentLiveChannel(liveCatalog, selectedChannel, action === 'previous' ? -1 : 1, port, controller.signal);
        if (!current()) return;
        if (channel) { handleGroupSelect(channel.groupId); handleChannelSelect(channel); }
        else setLiveMessage(action === 'previous' ? 'Este é o primeiro canal da categoria.' : 'Este é o último canal da categoria.');
      } else if (action === 'favorites' || ((action === 'pageNext' || action === 'pagePrevious') && livePanel === 'favorites')) {
        const index = action === 'favorites' ? 0 : action === 'pageNext' ? favoriteIndex + 1 : Math.max(0, favoriteIndex - 1);
        const cursor = action === 'favorites' ? { group: 0, offset: 0 } : action === 'pageNext' ? favoritePage.next : favoriteCursors.current[index];
        if (!cursor) return;
        setLivePanel('favorites');
        const page = await favoriteLivePage(liveCatalog, favoriteKeys, port, controller.signal, cursor);
        if (!current()) return;
        if (action === 'favorites') favoriteCursors.current = [cursor]; else favoriteCursors.current[index] = cursor;
        setFavoriteIndex(index); setFavoritePage(page);
        if (!page.channels.length) setLiveMessage('Nenhum canal favorito disponível. Marque um canal com a estrela.');
      } else if (action === 'pageNext' || action === 'pagePrevious') {
        const offset = action === 'pageNext' ? groupPage.nextOffset : Math.max(0, groupPage.offset - 48);
        if (offset === null) return;
        await requestGroupPage(effectiveGroupId, offset);
      }
    } catch { if (current()) setLiveMessage('Não foi possível carregar os canais. Tente novamente.'); }
    finally { if (liveOperation.current === controller) { liveOperation.current = null; setLiveBusy(false); } }
  }, [liveCatalog, selectedChannel, toggleFavorite, livePanel, favoritePage, currentGroupChannels, handleGroupSelect, handleChannelSelect, favoriteIndex, favoriteKeys, groupPage, effectiveGroupId, requestGroupPage]);
  const liveActionRef = useRef(handleLiveAction); liveActionRef.current = handleLiveAction;
  useEffect(() => {
    let disposed = false;
    let handle: Awaited<ReturnType<typeof addNativeLiveActionListener>> | undefined;
    void addNativeLiveActionListener(event => { if (!disposed) void liveActionRef.current(event); }).then(value => { if (disposed) void value.remove(); else handle = value; }).catch(() => {});
    return () => { disposed = true; void handle?.remove(); liveOperation.current?.abort(); };
  }, []);
  useEffect(() => { liveOperation.current?.abort(); liveOperation.current = null; setLiveBusy(false); }, [selectedChannel?.id, liveCatalog?.snapshotId]);
  useEffect(() => {
    if (livePanel !== 'guide' || !selectedChannel) return;
    let disposed = false, controller: AbortController | undefined;
    setPlayerEpg(null);
    const refresh = async () => {
      controller?.abort(); const request = new AbortController(); controller = request;
      const result = await liveEpgService.load(selectedChannel, request.signal);
      if (!disposed && !request.signal.aborted) setPlayerEpg(result);
    };
    void refresh(); const timer = setInterval(() => { void refresh(); }, 60000);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); };
  }, [livePanel, selectedChannel]);

  const openLivePanel = (panel: 'channels' | 'categories' | 'guide' | 'favorites') => {
    const id = previewIdRef.current;
    if (id) void openNativeLivePanel(id, panel).catch(() => setLiveMessage('Os controles estarão disponíveis quando a transmissão iniciar.'));
    else setLiveMessage('Aguarde a transmissão iniciar para abrir os controles.');
  };

  const handleBackNavigation = useCallback(() => {
    if (isMobile) {
      if (isEpgOpen) {
        setIsEpgOpen(false);
        return;
      }
      if (mobileTab === 'channels') {
        setMobileTab('groups');
        return;
      }
    }
    onBack();
  }, [isMobile, isEpgOpen, mobileTab, onBack]);

  useEffect(() => {
    if (!isMobile) setIsEpgOpen(false);
    const handleNativeBack = (event: Event) => {
      if (!isMobile || !isEpgOpen || isPreviewFullscreen) return;
      event.preventDefault();
      setIsEpgOpen(false);
    };
    window.addEventListener('xandeflix:live-epg-back', handleNativeBack);
    return () => window.removeEventListener('xandeflix:live-epg-back', handleNativeBack);
  }, [isMobile, isEpgOpen, isPreviewFullscreen]);

  // Escape/Back primeiro restaura o preview inline; só depois retorna à tela anterior.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Back' || e.keyCode === 4) {
        e.preventDefault();
        if (isPreviewFullscreen) {
          void exitNativeAndroidPreviewFullscreen({ previewId: previewIdRef.current || undefined });
          return;
        }
        handleBackNavigation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBackNavigation, isPreviewFullscreen]);

  const pageHeader = (
    <div className="live-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="button" className="focusable-item live-page-back" onClick={handleBackNavigation} aria-label="Voltar para a tela anterior" title="Voltar"
          style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '0.45rem 0.9rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          <span className="live-back-label">← Voltar</span>
          <svg className="live-back-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>
        </button>
        {(isMobile || squareLive) && onHome && <button type="button" className="focusable-item live-page-home" onClick={onHome} aria-label="Ir para Início" title="Início">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3z"/></svg>
        </button>}
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span aria-hidden="true">📺</span> Canais ao Vivo</h1>
        <span className="live-channel-total" style={{ backgroundColor: '#166534', color: '#86efac', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
          {liveCatalog ? `${resolveCanonicalLiveTotal(liveCatalog, canonicalGroupCounts)} CANAIS` : isLoading ? 'Carregando…' : 'Sem canais'}
        </span>
        <CastButton iconOnly={isMobile || squareLive} />
      </div>
    </div>
  );
  const headerPortal = mobileHeaderTarget ? createPortal(pageHeader, mobileHeaderTarget) : null;

  if (isLoading) {
    return (
      <>{headerPortal}
      <div className="bootstrap-state-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#f8fafc' }}>Carregando Canais ao Vivo...</h2>
      </div>
      </>
    );
  }

  if (!liveCatalog || !Array.isArray(liveCatalog.channels) || liveCatalog.channels.length === 0) {
    return (
      <>{headerPortal}
      <div className="bootstrap-state-container" role="alert" style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="bootstrap-state-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📺</div>
          <h1 className="bootstrap-state-title">Nenhum Canal ao Vivo Disponível</h1>
          <p className="bootstrap-state-desc">
            A fonte configurada atualmente não possui canais ao vivo importados ou a importação ainda não foi executada.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button type="button" className="focusable-item btn-primary" onClick={onBack}>
              ← Voltar
            </button>
            {onOpenSourceSetup && (
              <button
                type="button"
                className="focusable-item"
                onClick={onOpenSourceSetup}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⚙️ Configurar Fonte
              </button>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }

  const currentGroupName =
    liveCatalog.groups?.find((g) => g.id === effectiveGroupId)?.name || 'Canais';

  return (
    <>{headerPortal}
    <div
      className={`live-tv-page${squareLive ? ' live-tv-page--square' : ''}${isMobile ? ' live-tv-page--mobile' : ''}${isMobile && isEpgOpen ? ' live-tv-page--epg-open' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#070b14',
        color: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      {!mobileHeaderTarget && pageHeader}

      {/* TABS DE NAVEGAÇÃO MOBILE EM SMARTPHONE */}
      {isMobile && (
        <div
          className="mobile-live-tabs"
          style={{
            display: 'flex',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#090d16',
          }}
        >
          <button
            type="button"
            className={`focusable-item ${mobileTab === 'groups' ? 'active-tab' : ''}`}
            onClick={() => setMobileTab('groups')}
            aria-pressed={mobileTab === 'groups'}
            style={{
              flex: 1,
              padding: '0.65rem 0.5rem',
              background: mobileTab === 'groups' ? '#1e293b' : 'transparent',
              color: mobileTab === 'groups' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: mobileTab === 'groups' ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: mobileTab === 'groups' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            📂 Categorias ({liveCatalog.groups ? liveCatalog.groups.length : 0})
          </button>
          <button
            type="button"
            className={`focusable-item ${mobileTab === 'channels' ? 'active-tab' : ''}`}
            onClick={() => setMobileTab('channels')}
            aria-pressed={mobileTab === 'channels'}
            style={{
              flex: 1,
              padding: '0.65rem 0.5rem',
              background: mobileTab === 'channels' ? '#1e293b' : 'transparent',
              color: mobileTab === 'channels' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: mobileTab === 'channels' ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: mobileTab === 'channels' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            📺 Canais ({currentGroupTotal})
          </button>
        </div>
      )}

      {/* 2. THREE-PANE CONTAINER (LAYOUT RESPONSIVO DESKTOP OU MOBILE) */}
      <div className="live-columns" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* PAINEL 1: COLUNA DE CATEGORIAS / GRUPOS */}
        {!squareLive && (!isMobile || mobileTab === 'groups') && (
          <div
            data-dpad-region="live-categories"
            style={{
              width: isMobile ? '100%' : '240px',
              minWidth: isMobile ? '100%' : '240px',
              borderRight: isMobile ? 'none' : '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#090d16',
            }}
          >
          <div
            style={{
              padding: '0.85rem 1rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderBottom: '1px solid #131d2e',
            }}
          >
            Categorias ({liveCatalog.groups ? liveCatalog.groups.length : 0})
          </div>

          <div className="live-category-list" style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {(liveCatalog.groups || []).map((group) => {
              const isSelected = group.id === effectiveGroupId;
              const count = canonicalGroupCounts?.[group.id];
              return (
                <button
                  key={group.id}
                  type="button"
                  className={`focusable-item ${isSelected ? 'active-group' : ''}`}
                  onClick={() => handleGroupSelect(group.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '0.25rem',
                    backgroundColor: isSelected ? '#1e293b' : 'transparent',
                    color: isSelected ? '#38bdf8' : '#cbd5e1',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.85rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {group.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: isSelected ? '#38bdf8' : '#64748b',
                      backgroundColor: isSelected ? '#0f172a' : 'transparent',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      marginLeft: '0.5rem',
                    }}
                  >
                    {count === undefined ? '…' : count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* PAINEL 2: COLUNA DE CANAIS DO GRUPO */}
        {(!isMobile || mobileTab === 'channels') && (
          <div
            className="live-channel-column"
            style={{
              width: isMobile ? '100%' : '320px',
              minWidth: isMobile ? '100%' : '320px',
              borderRight: isMobile ? 'none' : '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0c1220',
            }}
          >
          {/* Cabeçalho da coluna central com contador e filtro */}
          <div
            style={{
              padding: '0.85rem 1rem 0.5rem',
              borderBottom: '1px solid #1e293b',
              backgroundColor: '#0f172a',
            }}
          >
            {squareLive && <label className="live-square-category">
              <span>Categoria</span>
              <select className="focusable-item" value={effectiveGroupId} onChange={event => handleGroupSelect(event.target.value)}>
                {(liveCatalog.groups || []).map(group => <option key={group.id} value={group.id}>
                  {group.name}{canonicalGroupCounts?.[group.id] === undefined ? '' : ` (${canonicalGroupCounts[group.id]})`}
                </option>)}
              </select>
            </label>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentGroupName}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                }}
              >
                {isGroupPageLoading ? '…' : `${currentGroupTotal} canais`}
              </span>
            </div>

            {/* Input de filtro de canal */}
            <input
              aria-label="Filtrar canais nesta categoria"
              type="text"
              placeholder="Filtrar canal neste grupo..."
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.6rem',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Lista de Canais */}
          <div ref={channelListRef} className="live-channel-list" aria-busy={isGroupPageLoading} style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {groupPage.channels.length > 0 && <p className="live-page-range" role="status">Canais {groupPage.offset + 1}–{groupPage.offset + groupPage.channels.length} de {currentGroupTotal}</p>}
            {groupPage.offset > 0 && <button type="button" className="focusable-item live-page-button" data-live-page="previous" disabled={isGroupPageLoading} onClick={loadPreviousGroupPage}>Canais anteriores</button>}
            {filteredChannels.length === 0 ? (
              <div style={{ color: '#64748b', padding: '2rem 1rem', textAlign: 'center', fontSize: '0.85rem' }}>
                Nenhum canal encontrado.
              </div>
            ) : (
              filteredChannels.map((channel, index) => {
                const isChannelSelected = selectedChannel?.id === channel.id;
                return (
                  <button
                    key={channel.id}
                    data-live-channel={channel.id}
                    type="button"
                    className={`focusable-item ${isChannelSelected ? 'active-channel' : ''}`}
                    onClick={() => handleChannelSelect(channel)}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' && index === filteredChannels.length - 1 && groupPage.nextOffset !== null) {
                        event.preventDefault();
                        loadNextGroupPage();
                      }
                      if (event.key === 'ArrowUp' && index === 0 && groupPage.offset > 0) {
                        event.preventDefault(); loadPreviousGroupPage();
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      marginBottom: '0.3rem',
                      backgroundColor: isChannelSelected ? '#1e3a8a' : '#131d2e',
                      border: isChannelSelected ? '1px solid #60a5fa' : '1px solid #1e293b',
                      borderRadius: '6px',
                      color: isChannelSelected ? '#ffffff' : '#e2e8f0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    {channel.logoUrl ? (
                      <img
                        src={channel.logoUrl}
                        alt={channel.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          backgroundColor: '#0f172a',
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#0f172a',
                          borderRadius: '4px',
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        📺
                      </div>
                    )}

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: isChannelSelected ? 700 : 500,
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {channel.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isChannelSelected ? '#93c5fd' : '#64748b' }}>
                        {channel.num ? `Canal #${channel.num}` : (channel.streamRef?.containerExtension?.toUpperCase() || 'LIVE')}
                      </div>
                    </div>

                    {isChannelSelected && (
                      <span style={{ fontSize: '0.75rem', color: '#60a5fa', flexShrink: 0 }}>
                        ▶
                      </span>
                    )}
                  </button>
                );
              })
            )}
            {groupPage.nextOffset !== null && (
              <button
                type="button"
                className="focusable-item"
                data-live-page="next"
                disabled={isGroupPageLoading}
                onClick={loadNextGroupPage}
                style={{
                  width: '100%', padding: '0.65rem', marginTop: '0.35rem',
                  background: '#1e293b', color: '#bfdbfe', border: '1px solid #334155',
                  borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {isGroupPageLoading
                  ? 'Carregando…'
                  : `Próximos canais (${groupPage.nextOffset + 1}–${Math.min(currentGroupTotal, groupPage.nextOffset + LIVE_GROUP_PAGE_SIZE)} de ${currentGroupTotal})`}
              </button>
            )}
          </div>
        </div>
        )}

        {/* PAINEL 3: PREVIEW DO CANAL + GUIA EPG */}
          <div
            className="live-preview-panel"
            style={{
              flex: 1,
              width: isMobile ? '100%' : undefined,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#070b14',
              overflowY: 'auto',
            }}
          >
          {selectedChannel ? (
            <>
              {/* SEÇÃO SUPERIOR: PREVIEW PLAYER */}
              <div
                className="live-preview-section"
                style={{
                  padding: '1.25rem 1.5rem 0.75rem',
                  borderBottom: '1px solid #1e293b',
                  backgroundColor: '#0b101d',
                }}
              >
                {/* Identificação do preview; tela cheia por confirmação/toque. */}
                <div
                  className="live-preview-controls"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div className="live-preview-legacy-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <span
                      className="live-preview-live-badge"
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ● AO VIVO
                    </span>
                    <h2
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        margin: 0,
                        color: '#f8fafc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedChannel.name}
                    </h2>
                  </div>

                </div>

                {/* Superfície nativa inline; o PlayerView Android é sobreposto via geometria segura. */}
                <div
                  className="live-preview-surface"
                  data-preview-fullscreen={isPreviewFullscreen}
                  ref={previewContainerRef}
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    maxHeight: '440px',
                    backgroundColor: '#000000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {streamError ? (
                    <div
                      style={{
                        color: '#ef4444',
                        textAlign: 'center',
                        padding: '1.5rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
                      <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem', color: '#fca5a5' }}>
                        {streamError}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '400px', margin: '0 0 1rem' }}>
                        O player nativo Android não pôde iniciar esta transmissão.
                      </p>
                      <button
                        type="button"
                        className="focusable-item"
                        onClick={() => setPreviewRetryNonce((value) => value + 1)}
                        style={{
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          border: '1px solid #475569',
                          padding: '0.4rem 0.9rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        🔄 Tentar Preview
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        color: '#cbd5e1',
                        textAlign: 'center',
                        padding: '1.5rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ fontSize: '2.5rem' }}>▶</div>
                      <strong>Abrindo transmissão…</strong>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Aguarde alguns instantes para assistir ao canal.
                      </span>
                      <button
                        type="button"
                        className="focusable-item"
                        onClick={() => setPreviewRetryNonce((value) => value + 1)}
                        style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}
                </div>
                {squareLive && <button type="button" className="focusable-item live-square-fullscreen" onClick={() => void handleNativeLivePlayback(selectedChannel)} aria-label="Abrir canal em tela cheia">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>
                  <span>Tela cheia</span>
                </button>}
                {liveMessage && <p className="live-action-message" role="status">{liveMessage}</p>}
              </div>

              {/* SEÇÃO INFERIOR: GUIA DE PROGRAMAÇÃO (EPG) */}
              {isMobile || squareLive ? <LiveEpgPanel channel={selectedChannel} inline={squareLive} open={squareLive || isEpgOpen} onToggle={() => setIsEpgOpen(v => !v)}/> : <div className="live-epg-section" style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
                <div
                  className="live-epg-header"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: '#cbd5e1',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>📋</span> Guia de Programação (EPG)
                  </h3>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      backgroundColor: '#0f172a',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    {selectedChannel.groupName || liveCatalog.groups.find((group) => group.id === selectedChannel.groupId)?.name || ''}
                  </span>
                </div>

                {/* Informações detalhadas do canal selecionado */}
                <div
                  className="live-channel-summary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    marginBottom: '1rem',
                  }}
                >
                  {selectedChannel.logoUrl ? (
                    <img
                      src={selectedChannel.logoUrl}
                      alt={selectedChannel.name}
                      style={{
                        width: '44px',
                        height: '44px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        backgroundColor: '#090d16',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#1e293b',
                        borderRadius: '6px',
                        fontSize: '1.4rem',
                      }}
                    >
                      📺
                    </div>
                  )}

                  <div className="live-channel-details" style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                      {selectedChannel.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                      Identificador: {selectedChannel.id} • Formato: {selectedChannel.streamRef.containerExtension?.toUpperCase() || 'TS'}
                    </div>
                  </div>
                  <span className="live-channel-live-badge">● AO VIVO</span>
                </div>

                {/* Box do Guia EPG com Fallback Seguro */}
                <div
                  className="live-epg-fallback"
                  style={{
                    backgroundColor: '#0c1220',
                    border: '1px dashed #334155',
                    borderRadius: '8px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.8 }}>
                    📅
                  </div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#e2e8f0',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Consulte o guia deste canal.
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
                    Veja o programa atual e os próximos horários quando a fonte disponibilizar a programação.
                  </div>
                  <button type="button" className="focusable-item btn-secondary" style={{ marginTop: 12 }} onClick={() => openLivePanel('guide')}>Abrir guia de programação</button>
                </div>
              </div>}
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                padding: '2rem',
              }}
            >
              Selecione um canal para visualizar a transmissão e a programação.
            </div>
          )}
        </div>
      </div>

    </div>
    </>
  );
};
