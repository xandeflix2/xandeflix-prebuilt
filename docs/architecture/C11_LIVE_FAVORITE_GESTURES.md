# C124 — estrela/contador e gesto longo nos canais — 2026-10-15

Pedido explícito após C123: remover botão textual acima do preview, colocar
somente estrela ao lado de Ao vivo, acessível por D-pad; pressionar Enter/OK
ou tocar/segurar uma linha por2s para favoritar; estrela na direita da linha
favorita e contador numérico em Favoritos na coluna categorias.
Preflight C11-main/main/origin canônicos, HEAD
0f68f169f7728fae17c8311832b7643629e97a02, baseline1064 após C123. AGENTS,
Architecture/Execution/Source Boundary/Activation Lock e C123 lidos.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C124_LIVE_FAVORITE_GESTURES;
NEXT_GATE_STARTED=NAO. Sem Git/backend/instalação/reset/publicação.

## Especificação anterior ao código

- Uma única estrela visível junto ao selo Ao vivo: no resumo abaixo do preview
  em tablet/TV/Fire/Box e na linha de identificação abaixo do preview em phone/
  quadrado/dobrável. SVG vazado/preenchido, sem texto visível ou novo fundo
  textual; label acessível/title/aria-pressed e área de toque/foco adequada.
- Atalho D-pad da linha para estrela por Direita e retorno por Esquerda ao
  canal de origem visível; demais setas/Tab mantêm navegação consolidada.
  Enter curto na estrela usa ação normal do botão.
- Nas linhas da grade principal, segurar Enter/Space/DPAD_CENTER por2000ms
  alterna uma vez o favorito daquele canal, mesmo se não estiver reproduzindo.
  Repeat não reinicia timer nem repete toggle. Down não seleciona antecipado;
  Up curto seleciona uma vez e mantém segundo clique/fullscreen existentes.
- Pointer touch/pen/mouse primário por2000ms tem o mesmo efeito, sem selecionar
  o canal nem iniciar player. Clique/tap curto continua normal. Consumo do click
  de soltura impede troca/fullscreen involuntário após hold. Novo gesto físico
  permite nova ação; rolagem, deslocamento>10px, pointercancel, blur, mudança de
  foco/linha, ocultação e desmontagem cancelam hold. Não bloquear pan-y.
- Linha favorita exibe estrela preenchida na borda direita; indicador de ativo
  pode permanecer antes dela. Aria informa estado, sem novo alvo de foco por
  linha. FavoriteKeys reativo controla ícones e contador salvo por fonte.
- Categoria Favoritos mostra número selecionado, inclusive0; enquanto scope
  carrega mostra pendência. Também no seletor quadrado e nome nativo da categoria,
  sem alterar catálogo/grupos/totais canônicos ou formato do store C123.
- Toggle recebe canal opcional e reutiliza persistência/limites/erros C123.
  Preservar favoritos mistos Home, versão da lista, filtro/rolagem contínua,
  player único/C9, fullscreen/Back/foco, EPG, todos os layouts e branding.
  Gesto atua na grade principal web; controles/painéis do player nativo seguem
  contrato anterior. Nenhum Java/ponte/sessão ou buffering adicional.

## Allowlist

src/ui/pages/LiveTvPage.tsx/LiveTvPage.css;
src/ui/components/ContinuousLiveChannelList.tsx;
novo src/ui/live-channel-press.ts; scripts/test-c124-live-favorite-gestures.mjs
novo, bindings de harnesses relevantes apenas se exigidos pelas novas portas;
este plano/docs/evidence/C11_LIVE_FAVORITE_GESTURES.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/capturas tmp/c124-live-favorite-gestures, saídas build/sync/APK ignoradas.
Sem mudança em storage/autoridade/source/App/router/player nativo/EPG.

## Aceitação

Timers controlados: limiar1999/2000ms, repeat longo uma vez, curto exatamente
uma seleção, soltura longa sem click, novo gesto/blur/cancel/move/scroll/unmount.
Browser com página/lista/D-pad reais: estrela abaixo/ao lado do selo e sem texto,
foco por setas/Enter curto, hold no canal inativo sem trocar reprodução, touch
longo/scroll curto, estrela/contador reativos, remoção final/filtro/rolagem>48,
persistência e oito perfis. Portas nativas/fonte simuladas, sem alegar hardware.
Regressões C123/C105/C114/D-pad, TypeScript/build/lock inicial/final, revisão
React; APK C124 de teste preservando assinatura/native/ícone C122 e C123.
Não instalar automaticamente, não iniciar próximo Gate.
