# C76 ? Evidencia e provenance


### C76 ? Troca Live sem fechar fullscreen/PiP (2026-10-11)

Correcao direta: cleanup suspende/limpa somente midia antes do release C9; novo canal autorizado usa updatePreview URI na mesma instancia/id/PlayerView/controlador PiP. Categorias filtram apenas lista. Unmount/negacao/falha encerram player e autorizacao; comandos concorrentes bloqueados durante handoff. C75 sem faixa duplicada preservado.
Browser6 layouts + modal/categorias/setas/PiP simulado, midia parada antes do release, guard sem sobreposicao, negacao/falha de update/recuperacao e unmount durante acquire PASS. Java21:172 testes,0 failures/errors/skipped, inclui suspend proxy ExoPlayer e flags headless inline/full/PiP; testes nao certificam janelas reais. Live7/Cast/awake/backdrop/continuidade, lock22+27+9, TS/Vite/Gradle PASS.
APK 12379300 bytes, SHA256 6C6B7B8B46C0F496CDF985C6E9CC1EF87B8BBCB8EBC73B98FFFC9115C6606346, package com.xandeflix.prebuilt v13/1.0, assinatura debug existente e7 assets byte-match verificados. tmp/c76-live-mode-preservation/xandeflix-live-fullscreen-pip.apk. Sem instalacao/backend/env/Git; validacao fisica pendente. NEXT_GATE_STARTED=NAO.

Preflight: workspace independente, main/origin esperados, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Canon/AGENTS/boundary/activation lock lidos. Baseline862 posterior a C75; env omitido do inventario e nao tocado. CURRENT_GATE=NONE, patch direto solicitado, nao novo Gate.

Native update aceita flag suspendPlayback apenas Live com id atual e sem URI simultanea. Remove candidatos antigos, pausa/stop/clearMediaItems sem release/removeView/exitFullscreen/closePiP; geometria nao aplicada em suspensao/PiP. Return accepted=true permite consumir update via bridge existente. URI nova so apos novo acquire. Teste de proxy verifica chamadas exatas ao player e ausencia de release/mudanca de volume, flags de modos e ID constantes; rejeita stale/missing/inactive/mixed. Android framework dos testes JVM usa stubs, nao aparelho.

Browser usa LiveTvPage/AppShell/hooks/EPG reais com catalogo e portas C9/plugin sinteticos. PHONE390x844/844x390, TABLET800x1280/1280x800, TV1280x720/960x540, categorias63/105. Mock falha se midia ativa em release/acquire, sessao/player duplicado ou update nao autorizado. Mesma identidade e sem stop/start/saida fullscreen na troca valida; flags PiP mantidas. Nao equivale a QA de janela PiP ou stream real. Helper privado tmp/c76-live-mode-preservation/browser.cjs.

Build manteve avisos existentes Vite node:fs/path, imports mistos e chunk; Gradle flatDir, apksigner META-INF bibliotecas. Assinaturas v1/v2 validas. Nenhuma atualizacao de source/Auth/dados reais/env ou Git, nenhum aparelho instalado/resetado.
