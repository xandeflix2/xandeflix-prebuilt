# CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02 — especificação anterior ao código — 2026-10-25

Solicitação atual autoriza diagnóstico, correção, implementação, testes e preparação de implantação, sem Git/publicação/backend. Root/L1 e estágios encerrados congelados; novo clone local canônico origin/branch fix/source-output-format-recovery HEAD d8a7410 e main b3fc8d1 preservados.34 recibos/914 protegidos/185 controles/30 suítes/242 testes Android38 suítes recebidos. Nenhuma desinstalação/reset/instalação de novo binário neste ciclo. Aparelhos podem ser observados por ADB/CDP no próprio app para diagnóstico; não exportar identidade, segredo, URL da fonte, token ou tráfego privado.

Diagnóstico inicial de código: detalhes usam resolveMovie/SeriesPresentation.trailer, enquanto card exige previewTrailer official=true, podendo excluir a mesma mídia manual válida. Causa física ainda não comprovada: observar TMDB público/nonce/bounds/estado do PublicTrailer sem imprimir credenciais; não concluir sucesso por ready. Home/AsyncCategoryRail limitam leitura e saída a20 e CategoryPreviewIndex é cache apenas das20 primeiras, sem cursor; não alterar formato/limites desse cache. SegmentedBrowseService.loadPage já oferece cursor incremental/local com contagem opcional e gerações. Motor D-pad usa siblings estáveis e mantém seleção visível sem âncora.

Plano: reutilizar serviço e identidade dos detalhes, preferindo trailer oficial e permitindo fallback ao trailer manual validado do mesmo ID, sem alterar semântica previewTrailer ou os13 testes anteriores. Preservar guarda de geração/aborto/uma sessão/3s/8s/45s e imagem estática; diagnosticar mídia nativa se necessário dentro dos2 arquivos PublicTrailer. Nunca usar conteúdo integral.

Âncora: usar início real da track como posição, espaço final suficiente mesmo no último item, realimentar scrollLeft pela geometria real durante expansão/colapso. Coexistir com scroll vertical do motor; nenhuma largura fixa de deslocamento, loop circular ou troca de ordem/foco. Evitar disputa entre keep-visible antigo e âncora. Aplicar somente modo D-pad real em Home/Filmes/Séries, preservar touch e grades.

Paginação:20 itens iniciais preservados, próximas leituras20 via loadPage cursor/count:false e ordem source/source-desc conforme categoria, inicial opcional/cache mantido. Cache20 não é cursor/autoridade de completude. Recuperar efetivamente próximos registros; seen IDs retém prefixo já exibido, sem duplicação, cursor avança mesmo em páginas repetidas/filtradas. Prefetch quando faltam6 títulos, um job por faixa e fila2 da Home; erro transitório mantém foco/dados e oferece retry explícito sem loop. Abortar na saída/geração. Filtros parentais/tipo ativos preservados. Metadados dos lotes vistos podem ficar em RAM até sair da Home, nenhum novo armazenamento remoto/persistente nem pré-download de vídeos.

Virtualização: montar janela de até24 cards por faixa com overscan e spacers proporcionais; metadados de lotes não implicam mídia montada. Movimento horizontal local deve montar próximo alvo e focar após commit, mantendo card atual até transferência. Índice lógico único, estável entre lotes e janela, usado também em migração vertical; Enter/Back originais intactos. Atualização de lote não remonta card focado nem reinicia timer. Touch mantém dimensões e sem âncora; paginação/virtualização podem ser compartilhadas sem alterar gestos. Faixas comuns pequenas permanecem compatíveis.

Validação: baseline fresh canon/check/test/C11 antes do patch; teste novo paginação10000 itens,20 inicial/lotes20/prefetch6/dedup/ordem/inverso/retry/cancel/reposta tardia/sem cursor falso; browser componentes reais com navegação1/2/10/100/último, x constante, baixo número de nós, troca de direção, lote sem timer reiniciado, touch, trailer disponível/ausente/erro/Enter. Testes13 anteriores e185 controles30 suítes preservados, acrescentar proteção do recibo35 e nova suíte. Native242/38 se sem patch nativo. Final canon/check/test/C11/typecheck/playback/build e native pertinentes. Reprodução real só PASS se playing e quadros progredindo observados; caso contrário PARCIAL com motivo verdadeiro, sem prometer autoplay universal. Registrar limites de hardware e preparar rollback, sem deploy.

Allowlist candidata fechada24 (usar apenas caminhos necessários; ports legados exigem addendum anterior à edição):
- src/ui/rail-pagination.ts
- src/ui/components/ProgressiveCategoryRail.tsx
- src/ui/components/MediaRail.tsx
- src/ui/components/MediaCard.tsx
- src/ui/components/AsyncCategoryRail.tsx
- src/ui/pages/HomePage.tsx
- src/ui/hooks/useDpadNavigation.ts
- src/ui/expanded-card-controller.ts
- src/ui/components/CardExpansion.tsx
- src/ui/components/CardExpansion.css
- src/artwork/series-presentation.service.ts
- src/ui/card-preview-media.ts
- src/ui/card-preview-session.ts
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicy.java
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPlugin.java
- scripts/test-home-dpad-carousel-preview-pagination.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/HOME_DPAD_CAROUSEL_PREVIEW_PAGINATION_02.md
- docs/evidence/HOME_DPAD_CAROUSEL_PREVIEW_PAGINATION_02.md
- docs/governance/authorizations/CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Auth SHA256 UTF8/LF 64cd3527d66926b1455727d27bac239c1b061723849c28d5aa4b3b318ad36380. Recibo35 será calculado com predecessores/before/after LF reais após patch,34 anteriores imutáveis. Documentos normativos somente append; sem verifier/workflow/package/lock/deps/storage/source/import/Supabase/live/player principal/versão/ativação. Próximo desenvolvimento não iniciado.

## Instrução

```text
# XANDEFLIX — CORREÇÃO DE TRAILERS, CARROSSEL COM FOCO FIXO E CARREGAMENTO PROGRESSIVO NA HOME

**GATE:** HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02  
**TIPO:** Correção funcional e evolução da implementação existente  
**PRIORIDADE:** ALTA  
**ESCOPO:** Home, carrosséis de filmes e séries e reprodução de trailers  
**PLATAFORMAS:** Fire Stick, Android TV, Smart TVs e demais dispositivos com D-pad

## 1. CONTEXTO E OBJETIVO

A implementação anterior de capas expansíveis no Xandeflix foi executada, e o comportamento visual de expansão horizontal está funcionando.

Entretanto, foram identificadas três necessidades que devem ser tratadas nesta nova etapa:

1. Os trailers não são reproduzidos automaticamente após o período de espera, mesmo quando estão disponíveis e acessíveis na página interna de detalhes do conteúdo.
2. O carrossel precisa trabalhar com um ponto de referência visual fixo: a capa selecionada deve permanecer na mesma posição horizontal da tela, enquanto as demais capas se movimentam para a esquerda ou direita conforme a navegação.
3. O limite atual de quantidade de capas exibidas nas categorias da Home precisa deixar de funcionar como limite total. Todos os títulos da categoria devem ser acessíveis no carrossel, utilizando carregamento progressivo e pré-carregamento sob demanda.

O agente deverá analisar a implementação existente, identificar as causas desses comportamentos e implementar as correções preservando os recursos já funcionais.

---

## 2. CORREÇÃO DA REPRODUÇÃO AUTOMÁTICA DE TRAILERS

### 2.1. Problema identificado

Atualmente, ao selecionar uma capa no carrossel:

- A expansão horizontal funciona.
- A imagem de fundo horizontal é apresentada.
- Entretanto, após os 3 segundos esperados, o trailer não inicia.
- O problema ocorre inclusive em títulos que possuem trailer disponível na página interna de detalhes.

Isso indica a necessidade de investigar a integração entre o componente do carrossel e o mecanismo de recuperação e reprodução de trailers existente no projeto.

### 2.2. Comportamento esperado

Ao navegar até uma capa:

1. Expandir imediatamente o cartão para o formato horizontal.
2. Exibir a imagem backdrop correspondente.
3. Iniciar uma contagem de 3 segundos após a estabilização do foco.
4. Permanecendo o foco sobre o mesmo conteúdo, recuperar a referência do trailer disponível.
5. Iniciar a reprodução automaticamente dentro do cartão expandido.
6. Preservar a navegação D-pad durante toda a reprodução.
7. Interromper e liberar o trailer imediatamente quando o usuário mudar o foco ou sair da tela.

O trailer deve ser exibido na própria área expandida, sem abrir o player principal em tela cheia.

### 2.3. Reutilização da integração existente

**REQUISITO OBRIGATÓRIO:**

Antes de criar qualquer nova integração, localizar e analisar como a página interna de detalhes recupera e reproduz os trailers.

Verificar:

- Serviço responsável pela consulta de trailers.
- Identificador utilizado para localizar o título.
- IDs do catálogo e identificadores TMDB, quando aplicáveis.
- URL ou referência de reprodução.
- Tipo de mídia retornado.
- Componente responsável pela reprodução.
- Restrições de autoplay, codecs, iframe, rede e autenticação.
- Possíveis diferenças entre a disponibilidade do trailer na página de detalhes e no cartão da Home.

Reutilizar preferencialmente o mesmo serviço ou resolver de trailers utilizado na página de detalhes, evitando criar duas implementações independentes.

O vídeo apresentado no carrossel deverá obrigatoriamente corresponder ao título selecionado.

### 2.4. Diagnóstico obrigatório do erro

Identificar se a falha está relacionada a:

- Temporizador que não dispara.
- Referência de trailer não carregada.
- Divergência de identificadores.
- Ausência de consulta aos trailers no componente da Home.
- Bloqueio de autoplay.
- Reprodução com áudio não permitida automaticamente.
- Incompatibilidade do formato retornado.
- Inicialização incorreta do player.
- Problemas de foco, eventos ou ciclo de vida do componente.
- Requisições canceladas ou sobrescritas incorretamente.

Não considerar a funcionalidade corrigida apenas porque existe um trailer no banco de dados ou porque o temporizador foi disparado.

**A reprodução real precisa ser comprovada.**

Quando necessário, iniciar o trailer sem áudio para respeitar as políticas de reprodução automática dos dispositivos. Se a origem do vídeo não permitir reprodução embutida automática, registrar a limitação e manter a imagem horizontal como fallback, sem travar o carrossel.

---

## 3. CARROSSEL HORIZONTAL COM PONTO DE REFERÊNCIA FIXO

### 3.1. Nova regra de navegação

O carrossel deverá trabalhar com uma **posição de foco fixa na tela**, utilizando inicialmente a posição ocupada pela primeira capa como referência visual.

Essa posição será denominada ANCHOR_POSITION.

**Importante:** não significa manter o primeiro título permanentemente fixo. Significa manter fixa a posição visual onde qualquer título selecionado será apresentado.

### 3.2. Funcionamento esperado

Quando o usuário entra em uma categoria:

- A primeira capa aparece na posição de referência.
- Essa capa recebe o foco e se expande horizontalmente.
- As demais capas aparecem organizadas à direita.

Quando o usuário pressiona Direita (→):

1. O carrossel desloca seus conteúdos para a esquerda.
2. A segunda capa assume exatamente a posição visual anteriormente ocupada pela primeira.
3. Essa segunda capa recebe o foco e se expande horizontalmente.
4. A primeira capa deixa de ocupar a posição principal e passa para a área anterior do carrossel, conforme o recorte visível.
5. As demais capas continuam disponíveis à direita.
6. A posição horizontal do cartão selecionado permanece constante.

Ao pressionar Direita novamente:

- O terceiro título assume a mesma posição de referência.
- O carrossel realiza outro deslocamento.
- O novo título recebe foco e expansão.

Esse comportamento deverá se repetir durante toda a navegação da categoria.

### 3.3. Navegação no sentido inverso

Quando o usuário pressionar Esquerda (←):

- O carrossel deverá se deslocar para a direita.
- O título anterior deverá voltar à posição fixa.
- O foco deverá acompanhar corretamente a movimentação.
- A expansão horizontal deverá ocorrer no título selecionado.

Ao alcançar o primeiro título, respeitar o comportamento de borda da navegação existente, sem criar rolagem circular automaticamente.

### 3.4. Requisitos técnicos do carrossel

Implementar o conceito de **Fixed Focus Anchor + Sliding Track**, adaptado à arquitetura atual.

Requisitos:

- Posição visual de seleção constante.
- Conteúdos movimentando-se em relação ao ponto fixo.
- Transições suaves e previsíveis.
- Preservação do foco D-pad.
- Suporte à expansão horizontal de tamanho variável.
- Sem sobreposição indevida de cartões.
- Sem saltos visuais durante a troca de títulos.
- Sem perda de seleção durante atualizações de dados.
- Sem reiniciar desnecessariamente o carrossel ao carregar mais itens.

O deslocamento deverá considerar a largura real dos cartões, inclusive a expansão horizontal, evitando cálculos fixos incorretos.

A animação deverá ser eficiente em dispositivos com recursos limitados.

**CRITÉRIO PRINCIPAL:** independentemente de o usuário estar no título 1, 5, 20, 100 ou no último título, a capa selecionada deverá ocupar a mesma posição de referência horizontal na tela.

---

## 4. REMOÇÃO DO LIMITE TOTAL DE CAPAS NA HOME

### 4.1. Problema identificado

Atualmente, as categorias apresentadas na Home exibem uma quantidade limitada de capas carregadas inicialmente.

O comportamento desejado é permitir que o usuário percorra todos os conteúdos disponíveis em cada categoria diretamente pela Home, sem precisar acessar outra página para visualizar os títulos que ficaram fora do limite inicial.

Entretanto, carregar todos os registros, imagens e vídeos simultaneamente poderia prejudicar o desempenho, especialmente em Fire Stick.

Portanto, a solução deverá separar:

**Limite de carregamento inicial:** deve continuar existindo para desempenho.

**Limite total de navegação:** deverá ser removido, respeitando somente a quantidade real de títulos disponíveis na categoria.

### 4.2. Carregamento inicial

Ao abrir a Home:

1. Carregar somente o quantitativo inicial atualmente configurado para a categoria.
2. Manter o comportamento de abertura rápida da tela.
3. Renderizar apenas as capas necessárias para a primeira exibição.
4. Evitar carregamento simultâneo de todas as imagens.
5. Não carregar trailers de títulos que ainda não receberam foco.

O quantitativo inicial já estabelecido no projeto deverá ser preservado, exceto quando a análise técnica demonstrar necessidade de ajuste devidamente justificado.

### 4.3. Carregamento progressivo sob demanda

Quando o usuário navegar para a direita e estiver se aproximando do final do lote carregado:

1. Detectar antecipadamente a proximidade do final dos itens disponíveis.
2. Solicitar ou recuperar o próximo lote de títulos da mesma categoria.
3. Acrescentar os novos títulos ao carrossel existente.
4. Preservar a ordem dos conteúdos.
5. Manter o foco no título atual.
6. Evitar qualquer interrupção visual na navegação.
7. Continuar o processo enquanto existirem títulos não carregados.

**Exemplo ilustrativo:**

Se uma categoria possui 2.000 títulos e inicialmente carrega 20:

- A Home apresenta os primeiros 20.
- Ao navegar próximo ao final desse lote, recupera mais 20.
- Ao se aproximar do final dos 40 títulos disponíveis, recupera mais 20.
- A operação continua progressivamente até o último título real da categoria.

O exemplo não determina que o tamanho de lote seja 20. O agente deverá utilizar preferencialmente a configuração existente.

### 4.4. Pré-carregamento inteligente

Implementar um mecanismo de prefetch que antecipe a necessidade de novos títulos.

O sistema não deverá aguardar o usuário alcançar a última capa para então iniciar o carregamento.

A antecipação poderá considerar:

- Quantidade de itens restantes.
- Tamanho do lote.
- Velocidade da navegação.
- Latência da fonte de dados.
- Estado atual do carregamento.

As consultas deverão ser deduplicadas e realizadas apenas quando necessárias.

### 4.5. Integração com a fonte de dados

Verificar se o limite atual de capas ocorre:

- Na consulta à base de dados.
- Na API.
- No catálogo local-first.
- Na transformação dos resultados.
- No estado dos componentes.
- Na renderização do carrossel.
- Em filtros ou limites artificiais da Home.

Corrigir a limitação na camada apropriada.

O sistema deverá permitir acesso à totalidade dos títulos elegíveis da categoria, respeitando a fonte realmente disponível e os filtros já existentes.

**Não basta remover um `.slice()` ou aumentar um limite numérico.**

A implementação deverá garantir que os dados adicionais sejam efetivamente recuperados, quando ainda não estiverem carregados.

Utilizar paginação, cursores ou consulta incremental conforme a arquitetura existente.

Preservar ordenação estável, identificadores únicos e ausência de duplicações entre os lotes.

---

## 5. VIRTUALIZAÇÃO E DESEMPENHO

Como uma categoria pode possuir centenas ou milhares de títulos, o agente deverá avaliar a necessidade de virtualização da renderização.

Não manter obrigatoriamente milhares de elementos, imagens e componentes de vídeo montados simultaneamente.

Priorizar:

- Janela de renderização limitada.
- Cache controlado de dados e imagens.
- Reaproveitamento de componentes.
- Paginação incremental.
- Pré-carregamento antecipado.
- Apenas um trailer ativo por vez.
- Limpeza de recursos ao sair da Home.
- Cancelamento de requisições obsoletas.
- Controle de concorrência.
- Proteção contra respostas assíncronas fora de ordem.

É permitido manter em memória os metadados dos lotes já recuperados quando houver capacidade adequada, desde que isso não implique renderizar todos os cartões ou carregar todas as mídias simultaneamente.

O movimento do carrossel e a identificação do foco deverão continuar funcionando corretamente mesmo quando os itens forem virtualizados.

Não bloquear a navegação D-pad enquanto novos dados são carregados.

---

## 6. INTEGRAÇÃO ENTRE FOCO, CARROSSEL E TRAILER

As três funcionalidades deverão trabalhar de maneira coordenada.

### Sequência obrigatória

1. Usuário seleciona uma capa.
2. O cartão assume a posição fixa de referência.
3. O cartão se expande horizontalmente.
4. O backdrop é apresentado.
5. O sistema inicia a contagem de 3 segundos.
6. Permanecendo o foco, o trailer começa.
7. Ao pressionar Direita ou Esquerda, o trailer atual para imediatamente.
8. O carrossel se movimenta.
9. O novo cartão assume a posição de referência.
10. O novo temporizador é iniciado.
11. Caso o próximo lote esteja próximo, o pré-carregamento ocorre independentemente do temporizador do trailer.

A troca de foco deverá cancelar qualquer operação de trailer que não corresponda mais ao título selecionado.

Requisições assíncronas antigas não poderão iniciar trailers depois que o usuário já tiver selecionado outro conteúdo.

A atualização da paginação não poderá reiniciar o temporizador de um cartão cujo foco permaneceu estável.

---

## 7. PRESERVAÇÃO DE COMPATIBILIDADE

Manter os comportamentos já aprovados.

### Dispositivos D-pad

- Capas aumentadas.
- Expansão horizontal.
- Imagem backdrop.
- Navegação por controle remoto.
- Reprodução automática de trailers disponíveis.
- Carrossel com posição fixa de seleção.
- Carregamento progressivo.

### Dispositivos touchscreen

Preservar o layout e as dimensões atuais, sem aplicar indevidamente o mecanismo de foco fixo do D-pad.

A melhoria de carregamento progressivo poderá ser compartilhada com outras interfaces quando tecnicamente adequado, desde que não provoque regressões.

### Restrições

Não alterar desnecessariamente:

- Player principal de filmes e séries.
- Reprodução de TV ao vivo.
- Sistema de autenticação.
- Importação de fontes.
- Estrutura de catálogo.
- Supabase ou PostgreSQL.
- Rotas existentes.
- Comportamento de dispositivos já homologados.

---

## 8. TESTES OBRIGATÓRIOS

### Testes de trailers

- Conteúdo com trailer disponível na página interna.
- Reprodução automática no carrossel após 3 segundos.
- Cancelamento antes dos 3 segundos.
- Interrupção durante a reprodução.
- Navegação rápida entre diferentes conteúdos.
- Conteúdo sem trailer.
- Trailer incompatível ou indisponível.
- Entrada na página de detalhes durante uma prévia ativa.

### Testes do carrossel

- Primeiro título na posição fixa.
- Segundo título assumindo a mesma posição.
- Navegação até o décimo título.
- Navegação até o centésimo título, quando disponível.
- Navegação reversa.
- Troca rápida de direção.
- Expansão horizontal durante movimentação.
- Permanência do foco na posição de referência.
- Limites inicial e final da categoria.

### Testes de carregamento

- Quantitativo inicial preservado.
- Pré-carregamento antes de alcançar o último item do lote.
- Continuidade entre os lotes.
- Ausência de títulos duplicados.
- Ausência de títulos omitidos.
- Ordenação consistente.
- Navegação até o último título disponível.
- Categoria com poucos títulos.
- Categoria com milhares de títulos, em teste sintético ou controlado.
- Erro temporário de consulta e nova tentativa.
- Ausência de requisições repetitivas desnecessárias.
- Consumo controlado de memória.

Os testes automatizados devem distinguir validação de lógica de validação real de reprodução em dispositivos físicos.

---

## 9. AUTONOMIA DO AGENTE EXECUTOR

O Codex deverá executar as seguintes etapas de forma autônoma:

**ETAPA A — Diagnóstico**

Inspecionar a implementação atual, identificar a causa da falha dos trailers, o funcionamento do carrossel e a origem da limitação de títulos.

**ETAPA B — Planejamento técnico**

Definir a solução mais simples, segura e compatível com os componentes existentes.

**ETAPA C — Implementação**

Corrigir trailers, implementar posição fixa de foco e carregamento progressivo sem perder os recursos já funcionais.

**ETAPA D — Validação**

Executar testes, compilação, verificações estáticas e regressões pertinentes.

**ETAPA E — Consolidação**

Corrigir problemas identificados, documentar as alterações e preparar a implantação.

O agente não deverá interromper a execução para solicitar autorização a cada alteração técnica local já abrangida pelo escopo.

Deverá comunicar apenas bloqueios reais, decisões que extrapolem o escopo ou ações com potencial de afetar produção.

Não realizar commit, push, merge ou deploy em produção sem autorização expressa.

---

## 10. RELATÓRIO FINAL OBRIGATÓRIO

O relatório deverá conter:

1. Repositório, branch e SHA inicial.
2. Causa identificada para os trailers não executarem.
3. Correção aplicada e origem real dos trailers.
4. Estratégia implementada para o foco fixo.
5. Funcionamento do deslocamento horizontal dos cartões.
6. Localização da antiga limitação de capas.
7. Quantitativo inicial preservado.
8. Tamanho e estratégia dos lotes subsequentes.
9. Forma de recuperação dos títulos adicionais.
10. Arquivos modificados.
11. Resultados dos testes.
12. Validações físicas ainda necessárias.
13. Riscos conhecidos e estratégia de rollback.
14. Status de cada uma das três funcionalidades: CONCLUÍDO, PARCIAL ou BLOQUEADO.

## 11. CRITÉRIO FINAL DE ACEITAÇÃO

A demanda somente será considerada implementada quando:

**TRAILERS:** títulos que possuem trailer compatível e reproduzível na página interna também conseguirem executá-lo automaticamente no cartão horizontal após 3 segundos de foco, respeitadas as limitações da plataforma.

**FOCO FIXO:** independentemente da posição do título na categoria, a capa selecionada ocupar sempre o mesmo ponto de referência horizontal, enquanto os demais conteúdos se deslocam pelo carrossel.

**CATÁLOGO COMPLETO:** todas as capas elegíveis da categoria estiverem acessíveis pela Home, sem um limite artificial de navegação, e sem carregamento integral desnecessário na abertura da tela.

**DESEMPENHO:** a navegação permanecer responsiva, inclusive no Fire Stick, com consumo controlado de memória, processamento e rede.

**ORDEM FINAL:** conduzir a auditoria, correção, implementação, testes e preparação de implantação desta demanda de maneira autônoma, preservando a estabilidade e apresentando resultados verificáveis, sem declarar como validadas funcionalidades que ainda dependam de testes físicos.```


## CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02 — registro local — 2026-10-25

Baseline fresh canon/check/test/C11 exit0 (185 controles/30 suítes,34 recibos/914 protegidos). Especificação/allowlist antes do patch; protótipo pager17 cenários PASS, incluindo10000 itens, cursor real segmentado, ordem reversa/retry/cancel/dedup/24 DOM lógico e trailer manual como fallback. Registra somente subset efetivamente modificado. Recibo35/auth SHA256 64cd3527d66926b1455727d27bac239c1b061723849c28d5aa4b3b318ad36380. Campos previewTrailer oficial e testes13 anteriores preservados. Diagnóstico real ainda não prova reprodução: Capitã Marvel ID299537/wTqUqYRoyNQ abriu modo card com bounds válidos e fechou por deadline sem playing observado. Primeira leitura ADB encontrou Fire adormecido e houve tentativa indevida no card Recentes que retoma VOD (HTTP403, nenhum vídeo confirmado); teste foi encerrado e aviso fechado, não atribuir ao trailer. Persistência privada/fonte não lidas nem exportadas. Validação integral/browser/hardware ainda PENDING.


## Evidência física e ajuste nominal de inicialização — antes da edição

Probe isolado com PublicTrailer card e mesmo trailer TMDB299537/wTqUqYRoyNQ, sem player da fonte: API pronta em torno6.4s, buffering/time0 em9.0s e11.3s; playing em13.3s/time2.89,15.3s/time4.91,17.4s/time6.98, muted=true. A tentativa do card instalado era encerrada pelo deadline8s. Esses números vêm da saída observada do probe-timed, cuja coleta final falhou por timeout CDP do host; não declarar harness completo PASS ou fluxo automático corrigido por esse teste isolado. O modal público anterior também foi observado em ended/time31.137958 de31.137958.

Ajustar SOMENTE o chamador card para startup25s, mantendo padrão8s da classe CardPreviewSession e os13 testes anteriores. Adaptador card também25s, imagem até playing/tempo finito45s/cancel de foco intactos. Estado player-paused antes do primeiro playing não é falha comprovada, não encerrar por esse estado transitório; lifecycle paused/erro/bloqueio/ended continuam encerrando. Nenhuma ampliação de tempo do player principal/Live, fonte ou serviço TMDB8s. Sem instalação de binário novo. Produção2 arquivos já constam na allowlist candidata anterior; recalcular novo recibo35 em rascunho com backup e repetir validação.


## Ports legados adjudicados antes da edição — allowlist candidata27

Primeira regressão completa passou188 controles e18 suítes, falhou em série poster composition por dependência controlada nova rail-pagination no fixture test-c11-artwork-visible-recovery. Acrescentar somente import/port do helper real railWindow em3 fixtures que montam MediaRail; ProgressiveCategoryRail stub só em loader de cenário legado que usa progressive=false; alias useLayoutEffect ao runner useEffect existente em1 fixture. Assertions não serão editadas. Faixa não virtual preserva children array original (produto corrigido para manter forma estável). Outras duas: test-c11-category-rails e test-c11-startup-artwork. Incluir3 scripts nos grants com predecessor/before/after reais. Testes novos e navegador montam implementação real, sem usar esses stubs.

Falha anterior pretypecheck por chain: ao incluir2 arquivos do deadline25 no rascunho faltaram predecessores; hook bloqueou antes de TSC. Corrigidos os2 grants para o predecessor Expanded Cards, sem contornar verificador; typecheck posterior passou. Browser auxiliar excedeu timeout do protocolo em avaliação longa e depois tentou serializar nó DOM (Object reference chain is too long); corrigido harness em blocos50/eventos e retorno booleano, sem enfraquecer asserts nem alterar produto para esconder erro.


## Port adicional de fixture — fronteira original verificada

Execução adicional read-only do fixture de categorias na base recebida confirmou a mesma falha Uncontrolled component dependency content-adult-policy antes do código novo. Não é falha da baseline canônica3/3 nem regressão deste patch. Para tornar a verificação pertinente executável, acrescentar port do módulo real content-adult-policy (sem stub/alterar regra/asserção) no mesmo fixture já na allowlist. Nenhuma afirmação de PASS sobre a execução antiga. Repetir fixture e validação completa após novo hash do rascunho35, preservando rascunho anterior.


## Port real de metadata no fixture startup — antes da edição

O teste standalone na base recebida também falha antes do patch em dependência controlada tmdb-metadata ao montar MediaCard. Acrescentar somente port com exports reais do módulo (normalização/identidade), sem alterar assertions; arquivo já está na allowlist de ports. Baseline canônica obrigatória permanece3/3 PASS, standalone antigo é FAIL declarado.


## Correção final da propriedade da âncora — antes da edição

A primeira cadeia6 comandos e Android242/38 passou, mas nova rodada browser encontrou FIXED_ANCHOR_second: card x230 contra referência92, apesar de foco correto e largura355.55. Latest regression wins; não encerrar como PASS com base nos testes anteriores. Centralizar alinhamento no controlador de foco (um rAF cancelável por250ms e realinhamento em scroll/mutação/resize), removendo o efeito passivo de alinhamento do portal. Assim foco/âncora não dependem da montagem de artwork. Calcular padding e tail reais, manter vertical/cancel/touch e identidade. Arquivos já na allowlist. Preservar validação anterior, recalcular recibo35 em rascunho e repetir checks completos e browser com transições repetidas. Nenhuma alteração de assertion/tolerância para ocultar o erro.


## Proteção de evento de saída obsoleto — antes da edição

Teste repetido de foco ainda mostrou caso x230/âncora92, apesar do ciclo completo2 e tour2000 passarem. Navegação virtual transfere foco durante commit React; handler CARD_LEAVE incondicional pode cancelar seleção posterior se blur de outro card chegar atrasado. Proteger saída pelo elemento atual, mantendo saída real/Enter/Back/ocultar/blur da janela. Ajuste mínimo no controlador já autorizado; invariantes de foco e recursos intactas. Instrumentação auxiliar de âncora passou3 tamanhos, mas não será tratada como teste limpo; repetir sem instrumentação e preservar erros anteriores.


## Memória de seleção entre faixas virtualizadas — antes da edição

Revisão identificou que coluna lógica100 não existe entre os20 nós iniciais de outra faixa: fallback pelo último nó pode saltar ao sair/retornar. Guardar índice corrente no track virtual (já no estado MediaRail), entrar em faixa nova pelo0 e restaurar seleção montada da faixa visitada, inclusive ação Ver todos→Baixo. Somente caminhos MediaRail/useDpadNavigation já permitidos; faixas não virtuais mantêm motor anterior. Adicionar teste browser Cima/Baixo e ida/volta após índice99. Não afirmar teste físico novo do carrossel, nem tocar source/player/autorização. Recalcular rascunho35 e repetir checks.


## CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02 — fechamento local — 2026-10-25

RESULT=LOCAL_READY_VALIDATION_PASS_NEW_APK_HOMOLOGATION_PENDING. Baseline3/3 e validação final R4 seis comandos/Gradle exit0.917 protegidos/35 recibos/188 controles31 suítes;185 controles30 suítes e34 recibos recebidos preservados. Nova suíte19 casos, sessão anterior13 intacta, Android242 testes38 suítes sem falhas/erros/skips (rodadas posteriores up-to-date). Browser final6 PASS, stress3 viewports com22 transições cada; fixtures não equivalem a novo APK físico. Adaptador candidato real em RAM no Fire reproduziu trailer público mudo com tempo e quadros decodificados crescentes; resolver/carrossel completo instalado não testado. Deadline card25s, espera3s, lifetime45s; demais timeouts preservados.20 iniciais/lotes20/prefetch6/DOM24, cursor local real/queue2/dedup/retry/cancel. Metadados visitados acumulam RAM até sair da Home; consumo físico/primeira instalação não medidos.25 caminhos efetivamente alterados de27 candidatos,2 Java intactos; root/base recebida e prefixos preservados; sem mudança de fonte/import/ativação/Live/VOD/Supabase. Auth SHA256 64cd3527d66926b1455727d27bac239c1b061723849c28d5aa4b3b318ad36380; recibo blobLF a91ff1c57b2c412e808fb79917fc00a1bfaa1e1e. Relatório completo C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/home-carousel-preview-02-20261025/REPORT.md. Nenhum APK novo/install/reset/Git staging/commit/push/PR/merge/remote write/deploy ou próxima implementação.


# Trailers, foco fixo e paginação — relatório de fechamento local

Data: 25/10/2026. Gate: CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02.

**Resultado: código e validação local concluídos; homologação do novo APK pendente.** O adaptador candidato reproduziu vídeo público real, mudo, com quadros decodificados no Fire Stick. O novo carrossel completo ainda não foi instalado. Nenhum APK foi gerado ou instalado neste ciclo.

## 1. Identidade, base operacional e proveniência

Repositório: https://github.com/xandeflix2/xandeflix-prebuilt.git. Branch: fix/source-output-format-recovery. SHA inicial e final: d8a74102124fbb8a3f013f6fd8a502519c1db4b8. Main/baseline local: b3fc8d1e3844bc5601813ab1b298289af5b3f1fd. Workspace desta implementação: C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/home-carousel-preview-02-20261025/workspace. A base operacional é C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/expanded-cards-apk-20261025/workspace, etapa anterior encerrada com APK instalado, 34 recibos, 914 arquivos protegidos, 185 controles/30 suítes. O HEAD Git sozinho não representa essas melhorias locais encadeadas. Root/L1 e todos os arquivos gerenciados da base recebida permaneceram idênticos por hash. Index vazio; nenhuma operação Git de staging/publicação.

Pedido integral normalizado UTF-8/LF: AUTHORIZATION.txt e evidência, SHA256 64cd3527d66926b1455727d27bac239c1b061723849c28d5aa4b3b318ad36380. Recibo35: blobLF a91ff1c57b2c412e808fb79917fc00a1bfaa1e1e; SHA256 2229a788ef1efd23f9a9177e799a92757dbfd734296c3b28ce3efa6f817332c9. Os 34 recibos anteriores são idênticos. Os 18 grants before/after e predecessores reais estão em REGISTERED.json e no recibo. Allowlist candidata27; somente25 caminhos alterados. Os dois candidatos Java PublicTrailer não precisaram de modificação. Documentos normativos preservam o prefixo integral recebido.

## 2. Causa comprovada dos trailers

No Fire Stick, a tentativa anterior disparava a espera e encontrava o trailer correto, mas a sessão do card encerrava a abertura após 8 segundos. A mídia pública precisava de mais tempo para sair de ready/buffering: um diagnóstico isolado observou ready em aproximadamente6,4s e playing em aproximadamente13,3s. Esse diagnóstico inicial teve timeout na coleta final do host; sua saída não é declarada como harness PASS. Probes posteriores completos com os módulos candidatos confirmaram a reprodução.

Havia também uma diferença funcional entre os seletores: detalhes aceitavam um Trailer YouTube validado do mesmo ID TMDB, enquanto o card exigia que o campo opcional official fosse true. Assim, um trailer manual compatível podia ficar excluído do autoplay. Não foi observado erro153 nem comprovado problema de Referer, codec ou credencial como causa desse caso.

## 3. Correção e origem real das prévias

O card reutiliza o serviço de apresentação usado pelos detalhes, a identificação TMDB confirmada e a seleção manual existente. Prefere previewTrailer oficial; na ausência dele utiliza trailer validado do mesmo título. A semântica do campo previewTrailer e os 13 testes anteriores foram preservados. IDs inválidos, identidade divergente e mídia incompatível continuam rejeitados. Não se utiliza URL integral da fonte, filme ou episódio como trailer.

Depois de 3 segundos de foco estável, começa a resolução/abertura assíncrona. Esse prazo não garante o primeiro quadro em3s: rede e provedor podem atrasá-lo. Só o chamador e adaptador do card recebem tolerância de inicialização de25s. O padrão8s da classe permanece para os demais chamadores; player principal, Live, importação, ativação e timeout do serviço de metadados não foram ampliados. A imagem continua até playing real, sem impedir Enter/navegação. Uma sessão global, mute e limite finito45s permanecem; foco novo, saída, ocultação, erro ou cancelamento liberam a sessão. player-paused anterior ao primeiro playing é tratado como transitório; pausa de lifecycle e erros reais continuam encerrando.

## 4. Foco fixo e deslocamento dos cartões

O controlador centraliza o alinhamento no início real do track, considerando borda e padding. O cartão selecionado ocupa essa referência; a faixa rola por scrollLeft calculado pela geometria atual, inclusive durante expansão/colapso, sem supor largura fixa. Uma reserva final proporcional permite alinhar também o último título. Um rAF cancelável acompanha os primeiros250ms de transição; scroll, resize e mutação relevante realinham. Não há laço de rAF permanente em repouso.

O antigo keep-visible horizontal não disputa a rolagem das faixas preparadas. Um evento tardio de saída de outro card não limpa a seleção atual. A janela virtual mantém índice lógico e memória da seleção de cada faixa: a categoria nova começa no primeiro título, e o retorno restaura a seleção anterior, inclusive via Ver todos. A navegação vertical e as bordas sem rolagem circular permanecem. Grades mantêm o tratamento anterior, e touch não recebe a âncora D-pad.

## 5. Limite anterior e recuperação incremental

HomePage e AsyncCategoryRail exibiam somente o lote inicial de20. CategoryPreviewIndex é um cache das primeiras20 entradas, não uma paginação ou uma declaração de completude. Remover apenas slice não recuperaria os registros restantes. O cache mantém formato/limites e a importação da fonte permanece intacta.

O novo ProgressiveCategoryRail utiliza o SegmentedBrowseService.loadPage existente no catálogo local, cursor real e count:false. Continua com20 títulos iniciais por categoria. Lotes seguintes têm20; o prefetch começa quando faltam6 títulos carregados. A primeira leitura pode repetir registros do seed: o pager deduplica por ID e avança o cursor até encontrar dados adicionais, sem duplicar ou reordenar o prefixo já apresentado. Usa ordem source, ou source-desc nas categorias de lançamento aplicáveis, preservando filtros de tipo e parentais.

Uma solicitação por faixa é deduplicada; a fila compartilhada da Home mantém concorrência2. Cursor sem avanço falha de forma explícita. Erro temporário preserva cards/foco e oferece nova tentativa, sem loop automático. Ao sair ou trocar geração, aborta o trabalho e ignora respostas tardias. O limite total deixa de ser20 e passa a ser a quantidade elegível real da categoria. Não há download de todos os lotes na abertura nem prefetch de vídeos.

## 6. Renderização, memória e primeira instalação

Cada faixa progressiva monta no máximo24 cards, com spacers e chaves estáveis; o item atual permanece até o próximo alvo estar montado. Um lote acrescentado não remonta o card focado nem reinicia sua sessão/timer. Touch compartilha a continuação local preservando dimensões e gesto de rolagem, sem autoplay/âncora indevidos.

Os metadados dos lotes já visitados e o conjunto de IDs vistos ficam em RAM até sair da Home. Portanto, a memória total de dados cresce com o número de itens percorridos; não há LRU rígido desse histórico. O limite24 aplica-se aos elementos montados, e o limite1 ao vídeo, não à totalidade dos metadados acumulados. Isso precisa de medição prolongada em Fire com categorias grandes. Não foram medidos CPU/RAM/FPS/bateria/tráfego nem efeito térmico nesta etapa.

**Sobre a pergunta do tempo da primeira instalação:** a mudança não acrescenta consultas de lotes ao construtor nem trabalho à importação/ativação. O quantitativo inicial continua20 e o restante é sob demanda. A expectativa é preservar o tempo atual, não acelerar a importação por esta alteração. Build/checagens lógicas não comprovam duração real: ainda falta medir desde Ativar até Home em instalação nova, com fonte e rede comparáveis, separando servidor/download/parsing/persistência/renderização. Os antigos tempos reportados são observações, não SLA garantido.

## 7. Arquivos alterados

| Caminho | Alteração |
| --- | --- |
| `docs/ERRORS_AND_BLOCKERS.md` | Append somente |
| `docs/EVOLUTION_REPORT.md` | Append somente |
| `docs/STATUS.md` | Append somente |
| `docs/architecture/HOME_DPAD_CAROUSEL_PREVIEW_PAGINATION_02.md` | Criado |
| `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md` | Append somente |
| `docs/evidence/HOME_DPAD_CAROUSEL_PREVIEW_PAGINATION_02.md` | Criado |
| `docs/governance/authorizations/CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02.json` | Criado |
| `scripts/test-c11-artwork-visible-recovery.mjs` | Modificado |
| `scripts/test-c11-category-rails.mjs` | Modificado |
| `scripts/test-c11-startup-artwork.mjs` | Modificado |
| `scripts/test-canonical-regression.mjs` | Modificado |
| `scripts/test-home-dpad-carousel-preview-pagination.mjs` | Criado |
| `src/artwork/series-presentation.service.ts` | Modificado |
| `src/ui/card-preview-media.ts` | Modificado |
| `src/ui/card-preview-session.ts` | Modificado |
| `src/ui/components/AsyncCategoryRail.tsx` | Modificado |
| `src/ui/components/CardExpansion.css` | Modificado |
| `src/ui/components/CardExpansion.tsx` | Modificado |
| `src/ui/components/MediaCard.tsx` | Modificado |
| `src/ui/components/MediaRail.tsx` | Modificado |
| `src/ui/components/ProgressiveCategoryRail.tsx` | Criado |
| `src/ui/expanded-card-controller.ts` | Modificado |
| `src/ui/hooks/useDpadNavigation.ts` | Modificado |
| `src/ui/pages/HomePage.tsx` | Modificado |
| `src/ui/rail-pagination.ts` | Criado |

Treze arquivos de produção: pager/componente progressivo, integração da Home, virtualização/índice, seleção/âncora e adaptação de trailers. Um teste novo e o runner acrescentam cobertura. Nos três fixtures legados foram adicionados somente imports/ports controlados e um alias useLayoutEffect: removendo exatamente esses trechos, os bytes originais são idênticos. Nenhuma assertion antiga foi editada. Verificador canônico, dependências, versões, rotas, esquema do catálogo, fontes, Live, VOD principal, autenticação e Supabase não foram alterados por este gate.

## 8. Validação automatizada e comandos reais

| Execução | Comando | Exit code |
| --- | --- | --- |
| baseline-canon | `cmd.exe /d /s /c npm run canon:check` | 0 |
| baseline-regression | `cmd.exe /d /s /c npm run canon:test` | 0 |
| baseline-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 |
| baseline-extra-category-fixture | `C:\Program Files\nodejs\node.exe scripts/test-c11-category-rails.mjs` | 1 |
| baseline-extra-startup-fixture | `C:\Program Files\nodejs\node.exe scripts/test-c11-startup-artwork.mjs` | 1 |
| r4-01-canon-check | `cmd.exe /d /s /c npm run canon:check` | 0 |
| r4-02-canon-test | `cmd.exe /d /s /c npm run canon:test` | 0 |
| r4-03-c11-new-device-lock | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 |
| r4-04-typecheck | `cmd.exe /d /s /c npm run typecheck` | 0 |
| r4-05-playback-check | `cmd.exe /d /s /c npm run playback:check` | 0 |
| r4-06-build | `cmd.exe /d /s /c npm run build` | 0 |
| r4-native | `cmd.exe /d /s /c gradlew.bat --offline --no-daemon --max-workers=2 --console=plain testDebugUnitTest` | 0 |

VALIDATION_COMPLETE_R4.json fixa hashes dos inputs finais. Todos os seis comandos oficiais da última rodada passaram, em sequência. Resultado:917 protegidos,35 recibos,188 controles/31 suítes. Os185 controles e30 suítes recebidos foram comparados nominalmente e preservados. A suíte nova executa19 cenários, incluindo10000 itens completos/sem duplicação,20 inicial/prefetch6, cursor segmentado real, ordem reversa, poucos/zero registros, filtros parentais, retries, não avanço, cancelamento, resposta tardia, janela24, seleção de trailer e tolerância25s. Os13 testes da sessão anterior permanecem idênticos e passam.

Android:242 testes/38 suítes, zero falhas/erros/skips nos XML. A primeira execução nativa desta etapa compilou/executou; as rodadas posteriores, inclusive R4, reutilizaram tarefas Gradle up-to-date. Não afirmar242 reexecuções em cada rodada nem que o assemble de um APK novo foi realizado.

BROWSER_FINAL.json:6 cenários PASS com componentes reais e portas controladas para dados/mídia. Referência fixa no1º/2º/10º/100º; entrada em categoria nova pelo primeiro e retorno ao índice99; categoria2000 completa até o fim e reverso com100 consultas e máximo24 nós; Enter/cleanup; lote lento sem remontagem/timer reiniciado; touch411px/card140px sem autoplay ou âncora. ANCHOR_STRESS_R3.json:22 transições por tamanho960×540,1280×800,1920×1080, com blur obsoleto ignorado e x estável. Esse stress foi executado antes do último ajuste de memória vertical; controlador/CSS ficaram iguais depois. O browser final cobre também a alteração vertical posterior. As fixtures não comprovam taxa de quadros ou experiência do controle físico no APK novo.

## 9. Prova física e seus limites

Fire Stick AFTSS/Android9, app instalado1.0.37: os módulos candidatos reais CardPreviewSession e openCardPreview foram compilados e carregados somente em RAM para diagnóstico, chamando o plugin PublicTrailer instalado pelo proxy Capacitor real. Os arquivos Java candidatos são idênticos aos instalados. Usado trailer público Capitã Marvel, TMDB299537/YouTube wTqUqYRoyNQ, referência confirmada na consulta pública já observada. O probe usa essa referência conhecida; não testa o resolver completo de metadados ou o carrossel instalado.

CANDIDATE_ADAPTER_PHYSICAL.json: PASS com resolução após aproximadamente3s, playing após aproximadamente13,1s e avanço mudo do tempo. CANDIDATE_ADAPTER_FRAMES_PHYSICAL.json: PASS com playing real, vídeo640×266, tempo e quadros decodificados progredindo83→152→203→257. O contador de quadros foi lido no contexto do iframe público do próprio trailer; não foram lidos cookies/storage/credenciais. Essa instrumentação adicionou latência; na amostra de quadros o evento playing ocorreu em25,4s desde o agendamento, dentro da abertura25s que começa após a espera/resolução. Não é medição de startup do aplicativo ou SLA de trailer. O stopped final é cancelamento explícito de limpeza, não fim natural comprovado. O DOM/sessão temporários foram removidos.

O Fire continua no APK anterior; tablet e celular não foram atualizados ou medidos nesta etapa. Nenhuma prova física é declarada para o novo fluxo completo Home→foco→resolver→trailer, para o carrossel2000 ou para a primeira instalação. Também não foi comprovada compatibilidade universal com todos os trailers/provedores. Vídeo bloqueado, indisponível ou lento demais conserva a imagem estática.

## 10. Falhas reais preservadas e correções

1. Após ampliar dois grants do rascunho, pretypecheck bloqueou a cadeia sem predecessor; TSC não executou nessa tentativa. Corrigido o registro legítimo, sem bypass. Todos os rascunhos anteriores permanecem no diretório de diagnóstico.
2. A primeira regressão falhou em fixture legado que não tinha o port rail-pagination. Foram acrescentados somente os ports previstos e alias, preservando assertions. Dois fixtures standalone extras também falhavam na base recebida por dependências content-adult-policy/tmdb-metadata: a falha anterior foi reproduzida por leitura e os ports reais foram acrescentados. A baseline canônica obrigatória foi3/3 PASS; não se atribui PASS aos standalone anteriores.
3. Depois de uma cadeia completa PASS, browser revelou x230 em vez de referência92 no segundo card. Centralizados a propriedade da âncora e o tratamento de blur obsoleto, com novas repetições e validações completas. A regressão mais recente prevaleceu sobre os PASS anteriores. A última revisão acrescentou memória da seleção vertical e repetiu toda a cadeia R4.
4. Os harnesses tiveram erros próprios de template, retorno de DOM por CDP, limite de tempo do protocolo e alvo nativo fora do foreground. Corrigidos os harnesses; assertions/tolerâncias de produto não foram enfraquecidas. Um diagnóstico inicial selecionou Recentes, cuja ação retoma VOD, e encontrou HTTP403 sem vídeo confirmado; foi encerrado, sem atribuir o erro ao trailer. Um probe inicial não concluiu a coleta do host; os dois probes candidatos posteriores têm PASS verificável. Logs de falha permanecem, sem substituição por PASS retroativo.

## 11. Revisão React e recursos

Aplicada a skill vercel:react-best-practices: efeitos com cleanup, dependências explícitas, listeners/ResizeObserver apenas onde necessários, estado externo por useSyncExternalStore, keys estáveis e foco após commit, sem reordenação por lote, importação de mídia de terceiro adiada e um player global. A faixa não virtual preserva a estrutura de children recebida. Sem biblioteca/refactor adicional. Os observadores, timers, request e rAF da nova faixa são liberados na saída; resultados antigos não podem exibir o trailer de outra identidade.

Os testes confirmam limites lógicos, não um teto físico de RAM ou um SLA de fluidez. Categorias grandes acumulam metadados visitados em RAM, WebView pública consome recursos e a rede/provedor pode atrasar o primeiro quadro. Ainda é necessária homologação prolongada antes de declarar desempenho consolidado no Fire/Android TV.

## 12. Homologação física restante

Gerar um APK desta etapa e validar no Fire com controle real: Home/Filmes/Séries,1º/2º/10º/100º/último, alternância rápida, reverso, troca vertical/retorno, limites, Enter e Back durante timer/vídeo. Comprovar o fluxo completo de um trailer também acessível nos detalhes, fallback sem trailer/bloqueio/offline, interrupção ao trocar foco e ausência de áudio/player residual. Percorrer categoria grande por pelo menos10min medindo CPU/RAM/FPS/rede e retorno de segundo plano. Repetir touch e híbrido em tablet/celular, além de smoke de Live/VOD/ativação. Medir primeira instalação separadamente, sem limpar os aparelhos atuais sem instrução específica.

## 13. Implantação e rollback preparados

Próximo binário deve vir deste stage e dos hashes fechados: checks C11/build, cópia oficial Capacitor, registro dos plugins Browser/Filesystem/Share, testes nativos/assemble e auditoria de package/assets/permissões/certificado. Manter com.xandeflix.prebuilt, versão1.0.37/código37 atual e certificado SHA256 b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d, salvo mudança de versão expressamente tratada na etapa de build. Não reutilizar dist antigo. Entrega/instalação nova não realizadas neste ciclo; instalação em lugar deve preservar ativação, fonte e dados.

Rollback disponível: C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-capas-expansiveis-20261025.apk, SHA256 4e4862a26eeefdb239ad6ece0ea21f015c18180fcbe26fd98f013a8fd654cfed, artefato recebido e já instalado no Fire antes deste gate. A substituição em lugar, com mesma assinatura/package e sem reset, reverte o código sem migração de catálogo. O toggle de autoplay desliga somente vídeo, não reverte âncora/paginação. Não houve mudança de esquema/backend. Git add/commit/push/PR/merge/main, deploy e Supabase permanecem não executados.

## 14. Status das funcionalidades

| Funcionalidade | Status | Evidência e pendência |
| --- | --- | --- |
| Trailers automáticos | PARCIAL | Código/testes e reprodução real do adaptador PASS; falta homologar Home→resolver→card no novo APK. |
| Foco fixo | CONCLUÍDO localmente | Browser final e stress geométrico PASS; controle físico no novo APK pendente. |
| Catálogo completo por categoria | CONCLUÍDO localmente | Pager10000 e browser2000 até fim PASS,24 DOM; memória/fluidez física prolongada pendentes. |

RESULT=LOCAL_READY_VALIDATION_PASS_NEW_APK_HOMOLOGATION_PENDING. Nenhuma alegação de nova versão instalada, primeira instalação medida ou desempenho físico consolidado. Nenhum próximo desenvolvimento iniciado.
