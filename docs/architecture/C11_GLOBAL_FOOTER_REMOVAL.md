# C11 — remoção do rodapé global — 2026-10-06

Pedido explícito posterior à geração do APK690C5F...: remover de todos os
dispositivos o rodapé Xandeflix Prebuilt/Catálogo Local/Snapshot mostrado no print.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; mesmo workspace/remote/main/HEAD dos
ciclos mobile/Fire. Sem Git/backend. Lock obrigatório antes/depois/build.

Allowlist: src/ui/components/AppShell.tsx, somente retirar a renderização do footer
e referência ao snapshot usada exclusivamente ali; docs/evidence/
C11_GLOBAL_FOOTER_REMOVAL.md, este contrato, adendo no relatório consolidado e
quatro memórias append-only. Saídas build/sync/APK ignoradas. Não remover navegação
inferior mobile, controles de player ou dados do snapshot/catálogo.

Aceitação: AppShell real nos perfis phone/tablet/TV não contém footer/Snapshot;
Início/Voltar e navegação continuam disponíveis. Typecheck/build/lock/Java e APK
verificados, atualizações in-place autorizadas preservando estado privado.
