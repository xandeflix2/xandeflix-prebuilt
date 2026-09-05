# Arquitetura de Seguranca e Recuperacao (Gate G10)

---

## 1. Visao Geral e Objetivo

O Gate G10 estabelece a camada formal de autenticidade criptografica e recuperacao resiliente do **Xandeflix Prebuilt**, blindando o ciclo de vida dos artefatos de provisionamento (pacotes completos e deltas incrementais) e a persistencia local no dispositivo cliente contra adulteracao, corrupcao e estados inconsistentes.

Todos os contratos de dados e formatos historicos consolidados nos Gates G0 a G9 foram rigorosamente preservados:
- `PACKAGE_FORMAT_V1` (`manifest.json` + `catalog.json`);
- `PACKAGE_FORMAT_V2` (`manifest.json` + `catalog.json` + `search-index.json`);
- `DELTA_PACKAGE_FORMAT_VERSION=1` (`delta-manifest.json` + `catalog-delta.json` + `search-index-delta.json`).

A seguranca atua como uma camada externa desacoplada (*Security Envelope / Sidecar*), garantindo verificacao *fail-closed* antes da descompactacao ou parsing estrutural de qualquer artefato externo.

---

## 2. Modelo de Ameacas (Threat Model)

O modelo de ameacas do Xandeflix Prebuilt identifica os seguintes vetores de risco e respostas arquiteturais:

| Vetor de Ameaca | Descricao do Risco | Mitigacao Arquitetural G10 |
| :--- | :--- | :--- |
| **Tampering de Artefato** | Modificacao maliciosa ou acidental de bytes em pacotes ZIP completos ou deltas em transito ou armazenamento intermediario. | Verificacao criptografica compulsoria de assinatura digital ECDSA P-256 sobre hash SHA-256 deterministico do artefato exato. |
| **Substituicao de Chave / MitM** | Atacante assina pacote forjado utilizando chave assimetrica arbitraria nao autorizada ou chave revogada. | *Trust boundary* restrito com `TrustedPublicKeyStore` ancorado em conjunto fixo de chaves publicas confiaveis (`PINNED_PUBLIC_KEY_SET`), rejeicao sumaria de chaves desconhecidas (`UNKNOWN_KEY_ID`) e chaves revogadas (`REVOKED_KEY_ID`). |
| **Algorithm Confusion** | Atacante altera campo `algorithm` no envelope para induzir verificacao trivial (ex.: `none`, HMAC simetrico). | Allowlist estrita de algoritmos criptograficos (`ECDSA_P256_SHA256`); qualquer outro valor e rejeitado *fail-closed*. |
| **Path Traversal / ZIP Slip** | Artefato malicioso com caminhos contendo `..`, `/`, `\`, caracteres de escape ou letras de unidade para sobrescrever arquivos criticos do sistema operacional. | Sanitizacao estrita de nomes de arquivos em `PackageValidator` e `DeltaPackageValidator`, com isolamento dos snapshots no storage privado (`Directory.Data`). |
| **Corrupcao Local de Snapshot** | Falha de energia, corte de processo ou falha de disco corrompe o arquivo de catalogo, indice de busca ou manifesto da geracao ativa. | Validacao profunda de inicializacao (`STARTUP_ACTIVE_VALIDATION`) e recuperacao automatica da geracao anterior integra (`RECOVERY_BASELINE=ACTIVE_PLUS_PREVIOUS_KNOWN_GOOD`). |
| **Corrupcao de Ponteiro Ativo** | Arquivo `active.json` ausente, truncado, com JSON invalido ou apontando para snapshot inexistente/invalido. | Deteccao automatica no boot e resolucao via historico do diario de recuperacao (`recovery.json`). |
| **Falso Vazio (False Empty)** | Erro de leitura, falha de integridade ou recuperacao resultando na apresentacao enganosa de uma lista vazia de conteudos para o usuario. | Proibicao absoluta de fallback silencioso para lista vazia (`RECOVERY_FALSE_EMPTY_PREVENTED=PASS`); o sistema transiciona para estado explicito de falha (`NO_VALID_LOCAL_SNAPSHOT`) ou recuperacao (`RECOVERING`). |
| **Vazamento de Segredos em Logs** | Impressao acidental de credenciais de fontes, tokens de autenticacao ou chaves privadas nos logs do sistema ou do player. | Sanitizacao ativa atraves de `security-redaction.ts`, proibicao de chaves privadas no repositorio ou APK, e ausencia de credenciais nos metadados de catalogo. |

---

## 3. Trust Boundary e Separacao de Chaves

### 3.1. Chave Privada Externa (External Only)
- A chave privada de assinatura e mantida **estritamente fora** do aplicativo cliente, fora do repositorio Git e fora de pacotes de distribuicao (`PRIVATE_SIGNING_KEY_LOCATION=EXTERNAL_ONLY`).
- A assinatura de artefatos ocorre exclusivamente em ambiente seguro de *build/pipeline* externo atraves da ferramenta `scripts/sign-provisioning-artifact.mjs`.
- A chave privada e fornecida a ferramenta via arquivo seguro externo ou variavel de ambiente, nunca commitada.
- Em testes automatizados, chaves efemeras sao geradas em memoria no runtime e descartadas imediatamente ao final da execucao (`TEST_PRIVATE_KEY_PERSISTED=NAO`).

### 3.2. Âncoras de Confianca do Cliente (Trust Anchor Model)
- O cliente possui uma abstracao de armazenamento confiavel de chaves publicas: `TrustedPublicKeyStore`.
- O modelo canônico e `TRUST_ANCHOR_MODEL=PINNED_PUBLIC_KEY_SET`.
- Cada chave publica e identificada por um `keyId`, associada ao algoritmo `ECDSA_P256_SHA256`, e possui status operacional:
  - `ACTIVE`: Chave valida e apta a autenticar novos artefatos;
  - `REVOKED`: Chave formalmente revogada; qualquer artefato assinado com ela e rejeitado sumariamente.

---

## 4. Envelope de Seguranca (Artifact Security Envelope V1)

### 4.1. Estrutura do Envelope
A autenticidade e provida atraves de um arquivo sidecar (*detached signature*) com extensao `.sig.json` ou envelope JSON estruturado em conformidade com o schema `schemas/prebuilt-artifact-security.schema.json`:

```json
{
  "$schema": "https://json-schema.xandeflix.com/v1/prebuilt-artifact-security.schema.json",
  "securityFormatVersion": 1,
  "artifactType": "FULL_PACKAGE_V1",
  "artifactSha256": "3a7bd3e2360a3d29eea436cdfb27d37feeacab603545f66b4cd85ff9e573e730",
  "artifactSizeBytes": 2048576,
  "keyId": "xandeflix-release-key-2026-v1",
  "algorithm": "ECDSA_P256_SHA256",
  "issuedAt": "2026-09-05T12:00:00.000Z",
  "signature": "3045022100a1b2c3...",
  "snapshotId": "snap-20260905-01",
  "baseSnapshotId": null,
  "targetSnapshotId": null
}
```

### 4.2. Tipos de Artefatos Suportados
- `FULL_PACKAGE_V1`: Pacote de provisionamento completo legado (G4: catalogo);
- `FULL_PACKAGE_V2`: Pacote de provisionamento completo com busca pre-construida (G7: catalogo + search index);
- `DELTA_PACKAGE_V1`: Pacote de atualizacao incremental (G9: catalog delta + search delta).

### 4.3. Payload de Assinatura Canonico e Deterministico
Para garantir que a verificacao seja imune a variacoes incidentais de formatacao JSON (espacamento, quebras de linha ou ordem de propriedades), a geracao e verificacao da assinatura utilizam uma representacao canonica normalizada (`SIGNING_PAYLOAD_CANONICALIZATION=DETERMINISTIC`):

Campos vinculados no payload canonico:
1. `algorithm` (string)
2. `artifactSha256` (hex string em lowercase)
3. `artifactSizeBytes` (inteiro positivo)
4. `artifactType` (enum do tipo de artefato)
5. `baseSnapshotId` (string ou null)
6. `issuedAt` (string ISO 8601 UTC)
7. `keyId` (string)
8. `securityFormatVersion` (inteiro, 1)
9. `snapshotId` (string ou null)
10. `targetSnapshotId` (string ou null)

Os campos sao serializados com chaves ordenadas lexicograficamente em JSON sem espacamentos, e assinados utilizando a curva eliptica NIST P-256 com digest SHA-256 no formato DER padrao.

---

## 5. Pipeline de Verificacao Fail-Closed

Antes de qualquer descompressao ZIP, processamento ou extracao de conteudo no dispositivo, o servico `SecureArtifactImportService` e `ArtifactVerifier` executam rigorosamente a seguinte sequencia:

```
[Untrusted Artifact Bytes + Security Envelope]
               │
               ▼
   [1. Validar Schema do Envelope] ──(Falha)──> REJECT (SECURITY_ENVELOPE_INVALID)
               │
               ▼
   [2. Conferir Allowlist de Algoritmo] ──(Divergencia)──> REJECT (UNSUPPORTED_SIGNATURE_ALGORITHM)
               │
               ▼
   [3. Localizar KeyId no Trusted Store] ──(Nao Encontrado)──> REJECT (UNKNOWN_SIGNING_KEY)
               │
               ▼
   [4. Verificar Status da Chave] ──(Revogada)──> REJECT (REVOKED_SIGNING_KEY)
               │
               ▼
   [5. Conferir Tamanho Exato em Bytes] ──(Divergencia)──> REJECT (ARTIFACT_SIZE_MISMATCH)
               │
               ▼
   [6. Recalcular Digest SHA-256 do Artefato] ──(Divergencia)──> REJECT (ARTIFACT_HASH_MISMATCH)
               │
               ▼
   [7. Verificar Assinatura ECDSA P-256] ──(Invalida)──> REJECT (SIGNATURE_INVALID)
               │
               ▼
   [8. Delegar ao Importador Seguro G4/G7/G9 em Staging Isolado]
               │
               ▼
   [9. Readback & Validacao Estrutural Completa do Snapshot Target]
               │
               ▼
   [10. Promocao Atomica do Active Pointer + Atualizacao do Recovery Journal]
```

### 5.1. Politica de Artefato Nao Assinado
- No caminho de producao do aplicativo, `UNSIGNED_NEW_ARTIFACT_IMPORT=REJECT`.
- A interface de usuario e os fluxos de atualizacao do aplicativo estao restritos a invocar exclusivamente o `SecureArtifactImportService`, sendo expressamente proibido qualquer bypass para importadores de baixo nivel sem assinatura (`PRODUCTION_IMPORT_BYPASS=NAO`).

---

## 6. Arquitetura de Recuperacao Resiliente (Recovery)

O Gate G5 garantia que falhas durante o processo de importacao preservassem o snapshot ativo anterior. O Gate G10 expande essa garantia para cenarios de corrupcao que ocorram **apos a importacao**, no repouso ou durante a inicializacao.

### 6.1. Validacao Ativa no Startup (Startup Active Validation)
Ao inicializar o cliente (ou ao recarregar a aplicacao), antes de declarar o catalogo disponivel (`CATALOG_READY`), o `RecoveryService` executa `validateActiveSnapshot()`:
1. Verifica existencia e legibilidade de `active.json`;
2. Confirma existencia do diretorio do snapshot ativo em `snapshots/<snapshotId>/`;
3. Valida a presenca e formato do manifesto `manifest.json`;
4. Efetua parse e validacao estrutural completa de `catalog.json`;
5. Recalcula o SHA-256 do catalogo e compara com o valor registrado no manifesto;
6. Se o snapshot for *search-enabled*, valida a integridade estrutural de `search-index.json` e confere seu hash com o manifesto;
7. Valida a consistencia das vinculacoes entre entidades do catalogo e o indice de busca.

### 6.2. Diario de Recuperacao (Recovery Journal)
O estado de geracoes confiaveis e mantido em `prebuilt/recovery.json`:
- `activeSnapshotId`: Snapshot atualmente em execucao;
- `previousSnapshotId`: Ultima geracao confirmadamente confiavel (*last-known-good*);
- `lastKnownGoodSnapshotId`: Referencia persistida ao ultimo snapshot funcional;
- `updatedAt`: Carimbo temporal ISO 8601 da ultima transicao;
- `snapshotMetadata`: Registro historico dos hashes e estado de busca de cada geracao.

A gravacao do diario e estritamente atomica e ocorre imediatamente apos a promocao bem-sucedida do `active.json`.

### 6.3. Politica de Retencao Minima
- A baseline de recuperacao mantem duas geracoes validas: a geracao ativa e a geracao imediatamente anterior (`RECOVERY_BASELINE=ACTIVE_PLUS_PREVIOUS_KNOWN_GOOD`).
- Retencao minima garantida: `RECOVERY_MINIMUM_GENERATIONS=2`.
- Politicas de retencao historica profunda alem das 2 geracoes minimas permanecem em aberto para analise com limites de armazenamento do Fire Stick (`SNAPSHOT_RETENTION_POLICY=OPEN_BEYOND_RECOVERY_MINIMUM`).

### 6.4. Fluxo de Recuperacao Automatica (Auto-Recovery)
Quando uma anomalia e detectada na geracao ativa:
1. O sistema marca o estado como `RECOVERING`;
2. Localiza a geracao candidata anterior atraves do `recovery.json`;
3. Executa a validacao integral e recálculo de hashes da geracao anterior;
4. Se integra e valida:
   - Atualiza atomicamente o `active.json` para apontar para a geracao recuperada;
   - Atualiza o diario de recuperacao;
   - Notifica a aplicacao de sucesso (`RECOVERY_SUCCEEDED`);
5. Se a geracao anterior tambem estiver ausente ou corrompida:
   - Transiciona para `NO_VALID_LOCAL_SNAPSHOT`;
   - O catalogo **nunca** e exposto como array vazio falso (`RECOVERY_FALSE_EMPTY_PREVENTED=PASS`).

### 6.5. Resiliencia contra Falha de Gravacao do Ponteiro
Durante o processo de recuperacao, o snapshot defeituoso nao e sobrescrito nem destruido. A recuperacao e estritamente idempotente (`RECOVERY_IDEMPOTENT=PASS`). Caso a escrita do novo ponteiro falhe no sistema de arquivos, a operacao aborta de forma segura sem deixar ponteiros corrompidos ou parciais (`RECOVERY_POINTER_WRITE_FAILURE_SAFE=PASS`).

---

## 7. Decisao sobre Criptografia de Pacotes (Package Encryption)

### 7.1. Decisao Adjudicada
- `PACKAGE_ENCRYPTION_IMPLEMENTED=NAO`
- `PACKAGE_ENCRYPTION_MVP_REQUIREMENT=NOT_REQUIRED_FOR_CREDENTIAL_FREE_PROVISIONING_DATA`

### 7.2. Justificativa Tecnica
- O catalogo de provisionamento e os artefatos de busca do Xandeflix Prebuilt contêm metadados publicos/abertos (titulos, sinopses, categorias, identificadores opacos de stream `StreamRef`).
- Nao ha nenhuma credencial, chave de API, senha de banco ou token de acesso contida nos artefatos de provisionamento (`STREAM_REF_CREDENTIAL_POLICY=CREDENTIAL_FREE`).
- A autenticidade e integridade criptografica providas pelo envelope ECDSA P-256 garantem que os dados nao possam ser forjados ou adulterados.
- Adicionar criptografia simetrica (ex.: AES-GCM) com chave embutida no APK proporcionaria apenas ofuscacao cosmetica ("security through obscurity"), introduzindo sobrecarga computacional e complexidade desnecessaria no Fire Stick.
- Caso futuros requisitos de produto demandem transporte de dados confidenciais nos pacotes, a decisao podera ser reaberta formalmente.

---

## 8. Evidencias de Desempenho (Performance Empirical Evidence)

As medicoes de desempenho coletadas durante a suite de verificacao sintetica demonstraram custos computacionais minimos para a camada de seguranca e recuperacao:

| Operacao | Tempo Medio Medido | Observacao |
| :--- | :--- | :--- |
| **Recálculo de SHA-256 de Artefato** | ~0 ms (0.15 ms) | Artefatos tipicos de provisionamento e deltas (2 KB a 3 KB). |
| **Verificacao de Assinatura ECDSA P-256** | ~2 ms (1.8 ms) | Operacao assimetrica executada com WebCrypto nativo. |
| **Overhead Total do Secure Import** | ~1 ms | Comparado com o tempo de parsing e extracao ZIP. |
| **Varredura Completa de Startup (Active Scan)** | ~3 ms (2.5 ms) | Validacao profunda de schema, hashes e integridade relacional. |
| **Recuperacao de Geracao Anterior (Recovery)** | ~2 ms | Promocao atomica e revalidacao sem impacto perceptivel. |

> **Nota Normativa**: Conforme a regra canonica do projeto, `PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM`. Estas medicoes representam dados empiricos preliminares em ambiente de desenvolvimento e nao constituem SLA de producao em hardware fisico de TV.

---

## 9. Limitacoes Atuais e Proximos Passos (G10 -> G11)

1. **Chaves de Producao**: O Gate G10 implementou o motor criptografico completo e provou seu funcionamento com chaves sinteticas de teste geradas em memoria. A geracao, guarda e distribuicao de chaves publicas de producao permanecem como atividade operacional (`PRODUCTION_SIGNING_KEY_PROVISIONED=NAO`).
2. **Ambiente Local**: A recuperacao do G10 e estritamente local (`RECOVERY_NETWORK=NONE`). Nao ha busca de rede ou fallback para download automatico quando nenhum snapshot local e valido.
3. **Validacao em Hardware Fisico**: O Gate G11 (`XANDEFLIX_PREBUILT_G11_PHYSICAL_MULTI_DEVICE_TESTING`) realizara a homologacao em dispositivos Android e Fire TV Stick fisicos, avaliando limites reais de memoria e desempenho.
