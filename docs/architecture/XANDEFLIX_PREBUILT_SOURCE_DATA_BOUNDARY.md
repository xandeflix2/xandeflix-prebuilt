# Xandeflix Prebuilt — Source Data Boundary

> Documento derivado do cânone do Xandeflix 2.0 para o laboratório `XANDEFLIX_PREBUILT`. Este arquivo complementa o Architecture Contract disponível no repositório; não o substitui nem cria um override arquitetural.

```text
DERIVED_FROM_XANDEFLIX_2_CANON=SIM
LAB_SCOPE=XANDEFLIX_PREBUILT
ARCHITECTURE_OVERRIDE=NAO
C11_CANONICAL_AMENDMENT=PERMANENT_DEVICE_KEY_EXTERNAL_ACTIVATION_V1
C11_SOURCE_REVEAL_EXCEPTION=MASTER_AUTHORIZED_SERVER_SIDE_ONLY
```

## 0. Emenda canônica C11 — reveal controlado do Gestor Master

Esta emenda substitui somente a proibição anterior de reveal no Gestor
Master. A configuração da source continua cifrada em repouso e nunca é
gravada em tabelas públicas, logs, respostas anônimas, Android ou Portal do
Cliente. Um Gestor Master autenticado pode solicitar reveal server-side de
URL, credenciais e chave permanente do dispositivo, com autorização real e
auditoria obrigatória.

```text
MASTER_MANAGER_SOURCE_REVEAL=PERMITIDO
MASTER_MANAGER_PERMANENT_KEY_REVEAL=PERMITIDO
MASTER_MANAGER_REVEAL_SERVER_SIDE=SIM
MASTER_MANAGER_REVEAL_AUDITED=SIM
PUBLIC_SOURCE_REVEAL=PROIBIDO
ANDROID_SOURCE_REVEAL=PROIBIDO
CUSTOMER_PORTAL_SOURCE_REVEAL_DEFAULT=PROIBIDO
SOURCE_PLAINTEXT_PUBLIC_STORAGE=PROIBIDO
SOURCE_CREDENTIAL_PUBLIC_STORAGE=PROIBIDO
SUPERSEDES=SUPERSEDED_BY_C11_PERMANENT_KEY_EXTERNAL_ACTIVATION_AMENDMENT
```

## 1. Boundary canônico

O backend do Prebuilt continua sendo o Control Plane e não é data plane de mídia. Para sources `MANAGED`, o Control Plane mantém a configuração real exclusivamente em um `SOURCE_CONFIGURATION_VAULT` remoto, cifrado/protegido e separado da metadata pública. Para `SELF_SERVICE`, o produto suporta dois canais canônicos de provisionamento:
- `REMOTE_PORTAL`: o cliente informa sua fonte (M3U ou Xtream Codes) remotamente no Portal do Cliente; a configuração sensível é gravada exclusivamente em um cofre privado cifrado (`CUSTOMER_SOURCE_VAULT`) isolado por conta de cliente, sem exposição pública, e entregue de forma cifrada/autorizada aos dispositivos autenticados e emparelhados da licença;
- `LOCAL_DEVICE`: canal de entrada local direta no dispositivo, validado em memória e selado no `LocalSecureSourceStore` sem transmissão remota.

O estado alvo após a reconciliação canônica C1R é:

```text
BACKEND_CONTROL_PLANE_ONLY=SIM
MANAGED_SOURCE_CONFIGURATION_STORAGE=REMOTE_ENCRYPTED_VAULT
REMOTE_MANAGED_SOURCE_CONFIGURATION_ALLOWED=SIM
REMOTE_MANAGED_SOURCE_CONFIGURATION_ENCRYPTED=SIM
REMOTE_MANAGED_SOURCE_CONFIGURATION_CONTROL_PLANE_ONLY=SIM
SELF_SERVICE_SOURCE_CONFIGURATION_STORAGE=REMOTE_ENCRYPTED_PRIVATE_VAULT_WITH_LOCAL_SECURE_STORE_SEALING
REMOTE_SELF_SERVICE_SOURCE_CONFIGURATION=SIM_WITH_LICENSE_AND_DEVICE_AUTH
LOCAL_SELF_SERVICE_SOURCE_CONFIGURATION_PRESERVED=SIM
SOURCE_FETCH=DEVICE_DIRECT
CATALOG_PROCESSING=DEVICE_LOCAL
CATALOG_STORAGE=DEVICE_LOCAL_ONLY
CONTENT_SEARCH=DEVICE_LOCAL
PLAYER_CONNECTION=DEVICE_TO_SOURCE_DIRECT
LOCAL_CATALOG_SYNC_TO_BACKEND=NAO
```

## 2. Dados permitidos no Control Plane

O Control Plane pode persistir somente:

- licença, plano, validade e status;
- identidade/status do dispositivo e revogação;
- autorização e binding device-source;
- `sourceId` opaco e `sourceVersion` lógica;
- status e tipo/protocolo lógico da source;
- nome e metadados administrativos sanitizados;
- auditoria sanitizada.

Para `MANAGED`, a boundary adicional `SOURCE_CONFIGURATION_VAULT` pode persistir somente a configuração necessária à conexão, cifrada/protegida, com acesso restrito ao fluxo autorizado do Control Plane. O vault não é uma listagem de metadata, não é exposto ao Manager como plaintext e não é devolvido em respostas públicas de resolução.

`sourceId` é um `OPAQUE_LOGICAL_AUTHORIZATION_IDENTIFIER`. Não é URL, host, hash de URL/host, credential, identidade de playlist ou identidade de conteúdo.

`sourceVersion` é `LOGICAL_CONFIGURATION_GENERATION`. Não é revisão de playlist, catálogo, conteúdo, stream ou hash de playlist.

`M3U` e `XTREAM` podem existir apenas como enumeração lógica de protocolo/tipo. Não autorizam o armazenamento do conteúdo ou das credenciais correspondentes.

## 3. Dados proibidos remotamente

É proibido persistir, retornar ou transportar fora da boundary autorizada do vault:

- host, endpoint, playlist URL ou stream URL reais;
- username, password, token, header `Authorization` ou credenciais Xtream;
- playlist M3U, configuração real `SELF_SERVICE` ou qualquer configuração em plaintext;
- configuração `MANAGED` fora do `SOURCE_CONFIGURATION_VAULT` cifrado/protegido;
- catálogo, canais, filmes, séries, episódios, grupos, logos, EPG, `tvg-id`, TMDB vinculado, `SearchIndex` ou snapshots locais.

Uma configuração `MANAGED` cifrada no vault é permitida pelo modelo do owner, mas nunca deve aparecer em listagens, logs, auditorias não sanitizadas ou respostas para dispositivo não autorizado. Para `SELF_SERVICE` remoto, a configuração sensível informada pelo cliente no portal é armazenada exclusivamente em `private.customer_source_secret_vault`, cifrada e isolada estritamente pelo identificador da conta (`customerId`), nunca sendo visível a outros clientes, nem exposta em listagens públicas ou plaintext. A configuração do canal `SELF_SERVICE` local nunca trafega para o backend.

Criptografar remotamente exige isolamento estrito de cofre privado: `REMOTE_ENCRYPTED_SOURCE_SECRET_STORAGE=SIM_FOR_VAULTS_ONLY (MANAGED_VAULT e CUSTOMER_VAULT)`. Segredos em tabelas públicas ou plaintext permanecem estritamente proibidos (`ZERO_PLAINTEXT_PUBLIC_STORAGE=SIM`).

## 4. Fluxo de resolução autorizado

O fluxo canônico reconciliado é:

```text
APP
  → Control Plane
  → authorization metadata
  → sourceId/sourceVersion/status/protocol/session decision
  → [MANAGED: secure managed vault delivery authorized for this device]
  → [SELF_SERVICE REMOTE: secure customer vault delivery authorized for customer's paired devices]
  → [SELF_SERVICE LOCAL: direct local-only source input]
  → LocalSecureSourceStore
  → local configuration lookup
  → runtime context efêmero
  → acesso direto device-to-source
```

O Control Plane não retorna source secret em metadata pública. No modo `MANAGED` e no canal `SELF_SERVICE_REMOTE`, fluxos separados e explicitamente autorizados entregam a configuração protegida do vault correspondente ao dispositivo para selagem no `LocalSecureSourceStore`; plaintext somente existe nos limites transitórios locais necessários no dispositivo. No canal `SELF_SERVICE_LOCAL`, a configuração nasce e permanece no próprio dispositivo. Em todos os modos, o runtime só materializa contexto depois de uma consulta bem-sucedida ao armazenamento local seguro. O contexto de runtime é efêmero e não deve ser persistido no Control Plane.

O Manager remoto pode administrar `sourceId`, nome sanitizado, tipo/protocolo lógico, versão lógica, status, binding, autorização e o fluxo de gravação no vault cifrado gerenciado. O cliente autenticado gerencia sua própria fonte `SELF_SERVICE` pelo Portal do Cliente. Nenhum painel opera com plaintext exposto.

## 5. Bloqueio remoto e fail closed

O Control Plane continua sendo autoridade para impedir uso sem conhecer a source:

```text
REMOTE_AUTH_INVALID           → NO_SOURCE_ACCESS
DEVICE_REVOKED                → NO_SOURCE_ACCESS
SOURCE_DISABLED               → NO_SOURCE_ACCESS
BINDING_MISSING               → NO_SOURCE_ACCESS
LOCAL_SOURCE_CONFIG_MISSING   → SOURCE_ACTION_REQUIRED
LOCAL_SOURCE_VERSION_MISMATCH → SOURCE_ACTION_REQUIRED
LOCAL_STALE_FALLBACK=NAO
SYNTHETIC_SOURCE_FALLBACK=NAO
```

Uma configuração pode permanecer fisicamente no dispositivo após revogação ou desabilitação, mas não pode ser usada enquanto a autorização remota não for válida.

Quando a versão remota e a versão local divergem, o resultado padrão é `LOCAL_SOURCE_CONFIG_VERSION_MISMATCH → ACTION_REQUIRED`. Não existe migração automática, fallback para configuração stale ou recuperação de segredo remoto neste boundary.

## 6. Armazenamento local obrigatório

O `LocalSecureSourceStore` deve ser indexado por `sourceId` e manter localmente a configuração real, a geração lógica local e o tipo/protocolo necessário para o runtime, seja após entrega autorizada `MANAGED`, seja após entrada local `SELF_SERVICE`. Em produção, deve usar primitive segura apoiada pelo dispositivo, como Android Keystore ou plugin de secure storage aprovado.

`localStorage`, Capacitor Filesystem simples em `Directory.Data` e stores de debug não são armazenamento seguro de produção. Podem permanecer como fixtures/laboratório até existir substituto seguro, mas não podem ser a autoridade final do runtime de produção.

## 7. Legado congelado

O legado remoto atualmente identificado é:

```text
CURRENT_NON_COMPLIANT_REMOTE_FIELDS=encrypted_payload, iv, auth_tag
CURRENT_STATUS=LEGACY_FROZEN_PENDING_SAFE_MIGRATION
OWNER_RULE_SUPERSEDES_REMOTE_SOURCE_SECRET_STORAGE=ENCRYPTED_VAULTS_ONLY (MANAGED_VAULT_AND_CUSTOMER_VAULT)
OWNER_RULE_RECONCILES_REMOTE_SOURCE_SECRET_STORAGE=SELF_SERVICE_REMOTE_VAULT_ALLOWED__LOCAL_PRESERVED
```

Regras para o legado:

1. não ampliar;
2. não utilizar em código novo;
3. não purgar antes de existir substituto local seguro e recuperável;
4. não tratar como arquitetura final;
5. remover dependências de código antes de remover os dados e as colunas.

## 8. Ordem de migração aprovada

1. construir e validar o armazenamento local seguro;
2. definir o `SOURCE_CONFIGURATION_VAULT` cifrado para `MANAGED` e `CUSTOMER_SOURCE_VAULT` cifrado para `SELF_SERVICE`;
3. impedir escritas remotas fora dos vaults privados e isolar fontes do cliente estritamente por `customerId`;
4. manter metadata pública e resolução de autorização sem plaintext;
5. integrar entrega autorizada do vault (`MANAGED` e `SELF_SERVICE_REMOTE`) e entrada local `SELF_SERVICE_LOCAL` ao `LocalSecureSourceStore`;
6. integrar o runtime ao `LocalSecureSourceStore`;
7. validar o endpoint fisicamente, em ciclo autorizado;
8. migrar/purgar somente o legado remoto fora do novo vault, em ciclo autorizado;
9. remover ou depreciar o schema obsoleto, somente após a migração segura.

A ordem preserva a configuração local válida antes de qualquer purge e separa claramente vault gerenciado de cofre de cliente self-service. Nenhuma etapa desta lista é executada pela simples leitura deste documento.

## 9. Checklist documental

```text
SOURCE_DATA_BOUNDARY_READ=SIM
BACKEND_CONTROL_PLANE_ONLY=SIM
REMOTE_SOURCE_SECRET_STORAGE=ENCRYPTED_PRIVATE_VAULTS_ONLY
REMOTE_ENCRYPTED_SOURCE_SECRET_STORAGE=SIM_FOR_VAULTS_ONLY
REMOTE_MANAGED_SOURCE_CONFIGURATION_ALLOWED=SIM
REMOTE_MANAGED_SOURCE_CONFIGURATION_ENCRYPTED=SIM
REMOTE_MANAGED_SOURCE_CONFIGURATION_CONTROL_PLANE_ONLY=SIM
REMOTE_SELF_SERVICE_SOURCE_CONFIGURATION=SIM_WITH_LICENSE_AND_DEVICE_AUTH
LOCAL_SELF_SERVICE_SOURCE_CONFIGURATION_PRESERVED=SIM
REMOTE_PLAYLIST_STORAGE=NAO
REMOTE_STREAM_URL_STORAGE=NAO
REMOTE_CATALOG_STORAGE=NAO
DEVICE_LOCAL_SOURCE_CONFIGURATION=SIM
DEVICE_DIRECT_SOURCE_FETCH=SIM
DEVICE_DIRECT_PLAYBACK=SIM
```

## 10. Override C11 para boundary de reveal

O texto histórico deste documento que proíbe reveal ao Manager permanece
registrado, mas está superseded somente pela emenda acima. O Manager comum,
usuários não-Master, clientes, dispositivos e endpoints públicos continuam
sem acesso a plaintext. A exceção exige autenticação Master, autorização
server-side, cofre criptografado em repouso e auditoria de cada reveal.

Qualquer mudança em source, Supabase, Manager, Control Plane, playback, catálogo ou search deve ler este boundary e preservar estas invariantes. Este documento não autoriza alterações em runtime, Android, migrations, schema remoto, dados remotos, dispositivos, playback, commit, push, PR ou merge.
