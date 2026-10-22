# CANON-01-TMDB-CONTEXT-IDENTITY — specification before code — 2026-10-21

Explicit user correction: existing TMDB works Tres Irmas in Novelas Turcas,
Med Cezir Vidas Alheias and Lovesick are not filled adequately. Existing local
autonomous correction and three-device update/test authorization apply. Same
CANON-01; no Git/backend publication, historical receipt edits or next Gate.

## Confirmed evidence before implementation

Read-only authenticated public TMDB requests and the supplied M3U establish:

- Tres Irmas: Turkish category,282 episode records/3 provider seasons. TMDB
  returns Brazilian, Turkish, Korean and Spanish works; Turkish TV158339 is
  identifiable by origin_country=TR. The current title-only selector cannot
  distinguish the two exact Portuguese titles and drops the category context.
- Med Cezir Vidas Alheias:146 records/3 provider seasons; TMDB TV61867 is named
  Medcezir: Vidas Alheias. Token boundaries alone lower its current title score.
- Lovesick:7 episode records under Netflix; this is an episodic source entry,
  separate from films named Lovesick and from16 LoveSick [L] records under
  Legendadas. TV62668 is released, with Netflix among its networks. TV321122
  is another exact title on Netflix but Planned, with no first_air_date. Those
  two currently tie. Do not attach the film or the Netflix work to the separate
  unqualified/subtitled LoveSick entry without supporting evidence.

Provider episodes/seasons are regionally re-edited: Medcezir and Tres Irmas
counts differ from official TMDB counts. Never equate counts or use them to
guess identity. Only the fact that the catalog declares episodic material can
exclude a confirmed Planned/undated/not-yet-aired candidate under a matching
explicit network context. Missing availability facts retain ambiguity.

## Minimal design and protections

1. Pass bounded presentation-only context from existing category labels and
   local declared seasons. Clear country adjectives (Turkish/Brazilian/Korean/
   Japanese/Chinese/Thai) yield one country only; conflicting hints yield none.
   Only an unambiguous Netflix category supplies the Netflix network hint.
   Generic Drama, Doramas, Legendadas, year and genre labels supply no country.
2. Use origin_country and verified details.networks to narrow strong TV title/
   year matches. Bounded maximum6 strong detail candidates; no broad catalog
   search. Reconfirm identity, country/network and ID on details. Exact official
   ID stays authoritative. Unknown or multiple remaining works stay unavailable.
3. Full normalized-title equality may ignore whitespace boundaries for names
   with at least8 letters/digits, preserving every character and number. This
   repairs Med Cezir/Medcezir; partial/title-token guessing remains prohibited.
4. A uniquely context-confirmed work does not inherit an unrelated provider
   poster constraint. Retain source-first rendering, source-reuse/geometry
   protection, cache/queue/network bounds and all no-context filename/homonym
   protections. Context cannot grant content/parental/license access.
5. Match7 cache keys include country/network/episodic context and cannot reuse
   unqualified positive/negative mappings. Unqualified old positive mappings
   remain usable offline; old misses must not pin the repaired lookup. Explicit
   ID cache key unchanged. Same optional public cache, no catalog mutation.
6. Propagate identical primitive context through cards, genres, heroes, detail,
   phone series presentation and watch-provider lookup. No extra network per
   render; existing visibility, cancellation, deduplication and two-job queue.

## Closed allowlist

- src/artwork/tmdb-metadata.service.ts
- src/artwork/hero-artwork.service.ts
- src/catalog/catalog-view-model.ts (optional presentation hasEpisodes only)
- src/catalog/catalog-selectors.ts (derive that flag without network/mutation)
- src/ui/components/MediaCard.tsx
- src/ui/components/Hero.tsx
- src/ui/components/PhoneSeriesDetail.tsx
- src/ui/pages/SeriesDetailPage.tsx
- src/ui/hooks/useArtworkMetadata.ts
- src/ui/hooks/useCardGenres.ts
- src/ui/hooks/useWatchProviders.ts
- scripts/test-tmdb-context-identity.mjs (new)
- scripts/test-c11-tmdb-alias-recovery.mjs (old cache-version fixture only;
  preserve all existing assertions, add explicit Match6 migration checks)
- scripts/test-c11-source-first-tmdb-artwork.mjs and
  scripts/test-c11-artwork-visible-recovery.mjs (actual new context export port,
  all existing assertions preserved)
- scripts/test-canonical-regression.mjs (new amendment identity and suite20)
- New docs/governance/authorizations/CANON-01-TMDB-CONTEXT-IDENTITY.json,
  this specification, docs/evidence/TMDB_CONTEXT_IDENTITY_RECOVERY.md; append-only
  PHASED/STATUS/EVOLUTION_REPORT/ERRORS. Ignored evidence/build sandbox and a
  new separately named same-version/signature APK, authorized in-place tests.

No importer, contracts/catalog.ts, playlist/stream/source/vault, image transport,
native/Android source/version, parental, license, C9, backend, old receipt,
workflow, package.json, main or Git-publication changes.

## Acceptance before delivery

Red/green tests for generic compact-title recovery, country disambiguation,
network plus episodic Planned exclusion, subtitle/context cache separation,
context propagation and legacy cache. Negatives: wrong/unknown/conflicting
country, wrong/missing network, still-ambiguous released homonyms, missing
availability facts, no context, movie/TV isolation, wrong year/ID, unrelated
poster, weak title, private title/URL boundary, query bounds/cooldowns, no
catalog mutation and no broad alias scan. Existing128 controls/19 suites and
all source-first/alias/visible recovery assertions stay required; add suite20.

Run nine official checks, prebuilt contract and dedicated suite, native tests,
APK package/signature/assets/hash audit, then actual three-device verification.
Report ambiguous remaining titles honestly. No physical or CI PASS inferred
from synthetic fixtures; preserve all old APKs/140 artifacts/159 native files
and installation-private state. No new physical playback claim from posters.

Network-shelf qualification: availability on Netflix is broader than production
by Netflix. Network membership is a disambiguator only when several strong
title matches exist; it must not veto a unique already released work licensed
to that shelf. Confirmed Planned/undated/not-aired exclusion still requires
episodic source evidence and the explicit network shelf. Country hints remain
strict. Tests must cover the unique licensed-work case as well as ambiguous
missing/wrong network data.
