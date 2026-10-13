# Relatório detalhado de otimizações — Xandeflix Prebuilt C11

Data: 06/10/2026. Projeto: **xandeflix-prebuilt-c11-main**.

Este documento reúne as solicitações desta sequência, as alterações entregues, os testes realizados e os limites observados. O código foi alterado no clone C11 ativo. O projeto protegido Xandeflix 2.0 permaneceu intacto.

## 1. Capas dos cards: fonte primeiro e complemento TMDB

O card conserva a capa da fonte. Se ela estiver ausente ou falhar, o componente procura o pôster correspondente no TMDB. Metadados opcionais complementam a apresentação local; não substituem a entidade do catálogo nem autorizam sua reprodução.

O fluxo normaliza referências, trata referências tardias, tenta novamente em falhas transitórias e evita repetir continuamente consultas sem resultado por meio de cache temporário. A associação considera tipo, título, ano, ID TMDB e dicas da capa quando disponíveis. Correspondências ambíguas recebem tratamento conservador para reduzir imagens de outra obra.

Não foi adicionada uma segunda API comercial. Os provedores visuais usados são a própria fonte e o TMDB. Obras sem correspondência ou imagem publicada podem continuar sem capa.

Arquivos principais: Artwork.tsx, artwork-uri.ts e tmdb-metadata.service.ts. Evidência: test-c11-source-first-tmdb-artwork.mjs, incluindo dados M3U sintéticos representativos e referências tardias de série.

## 2. Banners horizontais da Home, Filmes e Séries

O hero horizontal usa backdrop TMDB. A seleção confirma carregamento, decodificação e orientação da imagem antes de aceitar o candidato. Não amplia o pôster vertical da fonte para preencher o banner.

Um candidato sem backdrop válido é descartado do destaque, mas continua nos cards e na busca. Enquanto prepara uma opção, o hero mostra espera; se nenhum candidato do conjunto limitado for elegível, informa a ausência de destaque. Isso evita a combinação de título com banner vazio observada no exemplo de Duda.

A busca visual é limitada para não consultar milhares de obras no primeiro acesso. Arquivos: hero-artwork.service.ts, useHeroArtwork.ts, CategoryHero.tsx e HomeHero.tsx. Testes cobrem ausência de backdrop, erro de decode, cache, deduplicação e perfis vertical/horizontal independentes.

## 3. Hero misto restaurado na Home

A seleção anterior dependia de obras identificadas como sendo do ano vigente. Catálogos sem ano conhecido podiam fazer a Home retornar um destaque vazio.

O fallback agora usa candidatos reais já materializados, mistura filmes e séries e mantém a área de destaque enquanto o índice complementar trabalha. O índice melhora a seleção depois, sem bloquear a primeira tela ou inventar anos.

Testes cobrem índice pendente, rejeitado ou vazio, catálogo sem ano, fonte atualizada e fallback. A confirmação visual do item 2 continua obrigatória.

## 4. Hero vertical específico para celular

Na Home de celulares, o destaque usa pôster vertical TMDB. Prefere uma variante diferente do pôster dos cards quando o provedor a oferece. Se não houver alternativa válida, usa o pôster disponível; uma segunda capa não é fabricada.

Ano, sinopse, gêneros e duração TMDB têm prioridade quando disponíveis no destaque mobile. Tablet/TV e os heroes de Filmes/Séries mantêm o formato horizontal.

No browser com viewport 390×844, o hero mediu 358×537px e a imagem decodificada 780×1170px. Trata-se de evidência de fixture, não de homologação física de todos os aparelhos.

## 5. Cinco filmes e cinco séries: ano vigente ou mais recentes

A seleção procura cinco filmes e cinco séries do ano corrente disponíveis na fonte. Quando não há quantidade suficiente, completa com as obras mais recentes conhecidas. Conteúdo sem ano não é contado artificialmente como atual.

A ordem varia por janela/visita, sem duplicados. Extras de novos lançamentos podem ampliar a janela até vinte opções. A quantidade efetiva depende de haver obras com imagens compatíveis: catálogo ou API insuficientes produzem menos opções.

test-c11-home-hero.mjs cobre cotas, catálogos antigos, fallback, atualização e migração do cache de seleção.

## 6. Novos lançamentos e atualização das categorias

O hero identifica novas obras após sincronização e promoção do catálogo no aparelho. Sua identidade visual não depende da posição na playlist; reordenar a mesma lista não transforma sozinho uma obra conhecida em lançamento novo. Obras removidas não permanecem na geração seguinte.

Os cards acompanham o catálogo ativo. Categorias comuns recebem ordem aleatória; categorias de lançamentos preservam a ordem da fonte. Novos lançamentos elegíveis recebem prioridade no hero.

O gatilho é a atualização recebida e promovida localmente. Uma mudança remota ainda não sincronizada não pode aparecer no aparelho. Não foi introduzido serviço central de catálogo ou processamento de mídia.

## 7. Fade na troca do hero

O carrossel aplica transição de aproximadamente 400ms entre conteúdos. Controles, cursor e foco são preservados; há avanço manual e pausa da troca automática.

A preferência de movimento reduzido é respeitada. A troca não precisa reconstruir os controles a cada imagem. A transição foi verificada nos componentes reais em browser e na suíte de hero.

## 8. Hero maior no Fire Stick

O perfil de TV compacta passou a usar altura proporcional limitada entre 220 e 320px. Em viewport 960×540, o hero mediu 259,1875px, contra cerca de 165px no layout anterior.

Isso aumenta a presença do banner mantendo espaço para categorias e cards. A altura depende da resolução e do perfil detectado; a medida é de fixture com perfil Fire.

## 9. Troca rápida de categoria

A navegação publica primeiro um preview limitado da categoria. Contagens e complementos são calculados depois. Leituras repetidas usam cache de até 24 previews com até 48 itens cada; categorias vizinhas e intenção de foco preparam dados e imagens.

Operações são deduplicadas, têm concorrência limitada e são canceladas ao mudar categoria ou snapshot. O novo preview não depende de concluir uma contagem integral antes de aparecer.

Categoria já aquecida respondeu em cerca de 9–12ms no browser de teste. Esse dado não é SLA. Primeira visita, disco frio e imagem ainda não baixada continuam exigindo I/O e podem mostrar espera.

Arquivos: segmented-browse.service.ts, useSegmentedBrowse.ts, MoviesPage.tsx e SeriesPage.tsx. Evidência: test-c11-category-preview.mjs e fixture visual.

## 10. Busca de Matrix e suas variações

A correspondência exata deixou de encerrar a pesquisa prematuramente. Digitar Matrix considera também Matrix Reloaded, Matrix Revolutions e Matrix Resurrections, mantendo o título exato bem posicionado.

Foi corrigida uma poda insegura em consultas numéricas curtas. Filtros, empates e top 50 foram comparados com scoring exaustivo, mantendo o limite de resultados e evitando materializar o catálogo inteiro na interface.

test-c11-search-details-related.mjs --prove-baseline reproduziu o defeito na implementação anterior congelada e verificou a correção.

## 11. Metadados e fundo nos detalhes abertos pela busca

O detalhe resolve a entidade escolhida no catálogo atual, complementa metadados e mostra **fundo horizontal com pôster vertical ao lado**, conforme a escolha do usuário.

Ao mudar de conteúdo, o estado da página é reiniciado para não conservar informações da obra anterior. Filmes e séries usam o mesmo princípio de enriquecimento visual opcional.

Matrix exigiu cuidado adicional com homônimos. Dicas de filename e ano têm preferência. Sem essas dicas, o fallback de título exato dominante exige pelo menos 1000 votos e vinte vezes os votos de cada concorrente qualificado. Ano incompatível ou capa contraditória impedem associação insegura.

A consulta pública confirmou Matrix 603/1999. No browser, a pesquisa mostrou quatro variações; o detalhe exibiu ano, sinopse, pôster 342×513 e backdrop 1280×720. Metadados não autorizam streams.

## 12. Foco D-pad e caixa de busca

O contorno branco invasivo foi substituído por sombra, brilho rubi e preenchimento nos elementos focáveis. A busca aplica o efeito no wrapper arredondado, mantendo caret, edição e seleção de texto.

O foco permanece visível para teclado e controle remoto. Navegação e CSS calculado foram verificados no perfil TV; os callbacks dos botões foram preservados.

## 13. Títulos semelhantes abaixo dos detalhes

Filmes e séries oferecem uma faixa de obras do mesmo tipo, priorizando gênero e depois categoria. As opções vêm do catálogo da fonte, para que a recomendação corresponda a conteúdo disponível.

O item atual e duplicados são excluídos. A faixa tem até vinte títulos, leitura complementar segmentada e cancelamento por snapshot. Selecionar uma opção abre seu detalhe pelo fluxo existente.

O fixture Matrix mostrou três relacionados. Testes cobrem tipo, limites, deduplicação, exclusão do próprio título e cancelamento.

## 14. Acesso Início/Home

A página Live mobile ganhou acesso Início junto de Voltar. Detalhes de filme e série têm botão Início e acesso no header mobile.

A navegação usa os callbacks existentes. Sair do Live encerra o preview pelo ciclo de vida previsto, preservando identidade, licença e catálogo.

## 15. Episódios em lista e carregamento informado

Episódios são exibidos em lista semântica ul/li, sem thumbnails. Permanecem número, título, informações disponíveis e o botão Assistir. Temporadas são resolvidas sob demanda, com cache efêmero local.

A primeira leitura de um segmento não pode ser prometida como instantânea. Durante a espera, a interface mostra spinner e mensagem acessível, respeitando movimento reduzido. Dados já materializados podem aparecer imediatamente.

Não foi adicionado carregamento de toda a hierarquia de episódios no boot. Isso preserva o custo da primeira instalação e o resolver canônico de reprodução.

## 16. Google Cast em celulares e tablets

O ícone foi integrado aos detalhes de filmes/séries, à página Live e aos controles nativos do player/fullscreen. O usuário escolhe o receptor no diálogo Google Cast; Assistir ou selecionar episódio usa o conteúdo canônico. A opção Neste aparelho permite retorno local. O perfil Fire/TV não apresenta o sender mobile.

A exceção de transporte local foi documentada e autorizada. O celular/tablet acessa a fonte e disponibiliza mídia ao receiver escolhido na LAN por rotas efêmeras opacas. URL e headers da fonte ficam em RAM no sender. Não há gravação de vídeo, transcodificação ou proxy central.

O relay limita conexões, buffers, playlists e rotas. Usa a sessão C9 existente; heartbeat válido renova lease de 120s. Revogação, falha, encerramento ou morte do processo invalidam o transporte. SDK 22.3.1 e minSDK 23 foram confirmados na dependência e no APK.

HLS, MP4 e WebM são os caminhos iniciais suportados, sujeitos aos codecs do receiver. TS, MKV e DASH não são convertidos automaticamente. TVs Android/Google TV precisam ter receptor Google Cast; Samsung Tizen e LG webOS dependem do modelo e de suporte Cast ou receptor HDMI compatível. O sistema operacional sozinho não garante compatibilidade.

UI e autorização passaram com adapters simulados. O relay passou em fixture HTTP real para HLS, Range, HEAD e expiração. Descoberta, reprodução, seek e retorno em receptor físico ainda precisam de homologação. Referências: [sender Android](https://developers.google.com/cast/docs/android_sender/integrate) e [formatos de mídia](https://developers.google.com/cast/docs/media).

## 17. Picture-in-Picture em celulares e tablets

Filmes/episódios na Activity nativa e preview Live na MainActivity podem entrar em PiP ao abrir outro aplicativo, se o Android permitir e houver reprodução ativa. São exigidos API 26+, perfil não-TV e suporte do aparelho.

Android 12+ usa autoEnter; Android 8–11 usa onUserLeaveHint. O modo mantém o mesmo player e a mesma mídia. Controles ficam ocultos na janela pequena e voltam no retorno; pausa, fim, fechamento e revogação respeitam o ciclo de vida. Live promove o preview existente sem criar outra sessão.

Policy e lifecycle compilaram e foram testados. PiP durante stream autorizado no S24/tablet permanece sem homologação física neste ciclo. Referência: [Android PiP](https://developer.android.com/develop/ui/views/picture-in-picture).

## 18. Cache persistente de imagens no aparelho

Imagens exibidas ou preparadas pelo preload limitado são guardadas em cache/artwork-v1 do app. Os nomes opacos SHA-256 não contêm URLs; não há índice com credenciais. O arquivo local é convertido para URI do WebView e reutilizado ao revisitar o conteúdo.

Limites: **150MiB, 1000 imagens, 30 dias e 8MiB por imagem**. Há gravação atômica, validação de dimensões, timeout, limpeza de arquivos parciais e descarte por LRU. URL nova cria nova referência; o SO pode remover o cache.

Se o cache falhar, a interface tenta a imagem remota sem bloquear o catálogo. Na versão web permanece o cache HTTP do navegador. Não existe download prévio de todas as capas.

Testes Java comprovaram hit após recriar o serviço sem novo download, TTL, poda, tamanho e falha parcial. O comportamento durante uso físico ainda precisa de observação; cache de imagens não significa vídeo offline.

## 19. Recentes e retomada direta

Recentes fica logo abaixo do hero da Home e mostra até vinte filmes/séries assistidos disponíveis no catálogo atual, em ordem de última reprodução. Sem histórico, a faixa não aparece. Cada série aponta para seu episódio exato mais recente.

Player nativo e Cast enviam progresso a cada 5s e na pausa/saída/fim. O histórico local versionado mantém até 60 registros e 64KiB: tipo, IDs canônicos, episódio, posição, duração, timestamp, conclusão e fingerprint opaco da identidade da obra. Não persiste título, URI, header ou token.

Nonces transitórios rejeitam eventos desconhecidos/antigos. Conclusão não é sobrescrita por release posterior. IDs M3U/Xtream com dois-pontos são aceitos.

A auditoria final identificou que IDs sequenciais M3U podem ser reutilizados após nova importação. O fingerprint compara os metadados públicos canônicos da obra antes de mostrar ou retomar o registro. Outra obra no mesmo ID é recusada; registro legado sem fingerprint fica oculto. Mudanças nesses metadados também podem invalidar um registro. Não há remapeamento automático de IDs: o conteúdo omitido retorna ao histórico após nova reprodução.

Clicar na capa abre diretamente o PlaybackService na posição salva. Catálogo, vínculo do episódio e licença atuais são revalidados. Conteúdo removido ou episódio de outra série é recusado; concluído recomeça em 0. Storage negado conserva RAM sem impedir playback.

Testes do serviço real com adapters/guard injetados confirmaram filme em 123456ms, episódio exato em 65432ms, persistência, limites, negação e troca de obra no mesmo ID antes de guard/stream/player. Browser final confirmou clique direto e ocultação do ID reassociado, sem erros JS.

Morte abrupta antes do evento final pode perder a última amostra de 5s. Precisão superior não foi prometida; reprodução e retomada físicas permanecem por validar.

## 20. Fundo imersivo conforme capa/banner

A imagem principal fornece uma paleta por amostra canvas 24×24. Agrupamento pesa saturação e brilho e ignora transparência e extremos. Home/Filmes/Séries acompanham o hero; detalhes preferem backdrop e depois pôster. Cards e semelhantes não escolhem o tema.

São aplicados fundo escuro e brilho suave com transição de 700ms. Movimento reduzido é respeitado. As componentes calculadas da base e do brilho são limitadas a 36 e 84, mantendo contraste branco mínimo de 7:1 nesses tons. Até 48 paletas ficam em RAM, sem API, download extra ou persistência.

A leitura funciona quando o bitmap exibido permite canvas, especialmente o arquivo same-origin do cache Android. Imagem remota bloqueada pelo navegador mantém o fundo neutro. O experimento de CORS nos imgs causou regressão de carregamento e foi removido antes da entrega; as imagens seguem seu carregamento normal. Referência: [CORS e canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image).

Testes de cores dominantes, contraste, transparência, SecurityError e cache passaram. Browser com bytes públicos reais servidos localmente confirmou brilho rgb(84,71,40) e troca para rgb(28,28,28). Esse teste representa leitura de arquivo local; a integração física entre cache e cores ainda precisa de observação no aparelho.

## 21. Primeira instalação, licença e preservação de dados

O lock canônico passou em 22 cenários de identidade/ativação, 27 de promoção do catálogo e 9 controles negativos. C9 passou 10/10. Não houve relaxamento de identidade, ativação ou licença; Cast tem a exceção LAN explícita do item 16.

A atualização usa install -r, mesmo package com.xandeflix.prebuilt e mesmo certificado. O verificador compara hashes das árvores privadas e firstInstallTime em RAM antes/depois, registrando somente contagens e resultados. Nenhum conteúdo privado foi copiado para o relatório.

Não houve commit, push, PR, alteração de backend ou escrita no projeto Xandeflix 2.0. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Specs precederam os patches; mudanças locais são conferidas contra baseline de 575 arquivos e allowlist do ciclo.

## 22. Verificações, APK e instalações

TypeScript, build de produção e compilação Android: PASS. As suítes de hero, source-first, categorias, elegibilidade visual, busca/semelhantes, saída mobile, Recentes e paleta passaram. Java: **116 testes, zero falhas e erros**; a rodada final reutilizou resultados das tarefas sem mudanças Java.

Browser usou componentes reais em StrictMode, I/O sintético e imagens públicas reais nos perfis phone/tablet/TV. Medições e parâmetros descritos neste relatório são evidências de fixture, com os limites físicos explicitados.

O APK final contém bundle **index-DN1LCm9x.js** e CSS **index-Ct3CrXXg.css**. Cinco arquivos de dist foram comparados byte a byte com os assets empacotados. Configuração standalone com scheme HTTPS, duas Activities PiP, provider Cast e proteção de identidade de Recentes foram confirmados.

- Arquivo: Xandeflix-v1.0.0-standalone.apk.
- Package: com.xandeflix.prebuilt.
- versionCode: 1; versionName: 1.0.
- minSDK: 23; targetSDK: 35.
- Tamanho: 12.400.038 bytes.
- SHA-256: 78C074ECCA912D3E1FC493E66690F4AECD5736AEEC469080749DA0CB66B2277D.
- Certificado SHA-256: b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

O mesmo APK final foi instalado na ordem Fire Stick → tablet → S24, por atualização in-place. Os três arquivos instalados têm SHA-256 igual ao APK entregue.

| Dispositivo | Android API | Arquivos privados | Arquivos do catálogo | Estado nativo | Dados e firstInstallTime |
|---|---:|---:|---:|---:|---|
| Fire Stick AFTSSS | 28 | 466 | 436 | 5 | Preservados |
| Tablet SM-X610 | 36 | 533 | 505 | 5 | Preservados |
| S24 SM-S926B | 36 | 540 | 508 | 5 | Preservados |

Catálogo, estado nativo, preferências, WebView e demais arquivos privados permaneceram iguais em cada comparação final; zero diferenças em todos os grupos. O app não foi aberto automaticamente pelo executor. A auditoria não copiou hashes/nomes/conteúdo privados para o relatório.

A primeira comparação da instalação intermediária no Fire foi inconclusiva: o usuário confirmou ter aberto o app durante a auditoria. Esse resultado foi mantido no registro. Uma nova comparação com o app fechado passou, assim como a instalação final acima; não se usou o resultado inicial para alegar preservação.

[APK para atualizar outros aparelhos](../../Xandeflix-v1.0.0-standalone.apk). Evidência local ignorada: apk-final.json e firestick/tablet/s24-final-result.json em tmp/c11-home-hero-visible-20261006.


Evidências específicas: [hero/busca/navegação](C11_HOME_HERO_VISIBLE_FIX.md), [PiP/cache/Cast](C11_MOBILE_PIP_AND_ARTWORK_CACHE.md), [Recentes](C11_RECENT_WATCHED_RESUME.md) e [cores imersivas](C11_IMMERSIVE_ARTWORK_BACKGROUND.md).

## 23. Limites e validação física restante

Rede/API podem ficar indisponíveis; nem toda obra possui imagem correspondente. Primeira visita exige I/O. Novidades aparecem após sincronização local. IDs M3U reassociados não são remapeados automaticamente no histórico.

PiP, receptor Cast/codecs/seek, cache de imagens, cores e retomada devem ser observados durante reprodução autorizada real no aparelho. Build, adapters, testes e instalação não equivalem a essa homologação. Não foi estabelecido SLA de carregamento instantâneo ou compatibilidade universal de TV.


## 24. Atualização do relatório: layout phone e otimizações posteriores

Os itens24–38 registram a continuação solicitada após a entrega do item22.
O APK desta continuação substitui a entrega78C074EC para atualização dos aparelhos.
O histórico anterior foi preservado integralmente; não se reinterpretam testes
antigos como prova de novos patches. As novas especificações precederam código.

Preflight read-only confirmou clone independente
C:/Xandeflix/xandeflix-prebuilt-c11-main, .git próprio, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, main e
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture Contract,
Execution Contract, Source Data Boundary e lock de ativação foram lidos.
Baseline620 arquivos captura dirty anterior;633 registra handoff após layout phone.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO: correções locais explícitas, nenhum
Gate seguinte iniciado. Não houve commit, push, PR, backend, reset de identidade
ou escrita no projeto Xandeflix2.0 nem no workspace histórico protegido.

## 25. Página interna de série exclusiva dos celulares

A escolha Somente celulares foi aplicada por perfil phone, incluindo paisagem;
tablet, Fire e desktop conservam apresentação interna anterior. No celular,
a ordem é mini player16:9, nome, metadados, sinopse, Assistir/Voltar/Transmitir,
ações destacadas Avaliar/Favoritos/Compartilhar e abas de conteúdo.

Metadados apresentam ano, episódios disponíveis na fonte resolvida,
classificação BR e duração por episódio. Durante a leitura local, contagem
TMDB é rotulada; ausência de classificação não recebe um valor inventado.
Extras TMDB são opcionais, com cache RAM64/6h,2 chamadas ativas/32 pendentes,
deduplicação, timeout8s e cooldown de falha. Não entram no snapshot/boot.

Assistir mantém PlaybackService/C9 e usa primeiro episódio da temporada escolhida.
Episódios ficam em lista sem qualquer imagem. Abas montam um painel por vez:
semelhantes exibem até20 obras disponíveis na fonte em grade de duas colunas.
Não há carrossel nesse painel phone. Avaliação e favoritos persistem localmente
com fingerprint opaco, limites256 registros/64KiB; storage negado conserva RAM.
Compartilhar usa Capacitor Share e apenas título/link público TMDB.

Fixture StrictMode confirmou4 episódios locais,16+,42m, duas temporadas,
Assistir correto,20 semelhantes em2 colunas, persistência após reload e share
sem informação da fonte. S24 final abriu Game of Thrones no novo layout,
mini player no topo101px, scroll0 e zero imagens de episódios.
Tablet físico manteve layout anterior.
Detalhes: [layout phone](C11_PHONE_SERIES_DETAIL_LAYOUT.md).

## 26. Trailer público e estabilidade de posição

TMDB seleciona trailer público preferencialmente oficial pt/en. A reprodução
começa após toque; Android usa WebView pública separada, sem bridge privilegiada,
fonte/C9 ou gravação de vídeo. Fora da área visível, background e saída pausam
ou removem essa apresentação. Falha ou ausência recebe mensagem e alternativa
pública quando há trailer.

A execução intermediária Game of Thrones emitiu ready e mais de100 atualizações
de bounds em3,5s, com documento deslocado. JS deduplica geometria equivalente
até0,5px e Native evita setLayoutParams quando dimensões/margens inteiras são
iguais. A WebView não ganha foco automaticamente na abertura.

Fixture real:40 resizes sem mudança produziram0 bounds adicionais, mantendo hero;
scroll fora da tela publicou visible=false e sair fechou o player. Native compilou.
No APK final, uma tentativa física recebeu Public trailer unavailable e o hero
permaneceu em101px; verificou-se depois document.hidden=true com tela bloqueada.
A reprodução pública final e seus controles de toque continuam por homologar
com S24 desbloqueado. Não se alega que ready significa vídeo reproduzido.
Falhas de incorporação também dependem do provedor: [API YouTube](https://developers.google.com/youtube/iframe_api_reference#onError).
Evidência: [estabilidade do trailer](C11_TRAILER_LAYOUT_STABILITY.md).

## 27. Busca e abertura de detalhes no Fire Stick

O encerramento relatado ao clicar numa capa não foi reproduzido nas tentativas
observadas. Antes do patch, houve demora no primeiro detalhe, processo vivo e
ausência de AndroidRuntime do pacote. BACK no harness gerou saída normal;
isso não foi apresentado como crash. Registros históricos LMK/tombstone sem
vínculo comprovado ao clique não determinam a causa.

Foi corrigida pressão verificável: SearchResults resolvia todos os resultados
simultaneamente e resolver repetia varreduras para clique concorrente. Agora
hidratação é sequencial/cancelável; resolver compartilha mesma kind/id, coordena
uma leitura por vez e até32 pendentes. Erros oferecem retry no detalhe.
Fixture do código anterior mostrou12 leituras simultâneas; patch1 leitura,
11 varreduras distintas. Testes de quota, miss/retry e50 resultados passaram.

Fire final buscou protetor e retornou11 opções sem digitar letra adicional.
O Protetor abriu por DPAD_CENTER com hero405px, topo34, scroll0 e foco no hero.
Processo continuou vivo; buffer crash do pacote não registrou falha.
Esses resultados confirmam os caminhos exercitados, sem prometer eliminação
de todo encerramento possível em outras condições.
[Evidência de busca/detalhes](C11_FIRE_STICK_SEARCH_DETAIL_FIX.md).

## 28. Consulta digitada durante abertura do índice

Na versão intermediária33497EFF, SEARCH_READY limpou resultados de uma consulta
já digitada. SearchPage agora assina antes de initialize, guarda consulta/filtro
mais recentes e reaplica quando o índice fica pronto. A Promise de initialize
não sobrescreve status/resultados publicados. Engine, ranking e indexação
canônicos não foram alterados.

Fixture com inicialização atrasada1800ms: matrix digitado uma vez e filtro
Séries resultaram em4 cards, exatamente uma consulta final correta, zero erros.
Fire final exibiu os11 resultados de protetor. A busca conserva a semântica
atual de múltiplos termos; não se adicionou requisição de rede para pesquisar.
[Evidência da corrida corrigida](C11_SEARCH_READY_REPLAY.md).

## 29. Heroes maiores no Fire e mais largos no tablet

Home/Filmes/Séries e internos Fire usam75vh, mínimo350/máximo620px, incluindo
placeholder. AFTSSS960×540 confirmou hero externo856×405 nas três páginas,
com bitmaps horizontais1280×719/720 decodificados; interno O Protetor405px.
Fundo interno depende de correspondência TMDB segura. Homônimos sem ano/ID
não recebem imagens arbitrárias; A Protetora exibiu backdrop1280×720 na rodada
intermediária, enquanto O Protetor sem match permaneceu com pôster da fonte.

Tablet reduz gutters das três páginas para8px e usa largura disponível,
preservando altura/perfil horizontal. SM-X610: antes1221,33×480, gutter32;
agora1269,33×480, gutter8, ganho48px. Phone e Fire não recebem essa largura.
Browser verificou perfis e orientações sem overflow.
[Hero Fire/cache](C11_FIRE_HERO_AND_WARM_IMAGE_LATENCY.md),
[largura tablet](C11_TABLET_HERO_WIDTH.md).

## 30. Hero vertical também em Filmes e Séries no celular

CategoryHero pede perfil TMDB vertical em celulares e passa o pôster selecionado
ao Hero; usa proporção2:3 e placeholder estável como Home. Não converte backdrop
horizontal em capa vertical. Tablet/Fire continuam horizontais; detalhe de filme
continua fundo horizontal+pôster e detalhe de série phone mantém mini player.

Browser390×844 confirmou358×537; S24 final confirmou379,43×569,14 em Home,
Filmes e Séries com bitmaps verticais780×1170/1151 e nenhum overflow.
[Evidência do hero vertical](C11_PHONE_CATEGORY_VERTICAL_HERO.md).

## 31. Preparação de capas ao abrir páginas e busca

Grade48 e busca até50 iniciam preparação das capas selecionadas pela regra de
exibição, inclusive fora da viewport. Trilhas próximas preparam até20; outras
categorias da Home não são todas baixadas simultaneamente. Fonte continua
primeiro, TMDB somente no fallback existente e hero com imagem confirmada.
Espaço reservado e indicador discreto evitam salto visual.

Fila compartilhada tem2 ativos,128 pendentes e96 sucessos recentes em RAM,
cancelamento dos ainda enfileirados sem consumidor, deduplicação e timeout8s.
Preload de categoria cobre até48 pôsteres; o primeiro hero reserva um dos2 slots
por até8s, liberando na conclusão/falha/saída. Foco promove a capa correspondente.
Busca sem hero usa ambos os slots. Nenhum download de vídeo ou catálogo inteiro.

Fixture carregou48 antes de rolar, duas falhas/ausências usaram TMDB, altura ficou
estável e reabertura não criou novos preloads. Suítes verificaram prioridade,
quota, cancelamento compartilhado, retry e cache; trilha distante não foi baixada.
Primeira visita/conexão fraca ainda depende de rede; ações locais não esperam
download de todas as imagens.
[Preparação visual](C11_PAGE_ARTWORK_PREPARATION.md).

## 32. Cache visual sem trava de rede sobre hits

ArtworkDiskCache anteriormente mantinha trava durante fetch. Rede e validação
agora ocorrem fora da trava de índice/promoção; FutureTask deduplica por chave
e hit pode ser resolvido antes da fila do executor. Poda não toca arquivos .part
em downloads paralelos e protege o recém-promovido. Imagem maior que orçamento
do cache é recusada. Limites150MiB/1000/30dias/8MiB por imagem foram preservados.

RAM de caminhos locais128/TTL5min permite imagem já preparada entrar diretamente
no render, com invalidação de arquivo quebrado. Falha não envenena cache.
Fetch limita connect/read pelo orçamento restante7s, alinhado ao timeoutJS8s;
não foi certificado um teto absoluto para DNS/agendamento do SO.

Java inclui hit durante miss bloqueado, downloads distintos concorrentes,
mesma chave deduplicada e prune/promoção. A primeira rodada revelou que uma poda
podia remover arquivo recém-promovido com timestamp mais antigo; foi corrigido
antes da entrega. Resultado final122 testes/0falhas/0erros. Suítes JS passaram.
[Cache e prioridade](C11_FIRE_HERO_AND_WARM_IMAGE_LATENCY.md).

## 33. D-pad e centralização vertical do menu lateral

Trilhas usam irmãos diretos em passo horizontal; grade conserva cache fraco
de controles/colunas, invalidado por DOM e viewport. Foco síncrono preventScroll
é seguido por rolagem agrupada no frame. Passo horizontal de trilha só move
scrollLeft quando necessário. Limite55ms aplica somente a auto-repeat;
pressões discretas, Enter único, edição de texto e eventos tratados permanecem.

Browser:12 teclas discretas levaram ao índice12 com1 consulta de grade,
1 leitura de estilo e1 rolagem. Resize/disabled, input, Enter e cleanup passaram.
Fire final:10 teclas físicas direita→índice10; baixo em7 colunas→17; sidebar
e retorno corretos. Métricas não são promessa de FPS/latência em todo aparelho.

Sidebar usa áreas simétricas acima/abaixo de nav, logo no topo e acessórios
ao fim. Os6 botões de produção ficam centralizados; altura insuficiente mantém
rolagem. Fire final: navCenter270/centro270. Tablet:426,667/426,5, diferença
de arredondamento abaixo de1px. Browser também confirmou270 e400 nos perfis.
O fixture Vite possuía8 itens de debug e foi ajustado somente no teste para
representar os6 da produção; não se disfarçou overflow de8 itens na tela540.
[D-pad](C11_DPAD_NAVIGATION_FLUIDITY.md),
[menu centralizado](C11_SIDE_MENU_VERTICAL_CENTER.md).

## 34. Próxima dobra automática e espaçamento compacto

Filmes/Séries substituem Carregar Mais por sentinel observado240px antes da tela
e fallback scroll+rAF. Carregando… aparece durante uma leitura e some quando
o lote é anexado. Erro suspende tentativas automáticas e oferece retry. Reset
de categoria/snapshot reinicia48; ordem/foco dos cards anteriores são preservados.

Fixture48→96→120 com1 leitura máxima, prefixo estável, reset48 e retry passaram.
Fire final48→96 conservou todos os48 rótulos e foco do último card, sem botão
e sem overflow. Aleatoriedade por blocos e regra de lançamentos continuam.
Capas de trilha têm6px de gap; grade8px horizontal/12px vertical; margem
de categoria12px. A compactação foi comparada à referência do usuário,
sem alegar reprodução exata de medidas proprietárias da Netflix.
[Paginação automática](C11_AUTOMATIC_CATEGORY_FOLD.md),
[espaçamentos](C11_COMPACT_COVER_SPACING.md).

## 35. Rodapé, foco inicial e ícone Transmitir

O rodapé foi removido do AppShell para todos os dispositivos; bundle final
sem app-footer e DOM físico confirmam. useDetailInitialFocus abre obra no topo
e foco do hero quando detalhes ficam prontos, sem recuperar foco após navegação
do usuário. Doze fixtures movie/series×perfil×imediato/assíncrono passaram;
Fire final interno topo34/scroll0/foco hero, S24 topo101/scroll0.

Transmitir nativo acompanha a visibilidade dos controles Media3 e fica oculto
em PiP. Em reprodução real de episódio no S24 intermediário, screenshots
mostraram controles+Cast juntos e nenhuma sobreposição após ocultá-los.
Código correspondente está inalterado no APK final. Isso não certifica receiver.
[Rodapé](C11_GLOBAL_FOOTER_REMOVAL.md),
[foco inicial](C11_DETAIL_INITIAL_FOCUS.md),
[visibilidade Cast](C11_PLAYER_CAST_CONTROL_VISIBILITY.md).

## 36. Validação final e APK desta continuação

Typecheck, build produção e Gradle testDebugUnitTest/assembleDebug passaram.
Lock:22 cenários identidade/ativação,27 promoção e9 negativos; C9:10/10.
Regressões de source-first, hero, elegibilidade, preview categoria, busca/detalhes/
semelhantes e saídas mobile passaram. Java:122/0falhas/0erros.
Browsers usaram componentes reais, I/O sintético e imagens públicas; medições
de fixture não foram convertidas em SLA nem em prova de streaming físico.

Seis arquivos dist conferidos byte a byte no APK. Standalone HTTPS sem server.url,
Share/trailer classes, provider Cast, duas Activities PiP e fingerprint de Recentes
confirmados. Assinatura é a mesma da versão instalada.

- APK: [Xandeflix-v1.0.0-standalone.apk](../../Xandeflix-v1.0.0-standalone.apk).
- Package: com.xandeflix.prebuilt; versionCode1/versionName1.0; min23/target35.
- Tamanho: 12400179 bytes.
- Bundle: index-4wr-SwHH.js; CSS:index-DGbASLLI.css.
- SHA-256: BA37C4F05E1E7E063D8BB7FD49F4DF7DAE94AC5014A8CEFA19BD8C7C23F15E4A.
- Certificado SHA-256: b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

## 37. Instalação atualizada nos três aparelhos

O mesmo APK acima foi instalado por install-r em Fire Stick, tablet e S24.
Comparação em RAM das árvores privadas e firstInstallTime passou com0 diferenças
em catálogo/estado nativo/preferences/WebView/other; APK instalado tem o mesmo
SHA-256 em cada aparelho. Sem limpar dados, mudar package ou recriar identidade.

| Aparelho | Arquivos privados na comparação | Catálogo | Estado nativo | Dados/firstInstallTime |
|---|---:|---:|---:|---|
| AFTSSS | 466 | 436 | 5 | Preservados |
| SM-X610 | 539 | 505 | 5 | Preservados |
| SM-S926B | 549 | 508 | 5 | Preservados |

O app ficou fechado durante comparação de atualização e depois foi aberto
explicitamente para QA; uso normal posterior pode atualizar cache/histórico.
Hashes/nomes/conteúdo privado não foram persistidos no relatório. Resultados
seguros: apk-final.json e *-final-result.json em tmp/c11-phone-series-20261006.
Builds intermediários FCBA4352 e33497EFF e suas evidências foram preservados.

## 38. Limites e proveniência da entrega

Sem blocker de build/instalação/menu/hero por perfil/paginação nos caminhos
exercitados. Crash original do Fire não foi reproduzido; redução da pressão
e sucesso das seleções testadas não certificam todo possível encerramento.
Imagens ausentes/homônimos e rede indisponível não recebem arte inventada.

Trailer físico final permanece por homologar com S24 desbloqueado; o bloqueio
de tela pausou CDP/visibilidade na conferência. Receptor Cast, PiP físico,
retomada exata após fechar e cores derivadas do cache físico continuam com
os limites anteriores do item23. Playback real/Cast-controls observados não
equivalem a testar esses fluxos completos. Não há SLA de carregamento instantâneo.

Allowlist por especificação foi conferida contra baseline620. As quatro memórias
e os23 itens históricos deste relatório receberam somente acréscimos. Auditoria
final registra arquivos modificados, ausência de mudanças fora da allowlist,
ausência de remoções e preservação byte a byte dos cinco prefixos congelados.
Nenhuma ação Git/remota ou próxima etapa de Gate foi iniciada.


## 39. Complemento após desbloqueio do S24

O usuário confirmou S24 desbloqueado e aberto. Com o mesmo APK final,
a consulta game of thrones digitada antes da liberação do WebView produziu
resultados sem nova digitação; seleção abriu o novo detalhe phone.
Frame público411,43×231,43 ficou abaixo do header em100px, document.hidden=false.

Toque no trailer resolveu PublicTrailer.open com visible=true e recebeu ready.
Durante3,5s, houve0 pedidos bounds e o hero permaneceu em100px; o loop de
posições da versão intermediária não apareceu nesta execução. O harness
encerrou o preview pela navegação normal para Séries. Wrappers de diagnóstico
acumulados duplicavam registros de open/ready; não se contou isso como duas
reproduções nem como requests bounds.

A pendência de desbloqueio dos itens26/38 foi resolvida. A estabilidade do
layout nativo está observada; reprodução efetiva completa e controles de toque
do vídeo público permanecem sem certificação: ready não prova estado playing
e o target público não foi exposto na sessão CDP usada. Não houve novo patch,
build ou instalação; SHA-256 final permanece BA37C4F05E1E7E063D8BB7FD49F4DF7DAE94AC5014A8CEFA19BD8C7C23F15E4A.
Evidência segura: s24-trailer-unlocked-layout-final.json, no diretório ignorado.


## 40. Cabeçalho de Canais ao Vivo no mobile — 2026-10-07

O cabeçalho mobile foi unificado: título Canais ao Vivo, total canônico e
Início/Voltar/Transmitir ficam dentro da barra principal. A segunda barra que
aumentava a altura foi removida nesse perfil; o nome da página substitui
a marca redundante nesta tela. Tablet/Fire amplos conservam layout anterior.

Voltar e Transmitir mostram somente ícones SVG, como Home, com44×44 de toque
e rótulos acessíveis. A opção Neste aparelho, quando já conectado, continua
funcional por ícone de celular. Erro Cast não aumenta a barra. Portal React
reutiliza callbacks; não alterou preview/autorização/C9/Cast SDK ou catálogo.

Browser com componentes reais320/390/411: altura64px, igual Home/Filmes/Séries,
sem overflow/duplicação, estados connected/error/loading/empty e resize passaram.
Voltar preserva passagem pelos grupos; Home, picker e retorno local passaram
com adapters. Não há stream/receiver real na fixture.

No S24, quatro cabeçalhos renderizados100,000px iguais,3 ícones44px sem texto,
nenhuma barra duplicada e sem overflow. Tablet/Fire mantiveram apresentação
ampla. Dados privados foram comparados antes de abrir os apps para QA.

Typecheck/build/lock22+27+9/Capacitor/Gradle/assinatura/assets6: PASS. Java122
sem falhas/erros, tarefas reutilizadas com nativo inalterado. APK atual substitui
a entrega BA37C4F0 dos itens36–39; arquivos históricos/evidências preservados.

- [APK atualizado](../../Xandeflix-v1.0.0-standalone.apk), 12400179bytes.
- SHA-256:D4B7C8695FED0C98B068775D21CE696DE57ECBC68168E66F7A20252F6F2F2505.
- Bundle:index-CmKqgE4P.js; CSS:index-DdhvUjrL.css.
- Mesmo package/certificado/versionCode1/versionName1.0/min23/target35.

| Aparelho | Arquivos privados | Catálogo | Dados/firstInstallTime |
|---|---:|---:|---|
| AFTSSS | 469 | 436 | Preservados |
| SM-X610 | 538 | 505 | Preservados |
| SM-S926B | 549 | 508 | Preservados |

Mesmo hash instalado nos três. Sem backend/Git/reset ou rotação de identidade.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Prefixos de memórias/relatório
preservados byte a byte. [Evidência detalhada](C11_MOBILE_LIVE_COMPACT_HEADER.md).
As homologações externas pendentes anteriormente não são certificadas por
esta correção de apresentação.


## 41. Guia de Programação EPG retrátil no celular — 2026-10-07

Guia agora fica acima da navegação inferior; ao tocar, sobe e cobre categorias/
canais até a base do preview. Segundo toque/Back recolhe e devolve listas e
scroll. Vídeo continua na mesma sessão. Agora/A seguir, horários locais,
descrições e progresso vêm da API da fonte autorizada; loading/erro/retry e
grade ausente têm apresentação própria. Movimento reduzido respeitado.

Consulta somente ao abrir, refresh60s, limite12/256KiB/prazo8s, abort no
fechamento e troca. Nada novo no boot. Fonte ACTIVE/versão/conta validadas
pelo fluxo canônico, dispositivo→fonte, sem backend de mídia ou persistência
de EPG/credenciais. M3U get.php com CDN/ID numérico sem extensão foi reconhecida
com conta coincidente e API mantida na origem provisionada. Sem API compatível,
há mensagem honesta; a fonte precisa fornecer a grade.

Browser real/adapters320/390/411/599,12 cenários de serviço e loading/erro/
retry/Back/scroll/resize/movimento reduzido: PASS. S24 real: ready,
12 programas/1 atual. Não valida todos
os canais. [Evidência e limites](C11_MOBILE_LIVE_EPG_DRAWER.md).

## 42. Retorno de tela cheia Live, Cast e espaço do EPG — 2026-10-07

Cast nativo aparece junto aos controles e some quando ocultados. Toque
reabre ambos. Entrada/saída configuram clickable/controller, inline/PiP
ocultam Cast. Player e sessão são mantidos. Bounds são realinhados após
rotação/retorno com frames/retries limitados, sem gesto corretivo. EPG usa
top do preview+bottom0 e novas medições ao abrir, evitando lacuna por escala/
orientação. Correção sucede a regressão mostrada no APK intermediário.

Dois ciclos no S24: timeout/toque/Back e guia, geometria nativa versus DOM/
density sem toque corretivo; inspeção visual dos controles e Cast: PASS.
Browser portrait/landscape/escala: PASS. Tablet em paisagem/Fire amplos preservados.
Typecheck/build/lock22+27+9/Capacitor/Gradle, Java124/0falhas/0erros,
assinatura e assets6 byte a byte: PASS. Sem promessa de carregamento/SLA
e sem homologação adicional de receiver Cast/PiP/instalação limpa física.

- [APK atualizado](../../Xandeflix-v1.0.0-standalone.apk), 12400179bytes.
- SHA-256:E19DC5339D89EDDC2AB70E9B5D2FD62CEAFC9C6B300257C2C4EA19F0D107F459.
- Bundle:dist/assets/index-L0bb-QGf.js; CSS:index-BzG9xa8_.css.
- Mesmo package/certificado/versionCode1/versionName1.0/min23/target35.

| Alvo | Arquivos privados | Catálogo | Dados e firstInstallTime |
|---|---:|---:|---|
| AFTSSS | 467 | 436 | Preservados; APK idêntico |
| SM-X610 | 538 | 505 | Preservados; APK idêntico |
| SM-S926B | 548 | 508 | Preservados; APK idêntico |

Mesmo APK instalado nos três, update-r preservou dados/firstInstallTime.
Entrega atual substitui D4B7C869 e os APKs intermediários deste ciclo.
Prefixos de memórias e relatório preservados; baseline669/allowlist auditados.
Sem commit/push/PR/backend/reset; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
[Evidência detalhada](C11_LIVE_FULLSCREEN_RETURN_AND_CAST.md).


## 43. Tablet em retrato: canais empilhados e menu superior — 2026-10-07

No tablet vertical, Live segue a organização do celular: player16:9 no topo,
faixa do canal, abas de categorias/canais, lista e EPG retrátil. O menu global
permanece acima, com marca e seis links. Canais exibe somente texto; Ativação
mantém a chave. Mesma configuração nas outras abas em retrato. Botões de
Home/Voltar/Cast44px ficam abaixo do menu, sem overlap inclusive com TV conectada.
Telefone, tablet em paisagem e Fire conservam suas apresentações anteriores.

Browser600/800/960px, seis abas e rotação ida/volta: PASS. SM-X610 físico,
seis abas, vídeo real, preview16:9, EPG alinhado e restauração das listas: PASS.
Configuração de rotação anterior restaurada após QA e paisagem revalidada.
Sem novo fetch de catálogo, custo de primeira instalação ou player adicional.
Mesmo APK e dados preservados conforme tabela no item42. Não certifica todos
os modelos/foldables ou receptores. [Evidência](C11_TABLET_PORTRAIT_LIVE_AND_MENU.md).


## 44. Ativação simples, diagnóstico recolhido e WhatsApp master — 2026-10-07

Tela inicial agora mostra código/status legível, chave permanente/copiar e a
pergunta sobre uma licença em vários dispositivos. Autorizado permanece
subordinado à autoridade efetiva. Campos técnicos e recovery ficam recolhidos
em Informações para suporte. Clique/Enter/D-pad abre e fecha; Copiar diagnóstico
usa allowlist sem chave, tokens, credenciais, URL ou mensagens livres. Clipboard
real e foco conferidos nos três aparelhos, inclusive D-pad no Fire.

Gestor > Sistema recebeu WhatsApp para múltiplos dispositivos. Backend ativo
em cujbmyhitgomlgwfkaat: somente OWNER ACTIVE (master) pode configurar;
ADMIN, comum, sem sessão e anon bloqueados. Contato global separado do suporte
legado, internacional com DDI, vazio remove. API pública retorna só contato
publicado; RLS/grants de tabelas/privado existente preservados. Sem WhatsApp
cadastrado nesta entrega; master deve informá-lo. Web gestor não publicada,
se usar bundle antigo precisa receber o build por seu processo de publicação.

Lock22+27/9 negativos, UI20, serviço9, SQL12 rollback, browser4 resoluções,
formulário master/admin/logout/erro, typecheck/build e Java124: PASS. AST51
declarações existentes preservadas. Regra antiga TV30px corrigida somente nos
novos controles. APK final instalado nos três com identidade, catálogo, dados
e firstInstallTime preservados; nenhum reset ou novo processo de ativação.

APK final: SHA-256 08FCDFFB9DEBEAFB445B9520E4E52903F09923BAD9A5C05B519ED6BFEAB517F0; 12400179 bytes. Bundle dist/assets/index-DTghpENe.js; CSS index-BWDAqMH6.css. com.xandeflix.prebuilt, certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d, versionCode1/versionName1.0/min23/target35, standalone HTTPS sem server.url. Assets6 verificados byte a byte; Java124/124 sem falhas.

| Alvo | Arquivos privados antes/depois | Catálogo | Estado nativo | Update-r / firstInstallTime / APK |
|---|---:|---:|---:|---|
| AFTSSS | 468/468 | 436 | 5 | Preservado / preservado / idêntico |
| SM-X610 | 538/538 | 505 | 5 | Preservado / preservado / idêntico |
| SM-S926B | 549/549 | 508 | 5 | Preservado / preservado / idêntico |

[APK final](../../Xandeflix-v1.0.0-standalone.apk).
[Evidência detalhada](C11_ACTIVATION_SIMPLE_UI_AND_MULTI_DEVICE_CONTACT.md).
Substitui os APKs anteriores para distribuição. Sem commit/push/PR/publicação
de site; somente a migração aditiva de contato aplicada ao backend autorizado.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 45. Barras do Android disponíveis e player preenchendo a área útil — 2026-10-07

Status/navegação permanecem visíveis em celulares/tablets, inclusive no player
de filmes/episódios e Live ampliado. No SM-X610, taskbar preservada em retrato
e paisagem. TV conserva modo imersivo. Insets de barras/cutout/teclado são
aplicados uma vez; trailer público desconta padding do parent e fica alinhado.

Usuário confirmou **imagem completa, aceitando faixas pretas**: PlayerView
MATCH_PARENT/FIT ocupa toda área útil entre barras, sem corte/distorção.
Bounds físicos S24[126,105][2952,1440]; tablet[0,56][2560,1510]. Home/Busca/Live/
retorno/EPG/detalhes/player e trailer phone conferidos; rotação tablet restaurada.

Lock22+27+9/build/sync/Java128/assinatura/package/6assets PASS. Script histórico
de orientação possui assert obsoleto de ordem dos atributos, também falha no
baseline; não modificado nem declarado PASS. Sem alteração de web, manifest,
licença/C9, fonte, identidade/chave, catálogo, Cast/PiP ou engine.

APK atual: [download](../../Xandeflix-v1.0.0-standalone.apk), SHA256
**7EBC87D91CABC00032CE57CF5AD3DA815E3889B146BE041DF4462DBAE8D6196E**, 12400179 bytes. Install-r no Fire Stick/tablet/S24,
mesmo package/certificado, dados privados e firstInstallTime preservados
(469/539/548 arquivos; catálogo436/505/508;5nativos por alvo).

Taskbar segue configuração do Android/launcher; app deixa de ocultar, sem
forçar preferências de terceiros. QA não certifica todos os streams/PiP/Cast.
[Evidência completa](C11_MOBILE_PERSISTENT_SYSTEM_BARS.md). CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; sem backend/Git/reset.


## 46. Regra final: ocultar barras somente no vídeo em tela cheia — 2026-10-07

Pedido posterior sucede o item45 SOMENTE para o fullscreen: status/nav/taskbar
visíveis nas páginas e inline, ocultas no vídeo ampliado e restauradas ao sair.
Marca fraca por decor preserva o estado em foco/resume; Live true/false e player
nativo true usam a política central. Padding zero fullscreen, insets normais
na navegação. Player usa a tela inteira e conserva imagem completa/FIT, sem
crop/zoom/stretch. Faixas por diferença de proporção permanecem, conforme
escolha do usuário. Trailer conserva origem correta; TV permanece imersiva.

S24/tablet físico: Live fullscreen sem barras, retorno com barras/EPG alinhado;
filme NativePlayerActivity fullscreen[0,0][3120,1440] e[0,0][2560,1600],
respectivamente. Taskbar tablet ausente fullscreen e presente no retorno;
rotação free restaurada. Fire Home960x540 e flags0x170e preservados.

Lock22+27+9/Gradle/Java130/assinatura/standalone/6assets PASS. Web/manifest/
source/licença/storage/identidade/C9/engine/proporção não alterados.
APK **9FA211109DF2AE9E4422D29FDBBF4A298DD5617D14860CFD44552B6DAC788135**, 12400179bytes;
[download atual](../../Xandeflix-v1.0.0-standalone.apk). Mesmo package/certificado.
Install-r Fire/tablet/S24 preservou todos os hashes privados e firstInstallTime
(467/537/551; catálogo436/505/508;5nativos). Este APK substitui o intermediário
7EBC87D9…; [evidência e regra final](C11_MOBILE_PERSISTENT_SYSTEM_BARS.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.


## 47. Detalhes de filmes no celular no padrão das séries — 2026-10-07

Trailer horizontal em toda a largura no topo; abaixo título, ano, classificação
BR quando disponível, duração total, gêneros/categoria e sinopse. Assistir largo,
Voltar/Transmitir, Avaliar/Favoritos/Compartilhar e semelhantes em grade de duas
colunas (até20 da seleção existente). Perfil exclusivamente celular; tablet/Fire
mantêm apresentação anterior. Matching/fallback público, sem bloquear playback
local nem inventar trailer/classificação. Link de share movie/{id}, preferências
separadas por fingerprint do tipo; defaults de séries preservados.

S24: trailer real de A Furia do Protetor reproduziu; Joderism sem trailer tem
imagem/mensagem e ações disponíveis. The Rookie conservou layout/abas de série.
Favoritos/diálogo/grade/foco conferidos. Player real fullscreen3120x1440 sem
barras, retorno com barras e hero no topo. Tablet/Fire antigos sem overflow.
Novo teste + série + Fire/search + lock22/27/9 + build/sync/Java130 PASS.

APK **67832339D3EF71A3F57D02F1F6ACC170BFF174E6393ED4CA2C85667BFBD7CE19**, 12400179bytes;
[download atual](../../Xandeflix-v1.0.0-standalone.apk). Install-r nos três,
mesmo package/certificado, todos os hashes privados e firstInstallTime
preservados (Fire467/tablet540/S24550; catálogo436/505/508;5nativos).
Substitui9FA21110…; [relatório detalhado](C11_PHONE_MOVIE_DETAIL_LAYOUT.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.


## 48. Filmes e Séries com linhas horizontais e Ver todos — 2026-10-07

Uma faixa por categoria da fonte, prévia20, Ver todos à direita, coleção exata em
grade vertical com paginação48 automática. Prefetch/cache/fila2 e cancelamento;
ordem Lançamentos preservada. D-pad e histórico detalhe→categoria→overview.
Conferência física nos três e testes/lock/Java130 PASS para navegação.
APK intermediário DF381D54C634B7E4B802E236BC58069DA1D867877014E0AEDF5A1FE66761C90B, instalado-r preservando dados nos três.
**Regressão de capas reportada e reproduzida: prontidão visual pendente.**
Este ciclo não certifica imagens de todas as linhas nem resolve a falha de capas.
[Evidência e limites](C11_FILM_SERIES_CATEGORY_RAILS.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.

## 49. Capas, Home, classificação e aviso — 2026-10-08

Mantida plataforma React/TypeScript/WebView e TMDB. Relatório enumera27
intervenções do ciclo: coordenador único, resoluções TMDBw342/w780/w1280,
observadores compartilhados, prioridade viewport/FIFO, pipeline2/2/2/128/96,
cache nativo150MB/1000/30dias/8MB, fallback sem download repetido, aliases
oficiais exatos e prévias locais20/64/1MiB/dois registros. Placeholder estático
Fire e confirmação bitmap local1px conservam limites; demais perfis/decode
preservados. Preparação inicial Fire32+8/hero/20s/Entrar agora não baixa todo
catálogo nem bloqueia ativação/importação. Metadados locais confirmados pelo
usuário não são mapa universal no APK; Anos1988 persistiu só no107 na última QA.

Home Ver todos também em Recentes/Destaques, coleções verticais próprias;
D-pad/focusin alinha hero inteiro Home/Filmes/Séries no Fire e Voltar da coleção
fica à direita. Contexto24H estrito corrige Chaves de série para canal via
classificação4/importação existente. Lançamentos usa cauda inversa da lista
M3U em20/48 e agora primeira categoria após Séries em Destaque. Sem timestamp
na fonte, não inventa data de inclusão com ano TMDB; filtros futuros adiados.
Aviso sanitizado passa a fixed compacto no canto, fecha10s/cleanup sem deslocar
hero. IDs M3U renumerados em Recentes recebem associação efêmera por fingerprint
exato único, posição e episódio canônico validados; histórico original intacto.

APK gerado atual **AE2A960BD529477B54DDCF3B73A75D381EE11EC2EB303A2FC288AA3C67FEC4D5**,12400179bytes,
JSindex-CYCLvbSn.js; [download](../../Xandeflix-v1.0.0-standalone.apk).
Lock22+27+9/build/sync/Gradle/Java134/assets6/assinatura e testes dirigidos PASS.
55paths allowlisted/baseline699/protegidos223/HEAD igual;
reader cancel+source-desc determinístico, App só apresentação Home, playback
intacto nesta expansão. [Detalhes e evidência completa](C11_ARTWORK_VISIBLE_LOAD_RECOVERY.md).

Samsung recebeu APK atual preservado: tablet750/715/5 em17:24:08UTC e
S24766/718/5 em17:24:28UTC. Fire tinham D8B47 verificado;103 install-r atual
retornou Success, porém sem auditoria posterior completa;107 conclusão não
confirmada. **Usuário cancelou instalações/testes Fire por uso em outro app;
processos correspondentes interrompidos, sem novas operações.** UI física
final Samsung ficou inconclusiva por ausência do foreground próprio.

Medições históricas acordadas e caches preservados mostram linhas prontas,
não SLA/primeira instalação limpa/cobertura100%. Falha de vídeos tablet/S24:
logs conectividade timeout antes do primeiro byte e relato igual em dados
móveis. Depois fonte respondeu200 e Coyote reproduziu no tablet D8. Isso
indica disponibilidade intermitente, não correção definitiva do player; S24
reprodução efetiva pendente. Nenhum novo endpoint/timeout/headers/TLS/C9.
**Produção e carregamento universal de capas permanecem pendentes**, assim
como entrega final nos Fire e conferência física final24/25/27.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset/novo provedor.

## 50. Continuidade de filmes/episódios, último Live seguro e exclusão de adultos

2026-10-08. [Especificação](../architecture/C11_PLAYBACK_CONTINUITY_AND_ADULT_EXCLUSION.md)
anterior ao código e [evidência completa](C11_PLAYBACK_CONTINUITY_AND_ADULT_EXCLUSION.md).
Posições locais independentes por episódio/filme, Recentes último episódio/ponto,
journal Android recuperado e listener antes do player, filtro canônico adulto
para dados novos/legados/reassociados/first-fold e último Live não adulto após
reprodução efetiva. Limites60Recentes/1000posições/4eventos; IDs/fingerprint,
sem título/URI/header/credencial. Adult Swim/filme comum18 preservados. Canal
fora da página0 recuperado por páginas48; abort/snapshot/C9 preservados.

Regressão física encontrada: getLong do Capacitor rejeitava Integer JSON e
reiniciava0 apesar de115995ms no JS. Leitor numérico estrito e stub real corrigidos;
negativos reais cobrem tipos/ausente/inválidos. NativePlayerActivity/transportes
intactos. Lock22/27/9, continuidade4grupos, suites relacionadas, C9 10/10,
Live8negativos, build/sync/Java138/0falhas e APKassets6/assinatura PASS.
S24 físico: T1E2=15000ms, RecentesT1E1=30000ms, retornarE2 mantém15000ms;
Coyote537925ms normal/Recentes e Live últimoGloboSP SD PASS. Tablet filme
5477891ms; último ponto posterior5479764ms persistiu após force-stop/reabrir
e Recentes, FIRST_FRAME/READY reais. T5E3/10×20 é modelo automatizado, não teste
de temporada5 no aparelho. S24 restart inconclusivo por desconexão; tablet PASS.

APK final **251E6D4BA6AA3DB6A85129B88181A0A87ABBF256A2F2E91973BEBCC385AB07BC**,
12400179bytes; [download](../../Xandeflix-v1.0.0-standalone.apk).
Install-r/hash/dados/firstInstallTime preservados: S24 760/718/5 em18:57:38UTC,
tablet751/715/5 em18:58:29UTC. Wi-Fi do tablet caiu; usuário reconectouUSB e
QA concluída sem reset. Novo pedido explícito autorizou instalar nos dois
Fire:103 recebeu251E em19:33:21UTC,889/856/5;107 em19:33:15UTC,1003/971/5.
Todos os grupos privados iguais e APK instalado idêntico. Nenhum app aberto,
wake ou teste físico Fire; isso não certifica capas/retomada nesses aparelhos.
Baseline720/23pathsallowlisted/703protegidos/HEAD igual.

HTTP401 confirmado em mídia antes de dados; sucesso posterior de Luke/Coyote
com transporte original não identifica causa permanente nem confirma Um Natal.
GETRange posterior206 em ambos perfis não confirma problema de UA. Sem alterar
URL/headers/timeouts/TLS/C9/credenciais. Precisão depende de seek e evento salvo;
kill sem callback pode conservar checkpoint5s. Cobertura universal de capas,
produção e QA física Fire continuam pendentes; entrega Fire agora confirmada.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/reset/backend administrativo.


## 51. Detalhes responsivos, acoes, abas e trailer tablet/Fire

[Especificacao](../architecture/C11_TABLET_TV_DETAIL_TABS_AND_TRAILER_MODAL.md)
e [evidencia](C11_TABLET_TV_DETAIL_TABS_AND_TRAILER_MODAL.md). Hero arredondado16,
altura de conteudo/padding/poster responsivos, toolbar acima com Cast iconOnly
somente tablet. Filmes agora tem Avaliar/Favoritos/Compartilhar ao lado de
trailer; series reutilizam acoes canonicas e abas Episodios/Semelhantes.
Modal publico do titulo atual, play/pause, Back/foco/cleanup, sem source/bridge
privilegiada. Phone preservado. Componentes7/phone5/heroFire4/lock22+27+9 e
Java143 PASS; QA real tablet/Fire, trailers Coyote/The Rookie tocando.

EntregaEC412FD36F1D3FFEC472E01D9E033EF190FA59A0ECD16A44B25EC27F3C66FBFE,
12400179bytes, JSindex-ZUJYN1Zo.js. Install-r/hash/firstInstallTime e todos os
grupos privados PASS tablet757/715/5, S24761/718/5, Fire103899/856/5. Fire103
auditado por amostras completas estaveis antes/depois apesar de PID reaberto;
nenhuma exclusao/reset. Auditoria S24 inicial8EBA foi parcial (2 preferencias,
19 WebView,2 outros alterados); repeticao e entregaEC412 integralmente PASS.
Fire107 nao conectou; S23 excluido por pedido posterior.
Regressao D-pad relatada depois da entrega anula qualquer certificacao desses
percursos: Recentes bloqueado e relacionados sobem ao menu, reproduzidos em
EC412. Correcao/evidencia no ciclo53. Sem Git/backend/reset/novo Gate.

## 52. Copiar diagnostico tecnico e abrir WhatsApp no aviso de playback

[Especificacao](../architecture/C11_PLAYBACK_SUPPORT_DIAGNOSTIC.md) e
[evidencia](C11_PLAYBACK_SUPPORT_DIAGNOSTIC.md). Relatorio fechado/versionado
com HTTP real, Media3 numerico real e checkpoint, versao/bundle/UTC/OS; sem
titulo/catalogId/URI/source/credencial/serial/chave/stack. Retorno nativo aditivo
compativel, posicao/cleanup/transporte/C9 intactos. Botao WhatsApp abre mensagem
preenchida com contato publico readonly existente ou escolha de destinatario;
envio permanece do usuario. Clipboard/fallback e timer10s pausado na interacao.
8 grupos reais +11 aviso anterior +3 novos Java PASS; totalJava143/lock/build.

S24 reproduziu Coyote e Um Natal com fonte original; Um Natal FIRST_FRAME/READY
no8EBA21:42:11UTC e noEC41221:58:26/27UTC. Sem nova falha fisica nessa rodada,
logo aviso/copia/Browser verificados em testes controlados, nenhum WhatsApp
enviado. Isso nao identifica causa permanente dos401 historicos nem resolve
falhas externas/capas universais/producão. S23 excluido; Fire107 indisponivel
no endereco anterior. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 53. D-pad Fire: atravessar Recentes e subir ao hero de detalhes

[Especificacao](../architecture/C11_FIRE_DPAD_RAIL_AND_DETAIL_RETURN.md) e
[evidencia](C11_FIRE_DPAD_RAIL_AND_DETAIL_RETURN.md). RegressaoEC412 reproduzida
com ADB: Recentes isolado por wrappers, semelhantes retornam ao menu por seletor
antigo. Hook consulta linhas montadas no mesmo main, preserva coluna/Ver todos,
busca hero atual e restaura hero inteiro Fire; dialog/player excluidos do novo
scroll. Teste revelou scroll de fundo no dialog (4vs3), corrigido antes da
entrega final. Hook4/hero4/detalhes7/typecheck/lock22+27+9/build/assets6/Java143 PASS.

APK **EB66904E1F626E835AEB6393E668D8F3BB8FD5E68B948DEE211E8A860D9BA47F**,12400179bytes, JSindex-DPP6IYm9.js.
Fire103 install-r/hash/dados/firstInstallTime PASS 897/856/5,
2026-10-08T22:32:44.736Z. QA fisica11 passos Recentes->destaques->Lancamentos e
subida porVer todos->hero inteiro; semelhantes->Assistir->Voltar; Avaliar
Right/Back/foco sem mover fundo PASS. Sem registrar avaliacao/envio/credenciais.
Tablet/S24 mantemEC412; Fire107 ainda semADB noIP anterior e IP atual solicitado,
ultima entrega107 comprovada251E. S23 excluido. Baseline728/protegidos703/HEAD
igual; sem Git/reset/backend/novo Gate. Playback externo/capas universais
nao sao certificados por este patch de navegacao.
## 54. Lancamentos/Destaques nos overviews Filmes/Series

[Plano](../architecture/C11_BROWSE_RELEASE_AND_FEATURED_ORDER.md) e
[evidencia](C11_BROWSE_RELEASE_AND_FEATURED_ORDER.md). Filmes Lancamentos primeiro,
Destaques20 canonicos da Home depois; Series Destaques antes das plataformas.
Ver todos vertical/Back de origem; demais categorias/source-desc/paginacao48/
rail20 intactos. Testes4+anteriores/typecheck/lock/build/Java/assets/certificado
PASS. FireD23B899/856/5 preservados; QA fisica ordem20cards/Ver todos/Back noFire
reconectado0.106 e noS24BKG PASS. Tablet recebeu mesma UI junto de55. Fire107
sem conexao e S23 excluido. Nao certifica playback/capas universais/produção.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.


## 55. Playback Luke Cage e falha AirScreen

[Especificacao](../architecture/C11_CAST_FAILURE_AND_LUKE_PLAYBACK_DIAGNOSTIC.md) e [evidencia](C11_CAST_FAILURE_AND_LUKE_PLAYBACK_DIAGNOSTIC.md). Luke Cage S01E03 falha perto de725243ms com INVALID_NAL_LENGTH/Media3 3001 no tablet, Fire0.106 e S24. Range206/offset147250663 MATCH; trecho anterior toca. Usuario confirmou mesma falha aos12min em outro app. Nao zerar retomada/descartar NAL/alterar SDK ou fonte para mascarar. Cast preserva UA da fonte e oito codigos fechados no aviso/diagnostico; AirScreen LOAD aceito mas CAST_MEDIA_ERROR. Filme local valido tambem falhou no receiver. WIFI=true/CELLULAR=false/VPN=false, RELAY_BOUND sem PEER_ACCEPTED/DENIED nem GET upstream; usuario informou motor de renderizacao incapaz e encerrou transmissao. Primeira fronteira do Cast no receiver; compatibilidade pendente, nao declarar resolvida.
Java148/diagnostico8/Cast4/lock/build/assinatura/assets e install-r S24/Fire0.106 PASS; E87/BKG. Fire107 nao atualizado nesta rodada, S23 excluido. Sem Git/backend/reset/novoGate.


## 56. Episodio continuar, contorno neon e D-pad de series pesquisadas

[Spec](../architecture/C11_EPISODE_CONTINUE_ROW_AND_NEON_CARD_FOCUS.md) e [evidencia](C11_EPISODE_CONTINUE_ROW_AND_NEON_CARD_FOCUS.md). Linha inteira de episodio selecionado destacada. Continuar assistindo/Continuar somente para posicao salva positiva incompleta, identidade canonica/fingerprint/episodeId exatos; subscription e sync nativo existentes com cleanup, sem novo store ou callback de playback. Capas focadas usam contorno e mesmo glow vermelho dos botoes sem alterar dimensoes. D-pad wide segue hero->abas->temporadas (quando existem)->episodios em ordem e volta, independente de X deslocado pelo badge/sinopse; row inteira centralizada. Right/Left locais/menu/restauro/related/modal e hero inteiro Fire preservados.
Render real/WatchHistory2, hook8, hero4, detalhes7, continuidade4, Cast4, diagnostico8, ordem4, typecheck/React, lock22+27+9/prebuild, build/sync, assets6/certificado e Java148 PASS. QA ADB15 passos em Luke Cage aberto por busca no tablet e Fire0.106; hero inteiro/menu/restauro PASS. Fire A Biblia2013 com temporada unica/zero season-buttons:6 passos isolados e identidade da fixture conferida por passo PASS. Regressao Fire Home/filme11 passos PASS. CSS real tablet/Fire: shadow igual ao botao, dimensoes iguais, linha inteira; cascata phone simulada temporariamente no DOM do tablet e removida, nao equivale a QA fisica S24.
APK 4E1DD13D275D75A96FDF4548A03C3BC59024CA1404E83112D5F877ED4C90B10C/index-SYW2hki0.js, install-r preservado tablet/S24/Fire0.106.
S24 atualizado com dados preservados, mas UI fisica final pendente por tela/aplicativo fora do foreground; nao desbloqueado pelo agente. Fire107 ausente do ADB e IP atual solicitado; nao alegar versao atualizada ou QA nesse alvo. S23 excluido. Fonte Luke S01E03 aos12min e motor AirScreen continuam limitacoes externas documentadas55; usuario encerrou Cast, nenhum novo teste Cast. Sem semear historico real/avaliar/favoritar/WhatsApp automatico/reset/rotacao/backend/Git/novoGate.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 57. Relatos ao gestor, WhatsApp tablet e D-pad no aviso

[Especificacao](../architecture/C11_MANAGER_PLAYBACK_ERROR_REPORTS.md) e [evidencia](C11_MANAGER_PLAYBACK_ERROR_REPORTS.md). Enviar ao gestor/copia/fechar em todas plataformas; WhatsApp opcional phone/tablet, excluidoTV por perfil e veto nativo existente. Sem iniciarCast. Foco apos commit corrige BODY no clipboard; Back prioritario fecha aviso. Sino/inbox/paginacao50/leitura por gestor OWNER/ADMIN ativo. Novo schema privado/RLS/sem grants diretos, token salvo/status/binding/licenca validados, payload fechado sem source/catalogo, idempotencia/rate limit. SQL rollback/probePostgREST PASS, zero fake reports. Manager preservado fora do consumerAPK; sem publicacao web/QA visual autenticada.
Testes14+8+11+7+8, lock22+27+9/build/sync/Java148/assets6/certificado PASS. Final1FFC3C6A3CB5481654A5F6EBDAB3C1ABB4C0A2333EA22173E3F9FD13D051D997/index-DMoX919H.js; install-r/hash/dados/firstInstallTime tablet758/715/5, S24762/718/5, Fire1 novo3.126898/856/5 PASS. Tablet16normal+16forcedfallback e S24botoes/copia/foco/Back/enquadramento PASS em fixtures isoladas reaisTSX/CSS/ADB, sem envio ou erro nativo real. Fire final parcial; user somenteTablet, Fire107indisponivel/S23excluido. Baseline751/protegidos737/HEADigual/zero fora da allowlist. Luke/AirScreen nao resolvidos55; sem Git/reset/rotacao/novoGate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 58. Soulm8te: recuperar identidade com poster antigo

[Spec](../architecture/C11_SOULM8TE_METADATA_RECOVERY.md) e [evidencia](C11_SOULM8TE_METADATA_RECOVERY.md). Filenamefonte retirado das variantesTMDB bloqueava sinopse/imagens/trailer e cachematch4negativo. Filename continua primeirocriterio; fallback somente titulo/anoexatos+candidatounico+detalhes/IDreconfirmados. match5 contorna negativos antigos e conserva positivosoffline; sem IDfixo/fonte/catalogo alterados. Novo4/aliases3/phone3+2/artworkAtual12/preparacao5/hero1/gestor14/lock22+27+9/build/sync/Java148/assets6 PASS. Suitehistorica source-first8gruposservicoPASS mas SSRloaderincompativel preexistente: naoPASS integral, sem assertionsrelaxadas.
FinalAEDDAAEAE9EA018BC311CD2E0C3D68048336FDCC16A8EBA919D2781BFDFD8F87/index-Bx2LEpNP.js noS24, install-r/hash/dados/firstInstallTime761/718/5 preservados em21:16:40.353UTC. QA realcompiladaBusca: sinopse/duracao/classificacao/backdrop/trailerdisponivel/cachepositivo1307118 PASS; nao iniciado playback. Tablet/Fire1conservam1FFC/C57; Fire107indisponivel/S23excluido. Baseline759/protegidos749/HEADigual/zero foraallowlist. Sem Git/backend/source/licenca/reset/novoGate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 59. Selo Novidade nas capas por sete dias

[Spec](../architecture/C11_NEW_CONTENT_BADGE.md) e [evidencia](C11_NEW_CONTENT_BADGE.md). Inventario local atomico completo por fonte, primeiro baseline sem falsos selos, novas entradas por primeira observacao e janela7dias, sem renovar por reordem/ID/capa/resync/reinsercao. Hashes/datas privados, limite100000, um segmento/batch200, scan autorizado apos shell, nao consulta TMDB ou altera source/playback. Faixa vermelha central inferior, label acessivel, ano separado, foco/Dpad intacto. Tests12+categorias7+episodios2+Dpad8+lock/build/sync/Gradle/assets6 PASS; browser TSX/CSS tresperfis/covers4/selos2/expiracao e IndexedDB14assertions flow PASS. APK5683BE780F02AA11AE171E62EDF87C5DBFAAE7E802745DAA3068A74CADF97520/index-DvT-8_G7.js instalado S24-r/hash/firstInstallTime/dados763/718/5 preservados21:47:50.608UTC. Visual fisico S24 pendente por bloqueio/fora foreground, pedido aberto; demais aparelhos sem update. Dataspor dispositivo nao globais; existentes anteriores ao baseline nao marcados. Baseline762/protegidos753/HEADigual/zeroforaallowlist, sem Git/backend/reset/novoGate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 60. Atualização automática do conteúdo da mesma fonte

checkContent detecta adições/remoções mesmo com sourceVersion igual, com autoridade canônica intacta. SHA-256 incremental/nativo64KB ligado ao snapshot/perfil evita parse/staging/promoção quando inalterado. Scheduler foreground15min, cooldown persistido/backoff1min/single flight; detalhes/Live/modal/playback/Cast adiam atualização. Staging validado preserva ativo em falhas; shell permanece, rotas de detalhe da geração antiga são removidas. Xtream seis listas válidas/completas, sem truncamento100. Não existe OTA de APK: outros usuários precisam instalar uma vez; episódios novos entram na série, mas não promovem automaticamente série existente a Destaques/heroes/selo Novidade.

19 testes novos/250k T1–T83/pre-staging A–H/profile-live17/Novidade12/browse4/D-pad8/metadata4/lock22+27+9/TypeScript/build/sync/Java148/assets6 PASS. Artwork histórico: dois grupos serviço PASS, depois loader incompatível com NewContentProvider; não PASS integral nem assertions relaxadas. APK Xandeflix-v1.0-build2-standalone.apk (code2/name1.0 para preservar RPC diagnóstico), SHA256 9D7052EA18079140F4F9FF5AE13EC585CE3DEF3786ED5E82D66C2E20F2BBE95C/index-D9F5_H4Q.js, mesma assinatura/package. install-r/hash/firstInstallTime/grupos privados byte-idênticos PASS: S24 760/718/5, tablet758/715/5, Fire1 3.126 901/856/5.

QA real compilada nos três: catálogo final17152filmes/8914séries/221132episódios/sourceVersion1/digest e clock válidos. Tablet e Fire atualizaram fontes antigas17150/8913/221122 na mesma configuração; S24 confirmou geração atual. NO_OP posterior conserva snapshot: tablet12183ms/Fire42959ms/S249755ms incluindo download, evidência sem SLA. Capas montadas decodificadas15/15,53/53,9/9; Ver todos46 e ordem Home correta. Filmes Lançamentos→Destaque→Nacionais/Séries Destaque→plataformas/retornoHome PASS no tablet e S24. Fire posteriormente em NativePlayerActivity por ação do usuário, sem interrupção/teclas adicionais; não novo QA físico D-pad. S24 foreground pendente inicialmente, depois disponível e conferido. Fire2/S23 fora desta rodada; Luke/AirScreen mantêm limites ciclo55. Baseline767/protegidos752/zero fora da allowlist/HEAD igual.

Spec/evidência: C11_AUTOMATIC_SOURCE_REFRESH.md (architecture/evidence). CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR, backend/env/reset ou projeto protegido.


## 61. Series novas e episodios novos nos Destaques e heroes

Spec/evidência C11_SERIES_EPISODE_UPDATES.md (architecture/evidence). Inventário v1
aditivo por fonte/aparelho conserva datas dos títulos; primeira referência completa
de episódios sem falso selo, inclusive mesma geração. Novidade para nova série,
Episódios Novos para combinação temporada/número ainda desconhecida, sete dias
desde detecção local, Novidade prevalece. Reordem/IDs/URL/capa/reinserção/temporada
vazia não renovam; nova adição renova somente episódios. Datas não globais;
homônimos indistinguíveis/renomeação conservam limitações de identidade anteriores.
Somente hashes/datas/faixas numéricas; um segmento/batch200, limite1m episódios,
100k hashes/500k temporadas. Parcial/órfãos/abort/geração/CAS preservam inventário.
Sem nova consulta por capa/TMDB, shell/imagens não aguardam scan.

Resolver no catálogo completo e priorizar até100 candidatas; mesma seleção20 em
Home/Séries/Ver todos de Destaques, hero Home inclui séries antigas atualizadas
mantendo cotas/imagem válida e hero Séries/categoria respeita categoria escolhida.
Selos acessíveis nas capas/hero, dimensões/foco neon/D-pad mantidos. Lista não
substitui card focado durante atualização ou expiração: selo sai no prazo, seleção
expirada se ajusta ao sair do rail/grid. Sem alterar filmes/Recentes/playback.

Nova suite15/escala250k (211001bytes referência), Novidade12, categorias7/ordem4/
coleções3/hero11/elegibilidade1/D-pad8+hero4/refresh19/TypeScript/React PASS.
Browser real TSX/CSS/IndexedDB isolado: scan/persist/restart5checks, labels/foco/
prioridade/hero/expiração nos3perfis PASS,20capas após rolagem,21alvos/sem erros.
Fixtures sintéticas não são teste de adição comercial/TMDB. Lock22+27+9/build/sync/
Gradle/assets6/certificado e Java148 PASS. APK Xandeflix-v1.0-build3-standalone.apk,
code3/name1.0, SHA256364A7E20BB2B25B0BD95EBF72BA4868519F86BC3243A979837D1AD46A3E9839E,
index-DoVPYb8F.js, mesmo package/certificado/RPC diagnóstico. Sem OTA de APK.

Final install-r/hash/firstInstallTime/grupos privados byte-idênticos: S24
974/928/5 em2026-10-10T01:59:36.518Z e tablet974/925/5 em02:01:11.161Z.
Estrutura real S24 read-only8914séries/15834temporadas/221132episódios,
220156coordenadas únicas válidas/mesma geração. Ambos fora foreground/sem UI visível,
WebView deixou de responder após conexão inicial; pedido de disponibilidade
pendente, sem unlock/QA visual integral ou migração persistida física declarada.
Fire1 3.126 permaneceu reproduzindo em NativePlayerActivity/code2: não recebeu
APK3, sessão preservada e disponibilidade solicitada. Fire2/S23 fora da rodada.
Luke/AirScreen mantêm limites55. Baseline771/protegidos749/zero fora da allowlist/
HEAD igual; sem Git/backend/env/reset/rotação/projeto protegido/novoGate.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 62. Capas da fonte e recuperação automática de metadados públicos

Spec/evidência C11_PUBLIC_METADATA_GAP_RECOVERY.md. Fonte local17152 filmes com
referências de capas; backdrop duplica imagem vertical e ano/ID/sinopse não vêm
como campos. Sete exemplos têm capas HTTP200 e materiais complementares no TMDB.
Fix genérico de composição oficial, filename re-hospedado confirmado e comparação
local estrita da mesma capa; match6 por fonte-poster evita colidir homônimos.
Máximo6 candidatos/8 miniaturas w92,16s/cache96/concorrência2, controles de pixel/
proporção/blank/duplicidade/CORS/ano/tipo mantidos. Fonte-first e privacidade da
URI preservados. Sem outra API ativada ou ID fixado em produção. Amostra12 extras
encontrou sufixo[L]; fix terminal mínimo testado antesFAIL/depoisPASS e API real.
Tablet final19/19 capas da fonte/metadados/sinopses/backdrops;16/19 trailers,
três ausentes nos IDs1006381/991565/1326790. Modal aberto/fechado, sem stream da
fonte.9/9 imagens finais visíveis decodificadas. Não é QA de todos os17152 filmes.
Suites6+3+4/TypeScript, lock22+27+9/build/sync/Gradle/Java148/assets7/certificado
PASS; limites TSX históricos registrados. APK build4/name1.0 SHA256
D41E0B6A8F54B22CBCE43F867005A23A867BE34B15A0DCF90A145BF7B2B66CEF,
index-Copzy1G4.js. Tablet971/925/5 em10:24:36.111UTC e S24976/928/5 em10:25:48.806UTC:
install-r/hash/firstInstallTime/grupos privados byte-idênticos. S24 visual pendente;
Fire1 recebeu inicial B875 antes de suspensão, sem fix[L]/QA posterior; Fire2/S23
fora. Provenance776/755/zero fora allowlist/HEAD igual. Nenhum Git/backend/env/
reset/rotação/projeto protegido/novoGate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

Entrega final Fire1 autorizada depois da suspensão: AFTSSS/192.168.3.126 recebeu
APK final D41E0B6A.../build4 em2026-10-10T10:41:36.484Z, mesmo tablet/S24;
hash instalado,1118/1066/5 arquivos privados e firstInstallTime preservados,
zero diferenças por grupo. Lock22+27+9 PASS. QA físico Fire continua suspenso;
sem abertura automática, rebuild ou mudança funcional. Evidência ciclo62.


## C63 — Buffer por conteúdo e foco neon nas capas — 2026-10-10

Política compartilhada Media3: live10–20s/start2.5s/rebuffer4s; VOD30–60s/
start4s/rebuffer6s. Alvos TV16/24MiB, mobile24/48MiB, low-RAM16MiB, bytes
prioritários/back-buffer0; live adaptativo offset10s. MediaCard com contorno
neon3px/linha clara/glow sobre imagem, dimensões e D-pad preservados.
Lock22+27+9, TypeScript/build/sync/Gradle, Java154/0, D-pad8 grupos e browser
12 checagens/3 perfis PASS. APK build5/name1.0 SHA256 469D7F48E6F1290643F53E15C9A8AE729BAF6CFA2E3C2E9937A2B6C580571EA3,
index-CM-ALr2j.js, mesmo certificado/package. Fire1/S24Wi-Fi install-r/hash/
firstInstallTime e1118/1066/5 +976/928/5 arquivos privados preservados,0 diferenças.
QA Fire acordado: ring/Right/Down/Enter e frames filme/live; S24 ring/poster/
filme/READY8810ms/liveREADY3306ms e perfis novos confirmados. Não é medição de
reserva Fire nem prova de ausência de travamentos/QA longa/Tizen/webOS/OTA.
Tablet/Fire2/S23 não atualizados. Provenance781/770/zero fora allowlist/HEAD igual.
Spec/evidência C11_PLAYBACK_BUFFER_AND_CARD_FOCUS.md. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; sem Git/backend/env/fonte/reset/refactor/projeto protegido.


## C64 — Lançamentos primeiro na Home — 2026-10-10

Home: Lançamentos → Recentes → Filmes em Destaque → Séries em Destaque,
depois demais categorias na ordem relativa anterior. Hero/callbacks/keys/
quotas/preparação/fonte/player/C63 preservados. Grupo Home PASS; coleções3 e
D-pad8 grupos PASS, lock22+27+9/TypeScript/build/sync/Gradle/assets7/certificado
PASS. Suite histórica home-release-notice integral limitada pelo loader de
@capacitor/browser do Notice inalterado; sem alegação de PASS integral.
APK6/name1.0 SHA256 33E5F9DFDA7A76151C0B0960B0CF5438D70800BB9D48FF301C29356839D5BE9B, index-C-VJn-as.js.
Fire1 install-r/hash/firstInstallTime e1113/1066/5 arquivos privados preservados
às2026-10-10T13:12:58.505Z; todos os grupos sem diferenças. DOM compilado confirma
ordem/Ver todos/hero acima; aparelho Asleep, sem QA visual/D-pad físico novo.
S24 desconectado, atualização pendente; tablet/Fire2/S23 não atualizados.
Provenance785/775/zero fora allowlist/HEAD igual. Spec/evidência
C11_HOME_CATEGORY_PRIORITY_ORDER.md. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO;
sem Git/backend/env/reset/fonte/OTA/projeto protegido.


## C65 — Encerramento de áudio ao fechar PiP — 2026-10-10

Spec anterior: C11_PIP_DISMISS_PLAYBACK_RELEASE.md. Clone independente ativo,
origin esperado/main/HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e; contratos/lock
lidos; baseline787. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git.

Correção: onStop pausa local sem consultar flag PiP; NativePlayerActivity
salva progresso/terminal não-concluído, libera e finish. Preview mantém latch
de entrada PiP até onResume, liberando após dispensa em ambas as ordens de
callbacks; evento terminal existente fecha C9 sem falso erro. Cast/configuração
não são encerrados por essa regra; background normal do preview conserva pausa
e retomada. Release idempotente/remove probes periódicos/listener de layout,
restaura WebView e impede retomada do preview já liberado.

Java 162 testes/0 falhas/0 erros, incluindo8 novos casos lifecycle;
wiring Android/progresso-antes-release/cleanup PASS. Continuidade web4 grupos
PASS (filme55min/episódio exato/journal/adultos/último canal seguro). Lock22+27+9,
TypeScript/Vite/sync/Gradle/assinatura/package/assets7 PASS.
Teste histórico mobile-output: grupo lease Cast PASS; integral FAIL em assert
literal '<CastButton />' obsoleto. Script e3 páginas possuem hashes iguais ao
baseline anterior ao patch; não regressão C65, não corrigido fora da allowlist.
Não afirmar PASS integral desse harness. Warnings flatDir/chunk/externalização
históricos, build concluído. APK build7/code7/name1.0,
SHA256 23EB3CC739CE4708086F4769AE30D66556102DCADB963E3579255BD0C182C320, 11011441 bytes;
bundle index-C-VJn-as.js mantido (mudança nativa), schemeHTTPS/standalone.
Certificado preservado; buffer/foco/metadata/refresh/selos/Home mantidos.

Usuário informou que S24/tablet estão desconectados e solicitou APK para teste
remoto. Sem instalação, playback físico, desbloqueio ou operação em Fire.
PHYSICAL_PIP_DISMISS_AUDIO= PENDING_REMOTE_USER_TEST; não homologado áudio real
nem performance em aparelho fraco. Conferir após atualizar sem desinstalar:
vídeo -> Home/PiP -> fechar X -> ausência de áudio; reabrir mesmo conteúdo e
conferir posição salva. Repetir episódio/canal, retorno PiP fullscreen e fechar
app nos recentes. Evidência unitária não substitui essa conferência.

Spec/evidência: docs/{architecture,evidence}/C11_PIP_DISMISS_PLAYBACK_RELEASE.md.


## C66 — 2026-10-10 — Entrada amigável e D-pad de séries

Build8 gerado e instalado SOMENTE no Fire Stick1 (192.168.3.126), dados íntegros.
Entrada amigável/play animado, sem contadores técnicos; abas saem para menu,
hero horizontal visível, episódios/temporadas/semelhantes retornam nos dois
sentidos.10 grupos hook/2 progresso/7 detail e browser real PASS; Fire físico
Carrie22/Jack Ryan26 passos D-pad PASS. Startup original tem mock
NewContentProvider obsoleto (hashes preservados); cópia privada4 grupos PASS,
não PASS integral original. PiP físico anterior segue pendente. Lock/build/
assinatura/assets/proteção de dados PASS. Tablet/S24/Fire2 sem atualização.
CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO; sem Git/backend/env/player/source writes.
Spec/evidência docs/{architecture,evidence}/C11_FRIENDLY_STARTUP_AND_SERIES_DPAD.md.

## C67 — 2026-10-10 — Heros Fire enquadrados e sinopse legível

Regressão C66 e tentativa CSS-only9 confirmadas fisicamente. Ramo Fire do
hook usa posição explícita com inset, uma rolagem/RAF; CSS enquadra
Home/Filmes/Séries e sinopse .hero-overview aumenta3px (11→14 no aparelho).
Browser110/Fire físico38 verificações PASS, entrada de processo
novo e retorno D-pad/menu/rail. Build10 instalado somente Fire Stick1; todos
os hashes privados/firstInstallTime/APK preservados contra baseline de10.
No evento9 app reabriu antes da verificação: core preservado, hashes completos
não equivalentes após execução. Lock/build/assets/cert/provenance PASS;
162 resultados Java C65 reaproveitados, fontes nativas intactas. Tablet/S24/
Fire2 sem atualização; PiP físico anterior segue pendente. CURRENT_GATE=NONE/
NEXT_GATE_STARTED=NAO; sem Git/backend/env/source/player writes.
Spec/evidência docs/{architecture,evidence}/C11_FIRE_HERO_SAFE_FRAME.md.


## C68 — 2026-10-10 — Continuidade de séries e controles nativos

Avanço automático em ordem numérica ao fim do episódio e entre temporadas;
Próximo manual independente de±10s. Mesma Activity/MediaSource, C9 e resolver
normais a cada troca; correlação/cancelamento preservam Back/stop/revogação.
Controller com episódio/temporada, seek, velocidade, lista, áudio/legendas da
mídia e ajuste de tela; brilho/bloqueio somente handheld, foco D-pad na TV.
Novo teste8 grupos, regressões/C9, Java166 testes executados neste ciclo, build,
lock22+27+9, assets/cert/standalone/provenance PASS. Build13 instalado somente
Fire1:1112 hashes privados, firstInstallTime e APK preservados/verificados.
Fixture física isolada com C9 mock confirmou auto mesma/próxima temporada,
botão próximo, picker, auto após picker e final sem wrap; não certifica fonte
comercial/backend C9. Troca efetiva de trilha e mobile/PiP físico pendentes.
Falha picker11 corrigida com guarda resumed/PiP; evento auto isolado12 não
repetiu em13, causa exata não estabelecida, sem afirmar eliminação definitiva.
APK SHA2568A13A10BA4ED0CDCF99765475CCF9CB4B2CE4EB0F807ED77B95A8AA62F361C74.
781 arquivos fora da allowlist e HEAD preservados. Sem Git/backend/env/source
writes; CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO. Spec/evidência em
docs/{architecture,evidence}/C11_SERIES_PLAYER_CONTINUITY.md.
