# CANON-01 — A2.1 local-only artifact contract

GATE=CANON-01-VERCEL-A2-ARTIFACT
IMPLEMENTATION=LOCAL_ONLY
EXPECTED_HEAD=f96a4b615d7877211f0341bd89bdbc29e64a5c66

Files and identity are checked using SHA-256, strict paths, exact expected project/run/env, and mandatory HTTP route and security header checks.
The verifier cannot authorize publication: its exported authorizePublication() always fails with A2_REMOTE_ATTESTATION_AND_APPROVAL_NOT_IMPLEMENTED. No untrusted manifest is a substitute for authenticated remote evidence.
New synthetic test suite does not request network, alter backend, or perform publication. All existing controls preserved subject to actual commands run by the operator.
No real .vercel/output built or verified. Future A2.2 must implement trusted remote verification, artifact build, and Preview publication independently.
No historical receipt, .github workflow, package.json, vercel.json, .vercelignore, Android file or Supabase migration modified.
This report describes the local implementation procedure, not a claimed PASS until operator executes the tests.
