import type { ManagerCustomerDetail } from '../../control-plane/control-plane.types.ts';
import type {
  ManagerControlPlaneSnapshot,
  RemoteManagerControlPlaneAuthority,
} from '../../control-plane/client/manager-remote-control-plane-authority.ts';

export interface ExclusiveSourceTarget {
  customerId: string;
  nickname: string;
  deviceId: string;
  displayCode: string;
  licenseId: string;
}

export type ExclusiveSourceAuthority = Pick<RemoteManagerControlPlaneAuthority,
  'auth' | 'getCustomerDetail' | 'readControlPlane' | 'createManagedSourceWithConfig' | 'switchDeviceSource'>;

class ReplacementError extends Error {}

function validateTarget(target: ExclusiveSourceTarget, detail: ManagerCustomerDetail, snapshot: ManagerControlPlaneSnapshot) {
  const license = detail.licenses.find(item => item.licenseId === target.licenseId);
  const snapshotLicense = snapshot.licenses.find(item => item.id === target.licenseId);
  const customerDevices = detail.devices.filter(item => item.deviceId === target.deviceId);
  const device = snapshot.devices.find(item => item.deviceId === target.deviceId);
  const bindings = snapshot.licenseBindings.filter(item => item.deviceId === target.deviceId && item.status === 'ACTIVE');
  const sources = snapshot.sourceBindings.filter(item => item.deviceId === target.deviceId);
  if (!detail.success || detail.customer.customerId !== target.customerId || detail.customer.status !== 'ACTIVE'
    || !license || license.mode !== 'MANAGED' || license.status !== 'ACTIVE'
    || (license.expiresAt !== null && !(Date.parse(license.expiresAt) > Date.now()))
    || !snapshotLicense || snapshotLicense.mode !== 'MANAGED' || snapshotLicense.status !== 'ACTIVE'
    || (snapshotLicense.expiresAtIso != null && !(Date.parse(snapshotLicense.expiresAtIso) > Date.now()))
    || customerDevices.length !== 1 || customerDevices[0].licenseId !== target.licenseId
    || customerDevices[0].status !== 'AUTHORIZED' || customerDevices[0].displayCode !== target.displayCode
    || !device || device.status !== 'AUTHORIZED' || device.displayCode !== target.displayCode
    || bindings.length !== 1 || bindings[0].licenseId !== target.licenseId
    || sources.length !== 1 || sources[0].licenseId !== target.licenseId) {
    throw new ReplacementError('Cliente, licença ou dispositivo mudou. Inspecione novamente antes de trocar a fonte.');
  }
  return sources[0].sourceId;
}

/** One form instance = one immutable target; retains opaque IDs only, never URLs. */
export function createExclusiveSourceReplacement(authority: ExclusiveSourceAuthority, selectedTarget: ExclusiveSourceTarget) {
  const target = { ...selectedTarget };
  let busy = false;
  let pending: { sourceId: string; previousSourceId: string } | null = null;
  let creationUnconfirmed = false;

  async function preflight() {
    if (!authority.auth || !await authority.auth.getSession() || !authority.getCustomerDetail) {
      throw new ReplacementError('Autentique o gestor para trocar a fonte.');
    }
    const [detail, snapshot] = await Promise.all([
      authority.getCustomerDetail(target.customerId), authority.readControlPlane(),
    ]);
    return { currentSourceId: validateTarget(target, detail, snapshot), snapshot };
  }

  return {
    async apply(input: { name: string; playlistUrl: string; confirmed: boolean }, onPrepared: () => void) {
      if (busy) throw new ReplacementError('A troca deste dispositivo já está em andamento.');
      if (!input.confirmed) throw new ReplacementError('Confirme a troca somente neste dispositivo.');
      if (creationUnconfirmed) throw new ReplacementError('Criação não confirmada. Inspecione a aba Fontes antes de iniciar outra troca.');
      if (!pending) {
        if (!input.name.trim()) throw new ReplacementError('Informe um nome para a nova fonte.');
        try {
          const url = new URL(input.playlistUrl.trim());
          if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
        } catch { throw new ReplacementError('Informe uma URL M3U/M3U8 válida usando http ou https.'); }
      }
      busy = true;
      try {
        let { currentSourceId, snapshot } = await preflight();
        if (!pending) {
          // A lost create response may already have persisted a source: never auto-repeat.
          creationUnconfirmed = true;
          const created = await authority.createManagedSourceWithConfig({
            name: input.name.trim(), protocol: 'M3U', sourceConfig: { playlistUrl: input.playlistUrl.trim() },
          }).catch(() => { throw new ReplacementError('Não foi possível confirmar a criação. Confira a aba Fontes antes de tentar criar outra.'); });
          const sourceId = created.sourceId ?? created.source?.sourceId;
          if (!created.success || !sourceId || !/^src_[a-z0-9]+$/.test(sourceId) || sourceId === currentSourceId) {
            throw new ReplacementError('Criação não confirmada. Inspecione a aba Fontes antes de iniciar outra troca.');
          }
          pending = { sourceId, previousSourceId: currentSourceId };
          creationUnconfirmed = false;
          onPrepared();
          ({ currentSourceId, snapshot } = await preflight());
        }
        const newSource = snapshot.managedSources.find(item => item.sourceId === pending!.sourceId);
        if (!newSource || newSource.status !== 'ACTIVE' || newSource.vaultStatus !== 'CONFIGURED'
          || snapshot.sourceBindings.some(item => item.sourceId === pending!.sourceId && item.deviceId !== target.deviceId)) {
          throw new ReplacementError('A nova fonte não está disponível exclusivamente para este dispositivo. Nenhuma troca foi confirmada.');
        }
        if (currentSourceId !== pending.sourceId) {
          if (currentSourceId !== pending.previousSourceId) {
            throw new ReplacementError('O vínculo mudou durante a troca. Inspecione o dispositivo novamente.');
          }
          const switched = await authority.switchDeviceSource(target.deviceId, pending.sourceId)
            .catch(() => { throw new ReplacementError('Nova fonte criada; vínculo não confirmado. Tente novamente para verificar ou concluir o vínculo, sem recriar a fonte.'); });
          if (!switched.success || switched.newSourceId !== pending.sourceId) {
            throw new ReplacementError('Vínculo não confirmado. Tente novamente para verificar o estado remoto.');
          }
        }
        const verified = await preflight();
        if (verified.currentSourceId !== pending.sourceId) {
          throw new ReplacementError('O servidor ainda não confirmou o novo vínculo. Tente verificar novamente.');
        }
        return { sourceId: pending.sourceId, displayCode: target.displayCode };
      } catch (error) {
        // Only local, fixed messages are displayed; raw SDK errors may contain URLs.
        if (error instanceof ReplacementError) throw error;
        throw new ReplacementError(pending
          ? 'Nova fonte criada; verificação indisponível. Tente novamente sem recriar a fonte.'
          : 'Não foi possível validar a autorização remota. Nenhuma troca foi confirmada.');
      } finally { busy = false; }
    },
    hasPreparedSource: () => pending !== null,
    isCreationUnconfirmed: () => creationUnconfirmed,
  };
}
