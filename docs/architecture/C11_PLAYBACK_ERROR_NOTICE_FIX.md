# C11 — Erro de reprodução visível e sanitizado

## Autorização e preflight — 2026-10-04

Usuário autorizou explicitamente a correção específica para futuros erros de
reprodução mostrarem o motivo, sem alterar a ativação. Este ciclo local
`C11_PLAYBACK_ERROR_NOTICE_FIX` sucede o diagnóstico; supersede somente a antiga
restrição de não corrigir o player no ciclo de investigação. CURRENT_GATE=NONE,
nenhum novo Gate do roadmap, commit/push/PR/backend/instalação autorizados.

Workspace/top-level C11, origin esperado, main/ahead 2, HEAD
`f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`. AGENTS, Architecture, Execution,
Source Data Boundary e lock de ativação lidos. Baseline de 388 arquivos de
runtime/configuração/testes/APK capturada antes do patch; dirty preexistente
preservado. Build/sync/testes Android/APK local são validação/entrega do patch,
não autorização para instalar no aparelho ou alterar autoridade remota.

## História e requisitos (anteriores ao código)

Erro terminal Media3 -> payload resume sanitizado -> listener único em App ->
aviso acessível na tela de retorno + mesmo cleanup de sessão já existente.

1. Preservar `errorCode=NATIVE_ERROR`, posição, ended e contrato legado. Adicionar
   somente `errorCategory` em allowlist e `httpStatus` inteiro 400..599 quando
   a categoria for HTTP_ERROR. Nunca mensagem/stacktrace/URL/host/header/token.
2. Categorias permitidas: HTTP_ERROR, NETWORK_TIMEOUT, DECODER_ERROR,
   SOURCE_UNAVAILABLE, MEDIA_PARSER_FAILURE, MEDIA_ERROR, UNKNOWN. Qualquer
   entrada desconhecida vira UNKNOWN; status inválido é descartado. Não enviar
   detalhes de erro em Back/COMPLETION sem errorCode.
3. Gerar mensagens portuguesas fixas a partir desses dados: HTTP 401/403/404,
   demais 4xx/5xx, conexão, decoder, leitura/formato e genérico legado. Não
   confundir recusa da fonte com licença/ativação do aplicativo inválida.
4. Mostrar o aviso antes de aguardar liberação best-effort da sessão. Falha de
   cleanup não apaga o motivo nem expõe erro bruto; manter MEDIA_ERROR,
   COMPLETION e USER_EXIT no mesmo stopPlayback, sem novas chamadas remotas.
5. Aviso role=alert, texto seguro, visível também após rolagem na tela de
   retorno, botão Fechar aviso e limpeza na próxima reprodução (RESOLVING).
   Back normal e término não produzem falso erro.
6. Preservar fallback de candidatos, URLs/headers/codec/timeouts, finish e
   idempotência do evento terminal. Não corrigir cache de streams neste ciclo.
7. Não modificar identidade/chave/ativação/boot/storage/backup nem políticas
   de licença; executar lock oficial antes/depois, inclusive antes do APK.

## Allowlist mínima

- Este contrato e referência de sucessão em C11_NEW_DEVICE_ACTIVATION_LOCK.md.
- NativePlayerActivity.java e NativeAndroidPlayerPlugin.java, apenas detalhes
  sanitizados do evento terminal; novo teste Java NativePlaybackErrorNoticeTest.
- src/playback/native-android-player.bridge.ts (campos opcionais) e novo
  src/playback/native-playback-error-notice.ts (formatter/handler local).
- src/App.tsx (estado, listener e aviso), novo componente
  src/ui/components/PlaybackErrorNotice.tsx e CSS escopado em src/index.css.
- scripts/test-c11-playback-error-notice.mjs e fixtures locais
  scripts/playback-error-notice-fixture.html / .tsx, fora do bundle distribuído.
- docs/evidence/C11_PLAYBACK_ERROR_NOTICE_FIX.md, STATUS, EVOLUTION_REPORT,
  ERRORS_AND_BLOCKERS; outputs usuais de build web/Capacitor/Gradle e APK raiz.
- Cópia recuperável do APK anterior: Xandeflix-v1.0.0-standalone-before-playback-error-fix.apk.

Não alterar package/dependências, PlaybackService, autoridade C9, fonte/catálogo,
cache, identidade, ativação, manifests de backup, package ou assinatura.

## Aceitação e validação

- Lock antes/depois: 49 casos + controles negativos, sem redução de critérios.
- Testes nativos: payload de HTTP/categorias/legado, clamp, rejeição de dados
  desconhecidos/sensíveis, ausência de erro em Back/COMPLETION; suites existentes.
- Testes JS: mensagens determinísticas e sanitizadas, callback antes de cleanup,
  cleanup rejeitado/pendente, razões de término, reentrada/limpeza e wiring App.
- Testes de sessão C9 e VOD direto existentes continuam verdes.
- UI real via fixture isolada: HTTP404/decoder/genérico, dismiss, nova tentativa,
  Back/COMPLETION, mobile/desktop, sem backend real. CLI agent-browser ausente
  no PATH: usar navegador disponível como fallback documentado das skills.
- Build web, cap sync android, testDebugUnitTest/assembleDebug; conferir package,
  assinatura, assets e APK. Guardar APK anterior antes da substituição.
- Conferir hashes dos arquivos fora da allowlist e diff scoped. Sem Git writes.

Testes simulam erros; não forçar indisponibilidade de fonte real nem instalar
APK sem nova autorização. Esta melhoria mostra o motivo; não torna reproduzível
conteúdo indisponível nem resolve a causa dos HTTP404 históricos não isolados.
