# C163 - Entrada publica de autoativacao - 2026-10-19

## Autoridade e proveniencia

Usuario solicita ativacao sem gestor e informa botao abrindo localhost.
Spec antes do codigo: docs/architecture/C11_PUBLIC_SELF_ACTIVATION_ENTRY.md.
Clone independente ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb. Preflight completo, AGENTS,
Architecture/Execution/Source Boundary/Activation Lock lidos.
CURRENT_GATE=NONE; CYCLE=C163; NEXT_GATE_STARTED=NAO. Baseline1251 arquivos
e copias privadas preservam C161/C162, APK1.0.34 e demais dirty conhecidos.
Sem operar pasta historica/projeto original. Git writes nao autorizados.

## Causa e patch

Fallback window.location.origin montava https://localhost/#/activate-device
no Capacitor. Entrada administrativa publicada nao tratava o hash publico;
/activate-device retornava404 na consulta publica. Fluxo publico de codigo/
chave, sessao curta, fonte propria e validacao de licenca ja existia.

Helper agora usa https://xandeflix.vercel.app/activate-device, ou configuracao
HTTPS publica valida normalizada uma unica vez. Nao inclui codigo/chave/PIN/
token na URL e rejeita localhost/IP/credenciais/query/rotas inesperadas.
Ambos botoes existentes usam esse helper. Secao Ativar sem gestor mostra
orientacao/endereco para outro aparelho. Mesmos init/effects/polling/delivery.

ManagerApplication recebe ramo publico exato /activate-device e hash legado
na raiz, antes da autoridade administrativa. Recuperacao mantem prioridade;
demais rotas continuam painel. Rewrite exato adicional, sem wildcard;
rotas/headers existentes preservados. Formulario publico, Edge, banco, roles,
licenca, C9, fonte, protocolos de playback e identidade nao modificados.
.env.example documenta URL opcional. Versao Android35/1.0.35.

## Validacao

- Lock oficial antes, prebuild e final PASS, inclusive negativos.
- C1518 testes e C1636 casos PASS, incluidos no CI existente sem mudar
  package.json. Callback real extraido por AST verifica abertura externa a
  partir de https://localhost; formulario real com adaptador sintetico verifica
  codigo/chave antes da fonte, falha preservada e limpeza no sucesso.
- Chrome real isolado: entrada real de manager/formulario, rota direta e hash
  legado, desktop/mobile390px sem overflow, chave invalida bloqueada, sessao
  valida, falha de conclusao e retry/sucesso. Zero chamadas a autoridade de
  gestor, zero escritas reais; capturas desktop/mobile inspecionadas.
- API publica real sem sessao de gestor: OPTIONS200; START com dados vazios
  devolve400/DISPLAY_CODE_INVALID antes de RPC de banco. Nao ativou cliente
  nem usou fonte real. Positivos do formulario sao sinteticos.
- npm run site:build PASS apos atualizar whitelist exata C154 de7 para8 rotas;
  demais asserts de headers/auth/boundary mantidos. C151-C160 concluidos.
  C151 integrado a C163 repetido apos incluir a nova suite: PASS.
- npm run build, cap copy android e :app:assembleDebug PASS,119 tarefas.
  Testes JVM206/35 suites aprovados em C162; nao executados novamente em
  C163, que nao muda Java/recursos de player. Nao afirmar teste fisico.
- Auditoria1251 arquivos PASS: allowlist, lifecycle de ativacao via AST,
  mesma configuracao Vercel exceto rota, C161/C162 e APK anterior preservados,
  memorias append-only e bundle publico sem DeviceIdentityService.

Evidencias/logs/helpers privados em tmp/c163-public-activation; site compilado em
tmp/c154-web-production/site. Sem fonte real, instalacao, reset ou novo Gate.

## APK e publicacao

Arquivo: tmp/c163-public-activation/Xandeflix-v1.0.35-C163.apk
Package=com.xandeflix.prebuilt; versionName=1.0.35; versionCode=35.
Bytes=11402768; SHA-256=12e308ee729d028621a2b21e94c609c32081615964ae29c1397da858963c34a7.
apksigner verifica mesma assinatura de1.0.34; aapt2 confirma package/versao;
8 assets iguais ao dist; index contem URL publica canonica;
Capacitor HTTPS sem server.url de desenvolvimento. APK debug para testes,
nao instalado automaticamente. Anteriores preservados.

PUBLICACAO=PENDENTE. Integracao Vercel mostra somente xandeflix4, proibida
pelo usuario. Destino permitido xandeflix2/xandeflix-prebuilt-nm3x ainda sem
acesso; reconexao solicitada, sem resposta ate este registro. Nenhum deploy,
commit, push ou PR realizado. APK novo depende da publicacao da pagina para
autoativacao completa: nao anunciar corrigido em producao. Sem mudanca de
schema/Edge; nenhum segredo solicitado ou registrado.

## Retomada e publicacao concluida - 2026-10-19

Este registro supera somente a pendencia de publicacao acima. Usuario vinculou
conta xandeflix_prebuilt e reiniciou Codex. Metadados renovados passaram a exigir
link_id e expuseram a conexao correta. Duas chamadas iniciais sem esse novo
argumento foram rejeitadas antes da API; leitura de schema corrigiu selecao.
Consulta list_teams vazia e slug xandeflix2 com403 nao impediram get_project
no escopo default da nova conexao: projeto e proprietario exatos confirmados,
dominio xandeflix.vercel.app verificado. Nenhuma operacao na conta xandeflix4.

Projeto=prj_OJcEZDNVPI3NV8Z1GfHOB02v20TF/xandeflix-prebuilt-nm3x.
Owner=team_gHZGQz2zRhEWsyK2jfOLLD5t. Producao anterior preservada:
dpl_3ScanRviA556THeV8UZoPh5xgPF6, repo xandeflix2/xandeflix-prebuilt,
base HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb.

Pacote somente estatico,23 arquivos/3475124 bytes do site aprovado mais
vercel.json de deployment, rotas/headers identicos. Framework Other e
install/build vazios somente no pacote, output public; configuracao persistente
Vite do projeto verificada antes/depois. Sem .env, codigo privado, APK ou banco
no upload. Fontes locais C161-C163 continuam sem commit/push/PR.

Preview dpl_D5waVTZCJe8iRPG3ih4GK3QzXvVm=READY. Primeira solicitacao
target=preview recebeu400; API exige omitir target para preview, corrigido.
Preview continuou protegido; fetch autenticado nao conseguiu obter bypass
(403/read_protection_bypass). Protecao nao alterada, sem alegar smoke HTTP
da preview. Artefato havia sido testado localmente; producao verificada abaixo.

Producao dpl_6roc9JY3GpSiDDNz2EEiQc1mETZB=READY, target=production,
aliasError=null, dominio publico xandeflix.vercel.app atribuido. URL tecnica:
xandeflix-prebuilt-nm3x-365nx22rb-xandeflix2.vercel.app.
Publicacao-verification: oito rotas200 com quatro headers canonicos e bytes
HTML esperados; todos23 arquivos publicos200 e SHA-256/bytes iguais ao build.
Pagina https://xandeflix.vercel.app/activate-device agora disponivel.

Chrome real isolado contra producao, sem mock: rota direta e legado exibem
formulario codigo/chave; fonte oculta antes da validacao, campos vazios
bloqueados, mobile390px sem overflow, /admin conserva login. Zero POSTs ou
escritas de backend; capturas desktop/mobile inspecionadas. Nao executada
ativacao real nem teste fisico de aparelho. Fluxo positivo sintetico e negativo
real anteriores continuam os limites dessa validacao. APK1.0.35/hash ja
registrados permanecem identicos; nenhum novo build/instalacao necessario.

Manifesto/deploy/status/publication-verification/production-browser-result e
capturas em tmp/c163-public-activation. Gate seguinte nao iniciado; sem
mudancas de licenca, identidade, fonte, banco, parental, relay ou Git.
