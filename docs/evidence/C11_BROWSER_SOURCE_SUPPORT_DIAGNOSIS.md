# C127 — investigação do acesso à fonte pelo navegador — 2026-10-16

## Escopo anterior à reprodução

Usuário relata navegador desktop em localhost:3000 com ativação autorizada,
mas primeira carga do catálogo falha. Pergunta se existe bloqueio para web.
Investigar o runtime e distinguir autorização, entrega, armazenamento seguro,
fetch/importação e playback. Nenhuma autorização para remover proteções,
implementar fallback, alterar fonte/cofre/identidade/licença ou dados remotos.

Preflight: workspace/top-level clone independente C11-main, main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. AGENTS, Architecture, Execution,
Source Data Boundary e Activation Lock lidos. C126 preservado. Baseline1089 e
prefixos das três memórias capturados em tmp/c127-browser-source-diagnosis.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C127_BROWSER_SOURCE_DIAGNOSIS.

Allowlist somente deste relatório, STATUS/EVOLUTION/ERRORS append-only e
helpers/saídas privadas em tmp/c127-browser-source-diagnosis. Nenhum arquivo
de produção, teste versionado, pacote, APK ou backend será modificado.
Procedimento: executar a suite existente do cofre e reproduzir com classes
reais, plataforma web do Capacitor, transporte/identidade sintéticos. Não
usar dispositivo, chave, token, playlist ou credenciais reais. Verificar a
versão dos módulos servidos pelo Vite sem imprimir seu conteúdo.

## Evidências já observadas

- Screenshots fornecidos pelo usuário mostram ativação Autorizado e conta
  MANAGED/WEB, mas erro genérico em Catálogo (02/04). Não mostram o código
  técnico da entrega. Não copiar a chave do screenshot para logs/relatórios.
- CUA não expôs browsers/tabs nesta sessão; não foi possível ler o diagnóstico
  daquela aba específica. Porta local3000 está escutando. GET read-only dos
  módulos do cofre e bridge no Vite retornou200 e confirmou os guards nativos.
- LocalSecureSourceStore.requirePlugin rejeita ambiente não nativo sem plugin
  com UNSUPPORTED_SECURE_STORE. Não existe implementação web nem fallback
  persistente. Suite existente test-local-secure-source-store:5 PASS, inclusive
  rejeição em web sem gravar segredo em localStorage.
- ManagedVaultDeviceDeliveryService verifica autorização, recebe entrega e
  chama localStore.put. Falha de selagem vira SECURE_STORE_WRITE_FAILED.
  BootSyncCoordinator tenta ler cofre; sem registro pede entrega; falha sem
  catálogo ativo retorna DELIVERY_FAILED/ERROR antes de staging/importação.
- NativeAndroidPlayerAdapter usa openNativeAndroidPlayer. Sem plugin/nativo,
  retorna PLAYER_ACTIVITY_UNAVAILABLE; preview retorna PREVIEW_UNAVAILABLE.
  Não há fallback HTML5 silencioso. FSD F-G8-009 documenta esse resultado.

## Fronteira canônica e próxima implementação possível

Ativação é autorização comercial; não cria capacidades nativas no navegador.
Painéis e UI web podem funcionar, mas isso não certifica ingestão da fonte ou
reprodução web. Escolha de layout de dispositivo também não instala plugins.
Não se trata de limite parental introduzido em C126: os guards existem no HEAD.

Source Data Boundary seção6 exige armazenamento seguro apoiado pelo dispositivo
e não aceita localStorage/Filesystem simples/debug como autoridade de produção.
FSD prevê indisponibilidade do player em navegador. Liberar uso desktop requer
um desenho próprio de armazenamento/runtime/entrega e player web, preservando
licença/C9, acesso direto à fonte e catálogo local; não basta remover os guards.
Compatibilidade de rede e mídia da fonte precisará ser validada nesse desenho;
nenhum diagnóstico de CORS, codec ou bloqueio geográfico real foi feito aqui.
Não propor proxy central de playlist/vídeo ou envio do catálogo ao Supabase.

Skill Supabase consultada para fronteira de autorização/entrega. Não houve
query/RPC/Edge Function, escrita remota ou alteração de configuração Supabase.
Nenhuma nova feature Supabase foi implementada. NEXT_GATE_STARTED=NAO.

## Reprodução concluída

Helper privado executou as classes reais no ambiente web padrão do Capacitor,
sem injetar plugin de cofre ou de player. Resultado PASS:

| Operação real | Resultado observado |
| --- | --- |
| Cofre get/put/has | UNSUPPORTED_SECURE_STORE |
| Dispatcher MANAGED + ativação AUTHORIZED + entrega sintética válida | SECURE_STORE_WRITE_FAILED |
| openNativeAndroidPlayer | PLAYER_ACTIVITY_UNAVAILABLE |
| startNativeAndroidPreview | PREVIEW_UNAVAILABLE |

Uma chamada ao transporte de fixture, zero chamadas remotas, zero escritas em
localStorage. A ativação já autorizada passou pelas verificações locais antes
de falhar na selagem; isso demonstra que autorização não resolve a ausência
do plugin. Nenhuma playlist foi baixada, nenhum vídeo foi aberto e nenhum
registro real de dispositivo foi consultado/modificado. Reprodução isolada
não substitui o diagnóstico da aba do usuário, não acessível nesta sessão.

Os guards do cofre e do player foram comparados com HEAD e já estavam presentes
antes do C126. A tela de erro genérico não esclarece essa limitação. Não há
base para atribuir esta falha ao PIN parental ou a uma nova ativação necessária.

Auditoria: baseline1089, somente três memórias append-only alteradas e este
relatório novo. Demais1086 hashes, prefixos de memória, HEAD/main/origin e APK
C126 preservados. git diff --check PASS. Sem alteração funcional/build/APK,
Git write, backend ou instalação. GIT_COMMIT_AUTHORIZED=NAO;
GIT_PUSH_AUTHORIZED=NAO; NEXT_GATE_STARTED=NAO.
