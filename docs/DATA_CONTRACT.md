# Contrato de Dados do Catalogo Prebuilt (Data Contract v1)

---

## 1. Proposito

Este documento estabelece o contrato formal de dados para o catalogo **PREBUILT** do projeto **Xandeflix Prebuilt** (`XANDEFLIX_PREBUILT`).
Ele serve como a fronteira logica e semantica estrita entre:
- **EXTERNAL_PREPROCESSING**: Processos de ingestao, normalizacao e geracao de pacotes que ocorrem fora do cliente;
- **DEVICE_LOCAL_RUNTIME**: Importacao, persistencia em armazenamento local, busca e visualizacao que operam no dispositivo.

---

## 2. Escopo

O contrato abrange a modelagem logica, tipagem e regras de integridade para as entidades de conteudo sob demanda:
- **Filmes (Movies)**
- **Series (Series)**
- **Temporadas (Seasons)**
- **Episodios (Episodes)**
- **Categorias (Categories)**
- **Generos (Genres)**
- **Referencias de Midia/Artworks (ArtworkRef)**
- **Referencias de Streams de Video (StreamRef)**
- **Metadados de Snapshot (SnapshotMetadata)**

---

## 3. Versao do Contrato

- **SCHEMA_VERSION**: `1`
- Toda entidade raiz de catalogo declara explicitamente `metadata.schemaVersion = 1`.
- O interpretador/validador do cliente deve falhar de forma fechada (*fail-closed*) diante de versoes de schema desconhecidas ou incompativeis.

---

## 4. Fonte Unica da Verdade (One Source of Truth)

Para eliminar qualquer ambiguidade ou contratos concorrentes:
- **CANONICAL_MACHINE_CONTRACT**: `schemas/prebuilt-catalog.schema.json` (JSON Schema Draft 2020-12).
- **CANONICAL_HUMAN_CONTRACT**: `docs/DATA_CONTRACT.md` (este documento).
- **TYPESCRIPT_CONTRACT**: `src/contracts/catalog.ts` (espelho direto tipado das interfaces e enums do schema).

---

## 5. Entidades e Modelo Conceitual

O modelo opera de forma normalizada e relacional, independente do meio de transporte (`TRANSPORT_NEUTRAL=SIM`):

```
       ┌───────────┐         ┌───────────┐
       │ Category  │         │   Genre   │
       └─────┬─────┘         └─────┬─────┘
             │                     │
             ▼                     ▼
       ┌─────────────────────────────────┐
       │             Movie               │◄───┐
       └───────┬─────────────────┬───────┘    │
               │                 │            │
               ▼                 ▼            │
         ┌────────────┐    ┌───────────┐      │
         │ ArtworkRef │    │ StreamRef │      │
         └────────────┘    └───────────┘      │
               ▲                 ▲            │
               │                 │            │
       ┌───────┴─────────────────┴───────┐    │
       │            Episode              │    │
       └───────────────▲─────────────────┘    │
                       │                      │
       ┌───────────────┴─────────────────┐    │
       │             Season              │    │
       └───────────────▲─────────────────┘    │
                       │                      │
       ┌───────────────┴─────────────────┐    │
       │             Series              │────┘ (genreIds, categoryIds, artworkIds)
       └─────────────────────────────────┘
```

---

## 6. Campos e Detalhamento das Entidades

### 6.1. Metadata do Snapshot (`SnapshotMetadata`)
- `schemaVersion` (inteiro, constante `1`): versao estrutural do contrato.
- `catalogVersion` (string, obrigatorio): versao semantica do conteudo emitido.
- `snapshotId` (string, obrigatorio): identificador unico e imutavel daquele lote.
- `generatedAt` (string, obrigatorio): timestamp ISO 8601 em UTC da geracao.
- `counts` (objeto, obrigatorio): objeto contendo contagens declaradas (`movies`, `series`, `seasons`, `episodes`, `categories`, `genres`, `streams`, `artworks`).
- `generator` (string, opcional): identificador do pipeline gerador.

### 6.2. Categoria (`Category`)
- `id` (string, obrigatorio): identificador unico.
- `name` (string, obrigatorio): nome legivel da categoria.
- `contentKinds` (array de string, obrigatorio): tipos aplicaveis (`"movie"`, `"series"`).

### 6.3. Genero (`Genre`)
- `id` (string, obrigatorio): identificador unico.
- `name` (string, obrigatorio): nome legivel do genero.

### 6.4. ArtworkRef (`ArtworkRef`)
- `id` (string, obrigatorio): identificador unico da imagem.
- `kind` (string, obrigatorio): `"poster"`, `"backdrop"`, `"thumbnail"`, `"logo"`.
- `uri` (string, obrigatorio): URI publica/autorizada sem credenciais embutidas.
- `width` (inteiro, opcional): largura em pixels (> 0).
- `height` (inteiro, opcional): altura em pixels (> 0).
- `mimeType` (string, opcional): tipo MIME (ex: `"image/jpeg"`).

### 6.5. StreamRef (`StreamRef`)
- `id` (string, obrigatorio): identificador unico da referencia.
- `sourceItemId` (string, obrigatorio): identificador opaco do item na fonte de dados.
- `contentKind` (string, obrigatorio): `"movie"`, `"series"`, `"episode"`.
- `containerExtension` (string, opcional): extensao/formato do container (ex: `"mp4"`, `"mkv"`, `"ts"`).
- `qualityLabel` (string, opcional): rotulo de resolucao (ex: `"1080p"`, `"4k"`, `"720p"`).

### 6.6. Filme (`Movie`)
- `id` (string, obrigatorio): identificador unico do filme.
- `title` (string, obrigatorio): titulo principal do filme.
- `originalTitle` (string, opcional): titulo no idioma original.
- `year` (inteiro, opcional): ano de lancamento (1888-2100).
- `overview` (string, opcional): sinopse do filme.
- `durationSeconds` (inteiro, opcional): duracao em segundos.
- `genreIds` (array de string, obrigatorio): lista de IDs em `genres`.
- `categoryIds` (array de string, obrigatorio): lista de IDs em `categories`.
- `artworkIds` (array de string, obrigatorio): lista de IDs em `artworks`.
- `streamIds` (array de string, obrigatorio): lista de IDs em `streams`.
- `externalIds` (objeto, opcional): `tmdbId`, `imdbId`, `sourceItemId`.

### 6.7. Serie (`Series`)
- `id` (string, obrigatorio): identificador unico da serie.
- `title` (string, obrigatorio): titulo principal da serie.
- `originalTitle` (string, opcional): titulo original.
- `year` (inteiro, opcional): ano de lancamento da serie.
- `overview` (string, opcional): sinopse.
- `genreIds` (array de string, obrigatorio): lista de IDs em `genres`.
- `categoryIds` (array de string, obrigatorio): lista de IDs em `categories`.
- `artworkIds` (array de string, obrigatorio): lista de IDs em `artworks`.
- `seasonIds` (array de string, obrigatorio): lista de IDs em `seasons`.
- `externalIds` (objeto, opcional): `tmdbId`, `imdbId`, `sourceItemId`.

### 6.8. Temporada (`Season`)
- `id` (string, obrigatorio): identificador unico da temporada.
- `seriesId` (string, obrigatorio): referencia a `series.id`.
- `seasonNumber` (inteiro, obrigatorio): numero ordinal da temporada (>= 0).
- `title` (string, opcional): titulo da temporada.
- `episodeIds` (array de string, obrigatorio): lista de IDs em `episodes`.
- `artworkIds` (array de string, opcional): lista de IDs em `artworks`.

### 6.9. Episodio (`Episode`)
- `id` (string, obrigatorio): identificador unico do episodio.
- `seriesId` (string, obrigatorio): referencia a `series.id`.
- `seasonId` (string, obrigatorio): referencia a `seasons.id`.
- `episodeNumber` (inteiro, obrigatorio): numero ordinal do episodio (>= 0).
- `title` (string, obrigatorio): titulo do episodio.
- `overview` (string, opcional): sinopse.
- `durationSeconds` (inteiro, opcional): duracao em segundos.
- `artworkIds` (array de string, obrigatorio): lista de IDs em `artworks`.
- `streamIds` (array de string, obrigatorio): lista de IDs em `streams`.
- `externalIds` (objeto, opcional): `sourceItemId`.

---

## 7. Cardinalidade

- Uma `Series` possui `1..N` `Season`.
- Uma `Season` pertence a exatamente `1` `Series` e possui `1..N` `Episode`.
- Um `Episode` pertence a exatamente `1` `Series` e a `1` `Season`.
- Um `Movie` ou `Episode` possui `0..N` `StreamRef` (minimo de 1 recomendado para titulos jogaveis).
- Um titulo (filme, serie, episodio) pode referenciar `0..N` `ArtworkRef`.

---

## 8. Nullability e Semantica de Dados Ausentes

- **Campos Obrigatorios**: Nao podem ser `null`, `undefined` nem strings vazias.
- **Campos Opcionais**: Quando ausentes do payload, devem ser omitidos em vez de representados como `null`.
- **Colecoes Vazias**: Arrays vazios `[]` sao validos apenas onde a presenca de itens for opcional (ex: sem posters cadastrados). Em `Category.contentKinds`, o array deve conter pelo menos 1 item.
- **Distincao Semantica**: Um campo ausente representa dado nao fornecido pela fonte original; jamais deve ser inferido como vazio falso (*false-empty*).

---

## 9. Identificadores (IDs)

- `UNIQUE_ENTITY_IDS=REQUIRED`: Cada entidade possui ID proprio, unico em sua colecao.
- **IDs Opacos e Estaveis**: IDs devem ser alfanumericos compativeis com o padrao regex `^[A-Za-z0-9_.:-]+$`.
- Proibido o uso de titulos, nomes ou indices de array como identificadores primarios.

---

## 10. Integridade Referencial

Todas as referencias cruzadas de identificadores devem ser rigorosamente satisfeitas:
- `movie.genreIds` → `genres.id`
- `movie.categoryIds` → `categories.id`
- `movie.artworkIds` → `artworks.id`
- `movie.streamIds` → `streams.id`
- `series.genreIds` → `genres.id`
- `series.categoryIds` → `categories.id`
- `series.artworkIds` → `artworks.id`
- `series.seasonIds` → `seasons.id`
- `season.seriesId` → `series.id`
- `season.episodeIds` → `episodes.id`
- `episode.seriesId` → `series.id`
- `episode.seasonId` → `seasons.id`
- `episode.artworkIds` → `artworks.id`
- `episode.streamIds` → `streams.id`

Qualquer chave estrangeira sem correspondente na colecao de destino torna o snapshot invalido e forca rejeicao imediata.

---

## 11. Politica de Duplicidades

- `DUPLICATE_ID_POLICY=REJECT`: A presenca de dois elementos com o mesmo ID em qualquer colecao e estritamente proibida e causa falha de validacao.

---

## 12. Versionamento e Evolucao

- Versao de Contrato Atual: `1`.
- Mudancas retrocompativeis (adicao de campos opcionais em entidades ou novas propriedades em `extensions`) preservam `schemaVersion=1`.
- Mudancas que quebrem compatibilidade ou alterem tipos obrigatorios exigirao incremento de versao (`schemaVersion=2`) com migrador formal.

---

## 13. Compatibilidade e Transporte

- `TRANSPORT_NEUTRAL=SIM`: O formato do payload e JSON canônico, agnostico ao mecanismo de armazenamento ou distribuicao (arquivo direto, banco SQLite, compressao gzip/zstd ou banco em memoria).

---

## 14. Seguranca e Isolamento de Credenciais

- `STREAM_CREDENTIAL_EMBEDDING=PROHIBITED`: O catalogo prebuilt transporta apenas identificadores opacos (`sourceItemId`). Nenhuma credencial de usuario, senha ou token de streaming trafega no contrato.
- `DIRECT_PLAYBACK_RESOLUTION=DEFERRED_TO_G8`: A resolucao de URLs reproduziveis ocorrera sob demanda no Gate G8 diretamente pelo player nativo.
- `NO_SECRETS_IN_URI`: As URIs em `ArtworkRef` sao sanitizadas contra padroes de autenticacao inline (`user:pass@`).

---

## 15. Protecao contra Falso Vazio e Truncamento (False-Empty Protection)

Para impedir que snapshots corrompidos ou downloads incompletos substituam um catalogo integro no dispositivo:
- `DECLARED_COUNTS_MUST_MATCH_ACTUAL_COUNTS=REQUIRED`: Cada contagem declarada em `metadata.counts` deve ser rigorosamente igual a quantidade de itens presentes no respectivo array.
- **Distincao Estrutural**:
  - `VALID_EMPTY_CATALOG`: Todos os arrays estao presentes como `[]` e todas as contagens em `counts` sao explicitamente `0`.
  - `INCOMPLETE_OR_TRUNCATED_CATALOG`: Discrepancia entre contagens declaradas e itens recebidos, ou ausencia de colecoes obrigatorias. O importador do cliente rejeita o pacote truncado e preserva o snapshot anterior.

---

## 16. Exemplo Sintetico

Um exemplo completo, valido e auditavel encontra-se versionado em:
`fixtures/prebuilt-catalog.synthetic.json`

---

## 17. Decisoes que Permanecem Abertas

Os seguintes topicos arquiteturais nao sao fechados pelo G2:
- `PROVISIONING_PACKAGE_FORMAT`: Empacotamento fisico final do pacote.
- `PACKAGE_SIGNING_STRATEGY`: Algoritmo criptografico de assinatura digital do pacote.
- `PACKAGE_ENCRYPTION`: Criptografia em repouso do artefato.
- `INCREMENTAL_UPDATE_STRATEGY`: Algoritmo de diferenciacao delta entre versoes de catalogos.
- `ARTWORK_CACHE_POLICY`: Politica de retencao e prefetching local de posters.

---

## 18. Fora de Escopo do Gate G2 (OUT_OF_SCOPE_G2)

- Ingestao real de fontes Xtream ou M3U (escopo do Gate G3).
- Implementacao de cliente de download de midia.
- Criacao de tabelas ou alteracao de schema no Supabase.
- Canais lineares / Live TV (nao contemplados no modelo inicial de catalogo prebuilt).
- Player e reproducao de midia (escopo do Gate G8).
- Motor de indexacao e busca (escopo do Gate G7).

---

## 19. Criterios de Validacao Automatizada

A aderencia ao contrato e garantida pelo comando:
```bash
npm run contract:check
```
que valida a conformidade contra o JSON Schema, verifica unicidade de IDs, afere integridade referencial, confere contagens declaradas e executa uma suite de testes negativos em memoria.

---

## 20. Rastreabilidade aos Gates

| Gate | Papel em Relacao ao Contrato de Dados |
| :--- | :--- |
| **G2** (Ativo) | Define schemas canonicos, tipos TypeScript, fixture e validador. |
| **G3** | Produz dados normalizados aderentes a este contrato a partir de fontes. |
| **G4** | Empacota a estrutura gerada em artefatos de provisionamento imutaveis. |
| **G5** | Consome este formato no cliente para bootstrap instantaneo. |
| **G6** | Consome os tipos TypeScript e colecoes locais para exibir a UI. |
| **G7** | Indexa campos de texto (`title`, `overview`, `genres`) para busca local. |
| **G8** | Mapeia `StreamRef.sourceItemId` para reproducao direta. |
| **G9** | Aplica deltas e mutacoes preservando `schemaVersion=1`. |
