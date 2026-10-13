import { useMemo, useState } from 'react';
import type { ManagerLicenseListItem } from '../../control-plane/control-plane.types.ts';
import type { RemoteManagerControlPlaneAuthority } from '../../control-plane/client/manager-remote-control-plane-authority.ts';
import { ManagerLicenseEditor } from './ManagerLicenseEditor.tsx';

interface Props {
  licenses: ManagerLicenseListItem[];
  authority: RemoteManagerControlPlaneAuthority;
  isMaster: boolean;
  onUpdated: () => Promise<unknown>;
}

export function ManagerDeviceLinkView({ licenses, authority, isMaster, onUpdated }: Props) {
  const [selected, setSelected] = useState('');
  const [opened, setOpened] = useState(false);
  const principals = useMemo(() => licenses.filter(l => l.status === 'ACTIVE' || l.status === 'TRIAL').flatMap(license =>
    (license.devices || []).filter(d => d.status === 'AUTHORIZED' && d.deviceRole === 'PRIMARY' && (!d.licenseBindingStatus || d.licenseBindingStatus === 'ACTIVE'))
      .map(device => ({ license, device, value: `${license.licenseId}:${device.displayCode}` }))), [licenses]);
  const principal = principals.find(item => item.value === selected);
  return <section className="manager-link-view">
    <h2>Vincular dispositivo</h2>
    <p>Escolha o aparelho principal. Depois selecione o aparelho já cadastrado que passará a usar a mesma fonte como secundário.</p>
    <label>Cliente e aparelho principal de destino
      <select className="focusable-item" value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="">Selecione o principal...</option>
        {principals.map(item => <option key={item.value} value={item.value}>{item.license.customerNickname || 'Cliente sem apelido'} — {item.device.displayCode} — {item.device.deviceLabel || 'Local não informado'}</option>)}
      </select>
    </label>
    {principals.length === 0 && <p role="status">Nenhum principal autorizado está disponível. Acesse Licenças → Editar licença e use “Definir como principal” ou “Promover a principal” no aparelho desejado.</p>}
    {principal && <div role="status">
      <p>Cliente: <strong>{principal.license.customerNickname || 'Cliente sem apelido'}</strong>. Principal: <strong>{principal.device.displayCode}</strong>.</p>
      <p>Aparelhos vinculados: <strong>{principal.license.activeDeviceCount} de {principal.license.maxDevices}</strong>. Vagas disponíveis: <strong>{Math.max(0, principal.license.maxDevices - principal.license.activeDeviceCount)}</strong>. Limite simultâneo: <strong>{principal.license.maxConcurrentSessions}</strong>.</p>
      {principal.license.activeDeviceCount >= principal.license.maxDevices && <p>A capacidade está ocupada. Um aparelho de outra licença exige uma vaga livre; ajuste a capacidade em Licenças → Editar licença antes de transferir.</p>}
    </div>}
    <p>O limite simultâneo deve ser menor ou igual à quantidade permitida de aparelhos. Plano pago e preço por tela adicional ainda não definidos.</p>
    <button type="button" className="focusable-item btn-primary" disabled={!principal} onClick={() => setOpened(true)}>Selecionar dispositivo para vincular</button>
    {opened && principal && <ManagerLicenseEditor key={principal.value} mode="LINK" initialPrimaryCode={principal.device.displayCode}
      license={principal.license} availableLicenses={licenses} authority={authority} isMaster={isMaster} onClose={() => setOpened(false)} onUpdated={onUpdated} />}
  </section>;
}
