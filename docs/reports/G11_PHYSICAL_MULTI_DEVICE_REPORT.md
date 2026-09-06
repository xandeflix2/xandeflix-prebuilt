# Relatório de Testes Físicos Multi-Dispositivo — Gate G11 / Subciclo G11A

---

## 1. Identidade e Status do Ciclo

- **PROJECT**: `XANDEFLIX_PREBUILT`
- **CYCLE**: `XANDEFLIX_PREBUILT_G11A_PHYSICAL_PROVISIONING_AND_DEVICE_DISCOVERY_CORRECTION`
- **LAST_CLOSED_GATE**: `G10`
- **G10_STATUS**: `PASS`
- **G11_STATUS**: `IN_PROGRESS`
- **G11A_STATUS**: `PASS`
- **MVP_PROGRESS_PERCENT**: `94`
- **PHONE_VALIDATION_REMAINING**: `SIM`
- **G12_STATUS**: `NOT_STARTED`
- **NEXT_GATE**: `XANDEFLIX_PREBUILT_G11B_PHONE_AND_FINAL_PHYSICAL_MATRIX`
- **PREVIOUS_ATTEMPT**: `INCONCLUSIVE_PREBUILT_G11_REQUIRED_DEVICE_UNAVAILABLE` (reavaliado e superado via subciclo G11A)

---

## 2. Matriz de Hardware Físico

| Dispositivo | Modelo | Fabricante | Versão Android | API Level | Estado ADB | Presença Física |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tablet** | `SM-X610` (Galaxy Tab S9 FE) | Samsung | Android 16 | 36 | `device` (RX2X301Q3KY) | SIM |
| **TV / Stick** | `AFTSSS` (Fire TV Stick Lite) | Amazon | Android 9 | 28 | `device` (G071EL1313720CJ0) | SIM |
| **Smartphone** | — | — | — | — | — | NAO (Pendente G11B) |

---

## 3. Arquitetura de Provisionamento Físico e Isolamento de Segurança

### 3.1. Âncora de Confiança Exclusiva de Depuração (DEBUG_ONLY_TEST_TRUST_ANCHOR)
- **Status**: `DEBUG_TEST_TRUST_KEY_SUPPORTED = SIM`
- **KeyId**: `g11-physical-test-key-2026`
- **Algoritmo**: `ECDSA_P256_SHA256`
- **Chave Pública**: MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEpHCd1OFPqK1FTQvCgV13oRb3HnSL2Vtuj5lr6/qLLilsZq18qwog73A+M9G3kt9ddNeZmg9IVi/ENLKfLbEpcA==
- **Chave Privada**: Efêmera, gerada externamente durante o harness e imediatamente destruída (`TEST_PRIVATE_KEY_PERSISTED = NAO`).
- **Isolamento de Release**:
  - `RELEASE_TEST_TRUST_KEY_PRESENT`: `NAO` (confirmado via auditoria estática do APK release)
  - `RELEASE_DEBUG_IMPORT_ENTRYPOINT_PRESENT`: `NAO`
  - `RELEASE_DEBUG_PROVISIONER_BEHAVIOR`: `INERT_NO_IMPORT_CAPABILITY` (stub NO-OP em `src/release`)
  - `PRODUCTION_IMPORT_BYPASS`: `NAO`
  - `UNSIGNED_PRODUCTION_IMPORT_ALLOWED`: `NAO`
  - `PRIVATE_SIGNING_KEY_IN_APK`: `NAO`

### 3.2. Fluxo Criptográfico de Importação
```
Artefato Sintético ZIP (Full Package v2)
+
Security Envelope JSON (V1, ECDSA_P256_SHA256)
  │
  ▼
[Transporte seguro via ADB para armazenamento local temporário]
  │
  ▼
[Ponto de entrada: Activity/Intent Receiver ou Bridge window.__XANDEFLIX_DEBUG_IMPORT__]
  │
  ▼
[SecureArtifactImportService]
  ├── [1] TrustedPublicKeyStore (g11-physical-test-key-2026)
  ├── [2] ArtifactVerifier: Digest SHA-256 + Assinatura ECDSA DER
  ├── [3] PackageValidator: Schema v1, Manifest v2, Integridade Byte-a-Byte
  ├── [4] Staging: snapshots/snap-37636eb750ae6323/ em quarentena
  ├── [5] Readback Validation: Verificação rigorosa pré-ativação
  └── [6] Promoção Atômica: active.json -> snapshot íntegro
```

### 3.3. Testes Criptográficos Físicos Negativos
- `PHYSICAL_UNSIGNED_ARTIFACT_REJECTED`: `PASS` (Rejeição sumária com fail-closed).
- `PHYSICAL_TAMPERED_ARTIFACT_REJECTED`: `PASS` (Erro criptográfico `SIGNATURE_INVALID` disparado).

---

## 4. Evidências Físicas Homologadas

### 4.1. Tablet Samsung SM-X610 (Android 16, API 36)
- `TABLET_INSTALL`: `PASS`
- `TABLET_COLD_START`: `PASS`
- `TABLET_PORTRAIT`: `PASS`
- `TABLET_LANDSCAPE`: `PASS`
- `TABLET_HOME`: `PASS` (Carregamento completo do catálogo sintético sem requisições de rede)
- `TABLET_MOVIES`: `PASS` (Navegação em grade de filmes, tags de filtro e foco visual)
- `TABLET_SERIES`: `PASS` (Navegação em grade de séries com metadados estruturados)
- `TABLET_MOVIE_DETAIL`: `PASS` (Exibição de pôster, título, ano, sinopse e botão "▶ Assistir")
- `TABLET_SERIES_DETAIL`: `PASS` (Exibição detalhada com temporadas e episódios)
- `TABLET_SEARCH`: `PASS` (Busca instantânea via índice invertido pré-construído local)
- `TABLET_TOUCH`: `PASS` (Interação touch responsiva em todas as telas)
- `TABLET_DPAD_BASELINE`: `PASS` (Suporte a teclado/controle direcional)
- `TABLET_BACK`: `PASS` (Retorno coerente na pilha de navegação)
- `TABLET_RESTART`: `PASS` (Catálogo ativo preservado sem necessidade de reimportação)
- `TABLET_PROCESS_DEATH`: `PASS` (Recuperação transparente pós-interrupção)
- `TABLET_NO_FALSE_EMPTY`: `PASS` (Ausência categórica de falso vazio)
- `TABLET_CRASH_COUNT`: `0`
- `TABLET_ANR_COUNT`: `0`
- **Latências de Busca (Observacionais - Não SLA)**:
  - `TABLET_QUERY_EXACT_MS`: `1118` (tempo total de digitação + render; índice < 20ms)
  - `TABLET_QUERY_PREFIX_MS`: `197`
  - `TABLET_QUERY_NO_RESULT_MS`: `419`
- **Consumo de Memória (PSS - dumpsys meminfo)**:
  - `TABLET_PSS_IDLE_MB`: `252.5`
  - `TABLET_PSS_AFTER_HOME_MB`: `240.2`
  - `TABLET_PSS_AFTER_SEARCH_MB`: `206.3`
- `SEARCH_PHYSICAL_USABILITY_TABLET`: `PASS`

### 4.2. Amazon Fire TV Stick Lite AFTSSS (Android 9, API 28)
- `FIRE_STICK_INSTALL`: `PASS`
- `FIRE_STICK_COLD_START`: `PASS`
- `FIRE_STICK_HOME`: `PASS` (Interface 1080p TV renderizada perfeitamente)
- `FIRE_STICK_MOVIES`: `PASS`
- `FIRE_STICK_SERIES`: `PASS`
- `FIRE_STICK_MOVIE_DETAIL`: `PASS`
- `FIRE_STICK_SERIES_DETAIL`: `PASS`
- `FIRE_STICK_SEARCH`: `PASS` (Teclado virtual na tela + busca local imediata)
- `FIRE_STICK_DPAD`: `PASS` (D-pad direcional UP, DOWN, LEFT, RIGHT e ENTER)
- `FIRE_STICK_BACK`: `PASS` (Retorno de tela sem perda de estado)
- `FIRE_STICK_FOCUS_VISIBLE`: `PASS` (Anel de foco de alto contraste visível em todos os itens focáveis)
- `FIRE_STICK_FOCUS_TRAP`: `NAO` (Nenhum aprisionamento de foco detectado)
- `FIRE_STICK_RESTART`: `PASS`
- `FIRE_STICK_PROCESS_DEATH`: `PASS`
- `FIRE_STICK_NO_FALSE_EMPTY`: `PASS`
- `FIRE_STICK_CRASH_COUNT`: `0`
- `FIRE_STICK_ANR_COUNT`: `0`
- **Latências de Busca (Observacionais - Não SLA)**:
  - `FIRE_STICK_QUERY_EXACT_MS`: `2112`
  - `FIRE_STICK_QUERY_PREFIX_MS`: `1576`
  - `FIRE_STICK_QUERY_NO_RESULT_MS`: `1811`
- **Consumo de Memória (PSS - dumpsys meminfo)**:
  - `FIRE_STICK_PSS_IDLE_MB`: `102.5`
  - `FIRE_STICK_PSS_AFTER_HOME_MB`: `145.7`
  - `FIRE_STICK_PSS_AFTER_SEARCH_MB`: `149.2`
- `SEARCH_PHYSICAL_USABILITY_FIRE_STICK`: `PASS`

---

## 5. Coexistência de Pacotes e Isolamento Rigoroso

- **App sob Teste**: `com.xandeflix.prebuilt` (instalado e validado em ambos os dispositivos).
- **App Protegido**: `com.xandeflix.app` (Xandeflix 2.0 original).
- **Confirmação de Coexistência**:
  - No Tablet Samsung: ambos os pacotes coexistem sem colisão de namespace, dados privados ou permissões.
  - No Fire TV Stick: instalado sem interferência no ambiente.
  - `PROTECTED_APP_MODIFIED`: `NAO`
  - `APP_DATA_ISOLATED`: `SIM`
  - `PROTECTED_REPOSITORY_WRITES`: `NONE`
  - `ORIGINAL_REPOSITORY_UNTOUCHED`: `SIM`

---

## 6. Auditoria de Segredos e Isolamento de Release

- `PRIVATE_SIGNING_KEY_IN_APK`: `NAO`
- `SOURCE_PASSWORD_IN_APK`: `NAO`
- `SERVICE_ROLE_IN_APK`: `NAO`
- `SECRETS_EXPOSURE`: `NAO`
- `SENSITIVE_LOG_EXPOSURE`: `NAO`
- `RELEASE_TEST_TRUST_KEY_PRESENT`: `NAO`
- `RELEASE_DEBUG_IMPORT_ENTRYPOINT_PRESENT`: `NAO`
- `RELEASE_DEBUG_PROVISIONER_BEHAVIOR`: `INERT_NO_IMPORT_CAPABILITY`
- `UNSIGNED_PRODUCTION_IMPORT_ALLOWED`: `NAO`
- `PRODUCTION_IMPORT_BYPASS`: `NAO`

---

## 7. Próximos Passos (Transição para G11B)

1. Conexão física de smartphone Android (`PHONE_DEVICE_PRESENT=SIM`).
2. Execução da matriz física canônica completa unificada: Tablet + Fire TV + Smartphone.
3. Fechamento definitivo do Gate G11 pelo Chat Mestre.
