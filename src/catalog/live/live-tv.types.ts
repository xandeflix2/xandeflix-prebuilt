/**
 * Xandeflix Prebuilt — Live TV Model Types (Gate R7C)
 *
 * Modelo de dados local soberano para suporte a canais ao vivo (Live TV).
 *
 * Princípios:
 * - LOCAL_ONLY=SIM: Canais, grupos e referências residem exclusivamente no sandbox local do app.
 * - NO_CENTRAL_IPTV_CATALOG: O backend nunca armazena, busca ou indexa canais ao vivo.
 * - NO_STREAM_PROXY: O player conecta diretamente do dispositivo à fonte IPTV.
 * - DATA_MINIMIZATION: Metadados concisos sem acúmulo desnecessário.
 */

export interface LiveGroup {
  id: string;
  name: string;
  order?: number;
}

export interface LiveStreamRef {
  sourceItemId: string;          // stream_id no Xtream ou id no M3U
  containerExtension?: string;   // 'm3u8' ou 'ts'
  directStreamUrl?: string;      // URL efêmera resolvida localmente no device
}

export interface LiveChannel {
  id: string;
  name: string;
  groupId: string;
  groupName?: string;
  logoUrl?: string;
  tvgId?: string;
  tvgName?: string;
  streamId: string;
  streamRef: LiveStreamRef;
  num?: number;
  epgChannelId?: string;
  metadata?: Record<string, unknown>;
}

export interface LiveCatalog {
  snapshotId: string;
  generatedAt: string;
  groups: LiveGroup[];
  channels: LiveChannel[];
  channelsByGroup: Record<string, LiveChannel[]>;
  /** Total canônico do manifest; channels contém apenas o first-fold no boot. */
  totalChannels?: number;
  /** Segmentos Live disponíveis para leitura lazy e bounded. */
  segmentFiles?: string[];
}

export interface LiveTvMetrics {
  rawLiveCount: number;
  canonicalGroupCount: number;
  canonicalChannelCount: number;
  liveFetchMs: number;
  liveParseMs: number;
  liveCatalogBytes: number;
}
