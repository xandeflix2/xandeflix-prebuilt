# Relatorio de Evolucao (Evolution Report)

---

## 1. Identidade e Contexto de Evolucao

- **PROJECT**: `XANDEFLIX_PREBUILT`
- **PARENT_CONTEXT**: `MARCO_ZERO_CANONICO_XANDEFLIX_PREBUILT`
- **LAST_CLOSED_GATE**: `G10`
- **G0_STATUS**: `PASS`
- **G1_STATUS**: `PASS`
- **G2_STATUS**: `PASS`
- **G3_STATUS**: `PASS`
- **G4_STATUS**: `PASS`
- **G5_STATUS**: `PASS`
- **G6_STATUS**: `PASS`
- **G7_STATUS**: `PASS`
- **G8_STATUS**: `PASS`
- **G9_STATUS**: `PASS`
- **G10_STATUS**: `PASS`
- **MVP_PROGRESS_PERCENT**: `94`
- **CURRENT_GATE**: `G11`
- **G10_STARTED**: `SIM`
- **G11_STATUS**: `IN_PROGRESS`
- **G11A_STATUS**: `PASS`
- **G11_STARTED**: `SIM`
- **PHONE_VALIDATION_REMAINING**: `SIM`
- **G12_STATUS**: `NOT_STARTED`
- **NEXT_GATE**: `XANDEFLIX_PREBUILT_G11B_PHONE_AND_FINAL_PHYSICAL_MATRIX`
- **NEXT_GATE_STARTED**: `NAO`
- **HISTORICAL_RECORD**: `G5_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G5_ADJUDICATION_CLOSED_PASS=SIM; G6_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G6_ADJUDICATION_CLOSED_PASS=SIM; G7_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G7_ADJUDICATION_CLOSED_PASS=SIM; SEARCH_SCALE_PERFORMANCE_RISK=OPEN_NON_BLOCKING; G8_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G8_ADJUDICATION_CLOSED_PASS=SIM; G9_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G9_ADJUDICATION_CLOSED_PASS=SIM; UPDATE_SCALE_MEMORY_RISK=OPEN_NON_BLOCKING; G10_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G10_ADJUDICATION_CLOSED_PASS=SIM; G11_INITIAL_ATTEMPT=INCONCLUSIVE_REQUIRED_DEVICE_UNAVAILABLE; G11A_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G11A_ADJUDICATION_CLOSED_PASS=SIM`

---

## 2. Estado Arquitetural (ARCHITECTURE_STATE)

- Tese arquitetural estabelecida: Ingestao e pre-processamento externos de catalogo com persistencia, busca e runtime locais no dispositivo cliente.
- Modelo de distribuicao: Universal APK + Provisioning Package versionado.
- Modelo de consumo: Device-Direct Playback.
- Proibicoes ativas: Sem proxies de midia centrais, sem chaves service_role embutidas, sem senhas de fonte em texto puro no cliente.

---

## 3. Decisoes Bloqueadas (DECISIONS_LOCKED)

- `PROJECT_ISOLATED_FROM_XANDEFLIX_2_0`: SIM
- `GITHUB_REPOSITORY`: `xandeflix2/xandeflix-prebuilt`
- `SUPABASE_PROJECT_REF`: `cujbmyhitgomlgwfkaat`
- `ANDROID_PACKAGE_ID`: `com.xandeflix.prebuilt`
- `UNIVERSAL_APK_PLUS_PROVISIONING_PACKAGE`: TARGET
- `EXTERNAL_PREPROCESSING`: TARGET
- `DEVICE_LOCAL_RUNTIME_CATALOG`: TARGET
- `DEVICE_DIRECT_PLAYBACK`: TARGET
- `DATA_CONTRACT_SCHEMA_VERSION`: 1
- `EXTERNAL_PIPELINE_RUNTIME`: NODE_TYPESCRIPT
- `INGESTION_ADAPTER_PATTERN`: REQUIRED
- `INGESTION_ID_STRATEGY`: DETERMINISTIC
- `PROVISIONING_PACKAGE_FORMAT`: ZIP
- `PACKAGE_FORMAT_VERSION`: 1
- `PACKAGE_CONTENTS`: manifest.json + catalog.json
- `CATALOG_HASH_ALGORITHM`: SHA256
- `PACKAGE_CONTENT_HASH_ALGORITHM`: SHA256
- `UNKNOWN_PACKAGE_FILES`: REJECT
- `PACKAGE_VALIDATION`: FAIL_CLOSED
- `LOGICAL_PACKAGE_DETERMINISM`: REQUIRED
- `ZIP_PATH_TRAVERSAL_PROTECTION`: REQUIRED
- `DEVICE_IMPORT_MODEL`: STAGING_THEN_PROMOTION
- `ACTIVE_POINTER`: REQUIRED
- `ACTIVE_GENERATION_SAFETY`: REQUIRED
- `FAILED_IMPORT_PRESERVES_ACTIVE`: REQUIRED
- `STAGING_READBACK_VALIDATION`: REQUIRED
- `SAME_PACKAGE_REIMPORT`: IDEMPOTENT
- `NO_FALSE_EMPTY`: REQUIRED
- `APP_PRIVATE_STORAGE`: REQUIRED
- `LOCAL_STORAGE_STRATEGY`: CAPACITOR_FILESYSTEM_CANONICAL_JSON
- `CATALOG_UI_DATA_SOURCE`: ACTIVE_LOCAL_CATALOG_ONLY
- `CATALOG_UI_NETWORK`: NONE
- `NO_FALSE_EMPTY_UI`: REQUIRED
- `CATALOG_READ_MODEL`: EPHEMERAL_VIEW_MODEL
- `UNBOUNDED_DOM_RENDER`: PROHIBITED
- `TV_INPUT_BASELINE`: DOM_FOCUS_DPAD
- `INPUT_MODES`: TOUCH_MOUSE_KEYBOARD_DPAD_BASELINE
- `PACKAGE_FORMAT_V1`: PRESERVED
- `PACKAGE_FORMAT_V2`: SEARCH_ENABLED
- `SEARCH_INDEX_FORMAT`: CANONICAL_JSON_INVERTED_INDEX_V1
- `SEARCH_INDEX_VERSION`: 1
- `SEARCH_NORMALIZATION_VERSION`: 1
- `SEARCH_INDEX_BUILD`: EXTERNAL_PREBUILT
- `SEARCH_STORAGE`: CAPACITOR_FILESYSTEM_CANONICAL_JSON
- `SEARCH_INDEX_TRANSPORTABILITY`: PROVEN_SYNTHETIC_LOGICAL
- `SEARCH_SEED_STRATEGY`: PREBUILT_INDEX_REQUIRED_FOR_FAST_SEARCH
- `SEARCH_INDEX_DEVICE_STARTUP_REBUILD`: PROHIBITED
- `SEARCH_QUERY_NETWORK`: NONE
- `SEARCH_RANKING`: DETERMINISTIC_WEIGHTED_TEXT_V1
- `SEARCH_DOCUMENT_KINDS`: MOVIE_SERIES
- `SEARCH_INDEX_DATA_MINIMIZATION`: REQUIRED
- `SEARCH_ENABLED_PACKAGE_FORMAT_VERSION`: 2
- `PACKAGE_FORMAT_V1_BACKWARD_COMPATIBLE`: REQUIRED
- `PLAYBACK_CONNECTION`: DEVICE_TO_SOURCE_DIRECT
- `CENTRAL_STREAM_PROXY`: PROHIBITED
- `CENTRAL_VIDEO_RELAY`: PROHIBITED
- `CENTRAL_IPTV_STREAMING_BACKEND`: PROHIBITED
- `PLAYBACK_ENGINE_ANDROID`: MEDIA3_EXOPLAYER
- `PLAYBACK_PROTOCOLS_BASELINE`: HLS_PROGRESSIVE
- `STREAM_REF_CREDENTIAL_POLICY`: CREDENTIAL_FREE
- `SOURCE_AUTH_BOUNDARY`: RUNTIME_ONLY_NO_CATALOG_SECRET
- `RESOLVED_PLAYBACK_REQUEST_PERSISTENCE`: NONE
- `PLAYBACK_QUERY_NETWORK_PATH`: DEVICE_TO_SOURCE_ONLY
- `PLAYBACK_URI_ALLOWLIST`: HTTPS_BASELINE
- `PLAYBACK_HEADERS_LOGGING`: PROHIBITED
- `NATIVE_PLAYER_ACTIVITY_EXPORTED`: NAO
- `NATIVE_PLAYER_DPAD_BASELINE`: MEDIA3_STANDARD_CONTROLS
- `STREAM_RESOLVER_MEDIA_BYTES_HANDLED`: 0

---

## 4. Decisoes Abertas (DECISIONS_OPEN)

1. `REAL_SOURCE_AUTH_STRATEGY`: Arquitetura final de autenticação com provedores de origem em produção.
2. `USER_SOURCE_BINDING`: Modelo de associação entre credenciais de usuário e provisionamento personalizado de pacotes.
3. `PACKAGE_SIGNING_STRATEGY`: Protocolo criptográfico para assinatura e verificação de integridade/autoria do pacote.
4. `PACKAGE_ENCRYPTION`: Algoritmo e chaveamento de criptografia em repouso e trânsito para pacotes de provisionamento.
5. `PLAYER_SECURE_FLAG_POLICY`: Política de bloqueio de captura de tela e recents via FLAG_SECURE (aberto para G10).
6. `PERSISTENT_PLAYBACK_PROGRESS`: Mecanismo e modelo de dados para persistência contínua de histórico de reprodução e resume.
7. `ARTWORK_CACHE_POLICY`: Política de download, resolução, compressão e expiração de posters e imagens de catálogo.
8. `FULL_TV_SPATIAL_NAVIGATION`: Navegação espacial avançada bidimensional com aceleração de cursor ou mesh de nós (G11).
9. `PERFORMANCE_SLA`: Metas contratuais de tempo de abertura e resposta homologadas em hardware físico (G11/G12).
10. `INCREMENTAL_UPDATE_STRATEGY`: Algoritmo para geração e aplicação de deltas/diffs de catálogo sem re-download completo (G9).
11. `ROLLBACK_FULL`: Política avançada de retenção de múltiplos snapshots históricos e reversão manual de versão.
12. `SNAPSHOT_RETENTION`: Política de limpeza e expiração de snapshots antigos acumulados no armazenamento privado.
13. `SIZE_LIMITS`: Limites contratuais de tamanho para pacotes e footprint de memória em hardware de entrada.

---

## 5. Bloqueios Conhecidos (KNOWN_BLOCKERS)

- Nenhum bloqueador ativo que impeca a conclusao do Gate G0.
- Observacao externa nao-bloqueadora: Visibilidade do novo projeto Supabase em conectores de terceiros (ChatGPT connector) pendente de propagacao.

---

## 6. Riscos Mapeados (RISKS)

1. Incompatibilidade na portabilidade de indices pre-construidos para motores Web/Android locais.
2. Latencia excessiva na geracao de pacotes de provisionamento para catalogos acima de 100.000 itens.
3. Consumo de armazenamento no dispositivo cliente com cache de posters/artworks.

---

## 7. Status de Seguranca (SECURITY_STATUS)

- `.gitignore` configurado estritamente.
- `.env.example` livre de segredos reais.
- Nenhuma chave `service_role`, credencial de fonte ou chave privada presente no repositorio.

---

## 8. Validacao em Dispositivos (DEVICE_VALIDATION_STATUS)

- `NOT_REQUIRED_G5` (logica de bootstrap, persistencia local transacional e compilacao nativa Android validadas; validacao fisica ampla permanece reservada ao G11).

---

## 9. Linhas de Base (BASELINES)

- **PERFORMANCE_BASELINES**: Evidencias empiricas registradas no G5 (PACKAGE_VALIDATE_MS=17ms, STAGING_WRITE_MS=0ms, STAGING_READBACK_VALIDATE_MS=1ms, PROMOTION_MS=3ms, TOTAL_BOOTSTRAP_MS=21ms; PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM).
- **STORAGE_BASELINES**: Evidencias empiricas no G5 (PACKAGE_SIZE_BYTES=2045, CATALOG_SIZE_BYTES=8368, ACTIVE_STORAGE_SIZE_BYTES=6718).

---

## 10. Proximo Gate (NEXT_GATE)

- **NEXT_GATE**: `XANDEFLIX_PREBUILT_G6_CATALOG_UI`
- **NEXT_GATE_STARTED**: `NAO`

---

## 11. Historico de Alteracoes (CHANGELOG)

- **Ciclo G0 (Execucao Tecnica)**:
  - Preflight read-only executado e documentado;
  - Isolamento confirmado contra `timbocorrea/xandeflix-2.0`;
  - Criacao da baseline documental em `/docs` e raiz (`AGENTS.md`, `README.md`, `.gitignore`, `.env.example`);
  - Registro formal de identidade Git, Supabase e Android Package ID;
  - Auditoria de segredos executada com sucesso;
  - Registro historico: G0_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM.

- **Adjudicacao G0 e Canonicalizacao (2026-09-04)**:
  - G0 formalmente adjudicado pelo Chat Mestre como PASS;
  - Fundacao e isolamento aprovados;
  - MVP_PROGRESS_PERCENT atualizado de 0 para 5;
  - CURRENT_GATE avancado para G1 (NEXT_AUTHORIZABLE_GATE=G1);
  - G1 permanece NOT_STARTED (G1_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para primeiro commit e push canonicos na branch origin/main.

- **Ciclo G1 (App Skeleton)**:
  - App universal inicializado em React + TypeScript + Vite + Capacitor;
  - Configuracao estrita de TypeScript (`typecheck` PASS);
  - Build web executado com sucesso (`build` PASS);
  - Prova de inicializacao do runtime web executada (`HTTP 200 OK`);
  - Projeto nativo Android gerado via Capacitor (`com.xandeflix.prebuilt`);
  - Isolamento de package Android confirmado contra `com.xandeflix.app`;
  - Compilacao Android concluida com sucesso (`assembleDebug` PASS);
  - APK debug gerado (`app-debug.apk`, 4.107.263 bytes);
  - Auditoria de segredos e dependencias minimas confirmada;
  - Registro historico: G1_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G1 e Canonicalizacao (2026-09-04)**:
  - G1 formalmente adjudicado pelo Chat Mestre como PASS;
  - Skeleton do aplicativo universal aprovado;
  - MVP_PROGRESS_PERCENT atualizado de 5 para 12;
  - CURRENT_GATE avancado para G2 (NEXT_AUTHORIZABLE_GATE=G2);
  - G2 permanece NOT_STARTED (G2_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para commit e push canonicos na branch origin/main.

- **Ciclo G2 (Prebuilt Data Contract)**:
  - Definicao formal do contrato canonico humano em `docs/DATA_CONTRACT.md`;
  - Definicao formal do contrato machine-readable em `schemas/prebuilt-catalog.schema.json` (Draft 2020-12);
  - Tipos TypeScript estritos sem semantica concorrente em `src/contracts/catalog.ts`;
  - Criacao de fixture sintetica com dados artificiais seguros em `fixtures/prebuilt-catalog.synthetic.json`;
  - Script de validacao automatizado em `scripts/validate-data-contract.mjs` (`npm run contract:check`);
  - Implementacao e aprovacao de 7 testes negativos de contrato em memoria;
  - Higiene estrita do scaffold Android: remocao de residuos `com.getcapacitor.myapp` / `com.getcapacitor.app` nos testes para `com.xandeflix.prebuilt`;
  - Revalidacao completa de typecheck, build web e compilacao nativa Android (`assembleDebug`);
  - Auditoria de segredos e isolamento confirmada (sem credenciais reais, sem service_role, sem conexao Supabase);
  - Registro historico: G2_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G2 e Canonicalizacao (2026-09-04)**:
  - G2 formalmente adjudicado pelo Chat Mestre como PASS;
  - Contrato de dados canonico do catalogo PREBUILT aprovado (JSON Schema Draft 2020-12, TypeScript e documentacao);
  - MVP_PROGRESS_PERCENT atualizado de 12 para 22;
  - CURRENT_GATE avancado para G3 (NEXT_AUTHORIZABLE_GATE=G3);
  - G3 permanece NOT_STARTED (G3_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para commit e push canonicos na branch origin/main.

- **Ciclo G3 (External Ingestion Pipeline)**:
  - Implementacao da arquitetura desacoplada de pipeline externo com interface `SourceAdapter`;
  - Implementacao do `SyntheticSourceAdapter` validando e consumindo fixtures sinteticas controladas;
  - Criacao do modelo intermediario bruto isolado (`RawSourceCatalog`, `RawMovie`, `RawSeries`, `RawSeason`, `RawEpisode`);
  - Motor de normalizacao deterministica (`INGESTION_ID_STRATEGY=DETERMINISTIC`) com IDs estaveis (`syn:movie:*`, `syn:series:*`, etc.);
  - Normalizacao segura de categorias e generos com deduplicacao por slug e mapeamento relacional;
  - Tratamento estrito de referencias de streaming e artwork (`STREAM_CREDENTIAL_EMBEDDING=PROHIBITED`);
  - Calculo automatico e exato de contagens declaradas (`SnapshotCounts`) e geracao deterministica de `snapshotId` via SHA-256;
  - Validacao pos-normalizacao automatica contra JSON Schema canonico Draft 2020-12 e integridade referencial;
  - Prova de determinismo via replay identico (`PIPELINE_DETERMINISTIC=SIM`);
  - Criacao de scripts `npm run ingestion:synthetic` e `npm run ingestion:negative` com 8 testes negativos fail-closed aprovados;
  - Elaboracao da documentacao tecnica completa em `docs/INGESTION_PIPELINE.md` e formalizacao dos fluxos funcionais no `docs/FSD.md`;
  - Registro de decisoes arquiteturais fechadas em `docs/DECISIONS.md`;
  - Revalidacoes tecnicas de regressao (contract:check, typecheck, build web, android unit tests e assembleDebug) concluidas com PASS;
  - Registro historico: G3_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G3 e Canonicalizacao (2026-09-04)**:
  - G3 formalmente adjudicado pelo Chat Mestre como PASS;
  - Pipeline externo de ingestao e normalizacao aprovado com motor deterministico e fixtures sinteticas;
  - Observacao de processo nao-bloqueadora registrada em docs/ERRORS_AND_BLOCKERS.md (emissao de mensagem intermediaria informativa antes do relatorio terminal sob QUIET_UNTIL_FINAL_REPORT, com G3_PASS_INVALIDATED=NAO);
  - MVP_PROGRESS_PERCENT atualizado de 22 para 34;
  - CURRENT_GATE avancado para G4 (NEXT_AUTHORIZABLE_GATE=G4);
  - G4 permanece NOT_STARTED (G4_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para commit e push canonicos na branch origin/main.

- **Ciclo G4 (Provisioning Package)**:
  - Implementacao do formato de pacote inicial canônico em ZIP (`PROVISIONING_PACKAGE_FORMAT=ZIP`);
  - Definicao de `PACKAGE_FORMAT_VERSION=1` e `SCHEMA_VERSION=1`;
  - Estrutura interna minima estrita contendo exclusivamente `manifest.json` e `catalog.json`;
  - Implementacao do calculo de integridade SHA-256 via `node:crypto` (`catalogSha256` e `packageContentHash`);
  - Determinismo estrito comprovado via replay (`LOGICAL_PACKAGE_DETERMINISTIC=SIM`, `BYTE_IDENTICAL_ZIP=SIM`);
  - Implementacao de construtor de pacote com fail-closed (`PackageBuilder`);
  - Implementacao de validador completo (`PackageValidator`) com protecao contra path traversal (`ZIP_PATH_TRAVERSAL_PROTECTION=PASS`);
  - Politica de rejeicao de arquivos desconhecidos (`UNKNOWN_PACKAGE_FILES=REJECT`);
  - Adicao de scripts CLI `npm run provisioning:build` e `npm run provisioning:check`;
  - Aprovacao da suite completa de 11 testes negativos obrigatorios (adulteracao, hash mismatch, size mismatch, versao incompativel, divergencia de snapshot, arquivo extra, ausencia de manifest/catalog e path traversal);
  - Elaboracao da documentacao tecnica completa em `docs/PROVISIONING_PACKAGE.md`;
  - Formalizacao de 5 fluxos funcionais em `docs/FSD.md` (`F-G4-001` a `F-G4-005`);
  - Registro de decisoes arquiteturais fechadas em `docs/DECISIONS.md`;
  - Auditoria de segredos e isolamento confirmada (sem chaves privadas, sem tokens de longa duracao, sem conexao Supabase, sem importacao no dispositivo cliente);
  - Revalidacoes tecnicas completas com PASS (contract:check, ingestion:synthetic, ingestion:negative, provisioning:build, provisioning:check, typecheck, build web, android unit tests e assembleDebug);
  - Registro historico: G4_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G4 e Canonicalizacao (2026-09-05)**:
  - G4 formalmente adjudicado pelo Chat Mestre como PASS;
  - Artefato de provisionamento ZIP aprovado (versionado, determinístico, imutável e verificável);
  - Observação de processo não-bloqueadora registrada em docs/ERRORS_AND_BLOCKERS.md (emissão de mensagem intermediária informativa sobre teste Gradle durante QUIET_UNTIL_FINAL_REPORT, com G4_PASS_INVALIDATED=NAO);
  - MVP_PROGRESS_PERCENT atualizado de 34 para 44;
  - CURRENT_GATE avançado para G5 (NEXT_AUTHORIZABLE_GATE=G5);
  - G5 permanece NOT_STARTED (G5_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Ciclo G5 (Fast Device Bootstrap)**:
  - Implementacao da arquitetura transacional de bootstrap local e persistencia do catalogo PREBUILT no cliente;
  - Adicao minima da dependencia oficial `@capacitor/filesystem` (^7.1.8) e sincronizacao Android (`npx cap sync android`);
  - Estruturacao dos modulos de bootstrap em `src/bootstrap/`: tipos canonicos (`types.ts`), abstracao de storage (`storage/storage.interface.ts`), adaptador Capacitor (`storage/capacitor-filesystem.storage.ts`), adaptador in-memory para testes/CLI (`storage/in-memory.storage.ts`), gerenciador de ponteiro ativo (`active-snapshot.ts`), importador transacional (`package-importer.ts`), gerenciador de estado (`bootstrap-state.ts`) e servico unificado (`bootstrap.service.ts`);
  - Implementacao de garantia de fail-closed e isolamento: `ACTIVE_GENERATION_SAFETY=REQUIRED`, `NO_FALSE_EMPTY=REQUIRED`, `FAIL_CLOSED_IMPORT=REQUIRED`, `FAILED_IMPORT_PRESERVES_ACTIVE=SIM`, `STAGING_READBACK_VALIDATION=REQUIRED`, `SAME_PACKAGE_REIMPORT=IDEMPOTENT`;
  - Criacao do script de verificacao automatizado `scripts/validate-device-bootstrap.mjs` (`npm run bootstrap:check`);
  - Validacao dos 8 cenarios funcionais e negativos (primeira importacao com sucesso, reimportacao idempotente, promocao de nova geracao, rejeicao de pacote adulterado, preservacao do ativo anterior em falha, rejeicao de staging parcial, preservacao do ativo em falha de gravacao de ponteiro, e estado `NO_ACTIVE_CATALOG` sem falso vazio);
  - Elaboracao da documentacao tecnica completa em `docs/DEVICE_BOOTSTRAP.md`;
  - Formalizacao de 6 fluxos funcionais em `docs/FSD.md` (`F-G5-001` a `F-G5-006`);
  - Registro de decisoes arquiteturais fechadas em `docs/DECISIONS.md`;
  - Auditoria de segredos e isolamento confirmada (sem credenciais reais, sem service_role, sem conexao Supabase, sem UI de catalogo, sem busca, sem player, sem atualizacao incremental);
  - Revalidacoes tecnicas completas com PASS (contract:check, ingestion:synthetic, ingestion:negative, provisioning:build, provisioning:check, bootstrap:check, typecheck, build web, android unit tests e assembleDebug);
  - Registro historico: G5_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G5 e Canonicalizacao (2026-09-05)**:
  - G5 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G5_FAST_DEVICE_BOOTSTRAP_CLOSED`);
  - Bootstrap rapido de dispositivo aprovado (importacao transacional, staging em quarentena, readback validation, promocao atomica via active.json e protecao contra falso vazio);
  - MVP_PROGRESS_PERCENT atualizado de 44 para 56;
  - CURRENT_GATE avancado para G6 (NEXT_AUTHORIZABLE_GATE=G6);
  - G6 permanece NOT_STARTED (G6_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para commit e push canonicos na branch origin/main.

- **Ciclo G6 (Catalog UI)**:
  - Implementação da primeira interface funcional de catálogo do Xandeflix Prebuilt consumindo EXCLUSIVAMENTE o catálogo local ativo estabelecido no G5 (`CATALOG_UI_DATA_SOURCE=ACTIVE_LOCAL_CATALOG_ONLY`, `CATALOG_NETWORK_REQUESTS=0`);
  - Auditoria de reuso read-only executada e registrada em `docs/UI_REUSE_ASSESSMENT.md` (`CODE_REUSE_PERFORMED=NAO`, `PROTECTED_REPOSITORY_WRITES=0`);
  - Camada de Read Model/View Model determinística em memória (`src/catalog/catalog-read-model.ts`, `src/catalog/catalog-view-model.ts`, `src/catalog/catalog-selectors.ts`) com índices efêmeros O(1);
  - Gating visual estrito de bootstrap: `NO_ACTIVE_CATALOG_UI=PASS`, `VALID_EMPTY_CATALOG_UI=PASS`, `NO_ACTIVE_NOT_FALSE_EMPTY=PASS`, `FAILED_IMPORT_ACTIVE_UI_CONTINUES=PASS`;
  - Páginas e componentes de catálogo implementados: Home com Hero e MediaRails temáticos, MoviesPage com filtros por categoria e CatalogGrid em lotes, SeriesPage com listagem de séries, MovieDetailPage com metadados e botão de playback desabilitado (`PLAYBACK_AVAILABLE_IN_G8`), SeriesDetailPage com seleção de temporadas e listagem de episódios;
  - Fallback visual resiliente para imagens e metadados ausentes (`Artwork.tsx`, `MISSING_ARTWORK_FALLBACK=PASS`, `MISSING_OPTIONAL_METADATA_SAFE=PASS`);
  - Limites estritos de renderização no DOM (`UNBOUNDED_DOM_RENDER_GUARD=PASS`, `HOME_RAIL_MAX_ITEMS_INITIAL=24`, `GRID_BATCH_SIZE=48`);
  - Baseline de navegação direcional por D-pad / teclado para Android TV e Fire TV Stick (`FIRST_FOCUS_ACQUIRED=PASS`, `ARROW_NAVIGATION=PASS`, `ENTER_OPENS_DETAIL=PASS`, `BACK_RETURNS_PREVIOUS_VIEW=PASS`, `FOCUS_VISIBLE=PASS`);
  - Compatibilidade com toque, mouse e teclado mantida (`INPUT_MODES=TOUCH_MOUSE_KEYBOARD_DPAD_BASELINE`);
  - Design system cinematográfico responsivo para Phone, Tablet e TV/Desktop em `src/index.css`;
  - Suíte de validação de catálogo automatizada em `scripts/validate-catalog-ui.mjs` (`npm run catalog-ui:check`, 15 testes aprovados);
  - Elaboração da documentação técnica canônica em `docs/CATALOG_UI.md`;
  - Formalização de 9 especificações funcionais em `docs/FSD.md` (`F-G6-001` a `F-G6-009`);
  - Registro de decisões arquiteturais fechadas em `docs/DECISIONS.md`;
  - Bateria completa de regressões executada com sucesso: `contract:check` PASS, `ingestion:synthetic` PASS, `ingestion:negative` PASS, `provisioning:build` PASS, `provisioning:check` PASS, `bootstrap:check` PASS, `catalog-ui:check` PASS, `typecheck` PASS, `build` PASS, `cap sync android` PASS, `gradlew test` PASS, `gradlew assembleDebug` PASS;
  - Auditoria de segredos e isolamento confirmada (sem credenciais reais, sem service_role, sem chamadas externas, sem busca, sem player, sem atualização incremental);
  - Registro histórico: G6_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G6 e Canonicalizacao (2026-09-05)**:
  - G6 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G6_CATALOG_UI_CLOSED`);
  - Auditoria complementar de escopo aprovada (`PASS_PREBUILT_G6_SCOPE_AUDIT_CLEAR_FOR_MASTER_ADJUDICATION`);
  - Adaptações de compatibilidade em `src/ingestion/validate.ts` e `src/provisioning/integrity.ts` ratificadas como `G6_REQUIRED_COMPATIBILITY_ADAPTATION`, com preservação estrita da semântica G2/G3/G4 e fail-closed;
  - Documentação de reuso em `docs/UI_REUSE_ASSESSMENT.md` atualizada para esclarecer `NEWLY_IMPLEMENTED_COMPONENTS` e `REBUILT_COMPONENTS=NENHUM`;
  - MVP_PROGRESS_PERCENT atualizado de 56 para 64;
  - CURRENT_GATE avançado para G7 (NEXT_AUTHORIZABLE_GATE=G7);
  - G7 permanece NOT_STARTED (G7_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Ciclo G7 (Prebuilt Search)**:
  - Comprovação da hipótese arquitetural de busca prebuilt (`SEARCH_INDEX_EXTERNAL_BUILD=REQUIRED`, `SEARCH_INDEX_DEVICE_STARTUP_REBUILD=PROHIBITED`, `SEARCH_QUERY_NETWORK=NONE`);
  - Implementação do formato de índice canônico independente em JSON (`CANONICAL_JSON_INVERTED_INDEX_V1`) com JSON Schema Draft 2020-12 (`schemas/prebuilt-search-index.schema.json`);
  - Criação dos módulos de normalização de texto determinística (`search-normalization.ts`, Unicode NFD, diacríticos removidos, lowercase, trim), builder externo (`search-index-builder.ts`), validador estrito fail-closed (`search-index-validator.ts`), motor de consulta em memória (`search-engine.ts`) com ranqueamento ponderado determinístico (`DETERMINISTIC_WEIGHTED_TEXT_V1`) e serviço de busca integrado ao storage do cliente (`search.service.ts`);
  - Extensão do formato de pacote de provisionamento para v2 (`SEARCH_ENABLED_PACKAGE_FORMAT_VERSION=2`) incorporando `search-index.json`, manifest estendido e hash lógico de pacote v2;
  - Garantia rigorosa de retrocompatibilidade com pacotes v1 (`PACKAGE_FORMAT_V1_BACKWARD_COMPATIBLE=PASS`, importação v1 preserva integridade do catálogo e reporta busca como indisponível sem falhas);
  - Bootstrap v2 com importação transacional em quarentena de staging, readback validation e promoção atômica para storage privado (`prebuilt/snapshots/<snapshotId>/search-index.json`);
  - Inicialização leve da busca no startup (`ON_DEVICE_FULL_REINDEX_AT_STARTUP=NAO`) carregando apenas postings serializadas;
  - Falha de índice não quebra o catálogo ativo (`INVALID_SEARCH_INDEX_PRESERVES_CATALOG=PASS`);
  - Interface de busca responsiva integrada à UI (`/search`, `SearchPage.tsx`, `SearchInput.tsx`, `SearchResults.tsx`, `SearchState.tsx`) com navegação por D-pad / teclado para TV/Android (`SEARCH_DPAD_BASELINE=PASS`) e abertura direta dos detalhes de filmes e séries (`MovieDetailPage`, `SeriesDetailPage`);
  - Execução de benchmark sintético em 240.000 documentos (`SCALE_DOCUMENT_COUNT=240000`, build externo em 12.2s, 50.2MB serializado / 6.5MB gzip, carregamento em runtime em 771ms, consultas em 1.2s - 2.8s, heap controlado com 271MB);
  - Elaboração da documentação técnica em `docs/PREBUILT_SEARCH.md` e formalização de 10 fluxos no FSD (`F-G7-001` a `F-G7-010`);
  - Bateria de testes de regressão executada com 100% de aprovação (G2, G3, G4, G5, G6, G7, typecheck, web build e android build);
  - Auditoria de segredos e isolamento confirmada (zero credenciais reais, sem service_role, sem conexões externas, sem playback G8, sem atualizações incrementais);
  - Registro histórico: G7_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G7 e Canonicalizacao (2026-09-05)**:
  - G7 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G7_PREBUILT_SEARCH_CLOSED`);
  - Busca pré-construída externa comprovada (`CANONICAL_JSON_INVERTED_INDEX_V1`), pacote de provisionamento v2 com retrocompatibilidade v1, carregamento leve sem reconstrução no startup e interface D-pad funcional;
  - Registro de risco de escala sintética não-bloqueador classificado: `SEARCH_SCALE_PERFORMANCE_RISK=OPEN_NON_BLOCKING` (`PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM`, `REAL_CATALOG_SEARCH_PROVEN=NAO`, `FIRE_STICK_SEARCH_PERFORMANCE_PROVEN=NAO`, `G7_PASS_INVALIDATED=NAO`);
  - MVP_PROGRESS_PERCENT atualizado de 64 para 74;
  - CURRENT_GATE avançado para G8 (`NEXT_AUTHORIZABLE_GATE=G8`);
  - G8 permanece NOT_STARTED (`G8_STARTED=NAO`, `NEXT_GATE_STARTED=NAO`);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Ciclo G8 (Source and Direct Playback)**:
  - Implementação da fronteira canônica de reprodução direta Device-to-Source (`PLAYBACK_CONNECTION=DEVICE_TO_SOURCE_DIRECT`, `CENTRAL_STREAM_PROXY=PROHIBITED`, `CENTRAL_VIDEO_RELAY=PROHIBITED`, `STREAM_RESOLVER_MEDIA_BYTES_HANDLED=0`);
  - Desacoplamento estrito entre metadados de catálogo e credenciais de acesso: `StreamRef` preservado rigorosamente sem senhas, tokens ou URLs completas (`STREAM_REF_CREDENTIAL_FREE=PASS`);
  - Criação do modelo em memória `RuntimeSourceContext` e validador de sessão/expiração (`SOURCE_RUNTIME_BOUNDARY=PASS`);
  - Desenvolvimento do `DirectStreamResolver` transformando logicamente referências de stream em requisições transitórias (`ResolvedPlaybackRequest`) sem persistência (`RESOLVED_PLAYBACK_REQUEST_PERSISTENCE=NONE`);
  - Integração nativa com `AndroidX Media3 ExoPlayer` (`media3-exoplayer:1.5.1`, `media3-exoplayer-hls:1.5.1`, `media3-ui:1.5.1`) via `NativePlayerActivity` (`android:exported="false"`, `PLAYER_RELEASE_ON_DESTROY=PASS`, `PLAYER_SINGLE_INSTANCE_PER_ACTIVITY=SIM`);
  - Desenvolvimento do plugin Capacitor `NativePlayerPlugin` e cliente TypeScript `NativePlayerClient` com fallback controlado para navegador web (`WEB_NATIVE_PLAYER_UNAVAILABLE=PASS`);
  - Validação estrita de segurança de URIs: `PLAYBACK_URI_ALLOWLIST=HTTPS_BASELINE`, rejeição de esquemas proibidos (`file:`, `content:`, `javascript:`, etc.) e rejeição de userinfo credentials (`URL_USERINFO_CREDENTIALS_REJECTED=PASS`);
  - Política de privacidade e logs: `PLAYBACK_HEADERS_LOGGING=PROHIBITED`, sanitização de query parameters em logs;
  - Ativação das ações de reprodução direta na interface (`MovieDetailPage` e `SeriesDetailPage`) para filmes e episódios com exibição de estados sanitizados;
  - Testes unitários Android implementados (`PlaybackIntentContractTest` e `AndroidManifestAuditTest`) com aprovação em `gradlew test` e build bem-sucedido em `gradlew assembleDebug`;
  - Elaboração da documentação arquitetural em `docs/DIRECT_PLAYBACK.md` e formalização de 10 fluxos no FSD (`F-G8-001` a `F-G8-010`);
  - Criação da suíte de validação `scripts/validate-direct-playback.mjs` (`npm run playback:check`) com 100% de aprovação;
  - Preservação integral das regressões de todos os Gates anteriores (G2, G3, G4, G5, G6, G7);
  - Auditoria de segredos e escopo: zero credenciais reais, sem service_role, sem proxy central, sem G9;
  - Registro histórico: `G8_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION`, `MVP_PROGRESS_PERCENT=74`.

- **Adjudicacao G8 e Canonicalizacao (2026-09-05)**:
  - G8 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G8_SOURCE_AND_DIRECT_PLAYBACK_CLOSED`);
  - Fronteira canônica de reprodução direta Device-to-Source aprovada (`PLAYBACK_CONNECTION=DEVICE_TO_SOURCE_DIRECT`, `CENTRAL_STREAM_PROXY=PROHIBITED`, `CENTRAL_VIDEO_RELAY=PROHIBITED`, `CENTRAL_IPTV_STREAMING_BACKEND=PROHIBITED`, `STREAM_RESOLVER_MEDIA_BYTES_HANDLED=0`);
  - `StreamRef` livre de credenciais e segredos (`STREAM_REF_CREDENTIAL_FREE=PASS`), runtime source context efêmero em memória (`SOURCE_RUNTIME_BOUNDARY=PASS`) e resolução direta sem persistência (`RESOLVED_PLAYBACK_REQUEST_PERSISTENCE=NONE`);
  - Player nativo Android implementado com AndroidX Media3 ExoPlayer (`media3-exoplayer:1.5.1`, `media3-exoplayer-hls:1.5.1`, `media3-ui:1.5.1`), `NativePlayerActivity` não exportada (`android:exported="false"`), liberação de recursos em `onDestroy`, ponte Capacitor com sanitização de cabeçalhos e fallback seguro na web (`WEB_NATIVE_PLAYER_UNAVAILABLE=PASS`);
  - Proteção de segurança comprovada: `PLAYBACK_URI_ALLOWLIST=HTTPS_BASELINE`, rejeição estrita de userinfo credentials (`URL_USERINFO_CREDENTIALS_REJECTED=PASS`) e cabeçalhos sensíveis omitidos de logs (`PLAYBACK_HEADERS_LOGGING=PROHIBITED`);
  - Ausência de fonte real e validação física registradas como não-requisitos de G8 (`REAL_SOURCE_IMPLEMENTED=NAO`, `REAL_SOURCE_AUTHENTICATED=NAO`, `REAL_SOURCE_PLAYBACK_PROVEN=NAO`, `PHYSICAL_MEDIA_PLAYING_PROVEN=NAO`, `PHYSICAL_DEVICE_VALIDATION=NOT_REQUIRED_G8`);
  - MVP_PROGRESS_PERCENT atualizado de 74 para 82;
  - **Ciclo G9 (Incremental Update)**:
  - Implementação da arquitetura de atualização incremental segura para catálogo e índice de busca (`DELTA_PACKAGE_FORMAT_VERSION=1`, `DELTA_GENERATION=EXTERNAL_PREBUILT`);
  - Vinculação estrita à base ativa: `DELTA_BASE_BINDING=STRICT` exigindo correspondência exata de `snapshotId`, `catalogVersion`, `catalogSha256` e `searchIndex.contentHash`;
  - Endereçamento determinístico por identificadores canônicos (`CATALOG_DELTA_ADDRESSING=CANONICAL_ID_BASED`) e semântica de substituição integral (`DELTA_UPSERT_SEMANTICS=FULL_ENTITY_REPLACEMENT`);
  - Proteção de armazenamento: proibição categórica de patch in-place (`IN_PLACE_ACTIVE_PATCH=PROHIBITED`) adotando isolamento em staging (`STAGING_THEN_PROMOTION`) com readback validation física e promoção atômica do ponteiro `active.json`;
  - Atomicidade lógica entre catálogo e busca no perfil `SEARCH_ENABLED`: `SEARCH_ENABLED_DELTA_ATOMICITY=CATALOG_AND_SEARCH_TOGETHER`;
  - Prevenção de reindexação pesada no dispositivo cliente: `ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE=PROHIBITED` através da aplicação direta de postings mapeadas por IDs;
  - Tolerância a falhas e preservação da geração ativa em qualquer erro: `FAILED_UPDATE_PRESERVES_ACTIVE=PASS`, `PARTIAL_TARGET_STAGING_NOT_ACTIVE=PASS`, `WRONG_BASE_NOT_PATCHED=PASS`, `FULL_PACKAGE_REQUIRED_STATE=PASS`, `OUT_OF_ORDER_DELTA_REJECTED=PASS`, `NO_FALSE_EMPTY_DELTA_GUARD=PASS`;
  - Idempotência pura em reaplicação do mesmo delta: `SAME_DELTA_REAPPLY=IDEMPOTENT`, `ACTIVE_POINTER_UNCHANGED_ON_REAPPLY=PASS`;
  - Comprovação empírica de redução de tamanho de transferência: razão de 0,0092 (41,2 KB vs 4,37 MB do pacote full) no perfil `SPARSE_1_PERCENT` com 240.000 documentos (`SPARSE_1_PERCENT_DELTA_TO_FULL_RATIO_LT_1=PASS`);
  - Execução de benchmark sintético com 240.000 documentos nos perfis SPARSE_1_PERCENT (1% = 2.400 itens alterados, apply 423ms) e MODERATE_5_PERCENT (5% = 12.000 itens alterados, apply 406ms, ratio 0.0431);
  - Evidência empírica não-SLA: `PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM`, `REAL_DEVICE_INCREMENTAL_UPDATE_PROVEN=NAO`, `FIRE_STICK_UPDATE_FAST=NAO`;
  - Elaboração da documentação arquitetural em `docs/INCREMENTAL_UPDATE.md` (36 seções canônicas) e formalização de 12 fluxos no FSD (`F-G9-001` a `F-G9-012`);
  - Criação da suíte de validação `scripts/validate-incremental-update.mjs` (`npm run update:check`) e do benchmark `scripts/benchmark-incremental-update-scale.mjs` (`npm run update:benchmark`) com 100% de aprovação;
  - Preservação integral das regressões de todos os Gates anteriores (G2, G3, G4, G5, G6, G7, G8, typecheck, web build e android build);
  - Auditoria de segredos e escopo: zero credenciais reais, sem service_role, sem package signing/encryption (G10), sem canal de rede OTA, sem G10;
  - Registro histórico: `G9_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM`.

- **Adjudicacao G9 e Canonicalizacao (2026-09-05)**:
  - G9 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G9_INCREMENTAL_UPDATE_CLOSED`);
  - Arquitetura de atualização incremental para catálogo e índice de busca aprovada (`DELTA_PACKAGE_FORMAT_VERSION=1`, `DELTA_BASE_BINDING=STRICT`, `CATALOG_DELTA_ADDRESSING=CANONICAL_ID_BASED`, `DELTA_UPSERT_SEMANTICS=FULL_ENTITY_REPLACEMENT`);
  - Imutabilidade da geração ativa mantida com isolamento em staging e promoção atômica do ponteiro `active.json` (`IN_PLACE_ACTIVE_PATCH=PROHIBITED`, `STAGING_THEN_PROMOTION=PASS`, `FAILED_UPDATE_PRESERVES_ACTIVE=PASS`);
  - Atomicidade entre catálogo e busca no perfil `SEARCH_ENABLED` comprovada (`SEARCH_ENABLED_DELTA_ATOMICITY=CATALOG_AND_SEARCH_TOGETHER`, `ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE=PROHIBITED`);
  - Benefício de transporte incremental demonstrado com redução de dados para 0,0092 do pacote full em alterações de 1% (`SPARSE_1_PERCENT_DELTA_TO_FULL_RATIO_LT_1=PASS`);
  - Registro de risco de escala sintética classificado como evidência não-bloqueadora:
    - `CLASSIFICATION`: `PERFORMANCE_EVIDENCE_RISK`
    - `GATE`: `G9_INCREMENTAL_UPDATE`
    - `STATUS`: `OPEN_NON_BLOCKING`
    - `EVIDENCE_SOURCE`: `SYNTHETIC_240K_INCREMENTAL_TEST`
    - `SPARSE_1_PERCENT`: docs=240000, changed=2400, delta_pkg=42233B, full_pkg=4585619B, ratio=0.0092, apply=423ms, total=1867ms, peak_mem=459MB
    - `MODERATE_5_PERCENT`: docs=240000, changed=12000, delta_pkg=199353B, full_pkg=4630164B, ratio=0.0431, apply=406ms, total=1575ms, peak_mem=640MB
    - `INTERPRETATION`: A vantagem de transporte incremental foi comprovada sinteticamente, porém o pico de memória observado no harness de escala justifica validação futura em hardware real.
    - `PERFORMANCE_EVIDENCE_IS_NOT_SLA`: `SIM`
    - `REAL_DEVICE_INCREMENTAL_UPDATE_PROVEN`: `NAO`
    - `G9_PASS_INVALIDATED`: `NAO`
  - MVP_PROGRESS_PERCENT atualizado de 82 para 89;
  - CURRENT_GATE avançado para G10 (`NEXT_AUTHORIZABLE_GATE=G10`);
  - G10 permanece NOT_STARTED (`G10_STATUS=NOT_STARTED`, `G10_STARTED=NAO`, `NEXT_GATE_STARTED=NAO`);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Ciclo G10 (Security & Recovery — 2026-09-05)**:
  - Implementação da camada formal de autenticidade criptográfica e recuperação resiliente para o Xandeflix Prebuilt;
  - Formato de envelope de segurança desacoplado V1 (`ArtifactSecurityEnvelope`, `securityFormatVersion=1`, `schemas/prebuilt-artifact-security.schema.json`) preservando os formatos de dados internos consolidados nos Gates G4, G7 e G9;
  - Algoritmo de assinatura estabelecido como ECDSA NIST P-256 com digest SHA-256 no formato DER (`ARTIFACT_SIGNATURE_ALGORITHM=ECDSA_P256_SHA256`);
  - Payload de assinatura canônico determinístico com ordenação alfabética estrita de propriedades (`SIGNING_PAYLOAD_CANONICALIZATION=DETERMINISTIC`);
  - Separação estrita de chaves assimétricas: chave privada externa ao repositório e ao cliente (`PRIVATE_SIGNING_KEY_LOCATION=EXTERNAL_ONLY`), ferramenta externa de assinatura CLI (`scripts/sign-provisioning-artifact.mjs`), chaves efêmeras em testes (`TEST_PRIVATE_KEY_PERSISTED=NAO`), e ausência de chaves de produção inventadas (`PRODUCTION_SIGNING_KEY_PROVISIONED=NAO`);
  - Âncoras de confiança modeladas como conjunto fixo de chaves públicas gerenciadas (`TRUST_ANCHOR_MODEL=PINNED_PUBLIC_KEY_SET`, `TrustedPublicKeyStore`) com status `ACTIVE` e `REVOKED`;
  - Verificação fail-closed compulsoria antes de descompressão ou parsing (`ArtifactVerifier`, `SECURE_IMPORT_FAIL_CLOSED=REQUIRED`);
  - Rejeição comprovada de artefatos não assinados no boundary de produção (`UNSIGNED_NEW_ARTIFACT_IMPORT=REJECT`, `PRODUCTION_IMPORT_BYPASS=NAO`);
  - Rejeições comprovadas de ataques e defeitos: adulteração de artefato (`TAMPERED_ARTIFACT_REJECTED=PASS`), assinatura forjada (`TAMPERED_SIGNATURE_REJECTED=PASS`), chave errada (`WRONG_KEY_REJECTED=PASS`), chave desconhecida (`UNKNOWN_KEY_ID_REJECTED=PASS`), chave revogada (`REVOKED_KEY_REJECTED=PASS`), discrepância de tamanho (`ARTIFACT_SIZE_MISMATCH_REJECTED=PASS`), divergência de hash (`ARTIFACT_HASH_MISMATCH_REJECTED=PASS`) e confusão de algoritmo (`ALGORITHM_CONFUSION_REJECTED=PASS`);
  - Suporte completo e retrocompatível comprovado para `FULL_PACKAGE_V1`, `FULL_PACKAGE_V2` e `DELTA_PACKAGE_V1`;
  - Arquitetura de recuperação resiliente com validação profunda no startup (`STARTUP_ACTIVE_VALIDATION=REQUIRED`, `RecoveryService`), diário de recuperação atômico (`prebuilt/recovery.json`, `RecoveryJournalManager`), retenção mínima de 2 gerações (`RECOVERY_MINIMUM_GENERATIONS=2`, `RECOVERY_BASELINE=ACTIVE_PLUS_PREVIOUS_KNOWN_GOOD`) e promoção atômica transparente da última geração íntegra conhecida (`AUTOMATIC_LAST_KNOWN_GOOD_RECOVERY=SUPPORTED`, `PREVIOUS_VALID_SNAPSHOT_RECOVERED=PASS`);
  - Prevenção formal e comprovada de falso vazio (`RECOVERY_FALSE_EMPTY_PREVENTED=PASS`);
  - Idempotência pura na recuperação (`RECOVERY_IDEMPOTENT=PASS`) e segurança contra falha de escrita no ponteiro (`RECOVERY_POINTER_WRITE_FAILURE_SAFE=PASS`);
  - Recuperação estritamente local sem tráfego de rede (`RECOVERY_NETWORK=NONE`);
  - Decisão formal sobre criptografia de pacotes: não-requisito no MVP devido à estrita ausência de dados secretos ou credenciais nos artefatos de provisionamento (`PACKAGE_ENCRYPTION_MVP_REQUIREMENT=NOT_REQUIRED_FOR_CREDENTIAL_FREE_PROVISIONING_DATA`, `PACKAGE_ENCRYPTION_IMPLEMENTED=NAO`);
  - Elaboração da documentação arquitetural em `docs/SECURITY_AND_RECOVERY.md` (23 seções canônicas) e formalização de 12 fluxos funcionais no FSD (`F-G10-001` a `F-G10-012`);
  - Suíte completa de testes de segurança e recuperação implementada em `scripts/validate-security-recovery.mjs` (`npm run security:check`) com 100% de aprovação;
  - Preservação de 100% dos testes de regressão dos Gates anteriores G2 a G9, além de typecheck, build web e compilação nativa Android (`CAP_SYNC_ANDROID=PASS`, `ANDROID_UNIT_TESTS=PASS`, `ANDROID_DEBUG_BUILD=PASS`);
  - Registro de conclusão técnica: `G10_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM`.

- **Adjudicacao G10 e Canonicalizacao (2026-09-05)**:
  - Gate G10 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G10_SECURITY_AND_RECOVERY_CLOSED`);
  - `G10_STATUS=PASS`, `G10_ADJUDICATION_CLOSED_PASS=SIM`;
  - MVP_PROGRESS_PERCENT elevado de 89 para 94 (`MVP_PROGRESS_PERCENT=94`);
  - CURRENT_GATE avançado para G11 (`NEXT_AUTHORIZABLE_GATE=G11`);
  - G11 permanece NOT_STARTED (`G11_STATUS=NOT_STARTED`, `G11_STARTED=NAO`, `NEXT_GATE_STARTED=NAO`);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Subciclo G11A (Physical Provisioning & Device Discovery — 2026-09-06)**:
  - Resolução do gap de testabilidade física e correção de descoberta de dispositivos via ADB;
  - Diagnóstico e enumeração com sucesso do Tablet Samsung SM-X610 (`RX2X301Q3KY`, Android 16, API 36) e Fire TV Stick Lite (`G071EL1313720CJ0`, Android 9, API 28);
  - Implementação de âncora de confiança de teste restrita a compilações de depuração (`DEBUG_ONLY_TEST_TRUST_ANCHOR`, `keyId: g11-physical-test-key-2026`);
  - Ponto de entrada de teste físico implementado em camada WebView (`window.__XANDEFLIX_DEBUG_IMPORT__`) e Intent receiver nativo (`DebugProvisioner`), compilados exclusivamente no source set `src/debug`;
  - Isolamento estrito de produção comprovado: no source set `src/release`, `DebugProvisioner` é um stub inerte (`RELEASE_DEBUG_PROVISIONER_BEHAVIOR=INERT_NO_IMPORT_CAPABILITY`), a chave de teste é puramente inexistente (`RELEASE_TEST_TRUST_KEY_PRESENT=NAO`), o entrypoint é omitido (`RELEASE_DEBUG_IMPORT_ENTRYPOINT_PRESENT=NAO`), e auditoria do APK de release comprovou ausência absoluta de chaves privadas (`PRIVATE_SIGNING_KEY_IN_APK=NAO`);
  - Importação de pacote sintético assinado (Full Package v2 com catálogo e índice de busca) executada via `SecureArtifactImportService` com validação de assinatura ECDSA P-256 e digest SHA-256, staging, readback e promoção atômica com sucesso em ambos os dispositivos (`SIGNED_SYNTHETIC_PACKAGE_IMPORT=PASS`);
  - Rejeição física comprovada de artefatos unsigned (`PHYSICAL_UNSIGNED_ARTIFACT_REJECTED=PASS`) e adulterados (`PHYSICAL_TAMPERED_ARTIFACT_REJECTED=PASS`);
  - Validação funcional completa no Tablet SM-X610: Home, Filmes, Séries, Detalhes, Busca Local, touch, baseline D-pad, restart, persistência e prevenção de falso vazio (`TABLET_HOME=PASS`, `TABLET_SEARCH=PASS`, `TABLET_CRASH_COUNT=0`, `TABLET_ANR_COUNT=0`);
  - Validação funcional completa no Fire TV Stick Lite: navegação direcional D-pad (UP, DOWN, LEFT, RIGHT, ENTER, BACK), anel de foco de alto contraste visível, sem focus traps, teclado virtual de busca e retorno sem falsos vazios (`FIRE_STICK_HOME=PASS`, `FIRE_STICK_DPAD=PASS`, `FIRE_STICK_SEARCH=PASS`, `FIRE_STICK_CRASH_COUNT=0`, `FIRE_STICK_ANR_COUNT=0`);
  - Preservação da coexistência pacífica e isolamento do aplicativo protegido `com.xandeflix.app`;
  - Adjudicação formal do subciclo pelo Chat Mestre: `RESULT=PASS_PREBUILT_G11A_PHYSICAL_PROVISIONING_AND_DEVICE_DISCOVERY_CLOSED`, `G11A_STATUS=PASS`, `G11_STATUS=IN_PROGRESS`, `MVP_PROGRESS_PERCENT=94`;
  - Smartphone Android físico mantido pendente para o subciclo `G11B` (`PHONE_VALIDATION_REMAINING=SIM`).



