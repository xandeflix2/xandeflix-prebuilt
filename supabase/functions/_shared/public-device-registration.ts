export const REGISTRATION_PLATFORMS = ['ANDROID', 'IOS', 'TIZEN', 'WEBOS', 'WEB', 'OTHER'] as const;
export type RegistrationPlatform = typeof REGISTRATION_PLATFORMS[number];
export interface PublicDeviceRegistration {
  customerFirstName: string;
  deviceLabel: string;
  platform: RegistrationPlatform;
}
export function firstNameOnly(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFC').trim().split(/\s+/u)[0] ?? '' : '';
}
export function validatePublicDeviceRegistration(input: { customerFirstName?: unknown; deviceLabel?: unknown; platform?: unknown }):
  { success: true; value: PublicDeviceRegistration } | { success: false; code: string } {
  const customerFirstName = firstNameOnly(input.customerFirstName);
  if (!customerFirstName || customerFirstName.length > 32 || !/^\p{L}[\p{L}\p{M}'’-]*$/u.test(customerFirstName)) {
    return { success: false, code: 'CUSTOMER_FIRST_NAME_INVALID' };
  }
  const deviceLabel = typeof input.deviceLabel === 'string' ? input.deviceLabel.trim() : '';
  if (!deviceLabel || deviceLabel.length > 100 || /[\u0000-\u001f\u007f<>]/u.test(deviceLabel)) {
    return { success: false, code: 'INVALID_DEVICE_LABEL' };
  }
  if (!REGISTRATION_PLATFORMS.includes(input.platform as RegistrationPlatform)) {
    return { success: false, code: 'INVALID_DEVICE_PLATFORM' };
  }
  return { success: true, value: { customerFirstName, deviceLabel, platform: input.platform as RegistrationPlatform } };
}
