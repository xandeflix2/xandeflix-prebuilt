# CANON-01-SERIES-POSTER-COMPOSITION - evidence - 2026-10-21

Explicit user source-recovery/installation authorization and subsequent rule:
automatic source cover when valid, TMDB when missing/invalid, without requiring
a manually enumerated title list. Specification precedes production patch in
../architecture/SERIES_POSTER_COMPOSITION_RECOVERY.md. Historical receipts stay
immutable; new runner grant chains to CANON-01-CATALOG-PHYSICAL-FIXES.

Real Home audit found25 horizontal images among29 loaded series cards. User
screenshot additionally shows generic dance art and13 Hours movie art reused
across unrelated series. Streaming read of the source attachment confirms
identical URI SHA256 for four unrelated titles in each group; no private image
URL is saved. Evidence: ignored series-posters-20261021/provider-poster-reuse.json.

Pre-patch actual Artwork test fails because a decoded1920x1080 source renders as
a series poster. New behavior rejects this role mismatch. Reuse detection is
bounded, ephemeral and generic: three different normalized identities sharing
an image trigger independent TV title/year matching; official variants may
validate a legitimately shared source. Failed/shared image hints never constrain
the fallback. No TMDB title/alias/homonym matching protection was relaxed.

The two legacy artwork fixtures initially failed on previously added UI imports.
Only isolated presentation/dependency ports and realistic image dimensions were
added; all existing assertions remain. Dedicated aggregate now passes source-
first, visible recovery and alias suites plus bounded claims/cancellation tests.

Actual configured TMDB API probe returned HTTP200 for seven requests and
independently matched The Kardashians, Agente Kim: Reativado and Deep Revenge
as TV works with posters. Credential is neither printed nor stored in evidence.
This proves actual API/matching availability, not yet a rendered-device PASS.

Official checks, native build and new physical cover verification: PENDING.
The preceding classification APK is already installed on all three devices,
with installation-private data byte equality. Tablet source refresh confirms
43981 movies,9468 series,2034 channels;48 records recovered as movies. Terror
and UHD contain zero series in that source, and the43933 ordinary movie IDs,
titles and references have an unchanged SHA256 lineage digest. No Git/backend
publication, version change, uninstall/reset or next Gate.


## CANON-01 physical poster verification - 2026-10-21

Nine official commands plus the Vercel prebuilt contract test exited0. The
canonical suite preserves128 controls and now runs19 suites. Native rebuild
passed206 tests/35 suites with zero failures, errors or skipped tests. Package,
version1.0.37/code37, certificate and all8 web assets were verified. New APK:
`Xandeflix-v1.0.37-capas-series-20261021.apk`, SHA256
`d3258397e9277bf99bcefa7f0221b62157fe3c651eff76cbfc20b83116907c8f`.

Authorized in-place installation succeeded on AFTSS, SM_X610 and SM_S926B.
Installed APK hashes equal the approved APK; identity, activation, permanent
key, source vault, parental preferences and active catalog pointer match
byte-for-byte before/after installation (checked before normal app boot).
No uninstall, reset, new device identity, version bump or backend edit.

Actual rendered checks passed on all3 devices for Uma Nova Mulher206180,
Proximo251883, Agente Kim: Reativado296206 and Deep Revenge316205. All12
loaded images are vertical and their rendered cache paths equal those of
the independently identified official TV poster, rather than the reused
source artwork. Evidence: per-model *-official-cards.json and installation-
results.json under ignored series-posters-20261021/. This is a bounded physical
sample, not a claim that all9468 series have been exhaustively inspected.

A separate real network failure was observed on the phone: browser
ERR_NAME_NOT_RESOLVED, native HTTP DNS failure and CACHE_SOURCE_UNAVAILABLE
for two official image.tmdb.org posters, while the metadata API worked. The
same public JPEGs returned200 on the computer/other devices. After the user
reported leaving corporate Wi-Fi for shared mobile data, both images returned
200 and the same4 card checks passed on the phone. The evidence confirms
connection-dependent DNS availability; it does not prove a particular corporate
filter or that the private-DNS setting itself was causal. No DNS, certificate,
TLS, HTTP downgrade, proxy or alternative-host bypass was implemented.

Honest fallback remains where title/year/source evidence cannot select a
unique official TV work. Read-only API examples: Meu Nome e Farah has2 exact
TV matches from different years; Tres Irmas and Lovesick have multiple works.
No ambiguous work was accepted simply to suppress the placeholder. Some other
provider spellings also remain unmatched. Generic camera/title is the existing
unavailable-artwork presentation, not a downloaded cover. Local source-first,
alias, homonym, year and failure controls stay intact.

Classification remains verified on all3:43981 movies,9468 series,2034 channels;
Terror and UHD contain0 series in this source. True series and43933 preexisting
ordinary movie identities/references retain the audited lineage. No fresh
full playback/next-episode/next-channel physical PASS is asserted by this image
verification. Those remain separate from cover/catalog acceptance.

Git commit/push/deploy/merge=NO; main, prior receipts and Android historical
artifacts preserved. SOURCE-FORMAT-01 not started.
