# docs/CATALOG_UI.md — Documento Canônico da Interface de Catálogo (G6)

> **Status**: Vigente (Gate G6 — `XANDEFLIX_PREBUILT_G6_CATALOG_UI`)  
> **Data de Estabelecimento**: 2026-09-05  
> **Branch**: `main`  
> **Repositório**: `xandeflix2/xandeflix-prebuilt`  
> **Package**: `com.xandeflix.prebuilt`

---

## 1. Objetivo

Estabelecer a primeira interface de usuário (UI) funcional e responsiva do `XANDEFLIX_PREBUILT`, responsável por apresentar o catálogo de entretenimento diretamente ao usuário final em ambientes Web, Mobile (Phone/Tablet) e Android TV / Fire TV Stick, consumindo **exclusivamente** o catálogo local ativo persistido no dispositivo.

---

## 2. Escopo

O escopo do Gate G6 compreende:
- Apresentação completa das visualizações principais: **Home**, **Movies (Filmes)**, **Series (Séries)**, **Movie Detail (Detalhe de Filme)** e **Series Detail com Seasons/Episodes (Detalhe de Série com Temporadas e Episódios)**;
- Integração estrita com o `BootstrapService` e `LocalCatalogStorage` provenientes do Gate G5;
- Transformação do catálogo bruto persistido em um Read Model/View Model determinístico e sanitizado em memória;
- Gating visual estrito de estados de inicialização (`NO_ACTIVE_CATALOG`, `IMPORT_IN_PROGRESS`, `ACTIVE_CATALOG_READY`, `IMPORT_FAILED_ACTIVE_PRESERVED`);
- Proteção absoluta contra falso-vazio (`NO_FALSE_EMPTY_UI_GUARD`);
- Navegação direcional baseline por teclado / D-pad de TV (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Back/Escape`);
- Preservação de usabilidade plena para Touch (Phone/Tablet) e Mouse (Desktop);
- Limites explícitos de renderização no DOM para mitigação de footprint de memória e renderização não-limitada (`UNBOUNDED_DOM_RENDER=PROHIBITED`).

---

## 3. Fonte de Dados (CATALOG_UI_DATA_SOURCE)

A interface consome rigorosamente:

```text
CATALOG_UI_DATA_SOURCE = ACTIVE_LOCAL_CATALOG_ONLY
CATALOG_NETWORK_REQUESTS = 0
```

- **Proibição Absoluta**: Nenhuma chamada a fontes externas, APIs REST, endpoints Xtream, listas M3U, backend Supabase ou downloads remotos em tempo de execução da UI;
- O único fluxo autorizado de acesso aos dados é:
  $$\text{UI Component} \longrightarrow \text{useActiveCatalog / Read Model} \longrightarrow \text{BootstrapService} \longrightarrow \text{LocalCatalogStorage}$$
- O acesso direto da UI ao sistema de arquivos (`@capacitor/filesystem`) é expressamente proibido.

---

## 4. Read Model e View Model (`src/catalog/`)

Para evitar que componentes React percorram coleções volumosas ou executem buscas de integridade arbitrárias, foi estabelecida uma camada de projeção em memória:

1. **`CatalogReadModel` (`src/catalog/catalog-read-model.ts`)**:
   - Constrói índices efêmeros em memória (`Map<string, T>`) para acesso $O(1)$ por ID: `categoryById`, `genreById`, `artworkById`, `moviesById`, `seriesById`, `seasonsById`, `episodesById`;
   - Agrupa relações: `seasonsBySeriesId` (ordenado por `seasonNumber`), `episodesBySeasonId` (ordenado por `episodeNumber`), `itemsByCategoryId`, `itemsByGenreId`;
   - Formata de forma segura metadados opcionais (`yearFormatted`, `durationFormatted`) e resolve referências de arte (`posterUri`, `backdropUri`).
2. **`CatalogViewModel` (`src/catalog/catalog-view-model.ts`)**:
   - Define os tipos imutáveis sanitizados consumidos pela UI: `CatalogItemViewModel`, `MovieDetailViewModel`, `SeriesDetailViewModel`, `SeasonViewModel`, `EpisodeViewModel`, `HomeRailViewModel`;
   - Estabelece as constantes de limite: `HOME_RAIL_MAX_ITEMS_INITIAL = 24`, `GRID_BATCH_SIZE = 48`.
3. **`CatalogSelectors` (`src/catalog/catalog-selectors.ts`)**:
   - Fornece seletores puros para extração de dados: `getHeroItem`, `getHomeRails`, `getAllMovies`, `getAllSeries`, `getMovieDetail`, `getSeriesDetail`.

---

## 5. Estados de Bootstrap e Gating Visual

A UI reflete com fidelidade os estados emitidos pelo `BootstrapService`:

| Estado do Bootstrap | Comportamento da UI | Mensagem / Apresentação |
| :--- | :--- | :--- |
| `NO_ACTIVE_CATALOG` | Renderiza `NoActiveCatalogState` | *"Catálogo ainda não disponível neste dispositivo. Aguardando provisionamento de pacote local."* |
| `IMPORT_IN_PROGRESS` | Renderiza `LoadingState` com spinner | *"Carregando e indexando catálogo local..."* |
| `ACTIVE_CATALOG_READY` | Renderiza a visualização requisitada | Catálogo normal carregado a partir do snapshot ativo |
| `IMPORT_FAILED_ACTIVE_PRESERVED` | Mantém UI ativa com catálogo anterior | Apresenta banner de aviso superior não-bloqueador informando falha de atualização |

---

## 6. Proteção contra Falso-Vazio (`NO_FALSE_EMPTY_UI_GUARD`)

- **Regra**: A ausência de catálogo ativo (`NO_ACTIVE_CATALOG`) **NUNCA** pode ser apresentada como catálogo vazio legítimo ou mensagem de *"Nenhum título encontrado"*;
- O estado de catálogo vazio (`VALID_EMPTY_CATALOG`) só é renderizado quando:
  1. Existe ponteiro ativo válido (`hasActiveCatalog = true`);
  2. O snapshot foi validado e promovido com sucesso;
  3. A contagem real de filmes e séries for comprovadamente zero (`movies.length === 0 && series.length === 0`).

---

## 7. AppShell e Layout Visual

O componente `AppShell` (`src/ui/components/AppShell.tsx`) unifica a experiência:
- **Header superior**: Logotipo com identidade visual do Xandeflix Prebuilt, menu de navegação primário (`Início`, `Filmes`, `Séries`), indicador do snapshot ativo e botão "Voltar" quando fora da raiz;
- **Banner de Alerta de Importação**: Notificação discreta quando ocorre `IMPORT_FAILED_ACTIVE_PRESERVED`;
- **Container Principal**: Área de conteúdo com suporte a rolagem suave e padding adaptativo por dispositivo;
- **Footer**: Identificador de versão e confirmação de isolamento offline local.

---

## 8. Página Inicial (Home)

A visualização `HomePage` (`src/ui/pages/HomePage.tsx`) orquestra:
1. **Hero**: Item de destaque cinematográfico selecionado deterministicamente a partir do primeiro título disponível;
2. **Faixas Temáticas (MediaRails)**:
   - Faixa de Filmes em Destaque;
   - Faixa de Séries em Destaque;
   - Faixas automáticas derivadas das categorias declaradas no catálogo local (`itemsByCategoryId`);
   - Faixas automáticas derivadas dos gêneros declarados (`itemsByGenreId`);
   - Respeito estrito ao limite de `HOME_RAIL_MAX_ITEMS_INITIAL = 24` itens por faixa.

---

## 9. Página de Filmes (Movies)

A visualização `MoviesPage` (`src/ui/pages/MoviesPage.tsx`):
- Apresenta cabeçalho temático com contagem real de títulos disponíveis;
- Barra horizontal de filtros por categoria declarada no catálogo;
- Grade responsiva (`CatalogGrid`) renderizando cards em lotes de 48 itens (`GRID_BATCH_SIZE`);
- Botão "Carregar Mais" controlado, permitindo paginação progressiva sem saturação do DOM.

---

## 10. Página de Séries (Series)

A visualização `SeriesPage` (`src/ui/pages/SeriesPage.tsx`):
- Apresenta o catálogo completo de séries locais;
- Filtro rápido por categoria de série;
- Grade responsiva com badge de contagem de temporadas em cada card;
- Navegação direta ao clicar/pressionar Enter para a página de detalhes da série.

---

## 11. Detalhe de Filme (Movie Detail)

A visualização `MovieDetailPage` (`src/ui/pages/MovieDetailPage.tsx`):
- Backdrop cinematográfico em tela cheia com gradiente de leitura escuro;
- Metadados completos: título, título original, ano de lançamento, duração formatada e lista de badges de gênero;
- Sinopse completa com fallback para ausência de descrição;
- Botão de Ação "Assistir": **Desabilitado** com badge explícito `PLAYBACK_AVAILABLE_IN_G8`. Nenhum resolver de stream ou player de vídeo é inicializado.

---

## 12. Detalhe de Série (Series Detail)

A visualização `SeriesDetailPage` (`src/ui/pages/SeriesDetailPage.tsx`):
- Backdrop e metadados agregados da série (ano, quantidade de temporadas, gêneros);
- Sinopse da série;
- Abas de seleção de temporada (`SeasonSelector`) com badges de contagem de episódios;
- Lista de episódios da temporada selecionada.

---

## 13. Temporadas e Episódios (Seasons / Episodes)

- Cada temporada exibe seus episódios ordenados monotonicamente por `episodeNumber`;
- Cada card de episódio apresenta:
  - Número e título do episódio;
  - Thumbnail local/remota com fallback visual;
  - Duração em minutos formatada;
  - Sinopse do episódio;
  - Botão de reprodução desabilitado com estado explícito `PLAYBACK_AVAILABLE_IN_G8`.

---

## 14. Fallback de Artwork

- Quando a URI de arte (`posterUri`, `backdropUri`) não existir, estiver vazia ou falhar no carregamento pelo navegador:
  - O componente `Artwork` (`src/ui/components/Artwork.tsx`) renderiza um placeholder visual estético com gradiente radial em tons escuros e ícone representativo em SVG;
  - A ausência de arte não bloqueia a validação nem quebra o layout.

---

## 15. Responsividade (Phone, Tablet, TV Landscape)

O design system modular em `src/index.css` suporta três perfis de dispositivo:
1. **Phone (`max-width: 600px`)**:
   - Header compacto com itens em linha única ou rolagem horizontal;
   - Grade de mídia em 2 colunas;
   - Cards com tipografia condensada e proporção 2:3 vertical;
2. **Tablet (`601px - 1024px`)**:
   - Grade de mídia em 3 a 4 colunas;
   - Maior densidade de metadados visíveis nos cards;
3. **TV Landscape / Desktop (`min-width: 1025px`)**:
   - Grade em 5 a 6 colunas;
   - Espaçamento generoso entre trilhas;
   - Tipografia de alto contraste legível a 3 metros de distância.

---

## 16. Baseline de Navegação TV / D-Pad (`useDpadNavigation`)

O hook `useDpadNavigation` (`src/ui/hooks/useDpadNavigation.ts`) provê suporte nativo a controle remoto / teclado:
- **Teclas Suportadas**: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Escape` e `Backspace`;
- **Foco Visível (`FOCUS_VISIBLE=SIM`)**: Borda destacada em anel ciano/rubi com escala suave de 4% (`scale(1.04)`) e glow luminoso;
- **Aquisição Inicial de Foco (`FIRST_FOCUS_ACQUIRED=PASS`)**: O primeiro item focável da página recebe foco automático;
- **Retorno por Tecla Back (`BACK_RETURNS_PREVIOUS_VIEW=SIM`)**: Pressionar `Escape` ou `Backspace` navega retroativamente na pilha de histórico sem fechar o app.

---

## 17. Modos de Entrada (INPUT_MODES)

```text
INPUT_MODES = TOUCH_MOUSE_KEYBOARD_DPAD_BASELINE
```

A navegação direcional por D-pad foi implementada sobre a semântica nativa de foco DOM (`tabindex`, `focus()`, `:focus-visible`), garantindo que eventos de toque (touch) e clique (mouse) continuem funcionando de maneira natural e sem conflitos.

---

## 18. Limites de Renderização no DOM

Para evitar degradação de memória em dispositivos de baixa potência (ex.: Fire TV Stick Lite com 1GB RAM):
- **`HOME_RAIL_MAX_ITEMS_INITIAL = 24`**: Cada trilha na Home apresenta no máximo 24 itens;
- **`GRID_BATCH_SIZE = 48`**: As páginas de grade exibem 48 itens inicialmente e adicionam novos lotes via "Carregar Mais";
- **`UNBOUNDED_DOM_RENDER = PROHIBITED`**: É expressamente proibido fazer `movies.map()` de coleções completas sem delimitação.

---

## 19. Performance da UI

- Todas as buscas de relações por ID ocorrem em $O(1)$ utilizando índices efêmeros construídos uma única vez na inicialização do `CatalogReadModel`;
- Não ocorrem re-renderizações desnecessárias da árvore de componentes, pois o estado de navegação é mantido em estado local desacoplado;
- Os bundles web gerados pelo Vite apresentam peso mínimo (bundle principal de ~450 kB sem dependências externas de terceiros).

---

## 20. Segurança

- **Zero Credenciais**: Nenhuma chave privada, token de longa duração, credencial de fonte ou service role trafega em componentes, hooks, rotas ou estilos;
- **Zero Vazamento de Metadados**: Formatação defensiva garante que campos nulos ou ausentes resultem em fallbacks estéticos limpos, sem exibição literal de `undefined`, `null` ou `NaN`.

---

## 21. Ausência de Rede no Catálogo

- Auditoria estrita em código-fonte comprovou ausência de chamadas a `fetch()`, `axios`, `createClient`, `supabase` ou URLs HTTP nos componentes de catálogo;
- A UI opera de forma 100% autônoma e offline.

---

## 22. Relação G5 → G6 → G7

- **G5 (Fast Device Bootstrap)**: Persistiu o pacote localmente, estabeleceu o ponteiro ativo atômico e protegeu o dispositivo contra falhas de geração;
- **G6 (Catalog UI)**: Consome a geração ativa do G5 e oferece visualizações completas de catálogo (Home, Filmes, Séries, Detalhes) com suporte a D-pad;
- **G7 (Prebuilt Search)**: Construirá o mecanismo de busca local sobre o catálogo ativo sem dependência de rede.

---

## 23. Itens Fora de Escopo (OUT_OF_SCOPE)

- Sistema de busca / SearchIndex (G7);
- Player de vídeo / resolução de streams (G8);
- Live TV (fora do contrato v1);
- Download remoto de pacotes ou ingestão online (fora do runtime cliente);
- Atualização incremental delta (G9+);
- Autenticação de usuário e assinaturas de DRM.

---

## 24. Decisões Arquiteturais Fechadas e Abertas

### Fechadas em G6
- `CATALOG_UI_DATA_SOURCE = ACTIVE_LOCAL_CATALOG_ONLY`
- `CATALOG_UI_NETWORK = NONE`
- `NO_FALSE_EMPTY_UI = REQUIRED`
- `CATALOG_READ_MODEL = EPHEMERAL_VIEW_MODEL`
- `UNBOUNDED_DOM_RENDER = PROHIBITED`
- `TV_INPUT_BASELINE = DOM_FOCUS_DPAD`
- `INPUT_MODES = TOUCH_MOUSE_KEYBOARD_DPAD_BASELINE`

### Mantidas em Aberto para Gates Posteriores
- `SEARCH_UI` (G7)
- `SEARCH_STORAGE` (G7)
- `SEARCH_INDEX_TRANSPORTABILITY` (G7)
- `PLAYBACK_UI` (G8)
- `ARTWORK_CACHE_POLICY` (G8+)
- `FULL_TV_SPATIAL_NAVIGATION` (G11)
- `PERFORMANCE_SLA` (G11)

---

## 25. Critérios de Aceitação

1. [x] Renderização determinística de Home a partir do catálogo local ativo;
2. [x] Renderização de página de Filmes com filtros de categoria e grid paginado;
3. [x] Renderização de página de Séries com lista e detalhe;
4. [x] Detalhe de filme com metadados completos e botão de playback desabilitado para G8;
5. [x] Detalhe de série com seleção de temporadas e listagem de episódios;
6. [x] Estado explícito para `NO_ACTIVE_CATALOG`;
7. [x] Estado explícito para `VALID_EMPTY_CATALOG`;
8. [x] Prova de não-ocorrência de falso-vazio (`NO_FALSE_EMPTY`);
9. [x] Continuidade de exibição do catálogo ativo em caso de falha de importação;
10. [x] Fallback visual seguro para artes e metadados ausentes;
11. [x] Limites de renderização DOM confirmados;
12. [x] Baseline D-pad com anel de foco visível e retorno retroativo via Back;
13. [x] Zero chamadas de rede no carregamento da interface.
