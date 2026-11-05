# XANDEFLIX-PHYSICAL-VALIDATION-06 — especificação prévia

Autorização: pedido nominal do usuário para identificar APKs já instalados e executar homologação física segura, sem novas instalações. Data local de abertura25/10/2026. Não presumir sucesso local como físico. Este gate não altera produto, testes, configuração, fontes ou versões.

Preflight: root ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, origin https://github.com/xandeflix2/xandeflix-prebuilt.git, branch operacional fix/source-output-format-recovery, HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8, baseline/main b3fc8d1e3844bc5601813ab1b298289af5b3f1fd,10 diferenças L1 recebidas. Reutilizar proveniência e exceção operacional já documentadas, sem mover main. Workspace histórico não será operado. AGENTS/Architecture/Execution/Source Boundary e plano físico05 lidos.

Allowlist: somente artefatos novos neste diretório tmp e helper tmp/physical-validation-06-20261025.mjs. Para registros normativos, cópia isolada documental do05 com quatro documentos append-only e nova especificação/evidência; nenhum source/test/config/recibo antigo pode mudar. Preservar root e estágios03/04/05 por hashes. Não gerar/instalar APK, usar Gradle, Git staging/commit/push/merge/PR/deploy ou backend. Diagnóstico não exige reexecutar testes imutáveis; CANON de integridade pode ser executado na cópia documental.

Fase1: adb devices -l e leituras por serial de modelo/API/Android/ABI, pm path, metadata pública e SHA256 dos APKs. Comparar com artefatos locais conhecidos e verificar apksigner no mesmo arquivo por hash. Se necessário, ler apenas APK público instalado para auditoria, nunca /data/data ou armazenamento privado. Inspecionar em RAM ZIP/DEX/assets para presença de ciclo04, gravando somente booleanos/digests e nomes públicos. Ausentes/offline/unauthorized são PENDENTES, sem presumir binário. Nenhuma tela/entrada será alterada nesta fase.

Fases2–4: disponibilidade para interação solicitada antes de navegação, rotação, fullscreen ou abertura normal de app. Esperar confirmação para cada alvo; continuar identificação/coleta passiva independente enquanto pendente. Sem confirmação não injetar teclas/cliques/foco/start/stop. Quando autorizado, usar navegação real e streaming próprio existente; não mudar fonte/política/autoridade, não ultrapassar limites de telas por testes simultâneos involuntários. Testes de reprodução em dispositivos feitos sequencialmente e com acompanhamento. Não coletar URLs/títulos de catálogo sensíveis, credenciais, ativação ou conteúdo privado.

Instrumentação: somente ADB público/memória/CPU/framestats e CDP próprio de Runtime/Performance/input após disponibilidade. Sem Page.captureScreenshot/screencast/Emulation/viewport/escala/CSS/overrides nem captura que afete superfície. ADB forwards temporários no host serão removidos. Não limpar contadores/dados/logs. Logs brutos só em RAM, persistir eventos sanitizados permitidos. Relatar limitações de overhead. Gravação externa depende do usuário; rAF não certifica FPS na TV.

Sessões controladas mínimas10min quando disponíveis, Home/navegação/repouso/ciclos de espera e playing real, background/retorno e liberação. A espera1000ms é prazo de tentativa; não fabricar vídeo pronto nem10min contínuos de playing a partir de ciclos45s. Medir36 setas6direita6esquerda, vertical/repeat/reverso, âncora, paginação e rotas. Cada resultado PASS/FAIL/PENDENTE/INCONCLUSIVO e seu escopo. CPU por jiffies sem HZ presumido, app e renderer; PSS/Graphics próximos, percentis rAF/latência e HWUI delimitados sem misturar histórico.

Ciclo04 só será homologado se encontrado no APK instalado; caso03, registrar literalmente CONTROLE DE DADOS MÓVEIS: NÃO INCLUÍDO NESTE APK. Rede celular real e acompanhamento exigem disponibilidade explícita, sem troca automática de rede. Não classificar função ausente como falha. Falha grave/tela preta persistente/perda funcional encerra cenário afetado preservando evidência sanitizada; não corrigir ou fazer rollback neste gate.

Entrega: matriz por dispositivo, identidade/hash/cert/ciclos, funções realmente testadas, métricas reais e limites, trailer/playing, piscadas, dados móveis, defeitos/recomendações e pendências. Sem prometer60FPS, zero dados perdidos, flicker resolvido ou primeira instalação com base em amostra/cache. NEXT_GATE_STARTED=NAO.

Diagnósticos e resultados físicos serão anexados após coleta. PASS local não equivale a PASS físico.


## Relatório físico consolidado06

# Xandeflix — homologação física dos APKs instalados

**Gate: XANDEFLIX-PHYSICAL-VALIDATION-06. Datas: 25–26/10/2026, America/Sao_Paulo. RESULT=PARTIAL_VALIDATION_WITH_CONFIRMED_VISUAL_FAIL.**

O candidato03 foi identificado por SHA256 e certificado nos três aparelhos. Há reprodução real nas novas amostras de celular e tablet e caminhos de navegação aprovados no Fire. **O trailer do Fire foi reprovado visualmente pelo usuário: cobre o card e ultrapassa a área delimitada.** A sessão afetada foi interrompida. Uma checagem posterior com entrada em Detalhes confirmada também não recuperou a grade/foco esperado pelo Back nativo. Não há homologação integral, correção aplicada, comprovação de 60 FPS ou causa confirmada das piscadas.

## Identidade e autorização

APK efetivamente instalado nos três aparelhos: **com.xandeflix.prebuilt, versionName1.0.37 / versionCode37**, SHA256 **dd885bdd677c231e24684462abb8e0641fc50be05570b3c7cb26dba350ef833c**. É o artefato fechado/auditado do candidato XANDEFLIX-UI-PERFORMANCE-RECOVERY-03 no gate05. A versão numérica também existe em outros APKs históricos; o SHA256 distingue os binários.

Certificado SHA256 **b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d**, assinatura verificada. Hashes dos APKs públicos instalados conferidos no inventário e novamente em FINAL_DEVICE_IDENTITIES.json. Nenhum APK foi instalado ou substituído pelo executor neste gate. O usuário informou ter feito as instalações antes da identificação.

Os marcadores nativos e de UI exclusivos do ciclo04 estão ausentes, em concordância com o hash exato03. Nos três aparelhos: **CONTROLE DE DADOS MÓVEIS: NÃO INCLUÍDO NESTE APK.** A ausência dessa função não foi classificada como defeito. Não se executou homologação de consentimento celular do ciclo04, mesmo tendo sido observada rede celular no telefone.

Alvos ADB acessíveis e identificados:

| Papel / modelo | Android / API | ABI reportada | Identidade do APK |
| --- | --- | --- | --- |
| Fire Stick AFTSS / G071CQ070344374G | 9 / 28 | armeabi-v7a, armeabi | PASS,03 exato |
| Tablet SM-X610 / RX2X301Q3KY | 16 / 36 | arm64-v8a, armeabi-v7a, armeabi | PASS,03 exato |
| Celular SM-S926B / RXGYB03FL4W | 17 / 37 | arm64-v8a | PASS,03 exato |

O usuário confirmou expressamente a disponibilidade do Fire para automação e de celular/tablet para toque, rotação e fullscreen. As operações autorizadas foram navegação normal e diagnóstico. AGENTS, Architecture/Execution Contract, Source Data Boundary e plano05 foram lidos; especificação anterior aos diagnósticos em SPEC_BEFORE_DIAGNOSTICS.md. Gate único, allowlist documental de seis caminhos, sem alteração funcional, de testes/configuração ou dos37 recibos. A restrição histórica do plano05 foi substituída somente pelo escopo de testes físicos explicitamente autorizado no gate06.

## Matriz consolidada por aparelho

PASS abaixo vale para a amostra descrita. PENDENTE significa caso não homologado; INCONCLUSIVO significa evidência insuficiente ou execução contaminada; FAIL mantém o defeito observado aberto.

| Item exigido | Fire Stick | Tablet | Celular |
| --- | --- | --- | --- |
| Modelo/Android | AFTSS, Android9/API28 | SM-X610, Android16/API36 | SM-S926B, Android17/API37 |
| APK instalado | PASS, SHA dd885… / code37 | PASS, mesmo SHA/certificado | PASS, mesmo SHA/certificado |
| Ciclos incorporados | 03 e sua base histórica;04 ausente | Mesmo03;04 ausente | Mesmo03;04 ausente |
| Funcionalidades exercitadas | Home/Filmes/Séries, expansão, âncora, categorias, Recentes/Destaques, grade virtual e Busca D-pad | Home/Filmes/Séries, detalhes, Busca touch, rotação restaurada, filme/episódio/Live/fullscreen | Mesmos fluxos de toque, filme/episódio/Live/fullscreen; sessão existente |
| Desempenho | FAIL do critério de pesquisa60 durante navegação; rAF27,32Hz em10min. FPS real da TV PENDENTE | Sem benchmark FPS pareado; navegação e mídia em amostras reais. Sessão prolongada abaixo | Sem benchmark FPS pareado; navegação e mídia em amostras reais. Sessão prolongada abaixo |
| Trailer | FAIL visual fora do card; quatro solicitações e quatro eventos playing | PENDENTE de prévia pública; o Live testado é outro player | PENDENTE de prévia pública; o Live testado é outro player |
| Piscadas | INCONCLUSIVO, sem gravação externa contínua | PENDENTE de correlação visual prolongada | PENDENTE de correlação visual prolongada |
| Controle de dados móveis | NÃO INCLUÍDO NESTE APK | NÃO INCLUÍDO NESTE APK | NÃO INCLUÍDO NESTE APK |
| Problemas/limites | FAIL do trailer fora dos limites e do retorno nativo à grade na amostra confirmada; quadros longos; retenção vertical | HTTP403 em tentativa anterior, posterior filme/episódio/Live aprovados; modal do diagnóstico interferiu temporariamente | Parser3003 anterior, posterior filme/episódio/Live aprovados; uso manual/rede e precondições impediram comparação limpa |
| Próxima ação recomendada | Corrigir limites nativos do trailer em novo escopo; medir trabalho visual e repetir casos afetados; correlação externa das piscadas | Repetir mídia prolongada e fases equivalentes de memória; preservar o sucesso restrito às amostras reais | Repetir sessão prolongada disponível e retorno fullscreen observado; não presumir limite de conexões |

## Fire Stick — desempenho medido

Rodada curta de36 comandos, seis direita/seis esquerda repetidos três vezes, pausa nominal180ms e transporte DevTools:36 emitidos/36 recebidos; cadência rAF31,15Hz; intervalo rAF p95 de83,5ms; keydownDOM→próximo rAF p95 **12,9ms**. HWUI:74 frames novos presentes no buffer delimitado,69janky, p95 de114,98ms. Esse p95 de resposta não prova apresentação em12,9ms, nem mede Bluetooth/controle físico.

Sessões reais, sem captura CDP ou emulação de superfície:

| Sessão / arquivo JSON | Duração(s) | Comandos | Cadência rAF(Hz) | Intervalo rAF p50/p90/p95/p99(ms) | HWUI janky/frames novos |
| --- | ---: | ---: | ---: | --- | ---: |
| navigation-controlled | 601,8 | 843 | 27,32 | 16,7 / 100,1 / 116,8 / 200,2 | 2377/3003 |
| idle-post-network | 601,3 | 0 | 59,41 | 16,7 / 16,8 / 16,8 / 16,8 | 10/10 |
| trailer-cycles-stable-new-signal | 444,0 | 8 | 50,27 | 16,7 / 16,8 / 16,8 / 116,7 | 813/2339 |
| background-no-preview | 603,0 | 13 | 29,25 | 16,7 / 16,8 / 16,8 / 100,0 | 152/233 |

Navegação controlada:601,8s,843 comandos recebidos,60 amostras na Home, mesmo PID principal observado. O rótulo PASS_COMPLETED_SESSION_OBSERVATION registra conclusão da coleta, **não PASS de fluidez60** nem comprovação de aplicação individual dos843 comandos. A navegação é real, mas o aparelho/rede/fonte tiveram intervenções do operador, impedindo um A/B pareado com os APKs antigos.

O repouso de601,3s ficou na Home sobre capa, sem trailer playing observado. Sua cadência59,41Hz não representa navegação a60FPS. Dez frames HWUI desenhados/janky em dez minutos de UI estática não são todos os refreshes da TV. A sessão de background contém25 amostras hidden e13 ações normais de saída/retorno, com mesmo PID; cadência agregada e outlier de43,8s incluem suspensão do renderer e não são benchmark da UI em foreground.

A sessão de trailer durou443,96s e foi interrompida antes de dez minutos por causa do relato visual. O arquivo bruto termina com INCONCLUSIVO/SCENARIO_LEFT_HOME_OR_HIDDEN porque **o executor navegou para Configurações para encerrar a prévia**; não foi uma saída espontânea. A classificação funcional final é FAIL visual, preservando o arquivo bruto.

CPU usa diferenças de jiffies do processo pela soma dos oito primeiros campos agregados de todas as CPUs, sem assumir HZ. Foram excluídos intervalos iniciais menores que1s. Principal32299 e renderer32382, este identificado por eventos Layout/Paint numa trace curta separada de quatro teclas. Não se afirma cobertura de todos os subprocessos/decoder do trailer.

| Sessão | CPU app p50/p95(% todas CPUs) | CPU renderer p50/p95(% todas CPUs) | PSS app inicial→final(MiB) | PSS renderer inicial→final(MiB) |
| --- | --- | --- | --- | --- |
| navigation-controlled | 12,95 / 20,53 | 25,32 / 34,41 | 132,3 → 211,8 | 81,7 → 141,6 |
| idle-post-network | 1,51 / 3,24 | 17,12 / 19,42 | 189,3 → 150,0 | 161,4 → 115,9 |
| trailer-cycles-stable-new-signal | 6,11 / 18,80 | 12,23 / 31,37 | 222,8 → 180,0 | 125,8 → 148,9 |
| background-no-preview | 2,49 / 10,96 | 6,33 / 21,17 | 233,3 → 115,2 | 151,0 → 123,6 |

O contador rAF também consulta a presença de playing no DOM a cada callback. Isso, as coletas ADB e os listeners acrescentam trabalho, especialmente numa Home com muitos nós. Não apresentar os17,12% medianos do renderer em repouso como CPU do produto sem instrumentação. PSS principal p95 da navegação228,4MiB, pico242,9MiB; p95 com trailer246,9MiB. Graphics pode integrar PSS: não somar os dois como recursos adicionais. App e renderer foram coletados próximos, não simultaneamente em todos os picos; não fabricar um pico conjunto.

A Home passou de464 para1027 nós media-card durante a navegação, permanecendo1027 no repouso. No início, a contagem também pode incluir placeholders; no final havia1027 cartões de conteúdo. O máximo amostrado por faixa foi20, compatível com a janela horizontal cujo teto de código é24. Isso demonstra retenção de seções visitadas, não montagem de todo o catálogo ou download de todas as capas. Memória diminuiu no repouso e após background; não há prova de vazamento nem homologação de ausência de crescimento entre ciclos equivalentes.

**Meta60: NÃO HOMOLOGADA.** Os intervalos de navegação medidos ficam acima do orçamento16,7ms; o FPS visual efetivo na TV permanece sem medida adequada. A auditoria01 usou e457…; a referência intermediária era ec7f…; desktop03 tem outro hardware/metodologia. Nenhuma comparação percentual de ganho entre eles é causalmente válida neste gate.

## Fire Stick — funções, foco e grades

Home/Filmes/Séries e as faixas foram alcançadas. CSS computado do cartão: altura244px, transitionDuration0s/transitionPropertynone. Em24 amostras após130ms de acomodação por tecla, a posição horizontal do cartão focado foi **x=68px em todas**. A amostra imediata do próximo rAF da rodada curta ocorria antes do callback posterior de alinhamento e não serve, sozinha, como falha de âncora. Isso valida a posição estabilizada amostrada, sem medir cada pixel da transição.

Recentes: contexto de tamanho D-pad presente, contexto de prévia pública ausente; dois cartões naquele snapshot. Filmes/Séries em Destaque:20 cartões por faixa e contexto home. Não se certifica autoplay pessoal ausente em todos os históricos possíveis apenas por esse snapshot.

Busca: caminho input→filtro→resultado→filtro→input exercitado e query preservada, seis resultados na amostra do Fire. Toque/IME horizontal de aparelho físico com teclado não teve homologação completa. Heros de Home/Filmes/Séries tiveram imagens decodificadas e borda decorativa computada0px nos casos observados; logo original decodificada. Não foi verificado visualmente cada título/alternativa/fallback real da fonte. Dados duplicados de imagens na coleta aninhada não equivalem a downloads diferentes.

Grade: chegou ao índice lógico105 com máximo70 cartões montados na passagem observada; grade sem expansão. Não equivale ao último título, índice561 ou milhares de registros reais. As primeiras tentativas de retorno foram INCONCLUSIVAS: o índice era lido no botão, embora o atributo esteja no ancestral; também se buscou um botão Voltar DOM inexistente no modo remoteBackOnly do Fire. Na repetição inicial, a página registrada depois do Enter era Configurações e não Detalhes. Essas tentativas permanecem preservadas, sem promoção a PASS ou atribuição de causa.

**Retorno à grade: FAIL na última amostra com Detalhes confirmado.** FIRE_GRID_RETURN_CONFIRMED_DETAIL_VISIBLE.json chegou ao índice105, usou scrollIntoView normal para materializar a condição de cartão visível, confirmou o cartão focado e clicou nele pelo handler real. A página detail-page foi observada antes do Back Android (input keyevent4). Nas20 verificações seguintes, ao longo de23,1s incluindo transporte/coleta, a grade e o mesmo cartão/foco não foram recuperados. Nenhum timeout de produto foi modificado. O helper não registrou a classe da página de destino após Back; portanto a causa e o destino exato permanecem abertos. É uma falha do resultado esperado desse protocolo, não prova de regressão introduzida pelo03 em relação a um APK anterior não pareado. A nova falha prevalece sobre a aprovação local de retorno do ciclo03. O caso afetado foi encerrado; controles físicos Enter/Back por Bluetooth e retorno561 continuam pendentes.

Pressões discretas foram injetadas nos handlers reais; **controle físico mantido/repeat, latência Bluetooth, todos os lotes até o fim, última linha e retorno561 permanecem PENDENTES**. Não transformar um keydown DevTools em homologação do controle físico.

## FAIL — trailer fora da área delimitada

Relato do usuário: “O TRAILER ESTA COBREPONDO O CARD E NAO ESTA DENTRO DA AREA DELIMITADA DO CARD”. Registro técnico em26/10/2026 **00:29:35 America/Sao_Paulo** (03:29:35UTC), durante playing. Esse é o horário do registro, não uma determinação do primeiro instante do defeito.

Geometria DOM naquele instante, viewport960×540/DPR2:

| Elemento | x/y(px CSS) | largura×altura | Overflow |
| --- | --- | --- | --- |
| Card expandido | 68 /147,99 |355,55×244 | hidden |
| Superfície de expansão |69 /148,99 |353,55×200 | hidden |
| Poster |69 /148,99 |353,55×200 | hidden |

O retângulo efetivamente desenhado pela WebView nativa do trailer não foi medido. O DOM delimitado não garante que a camada nativa esteja recortada. Leitura do código fechado: card-preview-media.ts envia bounds obtidos por getBoundingClientRect; PublicTrailerPlugin cria uma WebView separada via Activity.addContentView e converte coordenadas com escala/offset do host. Essa camada fica fora do recorte CSS do card. **Conversão de coordenadas/insets, dimensionamento e clipping nativos são hipóteses a verificar; a causa exata permanece NÃO CONFIRMADA.** Nenhum patch Java/CSS/timeout foi aplicado.

Quatro chamadas PublicTrailer.open chegaram aproximadamente1436,8 /1009,2 /1008,7 /1019,2ms após o foco monitorado. Quatro eventos playing ocorreram16824,6 /12180 /11900,6 /13321,8ms após o foco. A tentativa é compatível com o prazo de1s nos casos quentes; primeiro caso inclui espera/resolução. Isso não garante vídeo pronto ou primeiro quadro em1s. Ready/playing do adaptador nativo e o relato físico diferenciam esta coleta das antigas, sem trailer aberto.

A sondagem do relógio do player público não encontrou o alvo esperado; **não há prova independente de avanço de currentTime, frames decodificados ou FPS desse vídeo**. Não classificar dez minutos de vídeo contínuo: ocorreram ciclos com intervalos e a sessão parou em7min24s. A saída normal para Configurações removeu expansão/playing observados. Cancelamento visual completo, áudio residual e clipping corrigido exigem reteste após correção, com observação externa. Não repetir a condição defeituosa para completar um cronômetro.

## Celular e tablet — novas amostras de reprodução

Depois da atualização de sinal feita pelo usuário e do fechamento correto do modal de diagnóstico, **ambos reproduziram VOD com posição nativa avançando** em observação de aproximadamente30s. NativePlayerActivity estava retomada; cinco posições distintas foram observadas. Tablet: sequência inicial28,6→33,6→38,6→43,6s; celular:3,7→8,7→13,8→18,8s. Foram usados controles normais e Back para retornar, sem persistir URLs/identificadores de mídia.

Episódio: oito opções na amostra, botão disponível, progresso nativo em ambos (tablet3,45→8,45→13,47s; celular3,90→8,91→13,94s). Live: evento nativePreviewPlaying em ambos e fullscreen=true após ação normal de toque. O fluxo de retorno alcançou a Home nos dois nas amostras correspondentes. O Live não é o trailer público e não homologa seu recorte.

Reteste explícito de fullscreen no tablet confirmou true→false e os respectivos eventos nativos. O helper registrou finalHome=false apenas500ms depois de clicar Home; outra coleta posterior já estava na Home. Não classificar como travamento. No celular, a repetição explícita de retorno não conectou ao CDP naquele momento; a sessão posterior de navegação e o inventário final o encontraram Awake. A falha de conexão isolada não comprova crash. A entrada em fullscreen e retorno posterior à Home das amostras anteriores continuam válidos dentro desses limites; o novo ciclo completo com comprovação de saída fullscreen fica PENDENTE.

Toque em Home/Filmes/Séries/Busca e abertura de detalhes foram exercitados; houve resultados de Busca em ambos. Rotação de tela foi testada por configuração Android temporária e **restaurada aos valores exatos anteriores**, conforme registros. Não houve Emulation/CDP viewport override. Detalhes continham título e imagens; um seletor antigo de sinopse do telefone não correspondia à classe real, portanto não se declara ausência de metadados a partir dele.

Sessão prolongada tablet: **PASS da sessão de 600.0 s, 37 trocas de página; não inclui reprodução prolongada.**

Sessão prolongada celular: **PASS da sessão de 600.0 s, 38 trocas de página.**

| Aparelho | Duração / trocas | CPU principal p50/p95(% todas CPUs) | PSS principal inicial→final / máximo(MiB) | HWUI janky/frames novos |
| --- | --- | --- | --- | --- |
| Tablet | 600,0s / 37 | 5,03 / 8,30 | 314,9 → 440,7 / 521,6 | 616/4052 |
| Celular | 600,0s / 38 | 5,11 / 9,27 | 333,2 → 410,1 / 424,8 | 643/5946 |

As métricas móveis acima abrangem somente o processo principal; não há CPU/PSS pareados de renderer nem FPS visual do display. HWUI é diferença de contadores sem reset; não corresponde a todos os refreshes. Rede, I/O e consultas diagnósticas integram as condições. O PSS móvel terminou maior que no início, com picos acima do valor final; isso exige repetição de ciclos equivalentes e fase de liberação antes de concluir sobre retenção/vazamento. Não há homologação de ausência de leak. Não comparar o CPU de um móvel com o Fire como se fossem capacidade/hardware equivalentes. Sem vídeo nessa sessão longa, ela não substitui o ensaio prolongado de VOD/Live/decoder.

Há catálogo montado no início/fim das amostras e sessão autorizada existente. Isso não prova preservação integral da identidade/fonte/dados através das instalações feitas pelo usuário: o gate começou depois delas, e o usuário também mudou o sinal. Não foi executado login novo, primeira instalação limpa, comparação de dados privados ou testes de todos os conteúdos/formatos. Reprodução prolongada≥10min, retorno de background móvel e recursos em ciclos equivalentes permanecem PENDENTES onde não demonstrados. Não declarar os aparelhos integralmente homologados a partir dessas amostras curtas.

## Rede, sinal e erros anteriores

O usuário informou mudança de internet nos aparelhos e depois atualização de sinal/fonte em todos. Uma observação posterior registrou Wi-Fi validado no Fire/tablet e celular validado no telefone, sem captive portal; não foram armazenados SSID/IP/URLs. O executor não alterou rede ou fonte. Os períodos são distintos, sem comparação pareada de cache/fonte/rede.

Tablet: HTTP_ERROR/Media3 code2004/HTTP403/DATASOURCE_OPEN em tentativa anterior. Telefone: MEDIA_PARSER_FAILURE/Media3 code3003/DATASOURCE_OPEN, sem HTTP, posição0 em tentativa anterior. Evidência sanitizada em NATIVE_ERROR_OBSERVATIONS.json. As tentativas posteriores de filme/episódio/Live tiveram sucesso. Isso não prova que toda falha anterior tinha uma única causa nem que a atualização de sinal foi isoladamente responsável.

**Limite de aparelhos/conexões simultâneas: INCONCLUSIVO.** O usuário levantou essa hipótese; o contador observado não forneceu números utilizáveis. HTTP403 não prova limite de conexões e parser3003 não é resposta de autorização do provedor. Não foram inventados limites1/1 ou2/2, encerradas sessões alheias, trocadas fontes ou feitas tentativas repetitivas para contornar restrições. Streams de teste móveis foram abertos sequencialmente e encerrados pelo fluxo normal.

## Piscadas e sessões prolongadas

Na navegação/repouso/background válidos, o PID principal do Fire permaneceu estável nas amostras. Não houve captura externa contínua sincronizada; logo, **piscadas subsegundo e FPS efetivo da TV continuam INCONCLUSIVOS/PENDENTES**. Ausência de morte do processo não exclui problemas de composição/superfície, e nenhuma consulta HDCP isolada demonstra renegociação. Não atribuir a cabo/TV, trailer ou memória sem correlação.

Concluídas três sessões Fire de pelo menos10min: navegação, repouso numa capa sem playing e background/retorno sem prévia ativa. Espera natural e playing foram exercitados no ciclo de trailer, interrompido por FAIL visual antes de10min. Recursos nativos residuais/áudio e memória de todos os subprocessos não receberam certificação de ausência de vazamento. Reprodução VOD/Live prolongada em cada aparelho, outra Android TV de fabricante diferente e controle físico assistido ainda requerem os casos não executados da matriz.

## Incidentes próprios e validade dos registros

1. O primeiro helper de navegação marcou NAV_FOCUS_NOT_RECOVERED após133,47s/190 comandos, exigindo cartão mesmo quando o foco válido estava no menu. Preservado em FIRE_navigation.json; INCONCLUSIVO por critério do helper, substituído apenas como rodada válida pela coleta controlada de601,8s, sem apagar o erro inicial.
2. Um modal Internet aberto pelo diagnóstico ficou ativo por fechamento do primeiro botão de um diálogo fechado, em vez do modal aberto. Interferiu na navegação por toque e foi reconhecido ao usuário. DIAGNOSTIC_MODAL_CLEANUP.json registra um modal próprio fechado normalmente e zero restantes nos três alvos. O tablet não responsivo relatado pelo usuário não deve ser automaticamente atribuído por inteiro a esse incidente; os sucessos posteriores são medidos separadamente.
3. Helpers tiveram alvos abaixo da dobra, seletores de sinopse/play/grade incorretos, precondição de Home ausente, falha de escape no contador de conexão e falha de seleção do alvo do relógio público. Tentativas identificadas por LIMITATION/ATTEMPT preservadas; não são FAIL automático do produto nem PASS fabricado. A leitura node -e de encerramento também falhou por quoting antes de executar; foi substituída por arquivo .mjs, sem efeito no app.
4. Na primeira repetição de grade, Detalhes não foi observado antes de Back. Essa tentativa é inconclusiva; a causa de estar em Configurações não foi determinada. Depois, outro helper parou antes de clicar por cartão focado fora da área visível. Na última passagem foi usado scrollIntoView normal antes de abrir Detalhes, a precondição passou, e o retorno esperado pelo Back nativo falhou. Os casos e classificações são separados; não apagar o FAIL posterior como se fosse o erro anterior de seletor.
5. O usuário usou o telefone e alterou rede/sinal durante o gate. A tela transitória de ativação nessa janela não demonstra perda espontânea de licença. A saída manual previamente confirmada pelo usuário em outro gate continua distinta de crash.
6. Logs foram coletados por campos técnicos delimitados, sanitizados antes de persistir. Um arquivo de resumo de log foi sobrescrito pelo próprio helper; os eventos de erro conhecidos foram preservados separadamente em NATIVE_ERROR_OBSERVATIONS.json, e coletas posteriores têm nome datado. Não alegar preservação do buffer bruto completo nem ausência exaustiva de erros de todos os processos.
7. Duas preparações do teste longo no telefone não encontraram o controle Home: o layout usa a marca clicável, e não os botões assumidos pelo helper. Pararam antes da sequência, sem prova de defeito do app. O seletor foi corrigido para o mesmo fluxo normal usado no smoke; tentativas originais e a coleta corrected2 permanecem separadas.

Os contadores rAF medem oportunidades de atualização; HWUI mede frames desenhados pelo app; nenhum mede por si só pixels/HDMI. Não somar eventos trace sobrepostos nem TaskDuration a porcentagens CPU. Na rodada curta houve leituras diagnósticas de retângulos, e nas longas polling do DOM; a instrumentação tem overhead. Tracing foi separado para identificar renderer, não misturado aos benchmarks principais. Nenhuma captura de imagem CDP, screencast, emulação, override DPR/viewport/escala, injeção de CSS ou alteração de lifetime/autoplay foi usada para melhorar números.

## Preservação e decisão

Root operacional preservado em C:/Xandeflix/xandeflix-prebuilt-c11-main, branch fix/source-output-format-recovery, HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8, main b3fc8d1e3844bc5601813ab1b298289af5b3f1fd, origin canônico. A divergência histórica da main/branch foi mantida conforme base fechada; a pasta histórica C:/Xandeflix/xandeflix-prebuilt permanece somente leitura. Root mantém as mesmas10 diferenças L1, index vazio. Nenhuma restauração, normalização ou publicação Git.

Foram congelados e revalidados manifests e artefatos externos dos ciclos03(1435 arquivos),04(1452) e05(1437). O novo stage documental recebe integralmente o05, com alterações somente em seis documentos autorizados; os quatro documentos normativos conservam todos os bytes recebidos como prefixo. Source/test/config/37 recibos são idênticos; CANON conserva924 protegidos. CANON final e evidência exata de preservação constam em VALIDATION_COMPLETE.json/PRESERVATION.json. Os196 controles/33 suítes e242 testes Android/38 suítes são resultados herdados dos gates anteriores, **não novas execuções de regressão neste diagnóstico**.

Listeners, observers e wrappers próprios possuem limpeza nos helpers; o wrapper transparente de nativePromise foi restaurado preservando argumentos/this/retorno, e handles de eventos removidos. A checagem final encontrou zero globais próprios e zero dialogs abertos nos três aparelhos; a lista ADB de forwards terminou vazia. Conexões CDP e forwards temporários próprios foram fechados; não se removeu forward desconhecido de outros trabalhos. Ver CLEANUP.json para o alcance da checagem. Não se promete liberação total de decoder/áudio apenas pela limpeza da instrumentação.

Sem build, instalação, desinstalação, clear/reset/reboot, alteração de produção/backend, fonte pelo executor, commit/push/merge/PR/deploy ou rollback. O ciclo04 fechado e os APKs conhecidos permanecem preservados. A rotação temporária autorizada e a navegação normal são as únicas alterações de experiência necessárias aos testes; não se alegam aparelhos intocados durante o diagnóstico.

**Decisão: homologação PARCIAL com FAIL do trailer e do retorno à grade no Fire. Não aprovar a entrega como integralmente homologada.** Prioridade de correção: (1) limites/recorte/posicionamento da WebView nativa do trailer e retorno por Back, com correlação de destino/identidade e observação externa; (2) custo visual e retenção vertical medidos, buscando o orçamento60 sem usar rAF de repouso como prova; (3) controle físico mantido e retorno561 em protocolo com precondições confirmadas; (4) repetição dos cenários prolongados móveis/playing/recursos e correlação externa das piscadas. São recomendações para escopo futuro, não implementação iniciada.

Evidências: INVENTORY/FINAL_DEVICE_IDENTITIES, MEASUREMENT_SUMMARY, horizontal-36-first, FIRE_navigation-controlled, FIRE_idle-post-network, FIRE_trailer-cycles-stable-new-signal, FIRE_background-no-preview, FIRE_FEATURES, FIRE_COMPUTED_UI, FIRE_GRID_RETURN_CORRECTED_HARNESS, FIRE_GRID_RETURN_CONFIRMED_DETAIL_VISIBLE, TRAILER_GEOMETRY_USER_FAILURE, TRAILER_INTERRUPTED_STATE, MOBILE_*_PLAYBACK_post-signal-clean-dialog, MOBILE_*_SERIES_LIVE, MOBILE_FULLSCREEN_RETURN, MOBILE_*_NAVIGATION_10MIN (telefone: corrected2 é a sessão válida; originais são tentativas de preparação), MOBILE_LONG_SUMMARY, NATIVE_ERROR_OBSERVATIONS, DIAGNOSTIC_MODAL_CLEANUP, NETWORK_POST_OPERATOR_CHANGE, SOURCE_CONNECTIONS_POST_UPDATE, OPERATOR_CLARIFICATIONS, CLEANUP, PRESERVATION, VALIDATION_COMPLETE e CLOSURE. JSON específicos mantêm valores integrais e horários UTC; horários de usuário neste relatório são America/Sao_Paulo.

**NEXT_GATE_STARTED=NAO.**
