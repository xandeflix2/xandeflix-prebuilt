# Pipeline de Ingestão Externa (Ingestion Pipeline)

---

## 1. Propósito

O pipeline de ingestão externa do projeto `XANDEFLIX_PREBUILT` tem por objetivo receber dados brutos provenientes de provedores de catálogo externos, validar sua integridade estrutural básica, normalizá-los deterministicamente para o contrato canônico de dados (`PrebuiltCatalog` v1) e emitir snapshots estruturados para posterior empacotamento.

O pipeline opera estritamente fora do dispositivo cliente (`EXTERNAL_PREPROCESSING`), garantindo que o processamento pesado de parsing, deduplicação, sanitização e mapeamento relacional não onere o runtime local da aplicação móvel/TV.

---

## 2. Escopo do Gate G3

No âmbito exclusivo do Gate G3:
- **Fontes Sintéticas e Controladas**: Todo o fluxo é implementado e validado exclusivamente contra fixtures sintéticas e dados artificiais controlados (`fixtures/source/synthetic-source.valid.json` e `fixtures/source/synthetic-source.invalid.json`).
- **Isolamento de Produção**: Nenhuma conexão com provedor real (Xtream Codes, listas M3U ou APIs de terceiros) é realizada neste Gate.
- **Isolamento de Credenciais**: Nenhuma credencial real de usuário, senha ou token transita pelo pipeline.
- **Isolamento de Infraestrutura**: Nenhuma persistência em Supabase, Edge Function remota ou fila distribuída é ativada.
- **Saída**: Produção de payload em memória ou temporário local (`tmp/ingestion-output/`), sem geração de pacote de provisionamento final (`PROVISIONING_PACKAGE_IMPLEMENTED=NAO`).

---

## 3. Arquitetura do Pipeline

O pipeline segue o padrão clássico de processamento em estágios lineares e desacoplados:

```
[Entrada Bruta / Fixture]
           │
           ▼
┌───────────────────────┐
│     SourceAdapter     │  1. adapter.load(input) -> RawSourceCatalog
│  (SyntheticAdapter)   │  2. adapter.validate(raw) -> SourceValidationResult
└──────────┬────────────┘
           │
           ▼ (Raw Model Validado)
┌───────────────────────┐
│     Normalization     │  3. normalizeRawCatalog(raw, options)
│ (Deterministic Engine)│     -> IDs estáveis, deduplicação, contagens, SHA-256
└──────────┬────────────┘
           │
           ▼ (PrebuiltCatalog v1 Candidato)
┌───────────────────────┐
│ Post-Norm Validation  │  4. validateNormalizedCatalog(catalog)
│ (JSON Schema 2020-12) │     -> Ajv + regras de integridade relacional
└──────────┬────────────┘
           │
           ▼
[IngestionResult: Sucesso determinístico ou Falha Fechada (Fail-Closed)]
```

---

## 4. Contrato do Source Adapter (`SourceAdapter`)

A interface `SourceAdapter` (`src/ingestion/source-adapter.ts`) define o contrato que qualquer adaptador de entrada deve implementar:

```typescript
export interface SourceAdapter {
  readonly name: string;
  load(input: unknown): Promise<RawSourceCatalog> | RawSourceCatalog;
  validate(raw: RawSourceCatalog): SourceValidationResult;
}
```

Responsabilidades do Adaptador:
- Realizar parse do formato específico da fonte (JSON, texto, stream);
- Mapear a entrada para a representação intermediária `RawSourceCatalog`;
- Executar validações de higienização do modelo bruto;
- Não decidir o schema canônico final;
- Não conter credenciais embutidas em código.

---

## 5. Modelo Intermediário Bruto (`RawSourceModel`)

O modelo intermediário (`src/ingestion/types.ts`) desacopla as particularidades das fontes externas do contrato de dados canônico (`RAW_MODEL_SEPARATED_FROM_CANONICAL_CONTRACT=SIM`):

- `RawSourceCatalog`: Contém `sourceName`, `sourceVersion`, `movies` e `series`.
- `RawMovie`: Identificador bruto da fonte (`sourceItemId`), título original e de exibição com possíveis espaços residuais, ano como número ou texto, categorias brutas em texto, gêneros brutos em texto, streams e artworks brutos.
- `RawSeries`: Identificador bruto, metadados de série e array hierárquico de `RawSeason`.
- `RawSeason`: Número da temporada e array de `RawEpisode`.
- `RawEpisode`: Número do episódio, título, duração e streams brutos.

---

## 6. Normalização Determinística

O motor de normalização (`src/ingestion/normalize.ts`) executa transformações puras e determinísticas:
1. **Higienização de Texto**: Aplicação de `trim()` em títulos, resumos e nomes;
2. **Conversão de Tipos**: Conversão segura de anos e durações numéricas;
3. **Mapeamento de Relacionamentos**: Construção das árvores de referências cruzadas;
4. **Ordenação Lexicográfica**: Todas as coleções (`movies`, `series`, `seasons`, `episodes`, `categories`, `genres`, `streams`, `artworks`) são ordenadas por seus respectivos identificadores `id` (`id.localeCompare(b.id)`), assegurando saída serializada byte a byte idêntica.

---

## 7. Estratégia de Identificadores Determinísticos (`INGESTION_ID_STRATEGY`)

Para garantir replays idênticos e integridade de cache, nenhum identificador é gerado via números aleatórios ou UUID v4. Todos os IDs são determinísticos:

| Entidade | Padrão do ID Canônico | Exemplo |
| :--- | :--- | :--- |
| **Movie** | `{namespace}:movie:{sourceItemId}` | `syn:movie:1001` |
| **Series** | `{namespace}:series:{sourceItemId}` | `syn:series:2001` |
| **Season** | `{namespace}:season:{seriesSourceId}:{seasonNumber}` | `syn:season:2001:1` |
| **Episode** | `{namespace}:episode:{seriesSourceId}:{seasonNumber}:{episodeNumber}` | `syn:episode:2001:1:1` |
| **Category** | `{namespace}:cat:{slug(name)}` | `syn:cat:acao-sintetica` |
| **Genre** | `{namespace}:genre:{slug(name)}` | `syn:genre:ficcao-cientifica` |
| **Artwork** | `{namespace}:art:{entityId}:{kind}` | `syn:art:syn:movie:1001:poster` |
| **Stream** | `{namespace}:stream:{contentKind}:{sourceItemId}` | `syn:stream:movie:stream-m-1001` |

---

## 8. Normalização de Categorias e Gêneros

- **Categorias**: Nomes brutos repetidos entre filmes e séries são unificados pelo seu `slug`. O campo `contentKinds` acumula deterministicamente se a categoria atende a `'movie'`, `'series'` ou ambos, sendo ordenado alfabeticamente.
- **Gêneros**: Deduplicação global por slug, mantendo uma única entidade canônica de gênero que é apenas referenciada por IDs nos títulos.

---

## 9. Tratamento Seguro de Streams e Artworks

- **Artworks**: Apenas referências de URI sintéticas são registradas. URIs contendo credenciais inline (`://.*:.*@`) são sumariamente rejeitadas.
- **Streams**: Geram referências opacas `StreamRef` contendo `sourceItemId`, `contentKind`, extensão de container e label de qualidade. Nenhuma URL direta com usuário/senha ou token é gerada (`STREAM_CREDENTIAL_EMBEDDING=PROHIBITED`). A resolução dinâmica de streaming é postergada para o Gate G8.

---

## 10. Contrato de Saída

A saída gerada pelo pipeline satisfaz integralmente o contrato `PrebuiltCatalog` v1:
- `metadata`: `schemaVersion=1`, `catalogVersion`, `snapshotId`, `generatedAt`, `counts` e `generator`.
- Arrays normalizados e referencialmente íntegros de `categories`, `genres`, `movies`, `series`, `seasons`, `episodes`, `streams` e `artworks`.
- `snapshotId`: Hash SHA-256 dos dados estáveis ordenados (excluindo timestamp), assegurando que replays idênticos produzam o mesmo identificador de snapshot.

---

## 11. Política de Falha Fechada (Fail-Closed)

O pipeline opera sob o princípio `FAIL_CLOSED=SIM`:
- Qualquer violação no carregamento da fonte, validação do modelo bruto, normalização ou validação canônica pós-normalização resulta em encerramento imediato com erro;
- Em caso de falha, nenhum snapshot parcial é persistido ou retornado como sucesso (`success=false`);
- Proteção total contra false-empty e dados truncados.

---

## 12. Logging Sanitizado

Os registros de log do pipeline são estruturados e limpos:
- Registram: adaptador utilizado, quantidade de itens processados por tipo, duração em milissegundos e status final;
- Proibição absoluta: Nunca registrar tokens de autenticação, senhas, chaves privadas ou URLs com credenciais inline.

---

## 13. Métricas do Pipeline

O pipeline coleta e disponibiliza métricas estruturadas de execução:
- `SOURCE_ITEMS_TOTAL`
- `MOVIES_NORMALIZED`
- `SERIES_NORMALIZED`
- `SEASONS_NORMALIZED`
- `EPISODES_NORMALIZED`
- `CATEGORIES_NORMALIZED`
- `GENRES_NORMALIZED`
- `STREAMS_NORMALIZED`
- `ARTWORKS_NORMALIZED`
- `PIPELINE_DURATION_MS`

> **Nota**: As medições de tempo são dados observacionais para benchmark empírico e não constituem SLAs contratuais de produto (`PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM`).

---

## 14. Fronteiras de Segurança

1. `SECRETS_CLIENT_EXPOSURE=NAO`: Nenhuma credencial ou chave privada transita pelo pipeline;
2. `STREAM_CREDENTIAL_EMBEDDING=PROHIBITED`: Streams contêm apenas identificadores opacos de fonte;
3. `NO_REMOTE_NETWORK_ACCESS`: O pipeline opera localmente sem chamadas de rede não autorizadas;
4. `FAIL_ON_CREDENTIAL_IN_URI`: Qualquer URI contendo formato `user:pass@` é rejeitada na validação.

---

## 15. Validação com Fixtures Sintéticas

- `fixtures/source/synthetic-source.valid.json`: Fonte válida composta por 2 filmes e 1 série (2 temporadas, 4 episódios) com títulos com espaços residuais, anos em texto e categorias compartilhadas, comprovando a eficácia da normalização e determinismo.
- `fixtures/source/synthetic-source.invalid.json`: Fixture corrompida com itens sem ID, ano inválido e IDs duplicados, comprovando a rejeição fail-closed.
- Testes negativos adicionais executados em memória garantem a rejeição de payloads JSON malformados, referências quebradas e URIs credentialized.

---

## 16. Itens Fora de Escopo no G3 (Out-of-Scope)

- Conexão e autenticação com provedores reais Xtream Codes ou listas M3U;
- Download real de imagens e caching de mídias;
- Empacotamento de distribuição (`Provisioning Package`), escopo do Gate G4;
- Importação no SQLite/IndexedDB do dispositivo cliente, escopo do Gate G5;
- Mecanismo de busca e indexação, escopo do Gate G6;
- Reprodução de streaming e resolução de URLs de playback, escopo do Gate G8;
- Integração com Supabase (tabelas, migrações, funções remotas).

---

## 17. Futura Extensão para Adaptadores Reais

A arquitetura orientada a `SourceAdapter` permite a inclusão futura de novos adaptadores (como `XtreamSourceAdapter` ou `M3uSourceAdapter`) nos gates de produção sem necessidade de alterar o motor de normalização nem o contrato canônico de dados. Cada adaptador futuro apenas precisará converter suas respostas de rede para a interface intermediária `RawSourceCatalog`.

---

## 18. Rastreabilidade com os Gates

- **G2 (Data Contract)**: Fornece o JSON Schema (`schemas/prebuilt-catalog.schema.json`) e a tipagem TypeScript (`src/contracts/catalog.ts`) que servem como especificação canônica de saída do pipeline.
- **G3 (External Ingestion Pipeline)**: Implementa e valida a ingestão e normalização externa contra fontes sintéticas.
- **G4 (Provisioning Package)**: Receberá o catálogo normalizado do G3 e implementará o empacotamento versionado e assinado para distribuição ao cliente.
