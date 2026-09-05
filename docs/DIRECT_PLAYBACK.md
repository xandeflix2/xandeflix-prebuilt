# docs/DIRECT_PLAYBACK.md — Arquitetura e Contrato de Reprodução Direta (Gate G8)

> **Status**: Adjudicado Formalmente pelo Chat Mestre / Fechado (PASS)  
> **Ciclo**: `XANDEFLIX_PREBUILT_G8_POST_ADJUDICATION_CANONICALIZATION`  
> **Target**: Android TV / Fire TV / Android Native  
> **Princípio Central**: `PLAYBACK_CONNECTION = DEVICE_TO_SOURCE_DIRECT`

---

## 1. Objetivo

Estabelecer a fronteira canônica de reprodução de mídia para o ecossistema `XANDEFLIX_PREBUILT`, permitindo que o dispositivo Android do usuário consuma streams de vídeo diretamente da infraestrutura da fonte provedora (`Device → Source`), sem depender de relays, servidores proxy, backends intermediários ou exposição de segredos no catálogo.

---

## 2. Escopo do Gate G8

- **Incluído**:
  - Modelagem e separação estrita entre `StreamRef` (catálogo) e `RuntimeSourceContext` (memória).
  - Contrato de resolução direta (`StreamResolver` e `DirectStreamResolver`).
  - Geração de requisições transitórias (`ResolvedPlaybackRequest`).
  - Integração com player nativo Android via `AndroidX Media3 ExoPlayer` (`media3-exoplayer`, `media3-exoplayer-hls`, `media3-ui`).
  - Bridge Capacitor (`NativePlayerPlugin` e `NativePlayerClient`).
  - Fallback controlado para ambiente web (`NATIVE_PLAYER_UNAVAILABLE`).
  - Validação rigorosa de esquemas de URI e rejeição de userinfo credentials (`user:pass@`).
  - Sanitização de URIs e headers confidenciais em logs.
  - Acionamento das ações de playback nas telas de detalhe de Filme e Série.
  - Testes unitários Android e harness automatizado (`playback:check`).

- **Excluído**:
  - Homologação de conta/fonte real (`REAL_SOURCE_IMPLEMENTED = NAO`).
  - Atualização incremental de catálogo (Gate G9).
  - Assinatura criptográfica e empacotamento criptografado (Gate G10).
  - Armazenamento de segredos em cofre ou Supabase (fora de escopo).
  - Histórico persistido de reprodução / resume contínuo no disco (fora de escopo G8).

---

## 3. Arquitetura Device → Source

A topologia de rede para reprodução de mídia segue estritamente o princípio direto:

```
+-------------------+                    +-----------------------+
|  Android Device   |   HTTPS / Direct   |    Source Origin      |
|  (Media3 Player)  | =================> |  (Provider / CDN)     |
+-------------------+                    +-----------------------+
```

Em nenhuma hipótese o fluxo de mídia transita por:
- Supabase (Database, Storage ou Edge Functions);
- Vercel (Frontends ou Serverless API routes);
- Servidor central Xandeflix;
- Proxies ou retransmissores próprios.

---

## 4. Proibição Estrita de Proxy Central e Relays

Ficam terminantemente proibidos e auditados:
- `CENTRAL_STREAM_PROXY = PROHIBITED`
- `CENTRAL_VIDEO_RELAY = PROHIBITED`
- `CENTRAL_IPTV_STREAMING_BACKEND = PROHIBITED`
- `STREAM_RESOLVER_MEDIA_BYTES_HANDLED = 0`

O resolver apenas realiza transformação lógica de identificadores e metadados, manipulando rigorosamente **zero bytes** de áudio/vídeo.

---

## 5. Modelo do StreamRef (Isenção de Segredos)

No catálogo canônico (`PrebuiltCatalog` v1 estabelecido no Gate G2), a entidade `StreamRef` contém somente identificadores opacos e propriedades técnicas de contêiner:

```typescript
export interface StreamRef {
  id: string;                  // ex: "syn:stream:movie:1001"
  sourceItemId: string;        // ex: "1001"
  contentKind: ContentKind;    // "movie" | "series" | "episode"
  containerExtension?: string; // "m3u8", "mp4", etc.
  qualityLabel?: string;       // "1080p", "4K", etc.
}
```

O `StreamRef` **NUNCA** armazena:
- URLs completas ou parciais;
- Senhas ou usernames de contas;
- Tokens de sessão ou tokens JWT;
- Headers de autorização ou cookies.

---

## 6. RuntimeSourceContext

O contexto operacional da fonte existe **exclusivamente em memória volátil** no dispositivo durante a execução:

```typescript
export interface RuntimeSourceContext {
  readonly sourceId: string;
  readonly providerKind: SourceProviderKind;
  readonly baseUrl: string;
  readonly sessionMaterial?: Record<string, string>;
  readonly headers?: Record<string, string>;
  readonly expiresAt?: number; // epoch ms
}
```

Regras:
1. Não persistir no banco de dados SQLite, IndexedDB ou Storage local.
2. Não incluir em snapshots ou pacotes de provisioning (`.pkg`).
3. Não incluir nos índices invertidos de busca (`prebuilt-search.index.json`).

---

## 7. Provedores de Fonte (SourceProviderKind)

O contrato define suporte aos seguintes tipos de provedores:
- `SYNTHETIC_DIRECT`: Provedor sintético para testes automatizados e validação estrutural sem dependências externas.
- `FUTURE_XTREAM`: Estrutura reservada para fontes baseadas em API Xtream Codes (não implementado no G8).
- `FUTURE_GENERIC_HTTP`: Estrutura reservada para fontes diretas via HTTP/HLS estático (não implementado no G8).

---

## 8. Interface StreamResolver

```typescript
export interface StreamResolver {
  resolve(
    streamRef: StreamRef,
    runtimeSourceContext: RuntimeSourceContext,
    options?: ResolveOptions
  ): Promise<ResolvedPlaybackRequest>;
}
```

---

## 9. ResolvedPlaybackRequest

Objeto transitório gerado em tempo de execução para instruir o player nativo:

```typescript
export interface ResolvedPlaybackRequest {
  uri: string;
  streamRefId: string;
  contentKind: 'movie' | 'episode';
  title: string;
  providerKind: SourceProviderKind;
  headers?: Record<string, string>;
  mimeType?: string;
  startPositionMs?: number;
}
```

---

## 10. Política de Não Persistência

- `RESOLVED_PLAYBACK_REQUEST_PERSISTENCE = NONE`
- A URL resolvida e os headers da sessão não são gravados em disco, storage persistente ou logs legíveis.

---

## 11. Estratégia de Player Nativo Android

O target prioritário da experiência Xandeflix é a reprodução em hardware nativo Android (TV e dispositivos móveis). Players web HTML5 não oferecem suporte de baixo nível adequado a codecs de TV, aceleração por hardware homogênea e customização de data sources com headers HTTP em streams HLS.

---

## 12. AndroidX Media3 ExoPlayer

Adotado como o motor canônico de reprodução:
- `androidx.media3:media3-exoplayer:1.5.1`
- `androidx.media3:media3-exoplayer-hls:1.5.1`
- `androidx.media3:media3-ui:1.5.1`

Componentes:
- `NativePlayerActivity`: Activity encapsulada com `android:exported="false"`, tela cheia, `FLAG_KEEP_SCREEN_ON` e vinculação de `PlayerView`.
- `DefaultHttpDataSource.Factory`: Injeção dinâmica de headers da requisição sem expor valores.

---

## 13. Bridge Capacitor (`NativePlayerPlugin` e `NativePlayerClient`)

A comunicação entre a UI em React/Capacitor e o Android nativo ocorre via plugin dedicado:
- Método: `NativePlayer.play({ uri, title, mimeType, startPositionMs, headers })`.
- No Android nativo: Valida os parâmetros via `PlaybackIntentContract` e inicia a `NativePlayerActivity`.
- No navegador web puro: Retorna o estado controlado `NATIVE_PLAYER_UNAVAILABLE`.

---

## 14. Protocolos de Mídia Suportados

Baseline inicial do Gate G8:
- **HLS (HTTP Live Streaming)**: Contêiner `.m3u8` (`application/x-mpegURL`).
- **Progressive MP4**: Contêiner `.mp4` (`video/mp4`).
- DASH: Compatível com o motor Media3, porém não requerido como critério fechado do G8.

---

## 15. Lista de Esquemas Permitidos (URI Allowlist)

- `PLAYBACK_URI_ALLOWLIST = HTTPS_BASELINE`
- Esquemas aceitos: `https:` (e `http:` exclusivamente em testes sintéticos/locais controlados).
- Esquemas expressamente proibidos: `file:`, `content:`, `javascript:`, `data:`, `intent:`, `about:`, `blob:`.

---

## 16. Política de Headers em Reprodução

- Headers permitidos: `Authorization`, `User-Agent`, `Referer`, `Range`.
- `PLAYBACK_HEADERS_LOGGING = PROHIBITED`: Valores de cabeçalhos de autenticação ou cookies jamais são exibidos em logs ou relatórios.

---

## 17. Sanitização de URIs e Logs

O helper `sanitizePlaybackUriForLog(uri)` redige qualquer query string suspeita:
- Entrada: `https://source.domain/live/stream.m3u8?token=secret123&user=john`
- Saída: `https://source.domain/live/stream.m3u8?[QUERY_REDACTED]`

---

## 18. Ciclo de Vida do Player e Liberação de Recursos

Para evitar vazamentos de memória e manter o dispositivo estável:
- `PLAYER_SINGLE_INSTANCE_PER_ACTIVITY = SIM`: Uma única instância de `ExoPlayer` é criada por sessão.
- `PLAYER_RELEASE_ON_DESTROY = PASS`: O player é liberado incondicionalmente em `onDestroy()` através de `player.release(); player = null;`.
- `PLAYER_RELEASE_IDEMPOTENT = SIM`: Chamadas consecutivas de liberação são seguras.
- `onPause()` / `onStop()`: O player é pausado/parado para poupar bateria e decodificadores de hardware.

---

## 19. Navegação D-pad / Controle Remoto de TV

A interface de controle nativa (`androidx.media3.ui.PlayerView` com `app:use_controller="true"`) responde nativamente a:
- D-pad Center / Enter: Play / Pause.
- D-pad Left / Right: Seek retroceder / avançar.
- D-pad Back / Esc: Fecha o player e retorna à tela de detalhes anterior sem encerrar a aplicação.

---

## 20. Fluxo de Reprodução de Filme

1. Usuário clica em **"▶ Assistir"** na `MovieDetailPage`.
2. `PlaybackService.playMovie(movieId, readModel)` busca o filme no `CatalogReadModel`.
3. Extrai o primeiro `streamId` e obtém o `StreamRef` canônico.
4. `DirectStreamResolver` transforma o `StreamRef` e o `RuntimeSourceContext` em `ResolvedPlaybackRequest`.
5. `NativePlayerClient` despacha a requisição para o `NativePlayerPlugin`.
6. `NativePlayerActivity` exibe o vídeo em tela cheia no Android TV.

---

## 21. Fluxo de Reprodução de Episódio

1. Usuário seleciona o episódio na `SeriesDetailPage` e aciona **"▶ Assistir"**.
2. `PlaybackService.playEpisode(seriesId, episodeId, readModel)` localiza o episódio.
3. Extrai o `streamId` e obtém o `StreamRef` correspondente.
4. O stream é resolvido com título composto (`Série — EP X: Título`).
5. `NativePlayerActivity` é disparada com o stream do episódio.

---

## 22. Modelo de Estados e Erros Canônicos

Estados de Reprodução:
`IDLE`, `RESOLVING`, `READY_TO_START`, `OPENING_NATIVE_PLAYER`, `BUFFERING`, `PLAYING`, `PAUSED`, `ENDED`, `ERROR`, `UNAVAILABLE`.

Categorias de Erro:
`STREAM_REF_NOT_FOUND`, `SOURCE_CONTEXT_UNAVAILABLE`, `SOURCE_CONTEXT_EXPIRED`, `UNSUPPORTED_SCHEME`, `URL_USERINFO_CREDENTIALS_REJECTED`, `RESOLUTION_FAILED`, `PLAYER_UNAVAILABLE`, `PLAYER_INIT_FAILED`, `MEDIA_SOURCE_ERROR`, `PLAYBACK_ERROR`, `UNKNOWN`.

---

## 23. Fallback Web Controlado

Em plataformas web padrão onde o `NativePlayerPlugin` não existe:
- Retorno explícito: `NATIVE_PLAYER_UNAVAILABLE`.
- A UI exibe mensagem informativa sanitizada: *"Player nativo Android indisponível no navegador web."*
- Proibição de abertura automática de links em nova aba (`window.open`).
- Proibição de renderização de elemento `<video>` desautorizado.

---

## 24. Regras de Segurança

- Rejeição de `URL_USERINFO_CREDENTIALS`: URIs contendo `user:pass@host` disparam exceção imediata `URL_USERINFO_CREDENTIALS_REJECTED`.
- `ANDROID_CLEARTEXT_GLOBAL = NAO`: Não habilitado `usesCleartextTraffic="true"` globalmente no manifest.
- `NATIVE_PLAYER_ACTIVITY_EXPORTED = NAO`: Declarada com `android:exported="false"`.

---

## 25. Observabilidade e Logs Sanitizados

Os logs da aplicação registram apenas:
- ID da sessão de reprodução;
- ID do StreamRef;
- Tipo de provedor (`SYNTHETIC_DIRECT`);
- Esquema de protocolo;
- Categoria do erro em caso de falha.

---

## 26. Validação por Teste Sintético

O ambiente técnico do Gate G8 opera exclusivamente sobre dados sintéticos com o domínio fictício `https://media.example.invalid`. Nenhuma requisição externa para hosts públicos não controlados é obrigatória para a aprovação do Gate.

---

## 27. Limitações Técnicas do G8

- A reprodução física em tela física (Fire Stick / Smart TV) não faz parte deste gate técnico.
- Testes foram validados no harness de runtime e em testes unitários Android com Media3.

---

## 28. Status de Fonte Real

- `REAL_SOURCE_IMPLEMENTED = NAO`
- `REAL_SOURCE_AUTHENTICATED = NAO`
- `REAL_SOURCE_PLAYBACK_PROVEN = NAO`

A integração e homologação de contas e credenciais reais ocorrerá em ciclo posterior dedicado.

---

## 29. Status de Reprodução Física

- `PHYSICAL_MEDIA_PLAYING_PROVEN = NAO`
- `PHYSICAL_DEVICE_VALIDATION = NOT_REQUIRED_G8`

---

## 30. Transição Canônica G7 → G8 → G9

Com a fronteira de reprodução direta provada no G8, o repositório avança para o Gate G9 (`INCREMENTAL_UPDATE`), onde pacotes delta permitirão atualizar o catálogo local sem reimportação completa.

---

## 31. Decisões Arquiteturais Abertas (Mantidas Intencionalmente)

As seguintes decisões permanecem expressamente abertas:
1. `REAL_SOURCE_AUTH_STRATEGY`
2. `USER_SOURCE_BINDING`
3. `PACKAGE_SIGNING_STRATEGY`
4. `PACKAGE_ENCRYPTION`
5. `PLAYER_SECURE_FLAG_POLICY`
6. `PERSISTENT_PLAYBACK_PROGRESS`
7. `ARTWORK_CACHE_POLICY`
8. `FULL_TV_SPATIAL_NAVIGATION`
9. `PERFORMANCE_SLA`
10. `INCREMENTAL_UPDATE_STRATEGY`
11. `ROLLBACK_FULL`
12. `SNAPSHOT_RETENTION`

---

## 32. Critérios de Aceitação Técnicos

- [x] StreamRef permanece desacoplado de credenciais (`STREAM_REF_CREDENTIAL_FREE = PASS`).
- [x] RuntimeSourceContext isolado em memória (`SOURCE_RUNTIME_BOUNDARY = PASS`).
- [x] DirectStreamResolver implementado e testado (`VALID_SYNTHETIC_RESOLUTION = PASS`).
- [x] Failsafe para StreamRef desconhecido (`UNKNOWN_STREAM_REF_REJECTED = PASS`).
- [x] Failsafe para contexto expirado ou ausente (`EXPIRED_SOURCE_CONTEXT_REJECTED = PASS`).
- [x] Rejeição de esquemas perigosos e userinfo (`URL_USERINFO_CREDENTIALS_REJECTED = PASS`).
- [x] Ações de reprodução integradas na UI de Filme e Série (`MOVIE_PLAYBACK_FLOW = PASS`, `EPISODE_PLAYBACK_FLOW = PASS`).
- [x] Bridge Capacitor com fallback controlado na web (`WEB_NATIVE_PLAYER_UNAVAILABLE = PASS`).
- [x] Ausência de proxy ou backend central intermediário (`NO_CENTRAL_PROXY = PASS`).
- [x] Testes unitários Android com Media3 compilando e passando (`ANDROID_UNIT_TESTS = PASS`).
- [x] Build Android concluído com sucesso (`ANDROID_DEBUG_BUILD = PASS`).
- [x] Regressões de todos os Gates anteriores preservadas (G2, G3, G4, G5, G6, G7).
