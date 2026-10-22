# CANON-01-TV-SIDEBAR-COMPOSITION — audit and physical preview

## Audit before correction — 2026-10-21

Continuation attachment read in full; its final validation list is truncated.
No additional requirement was invented from the missing ending. Scope/order in
[TV_SIDEBAR_COMPOSITION_RECOVERY](../architecture/TV_SIDEBAR_COMPOSITION_RECOVERY.md).
77 incoming dirty paths preserved; empty index and expected origin/branch/HEAD.
No unexpected path/content changes relative to prior backdrop inventory/allowlist.
16 older receipts unchanged, both subsequent UI/type receipts preserved (18 total).

Recovered APK11,800,539 bytes/SHA25689cfa6677e31a588519aae69b752aec5ae851fd21c968ff89d642ef6b4e17f5f
verified locally: same certificate, com.xandeflix.prebuilt1.0.37/code37, all8 packaged
web files identical to dist. Ten official previous commands exit0, Capacitor/Gradle0.
Physical direct ADB confirmed exact installed hash and clean installation timestamps
from the user report. Home renders160 cards, no activation/PIN prompt observed.
Do not infer old data preservation from a clean install. Reported storage recovery
was caused by uninstall, NOT proof of automatic snapshot cleanup. No backup restore,
uninstall or source/identity change performed in this follow-up.

## Confirmed causes, not hypotheses

Actual AFTSS960x540/DPR2 has TV/Android-TV/Fire/side-nav classes. Header/nav are
transparent and have no opaque pseudo-elements. Ancestor shell is rgb(11,14,20),
main begins atx56 with its own immersive gradient. Web-only background extension
is absent in native CSS. Thus the visual strip is the ancestor, not failed CSS
packaging or another opaque header declaration.

Seven44px targets plus2px gap produce46px pitch and320px nav height. Glyph16px
alone does not change spacing. No space-between/around inside nav; grid94/320/94
centers the group. Existing APK incorporates the previous attempted changes.

## Real-device reversible preview

Temporary CSS on the installed Fire, removed afterward, extends inherited page
background56px behind the rail and uses44x36 targets/zero gap. Result252px group,
36px pitch,16px icons, pointer-inert background. Native screenshots before/preview
visually inspected. Empty rail/page-margin RGB compared at5 rows: old differences
26–54 per channel; preview difference0 at all5 rows. Palette changed with the normal
carousel, so comparison is within each frame, not between different movie images.

Evidence: ignored tmp/codex-source-recovery/tv-sidebar-composition-20261021/
before-top.png, preview-top.png, preview.json and pixel-comparison.json.
No PIN entry or protected content opening. Initial15s native screenshot transfer
timed out; partial output was not saved as evidence. Retried transport with60s
budget, without changing any application/test timeout. Optional Pillow analysis
was unavailable; bounded PNG/zlib decoding measured the actual saved pixels instead.

Source correction is CSS-only plus chained authorization identity in the runner.
128 controls/23 suites unchanged. No new shallow assertion mirroring CSS is added;
existing regressions and actual computed geometry/pixels/D-pad validate this visual
change. Prior receipts and old APK preserved. Full checks/build/install results
remain pending and will be appended; preview is not a new-APK installation proof.

GIT_COMMIT=NAO; GIT_PUSH=NAO; SUPABASE_CHANGED=NAO;
NEXT_GATE_STARTED=NAO; CHAT_MASTER_REVIEW=PENDING.


## TV sidebar installed-APK acceptance — 2026-10-21

All10 official commands exit0; canonical128 controls/23 suites, C11, typecheck, update, security, playback and both web builds PASS. Capacitor/Gradle exit0; native206 tests/35 suites, zero failures/errors/skips. Separate Xandeflix-v1.0.37-tv-menu-20261021.apk:11,800,536 bytes, SHA256a071e4f0bc9a9098d2f411e9a307ff4deb3c0c4e5d74fddeab7d82566a07ef07. Same package1.0.37/code37/certificate,8 web assets verified, standalone HTTPS, no private credential pattern.

Installed ONLY on Fire AFTSS with in-place update; exact installed SHA confirmed. Ten identity/activation/source/parental/active/recovery files byte-identical during update. No uninstall/reset/restore. Actual packaged CSS, without preview injection: nav252px,44x36 targets,36px pitch,16px icons; transparent rail follows page palette. Native screenshot inspected; rail/page RGB delta0 at all5 sampled rows. Actual ADB D-pad Down traverses all6 subsequent controls with visible focus, without entering PIN or protected content. Phone/tablet APK installation remains manual; no new phone physical test claimed. Tablet temporary CSS dimensions unchanged.

Preservation audit:1339 baseline files checked, only6 allowlisted existing paths changed;18 prior receipts and140 old APK/AAB artifacts unchanged. Build stage158 of159 files identical; only auto-generated capacitor.settings.gradle relocates4 module references to the same root node_modules during cap sync. Root native files unchanged;14 native APK entries (DEX/libraries/manifest/resources) identical to previous UI APK. Initial broad stage-equality diagnostic stopped on that generated relocation; exact content/real-path verification resolved it without modifying production or test assertions. Old UI APK preserved. HEAD/main/index unchanged; source branch unpublished. Evidence and report:tmp/codex-source-recovery/tv-sidebar-composition-20261021/.

User now reports playback starts then stalls repeatedly on slow connections. Buffer policy is wired to full-screen and preview players, but this visual APK does not change it or certify a slow-network fix. Actual network/bitrate diagnosis remains pending; no player/backend/source/parental/license change. Before this update only2 snapshots existed (~555MB); automatic reclamation is not proven by this update, and earlier clean-install savings remain attributable to user uninstall. GIT_COMMIT=NAO; GIT_PUSH=NAO; SUPABASE_CHANGED=NAO; NEXT_GATE_STARTED=NAO.
