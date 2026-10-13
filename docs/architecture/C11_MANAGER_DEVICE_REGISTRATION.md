# C80 — Cadastro descritivo e capacidade de aparelhos

Pedido direto autorizado em 2026-10-12: cadastro no Gestor com quantidade de
aparelhos e Local/Tipo escolhido, mensagens informativas e visão consolidada
na tabela de licenças. Não alterar automaticamente clientes reais existentes.

## Preflight e provenance

Workspace ativo independente C11 `C:/Xandeflix/xandeflix-prebuilt-c11-main`;
origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, main, HEAD
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. Dirty cumulativo preservado;
baseline SHA-256 privado exclui .env. AGENTS, Architecture/Execution Contract,
Source Data Boundary e activation lock lidos. CURRENT_GATE=NONE; ciclo C80
do pedido direto, sem próximo Gate/commit/push/PR/APK. Supabase alvo confirmado:
`cujbmyhitgomlgwfkaat`, Xandeflix Prebuilt, us-east-2. Alteração do fluxo remoto
necessária ao cadastro autorizado; nenhum cadastro real usado como teste.

## Especificação anterior ao código

- Novo e existente cliente: Local/Tipo obrigatório, livre até 100 caracteres,
  com sugestões Sala/Quarto/Celular/Tablet/Outro; persistir em device_label.
- Quantidade permitida de aparelhos: inteiro 1–100, capacidade da licença;
  quantidade não cadastra nem autoriza aparelhos fictícios automaticamente.
- Reproduções simultâneas: limite próprio explicitamente configurável 1–50,
  não confundir com aparelhos cadastrados. Preservar política comercial/C9.
- Registrar capacidade e apelido na mesma transação da ativação canônica;
  manter chave permanente/token, escopo MASTER/ADMIN, auditoria e cofre cifrado.
  Falha de chave/escopo/fonte/limite reverte tudo. Compatibilidade com chamadas
  anteriores sem estes campos, sem mudar RPC canônica ou identidade do app.
- Tabela desktop usa largura disponível, sem corte; mobile até 600 px em blocos.
  Local/Tipo ganha coluna; mesma fonte lista códigos/apelidos de outros aparelhos
  visíveis ao gestor, usando vínculos por ID (não nomes/URLs). Sem N+1 remoto.
- Slots mostram ocupação/capacidade e códigos das vagas ocupadas. Total de
  aparelhos do cliente em coluna Aparelhos vinculados; limite simultâneo junto
  ao total com rótulo explícito. Preservar todos os demais campos e ações.
- Traduzir resultados/reprovações da ativação para português compreensível,
  sem códigos internos, sem segredos e sem falso sucesso após falha de refresh.
- Não renomear automaticamente apelidos antigos nem mudar tipo técnico do app.

Refinamento autorizado durante o mesmo ciclo: escolha explícita PRINCIPAL ou
SECONDARY antes de salvar. Secundário exige código do principal, mesmo cliente,
mesma licença/fonte e principal autorizado. Impedir cadeia secundário→secundário,
autorreferência e vínculo entre clientes. Aparelho antigo sem classificação pode
ser designado principal ao selecioná-lo explicitamente para um novo secundário;
sem backfill automático de registros reais. Guardar a relação em schema privado,
retornar apenas classificação/código sanitizados na listagem autorizada. Cadastro
de novo cliente é principal; secundário utiliza cliente já ativo. A allowlist
inclui esse relacionamento na mesma migration já prevista.

## Allowlist

Detalhe da implementação antes da migration: novo cliente usa complete-device-
activation; aparelho adicional usa license-device (C78), que já valida a chave
permanente e preserva o token original. O wrapper transacional exige que o
principal/referência pertença à licença escolhida e tenha a mesma fonte. Assim,
não utiliza o caminho legado de reutilização que gera um token novo. Continua
reutilizando os helpers canônicos de chave, escopo, limites e auditoria.
O teste C78 existente entra na allowlist para carregar a nova dependência de
sumarização, mantendo suas verificações anteriores intactas.

Este documento; docs/evidence/C11_MANAGER_DEVICE_REGISTRATION.md; docs/STATUS.md,
EVOLUTION_REPORT.md, DECISIONS.md, ERRORS_AND_BLOCKERS.md; src/debug/manager/
ManagerPanelPage.tsx, AdminLicensesView.tsx, AdminLicensesView.css,
ManagerDeviceRegistrationFields.tsx, ManagerDeviceRegistrationFields.css,
license-device-summary.ts, manager-activation-feedback.ts; src/control-plane/
control-plane.types.ts e client/manager-remote-control-plane-authority.ts;
supabase/functions/managed-source-vault-admin/index.ts; uma migration gerada
por supabase migration new c11_manager_device_registration; supabase/tests/
c11_manager_device_registration.sql; scripts/test-c11-manager-device-registration.mjs;
tsconfig.tsbuildinfo se recompilado. Artefatos privados em tmp/c80-device-registration.

## Aceitação

Refinamento autorizado pelo usuário durante C80: no modal Editar licença,
adicionar opção Já cadastrado para transferir um aparelho visível ao gestor,
identificando o principal destino e a origem antes de confirmação explícita.
Transferir apenas esse aparelho, preservando código/chave/token; desvincular
licenças anteriores, reutilizar exatamente a fonte do principal e fechar sessões
anteriores. Não excluir clientes/fontes/identidades, não executar transferências
reais como teste. ADMIN precisa controlar origem e destino; MASTER pode operar
ambos. Bloquear principal com secundários, autorreferência, secundário como
principal, alvo revogado e falta de vagas. Modal também permite novos aparelhos
com chave permanente e classificação explícita, para MANAGED e SELF_SERVICE.
Relação/limites/vínculos/Local são transacionais. Allowlist estendida a
ManagerLicenseEditor.tsx e uma segunda migration gerada pela CLI para este
refinamento no mesmo ciclo C80; reutilizar os testes C80 já previstos.
Correção de validação inclui migration adicional gerada pela CLI: registrar a
aprovação explícita de capacidade SELF_SERVICE antes de atualizar seus limites,
na mesma transação, mantendo chk_self_service_single_device e aprovação por
aparelho/fonte. Sem liberar acesso USER nem reescrever a migration publicada.

Testes reais de cliente/Edge e SQL transacional com fixtures revertidas, incluindo
MASTER/ADMIN próprio/ADMIN outro/USER/anon, chave incorreta, limites e rollback.
Conferência browser de cadastro e tabela, mensagens, escopo e ausência de corte.
Build/lock obrigatórios aprovados; publicação apenas migration/Edge deste escopo,
auditoria de permissões e allowlist final, sem dados reais alterados.

## Resultado
C80 concluído; todas as verificações/publicação e correção SELF_SERVICE registradas em docs/evidence/C11_MANAGER_DEVICE_REGISTRATION.md. Nenhuma transferência real nem operação Git/APK.
