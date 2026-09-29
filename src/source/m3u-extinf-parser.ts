/**
 * Parser estrutural de uma linha M3U #EXTINF.
 *
 * A vírgula que separa os atributos do display title é a primeira vírgula
 * fora de uma string quoted. Nunca usar split(',') para este contrato.
 */

export interface ParsedM3uExtInf {
  duration: number;
  attributes: Readonly<Record<string, string>>;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  displayTitle: string;
}

export interface ParsedM3uEpisodeIdentity {
  rootTitle: string;
  seasonNumber: number;
  episodeNumber: number;
}

const RAW_M3U_ATTRIBUTE_PATTERN = /\b(?:tvg-logo|group-title|tvg-name)\s*=/i;
const SXXEXX_PATTERN = /\b[sS](\d{1,2})\s*[eE](\d{1,3})\b/;
const TXXEXX_PATTERN = /\b[tT](\d{1,2})\s*(?:[eE][pP]?|[cC][aA][pP]?)(\d{1,3})\b/;
const X_PATTERN = /\b(\d{1,2})\s*[xX]\s*(\d{1,3})\b/;
const SEASON_PATTERN = /(?:temporada|season)\s*(\d+)/i;
const EPISODE_PATTERN = /(?:epis[oó]dio|episode|cap[ií]tulo|ep\.?)\s*(\d+)/i;

function findStructuralComma(value: string): number {
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quoted) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        quoted = false;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      return index;
    }
  }

  return quoted ? -1 : -1;
}

function readQuotedValue(input: string, start: number): { value: string; next: number } | undefined {
  if (input[start] !== '"') return undefined;

  let value = '';
  let escaped = false;
  for (let index = start + 1; index < input.length; index += 1) {
    const char = input[index];
    if (escaped) {
      value += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      return { value, next: index + 1 };
    } else {
      value += char;
    }
  }

  return undefined;
}

function parseAttributes(header: string): { duration: number; attributes: Record<string, string> } | undefined {
  const durationMatch = header.match(/^\s*(-?\d+(?:\.\d+)?)(?:\s+|$)/);
  if (!durationMatch) return undefined;

  const duration = Number(durationMatch[1]);
  if (!Number.isFinite(duration)) return undefined;

  const attributes: Record<string, string> = {};
  let index = durationMatch[0].length;

  while (index < header.length) {
    while (/\s/.test(header[index] || '')) index += 1;
    if (index >= header.length) break;

    const nameStart = index;
    while (/[A-Za-z0-9_-]/.test(header[index] || '')) index += 1;
    if (index === nameStart) return undefined;

    const name = header.slice(nameStart, index).toLowerCase();
    while (/\s/.test(header[index] || '')) index += 1;
    if (header[index] !== '=') return undefined;
    index += 1;
    while (/\s/.test(header[index] || '')) index += 1;

    let value = '';
    if (header[index] === '"') {
      const parsed = readQuotedValue(header, index);
      if (!parsed) return undefined;
      value = parsed.value;
      index = parsed.next;
    } else {
      const valueStart = index;
      while (index < header.length && !/\s/.test(header[index])) index += 1;
      if (index === valueStart) return undefined;
      value = header.slice(valueStart, index);
    }

    attributes[name] = value;
  }

  return { duration, attributes };
}

/** Retorna undefined quando a entrada é estruturalmente inválida. */
export function parseM3uExtInfLine(line: string): ParsedM3uExtInf | undefined {
  const normalized = line.replace(/^\uFEFF/, '').trim();
  if (!normalized.toUpperCase().startsWith('#EXTINF:')) return undefined;

  const payload = normalized.slice(normalized.indexOf(':') + 1);
  const commaIndex = findStructuralComma(payload);
  if (commaIndex < 0) return undefined;

  const parsedAttributes = parseAttributes(payload.slice(0, commaIndex));
  const displayTitle = payload.slice(commaIndex + 1).trim();
  if (!parsedAttributes || !displayTitle) return undefined;

  const { attributes, duration } = parsedAttributes;
  return {
    duration,
    attributes,
    tvgId: attributes['tvg-id'],
    tvgName: attributes['tvg-name'],
    tvgLogo: attributes['tvg-logo'],
    groupTitle: attributes['group-title'],
    displayTitle,
  };
}

export function containsRawM3uAttributes(title: string): boolean {
  return RAW_M3U_ATTRIBUTE_PATTERN.test(title);
}

export function parseM3uEpisodeIdentity(title: string): ParsedM3uEpisodeIdentity | undefined {
  const cleanTitle = title.trim();
  if (!cleanTitle || containsRawM3uAttributes(cleanTitle)) return undefined;

  const sxx = cleanTitle.match(SXXEXX_PATTERN);
  const txx = cleanTitle.match(TXXEXX_PATTERN);
  const x = cleanTitle.match(X_PATTERN);
  const season = cleanTitle.match(SEASON_PATTERN);
  const episode = cleanTitle.match(EPISODE_PATTERN);
  const match = sxx || txx || x;

  if (match) {
    return {
      rootTitle: cleanTitle.slice(0, match.index).trim().replace(/[-–|:\s]+$/, ''),
      seasonNumber: Number(match[1]) || 1,
      episodeNumber: Number(match[2]) || 1,
    };
  }

  if (season) {
    const rootTitle = cleanTitle.slice(0, season.index).trim().replace(/[-–|:\s]+$/, '');
    return {
      rootTitle,
      seasonNumber: Number(season[1]) || 1,
      episodeNumber: Number(episode?.[1]) || 1,
    };
  }

  if (episode) {
    return {
      rootTitle: cleanTitle.slice(0, episode.index).trim().replace(/[-–|:\s]+$/, ''),
      seasonNumber: 1,
      episodeNumber: Number(episode[1]) || 1,
    };
  }

  return undefined;
}

