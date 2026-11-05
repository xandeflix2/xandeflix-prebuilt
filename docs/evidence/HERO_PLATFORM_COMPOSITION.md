# CANON-01-HERO-PLATFORM-COMPOSITION — evidência local

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


## Autorização transcrita

```text
AUTORIZAÇÃO DO USUÁRIO — UTF-8/LF

No hero da home, ou de filmes, ou de séries, acima do título, onde aparece os metadados ano e duração de um filme ou série, também aparece a logo da plataforma de streaming quando disponível pela API, da plataforma da qual o filme ou série é transmitida. É possível colocar essa logo abaixo do título, ao lado esquerdo do gênero, de um tamanho que não fique maior do que a distância já definida que separa o título da sinopse? A imagem em anexo mostra um modelo de como poderia ficar esta logo da plataforma de streaming posicionado dentro do hero.

COMPLEMENTO DO USUÁRIO

ATUALMENTE A LOGO DEMORA APARECER. SO APARECE APOS ALGUNS SEGUNDOS DEPOIS QUE O TITULO E SINOPSE FORAM CARREGADOS. SE POSSIVEL COLOQUE PARA APARECER COM TODOS OS ELEMENTOS DO TITULO
```

## Escopo/estado de registro



## CANON-01-HERO-PLATFORM-COMPOSITION — 2026-10-23

Usuário pediu logo abaixo do título à esquerda do gênero e junto ao carregamento dos demais dados. SharedHero preserva todos callbacks,metadados/catálogo e plataforma existente. Logo16px reutiliza a linha do gênero. Removido delay fixo2s somente da logo; diretório BR validado/TTL/cooldown/credenciais intactos, peek imediato e prefetch pequeno no hook de capas após filtro parental, sem await/readiness gate. Imagem ainda depende de onLoad. Novo recibo9 grants,24 recibos anteriores íntegros. Fonte em fluxo/HLS/menu transparente/ativação preservados. Baseline por hashes do release anterior +canon exit0 e testes dedicados; duas fixtures antigas incompletas foram diagnosticadas antes do patch. Validação final/layout/APK/físico PENDING. Auth SHA256 991e26d1e09fcd6fea37f79401fdbd8aaeb9469d2256370f58ec8229259f694c. Sem Git/main/deploy/backend/reset/versão ou próximo Gate.

Grants reais:

```json
[
  {
    "path": "src/ui/components/Hero.tsx",
    "before": "511fee75591f0d81b3d62f54c5b830eb240c0de3",
    "after": "01c7ffafa3e468077893d94e0dc6dcac273ba07a"
  },
  {
    "path": "src/ui/hooks/useHeroArtwork.ts",
    "before": "9266903511d0f4d0fa880db79bc9385ceb70f261",
    "after": "fbd438c8b8c87a2e13ddbb37026b8cff2539f374"
  },
  {
    "path": "src/ui/hooks/useWatchProviders.ts",
    "before": "215225ca02ac7bcac93c2cd74915d6d156b3dfdd",
    "after": "27e37cae4308ca13c17c3884e1d9ef41a97bd633"
  },
  {
    "path": "src/artwork/tmdb-watch-providers.service.ts",
    "before": "b83a8380118f0bf5898c287011d313b8c8c6e5bf",
    "after": "5b328159b00dedd3a0a265a4a69ddb7402c49f06"
  },
  {
    "path": "src/index.css",
    "before": "acec426f190be85fef0fea4d92849d3ac83ae3d3",
    "after": "695f2e1ba7ac215dd7058d3f5e62c90739796203"
  },
  {
    "path": "scripts/test-c107-fire-hero-metadata.mjs",
    "before": "688df56149388b7ef0cdc3a3623f39c71dcd1db6",
    "after": "a52774d68fe52f8d23e65d9a82263c722b69583c"
  },
  {
    "path": "scripts/test-c107-watch-providers.mjs",
    "before": "a77e6a157c1f5d750cdef196030d2416a289e76a",
    "after": "803f87c612439ba7166491912a9c390883fa1664"
  },
  {
    "path": "scripts/test-c105-artwork-background-priority.mjs",
    "before": "06fc33736cc59c47cf04336d3e7e2d50a7e09849",
    "after": "5402be7975a13e761b180e716b5a71dab2966dab"
  },
  {
    "path": "scripts/test-canonical-regression.mjs",
    "before": "a5155a4a94bc28282a79e0175a956b1bf1e74849",
    "after": "06112841fc0a0c5140f4ccdd66ad8b0d07ed1229"
  }
]
```


## Refinamento explícito de tamanho — 32 px

O usuário rejeitou o tamanho16px e pediu literalmente: “DOBRE O TAMANHO DA LOGO. AINDA ESTA MUITO PEQUENA”. Antes da edição, candidato16px, recibo, fontes, validações e instalação foram preservados em candidate16/. Alterar somente largura/altura CSS para32px, mantendo o slot à esquerda do gênero abaixo do título. A linha flex deve crescer naturalmente nos perfis compactos se necessário para evitar sobreposição: não comprimir texto nem usar posicionamento absoluto sobre título/sinopse. Conferir tablet/home/filmes/séries, celular, Fire/TV/web e ausência de logo. Manter todos os controles de carregamento antecipado e caches; atualização somente in-place do tablet, APK distinto, sem apagar dados. Recibo atual deste gate ainda não publicado pode receber novos after-hashes/autorização; preservar os24 recibos anteriores e o candidato16 arquivado.

SHA256 da autorização UTF-8/LF ampliada: 9246a30cd46b9a92d198c4cc188797240500216f84260145db8ae158ce914e16. Validações e artefato32px ainda PENDING neste registro anterior ao código.


## Correção do canto superior do tablet — especificação antes do CSS

Usuário identifica retângulo escuro atrás do X nas páginas de filmes/séries, inclusive internas. Leitura CDP real CORNER_BEFORE.json confirmou header/marca transparentes, mas a página imersiva começa44px abaixo da faixa Voltar: sua extensão à esquerda não cobre o canto superior. O ::before da page-back-row--browse começa no x80, deixando o x0–80 com o fundo escuro do shell. Estender a superfície ambiente dessa faixa até x0 para tablet lateral; incluir page-back-row--detail para a mesma lacuna nas páginas internas. Mesmo --navigation-ambient com fallback escuro seguro, pointer-events:none e isolamento atrás dos controles. Somente CSS; não mudar dimensões, posições, ícones, navegação, cor da marca, celular/TV/portrait nem contexto de dados. Registrar no mesmo gate UI local ainda não publicado, com a mesma allowlist16 e24 recibos históricos preservados. Validar antes/depois em Chrome com CSS real, cores distintas e fallback, geometria e controles; conferir as páginas reais no tablet após install-r.

O teste visual inicial32px usava estimativa nova de10px para crescimento compacto; Fire tem gênero de16.5px e a linha precisa crescer14.5px para conter uma imagem de32px. Medição foi preservada, e o critério novo foi corrigido para aumento máximo de16px, exatamente a diferença16→32; asserts de dimensão exata, abaixo do título, antes da sinopse e sem overflow permanecem. Tablet manteve o gap41px. Não houve relaxamento de teste histórico ou timeout.

Autorização literal ampliada UTF-8/LF SHA256 4e105d55c96fbd85e3c3548cb7f46c80ed9fb1bf4efdffec50a9b10551580113. Aplicação da correção/validação física ainda PENDING neste registro anterior ao código.


## CANON-01-HERO-PLATFORM-COMPOSITION — fechamento local: logo32px e canto do tablet, 2026-10-23

RESULT=PASS. Logo dobrada16→32px conforme pedido posterior explícito, abaixo do título à esquerda do gênero. Candidato16px e candidato32px anterior à correção do canto preservados em tmp; nenhum recibo histórico foi reescrito. Espera fixa2s removida, cache válido no primeiro render e prefetch público opcional bounded, sem bloquear título/sinopse/catálogo e sem garantir simultaneidade em rede fria. Imagem continua dependente de onLoad real.

Causa do retângulo confirmada por CDP no tablet instalado: faixa Voltar começa emx80,y0 e main imersivo emy44. A extensão lateral do main não cobre o espaço superior atrás do X. CSS mínimo estende o ::before do back-row browse/detail até x0 com a mesma cor --navigation-ambient, isolamento atrás dos controles e pointer-events:none. Sem mudança de geometria ou de perfis celular/TV/portrait. Chrome real/CSS real em10 cenários sintéticos reproduziu o gap original e confirmou correção, fallback e perfis inalterados. Hero real/metadados sintéticos em12 cenários confirmou32px, posição, ausência de overflow/spacer e sem sobreposição. Gap normal do tablet41px preservado; celular+9px e Fire+14.5px são crescimento natural da linha para acomodar a imagem maior.

Treze comandos oficiais do estado final exit0;147 controles/26 suítes,15 testes de logos e11 de metadata preservados/aprovados; prioridades e carrossel PASS. C11 antes de entregar e canon após cópia/fechamento PASS. Nenhum assertion histórico/timeout foi reduzido nem skip incluído. O primeiro teste visual auxiliar32px estimava incorretamente crescimento compacto máximo10px; medição foi preservada e o critério foi corrigido para16px, a diferença exata entre tamanhos, mantendo dimensão exata e asserts de não sobreposição.

APK Xandeflix-v1.0.37-hero-plataforma-32px-tablet-20261023.apk SHA256 08b695465c2e2de1175f6d4b5551674ec0aceb4387b771c18d2087698ae0716f,1.0.37/code37 e certificado mantidos. Atualização tablet SM-X610 install-r, sem reset/limpeza. Identidade/chave/ativação/fonte/parental/ponteiro/manifesto/catálogo comparados em memória antes/depois; todos preservados, assim como firstInstallTime. Sem exportar hashes privados. Quatro páginas físicas conferidas por navegação normal: Filmes, Séries e detalhes de ambos, cantos PASS. Logos presentes em0 amostras; carregadas e visíveis em0. Ausência de logo opcional não é aprovação sintética de imagem. Não foi iniciada reprodução nem alterada fonte.

Native215 testes/36 suítes/0 falhas/erros/skips são evidência real reutilizada do release anterior com bytes nativos idênticos, não nova execução. Allowlist16 caminhos,9 grants e25 recibos totais;24 históricos íntegros. Prefixos dos documentos recebidos preservados. Todas as mudanças funcionais ficam no workspace operacional isolado e são apresentadas em full-final.diff/hashes-final.json. Root ativo/L1/branch/HEAD/main e APKs anteriores preservados. Sem Git add/commit/push/PR/merge/main/Vercel/Supabase administrativo/versão/outro aparelho/próximo Gate.


Verificação física adicional: aberto Ver todos da categoria Netflix por navegação normal do tablet. PHYSICAL_PLATFORM_LOGO32.json confirmou logo real da API carregada e visível,32x32 CSS px exatos, abaixo do título/à esquerda do gênero/antes da sinopse, sem imagem sintética ou fonte alterada. Screenshot tablet-logo32-netflix.png. As quatro amostras iniciais não tinham logo reconhecida; isso não foi mascarado como logo carregada. Screenshot tablet-final-series32-corner.png confirmou visualmente o canto corrigido com arte real.
