# C82 — Licença, principal e telas adicionais — 2026-10-12

## Preflight e autorização

Workspace canônico confirmado: `C:\Xandeflix\xandeflix-prebuilt-c11-main`, main,
origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, HEAD
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. AGENTS, Architecture/Execution
Contracts, Source Data Boundary e Activation Lock lidos; conjunto dirty C11
preexistente preservado. Ciclo direto C82, após C81 encerrado; nenhum outro Gate
iniciado. Especificação `docs/architecture/C11_LICENSE_PRINCIPAL_SCREEN_POLICY.md`
precedeu código. Usuário autorizou: “Sim, conferência manual pelo gestor”. Sem
autorização Git ou APK; nenhum commit/push/PR/build Android/instalação executado.
Supabase skill e Postgres best practices aplicados; checklist React aplicado.

## Resultado

- Limites concentrados em Licenças → Editar licença. Removidos botão/modal separado
  de limites e formulário redundante de adicionar/vincular no editor. Ativação
  assistida exibe limites readonly: novo principal começa com uma vaga; licença
  existente mantém valores vigentes. A ampliação precede o vínculo pelo submenu.
- Editor permite definir legado como principal ou promover secundário, com
  confirmação. Mantém conta/licença/fonte/código/chave e capacidade agregada;
  promoção não cria outra franquia. Apenas principal explicitamente classificado
  aparece como destino de vínculo ou de edição de limites. Nenhum cadastro real
  foi classificado automaticamente.
- Principal não pode virar secundário, mesmo sem filhos; aparelho com filhos
  também não pode ser transferido como secundário. Secundários não recebem filhos.
- Self-service inicial oferece 1–4 telas, principal explícito no servidor,
  simultaneidade igual à escolha; não gera aparelhos nem aprova reutilização da
  fonte automaticamente. Segundo aparelho continua dependente do gestor.
- Acima de quatro aparelhos, EDIT exige total de telas adicionais pagas e referência
  curta do comprovante, conferidos por ADMIN/MASTER. Registro privado e auditoria
  guardam confirmação; referência não retorna no DTO de licença. Preço e cobrança
  automática permanecem indefinidos. Redução não pode ficar abaixo das vagas usadas.

## Servidor e publicação

Migration `20261012065513_c11_principal_screen_policy.sql`, projeto
`cujbmyhitgomlgwfkaat`. Inicialmente aplicada com verificação sintética dentro de
subtransação revertida; nenhuma fixture persistiu. Teste final também executado
em BEGIN/ROLLBACK e retornou `C82_PRINCIPAL_SCREEN_POLICY_PASS`.

Novas RPCs: `rpc_manager_edit_license_screens`,
`rpc_manager_promote_license_device` e completion service-only
`rpc_signal_public_complete_with_screens`. Scope de ambas as pontas mantido.
Triggers impedem edição de capacidade por rotas antigas, INSERT administrativo
com capacidade ampliada e alterações inconsistentes de árvore. A autorização
transacional reside em tabela privada sem grants; parâmetro/GUC do cliente não
libera mudanças. Cofres/AAD/key/token/C9/importador/catálogo preservados.

Edge `managed-source-vault-admin` v17 ACTIVE, JWT obrigatório;
`device-public-activation` v11 ACTIVE, política de capability pública preexistente
preservada e novo parâmetro validado antes de bootstrap/cofre. HTTP publicado:
Manager sem Authorization →401; COMPLETE com cinco telas →400, mensagem humana.

## Verificação

- SQL: USER e ADMIN estrangeiro rejeitados; MASTER e ADMIN proprietário permitidos;
  legado requer classificação; principal protegido; secundário promovido;
  quantidade/simultaneidade, capacidade cheia, redução, edição implícita e GUC
  falsificado rejeitados; pagamento inválido/ausente/insuficiente rejeitado;
  prova e limite revertidos juntos em falha. Transferência preserva key/token e
  adota a fonte do principal. Self inicial1/4, rejeição5 e reconfiguração de contrato
  existente bloqueada; sinal duplicado continua exigindo autorização individual.
- Cliente/Edge reais com portas sintéticas: C82 três grupos PASS, C80 seis PASS,
  C78 quatro PASS. C78 atualizou somente a contagem após remoção do botão redundante.
  SQL C80/C81 é snapshot histórico de regras supersedidas e está identificado como
  tal; a aceitação SQL vigente é C82, sem relaxar suas proteções anteriores.
- Browser com componentes reais: editor sem vínculo, limites somente EDIT,
  pagamento/checkbox/referência, promoção sem ampliar franquia, principal estrito,
  vínculo readonly, notificação abre ativação e self-service quatro telas PASS.
  Desktop1507/mobile390 sem overflow; tabela em9 larguras1920/1507/1461/1024/800/
  601/600/390/360, todos os campos e seis ações visíveis, desktop table-row e mobile
  grid, fechar/Escape/restauração de foco e exclusão MASTER-only PASS.
- `npm run build`: TypeScript/Vite PASS; prebuild Activation Lock PASS
  (catálogo27/27 e controles negativos). Aviso de chunk grande preexistente.
- Revisão React: hooks incondicionais, cancellation/alive e guarda contra submissão
  dupla preservados, labels/checks/buttons e foco do dialog; sem novo listener global,
  fonte/segredos apenas em memória do editor existente, confirmação e busy state.

## Segurança e limites da evidência

As novas tabelas privadas têm RLS e nenhum grant direto a anon/authenticated/service;
novas RPCs de gestor negam anon e verificam Manager ativo/escopo, search_path vazio.
Fixtures, ledger e operações temporárias tiveram contagem zero após rollback.

Advisors registraram INFO [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
para as duas tabelas privadas (deny-all intencional) e WARN
[SECURITY DEFINER autenticado](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
para as duas RPCs administrativas (fronteira autenticada com testes USER/escopo).
Nenhuma nova RPC anônima; demais avisos de Auth/functions são históricos e fora do
escopo deste ciclo. Não foi executada ativação/pagamento/vínculo em cliente real.
Validação física e pagamento real dependem do teste operacional do gestor.

Provenance: baseline SHA256 antes da edição, relatório privado
`tmp/c82-principal-screen-policy/provenance-report.json`; alterações apenas na
allowlist C82, HEAD preservado. Browser/SQL/logs privados no mesmo diretório,
sem senhas/tokens/URLs reais. Nenhuma alteração no projeto original protegido.
