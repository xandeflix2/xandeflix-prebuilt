# C155 - verificacao inicial e dependencias - 2026-10-17

Baseline1202, HEAD8d0db6adf82007204be7891809f0d306c109bc33, clone/main/origin
canonicos, originalmente limpos. Escopo/preflight e requisitos no contrato
C11_EXISTING_DEVICE_WEB_LOGIN.md. Nenhuma mudanca funcional nesta etapa.

Leitura do entry publico/App confirmou uso do fluxo de primeira instalacao;
nao ha login web com tres credenciais. PIN parental usa verificadores PBKDF2
locais sem servidor; token interno do dispositivo nao e a chave permanente.
Copiar identidade ou inventar token AUTHORIZED no browser nao resolve essa
fronteira e nao foi implementado. Screenshot confirma falha em Catalogo,
sem dados para atribuir com certeza a transporte/CORS/HTTPS/fonte.

Lock oficial antes da mudanca funcional futura PASS26+27+9+6. Nao houve
build/APK, novo login, deploy, migration, alteracao de identidade/licenca,
fonte ou reproducao. A verificacao C154 continua restrita a entry/ativacao.

Supabase list_projects retornou somente projeto de outra aplicacao, sem
projeto cujbmyhitgomlgwfkaat. Nenhum acesso privado ou mutacao tentado em
projeto alheio. Plugin-management encontrou Supabase instalado; consulta de
dependencias com plugin_id foi recusada pelo schema (requer plugin_reference),
segunda consulta por nome nao identificou release. Nao houve reinstalacao,
desconexao de contas, alteracao de permissoes ou tentativa de contornar acesso.
Orientacao via OpenAI Docs diferencia plugin instalado de conexao autorizada.

Leituras de caminhos presumidos inexistentes e globs posicionais Windows
falharam; inventario rg e filtros --glob corrigiram leitura. Documentos foram
lidos antes de alterar runtime. Changelog Supabase via web nao aceitou MIME
markdown; GET direto HTTP200 em RAM, sem dados privados, e docs oficiais de
auth Edge consultadas. Nenhuma nova dependencia.

Usuario condicionou reutilizar PIN a conformidade. C126:18-21 e31-32 proibe
Supabase/gestor/rede para PIN e exige verificadores sem sincronizacao.
Solicitada emenda limitada concreta (verificador protegido, sem PIN plaintext,
PUK/source/conteudo; criacao por gestor com escopo). Ainda nao aprovada;
contrato C126 e Source Boundary nao foram alterados. Reconexao Supabase
tambem depende de acao do usuario. Nao alegar implantacao concluida.
NEXT_GATE_STARTED=NAO.

## Emenda limitada autorizada e registrada — 2026-10-17

Usuario confirmou expressamente prosseguir com a emenda limitada depois da
leitura de AGENTS/Architecture. A pendencia contratual anterior foi resolvida.
Preflight novamente main/origin/top-level canonicos e HEAD8d0db6a; dirty
somente cinco documentos C155 de preparacao, com proveniencia conhecida.
Allowlist ampliada no contrato C155 antes dos quatro documentos normativos.
Snapshot dos nove documentos antes da emenda em
tmp/c155-existing-device-web-login/amendment-before, sem segredos.

Emenda reconciliada entre C126, Architecture Contract, Source Data Boundary
e Activation Lock: autenticacao web exige tres fatores e credencial privada
protegida; mesma chave PIN exige cadastramento autenticado, nao exportacao do
registro local. Gestor com escopo pode cadastrar credencial web; nao ganha
reveal/reset parental ou PUK. Sessao delegada sem nova identidade/ativacao ou
rotacao do token nativo, com revogacao/licenca/C9; sexto PIN incorreto bloqueia
3h com contador atomico/hora do servidor. Catalogo/busca/EPG locais, cofres e
midia direta preservados. Sem patch funcional, SQL, migration, deploy ou APK.

Usuario informou reconexao Supabase. Nova listagem ainda retornou somente
projeto alheio; get_project no ref canonico recusou permissao. Nenhuma query
privada ou mutacao de outro projeto foi tentada. A dependencia agora e acesso
administrativo real nesta sessao, nao nova aprovacao da emenda.

Primeiro patch multi-documento foi rejeitado integralmente por contexto final
do Activation Lock escrito sem os acentos existentes. Diff confirmou nenhuma
aplicacao parcial; leitura UTF8 e contexto exato corrigiram o patch. Nao houve
falha de runtime, rollback de arquivos ou relaxamento de criterio.

Validacao documental e hashes registrados no fechamento abaixo. Emenda local
nao significa login implantado; nao publicar tela com autenticacao ficticia.

### Resultado da auditoria documental

tmp/c155-existing-device-web-login/amendment-audit.json PASS: baseline1202,
1195 hashes preservados, sete documentos rastreados alterados na allowlist,
dois novos documentos C155, nove snapshots intactos, tres memorias append-only
e15 links relativos existentes. Todos os arquivos funcionais, Android,
Supabase/migrations, package/build, testes consolidados e AGENTS intactos.
git diff --check PASS. Lock repetido apos emenda: PASS26 ativacao+27 promocao+
9 controles negativos+6 caminhos C153; log privado lock-after-amendment.log.
Sem novo build/APK/Git ou publicacao. Acesso remoto recusado continua impedindo
implantar e validar o fluxo real; testes existentes nao certificam novo login.

## Implementacao funcional e backend real — 2026-10-17

A interface atual do conector exige link_id. A conexao canonica confirmou
projeto cujbmyhitgomlgwfkaat, Xandeflix Prebuilt, us-east-2, organizacao
qqpwwnbcvxwleazbzyun. Dependencia anterior resolvida sem alterar outro projeto.
Allowlist/protocolo/refinamentos registrados antes do codigo e das migrations.
Baseline funcional continua HEAD8d0db6a; AGENTS e workspace historico intactos.

Implementados login publico com tres dados antes de importar App; delegacao
em RAM sem gerar identidade/chave/ativacao/reporte; isolamento localStorage,
sessionStorage e IndexedDB por dispositivo validado; Auth do consumidor
separado do gestor; verificacao periodica/retorno a aba e logout com parada
de midia. Cadastro explicito no painel e opcao de confirmar PIN local no
codigo nativo. Nenhum PUK, registro parental ou fonte trafega nesse cadastro.

Servidor: verificador PBKDF2-HMAC-SHA256/600000 com salt aleatorio e HMAC de
dominio derivado dentro da Edge de credencial server-side ja existente,
jamais consultada pelo agente. Tabelas privadas com RLS/revogacao de grants;
desafios atomicos uso unico; sexto PIN incorreto bloqueia3h pela hora do
servidor; sessao opaca de256bits, hash privado nao utilizavel como bearer,
15min inatividade/8h absoluto. JWT real+escopo para gestor; token nativo real
para enrollment. RPCs de metadata/self-service/C9 preservam caminho nativo.

Migrations locais e historico remoto retornado pelo MCP:

| Arquivo local | Versao aplicada pelo MCP | Nome |
| --- | --- | --- |
| 20261017210203 | 20261017211643 | c155_existing_device_web_login |
| 20261017212334 | 20261017212409 | c155_web_session_metadata_shape |
| 20261017212843 | 20261017212947 | c155_web_access_key_generation |

MCP gerou os timestamps remotos; nao houve reescrita de historico. Funcoes
web-device-access v1 e managed-source-vault-delivery v3 ACTIVE. A entrega
gerenciada mudou somente um OR no predicado de autenticacao, comparado ao
arquivo exato v2 remoto/HEAD; decrypt, cofre e transporte intactos. Hashes:
web-device-access ezbr3f4c2b70305ba4f95c020c3ea34533f833cdc70dcb60f70f395b31c705b34119;
delivery ezbr6a98362a0295b3348535eac9335d385433758634643421467580fb58773050ba.
Nenhum segredo ou valor privado de cliente foi consultado/impresso.

SQL real em transacao com rollback PASS: tres fatores, desafios/replay,
concorrencia, sexto erro/prazo3h, bloqueio invalida sessao web, troca de
PIN/chave e rotacao durante desafio revogam; hash nao e bearer; anon/gestor
sem escopo negados; C9 conta nativo e browsers independentemente, nao permite
forjar vinculo por metadata, mantem token e heartbeat nativo. Campos C9
array/string/null/number normalizados antes do campo reservado do servidor.

HTTPS real da Edge PASS: enrollment KDF real; login; metadata autorizada;
delivery autorizado ate etapa VAULT sem cofre/segredo sintetico; C9 start;
seis erros paralelos; hora futura fornecida pelo cliente nao evita bloqueio;
sessao anterior/heartbeat negados; hash rejeitado; logout e preservacao da
prova nativa. Segundo login passou somente apos expirar artificialmente a
linha do fixture no servidor. Nao aguardou3h nem alterou bloqueios reais.
Fixture isolado de metadata sem URL/cofre/conteudo/auth.users criado com
manifesto e limpeza previa; todos seus registros removidos e verificados,
estado privado active=false. Nenhum cliente/fonte/licenca real foi editado.

## Validacao local e limites

- Lock antes/depois/em site:build PASS26 ativacao+27 promocao+9 negativos+
  6 caminhos C153. Parental C126 PASS16, sem requisicoes/backend/aparelhos.
- C9 runtime wiring PASS10/10; SELF_SERVICE delivery A-F PASS; tsc PASS.
- site:build completo PASS: dois builds Vite, montagem, C151 gestor7/7,
  C154 publico8/8 e C155 login11/11. Nenhuma nova dependencia.
- Chrome real isolado PASS: tres campos obrigatorios, chaves mascaradas,
  storage/IndexedDB vazios antes de login, nenhuma ativacao/identidade gerada;
  namespaces Storage e IDB reais preservam chave de gestor fora do namespace.
  Screenshot da tela conferido. Perfil/navegador do usuario nao acessados.
- Auditoria funcional PASS: baseline1202,1184 hashes intactos,18 arquivos
  rastreados e15 novos estritamente permitidos; memorias append-only;
  APK C149 hash preservado; um predicado de delivery;22 artefatos publicos
  sem literais privados conhecidos ou padroes de segredo; diff --check PASS.
- Advisors: tabelas privadas com RLS sem policies sao deny-all intencional;
  RPCs SECURITY DEFINER context/logout anonimas autenticam capability bruta;
  SET_PIN/can_manage exigem JWT/role/escopo. Grants/provas testados. Avisos
  preexistentes de outras funcoes/search_path e leaked-password protection
  nao foram alterados; nao declarar auditoria global sem achados.
- Wrapper antigo test-c9-concurrent-session-enforcement passa33 checks e
  falha ao importar script C8 ausente ja em HEAD8d0db6a. Limite preexistente
  confirmado; arquivo nao inventado, testes nao relaxados. Testes focados e
  integracao SQL/HTTP C9 passaram. Nao afirmar wrapper completo aprovado.

Revisao reproduziu falha de metadata C9 nao-objeto perder o vinculo de
revogacao; corrigida pela segunda migration e retestada. Terceira adicionou
geracao de chave para invalidar sessoes/desafios antigos. Seed sintetico
respeitou guard de capacidade existente apos preparar operacao autorizada
do proprio fixture; nenhuma trigger desabilitada. key_version sintetico
foi encurtado para limite32 apos transacao rejeitada. Patches com contexto
inexato foram rejeitados e reaplicados apos leitura; nenhuma perda de codigo.
Helper de auditoria corrigiu trim indevido de status Git/BOM de JSON PS e
marcador de teste; assertions de escopo/segredo permaneceram integrais.
Tela de login recebeu posicao viewport para evitar scroll por margem padrao,
com rebuild e Chrome PASS. Changelog MIME nao suportado pelo web foi lido
HTTP200 em RAM; nenhuma dependencia adicionada. Evidencias privadas em tmp/c155.

Backend real e frontend local concluidos. Commit/push/publicacao frontend
pendentes deste registro. Fonte/catalogo/playback real de cliente nao testados:
sucesso de autenticacao nao e certificacao de codec/CORS/HTTPS ou catalogo.
Nenhum APK novo, instalacao/reset de aparelho ou alteracao no projeto protegido.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
