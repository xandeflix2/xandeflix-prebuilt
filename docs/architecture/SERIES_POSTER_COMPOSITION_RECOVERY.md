# CANON-01-SERIES-POSTER-COMPOSITION - specification before code - 2026-10-21

Explicit user request: do not require a list of titles. Automatically use the
source cover if supplied/usable; otherwise find the series in TMDB. Existing
source-recovery autonomy, test APK and three-device install authorization apply.
Same CANON-01 Gate, no SOURCE-FORMAT-01 and no Git/backend publication.

## Confirmed failure and minimal design

After the classification repair, an automated normal Home-rail audit on SM_X610
found29 loaded series images,25 horizontal. A decoded logo/backdrop is treated
as a successful series poster today, preventing fallback. This is a different
failure from unavailable catalog data; no image is generated or guessed.

Only Artwork's poster role with identity.kind=series must reject an image whose
height is not greater than width. Preserve valid vertical source-first images,
movie/thumbnail/backdrop behavior, shared decode/file caches, queue limits,
visibility cancellation, retry and parental visibility. Do not invalidate a
decoded horizontal image globally: other roles can legitimately use it.

When source decoding fails or its geometry is invalid for a series poster,
remove both posterPath and sourcePosterUri from the fallback identity. An
unusable image cannot constrain title search or visual matching/cache identity.
Preserve kind/year/explicit TMDB ID and all existing conservative title/alias/
homonym matching and cooldowns. Ambiguous/no match remains an honest fallback.
Never send a source URL or credential to TMDB; never mutate catalog/source.

## Closed allowlist

- src/ui/components/Artwork.tsx (role validity and failed-source hint only).
- scripts/test-c11-artwork-visible-recovery.mjs (restore isolated dependency
  ports; add actual image dimensions to fixtures and new real-component cases).
- scripts/test-c11-source-first-tmdb-artwork.mjs (isolated dependency ports only,
  preserving every existing assertion; current fixture cannot resolve added UI
  dependencies and fails before its React checks).
- scripts/test-series-poster-composition.mjs (new bounded aggregate suite).
- scripts/test-canonical-regression.mjs (new receipt identity/suite19 only).
- docs/governance/authorizations/CANON-01-SERIES-POSTER-COMPOSITION.json (new,
  runner supersedes CANON-01-CATALOG-PHYSICAL-FIXES; no old receipt changed).
- This spec, docs/evidence/SERIES_POSTER_COMPOSITION_RECOVERY.md (new), append-only
  PHASED/STATUS/EVOLUTION_REPORT/ERRORS and current physical evidence. Ignored
  isolated fixture/reports/build sandbox and another separately named test APK.

No TMDB matcher/credentials/API configuration, importer, native/player/parental,
vault, Android version/package/signature, old receipts, main or user-data edits.

## Acceptance

Red/green actual Artwork with a decoded1920x1080 source: no false poster shown,
lookup gets series/title/year without failed image constraints, official
vertical fallback shown. Valid vertical source retained. Missing/404 source,
invalid fallback geometry, cancellation, stale callback, queue/cache retry,
no-match and kind/year/homonym negative protections remain. Existing source-
first, visible-recovery and alias suites all pass with proper isolated ports.
Keep128 controls/18 suites and add suite19. Nine official checks,116 prebuilt
checks,206 native tests and APK signature/hash/assets all required again.
Install in place on the same three connected devices, check real Home/Series
images/categories and remaining playback matrix. No false physical PASS.

## Screenshot refinement before production patch

The subsequent screenshot shows the same dance image and13 Hours poster on
unrelated series. Read-only attachment audit confirms identical source URI
hashes for Agente Kim/Deep Revenge/Exagerado/O Caminho, and a second identical
URI for A Produtora/O Destino/Restaurante/Meu Companheiro. Therefore mere decode
success and portrait geometry are insufficient. No real URI is recorded.

Extend allowlist to src/artwork/series-poster-claims.ts (new bounded RAM-only
helper, at most512 source references and three normalized identities per
reference). Mounted/near series artwork claims the normalized source URI and
image-independent title identity; three different identities flag generic/shared
art. Same normalized title/quality variants do not flag it. Subscriptions
update previous cards; cleanup releases subscribers, never granting access.
Keep the flag for that bounded entry to avoid wrong covers reappearing on scroll.
No source URL or title list goes to a server, logs, persistent store or catalog.

Shared art triggers an independent conservative TV lookup without source image
hints. Hide the untrusted source while lookup runs; use the matched official
poster. If TMDB confirms the supplied filename among that work's official
poster variants, preserve the valid source instead (legitimate aliases may
share artwork). No match yields honest unavailable artwork, not another work's
generic poster. No known title/URL blacklist or relaxed TMDB matcher.
