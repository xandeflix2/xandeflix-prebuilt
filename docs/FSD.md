# Functional Specification Document (FSD) — Framework Normativo

---

## 1. Status do Documento

- `FUNCTIONAL_FLOWS_DEFINED=SIM`
- `FSD_FRAMEWORK_ESTABLISHED=SIM`
- `G3_FLOWS_FORMALIZED=SIM`

---

## 2. Framework Estrutural Padrao para Fluxos Funcionais

Todo fluxo funcional futuro devera ser documentado utilizando rigorosamente o template estrutural abaixo:

### Template Padrao de Fluxo Funcional

```markdown
### [FLOW_ID] — Nome do Fluxo

- **FLOW_ID**: Identificador unico em snake_case ou maiusculas (ex: FLOW_IMPORT_PROVISIONING_PACKAGE).
- **TRIGGER**: Evento de negocio ou do sistema que dispara o fluxo.
- **PRECONDITIONS**: Estados do sistema, permissoes ou dados previamente exigidos.
- **MAIN_FLOW**: Passos sequenciais de sucesso numerados cronologicamente.
- **ALTERNATIVE_FLOW**: Caminhos alternativos validos de execucao.
- **ERROR_FLOW**: Tratamento de excecoes, falhas de rede, dados corrompidos ou erros de validacao.
- **TERMINAL_STATES**: Estados finais alcancados pelo sistema (ex: SUCCESS, FAILED_RECOVERABLE, ABORTED).
- **DATA_READ**: Fontes de dados lidas (tabelas, arquivos locais, bundles).
- **DATA_WRITE**: Mutacoes de dados persistidas localmente ou remotamente.
- **NETWORK**: Requisicoes de rede disparadas (protocolo, destinos, volumes aproximados).
- **SECURITY**: Validacoes criptograficas, sanitizacao de credenciais, checagem de integridade.
- **OBSERVABILITY**: Logs de eventos, metricas emitidas e spans de rastreabilidade.
- **ACCEPTANCE_CRITERIA**: Criterios objetivos e mensuraveis para homologacao do fluxo.
- **TRACEABILITY**: Relacao com requisitos do PRD e contratos arquiteturais.
```

---

## 3. Previsao de Categorias de Fluxos

Conforme os Gates forem abertos pelo Chat Mestre, as seguintes categorias de fluxos serao formalizadas:

1. **Pipeline de Ingestao Externa** (Gate G3 - Definido abaixo);
2. **Bootstrap e Aquisicao de Pacote** (Gate G4/G5);
3. **Validacao e Ingestao de Pacote Local** (Gate G5);
4. **Navegacao e Catalogo UI** (Gate G6);
5. **Mecanismo de Busca Local** (Gate G7);
6. **Autenticacao de Fonte e Playback Direto** (Gate G8);
7. **Atualizacao Incremental / Delta Sync** (Gate G9);
8. **Recuperacao de Falha e Modo Offline** (Gate G10).

---

## 4. Fluxos Funcionais do Pipeline de Ingestão Externa (Gate G3)

### F-G3-001_SYNTHETIC_INGESTION_SUCCESS — Ingestão e Normalização com Sucesso de Fonte Sintética

- **FLOW_ID**: `F-G3-001_SYNTHETIC_INGESTION_SUCCESS`
- **TRIGGER**: Execução do pipeline de ingestão externa (`npm run ingestion:synthetic`) com entrada sintética válida.
- **PRECONDITIONS**: Arquivo de fixture sintética (`fixtures/source/synthetic-source.valid.json`) acessível; JSON Schema canônico compilável.
- **MAIN_FLOW**:
  1. O pipeline instancia `SyntheticSourceAdapter` e `IngestionPipeline`;
  2. O adaptador lê a fonte, faz parse do JSON e valida a conformidade do modelo intermediário bruto (`RawSourceCatalog`);
  3. O motor de normalização processa filmes, séries, temporadas e episódios:
     - Realiza `trim()` em strings;
     - Converte valores numéricos seguros de `year` e `durationSeconds`;
     - Extrai, deduplica e normaliza categorias e gêneros, atribuindo IDs determinísticos (`syn:cat:*`, `syn:genre:*`);
     - Gera identificadores opacos e estáveis de stream e artwork;
     - Ordena todas as coleções lexicograficamente por ID;
  4. O motor calcula as contagens reais (`SnapshotCounts`) e gera o `snapshotId` determinístico via hash SHA-256 do conteúdo estável;
  5. O validador pós-normalização avalia o `PrebuiltCatalog` v1 contra o JSON Schema Draft 2020-12 e valida a integridade referencial completa;
  6. O catálogo é retornado com sucesso (`success: true`) e gravado no diretório temporário `tmp/ingestion-output/`.
- **ALTERNATIVE_FLOW**: N/A no modo sintético controlado.
- **ERROR_FLOW**: Se qualquer validação intermediária falhar, transiciona para `F-G3-002` ou `F-G3-003`.
- **TERMINAL_STATES**: `SUCCESS_INGESTION_COMPLETE`.
- **DATA_READ**: `fixtures/source/synthetic-source.valid.json`, `schemas/prebuilt-catalog.schema.json`.
- **DATA_WRITE**: `tmp/ingestion-output/synthetic-catalog.json` (gitignored).
- **NETWORK**: Nenhuma conexão externa (`NO_NETWORK_ACCESS=SIM`).
- **SECURITY**: Proibição estrita de credenciais embutidas em URIs de stream e artefato; ausência de segredos.
- **OBSERVABILITY**: Logs sanitizados exibindo métricas de itens processados por entidade e duração em milissegundos.
- **ACCEPTANCE_CRITERIA**: `result.success === true`, `result.catalog` válido conforme schema v1, todas as referências íntegras e contagens coincidentes.
- **TRACEABILITY**: Requisitos do Gate G3, Architecture Contract seção 3, Data Contract v1.

---

### F-G3-002_INVALID_SOURCE_REJECTION — Rejeição Fail-Closed de Fonte Externa Inválida

- **FLOW_ID**: `F-G3-002_INVALID_SOURCE_REJECTION`
- **TRIGGER**: Submissão de entrada bruta com defeitos estruturais (item sem ID, ano inválido, ID duplicado ou credencial em URI).
- **PRECONDITIONS**: Pipeline de ingestão ativo.
- **MAIN_FLOW**:
  1. O adaptador recebe a entrada corrompida via `adapter.load()` ou `adapter.validate()`;
  2. O validador de fonte bruta detecta a anomalia (ex: `sourceItemId` ausente, duplicado, ano não numérico ou URI com `user:pass@`);
  3. O pipeline interrompe imediatamente o processamento (fail-closed);
  4. Nenhum snapshot parcial é emitido (`success: false`);
  5. Lista de erros sanitizados é retornada.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Retorno imediato de falha controlada sem exceções não tratadas no runtime.
- **TERMINAL_STATES**: `FAILED_INVALID_SOURCE_REJECTED`.
- **DATA_READ**: `fixtures/source/synthetic-source.invalid.json` ou mutações em memória.
- **DATA_WRITE**: Nenhum dado é gravado (`NO_PARTIAL_SNAPSHOT_WRITTEN`).
- **NETWORK**: Nenhuma conexão externa.
- **SECURITY**: Bloqueio de dados maliciosos ou payloads contendo vazamento de credenciais inline.
- **OBSERVABILITY**: Registro do erro com identificador do campo violado, sem expor dados privados.
- **ACCEPTANCE_CRITERIA**: `result.success === false`, array de erros contendo a descrição exata da violação.
- **TRACEABILITY**: Regras de governança Fail-Closed do Gate G3.

---

### F-G3-003_CONTRACT_VALIDATION_FAILURE — Rejeição de Catálogo com Quebra de Contrato Canônico

- **FLOW_ID**: `F-G3-003_CONTRACT_VALIDATION_FAILURE`
- **TRIGGER**: Normalização resulta em catálogo que viola o JSON Schema v1 ou apresenta referência quebrada / contagem divergente.
- **PRECONDITIONS**: Etapa de normalização concluída; validador canônico pós-normalização ativo.
- **MAIN_FLOW**:
  1. O validador pós-normalização executa `validateNormalizedCatalog(catalog)`;
  2. Detecta violação no JSON Schema (campo ausente, tipo inválido), chave estrangeira órfã (ex: `genreId` inexistente) ou contagem divergente;
  3. O pipeline rejeita a emissão do catálogo (`success: false`);
  4. O catálogo candidato é descartado.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Retorno de erro estruturado indicando violação do contrato canônico.
- **TERMINAL_STATES**: `FAILED_CONTRACT_VALIDATION`.
- **DATA_READ**: Catálogo normalizado em memória, JSON Schema.
- **DATA_WRITE**: Nenhum dado gravado.
- **NETWORK**: Nenhuma.
- **SECURITY**: Garantia de que payloads defeituosos jamais se tornem snapshots válidos.
- **OBSERVABILITY**: Logs com os nós específicos que violaram o contrato.
- **ACCEPTANCE_CRITERIA**: `result.success === false`, `result.errors` com mensagens descritivas do Ajv ou checagem relacional.
- **TRACEABILITY**: Alinhamento com o princípio ONE_SOURCE_OF_TRUTH e Data Contract v1.

---

### F-G3-004_DETERMINISTIC_REPLAY — Validação de Reprodutibilidade e Determinismo

- **FLOW_ID**: `F-G3-004_DETERMINISTIC_REPLAY`
- **TRIGGER**: Execuções sequenciais do pipeline contra a mesma fonte sintética para atestar idempotência e determinismo.
- **PRECONDITIONS**: Execução prévia bem-sucedida (`F-G3-001`).
- **MAIN_FLOW**:
  1. O pipeline é executado uma segunda vez com os mesmos parâmetros de namespace e versão;
  2. O catálogo gerado na segunda execução é comparado com o catálogo da primeira execução;
  3. Compara-se o `snapshotId` gerado (SHA-256 do conteúdo);
  4. Compara-se a serialização JSON completa de todas as coleções ordenadas;
  5. Constata-se igualdade 100% estrita de IDs, referências, contagens e estrutura;
  6. O status `PIPELINE_DETERMINISTIC=SIM` é emitido.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se houver qualquer divergência de ID ou ordenação entre as execuções, o fluxo falha com `DETERMINISM_VIOLATION`.
- **TERMINAL_STATES**: `SUCCESS_DETERMINISTIC_MATCH`.
- **DATA_READ**: Mesma fonte da execução inicial.
- **DATA_WRITE**: Nenhuma mutação concorrente.
- **NETWORK**: Nenhuma.
- **SECURITY**: Garantia de que snapshots possam ser confiavelmente validados e cacheados.
- **OBSERVABILITY**: Log confirmando coincidência estrita de IDs e hash de snapshot.
- **ACCEPTANCE_CRITERIA**: `snapshotIdRun1 === snapshotIdRun2`, `JSON.stringify(catalog1) === JSON.stringify(catalog2)`.
- **TRACEABILITY**: Requisitos do Gate G3 seção 16 (Determinismo).

