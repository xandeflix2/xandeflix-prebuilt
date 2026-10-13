# C11 — tablet em retrato: Live empilhado e menu no topo — 2026-10-07

Pedido explícito do usuário durante o ciclo EPG/fullscreen. Mesmo preflight,
clone independente C11/main/HEAD61ec0090/origin canônico, baseline669 e dirty
anteriores. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.

Antes do código: tablet identificado por UA tablet (Android sem Mobile,
iPad/Mac touch; excluir TV/Fire) e viewport em retrato. Somente nessa combinação,
Live usa apresentação empilhada: player16:9 acima da faixa do canal, abas de
categorias/canais e listas roláveis abaixo, guia retrátil no limite inferior.
Menu global permanece no Header com marca e seis botões; Canais somente
texto igual Filmes/Séries/Busca/Início. Ativação mantém chave. Mesmo menu
para todas as rotas no tablet em retrato. Sem menu inferior nesse modo.

Live mantém sua faixa título/contador/Home/Back/Cast abaixo do menu global;
não substituir a marca/menu por portal de celular. Telefone conserva cabeçalho
compacto/portal e navegação inferior. Tablet paisagem e Fire/TV preservam
apresentação ampla/lateral anterior. EPG/fonte/player/sessão idênticos, sem
novo fetch de catálogo ou preload na instalação. Rotação mede bounds existentes.

Allowlist adicional: novo hook useLivePresentation.ts, AppShell.tsx,
Header.tsx, LiveTvPage.tsx e index.css, este contrato/evidência/relatório/memórias.
Compartilhar CSS do Live empilhado por classe efetiva; altura desconta menu
superior e safe-area, sem reservar navegação inferior no tablet. Botões mínimos
44px; evitar overflow em600/800/960px em retrato. Não alterar fonte/runtime,
phone-series detail, artwork, auth/activation, catálogo ou outros layouts.

Aceitação: browser reais AppShell/Header/Live+EPG em UA tablet e phone/desktop,
portrait→landscape→portrait; seis links navegáveis no topo e labels/ícones
corretos em todas as rotas; abas/listas/EPG sem lacuna, scroll/restauração,
superfície16:9 acima das listas, zero overflow e nenhum menu inferior visível.
S24 mantém correções anteriores; SM-X610 físico em retrato valida novo fluxo
e retorno; paisagem mantém menu lateral/Live amplo. Fire smoke preservado.
Build/lock/assinatura/assets e update-r nos três, dados/firstInstallTime intactos.
Documentar limitações das fixtures e física sem fonte/credenciais/payload.

Retorno global existente, quando aplicável, fica em sua linha abaixo do menu
no tablet em retrato para preservar ação e espaço dos seis links; Home/Live
mantêm suas regras de retorno anteriores. Sem remover callback/histórico.
