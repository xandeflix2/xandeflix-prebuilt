# CANON-01-A22A-WINDOWS-EOL

Authorization: explicit autonomous user instruction, request SHA-256 recorded in the new receipt. Historical receipts remain byte-identical.

Confirmed failure: applying LF-to-CRLF conversion to an already CRLF workflow produces CRCRLF and A22_WORKFLOW_CHANGED. The fixture now normalizes CRLF to LF first. Exact workflow hash verification is unchanged.

Five added checks cover LF, existing CRLF, mixed line endings, idempotence and rejection of malformed CRCRLF. No existing control or negative is removed. The canonical runner changes only the synthetic future amendment list.

Pre-edit canonical checks, 128 controls/14 suites and C11 passed. Post-edit results are recorded under tmp/codex-source-recovery and must be consulted before any publication. Remote Windows CI remains failed at the received HEAD until an actual new job completes.

## Local validation completed - 2026-10-20

All nine official commands passed with exit 0. Canonical regression: 128 controls / 14 suites. Dedicated A22 contract: 116 controls (111 preserved plus five EOL cases). Seven synthetic source/catalog suites passed. Remote Windows CI remains unverified for this local correction; no push/deploy was performed. Logs: tmp/codex-source-recovery/apk-test-20261020/.
