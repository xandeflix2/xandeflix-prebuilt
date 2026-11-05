# VERCEL-PREBUILT-RECOVERY-01 — Especificação Técnica (SPEC-BEFORE-CODE)

**Status:** ESPECIFICAÇÃO_FINALIZADA — AGUARDANDO_REVISÃO_DO_CHAT_MESTRE  
**Gate Pai:** `CANON-01`  
**Emenda Candidata:** `CANON-01-VERCEL-PREBUILT-RECOVERY-01`  
**Branch Obrigatória:** `fix/source-output-format-recovery`  
**HEAD de Referência:** `d8a74102124fbb8a3f013f6fd8a502519c1db4b8`  
**Baseline Git Canônica:** `b3fc8d1e3844bc5601813ab1b298289af5b3f1fd`  
**Âncora Histórica (POLICY.receivedHead):** `a27d7cd4a74bd447221bba2851ee0af033d0a2fd`  
**Projeto:** `XANDEFLIX_PREBUILT`  
**Data:** 2026-10-22  

---

## 1. Identidade e Diagnóstico Técnico da Causa-Raiz

### 1.1. Identidade Exata do Projeto Vercel (Control Plane)
O projeto no Control Plane da Vercel foi auditado em conformidade estrita com o Contrato A22A ([scripts/vercel-prebuilt-contract.mjs](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/scripts/vercel-prebuilt-contract.mjs)) e possui os seguintes metadados canônicos imutáveis:

- **Project ID:** `prj_OJcEZDNVPI3NV8Z1GfHOB02v20TF`
- **Project Name:** `xandeflix-prebuilt-nm3x`
- **Team ID (Account ID):** `team_gHZGQz2zRhEWsyK2jfOLLD5t`
- **Owner Slug:** `xandeflix2`
- **Git Link:** `xandeflix2/xandeflix-prebuilt` (tipo `github`)
- **Framework Preset:** `vite`
- **Node.js Runtime:** `24.x`
- **Root Directory:** `null` ou `""` (string vazia). O contrato de [scripts/vercel-prebuilt-contract.mjs](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/scripts/vercel-prebuilt-contract.mjs#L80) valida exclusivamente `project.rootDirectory === null || project.rootDirectory === ''` e sanitiza para `rootDirectory: null`. A especificação de `'./'` é inválida e é sumariamente rejeitada pelo verificador com o erro `A22_PROJECT_SETTINGS_MISMATCH`.
- **Build Command:** `npm run site:build` (ou `null`)
- **Install Command:** `npm ci` (ou `null`)
- **Output Directory:** `tmp/c154-web-production/site` (ou `null`)

---

### 1.2. Triangulação Factual: Causa Comprovada, Bloqueio Confirmado e Hipótese Não Testada

Para evitar diagnósticos imprecisos ou conclusões precipitadas, a arquitetura distingue formalmente entre fato comprovado por código/teste, bloqueio comprovado de plataforma e hipótese técnica ainda não testada empiricamente:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ A. CAUSA COMPROVADA: CANON_GIT_OR_BASELINE_UNAVAILABLE                           │
│ - Erro canônico originado em verifyCanonical e collectSnapshot                   │
│ - Comprovado em testes unitários e de regressão (test-canonical-regression.mjs)  │
│ - Causa: Ausência do binário git ou indisponibilidade de objetos da baseline     │
│   canônica b3fc8d1 / 891 blobs protegidos via 'git cat-file --batch'             │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ B. BLOQUEIO CONFIRMADO: workflow_dispatch SEM REGISTRO NA BRANCH PADRÃO (main)   │
│ - Regra irredutível da plataforma GitHub Actions: .yml DEVE estar na default     │
│   branch (main) para registrar o workflow e permitir acionamento manual          │
│ - Como a main está congelada em b3fc8d1 (MAIN_PUSH_AUTHORIZED=NAO), o workflow   │
│   vercel-prebuilt-attested.yml não está registrado na main                       │
│ - Resultado: Dispatch remoto resulta em HTTP 404 (Workflow not found on main)    │
│ - STATUS REMOTO: BLOCKED sob permissões vigentes                                 │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ C. HIPÓTESE TÉCNICA NÃO TESTADA: EXECUÇÃO DA VERCEL CLI SEM CACHE DE PREVIEW     │
│ - Contrato A2.2A impõe restrições severas: sem credenciais (sem VERCEL_TOKEN),   │
│   sem cache local (.vercel/.env.preview.local) e proibição de 'vercel pull'      │
│ - Hipótese: a Vercel CLI falhará offline ao exigir conexão remota para Preview   │
│ - Status: HIPÓTESE AINDA NÃO TESTADA em runner real; não é fato comprovado       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### A. Causa Comprovada: `CANON_GIT_OR_BASELINE_UNAVAILABLE`
- **Mecanismo:** Definido e testado em [scripts/verify-canonical-contract.mjs](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/scripts/verify-canonical-contract.mjs#L91-L100) e [scripts/test-canonical-regression.mjs](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/scripts/test-canonical-regression.mjs#L100). O erro é disparado sempre que:
  1. O comando `git` falha ou não está disponível no `PATH`;
  2. O repositório local não possui a árvore de objetos completa para inspecionar a baseline `b3fc8d1e3844bc5601813ab1b298289af5b3f1fd` ou os 891 hashes protegidos via `git cat-file --batch`;
  3. O runner executa checkout raso (`fetch-depth: 1`) omitindo os blobs históricos da baseline.
- **Resolução Técnica:** Garantir que qualquer runner ou ambiente de execução utilize `fetch-depth: 0` e preserve a integridade dos objetos históricos Git.

#### B. Bloqueio Confirmado: Registro de `workflow_dispatch` no GitHub Actions
- **Mecanismo da Plataforma:** O GitHub Actions exige que um arquivo de workflow (`.github/workflows/*.yml`) resida na branch padrão do repositório (`default branch`, atualmente `main`) para ser registrado pelo parser do GitHub e exposto para acionamento manual via UI ou API (`workflow_dispatch`).
- **Estado no Repositório:** O arquivo `.github/workflows/vercel-prebuilt-attested.yml` foi adicionado na linhagem de hardening e só existe nas branches `governance/canon-01-hardening` e `fix/source-output-format-recovery`. Ele **não existe** na branch `main`.
- **Efeito:** A tentativa de invocar `gh workflow run vercel-prebuilt-attested.yml` falha imediatamente com erro de recurso inexistente (`workflow not found on main`).
- **Status sob Permissões Vigentes:** Como `MAIN_PUSH_AUTHORIZED=NAO` e não há autorização para Pull Request ou alteração na `main`, a execução remota de `workflow_dispatch` no GitHub Actions está formalmente declarada como **`BLOCKED`**.

#### C. Hipótese Ainda Não Testada: Execução da Vercel CLI sem Cache de Preview
- **Contexto:** Sob o Contrato A2.2A/A2.2A-R1, o comando `vercel build --target=preview` é executado de forma não interativa com exclusão intencional de credenciais (`A22_BUILD_CREDENTIALS_REJECTED`), rejeição de cache local (`A22_PREVIEW_ENV_CACHE_NOT_AUTHORIZED` para `.vercel/.env.preview.local`) e proibição de `vercel pull`.
- **Natureza da Afirmação:** A suposição de que a CLI falhará offline por exigir conexão remota para resolver variáveis do ambiente de Preview permanece como **hipótese técnica a validar empiricamente**, devendo ser rigorosamente isolada de fatos e bloqueios já comprovados.

---

## 2. Relação Topológica entre Branches e Preservação da Âncora Histórica

### 2.1. Topologia e Ancestralidade Comprovada
A auditoria topológica via Git confirmou a relação estrita entre as branches:

```
[b3fc8d1] (main / baseline canônica congelada)
    │
    ▼
[4a19e23] (origin/governance/canon-01-hardening)
    │
    ├── [438aa68] fix(governance): make A22 workflow CRLF fixture idempotent
    │
    ├── [24295bb] fix(source): honor MPEG-TS output in directory imports
    │
    ├── [38fc66c] fix(canon-01): consolidate source catalog and TV UI recovery
    │
    └── [d8a7410] fix(ci): normalize Windows attestation metadata assertion
                  (HEAD atual: fix/source-output-format-recovery)
```

- **Comando de Verificação:** `git rev-list --left-right --count fix/source-output-format-recovery...origin/governance/canon-01-hardening`
- **Resultado:** **`4  0`**
- **Conclusão:** A branch de trabalho `fix/source-output-format-recovery` está **quatro commits à frente e zero commits atrás** de `origin/governance/canon-01-hardening`. Trata-se de uma extensão linear direta, sem desvio divergente ou bifurcação desatualizada.

---

### 2.2. Preservação Estrita de `POLICY.receivedHead` como Âncora Histórica
No módulo [scripts/vercel-prebuilt-contract.mjs](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/scripts/vercel-prebuilt-contract.mjs), a constante `POLICY.receivedHead` está definida como:
```javascript
export const POLICY = Object.freeze({
  ref: 'refs/heads/governance/canon-01-hardening',
  receivedHead: 'a27d7cd4a74bd447221bba2851ee0af033d0a2fd',
  maxPackageBytes: 25 * 1024 * 1024,
});
```

A função `assertGitProvenance(sourceSha)` executa:
```javascript
const baseSha = POLICY.receivedHead;
const isAncestor = await gitMergeBaseIsAncestor(baseSha, sourceSha, root);
need(isAncestor, 'A22_NOT_ANCESTOR_OF_RECEIVED_HEAD');
```

- **Demonstração Algébrica:** Como o commit `a27d7cd4a74bd447221bba2851ee0af033d0a2fd` é um ancestral legítimo direto da linhagem que originou `4a19e23` e subsequentemente `d8a74102124fbb8a3f013f6fd8a502519c1db4b8`, o teste `git merge-base --is-ancestor a27d7cd d8a7410` avalia invariavelmente como **verdadeiro** (`exit code 0`).
- **Decisão Arquitetural:** `POLICY.receivedHead` **NÃO DEVE SER ALTERADO**. Ele permanece como a **âncora histórica imutável** da governança CANON-01, uma vez que não existe qualquer justificativa demonstrável para mutação desse valor.

---

## 3. Avaliação de Estratégias no GitHub Actions e Análise de Segurança

### 3.1. Análise de Risco de Segurança contra Substituição por `push` ou `pull_request`
A substituição do gatilho `workflow_dispatch` por eventos automáticos como `push` ou `pull_request` foi rigorosamente avaliada e é **SUMARIAMENTE REJEITADA** devido aos seguintes riscos críticos de segurança e governança:

1. **Super-emissão Descontrolada de Atestações Criptográficas:**
   - O job de atestação requer permissões `id-token: write` e `attestations: write` para emitir certificados Sigstore OIDC do GitHub Actions.
   - Disparar em `push` faria com que cada commit ou push intermediário na branch gerasse atestações assinadas pelo repositório oficial, poluindo o registro criptográfico de proveniência e quebrando o princípio de build intencional.
2. **Mismatch Inerente de SHA em Gatilhos de `pull_request`:**
   - No GitHub Actions, eventos de `pull_request` são executados sobre um commit de merge efêmero gerado pelo GitHub (`refs/pull/:number/merge`).
   - O SHA desse merge commit é dinâmico e difere do SHA do commit inspecionado e auditado na branch de origem (`inputs.source_sha`), violando de forma imediata a asserção fail-closed `A22_SOURCE_SHA_MISMATCH` do contrato de proveniência.
3. **Violação do Princípio de Revisão Humana Obrigatória:**
   - O contrato A22A foi desenhado para impor aprovação manual de escopo (`inputs.source_sha`) por um operador credenciado. A automação irrestrita por push elimina esse elo humano de controle.
4. **Superfície de Ataque e Contaminação de Variáveis:**
   - Gatilhos de `pull_request` expõem o pipeline a execuções com contextos parcialmente controlados por branches secundárias, conflitando com o isolamento rígido de segredos.

---

### 3.2. Declaração Formal de Bloqueio Remoto sob Permissões Vigentes
Diante das restrições invioláveis do repositório:
- `MAIN_PUSH_AUTHORIZED = NAO`
- `NO_AUTOMATIC_PR = SIM`
- Requisito de plataforma do GitHub Actions exigindo o arquivo na `main` para `workflow_dispatch`;

Declara-se formalmente que:
> **STATUS DA EXECUÇÃO REMOTA NO GITHUB ACTIONS:**  
> **`BLOCKED_BY_GITHUB_ACTIONS_DEFAULT_BRANCH_REGISTRATION_REQUIREMENT`**

Enquanto o Chat Mestre não autorizar expressamente uma emenda de governança para registrar a definição do workflow na branch padrão `main` (ou definir outro mecanismo oficial de CI), nenhuma execução remota pode ocorrer no GitHub Actions.

A recuperação técnica foca no que é **estritamente executável e comprovável localmente**: conformidade dos contratos, empacotamento determinístico, sanitização de configuração e execução da suíte canônica de testes.

---

## 4. Arquitetura de Build Isolado, Empacotamento Determinístico e Atestação SLSA

O pipeline de recuperação opera em três fases desacopladas, sem qualquer dependência de deploy:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INSPEÇÃO & LINK LOCAL                                    │
│ - Executa com VERCEL_TOKEN estritamente de leitura          │
│ - Inspeciona via API GET /v9/projects/prj_...               │
│ - Gera .vercel/project.json sanitizado em memória/disco     │
│ - Descarta tokens de autenticação antes do build            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BUILD ISOLADO (CLI PREBUILT)                             │
│ - ZERO tokens de acesso (sem VERCEL_TOKEN, sem GH_TOKEN)    │
│ - Recebe APENAS variáveis públicas (URL e Publishable Key)  │
│ - Executa: vercel build --target=preview --non-interactive  │
│ - Inspeciona .vercel/output (config.json v3 e estáticos)    │
│ - Gera pacote determinístico: prebuilt.tar e manifest.json  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ATESTAÇÃO CRIPTOGRÁFICA (FUTURA / EM RUNNER AUTORIZADO)  │
│ - Job isolado com permissões 'attestations: write'          │
│ - Atesta digest SHA-256 do arquivo 'prebuilt.tar'           │
│ - Emite declaração Sigstore com proveniência SLSA v1.0      │
│ - Executa 'gh attestation verify' verificando runId e OIDC  │
│ - RESULTADO: GITHUB_SIGNATURE_AND_PACKAGE_VERIFIED          │
│ - PUBLICATION_AUTHORIZED = NAO                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.1. Plano de Credenciais Exclusivamente Públicas
- **Parâmetros Permitidos no Build:**
  - `VITE_SUPABASE_URL`: `https://cujbmyhitgomlgwfkaat.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: Chave anônima pública do cliente (`sb_publishable_...`).
- **Segredos Proibidos:** Nenhuma chave `service_role`, `sb_secret_`, token privado da Vercel, token de acesso do GitHub ou credencial de banco é permitida no ambiente de compilação.
- **Fail-Closed:** A presença de qualquer padrão regex associado a chaves privadas (`BEGIN PRIVATE KEY`, `AKIA...`, `github_pat_...`) na saída `.vercel/output/static` aborta a execução imediatamente com `A22_PRIVATE_CONTENT`.

---

## 5. Contrato de Deploy Preview Futuro (Não Autorizado) e Remoção de Comando Incorreto

### 5.1. Remoção do Comando Incorreto
Fica expressamente **REMOVIDO E PROIBIDO** qualquer uso ou referência ao comando inexistente `vercel deploy --prebuilt --archive=prebuilt.tar`. A Vercel CLI `@64.7.0` não suporta a flag `--archive` no subcomando `deploy`.

### 5.2. Natureza Intermediária do Arquivo TAR e Requisitos para Futuro Deploy
O arquivo `prebuilt.tar` é um **artefato intermediário de integridade e atestação criptográfica**, desenhado para ter seu digest SHA-256 atestado via Sigstore OIDC no GitHub Actions.

Caso um futuro Gate nominal específico venha a autorizar o deploy em ambiente Preview da Vercel, os seguintes requisitos sequenciais são **obrigatórios**:

1. **Verificação Prévia de Assinatura e Provedor OIDC:**
   - O artefato `prebuilt.tar` deve ter sua assinatura Sigstore e atestação SLSA validadas com sucesso via `gh attestation verify` contra o repositório `xandeflix2/xandeflix-prebuilt`.
2. **Extração Segura do Pacote TAR:**
   - A extração do `prebuilt.tar` deve ser executada em um diretório de trabalho isolado via rotina segura (equivalente a `unpackTar`), com validação rigorosa anti-path-traversal (`..`), sem links simbólicos e rejeitando arquivos fora da raiz esperada.
3. **Validação Estrutural de `.vercel/output`:**
   - O diretório descompactado deve conter a pasta `.vercel/output` em estrita conformidade com a especificação do Build Output API v3 (`config.json` v3, estáticos íntegros, rotas e headers de segurança validados).
4. **Execução Estrita do Deploy Preview:**
   - O deploy deve ser disparado via comando nativo da Vercel CLI operando sobre a saída validada:
     ```bash
     vercel deploy --prebuilt
     ```
   - Restrito a Preview URL efêmera, sem publicação em produção e sem adição de domínios customizados.
5. **Estado Vigente:**
   - **`VERCEL_DEPLOY_AUTHORIZED = NAO`**
   - **Nenhum deploy deve ser executado neste Gate.**

---

## 6. Preservação Integral de Comandos e Controles Canônicos (Pisos Mínimos)

A especificação preserva integralmente todos os controles e testes instituídos pelo Gate CANON-01 e pela emenda A2.2A. Todas as contagens numéricas atuais são tratadas formalmente como **pisos mínimos irredutíveis (floor: ≥ N)**, e **nunca como tetos ou limites máximos de crescimento**:

### 6.1. Pisos Mínimos de Cobertura e Governança
- **Arquivos Protegidos:** `≥ 891` arquivos rastreados com integridade criptográfica verificada via `npm run canon:check`.
- **Recibos Canônicos:** `≥ 20` recibos auditáveis encadeados e validados em `docs/governance/authorizations/`.
- **Controles Canônicos Totais:** `≥ 128` controles distribuídos em `≥ 23` suítes ativas sem skips via `npm run canon:test`.
- **Controles Dedicados do Prebuilt:** `≥ 116` verificações contratuais dedicadas em `node scripts/test-vercel-prebuilt-contract.mjs`.
- **Lock C11 de Novos Dispositivos:** `≥ 49` cenários de ativação + `≥ 9` controles negativos validados via `npm run c11:new-device:lock`.

### 6.2. Conjunto Integral de Comandos Canônicos Preservados
Os seguintes comandos são obrigatórios e mantidos sem qualquer enfraquecimento:
1. `npm run canon:check`
2. `npm run canon:test`
3. `npm run c11:new-device:lock`
4. `npm run typecheck`
5. `npm run update:check`
6. `npm run security:check`
7. `npm run playback:check`
8. `npm run build`
9. `npm run site:build`
10. `node scripts/test-site-build-contract.mjs`
11. `node scripts/test-vercel-artifact-contract.mjs`
12. `node scripts/verify-vercel-artifact.mjs inspect`
13. `node scripts/test-vercel-prebuilt-contract.mjs`

---

## 7. Mapeamento da Cadeia de Governança (`supersedes`)

Para preservar a integridade estrita exigida por [verify-canonical-contract.mjs](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/scripts/verify-canonical-contract.mjs), o encadeamento exato de emendas anteriores e hashes de blob é:

| Arquivo Alvo da Emenda | Recibo Predecessor Imediato | Hash `before` (Blob LF Atual) | Papel na Emenda |
| :--- | :--- | :--- | :--- |
| `scripts/vercel-prebuilt-contract.mjs` | `CANON-01-VERCEL-A22A` | `2a51da39ccb96da6253d0ecdc17de802764d39df` | Atualização da política de branch/ref mantendo POLICY.receivedHead e rootDirectory: null |
| `scripts/test-vercel-prebuilt-contract.mjs` | `CANON-01-A22A-WINDOWS-METADATA-EOL` | `3044824a5863e6f589a1919901a2d8eee990c5fc` | Validação de controles positivos/negativos da nova política |
| `scripts/verify-canonical-contract.mjs` | `CANON-01-VERCEL-A22A` | `f8e4027078c77dbbcdc51aff72dbe758ee0ea78f` | Registro e verificação fail-closed do novo recibo |
| `scripts/test-canonical-regression.mjs` | `CANON-01-A22A-WINDOWS-METADATA-EOL` | `d161c2db644cfa4678a3f39167de9e83793d70ec` | Preservação dos ≥ 128 controles canônicos e ≥ 23 suítes |

*(Nota: O arquivo `.github/workflows/vercel-prebuilt-attested.yml` permanece em seu hash atual `f022d5103a20bfd11caa84d742f60eab87a6f32f`, exceto se houver emenda explícita autorizada).*

---

## 8. Allowlist Candidata de Implementação (com Inclusão Explícita da Spec)

Se formalmente autorizada pelo Chat Mestre na etapa subsequente, a alteração de arquivos será estritamente confinada à seguinte allowlist:

1. `scripts/vercel-prebuilt-contract.mjs`
2. `scripts/test-vercel-prebuilt-contract.mjs`
3. `scripts/verify-canonical-contract.mjs`
4. `scripts/test-canonical-regression.mjs`
5. `.github/workflows/vercel-prebuilt-attested.yml` *(se estritamente necessário para compatibilidade de branch)*
6. `docs/architecture/VERCEL_PREBUILT_RECOVERY_01.md` *(especificação técnica aprovada do gate)*
7. `docs/governance/authorizations/CANON-01-VERCEL-PREBUILT-RECOVERY-01.json` *(novo recibo auditável de governança)*
8. `docs/evidence/CANON_01_VERCEL_PREBUILT_RECOVERY_01.md` *(evidências e logs de execução)*
9. **Documentos Normativos (SOMENTE Append):**
   - `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md`
   - `docs/STATUS.md`
   - `docs/EVOLUTION_REPORT.md`
   - `docs/ERRORS_AND_BLOCKERS.md`

---

## 9. Critérios de Aceitação e Definição de Pronto (DoD)

### 9.1. Validação Local de Contratos e Regressão
- `npm run canon:check`: Exit code 0, ≥ 891 arquivos protegidos íntegros, recibos encadeados.
- `npm run canon:test`: Exit code 0, ≥ 128 controles canônicos e ≥ 23 suítes ativas passando sem skips.
- `npm run c11:new-device:lock`: Exit code 0 (≥ 49 cenários + ≥ 9 controles negativos).
- `npm run typecheck`: Exit code 0 sem avisos ou erros de compilação TS.
- `node scripts/test-vercel-prebuilt-contract.mjs`: Exit code 0, validando os ≥ 116 controles dedicados.
- `node scripts/test-site-build-contract.mjs` e `node scripts/test-vercel-artifact-contract.mjs`: Exit code 0.

### 9.2. Distinção entre Build/Atestação Real e Fixtures Sintéticas
1. **Build Real (`real CLI build`):**
   - Criação física de `.vercel/output` por invocação do executável da Vercel CLI `@64.7.0`.
   - `config.json` versão 3 compilado com as 10 rotas e 4 headers de segurança requeridos.
   - Presença obrigatória de `static/manager.html` e `static/app/app.html`, com bundles JavaScript referenciados existindo em disco.
   - Exclusão explícita de `builds.json` e diretórios de diagnósticos do arquivo tar final.
2. **Atestação Real (`real GitHub attestation`):**
   - Geração de pacote `prebuilt.tar` regular, sem links simbólicos, com soma SHA-256 e manifesto determinístico.
   - Emissão de assinatura Sigstore OIDC em GitHub-hosted runner (`https://token.actions.githubusercontent.com`).
   - Verificação criptográfica executada com sucesso pelo comando `gh attestation verify` contra o repositório `xandeflix2/xandeflix-prebuilt` e workflow autorizado.
   - Ausência de falsos positivos: fixtures locais permanecem declaradas como `synthetic policy fixture ONLY` e `remoteEvidenceVerified: false`.

---

## 10. Estrutura Declarativa do Recibo de Governança Candidato (Não Criado)

Apresentação da estrutura do futuro recibo, **sem gravação em disco**, aguardando autorização expressa do Chat Mestre:

```json
{
  "schema": 1,
  "gate": "CANON-01-VERCEL-PREBUILT-RECOVERY-01",
  "parentGate": "CANON-01",
  "amendment": "CANON-01-VERCEL-PREBUILT-RECOVERY-01",
  "status": "APPROVED_BY_CHAT_MASTER",
  "referenceCommit": "b3fc8d1e3844bc5601813ab1b298289af5b3f1fd",
  "authorizationOrigin": "CHAT_MASTER_INSTRUCTION_2026_10_22",
  "authorizationRequestSha256": "PENDING_CHAT_MASTER_REQUEST_HASH",
  "reason": "Recover Vercel Prebuilt contract alignment for active branch while documenting GitHub Actions default-branch workflow dispatch platform constraints, preserving fail-closed attestation and zero deploy authority.",
  "physicalImpact": "NOT_REQUIRED_JUSTIFIED",
  "physicalImpactJustification": "Governance and verification scripts only; no Android, native runtime or backend data mutation.",
  "testChangesReviewed": true,
  "requiredTests": [
    "scripts/validate-device-bootstrap.mjs",
    "scripts/test-c105-complete-root-search.mjs",
    "scripts/test-c107-catalog-return-navigation.mjs",
    "scripts/test-c11-vod-direct-stream-contract.mjs",
    "scripts/test-c11-playback-session-c9-runtime-wiring.mjs",
    "scripts/validate-security-recovery.mjs",
    "scripts/test-c11-phone-ui-orientation.mjs",
    "scripts/test-c11-landscape-navigation.mjs",
    "scripts/validate-direct-playback.mjs",
    "scripts/test-c126-parental-control.mjs"
  ],
  "mandatoryCommands": [
    "npm run canon:check",
    "npm run canon:test",
    "npm run c11:new-device:lock",
    "npm run typecheck",
    "npm run build",
    "npm run site:build",
    "node scripts/test-vercel-prebuilt-contract.mjs"
  ],
  "evidence": "docs/evidence/CANON_01_VERCEL_PREBUILT_RECOVERY_01.md",
  "compatibilityRisk": "Remote workflow dispatch requires default-branch registration; no main push or deploy authorized.",
  "restrictions": [
    "Local implementation only; no commit, push, PR or deployment.",
    "No production build or remote Vercel configuration mutation.",
    "Missing credentials or unverified signatures must fail closed."
  ],
  "supersedes": {
    "scripts/vercel-prebuilt-contract.mjs": "CANON-01-VERCEL-A22A",
    "scripts/test-vercel-prebuilt-contract.mjs": "CANON-01-A22A-WINDOWS-METADATA-EOL",
    "scripts/verify-canonical-contract.mjs": "CANON-01-VERCEL-A22A",
    "scripts/test-canonical-regression.mjs": "CANON-01-A22A-WINDOWS-METADATA-EOL"
  },
  "changes": [
    {
      "path": "scripts/vercel-prebuilt-contract.mjs",
      "before": "2a51da39ccb96da6253d0ecdc17de802764d39df",
      "after": "PENDING_IMPLEMENTATION_HASH"
    },
    {
      "path": "scripts/test-vercel-prebuilt-contract.mjs",
      "before": "3044824a5863e6f589a1919901a2d8eee990c5fc",
      "after": "PENDING_IMPLEMENTATION_HASH"
    },
    {
      "path": "scripts/verify-canonical-contract.mjs",
      "before": "f8e4027078c77dbbcdc51aff72dbe758ee0ea78f",
      "after": "PENDING_IMPLEMENTATION_HASH"
    },
    {
      "path": "scripts/test-canonical-regression.mjs",
      "before": "d161c2db644cfa4678a3f39167de9e83793d70ec",
      "after": "PENDING_IMPLEMENTATION_HASH"
    }
  ],
  "gitCommitAuthorized": false,
  "gitPushAuthorized": false,
  "androidBuildAuthorized": false,
  "supabaseWriteAuthorized": false,
  "nextGateStarted": false
}
```


## CANON-01-VERCEL-PREBUILT-RECOVERY-01 — L1 autonomous adoption and closed scope — 2026-10-23

Latest explicit user instruction authorizes reviewing and adopting the three received script diffs without requiring an external reviewer to access local files. Existing authorship is not inferred: incoming bytes/diff are backed up with hashes. The received changes exactly match a partial L1 (POLICY.ref only, six context negatives, future-amendment identity); no prior receipt authorizes those new bytes yet. Original20-receipt baseline was tested at committed HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8 in a local isolated copy with full Git history, canonical origin and same branch. All3 baseline commands exit0;891 protected files,128 controls/23 suites,116 Prebuilt controls. The active worktree was never reset/restored/stashed or normalized.

Closed L1 allowlist (supersedes broader candidate lists in the preserved original specification):
- scripts/vercel-prebuilt-contract.mjs
- scripts/test-vercel-prebuilt-contract.mjs
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-VERCEL-PREBUILT-RECOVERY-01.json
- docs/evidence/CANON_01_VERCEL_PREBUILT_RECOVERY_01.md
- docs/architecture/VERCEL_PREBUILT_RECOVERY_01.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Before further script edits: adopt the received minimal ref change, preserve historical receivedHead a27d7cd4a74bd447221bba2851ee0af033d0a2fd, baseline/project/team/preview/CLI64.7.0/OIDC/credential policy and pinned workflow. Add explicit branch/anchor/context positive checks, correlated wrong-SHA and wrong-workflow-path negatives; retain all116 controls and the six incoming negatives. In the canonical runner add only L1 receipt/identity/predecessor/before/review/silent-policy protection after the128 existing controls, preserving all23 suites. No verifier/workflow/package/lock/runtime/Android/Supabase or historical receipt changes.

New receipt grants exactly the3 script paths: contract supersedes CANON-01-VERCEL-A22A before2a51da39ccb96da6253d0ecdc17de802764d39df; dedicated test and canonical runner supersede CANON-01-A22A-WINDOWS-METADATA-EOL before3044824a5863e6f589a1919901a2d8eee990c5fc/d161c2db644cfa4678a3f39167de9e83793d70ec respectively. Generic verifier already supports this chain; do not add a verifier grant. Register once after actual LF blob after-hashes exist.

Authorization transcription is UTF-8/LF without BOM, includes original restricted L1 request and latest adoption instruction, SHA256 65d5f1bc7871986f2f0db0faea569323be7f831dcb325070ff058299c456e89e. Full transcription will be included in the new evidence for reproducibility; this digest is a record of the explicit user instruction, not a cryptographic signature by another person. Initial candidate PENDING values remain historical examples, never receipt values. All13 official commands must run sequentially on the actual active worktree; baseline copy is not a substitute for final real-tree tests. Require truthful positive/negative results, exact10-path allowlist, original document prefixes and all20 prior receipts preserved. Ignored diagnostics/copies/logs and ordinary web build outputs only. No npm dependency install unless demonstrably needed; no Git add/commit/push/PR/merge/reset/clean/branch switch or remote execution. At most2 grounded full validation attempts; stop on out-of-scope needs.

Real Prebuilt generation/signature/deployment and C1/L2–L5 remain unexecuted; workflow default-branch registration remains an external blocker recorded by the provided specification, not re-probed through a dispatch. Offline CLI behavior is still a hypothesis. Candidate sections mentioning verifier/workflow changes or illustrative API names do not expand this L1. Keep the original specification prefix byte-identical and append this clarification only.


## CANON-01-VERCEL-PREBUILT-RECOVERY-01 — conclusão local L1 — 2026-10-23

RESULT=L1_LOCAL_READY_FOR_CHAT_MASTER_REVIEW. Treze comandos executados em sequência na árvore real, todos exit0 na primeira tentativa completa. Baseline separado3/3 exit0 no HEAD comprometido. Canonical135 controles/23 suítes, preservados nominalmente todos128 controles anteriores e todas23 suítes; Prebuilt127 controles, preservadas as linhas de teste dos116 anteriores.891 arquivos protegidos;21 recibos totais,20 anteriores byte a byte preservados. Somente POLICY.ref muda na implementação; receivedHead/baseline/projeto/equipe/preview/CLI/pin/OIDC/credenciais permanecem.

Allowlist exatamente10 caminhos, index vazio, HEAD/branch/main inalterados. Especificação original e4 documentos normativos preservam prefixos de bytes. git diff --check PASS;0 whitespace inesperado nos untracked,10 hard breaks Markdown preservados. A primeira varredura auxiliar sinalizou2 literais de credenciais sintéticas de testes negativos preexistentes; conferência contra HEAD comprovou identidade exata, mantidos os testes e classificadas as fixtures explicitamente.0 padrão de credencial privada nova identificado. Não houve falha de comando oficial, ajuste de timeout/assertion ou segunda tentativa.

Auth SHA256 65d5f1bc7871986f2f0db0faea569323be7f831dcb325070ff058299c456e89e; recibo blobLF 9cb685590481ba094ffbca2e2abe2f585aa3ae46; recibo SHA256 f0a49ca75427803a1c8842c47b84910a47cb3417d3efc6e798aa5b0d207c6832. Transcrição completa está na evidência e reproduz os bytes normalizados. Isso não é assinatura humana criptográfica. Logs/diff/hashes em tmp/canon-01-vercel-prebuilt-recovery-01-l1-20261023. Nenhum Git add/commit/push/merge/PR, workflow remoto, Prebuilt real, atestação real, deploy, build Android, mudança de versão, dado ou Supabase. C1/L2–L5 permanecem apenas planejados.


### C1 e L2–L5: propostas, nenhuma implementação

C1: revisar este diff, transcrição, grants, prefixos e logs; qualquer decisão de Git/publicação é separada. Um push pode disparar as integrações Vercel existentes, por isso não foi feito nem há aprovação implícita.

L2: avaliar registro mínimo e revisado do workflow manual na branch padrão ou alternativa formalmente aprovada, sem trocar por evento privilegiado automático, relaxar o pin ou divergir SHA/ref/source/workflow. A documentação oficial exige o workflow na branch padrão para dispatch: [GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow). A árvore local de main será conferida somente por leitura; nenhum dispatch ou escrita remota foi tentado nesta L1.

L3: quando houver escopo próprio, executar build-only com histórico completo, projeto/equipe Preview fixados, CLI64.7.0 e verificações existentes. Confirmar output real, pacote e assinatura GitHub verdadeira. A documentação recomenda preparar settings/ambiente com pull, atualmente vedado; a compatibilidade offline continua não testada, sem permissão para baixar credenciais: [Vercel build](https://vercel.com/docs/cli/build). Fixtures locais não substituem esse teste.

L4: apenas após autorização independente, verificar assinatura/contexto/digest, extrair TAR com proteção de caminhos/links e validar output antes de qualquer Preview. A documentação atual descreve --archive como modo de compressão (por exemplo tgz), não como caminho do TAR de atestação; não generalizar o texto candidato antigo como ausência universal dessa opção. A CLI pinada não foi executada para verificar essa opção nesta L1: [Vercel deploy](https://vercel.com/docs/cli/deploy). Nenhum deploy foi realizado.

L5: homologar rotas, autenticação, controle de acesso, playback e recuperação no ambiente futuramente autorizado; produção/main/rollback exigem decisão própria. Dispositivos foram informados como conectados pelo usuário; não houve ADB, instalação ou teste físico nesta emenda de governança. Android/Supabase permanecem fora do escopo.
