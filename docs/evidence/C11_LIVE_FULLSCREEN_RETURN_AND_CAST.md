# C11 — retorno Live fullscreen, Cast e guia — evidência 2026-10-07

Preflight read-only: workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, .git independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, originhttps://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS/Architecture/Execution/Source Data Boundary/lock lidos. Baseline669 e dirty anteriores preservados. Pedidos explícitos UI/EPG/correção fullscreen e update-r nos três alvos autorizados. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados nem executados. Sem edição do workspace histórico/projeto original, backend, credenciais, identidade, C9 ou catálogo.

## Problema e correção

Relato durante QA: Cast ficava sobre vídeo em tela cheia, preview retornava
fora da posição até tocar na tela, guia aberto deixava vazio entre vídeo e
painel. LATEST_REGRESSION_WINS invalidou a conclusão intermediária.

No mesmo PlayerView/ExoPlayer, o ImageButton Cast pertence ao exo_controller.
Seu alpha e sua visibilidade acompanham exo_controls_background no OnPreDraw
da View ativa. Isso inclui fade e a fase de barra parcial; VISIBLE genérico
ou isFullyVisible sozinho não representa a fase visual dos controles.
Filho INVISIBLE conserva a geometria; apenas propriedades diferentes são
alteradas. Callback ignora View antiga e é removido antes de liberar. Sem
polling/timer de Cast, sem novos streams/sessões/SDK/instrumentação.
Política permanece fullscreen&&!PiP. Entrada configura clickable=true,
controllerAutoShow e timeout3000ms; saída restaura clickable=false e oculta
controles/ícone. Toque reapresenta ambos, com a animação normal Media3.
As tentativas intermediárias com listener e pertencimento isolado foram
substituídas após falhas na repetição; somente capturas finais contam como PASS.

Últimos bounds inline são atualizados no plugin; saída pede orientação antes
do evento para React. LiveTvPage realinha em frame e retries limitados80/250/
600ms, no retorno fullscreen, resize/orientação/viewport/scroll/visibilidade.
ResizeObserver/listeners/timers têm cleanup e não atualizam bounds fullscreen.

Guia usa top relativo ao final do preview e bottom0, em CSS pixels, em lugar
de altura congelada. Medição ao abrir, ResizeObserver/viewport/orientação e
retries limitados cobrem retorno e escala. Nenhum toque para corrigir geometria
é necessário. Barra AO VIVO permanece acima do guia.

## Evidência física e de layout

Browser: dois ciclos390×844→844×390→390×844 e escala0,85→1. Gap máximo
0.266px;
bottom do guia coincidiu com página. Quatro larguras e estados do guia foram
revalidados após o patch. Unit tests2 novos de política Cast somados aos122
anteriores:124/0falhas/0erros. Referência primária Media3 1.5.1 no contrato.

S24: dois ciclos reais de promoção/rotação, timeout/toque e Back. Capturas
imediatas depois do toque inspecionadas visualmente mostram controles e Cast
juntos; hierarquia UIAutomator depois do timeout mostra0 ImageButton Cast.
UIAutomator espera idle e às vezes só retorna após o timeout, portanto não
foi usado para negar controles que estavam visíveis na captura imediata.
O Cast virtual do Header (android.widget.Button) foi separado do ImageButton
nativo. Nenhuma alegação de receiver Cast foi feita.

Após Back, sem toque de correção, DOM voltou retrato e frame nativo foi
comparado a preview DOM × density. Resultado em pixels físicos e gaps CSS:

| Ciclo | Cast após timeout | Cast inline | Delta x/y/w/h | Gap guia-preview | Gap inferior |
|---|---:|---:|---|---:|---:|
| 1 | 0 | 0 | 0/0/0/0 | -0.357 | -0.000 |
| 2 | 0 | 0 | 0/0/0/0 | -0.357 | -0.000 |

Guia abriu exatamente no limite inferior do preview/faixa do canal. Fechar
restaurou canais. Preview não apresentou erro no fluxo. EPG real retornou
12 programas/1 atual. Tablet em paisagem e Fire
preservaram apresentação ampla em smoke-check do mesmo APK. Tablet em retrato
foi validado separadamente no item43.

APK SHA-256: E19DC5339D89EDDC2AB70E9B5D2FD62CEAFC9C6B300257C2C4EA19F0D107F459; 12400179 bytes. Bundle dist/assets/index-L0bb-QGf.js; CSS index-BzG9xa8_.css. Package com.xandeflix.prebuilt; certificate b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d; versionCode1/versionName1.0/min23/target35, standalone HTTPS sem server.url. Assets6 iguais byte a byte.

| Alvo | Arquivos privados | Catálogo | Dados e firstInstallTime |
|---|---:|---:|---|
| AFTSSS | 467 | 436 | Preservados; APK idêntico |
| SM-X610 | 538 | 505 | Preservados; APK idêntico |
| SM-S926B | 548 | 508 | Preservados; APK idêntico |

Relatório acumulado itens41/42/43, memórias append-only; allowlist estrita e
baseline conferidos. Histórico anterior preservado. Sem backend/Git/reset.
Limites: ciclos no S24 e formatos/escala exercitados; não homologação de todos
os canais/modelos/orientações ou transporte Cast/PiP.
[Contrato](../architecture/C11_LIVE_FULLSCREEN_RETURN_AND_CAST.md).
