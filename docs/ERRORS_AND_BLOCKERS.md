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
