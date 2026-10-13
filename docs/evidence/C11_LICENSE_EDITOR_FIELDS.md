# C83 — Campos completos e reorganização de principal — 2026-10-12

## Escopo e autorização

Pedido atual e emenda documentados antes do código em
`docs/architecture/C11_LICENSE_EDITOR_FIELDS.md`. Clone independente
`C:\Xandeflix\xandeflix-prebuilt-c11-main`, origin canônico, main, HEAD
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. Preflight e contratos
AGENTS/arquitetura/execução/source boundary/Activation Lock lidos. Dirty C11
anterior preservado. Sem Git, APK, instalação ou alterações no projeto protegido.

## Resultado

- EDIT reúne cliente, Local/Tipo, plataforma/tipo, classificação, fonte por
  metadados, contagem na mesma fonte, slot individual e dados automáticos readonly.
  Quantidade, simultaneidade, motivo e conferência manual acima de quatro continuam
  exclusivamente neste formulário. Submenu Vincular permanece separado.
- Nome atualizado por ID canônico da conta em customer_accounts/customer_profiles
  quando presentes; abas consultam a mesma identidade. Sem substituição global de
  textos, alteração de homônimos ou reescrita da auditoria histórica. Proteção de
  nome alterado em outra sessão; validação e unicidade de nickname self-service
  preservadas, com mensagens humanas.
- PRIMARY → SECONDARY abre modal dedicado: novo principal, lista dos filhos,
  transferir todos ao novo principal/fonte ou manter sob outro principal da conta
  atual, capacidade projetada, slot livre e confirmação. Confirmar prepara revisão;
  Salvar dados do aparelho aplica. Cancelar/Escape preservam o editor e os vínculos.
  Sem outro principal atual, KEEP_ACCOUNT não pode ser confirmado.
- Servidor revalida snapshot dos filhos, autorização de todas as pontas, fonte,
  capacidade e slots; reorganiza filhos antes de rebaixar a raiz em uma transação.
  Qualquer conflito reverte tudo. Nenhum filho permanece sob um secundário.
  Submenu de vínculo continua bloqueando rebaixamento implícito de PRIMARY.
- Slots exclusivos por licença, inteiros dentro da capacidade; principal readonly,
  secundário escolhe vaga disponível. Redução não pode deixar slot fora do limite.
  Legados recebem slots durante operação autorizada; nenhum backfill real ocorreu.
  Plataforma/tipo corrigidos em metadados administrativos, preservando telemetria
  original e preferência local do aplicativo. Código/chave/token/último acesso,
  modo/status/criação, catálogo, importador e cofres preservados.

## Publicação e verificação

Supabase exclusivamente `cujbmyhitgomlgwfkaat`:
`20261012105040_c11_license_editor_fields.sql` e
`20261012110747_c11_license_editor_customer_validation.sql`, versões remotas
conferidas. Novas RPCs de edição exigem gestor ativo/escopo; metadados retornados
pelas consultas existentes, sem URL/credencial no novo DTO. Cofre mantém seu fluxo
de revelação autorizado preexistente.

- SQL C83 em BEGIN/ROLLBACK: rename por ID, homônimo intacto, perfil canônico,
  stale name, USER/ADMIN estrangeiro negados, duplicidade/range/redução de slots,
  metadados e campos automáticos preservados. TREE MOVE_ALL/KEEP_ACCOUNT, lista
  desatualizada, capacidade insuficiente, preservação de identidade e rollback PASS.
  Regressão SQL C82 passou junto à aplicação inicial, com fixtures revertidas.
- Cliente real com portas sintéticas: C83 edição/tree/normalização/erros/autenticação
  PASS; console C78 quatro grupos e política C82 três grupos PASS.
- Browser com componentes reais e autoridade sintética: rename/tabela, Local/Tipo,
  plataforma/tipo, readonly, slots, modal secundário, MOVE_ALL/KEEP_ACCOUNT,
  cancelamento, Escape mantendo pai aberto, confirmação sem mutação até salvar,
  desktop1507/mobile390 sem overflow/erros de runtime PASS. Capturas inspecionadas.
- Tabela existente em nove larguras1920/1507/1461/1024/800/601/600/390/360:
  colunas/seis ações visíveis, desktop table-row e mobile grid, foco/Escape e
  scope ADMIN PASS. Nome histórico do marcador C80 identifica harness reutilizado.
- TypeScript/Vite build e Activation Lock PASS, catálogo27/27 e controles negativos.
  Aviso de chunk grande é preexistente. React: hooks incondicionais, estados derivados,
  cancellation/alive/guarda de envio duplo, labels, diálogos/foco e Escape revisados.

Após rollback: zero fixtures C83, zero slots/presentation reais e zero operações
temporárias. Não houve transferência, rename ou teste de pagamento em cliente real.
Teste operacional pelo gestor é distinto da verificação sintética registrada.

## Segurança e provenance

Três tabelas privadas com RLS e nenhum grant direto a anon/authenticated/service;
autorização transacional privada não pode ser forjada por parâmetro/GUC. Novas RPCs
sem execute anônimo, SECURITY DEFINER com search_path vazio e checks de gestor.
Advisors: INFO [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
nas tabelas privadas deny-all e WARN
[SECURITY DEFINER autenticado](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
na fronteira administrativa testada. Demais findings históricos fora deste escopo.

Baseline SHA256 de897 arquivos antes das edições funcionais; relatório privado
`tmp/c83-license-editor-fields/provenance-report.json`. Arquivos modificados neste
ciclo somente na allowlist, HEAD preservado. SQL, capturas, browser reports e logs
privados no mesmo diretório; nenhum segredo real em evidências. NEXT_GATE_STARTED=NAO.
