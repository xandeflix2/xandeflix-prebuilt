# C116 — cabeçalho mobile transparente — 2026-10-15

Spec anterior ao CSS: docs/architecture/C11_MOBILE_HEADER_TRANSPARENCY.md.
Preflight no clone C11-main ativo independente, main/origin canônicos,
HEAD0f68f169f7728fae17c8311832b7643629e97a02. Baseline privado1.034 arquivos,
AGENTS/Architecture/Execution/Activation Lock lidos; patches anteriores
preservados. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

Única mudança de produção: src/index.css. Header mobile até600px, excluindo
tablet/TV/quadrado/lateral, tem fundo e borda inferior transparentes. Shell
recebe faixa superior limitada96px+safe-area usando --navigation-ambient já
publicada pelo hero; mantém fallback escuro. Gradiente/halo da página, menu
inferior, alturas, marca, alvos, foco e callbacks intactos. Sem novos hooks,
requisições, lógica de carregamento, status bar Android ou alterações nativas.

Inspeção isolada com Header/CSS reais e cores sintéticas PASS:320/390/430/600px,
transparência/cor atrás da marca, sem overflow e geometria idêntica antes/depois;
mudança de paleta/fallback; configurações/Voltar/scroll sticky; comparação
antes/depois idêntica em tablet/Fire/lateral/quadrado. Screenshots before/after
e inspection.json em tmp/c116-mobile-header, sem fonte/backend/rede.
Build TypeScript/Vite, lock26+27+9, sync/Gradle,7 assets/assinatura PASS.
Sem nova falha; avisos Vite/flatDir prévios permanecem. Não foi necessário
adicionar teste permanente para este ajuste visual reversível.

APK: tmp/c116-mobile-header/Xandeflix-v1.0.19-C116.apk,
package com.xandeflix.prebuilt, code19/name1.0.19, min23/target35,
11.447.971 bytes, SHA256
6d5cd897beb5b6166e0ebbf257129e19450c9b9f95cdda2a175b78410d9a0738.
Produção HTTPS/sem dev server, mesma assinatura C115, APK C115 intacto.
Auditoria incremental baseline/allowlist: tmp/c116-mobile-header/audit.json.
Sem instalação/publicação/Git/backend/reset/novo Gate. QA física pendente;
fixture visual não representa fonte ou hardware real.
