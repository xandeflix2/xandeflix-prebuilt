# C11 — Checkpoint Git local e análise de publicação — 2026-10-05

## Sucessão autorizada — publicação documental — 2026-10-05

Novo pedido nominal de commit/push autoriza agora publicar os oito registros
da migração independente, conforme [plano vigente](../architecture/C11_INDEPENDENT_GIT_MIGRATION.md).
Afirmações de registros "LOCAIS/não publicados" abaixo eram verdadeiras nos ciclos
anteriores, não proibição permanente. Só main/origin normal; nenhum patch funcional,
backend/deploy, APK, aparelho, exclusão ou novo Gate. Resultado do envio será
conferido por refs/árvore/status; arquivos operacionais e backups não entram.

## Atualização de armazenamento local — 2026-10-05

As advertências abaixo sobre Git compartilhado documentam a situação anterior.
A C11 recebeu `.git` próprio na [migração administrativa autorizada](C11_INDEPENDENT_GIT_MIGRATION.md),
com o mesmo checkpoint publicado e todos os arquivos locais preservados em backup.
A pasta histórica continua retida, mas não é mais dependência da C11. Nenhuma
nova publicação Git/deploy nem autorização de exclusão neste ciclo.

## Entrega Git autorizada — registro local — 2026-10-05

Usuário autorizou nominalmente enviar os quatro commits à main do repo esperado.
Spec de entrega no plano antes do push; GIT_PUSH_AUTHORIZED=SIM;
GIT_COMMIT_AUTHORIZED=NAO_NOVO_COMMIT; GIT_PR_AUTHORIZED=NAO;
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Registros desta entrega mantidos
localmente, sem criar/publicar um quinto commit. Seções abaixo são checkpoints
anteriores e não devem ser interpretadas como retenção vigente desta autorização.

Preflight C11/main/origin esperado, HEAD fd2f561f55aa002534b4f724f5b557755d486a95;
tracked/índice limpos antes do registro e sete operacionais preservados. Remoto
vivo e99f830a24b5de6dd74b4397f1ed6f0995bc8483, ancestral do HEAD: fast-forward.
Quatro commits revisados:0eb3272,f0fdb68,995de5f,fd2f561. Nenhuma edição funcional,
teste relaxado, novo build ou instalação; validações anteriores não reexecutadas.
Skill Supabase separa publicação dos arquivos históricos de migrations/funções
de aplicação no ambiente real: não executar db push/repair/deploy nem alterar
integrações. Nenhuma declaração de beta>100, Fire<=60s ou HTTP403 resolvido.

### Resultado fechado — envio dos quatro commits

Push normal origin refs/heads/main:refs/heads/main aceito, exit0:
e99f830..fd2f561, Done. Sem force, amend, novo commit, PR ou outra ref.
git ls-remote e GitHub REST confirmam main
fd2f561f55aa002534b4f724f5b557755d486a95; origin/main==HEAD e ahead/behind0/0.
Os quatro SHAs conferidos individualmente via GitHub; árvore do último commit
4311479d4d7d37ce71dfccc844f661764ab34665 igual à árvore local/tracking.
Verificação posterior GitHub:0 check-runs,0 workflow runs,0 deployments retornados.
Não é promessa de ausência universal de efeitos futuros em serviços externos.

Checagem auxiliar inicial git rev-parse HEAD^{tree} sem aspas foi interpretada
pelo PowerShell como scriptblock e adicionou -encodedCommand; não retornou árvore
válida. Push já tinha terminado com sucesso; nenhuma nova escrita/novo push.
Reexecução com 'HEAD^{tree}'/'origin/main^{tree}', exitcodes verificados e consulta
GitHub independente confirmaram a árvore correta. Falha registrada também em
ERRORS_AND_BLOCKERS; allowlist documental estendida antes desse registro.

433 hashes reconferidos:405 runtime e sete operacionais byte-idênticos à baseline
validada; demais candidatos funcionais preservados. Diferenças somente registros
documentais. APK8785127bytes/SHA256
F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8 intacto.
Índice vazio; sete operacionais não rastreados continuam fora do repo. Plano,
evidência e memória do erro auxiliar são alterações LOCAIS desta entrega, não
entraram nos quatro commits publicados; nenhum quinto commit criado/solicitado.
Nenhum db push/repair/function deploy, backend write, instalação/reset, rebuild,
limpeza ou novo Gate. Pasta do Git comum preservada, não apagar após publicação.

## Novo checkpoint das duas entregas recentes — 2026-10-05

Pedido atual: "prossiga com o commit e analise para o push"; commit local
expressamente autorizado, push/PR/deploy NÃO executados neste ciclo. Emenda e
manifesto literal de21 arquivos definidos antes do staging no plano canônico.
Parent esperado995de5f767a14276bc2f4ca58944e4f7af95ca4e; main remoto vivo
e99f830a24b5de6dd74b4397f1ed6f0995bc8483, três commits locais anteriores.
Índice inicialmente vazio;19 candidatos recentes mais este registro e plano.
Identificar o novo checkpoint pelo assunto
`feat(c11): isolate device sources and preserve activation key visibility`.
SHA efetivo e auditoria pós-commit são conferidos no terminal, não pré-fixados
em documento que integra o próprio commit. Os registros abaixo são históricos
do primeiro checkpoint; seus contadores/hash de APK não são os valores atuais.

Proveniência: specs/evidências C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION e
C11_ACTIVATION_KEY_VISIBILITY. Revisados form/workflow, wiring do gestor,
Header/CSS e diff da ActivationPage. Nenhum novo patch funcional, mudança de
contrato/autoridade, relaxamento de teste ou alteração de dependência/CI/SQL.
Sete utilitários operacionais continuam excluídos e preservados; APK ignorado.

### Validações repetidas nesta consolidação

- Lock:22 ativação+27 promoção=49 PASS,9 controles negativos PASS; repetido
  pelo prebuild. Invariantes de geração/persistência/boot/backup mantidas.
- Visibilidade da chave:18 PASS com --compare-head, incluindo AST dos efeitos/
  handlers/status e reprodução do defeito no parent. Após incorporar o patch
  ao HEAD, o caso opcional de reprodução antiga deixa de se aplicar; contador
  menor nesse modo não é teste relaxado nem regressão.
- Fonte exclusiva:31 PASS; dois fluxos de ativação do gestor:20/20 PASS.
- Layout/policy:18 casos+hook real PASS; aviso de playback:11 PASS.
- Typecheck PASS; build web414 módulos PASS13,97s, com prebuild obrigatório;
  nenhum warning de crypto externalizado. Avisos anteriores node:fs/node:path,
  imports mistos e chunk grande continuam e não foram ocultados/corrigidos.
- R2F2B0 manager-form repetido:14/15, exit1; T15 exige frase ausente também
  no parent995de5f. Falha textual preexistente, não regressão dos dois patches;
  nenhum ajuste fora do escopo. Não declarar todas as suites do repo verdes.
- Browser, Gradle, assinatura e instalação física são evidência histórica das
  duas entregas, NÃO reexecutados aqui. Sem cap sync/Gradle/update/launch/reset.
  Testes repetidos usam fixtures/mocks, sem backend real ou carga remota.

Varredura sanitizada:455 fontes textuais/5895083bytes dos21 candidatos e blobs
alterados em cada um dos três commits inéditos. Zero chaves privadas/tokens
GitHub/sb_secret/Stripe live/AWS/service_role JWT detectados. Scanner inicialmente
exit1 por três URLs do teste scripts/test-real-source-adapter.mjs no0eb3272,
linhas135/223/327: revisadas como entradas sintéticas de detector/sanitizador,
com host marcado example/test e sem request; arquivo atual idêntico ao blob.
Nenhum valor de URL/credencial foi impresso. Os três alertas são classificados,
não removidos por alteração de teste nem tratados como segredos de cliente.
Não é certificação universal do histórico/binários ou ausência de todo segredo.

433 hashes congelados antes deste ciclo para runtime/candidatos/operacionais;
reconferência pré-staging confirmou428 byte-idênticos e somente os cinco registros
documentais alterados;405/405 runtime e sete operacionais intactos. APK atual
8785127bytes/SHA256
F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8
preservado. Nenhum APK/segredo/catálogo/captura real incluído no manifesto.

### Análise do push — evidência atual e limites

GitHub connector e CLI: repo esperado/public/main, permissão push=SIM e
admin=NAO; zero workflows/runs/environments/deployments/check-runs/statuses,
zero rulesets retornados. Estado combinado pending sem statuses NÃO prova
pipeline pendente. Hooks e branch protection HTTP404: não verificáveis nesta
credencial, NÃO listas vazias/prova de ausência. Sem hooks locais ativos ou
core.hooksPath customizado; identidade de autor Git configurada, não alterada.

Vercel connector: zero projetos ligados ao URL exato do repo no escopo padrão
e na única equipe acessível. Limite: não cobre outras contas/equipes/provedores.
Supabase metadata confirma projeto cujbmyhitgomlgwfkaat/Xandeflix Prebuilt,
us-east-2/ACTIVE_HEALTHY; não foi executada query de cliente ou write remoto.

Usuário enviou primeiro catálogo /integrations com pesquisa vazia, insuficiente
para concluir deploy. Depois enviou capturas da configuração correta
/settings/integrations: repo xandeflix2/xandeflix-prebuilt conectado, working
directory ".", Deploy to production visivelmente DESLIGADO; branching indisponível
na tela do plano atual. Seção Vercel oferece instalar integração, não mostra
vínculo instalado. Evidência fornecida pelo usuário, não leitura live independente
nem alteração/salvamento de opções pelo agente. Resolve a incógnita observada
do deploy de produção Supabase, não certifica webhooks/GitHub Apps externos.

Skills Supabase/Vercel separaram publicação Git de deploy/migração; documentação
oficial atual confirma que Deploy to production habilitado aplica migrations,
Edge Functions declaradas e buckets. Changelog consultado em memória; sem upgrade.
[Documentação Supabase](https://supabase.com/docs/guides/deployment/branching/github-integration).
Fetch inicial markdown pelo navegador de pesquisa recusou content-type; leitura
HTTP direta em memória confirmou o changelog, sem salvar arquivo ou mudar projeto.

Usuário enviou depois as capturas administrativas do repo correto:
/settings/hooks com lista vazia; /settings/installations com somente Supabase.
Não é ausência de App: o App instalado existe, mas sua configuração de produção
mostrada anteriormente está OFF. Capturas são evidência fornecida pelo usuário;
não foram arquivadas no Git nem substituídas por interpretação do HTTP404.
Incógnita administrativa anterior esclarecida; nenhuma integração alterada.

Push continua não executado: este pedido autoriza análise, não execução do push.
Conclusão pelas evidências disponíveis: nenhum gatilho de deploy de produção
identificado; checkpoint apto para propor push normal de main após confirmação
expressa e reconferência do remoto/fast-forward. Não é garantia universal sobre
outros provedores/contas ou automações fora das superfícies inspecionadas.
Nenhuma integração desabilitada, backend reconciliado ou drift de migrations
reparado. Drift remoto46/local44 documentado anteriormente não foi reconsultado
nem resolvido neste ciclo. Revalidar remoto antes de eventual fast-forward;
não fazer force-push. Meta Fire<=60s/beta>100/HTTP403 remoto seguem pendentes.
Git comum ainda na pasta histórica: não apagar a pasta antiga depois do push.

## Escopo e resultado verificável

Consolidação do código C11 no Git existente xandeflix2/xandeflix-prebuilt,
branch main; não há merge de árvores nem novo backend/banco. Commit local
autorizado no plano; push condicionado, NÃO executado por integração de deploy
desconhecida. Identificar o checkpoint local pelo assunto
`chore(c11): consolidate validated activation playback and responsive UI`.
Plano/allowlist: [C11_GIT_CONSOLIDATION](../architecture/C11_GIT_CONSOLIDATION.md).

Preflight anterior: HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba, main/origin
e99f830a24b5de6dd74b4397f1ed6f0995bc8483 (reconsultado, sem divergência);
dois commits locais anteriores,49 modificados/64 não rastreados, índice vazio.
Manifesto revisado106 arquivos preexistentes+plano/evidência=108 arquivos.
Sete utilitários/captura operacionais excluídos pelo plano, preservados localmente.
Não usar git add .; APKs/env/forensics/tmp/builds/credenciais não entram no índice.

## Validações novas, locais e sem backend real

- Lock antes:22 casos de ativação+27 promoção de catálogo=49 PASS e9 controles.
- Lock após whitespace e no prebuild: mesmos49+9 PASS; sem contornar guard.
- Typecheck: PASS. Git diff --check: PASS após retirada da linha vazia no EOF.
- Avisos de reprodução:11 PASS; sessões playback:10/10; contrato VOD:12/12.
- Política lateral:18 casos+hook real PASS. Orientação mobile: guarda+5 negativos;
  fundo fullscreen: guarda+5 negativos. São testes de política/call sites,
  não novas medições físicas de rotação ou opacidade em aparelhos.
- Retenção de bridge: PASS com controle de logging e4 negativos de configuração.
- Retenção/importação:100000 registros sintéticos,88 segmentos e integridade PASS;
  peak heap observado22,65MiB neste harness, sem certificar heap do Fire Stick.
- Importação bounded:250000 registros sintéticos e83 testes PASS. RSS observado
 89→282MiB em Node com armazenamento em memória, não medição Android ou SLA.
- npm run build: PASS;412 módulos, sem externalização de crypto. Persistem avisos
  de node:fs/node:path nos helpers de provisioning, imports mistos e chunk>500kB.

Testes isolados/mocks, nenhum load test remoto ou stress>100 dispositivos.
Não repetir instalação, desinstalação, cap sync ou Gradle para esta publicação.
Verificação anterior de navegador/aparelhos é histórica, não reexecutada neste ciclo.

## Integridade, provenance e segurança

Antes da edição,107 candidatos congelados por SHA-256. Após testes/build,
única diferença fora dos registros deste checkpoint foi storage: somente uma
linha vazia no fim. Reconstrução em memória do sufixo de newline reproduziu
exatamente o hash pré-edição, sem mudar código funcional.404 dos405 consolidados
byte-idênticos ao baseline entregue; único arquivo distinto é esse whitespace.
Nenhuma relaxação de teste, alteração funcional de ativação/player ou SQL.

APKs atual e último backup mantidos byte-idênticos. APK atual9062069bytes,
SHA256 EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F.
É o APK debug existente, não um novo release assinado nesta etapa.
Backup Git local completo de HEAD/origin/main gerado/verificado em
tmp/c11-git-before-consolidation-20261005.bundle;1372779bytes. Não é backup
de banco, de env/segredos ou das alterações dirty ainda não commitadas.

Varredura literal em502 fontes textuais/8880720bytes, incluindo cada um dos
dois commits inéditos: zero chaves privadas/tokens GitHub/sb_secret/service_role
JWT/Stripe live/AWS detectados. Não é certificação universal de segredos/histórico.
URLs/códigos sinalizados foram revisados como exemplos/fixtures/formato em
testes/docs/sanitizador; nenhum valor privado foi impresso pela varredura.
As duas capturas de ativação são sintéticas e não cadastradas, conforme sua
evidência de origem, inspecionadas visualmente. Recursos PNG/JAR já rastreados
não foram submetidos ao scanner textual. Não incluir captura real nem log operacional.

## Bloqueio do push e limites da beta

Usuário não sabe se há deploy automático. GitHub CLI reportou zero workflows,
runs,deployments,environments,check-runs e statuses do HEAD remoto. Webhooks
HTTP404: acesso indisponível, não evidência de lista vazia. Supabase sem branches
de desenvolvimento não prova que a integração GitHub esteja desligada.
Nenhuma configuração de Apps/integrations/hooks/deploy foi alterada.

Skill Supabase orientou separar checkpoint de código de mudança de ambiente.
Projeto esperado cujbmyhitgomlgwfkaat confirmado ACTIVE_HEALTHY;46 migrações
registradas no remoto versus44 arquivos locais, com timestamps históricos
divergentes. Não executar db push, migration repair/apply ou function deploy.
Antes de publicar main, inspecionar Project Settings>Integrations>GitHub no
Supabase e integrações/Apps/webhooks do repo com permissão administrativa.
Opção Deploy to production habilitada pode aplicar migrações/funções no push:
[documentação oficial](https://supabase.com/docs/guides/deployment/branching/github-integration).

Meta Fire Stick<=60s continua aberta; stress>100 simultâneos não executado.
CI remoto, release/chave de assinatura e revisão formal de TARGETs históricos
ficam para autorização posterior, não afirmar MVP/beta completamente homologado.
Git comum está em C:\Xandeflix\xandeflix-prebuilt\.git: não apagar pasta antiga
ou .git apontador da C11. Push não elimina essa dependência física da worktree.
Original Dropbox/com.xandeflix.app permanece protegido. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; sem backend write, aparelhos/reset, exclusão, PR ou force-push.
