# C109 — exclusão de aparelho nas licenças — 2026-10-15

Spec antes do código. Pedido: remover XF-4PNM-CD8C e XF-QBSQ-VRQM; primeiro
abre erro ao consultar vínculos e segundo, LEGACY MANAGED, não oferece lixeira.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem autorização de commit/push/PR.

## Preflight e diagnóstico

Clone independente C11-main/main/HEAD0f68f169f7728fae17c8311832b7643629e97a02,
origin esperado xandeflix2/xandeflix-prebuilt. AGENTS/Architecture/Execution/
Source Data Boundary lidos. Baseline44 alterações locais C107/C108 conhecidas;
preservar arquivos e APK C108. Investigação Itália permanece pendente, separada.

Código confirma: a lixeira da tabela abre DELETE de cliente inteiro, exclusivo
MASTER, e depende de customerId. LEGACY MANAGED indica customerId ausente, não
uma prova de que o aparelho é conta administrativa. A prévia de cliente tem
proteções legítimas contra identidade de gestor/compartilhada e vínculos de
outras contas; catch atual mascara todos os motivos com erro de permissão.
Ainda não há evidência do código remoto exato para XF-4PNM-CD8C: get_project e
SELECT somente leitura via conector foram negados. Nenhuma escrita remota.
Não tentar contornar essas proteções nem presumir erro de RLS.

## Escopo e aceitação

1. MASTER pode iniciar a exclusão individual de cada aparelho da tabela,
   incluindo legado sem customerId e linhas secundárias. A lixeira identifica
   o código exato; não depende da prévia ou exclusão da conta. UI usa somente a
   autoridade existente deleteDevicePermanently, com RPC que exige MASTER e
   confirmação do displayCode, remove autorização/chave e audita o aparelho.
2. Diálogo mostra código/local, efeito permanente e preservação de conta,
   licença e fontes. Exigir digitação do código exato, aceitar normalização
   trim/uppercase consistente com RPC; não inferir confirmação pela busca.
   Nunca disparar operação na abertura/seleção/edição do campo. Bloquear submit
   incorreto, chamadas duplicadas e fechamento durante operação em andamento.
3. Preservar exclusão do cliente inteiro como ação separada, explicitamente
   nomeada, dentro do diálogo se há customerId. Licença sem aparelhos conserva
   acesso à exclusão do cliente. Fluxo antigo mantém prévia completa, snapshot,
   confirmação digitada e proteções contra conta administrativa/compartilhada.
   Não autorizar/apagar conta MASTER nem fontes compartilhadas por aparelho.
4. Erros conhecidos de prévia recebem mensagens específicas e controladas:
   MASTER/sessão, identidade administrativa/compartilhada, vínculo externo,
   ausência de cliente/licença. Erro desconhecido permanece seguro sem expor
   mensagem bruta. Nunca afirmar que a conta do aparelho é MASTER sem evidência.
5. Sucesso só depois de confirmação positiva da RPC existente. Se exclusão
   confirmar e refresh da tabela falhar, informar exclusão confirmada e pedir
   atualização do painel; impedir nova exclusão pelo diálogo. Guard em ref,
   cleanup de foco/callbacks e Escape/cancelamento; permissões também no handler.
6. Testes reais de componentes com fixtures cobrem legado/SELF_SERVICE,
   secundários, MASTER/ADMIN/USER, código incorreto/correto/normalizado,
   double-submit, falhas, confirmação falsa, refresh falho, prévia separada e
   ausência de exclusão no simples abrir. Browser em viewport móvel/desktop.
   Typecheck/build com lock; nenhuma exclusão dos dois aparelhos pelo agente.
   Validação da RPC real e das causas remotas fica pendente da conexão negada.

## Allowlist incremental estrita

- src/debug/manager/{AdminLicensesView,ManagerLicenseEditor}.tsx;
- scripts/test-c11-license-console.mjs: fixture/expectativas da nova entrada de
  exclusão individual, mantendo isolamento/autenticação/ack/grupos anteriores;
- scripts/test-c109-manager-device-delete.mjs: novos testes;
- este plano e docs/evidence/C11_MANAGER_DEVICE_DELETE_SCOPE.md;
- docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md: acréscimos do ciclo;
- saídas ignoradas de build/tsbuildinfo e helpers privados tmp/c109-device-delete.

Sem migrations, grants, schema, funções/RLS/cofres/credenciais remotas, alteração
de assinatura/APK, Android, instalação, exclusão de dados reais ou Git. A skill
Supabase foi lida, changelog e funções/RPC/permissões oficiais consultados.
