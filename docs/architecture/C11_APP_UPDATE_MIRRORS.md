# C90 — Publicação MASTER e atualização Android por espelhos

## Autorização e preflight — 2026-10-12

Pedido explícito: aba MASTER de URLs de download, até cinco fontes em ordem,
consulta diária, download em segundo plano com fallback e sugestão persistente
de instalação. Usuário confirmou publicação da versão pelo painel para evitar
download diário do APK. Ciclo local autorizado; CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Git commit/push/PR e instalação física não autorizados.

Workspace ativo independente C:\Xandeflix\xandeflix-prebuilt-c11-main, origin
xandeflix2/xandeflix-prebuilt, main, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Pasta antiga consultada inicialmente
somente leitura; cânone ativo confirma papel histórico e operações seguintes
exclusivas no clone ativo. Estado dirty cumulativo preservado; baseline privado
capturado antes de código. AGENTS, Architecture, Execution, Source Boundary e
Activation Lock lidos. Sem colisão com repositório/package protegido.

## Contrato antes de código

- Apenas MASTER publica/consulta configuração administrativa. RPC público
  entrega somente release ativa: versionCode, versionName, SHA-256, bytes,
  notas e até cinco URLs públicas HTTPS de APK em ordem. Configuração privada,
  RLS e grants explícitos; auditoria sem URLs/credenciais. Escrita transacional
  com revisão esperada evita sobrescrever publicação concorrente.
- URLs são distribuição pública de software; nunca fontes de mídia, catálogo,
  credenciais, chaves de ativação ou segredos de assinatura. Não copiar links
  reais para código, docs ou logs. Download direto externo, nunca proxy Supabase.
- Publicação exige código inteiro crescente para nova versão, nome, hash e
  tamanho exatos. Espelhos devem conter o mesmo APK. Pode desativar publicação.
  Não presumir que substituir arquivo em um link equivale a publicar versão.
- Android consulta registro pequeno a cada 24 horas; JobScheduler persistente
  exige rede e complementa abertura do app. Agendamento depende do sistema,
  bateria e restrições; não promete horário exato nem execução sob force-stop.
- Lista ativa fica em cache privado: falha de metadata pode retentar download
  conhecido pelos espelhos. Sem backend não descobre releases ainda desconhecidas.
- Download nativo streaming limitado a 256 MiB, HTTPS inclusive redirects,
  timeouts, limite de redirects, arquivo parcial isolado. Falha HTTP, HTML,
  tamanho/hash/assinatura/package/versão inválidos tenta próximo espelho.
- APK só fica pronto após hash/tamanho e PackageManager validarem identidade,
  mesma assinatura instalada e versionCode maior e igual à publicação. Sem
  atualizar identidade/chave/token/ativação/fonte/catálogo/licenças.
- Próxima abertura mostra diálogo acessível de versão pronta. Adiar vale apenas
  para abertura atual; instalar lança instalador Android mediante ação explícita.
  Cancelamento/negação mantém sugestão; só versão instalada encerra pendência.
  Permissão de instalar fontes desconhecidas é apresentada pelo Android.
- Android APK apenas. Web, Tizen e webOS não recebem instalador APK.
  Apps antigos precisam receber uma primeira versão contendo este mecanismo.

## Allowlist estrita

- Esta spec, docs/evidence/C11_APP_UPDATE_MIRRORS.md; docs/STATUS.md,
  EVOLUTION_REPORT.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md.
- Source Data Boundary: exceção de metadata pública de atualização de software.
- src/app-update/**; src/debug/manager/ManagerAppUpdates.tsx e .css;
  ManagerPanelPage.tsx (render/import/guard); manager-access.ts (aba MASTER);
  src/main.tsx (montagem isolada do prompt).
- android/app/src/main/java/com/xandeflix/prebuilt/update/**;
- android/app/build.gradle: apenas versionCode 14/versionName 1.0.14, primeira
  versão contendo updater e códigos monotônicos em publicações seguintes.
  MainActivity.java (registro plugin); AndroidManifest.xml (permissões/JobService);
  res/xml/file_paths.xml (somente diretório de APK), backup_rules.xml e
  data_extraction_rules.xml (excluir cache/prefs do updater).
- Migration criada pelo CLI c11_app_update_mirrors, testes SQL correspondentes;
- Migration CLI c11_app_update_audit_action: estender somente os checks de
  auditoria com APP_UPDATE_PUBLISHED/APP_UPDATE, preservando todos os valores
  anteriores. Necessária após fixture detectar rejeição de nova ação pelo check.
  android/app/src/test/java/com/xandeflix/prebuilt/update/**;
  scripts/test-c11-app-updates.mjs. Saídas de build usuais, tsconfig.tsbuildinfo
  e tmp/c90-app-update-mirrors/** privados ignorados.

## Aceitação

## Extensão explícita — busca manual em Configurações

Usuário solicitou também comando de busca manual. src/ui/pages/SettingsPage.tsx
entra na allowlist somente para montar AppUpdateSettings. Consulta explícita
ignora intervalo diário, mantém single-flight, informa progresso/resultado,
permite instalar candidato validado e nunca altera ativação. Download manual
concluído pode oferecer instalação imediatamente; automático espera abertura.
Permissão/instalador Android continuam exigindo ação do usuário.

Validar MASTER versus ADMIN/anon, revisão concorrente, inputs e RPC público
sem configuração desativada/segredos; fixtures SQL revertidas. Validar versão,
prioridades, fallback e arquivo incompleto/hash inválido, sem instalação
automática; prazo diário e persistência/cancelamento. Verificar formulário
desktop/mobile, TypeScript, build Manager, compilação/testes Android e lock
antes/depois. Registrar limites de validação física. Nenhum cliente real alterado,
nenhuma release real publicada automaticamente, nenhum APK instalado ou Git.
