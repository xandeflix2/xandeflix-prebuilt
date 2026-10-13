# C11 — botões do menu lateral centralizados — 2026-10-06

Pedido explícito: centralizar verticalmente os botões da sidebar. Allowlist:
src/index.css, contrato/evidência/relatório e memórias append-only. Sem mudança
em navegação, IDs, ícones, C9, identidade ou regras de seleção; CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Grid de três áreas: logo no topo, nav no centro, acessórios
no rodapé; áreas superior/inferior simétricas com mínimo40px para não colidir.
Sidebar continua rolável em alturas insuficientes, foco continua visível.
Aceitação: centro do bloco de seis botões coincide com centro da viewport
Fire960×540 e tablet1280×800; D-pad sobe/desce e sai/retorna sem perder foco.
