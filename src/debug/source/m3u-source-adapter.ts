/**
 * Xandeflix Prebuilt — M3U Playlist Source Adapter (Experiment R7A)
 *
 * Adaptador de conexão e validação para playlists M3U/M3U8.
 *
 * Princípios:
 * - DEVICE_DIRECT: A requisição sai diretamente do dispositivo para a URL da playlist.
 * - MINIMAL_PROBE: Faz requisição parcial (Range 0-2048 bytes) para validar formato e cabeçalho,
 *   sem baixar nem persistir a playlist completa.
 * - HLS/TS DISCRIMINATION: Distingue stream único HLS (.m3u8) e MPEG-TS (.ts) de catálogo M3U.
 */

import {
  type SourceType,
  type SourceRuntimeConfig,
  type SourceConnectionTestResult,
} from './source-runtime-config.ts';
import { type RealSourceAdapter, type ValidationResult } from './source-adapter.ts';
import { SourceTypeDetector } from './source-type-detector.ts';
import { sanitizeErrorMessage, SANITIZED_ERROR_CODES } from './source-error-sanitizer.ts';

export class M3uSourceAdapter implements RealSourceAdapter {
  getSourceType(): SourceType {
    return 'M3U';
  }

  /**
   * Valida a URL informada para a playlist M3U.
   */
  validateConfig(config: SourceRuntimeConfig): ValidationResult {
    const errors: string[] = [];
    const url = (config.playlistUrl || '').trim();

    if (!url) {
      errors.push('A URL da Playlist é obrigatória para fontes M3U.');
    } else if (!/^https?:\/\//i.test(url)) {
      errors.push('A URL deve iniciar com http:// ou https://.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Executa teste leve de conectividade e validação de cabeçalho M3U.
   */
  async testConnection(config: SourceRuntimeConfig): Promise<SourceConnectionTestResult> {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      return {
        connection: 'FAIL',
        auth: 'NA',
        detectedType: 'M3U',
        catalogImportEligible: false,
        readyForR7b: false,
        sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_CONFIG_INVALID,
        testedAtIso: new Date().toISOString(),
      };
    }

    const targetUrl = config.playlistUrl!.trim();

    // Verificação estática imediata de stream direto MPEG-TS
    if (targetUrl.toLowerCase().endsWith('.ts')) {
      return {
        connection: 'PASS',
        auth: 'NA',
        detectedType: 'TS_DIRECT_STREAM',
        catalogImportEligible: false,
        readyForR7b: false,
        sanitizedMessage: 'SOURCE_TS_STREAM_NOT_CATALOG',
        testedAtIso: new Date().toISOString(),
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      // Faz requisição parcial solicitando apenas os primeiros 2 KB
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-2048',
          'User-Agent': 'IPTVSmarters/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        return {
          connection: 'PASS',
          auth: 'AUTH_FAILED',
          detectedType: 'M3U',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_AUTH_FAILED,
          testedAtIso: new Date().toISOString(),
        };
      }

      if (!response.ok && response.status !== 206) {
        return {
          connection: 'FAIL',
          auth: 'NA',
          detectedType: 'M3U',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_INVALID_RESPONSE,
          testedAtIso: new Date().toISOString(),
        };
      }

      // Lê apenas a amostra inicial do buffer
      const sampleText = await response.text().catch(() => '');
      const sampleSlice = sampleText.slice(0, 2048);

      // Classifica usando o SourceTypeDetector
      const detection = SourceTypeDetector.detect(config, sampleSlice);

      if (detection.detectedType === 'HLS_SINGLE_STREAM') {
        return {
          connection: 'PASS',
          auth: 'NA',
          detectedType: 'HLS_SINGLE_STREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: 'SOURCE_SINGLE_STREAM_NOT_CATALOG',
          testedAtIso: new Date().toISOString(),
        };
      }

      if (detection.detectedType === 'TS_DIRECT_STREAM') {
        return {
          connection: 'PASS',
          auth: 'NA',
          detectedType: 'TS_DIRECT_STREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: 'SOURCE_TS_STREAM_NOT_CATALOG',
          testedAtIso: new Date().toISOString(),
        };
      }

      if (sampleSlice.includes('#EXTM3U') || sampleSlice.includes('#EXTINF')) {
        return {
          connection: 'PASS',
          auth: 'NA',
          detectedType: 'M3U',
          catalogImportEligible: true,
          readyForR7b: true,
          sanitizedMessage: 'SOURCE_M3U_VALID',
          testedAtIso: new Date().toISOString(),
        };
      }

      return {
        connection: 'PASS',
        auth: 'NA',
        detectedType: 'UNKNOWN',
        catalogImportEligible: false,
        readyForR7b: false,
        sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_UNSUPPORTED_FORMAT,
        testedAtIso: new Date().toISOString(),
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const sanitized = sanitizeErrorMessage(err);
      return {
        connection: 'FAIL',
        auth: 'NA',
        detectedType: 'M3U',
        catalogImportEligible: false,
        readyForR7b: false,
        sanitizedMessage: sanitized,
        testedAtIso: new Date().toISOString(),
      };
    }
  }
}
