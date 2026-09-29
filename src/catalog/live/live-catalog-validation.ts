import type { LiveChannel, LiveGroup } from './live-tv.types.ts';

export interface LiveCatalogValidationResult {
  valid: boolean;
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateGroup(value: unknown, index: number, errors: string[]): value is LiveGroup {
  if (!isRecord(value)) {
    errors.push(`[LIVE_GROUP_INVALID] groups[${index}] deve ser um objeto`);
    return false;
  }
  if (typeof value.id !== 'string' || value.id.trim() === '') {
    errors.push(`[LIVE_GROUP_ID_INVALID] groups[${index}].id deve ser texto não vazio`);
  }
  if (typeof value.name !== 'string' || value.name.trim() === '') {
    errors.push(`[LIVE_GROUP_NAME_INVALID] groups[${index}].name deve ser texto não vazio`);
  }
  if (value.order !== undefined && typeof value.order !== 'number') {
    errors.push(`[LIVE_GROUP_ORDER_INVALID] groups[${index}].order deve ser numérico quando presente`);
  }
  return true;
}

function validateChannel(value: unknown, index: number, errors: string[]): value is LiveChannel {
  if (!isRecord(value)) {
    errors.push(`[LIVE_CHANNEL_INVALID] channels[${index}] deve ser um objeto`);
    return false;
  }

  for (const field of ['id', 'name', 'groupId', 'streamId'] as const) {
    if (typeof value[field] !== 'string' || value[field].trim() === '') {
      errors.push(`[LIVE_CHANNEL_${field.toUpperCase()}_INVALID] channels[${index}].${field} deve ser texto não vazio`);
    }
  }

  if (value.groupName !== undefined && typeof value.groupName !== 'string') {
    errors.push(`[LIVE_CHANNEL_GROUP_NAME_INVALID] channels[${index}].groupName deve ser texto quando presente`);
  }
  if (value.logoUrl !== undefined && typeof value.logoUrl !== 'string') {
    errors.push(`[LIVE_CHANNEL_LOGO_INVALID] channels[${index}].logoUrl deve ser texto quando presente`);
  }
  if (!isRecord(value.streamRef)) {
    errors.push(`[LIVE_CHANNEL_STREAM_REF_INVALID] channels[${index}].streamRef deve ser um objeto`);
  } else if (typeof value.streamRef.sourceItemId !== 'string' || value.streamRef.sourceItemId.trim() === '') {
    errors.push(`[LIVE_CHANNEL_SOURCE_ITEM_INVALID] channels[${index}].streamRef.sourceItemId deve ser texto não vazio`);
  }
  return true;
}

export function validateLiveCatalog(
  value: unknown,
  options?: { expectedSnapshotId?: string },
): LiveCatalogValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ['[LIVE_CATALOG_INVALID] LiveCatalog deve ser um objeto'] };
  }

  if (typeof value.snapshotId !== 'string' || value.snapshotId.trim() === '') {
    errors.push('[LIVE_SNAPSHOT_ID_INVALID] snapshotId deve ser texto não vazio');
  } else if (options?.expectedSnapshotId && value.snapshotId !== options.expectedSnapshotId) {
    errors.push(
      `[LIVE_SNAPSHOT_MISMATCH] snapshotId divergente. Esperado: '${options.expectedSnapshotId}', recebido: '${value.snapshotId}'`,
    );
  }
  if (typeof value.generatedAt !== 'string' || value.generatedAt.trim() === '') {
    errors.push('[LIVE_GENERATED_AT_INVALID] generatedAt deve ser texto não vazio');
  }
  if (!Array.isArray(value.groups)) {
    errors.push('[LIVE_GROUPS_INVALID] groups deve ser uma lista');
  }
  if (!Array.isArray(value.channels)) {
    errors.push('[LIVE_CHANNELS_INVALID] channels deve ser uma lista');
  }
  if (!isRecord(value.channelsByGroup)) {
    errors.push('[LIVE_CHANNELS_BY_GROUP_INVALID] channelsByGroup deve ser um objeto');
  }
  if (value.totalChannels !== undefined &&
      (typeof value.totalChannels !== 'number' || value.totalChannels < 0 || !Number.isInteger(value.totalChannels))) {
    errors.push('[LIVE_TOTAL_CHANNELS_INVALID] totalChannels deve ser inteiro não negativo quando presente');
  }
  if (value.segmentFiles !== undefined &&
      (!Array.isArray(value.segmentFiles) || value.segmentFiles.some((f) => typeof f !== 'string'))) {
    errors.push('[LIVE_SEGMENT_FILES_INVALID] segmentFiles deve conter apenas nomes de segmento');
  }

  const groups = Array.isArray(value.groups) ? value.groups : [];
  const channels = Array.isArray(value.channels) ? value.channels : [];
  const groupIds = new Set<string>();
  const channelIds = new Set<string>();

  groups.forEach((group, index) => {
    if (!validateGroup(group, index, errors)) return;
    if (groupIds.has(group.id)) {
      errors.push(`[LIVE_GROUP_DUPLICATE] group id duplicado: '${group.id}'`);
    }
    groupIds.add(group.id);
  });

  channels.forEach((channel, index) => {
    if (!validateChannel(channel, index, errors)) return;
    if (channelIds.has(channel.id)) {
      errors.push(`[LIVE_CHANNEL_DUPLICATE] channel id duplicado: '${channel.id}'`);
    }
    channelIds.add(channel.id);
    if (!groupIds.has(channel.groupId)) {
      errors.push(`[LIVE_CHANNEL_GROUP_REF_INVALID] channels[${index}].groupId não referencia um grupo existente`);
    }
  });

  if (isRecord(value.channelsByGroup)) {
    for (const [groupId, groupedChannels] of Object.entries(value.channelsByGroup)) {
      if (!Array.isArray(groupedChannels)) {
        errors.push(`[LIVE_CHANNELS_BY_GROUP_ENTRY_INVALID] channelsByGroup['${groupId}'] deve ser uma lista`);
        continue;
      }
      for (const channel of groupedChannels) {
        if (!isRecord(channel) || typeof channel.id !== 'string') {
          errors.push(`[LIVE_CHANNELS_BY_GROUP_CHANNEL_INVALID] channelsByGroup['${groupId}'] contém canal inválido`);
          continue;
        }
        if (!channelIds.has(channel.id)) {
          errors.push(`[LIVE_CHANNELS_BY_GROUP_UNKNOWN_CHANNEL] channelsByGroup['${groupId}'] referencia canal ausente`);
        }
        if (channel.groupId !== groupId) {
          errors.push(`[LIVE_CHANNELS_BY_GROUP_SCOPE_INVALID] canal fora do grupo declarado em channelsByGroup`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
