# C11 — Consolidação Git no repositório existente — 2026-10-05

## Emenda vigente — novo commit local e análise do push — 2026-10-05

Pedido explícito do usuário: "prossiga com o commit e analise para o push".
GIT_COMMIT_AUTHORIZED=SIM, somente o novo checkpoint descrito abaixo;
GIT_PUSH_AUTHORIZED=NAO_NESTE_CICLO_ANALISE_SOMENTE;
GIT_PR_AUTHORIZED=NAO; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
A retenção administrativa do push continua vigente. Esta emenda não autoriza
deploy, backend/migrations, integração, instalação/reset, limpeza ou novo patch.

Preflight: workspace/toplevel C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
995de5f767a14276bc2f4ca58944e4f7af95ca4e. Main remoto reconsultado:
e99f830a24b5de6dd74b4397f1ed6f0995bc8483; três commits locais, índice vazio,
oito tracked modificados e onze arquivos novos das duas entregas recentes.
Os sete operacionais excluídos abaixo permanecem locais, sem exclusão/edição.
AGENTS, Architecture, Execution, Source Data Boundary e Activation Lock relidos.
Proveniência funcional: C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION e
C11_ACTIVATION_KEY_VISIBILITY; nenhuma alteração funcional adicional neste ciclo.

Allowlist literal deste novo commit (21 arquivos, substitui o manifesto antigo
somente para este ciclo):

- docs/ERRORS_AND_BLOCKERS.md
- docs/EVOLUTION_REPORT.md
- docs/STATUS.md
- docs/architecture/C11_GIT_CONSOLIDATION.md
- docs/evidence/C11_GIT_CONSOLIDATION.md
- docs/architecture/C11_ACTIVATION_KEY_VISIBILITY.md
- docs/architecture/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md
- docs/evidence/C11_ACTIVATION_KEY_VISIBILITY.md
- docs/evidence/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md
- src/debug/manager/AdminCustomersView.tsx
- src/debug/manager/ManagerPanelPage.tsx
- src/debug/manager/ExclusiveDeviceSourceForm.tsx
- src/debug/manager/exclusive-device-source.ts
- src/index.css
- src/ui/components/Header.tsx
- src/ui/pages/ActivationPage.tsx
- scripts/exclusive-device-source-fixture.html
- scripts/exclusive-device-source-fixture.tsx
- scripts/test-c11-activation-key-visibility.mjs
- scripts/test-c11-exclusive-device-source.mjs
- scripts/verify-c11-exclusive-device-source.mjs

Novas edições permitidas: somente este plano, sua evidência, STATUS, EVOLUTION
e ERRORS, para registrar revisão/validação/limites. Os outros candidatos devem
ficar byte-idênticos. Saídas ignoradas de testes/build web são regeneráveis;
APK entregue deve conservar SHA256
F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8.
433 hashes congelados em memória antes da emenda, incluindo runtime, candidatos
e sete operacionais. Não incluir APK, env, capturas reais, dados privados ou build.

Sequência: revisar os patches/testes/evidências; varredura sanitizada de segredos
nos candidatos e commits inéditos; lock canônico, testes dos dois patches,
regressões relevantes, typecheck/build web; diff --check e hashes; staging
literal auditado; commit novo sem amend; verificar parent/manifesto/índice/status.
Não relaxar testes. Falha textual legada manager-form T15 é registrada como
pendência anterior, não deve ser apresentada como suite integralmente aprovada.

Análise remota somente leitura: main vivo, permissões/Actions/checks/deployments/
hooks GitHub, projetos Vercel ligados ao repositório nos escopos acessíveis,
metadata Supabase e opções GitHub quando acessíveis. Ausência de projeto/checks
ou branches não prova ausência universal de deploy. Nenhum token/URL sensível
de hook/env deve aparecer em logs ou documentos. Sem permissão administrativa,
pedir confirmação das integrações; não alterar opções para contornar a retenção.
Push posterior exige decisão explícita, reconferência do remoto e fast-forward;
divergência/colisão/regressão exige STOP. Git comum/pastas originais preservados.

Aceitação deste ciclo: checkpoint local revisado, 21 arquivos exatos, somente
sete operacionais não rastreados, índice vazio, runtime/APK intactos em relação
ao início deste ciclo; relatório honesto de testes e risco/limite do push.
O critério histórico "GitHub main aponta" abaixo não é resultado deste ciclo.

### Decisão da análise após capturas administrativas do usuário

Usuário forneceu as telas corretas do Supabase e GitHub: repo esperado conectado,
Deploy to production OFF, lista de webhooks vazia e somente Supabase na lista
Installed GitHub Apps. Vercel connector sem vínculo nos escopos acessíveis;
Actions/checks/deployments sem registros. A incógnita administrativa anterior
fica esclarecida pelas evidências disponíveis; não se identificou gatilho de
deploy de produção. Não é certificação universal de outros provedores/contas.
Nenhuma opção foi alterada pelo agente e nenhum push foi executado.

Conclusão: checkpoint apto para propor push normal de main a origin, após nova
confirmação expressa e reconferência do SHA remoto/fast-forward. Nesta tarefa,
o pedido é commit + análise; GIT_PUSH_AUTHORIZED=NAO_NESTE_CICLO permanece.
Esta decisão supera a retenção por falta de capturas descrita historicamente
abaixo, não autoriza deploy/migração ou resolve drift de schema, HTTP403 ou beta.

## Autorização e escopo anterior à execução

Usuário descartou criar outro repositório e pediu seguir o plano de consolidar
esta worktree em xandeflix2/xandeflix-prebuilt, após proposta de commit/push
condicionados à revisão e testes. GIT_COMMIT_AUTHORIZED=SIM;
GIT_PUSH_AUTHORIZED=SIM_CONDICIONADO_A_VALIDACAO_E_SEGURANCA_DE_DEPLOY;
GIT_PR_AUTHORIZED=NAO; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Checkpoint de código da C11, não release comercial ou certificação da beta
com mais de100 dispositivos. Não criar repo/backend/banco, alterar identidade,
licença/player/assinatura/package, resetar aparelhos, executar carga remota,
merge/cherry-pick do original, force-push, purgar dados ou excluir diretórios.

Preflight: workspace/toplevel C:\Xandeflix\xandeflix-prebuilt-c11-main;
origin https://github.com/xandeflix2/xandeflix-prebuilt.git; main; HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba; main remoto observado
e99f830a24b5de6dd74b4397f1ed6f0995bc8483. Dois commits locais anteriores,
49 arquivos modificados/64 não rastreados; índice inicialmente vazio.
AGENTS/Architecture/Execution/Source Data Boundary/lock relidos. Repositório
público: nenhum segredo, dado de usuário ou captura/log privado no Git.

A C11 já é main do mesmo Git, não requer merge de árvores nem troca de origin.
Git comum fica em C:\Xandeflix\xandeflix-prebuilt\.git; operações Git iniciadas
somente na C11 atualizam naturalmente essa metadata compartilhada. Nenhum comando
ou edição na árvore histórica, nem no original Dropbox/com.xandeflix.app.
Não apagar pasta antiga ou arquivo .git apontador; push não torna clone independente.

## Allowlist de publicação das alterações preexistentes revisadas

- AGENTS.md
- android/app/src/main/AndroidManifest.xml
- android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java
- android/app/src/main/java/com/xandeflix/prebuilt/source/LargeSourceTransportPlugin.java
- capacitor.config.ts
- docs/ERRORS_AND_BLOCKERS.md
- docs/EVOLUTION_REPORT.md
- docs/STATUS.md
- docs/architecture/XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md
- docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md
- package.json
- scripts/test-c11-bounded-memory-import.mjs
- src/App.tsx
- src/bootstrap/boot-sync-coordinator.ts
- src/bootstrap/storage/capacitor-filesystem.storage.ts
- src/catalog/catalog-selectors.ts
- src/catalog/live/live-tv.types.ts
- src/catalog/segmented-browse.service.ts
- src/contracts/catalog.ts
- src/control-plane/client/device-activation-sync.service.ts
- src/control-plane/client/device-activation.service.ts
- src/control-plane/client/installation-registry.service.ts
- src/control-plane/client/public-device-activation.service.ts
- src/device/device-identity.service.ts
- src/experiments/search-compact-v2/compact-search-v2-builder.ts
- src/index.css
- src/playback/native-android-player.bridge.ts
- src/provisioning/integrity.ts
- src/search/search-engine.ts
- src/search/search-index-builder.ts
- src/search/search-index.types.ts
- src/security/artifact-hash.ts
- src/source/content-kind-classifier.ts
- src/source/device-direct-fetch.ts
- src/source/large-source-transport.bridge.ts
- src/source/m3u-bounded-staging-writer.ts
- src/source/m3u-line-stream.ts
- src/source/real-source-importer.service.ts
- src/source/source-classification-profile.ts
- src/ui/components/AppShell.tsx
- src/ui/components/AsyncCategoryRail.tsx
- src/ui/components/Header.tsx
- src/ui/components/SearchResults.tsx
- src/ui/hooks/useDpadNavigation.ts
- src/ui/pages/ActivationPage.tsx
- src/ui/pages/HomePage.tsx
- src/ui/pages/LiveTvPage.tsx
- android/app/src/main/res/xml/backup_rules.xml
- android/app/src/main/res/xml/data_extraction_rules.xml
- android/app/src/test/java/com/xandeflix/prebuilt/PhoneUiOrientationPolicyTest.java
- android/app/src/test/java/com/xandeflix/prebuilt/player/NativeLivePreviewTapTest.java
- android/app/src/test/java/com/xandeflix/prebuilt/player/NativePlaybackErrorNoticeTest.java
- docs/architecture/C11_CATALOG_PROMOTION_DIRECTORY_FIX.md
- docs/architecture/C11_FIRE_STICK_BRIDGE_RETENTION_FIX.md
- docs/architecture/C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md
- docs/architecture/C11_LANDSCAPE_SIDE_NAVIGATION.md
- docs/architecture/C11_LIVE_FULLSCREEN_GESTURES.md
- docs/architecture/C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP.md
- docs/architecture/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md
- docs/architecture/C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md
- docs/architecture/C11_NEW_DEVICE_ACTIVATION_FIX.md
- docs/architecture/C11_NEW_DEVICE_ACTIVATION_LOCK.md
- docs/architecture/C11_PLAYBACK_ERROR_NOTICE_FIX.md
- docs/architecture/C11_SAFE_WORKSPACE_CLEANUP.md
- docs/evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md
- docs/evidence/C11_CATALOG_PROMOTION_DIRECTORY_FIX.md
- docs/evidence/C11_FIRE_STICK_BRIDGE_RETENTION_FIX.md
- docs/evidence/C11_FIRE_STICK_CLEAN_INSTALL_TEST.md
- docs/evidence/C11_FIRE_STICK_STARTUP_DIAGNOSIS.md
- docs/evidence/C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md
- docs/evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md
- docs/evidence/C11_LIVE_FULLSCREEN_GESTURES.md
- docs/evidence/C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP.md
- docs/evidence/C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md
- docs/evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md
- docs/evidence/C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md
- docs/evidence/C11_LIVE_PREVIEW_REFERENCE_LAYOUT.md
- docs/evidence/C11_NEW_DEVICE_ACTIVATION_FIX.md
- docs/evidence/C11_PLAYBACK_ERROR_NOTICE_FIX.md
- docs/evidence/C11_SAFE_WORKSPACE_CLEANUP.md
- docs/evidence/C11_TABLET_APK_UPDATE_AND_SEARCH_DETAIL_DIAGNOSIS.md
- docs/evidence/c11-activation-hung.png
- docs/evidence/c11-activation-retry.png
- scripts/activation-browser-fixture.html
- scripts/landscape-navigation-fixture.html
- scripts/landscape-navigation-fixture.tsx
- scripts/playback-error-notice-fixture.html
- scripts/playback-error-notice-fixture.tsx
- scripts/test-c11-catalog-promotion-directories.mjs
- scripts/test-c11-clean-install-playback-diagnostic.mjs
- scripts/test-c11-fire-stick-import-retention.mjs
- scripts/test-c11-landscape-navigation-browser.mjs
- scripts/test-c11-landscape-navigation.mjs
- scripts/test-c11-live-fullscreen-backdrop.mjs
- scripts/test-c11-native-bridge-retention.mjs
- scripts/test-c11-new-device-activation-lock.mjs
- scripts/test-c11-new-device-activation.mjs
- scripts/test-c11-phone-ui-orientation.mjs
- scripts/test-c11-playback-error-notice.mjs
- src/control-plane/client/activation-timeout.ts
- src/playback/native-playback-error-notice.ts
- src/ui/components/PlaybackErrorNotice.tsx
- src/ui/hooks/useLandscapeNavigation.ts
- src/ui/navigation/landscape-navigation.ts

Arquivos locais preservados e excluídos da publicação (não apagar):

- deploy-wifi.ps1
- monitor-firetv.ps1
- sync_sample.txt
- scripts/audit-tablet-final.ps1
- scripts/monitor-sync.ps1
- scripts/test-clean-activation-home.ps1
- scripts/verify-c11-side-navigation-firestick.mjs

São utilitários/captura operacionais vinculados ao ambiente físico, não runtime.
Não usar git add .; staging literal somente do manifesto revisado e documentação
abaixo. Preservar demais alterações do usuário, inclusive ignorados/segredos
existentes; não modificar .gitignore para esconder pendências.

## Allowlist de novas edições neste ciclo

- Este plano e docs/evidence/C11_GIT_CONSOLIDATION.md.
- docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md: registros.
- src/bootstrap/storage/capacitor-filesystem.storage.ts: somente retirar linha
  vazia extra no EOF apontada por git diff --check, sem mudança funcional.
- Saídas regeneráveis dos testes/build web e artefato local de backup Git sob tmp.

Nenhuma nova edição de TSX/Java/backend/SQL/config/dependência/CI neste checkpoint.
CI, release assinado, publicação web Gestor e revisão formal dos TARGETs históricos
ficam como preparação posterior da beta, sem fingir homologação nesta entrega.

## Segurança e sequência

1. Congelar hashes em memória dos candidatos e runtime/APK; backup Git local
   gerado e verificado em tmp, sem env, credenciais ou dados dos aparelhos.
2. Varredura sanitizada dos arquivos e de cada commit ainda não publicado,
   revisão de provenance/segredos/fixtures, sem imprimir valores privados.
3. Rodar lock antes/depois de whitespace; typecheck, testes C11/UI/playback/
   import/retention relevantes e build web com prebuild obrigatório.
4. Conferir Git diff --check e hashes: fonte funcional/APK preservados, somente
   edição EOF/documentos admitidos. Build deve falhar se surgir warning crypto.
5. Conferir efeito do push em integrações. Pergunta ao usuário sobre deploy
   automático antes da publicação; não tratar ausência de .github como prova.
6. Staging literal auditado, commit descritivo; push não-forçado somente main
   para origin canônico, após reconferir remoto. Divergência/falha exige parada.
7. Confirmar SHA remoto/arquivos publicados/estado Git e registrar resultado.

Supabase skill usada para fronteira de segurança: não executar db push/apply
migration/deploy. Leitura de metadata confirmou projeto existente ACTIVE_HEALTHY;
46 migrações remotas e44 arquivos locais, com timestamps divergentes. Isso não
é autorização de reconciliação automática nem prova de schema equivalente.
Se push disparar deploy, parar para direção explícita; não mudar integração.

## Decisão após revisão de integrações

Usuário informou não saber se existe deploy automático. Publicação permanece
retida até inspeção administrativa: NÃO executar push nesta etapa. Leitura via
GitHub CLI: zero workflows/runs/environments/check-runs/deployments/statuses;
webhooks retornaram HTTP404, que não comprova ausência de hooks. Supabase
retornou zero branches, que também não comprova ausência de integração GitHub.
Não alterar instalações de Apps, hooks ou opções de deploy para contornar isso.
Preparar somente checkpoint local revisado; main remoto continua e99f830.
Resultado parcial e limitações em docs/evidence/C11_GIT_CONSOLIDATION.md.

## Aceitação e limites

GitHub main aponta para checkpoint revisado incluindo fix/lock/tests/doc C11;
nenhum segredo ou arquivo operacional excluído entrou no commit; nenhum
force-push/alteração backend/aparelho/limpeza. Testes/build PASS; APK existente
EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F intacto.
Repos/árvores originais preservados e sete utilitários locais restantes explicitados.
A meta Fire Stick<=60s segue aberta; stress>100 dispositivos não executado nem
certificado; backend real não foi auditado integralmente. STOP se latest regression.
