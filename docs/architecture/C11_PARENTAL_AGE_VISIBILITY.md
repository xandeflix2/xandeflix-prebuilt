# C128 — filtrar exibição pela faixa parental — 2026-10-16

Pedido explícito do usuário: iniciar implementação para exibir somente títulos
com classificação permitida pelo limite parental; conteúdos sem classificação
continuam visíveis e exigem PIN. Emenda apenas o comportamento de visibilidade
e acesso por idade do C126, mantendo PIN/PUK/localidade/segurança/ativação/C9.

Preflight C11-main/main/origin esperado, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. AGENTS, Architecture, Execution,
Source Boundary, Activation Lock e C126 lidos. Baseline1090 privado capturado.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C128_PARENTAL_AGE_VISIBILITY.
Não autoriza Git/backend/instalação/reset nem suporte web investigado em C127.

## Regras antes do código

- Limite é inclusivo: escolher12 permite L/10/12; 14/16/18 são ocultos. Sem
  controle configurado, preservar a política C126 de conteúdos comuns.
- Classificação efetiva é o maior valor conhecido da fonte, TMDB validado ou
  regra manual. Fonte/catálogo/índice não são reescritos. Ausência não vira L:
  conteúdo desconhecido aparece, mas detalhes/trailer/player exigem PIN.
  Se a consulta sob demanda descobrir idade acima do limite, negar acesso e
  retirar a capa; PIN de um título desconhecido não libera um título conhecido
  fora da faixa. Responsável pode alterar o limite em Configurações com PIN.
- Home, Filmes/Séries, categorias/ver todos, favoritos, semelhantes, busca,
  heros/preload e canais Live compartilham o filtro. Links diretos e grants
  antigos não contornam idade conhecida acima do limite. Regra "Sempre exigir
  PIN" continua protegendo conteúdo permitido. Editor parental autenticado
  pode listar títulos ocultos para editar regras, sem iniciar reprodução.
- Adulto explícito mantém opt-in + sessão de navegação desbloqueada por PIN,
  e agora também respeita o limite18: não há exceção que permita a PIN liberar
  classificação acima do teto. Flag adulto explícito implica mínimo18. A UI
  informa isso e só oferece liberar a sessão quando o limite salvo for18.
- Resolver TMDB apenas para cards visíveis (observação já existente,300ms) e
  hero atual, com matcher/cache/fila/timeout existentes. Não consultar o catálogo
  inteiro. Valores públicos de classificação mantidos em overlay RAM limitado
  a512 chaves derivadas, sem títulos/URLs no overlay e sem persistência remota.
  Classificação ainda indisponível/evictada é desconhecida e exige PIN.
- Mudança de idade/política remove capa e foco selecionável imediatamente;
  chegada de metadata de outro título não desmonta detalhes/player já aberto.
  Revisão do overlay não reinicia o preview Live por metadados de VOD.
- Alterar textos da tela parental para explicar ocultação, idade inclusiva e
  tratamento de desconhecidos. PIN/PUK, cofre/backup e Android Java intactos.

## Allowlist estrita

- src/parental/{parental-control.store,parental-content,parental-access}.ts.
- Novo src/ui/hooks/useParentalClassification.ts; useCardGenres.ts apenas
  expor visibilidade já observada; MediaCard.tsx/Hero.tsx conectar o hook.
- ParentalDetailGate.tsx somente versão de classificação do título atual;
  ParentalControlPage.tsx texto/condição do desbloqueio adulto18; LiveTvPage.tsx se dependência de
  política necessária. SearchResults/MediaRail/CatalogGrid/useHeroArtwork e
  artwork-preload somente se teste mostrar lacuna no filtro compartilhado.
- scripts/test-c126-parental-control.mjs somente adaptar expectativa de idade
  agora oculta/negada, mantendo testes PIN/PUK/unrated; novo teste C128.
  scripts/lib/parental-fixture-bindings.mjs apenas binding do hook em legados.
- Esta spec/evidence C11_PARENTAL_AGE_VISIBILITY, memórias append-only,
  helpers/relatórios privados e outputs usuais de build/APK separado C128.

Aceitação: matriz L–18/sem classificação, fonte/manual/TMDB, idade acima
oculta+nega acesso sem abrir prompt, desconhecido PIN, adulto preservado,
editor autenticado, alterações de política/cache e imutabilidade. UI nos oito
perfis e regressões C126/C125/search/hero/Live/C9. Lock inicial/final/prebuild,
typecheck/build/sync/Gradle/APK/certificado/provenance. QA física não inferida.
NEXT_GATE_STARTED=NAO.

Revisão de integração antes do patch adicional: HomeHero.tsx entra na allowlist
somente para invalidar sua lista memoizada quando a elegibilidade das imagens
mudar, mesmo sem novo download. LiveTvPage.tsx inclui escopo parental na chave
da janela contínua e não reutiliza seed de política antiga quando o controle
está ativo; favoritos/painéis nativos também são projetados pelo filtro atual.
Sem editar o mecanismo de rolagem, player Java ou conectar novos streams.

Integração TMDB: permitir em series-presentation.service.ts apenas assinatura
de atualização de classificação pública em cache. O filtro deve reagir também
quando metadata chega pelos detalhes/trailer existentes, sem esperar outro
clique ou consultar de novo. Listener único do store emite revisão de UI, sem
mudar contentRevision de Live, catálogo, matching, endpoints ou persistência.
