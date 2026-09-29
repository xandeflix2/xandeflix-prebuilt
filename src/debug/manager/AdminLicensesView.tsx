/**
 * Xandeflix Prebuilt — C8 Admin Licenses View
 *
 * Visão administrativa de licenças:
 * - Listagem com busca (licenseId, apelido do cliente), filtros por status e modo.
 * - Suporte explícito à licença legada MANAGED (customer_id=NULL).
 * - Inspeção detalhada de vínculos (aparelhos autorizados, fontes vinculadas).
 * - Ajuste de limites (max_devices, max_concurrent_sessions) com enforcement
 *   da política: MAX_DEVICES_REDUCTION_POLICY=REJECT_BELOW_ACTIVE_DEVICE_COUNT.
 * - Ações de suspensão e revogação com modal de confirmação explícita.
 * - ZERO paid activation (C10) e ZERO trial reset (ONE_TRIAL_PER_CUSTOMER).
 */

import React, { useState } from 'react';
import type {
  LicenseMode,
  LicenseStatus,
  ManagerLicenseDetail,
  ManagerLicenseListItem,
} from '../../control-plane/control-plane.types.ts';

interface AdminLicensesViewProps {
  licenses: ManagerLicenseListItem[];
  onInspectLicense: (licenseId: string) => Promise<ManagerLicenseDetail | null>;
  onUpdateLimits: (licenseId: string, maxDevices: number, maxConcurrentSessions: number, reason?: string) => Promise<boolean>;
  onSuspendLicense: (licenseId: string, reason?: string) => Promise<boolean>;
  onRevokeLicense: (licenseId: string, reason?: string) => Promise<boolean>;
  onActivateLicense?: (licenseId: string, reason: string, validUntil?: string | null) => Promise<boolean>;
  loading?: boolean;
}

export const AdminLicensesView: React.FC<AdminLicensesViewProps> = ({
  licenses,
  onInspectLicense,
  onUpdateLimits,
  onSuspendLicense,
  onRevokeLicense,
  onActivateLicense,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LicenseStatus>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | LicenseMode>('ALL');
  const [inspectedLicense, setInspectedLicense] = useState<ManagerLicenseDetail | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Modal de Limites
  const [limitsModalLicense, setLimitsModalLicense] = useState<ManagerLicenseListItem | null>(null);
  const [newMaxDevices, setNewMaxDevices] = useState<number>(1);
  const [newMaxConcurrent, setNewMaxConcurrent] = useState<number>(1);
  const [limitsReason, setLimitsReason] = useState('');
  const [limitsError, setLimitsError] = useState<string | null>(null);
  const [limitsBusy, setLimitsBusy] = useState(false);

  // Modal de Ação (Suspender / Revogar)
  const [actionModal, setActionModal] = useState<{
    license: ManagerLicenseListItem;
    action: 'SUSPEND' | 'REVOKE';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  // Modal de Ativação Manual Comercial (Gate C10)
  const [activationModalLicense, setActivationModalLicense] = useState<ManagerLicenseListItem | null>(null);
  const [activationReason, setActivationReason] = useState('');
  const [activationValidUntil, setActivationValidUntil] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationBusy, setActivationBusy] = useState(false);

  const filtered = licenses.filter((l) => {
    const matchesSearch =
      l.licenseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.customerNickname && l.customerNickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.customerId === null && 'legacy managed'.includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesMode = modeFilter === 'ALL' || l.mode === modeFilter;
    return matchesSearch && matchesStatus && matchesMode;
  });

  const handleInspect = async (licenseId: string) => {
    setInspectLoading(true);
    try {
      const detail = await onInspectLicense(licenseId);
      setInspectedLicense(detail);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleOpenLimitsModal = (lic: ManagerLicenseListItem) => {
    setLimitsModalLicense(lic);
    setNewMaxDevices(lic.maxDevices);
    setNewMaxConcurrent(lic.maxConcurrentSessions);
    setLimitsReason('');
    setLimitsError(null);
  };

  const handleConfirmLimits = async () => {
    if (!limitsModalLicense) return;
    setLimitsError(null);

    // Validação local imediata
    if (newMaxDevices < 1 || newMaxDevices > 100) {
      setLimitsError('max_devices deve ser entre 1 e 100.');
      return;
    }
    if (newMaxConcurrent < 1 || newMaxConcurrent > 50) {
      setLimitsError('max_concurrent_sessions deve ser entre 1 e 50.');
      return;
    }
    if (newMaxDevices < limitsModalLicense.activeDeviceCount) {
      setLimitsError(
        `Política de Segurança: Proibido reduzir max_devices (${newMaxDevices}) abaixo dos aparelhos ativos vinculados (${limitsModalLicense.activeDeviceCount}).`
      );
      return;
    }

    setLimitsBusy(true);
    try {
      const ok = await onUpdateLimits(
        limitsModalLicense.licenseId,
        newMaxDevices,
        newMaxConcurrent,
        limitsReason.trim() || undefined
      );
      if (ok) {
        setLimitsModalLicense(null);
        if (inspectedLicense?.license.licenseId === limitsModalLicense.licenseId) {
          setInspectedLicense((curr) => curr ? {
            ...curr,
            license: {
              ...curr.license,
              maxDevices: newMaxDevices,
              maxConcurrentSessions: newMaxConcurrent,
            },
          } : null);
        }
      }
    } finally {
      setLimitsBusy(false);
    }
  };

  const handleOpenActionModal = (lic: ManagerLicenseListItem, action: 'SUSPEND' | 'REVOKE') => {
    setActionModal({ license: lic, action });
    setActionReason('');
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setActionBusy(true);
    try {
      const { license, action } = actionModal;
      const ok = action === 'SUSPEND'
        ? await onSuspendLicense(license.licenseId, actionReason.trim() || undefined)
        : await onRevokeLicense(license.licenseId, actionReason.trim() || undefined);

      if (ok) {
        setActionModal(null);
        if (inspectedLicense?.license.licenseId === license.licenseId) {
          setInspectedLicense((curr) => curr ? {
            ...curr,
            license: {
              ...curr.license,
              status: action === 'SUSPEND' ? 'SUSPENDED' : 'REVOKED',
            },
          } : null);
        }
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handleOpenActivationModal = (lic: ManagerLicenseListItem) => {
    setActivationModalLicense(lic);
    setActivationReason('');
    setActivationValidUntil('');
    setActivationError(null);
  };

  const handleConfirmActivation = async () => {
    if (!activationModalLicense || !onActivateLicense) return;
    if (!activationReason.trim()) {
      setActivationError('Motivo / Justificativa é obrigatório para ativação manual comercial.');
      return;
    }
    setActivationBusy(true);
    setActivationError(null);
    try {
      const validUntilIso = activationValidUntil.trim()
        ? new Date(activationValidUntil.trim()).toISOString()
        : null;
      const ok = await onActivateLicense(
        activationModalLicense.licenseId,
        activationReason.trim(),
        validUntilIso
      );
      if (ok) {
        setActivationModalLicense(null);
        if (inspectedLicense?.license.licenseId === activationModalLicense.licenseId) {
          setInspectedLicense((curr) => curr ? {
            ...curr,
            license: {
              ...curr.license,
              status: 'ACTIVE',
              expiresAt: validUntilIso,
            },
          } : null);
        }
      } else {
        setActivationError('Falha ao ativar licença.');
      }
    } catch (err: any) {
      setActivationError(err?.message || 'Erro ao processar ativação manual.');
    } finally {
      setActivationBusy(false);
    }
  };

  const statusBadge = (status: LicenseStatus) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#064e3b', text: '#34d399', border: '#10b981' };
      case 'TRIAL':
        return { bg: '#1e1b4b', text: '#c084fc', border: '#7c3aed' };
      case 'SUSPENDED':
        return { bg: '#78350f', text: '#fbbf24', border: '#d97706' };
      case 'EXPIRED':
        return { bg: '#334155', text: '#94a3b8', border: '#64748b' };
      case 'REVOKED':
        return { bg: '#7f1d1d', text: '#f87171', border: '#ef4444' };
    }
  };

  return (
    <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header com Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Gestão de Licenças Comerciais ({licenses.length})
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Slots de dispositivos, autorizações, limites de sessões e status administrativo auditável.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="focusable-item"
            placeholder="Buscar por licença ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              backgroundColor: '#151d30',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              fontSize: '0.85rem',
              minWidth: '220px',
            }}
          />

          <select
            className="focusable-item"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: '#151d30',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL">TRIAL</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="REVOKED">REVOKED</option>
          </select>

          <select
            className="focusable-item"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as any)}
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: '#151d30',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Todos os Modos</option>
            <option value="MANAGED">MANAGED</option>
            <option value="SELF_SERVICE">SELF_SERVICE</option>
          </select>
        </div>
      </div>

      {/* Tabela de Licenças */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando licenças...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#151d30', borderRadius: '6px', color: '#94a3b8' }}>
          Nenhuma licença encontrada com os filtros informados.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>ID da Licença</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Cliente</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Modo</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Slots (Disp.)</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Sessões Máx</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Criada em</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const badge = statusBadge(l.status);
                const isLegacy = l.customerId === null;
                return (
                  <tr key={l.licenseId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#c084fc', fontSize: '0.78rem' }}>
                      {l.licenseId}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {isLegacy ? (
                        <span style={{ color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600 }}>
                          [LEGACY MANAGED]
                        </span>
                      ) : (
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{l.customerNickname || 'Sem Apelido'}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                      {l.mode}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                      <strong>{l.activeDeviceCount}</strong> / {l.maxDevices}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                      {l.maxConcurrentSessions}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                      {new Date(l.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="focusable-item"
                          onClick={() => handleInspect(l.licenseId)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            backgroundColor: '#1e293b',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          🔍
                        </button>

                        <button
                          type="button"
                          className="focusable-item"
                          onClick={() => handleOpenLimitsModal(l)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            backgroundColor: '#334155',
                            color: '#f8fafc',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          ⚙️ Limites
                        </button>

                        {onActivateLicense && (l.status === 'TRIAL' || l.status === 'EXPIRED' || l.status === 'ACTIVE') && (
                          <button
                            type="button"
                            className="focusable-item"
                            onClick={() => handleOpenActivationModal(l)}
                            style={{
                              padding: '0.3rem 0.65rem',
                              backgroundColor: '#059669',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {l.status === 'ACTIVE' ? '⚡ Renovar' : '⚡ Ativar'}
                          </button>
                        )}

                        {l.status !== 'SUSPENDED' && l.status !== 'REVOKED' && (
                          <button
                            type="button"
                            className="focusable-item"
                            onClick={() => handleOpenActionModal(l, 'SUSPEND')}
                            style={{
                              padding: '0.3rem 0.65rem',
                              backgroundColor: '#92400e',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            ⏸️ Suspender
                          </button>
                        )}

                        {l.status !== 'REVOKED' && (
                          <button
                            type="button"
                            className="focusable-item"
                            onClick={() => handleOpenActionModal(l, 'REVOKE')}
                            style={{
                              padding: '0.3rem 0.65rem',
                              backgroundColor: '#dc2626',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            🚫 Revogar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal / Painel de Detalhes da Licença */}
      {inspectLoading && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#151d30', borderRadius: '6px', textAlign: 'center', color: '#c084fc' }}>
          Carregando detalhes da licença...
        </div>
      )}

      {inspectedLicense && !inspectLoading && (
        <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: '#0c111e', borderRadius: '8px', border: '1px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#c084fc', fontWeight: 700 }}>
              Detalhes da Licença: {inspectedLicense.license.licenseId}
            </h3>
            <button
              type="button"
              className="focusable-item"
              onClick={() => setInspectedLicense(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕ Fechar
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
            <div style={{ backgroundColor: '#151d30', padding: '0.6rem', borderRadius: '4px' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>Cliente Associado:</span>
              <strong style={{ color: '#f8fafc' }}>
                {inspectedLicense.customer ? `${inspectedLicense.customer.nickname} (${inspectedLicense.customer.customerId})` : '[LEGACY MANAGED — SEM CLIENTE]'}
              </strong>
            </div>
            <div style={{ backgroundColor: '#151d30', padding: '0.6rem', borderRadius: '4px' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>Status / Modo:</span>
              <strong style={{ color: '#c084fc' }}>{inspectedLicense.license.status} ({inspectedLicense.license.mode})</strong>
            </div>
            <div style={{ backgroundColor: '#151d30', padding: '0.6rem', borderRadius: '4px' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>Limites:</span>
              <span style={{ color: '#cbd5e1' }}>
                Máx Disp: <strong>{inspectedLicense.license.maxDevices}</strong> | Sessões Máx: <strong>{inspectedLicense.license.maxConcurrentSessions}</strong>
              </span>
            </div>
            {inspectedLicense.license.trialEligible && (
              <div style={{ backgroundColor: '#151d30', padding: '0.6rem', borderRadius: '4px' }}>
                <span style={{ color: '#fbbf24', display: 'block' }}>Período de Trial:</span>
                <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                  {inspectedLicense.license.trialStartedAt
                    ? `Início: ${new Date(inspectedLicense.license.trialStartedAt).toLocaleString('pt-BR')} | Fim: ${inspectedLicense.license.trialExpiresAt ? new Date(inspectedLicense.license.trialExpiresAt).toLocaleString('pt-BR') : '-'}`
                    : 'Ainda não iniciado (Inicia no 1º pareamento)'}
                </span>
              </div>
            )}
          </div>

          {/* Aparelhos Vinculados */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Aparelhos Vinculados ({inspectedLicense.devices.length})
            </h4>
            {inspectedLicense.devices.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Nenhum dispositivo ativo nesta licença.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {inspectedLicense.devices.map((d) => (
                  <div key={d.deviceId} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#151d30', borderRadius: '4px', fontSize: '0.78rem' }}>
                    <strong style={{ color: '#38bdf8' }}>{d.displayCode}</strong>
                    <span style={{ marginLeft: '0.4rem', color: '#cbd5e1' }}>{d.deviceLabel} ({d.deviceType})</span>
                    <span style={{ marginLeft: '0.4rem', color: '#34d399' }}>● {d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fontes Vinculadas */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Fontes Vinculadas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
              {inspectedLicense.managedSources.map((ms) => (
                <div key={ms.sourceId} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#151d30', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#c084fc' }}>[MANAGED] {ms.name} (v{ms.version})</span>
                  <span style={{ color: ms.status === 'ACTIVE' ? '#34d399' : '#f87171' }}>{ms.status}</span>
                </div>
              ))}
              {inspectedLicense.customerSources.map((cs) => (
                <div key={cs.sourceId} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#151d30', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#38bdf8' }}>[CUSTOMER] {cs.displayName} ({cs.sourceType} v{cs.version})</span>
                  <span style={{ color: cs.status === 'ACTIVE' ? '#34d399' : '#f87171' }}>{cs.status} (🔒 Protegida)</span>
                </div>
              ))}
              {inspectedLicense.managedSources.length === 0 && inspectedLicense.customerSources.length === 0 && (
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Nenhuma fonte vinculada a esta licença.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Limites com Validação Server-Side */}
      {limitsModalLicense && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: '1px solid #7c3aed', maxWidth: '460px', width: '100%' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Ajustar Limites Administrativos
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              Licença: <code style={{ color: '#c084fc' }}>{limitsModalLicense.licenseId}</code>
            </p>

            <div style={{ backgroundColor: '#151d30', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>Aparelhos Ativos Atualmente:</span>
              <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{limitsModalLicense.activeDeviceCount} aparelhos vinculados</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Máx Dispositivos:
                </label>
                <input
                  type="number"
                  className="focusable-item"
                  min="1"
                  max="100"
                  value={newMaxDevices}
                  onChange={(e) => setNewMaxDevices(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#151d30',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Máx Sessões Simultâneas:
                </label>
                <input
                  type="number"
                  className="focusable-item"
                  min="1"
                  max="50"
                  value={newMaxConcurrent}
                  onChange={(e) => setNewMaxConcurrent(parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#151d30',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Motivo / Justificativa da Alteração:
              </label>
              <input
                type="text"
                className="focusable-item"
                placeholder="Ex: Upgrade de plano, autorização especial..."
                value={limitsReason}
                onChange={(e) => setLimitsReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#151d30',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {limitsError && (
              <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.6rem 0.8rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {limitsError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="focusable-item"
                disabled={limitsBusy}
                onClick={() => setLimitsModalLicense(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="focusable-item"
                disabled={limitsBusy}
                onClick={handleConfirmLimits}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: limitsBusy ? 'wait' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {limitsBusy ? 'Salvando...' : 'Salvar Limites'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Ação (Suspender / Revogar) */}
      {actionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: `1px solid ${actionModal.action === 'REVOKE' ? '#ef4444' : '#f59e0b'}`, maxWidth: '460px', width: '100%' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: actionModal.action === 'REVOKE' ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
              {actionModal.action === 'REVOKE' ? 'Confirmar Revogação da Licença' : 'Confirmar Suspensão da Licença'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 1rem 0' }}>
              Licença: <code style={{ color: '#c084fc' }}>{actionModal.license.licenseId}</code>
            </p>

            <div style={{ backgroundColor: actionModal.action === 'REVOKE' ? '#7f1d1d' : '#78350f', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#fff', display: 'block' }}>
                {actionModal.action === 'REVOKE'
                  ? '⚠️ ATENÇÃO: A revogação é definitiva e irreversível. Todos os aparelhos vinculados terão a reprodução negada permanentemente.'
                  : '⚠️ A suspensão bloqueará temporariamente a reprodução de todos os aparelhos vinculados até que seja reativada.'}
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Motivo / Justificativa (Auditável):
              </label>
              <input
                type="text"
                className="focusable-item"
                placeholder="Informe o motivo para auditoria..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#151d30',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="focusable-item"
                disabled={actionBusy}
                onClick={() => setActionModal(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="focusable-item"
                disabled={actionBusy}
                onClick={handleConfirmAction}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: actionModal.action === 'REVOKE' ? '#dc2626' : '#d97706',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: actionBusy ? 'wait' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {actionBusy ? 'Processando...' : actionModal.action === 'REVOKE' ? 'Confirmar Revogação' : 'Confirmar Suspensão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ativação Manual Comercial (Gate C10) */}
      {activationModalLicense && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: '1px solid #10b981', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#34d399', fontWeight: 700 }}>
              {activationModalLicense.status === 'ACTIVE' ? 'Renovação Comercial de Licença' : 'Ativação Comercial de Licença'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 1rem 0' }}>
              Licença: <code style={{ color: '#c084fc' }}>{activationModalLicense.licenseId}</code>
              <br />
              Status Atual: <strong style={{ color: '#f8fafc' }}>{activationModalLicense.status}</strong>
            </p>

            <div style={{ backgroundColor: '#064e3b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#d1fae5', display: 'block', lineHeight: 1.4 }}>
                🛡️ <strong>Autoridade Server-Side:</strong> Ação exclusiva do gestor autenticado. Converte licenças TRIAL ou EXPIRED para ACTIVE (ou renova licenças ACTIVE).
                <br />
                🔒 Não afeta aparelhos nem fontes. Histórico de trial é estritamente preservado.
              </span>
            </div>

            {activationError && (
              <div style={{ backgroundColor: '#7f1d1d', padding: '0.6rem', borderRadius: '4px', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.82rem' }}>
                {activationError}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Motivo / Justificativa (Obrigatório, Auditável):
              </label>
              <input
                type="text"
                className="focusable-item"
                placeholder="Ex: Pagamento manual comprovado via PIX/TED..."
                value={activationReason}
                onChange={(e) => setActivationReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#151d30',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Data de Validade (Opcional — Deixe em branco para sem expiração):
              </label>
              <input
                type="datetime-local"
                className="focusable-item"
                value={activationValidUntil}
                onChange={(e) => setActivationValidUntil(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#151d30',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="focusable-item"
                disabled={activationBusy}
                onClick={() => setActivationModalLicense(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="focusable-item"
                disabled={activationBusy}
                onClick={handleConfirmActivation}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: activationBusy ? 'wait' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {activationBusy ? 'Ativando...' : 'Confirmar Ativação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
