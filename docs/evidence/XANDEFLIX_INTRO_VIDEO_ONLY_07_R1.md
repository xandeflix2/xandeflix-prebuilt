# Intro07 R1 — somente vídeo na apresentação inicial

Data26/10/2026 America/Sao_Paulo. Revisão nominal explicitamente solicitada pelo usuário; implementação local e novo APK de teste autorizados, instalação/publicação/Git/backend não. Autorização literal em AUTHORIZATION.txt, SHA256 c3bd99c158a37a8a443cb5c4bc12779978bd2d918ad2ce4e4a864cdf3b5e4a7e. Substitui somente a exigência anterior de botão de toque Pular introdução e da marca estática antes do primeiro quadro. A nova apresentação normal terá apenas o MP4 original, sem texto, controles ou logo estática separada. Transição de lançamento do sistema e preparação do primeiro quadro ficam pretas; não prometer remoção do estágio do SO ou latência zero.

Base integral fechada07,1454 arquivos/936 protegidos/38 recibos, APK734e6ca9b89c8639d1e45d70caf81bf4c6fcbd2611278a163ca00431ef5c9ac2. Preservados root e03/04/05/06/07 por hashes. Clone independente, overlay completo, HEADd8a74102124fbb8a3f013f6fd8a502519c1db4b8, branch operacionalfix/source-output-format-recovery, mainb3fc8d1e3844bc5601813ab1b298289af5b3f1fd, origin canônico. Divergência histórica documentada mantida;10 diferenças L1 do root intactas; pasta histórica somente leitura. Não reconstruir da main, não incorporar04 nem corrigir FAILs06.

## Mudança mínima antes do código

Remover Button/id/string intro_skip e seu listener/insets. Overlay permanece preto e recebe foco para não interagir com WebView encoberta. ImageView do fallback nasce GONE e sem src; prepare não atribui imagem nem decodifica PNG. Marca estática só permanece em fallback de erro/memória existente, após liberar o player. Theme de splash usa vetor transparente próprio e preto, sem trocar ícones launcher/banner. Enter/OK/Back continuam cancelamento físico seguro já existente; o pedido retira o botão, não autoriza alterar essas teclas, áudio, política cold/warm, lifetime, gate/bootstrap ou player do catálogo. Toque na área do vídeo não pula. Fim normal continua STATE_ENDED; não alterar vídeos8s, proporção, áudio/foco/timeouts/liberação.

## Testes e governança

Fresh baseline CANON201 controles34 suítes/C11 antes de produto. Adaptar apenas as expectativas de apresentação da suíte07 que o novo requisito substitui, conservando demais assertions e15 casos JVM. Adicionar um caso de vídeo primeiro/sem overlay; total14 casos. Runner preserva201 negativos e34 suítes, acrescenta3 negativos para recibo/UI/launch resource; total204 controles34 suítes. Nenhum verificador/dependência/manifest/versão/package/assinatura/main entry alterado. Recibo39 com grants reais before/after/predecessores,38 anteriores imutáveis. Documentos normativos append-only.

Após código congelado:13 checks oficiais completos CANON/check/test/C11/typecheck/update/security/playback/build/site/contratos de artefato, suíte14 e Gradle unit257/39; C11 antes de copy/Gradle, registry oficial3 plugins, assembleDebug offline, auditoria package/assinatura/permissões/MP4/PNG/dist/recursos e ausência04. Auditoria deve ler XML compilado do layout e tema de lançamento para provar ausência de Button/src e recurso transparente. Validar MP4s e31 PNGs byte a byte, preservar APK07 anterior, entregar novo nome/hash. Nenhuma operação nos dispositivos. Aparência e primeiro quadro Android permanecem pendentes de física.

Rollback local é o stage07 fechado e APK734e6ca9…, nunca sobrescrever. Sem install/reset/clear/rollback físico. Regressão nova bloqueia entrega; registrar falhas, sem ampliar limites/assertions para passar. NEXT_GATE_STARTED=NAO.

## Allowlist

- android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroController.java
- android/app/src/main/res/layout/app_intro.xml
- android/app/src/main/res/values/styles.xml
- android/app/src/main/res/values/strings.xml
- android/app/src/main/res/drawable/intro_launch_blank.xml
- scripts/test-app-intro-branding-07.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/XANDEFLIX_INTRO_VIDEO_ONLY_07_R1.md
- docs/evidence/XANDEFLIX_INTRO_VIDEO_ONLY_07_R1.md
- docs/governance/authorizations/CANON-01-XANDEFLIX-INTRO-VIDEO-ONLY-07-R1.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Autorização atual

> AO ABRIR O APP A PRIMEIRA ABERTURA DEVE SER O VIDEO E SEM O BOTAO "PULAR INTRODUÇÃO". GERE O APK SO COM A ABERTURA DO VIDEO



## Orquestração de validação

Com fontes e grants congelados, a regressão canônica e as verificações/builds podem executar em processos independentes com saídas próprias; nenhuma etapa altera arquivos gerenciados. Build APK usa fresh C11 e só o dist concluído; entrega/auditoria dependem de todos os13 comandos oficiais e testes nativos aprovados. Rodada canônica produz somente seu próprio resultado, sem executar Gradle. Não encerrar a regressão para entregar mais cedo nem interpretar APK compilado como aprovação antes dos checks.


## Intro07 R1 — fechamento local

RESULT=INTRO_VIDEO_ONLY_07_R1_APK_VALIDATED_PHYSICAL_PENDING. Novo APK C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-intro-video-sem-botao-20261026.apk, SHA256 fd82bb15d941f4e3de3b2b354eee43d4a8253d655dc97a23b16d6d59c6a8f16a. Sem botão Pular nem marca estática no preparo; transição preta e vetor transparente. Fallback de erro/teclas/lifecycle preservados.204 controles34 suítes/14 casos intro/257 testes39 suítes e13 checks oficiais/assemble/auditoria PASS.39 recibos/937 protegidos,38 históricos e root/03/04/05/06/07 intactos. Fonte do teste atualizada somente para o requisito explícito substituído; nenhum limite relaxado. Nenhuma operação física/Git/backend. Relatório C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/app-intro-video-only-07-r1-20261026/REPORT.md. NEXT_GATE_STARTED=NAO.


# Xandeflix — APK com abertura somente em vídeo, sem botão

**Revisão: INTRO-VIDEO-ONLY-07-R1. Data:26/10/2026, America/Sao_Paulo. RESULT=INTRO_VIDEO_ONLY_07_R1_APK_VALIDATED_PHYSICAL_PENDING.** Novo APK de teste gerado e auditado. Nenhuma instalação/operação em aparelho, Git/publicação/backend ou incorporação04.

## Resultado solicitado

No fluxo normal, o primeiro conteúdo de marca passa a ser o MP4 original: removidos botão/texto “Pular introdução”, imagem estática durante prepare e ícone da splash de lançamento. A transição de lançamento do SO usa vetor transparente sobre preto; a área do aplicativo permanece preta até o primeiro quadro. Não se promete remover o estágio do Android nem primeiro quadro instantâneo. Ao terminar o vídeo, continua o bootstrap original de ativação/carregamento, sem forçar Home.

Os dois vídeos originais continuam completos, locais,8s de vídeo24FPS/AAC original, escolhidos por janela/TV. Um player nativo, contain/FIT, áudio/foco/lifecycle/deadlines permanecem como07. Toque na área do vídeo não pula. Enter/OK/Back continuam o cancelamento físico existente: o pedido retirou o botão, sem pedir mudança dessas teclas. A imagem de fallback permanece somente em falha/memória, após liberar a tentativa, para não bloquear a aplicação.

## APK para teste

Arquivo: **C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-intro-video-sem-botao-20261026.apk**.

**SHA256: fd82bb15d941f4e3de3b2b354eee43d4a8253d655dc97a23b16d6d59c6a8f16a.** Tamanho20533747bytes; delta-677bytes contra07 anterior. Packagecom.xandeflix.prebuilt, versionName1.0.37/code37; certificado SHA256b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d. Mesma assinatura/package/versão e permissões; distinguir o binário por SHA, nunca só por1.0.37. Debug/teste, sem publicação release.

APKs anteriores preservados, especialmente07 SHA734e6ca9b89c8639d1e45d70caf81bf4c6fcbd2611278a163ca00431ef5c9ac2. Compatibilidade estática in-place favorável; nenhuma instalação ou preservação após atualização foi testada nesta revisão. Rollback físico não executado e depende de autorização; APK não é backup privado.

## Auditoria e testes

Baseline fresh201 controles/34 suítes/936 protegidos38 recibos e C11 PASS antes da mudança. Final **204 controles/34 suítes**, **14 casos intro**, **257 testes Android/39 suítes**, zero falhas/erros/skips.13 comandos oficiais, C11 pré-build, Gradle offline testDebugUnitTest+assembleDebug, CANON/C11 pós-build e assinatura/CRC/assets/DEX passaram. Regressão e builds em processos independentes sobre fontes congeladas; entrega somente após ambos aprovados.

XML compilado do APK foi inspecionado por AAPT: layout sem Button e sem android:src, fallback inicialmente GONE; string intro_skip ausente; vetor transparente compilado e referenciado no tema de lançamento. Controller normal prepare não atribui imagem. 33 imagens/mídias conferidas,33 byte idênticas; dois MP4s e31 PNGs originais/derivados de07 preservados. Launcher/sidebar/banner não redesenhados. Todos os11 arquivos dist correspondem ao APK. Assinatura/permissões/manifest sem mudança de semântica; classes intro presentes e04 ausente. Padrões privados auditados: zero ocorrências, sem alegar busca exaustiva.

| Etapa | Comando | Exit | Segundos |
| --- | --- | ---: | ---: |
| baseline-canon | `cmd.exe /d /s /c npm run canon:check` | 0 | 3.8 |
| baseline-regression | `cmd.exe /d /s /c npm run canon:test` | 0 | 233.2 |
| baseline-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 16.3 |
| final-01 | `cmd.exe /d /s /c npm run canon:check` | 0 | 4.9 |
| final-03 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 20.5 |
| final-04 | `cmd.exe /d /s /c npm run typecheck` | 0 | 32.8 |
| final-05 | `cmd.exe /d /s /c npm run update:check` | 0 | 2.2 |
| final-06 | `cmd.exe /d /s /c npm run security:check` | 0 | 2.4 |
| final-07 | `cmd.exe /d /s /c npm run playback:check` | 0 | 16.3 |
| final-08 | `cmd.exe /d /s /c npm run build` | 0 | 72.7 |
| final-09 | `cmd.exe /d /s /c npm run site:build` | 0 | 152.7 |
| final-10 | `C:\Program Files\nodejs\node.exe scripts/test-site-build-contract.mjs` | 0 | 14.1 |
| final-11 | `C:\Program Files\nodejs\node.exe scripts/test-vercel-artifact-contract.mjs` | 0 | 0.4 |
| final-12 | `C:\Program Files\nodejs\node.exe scripts/verify-vercel-artifact.mjs inspect` | 0 | 0.5 |
| final-02 | `cmd.exe /d /s /c npm run canon:test` | 0 | 321.1 |
| final-13 | `C:\Program Files\nodejs\node.exe scripts/test-vercel-prebuilt-contract.mjs` | 0 | 17.4 |
| final-intro-suite | `C:\Program Files\nodejs\node.exe scripts/test-app-intro-branding-07.mjs` | 0 | 1.0 |
| apk-preflight-canon | `cmd.exe /d /s /c npm run canon:check` | 0 | 4.3 |
| apk-preflight-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 17.8 |
| apk-capacitor-copy | `C:\Program Files\nodejs\node.exe C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/app-intro-video-only-07-r1-20261026/workspace/node_modules/@capacitor/cli/bin/capacitor copy android` | 0 | 2.0 |
| apk-before-gradle-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 18.4 |
| apk-assemble | `cmd.exe /d /s /c gradlew.bat --offline --no-daemon --max-workers=2 --console=plain testDebugUnitTest assembleDebug` | 0 | 221.4 |
| apk-after-canon | `cmd.exe /d /s /c npm run canon:check` | 0 | 6.5 |
| apk-after-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 19.5 |

A única atualização de expectativas do teste07 substitui as antigas assertions de botão por sua ausência explícita, conforme novo pedido. Restante da suíte,15 testes JVM,201 controles e34 suítes antigos preservados; adicionados um caso vídeo-primeiro e três negativos de recibo/layout/vetor. Nenhum timeout/verificador foi relaxado. Uma tentativa de editar o helper por patch não encontrou o texto, não escreveu arquivo e foi descartada após leitura confirmar que os escapes já estavam corretos. A primeira auditoria de XML confundiu o enum compilado gone=2 com View.GONE=8 do Java; o SDK35 instalado confirmou a definição correta em data/res/values/attrs.xml. O helper passou a derivar e exigir exatamente esse enum do SDK, sem mudar produto/APK. Tentativa preservada em APK_AUDIT_HELPER_CORRECTION.json; auditoria final repetida, não promoção da tentativa a PASS.

## Proveniência e preservação

Autorização literal mais recente em AUTHORIZATION.txt, SHA256c3bd99c158a37a8a443cb5c4bc12779978bd2d918ad2ce4e4a864cdf3b5e4a7e. Escopo/allowlist/spec precederam o código. Base integral07 fechada,1454 arquivos, sem reconstrução da main. Novo cloneC:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/app-intro-video-only-07-r1-20261026/workspace; originhttps://github.com/xandeflix2/xandeflix-prebuilt.git, HEADd8a74102124fbb8a3f013f6fd8a502519c1db4b8, branch operacionalfix/source-output-format-recovery, mainb3fc8d1e3844bc5601813ab1b298289af5b3f1fd. Divergência histórica preservada, root com mesmas10 diferenças L1 e index vazio; pasta histórica somente leitura.

Root e todos manifests/artefatos03/04/05/06/07 foram reconferidos e permanecem intactos. Delta estrito14/14 caminhos: cinco de produção, dois de testes/runner e sete de documentação/governança. Quatro normativos append-only. Recibo39docs/governance/authorizations/CANON-01-XANDEFLIX-INTRO-VIDEO-ONLY-07-R1.json, blobLF840c021999b13ea069997a62cbe8b112eefb0cc6, SHA256cfd00483f1e838bf9412477b61811ed1c6f01f6b56db5bb4812ff276cb271459; sete grants reais,38 recibos anteriores imutáveis. CANON937 protegidos/39 recibos. MainActivity, política de admissão, entry/bootstrap/segurança/fonte/catalogo/players/dependências/manifesto/versionamento e assets permanecem byte a byte do07 fora da allowlist.

- `android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroController.java`
- `android/app/src/main/res/drawable/intro_launch_blank.xml`
- `android/app/src/main/res/layout/app_intro.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values/styles.xml`
- `docs/ERRORS_AND_BLOCKERS.md`
- `docs/EVOLUTION_REPORT.md`
- `docs/STATUS.md`
- `docs/architecture/XANDEFLIX_INTRO_VIDEO_ONLY_07_R1.md`
- `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md`
- `docs/evidence/XANDEFLIX_INTRO_VIDEO_ONLY_07_R1.md`
- `docs/governance/authorizations/CANON-01-XANDEFLIX-INTRO-VIDEO-ONLY-07-R1.json`
- `scripts/test-app-intro-branding-07.mjs`
- `scripts/test-canonical-regression.mjs`

## Limites e decisão

**APTO COMO APK DE TESTE LOCAL AUDITADO; aparência e reprodução física pendentes.** A ausência de botão/marca estática no preparo foi validada em fonte/recursos compilados, sem alegar observação no dispositivo. Primeiro quadro, tempo de abertura, áudio/foco, máscaras/splash OEM, rotação, CPU/PSS e liberação de decoder aguardam protocolo físico em PHYSICAL_TEST_PLAN.md. Nenhum número de desempenho físico novo foi inventado.

O ciclo04 continua excluído; controle de dados móveis não integra este APK. Os FAILs06 de trailer/Back e meta60/piscadas continuam abertos. Não há nova homologação integral. Zero install/update/uninstall/clear/reset/reboot/ADB, commit/push/merge/PR/deploy/backend ou rollback. **NEXT_GATE_STARTED=NAO.**
