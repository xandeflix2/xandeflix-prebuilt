/**
 * Xandeflix Prebuilt — Debug Real Source Setup Page (Experiment R7A)
 *
 * Tela de configuração local e teste de conectividade de fontes reais (DEBUG_ONLY).
 *
 * Princípios:
 * - NO_SECRET_EXPOSURE: Senhas usam input type="password" sem botão de revelar.
 * - LOCAL_ONLY: Armazenamento em sandbox privado do app; zero envio para backend.
 * - D-PAD COMPATIBLE: Todos os controles são navegáveis por controle remoto de TV.
 * - SANITIZED STATUS: Exibe somente o diagnóstico sanitizado de conectividade e elegibilidade.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  type SourceType,
  type SourceRuntimeConfig,
  type SourceConnectionTestResult,
} from './source/source-runtime-config.ts';
import { DebugSourceConfigService } from './source/debug-source-config.service.ts';
import { XtreamSourceAdapter } from './source/xtream-source-adapter.ts';
import { M3uSourceAdapter } from './source/m3u-source-adapter.ts';
import { SourceTypeDetector } from './source/source-type-detector.ts';

interface DebugSourceSetupPageProps {
  onBack: () => void;
}

export const DebugSourceSetupPage: React.FC<DebugSourceSetupPageProps> = ({ onBack }) => {
  const [sourceType, setSourceType] = useState<SourceType>('AUTO');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');

  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const [testResult, setTestResult] = useState<SourceConnectionTestResult | null>(null);

  // Carregar configuração salva previamente no sandbox privado
  useEffect(() => {
    let isMounted = true;
    DebugSourceConfigService.loadConfig().then((cfg) => {
      if (!isMounted || !cfg) return;
      setSourceType(cfg.type || 'AUTO');
      if (cfg.host) setHost(cfg.host);
      if (cfg.username) setUsername(cfg.username);
      if (cfg.password) setPassword(cfg.password);
      if (cfg.playlistUrl) setPlaylistUrl(cfg.playlistUrl);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setFeedbackNotice(null);
    try {
      const config: SourceRuntimeConfig = {
        type: sourceType,
        host: host.trim() || undefined,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        playlistUrl: playlistUrl.trim() || undefined,
      };
      await DebugSourceConfigService.saveConfig(config);
      setFeedbackNotice('Configuração salva com sucesso no sandbox privado do app.');
    } catch {
      setFeedbackNotice('Falha ao salvar configuração localmente.');
    } finally {
      setIsSaving(false);
    }
  }, [sourceType, host, username, password, playlistUrl]);

  const handleClear = useCallback(async () => {
    await DebugSourceConfigService.clearConfig();
    setHost('');
    setUsername('');
    setPassword('');
    setPlaylistUrl('');
    setTestResult(null);
    setFeedbackNotice('Configuração removida do sandbox privado.');
  }, []);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setFeedbackNotice(null);

    const config: SourceRuntimeConfig = {
      type: sourceType,
      host: host.trim() || undefined,
      username: username.trim() || undefined,
      password: password.trim() || undefined,
      playlistUrl: playlistUrl.trim() || undefined,
    };

    try {
      // Salvar antes de testar
      await DebugSourceConfigService.saveConfig(config);

      // Detecta tipo para roteamento do adapter
      const detection = SourceTypeDetector.detect(config);

      if (detection.detectedType === 'TS_DIRECT_STREAM') {
        setTestResult({
          connection: 'PASS',
          auth: 'NA',
          detectedType: 'TS_DIRECT_STREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: 'SOURCE_TS_STREAM_NOT_CATALOG',
          testedAtIso: new Date().toISOString(),
        });
        return;
      }

      if (detection.detectedType === 'HLS_SINGLE_STREAM') {
        setTestResult({
          connection: 'PASS',
          auth: 'NA',
          detectedType: 'HLS_SINGLE_STREAM',
          catalogImportEligible: false,
          readyForR7b: false,
          sanitizedMessage: 'SOURCE_SINGLE_STREAM_NOT_CATALOG',
          testedAtIso: new Date().toISOString(),
        });
        return;
      }

      if (detection.detectedType === 'XTREAM') {
        const adapter = new XtreamSourceAdapter();
        const res = await adapter.testConnection(config);
        setTestResult(res);
        return;
      }

      if (detection.detectedType === 'M3U') {
        const adapter = new M3uSourceAdapter();
        const res = await adapter.testConnection(config);
        setTestResult(res);
        return;
      }

      // Tipo indefinido / desconhecido
      setTestResult({
        connection: 'FAIL',
        auth: 'NA',
        detectedType: 'UNKNOWN',
        catalogImportEligible: false,
        readyForR7b: false,
        sanitizedMessage: 'SOURCE_CONFIG_INVALID',
        testedAtIso: new Date().toISOString(),
      });
    } catch {
      setTestResult({
        connection: 'FAIL',
        auth: 'NA',
        detectedType: 'UNKNOWN',
        catalogImportEligible: false,
        readyForR7b: false,
        sanitizedMessage: 'SOURCE_CONNECTION_FAILED',
        testedAtIso: new Date().toISOString(),
      });
    } finally {
      setIsTesting(false);
    }
  }, [sourceType, host, username, password, playlistUrl]);

  return (
    <div className="debug-source-page" style={{
      minHeight: '100vh',
      backgroundColor: '#080c14',
      color: '#f8fafc',
      padding: '2rem',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <span style={{
              backgroundColor: '#b91c1c',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              DEBUG-ONLY (R7A)
            </span>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.5rem', fontWeight: 700 }}>
              Configuração Local de Fonte Real
            </h1>
          </div>
          <button
            type="button"
            className="focusable-item"
            onClick={onBack}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Voltar
          </button>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          Esta tela é exclusiva do ambiente de depuração. As credenciais informadas são processadas
          estritamente pelo seu dispositivo e armazenadas no sandbox privado do aplicativo.
          Zero dados são sincronizados com o backend ou salvos no repositório.
        </p>

        {/* Notificação temporária */}
        {feedbackNotice && (
          <div style={{
            padding: '0.8rem 1rem',
            backgroundColor: '#1e293b',
            borderLeft: '4px solid #38bdf8',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#f8fafc'
          }}>
            {feedbackNotice}
          </div>
        )}

        {/* Seleção do Tipo de Fonte */}
        <div style={{
          backgroundColor: '#101624',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 600 }}>
            TIPO DE PROTOCOLO DA FONTE
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(['AUTO', 'XTREAM', 'M3U'] as SourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                className="focusable-item"
                onClick={() => setSourceType(type)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: sourceType === type ? '#e50914' : '#1e293b',
                  border: '1px solid ' + (sourceType === type ? '#ff2a36' : 'rgba(255,255,255,0.1)'),
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {type === 'AUTO' ? '⚡ Detecção Automática' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Formulário Dinâmico */}
        <div style={{
          backgroundColor: '#101624',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {(sourceType === 'XTREAM' || sourceType === 'AUTO') && (
            <div style={{ marginBottom: sourceType === 'AUTO' ? '1.5rem' : '0' }}>
              <h3 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '1rem', fontWeight: 600 }}>
                {sourceType === 'AUTO' ? 'Opção A: Parâmetros Xtream Codes' : 'Dados do Servidor Xtream'}
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Servidor / Host (ex: http://servidor.xyz:8080)
                </label>
                <input
                  type="text"
                  className="focusable-item"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="http://seu-servidor.com:8080"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#151d30',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Usuário
                  </label>
                  <input
                    type="text"
                    className="focusable-item"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="usuário"
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#151d30',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Senha (campo protegido)
                  </label>
                  <input
                    type="password"
                    className="focusable-item"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#151d30',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {(sourceType === 'M3U' || sourceType === 'AUTO') && (
            <div>
              {sourceType === 'AUTO' && (
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />
              )}
              <h3 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '1rem', fontWeight: 600 }}>
                {sourceType === 'AUTO' ? 'Opção B: URL Direta da Playlist M3U' : 'Endereço da Playlist M3U'}
              </h3>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  URL Completa da Playlist (http://... ou https://...)
                </label>
                <input
                  type="text"
                  className="focusable-item"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="https://exemplo.com/playlist.m3u"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#151d30',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="focusable-item"
            onClick={handleSave}
            disabled={isSaving || isTesting}
            style={{
              padding: '0.8rem 1.5rem',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#f8fafc',
              fontWeight: 600,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {isSaving ? 'Salvando...' : 'Salvar Localmente'}
          </button>

          <button
            type="button"
            className="focusable-item"
            onClick={handleTestConnection}
            disabled={isTesting}
            style={{
              padding: '0.8rem 1.5rem',
              backgroundColor: '#e50914',
              border: '1px solid #ff2a36',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {isTesting ? 'Testando Conexão...' : 'Testar Conexão Direta'}
          </button>

          <button
            type="button"
            className="focusable-item"
            onClick={handleClear}
            disabled={isTesting || isSaving}
            style={{
              padding: '0.8rem 1.2rem',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ef4444',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Limpar Configuração
          </button>

          <button
            type="button"
            className="focusable-item"
            disabled={true}
            style={{
              padding: '0.8rem 1.5rem',
              backgroundColor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.05)',
              color: '#6b7280',
              borderRadius: '6px',
              cursor: 'not-allowed',
              marginLeft: 'auto'
            }}
          >
            Importar Catálogo <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(R7B_REQUIRED)</span>
          </button>
        </div>

        {/* Painel de Diagnóstico Sanitizado (Section 19) */}
        {testResult && (
          <div style={{
            backgroundColor: '#101624',
            border: '1px solid ' + (testResult.connection === 'PASS' && testResult.readyForR7b ? '#22c55e' : '#ef4444'),
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '1rem', fontWeight: 700 }}>
              Resultado do Teste de Conexão (Sanitizado)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#151d30', borderRadius: '4px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>SOURCE_TYPE</span>
                <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>{testResult.detectedType}</strong>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#151d30', borderRadius: '4px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>CONNECTION</span>
                <strong style={{ color: testResult.connection === 'PASS' ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
                  {testResult.connection}
                </strong>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#151d30', borderRadius: '4px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>AUTH</span>
                <strong style={{
                  color: testResult.auth === 'PASS' ? '#22c55e' : testResult.auth === 'AUTH_FAILED' ? '#ef4444' : '#94a3b8',
                  fontSize: '1rem'
                }}>
                  {testResult.auth}
                </strong>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#151d30', borderRadius: '4px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>CATALOG_IMPORT_ELIGIBLE</span>
                <strong style={{ color: testResult.catalogImportEligible ? '#22c55e' : '#f59e0b', fontSize: '1rem' }}>
                  {testResult.catalogImportEligible ? 'SIM' : 'NAO'}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>STATUS SANITIZADO: </span>
                <code style={{ backgroundColor: '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#38bdf8' }}>
                  {testResult.sanitizedMessage}
                </code>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>READY_FOR_R7B: </span>
                <strong style={{ color: testResult.readyForR7b ? '#22c55e' : '#ef4444' }}>
                  {testResult.readyForR7b ? 'SIM' : 'NAO'}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
