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
import type { LiveCatalog, LiveChannel } from '../../catalog/live/live-tv.types.ts';
import { LiveCatalogService, resolveCanonicalLiveTotal, type LiveChannelPage } from '../../catalog/live/live-catalog.service.ts';
import {
  addNativePreviewErrorListener,
  addNativePreviewFullscreenListener,
  addNativePreviewTapListener,
  enterNativeAndroidPreviewFullscreen,
  exitNativeAndroidPreviewFullscreen,
  startNativeAndroidPreview,
  stopNativeAndroidPreview,
  updateNativeAndroidPreview,
} from '../../playback/native-android-player.bridge.ts';
import { getAuthorizedPlaybackSessionGuard } from '../../control-plane/client/playback-session.service.ts';
import { bootTelemetry } from '../../diagnostics/boot-telemetry.ts';

interface LiveTvPageProps {
  onBack: () => void;
  onOpenSourceSetup?: () => void;
}

const LIVE_GROUP_PAGE_SIZE = 48;
const EMPTY_LIVE_PAGE: LiveChannelPage = { channels: [], offset: 0, totalAvailable: 0, nextOffset: null };

export const LiveTvPage: React.FC<LiveTvPageProps> = ({ onBack, onOpenSourceSetup }) => {
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
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 600);
  const [mobileTab, setMobileTab] = useState<'groups' | 'channels'>('channels');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setIsLoading(true);

    LiveCatalogService.loadLiveCatalog()
      .then((cat) => {
        if (!mounted) return;
        setLiveCatalog(cat);

        if (cat && Array.isArray(cat.groups) && cat.groups.length > 0) {
          const firstGroupId = cat.groups[0].id;
          setSelectedGroupId(firstGroupId);

          // Resolve canais do 1º grupo para auto-selecionar o 1º canal
          const groupChs =
            cat.channelsByGroup?.[firstGroupId] ||
            cat.channels?.filter((c) => c.groupId === firstGroupId) ||
            [];
          if (groupChs.length > 0) {
            setSelectedChannel((current) => current ?? groupChs[0]);
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Grupo efetivo e canais do grupo
  const effectiveGroupId =
    selectedGroupId ||
    (liveCatalog && liveCatalog.groups && liveCatalog.groups.length > 0
      ? liveCatalog.groups[0].id
      : '');

  // Hidrata uma página do grupo selecionado; nunca o catálogo Live completo.
  useEffect(() => {
    if (!liveCatalog || !effectiveGroupId) return;
    let cancelled = false;
    setIsGroupPageLoading(true);
    void LiveCatalogService.loadChannelPageForGroup(effectiveGroupId, 0, LIVE_GROUP_PAGE_SIZE)
      .then((page) => {
        if (cancelled) return;
        setGroupPage(page);
        if (effectiveGroupId === liveCatalog.groups[0]?.id) {
          setSelectedChannel((current) => current ?? page.channels[0] ?? null);
        }
      })
      .catch(() => { if (!cancelled) setGroupPage(EMPTY_LIVE_PAGE); })
      .finally(() => { if (!cancelled) setIsGroupPageLoading(false); });
    return () => { cancelled = true; };
  }, [effectiveGroupId, liveCatalog?.snapshotId]);

  const currentGroupChannels = useMemo(() => {
    return groupPage.channels;
  }, [groupPage]);

  const currentGroupTotal = canonicalGroupCounts?.[effectiveGroupId]
    ?? groupPage.totalAvailable
    ?? 0;

  const loadNextGroupPage = useCallback(() => {
    if (!effectiveGroupId || groupPage.nextOffset === null || isGroupPageLoading) return;
    setIsGroupPageLoading(true);
    void LiveCatalogService.loadChannelPageForGroup(effectiveGroupId, groupPage.nextOffset, LIVE_GROUP_PAGE_SIZE)
      .then((page) => {
        setGroupPage(page);
      })
      .finally(() => setIsGroupPageLoading(false));
  }, [effectiveGroupId, groupPage.nextOffset, isGroupPageLoading]);

  // Canais filtrados pelo campo de busca dentro do grupo
  const filteredChannels = useMemo(() => {
    if (!channelFilter.trim()) return currentGroupChannels;
    const q = channelFilter.toLowerCase().trim();
    return currentGroupChannels.filter((c) => c.name.toLowerCase().includes(q));
  }, [currentGroupChannels, channelFilter]);

  // O canal em reprodução independe da categoria, página ou filtro em navegação.
  const hasPreviewSurface = selectedChannel !== null;

  // Troca somente a lista de canais; preserva player, sessão e erro atuais.
  const handleGroupSelect = useCallback(
    (groupId: string) => {
      setChannelFilter('');
      if (groupId !== effectiveGroupId) {
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

  // O primeiro canal e toda troca de canal iniciam o preview nativo inline.
  useEffect(() => {
    if (!selectedChannel) return;

    let cancelled = false;
    let sessionGuard: ReturnType<typeof getAuthorizedPlaybackSessionGuard> | null = null;
    let sessionAcquired = false;
    let unsubscribeTermination: (() => void) | undefined;
    const startPreview = async () => {
      bootTelemetry.mark('LIVE_CHANNEL_SELECTED');
      bootTelemetry.mark('LIVE_STREAMREF_REQUESTED');
      const streamRef = selectedChannel.streamRef;
      const directStreamUrl = streamRef?.directStreamUrl;
      const extension = streamRef?.containerExtension?.replace(/^\.+/, '').toLowerCase();

      if (!streamRef || !directStreamUrl || typeof directStreamUrl !== 'string' || !directStreamUrl.trim()) {
        bootTelemetry.mark('NATIVE_PREVIEW_ERROR_STAGE');
        setStreamError('LIVE_PREVIEW_OPEN_FAILED');
        return;
      }

      if (extension !== 'ts' && extension !== 'm3u8') {
        bootTelemetry.mark('NATIVE_PREVIEW_ERROR_STAGE');
        setStreamError('LIVE_PREVIEW_UNSUPPORTED_CONTAINER');
        return;
      }

      const bounds = getPreviewBounds();
      if (!bounds) {
        bootTelemetry.mark('NATIVE_PREVIEW_ERROR_STAGE');
        setStreamError('LIVE_PREVIEW_SURFACE_FAILED');
        return;
      }

      try {
        bootTelemetry.mark('LIVE_STREAMREF_RESOLVED');
        sessionGuard = getAuthorizedPlaybackSessionGuard();
        bootTelemetry.mark('C9_ACQUIRE_REQUESTED');
        const sessionResult = await sessionGuard.acquireSession({
          contentKind: 'live',
          channelId: selectedChannel.id,
        });

        if (!sessionResult.allowed) {
          if (!cancelled) {
            setStreamError(sessionResult.code === 'SESSION_LIMIT_REACHED'
              ? 'SESSION_LIMIT_REACHED'
              : 'LIVE_PREVIEW_OPEN_FAILED');
          }
          return;
        }
        sessionAcquired = true;
        bootTelemetry.mark('C9_ACQUIRED');

        bootTelemetry.mark('NATIVE_PREVIEW_START_REQUESTED');
        const result = await startNativeAndroidPreview({
          uri: directStreamUrl,
          kind: 'live',
          ...bounds,
        });

        if (cancelled) {
          if (result.previewId) {
            void stopNativeAndroidPreview({ previewId: result.previewId });
          }
          sessionAcquired = false;
          await sessionGuard.releaseSession('USER_EXIT');
          return;
        }

        if (!result.success || !result.previewId) {
          sessionAcquired = false;
          await sessionGuard.releaseSession('PLAYER_START_FAILED');
          setStreamError(mapPreviewErrorCode(result.errorCode));
          return;
        }

        previewIdRef.current = result.previewId;
        bootTelemetry.mark('NATIVE_PREVIEW_STARTED');
        setStreamError(null);
        unsubscribeTermination = sessionGuard.onTermination?.(() => {
          sessionAcquired = false;
          const activePreviewId = previewIdRef.current;
          previewIdRef.current = null;
          if (activePreviewId) void stopNativeAndroidPreview({ previewId: activePreviewId });
          if (!cancelled) setStreamError('LIVE_PREVIEW_OPEN_FAILED');
        });
      } catch {
        bootTelemetry.mark('NATIVE_PREVIEW_ERROR_STAGE');
        if (sessionAcquired && sessionGuard) {
          sessionAcquired = false;
          await sessionGuard.releaseSession('MEDIA_ERROR');
        }
        if (!cancelled) {
          setStreamError('LIVE_PREVIEW_OPEN_FAILED');
        }
      }
    };

    void startPreview();

    return () => {
      cancelled = true;
      unsubscribeTermination?.();
      unsubscribeTermination = undefined;
      const previewId = previewIdRef.current;
      previewIdRef.current = null;
      setIsPreviewFullscreen(false);
      void stopNativeAndroidPreview(previewId ? { previewId } : undefined);
      if (sessionAcquired && sessionGuard) {
        sessionAcquired = false;
        void sessionGuard.releaseSession('USER_EXIT');
      }
    };
  }, [getPreviewBounds, mapPreviewErrorCode, previewRetryNonce, selectedChannel]);

  // Mantém a PlayerView nativa alinhada à área DOM em resize, orientação, layout e scroll.
  useEffect(() => {
    const element = previewContainerRef.current;
    if (!element) return;

    const updateGeometry = () => {
      const previewId = previewIdRef.current;
      const bounds = getPreviewBounds();
      if (!previewId || !bounds) return;
      void updateNativeAndroidPreview({ previewId, ...bounds });
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateGeometry) : null;
    resizeObserver?.observe(element);
    window.addEventListener('resize', updateGeometry);
    window.addEventListener('orientationchange', updateGeometry);
    window.addEventListener('scroll', updateGeometry, true);
    updateGeometry();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateGeometry);
      window.removeEventListener('orientationchange', updateGeometry);
      window.removeEventListener('scroll', updateGeometry, true);
    };
  }, [getPreviewBounds, hasPreviewSurface]);

  // Handler de seleção de canal
  const handleChannelSelect = useCallback((channel: LiveChannel) => {
    if (selectedChannel?.id === channel.id) {
      if (previewIdRef.current) void handleNativeLivePlayback(channel);
      return;
    }
    setSelectedChannel(channel);
    setStreamError(null);
  }, [handleNativeLivePlayback, selectedChannel]);

  const handleBackNavigation = useCallback(() => {
    if (isMobile) {
      if (mobileTab === 'channels') {
        setMobileTab('groups');
        return;
      }
    }
    onBack();
  }, [isMobile, mobileTab, onBack]);

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

  if (isLoading) {
    return (
      <div className="bootstrap-state-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#f8fafc' }}>Carregando Canais ao Vivo...</h2>
      </div>
    );
  }

  if (!liveCatalog || !Array.isArray(liveCatalog.channels) || liveCatalog.channels.length === 0) {
    return (
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
    );
  }

  const currentGroupName =
    liveCatalog.groups?.find((g) => g.id === effectiveGroupId)?.name || 'Canais';

  return (
    <div
      className={`live-tv-page${isMobile ? ' live-tv-page--mobile' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#070b14',
        color: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      {/* 1. BARRA SUPERIOR (HEADER) */}
      <div
        className="live-page-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0f172a',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="focusable-item live-page-back"
            onClick={handleBackNavigation}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '0.45rem 0.9rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            ← Voltar
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📺</span> Canais ao Vivo
          </h1>
          <span
            style={{
              backgroundColor: '#166534',
              color: '#86efac',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
            }}
          >
            {resolveCanonicalLiveTotal(liveCatalog, canonicalGroupCounts)} CANAIS
          </span>
        </div>

      </div>

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
        {(!isMobile || mobileTab === 'groups') && (
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
          <div className="live-channel-list" style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
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
                    type="button"
                    className={`focusable-item ${isChannelSelected ? 'active-channel' : ''}`}
                    onClick={() => handleChannelSelect(channel)}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' && index === filteredChannels.length - 1 && groupPage.nextOffset !== null) {
                        event.preventDefault();
                        loadNextGroupPage();
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
            {groupPage.nextOffset !== null && !channelFilter.trim() && (
              <button
                type="button"
                className="focusable-item"
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
                      <strong>Preview nativo Android</strong>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        A transmissão é renderizada diretamente no Media3/ExoPlayer.
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
                        Tentar Preview
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO INFERIOR: GUIA DE PROGRAMAÇÃO (EPG) */}
              <div className="live-epg-section" style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
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
                    Guia de programação indisponível no momento.
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
                    A fonte IPTV atual não fornece grade de programação XMLTV para este canal. Os dados de transmissão são atualizados dinamicamente pelo sinal ao vivo.
                  </div>
                </div>
              </div>
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
  );
};
