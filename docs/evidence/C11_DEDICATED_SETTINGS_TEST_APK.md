# C141 - APK1.0.26 com janelas dedicadas - 2026-10-17

Spec previa: docs/architecture/C11_DEDICATED_SETTINGS_TEST_APK.md.
Preflight e auditoria C140 PASS; baseline1156 arquivos antes da escrita.
Somente constantes de versao Gradle25->26/1.0.26 alteradas neste ciclo.
Implementacao C140 de janelas e todos os demais codigos funcionais preservados.

## Artefato e verificacao

- Arquivo: tmp/c141-android-test-apk/Xandeflix-v1.0.26-C141.apk.
- Package com.xandeflix.prebuilt, versionCode26/versionName1.0.26,
  minSdk23/target35, tamanho11388227 bytes.
- SHA256:ffe6939d73ed6d8163938e78f9f56feb6e9854429d56e20bdcb436cb4412664c.
- Assinatura valida e mesmo certificado do C139; nenhuma chave nova.
- Lock inicial e prebuild26+27+9, typecheck/Vite padrao, cap sync e Gradle
  assembleDebug/testDebugUnitTest PASS.205 testes nativos/35 suites, zero
  falhas/erros/skips. Gradle1m34s observado; nao SLA.
-8 assets dist conferidos byte a byte no APK; marcadores de janela dedicada
  presentes no JS.1412 recursos nativos identicos ao C139, incluindo icones
  e banner. HTTPS local e logging none; sem server.url nem chunks exclusivos
  do cofre/player web/HLS/MPEGTS do modo de conferencia.
- APK C1391.0.25 preservado SHA256
  05b0c4b0e58df1b393a49747856c3da4fcb8d2261e23af2213ecd4f171fb6581.

Logs/metadata/auditoria privados em tmp/c141-android-test-apk. Sem testes
funcionais novos ou alteracao de suites; C1408/8 de janela e8/8 de fonte
permanecem evidencias sinteticas anteriores, com codigo/testes intactos.
Avisos existentes de chunks/externals, sem falha de build ou verificacao.

## Proveniencia e limites

Auditoria preserva1152 arquivos baseline; somente Gradle (duas constantes)
e tres memorias append-only mudam, com dois novos documentos allowlisted.
HEAD/main/index intactos. Nenhum acesso ou instalacao em dispositivo, reset,
nova ativacao, alteracao administrativa de backend ou operacao Git.
APK entregue para atualizacao manual/teste, mesma assinatura/package. Geracao
e testes locais nao certificam playback ou renderizacao fisica em cada alvo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
