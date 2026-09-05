# Registro de Erros e Bloqueadores (Errors and Blockers)

---

## 1. Padrao Estrutural de Registro

Cada incidente, erro ou bloqueador tecnico devera ser registrado segundo o formato:

- **DATE**: Data da ocorrencia (AAAA-MM-DD).
- **GATE**: Gate ativo no momento da identificacao.
- **CLASSIFICATION**: Categoria do erro (ex: `EXTERNAL_CONNECTOR_VISIBILITY`, `BUILD_FAILURE`, `SCHEMA_CONFLICT`, `SECURITY_VIOLATION`).
- **DESCRIPTION**: Descricao sucinta e factual da anomalia.
- **EVIDENCE**: Comandos executados, mensagens de erro e logs sanitizados.
- **ROOT_CAUSE**: Causa raiz diagnosticada.
- **ROOT_CAUSE_CONFIDENCE**: Grau de certeza da causa raiz (`HIGH`, `MEDIUM`, `LOW`).
- **IMPACT**: Consequencias para o ciclo e escopo do projeto (`BLOCKING`, `NON_BLOCKING`).
- **RESOLUTION_STATUS**: Estado da resolucao (`RESOLVED`, `INVESTIGATING`, `MONITORING`, `ACCEPTED_BEHAVIOR`).

---

## 2. Ocorrencias Registradas

### OCORRENCIA-001 — Visibilidade Externa do Projeto Supabase no Conector de Terceiros

- **DATE**: 2026-09-04
- **GATE**: G0_FOUNDATION_AND_ISOLATION
- **CLASSIFICATION**: `EXTERNAL_CONNECTOR_VISIBILITY`
- **DESCRIPTION**: O conector de integracao externa do Chat Mestre (ChatGPT Supabase Connector) ainda nao exibe na sua listagem imediata o projeto recem-criado `Xandeflix Prebuilt` (`cujbmyhitgomlgwfkaat`).
- **EVIDENCE**: Relato inicial do Chat Mestre indicando ausencia de visibilidade no conector externo.
- **ROOT_CAUSE**: Delay de indexacao / sincronizacao do conector de terceiros com a API de organizacao da plataforma Supabase; nao decorre de falha ou inexistencia do projeto Supabase.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING` (O Gate G0 requer apenas o registro documental da identidade e proibe terminantemente qualquer intervencao remota no Supabase).
- **RESOLUTION_STATUS**: `MONITORING` (Aguardando sincronizacao natural da plataforma de terceiros; nenhuma acao corretiva autorizada ou necessaria no G0).

### OCORRENCIA-002 — Alerta de Tooling/Integracao IDE Java/Buildship

- **DATE**: 2026-09-04
- **GATE**: G1_APP_SKELETON
- **CLASSIFICATION**: `IDE_TOOLING_WARNING`
- **DESCRIPTION**: Integracao de IDE Java/Buildship reportou incapacidade de persistir preferencias de `org.eclipse.buildship.core` sob `android/.settings`.
- **EVIDENCE**: Compilacao nativa `gradlew.bat assembleDebug` concluida com sucesso (`BUILD SUCCESSFUL, 85 actionable tasks: 85 executed`) e APK de debug gerado (`app-debug.apk`, 4.107.263 bytes).
- **ROOT_CAUSE**: Questao de persistencia de preferencias de projeto do plugin IDE/Buildship, sem impacto na toolchain CLI do Gradle.
- **ROOT_CAUSE_CONFIDENCE**: MEDIUM
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `MONITORING`
- **NOTAS_NORMATIVAS**:
  - `ANDROID_DEBUG_BUILD`: PASS
  - `APK_GENERATED`: SIM
  - `G1_PASS_INVALIDATED`: NAO

### OCORRENCIA-003 — Emissão de Mensagem Intermediária durante QUIET_UNTIL_FINAL_REPORT

- **DATE**: 2026-09-04
- **GATE**: G3_EXTERNAL_INGESTION_PIPELINE
- **CLASSIFICATION**: `PROCESS_OUTPUT_DEVIATION`
- **DESCRIPTION**: O executor emitiu uma mensagem intermediária informando início/aguardo de regressão Android antes do relatório terminal final, apesar de QUIET_UNTIL_FINAL_REPORT.
- **EVIDENCE**: Mensagem de texto intermediária informativa enviada durante a execução assíncrona do Gradle antes do relatório terminal.
- **ROOT_CAUSE**: Instrução de suporte do tooling de background task sobreposta involuntariamente à diretriz de modo silencioso.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `RESOLVED_BY_REINFORCED_EXECUTION_RULE`
- **NOTAS_NORMATIVAS**:
  - `G3_PASS_INVALIDATED`: NAO

### OCORRENCIA-004 — Emissão de Mensagem Intermediária durante QUIET_UNTIL_FINAL_REPORT no Gate G4

- **DATE**: 2026-09-05
- **GATE**: G4_PROVISIONING_PACKAGE
- **CLASSIFICATION**: `PROCESS_OUTPUT_DEVIATION`
- **DESCRIPTION**: O executor emitiu mensagem intermediária informando início/aguardo de teste Gradle antes do relatório terminal, apesar do modo QUIET_UNTIL_FINAL_REPORT.
- **EVIDENCE**: Mensagem de texto intermediária informativa enviada durante a execução assíncrona do Gradle test antes do relatório terminal.
- **ROOT_CAUSE**: Instrução de suporte do tooling de background task sobreposta involuntariamente à diretriz de modo silencioso.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `RESOLVED_BY_REINFORCED_EXECUTION_RULE`
- **NOTAS_NORMATIVAS**:
  - `G4_PASS_INVALIDATED`: NAO

### OCORRENCIA-005 — Evidência de Custo de Performance no Benchmark Sintético de Escala (240k)

- **DATE**: 2026-09-05
- **GATE**: G7_PREBUILT_SEARCH
- **CLASSIFICATION**: `PERFORMANCE_EVIDENCE_RISK`
- **STATUS**: `OPEN_NON_BLOCKING`
- **DESCRIPTION**: O teste de escala sintético com 240.000 documentos comprovou a viabilidade lógica e algorítmica da busca pré-construída, mas revelou custos observados relevantes de tempo de build externo, tamanho do payload serializado e latência de consulta que justificam avaliação e otimização posterior em hardware físico.
- **EVIDENCE**:
  - `EVIDENCE_SOURCE`: SYNTHETIC_240K_SCALE_TEST
  - `OBSERVED_DOCUMENT_COUNT`: 240000
  - `OBSERVED_EXTERNAL_INDEX_BUILD_MS`: 12216
  - `OBSERVED_SEARCH_INDEX_SERIALIZED_SIZE_BYTES`: 52672308
  - `OBSERVED_SEARCH_INDEX_COMPRESSED_ESTIMATE_BYTES`: 6848000
  - `OBSERVED_SEARCH_INDEX_LOAD_MS`: 771
  - `OBSERVED_RUNTIME_MATERIALIZATION_MS`: 771
  - `OBSERVED_QUERY_EXACT_MS`: 2850.06
  - `OBSERVED_QUERY_PREFIX_MS`: 1233.61
  - `OBSERVED_QUERY_MULTI_TOKEN_MS`: 1239.05
  - `OBSERVED_QUERY_NO_RESULT_MS`: 21.63
  - `OBSERVED_PROCESS_MEMORY_BEFORE_MB`: 9
  - `OBSERVED_PROCESS_MEMORY_AFTER_BUILD_MB`: 336
  - `OBSERVED_PROCESS_MEMORY_AFTER_LOAD_MB`: 271
- **ROOT_CAUSE**: Volume massivo de dados sintéticos (240k itens) operando com busca ponderada puramente em JavaScript/Node.js sem aceleração de hardware nativa.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `MONITORING_FOR_PHYSICAL_VALIDATION`
- **NOTAS_NORMATIVAS**:
  - `INTERPRETATION`: A arquitetura de transportabilidade foi funcionalmente comprovada, mas os custos sintéticos observados justificam avaliação posterior de otimização e prova física antes de qualquer alegação de performance em Fire Stick.
  - `PERFORMANCE_EVIDENCE_IS_NOT_SLA`: SIM
  - `REAL_CATALOG_SEARCH_PROVEN`: NAO
  - `FIRE_STICK_SEARCH_PERFORMANCE_PROVEN`: NAO
  - `G7_PASS_INVALIDATED`: NAO

### OCORRENCIA-006 — Evidência de Pico de Memória em Escala Sintética no Update Incremental (240k)

- **DATE**: 2026-09-05
- **GATE**: G9_INCREMENTAL_UPDATE
- **CLASSIFICATION**: `PERFORMANCE_EVIDENCE_RISK`
- **STATUS**: `OPEN_NON_BLOCKING`
- **DESCRIPTION**: O teste de escala sintético com 240.000 documentos comprovou a vantagem substancial de transporte incremental (< 1% a ~4.3% do payload full), porém o pico de memória no harness de aplicação atingiu 459 MB (1% sparse) e 640 MB (5% moderate), justificando validação futura em hardware real (G11/G12).
- **EVIDENCE**:
  - `EVIDENCE_SOURCE`: SYNTHETIC_240K_INCREMENTAL_TEST
  - `SPARSE_DOCUMENT_COUNT`: 240000
  - `SPARSE_CHANGE_PERCENT`: 1
  - `SPARSE_DELTA_PACKAGE_SIZE_BYTES`: 42233
  - `SPARSE_FULL_TARGET_PACKAGE_SIZE_BYTES`: 4585619
  - `SPARSE_DELTA_TO_FULL_RATIO`: 0.0092
  - `SPARSE_MEMORY_PEAK_MB`: 459
  - `MODERATE_DOCUMENT_COUNT`: 240000
  - `MODERATE_CHANGE_PERCENT`: 5
  - `MODERATE_DELTA_PACKAGE_SIZE_BYTES`: 199353
  - `MODERATE_FULL_TARGET_PACKAGE_SIZE_BYTES`: 4630164
  - `MODERATE_DELTA_TO_FULL_RATIO`: 0.0431
  - `MODERATE_MEMORY_PEAK_MB`: 640
- **ROOT_CAUSE**: Manipulação em memória do grafo completo de 240k entidades e índice invertido durante parsing, staging e diff no processo Node.js sem paginação de disco intermediária.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `MONITORING_FOR_PHYSICAL_VALIDATION`
- **NOTAS_NORMATIVAS**:
  - `INTERPRETATION`: A vantagem de transporte incremental foi comprovada sinteticamente, porém o pico de memória observado no harness de escala justifica validação futura em hardware real.
  - `PERFORMANCE_EVIDENCE_IS_NOT_SLA`: SIM
  - `REAL_DEVICE_INCREMENTAL_UPDATE_PROVEN`: NAO
  - `G9_PASS_INVALIDATED`: NAO
