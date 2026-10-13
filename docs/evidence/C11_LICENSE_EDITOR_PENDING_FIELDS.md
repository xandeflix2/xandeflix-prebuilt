# C86 — Evidência de pendências do editor de licença

12/10/2026. Preflight: workspace/top-level independente C11, origin esperado, main, HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. AGENTS e contratos canônicos consultados; baseline privado de 910 arquivos, sem segredos. Nenhum Gate seguinte, Git, backend, cadastro real ou APK alterado.

## Resultado

Validação existente representada por mensagem e campos correspondentes. Controles pendentes recebem contorno âmbar, `aria-invalid` e `aria-describedby`; confirmações destacam o rótulo inteiro. Avisos corrigíveis viraram botões, com foco e rolagem para o controle habilitado correspondente. IDs únicos por editor, sem seletor derivado de texto. Erros globais não corrigíveis no formulário permanecem informativos. Condições de validação e payload atômico preservados.

## Verificação

- Browser real headless, componentes reais e autoridade sintética isolada: 1507×900 e 390×844, formulário inicial sem marcações, aumento de 4 para 5, motivo/ref/comprovante/checkbox, foco pelo clique e Enter, campo visível no modal e vínculo acessível da mensagem. Contorno permanece também em foco.
- Correção remove marcações e habilita Salvar; uma única chamada sintética confirma capacidade 5 e uma tela adicional. Nenhuma chamada de salvamento ao apenas navegar pelas pendências.
- Cliente, quantidade, simultaneidade, Local/Tipo, principal ausente, promoção e confirmação, destino e slot secundário, nome/URL/credenciais Xtream/confirmação de fonte: todos os avisos apontam para o controle correspondente. Se usuário preenchido e senha ausente, foco vai à senha.
- `npm run typecheck`: PASS. `npm run build`: PASS, incluindo Activation/Catalog Lock, 9 controles negativos e testes exigidos pelo prebuild. Warning de tamanho de bundle já existente; sem falha.
- `scripts/test-c11-license-editor-atomic-save.mjs`: três grupos PASS (cliente, Edge/AES, retorno). Sem publicação de código remoto.
- Screenshots de revisão e motivo em foco desktop/mobile inspecionados. Logs, fixture, relatório e baseline privados em `tmp/c86-license-editor-pending-fields/`.

Harness corrigido durante verificação: teclado CDP precisava de `text: '\r'` para ativar Enter; múltiplos IDs em `aria-describedby` devem ser checados individualmente. Eram problemas de instrumentação, sem regressão funcional observada.

Frontend local compilado. Não equivale à instalação física em tablet/celular. NEXT_GATE_STARTED=NAO.
