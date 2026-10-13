# C80 — Cadastro e vínculo descritivo de aparelhos — 2026-10-12

Concluído no workspace independente C11, origin/branch/HEAD do preflight
preservados. Spec e allowlist: C11_MANAGER_DEVICE_REGISTRATION.md. Dirty
cumulativo preservado; auditoria SHA-256 privada identifica somente allowlist.

Cadastro informa Local/Tipo, capacidade e simultâneos, Principal/Secundário;
secundário escolhe principal autorizado do mesmo cliente/licença/fonte.
Tabela desktop completa e mobile até 600 px em blocos: Local/Tipo, vínculo,
pares da mesma fonte, códigos ocupando slots e quantidade real por cliente.
Mensagens de resultado traduzidas, sem estado técnico ou segredo.

Editar licença oferece Novo e Já cadastrado. Transferência registrada altera
apenas o aparelho escolhido, reusa fonte do principal, mantém código/chave/token,
fecha sessões de playback antigas e preserva contas/fontes de origem. ADMIN
precisa de escopo nas licenças de origem e destino; MASTER tem escopo global.
Principal com secundários não pode ser transferido, nem secundário ser usado
como principal; auto-vínculo, revogado, falta de vagas e chave inválida bloqueiam.

## Verificação

- Cliente/Edge reais: 6 grupos PASS, incluindo chave com SHA-256 somente para
  novo aparelho, nenhum envio de chave no vínculo registrado, auth fail closed.
- Regressão C78 cliente/tabela/cofre/Edge: 4 grupos PASS, testes preservados.
- SQL remoto BEGIN/ROLLBACK: cadastro, capacidade, legado principal, token,
  MASTER/ADMIN próprio/ADMIN outro/USER/anon; transferências MANAGED e SELF_SERVICE,
  rollback de falhas, origem preservada, principal com filhos/chain bloqueados PASS.
- Browser tabela: 9 larguras 1920 a 360 px, todas as colunas/7 ações visíveis,
  desktop tabela/mobile blocos, Escape restaura foco, ADMIN sem exclusão PASS.
- Browser REAL ManagerPanelPage: seleção explícita, principal filtrado por
  cliente, payload, sucesso/reprovação informativos, 390 px sem overflow PASS.
- Browser REAL ManagerLicenseEditor: registrado secundário, principal obrigatório,
  revisão origem/destino, confirmação, nenhum campo de chave, erro informativo,
  layouts 1507/390 px sem corte PASS. Portas de backend sintéticas privadas.
- Build TS/Vite e activation lock 22 + catálogo 27 + negativos 9 PASS.
  Avisos de bundle/importação dinâmica já existentes, sem refatoração fora do pedido.

## Publicação e segurança

Somente cujbmyhitgomlgwfkaat: migrations 20261012052138, 20261012060054 e
20261012060218; Edge managed-source-vault-admin v14 ACTIVE, verify_jwt=true.
Request sem JWT retorna 401. Nenhuma mudança de cliente real como teste;
fixtures c80 restantes=0 e relacionamentos após rollback=0.

Advisors: novos RPC SECURITY DEFINER autenticados são endpoints de gestor com
require_active_manager/escopo real testados; search_path vazio, sem EXECUTE anon.
Tabela privada com RLS sem policy tem privilégios diretos revogados (RPC somente).
Demais findings preexistentes fora do escopo preservados.

Regressão encontrada no primeiro teste SELF_SERVICE: limite atualizado antes da
aprovação infringia chk_self_service_single_device. Correction migration registra
aprovação explícita antes do limite, na mesma transação, sem relaxar constraint;
SQL completo PASS depois. Seleção CSS incorreta no harness de modal corrigida;
nenhum erro funcional mascarado. Nenhum segredo real em fixtures/docs/logs.

Sem commit/push/PR/APK/instalação. C80 completo antes de iniciar nova demanda.
