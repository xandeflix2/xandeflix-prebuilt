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


## Orquestração de validação

Com fontes e grants congelados, a regressão canônica e as verificações/builds podem executar em processos independentes com saídas próprias; nenhuma etapa altera arquivos gerenciados. Build APK usa fresh C11 e só o dist concluído; entrega/auditoria dependem de todos os13 comandos oficiais e testes nativos aprovados. Rodada canônica produz somente seu próprio resultado, sem executar Gradle. Não encerrar a regressão para entregar mais cedo nem interpretar APK compilado como aprovação antes dos checks.


## Intro07 R1 — fechamento local

RESULT=INTRO_VIDEO_ONLY_07_R1_APK_VALIDATED_PHYSICAL_PENDING. Novo APK C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-intro-video-sem-botao-20261026.apk, SHA256 fd82bb15d941f4e3de3b2b354eee43d4a8253d655dc97a23b16d6d59c6a8f16a. Sem botão Pular nem marca estática no preparo; transição preta e vetor transparente. Fallback de erro/teclas/lifecycle preservados.204 controles34 suítes/14 casos intro/257 testes39 suítes e13 checks oficiais/assemble/auditoria PASS.39 recibos/937 protegidos,38 históricos e root/03/04/05/06/07 intactos. Fonte do teste atualizada somente para o requisito explícito substituído; nenhum limite relaxado. Nenhuma operação física/Git/backend. Relatório C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/app-intro-video-only-07-r1-20261026/REPORT.md. NEXT_GATE_STARTED=NAO.
