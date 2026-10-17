import { isWebValidation } from './validation.ts';
import { openDevicePresentation } from '../ui/device-presentation.ts';
import { getBootSyncCoordinator } from '../bootstrap/boot-sync-coordinator.ts';
import { Capacitor } from '@capacitor/core';
import { readWebCatalogFile } from './web-catalog-files.ts';
import { defaultPlaybackService } from '../playback/playback.service.ts';
import './web-runtime.css';
export function mountWebRuntimeNotice(): void {
  if (!isWebValidation() || document.querySelector('.web-validation-badge')) return;
  document.documentElement.dataset.webValidation = 'true';
  const preserveSearchSpace = (event: KeyboardEvent) => {
    if (event.key === ' ' && !event.ctrlKey && !event.altKey && !event.metaKey
      && event.target instanceof HTMLInputElement && event.target.matches('.search-input')) event.stopImmediatePropagation();
  };
  window.addEventListener('keydown', preserveSearchSpace, true);
  let outcome = 'NAO_OBSERVADO', transport = { stage: 'NAO_OBSERVADO', error: 'NAO_OBSERVADO', status: 'NAO_OBSERVADO' };
  const safe = (value: unknown) => typeof value === 'string' && /^[A-Z][A-Z0-9_]{1,80}$/.test(value) ? value : 'NAO_INFORMADO';
  getBootSyncCoordinator().subscribe((_, result) => { if (result) outcome = safe(result.outcome); });
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    let url: URL;
    try { url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href); }
    catch { return originalFetch(input, init); }
    const local = await readWebCatalogFile(url, init?.method || (input instanceof Request ? input.method : 'GET'), init?.signal || (input instanceof Request ? input.signal : undefined));
    if (local) return local;
    const sourceRequest = url.origin !== location.origin && !/(^|\.)(supabase\.co|themoviedb\.org|tmdb\.org)$/.test(url.hostname);
    try {
      const response = await originalFetch(input, init);
      if (sourceRequest) transport = { stage: 'HTTP_RESPONSE', error: response.type === 'opaque' ? 'CORS_CONFIRMED' : response.ok ? 'NONE' : 'HTTP_ERROR', status: response.type === 'opaque' ? 'OPAQUE' : 'HTTP_' + Math.floor(response.status / 100) + 'XX' };
      return response;
    } catch (error) {
      if (sourceRequest) transport = { stage: 'REQUEST_START', error: error instanceof DOMException && error.name === 'AbortError' ? 'ABORTED' : 'NETWORK_OR_CORS', status: 'NO_RESPONSE' };
      throw error;
    }
  };
  const badge = document.createElement('button'); badge.className = 'web-validation-badge'; badge.type = 'button';
  badge.textContent = 'Conferência web'; badge.title = 'Recursos da versão web';
  badge.onclick = () => {
    const dialog = document.createElement('dialog'); dialog.className = 'web-validation-dialog';
    const title = document.createElement('h2'); title.textContent = 'Conferência pelo navegador';
    const description = document.createElement('p'); description.textContent = 'Use a ativação e a fonte vinculadas a este navegador. Catálogo, busca, favoritos, gêneros, perfis de tela e controle parental continuam no próprio aparelho.';
    const limits = document.createElement('p'); limits.textContent = 'Vídeos dependem de CORS, HTTPS e codecs compatíveis da fonte. Cast Android, PiP nativo, instalador de APK e integração do controle físico precisam ser conferidos no aparelho.';
    const secure = document.createElement('p'); secure.textContent = window.isSecureContext ? 'Conexão adequada ao cofre cifrado e ao PIN.' : 'Para usar o cofre e o PIN pela rede local, abra o endereço HTTPS com certificado confiável. Neste computador, localhost também é permitido.';
    const model = document.createElement('button'); model.textContent = 'Conferir outro tipo de dispositivo'; model.onclick = () => { dialog.close(); openDevicePresentation(); };
    const close = document.createElement('button'); close.textContent = 'Fechar'; close.onclick = () => dialog.close();
    const diagnostic = document.createElement('pre'); diagnostic.style.whiteSpace = 'pre-wrap';
    const progress = getBootSyncCoordinator().getProgress(), code = (value: unknown) => typeof value === 'string' && /^[A-Z][A-Z0-9_]{1,80}$/.test(value) ? value : 'NAO_INFORMADO';
    const playback = defaultPlaybackService.getCurrentSession(), video = document.querySelector<HTMLVideoElement>('.web-player-host video');
    const hero = document.querySelector<HTMLElement>('.home-hero-carousel[data-web-hero-state]');
    const heroNumber = (value?: string) => value && /^\d{1,7}$/.test(value) ? value : '0';
    diagnostic.textContent = ['XANDEFLIX_WEB_DIAGNOSTIC_V1', 'SECURE_CONTEXT=' + (window.isSecureContext ? 'SIM' : 'NAO'),
      'SOURCE_STORE=' + (Capacitor.isPluginAvailable('LocalSecureSourceStore') ? 'DISPONIVEL' : 'RECARREGAR_PAGINA'),
      'PLAYER=' + (Capacitor.isPluginAvailable('NativeAndroidPlayer') ? 'DISPONIVEL' : 'RECARREGAR_PAGINA'),
      'CATALOG_STATE=' + code(progress.state), 'CATALOG_OUTCOME=' + outcome, 'CATALOG_ERROR=' + code(progress.error),
      'SOURCE_FETCH_STAGE=' + transport.stage, 'SOURCE_FETCH_ERROR=' + transport.error, 'SOURCE_HTTP_STATUS=' + transport.status,
      'PLAYBACK_STATE=' + safe(playback.state), 'PLAYBACK_ERROR=' + safe(playback.errorCategory),
      'VIDEO_READY_STATE=' + (video?.readyState ?? 'NONE'), 'VIDEO_ADVANCED=' + (video && video.currentTime > 0 ? 'SIM' : 'NAO'),
      'VIDEO_ERROR_CODE=' + (video?.error?.code || 0)].join('\n');
    diagnostic.textContent += '\n' + ['HERO_ROTATION_STATE=' + safe(hero?.dataset.webHeroState || 'NO_HERO'),
      'HERO_IMAGE_COUNT=' + heroNumber(hero?.dataset.webHeroCount), 'HERO_IMAGE_POSITION=' + heroNumber(hero?.dataset.webHeroPosition),
      'HERO_TIMER=' + safe(hero?.dataset.webHeroTimer || 'NOT_ARMED'), 'HERO_TIMER_TICKS=' + heroNumber(hero?.dataset.webHeroTicks), 'HERO_INTERVAL_SECONDS=10'].join('\n');
    const ambientRoot = document.querySelector<HTMLElement>('.hero-banner, .detail-page');
    const ambientPage = ambientRoot?.closest<HTMLElement>('.page-container');
    const ambientShell = ambientRoot?.closest<HTMLElement>('.app-shell');
    const ambientHeader = ambientShell?.querySelector<HTMLElement>('.app-header');
    const ambientImages = [...(ambientRoot?.querySelectorAll<HTMLImageElement>('img[data-immersive-artwork]') || [])];
    const ambientImage = ambientImages.find(image => image.dataset.immersiveArtwork === 'backdrop' && image.complete && image.naturalWidth)
      || ambientImages.find(image => image.complete && image.naturalWidth);
    const ambientColor = (value?: string) => value && /^rgba?\([\d.,\s/%]+\)$/.test(value.trim()) ? value.trim() : 'NONE';
    const ambientBackground = (element: HTMLElement | null | undefined) => element ? getComputedStyle(element).backgroundImage : '';
    diagnostic.textContent += '\n' + ['AMBIENT_WEB_BUILD=' + (isWebValidation() ? 'SIM' : 'NAO'),
      'AMBIENT_IMAGE_READY=' + (ambientImage ? 'SIM' : 'NAO'),
      'AMBIENT_PROBE_STATE=' + safe(ambientImage?.dataset.webAmbientState || 'NOT_REQUESTED'),
      'AMBIENT_PROBE_FAILURE=' + safe(ambientImage?.dataset.webAmbientFailure || 'NONE'),
      'AMBIENT_PAGE_ACTIVE=' + (ambientPage?.classList.contains('immersive-background') ? 'SIM' : 'NAO'),
      'AMBIENT_PAGE_COLOR=' + ambientColor(ambientPage?.style.getPropertyValue('--artwork-ambient')),
      'AMBIENT_SHELL_COLOR=' + ambientColor(ambientShell?.style.getPropertyValue('--navigation-ambient')),
      'AMBIENT_PAGE_GRADIENT=' + (ambientBackground(ambientPage).startsWith('linear-gradient(') ? 'SIM' : 'NAO'),
      'AMBIENT_SHELL_GRADIENT=' + (ambientBackground(ambientShell).startsWith('linear-gradient(') ? 'SIM' : 'NAO'),
      'AMBIENT_SHELL_GRADIENT_START=' + ambientColor(ambientBackground(ambientShell).match(/rgba?\([\d.,\s/%]+\)/)?.[0]),
      'AMBIENT_HEADER_COLOR=' + ambientColor(ambientHeader ? getComputedStyle(ambientHeader).backgroundColor : undefined)].join('\n');
    const copy = document.createElement('button'); copy.textContent = 'Copiar diagnóstico web'; copy.onclick = () => { void navigator.clipboard?.writeText(diagnostic.textContent || '').then(() => { copy.textContent = 'Copiado'; }).catch(() => { copy.textContent = 'Selecione o diagnóstico acima'; }); };
    dialog.append(title, description, limits, secure, model, diagnostic, copy, close); dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog); dialog.showModal(); close.focus();
  };
  document.body.append(badge);
  if (!window.isSecureContext) badge.click();
}
