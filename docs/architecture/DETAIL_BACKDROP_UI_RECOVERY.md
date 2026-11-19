# CANON-01-DETAIL-BACKDROP-UI — priority specification before code

## Authorization and order — 2026-10-21

User explicitly prioritizes missing horizontal detail-page backgrounds before
queued demands, asks for a new APK installed on tablet/phone/Fire, then resume
the queue. User also requests the transparent lateral menu in this UI APK.
Cast (five principal actors + More modal), catalog-only actor filmography and
Fire idle flicker investigation stay queued, not part of this correction.

Same CANON-01, active independent C11 clone, source-recovery branch and unchanged
HEAD24295bb782fb66c0de2aa7fca4504d80e27ff311. Preserve all68 accumulated paths and
all16 historical receipts (13 in authorizations plus3 root receipts). Retention
implementation is locally validated (nine official commands/prebuilt contract,
128 controls/22 suites) and frozen, with physical cleanup not yet claimed.
No Git publication, main/backend/native/signing/version or next Gate changes.

## Confirmed mechanism and limits

Detail Artwork uses tmdbBackdropOnly, so a failed/missing primary background
leaves an empty/fallback surface even if a poster exists. Metadata stores only
backdrop_path, discarding horizontal images returned in images.backdrops. Old
positive metadata lives30 days and cannot gain those variants merely by opening
details. Tablet snapshot had369 positives,7 without a primary backdrop and no
alternative lists; that is a cache observation, not the count of all affected
titles. Homonym ambiguity and provider TLS failures remain independent causes.

TMDB documents images.backdrops and language filters for movie/TV images:
https://developer.themoviedb.org/reference/movie-images
https://developer.themoviedb.org/reference/tv-series-images
https://developer.themoviedb.org/docs/image-languages

## Design

1. Keep bounded official horizontal alternatives for the same identity-confirmed
   movie/series. Rank neutral/Portuguese/English images, validate public filenames,
   dimensions and aspect ratio, deduplicate and cap at8. Try another if decoding
   fails. Do not guess a different title, mix movie/TV, relax year/country/network/
   source-poster identity or accept source URLs in metadata API/cache.
2. Separate detail-backdrop lookup/cache purpose refreshes old entries that lack
   alternative-image information without clearing existing metadata, catalog or
   poster caches. Reuse already enriched normal entries and existing bounded
   queue, TTLs, negative handling, cancellation and private-data protections.
3. Detail-specific surface shows an identity-checked poster composition underneath
   while horizontal art is loading/unavailable. Prefer a decoded real horizontal
   image; otherwise blur/crop the same poster already eligible for display.
   Never imply the portrait fallback is an official horizontal image. Retain
   poster generic/reuse and series geometry guards, and hide decorative camera
   placeholders above the composed fallback. No invented artwork.
4. Apply to wide movie/series pages and the shared phone/trailer cover. Parent
   metadata, playback controls, trailer sessions, parental/access and source
   records stay unchanged. Keep the previous decoded surface until replacement
   is ready; do not turn a recoverable image failure into a full-page blackout.
5. Lateral header becomes transparent on TV/Fire/tablet, with existing layout,
   active/focus contrast, touch targets and keyboard/remote handlers preserved.
   Do not add expensive full-screen blur, native window or HDMI changes.

## Closed allowlist

- src/artwork/tmdb-metadata.service.ts
- src/artwork/detail-backdrop.ts (new bounded selector)
- src/ui/hooks/useArtworkMetadata.ts
- src/ui/components/Artwork.tsx
- src/ui/components/DetailBackdrop.tsx (new detail-only surface)
- src/ui/components/SeriesTrailer.tsx
- src/ui/pages/MovieDetailPage.tsx
- src/ui/pages/SeriesDetailPage.tsx
- src/index.css
- scripts/test-detail-backdrop-recovery.mjs (new regression)
- scripts/test-canonical-regression.mjs (suite/authorization registration)
- scripts/test-c11-source-first-tmdb-artwork.mjs and
  scripts/test-c11-artwork-visible-recovery.mjs ONLY if a fixture-loader import
  port is necessary; preserve all pre-existing assertions/negative cases.
- this spec; docs/evidence/DETAIL_BACKDROP_UI_RECOVERY.md; new chained receipt
  docs/governance/authorizations/CANON-01-DETAIL-BACKDROP-UI.json
- append-only PHASED/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS.

Ignored sanitized diagnostics/reports, ordinary build outputs and separate
same1.0.37/code37 APK under the existing certificate are allowed. No changes to
the frozen retention code/receipt, source/catalog data, native Android, player,
parental, package.json, integrations or credentials. Existing three-device
in-place authorization applies; no uninstall or broad data reset.

## Acceptance

Red/green missing-primary/available-alternate case, alternative retry and geometry,
poster composition, warm/old cache purpose and deduplication. Negatives cover
unsafe URLs/paths, unrelated IDs/kinds/years/homonyms/source hints, all candidates
failing, stale results/route change, private cache fields and parental denial.
Existing128 controls/22 suites stay required, add suite23. Old test loaders may
recognize new component only; no always-green substitute for behavior tests.

Run nine official commands/prebuilt plus targeted rendering/identity/retention/
layout regressions; review React effects/accessibility/memory. Build and audit
real APK, preserve old APKs/native artifacts, compare protected identity/source/
parental/active state during install. Observe movie and series backgrounds and
transparent focused navigation in actual installed WebViews/screenshots on all
three devices. Distinguish real horizontal images, composed posters and remaining
network/identity failures. Record any automatic retention executed by the already
validated frozen code in this build; never delete protected generations manually.

GIT_COMMIT=NAO; GIT_PUSH=NAO; VERCEL_DEPLOY=NAO; SUPABASE_WRITE=NAO;
NEXT_GATE_STARTED=NAO; CHAT_MASTER_REVIEW=PENDING.

## Additional TV-only UI request before CSS implementation

User requests smaller sidebar icons on Fire Stick and Android TV only, suggesting
80 percent overall scale as an option. Use approximately80 percent icon size,
with compact TV navigation spacing and44px minimum focus targets. Do not apply
global zoom/transform, which would complicate native overlay/focus coordinates.
Phone and tablet sizes/spacing stay unchanged. Transparent sidebar also covers
landscape tablet as previously requested. No additional file paths are needed.
Physical acceptance compares TV icon size and focus, tablet/phone dimensions,
and confirms the same navigation actions remain reachable by remote/touch.

## CANON-01-DETAIL-BACKDROP-TYPES — compilation follow-up before fix

The aggregate128-controls/23-suites and C11 pass. Typecheck found TS6133 in the
new component: React's namespace was unused by the automatic JSX compiler. Add
explicit React.ReactElement return annotations (no runtime change). Preserve the
already registered DETAIL-BACKDROP-UI receipt; chain a new receipt for this path
and the runner authorization list only. Existing scope/physical authorization
applies; no new phase. Recheck typecheck, canonical protection and required builds.


## Latest installation scope restriction ? 2026-10-21

User explicitly narrows delivery: install ONLY on Fire Stick; provide APK for manual installation on phone/tablet. This supersedes earlier three-device installation permission for this delivery. No new APK is installed on phone/tablet by the agent. Temporary CSS preview already observed earlier is not an APK installation. Fire-only helper enforces the target list; remaining physical tests are limited accordingly. Historical receipts preserved, no broader authorization inferred.
