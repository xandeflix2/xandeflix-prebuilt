# C11 — Metadados e imagens de Soulm8te (ciclo 58)

Pedido do usuário: Soulm8te (2026), TMDB movie/1307118, não apresenta
metadados/trailer/imagens no detalhe. Ciclo 57 registrado antes deste ciclo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; nenhum Git write autorizado.

Preflight 2026-10-09: clone independente C11/main, Git próprio, origin esperado,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e, baseline privado 759 arquivos.
AGENTS, Architecture, Execution, Source Data Boundary e Activation Lock lidos.
Workspace histórico somente leitura; nenhuma dependência/escrita no original.

## Investigação e aceitação antes do código

- Comparar a identidade de apresentação desse filme no catálogo local do S24
  com a API pública do TMDB. Ler somente segmentos necessários, sem exportar
  catálogo, streams, URLs privadas ou credenciais. Consultas TMDB não recebem
  dados de licença/dispositivo/source; chave existente apenas em memória.
- Confirmar por ID e consulta de título/ano a disponibilidade real de sinopse,
  imagens e trailer. Distinguir ausência da API, falha transitória, correspondência
  rejeitada e cache antigo. Não inserir ID fixo para esse filme no código.
- Corrigir somente a causa reproduzida nos serviços opcionais de apresentação
  e nos seus caches. Matching permanece isolado movie/series, sem aceitar
  homônimos/ano incompatível. Erros transitórios não são ausência permanente.
  Cache antigo não pode manter a falha após atualização do algoritmo.
- Não modificar fonte, snapshot, identidade, licença, catálogo/search/playback
  ou backend. Não substituir capa válida da fonte nem adivinhar trailer.
- Teste de regressão reproduz o defeito antes do patch e passa depois; manter
  testes anteriores de imagens, aliases, ambiguidade e apresentação/trailer.
  TypeScript/build/lock obrigatório antes de APK. Atualização S24 já autorizada
  com install -r/hash/estado preservado, sem reset/uninstall/unlock de sistema.
  Demais aparelhos mantêm instalação atual até rodada própria.
- QA física no S24 pela página real; distinguir código instalado de fixture
  dev. Nenhuma mensagem, avaliação, favorito ou transmissão iniciada.

## Allowlist

Este documento; docs/evidence/C11_SOULM8TE_METADATA_RECOVERY.md;
docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md;
docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md;
src/artwork/tmdb-metadata.service.ts;
src/artwork/series-presentation.service.ts somente se causa de trailer comprovada;
src/ui/hooks/useArtworkMetadata.ts somente se causa de atualização comprovada;
scripts/test-c11-metadata-match-recovery.mjs (novo);
scripts/test-c11-tmdb-alias-recovery.mjs somente compatibilidade da versão de cache,
sem relaxar assertions anteriores. Saídas usuais ignoradas build/Capacitor/APK/
tsconfig.tsbuildinfo e helpers privados tmp/c11-soulm8te-metadata-20261009.

Emenda após diagnóstico precederá qualquer alteração funcional que exija
mudar as condições de matching/cache. Nenhum novo Gate iniciado.

## Emenda baseada na causa reproduzida — anterior ao patch

S24: título Soulm8te (2026), sem ID/ano separados, pôster público da fonte
ausente entre as variantes atuais do movie/1307118. Serviço real retorna null
com esse filename e resolve 1307118 sem ele; API fornece sinopse/imagens/trailer.
Página instalada sem sinopse/trailer e cache match4 negativo confirmados.

Manter o filename como primeiro critério de desambiguação. Somente quando
nenhum candidato confirmar o filename, permitir fallback se houver exatamente
um candidato forte, título normalizado exato (traduzido ou original) e ano
exato informado/extraído do título, confirmado novamente nos detalhes do mesmo
ID. Ano ausente, diferença de um ano, título aproximado, homônimos, aliases
não confirmados e IDs inconsistentes continuam recusados. Mesma regra limitada
movie/series; não remover o filename para todas as consultas.

Versionar somente chave de matching para match5: negativos match4 não bloqueiam
nova consulta; positivos anteriores ainda podem ser reutilizados offline.
Chaves de ID explícito e storage v2 permanecem. Sem apagar cache inteiro,
alterar a imagem da fonte ou inserir associação fixa de Soulm8te no código.
