/**
 * Xandeflix Prebuilt — Xtream Codes Source Adapter (Experiment R7A)
 *
 * Adaptador de conexão e validação para servidores Xtream Codes API.
 *
 * Princípios:
 * - DEVICE_DIRECT: A requisição sai diretamente do dispositivo para o servidor da fonte.
 * - NO_SECRET_LOGGING: Nenhuma URL materializada contendo credenciais é logada.
 * - MINIMAL_HANDSHAKE: Chama apenas o endpoint de autenticação sem baixar categorias ou catálogo.
 */

import {
  type SourceType,
  type SourceRuntimeConfig,
  type SourceConnectionTestResult,
} from './source-runtime-config.ts';
import { type RealSourceAdapter, type ValidationResult } from './source-adapter.ts';
import { sanitizeErrorMessage, SANITIZED_ERROR_CODES } from './source-error-sanitizer.ts';

export class XtreamSourceAdapter implements RealSourceAdapter {
  getSourceType(): SourceType {
    return 'XTREAM';
  }

  /**
   * Valida as credenciais mínimas para configuração Xtream.
   */
  validateConfig(config: SourceRuntimeConfig): ValidationResult {
    const errors: string[] = [];

    const host = (config.host || '').trim();
    if (!host) {
      errors.push('O campo Servidor / Host é obrigatório para fontes Xtream.');
    }

    const username = (config.username || '').trim();
    if (!username) {
      errors.push('O campo Usuário é obrigatório para fontes Xtream.');
    }

    const password = (config.password || '').trim();
    if (!password) {
      errors.push('O campo Senha é obrigatório para fontes Xtream.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normaliza o host do servidor (protocolo padrão http://, sem barras finais).
   */
  private normalizeHost(host: string): string {
    let clean = host.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = `http://${clean}`;
    }
    // Remove barras no final e caminhos residuais
    clean = clean.replace(/\/+$/, '');
    clean = clean.replace(/\/player_api\.php.*$/i, '');
    clean = clean.replace(/\/get\.php.*$/i, '');
    return clean;
  }

  /**
   * Executa teste mínimo de autenticação e conectividade com a API Xtream.
   */
  async testConnection(config: SourceRuntimeConfig): Promise<SourceConnectionTestResult> {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      return {
        connection: 'FAIL',
        auth: 'NA',
        detectedType: 'XTREAM',
        catalogImportEligible: false,
        readyForR7b: false,
        sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_CONFIG_INVALID,
        testedAtIso: new Date().toISOString(),
      };
    }

    const host = this.normalizeHost(config.host!);
    const username = config.username!.trim();
    const password = config.password!.trim();

    // Constrói URL efêmera somente no momento da chamada (NUNCA persiste nem loga)
    const targetUrl = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'IPTVSmarters/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        return {
          connection: 'PASS',
          auth: 'AUTH_FAILED',
          detectedType: 'XTREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_AUTH_FAILED,
          testedAtIso: new Date().toISOString(),
        };
      }

      if (!response.ok) {
        return {
          connection: 'FAIL',
          auth: 'NA',
          detectedType: 'XTREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_INVALID_RESPONSE,
          testedAtIso: new Date().toISOString(),
        };
      }

      const data = await response.json().catch(() => null);
      if (!data || typeof data !== 'object') {
        return {
          connection: 'PASS',
          auth: 'AUTH_FAILED',
          detectedType: 'XTREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_INVALID_RESPONSE,
          testedAtIso: new Date().toISOString(),
        };
      }

      const userInfo = (data as any).user_info;
      const isAuthOk = userInfo && (userInfo.auth === 1 || userInfo.auth === '1');
      const statusStr = String(userInfo?.status || '').toLowerCase();
      const isActive = statusStr === 'active' || isAuthOk;

      if (isAuthOk && isActive) {
        return {
          connection: 'PASS',
          auth: 'PASS',
          detectedType: 'XTREAM',
          catalogImportEligible: true,
          readyForR7b: true,
          sanitizedMessage: 'SOURCE_AUTHENTICATED',
          testedAtIso: new Date().toISOString(),
        };
      } else {
        return {
          connection: 'PASS',
          auth: 'AUTH_FAILED',
          detectedType: 'XTREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: SANITIZED_ERROR_CODES.SOURCE_AUTH_FAILED,
          testedAtIso: new Date().toISOString(),
        };
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const sanitized = sanitizeErrorMessage(err);
      return {
        connection: 'FAIL',
        auth: 'NA',
        detectedType: 'XTREAM',
        catalogImportEligible: false,
        readyForR7b: false,
        sanitizedMessage: sanitized,
        testedAtIso: new Date().toISOString(),
      };
    }
  }
}
