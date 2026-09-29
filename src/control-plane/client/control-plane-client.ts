/**
 * Xandeflix Prebuilt — Control Plane Client (Experiment R7B)
 *
 * Cliente de comunicação do dispositivo com o Plano de Controle.
 *
 * Princípios:
 * - CONTROL_PLANE_ONLY: Realiza apenas requisições de ativação e resolução de direitos.
 * - LOCAL_FIRST_LAB: No laboratório, utiliza o ControlPlaneEngine transacional em memória.
 * - NO_DIRECT_SOURCE_FETCH: Proibido conectar ou baixar catálogo através deste cliente.
 */

import type {
  DeviceActivationRequest,
  DeviceActivationResponse,
  RemoteSourceAuthorizationMetadata,
  SourceResolutionRequest,
} from '../control-plane.types.ts';
import type {
  AuthorizedDeviceReactivationConfirmation,
  AuthorizedDeviceReactivationFinalizeRequest,
  AuthorizedDeviceReactivationPending,
  AuthorizedDeviceReactivationRequest,
} from '../device-reactivation.types.ts';
import type { RemoteControlPlaneAuthority } from './remote-control-plane-authority.ts';

export class ControlPlaneClient {
  private engine?: any;
  private remoteAuthority?: RemoteControlPlaneAuthority;

  constructor(
    engine?: any,
    options?: { remoteAuthority?: RemoteControlPlaneAuthority }
  ) {
    this.engine = engine;
    this.remoteAuthority = options?.remoteAuthority;
  }

  /**
   * Envia requisição de ativação do dispositivo para o Plano de Controle.
   */
  async activateDevice(req: DeviceActivationRequest): Promise<DeviceActivationResponse> {
    if (this.remoteAuthority?.activateDevice) {
      return this.remoteAuthority.activateDevice(req);
    }

    // O engine só é permitido quando injetado explicitamente em laboratório.
    if (this.engine) {
      return this.engine.activateDevice(req);
    }

    return {
      success: false,
      status: 'LICENSE_INVALID',
      message: 'Autoridade remota indisponível; ativação bloqueada em fail-closed.',
    };
  }

  /**
   * Solicita a resolução de fonte autorizada para o dispositivo autenticado.
   */
  async resolveSource(req: SourceResolutionRequest): Promise<RemoteSourceAuthorizationMetadata> {
    if (this.remoteAuthority) {
      const response: RemoteSourceAuthorizationMetadata =
        await this.remoteAuthority.resolveAuthorizedDeviceSource(req);
      return response;
    }

    // Compatibilidade exclusiva para testes/lab: não é o caminho default.
    if (this.engine) {
      return this.engine.resolveDeviceSource(req);
    }

    return {
      status: 'DEVICE_NOT_AUTHORIZED',
      message: 'Autoridade remota indisponível; resolução bloqueada em fail-closed.',
    };
  }

  async resolveAuthorizedSource(req: { licenseId?: string; deviceId: string; deviceToken: string }): Promise<RemoteSourceAuthorizationMetadata> {
    return this.resolveSource({
      deviceId: req.deviceId,
      deviceAuthToken: req.deviceToken,
    });
  }

  async requestAuthorizedDeviceReactivation(
    req: AuthorizedDeviceReactivationRequest
  ): Promise<AuthorizedDeviceReactivationPending> {
    if (this.remoteAuthority?.requestAuthorizedDeviceReactivation) {
      return this.remoteAuthority.requestAuthorizedDeviceReactivation(req);
    }

    return {
      success: false,
      resultCode: 'REMOTE_REACTIVATION_UNAVAILABLE',
      message: 'Autoridade remota de reativação indisponível; operação bloqueada em fail-closed.',
    };
  }

  async finalizeAuthorizedDeviceReactivation(
    req: AuthorizedDeviceReactivationFinalizeRequest
  ): Promise<AuthorizedDeviceReactivationConfirmation> {
    if (this.remoteAuthority?.finalizeAuthorizedDeviceReactivation) {
      return this.remoteAuthority.finalizeAuthorizedDeviceReactivation(req);
    }

    return {
      success: false,
      resultCode: 'REMOTE_REACTIVATION_UNAVAILABLE',
      message: 'Autoridade remota de reativação indisponível; operação bloqueada em fail-closed.',
    };
  }

  /**
   * Observacao sanitizada para o preflight do dispositivo. Nao retorna nem
   * inspeciona token; apenas informa se existe uma autoridade injetada.
   */
  hasAuthorizationAuthority(): boolean {
    return Boolean(this.remoteAuthority || this.engine);
  }
}

let clientInstance: ControlPlaneClient | null = null;
let configuredRemoteAuthority: RemoteControlPlaneAuthority | undefined;

/** Configura o transporte remoto usado pelo singleton de produção. */
export function configureRemoteControlPlaneAuthority(
  authority: RemoteControlPlaneAuthority | undefined
): void {
  configuredRemoteAuthority = authority;
  clientInstance = null;
}

export function getControlPlaneClient(): ControlPlaneClient {
  if (!clientInstance) {
    clientInstance = new ControlPlaneClient(undefined, {
      remoteAuthority: configuredRemoteAuthority,
    });
  }
  return clientInstance;
}
