# XANDEFLIX-UI-PERFORMANCE-RECOVERY-03 — especificação anterior ao código — 2026-10-25

Autorização nominal anexada permite implementação local, testes e relatório. Base operacional36 recibos/920 protegidos,192 controles32 suítes; APK físico ec7f53f728d3728f3e0f9756fd9a4808292c5fc6e26f7dfe8957660b1cc1569e congelado. Root10 diferenças L1 e stage recebido congelados por hash. Origin canônico, branch fix/source-output-format-recovery, HEAD d8a7410, main b3fc8d1 mantidos. Sem Git staging/commit/push/PR/merge, APK/install/reset/deploy/backend/native/dependência/versão.

Implementação: retirar animação width/flex da expansão; geometria preparada uma vez por faixa/resize e alinhamento único por índice, sem loop250ms; reduzir scans por mutações internas; host DOM persistente/reutilizado com seleção e mídia canceladas por identidade. Não compartilhar player VOD/Live. Guard de repeat55ms compartilhado, primeira tecla imediata. Preservar20 iniciais/lotes20/prefetch6/janela24/âncora/reverso/Enter/Back/touch. Limitar trabalhos de superfície fora da área visível sem reescrever importação ou eliminar paginação.

Dimensão D-pad independente da elegibilidade: Recentes ampliado mas conserva resume e exclusão de autoplay pessoal; faixas Filmes/Séries em Destaque opt-in de expansão em seus main autorizados. Favoritos inalterado. Ver todos sempre vertical, full-width responsivo e virtualizado, featured20 mantém seleção/membership real, hero próprio.

Heros: reutilizar serviço e identidade validada, tentar horizontais oficiais alternativas da mesma identidade, composição oficial vertical quando não há horizontal, fallback compacto sem painel vazio permanente. Sem arte de outro título/consulta por foco. Blur de pôster não serve como fallback permanente do cartão; papel de resolução específico sem reduzir hero global. Remover somente outlines de containers programáticos tabindex=-1, preservar foco de controles. Logo original copiada sem edição/transparência/proporção, sidebar somente. Fotos são sintomas, não causas comprovadas, não assets públicos.

Busca: mapeamento input/filtros/results/back bidirecional antes da regra espacial genérica; lembrar card válido em RAM, nenhum focus reinicia consulta, manter IME/touch. Trailer de cartão tenta após1000ms da seleção correta, opção explícita da UI preservando default genérico histórico3000ms; única concessão/cancelamento/stale identity/startup/lifetime. Reusar resolver de detalhes e fallback existente, não inferir autoplay de metadados.

Baseline fresh CANON/check/test/C11 antes de código. Medir fixture browser real antes/depois, p50/p95/p99/rAF/long frames/layout/paint/heap/CPU disponível; não equivaler desktop ao Fire. Testes negativos/assíncronos de foco/cancelamento/rotas, largura/hero/fallback/identidade, tamanho Dpad versus touch, logo bytes. Preservar192 controles32 suítes e36 recibos. Ports legados somente bindings explícitos sem relaxar assertions. Registrar recibo37 com hashes reais e nova suíte. Final13 comandos de regressão/build locais, revisão React. Piscadas: somente logs/DOM/sistema seguros sem screenshot CDP/emulação; sem causa comprovada permanece pendente, assim como60 FPS e novo binário físico10min/Phone/Tablet/TV. Plano de rollout requer autorização posterior; rollback mantém stage/APK anterior. NEXT_GATE_STARTED=NAO.

Allowlist fechada 39 caminhos; grants somente subset realmente alterado:
- src/ui/expanded-card-controller.ts
- src/ui/dpad-repeat.ts
- src/ui/search-dpad-navigation.ts
- src/ui/components/CardExpansion.tsx
- src/ui/components/CardExpansion.css
- src/ui/components/MediaRail.tsx
- src/ui/components/RecentTitles.tsx
- src/ui/pages/HomePage.tsx
- src/ui/pages/CatalogBrowsePage.tsx
- src/ui/pages/HomeCollectionPage.tsx
- src/ui/components/CategoryHero.tsx
- src/ui/components/HomeHero.tsx
- src/ui/hooks/useHeroArtwork.ts
- src/artwork/hero-artwork.service.ts
- src/ui/components/DetailBackdrop.tsx
- src/ui/components/Artwork.tsx
- src/artwork/artwork-uri.ts
- src/ui/card-preview-session.ts
- src/ui/hooks/useDpadNavigation.ts
- src/ui/pages/SearchPage.tsx
- src/ui/components/SearchInput.tsx
- src/ui/components/Header.tsx
- src/index.css
- public/xandeflix-sidebar-logo.png
- scripts/test-c11-category-rails.mjs
- scripts/test-c11-browse-featured-order.mjs
- scripts/test-c11-home-special-collections.mjs
- scripts/test-c11-home-release-notice.mjs
- scripts/test-c11-series-episode-updates.mjs
- scripts/test-c11-source-first-tmdb-artwork.mjs
- scripts/test-ui-performance-recovery-03.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/XANDEFLIX_UI_PERFORMANCE_RECOVERY_03.md
- docs/evidence/XANDEFLIX_UI_PERFORMANCE_RECOVERY_03.md
- docs/governance/authorizations/CANON-01-XANDEFLIX-UI-PERFORMANCE-RECOVERY-03.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Autorização UTF8/LF SHA256 8409bb26fd147dec97f610bc9dc7d0da69b4ec2328d48726b58a7e224b65119d. Documentos normativos append-only; verifier/workflow/authority/credenciais não alterados.

## Autorização normalizada

```text
# XANDEFLIX PREBUILT — CORREÇÃO INTEGRAL DE PERFORMANCE, NAVEGAÇÃO, HEROS, TRAILERS E INTERFACE

**GATE:** XANDEFLIX-UI-PERFORMANCE-RECOVERY-03  
**TIPO:** Correção de regressões e implementação funcional  
**PRIORIDADE:** CRÍTICA  
**REPOSITÓRIO:** xandeflix2/xandeflix-prebuilt  
**PLATAFORMA PRIORITÁRIA:** Amazon Fire Stick  
**PLATAFORMAS DE REGRESSÃO:** Android TV, Android Phone e Tablet  
**REFERÊNCIA:** Auditoria FIRESTICK-PERFORMANCE-AUDIT-01 e capturas de tela anexadas

## 1. ORDEM PRINCIPAL

O Xandeflix continua apresentando problemas significativos de desempenho, navegação e exibição visual após as últimas implementações.

As correções anteriormente solicitadas para recuperação de fluidez e meta de 60 FPS ainda não foram efetivamente aplicadas ou homologadas.

Esta ordem autoriza o agente a executar uma recuperação técnica local, orientada pelas evidências da auditoria anterior, com implementação, testes e relatório final.

**Não repetir apenas a auditoria já concluída.**

O agente deverá:

1. Verificar o estado atual do código e identificar quais correções ainda estão pendentes.
2. Consultar a auditoria de desempenho já realizada.
3. Planejar alterações pequenas, isoladas e reversíveis.
4. Corrigir os problemas descritos neste documento.
5. Executar testes automatizados e medições disponíveis.
6. Identificar quais problemas ainda exigem validação no Fire Stick físico.
7. Apresentar relatório técnico com resultados antes/depois.

Antes das alterações, respeitar integralmente a governança CANON/C11, os arquivos protegidos e os gates de autorização existentes. Se alguma alteração exigir autorização adicional, preparar essa etapa sem contornar as restrições.

Não realizar commit, push, merge, instalação de APK ou deploy em produção sem autorização expressa.

---

## 2. RECUPERAÇÃO DE DESEMPENHO E META DE 60 FPS

### 2.1. Problema

A navegação horizontal e vertical continua lenta, principalmente no Fire Stick.

A expansão horizontal da capa selecionada aparentemente contribui para o custo de renderização, mas a auditoria comprovou que o problema envolve também o alinhamento do carrossel, a remontagem dos componentes, a pintura gráfica e outras operações de processamento.

### 2.2. Correções necessárias

Utilizar os achados da auditoria como ponto de partida.

Priorizar:

- Eliminar ou reduzir animações geométricas custosas.
- Evitar animações repetitivas de width e flex-basis durante a navegação.
- Reduzir leituras consecutivas de geometria e correções de scroll.
- Reutilizar a superfície horizontal expandida, quando tecnicamente seguro.
- Evitar desmontar e recriar imagens e componentes a cada mudança de foco.
- Corrigir o tratamento de comandos repetidos do D-pad.
- Reduzir o trabalho executado na thread principal.
- Evitar observadores e listeners globais desnecessários.
- Limitar componentes e texturas fora da área visível.
- Preservar a virtualização dos carrosséis e a paginação incremental.

### 2.3. Expansão horizontal

Preservar a apresentação horizontal do título selecionado nas categorias autorizadas.

Entretanto, priorizar uma solução com cartões ou slots predimensionados, atualização de imagem e transições leves, sem cálculos geométricos excessivos.

Se a animação de expansão continuar prejudicando o desempenho, utilizar apresentação horizontal instantânea ou transição simplificada no Fire Stick.

A aparência horizontal deverá permanecer disponível, mesmo que o efeito animado precise ser reduzido.

### 2.4. Meta de FPS

A meta é alcançar navegação próxima de 60 FPS no hardware que suportar essa frequência, sem comprometer a estabilidade.

Não interpretar essa demanda como simples configuração de FPS=60.

Medir efetivamente:

- Cadência de atualização do renderer.
- Tempo de processamento de quadros.
- Frames acima de 16,7 ms e 33,3 ms.
- Latência dos comandos D-pad.
- p50, p95 e p99.
- Uso de CPU e memória.
- Custos de layout, pintura e composição.
- Comportamento durante a navegação contínua.

Comparar com os dados da auditoria anterior utilizando cenários equivalentes.

Não declarar 60 FPS atingidos sem comprovação. Caso o Fire Stick não sustente essa meta, informar o resultado real e os limites identificados.

---

## 3. CORREÇÃO DO TAMANHO DAS CAPAS EM CATEGORIAS ESPECIAIS

### 3.1. Problema identificado

As categorias:

- Recentes.
- Filmes em Destaque.
- Séries em Destaque.

Continuam exibindo capas com as dimensões anteriores à implementação de aumento dos cartões para navegação D-pad.

### 3.2. Comportamento esperado

Essas três categorias deverão adotar o mesmo padrão visual de tamanho das capas utilizado nos demais carrosséis D-pad equivalentes.

Ajustar:

- Altura.
- Largura.
- Proporção.
- Espaçamento.
- Alinhamento.
- Indicador de foco.
- Área reservada para expansão horizontal, quando aplicável.

Não aplicar tamanhos divergentes sem justificativa estrutural.

### 3.3. Regra de aplicação

O aumento é exclusivo do modo D-pad.

As interfaces touchscreen deverão preservar as dimensões e a experiência atuais, salvo correções de layout independentes dessa funcionalidade.

**Atenção:** não confundir o carrossel da categoria com sua página Ver Todos.

Nos carrosséis autorizados, a expansão horizontal continua permitida. Em Ver Todos, as capas deverão permanecer verticais.

---

## 4. REMOVER CONTORNOS BRANCOS INDEVIDOS

### 4.1. Problema

As imagens anexadas mostram contornos claros em áreas onde não deveriam existir.

O problema aparece especialmente:

- Na página Ver Todos.
- Na tela de carregamento.
- Em grandes containers de apresentação e destaque.

### 4.2. Correção

Identificar a origem desses contornos.

Investigar:

- outline.
- border.
- box-shadow.
- focus-visible.
- focus-within.
- Estados de foco herdados.
- Containers com estilos compartilhados.
- Estilos de depuração.
- Indicadores de foco aplicados incorretamente a elementos estruturais.

Remover os contornos indevidos dos containers e das molduras globais.

**Não remover indiscriminadamente os indicadores de foco.**

Os elementos interativos selecionados pelo D-pad devem continuar com indicação clara e acessível.

### 4.3. Resultado esperado

Telas de carregamento, páginas de catálogo e containers principais sem bordas brancas decorativas indesejadas.

Os cartões, botões e campos realmente focados deverão continuar visivelmente destacados.

---

## 5. CORREÇÃO DOS HEROS INTERNOS

### 5.1. Problema

O hero interno não está carregando corretamente em determinados contextos.

Os problemas foram observados em:

- Ver Todos da categoria Cinema, acessada pela Home.
- Filmes em Destaque.
- Séries em Destaque.

Em algumas situações, a interface apresenta um grande painel vazio com a mensagem de indisponibilidade de imagem TMDB.

### 5.2. Investigação

Verificar:

- Identificação correta da categoria.
- Seleção do título de destaque.
- Associação entre ID do catálogo e TMDB.
- Disponibilidade do backdrop.
- Cache de imagens.
- Resolução das URLs.
- Tratamento de falhas e timeouts.
- Seleção de conteúdo elegível.
- Diferenças entre os dados recebidos na Home e na página interna.
- Estados transitórios de hidratação do catálogo.

### 5.3. Correção esperada

Quando existir uma imagem horizontal válida para um conteúdo elegível, o hero deverá exibi-la corretamente.

Implementar uma sequência de fallback coerente, reutilizando o serviço existente:

1. Backdrop horizontal válido do conteúdo.
2. Outra imagem horizontal compatível já disponível.
3. Composição visual com arte oficial existente.
4. Layout alternativo sem hero vazio, quando não houver imagem apropriada.

Não associar imagem de outro título para preencher o espaço.

Não bloquear a página inteira por indisponibilidade do hero.

Não realizar consultas remotas repetitivas a cada foco.

A transição entre placeholder e imagem definitiva deverá evitar flashes e alterações bruscas de layout.

---

## 6. ALINHAMENTO E PREENCHIMENTO DA LARGURA EM VER TODOS

### 6.1. Problema

As páginas:

- Filmes em Destaque.
- Séries em Destaque.

Apresentam grades cujas capas não estão distribuídas adequadamente até a borda lateral direita da área útil.

### 6.2. Comportamento esperado

A grade deverá utilizar toda a largura disponível do conteúdo, respeitando apenas a barra lateral e as margens mínimas necessárias.

Implementar:

- Grade responsiva.
- Colunas distribuídas uniformemente.
- Espaçamento consistente.
- Largura calculada pela área útil.
- Ausência de margens laterais excessivas.
- Alinhamento consistente entre linhas.
- Preservação da proporção vertical das capas.
- Scroll vertical.
- Indicadores de foco sem cortes nas bordas.

Evitar containers com max-width restritivo que produzam grandes espaços vazios na lateral direita.

Ajustar a quantidade de colunas de acordo com a resolução e a modalidade de navegação.

### 6.3. Regra fundamental

Na página Ver Todos, não deve existir expansão horizontal da capa ao receber foco.

O formato tradicional de grade vertical deverá ser preservado.

A correção deverá ser aplicada de maneira consistente às demais páginas Ver Todos, sem alterar indevidamente os carrosséis horizontais da Home, Filmes e Séries.

---

## 7. CORREÇÃO CRÍTICA DE FOCO D-PAD NA BUSCA LOCAL

### 7.1. Problema identificado

Ao acessar Buscar, digitar um título e navegar até as capas dos resultados:

- O usuário consegue sair do campo de busca e acessar os resultados.
- Entretanto, não consegue retornar ao campo de busca usando o D-pad.
- Ao pressionar Cima, o foco pode ir para o botão Voltar.
- Ao tentar retornar ao campo, o foco é transferido para a lupa do menu lateral.
- Depois disso, a navegação de volta aos resultados também fica comprometida.

Isso representa uma falha no fluxo de navegação e na manutenção do foco.

### 7.2. Comportamento obrigatório

A navegação deverá funcionar de maneira bidirecional.

**Campo de busca → resultados**

- Pressionar Baixo deve permitir acessar os filtros e resultados, conforme a disposição visual.
- O foco deverá seguir uma ordem previsível.

**Resultados → campo de busca**

- Pressionar Cima a partir da primeira linha deverá permitir retornar aos filtros e ao campo de busca.
- O campo deverá receber foco corretamente.
- O texto digitado deverá permanecer intacto.

**Botão Voltar → conteúdo**

- A partir do botão Voltar, deve ser possível retornar aos elementos internos da página.
- O sistema não poderá forçar o foco para a barra lateral enquanto existir um destino válido dentro da página.

### 7.3. Requisitos técnicos

Revisar:

- Mapeamento de foco.
- Elementos focáveis.
- Navegação espacial.
- Handlers de keydown.
- Retenção do último foco.
- Ordem de tabulação.
- Traps ou boundaries de foco.
- Integração entre o campo de busca, filtros, resultados, botão Voltar e menu lateral.

Preservar o comportamento de teclado virtual em Android TV/Fire Stick e a experiência touchscreen.

Ao retornar do campo de busca para os resultados, restaurar o cartão anteriormente selecionado sempre que possível.

Não reiniciar a consulta ou perder os resultados apenas por movimentar o foco.

---

## 8. INVESTIGAÇÃO DAS PISCADAS INTERMITENTES

### 8.1. Problema

A tela do Fire Stick continua piscando ocasionalmente durante o uso do Xandeflix.

A auditoria anterior não identificou causa definitiva.

### 8.2. Ação obrigatória

Continuar a investigação sem aplicar correções especulativas.

Verificar separadamente:

- Tela preta gerada pela interface.
- Reinicialização de superfícies gráficas.
- Troca de estados de carregamento.
- Remontagem da aplicação.
- Falhas de WebView.
- Eventos de lifecycle.
- Pressão de memória e GC.
- Problemas na composição de vídeo.
- Eventos do sistema operacional.
- HDMI ou alterações de modo de exibição, somente se houver evidências.

Evitar a instrumentação que anteriormente provocou interferência na apresentação da tela.

Quando possível, utilizar logs sincronizados e gravação externa para identificar o instante da falha.

Não classificar o defeito como corrigido apenas porque não foi reproduzido em uma observação curta.

Se não houver causa comprovada, registrar pendência técnica com plano objetivo de reprodução, sem alegar resolução.

---

## 9. CORREÇÃO DAS IMAGENS HORIZONTAIS DESFOCADAS

### 9.1. Problema identificado

Ao selecionar uma capa, a apresentação horizontal eventualmente não carrega a imagem correta, permanecendo desfocada ou exibindo uma representação visual de baixa qualidade.

### 9.2. Investigação

Verificar:

- Qualidade e resolução do backdrop original.
- Papel da imagem solicitada ao TMDB.
- Dimensionamento da imagem para o cartão expandido.
- Uso indevido de thumbnails pequenas.
- Fallback de poster com blur.
- Persistência de placeholders.
- Erros de carregamento.
- Cache com referência incorreta.
- Troca de foco durante carregamento.
- Respostas assíncronas associadas a outro título.
- Falhas de decode ou apresentação.

### 9.3. Correção

Garantir que o cartão horizontal utilize uma imagem apropriada à resolução e às dimensões efetivas da área.

Utilizar a menor resolução que preserve boa nitidez na tela-alvo, evitando download e decodificação de imagens excessivamente grandes.

O sistema não deverá manter indefinidamente um placeholder desfocado quando uma imagem válida estiver disponível.

Não aplicar ampliação exagerada de poster de baixa resolução como substituto permanente de backdrop.

Preservar a associação correta entre imagem, título e metadados.

Caso não exista imagem horizontal válida, utilizar fallback visual coerente e nítido, com tratamento transparente da indisponibilidade.

Não criar requisições desnecessárias a cada troca de foco.

---

## 10. CORREÇÃO DOS TRAILERS AUTOMÁTICOS — NOVO PRAZO DE 1 SEGUNDO

### 10.1. Problema

Muitos conteúdos possuem trailer disponível por meio dos metadados TMDB e da página interna, mas esse trailer não está iniciando automaticamente no cartão horizontal do carrossel.

### 10.2. Nova regra

**Alterar o tempo de espera de 3 segundos para 1 segundo.**

Sequência esperada:

1. A capa recebe foco.
2. O cartão horizontal é apresentado.
3. Inicia-se o temporizador de 1.000 ms.
4. Permanecendo o foco sobre o mesmo título, o sistema solicita a reprodução automática do trailer.
5. O trailer é apresentado na área horizontal expandida, quando tecnicamente reproduzível.
6. Ao mudar o foco, a reprodução ou inicialização anterior é cancelada imediatamente.

O temporizador deverá começar quando o foco correto for estabelecido e não deverá reiniciar por atualizações irrelevantes de estado.

O intervalo de 1 segundo é o tempo para disparar a tentativa de reprodução, não garantia de que o primeiro quadro do vídeo será exibido em exatamente 1 segundo, pois isso também depende da origem, rede e decoder.

### 10.3. Reutilização do mecanismo existente

Inspecionar a implementação de trailers na página de detalhes e no plugin público utilizado pelo projeto.

Reutilizar, sempre que possível:

- Identificação do trailer.
- Tipo de vídeo.
- Chave ou URL.
- Identidade TMDB.
- Política de autoplay.
- Reprodução silenciosa.
- Tratamento de erros.
- Cancelamento de mídia.

TMDB pode fornecer referências a trailers hospedados por terceiros, e nem toda referência estará disponível para reprodução embutida ou automática em todos os dispositivos.

Não presumir que a existência de metadados garanta autoplay.

Identificar e corrigir falhas de integração quando o mesmo trailer for reproduzível na página de detalhes, mas não no carrossel.

### 10.4. Proteção de desempenho

Como o tempo de espera foi reduzido para 1 segundo, reforçar:

- Uma única prévia ativa.
- Cancelamento de requisições antigas.
- Ausência de múltiplas instâncias de player.
- Não inicializar o decoder para todas as capas.
- Não carregar vídeos apenas porque estão próximos do viewport.
- Descartar respostas de trailers de títulos que perderam o foco.
- Não bloquear a navegação D-pad.
- Liberar recursos ao mudar de categoria ou rota.

Essa alteração não poderá reintroduzir a lentidão que está sendo investigada.

---

## 11. SUBSTITUIÇÃO DA LOGO DO MENU LATERAL

### 11.1. Recurso fornecido

Utilizar o arquivo original anexado:

**LOGO.png**

A imagem possui fundo transparente e contém a marca estilizada em vermelho e grafite.

### 11.2. Alteração solicitada

Substituir a logo atualmente exibida no topo do menu lateral esquerdo pela nova imagem fornecida.

### 11.3. Regras visuais

- Preservar o desenho original.
- Não redesenhar a logo.
- Não modificar suas cores.
- Manter a transparência.
- Preservar proporção.
- Centralizar no espaço destinado à marca.
- Utilizar contain ou equivalente.
- Evitar distorção ou corte.
- Não aumentar desnecessariamente a largura do menu.
- Garantir boa definição nas resoluções suportadas.

O tamanho visual deverá ser adequado ao cabeçalho da barra lateral, mantendo a hierarquia dos demais ícones.

A logo deve ser atualizada exclusivamente onde esse recurso for utilizado, sem substituir automaticamente ícones de aplicativo, splash screens ou outras marcas que não estejam no escopo.

---

## 12. PRESERVAÇÃO DAS FUNCIONALIDADES EXISTENTES

As correções não poderão comprometer:

- Catálogo local-first.
- Busca local.
- Hidratação inicial.
- Importação de fontes.
- Reprodução de filmes e séries.
- Reprodução de TV ao vivo.
- Paginação incremental.
- Foco fixo dos carrosséis.
- Capas horizontais nas categorias autorizadas.
- Navegação tradicional em Ver Todos.
- Cache e validação de imagens.
- Autenticação e ativação.
- Supabase e integrações existentes.
- Experiência touchscreen.

Não remover funcionalidades para melhorar métricas de desempenho sem demonstrar a necessidade e sem respeitar o escopo aprovado.

---

## 13. ORDEM DE IMPLEMENTAÇÃO

Organizar o trabalho em etapas independentes e verificáveis.

### ETAPA 1 — Baseline e preservação

- Registrar repositório, branch, SHA e estado do Git.
- Verificar o stage operacional atual e a governança CANON/C11.
- Identificar alterações locais existentes.
- Registrar o APK de referência e os resultados anteriores.
- Definir allowlist de arquivos e rollback.

### ETAPA 2 — Recuperação de fluidez

- Aplicar otimizações de foco, renderização e expansão.
- Testar individualmente as alterações.
- Comparar métricas antes/depois.
- Preservar a navegação D-pad.

### ETAPA 3 — Correções visuais e de layout

- Padronizar dimensões em Recentes, Filmes em Destaque e Séries em Destaque.
- Remover contornos brancos indevidos.
- Corrigir alinhamento das grades Ver Todos.
- Restaurar os heros internos.
- Corrigir backdrops desfocados.
- Substituir a logo do menu lateral.

### ETAPA 4 — Navegação e trailers

- Corrigir o retorno do foco ao campo de busca.
- Corrigir a navegação entre resultados, filtros e botão Voltar.
- Ajustar trailers para espera de 1 segundo.
- Corrigir a recuperação e inicialização de trailers disponíveis.
- Verificar cancelamento e liberação de recursos.

### ETAPA 5 — Estabilidade e regressões

- Investigar piscadas com coleta não perturbadora.
- Executar testes de navegação contínua.
- Testar carregamento frio e quente.
- Verificar consumo de memória.
- Validar as funcionalidades anteriores.
- Identificar pendências de teste físico.

A execução poderá ser reorganizada por dependências técnicas, desde que cada alteração seja isolada, justificada e testada.

---

## 14. MATRIZ DE TESTES OBRIGATÓRIA

| Teste | Resultado esperado |
|---|---|
| Navegação D-pad horizontal | Resposta rápida e foco correto |
| Navegação D-pad vertical | Troca de categoria sem travamentos |
| FPS no Fire Stick | Melhoria mensurável, meta 60 quando viável |
| Expansão horizontal | Exibição correta sem animação pesada |
| Recentes | Capas no padrão ampliado D-pad |
| Filmes em Destaque | Capas no padrão ampliado D-pad |
| Séries em Destaque | Capas no padrão ampliado D-pad |
| Ver Todos | Grade vertical, sem expansão horizontal |
| Contorno branco | Ausente em containers indevidos |
| Hero de Cinema | Imagem correta ou fallback adequado |
| Hero de Filmes em Destaque | Carregamento correto |
| Hero de Séries em Destaque | Carregamento correto |
| Grades Ver Todos | Ocupam toda a largura útil |
| Busca — sair do campo | Navega até os resultados |
| Busca — voltar ao campo | Retorna pelo D-pad |
| Busca — retornar aos resultados | Recupera navegação normalmente |
| Imagem horizontal | Backdrop nítido quando disponível |
| Trailer com referência reproduzível | Tentativa de autoplay após 1 segundo |
| Troca rápida de foco | Cancela trailer anterior |
| Tela piscando | Investigação documentada e correção apenas com causa identificada |
| Logo no menu | Nova imagem original aplicada |
| Android Phone/Tablet | Sem regressões |

Não registrar PASS para testes que não foram executados.

---

## 15. RELATÓRIO FINAL OBRIGATÓRIO

Apresentar relatório com:

1. Identificação do estado inicial do projeto.
2. Relação de cada problema identificado.
3. Causa técnica confirmada ou hipótese.
4. Arquivos alterados.
5. Correção aplicada.
6. Testes executados.
7. Evidências das melhorias.
8. Métricas de desempenho antes e depois.
9. Resultado real relativo à meta de 60 FPS.
10. Situação das piscadas.
11. Situação dos trailers.
12. Validação da navegação de busca.
13. Verificação dos heros, imagens e grades.
14. Confirmação da substituição da logo.
15. Pendências de testes físicos.
16. Riscos remanescentes.
17. Plano seguro de implantação e rollback.

Para cada demanda, classificar:

- CORRIGIDO E VALIDADO.
- IMPLEMENTADO, AGUARDANDO VALIDAÇÃO FÍSICA.
- PARCIALMENTE CORRIGIDO.
- BLOQUEADO.
- NÃO INICIADO.

## 16. ORDEM FINAL AO AGENTE

Esta demanda não deve resultar apenas em novo diagnóstico.

Execute autonomamente as correções locais permitidas, reutilizando os resultados da auditoria anterior e evitando reconstruções desnecessárias.

Priorize a recuperação da fluidez no Fire Stick, mas não ignore os problemas visuais, de navegação e de trailers.

Utilize as capturas de tela fornecidas para identificar os sintomas e a logo original como recurso obrigatório para a substituição do menu.

Não faça alterações fora do escopo.

Não declare a meta de 60 FPS, a resolução das piscadas ou a reprodução dos trailers como concluídas sem evidências reais.

**NÃO REALIZAR COMMIT, PUSH, MERGE, DEPLOY OU INSTALAÇÃO DE APK SEM AUTORIZAÇÃO EXPRESSA.**

Ao terminar, apresente o relatório consolidado e a indicação precisa das ações necessárias para homologação e publicação.
```


## CANON-01-XANDEFLIX-UI-PERFORMANCE-RECOVERY-03 — registro local — 2026-10-25

Autorização nominal anexada UTF8/LF SHA256 8409bb26fd147dec97f610bc9dc7d0da69b4ec2328d48726b58a7e224b65119d. Especificação anterior ao código: docs/architecture/XANDEFLIX_UI_PERFORMANCE_RECOVERY_03.md. Recibo37 encadeia36 anteriores imutáveis, 23 grants reais. Performance/UI/Search/hero/preview1000ms/sidebar somente; sem APK/install/Git/backend. Baseline3/3 exit0; validações finais e física PENDENTES. NEXT_GATE_STARTED=NAO.


## Addendum anterior à movimentação do asset

O verificador canônico existente protege src/, mas não aceita grants public/. Sem alterar o verificador, a logo original irá para src/assets/xandeflix-sidebar-logo.png, importada por Header.tsx via Vite, em vez do public/ previsto. Allowlist substitui somente esse caminho. Mesmos bytes, sidebar somente; não amplia funcionalidade. Falha intermediária CANON_CHANGE_SCOPE_UNSUPPORTED registrada, recibo37 ainda em construção,36 antigos imutáveis.


## Addendum anterior à correção de retorno profundo — 2026-10-25

O mesmo teste browser com item561 falhou também no stage recebido imutável: durante rematerialização, offsets do documento eram reaplicados antes de haver altura/conteúdo, clampeando scroll e trocando repetidamente a janela. Após12s ainda carregava432/561 registros e foco estava BODY. É falha anterior exposta por percurso maior, não atribuída ao patch de performance. Ampliar allowlist somente com src/ui/hooks/useCatalogReturnNavigation.ts. Preservar deadline12000ms, readers/lotes/grade e todas assertions. Antes de restaurar offsets de grade windowed, aguardar materialização da identidade/linha já solicitada; depois aplicar offsets e foco uma vez. Sem aumento de timeout, fetch novo ou mudança de fonte. Adicionar teste de offsets não aplicados prematuramente + browser profundo mantendo expectativa de ID/índice/scroll.


## Addendum anterior aos bindings de três fixtures — 2026-10-25

A rodada final foi bloqueada em SERIES_POSTER_COMPOSITION pelo loader de test-c11-artwork-visible-recovery sem binding do novo guard real. Busca completa identificou também dois loaders VM do hook D-pad com imports fechados. Ampliar allowlist somente com scripts/test-c11-artwork-visible-recovery.mjs, scripts/test-c11-fire-dpad-rail-return.mjs, scripts/test-c11-fire-home-hero-dpad.mjs. Vincular helpers reais ao mesmo DOM da fixture; não alterar nenhuma assertion, timeout, lógica de navegação ou política parental. Os testes passam a executar os imports novos explicitamente. Comparação das chamadas assert por AST preservará todas as chamadas/argumentos, inclusive o reject de dependências desconhecidas. Falha final01 preservada, nova rodada completa obrigatória.


## Contrato DOM da fixture Fire — anterior ao ajuste

Execução direta no recebido imutável comprovou TypeError current.hasAttribute no teste auxiliar test-c11-fire-dpad-rail-return.mjs, anterior a este gate. A fixture representa Element, mas não implementa hasAttribute nem document.documentElement, já consumidos pelo hook recebido. Acrescentar somente essas primitivas DOM padrão, com atributos/dataset inicialmente vazios, sem substituir navegação ou relaxar assertions. Não é falha de um Element real do produto. O binding de search usa o mesmo document da VM durante chamada síncrona e restaura o global em finally; helpers reais, nenhuma resposta permissiva.


## CANON-01-XANDEFLIX-UI-PERFORMANCE-RECOVERY-03 — conclusão local — 2026-10-25

RESULT=LOCAL_IMPLEMENTATION_VALIDATED_PHYSICAL_PENDING. Implementação local concluída; 13 comandos oficiais exit0 no mesmo estado congelado, com retomada documentada da orquestração após ETIMEDOUT agregado durante site:build (não foi timeout/assertion de teste relaxado). Baseline3/3. CANON196 controles33 suítes/924 protegidos37 recibos, preservados192 controles32 suítes/36 recibos anteriores. Browser39 cenários e suíte específica11 casos PASS; fronteiras externas simuladas, não homologação física. Delta 35/43, produção21, adaptadores5; quatro prefixos normativos e bytes recebidos/root preservados; index vazio. Auth SHA256 8409bb26fd147dec97f610bc9dc7d0da69b4ec2328d48726b58a7e224b65119d, recibo blobLF 88fa16477c0f94dad02f962d7a42e26dc19f2670.

Expansão instantânea/host estável, guard repeat55ms, leituras repetidas reduzidas, tamanhos D-pad, heros oficiais/fallback, grades verticais/largura, Busca bidirecional, prévia tentativa1000ms, logo original e retorno profundo corrigidos localmente. Home vertical ainda retém seções;60 FPS/piscadas/autoplay real/Phone/Tablet/TV e tempo de primeira instalação continuam pendentes. Observação da referência reaberta 635.3s/121 amostras Home de121; amostragem leve sem imagem não exclui piscada subsegundo. Saída anterior manual confirmada pelo usuário, depois REABERTO; não classificar como crash. Sem APK/install/Git/backend/publicação. Relatório C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/ui-performance-recovery-03-20261025/REPORT.md. NEXT_GATE_STARTED=NAO.
