# Arquitetura de Atualização Incremental (Gate G9)

> **Status**: Adjudicação Técnica Concluída (COMPLETE_PENDING_MASTER_ADJUDICATION)  
> **Ciclo**: `XANDEFLIX_PREBUILT_G9_INCREMENTAL_UPDATE`  
> **Formato de Pacote Delta**: `DELTA_PACKAGE_FORMAT_VERSION = 1`  
> **Princípio Fundamental**: `ACTIVE_SNAPSHOT_IMMUTABLE_DURING_UPDATE = REQUIRED` & `IN_PLACE_ACTIVE_PATCH = PROHIBITED`

---

## 1. Objetivo
Estabelecer uma arquitetura de atualização incremental segura e determinística para o catálogo PREBUILT e, quando aplicável, para o índice de busca (`SearchIndex`), eliminando a necessidade de re-download obrigatório de pacotes completos em cenários de alterações esparsas, sem jamais modificar a geração ativa in-place.

## 2. Escopo
- **Em Escopo**:
  - Especificação e validação de contratos de delta para catálogo e busca.
  - Geração externa de pacotes delta (`delta-manifest.json`, `catalog-delta.json`, `search-index-delta.json`).
  - Verificação estrita de vinculação à base (`DELTA_BASE_BINDING = STRICT`).
  - Aplicação de delta em staging isolado (`STAGING_THEN_PROMOTION`).
  - Validação estrita de integridade e recálculo de hashes SHA-256 e de conteúdo.
  - Promoção atômica de ponteiro ativo preservando integridade lógica e atômica.
  - Tratamento determinístico de falhas (`FAILED_UPDATE_PRESERVES_ACTIVE`).
  - Demonstração empírica de redução de tamanho de transferência (`SPARSE_1_PERCENT_DELTA_TO_FULL_RATIO_LT_1`).
  - Benchmark de escala sintética com 240.000 documentos.
- **Fora de Escopo**:
  - G10 (Assinatura e encriptação de pacotes, recuperação avançada).
  - Canais de distribuição em rede, polling, push notifications, OTA, Supabase Realtime, FCM.
  - Alterações em contratos full packages V1 e V2 existentes.
  - Modificações na camada de playback direto (G8).
  - Fontes e dados reais de catálogo ou produção.

## 3. Diferença entre Full Package e Delta Package
- **Full Package (Format V1/V2)**: Artefato ZIP autocontido contendo `manifest.json`, `catalog.json` e, no perfil V2, `search-index.json`. Permite inicialização fria (bootstrapping) sem qualquer dependência de estado prévio no dispositivo.
- **Delta Package (Format V1)**: Artefato de transformação declarativa e vinculada contendo `delta-manifest.json`, `catalog-delta.json` e opcionalmente `search-index-delta.json`. Representa estritamente as mutações entre um `BASE_SNAPSHOT` específico e um `TARGET_SNAPSHOT` final. Não é um snapshot independente nem pode ser aplicado sobre bases divergentes.

## 4. Delta Format Version
- Definido formalmente como `DELTA_PACKAGE_FORMAT_VERSION = 1`.
- Mantém versionamento isolado dos pacotes full (V1 e V2), prevenindo ambiguidades conceituais.

## 5. Delta Manifest
O arquivo canônico `delta-manifest.json` governa a compatibilidade e integridade do pacote delta:
- `deltaFormatVersion`: 1
- `baseSnapshotId`, `targetSnapshotId`
- `baseCatalogVersion`, `targetCatalogVersion`
- `baseCatalogSha256`, `targetCatalogSha256`
- `catalogDeltaFile`: `catalog-delta.json`
- `catalogDeltaSha256`, `catalogDeltaSizeBytes`
- `targetPackageProfile`: `CATALOG_ONLY` ou `SEARCH_ENABLED`
- `searchDeltaFile`: `search-index-delta.json` (quando `SEARCH_ENABLED`)
- `baseSearchIndexContentHash`, `targetSearchIndexContentHash` (quando `SEARCH_ENABLED`)
- `searchDeltaSha256`, `searchDeltaSizeBytes` (quando `SEARCH_ENABLED`)
- `targetSearchIndexSha256` (quando `SEARCH_ENABLED`)
- `deltaContentHash`: SHA-256 canônico das propriedades imutáveis e hashes dos arquivos componentes.
- `generatedAt`, `generator`

## 6. Strict Base Binding
A aplicação de um delta incremental exige correspondência binária e lógica exata com a geração atualmente ativa:
- `activePointer.snapshotId === manifest.baseSnapshotId`
- `activePointer.catalogVersion === manifest.baseCatalogVersion`
- `SHA256(activeCatalog) === manifest.baseCatalogSha256`
- Para `SEARCH_ENABLED`: `activeSearchIndex.contentHash === manifest.baseSearchIndexContentHash`
Se qualquer item divergir, o delta é sumariamente rejeitado e o sistema sinaliza `FULL_PACKAGE_REQUIRED`, mantendo o snapshot ativo intocado.

## 7. Catalog Delta
Estrutura declarativa canônica contendo:
- `deltaVersion`: 1
- `baseSnapshotId`, `targetSnapshotId`
- `baseCatalogVersion`, `targetCatalogVersion`
- `targetMetadata`: Metadados completos do catálogo final.
- Coleções: `categories`, `genres`, `movies`, `series`, `seasons`, `episodes`, `streams`, `artworks`. Cada uma dividida em `upsert` e `removeIds`.

## 8. ID-Based Addressing
Diferente de formatos posicionais (como RFC 6902 JSON Patch), o delta trabalha exclusivamente por identificadores canônicos imutáveis (`syn:movie:1001`, etc.). Isso elimina ambiguidades decorrentes de ordenações intermediárias e garante aplicação determinística independente da ordem dos elementos na lista.

## 9. Upsert Semantics
A semântica de `upsert` é estritamente de substituição integral da entidade (`FULL_ENTITY_REPLACEMENT`):
- Se o ID não existe na coleção base: adiciona a entidade.
- Se o ID já existe na coleção base: substitui integralmente a entidade existente pelos dados fornecidos no delta.
Não há mesclagem parcial de campos (evita estados zumbis ou corrupção sutil).

## 10. Remove Semantics
A propriedade `removeIds` declara a lista de IDs a serem expurgados da coleção. Remoções são validadas quanto à integridade referencial antes da promoção atômica.

## 11. Determinismo
Catálogos base e target idênticos submetidos ao `CatalogDeltaBuilder` e `SearchDeltaBuilder` produzem:
- Exatamente as mesmas coleções delta ordenadas por ID.
- Exatamente o mesmo `deltaContentHash`.
- Arquivo ZIP determinístico byte a byte com timestamps canônicos fixos.

## 12. External Delta Generation
A computação de diferenças (diffing) é responsabilidade exclusiva de ferramentas externas de pré-construção (`DeltaPackageBuilder`). O dispositivo móvel/TV nunca é onerado com o cálculo de diferenças de grandes volumes de dados.

## 13. Search-Index Delta
Representação declarativa das alterações no índice de busca invertido:
- `documentUpserts`: Documentos de busca adicionados ou atualizados.
- `documentRemoveIds`: IDs de documentos removidos.
- `postingUpserts`: Mapeamento `token -> [docIds finais]`.
- `postingRemoveTokens`: Tokens desativados.
- `targetDocumentCount`, `targetTokenCount`, `targetContentHash`.
- `targetGeneratedAt`, `targetGenerator` para determinismo de serialização física.

## 14. Posting Semantics
Para tokens afetados, `postingUpserts` declara a lista final canônica e ordenada de IDs de documentos associados àquele termo. O dispositivo apenas converte IDs para índices posicionais no array de documentos target, sem refazer tokenização ou reindexação.

## 15. Catalog/Search Atomicity
Para pacotes com perfil `SEARCH_ENABLED`, o catálogo target e o índice de busca target formam uma única geração lógica indissociável. Se a validação do índice target falhar, o catálogo target não é promovido.

## 16. Target Hash Verification
Antes de qualquer promoção de estado, o dispositivo reconstrói as representações target completas em memória e valida:
- `SHA256(targetCatalog) === manifest.targetCatalogSha256`
- `SHA256(targetSearchIndex) === manifest.targetSearchIndexSha256`
- `targetSearchIndex.contentHash === manifest.targetSearchIndexContentHash`
- Validação estrita do contrato G2 para o catálogo e validador G7 para o índice de busca.

## 17. Staging
Todo o processo de materialização é conduzido em diretório isolado de staging: `staging/<targetSnapshotId>/`.
A geração ativa `snapshots/<activeSnapshotId>/` permanece em modo somente leitura durante toda a fase de preparação.

## 18. Readback Validation
Após a escrita dos arquivos reconstruídos em staging (`catalog.json` e `search-index.json`), o serviço efetua a releitura física dos arquivos do disco/storage e revalida os hashes SHA-256 para comprovar que nenhuma corrupção de I/O ocorreu.

## 19. Atomic Promotion
A ativação da nova geração ocorre exclusivamente pela atualização atômica do arquivo `active.json` (`ActivePointer`). Novas leituras passam a referenciar imediatamente o novo snapshot. Leitores ativos pré-existentes concluem suas operações sobre a geração anterior sem interferência.

## 20. Failure Preservation
Se qualquer etapa do processo falhar (validação do ZIP, base mismatch, erro de aplicação, integridade referencial quebrada, hash mismatch ou falha de escrita em staging):
- O processo é abortado imediatamente (`fail-closed`).
- A área de staging corrompida/parcial é descartada.
- O ponteiro `active.json` permanece inalterado apontando para o snapshot anterior conhecido como bom.

## 21. Idempotency (Replay)
Reaplicar um delta cuja versão e snapshot já sejam os atualmente ativos (`previousPointer.snapshotId === manifest.targetSnapshotId`) é tratado como operação idempotente com status de sucesso (`UPDATE_SUCCESS`), sem duplicar snapshots nem reescrever ponteiros.

## 22. Out-of-Order Delta Rejection
A tentativa de aplicar um delta fora de sequência (ex: base N+1 quando o dispositivo está na base N) resulta em rejeição sumária e transição para o estado `FULL_PACKAGE_REQUIRED`.

## 23. Full Package Required Fallback
Sempre que ocorrer incompatibilidade de base (`BASE_MISMATCH`), salto de cadeia de deltas ou perfil incompatível, o serviço retorna o estado explícito `FULL_PACKAGE_REQUIRED` para que a camada de orquestração solicite o download de um pacote full completo.

## 24. Profile Compatibility
- Base `CATALOG_ONLY` com delta `CATALOG_ONLY`: Permitido.
- Base `SEARCH_ENABLED` com delta `SEARCH_ENABLED`: Permitido.
- Mudanças de perfil cruzadas (`CATALOG_ONLY` -> `SEARCH_ENABLED` ou vice-versa) são rejeitadas via delta e exigem pacote full (`CROSS_PROFILE_DELTA = REJECT_REQUIRE_FULL_PACKAGE`).

## 25. No In-Place Active Patch
É terminantemente proibido modificar os arquivos do catálogo ou índice ativos diretamente no local. Todo update segue `STAGING_THEN_PROMOTION`.

## 26. Target Full Snapshot Storage
Embora o transporte do delta seja incremental (economizando banda e tempo de download), o armazenamento no dispositivo resulta em um snapshot canônico completo persistido em `snapshots/<targetSnapshotId>/`. Isso preserva isolamento, simplicidade de leitura e facilidade de depuração.

## 27. Search No-Full-Reindex
O dispositivo não recalcula índices de busca a partir do catálogo completo durante atualizações incrementais (`ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE = PROHIBITED`), honrando a premissa de eficiência em hardware restrito como Fire Stick / Android TV.

## 28. Security
- Proteção estrita contra Path Traversal em arquivos ZIP (`DELTA_PATH_TRAVERSAL_PROTECTION = REQUIRED`).
- Rejeição de arquivos estranhos ou não autorizados no ZIP (`DELTA_UNKNOWN_FILES = REJECT`).
- Auditoria contínua de segredos: deltas não contêm senhas, chaves de API, credenciais de fonte ou cabeçalhos de autenticação (`DELTA_SECRETS_EXPOSURE = NAO`).

## 29. Unsigned Delta Limitation
O Gate G9 foca estritamente na estrutura declarativa, integridade de dados e aplicação determinística. A comprovação criptográfica de autoria do pacote delta (`PACKAGE_SIGNING`) permanece em aberto para o Gate G10 (`DELTA_AUTHENTICITY_CRYPTOGRAPHICALLY_PROVEN = NAO`).

## 30. Benchmark de Escala (240.000 Documentos)
Avaliado em ambiente controlado com 240.000 títulos sintéticos:
- **Perfil SPARSE_1_PERCENT (1% = 2.400 alterações)**:
  - Tamanho do pacote full: 4,58 MB (4.585.619 bytes)
  - Tamanho do pacote delta: 41,2 KB (42.233 bytes)
  - Razão Delta/Full: **0,0092** (< 1% do pacote full)
  - Tempo de aplicação no dispositivo: 423 ms
  - Tempo total de atualização: 1.867 ms
  - Pico de memória: 459 MB
- **Perfil MODERATE_5_PERCENT (5% = 12.000 alterações)**:
  - Tamanho do pacote full: 4,42 MB (4.630.164 bytes)
  - Tamanho do pacote delta: 194,7 KB (199.353 bytes)
  - Razão Delta/Full: **0,0431** (< 4,5% do pacote full)
  - Tempo de aplicação no dispositivo: 406 ms
  - Tempo total de atualização: 1.575 ms
  - Pico de memória: 640 MB

## 31. Performance Evidence is Not SLA
As métricas empíricas coletadas no benchmark representam dados preliminares em hardware de desenvolvimento. Não constituem SLAs contratuais nem garantem performance idêntica em dispositivos embarcados reais (`PERFORMANCE_EVIDENCE_IS_NOT_SLA = SIM`, `FIRE_STICK_UPDATE_FAST = NAO`).

## 32. Limitações
- Cadeias de delta complexas (N -> N+2 em salto único) não são resolvidas; deltas devem ser sequenciais ou exigir pacote full.
- Pacotes delta não possuem assinatura nem criptografia neste Gate (previstos para G10).
- Canal de distribuição e descoberta de atualizações permanece aberto.

## 33. Relação com Gates Anteriores e Posteriores (G8 -> G9 -> G10)
- **G8 (Playback)**: Manteve-se intacto. Leituras ativas durante o staging continuam na geração anterior sem interrupção de mídia.
- **G9 (Incremental Update)**: Introduziu a capacidade de atualizar catálogos e índices de forma incremental preservando a arquitetura imutável de snapshots.
- **G10 (Security & Recovery)**: Receberá a base para introduzir assinatura de pacotes, verificações de autenticidade, recuperação resiliente de integridade e políticas de rollback/retenção.

## 34. Decisões Arquiteturais Fechadas
- `INCREMENTAL_UPDATE_STRATEGY = EXTERNAL_ID_BASED_DELTA_TO_STAGING_FULL_TARGET`
- `DELTA_PACKAGE_FORMAT_VERSION = 1`
- `DELTA_GENERATION = EXTERNAL_PREBUILT`
- `DELTA_BASE_BINDING = STRICT`
- `CATALOG_DELTA_ADDRESSING = CANONICAL_ID_BASED`
- `DELTA_UPSERT_SEMANTICS = FULL_ENTITY_REPLACEMENT`
- `DELTA_APPLICATION_DETERMINISTIC = REQUIRED`
- `DELTA_CONTENT_HASH_ALGORITHM = SHA256`
- `IN_PLACE_ACTIVE_PATCH = PROHIBITED`
- `TARGET_STORAGE = FULL_CANONICAL_SNAPSHOT`
- `DELTA_TRANSPORT = INCREMENTAL`
- `SEARCH_ENABLED_DELTA_ATOMICITY = CATALOG_AND_SEARCH_TOGETHER`
- `ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE = PROHIBITED`
- `CROSS_PROFILE_DELTA = REJECT_REQUIRE_FULL_PACKAGE`
- `SAME_DELTA_REAPPLY = IDEMPOTENT`
- `UPDATE_BASE_MISMATCH_POLICY = FULL_PACKAGE_REQUIRED`
- `ACTIVE_READERS_DURING_STAGING = CONTINUE_ON_ACTIVE_GENERATION`

## 35. Decisões Arquiteturais que Permanecem Abertas
- `UPDATE_DISTRIBUTION_CHANNEL = OPEN`
- `PACKAGE_SIGNING_STRATEGY = OPEN` (G10)
- `PACKAGE_ENCRYPTION = OPEN` (G10)
- `USER_SOURCE_BINDING = OPEN`
- `REAL_SOURCE_AUTH_STRATEGY = OPEN`
- `ROLLBACK_FULL = OPEN` (G10)
- `SNAPSHOT_RETENTION = OPEN` (G10)
- `PERFORMANCE_SLA = OPEN`
- `PLAYER_SECURE_FLAG_POLICY = OPEN`
- `PERSISTENT_PLAYBACK_PROGRESS = OPEN`
- `ARTWORK_CACHE_POLICY = OPEN`
- `FULL_TV_SPATIAL_NAVIGATION = OPEN`

## 36. Critérios de Aceitação (G9)
- Validação completa da suíte de testes de atualização incremental (`npm run update:check` -> PASS).
- Validação do benchmark sintético com 240.000 documentos (`npm run update:benchmark` -> PASS).
- Comprovação da redução de tamanho em alterações de 1% (`DELTA_TO_FULL_RATIO < 1.0` -> PASS, observado 0.0092).
- Zero regressão nos contratos G2, G3, G4, G5, G6, G7 e G8.
- Preservação da imutabilidade da geração ativa e ausência de segredos expostos.
