# Xandeflix Prebuilt

Projeto experimental de engenharia focado em validar e mensurar a hipotese de distribuicao de catalogo de streaming via **pre-processamento externo** combinado com **execucao e busca local no dispositivo**.

---

## 1. Identidade Canonica

- **PROJECT**: `XANDEFLIX_PREBUILT`
- **REPOSITORY**: `xandeflix2/xandeflix-prebuilt`
- **REMOTE_ORIGIN**: `https://github.com/xandeflix2/xandeflix-prebuilt.git`
- **BRANCH**: `main`
- **SUPABASE_PROJECT_NAME**: `Xandeflix Prebuilt`
- **SUPABASE_PROJECT_REF**: `cujbmyhitgomlgwfkaat`
- **SUPABASE_REGION**: `us-east-2`
- **ANDROID_PACKAGE_ID**: `com.xandeflix.prebuilt`

---

## 2. Isolamento Estrito do Projeto Original

Este projeto e totalmente independente e isolado do projeto de referencia:

- **Projeto Protegido**: `Xandeflix 2.0` (`timbocorrea/xandeflix-2.0` / `com.xandeflix.app`)
- **Proibicoes Absolutas**:
  - Nao alterar ou referenciar o repositorio protegido;
  - Nao reutilizar `.git`, credenciais, remotes, branches ou migrations do projeto original;
  - Nao executar cherry-pick ou transporte automatizado de commits;
  - Nao tocar no Supabase do projeto original.

---

## 3. Principio Arquitetural Central

Reduzir o tempo e consumo de recursos no bootstrap e operacao de catalogos volumosos em dispositivos com restricoes de processamento e memoria:

```
FONTE AUTORIZADA
       │
       ▼
INGESTAO EXTERNA
       │
       ▼
NORMALIZACAO & PREBUILT CATALOG
       │
       ▼
PACOTE DE PROVISIONAMENTO VERSIONADO
       │
       ▼
IMPORTACAO & RUNTIME LOCAL NO DISPOSITIVO
       │
       ▼
BUSCA LOCAL & PLAYBACK DIRETO NO DISPOSITIVO
```

---

## 4. Governanca e Regras de Execucao

Qualquer atuacao de agentes tecnicos neste repositorio e estritamente subordinada as regras em [AGENTS.md](file:///c:/Xandeflix/xandeflix-prebuilt/AGENTS.md) e a governanca por Gates descrita em [docs/governance/GATE_EXECUTION_RULES.md](file:///c:/Xandeflix/xandeflix-prebuilt/docs/governance/GATE_EXECUTION_RULES.md).
