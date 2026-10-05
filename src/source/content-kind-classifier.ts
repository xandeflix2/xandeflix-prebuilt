/**
 * Classificador canônico de itens de source.
 *
 * O resultado UNRESOLVED é interno ao pipeline e nunca deve ser persistido
 * como movie, series ou live.
 */

import { containsRawM3uAttributes, parseM3uEpisodeIdentity } from './m3u-extinf-parser.ts';

export type CanonicalSourceContentKind = 'live' | 'movie' | 'series' | 'unresolved';

export interface CanonicalSourceContentInput {
  title?: string;
  groupName?: string;
  streamUrl?: string;
}

/**
 * A ordem é deliberadamente determinística:
 * live explícito > movie explícito > série estrutural > extensões médias
 * > unresolved.
 *
 * Nome de grupo, categoria ou título sem estrutura não decide o tipo.
 */
export function classifyCanonicalSourceContent({
  title = '',
  groupName = '',
  streamUrl = '',
}: CanonicalSourceContentInput): CanonicalSourceContentKind {
  const cleanTitle = title.trim();
  const normalizedUrl = streamUrl.trim().toLowerCase();
  const urlPath = normalizedUrl.split(/[?#]/, 1)[0];
  const normGroup = (groupName || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const groupFamily = normGroup.split('|', 1)[0].trim();

  if (!cleanTitle || containsRawM3uAttributes(cleanTitle)) return 'unresolved';

  // 1. Evidência estrutural forte de Movie: path /movie/ ou extensão típica VOD
  const hasStrongMoviePath = urlPath.includes('/movie/');
  const hasMovieExtension = urlPath.endsWith('.mp4') || urlPath.endsWith('.mkv');

  // 2. Evidência estrutural forte de Series: path /series/ ou SxxExx no título
  let _hasEpisodeIdentity: boolean | undefined;
  const getHasEpisodeIdentity = () => {
    if (_hasEpisodeIdentity === undefined) {
      _hasEpisodeIdentity = Boolean(parseM3uEpisodeIdentity(cleanTitle));
    }
    return _hasEpisodeIdentity;
  };
  const hasSeriesPath = urlPath.includes('/series/');

  // 3. Evidência de Live / Canal
  const hasLivePath = urlPath.includes('/live/') || urlPath.endsWith('.m3u8');
  const isChannelGroup =
    groupFamily === 'CANAIS' ||
    groupFamily === 'CANAL' ||
    groupFamily.startsWith('CANAIS') ||
    groupFamily.startsWith('CANAL') ||
    groupFamily === 'TV' ||
    groupFamily === 'AO VIVO' ||
    groupFamily === 'AOVIVO' ||
    groupFamily === 'CHANNELS' ||
    groupFamily === 'LIVE';

  const isRadioGroup =
    groupFamily === 'RADIO' ||
    groupFamily === 'RADIOS' ||
    groupFamily.startsWith('RADIO') ||
    normGroup.includes('RADIO');

  // Precedência determinística:
  // A. Radios NUNCA podem ser movies. Classificar como live.
  if (isRadioGroup) {
    return 'live';
  }

  // B. Grupo explicitamente de CANAIS:
  // Não pode ser classificado como movie na ausência de forte evidência de movie (/movie/)
  if (isChannelGroup) {
    if (hasStrongMoviePath) {
      return 'movie';
    }
    if (hasSeriesPath || (!hasLivePath && getHasEpisodeIdentity())) {
      return 'series';
    }
    // Na ausência de movie/series estrutural, é LIVE
    return 'live';
  }

  // C. Path /live/ ou .m3u8 (e não é série/movie com evidência forte contrária)
  if (hasLivePath && !hasStrongMoviePath && !hasSeriesPath) {
    return 'live';
  }

  // D. Series com identidade episódica ou path /series/
  if (hasStrongMoviePath) {
    return 'movie';
  }

  if (hasSeriesPath || getHasEpisodeIdentity()) {
    return 'series';
  }

  if (hasMovieExtension) {
    return 'movie';
  }

  // F. Grupos explícitos
  // Um nome de grupo isolado não é evidência suficiente para materializar
  // um item. A origem pode ter grupos incorretos ou mistos; exigimos path,
  // extensão ou identidade episódica estrutural antes de atribuir o tipo.
  return 'unresolved';
}

