# C125 — gêneros de cards/heros e títulos semelhantes — 2026-10-16

Pedido explícito com seis imagens: eliminar Geral, mostrar gêneros no hero
mobile/tablet/TV e usar os gêneros reais para títulos semelhantes. C124 fechado
com auditoria PASS antes deste ciclo. Preflight: clone independente C11-main,
main/origin esperado, HEAD0f68f169f7728fae17c8311832b7643629e97a02;
baseline1068 hashes em tmp/c125-content-genres. AGENTS, Architecture, Execution,
Source Boundary e Activation Lock lidos. CURRENT_GATE=NONE; ciclo local C125.
Manter provenance C107–C124. Sem commit/push/PR/backend/install/reset.

## Especificação anterior ao código

- Reutilizar filtro C121: Geral/vazio não é gênero. Gênero real da fonte é
  preservado; quando ausente, usar gêneros públicos TMDB com matching existente
  conservador. Sem dado confiável, omitir, nunca substituir por categoria.
- Cards usam overlay de apresentação e cache TMDB existente. Resolver apenas
  cards efetivamente visíveis após breve permanência; evitar varrer/enriquecer
  todo catálogo. Concurrency2, TTL, fila e prioridade do hero existentes mantidos.
  Cache pode ser lido fora da viewport sem nova rede. Não bloquear capas/home.
- Hero compartilhado filtra Geral em todos os perfis e habilita fallback TMDB;
  retirar CSS que oculta gêneros mobile. Sem alterar tamanho/foco/gestos/botões.
- Títulos semelhantes: resolver gêneros do título de referência pelo mesmo
  critério C121. Candidatos do mesmo kind, somente do catálogo local autorizado,
  precisam compartilhar gênero real; Geral e mera categoria não pontuam.
  Usar gêneros locais/cache e metadata pública do endpoint TMDB similar como
  complemento, intersectado localmente por identidade forte. Nunca exibir um
  título remoto sem correspondente local nem inventar stream/episódio.
- Complemento público limitado a três páginas/60 descritores e uma lista de
  gêneros por kind, timeout/cooldown/deduplicação/cache RAM limitado. Nenhuma
  credencial/URL da fonte ou catálogo enviado; apenas ID TMDB público do título
  já validado. Sem endpoint de busca remota da fonte/control plane. Referências:
  https://developer.themoviedb.org/reference/movie-similar e tv-series-similar.
- Scan local por segmento, yield, AbortSignal, snapshot/pointer verificados;
  reter apenas20 melhores. UI não mostra sugestões arbitrárias enquanto resolve,
  nem estado vazio antes da leitura concluir; falha aparece com retry. Troca de
  título/geração cancela entrega antiga. Falha TMDB permite gêneros locais/cache.
- Oito perfis: PHONE, FOLDABLE, TABLET, FIRE_TV, ANDROID_TV/Google TV,
  ANDROID_BOX, TIZEN e WEBOS. Mesma regra para filme e série, favoritos e grids.
  Não alterar catálogos assinados, import, busca, fonte, playback, episódios,
  ativação, logos ou APIs backend. Sugestões não certificam disponibilidade vídeo.

## Allowlist e aceitação

- src/ui/components/{MediaCard,Hero,RelatedTitles}.tsx; src/index.css somente
  visibilidade de gêneros mobile e espaço da segunda linha nos cards compactos
  TV (antes ocultos por CSS); src/catalog/related-titles.service.ts somente
  contexto opcional de gêneros reais e segurança do scan.
- Novos src/ui/hooks/useCardGenres.ts e src/artwork/tmdb-similar.service.ts.
- Novo scripts/test-c125-content-genres.mjs; harnesses existentes somente
  bindings necessários, preservando asserts. Exceção explícita: cenário C107
  que exigia Geral fora do Fire deve agora exigir enriquecimento/Drama nos
  mesmos perfis, pois o pedido atual amplia a correção a todos. No cenário
  vertical de test-c11-home-hero, gênero real local passa a prevalecer como no
  C121; sinopse/ano/duração/poster TMDB conservam os asserts anteriores. Spec/evidence e
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only.
- Helpers privados/tmp e outputs usuais web/Android ignorados; APK C125 separado,
  preservando C124. Sem mudanças em Java, package/versão/assinatura/branding.

Validar placeholder removido, gêneros mobile visíveis, source/cache/fallback,
cards fora da viewport sem fetch, mesmo gênero real selecionado, apenas catálogo
local/matching conservador, sem categoria Geral, limite20/60, cancelamento e
snapshot. Regressões C121/C123/C124, detalhes/foco/hero, typecheck/build com lock,
sync/Gradle e artefato verificado. Inspeção browser nos oito perfis com fixtures
isoladas; hardware físico não inferido desses testes. NEXT_GATE_STARTED=NAO.
