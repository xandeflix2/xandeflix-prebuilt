export const M3U_EXTINF_STRUCTURAL_PARSE_LOCK_ID = 'M3U_EXTINF_STRUCTURAL_PARSE_LOCK_V1';

export const M3U_EXTINF_STRUCTURAL_PARSE_LOCK_INVARIANTS = [
  'first-unquoted-comma-is-the-display-title-boundary',
  'quoted-attributes-may-contain-commas',
  'attribute-order-is-irrelevant',
  'escaped-quotes-are-decoded-within-quoted-values',
  'display-title-never-includes-raw-attributes',
  'bom-crlf-lf-and-utf8-are-supported',
  'malformed-extinf-fails-closed',
  'large-lines-are-bounded-by-the-stream-reader',
] as const;

export const M3U_EXTINF_STRUCTURAL_PARSE_LOCK_MATERIAL =
  `${M3U_EXTINF_STRUCTURAL_PARSE_LOCK_ID}\n${M3U_EXTINF_STRUCTURAL_PARSE_LOCK_INVARIANTS.join('\n')}`;

export const M3U_EXTINF_STRUCTURAL_PARSE_LOCK_HASH =
  '81EE45EB9ECCB3C00853C235613414CBD8F6398340A801825EDD5BF4DA7E9EF0';
