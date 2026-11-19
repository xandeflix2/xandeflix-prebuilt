# CANON-01 A2.2A - local build-only implementation

GATE=CANON-01-VERCEL-A22A
IMPLEMENTATION=LOCAL_ONLY
REAL_GITHUB_ATTESTATION=PENDING_REMOTE_EXECUTION
GIT_COMMIT=NAO
GIT_PUSH=NAO
VERCEL_DEPLOY=NAO

Specification and closed allowlist were appended to the phased architecture
before code. Historical baseline tests passed (115 controls, 13 suites).
This new manual workflow has separate build and signing jobs. Only an actual
pinned CLI build may supply .vercel/output. The signing job invokes the real
GitHub cryptographic verifier and checks certificate-bound identity, run and
artifact bytes; local policy fixtures cannot grant trust or publication.

Current public repository allows native GitHub attestations. VERCEL_BUILD_READ_TOKEN
is not configured among repository secret names and no VERCEL_TOKEN exists in
the local process. No credential was requested, printed or created. Local CLI
64.7.0 help and bundled route compiler were inspected, without project API
access, environment pull, real CLI build or any deployment. Compiler-only proof
is not a real Prebuilt artifact. Full validation results will be appended.

The workflow needs later publication/default-branch registration and explicit
remote execution approval. This stage does not make Preview available.
CHAT_MASTER_REVIEW=PENDING

## Final local validation - 2026-10-20

All 13 mandatory commands completed with exit code 0 after the local syntax correction. npm ci also exited 0.

| Command | Result | Exit code |
| --- | --- | --- |
| `npm run canon:check` | PASS | 0 |
| `npm run canon:test` | PASS | 0 |
| `npm run c11:new-device:lock` | PASS | 0 |
| `npm run typecheck` | PASS | 0 |
| `npm run update:check` | PASS | 0 |
| `npm run security:check` | PASS | 0 |
| `npm run playback:check` | PASS | 0 |
| `npm run build` | PASS | 0 |
| `npm run site:build` | PASS | 0 |
| `node scripts/test-site-build-contract.mjs` | PASS | 0 |
| `node scripts/test-vercel-artifact-contract.mjs` | PASS | 0 |
| `node scripts/verify-vercel-artifact.mjs inspect` | PASS | 0 |
| `node scripts/test-vercel-prebuilt-contract.mjs` | PASS | 0 |

Canonical regression: 125 controls / 14 suites. Dedicated A22 contract: 109 checks. Existing 115 controls / 13 suites preserved.
140 Android artifacts and five previous governance receipts matched their received hashes. All four document prefixes preserved; no change outside the eleven-path allowlist.
Real CLI output and real native GitHub attestation have not been generated in this local-only stage; .vercel/output is absent. Invalid-bundle rejection invoked the actual gh CLI; this is not a successful signed-provenance test.

References: [Vercel build](https://vercel.com/docs/cli/build), [Build Output API](https://vercel.com/docs/build-output-api/configuration), [GitHub signature verification](https://cli.github.com/manual/gh_attestation_verify), [manual workflow prerequisite](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

Residual trust: review and branch protection remain external requirements. The signed manifest binds reviewed project/Preview identity and bytes to the workflow; verification.json alone is not a trust anchor. Reproducible TAR packaging does not claim reproducible builds across runs. External builder resolution and the complete real output shape require remote validation; unknown output fields fail closed. No cross-platform native or physical homologation is inferred.

A22A_LOCAL_IMPLEMENTATION=PASS
CANONICAL_CHECK=PASS
CANONICAL_REGRESSION=PASS
ATTESTED_BUILD_DESIGN=PASS
REAL_PREBUILT_OUTPUT=PENDING_REMOTE_EXECUTION
REAL_GITHUB_ATTESTATION=PENDING_REMOTE_EXECUTION
GIT_COMMIT=NAO
GIT_PUSH=NAO
VERCEL_DEPLOY=NAO
CHAT_MASTER_REVIEW=PENDING

## A2.2A-R1 - local compatibility amendment - 2026-10-20
Reviewed actions/attest@v4 requires artifact-metadata: write in attest job.
Pinned vercel build target changed to --target=preview; no --prod/deploy.
Offline .vercel/.env.preview.local is blocked: cannot persist potentially private Preview variables under this authorization.
No vercel pull/env pull; actual CLI Preview build remains unproven and potentially blocked without an approved credential-safe configuration mechanism.
GitHub workflow_dispatch still needs default-branch registration; main unchanged and remote execution not authorized.
A2.2A-R1: local corrective implementation only. Existing receipts unchanged; new A22 receipt and registry rehashed.
