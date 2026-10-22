# CANON-01-CATALOG-PHYSICAL-FIXES - specification before code - 2026-10-21

Explicit user source-recovery autonomy and subsequent physical installation,
adult-area delay/header and series artwork/category reports authorize this
local corrective amendment. Current Gate remains CANON-01; no SOURCE-FORMAT-01.
Preserve received HEAD 24295bb782fb66c0de2aa7fca4504d80e27ff311, main, all
previous receipts/patches and 1.0.37/code37/package/signature. No Git publication.

## Confirmed evidence

The approved recovery APK was installed in place on AFTSS, SM_X610 and SM_S926B;
private identity/key/activation/install/parental/source data and active pointers
were identical across installation. All three now hold 43933 movies, 9496
series and 2034 channels after normal UI refresh. UI catalog recovery is real;
full playback matrix remains in progress and must not be declared PASS early.

User examples 4x100, 10x10 and 4x4 are interpreted as season x episode by the
generic classifier. Exact numeric xui-id/category membership in authenticated
same-source get_vod_streams confirms all three are movies. No URL/title guess
may override an explicit source type. Source metadata is stronger than this
ambiguous numeric title, but existing structural URI/SxxExx behavior remains.

Phone adult header at 411 CSS px: settings button x396/width44 is beyond the
viewport; adult route lacks the existing compact phone-header class. Adult
reader requests 96-row pages, repeatedly reparsing 2500-row segments, then
waits to scan series even when adult movies are ready. Initial CatalogGrid
also has no visible loading text when loading an empty first page. This
explains an avoidable I/O waterfall; PIN KDF/policy is not to be weakened.

Missing/wrong covers may include the misclassified movie examples. Correct
confirmed types first and recheck real series artwork before changing image
matching policy. No speculative TMDB identity relaxation is authorized here.

## Minimal changes and ID continuity

1. Only opaque XUI entries with numeric-prefix NxN titles, previously classified
as series, and explicit xui-id may consult existing authenticated category/ID
resolver. Only confirmed movie membership overrides that ambiguous title.
Unknown membership retains the original kind; malformed/auth/network failure
still rejects candidate. Generic classifier/parser and original URLs unchanged.
2. Reserve removed false-series ordinal slots and episode stream ordinals so
all genuine preexisting series/episode/stream IDs remain unchanged. Newly
recovered numeric-title movies use stable mov:m3u:xui:<source-id> namespace;
the ordinary movie ordinal counter excludes these additions, preserving every
previously correct movie ID. Never copy/delete watch history or old snapshots.
3. Namespace eligible M3U checkpoint as resolver V2 to rebuild affected V1 once
through existing staging/promotion. Afterwards unchanged digest skips normally.
4. Adult reader uses existing bounded segment-sized pages (2500 records), a
maximum of two page requests per call and 24 returned items. Return available
movies without waiting for series; continue with valid cursors. Empty partial
pages remain loading and automatically continue with a cancellable timer.
Show explicit first-page status; no false empty or unbounded full-catalog load.
Keep generation, policy, lock, abort, rollback and error checks at every boundary.
5. Add only adult route to existing compact phone-header presentation. Preserve
callbacks, 44px actions, focus, PIN dialog, desktop/tablet/TV/sidebar behavior.

## Closed allowlist

- src/source/real-source-importer.service.ts
- src/catalog/adult-catalog-reader.ts
- src/ui/pages/AdultPage.tsx
- src/ui/components/AppShell.tsx
- scripts/test-c135-adult-reader.mjs (adapt pagination expectations, keep negatives)
- scripts/test-catalog-physical-regressions.mjs (new positive/negative suite)
- scripts/test-canonical-regression.mjs (amendment identity and suite18 only)
- docs/governance/authorizations/CANON-01-CATALOG-PHYSICAL-FIXES.json (new)
- this specification, docs/evidence/CATALOG_PHYSICAL_REFINEMENTS.md (new)
- append-only PHASED, STATUS, EVOLUTION_REPORT, ERRORS_AND_BLOCKERS and current
  physical evidence. Ignored fixtures/reports/build sandbox/new separate APK.

Do not change old receipts, classifier/parser, player, Android, vault, licensing,
PIN/KDF/parental store, source configuration, Supabase, workflow, version or data
outside normal authorized app refresh/playback. React Best Practices checklist
applies to touched TSX. Installation/test authorization permits subsequent
in-place correction updates on these same three targets, without uninstall/reset.

## Acceptance

Real source API proof for all three examples; synthetic red/green classification
and lineage check showing true movie/series/episode/stream IDs unchanged; same
URLs/relations/artwork; negative API absence/conflict/auth and strong structural
paths; V1->V2 checkpoint rebuild then NO_OP. Bounded adult first page without
series wait, sparse/empty paging, no duplicates/omissions, abort/lock/generation/
failure rollback, manual adult rules and denial without authorization. Mobile
header bounds at 320/360/411/599 px in actual CSS, callbacks/focus retained and
desktop unchanged. Preserve 128 controls/17 suites, add suite18, all nine official
checks and 206 native tests. Verify new APK signature/assets/hash; install in
place on all three with private preservation proof. Recheck catalog, Home/
Filmes/Series categories/covers, Live/movie/series playback and next actions.
Report all remaining provider, access or artwork failures faithfully; no fake
homologation, no automatic remote publication, no next Gate.

## User refinement before implementation - chapter titles and source changes

The user additionally identified IT: Capitulo 2 and Sobrenatural: Capitulo 2
under Terror, and questioned UHD | 4K. The parser also interprets the word
chapter followed by a number as an episode. Extend item1 above to ALL weak
title-only episode shapes (NxN, chapter/episode/season words), excluding compact
SxxExx/TxxExx and explicit /series/ paths. Exact authenticated numeric item ID
membership, never the title/category wording, may confirm a movie. Reserve the
same historical slots for every such correction. No list of real titles,
provider hostname or sourceId is embedded in production code.

Across servers, canonical typed /movie/, /series/, /live/ paths and explicit
directory types retain precedence. Eligible opaque get.php M3U uses the
existing same-source API adapter. Other ambiguous records cannot be universally
classified without reliable metadata: retain explicit unresolved diagnostics,
never infer that all Terror/UHD records are movies. Test multiple synthetic
servers, mixed categories, real episodes with chapter words, and failed API.
The resolver, generic parser and generic classification profile stay unchanged.

The first actual CSS fixture at 320px confirms that compact mode alone still
shrinks the adult action to 26.625px. Extend the closed allowlist to src/index.css
and add an adult-route class in AppShell, only for scoped phone sizing. Keep all
actions visible, nonshrinking 44px targets; allow the brand text to shrink within
its available space. No action removed and no desktop styles changed. This is
the necessary minimal continuation of the explicitly requested mobile repair.
