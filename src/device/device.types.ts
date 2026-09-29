/**
 * Xandeflix Prebuilt — Device Identity & Activation Types (Experiment R7B)
 *
 * Contratos de identificação do dispositivo e estados de ativação.
 *
 * Princípios:
 * - NO_HARDWARE_FINGERPRINT: Identidade gerada por UUID aleatório, sem MAC/IMEI/ANDROID_ID/SERIAL.
 * - DISPLAY_CODE: Código amigável e legível para comunicação do usuário com o gestor (ex: XF-7K29-PQ41).
 * - APP_PRIVATE_LOCAL_ONLY: Identificador e token persistidos estritamente no sandbox privado.
 */

export type DeviceType = 'TV' | 'PHONE' | 'TABLET' | 'PC' | 'OTHER';

export type ActivationStatus =
  | 'UNREGISTERED'
  | 'PENDING_MANAGER_APPROVAL'
  | 'AUTHORIZED'
  | 'LICENSE_ALREADY_BOUND'
  | 'DEVICE_LIMIT_REACHED'
  | 'DEVICE_REVOKED'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_INVALID';

export type LicenseMode = 'SELF_SERVICE' | 'MANAGED';

export type StoredLicenseStatus = 'TRIAL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'SUSPENDED';

export interface DeviceIdentity {
  deviceId: string;
  displayCode: string;
  deviceType: DeviceType;
  deviceLabel: string;
  createdAtIso: string;
}

export interface StoredActivationState {
  deviceId: string;
  displayCode: string;
  deviceType: DeviceType;
  deviceLabel: string;
  licenseKeyMasked?: string;
  licenseId?: string;
  licenseMode?: LicenseMode;
  licenseStatus?: StoredLicenseStatus;
  status: ActivationStatus;
  deviceAuthToken?: string;
  activatedAtIso?: string;
  lastVerifiedAtIso?: string;
}

export interface InstallationIdentity {
  installationId: string;
  createdAtIso: string;
}
