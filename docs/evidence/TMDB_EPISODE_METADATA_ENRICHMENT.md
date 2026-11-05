# CANON-01-TMDB-EPISODE-METADATA-ENRICHMENT — evidencia local

Autorizacao e6e2d547-ea7b-4192-b30a-a368d7e98d66, copiada byte a byte em AUTHORIZATION.txt. Fonte R4 completa1479 arquivos/944 protegidos/43 recibos, APK0358e6445b8d273fa3f4ae1a9bf2be7b3a90f74f1159ce1d5ff69e3eebc2e3a9. Baseline fresh CANON204/36, check944/43 e C11 PASS. Root10L1/index vazio e51APKs preservados; somente novo stage isolado recebe produto.

RED_SERVICE e RED_UI anteriores ao produto preservados: servico de temporada ausente e zero slots de cena na pagina real R4. Baseline de tempo em quatro viewports/3 amostras por perfil. Implementados sete caminhos de produto e dois scripts novos; runner somente acrescenta gate/suite. Sem dados de reproducao/catalago autoritativo, Java, trailer, dependencias, backend ou root alterados.

FOCUSED_ALL_r4 PASS:36 casos unitarios executam parser/servico/projecao reais;22 casos Chromium executam pagina e lista compartilhadas/hook/provider/visibilidade/fila reais com I/O adaptado para identidade, API TMDB, autoridade parental/playback e aquisicao de arquivo. Cobrem identidade, homonimas, especiais0, subset/distribuicao/ordem/extras, id errado e edicoes, idioma/descricao/imagem, cache/TTL/bytes/fila/dedup/cooldown/auth/timeout/404/offline, stale serie/temporada/geracao, foco/geometria/ids/continuar, painel oculto e gate parental negado. Originais/snapshots e streams nao mutados. PRELIMINARY_TYPESCRIPT_r1 PASS; regressao completa/build/auditoria ainda PENDENTES nesta evidencia inicial.

Correspondencia conservadora: ID publico da serie corroborado, numero e parent de temporada, numero de episodio MAIS ID explicito, titulo individual exato ou still coincidente. Campos novos ficam somente na projecao; sem adicionar episodios TMDB ao catalogo. Resposta ambigua/indisponivel mantem apresentacao original ou placeholder seguro. Sem request individual /images. Cache RAM16/2MB/6h e miss30s; no max2 chamadas sequenciais por temporada/teto8s, no max2 trabalhos/16pendentes,429 espera1..120s sem retry automatico,401/403 pausa15min. Fila de imagens e cache recebidos reutilizados com stillw300 e slots reservados.

Incidentes proprios preservados: primeira compilacao TSC acusou tipo inferido largo no merge e import React sem uso; corrigidos sem alterar politica. Expectativa inicial de UI presumiu estado pendente com resposta instantanea; teste passou a segurar resposta na fronteira de I/O. Helper de quoting falhou antes de editar. O REDUI inicial criou somente uma pasta vazia em R4/workspace/tmp/episode-metadata-ui, sem arquivos: a revisao automatica bloqueou sua remocao por politica, sem motivo detalhado adicional. Nao se contornou o bloqueio; diretorio vazio mantido e todos arquivos R4 revalidados. Outputs posteriores exclusivamente neste trabalho. Nenhum destes incidentes foi chamado de defeito fisico do app.

Skill React revisada em REACT_REVIEW.md. Documentacao primaria: [temporada](https://developer.themoviedb.org/reference/tv-season-details), [imagens de episodio](https://developer.themoviedb.org/reference/tv-episode-images), [URLs de imagem](https://developer.themoviedb.org/docs/image-basics), [configuracao](https://developer.themoviedb.org/reference/configuration-details), [atribuicao/licenciamento](https://developer.themoviedb.org/docs/faq). Sem consulta real autenticada ou credencial registrada. Logo/licenciamento comercial nao auditados; condicao antes de publicacao, que nao e autorizada.

FIRE_PHYSICAL_VALIDATION=PENDING. TABLET_PHYSICAL_VALIDATION=PENDING. PHONE_PHYSICAL_VALIDATION=PENDING. APK_INSTALL=NAO. Sem promocao/root/Git/deploy/Supabase/SET01; NEXT_GATE_STARTED=NAO.


Incidente de recibo novo: CANON_REGRESSION_PLAN_REQUIRED rejeitou requiredTests contendo o helper UI nao registrado diretamente. Corrigido somente o recibo novo44: requiredTests referencia a suite principal que executa o helper; mandatoryCommands tambem explicita o helper UI. Recibo revisao1/log mantidos externamente;43 recibos anteriores e verificador intactos.

Esclarecimento do segundo diagnostico do recibo: requiredTests e limitado a SUITES fixa do verificador, nao a lista extensivel do runner. Preservada integralmente a lista obrigatoria herdada; ambas suites novas continuam em mandatoryCommands e a principal no runner canonico (executa UI). Nenhum verificador/teste foi enfraquecido. Revisoes1/2 e ambos FAILs locais preservados.


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

Incidente do teste novo de icone: quoting incorreto ao acrescentar getComputedStyle gerou SyntaxError antes da UI executar. Corrigidas somente aspas no script novo; arquivo falho/log/revisao do recibo preservados. Produto nao alterado por esta correcao, verificacoes mantidas. Check sintatico explicito e nova execucao focada antes da regressao final congelada.


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


## P2.9 - RESTAURACAO DA GEOMETRIA MOBILE

O teste Chromium identificou uma regressao visual apos P2.4:
REFERENCE_MOBILE_HEADER_SYNOPSIS_AND_PLAY_OVERLAY.

A regra da nova miniatura substituiu a altura responsiva
do celular por 81px fixos, apesar da exigencia 16:9.

Correcao CSS especifica para phone, preservando os tamanhos
de Fire Stick e tablet. Nenhuma alteracao de playback,
TMDB, historico, foco, controle parental ou fonte.

O resultado permanece PENDING ate novas validacoes.


## P2.13 - Compatibilidade sem regressao visual

A regressao test-c11-episode-continue-row exige os indicadores
Continuar assistindo e ▶ Continuar para episodios retomaveis.

Na TV/tablet os textos permanecem apenas como nome acessivel
e conteudo visualmente oculto do botao de miniatura.
Nenhum botao textual volta a aparecer.

O celular, os handlers, os IDs, o historico e a barra de
progresso permanecem inalterados.

Falha do teste antes da correcao registrada como evidencia.
Nova validacao obrigatoria; nao declarar PASS antecipadamente.


## P2.19 - COMPATIBILIDADE DO HARNESS DE RETORNO

Diagnostico P2.17: Chromium Runtime.exceptionThrown revelou
TypeError: watchHistory.savedProgress is not a function.

P2.18 confirmou que o harness legado tinha savedPosition:()=>0,
sem savedProgress. Foi adicionado savedProgress:()=>undefined
somente ao mock do teste de retorno.

A fixture continua sem progresso salvo.
Todos os asserts historicos foram preservados e comparados por AST.
Nenhum timeout, player, interface de producao, API ou dado real
foi alterado.

TIMEOUT_PAGE anterior e diagnostico preservados.
Aprovacao funcional depende da nova execucao.
