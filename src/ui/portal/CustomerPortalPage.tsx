/**
 * =============================================================================
 * Xandeflix Prebuilt — Customer Portal Component (Gate C7)
 *
 * Interface gráfica completa e responsiva do Portal do Cliente.
 * Totalmente desacoplada do painel de gestao administrativa e das interfaces
 * de mídia do catálogo (Home, Movies, Series, Live, Search, Player).
 *
 * Princípios:
 * - AUTH_GUARD: Proteção estrita de rotas com tela de Login/Cadastro dedicada.
 * - PROFILE_ONBOARDING: Onboarding obrigatório de Nickname via C3.
 * - SERVER_DATA_AUTHORITY: Expiração de licença e cálculo de dias baseados no servidor.
 * - ZERO_SECRET_EXPOSURE: Zero exibição de senhas, URLs completas, tokens ou chaves.
 * - PLACEHOLDER_ONLY_SESSIONS: Sessões simultâneas exibidas como informativo para C9.
 * - INFORMATIVE_ONLY_PAYMENT: CTA de ativação de licença com status "Em breve".
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CustomerPortalService,
  type PortalTab,
  type PortalDashboardSummary,
} from '../../control-plane/client/customer-portal.service.ts';
import type { CustomerSourceConfig, CustomerSourceType, CustomerPlaybackSessionListItem } from '../../control-plane/control-plane.types.ts';
import './CustomerPortal.css';

interface CustomerPortalProps {
  initialTab?: PortalTab;
  onBack?: () => void;
}

export function CustomerPortalPage({ initialTab = 'dashboard', onBack }: CustomerPortalProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<PortalDashboardSummary | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Estados dos formulários
  // Auth Form
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authNickname, setAuthNickname] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Onboarding Form
  const [onboardingNickname, setOnboardingNickname] = useState<string>('');
  const [onboardingLoading, setOnboardingLoading] = useState<boolean>(false);

  // Account Form
  const [editNickname, setEditNickname] = useState<string>('');
  const [nicknameLoading, setNicknameLoading] = useState<boolean>(false);

  // Device Pairing Form
  const [pairDisplayCode, setPairDisplayCode] = useState<string>('');
  const [pairCode, setPairCode] = useState<string>('');
  const [pairDeviceLabel, setPairDeviceLabel] = useState<string>('');
  const [pairLoading, setPairLoading] = useState<boolean>(false);

  // A1: ativação de dispositivo por chave exclusiva + fonte opaca
  const [activationDisplayCode, setActivationDisplayCode] = useState<string>('');
  const [activationKey, setActivationKey] = useState<string>('');
  const [activationSourceId, setActivationSourceId] = useState<string>('');
  const [activationDeviceLabel, setActivationDeviceLabel] = useState<string>('');
  const [activationLoading, setActivationLoading] = useState<boolean>(false);

  // Source Form (Zero-persistence de credenciais)
  const [sourceProtocol, setSourceProtocol] = useState<CustomerSourceType>('M3U');
  const [sourceDisplayName, setSourceDisplayName] = useState<string>('');
  const [sourceM3uUrl, setSourceM3uUrl] = useState<string>('');
  const [sourceXtreamEndpoint, setSourceXtreamEndpoint] = useState<string>('');
  const [sourceXtreamUser, setSourceXtreamUser] = useState<string>('');
  const [sourceXtreamPass, setSourceXtreamPass] = useState<string>('');
  const [sourceLoading, setSourceLoading] = useState<boolean>(false);

  // Sessions (Gate C9)
  const [playbackSessions, setPlaybackSessions] = useState<CustomerPlaybackSessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);

  const loadSessions = useCallback(async (licenseId?: string) => {
    setSessionsLoading(true);
    try {
      const data = await CustomerPortalService.listPlaybackSessions(licenseId);
      setPlaybackSessions(data);
    } catch {
      // Falha silenciosa ou fallback
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  // Sincroniza com hash da janela
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash.startsWith('portal')) {
        const parts = hash.split('/');
        const sub = parts[1] as PortalTab;
        if (['dashboard', 'license', 'devices', 'source', 'account', 'sessions'].includes(sub)) {
          setActiveTab(sub);
        } else {
          setActiveTab('dashboard');
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = useCallback((tab: PortalTab) => {
    setActiveTab(tab);
    setFeedback(null);
    if (tab === 'dashboard') {
      window.location.hash = '#portal';
    } else {
      window.location.hash = `#portal/${tab}`;
    }
  }, []);

  // Carrega dados agregados do portal
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await CustomerPortalService.getDashboardSummary();
      setSummary(data);
      if (data.profile?.nickname) {
        setEditNickname(data.profile.nickname);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha ao carregar informações do portal.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      void loadSessions(summary?.license?.id);
    }
  }, [activeTab, summary?.license?.id, loadSessions]);

  // Auth: Login / Cadastro
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signin') {
        const res = await CustomerPortalService.signIn(authEmail, authPassword);
        if (!res.success) {
          setFeedback({ type: 'error', message: res.error || 'Erro ao realizar login.' });
        } else {
          setFeedback({ type: 'success', message: 'Login realizado com sucesso!' });
          setAuthPassword('');
          await loadDashboard();
        }
      } else {
        const res = await CustomerPortalService.signUp(authEmail, authPassword, authNickname);
        if (!res.success) {
          setFeedback({ type: 'error', message: res.error || 'Erro ao cadastrar conta.' });
        } else {
          setFeedback({
            type: 'success',
            message: res.needsEmailConfirmation
              ? 'Conta criada! Verifique seu email para confirmação.'
              : 'Conta criada e autenticada com sucesso!',
          });
          setAuthPassword('');
          await loadDashboard();
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleSignOut = async () => {
    await CustomerPortalService.signOut();
    setSummary(null);
    setFeedback({ type: 'info', message: 'Você saiu da sua conta.' });
    await loadDashboard();
  };

  // Onboarding de Nickname
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setOnboardingLoading(true);

    try {
      const res = await CustomerPortalService.createProfile(onboardingNickname);
      if (!res.success) {
        setFeedback({ type: 'error', message: CustomerPortalService.mapErrorMessage(res.code, res.message) });
      } else {
        setFeedback({ type: 'success', message: 'Perfil configurado com sucesso!' });
        setOnboardingNickname('');
        await loadDashboard();
      }
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Atualizar Nickname
  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setNicknameLoading(true);

    try {
      const res = await CustomerPortalService.updateNickname(editNickname);
      if (!res.success) {
        setFeedback({ type: 'error', message: CustomerPortalService.mapErrorMessage(res.code, res.message) });
      } else {
        setFeedback({ type: 'success', message: 'Nome de usuário atualizado com sucesso!' });
        await loadDashboard();
      }
    } finally {
      setNicknameLoading(false);
    }
  };

  // Parear Dispositivo (C4)
  const handlePairDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setPairLoading(true);

    try {
      const res = await CustomerPortalService.pairDevice({
        displayCode: pairDisplayCode,
        pairingCode: pairCode,
        deviceLabel: pairDeviceLabel || undefined,
        licenseId: summary?.license?.id || undefined,
      });

      if (!res.success) {
        setFeedback({ type: 'error', message: CustomerPortalService.mapErrorMessage(res.code, res.message) });
      } else {
        setFeedback({ type: 'success', message: 'Dispositivo pareado e autorizado com sucesso!' });
        setPairDisplayCode('');
        setPairCode('');
        setPairDeviceLabel('');
        await loadDashboard();
      }
    } finally {
      setPairLoading(false);
    }
  };

  // Ativação remota A1: dispositivo + chave exclusiva + fonte
  const handleActivateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setActivationLoading(true);

    try {
      const res = await CustomerPortalService.activateDevice({
        displayCode: activationDisplayCode,
        activationKey,
        sourceId: activationSourceId,
        deviceLabel: activationDeviceLabel || undefined,
        licenseId: summary?.license?.id || undefined,
      });

      if (!res.success) {
        setFeedback({ type: 'error', message: CustomerPortalService.mapErrorMessage(res.code, res.message) });
      } else {
        setFeedback({ type: 'success', message: 'Dispositivo ativado e fonte vinculada com sucesso!' });
        setActivationDisplayCode('');
        setActivationKey('');
        setActivationSourceId('');
        setActivationDeviceLabel('');
        await loadDashboard();
      }
    } finally {
      setActivationLoading(false);
    }
  };

  // Salvar Fonte de Autoatendimento (C6)
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSourceLoading(true);

    try {
      if (!summary?.license?.id) {
        setFeedback({ type: 'error', message: 'É necessária uma licença ativa para cadastrar fontes.' });
        return;
      }

      let sourceConfig: CustomerSourceConfig;
      if (sourceProtocol === 'XTREAM') {
        sourceConfig = {
          endpoint: sourceXtreamEndpoint.trim(),
          username: sourceXtreamUser.trim(),
          password: sourceXtreamPass,
        };
      } else {
        sourceConfig = {
          playlistUrl: sourceM3uUrl.trim(),
        };
      }

      let res;
      if (summary.activeSource) {
        // Atualização / Rotação
        res = await CustomerPortalService.updateSource({
          sourceId: summary.activeSource.sourceId,
          sourceType: sourceProtocol,
          expectedVersion: summary.activeSource.version,
          displayName: sourceDisplayName.trim() || undefined,
          sourceConfig,
        });
      } else {
        // Criação
        res = await CustomerPortalService.createSource({
          licenseId: summary.license.id,
          sourceType: sourceProtocol,
          displayName: sourceDisplayName.trim() || 'Minha Fonte',
          sourceConfig,
        });
      }

      if (!res.success) {
        setFeedback({ type: 'error', message: CustomerPortalService.mapErrorMessage(res.code, res.message) });
      } else {
        setFeedback({
          type: 'success',
          message: summary.activeSource
            ? 'Fonte atualizada e credenciais rotacionadas com sucesso!'
            : 'Fonte de autoatendimento cadastrada com sucesso!',
        });
        // Limpeza imediata de dados sensíveis da memória do formulário
        setSourceDisplayName('');
        setSourceM3uUrl('');
        setSourceXtreamEndpoint('');
        setSourceXtreamUser('');
        setSourceXtreamPass('');
        await loadDashboard();
      }
    } finally {
      setSourceLoading(false);
    }
  };

  // Desativar Fonte (C6)
  const handleDisableSource = async () => {
    if (!summary?.activeSource) return;
    const confirmed = window.confirm('Deseja realmente desativar esta fonte de autoatendimento? O dispositivo não receberá mais os dados de reprodução até que uma nova fonte seja ativada.');
    if (!confirmed) return;

    setFeedback(null);
    setSourceLoading(true);

    try {
      const res = await CustomerPortalService.disableSource(summary.activeSource.sourceId);
      if (!res.success) {
        setFeedback({ type: 'error', message: CustomerPortalService.mapErrorMessage(res.code, res.message) });
      } else {
        setFeedback({ type: 'success', message: 'Fonte desativada com sucesso.' });
        await loadDashboard();
      }
    } finally {
      setSourceLoading(false);
    }
  };

  // 1. Loading inicial do Portal
  if (isLoading) {
    return (
      <div className="portal-wrapper">
        <header className="portal-header">
          <div className="portal-brand">
            <span className="portal-logo-badge">XANDEFLIX</span>
            <span className="portal-title">Portal do Cliente</span>
          </div>
        </header>
        <main className="portal-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="portal-card portal-loading" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="portal-card-desc">Carregando informações da sua conta...</p>
          </div>
        </main>
      </div>
    );
  }

  // 2. Auth Guard: Se não autenticado, exibe formulário de login/cadastro
  if (!summary?.authenticated) {
    return (
      <div className="portal-wrapper">
        <header className="portal-header">
          <div className="portal-brand">
            <span className="portal-logo-badge">XANDEFLIX</span>
            <span className="portal-title">Portal do Cliente</span>
          </div>
          {onBack && (
            <button className="btn-secondary" onClick={onBack} type="button">
              Voltar ao App
            </button>
          )}
        </header>

        <main className="portal-content" style={{ maxWidth: '460px', margin: '4rem auto' }}>
          <div className="portal-card">
            <h2 className="portal-card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {authMode === 'signin' ? 'Acessar Minha Conta' : 'Criar Conta de Cliente'}
            </h2>
            <p className="portal-card-desc">
              Gerencie sua licença comercial, dispositivos autorizados e fontes de autoatendimento.
            </p>

            {feedback && (
              <div className={`portal-alert ${feedback.type}`} role="alert">
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="portal-form-group">
                  <label className="portal-label" htmlFor="portal-signup-nickname">
                    Nome de Usuário (Nickname)
                  </label>
                  <input
                    id="portal-signup-nickname"
                    className="portal-input"
                    type="text"
                    placeholder="Ex: Alexandre_Silva"
                    value={authNickname}
                    onChange={(e) => setAuthNickname(e.target.value)}
                    required
                    minLength={3}
                    maxLength={32}
                  />
                </div>
              )}

              <div className="portal-form-group">
                <label className="portal-label" htmlFor="portal-auth-email">
                  E-mail
                </label>
                <input
                  id="portal-auth-email"
                  className="portal-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div className="portal-form-group">
                <label className="portal-label" htmlFor="portal-auth-pass">
                  Senha
                </label>
                <input
                  id="portal-auth-pass"
                  className="portal-input"
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                className="btn-primary"
                type="submit"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={authLoading}
              >
                {authLoading ? 'Processando...' : authMode === 'signin' ? 'Entrar no Portal' : 'Cadastrar Conta'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#94a3b8' }}>
              {authMode === 'signin' ? (
                <>
                  Ainda não tem conta?{' '}
                  <button
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setAuthMode('signup'); setFeedback(null); }}
                    type="button"
                  >
                    Criar nova conta
                  </button>
                </>
              ) : (
                <>
                  Já tem conta registrada?{' '}
                  <button
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setAuthMode('signin'); setFeedback(null); }}
                    type="button"
                  >
                    Fazer login
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Onboarding: Se autenticado mas sem perfil de cliente
  if (summary.needsOnboarding) {
    return (
      <div className="portal-wrapper">
        <header className="portal-header">
          <div className="portal-brand">
            <span className="portal-logo-badge">XANDEFLIX</span>
            <span className="portal-title">Portal do Cliente</span>
          </div>
          <div className="portal-header-actions">
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{summary.userEmail}</span>
            <button className="btn-secondary" onClick={handleSignOut} type="button">
              Sair
            </button>
          </div>
        </header>

        <main className="portal-content" style={{ maxWidth: '480px', margin: '4rem auto' }}>
          <div className="portal-card">
            <h2 className="portal-card-title" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Bem-vindo ao Xandeflix!
            </h2>
            <p className="portal-card-desc">
              Para prosseguir, escolha um nome de usuário (nickname) para identificar sua conta comercial.
            </p>

            {feedback && (
              <div className={`portal-alert ${feedback.type}`} role="alert">
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleOnboardingSubmit}>
              <div className="portal-form-group">
                <label className="portal-label" htmlFor="portal-onboarding-nick">
                  Nome de Usuário (3 a 32 caracteres)
                </label>
                <input
                  id="portal-onboarding-nick"
                  className="portal-input"
                  type="text"
                  placeholder="Ex: Carlos_Silva"
                  value={onboardingNickname}
                  onChange={(e) => setOnboardingNickname(e.target.value)}
                  required
                  minLength={3}
                  maxLength={32}
                  autoFocus
                />
              </div>

              <button
                className="btn-primary"
                type="submit"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={onboardingLoading}
              >
                {onboardingLoading ? 'Salvando...' : 'Confirmar e Entrar no Portal'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // 4. Portal Autenticado Completo
  return (
    <div className="portal-wrapper">
      {/* Header Principal */}
      <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-logo-badge">XANDEFLIX</span>
          <span className="portal-title">Portal do Cliente</span>
        </div>

        <div className="portal-header-actions">
          <div className="portal-user-badge">
            <span className="portal-user-dot" />
            <span>{summary.profile?.nickname || summary.userEmail}</span>
          </div>
          <button className="btn-secondary" onClick={handleSignOut} type="button" title="Encerrar sessão">
            Sair
          </button>
          {onBack && (
            <button className="btn-secondary" onClick={onBack} type="button">
              Voltar ao App
            </button>
          )}
        </div>
      </header>

      {/* Barra de Navegação por Abas */}
      <nav className="portal-nav-bar" aria-label="Navegação do portal">
        <button
          className={`portal-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => changeTab('dashboard')}
          type="button"
        >
          📊 Início
        </button>
        <button
          className={`portal-nav-btn ${activeTab === 'license' ? 'active' : ''}`}
          onClick={() => changeTab('license')}
          type="button"
        >
          🔑 Minha Licença
        </button>
        <button
          className={`portal-nav-btn ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => changeTab('devices')}
          type="button"
        >
          📺 Meus Dispositivos
        </button>
        <button
          className={`portal-nav-btn ${activeTab === 'source' ? 'active' : ''}`}
          onClick={() => changeTab('source')}
          type="button"
        >
          📡 Minha Fonte
        </button>
        <button
          className={`portal-nav-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => changeTab('account')}
          type="button"
        >
          👤 Minha Conta
        </button>
        <button
          className={`portal-nav-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => changeTab('sessions')}
          type="button"
        >
          ⏱️ Sessões
        </button>
      </nav>

      {/* Conteúdo da Aba */}
      <main className="portal-content">
        {feedback && (
          <div className={`portal-alert ${feedback.type}`} role="alert">
            {feedback.message}
          </div>
        )}

        {/* ---------------- ABA 1: DASHBOARD ---------------- */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                Olá, {summary.profile?.nickname}!
              </h1>
              <p style={{ color: '#94a3b8' }}>
                Painel unificado de gerenciamento da sua conta comercial Xandeflix.
              </p>
            </div>

            <div className="portal-grid">
              {/* Card Licença */}
              <div className="portal-card">
                <div className="portal-card-header">
                  <span className="portal-card-title">🔑 Licença Comercial</span>
                  {summary.license ? (
                    <span className={`status-badge ${summary.license.status.toLowerCase()}`}>
                      {summary.license.status}
                    </span>
                  ) : (
                    <span className="status-badge disabled">NENHUMA</span>
                  )}
                </div>

                {summary.license ? (
                  <>
                    <div className="portal-card-value">
                      {summary.license.isTrial ? 'Período de Teste' : 'Licença Ativa'}
                    </div>
                    <p className="portal-card-desc">
                      {summary.license.isTrial
                        ? `${summary.license.daysRemaining} dias restantes de degustação gratuita.`
                        : 'Acesso comercial regular autorizado para reprodução.'}
                    </p>
                    <div className="portal-card-meta">
                      Modo: <strong>{summary.license.mode}</strong> • Dispositivos: <strong>{summary.license.activeDevicesCount} / {summary.license.maxDevices}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="portal-card-value" style={{ fontSize: '1.4rem' }}>
                      Nenhuma Licença Ativa
                    </div>
                    <p className="portal-card-desc">
                      Vincule um dispositivo via código de pareamento para iniciar seu teste gratuito de 7 dias.
                    </p>
                  </>
                )}

                <button
                  className="btn-secondary"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => changeTab('license')}
                  type="button"
                >
                  Ver Detalhes da Licença →
                </button>
              </div>

              {/* Card Dispositivos */}
              <div className="portal-card">
                <div className="portal-card-header">
                  <span className="portal-card-title">📺 Dispositivos</span>
                  <span className={`status-badge ${summary.deviceLoadError ? 'disabled' : 'active'}`}>
                    {summary.deviceLoadError
                      ? 'ERRO'
                      : `${summary.devices.length} / ${summary.license?.maxDevices || 1}`}
                  </span>
                </div>

                <div className="portal-card-value">
                  {summary.deviceLoadError ? 'DEVICE_LIST_LOAD_ERROR' : summary.devices.length}
                </div>
                <p className="portal-card-desc">
                  {summary.deviceLoadError
                    ? 'Erro ao obter dispositivos do servidor.'
                    : summary.devices.length === 0
                      ? 'Nenhum dispositivo pareado ainda.'
                      : `${summary.devices.length} dispositivo(s) autorizado(s) na sua conta.`}
                </p>

                <div className="portal-card-meta">
                  Limite contratual: <strong>{summary.license?.maxDevices || 1} tela(s)</strong>
                </div>

                <button
                  className="btn-secondary"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => changeTab('devices')}
                  type="button"
                >
                  Gerenciar Dispositivos →
                </button>
              </div>

              {/* Card Fonte de Transmissão */}
              <div className="portal-card">
                <div className="portal-card-header">
                  <span className="portal-card-title">📡 Minha Fonte</span>
                  {summary.activeSource ? (
                    <span className="status-badge active">ATIVA v{summary.activeSource.version}</span>
                  ) : (
                    <span className="status-badge disabled">NÃO CONFIGURADA</span>
                  )}
                </div>

                {summary.activeSource ? (
                  <>
                    <div className="portal-card-value" style={{ fontSize: '1.5rem' }}>
                      {summary.activeSource.displayName}
                    </div>
                    <p className="portal-card-desc">
                      Protocolo: <strong>{summary.activeSource.sourceType}</strong> • Versão do cofre: <strong>v{summary.activeSource.version}</strong>
                    </p>
                    <div className="portal-card-meta">
                      Segredos protegidos por cofre AES-256-GCM.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="portal-card-value" style={{ fontSize: '1.3rem' }}>
                      Autoatendimento
                    </div>
                    <p className="portal-card-desc">
                      Cadastre sua lista M3U ou servidor Xtream para entrega direta à TV.
                    </p>
                    <div className="portal-card-meta">
                      Conexão direta dispositivo-servidor (zero media proxy).
                    </div>
                  </>
                )}

                <button
                  className="btn-secondary"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => changeTab('source')}
                  type="button"
                >
                  Configurar Fonte →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- ABA 2: MINHA LICENÇA ---------------- */}
        {activeTab === 'license' && (
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Minha Licença Comercial
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Informações sobre seu plano, autorização de reprodução e limites contratuais.
            </p>

            {summary.license ? (
              <div className="portal-card" style={{ maxWidth: '720px' }}>
                <div className="portal-card-header">
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                      Licença {summary.license.mode === 'SELF_SERVICE' ? 'Autoatendimento' : 'Gerenciada'}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {summary.license.id}</span>
                  </div>
                  <span className={`status-badge ${summary.license.status.toLowerCase()}`}>
                    {summary.license.status}
                  </span>
                </div>

                {summary.license.isTrial && (
                  <div className="portal-alert trial" style={{ margin: '1rem 0' }}>
                    <div>
                      <strong>Período de Teste Gratuito</strong>
                      <p style={{ marginTop: '0.25rem' }}>
                        Seu teste iniciou com o pareamento do primeiro dispositivo e é válido por 7 dias corridos.
                        Restam aproximadamente <strong>{summary.license.daysRemaining} dia(s)</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {summary.license.status === 'EXPIRED' && (
                  <div className="portal-alert error" style={{ margin: '1rem 0' }}>
                    <div>
                      <strong>Seu período de teste terminou.</strong>
                      <p style={{ marginTop: '0.25rem' }}>
                        Para continuar desfrutando da reprodução direta na sua TV, ative sua licença comercial.
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
                  <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Status de Acesso</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem', color: summary.license.accessAllowed ? '#34d399' : '#f87171' }}>
                      {summary.license.accessAllowed ? 'AUTORIZADO' : 'BLOQUEADO'}
                    </p>
                  </div>
                  <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dispositivos Permitidos</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
                      {summary.license.activeDevicesCount} / {summary.license.maxDevices} tela(s)
                    </p>
                  </div>
                  <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sessões Concorrentes</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
                      {summary.license.maxConcurrentSessions} simultânea(s)
                    </p>
                  </div>
                  <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Horário do Servidor</span>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                      {summary.license.serverTime ? new Date(summary.license.serverTime).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* CTA Futuro de Pagamento (Informativo / Em Breve) */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => setFeedback({ type: 'info', message: 'O módulo de pagamento automático será integrado em etapa posterior (Gate C10). Entre em contato com o suporte para ativação antecipada.' })}
                  >
                    Ativar Licença Definitiva
                    <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      EM BREVE
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="portal-card" style={{ maxWidth: '640px' }}>
                <p className="portal-card-desc">Nenhuma licença vinculada a esta conta no momento.</p>
                <button className="btn-primary" onClick={() => changeTab('devices')} type="button">
                  Parear Dispositivo para Iniciar Teste →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- ABA 3: MEUS DISPOSITIVOS ---------------- */}
        {activeTab === 'devices' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  Meus Dispositivos
                </h1>
                <p style={{ color: '#94a3b8' }}>
                  Gerencie as televisões e aparelhos autorizados na sua conta comercial.
                </p>
              </div>
            </div>

            {/* Formulário de Pareamento C4 */}
            <div className="portal-card" style={{ marginBottom: '2rem', border: '1px solid rgba(168, 85, 247, 0.55)' }}>
              <h3 className="portal-card-title" style={{ marginBottom: '0.5rem' }}>
                Ativar dispositivo novo (A1)
              </h3>
              <p className="portal-card-desc">
                Informe o código e a chave exibidos no aplicativo. Depois escolha a fonte pelo ID opaco; não informe a URL da fonte aqui.
              </p>

              <form onSubmit={handleActivateDevice} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="portal-form-group" style={{ marginBottom: 0 }}>
                  <label className="portal-label" htmlFor="activation-display-code">
                    Código do dispositivo
                  </label>
                  <input
                    id="activation-display-code"
                    className="portal-input"
                    type="text"
                    placeholder="Ex: XF-6RWB-0WVS"
                    value={activationDisplayCode}
                    onChange={(e) => setActivationDisplayCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="portal-form-group" style={{ marginBottom: 0 }}>
                  <label className="portal-label" htmlFor="activation-key">
                    Chave exclusiva do dispositivo
                  </label>
                  <input
                    id="activation-key"
                    className="portal-input"
                    type="password"
                    placeholder="Cole a chave exibida no app"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value.trim())}
                    required
                  />
                </div>

                <div className="portal-form-group" style={{ marginBottom: 0 }}>
                  <label className="portal-label" htmlFor="activation-source-id">
                    ID da fonte
                  </label>
                  <input
                    id="activation-source-id"
                    className="portal-input"
                    type="text"
                    placeholder="src_... ou csrc_..."
                    value={activationSourceId}
                    onChange={(e) => setActivationSourceId(e.target.value.trim())}
                    required
                  />
                </div>

                <div className="portal-form-group" style={{ marginBottom: 0 }}>
                  <label className="portal-label" htmlFor="activation-label">
                    Identificação (opcional)
                  </label>
                  <input
                    id="activation-label"
                    className="portal-input"
                    type="text"
                    placeholder="Ex: Tablet Samsung"
                    value={activationDeviceLabel}
                    onChange={(e) => setActivationDeviceLabel(e.target.value)}
                  />
                </div>

                <button className="btn-primary" type="submit" disabled={activationLoading}>
                  {activationLoading ? 'Ativando...' : 'Ativar dispositivo'}
                </button>
              </form>
            </div>

            <div className="portal-card" style={{ marginBottom: '2rem' }}>
              <h3 className="portal-card-title" style={{ marginBottom: '0.5rem' }}>
                ➕ Parear Novo Dispositivo (TV)
              </h3>
              <p className="portal-card-desc">
                Digite o Código de Exibição e o Código de Pareamento de 6 dígitos que aparecem na tela da sua TV.
              </p>

              <form onSubmit={handlePairDevice} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="portal-form-group" style={{ marginBottom: 0 }}>
                  <label className="portal-label" htmlFor="pair-display-code">
                    Display Code
                  </label>
                  <input
                    id="pair-display-code"
                    className="portal-input"
                    type="text"
                    placeholder="Ex: XF-TV-A1B2"
                    value={pairDisplayCode}
                    onChange={(e) => setPairDisplayCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="portal-form-group" style={{ marginBottom: 0 }}>
                  <label className="portal-label" htmlFor="pair-code">
                    Código de Pareamento (6 dígitos)
                  </label>
                  <input
                    id="pair-code"
                    className="portal-input"
                    type="text"
                    placeholder="Ex: 123456"
                    value={pairCode}
                    maxLength={6}
                    onChange={(e) => setPairCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="portal-form-group" style={{ marginBottom: 0 }}>
                  <label className="portal-label" htmlFor="pair-label">
                    Identificação (Opcional)
                  </label>
                  <input
                    id="pair-label"
                    className="portal-input"
                    type="text"
                    placeholder="Ex: TV da Sala"
                    value={pairDeviceLabel}
                    onChange={(e) => setPairDeviceLabel(e.target.value)}
                  />
                </div>

                <button className="btn-primary" type="submit" disabled={pairLoading}>
                  {pairLoading ? 'Pareando...' : 'Confirmar Pareamento'}
                </button>
              </form>
            </div>

            {/* Lista de Dispositivos */}
            <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="portal-card-title">Dispositivos Autorizados</h3>
              </div>

              {summary.deviceLoadError ? (
                <div
                  style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '6px',
                    margin: '1.5rem',
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>
                    DEVICE_LIST_LOAD_ERROR
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                    Não foi possível carregar os dispositivos autorizados do servidor.
                  </p>
                </div>
              ) : summary.devices.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Nome / Identificação</th>
                        <th>Display Code</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th>Vinculado Em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.devices.map((dev) => (
                        <tr key={dev.deviceId}>
                          <td>
                            <strong>{dev.deviceLabel}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {dev.deviceId}</div>
                          </td>
                          <td><code>{dev.displayCode}</code></td>
                          <td>{dev.deviceType}</td>
                          <td>
                            <span className="status-badge active">{dev.status}</span>
                          </td>
                          <td style={{ color: '#94a3b8' }}>
                            {dev.boundAt ? new Date(dev.boundAt).toLocaleDateString() : 'Recente'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum dispositivo pareado nesta conta.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- ABA 4: MINHA FONTE DE AUTOATENDIMENTO ---------------- */}
        {activeTab === 'source' && (
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Minha Fonte de Autoatendimento
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Configure seus dados de lista M3U ou servidor Xtream. Os segredos são cifrados no cofre e entregues diretamente ao dispositivo.
            </p>

            {/* Regra de 1 fonte ativa por licença */}
            <div className="portal-alert info">
              ℹ️ <strong>Regra Canônica:</strong> Cada licença suporta exatamente 1 fonte ativa por vez. Ao cadastrar ou atualizar a fonte, a versão anterior é automaticamente rotacionada ou substituída.
            </div>

            {/* Fonte Ativa Atual (Sanitizada) */}
            {summary.activeSource && (
              <div className="portal-card" style={{ marginBottom: '2rem' }}>
                <div className="portal-card-header">
                  <div>
                    <h3 className="portal-card-title">{summary.activeSource.displayName}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {summary.activeSource.sourceId}</span>
                  </div>
                  <span className="status-badge active">ATIVA v{summary.activeSource.version}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
                  <div style={{ background: '#1f2937', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Protocolo</span>
                    <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>{summary.activeSource.sourceType}</p>
                  </div>
                  <div style={{ background: '#1f2937', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Versão Corrente</span>
                    <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>Versão {summary.activeSource.version}</p>
                  </div>
                  <div style={{ background: '#1f2937', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Data de Cadastro</span>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                      {new Date(summary.activeSource.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <button className="btn-danger" onClick={handleDisableSource} type="button" disabled={sourceLoading}>
                    Desativar Fonte
                  </button>
                </div>
              </div>
            )}

            {/* Formulário de Adicionar / Atualizar Fonte */}
            <div className="portal-card" style={{ maxWidth: '640px' }}>
              <h3 className="portal-card-title" style={{ marginBottom: '0.5rem' }}>
                {summary.activeSource ? 'Rotacionar / Atualizar Fonte' : 'Cadastrar Fonte de Conteúdo'}
              </h3>
              <p className="portal-card-desc">
                Suas credenciais são transmitidas em conexão segura TLS e cifradas com chave mestra no cofre.
              </p>

              <form onSubmit={handleSaveSource}>
                {/* Seletor de Protocolo */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    className={`btn-secondary ${sourceProtocol === 'M3U' ? 'active' : ''}`}
                    style={{ flex: 1, borderColor: sourceProtocol === 'M3U' ? '#e50914' : undefined }}
                    onClick={() => setSourceProtocol('M3U')}
                  >
                    Lista M3U / M3U8
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${sourceProtocol === 'XTREAM' ? 'active' : ''}`}
                    style={{ flex: 1, borderColor: sourceProtocol === 'XTREAM' ? '#e50914' : undefined }}
                    onClick={() => setSourceProtocol('XTREAM')}
                  >
                    Servidor Xtream Codes
                  </button>
                </div>

                <div className="portal-form-group">
                  <label className="portal-label" htmlFor="source-name">
                    Nome de Exibição da Fonte
                  </label>
                  <input
                    id="source-name"
                    className="portal-input"
                    type="text"
                    placeholder="Ex: Minha Lista Particular"
                    value={sourceDisplayName}
                    onChange={(e) => setSourceDisplayName(e.target.value)}
                    required
                  />
                </div>

                {sourceProtocol === 'M3U' ? (
                  <div className="portal-form-group">
                    <label className="portal-label" htmlFor="source-m3u-url">
                      URL da Playlist (M3U / M3U8)
                    </label>
                    <input
                      id="source-m3u-url"
                      className="portal-input"
                      type="url"
                      placeholder="https://provedor.exemplo.com/lista.m3u8"
                      value={sourceM3uUrl}
                      onChange={(e) => setSourceM3uUrl(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>
                ) : (
                  <>
                    <div className="portal-form-group">
                      <label className="portal-label" htmlFor="source-xtream-endpoint">
                        Servidor / Endpoint Xtream
                      </label>
                      <input
                        id="source-xtream-endpoint"
                        className="portal-input"
                        type="url"
                        placeholder="http://servidor.exemplo.com:8080"
                        value={sourceXtreamEndpoint}
                        onChange={(e) => setSourceXtreamEndpoint(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label" htmlFor="source-xtream-user">
                        Usuário Xtream
                      </label>
                      <input
                        id="source-xtream-user"
                        className="portal-input"
                        type="text"
                        placeholder="usuario123"
                        value={sourceXtreamUser}
                        onChange={(e) => setSourceXtreamUser(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </div>
                    <div className="portal-form-group">
                      <label className="portal-label" htmlFor="source-xtream-pass">
                        Senha Xtream
                      </label>
                      <input
                        id="source-xtream-pass"
                        className="portal-input"
                        type="password"
                        placeholder="••••••••"
                        value={sourceXtreamPass}
                        onChange={(e) => setSourceXtreamPass(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}

                <button
                  className="btn-primary"
                  type="submit"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={sourceLoading}
                >
                  {sourceLoading ? 'Cifrando e Salvando...' : summary.activeSource ? 'Rotacionar Credenciais' : 'Salvar no Cofre Privado'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- ABA 5: MINHA CONTA ---------------- */}
        {activeTab === 'account' && (
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Minha Conta
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
              Dados de perfil e identificação da sua conta comercial.
            </p>

            <div className="portal-card" style={{ maxWidth: '600px' }}>
              <h3 className="portal-card-title" style={{ marginBottom: '1rem' }}>
                Identificação do Cliente
              </h3>

              <div className="portal-form-group">
                <span className="portal-label">E-mail Cadastrado</span>
                <input className="portal-input" type="text" value={summary.userEmail || ''} disabled />
              </div>

              <div className="portal-form-group">
                <span className="portal-label">ID do Cliente</span>
                <input className="portal-input" type="text" value={summary.profile?.customerId || ''} disabled />
              </div>

              <form onSubmit={handleUpdateNickname} style={{ marginTop: '1rem' }}>
                <div className="portal-form-group">
                  <label className="portal-label" htmlFor="account-edit-nickname">
                    Nome de Usuário (Nickname)
                  </label>
                  <input
                    id="account-edit-nickname"
                    className="portal-input"
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    required
                    minLength={3}
                    maxLength={32}
                  />
                </div>

                <button className="btn-primary" type="submit" disabled={nicknameLoading}>
                  {nicknameLoading ? 'Atualizando...' : 'Salvar Novo Nickname'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ---------------- ABA 6: SESSÕES SIMULTÂNEAS (GATE C9) ---------------- */}
        {activeTab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  Sessões Concorrentes
                </h1>
                <p style={{ color: '#94a3b8' }}>
                  Monitoramento em tempo real de reproduções ativas nos seus dispositivos.
                </p>
              </div>
              <button
                type="button"
                className="portal-btn secondary"
                onClick={() => void loadSessions(summary?.license?.id)}
                disabled={sessionsLoading}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                {sessionsLoading ? 'Atualizando...' : '🔄 Atualizar'}
              </button>
            </div>

            <div className="portal-card" style={{ maxWidth: '850px', marginBottom: '1.5rem' }}>
              <div className="portal-card-header">
                <h3 className="portal-card-title">Resumo de Concorrência de Telas</h3>
                <span className="status-badge active">GATE C9 ATIVO</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: '#1f2937', padding: '1.25rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Limite Contratual</span>
                  <p style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.25rem', color: '#38bdf8' }}>
                    {summary?.license?.maxConcurrentSessions || 1} {((summary?.license?.maxConcurrentSessions || 1) === 1) ? 'Tela' : 'Telas'}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sessões simultâneas permitidas</span>
                </div>

                <div style={{ background: '#1f2937', padding: '1.25rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Em Reprodução Agora</span>
                  <p style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.25rem', color: '#4ade80' }}>
                    {playbackSessions.filter(s => s.status === 'ACTIVE').length} / {summary?.license?.maxConcurrentSessions || 1}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Slots atualmente em uso</span>
                </div>
              </div>

              <div className="portal-alert info" style={{ marginTop: '1rem' }}>
                ⏱️ <strong>Aviso Informativo:</strong> Controle de sessões simultâneas será disponibilizado em etapa posterior.
              </div>
            </div>

            <div className="portal-card" style={{ maxWidth: '850px' }}>
              <div className="portal-card-header">
                <h3 className="portal-card-title">Histórico e Sessões Recentes</h3>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {playbackSessions.length} {playbackSessions.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {sessionsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  Carregando sessões de reprodução...
                </div>
              ) : playbackSessions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhuma sessão de reprodução recente encontrada para esta licença.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #374151', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Dispositivo</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Tipo</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Início</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Último Pulso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playbackSessions.map((sess) => (
                        <tr key={sess.sessionId} style={{ borderBottom: '1px solid #1f2937' }}>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 600 }}>{sess.deviceLabel}</div>
                            <code style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sess.deviceDisplayCode}</code>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8' }}>
                            {sess.deviceType}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span className={`status-badge ${sess.status === 'ACTIVE' ? 'active' : 'trial'}`} style={{ fontSize: '0.75rem' }}>
                              {sess.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {new Date(sess.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {new Date(sess.lastHeartbeatAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
