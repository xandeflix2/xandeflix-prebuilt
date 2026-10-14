# C105 — inventário completo, Home e conteúdo sob demanda

Data: 2026-10-14. Clone ativo independente c11-main; branch main;
HEAD d039f8837dfcfd44374560a9e6642cb93e59c2cf e origin esperado confirmados.
Dirty C100–C104 preservado, Git commit/push/PR e backend não autorizados.
Spec anterior ao código: [C11_FAST_HOME_ON_DEMAND_CONTENT](../architecture/C11_FAST_HOME_ON_DEMAND_CONTENT.md).

## Baseline físico C104

Após instalação limpa e ativação legítima, Home não abriu em mais de sete
minutos. Staging progrediu antes de EOF, mas download da M3U permaneceu lento.
O candidato C104 continha deadline total15min; retirado do código por poder
rejeitar uma fonte válida lenta, antes do novo candidato. C104 não cumpriu90s.
Seu monitor encerrou sem observar Home; não confundir ausência de seletor de
erro com ausência de falha do transporte. Baseline anterior completara M3U
em aproximadamente40min e normalização/promoção em mais3min32s.

## Capacidade física verificada, somente leitura

Fire autorizado AFTSS/API28, serial G071CQ070344374G. Configuração selada M3U
permaneceu intacta. API player_api.php derivada somente da mesma origem e do
par explícito de credenciais local; auth1/Active verificados. Nenhuma URL real,
credencial ou payload saiu do aparelho; somente booleans/contagens/tempos.

| Requisição | Conteúdos | Bytes | Tempo |
| --- | ---: | ---: | ---: |
| Handshake | — | — | 923ms |
| Canais completos | 1.082 | 306.145 | 1.408ms |
| Filmes completos | 17.916 | 5.787.578 | 5.266ms |
| Séries completas | 9.275 | 7.828.646 | 5.959ms |
| Detalhe de uma série | 3 temporadas / 30 episódios | 13.082 | 784ms |

Total do probe14.378ms. Prova capacidade da fonte naquele momento; não prova
tempo da Home, capas, busca ou reprodução do APK novo.

## Implementação local

Primeira importação sem REAL usa diretório somente quando API compatível,
completa e autenticada. As seis listas precedem staging e promoção canônicos.
Tag DIRECTORY_ROOTS_V1 não modifica schema/hash/manifest. IDs de provedor
continuam nesse modo em refresh; legado M3U permanece no fluxo anterior.
Falha de API no diretório estabelecido preserva ativo, sem trocar por IDs
ordinais. Fallback inicial para M3U não certifica90s.

Série escolhida recebe temporadas/episódios/streams completos, com single-flight
e validação. Cache somente em RAM privada: até4 séries,5.000 episódios por série,
8MiB no resolver, TTL10min; excesso é erro e nunca truncamento. ReadModel mantém
até4 séries hidratadas e não modifica snapshot. IDs grandes em string não são
arredondados. Autoridade/fonte/versão/snapshot são rechecados antes/depois dos
dados e em resolução de stream. Falha aparece com retry, nunca série vazia falsa.

Busca local completa mantém filmes/séries e passa canal encontrado ao Live,
com lookup local por ID além do first-fold. Uma passagem por segmentos com
saída antecipada; seleção rejeitada quando snapshot muda ou solicitação cancela.
Back, política de promoção e C9/player consolidados preservados.

Hero e capas visíveis mantêm prioridade e identidade/qualidade existentes.
Após obter primeiro hero válido, demais candidatos usam fila normal para não
competir com capas visíveis; candidatos ausentes continuam retries bounded,
mesmo depois de existir um hero. Imagens ocultas continuam lazy/bounded.

## Validação e correções durante o desenvolvimento

- Lock pré-patch e pós-UI:26 ativação +27 promoção +9 negativos PASS.
- Orquestração nova9 PASS; detalhes12 PASS; busca/Live8 PASS.
- C60 refresh19 PASS; R2F8L staging20 PASS; C104 transporte8 PASS.
- JSON bounded: corrigida classificação do tamanho nativo/web. Teste detectou
  body web não cancelado depois de releaseLock; cleanup/cancel passam a encerrar
  body desbloqueado. Fixture de oversized permanece aberta até cancelamento.
- Novo teste de promoção usava incorretamente stageArtifacts monolítico numa
  saída já segmentada. Corrigido para exercer a promoção segmentada verdadeira;
  não alterou validadores/schema nem criou segunda materialização.
- TypeScript detectou nullable no guard de catálogo; corrigido com condição
  explícita antes de ler extensions. Typecheck posterior PASS.
- Harness legado test-c11-p5b-boot-sync-coordinator falha em T2 NO_OP por fixture
  sem classificationProfileVersion atual. Mesmo resultado com boot carregado
  diretamente de HEAD via loader read-only. Não é regressão C105; harness não
  foi relaxado. Testes atuais C60/lock cobrem idempotência/primeiro boot.

## Medição limpa no Fire — critério90s não cumprido

Primeiro candidato C105 instalado do zero no Fire AFTSS/API28. Package ausente
após uninstall, arquivos anteriores ausentes, sem restauração/injeção. Usuário
escolheu apresentação e ativou legitimamente; espera humana separada.
Cronômetro relevante começa em T8_SOURCE_RESOLUTION_START=249134,8ms:

| Marco físico | Tempo desde T8 |
| --- | ---: |
| Primeiro batch completo | 111,1s |
| Promoção canônica do inventário | 119,4s |
| Busca construída | 134,4s |
| Overlay de preparação encerrado / primeira capa | 141,1s |
| Hero decodificado e8 capas visíveis decodificadas | 144,5s |

Home montada durante preparação não foi confundida com Home utilizável; pequeno
intervalo antes do overlay não certifica sucesso. Usuário relatou mais de dois
minutos e depois confirmou abertura. Raízes completas:17.973 filmes,9.276 séries
e1.082 canais nesse primeiro snapshot; episódios/temporadas zero no snapshot,
resolvidos sob demanda. Refresh posterior apresentou9.277 séries.

Segundo probe da mesma fonte, sem alterar configuração: handshake1,499s,
canais1,709s, filmes9,137s e lista de séries93,898s; detalhe selecionado0,994s,
total107,351s. Fonte variou de14,378s no probe anterior para107,351s. Lista de
séries sozinha excedeu90s. Hash sintético local1MiB: JS179ms/WebCrypto79ms,
resultado idêntico. Evidência aponta demora da resposta da fonte nesta medição;
não estabelece SLA nem justifica relaxar promoção/busca completas.

## Regressões identificadas e corrigidas antes da entrega final

Busca física encontrou filme/série tardios; último canal não aparecia. Builder
indexava somente header100 de Live. Corrigido para ingerir todos os segmentos
Live, guardar geração e rejeitar arquivos ausentes/inválidos; índice de diretório
antigo cuja quantidade não corresponde ao inventário é reconstruído localmente.
Teste completo254 documentos (252 canais), último canal, rebuild de índice
incompleto, falha tardia e troca de snapshot:3 PASS. Após update-r no Fire,
último canal fora do first-fold apareceu e abriu Live no canal correto, com
linha selecionada visível. Detalhe de série tardia carregou episódio sem erro;
isso certifica seleção/hidratação, não frames de reprodução.

Hero e menu: override somente Fire Stick, Home880×495px em viewport960×540;
menu56px em vez de80px, botões de navegação44×48px. Fixture inicial omitia
cabeçalho de Filmes/Séries e passou incorretamente para esse cenário: medição
real encontrou base556,4px fora da viewport540px. Correção reserva64px nessas
duas páginas; fixture agora inclui cabeçalho,12 geometrias PASS. Última regressão
prevalece sobre a validação anterior; geometria física final registrada abaixo.

Indicadores de Home/Filmes/Séries: gap0, pontos6/7px, alvos44px altos. Tablet/TV
inferior direito; celular centralizado, metadados/botões junto ao rodapé dentro
do hero. Timer10s/swipe/ações preservados. Celular USB SM-S926B medido411×807,
hero379,4×569,1px, três páginas com imagem decodificada e controles centralizados
aproximadamente11px acima da borda inferior. Nenhum aumento de hero nesse alvo.

## Validação final de código e artefato

API/importação7, orquestração9, detalhes12, seleção Live8, busca completa3,
prioridade/retry de arte3 PASS. Lock26+27+9 PASS antes de entrega, TypeScript/
Vite, Capacitor sync e assembleDebug PASS; JVM196 testes em33 suites, sem falha.
Regressões C104 transporte8, C60 refresh19, staging20, C9 runtime10, VOD direto12,
R7C13, D-pad/Home, séries/relacionados, artwork/recuperação e landscape PASS.
Swipe/dots e playback direto novamente PASS após última correção CSS.
Harness legado de observabilidade também falha em HEAD; sem relaxação. Scripts
antigos ausentes referenciados em package.json não foram tratados como PASS.

APK local de teste mantém versionCode19/versionName1.0.19. Assets de produção
verificados byte a byte contra dist, mesma assinatura dos APKs anteriores,
HTTPS local, sem dev server/logging. Não publicado no updater; teste ADB-r.
Artefatos C104 e primeiro C105 preservados para recuperação. Sete patches
anteriores protegidos tiveram seus hashes conferidos, sem modificação.

## Instalação final autorizada

Usuário autorizou celular/Fire por USB e tablet por Wi-Fi. Sem novo reset:
instalações-r com assinatura idêntica, UID/data inicial e todos os arquivos
privados de files/shared_prefs comparados em RAM antes/depois. Nenhum conteúdo
ou hash privado exportado. Tablet inicialmente inacessível porque PC/ tablet
estavam em redes diferentes; após usuário conectar Wi-Fi no PC, conexão ADB
funcionou e modelo SM-X610/serial RX2X301Q3KY confirmado. Porta/código de
pareamento transitórios não persistidos no relatório.

`CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C105_IMPLEMENTATION;
NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO`.

## Emenda: coluna Canais contínua e armazenamento local

Pedido recebido durante entrega final remove paginação visual da coluna Canais
em todas as apresentações. Componente reutilizável virtualiza linhas64px,
overscan6, máximo48 linhas no DOM e cache de três lotes48. Uma altura contínua
representa todos os canais da categoria; rolagem/foco lê somente segmentos
locais. Filtro percorre categoria inteira mantendo apenas página de resultados.
Snapshot/abort verificados antes/depois de cada leitura. Falhas de segmento
não viram lista vazia; mensagem com retry. Rolar/trocar grupo não altera player.
Painéis nativos fullscreen/favoritos preservam IPC limitado e paginação C73.

Teste novo5 grupos PASS: ordem/total105 e63 canais, filtro de último canal,
segmento ausente/inválido, cancelamento/troca de geração, janela bounded e
compatibilidade legada. Browser com React real/StrictMode PASS em4 formatos:
último/início, scroll estável, D-pad47↔48, nenhuma seleção durante rolagem,
filtro/seleção do último, posição de busca distante, erro/retry e race entre
categorias. Fixture sintética, zero fonte/backend. Fixture inicial de foco
distante foi corrigida para fornecer a página já resolvida pela busca como
seed, equivalente ao runtime; não mudou requisito nem relaxou assertion.
Busca/seleção anterior8, controles nativos7, classificador quadrado18 PASS.
TypeScript PASS, sem nova dependência. Checklist React: cleanup/abort/StrictMode,
cache bounded, alvos60px, nome acessível, listitem/posinset/setsize, foco após
hidratação, seleção explícita e refs sem mutação de catálogo.

Esclarecimento ao usuário: catálogo/listas/índice persistem no sandbox. Artwork
Android persiste em cache descartável (150MiB/1.000 imagens/TTL30dias), sem
garantia de retenção pelo sistema. Detalhes DIRECTORY_ROOTS de temporadas/
episódios atuais só em RAM (4 séries/8MiB/TTL10min); fechar processo pode exigir
consulta posterior. Vídeo é streaming, não download/cache integral. Nenhum
novo cache persistente de episódios foi prometido ou implementado neste pedido.

QA físico de integração, após testes isolados, detectou scroll rápido voltando
ao topo: última categoria234 canais, scroll esperado14545,5px tornou-se0 ao
chegar seed inicial do pai. Corrigida emissão de comando: seed normal não
reposiciona; busca distante/página nativa explícita reposicionam com grupo atual.
Novo guard testa callback real extraído do componente (incluindo constante48);
browser testa seed tardio após chegar ao último canal. Suite contínua6 grupos
e9 cenários browser PASS. Resultado isolado anterior não certificava integração.
Verificação física posterior é obrigatória antes de declarar rolagem entregue.

## Resultado físico final e entrega

APK final19/1.0.19 local C105,11.434.100bytes,
SHA256ac27afc00b2cae4b871e4774c371d34e072f06a46c11a9a673b15fb921d78f52.
Assets7 byte-idênticos ao dist/assets/index-B-Yoi6h1.js e CSS index-DvnG6llh.css;
mesma assinatura dos anteriores, produção HTTPS/sem dev server/logging.

| Alvo | Canal de instalação | Arquivos privados preservados | Verificação |
| --- | --- | ---: | --- |
| Fire AFTSS G071CQ070344374G | USB | 67 | APK/hash/UID/data/identidade/ativação/fonte/catálogo PASS |
| Celular SM-S926B RXGYB03FL4W | USB | 2.471 | APK/hash/UID/data/identidade/ativação/fonte/catálogo PASS |
| Tablet SM-X610 RX2X301Q3KY | Wi-Fi | 978 | APK/hash/UID/data/identidade/ativação/fonte/catálogo PASS |

Celular desconectou durante refinamento, foi solicitado reconectar e usuário
confirmou conexão; candidato final então instalado-r. Sem uninstall/clear/reset
nessa entrega. Todos abertos normalmente para QA, depois devolvidos à Home.

Rolagem real da categoria com234 canais PASS nos três alvos: último canal,
volta ao início, scroll preservado, DOM<=48, sem botão de página, D-pad47↔48,
preview preservado ao trocar categoria/rolar e filtro de canal além do primeiro
lote (uma correspondência real). Dados de catálogo permaneceram somente no
dispositivo, saída apenas números/booleans. Helper mobile inicial usava seletor
de abas inexistente; corrigido para botões aria-pressed reais, sem mudança no
produto ou relaxação do critério. Listas reais/nomes/URLs não exportados.

Hero Fire final físico: Home880×495, Filmes/Séries880×443,6; três bases dentro
de540px de altura, contain/sem crop, menu56px e pontos6/7px próximos à borda.
Tablet mantido1269,3×714 e menu80, pontos cerca11px acima da borda inferior do
hero e16px da direita. Celular mantido379,4×569,1, pontos centralizados cerca11px
da borda inferior. Validação de tablet é relativa ao hero: cabeçalho de Filmes/
Séries faz exigir scroll para ver rodapé na primeira viewport; altura anterior
preservada conforme pedido de aumento SOMENTE FIRE. Geometria sintética12 PASS.

Busca real tardia de filme/série e seleção de canal, detalhe de episódio PASS;
reprodução de frames de filme/episódio não homologada neste QA. Home90s segue
NÃO CUMPRIDO na primeira instalação medida (144,5s). Nenhum novo reset para
remedir final, nenhuma publicação updater/Git/backend/env/alteração comercial.
Forwards temporários de CDP removidos após verificação; APKs recuperáveis
mantidos em tmp privado. DECISIONS e seis patches protegidos permanecem intactos.

`CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C105_UI_INSTALLED;
PERFORMANCE90=NOT_MET; NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=NAO;
GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO`.
