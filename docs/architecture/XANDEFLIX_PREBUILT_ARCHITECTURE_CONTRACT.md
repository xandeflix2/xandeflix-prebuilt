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

## 6. Invariante consolidada C11 — novos dispositivos

Instalacao limpa deve gerar identidade/chave local persistente, ficar pendente
sem falso erro de licenca e, apos autorizacao real, importar/promover catalogo
sem depender de diretorios preexistentes. Mudancas devem preservar esse fluxo
sob [C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1](C11_NEW_DEVICE_ACTIVATION_LOCK.md).
Playback permanece independente, device-to-source e sujeito a autorizacao;
falha de reproducao nao autoriza recriar identidade/chave nem contornar licenca.

## 7. Emenda limitada C155 — acesso web com dispositivo existente

Em 2026-10-17, o usuario autorizou a emenda especificada em
[C11_EXISTING_DEVICE_WEB_LOGIN.md](C11_EXISTING_DEVICE_WEB_LOGIN.md).
Exclusivamente no consumidor web publico /app, acesso exige codigo do
dispositivo, chave permanente e PIN cadastrado, com validacao real no servidor.
Nao gerar identidade/chave, usuario, licenca ou ativacao para o navegador:
usar sessao delegada, efemera e revogavel do dispositivo/licenca existentes,
sem copiar, rotacionar ou substituir o token original do aparelho.

Permitir somente verificador protegido de PIN em autenticacao privada do
Control Plane; PIN plaintext, PUK, registro parental e dados de conteudo nao
sao persistidos remotamente por essa excecao. Gestor autorizado pode cadastrar
a credencial web dentro de seu escopo; nao ganha reset/reveal de PIN/PUK local.
Licenca, revogacao, limites C9, source delivery protegido, catalogo/busca locais
e playback direto permanecem obrigatorios. Nao autoriza proxy ou relay.

A secao6 e o lock continuam integrais para instalacoes nativas Android/TV/Fire
Stick. A excecao web nao relaxa testes ou autoriza alterar APKs. Documentacao
nao comprova implementacao, implantacao ou reproducao em producao.

## C156 — PIN web independente e recuperacao por PUK local — 2026-10-17

Pedido posterior substitui o reuso do PIN parental C155 por cadastro separado
em Configuracoes -> PIN web. Especificacao/allowlist anterior ao codigo em
[C11_SEPARATE_WEB_PIN_RECOVERY.md](C11_SEPARATE_WEB_PIN_RECOVERY.md).
PIN web novo deve ser diferente do parental; criacao/recuperacao local exige
PUK valido e nao concede grant parental/adulto. PUK e seus verificadores nao
saem do aparelho. Servidor recebe somente chave publica ECDSA de recuperacao
e desafios efemeros; chave privada fica cifrada localmente sob PUK/AES-GCM
e nunca e persistida/transmitida em claro. Isso nao e verificador remoto do
PUK nem permite atacar o PUK com dados do servidor. Troca legitima do PUK
reencapsula localmente a chave, sem mudar prova publica ou enviar segredo.
Gestor pode criar PIN inicial; depois de cadastrado, recuperacao/redefinicao
exige prova vinculada ao PUK no aparelho, sem reset administrativo legado.
PINs C155 sem recovery exigem PIN web atual para vincular recuperacao; nao
prometer recuperacao retroativa sem essa preparacao. Bloqueio3h preservado.
Nenhuma mudanca em fonte/vault/catalogo/busca/player/identidade/licenca/ativacao.

## C159 — continuidade da sessao na recarga da mesma aba — 2026-10-18

Pedido do usuario sobre Ctrl+F5 autoriza a excecao limitada documentada em
[C11_WEB_SESSION_RELOAD.md](C11_WEB_SESSION_RELOAD.md): somente prova web
opaca efemera cifrada localmente, chave AES nao exportavel, mesma aba/origin
e validacao server-side antes de App. Nao salvar os tres fatores, token
nativo, fonte ou resposta de autorizacao. Nao mudar prazo/revogacao/licenca,
C9, namespace de clientes, APK ou exigencia de primeiro login real. Sair
remove prova e revoga; pagehide interrompe midia sem revogar por recarga.
Nao autoriza proxy/relay, bypass HTTPS/CORS/TLS ou nova ativacao de navegador.

## C164 - Autoativacao limitada ao proprio aparelho - 2026-10-19

Pedido posterior limita cadastro publico a um aparelho/uma sessao e trial
server-side de sete dias, sem renovacao automatica ou planos enquanto nao ha
pagamento configurado. Formulario e composicao de ativacao em
[C11_SINGLE_DEVICE_SELF_ACTIVATION.md](C11_SINGLE_DEVICE_SELF_ACTIVATION.md).
Botao valida codigo/chave existentes e passa somente capability curta ao
navegador, consumida/retirada do fragmento antes do SDK. Nao transmite chave
permanente na URL nem cria identidade do navegador. Dados pessoais minimos
e apresentacao do proprio aparelho nao concedem acesso de gestor. Preservar
cofres, fonte direta, C9, licencas gerenciadas/pagas, identidade e lock.
