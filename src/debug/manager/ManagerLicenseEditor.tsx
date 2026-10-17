import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ManagerCustomerDeletePreview, ManagerLicenseDetail, ManagerLicenseListItem, ManagerDeviceSensitiveReveal, ManagerLicenseDetailDeviceItem } from '../../control-plane/control-plane.types.ts';
import type { RemoteManagerControlPlaneAuthority, ManagerSourceType, ManagerLicenseDeviceEditInput, ManagerLicenseSaveInput } from '../../control-plane/client/manager-remote-control-plane-authority.ts';
import { ManagerDeviceRegistrationFields } from './ManagerDeviceRegistrationFields.tsx';
import { managerActivationFailure } from './manager-activation-feedback.ts';
import './ManagerLicenseEditor.css';

interface Props {
  license: ManagerLicenseListItem;
  availableLicenses?: ManagerLicenseListItem[];
  authority: RemoteManagerControlPlaneAuthority;
  isMaster: boolean;
  mode: 'EDIT' | 'DELETE' | 'LINK';
  initialPrimaryCode?: string;
  onClose: () => void;
  onUpdated: () => Promise<unknown>;
  onEditPrincipalLicense?: (license: ManagerLicenseListItem) => void;
}

type DeviceDraft = { platform: string; deviceType: string; role: '' | 'PRIMARY' | 'SECONDARY'; principal: string; slot: string; confirmed: boolean; treePlan?: ManagerLicenseDeviceEditInput['treePlan'] };
type EditorBlocker = { message: string; fields: string[] };
function deviceDrafts(detail: ManagerLicenseDetail): Record<string, DeviceDraft> {
  return Object.fromEntries(detail.devices.map(d => [d.deviceId, {
    platform: ['ANDROID', 'IOS', 'TIZEN', 'WEBOS', 'WEB', 'OTHER'].includes(d.platform || '') ? d.platform! : 'OTHER',
    deviceType: d.deviceType, role: d.deviceRole || '',
    principal: d.primaryDisplayCode ? `${detail.license.licenseId}:${d.primaryDisplayCode}` : '',
    slot: d.slotNumber ? String(d.slotNumber) : '', confirmed: false,
  }]));
}

function selectedScreenPrincipal(detail: ManagerLicenseDetail, current: string): string {
  const principals = detail.devices.filter(d => d.status === 'AUTHORIZED' &&
    (!d.licenseBindingStatus || d.licenseBindingStatus === 'ACTIVE') && d.deviceRole === 'PRIMARY');
  return principals.some(d => d.displayCode === current) ? current : principals.length === 1 ? principals[0].displayCode : '';
}

function PrincipalChangeDialog({ device, children, licenses, currentLicenseId, onCancel, onConfirm }: {
  device: ManagerLicenseDetailDeviceItem; children: ManagerLicenseDetailDeviceItem[]; licenses: ManagerLicenseListItem[];
  currentLicenseId: string; onCancel: () => void; onConfirm: (principal: string, slot: string, plan: NonNullable<ManagerLicenseDeviceEditInput['treePlan']>) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [principal, setPrincipal] = useState(''), [slot, setSlot] = useState('');
  const [condition, setCondition] = useState<'MOVE_ALL' | 'KEEP_ACCOUNT'>('MOVE_ALL');
  const [retainedPrincipal, setRetainedPrincipal] = useState(''), [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.showModal();
    return () => previous?.focus();
  }, []);
  const destinationId = principal.split(':')[0], destination = licenses.find(l => l.licenseId === destinationId);
  const retainedRoots = licenses.find(l => l.licenseId === currentLicenseId)?.devices?.filter(d => d.deviceId !== device.deviceId && d.deviceRole === 'PRIMARY' && d.status === 'AUTHORIZED' && d.licenseBindingStatus !== 'REVOKED') || [];
  const movingIds = new Set([device.deviceId, ...(condition === 'MOVE_ALL' ? children.map(d => d.deviceId) : [])]);
  const remainingCount = destination?.devices?.filter(d => d.licenseBindingStatus !== 'REVOKED' && !movingIds.has(d.deviceId)).length || 0;
  const projectedCount = remainingCount + movingIds.size;
  const exceeded = !!destination && projectedCount > destination.maxDevices;
  const occupiedSlots = new Map(destination?.devices?.filter(d => d.licenseBindingStatus !== 'REVOKED' && d.deviceId !== device.deviceId).map(d => [d.slotNumber, d.displayCode]));
  const invalid = !destination || !slot || !confirmed || exceeded || (children.length > 0 && condition === 'KEEP_ACCOUNT' && !retainedPrincipal);
  return <dialog ref={dialog} className="license-editor license-role-change" aria-labelledby="license-role-change-title"
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); } }}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onCancel(); }}>
    <div className="license-editor__header"><h2 id="license-role-change-title">Mudar principal para secundário</h2><button type="button" className="focusable-item" aria-label="Cancelar mudança de principal" onClick={onCancel}>✕</button></div>
    <p><strong>{device.displayCode}</strong> — {device.deviceLabel}. Selecione o novo principal e confira o destino dos aparelhos vinculados.</p>
    <form onSubmit={event => {
      event.preventDefault(); event.stopPropagation();
      if (!invalid) onConfirm(principal, slot, { mode: condition, expectedChildren: children.map(d => d.displayCode).sort(), ...(condition === 'KEEP_ACCOUNT' ? { retainedPrincipalCode: retainedPrincipal } : {}) });
    }}>
      <label>Novo aparelho principal<select className="focusable-item" required value={principal} onChange={event => { setPrincipal(event.target.value); setSlot(''); setConfirmed(false); }}>
        <option value="">Selecione o principal...</option>{licenses.flatMap(l => l.devices?.filter(d => d.deviceId !== device.deviceId && d.deviceRole === 'PRIMARY' && d.status === 'AUTHORIZED' && d.licenseBindingStatus !== 'REVOKED').map(d => <option value={`${l.licenseId}:${d.displayCode}`} key={`${l.licenseId}:${d.deviceId}`}>{d.displayCode} — {l.customerNickname || 'Cliente'} — {d.deviceLabel}</option>) || [])}
      </select></label>
      <h3>Aparelhos vinculados ao principal anterior ({children.length})</h3>
      {children.length ? <ul>{children.map(d => <li key={d.deviceId}><strong>{d.displayCode}</strong> — {d.deviceLabel} — {d.status}</li>)}</ul> : <p>Nenhum secundário vinculado. Somente este aparelho será alterado.</p>}
      {children.length > 0 && <>
        <label>Condição dos aparelhos vinculados<select className="focusable-item" value={condition} onChange={event => { setCondition(event.target.value as 'MOVE_ALL' | 'KEEP_ACCOUNT'); setConfirmed(false); }}>
          <option value="MOVE_ALL">Vincular todos ao novo principal e à sua fonte</option>
          <option value="KEEP_ACCOUNT" disabled={!retainedRoots.length}>Manter na conta atual sob outro principal</option>
        </select></label>
        {condition === 'KEEP_ACCOUNT' && <label>Principal que manterá os aparelhos na conta atual<select className="focusable-item" required value={retainedPrincipal} onChange={event => { setRetainedPrincipal(event.target.value); setConfirmed(false); }}><option value="">Selecione o principal da conta atual...</option>{retainedRoots.map(d => <option key={d.deviceId} value={d.displayCode}>{d.displayCode} — {d.deviceLabel}</option>)}</select></label>}
        {!retainedRoots.length && <p>Para manter os secundários nesta conta, primeiro defina outro aparelho como principal em Editar licença.</p>}
      </>}
      {destination && <p>Conta de destino: <strong>{destination.customerNickname || 'Cliente'}</strong>. Após a mudança: <strong>{projectedCount} de {destination.maxDevices} aparelhos</strong>; {destination.maxConcurrentSessions} telas simultâneas permitidas. {destinationId !== currentLicenseId && 'Os aparelhos transferidos passarão a usar a fonte do novo principal.'}</p>}
      {exceeded && <p role="alert" className="license-editor__error">Não há vagas para todos os aparelhos. Ajuste a quantidade na licença de destino antes de continuar.</p>}
      <label>Slot do aparelho que será secundário<select className="focusable-item" required disabled={!destination} value={slot} onChange={event => { setSlot(event.target.value); setConfirmed(false); }}><option value="">Selecione um slot livre...</option>{Array.from({ length: destination?.maxDevices || 0 }, (_, i) => i + 1).map(n => <option key={n} value={n} disabled={occupiedSlots.has(n)}>Slot {n}{occupiedSlots.has(n) ? ` — ${occupiedSlots.get(n)}` : ' — disponível'}</option>)}</select></label>
      <p>{condition === 'MOVE_ALL' ? 'Todos os secundários listados serão vinculados ao novo principal.' : `Os secundários listados permanecerão na conta atual, sob ${retainedPrincipal || 'o principal a selecionar'}.`} Os slots serão conferidos novamente ao salvar.</p>
      <label className="license-editor__check"><input className="focusable-item" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Confirmo o novo principal e a condição dos aparelhos listados.</label>
      <div className="license-editor__footer"><button type="button" className="focusable-item" onClick={onCancel}>Cancelar</button><button type="submit" className="focusable-item" disabled={invalid}>Confirmar mudança</button></div>
      <p>A confirmação prepara os dados. Clique em Salvar dados do aparelho no formulário para aplicar a mudança.</p>
    </form>
  </dialog>;
}

export function ManagerLicenseEditor({ license, availableLicenses = [], authority, isMaster, mode, initialPrimaryCode = '', onClose, onUpdated, onEditPrincipalLicense }: Props) {
  const dialog = useRef<HTMLDialogElement>(null), alive = useRef(true), guard = useRef(false);
  const fieldPrefix = useId();
  const [detail, setDetail] = useState<ManagerLicenseDetail | null>(null);
  const [preview, setPreview] = useState<ManagerCustomerDeletePreview | null>(null);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [reveal, setReveal] = useState<ManagerDeviceSensitiveReveal['source']>(null);
  const [revealDevice, setRevealDevice] = useState('');
  const [sourceName, setSourceName] = useState(''), [protocol, setProtocol] = useState<ManagerSourceType>('M3U');
  const [url, setUrl] = useState(''), [username, setUsername] = useState(''), [password, setPassword] = useState('');
  const [sourceConfirmed, setSourceConfirmed] = useState(false);
  const [code, setCode] = useState(''), [label, setLabel] = useState('');
  const [deviceConfirmed, setDeviceConfirmed] = useState(false), [confirmation, setConfirmation] = useState('');
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [customerName, setCustomerName] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DeviceDraft>>({});
  const [reviewPayment, setReviewPayment] = useState(false);
  const [roleDialogId, setRoleDialogId] = useState('');
  const registered = true;
  const [primaryCode, setPrimaryCode] = useState(initialPrimaryCode);
  const [deviceRole, setDeviceRole] = useState<'' | 'PRIMARY' | 'SECONDARY'>(mode === 'LINK' ? 'SECONDARY' : '');
  const [maxDevices, setMaxDevices] = useState(String(license.maxDevices));
  const [maxSessions, setMaxSessions] = useState(String(license.maxConcurrentSessions));
  const [screenPrincipal, setScreenPrincipal] = useState(''), [reason, setReason] = useState('');
  const [paidExtra, setPaidExtra] = useState('0'), [paymentReference, setPaymentReference] = useState(''), [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const existingDevices = useMemo(() => {
    const devices = new Map<string, NonNullable<ManagerLicenseListItem['devices']>[number] & { origin: string }>();
    for (const current of availableLicenses) for (const device of current.devices || []) {
      if (device.status !== 'AUTHORIZED' || device.deviceRole === 'PRIMARY') continue;
      const origin = current.customerNickname || 'Cliente sem apelido';
      const previous = devices.get(device.deviceId);
      devices.set(device.deviceId, { ...device, origin: previous ? `${previous.origin}, ${origin}` : origin });
    }
    return [...devices.values()];
  }, [availableLicenses]);
  useEffect(() => {
    alive.current = true;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.showModal();
    let cancelled = false;
    const read = mode === 'DELETE' ? authority.previewCustomerDeletion?.(license.licenseId) : authority.getLicenseDetail?.(license.licenseId);
    if (!read) { setError('Esta operação está indisponível. Atualize o painel.'); setLoading(false); }
    else void read.then(result => {
      if (cancelled) return;
      if ('snapshot' in result) setPreview(result);
      else { setDetail(result); setScreenPrincipal(current => selectedScreenPrincipal(result, current)); setCustomerName(result.customer?.nickname || ''); setDrafts(deviceDrafts(result)); setMaxDevices(String(result.license.maxDevices)); setMaxSessions(String(result.license.maxConcurrentSessions)); setPaidExtra(String(result.screenAllowance?.paidExtraScreens || 0)); setLabels(Object.fromEntries(result.devices.map(d => [d.deviceId, d.deviceLabel]))); }
    }).catch(cause => { if (!cancelled) setError(mode === 'DELETE' ? managerDeletionFailure(cause, true) : 'Não foi possível consultar os vínculos. Verifique sua permissão e tente novamente.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; alive.current = false; previousFocus?.focus(); };
  }, [authority, license.licenseId, mode]);

  async function action(operation: () => Promise<void>, success: string, refresh = true) {
    if (guard.current) return;
    guard.current = true; setBusy(true); setError(''); setMessage('');
    let confirmed = false;
    try {
      await operation();
      confirmed = true;
      if (!alive.current) return;
      setMessage(success);
      if (refresh) {
        setReveal(null);
        const updated = await authority.getLicenseDetail?.(license.licenseId);
        if (alive.current && updated) { setDetail(updated); setScreenPrincipal(current => selectedScreenPrincipal(updated, current)); setCustomerName(updated.customer?.nickname || ''); setDrafts(deviceDrafts(updated)); setMaxDevices(String(updated.license.maxDevices)); setMaxSessions(String(updated.license.maxConcurrentSessions)); setPaidExtra(String(updated.screenAllowance?.paidExtraScreens || 0)); setLabels(Object.fromEntries(updated.devices.map(d => [d.deviceId, d.deviceLabel]))); }
        await onUpdated();
      }
    } catch (cause) {
      if (alive.current) {
        setMessage('');
        setError(confirmed ? 'A alteração foi confirmada, mas a atualização dos vínculos falhou. Feche o modal e atualize o painel para conferir.' : managerActivationFailure(cause));
      }
    } finally { guard.current = false; if (alive.current) setBusy(false); }
  }
  const sources = detail ? detail.license.mode === 'MANAGED' ? detail.managedSources : detail.customerSources : [];
  const occupiedDevices = detail?.devices.filter(d => d.status === 'AUTHORIZED' && (!d.licenseBindingStatus || d.licenseBindingStatus === 'ACTIVE')) || [];
  const transferWithoutLocalPrincipal = !occupiedDevices.some(d => drafts[d.deviceId]?.role === 'PRIMARY' || drafts[d.deviceId]?.treePlan?.mode === 'KEEP_ACCOUNT') && occupiedDevices.some(d => {
    const draft = drafts[d.deviceId];
    const [destinationId, destinationCode] = draft?.principal.split(':') || [];
    return draft?.role === 'SECONDARY' && destinationId && destinationCode && destinationId !== license.licenseId;
  });
  const screenPrincipals = occupiedDevices.filter(d => drafts[d.deviceId]?.role === 'PRIMARY' && (d.deviceRole === 'PRIMARY' || drafts[d.deviceId]?.confirmed));
  const principalOptions = screenPrincipals.map(d => d.displayCode).join(';');
  useEffect(() => {
    const codes = principalOptions ? principalOptions.split(';') : [];
    setScreenPrincipal(current => codes.includes(current) ? current : codes.length === 1 ? codes[0] : '');
  }, [principalOptions]);
  const confirmedExtraScreens = detail?.screenAllowance?.paidExtraScreens || 0;
  useEffect(() => {
    if (!transferWithoutLocalPrincipal || !detail) return;
    setMaxDevices(String(detail.license.maxDevices)); setMaxSessions(String(detail.license.maxConcurrentSessions));
    setReviewPayment(false); setPaidExtra(String(confirmedExtraScreens)); setPaymentReference(''); setPaymentConfirmed(false); setReason('');
  }, [transferWithoutLocalPrincipal, detail, confirmedExtraScreens]);
  const extraScreens = Number(paidExtra);
  const validPaidExtra = Number.isInteger(extraScreens) && extraScreens >= Math.max(1, confirmedExtraScreens) && extraScreens <= 96;
  const automaticPaymentCapacity = !transferWithoutLocalPrincipal && reviewPayment && validPaidExtra;
  const deviceLimit = transferWithoutLocalPrincipal ? detail?.license.maxDevices ?? license.maxDevices : automaticPaymentCapacity ? Math.max(detail?.license.maxDevices ?? license.maxDevices, 4 + extraScreens) : Number(maxDevices);
  const sessionLimit = transferWithoutLocalPrincipal ? detail?.license.maxConcurrentSessions ?? license.maxConcurrentSessions : Number(maxSessions);
  const validDeviceLimit = Number.isInteger(deviceLimit) && deviceLimit >= Math.max(1, occupiedDevices.length) && deviceLimit <= 100;
  const validSessionLimit = Number.isInteger(sessionLimit) && sessionLimit >= 1 && sessionLimit <= 50 && sessionLimit <= deviceLimit;
  const requiresPaymentReview = reviewPayment || deviceLimit > 4 + confirmedExtraScreens;
  const screenBlockers: EditorBlocker[] = [];
  if (!screenPrincipals.some(d => d.displayCode === screenPrincipal)) screenBlockers.push({ message: screenPrincipals.length
    ? 'Selecione o aparelho principal desta conta.' : 'Defina um aparelho como principal em Dispositivos vinculados abaixo.',
    fields: screenPrincipals.length ? ['screenPrincipal'] : occupiedDevices.map(d => `${d.deviceId}-${drafts[d.deviceId]?.role === 'PRIMARY' ? 'confirmed' : 'role'}`) });
  if (!validDeviceLimit) screenBlockers.push({ message: `Informe uma quantidade inteira de aparelhos entre ${Math.max(1, occupiedDevices.length)} e 100, sem retirar vagas dos aparelhos vinculados.`, fields: ['maxDevices'] });
  if (!validSessionLimit) screenBlockers.push({ message: 'Informe uma quantidade inteira de telas simultâneas entre 1 e 50, sem ultrapassar a quantidade permitida de aparelhos.', fields: ['maxSessions'] });
  if (!reason.trim() || reason.length > 200) screenBlockers.push({ message: 'Informe o motivo da alteração.', fields: ['reason'] });
  if (requiresPaymentReview) {
    if (!Number.isInteger(Number(paidExtra)) || Number(paidExtra) < Math.max(1, confirmedExtraScreens, deviceLimit - 4) || Number(paidExtra) > 96)
      screenBlockers.push({ message: `Informe o total de telas adicionais conferidas: pelo menos ${Math.max(1, confirmedExtraScreens, validDeviceLimit ? deviceLimit - 4 : 1)} e no máximo 96.`, fields: ['paidExtra'] });
    if (!/^[A-Za-z0-9 ._/#-]{1,120}$/.test(paymentReference.trim())) screenBlockers.push({ message: 'Informe uma referência válida para a conferência manual, usando letras sem acentos, números, espaços ou . _ / # -.', fields: ['paymentReference'] });
    if (!paymentConfirmed) screenBlockers.push({ message: 'Confirme a conferência manual do pagamento das telas adicionais.', fields: ['paymentConfirmed'] });
  }
  const projectedCount = occupiedDevices.length + (code && !occupiedDevices.some(d => d.displayCode === code) ? 1 : 0);
  const capacityExceeded = registered && !!detail && projectedCount > detail.license.maxDevices;
  const concurrentExceeded = registered && !!detail && detail.license.maxConcurrentSessions > detail.license.maxDevices;
  const editableLicenses = detail ? [...availableLicenses.filter(l => l.licenseId !== detail.license.licenseId), { ...license, ...detail.license, maxDevices: validDeviceLimit ? deviceLimit : detail.license.maxDevices, activeDeviceCount: occupiedDevices.length, devices: detail.devices, customerNickname: detail.customer?.nickname || license.customerNickname }] : availableLicenses;
  function changeDraft(deviceId: string, change: Partial<DeviceDraft>) {
    setDrafts(current => ({ ...current, [deviceId]: { ...current[deviceId], ...change, confirmed: false } }));
  }
  function roleChanged(d: ManagerLicenseDetailDeviceItem, draft: DeviceDraft) {
    return draft.role !== (d.deviceRole || '') || (draft.role === 'SECONDARY' && draft.principal !== `${license.licenseId}:${d.primaryDisplayCode || ''}`);
  }
  const deviceEdits: ManagerLicenseDeviceEditInput[] = [];
  const editorBlockers: EditorBlocker[] = [];
  const customerChanged = !!detail?.customer && customerName.trim() !== detail.customer.nickname;
  const screensChanged = !!detail && !transferWithoutLocalPrincipal && (maxDevices !== String(detail.license.maxDevices) || maxSessions !== String(detail.license.maxConcurrentSessions) || reviewPayment);
  const sourceChanged = !!(sourceName || url || username || password || sourceConfirmed);
  if (customerChanged && (!customerName.trim() || customerName.trim().length > 100 || /[\x00-\x1f\x7f]/.test(customerName))) editorBlockers.push({ message: 'Informe um nome válido para o cliente, com até 100 caracteres.', fields: ['customerName'] });
  if (screensChanged) editorBlockers.push(...screenBlockers);
  for (const d of detail?.devices || []) {
    const draft = drafts[d.deviceId];
    if (!draft) continue;
    const changedRole = roleChanged(d, draft);
    const changed = labels[d.deviceId] !== d.deviceLabel || draft.platform !== (['ANDROID','IOS','TIZEN','WEBOS','WEB','OTHER'].includes(d.platform || '') ? d.platform : 'OTHER') || draft.deviceType !== d.deviceType || changedRole || (draft.role === 'SECONDARY' && draft.slot !== (d.slotNumber ? String(d.slotNumber) : ''));
    if (!changed) continue;
    const [primaryLicenseId, primaryCode] = draft.principal.split(':');
    if (d.status !== 'AUTHORIZED' || d.licenseBindingStatus === 'REVOKED') editorBlockers.push({ message: `${d.displayCode}: só aparelhos autorizados e vinculados podem ser editados.`, fields: [] });
    if (!labels[d.deviceId]?.trim() || labels[d.deviceId].trim().length > 100) editorBlockers.push({ message: `${d.displayCode}: informe o Local/Tipo, com até 100 caracteres.`, fields: [`${d.deviceId}-label`] });
    if (changedRole && !draft.confirmed) editorBlockers.push({ message: `${d.displayCode}: confirme a mudança de classificação e vínculos.`, fields: [`${d.deviceId}-confirmed`] });
    if (draft.role === 'SECONDARY' && (!primaryLicenseId || !primaryCode || !Number.isInteger(Number(draft.slot)) || Number(draft.slot) < 1)) editorBlockers.push({ message: `${d.displayCode}: escolha o principal de destino e um slot livre.`, fields: [
      ...(!primaryLicenseId || !primaryCode ? [`${d.deviceId}-principal`] : []),
      ...(!Number.isInteger(Number(draft.slot)) || Number(draft.slot) < 1 ? [`${d.deviceId}-slot`] : []),
    ] });
    deviceEdits.push({ licenseId: license.licenseId, displayCode: d.displayCode, label: labels[d.deviceId] || '', platform: draft.platform, deviceType: draft.deviceType, expectedRole: d.deviceRole || '', role: draft.role,
      ...(draft.role === 'SECONDARY' ? { primaryLicenseId, primaryCode, slotNumber: Number(draft.slot), treePlan: draft.treePlan } : {}), roleConfirmed: draft.confirmed });
  }
  if (sourceChanged) {
    if (!sourceName.trim() || sourceName.trim().length > 100) editorBlockers.push({ message: 'Informe o nome da nova fonte, com até 100 caracteres.', fields: ['sourceName'] });
    try { if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error(); } catch { editorBlockers.push({ message: 'Informe uma URL válida da nova fonte, iniciando com http:// ou https://.', fields: ['url'] }); }
    if (protocol === 'XTREAM' && (!username.trim() || !password)) editorBlockers.push({ message: 'Informe o usuário e a senha da nova fonte Xtream.', fields: [...(!username.trim() ? ['username'] : []), ...(!password ? ['password'] : [])] });
    if (!sourceConfirmed) editorBlockers.push({ message: 'Confirme a substituição da fonte nos aparelhos desta licença.', fields: ['sourceConfirmed'] });
  }
  const hasEdits = customerChanged || screensChanged || deviceEdits.length > 0 || sourceChanged;
  if (hasEdits && !detail?.editorSnapshot) editorBlockers.push({ message: 'Atualize o painel para carregar a versão atual do editor de licença.', fields: [] });
  function pendingField(name: string) {
    const issues = editorBlockers.flatMap((blocker, index) => blocker.fields.includes(name) ? [`${fieldPrefix}-issue-${index}`] : []);
    return { id: `${fieldPrefix}-${name}`, 'aria-invalid': issues.length ? true : undefined, 'aria-describedby': issues.length ? issues.join(' ') : undefined };
  }
  function pendingCheckClass(name: string) {
    return `license-editor__check${pendingField(name)['aria-invalid'] ? ' license-editor__check--pending' : ''}`;
  }
  function focusPendingField(blocker: EditorBlocker) {
    if (busy) return;
    for (const name of blocker.fields) {
      const field = document.getElementById(`${fieldPrefix}-${name}`);
      if (!(field instanceof HTMLElement) || !dialog.current?.contains(field) || field.matches(':disabled')) continue;
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: 'center', behavior: 'instant' });
      break;
    }
  }
  async function saveAll() {
    if (!detail || !hasEdits || editorBlockers.length || busy) return;
    const input: ManagerLicenseSaveInput = { licenseId: license.licenseId, expectedSnapshot: detail.editorSnapshot!, devices: deviceEdits,
      ...(customerChanged && detail.customer ? { customer: { customerId: detail.customer.customerId, name: customerName.trim(), expectedName: detail.customer.nickname } } : {}),
      ...(screensChanged ? { screens: { principalCode: screenPrincipal, maxDevices: deviceLimit, maxSessions: sessionLimit, reason,
        ...(requiresPaymentReview && paymentConfirmed ? { paidExtraScreens: Number(paidExtra), paymentReference, paymentConfirmed } : {}) } } : {}),
      ...(sourceChanged ? { source: { expectedSources: sources.map(s => ({ sourceId: s.sourceId, version: s.version })).sort((a,b) => a.sourceId.localeCompare(b.sourceId)), name: sourceName, protocol, sourceConfig: protocol === 'M3U' ? { playlistUrl: url } : { endpoint: url, username, password } } } : {}) };
    await action(async () => {
      if (!authority.saveLicenseEdits) throw new Error('Esta operação está indisponível. Atualize o painel.');
      await authority.saveLicenseEdits(input);
      setSourceName(''); setUrl(''); setPassword(''); setUsername(''); setSourceConfirmed(false); setPaymentConfirmed(false); setPaymentReference(''); setReason(''); setReviewPayment(false);
    }, 'Todas as alterações foram salvas. Novos slots ficam disponíveis no submenu Vincular dispositivo.');
  }
  return <dialog ref={dialog} className="license-editor" aria-labelledby="license-editor-title" onCancel={event => {
    event.preventDefault(); if (event.target !== event.currentTarget) return;
    if (!guard.current && !roleDialogId) onClose();
  }}>
    <div className="license-editor__header">
      <h2 id="license-editor-title">{mode === 'DELETE' ? 'Excluir cliente permanentemente' : mode === 'LINK' ? 'Vincular dispositivo cadastrado' : 'Editar licença'}</h2>
      <button type="button" className="focusable-item" aria-label="Fechar" title="Fechar" disabled={busy} onClick={onClose}>✕</button>
    </div>
    <p>Cliente: <strong>{preview?.nickname || detail?.customer?.nickname || license.customerNickname || 'Legado'}</strong></p>
    {loading && <p role="status">Consultando vínculos…</p>}
    {error && <p role="alert" className="license-editor__error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {mode === 'DELETE' && preview && <form onSubmit={event => {
      event.preventDefault();
      if (!isMaster || confirmation !== `EXCLUIR ${preview.nickname}`) return;
      void action(async () => {
        if (!authority.deleteLicenseCustomer) throw new Error('Unavailable');
        await authority.deleteLicenseCustomer(license.licenseId, preview.snapshot, confirmation);
        await onUpdated(); onClose();
      }, '', false);
    }}>
      <p className="license-editor__error">Serão apagados o cliente, todas as suas {preview.licenses.length} licenças, os aparelhos abaixo, chaves, fontes próprias e dados de acesso. Esta ação é irreversível. Fontes compartilhadas com outros clientes e a auditoria serão preservadas.</p>
      <ul>{preview.devices.map(d => <li key={d.deviceId}><strong>{d.displayCode}</strong> — {d.deviceLabel || 'Sem apelido'}</li>)}</ul>
      <label>Digite EXCLUIR {preview.nickname}<input className="focusable-item" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" disabled={busy} /></label>
      <button type="submit" className="focusable-item license-editor__danger" disabled={busy || !isMaster || confirmation !== `EXCLUIR ${preview.nickname}`}>Excluir permanentemente</button>
    </form>}
    {mode !== 'DELETE' && detail && <>
      {mode === 'EDIT' && <form className="license-editor__form" noValidate onSubmit={event => { event.preventDefault(); void saveAll(); }}>
      <section><h3>Dados da licença e do cliente</h3>
        <dl className="license-editor__summary">
          <div><dt>Modo</dt><dd>{detail.license.mode}</dd></div>
          <div><dt>Status</dt><dd>{detail.license.status}</dd></div>
          <div><dt>Criada em</dt><dd>{new Date(detail.license.createdAt).toLocaleString('pt-BR')}</dd></div>
          <div><dt>Aparelhos vinculados à conta</dt><dd>{occupiedDevices.length} de {detail.license.maxDevices}</dd></div>
        </dl>
        <div>
          <label>Cliente<input {...pendingField('customerName')} className="focusable-item" required maxLength={100} disabled={busy || !detail.customer} value={customerName} onChange={event => setCustomerName(event.target.value)} /></label>
          {!detail.customer && <p>Esta licença legada não tem uma conta de cliente associada.</p>}
        </div>
      </section>
      <section><h3>Quantidade de aparelhos e telas simultâneas</h3>
        {transferWithoutLocalPrincipal ? <p role="status">Este aparelho será vinculado como secundário a outra conta. Os slots e as telas simultâneas pertencem à licença do principal de destino. As alterações de quantidade e conferência de pagamento desta conta de origem foram descartadas; aqui será salvo o vínculo do aparelho. Confira o destino e escolha um slot disponível abaixo.</p> : <>
        <p>Vinculados: {occupiedDevices.length} de {detail.license.maxDevices}. A capacidade pertence à conta e só pode ser alterada aqui, escolhendo um aparelho principal.</p>
        <div>
          <label>Aparelho principal<select {...pendingField('screenPrincipal')} required disabled={busy} className="focusable-item" value={screenPrincipal} onChange={event => setScreenPrincipal(event.target.value)}><option value="">Selecione o principal...</option>{screenPrincipals.map(d => <option key={d.deviceId} value={d.displayCode}>{d.displayCode} — {d.deviceLabel}</option>)}</select></label>
          {!occupiedDevices.some(d => d.deviceRole === 'PRIMARY') && <p>Defina ou promova um aparelho como principal abaixo antes de alterar a quantidade.</p>}
          <div className="license-editor__grid"><label>Quantidade permitida de aparelhos<input {...pendingField('maxDevices')} className="focusable-item" required type="number" min={Math.max(1, occupiedDevices.length)} max={100} step={1} disabled={busy} readOnly={reviewPayment} value={automaticPaymentCapacity ? String(deviceLimit) : maxDevices} onChange={event => setMaxDevices(event.target.value)} /></label>
          <label>Telas simultâneas permitidas<input {...pendingField('maxSessions')} className="focusable-item" required type="number" min={1} max={Math.min(50, deviceLimit || 1)} step={1} disabled={busy} value={maxSessions} onChange={event => setMaxSessions(event.target.value)} /></label></div>
          <p>{reviewPayment ? 'A quantidade de aparelhos é calculada pela conferência abaixo: quatro vagas básicas mais o total de telas adicionais pagas, preservando a capacidade atual. Os novos slots só ficam disponíveis após salvar.' : 'Para liberar novos slots, ajuste a quantidade de aparelhos ou registre a conferência de telas adicionais abaixo.'} O limite de telas simultâneas é independente; ajuste-o se os aparelhos também puderem reproduzir ao mesmo tempo.</p>
          {validDeviceLimit && validSessionLimit && <p role="status">Após salvar: {occupiedDevices.length} aparelhos vinculados de {deviceLimit} permitidos; {deviceLimit - occupiedDevices.length} vaga(s) disponível(is). Até {sessionLimit} aparelhos poderão reproduzir ao mesmo tempo.</p>}
          <label>Motivo da alteração<input {...pendingField('reason')} className="focusable-item" required maxLength={200} disabled={busy} value={reason} onChange={event => setReason(event.target.value)} /></label>
          <p>Telas adicionais já conferidas: {detail.screenAllowance?.paidExtraScreens || 0}. Acima de quatro aparelhos, é necessário pagamento adicional por tela.</p>
          <label className="license-editor__check"><input className="focusable-item" type="checkbox" disabled={busy} checked={reviewPayment} onChange={event => { setReviewPayment(event.target.checked); setPaymentConfirmed(false); }} />Registrar nova conferência de telas adicionais</label>
          {requiresPaymentReview && <fieldset disabled={busy}><legend>Conferência manual do pagamento</legend>
            <label>Total de telas adicionais pagas<input {...pendingField('paidExtra')} className="focusable-item" required type="number" min={Math.max(1, detail.screenAllowance?.paidExtraScreens || 0, deviceLimit - 4)} max={96} step={1} value={paidExtra} onChange={event => { setPaidExtra(event.target.value); setPaymentConfirmed(false); }} /></label>
            <p>Informe o total acumulado de telas adicionais desta conta, incluindo as já conferidas: 1 adicional libera 5 slots; 2 adicionais liberam 6. Repetir o mesmo total não cria vagas duplicadas.</p>
            <label>Referência do comprovante<input {...pendingField('paymentReference')} className="focusable-item" required maxLength={120} pattern={'[A-Za-z0-9 ._\\/#\\-]+'} autoComplete="off" value={paymentReference} onChange={event => { setPaymentReference(event.target.value); setPaymentConfirmed(false); }} /></label>
            <p>Informe apenas a referência para auditoria. Preços e cobrança automática ainda não foram definidos.</p>
            <label className={pendingCheckClass('paymentConfirmed')}><input {...pendingField('paymentConfirmed')} className="focusable-item" type="checkbox" checked={paymentConfirmed} onChange={event => setPaymentConfirmed(event.target.checked)} />Conferi o pagamento de todas as telas adicionais informadas.</label>
          </fieldset>}
        </div></>}
      </section>
      <section><h3>Dispositivos vinculados</h3>
        {detail.devices.length === 0 && <p>Nenhum dispositivo vinculado.</p>}
        {detail.devices.map(d => {
          const draft = drafts[d.deviceId];
          if (!draft) return null;
          const [destinationId] = draft.principal.split(':');
          const destination = editableLicenses.find(l => l.licenseId === destinationId);
          const occupiedSlots = new Map(destination?.devices?.filter(other => other.deviceId !== d.deviceId && other.licenseBindingStatus !== 'REVOKED').map(other => [other.slotNumber, other.displayCode]));
          const hasChildren = detail.devices.some(other => other.deviceRole === 'SECONDARY' && other.primaryDisplayCode === d.displayCode);
          const changed = roleChanged(d, draft);
          return <div key={d.deviceId} className="license-editor__device">
          <div className="license-editor__grid">
            <label>Código do dispositivo<input readOnly className="focusable-item" value={d.displayCode} /></label>
            <label>Visto pela última vez<input readOnly className="focusable-item" value={d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString('pt-BR') : 'Não informado'} /></label>
            <label>Status do aparelho<input readOnly className="focusable-item" value={d.status} /></label>
            <label>Local/Tipo<input {...pendingField(`${d.deviceId}-label`)} className="focusable-item" maxLength={100} required value={labels[d.deviceId] || ''} disabled={busy} onChange={event => setLabels(current => ({ ...current, [d.deviceId]: event.target.value }))} /></label>
            <label>Plataforma<select className="focusable-item" required disabled={busy} value={draft.platform} onChange={event => changeDraft(d.deviceId, { platform: event.target.value })}>{['ANDROID', 'IOS', 'TIZEN', 'WEBOS', 'WEB', 'OTHER'].map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Tipo do aparelho<select className="focusable-item" required disabled={busy} value={draft.deviceType} onChange={event => changeDraft(d.deviceId, { deviceType: event.target.value })}><option value="TV">TV</option><option value="PHONE">Celular</option><option value="TABLET">Tablet</option><option value="PC">Computador</option><option value="OTHER">Outro</option></select></label>
          </div>
          <p>Plataforma / Tipo: {d.platform || 'Não informada'} / {d.deviceType}. Essa correção atualiza o cadastro do gestor; a interface do aplicativo continua sendo configurada no próprio aparelho.</p>
          <p>Vínculo: {d.deviceRole === 'PRIMARY' ? 'PRINCIPAL' : d.deviceRole === 'SECONDARY' ? 'Secundário de ' + d.primaryDisplayCode : 'Ainda não classificado'}</p>
          <label>Classificação do aparelho<select {...pendingField(`${d.deviceId}-role`)} className="focusable-item" disabled={busy || d.status !== 'AUTHORIZED' || d.licenseBindingStatus === 'REVOKED'} value={draft.role} onChange={event => {
            if (d.deviceRole === 'PRIMARY' && event.target.value === 'SECONDARY') setRoleDialogId(d.deviceId);
            else changeDraft(d.deviceId, { role: event.target.value as DeviceDraft['role'], principal: '', slot: '', treePlan: undefined });
          }}>
            {!d.deviceRole && <option value="">Ainda não classificado</option>}<option value="PRIMARY">PRINCIPAL</option><option value="SECONDARY">SECUNDÁRIO</option>
          </select></label>
          {draft.role === 'SECONDARY' && <>
            {d.deviceRole === 'PRIMARY' && <button type="button" className="focusable-item" disabled={busy} onClick={() => setRoleDialogId(d.deviceId)}>Rever mudança de principal e vínculos</button>}
            <label>Principal de destino<select {...pendingField(`${d.deviceId}-principal`)} className="focusable-item" required disabled={busy || d.deviceRole === 'PRIMARY'} value={draft.principal} onChange={event => changeDraft(d.deviceId, { principal: event.target.value, slot: '' })}>
              <option value="">Selecione o principal...</option>{editableLicenses.flatMap(l => l.devices?.filter(other => other.deviceId !== d.deviceId && other.deviceRole === 'PRIMARY' && other.status === 'AUTHORIZED' && other.licenseBindingStatus !== 'REVOKED').map(other => <option key={`${l.licenseId}:${other.deviceId}`} value={`${l.licenseId}:${other.displayCode}`}>{other.displayCode} — {l.customerNickname || 'Cliente'} — {other.deviceLabel}</option>) || [])}
            </select></label>
            {destination && <p>Destino: {destination.customerNickname || 'Cliente'} · {destination.activeDeviceCount} de {destination.maxDevices} aparelhos · {destination.maxConcurrentSessions} telas simultâneas. {destinationId !== license.licenseId && 'O aparelho passará a usar a conta e a fonte desse principal.'}</p>}
            {destination && destinationId !== license.licenseId && onEditPrincipalLicense && <div>
              <p>A capacidade de destino pertence à licença deste principal. A conferência nesta conta não cria slots em outra licença. Abrir a licença do principal descarta as alterações ainda não salvas deste formulário; depois de salvar a capacidade, use Vincular dispositivo.</p>
              <button type="button" className="focusable-item" disabled={busy} onClick={() => onEditPrincipalLicense(destination)}>Editar capacidade do principal</button>
            </div>}
            <label>Slots (Disp.) — slot do secundário<select {...pendingField(`${d.deviceId}-slot`)} className="focusable-item" required disabled={busy || !destination} value={draft.slot} onChange={event => changeDraft(d.deviceId, { slot: event.target.value })}>
              <option value="">Selecione um slot livre...</option>{Array.from({ length: destination?.maxDevices || 0 }, (_, i) => i + 1).map(slot => <option key={slot} value={slot} disabled={occupiedSlots.has(slot)}>Slot {slot}{occupiedSlots.has(slot) ? ` — ${occupiedSlots.get(slot)}` : ' — disponível'}</option>)}
            </select></label>
            {hasChildren && <p>{draft.treePlan?.mode === 'MOVE_ALL' ? 'Os secundários serão transferidos para o novo principal e sua fonte.' : `Os secundários ficarão na conta atual sob ${draft.treePlan?.retainedPrincipalCode || 'um principal a selecionar'}.`}</p>}
          </>}
          {draft.role !== 'SECONDARY' && <p>Slots (Disp.): {d.slotNumber ? `Slot ${d.slotNumber} — ${d.displayCode}` : 'Será atribuído ao salvar o cadastro.'} · capacidade {detail.license.maxDevices}.</p>}
          <dl><dt>Vínculo / Mesma fonte</dt><dd>{d.sourceLinks === undefined ? 'Atualize o painel para consultar a fonte deste aparelho.' : d.sourceLinks.length ? d.sourceLinks.map(s => <div key={s.sourceId}>{d.deviceRole === 'PRIMARY' ? 'PRINCIPAL · ' : ''}{s.name} · {s.sourceId}<br />Aparelhos vinculados à mesma fonte: {s.deviceCount}</div>) : 'Nenhuma fonte vinculada.'}</dd></dl>
          {changed && <label className={pendingCheckClass(`${d.deviceId}-confirmed`)}><input {...pendingField(`${d.deviceId}-confirmed`)} type="checkbox" className="focusable-item" disabled={busy} checked={draft.confirmed} onChange={event => setDrafts(current => ({ ...current, [d.deviceId]: { ...current[d.deviceId], confirmed: event.target.checked } }))} />Confirmo a mudança para {draft.role === 'PRIMARY' ? 'principal da mesma conta' : 'secundário do principal escolhido'} e os vínculos indicados.</label>}
        </div>;
        })}
      </section>
      <section><h3>Fonte da licença</h3>
        {sources.length === 0 ? <p>Nenhuma fonte vinculada.</p> : <ul>{sources.map(s => <li key={s.sourceId}>{'name' in s ? s.name : s.displayName} · {s.sourceType} · v{s.version} · {s.status}</li>)}</ul>}
        {isMaster && detail.devices.length > 1 && <label>Fonte do dispositivo<select className="focusable-item" value={revealDevice || detail.devices[0].deviceId} disabled={busy} onChange={event => { setReveal(null); setRevealDevice(event.target.value); }}>{detail.devices.map(d => <option value={d.deviceId} key={d.deviceId}>{d.displayCode} — {d.deviceLabel}</option>)}</select></label>}
        {isMaster && detail.devices.length > 0 && <button type="button" className="focusable-item" disabled={busy} onClick={() => {
          if (reveal) { setReveal(null); return; }
          void action(async () => {
            const data = await authority.revealDeviceSensitiveData(revealDevice || detail.devices[0].deviceId);
            if (alive.current) setReveal(data.source);
          }, '', false);
        }}>{reveal ? 'Ocultar URL e credenciais' : 'Visualizar URL e credenciais da fonte'}</button>}
        {reveal && <dl className="license-editor__secret">{Object.entries(reveal.config ?? {}).filter(([, value]) => typeof value === 'string').map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{String(value)}</dd></div>)}</dl>}
        {!isMaster && <p>A configuração atual é protegida. Você pode informar uma nova fonte para esta licença.</p>}
        <div>
          <h4>Substituir fonte</h4>
          <label>Nome da fonte<input {...pendingField('sourceName')} className="focusable-item" required maxLength={100} value={sourceName} disabled={busy} onChange={event => setSourceName(event.target.value)} /></label>
          <label>Protocolo<select className="focusable-item" value={protocol} disabled={busy} onChange={event => { setProtocol(event.target.value as ManagerSourceType); setUrl(''); setPassword(''); setUsername(''); }}><option value="M3U">M3U / M3U8</option><option value="XTREAM">Xtream</option></select></label>
          <label>{protocol === 'M3U' ? 'URL da fonte M3U/M3U8' : 'Endereço do servidor Xtream'}<input {...pendingField('url')} className="focusable-item" type="url" required value={url} disabled={busy} autoComplete="off" spellCheck={false} onChange={event => setUrl(event.target.value)} /></label>
          {protocol === 'XTREAM' && <><label>Usuário<input {...pendingField('username')} className="focusable-item" required value={username} disabled={busy} autoComplete="off" onChange={event => setUsername(event.target.value)} /></label><label>Senha da fonte<input {...pendingField('password')} className="focusable-item" type="password" required value={password} disabled={busy} autoComplete="new-password" onChange={event => setPassword(event.target.value)} /></label></>}
          <label className={pendingCheckClass('sourceConfirmed')}><input {...pendingField('sourceConfirmed')} className="focusable-item" type="checkbox" checked={sourceConfirmed} disabled={busy} onChange={event => setSourceConfirmed(event.target.checked)} />Confirmo a troca nos aparelhos desta licença.</label>
        </div>
      </section>
      <div className="license-editor__save-summary" role="status">
        <h3>Revisão das alterações</h3><p>{hasEdits ? 'As mudanças abaixo serão aplicadas juntas ao salvar.' : 'Nenhuma alteração pendente.'}</p>
        {hasEdits && <ul>{customerChanged && <li>Nome do cliente.</li>}{screensChanged && <li>Quantidade, simultaneidade e conferência de telas adicionais.</li>}{deviceEdits.map(d => <li key={d.displayCode}>Cadastro e vínculos de {d.displayCode}.</li>)}{sourceChanged && <li>Substituição da fonte da licença.</li>}</ul>}
        {editorBlockers.length > 0 && <div id={`${fieldPrefix}-blockers`} className="license-editor__blockers"><p>Para habilitar o salvamento, selecione uma pendência para acessar o campo:</p><ul>{editorBlockers.map((blocker, i) => <li key={i}>{blocker.fields.length ? <button id={`${fieldPrefix}-issue-${i}`} type="button" className="focusable-item license-editor__pending-link" disabled={busy} onClick={() => focusPendingField(blocker)}>{blocker.message}</button> : <span id={`${fieldPrefix}-issue-${i}`}>{blocker.message}</span>}</li>)}</ul></div>}
      </div>
      <div className="license-editor__save-bar"><button className="focusable-item btn-primary" type="submit" aria-describedby={editorBlockers.length ? `${fieldPrefix}-blockers` : undefined} disabled={busy || !hasEdits || editorBlockers.length > 0}>{busy ? 'Salvando…' : 'Salvar alterações'}</button><p>As alterações só serão aplicadas após salvar.</p></div>
      </form>}
      {mode === 'LINK' && <section><h3>Vincular como secundário</h3><p>Vincule o aparelho escolhido à fonte do principal desta licença. A transferência altera apenas esse aparelho.</p>
        <form onSubmit={event => {
          event.preventDefault(); if (!deviceConfirmed || !deviceRole || capacityExceeded || concurrentExceeded) return;
          void action(async () => {
            if (!authority.linkLicenseDevice) throw new Error('Unavailable');
            await authority.linkLicenseDevice({ licenseId: license.licenseId, displayCode: code, deviceLabel: label, deviceRole,
              primaryDisplayCode: primaryCode || undefined, maxDevices: detail.license.maxDevices, maxConcurrentSessions: detail.license.maxConcurrentSessions, registered });
            setCode(''); setLabel(''); setPrimaryCode(''); setDeviceRole(registered ? 'SECONDARY' : ''); setDeviceConfirmed(false);
          }, 'Dispositivo autorizado e vinculado.');
        }}>
          <label>Aparelho já cadastrado<select className="focusable-item" required disabled={busy} value={code} onChange={event => {
            setCode(event.target.value); const device = existingDevices.find(d => d.displayCode === event.target.value); setLabel(device?.deviceLabel || ''); setPrimaryCode(initialPrimaryCode); setDeviceConfirmed(false);
          }}><option value="">Selecione o aparelho...</option>{existingDevices.map(d => <option key={d.deviceId} value={d.displayCode}>{d.displayCode} — {d.deviceLabel || 'Local não informado'} — {d.origin}</option>)}</select></label>
          <ManagerDeviceRegistrationFields label={label} onLabel={value => { setLabel(value); setDeviceConfirmed(false); }} maxDevices={registered ? String(detail.license.maxDevices) : maxDevices} onMaxDevices={value => { setMaxDevices(value); setDeviceConfirmed(false); }} maxSessions={registered ? String(detail.license.maxConcurrentSessions) : maxSessions} onMaxSessions={value => { setMaxSessions(value); setDeviceConfirmed(false); }}
            deviceRole={deviceRole} onDeviceRole={value => { setDeviceRole(value); setPrimaryCode(initialPrimaryCode); setDeviceConfirmed(false); }} secondaryOnly={registered} readOnlyLimits={registered} disabled={busy} />
          {registered && <div role="status"><p>Aparelhos vinculados: <strong>{occupiedDevices.length} de {detail.license.maxDevices}</strong>. Limite simultâneo: <strong>{detail.license.maxConcurrentSessions}</strong>.{code && <> Após o vínculo: <strong>{projectedCount} aparelhos</strong>.</>}</p>
            <p>{occupiedDevices.map(d => d.displayCode).join(' · ') || 'Nenhum aparelho vinculado.'}</p>
            {capacityExceeded && <p className="license-editor__error">A licença do principal já atingiu o limite de aparelhos. Acesse Licenças → Editar licença para ajustar a capacidade antes de vincular.</p>}
            {concurrentExceeded && <p className="license-editor__error">O limite simultâneo excede a quantidade contratada. Corrija os limites na aba Licenças antes de vincular.</p>}
            <p>O plano pago e o valor por tela adicional ainda não foram definidos. Nenhuma cobrança é realizada aqui.</p>
          </div>}
          {deviceRole === 'SECONDARY' && <label>Aparelho principal de destino<select className="focusable-item" required disabled={busy} value={primaryCode} onChange={event => { setPrimaryCode(event.target.value); setDeviceConfirmed(false); }}>
            <option value="">Selecione o principal desta licença...</option>{detail.devices.filter(d => d.status === 'AUTHORIZED' && (!d.licenseBindingStatus || d.licenseBindingStatus === 'ACTIVE') && d.deviceRole === 'PRIMARY' && d.displayCode !== code).map(d => <option key={d.deviceId} value={d.displayCode}>{d.displayCode} — {d.deviceLabel || 'Local não informado'}</option>)}
          </select></label>}
          {registered && code && <p role="status">Origem: {existingDevices.find(d => d.displayCode === code)?.origin}. Destino: {license.customerNickname || 'Cliente desta licença'}{primaryCode ? `, principal ${primaryCode}` : ', selecione o principal acima'}. O aparelho usará a fonte do principal e deixará de estar vinculado às licenças anteriores. Código e chave serão preservados.</p>}
          <label className="license-editor__check"><input className="focusable-item" type="checkbox" checked={deviceConfirmed} disabled={busy} onChange={event => setDeviceConfirmed(event.target.checked)} />{registered ? 'Confirmo a transferência deste aparelho para o principal e a fonte escolhidos.' : 'Autorizo este aparelho adicional a usar a fonte desta licença.'}</label>
          <button type="submit" className="focusable-item btn-primary" disabled={busy || !deviceConfirmed || capacityExceeded || concurrentExceeded}>Vincular dispositivo</button>
        </form>
      </section>}
    </>}
    <div className="license-editor__footer"><button type="button" className="focusable-item btn-secondary" disabled={busy} onClick={onClose}>Fechar</button></div>
    {detail && roleDialogId && detail.devices.some(d => d.deviceId === roleDialogId) && <PrincipalChangeDialog
      device={detail.devices.find(d => d.deviceId === roleDialogId)!} children={detail.devices.filter(d => d.deviceRole === 'SECONDARY' && d.primaryDisplayCode === detail.devices.find(d => d.deviceId === roleDialogId)!.displayCode)}
      licenses={editableLicenses} currentLicenseId={license.licenseId} onCancel={() => setRoleDialogId('')}
      onConfirm={(principal, slot, treePlan) => { setDrafts(current => ({ ...current, [roleDialogId]: { ...current[roleDialogId], role: 'SECONDARY', principal, slot, treePlan, confirmed: true } })); setRoleDialogId(''); }} />}
  </dialog>;
}


/** Closed messages only: never render an arbitrary RPC rejection or source secret. */
export function managerDeletionFailure(cause: unknown, preview = false): string {
  const code = cause instanceof Error ? cause.message : '';
  const messages: Record<string, string> = {
    MASTER_REQUIRED: 'Somente um gestor MASTER pode realizar esta exclusão.',
    MANAGER_AUTH_REQUIRED: 'Sua sessão expirou. Entre novamente no painel para excluir.',
    AUTH_REQUIRED: 'Sua sessão expirou. Entre novamente no painel para excluir.',
    MANAGER_NOT_AUTHORIZED: 'Sua conta não tem autorização ativa para esta exclusão.',
    MANAGER_SCOPE_DENIED: 'Sua conta não tem permissão para excluir este registro.',
    CUSTOMER_SHARED_IDENTITY: 'A conta possui uma identidade administrativa ou compartilhada e não pode ser excluída por este fluxo. Para remover só o aparelho, use a exclusão individual do dispositivo.',
    CROSS_CUSTOMER_BINDING_DENIED: 'Há aparelhos vinculados a outras contas. Revise os vínculos antes de excluir o cliente inteiro. A exclusão individual do dispositivo é uma operação separada.',
    CUSTOMER_ID_REQUIRED: 'Esta licença não está associada a um cliente. Use a exclusão individual do dispositivo.',
    LICENSE_NOT_FOUND: 'A licença não foi encontrada. Atualize o painel antes de continuar.',
    INVALID_DEVICE_ID: 'O dispositivo não foi encontrado. Atualize o painel antes de continuar.',
    DEVICE_DELETE_CONFIRMATION_REQUIRED: 'Digite o código do dispositivo para confirmar a exclusão.',
    CUSTOMER_DELETE_CONFIRMATION_REQUIRED: 'Os vínculos ou a confirmação mudaram. Feche esta janela e consulte novamente antes de excluir.',
    PRIMARY_HAS_SECONDARIES: 'Este dispositivo é principal de outros aparelhos. Transfira os secundários antes de excluir o principal.',
  };
  return (Object.hasOwn(messages, code) ? messages[code] : '') || (preview
    ? 'Não foi possível consultar os vínculos do cliente. Atualize o painel e tente novamente. Para remover somente um aparelho, use a exclusão individual do dispositivo.'
    : 'Não foi possível confirmar a exclusão do dispositivo. Atualize o painel e confira o registro antes de tentar novamente.');
}

interface DeviceDeleteDialogProps {
  license: ManagerLicenseListItem;
  device: ManagerLicenseDetailDeviceItem;
  authority: RemoteManagerControlPlaneAuthority;
  isMaster: boolean;
  onClose: () => void;
  onUpdated: () => Promise<unknown>;
  onDeleteCustomer?: () => void;
}

/** Deletes exactly one device through the existing MASTER RPC, never its customer account. */
export function ManagerDeviceDeleteDialog({ license, device, authority, isMaster, onClose, onUpdated, onDeleteCustomer }: DeviceDeleteDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null), guard = useRef(false), alive = useRef(false);
  const heading = useId();
  const [confirmation, setConfirmation] = useState(''), [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const normalized = confirmation.trim().toUpperCase();
  const validCode = /^XF-[A-Z0-9-]{4,40}$/.test(device.displayCode);
  const secondaryCount = (license.devices || []).filter(item => item.deviceRole === 'SECONDARY' && item.primaryDisplayCode === device.displayCode && item.deviceId !== device.deviceId).length;
  useEffect(() => {
    alive.current = true;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (isMaster) dialog.current?.showModal();
    return () => { alive.current = false; previous?.focus(); };
  }, [device.deviceId, isMaster]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isMaster || guard.current || deleted || secondaryCount > 0 || !validCode || normalized !== device.displayCode || !authority.deleteDevicePermanently) return;
    guard.current = true; setBusy(true); setError('');
    try {
      await authority.deleteDevicePermanently(device.deviceId, normalized);
      if (!alive.current) return;
      setDeleted(true);
      setMessage('Exclusão do dispositivo confirmada.');
      try { await onUpdated(); }
      catch { if (alive.current) setMessage('Exclusão do dispositivo confirmada, mas a lista não pôde ser atualizada. Feche esta janela e atualize o painel.'); }
    } catch (cause) { if (alive.current) setError(managerDeletionFailure(cause)); }
    finally { guard.current = false; if (alive.current) setBusy(false); }
  }
  if (!isMaster) return null;
  return <dialog ref={dialog} className="license-editor" aria-labelledby={heading} onCancel={event => { event.preventDefault(); if (!guard.current) onClose(); }}>
    <div className="license-editor__header"><h2 id={heading}>Excluir dispositivo permanentemente</h2><button type="button" className="focusable-item" aria-label="Fechar exclusão do dispositivo" disabled={busy} onClick={onClose}>✕</button></div>
    <p><strong>{device.displayCode}</strong> — {device.deviceLabel || 'Sem apelido'}</p>
    {error && <p role="alert" className="license-editor__error">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!deleted && <form onSubmit={event => { void submit(event); }}>
      <p>A exclusão é permanente: este aparelho perderá a autorização e a chave cadastrada será removida. A conta do cliente, a licença e as fontes serão mantidas.</p>
      {secondaryCount > 0 && <p role="alert" className="license-editor__error">Este aparelho tem {secondaryCount} secundário(s). Transfira os secundários antes de excluir o principal.</p>}
      <label>Digite {device.displayCode} para confirmar<input className="focusable-item" aria-label="Código do dispositivo para excluir" value={confirmation} disabled={busy} autoComplete="off" spellCheck={false} onChange={event => setConfirmation(event.target.value)} /></label>
      <button type="submit" className="focusable-item license-editor__danger" disabled={busy || secondaryCount > 0 || !validCode || normalized !== device.displayCode || !authority.deleteDevicePermanently}>{busy ? 'Excluindo…' : 'Excluir somente este dispositivo'}</button>
    </form>}
    {!deleted && onDeleteCustomer && <section><p>Para remover o cliente inteiro, consulte primeiro todas as licenças e aparelhos afetados.</p><button type="button" className="focusable-item" disabled={busy} onClick={onDeleteCustomer}>Excluir cliente e todos os dispositivos…</button></section>}
    <div className="license-editor__footer"><button type="button" className="focusable-item" disabled={busy} onClick={onClose}>{deleted ? 'Fechar' : 'Cancelar'}</button></div>
  </dialog>;
}
