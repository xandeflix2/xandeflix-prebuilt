# C95 — Reconciliação de fonte no tablet — 2026-10-12

Pedido explícito: corrigir e identificar em tempo real a falha Live persistente
após reinicializar o tablet. Alvo exclusivo SM-X610 RX2X301Q3KY, identidade
confirmada XF-JNQK-NZ77, package com.xandeflix.prebuilt. C94 visual preservada e
empacotamento adiado. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Preflight
workspace/main/origin canônicos; HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.

Especificação antes de intervenção: inspecionar estado sanitizado da execução,
autoridade e catálogo; disparar reconciliação pelo coordenador já existente,
sem copiar configurações em plaintext nem semear catálogo/pointer. Usar a
entrega autorizada do cofre e importação/promoção validada. Confirmar sourceId
local igual à autoridade e reprodução Live real (primeiro frame/estado PLAYING),
não apenas acerto no banco. Se falhar, identificar checkpoint/erro e emendar
allowlist antes de patch funcional. Nenhuma troca de identidade/chave,
uninstall/reset, revogação, mudança de cota ou bypass de licença.

Allowlist inicial: este contrato; tmp/c95-tablet-source/** diagnóstico privado,
baseline/proveniência/evidências sanitizadas; docs/evidence/C11_TABLET_SOURCE_RECONCILIATION.md;
acréscimos docs/{STATUS,EVOLUTION_REPORT,DECISIONS,ERRORS_AND_BLOCKERS}.md.
Operação no tablet autorizada: inspeção, navegação, reprodução, reconciliação
canônica e restart do package. Antes/depois preservar identidade/chave/ativação
privadas por hash sem expor conteúdo. Lock obrigatório antes/depois e antes de
qualquer build/update in-place. Instalação somente se patch necessário, mesma
assinatura e package, sem apagar dados; especificar antes de preparar APK.
Sem Git/backend/publicação/outros aparelhos. Credenciais nunca em logs/docs.
