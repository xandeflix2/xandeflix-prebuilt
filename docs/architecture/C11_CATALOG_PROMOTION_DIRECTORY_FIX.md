# C11 — Correção de diretórios na promoção do catálogo

## Autorização e preflight (2026-10-03)

O usuário autorizou (`sim`) corrigir a criação das pastas e recompilar o APK,
preservando códigos, chaves e ativações. Ciclo corretivo isolado, sem novo Gate.

- Cwd/top-level: `C:\Xandeflix\xandeflix-prebuilt-c11-main`.
- Origin: `https://github.com/xandeflix2/xandeflix-prebuilt.git`; branch `main`.
- HEAD: `f0fdb6840c21e7a660f1662f2bbac9f2cd241cba` (ahead 2).
- AGENTS, Architecture Contract, Execution Contract e Source Data Boundary lidos.
- Baseline dirty preservada; 36 hashes de arquivos modificados capturados antes
  do patch. Nenhuma escrita no workspace histórico ou no projeto protegido.
- Commit/push/PR, backend, credenciais, uninstall, reset e instalação física:
  não autorizados neste ciclo.

## Causa e limite

A captura exibe AUTHORIZED, SOURCE_READY e DELIVERY_RESULT=STORED, mas a Home
falha com PROMOTION_FAILED/Missing parent directory. `ensureDir` é no-op:
rename exige o parent `prebuilt/snapshots`; fallback copy exige target/segments.
CopyOptions/RenameOptions não contêm recursive; o SDK instalado usa mkdir para
criar diretórios. Simulação prévia: instalação limpa falha (OS-PLUG-FILE-0011),
parent existente permite rename e fallback sem target volta a falhar.

## Allowlist estrita

- `src/bootstrap/storage/capacitor-filesystem.storage.ts`: criação idempotente
  de diretórios e proteção contra excluir o snapshot atualmente ativo.
- `scripts/test-c11-catalog-promotion-directories.mjs`.
- Este documento e `docs/evidence/C11_CATALOG_PROMOTION_DIRECTORY_FIX.md`.
- `docs/STATUS.md`, `docs/EVOLUTION_REPORT.md`, `docs/ERRORS_AND_BLOCKERS.md`.
- Saídas normais npm build/cap sync/assembleDebug e APK raiz solicitado.

## Especificação e aceitação

1. Implementar mkdir com Directory.Data e recursive=true. Somente erros de
   diretório já existente podem ser aceitos, após stat confirmar tipo directory.
   Não engolir permissão negada, falta de espaço, bridge ou conflito com arquivo.
2. Rename continua sendo a rota principal. Copy continua sendo fallback,
   usando os diretórios de destino garantidos antes da escrita.
3. Nenhuma rotina de criação apaga/recria dados existentes. Proteção impede
   rmdir/overwrite do snapshot apontado pelo active.json em repetição/conflito.
4. Ponteiro só é atualizado depois de concluir todos arquivos obrigatórios e
   segmentos. Falha de mkdir/copy não promove candidato incompleto e preserva
   snapshot anterior e arquivos de identidade/ativação.
5. Testes usam adapter de filesystem estrito em memória, com diretórios reais
   no modelo: instalação limpa, parent existente, fallback, segments, mkdir já
   existente (nativo/web), erro de permissão, erro de cópia, conflito com arquivo,
   repetição/conflito com snapshot ativo e código anterior como baseline negativo.
6. Regressões de staging/promoção, importação bounded-memory e ativação local;
   typecheck/build/sync/assembleDebug; inspecionar assets, package e assinatura.
7. Não alterar autorização, identidade, políticas de licença, schema, parsing,
   volume de catálogo, playback ou memória do pipeline. Não limpar os aparelhos.

## Validação física

Não certificar a correção no aparelho sem testá-la. Entregar APK para atualização
por cima da instalação atual, com a mesma assinatura debug, sem desvincular.
Validação física e eventuais particularidades OEM permanecem pendentes até teste.

Referência do SDK: https://capacitorjs.com/docs/v7/apis/filesystem#copyoptions
