# C141 - APK de teste com janelas dedicadas - 2026-10-17

## Pedido, preflight e proveniencia

Usuario solicita APK atualizado para teste nos demais dispositivos, incluindo
as janelas dedicadas C140. Gerar pacote standalone atual; nenhuma instalacao,
reset, nova ativacao, alteracao de backend ou operacao Git neste ciclo.

Preflight read-only: clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Estado dirty C133-C140 conhecido;
AGENTS/Architecture/Execution/Activation Lock e specs C139/C140 lidos.
Auditoria C140 PASS antes da escrita. Baseline por hashes/copia Gradle e
memorias em tmp/c141-android-test-apk. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; sem commit/push/PR ou acesso a dados reais dos aparelhos.

## Especificacao anterior ao build

- Alterar somente versionCode25->26/versionName1.0.25->1.0.26 em Gradle.
  Codigo funcional atual e configuracoes C140 permanecem exatos. Nao confundir
  novo APK com pacote C1391.0.25, que deve continuar intacto.
- Lock inicial e prebuild obrigatorios; npm run build padrao Android (sem
  --mode web), cap sync android, Gradle assembleDebug/testDebugUnitTest.
- Gerar tmp/c141-android-test-apk/Xandeflix-v1.0.26-C141.apk. Verificar
  package com.xandeflix.prebuilt, code26/name1.0.26, certificado igual ao C139,
  assets dist exatos e janelas dedicadas no bundle. HTTPS local, sem server.url
  nem chunks do player/cofre exclusivos da conferencia web.
- Conferir integridade de recursos/icon/banner e testes nativos205/35 suites
  sem falhas. Suites sinteticas C140 continuam evidencia anterior, com seus
  arquivos e codigo preservados; nao substituir teste fisico em cada aparelho.
- Entregar link ao APK para atualizacao manual sobre a instalacao existente,
  mesma assinatura/package. Nao instalar nem manipular os dispositivos.

## Allowlist estrita e aceitacao

android/app/build.gradle: somente duas constantes de versao;
este documento e docs/evidence/C11_DEDICATED_SETTINGS_TEST_APK.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs/APK privados ignorados tmp/c141-android-test-apk e saidas usuais
de build/cap sync/Gradle. Nenhum outro arquivo produtivo ou teste alterado.

Build/lock/testes e verificacao do artefato passam; hash/tamanho/versao
registrados. Auditoria baseline preserva C140 e todo source/catalog/search/
playback/parental/Android funcional, package e assinatura. Sem declarar QA
fisico ou instalacao que nao ocorreram; nenhum proximo Gate iniciado.
