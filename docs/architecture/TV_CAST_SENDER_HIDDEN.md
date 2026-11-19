# CANON-01-TV-CAST-SENDER-HIDDEN — especificação anterior ao código

Pedido explícito atual: ocultar o botão Transmitir no Fire Stick/Android TV, que são receptores. Continuação local isolada do último APK instalado; root/L1 e recebido encerrado permanecem congelados. Git add/commit/push/PR/merge/main, backend/admin/deploy, versão, native/bridge/C9/buffer, fonte/credenciais/catálogo e reset não autorizados.

Patch mínimo: somente remover showUnavailable da instância CastButton da barra abaixo do preview em LiveTvPage.tsx. O comportamento padrão existente já retorna null enquanto não houver remetente Google Cast móvel disponível, inclusive em TV. Não usar display:none para esconder um botão desativado nem criar nova lógica nativa. Telefone e tablet preservam função, posição, nome acessível e ícone apenas no tablet. Wi-Fi/Favorito/modal mantêm fluxo anterior. Nenhuma refatoração de CastButton por propriedade agora não utilizada.

Baseline de origem: ciclo imediatamente anterior executou173 controles/28 suítes,13 comandos oficiais e222 testes Android/37 suítes; dados preservados e hashes de entrada/fechamento verificados. Referência explícita em BASELINE_REFERENCE.json, não novo teste fabricado. Executar fresh canon:check e C11 antes do patch, e fresh canon:check/canon:test/C11/typecheck/build depois. Para este ajuste de uma propriedade, não repetir os13 comandos do antigo gate L1 ou alegar que foram reexecutados. Manter todas as28 suítes/173 controles e21 cenários de rede; novo runner só registra a emenda e três negativos de recibo/mutação.

QA Chromium dos componentes reais com portas simuladas: TV Fire e Android TV genérico sem nenhum botão Cast, Wi-Fi depois do badge AO VIVO e antes de Favorito; player no topo. Retestar celular/tablet/retrato/quadrado e modal sem alterar testes históricos. Sem teste de produto que espelhe esta propriedade; QA mede DOM/geometria real. Build por npm preserva prebuild/C11, cap copy e registro oficial3 plugins base, unit tests Android e assemble offline, auditoria de package/assinatura/permissões/plugins/assets/privacidade. APK universal mesma1.0.37/code37.

Entrega recuperável autorizada pela continuação da correção já em uso: atualizar in-place somente o Fire AFTSS conectado, com mesmo package com.xandeflix.prebuilt/assinatura; comparar os11 registros privados e firstInstallTime em RAM e guardar somente booleanos. Sem uninstall/reset/rotacionar dados/PIN/PUK. Tablet/celular não serão reinstalados neste ciclo; comportamento preservado por QA. Confirmar ausência do Cast no Fire e abertura/Back/foco do modal. Android TV genérico terá QA em navegador, sem alegar aparelho físico não conectado. Não medir Mbps/buffer/estabilidade nem alterar receiver.

Novo recibo31 só concede LiveTvPage.tsx e runner com predecessores reais do gate30. Documentos normativos append-only;30 recibos preservados. Fonte da autorização UTF-8/LF SHA256 838af459996b558596ac5f67ec20e44e6b4c4809355a501bc622fafececd94c5, registro de texto, não assinatura humana. Allowlist fechada9 caminhos:
- src/ui/pages/LiveTvPage.tsx
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-TV-CAST-SENDER-HIDDEN.json
- docs/architecture/TV_CAST_SENDER_HIDDEN.md
- docs/evidence/TV_CAST_SENDER_HIDDEN.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## CANON-01-TV-CAST-SENDER-HIDDEN — registro local — 2026-10-24

Pedido explícito atual substitui somente a decisão anterior de exibir Cast desativado em TV: Transmitir fica ausente em Fire Stick/Android TV, usando capacidade móvel já existente. Telefone/tablet e ícone do tablet mantidos. Patch funcional de uma propriedade; spec e allowlist9 anteriores ao código, recibo31 com dois grants e predecessores reais do gate30. SHA256 da transcrição UTF-8/LF 838af459996b558596ac5f67ec20e44e6b4c4809355a501bc622fafececd94c5. Baseline atual canon/check e C11 exit0; canon:test173/28 da execução imediatamente anterior preservada com hashes exatos, sem alegar nova execução. Validação final/build/APK e instalação Fire ainda pendentes neste registro. Sem Git/admin/reset/versão, native/source/C9/buffer ou próxima implementação.


## CANON-01-TV-CAST-SENDER-HIDDEN — encerramento — 2026-10-24

RESULT=LOCAL_READY_FIRE_UPDATED_CAST_HIDDEN. Única alteração de produção: retirar showUnavailable da instância CastButton abaixo do preview. Política existente limita remetente a celular/tablet; botão ausente no Fire Stick/Android TV. Tablet mantém ícone apenas, celular mantém ação no topo. Wi-Fi/modal/Favorito mantidos. Nenhuma mudança de receiver, native/bridge/player, C9/buffer, fonte/catálogo/identidade/licença, permissões, package/dependências/versão ou backend.

Baseline: fresh canon:check/C11 exit0, e referência explícita à execução real anterior173/28 com bytes/log SHA verificados, não novo canon:test de baseline. Validação final específica5/5 comandos npm exit0: canon:check, canon:test, C11, typecheck e build. 176 controles/28 suítes,905 protegidos,31 recibos com30 anteriores preservados;21 cenários de rede/127 Prebuilt preservados. Não se alega reexecução dos13 comandos do gate anterior. Cap copy/registro oficial3 plugins/C11 antes de Gradle e entrega PASS. Android222 testes/37 suítes executados neste ciclo,0 falhas/erros/skips, assemble offline PASS.

QA Chromium13 cenários com componentes reais/portas simuladas: Fire960/1280 e Android TV genérico1280 sem Cast no DOM, player no topo, badge AO VIVO/Wi-Fi/Favorito na ordem correta; telefone/tablet/retrato/quadrado e modal mantidos. Imagens inspecionadas. Somente Fire AFTSS recebeu update -r neste ciclo; certificado/SHA do APK instalado conferidos,11 registros privados e firstInstallTime preservados em RAM, apenas booleanos registrados. Sem uninstall/reset. UI física confirmou ausência de Cast, Wi-Fi/modal/Back/foco. Android TV genérico não é aparelho físico conectado; celular/tablet não foram reinstalados. Nenhuma nova alegação de buffer, velocidade ou estabilidade prolongada.

APK Xandeflix-v1.0.37-tv-sem-transmitir-20261024.apk, SHA256 66e7757c5c77143520466f41b86634481e464e19ad9d8accaaac135d7fa0e783, 11425218bytes; mesma1.0.37/code37/package/assinatura, plugins/assets/permissões auditados. Allowlist9, docs normativos append-only, root/L1 e recebido congelados, index vazio e HEAD/main/branch preservados. Auth UTF-8/LF SHA256 838af459996b558596ac5f67ec20e44e6b4c4809355a501bc622fafececd94c5, recibo blobLF f1e466b249afac7a6dab2a62952dc83a4dd31540, SHA256 fb6c4b27c68e96bd4a20c61658ca57080fe494fe2831fe78121951605198323d. Transcrição não é assinatura humana. Nenhum Git add/commit/push/PR/merge/main, escrita administrativa/deploy ou próxima implementação.
