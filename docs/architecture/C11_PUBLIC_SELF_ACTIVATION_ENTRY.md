# C163 - Entrada publica de autoativacao

## Autoridade/preflight - 2026-10-19

Usuario solicita ativar aparelho sem gestor e relata botao de ativacao abrindo
localhost. Ciclo local C163; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Clone independente ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb. Preflight completo, AGENTS,
Architecture/Execution/Source Boundary/Activation Lock lidos; C161/C162 dirty
conhecidos preservados. Baseline hashes/copias em tmp/c163-public-activation.
Git commit/push/PR nao autorizados nesta rodada. APK corrigido recuperavel
1.0.35/code35 continua a sequencia autorizada. Sem instalacao/reset/dados reais.

## Diagnostico anterior ao codigo

ActivationPage sem VITE_PUBLIC_ACTIVATION_URL usa window.location.origin,
que no Capacitor e https://localhost. ManagerApplication publicado ignora
/#/activate-device e sempre monta painel; /activate-device retorna404.
Fluxo PublicDeviceActivationPage e Edge device-public-activation ja existem:
codigo/chave -> sessao curta -> fonte propria -> politica/licenca/autoridade
servidor. Nao criar ativacao sem prova nem alterar modo MANAGED/C9/permissoes.

Conexao Vercel lista somente xandeflix4, proibido opera-la. Destino de eventual
publicacao somente equipe xandeflix2/projeto xandeflix-prebuilt-nm3x, com
verificacao de escopo antes de deploy. Requer reconexao solicitada em paralelo;
sem acesso, concluir artefatos e registrar publicacao pendente, nunca anunciar
site atualizado. MCP Supabase exige link_id nao disponivel; nao ha mudanca
de banco/Edge que exija essa conexao. Leitura do changelog oficial realizada;
API/protocolo Supabase existentes serao preservados. Nenhum segredo solicitado.

### Retomada da publicacao - 2026-10-19

Apos usuario conectar conta xandeflix_prebuilt e reiniciar Codex, metadados
passaram a expor link_id dessa conta. Consulta sem slug recuperou projeto
xandeflix-prebuilt-nm3x/prj_OJcEZDNVPI3NV8Z1GfHOB02v20TF, proprietario
team_gHZGQz2zRhEWsyK2jfOLLD5t, dominio verificado xandeflix.vercel.app.
Listagem de equipes vazia/slug explicito403 nao provam ausencia do projeto;
acesso default da conexao correta esta verificado. Conta xandeflix4 preservada.

Publicar somente os arquivos publicos ja compilados/testados de
tmp/c154-web-production/site, sem .env, fontes privadas, APKs ou banco.
Preparacao isolada em tmp/c163-public-activation/deploy preserva bytes dos
assets e rewrites/headers canonicos. Configuracao apenas do pacote estatico:
framework Other, sem install/build remoto, outputDirectory public. Nao editar
configuracao persistente do projeto nem alterar vercel.json do repositorio.
Upload/preview e publicacao production pela API autenticada no projeto exato;
inspecionar READY e comparar paginas/assets/headers com manifesto local.
Preservar identificador da producao anterior para rollback. Registrar
publicacao e limites em evidence e append nas tres memorias. Nenhum Git write
autorizado; essa retomada nao exige commit/push/PR ou novo APK.

## Especificacao

1. Helper puro define HTTPS publico padrao
   https://xandeflix.vercel.app/activate-device. Configuracao opcional aceita
   somente origem/base ou rota conhecida publica HTTPS, sem credenciais,
   query ou host local/privado; invalida cai no padrao canonico. Nunca derivar
   de window.location.origin. Sem codigo, chave, PIN ou token na URL.
2. Dois botoes existentes chamam mesmo Browser.open/helper; manter callback
   e polling/autoridade. Secao pendente explica Ativar sem gestor, mostra URL
   publica para usar outro aparelho, mantendo codigo/chave locais existentes.
3. Manager entry monta somente PublicDeviceActivationPage na rota exata
   /activate-device ou legado /#/activate-device, apos validar configuracao
   publica canonica e antes de inicializar autoridade de gestor. Recuperacao
   de senha mantem prioridade; demais rotas continuam painel autenticado.
   Nao importar App/boot/identidade/catalogo. Formulario/Edge/licenca intactos.
4. Rewrite exato /activate-device -> manager.html, sem wildcard ou remocao de
   rotas/headers/admin/recovery/app. Ajustar teste C151 preservando asserts de
   auth/fail-closed e acrescentar casos da rota publica sem auth de gestor.
5. Validar formulario real com service sintetico isolado: codigo/chave invalidos
   nao avancam, sucesso permite fonte/sessao curta, falha nao declara ativado e
   sucesso limpa campos sensiveis. Nao ativar cliente real nem usar fonte real.

## Allowlist

- Novo src/ui/activation/public-activation-url.ts.
- src/ui/pages/ActivationPage.tsx: URL/callback externo e apresentacao da secao
  publica, sem alterar init/effects/identidade/polling/delivery.
- src/manager/ManagerApplication.tsx: ramo publico sem auth administrativa.
- vercel.json: somente rewrite exato adicional; .env.example: orientacao da
  configuracao publica opcional, sem segredo.
- scripts/test-c151-manager-production.mjs e novo
  scripts/test-c163-public-activation-entry.mjs.
- scripts/test-c154-public-site.mjs: atualizar somente a expectativa da nova
  rota exata, mantendo todas as demais regras/headers/boundaries. O assert
  anterior enumera sete rotas e precisa enumerar as oito rotas autorizadas.
- android/app/build.gradle: somente35/1.0.35.
- Este contrato; docs/evidence/C11_PUBLIC_SELF_ACTIVATION_ENTRY.md; append em
  docs/STATUS.md, docs/EVOLUTION_REPORT.md e docs/ERRORS_AND_BLOCKERS.md.
- Helpers/evidencias/artefatos em tmp/c163-public-activation, saidas habituais
  de builds/cap copy/Gradle. Preservar fontes e APKs versionados anteriores.

## Aceitacao e limites

Lock antes/depois/prebuild, regressao A1 e politica de ativacao existentes;
testes URL/rotas/Auth e fluxo real da pagina com mocks, typecheck/site:build e
build nativo, Java/recursos e APK com assinatura/package/versao/assets verificados.
Chrome real isolado valida pagina publica sem painel/identidade, erros e
sucesso sintetico. Revisao React acessibilidade/hooks sem refactor.
Nenhuma mudanca de banco/Edge/roles/politica comercial/parental/player.
Publicacao so se equipe/projeto corretos acessiveis; senao entregar resultado
local e explicar pendencia. Nao certificar ativacao real ou teste fisico por mocks.
