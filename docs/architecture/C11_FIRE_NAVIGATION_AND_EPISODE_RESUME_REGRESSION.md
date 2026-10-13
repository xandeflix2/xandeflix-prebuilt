# C11 — Regressão de navegação e retomada de episódio no Fire — C69

2026-10-10. Pedido explícito: investigar/corrigir lentidão de D-pad, detalhes
de série demorados e episódio com progresso que não abre após C68/build13.
Preflight read-only: clone C11-main, origin esperado, main,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Boundary e activation lock lidos. Estado dirty C11 acumulado preservado;
baseline hash antes de código/helpers. CURRENT_GATE=NONE; ciclo local pedido,
NEXT_GATE_STARTED=NAO. Nenhum Git write, backend/env/identidade/source/reset.

## Investigação e aceitação antes do código

1. Medir Fire1 disponível sem interromper player/outra aplicação. Observar
   janela/processo/memória e WebView da aplicação; capturar somente diagnóstico
   sanitizado publicável. Logs/IDs/progresso/source permanecem privados ignorados.
2. Medir keydown→focus/render e long tasks; distinguir atraso no dispositivo,
   React/repaint/focus, hidratação de série e sequência nova C68. Inspecionar
   primeiro bloqueio antes de propor patch; nenhuma otimização especulativa.
3. Reproduzir retomada pelo botão Continuar com autorização/resolver reais e
   conteúdo identificado pelo usuário ou pela tela. Ler posição/erro e tempos
   por fase sem revelar URL/headers. Não semear catálogo/fonte/licença nem
   tratar fixture/mock como certificação da fonte comercial.
4. Patch mínimo nos gargalos comprovados. Preservar avanço automático,
   próxima temporada, picker, buffer, PiP, foco neon/enquadramento, histórico,
   adulto/C9/revogação. Cache limitado por geração e série ativa quando cabível;
   nenhuma carga/reordenação global durante navegação ou abertura de episódio.
5. Testes de regressão que reproduzam o defeito, tipo/build/native/lock conforme
   arquivos alterados. Comparação empírica antes/depois não constitui SLA.
   Retomada deve abrir na posição gravada; D-pad deve manter todos os sentidos.
6. APK final cumulativo versionCode14 ou seguinte em diagnóstico se necessário;
   mesmo package/cert/standalone. Instalação-r somente Fire1 autorizada neste
   fluxo, quando próprio app estiver disponível sem reprodução ativa. Comparar
   snapshot privado/firstInstallTime/APK antes/depois. Não atualizar outros.
7. Evidência final distingue falhas atuais, hipótese, fixture e verificação real.
   Latest regression wins; não declarar fonte/retomada física validada sem teste.

## Allowlist estrita inicial

- Este plano; docs/evidence/C11_FIRE_NAVIGATION_AND_EPISODE_RESUME_REGRESSION.md;
  append C69 docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md e
  docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md.
- src/playback/{playback.service.ts,episode-sequence.ts,watch-history.ts,
  native-android-player.bridge.ts}; src/catalog/catalog-read-model.ts.
- src/ui/pages/SeriesDetailPage.tsx; src/ui/hooks/useDpadNavigation.ts;
  src/index.css somente paint/foco Fire comprovadamente relacionados.
- android/app/src/main/java/com/xandeflix/prebuilt/player/
  {NativePlayerActivity.java,NativeAndroidPlayerPlugin.java,PlayerControls.java}.
- Testes relacionados em scripts/test-c11-fire-navigation-resume.mjs e
  scripts/test-c11-series-player-continuity.mjs (não relaxar expectativas);
  NativePlayerActivityTest.java/NativeAndroidPlayerPluginTest.java se necessário.
- android/app/build.gradle somente versionCode; tsconfig.tsbuildinfo;
  saídas ignoradas habituais build/sync/APK; helpers/evidência privados em
  tmp/c11-fire-navigation-resume-20261010.

Se diagnóstico exigir outro arquivo funcional, registrar emenda específica
antes de código. Não refatorar nem restaurar estado dirty preexistente.
