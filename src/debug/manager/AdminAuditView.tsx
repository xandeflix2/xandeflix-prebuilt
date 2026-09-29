/**
 * Xandeflix Prebuilt — C8 Admin Audit View
 *
 * Visão da trilha de auditoria administrativa (Gate C8):
 * - Consulta public.commercial_audit_logs via rpc_manager_list_audit_logs().
 * - Exibe ações administrativas (CUSTOMER_STATUS_CHANGED, LICENSE_LIMITS_CHANGED, LICENSE_SUSPENDED, LICENSE_REVOKED).
 * - Registra managerId, target, before_state, after_state e timestamps server-side.
 * - ZERO segredos: senhas, chaves do vault ou tokens nunca são registrados.
 */

import React, { useState } from 'react';
import type { ManagerAuditLogItem, ManagerDeviceActivationEvent } from '../../control-plane/control-plane.types.ts';

interface AdminAuditViewProps {
  auditLogs: ManagerAuditLogItem[];
  deviceActivationEvents?: ManagerDeviceActivationEvent[];
  onRefresh: () => Promise<void>;
  loading?: boolean;
}

export const AdminAuditView: React.FC<AdminAuditViewProps> = ({
  auditLogs,
  deviceActivationEvents = [],
  onRefresh,
  loading,
}) => {
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filtered = auditLogs.filter((log) => {
    return actionFilter === 'ALL' || log.action === actionFilter;
  });

  const actionColor = (action: ManagerAuditLogItem['action']) => {
    switch (action) {
      case 'CUSTOMER_STATUS_CHANGED':
        return { bg: '#1e1b4b', text: '#c084fc', border: '#7c3aed' };
      case 'LICENSE_LIMITS_CHANGED':
        return { bg: '#082f49', text: '#38bdf8', border: '#0284c7' };
      case 'LICENSE_SUSPENDED':
        return { bg: '#78350f', text: '#fbbf24', border: '#d97706' };
      case 'LICENSE_REVOKED':
        return { bg: '#7f1d1d', text: '#f87171', border: '#ef4444' };
    }
  };

  return (
    <>
      <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(168,85,247,0.45)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Ativações de Dispositivos A1 ({deviceActivationEvents.length})
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Eventos sanitizados de ativação. Chaves, URLs e credenciais não aparecem aqui.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Carregando ativações A1...</div>
        ) : deviceActivationEvents.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#151d30', borderRadius: '6px', color: '#94a3b8' }}>
            Nenhuma ativação A1 registrada ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {deviceActivationEvents.map((event) => (
              <div key={event.id} style={{ backgroundColor: '#0c111e', padding: '0.9rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ color: event.result === 'SUCCESS' ? '#86efac' : '#fca5a5' }}>
                    {event.action} · {event.result}
                  </strong>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {event.createdAt ? new Date(event.createdAt).toLocaleString('pt-BR') : 'Horário indisponível'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.55rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
                  <span>Dispositivo: <code>{event.displayCode}</code></span>
                  <span>ID: <code>{event.deviceId}</code></span>
                  {event.licenseId && <span>Licença: <code>{event.licenseId}</code></span>}
                  {event.sourceId && <span>Fonte: <code>{event.sourceId}</code></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Trilha de Auditoria Comercial ({auditLogs.length})
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Registro imutável de todas as mutações administrativas realizadas por gestores autorizados.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="focusable-item"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: '#151d30',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Todas as Ações</option>
            <option value="CUSTOMER_STATUS_CHANGED">CUSTOMER_STATUS_CHANGED</option>
            <option value="LICENSE_LIMITS_CHANGED">LICENSE_LIMITS_CHANGED</option>
            <option value="LICENSE_SUSPENDED">LICENSE_SUSPENDED</option>
            <option value="LICENSE_REVOKED">LICENSE_REVOKED</option>
          </select>

          <button
            type="button"
            className="focusable-item"
            onClick={() => void onRefresh()}
            style={{
              padding: '0.45rem 0.85rem',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando trilha de auditoria...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#151d30', borderRadius: '6px', color: '#94a3b8' }}>
          Nenhum evento de auditoria registrado ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((log) => {
            const badge = actionColor(log.action);
            return (
              <div
                key={log.id}
                style={{
                  backgroundColor: '#0c111e',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {log.action}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>
                      Alvo: <strong>{log.targetType}</strong> (<code>{log.targetId}</code>)
                    </span>
                  </div>

                  <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <span>Gestor: <code style={{ color: '#cbd5e1' }}>{log.managerId}</code></span>
                  {log.reason && <span>Motivo: <strong style={{ color: '#f8fafc' }}>"{log.reason}"</strong></span>}
                </div>

                {/* Diff antes e depois */}
                {(log.beforeState || log.afterState) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div style={{ backgroundColor: '#151d30', padding: '0.5rem', borderRadius: '4px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>
                        Estado Anterior:
                      </span>
                      <pre style={{ margin: 0, fontSize: '0.72rem', color: '#fca5a5', whiteSpace: 'pre-wrap' }}>
                        {log.beforeState ? JSON.stringify(log.beforeState, null, 2) : '(Vazio)'}
                      </pre>
                    </div>

                    <div style={{ backgroundColor: '#151d30', padding: '0.5rem', borderRadius: '4px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>
                        Novo Estado:
                      </span>
                      <pre style={{ margin: 0, fontSize: '0.72rem', color: '#86efac', whiteSpace: 'pre-wrap' }}>
                        {log.afterState ? JSON.stringify(log.afterState, null, 2) : '(Vazio)'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
};
