# C149 - APK1.0.30 e atualizacao Fire Stick - 2026-10-17

Spec anterior: docs/architecture/C11_LIVE_GUIDE_TEST_APK_FIRE_INSTALL.md.
Clone ativo c11-main/main/origin esperado, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. C148 auditado e confirmado pelo usuario,
baseline1178/copias antes deste patch. Somente Gradle29->30/1.0.29->1.0.30;
runtime C148 e demais arquivos funcionais permanecem byte a byte iguais.

## Pacote e verificacao

APK universal de teste 1.0.30/code30,
package com.xandeflix.prebuilt, 11389596 bytes.
SHA256 44b885186d48d1c96773f7b00fd554a95c95039430a920217aa2a1ae752cce54.
Arquivo: tmp/c149-live-guide-test-apk/Xandeflix-v1.0.30-C149.apk.
Certificado SHA256 b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d, igual ao C144 e ao APK
instalado28 extraido apenas para verificar assinatura. Sem chaves privadas.

Build padrao C148 final (lock/typecheck/Vite21.98s) reutilizado sem mudar fonte;
cap sync e novo lock26 ativacao+27 promocao+9 negativos antes do Gradle PASS.
Gradle assembleDebug/testDebugUnitTest BUILD SUCCESSFUL43s;205 testes nativos,
35 suites,0 falhas/erros/skips.8 arquivos dist identicos no pacote,1412 recursos
nativos iguais ao C144. HTTPS standalone, sem server.url/player/cofre web.
Markers de guia por foco/foco inicial C148 presentes, fontes Android TV C144,
cards/janelas C140/C142 e startup C143 preservados. Sem novos patches funcionais.

## Instalacao autorizada

Alvo unico conectado ADB G071CQ070344374G, modelo AFTSS. Versao anterior1.0.28,
atual1.0.30. App encerrado somente para obter estado consistente. Fingerprints
privados calculados em RAM, sem persistir hashes/conteudo de conta/fonte.
Assinatura instalada conferida antes do replace; install -r Success,
mesmo firstInstallTime, package/versao/hash instalado iguais ao artefato.

Antes de reabrir,83 arquivos privados identicos, incluindo75 do catalogo e7
registros protegidos (identidade/ativacao/chave/instalacao/token/prefs cofre/
parental). App iniciado normalmente e processo ativo apos10s; identidade,
chave permanente e instalacao novamente identicas apos boot. Sem uninstall,
clear/reset/nova chave/fonte/PIN, e sem instalar no tablet/celular.
Resultado sanitizado privado em fire-install.json; nao ha hashes privados
persistidos. Nenhuma midia ou senha foi escolhida pelo agente.

## Limites e escopo

Guia/foco C148 confirmados pelo usuario no browser, nao no Fire. CUA sem
superficies neste turno; instalacao/processo e preservacao nao homologam
renderizacao/D-pad/EPG/playback fisico. APK entregue para testes nos aparelhos.
Auditoria final: baseline1178/1174 preservados apos memorias, somente2 constantes
Gradle/3 memorias e2 docs novos allowlisted. HEAD/main/index e APK C144 intactos.
Sem backend/Git ou proximo Gate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
