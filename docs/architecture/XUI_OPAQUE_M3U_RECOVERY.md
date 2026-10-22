# CANON-01-XUI-OPAQUE-RECOVERY - specification before code - 2026-10-21

Authorization: explicit autonomous source recovery (attachment SHA-256
dc9feae1e4dddb0cc8950d1df1cb93d840d99bc8446f68897e7b91b9681bf854),
subsequent source attachment, connected-device diagnosis and test APK request.
This repairs classification of the existing M3U/Xtream formats, including
type=m3u_plus&output=mpegts and output=hls. SOURCE-FORMAT-01 is not started.
Active clone: C:/Xandeflix/xandeflix-prebuilt-c11-main; functional branch
fix/source-output-format-recovery, received HEAD 24295bb782fb66c0de2aa7fca4504d80e27ff311.
Pre-edit canonical check/regression/C11 all exit 0. Preserve the eleven
received diagnostic changes and all registered receipts, including the
uncommitted diagnostic receipt. No commit, push, deploy or installation here.

## Confirmed cause and evidence boundary

Read-only physical native transport and the user-provided M3U show opaque
/play/<token> links with numeric xui-id. The existing structural classifier
recognizes series episodes but leaves movies and channels unresolved. Tablet
manifest is readable and contains 9496 series, zero movies and zero channels.
Authenticated same-source API category queries confirm xui-id equals stream_id
for the sampled movie/channel and exact group/category names. Full VOD API
exceeds the existing 16 MiB cap; do not raise that cap. Phone/Fire snapshots
still describe older directory generations. No raw source values are evidence
artifacts; retain only counts, fixed states and comparison booleans.

## Minimal implementation

1. Only unresolved numeric-xui-id opaque /play entries use a lazy local type
resolver. Derive API solely through the existing same-origin get.php adapter;
never change sealed configuration or derive endpoints from media URLs.
Authenticate the API, match exact trimmed category/group name and exact numeric
stream ID in category-scoped live/VOD lists. No title/group heuristics, opaque
token decoding, fabricated types or broad directory requests. Preserve all
original media URLs, existing structural classifications and legacy IDs.
2. Bound category counts, response bytes, group cache and total cached IDs.
Ambiguity, missing identity/category, auth, transport or parsing failure rejects
the candidate and cleans its staging; the previous active catalog is retained.
Only fixed error codes may escape. Existing generic unresolved rules remain.
3. Namespace M3U content checkpoints for eligible same-origin get.php sources
with a fixed resolver-version discriminator. Rebuild old checkpoints once,
then retain unchanged-content optimization. Do not modify sourceVersion or IDs.
4. Recognize only explicit XUI /play/<token>/hls or /m3u8 live suffixes as HLS;
keep ts/mpegts and original URLs. Do not infer media kind from those suffixes.
5. A different sourceId uses first-source PREFER inventory selection, retaining
old generation until promotion. Same-source directory REQUIRE and same-source
legacy selection remain unchanged; no migration of established content IDs.
6. LOCAL_FIRST_ACTIVE_PRESERVED with an error is a failed update on native and
web. Actual busy/visibility/cast deferral remains deferred. No guard changes.

## Closed allowlist

- src/source/xui-m3u-kind-resolver.ts (new pure bounded resolver)
- src/source/real-source-importer.service.ts (integration/checkpoint/container)
- src/bootstrap/boot-sync-coordinator.ts (different sourceId selection only)
- src/ui/settings/active-source-status.ts (truthful error mapping only)
- scripts/test-xui-m3u-kind-recovery.mjs (new synthetic regression suite)
- scripts/test-c105-directory-orchestration.mjs (append source-change cases)
- scripts/test-canonical-regression.mjs (append amendment and suite 17)
- docs/governance/authorizations/CANON-01-XUI-OPAQUE-RECOVERY.json (new)
- docs/evidence/XUI_OPAQUE_M3U_RECOVERY.md (new)
- this specification; append-only PHASED_EXPANSION, STATUS, EVOLUTION_REPORT,
  ERRORS_AND_BLOCKERS. Ignored tmp reports/build sandbox/new named test APK.

No package/config/native Android/player/auth/parental/vault/Supabase/workflow,
old receipt or verifier changes. Main and Android 1.0.37/code37 are preserved.

## Acceptance

Synthetic red/green reproduction: opaque Live/movie plus structural episodes;
exact original URLs/artwork, series IDs/relations, bounded category requests,
both output formats, Unicode chunk boundaries and atomic promotion. Negatives:
auth denied, missing/malformed/ambiguous ID/category, API network/size/limits,
unmatched group/ID, no API derivation, active snapshot unchanged on rejection,
no request for already structural records, revoked/wrong source never fetches.
Checkpoint old -> rebuild -> unchanged, native digest and streaming equivalence;
source-change selection and same-source ID preservation; native refresh errors
remain failures while actual deferral stays deferred. Preserve 128 canonical
controls and all 16 suites, add suite 17, run nine official commands and
directory/orchestration/automatic refresh/classifier/parental/prebuilt tests.
Dry-read the real source with actual resolver code and device-direct metadata
requests, no staging/promotion or playback. Build a separate APK in an isolated
Android copy, run native unit tests, verify identity/signature/assets/hashes,
preserve historical artifacts. Physical installed-app restoration/playback
remain PENDING until the new APK is installed and tested by the user.


## Evidence refinement before final acceptance - 2026-10-21

Complete attachment/API membership comparison found 178 episode-shaped records in six groups absent from Live/VOD category APIs, plus a small number of unmatched IDs. These were already unresolved by the legacy classifier; adding series roots would change established ordinal IDs and is outside this patch. Preserve them as unresolved with exact rawUnresolvedCount, rather than fabricate a type or block every confirmed channel/movie. A complete M3U with explicitly unclassified records retains the existing normalization contract; it is distinct from an incomplete download or failed metadata request. Missing exact category/ID returns no kind; ambiguous type, invalid IDs/metadata, auth, transport or bounds failures still reject the candidate and preserve active state. This refines item 2 above only for a successful authoritative lookup with no membership. Positives/negatives must distinguish legitimate absence from unavailable/invalid data, and report the unresolved total. No expansion of episode parsing or content IDs.


## Minimal test allowlist addition - before correction

site:build found an existing C157 assertion that explicitly expects the old misleading native failure-to-deferred mapping. Add scripts/test-c157-web-source-https.mjs to this amendment allowlist, changing that assertion to require failed on both platforms while retaining all 15 cases, web-only telemetry, guard negatives and genuine deferral checks. This follows the authorized truthfulness fix; no production scope expansion or workflow change.


## CANON-01-XUI-OPAQUE-RECOVERY - explicit physical installation authorization - 2026-10-21

User now explicitly authorizes in-place installation and functional tests on all three connected canonical devices (AFTSS, SM_X610, SM_S926B). Approved APK SHA-256 0fa7e55a22b64848a56d9f870fed01608a89080dc0adceb092cfb0d5c1e0ea93, unchanged 1.0.37/code37/package/signature. This supersedes only no-install restrictions for this APK. Scope, privacy/preservation checks and UI-only test plan: docs/evidence/XUI_OPAQUE_M3U_PHYSICAL_TESTS.md. No uninstall/reset, source/security/backend/runtime/old receipt/Git changes or next Gate. Results pending actual evidence.
