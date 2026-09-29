/**
 * Xandeflix Prebuilt — C8 Admin Customers View
 *
 * Visão administrativa de clientes:
 * - Listagem com busca (nickname, customerId sanitizado) e filtros de status.
 * - Inspeção de detalhes (perfil, licenças, dispositivos vinculados, fontes do cliente).
 * - Alteração de status (ACTIVE, SUSPENDED, BLOCKED) com confirmação explícita.
 * - ZERO segredos: senhas, hashes internos ou tokens nunca são renderizados.
 */

import React, { useState } from 'react';
import type {
  CustomerStatus,
  ManagerCustomerDetail,
  ManagerCustomerListItem,
} from '../../control-plane/control-plane.types.ts';

interface AdminCustomersViewProps {
  customers: ManagerCustomerListItem[];
  onInspectCustomer: (customerId: string) => Promise<ManagerCustomerDetail | null>;
  onUpdateCustomerStatus: (customerId: string, status: CustomerStatus, reason?: string) => Promise<boolean>;
  loading?: boolean;
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({
  customers,
  onInspectCustomer,
  onUpdateCustomerStatus,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerStatus>('ALL');
  const [inspectedCustomer, setInspectedCustomer] = useState<ManagerCustomerDetail | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [modalCustomer, setModalCustomer] = useState<ManagerCustomerListItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<CustomerStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [mutating, setMutating] = useState(false);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInspect = async (customerId: string) => {
    setInspectLoading(true);
    try {
      const detail = await onInspectCustomer(customerId);
      setInspectedCustomer(detail);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleOpenStatusModal = (customer: ManagerCustomerListItem) => {
    setModalCustomer(customer);
    setTargetStatus(customer.status);
    setStatusReason('');
  };

  const handleConfirmStatus = async () => {
    if (!modalCustomer) return;
    setMutating(true);
    try {
      const ok = await onUpdateCustomerStatus(modalCustomer.customerId, targetStatus, statusReason.trim() || undefined);
      if (ok) {
        setModalCustomer(null);
        if (inspectedCustomer?.customer.customerId === modalCustomer.customerId) {
          setInspectedCustomer((curr) => curr ? {
            ...curr,
            customer: { ...curr.customer, status: targetStatus },
          } : null);
        }
      }
    } finally {
      setMutating(false);
    }
  };

  const statusBadgeColor = (status: CustomerStatus) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#064e3b', text: '#34d399', border: '#10b981' };
      case 'SUSPENDED':
        return { bg: '#78350f', text: '#fbbf24', border: '#d97706' };
      case 'BLOCKED':
        return { bg: '#7f1d1d', text: '#f87171', border: '#ef4444' };
    }
  };

  return (
    <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header com Filtros e Contadores */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Gestão de Clientes ({customers.length})
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Contas de clientes comerciais, status auditável e inspeção de relacionamentos de licença.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="focusable-item"
            placeholder="Buscar por apelido ou ID..."
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
            <option value="ACTIVE">ACTIVE (Ativos)</option>
            <option value="SUSPENDED">SUSPENDED (Suspensos)</option>
            <option value="BLOCKED">BLOCKED (Bloqueados)</option>
          </select>
        </div>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando clientes...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#151d30', borderRadius: '6px', color: '#94a3b8' }}>
          Nenhum cliente encontrado com os filtros informados.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Apelido</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>ID do Cliente</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Licenças</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Criado em</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const badge = statusBadgeColor(c.status);
                return (
                  <tr key={c.customerId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                      {c.nickname}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.78rem' }}>
                      {c.customerId}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                      {c.licensesCount} licença(s)
                    </td>
                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="focusable-item"
                          onClick={() => handleInspect(c.customerId)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            backgroundColor: '#1e293b',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          🔍 Inspecionar
                        </button>

                        <button
                          type="button"
                          className="focusable-item"
                          onClick={() => handleOpenStatusModal(c)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            backgroundColor: '#334155',
                            color: '#f8fafc',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          🛡️ Alterar Status
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal / Painel de Inspeção de Detalhes do Cliente */}
      {inspectLoading && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#151d30', borderRadius: '6px', textAlign: 'center', color: '#38bdf8' }}>
          Carregando detalhes do cliente...
        </div>
      )}

      {inspectedCustomer && !inspectLoading && (
        <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: '#0c111e', borderRadius: '8px', border: '1px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#38bdf8', fontWeight: 700 }}>
              Detalhes do Cliente: {inspectedCustomer.customer.nickname}
            </h3>
            <button
              type="button"
              className="focusable-item"
              onClick={() => setInspectedCustomer(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕ Fechar
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
            <div style={{ backgroundColor: '#151d30', padding: '0.6rem', borderRadius: '4px' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>ID Canônico:</span>
              <code style={{ color: '#f8fafc' }}>{inspectedCustomer.customer.customerId}</code>
            </div>
            <div style={{ backgroundColor: '#151d30', padding: '0.6rem', borderRadius: '4px' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>Status:</span>
              <strong style={{ color: inspectedCustomer.customer.status === 'ACTIVE' ? '#34d399' : '#f87171' }}>
                {inspectedCustomer.customer.status}
              </strong>
            </div>
            <div style={{ backgroundColor: '#151d30', padding: '0.6rem', borderRadius: '4px' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>Trial Consumido:</span>
              <span style={{ color: '#cbd5e1' }}>
                {inspectedCustomer.customer.trialUsedAt
                  ? new Date(inspectedCustomer.customer.trialUsedAt).toLocaleString('pt-BR')
                  : 'Não utilizado (Elegível)'}
              </span>
            </div>
          </div>

          {/* Licenças Associadas */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Licenças Associadas ({inspectedCustomer.licenses.length})
            </h4>
            {inspectedCustomer.licenses.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Nenhuma licença associada a este cliente.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {inspectedCustomer.licenses.map((lic) => (
                  <div key={lic.licenseId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#151d30', borderRadius: '4px', fontSize: '0.8rem' }}>
                    <div>
                      <code style={{ color: '#c084fc' }}>{lic.licenseId}</code>
                      <span style={{ marginLeft: '0.5rem', color: '#94a3b8' }}>[{lic.mode}]</span>
                      {lic.trialEligible && (
                        <span style={{ marginLeft: '0.5rem', color: '#fbbf24', fontSize: '0.75rem' }}>★ Trial</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ color: '#cbd5e1' }}>Dispositivos: {lic.activeDevicesCount} / {lic.maxDevices}</span>
                      <span style={{ fontWeight: 700, color: lic.status === 'ACTIVE' ? '#34d399' : '#f87171' }}>{lic.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dispositivos Vinculados */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Dispositivos Vinculados ({inspectedCustomer.devices.length})
            </h4>
            {inspectedCustomer.devices.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Nenhum dispositivo ativo vinculado.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {inspectedCustomer.devices.map((d) => (
                  <div key={d.deviceId} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#151d30', borderRadius: '4px', fontSize: '0.78rem' }}>
                    <strong style={{ color: '#38bdf8' }}>{d.displayCode}</strong>
                    <span style={{ marginLeft: '0.4rem', color: '#cbd5e1' }}>{d.deviceLabel} ({d.deviceType})</span>
                    <span style={{ marginLeft: '0.4rem', color: '#34d399' }}>● {d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fontes de Autoatendimento do Cliente */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Fontes de Autoatendimento do Cliente ({inspectedCustomer.sources.length})
            </h4>
            {inspectedCustomer.sources.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Nenhuma fonte de autoatendimento cadastrada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {inspectedCustomer.sources.map((src) => (
                  <div key={src.sourceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', backgroundColor: '#151d30', borderRadius: '4px', fontSize: '0.8rem' }}>
                    <div>
                      <strong style={{ color: '#f8fafc' }}>{src.displayName}</strong>
                      <span style={{ marginLeft: '0.5rem', color: '#94a3b8' }}>({src.sourceType} v{src.version})</span>
                      <code style={{ marginLeft: '0.5rem', color: '#38bdf8', fontSize: '0.75rem' }}>{src.sourceId}</code>
                    </div>
                    <div>
                      <span style={{ color: src.status === 'ACTIVE' ? '#34d399' : '#f87171', fontWeight: 600 }}>{src.status}</span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>🔒 Credencial Cifrada</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Alteração de Status com Confirmação Explícita */}
      {modalCustomer && (
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
              Alterar Status do Cliente
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              Cliente: <strong style={{ color: '#fff' }}>{modalCustomer.nickname}</strong> ({modalCustomer.customerId})
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Novo Status Administrativo:
              </label>
              <select
                className="focusable-item"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as CustomerStatus)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: '#151d30',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                }}
              >
                <option value="ACTIVE">ACTIVE — Acesso Regular Permitido</option>
                <option value="SUSPENDED">SUSPENDED — Acesso Temporariamente Suspenso</option>
                <option value="BLOCKED">BLOCKED — Bloqueio Administrativo Completo</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Motivo / Justificativa da Alteração (Auditável):
              </label>
              <input
                type="text"
                className="focusable-item"
                placeholder="Ex: Solicitação do gestor, inadimplência, etc."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
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

            <div style={{ backgroundColor: '#1e1b4b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.25rem', border: '1px solid #7c3aed' }}>
              <span style={{ fontSize: '0.75rem', color: '#c084fc', display: 'block' }}>
                ⚠️ <strong>Ação de Impacto:</strong> A alteração será gravada em <code>public.commercial_audit_logs</code> com o ID do gestor autenticado. Nenhuma credencial do cliente será exposta ou alterada.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="focusable-item"
                disabled={mutating}
                onClick={() => setModalCustomer(null)}
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
                disabled={mutating}
                onClick={handleConfirmStatus}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: targetStatus === 'BLOCKED' ? '#dc2626' : targetStatus === 'SUSPENDED' ? '#d97706' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: mutating ? 'wait' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {mutating ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
