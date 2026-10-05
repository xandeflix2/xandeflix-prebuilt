/**
 * Xandeflix Prebuilt — Manager Lab Panel (Experiment R7B / R6C)
 *
 * Painel de controle experimental de laboratório para gestão de licenças, aprovação de dispositivos,
 * ciclo de vida de fontes gerenciadas (edição, versionamento monotônico, teste de conexão sanitizado,
 * multi-device binding e preservação estrita de segredos).
 *
 * Princípios:
 * - DEBUG_ONLY: Ausente ou inerte em builds de produção (RELEASE_EXPOSURE=NAO).
 * - NO_SECRET_EXPOSURE: Senhas e tokens de fontes gerenciadas NUNCA são trafegados ou reexibidos em texto puro.
 * - SEPARATE_ENTITIES: LICENSE, DEVICE, MANAGED_SOURCE e DEVICE_SOURCE_BINDING são entidades desacopladas.
 * - MULTI_DEVICE: A mesma fonte gerenciada pode ser compartilhada por múltiplos dispositivos autorizados.
 * - MONOTONIC_VERSIONING: Cada alteração válida de fonte incrementa source_version sem desvincular aparelhos.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getControlPlaneEngine } from '../../control-plane/engine/control-plane-engine.ts';
import {
  getManagerRemoteControlPlaneAuthority,
  sanitizeManagerErrorMessage,
  type ManagerAuthSession,
  type ManagerManagedSourceConfig,
  type ManagerSourceType,
  type ManagerControlPlaneSnapshot,
  type ManagerVaultRuntimePreflight,
} from '../../control-plane/client/manager-remote-control-plane-authority.ts';
import type {
  LicenseEntity,
  DeviceEntity,
  ManagedSourceEntity,
  ManagerCustomerListItem,
  ManagerInstallationListItem,
  RemoteManagedSourceMetadata,
  DeviceSourceBindingEntity,
  ManagerLicenseListItem,
  ManagerCustomerSourceListItem,
  ManagerAuditLogItem,
  ManagerDeviceActivationEvent,
  ManagerDeviceSensitiveReveal,
  ManagerCustomerDetail,
  ManagerLicenseDetail,
  CustomerStatus,
  LicenseDeviceBindingEntity,
} from '../../control-plane/control-plane.types.ts';
import type { LicenseMode } from '../../device/device.types.ts';
import type { SourceType, SourceRuntimeConfig } from '../source/source-runtime-config.ts';
import type { ManagerDeviceReactivationRequest } from '../../control-plane/device-reactivation.types.ts';
import { getSupabaseRuntimeConfigStatus } from '../../integrations/supabase/runtime-config.ts';
import { AdminCustomersView } from './AdminCustomersView.tsx';
import { AdminLicensesView } from './AdminLicensesView.tsx';
import { AdminInstallationsView } from './AdminInstallationsView.tsx';
import { AdminAuditView } from './AdminAuditView.tsx';
import { AdminCustomerSourcesView } from './AdminCustomerSourcesView.tsx';
import {
  getPublicDeviceActivationService,
  type PublicDeviceActivationSession,
} from '../../control-plane/client/public-device-activation.service.ts';

interface ManagerPanelPageProps {
  onBack: () => void;
}

type SourceFeedback = {
  message: string;
  type: 'info' | 'success' | 'error';
};

function validateManagedSourceForm(
  name: string,
  protocol: SourceType,
  config: ManagerManagedSourceConfig,
): string | null {
  if (!name.trim()) return 'Informe o nome identificador da fonte.';
  if (protocol === 'AUTO') return 'Informe um protocolo explicito para a fonte.';

  if (protocol === 'M3U') {
    const playlistConfig = config as Extract<ManagerManagedSourceConfig, { playlistUrl: string }>;
    try {
      const parsed = new URL(playlistConfig.playlistUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'A URL M3U deve usar http ou https.';
      }
    } catch {
      return 'Informe uma URL M3U valida.';
    }
    return null;
  }

  try {
    const xtreamConfig = config as Extract<ManagerManagedSourceConfig, { endpoint: string }>;
    const parsed = new URL(xtreamConfig.endpoint);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'O endpoint XTREAM deve usar http ou https.';
    }
    if (parsed.username || parsed.password) {
      return 'O endpoint XTREAM nao deve conter credenciais na URL.';
    }
  } catch {
    return 'Informe um endpoint XTREAM valido.';
  }

  const xtreamConfig = config as Extract<ManagerManagedSourceConfig, { endpoint: string }>;
  if (!xtreamConfig.username.trim()) return 'Informe o usuario XTREAM.';
  if (!xtreamConfig.password) return 'Informe a senha XTREAM.';
  return null;
}

function asRemoteSourceMetadata(source: ManagedSourceEntity): RemoteManagedSourceMetadata {
  return {
    id: source.id,
    sourceId: source.id,
    name: source.name,
    sourceType: source.sourceType,
    version: source.version,
    status: source.status,
    vaultStatus: 'NOT_CONFIGURED',
    createdAtIso: source.createdAtIso,
    updatedAtIso: source.updatedAtIso,
  };
}

function isReactivationRequestExpired(request: ManagerDeviceReactivationRequest): boolean {
  const expiresAtMs = Date.parse(request.expiresAtIso);
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now();
}

function reactivationRequestStatusLabel(request: ManagerDeviceReactivationRequest, expired: boolean): string {
  if (expired || request.status === 'EXPIRED') return 'Solicitação expirada; aprovação/cancelamento indisponíveis';
  if (request.status === 'APPROVED') return 'Solicitação aprovada';
  if (request.status === 'CANCELLED') return 'Solicitação cancelada';
  if (request.status === 'CONSUMED') return 'Solicitação finalizada';
  return 'Solicitação encerrada';
}

export const ManagerPanelPage: React.FC<ManagerPanelPageProps> = ({ onBack }) => {
  const engine = getControlPlaneEngine();
  const managerRemote = getManagerRemoteControlPlaneAuthority();
  const supabaseRuntimeStatus = getSupabaseRuntimeConfigStatus();

  const [licenses, setLicenses] = useState<LicenseEntity[]>([]);
  const [devices, setDevices] = useState<DeviceEntity[]>([]);
  const [licenseBindings, setLicenseBindings] = useState<LicenseDeviceBindingEntity[]>([]);
  const [managedSources, setManagedSources] = useState<RemoteManagedSourceMetadata[]>([]);
  const [sourceBindings, setSourceBindings] = useState<DeviceSourceBindingEntity[]>([]);
  const [deviceReactivationRequests, setDeviceReactivationRequests] = useState<ManagerDeviceReactivationRequest[]>([]);
  const [reactivationBusyRequestId, setReactivationBusyRequestId] = useState<string | null>(null);
  const [installations, setInstallations] = useState<ManagerInstallationListItem[]>([]);
  const [customers, setCustomers] = useState<ManagerCustomerListItem[]>([]);
  const [activeTab, setActiveTab] = useState<'CLIENTES' | 'LICENCAS' | 'INSTALACOES' | 'DISPOSITIVOS' | 'FONTES' | 'AUDITORIA' | 'SISTEMA'>('CLIENTES');
  const [managerLicenses, setManagerLicenses] = useState<ManagerLicenseListItem[]>([]);
  const [customerSources, setCustomerSources] = useState<ManagerCustomerSourceListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<ManagerAuditLogItem[]>([]);
  const [deviceActivationEvents, setDeviceActivationEvents] = useState<ManagerDeviceActivationEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Criação de Licença
  const [newLicMode, setNewLicMode] = useState<LicenseMode>('MANAGED');
  const [newLicMaxDevices, setNewLicMaxDevices] = useState<number>(2);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  // Cadastro de Nova Fonte Gerenciada
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('XTREAM');
  const [sourceHost, setSourceHost] = useState('');
  const [sourceUser, setSourceUser] = useState('');
  const [sourcePass, setSourcePass] = useState('');
  const [sourcePlaylistUrl, setSourcePlaylistUrl] = useState('');
  const [sourceToken, setSourceToken] = useState('');

  // Edição de Fonte Existente (Modal / Inline)
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<SourceType>('XTREAM');
  const [editHost, setEditHost] = useState('');
  const [editUser, setEditUser] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editPlaylistUrl, setEditPlaylistUrl] = useState('');
  const [editToken, setEditToken] = useState('');

  // Vinculação Rápida
  const [selectedLicenseId, setSelectedLicenseId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'info' | 'success' | 'error'>('info');
  const [sourceFeedback, setSourceFeedback] = useState<Record<string, SourceFeedback>>({});
  const [sourceSaveLoading, setSourceSaveLoading] = useState<Record<string, boolean>>({});
  const [managerSession, setManagerSession] = useState<ManagerAuthSession | null>(null);
  const [managerAuthChecking, setManagerAuthChecking] = useState(false);
  const [managerAuthBusy, setManagerAuthBusy] = useState(false);
  const [managerAuthEmail, setManagerAuthEmail] = useState('');
  const [managerAuthPassword, setManagerAuthPassword] = useState('');
  const [managerAuthFeedback, setManagerAuthFeedback] = useState<string | null>(null);
  const [vaultPreflight, setVaultPreflight] = useState<ManagerVaultRuntimePreflight | null>(null);
  const [vaultPreflightBusy, setVaultPreflightBusy] = useState(false);
  const [revealedDeviceSensitive, setRevealedDeviceSensitive] = useState<Record<string, ManagerDeviceSensitiveReveal>>({});
  const [revealBusyDeviceId, setRevealBusyDeviceId] = useState<string | null>(null);
  const [deviceActivationCode, setDeviceActivationCode] = useState('');
  const [deviceActivationKey, setDeviceActivationKey] = useState('');
  const [deviceActivationSession, setDeviceActivationSession] = useState<PublicDeviceActivationSession | null>(null);
  const [deviceActivationBusy, setDeviceActivationBusy] = useState(false);
  const [activationFlowMode, setActivationFlowMode] = useState<'NEW_CUSTOMER' | 'EXISTING_CUSTOMER'>('NEW_CUSTOMER');
  const [assistedNewCustomerName, setAssistedNewCustomerName] = useState('');
  const [assistedExistingDeviceCode, setAssistedExistingDeviceCode] = useState('');
  const [assistedDeviceCode, setAssistedDeviceCode] = useState('');
  const [assistedDeviceKey, setAssistedDeviceKey] = useState('');
  const [assistedCustomerId, setAssistedCustomerId] = useState('');
  const [assistedLicenseId, setAssistedLicenseId] = useState('');
  const [showAmbiguitySelector, setShowAmbiguitySelector] = useState(false);
  const [assistedSourceName, setAssistedSourceName] = useState('');
  const [assistedSourceType, setAssistedSourceType] = useState<ManagerSourceType>('M3U');
  const [assistedPlaylistUrl, setAssistedPlaylistUrl] = useState('');
  const [assistedSourceHost, setAssistedSourceHost] = useState('');
  const [assistedSourceUser, setAssistedSourceUser] = useState('');
  const [assistedSourcePass, setAssistedSourcePass] = useState('');
  const [assistedSourceToken, setAssistedSourceToken] = useState('');
  const [assistedActivationBusy, setAssistedActivationBusy] = useState(false);

  const refreshData = useCallback(async (): Promise<ManagerControlPlaneSnapshot | undefined> => {
    setDataLoading(true);
    if (managerRemote) {
      try {
        const snapshot = await managerRemote.readControlPlane();
        setLicenses(snapshot.licenses);
        setDevices(snapshot.devices);
        setLicenseBindings(snapshot.licenseBindings || []);
        setManagedSources(snapshot.managedSources);
        setSourceBindings(snapshot.sourceBindings);
        try {
          setDeviceReactivationRequests(await managerRemote.listDeviceReactivationRequests());
        } catch {
          setDeviceReactivationRequests([]);
        }
        try {
          if (managerRemote.listInstallations) {
            setInstallations(await managerRemote.listInstallations());
          } else {
            setInstallations([]);
          }
        } catch {
          setInstallations([]);
        }
        try {
          if (managerRemote.listCustomers) {
            setCustomers(await managerRemote.listCustomers());
          } else {
            setCustomers([]);
          }
        } catch {
          setCustomers([]);
        }
        try {
          if (managerRemote.listLicenses) {
            setManagerLicenses(await managerRemote.listLicenses());
          } else {
            setManagerLicenses([]);
          }
        } catch {
          setManagerLicenses([]);
        }
        try {
          if (managerRemote.listCustomerSources) {
            setCustomerSources(await managerRemote.listCustomerSources());
          } else {
            setCustomerSources([]);
          }
        } catch {
          setCustomerSources([]);
        }
        try {
          if (managerRemote.listAuditLogs) {
            setAuditLogs(await managerRemote.listAuditLogs());
          } else {
            setAuditLogs([]);
          }
        } catch {
          setAuditLogs([]);
        }
        try {
          if (managerRemote.listDeviceActivationEvents) {
            setDeviceActivationEvents(await managerRemote.listDeviceActivationEvents());
          } else {
            setDeviceActivationEvents([]);
          }
        } catch {
          setDeviceActivationEvents([]);
        }
        return snapshot;
      } catch {
        // Nunca repopula a UI remota com a copia local stale.
        setLicenses([]);
        setDevices([]);
        setLicenseBindings([]);
        setManagedSources([]);
        setSourceBindings([]);
        setDeviceReactivationRequests([]);
        setInstallations([]);
        setCustomers([]);
        setManagerLicenses([]);
        setCustomerSources([]);
        setAuditLogs([]);
        setDeviceActivationEvents([]);
        return undefined;
      } finally {
        setDataLoading(false);
      }
    }

    setLicenses(engine.getAllLicenses());
    setDevices(engine.getAllDevices());
    setLicenseBindings(engine.getAllLicenseBindings ? engine.getAllLicenseBindings() : []);
    setManagedSources(engine.getAllManagedSources().map(asRemoteSourceMetadata));
    setSourceBindings(engine.getAllSourceBindings());
    setInstallations([]);
    setCustomers([]);
    setManagerLicenses([]);
    setCustomerSources([]);
    setAuditLogs([]);
    setDeviceActivationEvents([]);
    setDataLoading(false);
    return undefined;
  }, [engine, managerRemote]);

  useEffect(() => {
    if (!managerRemote) {
      void engine.loadSyncState().then(() => refreshData()).catch(() => refreshData());
      return;
    }

    let active = true;
    setManagerAuthChecking(true);
    void managerRemote.auth?.getSession()
      .then(async (session) => {
        if (!active) return;
        if (session && managerRemote.listCustomers) {
          try {
            await managerRemote.listCustomers();
            if (!active) return;
            setManagerSession(session);
            setManagerAuthChecking(false);
            void refreshData();
          } catch {
            if (!active) return;
            setManagerSession(null);
            setManagerAuthChecking(false);
            setManagerAuthFeedback('Acesso negado: o usuario autenticado nao possui privilegios de gestor (MANAGER_NOT_AUTHORIZED).');
            setLicenses([]);
            setDevices([]);
            setLicenseBindings([]);
            setManagedSources([]);
            setSourceBindings([]);
          }
        } else {
          setManagerSession(session);
          setManagerAuthChecking(false);
          if (session) {
            void refreshData();
          } else {
            setLicenses([]);
            setDevices([]);
            setLicenseBindings([]);
            setManagedSources([]);
            setSourceBindings([]);
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setManagerSession(null);
        setManagerAuthChecking(false);
        setLicenses([]);
        setDevices([]);
        setLicenseBindings([]);
        setManagedSources([]);
        setSourceBindings([]);
      });

    return () => {
      active = false;
    };
  }, [engine, managerRemote, refreshData]);

  const showFeedback = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setFeedback(msg);
    setFeedbackType(type);
  };

  const handleValidateDeviceCodeKey = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!managerSession) {
      showFeedback('AUTH_REQUIRED: autentique a sessao do gestor antes de validar.', 'error');
      return;
    }

    const displayCode = deviceActivationCode.trim().toUpperCase();
    const activationKey = deviceActivationKey.trim();
    if (!/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(displayCode)) {
      showFeedback('Informe um Codigo ID valido no formato XF-XXXX-XXXX.', 'error');
      return;
    }
    if (!/^[0-9]{6}$/.test(activationKey)) {
      showFeedback('Informe uma Chave de 6 digitos valida.', 'error');
      return;
    }

    setDeviceActivationBusy(true);
    setDeviceActivationSession(null);
    try {
      const result = await getPublicDeviceActivationService().start(displayCode, activationKey);
      if ('sessionToken' in result) {
        setDeviceActivationSession(result);
        setDeviceActivationKey('');
        showFeedback(
          'CODE_KEY_VALIDATED=SIM. SOURCE_SETUP_UNLOCKED=SIM. DEVICE_AUTHORIZED=NAO_AINDA.',
          'success',
        );
      } else {
        showFeedback(result.message || result.code || 'Codigo e chave nao validados.', 'error');
      }
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
    } finally {
      setDeviceActivationBusy(false);
    }
  };

  const handleManagerDeviceActivation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!managerRemote || !managerSession) {
      showFeedback('AUTH_REQUIRED: autentique a sessao Master antes de ativar.', 'error');
      return;
    }

    const displayCode = assistedDeviceCode.trim().toUpperCase();
    const activationKey = assistedDeviceKey.trim();

    if (!/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(displayCode)) {
      showFeedback('Informe um Codigo ID valido no formato XF-XXXX-XXXX para o novo dispositivo.', 'error');
      return;
    }
    if (!/^[0-9]{6}$/.test(activationKey)) {
      showFeedback('Informe uma Chave permanente de 6 digitos valida para o novo dispositivo.', 'error');
      return;
    }

    if (activationFlowMode === 'EXISTING_CUSTOMER') {
      if (!assistedCustomerId.trim()) {
        showFeedback('Selecione o cliente ja ativo.', 'error');
        return;
      }
      const existingCode = assistedExistingDeviceCode.trim().toUpperCase();
      if (!/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(existingCode)) {
        showFeedback('Informe o Codigo ID valido do dispositivo ja vinculado ao cliente (XF-XXXX-XXXX).', 'error');
        return;
      }

      setAssistedActivationBusy(true);
      try {
        const result = await managerRemote.activateSourceForDevice({
          flowMode: 'EXISTING_CUSTOMER',
          customerId: assistedCustomerId.trim(),
          existingDeviceCode: existingCode,
          displayCode,
          activationKey,
          ...(assistedLicenseId.trim() ? { licenseId: assistedLicenseId.trim() } : {}),
        });
        showFeedback(
          `MANAGER_PATH=AUTHORIZED. DEVICE_STATUS=${result.deviceAuthorizationState}. SOURCE_BINDING=${result.sourceBindingStatus}. SOURCE_RESOLUTION=${result.sourceResolution}. SOURCE_REUSED=SIM.`,
          'success',
        );
        setAssistedDeviceKey('');
        setAssistedLicenseId('');
        setShowAmbiguitySelector(false);
        await refreshData();
      } catch (error) {
        const sanitizedMsg = sanitizeManagerErrorMessage(error);
        if (sanitizedMsg.includes('MANAGED_LICENSE_AMBIGUOUS')) {
          setShowAmbiguitySelector(true);
          showFeedback(
            'Multiplas licencas elegiveis encontradas (MANAGED_LICENSE_AMBIGUOUS). Selecione a licenca desejada para prosseguir.',
            'error',
          );
        } else {
          showFeedback(sanitizedMsg, 'error');
        }
      } finally {
        setAssistedActivationBusy(false);
      }
      return;
    }

    // FLOW_A: NEW_CUSTOMER
    if (!assistedNewCustomerName.trim()) {
      showFeedback('Informe o Nome do cliente.', 'error');
      return;
    }
    if (!assistedSourceName.trim()) {
      showFeedback('Informe o nome da fonte.', 'error');
      return;
    }

    const sourceConfig: ManagerManagedSourceConfig = assistedSourceType === 'M3U'
      ? {
          playlistUrl: assistedPlaylistUrl.trim(),
          ...(assistedSourceToken.trim() ? { token: assistedSourceToken.trim() } : {}),
        }
      : {
          endpoint: assistedSourceHost.trim(),
          username: assistedSourceUser.trim(),
          password: assistedSourcePass,
          ...(assistedSourceToken.trim() ? { token: assistedSourceToken.trim() } : {}),
        };
    const validationError = validateManagedSourceForm(assistedSourceName, assistedSourceType, sourceConfig);
    if (validationError) {
      showFeedback(validationError, 'error');
      return;
    }

    setAssistedActivationBusy(true);
    try {
      const result = await managerRemote.activateSourceForDevice({
        flowMode: 'NEW_CUSTOMER',
        newCustomerName: assistedNewCustomerName.trim(),
        displayCode,
        activationKey,
        name: assistedSourceName.trim(),
        protocol: assistedSourceType,
        sourceConfig,
      });
      showFeedback(
        `MANAGER_PATH=AUTHORIZED. DEVICE_STATUS=${result.deviceAuthorizationState}. SOURCE_BINDING=${result.sourceBindingStatus}. SOURCE_RESOLUTION=${result.sourceResolution}.`,
        'success',
      );
      setAssistedDeviceKey('');
      setAssistedSourcePass('');
      setAssistedNewCustomerName('');
      setShowAmbiguitySelector(false);
      await refreshData();
    } catch (error) {
      const sanitizedMsg = sanitizeManagerErrorMessage(error);
      showFeedback(sanitizedMsg, 'error');
    } finally {
      setAssistedActivationBusy(false);
    }
  };

  const showSourceFeedback = (
    sourceId: string,
    message: string,
    type: SourceFeedback['type'] = 'info',
  ) => {
    setSourceFeedback((current) => ({ ...current, [sourceId]: { message, type } }));
  };

  const clearEditSecretFields = () => {
    setEditUser('');
    setEditPass('');
    setEditPlaylistUrl('');
    setEditToken('');
  };

  const fallbackLocalLicenses: ManagerLicenseListItem[] = licenses.map((l) => ({
    licenseId: l.id,
    customerId: l.customerId ?? null,
    customerNickname: null,
    mode: l.mode,
    status: l.status,
    trialEligible: Boolean(l.trialEligible),
    trialStartedAt: l.trialStartedAtIso ?? null,
    trialExpiresAt: l.trialExpiresAtIso ?? null,
    maxDevices: l.maxDevices,
    maxConcurrentSessions: l.maxConcurrentSessions ?? 1,
    activeDeviceCount: devices.filter((d) => d.status === 'AUTHORIZED').length,
    createdAt: l.createdAtIso,
    expiresAt: l.expiresAtIso ?? null,
  }));

  const handleInspectCustomer = async (customerId: string): Promise<ManagerCustomerDetail | null> => {
    if (!managerRemote?.getCustomerDetail) return null;
    try {
      return await managerRemote.getCustomerDetail(customerId);
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
      return null;
    }
  };

  const handleUpdateCustomerStatus = async (
    customerId: string,
    status: CustomerStatus,
    reason?: string,
  ): Promise<boolean> => {
    if (!managerRemote?.updateCustomerStatus) {
      showFeedback('Autoridade remota de status de cliente indisponível.', 'error');
      return false;
    }
    try {
      const result = await managerRemote.updateCustomerStatus(customerId, status, reason);
      showFeedback(`Status do cliente alterado para ${result.status} com sucesso.`, 'success');
      await refreshData();
      return true;
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
      return false;
    }
  };

  const handleInspectLicense = async (licenseId: string): Promise<ManagerLicenseDetail | null> => {
    if (!managerRemote?.getLicenseDetail) return null;
    try {
      return await managerRemote.getLicenseDetail(licenseId);
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
      return null;
    }
  };

  const handleUpdateLimits = async (
    licenseId: string,
    maxDevices: number,
    maxConcurrentSessions: number,
    reason?: string,
  ): Promise<boolean> => {
    if (!managerRemote?.updateLicenseLimits) {
      showFeedback('Autoridade remota de limites de licença indisponível.', 'error');
      return false;
    }
    try {
      const result = await managerRemote.updateLicenseLimits(licenseId, maxDevices, maxConcurrentSessions, reason);
      showFeedback(`Limites atualizados: Máx Disp=${result.maxDevices}, Sessões=${result.maxConcurrentSessions}.`, 'success');
      await refreshData();
      return true;
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
      return false;
    }
  };

  const handleSuspendLicense = async (licenseId: string, reason?: string): Promise<boolean> => {
    if (!managerRemote?.suspendLicense) {
      showFeedback('Autoridade remota de suspensão de licença indisponível.', 'error');
      return false;
    }
    try {
      await managerRemote.suspendLicense(licenseId, reason);
      showFeedback(`Licença ${licenseId} suspensa com sucesso.`, 'info');
      await refreshData();
      return true;
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
      return false;
    }
  };

  const handleRevokeLicense = async (licenseId: string, reason?: string): Promise<boolean> => {
    if (!managerRemote?.revokeLicense) {
      showFeedback('Autoridade remota de revogação de licença indisponível.', 'error');
      return false;
    }
    try {
      await managerRemote.revokeLicense(licenseId, reason);
      showFeedback(`Licença ${licenseId} revogada com sucesso.`, 'error');
      await refreshData();
      return true;
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
      return false;
    }
  };

  const handleActivateLicense = async (licenseId: string, reason: string, validUntil?: string | null): Promise<boolean> => {
    if (!managerRemote?.activateLicenseManual) {
      showFeedback('Autoridade remota de ativação de licença indisponível.', 'error');
      return false;
    }
    try {
      const result = await managerRemote.activateLicenseManual(
        licenseId,
        reason,
        validUntil || null,
      );
      showFeedback(`Licença ${result.licenseId} ativada comercialmente com sucesso (Status: ${result.newStatus}).`, 'success');
      await refreshData();
      return true;
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
      return false;
    }
  };

  const handleManagerSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!managerRemote?.auth || !managerAuthEmail.trim() || !managerAuthPassword) {
      setManagerAuthFeedback('Informe email e senha para autenticar a sessao do gestor.');
      return;
    }

    setManagerAuthBusy(true);
    setManagerAuthFeedback(null);
    try {
      const session = await managerRemote.auth.signInWithPassword(
        managerAuthEmail.trim(),
        managerAuthPassword,
      );
      // Validação estrita de autoridade de gestor antes de conceder acesso privilegiado
      if (managerRemote.listCustomers) {
        await managerRemote.listCustomers();
      }
      setManagerSession(session);
      setManagerAuthPassword('');
      setManagerAuthFeedback('Sessao do gestor autenticada.');
      await refreshData();
    } catch (error) {
      try {
        await managerRemote.auth.signOut();
      } catch {}
      setManagerSession(null);
      setManagerAuthFeedback(sanitizeManagerErrorMessage(error));
    } finally {
      setManagerAuthBusy(false);
    }
  };

  const handleManagerSignOut = async () => {
    if (!managerRemote?.auth) return;
    setManagerAuthBusy(true);
    try {
      await managerRemote.auth.signOut();
      setManagerSession(null);
      setManagerAuthPassword('');
      setManagedSources([]);
      setLicenses([]);
      setDevices([]);
      setSourceBindings([]);
      setDeviceReactivationRequests([]);
      setInstallations([]);
      setCustomers([]);
      setManagerLicenses([]);
      setCustomerSources([]);
      setAuditLogs([]);
      setDeviceActivationEvents([]);
      setEditingSourceId(null);
      setSourceFeedback({});
      setManagerAuthFeedback('Sessao do gestor encerrada.');
    } catch (error) {
      setManagerAuthFeedback(sanitizeManagerErrorMessage(error));
    } finally {
      setManagerAuthBusy(false);
    }
  };

  const handleVaultRuntimePreflight = async () => {
    if (!managerRemote || !managerSession) {
      setManagerAuthFeedback('Sessao autenticada do gestor obrigatoria para o preflight do vault.');
      return;
    }

    setVaultPreflightBusy(true);
    setVaultPreflight(null);
    try {
      const result = await managerRemote.runVaultRuntimePreflight();
      setVaultPreflight(result);
      setManagerAuthFeedback('Preflight sanitizado do runtime do vault concluido.');
    } catch (error) {
      setManagerAuthFeedback(sanitizeManagerErrorMessage(error));
    } finally {
      setVaultPreflightBusy(false);
    }
  };

  // ---------------------------------------------------------------------------
  // LICENÇAS & DISPOSITIVOS
  // ---------------------------------------------------------------------------

  const handleCreateLicense = async () => {
    if (managerRemote) {
      showFeedback('Criacao de licenca remota ainda nao faz parte deste ciclo; operacao local bloqueada.', 'error');
      return;
    }
    const res = await engine.createLicense(
      newLicMode,
      newLicMode === 'SELF_SERVICE' ? 1 : newLicMaxDevices
    );
    setCreatedRawKey(res.rawKey);
    showFeedback(`Licença ${newLicMode} criada com sucesso. Copie a chave abaixo.`, 'success');
    await engine.saveSyncState();
    refreshData();
  };

  const handleApproveDevice = async (deviceId: string) => {
    if (managerRemote) {
      showFeedback('Aprovacao de dispositivo remota ainda nao faz parte deste ciclo; operacao local bloqueada.', 'error');
      return;
    }
    const ok = await engine.managerApproveDevice(deviceId);
    if (ok) {
      showFeedback(`Dispositivo ${deviceId} aprovado com sucesso!`, 'success');
    } else {
      showFeedback(`Falha ao aprovar dispositivo (limite de slots atingido ou licença inativa).`, 'error');
    }
    await engine.saveSyncState();
    refreshData();
  };

  // Troca de Fonte do Dispositivo (R6C-R2)
  const [switchingDeviceId, setSwitchingDeviceId] = useState<string | null>(null);
  const [switchTargetSourceId, setSwitchTargetSourceId] = useState<string>('');

  const handleSwitchDeviceSource = async (deviceId: string, targetSourceId: string) => {
    if (!targetSourceId) {
      showFeedback('Selecione uma fonte ativa para vincular ao dispositivo.', 'error');
      return;
    }
    if (managerRemote) {
      try {
        const res = await managerRemote.switchDeviceSource(deviceId, targetSourceId);
        const snapshot = await refreshData();
        const newSrc = snapshot?.managedSources.find((source) => source.sourceId === (res.newSourceId || targetSourceId));
        const dev = snapshot?.devices.find((device) => device.deviceId === deviceId);
        showFeedback(
          `Fonte do dispositivo ${dev?.displayCode || deviceId} comutada com sucesso para "${newSrc?.name || targetSourceId}".`,
          'success'
        );
        setSwitchingDeviceId(null);
        setSwitchTargetSourceId('');
      } catch (error) {
        showFeedback(sanitizeManagerErrorMessage(error), 'error');
      }
      return;
    }

    const res = await engine.managerSwitchDeviceSourceBinding(deviceId, targetSourceId);
    if (res.success) {
      const newSrc = managedSources.find((s) => s.sourceId === targetSourceId);
      const dev = devices.find((d) => d.deviceId === deviceId);
      showFeedback(
        `Fonte do dispositivo ${dev?.displayCode || deviceId} comutada com sucesso para "${newSrc?.name || targetSourceId}".`,
        'success'
      );
      setSwitchingDeviceId(null);
      setSwitchTargetSourceId('');
      await engine.saveSyncState();
      refreshData();
    } else {
      showFeedback(`Erro ao comutar fonte do dispositivo: ${res.reason}`, 'error');
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (managerRemote) {
      showFeedback('Revogacao de dispositivo remota ainda nao faz parte deste ciclo; operacao local bloqueada.', 'error');
      return;
    }
    await engine.managerRevokeDevice(deviceId);
    showFeedback(`Dispositivo ${deviceId} revogado da licença.`, 'info');
    await engine.saveSyncState();
    refreshData();
  };

  const handleApproveDeviceReactivation = async (request: ManagerDeviceReactivationRequest) => {
    if (!managerRemote || reactivationBusyRequestId) return;
    if (request.status !== 'PENDING') {
      showFeedback('A solicitação não está pendente e não pode ser aprovada.', 'error');
      return;
    }
    if (isReactivationRequestExpired(request)) {
      showFeedback('A solicitação de reativação expirou e não pode ser aprovada.', 'error');
      return;
    }

    setReactivationBusyRequestId(request.requestId);
    try {
      const result = await managerRemote.approveDeviceReactivation(request.requestId);
      if (!result.success || result.resultCode !== 'REQUEST_APPROVED') {
        showFeedback(`Falha ao aprovar recovery: ${result.resultCode}`, 'error');
        return;
      }
      showFeedback(`Recovery autorizado para ${request.displayCode}; o dispositivo pode verificar a aprovação.`, 'success');
      await refreshData();
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
    } finally {
      setReactivationBusyRequestId(null);
    }
  };

  const handleCancelDeviceReactivation = async (request: ManagerDeviceReactivationRequest) => {
    if (!managerRemote || reactivationBusyRequestId) return;
    if (request.status !== 'PENDING' && request.status !== 'APPROVED') {
      showFeedback('A solicitação já está encerrada e não pode ser cancelada novamente.', 'error');
      return;
    }
    if (isReactivationRequestExpired(request)) {
      showFeedback('A solicitação de reativação expirou e não pode ser cancelada.', 'error');
      return;
    }

    setReactivationBusyRequestId(request.requestId);
    try {
      const result = await managerRemote.cancelDeviceReactivation(request.requestId);
      if (!result.success || (result.resultCode !== 'REQUEST_CANCELLED' && result.resultCode !== 'REQUEST_ALREADY_CANCELLED')) {
        showFeedback(`Falha ao cancelar solicitação: ${result.resultCode}`, 'error');
        return;
      }
      showFeedback(`Solicitação cancelada para ${request.displayCode}; dispositivo, licença e vínculo preservados.`, 'success');
      await refreshData();
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
    } finally {
      setReactivationBusyRequestId(null);
    }
  };

  const handleRevealDeviceSensitive = async (deviceId: string) => {
    if (!managerRemote || revealBusyDeviceId) return;
    if (revealedDeviceSensitive[deviceId]) {
      setRevealedDeviceSensitive((current) => {
        const next = { ...current };
        delete next[deviceId];
        return next;
      });
      return;
    }

    setRevealBusyDeviceId(deviceId);
    try {
      const result = await managerRemote.revealDeviceSensitiveData(deviceId);
      setRevealedDeviceSensitive((current) => ({ ...current, [deviceId]: result }));
      showFeedback('Dados protegidos revelados somente nesta sessao do Gestor Master e registrados na auditoria.', 'info');
    } catch (error) {
      showFeedback(sanitizeManagerErrorMessage(error), 'error');
    } finally {
      setRevealBusyDeviceId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // FONTES GERENCIADAS — CADASTRO, EDIÇÃO, PROBE, BINDING, UNBIND, DISABLE
  // ---------------------------------------------------------------------------

  const handleCreateSource = async () => {
    if (!sourceName.trim()) {
      showFeedback('Informe o nome identificador da fonte.', 'error');
      return;
    }
    if (!managerRemote?.auth) {
      showFeedback('AUTH_REQUIRED: sessao autenticada do gestor obrigatoria para gravar uma fonte.', 'error');
      return;
    }

    const managerSessionNow = await managerRemote.auth.getSession();
    if (!managerSessionNow) {
      showFeedback('AUTH_REQUIRED: autentique a sessao do gestor antes de gravar.', 'error');
      return;
    }

    if (!managerRemote && sourceType === 'XTREAM' && !sourceHost.trim()) {
      showFeedback('Host do servidor XTREAM é obrigatório.', 'error');
      return;
    }

    if (!managerRemote && sourceType === 'M3U' && !sourcePlaylistUrl.trim()) {
      showFeedback('URL da playlist M3U é obrigatória.', 'error');
      return;
    }

    if (sourceType === 'AUTO') {
      showFeedback('Informe um protocolo explicito para a fonte.', 'error');
      return;
    }

    if (managerRemote) {
      try {
        if (sourceType === 'XTREAM' && (!sourceHost.trim() || !sourceUser.trim() || !sourcePass.trim())) {
          showFeedback('XTREAM exige endpoint, usuÃ¡rio e senha para substituir a configuraÃ§Ã£o protegida.', 'error');
          return;
        }
        if (sourceType === 'M3U' && !sourcePlaylistUrl.trim()) {
          showFeedback('URL da playlist M3U Ã© obrigatÃ³ria para a configuraÃ§Ã£o protegida.', 'error');
          return;
        }

        const protocol = sourceType as ManagerSourceType;
        const sourceConfig: ManagerManagedSourceConfig = protocol === 'XTREAM'
          ? {
              endpoint: sourceHost.trim(),
              username: sourceUser.trim(),
              password: sourcePass,
              ...(sourceToken.trim() ? { token: sourceToken.trim() } : {}),
            }
          : {
              playlistUrl: sourcePlaylistUrl.trim(),
              ...(sourceToken.trim() ? { token: sourceToken.trim() } : {}),
            };

        const validationError = validateManagedSourceForm(sourceName, protocol, sourceConfig);
        if (validationError) {
          showFeedback(validationError, 'error');
          return;
        }

        const result = await managerRemote.createManagedSourceWithConfig({
          name: sourceName.trim(),
          protocol,
          sourceConfig,
        });
        const snapshot = await refreshData();
        const persisted = snapshot?.managedSources.find((source) => source.sourceId === result.sourceId);
        if (!persisted) throw new Error('REMOTE_MANAGER_REREAD_MISMATCH');
        setSourceName('');
        setSourceHost('');
        setSourceUser('');
        setSourcePass('');
        setSourcePlaylistUrl('');
        setSourceToken('');
        showFeedback(`Fonte gerenciada e configuraÃ§Ã£o protegida salvas server-side (v${persisted.version}).`, 'success');
      } catch (error) {
        showFeedback(sanitizeManagerErrorMessage(error), 'error');
      }
      return;
    }

    const newSourceConfig: SourceRuntimeConfig = {
      type: sourceType,
      host: sourceHost.trim() || undefined,
      username: sourceUser.trim() || undefined,
      password: sourcePass.trim() || undefined,
      playlistUrl: sourcePlaylistUrl.trim() || undefined,
    };
    await engine.managerCreateManagedSource(sourceName.trim(), newSourceConfig);

    setSourceName('');
    setSourceHost('');
    setSourceUser('');
    setSourcePass('');
    setSourcePlaylistUrl('');
    setSourceToken('');
    showFeedback('Fonte gerenciada salva com versão inicial v1 e cifrada com AES-256-GCM.', 'success');
    await engine.saveSyncState();
    refreshData();
  };

  const handleStartEditSource = (src: RemoteManagedSourceMetadata) => {
    setEditingSourceId(src.sourceId);
    setEditName(src.name);
    setEditType(src.sourceType);
    setEditHost('');
    // NUNCA preenche com credenciais existentes: mantém vazios para indicar "Manter valor atual"
    setEditUser('');
    setEditPass('');
    setEditPlaylistUrl('');
    setEditToken('');
  };

  const handleCancelEdit = () => {
    setEditingSourceId(null);
  };

  const handleSaveSourceEdit = async (sourceId: string) => {
    const currentSource = managedSources.find((source) => source.sourceId === sourceId);
    if (!currentSource) {
      showSourceFeedback(sourceId, 'Fonte gerenciada nao encontrada no snapshot remoto.', 'error');
      return;
    }
    if (sourceSaveLoading[sourceId]) return;
    if (!managerRemote?.auth) {
      showSourceFeedback(sourceId, 'AUTH_REQUIRED: sessao autenticada do gestor obrigatoria.', 'error');
      return;
    }

    const session = await managerRemote.auth.getSession();
    if (!session) {
      setManagerSession(null);
      showSourceFeedback(sourceId, 'AUTH_REQUIRED: autentique a sessao do gestor antes de salvar.', 'error');
      return;
    }
    if (editType === 'AUTO') {
      showSourceFeedback(sourceId, 'Informe um protocolo explicito para a fonte.', 'error');
      return;
    }

    const concreteEditType: ManagerSourceType = editType;
    const sourceConfig: ManagerManagedSourceConfig = concreteEditType === 'XTREAM'
      ? {
          endpoint: editHost.trim(),
          username: editUser.trim(),
          password: editPass,
          ...(editToken.trim() ? { token: editToken.trim() } : {}),
        }
      : {
          playlistUrl: editPlaylistUrl.trim(),
          ...(editToken.trim() ? { token: editToken.trim() } : {}),
        };
    const validationError = validateManagedSourceForm(editName, concreteEditType, sourceConfig);
    if (validationError) {
      showSourceFeedback(sourceId, validationError, 'error');
      return;
    }

    setSourceSaveLoading((current) => ({ ...current, [sourceId]: true }));
    showSourceFeedback(sourceId, 'Salvando configuracao protegida...', 'info');
    try {
      const result = await managerRemote.updateManagedSourceConfig({
        sourceId,
        expectedVersion: currentSource.version,
        name: editName.trim(),
        protocol: concreteEditType,
        sourceConfig,
      });
      const persisted: RemoteManagedSourceMetadata = result.source ?? {
        ...currentSource,
        name: result.name ?? editName.trim(),
        sourceType: result.protocol ?? concreteEditType,
        version: result.sourceVersion ?? currentSource.version + 1,
        status: result.sourceStatus ?? currentSource.status,
        vaultStatus: result.vaultStatus ?? 'CONFIGURED',
        updatedAtIso: new Date().toISOString(),
      };
      setManagedSources((current) => current.map((source) => (
        source.sourceId === sourceId ? persisted : source
      )));
      setEditingSourceId(null);
      setEditHost('');
      clearEditSecretFields();
      showSourceFeedback(
        sourceId,
        `Fonte "${persisted.name}" salva com sucesso. Versao persistida: v${persisted.version}.`,
        'success',
      );
    } catch (error) {
      showSourceFeedback(sourceId, sanitizeManagerErrorMessage(error), 'error');
    } finally {
      setSourceSaveLoading((current) => {
        const next = { ...current };
        delete next[sourceId];
        return next;
      });
    }
  };

  const handleToggleSourceStatus = async (src: RemoteManagedSourceMetadata) => {
    if (!managerRemote?.auth) {
      showSourceFeedback(src.sourceId, 'AUTH_REQUIRED: sessao autenticada do gestor obrigatoria.', 'error');
      return;
    }
    if (managerRemote) {
      try {
        const nextStatus = src.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        await managerRemote.setManagedSourceStatus(src.sourceId, nextStatus);
        const snapshot = await refreshData();
        const persisted = snapshot?.managedSources.find((source) => source.sourceId === src.sourceId);
        if (!persisted) {
          throw new Error('REMOTE_MANAGER_REREAD_MISMATCH');
        }
        showFeedback(
          `Fonte "${persisted.name}" ${persisted.status === 'DISABLED' ? 'desativada' : 'reativada'} remotamente com sucesso.`,
          persisted.status === 'DISABLED' ? 'info' : 'success'
        );
      } catch (error) {
        showFeedback(sanitizeManagerErrorMessage(error), 'error');
      }
      return;
    }

    if (src.status === 'ACTIVE') {
      await engine.managerDisableSource(src.id);
      showFeedback(`Fonte "${src.name}" desativada temporariamente.`, 'info');
    } else {
      await engine.managerEnableSource(src.id);
      showFeedback(`Fonte "${src.name}" reativada com sucesso.`, 'success');
    }
    await engine.saveSyncState();
    refreshData();
  };

  const handleUnbindDevice = async (deviceId: string, sName: string) => {
    if (managerRemote) {
      try {
        await managerRemote.unbindDeviceSource(deviceId);
        const snapshot = await refreshData();
        if (snapshot?.sourceBindings.some((binding) => binding.deviceId === deviceId)) {
          throw new Error('REMOTE_MANAGER_REREAD_MISMATCH');
        }
        showFeedback(`Dispositivo ${deviceId} desvinculado remotamente da fonte "${sName}".`, 'info');
      } catch (error) {
        showFeedback(sanitizeManagerErrorMessage(error), 'error');
      }
      return;
    }

    const res = await engine.managerUnbindDeviceSource(deviceId);
    if (res.success) {
      showFeedback(`Dispositivo ${deviceId} desvinculado da fonte "${sName}". O dispositivo continua autorizado na licença.`, 'info');
    } else {
      showFeedback(`Erro ao desvincular: ${res.reason}`, 'error');
    }
    await engine.saveSyncState();
    refreshData();
  };

  const handleBindDeviceToSource = async (licenseId: string, deviceId: string, sourceId: string) => {
    if (managerRemote) {
      try {
        await managerRemote.bindDeviceSource(licenseId, deviceId, sourceId);
        const snapshot = await refreshData();
        const persisted = snapshot?.sourceBindings.find(
          (binding) => binding.deviceId === deviceId && binding.sourceId === sourceId
        );
        if (!persisted) {
          throw new Error('REMOTE_MANAGER_REREAD_MISMATCH');
        }
        showFeedback('Dispositivo vinculado remotamente a fonte com sucesso.', 'success');
      } catch (error) {
        showFeedback(sanitizeManagerErrorMessage(error), 'error');
      }
      return;
    }

    const res = await engine.managerBindSource(licenseId, deviceId, sourceId);
    if (res.success) {
      showFeedback('Dispositivo vinculado à fonte com sucesso.', 'success');
    } else {
      showFeedback(`Erro ao vincular dispositivo: ${res.reason}`, 'error');
    }
    await engine.saveSyncState();
    refreshData();
  };

  return (
    <div
      className="manager-panel-page"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1d',
        color: '#f8fafc',
        padding: '2rem',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {managerRemote ? 'MANAGER REMOTE (SUPABASE AUTH)' : 'MANAGER LAB (R7C/R6C)'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Ciclo de Vida de Fontes & Multi-Device
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Painel do Gestor de Licenças & Fontes
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="focusable-item"
              onClick={() => {
                if (managerRemote) {
                  void refreshData().then((snapshot) => {
                    showFeedback(
                      snapshot
                        ? 'Dados do Plano de Controle remoto recarregados com sucesso.'
                        : 'Falha ao recarregar o Control Plane remoto.',
                      snapshot ? 'info' : 'error'
                    );
                  });
                  return;
                }
                void engine.loadSyncState().then(() => {
                  void refreshData();
                  showFeedback('Dados do Plano de Controle recarregados com sucesso.', 'info');
                });
              }}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f8fafc',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              🔄 Atualizar Dispositivos
            </button>

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
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              ← Voltar
            </button>
          </div>
        </div>

        {managerRemote ? (
          <div
            style={{
              backgroundColor: '#101624',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              marginBottom: '1.5rem',
            }}
          >
            {managerAuthChecking ? (
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Verificando sessao do gestor...</span>
            ) : managerSession ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#34d399', fontSize: '0.85rem' }}>
                  Sessao Manager autenticada para operacoes privilegiadas.
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="focusable-item"
                    disabled={vaultPreflightBusy}
                    onClick={() => void handleVaultRuntimePreflight()}
                    style={{
                      padding: '0.45rem 0.9rem',
                      backgroundColor: '#0f766e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: vaultPreflightBusy ? 'wait' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {vaultPreflightBusy ? 'Verificando vault...' : 'Preflight do vault'}
                  </button>
                  <button
                    type="button"
                    className="focusable-item"
                    disabled={managerAuthBusy}
                    onClick={() => void handleManagerSignOut()}
                    style={{
                      padding: '0.45rem 0.9rem',
                      backgroundColor: '#475569',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: managerAuthBusy ? 'wait' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    Encerrar sessao
                  </button>
                </div>
              </div>
            ) : managerRemote.auth ? (
              <form onSubmit={(event) => void handleManagerSignIn(event)} style={{ display: 'flex', alignItems: 'end', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Email do gestor
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={managerAuthEmail}
                    onChange={(event) => setManagerAuthEmail(event.target.value)}
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div style={{ minWidth: '180px', flex: '1 1 180px' }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={managerAuthPassword}
                    onChange={(event) => setManagerAuthPassword(event.target.value)}
                    style={{ width: '100%', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <button
                  type="submit"
                  className="focusable-item"
                  disabled={managerAuthBusy}
                  style={{ padding: '0.55rem 1rem', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '5px', cursor: managerAuthBusy ? 'wait' : 'pointer', fontWeight: 700 }}
                >
                  {managerAuthBusy ? 'Autenticando...' : 'Autenticar sessao do gestor'}
                </button>
              </form>
            ) : (
              <span style={{ color: '#f87171', fontSize: '0.85rem' }}>AUTH_REQUIRED: autoridade de sessao indisponivel.</span>
            )}
            {managerAuthFeedback && (
              <div style={{ marginTop: '0.6rem', color: managerSession ? '#34d399' : '#f87171', fontSize: '0.8rem' }}>
                {managerAuthFeedback}
              </div>
            )}
            {vaultPreflight && (
              <div style={{ marginTop: '0.75rem', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.6 }}>
                <div>VAULT_KEY_ENV_PRESENT: {vaultPreflight.vaultKeyEnvPresent ? 'SIM' : 'NAO'}</div>
                <div>VAULT_KEY_FORMAT_VALID: {vaultPreflight.vaultKeyFormatValid ? 'SIM' : 'NAO'}</div>
                <div>VAULT_CRYPTO_INITIALIZATION: {vaultPreflight.vaultCryptoInitialization}</div>
                <div>MANAGER_AUTHORIZATION: {vaultPreflight.managerAuthorization}</div>
                <div>RPC_PRESENT: {vaultPreflight.rpcPresent ? 'SIM' : 'NAO'}</div>
                <div>RPC_EXECUTE_AUTHENTICATED: {vaultPreflight.rpcExecuteAuthenticated ? 'SIM' : 'NAO'}</div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#101624',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              marginBottom: '1.5rem',
            }}
          >
            <strong style={{ display: 'block', color: '#fca5a5', fontSize: '0.9rem' }}>
              Autoridade remota do gestor indisponivel.
            </strong>
            <span style={{ display: 'block', marginTop: '0.35rem', color: '#cbd5e1', fontSize: '0.8rem' }}>
              {supabaseRuntimeStatus.status === 'MISSING_PUBLIC_RUNTIME_CONFIG'
                ? 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (ou a chave anon legada) no runtime publico.'
                : 'A configuracao publica do Supabase esta invalida ou o cliente browser nao pode ser criado.'}
            </span>
          </div>
        )}

        {managerSession && (
          <section
            style={{
              backgroundColor: '#101624',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(124, 58, 237, 0.45)',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem' }}>Ativacao de dispositivo por Codigo + Chave</h2>
            <p style={{ margin: '0.45rem 0 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
              Digite no painel local o Codigo ID e a Chave de 6 digitos exibidos no tablet e clique em Validar.
            </p>
            <form onSubmit={(event) => void handleValidateDeviceCodeKey(event)} style={{ display: 'flex', alignItems: 'end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Codigo ID
                </label>
                <input
                  required
                  value={deviceActivationCode}
                  onChange={(event) => setDeviceActivationCode(event.target.value.toUpperCase())}
                  placeholder="XF-XXXX-XXXX"
                  autoComplete="off"
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div style={{ minWidth: '180px', flex: '1 1 180px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Chave de 6 digitos
                </label>
                <input
                  required
                  value={deviceActivationKey}
                  onChange={(event) => setDeviceActivationKey(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  autoComplete="off"
                  style={{ width: '100%', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <button
                type="submit"
                className="focusable-item"
                disabled={deviceActivationBusy}
                style={{ padding: '0.55rem 1rem', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '5px', cursor: deviceActivationBusy ? 'wait' : 'pointer', fontWeight: 700 }}
              >
                {deviceActivationBusy ? 'Validando...' : 'Validar'}
              </button>
            </form>
            {deviceActivationSession && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.8rem' }}>
                  CODE_KEY_VALIDATED=SIM | SOURCE_SETUP_UNLOCKED=SIM | DEVICE_AUTHORIZED=NAO_AINDA
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                  Proxima etapa liberada. Nenhuma fonte foi preenchida, salva ou autorizada neste ciclo.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    URL da fonte
                    <input disabled placeholder="Disponivel no proximo gate" style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#0f172a', color: '#64748b', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </label>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Usuario (opcional)
                    <input disabled placeholder="Disponivel no proximo gate" style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#0f172a', color: '#64748b', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </label>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Senha (opcional)
                    <input type="password" disabled placeholder="Disponivel no proximo gate" style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#0f172a', color: '#64748b', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </label>
                </div>
              </div>
            )}
          </section>
        )}

        {managerSession && (
          <section
            style={{
              backgroundColor: '#101624',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem' }}>ATIVAR FONTE PARA DISPOSITIVO</h2>
            <p style={{ margin: '0.45rem 0 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
              O Gestor Master valida o par do dispositivo, grava a fonte no vault gerenciado e conclui a autorizacao em uma unica operacao.
            </p>

            {/* Seletor de Modo: Novo cliente vs Cliente já ativo */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className="focusable-item"
                onClick={() => setActivationFlowMode('NEW_CUSTOMER')}
                style={{
                  padding: '0.45rem 1rem',
                  backgroundColor: activationFlowMode === 'NEW_CUSTOMER' ? '#059669' : '#1e293b',
                  color: '#fff',
                  border: activationFlowMode === 'NEW_CUSTOMER' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: activationFlowMode === 'NEW_CUSTOMER' ? 700 : 500,
                  fontSize: '0.85rem',
                }}
              >
                Novo cliente
              </button>
              <button
                type="button"
                className="focusable-item"
                onClick={() => setActivationFlowMode('EXISTING_CUSTOMER')}
                style={{
                  padding: '0.45rem 1rem',
                  backgroundColor: activationFlowMode === 'EXISTING_CUSTOMER' ? '#059669' : '#1e293b',
                  color: '#fff',
                  border: activationFlowMode === 'EXISTING_CUSTOMER' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: activationFlowMode === 'EXISTING_CUSTOMER' ? 700 : 500,
                  fontSize: '0.85rem',
                }}
              >
                Cliente já ativo
              </button>
            </div>

            <form onSubmit={(event) => void handleManagerDeviceActivation(event)} style={{ display: 'grid', gap: '0.75rem' }}>
              {activationFlowMode === 'NEW_CUSTOMER' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      Nome do cliente
                      <input
                        required
                        value={assistedNewCustomerName}
                        onChange={(event) => setAssistedNewCustomerName(event.target.value)}
                        placeholder="Ex: Alexandre Santos"
                        autoComplete="off"
                        style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </label>
                    <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      Código do novo dispositivo
                      <input
                        required
                        value={assistedDeviceCode}
                        onChange={(event) => setAssistedDeviceCode(event.target.value.toUpperCase())}
                        placeholder="XF-XXXX-XXXX"
                        autoComplete="off"
                        style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </label>
                    <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      Chave permanente do novo dispositivo
                      <input
                        required
                        value={assistedDeviceKey}
                        onChange={(event) => setAssistedDeviceKey(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        inputMode="numeric"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        autoComplete="off"
                        style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      Nome da fonte
                      <input
                        required
                        value={assistedSourceName}
                        onChange={(event) => setAssistedSourceName(event.target.value)}
                        autoComplete="off"
                        style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </label>
                    <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      Protocolo
                      <select
                        value={assistedSourceType}
                        onChange={(event) => setAssistedSourceType(event.target.value as ManagerSourceType)}
                        style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <option value="M3U">M3U / M3U8</option>
                        <option value="XTREAM">XTREAM</option>
                      </select>
                    </label>
                    <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      Token (opcional)
                      <input
                        value={assistedSourceToken}
                        onChange={(event) => setAssistedSourceToken(event.target.value)}
                        autoComplete="off"
                        style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </label>
                  </div>
                  {assistedSourceType === 'M3U' ? (
                    <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                      URL da fonte M3U/M3U8
                      <input
                        required
                        type="url"
                        value={assistedPlaylistUrl}
                        onChange={(event) => setAssistedPlaylistUrl(event.target.value)}
                        placeholder="https://exemplo.com/playlist.m3u"
                        autoComplete="off"
                        style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </label>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                        Endpoint XTREAM
                        <input
                          required
                          type="url"
                          value={assistedSourceHost}
                          onChange={(event) => setAssistedSourceHost(event.target.value)}
                          placeholder="https://exemplo.com"
                          autoComplete="off"
                          style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </label>
                      <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                        Usuário XTREAM
                        <input
                          required
                          value={assistedSourceUser}
                          onChange={(event) => setAssistedSourceUser(event.target.value)}
                          autoComplete="off"
                          style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </label>
                      <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                        Senha XTREAM
                        <input
                          required
                          type="password"
                          value={assistedSourcePass}
                          onChange={(event) => setAssistedSourcePass(event.target.value)}
                          autoComplete="new-password"
                          style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </label>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                    Cliente
                    <select
                      required
                      value={assistedCustomerId}
                      onChange={(event) => setAssistedCustomerId(event.target.value)}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: '0.25rem',
                        padding: '0.5rem',
                        backgroundColor: '#151d30',
                        color: '#fff',
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <option value="">Selecione um cliente...</option>
                      {customers
                        .filter((c) => c.status === 'ACTIVE')
                        .map((c) => {
                          const isDuplicate = customers.filter((other) => other.nickname === c.nickname).length > 1;
                          return (
                            <option key={c.customerId} value={c.customerId}>
                              {c.nickname} {isDuplicate ? `(${c.customerId.slice(-6)})` : ''}
                            </option>
                          );
                        })}
                    </select>
                  </label>
                  <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                    Código do dispositivo já vinculado ao cliente
                    <input
                      required
                      value={assistedExistingDeviceCode}
                      onChange={(event) => setAssistedExistingDeviceCode(event.target.value.toUpperCase())}
                      placeholder="XF-XXXX-XXXX"
                      autoComplete="off"
                      style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </label>
                  <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                    Código do novo dispositivo
                    <input
                      required
                      value={assistedDeviceCode}
                      onChange={(event) => setAssistedDeviceCode(event.target.value.toUpperCase())}
                      placeholder="XF-XXXX-XXXX"
                      autoComplete="off"
                      style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </label>
                  <label style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                    Chave permanente do novo dispositivo
                    <input
                      required
                      value={assistedDeviceKey}
                      onChange={(event) => setAssistedDeviceKey(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      autoComplete="off"
                      style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </label>
                  {showAmbiguitySelector && (
                    <label style={{ color: '#f59e0b', fontSize: '0.75rem' }}>
                      Licença gerenciada (Desambiguação)
                      <select
                        required
                        value={assistedLicenseId}
                        onChange={(event) => setAssistedLicenseId(event.target.value)}
                        style={{
                          display: 'block',
                          width: '100%',
                          marginTop: '0.25rem',
                          padding: '0.5rem',
                          backgroundColor: '#151d30',
                          color: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #f59e0b',
                        }}
                      >
                        <option value="">Selecione uma licença para desambiguar</option>
                        {(managerLicenses.length > 0 ? managerLicenses : fallbackLocalLicenses)
                          .filter(
                            (license) =>
                              license.mode === 'MANAGED' &&
                              (license.status === 'ACTIVE' || license.status === 'TRIAL') &&
                              (!assistedCustomerId || license.customerId === assistedCustomerId)
                          )
                          .map((license) => (
                            <option key={license.licenseId} value={license.licenseId}>
                              {license.customerNickname || license.customerId || 'Usuario'} - {license.mode} - {license.status}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={assistedActivationBusy}
                  className="focusable-item"
                  style={{
                    justifySelf: 'start',
                    padding: '0.6rem 1.4rem',
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: assistedActivationBusy ? 'wait' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  {assistedActivationBusy ? 'Ativando...' : 'ATIVAR'}
                </button>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {activationFlowMode === 'NEW_CUSTOMER'
                    ? 'Cria cliente + licença MVP (1 slot) + cofre de fonte + ativação em operação atômica.'
                    : 'Reutiliza a fonte gerenciada ativa e a licença com capacidade do cliente existente.'}
                </span>
              </div>
            </form>
          </section>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '0.85rem 1.2rem',
              backgroundColor:
                feedbackType === 'success' ? '#064e3b' : feedbackType === 'error' ? '#7f1d1d' : '#1e293b',
              borderLeft: `4px solid ${
                feedbackType === 'success' ? '#10b981' : feedbackType === 'error' ? '#ef4444' : '#a855f7'
              }`,
              borderRadius: '6px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Navegação por Abas (C8 Admin Management) */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
          }}
        >
          {[
            { id: 'CLIENTES', label: '👥 Clientes', count: customers.length },
            { id: 'LICENCAS', label: '🔑 Licenças', count: managerLicenses.length || licenses.length },
            { id: 'INSTALACOES', label: '💻 Instalações', count: installations.length },
            { id: 'DISPOSITIVOS', label: '📱 Dispositivos', count: devices.length },
            { id: 'FONTES', label: '🌐 Fontes', count: managedSources.length + customerSources.length },
            { id: 'AUDITORIA', label: '📜 Auditoria', count: auditLogs.length },
            { id: 'SISTEMA', label: '⚙️ Sistema' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className="focusable-item"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  padding: '0.65rem 1.1rem',
                  backgroundColor: isActive ? '#7c3aed' : '#1e293b',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  border: isActive ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    style={{
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      backgroundColor: isActive ? 'rgba(0,0,0,0.3)' : '#0f172a',
                      color: isActive ? '#f8fafc' : '#cbd5e1',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ABA 1: CLIENTES */}
        {activeTab === 'CLIENTES' && (
          <AdminCustomersView
            customers={customers}
            loading={dataLoading}
            onInspectCustomer={handleInspectCustomer}
            onUpdateCustomerStatus={handleUpdateCustomerStatus}
            sourceAuthority={managerSession && managerRemote ? managerRemote : undefined}
            onDeviceSourceApplied={() => { void refreshData(); }}
          />
        )}

        {/* ABA 2: LICENÇAS */}
        {activeTab === 'LICENCAS' && (
          <AdminLicensesView
            licenses={managerLicenses.length > 0 ? managerLicenses : fallbackLocalLicenses}
            loading={dataLoading}
            onInspectLicense={handleInspectLicense}
            onUpdateLimits={handleUpdateLimits}
            onSuspendLicense={handleSuspendLicense}
            onRevokeLicense={handleRevokeLicense}
            onActivateLicense={handleActivateLicense}
          />
        )}

        {/* ABA 3: INSTALAÇÕES */}
        {activeTab === 'INSTALACOES' && (
          <AdminInstallationsView
            installations={installations}
            loading={dataLoading}
          />
        )}

        {/* ABA 4: DISPOSITIVOS */}
        {activeTab === 'DISPOSITIVOS' && (
          <>
            {/* Solicitações de Reativação */}
            {managerRemote && managerSession && (
              <div
                style={{
                  backgroundColor: '#101624',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #7c3aed',
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                    Solicitações de reativação ({deviceReactivationRequests.length})
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Aprove ou cancele solicitações conforme o status. O cancelamento preserva dispositivo, licença, source e binding; nenhum segredo é exibido.
                  </p>
                </div>

                {deviceReactivationRequests.length === 0 ? (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#151d30',
                      borderRadius: '6px',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                    }}
                  >
                    Nenhuma solicitação de reativação registrada.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {deviceReactivationRequests.map((request) => {
                      const expired = isReactivationRequestExpired(request);
                      const isBusy = reactivationBusyRequestId === request.requestId;

                      return (
                        <div
                          key={request.requestId}
                          style={{
                            backgroundColor: '#151d30',
                            borderRadius: '6px',
                            padding: '0.9rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <strong style={{ color: '#f8fafc' }}>
                              {request.displayCode} — {request.deviceLabel}
                            </strong>
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                              {request.deviceType} · {request.status} · criada em {new Date(request.createdAtIso).toLocaleString('pt-BR')} · expira em {new Date(request.expiresAtIso).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {request.status === 'PENDING' && !expired ? (
                            <button
                              type="button"
                              className="focusable-item"
                              disabled={Boolean(reactivationBusyRequestId)}
                              onClick={() => void handleApproveDeviceReactivation(request)}
                              style={{
                                padding: '0.45rem 0.85rem',
                                backgroundColor: '#7c3aed',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isBusy ? 'wait' : 'pointer',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                              }}
                            >
                              {isBusy ? 'Aprovando...' : 'Aprovar Reativação'}
                            </button>
                          ) : (
                            <span style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: 700 }}>
                              {reactivationRequestStatusLabel(request, expired)}
                            </span>
                          )}
                          {(request.status === 'PENDING' || request.status === 'APPROVED') && !expired && (
                            <button
                              type="button"
                              className="focusable-item"
                              disabled={Boolean(reactivationBusyRequestId)}
                              onClick={() => void handleCancelDeviceReactivation(request)}
                              style={{
                                padding: '0.45rem 0.85rem',
                                backgroundColor: 'transparent',
                                color: '#fca5a5',
                                border: '1px solid #ef4444',
                                borderRadius: '4px',
                                cursor: isBusy ? 'wait' : 'pointer',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                              }}
                            >
                              {isBusy ? 'Cancelando...' : 'Cancelar solicitação'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Vincular Fonte a Dispositivo */}
            <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                Vincular Fonte a Dispositivo Autorizado (Multi-Device)
              </h2>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                A mesma fonte gerenciada pode ser vinculada a múltiplos dispositivos autorizados sob a mesma licença.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  className="focusable-item"
                  value={selectedLicenseId}
                  onChange={(e) => setSelectedLicenseId(e.target.value)}
                  style={{ padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="">Selecione a Licença...</option>
                  {licenses.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.mode} ({l.maxDevices} slots)
                    </option>
                  ))}
                </select>

                <select
                  className="focusable-item"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  style={{ padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="">Selecione o Dispositivo...</option>
                  {devices
                    .filter((d) => d.status === 'AUTHORIZED')
                    .map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.displayCode} - {d.deviceLabel}
                      </option>
                    ))}
                </select>

                <select
                  className="focusable-item"
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  style={{ padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="">Selecione a Fonte...</option>
                  {managedSources.map((s) => (
                    <option key={s.id} value={s.sourceId}>
                      {s.name} (v{s.version || 1} - {s.sourceType})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="focusable-item"
                  onClick={() => handleBindDeviceToSource(selectedLicenseId, selectedDeviceId, selectedSourceId)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Vincular
                </button>
              </div>
            </div>

            {/* Dispositivos Registrados */}
            <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                    Dispositivos Registrados ({devices.length})
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Cada dispositivo possui zero ou uma fonte ativa vinculada por vez. Trocar de fonte preserva a licença e a autorização.
                  </p>
                </div>
              </div>

              {devices.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Nenhum dispositivo registrou ativação ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {devices.map((d) => {
                    const binding = sourceBindings.find((b) => b.deviceId === d.deviceId);
                    const boundSource = binding ? managedSources.find((s) => s.sourceId === binding.sourceId) : null;
                    const isSwitchingThis = switchingDeviceId === d.deviceId;
                    const activeSources = managedSources.filter((s) => s.status === 'ACTIVE');
                    const licBinding = licenseBindings.find((lb) => lb.deviceId === d.deviceId && lb.status === 'ACTIVE')
                      || licenseBindings.find((lb) => lb.deviceId === d.deviceId);
                    const licenseId = licBinding?.licenseId;

                    return (
                      <div
                        key={d.deviceId}
                        style={{
                          backgroundColor: '#151d30',
                          borderRadius: '6px',
                          padding: '1rem',
                          border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1.05rem', color: '#38bdf8' }}>{d.displayCode}</strong>
                            <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>{d.deviceLabel}</span>
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: '#1e293b', color: '#94a3b8' }}>
                              {d.deviceType}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: d.status === 'AUTHORIZED' ? '#064e3b' : '#7f1d1d',
                                color: d.status === 'AUTHORIZED' ? '#34d399' : '#f87171',
                                fontWeight: 700,
                              }}
                            >
                              {d.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Licença:{' '}
                            <code style={{ color: '#a78bfa', backgroundColor: '#0c111e', padding: '0.15rem 0.35rem', borderRadius: '3px' }}>
                              {licenseId ? `...${licenseId.slice(-8)}` : 'N/A'}
                            </code>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#0c111e',
                            padding: '0.6rem 0.85rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.04)',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Fonte Ativa Vinculada:</span>
                            {boundSource ? (
                              <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.85rem' }}>
                                ★ {boundSource.name} (v{boundSource.version || 1})
                              </span>
                            ) : (
                              <span style={{ color: '#f59e0b', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                ⚠ Nenhuma fonte vinculada (player desabilitado)
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {d.status === 'PENDING_MANAGER_APPROVAL' && (
                              <button
                                type="button"
                                className="focusable-item"
                                onClick={() => handleApproveDevice(d.deviceId)}
                                style={{
                                  padding: '0.45rem 0.85rem',
                                  backgroundColor: '#059669',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                }}
                              >
                                ✓ Aprovar Dispositivo
                              </button>
                            )}

                            {d.status === 'AUTHORIZED' && (
                              <button
                                type="button"
                                className="focusable-item"
                                onClick={() => {
                                  if (isSwitchingThis) {
                                    setSwitchingDeviceId(null);
                                    setSwitchTargetSourceId('');
                                  } else {
                                    setSwitchingDeviceId(d.deviceId);
                                    setSwitchTargetSourceId(boundSource ? boundSource.id : (activeSources[0]?.id || ''));
                                  }
                                }}
                                style={{
                                  padding: '0.45rem 0.85rem',
                                  backgroundColor: isSwitchingThis ? '#475569' : '#0284c7',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {isSwitchingThis ? '✕ Fechar' : boundSource ? '🔀 Trocar Fonte' : '➕ Definir Fonte Ativa'}
                              </button>
                            )}

                            {d.status === 'AUTHORIZED' && boundSource && (
                              <button
                                type="button"
                                className="focusable-item"
                                onClick={() => handleUnbindDevice(d.deviceId, boundSource.name)}
                                style={{
                                  padding: '0.45rem 0.85rem',
                                  backgroundColor: '#9a3412',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                ⛓️ Desvincular Fonte
                              </button>
                            )}

                            {d.status !== 'REVOKED' && (
                              <button
                                type="button"
                                className="focusable-item"
                                onClick={() => handleRevokeDevice(d.deviceId)}
                                style={{
                                  padding: '0.45rem 0.85rem',
                                  backgroundColor: '#dc2626',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                🚫 Revogar Device
                              </button>
                            )}

                            {managerSession && managerRemote && (
                              <button
                                type="button"
                                className="focusable-item"
                                onClick={() => void handleRevealDeviceSensitive(d.deviceId)}
                                disabled={revealBusyDeviceId === d.deviceId}
                                style={{
                                  padding: '0.45rem 0.85rem',
                                  backgroundColor: revealedDeviceSensitive[d.deviceId] ? '#475569' : '#7c3aed',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: revealBusyDeviceId === d.deviceId ? 'wait' : 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                {revealBusyDeviceId === d.deviceId
                                  ? 'Consultando...'
                                  : revealedDeviceSensitive[d.deviceId]
                                    ? 'Ocultar dados Master'
                                    : 'Revelar dados Master'}
                              </button>
                            )}
                          </div>
                        </div>

                        {revealedDeviceSensitive[d.deviceId] && (
                          <div
                            style={{
                              backgroundColor: '#24183d',
                              padding: '0.85rem 1rem',
                              borderRadius: '6px',
                              border: '1px solid #a855f7',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.55rem',
                            }}
                          >
                            <strong style={{ color: '#e9d5ff', fontSize: '0.85rem' }}>
                              Dados protegidos — visualização exclusiva do Gestor Master
                            </strong>
                            <div style={{ fontSize: '0.82rem', color: '#f8fafc' }}>
                              Chave permanente:{' '}
                              <code style={{ color: '#f0abfc', wordBreak: 'break-all' }}>
                                {revealedDeviceSensitive[d.deviceId].permanentActivationKey || 'Não cadastrada'}
                              </code>
                            </div>
                            {revealedDeviceSensitive[d.deviceId].source && (
                              <div style={{ fontSize: '0.82rem', color: '#f8fafc' }}>
                                <div>
                                  Fonte: <strong>{revealedDeviceSensitive[d.deviceId].source?.displayName}</strong>{' '}
                                  (v{revealedDeviceSensitive[d.deviceId].source?.sourceVersion} · {revealedDeviceSensitive[d.deviceId].source?.protocol})
                                </div>
                                {Object.entries(revealedDeviceSensitive[d.deviceId].source?.config || {}).map(([key, value]) => (
                                  <div key={key} style={{ marginTop: '0.25rem' }}>
                                    {key}:{' '}
                                    <code style={{ color: '#f0abfc', wordBreak: 'break-all' }}>
                                      {typeof value === 'string' ? value : JSON.stringify(value)}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            )}
                            <span style={{ color: '#d8b4fe', fontSize: '0.75rem' }}>
                              A revelação foi feita no servidor e registrada; ela não é enviada ao aplicativo Android.
                            </span>
                          </div>
                        )}

                        {isSwitchingThis && (
                          <div
                            style={{
                              backgroundColor: '#0c111e',
                              padding: '0.85rem 1rem',
                              borderRadius: '6px',
                              border: '1px solid #0284c7',
                              marginTop: '0.25rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                                Selecionar Nova Fonte Ativa para {d.displayCode}:
                              </span>

                              <select
                                className="focusable-item"
                                value={switchTargetSourceId}
                                onChange={(e) => setSwitchTargetSourceId(e.target.value)}
                                style={{
                                  padding: '0.45rem 0.75rem',
                                  backgroundColor: '#151d30',
                                  color: '#fff',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  fontSize: '0.85rem',
                                  minWidth: '260px',
                                }}
                              >
                                {activeSources.map((s) => (
                                  <option key={s.id} value={s.sourceId}>
                                    {s.name} (v{s.version || 1} - {s.sourceType}) {s.id === boundSource?.id ? '★ [Atual]' : ''}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                className="focusable-item"
                                onClick={() => handleSwitchDeviceSource(d.deviceId, switchTargetSourceId)}
                                style={{
                                  padding: '0.45rem 1rem',
                                  backgroundColor: '#16a34a',
                                  color: '#fff',
                                  fontWeight: 700,
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.82rem',
                                }}
                              >
                                💾 Confirmar Troca
                              </button>

                              <button
                                type="button"
                                className="focusable-item"
                                onClick={() => {
                                  setSwitchingDeviceId(null);
                                  setSwitchTargetSourceId('');
                                }}
                                style={{
                                  padding: '0.45rem 0.75rem',
                                  backgroundColor: '#475569',
                                  color: '#fff',
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.82rem',
                                }}
                              >
                                Cancelar
                              </button>
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
        )}

        {/* ABA 5: FONTES (GERENCIADAS + CUSTOMER SELF-SERVICE) */}
        {activeTab === 'FONTES' && (
          <>
            {/* Fontes Gerenciadas (R6C) */}
            <div
              style={{
                backgroundColor: '#101624',
                padding: '1.5rem',
                borderRadius: '10px',
                marginBottom: '2rem',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    Fontes Gerenciadas ({managedSources.length})
                  </h2>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Entidade independente de licenças e dispositivos. Edições incrementam versão e preservam todos os vínculos multi-device.
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    backgroundColor: '#1e1b4b',
                    color: '#c084fc',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    border: '1px solid #7c3aed',
                    fontWeight: 600,
                  }}
                >
                  AES-256-GCM Protegido
                </span>
              </div>

              {managedSources.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#151d30',
                    borderRadius: '8px',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    marginBottom: '1.5rem',
                  }}
                >
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
                    Nenhuma fonte gerenciada cadastrada ainda. Cadastre uma nova fonte abaixo.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {managedSources.map((src) => {
                    const boundList = sourceBindings
                      .filter((binding) => binding.sourceId === src.sourceId)
                      .map((binding) => {
                        const device = devices.find((candidate) => candidate.deviceId === binding.deviceId);
                        return device ? { device, binding } : undefined;
                      })
                      .filter((item): item is { device: DeviceEntity; binding: DeviceSourceBindingEntity } => Boolean(item));
                    const isEditingThis = editingSourceId === src.sourceId;
                    const isSavingThis = Boolean(sourceSaveLoading[src.sourceId]);
                    const sourceCardFeedback = sourceFeedback[src.sourceId];

                    return (
                      <div
                        key={src.id}
                        style={{
                          backgroundColor: '#151d30',
                          borderRadius: '8px',
                          border: isEditingThis ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.06)',
                          padding: '1.25rem',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{src.name}</strong>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: '#1e293b',
                                color: '#a78bfa',
                                fontWeight: 700,
                              }}
                            >
                              {src.sourceType}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: src.status === 'ACTIVE' ? '#064e3b' : '#7f1d1d',
                                color: src.status === 'ACTIVE' ? '#34d399' : '#f87171',
                                fontWeight: 700,
                              }}
                            >
                              {src.status}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              Versão: <strong style={{ color: '#38bdf8' }}>v{src.version || 1}</strong>
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="focusable-item"
                              onClick={() => (isEditingThis ? handleCancelEdit() : handleStartEditSource(src))}
                              style={{
                                padding: '0.35rem 0.75rem',
                                backgroundColor: isEditingThis ? '#475569' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {isEditingThis ? '✕ Cancelar' : '✏️ Editar'}
                            </button>

                            <button
                              type="button"
                              className="focusable-item"
                              onClick={() => handleToggleSourceStatus(src)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                backgroundColor: src.status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {src.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        </div>

                        {/* Formulário Inline de Edição */}
                        {isEditingThis && (
                          <div
                            style={{
                              backgroundColor: '#0c111e',
                              padding: '1rem',
                              borderRadius: '6px',
                              border: '1px solid #7c3aed',
                              marginBottom: '0.75rem',
                            }}
                          >
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#c084fc', fontWeight: 700 }}>
                              Editar Fonte (Incrementa versão e atualiza o cofre cifrado atomicamente)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <div>
                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                                  Nome
                                </label>
                                <input
                                  type="text"
                                  className="focusable-item"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  style={{ width: '100%', padding: '0.4rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                              </div>
                              {src.sourceType === 'XTREAM' && (
                                <div>
                                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                                    Host
                                  </label>
                                  <input
                                    type="text"
                                    className="focusable-item"
                                    value={editHost}
                                    onChange={(e) => setEditHost(e.target.value)}
                                    placeholder="http://servidor:8080"
                                    style={{ width: '100%', padding: '0.4rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                                  />
                                </div>
                              )}
                            </div>

                            {src.sourceType === 'XTREAM' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div>
                                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                                    Novo Usuário (opcional)
                                  </label>
                                  <input
                                    type="text"
                                    className="focusable-item"
                                    placeholder="Manter atual"
                                    value={editUser}
                                    onChange={(e) => setEditUser(e.target.value)}
                                    style={{ width: '100%', padding: '0.4rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                                    Nova Senha (opcional)
                                  </label>
                                  <input
                                    type="password"
                                    className="focusable-item"
                                    placeholder="•••••••• (Manter)"
                                    value={editPass}
                                    onChange={(e) => setEditPass(e.target.value)}
                                    autoComplete="new-password"
                                    style={{ width: '100%', padding: '0.4rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                                  />
                                </div>
                              </div>
                            )}

                            {src.sourceType === 'M3U' && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>
                                  Nova URL da Playlist (opcional)
                                </label>
                                <input
                                  type="text"
                                  className="focusable-item"
                                  placeholder="Manter atual"
                                  value={editPlaylistUrl}
                                  onChange={(e) => setEditPlaylistUrl(e.target.value)}
                                  style={{ width: '100%', padding: '0.4rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                className="focusable-item"
                                disabled={isSavingThis}
                                onClick={() => handleSaveSourceEdit(src.sourceId)}
                                style={{
                                  padding: '0.4rem 1rem',
                                  backgroundColor: '#16a34a',
                                  color: '#fff',
                                  fontWeight: 700,
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: isSavingThis ? 'wait' : 'pointer',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {isSavingThis ? 'Gravando versão...' : 'Salvar Alterações'}
                              </button>

                              <button
                                type="button"
                                className="focusable-item"
                                disabled={isSavingThis}
                                onClick={handleCancelEdit}
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  backgroundColor: '#475569',
                                  color: '#fff',
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: isSavingThis ? 'wait' : 'pointer',
                                  fontSize: '0.8rem',
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {sourceCardFeedback && (
                          <div
                            style={{
                              marginBottom: '0.75rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor:
                                sourceCardFeedback.type === 'success'
                                  ? 'rgba(5, 150, 105, 0.2)'
                                  : sourceCardFeedback.type === 'error'
                                    ? 'rgba(220, 38, 38, 0.2)'
                                    : 'rgba(59, 130, 246, 0.2)',
                              color:
                                sourceCardFeedback.type === 'success'
                                  ? '#34d399'
                                  : sourceCardFeedback.type === 'error'
                                    ? '#f87171'
                                    : '#93c5fd',
                              border: `1px solid ${
                                sourceCardFeedback.type === 'success'
                                  ? 'rgba(5, 150, 105, 0.4)'
                                  : sourceCardFeedback.type === 'error'
                                    ? 'rgba(220, 38, 38, 0.4)'
                                    : 'rgba(59, 130, 246, 0.4)'
                              }`,
                            }}
                          >
                            {sourceCardFeedback.message}
                          </div>
                        )}

                        {/* Detalhes Técnicos Sanitizados */}
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#cbd5e1',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#0c111e',
                            borderRadius: '6px',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <div>ID Opaque: <code style={{ color: '#a78bfa' }}>{src.sourceId}</code></div>
                          <div>Criado em: {new Date(src.createdAtIso).toLocaleString('pt-BR')}</div>
                          <div>Última Edição: {new Date(src.updatedAtIso).toLocaleString('pt-BR')}</div>
                          <div>Vault Status: <span style={{ color: '#34d399', fontWeight: 600 }}>Cifrado (AES-256-GCM)</span></div>
                        </div>

                        {/* Dispositivos Vinculados */}
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>
                              📱 Dispositivos Vinculados a esta Fonte ({boundList.length}):
                            </span>
                          </div>

                          {boundList.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                              Nenhum dispositivo vinculado a esta fonte no momento.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {boundList.map(({ device }) => (
                                <div
                                  key={device.deviceId}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.45rem 0.75rem',
                                    backgroundColor: '#151d30',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>
                                      {device.displayCode}
                                    </strong>
                                    <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                                      {device.deviceLabel} ({device.deviceType})
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '3px',
                                        backgroundColor: device.status === 'AUTHORIZED' ? '#064e3b' : '#7f1d1d',
                                        color: device.status === 'AUTHORIZED' ? '#34d399' : '#f87171',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {device.status}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    className="focusable-item"
                                    onClick={() => handleUnbindDevice(device.deviceId, src.name)}
                                    style={{
                                      padding: '0.25rem 0.6rem',
                                      backgroundColor: '#b91c1c',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Desvincular Fonte
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cadastro de Nova Fonte */}
              <div
                style={{
                  backgroundColor: '#0c111e',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem 0', color: '#f8fafc' }}>
                  + Cadastrar Nova Fonte Gerenciada
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  {managerRemote
                    ? 'O servidor gera o sourceId opaco, cifra a configuração e grava metadata + Vault atomicamente. Nenhum segredo é devolvido.'
                    : 'Fluxo local de laboratório; a configuração remota permanece desabilitada sem a autoridade Supabase.'}
                </p>
                <div style={{ color: '#c084fc', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  METADADOS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                      Nome Identificador
                    </label>
                    <input
                      type="text"
                      className="focusable-item"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="Ex: Servidor Principal HD"
                      style={{ width: '100%', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                      Protocolo
                    </label>
                    <select
                      className="focusable-item"
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as SourceType)}
                      style={{ width: '100%', padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="XTREAM">XTREAM</option>
                      <option value="M3U">M3U</option>
                    </select>
                  </div>
                </div>

                <div style={{ color: '#c084fc', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  CONFIGURAÇÃO PROTEGIDA — SOMENTE MEMÓRIA / SERVER-SIDE
                </div>
                {sourceType === 'XTREAM' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: managerRemote ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      className="focusable-item"
                      placeholder="http://servidor:8080"
                      value={sourceHost}
                      onChange={(e) => setSourceHost(e.target.value)}
                      style={{ padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <input
                      type="text"
                      className="focusable-item"
                      placeholder="usuário"
                      value={sourceUser}
                      onChange={(e) => setSourceUser(e.target.value)}
                      style={{ padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <input
                      type="password"
                      className="focusable-item"
                      placeholder="senha"
                      value={sourcePass}
                      onChange={(e) => setSourcePass(e.target.value)}
                      autoComplete="new-password"
                      style={{ padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      className="focusable-item"
                      placeholder="https://exemplo.com/playlist.m3u8"
                      value={sourcePlaylistUrl}
                      onChange={(e) => setSourcePlaylistUrl(e.target.value)}
                      style={{ padding: '0.5rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                )}

                <button
                  type="button"
                  className="focusable-item"
                  onClick={handleCreateSource}
                  style={{
                    padding: '0.6rem 1.25rem',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    fontWeight: 700,
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Salvar Nova Fonte (Criptografar AES-256-GCM)
                </button>
              </div>
            </div>

            {/* Fontes Self-Service de Clientes (C6) */}
            <AdminCustomerSourcesView customerSources={customerSources} loading={dataLoading} />
          </>
        )}

        {/* ABA 6: AUDITORIA */}
        {activeTab === 'AUDITORIA' && (
          <AdminAuditView
            auditLogs={auditLogs}
            deviceActivationEvents={deviceActivationEvents}
            loading={dataLoading}
            onRefresh={async () => {
              await refreshData();
            }}
          />
        )}

        {/* ABA 7: SISTEMA */}
        {activeTab === 'SISTEMA' && (
          <div style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontWeight: 700 }}>Gerar Nova Licença</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Modo:
                <select
                  className="focusable-item"
                  value={newLicMode}
                  onChange={(e) => setNewLicMode(e.target.value as LicenseMode)}
                  style={{ marginLeft: '0.5rem', padding: '0.45rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="MANAGED">MANAGED (Múltiplos Dispositivos)</option>
                  <option value="SELF_SERVICE">SELF_SERVICE (1 Dispositivo)</option>
                </select>
              </label>

              {newLicMode === 'MANAGED' && (
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Máx Slots:
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newLicMaxDevices}
                    onChange={(e) => setNewLicMaxDevices(parseInt(e.target.value) || 1)}
                    style={{ marginLeft: '0.5rem', width: '60px', padding: '0.45rem', backgroundColor: '#151d30', color: '#fff', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </label>
              )}

              <button
                type="button"
                className="focusable-item"
                onClick={handleCreateLicense}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Criar Licença
              </button>
            </div>

            {createdRawKey && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#151d30', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>CHAVE GERADA (COPIE PARA O APP):</span>
                <code style={{ fontSize: '1.15rem', color: '#38bdf8', fontWeight: 800 }}>{createdRawKey}</code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
