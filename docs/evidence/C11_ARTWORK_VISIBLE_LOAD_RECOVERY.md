# C11 — Recuperação e desempenho das capas — ciclo49

Data: 2026-10-08. **Melhorias implementadas e verificadas; cobertura completa
de imagens e prontidão para produção ainda pendentes.** Há títulos sem imagem
original utilizável e sem identificação suficiente para recuperar uma capa
correta entre homônimos. Não declarar o problema inteiro resolvido.

## Autorização e proveniência

Usuário solicitou corrigir capas ausentes/lentas, continuar mantendo
React/TypeScript/WebView, avaliar alternativa ao TMDB e atualizar dispositivos.
Adicionou o novo Fire Stick192.168.3.107. Especificação anterior ao código em
[contrato do ciclo](../architecture/C11_ARTWORK_VISIBLE_LOAD_RECOVERY.md), com
emendas antes de cada expansão necessária. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Sem commit/push/PR/backend, troca de linguagem/API,
assinatura de serviço, reset, rotação de identidade ou mudança de licença/C9.

Preflight repetido no clone independente
`C:\Xandeflix\xandeflix-prebuilt-c11-main`, top-level idêntico, main, origin
`https://github.com/xandeflix2/xandeflix-prebuilt.git`, HEAD
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. AGENTS/Architecture/Execution/Source
Boundary/lock de instalação lidos. Baseline699 arquivos; dirty anterior
preservado. Auditoria final: 55paths allowlisted,
223arquivos protegidos intactos, nenhuma alteração inesperada, HEAD igual.
Reversão das rotas/callbacks Home do App, chaves de grid e scroll de hero D-pad
reproduz baseline; reader conserva cancelamento e patch source-desc definido
em especificação, comprovados por reversão determinística. Classifier/profile
mudam só contexto24H autorizado e versão; fixture de ativação usa constante
atual. Playback, bootstrap, autoridade e dados fonte fora do patch intactos.
Pastas original/histórica intactas.

## Otimizações realizadas

1. **Um carregamento por imagem.** Artwork passou a usar o coordenador comum,
   retirando aquisição nativa paralela ao preload. Foco/prefetch/cartão usam a
   mesma resolução e chave. Resultado tardio de rota abandonada é descartado;
   publicar src local decodificado não dispara novo pedido da mesma capa.
2. **Tamanho apropriado.** URLs públicas TMDB de cartão usamw342, pôster vertical
   destacadow780 e fundow1280, preservando filename/proporção. HTTPS normalizado;
   URLs não-TMDB conservadas. Referência: [Image Basics](https://developer.themoviedb.org/docs/image-basics).
3. **Visibilidade compartilhada.** Dois IntersectionObservers para todo o
   conjunto: proximidade600px vertical/200px horizontal e visibilidade real.
   Entrada/saída cancelam ou promovem pedidos; uma faixa não faz seus20 cartões
   parecerem todos visíveis. Observadores/subscrições liberados no unmount.
4. **Prioridade da primeira linha visível.** Empates urgentes FIFO; coordenada
   top permite que a alternativa de uma capa da linha superior anteceda fontes
   da próxima linha. Hero/foco críticos conservados. Fila128 e resultados96.
5. **Transporte sobreposto ao decode.** Até2 aquisições nativas e2 decodificações;
   até2 aquisições/caminhos prontos esperando decoder. Preparados são caminhos
   para bytes no disco, não bitmaps extras. Timer8s, validação decode e cotas
   conservados; exceção bitmap local Fire descrita no item17. AbortSignal já
   abortado é considerado antes da admissão de IO.
   [HTMLImageElement.decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode).
6. **Cache nativo com acesso constante.** Inventário inicial de diretório uma
   vez; índice RAM limitado, lookup verifica arquivo existente/tamanho. Prune
   LRU/TTL não repete sort com stat de cada arquivo em cada download. Conserva
   8MB/imagem,150MB,1000 arquivos,30dias, partial/rename e nomes SHA256. Conversão
   hex equivalente evita32String.format; teste prova mesmo filename.
7. **Falha conhecida não gera segundo download idêntico.** Plugin preserva
   causa e diferencia transporte/resposta/protocolo/limites de falha do cache.
   CACHE_SOURCE_UNAVAILABLE permite alternativa sem repetir o mesmo acesso no
   navegador. Falha local/desconhecida e decoder nativo incompatível conservam
   fallback direto. Falhas transitórias só em RAM60s/128, com retry/online.
8. **Alternativa antecipada e segura.** Capas externas preparam metadados perto
   da viewport, mantendo fonte válida preferida. Filename falhado não vira
   restrição indevida de matching; remove somente marcador terminal(L). Retry
   original não compete com alternativa ainda pendente/pronta.
9. **Sem img vazio ou quebrado.** Enquanto pendente há div com estado acessível;
   img só recebe src validado. Miss resolvido exibe título/indisponibilidade.
   Arquivo local removido recupera sem tratar cache quebrado como imagem válida.
10. **Prévia local por categoria reutilizada.** Uma varredura cooperativa por
   kind/snapshot;20 itens/categoria,64 categorias/kind e estimativa1MiB/kind.
   IndexedDB privado limitado a dois registros, whitelist de metadados públicos,
   sem streams/credenciais e sem URLs com query persistidas. Invalida na troca
   de snapshot; cache inválido/quota indisponível volta ao leitor canônico.
   Não altera boot/import, catálogo ativo, busca ou coleção canônica48.
11. **Ordem estável dos cartões.** Prévia parcial mantém IDs já mostrados e
   acrescenta novos ao completar20; atualiza metadados sem embaralhar posições
   focadas. Ordem inicial preservada; Lançamentos recebeu depois a emenda23.
12. **Placeholder estático no Fire Stick.** Teste A-B-B-A confirmou custo de
   pintura da animação de gradiente. Desativada apenas nesse perfil; dimensões,
   gradiente estático e indicação acessível conservados. Outras animações e
   plataformas mantidas.
13. **Nomes alternativos oficiais.** Busca TMDB pode encontrar um alias e
   devolver apenas nomes original/traduzido. Sem candidato forte/posterPath e
   com até2 IDs, confirma alias normalizado exato no endpoint do mesmo ID.
   Respeita ano, rejeita duas confirmações/ID errado/resposta inválida e mantém
   seletor antigo para homônimos. No máximo2 pedidos extras na fila existente.
   Match4 reaproveita positivos match3/legado, mas permite recuperar negativos
   antigos; IDs explícitos e cache público v2/512/TTL permanecem compatíveis.
   [Aliases de séries](https://developer.themoviedb.org/reference/tv-series-alternative-titles),
   [Aliases de filmes](https://developer.themoviedb.org/reference/movie-alternative-titles).
14. **Associação pública explicitamente confirmada.** Usuário identificou
   Dinastia2017/tv72002 e Histeria2011/movie75802. Detalhes oficiais validados
   pelo serviço real, HTTP200,855/225ms. Somente cache opcional público v2 dos
   dois Fire atualizado, TTL30dias/cota512; catálogo/fonte/identidade intactos.
   As duas capas reapareceram fisicamente com os IDs corretos. Não há mapa
   desses títulos embutido no APK: cache local pode expirar/ser removido e não
   propaga a instalação nova. Não flexibilizar matching dos demais homônimos.
15. **Ver todos nas categorias da Home.** Categorias reais movies/series têm
   botão à direita, com tipo e ID da categoria exata; abre coleção vertical48
   com paginação automática e histórico existentes. A emenda18 posterior
   acrescenta Ver todos às coleções próprias Recentes/Destaques. Home
   real, callbacks e quatro rotas alternativas do App testados. Conferência
   anterior E50:43/43 categorias com botão nos dois Fire e no S24; primeiro
   Filmes|Nacionais aberto via D-pad/Enter, título/kind/grid48 corretos.
16. **Preparação inicial limitada no Fire.** Quando a Home está disponível,
   apresenta “Preparando as capas”, progresso e “Entrar agora”. Prepara até8
   cards em cada uma das duas faixas de Destaques e primeira categoria de cada
   tipo:32, mais até8 já visíveis/Recentes e hero existente. Uma tentativa por
   snapshot/documento,20s máximo, sem bloquear ativação/import/bootstrap; telefone
   e tablet não esperam. Conteúdo continua acessível após limite/atalho. Fallback
   conta indisponibilidade, nunca capa pronta. Amostragem250ms/estabilidade500ms,
   até40 leituras de geometria por sample; listener/observer/foco liberados.
   Limites de rede/RAM/disco conservados. Esse preparo não baixa todo catálogo.
17. **Confirmação do bitmap local no Fire.** Durante repouso, decode prometido
   aguardava segundos apesar de arquivo local disponível e pixels legíveis.
   Após load com dimensões positivas, somente Fire+plugin Android+src mesma
   origin/_capacitor_file_, drawImage/getImageData num canvas temporário1x1
   confirma rasterização; superfície descartada sem pixels exportados. Evita
   depender dos frames escassos para resolver a promessa. Outras plataformas,
   src direto e falha de leitura conservam decode padrão. Dimensão zero/falha
   não se tornam hit. Mesmas cotas2/2/2/128/96/timeout8s. Teste com promessa
   deliberadamente pendente comprova caminho válido, distinção de plataforma,
   contexto/taint/erro e limpeza. [Canvas HTML](https://html.spec.whatwg.org/multipage/canvas.html).

## Complementos autorizados18–27 e resultado atual

As emendas foram especificadas antes do código no contrato do ciclo e em
[Home/aviso/diagnóstico/Recentes](../architecture/C11_HOME_RELEASE_AND_PLAYBACK_NOTICE.md).
Sucede afirmações históricas abaixo sobre setas, classificação e ordem.

18. **Ver todos também em Recentes e Destaques.** Coleções tipadas fechadas
    recent-watched/featured-movies/featured-series; Recentes usa histórico real
    até60, Destaques conserva20 da seleção existente. Grade vertical, sem
    carrossel interno, retorno detalhe→coleção→Home. IDs inválidos, inclusive
    __proto__, rejeitados. App altera somente rotas/callbacks da apresentação;
    chave de cartão inclui kind para coleção mista. Nos dois Fire com D8B47:
    45cabeçalhos/45botões/0setas, Destaques20/20, detalhes/retorno/scroll0 PASS.
    Não existia histórico nesses dois: ausência de Recentes era válida.
    Tablet com histórico:46/46/0, coleção real; regressão9/11 descrita no item27.
19. **Hero inteiro ao retornar por D-pad.** Home, Filmes e Séries no Fire usam
    o RAF de scroll existente e alinham o banner inteiro ao topo quando foco
    entra nele; focusin filtrado cobre foco programático/restauração. Cleanup
    remove listener; não cria loops, timers ou scroll novo em outros perfis.
    Fire107 D8B47: três páginas com botão focado, hero top−1/bottom404/height405
    na viewport540, após duas teclas UP nativas e após foco direto. Fire103
    Filmes D8B47 igual; Home foi medida no artefato67EF anterior. Nova rodada
    das três páginas no103/artefato final permanece pendente, sem extrapolar.
20. **Voltar da coleção no Fire à direita.** Regra CSS somente Fire; botão
    visível no canto superior direito, separado do título. Duas coleções dos
    dois Fire D8B47 verificadas; tablet/celular mantêm disposição própria.
21. **24H Chaves é canal.** Predicate estrito exige prefixo contínuo explícito
    e grupo CANAL/CANAIS24H, removendo somente marcador temporada/season sem
    episódio. Episódios reais e séries fora desse contexto preservados.
    Perfil de classificação4 invalida1/2/3 e usa importação/promoção autorizada
    existente, sem editar snapshot à mão. Nos quatro catálogos lidos,24H CHAVES
    TEMPORADA07 está somente em live/CANAIS|24HRS; não em series. Contagens:
    filmes17150/séries8913/temporadas15833/episódios221122/canais1028,
    streams238272/artworks200/categorias43/gêneros20. Não fabrica capa de canal.
22. **Anos Incríveis1988 confirmado.** Usuário confirmou a versão, detalhes
    públicos TMDBtv4500/1988 validados para cache opcional local, sem mapa no
    APK ou mudança de catálogo. Fire107 associação sobreviveu reload; Fire103
    não sobreviveu na última tentativa. Catálogo/nativos/firstInstallTime
    preservados nas duas. Persistência103 continua pendente; testes/cancelamento
    posteriores não autorizam declarar esse caso recuperado nos dois.
23. **Lançamentos por ordem de inclusão disponível na fonte.** Catálogo M3U
    não fornece addedAt nos1303 filmes dessa categoria. Apresentação source-desc
    percorre segmentos/offsets ao contrário antes de limitar20/48; prévia local
    v2 retém os últimos20 e só publica após scan cooperativo completo. Não usa
    ano TMDB como falsa data de inclusão; outras categorias mantêm ordem.
    Home20/Filmes20/coleção48 correspondem exatamente à cauda inversa da fonte
    nos quatro aparelhos D8B47. Primeiro Coyote vs. Acme2026, depois DSI2024 e
    O Crime Não Descansa2023. Isso comprova ordem da lista, não timestamp de
    inserção do provedor. Filtros futuros por data/ano/classificação não criados.
24. **Home: Lançamentos após Séries em Destaque.** Reordena referências reais
    de categorias de filmes com isReleaseCategory, mantendo demais posições
    relativas e sem duplicar IDs. Não muda catálogo/importação ou ordem dos
    títulos do item23. Teste do componente real PASS; conferência física do
    artefato final ainda pendente.
25. **Aviso de erro compacto por10s.** Fixed no canto superior direito, abaixo
    do cabeçalho horizontal/fora do menu lateral, largura e altura limitadas à
    viewport. Não desloca título/hero nem toma foco. Mantém role alert, texto
    sanitizado e Fechar aviso. Timer10000ms usa callback atual, cancela na troca,
    remoção/unmount e não reinicia em render comum. Testes do componente/hooks
    e sanitização PASS; geometria física final não certificada.
26. **Falha de reprodução diagnosticada separadamente.** Logs sanitizados das
    tentativas tablet/S24 registraram SocketTimeoutException/connectSocket e
    NETWORK_TIMEOUT antes do primeiro byte. Usuário informou falha também em
    dados móveis. Probe limitado do URL canônico em memória: inicialmente
    acesso nativo falhou nos dois, controle públicoHTTP200. Depois no tablet,
    playlist configuradaHTTP200/658ms e filmeHTTP200/1676ms; versão local da fonte
    corresponde ao catálogo, mas host/porta da playlist diferem do vídeo.
    PC permaneceu com TCP timeout~8s. São indícios de disponibilidade/conexão
    intermitente da origem, não prova de codec nem de falha permanente do servidor.
    Coyote reproduziu fisicamente no player nativo do tablet no D8B47, imagem
    FIT completa/faixas pretas e barras ocultas. S24 teve solicitação correta
    do filme17:04:55UTC, mas reprodução efetiva não confirmada; uma tentativa
    anterior abriu trailer e não conta como teste do filme. Nenhum patch de
    playback/timeout/endpoint/headers/TLS/C9 foi feito nesta expansão. Não declarar
    todos os vídeos corrigidos nem disponibilidade estável com base em um sucesso.
27. **Recentes após renumeração M3U.** Leitura privada do tablet encontrou
    11registros/9IDs correspondentes; Luke Cage e Ponto Cego tinham cada um um
    único fingerprint exato em ID novo depois da retirada do canal24H das séries.
    Novo resolver só na apresentação: scan local cooperativo, um segmento por
    vez, até60fingerprints/dois candidatos, sem streams. Remapeia somente M3U
    com identidade exata e única; abort/troca de geração descarta resultado.
    Série exige suffix S/E do próprio item e retomada canônica valida episódio
    atual antes do player/C9. Preserva posição/completion/data; histórico
    persistido permanece intacto. Duplicata antiga+novo progresso aparece uma
    vez com posição do registro mais recente. Testes reais PASS; recuperação
    física dos11 itens no APK final permanece pendente.

As operações nos Fire Sticks foram canceladas por pedido do usuário, que os
estava usando com outro aplicativo. Nenhum novo teste, abertura do Xandeflix,
wake ou instalação será iniciado nesses alvos sem nova autorização. Essa
restrição sucede a autorização anterior de atualizar ambos. Os aparelhos
Samsung saíram do foreground após a instalação; os probes de UI final
terminaram inconclusivos, sem captura de outros aplicativos/tela bloqueada.

## Diagnóstico e medições físicas históricas

Probe inicial no S24 reproduziu linhas20/20/7 sem src após5,4s. Antes do índice,
probe do leitor observou6 leituras/10495738 caracteres/8238ms cumulativos, com
releituras dos mesmos blocos. Com prévias reutilizadas, nova visita mediu0
leituras/0bytes de segmentos. Índice da amostra:43categorias, séries422 itens/
182508bytes estimadosUTF16 e filmes400/191958. Não é SLA nem todos os catálogos.

Pipeline intermediário59365699 ainda mostrou HBO8/8 só em13,924s e Crunchyroll
7/8+1fallback em7,937s. Isso anulou afirmações anteriores de correção completa.

Probe sem alteração persistente da interface,24frames/etapa:

| Animação dos placeholders | Quantidade | Intervalo médio/máximo entre frames |
|---|---:|---:|
| Ativa |108|290/655ms|
| Desativada |234|61/423ms|
| Desativada |222|26/87ms|
| Reativada |213|163/609ms|

Página continua carregando entre etapas; não é A/B com carga idêntica nem ganho
percentual certificado. Volta da lentidão na última etapa sustenta patch mínimo.
No APK histórico D867: Fire103435 placeholders/0 animados/18ms média,35ms máximo;
Fire10753/0/17ms média,20ms máximo. Documento visível em todas essas amostras.

Rodadas históricas D867, contadas somente na área visível da linha:

| Aparelho/página/linha | Primeiro sample com imagens prontas/indisponíveis | Resultado |
|---|---:|---|
| Fire103/Séries/HBO |3,226s|8/8 capas,0pendentes/0quebradas|
| Fire103/Home/Netflix |4,951s|7capas+1fallback Dinastia,0pendentes/0quebradas|
| Fire107/Séries/HBO |6,811s|8/8 capas,0pendentes/0quebradas|
| Fire107/Filmes/Comédia |6,241s|7capas+1fallback Histeria,0pendentes/0quebradas|

Caches e dados foram preservados. Seleção de cartões/snapshots/cargas diferem;
estes tempos não provam primeira instalação limpa, ganho causal total, loading
instantâneo ou cobertura100%. Samples~1,5s têm resolução limitada. No APK
intermediário FCC03A3F já com CSS corrigido, Fire103 Crunchyroll8/8 em3,057s,
Filmes/Comédia8/8 em3,100s; Fire107 primeira passagem HBO8,226s. São referências
observacionais, não substituem métricas finais.

**Caso real Leadale**: antes, busca no Fire103 ficou0/1imagem+fallback até10,234s.
Depois, mesma busca mostrou1/1 em2,047s, sem fallback; API busca328ms,aliases213ms,
detalhes248ms, todosHTTP200. Cache público registrou séries/TMDB119335/poster
disponível. Probe direto confirmou alias oficial, sem baixar/expor fonte privada.

**Ausências restantes**: Dinastia/Anos Incríveis/A Bela e a Fera/The Odd Couple
visíveis no Fire103 sem ano/ID, imagens externas; Histeria/Os Delinquentes no
Fire107 sem ano/ID/imagem original. São campos do ViewModel atual, não prova
de todo atributo da fonte bruta. Busca pública Suando Frio retornou1999/2018;
Histeria retornou20 resultados incluindo homônimos2000/2011. Não inferir obra
pelo primeiro resultado. Usuário recebeu pergunta sobre ano/link público de
Dinastia/Histeria; confirmação depois recebida e aplicada localmente, conforme
item14. Demais casos exigem identificação
equivalente, informação melhor na fonte ou fluxo próprio de desambiguação.

Ver todos no Fire107 abriu coleção exata Filmes|Comedia/movies48 cartões/scroll
vertical. Clique em cartão abriu detalhes: hero top34px/foco dentro/documento
visível, app permaneceu em foreground. Não iniciou vídeo nem transmissão.

### Preparação e repetição física histórica — APK7B90

O APK E50 anterior confirmou a espera inicial, saída/foco/D-pad e43/43 botões
Home. Em uma rodada posterior, Comédia ficou5/8+3pendentes após21,737s; esse
resultado impediu anunciar solução completa. Probes de decode chegaram6–8s.
Depois foi identificado Wakefulness=Asleep/DisplayOFF nos dois Fire, apesar de
documento visible/hasFocus true. Wake autorizado e repetição E50 ainda sem patch
renderizou8/8 em5,663s; decode de capas20–340ms. O repouso é uma variável material:
não comparar aqueles22s com TV ligada nem atribuir esse atraso inteiro à API.

No APK histórico7B90, estado Awake/DisplayON confirmado antes/depois dos probes.
Comédia no Fire103:8/8 no primeiro sample completo4,402s após início da navegação
Home→Filmes; nenhuma chamada decode na instrumentação, confirmando caminho bitmap
local. A seleção/cache já existentes e os intervalos de amostragem diferem;
4,402s versus5,663s não é benchmark causal de ganho percentual.

| Teste final | Resultado observado |
|---|---|
| Fire103/preparação Home |32alvos resolvidos:29imagens+3indisponíveis no último sample ativo; hero e8/8 primeiras capas; saída10,045s após início do probe|
| Fire107/preparação Home |32/32 imagens e hero; saída10,980s após início do probe;8/8 primeiras capas|
| Ambos/foco/D-pad/Home |estágio liberado, limites32/40 respeitados, foco no conteúdo, ArrowDown funciona,43/43 categorias com Ver todos|
| Fire107/Entrar agora |estágio encontrado, foco mantido nas setas antes de sair; clique libera modal/marcas e D-pad; Home acessível|
| Fire107/Home/Netflix |8/8 imagens em1,537s após scroll até a linha;0pendentes/quebradas/fallback|
| Fire107/Filmes/Documentários |7imagens+1indisponível em5,376s;0pendentes/0quebradas|
| Fire107/Filmes/Comédia |8/8 em3,789s após scroll;0pendentes/quebradas|
| Fire107/Filmes/Lançamentos |8/8 no primeiro sample500ms; cache aquecido, não primeira visita fria|
| Fire103/Séries/HBO |8/8 em3,468s após scroll;0pendentes/quebradas|
| Fire103/Séries/Apple |8/8 em995ms;0pendentes/quebradas|
| Fire103/Séries/Lionsgate |7/7 em1,930s;0pendentes/quebradas|

Probes verticais conservam a mesma página enquanto descem por três categorias,
pedem duas amostras consecutivas resolvidas; sem overflow e JSindex-DzTwJg5l
confirmado. Quantidades dizem respeito somente aos cards visíveis. Captura
nativa Fire107 inspecionada: Netflix/Prime Video com capas reais e Ver todos;
não só contadores do DOM. Metadados do catálogo/caches foram preservados: não
foi teste limpo nem simulação controlada de internet fraca ou de catálogo inteiro.
Nenhum título indistinto foi associado ao primeiro homônimo só para preencher UI.

S24 e tablet, depois da atualização final: Home disponível,43botões de categoria,
perfil Fire false/nenhum estágio inicial e bundle correto. WindowManager confirma
barras superior/inferior visíveis na navegação; nenhum player aberto no teste.
Isso sucede o probe anterior inconclusivo da Home do tablet, sem certificar
carregamento integral de capas/reprodução. Fire107 Ver todos→Filmes|Nacionais
retestado7B90:movies/categoria exata/grid48/visible, sem iniciar vídeo.

Limite semântico: uma referência válida da fonte pode conter imagem genérica,
não a capa correta. Captura de Destaques mostrou “Thumbnail unavailable” no item
24H CHANNELS fornecido como série; bytes/dimensões podem estar prontos sem
comprovar correspondência editorial. Essa medição precede a confirmação do
usuário e a correção estrita do item21. As32imagens do preparo107 significam
imagens decodificadas,
não auditoria de identificação de cada obra. Poster/título corretos continuam
dependendo da fonte ou de metadata identificada sem ambiguidade.

## Provedores alternativos

TMDB respondeuHTTP200 nos probes, sem429 nessas amostras; isso não é garantia
global do serviço. [Rate limiting](https://developer.themoviedb.org/docs/rate-limiting).
Imagens originais externas tiveram falhas conhecidas. Trocar TMDB não elimina
custo de pintura nem identifica automaticamente versões homônimas sem ano/ID.

[TVmaze](https://www.tvmaze.com/api) oferece séries/imagens e lookup por IDs
externos; pode ser candidato complementar. A documentação exige atribuição e
ShareAlike. [OMDb](https://www.omdbapi.com/) oferece consultas de filmes/séries;
Poster API é restrita a patrons e o site informa CC BY-NC4.0. Compatibilidade
com uso pretendido deve ser verificada antes de contratar/integrar. Nenhum
novo provedor, conta, chave, scraping ou pagamento foi criado. Avaliação documental
não é benchmark de cobertura/velocidade dessas plataformas no aparelho.

## Testes e artefato atual

PASS anterior do pipeline: startup-artwork, tmdb-alias-recovery,
artwork-visible-recovery13grupos, page-artwork-preparation, hero-artwork-
eligibility, category-rails8grupos, phone-movie/series-detail e typecheck.
Complementos: home-special-collections3grupos, fire-home-hero-dpad,
live-24h-kind/profile-live-snapshot-fix, release-source-order3grupos,
home-release-notice2grupos, playback-error-notice11testes,
recent-source-rebind3grupos e recent-watched3grupos PASS. Exercitam código
real, posição/episódio e guard original; não reduzem controles por homônimos.
Lock22ativação+27promoção+9negativos PASS pelo prebuild antes do bundle final.
Build web/cap sync/Gradle PASS; Java134/0falhas/0erros; React hooks/cleanup/
cancelamento e TypeScript revistos. Fixtures corrigidas, não critérios relaxados.

APK gerado mais recente [Xandeflix-v1.0.0-standalone.apk](../../Xandeflix-v1.0.0-standalone.apk):

- SHA256: `AE2A960BD529477B54DDCF3B73A75D381EE11EC2EB303A2FC288AA3C67FEC4D5`.
- 12400179bytes; com.xandeflix.prebuilt, versionCode1/versionName1.0,
  minSdk23/target35; standaloneHTTPS/sem server.url/6assets byte a byte.
- CertificadoSHA256 `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.
- JSindex-CYCLvbSn.js/CSSindex-C7PkFUOx.css; configuração nativa anterior
  Cast/PiP/barras preservada. Não equivale a homologar cada recurso fisicamente.

**Entrega atual não é instalação final confirmada nos quatro aparelhos.**
Samsung install-r com hash instalado igual, todos os grupos privados iguais,
firstInstallTime preservado, sem abrir automaticamente o aplicativo:

| Dispositivo | Arquivos privados/catálogo/nativos | VerificaçãoUTC |
|---|---:|---|
| SM-X610/API36 |750/715/5|2026-10-08T17:24:08.199Z|
| SM-S926B/API36 |766/718/5|2026-10-08T17:24:28.883Z|

Os dois Fire tinham D8B47FAC6A904B5E21EC0977E1355D049ECBD256C6EEB22AF25089FF2A8C4435
confirmado com preservação total:103 em15:23:46UTC/678/646/5 e107 em
15:28:32UTC/791/761/5. Inclui capas, Ver todos completo, hero, Voltar, perfil4 e
source-desc; não inclui complementos24/25/27 posteriores.
Primeiras tentativas de instalar o artefato atual falharam na etapa install.
Uma chamada direta install-r no103 retornou Success antes do cancelamento;
não há verificação posterior completa de hash/preservação desse novo APK no103.
No107 conclusão atual não confirmada. Usuário cancelou por uso em outro app;
processos Windows dos instaladores desses dois alvos e respectivos filhos ADB
interrompidos, sem matar servidor ADB global/outros aplicativos. Nenhum teste
Fire/rollback/reinstall foi feito depois. Relatórios D8 retidos como históricos,
não apresentados como verificação do AE2 atual.

Probes físicos Samsung após install não concluíram e foreground próprio ficou
false: apresentação final/Recentes/aviso e reprodução S24 continuam pendentes.
Não se inferiu crash ou sucesso desses probes. A reprodução real do tablet
citada no item26 ocorreu anteriormente no D8, sem patch de player.

## Erros, limites e continuidade

- Teste detectou admissão de jobs já abortados ao liberar vaga; corrigido e
  controle real de cancelamento PASS antes da entrega.
- Harness antigo transpila Set paraES3; target corrigido paraES2022 do projeto,
  sem enfraquecer critério. Seletor de input de busca e espera de hidratação
  corrigidos; pidof temporariamente ausente no boot passou a ser tratado como
  espera. Não eram evidência suficiente de crash do produto.
- PowerShell replace com aspas inválidas falhou antes de editar; reaplicado
  por helper privado. Tentativas de QA com alvo/foreground indisponível não
  contam como sucesso. Instalador anterior concorreu com QA do mesmo aparelho;
  comparação quiescente falhou, fluxo corrigido/repetido e hashes finais iguais.
- T187/countCategory é falha anterior comprovada; não editada nem reportada
  PASS. Harness SSR antigo source-first depende de estrutura antiga do
  componente; novos testes executam os fluxos atuais sem relaxar matching.
- Eventos históricos de morte do processo em07/10 ficaram sem causa confirmada.
  Últimas leituras sanitizadas no Fire103 mostram encerramentos ligados ao
  force-stop/install autorizado e processo ativo; não identificado crash novo
  durante a rodada final. Monitoramento limitado não é garantia de estabilidade.
- Esperas residuais e homônimos sem identidade ainda impedem certificar
  experiência de produção integral. Melhorias comprovadas não apagam pendências.
- Primeiro APK B002 não acionava preparo: ref parent lida antes do commit e
  perfil Fire assíncrono. Corrigido com effect após commit e um observer só de
  class do app-shell, desligado ao iniciar/unmount. E50 e7B90 físicamente acionam.
- Apply patch com âncora CSS inexistente e aspas de node -e falharam antes de
  alterar produção; helpers/patches reaplicados. Probe Entrar agora executado
  primeiro sem reload não encontrou estágio; repetição com reload próprio
  PASS. Não chamar esses probes inconclusivos de falha funcional ou PASS.
- Medições em repouso não certificam desempenho acordado. A confirmação bitmap
  trata readiness local sem força de frames/wakelock/preferências globais;
  QA atualizado inclui estado de energia. Não alegar bug geral do Image.decode.
- Confirmação local107 inicialmente regravada por persistência pendente do
  módulo antigo; aplicação antes dos módulos do novo documento e remoção do
  script após reload corrigiram cache. Catálogo/nativos permaneceram iguais.
- Erro anterior MEDIA_PARSER_FAILURE/Luke CageT1E2 não foi reproduzido/corrigido.
  Novo pedido geral autorizou diagnóstico read-only (item26), sem presumir que
  timeout de outros conteúdos explica aquele parser failure.

Artefatos brutos sanitizados em tmp/c11-artwork-visible-20261007 (ignorado):
baseline/provenance-final/apk-final, resultados de preservação, probes API,
frames, scans, busca antes/depois e build logs. Nenhuma URL/credencial de fonte
ou conteúdo de configuração sensível foi incluído neste relatório.

Atualização final: cobertura universal de capas/novas instalações/rede fraca,
persistência Anos Incríveis103, UX física24/25/27, entrega final nos Fire e
reprodução estável S24 permanecem pendentes. Não chamar ciclo inteiro concluído.
Pedido atual de cancelamento respeitado; nenhuma nova operação nos Fire.
