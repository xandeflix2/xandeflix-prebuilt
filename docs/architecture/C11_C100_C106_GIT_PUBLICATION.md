# C100–C106 — publicação Git autorizada — 2026-10-14

## Autorização e preflight

O usuário solicitou explicitamente commit e push para preservar as otimizações
consolidadas. Essa autorização sucede apenas as proibições de publicação Git
dos ciclos locais C100–C106; não amplia escopo funcional nem inicia outro Gate.
`GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO`.

Clone ativo independente C:\Xandeflix\xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, HEAD inicial
d039f8837dfcfd44374560a9e6642cb93e59c2cf. AGENTS/Architecture/Execution/Source
Boundary lidos; fetch origin main confirmou divergência0/0 e index inicialmente
vazio. Workspace histórico e projeto protegido não operados. Nenhuma escrita
de backend, instalação, release, APK/updater, secret, reset ou mudança funcional.

## Allowlist e procedimento anterior ao staging

Publicar somente os arquivos dirty/untracked reconhecidos de C100–C106,
capturados nominalmente em manifesto privado de publicação, este contrato e
os três registros STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS. Inclui gesto VOD,
transporte progressivo bounded, inventário completo/local e detalhes sob
demanda, busca Live, prioridade de arte, UI/rolagem contínua e refinamentos C106,
com testes/especificações/evidências correspondentes. Mudanças canônicas
anteriores já adjudicadas são versionadas sem reescrevê-las.

Antes do commit: conferir proveniência e arquivos preservados, digest do APK
C106 entregue, regressões selecionadas/lock, whitespace e auditoria sanitizada
do conteúdo candidato. Stage nominal, comparar index exato ao manifesto e
digest de cada arquivo. Excluir .env, segredos/assinatura, tmp, APKs de
referência/entrega, builds, caches e payloads/diagnósticos reais dos dispositivos.
Nunca imprimir segredo detectado; somente arquivo/tipo/linha para correção.

Criar um commit consolidado de código/testes/docs e fazer push normal de main
para origin/main, sem force, amend ou reescrita. Um segundo commit documental
pode registrar a confirmação do primeiro envio nos registros de memória,
sem alterar código ou reabrir o ciclo funcional. Confirmar SHA remoto por
ls-remote/fetch e estado local. Publicação só pode ser reportada concluída após
confirmar igualdade. Se o remoto mudar, examinar divergência antes de integrar;
falha não autoriza contornar hooks/proteções. Registro final sanitizado local e
resposta ao usuário devem conter SHA verificado e limites reais.

## Evidência e limites preservados

Build C106 e197 testes Android já passaram; APK1.0.19/C106 SHA256
e0ff71de1715bd44c93493cf0585d0465e2dbd850ee2e26f18b191c45c0683de
instalado-r com dados preservados em Fire/celular/tablet. QA detalhado em
[C106](../evidence/C11_HERO_ARTWORK_DETAILS_TAP.md).
Meta Home90s não foi cumprida no teste C105; publicação Git não converte
evidência de desempenho em SLA nem homologa playback de filme/episódio.
Retenção de snapshots C102 continua pendente. APKs ficam locais/ignorados.

`CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C106_GIT_PUBLICATION;
NEXT_GATE_STARTED=NAO`.
