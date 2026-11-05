# XANDEFLIX PREBUILT — relatório de continuidade para outro agente

Data da consolidação: **02/11/2026, America/Sao_Paulo**. Escopo desta entrega: documentação, leitura de contratos, conferência de integridade e verificação canônica. Nenhuma implementação nova foi iniciada.

## 1. Situação atual e primeira orientação

**Último resultado técnico concluído: `NEXT_EPISODE_G3_MARKER_CONTRACT_PASS`.** Foram implementados e testados isoladamente o resolvedor seguro de próximo episódio (G2) e o contrato/validador de marcadores de início dos créditos (G3). **Eles ainda não estão integrados ao player. G4 não iniciado e sem autorização nesta entrega.** A revisão independente e a adjudicação final continuam distintas dos resultados técnicos do executor.

A linha Next Episode usa uma reprodução isolada dos arquivos do APK de teste **1.0.52**. O aplicativo já tinha seleção de próximo episódio, controles nativos, histórico e avanço automático no término natural. Esses comportamentos foram preservados. A funcionalidade futura de oferecer avanço durante os créditos será adicional e depende de novo gate nominal.

Não interpretar este relatório como autorização para implementar, integrar, compilar, instalar, publicar, fazer commit/push/PR ou operar backend/dispositivos. O pedido atual autorizou somente preparar o contexto de continuidade.

## 2. Pasta e branch corretas

### Workspace de implementação da linha Next Episode

```text
C:\Xandeflix\xandeflix-prebuilt-c11-main\tmp\tmdb-episode-metadata-enrichment-20261027\NEXT_EPISODE_G2_A22_CANDIDATE\workspace
```

| Identificador | Valor confirmado em 02/11/2026 |
| --- | --- |
| Branch | `main` |
| HEAD | `d8a74102124fbb8a3f013f6fd8a502519c1db4b8` |
| Origin | `https://github.com/xandeflix2/xandeflix-prebuilt.git` |
| Pacote Android | `com.xandeflix.prebuilt` |
| Versão dos arquivos reproduzidos | `versionName 1.0.52`, `versionCode 52` |
| Base prospectiva atual | Snapshot final G3, 7.958 arquivos |

Esse é um repositório Git independente; não é uma worktree do root. O HEAD identifica o histórico legítimo recebido. **Os bytes da referência 1.0.52 e dos gates posteriores incluem alterações locais governadas; não se deve afirmar que HEAD seja um commit de release 1.0.52.** O estado dirty é esperado e tem proveniência em manifestos/recibos. Não limpá-lo.

### Pasta atualmente aberta no ambiente do agente

```text
C:\Xandeflix\xandeflix-prebuilt
branch: lab/search-compact-index-r2
HEAD: e99f830a24b5de6dd74b4397f1ed6f0995bc8483
```

Essa pasta **não é o destino de implementação do Next Episode**. Ela possui alterações locais anteriores que devem permanecer intactas. A exceção histórica para análise de viabilidade na branch de laboratório não autoriza novos patches nela.

### Mapa dos demais diretórios

Todos os caminhos relativos abaixo partem de:

```text
C:\Xandeflix\xandeflix-prebuilt-c11-main\tmp\tmdb-episode-metadata-enrichment-20261027
```

| Diretório | Papel | Conduta |
| --- | --- | --- |
| `NEXT_EPISODE_G2_A22_CANDIDATE/workspace` | Candidato ativo de G2/G3 | Único destino de futura implementação, mediante gate |
| `NEXT_EPISODE_G1C_BASELINE/workspace` | Base anterior, HEAD `b3fc8d...` | Preservar; não voltar a usá-la para implementar |
| `CARD_TRAILER_AUDIO_20261029/workspace` | Fonte histórica do APK 1.0.52 | Somente referência, não editar nem reconstruir |
| `NEXT_EPISODE_G3_EVIDENCE` | Último fechamento técnico | Ler primeiro; não reescrever |
| `NEXT_EPISODE_G2_R4_EVIDENCE` | Recuperação canônica e decisão do índice | Preservar e respeitar a exceção delimitada |
| `NEXT_EPISODE_G1C_R4_EVIDENCE` | Aceitação histórica com limitações | Ressalva continua válida |
| `P2_50_APK_V139` | Linha histórica P2.50/1.0.39 | Não interferir nos gates/workspaces/APKs |
| `P2_44_APK_V138/workspace` e `workspace` | Referências antigas preservadas | Não editar; não seguir junction histórica |
| `NEXT_EPISODE_HANDOFF_20261102` | Esta documentação | Não constitui novo baseline funcional |

O próprio root `C:\Xandeflix\xandeflix-prebuilt-c11-main` também deve ser preservado. Não confundir os caminhos absolutos históricos dos contratos com uma autorização para modificar esse root. As ordens nominais da linha Next Episode selecionaram o candidato isolado explicitamente.

## 3. O que foi conferido nesta entrega

Foi realizada leitura integral do AGENTS.md do candidato, dos contratos Architecture, Execution, Source Data Boundary, do lock C11, das regras de execução por gates e dos relatórios G1C-R4, G2-R4 e G3. Também foram examinados os módulos G2/G3, os recibos G3, o fechamento e os inventários finais.

Conferência observada em **2026-11-02T10:05:06.415Z**, antes da criação desta pasta documental:

| Verificação atual | Resultado |
| --- | --- |
| Arquivos atuais do candidato contra snapshot G3 | **7.958/7.958 idênticos por SHA-256 e tamanho** |
| Ausências / diferenças / extras | **0 / 0 / 0** |
| Links simbólicos, hardlinks ou arquivos especiais detectados no inventário | **0** |
| Arquivos cobertos por `G3_EVIDENCE/CLOSURE.json` | **33/33 hashes conferidos** |
| Entradas de índice versus árvore HEAD | **1.343 entradas semanticamente iguais, stage 0** |
| SHA-256 atual de `.git/index` | `3e5b3a736fdebf8f36c92a7404292040e2025261af504a3f1b436fb79ceed16b` |
| Origin, branch e HEAD do candidato | Iguais ao fechamento G3 |
| Verificador canônico original, reexecutado | **PASS, exit 0; 967 protegidos; 59 autorizações** |

O snapshot G3 é `NEXT_EPISODE_G3_EVIDENCE/CANDIDATE_SNAPSHOT.json`, SHA-256:

```text
1694ac365f6de32e73be3c35fca9506ed49484dcd8d814a74f73f294c2dfbedf
```

Foi usado `GIT_OPTIONAL_LOCKS=0` e `git --no-optional-locks` nas consultas próprias. Não houve normalização do índice. O relatório de status atual contém 313 linhas incluindo o cabeçalho; a contagem não substitui a comparação individual dos arquivos.

**Limites desta conferência:** a regressão completa, os testes unitários e a validação física não foram repetidos em 02/11. Seus resultados abaixo são evidências do fechamento G3. Os outros workspaces históricos não receberam novo inventário integral nesta entrega; sua preservação anterior está documentada nos respectivos recibos. A leitura de hashes atuais não transforma snapshots posteriores em evidência de estado anterior.

## 4. Documentos canônicos que o próximo agente deve ler

No workspace ativo, nesta ordem:

1. `AGENTS.md`.
2. `docs/architecture/XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md`.
3. `docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md`.
4. `docs/architecture/XANDEFLIX_PREBUILT_SOURCE_DATA_BOUNDARY.md`.
5. `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md`, integralmente antes de alterar fronteiras consolidadas.
6. `docs/architecture/C11_NEW_DEVICE_ACTIVATION_LOCK.md`.
7. `docs/governance/GATE_EXECUTION_RULES.md`.
8. `docs/evidence/NEXT_EPISODE_G3.md` e `docs/evidence/NEXT_EPISODE_G3_REGRESSION.md`.
9. Os dois recibos G3 em `docs/governance/authorizations/`.
10. Os relatórios externos G3, G2-R4 e G1C-R4 e a ordem nominal do próximo gate, quando existir.

Os documentos gerais `docs/STATUS.md`, `docs/EVOLUTION_REPORT.md` e `docs/ERRORS_AND_BLOCKERS.md` fazem parte da memória prevista no Execution Contract. Devem ser consultados no escopo autorizado, sem editar o root ou normalizar documentos históricos por iniciativa própria. Datas, `CURRENT_GATE` e permissões antigas em contratos são registros de seus ciclos; não constituem autorização permanente para repetir suas operações.

Este relatório é um índice contextual. Não substitui contratos, ordens expressas, recibos e testes. Não há percentual global de conclusão homologado nesta entrega.

## 5. Critérios canônicos obrigatórios

### Identidade e prevenção de colisão

- Projeto: `XANDEFLIX_PREBUILT`.
- Repositório: `xandeflix2/xandeflix-prebuilt`; origin exatamente o informado na seção 2.
- Branch normal esperada: `main`, no candidato autorizado.
- Pacote: `com.xandeflix.prebuilt`.
- Projeto protegido externo: `Xandeflix 2.0`, repositório `timbocorrea/xandeflix-2.0`, pacote `com.xandeflix.app`.
- Colisão de remote, credenciais, worktree ou operações com o projeto protegido exige parada: `HARD_STOP_PREBUILT_G0_ORIGINAL_REPOSITORY_COLLISION`.

### Execução e autorização

- **Um gate por vez.** Nenhum próximo gate começa por inferência ou pelo sucesso técnico do anterior.
- **Especificação antes de código**, incluindo testes e governança; allowlist exata e critérios de aceitação documentados.
- Patch mínimo, sem refatoração oportunista ou melhorias paralelas.
- Proveniência rastreável de todos os arquivos alterados; preservar alterações anteriores conhecidas.
- `LATEST_REGRESSION_WINS`: falha posterior prevalece sobre sucesso anterior; não escolher resultados favoráveis.
- `STOP_ON_CONFLICT`: divergência nova, falha de integridade, autorização ausente ou colisão deve ser registrada e interromper o escopo dependente.
- Não enfraquecer verificadores, negativos, suites, timeouts ou critérios para obter PASS.
- Chat não substitui contrato; campo de schema não substitui adjudicação independente.
- Commit, push, PR, merge, checkout/reset/stash/clean e criação de worktree não são autorizados pela continuidade documental.
- Não expor URLs privadas, tokens, senhas, credenciais de fonte, dados de sessão ou chaves de assinatura em logs/docs.

### Arquitetura e Source Data Boundary

Catálogo, processamento/runtime e busca atuais permanecem locais no dispositivo. A mídia é acessada diretamente da fonte pelo dispositivo, respeitada a exceção já documentada de transporte Cast efêmero na LAN. O backend é Control Plane, sem proxy/relay central de vídeo, sem catálogo/EPG/search/media upload. Segredos de fonte só podem circular nos fluxos de cofre privado e entrega protegida expressamente autorizados; nunca em metadata pública ou logs.

`sourceId` é identificador lógico opaco de autorização. `sourceVersion` é geração lógica de configuração, não hash de playlist ou edição de mídia. Não equiparar esses conceitos a `mediaEditionId` nem inventar prova de identidade por título/TMDB.

External Preprocessing e certos formatos de provisionamento/busca são metas arquiteturais históricas (`TARGET`); não declarar que todo o runtime atual já implementa esses alvos. Essa distinção permanece expressa no cânone.

### C11 e autorização de reprodução

Preservar identidade/chave persistente, boot pendente antes da autorização real, promoção segura do catálogo, HTTPS e exclusões de backup Android. Falha de playback não permite regenerar identidade, rotacionar chave, limpar dados, ignorar licença, parentalidade ou sessão C9.

Lock: `C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1`. Executar o lock nos escopos e momentos exigidos pelo contrato e pelo gate. Uma instalação/catalogação bem-sucedida não certifica playback físico.

## 6. Baseline de referência 1.0.52 e ressalvas

Referência histórica:

```text
CARD_TRAILER_AUDIO_20261029/SOURCE_MANIFEST.json
CARD_TRAILER_AUDIO_20261029/workspace
CARD_TRAILER_AUDIO_20261029/Xandeflix-v1.0.52-Trailer-Audio-20261029.apk
```

SHA-256 do APK de referência:

```text
d7d559600ba5265e490b1d79b7009b26598184157dfff914cea237faa02ab553
```

Manifesto de produto: **1.534 arquivos**. Dependências físicas aprovadas: **6.256 arquivos**, conforme preparação e inventários. Os 356 extras classificados na origem não foram incorporados ao candidato. Não instalar/atualizar dependências automaticamente, copiar `.git` da origem, copiar ambientes reais ou compartilhar `node_modules` por links.

O APK 1.0.52 é **referência histórica de teste**, não homologação automática de produção. As modificações de interface, elenco/perfil de ator, identidade de metadados e trailer anteriores estão representadas pelos hashes e autorizações da referência; este handoff não revalida fisicamente cada uma delas nem retoma os pedidos antigos da conversa.

### Ressalva histórica G1C-R4

Não existe snapshot anterior completo da própria árvore original 1.0.52 e de todos os ambientes anteriores à R2. O usuário aceitou expressamente a preservação parcialmente comprovada **somente para desenvolvimento isolado**. Isso não prova alteração indevida, tampouco integridade histórica universal.

A decisão está em `NEXT_EPISODE_G1C_R4_EVIDENCE/DECISION_REPORT.md`. O resultado anterior G1C-R3 permanece bloqueado no seu registro. Não fabricar snapshots retrospectivos, apagar a ressalva ou reescrever o resultado antigo como PASS. Novas divergências concretas continuam bloqueantes.

### Exceção delimitada do índice G2-R4

O índice R1 tinha SHA-256 `c498133adf78ce80314f1f2552bcf8a47817fb7105490d312dbb2a50048e60e0`; o índice aceito desde R3/R4 tem o hash indicado na seção 3, com 157.688 bytes. A origem da diferença não foi comprovada. Uma atualização auxiliar do Git é possibilidade técnica, não causa estabelecida.

O usuário aceitou representação binária diferente **quando demonstrada equivalência semântica completa** e preservação dos demais metadados. A auditoria histórica R4/G3 conferiu 1.343 entradas e 1.337 blobs distintos, sem staged, unmerged ou flags ocultas. Nesta entrega foram novamente comparados modo/OID/caminho/stage das 1.343 entradas e o índice conserva exatamente os bytes do G3.

Uma diferença futura não pode ser ignorada genericamente nem causar reconstrução automática. Reaplicar o procedimento autorizado, comparar todas as entradas/flags/objetos e os demais metadados e preservar a evidência. `git diff --cached --quiet HEAD` sozinho não basta. Nunca excluir toda a pasta `.git` da auditoria.

## 7. Histórico resumido dos gates Next Episode

| Etapa | Resultado e consequência |
| --- | --- |
| Viabilidade / G1 / G1B | Análise e consolidação arquitetural; preservar avanço natural existente; oferta antecipada será adicional |
| G1C e revisões | Preparação da base isolada e reprodução de manifesto; houve impedimentos estruturais/preservação registrados |
| G1C-R3 | Bloqueio por insuficiência de evidência histórica integral, sem provar alteração indevida |
| G1C-R4 | `NEXT_EPISODE_G1C_R4_BASELINE_ACCEPTED_WITH_LIMITATIONS`, restrito a desenvolvimento isolado |
| G2 inicial | Bloqueado antes de implementação: a base `b3fc8d...` não satisfazia a ancestralidade A22 necessária à regressão |
| G2-R1 | Novo candidato independente em `d8a741...`; ancestralidade legítima e regressão 204 controles/42 suítes PASS |
| G2-R2 | Implementou resolvedor e 27 testes; regressão bloqueou pela lista estrita que ainda não incluía o novo recibo legítimo |
| G2-R3 | Parou antes de editar runner por diferença binária do índice versus snapshot R1 |
| G2-R4 | Exceção do índice documentada, revisão formal mínima do runner, 27 testes e regressão 204/42 PASS |
| G3 | Contrato/validador puro de marcadores; 44 testes, G2 27 testes, regressão 204/42 PASS; sem integração |
| G4 | **Não iniciado. Necessita ordem nominal específica.** |

Os bloqueios antigos continuam preservados. A recuperação posterior é um novo resultado, não apagamento da falha anterior.

### Particularidade A22

O contrato em `scripts/vercel-prebuilt-contract.mjs` exige a ancestralidade do received head `a27d7cd4a74bd447221bba2851ee0af033d0a2fd`, além da referência canônica `b3fc8d1e3844bc5601813ab1b298289af5b3f1fd`. O candidato `d8a741...` atende à linhagem. Recriar o trabalho diretamente em `b3fc8d...` repete o problema anterior: o teste de dirty source encontra erro de ancestralidade antes da rejeição de dirty esperada.

Não simular contexto Git, adulterar verificador ou relaxar A22. O estado dirty local governado é esperado para desenvolvimento isolado; não constitui aprovação de distribuição, e a proteção de dirty source continua válida.

## 8. G2: resolvedor seguro existente

Arquivos:

- `src/playback/next-episode-resolver.ts`.
- `scripts/test-next-episode-resolver.mjs`.

API: `resolveNextEpisode(model, seriesId, currentEpisodeId, context)`, com `CatalogReadModel` existente. É uma função local; não inicia reprodução, acessa player nativo, requisita mídia ou concede autorização durável.

Contexto inclui fonte/geração/snapshot, fonte/geração atuais, decisões de licença/parentalidade/autorização de fonte, evidência explícita do último episódio de temporadas, temporada final opcional e prontidão de referência indireta.

Saídas: `AVAILABLE`, `UNAVAILABLE`, `AMBIGUOUS`, `END_OF_SERIES`. `AVAILABLE` inclui identidade do episódio e correlação de fonte/geração/snapshot. **É elegibilidade local, não prova de acessibilidade na rede.**

Regras preservadas:

- Ordenação por temporada/episódio numéricos, nunca por ordem de importação.
- Identidades conflitantes ou episódios diferentes na mesma posição produzem ambiguidade.
- Registro repetido idêntico com o mesmo ID é deduplicado; não escolher arbitrariamente entre conflitos.
- Não saltar lacunas, temporadas ausentes ou episódios especiais silenciosamente.
- S0/E0 não entra automaticamente na sequência regular.
- Transição exige fim de temporada comprovado e próximo S+1/E1 presente.
- Fim conhecido exige evidência explícita da temporada final e do último episódio; catálogo sem próximo não basta.
- Mudança de fonte/geração/snapshot e autorização desconhecida/negada bloqueiam.
- `streamId` isolado não comprova mídia acessível. Validação de URI/referência é local, sem teste de rede.

Há 27 casos sintéticos reais no teste. Os hashes permanecem os aprovados em G2-R2:

| Arquivo | SHA-256 |
| --- | --- |
| `next-episode-resolver.ts` | `538000d1d5fa9c9ab5f9fa33953626ad54d1f588a3bb7d51cd48bc6ccbb447bf` |
| `test-next-episode-resolver.mjs` | `4478a3566268141afd720aeee67d6f5b4ad3c66628b7f6acc258d8b0cb8c524e` |

## 9. G3: contrato e validador de créditos existentes

Arquivos:

- `src/playback/credits-marker.ts`.
- `scripts/test-credits-marker.mjs`.

API: `validateCreditsMarkers(context, candidates)`. Exporta `CreditsMarkerIdentity`, `CreditsMarkerOrigin`, `CreditsMarker`, `CreditsMarkerAuthority`, `CreditsMarkerContext`, `CreditsMarkerValidation`.

Identidade composta: série, temporada, episódio, fonte local, geração, snapshot e **edição da mídia**. Campos de referência são opacos e limitados; o marcador não transporta URL, credencial ou sessão. Campos adicionais não previstos no marcador são rejeitados.

Origem aceita: `SOURCE_MARKER` ou `EDITION_RECORD`, sempre com semântica `CREDITS_START`, proveniência e autoridade/convenção reconhecidas para a edição. **Um futuro adaptador confiável deve comprovar edição e autoridade antes de montar o contexto. O validador não autentica sozinho uma fonte ou fingerprint externo.**

Duração real é obrigatória: `PLAYBACK_METADATA` ou `MEDIA_PROBE`, positiva e finita. Duração descritiva do TMDB, título igual ou duração parecida não são prova da edição. O marcador deve começar em instante finito, não negativo e estritamente anterior ao fim real.

O relógio `now` é explícito. `validatedAt` não pode ser futuro; `validUntil`, se presente, precisa ser válido e posterior à validação e ao instante atual. Marcador sem prazo explícito continua vinculado a edição/fonte/geração/snapshot e exige revalidação contextual.

| Estado | Significado |
| --- | --- |
| `VALID` | Marcadores equivalentes aceitos no contexto fornecido; não autoriza reprodução |
| `MISSING` | Sem candidatos; nenhuma oferta antecipada fundamentada |
| `INVALID` | Contexto/candidato inválido; qualquer candidato inválido bloqueia o lote |
| `EXPIRED` | Candidato expirado bloqueia, inclusive se outro for válido |
| `AMBIGUOUS` | Instantes diferentes para a mesma edição; não escolher por origem/ordem |

Duplicados equivalentes preservam o prazo mais restritivo. Há 44 casos sintéticos reais, com zero chamadas de rede e zero leitura de relógio implícito nos testes.

**Não implementado:** parser HLS/ID3, detecção automática dos créditos, importação remota, análise audiovisual, heurística por 90/120 segundos, percentual, IA, overlay ou integração ao player. HLS não identifica automaticamente créditos finais; `DATERANGE`, ID3 genérico, anúncio ou fim da playlist não têm essa semântica por si sós. TS/MP4/HLS não dispensam evidência da edição e convenção do produtor.

| Arquivo | SHA-256 |
| --- | --- |
| `credits-marker.ts` | `7435877d14c862d41ed01151ab7b893f2e24f3913b9dfc8de43f08fc9c13b20f` |
| `test-credits-marker.mjs` | `5e88b56f5aecfa48e179808fe060a264bba6e2f7c6326e6d423f74cec69c6700` |

## 10. Player atual que deve permanecer preservado

Examinar no candidato antes de qualquer futura proposta de integração:

```text
src/playback/episode-sequence.ts
src/playback/playback.service.ts
src/playback/watch-history.ts
src/playback/native-android-player.bridge.ts
android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java
android/app/src/main/java/com/xandeflix/prebuilt/player/PlayerControls.java
```

São mecanismos existentes de sequência/contexto, histórico, ponte, controles e sessão. O avanço ao término natural em `STATE_ENDED`, a seleção já utilizada e os controles continuam sem substituição pelos módulos novos. A auditoria G3 preservou seus bytes; a comparação atual preservou todos os bytes do snapshot G3.

Uma integração futura precisará correlacionar requisição/sessão, salvar progresso, impedir transições duplicadas e respeitar autorização real. O clique antecipado, o próximo normal e o término natural não podem disputar a navegação nem produzir gravações incorretas de histórico.

## 11. Governança de arquivos protegidos

O verificador original é `scripts/verify-canonical-contract.mjs`, com referência `b3fc8d1e3844bc5601813ab1b298289af5b3f1fd`. Protege raízes de produto/testes e configurações conforme sua política, incluindo `src/`, `scripts/`, `android/app/src/`, `supabase/`, `fixtures/`, `schemas/`.

Novos arquivos nessas fronteiras também exigem autorização formal. Correspondência com manifesto ou teste PASS não substitui recibo legítimo.

Procedimento para um gate futuro, somente após autorização expressa:

1. Fixar especificação, allowlist, impacto, testes e restrições antes de editar.
2. Verificar a cadeia atual e os hashes dos arquivos envolvidos.
3. Criar recibo aditivo em `docs/governance/authorizations/<GATE>.json`, usando o schema original e a proveniência real da ordem.
4. Registrar no `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md` pelo mecanismo `CANON-01:AUTHORIZATION`, com caminho e hash Git normalizado do recibo.
5. Para revisão de arquivo já autorizado, usar `supersedes` correto e `before` igual ao `after` vigente. Não reescrever recibos antigos.
6. Distinguir **hash Git de blob normalizado** usado pelo verificador de **SHA-256 bruto** usado pelos inventários.
7. Revisar mudanças de testes formalmente; manter negativos e critérios originais.
8. Executar os comandos exigidos, auditar fora da allowlist e emitir evidências fiéis.

O campo `APPROVED_BY_CHAT_MASTER` dos recibos é exigência do schema; a proveniência registrada é a autorização nominal expressa do usuário. Não representa adjudicação independente do próprio executor, homologação física ou autorização de produção.

### Armadilha da lista estrita da regressão

`scripts/test-canonical-regression.mjs` contém `assert.deepEqual` da lista completa de autorizações, incluindo concessão **sintética** `ANDROID-38` no cenário de teste. A concessão sintética permanece em último lugar e não é autorização real de release.

Adicionar um recibo real pode exigir atualização dessa expectativa. Isso demanda autorização nominal para editar o runner, revisão formal e recibo encadeado; não substituir por `includes`, contagem, ordenação permissiva ou remoção de negativos.

Último autorizador do runner:

```text
CANON-01-NEXT-EPISODE-G3-REGRESSION-EXPECTATION
supersedes: CANON-01-NEXT-EPISODE-G2-R4-REGRESSION-RECOVERY
blob Git vigente: 9a3503cd617ba1969a8ee16b649327a736a77e03
```

G3 adicionou exatamente dois recibos ao fim da lista histórica, antes de `ANDROID-38`, preservando 204 controles e 42 suítes. Não repetir o bloqueio R2 por esquecer essa dependência nem fabricar autorização preventiva.

## 12. Últimas verificações completas e evidências

Os resultados abaixo pertencem ao fechamento G3, em 29/10/2026 no fuso local (fechamento UTC em 30/10). Não foram reexecutados como regressão completa neste handoff.

| Verificação | Resultado G3 | Evidência em `NEXT_EPISODE_G3_EVIDENCE` |
| --- | --- | --- |
| Marcadores G3 | 44 PASS | `01_MARKERS.log` |
| Resolvedor G2 | 27 PASS | `02_G2_RESOLVER.log` |
| TypeScript `--noEmit` | PASS | `03_TYPECHECK.json` / log vazio com exit 0 |
| Verificador canônico | PASS | `04_CANONICAL.log` |
| Retorno aos episódios | PASS | `05_EPISODE_RETURN.log` |
| Lock C11 | PASS | `06_C11.log` |
| Regressão completa | **204 controles / 42 suítes PASS, exit 0** | `07_FULL_REGRESSION.log` e `.json` |
| Verificador final | PASS, 967 protegidos | `08_CANONICAL_FINAL.log` |
| Integridade final | PASS | `POST_COMPARISON.json`, `POST_INDEX_AUDIT.json` |
| Preservação de referências cobertas | PASS com ressalva histórica mantida | `PRESERVED_REFERENCES.json` |

A22 original e `REAL_DIRTY_SOURCE_BLOCKS` passaram no fechamento. Auditoria G3 contra G2-R4: A=7.939 bytes preservados; B=8 mudanças da allowlist; C=11 outputs de testes identificados; D=0 mudança do índice; E=0 divergência injustificada.

O snapshot final G3 contém os 7.958 arquivos incluindo Git e saídas temporárias conhecidas. Os 33 arquivos do fechamento conferem atualmente. Não criar exclusões genéricas para `.git`, `tmp` ou dependências na auditoria seguinte.

Uma suíte pode produzir fixtures e compilação Java contra stubs; isso não é build Android/Gradle/APK. Logs PowerShell históricos podem estar em UTF-16: detectar encoding antes de parsear. Um arquivo `regression-result` antigo pode sobreviver a falha precoce; verificar data, exit code e log da execução atual.

## 13. Preflight recomendado ao próximo agente

Antes de qualquer alteração futura, conferir a ordem nominal. Sem ela, limitar-se a leitura e preparação documental. Executar as consultas dentro do candidato, nunca presumir o cwd do IDE:

```powershell
$env:GIT_OPTIONAL_LOCKS = '0'
Set-Location -LiteralPath 'C:\Xandeflix\xandeflix-prebuilt-c11-main\tmp\tmdb-episode-metadata-enrichment-20261027\NEXT_EPISODE_G2_A22_CANDIDATE\workspace'
Get-Location
git --no-optional-locks rev-parse --show-toplevel
git --no-optional-locks remote -v
git --no-optional-locks branch --show-current
git --no-optional-locks rev-parse HEAD
git --no-optional-locks status --short --branch
git --no-optional-locks diff --cached --quiet HEAD
git --no-optional-locks merge-base --is-ancestor a27d7cd4a74bd447221bba2851ee0af033d0a2fd HEAD
```

Guardar status/refs e comparar o snapshot G3 individualmente, sem modificar índice/refs. Para equivalência semântica, comparar integralmente `git ls-files --stage -z` e `git ls-tree -r -z --full-tree HEAD`, incluindo modos, OIDs, caminhos, estágio e flags; consultar os auditores históricos como referência, sem executar helpers antigos que escrevam governança ou finalize resultados automaticamente.

Comandos de verificação usados na linha, sujeitos aos requisitos do próximo gate:

```powershell
node scripts/verify-canonical-contract.mjs
node scripts/test-credits-marker.mjs
node scripts/test-next-episode-resolver.mjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-series-episode-return.mjs
node scripts/test-c11-new-device-activation-lock.mjs
node scripts/test-canonical-regression.mjs
```

Aliases existentes: `npm run canon:check`, `npm run canon:test`, `npm run c11:new-device:lock`. Ler `package.json` antes de escolher comandos com lifecycle. Não executar `npm install`, `npm update`, Vite de produção, Capacitor, Gradle, instalação Android ou deploy como consequência do preflight.

Se testes forem executados, preservar seus outputs conhecidos por caminho/produtor e capturar exit code real. Não aumentar timeout, pular browser/suite ou declarar PASS parcial como regressão completa.

## 14. Próxima etapa possível — proposta, sem autorização

Antes de desenhar overlay ou alterar player, o responsável pelo projeto precisa emitir o escopo do próximo gate. Pontos técnicos pendentes:

1. Obter um marcador de créditos de origem/convenção documentada ou registro autorizado por edição. Não há comprovação atual de que as fontes reais forneçam esses marcadores.
2. Comprovar edição e duração real; definir adaptador confiável e a origem das autoridades. O contrato G3 não faz isso sozinho.
3. Correlacionar G3 e G2 à mesma sessão, requisição, episódio atual, fonte e snapshot. G3 valida o episódio em reprodução; G2 seleciona o seguinte.
4. Mapear `sourceIdLocal` para `sourceId` e `catalogSnapshotId` para `snapshotId`. Definir explicitamente a semântica de `sourceGeneration` versus `catalogGeneration`; não presumir igualdade por nomes/coerção.
5. Considerar oferta antecipada somente com marcador `VALID` e resolução `AVAILABLE` ainda atuais. Revalidar licença, parentalidade, fonte, sessão, edição e prazo na ação do usuário.
6. Definir ciclo de vida, cancelamento de respostas antigas, deduplicação de navegação e preservação do progresso.
7. Planejar foco/D-pad Fire Stick/Android TV e toque celular/tablet, retorno/foco e acessibilidade, em gate de interface separado se assim autorizado.
8. Preservar próximo episódio normal e avanço automático natural. Sem marcador confiável, manter o fluxo existente; não inventar momento de créditos.
9. Reservar testes físicos, build/APK e homologação para permissões/gates próprios.

Esta lista não fixa uma ordem G4 já aprovada. É material para especificação e decisão futuras. Nenhum botão/overlay, detector ou integração foi produzido neste handoff.

## 15. Referências principais para abrir primeiro

Os links abaixo partem desta pasta documental:

- [Relatório completo G3](../NEXT_EPISODE_G3_EVIDENCE/REPORT.md).
- [Resultado G3](../NEXT_EPISODE_G3_EVIDENCE/RESULT.json).
- [Fechamento de hashes G3](../NEXT_EPISODE_G3_EVIDENCE/CLOSURE.json).
- [Snapshot atual G3](../NEXT_EPISODE_G3_EVIDENCE/CANDIDATE_SNAPSHOT.json).
- [Decisão/recuperação G2-R4](../NEXT_EPISODE_G2_R4_EVIDENCE/REPORT.md).
- [Aceitação histórica G1C-R4](../NEXT_EPISODE_G1C_R4_EVIDENCE/DECISION_REPORT.md).
- [AGENTS do candidato](../NEXT_EPISODE_G2_A22_CANDIDATE/workspace/AGENTS.md).
- [Contrato de expansão e registros](../NEXT_EPISODE_G2_A22_CANDIDATE/workspace/docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md).
- [Resolvedor G2](../NEXT_EPISODE_G2_A22_CANDIDATE/workspace/src/playback/next-episode-resolver.ts).
- [Validador G3](../NEXT_EPISODE_G2_A22_CANDIDATE/workspace/src/playback/credits-marker.ts).

Ordem original G3 anexada pelo usuário, para proveniência complementar:

```text
C:\Users\Alexandre\.codex\attachments\d6ee9c80-bab3-4d37-ba58-d6bc5e39600e\Pasted text.txt
SHA-256: c782a9d70cff25059242d1f7ddec6b080ed55de975fcdb63486b0c2adcc50ba3
```

Se um anexo deixar de estar disponível, não reconstruí-lo por memória como se fosse original. Usar os recibos preservados e solicitar a ordem necessária para nova atuação quando seu conteúdo for indispensável.

## 16. Estado terminal desta entrega documental

```text
PROJECT=XANDEFLIX_PREBUILT
HANDOFF_DATE=2026-11-02
IMPLEMENTATION_WORKSPACE=NEXT_EPISODE_G2_A22_CANDIDATE/workspace
IMPLEMENTATION_BRANCH=main
IMPLEMENTATION_HEAD=d8a74102124fbb8a3f013f6fd8a502519c1db4b8
IDE_WORKSPACE=C:/Xandeflix/xandeflix-prebuilt
IDE_BRANCH=lab/search-compact-index-r2
LATEST_TECHNICAL_GATE=NEXT_EPISODE_G3_MARKER_CONTRACT_PASS
CURRENT_CANDIDATE_SNAPSHOT=7958_7958_IDENTICAL
G3_EVIDENCE_CLOSURE=33_33_HASHES_PASS
CURRENT_CANONICAL_VERIFICATION=PASS_967_PROTECTED_59_AUTHORIZATIONS
FULL_REGRESSION_LAST_EXECUTION=G3_204_CONTROLS_42_SUITES_PASS
FULL_REGRESSION_REEXECUTED_FOR_HANDOFF=NAO
HISTORICAL_PRESERVATION_LIMITATION=RETAINED
INDEX_EXCEPTION=RETAINED_WITH_SEMANTIC_REQUIREMENTS
PLAYER_INTEGRATION=NOT_STARTED
INDEPENDENT_REVIEW=PENDING
PRODUCT_SOURCE_MODIFIED_BY_HANDOFF=NAO
GIT_WRITE=NAO
SUPABASE_WRITE=NAO
DISTRIBUTION_BUILD=NAO
APK_INSTALL=NAO
G4_AUTHORIZED_BY_HANDOFF=NAO
NEXT_GATE_STARTED=NAO
RESULT=PROJECT_CONTINUITY_HANDOFF_COMPLETE
```
