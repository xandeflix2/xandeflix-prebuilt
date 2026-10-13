# C78 — evidência de gestão consolidada de licenças

## Proveniência — 2026-10-11/12

Pedido direto do usuário; [spec anterior ao código](../architecture/C11_LICENSE_CONSOLE.md).
Clone C11-main independente, main, origin xandeflix2/xandeflix-prebuilt,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline privado 866 hashes.
Gate NONE; nenhum próximo Gate, commit/push/PR, instalação ou reset.
Preservados os patches cumulativos anteriores. Código somente na allowlist.

## Resultado

Licenças exibe cliente, códigos/apelidos, plataforma/tipo e último acesso por
aparelho, modo, status, slots, sessões máximas e criação. ID da licença foi
retirado da tabela, preservado internamente. Busca inclui código/apelido.
Ações por ícone, aria-label/title e alvo de toque; editar abre dialog nativo
centralizado e rolável com foco modal, Escape e retorno de foco ao botão.

Modal edita apelidos, substitui fonte M3U/Xtream para a licença e autoriza
aparelho instalado por código + chave de seis dígitos + apelido. Backend verifica
permanentemente a chave existente, mantém token/identidade e aplica limites.
SELF_SERVICE registra aprovação explícita de sinal adicional; MANAGED exige
slots suficientes. Seleção de aparelho permite MASTER revelar configuração
auditada; segredo somente transitório e ocultável. ADMIN não possui reveal.

Substituição cifrada usa o runtime/chave/AAD existentes; prefixo src_ para
MANAGED, csrc_ para SELF_SERVICE. Snapshot de fontes/versões rejeita edição
desatualizada. Não edita fonte compartilhada externamente. Fecha sessões antigas
da licença; dispositivo importa novo catálogo pelo fluxo existente.

Excluir é MASTER-only: prévia cobre todas as licenças/aparelhos da conta,
confirmação EXCLUIR + apelido e snapshot. Transação apaga chaves, aparelhos,
sessões, requests, fontes próprias/cofres, licenças, conta e identidades USER
exclusivas. Bloqueia vínculo de aparelho/identidade com outra conta ou gestor.
Auditoria e fontes compartilhadas externamente sobrevivem. Nenhum cliente real
foi excluído ou modificado nos testes. Outras abas permanecem disponíveis.

## Validação

- Lock 22 ativação + 27 promoção + 9 negativos antes/depois: PASS.
- TypeScript e npm build: PASS, 512 módulos; warnings históricos Vite mantidos.
- `node scripts/test-c11-license-console.mjs`: 4 grupos PASS, autoridade real,
  colunas/ícones, auth/hash server-side, AES-GCM/AAD/ambos prefixos e respostas
  sanitizadas. Fixtures sem credenciais reais.
- Scoped access: 8/8 PASS; activation handoff: 7 grupos PASS.
- Browser privado Chrome/CDP, localhost:1440x900, 800x1280 e 390x844: PASS.
  Componentes reais + autoridade sintética; troca/vínculo/apelido, senha limpa,
  formatação XF automática, confirmação, MASTER/ADMIN, falha honesta e Escape.
  Não é teste de sessão autenticada real nem instalação em dispositivo físico.
- SQL novo executado com migração em BEGIN/ROLLBACK antes de publicar: PASS.
  Reexecutado sobre funções publicadas em BEGIN/ROLLBACK: PASS. Cobriu isolamento,
  grants anon, USER negado, ADMIN sem exclusão, chave inválida, token preservado,
  fonte compartilhada, MANAGED/SELF_SERVICE, aprovação adicional, prévia completa,
  snapshot/confirmacao incorretos, conflitos de aparelho/identidade e exclusão.
  Contagem remota dos nomes sintéticos após rollback = 0.

## Publicação e segurança

Projeto confirmado: cujbmyhitgomlgwfkaat, Xandeflix Prebuilt, us-east-2.
Migração aplicada via MCP, versão remota **20261012030657_c11_license_console**.
Arquivo inicial criado por CLI migration new e renomeado para a versão retornada
pelo histórico remoto; evita reaplicar a mesma migração com timestamp diferente.
Edge managed-source-vault-admin **v13 ACTIVE**, verify_jwt=true; conteúdo remoto
readback igual ao arquivo local. Não altera outras Edge Functions.
Chamada HTTP sem Authorization ao endpoint publicado retornou 401, conforme esperado.

Grants conferidos: quatro novos RPCs authenticated-only, anon=false; dois helpers
privados anon/authenticated=false; search_path vazio em todos. Cada RPC verifica
manager ativo/escopo ou MASTER no corpo. Advisors: nenhuma nova permissão anon
ou search_path mutável. Quatro avisos de SECURITY DEFINER authenticated são
esperados para os RPCs com checks reais; avisos históricos restantes não foram
alterados. Segredos não constam de listagens, auditoria ou documentação.

Revisão React: sem novas dependências, sem consulta de detalhes por linha,
dialog acessível, cleanup de leitura assíncrona, segredo local ao modal,
ref contra submit duplicado, falha de refresh distinguida de falha da mutação.
Não foi gerado APK nesta tarefa, que altera o painel web e suas funções remotas.
