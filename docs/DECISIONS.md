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

---

## 2. Decisoes Tecnicas em Aberto (DECISIONS_OPEN)

1. `PROVISIONING_PACKAGE_FORMAT`: Definir se o pacote sera um arquivo ZIP contendo JSONs otimizados, base SQLite direta, arquivo compactado tar.gz ou formato binario customizado.
2. `EXTERNAL_PIPELINE_RUNTIME`: Definir stack e linguagem de execucao do pipeline de ingestao (Node.js/TypeScript, Python, Go ou Edge Functions).
3. `SEARCH_INDEX_TRANSPORTABILITY`: Avaliar viabilidade tecnica de gerar indices (ex: SQLite FTS, MiniSearch index dump) externamente para transporte direto ao cliente.
4. `SEARCH_SEED_STRATEGY`: Estrategia de indexacao inicial no cliente caso o indice transportado apresente incompatibilidades.
5. `PACKAGE_SIGNING_STRATEGY`: Protocolo criptografico para assinatura e verificacao de autoria do pacote (ECDSA, Ed25519).
6. `PACKAGE_ENCRYPTION`: Necessidade, escopo e chaveamento de criptografia em repouso e em transito para os pacotes de provisionamento.
7. `USER_SOURCE_BINDING`: Modelo de associacao entre credenciais de acesso da fonte e a distribuicao de pacotes personalizados.
8. `INCREMENTAL_UPDATE_STRATEGY`: Algoritmo para geracao e aplicacao de deltas/diffs incrementais de catalogo sem necessidade de re-download completo.
9. `SNAPSHOT_RETENTION`: Politica de retencao e expiracao de snapshots e versoes antigas de catalogos.
10. `ROLLBACK`: Mecanismo de fallback no cliente caso a importacao de uma versao mais recente falhe ou resulte em inconsistencias.
11. `OFFLINE_POLICY`: Comportamento da aplicacao diante da ausencia prolongada de conexao com a internet apos o bootstrap inicial.
12. `ARTWORK_CACHE_POLICY`: Politica de download, resolucao, compressao e expiracao de posters e imagens de catalogo.
13. `SIZE_LIMITS`: Limites aceitaveis de tamanho para o pacote de provisionamento e footprint de memoria no dispositivo.
14. `PERFORMANCE_SLA`: Metas empiricas de tempo de abertura e resposta que serao homologadas apenas no Gate G12.

