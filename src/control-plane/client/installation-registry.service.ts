/**
 * Xandeflix Prebuilt — Installation Registry Service (C2)
 *
 * Responsável por emitir o reporte best-effort da instalação para o Control Plane.
 *
 * Princípios:
 * - BEST_EFFORT_NON_FATAL: Falha de rede, indisponibilidade do backend ou payload recusado
 *   NUNCA devem travar ou impedir o boot da aplicação nem o carregamento de catálogo local.
 * - SANITIZED_METADATA: Somente metadados operacionais permitidos trafegam.
 * - SEPARATION_OF_CONCERNS: Instalação é descoberta, não autorização de dispositivo.
 */

import { Capacitor } from '@capacitor/core';
import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import { getSupabaseBrowserClient } from '../../integrations/supabase/client.ts';
import type {
  AppInstallationReportPayload,
  AppInstallationReportResponse,
} from '../control-plane.types.ts';

export const CANONICAL_PACKAGE_NAME = 'com.xandeflix.prebuilt';

export class InstallationRegistryService {
  private static lastReportedAtMs = 0;

  /**
   * Reporta a instalação atual de forma idempotente e segura durante o ciclo de boot.
   *
   * Garantia: Nunca lança exceção em caso de erro.
   */
  static async reportInstallationBestEffort(): Promise<AppInstallationReportResponse | null> {
    try {
      // 1. Assegura a identidade da instalação e a identidade do dispositivo
      const [installation, identity] = await Promise.all([
        DeviceIdentityService.getOrCreateInstallationIdentity(),
        DeviceIdentityService.getOrCreateIdentity(),
      ]);

      // 2. Verifica se o cliente Supabase está disponível
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        return null;
      }

      // 3. Monta o payload estritamente sanitizado
      const payload: AppInstallationReportPayload = {
        installationId: installation.installationId,
        deviceId: identity.deviceId,
        displayCode: identity.displayCode,
        packageName: CANONICAL_PACKAGE_NAME,
        platform: Capacitor.isNativePlatform() ? 'ANDROID' : 'WEB',
        deviceType: identity.deviceType,
        manufacturer: typeof navigator !== 'undefined' ? (navigator as any).userAgentData?.brands?.[0]?.brand || 'Xandeflix' : 'Xandeflix',
        model: identity.deviceLabel || 'Dispositivo',
        appVersion: '2.0.0',
        buildNumber: '1',
      };

      // 4. Executa a RPC pública sanitizada
      const { data, error } = await supabase.rpc('rpc_report_app_installation', {
        p_payload: payload,
      });

      if (error) {
        // Falha no backend ou rejeição: não é fatal
        return null;
      }

      this.lastReportedAtMs = Date.now();
      return (data as AppInstallationReportResponse) ?? null;
    } catch {
      // Falha de rede ou timeout: absorvida com segurança (BEST_EFFORT_NON_FATAL)
      return null;
    }
  }

  static getLastReportedAt(): number {
    return this.lastReportedAtMs;
  }
}
