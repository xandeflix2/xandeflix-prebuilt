# C11 — Evidências da correção de diretórios de promoção

## Escopo e proveniência — 2026-10-03

Execução autorizada pelo `sim` do usuário após diagnóstico das capturas.
Workspace exclusivo: `C:\Xandeflix\xandeflix-prebuilt-c11-main`.
Origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, branch `main`, HEAD
`f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`, ahead 2.
AGENTS, Architecture Contract, Execution Contract e Source Data Boundary lidos
antes do patch. CURRENT_GATE=NONE; correção isolada, nenhum novo Gate iniciado.

[Especificação anterior ao código e allowlist](../architecture/C11_CATALOG_PROMOTION_DIRECTORY_FIX.md).
36 hashes da baseline dirty foram capturados; antes de atualizar documentação,
35 continuavam idênticos. O único arquivo funcional alterado neste ciclo é
`src/bootstrap/storage/capacitor-filesystem.storage.ts`. Alterações anteriores de
ativação, importação, UI, Android e configuração foram preservadas.
Na conferência final, 32 hashes da baseline continuam idênticos; os quatro
alterados são apenas storage e STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS.
HEAD/branch permaneceram iguais; hash do APK confere com este relatório.

Sem commit/push/PR, backend, licenças remotas, credenciais reais, reinstalação,
limpeza, desvinculação ou comandos nos aparelhos. O APK anterior da raiz foi
substituído pelo novo build solicitado; nenhuma instalação foi apagada.

## Defeito confirmado no código

As capturas fornecidas pelo usuário mostram AUTHORIZED, SOURCE_READY e
DELIVERY_RESULT=STORED. A Home mostra PROMOTION_FAILED/Missing parent directory.
Não são evidência de recusa de licença: a falha observada é posterior à entrega.

`ensureDir` era no-op, supondo que rename/copy criariam os diretórios pai.
No SDK instalado (@capacitor/filesystem 7.1.8), CopyOptions/RenameOptions não têm
recursive. O plugin Kotlin mapeia NoParentDirectory para OS-PLUG-FILE-0011 e
AlreadyExists para OS-PLUG-FILE-0010. O adapter web usa a mensagem exata
`Current directory does already exist.`. Ambos precisam de mkdir explícito.

Controles negativos executam o módulo de produção com somente o corpo de
ensureDir restaurado ao no-op, em memória:

- Parent ausente, rename disponível: REJECTED/PROMOTION_FAILED/Missing parent directory.
- Parent ausente, rename indisponível: mesma falha no fallback copy.
- Parent existente, rename disponível: PROMOTED.

Isso reproduz o defeito e explica uma possível diferença entre aparelhos com
históricos de diretórios distintos. O filesystem dos aparelhos não foi inspecionado;
não é uma confirmação física de que esse era o estado de cada dispositivo.

## Patch mínimo

- ensureDir executa Filesystem.mkdir em Directory.Data, recursive=true.
- Só suprime código OS-PLUG-FILE-0010/EEXIST ou a mensagem web exata, após
  stat confirmar type=directory. Conflito com arquivo e outros erros propagam.
- Rename continua primário e copy continua fallback, com criação de parent,
  target e segments já solicitada pelos pontos existentes.
- Antes de qualquer rmdir do target, a promoção consulta o ponteiro ativo.
  Repetição/conflito com o mesmo snapshotId é rejeitado com
  STORAGE_PROMOTION_ACTIVE_CONFLICT; nunca sobrescreve essa geração em-place.
  Importações normais criam novos IDs de snapshot e não são afetadas.
- Falhas obrigatórias de mkdir/copy não avançam o ponteiro; o fallback limpa
  apenas o target candidato. A organização do catálogo e o pipeline de memória
  não foram alterados. Não foi redesenhada a gravação do active.json nem
  certificada atomicidade contra queda de energia.

## Validações executadas

1. `node scripts/test-c11-catalog-promotion-directories.mjs`: **27/27 PASS**.
   O módulo TypeScript real é carregado com uma bridge estrita em memória:
   rename/copy jamais criam parents automaticamente. Cobertura de instalação
   limpa, diretórios existentes (nativo/web/EEXIST), race de mkdir, fallback,
   segmentos com/sem prefixo, target parcial não ativo, erros de permissão,
   disco/bridge/stat, conflito com arquivo, falhas de cópia obrigatória,
   preservação de snapshot/identidade/chave/ativação e conflito com snapshot ativo.
   Inclui stageArtifacts real -> BootstrapService/PackageImporter -> storage
   -> initialize ACTIVE_CATALOG_READY -> read model consumido pela UI.
   Não é teste do plugin nativo no aparelho.
2. `node scripts/test-c11-new-device-activation.mjs`: **21/21 PASS**;
   apenas mocks isolados, sem consultas/escritas no backend real.
3. `node scripts/test-c11-bounded-memory-import.mjs`: **PASS**, 250.000 registros
   sintéticos; 79 checkpoints TEST_Tn=PASS (numeração vai até T83, sem T23–T26).
   Inclui promoção, preservação do ativo em falhas, proveniência, package hash,
   recuperação e elegibilidade de busca após promoção. RSS observado no host:
   92 MB início, 284 MB após busca; não é SLA nem medição Android.
4. `node scripts/test-r2f8j-staging-promotion-boundary.mjs`: **11 casos funcionais
   PASS; suíte incompleta**. T12 falha ao ler
   `scripts/test-r2f8c1-content-kind-classifier-lock.mjs` (ENOENT).
   O arquivo não existe também no HEAD: deficiência da baseline, não criada
   por este patch. Não foi adicionado um stub nem alterada a suíte fora da allowlist.
5. `npm run build`: **PASS**, tsc + Vite; nenhum aviso crypto/node:crypto
   externalizado. Persistem avisos de node:fs/node:path em builder/validator,
   imports dinâmicos/estáticos e chunk grande, fora do escopo desta correção.
6. `npx cap sync android`: **PASS**, browser 7.0.5/filesystem 7.1.8.
7. `android\.\gradlew.bat assembleDebug`: **BUILD SUCCESSFUL**, 142 tarefas,
   25 executadas. Persistem os avisos flatDir de configuração existentes.
8. Copy-Item do app-debug.apk para o APK da raiz: **PASS**; bytes idênticos.
9. Inspeção ZIP: os **5 arquivos dist** são idênticos aos assets do APK;
   markers da correção estão no bundle. Config embutida tem androidScheme=https
   e nenhum server.url, mantendo o APK standalone.
10. aapt/apksigner: package com.xandeflix.prebuilt, versionCode=1,
    versionName=1.0, minSdk=23, targetSdk=35; assinatura v1/v2 válida, mesmo
    certificado debug do artefato anterior.

A skill de verificação orientou os testes para o fluxo completo relevante,
incluindo staging real e leitura do catálogo após promoção, além do helper.
Não foi usado navegador: ele não exercitaria a operação nativa defeituosa.

## Artefato entregue

- Arquivo: `C:\Xandeflix\xandeflix-prebuilt-c11-main\Xandeflix-v1.0.0-standalone.apk`.
- Tamanho: **9.261.140 bytes**.
- SHA-256: `8828F12016892A29E3B15D0009315E3A404D4C2495F6FB8A2105DE5D15FD4B8C`.
- Certificado SHA-256: `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.

## Limitações e próximo passo autorizado ao usuário

Resultado: LOCAL_AND_BRIDGE_MODEL_VERIFIED_APK_BUILT; validação física pendente.
Não foi testado download de fonte real, playback ou comportamento OEM no novo
APK. O relato físico de ativação pertence ao APK anterior, não certifica este.

Atualizar por cima do app existente, sem desinstalar, limpar dados ou desvincular.
Depois abrir Home e Tentar Novamente. Confirmar nos dois aparelhos que código,
chave e AUTHORIZED foram mantidos e que o catálogo carregou sem PROMOTION_FAILED.
Se o Android bloquear a atualização por assinatura, não desinstalar: registrar
a mensagem para comparar a procedência do APK instalado.

Falhas históricas da suíte, blank line EOF preexistente no storage e avisos de
build foram registrados, sem refatoração fora da allowlist. Não há novo Gate,
atuação no projeto protegido ou promessa de resultado físico não observado.
