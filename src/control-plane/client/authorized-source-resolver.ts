/**
 * Xandeflix Prebuilt — Authorized Source Resolver (Experiment R7B)
 *
 * Resolvedor de fontes autorizadas no dispositivo cliente.
 *
 * Princípios:
 * - RESOLUTION_FLOW:
 *   1. Apresenta credencial/token do dispositivo ao Control Plane.
 *   2. Valida se o dispositivo e a licença estão autorizados.
 *   3. Se SELF_SERVICE: Carrega a fonte do sandbox privado local (R7A).
 *   4. Se MANAGED: Retorna somente metadata; a configuração real é lida do
 *      LocalSecureSourceStore pelo RuntimeSourceContextProvider.
 * - FAIL_CLOSED: Se a licença estiver revogada ou expirada, bloqueia o uso da fonte local ou remota.
 */

import type { SourceRuntimeConfig } from '../../debug/source/source-runtime-config.ts';
import { DebugSourceConfigService } from '../../debug/source/debug-source-config.service.ts';
import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import { getControlPlaneClient, ControlPlaneClient } from './control-plane-client.ts';
import type {
  SourceResolutionStatus,
  RemoteSourceAuthorizationMetadata,
  ControlPlaneSettings,
  LicenseStatus,
} from '../control-plane.types.ts';
import type { LicenseMode } from '../../device/device.types.ts';

export interface ResolvedSourceResult {
  status: SourceResolutionStatus;
  /** Resultado sanitizado observado na autoridade remota ou no fail-closed local. */
  remoteResultCode?: SourceResolutionStatus | 'REMOTE_AUTHORITY_UNAVAILABLE' | 'LOCAL_ACTIVATION_INVALID' | 'LOCAL_ACTIVATION_DEVICE_ID_MISMATCH';
  /** Booleano sanitizado; nunca inclui URL, JWT ou token. */
  remoteAuthorityAvailable?: boolean;
  mode?: LicenseMode;
  licenseId?: string;
  licenseStatus?: LicenseStatus;
  config?: SourceRuntimeConfig;
  sourceId?: string;
  sourceVersion?: number;
  protocol?: 'M3U' | 'XTREAM';
  sourceStatus?: 'ACTIVE' | 'DISABLED';
  supportContact?: ControlPlaneSettings;
  message?: string;
}

export class AuthorizedSourceResolver {
  private client: ControlPlaneClient;
  private localConfigLoader: () => Promise<SourceRuntimeConfig | null>;

  constructor(
    client?: ControlPlaneClient,
    localConfigStore?: { loadSourceConfig?: () => Promise<SourceRuntimeConfig | null>; loadConfig?: () => Promise<SourceRuntimeConfig | null> }
  ) {
    this.client = client || getControlPlaneClient();
    this.localConfigLoader = localConfigStore?.loadSourceConfig
      ? () => localConfigStore.loadSourceConfig!()
      : (localConfigStore?.loadConfig ? () => localConfigStore.loadConfig!() : () => DebugSourceConfigService.loadConfig());
  }

  async resolve(params?: {
    licenseId?: string;
    deviceId: string;
    deviceToken: string;
    licenseMode: LicenseMode;
  }): Promise<ResolvedSourceResult> {
    if (!params) {
      return AuthorizedSourceResolver.resolve();
    }
    return AuthorizedSourceResolver.resolveWithDependencies(
      params.deviceId,
      params.deviceToken,
      params.licenseMode,
      this.client,
      this.localConfigLoader
    );
  }

  /**
   * Resolve a fonte autorizada para o dispositivo atual do sandbox do app.
   */
  static async resolve(): Promise<ResolvedSourceResult> {
    const identity = await DeviceIdentityService.getOrCreateIdentity();
    const activation = await DeviceIdentityService.loadActivationState();
    const client = getControlPlaneClient();
    const remoteAuthorityAvailable = client.hasAuthorizationAuthority();

    if (!activation || activation.status !== 'AUTHORIZED' || !activation.deviceAuthToken) {
      return {
        status: 'DEVICE_NOT_AUTHORIZED',
        remoteAuthorityAvailable,
        remoteResultCode: 'LOCAL_ACTIVATION_INVALID',
        message: 'Dispositivo ainda não está autorizado no Plano de Controle.',
      };
    }

    if (activation.deviceId !== identity.deviceId) {
      return {
        status: 'DEVICE_NOT_AUTHORIZED',
        remoteAuthorityAvailable,
        remoteResultCode: 'LOCAL_ACTIVATION_DEVICE_ID_MISMATCH',
        message: 'Identidade local e estado de ativação não correspondem.',
      };
    }

    return AuthorizedSourceResolver.resolveWithDependencies(
      identity.deviceId,
      activation.deviceAuthToken,
      activation.licenseMode || 'SELF_SERVICE',
      client,
      () => DebugSourceConfigService.loadConfig()
    );
  }

  /**
   * Resolve a fonte autorizada com injeção explícita de credenciais e dependências.
   */
  static async resolveWithDependencies(
    deviceId: string,
    deviceAuthToken: string,
    licenseMode: LicenseMode,
    client: ControlPlaneClient,
    localConfigLoader: () => Promise<SourceRuntimeConfig | null>
  ): Promise<ResolvedSourceResult> {
    const remoteAuthorityAvailable = client.hasAuthorizationAuthority();

    // 1. Consultar Plano de Controle com a credencial privada do dispositivo
    let cpResponse: RemoteSourceAuthorizationMetadata;
    try {
      cpResponse = await client.resolveSource({
        deviceId,
        deviceAuthToken,
      });
    } catch {
      return {
        status: 'DEVICE_NOT_AUTHORIZED',
        mode: licenseMode,
        remoteAuthorityAvailable,
        remoteResultCode: 'REMOTE_AUTHORITY_UNAVAILABLE',
        message: 'Autoridade remota indisponível; resolução bloqueada em fail-closed.',
      };
    }

    const remoteObservation = {
      remoteAuthorityAvailable,
      remoteResultCode: cpResponse.status,
      licenseId: cpResponse.licenseId,
      licenseStatus: cpResponse.licenseStatus,
    };

    // 2. Se o Plano de Controle recusar por licença revogada/expirada ou device revogado
    if (cpResponse.status === 'LICENSE_INVALID') {
      return {
        status: 'LICENSE_INVALID',
        mode: licenseMode,
        ...remoteObservation,
        sourceId: cpResponse.sourceId,
        sourceVersion: cpResponse.sourceVersion,
        protocol: cpResponse.protocol,
        sourceStatus: cpResponse.sourceStatus,
        supportContact: cpResponse.supportContact,
        message: 'A licença deste dispositivo não é mais válida.',
      };
    }

    if (cpResponse.status === 'DEVICE_REVOKED') {
      return {
        status: 'DEVICE_REVOKED',
        mode: licenseMode,
        ...remoteObservation,
        sourceId: cpResponse.sourceId,
        sourceVersion: cpResponse.sourceVersion,
        protocol: cpResponse.protocol,
        sourceStatus: cpResponse.sourceStatus,
        supportContact: cpResponse.supportContact,
        message: 'O acesso deste dispositivo foi revogado pelo gestor.',
      };
    }

    if (cpResponse.status === 'DEVICE_NOT_AUTHORIZED') {
      return {
        status: 'DEVICE_NOT_AUTHORIZED',
        mode: licenseMode,
        ...remoteObservation,
        sourceId: cpResponse.sourceId,
        sourceVersion: cpResponse.sourceVersion,
        protocol: cpResponse.protocol,
        sourceStatus: cpResponse.sourceStatus,
        supportContact: cpResponse.supportContact,
        message: 'Dispositivo aguardando autorização.',
      };
    }

    // 2.1 Se a fonte estiver desvinculada ou desativada
    if (
      cpResponse.status === 'SOURCE_NOT_BOUND' ||
      cpResponse.sourceStatus === 'DISABLED'
    ) {
      return {
        status: 'SOURCE_NOT_BOUND',
        mode: cpResponse.mode,
        ...remoteObservation,
        sourceId: cpResponse.sourceId,
        sourceVersion: cpResponse.sourceVersion,
        protocol: cpResponse.protocol,
        sourceStatus: cpResponse.sourceStatus,
        supportContact: cpResponse.supportContact,
        message: 'Dispositivo autorizado. Nenhuma fonte foi vinculada ainda pelo gestor.',
      };
    }

    // 2.2 Se a autoridade remota indicou SOURCE_READY com fonte vinculada
    if (cpResponse.status === 'SOURCE_READY' && cpResponse.sourceId) {
      return {
        status: 'SOURCE_READY',
        mode: cpResponse.mode,
        ...remoteObservation,
        sourceId: cpResponse.sourceId,
        sourceVersion: cpResponse.sourceVersion,
        protocol: cpResponse.protocol,
        sourceStatus: cpResponse.sourceStatus,
        supportContact: cpResponse.supportContact,
        message: cpResponse.message || 'Fonte autorizada pronta para consumo.',
      };
    }

    // 3. Resolução no modo SELF_SERVICE sem fonte vinculada: configuração manual local
    if (cpResponse.mode === 'SELF_SERVICE') {
      const localConfig = await localConfigLoader();
      if (!localConfig || (!localConfig.host && !localConfig.playlistUrl)) {
        return {
          status: 'SOURCE_ACTION_REQUIRED',
          mode: 'SELF_SERVICE',
          ...remoteObservation,
          supportContact: cpResponse.supportContact,
          message: 'Dispositivo autorizado. Configure sua fonte IPTV local para iniciar.',
        };
      }

      return {
        status: 'SOURCE_READY',
        mode: 'SELF_SERVICE',
        ...remoteObservation,
        sourceId: cpResponse.sourceId,
        sourceVersion: cpResponse.sourceVersion,
        protocol: cpResponse.protocol,
        sourceStatus: cpResponse.sourceStatus,
        config: localConfig,
        supportContact: cpResponse.supportContact,
        message: 'Fonte configurada localmente e pronta para uso.',
      };
    }

    // 4. Resolução no modo MANAGED: somente metadata da autoridade remota.
    if (cpResponse.mode === 'MANAGED') {
      return {
        status: 'SOURCE_ACTION_REQUIRED',
        mode: 'MANAGED',
        ...remoteObservation,
        sourceId: cpResponse.sourceId,
        sourceVersion: cpResponse.sourceVersion,
        protocol: cpResponse.protocol,
        sourceStatus: cpResponse.sourceStatus,
        supportContact: cpResponse.supportContact,
        message: 'Autorizacao remota valida; a configuracao local segura ainda nao foi provisionada neste ciclo.',
      };
    }

    return {
      status: 'DEVICE_NOT_AUTHORIZED',
      ...remoteObservation,
      message: 'Status de autorização não reconhecido.',
    };
  }
}
