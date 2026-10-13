# C75 — Retirar comandos duplicados da prévia Live

2026-10-11. Pedido direto do usuário e confirmação continue; spec antes do
código. Workspace independente C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
origin esperado, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS,
Architecture, Execution, Source Data Boundary e Activation Lock lidos.
CURRENT_GATE=NONE, somente patch direto; NEXT_GATE_STARTED=NAO.
Dirty C11 acumulado preservado por baseline privada. Git commit/push/PR não
autorizados; sem backend, dados reais, env, instalação/reset ou novo Gate.

## Aceitação e escopo

Oito botões live-inline-actions são montados em todos os layouts, inclusive
TV. Retirar a faixa inteira da prévia no celular, tablet retrato/paisagem e
TV, usando as listas/abas já existentes para canais/categorias e seção EPG.
Fullscreen segue toque/confirmação do canal já selecionado, handlers intactos.
Player nativo em tela cheia mantém anterior/próximo, canais, categorias,
guia, favoritar/favoritos, play/pause, áudio/legendas e ajuste de imagem.
Nenhuma alteração no XML/Java/bridge/Media3/C9/PiP, source/metadata/catalog.

Patch mínimo: remover apenas JSX da faixa, helper adjacentAction que ficaria
sem consumidor e CSS exclusivo da faixa. openLivePanel permanece no guia EPG;
handleLiveAction/native listener/toggleFavorite/fullscreen permanecem.
Não alterar comportamento de retry nem diagnosticar speculative stream error.

Verificar browser com cliente/catálogo sintéticos, PHONE390x844/844x390,
TABLET800x1280/1280x800 e TV/UA Fire1280x720. Faixa ausente (sem esconder
controles focáveis por CSS), listas/abas/EPG alcançáveis, paginação63/105 e
último canal, fullscreen por confirmação/tap, eventos nativos/favoritos sem
duplicar player ou autorização. TS/build, suíte Live existente e lock antes/
depois; APK assinatura/package/assets conferidos. Dispositivo real pendente.

## Allowlist

- Esta spec e docs/evidence/C11_LIVE_PREVIEW_TOOLBAR_REMOVAL.md.
- docs/STATUS.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md, EVOLUTION_REPORT.md append.
- src/ui/pages/LiveTvPage.tsx somente JSX/helper especificados.
- src/ui/pages/LiveTvPage.css somente regras da faixa sem consumidores.
- Outputs usuais dist/Capacitor/tsbuildinfo/APK e helpers ignorados em
  tmp/c75-live-preview-toolbar. Testes existentes e demais patches intactos.
