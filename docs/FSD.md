# Functional Specification Document (FSD) — Framework Normativo

---

## 1. Status do Documento

- `FUNCTIONAL_FLOWS_DEFINED=SIM`
- `FSD_FRAMEWORK_ESTABLISHED=SIM`
- `G3_FLOWS_FORMALIZED=SIM`
- `G4_FLOWS_FORMALIZED=SIM`
- `G5_FLOWS_FORMALIZED=SIM`
- `G6_FLOWS_FORMALIZED=SIM`
- `G7_FLOWS_FORMALIZED=SIM`

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

1. **Pipeline de Ingestao Externa** (Gate G3 - Formalizado);
2. **Pacote de Provisionamento e Empacotamento** (Gate G4 - Formalizado abaixo);
3. **Bootstrap e Ingestao de Pacote no Dispositivo** (Gate G5);
4. **Navegacao e Catalogo UI** (Gate G6 - Formalizado);
5. **Mecanismo de Busca Local** (Gate G7 - Formalizado abaixo);
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

---

## 5. Fluxos Funcionais do Pacote de Provisionamento (Gate G4)

### F-G4-001_PACKAGE_BUILD_SUCCESS — Construção Bem-Sucedida de Pacote de Provisionamento ZIP

- **FLOW_ID**: `F-G4-001_PACKAGE_BUILD_SUCCESS`
- **TRIGGER**: Execução do comando de build de provisionamento (`npm run provisioning:build`) ou chamada de `PackageBuilder.build(catalog)`.
- **PRECONDITIONS**: `PrebuiltCatalog` v1 válido disponível em memória (fornecido pelo pipeline G3).
- **MAIN_FLOW**:
  1. O `PackageBuilder` recebe o catálogo e executa validação prévia contra o Data Contract v1 (`validateNormalizedCatalog`);
  2. Serializa deterministicamente o catálogo em `catalog.json` UTF-8;
  3. Calcula o hash SHA-256 dos bytes (`catalogSha256`) e obtém o tamanho exato (`catalogSizeBytes`);
  4. Monta o descritor `manifest.json` com `packageFormatVersion=1`, `schemaVersion=1`, `catalogVersion`, `snapshotId` e calcula o hash lógico imutável `packageContentHash`;
  5. Cria um arquivo ZIP em memória adicionando estritamente `manifest.json` e `catalog.json` com compressão `DEFLATE` nível 9;
  6. Grava opcionalmente o arquivo ZIP em `tmp/provisioning/xandeflix-prebuilt-catalog.zip`;
  7. Retorna `BuildPackageResult` com `success: true` e métricas sanitizadas.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se o catálogo de entrada for inválido contra o contrato de dados v1, aborta e retorna `success: false` com erros detalhados.
- **TERMINAL_STATES**: `SUCCESS_PACKAGE_BUILT`.
- **DATA_READ**: `PrebuiltCatalog` válido em memória.
- **DATA_WRITE**: Arquivo ZIP temporário em `tmp/provisioning/` (gitignored).
- **NETWORK**: Nenhuma conexão externa (`NO_NETWORK_ACCESS=SIM`).
- **SECURITY**: Ausência de segredos ou credenciais no manifest e no catálogo; manifesto aponta unicamente para arquivo interno seguro.
- **OBSERVABILITY**: Logs emitindo hashes SHA-256, tamanhos em bytes, taxa de compressão e tempo de execução.
- **ACCEPTANCE_CRITERIA**: `result.success === true`, `packageBuffer` válido, `manifest.packageContentHash` coincidente com bytes calculados, `packageFormatVersion === 1`.
- **TRACEABILITY**: Requisitos do Gate G4, Architecture Contract seção 4, `docs/PROVISIONING_PACKAGE.md`.

---

### F-G4-002_PACKAGE_VALIDATION_SUCCESS — Validação Completa de Integridade do Pacote

- **FLOW_ID**: `F-G4-002_PACKAGE_VALIDATION_SUCCESS`
- **TRIGGER**: Chamada de `PackageValidator.validate(packageSource)` em arquivo ZIP ou buffer.
- **PRECONDITIONS**: Arquivo ZIP gerado pelo `PackageBuilder`.
- **MAIN_FLOW**:
  1. O `PackageValidator` descompacta a estrutura do arquivo ZIP via `JSZip`;
  2. Inspeciona o conjunto de nomes de arquivos e certifica ausência de path traversal e ausência de arquivos extras (`UNKNOWN_PACKAGE_FILES=REJECT`);
  3. Confirma presença exata de `manifest.json` e `catalog.json`;
  4. Lê e faz parse do `manifest.json`;
  5. Valida compatibilidade de `packageFormatVersion === 1` e `schemaVersion === 1`;
  6. Extrai os bytes brutos do `catalog.json` e recalcula o SHA-256 e o tamanho em bytes;
  7. Compara os valores com `catalogSha256` e `catalogSizeBytes` declarados no manifest;
  8. Recalcula e valida o `packageContentHash`;
  9. Faz parse do `catalog.json` e valida correspondência de `snapshotId`, `catalogVersion` e `schemaVersion`;
  10. Executa `validateNormalizedCatalog` no catálogo recuperado contra o Data Contract v1;
  11. Audita ausência de padrões de segredos no payload;
  12. Retorna `valid: true`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Qualquer discrepância de hash, tamanho, versão ou contrato resulta em `valid: false` (fail-closed).
- **TERMINAL_STATES**: `SUCCESS_PACKAGE_VALIDATED`.
- **DATA_READ**: Buffer ou arquivo ZIP de provisionamento.
- **DATA_WRITE**: Nenhum dado gravado.
- **NETWORK**: Nenhuma.
- **SECURITY**: Verificação criptográfica de integridade física e lógica antes de qualquer consumo futuro.
- **OBSERVABILITY**: Resultado booleano de validação acompanhado de warnings e erros vazios.
- **ACCEPTANCE_CRITERIA**: `result.valid === true`, `result.errors.length === 0`.
- **TRACEABILITY**: Requisitos do Gate G4 seção 14 e 17.

---

### F-G4-003_PACKAGE_TAMPER_REJECTION — Detecção e Rejeição Imediata de Pacote Adulterado

- **FLOW_ID**: `F-G4-003_PACKAGE_TAMPER_REJECTION`
- **TRIGGER**: Submissão de pacote ZIP contendo `catalog.json` modificado após o build, manifest adulterado com hash incorreto ou tamanho divergente.
- **PRECONDITIONS**: `PackageValidator` ativo.
- **MAIN_FLOW**:
  1. O validador extrai o `catalog.json` e recalcula seu SHA-256 e tamanho em bytes;
  2. Constata discrepância com os valores registrados no `manifest.json`;
  3. Registra erro `[HASH_MISMATCH]` e/ou `[SIZE_MISMATCH]`;
  4. Interrompe a aprovação do pacote imediatamente (fail-closed);
  5. Retorna `valid: false`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição determinística e controlada.
- **TERMINAL_STATES**: `FAILED_PACKAGE_TAMPERED`.
- **DATA_READ**: Arquivo ZIP adulterado.
- **DATA_WRITE**: Nenhum dado gravado.
- **NETWORK**: Nenhuma.
- **SECURITY**: Bloqueio de qualquer ataque de modificação man-in-the-middle ou corrupção de armazenamento.
- **OBSERVABILITY**: Emissão de log com hashes divergentes identificados.
- **ACCEPTANCE_CRITERIA**: `result.valid === false`, `TAMPERED_CATALOG_REJECTED=PASS`, `HASH_MISMATCH_REJECTED=PASS`.
- **TRACEABILITY**: Requisitos do Gate G4 seção 17 e 26.

---

### F-G4-004_PACKAGE_VERSION_REJECTION — Rejeição de Pacotes com Versões Incompatíveis

- **FLOW_ID**: `F-G4-004_PACKAGE_VERSION_REJECTION`
- **TRIGGER**: Pacote com `packageFormatVersion != 1`, `schemaVersion != 1` ou divergência entre versão no manifest e versão no catálogo.
- **PRECONDITIONS**: `PackageValidator` ativo.
- **MAIN_FLOW**:
  1. O validador analisa as propriedades de versão do manifest;
  2. Detecta versão não suportada pelo runtime atual (`packageFormatVersion` ou `schemaVersion`);
  3. Ou detecta discrepância entre o `snapshotId`/`catalogVersion` declarado no manifest e o gravado dentro do `catalog.json`;
  4. Registra erro `[PACKAGE_VERSION_MISMATCH]`, `[SCHEMA_VERSION_MISMATCH]` ou `[SNAPSHOT_MISMATCH]`;
  5. Retorna `valid: false`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição fail-closed.
- **TERMINAL_STATES**: `FAILED_VERSION_INCOMPATIBLE`.
- **DATA_READ**: Manifest e catálogo do pacote.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Prevenção contra execução de esquemas depreciados ou incompatíveis com o dispositivo.
- **OBSERVABILITY**: Log descrevendo a versão encontrada versus a versão esperada.
- **ACCEPTANCE_CRITERIA**: `result.valid === false`, `PACKAGE_VERSION_MISMATCH_REJECTED=PASS`.
- **TRACEABILITY**: Requisitos do Gate G4 seção 22 e 23.

---

### F-G4-005_PACKAGE_STRUCTURE_REJECTION — Rejeição por Violação Estrutural, Arquivo Extra ou Path Traversal

- **FLOW_ID**: `F-G4-005_PACKAGE_STRUCTURE_REJECTION`
- **TRIGGER**: Pacote contendo arquivo extra não autorizado, ausência de `manifest.json` ou `catalog.json`, ou entradas maliciosas com sequências de subida de diretório (`..`, `\`).
- **PRECONDITIONS**: `PackageValidator` ativo.
- **MAIN_FLOW**:
  1. O validador lista todas as entradas do arquivo ZIP;
  2. Detecta violação da política `UNKNOWN_PACKAGE_FILES=REJECT` (arquivo adicional desconhecido);
  3. Ou detecta padrões de path traversal (`..`, `\`, caminhos absolutos);
  4. Ou constata a ausência de um dos dois arquivos canônicos obrigatórios;
  5. Registra o erro de violação estrutural (`[PATH_TRAVERSAL_DETECTED]`, `[EXTRA_FILE_REJECTED]`, `[MISSING_MANIFEST]` ou `[MISSING_CATALOG]`);
  6. Aborta a inspeção e retorna `valid: false`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Bloqueio sumário fail-closed.
- **TERMINAL_STATES**: `FAILED_STRUCTURE_VIOLATION`.
- **DATA_READ**: Entradas do arquivo ZIP.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Proteção ativa do sistema de arquivos do cliente contra arbitrariedades e injeção de arquivos parasitários.
- **OBSERVABILITY**: Log especificando a entrada maliciosa ou anômala detectada.
- **ACCEPTANCE_CRITERIA**: `result.valid === false`, `EXTRA_FILE_REJECTED=PASS`, `PATH_TRAVERSAL_REJECTED=PASS`.
- **TRACEABILITY**: Requisitos do Gate G4 seção 15, 16 e 26.

---

## 6. Fluxos Funcionais de Bootstrap e Persistência Local (Gate G5)

### F-G5-001_FIRST_IMPORT_SUCCESS — Primeira Importação e Promoção de Catálogo Local

- **FLOW_ID**: `F-G5-001_FIRST_IMPORT_SUCCESS`
- **TRIGGER**: Disparo da primeira importação de pacote via `BootstrapService.importPackage(packageSource)` no cliente.
- **PRECONDITIONS**: Sistema em estado `NO_ACTIVE_CATALOG`; pacote ZIP válido recebido.
- **MAIN_FLOW**:
  1. O importador valida integralmente o pacote via `PackageValidator` (G4);
  2. Verifica que não há catálogo ativo anterior coincidente;
  3. Escreve os arquivos do snapshot na área de quarentena `prebuilt/staging/<snapshotId>/`;
  4. Executa a validação de releitura (`STAGING_READBACK_VALIDATION`), confirmando hash SHA-256 e contrato de dados v1;
  5. Promove o snapshot para `prebuilt/snapshots/<snapshotId>/`;
  6. Grava atomicamente o ponteiro `prebuilt/active.json`;
  7. Remove resíduos da pasta de staging;
  8. Transiciona o estado do bootstrap para `ACTIVE_CATALOG_READY`;
  9. Retorna `ImportResult` com `status: 'PROMOTED'` e métricas completas de instrumentação.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se qualquer validação preliminar ou de releitura falhar, aborta a promoção e mantém `NO_ACTIVE_CATALOG`.
- **TERMINAL_STATES**: `SUCCESS_FIRST_IMPORT_PROMOTED`.
- **DATA_READ**: Buffer ou arquivo ZIP de provisionamento.
- **DATA_WRITE**: `prebuilt/snapshots/<snapshotId>/`, `prebuilt/active.json`.
- **NETWORK**: Nenhuma (`NO_NETWORK_ACCESS=SIM`).
- **SECURITY**: Gravação restrita a armazenamento privado do aplicativo (`APP_PRIVATE_STORAGE=SIM`).
- **OBSERVABILITY**: Emissão de métricas de tempo para validação, staging, readback e promoção.
- **ACCEPTANCE_CRITERIA**: `result.success === true`, `result.status === 'PROMOTED'`, `hasActiveCatalog === true`.
- **TRACEABILITY**: Requisitos do Gate G5, Architecture Contract seção 4, `docs/DEVICE_BOOTSTRAP.md`.

---

### F-G5-002_REIMPORT_IDEMPOTENT — Reimportação Idempotente do Mesmo Pacote Ativo

- **FLOW_ID**: `F-G5-002_REIMPORT_IDEMPOTENT`
- **TRIGGER**: Submissão de pacote idêntico ao já ativo no dispositivo.
- **PRECONDITIONS**: Catálogo ativo pré-existente (`ACTIVE_CATALOG_READY`).
- **MAIN_FLOW**:
  1. O importador valida o pacote de entrada;
  2. Compara `snapshotId` e `packageContentHash` com o `ActivePointer` atual;
  3. Constata coincidência absoluta de geração;
  4. Não regrava arquivos no disco nem altera o ponteiro ativo;
  5. Retorna imediatamente `status: 'ALREADY_ACTIVE'` com `success: true`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `SUCCESS_IDEMPOTENT_NOOP`.
- **DATA_READ**: Pacote de entrada, `prebuilt/active.json`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Economia de I/O e proteção contra desgaste de memória flash sem exposição de dados.
- **OBSERVABILITY**: Log de detecção de reimportação idempotente.
- **ACCEPTANCE_CRITERIA**: `result.success === true`, `result.status === 'ALREADY_ACTIVE'`, `snapshotId` inalterado.
- **TRACEABILITY**: Requisitos do Gate G5 seção 18.

---

### F-G5-003_NEW_GENERATION_PROMOTION — Atualização para Nova Geração Válida de Snapshot

- **FLOW_ID**: `F-G5-003_NEW_GENERATION_PROMOTION`
- **TRIGGER**: Submissão de novo pacote válido com `snapshotId` ou versão distinta da atualmente ativa.
- **PRECONDITIONS**: Catálogo `A` atualmente ativo.
- **MAIN_FLOW**:
  1. O importador valida o novo pacote `B`;
  2. Grava `B` em quarentena `prebuilt/staging/<snapshotIdB>/`;
  3. Executa `STAGING_READBACK_VALIDATION` com sucesso;
  4. Promove `B` para a pasta de snapshots;
  5. Atualiza o `ActivePointer` para apontar atomicamente para `B`;
  6. Limpa o staging;
  7. O catálogo ativo no runtime passa a ser `B` (`ACTIVE_SNAPSHOT_ID !== SNAPSHOT_A`).
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se `B` falhar em qualquer validação, transiciona para `F-G5-005`.
- **TERMINAL_STATES**: `SUCCESS_NEW_GENERATION_ACTIVE`.
- **DATA_READ**: Pacote `B`, `prebuilt/active.json`.
- **DATA_WRITE**: `prebuilt/snapshots/<snapshotIdB>/`, `prebuilt/active.json`.
- **NETWORK**: Nenhuma.
- **SECURITY**: Isolamento entre gerações de snapshots em disco.
- **OBSERVABILITY**: Emissão de métricas com registro do `previousSnapshotId` e novo `snapshotId`.
- **ACCEPTANCE_CRITERIA**: `result.success === true`, `result.status === 'PROMOTED'`, `pointer.snapshotId === snapshotIdB`.
- **TRACEABILITY**: Requisitos do Gate G5 seção 19.

---

### F-G5-004_INVALID_PACKAGE_REJECTED — Rejeição Fail-Closed de Pacote Inválido

- **FLOW_ID**: `F-G5-004_INVALID_PACKAGE_REJECTED`
- **TRIGGER**: Submissão de pacote corrompido, adulterado, com versão divergente ou path traversal.
- **PRECONDITIONS**: `PackageImporter` ativo.
- **MAIN_FLOW**:
  1. O validador do pacote detecta a violação (hash mismatch, schema mismatch, arquivo extra ou path traversal);
  2. A importação é abortada imediatamente antes de qualquer gravação em staging;
  3. Retorna `status: 'REJECTED'` com array detalhado de erros;
  4. O estado de catálogo ativo permanece inalterado.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição fail-closed sem exceções de runtime não tratadas.
- **TERMINAL_STATES**: `FAILED_PACKAGE_REJECTED`.
- **DATA_READ**: Pacote inválido.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Bloqueio prévio absoluto de dados não conformes.
- **OBSERVABILITY**: Logs de rejeição especificando o código de erro detectado.
- **ACCEPTANCE_CRITERIA**: `result.success === false`, `result.status === 'REJECTED'`, nenhum snapshot criado.
- **TRACEABILITY**: Requisitos do Gate G5 seção 15 e 29.

---

### F-G5-005_FAILED_UPDATE_PRESERVES_ACTIVE — Preservação do Catálogo Ativo após Falha de Atualização

- **FLOW_ID**: `F-G5-005_FAILED_UPDATE_PRESERVES_ACTIVE`
- **TRIGGER**: Tentativa de atualização a partir de pacote defeituoso enquanto há um catálogo íntegro ativo.
- **PRECONDITIONS**: Snapshot `B` ativo; pacote defeituoso `C` recebido.
- **MAIN_FLOW**:
  1. O importador rejeita o pacote `C` na fase 1 ou na fase 4 (readback);
  2. Qualquer resíduo de `C` em staging é eliminado (`cleanupStaging`);
  3. O `ActivePointer` não é tocado e permanece apontando para `B`;
  4. O estado do bootstrap transiciona para `IMPORT_FAILED_ACTIVE_PRESERVED`;
  5. `getActiveCatalog()` continua retornando o catálogo íntegro `B`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Retorno controlado de erro com preservação de continuidade operacional.
- **TERMINAL_STATES**: `FAILED_ACTIVE_PRESERVED`.
- **DATA_READ**: Pacote `C`, `prebuilt/active.json`.
- **DATA_WRITE**: Limpeza da pasta de staging de `C`.
- **NETWORK**: Nenhuma.
- **SECURITY**: Garantia de resiliência e disponibilidade do catálogo local.
- **OBSERVABILITY**: Log indicando rejeição do pacote candidato e manutenção do snapshot ativo prévio.
- **ACCEPTANCE_CRITERIA**: `activePointer.snapshotId === snapshotIdB`, `FAILED_UPDATE_PRESERVES_LAST_GOOD=PASS`.
- **TRACEABILITY**: Requisitos do Gate G5 seção 20.

---

### F-G5-006_NO_ACTIVE_CATALOG — Tratamento Estrito de Inicialização sem Catálogo

- **FLOW_ID**: `F-G5-006_NO_ACTIVE_CATALOG`
- **TRIGGER**: Inicialização da aplicação antes de qualquer pacote ser importado.
- **PRECONDITIONS**: Armazenamento local sem arquivo `prebuilt/active.json`.
- **MAIN_FLOW**:
  1. `BootstrapService.initialize()` consulta o storage;
  2. Não encontra ponteiro ativo válido;
  3. Define o status como `NO_ACTIVE_CATALOG` com `hasActiveCatalog: false`;
  4. Bloqueia a interpretação de que o catálogo está "vazio" (`NO_FALSE_EMPTY_GUARD`);
  5. Sinaliza à camada de apresentação a necessidade de importação inicial de provisionamento.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `READY_AWAITING_IMPORT`.
- **DATA_READ**: `prebuilt/active.json` (inexistente).
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Impedimento semântico de renderização errônea de estado vazio.
- **OBSERVABILITY**: Status reportado como `NO_ACTIVE_CATALOG`.
- **ACCEPTANCE_CRITERIA**: `summary.status === 'NO_ACTIVE_CATALOG'`, `summary.hasActiveCatalog === false`.
---

## 7. Especificações Funcionais — Gate G6 (Catalog UI)

### F-G6-001_HOME_ACTIVE_CATALOG — Apresentação da Home a partir do Catálogo Local Ativo

- **TRIGGER**: Abertura da aplicação ou seleção da rota `/` (Início) com catálogo local ativo.
- **PRECONDITIONS**: `BootstrapService` com status `ACTIVE_CATALOG_READY` e `hasActiveCatalog: true`.
- **MAIN_FLOW**:
  1. `useActiveCatalog` recupera o `PrebuiltCatalog` ativo via `BootstrapService.getActiveCatalog()`;
  2. `CatalogReadModel` é instanciado em memória indexando categorias, gêneros, filmes e séries;
  3. `getHeroItem()` seleciona deterministicamente o item de destaque;
  4. `getHomeRails()` compõe as faixas temáticas (Destaques, Categorias e Gêneros) respeitando `HOME_RAIL_MAX_ITEMS_INITIAL = 24`;
  5. `HomePage` renderiza o Hero e as faixas com cartões focáveis (`MediaCard`).
- **ALTERNATIVE_FLOW**: Catálogo sem itens suficientes para faixas secundárias: renderiza apenas as faixas disponíveis com dados reais.
- **ERROR_FLOW**: Se falha de leitura ocorrer, transiciona para `LoadingState` ou estado de erro controlado.
- **TERMINAL_STATES**: `HOME_RENDERED`.
- **DATA_READ**: Catálogo ativo via `LocalCatalogStorage`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma (`CATALOG_NETWORK_REQUESTS = 0`).
- **SECURITY**: Nenhuma credencial ou token exposto em componentes.
- **OBSERVABILITY**: Contagem de faixas e itens renderizados auditável em runtime.
- **ACCEPTANCE_CRITERIA**: `HOME_LOCAL_CATALOG_RENDER=PASS`, hero presente e faixas com $\le 24$ itens.
- **TRACEABILITY**: Requisitos do Gate G6 seção 8, 10, 22.

---

### F-G6-002_MOVIES_NAVIGATION — Navegação e Apresentação do Catálogo de Filmes

- **TRIGGER**: Seleção do item "Filmes" na navegação ou rota `/movies`.
- **PRECONDITIONS**: Catálogo ativo pronto em memória.
- **MAIN_FLOW**:
  1. `getAllMovies(readModel)` extrai a lista de filmes ordenada deterministicamente;
  2. `MoviesPage` renderiza barra de filtros por categoria declarada;
  3. `CatalogGrid` renderiza lote inicial de até 48 filmes (`GRID_BATCH_SIZE`);
  4. Usuário pode filtrar por categoria ou clicar em "Carregar Mais" para paginar localmente;
  5. Seleção de um card navega para a rota de detalhe (`movie-detail`).
- **ALTERNATIVE_FLOW**: Categoria sem títulos: exibe mensagem indicando ausência de itens na categoria selecionada.
- **ERROR_FLOW**: Item sem dados opcionais é renderizado com fallbacks seguros.
- **TERMINAL_STATES**: `MOVIES_GRID_RENDERED`.
- **DATA_READ**: `readModel.catalog.movies` e categorias associadas.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Sem chamadas externas ou URLs dinâmicas não sanitizadas.
- **ACCEPTANCE_CRITERIA**: `MOVIES_LOCAL_CATALOG_RENDER=PASS`, grid responsivo, lote inicial $\le 48$.
- **TRACEABILITY**: Requisitos do Gate G6 seção 12, 22, 23.

---

### F-G6-003_SERIES_NAVIGATION — Navegação e Apresentação do Catálogo de Séries

- **TRIGGER**: Seleção do item "Séries" na navegação ou rota `/series`.
- **PRECONDITIONS**: Catálogo ativo pronto em memória.
- **MAIN_FLOW**:
  1. `getAllSeries(readModel)` extrai a lista de séries mapeando metadados e contagem de temporadas;
  2. `SeriesPage` renderiza os cards de série com badge de temporadas;
  3. Seleção de um card navega para a rota `series-detail`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `SERIES_GRID_RENDERED`.
- **DATA_READ**: `readModel.catalog.series` e `seasonsBySeriesId`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Sem dados remotos ou telemetria invasiva.
- **ACCEPTANCE_CRITERIA**: `SERIES_LOCAL_CATALOG_RENDER=PASS`.
- **TRACEABILITY**: Requisitos do Gate G6 seção 13.

---

### F-G6-004_MOVIE_DETAIL — Apresentação dos Detalhes do Filme

- **TRIGGER**: Seleção de um card de filme ou rota `/movie/:id`.
- **PRECONDITIONS**: ID do filme válido no catálogo ativo.
- **MAIN_FLOW**:
  1. `getMovieDetail(readModel, movieId)` resolve metadados completos, duração e gêneros;
  2. `MovieDetailPage` renderiza backdrop cinematográfico, título, ano, sinopse e badges;
  3. Botão "Assistir" é exibido desabilitado com o badge explicativo `PLAYBACK_AVAILABLE_IN_G8`;
  4. Botão "Voltar" ou tecla Back retorna à visualização anterior.
- **ALTERNATIVE_FLOW**: Filme não encontrado: exibe mensagem de item inexistente com botão de retorno.
- **ERROR_FLOW**: Metadados ausentes não geram strings `undefined` ou `NaN`.
- **TERMINAL_STATES**: `MOVIE_DETAIL_RENDERED`.
- **DATA_READ**: Filme, gêneros, categorias e artworks associados no `readModel`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: `PLAYBACK_IMPLEMENTED = NAO`, zero resolução de stream URLs.
- **ACCEPTANCE_CRITERIA**: `MOVIE_DETAIL_RENDER=PASS`, playback desabilitado para G8.
- **TRACEABILITY**: Requisitos do Gate G6 seção 14, 16, 38.

---

### F-G6-005_SERIES_SEASON_DETAIL — Apresentação de Série, Temporadas e Episódios

- **TRIGGER**: Seleção de um card de série ou rota `/series/:id`.
- **PRECONDITIONS**: ID da série válido no catálogo ativo.
- **MAIN_FLOW**:
  1. `getSeriesDetail(readModel, seriesId)` resolve a série, suas temporadas ordenadas e episódios associados;
  2. `SeriesDetailPage` exibe detalhes da série e abas de seleção para cada temporada;
  3. A lista de episódios da temporada ativa é exibida ordenada por `episodeNumber`;
  4. Cada episódio exibe título, duração, sinopse e botão de playback desabilitado (`PLAYBACK_AVAILABLE_IN_G8`).
- **ALTERNATIVE_FLOW**: Série sem episódios em determinada temporada exibe aviso apropriado.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `SERIES_DETAIL_RENDERED`.
- **DATA_READ**: Série, temporadas e episódios do `readModel`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Zero chamadas de rede para resolução de mídia.
- **ACCEPTANCE_CRITERIA**: `SERIES_DETAIL_RENDER=PASS`, `SEASON_EPISODE_RENDER=PASS`.
- **TRACEABILITY**: Requisitos do Gate G6 seção 15.

---

### F-G6-006_NO_ACTIVE_CATALOG — Apresentação de Estado de Ausência de Catálogo

- **TRIGGER**: Abertura do app em dispositivo recém-instalado ou sem pacote importado.
- **PRECONDITIONS**: `BootstrapService` retorna `status === 'NO_ACTIVE_CATALOG'`.
- **MAIN_FLOW**:
  1. `useActiveCatalog` detecta ausência de catálogo ativo;
  2. `NoActiveCatalogState` é renderizado explicitamente;
  3. Informa ao usuário: "Catálogo ainda não disponível neste dispositivo. Aguardando provisionamento de pacote local.";
  4. Bloqueia rigorosamente a renderização de falso-vazio ("Nenhum título encontrado").
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `NO_ACTIVE_CATALOG_DISPLAYED`.
- **DATA_READ**: Estado do bootstrap.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Prevenção de confusão do usuário ou estado inconsistente.
- **ACCEPTANCE_CRITERIA**: `NO_ACTIVE_CATALOG_UI=PASS`, `NO_ACTIVE_NOT_FALSE_EMPTY=PASS`.
- **TRACEABILITY**: Requisitos do Gate G6 seção 6, 29.

---

### F-G6-007_VALID_EMPTY_CATALOG — Apresentação de Catálogo Validamente Vazio

- **TRIGGER**: Carregamento de pacote ativo que foi validado com sucesso mas possui zero títulos.
- **PRECONDITIONS**: `hasActiveCatalog === true`, `status !== 'NO_ACTIVE_CATALOG'`, `movies.length === 0 && series.length === 0`.
- **MAIN_FLOW**:
  1. `useActiveCatalog` valida que há um catálogo ativo promovido e íntegro;
  2. Detecta que as coleções de filmes e séries estão vazias;
  3. Renderiza `EmptyState` com mensagem legítima de catálogo sem conteúdos;
  4. Diferencia formalmente este estado de `NO_ACTIVE_CATALOG`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `VALID_EMPTY_CATALOG_DISPLAYED`.
- **DATA_READ**: Catálogo ativo vazio.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Consistência lógica de estados de dados.
- **ACCEPTANCE_CRITERIA**: `VALID_EMPTY_CATALOG_UI=PASS`.
- **TRACEABILITY**: Requisitos do Gate G6 seção 30.

---

### F-G6-008_FAILED_IMPORT_ACTIVE_PRESERVED_UI — Continuidade da UI após Falha de Importação

- **TRIGGER**: Ocorrência de erro durante atualização de pacote com catálogo ativo prévio íntegro.
- **PRECONDITIONS**: `status === 'IMPORT_FAILED_ACTIVE_PRESERVED'`, snapshot anterior preservado.
- **MAIN_FLOW**:
  1. `BootstrapService` notifica a UI sobre a falha de importação;
  2. `useActiveCatalog` mantém o catálogo ativo anterior em exibição normal;
  3. A UI não limpa a tela nem transiciona para tela de erro fatal;
  4. Um banner superior não-bloqueador é apresentado notificando que a atualização falhou mas o catálogo ativo anterior foi mantido.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Falha de importação tratada de forma fail-closed e transparente.
- **TERMINAL_STATES**: `ACTIVE_CATALOG_PRESERVED_WITH_NOTICE`.
- **DATA_READ**: Catálogo ativo preservado.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Resiliência operacional de dispositivo embarcado (Android TV / Fire TV).
- **ACCEPTANCE_CRITERIA**: `FAILED_IMPORT_ACTIVE_UI_CONTINUES=PASS`.
- **TRACEABILITY**: Requisitos do Gate G6 seção 31.

---

### F-G6-009_DPAD_NAVIGATION_BASELINE — Baseline de Navegação por Teclado e D-Pad

- **TRIGGER**: Pressionamento de teclas direcionais (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`), `Enter` ou `Escape/Backspace` pelo usuário.
- **PRECONDITIONS**: Qualquer página da aplicação ativa.
- **MAIN_FLOW**:
  1. `useDpadNavigation` inicializa foco automático no primeiro elemento focável (`FIRST_FOCUS_ACQUIRED`);
  2. As teclas direcionais movem o foco visual entre botões e cartões de mídia com anel de foco destacado (`FOCUS_VISIBLE`);
  3. Pressionar `Enter` ativa o elemento atualmente em foco (abre detalhes ou troca abas);
  4. Pressionar `Escape` ou `Backspace` navega retroativamente na pilha de histórico de rotas (`BACK_RETURNS_PREVIOUS_VIEW`).
- **ALTERNATIVE_FLOW**: Interação concomitante via touch ou mouse não desabilita nem interfere com a navegação direcional.
- **ERROR_FLOW**: Foco não é perdido em navegações entre telas.
- **TERMINAL_STATES**: `FOCUS_MANAGED`.
- **DATA_READ**: Árvore de elementos DOM focáveis e pilha de rotas.
- **DATA_WRITE**: Estado de rotas na navegação retroativa.
- **NETWORK**: Nenhuma.
- **SECURITY**: Interface acessível sem dependência de apontador físico.
- **ACCEPTANCE_CRITERIA**: `FIRST_FOCUS_ACQUIRED=PASS`, `ARROW_NAVIGATION=PASS`, `ENTER_OPENS_DETAIL=PASS`, `BACK_RETURNS_PREVIOUS_VIEW=PASS`, `FOCUS_VISIBLE=PASS`.
- **TRACEABILITY**: Requisitos do Gate G6 seção 19, 33.

---

## 8. Fluxos Funcionais da Busca Pré-construída (Gate G7)

### F-G7-001_EXTERNAL_INDEX_BUILD — Construção Externa de Índice de Busca Determinístico

- **FLOW_ID**: `F-G7-001_EXTERNAL_INDEX_BUILD`
- **TRIGGER**: Execução do script externo de indexação (`npm run search:index:build`) ou chamada de `SearchIndexBuilder.build(catalog)`.
- **PRECONDITIONS**: `PrebuiltCatalog` v1 válido em memória.
- **MAIN_FLOW**:
  1. `SearchIndexBuilder` extrai todos os filmes e séries do catálogo;
  2. Normaliza títulos, títulos originais, anos, gêneros e categorias com `search-normalization.ts`;
  3. Gera lista invertida (`postings`) associando tokens normalizados a índices dos documentos;
  4. Ordena deterministicamente o array de documentos e as chaves/valores de postings;
  5. Calcula o hash lógico `contentHash` (SHA-256) dos dados estáveis;
  6. Valida o índice gerado contra o schema `prebuilt-search-index.schema.json` e amarras do catálogo;
  7. Retorna `SearchIndex` v1 pronto e serializável.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se o catálogo contiver dados corrompidos ou falhar nas validações, o build falha de forma fail-closed sem gerar índice.
- **TERMINAL_STATES**: `SUCCESS_SEARCH_INDEX_BUILT`.
- **DATA_READ**: `PrebuiltCatalog` em memória.
- **DATA_WRITE**: `tmp/search/search-index.json` (temporário/gitignored).
- **NETWORK**: Nenhuma (`NO_NETWORK_ACCESS=SIM`).
- **SECURITY**: `SEARCH_INDEX_SECRETS_EXPOSURE=NAO`. Ausência de URLs com credenciais, streams ou tokens privados.
- **OBSERVABILITY**: Logs emitindo total de documentos indexados, tokens únicos e hash SHA-256.
- **ACCEPTANCE_CRITERIA**: `SEARCH_INDEX_BUILD=PASS`, `SEARCH_INDEX_DETERMINISTIC=SIM`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 15, 17, 18.

---

### F-G7-002_SEARCH_ENABLED_PACKAGE_V2_BUILD — Construção de Pacote de Provisionamento v2 com Busca

- **FLOW_ID**: `F-G7-002_SEARCH_ENABLED_PACKAGE_V2_BUILD`
- **TRIGGER**: Chamada de `PackageBuilder.build(catalog, { searchIndex })` com `packageFormatVersion=2`.
- **PRECONDITIONS**: `PrebuiltCatalog` válido e `SearchIndex` válido compatível com o catálogo (`snapshotId` e `catalogVersion` coincidentes).
- **MAIN_FLOW**:
  1. `PackageBuilder` valida o catálogo e o índice de busca;
  2. Serializa deterministicamente `catalog.json` e `search-index.json`;
  3. Calcula hashes SHA-256 físicos e tamanhos em bytes de ambos os arquivos;
  4. Constrói `manifest.json` v2 incluindo metadados do índice de busca e calcula `packageContentHash` v2;
  5. Empacota os três arquivos (`manifest.json`, `catalog.json`, `search-index.json`) em ZIP;
  6. Retorna resultado com sucesso contendo o buffer ZIP.
- **ALTERNATIVE_FLOW**: Construção v1 sem busca preservada quando opção de busca não é fornecida.
- **ERROR_FLOW**: Se houver divergência entre o `snapshotId` do catálogo e do índice, aborta com erro.
- **TERMINAL_STATES**: `SUCCESS_PACKAGE_V2_BUILT`.
- **DATA_READ**: Catálogo e índice de busca em memória.
- **DATA_WRITE**: Arquivo ZIP v2 em diretório temporário de provisionamento.
- **NETWORK**: Nenhuma.
- **SECURITY**: Hashes criptográficos e amarras rígidas entre catálogo e índice de busca.
- **OBSERVABILITY**: Logs detalhados com hashes de catálogo, índice e manifesto v2.
- **ACCEPTANCE_CRITERIA**: `PACKAGE_V2_BUILD=PASS`, `packageFormatVersion === 2`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 19, 20.

---

### F-G7-003_DEVICE_IMPORT_SEARCH_INDEX — Importação Transacional de Pacote v2 no Dispositivo

- **FLOW_ID**: `F-G7-003_DEVICE_IMPORT_SEARCH_INDEX`
- **TRIGGER**: Chamada de `PackageImporter.importPackage(packageSource)`.
- **PRECONDITIONS**: Pacote v2 de provisionamento disponível.
- **MAIN_FLOW**:
  1. `PackageValidator.validate` valida a estrutura do ZIP, manifest v2, hashes e schemas;
  2. `PackageImporter` extrai `catalog.json` e `search-index.json` para o diretório de staging;
  3. Executa readback e revalidação de integridade física dos arquivos no staging;
  4. Promove atomicamente os arquivos para `prebuilt/snapshots/<snapshotId>/`;
  5. Atualiza o ponteiro ativo `active-pointer.json` com os metadados do snapshot e do índice;
  6. Retorna status `IMPORTED` e snapshotId ativo.
- **ALTERNATIVE_FLOW**: Importação de pacote v1 continua válida (sem salvar `search-index.json`).
- **ERROR_FLOW**: Se qualquer arquivo falhar na validação no staging, o staging é removido e o snapshot ativo anterior é mantido intacto.
- **TERMINAL_STATES**: `SUCCESS_PACKAGE_V2_IMPORTED`.
- **DATA_READ**: Buffer do pacote v2.
- **DATA_WRITE**: `prebuilt/staging/`, `prebuilt/snapshots/<snapshotId>/`, `prebuilt/active-pointer.json`.
- **NETWORK**: Nenhuma.
- **SECURITY**: Storage privado do app via Capacitor Filesystem, proteção de path traversal e isolamento de geração ativa.
- **ACCEPTANCE_CRITERIA**: `V2_FIRST_IMPORT_WITH_SEARCH=PASS`, `V2_REIMPORT_IDEMPOTENT=PASS`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 24, 25.

---

### F-G7-004_SEARCH_STARTUP_LOAD — Carregamento Inicial do Índice de Busca no Startup

- **FLOW_ID**: `F-G7-004_SEARCH_STARTUP_LOAD`
- **TRIGGER**: Inicialização do cliente ou montagem da UI de busca.
- **PRECONDITIONS**: `BootstrapService` inicializado.
- **MAIN_FLOW**:
  1. `SearchService.initialize()` consulta o ponteiro ativo em storage;
  2. Identifica o snapshot ativo e carrega `search-index.json` já pronto;
  3. Valida amarrações entre `catalogSnapshotId` do índice e catálogo ativo;
  4. Carrega o `SearchEngine` criando mapas rápidos de postings em memória;
  5. Transiciona o estado para `SEARCH_READY`.
- **ALTERNATIVE_FLOW**: Se o snapshot ativo for v1 (sem `search-index.json`), transiciona para `SEARCH_INDEX_UNAVAILABLE`.
- **ERROR_FLOW**: Se o arquivo do índice estiver corrompido, transiciona para `SEARCH_INDEX_INVALID` preservando o catálogo ativo intacto.
- **TERMINAL_STATES**: `SEARCH_READY` ou `SEARCH_INDEX_UNAVAILABLE` ou `SEARCH_INDEX_INVALID`.
- **DATA_READ**: `prebuilt/active-pointer.json`, `prebuilt/snapshots/<snapshotId>/search-index.json`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Nenhum segredo lido ou exposto; validação fail-closed.
- **ACCEPTANCE_CRITERIA**: `ON_DEVICE_FULL_REINDEX_AT_STARTUP=NAO`, `SEARCH_READY_FROM_TRANSPORTED_INDEX=PASS`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 28, 29, 30.

---

### F-G7-005_LOCAL_SEARCH_SUCCESS — Execução de Consulta Local com Resultados Ranqueados

- **FLOW_ID**: `F-G7-005_LOCAL_SEARCH_SUCCESS`
- **TRIGGER**: Usuário digita termo no campo de busca ou chama `SearchService.query(term)`.
- **PRECONDITIONS**: Estado do serviço é `SEARCH_READY`.
- **MAIN_FLOW**:
  1. `SearchEngine.query` normaliza o termo de consulta via `search-normalization.ts`;
  2. Localiza tokens correspondentes nas postings (exato, prefixo, multi-token);
  3. Calcula pontuações determinísticas (`DETERMINISTIC_WEIGHTED_TEXT_V1`);
  4. Aplica desempate alfabético estável por título normalizado e ID canônico;
  5. Retorna lista de `SearchResultItem` contendo ID, kind, título, ano e score;
  6. `SearchResults` renderiza os cartões na tela;
  7. Selecionar um cartão abre a tela de detalhe correspondente (`MovieDetailPage` ou `SeriesDetailPage`).
- **ALTERNATIVE_FLOW**: Aplicação de filtros opcionais locais (`kind`, `genreId`, `year`).
- **ERROR_FLOW**: Termo vazio transiciona para `SEARCH_QUERY_EMPTY`.
- **TERMINAL_STATES**: `SEARCH_RESULTS_DISPLAYED`.
- **DATA_READ**: Postings e documentos do `SearchEngine` em memória.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma (`SEARCH_QUERY_NETWORK=NONE`).
- **SECURITY**: Consulta 100% offline, sem telemetria de termos buscados.
- **ACCEPTANCE_CRITERIA**: `LOCAL_QUERY_EXACT=PASS`, `LOCAL_QUERY_PREFIX=PASS`, `LOCAL_QUERY_MULTI_TOKEN=PASS`, `DETERMINISTIC_RANKING=PASS`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 12, 13, 34, 35.

---

### F-G7-006_LOCAL_SEARCH_NO_RESULTS — Apresentação de Estado de Busca Sem Resultados

- **FLOW_ID**: `F-G7-006_LOCAL_SEARCH_NO_RESULTS`
- **TRIGGER**: Usuário executa consulta válida que não possui correspondência no catálogo indexado.
- **PRECONDITIONS**: `SEARCH_READY`, termo de busca não vazio.
- **MAIN_FLOW**:
  1. `SearchEngine.query` processa a consulta e obtém array vazio de resultados;
  2. `SearchService` emite estado `SEARCH_NO_RESULTS`;
  3. `SearchState` exibe mensagem amigável: "Nenhum resultado encontrado para '<termo>'";
  4. Distingue explicitamente este estado de índice indisponível ou catálogo ausente.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `NO_RESULTS_DISPLAYED`.
- **DATA_READ**: Estruturas de busca em memória.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Nenhum vazamento de informações.
- **ACCEPTANCE_CRITERIA**: `SEARCH_NO_RESULTS_UI=PASS`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 30, 39.

---

### F-G7-007_INVALID_INDEX_SEARCH_UNAVAILABLE — Tratamento Fail-Closed de Índice Corrompido

- **FLOW_ID**: `F-G7-007_INVALID_INDEX_SEARCH_UNAVAILABLE`
- **TRIGGER**: Carregamento de `search-index.json` que falha na validação de schema, hash ou integridade.
- **PRECONDITIONS**: Snapshot ativo possui arquivo `search-index.json` adulterado ou corrompido.
- **MAIN_FLOW**:
  1. `SearchService` detecta erro na validação do arquivo durante o carregamento;
  2. Transiciona o estado de busca para `SEARCH_INDEX_INVALID`;
  3. A UI de busca exibe aviso seguro: "Busca temporariamente indisponível";
  4. O catálogo ativo e todas as outras telas da UI continuam operando normalmente (`CATALOG_UI_CONTINUES=SIM`);
  5. O sistema não tenta refazer o índice nem dispara varreduras pesadas no cliente.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Falha tratada de forma fail-closed sem travar a aplicação.
- **TERMINAL_STATES**: `SEARCH_INDEX_INVALID_CATALOG_PRESERVED`.
- **DATA_READ**: Storage privado.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Isolamento de falhas e resiliência operacional.
- **ACCEPTANCE_CRITERIA**: `INVALID_SEARCH_INDEX_PRESERVES_CATALOG=PASS`, `SEARCH_INDEX_UNAVAILABLE_UI=PASS`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 24, 31.

---

### F-G7-008_V1_PACKAGE_CATALOG_WITHOUT_SEARCH — Retrocompatibilidade com Pacotes de Provisionamento v1

- **FLOW_ID**: `F-G7-008_V1_PACKAGE_CATALOG_WITHOUT_SEARCH`
- **TRIGGER**: Importação e execução de pacote no formato v1 (`PACKAGE_FORMAT_VERSION=1`).
- **PRECONDITIONS**: Pacote v1 contendo apenas `manifest.json` e `catalog.json`.
- **MAIN_FLOW**:
  1. `PackageImporter` importa com sucesso o pacote v1;
  2. O catálogo é promovido e ativado no dispositivo;
  3. `SearchService` detecta ausência de `search-index.json` no snapshot v1;
  4. Define o estado de busca como `SEARCH_INDEX_UNAVAILABLE`;
  5. A UI do catálogo funciona perfeitamente (Home, Filmes, Séries, Detalhes);
  6. A tela de busca informa que a busca não está disponível para o pacote atual sem causar crash.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: O pacote v1 não é rejeitado como corrompido.
- **TERMINAL_STATES**: `V1_CATALOG_ACTIVE_SEARCH_UNAVAILABLE`.
- **DATA_READ**: Snapshot v1.
- **DATA_WRITE**: Storage privado.
- **NETWORK**: Nenhuma.
- **SECURITY**: Garantia estrita de backward compatibility.
- **ACCEPTANCE_CRITERIA**: `PACKAGE_V1_BACKWARD_COMPATIBLE=PASS`, `V1_PACKAGE_BACKWARD_COMPATIBLE=PASS`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 19, 22, 43.

---

### F-G7-009_SEARCH_DPAD_NAVIGATION — Navegação por D-pad e Teclado na Interface de Busca

- **FLOW_ID**: `F-G7-009_SEARCH_DPAD_NAVIGATION`
- **TRIGGER**: Navegação via controle remoto ou setas do teclado na tela `/search`.
- **PRECONDITIONS**: Rota de busca aberta.
- **MAIN_FLOW**:
  1. O campo de busca recebe foco inicial automaticamente (`SEARCH_INPUT_FOCUSABLE=PASS`);
  2. Usuário digita texto e visualiza resultados em tempo real;
  3. Pressionar seta para baixo (`ArrowDown`) no input move o foco diretamente para o primeiro card de resultado (`ARROW_DOWN_FROM_INPUT_TO_RESULTS=PASS`);
  4. Setas direcionais navegam entre os cards de resultados (`ARROW_NAVIGATION_RESULTS=PASS`);
  5. Pressionar `Enter` no card selecionado abre a tela de detalhe correspondente (`ENTER_OPENS_SEARCH_RESULT=PASS`);
  6. Pressionar `Escape` ou Back retorna à visualização anterior (`BACK_RETURNS_FROM_SEARCH=PASS`).
- **ALTERNATIVE_FLOW**: Uso paralelo com touch ou mouse permanece funcional.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `SEARCH_NAVIGATION_HANDLED`.
- **DATA_READ**: DOM elements.
- **DATA_WRITE**: Rota ativa.
- **NETWORK**: Nenhuma.
- **SECURITY**: Compatibilidade com dispositivos Android TV / Fire TV.
- **ACCEPTANCE_CRITERIA**: `SEARCH_DPAD_BASELINE=PASS`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 36, 49.

---

### F-G7-010_INDEX_SNAPSHOT_MISMATCH_REJECTION — Rejeição de Índice com Snapshot Mismatch

- **FLOW_ID**: `F-G7-010_INDEX_SNAPSHOT_MISMATCH_REJECTION`
- **TRIGGER**: Tentativa de validação, empacotamento ou carregamento de índice cujo `catalogSnapshotId` difere do catálogo associado.
- **PRECONDITIONS**: `SearchIndex` possui `catalogSnapshotId != catalog.metadata.snapshotId`.
- **MAIN_FLOW**:
  1. `PackageValidator` ou `SearchService` compara os IDs de snapshot e versões;
  2. Detecta a divergência entre catálogo e índice de busca;
  3. Interrompe imediatamente o processo (fail-closed);
  4. Rejeita o pacote ou marca o índice como inválido;
  5. O catálogo associado não é infectado com dados de busca órfãos.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição determinística e controlada.
- **TERMINAL_STATES**: `FAILED_SNAPSHOT_MISMATCH_REJECTED`.
- **DATA_READ**: Metadados de catálogo e índice.
- **DATA_WRITE**: Nenhum dado corrompido é promovido.
- **NETWORK**: Nenhuma.
- **SECURITY**: Prevenção de corrupção relacional de dados.
- **ACCEPTANCE_CRITERIA**: `SEARCH_INDEX_SNAPSHOT_MISMATCH_REJECTED=PASS`, `SNAPSHOT_MISMATCH_REJECTED=PASS`.
- **TRACEABILITY**: Requisitos do Gate G7 seção 21, 23, 42.

---

## 9. Fluxos Funcionais do Gate G8 (Source and Direct Playback)

### F-G8-001_MOVIE_DIRECT_PLAYBACK_REQUEST — Disparo de Reprodução Direta de Filme

- **FLOW_ID**: `F-G8-001_MOVIE_DIRECT_PLAYBACK_REQUEST`
- **TRIGGER**: Usuário clica ou pressiona Enter no botão "▶ Assistir" na tela `MovieDetailPage`.
- **PRECONDITIONS**: `MovieDetailPage` renderizada com metadados válidos de um filme que possui `streamIds`.
- **MAIN_FLOW**:
  1. O componente aciona `PlaybackService.playMovie(movieId, readModel)`;
  2. A UI atualiza o estado local para `isResolving=true` exibindo "Preparando reprodução...";
  3. `PlaybackService` localiza o primeiro `streamId` do filme e resolve a entidade `StreamRef`;
  4. Encaminha para resolução direta via `DirectStreamResolver` com o `RuntimeSourceContext` ativo;
  5. Despacha a requisição resultante (`ResolvedPlaybackRequest`) para o `NativePlayerClient`;
  6. Em ambiente Android nativo, a `NativePlayerActivity` é aberta em tela cheia.
- **ALTERNATIVE_FLOW**: Em ambiente web puro, o cliente detecta ausência de player nativo e retorna `NATIVE_PLAYER_UNAVAILABLE`, exibindo aviso amigável.
- **ERROR_FLOW**: Se o filme não tiver `streamIds` ou o `StreamRef` não for encontrado, falha fail-closed com `STREAM_REF_NOT_FOUND`.
- **TERMINAL_STATES**: `PLAYING` (Android) ou `UNAVAILABLE` (Web).
- **DATA_READ**: `readModel.moviesById`, `readModel.streamsById`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Conexão direta do player ao host da fonte de mídia (Device → Source).
- **SECURITY**: Nenhum segredo embutido no catálogo; URI sanitizada antes do log.
- **OBSERVABILITY**: Transição de estados emitida para ouvintes do `PlaybackService`.
- **ACCEPTANCE_CRITERIA**: `MOVIE_PLAYBACK_FLOW=PASS`, `MOVIE_DETAIL_PLAYBACK_ACTION=PASS`, `MOVIE_STREAM_REF_LOOKUP=PASS`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 24, 27.

---

### F-G8-002_EPISODE_DIRECT_PLAYBACK_REQUEST — Disparo de Reprodução Direta de Episódio

- **FLOW_ID**: `F-G8-002_EPISODE_DIRECT_PLAYBACK_REQUEST`
- **TRIGGER**: Usuário clica ou aciona o botão "▶ Assistir" de um episódio específico na `SeriesDetailPage`.
- **PRECONDITIONS**: `SeriesDetailPage` renderizada com temporadas e episódios resolvidos.
- **MAIN_FLOW**:
  1. O componente aciona `PlaybackService.playEpisode(seriesId, episodeId, readModel)`;
  2. O episódio específico entra em estado `resolvingEpisodeId=episodeId`;
  3. `PlaybackService` localiza o `StreamRef` associado ao episódio no `CatalogReadModel`;
  4. Monta o título contextualizado (`Série — EP X: Título`) e resolve o stream;
  5. Despacha a requisição para o `NativePlayerClient`;
  6. No Android, a reprodução é iniciada na `NativePlayerActivity`.
- **ALTERNATIVE_FLOW**: Ambiente web puro retorna `NATIVE_PLAYER_UNAVAILABLE`.
- **ERROR_FLOW**: Se o episódio não existir ou não tiver streamId, falha fail-closed com `STREAM_REF_NOT_FOUND`.
- **TERMINAL_STATES**: `PLAYING` ou `UNAVAILABLE`.
- **DATA_READ**: `readModel.episodesById`, `readModel.seriesById`, `readModel.streamsById`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Device → Source direto.
- **SECURITY**: Sem credenciais persistidas no catálogo ou índice.
- **OBSERVABILITY**: Estado de resolução propagado para a UI do episódio.
- **ACCEPTANCE_CRITERIA**: `EPISODE_PLAYBACK_FLOW=PASS`, `EPISODE_STREAM_REF_LOOKUP=PASS`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 24, 28.

---

### F-G8-003_STREAM_REF_RESOLUTION — Resolução Lógica Direta de StreamRef

- **FLOW_ID**: `F-G8-003_STREAM_REF_RESOLUTION`
- **TRIGGER**: Chamada interna de `DirectStreamResolver.resolve(streamRef, runtimeContext, options)`.
- **PRECONDITIONS**: `StreamRef` válido e `RuntimeSourceContext` válido e não expirado.
- **MAIN_FLOW**:
  1. Valida o contexto runtime da fonte (`sourceId`, `baseUrl`, data de expiração);
  2. Extrai `sourceItemId`, `contentKind` e `containerExtension` do `StreamRef`;
  3. Constrói a URI direta da fonte: `{baseUrl}/{subpath}/{sourceItemId}.{extension}`;
  4. Valida a URI gerada contra a allowlist (HTTPS baseline, rejeição de userinfo);
  5. Deriva o mimeType apropriado (`application/x-mpegURL`, `video/mp4`, etc.);
  6. Retorna `ResolvedPlaybackRequest` em memória.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Falha de validação de URI ou contexto lança `PlaybackError` com categoria sanitizada.
- **TERMINAL_STATES**: `RESOLVED_PLAYBACK_REQUEST_READY`.
- **DATA_READ**: `StreamRef`, `RuntimeSourceContext`.
- **DATA_WRITE**: Nenhum (RESOLVED_PLAYBACK_REQUEST_PERSISTENCE = NONE).
- **NETWORK**: Nenhuma (STREAM_RESOLVER_MEDIA_BYTES_HANDLED = 0).
- **SECURITY**: `URL_USERINFO_CREDENTIALS_REJECTED`, sem proxy central.
- **OBSERVABILITY**: Medição de `STREAM_RESOLUTION_MS`.
- **ACCEPTANCE_CRITERIA**: `VALID_SYNTHETIC_RESOLUTION=PASS`, `NO_CENTRAL_PROXY=PASS`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 10, 12, 13.

---

### F-G8-004_SOURCE_CONTEXT_UNAVAILABLE — Tratamento de Falta de Contexto Runtime

- **FLOW_ID**: `F-G8-004_SOURCE_CONTEXT_UNAVAILABLE`
- **TRIGGER**: Tentativa de resolução de playback quando `RuntimeSourceContext` não foi configurado ou é nulo.
- **PRECONDITIONS**: `runtimeContext == undefined` ou `sourceId` vazio.
- **MAIN_FLOW**:
  1. `validateSourceContext` detecta ausência de contexto de fonte;
  2. Interrompe imediatamente o fluxo de resolução (fail-closed);
  3. Lança `PlaybackError` com categoria `SOURCE_CONTEXT_UNAVAILABLE`;
  4. A UI recebe o erro e exibe "Reprodução indisponível" sem vazar exceções internas.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Resolução abortada sem envio de dados ou chamadas de rede.
- **TERMINAL_STATES**: `ERROR_SOURCE_CONTEXT_UNAVAILABLE`.
- **DATA_READ**: Nenhum.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Impede tentativas cegas de resolução contra endpoints desconhecidos.
- **OBSERVABILITY**: Log registra categoria `SOURCE_CONTEXT_UNAVAILABLE`.
- **ACCEPTANCE_CRITERIA**: `MISSING_SOURCE_CONTEXT_REJECTED=PASS`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 7, 23.

---

### F-G8-005_SOURCE_CONTEXT_EXPIRED — Rejeição de Contexto Expirado

- **FLOW_ID**: `F-G8-005_SOURCE_CONTEXT_EXPIRED`
- **TRIGGER**: Tentativa de resolução com `RuntimeSourceContext.expiresAt` anterior ao timestamp atual.
- **PRECONDITIONS**: `context.expiresAt > 0 && Date.now() > context.expiresAt`.
- **MAIN_FLOW**:
  1. `validateSourceContext` compara `Date.now()` com `context.expiresAt`;
  2. Identifica expiração da sessão da fonte;
  3. Aborta a resolução fail-closed com categoria `SOURCE_CONTEXT_EXPIRED`;
  4. UI notifica que a sessão expirou.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Abortamento imediato.
- **TERMINAL_STATES**: `ERROR_SOURCE_CONTEXT_EXPIRED`.
- **DATA_READ**: Timestamp atual e `expiresAt`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Garante respeito absoluto ao tempo de vida de sessões efêmeras.
- **OBSERVABILITY**: Categoria `SOURCE_CONTEXT_EXPIRED` emitida.
- **ACCEPTANCE_CRITERIA**: `EXPIRED_SOURCE_CONTEXT_REJECTED=PASS`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 7, 23.

---

### F-G8-006_NATIVE_PLAYER_LAUNCH — Disparo do Player Nativo Android

- **FLOW_ID**: `F-G8-006_NATIVE_PLAYER_LAUNCH`
- **TRIGGER**: `NativePlayerClient.launch(resolvedRequest)` chamado em ambiente Android nativo.
- **PRECONDITIONS**: `Capacitor.isNativePlatform() == true`, `ResolvedPlaybackRequest` validado.
- **MAIN_FLOW**:
  1. O plugin `NativePlayerPlugin.play()` recebe a chamada IPC do Capacitor;
  2. Valida a URI no boundary nativo via `PlaybackIntentContract.validatePlaybackUri()`;
  3. Monta Intent explícito para `NativePlayerActivity` com extras transitórios;
  4. Inicia a Activity nativa em tela cheia com flags de imersão e `FLAG_KEEP_SCREEN_ON`;
  5. `NativePlayerActivity` inicializa o `ExoPlayer` com `MediaItem` e `DefaultHttpDataSource.Factory`;
  6. Inicia o buffering e reprodução física direta da fonte.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se a URI for rejeitada na validação nativa, rejeita o PluginCall com mensagem sanitizada.
- **TERMINAL_STATES**: `NATIVE_PLAYER_OPENED`.
- **DATA_READ**: Intent extras.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Streaming direto de pacotes de mídia entre dispositivo e CDN da fonte.
- **SECURITY**: `android:exported="false"`, zero logging de headers confidenciais.
- **OBSERVABILITY**: Eventos de Player.Listener (`onPlaybackStateChanged`, `onPlayerError`).
- **ACCEPTANCE_CRITERIA**: `NATIVE_ANDROID_PLAYER_IMPLEMENTED=SIM`, `VALID_NATIVE_REQUEST_ACCEPTED=PASS`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 15, 16, 43.

---

### F-G8-007_NATIVE_PLAYER_BACK_RETURN — Retorno Limpo do Player Nativo

- **FLOW_ID**: `F-G8-007_NATIVE_PLAYER_BACK_RETURN`
- **TRIGGER**: Usuário pressiona o botão Back no controle remoto ou teclado durante a reprodução.
- **PRECONDITIONS**: `NativePlayerActivity` ativa.
- **MAIN_FLOW**:
  1. Evento de Back fecha a `NativePlayerActivity`;
  2. O ciclo de vida executa `onPause()`, `onStop()` e `onDestroy()`;
  3. O método `releasePlayer()` é acionado de forma idempotente, liberando decodificadores e instâncias do ExoPlayer;
  4. O foco retorna para a tela de detalhe anterior (`MovieDetailPage` ou `SeriesDetailPage`) na `MainActivity`;
  5. O estado da UI anterior é preservado sem reinicializar o aplicativo inteiro.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `PLAYER_DESTROYED_RETURNED_TO_DETAIL`.
- **DATA_READ**: Nenhum.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Conexões de streaming são encerradas.
- **SECURITY**: Liberação de decodificadores de hardware e buffers de memória do sistema.
- **OBSERVABILITY**: Log registra liberação do ExoPlayer.
- **ACCEPTANCE_CRITERIA**: `PLAYER_RELEASE_ON_DESTROY=PASS`, `PLAYER_RELEASE_IDEMPOTENT=SIM`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 30, 33, 34.

---

### F-G8-008_INVALID_PLAYBACK_URI_REJECTION — Rejeição de Esquemas e Credenciais Perigosas

- **FLOW_ID**: `F-G8-008_INVALID_PLAYBACK_URI_REJECTION`
- **TRIGGER**: Tentativa de reprodução com URI maliciosa, esquema não autorizado (`file:`, `javascript:`, etc.) ou contendo `user:pass@`.
- **PRECONDITIONS**: Chamada a `validatePlaybackUri(uri)`.
- **MAIN_FLOW**:
  1. O validador inspeciona o prefixo e esquema da URI;
  2. Detecta violação de esquema ou presença de `parsed.username / parsed.password`;
  3. Rejeita fail-closed imediatamente lançando `PlaybackError`;
  4. Impede que a requisição seja repassada ao player nativo ou engine de rede.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição determinística e segura.
- **TERMINAL_STATES**: `ERROR_SECURITY_VIOLATION_REJECTED`.
- **DATA_READ**: String da URI.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma requisição emitida.
- **SECURITY**: Proteção contra SSRF local, acesso a arquivos privados (`file:`) e injeção de credenciais de URL.
- **OBSERVABILITY**: Erro categorizado como `UNSUPPORTED_SCHEME` ou `URL_USERINFO_CREDENTIALS_REJECTED`.
- **ACCEPTANCE_CRITERIA**: `UNSUPPORTED_URI_REJECTED=PASS`, `URL_USERINFO_CREDENTIALS_REJECTED=PASS`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 18, 52.

---

### F-G8-009_WEB_NATIVE_PLAYER_UNAVAILABLE — Fallback Controlado para Navegador Web

- **FLOW_ID**: `F-G8-009_WEB_NATIVE_PLAYER_UNAVAILABLE`
- **TRIGGER**: Invocação de playback em ambiente navegador (desenvolvimento / browser).
- **PRECONDITIONS**: `Capacitor.isNativePlatform() == false` e plugin nativo ausente.
- **MAIN_FLOW**:
  1. `NativePlayerClient` detecta ausência de suporte nativo;
  2. Retorna `{ success: false, state: 'NATIVE_PLAYER_UNAVAILABLE' }`;
  3. O `PlaybackService` transiciona para estado `UNAVAILABLE`;
  4. A UI exibe mensagem explicativa: *"Player nativo Android indisponível no navegador web."*;
  5. Não cria elemento `<video>` HTML5 não autorizado e não abre abas no navegador.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `NATIVE_PLAYER_UNAVAILABLE`.
- **DATA_READ**: Metadados de plataforma Capacitor.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Preserva o contrato canônico de player nativo sem gambiarras no navegador.
- **OBSERVABILITY**: Estado `UNAVAILABLE` refletido na sessão de playback.
- **ACCEPTANCE_CRITERIA**: `WEB_NATIVE_PLAYER_UNAVAILABLE=PASS`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 17, 49.

---

### F-G8-010_PLAYBACK_ERROR_SANITIZATION — Sanitização Estrita de Mensagens e Logs

- **FLOW_ID**: `F-G8-010_PLAYBACK_ERROR_SANITIZATION`
- **TRIGGER**: Ocorrência de qualquer exceção durante resolução, montagem de requisição ou reprodução.
- **PRECONDITIONS**: Exceção capturada no fluxo de playback.
- **MAIN_FLOW**:
  1. O manipulador de erro extrai a categoria padronizada do `PlaybackError`;
  2. Caso a mensagem contenha URIs ou query strings, passa pelo helper `sanitizePlaybackUriForLog()`;
  3. Caso contenha headers de autorização ou cookies, passa por `sanitizeHeadersForLog()`;
  4. Registra apenas mensagens sanitizadas, impedindo vazamento de tokens, senhas ou assinaturas;
  5. A UI apresenta mensagem limpa e compreensível ao usuário final.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `ERROR_SANITIZED_AND_RECORDED`.
- **DATA_READ**: Objeto de exceção.
- **DATA_WRITE**: Log de console ou buffer de sessão.
- **NETWORK**: Nenhuma.
- **SECURITY**: `PLAYBACK_HEADERS_LOGGING = PROHIBITED`, zero vazamento de credenciais.
- **OBSERVABILITY**: Log seguro contendo categoria, ID de sessão e host genérico.
- **ACCEPTANCE_CRITERIA**: `SYNTHETIC_HEADERS_SANITIZED=PASS`, `PLAYBACK_HEADERS_LOGGING=PROHIBITED`.
- **TRACEABILITY**: Requisitos do Gate G8 seção 20, 21, 53.






