# C77 — Configuracoes como entrada para dados de ativacao

2026-10-11. Pedido direto do usuario; spec anterior ao codigo. Remover
Ativacao dos menus em todos os dispositivos, manter acesso em Configuracoes.
Engrenagem no topo do celular onde havia Ativacao, disponivel nas demais telas
mobile; retirar engrenagem redundante do rodape. Tablet/TV continuam com uma
engrenagem no menu superior/lateral. Settings preserva Ver dados de ativacao.

Workspace independente canonico C:/Xandeflix/xandeflix-prebuilt-c11-main,
main/origin esperados, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
AGENTS/Architecture/Execution/Activation Lock lidos; dirty C11 preservado por
baseline privada posterior C76. CURRENT_GATE=NONE, patch direto autorizado.
Git commit/push/PR, backend, env e instalacao/reset nao autorizados.
NEXT_GATE_STARTED=NAO.

## Allowlist e aceite

- Header.tsx: remover botao/icone Ativacao de navegacao, substituir atalho Home
  mobile por Settings, retirar Settings do rodape. Mesmo callback/rotas.
- AppShell.tsx/Header.tsx: incluir Settings na apresentacao mobile de retorno
  com icone/Home existente, para acesso/retorno legivel em viewport estreito.
- src/index.css: renomear estilo do atalho, visibilidade mobile e ajuste minimo
  de espaco se necessario; manter lateral TV/tablet e fixacao retrato tablet.
- Esta spec/evidence C11_SETTINGS_NAVIGATION e append docs STATUS/DECISIONS/
  ERRORS_AND_BLOCKERS/EVOLUTION_REPORT; outputs usuais build/Capacitor/APK/
  tsbuildinfo e helpers privados tmp/c77-settings-navigation.

Validar sem novas dependencias: nenhuma entrada Ativacao no Header, somente
uma engrenagem visivel/focavel por layout; Configuracoes -> dados de ativacao
e Voltar, mobile320/390/600/paisagem, tablet retrato/paisagem, TV D-pad.
Acesso pendente/primeira ativacao e logica de identidade/licenca intactos.
Suites existentes de device/nav/lock, build e APK assinatura/assets.
Teste fisico pendente; nenhuma alteracao ao player/source/cat/Auth ou dados.
