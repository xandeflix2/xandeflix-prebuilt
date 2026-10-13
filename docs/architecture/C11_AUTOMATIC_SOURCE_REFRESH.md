# C11 — Atualização automática do conteúdo da fonte (ciclo 60)

Pedido do usuário de 2026-10-09: detectar novas adições automaticamente e
instalar a atualização no tablet, S24 e Fire Stick conectados. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Git commit/push/PR não autorizados.

Preflight read-only completo no clone C11/main independente, origin esperado,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline privado: 767 arquivos.
AGENTS, Architecture, Execution, Source Data Boundary e Activation Lock lidos;
lock inicial passou 22+27+9 verificações. Preservar trabalhos anteriores.

## Especificação anterior ao código

- sourceVersion é geração de configuração, nunca revisão de conteúdo. Emenda
  local ao NO_OP por versão: chamadas explícitas checkContent verificam conteúdo
  mesmo com a mesma configuração. Chamadas antigas mantêm idempotência anterior.
- Consultar somente após autorização local e autoridade remota canônica válida,
  com binding/estado/configuração do cofre validados. Nada de bypass, proxy central,
  catálogo remoto, tokens em logs ou alteração de identidade/licença/fonte.
- Na abertura autorizada e a cada 15 minutos com aplicação visível/online,
  verificar a fonte em background. Retorno ao app/conexão verifica quando devido.
  Adiar durante playback/Cast ativo; não parar mídia. Uma importação de cada vez.
  Persistir apenas datas sanitizadas de sucesso/tentativa para cooldown de retorno
  e backoff de falhas (mínimo 1 minuto). Sem SLA de atualização instantânea:
  a fonte não oferece um evento push de inserção neste cliente.
- Digest SHA-256 de conteúdo local ligado a sourceId/sourceVersion/snapshot ativo.
  Android calcula durante download limitado em arquivo privado (buffer existente).
  Sem mudança, limpar temporário e evitar parse/staging/promoção/reindexação.
  Fallback WebView calcula incrementalmente; nunca buffer de playlist completo.
  Persistir digest somente após promoção validada ou confirmação da mesma geração.
  Perfil de classificação antigo invalida a reutilização do digest.
- Mudança usa staging isolado e promoção existente. Falha de rede, payload parcial,
  parse/storage/validação/promoção preserva ativo anterior. Xtream exige seis listas
  completas válidas; respostas inválidas não viram listas vazias bem-sucedidas.
  Catálogo Xtream deve materializar todos os itens, sem truncamento nos 100 iniciais.
- Após PROMOTED, refresh existente renova Home/categorias/busca e candidatos de hero.
  Ao atualizar catálogo já existente, adiar promoção enquanto detalhe/Live/modal/
  playback estiver aberto; descartar apenas candidato e tentar depois. Não aceitar
  seleção de detalhe durante o curto commit. Remover rotas de detalhe antigas do
  histórico após promoção (IDs M3U são ordinais); manter shell durante refresh.
  Seleção de hero continua seguindo seus critérios; não prometer que cada adição
  aparece nele. Inventário Novidade existente recebe a nova geração e mantém 7 dias.
- Versão Android nominal 1.0, versionCode 2, mesmo package/certificado. O contrato
  remoto já aplicado dos diagnósticos exige APP_VERSION=1.0; manter compatibilidade
  sem migration/alteração remota. Nome distribuível Xandeflix-v1.0-build2-standalone.apk.
  Gerar APK standalone
  distribuível. Instalar com replace e conferir preservação de dados nos três alvos
  autorizados, sem desinstalar/resetar ou interromper reprodução ativa.
- APKs antigos precisam receber/instalar esta versão uma vez. Não existe updater
  de APK neste cliente; não alegar envio global nem adicionar updater/publicar backend.
  Catálogo se atualiza depois da instalação, independentemente de ADB/rede do PC.
- Testes: mesma versão com adição/removal, inalterado sem nova geração, falhas e
  revogação, single flight, digest vinculado ao ativo, cooldown/foreground/playback,
  import completo e memória limitada; regressões de ativação, Novidade, browse,
  artwork e navegação. QA físico sanitizado; não inserir conteúdo na fonte comercial.

## Allowlist estrita

Este documento; docs/evidence/C11_AUTOMATIC_SOURCE_REFRESH.md;
docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md;
docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md;
src/bootstrap/automatic-source-refresh.ts (novo);
src/bootstrap/boot-sync-coordinator.ts; src/App.tsx;
src/source/{managed-source-staging.orchestrator,real-source-importer.service,
device-direct-fetch,large-source-transport.bridge}.ts;
android/app/build.gradle;
android/app/src/main/java/com/xandeflix/prebuilt/source/LargeSourceTransportPlugin.java;
android/app/src/test/java/com/xandeflix/prebuilt/source/LargeSourceTransportPluginTest.java;
scripts/test-c11-automatic-source-refresh.mjs (novo).
Saídas usuais ignoradas build/Capacitor/APK/tsconfig.tsbuildinfo e helpers privados
tmp/c11-automatic-source-refresh-20261009. Sem schema/migration/backend/env changes.
