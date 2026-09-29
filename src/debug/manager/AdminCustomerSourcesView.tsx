/**
 * Xandeflix Prebuilt — C8 Admin Customer Sources View
 *
 * Visão administrativa de fontes de autoatendimento (Gate C6):
 * - Lista todas as fontes cadastradas diretamente pelos clientes.
 * - Mantém separação estrita contra fontes gerenciadas (Managed Sources).
 * - ZERO segredos: senhas, URLs com credenciais e chaves do cofre nunca são expostas.
 */

import React, { useState } from 'react';
import type { ManagerCustomerSourceListItem } from '../../control-plane/control-plane.types.ts';

interface AdminCustomerSourcesViewProps {
  customerSources: ManagerCustomerSourceListItem[];
  loading?: boolean;
}

export const AdminCustomerSourcesView: React.FC<AdminCustomerSourcesViewProps> = ({
  customerSources,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | string>('ALL');

  const filtered = customerSources.filter((src) => {
    const matchesSearch =
      src.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      src.sourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      src.customerNickname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || src.sourceType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Fontes de Autoatendimento de Clientes ({customerSources.length})
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Fontes M3U/Xtream configuradas pelos próprios clientes (C6) com credenciais protegidas no Vault privado.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            className="focusable-item"
            placeholder="Buscar por nome, ID ou cliente..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: '#151d30',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="M3U">M3U</option>
            <option value="M3U8">M3U8</option>
            <option value="XTREAM">XTREAM</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Carregando fontes de clientes...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#151d30', borderRadius: '6px', color: '#94a3b8' }}>
          Nenhuma fonte de cliente encontrada com os filtros informados.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Nome da Fonte</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>ID Canônico</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Cliente Proprietário</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Tipo / Versão</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Cofre de Segredos</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Cadastrada em</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((src) => (
                <tr key={src.sourceId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                    {src.displayName}
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.78rem' }}>
                    {src.sourceId}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <strong style={{ color: '#c084fc' }}>{src.customerNickname}</strong>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {src.customerId}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                    {src.sourceType} (v{src.version})
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: src.status === 'ACTIVE' ? '#064e3b' : '#7f1d1d',
                        color: src.status === 'ACTIVE' ? '#34d399' : '#f87171',
                        border: `1px solid ${src.status === 'ACTIVE' ? '#10b981' : '#ef4444'}`,
                      }}
                    >
                      {src.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.78rem', color: '#34d399' }}>
                    🔒 AES-256-GCM (Cofre Privado)
                  </td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                    {new Date(src.createdAt).toLocaleDateString('pt-BR')}
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
