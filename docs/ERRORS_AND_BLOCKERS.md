# Registro de Erros e Bloqueadores (Errors and Blockers)

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

