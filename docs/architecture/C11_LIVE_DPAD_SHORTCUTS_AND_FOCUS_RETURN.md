# C114 — setas no Live fullscreen e retorno ao canal ativo

## Autorização/proveniência — 2026-10-15

Usuário relata foco perdido ao sair do Live fullscreen aberto por segundo
clique e solicita setas cima/baixo para volume, esquerda/direita para canal
anterior/próximo em controles sem CH+/−. Implementação Android/Fire atual;
remoto de outra marca via Android/CEC depende de enviar os mesmos eventos.
Não declarar suporte nativo Samsung Tizen/LG webOS por este patch Android.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Preflight C11-main/main/origin
canônico, HEAD0f68f169f7728fae17c8311832b7643629e97a02. AGENTS/Architecture/
Execution/Source Boundary/Activation Lock/C73/C112/C113 lidos. Baseline privado
tmp/c114-live-dpad-focus/baseline.json; refinamentos anteriores preservados.
Sem Git/backend/reset/instalação; pedido anterior de tela desconectada foi
apenas análise e não pertence a esta implementação.

## Especificação anterior ao código

1. Live fullscreen ativo, fora de PiP e com controles ocultos: esquerda emite
   previous, direita next; cima aumenta volume do player5%, baixo diminui5%,
   faixa0–100%. Volume do app não equivale a controlar amplificador/TV por IR.
   Indicação curta do volume, sem abrir menu e alterar o modo das próximas
   setas. Central/Enter abre controles; com menu/painel visível, setas mantêm
   foco/navegação. CH+/− explícitos C112 continuam válidos em inline/fullscreen.
2. Uma ação por pressão inicial, sem cascata por repeat/UP, incluindo se o
   menu ficar visível durante o mesmo pressionamento. Busy/disposing/dialog
   impedem atalhos. Inline não ganha atalhos das setas. Back/VOD/PiP/volume
   físico não mudam. Canal segue fluxo JS/C9, ordem e limites da categoria,
   sem streams/pre-buffer extras (fonte permite somente uma conexão).
3. Ao sair do fullscreen para a lista, devolver foco nativo ao WebView e foco
   DOM ao botão do canal ativo. Se mudou canal no fullscreen, usar o atual,
   não o antigo. Resolver página local bounded existente quando fora da janela;
   abrir categoria do ativo/limpar filtro se necessário, usar pedido explícito
   de scroll/foco. Mesmo índice/scroll deve receber foco novamente.
4. Guardar previewId, canal, geração, desmontagem e novas entradas fullscreen;
   abortar resposta tardia sem roubar foco após sair da página ou navegar para
   outra categoria/filtro. Não reiniciar player/C9 por foco/geometria. Eventos
   repetidos de fullscreen false não reabrem/restauram lista indevidamente.
5. Manter seleção/rolagem contínua bounded C105; nenhuma hidratação geral,
   cache novo, busca remota ou alteração de manifesto/catálogo/identidade.

## Allowlist estrita

- android/.../player/LivePlayerControls.java: atalhos, volume local/OSD limitado,
  descarte da pressão/OSD no fechamento, mesmos emit/contexto/menus.
- android/.../player/NativeAndroidPlayerPlugin.java: devolver foco ao WebView
  na saída fullscreen; manter delegação/preview/C9 consolidados.
- src/ui/pages/LiveTvPage.tsx: pedido/guarda de retorno ao canal atual.
- src/ui/components/ContinuousLiveChannelList.tsx: foco também em novo pedido
  no mesmo índice/scroll, sem alterar limites/carga/seleção.
- scripts/test-c112-live-channel-keys.mjs: adaptar harness aos novos imports/
  métodos, preservar casos antigos e acrescentar setas/volume/menus/pressão.
- scripts/test-c114-live-focus-return.mjs (novo): callbacks reais e browser,
  portas de catálogo/native isoladas, foco do ativo e cancelamento.
- Android LivePlayerControlsTest.java se necessário; este contrato;
  docs/evidence/C11_LIVE_DPAD_SHORTCUTS_AND_FOCUS_RETURN.md;
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md; tmp/c114-live-dpad-focus
  e saídas usuais ignoradas de build/sync/Gradle/APK. Sem demais arquivos.

## Aceitação/entrega

TV nativo (uiMode TELEVISION, incluindo Fire) entra em fullscreen com menu
oculto para permitir atalhos imediatos; central revela controles. Dispositivos
de toque mantêm apresentação inicial dos controles. Em TV, autoShow permanece
desligado para buffering/troca de canal não abrir menu sobre os atalhos.
Allowlist do plugin
inclui somente essa decisão de exibição, além do retorno de foco acima.

Testar setas com menu oculto/visível, inline/fullscreen/PiP/inativo, busy,
volume em limites/sem player, UP/repeat, central/Back e CH+/−. Retorno real
React/lista ao canal clicado e ao novo após troca, página distante, mesmo
scroll, stale/unmount/rota/geração sem foco tardio. Regressões C105/C106/C73,
Java, TypeScript/build/lock26+27+9 e APK/assinatura/assets PASS. Nenhuma QA
física, volume de TV/IR ou latência garantidos por fixture. APK C114 de teste
manual; não instalar automaticamente/publicar updater/commit/push/novo Gate.
