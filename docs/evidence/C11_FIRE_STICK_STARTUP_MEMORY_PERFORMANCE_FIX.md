# C11 — Fire Stick: patch local de retenção e I/O

## Escopo e autoridade

Pedido explícito posterior ao diagnóstico: carregamento em no máximo 60s no
Fire Stick. Contrato/allowlist anteriores ao código em
../architecture/C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md. Sem novo Gate,
Git writes, backend, instalação/reset ou leitura de credenciais. Preflight
C11/origin/main/HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba correto.
Baseline imediato de 386 arquivos runtime/scripts/Android/config/APKs capturado;
dirty preexistente preservado. Skill investigation-mode orientou o diagnóstico
logs-first anterior, não autorizou mudanças de ativação ou de arquitetura.

## Evidência e patch

O crash físico anterior é V8 OOM durante importação no AFTSSS/API 28, seguido
de SIGTRAP do host após renderer perdido. O aparelho ainda usa APK 8828F120...;
não foi atualizado neste ciclo. Nenhum heap snapshot físico foi coletado.

Reprodução sintética isolada do reader + parsers reais: 24 blocos de texto
de ~2 MB, mantendo somente 24 títulos de série. Baseline falha no critério
de retenção, delta heap pós-GC ~48,068 MB; limpar os títulos libera os blocos.
No plugin Android observado, readChunk retorna dataText, consumido pelo reader.
Mecanismo de backing strings demonstrado no Node/V8, não retentor único
comprovado por snapshot no Fire Stick. TextDecoder de bytes no Node NÃO reteve
48 MB no baseline; registrado separadamente, sem alegar controle negativo
desse caminho.

Patch mínimo em dois arquivos de produção:

- m3u-line-stream.ts: materializa cada linha com roundtrip JSON de string antes
  de entregá-la; slices/títulos posteriores deixam de segurar chunks inteiros.
  Preserva UTF-16, inclusive surrogate isolado em entrada string. Limite de
  8 Mi caracteres também aplicado às linhas completas com newline, antes da
  materialização; o guard antigo só cobria o pending. Não serializa o catálogo
  inteiro. Mantém chunks nativos de 2 MB, evitando mais roundtrips de leitura.
- m3u-bounded-staging-writer.ts: batch padrão 1000 -> 2500, dentro do intervalo
  bounded existente. Para 100 mil episódios: 200 -> 80 arquivos principais de
  episodes/streams; com series/seasons, 208 -> 88 segmentos. Conteúdo completo,
  formato, ordem lógica de records, integridade e promoção continuam intactos.
  Mudam fronteiras/hash dos novos segmentos conforme o novo batch, sem bypass.

O parser EXTINF, importador, boot, storage/promoção, MainActivity, ativação,
player, config/package/backup e regras de licença não foram alterados neste
patch. Não adicionado handler nativo de renderer perdido: outras causas de
OOM ainda podem fechar o aplicativo; apenas suprimir SIGTRAP não resolveria
importação. Não exibida Home parcial/falsa nem removido conteúdo da fonte.

## Testes e limites

Novo scripts/test-c11-fire-stick-import-retention.mjs:

- Texto e bytes UTF-8: retenção após patch ~0,073 / 0,086 MB para 24 títulos.
- Controle negativo dataText com reader anterior rejeitado (~48,068 MB).
- Unicode/fracionamento de UTF-8, CRLF, BOM conforme decoder original, aspas
  escapadas, vírgulas quoted, malformed, surrogate isolado e guards de linha PASS.
- Importador real, transport nativo dataText simulado e sink que descarta payload:
  100 mil episódios / 10 mil séries / 10 mil temporadas, heap observado pós-GC
  máximo ~22,688 MB, 88 segmentos, máximo write nesta fixture 535502 bytes.
  Todos os hashes individuais/rolling, bytes, contagens, títulos, referências e
  relações conferidos. Execução ~7383ms neste PC, com GC forçado por segmento;
  NÃO é benchmark Android nem pico heap sem GC nem certificado de 60 segundos.

Regressões disponíveis PASS após os dois patches:

- Lock antes: 22 ativação + 27 promoção + 9 controles negativos; prebuild após
  patches executa novamente o mesmo lock sem redução de critérios.
- typecheck; suite bounded de 250 mil records (marcadores T1..T83 disponíveis);
  densidade funcional T84..T126; source profile/live T127..T143.
- Source adapter: 66 assertions; aviso de reprodução 11; C9 10; VOD direto 12.
- Build web PASS; nenhum warning de crypto externalizado. Warnings preexistentes
  node:fs/node:path de provisioning e chunks grandes permanecem, não ocultados.

Três verificações legadas tentadas NÃO EXECUTARAM: r2f8:catalog-semantics depende
de execute-r7c-r6d-tablet-pipeline.ts ausente; r2f8:source-profile e
r2f8:series-category-provenance apontam scripts ausentes. Não foram criados
stubs nem alterados testes/package para passar. Arquivos já ausentes no baseline.
Suite C11 existente/profile e testes novos fornecem cobertura local, mas não
equivalem a PASS dos comandos legados indisponíveis.

Diff scoped PASS. Diff --check global acusa blank line EOF preexistente em
capacitor-filesystem.storage.ts:723 (hash preservado); não editado fora da
allowlist. Comparação de hashes runtime/scripts/Android antes de cap sync:
somente os dois arquivos de produção e o novo teste diferem/adicionam.

## Build e estado físico

Build/sync Android PASS. Gradle testDebugUnitTest + assembleDebug com
--rerun-tasks: BUILD SUCCESSFUL, 155 tasks executadas; 12 suites, 90 testes,
zero failures/errors/skips nos XML atuais. Warnings preexistentes flatDir,
Kotlin/deprecation permanecem; nenhum fix fora da allowlist.

APK raiz gerado com sucesso: Xandeflix-v1.0.0-standalone.apk, 8745571 bytes,
SHA-256 0450304141F162E0C3C912D416407B40A3B0620F1CB72D458B43C77E6EAC3781.
Package com.xandeflix.prebuilt, versionCode 1/name 1.0, minSdk 23/targetSdk 35.
Assinatura v1/v2 verificada, mesmo certificado anterior SHA-256
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Warnings META-INF do verificador v1 registrados; assinatura v2 válida.
Cinco assets web no APK conferidos por hash com dist; androidScheme=https,
nenhum arquivo de identidade ou fixture de teste empacotado.

Audit final dos 386 arquivos selecionados: somente reader, writer e APK
mudaram; novo teste e backup adicionados. Nenhuma alteração inesperada fora
da allowlist, nenhuma remoção. Config/identidade/ativação/App/boot/storage/
MainActivity/player/importador/testes anteriores preservados por hash.
Backup anterior recuperável criado sem sobrescrever outro backup:
Xandeflix-v1.0.0-standalone-before-fire-stick-performance-fix.apk,
SHA-256 D601864B2E79292980869F47B6CBB34440E2E7F63DCE6C3C353A1AD3CD753385.

`FIRE_STICK_60_SECONDS_ACCEPTANCE=PENDING_PHYSICAL_TEST_AND_METRIC_CONFIRMATION`.
`PHYSICAL_OOM_FIX_VALIDATED=NAO`; `FIRE_STICK_APK_UPDATED=NAO`.
Perguntado se 60s significa Home inicial utilizável ou catálogo/busca completos
e se pode atualizar APK in-place preservando dados/ativação. Respostas pendentes.
Não redefinido o carregamento como conteúdo parcial. Não basta abrir com cache
para provar primeira importação limpa, e nenhum reset está autorizado.

Medição física deve usar timestamps reais da Activity e promoção/Home, nunca
os offsets negativos da telemetria no runner Node (relógios relativos/absolutos
preexistentes misturados). O resultado deve declarar rede/fonte/marco/estado de
cache. Se >60s ou novo crash, requisito permanece aberto e orienta próximo
patch do mesmo ciclo; nenhum resultado anterior de sucesso o sobrepõe.
