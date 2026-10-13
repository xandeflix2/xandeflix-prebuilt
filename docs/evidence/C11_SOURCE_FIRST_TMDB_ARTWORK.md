# C11 — Validação de capas da fonte com complemento TMDB

Data: 2026-10-06. Ciclo local autorizado pelo usuário, CURRENT_GATE=NONE,
NEXT_GATE_STARTED=NAO. Especificação anterior ao patch:
[C11_SOURCE_FIRST_TMDB_ARTWORK](../architecture/C11_SOURCE_FIRST_TMDB_ARTWORK.md).
Workspace exclusivo C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Vinte entradas dirty anteriores;
baseline SHA-256 local de 560 arquivos em tmp/c11-tmdb-artwork/baseline.json.

## Resultado funcional

- Cards usam imagem da fonte; ausência ou erro permite pôster TMDB.
- Conforme atualização explícita do usuário, heroes de Home/Filmes/Séries
  e fundos dos detalhes usam exclusivamente o backdrop horizontal TMDB.
  O pôster vertical da fonte não preenche esses espaços nem aparece esticado
  enquanto a consulta está pendente. Ausência/erro de backdrop usa placeholder.
- Sinopse, ano, título original, gêneros e duração ausentes são complementados
  no hero/detalhes. Metadados existentes, identidade, episódios e reprodução
  permanecem derivados do catálogo local. Listagens de Filmes/Séries possuem
  hero derivado dos itens já carregados, com consulta de imagem prioritária.
- Cards/faixas de categorias usam ordem aleatória por visita, estável nos
  renders comuns e sem deslocar a ordem das páginas anteriores ao carregar
  o próximo lote. Categorias Lançamentos, inclusive nomes com prefixo/sufixo
  e sem acentos, preservam exatamente a ordem fornecida pelo gestor da fonte.
  Não se inferiu cronologia por ano TMDB nem se trocou capa entre títulos.
- Após promoção de novo snapshot pela sincronização existente, a Home renova
  o serviço de faixas e remonta categorias; listagens renovam leitura e cache
  por snapshot. Isso elimina faixas antigas persistindo após catálogo novo.
  A renovação acontece após sincronizar a fonte, sem novo polling/importação
  contínua ou varredura extra do catálogo para a aleatoriedade.
- Normalização aceita URLs válidas com vírgula ou barras duplas no caminho.
  Credenciais inline e protocolos inadequados são rejeitados. Uma capa de
  episódio posterior passa a alimentar a série na próxima importação M3U.
- Header M3U retém registro canônico de artes apenas dos 100 filmes e 100
  episódios do first-fold. Registros dos demais segmentos usam suas URLs
  inline; não há coleta global de todas as artes nem novas escritas por item.
- Serviço externo isolado, deduplicação por kind/título/ano ou ID TMDB,
  preferência por ID, rejeição de homônimos/remakes ambíguos. Apenas título
  público limpo, ano e ID TMDB participam das consultas. Não há exportação
  de streams, playlist, credenciais da fonte ou identificadores de dispositivo.
- Máximo 2 consultas simultâneas, 128 pendentes, prioridade hero/detalhes,
  timeout de 8 segundos por request e cooldown de falhas. Cards solicitam
  complemento somente ao entrar na área próxima da tela (250 px).
- Cache local público: 512 entradas, sucesso 30 dias, ausência 24 horas.
  Falha transitória não vira ausência persistida; quota/cache indisponível
  não bloqueia o catálogo. Uma repetição de imagem da fonte e nova tentativa
  após retorno da rede evitam manter um erro transitório indefinidamente.
- Cache persistido contém metadados/URLs públicas TMDB; os bytes das imagens
  usam o cache normal do navegador. Não foi implementado download offline
  permanente das imagens.

## Evidências executadas

| Verificação | Resultado |
| --- | --- |
| Lock de ativação antes do patch, no prebuild e após o build final | PASS, 9 controles negativos, 22 cenários de identidade/boot e 27 de promoção |
| Typecheck e build de produção | PASS; saída web em dist |
| node scripts/test-c11-source-first-tmdb-artwork.mjs | PASS_C11_SOURCE_FIRST_TMDB_ARTWORK |
| URI/source-first/kind/ano/ambiguidade | PASS |
| Categorias aleatórias, Lançamentos e append de próxima página | PASS; não altera catálogo canônico nem relação título/capa |
| Importador real: vírgula, série com capa tardia, selectors e refs | PASS; nenhuma consulta TMDB em importação/seleção |
| Importador real: 260 filmes + 260 episódios com imagens | PASS; registro de artes limitado a 200 |
| Dedup, cache após reinício, TTL, proteção de payload | PASS |
| Concorrência/fila/prioridade, timeout e recuperação | PASS |
| Cooldown de autenticação, cache 512 e falha de storage | PASS |
| Render dos TSX reais: cards/hero/detalhes | PASS; sem avisos React |
| npm run catalog-ui:check | PASS_PREBUILT_G6_CATALOG_UI_CHECK |
| npm run c11:bounded-memory-import:check | PASS: T1–T83, 250.000 registros sintéticos |
| Chave real: filme público 550 e série pública 1399 | Ambos resolvidos; pôster e backdrop de ambos HTTP 200 |
| Navegador: fonte válida, fonte ausente/quebrada, Home/listagens/detalhes | PASS; horizontais TMDB nos heroes, sinopse/ano da fonte preservados |
| Navegador: novo snapshot e novas capas/títulos nas categorias | PASS; novos títulos visíveis, Lançamentos mantém ordem da fonte |
| Navegador: item fora da tela | Sem consulta antes de aproximar; consulta e imagem após scroll |
| Navegador: erro de imagem TMDB e retorno da rede | Placeholder após erro; imagem recuperada após evento online; zero erros de console |
| Provenance de arquivos congelados | PASS; baseline de 560 arquivos, 25 arquivos do ciclo, prefixos dos três documentos dirty preservados; chave ausente do patch |
| git diff --check -- src | PASS com configuração Git original; sem normalização global dos finais de linha |

Smoke real usou somente obras públicas, sem catálogo do usuário. Fixture de
navegador usou componentes/serviço reais, API simulada e imagens públicas reais.
Artefatos locais ignorados em tmp/c11-tmdb-artwork: smoke.json,
browser-cards.png, browser-movie.png, browser-series.png, browser-offscreen.png,
browser-movies-list.png, browser-series-list.png e browser-updated-categories.png.
O agent-browser passou após configurar bypass do proxy somente para localhost;
o navegador integrado estava indisponível. O servidor temporário foi encerrado.

## Limitações e verificações indisponíveis

- r2f8:series-page:check depende de scripts/test-r2f8-series-page-typed-scope.mjs,
  ausente antes do patch e também no HEAD.
- r2f8:catalog-semantics:check depende de scripts/execute-r7c-r6d-tablet-pipeline.ts,
  igualmente ausente antes do patch e no HEAD. Não foram alteradas essas suítes
  para produzir um PASS artificial.
- Build preserva avisos de módulos Node externalizados em provisioning,
  importação estática/dinâmica do Filesystem/LiveCatalog e chunk principal
  acima de 500 kB. Esses módulos não receberam alterações neste ciclo.
- Não houve geração/instalação de APK nem homologação em tablet/Fire TV.
  Build e evidências aqui são locais/web; imagens ainda dependem da rede.
- Sem imagem válida na fonte e sem correspondência segura/imagem no TMDB,
  permanece o placeholder. Nenhuma cobertura universal foi prometida.
- VITE_TMDB_API_KEY é incorporada ao cliente. Uma credencial que deva ser
  mantida secreta requer gateway separado; .env.local e dist permanecem
  ignorados. Nenhum valor de credencial aparece neste relatório ou nos testes.

## Revisão React e escopo

Hooks incondicionais antes dos retornos, dependências primitivas, um serviço
compartilhado por hero/cards/detalhes, limpeza de observers/listeners/timers e
reset de erro por item/URI. Sem novas dependências, alteração do boot, consultas
diretas nos selectors/componentes, mudança de reprodução ou escrita remota.
Nenhum commit/push/PR; projetos histórico e 2.0 não receberam alterações.
