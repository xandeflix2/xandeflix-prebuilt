# CANON-01-A22A-WINDOWS-METADATA-EOL

Authorization: explicit autonomous user instruction for Windows CI correction on branch fix/source-output-format-recovery, request SHA-256 c52e07473b77bd9ad4ac174203c6104cb33e3f14a3ca074c763773cc5fa8dad7 recorded in the new receipt. Historical receipts remain byte-identical.

Confirmed failure: GitHub Actions Windows runners checkout .github/workflows/vercel-prebuilt-attested.yml with CRLF (\r\n). The test ATTEST_ARTIFACT_METADATA_PERMISSION in scripts/test-vercel-prebuilt-contract.mjs asserted /      attestations: write\n      artifact-metadata: write\n/ directly against raw workflow string, failing on Windows despite Linux jobs passing and despite lfWorkflow already normalizing EOL in the same file.

Minimal correction: scripts/test-vercel-prebuilt-contract.mjs now asserts ATTEST_ARTIFACT_METADATA_PERMISSION against lfWorkflow instead of raw workflow. All permissions requirements, cryptographic checks and negative controls are preserved without modification.

Chaining: supersedes scripts/test-vercel-prebuilt-contract.mjs from CANON-01-A22A-WINDOWS-EOL and scripts/test-canonical-regression.mjs from CANON-01-TV-SIDEBAR-COMPOSITION.

All 19 historical/prior receipts, 128 canonical controls / 23 suites and 116 dedicated prebuilt controls are preserved. No Android, runtime, backend, workflow or production change. No commit, push or PR automatically generated.
