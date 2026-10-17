# C114 — setas no Live fullscreen e retorno ao canal ativo

Data: 2026-10-15. Requisito/allowlist anterior ao código em
`docs/architecture/C11_LIVE_DPAD_SHORTCUTS_AND_FOCUS_RETURN.md`.

## Preflight e proveniência

Workspace/top-level: `C:/Xandeflix/xandeflix-prebuilt-c11-main`, clone C11
independente ativo segundo AGENTS/contratos locais. Remote origin:
`https://github.com/xandeflix2/xandeflix-prebuilt.git`, branch main,
HEAD `0f68f169f7728fae17c8311832b7643629e97a02`. Estado dirty C107–C113
conhecido preservado por baseline privado de 1.027 arquivos em
`tmp/c114-live-dpad-focus/baseline.json`. AGENTS, Architecture/Execution,
Source Data Boundary, Activation Lock, C73 e ciclos C112/C113 lidos.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C114; NEXT_GATE_STARTED=NAO.
Git commit/push/PR, backend, reset e instalação não autorizados neste ciclo.

## Resultado implementado

- Android Live fullscreen com controles ocultos: esquerda/anterior,
  direita/próximo, cima/baixo ajustam o ganho do player em 5%, limitado a
  0–100%. Uma ação por DOWN inicial; repeat/UP consumidos sem ação duplicada.
  Toast único informa o volume sem abrir menu; cancelado ao sair/descartar.
- Central/Enter revela os controles. Com menu/painel aberto, as setas
  continuam navegando por foco. Android TV/Fire (uiMode TELEVISION) entram
  com controles ocultos; autoShow desligado evita abrir menu no buffering.
  Dispositivos de toque mantêm a apresentação inicial dos controles.
- Back devolve foco nativo ao WebView e foco DOM ao canal atualmente ativo,
  inclusive após mudar de canal em fullscreen ou sair da janela virtualizada.
  Pedido novo no mesmo índice/scroll também restaura foco. Filtro/rolagem
  existentes são preservados quando o ativo está visível; somente quando
  necessário resolve a página local do ativo e retorna à sua categoria.
- Guards de previewId, canal, snapshot, filtro/categoria, montagem, saída e
  fullscreen descartam respostas tardias. Evento false repetido não rouba foco.
  Foco não reinicia player nem sessão C9; busca local e DOM permanecem limitados.
- CH+/− C112, Back, inline, PiP, VOD e seletor removido apenas do Live C113
  preservados. Sem novo stream/pre-buffer: fonte informada permite uma conexão.

Volume implementado é ganho de áudio do aplicativo, não comando IR/volume
físico da TV. API de referência: [Media3 Player.setVolume](https://developer.android.com/reference/androidx/media3/common/Player#setVolume(float)).
Samsung com entrada Android/CEC depende dos eventos enviados pelo controle;
este APK não certifica app nativo Tizen/webOS nem todos os modelos de remoto.

## Validação

| Verificação | Resultado |
| --- | --- |
| Harness C112 com corpos Java reais e constantes SDK reais | PASS: CH, setas ocultas/visíveis, central, volume/limites, busy/dialog/disposing, repeat/UP, inline/PiP/inativo/Back |
| C114 React LiveTvPage + lista virtual real em Chrome isolado | 10 grupos PASS |
| C105 rolagem contínua | 6 grupos PASS |
| C106 saída de preview/rota | 8 grupos PASS |
| C73 controles Live | 7 grupos PASS |
| JUnit Android: controles, cast, tap, awake, Activity, buffer | 37 testes/6 classes PASS |
| TypeScript e build Vite final | PASS |
| Activation/catalog lock | 26 + 27 + 9 PASS antes/depois e antes de empacotar |
| Capacitor sync e Gradle assembleDebug final | PASS |
| Assinatura, package, versão, assets APK | PASS: 7 arquivos iguais ao dist; certificado igual a C113 |

Os 10 grupos C114 verificam: segundo clique/Back sem reinício de player/C9;
mesmo índice/scroll; preservação de filtro visível; preview antigo ignorado;
troca fullscreen retorna ao novo canal; canal fora da janela com DOM ≤48;
false duplicado; filtro alterado durante lookup; geração alterada; desmontagem
com lookup pendente. Catálogo/native/C9 são portas simuladas; nenhum backend,
provedor de vídeo ou hardware real foi exercitado por esses testes.

Primeiro ensaio C114 falhou por assinatura incorreta de um mock
`setNativeLiveControls`; fixture corrigida para `(previewId, context)` sem
relaxar critérios, seguida de aprovação dos 10 grupos. Avisos prévios do
Vite (chunk/imports) e Gradle flatDir permanecem, sem falha de compilação.

Revisão React: hooks incondicionais, listener com cleanup, atualização
funcional de nonce, guards/abort de operações assíncronas e dependências
primitivas; sem hidratar catálogo inteiro, adicionar biblioteca ou ampliar
janela/páginas da lista. Alterações deste ciclo limitadas à allowlist; auditoria
privada em `tmp/c114-live-dpad-focus/audit.json` compara hashes do baseline.

## Artefato e limites

APK local: `tmp/c114-live-dpad-focus/Xandeflix-v1.0.19-C114.apk`.
Package `com.xandeflix.prebuilt`; versionCode19/name1.0.19, minSDK23/target35.
11.445.995 bytes, SHA-256:
`5472333cd575042e56bfebc3b376d64da6fc4885ec338c7edd4298e1e2d61325`.
Assets de produção HTTPS, sem dev server; C113 preservado byte a byte.
Mesma versão Android para teste local, sem publicação no updater.

APK não instalado neste ciclo. QA com controle físico Fire Stick, audibilidade
do volume e comportamento de controles de outras marcas permanecem pendentes;
testes automatizados não certificam latência de troca ou fonte remota.
Pedido anterior de tela de dispositivo desconectado permanece apenas análise,
fora deste patch. Sem Git/backend/reset ou início de próximo Gate.
