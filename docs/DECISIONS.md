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
| `ARTIFACT_SECURITY_FORMAT_VERSION` | `1` | Versão 1 do formato de envelope de segurança (ArtifactSecurityEnvelope) desacoplado do conteúdo interno dos pacotes. |
| `ARTIFACT_SIGNATURE_ALGORITHM` | `ECDSA_P256_SHA256` | Algoritmo criptográfico de assinatura digital estabelecido como ECDSA NIST P-256 com digest SHA-256 (DER format). |
| `ARTIFACT_AUTHENTICITY` | `SIGNATURE_REQUIRED_FOR_EXTERNAL_IMPORT` | Autenticidade criptográfica de autoria e integridade compulsoriamente exigida para qualquer importação externa. |
| `TRUST_ANCHOR_MODEL` | `PINNED_PUBLIC_KEY_SET` | Âncoras de confiança modeladas como conjunto fixo de chaves públicas conhecidas e gerenciadas com status ACTIVE/REVOKED. |
| `PRIVATE_SIGNING_KEY_LOCATION` | `EXTERNAL_ONLY` | Chaves privadas de assinatura mantidas estritamente em pipelines externos fora do repositório, fora do APK e fora dos pacotes. |
| `SIGNING_PAYLOAD_CANONICALIZATION` | `DETERMINISTIC` | Serialização canônica determinística com chaves ordenadas alfabeticamente para evitar ambiguidades de formatação JSON. |
| `UNSIGNED_NEW_ARTIFACT_IMPORT` | `REJECT` | Rejeição sumária no boundary de produção de qualquer novo artefato que não possua assinatura válida. |
| `UNKNOWN_SIGNING_KEY` | `REJECT` | Rejeição fail-closed de artefatos assinados com identificadores de chave (keyId) não cadastrados no cliente. |
| `REVOKED_SIGNING_KEY` | `REJECT` | Rejeição sumária de artefatos assinados com chaves formalmente revogadas. |
| `SECURE_IMPORT_FAIL_CLOSED` | `REQUIRED` | Bloqueio imediato antes da descompressão ou parsing em caso de qualquer inconsistência de segurança ou envelope. |
| `STARTUP_ACTIVE_VALIDATION` | `REQUIRED` | Validação profunda compulsoria de esquema, integridade referencial e hashes da geração ativa durante a inicialização. |
| `RECOVERY_BASELINE` | `ACTIVE_PLUS_PREVIOUS_KNOWN_GOOD` | Manutenção permanente de no mínimo duas gerações válidas locais: o snapshot ativo e o último snapshot íntegro conhecido. |
| `RECOVERY_MINIMUM_GENERATIONS` | `2` | Quantidade mínima de gerações de snapshots preservadas para viabilizar recuperação resiliente local. |
| `AUTOMATIC_LAST_KNOWN_GOOD_RECOVERY` | `SUPPORTED` | Recuperação automática transparente com promoção atômica da geração anterior íntegra em caso de corrupção do ativo. |
| `RECOVERY_NETWORK` | `NONE` | Recuperação estritamente local; zero chamadas de rede ou downloads automatizados durante processos de recuperação. |
| `MANUAL_ARBITRARY_ROLLBACK` | `OUT_OF_SCOPE_G10` | Reversão manual para pontos arbitrários do passado considerada fora do escopo do Gate G10. |
| `PACKAGE_ENCRYPTION_MVP_REQUIREMENT` | `NOT_REQUIRED_FOR_CREDENTIAL_FREE_PROVISIONING_DATA` | Criptografia de pacotes em repouso considerada desnecessária no MVP devido à ausência estrita de dados secretos ou credenciais nos artefatos. |
| `DEBUG_ONLY_TEST_TRUST_ANCHOR` | `SUPPORTED_DEBUG_ONLY` | Âncora pública de teste (`g11-physical-test-key-2026`) permitida exclusivamente em builds de depuração para viabilizar testes físicos com validação de assinatura, rigorosamente eliminada no release. |
| `RELEASE_TEST_TRUST_KEY_PRESENT` | `PROHIBITED_NAO` | Proibição categórica de inclusão de chaves de teste ou âncoras de depuração no APK de produção. |
| `PHYSICAL_PROVISIONING_ENTRYPOINT` | `DEBUG_ONLY_CAPACITOR_WINDOW_AND_NATIVE_INTENT_RECEIVER` | Ponto de entrada de provisionamento físico de teste via bridge WebView e Intent receiver nativo, presente estritamente no source-set debug. |
| `RELEASE_DEBUG_PROVISIONER_BEHAVIOR` | `INERT_NO_IMPORT_CAPABILITY` | Stub inerte compilado em `src/release` sem capacidade de importação ou execução em produção. |
| `PHYSICAL_IMPORT_VERIFICATION` | `SECURE_ARTIFACT_IMPORT_SERVICE_STRICT` | Validação criptográfica de assinatura (ECDSA P-256 / SHA-256) e de contrato estrutural obrigatória no dispositivo sem nenhum bypass. |
| `PHONE_VALIDATION_STATUS` | `PENDING_REMAINING_FOR_G11B` | Validação em smartphone Android físico mantida como requisito remanescente para o subciclo G11B. |

---

## 2. Decisoes Tecnicas em Aberto (DECISIONS_OPEN)

1. `REAL_SOURCE_AUTH_STRATEGY`: Arquitetura de autenticação contra fontes reais de catálogo e streaming.
2. `USER_SOURCE_BINDING`: Modelo de vinculação entre conta do usuário e credenciais da fonte.
3. `UPDATE_DISTRIBUTION_CHANNEL`: Mecanismo de distribuição, descoberta, polling e notificação de novos pacotes.
4. `PRODUCTION_SIGNING_KEY_OPERATION`: Gestão operacional, provisionamento de chaves reais de produção e armazenamento em HSM/KMS.
5. `KEY_ROTATION_DISTRIBUTION`: Mecanismos de distribuição e rotação segura de novas chaves públicas em clientes instalados.
6. `SNAPSHOT_RETENTION_BEYOND_RECOVERY_MINIMUM`: Política global de limpeza, expiração e garbage collection de snapshots além das 2 gerações mínimas.
7. `PERFORMANCE_SLA`: Metas contratuais formais de tempo de resposta em hardware físico (aberto para G11).
8. `PLAYER_SECURE_FLAG_POLICY`: Política de restrição de tela (FLAG_SECURE) no player Android.
9. `PERSISTENT_PLAYBACK_PROGRESS`: Persistência contínua de ponto de parada e histórico de exibição.
10. `ARTWORK_CACHE_POLICY`: Política de cacheamento, download e limpeza de imagens/posters.
11. `FULL_TV_SPATIAL_NAVIGATION`: Navegação espacial bidimensional avançada na interface de TV.









## 2026-10-06 — C11: imagens e apresentação de categorias

Ciclo local autorizado pelo usuário: cards mantêm a imagem da fonte e usam
TMDB após ausência/erro. Heroes Home/Filmes/Séries e fundos dos detalhes usam
somente backdrops horizontais TMDB; nenhum pôster vertical é esticado.
Metadados faltantes são overlay local, sem escrita no catálogo/control plane.

Cache público de metadados por dispositivo: 512 entradas; sucesso 30 dias,
ausência 24 horas, erros transitórios sem cache negativo. Bytes de imagens
seguem cache do navegador; política de download offline permanece aberta.
Consultas restritas à visualização, limite de 2 ativas/128 pendentes, timeout,
deduplicação e prioridade do hero/detalhes. VITE_TMDB_API_KEY pertence ao build
do cliente; não é segredo de servidor e seu valor não foi registrado.

Categorias variam a ordem dos cards por visita/lote, preservando a associação
título/capa. Lançamentos mantém a ordem da fonte. Promoção de novo snapshot
renova leitores/faixas; não foi criado polling contínuo de playlist.

SPEC/EVIDENCE: docs/architecture/C11_SOURCE_FIRST_TMDB_ARTWORK.md e
docs/evidence/C11_SOURCE_FIRST_TMDB_ARTWORK.md. NEXT_GATE_STARTED=NAO.


## 2026-10-06 — C11: hero Home vertical/aleatório e entrega nos três aparelhos

Home móvel usa pôster vertical TMDB alternativo ao padrão/categoria quando
fornecido; tablet/TV e outras páginas mantêm backdrops horizontais. Cache
público v2 inclui variantes (máximo oito), sem alterar cards source-first.

Home seleciona cinco filmes + cinco séries do ano corrente quando elegíveis
na fonte, aleatórios por janela. Novos lançamentos recebem prioridade após
sincronização/promoção; lançamentos novos antigos/sem ano entram como extras
sem reduzir a cota atual. Identidade independe de posição na playlist.
Índice privado IndexedDB separado, leitura segmentada cooperativa, cancelamento
por snapshot e janela até vinte. Não alterar boot/importação/control plane.

Instalação autorizada in-place Fire Stick → tablet → S24, dados/ativação e
firstInstallTime preservados; app não aberto automaticamente.
SPEC/EVIDENCE: docs/architecture/C11_HOME_HERO_CURRENT_YEAR.md e
docs/evidence/C11_HOME_HERO_CURRENT_YEAR.md. NEXT_GATE_STARTED=NAO.


## 2026-10-06 — C11: otimizações de UI, saída mobile, Recentes e cores — fechamento

Ciclo corretivo local explicitamente autorizado, CURRENT_GATE=NONE e
NEXT_GATE_STARTED=NAO. Workspace C11 independente; main/origin canônico,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline 575 arquivos;
dirty anterior fora da allowlist preservado. Specs precederam os patches.
Sem Git, backend, reset, rotação de identidade ou escrita em Xandeflix 2.0.

Home misto com fallback do ano vigente aos recentes conhecidos; phone usa
variante vertical TMDB e TV/Filmes/Séries backdrop horizontal confirmado.
Só imagem decodificada elegível entra no hero. Fade, altura Fire, preview
de categoria/cache limitado, Matrix e metadados, foco sombra/preenchimento,
semelhantes source-only e Home/episódios em lista fazem parte do mesmo ciclo.

Cast autorizado por exceção LAN efêmera, emenda limitada no Source Data
Boundary. Sender mobile, receiver escolhido, URLs/headers só RAM, lease120s
renovado somente por C9 ACTIVE, sem gravar/transcodificar/proxy central.
SDK22.3.1 mantém min23. PiP API26+ não-TV mantém player/sessão existentes.
Cache de imagens privado opcional:150MiB/1000/30dias/8MiB por imagem.

Recentes abaixo do hero, até20 visíveis/60 registros/64KiB locais, episódio
exato e posição via PlaybackService/C9. Progresso5s/pausa/saída/fim; nonce e
conclusão rejeitam eventos stale. Fingerprint opaco impede reuso de ID M3U
para outra obra; ID reassociado/legado sem fingerprint omitido, sem remap.

Cores derivadas da imagem exibida por canvas24x24; cache48 RAM, tons escuros,
contraste branco>=7:1, transição700ms/reduced-motion. Canvas indisponível
mantém neutro; CORS não é exigido no img. Cache same-origin permite leitura.
Relatório completo: docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md.


## 2026-10-06 — continuação C11 phone/Fire/tablet/D-pad/paginação/menu — fechamento

Clone C11 independente C:/Xandeflix/xandeflix-prebuilt-c11-main; origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Preflight/AGENTS/Architecture/Execution/
Source Data Boundary/lock lidos. Baseline620 +handoff633, dirty anterior preservado.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Pedidos explícitos autorizam patches
corretivos locais/build/APK/install/report; nenhum Git/backend/reset/escrita2.0.

Quinze specs precederam patches: phoneSeriesDetail, FireSearchDetail, footer,
detailInitialFocus, CastControlVisibility, pageArtwork, compactSpacing,
FireHeroWarmImageLatency, tabletWidth, DpadFluidity, automaticFold,
searchReadyReplay, trailerLayoutStability, phoneCategoryVertical e menuCenter.
Allowlists individuais/unidas auditadas. Padrão Netflix de séries só celular;
tablet anterior. Fonte continua prioridade em cards e imagens TMDB confirmadas
no hero. Novo CategoryHero phone vertical não muda layout de detalhes.

Cache limitado150MiB/1000/30dias/8MiB; rede fora da trava e singleflight,
RAM paths128/5min, fila2/128/96. Slot inicial reservado para hero até8s.
Grade/busca prepara lote48/50; trilhas até20 próximas, nunca Home inteira.
D-pad cache/scroll-frame/repeat-only; nextfold48 automático com retry.
Menu6botões centralizado com áreas simétricas; alturas insuficientes roláveis.

Sem afrouxar match homônimo/licença/C9/primeira instalação. Trailer público
best-effort sem bridge/fonte/autoplay antes do toque, erro/alternativa honestos.
Relatório: docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md itens24–38.


## 2026-10-06 — complemento S24 desbloqueado

Usuário confirmou aparelho desbloqueado/aberto. PHYSICAL_TRAILER_LAYOUT=PASS_EXERCISED:
open visível/ready,0bounds em3,5s,hero100px. PHONE_VIDEO_PUBLIC_PLAYBACK=PENDING:
ready não certifica playing; controles de toque não homologados. Bloqueio
de tela anterior resolvido, sem patch/build/install adicional. APK BA37C4F0
inalterado; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Relatório item39.


## 2026-10-07 — C11 cabeçalho Live mobile compacto

Preflight clone C:/Xandeflix/xandeflix-prebuilt-c11-main, .git próprio,
originhttps://github.com/xandeflix2/xandeflix-prebuilt.git/main/HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS/Architecture/Execution/
Source Data Boundary/lock lidos. Baseline667/dirties anteriores preservados.
Pedido explícito visual e entrega anterior in-place continuam autorizados.
SPEC_BEFORE_CODE: C11_MOBILE_LIVE_COMPACT_HEADER.md, allowlist4 arquivos UI
(Header/LiveTvPage/CastButton/index.css), evidência/relatório/memórias somente
append. Header único64px+safe-area, título/total em lugar de marca repetida
só Live<600px; portal mantém callbacks. iconOnly opt-in e retorno local mantido.
Sem Git/backend/reset/native/SDK/identidade/fonte/C9. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO.


## 2026-10-07 — C11 EPG retrátil e retorno Live fullscreen

Preflight read-only: workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, .git independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, originhttps://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS/Architecture/Execution/Source Data Boundary/lock lidos. Baseline669 e dirty anteriores preservados. Pedidos explícitos UI/EPG/correção fullscreen e update-r nos três alvos autorizados. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados nem executados. Sem edição do workspace histórico/projeto original, backend, credenciais, identidade, C9 ou catálogo.
SPEC_BEFORE_CODE: C11_MOBILE_LIVE_EPG_DRAWER e C11_LIVE_FULLSCREEN_RETURN_AND_CAST, emendas Back, CDN/ID sem extensão, clickable fullscreen, pertencimento ao controlador e fase visual/OnPreDraw precederam respectivos patches. Fonte consultada por provider canônico/secure store, API provisionada e conta validada; fetch somente com guia aberto, limites e cleanup. Cast usa fase visual Media3/!PiP, geometria pós-retorno limitada; painel top+bottom em CSS pixels. Allowlist UI/service/native/test/docs estrita, sem refactor/SDK/fluxo de playback novo. Prefixos anteriores preservados.

Tablet em retrato: menu no topo nas seis abas, Canais texto/Ativação chave, Live empilhado e EPG alinhado; browser600/800/960, estado Cast conectado e SM-X610 físico PASS. Rotação anterior restaurada e paisagem ampla revalidada; allowlist inclui useLivePresentation/AppShell/Header/CSS/Live e contrato C11_TABLET_PORTRAIT_LIVE_AND_MENU. Relatório43. Harness corrigiu acentuação/duplo decode e dev menu; override CSS de600px e ações44px foram verificados.


## 2026-10-07 — ativação voltada ao usuário e suporte sob demanda

Preservar decisões efetivas/51 declarações e protocolos; apresentação inicial
somente código/status, chave e contato. Operações/telemetria anteriores em
painel fechado por padrão, com cópia por allowlist. Chave permanente só em seu
botão, nunca no diagnóstico. Contato próprio global multi_device_whatsapp,
sem número de exemplo; OWNER ACTIVE existente exige auth.uid no servidor.
Wrappers invoker e helpers em schema novo não exposto evitam conceder usage
do private existente. Leitura pública só de contato publicado, independente
de source/ativação e limitada8s. Migração aditiva aplicada no projeto canônico;
nenhuma mudança de dados antigos. Publicação web/Git não antecipadas.


## 2026-10-07 — política de barras por tipo de aparelho

TV preserva imersão, demais modos mostram systemBars. Reservar insets uma vez
no content container, consumir antes de WebView; overlay do trailer relativo
ao parent. Taskbar é do Android/launcher, sem mudar preferências globais.
Usuário confirmou imagem completa com faixas pretas; manter MATCH_PARENT/FIT.
128 Java e QA físico PASS; sem alterar engine/C9/ativação/source.


## 2026-10-07 — fullscreen sucede a política inicial de barras

Pedido posterior do usuário restringe barras disponíveis à navegação/inline.
Vídeo fullscreen oculta todas, com padding zero; saída restaura. Mantém FIT
e proporção original sem crop/stretch. WeakHashMap por decor evita retenção
de janela e conserva estado nos callbacks existentes. Não alterar engine/C9.
APK9FA21110… é final;7EBC87D9… é intermediário superseded.


## 2026-10-07 — filmes no celular como as séries

Reutilizar perfil/styles/trailer/personal de séries com conteúdo movie explícito. API movie com videos/release_dates, certificação somente BR e duração total; cache separado. Preferências incluem tipo; share público movie/{id}. Trailer/classificação ausentes não bloqueiam Assistir nem geram dados fictícios. Tablet/Fire conservam layout anterior.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem backend/Git/reset.


## 2026-10-07 — linhas de categorias e regressão visual de capas

Reutilizar histórico e leitor local existentes com itemId opaco da categoria e kind explícito. Prévia20 não limita coleção completa; default de controles Home preservado. Não confundir navegação validada com imagens carregadas: novo pedido autoriza investigação/correção visual separada, sem Gate canônico novo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.

## 2026-10-08 — ciclo49 manter plataforma e preparar só seleção inicial

Manter React/TypeScript/WebView/TMDB; não integrar outro provedor para mascarar
falha de transporte/pintura/matching. Fonte válida preferida; aliases oficiais
exatos confirmados com max2 IDs, sem relaxar homônimos. Dinastia2017/72002 e
Histeria2011/75802 confirmados só no cache público local dos dois Fire, sem mapa
embutido ou catálogo remoto. Acesso nativo de imagem/cancel/decoder coordenado,
cache indexado/previews públicos bounded; não ampliar concorrência/quota.

Pedido posterior Home Ver todos: só categorias reais, quatro callbacks tipados
App com reversão/hash equivalente. Pedido de espera inicial: só Fire após
catálogo disponível,32+8capas/hero/20s máximo/Entrar agora; fallback distinto de
imagem. Não bloquear importação/ativação nem tentar todas as milhares de capas.
Probe em repouso mostrou bitmap legível antes da resolução de decode; leitura
1px somente arquivo cache mesma origin do Fire, com fallback decode padrão e
superfície descartada. Sem wakelock/forceframes em produção. Estado de energia
é parte da medição física; tempos/caches diferentes não implicam ganho causal.
Maior cobertura depende de imagem/ID/ano corretos, não de escolher homônimo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset/novo provedor.

## 2026-10-08 — emendas18–27 e interrupção Fire

Sucede restrição histórica de Ver todos só nas categorias: coleções próprias
Recentes/Destaques com enum fechado, histórico real e guard canônico de retomada.
Hero inteiro por RAF/focusin filtrado3páginas; Voltar direito sóFire. Classificar
canal24H exige contexto estrito/perfil4, não esconder série arbitrária. Ordem
Lançamentos usa posição inversa naM3U quando não háaddedAt, não ano como data
de inclusão. Home ordena referências sem editar catálogo. Aviso fixed10s com
callback atual/cleanup. Recentes renumerados só podem rebindM3U por fingerprint
exato único e validar episódio atual antes do player; não reescrever histórico.
Falha playback é fronteira própria: timeout/conexão e sucesso posterior da
origem não autorizam patch especulativo de codec/URL/TLS/timeout/C9.
Cancelamento do usuário revoga execução em Fire103/107 até novo pedido;
interromper somente processos dos nossos instaladores/ADB filhos. Sem abrir
outro aplicativo, wake, rollback ou teste nesses alvos após cancelamento.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.

## 2026-10-08 — ciclo50: retomada local e nova autorização Fire

Separar posição por filme/episódio de Recentes limitado60; identidade e
fingerprint exatos, associação nonce limitada4 e journal nativo recuperável.
Não usar título/URI/headers nas novas persistências. Recentes sincroniza antes
de escolher último episódio/ponto. Zero conhecido permite rewind; zero sem
duração não apaga ponto válido. Episódio alheio e C9 negado recusam stream.
Classificação explícita adulta exclui Recentes; idade18/Adult Swim não bastam.
Último canal só é atualizado após reprodução efetiva segura; adulto não o
substitui e fallback não autoexecuta adulto. Sem hidratação integral Live.

Teste físico demonstrou getLong rejeitando Integer real; corrigir leitor
numérico do plugin e stub fiel, sem mudar lifecycle/transporte por hipótese.
Precisão é último evento salvo, com checkpoint5s se kill sem callback.
401 é falha de acesso à mídia: HEAD200 e GET206 posterior não justificam
mudar credencial/UA/URI/TLS/timeout nem declarar causa identificada.
Pedido explícito posterior de instalar nos dois Fire sucede cancelamento
somente para install-r251E+auditoria; não abrir app/wake/outro app ou afirmar
QA física pelo resultado de instalação. Estado privado preservado nos quatro.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/reset/backend administrativo.


## 2026-10-08 — ciclos51/52: composicao de detalhes e diagnostico fechado

Reutilizar acoes/store/share/fingerprint canonicos tambem em filmes; um grupo
ao lado de trailer e abas abaixo no caso de series. Toolbar fora do hero,
Cast iconOnly tablet, Fire sem Cast. Altura de conteudo e cantos16 preservam
sinopse/acoes sem espaco fixo vazio. Player publico separado, ID/sessao/comandos
fechados, sem source/bridge, Back fecha modal antes da rota e restaura foco.
Phone inline intacto. Enriquecer somente titulo atual com cancelamento.

Erro de playback expoe projecao minima versionada; Media3 numerico vem do
PlaybackException real, nao e inferido de HTTP. Legados marcam ausente.
Contato publico existente readonly; Clipboard e wa.me por gesto, sem envio
automatico ou registro de source/segredos. Nao mudar transporte/UA/TLS/timeout
por401 intermitente; fonte real depois tocou no S24, sem causa definitiva.
Fire103 preservacao prova por amostras integrais estaveis antes/depois e hash
instalado; PID isolado nao demonstra mutacao. Player ativo/arquivos diferentes
continuam impedindo PASS. S23 excluido por pedido expresso. Regressao D-pad
posterior prevalece sobre certificacao visual51 e tem escopo minimo separado53.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/reset/backend administrativo.


## 2026-10-08 — ciclo53: hierarquia de rails e isolamento de dialog

Buscar rails montados do mesmo main em ordem DOM, atraves de wrappers,
ignorando vazios e preservando coluna. Nao depender de irmaos diretos nem
buscar hero de outra pagina. Manter Ver todos noUp antes da linha anterior.
Restauro Fire inclui hero de detalhes completo, mas exclui modal-content/
player-overlay aninhados; teste do scroll de fundo falhou antes do guard e
passou depois. Horizontal/menu/inputs/grade e player/source intocados.
Entregar EB669 emFire103 somente apos hashes privados/primeira instalacao e
QA fisica11 passos/dialog PASS. Nao presumir Fire107 conectado pela descricao
disponivel: timeout/porta inacessivel exigem IP/ADB atual. S23 excluido e
Samsung conservaEC412. Sem Git/backend/reset/novo Gate.
## 2026-10-08 — ciclo54: ordem visual sem reclassificar fonte

Particao estavel de Lancamentos existentes e linha Destaques canonica20 da Home
no overview Filmes; Destaques antes das plataformas em Series. Home continua
com embaralhamento visual proprio, mesmas identidades/views. Ver todos usa a
colecao vertical existente e Back de origem; categorias exclusivas/source-desc/
paginacao48/limites20 intactos. QA Fire192.168.0.106 e S24 PASS; conexao107
pendente, S23 excluido. Sem Git/backend/reset/novo Gate.


## 2026-10-08 — ciclo55: preservar source/resume e diagnosticar Cast

Luke Cage S01E03 falha perto de725243ms com INVALID_NAL_LENGTH/Media3 3001 no tablet, Fire0.106 e S24. Range206/offset147250663 MATCH; trecho anterior toca. Usuario confirmou mesma falha aos12min em outro app. Nao zerar retomada/descartar NAL/alterar SDK ou fonte para mascarar. Cast preserva UA da fonte e oito codigos fechados no aviso/diagnostico; AirScreen LOAD aceito mas CAST_MEDIA_ERROR. Filme local valido tambem falhou no receiver. WIFI=true/CELLULAR=false/VPN=false, RELAY_BOUND sem PEER_ACCEPTED/DENIED nem GET upstream; usuario informou motor de renderizacao incapaz e encerrou transmissao. Primeira fronteira do Cast no receiver; compatibilidade pendente, nao declarar resolvida.
Transporte LAN efemero/RAM/C9/lease existentes mantidos. Logs debug somente enums, status HTTP e offsets numericos, sem URI/header/credencial. Nunca inferir status HTTP/Media3 indisponivel no diagnostic nem homologar receiver por LOAD aceito.


## 2026-10-08 — ciclo56: mesma identidade de retomada e ordem de foco

Linha inteira de episodio selecionado destacada. Continuar assistindo/Continuar somente para posicao salva positiva incompleta, identidade canonica/fingerprint/episodeId exatos; subscription e sync nativo existentes com cleanup, sem novo store ou callback de playback. Capas focadas usam contorno e mesmo glow vermelho dos botoes sem alterar dimensoes. D-pad wide segue hero->abas->temporadas (quando existem)->episodios em ordem e volta, independente de X deslocado pelo badge/sinopse; row inteira centralizada. Right/Left locais/menu/restauro/related/modal e hero inteiro Fire preservados.
Fingerprint usa registro canonico, nao metadados TMDB enriquecidos; completos/ID reciclado nao indicam Continuar. Li nao ganha tabIndex/acao de reproducao, um botao por episodio. D-pad consulta apenas hierarquia wide montada; seta nunca muda temporada ou inicia conteudo.
S24 atualizado com dados preservados, mas UI fisica final pendente por tela/aplicativo fora do foreground; nao desbloqueado pelo agente. Fire107 ausente do ADB e IP atual solicitado; nao alegar versao atualizada ou QA nesse alvo. S23 excluido. Fonte Luke S01E03 aos12min e motor AirScreen continuam limitacoes externas documentadas55; usuario encerrou Cast, nenhum novo teste Cast. Sem semear historico real/avaliar/favoritar/WhatsApp automatico/reset/rotacao/backend/Git/novoGate.


## 2026-10-09 - ciclo57: relatos ao gestor, WhatsApp tablet e foco do aviso

Especificacao e evidencia: docs/architecture/C11_MANAGER_PLAYBACK_ERROR_REPORTS.md e docs/evidence/C11_MANAGER_PLAYBACK_ERROR_REPORTS.md. Enviar ao gestor/copia/fechar em todas as plataformas; emenda do usuario preserva WhatsApp em celular e tablet, exclui Fire/TVBox/Tizen/webOS sem depender da largura. D-pad local/Back prioritario; foco restaurado apos commit React. Sino no Manager OWNER/ADMIN ativo, paginacao50, leitura individual, logout/cancelamento. Backend aditivo privado/RLS sem grants diretos, prova salva validada, payload fechado12campos/13linhas sem source/catalogo, dedup e limites5min/30hora. Migration20261009021625 aplicada somente no projeto cujbmyhitgomlgwfkaat; SQL real com rollback/probePostgREST PASS, zero relatos ficticios persistidos. Manager fora do APK pelo guard existente; painel web remoto e QA visual com gestor autenticado nao executados.
Testes14+8+11+7+8, lock22+27+9/build/sync/Java148/assets6 PASS. APK1FFC3C6A3CB5481654A5F6EBDAB3C1ABB4C0A2333EA22173E3F9FD13D051D997/index-DMoX919H.js instalado e hash/dados/firstInstallTime preservados no tablet/S24/Fire1 novo192.168.3.126. Tablet16passos normais+16fallback forcado PASS; S24 quatrobotoes/WhatsApp/copia/foco/Back/enquadramento PASS. Fixtures isoladas com TSX real/CSS instalado/teclasADB, sem envios; nao equivalem a erro nativo real/fluxo compilado completo. Fire final parcial, QA completa limitada pelo pedido apenas tablet; Fire107 indisponivel/S23 excluido. Luke/AirScreen continuam limitacoes55. Baseline751/protegidos737, HEAD igual/zero fora da allowlist. Sem Git/reset/rotacao/novoGate; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-09 - ciclo58: Soulm8te e filename antigo do TMDB

Spec/evidencia C11_SOULM8TE_METADATA_RECOVERY.md. Identidade real Soulm8te2026 no S24 com posterpublico ausente das variantesTMDB; servico real devolvia null, pagina sem sinopse/trailer e cachematch4negativo. API movie1307118 fornece todos esses dados. Patch minimo somente tmdb-metadata.service: filename primeiro; fallback candidato forte unico/titulo exato/ano exato reconfirmados em detalhes do mesmoID. Homonimos/ano ausente-ou-proximo/titulo fraco/ID inconsistente recusados. match5 ignora negativos antigos preservando positivos offline/ID explicito/storagev2; sem IDfixo/capa da fonte alterada/catalogo ou snapshot escrito.
Teste antesFAIL/depois4gruposPASS; aliases3, phoneMovie3/series2, artworkAtual12/preparacao5/hero1/gestor14 PASS. Suite historica source-first passou8gruposservico mas loaderSSR antigo nao fornece artwork-file-cache do componente atual, incompatibilidade ja no baseline; nao afirmarPASS integral nem relaxarassert. Lock22+27+9/build/sync/Java148/assets6/certificado PASS. APK AEDDAAEAE9EA018BC311CD2E0C3D68048336FDCC16A8EBA919D2781BFDFD8F87/index-Bx2LEpNP.js instalado S24 com hash/dados/firstInstallTime preservados761/718/5 em21:16:40.353UTC. QA pagina real compilada porBusca PASS: sinopse/duracao/classificacao/backdrop horizontal/trailer vinculado/cachesemnegativo. Trailer disponivel, playback nao iniciado. Tablet/Fire1 conservamC57/1FFC; Fire107 indisponivel, S23 excluido. Baseline759/protegidos749/HEADigual/zero fora allowlist. Sem Git/backend/source/licenca/reset/novoGate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-09 - ciclo59: selo Novidade por sete dias

Spec/evidencia C11_NEW_CONTENT_BADGE.md. Fonte atual sem data de insercao: primeiro inventario completo e referencia sem selo; novas entradas detectadas depois recebem primeira observacao local por dispositivo/fonte, sete dias corridos, sem renovar por reboot/resync/capa/ID ordinal/reinsercao. Inventario privado IndexedDB hashes/datas, atomicidade/CAS/abort/geracao/counts/limite100000, scan cooperativo movies/series somente apos catalogo REAL autorizado. MediaCard comum faixa vermelha/branca inferior, ano separado, label acessivel, foco neon/D-pad intacto; um relogio compartilhado, sem I/O por capa. Homonimos da fonte indistinguiveis compartilham prazo; renomear pode parecer nova entrada; nao equivale a data global comprovada.
Suite12/categorias7/episodios2/Dpad8/lock22+27+9/TypeScript/build/sync/Gradle/assets6 PASS. Browser real TSX/CSS phone412/tablet1280/Fire960, imagens4/foco/selos2/expiracao PASS e IndexedDB real14assertions com fluxo scan->persist->read->publish->UI em banco QA isolado removido. Java148 evidencia anterior reutilizada, sem novo patch nativo. APK5683BE780F02AA11AE171E62EDF87C5DBFAAE7E802745DAA3068A74CADF97520/index-DvT-8_G7.js instalado-r noS24 com hash/firstInstallTime/dados763/718/5 preservados21:47:50.608UTC. QA visual fisica pendente por UI nao visivel/aparelho bloqueado; pedido de desbloqueio pendente, sem unlock automatico. Tablet/Fire mantem C57, S23 excluido. Baseline762/protegidos753/HEADigual/zeroforaallowlist. Sem backend/source/playback/reset/Git/novoGate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-09 — ciclo60: atualização automática do catálogo

checkContent detecta adições/remoções mesmo com sourceVersion igual, com autoridade canônica intacta. SHA-256 incremental/nativo64KB ligado ao snapshot/perfil evita parse/staging/promoção quando inalterado. Scheduler foreground15min, cooldown persistido/backoff1min/single flight; detalhes/Live/modal/playback/Cast adiam atualização. Staging validado preserva ativo em falhas; shell permanece, rotas de detalhe da geração antiga são removidas. Xtream seis listas válidas/completas, sem truncamento100. Não existe OTA de APK: outros usuários precisam instalar uma vez; episódios novos entram na série, mas não promovem automaticamente série existente a Destaques/heroes/selo Novidade.

19 testes novos/250k T1–T83/pre-staging A–H/profile-live17/Novidade12/browse4/D-pad8/metadata4/lock22+27+9/TypeScript/build/sync/Java148/assets6 PASS. Artwork histórico: dois grupos serviço PASS, depois loader incompatível com NewContentProvider; não PASS integral nem assertions relaxadas. APK Xandeflix-v1.0-build2-standalone.apk (code2/name1.0 para preservar RPC diagnóstico), SHA256 9D7052EA18079140F4F9FF5AE13EC585CE3DEF3786ED5E82D66C2E20F2BBE95C/index-D9F5_H4Q.js, mesma assinatura/package. install-r/hash/firstInstallTime/grupos privados byte-idênticos PASS: S24 760/718/5, tablet758/715/5, Fire1 3.126 901/856/5.

QA real compilada nos três: catálogo final17152filmes/8914séries/221132episódios/sourceVersion1/digest e clock válidos. Tablet e Fire atualizaram fontes antigas17150/8913/221122 na mesma configuração; S24 confirmou geração atual. NO_OP posterior conserva snapshot: tablet12183ms/Fire42959ms/S249755ms incluindo download, evidência sem SLA. Capas montadas decodificadas15/15,53/53,9/9; Ver todos46 e ordem Home correta. Filmes Lançamentos→Destaque→Nacionais/Séries Destaque→plataformas/retornoHome PASS no tablet e S24. Fire posteriormente em NativePlayerActivity por ação do usuário, sem interrupção/teclas adicionais; não novo QA físico D-pad. S24 foreground pendente inicialmente, depois disponível e conferido. Fire2/S23 fora desta rodada; Luke/AirScreen mantêm limites ciclo55. Baseline767/protegidos752/zero fora da allowlist/HEAD igual.

Spec/evidência: C11_AUTOMATIC_SOURCE_REFRESH.md (architecture/evidence). CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR, backend/env/reset ou projeto protegido.


## 2026-10-09 — ciclo61: séries novas e episódios novos em Destaques/heroes

Spec/evidência C11_SERIES_EPISODE_UPDATES.md (architecture/evidence). Inventário v1
aditivo por fonte/aparelho conserva datas dos títulos; primeira referência completa
de episódios sem falso selo, inclusive mesma geração. Novidade para nova série,
Episódios Novos para combinação temporada/número ainda desconhecida, sete dias
desde detecção local, Novidade prevalece. Reordem/IDs/URL/capa/reinserção/temporada
vazia não renovam; nova adição renova somente episódios. Datas não globais;
homônimos indistinguíveis/renomeação conservam limitações de identidade anteriores.
Somente hashes/datas/faixas numéricas; um segmento/batch200, limite1m episódios,
100k hashes/500k temporadas. Parcial/órfãos/abort/geração/CAS preservam inventário.
Sem nova consulta por capa/TMDB, shell/imagens não aguardam scan.

Resolver no catálogo completo e priorizar até100 candidatas; mesma seleção20 em
Home/Séries/Ver todos de Destaques, hero Home inclui séries antigas atualizadas
mantendo cotas/imagem válida e hero Séries/categoria respeita categoria escolhida.
Selos acessíveis nas capas/hero, dimensões/foco neon/D-pad mantidos. Lista não
substitui card focado durante atualização ou expiração: selo sai no prazo, seleção
expirada se ajusta ao sair do rail/grid. Sem alterar filmes/Recentes/playback.

Nova suite15/escala250k (211001bytes referência), Novidade12, categorias7/ordem4/
coleções3/hero11/elegibilidade1/D-pad8+hero4/refresh19/TypeScript/React PASS.
Browser real TSX/CSS/IndexedDB isolado: scan/persist/restart5checks, labels/foco/
prioridade/hero/expiração nos3perfis PASS,20capas após rolagem,21alvos/sem erros.
Fixtures sintéticas não são teste de adição comercial/TMDB. Lock22+27+9/build/sync/
Gradle/assets6/certificado e Java148 PASS. APK Xandeflix-v1.0-build3-standalone.apk,
code3/name1.0, SHA256364A7E20BB2B25B0BD95EBF72BA4868519F86BC3243A979837D1AD46A3E9839E,
index-DoVPYb8F.js, mesmo package/certificado/RPC diagnóstico. Sem OTA de APK.

Final install-r/hash/firstInstallTime/grupos privados byte-idênticos: S24
974/928/5 em2026-10-10T01:59:36.518Z e tablet974/925/5 em02:01:11.161Z.
Estrutura real S24 read-only8914séries/15834temporadas/221132episódios,
220156coordenadas únicas válidas/mesma geração. Ambos fora foreground/sem UI visível,
WebView deixou de responder após conexão inicial; pedido de disponibilidade
pendente, sem unlock/QA visual integral ou migração persistida física declarada.
Fire1 3.126 permaneceu reproduzindo em NativePlayerActivity/code2: não recebeu
APK3, sessão preservada e disponibilidade solicitada. Fire2/S23 fora da rodada.
Luke/AirScreen mantêm limites55. Baseline771/protegidos749/zero fora da allowlist/
HEAD igual; sem Git/backend/env/reset/rotação/projeto protegido/novoGate.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-10 — ciclo62: identidade automática sem exigir ano/ID da fonte

Priorizar capa original e complementar dados/hero/trailer via TMDB. Ausência de
ano/ID não autoriza escolher homônimo por popularidade: composição oficial,
filename confirmado ou pixels da mesma capa podem provar identidade. RGB24x36
estrito,6 candidatos/8 variantes w92, prazo16s/cache96/concorrência2, rejeição de
duplicidade/blank/CORS e transporte transitório sem negativo24h. Mapping match6
separa capas de homônimos sem persistir URI. Sufixo terminal[L] é qualificador
de fonte, preservando letra/título legítimo e UI/catálogo. Correção genérica;
sem IDs de filmes fixados em produção, fonte upload/OCR ou proxy de catálogo.
Nenhum fornecedor adicional ativado; Fanart/OMDb exigem chave e identidade e
não cobrem trailers universais. QA além dos prints:19 páginas reais no tablet,
16 trailers e3 ausentes na API. Fire suspenso pelo usuário; S24 visual depende
de disponibilidade. Spec/evidência C11_PUBLIC_METADATA_GAP_RECOVERY.md.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; Git/backend/env/source writes=NAO.

Pedido posterior de instalação no Fire1 autoriza somente entregar a revisão
final já testada, sem retomar QA físico suspenso. Entrega D41E0B6A.../build4
concluída2026-10-10T10:41:36.484Z com hash/dados/firstInstallTime preservados;
spec/evidência ciclo62 emendadas, Fire2/S23 excluídos e nenhum novo Gate.


## C63 — Buffer por conteúdo e foco neon nas capas — 2026-10-10

Usar política nativa Media3 compartilhada por conteúdo/dispositivo. Aumentar
reserva e limiar de rebuffer sem baixar catálogo/vídeo completo ou gerar
requisições paralelas. Alvos de bytes prioritários protegem RAM; a reserva em
segundos depende de bitrate/velocidade/fonte. Contorno de capa deve ficar sobre
a imagem por pseudo-elemento sem interceptar eventos ou alterar dimensões.
APK5 entregue no Fire1 e S24Wi-Fi com dados preservados e QA física limitada.
Sem mudança de Cast/retomada/C9, autoridade, API ou próximo Gate. Spec/evidência
C11_PLAYBACK_BUFFER_AND_CARD_FOCUS.md; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## C64 — Lançamentos primeiro na Home — 2026-10-10

Pedido atual substitui somente a ordem de fileiras da Home do C49: Lançamentos
vem antes de Recentes e ambos antes dos destaques de filmes e séries. Separar
referências na apresentação sem duplicar categoria, modificar catálogo ou
reordenar seus itens. Mesmo renderer/keys/callbacks e preparação. Não fabricar
fileiras quando ausentes. APK6 instalado no Fire1 com preservação de dados;
S24 aguarda conexão. Spec/evidência C11_HOME_CATEGORY_PRIORITY_ORDER.md.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/env/reset.


## C65 — Encerramento de áudio ao fechar PiP — 2026-10-10

Spec anterior: C11_PIP_DISMISS_PLAYBACK_RELEASE.md. Clone independente ativo,
origin esperado/main/HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e; contratos/lock
lidos; baseline787. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git.

Correção: onStop pausa local sem consultar flag PiP; NativePlayerActivity
salva progresso/terminal não-concluído, libera e finish. Preview mantém latch
de entrada PiP até onResume, liberando após dispensa em ambas as ordens de
callbacks; evento terminal existente fecha C9 sem falso erro. Cast/configuração
não são encerrados por essa regra; background normal do preview conserva pausa
e retomada. Release idempotente/remove probes periódicos/listener de layout,
restaura WebView e impede retomada do preview já liberado.

Java 162 testes/0 falhas/0 erros, incluindo8 novos casos lifecycle;
wiring Android/progresso-antes-release/cleanup PASS. Continuidade web4 grupos
PASS (filme55min/episódio exato/journal/adultos/último canal seguro). Lock22+27+9,
TypeScript/Vite/sync/Gradle/assinatura/package/assets7 PASS.
Teste histórico mobile-output: grupo lease Cast PASS; integral FAIL em assert
literal '<CastButton />' obsoleto. Script e3 páginas possuem hashes iguais ao
baseline anterior ao patch; não regressão C65, não corrigido fora da allowlist.
Não afirmar PASS integral desse harness. Warnings flatDir/chunk/externalização
históricos, build concluído. APK build7/code7/name1.0,
SHA256 23EB3CC739CE4708086F4769AE30D66556102DCADB963E3579255BD0C182C320, 11011441 bytes;
bundle index-C-VJn-as.js mantido (mudança nativa), schemeHTTPS/standalone.
Certificado preservado; buffer/foco/metadata/refresh/selos/Home mantidos.

Usuário informou que S24/tablet estão desconectados e solicitou APK para teste
remoto. Sem instalação, playback físico, desbloqueio ou operação em Fire.
PHYSICAL_PIP_DISMISS_AUDIO= PENDING_REMOTE_USER_TEST; não homologado áudio real
nem performance em aparelho fraco. Conferir após atualizar sem desinstalar:
vídeo -> Home/PiP -> fechar X -> ausência de áudio; reabrir mesmo conteúdo e
conferir posição salva. Repetir episódio/canal, retorno PiP fullscreen e fechar
app nos recentes. Evidência unitária não substitui essa conferência.

Spec/evidência: docs/{architecture,evidence}/C11_PIP_DISMISS_PLAYBACK_RELEASE.md.


## C66 — 2026-10-10 — Entrada amigável e D-pad de séries

Build8 gerado e instalado SOMENTE no Fire Stick1 (192.168.3.126), dados íntegros.
Entrada amigável/play animado, sem contadores técnicos; abas saem para menu,
hero horizontal visível, episódios/temporadas/semelhantes retornam nos dois
sentidos.10 grupos hook/2 progresso/7 detail e browser real PASS; Fire físico
Carrie22/Jack Ryan26 passos D-pad PASS. Startup original tem mock
NewContentProvider obsoleto (hashes preservados); cópia privada4 grupos PASS,
não PASS integral original. PiP físico anterior segue pendente. Lock/build/
assinatura/assets/proteção de dados PASS. Tablet/S24/Fire2 sem atualização.
CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO; sem Git/backend/env/player/source writes.
Spec/evidência docs/{architecture,evidence}/C11_FRIENDLY_STARTUP_AND_SERIES_DPAD.md.

## C67 — 2026-10-10 — Heros Fire enquadrados e sinopse legível

Regressão C66 e tentativa CSS-only9 confirmadas fisicamente. Ramo Fire do
hook usa posição explícita com inset, uma rolagem/RAF; CSS enquadra
Home/Filmes/Séries e sinopse .hero-overview aumenta3px (11→14 no aparelho).
Browser110/Fire físico38 verificações PASS, entrada de processo
novo e retorno D-pad/menu/rail. Build10 instalado somente Fire Stick1; todos
os hashes privados/firstInstallTime/APK preservados contra baseline de10.
No evento9 app reabriu antes da verificação: core preservado, hashes completos
não equivalentes após execução. Lock/build/assets/cert/provenance PASS;
162 resultados Java C65 reaproveitados, fontes nativas intactas. Tablet/S24/
Fire2 sem atualização; PiP físico anterior segue pendente. CURRENT_GATE=NONE/
NEXT_GATE_STARTED=NAO; sem Git/backend/env/source/player writes.
Spec/evidência docs/{architecture,evidence}/C11_FIRE_HERO_SAFE_FRAME.md.


## C68 — 2026-10-10 — Continuidade de séries e controles nativos

Avanço automático em ordem numérica ao fim do episódio e entre temporadas;
Próximo manual independente de±10s. Mesma Activity/MediaSource, C9 e resolver
normais a cada troca; correlação/cancelamento preservam Back/stop/revogação.
Controller com episódio/temporada, seek, velocidade, lista, áudio/legendas da
mídia e ajuste de tela; brilho/bloqueio somente handheld, foco D-pad na TV.
Novo teste8 grupos, regressões/C9, Java166 testes executados neste ciclo, build,
lock22+27+9, assets/cert/standalone/provenance PASS. Build13 instalado somente
Fire1:1112 hashes privados, firstInstallTime e APK preservados/verificados.
Fixture física isolada com C9 mock confirmou auto mesma/próxima temporada,
botão próximo, picker, auto após picker e final sem wrap; não certifica fonte
comercial/backend C9. Troca efetiva de trilha e mobile/PiP físico pendentes.
Falha picker11 corrigida com guarda resumed/PiP; evento auto isolado12 não
repetiu em13, causa exata não estabelecida, sem afirmar eliminação definitiva.
APK SHA2568A13A10BA4ED0CDCF99765475CCF9CB4B2CE4EB0F807ED77B95A8AA62F361C74.
781 arquivos fora da allowlist e HEAD preservados. Sem Git/backend/env/source
writes; CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO. Spec/evidência em
docs/{architecture,evidence}/C11_SERIES_PLAYER_CONTINUITY.md.


## C70 ? 2026-10-11 ? Manager lateral, privil?gios e sinal pr?prio

Menu lateral/login real, MASTER global (OWNER can?nico), ADMIN somente seus
consumidores, USER sem Manager. Diret?rio USER/Gestores, atribui??o MASTER,
aprova??o auditada por dispositivo/fonte/licen?a; pagamento indispon?vel.
Ativa??o p?blica valida par antes de fonte/sincroniza??o. Cores privados e
46 RPCs Manager com guards; zero acesso anon/cores/autoridade de sinal ao
cliente. Tr?s migrations aditivas aplicadas somente cujbmyhitgomlgwfkaat;
Edge p?blica v10 e customer-upsert v7 com custom auth preservada.
SQL remoto rollback PASS, cliente8/pol?tica10/browser14, regress?es105,
build/Lock22+27+9 e Deno check PASS. Frontend build local, sem publica??o/APK
ou instala??o. Nenhuma conta/libera??o/exclus?o real; dispositivos sint?ticos0.
Backfill42 configura??es verificado; uma CUSTOMER XTREAM v1 ACTIVE falha
DECRYPT (causa AAD/chave n?o comprovada). Novas ativa??es/CREATE e fontes
alheias permanecem bloqueadas at? corre??o desse envelope pelo respons?vel.
Recupera??o pr?pria com identidade/capability real implementada/testada;
nenhuma fonte/credencial existente foi modificada nem prova fict?cia criada.
Avisos de seguran?a legados documentados, n?o declarar sucesso global.
Provenance allowlist/HEAD preservados, sem Git; C69 pendente, sem playback/
Android/device writes. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO.
Spec/evid?ncia docs/{architecture,evidence}/C11_MANAGER_ROLES_AND_PUBLIC_ACTIVATION.md.

## C71 — Recuperacao da conta MASTER (2026-10-11)

Pedido do titular: recuperar senha existente via Supabase. Spec/evidencia:
`docs/architecture/C11_MANAGER_PASSWORD_RECOVERY.md` e
`docs/evidence/C11_MANAGER_PASSWORD_RECOVERY.md`. OWNER ACTIVE preservado;
sem novo MASTER, promocao, exclusao ou Git. Pagina de recuperacao independente
com verificacao Auth real, senha somente em memoria, encerramento global e
novo login. Pedido de email aceito/registrado; entrega e novo login pendentes
do titular. Login principal continua inline, pagina dedicada foi discutida.
C71 13/13, C70 8/8, lock e build PASS; browser desktop/mobile/expirado PASS.
Falha EBUSY no watch de perfil headless corrigida no helper local ignorando
arquivos temporarios; servidor3000 restaurado e mantido para concluir link.
Sem APK/dispositivo/source/deploy ou proximo Gate. HEAD61ec009 inalterado.

### C71 — Retorno real do email de recuperacao (2026-10-11)

Print confirma otp_expired do Supabase; causa especifica nao comprovada.
Corrigido diagnostico do teste (CORS fixture faltava header SDK), callback
valido tambem passa com main anterior. Mudanca de captura antecipada retirada.
Patch minimo: titulo Definir nova senha quando verificado, email mais recente
nas mensagens e cooldown UI de reenvio60s. C71 15/15, build/lock e browser SDK
com submit/ACK/logout todos PASS (Auth interceptado; senha real nunca alterada).
Tentativa nova de email foi recusada429 over_email_send_rate_limit; aguardando
janela SMTP. MASTER existente preservado, login real pendente do titular.
Detalhes: docs/evidence/C11_MANAGER_PASSWORD_RECOVERY.md. Sem Git/APK/fonte.

### C71 — Recuperacao pronta para teste do titular (2026-10-11)

Titular informou acesso restabelecido com a senha da conta existente e pediu
finalizacao do fluxo para teste posterior. Consulta read-only confirmou
last_sign_in_at 2026-10-11 19:07:44Z, OWNER ACTIVE (MASTER); ultimo envio de
recuperacao continua 18:42:08Z. Isso confirma login, nao troca de senha pelo
fluxo de recuperacao. Nenhum novo email foi solicitado apos esse retorno.
A espera de quota/email adicional registrada antes fica encerrada.
C71 isolado reexecutado: 15/15 PASS. Pagina local /manager-reset-password HTTP
200. Build/lock e browser com SDK real + Auth interceptado PASS no fechamento
anterior; codigo funcional nao mudou depois dessa verificacao.
Implementacao local concluida, teste real de troca de senha pelo titular ainda
pendente. Para testar: Esqueci minha senha, pedido unico, email mais recente,
Definir nova senha + confirmacao (12 caracteres), salvar e entrar novamente.
Nenhum token/senha real coletado; nenhuma conta, role, fonte ou dispositivo
alterado. Sem commit/push/PR, APK ou deploy. NEXT_GATE_STARTED=NAO.

### C72 — Configuracoes e escolha Celular/Tablet/TV (2026-10-11)

Pedido explicito implementado conforme C11_DEVICE_PRESENTATION_CHOICE.md.
Android sem preferencia escolhe antes de Codigo ID/chave e App/boot; detector
inicial associa PHONE/TABLET/TV ao novo registro. Configuracoes e pagina interna
com tipo de dispositivo e dados de ativacao; layout muda e persiste, preservando
ID/chave/catalogo/ativacao. Tipos remotos antigos nao reescritos.
Templates/cache/parental/perfis preparados como extensoes futuras, nao feitos.
Testes C72 +navegacao18/3 +HomeHero +notice11 +recovery15 PASS; browser real UA
Android Mobile enganosa, controle/foco/Voltar, storage denied/retry, persistencia
e identidade/chave sem remount PASS. Lock22+27+9, build/typecheck PASS.
APK debug gerado Java21, assinatura/package/SDK e7 assets dist byte-match PASS.
SHA256 01C185992FF1222B7DDCA99B2DDA6F52E60260E4B49B54AF60CA201172AAEAFD.
Artefato tmp/c72-device-presentation/xandeflix-configuracoes-dispositivo.apk.
Mi Stick fisico pendente; nenhuma instalacao/distribuicao/backend/Git.
Erros corrigidos e rejeicao de limpeza da pasta vazia externa registrados em
 docs/evidence/C11_DEVICE_PRESENTATION_CHOICE.md. NEXT_GATE_STARTED=NAO.


### C73 — Player Live, PiP e ajustes tablet (2026-10-11)

Escopo definido antes do codigo em C11_LIVE_PLAYER_CONTROLS.md e refinado pelos pedidos mobile/PiP/tablet/menu. Lista Live paginada48 com abort/generation guards; eventos nativos com IDs e metadata limitada, sem URLs. Favoritos locais por fonte opaca, sem mudar catalogo/source. EPG somente dados reais; indisponibilidade explicita. PiP receiver privado e RemoteAction por kind, mantendo comandos do sistema e lifecycle.
Tablet horizontal16:9/contain apenas na Home/Filmes/Series; retrato rola app-content sob header fixo, preservando scroll proprio Live. Engrenagem SVG compartilhada com nome acessivel. Sem refactor, novas dependencias, data inventada de novidades, ativacao ou controle backend. Browser sintetico valida UI/ports; dispositivo real ainda necessario para Media3/PiP/D-pad fisico.
NEXT_GATE_STARTED=NAO.


### C74 — Ativacao assistida e Codigo ID automatico (2026-10-11)

Spec C11_ACTIVATION_HANDOFF_AND_CODE_INPUT anterior ao codigo; allowlist refinada antes dos ports de harness. Prefixo XF- fora do input editavel, valor canonico final. Compartilhar codigo/chave por acao do usuario usando plugin existente; TV envia metadata mais prova de status A1, sem guardar PIN/token/fonte. Codigo de atendimento direciona ao gestor; ausente somente MASTER para aparelho novo sem ownership.
Abrir notificacao cria receipt15min e fornece metadata sem PIN/hash. Edge verifica auth.getUser e resolve hash em RPC service_role, depois reutiliza ativacao/licenca/slots/vault existentes. Tabelas privadas RLS default-deny, grants de helpers restritos; avisos INFO sem policy intencionais. Pedido do usuario distinguiu iconografia: erros sino, ativacao tela com + e tooltip. Fonte/confirmacao continuam obrigatorias. Sem dependencia nova/refactor/reset de identidade.
NEXT_GATE_STARTED=NAO.


### C75 ? Previa Live sem comandos duplicados (2026-10-11)

Removida somente a faixa de oito botoes da previa em phone/tablet/TV; listas, abas, EPG e comandos fullscreen/PiP preservados. Browser 6 layouts com paginacao63/105, confirmacao touch/D-pad e eventos nativos PASS; Live7, build/lock22+27+9 e Gradle assembleDebug PASS. APK assinatura/package/7 assets verificados: 12379300 bytes, SHA256 1CA5C6882AA27AE8B072E70B7AF47578DD709767654479A316FDAF31456936AF. Sem teste fisico/instalacao/backend/env/Git. NEXT_GATE_STARTED=NAO.


### C76 ? Troca Live sem fechar fullscreen/PiP (2026-10-11)

Correcao direta: cleanup suspende/limpa somente midia antes do release C9; novo canal autorizado usa updatePreview URI na mesma instancia/id/PlayerView/controlador PiP. Categorias filtram apenas lista. Unmount/negacao/falha encerram player e autorizacao; comandos concorrentes bloqueados durante handoff. C75 sem faixa duplicada preservado.
Browser6 layouts + modal/categorias/setas/PiP simulado, midia parada antes do release, guard sem sobreposicao, negacao/falha de update/recuperacao e unmount durante acquire PASS. Java21:172 testes,0 failures/errors/skipped, inclui suspend proxy ExoPlayer e flags headless inline/full/PiP; testes nao certificam janelas reais. Live7/Cast/awake/backdrop/continuidade, lock22+27+9, TS/Vite/Gradle PASS.
APK 12379300 bytes, SHA256 6C6B7B8B46C0F496CDF985C6E9CC1EF87B8BBCB8EBC73B98FFFC9115C6606346, package com.xandeflix.prebuilt v13/1.0, assinatura debug existente e7 assets byte-match verificados. tmp/c76-live-mode-preservation/xandeflix-live-fullscreen-pip.apk. Sem instalacao/backend/env/Git; validacao fisica pendente. NEXT_GATE_STARTED=NAO.


### C77 ? Menu Configuracoes e dados de ativacao (2026-10-11)

Ativacao retirada da navegacao principal em todos os layouts. Configuracoes permanece no menu tablet/TV; no celular, engrenagem no topo em todas as telas compactas, com quatro atalhos no rodape. Tela Configuracoes preserva Ver dados de ativacao. Retorno Settings adota icones Home/Voltar existentes; espaco reservado aos alvos44px.
Browser9 layouts x7 telas com AppShell/Header/Settings/hooks reais e portas Live sinteticas PASS: uma engrenagem visivel, nenhuma entrada Ativacao no menu, Settings->ativacao->retorno, TV Search->Settings via D-pad, geometria/sem sobreposicao. Device3/nav18+3 e hook, lock22+27+9 antes/depois, TS/Vite/Gradle assembleDebug PASS. Regras do player/ativacao/source/cat/identidade intactas; Java nao alterado nem suites Java repetidas.
APK 12379300 bytes, SHA256 33C576C70970298FBBE9C8B40BDE4A720D2A7DE46B17BBDA560DE9646BA12D5F, package com.xandeflix.prebuilt v13/1.0, assinatura existente e7 assets byte-match verificados. tmp/c77-settings-navigation/xandeflix-configuracoes-menu.apk. Sem instalacao/backend/env/Git; QA fisica pendente. NEXT_GATE_STARTED=NAO.

## C78 — 2026-10-12 — Licenças consolidadas
Pedido autorizado e spec em docs/architecture/C11_LICENSE_CONSOLE.md; evidência em docs/evidence/C11_LICENSE_CONSOLE.md. Tabela sem ID visível; códigos, plataforma/tipo e último acesso; ícones acessíveis; modal de fonte/apelidos/vinculação por chave. MASTER exclui conta inteira com prévia e confirmação; ADMIN limitado ao próprio escopo. Backend publicado somente cujbmyhitgomlgwfkaat: migration 20261012030657 e Edge vault-admin v13 JWT obrigatório. Testes SQL rollback, AES/autoridade, browser 3 layouts, regressões e build PASS. Nenhum cliente real apagado; sem Git, instalação ou APK; demais abas preservadas.

## C79 — 2026-10-12 — Tabela ocupa a largura do painel
Atendendo aos refinamentos do usuário, manter todas as informações e ações sem rolagem horizontal, usar largura disponível e preservar formato tabular no desktop. Quebrar texto/ações na célula; apresentação em blocos somente até 600 px. CSS local sem alterar dados, APIs ou autorização. Spec: architecture/C11_LICENSE_TABLE_RESPONSIVE.md.


## C80 — 2026-10-12 — Cadastro descritivo e vínculo de aparelhos
Principal/Secundário ficam em relação privada por licença/dispositivo. Transferir registrado é uma ação explícita de gestor, sem apagar conta/fonte de origem, sem chave no payload; bloquear raiz com filhos e exigir escopo de todas as origens. Capacidade e simultâneos continuam conceitos distintos. Nova aprovação SELF_SERVICE precede atualização de capacidade transacional para respeitar a constraint existente. Não backfill de clientes reais.

## C81 — 2026-10-12 — Submenu de ativação e vínculo com limites
Não inventar preço ou aplicar quatro telas como plano: usar capacidade autorizada vigente da licença do principal. Transferência registrada preserva limites; ampliar capacidade é ação administrativa explícita separada em Licenças. Reutilizar modal e RPC C80 para evitar divergência entre Editar licença e submenu. ADMIN permanece com escopo de ambas as pontas; C9 playback intacto, dados antigos não backfilled.

## C82 — 2026-10-12 — Principal, edição exclusiva de telas e conferência manual
Pedido C82 supersede a decisão C81 de não fixar quatro telas: agora máximo inicial self-service4, conferência manual pelo gestor autorizada expressamente, sem preço/gateway definidos. Capacidade pertence à conta/licença e só muda em Editar licença, apenas com principal explícito. Secundário promovido compartilha a mesma capacidade, sem duplicar tela paga. Quantidades em ativação/vínculo são leitura; principal nunca rebaixado implicitamente. Legacy sem classificação exige decisão explícita do gestor. Referência curta de comprovante em ledger privado + auditoria, sem documento financeiro completo e sem exposição no DTO.


## C83 — 2026-10-12 — Rebaixamento explícito e metadados editáveis
Pedido atual permite rebaixar PRIMARY exclusivamente no EDIT com modal e plano explícito dos filhos. Emenda C82: MOVE_ALL muda todos para o principal/fonte de destino; KEEP_ACCOUNT exige outro PRIMARY da conta atual. Confirmação prepara; salvar executa tudo atomicamente, validando snapshot, escopo, fonte, capacidade e slots. Submenu de vínculo mantém veto a rebaixamento implícito. Capacidade pertence à licença, sem franquia extra por promoção. Slots privados únicos por licença, sem backfill real e com proteção de redução. Correção plataforma/tipo é apresentação administrativa, sem reescrever telemetria ou preferência instalada. Cliente renomeado por ID, preservando homônimos/auditoria e constraints do perfil self-service. Spec C11_LICENSE_EDITOR_FIELDS.md.


## C84 — 2026-10-12 — Contrato de origem preservado, linha vazia oculta
Vínculo existente não gera conta/licença; transfere aparelho e mantém contrato de origem. Escolhida ocultação visual autorizada em vez de exclusão destrutiva, pois cadastro/auditoria podem ter referências próprias. Linha só considerada vazia com devices=[] e activeDeviceCount=0; legado sem informação preservado. Filtro opt-in mantém consulta administrativa de contratos sem aparelhos. Nenhuma alteração de regra comercial, source ou limite.


## C85 — 2026-10-12 — Editor e visual administrativo
C85 amplia o salvamento explícito C83 para o formulário EDIT inteiro: promoção primeiro, capacidade crescente, metadados/árvore, capacidade decrescente, fonte por último; falha reverte tudo. Cliente não faz saves em sequência nem fallback. Snapshot contém apenas metadados editáveis; rotação/heartbeat nativo preservados. LINK/DELETE/reveal seguem autônomos. Grupos de secundários só recolhem filhos com principal explícito visível, sem ocultar órfãos/legados. Labels comuns em contraste/negrito, controles normais; retorno próprio Gestor prevalece sobre Header/AppShell apenas nessa rota. Spec/evidência C11_LICENSE_SCREEN_FORM_FEEDBACK.md; NEXT_GATE_STARTED=NAO.


## C86 — 2026-10-12 — Associação explícita de pendências
Usar mensagem e nomes de campos na mesma validação existente; IDs únicos por modal e aria-invalid/describedby. Avisos corrigíveis são botões; avisos globais permanecem informativos. Apenas navegação explícita move o foco. Nenhuma alteração de política de pagamento ou payload.


## C87 — 2026-10-12 — Capacidade derivada da conferência
Enquanto nova conferência estiver marcada, quantidade é derivada e readonly: max(capacidade atual,4+total adicional válido). Sem efeito que sobrescreva rascunho manual; desmarcar restaura manual. Total cumulativo impede créditos duplicados. Concorrência permanece explícita e independente; só EDIT do principal altera capacidade. RPC/banco existentes já suportam o payload, sem migration necessária.


## C88 — 2026-10-12 — Excluir capacidade inaplicável da transferência
Transferência externa sem PRIMARY local não pode carregar screens de origem no lote atômico. Descartar esse rascunho com explicação e ocultar seção editável; conservar metadados/vínculo. Sem promoção implícita ou crescimento destino pelo vínculo. KEEP_ACCOUNT/PRIMARY retido preservam validações de capacidade. Sem novo endpoint.

## C89 — Ausência explícita é diferente de indisponibilidade — 2026-10-12

Refazer pending somente quando o status remoto retorna ACTIVATION_NOT_FOUND;
rede/timeout/capability inválida preservam referência local. Nova solicitação usa
identidade/chave existentes e substitui capability após sucesso. Registro não
restaura autorização/licença/fonte. Versão antiga física exige atualização para
receber o patch de cliente; confirmação física não é presumida pelos testes.
[Contrato](architecture/C11_DELETED_DEVICE_ACTIVATION_RECOVERY.md).

## C90 — Política de atualização de software — 2026-10-12

Versão é publicada pelo MASTER, não inferida baixando APK completo diariamente.
Hash/tamanho/package/assinatura devem coincidir; código de versão deve crescer
para cada arquivo diferente. Espelhos públicos em ordem1–5, HTTPS inclusive
redirect; cache somente de release conhecida, sem independência de descoberta
quando Supabase indisponível. Consulta24h é best-effort do Android; busca manual
ignora intervalo. APK apenas Android. Sugestão persiste após adiar/cancelar;
instalador nunca silencioso e confirmação não equivale a instalação efetiva.
Primeira versão contendo updater requer distribuição assistida aos apps antigos.
[Contrato](architecture/C11_APP_UPDATE_MIRRORS.md).

## C91 — Destaques locais por tipo e APK15 — 2026-10-12

Reutilizar regra, índice e carrossel Home com escopo movie/series opcional;
defaults mistos permanecem. Apenas overview Filmes/Séries ganha rotação,
categorias/detalhes conservam contexto. Foco inicial no main evita pausa
programática; indicação de foco interativa permanece. APK15 gerado assinado
igual14 para teste solicitado de atualização, sem publicar ou instalar.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/ativação.
[Contrato](architecture/C11_BROWSE_DYNAMIC_HERO.md).

## C92 — Navegação do hero e dobrável — 2026-10-12

Pedido explícito substitui setas/contador/pausa visíveis por marcadores; toque
horizontal troca, vertical permanece rolagem. Mouse não simula gesto. Pausas
por interação/preferências continuam; posição de botão preserva D-pad.
APK16 necessário após versão15 disponibilizada pelo usuário, mesmo signer.
Modelo de Canais50/50 indicado para janela touch quase quadrada: decisão por
espaço lógico disponível, não por modelo físico ou resolução nominal.
Usuário solicitou modelos para aprovação, sem autorização de implementação
Live ainda. [Contrato](architecture/C11_HERO_SWIPE_DOTS.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C93 — Layout square somente por espaço lógico e toque — 2026-10-12

Aprovação do modelo B permite duas metades na rota Canais: prévia+guia à esquerda,
navegação à direita. Usar menor dimensão >=600CSSpx e razão0.8–1.25 com touch;
TV excluída, independente de marca/resolução nativa. Reusar EPG, categorias e
player atuais, sem nova superfície/autoridade. Drawer mantém comportamento fora
desse modo. APK17 necessário para atualização sobre16, mesmo package/signer.
[Contrato](architecture/C11_SQUARE_LIVE_LAYOUT.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C94 — Hero: modelo sobreposto preservado — 2026-10-12
Emenda explícita rejeitou metadados fora da capa. Restaurado tamanho anterior
mobile2:3, capa contain e sobreposição do gradiente; Assistir/Ver detalhes e
dots compactos dentro do hero. Browser12 formatos/casos, timer10s real, swipe,
foco, ações, erro/retry, typecheck, regressões Home/Browse e lock PASS.
APK18 não gerado: análise de reprodução priorizada antes do empacotamento.
Diagnóstico somente leitura identificou tablet XF-JNQK-NZ77 com fonte local
antiga src_w9kb47u3efcvrqnj promovida11h15; banco aponta para fonte nova
src_87kbpy51ws9nnz6d desde18h21. Transferência dos outros dois aplicada no banco.
Motivo da persistência local e playback da fonte nova ainda não certificados;
sem alteração de fonte/banco/aparelho. Evidências privadas e relatório em
[evidência C94](evidence/C11_HERO_COMPACT_ACTIONS.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/instalação/publicação.
## C95 — Fonte reconciliada e Live recuperado no tablet — 2026-10-12
Pedido explícito de correção em tempo real no tablet XF-JNQK-NZ77. Retorno ao
Início e coordenador canônico concluíram importação/promoção da fonte atual,
snapshot snap-mv5s8v3o, sem editar manualmente pointer/cofre ou instalar APK.
Sincronização física284363ms; antigo catálogo permanecia durante processamento.
GLOBO SP FHD reproduzindo confirmado por evento nativo e screenshot físico.
BAND NEWS FHD permanece com falha403/404 da origem. Provedor informa conta
Active/auth1, limite2 simultâneas e1 ativa, enquanto licença local permite8;
não foi provado excesso na falha original e não se alterou cota/banco.
Hashes identidade/chave/ativação/instalação preservados. C94 visual mantida,
APK18 adiado; nenhuma alteração funcional de código/Git/backend/outro aparelho.
[Evidência C95](evidence/C11_TABLET_SOURCE_RECONCILIATION.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
## C96 — APK1.0.18 para teste de UI — 2026-10-12
Retomado empacotamento autorizado após usuário confirmar BAND NEWS SD; demais
problemas adiados. Hero sobreposto/Assistir/dots compactos/swipe10s e Live square
incluídos, sem patch funcional adicional. Build/lock/Capcopy/assemble/6 JVM,
regressões UI, sete assets, package18 e assinatura igual ao17 PASS.
APK11086375bytes, SHA256
5bb8c0273f58cc9bf800367658d08ec5c7de31ad3eed50b63a74e8a85c8c506e.
Arquivo tmp/c96-ui-apk18/Xandeflix-v1.0.18-ui.apk; dados-publicacao.txt disponível.
[Evidência C96](evidence/C11_UI_APK18_DELIVERY.md). Sem instalação/publicação/
backend/Git. UI física do APK18 pendente de teste do usuário.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
## C97 ? Acesso localhost ao gestor ? 2026-10-13
Vite escutava3000, mas HTTP expirava; rein?cio simples insuficiente. Perfil CPU
identificou cria??o massiva de FSWatchers; tmp tinha73518 arquivos medidos.
Patch m?nimo vite.config.ts ignora tmp no watcher e limita optimizeDeps a index.html.
Servidor normal ativo3000; quinze HTTP200,301 imports sem falhas, lock antes/depois PASS.
Navegador CUA indispon?vel: login/renderiza??o f?sica n?o certificados; recarregar aba.
[Evid?ncia](evidence/C11_LOCAL_DEV_SERVER_RECOVERY.md). Sem APK/Git/backend/dispositivos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C98 ? Limpeza seletiva de tmp ? 2026-10-13
Removidos163 perfis ef?meros de navegador sem uso,68906 arquivos,4803565330bytes
(4.47GiB). tmp posterior4086061675bytes (~3.81GiB),23392 arquivos. Zero falhas.
Hashes de23384 arquivos preservados, incluindo46 APKs, PASS. Backup da migra??o,
relat?rios, scripts, snapshots e dados privados preservados. Servidor3000 segue200.
[Evid?ncia](evidence/C11_TEMP_ARTIFACT_CLEANUP.md). Sem patch funcional/APK/Git/
backend/dispositivos; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C99 — Sincronização GitHub autorizada e validada — 2026-10-13
Pedido explícito autoriza commit/push main em xandeflix2/xandeflix-prebuilt.
Fetch inicial confirmou local/remoto61ec009, sem divergência. Código C11/UI18,
gestor, Android e testes/documentos revisados; arquivos privados/IDE/diagnósticos
permanecem locais e ignorados. Build/prebuild lock,30 regressões e178 JVM PASS;
APK18/hash preservado. Seis harnesses legados atualizados para interfaces já
aprovadas, sem patch funcional. Falhas iniciais e correções em evidência C99.
[Evidência](evidence/C11_GITHUB_SYNCHRONIZATION_20261013.md).
Envio pendente até confirmação do push; sem backend/deploy/instalação/PR.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=SIM;
GIT_PUSH_AUTHORIZED=SIM.

## C99 — Código publicado e remoto confirmado — 2026-10-13
Commit0bf9471019114b8c3ce74751ce3b6b8ec7d97494 publicou500 arquivos C11
em xandeflix2/xandeflix-prebuilt/main, push normal e ls-remote idêntico ao HEAD.
Build/lock,30 regressões e178 JVM PASS; APK18/env/privados preservados.
Auditoria final de staging/proveniência PASS, sem arquivo fora da allowlist;
harness de staging corrigido após inventário parcial worktree/index, sem reset.
Este complemento registra confirmação observada após o envio do código.
[Evidência](evidence/C11_GITHUB_SYNCHRONIZATION_20261013.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem backend/deploy/instalação/PR.

## C100 — Duplo toque/clique lateral no player VOD — 2026-10-13
Implementado localmente no player Android: direita+10s/esquerda−10s, toque
simples mantém controles. Gestos somente na imagem; widgets/arraste/multitouch/
lock/diálogos/transição/Cast/PiP preservados. Seek limitado e sem play/pause.
Compilação XML/Java e191 JVM (13 novos), quatro regressões e lock PASS.
Interfaces próprias preservam compatibilidade do novo caminho com API23.
[Evidência](evidence/C11_VOD_DOUBLE_TAP_SEEK.md). APK18/HEAD preservados; validação
física depende do próximo APK. Sem build APK/instalação/Git/backend.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C101 — APK19 instalado no Fire Stick — 2026-10-13
Pedido explícito de instalação no192.168.3.101; Amazon AFTSSS/API28 atualizado
via install -r de code13 para19/name1.0.19, mesma assinatura. Build produção,
sete assets/config/Dex,191 JVM/33 suites e lock PASS. Implementação C100 incluída;
APK18 e HEAD preservados. Falha inicial de espaço resolvida removendo apenas
~23MiB de cache reconstruível do próprio Xandeflix; não houve reset/uninstall.
Cinco privados de cadastro/ativação/token e1603 arquivos de catálogo iguais em
RAM antes/depois, UID/firstInstallTime originais e hash do APK instalado iguais.
App não aberto; validação física de UI/reprodução/gesto permanece com usuário.
Erros operacionais de quoting/patch documental corrigidos sem mudar testes.
[Evidência](evidence/C11_FIRESTICK_APK19_INSTALL.md). Artefato recuperável local
tmp/c101-firestick-apk19/Xandeflix-v1.0.19-duplo-toque.apk. Nenhum outro aparelho,
backend ou Git operado. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C102 — Diagnóstico de armazenamento no Fire Stick — 2026-10-13
Consumo alto confirmado em files/prebuilt, anterior ao update APK19: seis
gerações completas (~204MiB cada) e três staging antigos (~326MiB). Ativo e
fallback somam408MiB; quatro gerações não referenciadas815MiB. Excesso candidato
~1,20GB decimal, sem apagar nada. Novo staging crescente durante medição deve
ser protegido como importação em andamento; medidas ao vivo variam.
Código não poda gerações antigas e limpa somente staging do candidato atual;
erros de limpeza ignorados/processo interrompido podem deixar temporários.
Métrica interna totalAppDataBytes não contabiliza históricos/resíduos.
Defeito de retenção/limpeza permanece pendente, diagnóstico concluído.
Correção futura deve proteger ativo/recovery/leitores/job e identidade/ativação,
validar integridade e repetir ponteiros antes de remover candidatos.
[Evidência](evidence/C11_FIRESTICK_STORAGE_DIAGNOSIS.md). Sem patch funcional,
testes/build/limpeza/instalação/backend/Git. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C103 — Limpeza e reinstalação física — 2026-10-13
Pedido explícito executado no Fire Stick AFTSSS e tablet SM-X610: limpar
gerações obsoletas/staging/cache e reinstall -r APK19, preservando cadastro.
Fire liberou1195960KiB (~1,22GB), restante417636KiB (~408MiB); tablet liberou
2499469KiB (~2,56GB), restante458082KiB (~447MiB), somente catálogos medidos.
Preservados ativo/recovery,412/452 segmentos declarados e422/462 arquivos,
cinco privados de identidade/ativação/token em cada aparelho, UID e datas.
Assinatura/lock PASS; instalados APKs idênticos ao artefato19. Nenhum reset,
uninstall ou troca de fonte; app não aberto automaticamente, UI/gesto pendentes.
Celular192.168.3.109 pareado, aguardando porta de conexão; sem limpeza/instalação
nesse alvo até conexão/identificação. Retenção automática ainda pendente C102.
[Evidência](evidence/C11_DEVICE_CATALOG_CLEANUP_AND_REINSTALL.md). Sem código
funcional/build/backend/Git. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
