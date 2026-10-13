import type { DeviceSourceBindingEntity, ManagerCustomerSourceListItem, ManagerLicenseListItem, ManagerLicenseDetailDeviceItem } from '../../control-plane/control-plane.types.ts';

export function summarizeLicenseDevices(licenses: ManagerLicenseListItem[], bindings?: DeviceSourceBindingEntity[], sources?: ManagerCustomerSourceListItem[]) {
  const devices = new Map<string, ManagerLicenseDetailDeviceItem>();
  const customerDevices = new Map<string, Set<string>>();
  const groups = new Map<string, Set<string>>();
  const deviceSources = new Map<string, Set<string>>();
  const addSource = (deviceId: string, sourceId: string) => {
    const members = groups.get(sourceId) || new Set<string>(); members.add(deviceId); groups.set(sourceId, members);
    const refs = deviceSources.get(deviceId) || new Set<string>(); refs.add(sourceId); deviceSources.set(deviceId, refs);
  };
  for (const license of licenses) {
    const owner = license.customerId || license.licenseId;
    const members = customerDevices.get(owner) || new Set<string>();
    for (const device of license.devices || []) { devices.set(device.deviceId, device); members.add(device.deviceId); }
    customerDevices.set(owner, members);
    if (license.mode === 'SELF_SERVICE') for (const source of sources || []) if (source.licenseId === license.licenseId && source.status === 'ACTIVE') {
      for (const device of license.devices || []) addSource(device.deviceId, 'customer:' + source.sourceId);
    }
  }
  for (const binding of bindings || []) if (devices.has(binding.deviceId)) addSource(binding.deviceId, 'managed:' + binding.sourceId);
  const peers = new Map<string, ManagerLicenseDetailDeviceItem[]>();
  for (const [deviceId, refs] of deviceSources) {
    const ids = new Set<string>(); for (const ref of refs) for (const id of groups.get(ref) || []) if (id !== deviceId) ids.add(id);
    peers.set(deviceId, [...ids].map(id => devices.get(id)!).filter(Boolean));
  }
  return { customerDevices, peers, sourcesKnown: bindings !== undefined && sources !== undefined };
}
