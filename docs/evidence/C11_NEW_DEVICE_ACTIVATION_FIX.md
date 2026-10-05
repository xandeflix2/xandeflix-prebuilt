# C11 — Evidência da correção de ativação local

Resultado: patch local verificado e APK gerado. Não é certificado de teste físico.

## Resultados

- 21 testes locais finais passaram: SHA-256 nativo/ausente/rejeitado/pendente,
  valores únicos concorrentes, reload, offline, persistência em cada storage,
  falha dupla com retry sem rotação, leitura pendente, contrato de hash A1,
  registro único, status indeterminado, leitura negada sem rotação, arquivo nativo
  read-only, guarda de boot limpo, backup e boot autorizado preservando catálogo.
- Navegador isolado com backend simulado: código/chave prontos offline,
  loading encerrado, nenhum falso aviso de licença inválida e nenhum overlay.
- Remount/reload: mesmos valores persistidos e chave pronta.
- Rede pendente: chave pronta sem loading infinito. Digest rejeitado: chave/código
  prontos. Falha em ambos os storages: erro local, copiar desabilitado, zero RPCs;
  restaurado armazenamento e clicado retry: chave/código prontos, sem erro local.
- Backend simulado online: uma solicitação com hash de 64 hex e REGISTER_KEY
  concluído. Isso não prova disponibilidade ou configuração do backend real.
- Chamadas externas bloqueadas; nenhum dado real ou mutação no Supabase.

## Comandos e regressões

Todos executados com cwd no workspace c11-main (Gradle na subpasta android).

- `node scripts/test-c11-new-device-activation.mjs`: `21/21_PASS`.
- `node scripts/test-c11-rpc-claim-device-key-recovery.mjs`: `12/12_PASS`.
- `node scripts/test-c11-stale-activation-session-reconciliation.mjs`: `20/20_PASS`.
- `node scripts/test-c11-device-binding-fk-order-fix.mjs`: `16/16_PASS`.
- `node scripts/test-c11-remote-source-metadata-license-contract.mjs`: `9/9_PASS`.
- `npm run build`: PASS (`tsc && vite build`), sem externalização de crypto.
- `npx cap sync android`: PASS.
- `android\gradlew.bat assembleDebug`: `BUILD SUCCESSFUL` (final: 12s).
- `Copy-Item android\app\build\outputs\apk\debug\app-debug.apk .\Xandeflix-v1.0.0-standalone.apk -Force`: PASS.
- ZIP: appId correto, HTTPS, sem server.url, todos assets correspondem a dist,
  regras de backup e transferência empacotadas.
- `aapt dump badging`: `com.xandeflix.prebuilt`, versionCode 1, versionName 1.0,
  minSdk 23, targetSdk 35. Nome do arquivo solicitado mantido.
- `apksigner verify --verbose`: assinatura v1/v2 válida (debug).

## Artefato

- Caminho: `C:\Xandeflix\xandeflix-prebuilt-c11-main\Xandeflix-v1.0.0-standalone.apk`.
- Tamanho: `9.261.140 bytes`.
- SHA-256: `F9677E94981E206DD57AD45B3597B1449E29F15450467E3CA12DE9A211019D62`.
- Capturas: [rede pendente](c11-activation-hung.png), [retry](c11-activation-retry.png).
  Valores nas capturas são de sessão sintética, nunca cadastrados em conta real.

## Proveniência e baseline

HEAD permaneceu `f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`. Nenhum Git write.
14 hashes capturados de arquivos dirty fora do patch permaneceram idênticos;
demais alterações C11 iniciais não foram editadas por este ciclo. Allowlist na
[especificação](../architecture/C11_NEW_DEVICE_ACTIVATION_FIX.md).

Comparação read-only em memória: coordinator HEAD via `git show`, transpileModule
e VM; coordinator current via import. Mesma fixture legada sem getStorage resulta
em `TypeError: this.bootstrapService.getStorage is not a function` em ambos.
Fixture válida com profile v1 resulta em `LOCAL_FIRST_ACTIVE_PRESERVED` em ambos;
profile v2 com pointer completo retorna NO_OP no novo teste autorizado.
Não foi declarada aprovação da suíte global, nem foram alteradas fixtures legadas.

## Limites e orientação de validação física

Não houve instalação, desinstalação, reset de dados, migração ou operação no
Supabase real. Falha anterior da captura não foi reproduzida no mesmo aparelho.
Em aparelho novo, confirmar código XF e chave de seis dígitos offline; reiniciar
e verificar estabilidade; conectar à rede, registrar/parear no portal e confirmar
autorização/fonte. Não desinstalar dispositivos já autorizados para esse teste.

Backup/transferência: excluídos os cinco arquivos canônicos e `app_webview`,
mantendo os demais dados. Referência oficial:
https://developer.android.com/identity/data/autobackup
Transferência física/OEM e backups históricos não foram testados.

Orientações Supabase aplicadas: consultas atuais/SDK instalado, AbortSignal e
timeout no cliente, testes mockados sem mutação remota. Referências:
https://supabase.com/docs/reference/javascript/functions-invoke e
https://supabase.com/changelog.md (consultado por HTTP após parser web recusar Markdown).

Verificação de navegador guiou testes de falha/retry, console, snapshots e capturas;
nenhum erro JavaScript/overlay foi observado. A fixture de falha pode mostrar o
diagnóstico já existente de armazenamento de reativação; não é licença inválida.
Browsers e servidor Vite temporário foram encerrados. Build tem avisos não fatais
registrados em ERRORS_AND_BLOCKERS; nenhum refactor adicional foi realizado.
