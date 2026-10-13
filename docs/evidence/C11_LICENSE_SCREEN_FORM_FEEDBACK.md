# C85 — Editor unificado e organização visual — 2026-10-12

Spec: [C11_LICENSE_SCREEN_FORM_FEEDBACK](../architecture/C11_LICENSE_SCREEN_FORM_FEEDBACK.md).
Preflight ativo: clone independente C:\Xandeflix\xandeflix-prebuilt-c11-main,
main, origin xandeflix2/xandeflix-prebuilt, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline privado de 905 hashes;
dirty anterior preservado. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Resultado funcional

O bloqueio inicial dependia de um principal elegível, não somente do comprovante.
Editor seleciona o único PRIMARY ativo, sem promover legados implicitamente;
com múltiplos principais a escolha permanece explícita. Revisão humana explica
campos pendentes. Conferência manual não cria slots automaticamente: a quantidade
permitida precisa ser aumentada, com motivo e autorização acima de quatro.
Promoção confirmada e aumento de capacidade podem ocorrer no mesmo salvamento.

Nome, apresentação administrativa de aparelhos, classificação/árvore, slots,
capacidade, conferência e fonte agora ficam em rascunho até Salvar alterações.
Uma RPC transacional delega às validações C82/C83 e à substituição de fonte C78.
Snapshot de metadados editáveis impede sobrescrita concorrente; último acesso
não entra no snapshot. Fonte segue cifrada no cofre Edge, sem plaintext no RPC
ou confirmação. Erro tardio reverte lote, pagamentos e auditorias. LINK/DELETE e
reveal auditado permanecem operações próprias; fechar descarta o rascunho.

Tabela desktop preservada: um aparelho por linha; secundários recolhidos sob
o principal. Busca por cliente/código/Local/Tipo expande grupos correspondentes.
Legados, órfãos e múltiplos principais continuam visíveis. Capacidade e ações
não se repetem em secundários. Fonte/quantidade e slot individual compactos;
blocos apenas até 600px. Editor com seções, espaçamento e grid desktop/mobile.
Rótulos/legendas em destaque comum no sistema; valores dos controles em peso
normal. Retornos externos Header/AppShell suprimidos apenas em manager-panel:
o botão próprio do Gestor permanece; demais rotas conservam o retorno.

## Verificações

- Cliente/Edge reais, compilados contra portas sintéticas: uma RPC ou uma chamada
  Edge; nenhuma sequência de saves/fallback parcial; auth, conflito e erros seguros.
  AES-GCM decifrado com AAD canônico para MANAGED e SELF_SERVICE; URLs/configs
  sintéticas não aparecem no payload RPC/ACK. C85 três grupos PASS.
- SQL remoto no projeto cujbmyhitgomlgwfkaat, fixtures aleatórias em BEGIN/ROLLBACK:
  promoção + nome + capacidade/pagamento + metadados + envelope de fonte;
  aumento antes de atribuir novo slot e redução depois de liberar slot alto;
  VERSION_CONFLICT na última etapa reverte todas as alterações anteriores;
  snapshot estável com heartbeat, conflito de edição, ADMIN de outro escopo,
  USER e grants privados. C85 PASS; nenhum cadastro real alterado.
- Regressões SQL C82 principal/capacidade e C83 cadastro/slots/árvore MOVE_ALL e
  KEEP_ACCOUNT PASS com rollback. Cliente C83 e console C78 quatro grupos PASS.
- Browser com TSX/CSS reais: 1920,1507,1461,1024,800,601,600,390,360px;
  todas as colunas/ações sem overflow; tabela acima de 600px e blocos abaixo;
  collapse/expand, pesquisa, órfão visível, Escape/foco, um único submit,
  label 700/valor 400, principal único/múltiplo, promoção confirmada,
  pagamento/quantidade, campo de fonte vazio não bloqueia nome isolado,
  falha sem alteração, retry e duplo submit. Relatório privado sem erros de JS.
- Header/AppShell reais em renderização server-side, desktop/mobile/tablet:
  um retorno em manager-panel; outras rotas preservadas. PASS.
- Build web final e prebuild Activation/Catalog Lock obrigatórios PASS;
  auditoria de provenance/allowlist e HEAD PASS. Artefatos privados em
  tmp/c85-license-screen-form-feedback/. Sem Git/APK/instalação nesta rodada.

## Publicação e limites da evidência

Migration c11_license_editor_atomic_save publicada via MCP com versão remota
20261012131621; arquivo local criado por CLI2.120.0 e alinhado à versão aplicada.
managed-source-vault-admin ACTIVE v18, verify_jwt=true. EXECUTE somente
authenticated, com require_active_manager + escopo; anon/service_role negados.
O lint de SECURITY DEFINER acessível a authenticated é esperado nesta RPC
administrativa e não equivale a acesso de USER, negado nos testes.

Avisos históricos de Vite (chunks/imports) e advisors fora do escopo não foram
refatorados. Orientações: [Database linter](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[Database functions](https://supabase.com/docs/guides/database/functions).
Não representa validação física Android/TV nem edição de cliente real.
O frontend foi compilado localmente; não houve deploy do frontend ou APK.
