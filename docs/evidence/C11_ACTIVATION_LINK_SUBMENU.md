# C81 — Submenu e vínculo registrado com capacidade — 2026-10-12

Concluído após encerramento C80. Clone independente C11 main/origin/HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e preservados. Spec/allowlist
C11_ACTIVATION_LINK_SUBMENU.md anterior ao código; baseline privada exclui .env.

Ativar dispositivo contém Ativação por Código + Chave e Vincular dispositivo.
Vínculo escolhe principal autorizado visível ao gestor e abre modal LINK; o
modal EDIT continua oferecendo Novo/Já cadastrado. Principal preselecionado,
origem/destino revisados e confirmação explícita; registrado passa a secundário
usando fonte do principal, mantendo código/chave/token. Conta/fonte de origem e
outros aparelhos preservados. ADMIN exige escopo origem/destino, MASTER global.

Quantidades readonly e projeção de ocupação bloqueiam falta de vagas; ajustar
capacidade é ação administrativa explícita separada em Licenças. Servidor
compara limites atuais sob lock (VERSION_CONFLICT se divergirem) e exige
simultâneos <= capacidade no cadastro configurado, vínculo e ajuste de limites.
Pagamento/plano/preço ainda não configurados; nenhum padrão fixo de quatro telas.
C9 playback e cadastros reais antigos intactos; notificação força Código + Chave.

## Verificação

- Cliente/Edge reais: 6 grupos C80 expandidos PASS, incluindo bloqueio de
  simultâneos > capacidade antes de RPC, chave omitida para registrado.
- SQL remoto BEGIN/ROLLBACK: C80 completo + limites preservados, overbooking,
  simultâneos > capacidade, ajuste separado, SELF_SERVICE, MASTER/ADMIN ambos
  os escopos/USER/anon, rollback e preservação da identidade PASS.
- Browser REAL ManagerPanelPage/Editor/notificações: dois submenus, principal
  sem secundários, préseleção, quantidades readonly, sucesso3aparelhos/2simultâneos,
  falta de vagas bloqueia inclusive requestSubmit, stale informativo, retorno da
  notificação para ativação PASS. Desktop1507/mobile390 sem overflow/corte.
- Regressões C80: tabela9 larguras/todascolunas/7ações/foco/ADMIN; cadastro e
  modal EDIT registrados PASS. C78 cliente/tabela/AES/Edge4 grupos PASS.
- Build TypeScript/Vite e activation lock22 + catálogo27 + negativos9 PASS.
  Avisos Vite de chunk/importações já existentes, sem refatoração fora do escopo.
- Revisão React: reutilização do modal, memo de listas, sem N+1, cleanup/guard
  async, labels/required/readonly/dialog/foco e aria do submenu conferidos.

## Publicação e auditoria

Somente cujbmyhitgomlgwfkaat: migration20261012061407 c11_link_capacity_contract,
vault-admin v15 ACTIVE/verify_jwt=true. Sem JWT HTTP401; anon sem EXECUTE no
link/limites; authenticated sem leitura direta de relações privadas; fixtures
c80 restantes=0. Advisors: SECURITY DEFINER de gestor autenticado intencional,
auth/escopo reais e search_path vazio; demais findings preexistentes preservados.
Nenhum vínculo real usado como teste, nenhum segredo real em fixtures/docs/logs.

Gerador privado teve âncora v_role incorreta (wrapper usa role_code), corrigida
antes de aplicar. Fixture ADMIN origem usava limites divergentes; VERSION_CONFLICT
correto, fixture ajustada preservando assert de scope; SQL final PASS.
Patch documental com contexto digitado errado não alterou spec; reaplicado.

Provenance SHA-256 privada: somente allowlist C81, HEAD preservado, nenhum env
ou workspace protegido alterado/dirty revertido. Sem commit/push/PR/APK/instalação.
NEXT_GATE_STARTED=NAO.
