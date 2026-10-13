# C11 — PLAYER_CAST_CONTROL_VISIBILITY — evidência de 2026-10-06

Contrato: [C11_PLAYER_CAST_CONTROL_VISIBILITY](../architecture/C11_PLAYER_CAST_CONTROL_VISIBILITY.md).
Clone C11 independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
correção local explicitamente solicitada. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Specs precederam código. Sem Git/backend/reset/alteração de identidade.

## Implementação

NativePlayerActivity vincula visibilidade de Transmitir à visibilidade dos controles Media3 e ao estado PiP. Callback é removido no encerramento.

## Verificação e limites

Compilação Java e testes passaram. S24 com APK intermediário FCBA4352 reproduziu episódio real; screenshots próprios mostram ícone junto aos controles e ausência do ícone após ocultá-los. O mesmo código nativo está no APK final. Esta evidência não certifica transmissão em receptor Cast.

Typecheck/build/lock canônico e APK final passaram. Dados detalhados de fixtures
e aparelhos em tmp/c11-phone-series-20261006 (ignorado, sem conteúdo privado).
A entrega consolidada, hash e preservação de dados estão no
[relatório completo](C11_OPTIMIZATION_REPORT_20261006.md), atualização a partir do item24.
