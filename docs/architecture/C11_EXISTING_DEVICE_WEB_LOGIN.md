# C155 - acesso web com dispositivo existente - 2026-10-17

> C159, 2026-10-18: a regra historica de novo login em toda recarga e
> superseded somente pela retomada cifrada/revalidada da mesma aba definida
> em [C11_WEB_SESSION_RELOAD.md](C11_WEB_SESSION_RELOAD.md). Tres fatores no
> primeiro acesso, nenhum PIN/chave permanente salvo, autoridade remota e
> demais restricoes permanecem. Texto historico abaixo e preservado.

## Pedido vigente e preflight

Usuario reportou falha na etapa Catalogo apos ativar o navegador publicado e
determinou novo modelo: entrar com codigo do dispositivo, chave de acesso e
PIN configurado. Web nao deve criar outro codigo/chave, usuario, ativacao ou
vinculo de licenca. Este pedido substitui a premissa C154 de nova ativacao por
origin somente para o consumidor web publico; nao muda instalacoes Android.

Clone ativo C:/Xandeflix/xandeflix-prebuilt-c11-main; origin canonico
https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
8d0db6adf82007204be7891809f0d306c109bc33, limpo inicialmente. AGENTS,
Architecture, Execution, Source Boundary, Activation Lock e C154 lidos.
Baseline1202/copias privadas em tmp/c155-existing-device-web-login.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C155_EXISTING_DEVICE_WEB_LOGIN;
NEXT_GATE_STARTED=NAO. Correcao/publicacao do repositorio atual e Git seguem
solicitacao vigente; nao alterar projetos/contas protegidos ou resetar APKs.

## Estado vigente — emenda limitada autorizada — 2026-10-17

Depois de conferir AGENTS.md e o Architecture Contract, o usuario determinou:
"PROSSIGA COM A EMENDA LIMITADA QUE PERMITA ACESSAR O SISTEMA WEB COM OS DADOS
DO CLIENTE." A autorizacao substitui a pendencia de aprovacao do PIN registrada
abaixo. Nao e uma nova ativacao, permissao para criar cliente ou dispensa de
licenca. Este registro precede a alteracao dos contratos relacionados.

EMENDA_LIMITADA_AUTORIZADA=SIM; IMPLEMENTACAO_WEB_CONCLUIDA=SIM;
SUPABASE_CANONICO_ACESSIVEL=SIM (conexao confirmada na fase funcional abaixo);
EMENDA_PUBLICADA=SIM; FRONTEND_PUBLICADO=SIM.
EMENDA_DOCUMENTAL_VALIDADA=SIM (auditoria/lock descritos na evidencia C155).
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C155_EXISTING_DEVICE_WEB_LOGIN;
NEXT_GATE_STARTED=NAO. A etapa documental abaixo e historica; a fase funcional
posterior registra a autorizacao de implantacao/Git. Novo APK nao autorizado
neste ciclo web. Frontend publicado/verificado; playback real nao homologado.

### Allowlist desta etapa documental

Este contrato; docs/evidence/C11_EXISTING_DEVICE_WEB_LOGIN.md;
docs/architecture/C11_LOCAL_PARENTAL_CONTROL.md;
docs/architecture/XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md;
docs/architecture/XANDEFLIX_PREBUILT_SOURCE_DATA_BOUNDARY.md;
docs/architecture/C11_NEW_DEVICE_ACTIVATION_LOCK.md; tres memorias
STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS append-only; snapshots e auditoria
privados em tmp/c155-existing-device-web-login. Nao alterar AGENTS.md,
codigo funcional, testes consolidados, build, dependencias, .env.local,
identidade, cofres ou configuracao remota nesta etapa. Acesso ao projeto
Supabase correto continua necessario para implantacao e verificacao reais.

### Excecao normativa de autenticacao web

1. Somente o consumidor web publico /app deve aceitar codigo do dispositivo,
   chave permanente de acesso e PIN de seis digitos previamente cadastrado.
   Os tres dados sao obrigatorios e validados no servidor, incluindo
   dispositivo/licenca/binding ativos. Formato, cache ou autenticacao de
   gestor nao substituem esses fatores. Sem PIN cadastrado, negar entrada.
2. Permitir exclusivamente um verificador protegido de PIN para autenticacao
   no Control Plane privado, separado dos cofres de fonte e das tabelas
   publicas. Salt aleatorio por credencial e KDF forte, no minimo
   PBKDF2-HMAC-SHA256/600000, com protecao adicional por segredo exclusivo do
   servidor; nunca reutilizar o verificador/salt local como prova de acesso.
   PIN em plaintext pode existir somente transitoriamente em RAM durante
   entrada e validacao por HTTPS, nunca persistido, retornado ou registrado.
   Verificadores e tokens tambem nao entram em listagens, telemetria ou logs.
3. Reutilizar o mesmo valor do PIN parental mediante cadastramento autenticado
   no aparelho ja autorizado, apos validar o PIN atual localmente. Nao ha
   descoberta ou upload automatico dos PINs existentes: hoje so ha
   verificadores locais. Nao exportar o registro parental nem seu verificador.
   Uma nova credencial remota deve usar salt/protecao proprios.
4. ADMIN responsavel ou MASTER autenticado pode criar/alterar o PIN de acesso
   web do cliente existente dentro de seu escopo, com autorizacao server-side
   e auditoria sanitizada. Nunca revelar o PIN salvo. Essa permissao nao
   redefine PIN parental/PUK de um aparelho nem altera suas preferencias.
   Para compartilhar novamente o mesmo valor, o responsavel confirma o PIN
   no fluxo local protegido; divergencia nao autoriza sobrescrita silenciosa.
5. PUK, classificacoes, regras, preferencias, historico, titulos e associacoes
   conteudo-usuario permanecem locais. PIN/verificador nao identifica nem
   vincula fonte, nao constitui sourceId, nao concede licenca e nao substitui
   autorizacao ou entrega protegida do vault.
6. Apos validar codigo/chave, cinco PINs incorretos sao tolerados; o sexto
   bloqueia o acesso web por tres horas. Contador e prazo sao atomicos e
   determinados pelo servidor, vinculados ao dispositivo existente, com
   protecao adicional contra abuso e concorrencia. Codigo/chave invalidos
   tambem exigem limite de abuso, sem permitir bloquear arbitrariamente o PIN
   de um terceiro por conhecer somente seu codigo. Reload, outro navegador ou
   alterar relogio do cliente nao zera bloqueio. Erro generico nao revela qual
   credencial/status falhou.
7. A sessao web e delegada, efemera, revogavel e vinculada ao dispositivo e
   licenca existentes. Armazenar somente prova protegida da sessao no servidor,
   sem obter, copiar, rotacionar ou substituir o token original do aparelho.
   Nao gerar codigo/chave de dispositivo ou installationId de ativacao, criar
   usuario, dispositivo, licenca, pedido de ativacao ou novo binding para web.
   Identificador aleatorio da sessao nao e uma nova identidade de dispositivo.
8. Resolver metadata, entrega do vault e C9 devem aceitar somente a sessao
   delegada realmente validada, revalidando vencimento, revogacao e status
   aplicaveis. Browser conta nos limites de reproducao/telas existentes; nao
   usar a identidade compartilhada para esconder sessoes simultaneas.
   Logout, revogacao e expiracao bloqueiam novas operacoes e encerram midia;
   alteracao do PIN remoto revoga sessoes web anteriores.
9. Catalogo, busca e EPG continuam locais; configuracao de fonte e entregue
   apenas pelo fluxo protegido ja autorizado e selada localmente. Midia
   continua direta da fonte. Nenhum proxy, relay, catalogo remoto, segredo
   embutido no cliente ou novo armazenamento de fonte e autorizado.
10. A excecao de nao gerar identidade aplica-se exclusivamente ao /app publico.
    APKs Android/TV/Fire Stick e a ativacao consolidada de instalacoes nativas
    continuam sob todas as invariantes e testes do lock. Nenhum teste pode ser
    relaxado para implementar a sessao web. O navegador local de conferencia
    nao e promovido automaticamente a fluxo publico de producao.

### Dependencia e criterios de conclusao

Emenda documental nao e login implantado. Antes de codigo funcional, registrar
allowlist exata e protocolo de cadastramento, sessao e adapters, baseado no
schema e nas funcoes reais do projeto canonico. A conexao foi conferida de
novo nesta etapa e continua sem cujbmyhitgomlgwfkaat; nao operar outro projeto
nem obter segredos locais para contornar essa restricao.

Aceitacao exige tres fatores reais; falhas/concorrencia e bloqueio3h com hora
do servidor; isolamento de gestores/clientes e verificadores; sessao delegada
sem nova identidade nem rotacao do token nativo; revogacao/expiracao e C9;
entrega autorizada da fonte, catalogo e reproducao reais no browser. Antes e
depois de mudancas funcionais, rodar o lock integral e regressao parental;
Android deve manter hashes/comportamento fora da allowlist. Nao publicar uma
tela que apenas simule esse acesso nem chamar mocks de validacao em producao.

## Fronteiras verificadas antes de codigo

- src/web-production/main.ts importa main.tsx depois de verificar contexto e
  config. main/App usam getOrCreateIdentity e ativacao de nova instalacao.
  Portanto o comportamento reportado decorre da escolha de entry C154, nao
  prova defeito de geracao de identidade Android.
- PIN parental e PBKDF2 com salt,600000 iteracoes,6 digitos; fica no registro
  local do aparelho. O servidor nao possui esse verificador. Nao e possivel
  validar no browser outro aparelho com apenas uma comparacao local nem
  presumir que codigo/chave provam conhecimento do PIN.
- Token interno do dispositivo e diferente da chave permanente. Servidor
  armazena hash do token, nao seu plaintext recuperavel. Copiar codigo/chave
  para storage do navegador, rotacionar token do aparelho ou marcar AUTHORIZED
  no cliente violaria autoridade e poderia interromper o dispositivo existente.
- Resolver remoto, vault delivery e C9 validam prova do dispositivo. Login
  web precisa sessao delegada autenticada, com validade e revogacao server-side,
  vinculada ao mesmo dispositivo/licenca, sem compartilhar seu token original.
- MCP Supabase list_projects mostra somente projeto alheio; projeto canonico
  cujbmyhitgomlgwfkaat nao esta acessivel por essa conexao. Nenhuma consulta
  privada, migration, deploy de funcao, novo banco ou mutacao foi realizada.
  Solicitada reconexao a conta correta, sem pedir chaves/senhas ao usuario.
- Captura de erro mostra etapa Catalogo, mas nao um codigo de transporte ou
  validacao. Nao atribuir causa a CORS/HTTPS/codec ou fonte sem evidencia do
  navegador autorizado. Nao reescrever URLs nem criar proxy para mascarar erro.

## Dependencias iniciais (historico; aprovacao atual registrada acima)

1. O PIN de entrada sera o parental existente ou um PIN web exclusivo definido
   pelo gestor? Usar o parental exige provisionamento autenticado de um
   verificador seguro a partir do aparelho; valores atuais nao estao remotos.
   Nao transferir PUK nem registro inteiro, nao enviar PIN em logs/listagens,
   nao escolher arbitrariamente um novo PIN que o usuario nao tenha aprovado.
2. Reconectar Supabase do agente ao projeto canonico para implantacao e
   verificacao real. Arquivo .env.local fornece config publica do cliente;
   nao concede acesso administrativo a migrations/funcões e nao sera usado
   para buscar ou expor credenciais privadas como alternativa ao conector.

## Requisitos do fluxo a implementar apos resolver as dependencias

Entry publico apresenta os tres campos antes de importar consumidor, boot,
identidade ou player. Validacao real no servidor dos tres fatores e status
da licenca/binding; nenhuma checagem de formato substitui autenticacao.
Falha generica, sem enumerar dispositivo/chave/PIN. Acesso sem PIN previamente
configurado e rejeitado. Cinco erros tolerados e sexto incorreto bloqueia3h,
com horario do servidor, contador atomico e protecao contra concorrencia.

Sucesso emite sessao web curta/renovavel/revogavel ligada a dispositivo e
licenca existentes. Nao cria usuarios, dispositivos, ativacoes, trocas de
token do aparelho ou licencas. Consumidor usa esse contexto somente no build
web publico; Android e web local consolidados preservados. C9/limite de telas,
revogacao, vencimento, parental, fonte cifrada local, catalogo/busca locais e
player direto continuam obrigatorios. Logout/expiracao fecham midia e acesso.

Antes de codigo funcional, emendar allowlist exata dos arquivos web/server,
spec de provisionamento PIN/sessao e testes com base na opcao escolhida. Validar
lock antes/depois, nao-geracao antes de login, tres fatores obrigatorios,
negativos/contadores server-side, revogacao e C9, entrega autorizada e leitura
do catalogo. Nenhum bypass do frontend, identidades copiadas ou novo login
ficticio deve ser publicado para aparentar cumprimento parcial.

## Allowlist inicial de preparacao (substituida pela etapa documental acima)

Somente este contrato, docs/evidence/C11_EXISTING_DEVICE_WEB_LOGIN.md e tres
memorias append-only; helpers privados tmp/c155-existing-device-web-login.
Nenhuma alteracao funcional/infraestrutura nesta preparacao. A implementacao
e a publicacao do novo login nao estao concluidas nem certificadas por este
documento. A falha reportada pelo usuario prevalece sobre a verificacao C154,
que cobria somente tela de ativacao, nao carregamento/reproducao autorizados.

## Resultado da consulta solicitada pelo usuario

Usuario permite mesmo PIN se nao contrariar contratos e declara que sua
criacao nao deve ser exclusiva do usuario. Leitura C126 encontrou restricao
expressa em C11_LOCAL_PARENTAL_CONTROL.md:18-21, "Sem rede/Supabase/gestor/telemetria
de PIN", e31-32, verificadores locais sem sincronizacao. Logo nao e correto
afirmar conformidade atual apenas porque PIN nao e segredo de fonte.

Proposta concreta de emenda solicitada separadamente ao usuario: permitir
somente verificador protegido/salted e validacao server-side do mesmo PIN,
sem PIN plaintext persistido, PUK, preferencias/regras/conteudos ou source;
criacao pelo gestor autenticado dentro de seu escopo. A proposta nao concede
reveal do PIN nem reset remoto do PUK. A autorizacao condicional anterior nao
e tratada como aprovacao dessa excecao depois de encontrada a proibicao.
Ate aquela consulta, C126 permanecia intacto. A resposta posterior autorizou
a emenda descrita no estado vigente acima, incluindo a reconciliacao entre
PIN do aparelho e credencial web antes de qualquer codigo funcional.

Usuario pediu orientacao para reconectar. Plugin Supabase esta instalado;
conexao MCP lista somente projeto alheio. Orientado usar Plugins/Instalados
no ChatGPT web/desktop, refazer autenticacao com a conta que tem projeto
canonico e autorizar a organizacao correta. Nao remover/reinstalar plugin ou
usar credenciais privadas como substituto da conexao. Nenhuma mudanca em
.env.local ou config global do Codex. Acesso administrativo ainda pendente.

### Conferencia apos o usuario informar reconexao

Usuario informou "Ja reconectei a conta correta" durante esta etapa. A nova
chamada list_projects continuou retornando somente o projeto alheio anterior.
Consulta direta de metadata get_project(id=cujbmyhitgomlgwfkaat) retornou
"You do not have permission to perform this action". Logo esta sessao ainda
nao comprova acesso ao projeto canonico. Nenhuma query privada, migration ou
deploy foi executada e nenhuma credencial alternativa foi buscada. Aprovacao
contratual foi resolvida; acesso administrativo real permanece pendente.

### Fechamento da emenda documental

Auditoria C155: sete documentos rastreados alterados dentro da allowlist,
dois novos documentos C155;1195 de1202 arquivos baseline preservados por
SHA256. Memorias append-only, nove snapshots intactos e15 referencias
relativas validas. AGENTS, fontes funcionais, Android, Supabase/migrations,
package/build e testes consolidados preservados. git diff --check PASS.
Lock apos emenda PASS integral26+27+9+6, sem editar suites ou criterios.
Evidencia privada amendment-audit.json e lock-after-amendment.log. Esse
resultado valida a emenda/ausencia de patch funcional, nao autentica cliente,
nao certifica source/playback reais e nao resolve a permissao administrativa.

## Fase funcional autorizada — protocolo e allowlist antes do codigo

Usuario identificou a organizacao Xandeflix Prebuilt e pediu continuar. A nova
interface do conector passou a exigir link_id; chamadas sem esse argumento
foram rejeitadas sem executar acao. Descoberta read-only das conexoes passou
a mostrar cujbmyhitgomlgwfkaat ACTIVE_HEALTHY em us-east-2 e organizacao
qqpwwnbcvxwleazbzyun. Somente essa conexao/projeto sera usada. A dependencia
anterior de acesso foi resolvida; nao repetir pedido de aprovacao da emenda.
Preflight main/origin/HEAD8d0db6a, nove documentos C155 conhecidos. Inspecao
remota limitada a schema/rotinas, sem ler registros reais de chave/PIN/source.
Lock pos-emenda26+27+9+6 serve de baseline anterior ao primeiro patch funcional.

### Protocolo

- Nova Edge Function web-device-access, verify_jwt=false pois valida seu
  proprio protocolo: LOGIN com codigo/chave/PIN; SET_PIN com JWT de gestor
  validado por auth.getUser e escopo novamente na RPC; ENROLL_PIN com prova
  nativa existente e PIN confirmado localmente. Respostas/logs sanitizados,
  POST JSON pequeno, HTTPS, no-store e limites atomicos de abuso no servidor.
- PIN remoto: PBKDF2-HMAC-SHA256/600000, salt aleatorio128bits, resultado
  protegido por HMAC de dominio exclusivo derivado no runtime da credencial
  server-side ja provisionada SUPABASE_SERVICE_ROLE_KEY. Essa chave nao e
  consultada pelo agente, enviada ao cliente, persistida no SQL ou confundida
  com a chave do cofre de source. Rotacao dessa raiz invalida o verificador e
  exige recadastramento autenticado, nunca fallback fraco. Nao exportar hash
  parental. SET_PIN/ENROLL revogam sessoes web; ENROLL com credencial remota
  existente exige confirmar o mesmo PIN, sem sobrescrita silenciosa.
- Novas tabelas private.web_access_{pins,sessions,challenges,rate_limits,audit},
  RLS e REVOKE de anon/authenticated/PUBLIC. Helpers privados sem EXECUTE
  publico. RPCs de desafio/resultado/limite/cadastramento nativo restritas a
  service_role; SET_PIN exige require_active_manager/manager_can_device com
  JWT real, sem confiar em actorId ou metadata editavel enviados pelo cliente.
- Desafio de login dura60s, uso unico, vinculado a versao da credencial.
  Resultado e tentativa gravados com row lock; sexto PIN errado bloqueia3h.
  Codigo/chave invalidos nao bloqueiam arbitrariamente o PIN de terceiros;
  limite de abuso adicional por bucket protegido do servidor. Nao resetar
  bloqueio por login concorrente, recarga, outro browser ou relogio do cliente.
- Sessao opaca xw1_+256bits CSPRNG; somente SHA256 no servidor, nunca tratar
  esse hash como bearer. Inatividade15min, prazo absoluto8h e renovacao pelo
  servidor; vencimento/revogacao/licenca/binding e versao do PIN revalidados.
  Sessao somente em RAM no browser; refresh exige novo login. Contexto devolve
  apenas identidade/licenca/sessao, nunca token nativo, hash ou segredo de fonte.
- Helper privado valida prova bruta da sessao. Adaptar somente as condicoes
  de autenticacao das RPCs metadata/self-service/C9 existentes para aceita-la;
  preservar todos os checks nativos. Cliente publico envia a prova bruta no
  parametro legado de metadata; Android continua enviando seu SHA256 normal.
  Managed vault delivery ganha apenas a alternativa de prova web validada.
- C9 continua contando todos os slots da licenca sob o mesmo row lock. Uma
  sessao web so substitui seu proprio playback, nunca o nativo ou outra aba;
  o inicio nativo preserva slots web. Campo reservado c155WebSessionId e
  escrito somente no servidor, removido de metadata fornecida pelo cliente.
  Heartbeat web confirma tambem validade da sessao web e encerra se revogada.
  Demais parametros/limites/heartbeat60s/stale120s/C9 permanecem.
- Entry /app aguarda login real antes de importar main/App. Identidade e
  autorizacao delegadas so em RAM, sem persistir/gerar registros nativos.
  Reporte de instalacao e pedido/poll de ativacao desativados somente nesse
  build. installationId solicitado pela instrumentacao representa a sessao
  ja emitida, nao uma nova instalacao/ativacao ou registro no servidor.
- Supabase Auth do consumidor isolado do gestor (sem sessao Auth persistida).
  Antes de importar App, namespace por deviceId validado para localStorage,
  sessionStorage e IndexedDB, mantendo dados entre logins do mesmo cliente e
  impedindo cache/parental/favoritos de outro cliente. Falha de isolamento
  impede boot. SDK/Filesystem, catalogo/search e source store mantem formatos.
- Logout/expiracao revogam sessao, fecham C9 e param midia antes de recarregar
  /app. Pulso servidor cada60s e verificacao ao voltar a aba; nada de fallback
  autorizado pelo relogio do dispositivo. AppUpdate/painel nativo preservados.
- Gestor recebe formulario dedicado ao PIN web no cartao do dispositivo ja
  existente. Parental recebe acao explicita de cadastramento do mesmo PIN
  apos autenticar novamente; nenhum envio automatico ao configurar o PUK ou
  carregar pagina. PINs sempre mascarados e limpos apos operacao.

### Allowlist funcional estrita

- src/web-production/main.ts; novos session-context.ts, session-storage.ts,
  login.ts, login.css, web-access.client.ts e WebPinEnrollment.tsx.
- src/device/device-identity.service.ts: guard de delegacao somente publico,
  mantendo caminho nativo e algoritmos/storage consolidados.
- src/control-plane/client/{device-activation-sync,installation-registry}.service.ts:
  retorno sem reporte/pedido so no publico; remote-control-plane-authority.ts:
  prova bruta web versus hash nativo, nenhum outro comportamento.
- src/integrations/supabase/client.ts: isolamento Auth somente publico.
- src/ui/pages/ParentalControlPage.tsx: importar/renderizar acao explicita;
  sem mudar store, PUK, classificacao ou politica local.
- src/debug/manager/ManagerPanelPage.tsx: importar/renderizar novo
  ManagerWebPin.tsx no cartao existente, sem mudar listagem/roles/ativacao.
- supabase/functions/web-device-access/{index,crypto}.ts novos;
  supabase/functions/managed-source-vault-delivery/index.ts: somente OR
  autenticado no predicado de device, sem mudar cofre/decrypt/transporte.
- Nova migration gerada por CLI com sufixo c155_existing_device_web_login.sql:
  tabelas/helpers/RPCs acima e emendas minimas guardadas das quatro rotinas
  metadata/self-service/start/heartbeat; nenhuma mutacao de dados existentes.
- scripts/test-c155-existing-device-web-login.mjs novo; test-c154-public-site.mjs
  apenas sucessao do boot/login (premissa C154 superseded), sem relaxar outros
  asserts; package.json inclui nova suite no site:build, sem novas dependencias.
- Os nove documentos C155 ja listados e helpers/evidencia privada tmp/c155.
  Nenhum outro arquivo, player, search, parse/catalogo, Android Java/Gradle,
  package-lock, cofre/source secrets, reset/install ou outro projeto autorizado.

### Verificacao/implantacao

Testar KDF/pepper, tres fatores/erros genericos, desafio uso unico, sexto erro
e concorrencia com tempo servidor, revogacao, scoping gestor, tokens/hash nao
reutilizaveis, ausencia de novas identidades, isolamento local e C9 incluindo
native/web concorrentes. SQL sintetico em transacao rollback e teste de
anon/authenticated negados; nenhum cliente/fonte reais sem acao explicita.
Rodar lock final, parental/C9/delivery, typecheck e site:build completos.
Advisors/consulta de verificacao apos DDL, sem certificar mocks como playback.
Backend aditivo antes de frontend, sempre no projeto canonico, e Git/Vercel
pela publicacao do repositorio atual ja autorizada; nao operar equipe Vercel
antiga. GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM;
GIT_PR_AUTHORIZED=NAO. Novo APK/instalacao nao faz parte desta publicacao web.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

### Refinamento de seguranca antes da publicacao

Revisao identificou que metadata C9 recebida como array/string pode impedir
o campo reservado de vincular playback a sessao web. Antes de publicar,
normalizar para objeto no servidor e manter campo reservado exclusivamente
server-side. Bloqueio do PIN tambem invalida sessoes web existentes, sem
encerrar o playback nativo do aparelho. Allowlist inclui uma segunda migration
gerada por CLI, sufixo c155_web_session_metadata_shape.sql, pois a migration
inicial ja foi aplicada; nao reescrever seu historico. Adicionar teste de
metadata nao-objeto/revogacao ao SQL sintetico em rollback. Nenhum ajuste nos
limites comerciais ou no comportamento nativo normal e autorizado.

Complemento na mesma allowlist: migration CLI c155_web_access_key_generation.sql
vincula desafio/sessao a geracao logica protegida da chave permanente vigente.
Rotacao/revogacao da chave nao pode manter um login web antigo autorizado.
Usar somente fingerprint opaco privado da geracao, sem duplicar/revelar chave
ou seu hash nativo; nenhuma escrita em chaves reais, token do aparelho ou
alteracao da ativacao nativa. Teste de troca de chave durante o desafio e de
revogacao durante playback web, preservando o nativo, em rollback sintetico.

Para verificar a Edge real com KDF e requisicoes concorrentes, permitir tambem
um fixture temporario de metadata exclusivamente sintetica, manifestado em
tmp/c155: um device/licenca/fonte logica sem URL, cofre ou conteudo, validade
dez minutos, sem auth.users/cliente real. Antes do seed, guardar SQL de limpeza
e conferir ausencia dos IDs. Remover exatamente os registros do manifesto e
verificar zero residuos no final, inclusive em falha. Nao tocar clientes,
licencas, PINs ou fontes reais. Nenhuma midia e baixada nesse teste.

## Operacao do acesso web implementado

No painel autenticado, Dispositivos, dispositivo autorizado, usar
"Configurar PIN de acesso web" e confirmar seis digitos. Para compartilhar o
mesmo valor parental, cadastrar o valor conhecido pelo responsavel. Nao ha
descoberta automatica do PIN local, reveal do PIN salvo ou reset do PUK.
O fluxo explicito "Usar meu PIN no acesso web" fica disponivel no codigo
nativo atualizado; APKs ja distribuidos nao recebem esse recurso sem rebuild.
Nao foi gerado APK neste ciclo; o cadastramento pelo painel e suficiente.

Em /app informar codigo existente XF-XXXX-XXXX, chave permanente de seis
digitos e PIN web de seis digitos. Sem credencial remota cadastrada, negar
entrada. Sessao fica em RAM, refresh exige novo login e Sair revoga a sessao.
O browser usa a licenca existente e seus limites simultaneos, sem nova
ativacao. Catalogo/busca/EPG/cofre local sao isolados por cliente validado.
Fonte precisa ser compativel com acesso direto HTTPS/CORS do navegador;
esta alteracao nao cria proxy nem certifica reproducao de uma fonte real.

Backend implantado e testes sinteticos reais concluidos; resultado detalhado
na evidencia C155. Publicacao funcional fd5a8e837a8e7ee5079b684fa11580859a95b49a
em origin/main; Vercel xandeflix2/xandeflix-prebuilt-nm3x concluida, HTTPS e
Chrome isolado confirmam /app nos dois enderecos. Painel continua em /admin.
https://xandeflix.vercel.app/app e o acesso consumidor; cadastrar PIN web no
painel antes do primeiro login. Fonte/playback real de cliente permanecem
pendentes de homologacao pelo responsavel, sem alegar sucesso de midia.

## C156 — PIN web independente e recuperacao por PUK local — 2026-10-17

Pedido posterior substitui o reuso do PIN parental C155 por cadastro separado
em Configuracoes -> PIN web. Especificacao/allowlist anterior ao codigo em
[C11_SEPARATE_WEB_PIN_RECOVERY.md](C11_SEPARATE_WEB_PIN_RECOVERY.md).
PIN web novo deve ser diferente do parental; criacao/recuperacao local exige
PUK valido e nao concede grant parental/adulto. PUK e seus verificadores nao
saem do aparelho. Servidor recebe somente chave publica ECDSA de recuperacao
e desafios efemeros; chave privada fica cifrada localmente sob PUK/AES-GCM
e nunca e persistida/transmitida em claro. Isso nao e verificador remoto do
PUK nem permite atacar o PUK com dados do servidor. Troca legitima do PUK
reencapsula localmente a chave, sem mudar prova publica ou enviar segredo.
Gestor pode criar PIN inicial; depois de cadastrado, recuperacao/redefinicao
exige prova vinculada ao PUK no aparelho, sem reset administrativo legado.
PINs C155 sem recovery exigem PIN web atual para vincular recuperacao; nao
prometer recuperacao retroativa sem essa preparacao. Bloqueio3h preservado.
Nenhuma mudanca em fonte/vault/catalogo/busca/player/identidade/licenca/ativacao.
