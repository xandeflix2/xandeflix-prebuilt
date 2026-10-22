# CANON-01-XUI-OPAQUE-RECOVERY - local recovery evidence

Specification and exact scope preceded code: ../architecture/XUI_OPAQUE_M3U_RECOVERY.md.
Authorization is the explicit autonomous user recovery request, not a new
conversational approval. Existing receipt schema status is retained literally;
authorizationOrigin records the actual provenance. No previous receipt changed.

Confirmed root reproduction: actual M3U has opaque /play links and xui-id.
Read-only tablet parsing: 270261 classified episode records; 46145 unresolved
records; zero classified movies/Live. Readable active manifest: 9496 series,
zero movies/Live. Same-source authenticated category API samples confirm exact
numeric identity and category membership. Full VOD list exceeds 16 MiB; the
cap stays enforced. Phone/Fire inventories remain older directory generations.
All private URLs/credentials remain transient on the device, never in evidence.

Synthetic regression first failed with [movies,live,episodes]=[0,0,1]. The
minimal resolver changes this to [1,1,1] while preserving URLs, artwork, IDs,
series relations and candidate-only staging. Unsupported/ambiguous/auth/size
failures reject the candidate. Additional tests cover HLS/MPEGTS, Unicode,
late failure, cache bounds, digest recovery, inventory continuity and native
failure reporting. Existing 128 controls/16 suites are retained; suite 17 added.

Evidence and final exit codes: ignored tmp/codex-source-recovery/xui-recovery-20261021.
Read-only physical aggregates: ignored tmp/codex-source-recovery/physical-catalog-20261021.
Actual installed-app recovery, artwork and licensed playback are PENDING until
the new test APK is installed and refreshed by the user. Dry-read classification
is distinct from promotion, playback and physical homologation. No install,
reset, backend writes, publication or next Gate is performed by this patch.


## Evidence refinement before final acceptance - 2026-10-21

Complete attachment/API membership comparison found 178 episode-shaped records in six groups absent from Live/VOD category APIs, plus a small number of unmatched IDs. These were already unresolved by the legacy classifier; adding series roots would change established ordinal IDs and is outside this patch. Preserve them as unresolved with exact rawUnresolvedCount, rather than fabricate a type or block every confirmed channel/movie. A complete M3U with explicitly unclassified records retains the existing normalization contract; it is distinct from an incomplete download or failed metadata request. Missing exact category/ID returns no kind; ambiguous type, invalid IDs/metadata, auth, transport or bounds failures still reject the candidate and preserve active state. This refines item 2 above only for a successful authoritative lookup with no membership. Positives/negatives must distinguish legitimate absence from unavailable/invalid data, and report the unresolved total. No expansion of episode parsing or content IDs.


## Complete physical dry-read validation - 2026-10-21

Actual new resolver/parser/classifier code ran in tablet WebView with device-direct metadata, no staging or promotion. Read 95,258,686 bytes / 316,406 valid records, one malformed EXTINF header. Confirmed 43,933 movies, 2,034 Live channels and the same 270,261 episode records, with 178 unresolved records; all 81 metadata requests completed. Active pointer stayed byte-identical. Remaining records use four-digit episode numbers beyond the existing title-parser bound; do not relabel as movies/Live. Expanding episode parsing/IDs is not implemented in this amendment. Counts describe that observation, not an SLA or proof of installed-app restoration/playback. The user attachment and provider API can change independently; older attached rows missing membership remain unresolved.
