# C11 — Menu lateral, privilégios e ativação pública (C70)

Pedido do usuário de 2026-10-11, especificado antes de código funcional.
Preflight: clone independente C11, origin xandeflix2/xandeflix-prebuilt,
main, HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Contratos Architecture,
Execution, Source Boundary e Activation Lock lidos. Dirty anterior preservado.
CURRENT_GATE=NONE; ciclo local solicitado explicitamente; NEXT_GATE_STARTED=NAO.
C69 (regressão Carrie/Fire) permanece pendente, sem misturar alterações.
Git commit/push/PR, resets, instalação em dispositivos e exclusão de dados reais
não autorizados. Escopo servidor somente cujbmyhitgomlgwfkaat, após teste
transacional com rollback e auditoria de cobertura; nunca outro projeto.

## Requisitos e decisões

- Menu administrativo lateral, responsivo; login por email de usuário e senha
  já suportado por Supabase Auth. Painel e funções locais indisponíveis sem
  sessão de gestor validada no servidor. Não criar senha padrão.
- MASTER corresponde ao OWNER canônico existente: autoridade global, inclusive
  operações destrutivas. ADMIN somente clientes ativados por ele e entidades
  derivadas; USER e anônimo nunca recebem administração. Papéis consultados
  em manager_admins; nunca confiar em user_metadata ou seletor no cliente.
- Vínculo privado persistente de cliente/gestor e fonte/gestor, gravado na mesma
  transação de ativação assistida/criação. Não inferir propriedade de registros
  históricos sem prova. MASTER mantém acesso aos registros sem vínculo.
- Todas as RPCs administrativas existentes, incluindo aliases antigos,
  listagens, detalhes, mudanças, fontes, notificações e sessões, recebem
  verificação server-side de escopo. Cores anteriores ficam em schema privado,
  sem EXECUTE público. Operações globais e nomes desconhecidos falham para ADMIN.
- Nenhuma transferência de cliente/fonte por ADMIN. Recursos compartilhados
  com clientes de outro gestor não podem ser modificados pelo ADMIN.
- Exclusão permanente de dispositivo e chave exige MASTER, confirmação explícita
  do código no painel, transação, revogação de sessões e limpeza das referências
  desse dispositivo; conservar auditoria sanitizada e licença/fonte de terceiros.
  Implementar capacidade não autoriza executar exclusão real neste ciclo.
- Preservar página pública /#/activate-device: Código ID + Chave de seis dígitos
  -> validação real e sessão curta vinculada ao dispositivo -> fonte -> autorização
  -> apresentação de sincronização. Credenciais somente no vault cifrado.
  Não apresentar progresso remoto inventado: catálogo sincroniza no aparelho.
  Botão existente na ativação abre navegador externo sem chave na URL.
- Não mudar C9, identidade, chave, licença, playback ou política comercial.
- Regressão reproduzida em teste transacional: ativar dispositivo adicional
  usava FIRE_STICK, valor rejeitado pelo CHECK canônico de device_type. Corrigir
  somente esse literal no core privado clonado, preservando o tipo conhecido
  em devices/instalações (TV/PHONE/TABLET/PC/OTHER), sem relaxar CHECK.
  A expiração de solicitações no listador deve afetar somente escopo próprio.

## Allowlist

### Complemento solicitado em 2026-10-11 — dinâmica de usuários e sinal

MASTER visualiza todos os consumidores e gestores; ADMIN visualiza somente
os consumidores sob sua responsabilidade, sem diretório de outros gestores.
Nova seção de usuários e seção MASTER de gestores. Atribuição explícita de
consumidor a ADMIN é restrita a MASTER, sem backfill inferido.

USER não obtém administração. Reutilizar a mesma configuração de sinal em
outro dispositivo exige liberação explícita de ADMIN responsável ou MASTER,
vinculada a código/dispositivo, licença e fonte. Pagamento ainda não habilitado:
nenhum parâmetro do cliente, alegação de pagamento ou novo cadastro libera
dispositivo adicional. Preservar os limites e autoridade comercial da licença.

Comparação exclusivamente no servidor do vault, sem buscar playlist ou mídia:
HMAC com chave derivada e separação de domínio, sobre conexão normalizada,
persistido somente em schema privado. Não usar como sourceId nem retornar em
metadata pública. Indexar versões cifradas anteriores no runtime autorizado
do cofre; falha de validação/indexação bloqueia nova ativação, sem inferir
que fontes diferentes correspondem à mesma playlist. URLs alternativas e
redirecionamentos não são identidade comprovada da fonte.

Mais arquivos autorizados por este complemento: nova migration aditiva criada
pelo CLI; supabase/functions/_shared/signal-policy.ts; device-public-activation,
customer-source-upsert e managed-source-vault-admin (indexação antes de operar);
src/debug/manager/ManagerUsersView.tsx; testes SQL e scripts deste complemento;
amendment documentado da boundary para HMAC privado de autorização, nunca mídia.
Deploy somente dessas funções em cujbmyhitgomlgwfkaat após testes; preservar
verify_jwt e custom auth existentes. Nenhuma conta, liberação ou pagamento real
deve ser criado no ciclo. Continuação do escopo autorizado C70, sem iniciar C69.

- Este contrato; docs/evidence/C11_MANAGER_ROLES_AND_PUBLIC_ACTIVATION.md;
  registros append-only STATUS, DECISIONS, ERRORS_AND_BLOCKERS, EVOLUTION_REPORT.
- src/debug/manager/ManagerPanelPage.tsx; novo ManagerPanelPage.css;
  novo ManagerDeviceDeletion.tsx; novo manager-access.ts.
- src/control-plane/client/manager-remote-control-plane-authority.ts;
- src/control-plane/control-plane.types.ts e src/debug/manager/AdminAuditView.tsx:
  tipar/renderizar auditoria de exclusão permanente e manter eventos anteriores.
  src/ui/pages/PublicDeviceActivationPage.tsx; src/ui/pages/ActivationPage.tsx
  somente instrução de acesso público; tsconfig.tsbuildinfo.
- Uma migration c11_manager_scoped_access criada pelo CLI; testes isolados
  scripts/test-c11-manager-scoped-access.mjs e supabase/tests/c11_manager_scoped_access.sql.
- tmp/c11-manager-access-20261011 ignorado, saídas usuais do build.

## Aceitação

Conferência runtime do cofre pode usar dispositivo/sessão sintéticos temporários
para CHECK_POLICY: valida capability real, indexa somente provas privadas de
autorização dos envelopes existentes, retorna somente pronto/não pronto. Não
ativa fonte, não cria consumidor/licença, não libera dispositivos. Remover
os registros sintéticos ao terminar; não imprimir tokens/chaves.

O complemento explícito do usuário substitui a regra absoluta de um dispositivo
SELF_SERVICE somente para adicionais aprovados pelo responsável ou MASTER.
Adicionar contador de autoriza??o restrito de capacidade autorizada na licença (sem grant de
escrita ao cliente) e ajustar o CHECK para max_devices <= 1 + adicionais
aprovados. O contador é alterado somente pela aprovação específica e auditada;
não disponibilizar bypass de pagamento. Licenças existentes iniciam com zero
adicionais, sem aumento automático de capacidade ou concorrência.

Testes transacionais do complemento reproduziram falha de FK na ativação
SELF_SERVICE: core associa customer_account_id à identidade nova sem criar
customer_accounts. O novo wrapper deve criar somente essa conta administrativa
sanitizada para identidade Auth existente, antes do core, na mesma transação.
Nenhuma conta real de teste será criada. Diretório USER elimina duplicação de
conta/perfil e não inclui gestores. O create C6 escolhia outro sourceId após
cifragem; o clone privado recebe o sourceId opaco já usado no AAD e valida
versão/protocolo no update. Preservar o core e seus limites comerciais.

Revisão de grants identificou TRUNCATE/REFERENCES/TRIGGER residuais para anon e
authenticated em playback_sessions. Revogar somente esses privilégios de tabela,
mantendo as RPCs e o comportamento C9; nenhuma linha é removida por esta revogação.
Testar privilégios efetivos e isolamento das tabelas além das RPCs.

Teste com MASTER, dois ADMIN distintos, USER, anônimo e gestor desativado;
negação cruzada por ID/código, acesso próprio, escopo de todas listagens,
notificações e aliases; rollback dos dados sintéticos. Cobertura de todas RPCs
administrativas expostas e ausência de acesso público aos cores. Exclusão
sintética não afeta outro dispositivo/fonte/licença. Sem executar exclusão real.
Login/logout e validação inválida não mostram painel/fonte; fonte aparece
somente após validação; etapa final mantém código do dispositivo e mensagem
verdadeira de sincronização no aparelho. Lock antes/depois, TS/build, regressões
de autorização e ativação existentes. Evidência deve distinguir teste local,
transacional remoto e implantação. Nenhum sucesso parcial declarado integral.

Normaliza??o de conex?o efetiva: campos username/password opcionais M3U n?o
alteram a URL utilizada pelo importador e n?o mudam a prova. EPG, nomes, formato
e op??es de runtime tamb?m n?o criam novo sinal. Token ? comparado com trim
usado no header; host/credenciais Xtream seguem normaliza??o do importador.
Atribui??o MASTER de consumidor n?o transfere silenciosamente fonte gerenciada
compartilhada ou pertencente a outro ADMIN; propriedade da fonte permanece
expl?cita e sob decis?o MASTER. Gestores n?o podem ser atribu?dos como USER.

Confer?ncia runtime encontrou SOURCE_POLICY_UNAVAILABLE antes de qualquer
prova indexada. Acrescentar diagn?stico interno somente de etapa/kind/vers?o
(sem IDs, mensagens de exce??o, payload, credenciais ou plaintext) para
distinguir chave ausente, decrypt, normaliza??o e grava??o. O cliente mant?m
erro sanitizado; nenhuma libera??o autom?tica em caso de falha.

Falha confirmada na etapa DECRYPT de envelope CUSTOMER vers?o1. Backfill
deve preservar progresso das demais configura??es v?lidas no lote e ent?o
falhar fechado, sem criar prova para envelope inv?lido nem bloquear sua
confer?ncia por ordem do resultado. N?o recuperar AAD perdido por adivinha??o
ou usar chave de teste; envelopes inv?lidos exigem novo registro autorizado
da configura??o pelo respons?vel, em ciclo pr?prio.

Corre??o aditiva de recupera??o: o ?nico envelope pendente ? CUSTOMER XTREAM
vers?o1, licen?a SELF_SERVICE ACTIVE com validade atual. N?o ignorar esse
registro para novas ativa??es. Permitir excluir temporariamente do backfill
somente a configura??o pr?pria que est? sendo substitu?da: sess?o p?blica
real de dispositivo j? autorizado ? licen?a/consumidor ou identidade Auth
pr?pria em UPDATE. Revalidar esse alvo no servidor na transa??o final; todas
as outras configura??es devem estar verificadas e a nova conex?o deve passar
pela compara??o. Sem slot novo, sem prova falsa, sem reparo autom?tico de
credenciais. Migration adicional c11_signal_policy_owned_repair e testes SQL/
isolados inclu?dos na allowlist C70; n?o editar migrations j? aplicadas.
