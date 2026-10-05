/**
 * Xandeflix Prebuilt — Boot Sync Coordinator (Cycles C11-P5B & C11-P5B1)
 *
 * Elo runtime para que um dispositivo AUTHORIZED com source vinculada
 * sincronize, materialize em staging, valide e promova atomicamente o catálogo real
 * em SEGUNDO PLANO sem bloquear o shell ou a navegabilidade da aplicação.
 *
 * Princípios Normativos:
 * - NON_BLOCKING_BOOT=REQUIRED (o boot da UI nunca aguarda o download/staging completo)
 * - APP_READINESS_FIRST=REQUIRED (shell visível em <=2s, navegável em <=5s)
 * - ONE_GATE_AT_A_TIME=REQUIRED
 * - IDEMPOTENCY=REQUIRED (mesmo sourceId e sourceVersion -> NO_OP)
 * - CONCURRENCY_GUARD=REQUIRED (no máximo 1 importação ativa por vez)
 * - FAIL_CLOSED_ISOLATION=REQUIRED (staging separado, falha não toca no active)
 * - ZERO_SECRETS_EXPOSED=REQUIRED (credenciais trafegam apenas no canal seguro)
 * - OFFLINE_LOCAL_FIRST=REQUIRED (snapshot REAL existente continua disponível)
 * - FIRST_SYNC_FIXTURE_BLOCKED=REQUIRED (impede exibição de synthetic fixture como comercial)
 */

import { DeviceIdentityService } from '../device/device-identity.service.ts';
import { reconcileAuthorizedActivationState } from '../device/authorization-reconciliation.ts';
import type { StoredLicenseStatus } from '../device/device.types.ts';
import {
  AuthorizedSourceResolver,
  type ResolvedSourceResult,
} from '../control-plane/client/authorized-source-resolver.ts';
import {
  getDeviceSourceDeliveryDispatcher,
  type DeviceSourceDeliveryDispatcher,
} from '../security/device-source-delivery-dispatcher.ts';
import {
  LocalSecureSourceStore,
  type LocalSecureSourceRecord,
} from '../security/local-secure-source-store.ts';
import {
  ManagedSourceStagingOrchestrator,
  type ManagedStagingResult,
} from '../source/managed-source-staging.orchestrator.ts';
import { BootstrapService } from './bootstrap.service.ts';
import { getClientBootstrapService } from './client.ts';
import { isValidActivePointer } from './active-snapshot.ts';
import { bootTelemetry, yieldToEventLoop } from '../diagnostics/boot-telemetry.ts';
import { installWebViewBufferCompatibility } from '../debug/webview-buffer-compatibility.ts';
import { DeferredSearchIndexCoordinator } from '../search/deferred-search-index-coordinator.ts';
import { CURRENT_CLASSIFICATION_PROFILE_VERSION } from '../source/source-classification-profile.ts';
import type { LocalCatalogStorage } from './storage/storage.interface.ts';
import type { ProvisioningManifest } from '../provisioning/types.ts';

installWebViewBufferCompatibility();

export function readClassificationProfileVersion(manifest: ProvisioningManifest | null): number {
  if (typeof manifest?.classificationProfileVersion === 'number') {
    return manifest.classificationProfileVersion;
  }
  const metadataVersion = manifest?.metadata?.classificationProfileVersion;
  return typeof metadataVersion === 'number' ? metadataVersion : 0;
}

export function requiresClassificationProfileRefresh(manifest: ProvisioningManifest | null): boolean {
  return readClassificationProfileVersion(manifest) < CURRENT_CLASSIFICATION_PROFILE_VERSION;
}

export type BootSyncOutcome =
  | 'NO_OP'
  | 'PROMOTED'
  | 'DEVICE_NOT_AUTHORIZED'
  | 'REMOTE_AUTHORITY_UNAVAILABLE'
  | 'RECONCILIATION_FAILED'
  | 'LICENSE_INVALID'
  | 'SOURCE_NOT_BOUND'
  | 'DELIVERY_FAILED'
  | 'STAGING_FAILED'
  | 'VALIDATION_FAILED'
  | 'PROMOTION_FAILED'
  | 'OFFLINE_FIRST_SYNC_BLOCKED'
  | 'LOCAL_FIRST_ACTIVE_PRESERVED';

export type BootSyncState =
  | 'IDLE'
  | 'CHECKING_SOURCE'
  | 'DOWNLOADING'
  | 'PARSING'
  | 'STAGING'
  | 'VALIDATING'
  | 'PROMOTING'
  | 'READY'
  | 'ERROR'
  | 'OFFLINE'
  // Compatibilidade com P5B
  | 'CHECKING'
  | 'PREPARANDO_CATALOGO_REAL'
  | 'NO_OP'
  | 'CATALOG_SYNC_ERROR';

export interface BootSyncProgress {
  state: BootSyncState;
  progressText: string;
  percentage?: number;
  error?: string;
}

export interface BootSyncResult {
  outcome: BootSyncOutcome;
  syncState: BootSyncState;
  sourceId?: string;
  sourceVersion?: number;
  snapshotId?: string;
  previousSnapshotId?: string;
  itemCount?: number;
  movieCount?: number;
  seriesCount?: number;
  liveCount?: number;
  error?: string;
}

export interface BootSyncCoordinatorDependencies {
  deviceContext?: typeof DeviceIdentityService;
  sourceResolver?: () => Promise<ResolvedSourceResult>;
  sourceDelivery?: Pick<DeviceSourceDeliveryDispatcher, 'deliver'>;
  secureStore?: Pick<LocalSecureSourceStore, 'get'>;
  stagingOrchestrator?: Pick<ManagedSourceStagingOrchestrator, 'stageManagedSource'>;
  bootstrapService?: BootstrapService;
  searchBuilder?: (
    snapshotId: string,
    storage: LocalCatalogStorage,
    liveCatalog?: import('../catalog/live/live-tv.types.ts').LiveCatalog | null,
  ) => Promise<{ success: boolean; error?: string }>;
}

export class BootSyncCoordinator {
  private readonly deviceContext: typeof DeviceIdentityService;
  private readonly sourceResolver: () => Promise<ResolvedSourceResult>;
  private readonly sourceDeliveryProvider: () => Pick<DeviceSourceDeliveryDispatcher, 'deliver'> | undefined;
  private readonly secureStore: Pick<LocalSecureSourceStore, 'get'>;
  private readonly stagingOrchestrator: Pick<ManagedSourceStagingOrchestrator, 'stageManagedSource'>;
  private readonly bootstrapService: BootstrapService;
  private readonly searchBuilder: (
    snapshotId: string,
    storage: LocalCatalogStorage,
    liveCatalog?: import('../catalog/live/live-tv.types.ts').LiveCatalog | null,
  ) => Promise<{ success: boolean; error?: string }>;

  private currentSyncPromise: Promise<BootSyncResult> | null = null;
  private searchBuildPromise: Promise<void> | null = null;
  private searchBuildSnapshotId: string | null = null;
  private pendingSearchSnapshotId: string | null = null;
  private currentState: BootSyncState = 'IDLE';
  private currentProgress: BootSyncProgress = {
    state: 'IDLE',
    progressText: 'Aguardando inicialização...',
  };
  private stateListeners: Set<(state: BootSyncState, result?: BootSyncResult, progress?: BootSyncProgress) => void> = new Set();

  constructor(deps?: BootSyncCoordinatorDependencies) {
    this.deviceContext = deps?.deviceContext || DeviceIdentityService;
    this.sourceResolver = deps?.sourceResolver || (() => AuthorizedSourceResolver.resolve());
    this.sourceDeliveryProvider = deps?.sourceDelivery
      ? () => deps.sourceDelivery
      : () => getDeviceSourceDeliveryDispatcher();
    this.secureStore = deps?.secureStore || new LocalSecureSourceStore();
    this.stagingOrchestrator =
      deps?.stagingOrchestrator ||
      new ManagedSourceStagingOrchestrator({ allowSelfServiceBoundSource: true });
    this.bootstrapService = deps?.bootstrapService || getClientBootstrapService();
    this.searchBuilder = deps?.searchBuilder || (async (snapshotId, storage, liveCatalog) =>
      DeferredSearchIndexCoordinator.buildAndPersistIndex(snapshotId, storage, { liveCatalog })
    );
  }

  getState(): BootSyncState {
    return this.currentState;
  }

  getProgress(): BootSyncProgress {
    return this.currentProgress;
  }

  subscribe(listener: (state: BootSyncState, result?: BootSyncResult, progress?: BootSyncProgress) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setState(state: BootSyncState, result?: BootSyncResult, progressText?: string, percentage?: number): void {
    this.currentState = state;
    this.currentProgress = {
      state,
      progressText: progressText || this.getDefaultProgressText(state),
      percentage,
      error: result?.error,
    };
    for (const listener of this.stateListeners) {
      try {
        listener(state, result, this.currentProgress);
      } catch {
        // Ignora erros em listeners externos
      }
    }
  }

  private getDefaultProgressText(state: BootSyncState): string {
    switch (state) {
      case 'IDLE':
        return 'Pronto';
      case 'CHECKING':
      case 'CHECKING_SOURCE':
        return 'Verificando fonte autorizada...';
      case 'DOWNLOADING':
        return 'Baixando catálogo...';
      case 'PARSING':
        return 'Processando filmes e séries...';
      case 'STAGING':
      case 'PREPARANDO_CATALOGO_REAL':
        return 'Preparando catálogo comercial...';
      case 'VALIDATING':
        return 'Validando integridade...';
      case 'PROMOTING':
        return 'Ativando catálogo comercial...';
      case 'READY':
      case 'NO_OP':
        return 'Catálogo pronto';
      case 'ERROR':
      case 'CATALOG_SYNC_ERROR':
        return 'Falha na sincronização';
      case 'OFFLINE':
        return 'Aguardando conexão com a internet';
      default:
        return 'Processando...';
    }
  }

  /**
   * Reconstrói o índice compacto somente depois que o snapshot ativo já está
   * válido. A tarefa é deliberadamente desacoplada do bootstrap: falha de
   * busca nunca remove nem bloqueia o catálogo promovido.
   */
  private scheduleDeferredSearchBuild(snapshotId: string): void {
    if (this.searchBuildPromise) {
      if (this.searchBuildSnapshotId !== snapshotId) {
        this.pendingSearchSnapshotId = snapshotId;
      }
      return;
    }

    const storage = this.bootstrapService.getStorage();
    const dispatchFailure = (message: string): void => {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('xandeflix:search-index-failed', {
          detail: { snapshotId, message: message.slice(0, 240) },
        }));
      }
    };
    this.searchBuildSnapshotId = snapshotId;
    this.searchBuildPromise = (async () => {
      if (await DeferredSearchIndexCoordinator.hasUsableActiveIndex(snapshotId, storage)) {
        return;
      }

      const liveCatalog = storage.readSnapshot
        ? (await storage.readSnapshot(snapshotId).catch(() => null))?.liveCatalog
        : undefined;
      const result = await this.searchBuilder(snapshotId, storage, liveCatalog);
      if (!result.success) {
        // O catálogo permanece pronto; o SearchService recebe o evento de
        // falha emitido pelo coordenador e apresenta estado explícito.
        dispatchFailure(result.error || 'Falha ao preparar a busca local.');
      }
    })()
      .catch((error: unknown) => {
        // Falha de busca é isolada do fluxo comercial e não altera o estado
        // ativo nem força uma nova importação da fonte.
        dispatchFailure(error instanceof Error ? error.message : 'Falha ao preparar a busca local.');
      })
      .finally(() => {
        const completedSnapshotId = this.searchBuildSnapshotId;
        const pendingSnapshotId = this.pendingSearchSnapshotId;
        this.searchBuildPromise = null;
        this.searchBuildSnapshotId = null;
        this.pendingSearchSnapshotId = null;
        if (pendingSnapshotId && pendingSnapshotId !== completedSnapshotId) {
          this.scheduleDeferredSearchBuild(pendingSnapshotId);
        }
      });
  }

  /**
   * Dispara a sincronização de catálogo em segundo plano SEM bloquear a inicialização da UI.
   * Se já houver uma sincronização em andamento, retorna imediatamente (DUPLICATE_IMPORT=NAO).
   */
  startNonBlockingSync(): void {
    if (this.currentSyncPromise) {
      return;
    }
    this.currentSyncPromise = this.executeSyncInternal().finally(() => {
      this.currentSyncPromise = null;
    });
  }

  /**
   * Aguarda a sincronização completa (para testes, automação ou ações manuais).
   */
  async awaitFullSync(): Promise<BootSyncResult> {
    return this.coordinateBootSync();
  }

  /**
   * Executa a coordenação do Boot Sync de forma atômica e idempotente.
   * Se já houver uma sincronização em andamento, retorna a Promise existente (DUPLICATE_IMPORT=NAO).
   */
  async coordinateBootSync(): Promise<BootSyncResult> {
    if (this.currentSyncPromise) {
      return this.currentSyncPromise;
    }

    this.currentSyncPromise = this.executeSyncInternal().finally(() => {
      this.currentSyncPromise = null;
    });

    return this.currentSyncPromise;
  }

  private async executeSyncInternal(): Promise<BootSyncResult> {
    this.setState('CHECKING_SOURCE', undefined, 'Verificando autorização do dispositivo...');

    // 1. Checagem de ativação local
    let activation = await this.deviceContext.loadActivationState().catch(() => null);

    if (
      !activation || activation.status !== 'AUTHORIZED'
    ) {
      const res: BootSyncResult = {
        outcome: 'DEVICE_NOT_AUTHORIZED',
        syncState: 'IDLE',
      };
      this.setState('IDLE', res, 'Aguardando ativação para iniciar o catálogo...');
      return res;
    }

    const identity = await this.deviceContext.getOrCreateIdentity().catch(() => null);
    const activePointer = await this.bootstrapService.getActivePointer().catch(() => null);
    const hasActiveCatalog = await this.bootstrapService.getStorage().hasActiveCatalog().catch(() => false);
    const isExistingReal = Boolean(
      activePointer?.kind === 'REAL' &&
      isValidActivePointer(activePointer) &&
      hasActiveCatalog
    );
    const existingRealPointer = isExistingReal ? activePointer! : null;

    if (existingRealPointer) {
      this.scheduleDeferredSearchBuild(existingRealPointer.snapshotId);
    }

    if (
      !activation ||
      !identity ||
      activation.status !== 'AUTHORIZED' ||
      !activation.deviceAuthToken ||
      activation.deviceId !== identity.deviceId ||
      activation.displayCode !== identity.displayCode
    ) {
      const outcome: BootSyncOutcome = 'DEVICE_NOT_AUTHORIZED';
      const syncState: BootSyncState = isExistingReal ? 'READY' : 'IDLE';
      const res: BootSyncResult = { outcome, syncState, error: 'Dispositivo nao autorizado.' };
      this.setState(syncState, res);
      return res;
    }

    const reconciliationFailure = (error: string): BootSyncResult => {
      const res: BootSyncResult = {
        outcome: 'RECONCILIATION_FAILED',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error,
      };
      this.setState(res.syncState, res, 'ReconciliaÃ§Ã£o comercial incompleta');
      return res;
    };

    // 2. Resolução da autoridade remota
    this.setState('CHECKING_SOURCE', undefined, 'Resolvendo fonte autorizada...');
    let authority: ResolvedSourceResult;
    try {
      authority = await this.sourceResolver();
      bootTelemetry.mark('T7_SOURCE_RESOLUTION_READY');
    } catch {
      // Falha de rede ou autoridade remota indisponível
      if (isExistingReal) {
        const res: BootSyncResult = {
          outcome: 'REMOTE_AUTHORITY_UNAVAILABLE',
          syncState: 'READY',
          snapshotId: existingRealPointer!.snapshotId,
          sourceId: existingRealPointer!.sourceId,
          sourceVersion: existingRealPointer!.sourceVersion,
        };
        this.setState('READY', res, 'Catálogo local ativo preservado');
        return res;
      }
      const res: BootSyncResult = {
        outcome: 'REMOTE_AUTHORITY_UNAVAILABLE',
        syncState: 'OFFLINE',
        error: 'Autoridade remota indisponivel durante a primeira sincronizacao.',
      };
      this.setState('OFFLINE', res, 'Sem conexão para primeira sincronização');
      return res;
    }

    // A autoridade remota Ã© a fonte canÃ´nica de licenseId, licenseStatus e
    // licenseMode. AUTHORIZED local, sozinho, nÃ£o significa estado comercial
    // completo e nÃ£o pode impedir esta reconciliaÃ§Ã£o.
    const remoteAuthorityUnavailable =
      authority.remoteResultCode === 'REMOTE_AUTHORITY_UNAVAILABLE' ||
      (authority.remoteAuthorityAvailable === false &&
        authority.remoteResultCode !== 'LOCAL_ACTIVATION_INVALID' &&
        authority.remoteResultCode !== 'LOCAL_ACTIVATION_DEVICE_ID_MISMATCH');

    if (remoteAuthorityUnavailable) {
      const res: BootSyncResult = {
        outcome: 'REMOTE_AUTHORITY_UNAVAILABLE',
        syncState: isExistingReal ? 'READY' : 'OFFLINE',
        ...(isExistingReal && activePointer
          ? {
              snapshotId: activePointer.snapshotId,
              sourceId: activePointer.sourceId,
              sourceVersion: activePointer.sourceVersion,
            }
          : {}),
        error: authority.message || 'Autoridade remota indisponivel; resolucao bloqueada em fail-closed.',
      };
      this.setState(res.syncState, res, isExistingReal ? 'Autoridade remota indisponivel; catalogo local preservado' : 'Autoridade remota indisponivel');
      return res;
    }

    if (authority.status === 'SOURCE_READY') {
      const remoteLicenseStatus = authority.licenseStatus;
      const hasAuthoritativeCommercialState = Boolean(
        authority.licenseId &&
        authority.mode &&
        isStoredLicenseStatus(remoteLicenseStatus),
      );

      if (!hasAuthoritativeCommercialState) {
        return reconciliationFailure('Autoridade remota retornou SOURCE_READY sem estado comercial completo.');
      }

      const isLocallyComplete =
        activation.licenseId === authority.licenseId &&
        activation.licenseStatus === remoteLicenseStatus &&
        activation.licenseMode === authority.mode;

      if (!isLocallyComplete) {
        const reconciled = reconcileAuthorizedActivationState({
          identity,
          deviceAuthToken: activation.deviceAuthToken,
          metadata: {
            status: authority.status,
            licenseId: authority.licenseId,
            licenseStatus: remoteLicenseStatus,
            mode: authority.mode,
          },
          previousState: activation,
          activatedAtIso: activation.activatedAtIso,
        });

        if (!reconciled) {
          return reconciliationFailure('Nao foi possivel reconciliar o estado comercial autorizado.');
        }

        try {
          await this.deviceContext.saveActivationState(reconciled);
          activation = reconciled;
        } catch {
          return reconciliationFailure('Falha ao persistir a reconciliaÃ§Ã£o comercial local.');
        }
      }
    }

    if (authority.status === 'LICENSE_INVALID') {
      const res: BootSyncResult = {
        outcome: 'LICENSE_INVALID',
        syncState: 'ERROR',
        error: authority.message || 'Licenca invalida ou expirada.',
      };
      this.setState('ERROR', res, 'Licença inválida ou expirada');
      return res;
    }

    if (authority.status === 'DEVICE_NOT_AUTHORIZED' || authority.status === 'DEVICE_REVOKED') {
      const res: BootSyncResult = {
        outcome: 'DEVICE_NOT_AUTHORIZED',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error: authority.message || 'Dispositivo nao autorizado.',
      };
      this.setState(res.syncState, res, 'Dispositivo nao autorizado');
      return res;
    }

    if (
      authority.status === 'SOURCE_NOT_BOUND' ||
      authority.sourceStatus === 'DISABLED'
    ) {
      const res: BootSyncResult = {
        outcome: 'SOURCE_NOT_BOUND',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error: 'Nenhuma fonte ativa vinculada a este dispositivo.',
      };
      this.setState(res.syncState, res, 'Nenhuma fonte vinculada');
      return res;
    }

    if (!authority.sourceId) {
      const res: BootSyncResult = {
        outcome: 'RECONCILIATION_FAILED',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error: 'Autoridade remota retornou estado sem sourceId confirmado.',
      };
      this.setState(res.syncState, res, 'Estado de autoridade incompleto');
      return res;
    }

    const expectedSourceId = authority.sourceId;
    const expectedSourceVersion = authority.sourceVersion ?? 1;

    // 3. Checagem de Idempotência
    const activeManifest = await this.bootstrapService.getStorage().readActiveManifest();
    const needsProfileRebuild = requiresClassificationProfileRefresh(activeManifest);

    if (
      existingRealPointer?.kind === 'REAL' &&
      existingRealPointer.sourceId === expectedSourceId &&
      existingRealPointer.sourceVersion === expectedSourceVersion &&
      !needsProfileRebuild
    ) {
      const res: BootSyncResult = {
        outcome: 'NO_OP',
        syncState: 'NO_OP',
        snapshotId: existingRealPointer!.snapshotId,
        sourceId: expectedSourceId,
        sourceVersion: expectedSourceVersion,
      };
      this.setState('READY', res, 'Catálogo sincronizado');
      return res;
    }

    // 4. Início da sincronização real em background
    if (!isExistingReal) {
      this.setState('PREPARANDO_CATALOGO_REAL');
    }
    bootTelemetry.mark('T8_CATALOG_SYNC_STARTED');
    this.setState('DOWNLOADING', undefined, 'Iniciando sincronização...');

    // 5. Garantir configuração da fonte no cofre local seguro
    let localRecord: LocalSecureSourceRecord | undefined;
    try {
      localRecord = await this.secureStore.get(expectedSourceId);
    } catch {
      localRecord = undefined;
    }

    const needsDelivery =
      !localRecord ||
      localRecord.sourceId !== expectedSourceId ||
      localRecord.sourceVersion !== expectedSourceVersion;

    if (needsDelivery) {
      this.setState('DOWNLOADING', undefined, 'Recebendo configuração segura da fonte...');
      const deliveryService = this.sourceDeliveryProvider();
      if (!deliveryService) {
        if (isExistingReal) {
          const res: BootSyncResult = {
            outcome: 'LOCAL_FIRST_ACTIVE_PRESERVED',
            syncState: 'READY',
            snapshotId: existingRealPointer!.snapshotId,
            error: 'Servico de entrega do cofre indisponivel.',
          };
          this.setState('READY', res);
          return res;
        }
        const res: BootSyncResult = {
          outcome: 'DELIVERY_FAILED',
          syncState: 'ERROR',
          error: 'Servico de entrega do cofre indisponivel.',
        };
        this.setState('ERROR', res);
        return res;
      }

      try {
        await deliveryService.deliver(activation);
      } catch (deliveryErr: unknown) {
        if (isExistingReal) {
          const res: BootSyncResult = {
            outcome: 'LOCAL_FIRST_ACTIVE_PRESERVED',
            syncState: 'READY',
            snapshotId: existingRealPointer!.snapshotId,
            error: 'Falha na entrega segura do cofre; ativo local preservado.',
          };
          this.setState('READY', res);
          return res;
        }
        const res: BootSyncResult = {
          outcome: 'DELIVERY_FAILED',
          syncState: 'ERROR',
          error: deliveryErr instanceof Error ? deliveryErr.message : 'Falha na entrega do cofre seguro.',
        };
        this.setState('ERROR', res);
        return res;
      }
    }

    // Yield ao event loop antes do staging
    await yieldToEventLoop();

    // 6. Materialização isolada em Staging
    this.setState('STAGING', undefined, 'Processando e gravando catálogo...');
    let stageResult: ManagedStagingResult;
    try {
      stageResult = await this.stagingOrchestrator.stageManagedSource();
    } catch (err: unknown) {
      stageResult = {
        success: false,
        status: 'REJECTED',
        errorCode: 'STAGING_FAILED',
        rawItemCount: 0,
        movieCount: 0,
        seriesCount: 0,
        liveCount: 0,
        unresolvedCount: 0,
      };
    }

    if (!stageResult.success || !stageResult.snapshotId) {
      if (isExistingReal) {
        const res: BootSyncResult = {
          outcome: 'LOCAL_FIRST_ACTIVE_PRESERVED',
          syncState: 'READY',
          snapshotId: existingRealPointer!.snapshotId,
          error: stageResult.errorCode || 'Falha na importacao para staging.',
        };
        this.setState('READY', res);
        return res;
      }
      const res: BootSyncResult = {
        outcome: 'STAGING_FAILED',
        syncState: 'ERROR',
        error: stageResult.errorCode || 'Falha na importacao para staging.',
      };
      this.setState('ERROR', res);
      return res;
    }

    bootTelemetry.mark('T10_FULL_STAGING_COMPLETE');
    const stagedSnapshotId = stageResult.snapshotId;

    // Yield ao event loop antes da validação
    await yieldToEventLoop();

    // 7. Validação estrita pré-promoção
    this.setState('VALIDATING', undefined, 'Validando catálogo em staging...');
    const storage = this.bootstrapService.getStorage();
    const stagedData = await storage.readStaging(stagedSnapshotId).catch(() => null);

    if (!stagedData || !stagedData.catalog || !stagedData.manifest) {
      await storage.cleanupStaging(stagedSnapshotId).catch(() => {});
      const res: BootSyncResult = {
        outcome: 'VALIDATION_FAILED',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error: 'Dados de staging ausentes ou ilegiveis para promocao.',
      };
      this.setState(res.syncState, res);
      return res;
    }

    // Checagem de proveniência
    const manifestSourceId = stagedData.manifest.metadata?.sourceId;
    const manifestSourceVersion = stagedData.manifest.metadata?.sourceVersion;
    const manifestKind = stagedData.manifest.metadata?.kind;

    if (
      manifestKind !== 'REAL' ||
      manifestSourceId !== expectedSourceId ||
      manifestSourceVersion !== expectedSourceVersion
    ) {
      await storage.cleanupStaging(stagedSnapshotId).catch(() => {});
      const res: BootSyncResult = {
        outcome: 'VALIDATION_FAILED',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error: 'Proveniencia do snapshot em staging diverge da fonte autorizada.',
      };
      this.setState(res.syncState, res);
      return res;
    }

    // Checagem de catálogo não vazio
    const movieCount = stagedData.catalog.movies?.length || 0;
    const seriesCount = stagedData.catalog.series?.length || 0;
    const liveCount = stagedData.liveCatalog?.channels?.length || 0;
    const totalItems = movieCount + seriesCount + liveCount;

    if (totalItems === 0) {
      await storage.cleanupStaging(stagedSnapshotId).catch(() => {});
      const res: BootSyncResult = {
        outcome: 'VALIDATION_FAILED',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error: 'Catalogo em staging esta vazio.',
      };
      this.setState(res.syncState, res);
      return res;
    }

    // Checagem contra fixtures sintéticas misturadas
    const hasSyntheticLeak =
      stagedData.catalog.movies.some((m) =>
        m.title.toLowerCase().includes('synthetic') || m.id.toLowerCase().includes('synthetic')
      ) ||
      stagedData.catalog.series.some((s) =>
        s.title.toLowerCase().includes('synthetic') || s.id.toLowerCase().includes('synthetic')
      );

    if (hasSyntheticLeak) {
      await storage.cleanupStaging(stagedSnapshotId).catch(() => {});
      const res: BootSyncResult = {
        outcome: 'VALIDATION_FAILED',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error: 'Detectado conteudo sintetico residual no snapshot real.',
      };
      this.setState(res.syncState, res);
      return res;
    }

    // Yield ao event loop antes da promoção
    await yieldToEventLoop();

    // 8. Promoção Atômica
    this.setState('PROMOTING', undefined, 'Promovendo catálogo ativo...');
    const promotion = await this.bootstrapService.promoteStagedSnapshot(stagedSnapshotId);
    if (!promotion.success || promotion.status !== 'PROMOTED') {
      const res: BootSyncResult = {
        outcome: 'PROMOTION_FAILED',
        syncState: isExistingReal ? 'READY' : 'ERROR',
        error: promotion.errors?.join(', ') || 'Falha durante a promocao atomica do snapshot.',
      };
      this.setState(res.syncState, res);
      return res;
    }

    bootTelemetry.mark('T11_PROMOTION_COMPLETE');
    this.scheduleDeferredSearchBuild(stagedSnapshotId);
    bootTelemetry.logSummary();

    // 9. Conclusão com sucesso
    const successResult: BootSyncResult = {
      outcome: 'PROMOTED',
      syncState: 'READY',
      snapshotId: stagedSnapshotId,
      previousSnapshotId: activePointer?.snapshotId,
      sourceId: expectedSourceId,
      sourceVersion: expectedSourceVersion,
      itemCount: totalItems,
      movieCount,
      seriesCount,
      liveCount,
    };

    this.setState('READY', successResult, 'Catálogo comercial pronto');
    return successResult;
  }
}

function isStoredLicenseStatus(value: unknown): value is StoredLicenseStatus {
  return value === 'TRIAL' ||
    value === 'ACTIVE' ||
    value === 'REVOKED' ||
    value === 'EXPIRED' ||
    value === 'SUSPENDED';
}

let configuredBootSyncCoordinator: BootSyncCoordinator | null = null;

export function getBootSyncCoordinator(deps?: BootSyncCoordinatorDependencies): BootSyncCoordinator {
  if (!configuredBootSyncCoordinator || deps) {
    configuredBootSyncCoordinator = new BootSyncCoordinator(deps);
  }
  return configuredBootSyncCoordinator;
}

export const CLASSIFICATION_PROFILE_VERSIONING = true;
export const OLD_PROFILE_TRIGGERS_SINGLE_REFRESH = true;
export const RESYNC_LOOP_PREVENTED = true;
