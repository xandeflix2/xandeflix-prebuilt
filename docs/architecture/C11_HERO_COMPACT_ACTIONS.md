# C94 — Hero compacto e Assistir direto — 2026-10-12

## Autorização/preflight

Pedido explícito: comparar screenshots Prime/Xandeflix fornecidos e adaptar
indicador discreto, Assistir à esquerda/Ver detalhes à direita; mobile centraliza
indicador abaixo dos botões; square/tablet/TV
botões à esquerda e indicador à direita. Comparação só das imagens fornecidas.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/upload/instalação.
Workspace ativo independente/main/origin canônico, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e; AGENTS/contratos/boundary/lock lidos
na sessão, baseline SHA256950 arquivos. Dirty anterior preservado.

## Especificação antes do código

- Home/Filmes/Séries e category hero recebem ações diretas por caminho existente
  defaultPlaybackService: movie resolveMovieById antes de playMovie; série resolve
  entidade/episódios locais, retoma episódio com histórico incompleto de mesma
  fingerprint se ainda disponível, senão primeiro episódio em ordem de temporada/
  episódio. Nunca usa ID TMDB como stream nem bypass de sessão/Cast/autorização.
- Sem abrir detalhe para Assistir; Ver detalhes conserva onSelect. Evitar clique
  duplicado; feedback de preparo/erro, indisponibilidade e cancelamento se a
  página/readModel mudar durante preparo. Suspender rotação durante preparo.
- Indicador com até cinco círculos de6px e ativo7px, faixa móvel ao redor do
  destaque atual; rótulos informam posição real/total. Slots de botão estáveis
  para preservar foco; acesso por swipe, teclado/controle, toque e rotação10s.
  Área interativa discreta20x44px, grupo <=116px, sem ocupar largura inteira.
- Emenda explícita do usuário: o modelo mobile com metadados fora da capa foi
  rejeitado. Preservar o tamanho e a sobreposição anterior do hero, com capa,
  metadados e botões dentro do mesmo bloco, em todos os formatos. Retirar o
  aumento de altura; manter Assistir/Ver detalhes e os indicadores compactos.
- Mobile vertical: manter região anterior2:3 e object-fit:contain, metadados
  sobre a imagem com gradiente anterior; botões lado a lado Assistir/Ver detalhes
  e dots centralizados abaixo, todos dentro do hero.
- Square (>=600 CSSpx, razão0.8–1.25, touch nãoTV) e horizontal usam backdrop
  adequado, botões esquerda e indicadores direita no rodapé; metadados têm área
  separada da faixa de ações, sem que max-width do texto prenda dots no centro.
  Classificação por janela real, preservar perfis e D-pad existentes.
- Preview visual final portrait/square/landscape com dados sintéticos e imagem
  identificada como teste; comparação documenta o layout das referências, sem
  alegar implementação interna ou funcionamento do Prime.
- APK18/1.0.18 local, mesmo package/signer/updater, preserva17. Nenhuma publicação.

## Allowlist

src/ui/components/{Hero,HomeHero,BrowseHero,CategoryHero}.tsx;
src/ui/pages/{HomePage,CatalogBrowsePage}.tsx;
src/ui/hooks/useHeroPlayback.ts novo;
src/ui/hooks/useHeroLayout.ts novo (orientação real/square sobre perfil existente);
src/playback/hero-playback.ts novo (adaptador UI sobre serviços existentes);
src/index.css somente hero; android/app/build.gradle somente versão;
scripts/test-c11-hero-direct-playback.mjs novo; este contrato/evidência
scripts/test-c11-{home-hero,browse-dynamic-hero}.mjs somente adaptar imports das
portas de apresentação/ação novas nos loaders SSR; manter assertions originais.
docs/evidence/C11_HERO_COMPACT_ACTIONS.md e acréscimos dos quatro docs memória;
tmp/c94-hero-actions/** e saídas usuais ignoradas de build.
Sem alterar App, native player, playback.service, readmodel, identidade, fonte,
Supabase, dependências, sessões, regras do lock ou outro layout.

## Aceitação

Testes de adaptador com entidade segmentada, episódio resumido/primeiro/ausente,
fingerprint stale, recusa/cancelamento/erro e clique concorrente. Browser real
Hero/HomeHero com portas sintéticas: mobile320/412, square700x777/777x700,
tablet1280x800 e TV1920x1080, nomes longos, cinco dots compactos, ações/posição,
imagem contain, swipe/10s/foco D-pad e resolução sem navegação de detalhes.
Regressões C92/C93, typecheck/build/lock/Capcopy/JVM/assemble/assets/signer/hash,
auditoria allowlist e HEAD. Playback físico e instalação permanecem pendentes.
