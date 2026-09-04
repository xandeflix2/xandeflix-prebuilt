# Xandeflix Prebuilt — Contrato Arquitetural

---

## 1. Identidade e Proposito do Contrato

Este documento define as fronteiras, padroes normativos, fluxos de dados e restricoes arquiteturais do projeto **Xandeflix Prebuilt** (`XANDEFLIX_PREBUILT`).
Sua finalidade e validar a hipotese tecnica de que o descarregamento do processamento pesado de catalogos de streaming para um ambiente externo (External Preprocessing) viabiliza inicializacao instantanea, baixo consumo de CPU/RAM e navegacao fluida em dispositivos de baixo custo e capacidade reduzida (TV boxes, Smart TVs de entrada e celulares modestos), mantendo a busca e runtime estritamente locais no cliente.

---

## 2. Pilares Arquiteturais (TARGET)

As seguintes definicoes constituem metas arquiteturais normativas (`TARGET`):

- `EXTERNAL_PREPROCESSING=TARGET`: A ingestao, descompressao, parsing, normalizacao de metadados, extracao de categorias e preparacao do catalogo ocorrem fora do dispositivo do usuario.
- `UNIVERSAL_APK=TARGET`: O aplicativo cliente e distribuido de forma generica e agnostica de credenciais de fonte ou metadados de conteudo especificos.
- `PROVISIONING_PACKAGE=TARGET`: Os dados do catalogo pre-processado sao empacotados em um artefato versionado e imutavel para distribuicao e ingestao veloz pelo aplicativo cliente.
- `DEVICE_LOCAL_RUNTIME_CATALOG=TARGET`: Uma vez importado, o catalogo e persistido e consultado diretamente no armazenamento local do dispositivo.
- `DEVICE_LOCAL_SEARCH=TARGET`: A busca e filtragem de conteudos ocorrem de forma 100% local no dispositivo, sem dependencia de consultas a APIs centrais em tempo de execucao.
- `DEVICE_DIRECT_PLAYBACK=TARGET`: O fluxo de midia e consumido diretamente do provedor de origem pelo player do dispositivo, sem intermediacao de servidores proxy de video.

---

## 3. Fluxo de Dados Canonico

O pipeline de dados opera sequencialmente conforme o fluxo:

```
AUTHORIZED_SOURCE
       │
       ▼
EXTERNAL_INGESTION
       │
       ▼
NORMALIZATION
       │
       ▼
PREBUILT_CATALOG
       │
       ▼
ARTWORK_REFERENCES
       │
       ▼
SEARCH_SEED_OR_INDEX
       │
       ▼
VERSIONED_PROVISIONING_PACKAGE
       │
       ▼
DEVICE_IMPORT
       │
       ▼
LOCAL_CATALOG
       │
       ▼
LOCAL_SEARCH
       │
       ▼
DEVICE_DIRECT_PLAYBACK
```

---

## 4. Restricoes e Padroes Proibidos no MVP

Para manter o escopo seguro, legalmente defensavel e com isolamento de responsabilidades, e estritamente **PROIBIDO** no MVP:

- `CENTRAL_STREAM_PROXY`: Proibido qualquer proxy central de stream de video.
- `CENTRAL_VIDEO_RELAY`: Proibido qualquer retransmissor ou re-streamer centralizado de pacotes de video.
- `CENTRAL_IPTV_STREAMING_BACKEND`: Proibido hospedar ou manter backends de streaming centralizado.
- `EMBEDDED_SERVICE_ROLE`: Proibido embutir chaves `service_role` do Supabase ou credenciais administrativas no cliente.
- `PLAINTEXT_SOURCE_PASSWORD_IN_APK`: Proibido incluir senhas em texto plano ou tokens de fontes no pacote do APK universal.
- `PRIVATE_SIGNING_KEY_IN_REPO`: Proibido armazenar chaves privadas de assinatura em qualquer parte do repositorio de codigo.

---

## 5. Elementos Ainda Nao Provados (Hipotese em Aberto)

Os seguintes aspectos tecnicos permanecem em status **NAO PROVADO** e dependem de experimentos e benchmarks formais nos Gates subsequentes:

1. `SEARCH_INDEX_TRANSPORTABILITY`: Nao esta provado se um indice de busca pre-construido no servidor (ex: SQLite FTS, MiniSearch serialized, FlexSearch export) pode ser transportado e lido no cliente sem overhead de reconstrucao.
2. `INDEXEDDB_LEVELDB_PORTABILITY`: Nao esta provada a portabilidade direta de bases de dados IndexedDB / LevelDB entre ambientes servidor e cliente (WebView / Android).
3. `SEARCH_SEED_FINAL_FORMAT`: O formato final do seed de busca (JSON comprimido, SQLite, binario customizado) permanece em aberto.
4. `PROVISIONING_PACKAGE_FINAL_FORMAT`: A extensao e empacotamento definitivo (ZIP, TAR.GZ, SQLite standalone, SQLite comprimido) nao foram homologados.
5. `INCREMENTAL_UPDATE_FINAL_FORMAT`: O mecanismo para atualizacoes delta de catalogos (diff JSON, migracao SQLite incremental, patching binario) ainda nao foi validado.
6. `PACKAGE_ENCRYPTION_REQUIREMENT`: A necessidade e viabilidade tecnica de criptografia do pacote de provisionamento permanece sob avaliacao.
7. `PACKAGE_SIGNING_FINAL_MECHANISM`: O mecanismo de assinatura digital (ECDSA, Ed25519) e verificacao de integridade/autoria no dispositivo sera definido e medido nos Gates de seguranca.
