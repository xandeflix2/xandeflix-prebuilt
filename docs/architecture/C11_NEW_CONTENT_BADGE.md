# C11 — Selo Novidade por sete dias (ciclo 59)

Pedido do usuário de 2026-10-09: selo vermelho Novidade na capa de filmes e
séries recém-inseridos, durante sete dias. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados.

Preflight: clone independente C11/main, origin esperado, Git próprio,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e; baseline privado 762 arquivos.
AGENTS, Architecture, Execution, Source Data Boundary e Activation Lock lidos.
Preservar alterações anteriores; nenhum acesso/escrita no projeto protegido.

## Especificação anterior ao código

- A fonte M3U/catálogo canônico atual não informa data de inserção. Não usar
  ano de estreia, TMDB, última visualização ou data de instalação como substituto.
  Primeiro inventário completo é referência: títulos existentes não são novidade.
  Novos títulos detectados em sincronizações posteriores recebem a primeira
  observação local persistida. Essa data é por dispositivo/fonte; não representa
  uma data global comprovada na plataforma.
- Sete dias corridos (604800000 ms), intervalo [primeira observação, expiração).
  Reiniciar, sincronizar, mudar IDs ordinais/capa/categoria/metadados ou remover
  e reinserir um título não renova o prazo. Filme e série são identidades distintas.
  Identidade conservadora pelo título da fonte normalizado, incluindo ano quando
  presente no título. Homônimos indistinguíveis pela fonte compartilham o prazo;
  não inventar identificação externa. Fonte diferente tem referência independente.
- Inventário opcional, privado, separado do catálogo/identidade/playback. Somente
  hashes de identidade e datas; sem URL, conteúdo de stream, licença ou credencial.
  IndexedDB versionado, gravação atômica somente depois da leitura completa da
  geração ativa. Abort, troca de geração, segmento inválido/ausente ou falha de
  storage não promovem referência parcial nem falsos selos. Limite 100000 hashes.
- Ler um segmento movie/series por vez, cooperar entre lotes de 200 registros;
  não ler episódios/streams/imagens, fazer download ou atrasar abertura do shell.
  Não repetir inventário de snapshot já registrado; não fazer leituras por capa.
  Um relógio compartilhado remove os selos vencidos com a aplicação aberta.
- MediaCard comum exibe faixa vermelha com texto branco no centro inferior da
  capa, em Home, grids, busca e semelhantes. Não muda proporção/imagem/foco D-pad;
  não cria botão/foco adicional. Ano permanece legível; texto acessível inclui
  Novidade. Escala para celular/tablet/TV com CSS existente.
- Validar baseline, inserção, sete dias exatos, reboot/resync/reordenação,
  source isolation, falhas/abort/troca de geração, storage real IndexedDB e UI.
  TypeScript/build/lock e APK standalone verificado. S24 autorizado para QA e
  atualização preservando estado. Não iniciar testes nos outros aparelhos.

## Allowlist estrita

Este documento; docs/evidence/C11_NEW_CONTENT_BADGE.md;
docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md;
docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md;
src/catalog/new-content-badge.ts (novo);
src/ui/components/NewContentProvider.tsx (novo);
src/ui/components/MediaCard.tsx; src/App.tsx; src/index.css;
scripts/test-c11-new-content-badge.mjs (novo).
Saídas usuais ignoradas build/Capacitor/APK/tsconfig.tsbuildinfo e helpers privados
tmp/c11-new-content-badge-20261009. Nenhuma alteração nativa/backend/contrato.
