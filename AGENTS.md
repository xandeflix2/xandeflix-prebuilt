# AGENTS.md — Regras Obrigatorias para Agentes e Modelos

> **IMPORTANTE**: Este documento e a porta de entrada obrigatoria para qualquer agente ou modelo que atuar no repositorio `XANDEFLIX_PREBUILT`. Nenhuma modificacao pode ser feita sem o cumprimento estrito das diretrizes abaixo.

---

## 1. Identidade Canonica do Repositorio

- **PROJECT**: `XANDEFLIX_PREBUILT`
- **LOCAL_WORKSPACE**: `C:\Xandeflix\xandeflix-prebuilt`
- **EXPECTED_GIT_REPOSITORY**: `xandeflix2/xandeflix-prebuilt`
- **EXPECTED_REMOTE_ORIGIN**: `https://github.com/xandeflix2/xandeflix-prebuilt.git`
- **EXPECTED_BRANCH**: `main`
- **NEW_SUPABASE_PROJECT_NAME**: `Xandeflix Prebuilt`
- **NEW_SUPABASE_PROJECT_REF**: `cujbmyhitgomlgwfkaat`
- **NEW_SUPABASE_REGION**: `us-east-2`
- **NEW_SUPABASE_GITHUB_REPOSITORY**: `xandeflix2/xandeflix-prebuilt`
- **ANDROID_PACKAGE_ID**: `com.xandeflix.prebuilt`

---

## 2. Protecao Rigorosa contra Colisao de Projetos

O repositorio do projeto original e protegido contra qualquer escrita ou interferencia:
- **Projeto Protegido**: `Xandeflix 2.0`
- **Repositorio Protegido**: `timbocorrea/xandeflix-2.0`
- **Package Protegido**: `com.xandeflix.app`

Regra: Qualquer deteccao de apontamento de remote, branch, credencial, worktree ou cherry-pick referente a `timbocorrea/xandeflix-2.0` exige parada imediata (`STOP_ON_CONFLICT=SIM`) e resultado `HARD_STOP_PREBUILT_G0_ORIGINAL_REPOSITORY_COLLISION`.

---

## 3. Preflight Obrigatorio (Read-Only)

Antes de iniciar qualquer edicao no workspace, o agente DEVE executar e registrar em memoria/relatorio:
1. Confirmar workspace (`pwd` ou `Get-Location`);
2. Confirmar top-level (`git rev-parse --show-toplevel`);
3. Confirmar remote (`git remote -v`);
4. Confirmar branch atual (`git branch --show-current`);
5. Confirmar HEAD (`git rev-parse HEAD 2>&1`);
6. Confirmar status Git (`git status --short --branch`);
7. Ler `AGENTS.md`;
8. Ler [Architecture Contract](file:///c:/Xandeflix/xandeflix-prebuilt/docs/architecture/XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md);
9. Ler [Execution Contract](file:///c:/Xandeflix/xandeflix-prebuilt/docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md);
10. Identificar Gate ativo autorizado pelo Chat Mestre;
11. Confirmar a allowlist estrita do Gate ativo;
12. Confirmar se operacoes Git (commit/push/PR) foram explicitamente autorizadas (padrao: NAO autorizadas);
13. Confirmar provenance de arquivos e regras;
14. Parar imediatamente em caso de inconsistencia ou conflito.

---

## 4. Regras Normativas de Execucao

- `ONE_GATE_AT_A_TIME=REQUIRED`: O agente deve focar exclusivamente no Gate ativo autorizado. E proibido antecipar o proximo Gate.
- `SPEC_BEFORE_CODE=REQUIRED`: A especificacao, contratos e criterios de aceitacao precedem qualquer codigo funcional.
- `PATCH_MINIMO=REQUIRED`: Implementar apenas as alteracoes estritamente necessarias e autorizadas para o escopo vigente.
- `NO_UNPLANNED_REFACTOR=SIM`: Nao refatorar codigo ou estrutura documental fora do escopo aprovado.
- `NO_CHAT_AS_TRUTH=SIM`: O historico de conversa ou afirmacoes em chat nao sobrepoem os documentos canonicos do repositorio.
- `NO_SECRET_CONTEXT=REQUIRED`: Segredos, senhas reais, chaves privadas ou tokens de longa duracao sao estritamente proibidos de trafegar em commits, docs ou logs.
- `NO_AUTOMATIC_COMMIT=SIM`: Nenhum commit deve ser gerado sem autorizacao expressa e nominal do Chat Mestre (`GIT_COMMIT_AUTHORIZED=SIM`).
- `NO_AUTOMATIC_PUSH=SIM`: Nenhum push deve ser disparado sem autorizacao expressa e nominal do Chat Mestre (`GIT_PUSH_AUTHORIZED=SIM`).
- `NO_AUTOMATIC_PR=SIM`: Nenhum pull request deve ser aberto sem autorizacao expressa do Chat Mestre.
- `STOP_ON_CONFLICT=SIM`: Em qualquer desvio, quebra de contrato, colisoes ou ambiguidade, cessar execucao e reportar ao Chat Mestre.
- `EVIDENCE_IS_NOT_REQUIREMENT=SIM`: Evidencia e registro observacional; nao deve ser confundida com requisito funcional nem forcar SLAs prematuros.
- `LOCAL_PATCH_PROVENANCE=REQUIRED`: Toda alteracao local deve ter proveniencia clara e rastreavel.
- `LATEST_REGRESSION_WINS=SIM`: Qualquer regressao identificada em teste ou auditoria anula afirmacoes anteriores de sucesso.
- `PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM`: Medicoes preliminares de performance sao apenas dados empiricos, nao SLAs contratuais do produto.
- `NEXT_GATE_STARTED=NAO`: Ao final de cada ciclo, o proximo Gate NUNCA deve ser iniciado pelo executor sem autorizacao expressa do Chat Mestre.
