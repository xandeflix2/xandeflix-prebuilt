# C91 — Carrossel de destaques nas páginas Filmes e Séries

## Autorização e preflight — 2026-10-12

Pedido explícito: aplicar a regra de destaques aleatórios/transição da Home à
página Filmes (somente filmes) e Séries (somente séries), mobile/tablet/TV, para
testar a busca manual de atualização. Ciclo local: CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Permite patch, verificação e APK15 recuperável; não
autoriza publicação no painel/Dropbox, instalação física ou Git commit/push/PR.

Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, Git independente,
main, origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture/Execution,
Source Data Boundary e Activation Lock lidos. Baseline privado com hashes
preserva os patches C11 acumulados; histórico e projeto protegido intocados.

## Especificação anterior ao código

- Listas gerais Filmes/Séries reutilizam seleção e carrossel Home existentes:
  ano vigente, fallback recente e prioridade de novos lançamentos/séries.
  Consultar índice local apenas do tipo solicitado; fallback e extras também
  filtrados antes de resolver imagens. Nunca misturar filmes e séries.
- Índice/generation e preparação segmentada existentes preservados; nenhuma
  nova busca de catálogo remoto, playlist, popular/discover ou alteração de
  catálogo/autoridade. Reaproveitar cache da geração ativa e leituras limitadas.
- Transição de dez segundos e fade existente; anterior/próximo/pausa/contador,
  seleção do título atual e foco estável. Pausa durante foco/hover, documento
  oculto, fora da tela ou movimento reduzido. Um candidato não gira; seleção
  vazia/erro conserva placeholder, sem inventar conteúdo ou impedir navegação.
- Ao abrir a lista geral, foco programático inicial permanece no main; não
  focar uma ação do carrossel sem interação, pois isso impediria a rotação.
  D-pad pode entrar nos controles existentes; foco inicial de categorias
  específicas conservado. O main não interativo não recebe contorno visual;
  controles continuam com indicação de foco. Refinamento anterior à edição.
- Celular continua vertical; tablet/TV continuam horizontais com CSS e perfil
  atuais. Página mantém h1; título do hero h2 e nome acessível por categoria.
- Categorias específicas e páginas de detalhes individuais conservam hero
  correspondente à seleção, filtros, trilhos, grid e ações existentes.
- APK interno versionCode15/versionName1.0.15, mesmo package/assinatura do14,
  updater mantido. APK privado, hash/tamanho/assinatura/assets verificados.

## Allowlist estrita

- src/catalog/home-hero.service.ts (consulta opcional por kind, default misto);
- src/ui/hooks/useHomeHero.ts (escopo opcional, default Home preservado);
- src/ui/components/HomeHero.tsx (escopo defensivo e heading/label opcionais);
- src/ui/components/BrowseHero.tsx (novo wrapper);
- src/ui/pages/CatalogBrowsePage.tsx (somente hero overview);
- src/index.css (somente contorno do main de overview não interativo);
- android/app/build.gradle (somente código/nome de versão);
- scripts/test-c11-browse-dynamic-hero.mjs (nova regressão);
- este contrato, docs/evidence/C11_BROWSE_DYNAMIC_HERO.md;
- acréscimos docs/{STATUS,EVOLUTION_REPORT,DECISIONS,ERRORS_AND_BLOCKERS}.md;
- tmp/c91-browse-dynamic-hero/**, tsconfig.tsbuildinfo e saídas usuais ignoradas
  build/Capacitor/Gradle. Sem dependências/config/ativação/backend/player/env.

## Aceitação

Regressões Home/imagens e testes de consulta tipada com outros tipos presentes,
troca de lote, cache de geração, séries recentes e fallback. Browser com TSX/CSS
reais e dados isolados em celular/tablet/TV: troca automática/manual, pausa,
foco, seleção atual, layout/imagens e empty state; Home mista preservada.
Typecheck e build/prebuild/lock antes/depois/antes de APK. Assinatura igual14,
package e versão internos verificados; assets iguais ao build cliente.
Proveniência/HEAD preservados. Evidência browser não certifica aparelho físico.
