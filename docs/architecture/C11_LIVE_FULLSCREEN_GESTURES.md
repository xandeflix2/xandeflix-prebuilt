# C11 — Tela cheia por confirmação do canal e toque na prévia

## Autoridade e preflight — 2026-10-04

Usuário pediu acionar fullscreen ao confirmar novamente o canal selecionado;
em tablet também por um toque na prévia inline. Continuação local de Live para
Fire/tablet, CURRENT_GATE=NONE, nenhum próximo Gate ou performance 60s.
Esta especificação sucede somente restrições de não alterar handlers/native
das etapas de apresentação anteriores; não muda ativação/source/C9/autoridade.

Workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, main/ahead 2, HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS, Architecture/Execution/Source
Data Boundary, Activation Lock, sidebar e preview lidos. 401 hashes coincidem
com última entrega, dirty conhecido preservado. Git/backend/reset/outros alvos
não autorizados. Lock anterior ao patch obrigatório.

## Especificação anterior ao código/testes

1. Na lista não-mobile-tab, clicar canal diferente continua seleção/preview
   inline. Confirmar canal já selecionado e com preview pronto aciona o MESMO
   handleNativeLivePlayback. É confirmação sequencial, não dblclick cronometrado.
   Auto-seleção inicial continua; confirmar o canal já em exibição pode expandir.
   Sem preview pronto não expandir canal antigo nem gerar falsa falha de licença.
   Smartphone com tabs mantém seleção/tab atual; botão existente permanece como
   alternativa acessível, não removido por inferência.
2. Native PlayerView sobrepõe WebView. Tablet Android identificado apenas por
   smallestScreenWidthDp >=600, excluindo UI_MODE_TYPE_TELEVISION; nenhuma
   identidade/licença. Só nesse dispositivo/kind live, GestureDetector usa
   onDown/onSingleTapUp; não expande por arraste/long press/multitouch.
   Toque inline emite nativePreviewTap contendo APENAS previewId atual.
   React aceita evento somente com previewId correspondente ao preview pronto
   e canal atual; chama o mesmo handler. Não abre fullscreen diretamente em Java.
   Em fullscreen listener retorna false para preservar controles anteriores.
3. Handler bloqueia comandos concorrentes do mesmo preview e descarta resultado
   assíncrono stale após troca/cleanup. Nenhum novo MediaItem/ExoPlayer/Activity,
   acquireSession/source lookup; promoção/Back/geometria existentes preservados.
   Listener de tap com cleanup/disposed, sem retenção de URL/token/catálogo.
   Estado fullscreen exposto apenas como atributo booleano DOM para confirmação.
4. Categorias/canais/menu/layout/EPG/retry/paginação/C9/erro de reprodução,
   source/storage/ativação/backup/HTTPS/config/dependências fora do patch.

## Allowlist estrita

- src/ui/pages/LiveTvPage.tsx: handler de confirmação, lock/stale do fullscreen,
  listener de nativePreviewTap e atributo booleano da superfície; nada além.
- src/playback/native-android-player.bridge.ts: tipo/overload e wrapper do novo
  evento, preservando todos os métodos e contratos anteriores.
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java:
  imports padrão, política pura de tablet e listener GestureDetector/evento
  sanitizado no createPreviewView; enter/exit/start/release/media/session intactos.
- android/app/src/test/java/com/xandeflix/prebuilt/player/NativeLivePreviewTapTest.java:
  política tablet/TV/phone e allowlist de payload sem Android runtime.
- scripts/test-c11-landscape-navigation-browser.mjs: adapters isolados de preview/
  C9 para modo novo de interação, asserts de seleção/confirmação/IPC/Back/concorrência/
  pending/stale/erro/deny/cleanup, preservar modo/matriz de layout anteriores.
- Este contrato, referências em preview/lock, nova evidência
  docs/evidence/C11_LIVE_FULLSCREEN_GESTURES.md, STATUS/EVOLUTION/ERRORS.
- Build/sync/Gradle/APK normal e backup recuperável novo
  Xandeflix-v1.0.0-standalone-before-live-fullscreen-gestures.apk do hash
  3B3673C8ED5D0F54DB802E1F86E0B3D3B6D6D23A92C30A040188406590A75E07.
- Artefatos sintéticos/sanitizados e probes próprios em tmp/c11-side-navigation.

## Aceitação e entrega

História: confirmar canal/tap tablet -> mesmo handler -> bridge fullscreen do
preview autorizado existente -> mesmo PlayerView; Back restaura inline.
Nenhuma API/env/data boundary nova. Skills browser/verify/verification usando
harness Chrome/CDP isolado porque CLI ausente, gut-check imediato. Adapters
sintéticos sem backend/player/rede real; assert nada de acquire/start extra na
expansão, eventos stale ignorados e disposed limpo; fixtures TSX preservadas.
Repetir matriz layout existente, lock antes/depois/prebuild, guards C9/VOD/
Live/notice/bridge, build/assets/package/assinatura e Java unit tests.
Fora da allowlist hashes exatos; nenhum refactor/CSS/busca/App/ativação.

Entrega autorizada dentro da continuação Fire/tablet: update -r Fire AFTSSS
192.168.3.104:5555 primeiro, Samsung SM-X610 RX2X301Q3KY depois. Mesma assinatura/
package com.xandeflix.prebuilt, comparar quatro privados e files/prebuilt em RAM
antes/depois, sem publicar valores/hashes privados. Nenhum clear/uninstall/reset.
Probes funcionais podem confirmar SOMENTE o canal ativo já em exibição pela UI,
sem fonte/gestor/novos conteúdos: Enter/click no ativo, Back; no Samsung tap
nativo no centro da prévia e Back. Verificar estado booleano/retorno/menu/PID;
nenhuma captura de mídia, URL, chave ou console/rede brutos. Sem alteração
persistente da orientação. Falha/preview indisponível registra limite, não PASS.
Próximo Gate e 60s não iniciados. Nenhuma promessa universal de codec/playback.

Referências primárias: Android GestureDetector.SimpleOnGestureListener
https://developer.android.com/reference/android/view/GestureDetector.SimpleOnGestureListener
e Configuration.smallestScreenWidthDp
https://developer.android.com/reference/android/content/res/Configuration .

## Emenda anterior ao patch — rolagem independente das colunas

Usuário acrescentou que deslizar informações abaixo da prévia move a página
inteira/categorias/canais. Corrigir somente modo lateral em paisagem: Shell
ganha classe derivada de currentView=live; CSS limita esse Shell à viewport,
app-content/raiz/flex row com min-height:0, listas e prévia overflow:auto e
overscroll-behavior:contain. Rodapé/banner permanecem na árvore/flex normal;
sem position:fixed cobrindo alertas, sem travar body/global/Home, sem listeners
wheel/touch ou alteração de serviços. Classes explícitas em raiz/row/colunas/
listas Live; cellphone/retrato e outras páginas mantêm regras anteriores.

Allowlist adicional: src/ui/components/AppShell.tsx SOMENTE classe da rota;
src/ui/pages/LiveTvPage.tsx classes de scroll; src/index.css SOMENTE novo bloco
escopado. Teste browser acrescenta wheel real nas três colunas, preenchimento
sintético só DOM do fixture, prova window/header/colunas imóveis e scrollTop
independente, incluindo tentativa no limite. Controle negativo antes do CSS
deve reproduzir scroll externo. Repetir 53 checks/matriz, interação/lock/build.
Skill React aplicada aos dois TSX: hooks/deps/cleanup/a11y/refs/sem IO novo,
nenhum refactor decorrente do checklist. Confirmação Samsung pode deslizar
somente abaixo da superfície, comparando bounds/window/PID, sem capturar mídia.

## Emenda anterior ao patch — retirar ação redundante em paisagem

Após confirmação física dos gestos, usuário pediu retirar Player Nativo da
tela Live. No recorte vigente Fire/tablet em paisagem com menu lateral, ocultar
todo live-preview-controls via display:none: sem botão visível, espaço vazio
ou alvo de foco. DOM/handler existentes permanecem para celular e retrato;
não retirar o único controle original desses modos por inferência. Confirmação
do canal e toque nativo no tablet continuam exatamente os mesmos.

Allowlist desta emenda: só bloco CSS de live-preview-controls e asserts do
teste de browser já autorizado, este documento/evidência/STATUS/EVOLUTION_REPORT/
ERRORS_AND_BLOCKERS. Nenhuma nova mudança TSX/Java/bridge, nem fonte/ativação.
Matriz exige zero controles nativos visíveis/focáveis no menu lateral,
programação após card sem botão/gap, controle original visível em celular e
retrato/rotação. Guard do botão só pode ser exercido onde continua visível.
Repetir interações sem botão, rolagem, lock/prebuild/build/assinatura/assets.
Novo backup recuperável antes da emenda:
Xandeflix-v1.0.0-standalone-before-live-native-button-removal.apk,
SHA-256 9B4A4932A541E710DFD57BFDA0C079F0CB9EC54212EE8C99AE0DAD908A0D00AD.
Reinstalar novo APK -r primeiro Fire, depois Samsung; mesmos checks privados
em RAM e confirmação física de ausência do botão/gestos/Back/rolagem. Resultado
intermediário 9B4A... não é o APK final desta emenda; manter evidência histórica.

## Sucessão — fundo opaco em tela cheia

Usuário reportou header/rodapé vazando fora do vídeo no tablet em fullscreen.
Correção nativa mínima especificada antes do código em
[C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP](C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP.md).
Sucede apenas restrição anterior de manter enter/exit byte-idênticos: aplicar
preto ao expandir e restaurar transparência ao sair. Gestos/handler/C9/player/
FIT/inline/ativação permanecem; build/update in-place dos mesmos dois alvos,
sem reset/Git/backend/próximo Gate. Confirmação visual limitada a faixas
externas comprovadas pela geometria nativa, sem gravar mídia integral.

## Sucessão — limpeza e prévia permanente mobile, 2026-10-05

Pedido atual sucede somente tabs/layout mobile e duplicação do Back global,
conforme [C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW](C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).
Preserva o player/C9/gestos/ativação e o layout Fire/tablet; remove versão visual
em todos os layouts, não os metadados nem estado de sincronização.
