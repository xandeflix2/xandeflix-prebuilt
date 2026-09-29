/**
 * Xandeflix Prebuilt - Runtime Source Context Provider (T5-R2/R2C).
 *
 * Resolve a fonte ativa no Control Plane e mantém somente um contexto efêmero
 * em memória. A identidade da source vem da ManagedSource; nunca do host.
 */

import type { RuntimeSourceContext } from './source-runtime-context.ts';
import type { SourceProviderKind } from './playback.types.ts';
import { AuthorizedSourceResolver } from '../control-plane/client/authorized-source-resolver.ts';
import type { ResolvedSourceResult } from '../control-plane/client/authorized-source-resolver.ts';
import type { SourceRuntimeConfig } from '../debug/source/source-runtime-config.ts';
import {
  LocalSecureSourceStore,
  LocalSecureSourceStoreError,
  validateLocalSecureSourceRecord,
  type LocalSecureSourceRecord,
} from '../security/local-secure-source-store.ts';
import { PlaybackError } from './playback-errors.ts';

type SourceResolver = { resolve(): Promise<ResolvedSourceResult> };
type LocalSourceStore = Pick<LocalSecureSourceStore, 'get'>;

export interface RuntimeSourceContextProvider {
  resolve(options?: { forceRefresh?: boolean }): Promise<RuntimeSourceContext | undefined>;
  invalidate(): void;
  getLastFailure?(): PlaybackError | undefined;
}

export class AuthorizedRuntimeSourceContextProvider implements RuntimeSourceContextProvider {
  private cachedContext: RuntimeSourceContext | undefined;
  private cachedAuthorityCacheKey: string | undefined;
  private readonly resolver: SourceResolver;
  private readonly localStore: LocalSourceStore;
  private lastFailure: PlaybackError | undefined;

  constructor(
    resolver?: SourceResolver,
    options?: { localStore?: LocalSourceStore },
  ) {
    this.resolver = resolver || AuthorizedSourceResolver;
    this.localStore = options?.localStore || new LocalSecureSourceStore();
  }

  async resolve(options?: { forceRefresh?: boolean }): Promise<RuntimeSourceContext | undefined> {
    const forceRefresh = options?.forceRefresh === true;

    if (this.cachedContext && !forceRefresh) {
      if (this.isContextExpired(this.cachedContext)) {
        this.invalidate();
      } else {
        return this.cachedContext;
      }
    }

    this.lastFailure = undefined;

    let sourceResult: ResolvedSourceResult;
    try {
      sourceResult = await this.resolver.resolve();
    } catch {
      this.invalidate();
      return undefined;
    }

    if (sourceResult.status !== 'SOURCE_READY' || sourceResult.sourceStatus === 'DISABLED') {
      this.invalidate();
      return undefined;
    }

    if (sourceResult.mode === 'SELF_SERVICE') {
      // SELF_SERVICE remoto pode entregar somente metadata; a configuração
      // autorizada já selada no LocalSecureSourceStore é a autoridade local.
      if (!sourceResult.config) {
        if (sourceResult.sourceStatus !== 'ACTIVE') {
          this.invalidate();
          return undefined;
        }
        return this.resolveManagedSource(sourceResult);
      }

      const context = adaptSourceConfigToRuntimeContext(
        sourceResult.config,
        sourceResult.sourceVersion,
        sourceResult.sourceId,
        sourceResult.protocol,
        sourceResult.sourceStatus,
      );
      if (!context) return this.failWith(PlaybackError.sourceActionRequired());
      return this.cacheContext(context);
    }

    if (sourceResult.mode !== 'MANAGED') {
      this.invalidate();
      return undefined;
    }

    // Em MANAGED, a configuração real só pode vir do store local seguro.
    if (sourceResult.sourceStatus !== 'ACTIVE') {
      this.invalidate();
      return undefined;
    }

    return this.resolveManagedSource(sourceResult);
  }

  invalidate(): void {
    this.cachedContext = undefined;
    this.cachedAuthorityCacheKey = undefined;
  }

  getLastFailure(): PlaybackError | undefined {
    return this.lastFailure;
  }

  private async resolveManagedSource(
    sourceResult: ResolvedSourceResult,
  ): Promise<RuntimeSourceContext | undefined> {
    const sourceId = sourceResult.sourceId;
    const sourceVersion = sourceResult.sourceVersion;
    const protocol = sourceResult.protocol;

    if (
      !sourceId ||
      !/^src_[a-z0-9]+$/.test(sourceId) ||
      typeof sourceVersion !== 'number' ||
      !Number.isSafeInteger(sourceVersion) ||
      sourceVersion < 1 ||
      (protocol !== 'M3U' && protocol !== 'XTREAM')
    ) {
      return this.failWith(PlaybackError.localSourceConfigUnavailable());
    }

    let localRecord: LocalSecureSourceRecord | undefined;
    try {
      localRecord = await this.localStore.get(sourceId);
    } catch (error: unknown) {
      if (
        error instanceof LocalSecureSourceStoreError &&
        error.code === 'LOCAL_SOURCE_CONFIG_NOT_FOUND'
      ) {
        return this.failWith(PlaybackError.sourceActionRequired());
      }
      return this.failWith(PlaybackError.localSourceConfigUnavailable());
    }

    if (!localRecord) {
      return this.failWith(PlaybackError.sourceActionRequired());
    }

    try {
      validateLocalSecureSourceRecord(localRecord);
    } catch {
      return this.failWith(PlaybackError.localSourceConfigUnavailable());
    }

    if (localRecord.sourceId !== sourceId) {
      return this.failWith(PlaybackError.localSourceConfigUnavailable());
    }

    if (localRecord.sourceVersion !== sourceVersion) {
      return this.failWith(PlaybackError.localSourceConfigVersionMismatch());
    }

    if (localRecord.protocol !== protocol) {
      return this.failWith(PlaybackError.localSourceConfigProtocolMismatch());
    }

    const context = adaptLocalSecureSourceRecordToRuntimeContext(localRecord, sourceResult);
    if (!context) {
      return this.failWith(PlaybackError.localSourceConfigUnavailable());
    }

    return this.cacheContext(context);
  }

  private cacheContext(context: RuntimeSourceContext): RuntimeSourceContext {
    const authorityCacheKey = buildSourceAuthorityCacheKey(
      context.sourceId,
      context.sourceVersion,
    );

    if (
      this.cachedAuthorityCacheKey !== undefined &&
      authorityCacheKey !== this.cachedAuthorityCacheKey
    ) {
      this.invalidate();
    }

    this.cachedContext = context;
    this.cachedAuthorityCacheKey = authorityCacheKey;
    return context;
  }

  private failWith(error: PlaybackError): undefined {
    this.lastFailure = error;
    this.invalidate();
    return undefined;
  }

  private isContextExpired(context: RuntimeSourceContext): boolean {
    return typeof context.expiresAt === 'number' &&
      context.expiresAt > 0 &&
      Date.now() > context.expiresAt;
  }
}

export function adaptSourceConfigToRuntimeContext(
  config: SourceRuntimeConfig,
  sourceVersion?: number,
  sourceId?: string,
  protocol?: 'M3U' | 'XTREAM',
  sourceStatus?: 'ACTIVE' | 'DISABLED'
): RuntimeSourceContext | undefined {
  if (!config) return undefined;

  const resolvedType = resolveSourceType(config);
  const canonicalSourceId = sourceId || 'runtime-source-unidentified';

  if (resolvedType === 'XTREAM') {
    return adaptXtreamConfig(config, sourceVersion, canonicalSourceId, protocol, sourceStatus);
  }
  if (resolvedType === 'M3U') {
    return adaptM3uConfig(config, sourceVersion, canonicalSourceId, protocol, sourceStatus);
  }
  return undefined;
}

/**
 * Materializa o contexto apenas depois que o Control Plane e o store local
 * concordam sobre identidade, geração e protocolo.
 */
export function adaptLocalSecureSourceRecordToRuntimeContext(
  record: LocalSecureSourceRecord,
  metadata: Pick<ResolvedSourceResult, 'sourceId' | 'sourceVersion' | 'protocol' | 'sourceStatus'>,
): RuntimeSourceContext | undefined {
  const localConfig: SourceRuntimeConfig = {
    type: record.protocol,
    host: record.protocol === 'XTREAM' ? record.sourceConfig.endpoint : undefined,
    playlistUrl: record.protocol === 'M3U' ? record.sourceConfig.playlistUrl : undefined,
    username: record.sourceConfig.username,
    password: record.sourceConfig.password,
  };

  const context = adaptSourceConfigToRuntimeContext(
    localConfig,
    metadata.sourceVersion,
    metadata.sourceId,
    metadata.protocol,
    metadata.sourceStatus,
  );
  if (!context) return undefined;

  const token = record.sourceConfig.token?.trim();
  if (!token) return context;

  return {
    ...context,
    headers: {
      ...context.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

function resolveSourceType(config: SourceRuntimeConfig): 'XTREAM' | 'M3U' | 'UNKNOWN' {
  if (config.type === 'XTREAM') return 'XTREAM';
  if (config.type === 'M3U') return 'M3U';
  if (config.host && config.username && config.password) return 'XTREAM';
  if (config.playlistUrl) return 'M3U';
  return 'UNKNOWN';
}

function adaptXtreamConfig(
  config: SourceRuntimeConfig,
  sourceVersion: number | undefined,
  sourceId: string,
  protocol: 'M3U' | 'XTREAM' | undefined,
  sourceStatus: 'ACTIVE' | 'DISABLED' | undefined
): RuntimeSourceContext | undefined {
  if (!config.host || !config.username || !config.password) return undefined;

  const host = config.host.trim().replace(/\/+$/, '');
  const baseUrl = host.startsWith('http://') || host.startsWith('https://')
    ? host
    : `http://${host}`;

  return {
    sourceId,
    sourceVersion,
    sourceStatus,
    protocol: protocol || 'XTREAM',
    providerKind: 'XTREAM' as SourceProviderKind,
    baseUrl,
    sessionMaterial: {
      username: config.username.trim(),
      password: config.password.trim(),
    },
    headers: { 'User-Agent': 'IPTVSmarters/1.0' },
    expiresAt: computeContextExpiry(),
  };
}

function adaptM3uConfig(
  config: SourceRuntimeConfig,
  sourceVersion: number | undefined,
  sourceId: string,
  protocol: 'M3U' | 'XTREAM' | undefined,
  sourceStatus: 'ACTIVE' | 'DISABLED' | undefined
): RuntimeSourceContext | undefined {
  if (!config.playlistUrl) return undefined;

  let baseUrl: string;
  try {
    const parsed = new URL(config.playlistUrl.trim());
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }

  return {
    sourceId,
    sourceVersion,
    sourceStatus,
    protocol: protocol || 'M3U',
    providerKind: 'M3U' as SourceProviderKind,
    baseUrl,
    headers: { 'User-Agent': 'IPTVSmarters/1.0' },
    expiresAt: computeContextExpiry(),
  };
}

function computeContextExpiry(): number {
  return Date.now() + 4 * 60 * 60 * 1000;
}

/** Cache semântico da autoridade: identidade da entidade + versão monotônica. */
export function buildSourceAuthorityCacheKey(sourceId: string, sourceVersion?: number): string {
  return `${sourceId}|${sourceVersion === undefined ? 'unknown' : sourceVersion}`;
}
