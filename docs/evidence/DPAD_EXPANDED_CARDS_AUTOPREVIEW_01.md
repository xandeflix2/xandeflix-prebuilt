# CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01 — especificação anterior ao código — 2026-10-25

Pedido anexado autoriza auditoria/implementação/validação/preparação de implantação local. Nova emenda isolada após entrega D-pad10s, que permanece congelada com root/L1. Repo/origin canônicos xandeflix2/xandeflix-prebuilt; branch fix/source-output-format-recovery, HEAD d8a7410, main b3fc8d1 preservada.33 recibos/908 protegidos/182 controles/29 suítes/239 testes Android38 suítes recebidos. Sem Git add/commit/push/PR/merge/deploy, backend/Supabase, fonte/credenciais/importação/identidade/ativação/C9/player principal/live/buffer, versão ou dependências.

Diagnóstico: MediaCard compartilhado e MediaRail/CatalogGrid estáveis, D-pad estrutural existente; não há modalidade global real. Catálogo VM contém IDs/tipo/poster/backdrop/ano/gêneros/sinopse. Hero/Artwork/TMDB já têm identidade estrita/caches/fila limitadas. PresentationService confirma TMDB e fornece trailers YouTube, mas perde indicação official. PublicTrailer nativo tem única WebView isolada sem bridge/arquivos e inline somente phone/modal em TV; não suporta card/mute/ended. Player principal da fonte é distinto e não será alterado.

Plano: host React único no AppShell escuta modalidade via teclas direcionais/centro e pointer/touch reais, nunca apenas resolução. Ativo somente Home/Filmes/Séries, inclusive categorias. MediaCard só emite eventos locais de foco/saída/ativação com o modelo já disponível em RAM; nenhuma nova inscrição/efeito por card. Host prepara apenas containers próximos/visíveis (IntersectionObserver) e o focado; largura normal medida do layout recebido antes da classe D-pad, aumentada20%. Modalidade touch restaura CSS/tamanhos/gestos originais, sem prévia. Identidade element+kind+id+identity evita evento tardio e reutilização entre títulos.

Rails: expansão de width/flex em180ms, mesma altura, foco/borda e scroll para manter card inteiro. Grid: tracks de largura normal e reserva horizontal por linha para uma expansão; colunas calculadas uma vez por resize. Apenas vizinhos posteriores na mesma linha transladam pela diferença, sem mudar DOM/ordem/colunas no foco. Assim motor D-pad existente continua indexado e coluna preservada; sem reordenar/remontar cards, saltos de linha ou sobrepor vizinhos. Reduced motion desliga animação. CSS só entra com modo D-pad e container preparado; touch markup permanece idêntico.

Portal React não interativo dentro da área de imagem do botão focado: backdrop via DetailBackdrop/Artwork/identidade estrita existentes e fallback proporcional; metadados opcionais estáticos, título/gênero originais permanecem no rodapé. Não sobrepor texto/controles ao vídeo oficial. Temporizador3s antes de buscar trailer; somente previewTrailer oficial selecionado dos dados públicos TMDB (YouTube Trailer, official=true e ID11), tmdbId confirmado igual ao match. Nenhuma URL de filme/episódio/playlist é usada; catálogo atual não possui preview de episódio validado, portanto nesses casos imagem estática.

Sessão global única, cancelamento síncrono ao blur/Enter/Back/pointer/ocultar página/saída, geração/token após cada await e operações nativas serializadas. Sem rede de vídeo nos3s ou em navegação rápida; sem download/cache de vídeo, loop ou retry automático. Startup máximo8s, duração45s, erro/bloqueio/sem mídia/viewport insuficiente volta à imagem sem texto de erro. Futuro toggle de habilitação exposto na política da sessão, sem nova UI de configurações agora. SDK oficial YouTube web carregado somente após3s; mute/autoplay/disablekb/controls0, eventos playing/ended/error/autoplayblocked reais, não tratar onLoad como reprodução.

Emenda explícita relacionada PublicTrailer: novo modo card, mínimo200×200, ID/sessão/bounds/HTTPS isolados intactos; HTML card muted, evento ended/autoplayblocked, WebView sem foco e transparente até playing, depois vídeo sem UI externa. Inline phone e modal anteriores preservados por overload html(id) e testes históricos. Sem strings/URLs arbitrárias ou mudanças no player da fonte. Referências primárias consultadas: https://developers.google.com/youtube/iframe_api_reference e https://developers.google.com/youtube/player_parameters (viewport mínimo200×200, muted autoplay pode ser bloqueado).

Baseline fresh antes do patch canon:check,canon:test,C11. Testes novos de sessão com relógio/ports controlados: <3s/3s, troca rápida, cancel durante async/open, exclusividade, Enter prioritário, erro/timeout/limites/toggle, trailer oficial/identidade. Browser Chromium com componentes reais e mídia/metadata simuladas: Fire960×540,AndroidTV1920×1080,Home/Filmes/Séries/rail/grid,primeiro/último card/navegação/foco/Enter/Back/sem mídia,phone411 e tablet1280 touch/híbrido,cleanup e snapshots. Java política novos casos card/mute/size/ended sem remover asserts anteriores. Canon182+3 e todas29 suítes preservadas, nova suíte30. Final canon/check/test/C11/typecheck/playback/build + Android unit tests offline; preparar implantação/rollback e distinguir fixtures de hardware. APK/instalação não são esta demanda; nenhuma implantação ou teste físico fabricado.

Allowlist fechada21:
- src/ui/expanded-card-controller.ts
- src/ui/card-preview-session.ts
- src/ui/card-preview-media.ts
- src/ui/components/CardExpansion.tsx
- src/ui/components/CardExpansion.css
- src/ui/components/MediaCard.tsx
- src/ui/components/AppShell.tsx
- src/artwork/series-presentation.service.ts
- src/playback/public-trailer.bridge.ts
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicy.java
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPlugin.java
- scripts/test-dpad-expanded-cards.mjs
- android/app/src/test/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicyTest.java
- scripts/test-canonical-regression.mjs
- docs/architecture/DPAD_EXPANDED_CARDS_AUTOPREVIEW_01.md
- docs/evidence/DPAD_EXPANDED_CARDS_AUTOPREVIEW_01.md
- docs/governance/authorizations/CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Mocks antigos que não aceitem novos imports podem receber somente ports de apresentação, com emenda anterior à edição e todas assertions preservadas; não relaxar comportamento para satisfazer fixture. Registrar erros reais. Recibo34 com grants/predessores reais e SHA autorização UTF-8/LF 9bfa2adae476b3e0eaed259fbabc440df2645789a1d39e64e8ab3bdd01c53c7a (transcrição, não assinatura humana). Normativos append-only e33 recibos anteriores byte-idênticos. Próxima implementação não iniciada.

## Solicitação

```text
# XANDEFLIX — IMPLEMENTAÇÃO DE CAPAS EXPANSÍVEIS COM PRÉ-VISUALIZAÇÃO AUTOMÁTICA

**DEMANDA:** D-PAD-EXPANDED-CARDS-AUTOPREVIEW-01  
**REFERÊNCIA VISUAL:** Imagem da interface Netflix fornecida pelo solicitante  
**TIPO:** Implementação funcional, visual e de navegação  
**PRIORIDADE:** Alta  
**PLATAFORMAS-ALVO:** Fire Stick, Android TV, Smart TVs e dispositivos com navegação D-pad

## 1. OBJETIVO PRINCIPAL

Implementar no Xandeflix uma experiência de navegação semelhante à Netflix para dispositivos operados por controle remoto D-pad.

Quando o usuário navegar pelas capas de filmes ou séries utilizando o controle remoto, o conteúdo selecionado deverá apresentar uma transformação visual automática, expandindo-se horizontalmente e exibindo uma imagem de fundo em formato paisagem.

Após 3 segundos de permanência do foco sobre o conteúdo, deverá iniciar automaticamente a reprodução de um trailer ou prévia do episódio, quando houver mídia compatível e autorizada disponível.

Adicionalmente, aumentar o tamanho padrão das capas exclusivamente nas interfaces destinadas à navegação D-pad.

**IMPORTANTE:** A implementação deve respeitar a arquitetura atual do Xandeflix, preservar a navegação existente e não modificar negativamente a experiência de celulares e tablets com interface touchscreen.

## 2. COMPORTAMENTO DAS CAPAS EM DISPOSITIVOS D-PAD

### 2.1. Estado normal — Sem seleção

As capas deverão:

- Permanecer no formato vertical tradicional.
- Apresentar dimensões maiores que as atuais em interfaces D-pad.
- Preservar a proporção original das imagens.
- Manter espaçamentos uniformes e navegação horizontal.
- Respeitar as margens da tela, evitando cortes.
- Não prejudicar a visualização das capas adjacentes.

O aumento deverá ser responsivo, considerando resolução, proporção de tela e espaço disponível.

Como referência inicial, avaliar um aumento aproximado entre 15% e 25% sobre as dimensões atuais, ajustando conforme a capacidade visual de cada dispositivo.

### 2.2. Estado selecionado — Expansão horizontal

Quando uma capa receber o foco do D-pad:

1. Expandir visualmente a capa selecionada, transformando o cartão vertical em um cartão horizontal.
2. Carregar a imagem horizontal correspondente ao conteúdo, preferencialmente o backdrop oficial do catálogo.
3. Aplicar uma animação suave de expansão.
4. Destacar o cartão selecionado por meio de borda, iluminação ou outro indicador de foco compatível com a identidade visual do Xandeflix.
5. Manter as capas vizinhas organizadas no mesmo carrossel.
6. Preservar a posição de navegação, evitando saltos e deslocamentos inesperados.

O cartão expandido poderá apresentar, quando disponíveis:

- Imagem horizontal do filme ou série.
- Título.
- Ano de lançamento.
- Gênero.
- Classificação indicativa.
- Sinopse resumida.
- Temporadas, quando aplicável.

A composição deverá seguir a referência visual enviada, adaptada à identidade gráfica do Xandeflix.

## 3. REPRODUÇÃO AUTOMÁTICA APÓS 3 SEGUNDOS

Ao receber foco, iniciar um temporizador de 3 segundos.

Durante esse intervalo, exibir a imagem horizontal correspondente ao conteúdo.

Caso o foco permaneça sobre o mesmo cartão durante os 3 segundos completos, iniciar a pré-visualização automaticamente, sem exigir Enter / OK.

### 3.1. Ordem de preferência da mídia

1. Trailer oficial existente no catálogo ou na integração de metadados.
2. Vídeo de pré-visualização associado ao conteúdo.
3. Prévia de episódio disponibilizada por fonte autorizada e compatível.

Não utilizar um arquivo completo de filme ou episódio como prévia indiscriminadamente, nem iniciar a reprodução integral por engano.

A utilização de trechos de episódios somente deverá ocorrer quando houver suporte técnico, disponibilidade e autorização adequados.

### 3.2. Reprodução da prévia

- Iniciar preferencialmente sem áudio, respeitando as restrições de autoplay dos dispositivos.
- Não abrir a tela completa do player.
- Reproduzir o vídeo dentro da área horizontal expandida.
- Não apresentar a barra de controles do player principal.
- Evitar telas pretas, carregamento excessivo ou travamentos.
- Se a prévia não puder ser reproduzida, manter a imagem horizontal estática.
- Permitir futura configuração para habilitar/desabilitar prévias automáticas.

A duração da prévia deverá respeitar a fonte disponível e o mecanismo existente, sem introduzir reprodução infinita ou reinícios desnecessários.

## 4. CANCELAMENTO IMEDIATO DA PRÉVIA

Ao mover o D-pad para outro conteúdo:

1. Cancelar qualquer temporizador pendente.
2. Interromper imediatamente a prévia anterior.
3. Liberar os recursos de mídia associados.
4. Restaurar o cartão anterior ao tamanho vertical.
5. Expandir o novo cartão selecionado.
6. Reiniciar a contagem de 3 segundos exclusivamente para o novo conteúdo.

A troca rápida entre capas não poderá provocar:

- Reprodução simultânea de vídeos.
- Áudio de conteúdos que perderam o foco.
- Acúmulo de players na memória.
- Prévia de um título aparecendo em outro.
- Travamentos ou perda do foco do D-pad.

## 5. CONTROLES DO D-PAD

Preservar a navegação intuitiva do controle remoto.

| Comando | Comportamento |
|---|---|
| Direita (→) | Selecionar a próxima capa |
| Esquerda (←) | Selecionar a capa anterior |
| Cima (↑) | Navegar para a seção superior |
| Baixo (↓) | Navegar para a seção inferior |
| Enter / OK | Abrir os detalhes do conteúdo selecionado |
| Voltar / Back | Manter o comportamento de navegação existente |

Durante o processo de expansão e reprodução da prévia, o D-pad deverá permanecer totalmente responsivo.

A navegação não poderá ficar bloqueada aguardando o carregamento do vídeo.

O comando Enter / OK deverá ter prioridade sobre o temporizador de prévia, abrindo imediatamente o conteúdo selecionado e encerrando a reprodução de pré-visualização.

## 6. DIFERENCIAÇÃO ENTRE DISPOSITIVOS

**REGRA OBRIGATÓRIA: o aumento das capas e a expansão automática devem ser aplicados exclusivamente ao modo de navegação D-pad.**

O agente deverá examinar como o projeto identifica atualmente os dispositivos e os mecanismos de entrada.

Não utilizar apenas resolução de tela ou largura do viewport para determinar o tipo de navegação.

Adotar preferencialmente o mecanismo existente de identificação da modalidade de entrada, com tratamento adequado para dispositivos híbridos.

### Modo D-pad

- Capas verticais maiores.
- Expansão horizontal automática por foco.
- Imagem horizontal do conteúdo selecionado.
- Pré-visualização após 3 segundos.
- Navegação preservada pelo controle remoto.

### Modo touchscreen

- Preservar as dimensões e o layout atuais.
- Não expandir cartões automaticamente por simples toque ou rolagem.
- Não iniciar prévias pelo comportamento específico de foco D-pad.
- Preservar os gestos, cliques e transições existentes.

Nos dispositivos Android que aceitam tanto toque quanto controle físico, considerar a modalidade efetivamente utilizada, sem alterar o layout inesperadamente durante a navegação.

## 7. INTEGRAÇÃO COM O CATÁLOGO E METADADOS

Antes de implementar, o agente deverá examinar:

- Estrutura dos componentes de cards e carrosséis.
- Fontes de dados e metadados disponíveis.
- Integração atual com TMDB, caso existente.
- Disponibilidade de backdrop e trailers.
- Identificação única de filmes, séries e episódios.
- Mecanismos de cache de imagens e vídeos.
- Comportamento do catálogo local-first e armazenamento existente.

A imagem horizontal, os metadados e a prévia devem obrigatoriamente pertencer ao mesmo conteúdo selecionado.

Não permitir associações incorretas entre título, imagem, vídeo e identificador.

Se não houver imagem horizontal, utilizar um fallback visual proporcional e adequado, sem distorcer a capa vertical.

Se não houver trailer ou prévia compatível, manter o cartão horizontal com a imagem estática.

Não adicionar serviços pagos, novas credenciais ou dependências externas sem necessidade comprovada.

## 8. OTIMIZAÇÃO PARA FIRE STICK E DISPOSITIVOS LIMITADOS

Esta etapa é obrigatória.

Considerando que o Xandeflix deverá funcionar em dispositivos com recursos limitados, implementar a expansão e reprodução automática sem comprometer o desempenho.

Requisitos:

- Manter no máximo uma prévia ativa.
- Cancelar carregamentos obsoletos quando possível.
- Evitar downloads antecipados de múltiplos trailers.
- Reaproveitar imagens em cache quando disponível.
- Evitar recriações desnecessárias de componentes.
- Liberar memória ao perder foco ou sair da tela.
- Preservar fluidez e estabilidade dos carrosséis.
- Evitar consumo de rede desnecessário.
- Respeitar as limitações de autoplay e codecs do dispositivo.
- Não comprometer a hidratação e inicialização do catálogo local.

Se o dispositivo não suportar reprodução de prévias de forma estável, manter a expansão horizontal com imagem estática, sem bloquear a interface.

## 9. ESCOPO DA IMPLEMENTAÇÃO

Aplicar o comportamento de forma consistente aos componentes compartilhados de filmes e séries utilizados na Home e nos catálogos correspondentes, respeitando as diferenças de layout entre as telas.

Não alterar o comportamento dos canais de TV ao vivo.

Não modificar o player principal de filmes e séries, exceto onde for estritamente necessário para assegurar que a prévia seja encerrada antes da abertura do conteúdo.

Não interferir nas regras existentes de autenticação, importação de fontes, reprodução de mídias ou integração Supabase.

## 10. TESTES DE ACEITAÇÃO

| Teste | Resultado esperado |
|---|---|
| Foco em capa vertical | Expande horizontalmente |
| Foco mantido por menos de 3 segundos | Exibe apenas a imagem |
| Foco mantido por 3 segundos | Inicia prévia, se disponível |
| Troca de foco antes de 3 segundos | Cancela prévia pendente |
| Troca de foco durante a reprodução | Interrompe vídeo anterior |
| Conteúdo sem trailer | Permanece com imagem horizontal |
| Pressionar Enter / OK | Abre detalhes imediatamente |
| Navegar rapidamente pelo carrossel | Não perde foco nem trava |
| Uso em Fire Stick | Mantém fluidez e responsividade |
| Uso em Android TV | Mantém navegação D-pad |
| Uso em celular touchscreen | Preserva comportamento atual |
| Uso em tablet touchscreen | Preserva comportamento atual |
| Metadados do conteúdo | Imagens e prévias correspondem ao título |
| Voltar ou sair da página | Encerra prévia e libera recursos |

Criar ou atualizar testes automatizados para os comportamentos implementados.

Identificar expressamente os testes que exigem equipamentos físicos.

## 11. EXECUÇÃO AUTÔNOMA PELO CODEX

O agente está autorizado a analisar o projeto e implementar a funcionalidade no workspace correto, com autonomia técnica para resolver problemas diretamente relacionados à demanda.

Sequência de trabalho:

**FASE A — Auditoria**

- Identificar repositório, branch e commit atual.
- Verificar estado do Git e alterações preexistentes.
- Inspecionar componentes existentes e fluxos D-pad.
- Identificar os serviços de imagem, metadados e prévias.
- Apresentar diagnóstico da arquitetura relevante.

**FASE B — Implementação**

- Implementar aumento responsivo das capas no modo D-pad.
- Implementar expansão horizontal.
- Implementar carregamento da imagem backdrop.
- Implementar temporizador de 3 segundos.
- Implementar reprodução automática de prévias disponíveis.
- Implementar cancelamento e limpeza de recursos.
- Preservar os demais modos de entrada.

**FASE C — Validação**

- Executar testes automatizados.
- Validar compilação e análise estática.
- Verificar compatibilidade com as rotas existentes.
- Verificar regressões de foco, catálogo e reprodução.
- Identificar e corrigir problemas relacionados à alteração.
- Registrar resultados e limitações dos testes físicos.

**FASE D — Preparação da implantação**

- Consolidar alterações estritamente necessárias.
- Documentar as mudanças e dependências.
- Preparar procedimento de implantação e rollback.
- Confirmar compatibilidade com a estrutura atual.
- Não executar deploy em produção, merge ou outras alterações remotas irreversíveis sem aprovação expressa após os testes.

## 12. RELATÓRIO FINAL OBRIGATÓRIO

Ao concluir, apresentar:

1. Repositório, branch e commit-base utilizados.
2. Diagnóstico da implementação anterior.
3. Arquivos criados ou modificados.
4. Descrição técnica da funcionalidade implementada.
5. Origem das imagens horizontais e prévias.
6. Estratégia de identificação de dispositivos D-pad.
7. Testes executados, com resultados.
8. Avaliação de desempenho e consumo de recursos.
9. Pendências de validação física no Fire Stick e Android TV.
10. Procedimento para implantação e reversão.
11. Status final: IMPLEMENTADO, PARCIAL ou BLOQUEADO, com justificativa.

## 13. CRITÉRIO FINAL DE APROVAÇÃO

A implementação somente estará tecnicamente concluída quando o comportamento abaixo for comprovado:

**Em dispositivos D-pad:** as capas aparecem maiores; ao selecionar um filme ou série, o cartão se expande horizontalmente e exibe sua imagem de fundo; após 3 segundos, uma prévia inicia automaticamente se estiver disponível; ao navegar para outra capa, a prévia anterior é encerrada e o novo cartão assume o foco.

**Em dispositivos touchscreen:** o comportamento e as dimensões atuais permanecem preservados.

A funcionalidade deverá seguir a referência visual apresentada, mantendo a identidade Xandeflix e sem prejudicar estabilidade, desempenho, catálogo ou reprodução.

**ORDEM FINAL AO AGENTE:** analisar, planejar, implementar, validar e preparar a implantação da funcionalidade, conduzindo autonomamente as etapas técnicas relacionadas e comunicando bloqueios reais, sem presumir sucesso de testes que não tenham sido efetivamente executados.```


## CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01 — registro — 2026-10-25

Solicitação/especificação/allowlist21 precederam patch, baseline fresh canon/check/test/C11 exit0 (182 controles/29 suítes). Novo preview oficial opcional não muda trailer manual. Host único por shell, eventos locais de MediaCard, modalidade real e grid estável com reserva lateral. Três negativos e nova suíte30,33 recibos anteriores preservados. Primeiro teste novo revelou fila Promise vazia por cancelamentos sem mídia; cancel agora só encadeia fechamento assíncrono real, mesmos asserts. Suíte focada13 passou. Pretypecheck inicial foi bloqueado pelo canon antes do registro desta emenda; tsc não executou, nenhum hook/verificador contornado. Falhas registradas, não são PASS nem RED histórico. Validação integral/browser/Android ainda PENDING. Auth SHA256 9bfa2adae476b3e0eaed259fbabc440df2645789a1d39e64e8ab3bdd01c53c7a.


## Refinamento de identidade antes da validação final

Browser inicial8 cenários PASS: Fire110→132px,desktop/tablet180→216px, expansão/3s/sessão única/Enter/sem trailer/bloqueio/touch/híbrido. Primeiro harness falhou EXPANDED porque usou Baixo para sair do menu lateral; o motor existente usa Direita. Corrigido somente o gesto do harness, sem mudar produto/asserts. Após inspeção, evento de identidade pública do card e verificação após awaits/mutação cancelam preview se catálogo atualizar o mesmo nó; Tab/wheel também restauram modalidade não-Dpad. Badge/ano antigos ocultos na superfície expandida para não cobrir vídeo, cards nunca remontados. Rascunho34 de recibo/registro preservado; hashes atualizados só desta emenda ainda em andamento,33 recibos históricos intocados. Final completa e nova QA ainda pendentes.


## Adjudicação nominal de port legado antes da edição — allowlist22

Primeira validação completa passou canon:check, mas canon:test falhou ao renderizar AppShell no fixture test-c107-fire-hero-metadata.mjs: novo CardExpansionHost estava undefined no mock. Oito asserts funcionais anteriores desse cenário passaram antes da falha de tipo React; suítes restantes ficaram NOT_RUN, não são PASS. Acrescentar somente port CardExpansionHost:()=>null no mock, sem alterar assertions, execução ou produto para satisfazer fixture. Demanda nova continua testada no componente real/browser. Incluir esse único script na allowlist22 e no grant34 com predecessor real;33 recibos históricos permanecem imutáveis. Preservar primeira validação/log/rascunhos e repetir seis comandos e Android completos.


## CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01 — fechamento local — 2026-10-25

IMPLEMENTADO_LOCALMENTE_VALIDACAO_AUTOMATIZADA_PASS_HARDWARE_PENDENTE. Baseline fresh3/3 exit0; segunda validação completa6/6 exit0, sessão13 casos PASS e Android242 testes/38 suítes sem falhas/erros/skips.914 protegidos/34 recibos/185 controles/30 suítes; todos182 controles/29 suítes e33 recibos recebidos preservados. Primeira validação final falhou em port de mock legado, corrigido em allowlist22 antes da repetição integral, sem alterar assertions. Browser8+3 cenários de componentes reais com mídia/metadata simuladas e Java HTML QA PASS; não são testes físicos ou rede real. Caps20% somente D-pad, expansão/backdrop, trailer público oficial mudo após3s, sessão única/8s startup/45s lifetime, Enter e cleanup. Root/L1 e entrega recebida congelados, prefixos normativos preservados. Relatório completo C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/expanded-cards-20261025/REPORT.md; auth SHA256 9bfa2adae476b3e0eaed259fbabc440df2645789a1d39e64e8ab3bdd01c53c7a; recibo blobLF 8d031488e5175dc1a0fbca3246345be638074fe7. Nenhum APK/install/ADB/reset, Git add/commit/push/PR/merge, remoto/deploy/Supabase ou próxima implementação. Homologação Fire/Android TV e touch híbrido pendente.


# Capas expansíveis e prévia automática — relatório final

Data: 25/10/2026. Gate: CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01.

**Status: IMPLEMENTADO LOCALMENTE; homologação física pendente.** Os comportamentos foram demonstrados por testes unitários, compilação e componentes reais em Chromium com portas de imagem/metadados/mídia simuladas. Nenhuma reprodução em aparelho físico é declarada. Não foi gerado APK desta funcionalidade nem instalada esta etapa.

## Identidade, estado inicial e proveniência

Repositório: https://github.com/xandeflix2/xandeflix-prebuilt.git. Branch: fix/source-output-format-recovery. HEAD Git: d8a74102124fbb8a3f013f6fd8a502519c1db4b8. Main/baseline: b3fc8d1e3844bc5601813ab1b298289af5b3f1fd. Local de implementação: C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/expanded-cards-20261025/workspace. O commit Git sozinho não representa toda a versão: a base operacional recebida é o estágio encerrado C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/vod-dpad-apk-20261025/workspace, com os 33 recibos e melhorias locais anteriores. Root/L1, a base recebida e a entrega APK anterior foram preservados por comparação de hashes; index vazio. Sem Git add/commit/push/PR/merge, publicação ou alterações remotas.

Pedido anexado normalizado UTF-8/LF: SHA256 9bfa2adae476b3e0eaed259fbabc440df2645789a1d39e64e8ab3bdd01c53c7a. Transcrição integral em AUTHORIZATION.txt e na evidência. É proveniência da instrução, não assinatura humana. Recibo 34: blob LF 8d031488e5175dc1a0fbca3246345be638074fe7; SHA256 2cd0b0cf42dc3773f31892646ba9e1a6b411fdee8be17024d71ce1df2f38f9de. Grants before/after e predecessores constam no recibo e REGISTERED.json. Os 33 recibos anteriores são idênticos. Allowlist exata: 22 caminhos; quatro documentos normativos append-only.

## Diagnóstico da implementação recebida

MediaCard já era compartilhado entre carrosséis e grades. O motor D-pad estrutural e a ordem dos elementos estavam consolidados, mas não havia expansão com uma sessão global de prévia por foco nem modalidade real de entrada para essa experiência. Artwork/DetailBackdrop/TMDB já protegiam identidade, caches e filas. O serviço de apresentação oferecia trailer manual, mas não distinguia um trailer oficial opcional para autoplay. O PublicTrailer Android já possuía uma WebView pública isolada e modos manual inline/modal; não havia modo card mudo e finito. A alteração reutiliza essas peças e mantém o motor de navegação.

## Funcionalidade implementada

Em Home, Filmes e Séries, setas direcionais ativam o modo D-pad real. Cards normais ficam 20% mais largos, mantendo a proporção da capa; o selecionado expande para paisagem com animação de 180 ms e destaque de foco. Grades reservam espaço por linha e deslocam apenas vizinhos posteriores, sem reordenar/remontar cards ou mudar colunas ao trocar foco. Carrosséis mantêm o selecionado visível, inclusive o último card. Reduced motion desliga a animação.

Um único host React faz a delegação de eventos; não há nova assinatura/efeito por card. Toque, pointer, wheel ou Tab restauram o layout recebido; largura da tela não decide a modalidade. Híbridos usam a entrada efetivamente utilizada. Enter/OK preserva a ação original de detalhes e cancela a prévia antes da navegação. Voltar mantém o fluxo existente e encerra a prévia.

Cada foco cria uma concessão única. Durante 3 segundos aparece apenas a imagem. Após esse prazo começa a resolução e abertura assíncrona da prévia, se disponível; o tempo de rede pode adiar o primeiro quadro. O vídeo só substitui a imagem no evento real playing. Inicialização tem limite de 8 segundos; reprodução termina em até 45 segundos ou antes em ended/erro. Sem loop, retry automático ou vídeo completo da fonte. Falta de trailer, bloqueio de autoplay, offline, vídeo incompatível ou viewport insuficiente mantêm a imagem estática, sem bloquear a navegação.

Blur, troca de título/identidade, Enter, Back, saída da página, janela oculta ou mudança de modalidade abortam timers/abertura e liberam o player. Identidade do elemento e geração são conferidas após cada await; o ID TMDB confirmado deve coincidir com o da apresentação. Existe somente uma concessão global; operações de mídia são serializadas e resultados obsoletos descartados.

## Origem das imagens e prévias

O backdrop usa DetailBackdrop/Artwork e a identidade estrita já existente, com dados da fonte ativa e correspondência TMDB. Na ausência de paisagem adequada, a capa é usada proporcionalmente. Trailer vem dos vídeos públicos associados ao mesmo ID TMDB: YouTube, tipo Trailer, official=true e ID validado de 11 caracteres. O trailer manual mantém sua seleção anterior. O modelo atual não oferece clips de episódios previamente validados; nesses casos permanece a imagem, sem usar URLs integrais de filme/episódio.

Android usa a WebView PublicTrailer separada, sem bridge JavaScript/Capacitor, acesso a arquivos ou conteúdo local, mantendo validações HTTPS/ID/sessão/bounds. O novo modo card é mudo, não recebe foco e permanece invisível até playing. O HTML dos modos manuais anteriores foi comparado byte a byte com o recebido e é idêntico. Web carrega a API oficial YouTube apenas quando uma prévia é solicitada. Não foram adicionados pacotes, serviços pagos ou credenciais.

Referências técnicas consultadas: [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference), [parâmetros do player](https://developers.google.com/youtube/player_parameters). A reprodução automática real depende das políticas/disponibilidade do provedor e do dispositivo; a imagem estática é o fallback implementado.

## Arquivos

| Caminho | Alteração |
| --- | --- |
| `src/ui/expanded-card-controller.ts` | Criado |
| `src/ui/card-preview-session.ts` | Criado |
| `src/ui/card-preview-media.ts` | Criado |
| `src/ui/components/CardExpansion.tsx` | Criado |
| `src/ui/components/CardExpansion.css` | Criado |
| `src/ui/components/MediaCard.tsx` | Modificado |
| `src/ui/components/AppShell.tsx` | Modificado |
| `src/artwork/series-presentation.service.ts` | Modificado |
| `src/playback/public-trailer.bridge.ts` | Modificado |
| `android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicy.java` | Modificado |
| `android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPlugin.java` | Modificado |
| `scripts/test-dpad-expanded-cards.mjs` | Criado |
| `android/app/src/test/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicyTest.java` | Modificado |
| `scripts/test-c107-fire-hero-metadata.mjs` | Modificado |
| `scripts/test-canonical-regression.mjs` | Modificado |
| `docs/architecture/DPAD_EXPANDED_CARDS_AUTOPREVIEW_01.md` | Criado |
| `docs/evidence/DPAD_EXPANDED_CARDS_AUTOPREVIEW_01.md` | Criado |
| `docs/governance/authorizations/CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01.json` | Criado |
| `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md` | Append somente |
| `docs/STATUS.md` | Append somente |
| `docs/EVOLUTION_REPORT.md` | Append somente |
| `docs/ERRORS_AND_BLOCKERS.md` | Append somente |

Os 11 arquivos de produção abrangem controlador de modalidade/geometria, sessão global, adaptador de vídeo público, host/portal/CSS, eventos locais dos cards, montagem no shell, trailer oficial opcional e modo card nativo. O fixture legado recebeu somente um port para CardExpansionHost; suas assertions foram verificadas idênticas. O runner acrescentou três proteções e uma suíte; nenhuma suíte anterior foi removida.

## Testes e resultados reais

| Execução | Comando | Exit code |
| --- | --- | --- |
| baseline-canon | `cmd.exe /d /s /c npm run canon:check` | 0 |
| baseline-regression | `cmd.exe /d /s /c npm run canon:test` | 0 |
| baseline-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 |
| retry-01-canon-check | `cmd.exe /d /s /c npm run canon:check` | 0 |
| retry-02-canon-test | `cmd.exe /d /s /c npm run canon:test` | 0 |
| retry-03-c11-new-device-lock | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 |
| retry-04-typecheck | `cmd.exe /d /s /c npm run typecheck` | 0 |
| retry-05-playback-check | `cmd.exe /d /s /c npm run playback:check` | 0 |
| retry-06-build | `cmd.exe /d /s /c npm run build` | 0 |
| retry-session | `C:\Program Files\nodejs\node.exe scripts/test-dpad-expanded-cards.mjs` | 0 |
| retry-native | `cmd.exe /d /s /c gradlew.bat --offline --no-daemon --max-workers=2 --console=plain testDebugUnitTest` | 0 |

Resultado final: 914 arquivos protegidos, 34 recibos, 185 controles canônicos e 30 suítes PASS. Todos os 182 controles e 29 suítes anteriores continuam nominalmente preservados. Android: 242 testes em 38 suítes, zero falhas, erros ou skips. Os 239 anteriores permanecem; três casos foram acrescentados à política PublicTrailer. Compilação Java nativa e build web concluídos; não houve assemble de APK nesta etapa.

Suíte nova: 13 cenários de sessão/relógio/portas controladas, incluindo 3 segundos, 100 focos rápidos, cancelamentos durante resolução/abertura, exclusividade, timeout, duração finita, indisponibilidade, toggle, trailer oficial e identidade. O teste usa relógio controlado para comportamento temporal, não é medição de hardware.

Chromium com componentes reais e infraestrutura simulada: 8 cenários PASS — Home Fire 960×540; grade Filmes 1920×1080 com porta YouTube; grade Séries 1280×800 com porta nativa; ausência de trailer; autoplay bloqueado; celular touch 411×807; tablet touch 1280×800; tablet híbrido. Cards 110→132 px e 180→216 px, expansão paisagem, sem sobreposição de vizinhos, um player no máximo, Enter imediato e fallback estático foram verificados. Touch manteve dimensões e ação de clique anteriores.

Três cenários adicionais PASS: 11 mudanças direcionais em 489.9 ms no navegador de teste, zero aberturas durante a sequência, último card inteiro visível e navegação vertical preservada; identidade alterada durante resposta pendente descartou o vídeo; Tab restaurou a modalidade normal. Saída liberou player/iframe/portal. BROWSER_QA.json, BROWSER_STRESS.json e screenshots registram as fixtures, sem alegação de desempenho Fire real. Nenhum request à fonte ativa foi feito pelo harness.

Java HTML QA compilou a política recebida e atual; o HTML manual é idêntico. Executou o JavaScript efetivamente gerado para card em VM com a porta YouTube simulada e confirmou mute, playing/ended/autoplayblocked e encerramento aos 45.000 ms. Isso não valida decoder ou rede físicos.

## Falhas encontradas e correções

1. Checagem inicial via npm typecheck foi bloqueada pelo hook canônico antes de registrar a nova emenda. TSC não executou nessa tentativa; não houve bypass. Registro legítimo posterior e execução completa passaram.
2. Primeiro teste novo encontrou encadeamento desnecessário de Promises ao cancelar focos sem mídia. Produto corrigido para encadear apenas fechamento assíncrono real, mantendo as assertions; 13 cenários passaram depois.
3. Primeiro harness de navegador usava seta Baixo para sair da barra lateral, mas o motor recebido usa Direita. Corrigido o gesto de teste, sem mudar o motor.
4. Primeira validação final: canon:check exit0; canon:test exit1 no fixture antigo que não exportava CardExpansionHost. Oito assertions do cenário passaram antes do erro React. Restantes não executadas nessa tentativa, sem PASS fabricado. Scope ampliado nominalmente de 21 para 22 antes da edição; adicionado só o mock port. Toda a validação completa foi repetida e passou.
5. Harness adicional de stress inicialmente consultou qa antes da página montar e depois uma sequência CDP tomou tempo suficiente para iniciar a prévia após ficar no último card. Ajustado o harness para aguardar montagem e enviar uma sequência temporizada dentro do navegador; medido o intervalo abaixo de 3 s. Nenhum timeout/assert de produto foi relaxado. Registro desses erros é auxiliar, não uma regressão histórica ou RED pré-patch.

## Recursos, desempenho e revisão React

Limites: um vídeo, espera de 3 s, início máximo de 8 s, vida máxima de 45 s, zero prefetch de vídeo em navegação rápida, nenhum cache persistente novo de mídia. Imagens/metadata reutilizam as filas/caches limitadas já existentes. O serviço de apresentação conserva cache RAM de 64 entradas, dois requests simultâneos e fila limitada a 32. Timers, observadores, listeners, iframe e WebView são liberados; cargas assíncronas já compartilhadas podem concluir, mas não podem exibir mídia obsoleta.

Checklist aplicado da skill vercel:react-best-practices: host único e portal apenas do selecionado, identidade memoizada, efeitos com cleanup e dependências explícitas, condição barata antes de awaits, terceira parte adiada, foco/ARIA original preservado, iframe sem tabulação, sem biblioteca nova ou refactor não solicitado. CSS global novo está condicionado à modalidade e container preparado. O motor D-pad, player principal, Live, importação, autenticação, controle parental e Supabase não foram editados.

Não foram medidos RAM/CPU/FPS/bateria/tráfego real ou duração de ativação em Fire Stick/Android TV. Testes sintéticos comprovam limites lógicos e geometria, não um SLA de fluidez. Uma WebView pública pode consumir recursos relevantes em aparelhos limitados; a homologação abaixo deve confirmar a opção final.

## Homologação física pendente

Em Fire Stick e Android TV: confirmar foco pelo controle real em Home/Filmes/Séries, carrosséis e grades, primeiro/último card, Cima/Baixo/Esquerda/Direita, Enter e Back durante espera e vídeo. Usar um título com trailer oficial incorporável e outro sem trailer. Confirmar mute, primeiro quadro, retorno estático com bloqueio/offline e ausência de áudio/player residual. Fazer navegação rápida e repetição por pelo menos 10 minutos, medir CPU/RAM/FPS e verificar retorno do segundo plano. Testar autoplay/YouTube efetivos e bounds/cantos do overlay nativo nas densidades reais.

Em celular e tablet: comprovar dimensões/rolagem/toque intactos, inclusive alternância com teclado/controle físico. Validar que catálogo/ativação, Live e reprodução integral continuam com os resultados anteriores. Essas verificações exigem binário novo e hardware; não foram executadas nesta etapa.

## Implantação e reversão — preparados, não executados

Gerar o próximo APK a partir deste estágio e hashes validados: repetir build web/lock C11, cópia Capacitor e registro oficial de Browser/Filesystem/Share, testes Android e assembleDebug, auditoria de package/version/certificado/plugins/assets/permissões/privacidade. Preservar package com.xandeflix.prebuilt e assinatura local conhecida; não usar dist antigo. Somente depois entregar o arquivo e executar instalação mediante instrução correspondente. Instalação de atualização deve preservar ativação/dados, sem reset ou desinstalação automática.

Rollback completo proposto: reinstalar o APK anterior validado C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-dpad-10s-20261025.apk (SHA256 e057a523c802f84ae2c2788352493f0b3766309cd3d7255aace326adf48a35eb), mesma versão/package/certificado, com substituição em lugar e sem apagar dados. Congelado e verificado por fechamento anterior. O futuro toggle CardPreviewSession.setEnabled(false) desliga somente autoplay; reverter a expansão requer o binário anterior ou alteração própria revisada. Sem mudanças no esquema/dados, não existe migração de banco para desfazer. Publicação web/produção e operações Git permanecem separadas; nenhuma foi iniciada.

## Resultado

IMPLEMENTADO_LOCALMENTE_VALIDACAO_AUTOMATIZADA_PASS_HARDWARE_PENDENTE. Funcionalidade e limites demonstrados nos testes identificados. APK novo, instalação, publicação e homologação física não realizados. Próxima implementação não iniciada. Logs, hashes, diff e relatório encontram-se em C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/expanded-cards-20261025.
