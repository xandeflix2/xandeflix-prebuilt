# CANON-01-CATALOG-READ-DIAG - read-only device evidence

## Authority and observed failure - 2026-10-20

Autonomous source recovery and test APK authorization remains in force (request SHA-256 dc9feae1e4dddb0cc8950d1df1cb93d840d99bc8446f68897e7b91b9681bf854). User confirmed in-place update to the HLS/MPEG-TS test APK. Screenshot shows Catalogo atualizado, a current import timestamp and matching source provenance, while the user reports no movie or Live items. Parental settings opens normally. No authorized ADB device is connected. Neither a source-format defect nor a storage/parental error is proven to cause this remaining failure.

The existing source status only checks pointer/manifest provenance. It does not measure catalog readability or item counts. Add diagnostic evidence, not a speculative content repair. Preserve the preceding format patch and every historical receipt.

## Closed allowlist before implementation

- src/ui/settings/catalog-read-diagnostic.ts (new, local reads and sanitized coded output only).
- src/ui/components/ActiveSourceSettings.tsx (read diagnostic on an explicit diagnostic action; display expandable counts/codes without exposing records).
- scripts/test-catalog-read-diagnostic.mjs (new positive and negative tests).
- scripts/test-canonical-regression.mjs (append the diagnostic suite and amendment identity; keep all 128 controls and 15 previous suites).
- docs/architecture/CATALOG_LOCAL_READ_DIAGNOSTIC.md (this specification).
- docs/governance/authorizations/CANON-01-CATALOG-READ-DIAG.json and docs/evidence/CATALOG_LOCAL_READ_DIAGNOSTIC.md (new).
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md, docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md (append only, preserve earlier uncommitted observations).
- Ignored reports, isolated existing Android build workspace, ordinary build outputs and a separately named diagnostic APK. No automatic installation or publication.

## Diagnostic contract

Read the current pointer, matching manifest and bounded catalog header, raw Live header, then at most the first declared segment for movies, series and Live, one at a time. Segment JSON parsing is limited to four million characters. Validate generation again after all reads. Missing/invalid data and generation changes yield explicit codes and unknown counts, never invented zeros or a valid-empty claim. A changing generation discards counts. Snapshot paths are validated before the default filesystem read. No full-catalog scan, network, source configuration, authorization request or storage write.

Return a fixed structure of status enums and non-negative safe integer counts only. Do not return IDs, titles, category names, URLs, credentials, source config, free-form exceptions, PIN/PUK records or user fields. The parental field is only the existing status enum. It neither grants access nor changes any parental rule. Report manifest totals separately from first-fold/sample counts; a readable sample is not proof of full catalog integrity.

Expose an explicit Verificar leitura local button in Fonte e catalogo. Show readable Portuguese counts and an expandable coded diagnostic. Keep existing refresh, source identity, licensing, player, parental and atomic promotion behavior unchanged. Diagnostic reads never authorize playback. Repeated clicks are serialized, and late completion after unmount is ignored.

## Acceptance and delivery

Positive tests: matching promoted generation, counts exceeding first-fold/sample, legitimate zero counts, no active snapshot, and both live/movie/series sample reads. Negative tests: missing or malformed headers/segments, count strings/negative numbers, oversized JSON, invalid snapshot paths, thrown private exceptions, generation change and unavailable pointer. Assert no network/writes/mutation, no private values in serialized output, bounded sample reads and preserved parental error status. Test UI wiring and keep diagnostics distinct from update success.

Run canonical check/regression, C11, typecheck, update/security/playback checks, build and site:build, dedicated diagnostics and relevant parental/source tests. Build a standalone debug APK in the isolated sandbox, rerun native tests, verify package/version/signature/assets/hash and historical artifact preservation. Android source/version and all prior APKs stay unchanged. No commit/push/deploy/merge, Supabase, integration changes or SOURCE-FORMAT-01 in this diagnostic delivery. Physical cause and recovery remain PENDING until the user provides the new device evidence.
