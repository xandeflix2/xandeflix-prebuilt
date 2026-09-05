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

---

## 2. Decisoes Tecnicas em Aberto (DECISIONS_OPEN)

1. `SEARCH_STORAGE`: Mecanismo e estrutura de persistência do índice de busca no dispositivo (SQLite FTS, MiniSearch JSON, etc.).
2. `SEARCH_INDEX_TRANSPORTABILITY`: Avaliar viabilidade de transportar índices pré-gerados vs indexação local no cliente.
3. `SEARCH_SEED_STRATEGY`: Estratégia de indexação inicial no cliente caso o índice transportado apresente incompatibilidades.
4. `ROLLBACK_FULL`: Política avançada de retenção de múltiplos snapshots históricos e reversão manual de versão.
5. `SNAPSHOT_RETENTION`: Política de limpeza e expiração de snapshots antigos acumulados no armazenamento privado.
6. `INCREMENTAL_UPDATE_STRATEGY`: Algoritmo para geração e aplicação de deltas/diffs de catálogo sem re-download completo.
7. `PACKAGE_SIGNING_STRATEGY`: Protocolo criptográfico para assinatura e verificação de autoria do pacote (ECDSA, Ed25519).
8. `PACKAGE_ENCRYPTION`: Necessidade e algoritmo de criptografia em repouso/trânsito para os pacotes de provisionamento.
9. `USER_SOURCE_BINDING`: Modelo de associação entre credenciais de acesso da fonte e a distribuição de pacotes personalizados.
10. `REAL_SOURCE_AUTH_STRATEGY`: Arquitetura de autenticação com provedores de origem sem expor credenciais primárias ao cliente.
11. `OFFLINE_POLICY`: Comportamento da aplicação diante da ausência prolongada de conexão com a internet após o bootstrap inicial.
12. `ARTWORK_CACHE_POLICY`: Política de download, resolução, compressão e expiração de posters e imagens de catálogo.
13. `SIZE_LIMITS`: Limites contratuais de tamanho para o pacote de provisionamento e footprint de memória (evidências empíricas atuais não são SLA).
14. `PERFORMANCE_SLA`: Metas empíricas de tempo de abertura e resposta que serão homologadas apenas no Gate G12.




