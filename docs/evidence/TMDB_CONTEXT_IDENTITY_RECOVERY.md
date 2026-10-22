# CANON-01-TMDB-CONTEXT-IDENTITY — execution evidence — 2026-10-21

Specification before code: ../architecture/TMDB_CONTEXT_IDENTITY_RECOVERY.md.
Explicit user source-recovery autonomy, automatic source/TMDB artwork rule and
three-device update/testing authorization. No old receipt changes/publication.

Preflight received branch fix/source-output-format-recovery and HEAD
24295bb782fb66c0de2aa7fca4504d80e27ff311; main baseline b3fc8d1e3844bc5601813ab1b298289af5b3f1fd.
Prior recovery work preserved in a SHA256 snapshot. Pre-change canon:check,
128 controls/19 suites and C11 lock passed. New actual-selector test failed
before the patch on Med Cezir/Medcezir full-title boundary equivalence.

Read-only source-title evidence confirms all3 named entries are episodic in
this playlist. Lovesick has7 records under Netflix, while the separate
LoveSick [L] has16 under Legendadas. It must not inherit the first work's
Netflix context. No movie/source type was changed from title search.

Read-only TMDB evidence confirms country, network and Planned distinctions.
Provider episode edits differ from official season/episode totals; counts
are deliberately not used for matching. Category/episode evidence is an
optional presentation hint, never a content-access or catalog-type authority.

The six dedicated test groups pass: full-title character-preserving boundary
normalization; country identity and wrong/unknown/ambiguous details; network
disambiguation and known Planned/not-aired exclusion; cache identity isolation
and legacy migration; movie/TV/authorization/concurrency/private-title guards;
actual MediaCard/Hero and metadata-hook context propagation/cleanup. Source-
first, visible recovery and official alias suites retain all assertions.
Network membership disambiguates homonyms and never rejects a uniquely named
released work merely because that shelf also carries licensed productions.

Real configured API requests:8 HTTP200, no credentials persisted or printed.
Results with actual new service and context derived from source categories:

| Source title | Confirmed TV ID | Year | Poster/synopsis/genres | Image HTTP |
| --- | --- | --- | --- | --- |
| Tres Irmas | 158339 | 2022 | Present | 200 |
| Med Cezir Vidas Alheias | 61867 | 2013 | Present | 200 |
| Lovesick (Netflix) | 62668 | 2014 | Present | 200 |
| LoveSick [L] (Legendadas) | No unambiguous match | Unknown | Not assigned | Not requested |

Sanitized source/API observations, red/green and preflight results are under
ignored tmp/codex-source-recovery/tmdb-context-20261021/. Official public
references: [Turkish Three Sisters](https://www.themoviedb.org/tv/158339-uc-kiz-kardes),
[Lovesick TV](https://www.themoviedb.org/tv/62668-lovesick), and the distinct
[Lovesick film](https://www.themoviedb.org/movie/319389-lovesick).

New receipt chains runner and the2 previously changed artwork fixture files
to CANON-01-SERIES-POSTER-COMPOSITION. All previous receipts immutable; new
fixture cache-version edits retain the old-positive/offline/negative controls.
No API credential/configuration, source, native code, catalog record, parental,
license, playback, backend or Android version/signature changed.

Full official validation, next separate APK and physical three-device test:
PENDING. Local API success is not a physical rendering or playback certificate.


## CANON-01-TMDB-CONTEXT-IDENTITY — local delivery and physical limits — 2026-10-21

Local validation PASS: nine official commands plus the prebuilt contract test
all exited0;12 additional mandatory suites exited0. Canonical128 controls/20
suites; native206 tests/35 suites, no failures/errors/skips. Source-first,
visible/alias recovery, parental, license, C11 and playback checks retained.
The actual configured API probe recovered TV158339/61867/62668 with correct
years, synopsis, genres and image200; this is a computer/API proof only.

APK: Xandeflix-v1.0.37-capas-contexto-20261021.apk, SHA256
0e529f8c96fe53d985751b7f6764884d694d8918801ca1e87c47bc6cfb15056f, 11797836 bytes, package/version/certificate unchanged.
All8 web assets verified, public TMDB/Supabase configuration preserved. All14
classes.dex/manifest/resources entries compared with the preceding poster APK
are byte-identical; this amendment changes no native certificate/HTTP policy.

Installation status: AFTSS and SM_X610 updated in place. APK hashes match;
identity, activation/key, source vault, parental preferences and active catalog
pointer were byte-identical before/after install, before normal app boot. The
phone disappeared from ADB before the first install attempt; the strict3-device
preflight stopped before changing any device. A separate explicitly targeted
2-device attempt then passed. SM_S926B remains on the preceding APK; no current
revision installation on the phone is claimed. User asked to reconnect it.

Physical verification is BLOCKED/NOT CERTIFIED, superseding any pending/implied
physical success for this revision. Fire actual new card checks did not pass;
independent same-key public API requests in its WebView fail, and native API
returns certificate trust failure. Network validation was absent in the sampled
connectivity state. This identifies a real current transport failure, not its
exact upstream cause. Tablet inspection lost its debug connection; normal
process restart and targeted ADB transport reconnect did not complete a visual
proof, and the last targeted query could not see the tablet. No data reset,
certificate trust change, DNS bypass or new corrective production patch was
applied in response. User action/device/network access is required to resume
physical verification. No full-device rendering/playback PASS is declared.

Known metadata limitation: separate LoveSick [L] under Legendadas stays
unqualified; it is not assigned Netflix's show merely because its normalized
title is similar. No film/series reclassification, importer or source URL
change, catalog mutation, backend write, Git publication or next Gate.
