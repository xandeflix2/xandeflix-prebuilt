# C11 — fluidez da navegação D-pad — 2026-10-06

Pedido explícito: otimizar velocidade e fluidez do D-pad. Correção local no
clone C11, CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem operações Git/remotas.

Diagnóstico: trilha cria/filtra arrays a cada passo horizontal e novamente
no passo vertical. Grade relê todos os controles e computed grid columns
a cada tecla. focus() permite rolagem implícita, seguida de outra explícita.
Throttle55ms descarta também pressões discretas rápidas, não apenas repetição.
Estes são mecanismos no código; não equivalem a causa única nem SLA.

Allowlist: src/ui/hooks/useDpadNavigation.ts, novo
scripts/test-c11-dpad-navigation.mjs; este contrato, evidência, relatório e
quatro memórias append-only. Não modificar player, C9, busca/catálogo,
ativação, transporte ou regras de seleção de conteúdo.

Usar irmãos diretos nas trilhas horizontais; preservar índice nas verticais.
Cache fraco de controles/colunas de grade, invalidado por alterações do DOM
e viewport, liberado ao desmontar/desabilitar. Foco síncrono preventScroll;
agrupar rolagem no próximo frame, somente para alvo ainda conectado/focado.
Passo horizontal dentro da mesma trilha só move seu scrollLeft e só quando
a capa sai da área visível. Não mover a página verticalmente nesse passo.
Limitar apenas auto-repeat55ms, preservando pressões discretas, Enter, Back,
edição de texto e eventos já tratados por controles locais. Evitar alvo
oculto no fallback. Não adicionar animações de foco/scroll custosas.

Aceitação: browser com hook real, grade/trilhas/sidebar/retorno, coluna após
resize e atualização/disabled no DOM, pressões discretas rápidas, repeat,
Enter único, input livre e cleanup. Medir contadores de consultas/estilos
e rolagem para verificar redução; testar D-pad físico no Fire. Medições são
evidência daquela execução, sem promessa de latência de rede ou FPS universal.
