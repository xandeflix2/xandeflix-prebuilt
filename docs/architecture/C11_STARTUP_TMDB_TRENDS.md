# C115 — tendências TMDB independentes da fonte na carga inicial

## Autorização/proveniência — 2026-10-15

Usuário autorizou implementar o visual independente da fonte e gerar APK.
Preflight no clone independente ativo C11-main, main/origin canônicos,
HEAD0f68f169f7728fae17c8311832b7643629e97a02, dirty anterior C107–C114
conhecido. AGENTS/Architecture/Execution/Source Boundary/Activation Lock/C111
lidos; baseline privado em tmp/c115-startup-trending/baseline.json.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C115; NEXT_GATE_STARTED=NAO.
Sem autorização de Git/backend/instalação/reset ou mudança de credenciais.

## Especificação anterior ao código

1. Tela StartupLoadingScreen montada e visível consulta diretamente o TMDB
   trending/movie/day, pt-BR, uma página, usando configuração TMDB existente.
   Independente de fonte/ativação/importação; não enviar IDs ou dados locais.
   Nenhuma consulta se oculta/offline/erro/sem credencial, nem no import do módulo.
2. No máximo 20 candidatos públicos sanitizados, excluir adulto/sem título,
   ID inválido ou poster/backdrop inválido. Aleatorizar até seis por sessão
   visual; sem chamadas por título, catálogo externo ou itens reproduzíveis.
3. Metadados públicos somente em chave local exclusiva: versão, data, ID,
   título e filenames TMDB. Cache fresco 6h, stale no máximo 7d apenas como
   visual enquanto tenta renovar; leitura/escrita negada/quota não quebra UI.
   Deduplicar assinantes, timeout4s, cooldown após falha, sem loop de retry;
   cancelar ao último assinante sair. Online/retorno visível pode tentar de novo.
4. Celular usa só poster vertical e fade6s existente; tablets/TV/dobráveis
   mantêm seis capas à esquerda/progresso à direita com backdrop horizontal
   já fornecido pela resposta TMDB, sem resolver título adicional. Reusar
   fila/cache de imagens existentes e prioridade normal; no máximo duas camadas
   de fundo, validar proporção. Pausa/reduced-motion consolidados preservados.
5. Tendências têm preferência quando disponíveis; se TMDB falhar, preservar
   amostra local/gradiente atuais, sem esperar imagens para liberar Home.
   Leitura/verificação previewEnabled=false só proíbe amostra da fonte, não
   imagens públicas. Label "Tendências do cinema"/"Em alta no TMDB", sem
   afirmar disponibilidade no catálogo ou permitir clicar/reproduzir amostras.
6. Não alterar progresso real, ativação/escolha de dispositivo, condições de
   liberação da Home, deadline/skip/foco C108, orientação, catálogo/search,
   importação/identidade/source/playback/C9/Android nativo nem dependências.
7. Gerar APK local de teste C115, mesma assinatura/package/version19 atual,
   sem publicação ou instalação automática. Lock antes/depois e prebuild,
   cap sync/Gradle/assinatura/assets/hashes obrigatórios. C114 preservado.

Esta especificação supersede somente as proibições C111 de discovery TMDB e
amostra exclusivamente da fonte no visual de carregamento. Metadados TMDB
são decorativos, não catálogo/autoridade remota; demais limites C111 mantidos.

## Allowlist estrita

- src/artwork/startup-trending-artwork.service.ts (novo serviço opcional).
- src/artwork/startup-catalog-preview.ts: tipo opcional de backdrop/categoria
  de tendência; coleta/importação consolidadas intactas.
- src/ui/components/StartupLoadingScreen.tsx: assinar tendências somente
  enquanto ativo, escolher amostra e labels corretos.
- src/ui/components/StartupBackdrop.tsx: backdrop direto e validação proporcional.
- scripts/test-c115-startup-trending.mjs (novo): serviço/React/browser reais,
  mock apenas transporte e autoridades; testes sem backend/credencial real.
- scripts/test-c111-exclusive-startup-loading.mjs: fixture de novo import e/ou
  aguardar assinatura real do coordenador mock antes de emitir evento de teste,
  preservando critérios de ativação/ordem/progresso/foco/pausa/limites.
- Este contrato; docs/evidence/C11_STARTUP_TMDB_TRENDS.md;
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md; tmp/c115-startup-trending
  e saídas usuais ignoradas build/sync/Gradle/APK. Sem outros arquivos.

## Aceitação

Serviço: sem I/O antecipado, sem fonte/identidade, dedup/cancel/timeout/cooldown,
cache/TTL/quota/corrupção/segurança de URLs, sorteio e limites PASS. Browser:
fonte ausente ainda recebe imagens, leitura inicial permitida, mobile vertical
e telas amplas horizontais, nenhuma chamada de resolução por título; fade/pausa,
desmontagem e Home liberada com TMDB pendente/falho. C111/C108 e lock preservados;
TypeScript/build/APK assinados PASS, audit baseline/allowlist PASS.
Fixtures não certificam tempo em hardware/rede real nem acesso ao TMDB em
todas as redes; sem SLA ou declaração de instalação física.

Referências primárias consultadas: https://developer.themoviedb.org/reference/trending-movies
e https://developer.themoviedb.org/docs/image-basics.
