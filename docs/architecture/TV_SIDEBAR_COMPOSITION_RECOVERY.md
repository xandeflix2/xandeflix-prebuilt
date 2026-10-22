# CANON-01-TV-SIDEBAR-COMPOSITION — specification before correction

## Authorization, audit and priority — 2026-10-21

User continuity report explicitly requests audit first, then correction of actual
Fire sidebar opacity and excessive icon spacing. Latest delivery restriction:
install ONLY on Fire; provide a separate APK for manual phone/tablet installation.
Same CANON-01, source-recovery branch, HEAD24295bb782fb66c0de2aa7fca4504d80e27ff311.
Do not start cast/actor/flicker or any other feature before this visual correction.

Read-only audit completed before this document/code.77 current dirty paths,
empty index, expected origin, unchanged main/origin-main baseline. All16 receipts
from the prior stage baseline are byte-identical; two subsequent UI/type receipts
remain intact (18 total). No unexpected changes/additions relative to the captured
backdrop-start inventory and its21 allowed paths. Preserve all77 incoming paths;
earlier prose counts are not used to discard or overwrite files.

Host APK ui-fundos:11,800,539 bytes, SHA256
89cfa6677e31a588519aae69b752aec5ae851fd21c968ff89d642ef6b4e17f5f.
All8 web assets match current dist. Signature/package1.0.37/code37 verified.
Existing10 commands, Capacitor and Gradle reports exit0. Physically confirmed the
installed Fire APK has that exact SHA and clean firstInstallTime equals lastUpdateTime.
Home renders160 cards, no activation/PIN screen in this observation. Source binding
and full playback are not newly certified. User reports prior uninstall freed
storage; do NOT attribute that gain to automatic retention or presume old data kept.

## Confirmed physical causes

Fire viewport960x540/DPR2; television/android-tv/fire-stick/side-nav classes active.
Header background transparent, no image/pseudo-element; nav also transparent.
Ancestor app-shell paints rgb(11,14,20), reserves56px left padding. Main immersive
gradient starts at x56; its ::before content is none. Web-only stylesheet supplies
an inherited-background extension behind the rail, absent from Android. Therefore
another transparent declaration would not solve the visible dark strip.

Seven links44x44,2px gap,16px glyphs:46px center pitch,320px navigation group.
No space-between/around within nav. Header grid94/320/94 centers the group; reducing
only glyphs does not reduce its pitch. Existing APK contains the intended prior CSS;
this is a composition/density defect, not an old asset/package mismatch.

## Minimal correction

TV-only shell background equals normal page background. Extend the existing
immersive page background by exactly the rail width using a pointer-inert ::before
pseudo-element, inheriting colors, gradient sizing and scroll attachment. Position
the page relatively; no new image fetch, blur, animation, observer or native layer.
Keep header transparent. Apply only television/Fire/Android-TV side navigation,
explicitly excluding tablet/phone classes. Phone/tablet rules remain untouched.

Use44px width and36px height for TV remote nav targets,16px glyphs,zero extra gap:
36px pitch and252px group, approximately79 percent of the old320px. The prior44px
height was a local conservative choice, superseded for remote-only TV by this
explicit compactness request. Touch layouts retain their existing target sizes.
Focus outline/selection/callbacks/back/D-pad stay intact; no negative margins,
overlapping hit areas, global zoom or transform of the shell.

## Closed allowlist and acceptance

- src/index.css: existing scoped TV density rule and targeted background extension.
- scripts/test-canonical-regression.mjs: authorization identity registration only;
  preserve128 controls/23 suites and all assertions.
- this spec; docs/evidence/TV_SIDEBAR_COMPOSITION_RECOVERY.md.
- new chained docs/governance/authorizations/CANON-01-TV-SIDEBAR-COMPOSITION.json.
- append-only PHASED/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS.

No modifications to previous receipts, artwork/runtime logic, storage/retention,
catalog/source, player, activation/parental/license, native/package/version/signing,
Supabase/data, Git publication or next phase. Preserve old APKs and create separate
tv-menu APK under the same certificate. No uninstall, clear-data or restore of the
unverified backup. Ignored sanitized audit/build/physical outputs are permitted.

Check real Fire CSS and screenshots before/temporary preview/installed APK. Require
matching pixels on empty rail/page background,36px pitch, visible non-overlapping
remote focus and navigation. Verify transparent real background rather than merely
computed header alpha. Confirm tablet/phone dimensions unchanged. Temporary preview
is not installed-APK proof. Run canonical/C11 and applicable official commands;
test failures stay blocking, never relax assertions/timeouts. Record preserved
private state during Fire in-place installation; other devices remain manual.

GIT_COMMIT=NAO; GIT_PUSH=NAO; SUPABASE_CHANGED=NAO;
NEXT_GATE_STARTED=NAO; CHAT_MASTER_REVIEW=PENDING.
