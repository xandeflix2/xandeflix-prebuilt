# C11 — Visibilidade sanitizada do erro de reprodução

## Resultado local — 2026-10-04

`RESULT=PASS_LOCAL_IMPLEMENTATION_PHYSICAL_NOTICE_PENDING`.
Correção específica autorizada pelo usuário, sem mudança de ativação. O player
continua encerrando após erro terminal; a tela de retorno recebe agora o motivo
controlado em vez de apenas encerrar silenciosamente. Este resultado não resolve
nem determina a causa dos HTTP 404 históricos e não homologa todo o catálogo.

## Preflight, especificação e proveniência

- Todos os comandos/edições neste ciclo ocorreram no workspace C11
  `C:\Xandeflix\xandeflix-prebuilt-c11-main` ou seu subdiretório Android.
- Top-level correto, origin esperado, main/ahead 2, HEAD
  `f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`, inalterados.
- AGENTS, Architecture, Execution, Source Data Boundary e lock de ativação lidos.
  CURRENT_GATE=NONE; nenhum Gate adicional do roadmap iniciado.
- [Especificação/allowlist](../architecture/C11_PLAYBACK_ERROR_NOTICE_FIX.md)
  registrada antes do código. Sucessão explícita no contrato do lock, sem mudar
  suas invariantes. Dirty preexistente preservado; sem commit/push/PR/backend.
- Baseline de 388 hashes de runtime/configuração/testes/APK: 382 permanecem
  idênticos. Somente cinco arquivos existentes de implementação mudaram
  (App, CSS, bridge, Activity e plugin), mais o APK de entrega. Sete arquivos
  adicionados nesse conjunto: helper, componente, teste JS, teste Java,
  HTML/TSX isolados e backup do APK anterior. Documentação em allowlist separada.
- Identidade/chave/ativação/boot/storage/backup, package.json/capacitor.config,
  PlaybackService, autoridade C9, URLs/headers/fontes/cache e manifest permanecem
  byte a byte iguais ao baseline. Em App, os efeitos de ativação preexistentes
  foram preservados; o patch se restringe ao listener/estado/aviso de playback.

## Implementação

1. Activity envia categoria já existente e status ao plugin somente nos dois
   caminhos de erro terminal. Finish, fallback e guarda idempotente preservados.
2. Plugin mantém `NATIVE_ERROR`/posição/ended e APIs legadas. Allowlist estrita de
   categorias; status numérico 400..599 apenas em HTTP_ERROR. Não transporta
   mensagens brutas, URLs, host, headers, tokens ou stacktrace no novo payload.
   Back e COMPLETION não transportam detalhes de erro.
3. Formatter gera textos portugueses fixos. HTTP 404 informa que a fonte não
   encontrou o vídeo; 401/403 indicam recusa da fonte, sem acusar licença inválida;
   5xx, conexão, decoder, leitura/formato e genérico têm textos distintos.
4. Listener único de App mostra aviso antes de aguardar o mesmo stopPlayback
   MEDIA_ERROR/COMPLETION/USER_EXIT. Cleanup rejeitado não esconde a causa nem
   renderiza rejeição bruta. Não há novas operações remotas nesse helper.
5. Aviso acessível role=alert, Fechar aviso, CSS exclusivamente escopado/sticky
   para rolagem; não altera Header/navegação. Nova tentativa RESOLVING limpa o
   aviso. Retorno manual e término não produzem falso alerta.

## Validação

- Lock oficial antes do patch e novamente no prebuild após o patch:
  `49/49 PASS` (22 ativação + 27 promoção) e `9/9` controles negativos PASS.
  São testes isolados/modelados; não foram feitos registros/ativações remotos.
- `node scripts/test-c11-playback-error-notice.mjs`: `11/11 PASS`. Inclui limites
  HTTP, sanitização/legado, ausência de falso alerta, motivo antes de cleanup,
  cleanup pendente/rejeitado, efeitos reais extraídos de App + bridge real com
  plugin fake, remoção tardia do listener, unsubscribe, RESOLVING, renderização
  do componente real/botão e contrato dos dois caminhos terminais nativos.
- C9 runtime wiring: `10/10 PASS`; VOD direct stream: `12/12 PASS`.
- `npx tsc --noEmit`: PASS; npm build com tsc/Vite e lock obrigatório: PASS.
- `gradlew.bat testDebugUnitTest`: 12 suites, 90 testes, zero falhas/erros/skips,
  incluindo cinco novos testes Java de valores reais do payload Map e
  categorização Media3. Não depende de getters JSON stubados pelo Android JVM.
- `npx cap sync android` e `gradlew.bat testDebugUnitTest assembleDebug`: PASS
  após o último ajuste CSS; 155 tasks, 27 executadas e 128 up-to-date.
- `git diff --check` nos arquivos existentes do patch: PASS.
- Revisão pelas skills React/verification: efeitos com cleanup/dependências
  estáveis, sem listener duplicado, texto controlado/React escaping, acessibilidade
  e estado local isolado. A revisão guiou o aviso e a preservação do lifecycle.
- Verificação visual da skill agent-browser-verify: **não executada**. CLI
  agent-browser indisponível; fallback CUA tentou navegador e inventariou zero
  apps/browsers. Sem instalação de ferramentas ou automação alternativa de UI.
  Fixture servida por Vite: HTML e TSX transformado HTTP 200; renderização SSR e
  comportamento do componente testados, sem validação visual/console no browser.
  Fixture não importa App/ativação/fonte real e bloqueia fetch externo. Servidor
  local iniciado pelo agente foi encerrado após esse check.

## APK entregue

- Raiz: `Xandeflix-v1.0.0-standalone.apk`, 9.261.140 bytes.
- SHA-256: `D601864B2E79292980869F47B6CBB34440E2E7F63DCE6C3C353A1AD3CD753385`.
- Igual por hash ao APK assembleDebug; assinatura verificada, mesmo certificado
  SHA-256 `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.
- Package `com.xandeflix.prebuilt`, versionCode 1/versionName 1.0, minSdk 23,
  targetSdk 35; sem mudança de package/signing/versionamento.
- Cinco assets web do APK correspondem por hash ao dist final. Aviso e CSS sticky
  presentes, Android scheme HTTPS mantido. Nenhum arquivo da fixture ou JSON de
  identidade/chave/estado de ativação foi encontrado nas entradas do APK.
- APK anterior preservado e verificado em
  `Xandeflix-v1.0.0-standalone-before-playback-error-fix.apk`, SHA-256
  `8828F12016892A29E3B15D0009315E3A404D4C2495F6FB8A2105DE5D15FD4B8C`.
- Não instalado neste ciclo. Nenhum uninstall/reset/force-stop ou erro induzido
  na fonte real. Teste físico do novo aviso (inclusive rolagem) permanece pendente;
  testes anteriores dos dois títulos referem-se ao APK anterior.

## Ocorrências e limites

O primeiro teste de contrato de fonte falhou porque a regex do harness esperava
uma guarda sem chaves, mas o código preservado usa chaves. Corrigido apenas o
teste e reexecutado com PASS; não foi uma falha de runtime. Avisos existentes de
node:fs/node:path externalizados, chunk grande, imports mistos e flatDir continuam
fora deste escopo. **Nenhum aviso de crypto externalizado** no build.

Erro silencioso: corrigido localmente, verificação física pendente. Motivo dos
404 históricos e defeito condicional de cache pré-player: permanecem abertos,
sem patch especulativo. O lock local de ativação continua obrigatório no prebuild;
isso não implica proteção remota publicada nem garantia contra todo bug futuro.

Para futura alteração deste caminho, repetir teste do aviso, C9, VOD, lock e
unit tests Android antes da entrega. Sem próximo Gate ou novas ações externas.
