# C11 — ativação simples, diagnóstico recolhido e contato para múltiplos dispositivos

Especificação anterior ao código — 2026-10-07. Pedido explícito do usuário:
mostrar código, status Autorizado após confirmação, chave permanente e contato
WhatsApp configurável por masters; esconder informações técnicas até um clique
e permitir copiar o diagnóstico ao gestor.

## Autoridade e preflight

Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, .git independente;
main, HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
origin https://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS, Architecture,
Execution, Source Data Boundary e C11_NEW_DEVICE_ACTIVATION_LOCK lidos.
Lock antes da edição PASS (22 ativação, 27 promoção, negativos estáticos).
Dirty anterior preservado pelo baseline local; histórico e projeto original
somente leitura. CURRENT_GATE=NONE; ciclo local autorizado por pedido direto;
NEXT_GATE_STARTED=NAO. Commit/push/PR não autorizados nem executados.

## Critérios de aceitação

1. Apresentação inicial: código e status legível, chave permanente/copiar,
   pergunta sobre uma licença em vários dispositivos e contato, nessa ordem.
   Sem enums, campos de fonte, formulários legados ou dados internos visíveis.
2. Status Autorizado usa a decisão efetiva existente, incluindo falha fechada
   quando preflight remoto não confirma; nenhuma alteração do protocolo A1,
   geração/persistência da chave, polling, licença, delivery ou boot.
3. Diagnóstico começa recolhido em instalações novas e existentes. Clique,
   teclado e D-pad abrem/fecham, com aria-expanded/controls. Operações técnicas
   anteriores e recuperação ficam nele. Cópia contém apenas campos permitidos
   de estado/contagens/erros classificados. Excluir chave permanente, tokens,
   credenciais, URLs de fonte, payloads, mensagens remotas livres e sessões.
   Clipboard com confirmação/erro legível; nenhuma mensagem é enviada pelo app.
4. WhatsApp remoto próprio (multi_device_whatsapp), independente do suporte
   legado. Master significa OWNER ACTIVE conforme private.require_master_manager
   existente; ADMIN, inativo, usuário comum e anon não podem gravar/gerenciar.
   Contato é global deste plano de controle e público por finalidade explícita;
   não existe contato de exemplo nem número presumido. Vazio remove o contato.
   Somente número internacional válido, 8–15 dígitos, sem zero inicial, com DDI.
5. RPC pública somente retorna o contato publicado. Nenhuma concessão de acesso
   direto a tabelas; RLS e revokes existentes preservados. Helpers privilegiados
   em activation_contact_private (schema novo, não exposto); wrappers de RPC
   invoker. Não conceder usage do private existente, preservando os demais
   helpers. Grants mínimos de execute/usage somente no schema novo,
   PUBLIC revogado. Leitura pública é exceção intencional ao auth.uid obrigatório,
   pois o contato deve estar disponível antes da ativação; saída estrita de uma
   chave administrativa pública. Escritas sempre exigem auth.uid e OWNER ativo.
6. Consulta do contato não bloqueia código/chave/offline nem resolve fonte;
   timeout, cancelamento e cleanup, retry por online/reabertura. Sem número
   configurado ou serviço indisponível, mensagem honesta e sem link fictício.
7. Painel gestor > Sistema: carregar/salvar contato para master, feedback e
   erro sem informar sucesso antecipadamente. Aprovação/revogação de licença e
   dispositivos permanece sob a autoridade remota atual.
8. Verificar UI real nos estados pendente/autorizado/revogado, cópia sem segredos,
   telas estreitas/TV, serviço indisponível e permissões SQL em transação rollback.
   Lock depois e no prebuild; typecheck/build; APK standalone e atualizações -r
   somente nos três alvos já autorizados, sem limpar identidade ou catálogo.

## Allowlist estrita

- src/ui/pages/ActivationPage.tsx e seu novo CSS específico.
- src/ui/activation/activation-diagnostics.ts e activation-clipboard.ts (novos).
- src/control-plane/client/multi-device-contact.service.ts (novo).
- src/debug/manager/ManagerMultiDeviceContact.tsx (novo), ManagerPanelPage.tsx
  somente import e montagem na aba Sistema com sessão atual.
- Uma migração gerada pelo CLI: c11_multi_device_whatsapp_contact; helpers/RPCs
  e chave multi_device_whatsapp somente. Não editar migrações antigas.
- scripts/test-c11-activation-key-visibility.mjs: adaptar assertions de UI ao
  pedido, preservando testes de estabilidade/chave/falha fechada/cópia; novos
  testes deste recurso. Nenhuma alteração dos testes do lock canônico.
- Esta spec, docs/evidence/C11_ACTIVATION_SIMPLE_UI_AND_MULTI_DEVICE_CONTACT.md;
  docs/STATUS.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md, EVOLUTION_REPORT.md e
  C11_OPTIMIZATION_REPORT_20261006.md somente append; relatório seção44.
- Assets gerados Capacitor Android e APK raiz, provenientes do build verificado.
  Harness/evidências privadas em tmp/c11-activation-ux-20261007 (ignorado).

Sem refatoração do motor, identidade, fontes, playback, pagamentos ou permissões
de outros recursos. A migração aditiva e o controle master serão revisados e
testados antes de aplicação somente no projeto cujbmyhitgomlgwfkaat.
