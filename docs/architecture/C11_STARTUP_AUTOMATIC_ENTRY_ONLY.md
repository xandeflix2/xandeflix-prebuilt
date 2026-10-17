# C150 - carregamento sem entrada manual antecipada - 2026-10-17

## Pedido, preflight e proveniencia

Usuario solicita retirar Entrar agora da carga em todos os dispositivos,
evitando interrupcao manual do preparo. Clone ativo independente
C:\Xandeflix\xandeflix-prebuilt-c11-main, main, origin esperado
https://github.com/xandeflix2/xandeflix-prebuilt.git, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Pasta historica somente leitura.
AGENTS/Architecture/Execution/Source Boundary/Activation Lock/C108/C111/C143
lidos. Baseline1180 e copias em tmp/c150-startup-no-skip; proveniencia C149
conferida por hashes, sem divergencias novas. Lock inicial26+27+9 PASS.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C150_STARTUP_AUTOMATIC_ENTRY_ONLY;
NEXT_GATE_STARTED=NAO. Sem Git/backend/APK/install/reset autorizados neste ciclo.

## Especificacao anterior ao codigo

- Remover o unico botao Entrar agora, em StartupArtworkPreparation, sem
  condicionamento por dispositivo. Outros perfis ja nao oferecem esse botao.
  Eliminar refs usadas somente para a acao manual.
- Escape/BrowserBack/Backspace e navegacao/confirmacao no overlay de preparo
  nao podem liberar a Home nem acionar o shell inerte. Consumir essas teclas
  durante o preparo, sem chamar done. Nenhum handler novo em App/native.
- Focar o proprio dialogo de progresso, programaticamente focavel com
  tabIndex=-1 apenas quando modal; nao deixar foco em botao removido. Restaurar
  foco existente do Hero somente na conclusao automatica e limpar listener/
  isolamento em done/unmount. Preservar refs/efeitos e isolamento consolidados.
- Manter criterios automaticos existentes: catalogo utilizavel/autorizado,
  leitura parental obrigatoria, amostra limitada de imagens e fallbacks,
  estabilidade500ms e limite defensivo20s contra imagens indisponiveis.
  Esse limite e de apresentacao, nao interrompe importacao nem downloads.
  Nao exigir carga de todo catalogo em segundo plano nem criar espera infinita.
- Preservar Tentar novamente/ativacao/portal em erro ou offline. Nao alterar
  boot/source/catalog/search/player/stores/Java/CSS/dependencias/versao Android.
  Esta emenda substitui somente Entrar agora/Back como bypass em C108/C111.

## Allowlist e aceitacao

src/ui/components/StartupArtworkPreparation.tsx (remocao da acao, captura de
teclas e foco no dialogo); src/ui/components/StartupLoadingScreen.tsx (somente
tabIndex do modal); scripts/test-c11-startup-artwork.mjs (casos de teclas sem
liberacao antecipada; preservar todos os casos existentes);
este documento e docs/evidence/C11_STARTUP_AUTOMATIC_ENTRY_ONLY.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs privados tmp/c150-startup-no-skip e saidas ignoradas de build.

Regressoes existentes de preparo limitado/estabilidade/timeout/cancelamento,
preferencias C143 e lock antes/depois; builds web e padrao/typecheck.
Conferir ausencia global do botao e preservacao das acoes de erro; foco,
teclas e cleanup reais em portas sinteticas. Checklist React e auditoria
inversa dos patches/hashes, memorias append-only, HEAD/index/APK149 intactos.
Nao executar antigos harnesses CDP nem alegar teste fisico/instalacao.
