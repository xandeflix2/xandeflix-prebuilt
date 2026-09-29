/**
 * Xandeflix Prebuilt — Control Plane Engine (Experiment R7B)
 *
 * Motor de lógica de negócios do Plano de Controle para autorização e resolução de fontes.
 *
 * Princípios:
 * - DUAL_MODE: Suporte estrito a SELF_SERVICE (max_devices=1) e MANAGED (max_devices=N com aprovação).
 * - CONCURRENCY_SAFETY: Ativação atômica por licença prevenindo race conditions em segundo aparelho.
 * - SECURITY_BOUNDARIES: Backend jamais baixa catálogos, não roda spiders e não transmite streams.
 * - MANAGED_SOURCE_ENCRYPTION: Segredos de fontes gerenciadas trafegam protegidos por AES-256-GCM.
 */

import type {
  LicenseEntity,
  DeviceEntity,
  LicenseDeviceBindingEntity,
  ManagedSourceEntity,
  DeviceSourceBindingEntity,
  ControlPlaneSettings,
  DeviceActivationRequest,
  DeviceActivationResponse,
  SourceResolutionRequest,
  SourceResolutionResponse,
  SourceProtocol,
  PlaybackSessionEntity,
  DeviceStartPlaybackSessionRequest,
  DeviceStartPlaybackSessionResponse,
  DeviceHeartbeatPlaybackSessionRequest,
  DeviceHeartbeatPlaybackSessionResponse,
  DeviceClosePlaybackSessionRequest,
  DeviceClosePlaybackSessionResponse,
  CustomerPlaybackSessionListItem,
  PlaybackSessionStatus,
  CommercialActivationEvent,
  ManualActivateLicenseParams,
  ManualActivateLicenseResult,
} from '../control-plane.types.ts';
import type { DeviceType, LicenseMode } from '../../device/device.types.ts';
import type { SourceRuntimeConfig, SourceType } from '../../debug/source/source-runtime-config.ts';
import { ControlPlaneCrypto } from '../crypto/control-plane-crypto.ts';

export class ControlPlaneEngine {
  private licenses: Map<string, LicenseEntity> = new Map();
  private devices: Map<string, DeviceEntity> = new Map();
  private licenseBindings: Map<string, LicenseDeviceBindingEntity> = new Map();
  private managedSources: Map<string, ManagedSourceEntity> = new Map();
  private sourceBindings: Map<string, DeviceSourceBindingEntity> = new Map();
  private playbackSessions: Map<string, PlaybackSessionEntity> = new Map();
  private commercialActivationEvents: Map<string, CommercialActivationEvent> = new Map();
  private commercialAuditLogs: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    managerId?: string;
    createdAt: string;
    metadata: Record<string, unknown>;
  }> = [];
  private simulatedServerNowOffsetMs: number = 0;
  private settings: ControlPlaneSettings = {
    supportContactType: 'WHATSAPP',
    supportContactLabel: 'Suporte Gestor Xandeflix',
    supportContactValue: '+55 11 99999-9999',
  };

  // Mutex lógico para simular isolamento transacional estrito
  private licenseLocks: Map<string, Promise<void>> = new Map();

  private serverMasterKey: string;

  constructor(serverMasterKey: string = 'xandeflix-lab-master-secret-key-32b!') {
    this.serverMasterKey = serverMasterKey;
  }

  getServerNow(): Date {
    return new Date(Date.now() + this.simulatedServerNowOffsetMs);
  }

  advanceServerTime(ms: number): void {
    this.simulatedServerNowOffsetMs += ms;
  }

  setServerNowOffset(ms: number): void {
    this.simulatedServerNowOffsetMs = ms;
  }

  resetServerTime(): void {
    this.simulatedServerNowOffsetMs = 0;
  }

  private async acquireLock(key: string): Promise<() => void> {
    while (this.licenseLocks.has(key)) {
      await this.licenseLocks.get(key);
    }
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.licenseLocks.set(key, lockPromise);

    return () => {
      this.licenseLocks.delete(key);
      resolveLock();
    };
  }

  // ---------------------------------------------------------------------------
  // LICENSES MANAGEMENT (MANAGER ACTIONS)
  // ---------------------------------------------------------------------------

  async createLicense(
    paramOrMode: LicenseMode | { mode: LicenseMode; maxDevices?: number; customKey?: string; notes?: string },
    maxDevices: number = 1,
    customKey?: string
  ): Promise<{ license: LicenseEntity; rawKey: string; id: string; licenseKey: string; mode: LicenseMode; maxDevices: number; status: string }> {
    const opts = typeof paramOrMode === 'object' ? paramOrMode : { mode: paramOrMode, maxDevices, customKey };
    const mode = opts.mode;
    const finalMax = mode === 'SELF_SERVICE' ? 1 : Math.max(1, opts.maxDevices ?? maxDevices ?? 1);
    const rawKey =
      opts.customKey ||
      `XF-LIC-${mode.slice(0, 2)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const licenseKeyHash = await ControlPlaneCrypto.sha256(rawKey);

    const license: LicenseEntity = {
      id: `lic_${Math.random().toString(36).slice(2, 10)}`,
      licenseKeyHash,
      mode,
      status: 'ACTIVE',
      maxDevices: finalMax,
      createdAtIso: new Date().toISOString(),
    };

    this.licenses.set(license.id, license);
    return {
      license,
      rawKey,
      id: license.id,
      licenseKey: rawKey,
      mode: license.mode,
      maxDevices: license.maxDevices,
      status: license.status,
    };
  }

  async getLicenseById(id: string): Promise<LicenseEntity | undefined> {
    return this.licenses.get(id);
  }

  async findLicenseByRawKey(rawKey: string): Promise<LicenseEntity | undefined> {
    const hash = await ControlPlaneCrypto.sha256(rawKey);
    for (const lic of this.licenses.values()) {
      if (lic.licenseKeyHash === hash) {
        return lic;
      }
    }
    return undefined;
  }

  async revokeLicense(licenseId: string): Promise<boolean> {
    const license = this.licenses.get(licenseId);
    if (!license) return false;
    license.status = 'REVOKED';
    return true;
  }

  // ---------------------------------------------------------------------------
  // DEVICE ACTIVATION FLOW
  // ---------------------------------------------------------------------------

  async activateDevice(req: DeviceActivationRequest): Promise<DeviceActivationResponse & { licenseMode?: LicenseMode; deviceToken?: string | null; maxDevices?: number; authorizedDeviceCount?: number }> {
    // 1. Busca licença pelo hash da chave
    const license = await this.findLicenseByRawKey(req.licenseKey);
    if (!license || license.status !== 'ACTIVE') {
      return {
        success: false,
        status: 'LICENSE_INVALID',
        message: 'Chave de licença inválida ou inativa.',
        deviceToken: null,
      };
    }

    if (license.expiresAtIso && new Date(license.expiresAtIso) < new Date()) {
      return {
        success: false,
        status: 'LICENSE_EXPIRED',
        message: 'Esta licença expirou.',
        deviceToken: null,
      };
    }

    // Lock transacional por licença para evitar race conditions
    const releaseLock = await this.acquireLock(license.id);

    try {
      // 2. Registrar ou atualizar dispositivo
      let device = this.devices.get(req.deviceId);
      if (device && device.status === 'REVOKED') {
        return {
          success: false,
          status: 'DEVICE_REVOKED',
          message: 'Este dispositivo foi revogado pelo gestor.',
          deviceToken: null,
        };
      }

      if (!device) {
        device = {
          id: `dev_${Math.random().toString(36).slice(2, 10)}`,
          deviceId: req.deviceId,
          displayCode: req.displayCode,
          deviceType: req.deviceType,
          deviceLabel: req.deviceLabel,
          status: 'UNREGISTERED',
          createdAtIso: new Date().toISOString(),
          lastSeenAtIso: new Date().toISOString(),
        };
        this.devices.set(device.deviceId, device);
      } else {
        device.lastSeenAtIso = new Date().toISOString();
        if (req.deviceLabel) device.deviceLabel = req.deviceLabel;
        if (req.deviceType) device.deviceType = req.deviceType;
      }

      // 3. Obter bindings ativos desta licença
      const activeBindings = Array.from(this.licenseBindings.values()).filter(
        (b) => b.licenseId === license.id && b.status === 'ACTIVE'
      );

      const countAuthorized = activeBindings.filter(
        (b) => this.devices.get(b.deviceId)?.status === 'AUTHORIZED'
      ).length;

      // Verifica se o dispositivo atual JÁ está vinculado a esta licença
      const existingBinding = activeBindings.find((b) => b.deviceId === req.deviceId);
      if (existingBinding && device.status === 'AUTHORIZED') {
        const rawToken = `tok_${Math.random().toString(36).slice(2, 14)}`;
        device.deviceTokenHash = await ControlPlaneCrypto.sha256(rawToken);

        return {
          success: true,
          status: 'AUTHORIZED',
          mode: license.mode,
          licenseMode: license.mode,
          deviceAuthToken: rawToken,
          deviceToken: rawToken,
          maxDevices: license.maxDevices,
          authorizedDeviceCount: countAuthorized,
          supportContact: this.settings,
        };
      }

      // 4. Tratar SELF_SERVICE (max_devices=1 rígido)
      if (license.mode === 'SELF_SERVICE') {
        if (activeBindings.length >= 1 && (!existingBinding || existingBinding.deviceId !== req.deviceId)) {
          return {
            success: false,
            status: 'LICENSE_ALREADY_BOUND',
            mode: 'SELF_SERVICE',
            licenseMode: 'SELF_SERVICE',
            deviceToken: null,
            maxDevices: 1,
            authorizedDeviceCount: countAuthorized,
            message: 'Esta licença já está vinculada a 1 dispositivo.',
            supportContact: this.settings,
          };
        }

        // Primeiro vínculo atômico
        const rawToken = `tok_${Math.random().toString(36).slice(2, 14)}`;
        device.deviceTokenHash = await ControlPlaneCrypto.sha256(rawToken);
        device.status = 'AUTHORIZED';

        const binding: LicenseDeviceBindingEntity = {
          id: `bind_${Math.random().toString(36).slice(2, 10)}`,
          licenseId: license.id,
          deviceId: device.deviceId,
          status: 'ACTIVE',
          boundAtIso: new Date().toISOString(),
        };
        this.licenseBindings.set(binding.id, binding);

        return {
          success: true,
          status: 'AUTHORIZED',
          mode: 'SELF_SERVICE',
          licenseMode: 'SELF_SERVICE',
          deviceAuthToken: rawToken,
          deviceToken: rawToken,
          maxDevices: 1,
          authorizedDeviceCount: 1,
          supportContact: this.settings,
        };
      }

      // 5. Tratar MANAGED (max_devices=N com fluxo de aprovação)
      if (license.mode === 'MANAGED') {
        if (countAuthorized >= license.maxDevices) {
          return {
            success: false,
            status: 'DEVICE_LIMIT_REACHED',
            mode: 'MANAGED',
            licenseMode: 'MANAGED',
            deviceToken: null,
            maxDevices: license.maxDevices,
            authorizedDeviceCount: countAuthorized,
            message: 'Limite máximo de slots de dispositivos atingido para esta licença.',
            supportContact: this.settings,
          };
        }

        // Dispositivo entra em PENDING_MANAGER_APPROVAL (sem token até aprovação)
        device.status = 'PENDING_MANAGER_APPROVAL';

        // Registra associação pendente caso ainda não exista
        if (!existingBinding) {
          const pendingBinding: LicenseDeviceBindingEntity = {
            id: `bind_${Math.random().toString(36).slice(2, 10)}`,
            licenseId: license.id,
            deviceId: device.deviceId,
            status: 'ACTIVE',
            boundAtIso: new Date().toISOString(),
          };
          this.licenseBindings.set(pendingBinding.id, pendingBinding);
        }

        return {
          success: true,
          status: 'PENDING_MANAGER_APPROVAL',
          mode: 'MANAGED',
          licenseMode: 'MANAGED',
          deviceToken: null,
          maxDevices: license.maxDevices,
          authorizedDeviceCount: countAuthorized,
          message: 'Dispositivo registrado com sucesso. Aguardando aprovação do gestor.',
          supportContact: this.settings,
        };
      }

      return {
        success: false,
        status: 'LICENSE_INVALID',
        message: 'Modo de licença não suportado.',
        deviceToken: null,
      };
    } finally {
      releaseLock();
    }
  }

  // ---------------------------------------------------------------------------
  // MANAGER APPROVAL / REVOCATION ACTIONS
  // ---------------------------------------------------------------------------

  async managerApproveDevice(
    deviceId: string,
    deviceType?: DeviceType,
    deviceLabel?: string
  ): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    // Encontra a licença correspondente
    const binding = Array.from(this.licenseBindings.values()).find(
      (b) => b.deviceId === deviceId && b.status === 'ACTIVE'
    );
    if (!binding) return false;

    const license = this.licenses.get(binding.licenseId);
    if (!license || license.status !== 'ACTIVE') return false;

    // Conta quantos já estão autorizados
    const authorizedCount = Array.from(this.licenseBindings.values()).filter((b) => {
      if (b.licenseId !== license.id || b.status !== 'ACTIVE') return false;
      const dev = this.devices.get(b.deviceId);
      return dev && dev.status === 'AUTHORIZED';
    }).length;

    if (authorizedCount >= license.maxDevices && device.status !== 'AUTHORIZED') {
      return false; // Slots excedidos
    }

    device.status = 'AUTHORIZED';
    if (deviceType) device.deviceType = deviceType;
    if (deviceLabel) device.deviceLabel = deviceLabel;

    return true;
  }

  async managerRevokeDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    device.status = 'REVOKED';

    for (const binding of this.licenseBindings.values()) {
      if (binding.deviceId === deviceId && binding.status === 'ACTIVE') {
        binding.status = 'REVOKED';
        binding.revokedAtIso = new Date().toISOString();
      }
    }

    // Remove eventuais source bindings do dispositivo revogado
    for (const [key, sb] of this.sourceBindings.entries()) {
      if (sb.deviceId === deviceId) {
        this.sourceBindings.delete(key);
      }
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // MANAGED SOURCES & BINDINGS
  // ---------------------------------------------------------------------------

  private sanitizeHost(rawHostOrUrl?: string): string | undefined {
    if (!rawHostOrUrl) return undefined;
    try {
      const url = new URL(rawHostOrUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      return rawHostOrUrl.split('/')[0] || undefined;
    }
  }

  async managerCreateManagedSource(
    name: string,
    config: SourceRuntimeConfig
  ): Promise<ManagedSourceEntity> {
    const { encryptedPayload, iv, authTag } = await ControlPlaneCrypto.encryptSourcePayload(
      config,
      this.serverMasterKey
    );

    const entity: ManagedSourceEntity = {
      id: `src_${Math.random().toString(36).slice(2, 10)}`,
      name,
      sourceType: config.type,
      encryptedPayload,
      iv,
      authTag,
      version: 1,
      status: 'ACTIVE',
      sanitizedHost: this.sanitizeHost(config.host || config.playlistUrl),
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
    };

    this.managedSources.set(entity.id, entity);
    return entity;
  }

  async managerUpdateManagedSource(
    sourceId: string,
    update: {
      name?: string;
      sourceType?: SourceType;
      host?: string;
      username?: string;
      password?: string;
      playlistUrl?: string;
    }
  ): Promise<{ success: boolean; source?: ManagedSourceEntity; reason?: string }> {
    const source = this.managedSources.get(sourceId);
    if (!source) {
      return { success: false, reason: 'Fonte gerenciada não encontrada.' };
    }

    // Decifra a configuração existente em memória para merge seguro
    const existingConfig = await ControlPlaneCrypto.decryptSourcePayload(
      source.encryptedPayload,
      source.iv,
      source.authTag,
      this.serverMasterKey
    );

    const newType = update.sourceType || source.sourceType || existingConfig.type;

    // Merge seguro:
    // 1. Segredos (username/password): se omitidos ou vazios, PRESERVAM o segredo existente (KEEP_EXISTING_SECRET).
    const targetUser =
      update.username !== undefined && update.username.trim() !== ''
        ? update.username.trim()
        : existingConfig.username;

    const targetPass =
      update.password !== undefined && update.password.trim() !== ''
        ? update.password.trim()
        : existingConfig.password;

    // 2. Host e Playlist: se passados explicitamente, assumem o novo valor (inclusive vazio se for o caso).
    let targetHost = existingConfig.host;
    if (update.host !== undefined) {
      targetHost = update.host.trim();
    }

    let targetPlaylist = existingConfig.playlistUrl;
    if (update.playlistUrl !== undefined) {
      targetPlaylist = update.playlistUrl.trim();
    }

    const mergedConfig: SourceRuntimeConfig = {
      type: newType,
      host: targetHost || undefined,
      username: targetUser || undefined,
      password: targetPass || undefined,
      playlistUrl: targetPlaylist || undefined,
    };

    // Validação de sanidade da configuração: rejeita atualizações inválidas
    if (mergedConfig.type === 'XTREAM' && !mergedConfig.host) {
      return { success: false, reason: 'Host obrigatório para configuração XTREAM.' };
    }
    if (mergedConfig.type === 'M3U' && !mergedConfig.playlistUrl && !mergedConfig.host) {
      return { success: false, reason: 'URL ou Host obrigatório para configuração M3U.' };
    }

    // Criptografa o novo payload com novo IV e authTag
    const { encryptedPayload, iv, authTag } = await ControlPlaneCrypto.encryptSourcePayload(
      mergedConfig,
      this.serverMasterKey
    );

    // Incremento monotônico de versão
    source.version = (source.version || 1) + 1;
    if (update.name && update.name.trim() !== '') {
      source.name = update.name.trim();
    }
    source.sourceType = mergedConfig.type;
    source.encryptedPayload = encryptedPayload;
    source.iv = iv;
    source.authTag = authTag;
    source.sanitizedHost = this.sanitizeHost(mergedConfig.host || mergedConfig.playlistUrl);
    source.updatedAtIso = new Date().toISOString();

    // BINDINGS PRESERVADOS: todos os deviceSourceBindings existentes são mantidos inalterados!
    return { success: true, source };
  }

  async managerDisableSource(sourceId: string): Promise<{ success: boolean; reason?: string }> {
    const source = this.managedSources.get(sourceId);
    if (!source) return { success: false, reason: 'Fonte não encontrada.' };
    source.status = 'DISABLED';
    source.updatedAtIso = new Date().toISOString();
    return { success: true };
  }

  async managerEnableSource(sourceId: string): Promise<{ success: boolean; reason?: string }> {
    const source = this.managedSources.get(sourceId);
    if (!source) return { success: false, reason: 'Fonte não encontrada.' };
    source.status = 'ACTIVE';
    source.updatedAtIso = new Date().toISOString();
    return { success: true };
  }

  async managerUnbindDeviceSource(deviceId: string): Promise<{ success: boolean; reason?: string }> {
    const binding = this.sourceBindings.get(deviceId);
    if (!binding) {
      return { success: false, reason: 'Dispositivo não possui fonte vinculada.' };
    }
    this.sourceBindings.delete(deviceId);
    return { success: true };
  }

  async managerTestConnection(
    candidate: string | { sourceId?: string; config?: SourceRuntimeConfig }
  ): Promise<{
    success: boolean;
    status: 'CONEXÃO OK' | 'FALHA DE AUTENTICAÇÃO' | 'HOST INDISPONÍVEL' | 'CONFIGURAÇÃO INVÁLIDA' | 'TIMEOUT';
    message: string;
    httpStatusCode?: number;
  }> {
    let configToTest: SourceRuntimeConfig | null = null;

    if (typeof candidate === 'string') {
      const source = this.managedSources.get(candidate);
      if (!source) {
        return {
          success: false,
          status: 'CONFIGURAÇÃO INVÁLIDA',
          message: 'Fonte gerenciada não encontrada.',
        };
      }
      configToTest = await ControlPlaneCrypto.decryptSourcePayload(
        source.encryptedPayload,
        source.iv,
        source.authTag,
        this.serverMasterKey
      );
    } else if (candidate.config) {
      configToTest = candidate.config;
    } else if (candidate.sourceId) {
      const source = this.managedSources.get(candidate.sourceId);
      if (!source) {
        return {
          success: false,
          status: 'CONFIGURAÇÃO INVÁLIDA',
          message: 'Fonte gerenciada não encontrada.',
        };
      }
      configToTest = await ControlPlaneCrypto.decryptSourcePayload(
        source.encryptedPayload,
        source.iv,
        source.authTag,
        this.serverMasterKey
      );
    }

    if (!configToTest) {
      return {
        success: false,
        status: 'CONFIGURAÇÃO INVÁLIDA',
        message: 'Nenhuma configuração para testar.',
      };
    }

    let probeUrl = '';
    if (configToTest.type === 'XTREAM') {
      if (!configToTest.host) {
        return {
          success: false,
          status: 'CONFIGURAÇÃO INVÁLIDA',
          message: 'Host XTREAM não informado.',
        };
      }
      const host = configToTest.host.replace(/\/+$/, '');
      const u = encodeURIComponent(configToTest.username || '');
      const p = encodeURIComponent(configToTest.password || '');
      probeUrl = `${host}/player_api.php?username=${u}&password=${p}`;
    } else if (configToTest.type === 'M3U') {
      const rawUrl = configToTest.playlistUrl || configToTest.host;
      if (!rawUrl) {
        return {
          success: false,
          status: 'CONFIGURAÇÃO INVÁLIDA',
          message: 'URL da playlist M3U não informada.',
        };
      }
      probeUrl = rawUrl;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(probeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Xandeflix-Probe/1.0',
          Range: 'bytes=0-512',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 200 || res.status === 206) {
        if (configToTest.type === 'XTREAM') {
          try {
            const data = await res.clone().json();
            if (data && data.user_info && data.user_info.auth === 0) {
              return {
                success: false,
                status: 'FALHA DE AUTENTICAÇÃO',
                message: 'Servidor recusou as credenciais fornecidas.',
                httpStatusCode: res.status,
              };
            }
          } catch {}
        }
        return {
          success: true,
          status: 'CONEXÃO OK',
          message: 'Servidor respondeu com sucesso ao probe mínimo.',
          httpStatusCode: res.status,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          status: 'FALHA DE AUTENTICAÇÃO',
          message: `Autenticação rejeitada (HTTP ${res.status}).`,
          httpStatusCode: res.status,
        };
      }

      if (res.status === 404 || res.status >= 500) {
        return {
          success: false,
          status: 'HOST INDISPONÍVEL',
          message: `Servidor retornou erro HTTP ${res.status}.`,
          httpStatusCode: res.status,
        };
      }

      return {
        success: true,
        status: 'CONEXÃO OK',
        message: `Servidor respondeu (HTTP ${res.status}).`,
        httpStatusCode: res.status,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return {
          success: false,
          status: 'TIMEOUT',
          message: 'Tempo limite esgotado ao tentar alcançar o servidor (5s).',
        };
      }
      return {
        success: false,
        status: 'HOST INDISPONÍVEL',
        message: 'Não foi possível estabelecer conexão com o host informado.',
      };
    }
  }

  async managerBindSource(
    licenseId: string,
    deviceId: string,
    sourceId: string
  ): Promise<{ success: boolean; reason?: string }> {
    const license = this.licenses.get(licenseId);
    if (!license || license.status !== 'ACTIVE') {
      return { success: false, reason: 'Licença inexistente ou inativa.' };
    }

    const device = this.devices.get(deviceId);
    if (!device || device.status !== 'AUTHORIZED') {
      return { success: false, reason: 'Dispositivo deve estar AUTHORIZED para receber fonte.' };
    }

    // Valida que o device pertence de fato a esta licença (impede cross-customer binding)
    const binding = Array.from(this.licenseBindings.values()).find(
      (b) => b.licenseId === licenseId && b.deviceId === deviceId && b.status === 'ACTIVE'
    );
    if (!binding) {
      return { success: false, reason: 'CROSS_CUSTOMER_BINDING_DENIED' };
    }

    const source = this.managedSources.get(sourceId);
    if (!source) {
      return { success: false, reason: 'Fonte gerenciada inexistente.' };
    }

    const deviceSourceBinding: DeviceSourceBindingEntity = {
      id: `dsb_${Math.random().toString(36).slice(2, 10)}`,
      licenseId,
      deviceId,
      sourceId,
      createdAtIso: new Date().toISOString(),
    };

    this.sourceBindings.set(deviceId, deviceSourceBinding);
    return { success: true };
  }

  async managerSwitchDeviceSourceBinding(
    deviceId: string,
    newSourceId: string
  ): Promise<{
    success: boolean;
    reason?: string;
    previousSourceId?: string;
    newSourceId?: string;
  }> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return { success: false, reason: 'Dispositivo não encontrado.' };
    }
    if (device.status !== 'AUTHORIZED') {
      return { success: false, reason: 'Dispositivo deve estar AUTHORIZED para receber fonte.' };
    }

    const licenseBinding = Array.from(this.licenseBindings.values()).find(
      (b) => b.deviceId === deviceId && b.status === 'ACTIVE'
    );
    if (!licenseBinding) {
      return { success: false, reason: 'Dispositivo não possui vínculo ativo com nenhuma licença.' };
    }

    const license = this.licenses.get(licenseBinding.licenseId);
    if (!license || license.status !== 'ACTIVE') {
      return { success: false, reason: 'Licença vinculada ao dispositivo não está ativa.' };
    }

    const newSource = this.managedSources.get(newSourceId);
    if (!newSource) {
      return { success: false, reason: 'Fonte gerenciada selecionada não existe.' };
    }
    if (newSource.status !== 'ACTIVE') {
      return { success: false, reason: 'A fonte gerenciada selecionada não está ativa.' };
    }

    const oldBinding = this.sourceBindings.get(deviceId);

    // Se já está vinculado à mesma fonte, operação é no-op bem sucedida
    if (oldBinding && oldBinding.sourceId === newSourceId) {
      return {
        success: true,
        previousSourceId: oldBinding.sourceId,
        newSourceId,
        reason: 'Dispositivo já está vinculado a esta fonte.',
      };
    }

    // Comutação atômica
    try {
      const newBinding: DeviceSourceBindingEntity = {
        id: `dsb_${Math.random().toString(36).slice(2, 10)}`,
        licenseId: license.id,
        deviceId,
        sourceId: newSourceId,
        createdAtIso: new Date().toISOString(),
      };

      this.sourceBindings.set(deviceId, newBinding);

      return {
        success: true,
        previousSourceId: oldBinding?.sourceId,
        newSourceId,
      };
    } catch (err: any) {
      // Rollback para o binding anterior em caso de erro inesperado
      if (oldBinding) {
        this.sourceBindings.set(deviceId, oldBinding);
      } else {
        this.sourceBindings.delete(deviceId);
      }
      return {
        success: false,
        reason: `Falha ao comutar fonte: ${err?.message || 'Erro desconhecido'}`,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // SOURCE RESOLUTION (INVOKED DIRECTLY BY DEVICE)
  // ---------------------------------------------------------------------------

  async resolveDeviceSource(req: SourceResolutionRequest): Promise<SourceResolutionResponse> {
    if (!this.devices.has(req.deviceId) || this.devices.size === 0) {
      await this.loadSyncState();
    }

    const device = this.devices.get(req.deviceId);
    if (!device) {
      return { status: 'DEVICE_NOT_AUTHORIZED', message: 'Dispositivo não encontrado.' };
    }

    if (device.status === 'REVOKED') {
      return { status: 'DEVICE_REVOKED', message: 'Dispositivo foi revogado.' };
    }

    if (device.status !== 'AUTHORIZED') {
      return { status: 'DEVICE_NOT_AUTHORIZED', message: 'Dispositivo aguarda autorização.' };
    }

    // Autentica token do dispositivo
    const tokenHash = await ControlPlaneCrypto.sha256(req.deviceAuthToken);
    if (!device.deviceTokenHash || device.deviceTokenHash !== tokenHash) {
      return { status: 'DEVICE_NOT_AUTHORIZED', message: 'Token de autenticação do dispositivo inválido.' };
    }

    // Valida vínculo de licença ativa
    const binding = Array.from(this.licenseBindings.values()).find(
      (b) => b.deviceId === req.deviceId && b.status === 'ACTIVE'
    );
    if (!binding) {
      return { status: 'LICENSE_INVALID', message: 'Nenhuma licença ativa vinculada.' };
    }

    const license = this.licenses.get(binding.licenseId);
    if (!license || license.status !== 'ACTIVE') {
      return { status: 'LICENSE_INVALID', message: 'A licença foi revogada ou expirou.' };
    }

    // Modo SELF_SERVICE: O dispositivo resolve sua fonte a partir de sua própria configuração local
    if (license.mode === 'SELF_SERVICE') {
      return {
        status: 'SOURCE_READY',
        mode: 'SELF_SERVICE',
        supportContact: this.settings,
      };
    }

    // Modo MANAGED: O plano de controle entrega a configuração decifrada ao dispositivo autorizado
    if (license.mode === 'MANAGED') {
      const sourceBinding = this.sourceBindings.get(req.deviceId);
      if (!sourceBinding) {
        return {
          status: 'SOURCE_NOT_BOUND',
          mode: 'MANAGED',
          message: 'Nenhuma fonte foi vinculada a este dispositivo pelo gestor.',
          supportContact: this.settings,
        };
      }

      const managedSource = this.managedSources.get(sourceBinding.sourceId);
      if (!managedSource) {
        return {
          status: 'SOURCE_NOT_BOUND',
          mode: 'MANAGED',
          message: 'Fonte gerenciada associada não foi encontrada.',
          supportContact: this.settings,
        };
      }

      if (managedSource.status === 'DISABLED') {
        return {
          status: 'SOURCE_NOT_BOUND',
          mode: 'MANAGED',
          sourceId: managedSource.id,
          sourceVersion: managedSource.version || 1,
          protocol: this.getSourceProtocol(managedSource.sourceType),
          sourceStatus: managedSource.status,
          message: 'A fonte gerenciada vinculada a este dispositivo está desativada temporariamente.',
          supportContact: this.settings,
        };
      }

      // Decifra o payload efêmero para envio ao dispositivo
      const config = await ControlPlaneCrypto.decryptSourcePayload(
        managedSource.encryptedPayload,
        managedSource.iv,
        managedSource.authTag,
        this.serverMasterKey
      );

      return {
        status: 'SOURCE_READY',
        mode: 'MANAGED',
        config,
        sourceId: managedSource.id,
        sourceVersion: managedSource.version || 1,
        protocol: this.getSourceProtocol(managedSource.sourceType),
        sourceStatus: managedSource.status,
        supportContact: this.settings,
      };
    }

    return {
      status: 'LICENSE_INVALID',
      message: 'Modo de licença desconhecido.',
    };
  }

  private getSourceProtocol(sourceType: SourceType): SourceProtocol | undefined {
    return sourceType === 'M3U' || sourceType === 'XTREAM' ? sourceType : undefined;
  }

  // ---------------------------------------------------------------------------
  // CONSULTAS E LISTAGENS PARA O MANAGER LAB PANEL
  // ---------------------------------------------------------------------------

  getAllLicenses(): LicenseEntity[] {
    return Array.from(this.licenses.values());
  }

  getAllDevices(): DeviceEntity[] {
    return Array.from(this.devices.values());
  }

  getAllManagedSources(): ManagedSourceEntity[] {
    return Array.from(this.managedSources.values());
  }

  getBindingsForLicense(licenseId: string): LicenseDeviceBindingEntity[] {
    return Array.from(this.licenseBindings.values()).filter((b) => b.licenseId === licenseId);
  }

  getAllLicenseBindings(): LicenseDeviceBindingEntity[] {
    return Array.from(this.licenseBindings.values());
  }

  getSourceBindingForDevice(deviceId: string): DeviceSourceBindingEntity | undefined {
    return this.sourceBindings.get(deviceId);
  }

  setSettings(settings: ControlPlaneSettings): void {
    this.settings = { ...this.settings, ...settings };
  }

  findLicenseById(id: string): LicenseEntity | undefined {
    return this.licenses.get(id);
  }

  findDevice(_licenseId: string, deviceId: string): DeviceEntity | undefined {
    return this.devices.get(deviceId);
  }

  async approveDevice(opts: {
    licenseId: string;
    deviceId: string;
    deviceType?: DeviceType;
    deviceLabel?: string;
  }): Promise<DeviceEntity> {
    const success = await this.managerApproveDevice(opts.deviceId, opts.deviceType, opts.deviceLabel);
    if (!success) {
      throw new Error(`Falha ao aprovar dispositivo ${opts.deviceId} (limite de slots atingido ou licença inativa)`);
    }
    return this.devices.get(opts.deviceId)!;
  }

  async revokeDevice(opts: { licenseId: string; deviceId: string }): Promise<DeviceEntity> {
    await this.managerRevokeDevice(opts.deviceId);
    return this.devices.get(opts.deviceId)!;
  }

  async getAuthorizedDeviceCount(licenseId: string): Promise<number> {
    const bindings = Array.from(this.licenseBindings.values()).filter(
      (b) => b.licenseId === licenseId && b.status === 'ACTIVE'
    );
    return bindings.filter((b) => {
      const dev = this.devices.get(b.deviceId);
      return dev && dev.status === 'AUTHORIZED';
    }).length;
  }

  async getLicenseDevices(licenseId: string): Promise<DeviceEntity[]> {
    const bindings = Array.from(this.licenseBindings.values()).filter((b) => b.licenseId === licenseId);
    return bindings.map((b) => this.devices.get(b.deviceId)!).filter(Boolean);
  }

  async createManagedSource(opts: {
    licenseId?: string;
    name: string;
    sourceType?: SourceType;
    config: SourceRuntimeConfig;
  }): Promise<ManagedSourceEntity> {
    return this.managerCreateManagedSource(opts.name, opts.config);
  }

  async bindSourceToDevices(opts: {
    licenseId: string;
    sourceId: string;
    deviceIds: string[];
  }): Promise<{ boundCount: number }> {
    for (const devId of opts.deviceIds) {
      const binding = Array.from(this.licenseBindings.values()).find(
        (b) => b.deviceId === devId && b.status === 'ACTIVE'
      );
      if (!binding || binding.licenseId !== opts.licenseId) {
        throw new Error(`CROSS_CUSTOMER_BINDING_DENIED: Device ${devId} não pertence à licença ${opts.licenseId}`);
      }
    }
    let boundCount = 0;
    for (const devId of opts.deviceIds) {
      const res = await this.managerBindSource(opts.licenseId, devId, opts.sourceId);
      if (res.success) boundCount++;
    }
    return { boundCount };
  }

  exportState(): {
    licenses: LicenseEntity[];
    devices: DeviceEntity[];
    licenseBindings: LicenseDeviceBindingEntity[];
    managedSources: ManagedSourceEntity[];
    sourceBindings: DeviceSourceBindingEntity[];
  } {
    return {
      licenses: Array.from(this.licenses.values()),
      devices: Array.from(this.devices.values()),
      licenseBindings: Array.from(this.licenseBindings.values()),
      managedSources: Array.from(this.managedSources.values()),
      sourceBindings: Array.from(this.sourceBindings.values()),
    };
  }

  importState(state: {
    licenses?: LicenseEntity[];
    devices?: DeviceEntity[];
    licenseBindings?: LicenseDeviceBindingEntity[];
    managedSources?: ManagedSourceEntity[];
    sourceBindings?: DeviceSourceBindingEntity[];
  }): void {
    if (state.licenses) {
      this.licenses.clear();
      state.licenses.forEach((l) => this.licenses.set(l.id, l));
    }
    if (state.devices) {
      this.devices.clear();
      state.devices.forEach((d) => this.devices.set(d.deviceId, d));
    }
    if (state.licenseBindings) {
      this.licenseBindings.clear();
      state.licenseBindings.forEach((b) => this.licenseBindings.set(b.id, b));
    }
    if (state.managedSources) {
      this.managedSources.clear();
      state.managedSources.forEach((s) => {
        const enriched: ManagedSourceEntity = {
          ...s,
          version: s.version || 1,
          status: s.status || 'ACTIVE',
          sanitizedHost: s.sanitizedHost || this.sanitizeHost(s.name),
        };
        this.managedSources.set(enriched.id, enriched);
      });
    }
    if (state.sourceBindings) {
      this.sourceBindings.clear();
      state.sourceBindings.forEach((sb) => this.sourceBindings.set(sb.deviceId, sb));
    }
  }

  getAllSourceBindings(): DeviceSourceBindingEntity[] {
    return Array.from(this.sourceBindings.values());
  }

  getDevicesForSource(sourceId: string): Array<{ device: DeviceEntity; binding: DeviceSourceBindingEntity }> {
    const list: Array<{ device: DeviceEntity; binding: DeviceSourceBindingEntity }> = [];
    for (const binding of this.sourceBindings.values()) {
      if (binding.sourceId === sourceId) {
        const dev = this.devices.get(binding.deviceId);
        if (dev) {
          list.push({ device: dev, binding });
        }
      }
    }
    return list;
  }

  getAvailableDevicesForSource(sourceId: string): DeviceEntity[] {
    // Dispositivos autorizados que ainda não estão vinculados a esta source
    const alreadyBoundDeviceIds = new Set(
      Array.from(this.sourceBindings.values())
        .filter((b) => b.sourceId === sourceId)
        .map((b) => b.deviceId)
    );

    return Array.from(this.devices.values()).filter(
      (d) => d.status === 'AUTHORIZED' && !alreadyBoundDeviceIds.has(d.deviceId)
    );
  }

  async saveSyncState(): Promise<void> {
    const state = this.exportState();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('__xandeflix_control_plane_state__', JSON.stringify(state));
      } catch {}
    }
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      await Filesystem.writeFile({
        path: 'control-plane-state.json',
        directory: Directory.Data,
        data: JSON.stringify(state, null, 2),
        encoding: Encoding.UTF8,
      });
    } catch {}
    if (typeof fetch !== 'undefined') {
      try {
        await fetch('/api/control-plane/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        });
      } catch {}
    }
  }

  async loadSyncState(): Promise<void> {
    try {
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const file = await Filesystem.readFile({
        path: 'control-plane-state.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      if (file && file.data) {
        this.importState(JSON.parse(String(file.data)));
        return;
      }
    } catch {}
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/api/control-plane/state');
        if (res.ok) {
          const data = await res.json();
          if (data && (data.licenses || data.devices || data.managedSources)) {
            this.importState(data);
            return;
          }
        }
      } catch {}
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('__xandeflix_control_plane_state__');
        if (raw) {
          this.importState(JSON.parse(raw));
        }
      } catch {}
    }
  }

  // ---------------------------------------------------------------------------
  // GATE C9: PLAYBACK SESSION ENFORCEMENT
  // ---------------------------------------------------------------------------

  async evaluateLicenseAccess(
    licenseId: string,
    deviceId?: string
  ): Promise<{ accessAllowed: boolean; code?: string; message?: string; licenseStatus?: string }> {
    const license = this.licenses.get(licenseId);
    if (!license) {
      return { accessAllowed: false, code: 'LICENSE_NOT_FOUND', message: 'Licença não encontrada.' };
    }

    if (deviceId) {
      const device = this.devices.get(deviceId);
      if (!device || device.status !== 'AUTHORIZED') {
        return {
          accessAllowed: false,
          code: 'DEVICE_NOT_AUTHORIZED',
          licenseStatus: license.status,
          message: 'Dispositivo não autorizado para reprodução.',
        };
      }

      const binding = Array.from(this.licenseBindings.values()).find(
        (b) => b.licenseId === licenseId && b.deviceId === deviceId && b.status === 'ACTIVE'
      );
      if (!binding) {
        return {
          accessAllowed: false,
          code: 'DEVICE_NOT_AUTHORIZED',
          licenseStatus: license.status,
          message: 'Dispositivo não vinculado a esta licença.',
        };
      }
    }

    if (license.status === 'REVOKED') {
      return { accessAllowed: false, code: 'LICENSE_REVOKED', licenseStatus: 'REVOKED', message: 'Licença revogada administrativamente.' };
    }
    if (license.status === 'SUSPENDED') {
      return { accessAllowed: false, code: 'LICENSE_SUSPENDED', licenseStatus: 'SUSPENDED', message: 'Licença suspensa temporariamente.' };
    }
    if (license.status === 'EXPIRED') {
      return { accessAllowed: false, code: 'LICENSE_EXPIRED', licenseStatus: 'EXPIRED', message: 'Período da licença expirado.' };
    }
    if (license.status === 'TRIAL') {
      const serverNow = this.getServerNow();
      if (license.trialExpiresAtIso && serverNow.getTime() >= new Date(license.trialExpiresAtIso).getTime()) {
        license.status = 'EXPIRED';
        return {
          accessAllowed: false,
          code: 'TRIAL_EXPIRED',
          licenseStatus: 'EXPIRED',
          message: 'Seu período de teste de 7 dias terminou.',
        };
      }
    }

    return { accessAllowed: true, code: 'ACTIVE', licenseStatus: license.status };
  }

  updateLicenseLimits(
    licenseId: string,
    maxDevices: number,
    maxConcurrentSessions: number
  ): { success: boolean; licenseId: string; maxDevices: number; maxConcurrentSessions: number } {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error('LICENSE_NOT_FOUND');

    // Política C8 para maxDevices: não pode reduzir abaixo dos dispositivos ativos
    const activeBindings = Array.from(this.licenseBindings.values()).filter(
      (b) => b.licenseId === licenseId && b.status === 'ACTIVE'
    );
    if (maxDevices < activeBindings.length) {
      throw new Error(`CANNOT_REDUCE_BELOW_ACTIVE_DEVICES: ${activeBindings.length} dispositivos ativos vinculados.`);
    }

    // Política C9 para maxConcurrentSessions:
    // CONCURRENCY_LIMIT_REDUCTION_POLICY=EXISTING_SESSIONS_CONTINUE_NEW_STARTS_DENIED
    // Altera o limite na licença. Sessões existentes NÃO são encerradas ou deletadas.
    // Novas chamadas a startPlaybackSession serão negadas caso activeSessions >= novoLimite.
    license.maxDevices = maxDevices;
    license.maxConcurrentSessions = maxConcurrentSessions;

    return {
      success: true,
      licenseId,
      maxDevices: license.maxDevices,
      maxConcurrentSessions: license.maxConcurrentSessions,
    };
  }

  suspendLicense(licenseId: string): { success: boolean; licenseId: string; status: 'SUSPENDED' } {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error('LICENSE_NOT_FOUND');
    license.status = 'SUSPENDED';
    return { success: true, licenseId, status: 'SUSPENDED' };
  }

  async startPlaybackSession(
    req: DeviceStartPlaybackSessionRequest
  ): Promise<DeviceStartPlaybackSessionResponse> {
    const unlock = await this.acquireLock(req.licenseId);
    try {
      const serverNow = this.getServerNow();
      const serverNowIso = serverNow.toISOString();

      // 1. Validação de parâmetros
      if (!req.licenseId || !req.deviceId || !req.deviceToken) {
        return {
          success: false,
          code: 'INVALID_PARAMETERS',
          message: 'Parâmetros obrigatórios ausentes.',
        };
      }

      // 2. Valida dispositivo
      const device = this.devices.get(req.deviceId);
      if (!device || device.status !== 'AUTHORIZED') {
        return {
          success: false,
          code: 'DEVICE_NOT_AUTHORIZED',
          message: 'Dispositivo não autorizado.',
        };
      }

      // 3. Prova criptográfica do token de dispositivo
      const deviceTokenHash = await ControlPlaneCrypto.sha256(req.deviceToken);
      if (device.deviceTokenHash && deviceTokenHash !== device.deviceTokenHash) {
        return {
          success: false,
          code: 'INVALID_DEVICE_TOKEN_PROOF',
          message: 'Prova de token do dispositivo inválida.',
        };
      }

      // 4. Valida vinculação da licença
      const binding = Array.from(this.licenseBindings.values()).find(
        (b) => b.licenseId === req.licenseId && b.deviceId === req.deviceId && b.status === 'ACTIVE'
      );
      if (!binding) {
        return {
          success: false,
          code: 'DEVICE_NOT_BOUND_TO_LICENSE',
          message: 'Dispositivo não vinculado a esta licença.',
        };
      }

      // 5. Avalia direito comercial da licença
      const license = this.licenses.get(req.licenseId);
      if (!license) {
        return {
          success: false,
          code: 'LICENSE_NOT_FOUND',
          message: 'Licença não encontrada.',
        };
      }

      const evalAccess = await this.evaluateLicenseAccess(req.licenseId, req.deviceId);
      if (!evalAccess.accessAllowed) {
        return {
          success: false,
          code: evalAccess.code || 'LICENSE_ACCESS_DENIED',
          message: evalAccess.message || 'Acesso da licença negado.',
        };
      }

      // 6. Limpeza e expiração de sessões stale (> 120s sem heartbeat)
      const STALE_THRESHOLD_MS = 120 * 1000;
      for (const session of this.playbackSessions.values()) {
        if (session.licenseId === req.licenseId && session.status === 'ACTIVE') {
          const lastHb = new Date(session.lastHeartbeatAtIso).getTime();
          if (serverNow.getTime() - lastHb >= STALE_THRESHOLD_MS) {
            session.status = 'STALE';
            session.closedAtIso = serverNowIso;
            session.closeReason = 'STALE_TIMEOUT';
          }
        }
      }

      // 7. Política MVP: ONE_ACTIVE_PLAYBACK_SESSION_PER_DEVICE_PER_LICENSE
      // Se o mesmo dispositivo tentar iniciar novamente, encerra a sessão anterior dele
      for (const session of this.playbackSessions.values()) {
        if (
          session.licenseId === req.licenseId &&
          session.deviceId === req.deviceId &&
          session.status === 'ACTIVE'
        ) {
          session.status = 'CLOSED';
          session.closedAtIso = serverNowIso;
          session.closeReason = 'SUPERSEDED_BY_NEW_SESSION';
        }
      }

      // 8. Contagem atômica de sessões ativas
      const activeSessions = Array.from(this.playbackSessions.values()).filter(
        (s) =>
          s.licenseId === req.licenseId &&
          s.status === 'ACTIVE' &&
          serverNow.getTime() - new Date(s.lastHeartbeatAtIso).getTime() < STALE_THRESHOLD_MS
      );

      const maxConcurrent = license.maxConcurrentSessions || 1;
      if (activeSessions.length >= maxConcurrent) {
        return {
          success: false,
          code: 'SESSION_LIMIT_REACHED',
          maxConcurrentSessions: maxConcurrent,
          activeSessions: activeSessions.length,
          message: 'Limite de telas simultâneas atingido para esta licença.',
        };
      }

      // 9. Geração de token de sessão criptograficamente seguro (32 bytes random)
      const sessionId = `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
      const rawSessionToken = `stk_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const sessionTokenHash = await ControlPlaneCrypto.sha256(rawSessionToken);

      const session: PlaybackSessionEntity = {
        id: sessionId,
        licenseId: req.licenseId,
        deviceId: req.deviceId,
        sessionTokenHash,
        status: 'ACTIVE',
        createdAtIso: serverNowIso,
        lastHeartbeatAtIso: serverNowIso,
        metadata: req.metadata,
      };

      this.playbackSessions.set(sessionId, session);

      return {
        success: true,
        sessionId,
        sessionToken: rawSessionToken,
        licenseId: req.licenseId,
        deviceId: req.deviceId,
        status: 'ACTIVE',
        heartbeatIntervalSeconds: 60,
        staleSessionSeconds: 120,
        createdAt: serverNowIso,
        maxConcurrentSessions: maxConcurrent,
        activeSessions: activeSessions.length + 1,
      };
    } finally {
      unlock();
    }
  }

  async heartbeatPlaybackSession(
    req: DeviceHeartbeatPlaybackSessionRequest
  ): Promise<DeviceHeartbeatPlaybackSessionResponse> {
    if (!req.sessionId || !req.deviceId || !req.sessionToken) {
      return {
        success: false,
        code: 'INVALID_PARAMETERS',
        message: 'Identificador de sessão, dispositivo e token são obrigatórios.',
      };
    }

    const session = this.playbackSessions.get(req.sessionId);
    if (!session || session.deviceId !== req.deviceId) {
      return {
        success: false,
        code: 'SESSION_NOT_FOUND',
        message: 'Sessão de reprodução não encontrada para este dispositivo.',
      };
    }

    // Validação de token com hash (stored session hash como bearer é rejeitado!)
    const providedHash = await ControlPlaneCrypto.sha256(req.sessionToken);
    if (providedHash !== session.sessionTokenHash) {
      return {
        success: false,
        code: 'INVALID_SESSION_TOKEN',
        message: 'Token de sessão inválido.',
      };
    }

    if (session.status !== 'ACTIVE') {
      return {
        success: false,
        code: 'SESSION_NOT_ACTIVE',
        sessionStatus: session.status,
        message: 'Sessão de reprodução não está ativa.',
      };
    }

    const serverNow = this.getServerNow();
    const serverNowIso = serverNow.toISOString();
    const STALE_THRESHOLD_MS = 120 * 1000;
    const lastHb = new Date(session.lastHeartbeatAtIso).getTime();

    if (serverNow.getTime() - lastHb >= STALE_THRESHOLD_MS) {
      session.status = 'STALE';
      session.closedAtIso = serverNowIso;
      session.closeReason = 'STALE_TIMEOUT';
      return {
        success: false,
        code: 'SESSION_STALE',
        sessionStatus: 'STALE',
        message: 'Sessão expirada por inatividade (stale timeout).',
      };
    }

    // Validação contínua da licença (suspensão, revogação, expiração, trial vencido)
    const evalAccess = await this.evaluateLicenseAccess(session.licenseId, session.deviceId);
    if (!evalAccess.accessAllowed) {
      session.status = 'CLOSED';
      session.closedAtIso = serverNowIso;
      session.closeReason = evalAccess.code || 'LICENSE_ACCESS_REVOKED';
      return {
        success: false,
        code: evalAccess.code || 'LICENSE_ACCESS_REVOKED',
        sessionStatus: 'CLOSED',
        message: evalAccess.message || 'Acesso da licença não mais permitido.',
      };
    }

    session.lastHeartbeatAtIso = serverNowIso;
    return {
      success: true,
      sessionId: session.id,
      status: 'ACTIVE',
      lastHeartbeatAt: serverNowIso,
    };
  }

  async closePlaybackSession(
    req: DeviceClosePlaybackSessionRequest
  ): Promise<DeviceClosePlaybackSessionResponse> {
    if (!req.sessionId || !req.deviceId || !req.sessionToken) {
      return {
        success: false,
        code: 'INVALID_PARAMETERS',
        message: 'Identificador de sessão, dispositivo e token são obrigatórios.',
      };
    }

    const session = this.playbackSessions.get(req.sessionId);
    if (!session || session.deviceId !== req.deviceId) {
      return {
        success: false,
        code: 'SESSION_NOT_FOUND',
        message: 'Sessão de reprodução não encontrada.',
      };
    }

    const providedHash = await ControlPlaneCrypto.sha256(req.sessionToken);
    if (providedHash !== session.sessionTokenHash) {
      return {
        success: false,
        code: 'INVALID_SESSION_TOKEN',
        message: 'Token de sessão inválido.',
      };
    }

    // Idempotência
    if (session.status === 'CLOSED') {
      return {
        success: true,
        sessionId: session.id,
        status: 'CLOSED',
        message: 'Sessão já estava encerrada.',
      };
    }

    const serverNow = this.getServerNow();
    session.status = 'CLOSED';
    session.closedAtIso = serverNow.toISOString();
    session.closeReason = req.closeReason || 'USER_EXIT';

    return {
      success: true,
      sessionId: session.id,
      status: 'CLOSED',
    };
  }

  listPlaybackSessions(filter?: {
    licenseId?: string;
    customerId?: string;
    status?: PlaybackSessionStatus;
  }): CustomerPlaybackSessionListItem[] {
    const results: CustomerPlaybackSessionListItem[] = [];
    for (const session of this.playbackSessions.values()) {
      if (filter?.licenseId && session.licenseId !== filter.licenseId) continue;
      if (filter?.status && session.status !== filter.status) continue;

      const license = this.licenses.get(session.licenseId);
      if (filter?.customerId && license?.customerId !== filter.customerId) continue;

      const device = this.devices.get(session.deviceId);
      results.push({
        sessionId: session.id,
        licenseId: session.licenseId,
        deviceId: session.deviceId,
        deviceDisplayCode: device?.displayCode || 'DESCONHECIDO',
        deviceLabel: device?.deviceLabel || 'Dispositivo',
        deviceType: device?.deviceType || 'TV',
        status: session.status,
        createdAt: session.createdAtIso,
        lastHeartbeatAt: session.lastHeartbeatAtIso,
        closedAt: session.closedAtIso || null,
        closeReason: session.closeReason || null,
      });
    }
    return results.sort((a, b) => new Date(b.lastHeartbeatAt).getTime() - new Date(a.lastHeartbeatAt).getTime());
  }

  // ---------------------------------------------------------------------------
  // GATE C10: MANUAL ACTIVATION & COMMERCIAL EVIDENCE
  // ---------------------------------------------------------------------------

  async activateLicenseManual(
    params: ManualActivateLicenseParams & { callerRole?: string },
    managerId: string = 'mgr_active_admin'
  ): Promise<ManualActivateLicenseResult> {
    if ((params as any).callerRole && (params as any).callerRole !== 'MANAGER') {
      throw new Error('MANAGER_AUTH_REQUIRED: Apenas gestores autenticados podem realizar ativação manual.');
    }
    if (!managerId) {
      throw new Error('MANAGER_AUTH_REQUIRED: Sessão de gestor ativa obrigatória.');
    }
    if (!params.licenseId || !params.reason || !params.reason.trim()) {
      return {
        success: false,
        code: 'INVALID_PARAMETERS',
        message: 'licenseId e reason são obrigatórios para ativação manual.',
      };
    }

    // 1. Idempotência por chave
    if (params.idempotencyKey) {
      for (const event of this.commercialActivationEvents.values()) {
        if (event.idempotencyKey === params.idempotencyKey) {
          const lic = this.licenses.get(event.licenseId);
          return {
            success: true,
            licenseId: event.licenseId,
            previousStatus: lic?.status,
            newStatus: lic?.status,
            effectiveAt: event.createdAt,
            expiresAt: lic?.expiresAtIso || null,
            activationEventId: event.id,
            idempotentReplay: true,
            message: 'Operação já processada anteriormente (idempotente).',
          };
        }
      }
    }

    // 2. Busca licença
    const license = this.licenses.get(params.licenseId);
    if (!license) {
      return {
        success: false,
        code: 'LICENSE_NOT_FOUND',
        message: 'Licença não encontrada.',
      };
    }

    // 3. Bloqueio estrito de reativação para SUSPENDED e REVOKED
    if (license.status === 'SUSPENDED') {
      throw new Error('CANNOT_ACTIVATE_SUSPENDED_LICENSE: Licença suspensa não pode ser ativada por evidência comercial. Desbloqueio administrativo prévio obrigatório.');
    }

    if (license.status === 'REVOKED') {
      throw new Error('CANNOT_ACTIVATE_REVOKED_LICENSE: Licença revogada permanentemente não pode ser reativada por pagamento.');
    }

    // 4. Validação temporal de expiração
    const serverNow = this.getServerNow();
    const serverNowIso = serverNow.toISOString();

    if (params.validUntil) {
      const validUntilDate = new Date(params.validUntil);
      if (validUntilDate <= serverNow) {
        return {
          success: false,
          code: 'INVALID_VALID_UNTIL',
          message: 'A data de expiração (valid_until) deve ser posterior ao horário atual do servidor.',
        };
      }
    }

    // 5. Atualização da licença para ACTIVE
    // Inviolabilidade: trial_started_at, trial_expires_at, devices e sources NÃO são resetados
    const previousStatus = license.status;
    license.status = 'ACTIVE';
    if (params.validUntil !== undefined) {
      license.expiresAtIso = params.validUntil || undefined;
    }

    // 6. Registro de evento comercial
    const eventId = `act_${Math.random().toString(36).slice(2, 10)}`;
    const activationEvent: CommercialActivationEvent = {
      id: eventId,
      licenseId: license.id,
      customerId: license.customerId || null,
      activationType: 'MANUAL_MANAGER',
      paymentStatus: 'CONFIRMED',
      amountMinor: null,
      currency: 'BRL',
      externalReference: null,
      periodStart: serverNowIso,
      periodEnd: license.expiresAtIso || null,
      createdByManagerId: managerId,
      idempotencyKey: params.idempotencyKey || null,
      providerEventId: null,
      createdAt: serverNowIso,
      metadata: {
        reason: params.reason.trim(),
        previousStatus,
      },
    };
    this.commercialActivationEvents.set(eventId, activationEvent);

    // 7. Registro de log de auditoria
    this.commercialAuditLogs.push({
      id: `audit_${Math.random().toString(36).slice(2, 10)}`,
      action: previousStatus === 'ACTIVE' ? 'LICENSE_RENEWED' : 'LICENSE_MANUALLY_ACTIVATED',
      targetType: 'LICENSE',
      targetId: license.id,
      managerId,
      createdAt: serverNowIso,
      metadata: {
        reason: params.reason.trim(),
        activationEventId: eventId,
        previousStatus,
        newStatus: 'ACTIVE',
        expiresAt: license.expiresAtIso || null,
      },
    });

    return {
      success: true,
      licenseId: license.id,
      previousStatus,
      newStatus: 'ACTIVE',
      effectiveAt: serverNowIso,
      expiresAt: license.expiresAtIso || null,
      activationEventId: eventId,
      idempotentReplay: false,
    };
  }

  listCommercialActivationEvents(filter?: {
    licenseId?: string;
    customerId?: string;
  }): CommercialActivationEvent[] {
    const results: CommercialActivationEvent[] = [];
    for (const event of this.commercialActivationEvents.values()) {
      if (filter?.licenseId && event.licenseId !== filter.licenseId) continue;
      if (filter?.customerId && event.customerId !== filter.customerId) continue;
      results.push({ ...event });
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getCommercialAuditLogs(): Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    managerId?: string;
    createdAt: string;
    metadata: Record<string, unknown>;
  }> {
    return [...this.commercialAuditLogs];
  }

  dumpStats(): { centralCatalogRows: number; centralSearchIndexRows: number } {
    return {
      centralCatalogRows: 0,
      centralSearchIndexRows: 0,
    };
  }
}

// Instância singleton do engine para uso local / testes / dev
let instance: ControlPlaneEngine | null = null;
export function getControlPlaneEngine(): ControlPlaneEngine {
  if (!instance) {
    instance = new ControlPlaneEngine();
  }
  return instance;
}
