# C78 — Licenças e gestão consolidada

Pedido direto do usuário em 2026-10-11; CURRENT_GATE=NONE, NEXT_GATE_STARTED=NAO.
Preflight: clone independente C11-main, origin xandeflix2/xandeflix-prebuilt,
main, HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline privado: 866 hashes.
AGENTS, Architecture, Execution, Source Boundary e lock lidos. Git não autorizado.

## Escopo autorizado antes do código

- Licenças: substituir ID visível por códigos/apelidos dos aparelhos; adicionar
  plataforma/tipo e último acesso por aparelho. Sem N+1 de consultas de detalhes.
- Ações por ícone com title/aria-label, incluindo editar e excluir.
- Modal de edição: cliente, aparelhos, fonte; MASTER pode revelar configuração
  transitoriamente pela autoridade existente auditada. ADMIN só opera seu escopo,
  sem reveal de segredos. Substituição M3U/Xtream cifrada pelo runtime existente,
  atomicamente, somente nos aparelhos da licença escolhida. Fonte compartilhada
  com outros clientes não sofre edição. Identidade/chave preservadas.
- Vincular aparelho instalado por Código ID + chave permanente + apelido, com
  verificação real server-side e capacidade/autorização adicional explícita.
  Editar apelido de aparelho já vinculado, sem mudar código/chave.
- Exclusão permanente exclusiva MASTER, confirmação digitada e prévia de TODAS
  as licenças/aparelhos da conta. Uma transação remove dados operacionais,
  chaves/cofres próprios, dispositivos e conta USER exclusiva; bloqueia conflitos
  com outras contas/gestores. Preserva auditoria e fontes compartilhadas.
  Nenhuma exclusão real será executada pelo agente neste desenvolvimento.
- Manter outras abas existentes; alteração restrita à consolidação solicitada.

## Allowlist

AdminLicensesView.tsx, novo ManagerLicenseEditor.tsx e CSS no diretório manager;
ManagerPanelPage.tsx; control-plane.types.ts e manager-remote-control-plane-authority.ts;
managed-source-vault-admin/index.ts; uma migração CLI c11_license_console;
supabase/tests/c11_license_console.sql; scripts/test-c11-license-console.mjs;
este contrato, docs/evidence/C11_LICENSE_CONSOLE.md, STATUS, EVOLUTION_REPORT,
DECISIONS, ERRORS_AND_BLOCKERS; saídas usuais de build/tsbuildinfo.
Fixtures/ferramentas privadas só em tmp/c78-license-console.

## Aceitação

Lock antes/depois PASS; TypeScript/build PASS; testes de UI e autoridade cobrem
edição, segredo efêmero, filtros/códigos, confirmação e falhas sem falso sucesso.
SQL testa fixtures em transação rollback: MASTER/ADMIN/USER/anon, isolamento,
confirmação incorreta, conflitos, exclusão inteira e preservação externa,
vinculação por chave inválida e troca de fonte atômica. Revisar grants/search_path,
sem URLs/chaves reais em logs/docs/listagens. Publicar migração/Edge somente no
projeto cujbmyhitgomlgwfkaat após verificações; conferir funções e grants remotos.
Não altera player, identidade, pagamentos ou Git; sem instalação em aparelhos.
