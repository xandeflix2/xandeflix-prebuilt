# Especificação Técnica do Pacote de Provisionamento (G4)

> **Documento Canônico**: Especificação arquitetural e de segurança do artefato de provisionamento do projeto `Xandeflix Prebuilt`.
> **Gate**: G4 (`XANDEFLIX_PREBUILT_G4_PROVISIONING_PACKAGE`).
> **Versão do Formato de Pacote**: `PACKAGE_FORMAT_VERSION=1`.
> **Versão do Schema de Catálogo**: `SCHEMA_VERSION=1`.

---

## 1. Objetivo

Definir, estruturar e validar o artefato de provisionamento canônico que atua como fronteira desacoplada entre a geração externa do catálogo normalizado (G3) e a posterior ingestão/bootstrap rápido no dispositivo móvel (G5).

O artefato é projetado para ser:
- **Versionado**: Declaração explícita de formato externo e contrato interno;
- **Determinístico**: Saída consistente para entradas idênticas;
- **Imutável**: Conteúdo protegido contra alterações acidentais ou maliciosas;
- **Verificável**: Auto-validação de integridade física e lógica via checksums SHA-256;
- **Transportável**: Neutro quanto ao meio de distribuição (arquivo local, cache estático);
- **Seguro**: Isento de credenciais reais, segredos ou tokens de longa duração.

---

## 2. Escopo

### Incluído no G4
- Estrutura de empacotamento ZIP auditável;
- Especificação e geração do `manifest.json`;
- Serialização canônica determinística do `catalog.json` a partir do `PrebuiltCatalog` v1;
- Cálculo de integridade via SHA-256 (`catalogSha256`, `packageContentHash`);
- Módulo construtor (`PackageBuilder`);
- Módulo validador estrito (`PackageValidator`) com comportamento fail-closed;
- Proteção ativa contra path traversal e rejeição de arquivos não autorizados (`UNKNOWN_PACKAGE_FILES=REJECT`);
- Scripts CLI de build e checagem (`provisioning:build`, `provisioning:check`);
- Suíte completa de testes negativos.

### Explicitamente Excluído do G4 (Não Autorizado)
- Ingestão ou persistência do pacote em SQLite ou IndexedDB no cliente (escopo G5);
- Bootstrap ou runtime no dispositivo móvel Android/Web (escopo G5);
- Interface gráfica de catálogo, navegação ou busca (escopo G6);
- Player ou mecanismos de reprodução de mídia (escopo G7);
- Assinatura digital do pacote com par de chaves assimétricas (decisão mantida OPEN);
- Criptografia do arquivo de catálogo ou do pacote (decisão mantida OPEN);
- Vínculo a usuários reais (`USER_SOURCE_BINDING=OPEN`);
- Conexão em tempo de execução com Supabase ou banco de dados remoto.

---

## 3. Formato do Pacote: ZIP

O formato inicial canônico adotado é o **ZIP** (`PROVISIONING_PACKAGE_FORMAT=ZIP`).
- **Justificativa**: Padrão universal amplamente suportado por sistemas operacionais e runtimes, com suporte a compressão eficiente (`DEFLATE`), inspeção em memória e portabilidade nativa sem complexidade proprietária.
- **Implementação**: Biblioteca mínima e madura (`JSZip`), sem dependências pesadas de runtime e isolada no pipeline de build/validação.

---

## 4. Estrutura Interna Canônica

O pacote de provisionamento contém estritamente dois arquivos em sua raiz:

```text
xandeflix-prebuilt-catalog.zip
├── manifest.json
└── catalog.json
```

Nenhum subdiretório, binário adicional, script executável ou arquivo extra é admitido.

---

## 5. Especificação do Manifest (`manifest.json`)

O `manifest.json` é o descritor de integridade e metadados do pacote.

### Campos Canônicos Mínimos

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `packageFormatVersion` | `number` | Versão do formato do invólucro do pacote | `1` |
| `schemaVersion` | `number` | Versão do schema do catálogo de dados | `1` |
| `catalogVersion` | `string` | Versão de conteúdo do catálogo emitido | `"1.0.0"` |
| `snapshotId` | `string` | Identificador único estável do snapshot | `"snap-f6047dd55fd16775"` |
| `createdAt` | `string` | Timestamp ISO-8601 de geração do build | `"2026-09-04T00:00:00.000Z"` |
| `catalogFile` | `string` | Nome exato do arquivo de catálogo | `"catalog.json"` |
| `catalogSha256` | `string` | Hash SHA-256 (hex) dos bytes do `catalog.json` | `c44f386b...` |
| `catalogSizeBytes` | `number` | Tamanho exato em bytes do `catalog.json` | `8368` |
| `packageContentHash`| `string` | Hash lógico SHA-256 dos campos imutáveis | `6b5d1f85...` |
| `generator` | `string` | Identificador do software gerador | `"xandeflix-prebuilt-provisioning/1.0"` |
| `compression` | `string` | Algoritmo de compressão utilizado | `"DEFLATE"` ou `"STORE"` |
| `metadata` | `object` | Metadados adicionais sanitizados (opcional) | `{}` |

---

## 6. Versionamento Multicamada

O sistema adota três níveis de versionamento desacoplados:

1. **`packageFormatVersion`**: Governa a estrutura externa do pacote (arquivos esperados, nomes e esquema do manifest).
2. **`schemaVersion`**: Governa a semântica e a validação do `catalog.json` contra o JSON Schema e tipos do Data Contract v1 (G2).
3. **`catalogVersion`**: Governa a versão de lançamento editorial/de dados do catálogo emitido pelo pipeline de ingestão (G3).

---

## 7. Hashing e Integridade

Todos os hashes de integridade utilizam **SHA-256** nativo (`node:crypto`):
- `CATALOG_HASH_ALGORITHM=SHA256`
- `PACKAGE_CONTENT_HASH_ALGORITHM=SHA256`

### Algoritmo do `packageContentHash`
Para assegurar determinismo lógico estrito independente do instante físico de execução da máquina de build, campos transitórios como `createdAt` são **deliberadamente excluídos** do hash de conteúdo lógico.

O hash lógico é calculado sobre a serialização canônica das propriedades imutáveis:
```typescript
SHA256(JSON.stringify({
  packageFormatVersion: manifest.packageFormatVersion,
  schemaVersion: manifest.schemaVersion,
  catalogVersion: manifest.catalogVersion,
  snapshotId: manifest.snapshotId,
  catalogFile: manifest.catalogFile,
  catalogSha256: manifest.catalogSha256,
  catalogSizeBytes: manifest.catalogSizeBytes,
  compression: manifest.compression,
}))
```

---

## 8. Determinismo

- **Determinismo Lógico**: `LOGICAL_PACKAGE_DETERMINISTIC=SIM`. Execuções subsequentes a partir do mesmo catálogo de entrada produzem exatamente os mesmos `catalogSha256`, `packageContentHash` e `snapshotId`.
- **Determinismo Físico do ZIP**: Quando o timestamp interno dos arquivos do ZIP é padronizado (ou gerenciado de forma fixa), obtém-se `BYTE_IDENTICAL_ZIP=SIM`.

---

## 9. Validação Estrita e Fail-Closed

O `PackageValidator` executa um protocolo rigoroso de 12 etapas:
1. Descompressão segura do buffer ZIP;
2. Inspeção de entradas e mitigação de Path Traversal;
3. Verificação de presença e completude (`manifest.json` e `catalog.json`);
4. Parsing do `manifest.json`;
5. Validação de versões (`packageFormatVersion` e `schemaVersion`);
6. Extração dos bytes originais do `catalog.json`;
7. Recálculo e conferência do `catalogSha256` e `catalogSizeBytes`;
8. Recálculo e conferência do `packageContentHash`;
9. Parsing do `catalog.json`;
10. Validação de correspondência de `snapshotId`, `catalogVersion` e `schemaVersion`;
11. Validação estrita do catálogo contra o contrato canônico de dados (`validateNormalizedCatalog`);
12. Varredura e auditoria contra segredos e credenciais embutidas.

Qualquer discrepância resulta imediatamente em rejeição total (`valid = false`).

---

## 10. Detecção de Adulteração (Tamper Detection)

Qualquer alteração em um único bit do `catalog.json` ou do `manifest.json` invalida a verificação:
- Se o `catalog.json` for alterado, o hash recalculado não conferirá com `manifest.catalogSha256` (`HASH_MISMATCH`).
- Se o tamanho for alterado, a verificação acusará `SIZE_MISMATCH`.
- Se o manifest for alterado para mascarar o hash do catálogo sem recálculo do conteúdo lógico, o `packageContentHash` falhará.

---

## 11. Proteção contra Path Traversal

O descompactador proíbe e rejeita explicitamente qualquer entrada contendo:
- Sequências de subida de diretório (`..`);
- Separadores de caminho invertidos (`\`);
- Barras no início do caminho (`/arquivo`);
- Letras de unidade de disco Windows (`C:`, `D:`);
- Caracteres nulos (`\0`).

Status comprovado: `ZIP_PATH_TRAVERSAL_PROTECTION=PASS`.

---

## 12. Política de Arquivos Desconhecidos

Política adotada: **`UNKNOWN_PACKAGE_FILES=REJECT`**.
Se o arquivo ZIP contiver qualquer entrada que não seja exatamente `manifest.json` ou `catalog.json`, o pacote é sumariamente rejeitado. Isso impede ataques de injeção de payload oculto ou arquivos executáveis parasitas.

---

## 13. Segurança e Auditoria de Segredos

O pacote é mantido estritamente seguro:
- **`SECRETS_CLIENT_EXPOSURE=NAO`**: Não há chaves privadas, service roles, tokens de longa duração ou credenciais de banco.
- **`PLAINTEXT_SOURCE_CREDENTIAL_PRESENT=NAO`**: Streams e artworks sintéticos não contêm credenciais embutidas do tipo `usuario:senha@host`.

---

## 14. Ausência de Credenciais

O provisionamento é agnóstico a credenciais do usuário. As credenciais de acesso ou reprodução, caso venham a existir no futuro, não trafegam dentro do pacote de catálogo base.

---

## 15. Assinatura Digital Futura (Status: OPEN)

No Gate G4:
- `PACKAGE_SIGNING_IMPLEMENTED=NAO`
- `PACKAGE_SIGNING_STRATEGY=OPEN`

Nenhum par de chaves falso ou certificado autoassinado foi introduzido. Uma extensão futura poderá adicionar assinatura em envelope externo ou campo de assinatura no manifest após a escolha formal do algoritmo (ex: Ed25519 ou ECDSA).

---

## 16. Criptografia Futura (Status: OPEN)

No Gate G4:
- `PACKAGE_ENCRYPTION_IMPLEMENTED=NAO`
- `PACKAGE_ENCRYPTION=OPEN`

O pacote trafega em formato legível e auditável (JSON compactado em ZIP). Criptografia ponta a ponta em trânsito/repouso permanece como decisão em aberto para fases posteriores se houver exigência de proteção contra espelhamento de terceiros.

---

## 17. Binding de Usuário Futuro (Status: OPEN)

No Gate G4:
- `USER_SOURCE_BINDING_IMPLEMENTED=NAO`
- `USER_SOURCE_BINDING=OPEN`

O catálogo é genérico e pré-construído para distribuição universal, não possuindo amarras a identidade de usuário final.

---

## 18. Saída Temporária de Build

Os pacotes gerados em ambiente local são direcionados para:
`tmp/provisioning/`

Configuração de integridade do repositório:
- Adicionado ao `.gitignore` (`tmp/` e `*.zip`);
- `PROVISIONING_OUTPUT_TRACKED_BY_GIT=NAO`.

---

## 19. Relação Arquitetural: G3 → G4 → G5

```mermaid
flowchart LR
    G3[G3: Ingestion Pipeline] -->|PrebuiltCatalog v1| G4[G4: Package Builder]
    G4 -->|ZIP Artifact| VAL[G4: Package Validator]
    VAL -->|Approved Artifact| G5[G5: Fast Device Bootstrap]
    G5 -.->|IndexedDB / SQLite| DEV[Device Local Storage]
```

- **G3** entrega a estrutura canônica validada na memória.
- **G4** serializa, calcula hashes, gera manifest e empacota em ZIP autocontido.
- **G5** consumirá o artefato ZIP validado no G4 para descompressão e carga no banco local do dispositivo.

---

## 20. Decisões Arquiteturais

### Decisões LOCKED no G4
- `PROVISIONING_PACKAGE_FORMAT = ZIP`
- `PACKAGE_FORMAT_VERSION = 1`
- `PACKAGE_CONTENTS = manifest.json + catalog.json`
- `CATALOG_HASH_ALGORITHM = SHA256`
- `PACKAGE_CONTENT_HASH_ALGORITHM = SHA256`
- `UNKNOWN_PACKAGE_FILES = REJECT`
- `PACKAGE_VALIDATION = FAIL_CLOSED`

### Decisões OPEN
- `PACKAGE_SIGNING_STRATEGY`
- `PACKAGE_ENCRYPTION`
- `USER_SOURCE_BINDING`
- `SNAPSHOT_RETENTION`
- `ROLLBACK`
- `SIZE_LIMITS` (PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM)
- `SEARCH_INDEX_TRANSPORTABILITY`

---

## 21. Critérios de Aceitação e Evidências do G4

1. `PACKAGE_BUILD=PASS`: Criação bem-sucedida do ZIP com compressão DEFLATE.
2. `PACKAGE_VALIDATION=PASS`: Validação de ponta a ponta do pacote íntegro.
3. `NEGATIVE_PACKAGE_TESTS=PASS`: Rejeição comprovada de 11 casos de corrupção, adulteração, versões divergentes, path traversal e arquivos extras.
4. `LOGICAL_PACKAGE_DETERMINISTIC=SIM`: Hashes lógicos idênticos em execuções sucessivas a partir da mesma base.
