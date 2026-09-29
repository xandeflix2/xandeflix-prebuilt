/**
 * R2F8Q — contrato sanitizado de substituição atômica de dispositivo.
 *
 * O token bruto nunca pertence a este contrato remoto. O cliente gera o
 * token, calcula o hash e envia somente o hash para a RPC protegida.
 */

import type { DeviceType } from '../device/device.types.ts';

export type DeviceReplacementResultCode =
  | 'DEVICE_REPLACEMENT_READY'
  | 'OLD_DEVICE_NOT_FOUND'
  | 'OLD_DEVICE_REVOKED'
  | 'OLD_DEVICE_NOT_AUTHORIZED'
  | 'NEW_DEVICE_CONFLICT'
  | 'INVALID_DEVICE_ID'
  | 'LICENSE_INVALID'
  | 'LICENSE_MODE_INVALID'
  | 'SOURCE_BINDING_INVALID'
  | 'SOURCE_INVALID'
  | 'MANAGER_NOT_AUTHORIZED'
  | 'TOKEN_HASH_INVALID'
  | 'INVALID_DEVICE_METADATA'
  | 'DEVICE_REPLACEMENT_CONFLICT';

export interface DeviceReplacementRequest {
  oldDeviceId: string;
  newDeviceId: string;
  newDeviceTokenHash: string;
  newDisplayCode: string;
  newDeviceType: DeviceType;
  newDeviceLabel: string;
}

export interface DeviceReplacementConfirmation {
  success: true;
  resultCode: 'DEVICE_REPLACEMENT_READY';
  newDeviceId: string;
  deviceStatus: 'AUTHORIZED';
  licenseStatus: 'ACTIVE';
  sourceId: string;
  sourceVersion: number;
  sourceStatus: 'ACTIVE';
  bindingStatus: 'ACTIVE';
  oldDeviceStatus: 'REVOKED';
  oldBindingStatus: 'REVOKED';
}

