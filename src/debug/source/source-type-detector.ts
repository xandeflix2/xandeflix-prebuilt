/**
 * Xandeflix Prebuilt — Source Type Detector (Experiment R7A)
 *
 * Classificador local e heurístico de tipos de fonte IPTV/VOD.
 *
 * Princípios:
 * - LOCAL_PROCESSING_ONLY: Opera 100% no dispositivo sem enviar dados para o backend.
 * - DISTINÇÃO HLS/TS: Distingue manifests de stream único (.m3u8) e fluxos diretos (.ts)
 *   de playlists completas de catálogo (.m3u / Xtream).
 */

import {
  type SourceRuntimeConfig,
  type DetectedSourceType,
} from './source-runtime-config.ts';

export interface SourceTypeDetectionResult {
  detectedType: DetectedSourceType;
  catalogImportEligible: boolean;
  readyForR7b: boolean;
  reason: string;
}

export class SourceTypeDetector {
  /**
   * Detecta e classifica o tipo de fonte com base na configuração e em amostra opcional de cabeçalho.
   */
  static detect(
    config: SourceRuntimeConfig,
    sampleHeader?: string
  ): SourceTypeDetectionResult {
    // 1. Verificação explícita de MPEG-TS direto (não é catálogo)
    const urlToCheck = (config.playlistUrl || config.host || '').trim().toLowerCase();
    if (urlToCheck.endsWith('.ts') || urlToCheck.includes('.ts?') || urlToCheck.includes('/live/') && urlToCheck.endsWith('.ts')) {
      return {
        detectedType: 'TS_DIRECT_STREAM',
        catalogImportEligible: false,
        readyForR7b: false,
        reason: 'A URL aponta para um stream MPEG-TS direto, não sendo elegível como catálogo de múltiplos títulos.',
      };
    }

    // 2. Se o usuário declarou explicitamente XTREAM
    if (config.type === 'XTREAM') {
      return {
        detectedType: 'XTREAM',
        catalogImportEligible: true,
        readyForR7b: true,
        reason: 'Tipo configurado explicitamente como Xtream Codes API.',
      };
    }

    // 3. Se o usuário declarou explicitamente M3U
    if (config.type === 'M3U') {
      // Mesmo em M3U explícito, verificar se é HLS single stream
      if (this.isHlsSingleStream(urlToCheck, sampleHeader)) {
        return {
          detectedType: 'HLS_SINGLE_STREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          reason: 'O link informado corresponde a um manifest HLS de stream único (master playlist adaptativa), não a um catálogo.',
        };
      }

      return {
        detectedType: 'M3U',
        catalogImportEligible: true,
        readyForR7b: true,
        reason: 'Tipo configurado explicitamente como Playlist M3U.',
      };
    }

    // 4. Detecção em modo AUTO
    // 4.1 Evidência clara de Xtream: campos host + username + password preenchidos
    if (config.host && config.username && config.password) {
      return {
        detectedType: 'XTREAM',
        catalogImportEligible: true,
        readyForR7b: true,
        reason: 'Detectado servidor Xtream Codes via credenciais (host, username, password).',
      };
    }

    // 4.2 Evidência de Xtream via URL (player_api.php ou get.php)
    if (urlToCheck.includes('player_api.php') || (urlToCheck.includes('get.php') && urlToCheck.includes('username='))) {
      return {
        detectedType: 'XTREAM',
        catalogImportEligible: true,
        readyForR7b: true,
        reason: 'Detectado endpoint compatível com Xtream Codes API.',
      };
    }

    // 4.3 Verificação de HLS Single Stream (.m3u8 sem catálogo)
    if (this.isHlsSingleStream(urlToCheck, sampleHeader)) {
      return {
        detectedType: 'HLS_SINGLE_STREAM',
        catalogImportEligible: false,
        readyForR7b: false,
        reason: 'Manifest HLS de reprodução de stream único detectado. Não é um catálogo.',
      };
    }

    // 4.4 Verificação de M3U Playlist multi-entry
    if (
      urlToCheck.includes('.m3u') ||
      urlToCheck.includes('type=m3u') ||
      (sampleHeader && sampleHeader.includes('#EXTM3U'))
    ) {
      return {
        detectedType: 'M3U',
        catalogImportEligible: true,
        readyForR7b: true,
        reason: 'Detectada playlist multi-títulos em formato M3U.',
      };
    }

    return {
      detectedType: 'UNKNOWN',
      catalogImportEligible: false,
      readyForR7b: false,
      reason: 'Não foi possível classificar o tipo da fonte com as evidências locais fornecidas.',
    };
  }

  /**
   * Distingue manifest HLS de stream único de playlist M3U completa de catálogo.
   */
  static isHlsSingleStream(url: string, sampleHeader?: string): boolean {
    if (sampleHeader) {
      const upper = sampleHeader.toUpperCase();
      // Manifests HLS contêm tags de bitrate e codecs (#EXT-X-STREAM-INF)
      // sem conter múltiplos blocos #EXTINF com nomes de canais
      if (upper.includes('#EXT-X-STREAM-INF') && !upper.includes('#EXTINF:')) {
        return true;
      }
      if (upper.includes('#EXT-X-TARGETDURATION') && !upper.includes('#EXTINF:')) {
        return true;
      }
    }

    // Heurística de URL: se terminar em .m3u8 e tiver indicativo de stream/live/master
    if (url.endsWith('.m3u8')) {
      if (url.includes('/master.m3u8') || url.includes('/index.m3u8') || url.includes('/playlist.m3u8') || url.includes('/live/')) {
        // Se não tiver parâmetros de exportação de playlist inteira
        if (!url.includes('username=') && !url.includes('get.php') && !url.includes('type=m3u')) {
          return true;
        }
      }
    }

    return false;
  }
}
