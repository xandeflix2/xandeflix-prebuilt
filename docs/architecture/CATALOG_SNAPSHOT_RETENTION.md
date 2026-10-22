# CANON-01-CATALOG-RETENTION — automatic bounded catalog retention

## Authorization and pre-code specification — 2026-10-21

User explicitly requested that new APK updates automatically remove obsolete
data from existing installations. The preceding read-only audit confirmed
14/25/17 permanent catalog generations on Fire/tablet/phone; Fire private data
2,421,473,280 bytes, with 2,062,307,328 bytes outside the active generation.
Current recovery journal references two generations on each device.

Same CANON-01, new nominal amendment; do not restart the Gate. Active independent
C11 clone, origin xandeflix2/xandeflix-prebuilt, branch
fix/source-output-format-recovery, received HEAD24295bb782fb66c0de2aa7fca4504d80e27ff311.
The 60 accumulated paths,15 previous receipts, Android sources/artifacts and
preceding APKs are preserved. Pre-edit canonical128 controls/21 suites and C11
passed. User's local autonomous recovery and three-device in-place installation
authorization remain applicable. No commit/push/backend/deploy/version change.

## Closed allowlist

- src/bootstrap/storage/snapshot-retention.ts (new policy/operation serialization)
- src/bootstrap/storage/capacitor-filesystem.storage.ts
- src/bootstrap/storage/storage.interface.ts
- src/bootstrap/bootstrap.service.ts
- scripts/test-catalog-snapshot-retention.mjs (new regression)
- scripts/test-canonical-regression.mjs (register suite and separate authorization)
- this document; docs/evidence/CATALOG_SNAPSHOT_RETENTION.md (new evidence)
- docs/governance/authorizations/CANON-01-CATALOG-RETENTION.json (new chained receipt)
- append-only docs/STATUS.md, docs/EVOLUTION_REPORT.md,
  docs/ERRORS_AND_BLOCKERS.md and XANDEFLIX_PREBUILT_PHASED_EXPANSION.md.

Ignored diagnostic/helpers/logs and normal ignored build outputs are allowed.
No Android/native, package.json, signing/version, source/import formats,
catalog records, artwork, player, parental, license or remote data changes.
Cast/actor-page requests are subsequent work, not this retention patch.

## Behavior and safety

Schedule maintenance after ready local initialization (including updated
installations) and successful import/promotion. Maintenance is optional to UI
readiness, coalesced and delayed; failure must not become empty catalog or block
boot. It runs again on later startups/imports without a one-time version flag.

Delete only direct permanent snapshot directories not referenced by the valid
active pointer or recovery journal. Preserve active, previous and last-known-good
references, with at least two distinct existing generations. Never remove
activation/identity/source/PIN/PUK/preferences, active metadata, optional artwork
cache, staging or transport temporary files in this amendment. Cache already has
its independent bounded policy; no blanket clear-data operation.

Fail closed for absent/malformed pointer/journal, unsafe IDs, unexpected entries,
missing protected generation, inconsistent catalog/manifest metadata or missing
declared segments. Validate protected headers and segment sizes/SHA256 with
bounded reads and yields, never materialize the whole catalog in RAM or hold
the operation queue across the full verification. The metadata/journal must
still match before deletion. This is retention safety proof, not a new claim
of signed provenance; existing import/recovery validators remain unchanged.

Serialize permanent-generation reads and writes/deletion across storage instances.
Promotion may write the pointer internally without recursive mutex acquisition.
Journal mismatch during a transaction postpones maintenance. Recheck the exact
pointer/journal fingerprint before each deletion; stop remaining work if changed.
Use strict leaf IDs and root-scoped relative paths only, directory type checks,
and never traverse outside prebuilt/snapshots. Yield between deletions so queued
reads/promotions can proceed. Keep all unknown root files and staging untouched.

Partial cleanup failure preserves protected data and remains retryable. No
activation grant, source fallback or parental unlock is introduced. No minimum
free-space or timing SLA is asserted. Existing large active catalog plus rollback
still consumes space; this patch does not compress or redesign its format.

## Acceptance

Meaningful real-adapter fixtures must cover startup upgrade cleanup, repeated
imports retaining recovery, path traversal/unsafe entry/type, missing/corrupt
journal and protected files, changed state between deletions, reader/promotion
concurrency, multiple storage instances, I/O/partial failures and retry, idempotent
rerun, first single-generation install, no changes to staging/private markers,
and failed import scheduling. Preserve128 canonical controls/21 suites and add
suite22, historical receipt immutability and separate future authorization.

Run all nine official commands, prebuilt contract, dedicated/new and existing
source/catalog/artwork/parental regressions. Build separate same1.0.37/code37 APK,
same package/certificate and public client configuration; preserve old artifacts.
In-place update each authorized device with protected data compared privately,
then observe automatic cleanup, two recovery references, unchanged active pointer
and catalogue counts, ordinary UI/poster/search readiness and measured reclaimed
space. Reopen to prove idempotency. No PIN entry, uninstall or manual data reset.
Report real failures and pending tests; poster checks do not certify playback.

GIT_COMMIT=NAO; GIT_PUSH=NAO; SUPABASE_WRITE=NAO;
NEXT_GATE_STARTED=NAO; CHAT_MASTER_REVIEW=PENDING.
