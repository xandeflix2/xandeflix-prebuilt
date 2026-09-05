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
- `G8_FLOWS_FORMALIZED=SIM`
- `G9_FLOWS_FORMALIZED=SIM`
- `G10_FLOWS_FORMALIZED=SIM`

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
3. **Bootstrap e Ingestao de Pacote no Dispositivo** (Gate G5 - Formalizado abaixo);
4. **Navegacao e Catalogo UI** (Gate G6 - Formalizado abaixo);
5. **Mecanismo de Busca Local** (Gate G7 - Formalizado abaixo);
6. **Autenticacao de Fonte e Playback Direto** (Gate G8 - Formalizado abaixo);
7. **Atualizacao Incremental / Delta Sync** (Gate G9 - Formalizado abaixo);
8. **Recuperacao de Falha e Seguranca** (Gate G10 - Formalizado abaixo).

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

---

## 10. Fluxos Funcionais de Atualização Incremental (Gate G9)

### F-G9-001_BUILD_CATALOG_DELTA — Geração Externa de Delta de Catálogo

- **FLOW_ID**: `F-G9-001_BUILD_CATALOG_DELTA`
- **TRIGGER**: Execução do gerador de delta externo recebendo `baseCatalog` e `targetCatalog`.
- **PRECONDITIONS**: Ambos os catálogos são instâncias válidas de `PrebuiltCatalog` v1; `targetCatalogVersion != baseCatalogVersion`.
- **MAIN_FLOW**:
  1. `CatalogDeltaBuilder` compara cada coleção canônica (`categories`, `genres`, `movies`, `series`, `seasons`, `episodes`, `streams`, `artworks`) entre base e target indexando por IDs canônicos;
  2. Identifica entidades adicionadas ou modificadas e as insere em `upsert`;
  3. Identifica IDs ausentes no target e os insere em `removeIds`;
  4. Ordena deterministicamente as listas de `upsert` (por ID) e `removeIds` (alfabeticamente);
  5. Anexa `targetMetadata` declarando as contagens finais esperadas;
  6. Retorna o objeto estruturado `CatalogDelta`.
- **ALTERNATIVE_FLOW**: Se nenhum elemento foi alterado, `hasChanges()` retorna `false` sinalizando `ZERO_CHANGE_DETECTED`.
- **ERROR_FLOW**: Se catálogos forem inválidos ou corrompidos, lança erro de contrato.
- **TERMINAL_STATES**: `CATALOG_DELTA_GENERATED`.
- **DATA_READ**: Catálogo base e catálogo target em memória.
- **DATA_WRITE**: Objeto `CatalogDelta`.
- **NETWORK**: Nenhuma (`NO_NETWORK_ACCESS=SIM`).
- **SECURITY**: Zero credenciais em coleções ou IDs.
- **OBSERVABILITY**: Contagens de upsert e remove por entidade registradas.
- **ACCEPTANCE_CRITERIA**: `CATALOG_DELTA_BUILD=PASS`, `ZERO_CHANGE_DETECTED=PASS`.
- **TRACEABILITY**: G9 seções 9, 10, 11, 12, 18, 40.

---

### F-G9-002_BUILD_SEARCH_DELTA — Geração Externa de Delta do Índice de Busca

- **FLOW_ID**: `F-G9-002_BUILD_SEARCH_DELTA`
- **TRIGGER**: Construção de delta para perfil `SEARCH_ENABLED` a partir de `baseSearchIndex` e `targetSearchIndex`.
- **PRECONDITIONS**: Índices de busca válidos gerados previamente fora do dispositivo.
- **MAIN_FLOW**:
  1. `SearchDeltaBuilder` indexa documentos de ambos os índices por ID;
  2. Gera `documentUpserts` para documentos adicionados/modificados e `documentRemoveIds` para removidos;
  3. Compara as tabelas de postings token por token;
  4. Para tokens afetados, computa a lista final canônica de document IDs e insere em `postingUpserts[token]`;
  5. Para tokens removidos do vocabulário, insere em `postingRemoveTokens`;
  6. Preserva `targetDocumentCount`, `targetTokenCount`, `targetContentHash`, `targetGeneratedAt` e `targetGenerator`;
  7. Retorna o objeto `SearchIndexDelta`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Falha em caso de inconsistência de metadados entre índices.
- **TERMINAL_STATES**: `SEARCH_DELTA_GENERATED`.
- **DATA_READ**: Índices de busca base e target.
- **DATA_WRITE**: Objeto `SearchIndexDelta`.
- **NETWORK**: Nenhuma.
- **SECURITY**: `SEARCH_DELTA_DATA_MINIMIZATION=PASS`. Proibição de dados sensíveis ou tokens de credenciais.
- **OBSERVABILITY**: Contagem de documentos e tokens afetados.
- **ACCEPTANCE_CRITERIA**: `SEARCH_DELTA_BUILD=PASS`.
- **TRACEABILITY**: G9 seções 13, 14, 20, 21, 22.

---

### F-G9-003_VALIDATE_DELTA_PACKAGE — Validação Estrita do Pacote Delta

- **FLOW_ID**: `F-G9-003_VALIDATE_DELTA_PACKAGE`
- **TRIGGER**: Recepção de buffer ZIP do pacote delta para validação ou importação.
- **PRECONDITIONS**: Buffer binário fornecido ao `DeltaPackageValidator`.
- **MAIN_FLOW**:
  1. Valida estrutura ZIP e rejeita tentativas de path traversal (`..` ou `/`);
  2. Rejeita arquivos não autorizados no ZIP (`DELTA_UNKNOWN_FILES=REJECT`);
  3. Lê e valida `delta-manifest.json` contra o schema Draft 2020-12;
  4. Valida hashes SHA-256 de `catalog-delta.json` e `search-index-delta.json` contra o manifest;
  5. Valida o `deltaContentHash` lógico determinístico;
  6. Valida o payload de `catalog-delta.json` e `search-index-delta.json` contra seus respectivos schemas;
  7. Retorna `valid: true` com as estruturas parseadas.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se qualquer validação falhar, retorna `valid: false` com lista de erros tipados.
- **TERMINAL_STATES**: `DELTA_VALIDATED` ou `DELTA_REJECTED`.
- **DATA_READ**: Buffer ZIP de entrada.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: `DELTA_PATH_TRAVERSAL_PROTECTION=REQUIRED`, rejeição de arquivos estranhos e auditoria de credenciais.
- **OBSERVABILITY**: Erros detalhados em caso de rejeição.
- **ACCEPTANCE_CRITERIA**: `DELTA_PACKAGE_VALIDATION=PASS`, `DELTA_PATH_TRAVERSAL_REJECTED=PASS`, `EXTRA_DELTA_FILE_REJECTED=PASS`.
- **TRACEABILITY**: G9 seções 6, 7, 16, 44.

---

### F-G9-004_APPLY_DELTA_SUCCESS — Aplicação com Sucesso de Atualização Incremental

- **FLOW_ID**: `F-G9-004_APPLY_DELTA_SUCCESS`
- **TRIGGER**: Invocação de `IncrementalUpdateService.applyDelta(packageSource)`.
- **PRECONDITIONS**: Dispositivo possui snapshot ativo íntegro correspondente à base declarada no delta.
- **MAIN_FLOW**:
  1. O serviço valida o pacote delta via `DeltaPackageValidator`;
  2. Valida vinculação estrita (`STRICT_BASE_BINDING`): snapshotId, catalogVersion e SHA-256 do catálogo ativo;
  3. Aplica o `CatalogDelta` em memória gerando o catálogo target;
  4. Valida o catálogo target reconstruído contra o contrato G2 e confere o SHA-256 contra `manifest.targetCatalogSha256`;
  5. Se `SEARCH_ENABLED`, aplica o `SearchIndexDelta` mapeando postings sem reindexar e valida hashes target;
  6. Escreve a nova geração na área isolada `staging/<targetSnapshotId>/`;
  7. Executa `readback validation` confirmando persistência física e integridade de hashes;
  8. Promove atomicamente o `ActivePointer` para a nova geração;
  9. Limpa a área de staging e retorna `UPDATE_SUCCESS`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Transiciona para `F-G9-006` ou `F-G9-007` em caso de erro.
- **TERMINAL_STATES**: `UPDATE_SUCCESS`.
- **DATA_READ**: Snapshot ativo do storage, pacote delta.
- **DATA_WRITE**: `staging/<targetSnapshotId>/`, `snapshots/<targetSnapshotId>/`, `active.json`.
- **NETWORK**: Nenhuma.
- **SECURITY**: Imutabilidade da geração ativa mantida; ausência de mutação in-place.
- **OBSERVABILITY**: Métricas de tempo por fase (validação, aplicação, staging, readback, promoção).
- **ACCEPTANCE_CRITERIA**: `CATALOG_DELTA_APPLY=PASS`, `TARGET_CATALOG_HASH_MATCH=PASS`, `STAGING_THEN_PROMOTION=PASS`.
- **TRACEABILITY**: G9 seções 14, 15, 17, 18, 19, 25, 26, 27.

---

### F-G9-005_BASE_MISMATCH_FULL_PACKAGE_REQUIRED — Detecção de Incompatibilidade de Base

- **FLOW_ID**: `F-G9-005_BASE_MISMATCH_FULL_PACKAGE_REQUIRED`
- **TRIGGER**: Submissão de delta cuja base não corresponde à geração atualmente ativa no dispositivo.
- **PRECONDITIONS**: `activeSnapshot.id !== manifest.baseSnapshotId` ou divergência de `catalogVersion` ou `baseCatalogSha256`.
- **MAIN_FLOW**:
  1. O serviço compara os dados da geração ativa contra o manifest do delta;
  2. Detecta a incompatibilidade de base (`STRICT_BASE_BINDING`);
  3. Interrompe o processo sem tocar no armazenamento;
  4. Transiciona para o estado `FULL_PACKAGE_REQUIRED`;
  5. Preserva integralmente o snapshot ativo anterior.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Retorna resultado com `success: false` e `state: 'FULL_PACKAGE_REQUIRED'`.
- **TERMINAL_STATES**: `FULL_PACKAGE_REQUIRED`.
- **DATA_READ**: `active.json`, `delta-manifest.json`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Prevenção contra corrupção por aplicação sobre base arbitrária.
- **OBSERVABILITY**: Log de incompatibilidade com valores esperado e encontrado.
- **ACCEPTANCE_CRITERIA**: `WRONG_BASE_NOT_PATCHED=PASS`, `FULL_PACKAGE_REQUIRED_STATE=PASS`, `ACTIVE_UNCHANGED_ON_BASE_MISMATCH=PASS`.
- **TRACEABILITY**: G9 seções 5, 14, 32, 50.

---

### F-G9-006_DELTA_TARGET_VALIDATION_FAILURE — Falha de Validação do Target Reconstruído

- **FLOW_ID**: `F-G9-006_DELTA_TARGET_VALIDATION_FAILURE`
- **TRIGGER**: Catálogo ou índice de busca reconstruído em memória diverge do contrato ou dos hashes declarados no manifest.
- **PRECONDITIONS**: Delta corrompido, adulterado ou que gera referências quebradas.
- **MAIN_FLOW**:
  1. O serviço aplica o delta em memória;
  2. Valida o resultado contra schemas e regras de integridade referencial;
  3. Computa o SHA-256 e compara com o manifest;
  4. Detecta divergência (ex: hash mismatch ou integridade quebrada);
  5. Aborta a operação imediatamente antes de qualquer gravação ou promoção;
  6. Transiciona para `UPDATE_FAILED_ACTIVE_PRESERVED`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição fail-closed.
- **TERMINAL_STATES**: `UPDATE_FAILED_ACTIVE_PRESERVED`.
- **DATA_READ**: Dados em memória.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Garantia de que dados corrompidos jamais chegam a disco nem a ponteiros ativos.
- **OBSERVABILITY**: Erro `TARGET_CATALOG_HASH_MISMATCH_REJECTED` ou `BROKEN_TARGET_REF_REJECTED`.
- **ACCEPTANCE_CRITERIA**: `TARGET_VALIDATION_FAILURE_PRESERVES_ACTIVE=PASS`, `CATALOG_DELTA_FAILURE_NOT_PROMOTED=PASS`.
- **TRACEABILITY**: G9 seções 15, 38, 45, 47.

---

### F-G9-007_FAILED_DELTA_PRESERVES_ACTIVE — Preservação da Geração Ativa em Falhas

- **FLOW_ID**: `F-G9-007_FAILED_DELTA_PRESERVES_ACTIVE`
- **TRIGGER**: Ocorrência de qualquer erro durante validação, staging ou readback.
- **PRECONDITIONS**: Snapshot ativo pré-existente no dispositivo.
- **MAIN_FLOW**:
  1. Uma falha de I/O, hash mismatch ou interrupção ocorre durante o processo de update;
  2. O bloco `catch` do serviço captura a exceção;
  3. A área de staging afetada é descartada;
  4. O ponteiro ativo anterior é re-verificado e garantido intacto;
  5. Retorna status `UPDATE_FAILED_ACTIVE_PRESERVED`.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `UPDATE_FAILED_ACTIVE_PRESERVED`.
- **DATA_READ**: Storage local.
- **DATA_WRITE**: Limpeza de staging.
- **NETWORK**: Nenhuma.
- **SECURITY**: Fail-closed com tolerância a falhas sem estado zumbi.
- **OBSERVABILITY**: Erro original registrado sanitizado.
- **ACCEPTANCE_CRITERIA**: `FAILED_UPDATE_PRESERVES_ACTIVE=PASS`, `STAGING_WRITE_FAILURE_PRESERVES_ACTIVE=PASS`.
- **TRACEABILITY**: G9 seções 20, 26, 47, 48.

---

### F-G9-008_DELTA_REAPPLY_IDEMPOTENT — Reaplicação Idempotente do Mesmo Delta

- **FLOW_ID**: `F-G9-008_DELTA_REAPPLY_IDEMPOTENT`
- **TRIGGER**: Submissão de um pacote delta cujo `targetSnapshotId` e `targetCatalogVersion` já são os ativos.
- **PRECONDITIONS**: `previousPointer.snapshotId === manifest.targetSnapshotId`.
- **MAIN_FLOW**:
  1. O serviço valida o manifest do pacote;
  2. Detecta que a versão target já está ativa;
  3. Retorna imediatamente sucesso com aviso informativo de idempotência;
  4. Nenhum novo diretório de snapshot é criado e nenhum ponteiro é reescrito.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `UPDATE_SUCCESS` (Idempotente).
- **DATA_READ**: `active.json`, `delta-manifest.json`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Idempotência pura sem efeitos colaterais.
- **OBSERVABILITY**: Aviso `[SAME_DELTA_REAPPLY] Delta já aplicado anteriormente.`
- **ACCEPTANCE_CRITERIA**: `DELTA_REAPPLY_IDEMPOTENT=PASS`, `ACTIVE_POINTER_UNCHANGED_ON_REAPPLY=PASS`.
- **TRACEABILITY**: G9 seções 35, 49.

---

### F-G9-009_SEARCH_ENABLED_ATOMIC_PROMOTION — Promoção Atômica de Catálogo e Busca

- **FLOW_ID**: `F-G9-009_SEARCH_ENABLED_ATOMIC_PROMOTION`
- **TRIGGER**: Atualização de geração com perfil `SEARCH_ENABLED`.
- **PRECONDITIONS**: Ambos os deltas (catálogo e busca) validados e materializados em staging.
- **MAIN_FLOW**:
  1. O serviço aplica e valida tanto o catálogo target quanto o índice target;
  2. Ambos são gravados juntos em `staging/<targetSnapshotId>/`;
  3. A readback validation valida ambos os arquivos físicos;
  4. A promoção atômica move/ativa a geração contendo catálogo e busca em um único passo;
  5. Garante que o catálogo jamais seja promovido com o índice de busca ausente ou inconsistente.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se o índice falhar, aborta a promoção do catálogo.
- **TERMINAL_STATES**: `UPDATE_SUCCESS`.
- **DATA_READ**: Staging directory.
- **DATA_WRITE**: `snapshots/<targetSnapshotId>/catalog.json`, `snapshots/<targetSnapshotId>/search-index.json`, `active.json`.
- **NETWORK**: Nenhuma.
- **SECURITY**: Atomicidade completa da geração lógica.
- **OBSERVABILITY**: Hashes de catálogo e busca registrados na promoção.
- **ACCEPTANCE_CRITERIA**: `SEARCH_ENABLED_DELTA_ATOMICITY=PASS`, `SEARCH_DELTA_FAILURE_NOT_PROMOTED=PASS`.
- **TRACEABILITY**: G9 seções 24, 47, 48.

---

### F-G9-010_OUT_OF_ORDER_DELTA_REJECTION — Rejeição de Delta Fora de Ordem

- **FLOW_ID**: `F-G9-010_OUT_OF_ORDER_DELTA_REJECTION`
- **TRIGGER**: Recepção de delta para transição futura com lacuna na cadeia (ex: ativo é N, delta é N+1 -> N+2).
- **PRECONDITIONS**: `manifest.baseSnapshotId !== activeSnapshot.id`.
- **MAIN_FLOW**:
  1. O serviço detecta a lacuna na cadeia de deltas;
  2. Rejeita o pacote sem aplicar mutações parciais;
  3. Sinaliza `FULL_PACKAGE_REQUIRED`;
  4. O ponteiro ativo N permanece preservado.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição determinística.
- **TERMINAL_STATES**: `FULL_PACKAGE_REQUIRED`.
- **DATA_READ**: `active.json`, `delta-manifest.json`.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Impede corrupção estrutural decorrente de pacotes desordenados.
- **OBSERVABILITY**: Log de rejeição out-of-order.
- **ACCEPTANCE_CRITERIA**: `OUT_OF_ORDER_DELTA_REJECTED=PASS`.
- **TRACEABILITY**: G9 seções 33, 34.

---

### F-G9-011_NO_FALSE_EMPTY_AFTER_DELTA — Proteção contra Falso Vazio no Delta

- **FLOW_ID**: `F-G9-011_NO_FALSE_EMPTY_AFTER_DELTA`
- **TRIGGER**: Submissão de delta malicioso ou corrompido que esvaziaria o catálogo de forma inesperada.
- **PRECONDITIONS**: Aplicação de delta com `removeIds` em massa.
- **MAIN_FLOW**:
  1. O serviço aplica as remoções declaradas;
  2. Compara as contagens finais reais com `targetMetadata.counts`;
  3. Se houver discrepância entre o que foi declarado e o resultado, lança `TARGET_COUNT_MISMATCH_REJECTED`;
  4. Rejeita antes da promoção e mantém a geração anterior;
  5. Impede que catálogos vazios acidentais substituam catálogos populados.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição fail-closed.
- **TERMINAL_STATES**: `UPDATE_FAILED_ACTIVE_PRESERVED`.
- **DATA_READ**: Dados em memória.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Prevenção contra apagamento inadvertido ou acidental de conteúdo.
- **OBSERVABILITY**: Discrepância de contagem logada detalhadamente.
- **ACCEPTANCE_CRITERIA**: `NO_FALSE_EMPTY_DELTA_GUARD=PASS`.
- **TRACEABILITY**: G9 seções 39, 45.

---

### F-G9-012_POST_PROMOTION_CATALOG_SEARCH_READ — Leituras de Catálogo e Busca Pós-Promoção

- **FLOW_ID**: `F-G9-012_POST_PROMOTION_CATALOG_SEARCH_READ`
- **TRIGGER**: Novas consultas de catálogo ou de busca disparadas após a promoção do ponteiro ativo.
- **PRECONDITIONS**: Atualização promovida com sucesso para o target snapshot.
- **MAIN_FLOW**:
  1. O leitor (`storage.readActiveCatalog()` / `storage.readActiveSearchIndex()`) resolve o novo snapshot apontado em `active.json`;
  2. Os novos dados e documentos refletem imediatamente as adições, alterações e remoções promovidas;
  3. Consultas executadas contra o novo índice retornam resultados estritamente equivalentes ao índice gerado full externamente;
  4. Leituras efetuadas antes da promoção concluem sem colisão no snapshot anterior.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `POST_PROMOTION_READ_SUCCESS`.
- **DATA_READ**: Novo snapshot ativo no storage.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Isolamento entre gerações ativas e leituras concorrentes.
- **OBSERVABILITY**: Consultas retornam novo snapshotId nos metadados.
- **ACCEPTANCE_CRITERIA**: `SEARCH_DELTA_QUERY_EQUIVALENCE=PASS`, `POST_DELTA_QUERY_EQUIVALENCE=PASS`.
- **TRACEABILITY**: G9 seções 42, 43, 61, 62.

---

## 11. Fluxos Funcionais de Segurança e Recuperação (Gate G10)

### F-G10-001_SIGN_ARTIFACT_EXTERNALLY — Assinatura Externa de Artefatos de Provisionamento

- **FLOW_ID**: `F-G10-001_SIGN_ARTIFACT_EXTERNALLY`
- **TRIGGER**: Execução do utilitário externo de assinatura (`scripts/sign-provisioning-artifact.mjs`) sobre pacote full ou delta.
- **PRECONDITIONS**: Artefato compilado existente; chave privada ECDSA P-256 informada externamente (arquivo externo ou variável de ambiente).
- **MAIN_FLOW**:
  1. A ferramenta lê os bytes exatos do artefato ZIP (`catalog-package.zip` ou `delta-package.zip`);
  2. Calcula o digest SHA-256 e o tamanho exato em bytes;
  3. Constrói o payload canônico determinístico com chaves ordenadas lexicograficamente;
  4. Assina o payload utilizando a chave privada NIST P-256 e digest SHA-256 (DER format);
  5. Gera o arquivo sidecar `ArtifactSecurityEnvelope` (`.sig.json`) com `securityFormatVersion=1`;
  6. A chave privada permanece estritamente em memória do processo de build e nunca é gravada no repositório.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Chave privada inválida, arquivo inexistente ou parâmetros ausentes abortam com código de erro não-zero.
- **TERMINAL_STATES**: `ARTIFACT_SIGNED_SUCCESSFULLY`.
- **DATA_READ**: Artefato de provisionamento ZIP, arquivo externo de chave privada.
- **DATA_WRITE**: Arquivo de envelope `.sig.json`.
- **NETWORK**: Nenhuma (`NO_NETWORK_ACCESS=SIM`).
- **SECURITY**: Chave privada externa ao repositório e ao APK; sanitização de logs de chave privada.
- **ACCEPTANCE_CRITERIA**: `PRIVATE_SIGNING_KEY_EXTERNAL_ONLY=PASS`, `TEST_PRIVATE_KEY_PERSISTED=NAO`.
- **TRACEABILITY**: G10 seções 6, 7, 8, 12, 13, 47.

---

### F-G10-002_VERIFY_SIGNED_FULL_PACKAGE — Verificação de Pacote Completo Assinado

- **FLOW_ID**: `F-G10-002_VERIFY_SIGNED_FULL_PACKAGE`
- **TRIGGER**: Submissão de pacote completo (`FULL_PACKAGE_V1` ou `FULL_PACKAGE_V2`) acompanhado de envelope de segurança.
- **PRECONDITIONS**: `TrustedPublicKeyStore` configurado com chaves públicas ativas.
- **MAIN_FLOW**:
  1. `ArtifactVerifier` valida a estrutura do envelope contra `prebuilt-artifact-security.schema.json`;
  2. Confere se o algoritmo é exatamente `ECDSA_P256_SHA256`;
  3. Localiza a chave pública correspondente ao `keyId` no `TrustedPublicKeyStore`;
  4. Valida se o status da chave é `ACTIVE`;
  5. Confere o tamanho em bytes do artefato;
  6. Recalcula o SHA-256 do artefato e compara com `artifactSha256`;
  7. Reconstrói o payload canônico determinístico e valida a assinatura criptográfica via WebCrypto;
  8. Retorna resultado de verificação com sucesso (`valid: true`).
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Qualquer discrepância dispara erro tipado e rejeição fail-closed.
- **TERMINAL_STATES**: `VERIFICATION_SUCCESS`.
- **DATA_READ**: Bytes do artefato ZIP, envelope JSON, chave pública do store.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Verificação estrita antes de descompressão ou parse do ZIP.
- **ACCEPTANCE_CRITERIA**: `SIGNED_PACKAGE_V1_ACCEPTED=PASS`, `SIGNED_PACKAGE_V2_ACCEPTED=PASS`.
- **TRACEABILITY**: G10 seções 11, 14, 56.

---

### F-G10-003_VERIFY_SIGNED_DELTA — Verificação de Pacote Delta Assinado

- **FLOW_ID**: `F-G10-003_VERIFY_SIGNED_DELTA`
- **TRIGGER**: Submissão de pacote delta (`DELTA_PACKAGE_V1`) acompanhado de envelope de segurança.
- **PRECONDITIONS**: Chave pública confiável disponível no store.
- **MAIN_FLOW**:
  1. `ArtifactVerifier` valida o envelope com `artifactType === 'DELTA_PACKAGE_V1'`;
  2. Confere algoritmo, keyId, status da chave, tamanho e SHA-256 dos bytes do delta;
  3. Valida a assinatura ECDSA P-256;
  4. Encaminha o delta para aplicação em staging pelo `IncrementalUpdateService`;
  5. O delta é processado em quarentena sem bypass de segurança.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição fail-closed preservando snapshot ativo.
- **TERMINAL_STATES**: `VERIFICATION_SUCCESS`.
- **DATA_READ**: Bytes do pacote delta, envelope JSON.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Prevenção contra injeção de deltas adulterados.
- **ACCEPTANCE_CRITERIA**: `SIGNED_DELTA_V1_ACCEPTED=PASS`.
- **TRACEABILITY**: G10 seções 11, 57.

---

### F-G10-004_REJECT_UNSIGNED_ARTIFACT — Rejeição de Artefato Não Assinado

- **FLOW_ID**: `F-G10-004_REJECT_UNSIGNED_ARTIFACT`
- **TRIGGER**: Submissão de artefato para importação no boundary de produção sem envelope de segurança.
- **PRECONDITIONS**: `SecureArtifactImportService` em execução com `requireSignature: true`.
- **MAIN_FLOW**:
  1. O serviço de importação verifica a presença do envelope de segurança;
  2. Detecta ausência de assinatura/envelope;
  3. Interrompe a importação imediatamente sem tocar o armazenamento local nem invocar descompressão;
  4. Lança erro `UNSIGNED_ARTIFACT` com severidade de segurança.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição imediata fail-closed.
- **TERMINAL_STATES**: `REJECTED_UNSIGNED_ARTIFACT`.
- **DATA_READ**: Nenhum.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Bloqueio total de artefatos não assinados no boundary de produção (`UNSIGNED_NEW_ARTIFACT_IMPORT=REJECT`).
- **ACCEPTANCE_CRITERIA**: `UNSIGNED_ARTIFACT_REJECTED=PASS`, `PRODUCTION_IMPORT_BYPASS=NAO`.
- **TRACEABILITY**: G10 seções 4, 21, 58.

---

### F-G10-005_REJECT_TAMPERED_ARTIFACT — Rejeição de Artefato ou Assinatura Adulterada

- **FLOW_ID**: `F-G10-005_REJECT_TAMPERED_ARTIFACT`
- **TRIGGER**: Submissão de artefato cujos bytes foram alterados após a assinatura ou cujo envelope contém assinatura adulterada.
- **PRECONDITIONS**: Envelope de segurança formatado.
- **MAIN_FLOW**:
  1. Se 1 byte do artefato for adulterado:
     - O recálculo de SHA-256 detecta divergência (`ARTIFACT_HASH_MISMATCH`);
     - A importação aborta antes da verificação criptográfica;
  2. Se a assinatura no envelope for adulterada:
     - O recálculo de SHA-256 confere, mas a verificação criptográfica ECDSA falha (`SIGNATURE_INVALID`);
  3. Em ambos os casos, a importação é sumariamente rejeitada.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição fail-closed.
- **TERMINAL_STATES**: `REJECTED_TAMPERED_ARTIFACT`.
- **DATA_READ**: Bytes adulterados.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Proteção rigorosa de integridade e autenticidade.
- **ACCEPTANCE_CRITERIA**: `TAMPERED_ARTIFACT_REJECTED=PASS`, `TAMPERED_SIGNATURE_REJECTED=PASS`.
- **TRACEABILITY**: G10 seções 17, 18, 52.

---

### F-G10-006_REJECT_UNKNOWN_OR_REVOKED_KEY — Rejeição de Chave Desconhecida ou Revogada

- **FLOW_ID**: `F-G10-006_REJECT_UNKNOWN_OR_REVOKED_KEY`
- **TRIGGER**: Submissão de artefato assinado com `keyId` não cadastrado no store ou com status `REVOKED`.
- **PRECONDITIONS**: `TrustedPublicKeyStore` ativo.
- **MAIN_FLOW**:
  1. Se o `keyId` não constar no store:
     - O validador rejeita com `UNKNOWN_SIGNING_KEY`;
     - Nenhum download remoto de chaves é disparado (`RECOVERY_NETWORK=NONE`);
  2. Se o `keyId` estiver registrado com status `REVOKED`:
     - O validador rejeita com `REVOKED_SIGNING_KEY`;
  3. A operação aborta sem inspecionar o conteúdo do artefato.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição imediata.
- **TERMINAL_STATES**: `REJECTED_UNTRUSTED_KEY`.
- **DATA_READ**: Store de chaves públicas.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Controle estrito do conjunto de chaves confiáveis (`PINNED_PUBLIC_KEY_SET`).
- **ACCEPTANCE_CRITERIA**: `UNKNOWN_KEY_ID_REJECTED=PASS`, `REVOKED_KEY_REJECTED=PASS`.
- **TRACEABILITY**: G10 seções 15, 16, 52.

---

### F-G10-007_DETECT_CORRUPTED_ACTIVE — Detecção de Snapshot Ativo Corrompido no Startup

- **FLOW_ID**: `F-G10-007_DETECT_CORRUPTED_ACTIVE`
- **TRIGGER**: Inicialização do aplicativo ou chamada de verificação de integridade pós-boot.
- **PRECONDITIONS**: `RecoveryService` instanciado com storage local.
- **MAIN_FLOW**:
  1. `RecoveryService.validateActiveSnapshot()` lê `active.json` e localiza o snapshot apontado;
  2. Executa validação profunda em `manifest.json`, `catalog.json` e, se search-enabled, `search-index.json`;
  3. Detecta anomalia (JSON malformado, hash divergente, integridade relacional violada ou ponteiro ausente);
  4. Retorna diagnóstico estruturado com `valid: false` e categoria do erro;
  5. Aciona o fluxo de auto-recuperação (`F-G10-008`).
- **ALTERNATIVE_FLOW**: Se o snapshot ativo estiver íntegro, transiciona para `ACTIVE_CATALOG_READY`.
- **ERROR_FLOW**: Encaminhamento para recuperação.
- **TERMINAL_STATES**: `CORRUPTION_DETECTED`.
- **DATA_READ**: Storage privado do app (`active.json`, snapshot ativo).
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Fail-closed na detecção de corrupção.
- **ACCEPTANCE_CRITERIA**: `STARTUP_ACTIVE_VALIDATION=PASS`, `CORRUPTED_ACTIVE_CATALOG_DETECTED=PASS`.
- **TRACEABILITY**: G10 seções 25, 30, 53.

---

### F-G10-008_RECOVER_PREVIOUS_KNOWN_GOOD — Recuperação Automática da Geração Anterior Conhecida

- **FLOW_ID**: `F-G10-008_RECOVER_PREVIOUS_KNOWN_GOOD`
- **TRIGGER**: Detecção de anomalia ou corrupção no snapshot ativo durante validação ou inicialização.
- **PRECONDITIONS**: Diário de recuperação `prebuilt/recovery.json` registrando geração anterior íntegra.
- **MAIN_FLOW**:
  1. O `RecoveryService` transiciona para estado `RECOVERING`;
  2. Lê o diário de recuperação e identifica o `previousSnapshotId` / `lastKnownGoodSnapshotId`;
  3. Executa a validação profunda completa e recálculo de hashes da geração anterior;
  4. Confirmada a integridade da geração anterior, promove atomicamente o ponteiro `active.json`;
  5. Atualiza o diário de recuperação refletindo o novo ativo;
  6. Notifica o sistema que o catálogo foi recuperado com sucesso (`RECOVERY_SUCCEEDED`).
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Se a geração anterior também estiver corrompida, transiciona para `F-G10-009`.
- **TERMINAL_STATES**: `RECOVERY_SUCCEEDED`.
- **DATA_READ**: `prebuilt/recovery.json`, snapshots anteriores.
- **DATA_WRITE**: `active.json`, `prebuilt/recovery.json` (atômicos).
- **NETWORK**: Nenhuma (`RECOVERY_NETWORK=NONE`).
- **SECURITY**: Promoção atômica; não sobrescreve o snapshot com defeito.
- **ACCEPTANCE_CRITERIA**: `PREVIOUS_VALID_SNAPSHOT_RECOVERED=PASS`, `RECOVERY_IDEMPOTENT=PASS`.
- **TRACEABILITY**: G10 seções 26, 28, 31, 33, 54.

---

### F-G10-009_FAIL_CLOSED_WITH_NO_VALID_SNAPSHOT — Encerramento Seguro sem Snapshot Válido

- **FLOW_ID**: `F-G10-009_FAIL_CLOSED_WITH_NO_VALID_SNAPSHOT`
- **TRIGGER**: Falha na validação do snapshot ativo e de todas as gerações candidatas anteriores no dispositivo.
- **PRECONDITIONS**: Nenhuma geração local íntegra identificada no storage.
- **MAIN_FLOW**:
  1. O serviço de recuperação tenta validar o ativo e o anterior;
  2. Constata que ambos estão ausentes ou corrompidos;
  3. Transiciona formalmente para o estado terminal `NO_VALID_LOCAL_SNAPSHOT`;
  4. Não tenta fabricar dados fictícios nem conectar em rede para baixar pacotes;
  5. Sinaliza erro claro para o subsistema de apresentação.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Bloqueio seguro total.
- **TERMINAL_STATES**: `NO_VALID_LOCAL_SNAPSHOT`.
- **DATA_READ**: Storage local.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Fail-closed rigoroso contra execução com dados corrompidos.
- **ACCEPTANCE_CRITERIA**: `NO_VALID_SNAPSHOT_FAIL_CLOSED=PASS`.
- **TRACEABILITY**: G10 seções 34, 35, 53.

---

### F-G10-010_PREVENT_FALSE_EMPTY_DURING_RECOVERY — Prevenção de Falso Vazio na Recuperação

- **FLOW_ID**: `F-G10-010_PREVENT_FALSE_EMPTY_DURING_RECOVERY`
- **TRIGGER**: Ocorrência de corrupção ou falha de leitura que poderia induzir a aplicação a expor catálogo vazio.
- **PRECONDITIONS**: Erro de inicialização ou ponteiro ausente/corrompido.
- **MAIN_FLOW**:
  1. A camada de storage e o `RecoveryService` interceptam o erro;
  2. Garantem que o estado retornado seja `RECOVERING` ou `NO_VALID_LOCAL_SNAPSHOT`;
  3. Impedem terminantemente que métodos de catálogo retornem array vazio `[]` como se o catálogo fosse válido;
  4. A interface do usuário renderiza estado explícito de erro/recuperação e não tela vazia normal.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: N/A.
- **TERMINAL_STATES**: `FALSE_EMPTY_PREVENTED`.
- **DATA_READ**: Storage local.
- **DATA_WRITE**: Nenhum.
- **NETWORK**: Nenhuma.
- **SECURITY**: Integridade da experiência do usuário e prevenção de diagnóstico enganoso.
- **ACCEPTANCE_CRITERIA**: `RECOVERY_FALSE_EMPTY_PREVENTED=PASS`.
- **TRACEABILITY**: G10 seções 29, 32, 53.

---

### F-G10-011_RECOVERY_POINTER_WRITE_FAILURE — Tratamento de Falha de Escrita no Ponteiro de Recuperação

- **FLOW_ID**: `F-G10-011_RECOVERY_POINTER_WRITE_FAILURE`
- **TRIGGER**: Falha física ou de permissão ao tentar gravar `active.json` durante o processo de promoção da recuperação.
- **PRECONDITIONS**: Tentativa de recuperação ativa.
- **MAIN_FLOW**:
  1. O serviço tenta escrever o novo ponteiro atômico via `writeActivePointer`;
  2. O sistema de arquivos lança erro de escrita simulado ou real;
  3. O serviço aborta a promoção com `RECOVERY_WRITE_FAILURE`;
  4. Nenhum ponteiro parcial ou corrompido é persistido no disco;
  5. O snapshot anterior continua preservado intacto.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Operação cancelada de forma atômica e segura.
- **TERMINAL_STATES**: `RECOVERY_ABORTED_SAFE`.
- **DATA_READ**: Storage local.
- **DATA_WRITE**: Tentativa abortada com rollback.
- **NETWORK**: Nenhuma.
- **SECURITY**: Atomicidade da mutação de ponteiro.
- **ACCEPTANCE_CRITERIA**: `RECOVERY_POINTER_WRITE_FAILURE_SAFE=PASS`.
- **TRACEABILITY**: G10 seções 33, 55.

---

### F-G10-012_SECURE_IMPORT_BOUNDARY — Fronteira de Importação Segura do Aplicativo

- **FLOW_ID**: `F-G10-012_SECURE_IMPORT_BOUNDARY`
- **TRIGGER**: Requisição de importação de pacote inicial ou atualização pelo runtime do aplicativo.
- **PRECONDITIONS**: Aplicativo em execução em ambiente web ou Android.
- **MAIN_FLOW**:
  1. Toda entrada de novos dados de provisionamento é obrigatoriamente roteada pelo `SecureArtifactImportService`;
  2. O serviço exige o artefato e seu envelope assinado correspondente;
  3. Valida criptograficamente o artefato via `ArtifactVerifier`;
  4. Apenas após a aprovação criptográfica e estrutural, delega aos importadores de baixo nível (`PackageImporter` ou `IncrementalUpdateService`);
  5. O importador realiza staging em quarentena, readback e promoção atômica com atualização do diário de recuperação;
  6. Nenhuma chamada direta ao importador de baixo nível sem assinatura é acessível pela UI.
- **ALTERNATIVE_FLOW**: N/A.
- **ERROR_FLOW**: Rejeição no security boundary antes de qualquer staging.
- **TERMINAL_STATES**: `SECURE_IMPORT_COMPLETE`.
- **DATA_READ**: Bytes do artefato, envelope.
- **DATA_WRITE**: Staging em quarentena e promoção atômica.
- **NETWORK**: Nenhuma no MVP (`NO_NETWORK_ACCESS=SIM`).
- **SECURITY**: Trust boundary unificado e proteção contra bypass em produção.
- **ACCEPTANCE_CRITERIA**: `PRODUCTION_IMPORT_BYPASS=NAO`, `SECURE_IMPORT_BOUNDARY=PASS`.
- **TRACEABILITY**: G10 seções 4, 21, 45, 58.








