# C135 — fonte ativa e visibilidade de categorias adultas — 2026-10-16

## Pedido, preflight e fronteiras

Usuario reportou troca de fonte de um aparelho com conteudo adulto ausente em
Live/Filmes e falta de identificacao da fonte ativa nas configuracoes. Consultas
MCP read-only ao projeto esperado foram negadas por permissao; nao confirmou
binding real nem inventariou fonte/aparelho. Nenhum backend sera alterado.
Pergunta sobre setup/desbloqueio parental permanece pendente; nao presumir PIN,
alterar preferencias nem liberar adulto automaticamente por troca de fonte.

Clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, main, origin esperado,
HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d. AGENTS/Architecture/Execution,
Source Boundary/Activation Lock/C126 e refresh automatico lidos. Auditoria C134
PASS antes da nova escrita; preservar C133/C134 e APK1.0.23. Baseline privado
por hashes/prefixos em tmp/c135-active-source. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Sem commit/push/PR, remote writes, install/reset.

## Especificacao anterior ao codigo

- Adulto explicito permanece oculto ate setup local, limite18, permitir adulto
  e PIN valido para sessao15min. Fonte vinculada nao concede permissao parental.
  Nao enviar PIN/PUK/preferencias ou catalogo ao Supabase. Live ja observa sessao
  parental; testar isso com fixture completa contendo grupo adulto e comum.
- CatalogBrowsePage deve assinar estado parental e recalcular categorias quando
  status/politica/sessao mudam, evitando lista memoizada com adulto ausente apos
  liberar ou titulo adulto residual apos bloquear/expirar. Nao alterar catalogo,
  classificacao, matching, source nem mecanismo de grants.
- Novo painel em Settings exibe somente sourceId/sourceVersion do catalogo REAL
  promovido, data de importacao e estado de verificacao da fonte remota vinculada
  via AuthorizedSourceResolver existente. Sem confundir fonte cadastrada com
  fonte em uso. Nome amigavel nao existe no DTO remoto atual; identificar por ID
  e versao explicitamente, sem inventar nome nem usar message/config como label.
- Leitura local limitada a pointer/manifest/pointer: confirmar mesma geracao,
  sourceId e sourceVersion. Erro/ausencia/inconsistencia nao e fonte confirmada.
  Nenhuma leitura de playlist/cofre/catalogo completo para mostrar esse estado.
  Resultado projetado tem whitelist, nunca config, URL, credencial, license/token
  ou erro remoto livre. Falha remota pode mostrar fato local, sem atestar binding.
- Acoes Conferir fonte e Atualizar catalogo. Atualizacao reutiliza coordenador
  existente checkContent=true e barreira canPromote; somente app visivel/online,
  sem player/Cast/modal ativo. Nao parar video, abrir conexoes de midia, alterar
  identidade, vinculo ou configuracao; manter single-flight do coordenador e
  impedir cliques concorrentes. Falha preserva ativo e mostra aviso sanitizado.
- Mostrar status parental local e acesso ao controle existente, sem novas
  preferencias/grants. Controles touch/D-pad acessiveis, cinco cards fluem na
  grade existente4colunas de Fire/tablet. Sem refatorar menus ou layout geral.
- Versao Android24/name1.0.24, mesmo package/assinatura/marca, APK separado para
  update manual. Preservar dados existentes e APK anterior por hash.

## Allowlist estrita

- src/ui/settings/active-source-status.ts (novo): projecao sanitizada, leitura
  coerente, consulta autorizada, guarda/sync existente com dependencias testaveis.
- src/ui/components/ActiveSourceSettings.tsx (novo): card, estado/cancelamento,
  acoes, subscricao de conclusao do coordenador e status parental local.
- src/ui/pages/SettingsPage.tsx e .css: inserir card e somente estilos locais.
- src/ui/pages/CatalogBrowsePage.tsx: subscricao/dependencias da lista categorias.
- android/app/build.gradle: versao apenas.
- scripts/test-c135-active-source.mjs e scripts/test-c135-adult-categories.mjs:
  novos testes com portas sinteticas, nenhum dado real/requests de fonte.
- Este spec/docs/evidence/C11_ACTIVE_SOURCE_AND_ADULT_VISIBILITY.md;
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only.
- Saidas usuais ignoradas teste/build/sync/Gradle/APK e helpers privados em tmp.

## Aceitacao e entrega

Fonte igual/trocada/mesmoID-versao diferente, ausente, metadata inconsistente,
falha remota/local, corrida de geracao, payload com campos extras sensiveis;
resultado UI nunca atesta fonte errada nem vaza extras. Atualizacao guardada,
sucesso/NO_OP/falha e unmount/concorrencia; chamadas sinteticas somente.
Controle negativo de categorias no codigo anterior; adulto oculto antes do
setup, apos permitir sem desbloquear e apos re-lock/expiracao; visivel depois
de PIN em filmes/series/Live. Conteudo comum18 nao e adulto explicito.
UI oito perfis, D-pad/click, regressoes C126/C128/C129/C133/C134, refresh
automatico e boot/troca de fonte, lock antes/depois/prebuild, TS/Vite/sync/
Gradle e assinatura/recursos/APK. Auditar allowlist/C134/memorias/Git.
Sem acesso ao aparelho e sem MCP autorizado, diagnostico especifico do binding
real XF permanece nao confirmado; nao anunciar que a fonte comercial mudou
ou que o conteudo real foi recebido. Entrega deve distinguir teste e pendencia.

## Emenda previa — area18+ e categoria Live bloqueada

Usuario esclareceu que o PIN existe, mas deseja ponto de entrada sem capas
explicitas nas categorias comuns. Autoriza icone discreto18+ no menu, PIN antes
de imagens e pagina propria em grade, sem carrossel, para filmes/series adultos
da fonte. Depois manteve categorias adultas em Live: nomes de categorias podem
aparecer, nunca nomes/logos/lista de canais antes do PIN. Substitui a previsao
anterior de exibir categorias adultas de filmes no browse normal apos liberar.

Manter setup/limite18/permitir adulto; se nao elegivel, orientar ao controle
existente. PIN valido abre sessao local15min usando modal global/ocultacao
C134. Novo requestAdultSession usa mesmo prompt/KDF/cooldown, cancelamento,
AbortSignal e lockEpoch. Navegacao nao concede playback. Sem dados persistidos
extras, PIN de gestor ou alteracao de verifier/politicas/grants anteriores.

App encerra sessao sincronicamente antes de renderizar destino publico ao sair
da area/Live/controle; lock de saida tambem invalida PIN pendente. Detalhes
abertos pela grade18+ recebem marca privada em RouteLocation, mantida no Back;
nao derivar permissao de hash/historico solto. ParentalDetailGate/C9 continuam.
Conteudos comuns18 continuam no catalogo comum. Categorias adultas de filmes/
series nao sao mostradas no browse normal. Grade18+ le segmentos com cursor/
cotas, mistura VOD adulto por flags/categorias da fonte e permite Carregar mais.
Sem consulta TMDB para decidir adulto, carga integral ou catalogo remoto.

Live solicita apenas grupos bloqueados por opcao explicita de metadata no
leitor/projecao. Dados de canais permanecem filtrados. Selecionar grupo adulto
pede PIN antes de mudar selecao/carregar lista; cancelar/errar preserva preview
e grupo anterior. UI de gate nao tem arte/nome de canal antes de autorizado.
Mobile recebe acesso18+ em configuracoes/cabecalho, conservando menu inferior.

Ampliacao estrita da allowlist anterior, antes do codigo:

- src/parental/parental-control.store.ts: prompt de sessao e guardas acima.
- src/parental/parental-content.ts e src/catalog/live/live-catalog.service.ts:
  opcao includeLockedGroups, titulos somente e canais filtrados.
- src/ui/pages/LiveTvPage.tsx: metadata de grupos, selecao com PIN e cadeado;
  preservar C134/player/C9 e gestos existentes.
- Novos src/ui/pages/AdultPage.tsx e .css e src/catalog/adult-catalog-reader.ts:
  gate/grade paginada, abort/geracao, foco touch/D-pad.
- src/ui/navigation/route-state.ts: view adult e flag adultArea de detalhes;
  navigateTo aceita flag opcional, padrao publico.
- src/App.tsx: rota, callbacks/settings, marca de detalhes e lock antes de
  commit publico, preservando barreira de saida Live.
- src/ui/components/Header.tsx: icone18+/acesso mobile. AppShell.tsx somente
  classe/header-back da nova view, sem mudar autoridade.
- src/ui/hooks/useDpadNavigation.ts: entrada/ordem do gate18+ e grade, sem
  alterar prioridade modal/percurso consolidado.
- src/ui/pages/ParentalControlPage.tsx: acesso18+ no lugar do formulario isolado
  de desbloqueio; manter PIN/PUK/politicas/callbacks anteriores.
- src/bootstrap/automatic-source-refresh.ts: adiar durante area18+.
- scripts/test-c129-parental-tv-navigation.mjs e scripts/test-c134-activation-dpad.mjs:
  somente porta sintetica do novo card em Settings, preservando asserts.
- Testes C135 incluem gate/rotas/Live/grade, negativas, fonte local vs vinculada,
  cancelamento e privacidade antes do PIN/depois da saida. Revisao React aplica
  a todos os TSX tocados. Sem backend para nome: DTO oferece somente ID/versao.

## Emenda previa — sexta falha de PIN bloqueia por3h

Usuario solicitou cinco tentativas e bloqueio na sexta incorreta por3horas.
Aplicar a mesma verificacao compartilhada do controle parental: falhas1–5
retornam incorreto; falha6 persiste blockedUntil=agora+10800000ms, revoga sessao
adulta/admin/grants e informa cooldown. Nao executar KDF nem consumir tentativas
durante bloqueio. Persistencia existente mantem prazo apos restart; PIN correto
antes da sexta zera contagem. Depois do prazo, nova janela de seis falhas.
PUK compartilha o bloqueio existente para nao servir de bypass; nao atingir
chave de ativacao, autorizar gestor ou permitir reset. Sem mudar KDF/storage.
Adicionar src/parental/parental-access.ts somente mensagem de tres horas, e
scripts/test-c126-parental-control.mjs somente atualizar teste do limite antigo
para nova exigencia (cinco false, sexta cooldown, restart/PUK e prazo3h).
Novos testes C135 cobrem reinicio, sucesso antes do limite, tentativa durante
cooldown sem escrita/KDF, expiry com nova janela e sessao revogada.

## Emenda previa — cronometro independente do horario

Usuario requer impedir antecipacao via alteracao de data/hora. blockedUntil
de parede deixa de ser autoridade; preservar somente compatibilidade informativa.
Persistir no mesmo registro local protegido um checkpoint opcional pinBlock com
remainingMs, elapsedAtMs e clockId (sem identificador pessoal). Android usa
SystemClock.elapsedRealtime (inclui deep sleep) e BOOT_COUNT para separar boots.
Mesmo boot: descontar apenas delta monotonicamente comprovado, inclusive app
fechado. Boot diferente/relogio regredido: conservar restante e reancorar, nunca
liberar por Date.now. Tempo desligado sem evidencia confiavel nao reduz bloqueio.
API23/bootCount indisponivel usa ID de processo; web usa performance.now + nonce
de sessao, conservador entre recargas. Nao alegar contagem de tempo desligado
nesses casos. Nenhuma consulta a servidor/NTP/gestor para contar bloqueio.

Checkpoint a cada30s somente durante bloqueio e antes de verificar PIN, com
persistencia verificada/serializacao existentes; timer leve, sem KDF/rede.
Tentativas bloqueadas nao mudam contador nem executam KDF, mas podem gravar
restante atualizado. Registro legado com prazo mas sem ancora migra de forma
conservadora para3h; clock indisponivel/malformado falha fechado. Depois de
restante0, zerar contador/prazo/ancora. Testar salto de parede +/−dias, restart
mesmo boot, reboot, elapsed regredido, falta/erro de clock e expiry exato.

Allowlist adicional previa: src/parental/parental-storage.ts (bridge de clock),
novo src/parental/parental-clock.ts (tipos/validacao/conta pura) e metodo somente
de leitura em android/app/src/main/java/com/xandeflix/prebuilt/security/LocalParentalControlPlugin.java;
novo teste Java de contrato do clock e testes C135 de timer/store. Nenhuma
mudanca de chave/alias/prefs/cifra/backup/MainActivity ou permissao Android.

## Emenda previa — preservar preview ao liberar categoria

Teste C135 real revelou que a nova sessao parental recria a projecao Live e
reinicia a midia/C9 do mesmo canal comum, porque o efeito depende do objeto
liveCatalog inteiro. Permitir trocar somente essa dependencia pela identidade
liveCatalog.snapshotId; selectedChannel continua dependencia e o guard parental
existente remove selecao que deixou de ser permitida. Nada de mudar acquire/
release/URI/teardown. Teste conserva zero trocas de midia ao apenas abrir
categoria. Port sintetico updatePreview tambem deve retornar previewId conforme
contrato existente, evitando falha artificial; nao relaxar expectativas.

## Emenda previa — retry do leitor adulto

Revisao do novo leitor identificou que erro na leitura de series apos coletar
filmes pode avancar cursores sem entregar o lote. Alterar somente o novo leitor
para salvar/restaurar seu estado local em falha/abort; retry entrega o mesmo
lote, sem omitir titulos. Sem modificar o leitor segmentado compartilhado.
Adicionar scripts/test-c135-adult-reader.mjs para falha na segunda fase,
retry completo/sem duplicatas, abort e troca de geracao, com portas sinteticas.

## Emenda previa — portas de regressao e perfil de fixture

C106 extrai commitRoute e precisa fornecer isAdultLocation real e porta local
parentalControl.lock; manter asserts de teardown/C9 e acrescentar ordem do lock
antes da rota. Ajustar somente assinatura esperada de navigateTo para argumento
adultArea novo. Allowlist scripts/test-c106-live-preview-route-exit.mjs.

Suite historica P5B falhou em T2: fixture sem classificationProfileVersion pede
rebuild, impossibilitando testar NO_OP do mesmo perfil. Coordenador/perfil sao
identicos ao baseline C134. Em scripts/test-c11-p5b-boot-sync-coordinator.mjs,
permitir apenas marcar metadata dos pacotes sinteticos com a constante atual
do perfil; nenhum assert/politica produtiva sera relaxado. Reexecutar a suite.
