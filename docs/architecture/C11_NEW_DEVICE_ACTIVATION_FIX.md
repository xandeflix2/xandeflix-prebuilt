# C11 — Correção local de ativação em instalação nova

Autorização: solicitação do usuário para corrigir geração/exibição de código e chave,
seguida de `prossiga com a correção`. Este ciclo não inicia outro Gate arquitetural.

## Preflight e proveniência

- Workspace/top-level: `C:\Xandeflix\xandeflix-prebuilt-c11-main`.
- Origin: `https://github.com/xandeflix2/xandeflix-prebuilt.git`; branch `main`.
- HEAD inicial: `f0fdb6840c21e7a660f1662f2bbac9f2cd241cba` (ahead 2).
- AGENTS, Architecture Contract, Execution Contract e Source Data Boundary lidos.
- Worktree já dirty: alterações de importação C11 e correção inicial de crypto
  preservadas. Não há autorização de commit/push/PR, migração, escrita remota,
  reinstalação física ou limpeza de dados. Workspace histórico não será alterado.

## Allowlist deste ciclo

- `src/device/device-identity.service.ts`
- `src/ui/pages/ActivationPage.tsx`
- `src/control-plane/client/device-activation-sync.service.ts`
- `src/control-plane/client/device-activation.service.ts`
- `src/control-plane/client/public-device-activation.service.ts`
- `src/control-plane/client/installation-registry.service.ts`
- `src/control-plane/client/activation-timeout.ts`
- `src/App.tsx` (somente disparo/retry da ativação pendente)
- `src/bootstrap/boot-sync-coordinator.ts` (guarda já aplicada, validação)
- `capacitor.config.ts` (HTTPS já aplicado, validação)
- `scripts/test-c11-new-device-activation.mjs`, `scripts/activation-browser-fixture.html`
- Este documento, `docs/STATUS.md`, `docs/EVOLUTION_REPORT.md`,
  `docs/ERRORS_AND_BLOCKERS.md` e `docs/evidence/C11_NEW_DEVICE_ACTIVATION_FIX.md`.
- Capturas sintéticas `docs/evidence/c11-activation-{hung,retry}.png`.
- Saídas normais de build/sync Android e APK raiz solicitado.
- `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/res/xml/backup_rules.xml`
  e `android/app/src/main/res/xml/data_extraction_rules.xml`: exclusão específica
  da identidade/ativação e WebView do backup/transferência, mantendo demais dados.

## Critérios de aceitação

1. Identidade, instalação e chave de seis dígitos são locais e persistentes,
   exibidas antes de reativação, reporte de instalação ou consulta de fontes.
2. Singleton impede duas gerações. Retry mantém candidato após falha de escrita;
   timeout de leitura sem cópia confiável não provoca geração/rotação.
3. Pelo menos uma persistência verificada precede uso de valores novos.
4. SHA-256 real (64 hex minúsculos) funciona sem subtle, com digest rejeitado
   ou pendente. Nenhum módulo Node é importado pelo código de identidade.
5. Registro A1 é serializado, registra a chave permanente e não substitui sessão
   pendente por mera indisponibilidade de rede. Local READY não significa licença.
6. Instalação limpa permanece não autorizada, sem falso erro de licença inválida.
7. UI apresenta erro recuperável/retry; chamadas pendentes são limitadas.
8. Testes controlados cobrem offline, concorrência, remount/reload, falha de
   persistência, SHA e contrato de registro. Não escrever no Supabase real.
9. Build web, sync e assembleDebug; APK na raiz. Validação física em aparelho
   novo permanece pendente se não executada; build não é prova de E2E físico.

## Limites

Não alterar políticas de autorização, banco, catálogo, playback ou importação.
Android Backup foi avaliado: `allowBackup=true` sem exclusões pode restaurar
identidade/chave antiga em outro aparelho. Exclusões limitadas aos cinco arquivos
canônicos e ao armazenamento WebView corrigem esse risco sem desativar todo backup.
Referência: https://developer.android.com/identity/data/autobackup
Transferências físicas não foram executadas. Prazos técnicos não são SLAs de produto.
