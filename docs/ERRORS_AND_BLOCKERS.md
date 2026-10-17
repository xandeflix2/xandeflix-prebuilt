# Registro de Erros e Bloqueadores (Errors and Blockers)

## 2026-10-05 — LIVE_SCREEN_AWAKE_PATCH_INSTALLED_PHYSICAL_TIMEOUT_PENDING

Bug reportado nos dois modos Live: prévia/fullscreen sem proteção de tela na
MainActivity, descanso configurado5min. Patch mínimo por estado do PlayerView,
sem alterar ajustes globais/ativação/C9/UI, instalado somente Fire Stick com
Success/hash correto e5 privados+436 catálogos preservados. Lock49+9,128 Java,
novo wiring+8 negativos e regressões selecionadas PASS. Controle vermelho
anterior ao patch foi esperado, não falha pós-fix. Consulta auxiliar Node usou
test-c11-native-player-bridge.mjs inexistente (MODULE_NOT_FOUND); não guard
válido. rg encontrou native-bridge-retention, reexecutado PASS+4 negativos;
live-repair20 PASS. Probes TSX iniciais inexistentes igualmente corrigidos por
inventário, sem alteração de produção motivada por nomes errados. Avisos de
build/META-INF preexistentes mantidos; não repack/relaxamento. mHoldScreenWindow
null na primeira amostra não corresponde a reprodução comprovada; amostra final
observou hold-screen da MainActivity no Android físico. Teste6min na prévia
e6min fullscreen solicitado, PENDENTE; modo/duração não certificados. Não afirmar resolução física integral
por instalação/JVM. T15 legado fora do escopo; sem Git/backend/reset/novo Gate.
[Evidência](evidence/C11_LIVE_SCREEN_AWAKE_FIX.md).

## 2026-10-05 — TABLET_FIRESTICK_UPDATE_VERIFIED_AND_ASSET_PROBE_RESOLVED

Sem falha de lock/assinatura/install/hash/preservação na atualização autorizada:
49+9 PASS, Success/exit0 em SM-X610 e AFTSSS, mesmos5 privados e505/436 arquivos
de catálogo, timestamps de instalação original inalterados. Não certificar
playback/abertura por instalação nem publicar fingerprints privados.
Conferência auxiliar inicial falhou APK_DIST_ASSET_MISSING ao procurar os dois
Cordova placeholders do Capacitor no dist. Inventário provou ambos vazios;
checagem corrigida exigiu igualdade dos5 arquivos reais e validou os2 extras,
sem editar APK/runtime/lock ou ocultar erro. Avisos META-INF antigos mantidos.
SM-T561: usuário reportou RPC_FAILED/RPC e, depois, início de sincronização ao
ligar internet. Compatível com conectividade, sem causa comprovada ou catálogo/
playback concluídos. Nenhuma correção especulativa nem RPC mutante executada.
Sem reset/rebuild/backend/commit/push/PR/novo Gate; testes físicos pelo usuário.
[Evidência](evidence/C11_TABLET_FIRESTICK_CURRENT_APK_UPDATE.md).

## 2026-10-05 — NEW_TABLET_SM_T561_INSTALL_VERIFIED

Nenhuma falha de lock/compatibilidade/instalação/hash observada na entrega ao
novo SM-T561/API27. ADB ausente do PATH: SDK local validado utilizado sem alterar
configuração global; não executar helper antigo com serial hardcoded do SM-X610.
Apksigner PASS/v1+v2, avisos preexistentes META-INF/v1 mantidos sem reempacotar.
Success/exit0 e package/hash instalado confirmados, sem uninstall/clear/root.
Lock49+9 PASS, APK/operacionais intactos. Geração de identidade/chave/ativação,
catálogo/playback/desempenho ainda não testados nesse alvo: não antecipar sucesso
funcional por instalação. Sem outro aparelho/backend/novo commit/push/Gate.
[Evidência](evidence/C11_NEW_TABLET_LATEST_APK_INSTALL.md).

## 2026-10-05 — INDEPENDENT_GIT_RECORDS_PUBLICATION_AUTHORIZED

Nova autorização explícita de commit/push, oito documentos somente; parent/remoto
fd2f561, Git próprio correto, zero hooks ativos/workflows. Nenhum conflito de
proveniência detectado. O sucesso do ciclo de migração anterior não dispensa
revisão do manifesto/segredos/refs; divergir/falhar exige STOP, sem force ou teste
relaxado. Candidatos sem segredos de alta confiança, lock49+9/548 hashes PASS.
Avisos LF→CRLF preexistentes serão tratados como warning com exitcodes
conferidos, não redirecionados em PowerShell/Stop. Nenhuma correção funcional,
limpeza, backend/deploy ou novo Gate autorizado; backups/operacionais privados.
[Plano vigente](architecture/C11_INDEPENDENT_GIT_MIGRATION.md).

## 2026-10-05 — INDEPENDENT_GIT_MIGRATION_LOCAL_VALIDATIONS

Dependência física da C11 ao Git histórico removida por migração autorizada,
com backups completos verificados e troca apenas de metadata. Nenhuma falha
de cópia, hash, clone, fsck, attachment, lock, typecheck ou build observada.
Consultas auxiliares read-only usaram três nomes inexistentes: EVOLUTION.md,
test-c11-catalog-promotion-directory-fix.mjs e tsconfig.node.json. Não considerar
essas consultas válidas: catálogo/lock e arquivos existentes reconferidos com
EVOLUTION_REPORT.md, test-c11-catalog-promotion-directories.mjs e tsconfig.json
(noEmit=true); nenhuma alteração funcional motivada por esses erros de consulta.
Prebuild lock49+9 PASS após AGENTS, build414 sem crypto externalized; avisos
preexistentes node:fs/node:path provisioning, mixed imports/chunk grande mantidos.
Git informa futura conversão LF→CRLF em docs conforme core.autocrlf=true,
preservado; diff --check PASS, sem normalização global. Checagem auxiliar final
`git diff --name-only 2>$null` foi interrompida pelo PowerShell/Stop ao tratar
esse warning stderr como NativeCommandError, não por falha de Git/migração.
Não contar essa tentativa como allowlist PASS; reexecução sem redirecionar stderr
confirmou exit0, seis docs na allowlist, dois novos registros e sete operacionais
preservados; backup ignorado/índice sem staging PASS. Testes específicos chave16,
fonte31/playback11 PASS; teste legado manager-form14/15 permanece pendência
preexistente, não reexecutado nem relaxado nesta migração administrativa.
APK/dist/arquivos locais preservados, backup privado e pasta histórica retidos.
Sem novo commit/push/PR, deploy/db write, aparelho/reset, exclusão ou novo Gate.
[Evidência](evidence/C11_INDEPENDENT_GIT_MIGRATION.md).

## 2026-10-05 — PUSH_TREE_QUOTING_AUXILIARY_RESOLVED

Usuário autorizou envio dos quatro commits; push normal aceito exit0 e remoto
fd2f561 confirmado. Verificação auxiliar posterior usou HEAD^{tree} sem aspas:
PowerShell interpretou scriptblock/adicionou -encodedCommand; resultado inválido
e comando git falhou. Não classificar essa tentativa como checagem de árvore PASS.
Reexecução read-only com referências entre aspas e exitcodes conferidos confirmou
árvore4311479d4d7d37ce71dfccc844f661764ab34665 local/tracking/GitHub idêntica,
quatro SHAs publicados presentes e ahead/behind0/0. Nenhum novo push/commit, reset
ou correção funcional. Registros desta entrega permanecem LOCAIS, não publicados
como quinto commit. Sem backend/deploy/aparelhos/Gate; APK/runtime preservados.
[Evidência](evidence/C11_GIT_CONSOLIDATION.md).

## 2026-10-05 — PUSH_ADMINISTRATIVE_EVIDENCE_RECEIVED

Supabase Deploy to production aparece OFF nas capturas da configuração enviadas
pelo usuário; repo correto conectado. Primeira captura era catálogo /integrations,
não configuração, e não foi usada como prova. Vercel sem vínculo nos escopos
acessíveis; isso não certifica outras contas/hospedagens. GitHub credenciais com
push sem admin: hooks/protection HTTP404, não prova de inexistência. Capturas
administrativas posteriores do usuário mostram webhooks vazios e somente o App
Supabase instalado; retenção por falta de evidência esclarecida, nenhum gatilho
de deploy de produção identificado nas superfícies inspecionadas. Push ainda
não executado, aguarda confirmação expressa/reconferência do remoto; nenhuma
integração/branch policy modificada para contornar. Atualização documental inicial
recusada por contexto de patch inexistente; aplicação abortou sem mudança parcial,
reexecutada com contexto correto. Nenhuma alteração de runtime/teste nesse erro.
Testes novos/lock/typecheck/build PASS; manager-form continua14/15 por literal
T15 já ausente no parent995de5f. Scanner inicialmente exit1 por três URLs antigas
de fixtures: classificação manual por contexto sintético, não remoção de teste
nem exposição de URL/credencial. Nenhum segredo de alta confiança detectado nos
455 textos; varredura não é auditoria universal de segurança. Avisos de build
anteriores mantidos; zero warning crypto. Sem write remoto/aparelhos/novo Gate.
[Evidência](evidence/C11_GIT_CONSOLIDATION.md).

## 2026-10-05 — AUTHORIZED_KEY_PRESENTATION_LOCAL_FIX_DELIVERED

Chave existente era omitida porque JSX/cópia estavam dentro do formulário
effectiveStatus!==AUTHORIZED. Não é perda/regeneração da chave nem regressão
introduzida pelo atalho Home; renderer do HEAD reproduziu a omissão. Fix mínimo
autorizado/página comum entregue ao celular; serviços/efeitos preservados por AST
e lock49+9. Cinco privados/508 catálogo idênticos após ambas atualizações in-place.
Nova UI18/browser/clipboard/layout/build/assinatura/hash final PASS; confirmação
visual física final pendente, nenhum outro aparelho ou fonte real alterado.
Auxiliares: CommonJS import.meta falhou duas vezes, cast .env exigiu mock de
import.meta inteiro; nenhuma alteração de env em produção. Eval PowerShell perdeu
aspas (ReferenceError: vite), depois atob interpretou UTF8 como Latin1 e comparação
acentuada falhou; decodificação UTF8 explícita confirmou a UI sem erro. Reexecuções
válidas registradas, não ocultar tentativas nem relaxar testes. Instrução espacial
A1 ajustada na revisão final e APK rebuilt/revalidado/reinstalado somente phone.
Avisos preexistentes de build/apksigner e teste legado manager-form continuam
fora do escopo; HTTP403/publicação do painel não declarados resolvidos.
[Evidência](evidence/C11_ACTIVATION_KEY_VISIBILITY.md). Sem Git/backend/novo Gate.

## 2026-10-05 — PHONE_INSTALL_HASH_FORMAT_AUXILIARY_RESOLVED

Conferência read-only inicial de hashes do catálogo rejeitou o formato retornado
pelo comando composto, com CATALOG_HASH_FORMAT_FAILED, antes de alcançar install.
Sem escrita ou mudança de dados nesse erro; causa específica de quoting/truncagem
não confirmada. Substituída por find explícito, validação dos caminhos e sha256sum
direto em lotes de64:508 arquivos conferidos antes/depois, zero diferenças.
Entrega ao único celular com Success e hash instalado correto; cinco arquivos
privados preservados. Sem reinstalação limpa, launch, reprodução ou fonte real
alterada. Fire Stick/tablet não atualizados. HTTP403 e publicação do painel
continuam pendentes; falha textual legada do teste manager-form não alterada.
[Evidência](evidence/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md).

## 2026-10-05 — EXCLUSIVE_SOURCE_LOCAL_COMPLETE_REMOTE_USE_PENDING

HTTP403 do provedor não confirmado resolvido. Nova fonte depende de URL com
credenciais próprias e confirmação no painel; nenhuma escrita remota executada.
Painel mudou só localmente; hospedagem/push continuam retidos por integração
automática desconhecida. Sem teste físico/instalação nesta tarefa.
R2F2B0 manager-form T15 falha por exigir frase já ausente em HEAD995de5f (14/15);
não é mudança provocada pelas duas props novas; não relaxar teste fora do escopo.
Guard null-expiry JSON corrigido na revisão com teste dedicado,31 exclusivos PASS.
Reexecução browser teve timeout de spawnSync/cleanup; erro primário agora explícito;
CUA sem browser; sessão CLI nova pré-aberta e reexecução final PASS. Lock/build/
assinatura/assets PASS, avisos de build/signature metadata preexistentes permanecem.
[Evidência](evidence/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md).

## 2026-10-05 — C11_PUSH_HELD_AUTOMATIC_DEPLOY_UNKNOWN

Usuário desconhece se push main dispara deploy. Leitura GitHub: zero workflows/
runs/deployments/environments/check-runs/statuses; webhooks HTTP404, não prova
de ausência. Supabase sem development branches não descarta integração GitHub.
46 migrações remotas/44 locais com timestamps divergentes: não reconciliar nem
executar db push/deploy. Publicação retida até inspeção administrativa e direção
caso deploy esteja ativo. Testes locais/build PASS, sem nova regressão funcional.
Git diff --check apontava EOF vazio em storage; retirada cirúrgica, hash anterior
reconstruído em memória somente pelo sufixo de newlines. Avisos preexistentes
de node:fs/path/imports mistos/chunk permanecem; crypto NÃO externalizado.
Execuções auxiliares de inventário precisaram corrigir quoting/limite de tamanho
de comando, sem edição funcional ou exposição de credenciais. APKs intactos.
[Evidência](evidence/C11_GIT_CONSOLIDATION.md). Sem backend/aparelhos/novo Gate.

## 2026-10-05 — IMAGE_CLEANUP_MANUAL_COMPLETE_POST_AUDIT_PASS

Bloqueio de execução automática continua histórico e não foi repetido/contornado.
Usuário pediu guia manual e confirmou conclusão. Auditoria read-only:16/16
imagens ausentes,405/405 consolidados e7991 preservados byte-idênticos ao
pré-ciclo; scripts/evidências/recursos/APK atual/último backup intactos. Sem nova
regressão detectada ou pendência da allowlist. ~21,7MB retirados do workspace,
não espaço livre medido; Lixeira não inspecionada. Sem código/build/testes novos/
instalação/Git/backend/dispositivos/ativação/player/novo Gate.
[Evidência](evidence/C11_SAFE_WORKSPACE_CLEANUP.md).

## 2026-10-05 — IMAGE_CLEANUP_POLICY_BLOCK_BEFORE_FILE_DELETE

Nova tentativa normal de exclusão não-recursiva de16 PNGs expressamente
autorizados foi rejeitada por exec_command/CreateProcess antes de iniciar:
blocked by policy. Nenhuma repetição/helper/codificação/método equivalente.
16/16 imagens/21732500bytes presentes depois; zero arquivos removidos.405/405
consolidados iguais antes; scripts scratch/APK atual preservados. Exclusão das
capturas pendente, sem regressão de produto ou mudança funcional. Não alegar
21,7MB liberados nem confundir com anterior limpeza manual de caches concluída.
[Evidência](evidence/C11_SAFE_WORKSPACE_CLEANUP.md).

## 2026-10-05 — SAFE_CLEANUP_MANUAL_COMPLETE_POST_AUDIT_PASS

Bloqueio da exclusão automatizada não foi repetido pelo agente. Usuário solicitou
e executou manualmente etapas da mesma allowlist, confirmando respostas; auditoria
independente confirma199/199 alvos ausentes e405/405 consolidados/8023 preservados
byte-idênticos. Lock49+9/typecheck PASS; sem regressão detectada ou pendência de
limpeza. APK atual/18 APKs raiz/918 PNGs/92 relatórios protegidos. ~3,1GB conforme
inventário de alvos anterior, não medida do espaço livre. Sem build/recriação
de caches/código/Git/backend/dispositivo/novo Gate. Bloqueio automático permanece
histórico, não impede reconhecer resultado manual observado e verificado.
[Evidência](evidence/C11_SAFE_WORKSPACE_CLEANUP.md).

## 2026-10-05 — SAFE_CLEANUP_EXECUTION_POLICY_BLOCK_BEFORE_DELETE

Primeiro comando de limpeza foi rejeitado por exec_command/CreateProcess:
"rejected: blocked by policy". Não iniciou, zero arquivos/bytes removidos.
Lock49+9/baseline405 PASS;193 caches/cinco alvos nativos/APK duplicado presentes
após rejeição,18 APKs raiz/hash do APK atual preservados. Sem regressão técnica
de produto; bloqueio de execução impede concluir limpeza. Não repetir por outra
codificação/shell/helper/método para contornar controle; não alegar3,1GB liberados.
Demais etapas não executadas. Requer liberação legítima do ambiente para retomar.
[Plano](architecture/C11_SAFE_WORKSPACE_CLEANUP.md) e
[evidência](evidence/C11_SAFE_WORKSPACE_CLEANUP.md).

Registro auxiliar: tentativa de anexar resultado ao plano por apply_patch não
encontrou contexto textual e não alterou arquivo; patch corrigido para o contexto
exato e aplicado. Nenhum efeito em código/artefatos ou exclusão de dados.

## 2026-10-05 — PHONE_DETAIL_HEADER_FIXED_THREE_DEVICE_DELIVERY_COMPLETE

Regressão visual reportada: detalhes não incluídos no seletor phone64px/Back direito.
Negativo PHONE_DETAIL_HEADER_MUST_SHARE_64PX_HEIGHT reproduziu baseline0665;
patch mínimo Shell/CSS aprovado pelo positivo30 e regressões250, zero erros.
Nenhum novo bloqueador de código/build; ativação/player/detalhes/native intocados
por401/405 hashes. Lock49+9/guards/build/sync/Gradle PASS. APK EE BE validado,
backup0665 mantido. Celular recebeu in-place com privados4/catálogo508 iguais e
abertura normal; Fire segundo/privados4/catálogo436 iguais, tablet reconectado
por último/privados4/catálogo505 iguais. HashEEBE/abertura normal confirmados nos
três;405/405 hashes finais locais idênticos após entrega. Ordem usuário mantida,
sem pendência de instalação. Sem reset/Git/backend/Settings/novo Gate/60s. Fixture de
detalhes sintético/abertura normal não homologam mídia física ou episódios reais.

## 2026-10-05 — PHONE_FIRE_TABLET_0665_SEQUENTIAL_DELIVERY_COMPLETE

Celular e Fire receberam APK0665 nessa ordem com install-r/sem limpeza,
privados/catálogos iguais/hash instalado/abertura confirmados. Não houve falha
de instalação ou regressão local:405/405 hashes iguais, lock49+9 PASS.
TabletSM-X610/RX2X301Q3KY inicialmente ausente foi reconectado após solicitação
e apareceu no ADB durante consolidação. Instalado por último, privados4/catálogo505
iguais/hash0665/abertura normal confirmados. Pendência resolvida sem reset,
mesmo artefato entregue nos três. Sem patch/build/APK/Git/backend/
Settings/novo Gate/60s. Reprodução física não certificada por abertura normal.

## 2026-10-05 — PHONE_FOUR_ICON_NAVIGATION_VERIFIED_APK_READY_NOT_INSTALLED

Novo requisito implementado: quatro ícones maiores no rodapé, Início no topo
das quatro páginas solicitadas, sem ambos os retornos na Home. Status longo
de sincronização colidia com novos botões em320px; negativo reproduzido e
correção CSS somente nessas rotas mantém dot/texto acessível sem sobreposição.
Browser250/zero erros/lock49+9/guards/build/sync/Gradle PASS; ativação/player/
Java/source/Live intocados. Nenhum bloqueador de código/build em aberto.
APK06655653...CD4A964 gerado/validado; não instalado porque pedido atual não
autoriza nova entrega e pergunta opcional permanece sem resposta. Não alegar
homologação de mídia física. Sem ADB/limpeza/Git/backend/Settings/novo Gate/60s.

## 2026-10-05 — PHONE_HOME_HEADER_HEIGHT_FIXED_THREE_DEVICE_DELIVERY_COMPLETE

Altura64px anterior escopada às três rotas solicitadas não incluía Home; novo
pedido inclui Home mobile no mesmo seletor (uma linha). Assert Home64 rejeitou
5C34 e final209 checks/zero erros confirmou ajuste/retorno/Live/layouts intactos.
Lock49+9/build/sync/Gradle PASS; nenhuma mudança de ativação/player/Java/TSX.
CE39 instalado-r no celular/Fire com quatro privados/catálogo preservados.
Tablet reconectado pelo usuário também recebeuCE39 com privados/catálogo iguais
e abertura normal; nenhuma pendência de instalação desse APK nos três aparelhos.
Sem Git/backend/Settings/novo Gate/60s; mídia física não certificada por esses testes.

## 2026-10-05 — UNIVERSAL_HOME_BACK_AND_PHONE_HEADER_GEOMETRY_FIXED_DELIVERED

Home tablet exibia Back pela política anterior explicitamente limitada ao phone;
novo pedido universal corrigido por dois guards de render no Shell. Histórico/
hardware/retorno fora da Home não mudam. Header phone50/52px e baseline do glifo
tipográfico causavam pouco espaço/seta visualmente baixa; novo64px+safe-area e
SVG20px centralizado garantem botão44px contido nas três rotas especificadas.
Negativos Home/altura rejeitaram B3B, final209 checks/zero erros, lock49+9/guards/
build/sync/Gradle PASS. Sem regressão ativa identificada nesses testes.

Tablet reconectado após entrega celular final permitiu atualização5C34 também
nele; Fire103/celular/tablet install-r SUCCESS, hash público/abertura normal e
quatro privados/catálogos436/508/505 iguais. Nenhum reset/ativação alterada.
Patch de registro inicialmente usou contexto incompleto e não aplicou; ajustado
ao contexto exato, nenhum arquivo funcional afetado. Registro B3B corrigido:
celular com processo ativo mas fora de primeiro plano no diagnóstico, sem falso
relato de foreground/crash. Nenhum Git/backend/Settings/novo Gate/teste limpo/60s.
Playback físico não certificado por estas evidências, usuário testará.

## 2026-10-05 — PHONE_HEADER_BACK_LAYOUT_FIXED_AND_THREE_DEVICE_DELIVERY_COMPLETE

Causa: Header mantém botão antes da marca no mesmo header-left. Classe de rota
e CSS max599 só Filmes/Séries/Busca reordenam esse MESMO controle para direita
e ocultam back-label; acessibilidade/44px/histórico mantidos. Novo negativo
rejeitou baseline por botão à esquerda. Primeiro positivo passou todos phones,
mas assumiu gutter32px em tablet; teste corrigido para right computado da regra
canônica, tolerância1px, sem mudar layout tablet. Final202 checks/zero erros,
lock49+9/guards/build/sync/Gradle PASS; sem regressão ativa identificada.

Fire IP antigo104 recusava ADB10061; usuário informou103, conexão/instalação
bem-sucedidas. Tablet recebeu B3B0D71E...4D3623 antes de desconectar; diagnóstico
combinado posterior indisponível na desconexão, não evidência de crash. Celular
reconectado recebeu mesmo APK; ambos processos confirmados, Fire em primeiro
plano e celular fora de primeiro plano no diagnóstico posterior (não crash).
Três install-r com hash público confirmado/quatro privados e catálogo iguais,
sem limpeza/chave nova. Pendências de entrega anteriores superseded; nenhuma
alteração de ativação/backend/Git/Settings/novo Gate ou prazo60s. Testes de
reprodução e gestos físicos seguem dependentes do usuário, não certificados
por browser ou sucesso de instalação.

## 2026-10-05 — DELIVERY_PENDING_TABLET_CONNECTION_AND_FIRE_ADB_REFUSED

Entrega autorizada nos três aparelhos: celular concluído com APK9FF23801...F9CF80,
ativação/chave/catálogo preservados, abertura/processo confirmados. Tablet
SM-X610/RX2X301Q3KY não enumerado em ADB; Fire192.168.3.104:5555 recusou
conexão10061 em duas verificações. Não é evidência de falha do APK/player ou de
ativação e não autoriza desinstalar/resetar/configurar outros alvos. Ambos ainda
sem atualização; usuário precisa reconectar tablet e confirmar IP/depuração Fire.
Lock49+9 PASS, baseline405/405 igual, nenhuma mudança funcional/Git/gestor.

## 2026-10-05 — LIVE_CATEGORY_AUTO_SWITCH_AND_PHONE_HOME_BACK_FIXED

Causa confirmada/reproduzida: handler zerava seleção, página selecionava primeiro
ID e memo ligava player à lista. Novo estado ativo estável preserva preview/C9;
categoria/filtro/paginação não trocam canal nem limpam erro. Resseleção do mesmo
grupo esvaziava página sem disparar efeito: guard de ID resolve no mesmo recorte.
Home Back mobile vinha de histórico legítimo; ocultação visual sóHome<600 sem
alterar callbacks/histórico/tablet/Fire. Negativos rejeitaram baselines e finais
43+14+26+25+59 checks PASS/zero erros, lock/guards/build/APK PASS.
Novo parser do fixture incluiu botão Próximos canais: corrigido para cartões
reais, assert48 mantido. Backup paralelo acionou Vite EBUSY; watcher do harness
ignora **/*.apk, rerun bounded passou/zero browsers órfãos. Sem patch nativo,
ativação/source/dependência/Git/backend/reset. APK9FF... pronto, não instalado
sem resposta explícita; nenhuma alegação de homologação física ou teste limpo.
[Incidentes e limites completos](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## 2026-10-05 — PHONE_IN_PLACE_DELIVERY_COMPLETE

Pendência de autorização de instalar superada pelo pedido explícito do usuário.
APK4B66D7BF...FF835A instalado -r no celular, assinatura/hash/lock49+9 PASS,
quatro privados e508 arquivos de catálogo iguais; abertura/processo foreground
confirmados. Nenhuma limpeza e405/405 baseline intacto. Versão limpa/rotação/
fullscreen físico não testados nesta entrega, não alegar homologação desses fluxos.
Pull público inicial teve sucesso, mas stderr de progresso acionou exceção
PowerShell com ErrorActionPreference=Stop. Hash/assinatura do arquivo confirmado
read-only antes do install; helper sanitizado usa exit code real. Sem bypass
ou alteração de produção. Sem blocker de instalação aberto/novo Gate/Git/backend.
Diff --check global observou blank line at EOF preexistente em storage.ts:723;
hash do arquivo igual ao baseline, preservado sem refactor/normalização.
Check com override temporário autocrlf=false marcou CRLF histórico; comando
normal scoped aos documentos PASS/exit0, nenhuma configuração/arquivo normalizado.
[Provas e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## 2026-10-05 — LIVE_MOBILE_REDUNDANT_CONTROLS_AND_HIDDEN_PREVIEW_FIXED

UI phone tinha Back global+local,3tabs e preview desmontado fora de Player;
Header mostrava versão. Fonte atual já não tem badges técnicos, mas celular
conectado ainda usa8828F120...FD4B8C antigo. Corrigidos com spec prévia; pedidos
adicionaram fullscreen sem botão/edge-to-edge/orientação sóphone. APK4B66D7BF...
FF835A validado, NÃO instalado/rotação física não homologada sem confirmação.
Browser59+26+25/Java102/lock/guards/build PASS. Fixture overlays88px excluídos
somente no teste;320x568 recebeu padding compacto, assertlista48 mantido.
Guard negativo revelou regex600 aceitava6000; verificador corrigido, produção
não relaxada. Prefixo CSS inicialmenteFAIL byte-exato por1EOLcontexto;
inversão em RAM recupera hash anterior, regras preservadas. Leitura truncada
completada e lock localizado porrg após caminho inexistente; patch documental
de contexto incorreto recusado/reaplicado. Sem reset/backend/Git/Gate/60s.
[Incidentes, provas e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## 2026-10-04 — LIVE_FULLSCREEN_TRANSPARENT_BACKGROUND_FIXED

Causa: fullscreen expandia PlayerView ainda Color.TRANSPARENT, expondo WebView
nas faixas FIT. Patch mínimo preto/restore, guard/negativos, browser58+24,
Java96, lock49+9/guards/build/instalação PASS. Recortes externos ao SurfaceView
no tablet final são100% pretos; Fire/tablet gestos/Back e dados preservados.
Pillow ausente -> System.Drawing existente, sem dependência nova. dumpsys
activity top não identificou Activity própria; captura recusada, filtro do
package/PID resolveu. Primeiro post capture não provou margem (layout ainda
em transição), único reteste bounded15s por bounds reais PASS, sem relaxar
asserções/produto. Tentativa de hash ignorava CRLF de três linhas de contexto;
restauração somente em RAM recuperou baseline exato. Leitura conjunta truncada
completada individualmente. Avisos existentes fora do escopo/crypto ausente.
399/401 runtime/scripts/config/Android/APK baseline iguais; sem reset/Git/
backend, homologação universal de playback/busca/60s ou próximo Gate.
[Evidência e limites](evidence/C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP.md).

## 2026-10-04 — LIVE_GESTURES_SCROLL_AND_REDUNDANT_BUTTON_REMOVAL_DELIVERED

Defeito de scroll reproduzido antes do patch:176px no documento ao ultrapassar
limite da prévia. Após correção58 checks layout/scroll+24 interações PASS,
Java96/zero falhas, lock49+9/guards/build/assets/assinatura PASS.
APK finalED324... instalado Fire/Samsung sem reset, dados preservados; botão
invisível/não focável em paisagem, gestos/Back reais confirmados. Fire primeira
tentativa final expirou ao confirmar canal; diagnóstico encontrou outra rota
com PID17311 inalterado, causa não confirmada. Único reteste instrumentado
capturou Enter13/click no ativo/fullscreen/Back inline PASS sem mudar produto.
Samsung PID18846 tap/canal/Back/swipe PASS. Não atribuir incidente a crash ou
ação do usuário sem evidência; nenhuma certificação universal de playback.
Wrappers ReferenceError/SyntaxError sem execução parcial, nomes documentais
read-only incorretos e pipe aapt truncado recuperados com verificação completa.
Avisos existentes fora do recorte; crypto não externalizado.394/401 baseline
iguais, demais autorizados; busca histórica/60s/novo Gate continuam fora.
[Evidência completa](evidence/C11_LIVE_FULLSCREEN_GESTURES.md).

## 2026-10-04 — LIVE_PREVIEW_REFERENCE_LAYOUT_DELIVERED

Patch de apresentação, 53 browser checks/zero erros, lock 49+9, guards/build,
assinatura/assets, instalação -r e confirmação DOM em Fire/Samsung PASS.
Dados privados/catálogos preservados, nenhuma regressão nos testes executados.
Auditoria inicialmente excedeu limite de comando Windows, processo não criado;
um wrapper SyntaxError não executou. Recuperação em lotes e auditoria/build PASS,
sem escrita parcial de produto. Avisos existentes de build/LF-CRLF fora do escopo.
Fire DOM-only deliberado por timeout de captura intermediário; Samsung recortes
PASS. Sem nova falha de captura, sem alegar homologação de playback/60s/busca
ou estabilidade universal. [Evidência final](evidence/C11_LIVE_PREVIEW_REFERENCE_LAYOUT.md).

## 2026-10-04 — LIVE_PREVIEW_CONTROLS_INTERMEDIATE_DELIVERED

53 browser checks/zero erros, lock/guards/build/instalação/DOM físicos PASS.
Fire teve timeout Page.captureScreenshot depois dos asserts, cleanup feito e
retete DOM-only com mesmo PID 3402 PASS, captura não obtida; Samsung PID 9971
relatório/crops PASS. Não atribuir timeout a crash. Dois wrappers de orquestração
SyntaxError antes de executar, payloads corrigidos sem escrita parcial.
Nenhuma regressão funcional observada; nova referência visual é refinamento,
não prova de falha anterior. [Evidência](evidence/C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md).

## 2026-10-04 — C11_LIVE_HEADER_PHYSICAL_UPDATE_BOTH_PASS

- **STATUS**: `FIRE_FIRST_AND_AUTHORIZED_TABLET_UPDATED_IN_PLACE_CONFIRMED`.
- **RESULT**: APK instalado de ambos 9B12B0C1...493F08 exato; quatro privados
  cada e catálogo Fire 436/Samsung 505 arquivos idênticos durante install.
  Cabeçalho físico sem badges técnicos, título/contador/Voltar/sidebar/categorias
  preservados, PID estável durante probes, forwards próprios removidos.
- **REGRESSIONS**: lock rerodado 49+9 PASS, 401 hashes de runtime/scripts/config/
  Android/APK inalterados; nenhuma falha de instalação ou confirmação observada.
- **LIMITS**: nenhum novo patch/build/reset/outro alvo/backend/Git; playback
  automático normal da página não homologa reprodução, 60s continua adiado.
  Queda histórica da busca não passa a resolvida por essa entrega visual.
- **REPORT**: [Confirmação física](evidence/C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md).

## 2026-10-04 — C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVED_LOCAL_PASS

- **STATUS**: `REQUESTED_PRESENTATION_PATCH_BUILT_NOT_INSTALLED`.
- **VERIFICATION**: 41 browser checks/zero erros, lock 49+9 antes e prebuild
  pós-patch, tsc/Vite/sync/assemble/assinatura/package/assets PASS. Exatamente
  um div removido; 398/401 arquivos auditados idênticos, ativação/player intactos.
- **FIRST_BROWSER_ATTEMPT**: timeout antes do menu, PNG em branco, causa não
  confirmada; cleanup completo. Único reteste instrumentado transitório PASS
  integral, sem mudar produto/asserções. Não marcado como crash de aparelho.
- **AUDIT_HARNESS**: glob rg inválido, output conjunto truncado/parse JSON,
  aspas node -e e encoding ASCII do pipe PowerShell. Separar inventário e usar
  stdin/Unicode escapado resolveu; nenhuma edição funcional motivada por eles.
- **BUILD_WARNINGS**: provisionamento node:fs/node:path, imports mistos/chunk,
  Gradle flatDir e META-INF do signer não bloqueantes, fora do recorte.
- **BOUNDARY**: APK raiz atualizado com backup A806C1B2... recuperável; nenhum
  dispositivo atualizado/resetado, backend/Git/performance 60s não trabalhados.
  Queda de busca anterior continua diagnóstico limitado, não resolvida por este patch.
- **REPORT**: [Evidência e limites](evidence/C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md).

## 2026-10-04 — TABLET_SEARCH_DETAIL_CRASH_OPEN_NOT_REPRODUCED_CURRENT_APK

- **LAYOUT_VERSION_MISMATCH**: `RESOLVED_BY_AUTHORIZED_IN_PLACE_TABLET_UPDATE`.
  Tablet tinha APK sem sidebar; mesmo A806C1B2... do Fire instalado e layout
  físico confirmado. Isso não prova causa do fechamento histórico da busca.
- **SEARCH_CRASH_STATUS**: `OPEN_NOT_REPRODUCED_FOR_CLUBE_DA_LUTA_CURRENT_APK`.
  Dois casos Busca -> detalhes ~2s, estabilidade 45s, PID preservado e logs
  filtrados sem OOM/renderer crash/rejeição. Repetição incremental já em cache.
  Não houve teste de reprodução, série ou outros títulos nesta rodada.
- **CODE_RISK**: concorrência de hidratação sem coalescência/cancelamento de I/O
  e detalhes sem catch confirmados por inspeção anterior; causa física ainda
  não demonstrada, arquivos intactos, patch funcional não autorizado neste recorte.
- **HARNESS_INCIDENTS**: parse de JSON em output vazio antes de exec assíncrono
  terminar corrigido por session_id/espera limitada; baseline 401 PASS. Altura
  CSS fracionária 853.333374 versus innerHeight 853 falhou igualdade estrita;
  corrigida somente sonda transitória para tolerância <1px, layout PASS.
  Não houve patch de produto motivado por incidentes de instrumentação.
- **SAFETY**: quatro privados e 505 arquivos canônicos preservados durante
  install -r; lock 49+9 PASS, 401 hashes inalterados, sem reset/backend/Git/
  outros dispositivos. Meta 60s permanece aberta/adiada. Forward próprio removido.
- **REPORT**: [Evidência e limites](evidence/C11_TABLET_APK_UPDATE_AND_SEARCH_DETAIL_DIAGNOSIS.md).

## 2026-10-04 — C11_BACK_TOP_RIGHT_LAYOUT_AND_PHYSICAL_DPAD_PASS

- **STATUS**: `REQUESTED_REFINEMENT_DELIVERED_FIRST_ON_FIRE_IN_PLACE`.
- **FIX**: CSS escopado lateral, Back superior direito fora do fluxo/sidebar,
  espaço horizontal no cabeçalho; Live somente duas classes visuais adicionais.
  Mesmo histórico/handler, posição mobile original; foco cima alcança controle.
- **CHECKS**: browser final 39/zero erros, lock 49+9 e 90 nativos PASS. Fire PID
  12030: título sem deslocamento/Back direita/cima/centro e foco Canais PASS.
- **APK**: A806C1B2... 8748328 bytes, assinatura/package preservados, quatro
  arquivos privados idênticos durante install -r, nenhum reset/outro aparelho.
- **HARNESS_INCIDENTS**: leitura física do Back intermediário antes do commit
  React corrigida por espera de rota limitada; reteste PASS. Auditoria inline
  teve aspas consumidas no Windows e hash esperado digitado incompleto; usada
  construção segura de aspas e baseline capturado, PASS. Sem mudança de produto
  por esses incidentes; nenhuma falha ocultada como sucesso.
- **BOUNDARY**: 388 baseline byte-idênticos, Live sem lógica alterada, três
  marcadores removíveis recuperam hash exato; ativação/player/backend intactos.
  Performance 60s aberta/adiada, playback físico não retestado nesta rodada.
- **REPORT**: [Evidência final](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## 2026-10-04 — C11_LIVE_SIDEBAR_CATEGORY_FOCUS_REGRESSION_RESOLVED

- **STATUS**: `REPRODUCED_BEFORE_FIXED_BROWSER_AND_PHYSICAL_FIRE_PASS`.
- **CAUSE**: novo fallback de entrada/remembered focus exigia main; Live usa div.
  Fixture de destino genérico não cobria estrutura do Live real.
- **FIX**: D-pad lateral usa app-content/coluna categoria; um data-attribute no
  Live, resto do arquivo provado byte-idêntico removendo essa linha em memória.
- **REGRESSION_TEST**: LiveTvPage real com adapters virtuais pré-resolver. Primeiro
  adapter sem enforce pre rendeu catálogo vazio; corrigido harness, depois
  negativo de direita presa reproduzido. Após patch full 34 checks/zero erros.
- **PHYSICAL**: negativo APK 187C6BD8... confirmou foco preso. Novo A3073378...
  instalado -r, quatro arquivos privados intactos; direita/categoria, esquerda/
  sidebar e direita/retorno PASS por teclas nativas, PID 3981 preservado.
- **SAFETY_LIMITS**: sem mudança de reprodução/ativação/seleção Live ou backend,
  sem reset/outros aparelhos. Guards/90 nativos PASS; meta 60s aberta/adiada.
- **REPORT**: [Evidência atual](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## 2026-10-04 — C11_LANDSCAPE_ICON_NAV_PASS_FIRE_INSTALLED

- **STATUS**: `LOCAL_FULL_BROWSER_AND_PHYSICAL_AGGREGATE_DPAD_PASS`.
- **DELIVERY**: APK 187C6BD8... atualizado in-place primeiro no Fire Stick,
  mesmo signer/package, quatro arquivos privados intactos, backup anterior.
- **HARNESS_RESOLVED**: EBUSY ao observar Cookies próprios; escaping de colunas;
  serialização DOM; assert inline-flex versus blockification flex. Correções
  restritas a testes, sem relaxar contratos/runtime. Browser final completo
  32 checks PASS, zero erros, nenhuma rede/backend real.
- **APK_VERIFIER_RESOLVED**: exigia override Android de logging que não existe
  no baseline; comparou config bytes e herança efetiva global none. Não editou config.
- **PHYSICAL_CAPTURE_TIMEOUT**: primeiro probe inconclusivo; no APK de ícones,
  esquerda nativa/scroll preservado PASS antes de timeout no PNG seguinte.
  Etapas restantes PASS separadamente, mesmo PID, não prova driver full exit 0.
  Não foi evidência de crash/UI regression. Forwards próprios removidos.
- **LIMITS**: demais aparelhos não atualizados; player preservado por hashes/
  guards, sem nova sessão física de vídeo. Meta de 60s aberta/adiada pelo usuário.
- **UNRELATED_BASELINE**: warnings de build e três suites R2F8 ausentes permanecem.
- **REPORT**: [Resultado, proveniência e limites](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## 2026-10-04 — C11_FIRE_STICK_BRIDGE_RETENTION_PHYSICAL_PASS_60S_OPEN

- **STATUS**: `IMPORT_OOM_NOT_REPRODUCED_THIS_PATCHED_SAMPLE_60S_TARGET_OPEN`.
- **FIX**: loggingBehavior=none evita payload logs da ponte; nenhum módulo de
  ativação/parser/player alterado. Reprodução sintética e flag física conferidas.
- **PHYSICAL**: APK 85EB23B5... install -r, mesma assinatura, dados de ativação
  intactos. Catálogo completo/Home/busca PASS; heap amostrado ~16..26 MiB durante
  importação e ~7 MiB pós-busca, processo vivo até ~4m49s do time origin.
- **PERFORMANCE**: primeira carga Activity -> promoção 154,233s, Home observada
  <=158,893s; meta 60s FAIL. Parse/persistência ~124,5s, download ~19,652s.
- **CACHE_TEST**: stop/reopen bloqueado pelo ambiente antes de executar;
  nenhum contorno/clear-data. Tempo cache não medido.
- **SAFETY**: sem nova instalação limpa, backend/Git ou limpeza de stagings.
- **LIMITS**: não prova ausência universal de OOM nem identifica todos os
  retentores; sucesso deste sample supersede falha anterior de importação,
  mas não fecha o requisito de desempenho. Próximo Gate não iniciado.

[Evidência](evidence/C11_FIRE_STICK_BRIDGE_RETENTION_FIX.md).

## 2026-10-04 — C11_FIRE_STICK_CLEAN_INSTALL_IMPORT_OOM_REGRESSION

- **STATUS**: `OPEN_PHYSICAL_FAILURE_AFTER_LOCAL_PATCH`.
- **INSTALL_ACTIVATION**: uninstall/reinstall limpo PASS, APK instalado correto,
  dados antigos ausentes, código/chave novos prontos, usuário pareou no Manager.
- **ERROR**: renderer V8 OOM (Ineffective mark-compacts near heap limit), heap
  ainda ~224 MB após GC; host SIGTRAP. Sync -> OOM ~96,847s / saída ~101,711s.
- **RESULT**: catálogo não promovido/Home não carregada; limite 60s FAIL no
  aparelho. Regressão física supersede inferência de sucesso a partir de Node.
- **VALIDATION_SIGNAL_DISCARDED**: performance.memory estático ~9,5367 MiB não
  representa heap real; não usar para afirmar baixo consumo ou ausência de OOM.
- **DATA_SAFETY**: dados antigos removidos por autorização, sem backup de
  credenciais; nova identidade/ativação preservadas depois, sem outro reset.
- **NEXT**: isolar retentor real (payload console do bridge apenas hipótese),
  especificar próxima allowlist/patch sem alterar autoridade/ativação ou truncar
  catálogo. Nenhuma dependência/config/código mudados neste teste.
- **REPORT**: [Teste limpo reprovado](evidence/C11_FIRE_STICK_CLEAN_INSTALL_TEST.md).

## 2026-10-04 — C11_FIRE_STICK_60_SECONDS_PHYSICAL_ACCEPTANCE_PENDING

- **STATUS**: `LOCAL_MEMORY_IO_PATCH_TESTED_PHYSICAL_REQUIREMENT_OPEN`.
- **REQUIREMENT**: pedido explícito de carregamento <=60s no Fire Stick.
- **PATCH**: backing strings detached por linha, batch bounded 2500; catálogo
  completo, ativação/identidade/autoridade/promoção preservadas.
- **EVIDENCE**: retenção sintética 48 MB -> <0,1 MB; 100 mil episódios íntegros
  em sink bounded; suites C11 disponíveis verdes. Não é benchmark físico.
- **PENDING**: respostas sobre marco (Home inicial vs completo/busca) e atualização
  APK in-place; aparelho não atualizado, nenhum reset autorizado. Crash físico
  e meta permanecem abertos até medição, independentemente de PASS local.
- **VALIDATION_LIMIT**: três comandos R2F8 não executaram por scripts/fixture
  ausentes já no baseline; diff global acusa whitespace de storage preexistente.
  Não editados testes/package/storage fora de escopo para ocultar falhas.
- **REPORT**: [Patch e limites](evidence/C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md).

## 2026-10-04 — C11_FIRE_STICK_CATALOG_V8_OOM_CONFIRMED

- **STATUS**: `OPEN_ROOT_CAUSE_CLASS_CONFIRMED_FUNCTIONAL_FIX_NOT_AUTHORIZED`.
- **EVIDENCE**: reprodução física AFTSSS/API 28 por abertura manual do usuário.
  PID 23179 registra `V8 javascript OOM (Reached heap limit)` às 12:15:29;
  host 23077 encerra com SIGTRAP às 12:15:33 após perda de WebView não tratada.
- **PHASE**: gravação de segmentos de episódios/streams; últimos 221..229.
  GC com aproximadamente 225 MB usados; não equivale a pico RSS/limite universal.
- **INSTALLED_APK**: anterior ao aviso de reprodução, hash 8828F120... confirmado.
- **LIMITATION**: alocação/objeto retentor específico não identificado; não culpar
  um writer, licença ou configuração de rede pela correlação isolada.
- **NEXT_SCOPE**: reduzir memória da importação e tratar perda nativa de renderer
  sem reset de identidade/ativação, catálogo truncado ou bypass de autoridade;
  exige especificação/autorização funcional e regressões/lock antes de APK.
- **COMMAND_LIMIT**: dmesg negado, sem bypass. Buffer antigo do renderer ausente;
  repetição manual forneceu log primário suficiente. Nenhuma falha ocultada.
- **CHANGES**: documentação apenas; sem correção/build/instalação/Git/backend.
- **REPORT**: [OOM e sequência causal](evidence/C11_FIRE_STICK_STARTUP_DIAGNOSIS.md).

## 2026-10-04 — C11_FIRE_STICK_STARTUP_CLOSE_USER_REPORTED

- **OBSERVATION**: usuário relata fechamento abrupto em aproximadamente 150s,
  antes da Home; celular abaixo de 60s e tablet aproximadamente 90s.
- **STATUS**: `OPEN_PHYSICAL_DIAGNOSIS_PENDING_DEVICE_CONNECTION`.
- **CAUSE_AND_PHASE**: desconhecidos. RAM/renderer, Java crash, ANR ou falha de
  importação são possibilidades não comprovadas; não culpar licença/ativação.
- **EVIDENCE_LIMIT**: ADB só lista SM-X610; amostra local de 3/outubro não contém
  este crash. APK/modelo/WebView/log do Fire Stick não confirmados neste ciclo.
- **NEXT_EVIDENCE**: ADB/IP do Fire Stick e tela/estágio anterior ao fechamento;
  correlacionar APK, checkpoints, processo e motivo de saída antes de patch.
- **CHANGES**: somente memória documental; sem alteração de ativação/runtime,
  build, instalação, reset, backend ou Git writes. Não homologa startup do Fire
  Stick pelos testes locais anteriores de ativação/player.
- **BENIGN_DIAGNOSTIC_COMMAND_ERROR**: Set-Location digitado com erro de caminho,
  rejeitado sem trocar diretório ou editar arquivos; corrigido imediatamente.

## 2026-10-04 — C11_PLAYBACK_ERROR_NOTICE_LOCAL_FIX

- **DEFECT**: motivo terminal nativo perdido no retorno silencioso à tela anterior.
- **STATUS**: `FIXED_LOCALLY_PHYSICAL_NOTICE_PENDING`. Não fecha a causa dos
  404 históricos nem o defeito condicional de cache; ambos continuam abertos.
- **FIX**: payload categoria/status estritamente sanitizado, aviso controlado
  acessível/sticky, motivo antes do cleanup, sem falso alerta em Back/COMPLETION.
- **ACTIVATION**: runtime preservado por hash; lock 49+9 PASS antes/depois.
- **VALIDATION**: aviso/C9/VOD 11/10/12 PASS, 90 testes Java PASS e APK gerado.
- **TEST_HARNESS_OCCURRENCE**: regex inicial não aceitava chaves da guarda
  preservada; corrigido o teste, reexecutado PASS, sem ajuste funcional por isso.
- **VISUAL_CHECK_LIMITATION**: agent-browser ausente e CUA sem navegador;
  fixture HTTP 200 e SSR testados, visual/console de browser não verificados.
- **PHYSICAL_NOTICE_CHECK**: pendente; novo APK não instalado. Nenhum erro
  provocado em fonte real, reset, backend ou Git write.
- **BUILD_WARNINGS**: avisos existentes node:fs/node:path/chunk/imports/flatDir
  mantidos fora do escopo; nenhum crypto externalizado.
- **REPORT**: [patch e limitações](evidence/C11_PLAYBACK_ERROR_NOTICE_FIX.md).

## 2026-10-04 — C11_PHONE_RETEST_NO_CURRENT_FAILURE

- **OBSERVATION**: 9-1-1 T1E1 e Clube da Luta também reproduziram no celular
  SM-S926B, com primeiro frame/READY; filme avançou posição, sem erro nativo.
- **USER_CONFIRMATION**: ambos tocaram no mesmo Wi-Fi; saída foi manual.
- **STATUS**: `HISTORICAL_FAILURE_CAUSE_OPEN_CURRENT_RETEST_NOT_REPRODUCING`.
- **LIMITATION**: não extrapolar para todos os conteúdos/episódios/redes nem
  atribuir a causa histórica ao Wi-Fi sem controle das tentativas anteriores.
- **PLAYBACK_FIX_APPLIED**: `NAO`; identidade/ativação/URL/APK preservados.
- **KNOWN_CODE_DEFECTS**: cache condicional pré-player e erro nativo não visível
  continuam registrados; correção não autorizada/aplicada neste diagnóstico.
- **REPORT**: [retorno ao celular](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## 2026-10-04 — C11_TABLET_PLAYBACK_COUNTEREVIDENCE

- **USER_REPORTED_BASELINE**: vários títulos, incluindo 9-1-1, funcionavam no
  mesmo player; falha não limitada a Clube da Luta.
- **TABLET_OBSERVATION**: 9-1-1 T1E1 e Clube da Luta receberam dados/primeiro
  frame e chegaram a READY; filme avançou posição. Usuário confirmou ambos.
- **INTERPRETATION**: 404 histórico do celular não prova endereço permanentemente
  indisponível nem explica todas as falhas. APK é o mesmo nos dois aparelhos;
  fingerprint da referência do filme corresponde entre as tentativas.
- **RESOLUTION_STATUS**: `OPEN_CURRENT_FAILURE_NOT_YET_REPRODUCED`.
- **NEXT_EVIDENCE**: tentativa atual no dispositivo afetado, episódio/rede
  identificados; não alterar codecs, URL, licença ou ativação por hipótese.
- **RUNTIME_FIX_APPLIED**: `NAO`; evidências históricas preservadas, não apagadas.
- **BENIGN_COMMAND_FAILURE**: rg com wildcard em argumento de diretório no
  Windows rejeitado; usados caminhos existentes. Sem escrita funcional.
- **REPORT**: [contraprova física](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## 2026-10-04 — C11_PHYSICAL_CLUBE_DA_LUTA_HTTP_404

- **SCOPE**: diagnóstico físico read-only e memória documental; sem patch do player.
- **DEVICE**: `SM-S926B`; APK instalado idêntico ao standalone entregue.
- **OBSERVED_FAILURE**: duas tentativas de Clube da Luta, correlacionadas à
  referência privada do catálogo, retornam `HTTP_ERROR`, `httpStatus=404`,
  `code=2004`, checkpoint `DATASOURCE_OPEN`, sem primeiro byte/frame.
- **CONFIDENCE**: `HIGH_FOR_OBSERVED_HTTP_FAILURE`; razão do 404 na origem não
  determinada. Cache pré-player e decoder não explicam estas duas tentativas.
- **ERROR_VISIBILITY_DEFECT**: Activity chama finish após esgotar candidato;
  retorno `NATIVE_ERROR` vira IDLE sem causa visível na tela anterior.
- **PLAYBACK_FIX_IMPLEMENTED**: `NAO`; ativação, licença, source e APK preservados.
- **NEXT_EVIDENCE**: comparação com título funcional/mesmo título na mesma fonte;
  não substituir URL nem relaxar autorização para esconder indisponibilidade.
- **EVIDENCE_REPORT**: [coleta sanitizada](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).
- **DIAGNOSTIC_COMMAND_ERRORS**: formato date com espaço rejeitado (corrigido
  para epoch); caminho rg `src/streams` ausente (usados caminhos reais). Sem escrita.
  Inserção documental complementar usou âncora parcial não encontrada; patch
  rejeitado sem alteração, reaplicado na linha exata existente.

## 2026-10-03 — C11_ACTIVATION_LOCK_AND_SELECTIVE_PLAYBACK_DIAGNOSIS

- **SCOPE**: canonização autorizada e diagnóstico, não correção do player.
- **ACTIVATION_CATALOG**: confirmação física relatada pelo usuário; lock local
  com 49 casos e 9 negativos PASS, build com prebuild PASS.
- **PLAYBACK_DEFECT**: `STREAM_SEGMENTS_CACHE_NOT_SCOPED_TO_ACTIVE_SNAPSHOT`.
- **EVIDENCE**: helpers reais congelam manifest/lista de arquivos; dois casos
  sintéticos falham em STREAM_REF_NOT_FOUND antes da abertura nativa.
- **ROOT_CAUSE_CONFIDENCE**: `HIGH_FOR_CONDITIONAL_CODE_DEFECT_NOT_PHYSICAL_CAUSE`.
- **PHYSICAL_SYMPTOM**: alguns filmes abrem, Clube da Luta não; séries também
  haviam sido reportadas como não reproduzíveis.
- **BLOCKER_FOR_PHYSICAL_DIAGNOSIS**: sem aparelho adb, mensagem/captura ou log
  sanitizado do título; solicitado se player abre e se restart mantém falha.
- **PLAYBACK_FIX_IMPLEMENTED**: `NAO`; não contornar sessão/licença nem regenerar
  código/chave para tratar falha de mídia.
- **EVIDENCE_REPORT**: [relatório](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

Ocorrências técnicas do ciclo:

- Primeiro novo caso de teste usava igualdade por referência para objeto de token
  em VMs diferentes. Guard propagou exit=1 corretamente. Ajustado para comparação
  dos valores no reboot e tokens/hashes distintos entre devices; reexecução PASS.
- Web não aceitou content-type markdown do changelog Supabase; leitura pública
  alternativa via Invoke-WebRequest funcionou, sem operação no projeto remoto.
- Buscas read-only em caminhos inexistentes `src/player`/`.github` e glob Windows
  direto retornaram erro; corrigidas para src/playback e rg -g '*.sql'. Sem escrita.
- Build preserva avisos históricos fs/path, chunks e imports mistos; nenhum aviso
  crypto externalizado. Warnings LF/CRLF mantidos sem normalização global.

## 2026-10-03 — C11_CATALOG_PROMOTION_DIRECTORY_FIX

- **GATE**: correção isolada autorizada, nenhum novo Gate iniciado.
- **CLASSIFICATION**: `LOCAL_CATALOG_PROMOTION_MISSING_PARENT_DIRECTORY`.
- **DESCRIPTION**: dispositivos autorizados com fonte entregue; promoção falha
  por parent/target/segments inexistentes e ensureDir no-op.
- **ROOT_CAUSE_CONFIDENCE**: `HIGH_CODE_AND_NEGATIVE_CONTROL`; estado real dos
  diretórios de cada aparelho não foi inspecionado.
- **RESOLUTION_STATUS**: `LOCAL_AND_BRIDGE_MODEL_VERIFIED_APK_BUILT`.
- **PHYSICAL_VALIDATION**: `PENDING_TWO_DEVICE_UPDATE_IN_PLACE`.
- **EVIDENCE**: 27 testes focados, 21 de ativação, 250k sintético e APK conferido;
  [relatório completo](evidence/C11_CATALOG_PROMOTION_DIRECTORY_FIX.md).

Limitações encontradas, não corrigidas fora da allowlist:

- `test-r2f8j-staging-promotion-boundary.mjs`: T01–T11 PASS; T12 ENOENT para
  `test-r2f8c1-content-kind-classifier-lock.mjs`, ausente também no HEAD.
  Suíte não certificada como integralmente aprovada; não foram fabricados stubs.
- `git diff --check` do storage aponta blank line EOF já presente na baseline;
  aviso LF/CRLF do Git preservado, sem normalização global de arquivo.
- Build mantém avisos node:fs/node:path (builder/validator), chunk grande e
  imports dinâmicos/estáticos. Aviso crypto externalizado não aparece.
- Gradle mantém flatDir; apksigner aceita assinatura v1/v2 e emite avisos de
  entradas META-INF não protegidas por v1 (APK permanece válido com v2).
- Uma busca inicial usou caminho `src/source-import/real-source-importer.ts`
  inexistente; foi corrigida para `src/source/real-source-importer.service.ts`,
  somente leitura, sem efeito no código ou na validação.

## 2026-10-03 — C11_NEW_DEVICE_ACTIVATION_FIX

- **GATE**: ciclo corretivo local autorizado; nenhum novo Gate iniciado.
- **CLASSIFICATION**: `LOCAL_ACTIVATION_INITIALIZATION_AND_CONCURRENCY`.
- **DESCRIPTION**: geração da chave vinha após consultas remotas; digest rejeitado
  não usava fallback; UI e boot podiam criar sessões A1 concorrentes.
- **ROOT_CAUSE_CONFIDENCE**: `HIGH` para as dependências constatadas no código;
  causa exata do aparelho da captura não foi observada por log físico.
- **RESOLUTION_STATUS**: `LOCAL_AND_MOCK_VERIFIED`, teste físico `PENDING`.
- **EVIDENCE**: 21 testes focados, 57 de contrato e navegador isolado;
  [relatório](evidence/C11_NEW_DEVICE_ACTIVATION_FIX.md).

Ocorrências de validação e ferramentas, sem alteração fora do escopo:

- Typecheck inicial apontou import `syncPendingDeviceActivation` ainda não usado;
  resolvido ao concluir a troca do handler. Build final passou.
- Novo teste de boot autorizado usou pointer incompleto e retornou DELIVERY_FAILED;
  adicionados campos exigidos por `isValidActivePointer` à fixture. Teste final PASS.
- Fixture legada de reconciliação sem `getStorage()` gera o mesmo TypeError em
  HEAD e current. Fixture profile v1 retorna LOCAL_FIRST_ACTIVE_PRESERVED em ambos,
  pois profile vigente é v2. São limitações preexistentes das fixtures, não uma
  certificação da suíte global. Fixtures legadas não foram alteradas.
- `git diff --check` global detectou blank line já presente no arquivo de storage
  C11 fora do patch. Check dos arquivos editados neste ciclo passou.
- `agent-browser` não estava disponível: usado npx e Chrome instalado. Download
  redundante de Chrome foi interrompido. Primeira captura com caminho relativo
  falhou; repetida com diretório criado e caminho absoluto dentro do workspace.
- CLI `find` e ref sem aspas falharam por sintaxe/PowerShell; ref entre aspas
  funcionou. Erro/retry real da tela foi então confirmado no navegador.
- Primeira comparação de hashes falhou por escaping de JSON no shell; stdin
  resolveu. 14 hashes capturados de arquivos fora do patch permaneceram iguais.
- Tentativa de patch de STATUS com cabeçalho incorreto foi rejeitada sem escrita;
  repetida após leitura do cabeçalho canônico.
- Avisos não fatais de build: node:fs/node:path nos builders, chunks grandes,
  import dinâmico/estático e Gradle flatDir. Aviso de crypto não apareceu.
  apksigner verificou v1/v2 e emitiu avisos META-INF de entradas JAR (não fatais).

---

## 1. Padrao Estrutural de Registro

Cada incidente, erro ou bloqueador tecnico devera ser registrado segundo o formato:

- **DATE**: Data da ocorrencia (AAAA-MM-DD).
- **GATE**: Gate ativo no momento da identificacao.
- **CLASSIFICATION**: Categoria do erro (ex: `EXTERNAL_CONNECTOR_VISIBILITY`, `BUILD_FAILURE`, `SCHEMA_CONFLICT`, `SECURITY_VIOLATION`).
- **DESCRIPTION**: Descricao sucinta e factual da anomalia.
- **EVIDENCE**: Comandos executados, mensagens de erro e logs sanitizados.
- **ROOT_CAUSE**: Causa raiz diagnosticada.
- **ROOT_CAUSE_CONFIDENCE**: Grau de certeza da causa raiz (`HIGH`, `MEDIUM`, `LOW`).
- **IMPACT**: Consequencias para o ciclo e escopo do projeto (`BLOCKING`, `NON_BLOCKING`).
- **RESOLUTION_STATUS**: Estado da resolucao (`RESOLVED`, `INVESTIGATING`, `MONITORING`, `ACCEPTED_BEHAVIOR`).

---

## 2. Ocorrencias Registradas

### OCORRENCIA-001 — Visibilidade Externa do Projeto Supabase no Conector de Terceiros

- **DATE**: 2026-09-04
- **GATE**: G0_FOUNDATION_AND_ISOLATION
- **CLASSIFICATION**: `EXTERNAL_CONNECTOR_VISIBILITY`
- **DESCRIPTION**: O conector de integracao externa do Chat Mestre (ChatGPT Supabase Connector) ainda nao exibe na sua listagem imediata o projeto recem-criado `Xandeflix Prebuilt` (`cujbmyhitgomlgwfkaat`).
- **EVIDENCE**: Relato inicial do Chat Mestre indicando ausencia de visibilidade no conector externo.
- **ROOT_CAUSE**: Delay de indexacao / sincronizacao do conector de terceiros com a API de organizacao da plataforma Supabase; nao decorre de falha ou inexistencia do projeto Supabase.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING` (O Gate G0 requer apenas o registro documental da identidade e proibe terminantemente qualquer intervencao remota no Supabase).
- **RESOLUTION_STATUS**: `MONITORING` (Aguardando sincronizacao natural da plataforma de terceiros; nenhuma acao corretiva autorizada ou necessaria no G0).

### OCORRENCIA-002 — Alerta de Tooling/Integracao IDE Java/Buildship

- **DATE**: 2026-09-04
- **GATE**: G1_APP_SKELETON
- **CLASSIFICATION**: `IDE_TOOLING_WARNING`
- **DESCRIPTION**: Integracao de IDE Java/Buildship reportou incapacidade de persistir preferencias de `org.eclipse.buildship.core` sob `android/.settings`.
- **EVIDENCE**: Compilacao nativa `gradlew.bat assembleDebug` concluida com sucesso (`BUILD SUCCESSFUL, 85 actionable tasks: 85 executed`) e APK de debug gerado (`app-debug.apk`, 4.107.263 bytes).
- **ROOT_CAUSE**: Questao de persistencia de preferencias de projeto do plugin IDE/Buildship, sem impacto na toolchain CLI do Gradle.
- **ROOT_CAUSE_CONFIDENCE**: MEDIUM
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `MONITORING`
- **NOTAS_NORMATIVAS**:
  - `ANDROID_DEBUG_BUILD`: PASS
  - `APK_GENERATED`: SIM
  - `G1_PASS_INVALIDATED`: NAO

### OCORRENCIA-003 — Emissão de Mensagem Intermediária durante QUIET_UNTIL_FINAL_REPORT

- **DATE**: 2026-09-04
- **GATE**: G3_EXTERNAL_INGESTION_PIPELINE
- **CLASSIFICATION**: `PROCESS_OUTPUT_DEVIATION`
- **DESCRIPTION**: O executor emitiu uma mensagem intermediária informando início/aguardo de regressão Android antes do relatório terminal final, apesar de QUIET_UNTIL_FINAL_REPORT.
- **EVIDENCE**: Mensagem de texto intermediária informativa enviada durante a execução assíncrona do Gradle antes do relatório terminal.
- **ROOT_CAUSE**: Instrução de suporte do tooling de background task sobreposta involuntariamente à diretriz de modo silencioso.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `RESOLVED_BY_REINFORCED_EXECUTION_RULE`
- **NOTAS_NORMATIVAS**:
  - `G3_PASS_INVALIDATED`: NAO

### OCORRENCIA-004 — Emissão de Mensagem Intermediária durante QUIET_UNTIL_FINAL_REPORT no Gate G4

- **DATE**: 2026-09-05
- **GATE**: G4_PROVISIONING_PACKAGE
- **CLASSIFICATION**: `PROCESS_OUTPUT_DEVIATION`
- **DESCRIPTION**: O executor emitiu mensagem intermediária informando início/aguardo de teste Gradle antes do relatório terminal, apesar do modo QUIET_UNTIL_FINAL_REPORT.
- **EVIDENCE**: Mensagem de texto intermediária informativa enviada durante a execução assíncrona do Gradle test antes do relatório terminal.
- **ROOT_CAUSE**: Instrução de suporte do tooling de background task sobreposta involuntariamente à diretriz de modo silencioso.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `RESOLVED_BY_REINFORCED_EXECUTION_RULE`
- **NOTAS_NORMATIVAS**:
  - `G4_PASS_INVALIDATED`: NAO

### OCORRENCIA-005 — Evidência de Custo de Performance no Benchmark Sintético de Escala (240k)

- **DATE**: 2026-09-05
- **GATE**: G7_PREBUILT_SEARCH
- **CLASSIFICATION**: `PERFORMANCE_EVIDENCE_RISK`
- **STATUS**: `OPEN_NON_BLOCKING`
- **DESCRIPTION**: O teste de escala sintético com 240.000 documentos comprovou a viabilidade lógica e algorítmica da busca pré-construída, mas revelou custos observados relevantes de tempo de build externo, tamanho do payload serializado e latência de consulta que justificam avaliação e otimização posterior em hardware físico.
- **EVIDENCE**:
  - `EVIDENCE_SOURCE`: SYNTHETIC_240K_SCALE_TEST
  - `OBSERVED_DOCUMENT_COUNT`: 240000
  - `OBSERVED_EXTERNAL_INDEX_BUILD_MS`: 12216
  - `OBSERVED_SEARCH_INDEX_SERIALIZED_SIZE_BYTES`: 52672308
  - `OBSERVED_SEARCH_INDEX_COMPRESSED_ESTIMATE_BYTES`: 6848000
  - `OBSERVED_SEARCH_INDEX_LOAD_MS`: 771
  - `OBSERVED_RUNTIME_MATERIALIZATION_MS`: 771
  - `OBSERVED_QUERY_EXACT_MS`: 2850.06
  - `OBSERVED_QUERY_PREFIX_MS`: 1233.61
  - `OBSERVED_QUERY_MULTI_TOKEN_MS`: 1239.05
  - `OBSERVED_QUERY_NO_RESULT_MS`: 21.63
  - `OBSERVED_PROCESS_MEMORY_BEFORE_MB`: 9
  - `OBSERVED_PROCESS_MEMORY_AFTER_BUILD_MB`: 336
  - `OBSERVED_PROCESS_MEMORY_AFTER_LOAD_MB`: 271
- **ROOT_CAUSE**: Volume massivo de dados sintéticos (240k itens) operando com busca ponderada puramente em JavaScript/Node.js sem aceleração de hardware nativa.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `MONITORING_FOR_PHYSICAL_VALIDATION`
- **NOTAS_NORMATIVAS**:
  - `INTERPRETATION`: A arquitetura de transportabilidade foi funcionalmente comprovada, mas os custos sintéticos observados justificam avaliação posterior de otimização e prova física antes de qualquer alegação de performance em Fire Stick.
  - `PERFORMANCE_EVIDENCE_IS_NOT_SLA`: SIM
  - `REAL_CATALOG_SEARCH_PROVEN`: NAO
  - `FIRE_STICK_SEARCH_PERFORMANCE_PROVEN`: NAO
  - `G7_PASS_INVALIDATED`: NAO

### OCORRENCIA-006 — Evidência de Pico de Memória em Escala Sintética no Update Incremental (240k)

- **DATE**: 2026-09-05
- **GATE**: G9_INCREMENTAL_UPDATE
- **CLASSIFICATION**: `PERFORMANCE_EVIDENCE_RISK`
- **STATUS**: `OPEN_NON_BLOCKING`
- **DESCRIPTION**: O teste de escala sintético com 240.000 documentos comprovou a vantagem substancial de transporte incremental (< 1% a ~4.3% do payload full), porém o pico de memória no harness de aplicação atingiu 459 MB (1% sparse) e 640 MB (5% moderate), justificando validação futura em hardware real (G11/G12).
- **EVIDENCE**:
  - `EVIDENCE_SOURCE`: SYNTHETIC_240K_INCREMENTAL_TEST
  - `SPARSE_DOCUMENT_COUNT`: 240000
  - `SPARSE_CHANGE_PERCENT`: 1
  - `SPARSE_DELTA_PACKAGE_SIZE_BYTES`: 42233
  - `SPARSE_FULL_TARGET_PACKAGE_SIZE_BYTES`: 4585619
  - `SPARSE_DELTA_TO_FULL_RATIO`: 0.0092
  - `SPARSE_MEMORY_PEAK_MB`: 459
  - `MODERATE_DOCUMENT_COUNT`: 240000
  - `MODERATE_CHANGE_PERCENT`: 5
  - `MODERATE_DELTA_PACKAGE_SIZE_BYTES`: 199353
  - `MODERATE_FULL_TARGET_PACKAGE_SIZE_BYTES`: 4630164
  - `MODERATE_DELTA_TO_FULL_RATIO`: 0.0431
  - `MODERATE_MEMORY_PEAK_MB`: 640
- **ROOT_CAUSE**: Manipulação em memória do grafo completo de 240k entidades e índice invertido durante parsing, staging e diff no processo Node.js sem paginação de disco intermediária.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `NON_BLOCKING`
- **RESOLUTION_STATUS**: `MONITORING_FOR_PHYSICAL_VALIDATION`
- **NOTAS_NORMATIVAS**:
  - `INTERPRETATION`: A vantagem de transporte incremental foi comprovada sinteticamente, porém o pico de memória observado no harness de escala justifica validação futura em hardware real.
  - `PERFORMANCE_EVIDENCE_IS_NOT_SLA`: SIM
  - `REAL_DEVICE_INCREMENTAL_UPDATE_PROVEN`: NAO
  - `G9_PASS_INVALIDATED`: NAO

### OCORRENCIA-007 — Gap de Provisionamento Físico e Descoberta ADB no Início do G11

- **DATE**: 2026-09-06
- **GATE**: G11_PHYSICAL_MULTI_DEVICE_TESTING
- **CLASSIFICATION**: `PHYSICAL_TESTABILITY_GAP`
- **STATUS**: `RESOLVED`
- **DESCRIPTION**: No início da execução do Gate G11, o Tablet Samsung SM-X610 conectado fisicamente via USB não foi enumerado na sessão inicial do servidor ADB local (`TABLET_DEVICE_PRESENT=NAO`). Simultaneamente, identificou-se que o APK Android compilado não possuía âncora de confiança de teste em runtime nem mecanismo legítimo para invocar o `SecureArtifactImportService` para pacotes assinados em ambiente físico sem incorrer em bypass inaceitável de segurança do G10.
- **EVIDENCE**:
  - `INITIAL_RESULT`: `INCONCLUSIVE_PREBUILT_G11_REQUIRED_DEVICE_UNAVAILABLE`
  - `SIGNED_SYNTHETIC_PACKAGE_IMPORT`: `NOT_EXECUTED_PROVISIONING_PATH_UNAVAILABLE`
  - `ADB_KILL_START_SERVER`: Tablet detectado com sucesso (`RX2X301Q3KY device`, `SM-X610`, Android 16, API 36).
- **ROOT_CAUSE**: Estado transitório de enumeração do servidor ADB Windows anterior ao ciclo e ausência prévia de um boundary exclusivo de depuração (`DEBUG_ONLY_TEST_TRUST_ANCHOR` e ponto de entrada de importação) sem vazamento de chaves ou enfraquecimento do trust model de release.
- **ROOT_CAUSE_CONFIDENCE**: HIGH
- **IMPACT**: `BLOCKING_RESOLVED` (Bloqueador do G11 resolvido e homologado via subciclo corretivo G11A).
- **RESOLUTION_STATUS**: `RESOLVED`
- **NOTAS_NORMATIVAS**:
  - `TABLET_DISCOVERY_FIXED`: SIM (`adb kill-server / start-server` restabeleceu conexão imediata com o Tablet SM-X610).
  - `DEBUG_TEST_TRUST_KEY_IMPLEMENTED`: SIM (`g11-physical-test-key-2026` injetada exclusivamente em debug builds).
  - `RELEASE_ISOLATION_PROVEN`: SIM (`RELEASE_TEST_TRUST_KEY_PRESENT=NAO`, `RELEASE_DEBUG_IMPORT_ENTRYPOINT_PRESENT=NAO`, `RELEASE_DEBUG_PROVISIONER_BEHAVIOR=INERT_NO_IMPORT_CAPABILITY`).
  - `PHYSICAL_IMPORT_PROVEN`: SIM (Tablet e Fire TV Stick provisionados e validados com 100% de sucesso).
  - `G11A_STATUS`: `PASS`

### OCORRENCIA-008 - C11 bounded-memory real-source import fix

- **DATE**: 2026-09-24
- **GATE**: `C11_CANONICAL_BOUNDED_MEMORY_IMPORT_FIX_SM_X205`
- **CLASSIFICATION**: `MEMORY_RETENTION_DEFECT`
- **STATUS**: `OPEN_NON_BLOCKING_PENDING_FINAL_CLEAN_INSTALL_E2E`
- **ROOT_CAUSE_CONFIRMED**: `SIM`
- **DESCRIPTION**: O transporte M3U ja era incremental, mas o parser mantinha em `seriesMap` objetos brutos de todos os episodios ate o fim da leitura. A agregacao posterior criava novas entidades `Episode`/`StreamRef`; o indice Search V2 tambem copiava arrays por documento; e catalogo era serializado novamente durante o staging. Esse conjunto reteve objetos e copias redundantes no mesmo ciclo.
- **FIX_APPLIED**: `SIM`
  - Episodio e referencia de stream canonicos sao criados incrementalmente e deduplicados por temporada.
  - Acumuladores de series sao liberados antes da indexacao final.
  - Search V2 reutiliza arrays imutaveis de ids, sem copia por documento.
  - A serializacao canonica do catalogo e reutilizada pelo staging.
- **SYNTHETIC_250K**: `PASS`
  - `SOURCE_RECORDS=250000`, `PARSED_RECORDS=250000`, `MOVIES=225000`, `SERIES=1000`, `EPISODES=12500`, `LIVE=12500`.
  - Accounting, relacoes de series, Search V2 e `directStreamUrl`: `PASS`.
  - Checkpoints MEM01-MEM09 registrados; as medicoes sao evidencia observacional, nao SLA.
- **PHYSICAL_UPDATE_IN_PLACE**: `PASS`
  - APK instalado com `adb install -r`, sem uninstall e sem reset de dados.
  - Identidade, display code e estado local permaneceram consistentes: `AUTHORIZED`, `SELF_SERVICE`, `TRIAL`.
  - App abriu e o shell WebView ficou responsivo; nao houve novo crash/ANR apos a instalacao deste APK.
  - Observacao nao-bloqueante: houve um `Uncaught TypeError` de WebView envolvendo `triggerEvent` durante a inicializacao; os marcos T2/T3/T4/T7/T5/T6 foram alcancados e o processo permaneceu vivo.
  - O `dumpsys activity exit-info` preserva crashes nativos anteriores a instalacao, entre 23:06 e 23:19, com renderer WebView historico chegando a aproximadamente 1,5 GB RSS; esses eventos sao evidencia da regressao anterior, nao do boot desta instalacao.
- **PHYSICAL_REAL_SOURCE_IMPORT**: `BLOCKED_SOURCE_NOT_BOUND`
  - A propria tela e a resolucao de boot retornaram `Nenhuma fonte ativa vinculada a este dispositivo`.
  - Nao foi executado provisionamento manual, write remoto, migration ou bypass para nao alterar o estado comercial canonico.
- **APK_SHA256**: `E5D927082F958553F4D6B872CB4E84106FAE1EB5C06F6C875CCD6707D5A5A1BB`
- **NEXT_DECISION**: Repetir a validacao fisica quando a autoridade retornar `SOURCE_READY` para o mesmo dispositivo; manter C11 aberto ate o E2E final de clean install autorizado.


## 2026-10-06 — C11: validação local de capas/categorias

- Corrigidos: URLs de capa descartadas, capa tardia não promovida para série,
  referências de arte ausentes no first-fold e cache de faixas antigo após
  troca de snapshot. Hero não amplia pôster vertical da fonte.
- Suite nova e testes disponíveis de catálogo/boot/importação/build: PASS.
- BASELINE_AUXILIARY_CHECK_UNAVAILABLE: r2f8:series-page:check requer
  scripts/test-r2f8-series-page-typed-scope.mjs; r2f8:catalog-semantics:check
  requer scripts/execute-r7c-r6d-tablet-pipeline.ts. Ambos ausentes na baseline
  e no HEAD; nenhum teste foi relaxado para converter essa ausência em PASS.
- PHYSICAL_ARTWORK_VALIDATION=PENDING: nenhuma geração/instalação de APK.
- Sem correspondência segura/backdrop TMDB, placeholder permanece. Novos
  conteúdos aparecem após sincronização da fonte e promoção do novo catálogo.
- VITE_TMDB_API_KEY fica visível no cliente; segredo de servidor requer gateway.
  Valor preservado fora de código/docs/logs. Sem nova dependência ou escrita remota.
- EVIDENCE=docs/evidence/C11_SOURCE_FIRST_TMDB_ARTWORK.md; NEXT_GATE_STARTED=NAO.

## 2026-10-06 — C11: instalação de capas no tablet/S24

- TABLET_UPDATE=PASS: APK validado instalado in-place no SM-X610, dados e
  firstInstallTime preservados; não houve uninstall/clear/reset.
- S24_INSTALL=PENDING_DEVICE_CONNECTION: aparelho ainda ausente no ADB.
  Próximo passo depende de conexão USB/depuração; não usar Fire Stick substituto.
- WINDOWS_SIGNER_COMMAND_QUOTING=RESOLVED: chamada cmd.exe/Node falhou antes
  da instalação; chamada direta PowerShell verificou assinatura com exit0.
- PHYSICAL_ARTWORK_VALIDATION=PENDING: usuário ainda deve conferir app aberto.
  Instalação não equivale a homologação física de capas/catálogo/playback.
- Nenhum novo blocker de build/lock; avisos preexistentes preservados.
- EVIDENCE=docs/evidence/C11_TMDB_ARTWORK_TABLET_S24_INSTALL.md.

## 2026-10-06 — C11: pendência de conexão S24 resolvida

- S24_INSTALL=PENDING_DEVICE_CONNECTION foi resolvido pelo usuário conectando
  o Samsung SM-S926B. Update -r Success; mesmo APK do tablet e dados preservados.
- Lock/assinaturas e verificação pós-instalação: PASS; nenhum erro novo.
- PHYSICAL_ARTWORK_VALIDATION=PENDING: abertura/conferência visual pelo usuário;
  instalação não certifica ativação/capas/playback em execução física.
- Sem uninstall/clear/reset ou mudança de fonte/licença/backend/Git.
- EVIDENCE=docs/evidence/C11_TMDB_ARTWORK_TABLET_S24_INSTALL.md.


## 2026-10-06 — C11: hero Home vertical/aleatório e entrega nos três aparelhos

- FUNCTIONAL_BUILD_INSTALL_BLOCKER=NONE: suites/build/lock e três installs PASS.
- HERO_QUOTA_LIMIT: cinco de cada tipo dependem de conteúdo/ano elegível na
  fonte; imagem diferente depende de variante TMDB disponível. Novos títulos
  entram após sincronização/promoção existente, sem inventar SLA/push adicional.
- BROWSER_FIXTURE_CONTROLS=RESOLVED: movimento reduzido inicialmente bloqueou
  rotação conforme política; emulação no-preference confirmou timer. Fixture
  curta ampliada só em tmp; teste realmente fora da viewport confirmou pausa.
- WINDOWS_BROWSER_CLI=RESOLVED: JS enviado por stdin evitou quoting/Unicode;
  bypass do proxy localhost permitiu fechar as duas últimas sessões de ensaio.
  Nenhuma dessas intercorrências exigiu relaxar teste/código funcional.
- PHYSICAL_ARTWORK_VALIDATION=PENDING: conferência visual em aparelhos após
  abrir o app; instalação/preservação não certificam ativação ou playback.
- Avisos preexistentes do build permanecem; nenhum reset ou Git/backend.
- EVIDENCE=docs/evidence/C11_HOME_HERO_CURRENT_YEAR.md. NEXT_GATE_STARTED=NAO.


## 2026-10-06 — C11: otimizações de UI, saída mobile, Recentes e cores — fechamento

FUNCTIONAL_BUILD_INSTALL_BLOCKER=NONE: testes/build/lock e três updates finais
PASS. LATEST_REGRESSION_WINS aplicado durante todo o ciclo.

- SEARCH_EXACT_EARLY_RETURN=RESOLVED: baseline reproduziu Matrix só exato;
  família/score exaustivo e poda numérica curta corrigidos com testes.
- TMDB_HOMONYM_METADATA=RESOLVED: confidence/dicas/ano rejeitam associações
  contraditórias; Matrix público603/1999 confirmado, sem liberar streams.
- DISPLAY_IMAGE_CORS_REGRESSION=RESOLVED: experimento crossOrigin bloqueou
  imagens; removido integralmente. Remoto carrega e canvas bloqueado usa
  neutro. Paleta confirmada em JPEG público same-origin de fixture.
- M3U_REASSIGNED_HISTORY_ID=RESOLVED: IDs sequenciais reutilizáveis exigem
  fingerprint da obra; recusa antes de guard/stream/player e ocultação
  no browser passaram. Sem remapeamento automático de histórico.
- FIRE_INTERMEDIATE_PRESERVATION_AUDIT=RESOLVED_BY_CLOSED_RECHECK: primeira
  comparação divergente/inconclusiva; usuário confirmou app aberto.
  Resultado mantido, rechecagem fechada e instalação final PASS em todos
  os grupos. Não alegar preservação a partir do ensaio inconclusivo.
- DOCUMENT_UTF8_EXPORT=RESOLVED: textos deste ciclo tinham acentos substituídos
  por '?' no transporte shell. Cinco evidências regravadas em UTF-8 e
  verificadas; prefixos antigos das memórias não foram reescritos.
- LOCAL_FIXTURE_TOOLING=RESOLVED: quoting PowerShell/refs/JS, imports/mocks
  SSR, BOM/CRLF/contexto de patch, fixture HTTP Java e cache público de
  diagnóstico ajustados sem relaxar asserts/lock. Vite EBUSY em JPEG QA
  resolveu após reiniciar somente servidor do executor; sessões fechadas.

PHYSICAL_PIP_PLAYBACK/CAST_RECEIVER/ARTWORK_CACHE/RECENT_RESUME/IMMERSIVE_CACHE
=PENDING: reprodução autorizada real não homologada. Fontes/imagens/ano
insuficientes, cold I/O, codec e suporte Cast/PiP impedem garantia universal
ou SLA instantâneo. Progresso5s pode perder última amostra na morte abrupta.
Avisos existentes de build mantidos, sem refatoração fora da allowlist.
Sem backend/reset/Git/escrita2.0. NEXT_GATE_STARTED=NAO.
EVIDENCE=docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md.


## 2026-10-06 — continuação C11 phone/Fire/tablet/D-pad/paginação/menu — fechamento

Regressões detectadas corrigidas antes da entrega:
- Cache paralelo: primeira rodada1/122 falhou porque prune removeu recém-promovido
  com timestamp antigo; proteger promovido e rejeitar imagem acima orçamento.
  Última rodada122/0falhas/0erros prevalece.
- SearchReady físico33497EFF apagou consulta digitada durante init; reapplylatest
  e não sobrescrever com Promise stale. Browser1800ms e Firefinalprotetor PASS.
- Mini trailer intermediário publicou>100bounds/3,5s e deslocou página; dedup
  JS e params Native corrigidos. Browser40resizes/0novosbounds PASS; final
  físico ainda pendente com tela desbloqueada (document.hidden=true observado).

Limitações/diagnóstico honesto:
- Fire crash ao clicar não reproduzido; saída BACK normal/históricoLMK sem vínculo
  não provam causa. O Protetor sem ano/ID é homônimo, não forçar arte incorreta.
- Trailer público pode falhar; Raio Negro erro honesto e Game of Thrones final
  reject Public trailer unavailable. Não afirmar reprodução a partir de ready.
- Uma entrada S24 cortada anterior não repetiu na trilha posterior; fixtures12
  topo/foco passaram. Não concluir inexistência universal.
- Tela bloqueada pausa CDP; harness wake-up não substitui desbloqueio. Pedido
  de S24 aberto feito; instalar/centering/perfis já completados.
- Fixtures: seletor incorreto de botão Voltar, colunas regex/!important e8itens
  debug foram corrigidos no harness, sem relaxar assertions de produção6.
- Warnings build preexistentes fs/path externalized/imports/chunk mantidos
  fora de escopo. Nenhum log privado ou segredo persistido.

Sem bloqueio de build/instalação. Homologações receiver/PiP/resume/trailer final
continuam pendentes; relatório itens24–38 explicita o que foi efetivamente testado.


## 2026-10-06 — complemento S24 desbloqueado

Usuário confirmou aparelho desbloqueado/aberto. PHYSICAL_TRAILER_LAYOUT=PASS_EXERCISED:
open visível/ready,0bounds em3,5s,hero100px. PHONE_VIDEO_PUBLIC_PLAYBACK=PENDING:
ready não certifica playing; controles de toque não homologados. Bloqueio
de tela anterior resolvido, sem patch/build/install adicional. APK BA37C4F0
inalterado; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Relatório item39.


## 2026-10-07 — C11 cabeçalho Live mobile compacto

Harness: primeira inicialização agent-browser atingiu timeout; sessão
reutilizada. Fixture TSX tinha StrictMode sem fechamento (HTTP500/overlay),
corrigido somente no arquivo ignorado; esperar Header substituiu delay fixo.
Última execução browser PASS, zero erros; nenhuma regressão de produto
identificada no escopo. Warnings build preexistentes externalization/chunk/
flatDir não alterados. Sem blocker de entrega/UI. Teste de receiver Cast/
stream real não é certificado por adapters; limites anteriores preservados.
Dados privados/credenciais não persistidos/emitidos. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO.

Complemento do harness: alvo CDP do tablet ficou inválido após QA; processo próprio
continuou vivo e buffer AndroidRuntime próprio estava vazio. Reconectar à WebView
atual recuperou leitura/navegação Home, sem patch/reset/reinstall adicional.


## 2026-10-07 — C11 EPG retrátil e retorno Live fullscreen

Regressão real do usuário: Cast permanente/preview deslocado/lacuna no EPG após fullscreen. LATEST_REGRESSION_WINS: sucesso intermediário retirado, patch e ciclos finais físicos/browser PASS. Primeira extração de canal rejeitava CDN/ID sem extensão, corrigida por emenda e 12 casos; grade real passou. Toque fullscreen precisava clickable=true para performClick Media3; inline restaurado false. Repetição encontrou Cast ausente no segundo ciclo: tentativas com listener fully-visible e pertencimento isolado foram supersedidas; emenda anterior ao patch final introduziu sincronização com alpha/visibilidade do fundo dos controles no OnPreDraw da View ativa. Capturas mostraram Cast e controles juntos em ambos os ciclos e nenhum após ocultação. Harness: import React não usado, escaping/heredoc/async/Unicode e código duplicado no fim do helper ignorado foram corrigidos; startup browser/CDP/tela bloqueada exigiram reconexão/unlock confirmado pelo usuário. UIAutomator contou Cast virtual do Header e aguardou idle até controles sumirem; filtro ImageButton e capturas imediatas corrigiram falsos negativos, sem confundir com regressão. Última validação PASS, sem blocker deste escopo. Sem segredos/URL/payload em evidências; warnings anteriores fora de escopo.

Tablet em retrato: menu no topo nas seis abas, Canais texto/Ativação chave, Live empilhado e EPG alinhado; browser600/800/960, estado Cast conectado e SM-X610 físico PASS. Rotação anterior restaurada e paisagem ampla revalidada; allowlist inclui useLivePresentation/AppShell/Header/CSS/Live e contrato C11_TABLET_PORTRAIT_LIVE_AND_MENU. Relatório43. Harness corrigiu acentuação/duplo decode e dev menu; override CSS de600px e ações44px foram verificados.


## 2026-10-07 — auditoria ativação simples/contato

Lock inicial/final PASS; sem bloqueador pendente. Leituras exploratórias de
caminhos inexistentes/glob Windows e patch com contexto de import incorreto
não editaram arquivos; contexto corrigido antes da aplicação. CLI não estava
no PATH/cache; npx Supabase2.120.0 isolado, sem alterar dependências do projeto.
Typecheck detectou estado de contato legado sem uso; removida só sua atribuição.
Harneses de navegador ajustados para boolean retornado pelo CLI e limpeza
do input via teclado; timeouts de inicialização do browser revalidados.
QA Fire detectou regra TV30px sobrepondo suporte; CSS específico com prioridade
corrigido, rebuild e segunda atualização nos três; D-pad/clipboard final PASS.
S24 inicialmente ausente e depois pausado por bloqueio; usuário reconectou/
desbloqueou e reabertura conferiu Autorizado. Nenhuma identidade/chave/licença
foi rotacionada ou autorização relaxada. APK anterior intermediário não é
a entrega final. Última regressão vence: somente resultados finais PASS usados.
Sem número real cadastrado/atendimento WhatsApp testado; site web não publicado.


## 2026-10-07 — barras persistentes — fechamento

Escrita inicial de helper com cwd android falhou por caminho relativo; corrigida
no root antes do build final. Script histórico de orientação falha também no
baseline por assert contíguo de atributos do manifest anterior com PiP; arquivo
inalterado, não declarado PASS. Java atual128/0falhas/0erros e lock PASS.
QA inicial por árvore UI não detectou SystemUI; substituir inferência por
WindowManager + inspeção visual. Timeout idle/foreground tablet corrigidos
na última rodada ativa, playerbounds e barras PASS. Nenhum blocker de entrega.


## 2026-10-07 — exceção fullscreen — fechamento

Último requisito do usuário sucede barras presentes no player. Rodada nova
PASS130 Java/lock/APK/QA físico nos dois mobiles; sem blocker de entrega.
InicialmenteVisible do controle taskbar pode manter valor histórico mesmo
com source oculto; não inferir estado atual daí. Conferir InsetsSource visible
e screenshot: taskbar some fullscreen e reaparece no retorno.


## 2026-10-07 — filmes no celular como as séries

Sem bloqueio de implementação/instalação. Joderism não tem trailer público disponível: imagem e mensagem específica confirmadas, restante funcional. Primeiro probe de tablet/Fire antecipou hidratação e foi repetido com sucesso; Fire tinha display Asleep/OFF, wake e captura. Não tratado como regressão do produto. Compartilhamento sem envio a terceiros; disponibilidade de APIs não é garantida para todo título.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem backend/Git/reset.


## 2026-10-07 — linhas de categorias e regressão visual de capas

Regressão de capas reproduzida no S24 em linhas tardias:20/20/7 pendentes sem src após5,4s. Produção não certificada. T187/countCategory falha anterior ao patch comprovada por hash do leitor. Pausa WebView por player/saída do app e expectativa de foco desktop em telefone corrigidas no harness, sem patch de produto para timing. Substituição Delete/Add em mesmo patch recusada, reaplicada sem alteração parcial.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.

## 2026-10-08 — ciclo49 capas: correções verificadas, cobertura residual

Duplicação de transporte, filas abortadas/admissão após cancel e inversão de
prioridade identificadas/corrigidas com testes reais. Cache nativo filesystem
não deve ser confundido com fonte; causa conhecida segura evita segundo acesso,
codec/local desconhecido permite fallback. Índice local de prévias evita novas
leituras massivas. Placeholder animado penalizava pintura Fire; desativado só
nesse perfil. Leadale recuperado após alias oficial exato, sem matching frouxo.

B002 não acionava estágio inicial (ref parent antes do commit/perfil assíncrono).
Corrigido; E50/7B90 acionam/desbloqueiam/foco/D-pad. E50 Comédia5/8 após21,737s
impediu declarar solução; decode6–8s e poucos frames. Power read-only depois
identificou Asleep/OFF nos dois Fire, embora DOM visible/focused. Wake e repetição
E50 sem patch:8/8 em5,663s. Medição em repouso não representa TV ativa. Bitmap
local draw/readback1px0–11ms tratou readiness sem forçar frames; novo7B90 acordado
Comédia8/8~4,40s, outras linhas3,47/1,00/1,93s, sem ganho causal/SLA presumidos.

Homônimos/fonte sem imagem correta ainda limitam cobertura: Documentários7+1
indisponível, Fire103preparo29+3indisponíveis. Dinastia/Histeria confirmados
localmente em cache opcional; não corrige universalmente catálogos novos.
Produção100% PENDENTE. Tablet MEDIA_PARSER_FAILURE em Luke CageT1E2 adiado
explicitamente, não corrigido/testado. QA anterior tablet/Home target indisponível
inconclusivo. S24 desconectou, recebeuE50 e, após nova reconexão,7B90 preservado.

Helpers: aspas node-e/âncora inexistente falharam antes de editar produção;
reaplicados. Alvo antes de hidratação/shortcut sem reload/QA simultâneo à
instalação eram probes inválidos; corrigidos e repetidos, sem falso PASS.
Persistência pendente do módulo antigo sobrescreveu associação pública107;
aplicação antes dos novos módulos corrigiu, catálogo/nativos hashes iguais.
T187/countCategory e harness SSR antigo não alterados nem declarados PASS.
NovoAPK lock/Java134/testes/baseline699/protegidos227 PASS; 4install-r preservados.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.

## 2026-10-08 — complementos do ciclo49 e entrega parcial

TS do novo resolver encontrou união manifestV1/2 com segmentsunknown; tipagem
estreita corrigida. Fixtures precisaram pathsegmentos normalizado, season real
para resolução de episódio e useRef estável para testar resume. Critérios e
guard de identidade/episódio preservados; suítes reais PASS. Recentes tablet
9de11 após reclassificação foi regressão real; patch27 de apresentação aprovado
antes do código, tested unique/ambiguidade/abort/geração/posição/episódio/dedup.
Validação física final11ainda pendente; não declarar reparo completo no aparelho.
Anos1988cachepersistiu107, não103 na últimaQA; status anterior de recuperação
nos dois não se aplica. T187/countCategory e ENOENT do harness real-catalog
sem executor r7c-r6d permanecem anteriores/inconclusivos, não reportadosPASS.
Playbacktablet/S24 logsconnectSocket timeout antes do primeirobyte, falha móvel
informada. Tabletposterior HEAD200 e reprodução Coyote real indicam retomada
temporária; S24filme solicitado17:04UTC sem frame confirmado. Probe antigo
selecionou trailer/elemento detached, não prova reprodução de filme nem bug.
Primeiro install simultâneoAE2 falhou etapa install em ambosFire, causa ainda
não determinada; chamada direta103retornouSuccess. Novas tentativas canceladas
pelo usuário; processos escopados interrompidos. Não repetir ou abrirFire até
novo pedido. Últimos hashesFireconfirmados sãoD8 históricos, nãoAE2. Samsung
AE2install-r preservado; probes físicos depois falharam semforeground próprio,
não contamPASS/crash. Cobertura de capas/produção e entregaFire aindaPENDENTES.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.

## 2026-10-08 — ciclo50: regressão de retomada corrigida e limites

Regressão física: JS115995ms→native0 por PluginCall.getLong Long-only versus
JSONInteger. Stub antigo convertia Number e mascarava falha; corrigidos plugin
e stub, negativos/tipos reais e Java138 PASS. Físicos finais comprovam posições
exatas, substituindo afirmações anteriores ao patch. TS durationMs opcional
corrigido; seletor negativo Live corrigido sem relaxar8controles/lifecycle.
Instalação Samsung intermediária teve app reaberto no meio da auditoria;
não contou PASS. Instalações finais251E completas preservadas nos quatro.

Tablet Wi-Fi caiu, nova44431 expirou mesmo pareado; USB solicitado pelo usuário
permitiu concluir filme e restart. Probe490412/duração0 com401 e arquivo
temporário rotulado505412 não comprovam reprodução/ponto505412. Usar somente
resultados finais5477891/5479764 com duração conhecida/frame real. S24 saiu do
ADB antes do teste de restart; teste S24 correspondente inconclusivo, tablet PASS.

HTTP401 real antes de dados em Um Natal/Coyote; usuário relata fonte em outro
app. Probe GETRange repetido206 em perfis atual/controle não confirma UA.
Luke/Coyote depois produziram frame/READY com transporte original;401 permanente
e Um Natal em particular ainda abertos, sem patch especulativo de fonte.
Novo pedido autorizou duas instalações Fire251E, ambas auditadas PASS; pendência
de entrega do item49 é sucedida por essa evidência. QA física Fire e cobertura
universal de capas/produção permanecem pendentes. Sem reset/Git/backend administrativo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-08 — ciclos51/52: limites fisicos e auditorias

Primeiro install8EBA S24 preservou catalogo/nativos/firstInstallTime, mas alterou
2 preferencias/19 WebView/2 outros: auditoria integral NAO PASS, causa nao
determinada. Repeticao8EBA e entregaEC412 preservaram todos os grupos. Fire103
reabria e auditoria estrita com PID ausente abortava antes de instalar; metodo
alternativo exigiu duas amostras iguais antes e depois, igualdade integral,
hashAPK/firstInstallTime e ausencia de player nativo. EC412 PASS899/856/5.

Fire107 nao respondeu aoADB/endereco anterior; apos usuario informar disponivel,
nova tentativa tambem timeout10060, solicitado IP atual/ADB. S23 perdeuWi-Fi e
usuario pediu pular, sem nova tentativa. Probe logcat-tail perdeu eventos por
volume; zero nao indica ausencia de frame. Observacao realtime filtrada confirmou
Um Natal frame/READY8EBA e EC412. Sem nova falha fisica, aviso/copia/WhatsApp
testados controladamente, nenhum envio real.401 historico/externos/capas
universais/producão seguem nao resolvidos. Probe Fire de modal ja fechado nao
comprova bugBack; QA finaltablet modal Back/foco PASS.
Regressao real D-pad EC412: Recentes nao desce por wrappers; relacionados de
filme sobem ao menu por seletor de hero antigo. Reproduzidos com teclasADB;
escopo53 registrado antes do patch. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-08 — ciclo53: D-pad reproduzido, guard de modal e QA final

EC412 Fire103: Recentes nao desce por hierarquia de wrappers; relacionados
sobem ao menu por .hero-actions antigo. Corrigidos e fisico11 passos finalEB669
PASS. Nova verificacao mostrou dialog filho rolando fundo4vs3; guard de modal/
player exclui novo restauro, unit e dialog fisicoDown/Back/foco PASS.
Teste inicialmente falhou porque Recentes nao montara em2s; espera limitada
de20s so no helper QA, sem mudar boot. Fixture CSS omitia atributos e tratava
qualquer elemento como live-categories, causando falha horizontal artificial;
matcher de atributo corrigido, codigo horizontal preservado. DREAM impediu
teclas comforeground proprio; nenhum wake/controle de outros apps. Sequencia
DOM parcial teve troca de pagina e nao foi contadaPASS; rodada final nativa
completa sem eventos extras substitui essas tentativas.
Fire107 continua semADB emIP anterior (10060/pingtimeout/porta nao acessivel),
solicitado IP atual/depuracao; entregaEB669 nao realizada nele. S23 excluido.
401 externos/capas universais/producão seguem pendentes. Sem Git/reset/backend.

Complemento factual53: a tentativa final apos install foi inicialmente capturada
pelo dialog legitimo Preparando as capas/Entrar agora; helper passou a aguardar
esse preparo antes de focar Recentes, sem alterar o boot. Outra rodada recebeu
setas extras e foi descartada. Apos usuario informar103 aberto,11 passos nativos
completos PASS. Helper de Avaliar supunha opcoes horizontais; CSS e vertical,
portanto Right permanecia em Nao gostei corretamente. Down levou a Gostei;
Back/foco/fundo estavel confirmados sem gravar avaliacao. Nao houve patch
adicional de producao por essas suposicoes do helper.
## 2026-10-08 — ciclo54: QA e mudanca de IP

Primeiro helper QA Fire procurava menu apenas no header phone; corrigido no
helper privado para nav-link responsivo, QA real repetida PASS. Assert via
stdin PowerShell perdeu acento; UTF8/Unicode corrigiu verificacao, sem patch
produto/teste relaxado. Fire103 mudou para106;3.106 recusou10061,0.106 conectou
com modelo/API/hashD23B confirmados. Fire107 ainda semADB no endereco anterior;
nao declarar atualizado. Playback Luke/AirScreen nao resolvido por esta ordem;
investigacao55 separada, latest regression wins.


## 2026-10-08 — ciclo55: falhas externas permanecem abertas

Luke Cage S01E03 falha perto de725243ms com INVALID_NAL_LENGTH/Media3 3001 no tablet, Fire0.106 e S24. Range206/offset147250663 MATCH; trecho anterior toca. Usuario confirmou mesma falha aos12min em outro app. Nao zerar retomada/descartar NAL/alterar SDK ou fonte para mascarar. Cast preserva UA da fonte e oito codigos fechados no aviso/diagnostico; AirScreen LOAD aceito mas CAST_MEDIA_ERROR. Filme local valido tambem falhou no receiver. WIFI=true/CELLULAR=false/VPN=false, RELAY_BOUND sem PEER_ACCEPTED/DENIED nem GET upstream; usuario informou motor de renderizacao incapaz e encerrou transmissao. Primeira fronteira do Cast no receiver; compatibilidade pendente, nao declarar resolvida.
Nenhum reset/rotacao; outros trechos e filme local valido nao certificam catalogo universal. Fire107 inacessivel no IP anterior; versao mais recente nao comprovada. QA D-pad final E87 passou11 passos. Assertions bloqueiam entrega se falharem; nenhum relaxamento.


## 2026-10-08 — ciclo56: salto espacial corrigido e QA limitada por disponibilidade

Teste antes do patch saltou episodio3->temporada por deslocamento X. Fixture de dois perfis foi corrigido para posicao/timestamp inicial independente, sem relaxar assert. CSS phone tinha empate de especificidade, corrigido/QA cascata PASS. Guards impediram input/screenshot com app fora do foreground e teste S24 pausado; nenhum controle de outro app/unlock.
Render real/WatchHistory2, hook8, hero4, detalhes7, continuidade4, Cast4, diagnostico8, ordem4, typecheck/React, lock22+27+9/prebuild, build/sync, assets6/certificado e Java148 PASS. QA ADB15 passos em Luke Cage aberto por busca no tablet e Fire0.106; hero inteiro/menu/restauro PASS. Fire A Biblia2013 com temporada unica/zero season-buttons:6 passos isolados e identidade da fixture conferida por passo PASS. Regressao Fire Home/filme11 passos PASS. CSS real tablet/Fire: shadow igual ao botao, dimensoes iguais, linha inteira; cascata phone simulada temporariamente no DOM do tablet e removida, nao equivale a QA fisica S24.
S24 atualizado com dados preservados, mas UI fisica final pendente por tela/aplicativo fora do foreground; nao desbloqueado pelo agente. Fire107 ausente do ADB e IP atual solicitado; nao alegar versao atualizada ou QA nesse alvo. S23 excluido. Fonte Luke S01E03 aos12min e motor AirScreen continuam limitacoes externas documentadas55; usuario encerrou Cast, nenhum novo teste Cast. Sem semear historico real/avaliar/favoritar/WhatsApp automatico/reset/rotacao/backend/Git/novoGate.


## 2026-10-09 - ciclo57: clipboard desabilitado e limites de QA

Fire detectou BODY apos copiar: botao ainda desabilitado no fallback; frame RAF nao garante commit React. Corrigido por efeito apos commit, teste regressivo antes de habilitar PASS e tablet fallback real16passos PASS. S24 transporte reverse caiu/import dev falho em cache: restaurado e superficie propria recarregada; QA final copia/Back/WhatsApp PASS. Sem regressao de producao atribuida a helper. WhatsApp tablet foi corrigido por emenda explicita; politica independente da largura com vetoTV. Fire1 final instalado e QA parcial; usuario limitou rodada ao tablet, nao certificar QA completa Fire. Fire107 IP atual ausente, S23 excluido. Manager browser indisponivel: sem QA visual autenticada/publicacao remota; componentes reais e backend SQL/PostgREST passaram. Nenhuma mensagem ficticia persistida. M?dia Luke/AirScreen permanecem abertas55. Evidencia C11_MANAGER_PLAYBACK_ERROR_REPORTS.md.


## 2026-10-09 - ciclo58: poster ausente bloqueava todos os complementos

Soulm8te: filename antigo da fonte nao confirmado nas variantes TMDB atuais bloqueava identidade inteira e cache24h registrava miss; novo matching limitado titulo/anoexatos+unicidade e match5 recuperaram metadados/trailer/backdrop na pagina instalada S24. Teste regressivo antesFAIL/depoisPASS. Suitehistorica source-first possui loaderSSR incompativel com Artwork atual (artwork-file-cache ausente), conteudos identicos ao baseline58; oito gruposservicoPASS, nao considerarPASS integral. Coverage atualArtwork12 e QA fisica compilada PASS; teste historico demanda manutencao propria, assertions intactas. Primera instalacao falhou antesinstall em conferencia privada; repeticao preservou todosdados/hash/firstInstallTime. Assertionprivada de textobutao corrigida para iconeplay, sem patch extra do app. Sem reclamar que playback/trailerYoutube/AirScreen/capasuniversais foram certificados. Evidencia C11_SOULM8TE_METADATA_RECOVERY.md.


## 2026-10-09 - ciclo59: limites de data e QA fisica

Fonte/canonico M3U sem data de insercao; nao inventar retroativo com ano/TMDB/instalacao. Primeiro inventario e referencia, novos titulos recebem7dias a partir da primeira observacao por fonte/dispositivo. Homonimos indistinguiveis e renomeacao limitam identidade conservadora. Falhas/abort/geracao/segmentos/storage nao promovem referencia parcial. Novo12+browserperfis3+IndexedDB14assertions PASS. S24 final5683/index-DvT-8_G7.js instalado/hash/dados preservados, UI nao visivel/bloqueada e pedido QA pendente; sem afirmar visual fisico ou insercao comercial real testada. Helpers: UTF8 verifier, TS Node strip-only, ReactDOM default/context ready e EBUSY Chrome profile em arvore Vite corrigidos em QA privado; limpeza do profile rejeitada por politica, abandonada com alternativa sem exclusao. Nenhuma regressao de produto nem assertions relaxadas. Datasglobais exigem timestamp real da fonte/registro de insercao futuro, fora deste patch local. Evidencia C11_NEW_CONTENT_BADGE.md.


## 2026-10-09 — ciclo60: atualização automática do catálogo

NO_OP por versão de configuração não detectava inserção do provedor: corrigido/provado nos aparelhos sem editar fonte comercial. Xtream tinha truncamento100 e erro de listas tratado como vazio: corrigidos e fixtures de import completo/falha parcial PASS. Nome intermediário1.0.1 incompatível com RPC diagnóstico que exige1.0: entregue code2/name1.0, sem migration; intermediário próprio removido e final preserva dados. Hash privado Fire excedeu timeout120s antes da instalação; ampliado só helper para300s, refeito em quiescência e resultado byte-idêntico. Timeout/pausa inicial WebView/S24 fora foreground não foram contornados com unlock, QA final depois PASS. Loader histórico artwork-visible-recovery não suporta NewContentProvider atual: dois grupos serviço PASS, execução integral não PASS; teste não relaxado nem alterado fora do escopo. Fonte Luke Cage S01E03 corrompida aos12min/motor AirScreen não resolvidos por atualização de catálogo; não certificar biblioteca inteira/produção universal pelos checks das imagens montadas.

Spec/evidência: C11_AUTOMATIC_SOURCE_REFRESH.md (architecture/evidence). CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR, backend/env/reset ou projeto protegido.


## 2026-10-09 — ciclo61: selos e prioridade de séries

View model não possui categoryIds: filtro corrigido para categoryLabels.
Ports históricos faltavam imports novos e dependências SSR preexistentes,
ajustados apenas dentro da allowlist, mantendo assertions. Browser mock faltava
export metadata; Vite ignorava mudanças de tmp, resolvido reiniciando apenas
servidor próprio. Imagens fora da tela são lazy: QA passou a exercitar a faixa
horizontal antes de exigir20 decodificadas. PowerShell converteu caractere no
helper privado de APK: corrigido UTF8 antes da verificação. Revisão detectou
risco de retirar card focado na expiração; store/provider agora adiam só seleção,
selo expira no prazo. Constructor com parameter property recusado por Node
strip-only: declaração explícita corrigida; suites15+12 e browser novamente PASS.
Build intermediário1B48 foi substituído por final364A no tablet/S24, com duas
leituras SHA estáveis/todos os grupos iguais e firstInstallTime preservado.

Tablet/S24 fora foreground/WebView indisponível durante QA: não desbloqueados,
sem capturar outras telas ou afirmar QA físico integral. Estrutura nativa real
S24 completa validada read-only; não prova adição comercial/visual/migração física.
Fire1 3.126 em playback nas duas conferências, permaneceu code2, sem instalação
ou interrupção. Disponibilidade solicitada; Fire2/S23 excluídos. Primeiro baseline
não inventa adições retroativas; selos dependem de observação local e sincronização
autorizada. Sem certificação universal de capas/playback/Tizen/webOS/AirScreen;
Luke/AirScreen mantêm limites55. Evidência C11_SERIES_EPISODE_UPDATES.md.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/env/reset/projeto protegido.


## 2026-10-10 — ciclo62: lacunas públicas, recuperação e limites reais

Homônimos sem ano/ID, filename re-hospedado e título composto bloqueavam match
apesar de capas acessíveis/metadata TMDB presente. Corrigidos sem inferir obra
por popularidade. Comparação de posters antes sequencial excedia prazo para
Matador2005: batch2 dentro da fila existente resolveu; teste nativo confirmou.
Amostra adicional detectou sufixo[L] conservado como nome: teste FAIL antes,
fix terminal mínimo e9454/1998/metadados/trailer PASS na revisão final. Primeira
medição de Acampamento antecipou decodificação: final backdrop horizontal PASS.
19/19 posters/metadados/backdrops no tablet; trailers ausentes nos IDs públicos
1006381/991565/1326790, confirmados inclusive língua original. Não fabricar mídia.
Loaders TSX históricos source-first/visible-recovery/startup não fornecem ports
atuais; grupos de serviço passaram, suites integrais não declaradas PASS.
S24 instalado final mas tela apagada/fora foreground, QA visual pendente; nenhuma
ação de unlock. Fire1 inicialmente atualizado B875, depois suspenso pelo usuário,
sem fix posterior[L]/QA físico. Sem cobertura universal/certificação Tizen/webOS/
playback/AirScreen. Spec/evidência C11_PUBLIC_METADATA_GAP_RECOVERY.md.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/env/reset/projeto protegido.

Atualização2026-10-10: pendência de entrega final no Fire1 resolvida por pedido
explícito posterior. Install-r D41E0B6A.../build4/hash/dados/firstInstallTime PASS
às10:41:36.484UTC; todos os grupos privados sem diferenças. QA/playback Fire e
QA visual S24 permanecem nos limites anteriores, sem alegação nova de validação.


## C63 — Buffer por conteúdo e foco neon nas capas — 2026-10-10

Ocorrências privadas resolvidas: watcher Vite EBUSY em Cookies Chrome (ignorar
perfis de QA), define debug explícito, const global CDP repetida (escopo local),
checker ::after versus minificação :after equivalente. Execução final browser
12/12 PASS; APK/Java154/0 PASS. Fire em Asleep/displayOFF inicialmente; usuário
desbloqueou e navegação/ring/frames foram confirmados. Métricas de buffer Fire
não retornaram nos logs, portanto sem afirmação de duração real/ganho medido.
S24 pareamento temporário falhou mas conexão confiável existente funcionou.
Recent Anos Incríveis mostrou placeholder no S24; foco depois conferido com
Passagrana decodificado. Não modifica a conclusão anterior de cobertura limitada
de capas. Sem queda de rede induzida, prova de ausência de travamentos, QA de
série específica/Tizen/webOS/OTA. Tablet não atualizado. Evidência C63.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/env/reset.


## C64 — Lançamentos primeiro na Home — 2026-10-10

Harness histórico home-release-notice falhava antes em useSeriesHighlights;
ports Home atualizados e fixture kind/title corrigida para prioritizeSeries.
Grupo Home final PASS, script integral continua sem port @capacitor/browser
no Notice inalterado; não declarado PASS nem relaxado. Coleções3/D-pad8/
lock/build/Gradle PASS. Guard C63 usado fora de ciclo acusou só nova spec C64
autorizada; guard próprio C64 PASS. Probe .home-hero inexistente retornou false;
classe real .home-hero-carousel confirmou hero pronto/acima das fileiras.
S24 conexão Wi-Fi expirou10060 e entrega pendente. Fire Asleep/displayOFF, sem
QA visual ou teclas físicas; instalação e DOM compilado verificados. Sem unlock/
interrupção de player/reset. Evidência C64; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## C65 — Encerramento de áudio ao fechar PiP — 2026-10-10

Spec anterior: C11_PIP_DISMISS_PLAYBACK_RELEASE.md. Clone independente ativo,
origin esperado/main/HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e; contratos/lock
lidos; baseline787. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git.

Correção: onStop pausa local sem consultar flag PiP; NativePlayerActivity
salva progresso/terminal não-concluído, libera e finish. Preview mantém latch
de entrada PiP até onResume, liberando após dispensa em ambas as ordens de
callbacks; evento terminal existente fecha C9 sem falso erro. Cast/configuração
não são encerrados por essa regra; background normal do preview conserva pausa
e retomada. Release idempotente/remove probes periódicos/listener de layout,
restaura WebView e impede retomada do preview já liberado.

Java 162 testes/0 falhas/0 erros, incluindo8 novos casos lifecycle;
wiring Android/progresso-antes-release/cleanup PASS. Continuidade web4 grupos
PASS (filme55min/episódio exato/journal/adultos/último canal seguro). Lock22+27+9,
TypeScript/Vite/sync/Gradle/assinatura/package/assets7 PASS.
Teste histórico mobile-output: grupo lease Cast PASS; integral FAIL em assert
literal '<CastButton />' obsoleto. Script e3 páginas possuem hashes iguais ao
baseline anterior ao patch; não regressão C65, não corrigido fora da allowlist.
Não afirmar PASS integral desse harness. Warnings flatDir/chunk/externalização
históricos, build concluído. APK build7/code7/name1.0,
SHA256 23EB3CC739CE4708086F4769AE30D66556102DCADB963E3579255BD0C182C320, 11011441 bytes;
bundle index-C-VJn-as.js mantido (mudança nativa), schemeHTTPS/standalone.
Certificado preservado; buffer/foco/metadata/refresh/selos/Home mantidos.

Usuário informou que S24/tablet estão desconectados e solicitou APK para teste
remoto. Sem instalação, playback físico, desbloqueio ou operação em Fire.
PHYSICAL_PIP_DISMISS_AUDIO= PENDING_REMOTE_USER_TEST; não homologado áudio real
nem performance em aparelho fraco. Conferir após atualizar sem desinstalar:
vídeo -> Home/PiP -> fechar X -> ausência de áudio; reabrir mesmo conteúdo e
conferir posição salva. Repetir episódio/canal, retorno PiP fullscreen e fechar
app nos recentes. Evidência unitária não substitui essa conferência.

Spec/evidência: docs/{architecture,evidence}/C11_PIP_DISMISS_PLAYBACK_RELEASE.md.


## C66 — 2026-10-10 — Entrada amigável e D-pad de séries

Build8 gerado e instalado SOMENTE no Fire Stick1 (192.168.3.126), dados íntegros.
Entrada amigável/play animado, sem contadores técnicos; abas saem para menu,
hero horizontal visível, episódios/temporadas/semelhantes retornam nos dois
sentidos.10 grupos hook/2 progresso/7 detail e browser real PASS; Fire físico
Carrie22/Jack Ryan26 passos D-pad PASS. Startup original tem mock
NewContentProvider obsoleto (hashes preservados); cópia privada4 grupos PASS,
não PASS integral original. PiP físico anterior segue pendente. Lock/build/
assinatura/assets/proteção de dados PASS. Tablet/S24/Fire2 sem atualização.
CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO; sem Git/backend/env/player/source writes.
Spec/evidência docs/{architecture,evidence}/C11_FRIENDLY_STARTUP_AND_SERIES_DPAD.md.

## C67 — 2026-10-10 — Heros Fire enquadrados e sinopse legível

Regressão C66 e tentativa CSS-only9 confirmadas fisicamente. Ramo Fire do
hook usa posição explícita com inset, uma rolagem/RAF; CSS enquadra
Home/Filmes/Séries e sinopse .hero-overview aumenta3px (11→14 no aparelho).
Browser110/Fire físico38 verificações PASS, entrada de processo
novo e retorno D-pad/menu/rail. Build10 instalado somente Fire Stick1; todos
os hashes privados/firstInstallTime/APK preservados contra baseline de10.
No evento9 app reabriu antes da verificação: core preservado, hashes completos
não equivalentes após execução. Lock/build/assets/cert/provenance PASS;
162 resultados Java C65 reaproveitados, fontes nativas intactas. Tablet/S24/
Fire2 sem atualização; PiP físico anterior segue pendente. CURRENT_GATE=NONE/
NEXT_GATE_STARTED=NAO; sem Git/backend/env/source/player writes.
Spec/evidência docs/{architecture,evidence}/C11_FIRE_HERO_SAFE_FRAME.md.


## C68 — 2026-10-10 — Continuidade de séries e controles nativos

Avanço automático em ordem numérica ao fim do episódio e entre temporadas;
Próximo manual independente de±10s. Mesma Activity/MediaSource, C9 e resolver
normais a cada troca; correlação/cancelamento preservam Back/stop/revogação.
Controller com episódio/temporada, seek, velocidade, lista, áudio/legendas da
mídia e ajuste de tela; brilho/bloqueio somente handheld, foco D-pad na TV.
Novo teste8 grupos, regressões/C9, Java166 testes executados neste ciclo, build,
lock22+27+9, assets/cert/standalone/provenance PASS. Build13 instalado somente
Fire1:1112 hashes privados, firstInstallTime e APK preservados/verificados.
Fixture física isolada com C9 mock confirmou auto mesma/próxima temporada,
botão próximo, picker, auto após picker e final sem wrap; não certifica fonte
comercial/backend C9. Troca efetiva de trilha e mobile/PiP físico pendentes.
Falha picker11 corrigida com guarda resumed/PiP; evento auto isolado12 não
repetiu em13, causa exata não estabelecida, sem afirmar eliminação definitiva.
APK SHA2568A13A10BA4ED0CDCF99765475CCF9CB4B2CE4EB0F807ED77B95A8AA62F361C74.
781 arquivos fora da allowlist e HEAD preservados. Sem Git/backend/env/source
writes; CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO. Spec/evidência em
docs/{architecture,evidence}/C11_SERIES_PLAYER_CONTINUITY.md.


## C70 ? 2026-10-11 ? Manager lateral, privil?gios e sinal pr?prio

Menu lateral/login real, MASTER global (OWNER can?nico), ADMIN somente seus
consumidores, USER sem Manager. Diret?rio USER/Gestores, atribui??o MASTER,
aprova??o auditada por dispositivo/fonte/licen?a; pagamento indispon?vel.
Ativa??o p?blica valida par antes de fonte/sincroniza??o. Cores privados e
46 RPCs Manager com guards; zero acesso anon/cores/autoridade de sinal ao
cliente. Tr?s migrations aditivas aplicadas somente cujbmyhitgomlgwfkaat;
Edge p?blica v10 e customer-upsert v7 com custom auth preservada.
SQL remoto rollback PASS, cliente8/pol?tica10/browser14, regress?es105,
build/Lock22+27+9 e Deno check PASS. Frontend build local, sem publica??o/APK
ou instala??o. Nenhuma conta/libera??o/exclus?o real; dispositivos sint?ticos0.
Backfill42 configura??es verificado; uma CUSTOMER XTREAM v1 ACTIVE falha
DECRYPT (causa AAD/chave n?o comprovada). Novas ativa??es/CREATE e fontes
alheias permanecem bloqueadas at? corre??o desse envelope pelo respons?vel.
Recupera??o pr?pria com identidade/capability real implementada/testada;
nenhuma fonte/credencial existente foi modificada nem prova fict?cia criada.
Avisos de seguran?a legados documentados, n?o declarar sucesso global.
Provenance allowlist/HEAD preservados, sem Git; C69 pendente, sem playback/
Android/device writes. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO.
Spec/evid?ncia docs/{architecture,evidence}/C11_MANAGER_ROLES_AND_PUBLIC_ACTIVATION.md.

## C71 — Recuperacao da conta MASTER (2026-10-11)

Pedido do titular: recuperar senha existente via Supabase. Spec/evidencia:
`docs/architecture/C11_MANAGER_PASSWORD_RECOVERY.md` e
`docs/evidence/C11_MANAGER_PASSWORD_RECOVERY.md`. OWNER ACTIVE preservado;
sem novo MASTER, promocao, exclusao ou Git. Pagina de recuperacao independente
com verificacao Auth real, senha somente em memoria, encerramento global e
novo login. Pedido de email aceito/registrado; entrega e novo login pendentes
do titular. Login principal continua inline, pagina dedicada foi discutida.
C71 13/13, C70 8/8, lock e build PASS; browser desktop/mobile/expirado PASS.
Falha EBUSY no watch de perfil headless corrigida no helper local ignorando
arquivos temporarios; servidor3000 restaurado e mantido para concluir link.
Sem APK/dispositivo/source/deploy ou proximo Gate. HEAD61ec009 inalterado.

### C71 — Retorno real do email de recuperacao (2026-10-11)

Print confirma otp_expired do Supabase; causa especifica nao comprovada.
Corrigido diagnostico do teste (CORS fixture faltava header SDK), callback
valido tambem passa com main anterior. Mudanca de captura antecipada retirada.
Patch minimo: titulo Definir nova senha quando verificado, email mais recente
nas mensagens e cooldown UI de reenvio60s. C71 15/15, build/lock e browser SDK
com submit/ACK/logout todos PASS (Auth interceptado; senha real nunca alterada).
Tentativa nova de email foi recusada429 over_email_send_rate_limit; aguardando
janela SMTP. MASTER existente preservado, login real pendente do titular.
Detalhes: docs/evidence/C11_MANAGER_PASSWORD_RECOVERY.md. Sem Git/APK/fonte.

### C71 — Recuperacao pronta para teste do titular (2026-10-11)

Titular informou acesso restabelecido com a senha da conta existente e pediu
finalizacao do fluxo para teste posterior. Consulta read-only confirmou
last_sign_in_at 2026-10-11 19:07:44Z, OWNER ACTIVE (MASTER); ultimo envio de
recuperacao continua 18:42:08Z. Isso confirma login, nao troca de senha pelo
fluxo de recuperacao. Nenhum novo email foi solicitado apos esse retorno.
A espera de quota/email adicional registrada antes fica encerrada.
C71 isolado reexecutado: 15/15 PASS. Pagina local /manager-reset-password HTTP
200. Build/lock e browser com SDK real + Auth interceptado PASS no fechamento
anterior; codigo funcional nao mudou depois dessa verificacao.
Implementacao local concluida, teste real de troca de senha pelo titular ainda
pendente. Para testar: Esqueci minha senha, pedido unico, email mais recente,
Definir nova senha + confirmacao (12 caracteres), salvar e entrar novamente.
Nenhum token/senha real coletado; nenhuma conta, role, fonte ou dispositivo
alterado. Sem commit/push/PR, APK ou deploy. NEXT_GATE_STARTED=NAO.

C71 fechamento: auditoria inicial apontou .env.example como adicao porque
baselines excluiam esse arquivo. Arquivo ja rastreado, sem status dirty;
Git blob atual igual ao HEAD (d2072ced3adb81848ec98d412c704ffc64557fb9).
Comparador corrigido para aceitar somente esse caso verificado, sem alterar
arquivo/env ou relaxar allowlist. Proveniencia final privada em
 tmp/c71-manager-password-recovery/provenance-callback-final.json.

### C72 — Configuracoes e escolha Celular/Tablet/TV (2026-10-11)

Pedido explicito implementado conforme C11_DEVICE_PRESENTATION_CHOICE.md.
Android sem preferencia escolhe antes de Codigo ID/chave e App/boot; detector
inicial associa PHONE/TABLET/TV ao novo registro. Configuracoes e pagina interna
com tipo de dispositivo e dados de ativacao; layout muda e persiste, preservando
ID/chave/catalogo/ativacao. Tipos remotos antigos nao reescritos.
Templates/cache/parental/perfis preparados como extensoes futuras, nao feitos.
Testes C72 +navegacao18/3 +HomeHero +notice11 +recovery15 PASS; browser real UA
Android Mobile enganosa, controle/foco/Voltar, storage denied/retry, persistencia
e identidade/chave sem remount PASS. Lock22+27+9, build/typecheck PASS.
APK debug gerado Java21, assinatura/package/SDK e7 assets dist byte-match PASS.
SHA256 01C185992FF1222B7DDCA99B2DDA6F52E60260E4B49B54AF60CA201172AAEAFD.
Artefato tmp/c72-device-presentation/xandeflix-configuracoes-dispositivo.apk.
Mi Stick fisico pendente; nenhuma instalacao/distribuicao/backend/Git.
Erros corrigidos e rejeicao de limpeza da pasta vazia externa registrados em
 docs/evidence/C11_DEVICE_PRESENTATION_CHOICE.md. NEXT_GATE_STARTED=NAO.


### C73 — Player Live, PiP e ajustes tablet (2026-10-11)

Harness mobile atualizado com port especificado antes da edicao: CastButton com props e detalhes Phone filhos existentes na baseline. Servidor local encerrado, cache Vite de tmp, escapes CDP, window.qa apos reload e commit React corrigidos em helpers privados. Rodada com dois helpers na mesma porta CDP invalidada e repetida isoladamente. Startup/browser/localhost timeout corrigidos com perfil proprio, Chrome, porta9705 e no-proxy-server; sem mudar perfil/proxy do usuario.
Rodadas finais browser e build PASS; nenhum bloqueio de compilacao. Warnings anteriores de bundle/mixed imports/node:fs/path e META-INF apksigner registrados na evidencia. QA fisica nao realizada e nao tratada como certificada. Nenhuma rejeicao automatica de aprovacao neste ciclo.
NEXT_GATE_STARTED=NAO.


### C74 — Ativacao assistida e Codigo ID automatico (2026-10-11)

Falhas de harness por imports novos corrigidas somente com ports isolados, assertions anteriores mantidas. React default no loader SSR corrigido por esModuleInterop; warning useLayoutEffect do harness, componente e client-only. CDP DOM serializado produziu reference chain too long; condicoes booleanas, seletores reais e pagina do gestor sem suposicao main corrigidos. Foco produtivo ao abrir formulario estava antes do commit; efeito com frame/cleanup apos montagem passou na repeticao do fluxo.
Read paths/changelog content-type/quoting de helper corrigidos sem mutacao externa. Warnings existentes de build bundle/mixed imports/node:fs/path, Gradle flatDir e META-INF apksigner registrados. Testes finais passaram; nenhum fixture SQL persistiu, nenhuma rejeicao automatica de aprovacao neste ciclo. Teste fisico Share/teclado TV/ativacao real permanece pendente.
NEXT_GATE_STARTED=NAO.


### C75 ? Harness local (2026-10-11)

Corrigidos caminho antigo de fixture, seletor EPG e quoting do foco D-pad; suposicao fullscreen inicialmente false era invalida diante de restauracao do canal ja selecionado e foi retirada apenas do harness. Browser final6 layouts PASS. Nenhum teste de produto relaxado. Relato posterior de troca Live fechando/reabrindo fullscreen e PiP sera tratado no escopo direto C76; C75 nao certifica continuidade nativa de troca.


### C76 ? Regressao de continuidade Live e harness (2026-10-11)

Relato real invalida qualquer interpretacao de C73 como certificacao fisica da troca: stop/start removiam fullscreen/PlayerView/PiP antes de reabrir. Corrigido lifecycle preservando superficie e C9. Verificacoes locais finais PASS; confirmar dispositivo real permanece pendente. Harness corrigido: window.qa guard na navegacao, seletor de retry inexistente e suposicao de retry para SESSION_LIMIT_REACHED (recuperacao por outra selecao autorizada, sem alterar politica existente). Unmount durante acquire usa barreira explicita, nao janela transitoria30ms. Nenhum teste de produto relaxado.


### C77 ? Cabe?alho mobile e verifica??o (2026-10-11)

Na verifica??o local, o breakpoint600 empilhava engrenagem e status, levando parte do bot?o para fora do cabe?alho. Corrigido header-right flex e texto do status acess?vel recortado visualmente para todo mobile. Captura320 revelou Voltar sobreposto ? engrenagem: em p?ginas internas mobile, o subt?tulo PREBUILT foi omitido para reservar espa?o sem reduzir alvos44px.
Harness tamb?m encontrou bot?es Debug de duas linhas ultrapassando header50px em paisagem; ocorr?ncia pr?-existente em dev, fora dos atalhos de produ??o solicitados. Geometria privada delimitada aos comandos com aria-label; n?o alterou testes de produto, l?gica ou bot?es Debug. Inclu?da verifica??o de sobreposi??o dos comandos de usu?rio. Browser final9 layouts x7 telas PASS; sem bloqueio funcional nesse escopo, valida??o f?sica pendente.

## C78 — correções durante validação, 2026-10-12
SQL fixtures exigiram installation_id explícito. Corrigida colisão PL/pgSQL de variável users com auth.users; prefixo SELF_SERVICE deve ser csrc_, não src_; cast source_id::text estabiliza plano ao alternar MANAGED/SELF_SERVICE no mesmo runtime. TypeScript: tipo reveal importado de control-plane.types e config nullable tratado. Handler Edge passou a reconhecer erros PostgREST estruturados, preservando MANAGER_SCOPE_DENIED sanitizado. Teste privado corrigiu header PowerShell Split e Escape virtual key code; CSS do dialog centralizado e campo XF com moldura própria. Todos os defeitos acima resolvidos e verificação posterior PASS; warnings históricos de build/advisors mantidos, sem expansão de escopo.

## C79 — 2026-10-12 — Corte da tabela resolvido
Causa: colunas nowrap e sete ações inline excediam o painel; corrigido com tabela proporcional, quebra de conteúdo e largura total. No desenvolvimento, patch documental com contexto incorreto não escreveu; seletor Unicode da fixture corrigido para UTF-8; asserção de viewport corrigida para descontar scrollbar vertical. Validação final de nove larguras e build/lock passam. Avisos históricos Vite preservados. Sem bloqueio restante deste patch; nenhuma alteração remota.


## C80 — 2026-10-12 — Cadastro descritivo e vínculo de aparelhos
Teste SELF_SERVICE detectou chk_self_service_single_device ao aumentar capacidade antes da aprovação. Correction migration 20261012060218 reordena aprovação explícita na transação sem relaxar constraint; suíte SQL final PASS. Seletor CSS do harness modal pegava select de origem em vez de principal; corrigido teste e browser PASS. Build TS/Vite e lock PASS; findings SECURITY DEFINER autenticado e RLS sem policy privada são intencionais com auth/escopo e grants restritos testados. Sem bloqueio C80.

## C81 — 2026-10-12 — Submenu de ativação e vínculo com limites
Gerador privado de migration procurava nome v_role no wrapper configurado cujo nome é role_code; corrigida âncora antes da publicação. Primeiro teste de escopo usava capacidade diferente do alvo e recebeu VERSION_CONFLICT corretamente; fixture ajustada aos limites vigentes, assert de escopo preservado e SQL final PASS. Browser submenu, full-capacity bloqueado, stale informativo e notificação PASS. Findings SECURITY DEFINER de gestor autenticado são intencionais, search_path vazio e anon sem execute confirmados. Avisos históricos Vite sem refatoração fora do escopo.

## C82 — 2026-10-12 — Principal, edição exclusiva de telas e conferência manual
C82: duplicação de mensagens durante geração privada detectada pelo TypeScript e corrigida antes do resultado final. Fixtures browser corrigidas: escaping do seletor, motivo obrigatório limpo após sucesso e submit do modal em vez do submenu homônimo. Testes finais PASS. C78 contagem ajustada ao botão de limites removido; C80 SQL anterior sinalizado snapshot de políticas supersedidas, regressão SQL vigente C82 mantém testes de escopo/identidade/cofre/capacidade. Advisors novos são INFO RLS sem policy nas tabelas privadas deny-all e WARN SECURITY DEFINER nas RPCs de gestor com scope/anon-denied demonstrados; detalhes e links na evidência. Nenhum blocker atual. Teste operacional em cliente real não executado.


## C83 — 2026-10-12 — Verificação do editor e da árvore
Resolvidos: geração SQL sem ponto e vírgula no pg_get_functiondef; variável current_role colidia com palavra-chave Postgres, corrigida para v_role_before. Tentativas de DDL falhas revertidas integralmente. Browser detectou cascata nativa de Escape nos dois dialogs: interceptado keydown/preventDefault no modal filho, agora Escape mantém editor pai. Corrigido escaping de seletor somente no harness. Revisão final encontrou necessidade de preservar validador/uniqueness canônicos de nickname self-service; correction migration, mensagem humana e fixtures revertidas aprovadas. SQL/tree/identidade/slots, cliente, browser e build/lock finais PASS. Avisos históricos Vite/advisors não ampliaram escopo; URLs e proteções na evidência C11_LICENSE_EDITOR_FIELDS.md. Nenhum blocker deste ciclo; operação em cliente real não executada.


## C84 — 2026-10-12 — Origem sem dispositivos na tabela
Causa: listagem renderizava licença anterior preservada pelo vínculo mesmo após remoção do seu único aparelho. Corrigida apenas apresentação, ocultando vazio confirmado e permitindo consulta opcional. Nenhuma criação duplicada de licença pelo vínculo. Browser transferência/reload/filtros/legado/revogado/contagem, regressão tabela9, console/build/lock aprovados; nenhum blocker ou falha nova. Avisos Vite históricos mantidos.


## C85 — 2026-10-12 — Editor e visual administrativo
Resolvidos: botão de capacidade sem principal/quantidade/motivo explícitos; TS6133 por variável destinationCode após remoção de saves individuais; controle de expansão excedia coluna em601px, corrigido wrap/estrutura. CLI bare ausente, usado npx Supabase2.120.0 para criação de migration; nome alinhado à versão remota. Leituras pontuais de caminho/glob inválido corrigidas sem escrita fora do workspace. Avisos históricos Vite/advisors sem ampliação de escopo; SQL/backend/browser/build/lock finais PASS. Nenhum blocker aberto deste ciclo. Spec/evidência C11_LICENSE_SCREEN_FORM_FEEDBACK.md; NEXT_GATE_STARTED=NAO.


## C86 — 2026-10-12 — Verificação encerrada
Sem bloqueio funcional. Harness CDP ajustado para Enter com texto CR e leitura de múltiplos IDs aria-describedby. Browser final desktop/mobile, typecheck/build/Activation Lock e regressões C85 PASS. Warning de tamanho do bundle preexistente. Nenhuma entrega física/Git/backend realizada.


## C87 — 2026-10-12 — Verificação de capacidade
Patch inicial não aplicado por contexto escapado; reaplicado com contexto exato. Harness corrigiu espera de salvamento assíncrono e quoting de seletor. SQL teste acusou variável devices ambígua; renomeada fixture_devices, teste final BEGIN/ROLLBACK PASS e zero fixtures remanescentes. Build normal exclui Gestor por flag de debug: compilação privada com VITE_DEBUG_BUILD=true acrescentada. Warning de tamanho de bundle preexistente. Sem alteração real de cliente/backend/Git/APK.


## C88 — 2026-10-12 — Bloqueio de principal de origem resolvido
Regressão funcional relatada após C87: pagamento/quantidade na origem não classificada continuavam no lote enquanto dispositivo era movido para principal externo com slot5 livre. Corrigido no contexto do editor; SQL existente suporta devices sem screens. Browser desktop/mobile, TypeScript, SQL transacional e regressões PASS. Nenhuma alteração real de cliente/backend/Git/APK; warning de bundle preexistente.

## C89 — Solicitação apagada e mensagem genérica — 2026-10-12

Defeito de cliente corrigido: resposta explícita ACTIVATION_NOT_FOUND interrompia
registro perpetuamente. Mensagem específica do Manager adicionada. SQL rollback,
26 testes e browser sintético aprovados. Primeiro build bloqueado pelo marcador
histórico de 22 casos; emenda prévia reforçou exigência para 26, sem relaxar lock.
Build posterior com hook aprovado. APK antigo não foi alterado/instalado; causa
no estado privado físico não instrumentada. O cadastro real segue ausente e
aguarda nova solicitação do aplicativo e conclusão autorizada da ativação.
[Evidência](evidence/C11_DELETED_DEVICE_ACTIVATION_RECOVERY.md).

## C90 — Verificação e limites de atualização — 2026-10-12

Resolvidos no ciclo: quoting inválido de um comando Node/PowerShell (sem execução
ou edição); JAVA_HOME inicial inexistente (compilação feita com JDK21 instalado);
import React unused (typecheck depois PASS); nova ação de auditoria rejeitada
pelo check antigo (migration complementar preserva valores existentes; SQL
rollback depois PASS); fixture Vite ignorada em tmp conservou módulo antigo
(cache-busting privado; browser posterior PASS). Patch de fixture com contexto
não encontrado reaplicado corretamente, sem alteração de produção nesse erro.

Lint global Android FAIL:138erros/103avisos. Auditoria hash comprova todos os138
em arquivos inalterados desde baseline C90, zero erros em updater. Inclui NewApi
no ArtworkCache anterior e incompatibilidade de metadata Kotlin Cast anterior.
Não corrigir/suprimir/refatorar fora do escopo. Quatro avisos ApplySharedPref
novos são persistência commit intencional em worker. Build/JVM/assemble/lock
PASS não afirmam lint global aprovado. Instalação/JobScheduler/PackageManager em
aparelho físico pendentes; APK14 é artefato de validação, não homologação física.
[Evidência](evidence/C11_APP_UPDATE_MIRRORS.md).

## C91 — Ajustes de fixture e limites físicos — 2026-10-12

Descoberta inicial usou nome inexistente C11_HOME_HERO.md; rg localizou os
contratos reais. Harness ajustou split/UTF8 PowerShell, escapes de seletores,
duplicação de módulos por query Vite e leitura/clique separados durante lote
assíncrono. Preferência reduced-motion real do Windows foi respeitada pelo
componente e testada separadamente com emulação. Execução final PASS nos seis
casos, timeout real10s, Home mista e empty, zero erros browser.

Foco inicial em ação do hero impediria autoplay: corrigido no overview para
main e contorno somente não interativo removido. Nenhuma preferência do
usuário, teste consolidado ou invariância de ativação relaxada.
Build/assemble/six JVM/assinatura/asset check PASS; lint globalC90 não homologado
permanece limite anterior, sem repetir/refatorar arquivos fora do escopo.
Publicação15 e teste físico do download/instalação/hero permanecem pendentes;
nenhum dispositivo conectado/instalado ou dado real alterado neste ciclo.
[Evidência](evidence/C11_BROWSE_DYNAMIC_HERO.md).

## C92 — Verificação de gestos e limites — 2026-10-12

Primeira execução detectou cancelamento pelo lostpointercapture propagado do
filho quando a captura passava ao root. Corrigido para perda no próprio root;
execução final PASS nos seis casos e toque/D-pad/lote/timer real. Busca do nome
privado antigo de APK15 não o localizou: versão15 disponível como
upload-verified-15.apk, validada pelo hash/certificado original; sem alteração
ou restauração artificial do arquivo anterior. Typecheck/build/lock/APK/seis
JVM PASS. Lint amplo Android mantém pendência pré-existente C90, não homologado.
Modelos de Canais têm conteúdo ilustrativo; implementação requer escolha do
usuário. Instalação física/upload/publicação16 pendentes; nenhum dado real
alterado. [Evidência](evidence/C11_HERO_SWIPE_DOTS.md).

## C93 — Ocorrências e limites da validação square — 2026-10-12

Seletores CSS iniciais sem prefixo live-preview e conflito das regras mobile
em600px corrigidos; teste final sem overflow. Harness privado exigiu corrigir
serialização de referência DOM, escaping de selector, nomes left/top dos bounds,
texto de retry e cache de tmp via módulos/HTML novos. Não houve relaxamento de
invariantes/testes normativos. Retomada consultou histórico read-only antes de
reconfirmar o clone ativo; nenhuma escrita/build no histórico. Execução final
browser/typecheck/build/lock/seis JVM/assets/signer PASS. Avisos de build já
conhecidos permanecem; lint amplo Android de C90 não foi homologado. Sem teste
físico no dobrável, instalação ou publicação. [Evidência](evidence/C11_SQUARE_LIVE_LAYOUT.md).

## C94 — Hero: modelo sobreposto preservado — 2026-10-12
Emenda explícita rejeitou metadados fora da capa. Restaurado tamanho anterior
mobile2:3, capa contain e sobreposição do gradiente; Assistir/Ver detalhes e
dots compactos dentro do hero. Browser12 formatos/casos, timer10s real, swipe,
foco, ações, erro/retry, typecheck, regressões Home/Browse e lock PASS.
APK18 não gerado: análise de reprodução priorizada antes do empacotamento.
Diagnóstico somente leitura identificou tablet XF-JNQK-NZ77 com fonte local
antiga src_w9kb47u3efcvrqnj promovida11h15; banco aponta para fonte nova
src_87kbpy51ws9nnz6d desde18h21. Transferência dos outros dois aplicada no banco.
Motivo da persistência local e playback da fonte nova ainda não certificados;
sem alteração de fonte/banco/aparelho. Evidências privadas e relatório em
[evidência C94](evidence/C11_HERO_COMPACT_ACTIONS.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/instalação/publicação.
## C95 — Fonte reconciliada e Live recuperado no tablet — 2026-10-12
Pedido explícito de correção em tempo real no tablet XF-JNQK-NZ77. Retorno ao
Início e coordenador canônico concluíram importação/promoção da fonte atual,
snapshot snap-mv5s8v3o, sem editar manualmente pointer/cofre ou instalar APK.
Sincronização física284363ms; antigo catálogo permanecia durante processamento.
GLOBO SP FHD reproduzindo confirmado por evento nativo e screenshot físico.
BAND NEWS FHD permanece com falha403/404 da origem. Provedor informa conta
Active/auth1, limite2 simultâneas e1 ativa, enquanto licença local permite8;
não foi provado excesso na falha original e não se alterou cota/banco.
Hashes identidade/chave/ativação/instalação preservados. C94 visual mantida,
APK18 adiado; nenhuma alteração funcional de código/Git/backend/outro aparelho.
[Evidência C95](evidence/C11_TABLET_SOURCE_RECONCILIATION.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
## C96 — APK1.0.18 para teste de UI — 2026-10-12
Retomado empacotamento autorizado após usuário confirmar BAND NEWS SD; demais
problemas adiados. Hero sobreposto/Assistir/dots compactos/swipe10s e Live square
incluídos, sem patch funcional adicional. Build/lock/Capcopy/assemble/6 JVM,
regressões UI, sete assets, package18 e assinatura igual ao17 PASS.
APK11086375bytes, SHA256
5bb8c0273f58cc9bf800367658d08ec5c7de31ad3eed50b63a74e8a85c8c506e.
Arquivo tmp/c96-ui-apk18/Xandeflix-v1.0.18-ui.apk; dados-publicacao.txt disponível.
[Evidência C96](evidence/C11_UI_APK18_DELIVERY.md). Sem instalação/publicação/
backend/Git. UI física do APK18 pendente de teste do usuário.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
## C97 ? Acesso localhost ao gestor ? 2026-10-13
Vite escutava3000, mas HTTP expirava; rein?cio simples insuficiente. Perfil CPU
identificou cria??o massiva de FSWatchers; tmp tinha73518 arquivos medidos.
Patch m?nimo vite.config.ts ignora tmp no watcher e limita optimizeDeps a index.html.
Servidor normal ativo3000; quinze HTTP200,301 imports sem falhas, lock antes/depois PASS.
Navegador CUA indispon?vel: login/renderiza??o f?sica n?o certificados; recarregar aba.
[Evid?ncia](evidence/C11_LOCAL_DEV_SERVER_RECOVERY.md). Sem APK/Git/backend/dispositivos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C98 ? Limpeza seletiva de tmp ? 2026-10-13
Removidos163 perfis ef?meros de navegador sem uso,68906 arquivos,4803565330bytes
(4.47GiB). tmp posterior4086061675bytes (~3.81GiB),23392 arquivos. Zero falhas.
Hashes de23384 arquivos preservados, incluindo46 APKs, PASS. Backup da migra??o,
relat?rios, scripts, snapshots e dados privados preservados. Servidor3000 segue200.
[Evid?ncia](evidence/C11_TEMP_ARTIFACT_CLEANUP.md). Sem patch funcional/APK/Git/
backend/dispositivos; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C99 — Sincronização GitHub autorizada e validada — 2026-10-13
Pedido explícito autoriza commit/push main em xandeflix2/xandeflix-prebuilt.
Fetch inicial confirmou local/remoto61ec009, sem divergência. Código C11/UI18,
gestor, Android e testes/documentos revisados; arquivos privados/IDE/diagnósticos
permanecem locais e ignorados. Build/prebuild lock,30 regressões e178 JVM PASS;
APK18/hash preservado. Seis harnesses legados atualizados para interfaces já
aprovadas, sem patch funcional. Falhas iniciais e correções em evidência C99.
[Evidência](evidence/C11_GITHUB_SYNCHRONIZATION_20261013.md).
Envio pendente até confirmação do push; sem backend/deploy/instalação/PR.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=SIM;
GIT_PUSH_AUTHORIZED=SIM.

## C99 — Código publicado e remoto confirmado — 2026-10-13
Commit0bf9471019114b8c3ce74751ce3b6b8ec7d97494 publicou500 arquivos C11
em xandeflix2/xandeflix-prebuilt/main, push normal e ls-remote idêntico ao HEAD.
Build/lock,30 regressões e178 JVM PASS; APK18/env/privados preservados.
Auditoria final de staging/proveniência PASS, sem arquivo fora da allowlist;
harness de staging corrigido após inventário parcial worktree/index, sem reset.
Este complemento registra confirmação observada após o envio do código.
[Evidência](evidence/C11_GITHUB_SYNCHRONIZATION_20261013.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem backend/deploy/instalação/PR.

## C100 — Duplo toque/clique lateral no player VOD — 2026-10-13
Implementado localmente no player Android: direita+10s/esquerda−10s, toque
simples mantém controles. Gestos somente na imagem; widgets/arraste/multitouch/
lock/diálogos/transição/Cast/PiP preservados. Seek limitado e sem play/pause.
Compilação XML/Java e191 JVM (13 novos), quatro regressões e lock PASS.
Interfaces próprias preservam compatibilidade do novo caminho com API23.
[Evidência](evidence/C11_VOD_DOUBLE_TAP_SEEK.md). APK18/HEAD preservados; validação
física depende do próximo APK. Sem build APK/instalação/Git/backend.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C101 — APK19 instalado no Fire Stick — 2026-10-13
Pedido explícito de instalação no192.168.3.101; Amazon AFTSSS/API28 atualizado
via install -r de code13 para19/name1.0.19, mesma assinatura. Build produção,
sete assets/config/Dex,191 JVM/33 suites e lock PASS. Implementação C100 incluída;
APK18 e HEAD preservados. Falha inicial de espaço resolvida removendo apenas
~23MiB de cache reconstruível do próprio Xandeflix; não houve reset/uninstall.
Cinco privados de cadastro/ativação/token e1603 arquivos de catálogo iguais em
RAM antes/depois, UID/firstInstallTime originais e hash do APK instalado iguais.
App não aberto; validação física de UI/reprodução/gesto permanece com usuário.
Erros operacionais de quoting/patch documental corrigidos sem mudar testes.
[Evidência](evidence/C11_FIRESTICK_APK19_INSTALL.md). Artefato recuperável local
tmp/c101-firestick-apk19/Xandeflix-v1.0.19-duplo-toque.apk. Nenhum outro aparelho,
backend ou Git operado. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C102 — Diagnóstico de armazenamento no Fire Stick — 2026-10-13
Consumo alto confirmado em files/prebuilt, anterior ao update APK19: seis
gerações completas (~204MiB cada) e três staging antigos (~326MiB). Ativo e
fallback somam408MiB; quatro gerações não referenciadas815MiB. Excesso candidato
~1,20GB decimal, sem apagar nada. Novo staging crescente durante medição deve
ser protegido como importação em andamento; medidas ao vivo variam.
Código não poda gerações antigas e limpa somente staging do candidato atual;
erros de limpeza ignorados/processo interrompido podem deixar temporários.
Métrica interna totalAppDataBytes não contabiliza históricos/resíduos.
Defeito de retenção/limpeza permanece pendente, diagnóstico concluído.
Correção futura deve proteger ativo/recovery/leitores/job e identidade/ativação,
validar integridade e repetir ponteiros antes de remover candidatos.
[Evidência](evidence/C11_FIRESTICK_STORAGE_DIAGNOSIS.md). Sem patch funcional,
testes/build/limpeza/instalação/backend/Git. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C103 — Limpeza e reinstalação física — 2026-10-13
Pedido explícito executado no Fire Stick AFTSSS e tablet SM-X610: limpar
gerações obsoletas/staging/cache e reinstall -r APK19, preservando cadastro.
Fire liberou1195960KiB (~1,22GB), restante417636KiB (~408MiB); tablet liberou
2499469KiB (~2,56GB), restante458082KiB (~447MiB), somente catálogos medidos.
Preservados ativo/recovery,412/452 segmentos declarados e422/462 arquivos,
cinco privados de identidade/ativação/token em cada aparelho, UID e datas.
Assinatura/lock PASS; instalados APKs idênticos ao artefato19. Nenhum reset,
uninstall ou troca de fonte; app não aberto automaticamente, UI/gesto pendentes.
Celular192.168.3.109 pareado, aguardando porta de conexão; sem limpeza/instalação
nesse alvo até conexão/identificação. Retenção automática ainda pendente C102.
[Evidência](evidence/C11_DEVICE_CATALOG_CLEANUP_AND_REINSTALL.md). Sem código
funcional/build/backend/Git. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C104 — Transporte progressivo e teste limpo — 2026-10-14

Correção autorizada e especificada antes do código em
[C11_PROGRESSIVE_SOURCE_DOWNLOAD](architecture/C11_PROGRESSIVE_SOURCE_DOWNLOAD.md).
Primeira importação lê bytes enquanto baixa; C60 mantém digest antecipado e
evita parse de conteúdo inalterado. Unicode/digest byte-exatos, EOF/falhas/
cancelamento fail-closed, deadline15min; promoção e autoridade preservadas.
Lock26+27+9,196 JVM/33 suites,8 integrações progressivas,19 C60,83 bounded,
transporte/retensão/TypeScript/build/assemble PASS. Harness legado de
observabilidade falha também em HEAD (linha9MiB não capturada), sem alteração.
APK de teste19-C104/hash3bf889d8...e640d instalado-r e ponte real verificada:
primeiros bytes253ms antes do EOF, pendência/falha/cancelamento/limpeza PASS.
Depois usuário pediu instalação do zero: uninstall/install autorizado somente
no Fire AFTSS G071CQ070344374G; sem dados restaurados e usuário ativou pelo painel.
App7917ms, shell11755ms; parser5,8s e primeiro batch9,6s após fetch real.
Catálogo/Home/hero/capas completos ainda em medição. APK antigo19 concluiu
após~40min de download/~3m32s de parse/promoção; diagnóstico inicial de EOF
travado superseded por crescimento do arquivo e promoção posterior.
[Evidência C104](evidence/C11_PROGRESSIVE_SOURCE_DOWNLOAD.md). Sem Git/backend/
troca de fonte/código de UI/player/ativação; CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C104; NEXT_GATE_STARTED=NAO.

## C105 — limites e correções observados — 2026-10-14

- Home90s pendente: primeiro boot limpo levou144,5s até hero/8 capas decodificadas,
  sem espera humana; inventário promovido em119,4s. Lista de séries da fonte
  mediu93,9s num probe, contra6s anterior. Nenhuma promoção/índice parcial é
  permitido; API incompatível segue M3U legado sem certificar90s.
- Busca Live antes incluía somente header100; corrigida ingestão de segmentos
  completos e rebuild de índice DIRECTORY_ROOTS incompleto. Último canal real
  encontrado/selecionado; frames de filme/episódio não certificados nesse QA.
- JSON oversized deixava body web aberto após reader.releaseLock; corrigido
  cleanup real e testado com stream que só encerra no cancelamento.
- Fixture inicial de geometria omitia cabeçalho de Filmes/Séries. Fire físico
  excedia540px; CSS reserva64px nessas páginas e hero final cabe na viewport.
  Tablet mantém tamanho anterior; verificação de indicadores relativa ao hero
  não significa que hero inteiro cabe na primeira viewport de cada página.
- Rolagem contínua isolada passou, mas integração real voltava ao topo quando
  chegava seed inicial. Reposicionamento agora só busca distante/ação explícita,
  com grupo atual; guard real/browser tardio e Fire234 canais posteriores PASS.
- Harness legado boot T2 sem classificationProfileVersion e observabilidade
  M3U_LINE_TOO_LARGE falham também em HEAD, sem relaxação. Referências de scripts
  inexistentes não tratadas como PASS. Suites atuais/lock/build PASS.
- Tablet inicialmente inacessível por redes diferentes; conexão resolvida após
  PC entrar no Wi-Fi. Celular saiu do USB após APK intermediário; instalação
  final aguardou reconexão; usuário reconectou e install-r/hash/dados PASS.
  Rolagem/filtro/D-pad de234 canais PASS posteriormente nos três aparelhos.
- Detalhes de episódios sob demanda somente em RAM; não prometer persistência
  após fechar processo. Cache de imagens em disco tem limite/expiração/evicção
  pelo Android. Retenção de snapshots históricos C102 continua pendente.

Evidência: evidence/C11_FAST_HOME_ON_DEMAND_CONTENT.md. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C105_UI_INSTALLED; NEXT_GATE_STARTED=NAO; Git/backend sem escrita.

## 2026-10-14 — C106_FIRE_AUTOPLAY_FONT_AND_LIVE_EXIT_CORRECTED

C105 real mantinha destaque11,5s com foco Assistir; timer agora ignora foco/
hover standby só Fire e não reinicia com nova arte. QA3 páginas Fire PASS.
Canais13,6px/Categorias10px passaram10/10, sem aumentar Categorias. Cleanup
Live antes aguardava Cast/start depois de Home montar; route guard cancela e
aguarda stop confirmado, NativePlayerView GONE antes de release. Resposta
stopPreview antiga omitira accepted; corrigida e ID stale rejeitado. Três
transições reais confirmaram ordem stop→Home, sem afirmar filmagem de frames.

Build detectou fechamento extra TS1128; corrigido. Mock antigo ganhou apenas
useLayoutEffect. Falhas auxiliares de quoting/PID precoce corrigidas por
helpers/consulta posterior; celular bloqueado aguardou desbloqueio do usuário.
Harness inicial de toque/medição capturava Fiber/nó antigo e ponto coberto pelo
cabeçalho; reler após layout/hit test/estabilização resolveu, sem patch funcional
extra ou relaxação de assertions. QA final toque→mesmo conteúdo3 páginas e
swipe nos dois touch PASS; moldura rasterizada fracionária acompanha zoom CSS.
JVM197/lock/TypeScript/regressões/assinatura/assets/install-r/preservação PASS.
APK C106e0ff71de... instalado três alvos, evidência C11_HERO_ARTWORK_DETAILS_TAP.md.
Home90s, playback filme/episódio e retenção C102 continuam pendentes. Nenhum
Git/backend/reset/publicação/novo Gate. CURRENT_LOCAL_CYCLE=C106_UI_INSTALLED.

## 2026-10-14 — C100_C106_GIT_PUSH_VERIFIED

Nenhum bloqueio de commit/autenticação/push: consolidação66b6c90445456cf15ad7fd7ab79ea2a6acbec4c8
enviada e SHA remoto confirmado. Auditoria sanitizada sem achados; lock e16
testes C106 PASS. Helper inicialmente classificou build.gradle como artefato;
regex de boundary corrigida antes do staging. Diretório default de hooks
ausente, confirmado sem criação/bypass. diff-check documental apontou hard-
break Markdown/EOF já existentes; mantidos como evidência histórica, runtime/
testes/Android sem problemas de whitespace. Mensagem PowerShell levou BOM,
sem efeito no código; próximas mensagens UTF-8 sem BOM, histórico sem amend.
Proveniência/artefato/privados mantidos, registro final apenas documental.
Home90s/playback VOD/retenção C102 seguem pendentes; envio Git não os resolve.
[Comprovante](evidence/C11_C100_C106_GIT_PUBLICATION.md).

## 2026-10-14 — C107_UI_REFINEMENTS_AND_RECOVERABLE_APK

Primeiro fundo elíptico escuro rejeitado pelo usuário; substituído por nuvem
radial única.52/.38/.18→0, sem certificar contraste5,9 do candidato rejeitado.
QA revelou background preso à caixa de scroll: attachment local e limite com
scrollTop corrigiram halo; raster13 contextos termina rgb(8,12,20) sem seam.
Disponibilidade inicialmente exibida por modo duplicava logos entre grupos;
usuário pediu só logos, dedupe por ID/URI/nome e créditos fora da capa. Selo
de categoria inicialmente azul foi revisto para transparente explicitamente.

TypeScript apontou imports React usados apenas implicitamente no harness e
wrapper openLivePanel sem chamada após remover botão; tipos React explícitos
e remoção somente do wrapper/import mortos corrigiram build. Sync de artefato
anterior não constituiu entrega: build completo/sync/Gradle e comparação de
sete assets byte a byte repetidos. Nenhum lock/teste canônico relaxado.

Helpers tiveram falhas de quoting/BOM/patch context e consulta DOM durante
transição; corrigidos sem alterar dados. CDP Promise was collected em espera
RAF foi substituído por sondagem síncrona entre eventos normais. Escapes de
regex em string do probe causaram falso prefixo; probe corrigido, normalizador
de produção/testes de prefixo já correto. Foco D-pad exigiu aguardar prontidão.
Offset horizontal exato não se mantém quando seed existente reordena cards;
QA exige mesma linha/card inteiro visível, e offset exato com ordem estável
continua passando. Não foi congelada ordenação ou ampliada biblioteca em RAM.

54 grupos novos, regressões touch/autoplay/Live16 e lock26+27+9 PASS; artefato
final/instalações/QA sanitizados em evidence/C11_FIRE_HERO_FILL_AND_LOCAL_CONTRAST.md.
Home90s, reprodução VOD e retenção C102 permanecem pendentes; UI/metadados não
os certificam. Sem Git/backend/reset/publicação/novo Gate.

Revisão posterior: ID/URI/nome iguais não cobriam Amazon Prime Video, variante
with Ads e Amazon Video com logos/IDs distintos. Dedupe de apresentação agora
agrupa aliases explícitos, prefere serviço base e conserva marcas diferentes;
fixture três Prime + Globoplay => duas logos e QA Grimm no Fire confirmados.
Cabeçalho Filmes/Séries estava oculto apenas TV; ampliado tablet/quase quadrado,
sem remover Voltar touch. Selo de categoria/dir público estendido a filmes.

Grimm sem episódios foi reproduzido no Fire: DIRECTORY_JSON_FETCH_FAILED;
transporte nativo recebeu HTTP_STATUS_ERROR/4XX, GET diagnóstico autorizado
confirmou HTTP404 sem dados de episódios. Sem mudança de source/reader/C9,
sem fabricar episódios TMDB ou usar cache stale. Falha da fonte permanece
aberta; patch visual não a resolve. Diagnóstico apenas RAM/flags/contagens,
wrappers restaurados e sem exportar URLs/corpo/credenciais/catálogo.
Probe privado inicialmente exigiu selo em filme cuja categoria era ausente/
Geral; expectativa corrigida para conferir presença contra dado local, sem
relaxar teste funcional (filmes Netflix/Prime e categorias vazias testados).

Auditoria privada de empacotamento inicialmente contou todos os arquivos public
como se fossem apenas os sete de dist. Capacitor adiciona cordova.js e
cordova_plugins.js vazios: ambos foram nominalmente conferidos com zero bytes,
além dos sete assets exatos; nenhum arquivo desconhecido permitido. Ajuste
somente do helper, sem alterar APK/runtime ou testes canônicos. Tentativa de
listar ZIP por node inline falhou por quoting PowerShell; leitura .NET e
helper em arquivo evitaram interpolação, sem dados sensíveis na saída.

## 2026-10-14 — C107, Voltar sobre hero tablet/quase quadrado

Usuário relata regressão após ocultar cabeçalhos: Voltar permanecia absolute
no side-nav, usando a área antes ocupada por título/contagem. Tablet USB
1365x775 confirmou interseção2486,91px² e botão terminando29,27px dentro do hero
em Filmes/Séries. QA anterior conferia presença/hit/viewport, não interseção;
não constitui evidência de ausência dessa sobreposição (latest regression wins).

Matriz antes do patch, com políticas puras de layout e AppShell/Header reais,
reproduziu oito sobreposições: tablet e dobrável configurado TABLET em paisagem,
Filmes/Séries raiz/categoria. PHONE dobrável usa Back no Header e não reproduziu;
tablet retrato/celular/TV não sobrepunham. Correção mínima: classe browse na row
atual e posição no fluxo somente tablet/quase quadrado não-TV, reservando altura
e8px antes do main.60 casos após o patch sem interseção/hit bloqueado, incluindo
categorias ausentes, duas orientações dobráveis PHONE/TABLET, celular e TV.
Sem Z Fold físico conectado; simulação responsiva não é teste desse hardware.

## 2026-10-14 — C107, faixa Voltar/pending logo/Ver todos Android TV

Faixa nova do Voltar estava sobre fundo padrão, pois o gradiente começava
somente no main. Row permanece transparente e no fluxo, com camada não
interativa atrás herdando a mesma --navigation-ambient do hero; raster com
duas paletas confirma continuidade ao main e fundo escuro após hero, sem
trocar hook/canvas ou ampliar coloração nas categorias.

Usuário rejeita nome antes da logo: fallback textual anterior foi supersedido
explicitamente. Selo agora não mostra texto durante espera/erro/ausência;
imagem só visível depois de onLoad da URI atual, nome em alt/aria/title apenas.
Ver todos menor solicitado somente Fire/Android TV:12px/36px/padding6x10,
classe Android TV derivada da decisão TV existente + UA Android, sem mudar
detector. Tablet/celular/Tizen/webOS conservam medidas anteriores.

Fixture privado de foco inicialmente consultava sombra sem foco de documento
headless; espera de transição sozinha não bastou. Focus emulation explícita
no navegador resolveu sem alterar CSS/foco do produto. Fixture de quatro
rotas também precisava stub CastButton para renderizar detalhe tablet; stub
isolado adicionado, sem editar implementação Cast ou relaxar critérios.
28 casos de Ver todos/foco e12 raster/paletas PASS; matriz60 sem interseção,
regressões de plataforma10/metadados11/halo7 e lock/build PASS. Sync/Gradle/
instalação dependem de término bem-sucedido; build não equivale a entrega.

Novo pedido após build intermediário bdee7b99 exigiu remover selo de tipo das
capas; tablet já havia recebido esse candidato-r preservando dados, demais
alvos ainda não. Candidato preservado e novo build acumulado iniciado, sem
apagar dados nem declarar intermediário final. Remoção de um div MediaCard,
quatro checks sintéticos de ausência/poster/acessibilidade/ações PASS. Nenhum
Top10/ranking novo iniciado. Próxima verificação física usa APK final nos três.

Probe físico encontrou altura40.0000038px em vez de40px por precisão WebView;
expectativa privada ajustada para tolerância geométrica0,01px, mantendo tamanho
alvo e fonte exatos. Sem mudança de produto para aceitar erro do helper.
Tablet final f769d1fc confirmado: faixa transparente/paleta igual ao topo,
sem sobreposição, sem nome/alt visível antes da logo, zero selos de tipo.

Usuário mudou celular para Wi-Fi. Pair ADB falhou com protocol fault, sondas
TCP de pairing e conexão deram timeout. Host só apresentava Ethernet IPv4;
celular não estava mais no ADB USB. Rede/IP/portas atuais solicitados ao usuário,
sem fallback USB ou modo TCP5555. Não interpretar APK pronto como instalação
do celular: manter entrega desse alvo pendente até conectividade/validação.
Código transitório de pareamento não registrado neste documento/relatórios.
Usuário respondeu depois para deixar celular para atualização pelo APK gerado.
Isso encerra tentativas remotas por escolha dele: entregar arquivo manual e
não marcar instalação do celular como feita. Tablet/Fire atualizados e QA
final aprovados; sem novo bloqueio de código, sem fallback USB ou updater.
## C108 — apresentação inicial e investigação internacional — 2026-10-14

Animação Fire podia cobrir Home já exibida: efeito passivo incondicional,
observação tardia do perfil e repetição por snapshot. Corrigida a decisão antes
do paint, com reserva curta/omissão rápida e uma apresentação por documento.
Regressões e build/APK verificados; detalhes em evidence/C11_STARTUP_PRESENTATION_ORDER.md.
Fixture adicionada de deadline20s inicialmente não observou o final porque o
registro limitado a600 frames acabava perto de10s; ampliar somente coleta para
1800 frames, mantendo critérios e deadline. Reexecução final13 cenários PASS.

Entrega física bloqueada pelo ADB: Fire desapareceu antes da verificação de
modelo (nenhum install/force-stop executado); após reconexão aparece USB mas
offline na depuração. Usuário escolheu instalar manualmente; instalação remota
encerrada sem modificar o Fire. Tablet conectado, fora do alvo deste ajuste;
celular manual por escolha do usuário. QA física de ordem permanece não validada.

Itália: usuário confirma que todos os conteúdos falham. Sem modelo/XF/bundle
ou diagnóstico da tentativa, causa não confirmada e não corrigida. Nenhuma
regra de país encontrada no caminho de reprodução revisado; isso não valida
liberação do provedor no exterior. Não atribuir o HTTP401 histórico a esse
aparelho. evidence/C11_INTERNATIONAL_PLAYBACK_INVESTIGATION.md registra
inspeção, testes sintéticos8+12 e dados pendentes. Sem alterar fonte/player,
DNS/TLS/backend/licença/ativação. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C109 — exclusão no gestor e limites de verificação — 2026-10-15

Confirmados lixeira por customerId (ausente no LEGACY MANAGED) e entrada antiga
para cliente inteiro em vez de aparelho. Corrigida exclusão individual por
código usando RPC MASTER existente, sem remover guardas de conta administrativa.
Causa específica do erro de preview de XF-4PNM-CD8C ainda não confirmada: MCP
get_project/SELECT negados, sem navegador conectado no CUA. Nenhuma alteração
remota nem tentativa de contornar permissão. Usuário deve confirmar a exclusão
no próprio painel; testes não removem dados reais.
Falhas locais resolvidas: PowerShell5 OutputEncoding ASCII corrompeu acentos do
bloco novo enviado por pipeline; reparado por apply_patch UTF-8 e validado no
browser. Fixture esbuild precisou de outdir para CSS, corrigido sem alterar
asserções/critério.14 cenários C109, regressões e build/lock PASS. Fonte/cofre,
RLS, licenças, identidade e conta administrativa preservados. Evidência em
C11_MANAGER_DEVICE_DELETE_SCOPE; investigação Itália continua separada.

## Levantamento de apresentação por dispositivo — 2026-10-15

Escopo solicitado: inventariar opções da primeira tela e adaptações existentes,
sem alterar UI, ativação, identidade ou gerar APK. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Leitura no clone C11 ativo, main,
HEAD 0f68f169f7728fae17c8311832b7643629e97a02 e origin canônico confirmados.
Testes existentes: square-live-layout 18/18 PASS e landscape-navigation
18 casos, overrides e hook real PASS. Device-presentation passa os dois
primeiros grupos (três escolhas persistidas/identidade e storage/subscrição),
mas termina com AssertionError na asserção textual que exige
`const phone = usePhoneLayout` em HomeHero.tsx. O código atual usa
`const phone = useHeroLayout()`, cujo retorno considera usePhoneLayout,
orientação e squareLive. Portanto, essa asserção está desatualizada; o script
completo NÃO passou e sua verificação final ficou incompleta. Nenhum teste
foi relaxado/alterado e nenhuma conclusão de regressão visual foi atribuída
ao aparelho Google TV sem diagnóstico do dispositivo. Pendência registrada
durante o levantamento; somente este registro documental foi acrescentado.

## C110 — seleção em duas etapas e pendências do levantamento — 2026-10-15

A asserção antiga em test-c11-device-presentation foi atualizada para exigir
a composição real HomeHero→useHeroLayout→usePhoneLayout/orientação/square,
sem remover critério de identificação. Script completo agora PASS. Fixture
C106 precisou fornecer o novo import da apresentação real ao carrossel;
TypeError de import ausente resolvido no loader, oito casos originais PASS.
Suite antiga home-hero também tinha stubs ausentes para logos/WatchProviders
adicionados em C107; completados sem remover asserções, suite completa PASS,
com logos verificadas pela própria suíte C107/10 cenários.

Primeira fixture C110 tentou validar retorno ao botão sem focar o trigger
antes de chamar click() programático. Corrigida simulação para focus+click,
como interação de teclado/mouse; critério de retorno mantido e PASS. Revisão
visual em960x540 mostrou Voltar abaixo da área útil; compactados somente os
cartões da subetapa em telas baixas. Regra global de densidade reduzia ações;
override local garante44px, teste confirma retorno visível. Fixture esbuild
recebe ambiente import.meta vazio, sem segredos nem rede externa.

Verificação final: C110/11 grupos, regressões, typecheck/build e lock26+27+9
PASS. Sem defeito funcional pendente observado neste fluxo; QA física não
executada. Sem APK novo/install/backend/Git. C108 anterior preservado;
diagnóstico Itália e exclusões reais permanecem tarefas independentes.

Auditoria adicional: forçar core.autocrlf=false no diff de arquivos Windows
produziu falsos avisos de whitespace por CRLF, sem modificar arquivos.
Reexecução com a configuração normal do repositório: git diff --check PASS.

## C111 — tela exclusiva e harness — 2026-10-15

TypeScript detectou safeLogo nullable no observador opcional; normalizado
para undefined sem alterar o objeto de filme. Novo backdrop tinha import
React não utilizado; removido. Fixtures anteriores precisaram receber o
componente compartilhado, portal e atributos de isolamento do shell.
Esbuild passou a gerar outdir para CSS e import.meta.env vazio de fixture;
normalização de caminho Windows impediu incluir autoridades reais no teste.
Asserções C108/limites/foco/deadline não foram removidas nem reduzidas.

No teste App, body.textContent incluía script inline e gerava falso achado
do sentinel; consulta limitada ao root visível. CDP recebeu Boolean em
expressões de espera para não serializar referências DOM. Teste da rotação
falhou porque o Windows preferia reduzir movimento: estado real confirmou
reduced=true, comportamento estático correto. Fixture agora escolhe
no-preference para testar rotação e reduce explicitamente para a pausa.
Código de produção continua respeitando preferência do usuário.

Reexecução final C111/9, C108/13, preparo/4, importação/83, C110/11,
elegibilidade do hero, build/lock26+27+9 PASS. Nenhum desses resultados
certifica tempo de primeira carga física ou playback remoto.
ADB não estava no PATH; usado SDK local, sem instalar dependências. Celular
descoberto via mDNS e autorizado. Tablet com porta de pareamento anunciada,
porém IP sem alcance TCP/ARP; novos dados solicitados, instalação pendente.

Atualização final: novas tentativas do tablet mantiveram protocol fault e
IP sem alcance; usuário escolheu instalar manualmente o APK C111, encerradas
tentativas sem install/reset no tablet. Celular install-r por Wi-Fi PASS:
45 privados/UID/firstInstallTime e hash do APK preservados/verificados,
Home/hero/capas reais conferidos após abrir. Empacotamento/Gradle/assinatura,
7 assets e lock final26+27+9 PASS. Nenhuma falha técnica de C111 pendente;
primeira carga física continua não certificada, tablet manual não confirmado.

## C112 — restrição de conexão e suporte CH+/− — 2026-10-15

Inspeção encontrou ausência de mapeamento explícito CHANNEL_UP/DOWN apesar
de existirem Anterior/Próximo na UI. Corrigido com guards/reuso de ações;
harness real Java, C73/7, C106/8, JUnit26/5, lock/Gradle/APK PASS. Nenhum teste
reduzido ou falha técnica pendente observada. Avisos flatDir/deprecated
anteriores mantidos. QA com controle físico ainda não executada.

Limite informado pelo usuário: uma conexão da fonte. Pré-buffer de canais
vizinhos concorrente com canal ativo não é compatível com esse limite;
funcionalidade não implementada, sem abrir streams adicionais ou alterar
buffer/autorização. Não confundir teclas CH+/− implementadas com preload.
APK C112 gerado e validado, sem instalação remota neste ciclo; C111 intacto.

## C114 — foco Live e controle circular — 2026-10-15

Relato: Back do fullscreen não devolvia foco ao canal ativo. Restaurado foco
nativo/DOM com página local bounded e guardas contra resposta tardia; setas
em fullscreen oculto acrescentam canal/volume do app, menu mantém navegação.
Primeiro ensaio browser falhou por mock setNativeLiveControls com assinatura
de objeto em vez de (previewId, context); corrigida somente fixture, critérios
inalterados. Revisão preservou filtro quando canal ativo já está visível.
C114/10 grupos, harness Java, C105/6, C106/8, C73/7, JUnit37/6 classes,
TypeScript/build/lock26+27+9, APK/assinatura/7 assets PASS. Sem falha técnica
pendente identificada; avisos Vite/flatDir prévios permanecem.
APK C114 entregue para teste manual, sem instalação ou publicação. Controle
físico/audibilidade não conferidos; volume do app não controla TV por IR.
Nenhum stream de vizinho (fonte permite só uma conexão). Sem certificação
de controle/modelo Samsung ou aplicativo nativo Tizen/webOS neste ciclo.

## C115 — tendências iniciais TMDB — 2026-10-15

Dependência visual da fonte removida por serviço público opcional separado;
falha não bloqueia Home. Ensaios iniciais do novo harness: identificador fresh
duplicado; Node strip-only não suporta parameter property TS (convertida para
campo/construtor equivalente); CSS global ausente causava overflow da fixture;
fade precisava definir preferência no-preference do ambiente, acrescentado
também caso reduce. C111 tinha corrida de fixture: progresso emitido antes
da assinatura após autorização; agora aguarda syncReady. Nenhum critério ou
assertion relaxado, nenhuma mudança no App/coordenador para acomodar teste.
C115/7, C111/9, C108/13, fila/cache5, TypeScript/build/lock26+27+9 e APK/assets/
assinatura PASS. TMDB real HTTP200/seis selecionados, sem expor configuração.
Avisos anteriores de Vite/Gradle persistem; nenhuma falha técnica pendente
identificada. Primeira imagem ainda depende de internet/TMDB; rede/hardware
reais não homologados. C114 preservado, sem install/reset/backend/Git/updater.

## C116 — preenchimento do Header mobile — 2026-10-15

Cor escura própria do Header ocultava continuidade do halo; transparência
isolada ainda mostraria shell escuro. Corrigido somente CSS: Header/borda
transparentes e faixa superior de ambiente já amostrado no shell. Geometria,
callbacks, menu inferior e demais perfis preservados. Inspeção browser/build/
lock/sync/Gradle/assinatura/assets PASS, sem novas falhas identificadas.
APK C116 local, sem instalação/Git/backend/reset; hardware não homologado.

## C117 — heading/count ainda presentes no celular — 2026-10-15

Regra anterior ocultava heading somente em tablet/TV/quadrado. Acrescentada
regra até600px para Filmes/Séries, exceto aviso de categoria ausente. Somente
CSS, sem alterações em dados/navegação/JS. Inspeção ambas páginas320–600px,
header/hero/ações/aviso/exclusões, build/lock/sync/Gradle/assets/assinatura PASS.
Sem falhas novas; avisos anteriores permanecem. APK C117 local, sem instalação/
publicação/Git/backend/reset. Conferência física no celular pendente.

## C118 — toques bloqueados no hero quadrado — 2026-10-15

Reproduzido com coordenadas:13/25 pontos cobertos por hero-content/title/
overview/footer não acionavam detalhes, enquanto cantos livres funcionavam.
Camada passiva de largura inteira corrigida por classe PHONE/TABLET e CSS
que transmite eventos à imagem mantendo controles próprios, sem mudar layout.
Primeiro ensaio de teclado da fixture CDP não enviava text CR no Enter;
completado protocolo de teclado, mesma assertion passou, sem mudar produção.
C1184 grupos/160 pontos/7 cenários e C1068 grupos PASS, TypeScript/build/lock/
Gradle/assinatura/assets PASS. Avisos anteriores permanecem; sem falha técnica
pendente. Z Fold físico não conferido. APK C118 local, C117 intacto, sem
instalação/publicação/Git/backend/reset/novo Gate.

## C119 — trailer e harnesses históricos — 2026-10-15

Removidos link externo, mensagens sem trailer e barra play/pause abaixo do
vídeo, explicitamente recusada pelo usuário. YouTube controls0 é parâmetro
oficial; não implica remover todos os elementos próprios do provedor. Imagem
horizontal disponível/fundo neutro substitui ausência/erro sem conteúdo falso.
Testes históricos inicialmente falharam por WatchProviders ausente no binding
(movie produzia elemento indefinido), perfil novo do shell e extrator Back
antigo sem catalogReturn/commitRoute. Corrigidos somente os harnesses, sem
mudar comportamento de produção. Expectativa dos botões alterada apenas por
pedido explícito; isolamento/sessão/bounds/cleanup e demais asserts mantidos.
Primeira fixture browser usava HTMLElement.click(), sem foco real; protocolo
CDP de mouse e espera do cleanup corrigiram ensaio de retorno do foco.
Nova execução C1195/browser, modal7, phone3+2 e Java5 PASS, TypeScript/build/
lock26+27+9/sync/Gradle/assets/assinatura PASS. Avisos prévios Vite/flatDir
mantidos; sem falha técnica pendente. YouTube físico/controle remoto não
homologados. APK C119 local; sem instalação/Git/backend/reset/novo Gate.
Ausência de novos Lançamentos não demonstra falha da atualização: mecanismo
15min habilitado no código, suites19+3+9 PASS; fonte comercial e clock dos
aparelhos não consultados nesta rodada, nenhum patch especulativo da rotina.

## C120 — cápsula do menu mobile — 2026-10-15

Primeira fixture media largura273px quando esperava288px: viewport desktop
reservava15px para scrollbar clássica. Emulação mobile com scrollbar
sobreposta corrigiu o ensaio sem alterar produção. Inspeção browser de dez
cenários, toques/estado ativo, foco, rolagem/último item, Live e exclusões PASS.
Patch apenas CSS: contorno/fundo/foco locais e reserva inferior; callbacks/
demais perfis mantidos. Build/lock26+27+9/sync/Gradle/assets/assinatura PASS.
Avisos anteriores Vite/flatDir permanecem; nenhuma falha técnica pendente.
APK C120 local, C119 preservado; sem instalação/Git/backend/reset/novo Gate.
Margens de sistema simuladas no browser; validação física no celular pendente.

## C121 — Geral prevalecia sobre gêneros reais — 2026-10-15

Identificado length>0 de ['Geral'] bloqueando fetch/fallback TMDB nos detalhes.
Filtragem de apresentação e ausência sem categoria resolvem a fronteira, sem
alterar catálogo ou serviços. Logos mobile movidas para linha de metadados;
demais perfis abaixo do poster mantidos. Fixture esbuild inicialmente sem
resolveDir para React e stub sem metadata ainda retornando classificação;
ambos corrigidos no helper privado, sem fix de produção para satisfazê-los.
C1219/browser3/regressões7+3+2+10+5 e build/lock26+27+9/sync/Gradle/assets/
assinatura PASS. Nenhuma falha técnica pendente, avisos anteriores preservados.
Oito modelos conferidos logicamente, hardware não homologado. APK C121 local
preservado, sem instalação/Git/backend/reset/novo Gate.

## C122 — branding nativo — 2026-10-15

Ícone instalado ainda usava recursos genéricos Capacitor/Android e banner
quadrado. Substituídos pela marca escolhida X vermelho/fundo escuro e banner
TV. Renderizações/máscaras/safe-zone aprovadas, recursos compilados e16 PNGs
idênticos aos fontes no APK. Dump inicial de resources excedeu buffer padrão
do helper; nova leitura com maxBuffer explícito passou. Nenhuma alteração de
produção para corrigir ferramenta. Gradle/lock26+27+9/assinatura/assets PASS;
avisos prévios flatDir mantidos. Nenhuma falha técnica pendente. Verificação
física de launcher/cache/máscara ainda não executada, sem instalação/Git/
backend/reset/novo Gate. APK C122 e C121 anterior preservados.

## C123 — favoritos e janela Live — 2026-10-15

Filmes/séries já salvavam favorite, sem consumidor na Home; Live só expunha
favoritos em painel nativo. Coleção mista e categoria virtual ligadas aos
stores existentes. Teste browser revelou seed antigo na remoção do último:
lista fantasma corrigida pelo versionamento de dados prontos. Loading inicial
da coleção evita falso vazio enquanto consulta local está pendente. Testes
específicos e rodada integral8 perfis/155 canais passaram após correção.
Harnesses antigos sem portas atuais (hero/rotation/startup/retorno/suporte),
modelo sem categoryLabels e props obsoletas BrowseHero foram alinhados sem
relaxar invariantes de seleção/limites. Extrator de página recebeu bindings
novos. Helper privado corrigiu ciclo de inicialização bridge, URL sintética
ausente e escape de seletores. Alias fs colidiu no teste novo; corrigido e11
grupos PASS. Nenhum patch de produção para contornar ferramenta.
Revisão React, regressões, TypeScript/build/lock26+27+9/sync/Gradle/assinatura/
assets PASS; avisos prévios preservados, nenhuma falha técnica pendente.
APK C123 e anterior preservados, sem instalação/Git/backend/reset/novo Gate.
Validação física de favoritos nos aparelhos permanece pendente.
Auditoria privada desativou core.autocrlf no comando de diff e acusou CRLF
nativo anterior como whitespace. Corrigido somente comando de leitura para
respeitar configuração Git; arquivos anteriores não normalizados/regravados.

## C124 — gestos Live e foco — 2026-10-15

Node strip-only recusou constructor parameter properties no helper TS novo;
declarações explícitas corrigiram compatibilidade sem alterar o gesto.
Helper browser redeclarou stable; corrigido só no helper. Remount intermediário
por scope na key perdia janela inicial do canal ativo; substituído por cancel
do gesto em effect, preservando key/cache C123. Fixture também alinhada às
classes reais stacked/portrait/square. Rodadas completas C12410/browser4
e regressões11+6+10+7 PASS, sem relaxar assertions ou editar testes anteriores.
Hold de inativo não seleciona vídeo; remoção final sem ghost, DPAD/touch,
cancelamento/contador/marca/reload155 conferidos. TypeScript/build/lock26+27+9/
sync/Gradle/assinatura/assets PASS, avisos prévios mantidos; nenhuma falha
técnica pendente. APK C124 local; sem instalação/Git/backend/reset/novo Gate.
Homologação física de Enter/OK e touch permanece pendente.

C124 final audit: initial STATUS append was inserted at a repeated anchor.
Moved only the C124 block to EOF; original STATUS bytes/hash restored exactly.
First repair attempt failed its assertion before writing (stdin Unicode match);
ASCII anchored repair and complete audit then PASS. No production impact.


## C125 - falhas encontradas e corrigidas - 2026-10-16

Typecheck inicial detectou fireStick unused apos unificar generos; removida
apenas variavel/import obsoletos. Duas tentativas apply_patch falharam antes
de escrever: delete/add no mesmo arquivo e contexto documental inexistente;
reaplicadas como update com contexto correto. Harness home-hero nao tinha
binding do filtro novo; adicionado. C107 ainda exigia Geral nao-Fire e o
cenario vertical home-hero esperava genero TMDB sobre genero real local.
Expectativas atualizadas apos emenda da spec, preservando demais asserts;
novo teste exige mesma prioridade C121/source real nos oito modelos.
Reexecucoes, demais regressoes, browser, typecheck/build/lock/Gradle PASS.
Avisos de build preexistentes documentados, sem bloqueio novo. Sem QA fisica.


## C126 - controle parental local e busca por capa - 2026-10-16

Typecheck inicial apontou imports React default não usados nos componentes
novos; removidos. apply_patch com primeira linha BOM/contexto incorreto
falhou antes de gravar e foi reaplicado com âncora correta. Harnesses antigos
não tinham bindings parentais nem alguns campos canônicos de fixtures;
adicionados apenas os ports/campos, sem relaxar asserts. Wrapper automático
C105 atingiu também um new Function cujo primeiro argumento era module;
restaurado esse argumento, mantendo wrapper só de require. C107 renderiza
AppShell diretamente e precisou do useEffect passivo no port React.
Startup-artwork também precisou de categoryLabels e useCardGenres (C125)
na fixture, além do binding parental. Regressões finais PASS.

Helper browser inicial não fornecia exports nativos de watch-progress;
ports sintéticos completados. Login Fire exigiu esperar commit do DOM,
além do snapshot admin; corrigido o helper. Sem mudança de requisito.
Na revisão final, busca Live mantinha capa adulta já aprovada após relock.
Reproduzido no navegador e no teste do componente real antes do patch
(1 botão em vez de0); escopo agora inclui status/contentRevision/lockRevision/
adultSession. Teste exige ocultar antes do efeito assíncrono, também em
mudança de regra/erro. C12616/browser10/8perfis e rebuild final PASS.

Primeira execução isolada do teste Java ocorreu antes do lock pós-patch,
um desvio de sequência. Depois executados lock e prebuild completos; Gradle
revalidou unit test com mesmos inputs (UP-TO-DATE) e gerou os APKs somente
após o lock. Último build/lock/sync/Gradle e pacote final PASS. Arquivo gerado
capacitor.build.gradle rechecado: nenhum hash fora da allowlist foi alterado.
Avisos Vite node:fs/path, dynamic/static/chunk grande e Gradle flatDir mantidos.
Auditoria38/16/prefixos/HEAD/origin/diff-check PASS. QA física permanece pendente;
simulações não provam Keystore real, KDF no Fire Stick ou fonte/rede reais.


## C127 - fonte e playback no navegador - 2026-10-16

Bloqueio funcional web confirmado por codigo/suite5/reproducao sintetica:
UNSUPPORTED_SECURE_STORE -> SECURE_STORE_WRITE_FAILED no dispatcher MANAGED
mesmo com autorizacao valida; PLAYER_ACTIVITY_UNAVAILABLE e PREVIEW_UNAVAILABLE.
Limitacoes nativas preexistentes, nao corrigidas pela ativacao ou por escolher
outro layout. Generic loading error nao explica a ausencia de suporte web.
Aba do usuario indisponivel: CUA retornou browsers/tabs vazios; nenhum
diagnostico tecnico daquela tentativa foi lido. Modulos Vite publicos
confirmados por GET local, sem acessar token/chave/fonte reais.
Leituras iniciais usaram alguns paths inexistentes e wildcard literal do
rg no PowerShell; corrigidas por rg --files/paths exatos. Sem impacto runtime.
Nao removidos guards ou invariantes para contornar o bloqueio. Futuro suporte
web requer implementacao especifica; nenhum teste de fonte/CORS/codec real
feito neste ciclo. Auditoria de hashes/prefixos/Git e diff-check PASS.


## C128 - exibicao por faixa parental - 2026-10-16

Revisão de integração identificou opções memoizadas do HomeHero e páginas
guardadas da janela Live que poderiam sobreviver a mudança de política.
Corrigidas por elegibilidade/escopo parental e leitura local sem seed antigo
com proteção ativa. Metadata pública que chega por detalhes/trailer também
precisava notificar o filtro; assinatura isolada no cache adicionada após
emenda de allowlist. Novo teste prova revisão de UI sem revisão Live.
Exceção adulta proposta inicialmente foi substituída antes da entrega por
teto18 obrigatório, coerente com o pedido de somente conteúdos permitidos.
Builds refeitos após os refinamentos; C12811/C12616/browser10/8perfis e
regressões finais PASS. Teste antigo de acima-do-teto com prompt adaptado à
nova spec; desconhecido real continua testado antes de C9/player.
Sem falha nas suítes finais. Avisos Vite/Gradle preexistentes permanecem.
PIN/PUK/cofre/ativação não migrados ou resetados. QA física/tempo de KDF,
rede/TMDB/source reais e pacote Tizen/webOS não certificados pelas simulações.
Auditoria17/4 e prefixos/HEAD/origin/native/APK anterior/diff-check PASS.


## C129 - controle parental na TV e D-pad - 2026-10-16

Regressão física reportada: editor parental sem D-pad e grande na TV, com Back
duplicado. Cobertura anterior C126/C128 de diálogo PIN não comprovava navegação
do editor. Identificados fast-path do Back restrito a hero, busca geométrica de
formulário e Enter interceptado em input. Corrigidos em escopo parental; tamanho
e espaçamentos reduzidos só para TV. Nova suíte real UI com teclas cobre todo
percurso em cinco perfis TV, mais três touch. Ajustado foco pós-operação para
esperar fim de busy. Falhas iniciais do harness (labels/seletores/ordem e timing)
corrigidas; resultados finais C129 oito perfis, C12616/C12811, D-pad15/C11410/
C1068/C9wiring10, lock e build PASS. Avisos Vite/Gradle anteriores permanecem.
APK C129 assinado/teste local, nativo idêntico ao C128. Sem falhas finais,
alterações remotas ou reset. Falta conferência física do D-pad e IME Fire/TV;
viewport não homologa pacotes nativos Tizen/webOS. Auditoria8/4/prefixos/HEAD/
origin/APK anterior PASS. NEXT_GATE_STARTED=NAO.


## C130 - icone Fire e piscada do hero - 2026-10-16

Regressao observada no Fire: carousel inteiro opacity0 em cada troca10s e halo
limpo antes da nova imagem pronta, reproduzidos por CDP no C126 instalado.
Corrigidos em escopo Fire; cleanup cobre erro/ref ausente/unmount. Metricas
GPU/jank acumuladas e servicos Amazon reiniciados nao provam OOM/HDMI/crash app.
Icone azul do relato nao coincide com assets vermelhos do APK: cache/launcher
nao isolados conclusivamente; bitmapTV e atributos explicitos preparados.
Tentativa UI de abrir listaApps selecionou navegador Amazon; captura preta
descartada, app retomado e usuario avisado. Nenhum dado/conta alterado.
Harness browser inicialmente exigia opacity<0,1 no controle nao-Fire, criterio
dependente de timing/preferencia. Movimento fixado no harness; controle exige
fade observavel e Fire exige sempre1/zeroanimacoes. Testes finais C1307,
negativos2, browserFire261/AndroidTV275frames e regressões PASS. Candidato
inicial substituido antes da entrega apos novo teste de ref ausente e rebuild.
Avisos Vite/Gradle preexistentes. APK final1.0.20 validado e C129 preservado.
Audit8/5/prefixos/Git PASS; sem instalacao/reset/backend/Git. Validacao fisica
do APK corrigido, launcher e eventual piscada restante pendente apos update.
NEXT_GATE_STARTED=NAO.


## C131 - logo metalica enviada pelo usuario - 2026-10-16

Primeiro assembleDebug falhou em :app:mergeDebugResources: erro interno do
cache incremental no drawable-v24/ic_launcher_foreground.xml (In DataSet main,
no data file for changedFile). Solucao recomendada pelo proprio Gradle:
:app:clean assembleDebug, limitado a saidas geradas, concluido com sucesso.
Nao foi necessario alterar codigo, dependencias ou testes de produto. O
verificador privado de APK inicialmente esperava11DEX binarios iguais;
clean alterou metadata de tres DEX adicionais. Disassembly completo -d -a -n
dos tres e identico; quarto difere so em duas constantes BuildConfig. APK
verificado por essas comparacoes estritas, nao por supressao da falha.
Helper documental inicialmente leu log PowerShell UTF16 como UTF8; detectado
o BOM para validar corretamente o marcador, sem nova compilacao ou patch.
Lock final e
verificacao do APK1.0.21 PASS; avisos flatDir anteriores mantidos. Imagens
diferentes de Downloads nao usadas; original do anexo recuperado e preservado.
Icone novo ainda nao observado em hardware; cache/tema do launcher nao podem
ser certificados pelos assets. Menu interno deliberadamente permanece com
X simples. Audit27/3/1076, memorias append-only e Git/C130 preservados.
Sem instalacao/reset/backend/Git; NEXT_GATE_STARTED=NAO.


## C132 - publicacao Git 1.0.21 preparada - 2026-10-16

Primeira regressao consolidada: cinco harnesses faltavam dependencias recentes.
C107retorno: useParentalControl inexistente e useMemo nao simulado; C107EPG:
favoriteButton nao definido no JSX isolado; colecoes especiais: import parental
nao declarado; episodios: useCardGenres nao declarado; C111startup: gate/pagina
parental ausentes da allowlist de bundle. Emenda previa autorizou apenas
bindings/fixtures; produto intocado e todas as assercoes preservadas.
Cinco reexecucoes PASS, total43verificacoes; Android201testes/34suites
sem falhas/erros. diff-check PASS; warnings LF/CRLF e flatDir preexistentes.
Sem segredo em log; auditoria sanitizada e confirmacao Git ainda pendentes
antes do staging/envio neste registro. Sem backend/install/reset ou novo Gate.


## C132 - commit e push confirmados - 2026-10-16

Commit de consolidacao C107–C131 241b2b6608039157e8eb7ea3d952ade87c55f6b3,222arquivos auditados,
enviado por push normal para main de xandeflix2/xandeflix-prebuilt. Confirmado
independentemente por ls-remote, remoto/local iguais e divergencia0/0;
workspace limpo antes deste fechamento.43verificacoes e201testes Android PASS.
Zero achados de segredos; somente cinco fixtures revisadas, assercoes
preservadas, produto/APK intocados. Memorias append-only, artefatos privados
excluidos. Fechamento final apenas documental, com nova verificacao do SHA
remoto depois do segundo envio. Sem force/amend/rebase/PR, backend/Supabase,
updater, instalacao/reset/release ou novo Gate. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C132_GIT_PUBLICATION_VERIFIED; NEXT_GATE_STARTED=NAO.
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO.


## C133 - foco D-pad da janela PIN - 2026-10-16

Regressao real: janela PIN parental sem fast path do editor, busca espacial
rejeita botoes fora do angulo e foco nao sai do input. Reproduzido vazio e
apos seis digitos. Corrigido somente roteamento da janela/edicao/fallback e
foco de retry. C133oito perfis/seguranca/regressoes PASS. Controle negativo
inicial pos-patch usava filtro Unix em Windows, carregando fontes atuais;
corrigido filtro e confirmado erro anterior esperado Confirmar/observado PIN.
Diagnostico inicialmente imprimia body inteiro no foco transitorio; limitado
a tag/texto de botao. Apenas fixtures sinteticas em RAM; nenhum segredo real.
Lock inicial/prebuild/build/sync/Gradle/APK1.0.22 PASS; avisos antigos
Node/Vite/chunk/flatDir mantidos. Recursos nativos/assinatura preservados.
Audit6/3/1102 e prefixos/Git PASS; sem install/reset/backend/Git. Homologacao
fisica do controle/IME apos update manual ainda pendente. NEXT_GATE_STARTED=NAO.


## C134 - preview parental e ativacao por controle - 2026-10-16

C134 concluido localmente: preview Android oculto durante PIN sem trocar
midia/ExoPlayer/buffer/C9 nem criar conexao; erro mantem oculto, cancelamento
restaura e Back nao sai Live junto do modal. Ativacao por D-pad: entrada pelo
Back/menu, ordem de acoes e diagnostico rolavel. Um unico Voltar na pagina
interna; standalone conserva botao. Auth/source anteriores exatos por AST.
Dois C134 e C133 com oito perfis cada,14 suites/203 testes Android34 suites
PASS; lock antes/extensao/prebuild26+27+9, TS/Vite561/sync/Gradle PASS.
APK1.0.23/code23 11450328bytes SHA256 625cae391a3260f290c99c17659488b66ffb9d52d9a61260ed22f5500b365301; mesma assinatura,
1412recursos nativos/10DEX identicos, outros somente plugin e versao.
Audit14/4/1097, memorias append-only e HEAD/main/origin/index preservados.
QA fisica SurfaceView/IME pendente de update manual. Sem install/reset,
backend/Git ou proximo Gate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

Regressoes detectadas: SurfaceView acima do PIN, Escape duplo cancelava e
saia Live, Back externo da ativacao procurava hero inexistente e Voltar
duplicado. Corrigidos escopadamente. Fixtures antigas C112/C106 receberam
estado/port parental faltantes, sem retirar assercoes; controle negativo
anterior confirma cada bug. Verificador DEX herdado previa apenas versao;
inspecao110+4classes confirma somente plugin/BuildConfig apos normalizacao
de offsets/pool/annotations. Diagnostico sintetico completo testa overflow.
Avisos antigos Node/Vite/chunk/flatDir permanecem. QA fisica ainda pendente.


## C135 - area 18+, fonte ativa e cronometro parental - 2026-10-17

Fonte e catalogo nas Configuracoes por ID/versao REAL promovida vs vinculada,
com consulta/sync guardada. Area18+ separada por PIN e grade paginada; categorias
adultas Live mantem somente nomes antes do PIN, sem expor canais/capas.
Sexta falha de PIN bloqueia3h por cronometro monotono protegido, persistente;
mudar data/hora ou reiniciar nao libera antecipadamente. Sem backend/identidade
ou politica alterados. Spec/evidencia: docs/{architecture,evidence}/C11_ACTIVE_SOURCE_AND_ADULT_VISIBILITY.md.
APK1.0.24/code24 em tmp/c135-active-source/Xandeflix-v1.0.24-C135.apk,
11385598 bytes, SHA256 559cbe905898853765f9f4c3f8ac7373870c62885aa5607912a8a4a1da8514cd.
MCP read-only negado: binding/conteudo real nao diagnosticados. UI fixture exports/previewId/seletores e C106ports/bootprofile corrigidos preservando asserts. Regressao real de reinicio de midia ao liberar categoria corrigida por dependencia snapshotId; leitor retry restaura cursor. Normalizador DEX corrigiu atribuicao de annotations. Falhas iniciais em logs privados; ultimos testes PASS. Reboot conserva restante; nao conta periodo desligado sem prova. Sem garantia de teste fisico/IME/SurfaceView; APK para validacao manual.


## C136 - conferencia web local e LAN - 2026-10-17

Modo web explicito com cofre cifrado IDB/player direto, sem fallback nativo.
Catalogo web corrigido por arquivos virtuais locais, UA padrao normalizado
somente no browser; source/bootstrap/catalog/search/Android exatos por hash.
Usuario confirmou Home/fonte real, Live, reproducao e controles personalizados.
Previa limpa, player FIT/contain inicial; largura desktop em Home/browse/detalhes,
Hero compacto/rotacao10s, menu central sem barras, Space em busca e topo sem
quantitativo. Ultimos refinamentos visuais aguardam QA manual.
Spec/evidencia: docs/{architecture,evidence}/C11_BROWSER_LOCAL_VALIDATION.md;
operacao docs/WEB_LOCAL.md.23suites locais PASS, lock/build web e padrao PASS;
fixtures historicas corrigidas sem relaxar asserts. Cofre/crypto e arquivos WebFS
reais com portas locais; decode/fonte real confirmado pelo usuario, sem CUA
disponivel. HTTPS LAN3443 preparado; certificado publico precisa confianca no
cliente, sem instalar raiz automaticamente. Nenhum backend/proxy/Internet.
APK1.0.24 preservado SHA256559cbe905898853765f9f4c3f8ac7373870c62885aa5607912a8a4a1da8514cd.
Auditoria15existentes+18novos/1113preservados, memorias append-only/Git inalterado.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/install/reset/remote writes.

Falhas iniciais: SPA HTML200 no fast path, UA proibido, fixtures T4/C105/SSR/C128 incompletas. Logs negativos privados preservados; ultimas execucoes PASS. Reproducao sujeita CORS/HTTPS/codecs; trilhas so quando expostas pelo browser/transporte. QA nativo/Cast/PiP e cliente LAN fisico nao certificado. npm advisories dev transitivos preexistentes, sem atualizar fora do escopo.


Refino C136 autorizado: Hero web maior (100dvh-250px, min300px) para revelar aproximadamente metade da primeira fileira, imagem cover preenchendo mesmo cropada. Substitui altura compacta/contain apenas do Hero; player conserva contain/FIT. Somente CSS web; demais fronteiras e testes funcionais mantidos.

Refino visual final C136: usuario pediu mais altura; Hero web ganhou mais40px, reserva passou a210px (100dvh-210px, min300px). Imagem cover; player FIT preservado.

C136 - segundo incremento visual autorizado: mais40px exatos no Hero web, altura max(340px,100dvh-170px). Demais regras e video FIT preservados.

C136 - contraste do Hero web: removido overlay escuro global e qualquer filter/opacity redutora da imagem. Gradiente radial local mantido atras dos metadados/botoes, como CSS nativo; player e demais dispositivos preservados.

C136 - sinopse web ampliada14->18px/line-height1.5 em todos os hero-banner horizontais e detail-hero-wide. Somente CSS de conferencia web; fonte dos dispositivos nativos preservada.

C136 - rotacao web: pedido explicito mantem troca10s mesmo reduced-motion, com transicao sem animacao; native preserva politica anterior. Usuario confirmou MUDOU apos Ctrl+F5/25s. Diagnostico HERO_ local de timer/estado/ticks, sem ID/URI. Previa Live web limitada50dvh/520px para mais EPG; video contain e fullscreen intactos. Hero5/SSR/C128 rerodados PASS.

C136 - previa Live web: apos reducao inicial, usuario solicitou aumentar50px. Teto atual min(50dvh+50px,570px), enquadramento contain e fullscreen preservados.

C136 - auditoria adicional da rotacao: callbacks reais atual/baseline em1024 combinacoes com web=false produzem timers identicos e nenhum marcador web. Hero5/C12811/SSR BrowseHero rerodados PASS. Fonte/bootstrap/catalog/search/Android e APK anteriores por hash preservados.

## C137 - diagnostico real de troca de fonte web pendente - 2026-10-17

Fonte ativa substituida apos teste de tres horas expirado, segundo usuario.
CUA retornou apps=[]/browsers=[]; nenhuma leitura da aba real ou do binding
remoto.51 casos sinteticos existentes PASS; nao comprovam sinal real.
Solicitados ID/versao em uso/vinculada e mensagem de Atualizar catalogo no
mesmo navegador. Nao presumir cache antigo, licenca expirada ou CORS sem essa
evidencia. Nenhuma mudanca funcional especulativa/reset/escrita remota.
Pesquisa inicial passou globs como paths no PowerShell e encontrou erros de
path; corrigida para rg com diretorio real e filtros -g. Nao houve falha de
teste neste ciclo. Causa real ainda nao identificada.

## C137 - confirmacao do usuario e encerramento - 2026-10-17

Em resposta ao procedimento Conferir fonte / Atualizar catalogo no mesmo
navegador PC, usuario confirmou "DEU CERTO". Recuperacao do sinal confirmada
pelo usuario apos atualizacao manual; nao foi observacao instrumentada do
agente. Pendencia operacional anterior encerrada por esse relato. IDs/versoes
e etapa exata da falha anterior nao foram enviados; nao atribuir causa-raiz
conclusiva a cache, CORS ou licenca. Nenhuma alteracao funcional foi necessaria
neste ciclo; demais dispositivos, ativacao e APK preservados. Os51 testes
sinteticos anteriores permanecem evidencia separada. Preflight repetido:
clone ativo/main/origin esperado, HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d,
proveniencia dirty conhecida; allowlist documental C137 mantida.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/build/backend/install/reset.

## C138 - verificacao visual limitada, sem regressao local - 2026-10-17

Build web/padrao e typecheck/lock26+27+9 PASS; fonte8/8 PASS. CUA novamente sem
apps/browsers: verificacao visual da pagina real e controle remoto fisico nao
executadas. Nao usar automacao alternativa nem declarar esses testes feitos.
Avisos existentes de chunk/externals permanecem, sem erro. Pesquisa inicial
apontou diretorios CSS inexistentes; corrigida por leitura de src/index.css.
Patch limitado aos resumos de Settings, demais fluxos preservados por hash.

## C139 - build/install concluido, sem falhas - 2026-10-17

Lock/build/sync/Gradle/205 testes/assinatura PASS; Fire install -r23->25 PASS.
Dados protegidos comparados em RAM e preservados; APK anterior mantido.
Dois paths tmp antigos na pesquisa foram corrigidos pelos nomes existentes.
Avisos conhecidos de build mantidos. Verificacao fisica limitada a instalacao,
versao/hash, preservacao e abertura/processo vivo10s; nao certificar playback,
todos os controles ou funcionamento no tablet/celular sem testes nesses alvos.
Nenhum bloqueio operacional de entrega identificado neste ciclo.

## C140 - verificacao sintetica PASS, QA visual limitado - 2026-10-17

Nenhuma falha de compilacao/teste: janela8/8, fonte8/8, lock26+27+9 e builds
web/padrao PASS. CUA sem apps/browsers; nao executada UI real/controle fisico,
sem automacao alternativa. Busca por nome antigo DevicePresentationDialog.tsx
nao encontrou arquivo; seletor existente reutilizado por openDevicePresentation.
Avisos conhecidos de chunk permanecem. Guardas de fonte/parental preservados;
janelas de configuracao possuem marcador proprio para nao bloquear a propria
atualizacao de catalogo. APK1.0.25 instalado anteriormente nao foi substituido.

## C141 - APK de teste gerado sem falhas - 2026-10-17

Lock/build/sync/Gradle/205 testes/assinatura/assets PASS. Avisos existentes de
chunks e externals permaneceram, sem erro de compilacao ou verificacao.
Nenhum dispositivo foi acessado/alterado; nao declarar instalacao, playback
ou QA fisico neste ciclo. Artefato1.0.25 preservado;1.0.26 inclui janelas C140.
Sem bloqueio operacional na entrega do APK.

## C142 - verificacao dos cards horizontais - 2026-10-17

Diferença reportada pelo usuario: min-height e alinhamento inicial permitiam
cards com alturas diferentes ao quebrar titulo/resumo; Fire tinha tipografia
fixa proporcionalmente maior. Bloco CSS isolado aplica linhas iguais e escala
responsiva para tablet/TV paisagem, preservando phone/web/retrato e handlers.
Lookups iniciais usaram caminhos inexistentes AppShell.tsx/UiShell.css e
runtime/device-presentation.ts; localizados por rg --files em components e ui,
sem escrita nesses caminhos nem efeito no patch. Nenhum erro de teste/build:
lock, web/padrao, sync, Gradle,205 testes nativos e assinatura/empacotamento PASS.
Avisos Vite preexistentes de Node externalizado/chunks grandes permanecem.
CUA apps=[]/browsers=[] impede QA visual real nesta sessao. APK1.0.27 gerado
para conferencia fisica, nao instalado; nenhum dispositivo/dado foi alterado.
Auditoria de escopo/hashes PASS; nao houve bypass de teste/lock/backend/Git.

## C143 - tela intermediaria de preferencias no startup - 2026-10-17

Defeito visual reportado reproduzido antes da correcao em SSR sintetico: loading
local de AppShell exibia header/texto sem startup. Corrigido por leitura
antecipada no App e loading visual exclusivo; acesso fail-closed preservado.
5 novos/16 regressivos parentais, lock, builds web/padrao, sync/Gradle,
205 testes nativos e verificacao do APK1.0.28 PASS; nenhum teste relaxado.
Avisos Vite preexistentes de Node/chunks/imports mistos permanecem, sem falhas.
CUA apps=[]/browsers=[]; teste sintetico substitui startup por marcador e nao
certifica renderizacao real/imagens. APK entregue para QA fisica, nao instalado.
Sem leitura privada/reset/backend/Git. Evidencia C11_STARTUP_PREFERENCES_CONTINUITY.md.

## C144 - fontes grandes na coluna canais e EPG Android TV - 2026-10-17

Usuario confirmou tamanho bom das categorias mas canais/EPG grandes na Philips.
Revisao identificou regras proprias de canais virtualizados/EPG que nao usam
a referencia compacta das categorias. Corrigido somente font-size no perfil
Android TV/live, excluindo Fire e web. Outros dispositivos e categorias intactos.
Sem falhas de verificacao: AST/hashes/lock/builds/sync/Gradle/205 testes nativos
e assinatura/empacotamento PASS. Avisos Vite preexistentes permanecem.
CUA apps=[]/browsers=[]; sem alegar tamanhos computados ou renderizacao real
medidos. APK1.0.29 gerado para conferencia fisica, nao instalado.
Nenhum teste existente alterado, nenhuma fonte/dado/reset/backend/Git tocado.
Evidencia C11_ANDROID_TV_LIVE_FONT_ALIGNMENT.md; proximo Gate nao iniciado.

## C145 - ausencia de cor dinamica no navegador - 2026-10-17

Reproduzido SecurityError capturado pela amostragem de imagem remota em fixture;
sem paleta, CSS fica neutro. Correcao web via probe CORS isolado e sidebar
transparente; imagem original/native/source/search preservados. Primeiro teste
do hook nativo falhou porque img simulado nao possuia dataset; fixture alinhado
ao DOM real, closest distinguindo Fire e verificacao de retencao adicionada.
Nenhum assert antigo relaxado nem codigo produtivo mudado para acomodar erro.
Suite final8/8 e regressao paleta PASS; lock/builds/isolamento PASS. Lookup
opcional HeroArtwork.tsx ausente resolvido no Hero.tsx. Avisos Vite antigos
permanecem. CUA apps=[]/browsers=[] limita verificacao a portas sinteticas,
HTTP200 de modulos e CORS do exemplo publico; QA visual real pendente.
Sem novo APK/dispositivos/credenciais/backend/Git. Evidencia C145 registrada.

## C146 - Hero colorido mas fundo neutro/intermitente no web - 2026-10-17

Regressao visual C145 reportada apos navegar Home/Filmes/Series. Diagnostico
real NO_PALETTE/IMAGE_READY=SIM/PAGE_ACTIVE=NAO/cores NONE e header transparente
isola falta de paleta, nao CSS opaco. Recuperacao web CORS com cache reload
aplicada sem afirmar causa precisa no cache; neutralidade mantida se servidor
negar CORS/rede/decodificacao. Reproducao anterior e7 testes novos PASS,
3 diagnosticos+8 anteriores+paleta+locks/builds PASS. Campo failure detalha
futuras falhas sem conteudo privado. Fixture inicial tinha assert de newline
inicial indevido; trim corrigiu apenas fixture. Smoke node -e inicial teve
escape PowerShell invalido antes de executar; substituido por .mjs privado,
HTTP200/markers PASS. Avisos Vite preexistentes permanecem, sem falhas finais.
CUA apps=[]/browsers=[]: QA visual ainda depende da conferencia solicitada na
aba ativada. Nenhum dispositivo/storage/backend/Git tocado. Spec/evidencia
C11_WEB_AMBIENT_REGRESSION_DIAGNOSIS.md; proximo Gate nao iniciado.

## C147 - sidebar web retinha cor ao rolar - 2026-10-17

C146 confirmado pelo usuario; novo relato/screenshots: menu retinha cor do
topo enquanto categorias estavam neutras. Encontrado CSS do shell com
background-attachment fixed e gradiente separado. Corrigido somente CSS web,
herdando fundo da pagina por faixa nao interativa; leitura de cor preservada.
Nenhum erro final de teste/build/auditoria.8 C145+7 C146+paleta e locks26+27+9
PASS; build web31.83s/typecheck PASS. Avisos Vite anteriores (chunks grandes,
modulos Node externalizados/import dinamico+estatico) persistem, sem novos
modulos/dep ou alteracao funcional. CUA apps=[]/browsers=[] impede medir pixels;
smoke HTTP200 e auditoria nao substituem confirmacao visual de rolagem.
Spec/evidencia C11_WEB_SIDEBAR_SCROLL_BACKGROUND.md. Nenhum dispositivo/dado/
backend/Git alterado; APK C144 intacto; proximo Gate nao iniciado.

Confirmacao visual posterior C147: usuario respondeu "DEU CERTO" apos rolar
alem do Hero e voltar ao topo na aba real. Relato homologa apenas o efeito
visual solicitado; nao e medicao instrumentada pelo agente. Ciclo C147
concluido; proximo pedido de guia Live tratado em escopo local separado.

## C148 - guia presa ao canal ativo e ausencia de foco inicial - 2026-10-17

Reproduzido antes: nenhum evento de inspecao e guia so do canal ativo. Corrigido
com foco/hover/guia separada; usuario tambem pediu foco no ultimo canal, agora
por ID/pagina local/indice exato, respeitando PIN/interacao/cancelamento.
9 testes novos e47 regressivos PASS; locks/builds finais PASS. Primeiro teste
novo de JSX emitido pelo TS falhou por exports ausente no fixture CommonJS;
port adicionada, producao/asserts nao alterados. Primeira auditoria retirava
newline legitima; removida so normalizacao do harness, assert exato preservado.
Logs privados guardados. Lookup opcional de pasta c139-android-test-apk-fire
inexistente resolvido pela spec canonical c139-android-test-apk; nenhum dado
ou arquivo perdido. Avisos Vite anteriores persistem sem erro final. CUA vazio,
HTTP200 nao mede pixels; usuario confirmou os2 fluxos na aba. Sem teste Android
fisico/APK/install/reset/backend/Git neste ciclo. Spec/evidencia C148 registrada.

## C149 - APK de teste e install Fire - 2026-10-17

Nenhuma falha final de lock/sync/Gradle/205 testes/assinatura/package/assets/
recursos/auditoria ou instalacao. Mesmo certificado instalado28/C144; Fire
recebeu30 in-place e83 privados/75 catalogo/7 protegidos preservados antes de
reabrir, identidade/chave/instalacao iguais apos boot10s. Somente hashes em RAM,
sem segredos em logs. Avisos Gradle/Vite preexistentes nao exigiram patch.
ADB nao estava no PATH; usado executavel SDK absoluto, sem instalar ferramentas.
CUA vazio: processo/versao/hash conferidos, renderizacao/D-pad/EPG fisico ainda
nao homologados pelo agente. APK1.0.30 entregue para teste tablet/celular/TV,
sem instalar outros alvos/reset/backend/Git ou proximo Gate.
Spec/evidencia C11_LIVE_GUIDE_TEST_APK_FIRE_INSTALL.md.


## C150 - carga sem bypass manual - 2026-10-17

Sem falha final de testes/lock/build/auditoria. Busca rg com glob de caminho
invalido Windows123 repetida corretamente; helper baseline node -e perdeu
aspas PowerShell e falhou sem executar, corrigido por here-string/stdin.
Nenhuma escrita parcial. Avisos Vite Node externalizado/chunks grandes ja
existentes preservados, sem patch fora de escopo.11 eventos nao liberam carga,
28 renders/4 perfis/3 estados/foco, artwork/C143 e locks/builds PASS.
CUA sem superficies; nenhum APK novo/install/teste fisico, APK149 intacto.
Prazo defensivo de arte20s permanece, nao bloqueia por catalogo completo.
Spec/evidencia C11_STARTUP_AUTOMATIC_ENTRY_ONLY.md; NEXT_GATE_STARTED=NAO.


## C151 - build painel e conexao Vercel - 2026-10-17

Primeiro artifact falhou verificacao de chave publica embutida (Vite define
import.meta.env); corrigida injecao explicita de2 campos no runtime antes do
SDK, novo teste de entry e segundo bundle PASS. Nunca publicado. Scanner
sinalizou2 fixtures de URL negativas antigas; contexto/igualdade ao HEAD
revisados sem imprimir valores, nenhum segredo real. Sem relaxar testes.
API list_projects requer teamId raiz, caminho supabase client inferido
inexistente e public/ ausente: corrigidos/registrados, sem efeito remoto.
Avisos Vite/Git CRLF anteriores preservados; verificacao direta Git passou.
Todas suites/locks/builds atuais PASS e APK149 preservado. Nao ha conta
Vercel correta autenticada; usuario proibiu xandeflix4 e solicitou nova.
CUA No browser is available. Sem deploy, novo Supabase, emails, roles/RLS ou
operacao em contas reais. Git commit/push explicitamente autorizados em main,
fechamento registrara resultado real. NEXT_GATE_STARTED=NAO.


## C151 - commit e push confirmados - 2026-10-17

Commit principal 1496c6b9a7c3336ea6895a2be158db8b0803c90f enviado a origin/main e conferido
independentemente por ls-remote, divergencia0/0 e arvore limpa.136 caminhos
e blobs iguais ao manifesto auditado, zero achados reais de segredos,
2 fixtures negativas antigas revisadas; arquivos privados/APK149 excluidos
e preservados. Auditoria C151 baseline1182/1177 preservados,11 novos,
6 assets do painel verificados; builds/testes/lock PASS. GitHub agora contem
a configuracao dedicada Vercel e os patches C133-C150. Este fechamento e
exclusivamente documental, sem nova mudanca funcional. Publicacao Vercel
ainda nao iniciada: nova conta/conexao correta necessarias; nenhum uso ou
mutacao de xandeflix4, Supabase ou dispositivos. NEXT_GATE_STARTED=NAO.
