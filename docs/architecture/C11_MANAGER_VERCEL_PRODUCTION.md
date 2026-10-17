# C151 - painel ADMIN/MASTER em producao Vercel - 2026-10-17

## Autorizacao, preflight e destino

Usuario solicitou publicacao do painel administrativo, inicialmente acreditando
existir projeto Vercel e depois esclarecendo que deve ser criado do zero.
Proibiu explicitamente usar xandeflix4's projects e pediu nova conta/usuario
para xandeflix2. Integracao disponivel somente xandeflix4, outro projeto;
nenhuma criacao/alteracao remota realizada. CUA sem navegador, inclusive ao
tentar abrir cadastro; usuario deve concluir cadastro e conectar nova conta.
Destino externo depende dessa autenticacao e identificacao positiva.

Clone independente ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Baseline1182/copias em
tmp/c151-manager-production, proveniencia C150 conferida. AGENTS, contratos,
Boundary, lock e contrato de privilegios C70 lidos; lock inicial PASS.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C151_MANAGER_VERCEL_PRODUCTION;
NEXT_GATE_STARTED=NAO. Preparacao local/publicacao solicitadas; nao autoriza
commit/push/PR nesta autorizacao inicial, uso de outra conta, reset, APK,
mudancas de RLS/roles ou schema.

## Especificacao anterior ao codigo

- Criar entrada e build web dedicados ao Manager existente. Nao habilitar
  VITE_DEBUG_BUILD nem servir o app de consumo/diagnostico como painel publico.
  Nao montar App, boot, catalogo, parental, DevicePresentationGate ou player.
- Inicializar somente cliente Supabase publico e autoridade remota Manager
  consolidada. URL fixa ao projeto canonicamente existente cujbmyhitgomlgwfkaat;
  chave sb_publishable_ fornecida por ambiente, nunca service_role/secret/DB.
  Ausencia/configuracao incorreta falha no build e em runtime sem montar painel
  ou oferecer engine local como alternativa. Sem criar usuario/senha padrao.
- Reusar login/getAccessProfile/RPCs server-side existentes. MASTER/ADMIN
  autorizados exclusivamente pelo servidor; USER/anonimo continuam recusados.
  Nao alterar painel, adaptadores Auth, RPCs, migrations, cofres ou roles.
- Reusar recuperacao /manager-reset-password, capturando intencao/erro antes
  de inicializar SDK. Nada de senha/token/codigo de verificacao em logs/docs.
- Config Vite independente, envPrefix vazio e ambiente publico explicitamente
  limitado as2 variaveis Supabase; excluir TMDB e quaisquer outras variaveis.
  Injetar somente uma constante publica dedicada no entry, que preenche o
  runtime-config consolidado antes de criar o cliente. A primeira verificacao
  de bundle detectou que definir import.meta.env como objeto nao preservava
  a chave no resultado Vite; corrigir essa fronteira antes de publicar.
  Somente react plugin; sem API local de debug, proxy, source delivery ou
  alteracao dos builds web/native consolidados. Saida ignorada tmp/c151.../site.
- vercel.json: Vite, npm ci, manager:build, outputDirectory do painel,
  rewrites explicitos raiz /admin /master /manager /manager-reset-password
  para manager.html, sem catch-all que converta API/arquivos inexistentes em
  resposta falsa200. Headers sem framing, no-referrer e sem indexacao;
  logs/source Vercel nao publicos. Sem dependencias ou Functions novas.
- Nao enviar .env, tmp de diagnosticos, contas, catalogos ou APKs para Vercel;
  .vercelignore bloqueia esses artefatos e pasta .vercel fica ignorada no Git.
  Preservar fontes/XML Android exigidos pelo lock no contexto do build remoto;
  excluir somente builds/cache/assets gerados/configuracao local Android,
  nunca a pasta android inteira (o lock depende de manifesto e backup rules).
- Documentar import do repo main/raiz, variaveis publicas e Auth callback
  exato depois da URL real; manter URLs locais anteriores. Nenhuma alteracao
  remota Supabase nem email de recuperacao real nesta preparacao.

## Allowlist e aceitacao

Novos manager.html, vite.manager.config.ts, vercel.json, .vercelignore;
src/manager/{main.tsx,ManagerApplication.tsx,public-config.ts};
package.json somente script manager:build, .gitignore somente .vercel/;
scripts/test-c151-manager-production.mjs; docs/VERCEL_MANAGER.md;
este documento e docs/evidence/C11_MANAGER_VERCEL_PRODUCTION.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs privados tmp/c151-manager-production e saidas ignoradas usuais.

Testar ambiente publico/segredo recusado/projeto errado/config ausente,
bootstrap dedicado normal/recuperacao e falha fechada; regressao C70 de
autorizacao/escopo e C86 recuperacao. Build dedicado/typecheck/lock e builds
consolidados devem passar; bundle sem App/debug/catalog/player/TMDB/segredos.
Auditoria por hashes, scripts originais/native intactos, memorias append,
HEAD/main/index e APK149 preservados. Nao declarar login/producao verificados
antes de publicar no destino correto e testar sessao real autorizada.

Criacao/deploy externos somente apos nova conexao correta, comprovacao de
owner/projeto/repo/ambiente e artifact pronto. Se indisponivel, entregar
configuracao concreta revisavel e informar pendencia sem usar a conta proibida.

## Emenda de publicacao Git, antes das alteracoes - 2026-10-17

Usuario solicitou expressamente FAÇA O COMMIT E PUSH DO PROJETO.
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO.
Escopo: versao local cumulativa C133-C150 conhecida e preparacao C151 pronta
e validada, no mesmo origin/main. Conferir HEAD remoto e proveniencia, revisar
diff e segredos antes de stage/commit; preservar .env/artefatos ignorados e
APK. Nenhum force push/merge/cherry-pick/outro repo ou publicacao Vercel em
conta proibida. Memorias/evidencia registram SHA, testes e resultado reais.
Um segundo commit exclusivamente de evidencia/memorias pode registrar o
primeiro push confirmado. Conferir novamente remoto e arvore limpa, sem
amend/force ou mudanca funcional nesse fechamento.
