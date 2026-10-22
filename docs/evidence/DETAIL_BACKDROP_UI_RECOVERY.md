# CANON-01-DETAIL-BACKDROP-UI — local correction evidence

## Scope and provenance — 2026-10-21

Explicit user priority: horizontal detail backgrounds, transparent side menu and
smaller Fire/Android TV sidebar icons, then APK/in-place physical tests. Closed
pre-code specification: [DETAIL_BACKDROP_UI_RECOVERY](../architecture/DETAIL_BACKDROP_UI_RECOVERY.md).
Same CANON-01/source-recovery branch and HEAD24295bb782fb66c0de2aa7fca4504d80e27ff311.
No Git publication, backend/native/version changes or next Gate.

## Red/green and integration

The first synthetic missing-primary case failed before the patch: a valid
images.backdrops alternative existed but backdropUri was undefined. Actual cache
snapshot:369 positives,7 without primary; no alternate lists. Neither this sample
nor a metadata miss proves the count of all visible missing backgrounds.

New real-TSX regression passes primary-missing, bounded alternatives, decoded
portrait rejection, retry after failure, ready/composition callbacks, stale
decode cancellation and route identity. Cache tests cover old-purpose refresh,
dedup, warm reuse, wrongID/kind isolation and rejection of arbitrary/privateURLs.
The previous source-first and visible-artwork regressions pass unchanged in their
assertions. Their controlled import loaders were ported to the new real helper/
component after initial missing/uncontrolled-dependency errors; no behavior was
stubbed to always succeed. These fixture errors and the original red test are
preserved in the ignored stage diagnostics; they were not production failures.

Same-identity horizontal images are preferred; blurred eligible poster composition
is only a presentation fallback. No guessed identity, TLS bypass or camera overlay.
TV icons16px,44px minimum focus targets,56px rail; phone/tablet sizes unchanged.
Sidebar background transparent in existing landscape tablet/TV mode; no global
scale, expensive backdrop blur or native geometry changes.

React review: primitive effect dependencies, cleanup/abort, identity-keyed surfaces,
bounded8 alternatives and existing queue/cache caps. Decorative surfaces hidden
from screen readers; existing navigation handlers/focus remain intact.

Official aggregate checks, APK audit and actual device results will be appended
after execution. Retention implementation/receipt remains frozen and locally
validated; automatic cleanup in the new build must be measured without manually
deleting any generation. Cast/actor UI and idle flicker remain subsequent tasks.

CHAT_MASTER_REVIEW=PENDING; GIT_COMMIT=NAO; GIT_PUSH=NAO;
SUPABASE_CHANGED=NAO; NEXT_GATE_STARTED=NAO.


## Validation interruption observed ? 2026-10-21

The first aggregate attempt stopped at the unchanged legacy G8 playback test: a30-second isolated parental child process timed out. A direct full retry timed out in a different child state; the isolated corrupt-state test then passed without code changes. This is consistent with host scheduling/startup slowness but does not establish the cause. No timeout, assertion or parental guard was relaxed. Full official recheck is running; APK/install remain blocked until PASS. Original aggregate log and child log preserved in the ignored stage folder.


## CANON-01-DETAIL-BACKDROP-TYPES ? 2026-10-21

Full canonical128 controls/23 suites and C11 passed. Typecheck blocked by TS6133 on the new component React import. Explicit return annotations fix the compile declaration only. New chained receipt preserves the UI receipt and all historical records. No bypass or runtime change. Revalidation/APK installation pending.


## Latest installation scope restriction ? 2026-10-21

User explicitly narrows delivery: install ONLY on Fire Stick; provide APK for manual installation on phone/tablet. This supersedes earlier three-device installation permission for this delivery. No new APK is installed on phone/tablet by the agent. Temporary CSS preview already observed earlier is not an APK installation. Fire-only helper enforces the target list; remaining physical tests are limited accordingly. Historical receipts preserved, no broader authorization inferred.
