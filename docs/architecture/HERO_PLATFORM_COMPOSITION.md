# CANON-01-HERO-PLATFORM-COMPOSITION — especificação anterior ao código, 2026-10-23

Pedido explícito: mover a logo existente da plataforma do meta acima do título para abaixo dele, à esquerda do gênero, nos heros Home/Filmes/Séries; antecipar logo para acompanhar o restante do conteúdo. Mesma composição em todos os perfis. Reusar PlatformCategoryLogo e sua política de nomes/URLs da API, sem inferir nova disponibilidade comercial nem alterar catálogo.

Causa confirmada: usePlatformLogo espera2000ms antes de consultar mesmo um diretório público já em cache. Não há leitura síncrona de logo no primeiro render. Manter o hook opcional de disponibilidade por título com debounce250ms; mudar somente o caminho de logo. Diretório fixo BR, dedupe, credenciais, TTL7dias, cooldown/timeout/limites e validação de URLs continuam.

Implementação mínima planejada: linha flex hero-platform-genres depois do título, slot sem fundo/padding de badge e logo16px (não ultrapassa a linha existente de gênero). Parágrafo hero-genres mantém fonte/margens/texto. Linha vazia e imagem ausente não criam spacer. Ano/duração/badge de conteúdo ficam acima, callbacks e carrossel não mudam. Mover a assertion histórica de posição acima para o requisito posterior explicitamente aprovado, preservando demais controles.

Logo: peekLogo síncrono do diretório ainda válido; usePlatformLogo dispara no effect sem espera2s, mantém guarda contra resultado antigo/unmount e erro/falta de logo. HomeHero antecipa diretório e imagens de no máximo8 categorias dos candidatos enquanto suas capas são preparadas; fila de imagens no máximo8 e retenção16, timeout8s, apenas URLs de imagem validadas. Não bloquear título/hero, não aumentar o tempo da primeira carga, não fabricar logo em falha. Imagem só fica visível após seu onLoad existente; cache/prefetch permite render próximo do conjunto, mas rede fria não garante simultaneidade.

Allowlist fechada:

- src/ui/components/Hero.tsx
- src/ui/components/HomeHero.tsx
- src/ui/hooks/useWatchProviders.ts
- src/artwork/tmdb-watch-providers.service.ts
- src/index.css
- scripts/test-c107-fire-hero-metadata.mjs
- scripts/test-c107-watch-providers.mjs
- scripts/test-c136-web-hero.mjs
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-HERO-PLATFORM-COMPOSITION.json
- docs/architecture/HERO_PLATFORM_COMPOSITION.md
- docs/evidence/HERO_PLATFORM_COMPOSITION.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Base exata: APK tablet transparente bc42eea53a062ce4906920a9b16fa51caa148e6070650be5ac6b765d7ec79341;24 recibos,147 controles/24 suítes,894 protegidos,215 testes Android. Todos os arquivos da cópia foram conferidos por SHA256 com a entrega anterior e congelados em received/ nesta pasta antes de nova edição. Reutilizar workspace isolado/caches de build existentes, sem reescrever seus logs/recibos/APKs anteriores. Root ativo/L1 permanece intacto. Validações anteriores antes desta mudança continuam evidência real reutilizada, não nova execução. Rodar canon:check agora; testes dedicados antes do patch e validação completa depois.

Governança: recibo novo encadeado por caminho ao predecessor efetivo; hashes LF reais, autorização UTF-8/LF SHA256 991e26d1e09fcd6fea37f79401fdbd8aaeb9469d2256370f58ec8229259f694c. Manter todos24 recibos e147 controles; revisão nominal das assertions de posição/espera antiga apenas. Acrescentar testes de cache imediato, primeira rede, erro/cooldown, concorrência, URL insegura, carregamento de imagem e ausência/retorno velho. Não suprimir assert/skip nem mudar timeouts para passar.

Validação: canon:check/test,C11,typecheck,update/security/playback/build/site:build,contratos site/artifact/inspect/Prebuilt; testes de watch providers/metadata/carrossel; comparação de layout em navegador com e sem logo, gêneros longos/ausentes e perfis phone/tablet/Fire/TV/web. Entrega APK recuperável contextual de UI. Atualização in-place só no tablet já explicitamente autorizado nesta sequência de ajustes, mesmo package/certificado, com preservação privada antes/depois; nenhuma nova limpeza/ativação/fonte. Se não estiver acessível, registrar PENDING físico e entregar APK.

Sem commit/push/PR/main/Vercel/Supabase administrativo, player, Android source, versão, package/lock, storage privado, novos recursos de elenco/cache de conteúdo ou outro Gate. Fundo transparente tablet, recuperação streaming/HLS e ativação pública decorativa preservados. Fonte opcional de logos nunca entra na readiness canônica de catálogo/boot.


## Escopo final antes do código — antecipação no hook de capas

Evitar novo import no carrossel e alteração de seus vários testes de SSR. Antecipação opcional ficará no início do effect já existente de useHeroArtwork, após filtro parental dos candidatos, sem await e sem mudar seleção, prioridades, limite, assinatura ou readiness de imagens. HomeHero e test-c136 permanecem intocados. O primeiro hero/CategoryHero compartilham esse caminho. Trocar somente esses dois caminhos da lista candidata: useHeroArtwork no lugar de HomeHero; test-c105-artwork-background-priority no lugar de test-c136. Lista final:16 caminhos.

Teste metadata original falhou ANTES do patch por mock sem artworkCategoryContext, função existente em produção. Overlay ignorado usando a função REAL passou todos os casos; não foi mascarado como PASS do arquivo original. A correção de fixture usará o export real, além da nova assertion de posição solicitada. O teste de prioridades usa mock de porta parental desatualizado; poderá ser atualizado somente com parentalFixtureBindings existente e porta de warmup explícita, preservando todas as assertions de prioridade/retry/concurrency. Testes temporários e logs ficam em tmp. API/diretório/limites e caches de conteúdo não mudam.

- src/ui/components/Hero.tsx
- src/ui/hooks/useHeroArtwork.ts
- src/ui/hooks/useWatchProviders.ts
- src/artwork/tmdb-watch-providers.service.ts
- src/index.css
- scripts/test-c107-fire-hero-metadata.mjs
- scripts/test-c107-watch-providers.mjs
- scripts/test-c105-artwork-background-priority.mjs
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-HERO-PLATFORM-COMPOSITION.json
- docs/architecture/HERO_PLATFORM_COMPOSITION.md
- docs/evidence/HERO_PLATFORM_COMPOSITION.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Registro e plano de proteção — anterior à edição do runner

Baseline original metadata e prioridades falhou por mocks desatualizados antes de mudar produção; overlay metadata com export real passou, provider10/10 e carrossel5/5 passaram. A fixture de prioridades usa parentalFixtureBindings existente. Não tratar falhas de fixtures como regressão de código anterior nem como PASS do arquivo original. Novo código já definido no escopo final preserva os helpers reais. Acrescentar as duas suítes de metadata/logos à regressão canônica com marcadores completos no EOF, preservando todos147 controles e24 suítes anteriores (total26). Nenhuma assertion de segurança, URL, cache TTL, adulto ou carregamento de imagem será removida; a posição acima e o delay2s são substituídos somente por este pedido posterior explícito.


## Refinamento explícito de tamanho — 32 px

O usuário rejeitou o tamanho16px e pediu literalmente: “DOBRE O TAMANHO DA LOGO. AINDA ESTA MUITO PEQUENA”. Antes da edição, candidato16px, recibo, fontes, validações e instalação foram preservados em candidate16/. Alterar somente largura/altura CSS para32px, mantendo o slot à esquerda do gênero abaixo do título. A linha flex deve crescer naturalmente nos perfis compactos se necessário para evitar sobreposição: não comprimir texto nem usar posicionamento absoluto sobre título/sinopse. Conferir tablet/home/filmes/séries, celular, Fire/TV/web e ausência de logo. Manter todos os controles de carregamento antecipado e caches; atualização somente in-place do tablet, APK distinto, sem apagar dados. Recibo atual deste gate ainda não publicado pode receber novos after-hashes/autorização; preservar os24 recibos anteriores e o candidato16 arquivado.

SHA256 da autorização UTF-8/LF ampliada: 9246a30cd46b9a92d198c4cc188797240500216f84260145db8ae158ce914e16. Validações e artefato32px ainda PENDING neste registro anterior ao código.


## Correção do canto superior do tablet — especificação antes do CSS

Usuário identifica retângulo escuro atrás do X nas páginas de filmes/séries, inclusive internas. Leitura CDP real CORNER_BEFORE.json confirmou header/marca transparentes, mas a página imersiva começa44px abaixo da faixa Voltar: sua extensão à esquerda não cobre o canto superior. O ::before da page-back-row--browse começa no x80, deixando o x0–80 com o fundo escuro do shell. Estender a superfície ambiente dessa faixa até x0 para tablet lateral; incluir page-back-row--detail para a mesma lacuna nas páginas internas. Mesmo --navigation-ambient com fallback escuro seguro, pointer-events:none e isolamento atrás dos controles. Somente CSS; não mudar dimensões, posições, ícones, navegação, cor da marca, celular/TV/portrait nem contexto de dados. Registrar no mesmo gate UI local ainda não publicado, com a mesma allowlist16 e24 recibos históricos preservados. Validar antes/depois em Chrome com CSS real, cores distintas e fallback, geometria e controles; conferir as páginas reais no tablet após install-r.

O teste visual inicial32px usava estimativa nova de10px para crescimento compacto; Fire tem gênero de16.5px e a linha precisa crescer14.5px para conter uma imagem de32px. Medição foi preservada, e o critério novo foi corrigido para aumento máximo de16px, exatamente a diferença16→32; asserts de dimensão exata, abaixo do título, antes da sinopse e sem overflow permanecem. Tablet manteve o gap41px. Não houve relaxamento de teste histórico ou timeout.

Autorização literal ampliada UTF-8/LF SHA256 4e105d55c96fbd85e3c3548cb7f46c80ed9fb1bf4efdffec50a9b10551580113. Aplicação da correção/validação física ainda PENDING neste registro anterior ao código.
