# C109 — exclusão individual de aparelho no gestor — 2026-10-15

Spec: [C11_MANAGER_DEVICE_DELETE_SCOPE](../architecture/C11_MANAGER_DEVICE_DELETE_SCOPE.md).
Preflight clone independente C11-main/main/HEAD0f68f169/origin esperado,
contratos/AGENTS/Source Boundary lidos. Baseline1011 hashes, alterações C107/
C108 conhecidas preservadas. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Constatações e limite remoto

- XF-QBSQ-VRQM aparece como LEGACY MANAGED: a condição de exibição da lixeira
  exigia customerId. O rótulo legado indica ausência de cliente, não vínculo
  com o MASTER autenticado. O código da tabela não fazia esse teste de conta
  administrativa para esconder a ação.
- A lixeira antiga abria DELETE de cliente inteiro, com consulta de todas as
  licenças/aparelhos. O catch de preview ocultava tanto proteção legítima de
  identidade administrativa/compartilhada quanto outros erros sob a mesma
  mensagem de permissão. Esse caminho era inadequado para apenas um aparelho.
- Causa remota exata do erro de XF-4PNM-CD8C não confirmada: get_project e um
  SELECT de metadata restrito aos dois códigos retornaram acesso negado pelo
  conector Supabase. Nenhuma alteração de schema/grants ou exclusão remota.
  Nenhum navegador conectado disponível no CUA para inspecionar a sessão do
  painel. Não atribuir ao MASTER/shared identity sem o código real do erro.

## Implementação

- Cada linha de aparelho agora oferece “Excluir dispositivo <código>” para
  MASTER quando existe a autoridade de exclusão. Funciona com customerId nulo
  e linhas secundárias, sem depender de preview do cliente.
- Novo diálogo exportado no módulo existente ManagerLicenseEditor mostra
  código/local, remoção permanente de autorização/chave e preservação de
  conta/licença/fontes. Exige código válido XF, trim/uppercase e confirmação
  digitada. Chama só deleteDevicePermanently(deviceId,code), a autoridade/RPC
  MASTER auditada já existente. Não há nova rota de exclusão no backend.
- Principal com secundários conhecidos requer transferência prévia; aviso e
  submit bloqueado. O servidor permanece autoridade, inclusive sobre dados
  que mudaram depois da listagem. Não alterar relationships/FKs por UI.
- Guard em ref bloqueia duplicatas e cancelamento durante RPC; sucesso só
  depois do ack verdadeiro. Refresh falho mantém informação de exclusão
  confirmada e remove formulário de repetir. Unmount ignora callbacks tardios.
- Exclusão do cliente inteiro preservada como ação separada no diálogo dos
  registros com cliente e na linha de licença sem aparelho. Mantém preview,
  snapshot, confirmação e proteções existentes contra gestores/outras contas.
- Preview agora explica erros conhecidos em mensagens fechadas. Erro arbitrário,
  valores de protótipo e links/tokens não entram no texto. Guardas de conta
  administrativa não foram retiradas para contornar uma falha de permissão.

## Validação executada

- test-c109-manager-device-delete.mjs:14 cenários PASS. React/componentes e
  autoridade reais com backend sintético isolado. Reproduz ausência da lixeira
  no legado anterior e verifica a nova ação. Browser1280/390: código errado/
  correto/normalizado, payload exato, zero RPC ao abrir, exclusão legada só do
  alvo, prévia separada e guard administrativo, mensagem bruta não exposta,
  RPC recusada/ack falso, double-submit, cancelamento em voo, refresh falho,
  principal protegido, secundário exato, foco, downgrade de papel e unmount.
- Console de licenças C78:4 grupos PASS; escopo/autenticação C68:8 PASS;
  cadastro de dispositivos C80:6 PASS; autoridade/edição C83 PASS.
- npm run build:TypeScript/Vite e activation lock26+27+9 PASS. Avisos Vite
  existentes de chunk/imports mistos/módulos Node não tratados como falhas nem
  usados para refatorar fora do escopo.
- HTTP localhost:3000 confirmou módulos novos AdminLicensesView e
  ManagerLicenseEditor servidos pelo Vite. Display UTF-8 validado no browser;
  o JS transformado pode usar escapes Unicode e não contém texto corrompido.
- Revisão React: efeitos com cleanup, guard/ref para concorrência, handlers
  com permissões, estado tardio ignorado, diálogo nativo rotulado, foco de
  retorno, botões/inputs bloqueados, leitura limitada aos aparelhos da licença.
- APK C108 f1d562d1e6939e41a21fc3aec43ec0838edad5c04e44e93a13c1cb18de0f5582
  preservado. Nenhum sync Android, novo APK ou instalação solicitado/executado.

## Falhas de desenvolvimento resolvidas

PowerShell5 tinha OutputEncoding ASCII; append via pipeline converteu acentos
do bloco novo para '?', detectado na inspeção antes da entrega. Bloco reparado
com apply_patch UTF-8; browser confirma textos acentuados. Fixture esbuild
inicial faltava outdir para imports CSS; configurada saída apenas em memória
e CSS real no HTML. Nenhum teste/critério de permissão foi relaxado.

## Resultado

LOCAL_MANAGER_UI=CORRECTED_AND_SERVED
REAL_DEVICE_DELETIONS_EXECUTED=NONE
REAL_BACKEND_DELETE_VALIDATED=NAO_CONNECTOR_ACCESS_DENIED
XF_4PNM_CD8C_ORIGINAL_PREVIEW_CAUSE=UNCONFIRMED
XF_QBSQ_VRQM_MISSING_ACTION_CAUSE=CUSTOMER_ID_REQUIRED_BY_OLD_TABLE_UI
ACCOUNT_ADMIN_SOURCE_PROTECTIONS=PRESERVED
NO_BACKEND_WRITES=SIM; NO_GIT_WRITES=SIM; NEXT_GATE_STARTED=NAO.

Recarregar painel local, abrir lixeira do aparelho, digitar o código e escolher
“Excluir somente este dispositivo”. Confirmação permanente fica com o usuário;
estes testes não removeram os dois registros nem uma conta administrativa.
