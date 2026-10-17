# C134 — preview nativo durante solicitacao de PIN — 2026-10-16

## Autorizacao e preflight

Usuario reportou/fotografou video nativo sobre o dialog parental na troca de
canal. Autoriza corrigir apresentacao e gerar APK recuperavel, preservando a
validacao parental. Sem Git/backend/instalacao/reset ou novo Gate.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

Clone independente ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, main,
origin xandeflix2/xandeflix-prebuilt, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. AGENTS/Architecture/Execution/Source
Boundary/Activation Lock lidos. Baseline1111 arquivos/prefixos em
tmp/c134-parental-preview-overlay; auditoria C133 reexecutada PASS. Patch
C133 de foco e APK1.0.22 preservados. Pendencias Git somente C133 conhecido.

## Especificacao anterior ao codigo

PlayerView Android e SurfaceView de video estao sobre WebView. z-index CSS
do dialog nao controla essa camada. Durante prompt parental da pagina Live:

- Ocultar somente a apresentacao do preview ativo (PlayerView e superficie),
  conservar ExoPlayer, midia/autorizacao atual, buffer e unica conexao existente.
  Nao iniciar o novo canal antes de PIN valido. Erro de PIN mantem ocultacao.
- Ao fechar/cancelar/validar, restaurar visibilidade do mesmo preview ainda
  ativo. Foco/Back/Cancelar continuam C133. Nao remover exigencia de PIN para
  canal sem classificacao nem alterar regras/grants/PUK/cooldown/storage.
- updatePreview ganha opcional obscured:boolean, apresentacao apenas, com
  previewId obrigatorio igual ao ativo e tipo live. Rejeitar combinacao com
  URI/headers/suspendPlayback. Atualizacao de visibilidade nao muda bounds,
  candidatos de midia, playWhenReady ou C9. Manter outros contratos existentes.
- Se necessario sair de fullscreen para mostrar WebView; enquanto oculto,
  impedir promocao fullscreen/painel nativo/atalhos de canal nativo. Release
  limpa flag. Resize/atualizacao de contexto nao pode revelar a superficie.
- Live observa prompt e disponibilidade do preview, serializa comandos de
  visibilidade em fila propria, sem bloquear previewLifecycle que pode aguardar
  o PIN. Tratar criacao tardia, fechamento rapido e IDs obsoletos; nao restaurar
  preview de pagina desmontada ou em saida. Sem modificar fluxo de C9/source.
- Versao Android23/name1.0.23, package/assinatura e marca preservados. Gerar
  APK separado para atualizacao manual; manter dados locais existentes.

## Allowlist estrita

- src/ui/pages/LiveTvPage.tsx: ref/fila/efeito de visibilidade parental apenas.
- src/playback/native-android-player.bridge.ts: campo opcional de apresentacao.
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java:
  flag/branch de visibilidade, guardas de apresentacao e reset no release.
- android/app/src/test/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPluginTest.java:
  contratos de ocultacao/restauracao sem media/C9, stale/mixed/inactive/reset.
- scripts/test-c134-parental-native-preview.mjs: UI Live/dialog/store/D-pad
  reais, portas sinteticas de catalogo/native/C9, teste de ordenacao e grants.
- android/app/build.gradle: versionCode/name apenas.
- Este documento/docs/evidence/C11_PARENTAL_NATIVE_PREVIEW_OVERLAY.md e
  apendices em docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md.
- Saidas usuais ignoradas de teste/build/sync/Gradle/APK e fixtures em tmp.

## Aceitacao

Reproducao/controle negativo com Live anterior nao envia ocultacao durante
prompt. Novo fluxo envia ocultacao ao preview correto, mantem midia anterior,
restaura apos Cancelar/PIN valido, continua oculto com PIN errado e nao cria
conexao extra. Testar corrida de hide/reveal, preview tardio, fullscreen e
saida. Contratos Java confirmam apresentacao sem operacoes ExoPlayer, rejeicao
de IDs/requests invalidos e release. Unit tests headless/ports de navegador
nao certificam composicao real SurfaceView/IME em TV; QA fisica pendente.

Regressoes C133, parental/C9/Live/foco/gestos, lock antes/depois/prebuild,
TypeScript/Vite, sync/Gradle/unidade Android e inspeccao APK. Preservar C133 e
todos os arquivos fora da allowlist por hashes, memorias append-only/Git.

## Emenda previa — prioridade do Back no modal

Teste integrado com Live real revelou que o listener Escape da pagina ignora
defaultPrevented e ainda executa onBack depois que o PIN e cancelado, encerrando
o preview em vez de restaura-lo. Ampliar somente a allowlist LiveTvPage.tsx
para o guard desse listener: respeitar evento consumido e dialog parental
aberto, deixando Back/Cancelar sob a autoridade modal ja existente. Preservar
comportamento de Back fora do PIN. Nao enfraquecer assercao de media/C9 intactos
apos cancelamento. Ocultacao nativa tambem fecha eventual painel nativo.

## Emenda previa — fixtures de regressao anteriores

Permitir somente ajustes de isolamento nos dois testes abaixo, mantendo todas
as assercoes anteriores e sem alteracao adicional de produto:

- scripts/test-c112-live-channel-keys.mjs: o harness Java extrai o metodo real
  de dispatch, mas precisa declarar o novo estado previewObscured; incluir
  verificacao de que esse estado nao encaminha atalhos nativos de canal.
- scripts/test-c106-live-preview-route-exit.mjs: o efeito real passou a exigir
  authorizeParentalLive desde C126, ausente nos ports dessa fixture antiga;
  fornecer autorizacao parental sintetica explicita e erro sanitizado, para
  executar novamente as barreiras reais de C9/stop/saida ja existentes.

Registrar hashes revisados/testes PASS na evidencia. Nao ajustar expectativas
de teardown, ordem de eventos, quantidade de sessoes ou preservacao de foco.

## Emenda previa — navegacao da pagina de ativacao

Usuario reportou durante esta entrega que Configuracoes > Ver dados de
ativacao nao aceita navegacao no Fire Stick. Incluir no mesmo APK ainda nao
entregue apenas a apresentacao/foco dessa pagina. O Back externo procura hero
inexistente; o fallback geometrico tambem pode pular acoes em posicoes distintas.

Ampliacao estrita da allowlist, anterior ao codigo:

- src/ui/hooks/useDpadNavigation.ts: rota escopada a .activation-page,
  cima/baixo por ordem dos controles visiveis/habilitados, entrada pelo Back
  externo/menu e retorno esquerdo ao menu. Preservar modal parental prioritario,
  campos editaveis e todos os outros percursos. Diagnostico pode rolar por
  cima/baixo ate as bordas antes de passar ao controle anterior/seguinte.
- src/ui/pages/ActivationPage.tsx: somente ref/efeito de foco de entrada em
  shell de TV e atributos acessiveis do diagnostico. Nenhum handler, effect de
  autorizacao, identidade/chave, polling, fonte ou operacao remota sera alterado.
- src/ui/pages/ActivationPage.css: limite de altura/overflow do diagnostico
  focavel para permitir leitura pelo D-pad; preservar demais estilos.
- scripts/test-c134-activation-dpad.mjs: JSX/hook/CSS reais com estados
  sinteticos, effects de servicos isolados, sem backend/storage/credenciais.

Aceitacao: reproduzir bloqueio com hook anterior; navegar do Back/menu para
conteudo, cima/baixo entre acoes, Enter abre/fecha suporte/copia fixture uma
vez, rolar diagnostico e sair nas bordas, pular disabled/hidden, retornar ao
menu/conteudo. Verificar Fire TV/Android TV/Box/Tizen/webOS, preservar touch
phone/tablet/dobravel e controles parentais C133. Lock completo antes/depois,
regressoes de visibilidade da chave e handoff, build/sync/Gradle/APK final.
Revisao React limitada a hooks/efeitos, acessibilidade e custo local do patch.

## Emenda previa — unico Voltar na ativacao interna

Usuario confirmou duplicidade do Voltar. Permitir somente prop opcional
showBackButton em ActivationPage (default true) e seu uso na rota activation
autorizada em src/App.tsx: !canGoBack. Quando o shell ja oferece Voltar,
omitir o botao interno; standalone/sem historico conserva o botao proprio.
Nenhuma outra logica de App/rotas/auth sera alterada. Estender teste C134 para
assegurar um Voltar, sequencia de foco revisada e default standalone preservado.
