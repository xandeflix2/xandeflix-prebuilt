# C121 — gêneros reais e logos na linha mobile — 2026-10-15

Pedido explícito, com imagens de detalhes phone/tablet: mostrar gêneros em
vez de Geral e colocar logos junto de ano/classificação/duração no celular.
Especificação anterior ao código. Preflight no clone ativo C11-main/main,
origin esperado, HEAD0f68f169f7728fae17c8311832b7643629e97a02, baseline1046
arquivos em tmp/c121-detail-genres-mobile-providers. AGENTS, Architecture,
Execution, Source Boundary, Activation Lock e contratos de detalhes lidos.
Lock inicial26+27+9 PASS. C107–C120 preservados; CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C121; NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset.

## Diagnóstico e comportamento autorizado

- MovieDetailPage/SeriesDetailPage consideram qualquer genreLabels não vazio
  completo; ['Geral'] impede fetch/fallback TMDB e vence até o metadata já
  disponível. As duas páginas devem filtrar rótulo Geral, vazios e duplicatas
  de apresentação. Gênero local real mantém prioridade; ausência solicita o
  enriquecimento público já existente e usa gêneros TMDB do título validado.
  Se não houver dado confiável, omitir gênero. Não inventar nem usar plataforma/
  categoria como gênero. Catálogo/modelo/import/search/credenciais intactos.
- Aplicar no ramo compartilhado dos detalhes de filme/série, corrigindo phone,
  tablet e dobrável sem criar lógica divergente para TV. Home/Hero/rails não
  fazem parte deste patch. Helper visual pequeno, sem mudar serviço/API/cache
  TMDB, limites, matching conservador ou persistência.
- PhoneMovieDetail/PhoneSeriesDetail recebem gêneros filtrados da página e
  deixam de substituir gênero ausente por categoria. Logo não fica mais acima
  do título. Criar linha única com ano, classificação conhecida, duração e
  WatchProviders inline. Quantidade de episódios/classificação ausente e
  gêneros continuam em linhas próprias abaixo, sem perder informações.
- Modo inline opcional no componente de logos, conservando modo padrão do
  tablet/TV abaixo do poster, deduplicação, limites, erros de imagem e serviço
  existentes. Logos24px, sem fundo extra; faixa flexível sem quebra e rolagem
  horizontal local quando várias plataformas não couberem. Preservar todas,
  sem overflow da página. Grupo identificado e acessível por teclado/toque.
- Não mexer em reprodução, trailers, episódios, ações pessoais, foco/retorno,
  menu flutuante C120, shell, barras nativas ou ativação. Ausência de API ou
  imagem não bloqueia Assistir e não gera plataforma/gênero falso.

## Allowlist estrita e aceitação

- Novo src/ui/detail-genres.ts; src/ui/pages/{MovieDetailPage,SeriesDetailPage}.tsx.
- src/ui/components/{PhoneMovieDetail,PhoneSeriesDetail,WatchProviders}.tsx.
- src/index.css somente linha de metadata/logos inline mobile.
- Novo scripts/test-c121-detail-genres.mjs para regressão reproduzida.
- scripts/test-c11-detail-tablet-tv.mjs somente binding do helper novo;
  scripts/test-c11-phone-movie-detail.mjs somente fixture de gênero canônico
  Ação em genreLabels, preservando assertions de layout/ações/idade/duração.
  Antes usava categoria Ação para testar gênero, expectativa removida pelo pedido.
- Este plano, docs/evidence/C11_DETAIL_GENRES_AND_INLINE_PROVIDERS.md;
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
  outputs usuais ignorados e helpers/inspeção privados em tmp do ciclo.

Testes reais das páginas: Geral com demais campos completos solicita metadata,
enriquecimento aparece em ambos os tipos/perfis, real local prevalece, ausência
não exibe Geral/categoria, fonte não é mutada. Inspeção browser dos componentes
phone/WatchProviders com dados públicos controlados: alinhamento ano/idade/
duração/logos, muitas logos roláveis, informações de série preservadas, sem
duplicação no topo, ações e layout tablet inalterados. Regressões detalhes/
providers/phone; revisão React; typecheck/build/lock/sync/Gradle e APK C121
local, sete assets/certificado/C120 preservado. Nenhuma instalação automática
ou certificação física a partir de mocks. APIs/identificação existentes intactas.

## Abrangência adicional solicitada durante execução

Usuário pediu verificar em todos os tipos definidos. Inventário atual tem oito
modelos: PHONE, FOLDABLE, TABLET, FIRE_TV, ANDROID_TV (inclui Google TV),
ANDROID_BOX, TIZEN e WEBOS. Testar a lógica compartilhada de gêneros nas duas
páginas em todos os modelos. Sem aparelhos desses oito modelos conectados,
testes locais não certificam runtime nativo Samsung/LG nem hardware físico.
Foi solicitada preferência sobre mover também logos de tablet/TV para a linha;
enquanto não houver resposta, preservar pedido original: inline somente mobile,
demais perfis conservam logos abaixo do poster. Gêneros corrigidos em todos.

Usuário respondeu explicitamente: manter logos abaixo da capa em tablet/TV;
linha somente no celular. Preferência confirmada, sem ampliar essa mudança
visual aos demais perfis. Matriz de oito modelos permanece para os gêneros.
