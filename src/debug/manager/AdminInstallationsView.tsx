/**
 * Xandeflix Prebuilt — C8 Admin Installations View
 *
 * Visão administrativa do registro de instalações (Gate C2):
 * - Reutiliza rpc_manager_list_installations().
 * - Exibe metadados de hardware, plataforma, versão e status de correlação.
 * - ZERO segredos: tokens de pareamento ou chaves de autenticação nunca são renderizados.
 */

import React, { useState } from 'react';
import type { ManagerInstallationListItem } from '../../control-plane/control-plane.types.ts';

interface AdminInstallationsViewProps {
  installations: ManagerInstallationListItem[];
  loading?: boolean;
}

export const AdminInstallationsView: React.FC<AdminInstallationsViewProps> = ({
  installations,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | string>('ALL');

  const filtered = installations.filter((inst) => {
    const matchesSearch =
      inst.displayCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.installationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.manufacturer && inst.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inst.model && inst.model.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = platformFilter === 'ALL' || inst.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Registro de Instalações ({installations.length})
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Instalações físicas observadas (C2), telemetria sanitizada e correlação com aparelhos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            className="focusable-item"
            placeholder="Buscar por código, modelo..."
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
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: '#151d30',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Todas as Plataformas</option>
            <option value="ANDROID">ANDROID</option>
            <option value="WEB">WEB</option>
            <option value="IOS">IOS</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando instalações...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#151d30', borderRadius: '6px', color: '#94a3b8' }}>
          Nenhuma instalação encontrada com os filtros informados.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Código</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Plataforma / Tipo</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Hardware (Fabricante/Modelo)</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Versão App</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Correlação de Aparelho</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Visto pela última vez</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst) => (
                <tr key={inst.installationId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <strong style={{ color: '#38bdf8' }}>{inst.displayCode}</strong>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {inst.installationId}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                    {inst.platform} / {inst.deviceType}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#f8fafc' }}>
                    {inst.manufacturer || inst.model
                      ? `${inst.manufacturer || ''} ${inst.model || ''}`.trim()
                      : 'Genérico / Desconhecido'}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    v{inst.appVersion} {inst.buildNumber ? `(${inst.buildNumber})` : ''}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: inst.status === 'PAIRED' ? '#064e3b' : '#1e293b',
                        color: inst.status === 'PAIRED' ? '#34d399' : '#94a3b8',
                        border: `1px solid ${inst.status === 'PAIRED' ? '#10b981' : '#475569'}`,
                      }}
                    >
                      {inst.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                    {inst.deviceCorrelation?.isKnownDevice ? (
                      <span style={{ color: '#34d399' }}>
                        ● Vinculado: {inst.deviceCorrelation.deviceLabel || 'Dispositivo'} ({inst.deviceCorrelation.deviceStatus})
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>Aparelho não registrado</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                    {inst.lastSeenAt ? new Date(inst.lastSeenAt).toLocaleString('pt-BR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
