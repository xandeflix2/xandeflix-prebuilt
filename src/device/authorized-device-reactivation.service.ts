/**
 * R2F8R — recuperação da autenticação local do mesmo device autorizado.
 *
 * O token bruto existe somente nesta instância do cliente e só é persistido
 * depois de a aprovação remota e a rotação do hash terem passado.
 */

import { getControlPlaneClient } from '../control-plane/client/control-plane-client.ts';
import { ControlPlaneCrypto } from '../control-plane/crypto/control-plane-crypto.ts';
import type {
  AuthorizedDeviceReactivationConfirmation,
  AuthorizedDeviceReactivationHandle,
  AuthorizedDeviceReactivationFinalizeRequest,
  AuthorizedDeviceReactivationPending,
  AuthorizedDeviceReactivationRequest,
} from '../control-plane/device-reactivation.types.ts';
import type { DeviceIdentity } from './device.types.ts';
import { DeviceIdentityService } from './device-identity.service.ts';
import {
  PendingDeviceReactivationStore,
  PendingDeviceReactivationStoreError,
} from './pending-device-reactivation.store.ts';

const PENDING_REACTIVATION_TTL_MS = 10 * 60 * 1000;

export interface AuthorizedDeviceReactivationClient {
  requestAuthorizedDeviceReactivation(
    request: AuthorizedDeviceReactivationRequest,
  ): Promise<AuthorizedDeviceReactivationPending>;
  finalizeAuthorizedDeviceReactivation(
    request: AuthorizedDeviceReactivationFinalizeRequest,
  ): Promise<AuthorizedDeviceReactivationConfirmation>;
}

export interface AuthorizedDeviceReactivationRequestResult {
  pending: AuthorizedDeviceReactivationPending;
  handle?: AuthorizedDeviceReactivationHandle;
}

export interface AuthorizedDeviceReactivationResult extends AuthorizedDeviceReactivationConfirmation {
  localActivationPersisted: boolean;
}

function createClientSideToken(): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('REMOTE_REACTIVATION_UNAVAILABLE');
  }

  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return `r2f8r_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export class AuthorizedDeviceReactivationService {
  private readonly client: AuthorizedDeviceReactivationClient;
  private readonly pendingStore: PendingDeviceReactivationStore;
  private readonly persistActivation: (handle: AuthorizedDeviceReactivationHandle) => Promise<boolean>;

  constructor(
    client: AuthorizedDeviceReactivationClient = getControlPlaneClient(),
    pendingStore: PendingDeviceReactivationStore = new PendingDeviceReactivationStore(),
    persistActivation?: (handle: AuthorizedDeviceReactivationHandle) => Promise<boolean>,
  ) {
    this.client = client;
    this.pendingStore = pendingStore;
    this.persistActivation = persistActivation || ((handle) => this.persistLocalActivation(handle));
  }

  async loadPending(identity: DeviceIdentity): Promise<AuthorizedDeviceReactivationHandle | undefined> {
    return this.pendingStore.loadForDevice(identity.deviceId);
  }

  async clearPending(): Promise<void> {
    await this.pendingStore.clear();
  }

  async request(identity: DeviceIdentity): Promise<AuthorizedDeviceReactivationRequestResult> {
    const existingHandle = await this.pendingStore.loadForDevice(identity.deviceId);
    if (existingHandle) {
      return {
        pending: {
          success: true,
          resultCode: 'REQUEST_ALREADY_PENDING',
          requestId: existingHandle.requestId,
          deviceId: existingHandle.deviceId,
        },
        handle: existingHandle,
      };
    }

    const createdAtIso = new Date().toISOString();
    const rawDeviceToken = createClientSideToken();
    const newDeviceTokenHash = await ControlPlaneCrypto.sha256(rawDeviceToken);
    const pending = await this.client.requestAuthorizedDeviceReactivation({
      deviceId: identity.deviceId,
      newDeviceTokenHash,
      displayCode: identity.displayCode,
      deviceType: identity.deviceType,
      deviceLabel: identity.deviceLabel,
    });

    if (!pending.success || !pending.requestId) {
      return { pending };
    }

    const handle: AuthorizedDeviceReactivationHandle = {
      requestId: pending.requestId,
      deviceId: identity.deviceId,
      rawDeviceToken,
      displayCode: identity.displayCode,
      deviceType: identity.deviceType,
      deviceLabel: identity.deviceLabel,
      createdAtIso,
      expiresAtIso: new Date(Date.parse(createdAtIso) + PENDING_REACTIVATION_TTL_MS).toISOString(),
    };

    try {
      await this.pendingStore.save(handle);
      const persisted = await this.pendingStore.loadForDevice(identity.deviceId);
      if (!persisted || persisted.requestId !== handle.requestId) {
        return {
          pending: {
            ...pending,
            success: false,
            resultCode: 'PENDING_HANDLE_PERSISTENCE_FAILED',
          },
        };
      }
      return { pending, handle: persisted };
    } catch {
      return {
        pending: {
          ...pending,
          success: false,
          resultCode: 'PENDING_HANDLE_PERSISTENCE_FAILED',
        },
      };
    }
  }

  async finalize(
    handle: AuthorizedDeviceReactivationHandle,
  ): Promise<AuthorizedDeviceReactivationResult> {
    const now = Date.now();
    if (Date.parse(handle.expiresAtIso) <= now) {
      await this.pendingStore.clear();
      return {
        success: false,
        resultCode: 'REQUEST_EXPIRED',
        localActivationPersisted: false,
      };
    }

    const confirmation = await this.client.finalizeAuthorizedDeviceReactivation({
      requestId: handle.requestId,
      deviceId: handle.deviceId,
    });

    if (!confirmation.success || confirmation.resultCode !== 'AUTHORIZED_DEVICE_REACTIVATED') {
      return { ...confirmation, localActivationPersisted: false };
    }

    const localActivationPersisted = await this.persistActivation(handle);
    if (!localActivationPersisted) {
      return {
        ...confirmation,
        success: false,
        resultCode: 'LOCAL_PERSISTENCE_FAILED_REMOTE_AUTHORIZED',
        message: 'Autorização remota concluída, mas a persistência local falhou; recuperação determinística disponível nesta sessão.',
        localActivationPersisted: false,
      };
    }

    try {
      await this.pendingStore.clear();
      const remaining = await this.pendingStore.load();
      if (remaining) {
        return {
          ...confirmation,
          success: false,
          resultCode: 'PENDING_HANDLE_CLEAR_FAILED_REMOTE_AUTHORIZED',
          message: 'AutorizaÃ§Ã£o remota concluÃ­da, mas o handle pendente nÃ£o foi removido.',
          localActivationPersisted: true,
        };
      }
    } catch (error) {
      if (error instanceof PendingDeviceReactivationStoreError) {
        return {
          ...confirmation,
          success: false,
          resultCode: 'PENDING_HANDLE_CLEAR_FAILED_REMOTE_AUTHORIZED',
          message: 'AutorizaÃ§Ã£o remota concluÃ­da, mas o handle pendente nÃ£o foi removido.',
          localActivationPersisted: true,
        };
      }
      throw error;
    }

    return { ...confirmation, localActivationPersisted: true };
  }

  async persistAfterRemotePass(
    handle: AuthorizedDeviceReactivationHandle,
  ): Promise<boolean> {
    return this.persistActivation(handle);
  }

  private async persistLocalActivation(
    handle: AuthorizedDeviceReactivationHandle,
  ): Promise<boolean> {
    return DeviceIdentityService.saveActivationStateVerified({
      deviceId: handle.deviceId,
      displayCode: handle.displayCode,
      deviceType: handle.deviceType,
      deviceLabel: handle.deviceLabel,
      licenseMode: 'MANAGED',
      status: 'AUTHORIZED',
      deviceAuthToken: handle.rawDeviceToken,
      activatedAtIso: new Date().toISOString(),
      lastVerifiedAtIso: new Date().toISOString(),
    });
  }
}
