# CANON-01-SOURCE-OUTPUT - HLS and MPEG-TS compatibility recovery

## Authority and confirmed cause

Explicit autonomous recovery authorization: attachment SHA-256 dc9feae1e4dddb0cc8950d1df1cb93d840d99bc8446f68897e7b91b9681bf854. Subsequent user facts: the new provider supplies output=hls and output=mpegts; the previous provider used output=TS. APK generation for device testing is explicitly authorized.

Read AGENTS, Architecture, Execution, Source Data Boundary and C11 lock. Received tested parent 438aa680d5b8a4c6c8aa30073dea194349222c6e on separate branch fix/source-output-format-recovery; main remains b3fc8d1e3844bc5601813ab1b298289af5b3f1fd. CI-only correction is isolated in its preceding local commit. All nine local commands, 128 controls / 14 suites, 116 dedicated EOL controls, seven source/catalog suites and 206 native unit tests passed on that parent.

Reproduction in tmp/codex-source-recovery/output-format-before.json proves directory import maps mpegts to m3u8 while hls, m3u8 and ts map as expected. This confirms a Live format defect, not the cause of every movie/series outage. Private provider and physical playback remain unverified.

## Minimal implementation

Normalize only the transient output value for comparison, accepting ts/TS and mpegts as ts; hls/m3u8/default retain m3u8 behavior. Never rewrite the sealed playlist URL, protocol, host, port, credentials or query string. Legacy M3U direct URLs and non-directory Xtream behavior remain authoritative and unchanged.

Existing directory checkpoints hash only provider JSON. Add a non-secret canonical TS-format discriminator to the directory TS digest so an old checkpoint cannot keep the incorrect HLS channel indefinitely. HLS and non-directory digest bytes remain compatible. A TS directory generation may rebuild once, through existing staging/atomic promotion; never reset identity or delete the active snapshot. Subsequent unchanged TS refresh skips staging normally. Failed/partial/unauthorized import preserves the previous generation. No new network endpoint or media proxy.

## Closed allowlist, declared before code

- src/source/real-source-importer.service.ts (output alias and TS digest discriminator only).
- scripts/test-c105-directory-import.mjs (append positive/negative cases, preserve all existing cases).
- scripts/test-canonical-regression.mjs (add amendment identity and directory import suite; preserve 128 controls and 14 existing suites).
- docs/architecture/SOURCE_OUTPUT_FORMAT_RECOVERY.md (this pre-code specification).
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md, docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md (append only).
- docs/evidence/SOURCE_OUTPUT_FORMAT_RECOVERY.md and docs/governance/authorizations/CANON-01-SOURCE-OUTPUT.json (new).
- Ignored reports, build sandbox, dist and a separately named test APK; preserve the 140 historical Android artifacts and the initial test APK.

## Acceptance and limits

Test hls/mpegts/ts/TS/m3u8/default/unknown values, exact URL retention, VOD/series/artwork identities, old-digest recovery without pre-promotion pointer changes, unchanged new TS digest, failed late list/auth rejection preserving active state, and legacy direct M3U/non-directory behavior. Include the suite in canon:test as suite 15, preserving all prior controls. Run nine official commands, dedicated/source suites, C11 lock, web/native build, 206 native tests and APK signature/assets audit. Device tests remain PENDING without authorized connected devices. No Supabase, Android source/version, licence/C9/parental/HTTPS/CORS/TLS changes.

Local isolated commits are permitted by user authorization. No push that initiates a deployment; no main modification, merge, release, automatic installation or SOURCE-FORMAT-01. Test APK delivery is not production or physical homologation.
