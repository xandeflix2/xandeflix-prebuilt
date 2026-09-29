/**
 * R2F8R — reativação segura do mesmo device autorizado.
 *
 * O device gera o token bruto localmente. O plano remoto recebe somente o
 * hash e só altera o token depois de uma aprovação explícita do Manager.
 */

import type { DeviceType } from '../device/device.types.ts';

export type AuthorizedDeviceReactivationResultCode =
  | 'REQUEST_CREATED'
  | 'REQUEST_ALREADY_PENDING'
  | 'REQUEST_APPROVED'
  | 'REQUEST_CANCELLED'
  | 'REQUEST_ALREADY_CANCELLED'
  | 'AUTHORIZED_DEVICE_REACTIVATED'
  | 'INVALID_DEVICE_ID'
  | 'INVALID_DEVICE_METADATA'
  | 'TOKEN_HASH_INVALID'
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_NOT_AUTHORIZED'
  | 'LICENSE_INVALID'
  | 'LICENSE_MODE_INVALID'
  | 'SOURCE_BINDING_INVALID'
  | 'SOURCE_INVALID'
  | 'REQUEST_NOT_FOUND'
  | 'REQUEST_EXPIRED'
  | 'REQUEST_NOT_APPROVED'
  | 'REQUEST_ALREADY_CONSUMED'
  | 'REQUEST_ALREADY_TERMINAL'
  | 'REQUEST_DEVICE_MISMATCH'
  | 'MANAGER_AUTH_REQUIRED'
  | 'MANAGER_NOT_AUTHORIZED'
  | 'LOCAL_PERSISTENCE_FAILED_REMOTE_AUTHORIZED'
  | 'PENDING_HANDLE_PERSISTENCE_FAILED'
  | 'PENDING_HANDLE_CLEAR_FAILED_REMOTE_AUTHORIZED'
  | 'REMOTE_REACTIVATION_UNAVAILABLE';

export interface AuthorizedDeviceReactivationRequest {
  deviceId: string;
  newDeviceTokenHash: string;
  displayCode: string;
  deviceType: DeviceType;
  deviceLabel: string;
}

export interface AuthorizedDeviceReactivationPending {
  success: boolean;
  resultCode: AuthorizedDeviceReactivationResultCode;
  requestId?: string;
  deviceId?: string;
  deviceStatus?: 'AUTHORIZED';
  licenseStatus?: 'ACTIVE';
  licenseMode?: 'MANAGED';
  sourceId?: string;
  sourceVersion?: number;
  sourceStatus?: 'ACTIVE';
  bindingStatus?: 'ACTIVE';
  netDeviceSlotDelta?: 0;
  licenseRecreated?: false;
  licenseChanged?: false;
  sourceBindingChanged?: false;
  message?: string;
}

export interface AuthorizedDeviceReactivationFinalizeRequest {
  requestId: string;
  deviceId: string;
}

export interface AuthorizedDeviceReactivationConfirmation {
  success: boolean;
  resultCode: AuthorizedDeviceReactivationResultCode;
  deviceId?: string;
  deviceStatus?: 'AUTHORIZED';
  licenseStatus?: 'ACTIVE';
  licenseMode?: 'MANAGED';
  sourceId?: string;
  sourceVersion?: number;
  sourceStatus?: 'ACTIVE';
  bindingStatus?: 'ACTIVE';
  netDeviceSlotDelta?: 0;
  licenseRecreated?: false;
  licenseChanged?: false;
  sourceBindingChanged?: false;
  message?: string;
}

export interface AuthorizedDeviceReactivationHandle {
  requestId: string;
  deviceId: string;
  rawDeviceToken: string;
  displayCode: string;
  deviceType: DeviceType;
  deviceLabel: string;
  createdAtIso: string;
  expiresAtIso: string;
}

export interface ManagerDeviceReactivationRequest {
  requestId: string;
  deviceId: string;
  displayCode: string;
  deviceType: DeviceType;
  deviceLabel: string;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED' | 'CONSUMED' | 'EXPIRED';
  createdAtIso: string;
  expiresAtIso: string;
}
