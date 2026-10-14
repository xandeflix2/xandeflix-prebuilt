# C101 — APK19 instalado no Fire Stick — 2026-10-13

Spec prévia: [C11_FIRESTICK_APK19_INSTALL](../architecture/C11_FIRESTICK_APK19_INSTALL.md).
Preflight canônico registrado; baseline de963 arquivos (excluindo .env).
Patch funcional deste ciclo: somente versionCode19/versionName1.0.19.
Implementação C100 anterior preservada, sem mudança de player neste ciclo.

Build produção e cap copy PASS. Gradle testDebugUnitTest/assembleDebug SUCCESS:
191 testes,33 suites,0 falhas/erros. Lock oficial antes da versão, prebuild,
antes de copy/Gradle e antes da entrega PASS, promoção27/27. Avisos existentes
de chunk grande/imports Node externalizados não impediram build; nenhum relaxamento.

APK: tmp/c101-firestick-apk19/Xandeflix-v1.0.19-duplo-toque.apk,
11091073 bytes, com.xandeflix.prebuilt, code19/name1.0.19, minSDK23.
SHA256: 401c8dc29e561370a0ffdd7759ba82c1121f62ec5b2ae5032a23c2c078dfba6c.
Certificado: b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d,
igual ao APK13 instalado. Verificador confirmou sete assets iguais ao dist,
schemeHTTPS/sem server.url, updater e duas classes de gesto no DEX; APK18 intacto.

Alvo único: 192.168.3.101:5555, Amazon AFTSSS/API28. Tablet não operado.
Duas tentativas install -r falharam por espaço interno insuficiente. Sem mudança
da versão13/UID/firstInstallTime. Repetição diagnóstica confirmou IOException
Requested internal only, but not enough space. Removidos somente ~23MiB de
cache/artwork-v1 e cache/WebView do próprio package, reconstruíveis, caminhos
absolutos conferidos. Não remover app_webview, files, bancos ou prefs. Hashes
privados/catálogo iguais antes/depois dessa manutenção.

Terceira tentativa install -r SUCCESS. APK instalado retirado via adb pull e
SHA256 idêntico ao artefato. Versão19/1.0.19 confirmada; UID10285 e
firstInstallTime2026-10-04 13:06:33 preservados. Comparação em RAM confirmou
cinco arquivos privados (identidade/chave/ativação/instalação/token) e1603
arquivos files/prebuilt byte a byte iguais. Não persistir conteúdo privado.

App não aberto automaticamente; reprodução/UI/gesto físico permanecem para
teste do usuário. Gesto incluído não implica execução física com mouse/toque;
controle remoto convencional mantém os comandos anteriores.

Erro operacional no contador Node inline por quoting PowerShell corrigido por
leitura XML PowerShell, sem alteração de testes/código. Uma tentativa de patch
documental não encontrou contexto e não modificou arquivo; corrigida em seguida.
Logs e resultados sanitizados locais em tmp/c101-firestick-apk19/. Auditoria
final exige allowlist estrita/HEAD preservado. Sem commit/push/PR/backend/reset.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
