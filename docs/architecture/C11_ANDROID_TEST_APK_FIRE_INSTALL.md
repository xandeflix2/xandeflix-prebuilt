# C139 - APK atualizado de teste e instalacao Fire Stick - 2026-10-17

## Autorizacao, preflight e escopo

Usuario solicitou gerar APK atualizado para teste no tablet/celular e instalar
no Fire Stick conectado. Autoriza build Android standalone e install -r
somente do package com.xandeflix.prebuilt no Fire Stick AFTSS identificado por
ADB serial G071CQ070344374G. Nao autoriza instalacao nos outros aparelhos,
uninstall, clear data, reset, nova identidade/ativacao ou escrita no backend.
Este pedido supersede somente a ausencia de autorizacao de APK/install do C138.

Clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, origin esperado
https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. AGENTS, Architecture/Execution,
Activation Lock e spec C138 lidos; auditoria C138 PASS antes deste ciclo.
Baseline privada em tmp/c139-android-test-apk antes da especificacao.
Estado dirty C133-C138 conhecido e preservado. Fire instalado1.0.23/code23;
catalogo/identidade/ativacao/chave/instalacao e prefs de cofre/parental presentes.
Primeiro plano observado: configuracoes de rede Amazon, nao player do app.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; Git/backend nao autorizados.

## Especificacao anterior ao build

- Incrementar somente versionCode24->25/versionName1.0.24->1.0.25 no Gradle.
  Incluir codigo atual C135-C138, inclusive configuracoes resumidas, sem novos
  patches funcionais. Preservar package, certificado, HTTPS local, recursos e
  dados de usuario. App padrao Android, nao build --mode web nem server.url.
- Lock antes/depois obrigatorio; npm run build com prebuild, cap sync android,
  Gradle assembleDebug e testDebugUnitTest. Nenhum lifecycle contornado.
- Distribuivel Xandeflix-v1.0.25-C139.apk; verificar assinatura igual ao APK
  anterior e ao instalado, package/versao/assets dist/ausencia de servidor dev
  e implementacoes web exclusivas. Hash/tamanho registrados sem segredos.
- Antes de install -r, encerrar somente este app para obter estado consistente;
  comparar hashes privados em RAM antes/depois de identidade/ativacao/chave/
  instalacao/pending token, catalogo e prefs cofre/parental, sem ler plaintext
  para logs/disco. Confirmar preservacao antes de abrir nova versao. Captura
  do APK instalado pode ser usada para comparar assinatura, nao dados de conta.
- Install -r somente alvo confirmado AFTSS/serial acima. Sem downgrade,
  desinstalar, restaurar dados ou compartilhar identidade com tablet/celular.
- Apos preservacao e versao verificadas, abrir app e verificar estabilidade/
  Configuracoes/D-pad quando possivel, sem iniciar midia, inserir PIN, alterar
  fonte ou preferencias. Nao certificar playback pela instalacao bem-sucedida.

## Allowlist e aceitacao

android/app/build.gradle: apenas duas constantes de versao; este documento e
docs/evidence/C11_ANDROID_TEST_APK_FIRE_INSTALL.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs/APKs ignorados tmp/c139-android-test-apk e saidas usuais ignoradas
dist/Capacitor/Gradle. Nenhum arquivo de producao funcional/teste/dependencia
ou configuracao sensivel alterado. Artefato anterior C135 preservado por hash.

Lock/build/testes passam, APK atual tem codigo/assets corretos e mesma
assinatura, Fire recebe25 in-place sem perda dos dados protegidos. Entregar
link local ao APK para tablet/celular; distinguir teste fisico de instalacao
das suites locais, e apontar qualquer limite de verificacao real.
