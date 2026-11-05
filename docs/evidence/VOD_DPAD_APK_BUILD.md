# Entrega APK — D-pad10s — 2026-10-25

Pedido explícito atual GERE O APK ATUALIZADO autoriza build/entrega da correção CANON-01-VOD-DPAD-HIDDEN-CONTROLS já encerrada e validada. Substitui somente a ausência de autorização de APK naquele ciclo anterior; não autoriza instalação/reset, Git/publicação/backend ou mudança de implementação. Gerar em cópia independente da árvore encerrada, root/L1/recebido congelados. Mesma1.0.37/code37/package/certificado usados nos APKs locais atuais; sem alteração de versão/dependências/manifest ou fonte.

Nenhuma alteração de código/teste/recibo: preservar33 recibos/908 protegidos, todos os hashes de fonte/testes da correção.179+3=182 controles/29 suítes e123 verificações de integração vêm da execução real anterior, identificada por log/hash. Não declarar canon:test reexecutado. Rodar canon:check/C11 fresh, npm build com prebuild C11, Capacitor copy/registro oficial Browser/Filesystem/Share, C11 antes de Gradle, Android unit tests completos e assembleDebug offline, lock antes da entrega e auditoria de assinatura/identidade/permissões/assets/plugins/bytecode D-pad/privacidade. Native239 testes/38 suítes devem passar sem falhas/erros/skips.

Auditoria compara bundle físico do APK com todos os arquivos dist e confere registro de plugins, NetworkStatus manual e classe VodDpadController compilada. Não usar old/dist nem empacotar dados/credenciais da fonte. APK universal é entrega local para instalação manual; teste físico D-pad continua pendente, sem acesso aos aparelhos neste ciclo. Nenhum commit/push/PR/merge/deploy/admin/Supabase ou próxima implementação.

Allowlist documental6, append-only nos4 documentos existentes:
- docs/architecture/VOD_DPAD_APK_BUILD.md
- docs/evidence/VOD_DPAD_APK_BUILD.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Auth SHA256 UTF-8/LF 6a5d43dd96b796ac46b63d5a9a82dc46e3f0949dbee2eb648fc490afb403af72. Nenhum novo recibo de runtime: grants imutáveis33 já cobrem os bytes idênticos. Prova de build/artefato e autorização separadas nesta evidência.

## Pedido

```text
GERE O APK ATUALIZADO
```


## Entrega concluída — 2026-10-25

RESULT=APK_READY_FOR_MANUAL_INSTALL. APK Xandeflix-v1.0.37-dpad-10s-20261025.apk, SHA256 e057a523c802f84ae2c2788352493f0b3766309cd3d7255aace326adf48a35eb, 11427023bytes; package com.xandeflix.prebuilt,1.0.37/code37, assinatura anterior preservada b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d. Inclui a rota D-pad10s/OK oculto validada e todas as correções recebidas, sem alterar fonte/identidade/licença/C9/buffer/live ou lógica neste ciclo.

Build web com prebuildC11, Capacitor copy/registro oficial3 plugins, C11 pré-Gradle, testDebugUnitTest+assembleDebug offline, canon:check pós-build e lock de entrega exit0. Native239 testes/38 suítes,0 falhas/erros/skips executados novamente. Regressores182/29 e integração123 são execução imediatamente anterior com bytes de fonte/testes/recibos idênticos verificados e log/hash explícito; canon:test não foi repetido neste build-only. Vite emitiu aviso de chunk grande, sem falha ou mudança de configuração.

Auditoria PASS: assinatura/package/versão/permissões, todos os 8 arquivos dist comparados ao APK,3 plugins Capacitor e NetworkStatus registrado, classe VodDpadController em DEX e chamada dispatchHiddenVodDpad/seek/pause/show no bytecode compilado. Zero padrão de credencial privada encontrado no bundle e nenhum arquivo de identidade/ativação/fonte/cache/keystore no APK. Root/L1, recebido fechado,33 recibos e todos os arquivos de código/teste permanecem byte-idênticos. Só6 documentos desta entrega, existentes por append; índice vazio, HEAD/branch/main preservados.

A autorização atual GERE O APK ATUALIZADO foi registrada antes do build, SHA256 6a5d43dd96b796ac46b63d5a9a82dc46e3f0949dbee2eb648fc490afb403af72. Não houve instalação/reset/ADB/reprodução física, Git add/commit/push/PR/merge/main ou backend/admin/Supabase/deploy. Teste físico do controle Fire Stick/Android TV continua pendente, conforme roteiro da correção anterior. Nenhuma próxima implementação iniciada.

## Comandos reais desta entrega

| Comando | Exit code |
| --- | ---: |
| `git clone --no-hardlinks --no-checkout C:/Xandeflix/xandeflix-prebuilt-c11-main C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-apk-20261025/workspace` | 0 |
| `git remote set-url origin https://github.com/xandeflix2/xandeflix-prebuilt.git` | 0 |
| `git -c core.autocrlf=false checkout fix/source-output-format-recovery` | 0 |
| `npm run canon:check` | 0 |
| `npm run c11:new-device:lock` | 0 |
| `npm run build` | 0 |
| `C:\Program Files\nodejs\node.exe C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-apk-20261025/workspace/node_modules/@capacitor/cli/bin/capacitor copy android` | 0 |
| `npm run c11:new-device:lock` | 0 |
| `gradlew.bat --offline --no-daemon --max-workers=2 --console=plain testDebugUnitTest assembleDebug` | 0 |
| `npm run canon:check` | 0 |
| `npm run c11:new-device:lock` | 0 |

```json
{
  "result": "PASS",
  "delivery": "C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-dpad-10s-20261025.apk",
  "sha256": "e057a523c802f84ae2c2788352493f0b3766309cd3d7255aace326adf48a35eb",
  "bytes": 11427023,
  "packageId": "com.xandeflix.prebuilt",
  "versionName": "1.0.37",
  "versionCode": 37,
  "certificateSha256": "b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d",
  "native": {
    "tests": 239,
    "suites": 38,
    "failures": 0,
    "errors": 0,
    "skipped": 0
  },
  "canonicalControls": 182,
  "canonicalSuites": 29,
  "corePluginRegistry": "PASS",
  "newNetworkPluginCompiledAndRegistered": true,
  "permissionsUnchanged": true,
  "distFilesVerified": 8,
  "privatePatternsFound": 0,
  "officialCommands": "BUILD_CHAIN_PASS",
  "canonicalRegressionOrigin": "ACTUAL_PREVIOUS_VERIFIED_IDENTICAL_SOURCE",
  "dpadClassCompiledAndWired": true,
  "installedDevices": 0,
  "physicalDpadValidation": "PENDING",
  "existingLiveFreeze": "UNRESOLVED_OUTSIDE_THIS_FEATURE_PATCH"
}
```
