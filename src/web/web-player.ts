import { WebPlugin } from '@capacitor/core';
import type { NativePlaybackRequest, NativePreviewRequest, NativePreviewUpdateRequest, NativeLiveContext, NativeLiveAction, NativePlayerProgressEvent } from '../playback/native-android-player.bridge.ts';
import { attachWebMedia, normalizeWebMediaRequest, type WebMediaResource } from './web-media.ts';

type Surface = { id: string; host: HTMLDivElement; video: HTMLVideoElement; status: HTMLElement; tools: HTMLElement;
  preview: boolean; obscured: boolean; full: boolean; controller: AbortController; destroy?: WebMediaResource;
  request: NativePlaybackRequest; context?: NativeLiveContext; progressAt: number; savedFocus: Element | null;
  locked: boolean; navigating?: boolean; timer?: ReturnType<typeof setTimeout>; ui?: { play: HTMLButtonElement; seek?: HTMLInputElement; time?: HTMLElement; duration?: HTMLElement } };

/** Explicit browser implementation, registered only in the local web validation build. */
export class WebPlayer extends WebPlugin {
  private surface?: Surface;
  private sequence = 0;
  private progress: NativePlayerProgressEvent[] = [];
  private keyListener = (event: KeyboardEvent) => {
    const surface = this.surface; if (!surface || surface.obscured || !surface.full || document.querySelector('.parental-dialog[open]')) return;
    event.stopImmediatePropagation(); this.reveal(surface);
    if (event.key === 'Escape' || event.key === 'BrowserBack') {
      event.preventDefault();
      const panel = surface.host.querySelector('.web-player-panel');
      if (panel) { panel.remove(); surface.tools.querySelector('button')?.focus(); return; }
      if (surface.locked) { surface.locked = false; this.controls(surface); return; }
      if (document.fullscreenElement === surface.host) { void document.exitFullscreen().catch(() => {}); return; }
      if (surface.preview) this.fullscreen(surface, false); else this.closeVod(); return;
    }
    const controls = surface.locked ? [...surface.host.querySelectorAll<HTMLElement>('.web-player-lock')]
      : [...(surface.host.querySelector('.web-player-panel') || surface.tools).querySelectorAll<HTMLElement>('button,input,select')].filter(control => !(control as HTMLButtonElement).disabled);
    if (event.key === 'Tab') {
      const index = controls.indexOf(document.activeElement as HTMLElement);
      event.preventDefault(); event.stopImmediatePropagation(); controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus(); return;
    }
    if (surface.locked) return;
    if (event.target instanceof HTMLElement && event.target.closest('button') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      const index = controls.indexOf(document.activeElement as HTMLElement), step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      event.preventDefault(); controls[(index + step + controls.length) % controls.length]?.focus(); return;
    }
    if (event.target instanceof HTMLElement && event.target.closest('button,input,select,.web-player-panel')) return;
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); this.togglePlayback(surface); return; }
    if (surface.preview && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') this.action(surface, event.key === 'ArrowLeft' ? 'previous' : 'next');
      else surface.video.volume = Math.max(0, Math.min(1, surface.video.volume + (event.key === 'ArrowUp' ? .05 : -.05)));
    }
  };
  constructor() { super(); window.addEventListener('keydown', this.keyListener, true); window.addEventListener('pagehide', () => { this.drop(); }); }
  private button(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.className = 'focusable-item';
    button.onclick = action; return button;
  }
  private action(surface: Surface, action: NativeLiveAction, id?: string) {
    if (surface !== this.surface || surface.obscured) return;
    this.notifyListeners('nativeLiveAction', { previewId: surface.id, channelId: surface.context?.channelId || '', action, id });
  }
  private checkpoint(surface: Surface, ended = false) {
    const video = surface.video;
    if (surface.preview || !Number.isFinite(video.currentTime)) return;
    const event: NativePlayerProgressEvent = { playbackId: surface.request.playbackId, positionMs: Math.round(video.currentTime * 1000),
      durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : undefined, ended, observedAt: Date.now() };
    this.progress = [event]; this.notifyListeners('progress', event);
  }
  private drop() {
    const surface = this.surface; if (!surface) return;
    clearTimeout(surface.timer);
    this.surface = undefined; this.checkpoint(surface); surface.controller.abort(); const destroy = surface.destroy; surface.destroy = undefined; destroy?.();
    surface.video.pause(); surface.video.removeAttribute('src'); surface.video.load(); surface.host.remove();
    document.body.classList.remove('web-player-open');
  }
  private closeVod(error = false) {
    const surface = this.surface; if (!surface || surface.preview) return;
    const positionMs = Math.round(surface.video.currentTime * 1000), ended = surface.video.ended;
    this.drop(); this.notifyListeners('resume', { positionMs, ended, ...(error ? { errorCode: 'SOURCE_UNAVAILABLE', errorCategory: 'SOURCE_UNAVAILABLE' } : {}) });
    if (surface.savedFocus instanceof HTMLElement && surface.savedFocus.isConnected) surface.savedFocus.focus();
  }
  private fail(surface: Surface) {
    if (this.surface !== surface || surface.controller.signal.aborted) return;
    surface.status.textContent = 'Não foi possível reproduzir no navegador. Confira CORS, HTTPS e o formato de vídeo oferecido pela fonte.';
    surface.controller.abort(); const destroy = surface.destroy; surface.destroy = undefined; destroy?.(); surface.video.pause(); surface.video.removeAttribute('src'); surface.video.load();
    if (surface.preview) this.notifyListeners('nativePreviewError', { previewId: surface.id, errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' });
    else this.closeVod(true);
  }
  private fullscreen(surface: Surface, full: boolean) {
    if (surface.obscured) return;
    surface.full = full; surface.host.classList.toggle('web-player-host--full', full);
    document.body.classList.toggle('web-player-open', full);
    this.controls(surface);
    if (full) this.reveal(surface); else clearTimeout(surface.timer);
    if (!full) surface.host.querySelector('.web-player-panel')?.remove();
    if (surface.preview) this.notifyListeners('nativePreviewFullscreenChanged', { previewId: surface.id, fullscreen: full });
  }
  private reveal(surface: Surface) {
    if (surface !== this.surface) return;
    clearTimeout(surface.timer); surface.host.classList.add('web-player-host--controls');
    if (!surface.full || surface.locked) return;
    surface.timer = setTimeout(() => {
      if (surface !== this.surface || surface.video.paused || surface.host.querySelector('.web-player-panel')
        || document.activeElement instanceof HTMLInputElement && surface.host.contains(document.activeElement)) return;
      surface.host.classList.remove('web-player-host--controls');
    }, 4000);
  }
  private togglePlayback(surface: Surface) {
    if (surface.navigating) return;
    if (surface.video.paused) void surface.video.play().catch(() => this.fail(surface)); else surface.video.pause();
    this.refresh(surface); this.reveal(surface);
  }
  private refresh(surface: Surface) {
    const ui = surface.ui; if (!ui) return;
    ui.play.textContent = surface.video.paused ? '▶' : '❚❚';
    ui.play.setAttribute('aria-label', surface.video.paused ? 'Reproduzir' : 'Pausar');
    if (ui.seek && ui.time && ui.duration) {
      const seconds = surface.video.duration, valid = Number.isFinite(seconds) && seconds > 0;
      ui.seek.disabled = !valid; ui.seek.max = String(valid ? seconds : 0); ui.seek.value = String(surface.video.currentTime || 0);
      const format = (value: number) => { const n = Math.max(0, Math.floor(value || 0)), h = Math.floor(n / 3600); return (h ? h + ':' : '') + String(Math.floor(n / 60) % 60).padStart(2,'0') + ':' + String(n % 60).padStart(2,'0'); };
      ui.time.textContent = format(surface.video.currentTime); ui.duration.textContent = valid ? format(seconds) : '--:--';
    }
  }
  private panel(surface: Surface, title: string): HTMLDivElement {
    surface.host.querySelector('.web-player-panel')?.remove();
    const panel = document.createElement('div'); panel.className = 'web-player-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', title);
    const heading = document.createElement('h3'); heading.textContent = title;
    panel.append(heading, this.button('Fechar', () => { panel.remove(); this.reveal(surface); surface.tools.querySelector('button')?.focus(); }));
    surface.host.append(panel); this.reveal(surface); return panel;
  }
  private tracks(surface: Surface) {
    const panel = this.panel(surface, 'Áudio e legendas'), tracks = surface.destroy?.tracks?.();
    for (const [title, rows] of [['Áudio', tracks?.audio || []], ['Legendas', tracks?.subtitles || []]] as const) {
      const heading = document.createElement('h4'); heading.textContent = title; panel.append(heading);
      if (!rows.length || title === 'Legendas' && rows.length === 1 && rows[0].label === 'Desativadas') {
        const message = document.createElement('p'); message.textContent = 'A fonte ou este navegador não disponibilizou trilhas selecionáveis.'; panel.append(message);
      } else for (const row of rows) panel.append(this.button((row.selected ? '✓ ' : '') + row.label, () => { row.select(); this.tracks(surface); }));
    }
    panel.querySelector('button')?.focus();
  }
  private controls(surface: Surface) {
    const tools = surface.tools, video = surface.video; tools.replaceChildren(); surface.ui = undefined;
    video.controls = false; surface.host.classList.toggle('web-player-host--locked', surface.locked);
    if (surface.preview && !surface.full) return;
    const top = document.createElement('div'); top.className = 'web-player-top';
    const title = document.createElement('strong'); title.textContent = surface.context?.name || surface.request.title || 'Xandeflix';
    const lock = this.button(surface.locked ? 'Desbloquear' : 'Bloquear', () => { surface.locked = !surface.locked; this.controls(surface); this.reveal(surface); surface.tools.querySelector<HTMLElement>('.web-player-lock')?.focus(); }); lock.classList.add('web-player-lock');
    top.append(this.button('← Voltar', () => surface.preview ? this.fullscreen(surface, false) : this.closeVod()), title, lock); tools.append(top);
    const center = document.createElement('div'); center.className = 'web-player-center';
    const play = this.button('▶', () => this.togglePlayback(surface)); play.classList.add('web-player-play');
    const seek = (delta: number) => { if (Number.isFinite(video.duration)) video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta)); this.refresh(surface); };
    if (!surface.preview) center.append(this.button('↶ −10s', () => seek(-10)));
    center.append(play); if (!surface.preview) center.append(this.button('+10s ↷', () => seek(10))); tools.append(center);
    const bottom = document.createElement('div'); bottom.className = 'web-player-bottom';
    surface.ui = { play };
    if (!surface.preview) {
      const progress = document.createElement('div'), time = document.createElement('span'), duration = document.createElement('span'), range = document.createElement('input');
      progress.className = 'web-player-progress'; range.type = 'range'; range.min = '0'; range.step = '1'; range.setAttribute('aria-label', 'Posição do vídeo');
      range.oninput = () => { if (Number.isFinite(video.duration)) video.currentTime = Math.min(video.duration, Math.max(0, Number(range.value))); this.refresh(surface); this.reveal(surface); };
      progress.append(time, range, duration); bottom.append(progress); Object.assign(surface.ui, { seek: range, time, duration });
    }
    const actions = document.createElement('div'); actions.className = 'web-player-actions';
    actions.append(this.button(video.style.objectFit === 'cover' ? 'Ajustar tela' : 'Preencher tela', () => { video.style.objectFit = video.style.objectFit === 'cover' ? 'contain' : 'cover'; this.controls(surface); this.reveal(surface); }));
    if (surface.preview) {
      actions.append(this.button('◀ Canal', () => this.action(surface, 'previous')), this.button('Canal ▶', () => this.action(surface, 'next')),
        this.button(surface.context?.favorite ? '★' : '☆', () => this.action(surface, 'favorite')),
        this.button('Canais', () => { this.action(surface, 'channels'); void this.openLivePanel({ previewId: surface.id, panel: 'channels' }); }),
        this.button('Categorias', () => { this.action(surface, 'categories'); void this.openLivePanel({ previewId: surface.id, panel: 'categories' }); }),
        this.button('Guia', () => { this.action(surface, 'guide'); void this.openLivePanel({ previewId: surface.id, panel: 'guide' }); }));
    } else {
      actions.append(this.button(`Velocidade (${video.playbackRate || 1}x)`, () => {
        const panel = this.panel(surface, 'Velocidade');
        for (const speed of [.5,.75,1,1.25,1.5,2]) panel.append(this.button(speed + 'x', () => { video.playbackRate = speed; panel.remove(); this.controls(surface); this.reveal(surface); }));
        panel.querySelector('button')?.focus();
      }), this.button('Áudio e legendas', () => this.tracks(surface)));
      if (surface.request.episodeContext) actions.append(this.button('Episódios', () => {
        const panel = this.panel(surface, 'Episódios');
        for (const episode of surface.request.episodeContext?.episodes || []) {
          const selected = episode.id === surface.request.episodeContext?.currentEpisodeId;
          const button = this.button(`${selected ? '✓ ' : ''}T${episode.seasonNumber}:E${episode.episodeNumber} · ${episode.title}`, () => { panel.remove(); this.navigateEpisode(surface, 'select', episode.id); });
          button.disabled = selected; panel.append(button);
        }
        panel.querySelector('button')?.focus();
      }));
      if (surface.request.episodeContext?.hasNext) actions.append(this.button('Próximo episódio', () => this.navigateEpisode(surface, 'next')));
    }
    const volumeLabel = document.createElement('label'), volume = document.createElement('input'); volumeLabel.textContent = 'Volume'; volume.type = 'range'; volume.min = '0'; volume.max = '1'; volume.step = '.05'; volume.value = String(video.volume); volume.setAttribute('aria-label', 'Volume');
    volume.oninput = () => { video.muted = false; video.volume = Number(volume.value); }; volumeLabel.append(volume); actions.append(volumeLabel);
    if (surface.host.requestFullscreen) actions.append(this.button('Tela cheia', () => { if (document.fullscreenElement === surface.host) void document.exitFullscreen().catch(() => {}); else void surface.host.requestFullscreen().catch(() => { surface.status.textContent = 'O navegador não permitiu tela cheia.'; }); }));
    bottom.append(actions); tools.append(bottom); this.refresh(surface);
  }
  private navigateEpisode(surface: Surface, reason: 'next' | 'ended' | 'select', episodeId?: string) {
    if (surface !== this.surface || surface.navigating || surface.obscured) return;
    surface.navigating = true; this.checkpoint(surface, reason === 'ended'); surface.controller.abort();
    const destroy = surface.destroy; surface.destroy = undefined; destroy?.(); surface.video.pause(); surface.video.removeAttribute('src'); surface.video.load();
    surface.status.textContent = 'Carregando episódio…';
    this.notifyListeners('episodeNavigation', { playbackId: surface.request.playbackId, requestId: 'web-nav-' + (++this.sequence), reason, episodeId });
  }
  private create(original: NativePlaybackRequest, preview: boolean, bounds?: NativePreviewRequest) {
    const request = normalizeWebMediaRequest(original); this.drop();
    const host = document.createElement('div'), video = document.createElement('video'), status = document.createElement('p'), tools = document.createElement('div');
    host.className = 'web-player-host player-overlay'; video.controls = false; video.style.objectFit = 'contain'; video.playsInline = true; video.preload = 'metadata'; video.setAttribute('aria-label', request.title || 'Player de vídeo');
    status.className = 'web-player-status'; status.setAttribute('role','status'); tools.className = 'web-player-tools';
    host.append(video, tools, status); document.body.append(host);
    const surface: Surface = { id: 'web-preview-' + (++this.sequence), host, video, status, tools, preview, obscured: false, full: !preview,
      controller: new AbortController(), request, progressAt: 0, savedFocus: document.activeElement, locked: false };
    this.surface = surface; this.controls(surface); if (!preview) { this.fullscreen(surface, true); tools.querySelector('button')?.focus(); }
    else if (bounds) this.bounds(surface, bounds);
    video.addEventListener('error', () => this.fail(surface));
    video.addEventListener('playing', () => { if (this.surface === surface) { status.textContent = ''; if (preview) this.notifyListeners('nativePreviewPlaying', { previewId: surface.id }); } });
    video.addEventListener('loadedmetadata', () => { const position = request.startPositionMs; if (position && position > 0 && Number.isFinite(video.duration)) video.currentTime = Math.min(position / 1000, video.duration); });
    video.addEventListener('timeupdate', () => { this.refresh(surface); if (Date.now() - surface.progressAt >= 5000) { surface.progressAt = Date.now(); this.checkpoint(surface); } });
    for (const event of ['play','pause','loadedmetadata','durationchange']) video.addEventListener(event, () => { this.refresh(surface); this.reveal(surface); });
    host.addEventListener('pointermove', () => this.reveal(surface)); host.addEventListener('focusin', () => this.reveal(surface));
    video.addEventListener('ended', () => { this.checkpoint(surface, true); if (request.episodeContext?.hasNext) this.navigateEpisode(surface, 'ended'); else if (!preview) this.closeVod(); });
    video.addEventListener('click', () => {
      if (surface.obscured || this.surface !== surface) return;
      if (surface.full) { this.reveal(surface); return; }
      if (!preview) return;
      if (video.paused) void video.play().catch(() => this.fail(surface));
      else this.notifyListeners('nativePreviewTap', { previewId: surface.id });
    });
    void this.load(surface, request); return surface;
  }
  private bounds(surface: Surface, bounds: Partial<NativePreviewRequest>) {
    for (const name of ['left','top','width','height'] as const) if (Number.isFinite(bounds[name])) surface.host.style[name] = Math.max(0, bounds[name]!) + 'px';
  }
  private async load(surface: Surface, request: NativePlaybackRequest) {
    surface.controller.abort(); const previous = surface.destroy; surface.destroy = undefined; previous?.(); surface.controller = new AbortController(); surface.request = request;
    const controller = surface.controller;
    try {
      const destroy = await attachWebMedia(surface.video, request, controller.signal, () => this.fail(surface));
      if (this.surface !== surface || controller.signal.aborted) { destroy(); return; } surface.destroy = destroy;
      await surface.video.play().catch(error => { if (error?.name === 'NotAllowedError') surface.status.textContent = surface.preview ? 'Toque no vídeo para iniciar.' : 'Use o controle de reprodução para iniciar o vídeo.'; else throw error; });
    } catch { if (this.surface === surface && !controller.signal.aborted) this.fail(surface); }
  }
  async open(request: NativePlaybackRequest) {
    if (request.replacePlaybackId && (this.surface?.request.playbackId !== request.replacePlaybackId || !request.navigationRequestId)) throw new Error('INVALID_REQUEST');
    this.create(request, false); return { accepted: true, candidateCount: 1 };
  }
  async startPreview(request: NativePreviewRequest) {
    const surface = this.create(request, true, request); surface.context = request.liveContext; this.controls(surface); return { accepted: true, previewId: surface.id };
  }
  private requirePreview(id?: string) { const surface = this.surface; if (!surface?.preview || (id && id !== surface.id)) throw new Error('INVALID_REQUEST'); return surface; }
  async updatePreview(request: NativePreviewUpdateRequest) {
    const surface = this.requirePreview(request.previewId);
    if (typeof request.obscured === 'boolean') {
      if (!request.previewId || request.uri || request.headers || request.suspendPlayback) throw new Error('INVALID_REQUEST');
      surface.obscured = request.obscured; surface.host.hidden = request.obscured; if (request.obscured && surface.full) { surface.full = false; surface.host.classList.remove('web-player-host--full'); document.body.classList.remove('web-player-open'); this.notifyListeners('nativePreviewFullscreenChanged', { previewId: surface.id, fullscreen: false }); }
      if (request.obscured) surface.host.querySelector('.web-player-panel')?.remove();
      this.controls(surface);
    }
    if (request.suspendPlayback) { surface.controller.abort(); surface.destroy?.(); surface.destroy = undefined; surface.video.pause(); surface.video.removeAttribute('src'); surface.video.load(); }
    if (request.uri) { const next = normalizeWebMediaRequest({ uri: request.uri, headers: request.headers, kind: 'live' as const }); void this.load(surface, next); }
    this.bounds(surface, request); return { accepted: true, previewId: surface.id };
  }
  async stopPreview(options?: { previewId?: string }) { const surface = this.surface; if (surface) this.requirePreview(options?.previewId); this.drop(); return { accepted: true, previewId: options?.previewId }; }
  async enterPreviewFullscreen(options?: { previewId?: string }) { const surface = this.requirePreview(options?.previewId); this.fullscreen(surface, true); return { accepted: true, previewId: surface.id, fullscreen: surface.full }; }
  async exitPreviewFullscreen(options?: { previewId?: string }) { const surface = this.requirePreview(options?.previewId); this.fullscreen(surface, false); return { accepted: true, previewId: surface.id, fullscreen: false }; }
  async setLiveControls({ previewId, context }: { previewId: string; context: NativeLiveContext }) { const surface = this.requirePreview(previewId); surface.context = context; this.controls(surface); return { accepted: true }; }
  async openLivePanel({ previewId, panel }: { previewId: string; panel: 'channels' | 'categories' | 'guide' | 'favorites' }) {
    const surface = this.requirePreview(previewId); if (surface.obscured || !surface.full) throw new Error('INVALID_REQUEST');
    surface.host.querySelector('.web-player-panel')?.remove(); const list = document.createElement('div'); list.className = 'web-player-panel';
    list.append(this.button('Fechar lista', () => list.remove()));
    const context = surface.context;
    if (panel === 'guide') {
      for (const program of context?.epg.programs || []) { const text = document.createElement('p'); text.textContent = new Date(program.start).toLocaleTimeString('pt-BR', { hour:'2-digit',minute:'2-digit' }) + ' · ' + program.title; list.append(text); }
      if (!context?.epg.programs.length) { const text = document.createElement('p'); text.textContent = context?.epg.message || 'Programação indisponível.'; list.append(text); }
    } else {
      const groups = panel === 'categories', rows = groups ? context?.groups : context?.channels;
      for (const row of rows || []) list.append(this.button(row.name, () => { list.remove(); this.action(surface, groups ? 'selectGroup' : 'selectChannel', row.id); }));
      if (groups ? context?.previousGroups : context?.previousPage) list.append(this.button('Página anterior', () => this.action(surface, groups ? 'groupPrevious' : 'pagePrevious')));
      if (groups ? context?.nextGroups : context?.nextPage) list.append(this.button('Próxima página', () => this.action(surface, groups ? 'groupNext' : 'pageNext')));
    }
    surface.host.append(list); list.querySelector('button')?.focus(); return { accepted: true };
  }
  async stopPlayback() { this.drop(); }
  async getWatchProgress() { return { events: this.progress }; }
  async cancelEpisodeNavigation() { const surface = this.surface; if (surface && !surface.preview) surface.status.textContent = 'Não foi possível trocar o episódio. Escolha novamente na página da série.'; }
  async finishApp() { return { finished: false }; }
}
