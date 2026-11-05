# CANON-01-VERCEL-PREBUILT-RECOVERY-01 — L1 local evidence

Date2026-10-23. Executor: Codex, following explicit user L1 scope/adoption authorization. No Antigravity or external human action is fabricated.

Preflight initially stopped because3 scripts were already dirty. The latest user instruction explicitly authorizes autonomous provenance review and definition of the resumed initial state. Incoming diffs match only partial L1; author is unverified, bytes are preserved in ignored backups. The worktree remains on d8a7410 / fix/source-output-format-recovery.

Baseline3/3 exit0 in isolated exact committed copy with full local Git history and existing dependency junction:891 protected files,20 receipts,128 controls/23 suites and116 dedicated controls. No original script was overwritten to obtain baseline PASS. Full final13-command real-worktree validation is still PENDING.

The original candidate specification is preserved as a byte-identical prefix. Its broader verifier/workflow allowlist and historical placeholders are explicitly superseded by the10-path L1 addendum, before further script changes.

Authorization request SHA256: 65d5f1bc7871986f2f0db0faea569323be7f831dcb325070ff058299c456e89e. Encoding UTF-8/LF, no BOM; bytes between the fenced transcript markers below exactly reproduce AUTHORIZATION_REQUEST.txt. Hash is transcription provenance, not a claim of digital signature.

<!-- L1:AUTHORIZATION_REQUEST_BEGIN -->
```text
MENSAGEM PRINCIPAL DO USUÁRIO — transcrição normalizada para UTF-8/LF

CHAT MESTRE — EXECUÇÃO AUTÔNOMA RESTRITA / CANON-01-VERCEL-PREBUILT-RECOVERY-01 / L1

Você é o agente executor Antigravity. A autorização atual permite implementar autonomamente SOMENTE a subetapa local L1 e suas validações. Você pode investigar, diagnosticar, corrigir falhas e repetir testes sem pedir confirmação intermediária desde que não amplie escopo. Ao concluir ou encontrar conflito, PARAR e entregar relatório. Não executar qualquer etapa posterior de escrita automaticamente.

IDENTIDADE IMUTÁVEL
Workspace: C:\Xandeflix\xandeflix-prebuilt-c11-main
Repo: https://github.com/xandeflix2/xandeflix-prebuilt.git
Branch: fix/source-output-format-recovery
HEAD esperado: d8a74102124fbb8a3f013f6fd8a502519c1db4b8
Baseline: b3fc8d1e3844bc5601813ab1b298289af5b3f1fd
Gate pai: CANON-01 (emenda local L1)

1) PREFLIGHT GIT + BASELINE
Conferir pwd, top-level, origin, branch, SHA, git status completo, node 24, AGENTS.md, contratos canônicos e docs/architecture/VERCEL_PREBUILT_RECOVERY_01.md existente localmente. A única pendência inicial permitida é `?? docs/architecture/VERCEL_PREBUILT_RECOVERY_01.md`; se qualquer outra diferença, parar com BLOCKED_PREFLIGHT e não descartar nada. Rodar baseline `npm run canon:check`, `npm run canon:test`, `node scripts/test-vercel-prebuilt-contract.mjs`. Falha anterior ao patch => BLOCKED_BASELINE_REGRESSION.

2) ESPECIFICAÇÃO E PROVENIÊNCIA
Verificar que a especificação revisada está atualizada, que só esta emenda foi autorizada e que a cadeia de 20 emendas existentes é íntegra. Antes de alterar script, registrar escopo/casos/allowlist e transcrição auditável da autorização para SHA-256 real em UTF-8 LF. Não inventar authorizationRequestSha256.

3) PATCH CIRÚRGICO
Alterar SOMENTE a propriedade POLICY.ref em scripts/vercel-prebuilt-contract.mjs para `refs/heads/fix/source-output-format-recovery`. NÃO alterar receivedHead `a27d7cd4a74bd447221bba2851ee0af033d0a2fd`, baseline, projectId, teamId, preview, CLI 64.7.0, verificações OIDC, hash pinado do workflow ou controles de credenciais. Em scripts/test-vercel-prebuilt-contract.mjs adaptar positivos e acrescentar NEGATIVOS da branch antiga, main, evento != workflow_dispatch, SHA errado e workflowRef errado, mantendo todos os 116 controles existentes. Em scripts/test-canonical-regression.mjs atualizar só registro/testes da emenda com proteção, sem reduzir casos.

4) RECIBO E REGISTROS
Criar docs/governance/authorizations/CANON-01-VERCEL-PREBUILT-RECOVERY-01.json somente para a L1, com `status:APPROVED_BY_CHAT_MASTER`, `testChangesReviewed:true`, `gitCommitAuthorized:false`, `gitPushAuthorized:false`, `androidBuildAuthorized:false`, `supabaseWriteAuthorized:false`, `nextGateStarted:false`. Os grants before exatos são:
- scripts/vercel-prebuilt-contract.mjs => predecessor CANON-01-VERCEL-A22A, before 2a51da39ccb96da6253d0ecdc17de802764d39df;
- scripts/test-vercel-prebuilt-contract.mjs => predecessor CANON-01-A22A-WINDOWS-METADATA-EOL, before 3044824a5863e6f589a1919901a2d8eee990c5fc;
- scripts/test-canonical-regression.mjs => predecessor CANON-01-A22A-WINDOWS-METADATA-EOL, before d161c2db644cfa4678a3f39167de9e83793d70ec.
Calcular after com blobHash do verificador (LF). Anexar uma nova autorização ao fim de docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md, com hash real do recibo. Criar docs/evidence/CANON_01_VERCEL_PREBUILT_RECOVERY_01.md com evidência honesta; atualizar docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md SOMENTE append. Preservar docs/architecture/VERCEL_PREBUILT_RECOVERY_01.md já existente e não rastreado.

5) ALLOWLIST DEZ CAMINHOS (NÃO EXCEDER)
scripts/vercel-prebuilt-contract.mjs
scripts/test-vercel-prebuilt-contract.mjs
scripts/test-canonical-regression.mjs
docs/governance/authorizations/CANON-01-VERCEL-PREBUILT-RECOVERY-01.json
docs/evidence/CANON_01_VERCEL_PREBUILT_RECOVERY_01.md
docs/architecture/VERCEL_PREBUILT_RECOVERY_01.md
docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
docs/STATUS.md
docs/EVOLUTION_REPORT.md
docs/ERRORS_AND_BLOCKERS.md

Proibido tocar scripts/verify-canonical-contract.mjs, .github/workflows/, AGENTS.md, package.json, lock, .vercelignore, vercel.json, src/, android/, supabase/, histórico/recibos anteriores, secrets, outras branches e projetos externos. Se necessário => BLOCKED_SCOPE e reportar antes de alterar.

6) VALIDAÇÃO INTEGRAL
Executar, em sequência, e registrar EXIT CODE REAL de CADA comando:
1 npm run canon:check
2 npm run canon:test
3 npm run c11:new-device:lock
4 npm run typecheck
5 npm run update:check
6 npm run security:check
7 npm run playback:check
8 npm run build
9 npm run site:build
10 node scripts/test-site-build-contract.mjs
11 node scripts/test-vercel-artifact-contract.mjs
12 node scripts/verify-vercel-artifact.mjs inspect
13 node scripts/test-vercel-prebuilt-contract.mjs

Preservar no mínimo 891 arquivos protegidos, 128 controles CANON/23 suítes e 116 controles Prebuilt. Testar negativos novos; proibir skipped/pass fabricado. O status Git FINAL DEVE ser DIRTY, MAS EXCLUSIVAMENTE na allowlist, pois não há commit. Usar git diff --check e varredura de whitespace para novos untracked; hashes LF, prefixos append, nenhuma credencial e nenhuma mudança fora da allowlist. Se falhar por patch L1, corrigir autonomamente de forma mínima dentro da allowlist e repetir toda a validação. Até duas tentativas fundamentadas, depois BLOCKED_LOCAL_VALIDATION. Não executar `git reset` ou `git clean`.

7) RELATÓRIO E HARD STOP
Reportar baseline/preflight, diffs, allowlist, três predecessores/grants/hash SHA real, teste negativos antes/depois, lista dos 13 comandos com exit codes, estado do Git, riscos e próximos passos APENAS PROPOSTOS.
Esperado se tudo passar: PREFLIGHT=PASS; POLICY_REF=refs/heads/fix/source-output-format-recovery; POLICY_RECEIVED_HEAD_PRESERVED=SIM; WORKFLOW_UNCHANGED=SIM; VERIFIER_UNCHANGED=SIM; CANON_CHECK=PASS; CANON_TEST=PASS; A22_PREBUILT_CONTRACT=PASS; MANDATORY_COMMANDS=13/13_PASS; ALLOWLIST=PASS; DIFF_CHECK=PASS; RECEIPTS=21; WORKTREE=DIRTY_EXPECTED_ALLOWLIST_ONLY; REAL_PREBUILT_BUILD=NOT_RUN; REAL_ATTESTATION=NOT_RUN; REMOTE_WORKFLOW=BLOCKED_DEFAULT_BRANCH_REGISTRATION; GIT_ADD=NAO; GIT_COMMIT=NAO; GIT_PUSH=NAO; VERCEL_DEPLOY=NAO; MAIN_ALTERADA=NAO; NEXT_IMPLEMENTATION_STARTED=NAO; RESULT=L1_LOCAL_READY_FOR_CHAT_MASTER_REVIEW.

Se algo estiver bloqueado, retorne RESULT=BLOCKED_<CAUSA>, primeiro erro verdadeiro, última checagem PASS e caminho de correção sem operações proibidas. Não antecipar a etapa L2. Não reescrever histórico nem sobrescrever arquivos operacionais ou evidências.

8) ROTEIRO POSTERIOR — APENAS ANÁLISE E PLANO
Após L1, você PODE descrever propostas para revisão humana: C1 revisão de diff/recibo; L2 registro seguro workflow na main ou alternativa revisada; L3 build/atestação reais; L4 Preview pré-construído assinado; L5 testes funcionais/produção. NÃO pode implementá-las, criar push que dispara Vercel, autorizar credenciais, chamar workflow nem executar deploy. No final, PARAR.

ATUALIZAÇÃO EXPRESSA DO USUÁRIO — revisão autônoma do estado inicial

O CHAT MESTRE NAO TEM ACESSO DIRETO AOS ARQUIVOS COMO ESSE AGENTE TEM, SOMENTE AO REPOSITORIO NO GITHUB. ESSE AGENTE DEVE ASSUMIR AS CORREÇOES E MELHORIAS SEGUINDO OS CONTRATOS CANONICOS DE FORMA AUTONOMA SEM DEPENDER DO CHAT MESTRE. PROSSIGA COM A revisaão da proveniência e o diff dessas três modificações identificadas e defina o estado inicial para retomada. Depois disso, se necessário, execute baseline, L1 e as 13 validações. C1 e L2–L5 permanecem apenas planejados.
```
<!-- L1:AUTHORIZATION_REQUEST_END -->

Further tests/receipt/after hashes and real exit codes will be appended. REAL_PREBUILT_BUILD=NOT_RUN; REAL_ATTESTATION=NOT_RUN; REMOTE_WORKFLOW=BLOCKED_DEFAULT_BRANCH_REGISTRATION; GIT_ADD=NAO; GIT_COMMIT=NAO; GIT_PUSH=NAO; VERCEL_DEPLOY=NAO; NEXT_IMPLEMENTATION_STARTED=NAO.


## Receipt registration

- scripts/vercel-prebuilt-contract.mjs: predecessor CANON-01-VERCEL-A22A, before 2a51da39ccb96da6253d0ecdc17de802764d39df, after ac6e7a5876cbdf5cc31fffb447e4106edc82c570.
- scripts/test-vercel-prebuilt-contract.mjs: predecessor CANON-01-A22A-WINDOWS-METADATA-EOL, before 3044824a5863e6f589a1919901a2d8eee990c5fc, after cfe4779ec10005618831c5516bc178bbf875ece2.
- scripts/test-canonical-regression.mjs: predecessor CANON-01-A22A-WINDOWS-METADATA-EOL, before d161c2db644cfa4678a3f39167de9e83793d70ec, after 8eac191359942b8cb8e5f4838cbfca55b299bf14.

Receipt LF blob 9cb685590481ba094ffbca2e2abe2f585aa3ae46; SHA256 f0a49ca75427803a1c8842c47b84910a47cb3417d3efc6e798aa5b0d207c6832. Grant scope is exactly3 scripts; verifier/workflow grants are absent.


## CANON-01-VERCEL-PREBUILT-RECOVERY-01 — conclusão local L1 — 2026-10-23

RESULT=L1_LOCAL_READY_FOR_CHAT_MASTER_REVIEW. Treze comandos executados em sequência na árvore real, todos exit0 na primeira tentativa completa. Baseline separado3/3 exit0 no HEAD comprometido. Canonical135 controles/23 suítes, preservados nominalmente todos128 controles anteriores e todas23 suítes; Prebuilt127 controles, preservadas as linhas de teste dos116 anteriores.891 arquivos protegidos;21 recibos totais,20 anteriores byte a byte preservados. Somente POLICY.ref muda na implementação; receivedHead/baseline/projeto/equipe/preview/CLI/pin/OIDC/credenciais permanecem.

Allowlist exatamente10 caminhos, index vazio, HEAD/branch/main inalterados. Especificação original e4 documentos normativos preservam prefixos de bytes. git diff --check PASS;0 whitespace inesperado nos untracked,10 hard breaks Markdown preservados. A primeira varredura auxiliar sinalizou2 literais de credenciais sintéticas de testes negativos preexistentes; conferência contra HEAD comprovou identidade exata, mantidos os testes e classificadas as fixtures explicitamente.0 padrão de credencial privada nova identificado. Não houve falha de comando oficial, ajuste de timeout/assertion ou segunda tentativa.

Auth SHA256 65d5f1bc7871986f2f0db0faea569323be7f831dcb325070ff058299c456e89e; recibo blobLF 9cb685590481ba094ffbca2e2abe2f585aa3ae46; recibo SHA256 f0a49ca75427803a1c8842c47b84910a47cb3417d3efc6e798aa5b0d207c6832. Transcrição completa está na evidência e reproduz os bytes normalizados. Isso não é assinatura humana criptográfica. Logs/diff/hashes em tmp/canon-01-vercel-prebuilt-recovery-01-l1-20261023. Nenhum Git add/commit/push/merge/PR, workflow remoto, Prebuilt real, atestação real, deploy, build Android, mudança de versão, dado ou Supabase. C1/L2–L5 permanecem apenas planejados.


### Comandos oficiais na árvore real

| Nº | Comando | Exit code |
| --- | --- | --- |
| 1 | `npm run canon:check` | 0 |
| 2 | `npm run canon:test` | 0 |
| 3 | `npm run c11:new-device:lock` | 0 |
| 4 | `npm run typecheck` | 0 |
| 5 | `npm run update:check` | 0 |
| 6 | `npm run security:check` | 0 |
| 7 | `npm run playback:check` | 0 |
| 8 | `npm run build` | 0 |
| 9 | `npm run site:build` | 0 |
| 10 | `node scripts/test-site-build-contract.mjs` | 0 |
| 11 | `node scripts/test-vercel-artifact-contract.mjs` | 0 |
| 12 | `node scripts/verify-vercel-artifact.mjs inspect` | 0 |
| 13 | `node scripts/test-vercel-prebuilt-contract.mjs` | 0 |

### Grants efetivos (Git blob normalizado LF)

| Arquivo | Predecessor | Before | After |
| --- | --- | --- | --- |
| `scripts/vercel-prebuilt-contract.mjs` | `CANON-01-VERCEL-A22A` | `2a51da39ccb96da6253d0ecdc17de802764d39df` | `ac6e7a5876cbdf5cc31fffb447e4106edc82c570` |
| `scripts/test-vercel-prebuilt-contract.mjs` | `CANON-01-A22A-WINDOWS-METADATA-EOL` | `3044824a5863e6f589a1919901a2d8eee990c5fc` | `cfe4779ec10005618831c5516bc178bbf875ece2` |
| `scripts/test-canonical-regression.mjs` | `CANON-01-A22A-WINDOWS-METADATA-EOL` | `d161c2db644cfa4678a3f39167de9e83793d70ec` | `8eac191359942b8cb8e5f4838cbfca55b299bf14` |


### C1 e L2–L5: propostas, nenhuma implementação

C1: revisar este diff, transcrição, grants, prefixos e logs; qualquer decisão de Git/publicação é separada. Um push pode disparar as integrações Vercel existentes, por isso não foi feito nem há aprovação implícita.

L2: avaliar registro mínimo e revisado do workflow manual na branch padrão ou alternativa formalmente aprovada, sem trocar por evento privilegiado automático, relaxar o pin ou divergir SHA/ref/source/workflow. A documentação oficial exige o workflow na branch padrão para dispatch: [GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow). A árvore local de main será conferida somente por leitura; nenhum dispatch ou escrita remota foi tentado nesta L1.

L3: quando houver escopo próprio, executar build-only com histórico completo, projeto/equipe Preview fixados, CLI64.7.0 e verificações existentes. Confirmar output real, pacote e assinatura GitHub verdadeira. A documentação recomenda preparar settings/ambiente com pull, atualmente vedado; a compatibilidade offline continua não testada, sem permissão para baixar credenciais: [Vercel build](https://vercel.com/docs/cli/build). Fixtures locais não substituem esse teste.

L4: apenas após autorização independente, verificar assinatura/contexto/digest, extrair TAR com proteção de caminhos/links e validar output antes de qualquer Preview. A documentação atual descreve --archive como modo de compressão (por exemplo tgz), não como caminho do TAR de atestação; não generalizar o texto candidato antigo como ausência universal dessa opção. A CLI pinada não foi executada para verificar essa opção nesta L1: [Vercel deploy](https://vercel.com/docs/cli/deploy). Nenhum deploy foi realizado.

L5: homologar rotas, autenticação, controle de acesso, playback e recuperação no ambiente futuramente autorizado; produção/main/rollback exigem decisão própria. Dispositivos foram informados como conectados pelo usuário; não houve ADB, instalação ou teste físico nesta emenda de governança. Android/Supabase permanecem fora do escopo.
