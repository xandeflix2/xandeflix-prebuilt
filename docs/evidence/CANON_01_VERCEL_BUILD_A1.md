# CANON-01 — Vercel Build A1

RESULT=PASS exclusivamente para implementacao e validacao locais. O novo workflow nao foi publicado nem executado no GitHub. As duas variaveis publicas de build ainda precisam de configuracao autorizada antes da publicacao; os deployments Vercel existentes permanecem fora da implementacao A1.

## Autorizacao e preflight

- Anexo: CHAT MESTRE — CANON-01 VERCEL BUILD VALIDATION.
- SHA-256 da autorizacao: `89fa9dbf8a83b6662c0ef4e5d5de4cdc36930e9cd0a0b2558538bfb4b49b1b86`.
- Workspace: `C:/Xandeflix/xandeflix-prebuilt-c11-main`.
- Origin: `https://github.com/xandeflix2/xandeflix-prebuilt.git`.
- Branch: `governance/canon-01-hardening`.
- HEAD recebido e preservado: `3a418ac42bf0794624efc9aef2d41e5f6162fa71`. Main: `b3fc8d1e3844bc5601813ab1b298289af5b3f1fd`.
- Arvore/index inicialmente limpos; PR #1 OPEN_DRAFT; CI canonico Windows/Linux PASS no SHA recebido.
- Pre-validacao antes do patch: canon:check, canon:test (95 controles/11 suites) e C11 lock, todos exit0.
- Inventario anterior: 1278 arquivos rastreados, 28 revisados e 140 artefatos Android.
- Especificacao/allowlist registradas no contrato de expansao antes do codigo.

## Implementacao e seguranca

Workflow independente em push e pull_request, matriz ubuntu-latest/windows-latest, Node24, fetch-depth0, persist-credentials:false e contents:read. Mesmos SHAs oficiais revisados de checkout/setup-node do workflow canonico, confirmados por consultas de leitura aos repositorios oficiais.

Etapas reais e bloqueantes: npm ci, canon:check, canon:test, C11 lock, typecheck e site:build. Canon:test executa tambem o contrato dedicado como 12a suite. Nao ha token Vercel, secrets, deploy, API de publicacao, upload de artefato, release, workflow reutilizavel, condicao de skip ou continue-on-error.

O contrato compara o conteudo integral aprovado do workflow, normalizando apenas CRLF/LF. Hashes autorizados nao bastam para inserir deploy: um negativo verifica rejeicao mesmo com grant sintetico encadeado de hash correspondente. Fixtures sinteticas sao negativas/controles do verificador real; nao substituem as execucoes oficiais de build ou autorizacoes reais.

O workflow recebe somente vars.VITE_SUPABASE_URL e vars.VITE_SUPABASE_PUBLISHABLE_KEY no passo site:build. Sao parametros intencionalmente publicos do cliente, sem valores no patch e sem references secrets. A configuracao existente continua exigindo URL canonica e chave publicavel; nao foi criada chave ficticia nem fallback para tornar CI verde.

Consulta apenas dos nomes no GitHub retornou zero repository vars e zero secrets. .env.example contem placeholder e nao foi usado como configuracao real. Nenhum valor local foi copiado, nenhuma variavel/secret foi cadastrado. Sem essas duas vars, o build remoto deve falhar. PASS local nao demonstra PASS remoto nem paridade de configuracao.

canonical-regression.yml, package.json, vercel.json e .vercelignore permanecem byte a byte iguais. G10FIX, LEGACYTESTS e AUTHORIZATION-HARDENING nao foram editados. O novo recibo tem grants exatos e supersedes para os dois scripts de governanca.

Protecao local nao substitui revisao independente e protecao da main contra reescrita coordenada de codigo, recibos e CI. Nenhuma protecao remota foi alterada.

## Validacoes finais na arvore real

| Comando | Resultado | Exit code |
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

- Regressao final: 108 controles e 12 suites; os95 nomes anteriores e as11 suites anteriores preservados em ordem, com seus arquivos intactos.
- Teste dedicado: 32 controles. Inclui checks removidos, shallow checkout, persistencia de credencial, secrets, chave falsa, config ausente, deploy/API, skip, permissoes de escrita, PR target, action nao revisada, plataformas/Node, mutacao silenciosa, recibos adulterados e contexto/baseline Git indisponiveis.
- Fixtures Git negativas sao diretorios temporarios isolados, sem commit, fake baseline ou rede; limpeza verifica o caminho antes de remover.
- Desenvolvimento: a primeira fixture de baseline ausente falhou com CANON_WORKSPACE_MISMATCH (exit1), pois TEMP usava alias Windows8.3. Apenas a fixture foi corrigida com realpathSync.native; o checker permaneceu intacto nesse ajuste. As execucoes finais passaram.
- Builds web reais executados; avisos Vite de externalizacao de modulos Node/tamanho de chunks nao foram contornados nem exigiram mudanca de runtime. Nenhuma nova homologacao fisica.

## Allowlist exata da emenda

1. `.github/workflows/site-build-validation.yml`
2. `scripts/test-site-build-contract.mjs`
3. `docs/governance/authorizations/CANON-01-VERCEL-BUILD-A1.json`
4. `docs/evidence/CANON_01_VERCEL_BUILD_A1.md`
5. `scripts/verify-canonical-contract.mjs`
6. `scripts/test-canonical-regression.mjs`
7. `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md`
8. `docs/STATUS.md`
9. `docs/EVOLUTION_REPORT.md`
10. `docs/ERRORS_AND_BLOCKERS.md`

Apenas os dois scripts de governanca e os quatro documentos append-only ja existiam. Os quatro demais arquivos sao novos. Nenhuma alteracao de produto, workflow canonico, Android, Supabase, schemas, fixtures, hooks ou configuracoes Vercel foi autorizada/aplicada.

## Recibo e hashes

Novo recibo: `docs/governance/authorizations/CANON-01-VERCEL-BUILD-A1.json`. SHA-256: `223152dea7a522269d6d2c7d18ed6531b538d5d7bd264f3d3f2caffd3a87497b`.
Os before abaixo sao os after do recibo AUTHORIZATION-HARDENING; supersedes nomeia esse predecessor sem reescrever seu recibo.

| Arquivo concedido | Before (Git blob LF) | After (Git blob LF) |
| --- | --- | --- |
| `scripts/verify-canonical-contract.mjs` | `04e8825fa9f34f392d9844f72b750ea92bb25be1` | `bf99d655897772c04635a7624fb5dbdbb4c57c54` |
| `scripts/test-canonical-regression.mjs` | `144fb238f5dee26d10b43e19cb36a7c865a7a045` | `ab9c771133c84282bbf9c7a7d2091e5d0dd0f1a6` |
| `.github/workflows/site-build-validation.yml` | `null` | `a05751fb8e3d0d9a8bad7615d7a3f1be9b66228c` |
| `scripts/test-site-build-contract.mjs` | `null` | `b9b51c29cbadefb07525cb75d652cea80d8bb57c` |

| Recibo historico preservado | SHA-256 |
| --- | --- |
| `docs/governance/CANON_CHANGE_AUTHORIZATION.json` | `9a8d750edc932cb7f97fda0129b368c5cac728273f34c4402be739abb08c64cf` |
| `docs/governance/CANON_01_LEGACY_TESTS_AUTHORIZATION.json` | `805381b1f66ea46175398a7dd9d7ed8acad758477f5bb93e29e6238875cfa6a1` |
| `docs/governance/CANON_01_AUTHORIZATION_HARDENING.json` | `e063db3469b1913ae496bfa94d0e71a4d72b062246aafa34143b7e82d32aed59` |

## Auditoria e evidencias locais

Inventarios, resultados e logs em `tmp/canon-01-vercel-build-a1/`, ignorado pelo Git. Diff integral: full.diff; auditoria de integridade e hashes finais: integrity.json; resultados: local-results.json; logs finais: local-01.log ate local-10.log. A primeira rodada aprovada foi preservada separadamente antes do ajuste de referencias publicas.

Auditoria final confirma os10 caminhos exatos, prefixos append-only integrais, 1272 rastreados anteriores inalterados,22 dos28 revisados byte a byte iguais (6 alterados sob autorizacao),140 artefatos Android intactos, recibos/index/HEAD/main preservados e ausencia de credenciais no diff. Android permanece1.0.37/code37, package com.xandeflix.prebuilt.

## Pendencias e plano A2 — nao iniciado

1. Revisao expressa do Chat Mestre desta A1 e autorizacao separada para commit/push. Novo workflow remoto ainda NOT_RUN; CI antigo PASS nao certifica o patch local.
2. Autorizar o cadastro/revisao das duas vars publicas de build, sem secrets, antes de publicar o workflow; depois confirmar os jobs Windows/Linux reais.
3. Em A2, definir projeto/equipe/ambiente, protecao da main e revisores; vincular SHA/tree/baseline/resultados/configuracao ao artefato verificado e rejeitar origem/digest/destino divergentes.
4. Somente com nova autorizacao implementar publicacao prebuilt, teste das rotas/headers, producao staged sem dominios, promocao e rollback. Nenhum workflow de publicacao foi criado em A1.
5. Preservar PR Draft, os dois projetos/status Vercel e SOURCE-FORMAT-01 pendente. Nenhuma publicacao, merge, dados ou nova homologacao fisica nesta entrega.

## Flags finais locais

```text
GATE=CANON-01
AMENDMENT=CANON-01-VERCEL-BUILD-A1
RESULT=PASS
CANONICAL_CHECK=PASS
CANONICAL_TEST=PASS
SITE_BUILD=PASS
NEW_BUILD_CONTRACT=PASS
PREVIOUS_95_CONTROLS_PRESERVED=SIM
PREVIOUS_11_SUITES_PRESERVED=SIM
NEW_WORKFLOW_CREATED=SIM
VERCEL_PUBLISH_WORKFLOW_CREATED=NAO
GIT_COMMIT=NAO
GIT_PUSH=NAO
MAIN_CHANGED=NAO
PR_DRAFT_PRESERVED=SIM
VERCEL_CHANGED=NAO
ANDROID_VERSION_CHANGED=NAO
SUPABASE_CHANGED=NAO
SOURCE_FORMAT_01_STARTED=NAO
CHAT_MASTER_REVIEW=PENDING
REMOTE_NEW_WORKFLOW=NOT_RUN
```

Aguardar revisao antes de publicar.
