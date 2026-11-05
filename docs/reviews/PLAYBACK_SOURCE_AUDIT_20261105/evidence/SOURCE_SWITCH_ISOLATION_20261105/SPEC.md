# CANON-01-SOURCE-SWITCH-ISOLATION — especificação funcional anterior ao patch

Pedidos expressos de 05/11/2026: prosseguir com a correção; fonte diferente deve reconstruir integralmente seus metadados; instalação existente deve verificar a fonte no início e retirar de uso os dados anteriores quando houver mudança. A autorização é a do usuário nesta sessão, não adjudicação independente do executor. Commit/push/PR/backend administrativo continuam fora do escopo. Não integrar G4/créditos ou corrigir visual/overlay sem relação com troca de fonte.

## Base e preparação

Workspace exclusivo: `C:/Xandeflix/Audits/SOURCE_SWITCH_ISOLATION_20261105/workspace`, main, HEAD recebido `d8a74102124fbb8a3f013f6fd8a502519c1db4b8`, origin canônico. 1.581 arquivos de código/configuração/documentação e 6.760 arquivos físicos de dependências reproduzidos pelos hashes prospectivos. Git/índice independentes; bytes de produto e Git da origem conferidos depois da reprodução. Nenhuma alegação de manifesto histórico completo do APK. A referência pública do usuário continua APK `0146a2fc...`, 1.0.52; ambiguidades históricas dos recibos anteriores continuam registradas.

Preflight executado na cópia sem patch: verificador original PASS (970 protegidos), C11 PASS, regressão original PASS (204 controles, 42 suítes). Logs 01–03 e `BASELINE_VALIDATIONS.json`. Gate anterior da linha Next Episode não é retomado. A nova implementação não altera o baseline original nem elimina suas ressalvas.

## Comportamento

1. No boot autorizado, consultar a autoridade existente antes de disponibilizar o catálogo para uso. Comparar `sourceId`, `sourceVersion` lógica e protocolo confirmado. Não derivar um sourceId de URL/host nem publicar informação da fonte. Mudança do conteúdo do cofre deve ser acompanhada da geração lógica pelo fluxo de provisionamento; não inventar versão remota a partir de um hash de senha.
2. Primeiro uso desta proteção em instalação antiga estabelece um marco limpo: após confirmação da fonte, limpar somente caches de metadata e checkpoints dessa fonte e importar uma geração completa, mesmo que IDs locais anteriores coincidam. Instalação nova sem dados pode importar diretamente.
3. Cada transição confirmada, inclusive A→B→A, cria um epoch local opaco novo. Estado durável pequeno registra alvo, epoch e fase. PREPARED incompleto é retomado; CLEANED permite uma única reinicialização do runtime e depois obriga importação integral. Não aceitar NO_OP/checkpoint de conteúdo para concluir uma substituição pendente.
4. O reset do runtime interrompe serviços/requests do WebView anterior e recria resolvers/modelos/busca. Caches persistidos de TMDB/startup/providers e checkpoints de refresh são removidos por allowlist, nunca `localStorage.clear`. O cache nativo de imagens e as preferências/histórico de conteúdo usam namespace do epoch para impedir reutilização por IDs/URLs coincidentes. Dados pessoais antigos permanecem separados; não são associados automaticamente à fonte nova.
5. Ativação, identidade/chave permanente, token, licença, PIN e políticas parentais/C9 são preservados. Não executar pm clear/uninstall nem apagar dados gerais do aplicativo. Fonte revogada/indisponível não autoriza limpeza destrutiva ou fallback stale.
6. Enquanto fonte diferente está pendente, catálogo anterior não é apresentado como catálogo da nova. Retenção física da geração anterior só serve à preservação transacional e nunca autoriza seu uso sob outra fonte. Staging completo, validado e com proveniência correta precede promoção; falha mantém dados íntegros preservados, mas a interface permanece em estado de sincronização/erro da nova fonte.
7. Revalidar alvo antes da promoção quando houver substituição: uma resposta antiga não pode concluir a troca depois de outra mudança de fonte. Repetição/coalescência não cria duas importações ou duas reinicializações. Nenhum novo autoplay/fluxo de reprodução é introduzido.
8. Após uma geração limpa confirmada, mesma fonte/versão mantém o comportamento normal de refresh. Offline preserva dados; uma substituição já detectada nunca volta silenciosamente ao catálogo anterior por falta de rede. Falha de fonte é distinta de licença inválida.
9. O 403 do episódio auditado tem evidência separada de redirect 302 para outro host e resposta HTML Cloudflare. Este patch de isolamento não será declarado solução desse bloqueio externo sem reprodução bem-sucedida do mesmo episódio.

## Allowlist exata

Produto, somente neste workspace:

- `src/bootstrap/source-replacement.ts` (novo ciclo de substituição, estado e namespace locais).
- `src/bootstrap/boot-sync-coordinator.ts` (verificação, reset, importação integral e prontidão de catálogo).
- `src/App.tsx` (usar prontidão real, reiniciar runtime na etapa requerida e impedir UI antiga durante a troca).
- `src/playback/watch-history.ts`, `src/playback/live-favorites.ts`, `src/playback/last-live-channel.ts`, `src/ui/series-personal.store.ts` (namespace de preferências/referências, preservando bytes anteriores fora do escopo ativo).
- `src/catalog/new-content-badge.ts` (inventário local por epoch, sem reusar novidades de outra ativação).
- `src/artwork/artwork-file-cache.ts` (informar namespace do cache de imagem).
- `android/app/src/main/java/com/xandeflix/prebuilt/artwork/ArtworkDiskCache.java` e `ArtworkCachePlugin.java` (chave opaca por namespace; manter URI de fetch, validações, limites e transporte).
- `android/app/build.gradle` (somente futura versão 1.0.53/code53, após testes; nunca repetir code52 com bytes diferentes).

Testes:

- `scripts/test-source-replacement-isolation.mjs` (novo: ciclo real de estado e falhas de persistência/limpeza; namespaces e preservação).
- `scripts/test-source-replacement-bootstrap.mjs` (novo: coordenador real + staging/validação/promoção, autoridades e fixtures sintéticas; A→B→A, falhas e concorrência).
- `scripts/test-source-replacement-ui.mjs` (novo: execução da integração UI/prontidão e reinício, incluindo resposta antiga e snapshot ainda não atualizado).
- `android/app/src/test/java/com/xandeflix/prebuilt/artwork/ArtworkScopeIsolationTest.java` (novo: mesma URI em dois namespaces; fetch, bytes, isolamento e rejeição de namespace inválido).
- `scripts/test-canonical-regression.mjs`: registrar a nova suíte e somente acrescentar o novo recibo à lista estrita antes da concessão sintética ANDROID-38; preservar todos os 204 controles, 42 suítes e negativos existentes, sem skip/timeout permissivo. Revisão nominal desta alteração decorre do escopo de testes desta correção, registrada separadamente do resultado técnico.

Governança: novo `docs/governance/authorizations/CANON-01-SOURCE-SWITCH-ISOLATION.json`; novo `docs/evidence/SOURCE_SWITCH_ISOLATION.md`; append em `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md`, `docs/STATUS.md`, `docs/EVOLUTION_REPORT.md`, `docs/ERRORS_AND_BLOCKERS.md`. Não editar AGENTS, verificador, schema, package/lock, workflows ou recibos históricos. Grants before/after/supersedes devem refletir os bytes reais e cadeia anterior; nenhum grant genérico.

Evidências, diffs e helpers de execução permanecem na pasta externa deste documento. Nenhum outro arquivo de produto está autorizado por esta especificação. Se o desenho exigir outra fronteira, atualizar impacto/allowlist antes do patch e registrar a razão; não usar isso para refatoração paralela.

## Aceitação e entrega

Testes novos reais cobrindo migração instalada, mesma fonte, troca de ID, troca de versão/protocolo, A→B→A, retorno após troca falha, reinício entre fases, fonte negada/indisponível, falha de storage, corrida de autoridade, respostas antigas, importação vazia/incompleta, identidade e chaves intocadas. Cache de imagem e histórico não atravessam epochs. Typecheck, C11, verificador original e regressão completa preservada devem passar; última falha prevalece. Nenhum teste será enfraquecido para obter PASS.

Build de teste, se os gates passarem, usa versão superior a52 e mesmo pacote/assinatura própria. Sem segredos de fontes no APK. Validação física e eventual atualização in-place preservam dados/ativação; não homologar dispositivos com simples instalação ou números de versão. Distribuição/produção, publicação e revisão independente continuam distintas. Não declarar solução universal do 403 nem executar operações remotas para contorná-lo.

## Adendo de valida??o anterior ? revis?o da fixture

A execu??o adicional de `test-c11-new-content-badge.mjs` falhou ao carregar o MediaCard por imports ausentes no mapa de simula??o. A mesma falha foi reproduzida na origem sem patch, com hashes do teste preservados em BASELINE_NOVELTY_INCOMPATIBILITY.json. N?o ? uma falha introduzida no invent?rio. Adiciona-se ? allowlist somente `scripts/test-c11-new-content-badge.mjs`, para fornecer os cinco ports j? necess?rios pelo MediaCard recebido, equivalentes aos ports usados pelo teste existente de artwork. Todos os cen?rios, asserts de acessibilidade, negativos e resultados do invent?rio permanecem. N?o alterar o card ou a pol?tica parental. Essa revis?o de teste necess?ria ? valida??o desta corre??o ser? registrada no recibo novo; n?o ? adjudica??o retroativa do gate antigo.

A primeira ativa??o tamb?m far? uma ?nica recarga do runtime para que todos os singletons obtenham o mesmo namespace; a fase dur?vel CLEANED evita loops. O teste UI distingue execu??o da pol?tica de prontid?o e do cache Java de confer?ncia est?tica de callsites App; a interface f?sica precisa ser validada no APK, sem ser declarada coberta por essa inspe??o.

Adendo de compatibilidade do harness, anterior ? edi??o: incluir `scripts/test-c11-artwork-visible-recovery.mjs` na allowlist para conectar a depend?ncia real `getSourceCacheScope` adicionada ao cache de imagens. N?o alterar asserts, rel?gios, negativos, TTL ou transporte do teste. A falha `Uncontrolled dependency` foi preservada no log 05.

Adendo antes da revis?o: incluir `scripts/test-c11-page-artwork-preparation.mjs` somente para o mesmo import real `getSourceCacheScope` no harness CommonJS do cache. Todos os asserts de fila, mem?ria, TTL, deduplica??o e erro ficam preservados.

## Revis?o complementar de cobertura de caches ? antes do patch

A primeira regress?o p?s-patch passou 204/45. A revis?o identificou que o ?ndice HomeHero pode herdar releaseYear/fresh por chave da mesma sourceId em retorno A-B-A; pr?vias s?o ligadas ao snapshot, mas o requisito pede reconstru??o. Acrescentar em `source-replacement.ts` uma limpeza ass?ncrona estrita dos tr?s bancos exclusivamente de apresenta??o: xandeflix-category-previews-v1, xandeflix-local-home-hero-v2, xandeflix-local-new-content-v1. Executar no novo runtime CLEANED antes da importa??o/promo??o, quando o UI antigo n?o mant?m conex?es abertas. Erro ou bloqueio n?o permite promo??o ou exposi??o do cat?logo anterior; repetir no retry. N?o tocar bancos de identidade/seguran?a, arquivos gerais ou dados de outros apps.

Arquivos desta revis?o: source-replacement.ts, boot-sync-coordinator.ts, test-source-replacement-isolation.mjs, test-source-replacement-bootstrap.mjs e lista estrita de autoriza??es em test-canonical-regression.mjs. Todos j? pertencem ? allowlist. Usar recibo aditivo CANON-01-SOURCE-SWITCH-ISOLATION-CACHE-REVIEW encadeado ao recibo atual, sem reescrev?-lo, dentro do mesmo ciclo funcional. N?o inicia outro gate funcional. Acrescentar teste de banco bloqueado e de ordem da limpeza antes do staging. Reexecutar testes e regress?o; PASS anterior pertence aos bytes anteriores.

Governan?a da revis?o: acrescentar docs/evidence/SOURCE_SWITCH_ISOLATION_CACHE_REVIEW.md e recibo hom?nimo; append no PHASED/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS. Sem reescrever recibo/evid?ncia do primeiro fechamento intermedi?rio.

## Prepara??o de build local ? antes da execu??o

Somente ap?s valida??es finais PASS: usar o helper existente build-isolated-public-config.mjs com a origem somente como leitura de tr?s vari?veis p?blicas; n?o copiar .env real. Vite/dist, cache Gradle/build, tsbuildinfo e sa?das Capacitor geradas s?o outputs, n?o novos arquivos funcionais aprovados. Ferramenta Capacitor sync Android pode gerar: android/capacitor-cordova-android-plugins/**, android/app/src/main/assets/public/**, capacitor.config.json, capacitor.plugins.json, android/app/src/main/res/xml/config.xml. Conferir conte?do dos dois arquivos de integra??o Gradle gerados android/capacitor.settings.gradle e android/app/capacitor.build.gradle; diverg?ncia funcional inesperada bloqueia. SDK local.properties somente no candidato, apontando SDK j? instalado. N?o instalar depend?ncias. Gradle offline executa testes e assembleDebug; verificar assinatura, vers?o, pacote e assets. Nenhum build do root.

Ap?s auditoria do APK, atualiza??o de teste in-place nos aparelhos conectados preserva dados/identidade. Comparar antes/depois os campos sens?veis somente em RAM, exportando flags. N?o alterar fontes ou autoriza??es remotas para fabricar testes de troca. Limpeza/migra??o instalada e mesma fonte podem ser verificadas fisicamente; A-B-A permanece teste sint?tico at? haver troca leg?tima remota pr?pria.
