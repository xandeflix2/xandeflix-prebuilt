# C118 — análise e correção da área de toque do hero dobrável

Pedido do usuário em 2026-10-15: analisar por que centro/laterais do hero no
Z Fold aberto/perfil tablet não abrem detalhes, enquanto cantos superiores
funcionam. Escopo: reproduzir com componentes reais/CSS e corrigir somente
interceptação de toque confirmada, conforme comportamento C106 já autorizado
para toda imagem em PHONE/TABLET, inclusive quadrado. Sem mudar layout.

Preflight C11-main ativo independente/main/origin canônicos,
HEAD0f68f169f7728fae17c8311832b7643629e97a02. AGENTS/Architecture/Execution/
Activation Lock/C106 lidos; baseline privado em tmp/c118-square-hero-hit-area.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C118; NEXT_GATE_STARTED=NAO.
Patches C107–C117 preservados; sem Git/backend/install/reset autorizados.

## Especificação anterior ao teste/código

1. Reproduzir hit-test/gestos reais no Chrome isolado em janela quase quadrada
   com Hero/HomeHero/CategoryHero e CSS reais, portas de arte/metadados simuladas.
   Medir elementos que cobrem imagem e callback por toques físicos em CDP,
   incluindo centro/laterais e cantos, sem confundir el.click com hit-test real.
2. Se conteúdo não interativo em camada superior bloquear imagem, marcar Hero
   com classe somente quando canOpenHeroArtworkDetails permite ação C106.
   Essa camada passa eventos através de espaços/metadados/textos para o botão
   de imagem existente; controles interativos preservam pointer-events próprios.
   Não elevar botão de imagem por cima de Assistir/Detalhes/dots nem aninhar
   botões, duplicar callbacks ou trocar itens/gestos/thresholds/timer/handlers.
3. Preservar UI/recorte/proporção/radial/foco/tamanho dos alvos, swipe/scroll/
   cancelamento/dots, Assistir/Detalhes e timer10s. TV/Fire/desktop sem nova
   ação como antes; abrangência PHONE/TABLET independe de formato/orientação.
   Nenhuma alteração de player/C9/source/catalog/search/ativação/perfis.
4. Criar teste de regressão por coordenadas, comparando CSS anterior e atual;
   quadrado nas duas orientações/perfis PHONE e TABLET, fechado mobile,
   tablet amplo, Home/Filmes/Séries e categoria estática. Mapa de pontos fora
   dos controles sem áreas mortas; detalhes uma vez e item atual; controles,
   swipe sem clique residual, scroll/cancel/teclado; TV/desktop sem área nova.
   Testes C106, TypeScript/build/lock26+27+9, assinatura/assets/auditoria PASS.
5. APK C118 local recuperável para revisão, mesmo package/versão/certificado
   C117, sem instalação/publicação. QA física do Z Fold continua pendente.

Allowlist estrita: src/ui/components/Hero.tsx (apenas classe condicional de
hit-area); src/index.css (pointer-events delimitados a essa classe);
scripts/test-c118-square-hero-hit-area.mjs (novo);
este contrato, docs/evidence/C11_SQUARE_HERO_HIT_AREA.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md;
tmp/c118-square-hero-hit-area e saídas usuais ignoradas build/sync/Gradle/APK.
HomeHero/CategoryHero/hooks/Android e demais fontes permanecem intocados.
