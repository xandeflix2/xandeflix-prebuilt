# C11 — Relatos de reprodução ao gestor (ciclo 57)

Pedido autorizado: substituir a dependência de WhatsApp em tablet/TV/D-pad por
um botão de envio ao gestor, tornar o aviso navegável pelo controle remoto e
apresentar notificações pelo sino do painel. Especificação anterior ao código.

Preflight: clone independente C11/main, origin xandeflix2/xandeflix-prebuilt,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e, baseline privado de 751 arquivos.
AGENTS, Architecture/Execution Contract, Source Data Boundary e lock de
ativação lidos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; nenhum Git write.
Projeto remoto confirmado: cujbmyhitgomlgwfkaat / Xandeflix Prebuilt / us-east-2.
Este pedido sucede as restrições de backend dos ciclos visuais anteriores
somente para o novo canal administrativo de diagnósticos sanitizados.

## Comportamento e fronteira

- Aviso oferece “Enviar ao gestor”, copiar e fechar em todas as plataformas.
  Emenda autorizada pelo usuário em 2026-10-09: WhatsApp permanece opcional
  em celular e tablet; oculto em Fire Stick, TV Box, Tizen e webOS. A decisão
  usa perfil de plataforma, independente de largura/layout e de identidade.
  UA de TV e Android sem touchscreen são excluídos; quando disponível, o
  status nativo existente também veta Android em modo televisão. Nenhuma
  alteração nativa/Cast nem transmissão iniciada para consultar esse status.
  Nenhum envio automático.
- D-pad no aviso alcança todos os controles habilitados; Enter executa uma vez,
  Voltar fecha o aviso e restaura o controle anterior. Em layout não-phone o
  aviso recebe foco; seu temporizador de 10 segundos pausa durante foco/interação.
- Envio manual usa identidade/token já persistidos, sem gerar/rotacionar chave.
  Confirmação só após persistência; falha/timeout permite repetir o mesmo ID
  idempotente. Não mantém fila offline nem grava credenciais/relato no storage.
- Relato aceita exclusivamente os 12 campos (13 linhas) do diagnóstico V1 existente:
  package/version/bundle/UTC/page/error code/category/HTTP/Media3/checkpoint/
  Android/WebView. Validação fechada no cliente e servidor. Sem nomes de conteúdo,
  temporadas, episódios, URLs, headers, tokens, source, catálogo ou stack livre.
  Identificação administrativa e licença são derivadas da base autenticada.
  Trata-se de auditoria sanitizada permitida pelo Source Data Boundary.
- RPC valida prova SHA-256 do token existente, status AUTHORIZED e binding
  ACTIVE. Relato não concede playback, não altera C9, licença, source ou identidade.
  Rate limit serializado por dispositivo: 5 novos relatos/minuto, 30/hora.
- Tabelas privadas com RLS, sem grants diretos a anon/authenticated; wrappers
  públicos invoker chamam helpers restritos. search_path fechado e execute
  PUBLIC revogado. Nenhuma Edge Function/segredo administrativo no cliente.
- Inbox exige private.require_active_manager (OWNER/ADMIN ativo), o mesmo
  escopo administrativo global do painel canônico atual. Não há tenant/gerente
  proprietário na base vigente; não inventar isolamento inexistente.
  Leitura de cada relato é individual por gestor autenticado.
- Sino com contador de não lidos, atualização enquanto painel estiver visível
  a cada 30 s com inbox fechado e ao abrir/atualizar, lista paginada (50),
  detalhes copiáveis, marcar como lido e fechar. Pausar polling durante leitura
  mantém foco e páginas adicionais intactos.
  Logout/unmount limpa lista e cancela respostas tardias. Falhas não simulam êxito.

## Allowlist estrita

- Este documento; docs/evidence/C11_MANAGER_PLAYBACK_ERROR_REPORTS.md;
  docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md; docs/{STATUS,DECISIONS,
  ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md.
- src/control-plane/client/playback-error-report.service.ts;
  src/playback/playback-support-diagnostic.ts;
  src/ui/components/PlaybackErrorNotice.tsx;
  src/ui/playback-support-profile.ts (política visual pura da emenda WhatsApp);
  src/ui/dpad-error-controls.ts; src/debug/manager/ManagerPlaybackErrors.tsx;
  src/debug/manager/ManagerPanelPage.tsx; src/App.tsx apenas fechamento prioritário
  do aviso no Voltar nativo, se necessário; src/index.css.
- Migration gerada pela CLI 2.120.0 antes do SQL:
  supabase/migrations/20261009021625_c11_manager_playback_error_reports.sql.
  Schema novo playback_support_private e três
  RPCs públicas novas, sem alterar funções/tabelas existentes.
- scripts/test-c11-manager-playback-reports.mjs;
  scripts/test-c11-playback-error-notice.mjs;
  scripts/test-c11-detail-tablet-tv.mjs apenas port window/Event no teste do
  handleBack existente (necessário para novo fechamento prioritário; assertions
  anteriores preservadas);
  scripts/test-c11-playback-support-diagnostic.mjs apenas dependências adicionais
  e regressões pertinentes; não relaxar assertions anteriores.
- Saídas usuais web/Capacitor/Gradle/APK e tsconfig.tsbuildinfo; helpers/evidências
  privados em tmp/c11-manager-error-reports-20261009.

## Aceitação e entrega

Testes executam parser real, serviço/notice/inbox reais: dados proibidos,
autenticação, timeout/repetição idempotente, respostas tardias, foco/D-pad,
contador/paginação/leitura/logout. Backend: fixtures isoladas em transação com
ROLLBACK, token errado/revogado/binding ausente, acesso anon/não-gestor negado,
grants/RLS, leitura por dois gestores, validação fechada/rate limit/deduplicação.
Nenhum relato fictício persistido/notificado em produção. Advisors após DDL.
Lock antes/depois, TypeScript, regressões pertinentes, build/sync/Gradle e
assinatura/assets reais. Install -r nos alvos já autorizados disponíveis com
comparação privada antes/depois; sem uninstall/reset/interferir em outro app.
Fire107 só após IP atual; S23 excluído por pedido. Teste UI não pode destravar OS
ou interromper NativePlayerActivity. Registros distinguem checks reais de fixtures.
Nenhuma alegação de consertar a mídia defeituosa Luke Cage/AirScreen neste ciclo.
