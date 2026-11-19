# CANON-01-TMDB-EPISODE-METADATA-ENRICHMENT

Autorizacao: anexo do usuario e6e2d547-ea7b-4192-b30a-a368d7e98d66/Pasted text.txt,27/10/2026. Desenvolvimento LOCAL ISOLADO; APK candidato permitido apos checks/auditoria, instalacao/publicacao/promocao/Git/backend NAO autorizados. Nao iniciar SET01, DUB/LEG ou desempenho. Branch de recuperacao recebida preservada como excecao historica; nenhum reset/clean/stash/merge. Workspace historico/projeto original intocados.

## Base e invariantes

Fonte recebida EXCLUSIVAMENTE do workspace R4 fechado tmp/trailer-containment-r4-20261027/workspace, SOURCE_MANIFEST1479 arquivos/944 protegidos/43 recibos; verificar manifesto/closure/evidencias e APK0358e6445b8d273fa3f4ae1a9bf2be7b3a90f74f1159ce1d5ff69e3eebc2e3a9. Novo clone isolado preenchido com todos os bytes recebidos antes de editar; nao reconstruir R4 por main. Preservar root10L1/index vazio/51APKs e R4 integral. Nenhum arquivo Java/trailer/Capacitor alterado. CANON/check/test36 suites204 controles e C11 fresh antes de codigo protegido; acrescentar suite nova sem remover/enfraquecer as anteriores.

Fonte local e unica autoridade para disponibilidade, hierarquia, ids, quantidade, ordem, streams e progresso. Catalog.ts/catalog-selectors/read-model/snapshots serao lidos, nao alterados. A integracao sera uma projecao de EpisodeViewModel separada, somente para a temporada exibida. Reutilizar o bloco de episodios ja compartilhado por phone/tablet/TV e seus mesmos li/button keys/handlers/returnState. Nem TMDB number_of_episodes nem a lista remota criam/removem/reordenam episodios locais. Nao enviar ids/URLs/credenciais locais ao TMDB.

## Correspondencia conservadora

Reutilizar tmdbMetadataService.resolve com ArtworkIdentity existente depois de ParentalDetailGate permitir montar detalhes. Uma serie e confirmada somente se kind/id validos e, sem contradicao de ano, possuir TMDB ID explicito coincidente OU titulo exato normalizado + ano exato + poster TMDB coincidente. Sem essa corroboracao, nao consultar temporada; nao inferir identidade por popularidade/titulo semelhante. Homonimas/ano conflitante preservam apresentacao.

Endpoint publico por temporada: GET /3/tv/{publicSeriesId}/season/{seasonNumber}?language=pt-BR. Numeros de temporada0..1000, episodios1..10000. Ler apenas season id/season_number e episodios id/season_number/episode_number/name/overview/still_path/runtime/air_date. Rejeitar estrutura, ids, duplicatas e episodio com temporada estrangeira. Usar resposta contextual ao id de serie solicitado, sem inventar series_id ausente no schema de temporada. Se vier series_id e conflitar, rejeitar. Limite1000 episodios/resposta,1MB de JSON aceito.

Uma chamada por temporada por padrao. Somente se textos localizados ausentes, admitir uma segunda chamada de temporada en-US dentro do mesmo teto total8s. Merge linguistico exige mesmo season id e mesmo episodio id/numero/temporada; textos/imagens de ids conflitantes jamais associados. Nunca sobrescrever descricao valida da fonte com texto vazio; texto ingles nao substitui descricao/titulo local valido. Nao fazer endpoint por episodio: imagem ausente preserva imagem legitima da fonte ou placeholder neutro. Essa escolha evita N+1 e e a avaliacao conservadora da excecao de images autorizada.

MATCH_CONFIRMED exige serie confirmada, temporada/numero unicos e correspondentes MAIS episodio TMDB ID explicito exato, OU titulo individual significativo EXATO, OU mesmo still_path publico validado da imagem legitima do episodio. Numero ou titulo semelhante isolados nunca bastam. Conflitos de ID/titulo significativo/duracao fortemente divergente, marcadores de versao editada/capitulos reunidos ou duplicatas tornam MATCH_AMBIGUOUS. Fonte30 episodios com distribuicao remota incompatível nao e alinhada por indice: numeros locais ausentes na temporada remota bloqueiam enriquecimento da temporada. Subconjunto local legitimo e ordem diferente sao preservados. Episodios extras TMDB ignorados. Sem resposta/episodio suficiente: MATCH_UNAVAILABLE. Em ambos casos preservar campos originais; nenhum still de outro episodio ou poster generico de serie e chamado de cena.

Titulos genericos 'Episodio1', 'S01E01', 'Capitulo1' nao corroboram. Prefixos de numero/serie podem ser retirados apenas para comparacao, nunca mutando fonte. Duracao positiva fonte prevalece; runtime TMDB complementa somente confirmados sem duracao local. Data aceita validada mas nao inventar air_date no contrato local, que nao o possui. Todas comparacoes sao locais; a API recebe exclusivamente id publico/season/language e a credencial existente.

## Serviço e interface

Servico dedicado pequeno, sem storage remoto/localStorage de catalogo: cache RAM por public series id/temporada/idioma, TTL6h, max16 temporadas e2MB serializados, misses30s. Dedup16 pendentes, concorrencia2, teto8s compartilhado incluindo fallback, resposta obsoleta descartada pelo hook.429: cooldown Retry-After limitado1..120s (padrao30s), sem retry automatico, fila ja admitida nao dispara IO durante espera.401/403 pausa15min.404/offline/timeout retornam null sem bloquear UI ou playback.

Hook e provider de apresentacao montados somente quando o painel Episodios estiver visivel e dados locais tiverem chegado; chave inclui readModel/snapshot/versao/serie/temporada/identidade. Cleanup invalida continuacoes antes/depois de awaits; mesma temporada usa dedup. Troca rapida de serie/temporada/geracao nao exibe metadata antiga nem solicita outra fonte. Sem scan de catalogo ou preload de temporadas fechadas.

Miniatura reservada16:9 sempre presente, sem novo alvo de foco. Imagem fonte legitima ou still TMDB w300 validado; nao mostrar poster da serie como cena. Reutilizar observeArtwork + loadImage + cache arquivo existente, prioridade apenas visiveis, abortar consumidor em cleanup, fila global2 transportes/2 decoders preservada. Titulos/sinopses em blocos com altura reservada/line clamp; mesma geometria antes/depois de metadata/imagem, mesmos botoes Assistir/Continuar, ids e journal. Falha do TMDB ou imagem deixa o episodio utilizavel.

## Allowlist fechada (17 caminhos)

Produto:
1. src/artwork/tmdb-season-episodes.service.ts (novo)
2. src/catalog/episode-presentation.ts (novo; projecao pura)
3. src/ui/hooks/useEpisodeMetadata.ts (novo)
4. src/ui/components/EpisodeListPresentation.tsx (novo)
5. src/ui/components/EpisodeStill.tsx (novo)
6. src/ui/components/EpisodeMetadata.css (novo)
7. src/ui/pages/SeriesDetailPage.tsx (integracao minima no bloco compartilhado)

Testes/governanca:
8. scripts/test-tmdb-episode-enrichment.mjs (novo)
9. scripts/test-tmdb-episode-enrichment-ui.mjs (novo)
10. scripts/test-canonical-regression.mjs (somente acrescentar nova suite/gate)
11. docs/architecture/TMDB_EPISODE_METADATA_ENRICHMENT.md (novo)
12. docs/evidence/TMDB_EPISODE_METADATA_ENRICHMENT.md (novo)
13. docs/governance/authorizations/CANON-01-TMDB-EPISODE-METADATA-ENRICHMENT.json (novo44,43 anteriores intactos)
14. docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md (append)
15. docs/STATUS.md (append)
16. docs/EVOLUTION_REPORT.md (append)
17. docs/ERRORS_AND_BLOCKERS.md (append)

Helpers/relatorios/manifestos/fixtures/harness novos somente neste tmp. Nenhum teste historico, contrato de dados, dependencia, player, backend ou arquivo R4 alterado.

## Testes e aceite

RED de feature ausente na R4 pristine antes do produto. Unitarios com funcoes reais/fixtures publicas sinteticas: identidade exata/homonima/ano, duas temporadas/especiais0, ordem/lacunas/extras/distribuicao30 vs10, titulo generico, IDs conflitantes e editados/reunidos/duracao, titulos/sinopse ptBR/vazios/fallback ingles, still ausente/invalido/episodio alheio, subset, snapshot/ids/count/streams invariantes. Servico real com fetch controlado: cache TTL/LRU/bytecap/dedup/concorrencia/pendentes,429cooldown/404/timeout/offline/auth,2GET max/fallback seguro; nenhuma info privada nos requests. Hook/componentes React reais em Chromium com API/autoridade/playback/imagem nas fronteiras de I/O: mounted UI imediata, foco/buttonDOM/scroll e geometria preservados em phone/tablet/Fire viewports, temporada rapida/resposta serie antiga/geracao antiga, tab oculto sem fetch, Assistir/Continuar com IDs locais, parentalgate negado sem montagem/request, imagequeue/visibilidade/cleanup. Medir baseline vs candidato no mesmo harness, separando fonte/TMDB/imagem e sem alegar SLA ou aparelho fisico.

Depois: CANON/check/test com204controles/37suites, C11, TypeScript/security/playback/update/web/site, contratos de artefatos, suites de series/imagens/parental/progresso intactas. Revisao React da skill vercel:react-best-practices. APK separado somente apos PASS; C11 antes de Capacitorcopy/Gradle e depois; Android257/39 e assembleDebug, assinatura/package/version/manifest/permissoes/assets/DEX comparados a R4. Java/DEX devem ser byte-identicos a R4, preservando contencao. Sem instalacao ou teste de aparelho. Preparar roteiro Fire AFTSS/tabletSM-X610/phoneSM-S926B, todosPENDING.

## Fontes e publicacao

Documentacao primaria consultada27/10/2026: https://developer.themoviedb.org/reference/tv-season-details , https://developer.themoviedb.org/reference/tv-episode-images , https://developer.themoviedb.org/docs/image-basics , https://developer.themoviedb.org/docs/faq . Existem aviso TMDB/JustWatch em Settings; FAQ requer logo aprovado e creditos e distingue uso comercial/licenciamento. Nao adicionar branding fora deste patch nem afirmar licenca comercial verificada. Checklist de atribuicao/logo/licenciamento comercial permanece requisito antes de PUBLICACAO, que nao esta autorizada. Nenhum email/contato externo.

Entrega: relatorio com matriz exigida e APK+SHA caso todos testes passem, RESULT=TMDB_EPISODE_ENRICHMENT_LOCAL_READY_FOR_PHYSICAL_VALIDATION; caso falhe, causa exata sem falso sucesso. APK_INSTALL=NAO; FIRE/TABLET/PHONE_PHYSICAL_VALIDATION=PENDING; sem Git/deploy/Supabase/SET01/proximoGate.


# Refinamentos anteriores ao congelamento do candidato — 27/10/2026

O SPEC_BEFORE_CODE original e seu hash no PREFLIGHT permanecem preservados. Estes esclarecimentos registram as escolhas verificadas durante a implementacao, antes da emenda e da regressao completa.

- A identidade reutiliza useArtworkMetadata, que chama o resolvedor existente; nao duplica a descoberta da serie. ID explicito de episodio, corroborado por serie/temporada/numero, permite titulo localizado diferente. Um titulo significativo divergente sem ID ou still coincidente continua ambiguo; ID conflitante, distribuicao incompatível, marcadores de edicao e duracao fortemente divergente impedem enriquecimento mesmo havendo titulo parecido.
- Um poster reconhecido como sendo da serie nao e cena. Um still conhecido de outro episodio na mesma temporada confirmada e rejeitado, preservando textos locais. Nenhuma inspecao de pixels certifica o conteudo editorial de uma imagem remota: identidade e associacao sao verificadas pelos campos publicados.
- Fonte, resposta TMDB e imagem sao medidos separadamente no harness Chromium com I/O controlado. Esses tempos incluem polling/transporte local do harness e nao medem rede real, TV, decoder ou primeiro quadro. Cache de temporadas e RAM efemera; imagens reutilizam a fila e o cache existentes.
- Os testes novos executam codigo real nos limites descritos em seus resultados. Autoridade parental/playback e consulta de identidade tem adapters; suites historicas de C9/parental/continuidade permanecem obrigatorias. Nenhuma nova prova fisica e alegada.
- Imagem w300 segue o modelo base/tamanho/caminho documentado pelo TMDB. Atribuicao/logo e condicoes comerciais serao conferidos antes de eventual publicacao; esta autorizacao nao publica nem instala.


# Refinamento da allowlist antes de editar harness historico — 27/10/2026

CANON-01-TMDB-EPISODE-METADATA-ENRICHMENT, mesma autorizacao local e mesmo produto. A primeira regressao completa falhou em test-series-poster-composition porque seu filho test-c11-source-first-tmdb-artwork possui loader CommonJS com portas TSX fixas. Novos imports de apresentacao nao sao reconhecidos. Auditoria identificou o mesmo limite em quatro outros renderizadores de teste e a necessidade de declarar destino CSS no bundler do teste de retorno real Chromium.

Nao modificar produto para acomodar loaders antigos. Acrescentar APENAS estes seis caminhos ao escopo de testes/governanca, total23 caminhos, sem ampliar os sete de produto:

1. scripts/test-c11-source-first-tmdb-artwork.mjs
2. scripts/test-c11-home-hero.mjs
3. scripts/test-c11-detail-tablet-tv.mjs
4. scripts/test-c11-episode-continue-row.mjs
5. scripts/test-c121-detail-genres.mjs
6. scripts/test-series-episode-return.mjs

Mudancas permitidas: novas portas de apresentacao opcional mantendo os episodios originais nas suites de artwork/hero/generos/continuar, e destino/leitura/servico do CSS compilado na suite Chromium que executa a pagina real. O harness de arvore sintetica pode materializar o render-prop fonte para continuar inspecionando as mesmas linhas/handlers. Nao remover/alterar assert, fixture de autoridade, negativo, timeout, skip, resultado ou marcador existente. Auditar AST de todos assert recebidos antes/depois; produto real de enriquecimento continua coberto por36 testes unitarios+22 Chromium da suite nova, sem stub dos novos componentes.

Essa e uma compatibilidade de harness necessaria a regressao completa requerida pelo anexo; nao altera contrato de produto ou enfraquece teste. Registrar revisao do recibo44 com testChangesReviewed=true, novos hashes/supersedes, preservar43 recibos e o primeiro FAIL/logs. O texto original de spec e o hash continuam intactos; os termos iniciais '17 caminhos' e 'nenhum teste historico alterado' passam a ser historicos da primeira revisao, substituidos por este refinamento expresso. Nenhum verificador sera editado.


## Refinamento de harness — escopo final22

O ensaio extra test-c11-home-hero falhou antes dos loaders, no primeiro assert de normalizacao Movie (ano) | [4K]. Execucao somente leitura na R4 recebida confirmou o MESMO FAIL (undefined versus2026). Nao e regressao do enriquecimento nem integra as36 suites canonicas herdadas. Sua alteracao propria de loader foi revertida integralmente aos bytes R4 e o caminho retirado da allowlist/recibo/comandos deste Gate; nao corrigir normalizacao de release tags fora de escopo. Cinco harness recebem somente portas/destino CSS, todos asserts identicos. Allowlist FINAL22, produto7 inalterado, stage1490, protegidos952. Resultado/log extra e baseline mantidos como limitacao preexistente, sem alegar PASS dessa suite.


## Escopo final de compatibilidade:20 caminhos

Restringida a adaptacao aos tres harness efetivamente exigidos: source-first TMDB artwork (filho da suite canonica series-poster), episode-continue-row (comando herdado) e series-episode-return (suite canonica). Todos asserts recebidos identicos segundo AST. Experimento extra detail-tablet-tv encontrou porta DetailBackdrop ja ausente na R4, reproduzida em leitura na R4; seus bytes e os do helper detail-genres foram restaurados integralmente, sem ampliar contratos para consertar testes antigos fora da regressao exigida. Home-hero tambem permanece byte-identico ao recebido e seu FAIL extra/baseline foi preservado. A lista inicial6/23 e intermediaria5/22 sao historico dos refinamentos, NAO o escopo final. Allowlist FINAL20; tres harness mudam somente apresentacao de fixture/bundler/CSS,7produto intacto,37suites continuam obrigatorias. Esses dois FAILs extras da baseline nao sao promovidos a PASS ou classificados como regressao nova.


# Ajuste mobile solicitado durante a execucao — 27/10/2026

Pedido literal do usuario: "em tela mobile, coloque a imagem no topo e a sinopse e o botao abaixo".

Mesmo Gate e mesma allowlist20. Aplicar aos cards de episodio no layout phone, retrato E paisagem: cena16:9 no topo ocupando a largura interna do card; titulo/numero/duracao, sinopse e botao abaixo. Manter o layout recebido de tablet/TV e os mesmos IDs/keys/handlers, sem nova area de foco. Reserva da altura antes de metadata/imagem para manter foco/scroll. A classe existente series-phone-panel permite distinguir phone de tablet, inclusive paisagem mais larga que640px; nao alterar PhoneSeriesDetail.

Antes do CSS, novo RED no harness real com verificacao geometrica da imagem acima das informacoes/acao. GREEN exige isso nos dois viewports phone, largura correspondente ao card e16:9; asserts anteriores de foco/node/scroll/imagem/acao permanecem. Novo teste24 casos UI (22 recebidos desta implementacao+2 mobile),36 unitarios. Atualizar somente CSS do produto, script UI e recibo44/hashes/evidencia; os43 recibos e R4 continuam intactos. Nova validacao final completa depois do ajuste, APK separado e sem instalacao.

RED_MOBILE_LAYOUT exit1 preservado antes do CSS. O ensaio em andamento anterior ao pedido mobile e revisao intermediaria; somente nova regressao apos ajuste serve ao candidato final. Produto alterado somente no CSS ja allowlisted; UI24 casos agora, todas verificacoes anteriores mantidas.


# Referencia visual mobile substitui arranjo anterior — 27/10/2026

Pedido do usuario: "refaca o formato de series, coloque como no netflix", acompanhado de captura de lista mobile de episodios. Mesma apresentacao do Gate autorizado, mesmos20 caminhos allowlisted, sem nova funcionalidade de download ou catalogo remoto.

Interpretacao da referencia no shell phone: cabecalho de cada episodio com miniatura16:9 esquerda, titulo/numero e duracao direita; botao de reproducao circular sobre miniatura; sinopse abaixo em toda largura. Substitui a instrucao mobile anterior de miniatura em largura completa acima de tudo. Temporada via select acessivel que reutiliza IDs/estado/handler de selecao recebido; opcoes limitadas as temporadas locais. Preservar abas/acoes existentes, Assistir/Continuar/Preparando, foco/retorno, imagens opcionais e reserva de geometria. Sem alterar layout tablet/TV, PhoneSeriesDetail, trailer, player ou dados de autoridade.

Antes do novo CSS/markup, RED geometrico na UI real para header lado a lado e sinopse abaixo. A suite UI sera atualizada para essa referencia e ampliada com seletor/retorno mobile: asserts antigos de identidade/cache/foco/estabilidade preservados. Troca de temporada no harness envia evento change real no select, e continua usando clique de tab em TV/tablet. Comparar screenshots sinteticos retrato/paisagem; nao alegar validacao fisica.

Botao visualmente iconico conserva o MESMO button/data-series-episode-id/handler/key, com aria-label explicito identificando a acao e episodio. Novo recibo44 revisado, hashes/CANON/regressao/builds novamente, APK separado sem instalacao. A execucao intermediaria mobile anterior terminou PASS, mas somente a fonte final desta referencia integra a entrega.

# Fallback horizontal da serie solicitado pelo usuario — 27/10/2026

Pedido literal: "em serie que o tmdb nao fornecer a imagem, coloque a imagem horizontal fornecida pelo tbmb da serie". Mesma identidade publica confirmada e mesmo Gate/allowlist20.

Quando nao houver still aplicavel do episodio, utilizar backdropUri horizontal da PROPRIA serie confirmada no TMDB; nao usar poster vertical ou outra serie/episodio. A imagem e generica da serie, nao e prova de correspondencia individual e nao altera MATCH_CONFIRMED/AMBIGUOUS/UNAVAILABLE nem os textos/IDs locais. E a substituicao expressa do requisito anterior de placeholder para esse caso, sem associacao falsa de cena individual.

Prioridade: still do episodio confirmado; se ausente, backdrop horizontal publico da serie confirmada; sem ambos, imagem legitima da fonte ou placeholder. Para episodio ambiguo, nunca usar candidato de outro episodio: pode usar somente o backdrop generico da serie ou apresentacao local segura. Aguardar resolucao da consulta da temporada antes do fallback evita descarregar/baixar banner temporario durante carregamento e trocar por still logo depois. HTTP404/timeout da temporada tambem pode conservar a imagem da serie ja resolvida. Sem novo endpoint, cache, decoder ou credencial; normalizar w300 e reutilizar fila/cache/dedup recebidos.

Marcar origem somente como dado de apresentacao (episode/series) e manter imagem decorativa. O hook fornece backdrop apenas se confirmEpisodeSeries validou a identidade atual; nada de inferir serie por titulo semelhante. Validacao local: RED antes do patch, unitarios para imagem ausente/ambiguidade/URI ou identidade invalidas e UI real com temporada sem stills; provar uma unica aquisicao compartilhada do banner visivel e mesmos episodios/IDs/acao. Revisar recibo44, hashes e relatorio final. Nao altera fonte, parental, C9, historia, trailer ou instalacao.

RED_MOBILE_REFERENCE e RED_SERIES_BACKDROP exit1 antes do patch. GREEN39 unitarios/27 Chromium, incluindo uma aquisicao de banner compartilhada e seletor local nas duas orientacoes phone. O arranjo mobile anterior foi substituido pela referencia posterior do usuario; arquivos de evidencia intermediarios preservados. Escopo final20 inalterado, produto7,sem instalacao. Nova regressao final a seguir.


Revisao visual da referencia detectou label textual junto ao icone na paisagem, devido ao font-size importante ja existente no shell. Imagens anteriores preservadas em visual-reference. Corrigido com span do label oculto apenas no phone e aria-label explicito no MESMO botao. Tablet/TV conservam texto; sem mudar handler/ID/foco. Teste mobile agora verifica display none do label em ambas orientacoes, sem enfraquecer os asserts de geometria/acao. Nova rodada final CANON depois do congelamento atual; rodada em andamento e intermediaria para esse detalhe visual.


## P2.7 - Extensao de progresso da interface

Pedido posterior do usuario: no tablet e Fire Stick, retirar o
botao textual Assistir e apresentar progresso abaixo da miniatura.
O celular mantem o botao circular existente.

O metodo savedProgress consulta somente registros existentes:
positionMs, durationMs e completed. Nao ha mudanca no armazenamento,
sessao C9, parental, reproducao ou retomada.

P2.3 e P2.4 foram aplicados antes desta revisao do recibo.
A interrupcao CANON_PROTECTED_CONTENT_CHANGED foi registrada.
Nao apresentar a atualizacao documental como autorizacao anterior
aos patches.

Origem canonica do historico: REFERENCE_BASELINE_NO_PRIOR_GRANT.
Recibo corrente revisado sem editar recibos historicos.
Nova allowlist: 21 caminhos; resultados anteriores nao certificam
a interface modificada. Testes e APK permanecem pendentes.
