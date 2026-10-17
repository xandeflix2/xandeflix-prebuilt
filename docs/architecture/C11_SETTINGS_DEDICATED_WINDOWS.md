# C140 - janelas dedicadas nas configuracoes - 2026-10-17

## Pedido, preflight e proveniencia

Usuario substitui a expansao C138 por janela dedicada ao acionar cada card.
Manter cinco resumos compactos e apresentar detalhes/acoes em dialog separado,
sem dropdown/accordion. Pedido atual autoriza alteracao UI e build verificavel;
nao solicita novo APK/install. APK1.0.25 ja instalado no Fire fica preservado.

Preflight read-only: clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Estado dirty C133-C139 conhecido;
auditoria C139 PASS antes deste ciclo. AGENTS/Architecture/Execution,
Activation Lock/Source Boundary e specs UI anteriores lidos. Baseline de hashes
e copias dos arquivos/memorias em tmp/c140-settings-windows antes desta spec.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/install/reset.

## Especificacao anterior ao codigo

- Substituir details/summary por botao de card e dialog HTML showModal, um
  por opcao, com titulo, Fechar e conteudo interno atual. Detalhes nao expandem
  a grade. Janela responsiva, rolagem interna e foco visivel no celular/TV.
- Manter filhos/handlers montados, incluindo operacoes de atualizacao de
  fonte/app em andamento. Abrir/fechar janela nao modifica dados, PIN ou fonte.
- Focar primeira acao disponivel (ou Fechar), conter Tab e D-pad na janela,
  ignorar botoes desabilitados/ocultos e devolver foco ao card ao fechar.
  Escape/Backspace fora de campo e Back Android fecham somente a janela.
  Cleanup deve remover listeners e fechar dialog ao sair da pagina.
- Antes de abrir destino parental/ativacao/area18+/seletor de dispositivo,
  fechar janela atual e executar o mesmo callback existente, sem modais
  sobrepostos ou foco retornando indevidamente sobre outro dialog.
- data-settings-modal separado de data-detail-modal: fonte continua atualizavel
  nas configuracoes. Preservar integralmente guardas atuais de playback/Cast/
  offline/parental/detalhes e canPromote; nao rotular janela de fonte como
  modal de conteudo que bloquearia sua propria atualizacao.
- App.handleBack recebe somente fechamento antecipado de settings-modal;
  demais eventos/rotas/back/autoridade intactos. Hook global D-pad inalterado;
  teclado local interceptado somente enquanto esta janela for a ativa.

## Allowlist estrita e verificacao

src/ui/pages/SettingsPage.tsx e SettingsPage.css;
src/ui/settings/settings-window.ts (lifecycle/teclado local);
src/App.tsx (apenas branch de fechamento do dialog de configuracoes);
scripts/test-c140-settings-window.mjs (portas DOM sinteticas de foco/lifecycle);
este documento e docs/evidence/C11_SETTINGS_DEDICATED_WINDOWS.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs privados tmp/c140-settings-windows e saidas usuais de build.

Lock antes/depois, typecheck/build web e padrao; regressao de fonte ativa,
teste significativo de abertura/foco/teclado/cleanup/restauracao e ausencia de
interferencia com outro dialog. Comparacao por hashes preserva servicos,
source/catalog/search/playback/parental/Android e APK C139. Nenhuma dependencia
nova nem relaxamento de testes. CUA para QA real se houver superficie; caso
indisponivel declarar limite sem alternativa de automacao da aba real.
