# CANON-01-SOURCE-OUTPUT

Pre-code architecture and allowlist: docs/architecture/SOURCE_OUTPUT_FORMAT_RECOVERY.md.

Confirmed red/green reproduction: the added output alias case fails with m3u8 != ts on the received production code, then all 12 directory/import tests pass after the minimal correction. Logs: tmp/codex-source-recovery/output-regression-red.log and output-regression-green.log.

Output ts/TS/mpegts now selects ts in the transient directory import only. HLS/default and legacy direct source URLs stay unchanged. A TS-only digest discriminator prevents a stale raw checkpoint from retaining the old HLS channels; a subsequent unchanged TS refresh still skips staging. Tests preserve VOD/series/artwork identities, source URL, failed/unauthorized refresh safety, active pointer before promotion and direct M3U media authority.

All previous 128 controls/14 suites remain and the directory test is added as suite 15. New grants are exact and the runner grant chains to CANON-01-A22A-WINDOWS-EOL. No historical receipt changed. Full validation, isolated APK audit and physical limitations are recorded in tmp/codex-source-recovery. No remote or physical PASS is claimed.

## Local verification completed - 2026-10-20

All nine official commands passed, plus the dedicated A22 contract and seven source/catalog suites. Canonical regression preserved 128 controls and now runs 15 suites; A22 has 116 controls; directory/import has 12 named cases. Final canonical/C11 checks passed. Revised APK: Xandeflix-v1.0.37-teste-hls-mpegts-20261020.apk; 11475305 bytes; SHA-256 5d20b4663adb699e6c665e63fc510cfc5d865f420c23545e5918a2b025eb8f47. All 206 native tests reran successfully (35 suites, zero skips/failures/errors); signature matches historical C165 and all eight web assets match the verified dist. Android sources/version and 140 historical artifacts are preserved.

Physical provider playback is PENDING. After manual installation, use Settings -> Source and catalog -> Refresh catalog to repair old entries through normal atomic promotion. No installation, push, deployment, merge or remote backend operation was performed. Full logs and limitations: tmp/codex-source-recovery/output-apk-20261020/.
