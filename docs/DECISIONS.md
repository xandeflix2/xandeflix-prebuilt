# Registro de Decisoes de Arquitetura e Engenharia (Decisions)

---

## 1. Decisoes Fechadas e Bloqueadas (DECISIONS_LOCKED)

| Decisao | Status | Justificativa |
| :--- | :---: | :--- |
| `PROJECT_ISOLATED_FROM_XANDEFLIX_2_0` | `SIM` | O projeto Xandeflix Prebuilt possui hipotese arquitetural independente e nao pode poluir nem depender do repositorio original `timbocorrea/xandeflix-2.0`. |
| `GITHUB_REPOSITORY` | `xandeflix2/xandeflix-prebuilt` | Repositorio remoto canonico exclusivo para este projeto. |
| `SUPABASE_PROJECT_REF` | `cujbmyhitgomlgwfkaat` | Instancia dedicada de backend Supabase (`Xandeflix Prebuilt`), localizada na regiao `us-east-2`. |
| `ANDROID_PACKAGE_ID` | `com.xandeflix.prebuilt` | Identificador unico de pacote Android para evitar qualquer colisao de instalacao com `com.xandeflix.app`. |
| `UNIVERSAL_APK_PLUS_PROVISIONING_PACKAGE` | `TARGET` | Separacao estrita entre a aplicacao cliente compilada e os dados de catalogo especificos do usuario/fonte. |
| `EXTERNAL_PREPROCESSING` | `TARGET` | Ingestao, parsing e preparacao pesada de catalogos executados fora do dispositivo cliente. |
| `DEVICE_LOCAL_RUNTIME_CATALOG` | `TARGET` | Catalogo consumido diretamente a partir do storage local do dispositivo apos importacao. |
| `DEVICE_DIRECT_PLAYBACK` | `TARGET` | Player de midia conecta-se diretamente a fonte autorizada, sem proxies centrais de stream. |
| `DATA_CONTRACT_SCHEMA_VERSION` | `1` | Versao 1 do catalogo prebuilt com JSON Schema Draft 2020-12 e tipagem TypeScript correspondente. |
| `TRANSPORT_NEUTRAL_CATALOG` | `SIM` | Contrato logico independente de transporte e motor de banco de dados especifico. |
| `DUPLICATE_ID_POLICY` | `REJECT` | Rejeicao estrita de identificadores duplicados dentro de qualquer colecao de entidades. |
| `REFERENTIAL_INTEGRITY_POLICY` | `REJECT_ON_BROKEN_REF` | Validacao automatizada estrita de chaves estrangeiras entre todas as entidades do catalogo. |
| `UNKNOWN_FIELDS_POLICY` | `REJECT` | Proibicao de campos desconhecidos (`additionalProperties: false`) no topo e entidades no MVP. |
| `STREAM_CREDENTIAL_EMBEDDING` | `PROHIBITED` | Proibicao estrita de tokens, senhas ou URLs com credenciais embutidas em metadados de stream/artwork. |
| `DIRECT_PLAYBACK_RESOLUTION` | `DEFERRED_TO_G8` | Resolucao em tempo de execucao de stream e playback delegada ao Gate G8. |
| `FALSE_EMPTY_PROTECTION` | `REQUIRED` | Comparacao obrigatoria entre contagens declaradas no metadata e cardinalidade real das colecoes. |
| `EXTERNAL_PIPELINE_RUNTIME` | `NODE_TYPESCRIPT` | Runtime do pipeline externo estabelecido em Node.js com TypeScript e execucao nativa sem dependencias adicionais pesadas. |
| `INGESTION_ADAPTER_PATTERN` | `REQUIRED` | Padrao de adaptador desacoplado (SourceAdapter) estabelecido para isolar formatos de entrada do motor de normalizacao. |
| `INGESTION_ID_STRATEGY` | `DETERMINISTIC` | Identificadores canónicos gerados deterministicamente por namespace, tipo de entidade e chave de origem (`syn:entity:id`). |
| `RAW_MODEL_SEPARATED_FROM_CANONICAL_CONTRACT` | `SIM` | Tipagem intermediaria bruta (RawSourceCatalog) estritamente isolada do contrato de saida PrebuiltCatalog v1. |
| `VALIDATE_AFTER_NORMALIZE` | `REQUIRED` | Obrigatoriedade de aprovacao estrutural no JSON Schema canônico e integridade relacional antes de qualquer emissao de snapshot. |
| `SYNTHETIC_FIRST_VALIDATION` | `REQUIRED` | Validacao preliminar compulsoria com fixtures sinteticas artificiais antes de qualquer exposicao a dados reais. |
| `PROVISIONING_PACKAGE_FORMAT` | `ZIP` | Formato inicial canônico simples, auditável e universal de empacotamento com compressão DEFLATE. |
| `PACKAGE_FORMAT_VERSION` | `1` | Versão canônica 1 da estrutura de invólucro do pacote de provisionamento. |
| `PACKAGE_CONTENTS` | `manifest.json + catalog.json` | Conteúdo estrito do pacote no MVP: somente manifest e catálogo canônico na raiz. |
| `CATALOG_HASH_ALGORITHM` | `SHA256` | Algoritmo criptográfico SHA-256 via node:crypto para integridade do arquivo catalog.json. |
| `PACKAGE_CONTENT_HASH_ALGORITHM` | `SHA256` | Algoritmo criptográfico SHA-256 sobre propriedades imutáveis do manifest para hash lógico do pacote. |
| `UNKNOWN_PACKAGE_FILES` | `REJECT` | Política estrita de rejeição sumária de qualquer arquivo extra não autorizado dentro do pacote ZIP. |
| `PACKAGE_VALIDATION` | `FAIL_CLOSED` | Rejeição automática de pacotes com divergência de hash, tamanho, versão, path traversal ou contrato. |
| `LOGICAL_PACKAGE_DETERMINISM` | `REQUIRED` | Obrigatoriedade de determinismo estrito na serialização lógica e recálculo estável de hashes de conteúdo. |
| `ZIP_PATH_TRAVERSAL_PROTECTION` | `REQUIRED` | Rejeição ativa de entradas ZIP maliciosas contendo .., barras invertidas, letras de unidade ou caminhos absolutos. |
| `DEVICE_IMPORT_MODEL` | `STAGING_THEN_PROMOTION` | Importação em duas fases: quarentena em staging com readback validation antes de promoção atômica. |
| `ACTIVE_POINTER` | `REQUIRED` | Ponteiro active.json enxuto e atômico como única fonte de verdade da geração ativa no dispositivo. |
| `ACTIVE_GENERATION_SAFETY` | `REQUIRED` | Impossibilidade de staging parcial, erro de descompressão ou falha de escrita sobrescrever o catálogo ativo. |
| `FAILED_IMPORT_PRESERVES_ACTIVE` | `REQUIRED` | Qualquer falha durante a importação preserva integralmente o catálogo ativo anterior (last-known-good). |
| `STAGING_READBACK_VALIDATION` | `REQUIRED` | Validação compulsoria de releitura do snapshot em staging contra contrato e integridade antes da promoção. |
| `SAME_PACKAGE_REIMPORT` | `IDEMPOTENT` | Reimportação de pacote idêntico ao ativo não causa regravação no disco nem alteração de ponteiro. |
| `NO_FALSE_EMPTY` | `REQUIRED` | Estado limpo sem catálogo ativo é explicitamente NO_ACTIVE_CATALOG, proibido de ser tratado como vazio. |
| `APP_PRIVATE_STORAGE` | `REQUIRED` | Armazenamento de catálogo restrito ao diretório privado do aplicativo (Directory.Data), sem acesso compartilhado. |
| `LOCAL_STORAGE_STRATEGY` | `CAPACITOR_FILESYSTEM_CANONICAL_JSON` | Persistência local estruturada de snapshots e ponteiro ativo em JSON canônico via Capacitor Filesystem. |
| `CATALOG_UI_DATA_SOURCE` | `ACTIVE_LOCAL_CATALOG_ONLY` | A interface de catálogo consome estrita e exclusivamente o catálogo local ativo estabelecido no dispositivo pelo G5. |
| `CATALOG_UI_NETWORK` | `NONE` | Zero chamadas de rede externas, fetch, axios, Supabase ou APIs de catálogo permitidas na camada de apresentação. |
| `NO_FALSE_EMPTY_UI` | `REQUIRED` | A UI diferencia formalmente ausência de catálogo (NO_ACTIVE_CATALOG) de catálogo validamente vazio (VALID_EMPTY_CATALOG). |
| `CATALOG_READ_MODEL` | `EPHEMERAL_VIEW_MODEL` | Projeção em memória com índices efêmeros O(1) gerada para desacoplar componentes do catálogo bruto persistido. |
| `UNBOUNDED_DOM_RENDER` | `PROHIBITED` | Limites estritos de apresentação no DOM (HOME_RAIL_MAX_ITEMS_INITIAL=24, GRID_BATCH_SIZE=48) para evitar sobrecarga de memória. |
| `TV_INPUT_BASELINE` | `DOM_FOCUS_DPAD` | Baseline de navegação direcional por teclado/D-pad em conformidade com Android TV e Fire TV Stick sobre foco nativo DOM. |
| `INPUT_MODES` | `TOUCH_MOUSE_KEYBOARD_DPAD_BASELINE` | Compatibilidade simultânea de múltiplos modos de entrada sem conflito entre toque, clique e controle direcional. |
| `EPHEMERAL_READ_INDEXES` | `ALLOWED` | Criação exclusiva em memória de Maps efêmeros para resolução rápida de relações (categorias, gêneros, seasons, episodes) sem persistência como SearchIndex. |
| `PACKAGE_FORMAT_V1` | `PRESERVED` | manifest.json + catalog.json (formato original do G4 preservado rigorosamente sem alterações semânticas e com backward compatibility garantida). |
| `PACKAGE_FORMAT_V2` | `SEARCH_ENABLED` | manifest.json + catalog.json + search-index.json (formato estendido introduzindo search-index e manifest com hashes do índice). |
| `SEARCH_INDEX_FORMAT` | `CANONICAL_JSON_INVERTED_INDEX_V1` | Formato canônico em JSON puro com tabela invertida (postings), independente de IndexedDB/LevelDB/SQLite. |
| `SEARCH_INDEX_VERSION` | `1` | Versão canônica 1 do modelo de dados e schema de índice de busca pré-construído. |
| `SEARCH_NORMALIZATION_VERSION` | `1` | Versão canônica 1 do motor de normalização determinística (Unicode NFD, lowercase, sem diacríticos). |
| `SEARCH_INDEX_BUILD` | `EXTERNAL_PREBUILT` | Processamento pesado de indexação executado 100% fora do dispositivo cliente. |
| `SEARCH_STORAGE` | `CAPACITOR_FILESYSTEM_CANONICAL_JSON` | Persistência local do arquivo search-index.json no storage privado do app via Capacitor Filesystem. |
| `SEARCH_INDEX_TRANSPORTABILITY` | `PROVEN_SYNTHETIC_LOGICAL` | Transportabilidade lógica comprovada: build Node -> serialize -> package v2 -> import -> storage -> reload -> same queries. |
| `SEARCH_SEED_STRATEGY` | `PREBUILT_INDEX_REQUIRED_FOR_FAST_SEARCH` | Busca rápida exige índice pré-gerado transportado; ausência do índice desabilita busca sem disparar reindex local. |
| `SEARCH_INDEX_DEVICE_STARTUP_REBUILD` | `PROHIBITED` | Reconstrução ou varredura de catálogo no startup para gerar índices no dispositivo é terminantemente proibida. |
| `FULL_TEXT_REINDEX_AT_STARTUP` | `PROHIBITED` | Proibição categórica de varredura de catálogo inteiro para indexação durante o startup do aplicativo no cliente. |
| `TRANSPORTED_INDEX_RUNTIME_MATERIALIZATION` | `ALLOWED` | Materialização em memória de estruturas leves de busca (Map/Set) a partir do índice já transportado é autorizada. |
| `SEARCH_QUERY_NETWORK` | `NONE` | Zero requisições de rede executadas durante operações de busca local. |
| `SEARCH_RANKING` | `DETERMINISTIC_WEIGHTED_TEXT_V1` | Ranqueamento determinístico ponderado por correspondência de título, prefixo, tokens e metadados com desempate alfabético. |
| `SEARCH_DOCUMENT_KINDS` | `MOVIE_SERIES` | Entidades indexadas na busca global do MVP restritas a Filmes e Séries (episódios out-of-scope no G7). |
| `SEARCH_INDEX_DATA_MINIMIZATION` | `REQUIRED` | Índice minimizado: omissão de sinopses completas, referências de stream, URLs de arte e dados desnecessários. |
| `SEARCH_ENABLED_PACKAGE_FORMAT_VERSION` | `2` | Versão de formato de pacote de provisionamento com suporte a índice de busca pré-construído. |
| `PACKAGE_FORMAT_V1_BACKWARD_COMPATIBLE` | `REQUIRED` | Pacotes v1 continuam perfeitamente suportados pelo importer e UI (com busca reportando SEARCH_INDEX_UNAVAILABLE). |
| `PLAYBACK_CONNECTION` | `DEVICE_TO_SOURCE_DIRECT` | Conexão de mídia direta do dispositivo do usuário para a origem da fonte de streaming sem intermediários. |
| `CENTRAL_STREAM_PROXY` | `PROHIBITED` | Proibição categórica de qualquer proxy central de stream no backend Xandeflix, Vercel ou Supabase. |
| `CENTRAL_VIDEO_RELAY` | `PROHIBITED` | Proibição de retransmissão de pacotes de vídeo através de servidores próprios. |
| `CENTRAL_IPTV_STREAMING_BACKEND` | `PROHIBITED` | Proibição categórica de backend central IPTV de intermediação de streaming de mídia. |
| `PLAYBACK_ENGINE_ANDROID` | `MEDIA3_EXOPLAYER` | Motor canônico de reprodução nativa Android definido como AndroidX Media3 ExoPlayer. |
| `PLAYBACK_PROTOCOLS_BASELINE` | `HLS_PROGRESSIVE` | Protocolos de baseline suportados na reprodução direta: HLS (.m3u8) e Progressive MP4 (.mp4). |
| `STREAM_REF_CREDENTIAL_POLICY` | `CREDENTIAL_FREE` | Entidades StreamRef no catálogo contêm estritamente identificadores opacos e nunca credenciais ou URLs. |
| `SOURCE_AUTH_BOUNDARY` | `RUNTIME_ONLY_NO_CATALOG_SECRET` | Contexto de autenticação e sessão da fonte mantido exclusivamente em memória transitória de execução. |
| `RESOLVED_PLAYBACK_REQUEST_PERSISTENCE` | `NONE` | A requisição de reprodução direta resolvida existe somente em memória durante a sessão e nunca é persistida em storage ou catálogo. |
| `PLAYBACK_QUERY_NETWORK_PATH` | `DEVICE_TO_SOURCE_ONLY` | Tráfego de pacotes de streaming transita exclusivamente entre o cliente Android e os servidores CDN da fonte. |
| `PLAYBACK_URI_ALLOWLIST` | `HTTPS_BASELINE` | Esquema HTTPS canônico; esquemas arbitrários (file:, content:, javascript:) e credenciais embutidas (user:pass@) são rejeitados. |
| `PLAYBACK_HEADERS_LOGGING` | `PROHIBITED` | Proibição terminante de registro de headers de autenticação, tokens ou cookies em logs ou relatórios. |
| `NATIVE_PLAYER_ACTIVITY_EXPORTED` | `NAO` | NativePlayerActivity configurada com android:exported="false" para proteger a superfície IPC do app. |
| `NATIVE_PLAYER_DPAD_BASELINE` | `MEDIA3_STANDARD_CONTROLS` | Controles de TV/D-pad padronizados nos controles nativos da Media3 (Play/Pause, Seek, Back). |
| `INCREMENTAL_UPDATE_STRATEGY` | `EXTERNAL_ID_BASED_DELTA_TO_STAGING_FULL_TARGET` | Geração externa de diffs declarativos baseados em IDs canônicos, aplicados em staging isolado gerando snapshot target canônico completo. |
| `DELTA_PACKAGE_FORMAT_VERSION` | `1` | Formato canônico de invólucro do pacote delta (delta-manifest.json, catalog-delta.json, search-index-delta.json). |
| `DELTA_GENERATION` | `EXTERNAL_PREBUILT` | Processamento pesado de diffing executado 100% fora do dispositivo cliente. |
| `DELTA_BASE_BINDING` | `STRICT` | Vinculação estrita à geração ativa por snapshotId, catalogVersion, catalogSha256 e search contentHash. |
| `CATALOG_DELTA_ADDRESSING` | `CANONICAL_ID_BASED` | Endereçamento exclusivo por ID canônico de entidade, eliminando ambiguidades posicionais de JSON Patch. |
| `DELTA_UPSERT_SEMANTICS` | `FULL_ENTITY_REPLACEMENT` | Upsert definido estritamente como substituição integral da entidade existente (ou adição de nova), sem mesclagem parcial ambígua de campos. |
| `DELTA_APPLICATION_DETERMINISTIC` | `REQUIRED` | Aplicação independente da ordem de entrada, produzindo ordenações estáveis e hashes idênticos. |
| `DELTA_CONTENT_HASH_ALGORITHM` | `SHA256` | Identidade lógica determinística do delta baseada em SHA-256 de propriedades imutáveis e hashes dos payloads. |
| `IN_PLACE_ACTIVE_PATCH` | `PROHIBITED` | Proibição categórica de mutação dos arquivos do snapshot ativo no local; staging em quarentena compulsorio. |
| `TARGET_STORAGE` | `FULL_CANONICAL_SNAPSHOT` | A persistência no dispositivo após aplicação de delta resulta em um snapshot completo canônico em snapshots/<targetSnapshotId>/. |
| `DELTA_TRANSPORT` | `INCREMENTAL` | Economia de transferência de rede através de artefatos de delta de tamanho reduzido para mudanças esparsas. |
| `SEARCH_ENABLED_DELTA_ATOMICITY` | `CATALOG_AND_SEARCH_TOGETHER` | Catálogo target e índice de busca target formam uma única geração lógica indissociável na promoção. |
| `ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE` | `PROHIBITED` | Proibição de reindexação do catálogo completo no dispositivo durante a aplicação do delta. |
| `CROSS_PROFILE_DELTA` | `REJECT_REQUIRE_FULL_PACKAGE` | Transições de perfil (catalog-only <-> search-enabled) via delta são proibidas e exigem pacote full. |
| `SAME_DELTA_REAPPLY` | `IDEMPOTENT` | Reaplicação do mesmo delta cuja versão já é ativa é tratada como sucesso sem efeitos colaterais. |
| `UPDATE_BASE_MISMATCH_POLICY` | `FULL_PACKAGE_REQUIRED` | Incompatibilidade de base, versão ou integridade sinaliza compulsoriamente a necessidade de pacote full. |
| `ACTIVE_READERS_DURING_STAGING` | `CONTINUE_ON_ACTIVE_GENERATION` | Leituras ativas e playback em execução continuam sobre a geração anterior durante o staging sem interrupção. |

---

## 2. Decisoes Tecnicas em Aberto (DECISIONS_OPEN)

1. `UPDATE_DISTRIBUTION_CHANNEL`: Mecanismo de distribuição, descoberta, polling e notificação de novos pacotes (aberto para G10/G11).
2. `PACKAGE_SIGNING_STRATEGY`: Assinatura digital criptográfica, chaves assimétricas e verificação de autoria/proveniência (aberto para G10).
3. `PACKAGE_ENCRYPTION`: Criptografia em repouso e em trânsito de pacotes (aberto para G10).
4. `USER_SOURCE_BINDING`: Modelo de vinculação entre conta do usuário e credenciais da fonte.
5. `REAL_SOURCE_AUTH_STRATEGY`: Arquitetura de autenticação contra fontes reais de catálogo e streaming.
6. `ROLLBACK_FULL`: Mecanismos de reversão manual e gerenciamento de histórico profundo de snapshots (aberto para G10).
7. `SNAPSHOT_RETENTION`: Política global de limpeza, expiração e garbage collection de snapshots locais (aberto para G10).
8. `PERFORMANCE_SLA`: Metas contratuais formais de tempo de resposta em hardware físico (aberto para G11).
9. `PLAYER_SECURE_FLAG_POLICY`: Política de restrição de tela (FLAG_SECURE) no player Android.
10. `PERSISTENT_PLAYBACK_PROGRESS`: Persistência contínua de ponto de parada e histórico de exibição.
11. `ARTWORK_CACHE_POLICY`: Política de cacheamento, download e limpeza de imagens/posters.
12. `FULL_TV_SPATIAL_NAVIGATION`: Navegação espacial bidimensional avançada na interface de TV.







