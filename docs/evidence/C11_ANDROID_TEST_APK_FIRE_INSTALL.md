# C139 - APK1.0.25 e instalacao Fire Stick - 2026-10-17

Spec previa: docs/architecture/C11_ANDROID_TEST_APK_FIRE_INSTALL.md.
Preflight/baseline e auditoria C138 PASS antes da mudanca. Somente constantes
de versao no Gradle foram alteradas; codigo funcional atual C135-C138 mantido.

## Artefato e verificacao local

- Arquivo: tmp/c139-android-test-apk/Xandeflix-v1.0.25-C139.apk.
- Package com.xandeflix.prebuilt, versionCode25, versionName1.0.25,
  minSdk23/target35; tamanho11387196 bytes.
- SHA256:05b0c4b0e58df1b393a49747856c3da4fcb8d2261e23af2213ecd4f171fb6581.
- Mesmo certificado do APK anterior e do instalado no Fire; assinatura valida.
- Lock inicial PASS e npm run build com prebuild/lock26+27+9/typecheck PASS;
  cap sync android PASS; Gradle assembleDebug/testDebugUnitTest PASS.
-205 testes nativos/35 suites, zero falhas/erros/skips. Gradle2m56s observado,
  nao SLA. Avisos existentes de build nao bloquearam compilacao.
-8 assets dist identicos ao pacote compilado, resumos Settings presentes,
  recursos nativos1412 identicos ao C135 (inclui icones/banner). Standalone
  Android HTTPS local, sem server.url, sem chunks de cofre/player/HLS/MPEGTS web.
- APK C135 SHA256559cbe905898853765f9f4c3f8ac7373870c62885aa5607912a8a4a1da8514cd
  preservado. Nenhuma nova chave de assinatura, dependencia ou codigo nativo.

## Instalacao fisica autorizada

Alvo unico Fire Stick AFTSS serial G071CQ070344374G, conectado por ADB. Versao
anterior1.0.23/code23 e app Amazon de rede em primeiro plano no preflight.
APK instalado anterior copiado somente para comparacao de assinatura.

App encerrado antes de captura consistente; install -r retornou Success.
Comparacao em RAM antes/depois, antes de reabrir:83 arquivos protegidos
identicos, incluindo75 arquivos de catalogo e7 registros essenciais
(identidade, ativacao, chave, instalacao, token pendente, cofre e parental).
Nenhum valor ou hash privado desses registros foi salvo nos logs/disco.
firstInstallTime preservado. APK efetivamente instalado conferido por SHA256
igual ao artefato25, nao somente versionName.

App aberto via MainActivity/Status ok, processo vivo apos10s; identidade,
chave e identidade de instalacao ainda identicas apos boot normal. Nao foi
teste de playback ou de todos os caminhos de navegacao. Nenhum PIN digitado,
fonte/preferencia editada, clear data, uninstall ou reinstalacao limpa.
Nenhuma instalacao no tablet/celular; APK fornecido para teste manual neles.

## Proveniencia e limites

Logs/metadata/auditoria privados em tmp/c139-android-test-apk. Baseline de
codigo por hashes; allowlist somente Gradle (versao), dois documentos e tres
memorias append-only. HEAD/main/origin/index preservados. Sem alteracao
administrativa de backend, Git, rotacao de identidade ou proximo Gate.
Pesquisa inicial apontou dois diretorios tmp com nomes antigos; corrigida
pelos nomes reais. Nenhuma falha de teste/build/assinatura/install neste ciclo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
