# PREBUILT_SEARCH.md — Especificação e Arquitetura de Busca Pré-construída (G7)

> **PROJECT**: `XANDEFLIX_PREBUILT`  
> **GATE**: `G7_PREBUILT_SEARCH`  
> **CYCLE**: `XANDEFLIX_PREBUILT_G7_PREBUILT_SEARCH`  
> **STATUS**: `SPECIFICATION_AND_EVIDENCE`

---

## 1. Objetivo

O objetivo central do Gate G7 é implementar e comprovar a viabilidade de uma arquitetura de busca **PREBUILT**, na qual todo o custo computacional pesado de análise léxica, normalização de texto, tokenização, extração de metadados e construção da lista invertida (postings) ocorre **fora do dispositivo cliente** (no ambiente de build/ingestão externo).

O cliente recebe um artefato de índice de busca serializado e canônico junto com o catálogo, valida sua integridade e amarração criptográfica, persiste o índice em storage privado do aplicativo e realiza consultas locais instantâneas em memória sem jamais reconstruir o índice no startup.

---

## 2. Hipótese Arquitetural

- **Hipótese Central**: `SEARCH_INDEX_ON_DEVICE_REBUILD_AT_STARTUP = NOT_REQUIRED`.
- O cliente móvel / TV (ex.: Fire Stick, TV Box, Android, Web) possui restrições severas de CPU e I/O. Processar centenas de milhares de títulos para gerar índices locais no momento em que o aplicativo abre causa ANR (Application Not Responding), exaustão de heap e travamentos.
- Ao desacoplar a construção do índice para o ambiente de packaging externo, o startup do cliente apenas deserializa uma estrutura já indexada ou a lê sob demanda de storage local.
- **Premissas**:
  - `SEARCH_INDEX_EXTERNAL_BUILD = REQUIRED`
  - `SEARCH_INDEX_DEVICE_STARTUP_REBUILD = PROHIBITED`
  - `SEARCH_QUERY_NETWORK = NONE` (busca 100% offline e local)

---

## 3. Index Build Externo

A construção do índice ocorre via script executado em ambiente Node.js:
- Script canônico: `scripts/build-prebuilt-search-index.mjs`
- NPM script: `npm run search:index:build`
- **Fluxo de Geração**:
  1. Leitura do catálogo validado (`PrebuiltCatalog`).
  2. Filtragem de entidades indexáveis (Filmes e Séries).
  3. Normalização de campos textuais determinística.
  4. Extração de tokens e indexação em mapa de postings.
  5. Ordenação lexicográfica de chaves de tokens e listas de postings.
  6. Cálculo do `contentHash` SHA-256 sobre a carga lógica do índice (excluindo timestamp efêmero de geração).
  7. Saída serializada para arquivo temporário (ex.: `tmp/search/search-index.json`).

---

## 4. Formato do Índice

O formato estabelecido e fechado no G7 é:
- `SEARCH_INDEX_FORMAT = CANONICAL_JSON_INVERTED_INDEX_V1`
- **Propriedades**:
  - Formato JSON canônico estritamente padronizado e legível por qualquer runtime (Node, Web, Capacitor/Android, iOS).
  - Livre de amarras com IndexedDB, LevelDB, SQLite FTS ou bibliotecas proprietárias de terceiros.
  - Totalmente transportável como um único arquivo `search-index.json`.
  - Verificável por SHA-256 antes do carregamento.

---

## 5. Schema do Índice

Definido formalmente em:
- [prebuilt-search-index.schema.json](file:///c:/Xandeflix/xandeflix-prebuilt/schemas/prebuilt-search-index.schema.json)
- Draft: JSON Schema Draft 2020-12
- `searchIndexVersion`: inteiro 1
- `schemaVersion`: "1.0.0"
- `catalogSnapshotId`: UUID vinculado ao catálogo
- `catalogVersion`: string de versão semântica vinculada
- `documentCount`: total exato de documentos indexados
- `tokenCount`: total exato de tokens distintos no índice
- `generatedAt`: ISO 8601 UTC timestamp
- `contentHash`: string hex SHA-256 de 64 caracteres
- `documents`: array de `SearchDocument` contendo `id`, `kind`, `title`, `originalTitle`, `year`, `genreIds`, `categoryIds`.
- `postings`: dicionário chave-valor mapeando token normalizado -> array de índices de documentos correspondentes (inteiros 0-based referenciando `documents`).

---

## 6. Normalização de Texto

Implementada em `src/search/search-normalization.ts`:
- `SEARCH_NORMALIZATION_VERSION = 1`
- **Etapas**:
  1. Decomposição canônica Unicode NFD (`normalize('NFD')`).
  2. Remoção segura de diacríticos e acentos via Regex (`[\u0300-\u036f]`).
  3. Conversão para minúsculas (`toLowerCase()`).
  4. Substituição de pontuações e caracteres não alfanuméricos por espaços em branco.
  5. Colapso de múltiplos espaços em branco em um único espaço (`replace(/\s+/g, ' ')`) e `trim()`.
- **Exemplos**:
  - `"Questão"` -> `"questao"`
  - `"Tá Chovendo Hambúrguer!"` -> `"ta chovendo hamburguer"`
  - `"Matrix: Reloaded (2003)"` -> `"matrix reloaded 2003"`

---

## 7. Tokenização e Token Policy

- `MIN_TOKEN_LENGTH = 2` (com exceção para dígitos únicos numéricos para permitir busca por anos ou partes numéricas como "2", "3").
- `STOPWORD_POLICY = NONE_G7` (nenhuma palavra é omitida arbitrariamente no MVP para preservar fidelidade de títulos exatos como "To be", "In").
- `PREFIX_POLICY = SUPPORTED_AT_QUERY_TIME` (prefixos com comprimento >= 2 caracteres são resolvidos em runtime contra a tabela de tokens de forma binária ou varredura de chaves).
- Sem stemmer linguístico complexo.
- Sem embeddings / IA / fuzzy pesado não determinístico.

---

## 8. Ranking Determinístico

Implementado em `src/search/search-engine.ts`:
- `SEARCH_RANKING = DETERMINISTIC_WEIGHTED_TEXT_V1`
- **Ordem de Pontuação e Correspondência**:
  1. `EXACT_NORMALIZED_TITLE`: match exato da query com o título normalizado (peso 1000).
  2. `TITLE_STARTS_WITH`: título normalizado inicia com a query completa (peso 500).
  3. `ALL_QUERY_TOKENS_IN_TITLE`: todos os tokens da consulta estão presentes no título do documento (peso 200).
  4. `PARTIAL_TITLE_TOKENS`: correspondência parcial / prefixos de tokens no título (peso 50 por token).
  5. `ORIGINAL_TITLE_MATCH`: correspondência no título original (peso 30).
  6. `METADATA_MATCH`: correspondência em gêneros, categorias ou ano (peso 10).
- **Desempate Determinístico**:
  - Em caso de pontuações idênticas, o critério de desempate compara alfabeticamente o título normalizado e, se persistir, o `canonicalId` do documento.

---

## 9. Entidades Indexadas e Documentos

- `SEARCH_DOCUMENT_KINDS = MOVIE_SERIES`
- Entidades cobertas: Filmes (`movie`) e Séries (`series`).
- `EPISODE_GLOBAL_SEARCH = OUT_OF_SCOPE_G7` (episódios permanecem fora da busca global neste Gate para respeitar orçamento de memória e payload).
- Nenhuma referência a streams ou credenciais é incluída.

---

## 10. Lista Invertida (Postings)

- A estrutura `postings` associa cada token único a uma lista ordenada de identificadores inteiros de documentos (`docIndex` apontando para o array `documents`).
- Os identificadores são ordenados crescentemente para viabilizar interseções determinísticas de conjuntos.

---

## 11. Content Hash e Integridade

- Algoritmo: `SEARCH_INDEX_CONTENT_HASH_ALGORITHM = SHA256`.
- O hash lógico protege:
  - `searchIndexVersion`
  - `schemaVersion`
  - `catalogSnapshotId`
  - `catalogVersion`
  - `documentCount`
  - `tokenCount`
  - Ordenação e conteúdo completo de `documents`
  - Ordenação e conteúdo completo de `postings`
- Metadados efêmeros de runtime como `generatedAt` são excluídos do cálculo do hash lógico para garantir **estabilidade determinística estrita** (mesmo catálogo -> mesmo hash de conteúdo).

---

## 12. Prova de Determinismo

- Executada no harness `scripts/validate-prebuilt-search.mjs` e `scripts/build-prebuilt-search-index.mjs`:
  - `SEARCH_INDEX_HASH_RUN_1` vs `SEARCH_INDEX_HASH_RUN_2`: idênticos.
  - `DOCUMENT_COUNT_RUN_1` vs `DOCUMENT_COUNT_RUN_2`: idênticos.
  - `TOKEN_COUNT_RUN_1` vs `TOKEN_COUNT_RUN_2`: idênticos.
  - `SEARCH_INDEX_DETERMINISTIC = SIM`.

---

## 13. Transportabilidade do Índice

O ciclo de vida do índice prova a transportabilidade lógica completa:
1. `INDEX_BUILT_IN_NODE = PASS` (gerado externamente via Node.js).
2. `INDEX_SERIALIZED = PASS` (emitido como JSON UTF-8 canônico).
3. `INDEX_PACKAGED_V2 = PASS` (empacotado no Provisioning Package v2).
4. `INDEX_IMPORTED = PASS` (importado pelo `PackageImporter` do cliente).
5. `INDEX_PERSISTED = PASS` (salvo no filesystem privado do app).
6. `INDEX_RELOADED_FROM_STORAGE = PASS` (recarregado via `StorageInterface`).
7. `SAME_QUERIES_SAME_RESULTS_BEFORE_AFTER_TRANSPORT = PASS` (mesmas queries retornam resultados idênticos).

---

## 14. Package Format v2

- `SEARCH_ENABLED_PACKAGE_FORMAT_VERSION = 2`.
- Conteúdo do Pacote v2:
  - `manifest.json`
  - `catalog.json`
  - `search-index.json`
- Proteção de integridade estendida:
  - `manifest.searchIndexFile = "search-index.json"`
  - `manifest.searchIndexVersion = 1`
  - `manifest.searchIndexSha256`: hash SHA-256 do arquivo em disco
  - `manifest.searchIndexSizeBytes`: tamanho exato em bytes
  - `manifest.searchIndexContentHash`: hash lógico do índice
  - `manifest.packageContentHash`: hash SHA-256 composto ligando imutavelmente o catálogo, o índice de busca e os campos do manifesto.

---

## 15. Backward Compatibility com Package Format v1

- `PACKAGE_FORMAT_V1_BACKWARD_COMPATIBLE = REQUIRED (PASS)`.
- Pacotes v1 (`PACKAGE_FORMAT_VERSION = 1`) contendo apenas `manifest.json` e `catalog.json` continuam sendo perfeitamente construídos, validados e importados pelo runtime G5/G6.
- Quando um pacote v1 é importado:
  - O catálogo é ativado com sucesso.
  - A interface do catálogo continua funcionando normalmente.
  - A busca reporta `SEARCH_INDEX_UNAVAILABLE`, sem quebrar o app e sem forçar reindexação local não autorizada.

---

## 16. Bootstrap v2 e Importação Segura

Fluxo transacional em `PackageImporter`:
1. Validação estrita do pacote v2 contra manifest e schemas (fail-closed).
2. Validação lógica do `search-index.json` e verificação de amarras (`catalogSnapshotId` e `catalogVersion`).
3. Escrita em diretório temporário/staging (`catalog.json` e `search-index.json`).
4. Readback e revalidação de integridade do staging.
5. Promoção atômica para o diretório de snapshots (`prebuilt/snapshots/<snapshotId>/`).
6. Atualização segura do ponteiro ativo (`active-pointer.json`).
7. Em caso de falha no índice v2, o snapshot **não é promovido** e o último snapshot bom é preservado intacto.

---

## 17. Storage Privado do Aplicativo

- `SEARCH_STORAGE = CAPACITOR_FILESYSTEM_CANONICAL_JSON`.
- Armazenamento em diretório privado da aplicação (`Directory.Data` via Capacitor Filesystem).
- Estrutura física no dispositivo:
  ```
  prebuilt/
    active-pointer.json
    snapshots/
      <snapshotId>/
        manifest.json
        catalog.json
        search-index.json
  ```
- Nenhum uso de IndexedDB, LevelDB ou SQLite.

---

## 18. Startup e Inicialização da Busca

- `SearchService` realiza inicialização leve:
  1. Lê o `active-pointer.json`.
  2. Carrega `search-index.json` já pronto a partir do snapshot ativo.
  3. Valida se o snapshot corresponde ao catálogo ativo.
  4. Materializa estruturas efêmeras de leitura em memória (Map / Set de postings).
  5. Transiciona o estado para `SEARCH_READY`.
- `ON_DEVICE_FULL_REINDEX_AT_STARTUP = NAO`.

---

## 19. Proibição de Rebuild Automático

- `SEARCH_INDEX_DEVICE_STARTUP_REBUILD = PROHIBITED`.
- Se o índice estiver ausente (pacote v1) ou corrompido, o sistema **não** faz varredura de catálogo para reconstruir índice.
- O estado de busca permanece `SEARCH_INDEX_UNAVAILABLE` ou `SEARCH_INDEX_INVALID`, informando o usuário sem travar o dispositivo.

---

## 20. Mecanismo de Consulta (SearchEngine)

- Consultas operam estritamente sobre a tabela invertida (`postings`) e os documentos indexados.
- Proibido executar varreduras completas lineares `catalog.movies.filter(...)` para busca global.
- O catálogo completo só é consultado pelo ID (`CatalogReadModel.getMovieById`) após a busca retornar os IDs ranqueados.
- Modos suportados:
  - `EXACT_TITLE`
  - `PREFIX`
  - `MULTI_TOKEN`
  - `PARTIAL_TITLE`
  - `GENRE`
  - `YEAR`

---

## 21. Interface do Usuário (Search UI)

- Integrada na rota `/search` e adicionada à barra de navegação do `Header`.
- Componentes modulares em `src/ui/`:
  - `SearchPage.tsx`: página principal orquestrando estado e navegação.
  - `SearchInput.tsx`: campo de busca com autofocus, suporte a input controlado e teclas de atalho.
  - `SearchResults.tsx`: grid de resultados com cards clicáveis, badges de tipo (Filme / Série) e ano.
  - `SearchState.tsx`: exibição clara de estados informativos (buscando, sem resultados, índice indisponível).

---

## 22. Navegação D-pad e Teclado

- Totalmente compatível com controle remoto de Android TV / Fire Stick e teclado:
  - `SEARCH_INPUT_FOCUSABLE = PASS`
  - `ENTER_SUBMITS_OR_ACTIVATES = PASS`
  - `ARROW_DOWN_FROM_INPUT_TO_RESULTS = PASS` (seta para baixo desce o foco do input para o primeiro card de resultado).
  - `ARROW_NAVIGATION_RESULTS = PASS` (navegação espacial básica e setas nos cards).
  - `ENTER_OPENS_SEARCH_RESULT = PASS` (abertura direta da tela de detalhe correspondente).
  - `BACK_RETURNS_FROM_SEARCH = PASS` (tecla Escape ou botão Voltar retorna à tela anterior).

---

## 23. Estados Explícitos da Busca

O sistema modela formalmente:
1. `SEARCH_NO_ACTIVE_CATALOG`: nenhum catálogo ativo no dispositivo.
2. `SEARCH_INDEX_UNAVAILABLE`: catálogo ativo existe (ex.: pacote v1), mas sem índice de busca.
3. `SEARCH_INDEX_LOADING`: leitura do arquivo do índice em progresso.
4. `SEARCH_READY`: índice carregado e pronto para consultas locais.
5. `SEARCH_INDEX_INVALID`: índice falhou na validação de integridade.
6. `SEARCH_QUERY_EMPTY`: busca pronta aguardando digitação de termos.
7. `SEARCH_RESULTS`: termos casaram e resultados estão disponíveis.
8. `SEARCH_NO_RESULTS`: termos válidos digitados, mas nenhum item casou.

---

## 24. Fail-Closed e Proteção do Catálogo

- `INVALID_SEARCH_INDEX_PRESERVES_CATALOG = PASS`.
- Se o arquivo de índice estiver corrompido, com hash inválido ou snapshot incompatível:
  - O catálogo ativo permanece intacto e acessível pela UI.
  - A interface de busca apresenta mensagem segura: "Busca temporariamente indisponível".
  - O aplicativo não quebra nem entra em crash loop.

---

## 25. Minimização de Dados (Data Minimization)

- `SEARCH_INDEX_DATA_MINIMIZATION = PASS`.
- O documento de busca armazena estritamente o necessário para normalização e ranqueamento:
  - `id`, `kind`, `title`, `originalTitle`, `year`, `genreIds`, `categoryIds`.
- Exclusões deliberadas:
  - Sinopse completa (`overview`): omitida (fica no catálogo para consulta no detalhe).
  - Referências a streams (`streamRefs`): omitidas.
  - URIs de pôsteres/artworks: omitidas.
  - Qualquer identificador de origem de dados ou credenciais: terminantemente omitido.

---

## 26. Segurança e Baseline Anti-Exposição

- `SEARCH_INDEX_SECRETS_EXPOSURE = NAO`.
- `SECRETS_CLIENT_EXPOSURE = NAO`.
- Validador `SearchIndexValidator` rejeita preventivamente qualquer payload que contenha padrões de tokens de autenticação, senhas, chaves privadas ou URLs com credenciais.
- Proteção estrita contra path traversal mantida em todos os paths de arquivos do pacote v2.

---

## 27. Benchmark Sintético em Grande Escala (240.000 Itens)

- Executado via `scripts/benchmark-prebuilt-search-scale.mjs` (`npm run search:benchmark`).
- Geração determinística de 240.000 documentos sintéticos (filmes e séries balanceados) para simular o volume do catálogo real histórico sem violar regras de dados protegidos.
- Registra latência de build externo, tamanho em disco serializado, estimativa comprimida gzip, tempo de carregamento no runtime, tempo de materialização de estruturas em memória, latências de consultas pontuais e consumo de memória (RSS / heap).

---

## 28. Limitações Técnicas

- Ausência de stemmer específico para língua portuguesa ou outros idiomas.
- Buscas aproximadas (fuzzy tolerante a erros de digitação) não implementadas no MVP G7 para manter simplicidade determinística e alta performance.
- Episódios individuais de séries não aparecem na busca global direta (apenas a série em si).

---

## 29. Evidência não é SLA

- `PERFORMANCE_EVIDENCE_IS_NOT_SLA = SIM`.
- Os tempos medidos em ambiente Node/Workstation são dados observacionais para verificação de complexidade algorítmica e estabilidade de memória.
- Nenhuma métrica constitui SLA contratual de produto ou garantia em hardware restrito antes do Gate G11.

---

## 30. Relação com Gates Anteriores e Posteriores (G6 -> G7 -> G8)

- **G6 (Catalog UI)**: forneceu a navegação básica, catálogo local em memória e telas de detalhe.
- **G7 (Prebuilt Search)**: adicionou o pacote v2, índice invertido externo, storage de busca e UI de busca que navega diretamente para as telas de detalhe existentes do G6.
- **G8 (Source & Playback)**: consumirá as referências de streaming a partir dos detalhes, permanecendo a busca completamente isolada de reprodutores e URLs de vídeo.

---

## 31. Escopo Não Autorizado (Out-of-Scope)

- Nenhuma reprodução de vídeo (`PLAYBACK_IMPLEMENTED = NAO`).
- Nenhuma resolução de stream (`DIRECT_STREAM_RESOLUTION_IMPLEMENTED = NAO`).
- Nenhum uso de catálogo real ou credencial real (`REAL_DATA_USED = NAO`).
- Nenhuma conexão em runtime ou migração com Supabase (`SUPABASE_RUNTIME_CONNECTION = NAO`).
- Nenhuma assinatura criptográfica assimétrica ou criptografia de pacote no G7.

---

## 32. Decisões Fechadas pelo Gate G7

- `SEARCH_INDEX_FORMAT = CANONICAL_JSON_INVERTED_INDEX_V1`
- `SEARCH_INDEX_VERSION = 1`
- `SEARCH_NORMALIZATION_VERSION = 1`
- `SEARCH_INDEX_BUILD = EXTERNAL_PREBUILT`
- `SEARCH_STORAGE = CAPACITOR_FILESYSTEM_CANONICAL_JSON`
- `SEARCH_INDEX_TRANSPORTABILITY = PROVEN_SYNTHETIC_LOGICAL`
- `SEARCH_SEED_STRATEGY = PREBUILT_INDEX_REQUIRED_FOR_FAST_SEARCH`
- `SEARCH_INDEX_DEVICE_STARTUP_REBUILD = PROHIBITED`
- `SEARCH_QUERY_NETWORK = NONE`
- `SEARCH_RANKING = DETERMINISTIC_WEIGHTED_TEXT_V1`
- `SEARCH_DOCUMENT_KINDS = MOVIE_SERIES`
- `SEARCH_INDEX_DATA_MINIMIZATION = REQUIRED`
- `SEARCH_ENABLED_PACKAGE_FORMAT_VERSION = 2`
- `PACKAGE_FORMAT_V1_BACKWARD_COMPATIBLE = REQUIRED`

---

## 33. Critérios de Aceitação do Gate G7

1. Build externo de índice determinístico gerando `search-index.json`.
2. Validação estrita de schema, integridade e amarras de catálogo.
3. Pacote v2 com backward compatibility garantida para pacotes v1.
4. Importação e persistência local atômica via `PackageImporter`.
5. Carregamento instantâneo no startup sem reindexação de catálogo.
6. Consultas locais resilientes (exato, prefixo, multi-token, sem acentos, case-insensitive).
7. UI acessível por D-pad e navegação integrada com telas de detalhe.
8. Benchmark em 240k documentos sintéticos executado com evidências capturadas.
9. Regressões G2 a G6 100% PASS.
10. Nenhuma dependência pesada introduzida e zero exposição de segredos.
