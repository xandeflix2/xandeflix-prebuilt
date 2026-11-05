# CANON-01-VOD-DPAD-HIDDEN-CONTROLS — especificação anterior ao código

Data 2026-10-25. Solicitação anexada e recomendação posterior autorizam esta correção local de D-pad em filmes/episódios; Gate TMDB anterior encerrado,32 recibos/906 protegidos/179 controles/29 suítes. Root/L1 e recebido encerrado ficam congelados; branch de continuidade fix/source-output-format-recovery/HEAD d8a7410, main preservada. Nenhum novo conflito de provenance foi identificado. Cópia independente com origin canônico; pasta histórica somente leitura.

Causa: dispatchKeyEvent de NativePlayerActivity intercepta todas as setas/OK ocultos, mostra controller e retorna antes do helper. Helper legado ainda contém +15/-5, mas não é o caminho real quando PlayerControls existe. Não alterar esse helper legado nem seus testes: nova rota explícita exclusivamente VOD oculto usa o mecanismo existente seekFromDoubleTap/VodSeekGesturePolicy com10s simétricos, limites de duração e comandos seekable. Sem recriar player, mídia, prepare/load, URI ou sessão.

Separação obrigatória: quando ocultos, direita/esquerda executam10s por ACTION_DOWN, incluindo repetições direcionais, preservando playWhenReady e sem showController. Quando visíveis, retornar ao dispatch Media3 existente para foco/seleção/timebar; nenhum seek global capturando navegação. OK oculto pausa incondicionalmente inclusive buffering, abre controles/foca play-pause e consome o ciclo DOWN/repeat/UP para impedir clique no botão recém-focado. Cada tecla capturada continua consumida até UP/cancelamento; novo DOWN após UP com controller visível não é capturado. Canais live/espécie desconhecida, diálogos, bloqueio, transição de episódio, PiP/Cast/background e eventos modificados não recebem nova ação. UP/DOWN ocultos e teclas de mídia/Back/Menu mantêm fluxo existente. Sem callbacks de toque alterados; feedback extra não é necessário.

Implementação mínima: pequena máquina de estados VodDpadController, ligada somente no início do dispatcher existente. Porta estreita visible/showAndFocus para testar comportamento real sem criar UI Android falsa; Player real/Proxy de testes reutiliza guard/matemática existentes. Não adicionar bibliotecas. Testes JUnit novos para filme/série,10s e acumulação, limites, play state/sem show, OK ativo/buffering/pausado, DOWN/UP/repeat/cancel, controles visíveis/timeline, live/unknown/teclas externas/ineligibilidade e seek indisponível/ad/sem duração. Integração estática e compilação Java complementam testes da rota; não equivalem a execução física Media3 com controle remoto.

Baseline fresh antes do patch: canon:check,canon:test,C11 e222 testes Android/37 suítes. Depois canon:check,canon:test,C11,typecheck,playback:check e unit tests Android completos (zero falhas/erros/skips); conferir integração/allowlist/hashes/32 recibos anteriores/root/append/diff-check. Registro33 concede só quatro arquivos de código/testes/runner, três negativos novos após179 e preserva29 suítes. Verificador, testes antigos, bridge/C9/live/buffer/source/ativação/catalog/storage/versão/dependências/manifests/layouts/workflows permanecem byte-idênticos.

Pedido atual pede correção/testes/relatório; não gerar APK nem instalar/resetar dispositivos neste ciclo. Validação física pendente para Fire Stick/Android TV com filme e episódio, controles ocultos/visíveis e teclas de mídia; incluir roteiro detalhado no relatório, sem declarar homologação. Nenhum Git add/commit/push/PR/merge/main, backend/admin/Supabase/deploy ou próxima implementação.

Allowlist fechada11:
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java
- android/app/src/main/java/com/xandeflix/prebuilt/player/VodDpadController.java
- android/app/src/test/java/com/xandeflix/prebuilt/player/VodDpadControllerTest.java
- scripts/test-canonical-regression.mjs
- docs/architecture/VOD_DPAD_HIDDEN_CONTROLS.md
- docs/evidence/VOD_DPAD_HIDDEN_CONTROLS.md
- docs/governance/authorizations/CANON-01-VOD-DPAD-HIDDEN-CONTROLS.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Autorização UTF-8/LF SHA256 572859c6a2312ebd7235ac7aa9bfdc73053696d07f462e1661857d3884173f3b. Transcrição, não assinatura humana; cópia integral na evidência.

## Autorização

```text
# SOLICITAÇÃO DE CORREÇÃO — NAVEGAÇÃO D-PAD NO PLAYER DE FILMES E SÉRIES

## 1. Objetivo

Corrigir e otimizar o comportamento dos comandos direcionais do controle remoto durante a reprodução de filmes e séries, permitindo avançar ou retroceder o conteúdo diretamente, sem a necessidade de exibir previamente os controles do player.

A alteração deve proporcionar uma navegação intuitiva, rápida e compatível com dispositivos Android TV e Fire Stick, preservando as funcionalidades existentes.

## 2. Comportamento atual — Problema identificado

Atualmente, quando um filme ou episódio está sendo reproduzido em tela cheia, com os controles visuais ocultos:

- Ao pressionar **Direita (→)** no D-pad, o sistema exibe os controles do player em vez de avançar o vídeo.
- Ao pressionar **Esquerda (←)**, o sistema também exige a exibição dos controles para permitir o retrocesso.
- O usuário precisa realizar comandos adicionais para avançar ou retroceder o conteúdo.

Esse comportamento prejudica a experiência de navegação utilizando o controle remoto.

## 3. Comportamento esperado — Nova especificação

### A. Botão Direita (→)

Durante a reprodução de filmes ou séries:

- Avançar imediatamente **10 segundos** na reprodução.
- Não exibir automaticamente a barra de progresso, os botões ou os controles completos do player.
- Manter a reprodução contínua, sem pausas.
- Permitir pressionamentos consecutivos, acumulando avanços de 10 segundos por comando.

### B. Botão Esquerda (←)

Durante a reprodução:

- Retroceder imediatamente **10 segundos**.
- Não exibir automaticamente os controles completos do player.
- Manter a reprodução contínua.
- Permitir pressionamentos consecutivos, acumulando retrocessos de 10 segundos por comando.

### C. Botão Enter / OK (seleção central)

Quando o conteúdo estiver sendo reproduzido com os controles ocultos:

1. Ao pressionar **Enter / OK**, exibir imediatamente os controles visuais do player.
2. Simultaneamente, **pausar a reprodução**.
3. Manter os controles disponíveis para navegação e seleção.
4. Permitir que o usuário retome a reprodução por meio do comando Play/Pause ou da ação correspondente.
5. Garantir que o mesmo pressionamento de Enter não provoque uma segunda ação involuntária sobre um botão recém-exibido.

### D. Comportamento quando os controles estiverem visíveis

Quando os controles do player já estiverem visíveis:

- Preservar a navegação direcional entre os botões e demais elementos interativos.
- Preservar a seleção por Enter / OK.
- Evitar conflitos entre a navegação dos controles e os comandos de avanço ou retrocesso.
- Manter o comportamento de foco e acessibilidade do player.

## 4. Regras complementares

- Aplicar a funcionalidade exclusivamente aos players de **filmes e episódios de séries**, sem alterar o funcionamento dos canais de TV ao vivo.
- Priorizar o comportamento do controle remoto em dispositivos Fire Stick e Android TV.
- Garantir que o avanço não ultrapasse a duração disponível do conteúdo.
- Garantir que o retrocesso não resulte em posição inferior a zero.
- Não reiniciar o player, recarregar o conteúdo ou perder a posição atual de reprodução.
- Evitar a exibição dos controles completos durante os comandos direcionais quando estiverem ocultos.
- Não introduzir conflitos com comandos de teclado, controles externos ou interfaces de dispositivos com tela sensível ao toque.
- Se houver feedback visual de avanço ou retrocesso, mantê-lo discreto e temporário, sem abrir os controles completos.

## 5. Cenários de validação obrigatórios

| Cenário | Resultado esperado |
|---|---|
| Filme reproduzindo, controles ocultos, pressionar → | Avança 10 segundos |
| Filme reproduzindo, controles ocultos, pressionar ← | Retrocede 10 segundos |
| Série reproduzindo, controles ocultos, pressionar → | Avança 10 segundos |
| Série reproduzindo, controles ocultos, pressionar ← | Retrocede 10 segundos |
| Pressionar → três vezes | Avança 30 segundos |
| Pressionar ← duas vezes | Retrocede 20 segundos |
| Reprodução ativa, controles ocultos, pressionar Enter | Exibe controles e pausa imediatamente |
| Controles visíveis, pressionar direcionais | Navega normalmente pelos controles |
| Reprodução próxima do início ou final | Respeita os limites do conteúdo |
| Reprodução de TV ao vivo | Mantém o comportamento original |

## 6. Instruções para o agente executor

1. Analisar a implementação atual do player de filmes e séries e identificar os responsáveis pelo tratamento dos eventos D-pad, Enter e Play/Pause.
2. Identificar por que os comandos direcionais estão priorizando a abertura dos controles em vez da busca temporal (*seek*).
3. Implementar a correção pontualmente, reutilizando os recursos e mecanismos já existentes.
4. Evitar refatorações amplas ou alterações não relacionadas à demanda.
5. Preservar a compatibilidade com Fire Stick, Android TV e demais dispositivos suportados.
6. Executar os testes automatizados disponíveis e identificar os cenários que ainda dependem de validação física.
7. Apresentar um relatório técnico contendo os arquivos envolvidos, a causa identificada, as correções realizadas, os testes executados e eventuais limitações.

**Critério de aceitação final:** com um filme ou episódio em reprodução e os controles ocultos, pressionar Direita ou Esquerda deve realizar imediatamente o deslocamento de 10 segundos, sem abrir os controles completos. Pressionar Enter / OK deve exibir os controles e pausar a reprodução no mesmo comando.

**Restrição de segurança:** não realizar commit, push, merge ou deploy sem autorização expressa. Não alterar a lógica de reprodução de TV ao vivo nem componentes não relacionados à correção.

ATUALIZAÇÃO DO USUÁRIO:
Recomendação técnica: o ponto mais importante é distinguir os dois estados do player: controles ocultos e controles visíveis. Quando estiverem ocultos, as setas horizontais devem controlar o tempo do vídeo; quando estiverem visíveis, devem continuar permitindo a navegação pelos botões. Essa separação evita corrigir o avanço e retrocesso à custa de quebrar a navegação do controle remoto.
```

## Revisão de port antes do patch

Allowlist passa de11 para12 caminhos, incluindo scripts/test-c161-player-navigation.mjs. Esse teste extrai o dispatcher real em um fixture de navegação de episódios. Nova chamada dispatchHiddenVodDpad exige somente adicionar uma porta false no fixture histórico, que cobre controles visíveis; todos os asserts antigos preservados. A nova máquina real será testada em JUnit sem simular a implementação. Rodar esse cenário standalone antes/depois além das29 suítes canônicas. Nenhuma mudança no verificador ou testes históricos de seek legado. Preparação inicial recusou opção genérica prepare herdada de outro helper por guard de saída preexistente, antes de qualquer escrita; comando nominal prepare-vod-dpad corrigiu apenas o helper ignorado. Saídas anteriores preservadas.


## CANON-01-VOD-DPAD-HIDDEN-CONTROLS — registro — 2026-10-25

Solicitação e recomendação posterior transcritas antes do patch: controles ocultos têm10s horizontal/OK pausa e exibe; controles visíveis continuam no dispatcher original. Baseline fresh canon:check/test/C11/Android passou179 controles/29 suítes,222 testes nativos/37 suítes. RED compilou o dispatcher recebido em fixture isolado e falhou exatamente HIDDEN_RIGHT_MUST_NOT_OPEN_CONTROLS com exit1; não é falha do baseline nem teste físico. Novo controller captura ciclo completo de tecla, usa seek existente limitado e não recria mídia. C161 mock recebe somente porta de método novo; todos asserts anteriores preservados. Allowlist12,32 recibos anteriores intactos, novo33. Validação pós-patch ainda PENDING. Sem APK/instalação/Git/backend/admin/versão/source/live/buffer. Auth SHA256 572859c6a2312ebd7235ac7aa9bfdc73053696d07f462e1661857d3884173f3b.


## CANON-01-VOD-DPAD-HIDDEN-CONTROLS — encerramento local — 2026-10-25

RESULT=LOCAL_READY_AUTOMATED_VALIDATION_PHYSICAL_PENDING. NativePlayerActivity usa nova rota antes do dispatcher anterior exclusivamente quando há filme/episódio com controles ocultos. Direita/esquerda buscam10s por comando, repetição acumula, limites/seekable/ad/command/duração do mecanismo existente preservados. Nenhum showController/play/pause no seek e nenhuma recriação/prepare/reload do player. OK oculto pausa inclusive buffering, mostra/foca play-pause e consome repetições/UP para impedir clique involuntário. Novo DOWN com controles visíveis retorna à navegação original. Foreground, PiP/Cast, bloqueio, diálogo, transição e modificadores são verificados na rota.

Dispatcher anterior preservado literalmente exceto uma chamada inicial; helper legado e seu teste+15/-5 não são o caminho real de VOD oculto com PlayerControls e não foram alterados. Canais live, toque/gestos, Back/Menu/mídia/verticais e fonte/C9/buffer/ativação/identidade/catalog/versão permanecem recebidos. O teste C161 só recebeu uma porta false para o novo método fora de seu cenário visível; asserts antigos byte-idênticos. Verificador, dependências, manifests, layouts, workflows e32 recibos anteriores intocados. Allowlist12, índices vazios/root/L1/recebido/main/HEAD/branch preservados, documentos normativos somente append.

Baseline fresh canon/check/test/C11/Android/C161 exit0:179 controles/29 suítes,222 testes nativos/37 suítes. RED do dispatcher realmente extraído do recebido compilou exit0 e falhou exit1 com HIDDEN_RIGHT_MUST_NOT_OPEN_CONTROLS; falha esperada preservada, sem fabricação de PASS. Depois17 testes novos JUnit passaram, total239 testes/38 suítes Android,0 falhas/erros/skips. Integração JVM executou dispatcher/helper/seek reais e controller/policy reais,123 verificações:10s/acumulação, OK/release/repeat, visível sem seek, nove contextos inelegíveis e comparação live ao corpo anterior nos estados oculto/visível. São ports Android/View/Player sintéticos, não execução física Media3. Cinco comandos npm finais e C161 standalone exit0;182 controles/29 suítes preservadas,908 protegidos/33 recibos,127 controles Prebuilt/21 cenários de rede preservados. Não foram repetidos os13 comandos do antigo L1 nem declarado build web.

Não houve geração de APK, instalação, reprodução em dispositivo, reset, novas conexões de fonte, Git add/commit/push/PR/merge/main ou backend/admin/Supabase/deploy. Homologação física de filme e episódio no Fire Stick/Android TV continua PENDING; controle real, animação/foco Media3, seek de rede e retomada com Play/Pause exigem essa etapa. APK anterior continua com o comportamento anterior; esta correção está somente na árvore isolada desta emenda. Auth SHA256 572859c6a2312ebd7235ac7aa9bfdc73053696d07f462e1661857d3884173f3b; recibo blobLF f33a7c6510ca7fe14f22367d0da0344e285e754a, SHA256 1cfa7af344aa7f258e2bb9f498f23f05c8f1936b0246d60916d080f68776c6a0. Próxima implementação não iniciada.

Preparação auxiliar inicialmente recusou argv genérico prepare herdado por outro helper, antes de escrever qualquer saída; opção nominal corrigida, guard preservou os diretórios anteriores. Nenhum comando de validação oficial falhou e nenhum timeout/assert foi relaxado. Logs, RED, grants, hashes e relatório em tmp/vod-dpad-hidden-controls-20261025.

## Comandos reais

| Comando | Exit code |
| --- | ---: |
| `npm run canon:check` | 0 |
| `npm run canon:test` | 0 |
| `npm run c11:new-device:lock` | 0 |
| `gradlew.bat --offline --no-daemon --max-workers=2 --console=plain testDebugUnitTest` | 0 |
| `C:\Program Files\nodejs\node.exe scripts/test-c161-player-navigation.mjs` | 0 |
| `gradlew.bat --offline --no-daemon --max-workers=2 --console=plain :app:testDebugUnitTest --tests com.xandeflix.prebuilt.player.VodDpadControllerTest` | 0 |
| `npm run canon:check` | 0 |
| `javac -encoding UTF-8 -d C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-hidden-controls-20261025/integration-harness C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-hidden-controls-20261025/integration-harness/android/view/KeyEvent.java C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-hidden-controls-20261025/integration-harness/androidx/media3/common/Player.java C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-hidden-controls-20261025/integration-harness/androidx/media3/ui/R.java C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-hidden-controls-20261025/integration-harness/com/xandeflix/prebuilt/player/VodDpadController.java C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-hidden-controls-20261025/integration-harness/com/xandeflix/prebuilt/player/VodSeekGesturePolicy.java C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-hidden-controls-20261025/integration-harness/com/xandeflix/prebuilt/player/NativePlayerActivity.java` | 0 |
| `java -cp C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-hidden-controls-20261025/integration-harness com.xandeflix.prebuilt.player.NativePlayerActivity` | 0 |
| `npm run canon:test` | 0 |
| `npm run c11:new-device:lock` | 0 |
| `npm run typecheck` | 0 |
| `npm run playback:check` | 0 |
| `C:\Program Files\nodejs\node.exe scripts/test-c161-player-navigation.mjs` | 0 |
| `gradlew.bat --offline --no-daemon --max-workers=2 --console=plain testDebugUnitTest` | 0 |

## Integração com interfaces simuladas

```json
{
  "integration": {
    "result": "PASS",
    "checks": 123,
    "actualMethods": [
      "dispatchKeyEvent",
      "dispatchHiddenVodDpad",
      "seekFromDoubleTap"
    ],
    "actualProductionClasses": [
      "VodDpadController",
      "VodSeekGesturePolicy"
    ],
    "ports": "JVM Android KeyEvent/View/Player ports, not a physical Media3 rendering",
    "physicalDevice": false,
    "liveComparedToUnchangedPreviousDispatchBody": true
  },
  "wiring": {
    "result": "PASS",
    "originalDispatcherUnchangedExceptHiddenRoute": true,
    "legacyKeyHelperUnchanged": true,
    "boundedTouchSeekPrimitiveUnchanged": true,
    "touchDispatcherUnchanged": true,
    "historicalC161OnlyOneNewPort": true
  },
  "native": {
    "tests": 239,
    "suites": 38,
    "failures": 0,
    "errors": 0,
    "skipped": 0
  }
}
```
