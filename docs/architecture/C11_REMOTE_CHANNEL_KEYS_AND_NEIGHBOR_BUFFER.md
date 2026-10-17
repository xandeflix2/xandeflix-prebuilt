# C112 — Canal +/− no controle e escopo de buffer vizinho

## Proveniência e autorização — 2026-10-15

Usuário solicita navegação pelos botões físicos de canal para cima/baixo e
limita eventual buffer ao próximo/anterior. Inspeção confirmou controles
Anterior/Próximo no player, resolução local por categoria e IPC com IDs opacos,
mas nenhum mapeamento KEYCODE_CHANNEL_UP/DOWN. C111 foi entregue anteriormente.
Preflight clone independente C11-main/main/origin canônico, HEAD
0f68f169f7728fae17c8311832b7643629e97a02; dirty conhecidos C107–C111 preservados.
AGENTS, Architecture, Execution, Source Boundary, Activation Lock e contrato
C73 lidos. Baseline privado em tmp/c112-live-channel-keys/baseline.json.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/reset/instalação.

## Especificação anterior ao código

1. Android Live preview ativo, inline ou fullscreen e fora do PiP: CH+ emite
   next, CH− emite previous pelo mesmo fluxo nativo/JS/C9 já consolidado.
   MainActivity delega ao plugin existente; não mudar navegação de VOD/episódio.
2. Uma ação por pressionamento inicial (DOWN/repeat0); consumir UP/repetições
   sem emitir múltiplas trocas. Busy impede emissão. Painel/dialog aberto
   mantém navegação própria; D-pad continua foco/menus, sem virar CH+/−.
3. Seguir ordem da categoria atual, cruzar páginas locais, sem mudar categoria
   nem dar volta primeiro/último. Preservar mensagens, guards de previewId,
   canal/snapshot, serialização e aquisição/liberação C9.
4. Controles sem CH+/− continuam usando Anterior/Próximo pela UI/D-pad.
   Nenhuma promessa de eventos recebidos se o firmware/controle não os envia.
5. Escopo de pré-buffer solicitado: somente os vizinhos imediatos, nunca toda
   categoria/lista. Quantidade de conexões permitidas pelo provedor ainda
   desconhecida e perguntada ao usuário. Não inferir da cota de dispositivos
   ou abrir stream extra antes de resolver esse dado. Enquanto pendente,
   buffer atual10–20s/start2,5s/rebuffer4s/bytes/C9 permanecem inalterados.
   Nenhum vídeo em disco, cofre/backend, atualização Media3 ou proxy.

## Allowlist estrita desta etapa independente do limite da fonte

- android/app/src/main/java/com/xandeflix/prebuilt/player/LivePlayerControls.java:
  mapear teclas de canal e reaproveitar emit/guards existentes.
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java:
  delegar CH+/− também no inline; demais teclas somente fullscreen, como antes.
- android/app/src/test/java/com/xandeflix/prebuilt/player/LivePlayerControlsTest.java:
  política de teclas, sem Android/network real ou enfraquecer critérios antigos.
- scripts/test-c112-live-channel-keys.mjs (novo): dispatch real em harness
  controlado e integração da delegação/ações; regressões existentes preservadas.
- Este contrato, docs/evidence/C11_REMOTE_CHANNEL_KEYS_AND_NEIGHBOR_BUFFER.md,
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md, tmp/c112-live-channel-keys,
  saídas ignoradas de build/teste. Nenhum outro arquivo funcional.

## Aceitação

CH+/− geram next/previous uma vez, em inline e fullscreen; não em PiP/inativo,
busy/dialog, key-up/repeat ou VOD. D-pad/Back/menus anteriores intactos.
Próximo/anterior respeitam fronteiras de categoria/página/catálogo. Java e
regressões C73/preview/awake/buffer PASS, lock26+27+9 antes/depois. Identificar
limites dos testes e dependência pendente da fonte; não afirmar pre-buffer
implementado ou APK atualizado sem execução.

## Resposta do usuário — fonte com uma conexão

Usuário confirmou somente uma conexão simultânea na fonte. Não implementar
pré-buffer de vídeo dos vizinhos: concorre com o canal atual e viola a
capacidade informada. Concluir mapeamento CH+/− sem alterar buffer/C9/fonte.
Gerar APK de teste C112 com assets C111 preservados e mesma assinatura,
somente saídas usuais ignoradas do Gradle e tmp/c112-live-channel-keys.
APK C111 permanece intacto. Não instalar automaticamente ou atualizar painel.
Nenhuma dependência nova, preload desativado fictício ou chave oculta de UI.
