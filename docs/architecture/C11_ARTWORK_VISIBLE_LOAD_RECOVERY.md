# C11 — recuperação visual de capas e prioridade da viewport — 2026-10-07

Pedido explícito posterior ao ciclo48: investigar e corrigir capas quebradas,
lentidão e linhas vazias em Home/Filmes/Séries após instalar APK em novos aparelhos.
Regressão visual invalida prontidão para produção do APK DF381D54…; preservar
navegação48, catálogo/identidade/ativação e validar imagens, não só quantidade cards.
Gate canônico NONE, NEXT_GATE_STARTED=NAO; ciclo local autorizado pelo usuário.
Mesmo preflight/clone/main/HEAD/origin e contratos do ciclo48, sem Git/backend/reset.

## Auditoria e hipótese a verificar

S24: primeiras linhas prontas, Apple TV/Legendadas/Lionsgate20/20/7 imagens sem
src, pendentes após5,4s. Artwork pode iniciar useCachedArtwork sem preparação e
depois loadImage; useCachedArtwork solicita download nativo independentemente
da fila de dois decodes. Ao aquecer a faixa,20 cards recebem prepare=true,
inclusive fora da área visível, e visibilidade torna-se permanente. Filas antigas
podem atrasar linhas novas. Deadline8s do decode inclui espera pelo cache nativo;
falha pode marcar a fonte sem retry da preparação. img sem src aparece enquanto
aguarda cache, provocando ícone de imagem quebrada. Matching por posterPath
continua exigindo arquivo da fonte mesmo quando essa própria imagem falhou.
Hipóteses de requests e fila não implicam que todo link/API esteja disponível.

## Especificação anterior ao código e allowlist

- src/ui/components/Artwork.tsx: um único fluxo de aquisição/preparação/decodificação
  pela fila loadImage, também no Android. Evitar segundo download de cache pelo
  hook. Observar proximidade e visibilidade reais de cada imagem, incluindo eixo
  horizontal. Prioridade para viewport/hero, cancelamento de jobs ainda enfileirados
  ao afastar/sair. Placeholder dimensionado durante espera; img apenas com src
  válido/pronto, nunca ícone quebrado por atributo vazio. Fallback de fonte inválida
  para metadata TMDB, sem bloquear cards/títulos/ações. Retry de falha transitória
  limitado; cache inválido não vira sucesso permanente. Resultados tardios descartados.
- Novo src/artwork/artwork-visibility.ts: dois IntersectionObservers compartilhados,
  viewport e margem vertical600/horizontal200; unsubscribe/cleanup e fallback.
  Sem um observer/timer por card para preparar todas as imagens do catálogo.
- src/artwork/image-load-queue.ts: devolver src efetivamente decodificado em Loaded,
  preservar concorrência2/quota128/LRU96/dedup/priority/cancel/hero. Não deixar
  consumidores abrir transporte nativo antes da admissão pela fila. Não cachear falha.
- src/artwork/artwork-uri.ts: tamanho de exibição público TMDB nos posters w342,
  poster de hero high w780/backdrops w1280, sem modificar catálogo/links de outras fontes. Preservar filename
  e usar HTTPS. Tamanho faz parte da URL da API de imagens conforme documentação
  oficial https://developer.themoviedb.org/docs/image-basics.
- src/ui/components/AsyncCategoryRail.tsx: no modo visible, fila de leitura deve
  seguir a proximidade atual do placeholder. Substituir skeleton só quando chegaram
  itens; categorias distantes não acumulam leitura urgente da dobra atual.
  Ampliar antecipação para próxima dobra mantendo fila2 e leitura20 por categoria.
  Skeleton usa dimensões responsive dos cards reais, evitando saltos de scroll
  quando a linha termina a leitura; sem aumentar distâncias/alterar layout final.
- src/ui/hooks/useArtworkMetadata.ts: expor estado pending/resolved ao Artwork,
  preservando retorno metadata dos outros consumidores. Miss/offline resolvido
  precisa sair do placeholder; não anunciar loading indefinidamente.
- src/ui/pages/HomePage.tsx: usar o mesmo modo bounded/visible já adotado48 para
  categorias Home, sem alterar Hero/Recentes/defaults de navegação/ordem/canon.
- src/index.css: placeholder de capa dimensionado/suave, texto acessível;
  respeitar redução de movimento. Sem mudanças de layout e distância das capas.
- Novo scripts/test-c11-artwork-visible-recovery.mjs: componente real e observers,
  aquisição única/cancel/priority sob fila ocupada, fonte inválida→TMDB sem amarrar
  a arquivo quebrado, placeholder sem img vazio, frio/quente e cache inválido.
- scripts/test-c11-category-rails.mjs: mock controlado do novo observer para
  manter teste real de cancelamento/navegação do ciclo48; critérios preservados.
- Contrato/evidência C11_ARTWORK_VISIBLE_LOAD_RECOVERY.md, quatro memórias e relatório
  cumulativo item49; harnesses ignorados, build/Android/assets/APK usuais.

Não alterar leitores/storage/source/import/control-plane/DB/licença/C9/engine,
metadata matching global, credenciais, Android nativo, package/dependências.
useCachedArtwork permanece para outros consumidores; Artwork não faz transporte
paralelo por esse hook. prepare passa a respeitar proximidade de cada imagem.
Cache frio testado por imagens ainda não requisitadas/fixtures, sem apagar dados,
catálogo ou cache privado de usuários e sem nova ativação nos aparelhos existentes.
Se outra causa for comprovada, atualizar este contrato antes de patch adicional.

## Aceitação

Testes funcionais/lock/typecheck/build/sync/Java PASS; comparar imagens visíveis
ready/naturalWidth/sem src/failed/fallback em várias linhas Home/Filmes/Séries,
com rolagem longa e retorno. Três aparelhos autorizados pelo usuário, install-r
mesmo certificado e hashes privados preservados. Gravar limitações reais de links
indisponíveis e rede; não prometer100% de fontes externas nem ocultar pendência
permanente como sucesso. Relatório deve separar imagem pronta de placeholder.

## Emenda antes do patch adicional ? diagn?stico f?sico do Fire Stick

A vers?o D92D3B4F est? instalada nos tr?s aparelhos, mas a primeira passagem
no Fire Stick ainda teve espera al?m de7,5s; retorno exibiu imagens prontas.
Dois consumidores ainda aquecem URI original enquanto Artwork usa w342:
onFocus do MediaCard e prefetchCatalogArtwork. Isso duplica chaves/jobs e pode
baixar imagens grandes. Emenda autoriza exclusivamente MediaCard.tsx e
artwork-preload.service.ts a usar displayArtworkUri(...,'poster'), mantendo
callbacks, cotas48, cancelamento/filas e leitores. Teste novo verifica os
consumidores reais usando a mesma URL/chave de exibi??o, sem transporte extra.

Foram observados Batwoman (L)/The New Pope (L) sem recupera??o. Na identidade
local de fallback do Artwork, retirar somente marcador terminal '(L)' de idioma
ao falhar a fonte, conservando ano/tipo/tmdbId e crit?rio de ambiguidade global.
N?o alterar t?tulos exibidos, IDs, cat?logo ou matching global. Teste isolado
verifica preserva??o das demais propriedades e o t?tulo conservador.
Novos hashes/APK exigem build/lock/instala??o e teste f?sico novamente.

## Emenda antes do patch adicional ? cancelamento de leitura j? iniciada

Auditoria de c?digo: loadPage recebe signal, por?m readPage/records n?o recebem
o sinal; cancelamento s? ? conferido depois de terminar todos os segmentos.
Uma linha fora de tela pode reter a fila de leitura e atrasar a dobra atual.
Emenda autoriza em src/catalog/segmented-browse.service.ts somente propagar
signal para leituras n?o compartilhadas (pageSize20 das faixas), conferindo
antes/depois do I/O e ap?s espera por vaga. Manter p?gina48 deduplicada entre
consumidores: cancelar um consumidor n?o cancela trabalho compartilhado.
N?o alterar contratos, contagens, categoria, cursor, quota, armazenamento,
import, source, matching ou identidade. Novo teste real controla primeira
leitura pendente e prova que abort impede abrir o pr?ximo segmento; outro
prova que consumidor v?lido da p?gina48 continua recebendo resultado.
Esta exce??o substitui apenas a proibi??o gen?rica de modificar esse leitor
na allowlist49; demais arquivos can?nicos continuam protegidos.

## Emenda antes do patch ? estabilizar capas j? exibidas na faixa

Probe f?sico HBO no Fire: primeira capa mudou de O Lobista para Boardwalk Empire
quando preview parcial virou20 itens; ready1 caiu para0 e a dobra come?ou a
carregar outra sele??o. MediaRail reaplica Fisher-Yates a comprimento maior.
Autorizar em MediaRail.tsx somente preservar IDs j? exibidos, na ordem atual,
e acrescentar novos IDs em ordem randomizada pelo seed da visita. Itens removidos
saem; refer?ncias novas atualizam metadata. Lan?amentos/preserveOrder conservam
a ordem fornecida. Sem alterar20/48, rotas, a??es, carrossel ou cat?logo.
Teste real mant?m primeira sele??o e bot?es/foco quando chegam novos itens.
A antiga prote??o de hash do MediaRail neste ciclo ? sucedida somente por isso.

## Emenda antes do patch ? ?ndice pequeno de pr?vias de categorias

Usu?rio acompanhou Fire e confirmou lentid?o; probe instrumentado da API local
mediu6 leituras,10.495.738 caracteres,8.238ms acumulados, cinco blocos do mesmo
tamanho1.742.789. A espera ? tamb?m releitura local, n?o s? download de imagem.
Autorizar novo src/catalog/category-preview-index.ts e hook useCategoryPreviews.ts:
pr?via derivada exclusivamente do snapshot local ativo, uma varredura cooperativa
por kind, um segmento por vez,20 ViewModels por categoria e at?64 categorias/kind.
N?o reter segmentos completos ap?s processar; nenhuma temporada/epis?dio/stream,
sem rede/contagem total/?ndice de busca/import/fonte/autoriza??o. Todos IDs/tipo/
categoria/ordem de origem preservados. ViewModels selecionados por fun??es reais
do cat?logo; r?tulos/sinopse limitados e metadata apenas, sem refer?ncias playback.
Compartilhar o preparo entre Home/Filmes/S?ries, mem?ria at?1MB/kind e IndexedDB
privado at?1MB/kind/duas entradas ativas, versionado pelo snapshot. Se indispon?vel,
corrompido ou exceder limite, voltar ? leitura can?nica existente. N?o persistir
URL de artwork com query/credencial; esses casos continuam leitura em mem?ria.
Cache n?o ? autoridade para ativa??o/playback. Gera??o antiga nunca ? aceita;
confirmar manifest antes/depois da varredura e antes de carregar cache persistente.
Resultado20 de categoria fica dispon?vel assim que encontrado; n?o esperar
terminar todas as categorias. Abort do consumidor remove espera, n?o cancela
outros; troca de snapshot cancela varredura antiga. Preparo come?a ap?s pintar
a p?gina, n?o participa do boot/import/primeira ativa??o e n?o baixa todas capas.
Integra??o m?nima autorizada em HomePage, CatalogBrowsePage e AsyncCategoryRail:
consultar pr?via tipada antes de repetir scans; fallback conserva categorias48/
Ver todos/cole??o vertical/pagina??o. Page48 usa leitor can?nico, sem pr?via como
fonte de total ou substituto de todos os t?tulos. Novo teste49 cobre I/O ?nico,
cache quente, corrup??o, troca snapshot, abort compartilhado, quota e aus?ncia
de dados de reprodu??o/segredos no cache. Antiga prote??o de CatalogBrowsePage
? sucedida somente por essa integra??o. Build/lock/Java/update preservado e
medi??o fria/quente no Fire s?o obrigat?rios, sem SLA inventado.

## Emenda antes do patch ? cache nativo com mil arquivos

Fire tem1001 arquivos em cache/artwork-v1 (incluindo parcial). C?digo nativo
lista diret?rio em cada getCached/get/load e, ap?s cada download, varre todos,
consulta length e ordena Comparator.comparingLong(File::lastModified). Sort
repete stat de arquivo em O(N log N), dentro de synchronized, al?m de milhares
de consultas na carga cont?nua. Deadline JS8s pode virar falso erro de source;
failed Set n?o prova HTTP404. Hip?tese deve ser medida ap?s corre??o.
Autorizar somente ArtworkDiskCache.java e ArtworkDiskCacheTest.java: ?ndice
em RAM limitado aos arquivos da quota j? existente, inicializa??o ?nica do
diret?rio, bytes/datas consultados uma vez por entrada, LRU/TTL por registros
em RAM, hits verificam arquivo existente e comprimento; exclus?o externa
revalida/rebaixa bytes. Promo??o/valida??o/imagem8MB/150MB/1000/30dias/hash opaco/
rename/partial/dedup2 continuam id?nticos. N?o alterar plugin transport HTTP,
pool, ponte, package, player/C9/manifest/licen?a/source. Inicializa??o/prune
remove excedente preexistente e TTL sem reter arquivo inv?lido. N?o apagar
cache/dados dos aparelhos como teste; update-r preserva estado can?nico.
Dois testes Java reais: muitas leituras/novas capas n?o repetem listFiles nem
stat por compara??o de sort; arquivo exclu?do externamente deixa de ser hit
e ? recuperado, preservando quota/TTL/LRU. Aceita??o mede imagem fria/quente,
pro?be afirmar links indispon?veis sem distinguir timeout de filesystem.
Antiga prote??o nativa deste ciclo ? sucedida exclusivamente por esses arquivos.

## Emenda antes do patch — evitar repetir transporte que já falhou

Probe físico sanitizado no Fire confirmou requisições de capa da fonte falhando
no plugin nativo e sendo repetidas por Image.src no navegador: uma falha nativa
levou631ms e a segunda tentativa772ms; outra643ms mais804ms. Retry de3s repete
essas mesmas imagens inclusive enquanto a alternativa TMDB está carregando.
Não se afirma HTTP404: código atual mascara a causa como CACHE_UNAVAILABLE.
Uma linha já aquecida ficou8/8 pronta em2,3s; primeira visita ainda é pendência.

Autorizar somente ArtworkCachePlugin.java, novo ArtworkCacheFailurePolicy.java
com teste Java e ArtworkDiskCache.java: preservar causa de IOException de fetch,
classificar apenas mensagens/categorias conhecidas de transporte/imagem como
CACHE_SOURCE_UNAVAILABLE, sem URL/credencial/log de erro original. Falha de disco,
quota operacional/pool e causa desconhecida continuam CACHE_UNAVAILABLE. Nenhuma
mudança no transporte, timeouts, pool, validação ou protocolo. Testar causa
encadeada e separação de filesystem, timeout/rede, imagem e resposta inválida.

Autorizar artwork-file-cache.ts e fila loadImage a usar aquisição estrita: falha
conhecida de fonte não abre outra requisição idêntica no WebView; aciona fallback
já autorizado do Artwork. Manter API legada cachedArtworkUri com fallback direto
para demais consumidores. Falha local/causa desconhecida continua permitindo
transporte direto. Memorizar somente falhas conhecidas em RAM por60s/quota128,
sem gravar URLs de fonte/erros no disco. Invalidation/online permitem recuperar.

Artwork pode preparar metadata opcional de alternativa para poster externo não
TMDB assim que estiver próximo, com prioridade real da viewport; fonte válida
continua primeira escolha. Mesmo matching conservador tipo/ano/tmdbId, marcador
terminal(L) local, sem amarrar alternativa a filename que já falhou. Retry de
fonte ocorre apenas após alternativa resolvida sem imagem: não competir com
fallback pendente ou pronto. Testes reais devem provar uma aquisição, ausência
de segundo transporte em falha conhecida, fallback direto em erro local,
recuperação/TTL, e fonte válida preservada. Não alterar serviço TMDB global,
Hero/reader adicional/player/ativação/source/lock/import/search/backend/Git.
Build/lock/Java e instalação preservada novamente; aceitação física mede visita
após reiniciar processo e retorno quente. Números observados não são SLA.

## Emenda antes do patch — ordem de prioridade e falhas de transporte conhecidas

Probe HBO físico do APK5615B9B4 confirmou que8 capas da segunda linha visível
(top300) foram admitidas antes das capas pendentes da primeira linha(top48).
A fila usa unshift tanto ao receber prioridade quanto ao promover jobs: a última
linha promovida passa à frente da primeira. Autorizar apenas fila image-load-queue
para FIFO dentro da prioridade urgente; drain continua escolhendo primeiro job
urgente, antes dos jobs normais, concorrência2/quota128/LRU96 inalterados. Promoção
muda prioridade sem inverter ordem. Teste real prova urgentes antigos antes dos
novos, todos antes de background, dedup e cancel preservados.

O mesmo probe ainda confirmou cache rejeitado como CACHE_UNAVAILABLE seguido
por transporte direto. Exceção genérica de I/O da conexão não está na classificação
conservadora. Autorizar plugin a encapsular IOException SOMENTE de getResponseCode,
getInputStream e input.read em CACHE_TRANSPORT_FAILED; nunca encapsular out.write,
criação/rename de arquivo ou erro local. Política reconhece esse código seguro e
MalformedURLException. Não exportar mensagem original, URI, credencial ou stack.
Testes distinguem causa de transporte de falha de disco e preservam fallback direto
para disco/causa desconhecida. Sem mudança em HTTP, headers, deadlines ou pool.
A rodada HBO com espera~19,7s invalida qualquer afirmação de correção concluída
baseada apenas em CRUNCHYROLL10,5s. Repetir build/lock/instalação/medição final.

Revisão antes do ajuste de política: falha do decoder BitmapFactory sozinha não
prova imagem inválida para o WebView (ex.: SVG/codec não suportado nativamente).
CACHE_INVALID_IMAGE deve permitir tentativa direta, mantendo compatibilidade.
Testar explicitamente essa distinção; arquivo rejeitado nunca é promovido.
Demais falhas conhecidas de rede/resposta continuam recuperação sem duplicação.

## Emenda antes do patch — alternativa herda prioridade da linha visível

APKBB181EC1: HBO8/8 pronta apenas15.966ms, CRUNCHYROLL8/8 em8.940ms. FIFO
eliminou inversão simples, mas uma alternativa criada após falhar a fonte entra
atrás das fontes da segunda linha já enfileiradas. Autorizar fila e Artwork a
fornecer somente coordenada top da imagem visível, uma leitura no efeito de
admissão; urgentes da primeira linha (incluindo alternativas) precedem urgentes
da segunda. Empate conserva FIFO. Hero/foco explicitamente high sem coordenada
continua prioridade crítica. Jobs normais continuam depois dos visíveis, quotas
2/128/96 inalteradas. Promoção deduplicada conserva melhor prioridade vigente.
Testar fallback da linha superior chegando depois da linha inferior e sendo
admitido antes dela, sem ampliar concorrência, IO ou mudar layout/categorias.
Medição anterior ainda não é evidência de prontidão visual para produção.

## Emenda antes do patch — sobrepor transporte e decodificação com cotas separadas

Probe do Fire no APK42A6FB27 mediu download/cache~0,6–1,5s, leitura da imagem
local~0,25–0,5s e decode~0,22–0,68s. A fila só admite outra aquisição após terminar
as três etapas anteriores; o transporte nativo fica ocioso durante decode.
Autorizar somente image-load-queue e teste49 a encadear duas etapas limitadas:
no máximo2 aquisições nativas e2 imagens em carregamento/decodificação, com
no máximo2 aquisições ou caminhos preparados esperando admissão ao decoder.
Transporte da próxima imagem pode ocorrer durante decode da anterior. Nenhuma
Image/src/decode de imagem extra antes da admissão; mantém RAM de2 decoders,
128 jobs enfileirados, LRU96/dedup/viewport/rank/hero e cancelamento. Caminhos
preparados são strings/bytes em cache opaco no disco, não bitmaps em RAM.
Cancelamento de queued/prepare descarta resultado tardio e não marca fonte como
inválida; nativo em curso continua limitado até sua promessa terminar. Primeira
reserva hero deixa vaga também no transporte; sem aumentar HTTP pool/cotas/timeout.
Teste controla transporte e decode independentemente e prova sobreposição real,
picos2/2, prioridade, limites, cancel e retomada, não somente teste de implementação.
API loadImage continua compatível; nem fonte, catálogo, metadata global ou player
mudam. Manter decode() e validação de sucesso: WHATWG/MDN documentam readiness
após a promessa, https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode.

Autorizar também em ArtworkDiskCache.key apenas converter os mesmos32 bytes
SHA256 em64 caracteres lowercase por tabela hex, em vez de32 String.format,
reduzindo alocações no caminho síncrono de cada hit. Mesmo input UTF8/digest/nome
opaco; teste compara filename com SHA256 conhecido para provar compatibilidade
com cache existente. Não atribuir ganho temporal a esta micro-otimização sem
medição isolada; medir UX completa após build e update preservado.

## Continuação autorizada e emenda antes do patch — 2026-10-08

Usuário solicita manter React/TypeScript/WebView, continuar diagnóstico e avaliar
provedores alternativos. Não autoriza assinatura, nova API/chave, envio de
catálogo ao backend, mudança de linguagem ou reescrita. CURRENT_GATE=NONE,
NEXT_GATE_STARTED=NAO, Git/backend não autorizados. Preflight repetido no clone
C11 independente: main, origin esperado, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e,
baseline699/24 alterações permitidas/protegidos229 intactos. Contratos e lock lidos.

No Fire Stick103 com APK59365699, probe PARAMOUNT: busca TMDB1366ms e detalhes
481ms, HTTP200, sem429 nessa amostra. Diversas fontes originais falharam com
CACHE_SOURCE_UNAVAILABLE. Não atribuir toda ausência ao TMDB nem concluir que
outra API resolve renderização. Provedores TVmaze/OMDb avaliados somente por
documentação oficial; nenhuma integração ou assinatura foi criada.

Probe A-B-B-A temporário no DOM do próprio app, mantendo viewport/página, mediu
24requestAnimationFrame por etapa: animação ativa108 placeholders290ms média;
desativada234 placeholders61ms; desativada222 placeholders26ms; reativada213
placeholders163ms. Visibilidade verdadeira em todas, estilo removido em finally.
Há evolução do carregamento entre etapas, portanto não é benchmark controlado
de ganho percentual ou SLA. Retorno da lentidão na última etapa sustenta patch
mínimo de pintura; cache/HTTP/fallback continuam necessários.

Autorizar em src/index.css somente desativar artwork-preparing nos placeholders
e artwork-pending dentro de app-shell--fire-stick. Manter dimensões, gradiente
estático, texto acessível/status, demais animações/plataformas/layout intactos.
Validar CSS aplicado fisicamente, navegação de categorias, capas reais,
estabilidade de processo e tempos completos; repetir lock/build e update.

Usuário informa novo Fire Stick192.168.3.107; isso adiciona somente esse aparelho
à instalação atualizada com install-r, mesma assinatura/package, sem reset.
Read-only confirma AFTSS/API28 e packagecom.xandeflix.prebuilt já existente.
Helper privado pode incluir alvo firestick2/porta9676; verificar hashes de todos
os dados privados, catálogo/ativação/firstInstallTime antes/depois e SHA do APK.
Não abrir app durante comparação de preservação nem operar outros packages.
Fire103/tablet continuam autorizados; S24 ausente não recebe atualização.

Eventos antigos de morte do processo no Fire103 ficaram sem causa confirmada;
probe atual encontrou próprio app em foreground/PSS155845KiB e sem eventos
recentes de crash no buffer. Isso não apaga ocorrências antigas nem certifica
estabilidade. Repetir monitoramento enquanto o próprio app estiver ativo.

## Emenda antes do patch — confirmação por nomes alternativos oficiais

Probe público direto e sanitizado confirma: Suando Frio tem candidatos1999/2018;
Histeria tem20 resultados e vários homônimos; não escolher arbitrariamente.
Leadale no Daichi nite retorna119335/In the Land of Leadale/2022/poster disponível;
GETtv/119335/alternative_titles confirma exatamente Leadale no Daichi nite.
Falha desse título é correspondência local, não ausência de imagem no TMDB.

Adicionar à allowlist somente src/artwork/tmdb-metadata.service.ts e novo teste
scripts/test-c11-tmdb-alias-recovery.mjs. Autorizar lookup alternativo apenas
quando seletor anterior não acha nenhum candidato forte, sem posterPath e com
no máximo2 IDs positivos distintos nos resultados da busca do mesmo tipo.
Respeitar ano±1, exigir alias normalizado exato confirmado pelo endpoint oficial
do mesmo ID e uma única correspondência;2 confirmados/mismatchID/resposta inválida
falham fechados. Nenhuma redução do threshold/troca de critério para homônimos.
No máximo2 chamadas de aliases extras por lookup; mesma fila2/128, timeout,
cooldowns e imagem HTTPS allowlisted. Depois confirmar detalhes pelo mesmo ID.
Sem novo provedor/chave/backend, alteração do catálogo ou fonte/playback/C9.

Versionar somente chave de correspondência sem TMDBid de match3 para match4,
reutilizando positivos válidos match3 e legado sem match; negativos antigos não
impedem recuperação. Positivos continuam offline/sem nova consulta. Cache v2,
quotas512/TTL e estrutura pública allowlisted preservados. Identidades com ID
mantêm chave original. Testar alias real sintético, homônimos, alias não exato,
ano errado,2aliases iguais, ID errado, muitos resultados, posterPath existente,
dedup/tipo/limites2 e persistência/migração positiva/negativa. Build/lock/QA/instalação
devem ser repetidos após mudança. Arquivos antes protegidos permanecem intactos
fora deste único serviço explicitamente incluído na emenda.

## Emenda antes de associação local confirmada — 2026-10-08

Usuário confirmou explicitamente Dinastia2017/TMDBtv72002 e Histeria2011/
TMDBmovie75802 por links públicos. Autorizar somente verificar detalhes/imagens
oficiais desses IDs e preencher entradas correspondentes no cache opcional
público de metadados v2 nos Fire103/107 autorizados, usando o esquema/whitelist,
kind/ano/id validados e TTL30dias/cota512 já existentes. Sem criar mapas de títulos
no APK, copiar ativação/catálogo, alterar source/C9/backend ou inferir outras
obras. Conservar entradas positivas sem conflito; reportar/parar se houver
associação positiva diferente para o mesmo título no aparelho. Valores negativos
podem ser substituídos pela confirmação explícita. Aplicar chaves reais match4
para identidade sem ano/ID apenas dos dois títulos confirmados.

Antes/depois comparar hashes de arquivos canônicos de catálogo e identidade/
ativação, em memória. Alteração do cache público WebView é intencional, distinta
da igualdade exigida no momento da instalação. Recarregar só o próprio WebView
para reler metadados; exigir recuperação física da imagem. Nenhuma credencial,
URL de fonte ou conteúdo do catálogo é impresso/persistido nos probes. Esta
associação é local, sujeita ao cache existente; não propaga automaticamente a
instalações novas/outros dispositivos e não constitui correção da fonte original.
Tablet/S24 ausentes não recebem gravação. Não relaxar matching automático.

## Emenda antes de Ver todos na Home — 2026-10-08

Pedido explícito posterior inclui Ver todos nas categorias da Home. Acrescentar
somente callback tipado movies/series + ID opaco da categoria a HomePage e às
quatro instâncias existentes no App. Reutilizar AsyncCategoryRail/MediaRail,
coleção vertical paginada48 e histórico já existentes. Não fabricar categorias
para Recentes/Destaques nem alterar seleção20, hero, cache/fila, ordem ou leitor.
Home→categoria exata→detalhe→voltar deve conservar tipo/ID/Home no histórico,
inclusive IDs iguais para filme/série. Botão acessível ao toque/D-pad e visível
no cabeçalho transitório e carregado. Testar componente Home real, callbacks
e rotas; repetir typecheck/build/lock/assinatura/6assets e install-r preservado
nos dispositivos conectados. Ampliar allowlist apenas src/App.tsx, exigindo
comparação revertida ao baseline para provar que só os quatro callbacks mudam.

S24 reconectado: usuário pediu expressamente instalar o APK mais recente.
Atualização D867 realizada com hashes privados/firstInstallTime idênticos;
receberá também o APK que inclui Ver todos. A associação manual pública dos
dois títulos continua restrita aos Fire103/107. Novo erro MEDIA_PARSER_FAILURE
no tablet autoriza triagem read-only: identificar conteúdo e capturar somente
código/categoria/checkpoint/classes sanitizados no próprio app. Não alterar
playback/fonte/engine ou iniciar fallback especulativo sem causa confirmada
e especificação separada anterior ao código. Tablet desconectado permanece
limite da investigação até poder capturar/reproduzir o erro.

## Emenda antes de preparação inicial limitada do Fire — 2026-10-08

Usuário pediu foco nas capas e propôs espera inicial com progresso. Testar
somente apresentação da Home no perfil app-shell--fire-stick, depois que o
catálogo ativo já está disponível. Não bloquear importação/ativação/bootstrap
canônicos. Preparar até8 capas reais nas duas faixas de Destaques e na primeira
categoria de cada tipo: até32, mais até8 cartões já visíveis (Recentes), e hero
existente. Observar DOM dos próprios componentes para contar imagens realmente
decodificadas; não duplicar seleção aleatória nem considerar placeholder como
capa pronta. Fallback explícito conta indisponibilidade, não sucesso de imagem.
Só uma tentativa por snapshot por execução do documento; máximo8 marcas RAM.

Espera máxima20s, amostragem250ms/estabilização500ms e Entrar agora acessível
ao D-pad. Concluir quando alvos iniciais/hero e leituras das duas categorias
se resolverem; sair também por tempo/ação do usuário. Foco retorna ao hero
sem scroll. Nada de tela presa, downloads de catálogo inteiro, nova API ou
alteração de cota96decoded/128jobs/2aquisições/2decode/150MB/TTL. Eager limitado
somente enquanto prepara; ao sair, offscreen volta à política de visibilidade
e aborta imagens não usadas. Telefones/tablets continuam sem essa espera.
Artefatos ainda podem faltar por ambiguidade/erro de fonte; não certificar100%.

Allowlist adicional: src/ui/components/StartupArtworkPreparation.tsx,
src/artwork/startup-artwork-preparation.ts, scripts/test-c11-startup-artwork.mjs.
HomePage/AsyncCategoryRail/MediaRail/MediaCard/Artwork/index.css já permitidos:
somente prop bounded/preparação/modal, sem refatoração. Testar limite/contagens,
fallback separado, timeout/cancelamento/estabilização e propagação real de props;
validar abertura/Entrar agora/D-pad/Home Ver todos no Fire físico. Repetir build,
lock/assinatura/assets e instalação preservando dados nos conectados.

Novo esclarecimento do usuário: erro anterior foi Luke Cage, T1E2. Investigação
de reprodução adiada por pedido explícito; não modificar player neste ciclo.

Correção prevista pelo critério físico: primeiro APK B002 exibiu Home43/43
Ver todos, mas não acionou preparação. Ler ref do parent somente depois do
commit (effect) e aguardar classe de perfil assíncrona com um MutationObserver
restrito à class do app-shell; desconectar ao iniciar/unmount. Nenhum observer
do catálogo inteiro. Revalidar estágio/foco/limites após nova compilação; B002
é intermediário, não prova de funcionamento da preparação inicial.

## Emenda antes do patch — confirmação do bitmap local no Fire — 2026-10-08

APK E50: Comédia no Fire103 ficou5/8 capas prontas após21.737ms. Probe de
etapas confirmou arquivos em cache chegando em6–191ms, mas Image.decode
demorando6.071–6.778ms. Comparação da mesma imagem já disponível, detached,
attached e decoding=sync, manteve6.704–7.482ms; frames também escassos. Remover
temporariamente efeitos CSS não resolveu esse probe. Não atribuir causa ao
TMDB, a tamanho excessivo ou a uma falha específica do engine sem evidência.
Teste drawImage + getImageData1px confirmou bitmap legível em0–11ms, enquanto
decode permanecia pendente por2.032–8.077ms. Dados locais sanitizados, sem
URIs/pixels/credenciais exportados. Relato de Luke Cage continua adiado.

Autorizar somente image-load-queue.ts e teste de recuperação já allowlisted:
no perfil .app-shell--fire-stick, com plugin Android disponível e src estritamente
da mesma origin /_capacitor_file_/, após load e dimensões positivas, usar canvas
temporário1x1, drawImage e getImageData para confirmar rasterização sem aguardar
promise Image.decode. Não inserir canvas/bitmap no DOM, ler/exportar cores ou
persistir pixels; descartar superfície após leitura. Readback força materialização
dos bytes; sucesso não depende de alpha (imagem transparente pode ser válida).
SecurityError/contexto indisponível/erro no canvas retorna ao decode existente.
Outras plataformas, imagens externas/diretas e origem diferente conservam decode.
Sucesso nunca admite dimensões zero, load/error, timeout8s, cancelamento, cotas
2aquisições/2imagens/2preparados/128jobs/96LRU e seleção permanecem intactos.
Referência primária: https://html.spec.whatwg.org/multipage/canvas.html.

Testar rasterização e sucesso com decode propositalmente pendente, ausência de
transportes/bitmaps extras, fonte direta/outro perfil sem readback, falha/contexto
ausente com fallback padrão, dimensão zero/falha de decode sem hit, e descarte
da superfície. Repetir lock/build/APK/assinatura/instalação preservada e medir
linhas após navegação vertical, não só cache ou promessa; inspecionar screenshot.
Melhora inicial não certifica catálogo inteiro/instalação limpa/produção.

Esclarecimento antes da entrega: dumpsys power dos dois Fire revelou
Wakefulness=Asleep/DisplayOFF durante os probes lentos apesar de visibilityState
visible/hasFocus true. KEYCODE_WAKEUP, somente nos dois alvos autorizados,
restaurou Awake/DisplayON. Repetição E50 ainda sem novo patch: Comédia8/8 pronta
em5.663ms; decode de capas20–340ms, hero inicial998–1000ms. Os números anteriores
continuam registrados, mas não são benchmark de navegação com TV ligada nem
prova de defeito universal de decode. O patch bitmap1px trata readiness local
também no repouso, sem forçar frames/despertar aparelho em código de produção.
Nova comparação física deve registrar estado de energia; não afirmar ganho
causal a partir de caches/seleções/estados diferentes.

## Emenda antes do patch — Ver todos também em Recentes/Destaques — 2026-10-08

Novo pedido/imagens do usuário mostram Recentes e Filmes em Destaque ainda
com setas. Sucede a exclusão anterior dessas três linhas da Home: TODOS os
cabeçalhos de faixas da Home devem usar Ver todos, inclusive Recentes,
Filmes em Destaque e Séries em Destaque, em phone/tablet/Fire. Não fabricar
categoryId nem atribuir coleção editorial à fonte canônica.

Usar a rota existente home/itemId somente com enum de apresentação fechado
recent-watched/featured-movies/featured-series. Histórico nativo/header/Back,
tipos de rota e autoridade não mudam. App recebe import/guard de apresentação
na case home, mais callback onSelectCollection nas quatro Home existentes.
Featured completa significa os mesmos até20 itens selecionados pelo sistema;
Recentes completo usa os até60 registros já permitidos no histórico, preserva
ordem/fingerprint e ação resumeRecentWatch existente, sem nova política de player.
Home continua20 por faixa. Lista completa é grade vertical, paginação automática
do CatalogGrid existente, cabeçalho/foco/scroll inicial no topo e retorno à Home.
Detalhe→Back retorna à coleção. Categoria real mantém rota movies/series+ID exato.

Allowlist adicional mínima: novo src/ui/pages/HomeCollectionPage.tsx, novo
scripts/test-c11-home-special-collections.mjs, src/ui/components/RecentTitles.tsx
(prop rail/collection/onViewAll, limite de resolução20/60 e mesma retomada),
src/ui/components/CatalogGrid.tsx (somente prop opcional getItemKey/defaultid,
para chaves kind:id em histórico misto; não mudar seleção/paginação/handlers).
HomePage já permitida: três callbacks Ver todos. Sem CSS novo/source/selector/
watch-history/playback/routes/engine/boot/hero. Reversão de mudanças especificadas
App/CatalogGrid deve reproduzir hashes baseline; ampliar prova de proveniência.

Testar Home real com botões nas três linhas, whitelist/inválido, featured20,
Recentes completo60/ordem/fingerprint/mesma ação com posição, chave mista,
Home→coleção→detalhe→Back→Home e callback nas quatro instâncias App. Repetir
lock/typecheck/build/Java/APK/assets/assinatura e install-r nos quatro conectados.
QA físico deve inspecionar botões justamente nessas linhas das imagens, clicar
para abrir grade e voltar; contagem43categorias não substitui validação46faixas.
Capas: conservar as17 correções e quotas, repetir amostra na nova coleção e
registrar pendências sem prometer100% de imagem externa ou escolher homônimo.

## Emenda antes do patch — retorno D-pad ao hero completo Fire — 2026-10-08

Usuário reportou que voltar das categorias ao botão Ver detalhes deixa o topo
do hero cortado. Reproduzido no Fire103 acordado com APK CDF004: hero de405px
inicia emtop10/bottom415 na viewport540; após card→Ver todos→ArrowUp, foco
retorna corretamente ao botão, mas a rolagem centrada nele deixa top-91/bottom314.
Não é falha do foco nem motivo para diminuir imagem ou alterar altura/CSS.

Allowlist adicional: src/ui/hooks/useDpadNavigation.ts, somente scheduleScroll;
novo scripts/test-c11-fire-home-hero-dpad.mjs. Na rolagem já agrupada por frame,
quando o alvo focado estiver no .home-page .home-hero-carousel dentro do perfil
.app-shell--fire-stick, alinhar o wrapper inteiro ao início com behavior auto,
inline nearest e retornar. Demais perfis, heroes de outras páginas, trilhas,
menu, repetição55ms, cache geométrico e escolha de alvo permanecem idênticos.
Sem listener/observer/medição global adicional nem mudança no HomeHero/Hero.
Prova de proveniência deve reverter só esse trecho ao hash baseline do hook.

Testar hook real: retorno hero usa wrapper e uma rolagem/rAF, plataformas e
outras páginas mantêm rolagem anterior, alvo removido/foco alterado cancela.
Repetir build/lock/APK/install-r preservado e ArrowUp real nos dois Fire,
medindo top/bottom do hero na viewport. Registrar este19º ajuste no relatório,
sem certificar playback ou cobertura integral das imagens externas.

### Regressão reportada e escopo corrigido — três heroes e foco programático

Usuário voltou a reportar corte também na Home e explicitou Filmes/Séries.
O PASS físico anterior4FA081 (Home, duas ArrowUp nativas, top0/bottom405) é
apenas aquele caminho, não refuta o relato nem certifica outros retornos.
Última regressão prevalece. Suceder o seletor apenas Home pelo .hero-banner
nas páginas home-page/movies-page/series-page, conservando perfil Fire.

Foco programático (preparo inicial/entrada de página) também deve executar
o mesmo scheduleScroll agrupado, não só teclas: adicionar focusin ao effect
existente do hook, filtrando HTMLElement, perfil Fire e esses três heroes.
Remover na mesma limpeza. Keydown e focusin compartilham cancelamento/rAF,
não criam rolagens concorrentes. Alvo desfocado/removido ainda é descartado.
Allowlist permanece hook/teste próprios; sem CSS/Hero/HomeHero/player/boot.
Provar via teste real os três seletores, foco direto, rAF único, cleanup,
outros perfis/detalhe/rails inalterados. Conferir cada página nos dois Fire com
ArrowUp e foco direto, registrar geometria do banner efetivo, não só wrapper.

### Posição do Voltar das coleções Home no Fire — antes do CSS

Usuário apontou Voltar à esquerda em Séries em Destaque (coleção editorial
aberta por Ver todos), diferente do padrão superior direito das outras telas.
Autorizar apenas duas regras em src/index.css, restritas ao perfil Fire e
.home-collection-page: cabeçalho position relative com espaço à direita e
.home-collection-back absoluto right0/top0. Não mudar callback/histórico/foco,
ou páginas externas/phone/tablet. Validar geometria botão/título sem sobreposição
e ação Voltar/D-pad no Fire; registrar20º ajuste, mesma entrega APK preservada.

### Associação confirmada Anos Incríveis1988 — antes da aplicação local

Diagnóstico real de metadata opcional retornou HTTP200 e candidatos4500/1988
e126164/2021; fonte não tinha ano/ID/posterPath TMDB. Usuário confirmou1988.
Permitir reaplicar o fluxo de associação pública já autorizado para Dinastia/
Histeria, agora Anos Incríveis/tv4500/1988: validar detalhe oficial/ID/ano/capa e
atualizar somente entrada opcional pública v2, com TTL30d/quota512 nos dois
Fire autorizados. Não sobrescrever catálogo, identidade, source/configuração.
Não embutir mapa de título ambíguo no APK nem atribuir a todas as fontes1988.
Hash dos arquivos catálogo/nativos comparados antes/depois em memória.

### Canais24h não são séries — especificação anterior ao código

Usuário confirmou 24H CHAVES como canal ao vivo. Leitura sanitizada do modelo
exibe categoryLabels=[CANAIS | 24HRS], mas kind=series. Classificador antigo
prioriza path /series/ até em grupo de canais; perfil gerenciado também pode
rejeitar esse conflito. Não resolver ocultando apenas um cartão nem trocar capa.

Allowlist adicional: src/source/content-kind-classifier.ts e
src/source/source-classification-profile.ts; novo scripts/test-c11-live-24h-kind.mjs;
scripts/test-c11-profile-live-snapshot-fix.mjs somente expectativas de versão
atual e controle de refresh da versão2. Regra contextual estrita: título com
prefixo24H separado, categoria explícita CANAL/CANAIS |24H/24HR/24HRS/24HORAS,
sem identidade episódica/atributo bruto e sem /movie/; classificar live mesmo
quando locator usa /series/. Título24H isolado ou categoria de séries não basta.
explicitKind informado pelo provedor permanece prioritário. Mesma regra antes
do conflito de perfil; manter demais regras, URL/stream/fonte/autoridade intactos.

Incrementar CURRENT_CLASSIFICATION_PROFILE_VERSION de2 para3. Reutilizar
refresh canônico já existente do BootSyncCoordinator: somente sob autorização
real, fonte direta/staging/validação/promocão normais. Não editar bootstrap,
snapshot ativo à mão nem identidades. Instalação-r preserva geração existente;
após abrir app, importação autorizada pode promover nova geração e suas relações
de live/search/cache ficam naturalmente vinculadas ao novo snapshot. Falha
preserva geração anterior, sem declarar conversão concluída antes de promover.

Testar classificador/perfil real, negativos movie/episódio/outra categoria,
explicitKind preservado e refresh2→3/current3 sem loop. Executar testes do
importer/lock/build e conferir24H CHAVES ausente de Séries e presente em Canais
após promoção nos aparelhos. Caso source indisponível, registrar pendência
física sem contornar licença nem montar canal com URL inventada. Este21º ajuste
sucede proteção anterior apenas destes dois arquivos allowlisted.

Compatibilidade da fixture obrigatória de ativação: lock detectou manifesto
hardcoded versão2 no caso AUTHORIZED_BOOT_STILL_RESOLVES_AND_PRESERVES_REAL_CATALOG,
esperando NO_OP. Versão2 agora requer refresh3 e o mock sem payload conservou
geração antiga, como previsto. Autorizar scripts/test-c11-new-device-activation.mjs
apenas substituir classificação hardcoded2 da fixture de catálogo ATUAL por
CURRENT_CLASSIFICATION_PROFILE_VERSION importado. Preservar integralmente
NO_OP, contadores de entrega/promoção, identidade/ativação e todos22 casos.
Não mudar expectativa para aceitar refresh falhado. Teste novo/legado de perfil
prova separadamente versão2 exige refresh e3 não. Mesmos27promoção/9negativos;
lock falhado bloqueia APK até nova passagem, sem contornar hook.

### Lancamentos mais recentes da fonte primeiro ? antes do patch

Usuario pede categoria de filmes Lancamentos do ultimo adicionado ao mais
antigo; filtros de data/ano/classificacao ficam para ciclo futuro. Diagnostico
local do snapshot real:1303 filmes nessa categoria, zero campos de data de
inclusao; M3U preserva ordem original com IDs mov:m3u sequenciais. A primeira
faixa seleciona primeiros20 (Males2025...), ignorando itens no fim (Coyote vs.
Acme2026...). Nao usar ano TMDB como data de insercao nem inventar timestamp.
Para esta fonte M3U, apresentar ordem inversa da lista original, incluindo os
ultimos itens antes de aplicar quotas20/48. Data de inclusao precisa de metadata
do provedor para garantia cronologica absoluta; titulo exemplo foi solicitado
ao usuario para confronto. Nao criar filtro, alterar schema/IDs/canonico/importer
ou novas datas persistidas. Grupo Lancamentos continua definido pela fonte.

Allowlist adicional: src/ui/hooks/useSegmentedBrowse.ts; catalog reader ja
autorizado somente estender leitura com opcao source/source-desc, mantendo
default intacto; CatalogBrowsePage, AsyncCategoryRail e CategoryPreviewIndex ja
autorizados apenas integrar a ordem para filmes Lancamentos. Nova script
scripts/test-c11-release-source-order.mjs. Contagens mantidas; page jobs/cache
separados por ordem; cursores48 percorrem segmentos e offsets ao contrario sem
reordenar paginas anteriores quando autoappend. Nao inverter so primeiros20
ou primeira dobra48. Series/outras categorias e Recentes mantem criterios.

Preview index: manter rolling20 ultimos da categoria enquanto scan cooperativo
percorre segmentos uma vez; devolver ordem decrescente so apos completar;
nao acumular1303/fullcatalog, nao vazar stream/config, manter64categorias/1MiB.
Versao opcional do cache previews1 para2 invalida apenas dois registros de
apresentacao; snapshot/canonico/identidade preservados. Fallback do rail usa
a mesma leitura invertida; initial first-fold parcial nao pode fazer short
circuit nem mostrar faixa antiga de Lancamentos. Warmup/Ver todos mesmos20
e48 primeiros invertidos na Home e Filmes; colecao exclusiva vertical autoappend.

Testar tail20/primeira48/paginas48 seguintes atraves de multiplos segmentos,
contagem, cursores sem repeticao/omissao/cache isolado, precoce versus categoria
normal, repositorio1 invalido/reutilizacao2, cancelamento/troca de geracao e
quotas. Conferir ordem real Home/Filmes/Ver todos contra tail da fonte nos
aparelhos, registrar limite de ausencia de data; lock/build/APK/install-r.
Este23o ajuste permanece no ciclo49 e nao inicia novo Gate.

Pedidos posteriores24/25 e diagnostico26 de reproducao estao especificados
antes do codigo em C11_HOME_RELEASE_AND_PLAYBACK_NOTICE.md: Lancamentos logo
apos Series em Destaque, aviso em canto por10s, transporte read-only. A
allowlist adicional daquele documento integra este mesmo ciclo49. Playback
funcional permanece protegido ate defeito demonstrado/spec adicional.

### Regressao fisica24H na fonte real ? emenda antes do ajuste

APK67EF instalado/preservado e importacao normal promoveu perfil3 no Fire103,
mas24HCHAVES ainda apareceu como series. Prova real sanitizada: titulo bruto
24H CHAVES TEMPORADA07, grupo CANAIS|24HRS, sem episodio explicito. Parser
interpreta mencao de temporada sozinha como episodio1; teste anterior apenas
24HCHAVES foi insuficiente. Latest regression wins; nao certificar perfil3.

Predicate contextual pode remover apenas token TEMPORADA/SEASON seguido de
numero para testar presenca de identidade episodica restante; SxxExx/TxxExx/
NxN/episodio/capitulo/EP explicitamente numerados continuam negativos. Regra
ainda exige prefixo24H e grupo estrito; movie locator/atributo bruto e explicit
kind mantidos. Nao alterar parser/importer/modelo. Incrementar perfil3 para4
para reparar tambem aparelhos que promoveram3; versoes1/2/3 stale,4 atual.
Novo teste inclui titulo exato observado TEMPORADA07 e variante season, mais
negativos TEMPORADA07 EP08 e serie normal fora de grupo. Importer real fixture
deve usar titulo observado, canal completo preservado no Live e serie real
inalterada. Atualizar somente controles de versao dos testes permitidos.
Esperar promocao4 real e confirmar ausente de Series/presente Live, fonte
e locator intactos; nenhuma edicao manual de snapshot ou reset/rotacao.

Compatibilidade do teste de rails: incluir dependencia real category-presentation
no loader controlado de AsyncCategoryRail, sem modificar assertions existentes.
Acrescentar cobertura de first-fold20 antigo com posters: Lancamentos deve
continuar skeleton e carregar tail antes de marcar pronto, fallback Home/Filmes
usando source-desc, cleanup preservado. Nao relaxar teste para ignorar imports.
