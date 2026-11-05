# CANON-01-DPAD-CARD-SCOPE-SEEALL-GRID-01 — especificação anterior ao código — 2026-10-25

Solicitação anexada autoriza a correção local nominal de elegibilidade de capas e grade Ver todos. Root/L1 e estágios encerrados congelados por SHA256; clone independente origin canônico, branch fix/source-output-format-recovery e HEAD d8a7410, baseline b3fc8d1 preservados. Base operacional recebida35 recibos/917 protegidos/188 controles31 suítes. Sem APK/build Android/instalação/Git publicação/backend.

Causa por leitura: controlador aceita .catalog-grid sob .movies-page/.series-page; herda expansão indevida. Definir opt-in category em MediaRail, propagado somente AsyncCategoryRail de Home/Filmes/Séries. Favoritos/recentes/destaques pessoais e grids sem opt-in ficam fora. O controlador exige track marcada + contexto principal; não instala observadores/listeners em rota não elegível, observa somente main elegível e limpa seleção/mídia/attrs ao sair. Guarda assíncrona de prévia revalida elegibilidade. CSS de expansão somente track opt-in. Preservar geometria/âncora/timers3s/media e player existentes nas faixas permitidas.

Ver todos real usa CatalogBrowsePage category-collection-page e CatalogGrid. Preservar hero/touch/reader local, 48 iniciais/cursor48/dedup existentes. Opt-in windowed apenas nas coleções de categorias, sem alterar demais grades. Grade responsiva usa largura útil em TV, colunas medidas CSS, poster vertical, destaque sem reorganização. Janela de linhas com overscan3 por lado, spacers e retenção da linha focada; nunca montar todos os milhares de itens. Navegação local por índice lógico, horizontais não atravessam linha, verticais mantêm coluna ou último disponível. Foco novo somente após commit e scroll nearest automático; manter acesso a Back/hero/menu em bordas. Prefetch nas2 últimas linhas, dedup de job e retry explícito. Scroll/toque atualiza janela por rAF/passive. Lotes novos preservam ordem dos IDs vistos e foco. Retorno de detalhes guarda índice lógico além da contagem legada; materializa somente janela desse índice e usa coordenadas RAM anteriores. Sem persistência nova/consulta externa/mudança de fonte.

Baseline obrigatório fresh CANON/check/test/C11 antes de patch. Teste novo de geometria/janelas/navegação e browser com componentes reais, mocks somente fronteiras externas:3 contextos permitidos, grids/Search/pessoais negados, saída cancela timer/player, responsividade960/1280/1920/phone/tablet, grade pequena/extensa/prefetch/dedup/retorno/foco. Preservar188 controles31 suítes e testes anteriores sem relaxar assertions. Final CANON/check/test/C11/typecheck/playback/build e teste focado. Hardware com novo binário e10min Fire pendentes sem autorização de instalação. Não declarar60 FPS ou piscada resolvida. Plano de performance recebe esta correção limitada, P1–P4 amplos apenas propostos.

Allowlist fechada 22 caminhos (grants somente subset alterado):
- src/ui/expanded-card-controller.ts
- src/ui/components/CardExpansion.tsx
- src/ui/components/CardExpansion.css
- src/ui/components/MediaRail.tsx
- src/ui/components/AsyncCategoryRail.tsx
- src/ui/components/ProgressiveCategoryRail.tsx
- src/ui/pages/HomePage.tsx
- src/ui/pages/CatalogBrowsePage.tsx
- src/ui/components/CatalogGrid.tsx
- src/ui/components/VirtualCatalogGrid.tsx
- src/ui/catalog-grid-window.ts
- src/ui/hooks/useCatalogReturnNavigation.ts
- src/index.css
- scripts/test-dpad-card-scope-seeall-grid.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/DPAD_CARD_SCOPE_SEEALL_GRID_01.md
- docs/evidence/DPAD_CARD_SCOPE_SEEALL_GRID_01.md
- docs/governance/authorizations/CANON-01-DPAD-CARD-SCOPE-SEEALL-GRID-01.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Auth SHA256 UTF8/LF 9c9ea4a2c750c1f3e6559e47a8ee8ba3c7b38854dc2f0bc0f76616fbbd1a9d9d. Recibo36 a registrar com before/after/predecessores reais;35 anteriores imutáveis. Quatro documentos normativos somente append. Sem verifier/workflow/package/lock/dependências/native/storage/source/import/auth/parental/playback/ativação/Supabase ou versão. Rollback local: base recebida congelada, descartar candidato por decisão explícita sem normalizar root; nenhum aparelho alterado. NEXT_GATE_STARTED=NAO.

## Autorização normalizada

```text
# XANDEFLIX — CORREÇÃO DE ESCOPO DAS CAPAS EXPANSÍVEIS E LAYOUT DE VER TODOS

**GATE:** DPAD-CARD-SCOPE-SEEALL-GRID-01  
**PRIORIDADE:** ALTA  
**TIPO:** Correção funcional, visual e de navegação  
**PLATAFORMAS:** Fire Stick, Android TV e demais dispositivos suportados  
**CONTEXTO:** Complemento ao ciclo de recuperação de desempenho do Xandeflix

## 1. PROBLEMA IDENTIFICADO

A implementação recente de expansão horizontal das capas está sendo aplicada indevidamente à página **Ver Todos**.

Atualmente, ao acessar uma categoria por meio do botão Ver Todos e navegar pelas capas com o D-pad, o sistema também transforma o cartão selecionado em uma apresentação horizontal expandida.

Esse comportamento não é desejado nessa página.

A expansão horizontal deve ser um recurso exclusivo dos carrosséis das páginas principais, e não um comportamento global aplicado a qualquer componente de capa do aplicativo.

Também é necessário corrigir o layout de Ver Todos para utilizar melhor o espaço da televisão, permitindo navegação vertical por toda a grade.

## 2. DEFINIÇÃO DO ESCOPO CORRETO

### Locais onde a expansão horizontal É PERMITIDA

- Carrosséis de categorias da Home.
- Carrosséis de categorias da página Filmes.
- Carrosséis de categorias da página Séries.

Nessas três páginas, preservar o comportamento já especificado:

- Capas aumentadas no modo D-pad.
- Expansão horizontal da capa selecionada.
- Imagem backdrop do conteúdo.
- Pré-visualização automática após o tempo configurado, quando disponível.
- Carrossel horizontal com posição de foco fixa.

### Locais onde a expansão horizontal NÃO DEVE acontecer

- Página Ver Todos de qualquer categoria.
- Resultados de busca.
- Grades de conteúdo fora dos carrosséis autorizados.
- Favoritos e listas pessoais, caso existam.
- Outras páginas de navegação que não pertençam explicitamente ao escopo autorizado.

Nesses locais, restaurar e preservar o comportamento tradicional dos cartões.

Não expandir a capa para o formato horizontal ao receber foco e não iniciar o trailer automático associado à expansão.

## 3. CORREÇÃO DA PÁGINA VER TODOS

### 3.1. Apresentação das capas

Ao acessar Ver Todos:

1. Apresentar os conteúdos em formato de grade.
2. Manter as capas no formato vertical tradicional.
3. Não substituir a capa por uma imagem horizontal ao receber foco.
4. Preservar um indicador visual claro do cartão selecionado.
5. Permitir a seleção por Enter / OK para abrir os detalhes do conteúdo.
6. Não executar prévias automáticas nessa grade.
7. Não modificar o comportamento de reprodução do player principal.

O cartão selecionado poderá manter o destaque visual tradicional do projeto, desde que isso não provoque expansão horizontal ou reorganização desnecessária da grade.

### 3.2. Aproveitamento de toda a largura da tela

A página Ver Todos deverá ocupar toda a largura útil disponível.

Corrigir o layout para eliminar:

- Grandes margens vazias à esquerda e à direita.
- Containers com largura máxima excessivamente restrita.
- Espaçamentos laterais incompatíveis com a interface de TV.
- Alinhamentos que concentrem as capas no centro, deixando áreas laterais desperdiçadas.

Utilizar uma grade responsiva, distribuindo as capas por toda a largura útil da interface.

Preservar somente as margens mínimas necessárias para foco, legibilidade e segurança de exibição em televisores.

As capas não deverão ficar cortadas nas extremidades.

A quantidade de colunas deverá ser adaptada conforme o tamanho da tela, a proporção das capas e o modo de entrada.

Não definir arbitrariamente uma quantidade fixa de colunas para todos os dispositivos.

### 3.3. Scroll vertical obrigatório

A navegação principal da página Ver Todos deverá ser vertical, utilizando a grade de conteúdos.

Comportamento esperado:

- Direita: mover o foco para a próxima capa da mesma linha.
- Esquerda: mover o foco para a capa anterior da mesma linha.
- Baixo: avançar para a próxima linha da grade.
- Cima: retornar à linha anterior.
- Enter / OK: abrir os detalhes do conteúdo.
- Back: retornar à página anterior.

Quando o usuário navegar para uma linha que esteja fora da área visível, a página deverá realizar automaticamente o scroll vertical necessário para manter o cartão selecionado visível.

O scroll deverá ser suave, mas não poderá provocar atrasos ou bloqueios no D-pad.

Garantir também compatibilidade com rolagem por toque, mouse ou outros mecanismos existentes.

### 3.4. Carregamento sob demanda

A página Ver Todos deverá permitir acesso a todos os títulos disponíveis na categoria, sem impor um limite artificial de navegação.

Entretanto, não deverá carregar e renderizar todos os conteúdos simultaneamente.

Preservar ou implementar, conforme a arquitetura existente:

- Carregamento inicial limitado.
- Paginação incremental.
- Pré-carregamento próximo ao final dos itens disponíveis.
- Virtualização da grade quando necessária.
- Cache e deduplicação de consultas.
- Manutenção da posição do scroll.
- Preservação do foco ao carregar novos títulos.

Priorizar desempenho e estabilidade em dispositivos Fire Stick.

## 4. CORREÇÃO DO COMPONENTE DE EXPANSÃO

Auditar o mecanismo atual responsável por identificar os cartões elegíveis à expansão horizontal.

Investigar se o recurso está sendo aplicado globalmente por:

- Seletores de classe CSS.
- Listeners globais de foco.
- Observadores de mutação.
- Componentes compartilhados.
- Identificação genérica de cartões.
- Ausência de verificação da rota ou do contexto visual.

Implementar um mecanismo explícito de elegibilidade para expansão horizontal.

Apenas componentes pertencentes aos carrosséis autorizados das páginas Home, Filmes e Séries poderão ativar o recurso.

Não utilizar exclusivamente a classe genérica de uma capa para identificar elegibilidade.

Preferir um controle declarativo ou um marcador de contexto claramente associado ao carrossel autorizado, reutilizando a arquitetura existente.

Ao sair de um carrossel autorizado ou entrar na página Ver Todos, assegurar o cancelamento dos temporizadores de prévia, a remoção do estado de expansão e a limpeza dos recursos relacionados.

Essa correção também deverá reduzir o trabalho desnecessário de observadores e handlers globais fora das telas elegíveis.

## 5. PRESERVAÇÃO DA EXPERIÊNCIA

Não alterar desnecessariamente:

- Layout dos carrosséis da Home.
- Carrosséis da página Filmes.
- Carrosséis da página Séries.
- Sistema de foco fixo dos carrosséis horizontais.
- Paginação do catálogo.
- Metadados de filmes e séries.
- Reprodução de TV ao vivo.
- Player principal.
- Identidade visual do Xandeflix.
- Layout já aprovado de dispositivos touchscreen.

Nos dispositivos touchscreen, preservar a experiência existente de grade, toque e rolagem.

## 6. TESTES OBRIGATÓRIOS

| Cenário | Resultado esperado |
|---|---|
| Home — selecionar capa no carrossel | Expansão horizontal permitida |
| Filmes — selecionar capa no carrossel | Expansão horizontal permitida |
| Séries — selecionar capa no carrossel | Expansão horizontal permitida |
| Home — abrir Ver Todos | Grade vertical tradicional |
| Ver Todos — selecionar capa | Capa permanece vertical |
| Ver Todos — pressionar Baixo | Navega para a próxima linha |
| Ver Todos — pressionar Direita | Navega entre capas da mesma linha |
| Ver Todos — avançar várias linhas | Scroll vertical acompanha o foco |
| Ver Todos — pressionar Enter | Abre detalhes do título correto |
| Ver Todos — carregar mais conteúdos | Mantém foco, ordem e scroll |
| Ver Todos — voltar para a Home | Restaura navegação sem estados residuais |
| Busca e demais grades | Não ativam expansão indevida |
| Fire Stick — navegação prolongada | Sem travamentos ou degradação progressiva |

Realizar verificações com grade pequena, grade extensa, carregamento incremental e retorno da página de detalhes.

## 7. RELAÇÃO COM A AUDITORIA DE DESEMPENHO

Esta correção deverá ser considerada no planejamento da recuperação de performance já auditada.

A aplicação indevida do sistema de expansão em Ver Todos poderá gerar trabalho desnecessário de renderização, observadores e manipulação de foco.

Avaliar esse impacto sem assumir que ele seja a causa principal da lentidão já diagnosticada no Fire Stick.

A correção não deverá introduzir novos gargalos nem prejudicar as melhorias de performance previstas.

## 8. EXECUÇÃO E GOVERNANÇA

O agente deverá:

1. Examinar a implementação atual.
2. Identificar o ponto de aplicação indevida da expansão.
3. Definir os arquivos estritamente necessários à correção.
4. Verificar os limites de alteração e a governança CANON/C11 aplicável.
5. Preparar a especificação técnica e os testes.
6. Executar as alterações locais somente dentro do escopo previamente autorizado.
7. Realizar validações automatizadas e documentar as validações físicas pendentes.
8. Apresentar relatório com resultados, riscos e procedimento de reversão.

Não alterar arquivos protegidos sem a autorização correspondente.

Não realizar commit, push, merge, instalação de APK ou deploy sem autorização expressa.

## 9. RESULTADO FINAL ESPERADO

O Xandeflix deverá apresentar dois comportamentos distintos:

**MODO CARROSSEL — HOME / FILMES / SÉRIES**

Navegação horizontal com foco fixo, capas expandidas e prévias automáticas compatíveis.

**MODO GRADE — VER TODOS**

Capas verticais tradicionais, distribuição em toda a largura útil da página, scroll vertical, navegação D-pad e carregamento progressivo.

**ORDEM FINAL AO CODEX:**

Analise e corrija o escopo da expansão horizontal para impedir sua execução em Ver Todos e demais grades não autorizadas. Ajuste o layout de Ver Todos para utilizar toda a largura útil da tela e oferecer navegação vertical eficiente, preservando as funcionalidades existentes.

Integre essa demanda ao plano de recuperação de desempenho, mantendo as restrições de alteração e publicação estabelecidas.
```


## Refinamento antes do patch

Baseline fresh3/3 exit0:188 controles/31 suítes,35 recibos/917 protegidos. Para não manter observer global em grids, mover CardExpansionHost do AppShell para o ciclo de vida explícito de Home e overview de CatalogBrowsePage. Novo caminho nominal AppShell.tsx, remoção somente de import/host antigo. CatalogGrid tradicional permanece intacto funcionalmente; exportar seu tipo de props e usar VirtualCatalogGrid somente na coleção real. Port de teste-c11-category-rails.mjs apenas adiciona bindings do novo componente/host mantendo todas as assertions e cenários. Allowlist fechada revisada 24:
- src/ui/expanded-card-controller.ts
- src/ui/components/CardExpansion.tsx
- src/ui/components/CardExpansion.css
- src/ui/components/MediaRail.tsx
- src/ui/components/AsyncCategoryRail.tsx
- src/ui/components/ProgressiveCategoryRail.tsx
- src/ui/pages/HomePage.tsx
- src/ui/pages/CatalogBrowsePage.tsx
- src/ui/components/CatalogGrid.tsx
- src/ui/components/VirtualCatalogGrid.tsx
- src/ui/catalog-grid-window.ts
- src/ui/hooks/useCatalogReturnNavigation.ts
- src/index.css
- src/ui/components/AppShell.tsx
- scripts/test-c11-category-rails.mjs
- scripts/test-dpad-card-scope-seeall-grid.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/DPAD_CARD_SCOPE_SEEALL_GRID_01.md
- docs/evidence/DPAD_CARD_SCOPE_SEEALL_GRID_01.md
- docs/governance/authorizations/CANON-01-DPAD-CARD-SCOPE-SEEALL-GRID-01.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Port dos adaptadores de teste antes da edição

Inspeção dos loaders TSX encontrou cinco adaptadores adicionais que isolam imports de Home/CatalogBrowsePage. Incluir somente bindings do CardExpansionHost (não executado por essas fixtures de página), VirtualCatalogGrid e categoryGridSeed real; preservar todas as assertions/casos e usar browser novo para a execução efetiva dos componentes. Sem relaxar timeout/assertion. Isso é atualização de fronteira de teste, não novo escopo funcional. Arquivos adicionais:
- scripts/test-c11-browse-featured-order.mjs
- scripts/test-c11-home-special-collections.mjs
- scripts/test-c11-home-release-notice.mjs
- scripts/test-c11-series-episode-updates.mjs
- scripts/test-c11-source-first-tmdb-artwork.mjs
Allowlist revisada 29; antes de editar os ports. O host fica no ciclo de vida da página autorizada e deixa de existir em grids. Seed determinístico da coleção, derivado somente de snapshot/kind/category locais, conserva a ordem no retorno sem storage novo.


## Diagnóstico dos ports auxiliares

Comparação isolada da versão recebida e candidata confirmou duas fixtures antigas já falhando antes deste patch: browse-featured-order e series-episode-updates não vinculavam content-adult-policy.ts. PORT_DIAGNOSTIC.json registra exit1 em ambas versões; os outros três ports passaram0/0. Correção somente desses dois adaptadores já na allowlist: importar módulo real de política, sem stub permissivo nem alterar uma assertion. Não há falha no baseline oficial3/3, nem mudança da política parental real. Browser novo20 cenários PASS, incluindo2mil títulos e retorno lógico.


## CANON-01-DPAD-CARD-SCOPE-SEEALL-GRID-01 — registro local — 2026-10-25

Autoriza somente implementação local da demanda anexada e continue posterior; transcrição UTF8/LF SHA256 9c9ea4a2c750c1f3e6559e47a8ee8ba3c7b38854dc2f0bc0f76616fbbd1a9d9d. Baseline fresh3/3 exit0:188 controles31 suítes/35 recibos917 protegidos. Nova emenda36 com grants before/after LF e predecessores reais,35 anteriores imutáveis. Opt-in em tracks de categorias e host na página principal, fora de grids; SeeAll usa virtualização por linhas, largura TV responsiva, navegação lógica e retorno RAM. Browser20 cenários PASS com componentes reais e fronteiras externas simuladas, incluindo2mil títulos acessíveis; suíte nova9 controles PASS. Sem homologação física nova, APK/instalação ou promessa60 FPS. Atualizados somente adaptadores de6 testes, mantendo cada assertion;2 bindings parentais ausentes preexistentes corrigidos usando política real. Validação integral final PENDING. Root/L1/estágios recebidos e auditoria ficam congelados.


## Fechamento dos bytes candidatos antes da validação integral

Preservado draft01 local do recibo novo, atualizado somente after/grant do controlador (limpeza de estilos ao retirar opt-in) e port do teste de episódios. Esse adaptador também não vinculava artworkCategoryContext, embora MediaCard recebido seja idêntico: agora usa função real. Teste de episódios15 cenários PASS, incluindo250mil registros com referência compacta211001 bytes. Nenhuma assertion antiga removida. Varredura auxiliar inicial com core.autocrlf=false confundiu CRLF recebidos com whitespace; preservar bytes e usar configuração cr-at-eol somente na checagem, sem normalizar arquivos. Nenhuma falha oficial do produto é inferida desses erros de harness. Logs de tentativas preservados.


## CANON-01-DPAD-CARD-SCOPE-SEEALL-GRID-01 — conclusão local — 2026-10-25

RESULT=LOCAL_CORRECTION_VALIDATED_HARDWARE_PENDING.13/13 comandos oficiais exit0, baseline3/3 exit0. CANON192 controles32 suítes,920 protegidos/36 recibos, preservados188 controles31 suítes/35 recibos anteriores. Browser21 cenários PASS, suíte nova9 PASS e6 fixtures auxiliares PASS (episódios15 cenários/250mil registros). Expansão somente opt-in de categorias nos3 contextos principais, grids sem expansão/prévia, janela de linhas responsiva com foco/retorno e acesso aos2mil títulos da fixture. Delta 29/29 caminhos na allowlist;4 prefixos normativos e bytes de toda base recebida/root preservados; index vazio; diff-check/whitespace PASS. Auth SHA256 9c9ea4a2c750c1f3e6559e47a8ee8ba3c7b38854dc2f0bc0f76616fbbd1a9d9d; recibo blobLF 1be58b8db36f88a75e115fd1cb7bbb0d17f0bb71. Sem build Android/APK/install/ADB/reset/backend/Git/publicação. Hardware10min Fire/outro Android TV/tablet/celular e60 FPS/tela preta continuam pendentes. Relatório C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/dpad-card-scope-seeall-20261025/REPORT.md. P1–P4 amplos apenas planejados, NEXT_GATE_STARTED=NAO.
