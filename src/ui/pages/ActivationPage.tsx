/**
 * Xandeflix Prebuilt — Device Activation Page (Experiment R7B)
 *
 * Tela de ativação de licença do dispositivo e resolução de direitos de fonte.
 *
 * Princípios:
 * - DUAL_MODE: Apresenta comportamento e status adaptados para SELF_SERVICE e MANAGED.
 * - DISPLAY_CODE: Exibe o código legível do dispositivo (XF-XXXX-XXXX) para o usuário.
 * - NO_SECRET_EXPOSURE: No modo MANAGED, exibe apenas "FONTE CONFIGURADA=SIM" sem expor credenciais.
 * - TV/DPAD COMPATIBLE: Elementos navegáveis por controle remoto com foco visível.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Browser } from '@capacitor/browser';
import type { DeviceType, ActivationStatus, LicenseMode, StoredActivationState } from '../../device/device.types.ts';
import { DeviceIdentityService } from '../../device/device-identity.service.ts';
import { getControlPlaneClient } from '../../control-plane/client/control-plane-client.ts';
import type { ControlPlaneSettings } from '../../control-plane/control-plane.types.ts';
import {
  getDeviceSourceDeliveryDispatcher,
  DeviceSourceDeliveryError,
  type SourceDeliveryAck,
  type DeviceSourceDeliveryErrorCode,
} from '../../security/device-source-delivery-dispatcher.ts';
import {
  RealSourceDeviceImportService,
  type RealSourceDeviceAuthPreflight,
  type RealSourceDeviceImportResult,
} from '../../source/real-source-device-import.service.ts';
import {
  ManagedSourceStagingOrchestrator,
  type ManagedStagingResult,
} from '../../source/managed-source-staging.orchestrator.ts';
import { TransportObservabilityDiagnosticBlock } from '../components/TransportObservabilityDiagnosticBlock.tsx';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { AuthorizedDeviceReactivationService } from '../../device/authorized-device-reactivation.service.ts';
import type {
  AuthorizedDeviceReactivationHandle,
  AuthorizedDeviceReactivationPending,
} from '../../control-plane/device-reactivation.types.ts';
import {
  getDevicePairingService,
  formatPairingCode,
} from '../../control-plane/client/device-pairing.service.ts';
import { getDeviceActivationService } from '../../control-plane/client/device-activation.service.ts';
import { reconcileAuthorizedActivationState } from '../../device/authorization-reconciliation.ts';
import { ensurePendingDeviceActivationRequest, syncPendingDeviceActivation } from '../../control-plane/client/device-activation-sync.service.ts';
import { activationDeadline } from '../../control-plane/client/activation-timeout.ts';


interface ActivationPageProps {
  onBack: () => void;
  onOpenSourceSetup?: () => void;
  onCatalogImported?: () => Promise<void> | void;
}

export const ActivationPage: React.FC<ActivationPageProps> = ({
  onBack,
  onOpenSourceSetup,
  onCatalogImported,
}) => {
  const [deviceId, setDeviceId] = useState('');
  const [displayCode, setDisplayCode] = useState('XF-....-....');
  const [deviceType, setDeviceType] = useState<DeviceType>('TV');
  const [deviceLabel, setDeviceLabel] = useState('TV SALA');
  const [licenseKey, setLicenseKey] = useState('');

  const [status, setStatus] = useState<ActivationStatus>('UNREGISTERED');
  const [mode, setMode] = useState<LicenseMode | undefined>(undefined);
  const [supportContact, setSupportContact] = useState<ControlPlaneSettings | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // C4 Device Pairing State
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingId, setPairingId] = useState<string | null>(null);
  const [isRequestingPairing, setIsRequestingPairing] = useState(false);
  const [isCheckingPairing, setIsCheckingPairing] = useState(false);
  const [pairingFeedback, setPairingFeedback] = useState<string | null>(null);

  // A1: ativação externa por código + chave única do dispositivo
  const [deviceActivationKey, setDeviceActivationKey] = useState<string>('');
  const [localKeyState, setLocalKeyState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [activationAttempt, setActivationAttempt] = useState(0);
  const [isCheckingDeviceActivation, setIsCheckingDeviceActivation] = useState(false);
  const [deviceActivationFeedback, setDeviceActivationFeedback] = useState<string | null>(null);
  const [keyCopyFeedback, setKeyCopyFeedback] = useState<string | null>(null);

  const [isActivating, setIsActivating] = useState(false);
  const [sourceConfigured, setSourceConfigured] = useState(false);
  const [deliveryAck, setDeliveryAck] = useState<SourceDeliveryAck | null>(null);
  const [deliveryErrorCode, setDeliveryErrorCode] = useState<DeviceSourceDeliveryErrorCode | null>(null);
  const [isImportingCatalog, setIsImportingCatalog] = useState(false);
  const [catalogImportResult, setCatalogImportResult] = useState<RealSourceDeviceImportResult | null>(null);
  const [managedStagingResult, setManagedStagingResult] = useState<ManagedStagingResult | null>(null);
  const [authPreflight, setAuthPreflight] = useState<RealSourceDeviceAuthPreflight | null>(null);
  const [reactivationPending, setReactivationPending] = useState<AuthorizedDeviceReactivationPending | null>(null);
  const [reactivationHandle, setReactivationHandle] = useState<AuthorizedDeviceReactivationHandle | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const reactivationHandleRef = useRef<AuthorizedDeviceReactivationHandle | null>(null);
  const reactivationServiceRef = useRef(new AuthorizedDeviceReactivationService());
  const managedDeliveryPromiseRef = useRef<Promise<boolean> | null>(null);

  const deliverManagedSource = useCallback(async (): Promise<boolean> => {
    if (managedDeliveryPromiseRef.current) return managedDeliveryPromiseRef.current;

    const deliveryPromise = (async () => {
      const currentActivation = await DeviceIdentityService.loadActivationState();
      setDeliveryAck(null);
      setDeliveryErrorCode(null);
      const dispatcher = getDeviceSourceDeliveryDispatcher();
      if (!dispatcher || !currentActivation) {
        setSourceConfigured(false);
        const code: DeviceSourceDeliveryErrorCode = currentActivation
          ? 'DELIVERY_TRANSPORT_UNAVAILABLE'
          : 'DEVICE_NOT_AUTHORIZED';
        setDeliveryErrorCode(code);
        setStatusMessage(`DELIVERY_ERROR_CODE=${code}`);
        return false;
      }

      try {
        setStatusMessage(
          currentActivation.licenseMode === 'SELF_SERVICE'
            ? 'Verificando entrega segura da fonte de autoatendimento.'
            : 'Verificando entrega segura da fonte gerenciada.',
        );
        const ack = await dispatcher.deliver(currentActivation);
        const stored = ack.deliveryResult === 'STORED';
        setSourceConfigured(stored);
        if (stored) {
          setDeliveryAck(ack);
          setStatusMessage('DELIVERY_RESULT=STORED');
        }
        return stored;
      } catch (error) {
        setSourceConfigured(false);
        const code: DeviceSourceDeliveryErrorCode =
          error instanceof DeviceSourceDeliveryError ? error.code : 'DELIVERY_REJECTED';
        setDeliveryErrorCode(code);
        setStatusMessage(`DELIVERY_ERROR_CODE=${code}`);
        return false;
      }
    })();
    managedDeliveryPromiseRef.current = deliveryPromise;
    void deliveryPromise
      .finally(() => {
        if (managedDeliveryPromiseRef.current === deliveryPromise) {
          managedDeliveryPromiseRef.current = null;
        }
      })
      .catch(() => undefined);
    return deliveryPromise;
  }, []);

  const runAuthPreflight = useCallback(async (): Promise<RealSourceDeviceAuthPreflight> => {
    const preflight = await new RealSourceDeviceImportService().preflightManagedSource();
    setAuthPreflight(preflight);
    return preflight;
  }, []);

  // Carrega identidade do dispositivo e estado prévio persistido
  useEffect(() => {
    let isMounted = true;
    let localReady = false;
    setLocalKeyState('LOADING');
    (async () => {
      const [identity, , keyInfo] = await Promise.all([
        DeviceIdentityService.getOrCreateIdentity(),
        DeviceIdentityService.getOrCreateInstallationIdentity(),
        DeviceIdentityService.getOrCreateDeviceActivationKey(),
      ]);
      if (!isMounted) return;
      localReady = true;
      setDeviceId(identity.deviceId);
      setDisplayCode(identity.displayCode);
      setDeviceType(identity.deviceType);
      setDeviceLabel(identity.deviceLabel);
      setDeviceActivationKey(keyInfo.rawActivationKey);
      setLocalKeyState('READY');
      setDeviceActivationFeedback('Chave local pronta. Conecte-se à internet para concluir a ativação.');

      try {
        const pendingPairing = getDevicePairingService().getPendingPairing();
        if (isMounted && pendingPairing) {
          setPairingCode(pendingPairing.pairingCode);
          setPairingId(pendingPairing.pairingId);
        }

        const pendingHandle = await activationDeadline(() => reactivationServiceRef.current.loadPending(identity));
        if (isMounted && pendingHandle) {
          reactivationHandleRef.current = pendingHandle;
          setReactivationHandle(pendingHandle);
          setReactivationPending({
            success: true,
            resultCode: 'REQUEST_ALREADY_PENDING',
            requestId: pendingHandle.requestId,
            deviceId: pendingHandle.deviceId,
          });
          setStatusMessage('REACTIVATION_REQUEST_STATUS=PENDING_MANAGER_APPROVAL');
        }
      } catch {
        if (isMounted) {
          setStatusMessage('REACTIVATION_ERROR_CODE=PENDING_REACTIVATION_STORE_UNAVAILABLE');
        }
      }

      const savedState = await DeviceIdentityService.loadActivationState();
      const tokenInfo = await getDevicePairingService().getOrCreateDeviceToken();

      // 1. Se local estiver stale ou ausente, sincroniza se o dispositivo já estiver AUTHORIZED remotamente
      let activeState = savedState;
      if (activeState && activeState.status !== 'AUTHORIZED') {
        const client = getControlPlaneClient();
        try {
          const remoteMeta = await activationDeadline(() => client.resolveSource({
            deviceId: identity.deviceId,
            deviceAuthToken: tokenInfo.rawDeviceToken,
          }));
          if (remoteMeta.status === 'SOURCE_READY') {
            const reconciledState = reconcileAuthorizedActivationState({
              identity,
              deviceAuthToken: tokenInfo.rawDeviceToken,
              metadata: remoteMeta,
              previousState: savedState,
            });
            if (!reconciledState) throw new Error('LICENSE_MODE_MISSING');
            await DeviceIdentityService.saveActivationState(reconciledState);
            activeState = reconciledState;
          }
        } catch {
          // Autoridade remota indisponível ou dispositivo ainda não pareado
        }
      }

      // C11 V2: a chave do dispositivo é permanente; apenas a sessão externa é curta.
      // para o claim externo. O valor bruto fica apenas no dispositivo e na tela;
      // o registro remoto recebe somente o hash.
      if (!activeState || activeState.status !== 'AUTHORIZED') {
        try {
          const registered = await ensurePendingDeviceActivationRequest();
          if (isMounted) setDeviceActivationFeedback(registered
            ? 'Chave A1 registrada. Informe o código e a chave na página externa; depois cadastre a fonte.'
            : 'Registro A1 indisponível. A chave local foi preservada; tente novamente com internet.');
          activeState = await DeviceIdentityService.loadActivationState();
        } catch {
          if (isMounted) setDeviceActivationFeedback('A1 indisponível no momento. A chave local foi preservada.');
        }
      }

      if (!isMounted || !activeState) return;

      setMode(activeState.licenseMode);
      if (activeState.licenseKeyMasked) {
        setLicenseKey(activeState.licenseKeyMasked);
      }

      // Se está autorizado, verifica resolução de fonte
      if (activeState.status === 'AUTHORIZED') {
        const preflight = await runAuthPreflight();
        if (!isMounted) return;
        const remoteAuthPassed = preflight.remoteDeviceStatus === 'AUTHORIZED' && preflight.licenseStatus === 'ACTIVE';
        setStatus(remoteAuthPassed ? 'AUTHORIZED' : 'UNREGISTERED');
        if (preflight.importPreflightStatus === 'SOURCE_READY' && activeState.licenseMode === 'SELF_SERVICE') {
          setSourceConfigured(true);
        }
      } else {
        setStatus(activeState.status);
      }
    })().catch(() => {
      if (!isMounted) return;
      if (!localReady) {
        setLocalKeyState('ERROR');
        setDeviceActivationFeedback('Não foi possível salvar a identidade local. Verifique o armazenamento e tente novamente.');
      } else {
        setDeviceActivationFeedback('Serviço de ativação indisponível. Código e chave local foram preservados.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [deliverManagedSource, runAuthPreflight, activationAttempt]);

  useEffect(() => {
    const retry = () => setActivationAttempt((attempt) => attempt + 1);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  const handleCheckDeviceActivation = useCallback(async () => {
    const pending = getDeviceActivationService().getPendingActivation();
    if (!pending || pending.deviceId !== deviceId) {
      setActivationAttempt((attempt) => attempt + 1);
      return;
    }

    setIsCheckingDeviceActivation(true);
    try {
      const state = await syncPendingDeviceActivation();
      if (!state) {
        setDeviceActivationFeedback('Ativação ainda não confirmada. Verifique a conexão e tente novamente.');
        return;
      }
      setStatus('AUTHORIZED');
      setMode(state.licenseMode);
      setDeviceActivationFeedback('Dispositivo ativado. Atualizando a fonte autorizada...');
      await runAuthPreflight();
      await deliverManagedSource();
    } catch (error) {
      setDeviceActivationFeedback(error instanceof Error ? error.message : 'Erro ao consultar a ativação A1.');
    } finally {
      setIsCheckingDeviceActivation(false);
    }
  }, [deviceId, deliverManagedSource, runAuthPreflight]);

  const openExternalActivationPage = useCallback(async () => {
    const runtimeEnv = (import.meta as ImportMeta & {
      env?: { VITE_PUBLIC_ACTIVATION_URL?: string };
    }).env;
    const configuredUrl = typeof runtimeEnv?.VITE_PUBLIC_ACTIVATION_URL === 'string'
      ? runtimeEnv.VITE_PUBLIC_ACTIVATION_URL.trim()
      : '';
    const baseUrl = configuredUrl || (
      typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)
        ? window.location.origin
        : ''
    );
    if (!baseUrl) {
      setDeviceActivationFeedback('A URL pública de ativação não está configurada para este aplicativo.');
      return;
    }
    try {
      await Browser.open({ url: `${baseUrl.replace(/\/$/, '')}/#/activate-device` });
    } catch {
      setDeviceActivationFeedback('Não foi possível abrir o navegador externo de ativação.');
    }
  }, []);

  useEffect(() => {
    if (status === 'AUTHORIZED' && mode) {
      void deliverManagedSource();
    }
  }, [status, mode, deliverManagedSource]);

  // Consulta automática: a confirmação feita na página externa chega ao app
  // sem reinstalação, sem nova URL e sem exigir o botão manual.
  useEffect(() => {
    if (!deviceId || status === 'AUTHORIZED') return;
    const interval = window.setInterval(() => {
      // A pending report is not a reason to restart the local initialization effect.
      if (getDeviceActivationService().getPendingActivation()) void handleCheckDeviceActivation();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [deviceId, status, handleCheckDeviceActivation]);

  useEffect(() => {
    const handleExternalActivation = (event: Event) => {
      const detail = (event as CustomEvent<{ deviceId?: string; licenseMode?: LicenseMode }>).detail;
      if (!detail || detail.deviceId !== deviceId) return;
      setStatus('AUTHORIZED');
      setMode(detail.licenseMode || 'SELF_SERVICE');
      setDeviceActivationFeedback('Dispositivo ativado. Atualizando a fonte autorizada...');
      void deliverManagedSource();
    };
    window.addEventListener('xandeflix:activation-updated', handleExternalActivation);
    return () => window.removeEventListener('xandeflix:activation-updated', handleExternalActivation);
  }, [deviceId, deliverManagedSource]);

  const importManagedCatalog = useCallback(async () => {
    if (!sourceConfigured || isImportingCatalog) return;

    setIsImportingCatalog(true);
    setCatalogImportResult(null);
    setManagedStagingResult(null);
    setStatusMessage('Executando importacao local da fonte autorizada.');
    try {
      const staging = await new ManagedSourceStagingOrchestrator().stageManagedSource();
      setManagedStagingResult(staging);
      if (!staging.success || !staging.snapshotId) {
        setStatusMessage(`CATALOG_IMPORT_ERROR_CODE=${staging.errorCode || 'STAGING_FAILED'}`);
        return;
      }

      if (staging.status === 'ALREADY_ACTIVE') {
        setStatusMessage('CATALOG_READY_UI=SIM');
        await onCatalogImported?.();
        return;
      }

      const promoted = await getClientBootstrapService().promoteStagedSnapshot(staging.snapshotId, {
        expectedPreviousSnapshotId: staging.previousSnapshotId,
      });
      if (promoted.success && promoted.status === 'PROMOTED') {
        setStatusMessage('CATALOG_READY_UI=SIM');
        await onCatalogImported?.();
      } else {
        setStatusMessage('CATALOG_IMPORT_ERROR_CODE=PROMOTION_FAILED');
      }
    } catch {
      setStatusMessage('CATALOG_IMPORT_ERROR_CODE=STAGING_OR_PROMOTION_FAILED');
    } finally {
      setIsImportingCatalog(false);
    }
  }, [isImportingCatalog, onCatalogImported, sourceConfigured]);

  const handleActivate = useCallback(async () => {
    if (!licenseKey.trim()) {
      setStatusMessage('Por favor, informe a Chave de Licença.');
      return;
    }

    setIsActivating(true);
    setStatusMessage(null);

    try {
      const client = getControlPlaneClient();
      const res = await client.activateDevice({
        licenseKey: licenseKey.trim(),
        deviceId,
        displayCode,
        deviceType,
        deviceLabel: deviceLabel.trim() || 'DISPOSITIVO',
      });

      setStatus(res.status);
      setMode(res.mode);
      if (res.supportContact) {
        setSupportContact(res.supportContact);
      }

      if (res.message) {
        setStatusMessage(res.message);
      }

      // Persiste estado de ativação localmente
      await DeviceIdentityService.saveActivationState({
        deviceId,
        displayCode,
        deviceType,
        deviceLabel,
        licenseKeyMasked: licenseKey.slice(0, 8) + '••••••••',
        licenseMode: res.mode,
        status: res.status,
        deviceAuthToken: res.deviceAuthToken,
        activatedAtIso: new Date().toISOString(),
      });

      // Se autorizado no modo MANAGED, resolve a fonte automaticamente
      if (res.status === 'AUTHORIZED' && res.mode === 'MANAGED') {
        await deliverManagedSource();
        await runAuthPreflight();
      }
    } catch {
      setStatusMessage('Falha de comunicação com o Plano de Controle.');
    } finally {
      setIsActivating(false);
    }
  }, [licenseKey, deviceId, displayCode, deviceType, deviceLabel, deliverManagedSource, runAuthPreflight]);

  const handleRequestAuthorizedDeviceReactivation = useCallback(async () => {
    if (!deviceId || isReactivating) return;

    setIsReactivating(true);
    setReactivationPending(null);
    setStatusMessage('Gerando credencial local e solicitando aprovação do gestor.');
    try {
      const result = await reactivationServiceRef.current.request({
        deviceId,
        displayCode,
        deviceType,
        deviceLabel: deviceLabel.trim() || 'DISPOSITIVO',
        createdAtIso: new Date().toISOString(),
      });
      setReactivationPending(result.pending);
      reactivationHandleRef.current = result.handle || null;
      setReactivationHandle(result.handle || null);
      if (result.pending.success && result.handle) {
        setStatusMessage('REACTIVATION_REQUEST_STATUS=PENDING_MANAGER_APPROVAL');
      } else {
        setStatusMessage(`REACTIVATION_ERROR_CODE=${result.pending.resultCode}`);
      }
    } catch {
      reactivationHandleRef.current = null;
      setReactivationHandle(null);
      setReactivationPending({ success: false, resultCode: 'REMOTE_REACTIVATION_UNAVAILABLE' });
      setStatusMessage('REACTIVATION_ERROR_CODE=REMOTE_REACTIVATION_UNAVAILABLE');
    } finally {
      setIsReactivating(false);
    }
  }, [deviceId, displayCode, deviceType, deviceLabel, isReactivating]);

  const handleRequestPairingCode = async () => {
    if (status === 'AUTHORIZED') {
      setPairingFeedback('Dispositivo já está autorizado. Não é necessário novo pareamento.');
      return;
    }

    setIsRequestingPairing(true);
    setPairingFeedback(null);
    try {
      const inst = await DeviceIdentityService.getOrCreateInstallationIdentity();
      const identity = await DeviceIdentityService.getOrCreateIdentity();
      const tokenInfo = await getDevicePairingService().getOrCreateDeviceToken();
      const res = await getDevicePairingService().requestPairing({
        installationId: inst.installationId,
        deviceId: identity.deviceId,
        displayCode: identity.displayCode,
        deviceTokenHash: tokenInfo.deviceTokenHash,
        deviceType: identity.deviceType,
        deviceLabel: identity.deviceLabel,
      });

      if (res.success && res.pairingCode && res.pairingId) {
        setPairingCode(res.pairingCode);
        setPairingId(res.pairingId);
        setPairingFeedback('Chave temporária gerada! Validade de 10 minutos.');
      } else if (res.code === 'DEVICE_ALREADY_PAIRED' || res.message?.includes('DEVICE_ALREADY_PAIRED')) {
        const reconciledState: StoredActivationState = {
          deviceId: identity.deviceId,
          displayCode: identity.displayCode,
          deviceType: identity.deviceType,
          deviceLabel: identity.deviceLabel,
          status: 'AUTHORIZED',
          licenseMode: 'SELF_SERVICE',
          deviceAuthToken: tokenInfo.rawDeviceToken,
          activatedAtIso: new Date().toISOString(),
        };
        await DeviceIdentityService.saveActivationState(reconciledState);
        setStatus('AUTHORIZED');
        setMode('SELF_SERVICE');
        setPairingFeedback('Dispositivo já autorizado remotamente. Sincronizando ativação...');
        const preflight = await runAuthPreflight();
        if (preflight.importPreflightStatus === 'SOURCE_READY') {
          setSourceConfigured(true);
        }
      } else {
        setPairingFeedback(res.message || res.code || 'Falha ao gerar chave temporária.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('DEVICE_ALREADY_PAIRED')) {
        const identity = await DeviceIdentityService.getOrCreateIdentity();
        const tokenInfo = await getDevicePairingService().getOrCreateDeviceToken();
        const reconciledState: StoredActivationState = {
          deviceId: identity.deviceId,
          displayCode: identity.displayCode,
          deviceType: identity.deviceType,
          deviceLabel: identity.deviceLabel,
          status: 'AUTHORIZED',
          licenseMode: 'SELF_SERVICE',
          deviceAuthToken: tokenInfo.rawDeviceToken,
          activatedAtIso: new Date().toISOString(),
        };
        await DeviceIdentityService.saveActivationState(reconciledState);
        setStatus('AUTHORIZED');
        setMode('SELF_SERVICE');
        setPairingFeedback('Dispositivo já autorizado remotamente. Sincronizando ativação...');
        const preflight = await runAuthPreflight();
        if (preflight.importPreflightStatus === 'SOURCE_READY') {
          setSourceConfigured(true);
        }
      } else {
        setPairingFeedback(msg || 'Erro na solicitação de pareamento.');
      }
    } finally {
      setIsRequestingPairing(false);
    }
  };

  const handleCheckPairingStatus = async () => {
    if (!pairingId) return;
    setIsCheckingPairing(true);
    try {
      const identity = await DeviceIdentityService.getOrCreateIdentity();
      const tokenInfo = await getDevicePairingService().getOrCreateDeviceToken();
      const res = await getDevicePairingService().checkPairingStatus(
        pairingId,
        identity.deviceId,
        tokenInfo.deviceTokenHash,
      );

      if (res.success) {
        if (res.status === 'CONSUMED') {
          setPairingFeedback('Dispositivo pareado com sucesso! Atualizando autorização...');
          await runAuthPreflight();
        } else if (res.status === 'EXPIRED') {
          setPairingCode(null);
          setPairingId(null);
          setPairingFeedback('Chave temporária expirada. Gere uma nova chave.');
        } else {
          setPairingFeedback(`Status do pareamento: ${res.status}`);
        }
      } else {
        setPairingFeedback(res.message || res.code || 'Status indisponível.');
      }
    } catch (err) {
      setPairingFeedback(err instanceof Error ? err.message : 'Erro ao checar status.');
    } finally {
      setIsCheckingPairing(false);
    }
  };

  const handleFinalizeAuthorizedDeviceReactivation = useCallback(async () => {
    const handle = reactivationHandleRef.current;
    if (!handle || isReactivating) return;

    setIsReactivating(true);
    setStatusMessage('Verificando aprovação do gestor.');
    try {
      const result = await reactivationServiceRef.current.finalize(handle);
      if (result.resultCode === 'LOCAL_PERSISTENCE_FAILED_REMOTE_AUTHORIZED') {
        setStatusMessage('REACTIVATION_ERROR_CODE=LOCAL_PERSISTENCE_FAILED_REMOTE_AUTHORIZED');
        return;
      }
      if (!result.success || result.resultCode !== 'AUTHORIZED_DEVICE_REACTIVATED') {
        setStatusMessage(`REACTIVATION_ERROR_CODE=${result.resultCode}`);
        return;
      }

      reactivationHandleRef.current = null;
      setReactivationHandle(null);
      setReactivationPending(null);
      setStatus('AUTHORIZED');
      setMode('MANAGED');
      setLicenseKey('');
      setStatusMessage('REACTIVATION_RESULT=AUTHORIZED_DEVICE_REACTIVATED');
      const preflight = await runAuthPreflight();
      if (preflight.importPreflightStatus === 'SOURCE_READY') {
        await deliverManagedSource();
      }
    } catch {
      setStatusMessage('REACTIVATION_ERROR_CODE=REMOTE_REACTIVATION_UNAVAILABLE');
    } finally {
      setIsReactivating(false);
    }
  }, [deliverManagedSource, isReactivating, runAuthPreflight]);

  const handleClearActivation = useCallback(async () => {
    await DeviceIdentityService.clearActivationState();
    setStatus('UNREGISTERED');
    setMode(undefined);
    setLicenseKey('');
    setSourceConfigured(false);
    setDeliveryAck(null);
    setDeliveryErrorCode(null);
    setAuthPreflight(null);
    setReactivationPending(null);
    reactivationHandleRef.current = null;
    setReactivationHandle(null);
    await reactivationServiceRef.current.clearPending().catch(() => undefined);
    setStatusMessage('Ativação do dispositivo removida localmente.');
  }, []);

  const effectiveStatus =
    status === 'AUTHORIZED' &&
    authPreflight &&
    authPreflight.remoteDeviceStatus !== 'AUTHORIZED'
      ? 'UNREGISTERED'
      : status;
  const authUiState = effectiveStatus === 'AUTHORIZED' ? 'AUTHORIZED' : 'NOT_AUTHORIZED';

  return (
    <div
      className="activation-page"
      style={{
        minHeight: '100vh',
        backgroundColor: '#080c14',
        color: '#f8fafc',
        padding: '2rem',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <span
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              AUTORIZAÇÃO & ATIVAÇÃO (R7B)
            </span>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.5rem', fontWeight: 700 }}>
              Xandeflix Ativação
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
              cursor: 'pointer',
            }}
          >
            ← Voltar
          </button>
        </div>

        {/* Card de Identidade do Dispositivo */}
        <div
          style={{
            backgroundColor: '#101624',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>
                CÓDIGO DO DISPOSITIVO (INFORME AO GESTOR)
              </span>
              <strong
                style={{
                  fontSize: '1.75rem',
                  letterSpacing: '2px',
                  color: '#38bdf8',
                  display: 'block',
                  marginTop: '0.25rem',
                }}
              >
                {displayCode}
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>
                STATUS ATUAL
              </span>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color:
                    effectiveStatus === 'AUTHORIZED'
                      ? '#22c55e'
                      : status === 'PENDING_MANAGER_APPROVAL'
                        ? '#f59e0b'
                        : '#94a3b8',
                }}
              >
                {effectiveStatus === 'AUTHORIZED'
                  ? 'AUTHORIZED'
                  : effectiveStatus === 'PENDING_MANAGER_APPROVAL'
                    ? 'PENDING_MANAGER_APPROVAL'
                    : 'AGUARDANDO ATIVACAO'}
              </span>
            </div>
          </div>
        </div>

        {/* Chave local permanente: disponível antes e depois da autorização. */}
        <div
          style={{ backgroundColor: '#101624', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}
        >
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>
            CHAVE PERMANENTE DO DISPOSITIVO
          </span>
          <code style={{ display: 'block', color: '#86efac', fontSize: '1.2rem', lineHeight: 1.5, wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '0.25rem' }}>
            {localKeyState === 'READY' ? deviceActivationKey
              : localKeyState === 'ERROR' ? 'Falha ao preparar a chave local.' : 'Gerando chave...'}
          </code>
          <button
            type="button"
            className="focusable-item"
            onClick={() => {
              if (deviceActivationKey && navigator.clipboard) {
                void navigator.clipboard.writeText(deviceActivationKey)
                  .then(() => setKeyCopyFeedback('Chave copiada.'))
                  .catch(() => setKeyCopyFeedback('Não foi possível copiar. Anote a chave exibida.'));
              }
            }}
            disabled={localKeyState !== 'READY'}
            style={{ marginTop: '0.75rem', padding: '0.65rem 1rem', backgroundColor: '#7e22ce', color: '#fff', border: 'none', borderRadius: '5px', cursor: deviceActivationKey ? 'pointer' : 'not-allowed', fontWeight: 700 }}
          >
            Copiar chave
          </button>
          {keyCopyFeedback && (
            <div role="status" style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
              {keyCopyFeedback}
            </div>
          )}
        </div>

        {/* Formulário de Ativação */}
        {effectiveStatus !== 'AUTHORIZED' && (
          <div
            style={{
              backgroundColor: '#101624',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ padding: '0.9rem', backgroundColor: '#172033', border: '1px solid #38bdf8', borderRadius: '6px', marginBottom: '1.25rem' }}>
              <strong style={{ color: '#7dd3fc', display: 'block', marginBottom: '0.35rem' }}>
                RECOVERY DO MESMO DISPOSITIVO
              </strong>
              <span style={{ color: '#cbd5e1', display: 'block', fontSize: '0.86rem', lineHeight: 1.4 }}>
                Restaura a autorização deste dispositivo já aprovado sem inserir uma nova chave de licença.
                O gestor precisa aprovar a solicitação remotamente.
              </span>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="focusable-item"
                  onClick={() => { void handleRequestAuthorizedDeviceReactivation(); }}
                  disabled={isReactivating}
                  style={{ padding: '0.65rem 1rem', backgroundColor: '#0369a1', color: '#e0f2fe', border: '1px solid #38bdf8', borderRadius: '6px', cursor: isReactivating ? 'wait' : 'pointer', fontWeight: 700 }}
                >
                  {isReactivating ? 'Solicitando...' : 'Restaurar autorização'}
                </button>
                {reactivationHandle && (
                  <button
                    type="button"
                    className="focusable-item"
                    onClick={() => { void handleFinalizeAuthorizedDeviceReactivation(); }}
                    disabled={isReactivating}
                    style={{ padding: '0.65rem 1rem', backgroundColor: '#166534', color: '#dcfce7', border: '1px solid #22c55e', borderRadius: '6px', cursor: isReactivating ? 'wait' : 'pointer', fontWeight: 700 }}
                  >
                    Verificar aprovação do gestor
                  </button>
                )}
              </div>
              {reactivationPending && (
                <span style={{ color: '#cbd5e1', display: 'block', marginTop: '0.65rem', fontSize: '0.78rem' }}>
                  REACTIVATION_REQUEST_RESULT={reactivationPending.resultCode}
                </span>
              )}
            </div>

            {/* Seção C4: Pareamento com Conta de Cliente (Código Temporário) */}
            <div
              style={{
                backgroundColor: '#172033',
                border: '1px solid #a855f7',
                borderRadius: '6px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <strong style={{ color: '#d8b4fe', fontSize: '1rem', display: 'block', marginBottom: '0.35rem' }}>
                ATIVAÇÃO NOVA (A1)
              </strong>
              <p style={{ color: '#cbd5e1', fontSize: '0.84rem', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
                Abra a página externa de ativação, informe o código e a chave exibidos nesta tela e cadastre a fonte. Não é necessário criar conta ou informar senha.
              </p>

              <div style={{ marginBottom: '0.9rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>
                  CÓDIGO DO DISPOSITIVO
                </span>
                <strong style={{ fontSize: '1.3rem', color: '#e2e8f0', letterSpacing: '1px' }}>
                  {displayCode}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="focusable-item"
                  onClick={() => { void openExternalActivationPage(); }}
                  style={{ padding: '0.65rem 1rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 700 }}
                >
                  Abrir página de ativação
                </button>
                <button
                  type="button"
                  className="focusable-item"
                  onClick={() => { void handleCheckDeviceActivation(); }}
                  disabled={isCheckingDeviceActivation}
                  style={{ padding: '0.65rem 1rem', backgroundColor: '#334155', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', cursor: isCheckingDeviceActivation ? 'wait' : 'pointer', fontWeight: 700 }}
                >
                  {isCheckingDeviceActivation ? 'Verificando...' : 'Verificar ativação'}
                </button>
              </div>

              <button type="button" className="focusable-item" onClick={() => setActivationAttempt((attempt) => attempt + 1)}
                disabled={localKeyState === 'LOADING'} style={{ marginTop: '0.75rem', padding: '0.65rem 1rem' }}>
                Tentar novamente
              </button>

              {deviceActivationFeedback && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: deviceActivationFeedback.includes('pronta') || deviceActivationFeedback.includes('ativado') || deviceActivationFeedback.includes('copiada') ? '#34d399' : '#cbd5e1' }}>
                  {deviceActivationFeedback}
                </div>
              )}
            </div>

            {false && (
            <div
              style={{
                backgroundColor: '#172033',
                border: '1px solid #38bdf8',
                borderRadius: '6px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <strong style={{ color: '#38bdf8', fontSize: '1rem', display: 'block', marginBottom: '0.35rem' }}>
                PAREAMENTO COM CONTA XANDEFLIX
              </strong>
              <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                Acesse a página externa de ativação e informe o código e a chave permanente exibidos acima. A fonte não é digitada no aplicativo.
              </p>

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                    CÓDIGO DO DISPOSITIVO
                  </span>
                  <strong style={{ fontSize: '1.3rem', color: '#e2e8f0', letterSpacing: '1px' }}>
                    {displayCode}
                  </strong>
                </div>

                {pairingCode && (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                      CHAVE TEMPORÁRIA (10 MIN)
                    </span>
                    <strong
                      style={{
                        fontSize: '1.5rem',
                        color: '#34d399',
                        letterSpacing: '3px',
                        fontFamily: 'monospace',
                      }}
                    >
                       {formatPairingCode(pairingCode!)}
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="focusable-item"
                  onClick={() => { void handleRequestPairingCode(); }}
                  disabled={isRequestingPairing}
                  style={{
                    padding: '0.65rem 1.15rem',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: isRequestingPairing ? 'wait' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                  }}
                >
                  {isRequestingPairing ? 'Gerando...' : pairingCode ? '🔄 Gerar Nova Chave' : '🔑 Gerar Chave Temporária'}
                </button>

                {pairingCode && (
                  <button
                    type="button"
                    className="focusable-item"
                    onClick={() => { void handleCheckPairingStatus(); }}
                    disabled={isCheckingPairing}
                    style={{
                      padding: '0.65rem 1rem',
                      backgroundColor: '#334155',
                      color: '#cbd5e1',
                      borderRadius: '5px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: isCheckingPairing ? 'wait' : 'pointer',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                    }}
                  >
                    {isCheckingPairing ? 'Verificando...' : 'Verificar Status'}
                  </button>
                )}
              </div>

              {pairingFeedback && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: pairingFeedback!.includes('sucesso') || pairingFeedback!.includes('gerada') ? '#34d399' : '#f87171',
                  }}
                >
                  {pairingFeedback}
                </div>
              )}
            </div>

            )}

            {false && (<>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  color: '#94a3b8',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                CHAVE DE LICENÇA (OBRIGATÓRIA)
              </label>
              <input
                type="text"
                className="focusable-item"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="XF-LIC-SS-XXXX-XXXX"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  backgroundColor: '#151d30',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '1.05rem',
                  letterSpacing: '1px',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    marginBottom: '0.4rem',
                  }}
                >
                  TIPO DO DISPOSITIVO
                </label>
                <select
                  className="focusable-item"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#151d30',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                >
                  <option value="TV">TV / Fire Stick</option>
                  <option value="PHONE">Smartphone</option>
                  <option value="TABLET">Tablet</option>
                  <option value="PC">Computador (PC)</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    marginBottom: '0.4rem',
                  }}
                >
                  NOME / LOCALIZAÇÃO
                </label>
                <input
                  type="text"
                  className="focusable-item"
                  value={deviceLabel}
                  onChange={(e) => setDeviceLabel(e.target.value)}
                  placeholder="Ex: TV SALA"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#151d30',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="focusable-item"
              onClick={handleActivate}
              disabled={isActivating}
              style={{
                width: '100%',
                padding: '0.85rem',
                backgroundColor: '#dc2626',
                border: '1px solid #ef4444',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {isActivating ? 'Verificando Licença...' : 'Ativar Dispositivo'}
            </button>
            </>)}
          </div>
        )}

        {/* Mensagem de Feedback ou Erro */}
        {statusMessage && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#1e293b',
              borderLeft: '4px solid ' + (effectiveStatus === 'AUTHORIZED' ? '#22c55e' : '#ef4444'),
              borderRadius: '4px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              lineHeight: 1.4,
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Informações Quando Autorizado */}
        <TransportObservabilityDiagnosticBlock />

        {effectiveStatus === 'AUTHORIZED' && (
          <div
            style={{
              backgroundColor: '#101624',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', color: '#22c55e', marginBottom: '0.75rem' }}>
              ✓ Dispositivo Autorizado ({mode === 'SELF_SERVICE' ? 'Modo Individual' : 'Modo Gerenciado'})
            </h3>

            {mode === 'SELF_SERVICE' && (
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Esta licença autoriza 1 dispositivo.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {onOpenSourceSetup && (
                    <button
                      type="button"
                      className="focusable-item"
                      onClick={onOpenSourceSetup}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: '1px solid #ef4444',
                        fontWeight: 700,
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      ⚙️ Configurar Minha Fonte IPTV
                    </button>
                  )}
                  <button
                    type="button"
                    className="focusable-item"
                    onClick={handleClearActivation}
                    style={{
                      padding: '0.75rem 1.2rem',
                      backgroundColor: '#1e293b',
                      color: '#f87171',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Desvincular Licença
                  </button>
                </div>
              </div>
            )}

            {mode === 'MANAGED' && (
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Dispositivo registrado e vinculado ao plano gerenciado pelo gestor.
                </p>
                {authPreflight && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#151d30', borderRadius: '4px', marginBottom: '1rem' }}>
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.35rem' }}>
                      AUTH_UI_STATE={authUiState}
                    </strong>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>AUTH_IMPORT_PREFLIGHT={authPreflight.importPreflightStatus}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>AUTH_DEVICE_ID_MATCH={authPreflight.deviceId === deviceId && authPreflight.localActivationDeviceIdMatch === 'SIM' ? 'SIM' : 'NAO'}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>AUTH_TOKEN_PRESENT_BOOLEAN={authPreflight.localDeviceAuthTokenPresent}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>AUTH_REMOTE_AUTHORITY_AVAILABLE={authPreflight.remoteAuthorityAvailable}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>AUTH_REMOTE_RESULT_CODE={authPreflight.remoteResultCode}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>LICENSE_AUTHORIZATION={authPreflight.licenseAuth}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>BINDING_AUTHORIZATION={authPreflight.bindingAuth}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_AUTHORIZATION={authPreflight.sourceAuth}</span>
                  </div>
                )}
                <div style={{ padding: '0.75rem', backgroundColor: '#151d30', borderRadius: '4px', marginBottom: '1rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>FONTE GERENCIADA:</span>
                  <strong style={{ color: sourceConfigured ? '#22c55e' : '#f59e0b', fontSize: '1rem' }}>
                    {sourceConfigured ? 'FONTE CONFIGURADA=SIM' : 'AGUARDANDO VÍNCULO DE FONTE PELO GESTOR'}
                  </strong>
                </div>
                {deliveryAck && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#10251b', borderRadius: '4px', marginBottom: '1rem' }}>
                    <strong style={{ color: '#22c55e', display: 'block', marginBottom: '0.35rem' }}>
                      DELIVERY_RESULT=STORED
                    </strong>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_ID={deliveryAck.sourceId}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_VERSION={deliveryAck.sourceVersion}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>PROTOCOL={deliveryAck.protocol}</span>
                  </div>
                )}
                {deliveryErrorCode && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#2a1717', borderRadius: '4px', marginBottom: '1rem' }}>
                    <strong style={{ color: '#fca5a5' }}>DELIVERY_ERROR_CODE={deliveryErrorCode}</strong>
                  </div>
                )}
                {sourceConfigured && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#151d30', borderRadius: '4px', marginBottom: '1rem' }}>
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.35rem' }}>
                      DATA_PLANE=DEVICE_TO_SOURCE_DIRECT
                    </strong>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>
                      A playlist será baixada e processada somente no dispositivo.
                    </span>
                  </div>
                )}
                {catalogImportResult && (
                  <div style={{ padding: '0.75rem', backgroundColor: catalogImportResult.success ? '#10251b' : '#2a1717', borderRadius: '4px', marginBottom: '1rem' }}>
                    <strong style={{ color: catalogImportResult.success ? '#22c55e' : '#fca5a5', display: 'block', marginBottom: '0.35rem' }}>
                      PLAYLIST_FETCH_SUCCESS={catalogImportResult.playlistFetchSuccess ? 'SIM' : 'NAO'}
                    </strong>
                    {catalogImportResult.transport && (
                      <>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>CAPACITOR_HTTP_ENABLED={catalogImportResult.transport.capacitorHttpEnabled}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>TRANSPORT_RUNTIME={catalogImportResult.transport.transportRuntime}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>FETCH_IMPLEMENTATION={catalogImportResult.transport.fetchImplementation}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>FETCH_EXECUTION_CONTEXT={catalogImportResult.transport.fetchExecutionContext}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>WEBVIEW_ORIGIN={catalogImportResult.transport.webviewOrigin}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_SCHEME_CLASS={catalogImportResult.transport.sourceSchemeClass}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>HTTP_RESPONSE_RECEIVED={catalogImportResult.transport.httpResponseReceived}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>HTTP_STATUS_CLASS={catalogImportResult.transport.httpStatusClass}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>CORS_ENFORCEMENT_APPLIES={catalogImportResult.transport.corsEnforcementApplies}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>CORS_FAILURE_CLASSIFIED={catalogImportResult.transport.corsFailureClassified}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>ANDROID_CLEARTEXT_ALLOWED={catalogImportResult.transport.androidCleartextAllowed}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>WEBVIEW_MIXED_CONTENT_ALLOWED={catalogImportResult.transport.webviewMixedContentAllowed}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>WEBVIEW_MIXED_CONTENT_MODE={catalogImportResult.transport.webviewMixedContentMode}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>TLS_CONNECTION_ATTEMPTED={catalogImportResult.transport.tlsConnectionAttempted}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>TLS_HANDSHAKE_RESULT={catalogImportResult.transport.tlsHandshakeResult}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>CERTIFICATE_VALIDATION={catalogImportResult.transport.certificateValidation}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_HOST_DNS_RESULT={catalogImportResult.transport.sourceHostDnsResult}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_HOST_TCP_CONNECT={catalogImportResult.transport.sourceHostTcpConnect}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>CUSTOM_USER_AGENT_PRESENT={catalogImportResult.transport.customUserAgentPresent}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>ACCEPT_HEADER_PRESENT={catalogImportResult.transport.acceptHeaderPresent}</span>
                        <span style={{ color: '#fca5a5', display: 'block' }}>SANITIZED_FETCH_ERROR_CODE={catalogImportResult.transport.sanitizedFetchErrorCode || 'UNKNOWN_TRANSPORT_ERROR'}</span>
                      </>
                    )}
                    <span style={{ color: '#cbd5e1', display: 'block' }}>RAW_ITEM_COUNT={catalogImportResult.rawItemCount}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>NORMALIZED_ITEM_COUNT={catalogImportResult.normalizedItemCount}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>INVALID_ITEM_COUNT={catalogImportResult.invalidItemCount}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>LOCAL_CATALOG_WRITE_EXECUTED={catalogImportResult.localCatalogWriteExecuted ? 'SIM' : 'NAO'}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>ACTIVE_SNAPSHOT_PROMOTED={catalogImportResult.activeSnapshotPromoted ? 'SIM' : 'NAO'}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>CATALOG_READY_UI={catalogImportResult.catalogReady ? 'SIM' : 'NAO'}</span>
                  </div>
                )}
                {managedStagingResult && (
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: managedStagingResult.success ? '#10251b' : '#2a1717',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    <strong style={{ color: managedStagingResult.success ? '#22c55e' : '#fca5a5', display: 'block', marginBottom: '0.35rem' }}>
                      MANAGED_STAGING_STATUS={managedStagingResult.status}
                    </strong>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>RAW_ITEM_COUNT={managedStagingResult.rawItemCount}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>MOVIE_ITEM_COUNT={managedStagingResult.movieCount}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>SERIES_ITEM_COUNT={managedStagingResult.seriesCount}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>LIVE_ITEM_COUNT={managedStagingResult.liveCount}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>UNRESOLVED_COUNT={managedStagingResult.unresolvedCount}</span>
                    {managedStagingResult.sourcePayloadSizeBytes !== undefined && (
                      <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_PAYLOAD_SIZE_BYTES={managedStagingResult.sourcePayloadSizeBytes}</span>
                    )}
                    <span style={{ color: '#cbd5e1', display: 'block' }}>CANDIDATE_STAGED={managedStagingResult.status === 'STAGED' ? 'SIM' : 'NAO'}</span>
                    <span style={{ color: '#cbd5e1', display: 'block' }}>CANDIDATE_SNAPSHOT_PRESENT={managedStagingResult.snapshotId ? 'SIM' : 'NAO'}</span>
                    {managedStagingResult.transport && (
                      <>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>FETCH_IMPLEMENTATION={managedStagingResult.transport.fetchImplementation}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>FETCH_EXECUTION_CONTEXT={managedStagingResult.transport.fetchExecutionContext}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>CAPACITOR_HTTP_ENABLED={managedStagingResult.transport.capacitorHttpEnabled}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>HTTP_RESPONSE_RECEIVED={managedStagingResult.transport.httpResponseReceived}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>HTTP_STATUS_CLASS={managedStagingResult.transport.httpStatusClass}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>CORS_FAILURE_CLASSIFIED={managedStagingResult.transport.corsFailureClassified}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>TLS_HANDSHAKE_RESULT={managedStagingResult.transport.tlsHandshakeResult}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_HOST_DNS_RESULT={managedStagingResult.transport.sourceHostDnsResult}</span>
                        <span style={{ color: '#cbd5e1', display: 'block' }}>SOURCE_HOST_TCP_CONNECT={managedStagingResult.transport.sourceHostTcpConnect}</span>
                        <span style={{ color: '#fca5a5', display: 'block' }}>SANITIZED_FETCH_ERROR_CODE={managedStagingResult.transport.sanitizedFetchErrorCode || 'NONE'}</span>
                      </>
                    )}
                  </div>
                )}
                <button
                    type="button"
                    className="focusable-item"
                    onClick={() => { void deliverManagedSource(); }}
                    style={{
                      padding: '0.6rem 1.2rem',
                      marginRight: '0.75rem',
                      marginBottom: '0.75rem',
                      backgroundColor: '#1e3a8a',
                      color: '#dbeafe',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                  Revalidar Entrega Segura
                </button>
                {sourceConfigured && (
                  <button
                    type="button"
                    className="focusable-item"
                    onClick={() => { void importManagedCatalog(); }}
                    disabled={isImportingCatalog}
                    style={{
                      padding: '0.6rem 1.2rem',
                      marginRight: '0.75rem',
                      marginBottom: '0.75rem',
                      backgroundColor: '#166534',
                      color: '#dcfce7',
                      border: '1px solid #22c55e',
                      borderRadius: '6px',
                      cursor: isImportingCatalog ? 'wait' : 'pointer',
                    }}
                  >
                    {isImportingCatalog ? 'Importando catálogo local...' : 'Importar catálogo local (R2F4)'}
                  </button>
                )}
                <button
                  type="button"
                  className="focusable-item"
                  onClick={handleClearActivation}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: '#1e293b',
                    color: '#f87171',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Desvincular Dispositivo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bloco de Contato do Gestor (Section 14 e 15) */}
        <div
          style={{
            backgroundColor: '#0d131f',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '1.25rem',
            fontSize: '0.85rem',
            color: '#94a3b8',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '0.25rem' }}>
            Quer utilizar uma única licença em vários dispositivos?
          </strong>
          Entre em contato com um gestor para migrar para uma licença com múltiplos slots gerenciados.
          {supportContact && supportContact.supportContactValue && (
            <div style={{ marginTop: '0.5rem', color: '#38bdf8' }}>
              <span>{supportContact.supportContactLabel || 'Atendimento'}: </span>
              <strong>{supportContact.supportContactValue}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
