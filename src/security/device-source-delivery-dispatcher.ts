import type { LicenseMode, StoredActivationState } from '../device/device.types.ts';
import type { LocalSourceProtocol } from './local-secure-source-store.ts';
import {
  ManagedVaultDeviceDeliveryError,
  type ManagedVaultDeviceDeliveryAck,
  type ManagedVaultDeviceDeliveryErrorCode,
} from './managed-vault-device-delivery.service.ts';
import type { ResolveSelfServiceSourceOutcome } from './device-self-service-source-resolver.service.ts';

export interface SourceDeliveryAck {
  deliveryResult: 'STORED';
  sourceId: string;
  sourceVersion: number;
  protocol: LocalSourceProtocol;
  mode: LicenseMode;
}

export type DeviceSourceDeliveryErrorCode =
  | ManagedVaultDeviceDeliveryErrorCode
  | 'SELF_SERVICE_LICENSE_ID_MISSING'
  | 'UNKNOWN_LICENSE_MODE'
  | 'LICENSE_INVALID';

export class DeviceSourceDeliveryError extends Error {
  readonly code: DeviceSourceDeliveryErrorCode;

  constructor(code: DeviceSourceDeliveryErrorCode) {
    super(code);
    this.name = 'DeviceSourceDeliveryError';
    this.code = code;
  }
}

export interface SelfServiceSourceDelivery {
  resolveAndStoreSource(options: {
    deviceId: string;
    deviceToken: string;
    licenseId: string;
  }): Promise<ResolveSelfServiceSourceOutcome>;
}

export interface ManagedSourceDelivery {
  deliver(): Promise<ManagedVaultDeviceDeliveryAck>;
}

export interface DeviceSourceDeliveryDispatcherDependencies {
  selfService: SelfServiceSourceDelivery;
  managed: ManagedSourceDelivery;
}

function mapSelfServiceFailure(outcome: ResolveSelfServiceSourceOutcome): DeviceSourceDeliveryErrorCode {
  const code = outcome.errorCode;
  if (code === 'DEVICE_NOT_AUTHORIZED' || code === 'DEVICE_REVOKED' || code === 'LICENSE_INVALID') {
    return code;
  }
  return 'DELIVERY_REJECTED';
}

export class DeviceSourceDeliveryDispatcher {
  private readonly selfService: SelfServiceSourceDelivery;
  private readonly managed: ManagedSourceDelivery;

  constructor(dependencies: DeviceSourceDeliveryDispatcherDependencies) {
    this.selfService = dependencies.selfService;
    this.managed = dependencies.managed;
  }

  async deliver(activation: StoredActivationState): Promise<SourceDeliveryAck> {
    if (activation.status !== 'AUTHORIZED' || !activation.deviceAuthToken) {
      throw new DeviceSourceDeliveryError('DEVICE_NOT_AUTHORIZED');
    }
    if (activation.licenseStatus === 'REVOKED' || activation.licenseStatus === 'EXPIRED' || activation.licenseStatus === 'SUSPENDED') {
      throw new DeviceSourceDeliveryError('LICENSE_INVALID');
    }

    if (activation.licenseMode === 'SELF_SERVICE') {
      if (!activation.licenseId) {
        throw new DeviceSourceDeliveryError('SELF_SERVICE_LICENSE_ID_MISSING');
      }
      const outcome = await this.selfService.resolveAndStoreSource({
        deviceId: activation.deviceId,
        deviceToken: activation.deviceAuthToken,
        licenseId: activation.licenseId,
      });
      if (!outcome.success || !outcome.sourceId || typeof outcome.sourceVersion !== 'number' || !outcome.protocol) {
        throw new DeviceSourceDeliveryError(mapSelfServiceFailure(outcome));
      }
      return {
        deliveryResult: 'STORED',
        sourceId: outcome.sourceId,
        sourceVersion: outcome.sourceVersion,
        protocol: outcome.protocol,
        mode: 'SELF_SERVICE',
      };
    }

    if (activation.licenseMode === 'MANAGED') {
      try {
        const outcome = await this.managed.deliver();
        return { ...outcome, mode: 'MANAGED' };
      } catch (error) {
        if (error instanceof ManagedVaultDeviceDeliveryError) {
          throw new DeviceSourceDeliveryError(error.code);
        }
        throw new DeviceSourceDeliveryError('DELIVERY_REJECTED');
      }
    }

    throw new DeviceSourceDeliveryError('UNKNOWN_LICENSE_MODE');
  }
}

let configuredDispatcher: DeviceSourceDeliveryDispatcher | undefined;

export function configureDeviceSourceDeliveryDispatcher(
  dispatcher: DeviceSourceDeliveryDispatcher | undefined,
): void {
  configuredDispatcher = dispatcher;
}

export function getDeviceSourceDeliveryDispatcher(): DeviceSourceDeliveryDispatcher | undefined {
  return configuredDispatcher;
}
