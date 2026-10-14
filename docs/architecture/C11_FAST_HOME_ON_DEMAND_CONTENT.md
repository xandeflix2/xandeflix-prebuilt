# C105 — Home até90s, busca completa local e reprodução sob demanda

## Autorização e escopo — 2026-10-14

Após teste C104 ultrapassar sete minutos, usuário definiu máximo1:30 para Home
utilizável com hero/capas, autorizou resto do catálogo em background e exigiu
busca de qualquer título da lista com reprodução somente do conteúdo escolhido.
Priorizar hero e capas visíveis, preservando funções consolidadas. Acordo não
permite declarar índice parcial como busca completa nem promover catálogo parcial.

C104 comprovou leitura/parse concomitantes, mas não cumpriu Home90s. Seu limite
total15min foi retirado do código por poder rejeitar uma fonte válida lenta.
Não confundir correção do transporte com cumprimento do novo critério de produto.
Este ciclo sucede o transporte, sem mudar identidade/licença/vault/backend.
Branchmain/HEADd039f883, origin esperado; trabalho anterior preservado.
Git commit/push/PR, outra fonte/aparelho, alterações comerciais não autorizados.

## Fase inicial: evidência de capacidade antes de implementar

Verificar no mesmo Fire autorizado, mantendo plaintext somente em runtime local,
se a configuração atual tem acesso a API de inventário resumido da mesma origem.
Obter somente booleans de shape/compatibilidade e handshake auth/status, tempos,
contagens/tamanhos. FonteId opaco pode identificar o registro atual único; não
exportar URL, credenciais, tokens, código/chave, payload de catálogo ou screenshots.
Sem alterar protocolo persistido/remote, sourceVersion, configuração ou autorização.

Probe device-direct exclusivamente para a fonte autorizada: derivação opcional
player_api.php somente quando playlist get.php possui parâmetros username/password
explícitos na configuração local, ou configuração XTREAM já declarada. Mesma
scheme/origin/port e mesmas credenciais efêmeras; se não houver compatibilidade,
reportar limitação. Nunca assumir API pela heurística sem resposta autenticada.
Nenhum endpoint do Control Plane entrega catálogo ou faz buscas.

## Invariantes da implementação eventual

1. Home90s exige medição física: shell pronto não é Home/hero/capas prontos.
2. Conhecer integralmente títulos/IDs leves de filmes, séries e canais antes de
   declarar busca completa. Busca100% local no inventário da fonte/geração atual.
3. APIs de detalhes/temporadas/episódios apenas do item selecionado e dados locais
   bounded. Toda reprodução reutiliza autorização/C9/player existentes.
4. Inventário transitório isolado do snapshot ativo. IDs, detalhes, favoritos,
   progresso e referências não podem misturar M3U ordinais com IDs do provedor.
   Definir remapeamento/estabilidade antes do código correspondente.
5. Catálogo completo continua validação e promoção atômica; transição de modelos
   preserva seleção e reprodução ou é adiada até saída. Nunca publicar staging parcial.
6. Source/binding/versão/licença invalidam sessão transitória e playback fail-closed.
7. Hero/capas visíveis têm prioridade. Concurrency/backpressure do trabalho pesado
   não pode impedir navegação, busca ou playback; coletar tempos de imagens.
8. Se fonte só oferecer M3U completo, não prometer busca de itens ainda não recebidos
   nem garantia90s baseada em dados sintéticos. Reavaliar abordagem com evidência.

## Allowlist da fase inicial

Este contrato; `docs/evidence/C11_FAST_HOME_ON_DEMAND_CONTENT.md`;
docs/STATUS, EVOLUTION_REPORT, ERRORS_AND_BLOCKERS. Helpers privados em
tmp/c105-fast-home, CDP do PID confirmado e métodos existentes da ponte segura/
HTTP no aparelho. Registro canônico é requisito/especificação, nunca segredos.
Somente leitura/probe; código funcional será especificado com allowlist ampliada
e critérios de regressão após a compatibilidade ser comprovada.

`CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C105_CAPABILITY;
NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO`.

## Capacidade comprovada e especificação funcional anterior ao código

Probe no Fire autorizado comprovou API da mesma origem: auth1/Active, listas
completas1082 canais,17916 filmes e9275 séries em14378ms; get_series_info da série
selecionada retornou3 temporadas/30 episódios em784ms. Somente números/booleans
saíram do aparelho. Nenhum protocolo/vault/metadata remota foi alterado.

Para evitar IDs transitórios e perda de favoritos/retomada na troca com M3U,
não adotar uma UI parcial misturando dois modelos. Na PRIMEIRA importação sem
catálogo REAL, se a mesma fonte permitir essa API, preparar um catálogo local
de inventário completo a partir das seis listas completas da API existente.
É o mesmo catálogo de raízes que importXtream já prepara; acrescentar modo
explícito DIRECTORY_ROOTS_V1 e resolver episódios/temporadas somente da série
selecionada. Todas as listas devem chegar e validar antes de staging/promoção.
Manifest/hashes/ponteiros e busca continuam no pipeline canônico completo.
Dados de episódios sob demanda ficam em cache privado separado do snapshot
imutável, vinculado a snapshot/sourceId/sourceVersion/série, sem mutar ativo.

Esta é a representação autorizada de inventário completo com detalhes sob
demanda; não significa lista parcial nem autoriza promover staging incompleto.
Contagens de episódio no snapshot de raízes significam somente episódios
materializados no snapshot (zero inicialmente), nunca afirmar inexistência de
episódios no provedor. O detalhe escolhido deve resolver/validar dados completos
antes de mostrar ausência ou reproduzir. Todo título raiz tem busca local.

No modo novo, IDs de filmes/séries/canais e episódios são estáveis do provedor.
Refreshes posteriores do mesmo modo usam novamente diretório da mesma fonte;
não trocar para ordinais M3U. Snapshot M3U legado existente mantém pipeline e
IDs atuais. API indisponível em instalação nova pode seguir M3U legado (90s
não certificado nesse fallback); falha de API em modo diretório já ativo deve
preservar ativo anterior e não trocar identidades. Mudanças de configuração
continuam sourceVersion lógica/autoridade normal, sem edição do registro selado.

Fonte M3U get.php compatível usa adaptador runtime efêmero da MESMA origem/
credenciais para inventário/API; protocolo persistido e configuração não mudam.
Streams recebem referência direta equivalente à fonte autorizada no dispositivo,
usando o resolver/player/C9 existentes. Jamais persistir credenciais separadas,
retornar URL em logs, indexar URLs, proxy central ou search remoto.

Busca encontra filmes/séries/canais; seleção de canal abre Live no canal escolhido.
Séries carregam e cacheiam somente temporadas/episódios escolhidos, single-flight,
sem misturar outras séries. Cache ausente/offline/falha retorna estado verdadeiro,
não série vazia e não bypass de autorização. Ao trocar fonte/versão/snapshot,
nenhum cache de geração anterior pode entrar na resolução.

Não baixar M3U massivo redundante no novo modo inicial: os títulos completos
já estão no inventário. Arte/metadata e detalhes dos demais conteúdos continuam
sob demanda/background bounded. Preserve prioritização da fila de hero e capas
existente; não criar nova política de artwork nem carregar todas as imagens
ocultas antes de liberar Home.

## Allowlist funcional ampliada

- Contrato/evidência C105, DATA_CONTRACT e memória STATUS/EVOLUTION/ERRORS,
  DIRECT_PLAYBACK somente registro desta representação sob demanda.
- `src/source/source-directory-api.ts` (novo): adaptador/probe/JSON bounded.
- `src/source/device-direct-fetch.ts`: encerramento do body web quando o reader
  já liberou o lock após falha de tamanho/parse; manter a ponte nativa e semântica
  C104. Guard novo comprova cancelamento efetivo, não só retorno de erro.
- `src/source/source-directory-details.ts` (novo): hidratação/cache autorizado.
- `src/source/real-source-importer.service.ts`: transporte da API/diretório,
  referências e tag do modo; caminho M3U/classificação preservados.
- `src/source/m3u-bounded-staging-writer.ts`: parâmetro opcional de extensions
  para gravar DIRECTORY_ROOTS_V1 no header antes da serialização canônica;
  sem alterar hashing de segmentos, manifest ou comportamento sem esse parâmetro.
- `src/source/managed-source-staging.orchestrator.ts`: escolha explícita
  first-install/directory-existing, isolamento/fallback; autoridade intacta.
- `src/bootstrap/boot-sync-coordinator.ts`: passar preferência baseada no
  snapshot existente, nenhuma relaxação de auth/delivery/promoção.
- `src/ui/hooks/useActiveCatalog.ts`, `src/catalog/catalog-read-model.ts`:
  resolver lazy de série/stream reconhecido pelo modo; sem alterar legado.
- `src/ui/pages/SearchPage.tsx`, `src/ui/components/SearchResults.tsx`,
  `src/ui/pages/LiveTvPage.tsx`, `src/App.tsx`: seleção de live encontrado;
  navegação/Back/C9/player/layout existente preservados.
- `src/catalog/live/live-catalog.service.ts`: lookup local de canal por ID
  em segmentos, com saída antecipada e guard do snapshot ativo; retornar grupo
  e offset para selecionar resultado fora do first-fold sem releitura por página.
  Não altera catálogo, autoridade, player nem acrescenta chamadas de rede.
- Tipos de manifest/catalog somente tag opcional sob extensions já permitidas,
  sem alteração de formato/validação/hash canônicos.
- Testes sintéticos novos de API/hidratação/primeiro boot/busca/reprodução;
  testes antigos não relaxados, lock obrigatório e saída usual build/APK.

## Aceitação adicional

1. Listas completas e guard de falha/HTTP/timeout/tamanho preservam ativo.
2. FonteId/versão/protocolo/autoridade são verificados como antes; nenhuma fonte
   é consultada antes de autorização. API incompatível não vira catálogo vazio.
3. Primeira importação usa inventário comprovado, catálogo/busca completos de
   raízes; refresh mesmo modo sem mudança não cria geração/parse desnecessário.
4. Detalhe de série → episódios reais → StreamRef → C9/player funcional;
   single-flight/cache/refresh/falhas não retornam séries vazias falsamente.
5. IDs e progresso/favoritos estáveis entre abertura e refresh no novo modo;
   fixtures legadas M3U e Xtream anteriores mantidas.
6. QA físico de primeira instalação no mesmo Fire: Home+hero/capas visíveis e
   busca completa em<=90s após autorização, com espera humana separada; filme,
   série e canal encontrados fora do first-fold devem selecionar/reproduzir.
7. Lock/build/TypeScript/JVM/regressões de autoridade, transporte, busca, séries,
   playback e UI verdes. Sucesso sintético não certifica tempo real.

`CURRENT_LOCAL_CYCLE=C105_IMPLEMENTATION; NEXT_GATE_STARTED=NAO`.

## Teste físico autorizado da instalação limpa

O pedido vigente de instalação do zero e sua continuação autorizam repetir
uninstall/install somente de com.xandeflix.prebuilt no Fire AFTSS/API28,
serial G071CQ070344374G, com o candidato C105 após lock/tests/build/assinatura.
APK C104 anterior permanece recuperável. Confirmar package ausente após uninstall
e nenhum arquivo anterior antes da primeira abertura. Nenhuma identidade, chave,
ativação, fonte ou catálogo será exportado/restaurado/injetado. Usuário realiza
ativação legítima pelo painel com o novo código/chave mostrados na TV; separar
espera humana do cronômetro. Nenhum tablet/celular, backend ou operação comercial.
Monitoramento CDP extrai somente marcos, números/booleans de Home/hero/capas e
estado sanitizado, sem texto/URLs do catálogo, PINs/chaves/credenciais. Busca
e reprodução normais de amostras podem ser acionadas localmente, com C9 intacto.

## Continuidade das imagens em dados móveis — steering 2026-10-14

Usuário relatou capas lentas em dados móveis e requereu carregamento contínuo
após abrir Home. Ampliação anterior ao patch de artwork: `src/artwork/hero-artwork.service.ts`
e `src/ui/hooks/useHeroArtwork.ts` para prioridade explícita. Primeiro hero
confirmado pode usar alta prioridade; restantes são background normal, permitindo
que capas efetivamente visíveis passem à frente deles na fila já bounded.
Identidade/ano/tipo de conteúdo, imagens corretas/decodificadas e dimensões
atuais permanecem; sem alteração da capa/layout, seleção, swipe/timer10s.
Retry dos candidatos ainda ausentes é limitado e continua depois do primeiro
hero, sem monopolizar rede ou criar ausência falsa. Testes novos + regressões
de hero/artwork/identidade + build/lock, atualização in-place do MESMO Fire
com mesma assinatura/package, sem novo reset/ativação; dados comparados em RAM.

Teste C105 inicial: catálogo119,4s desde T8; hero/imagens visíveis prontos144,5s.
Novo probe na mesma fonte: filmes9,1s e endpoint de séries93,9s (total107,4s),
versus14,4s antes. Hash JS sintético1MiB179ms, WebCrypto79ms, hashes iguais.
Portanto não culpar normalização/hash ou declarar90s atingido. Dependência da
lista completa lenta da fonte permanece limitação física observada; nenhuma
busca parcial será declarada completa e nenhuma promoção parcial será feita.

## Hero maior somente no Fire Stick — pedido corrigido 2026-10-14

Usuário pediu tamanho equivalente ao hero horizontal do tablet em Home/Filmes/
Séries e corrigiu o alvo para SOMENTE FIRE STICK. Allowlist visual: `src/index.css`
apenas regras sob `.app-shell--fire-stick` nessas três páginas. Usar proporção
16:9 com largura inteira disponível e altura auto limitada à viewport menos
inset existente, imagem contain para preservar bordas; remover teto antigo620px
somente nesse override. Manter tamanho mínimo seguro para metadados/botões,
overlay atual, D-pad/inset, dots/swipe/timer10s e player. Não afeta TV genérica,
tablet/celular, detalhes ou Live. Testar geometria real no Fire e regressões de
hero/foco/ações, sem alteração de Java/identidade/source/C9 ou novo reset.

Pedido subsequente permite também diminuir a largura do menu lateral SOMENTE
FIRE STICK. Mesmo `src/index.css`, override da variável de largura da shell
Fire+side-nav; conservar área útil44px dos botões, foco, callbacks e posições
do Live dependentes da largura. Não mexer em menu MASTER ou outras plataformas.

## Correção da busca de canais além do first-fold

Teste físico encontrou filmes/séries tardios, mas não o último canal. O builder
de busca diferida só ingeria canais do header100 e ignorava segmentos Live.
Allowlist ampliada antes da correção: `src/search/deferred-search-index-coordinator.ts`.
Ingerir Live incrementalmente dos segmentos completos, sem URL no índice,
guard de snapshot/falha equivalente às raízes VOD. Índice DIRECTORY_ROOTS_V1
persistido cujo número de documentos não corresponde às contagens completas
deve ser reconstruído localmente (sem refetch/importar fonte). Não relaxar
validadores, não promover outro snapshot e não alterar busca legada válida.

## Indicadores compactos próximos à borda — steering 2026-10-14

Último pedido amplia somente apresentação em `src/index.css`: marcadores de
Home/Filmes/Séries no canto inferior direito para hero horizontal tablet/TV,
menor gap e próximo à borda; no hero de celular permanecem centralizados,
metadados/botões/indicadores juntos mais abaixo. Preservar área de clique/foco,
ações, swipe, timer10s, capa e overlay. Não alterar hero de detalhes/Live nem
tamanho de hero tablet/celular (aumento continua SOMENTE FIRE STICK).

## Instalação final nos três aparelhos — autorização 2026-10-14

Pedido subsequente autoriza instalar o candidato final no celular via USB,
tablet via depuração Wi-Fi e Fire Stick via USB. Substitui a restrição de alvo
do teste inicial deste ciclo, sem autorizar novo reset. Usar exclusivamente
`adb install -r` de `com.xandeflix.prebuilt`, com mesma assinatura e verificação
do APK instalado. Preservar identidade, chave, ativação, configuração selada e
catálogo; comparar os arquivos privados apenas por digest em RAM antes/depois,
sem exportar conteúdo ou digest desses arquivos para relatório.

Alvos USB confirmados: Fire AFTSS/API28 G071CQ070344374G e celular SM_S926B
RXGYB03FL4W. Tablet Tab S9 FE Plus informado pelo usuário; confirmar modelo e
canal Wi-Fi efetivamente conectado antes de instalar. Não persistir código
de pareamento. Falha de conexão não autoriza mudar rede/configuração do aparelho
nem instalar em outro alvo. Git/backend permanecem sem autorização de escrita.

QA físico do candidato encontrou cabeçalho de Filmes/Séries acima do hero,
ausente no modelo sintético inicial: topo61,4px + hero495px excedia viewport540px.
Correção visual no mesmo escopo CSS: reservar64px adicionais de altura nessas
duas páginas somente no Fire, sem diminuir o hero da Home ou mudar o cabeçalho.
Atualizar fixture para incluir cabeçalho real; a evidência física prevalece sobre
o PASS sintético anterior. Rebuild e substituição-r nos alvos autorizados após
nova verificação de geometria/lock; sem reset de dados.

## Coluna Canais em rolagem contínua — pedido 2026-10-14

Usuário exige todos os canais da categoria em uma única rolagem na coluna
Canais, em todas as apresentações. Emenda a paginação visual explícita C73
somente nessa coluna: remover botões anterior/próxima e intervalos de páginas.
Manter leitura local em lotes48 e DOM bounded conforme DECISIONS; representar
altura completa por janela virtual com linhas64px, overscan6 e cache de até
três lotes. Não hidratar/renderizar a categoria inteira de uma vez nem consultar
fonte/Control Plane durante a rolagem. Canal selecionado/preview/C9 não mudam
por rolar ou trocar categoria. Busca de canal abre a posição correta, permitindo
rolar antes/depois dela. Filtro deve examinar todos os canais locais da categoria,
sem ficar limitado ao lote visível. Falha não vira lista vazia; retry explícito.

Allowlist adicional anterior ao código: componente novo
`src/ui/components/ContinuousLiveChannelList.tsx`, LiveTvPage.tsx/CSS, serviço
Live local para página filtrada com guard estrito de snapshot/abort, testes
sintéticos da janela/rolagem/foco/filtro/race e helpers físicos privados.
Painéis nativos fullscreen/favoritos mantêm transporte48 e controles C73;
coluna web contínua funciona em celular/tablet/TV/Fire e tela quadrada.
D-pad atravessa limites de lotes sem trocar canal ou exigir botão de página;
Back/fullscreen/EPG/favoritos ficam intactos. Respostas de grupo/filtro/snapshot
anterior não podem entrar na janela atual. Nenhuma escrita no catálogo ativo.
Rebuild final e instalação-r nos três alvos já autorizados após validações.

QA físico da rolagem rápida exige distinguir seed inicial de navegação explícita:
resposta do primeiro lote não pode mandar voltar ao topo após scroll do usuário.
Somente busca distante/ação nativa explícita reposicionam a janela; requisição
de scroll pertence ao grupo atual. Fixture deve reproduzir chegada tardia do
seed após scroll. Regra nova preserva paginação dos painéis nativos e impede
comando de um grupo anterior de reposicionar outro grupo.

Fechamento de entrega UI: candidato C105 instalado-r nos três alvos autorizados
com integridade privada preservada; rolagem real234 canais validada em cada um.
Não inicia próximo Gate. Critério de primeira abertura90s permanece não cumprido,
registrado separadamente da entrega de UI/instalação. Sem nova autorização de
reset, publicação updater, Git ou backend.
`CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C105_UI_INSTALLED;
PERFORMANCE90=NOT_MET; NEXT_GATE_STARTED=NAO`.
