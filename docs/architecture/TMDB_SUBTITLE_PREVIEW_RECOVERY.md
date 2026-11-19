# CANON-01-TMDB-SUBTITLE-PREVIEW — specification before code — 2026-10-21

The user reports a recurring subtitle-poster regression, supplies the Lovesick /
LoveSick [L] comparison, and requests continued tests on tablet/Fire Stick only.
Existing explicit autonomous local recovery and same-version in-place test
authorization applies. This is a corrective CANON-01 amendment, not a new phase.
Preserve all earlier receipts, main, source/catalog records, parental controls,
credentials, Android source/version/signature and every earlier APK.

## Confirmed causes and evidence

1. The real tablet/Fire Home cards omit hasEpisodes although their full series
   details declare episodes. CategoryPreviewIndex.safeItem discards the flag
   both while scanning and while reading its version2 optional cache. The card
   consequently uses a different metadata identity from the detail page. This
   was reproduced on both devices, including decoded official art in native
   cache with no artwork metadata in the card hook.
2. [L] is already stripped by the canonical normalizer; it is not an unknown
   media type. Generic subtitled categories do not supply a Netflix network.
   The unqualified lookup therefore retains the exact-title Planned homonym
   alongside released Lovesick and caches a miss. Current exclusion requires
   both a network hint and declared episodes. Existing streamed episode
   evidence itself is sufficient to exclude a *confirmed* Planned, undated,
   not-yet-aired entry, independently of its network. Unknown availability or
   multiple released homonyms must remain ambiguous.
3. The supplied playlist uses [L]; no terminal (L) examples were found there.
   The reported (L) spelling should follow the same narrow suffix rule, since
   the existing Artwork component already handles that spelling on some paths.
   This must not strip a genuine bare L, an internal parenthesis, or other text.

Sanitized device/source/API evidence: ignored tmdb-context-20261021/resumed-*
and subtitle-marker-inventory.json. Provider directory independently lists the
2014 normal/subtitled variants; no source URL/credential is emitted. Provider
season/episode counts are not an identity comparison or a reason to copy art.

## Closed implementation allowlist

- src/catalog/category-preview-index.ts: preserve an explicit boolean series
  presentation flag; version3 cache; reject/rebuild old series previews and
  malformed/missing flags from active local segments. Preserve valid movie
  version2 cache compatibility, bounds, cancellation, privacy and generation.
- src/artwork/tmdb-metadata.service.ts: narrow terminal [L]/(L) normalization;
  preserve hasEpisodes independently of network, carry it in the identity key,
  and apply the confirmed Planned exclusion to bounded strong TV candidates.
  Source-image hints remain in unqualified episodic identity keys and checks.
- scripts/test-tmdb-context-identity.mjs: revise only the formerly network-only
  eligibility assertion; keep absence-of-episode, missing-availability,
  wrong-network, real-homonym and all other guards; add the positive generic
  episodic case. The old network-only requirement is superseded explicitly.
- scripts/test-tmdb-subtitle-preview-recovery.mjs: new regression suite.
- scripts/test-canonical-regression.mjs: new amendment and mandatory suite21.
- This specification; docs/evidence/TMDB_SUBTITLE_PREVIEW_RECOVERY.md; new
  docs/governance/authorizations/CANON-01-TMDB-SUBTITLE-PREVIEW.json.
- Append-only STATUS, EVOLUTION_REPORT, ERRORS_AND_BLOCKERS and PHASED.
- Ignored evidence, isolated build sandbox and a separately named same-version
  APK; authorized tablet/Fire in-place tests. Stop phone tests per user steering.

No importer/source fetch, catalog type/data, search index, player/native, license,
parental, API credential/configuration, historical receipt or Git publication
change. Never infer a work solely from [L], episode counts or another card.

## Acceptance

Positives: both suffix spellings before optional year; declared aired episodes
exclude a confirmed Planned/undated/no-last-episode exact homonym without a
network; cold and warm real CategoryPreviewIndex preserve true/false; old
version2 series cache rebuilds once, new warm reads require no segment I/O;
normal/source-first movie caches retain compatibility. Old unqualified misses
cannot pin the new episodic key. Rendering/detail and category checks on the
tablet and Fire must use the actual separately verified installed APK.

Negatives: bare/internal L, wrong year/kind/ID, multiple released homonyms,
missing availability, missing episode evidence, wrong/missing required network,
unrelated source poster hints, ambiguous aliases, malformed cache flag, stale
generation, private/query-bearing metadata, cancellation and quota. Keep all
128 canonical controls and20 prior suites; add suite21. The revised network
assertion is an explicit policy correction, not permission or parental bypass.

Run canonical/C11 checks before and after changes, all nine official commands,
prebuilt contract, existing source/alias/artwork/parental tests, native unit
tests and package/assets/certificate/hash audit. No build or synthetic test is
physical proof; retain failed observations. No commit/push/deploy/backend write
or SOURCE-FORMAT-01. CHAT_MASTER_REVIEW=PENDING.

## Subsequent explicit phone test authorization — 2026-10-21

The user subsequently requests "teste tambem no celular". This revokes only
the earlier phone-test stop for this same local correction and authorizes the
same-version/certificate in-place phone update and ordinary protected UI tests.
Parental state and private records remain unchanged; never supply a PIN/grant
or bypass a protected screen. All other scope/publication restrictions remain.
