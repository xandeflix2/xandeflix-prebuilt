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

---

## 2. Decisoes Tecnicas em Aberto (DECISIONS_OPEN)

1. `PACKAGE_SIGNING_STRATEGY`: Protocolo criptografico para assinatura e verificacao de autoria do pacote (ECDSA, Ed25519) sem chave estática.
2. `PACKAGE_ENCRYPTION`: Necessidade, escopo e algoritmo de criptografia em repouso e em trânsito para os pacotes de provisionamento.
3. `USER_SOURCE_BINDING`: Modelo de associacao entre credenciais de acesso da fonte e a distribuicao de pacotes personalizados.
4. `SNAPSHOT_RETENTION`: Politica de retencao e expiracao de snapshots e versoes antigas de catalogos.
5. `ROLLBACK`: Mecanismo de fallback no cliente caso a importacao de uma versao mais recente falhe ou resulte em inconsistencias.
6. `SIZE_LIMITS`: Limites contratuais de tamanho para o pacote de provisionamento e footprint de memoria (evidências empíricas atuais não são SLA).
7. `SEARCH_INDEX_TRANSPORTABILITY`: Avaliar viabilidade tecnica de gerar indices (ex: SQLite FTS, MiniSearch index dump) externamente para transporte direto ao cliente.
8. `SEARCH_SEED_STRATEGY`: Estrategia de indexacao inicial no cliente caso o indice transportado apresente incompatibilidades.
9. `REAL_SOURCE_AUTH_STRATEGY`: Arquitetura de autenticacao com provedores de origem sem expor credenciais primarias ao cliente.
10. `INCREMENTAL_UPDATE_STRATEGY`: Algoritmo para geracao e aplicacao de deltas/diffs incrementais de catalogo sem necessidade de re-download completo.
11. `OFFLINE_POLICY`: Comportamento da aplicacao diante da ausencia prolongada de conexao com a internet apos o bootstrap inicial.
12. `ARTWORK_CACHE_POLICY`: Politica de download, resolucao, compressao e expiracao de posters e imagens de catalogo.
13. `PERFORMANCE_SLA`: Metas empiricas de tempo de abertura e resposta que serao homologadas apenas no Gate G12.



