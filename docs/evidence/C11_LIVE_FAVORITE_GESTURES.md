# C124 — estrela e pressionamento longo Live — 2026-10-15

Pedido explícito e spec anterior em C11_LIVE_FAVORITE_GESTURES.
Preflight C11-main/main/origin canônicos, HEAD
0f68f169f7728fae17c8311832b7643629e97a02; contratos/Source Boundary/lock lidos.
Baseline1064 após C123. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C124_LIVE_FAVORITE_GESTURES; NEXT_GATE_STARTED=NAO.
Sem instalação/Git/backend/reset/publicação; demais patches preservados.

## Resultado

Botão textual acima do preview substituído por uma única estrela SVG junto
ao selo Ao vivo, abaixo do preview: resumo em telas largas e identificação
do canal em phone/quadrado/dobrável. Sem texto visível ou preenchimento de
botão; estrela vazada/preenchida e hit area44px com label/title/aria-pressed
e foco visível. Direita na linha alcança estrela; Esquerda retorna ao canal
de origem visível, com fallback para ativo/primeiro visível. Feedback de ação
mantém ordem após o preview, sem aparecer antes dele por display:contents.

Enter/Space/DPAD_CENTER em linha é reservado até Up: curto seleciona uma vez,
segundo curto no ativo abre fullscreen. Hold2000ms alterna apenas favorito do
canal sob foco, sem mudar reprodução; repeat não reinicia/reexecuta. Pointer
primário touch/pen/mouse usa o mesmo limiar e consome click de soltura longo.
Deslocamento>10px, scroll, cancel, blur, visibilidade, mudança de scope/prontidão
ou desmontagem cancelam timer. Pan-y continua nativo; context menu/text selection
das linhas suprimidos. Uma pressão/timer por lista e uma referência ao canal.

Linhas favoritas recebem estrela à direita, após indicador do ativo, e label
acessível, sem outro botão/alvo de foco. Favoritos na coluna mostra número
selecionado por fonte, inclusive0; seletor quadrado e nome da categoria no
painel nativo também incluem contagem. Store/limites e política C123 intactos;
toggle reutilizado com canal opcional, erros de persistência preservados.
Janela48/três páginas, favoritos mistos Home, EPG, player/C9/Back/foco intactos.
Sem mudança Java, global D-pad, ponte nativa, source/storage ou novos pacotes.

## Verificações finais

- C12410 grupos PASS: limiar1999/2000ms, seleção curta única, release click
  consumido, hold de canal inativo sem seleção, repeat e novo gesto, toque
  curto/longo, deslocamento, cancel/blur/dispose, ponteiros diferentes e blur
  de linha anterior, duplicata Down sem repeat, teclas de confirmação/setas.
- Browser4 grupos PASS com LiveTvPage/ContinuousLiveChannelList e hook global
  useDpadNavigation reais. Nove layouts em oito modelos: PHONE/FOLDABLE/TABLET
  retrato/paisagem/FIRE_TV/ANDROID_TV/ANDROID_BOX/TIZEN/WEBOS. Uma estrela sem
  texto, depois do selo e abaixo do vídeo, visível; marca à direita/sem foco
  extra e contador0→1. Dropdown quadrado inclui número. Prévias phone/Fire/
  dobrável inspecionadas visualmente.
- CDP de teclado real: hold Enter e repeat marcam uma vez o canal inativo,
  sem seleção/media update/C9; Direita→estrela, Enter, Esquerda→origem; Enter
  curto seleciona no Up, segundo abre fullscreen, Back devolve foco. Movimento
  de foco durante hold cancela. Touch CDP real em phone e dobrável: hold2200ms
  marca sem abrir canal; soltura não clica; pan cancela. Remoção final por hold
  deixa vazio sem linha fantasma ou restart. Reload155 favoritos/última janela
  mantém estrela/contador, no máximo48 linhas montadas. Nenhuma rede externa ou
  erro de console. Native/source/artwork simulados; não é teste físico/player.
- Regressões C12311, lista contínua C1056, foco C11410 e controles Live7 PASS.
  TypeScript e build com lock inicial/final26+27+9 PASS; sync/Gradle PASS.
  Avisos prévios Vite node/imports/chunks e flatDir mantidos.
- Revisão React: hooks incondicionais, callbacks atuais por ref, timers e
  listeners removidos no cleanup, cancelamento por scope sem resetar janela.
  Acessibilidade/atalhos/foco e virtualização preservados, sem nova consulta
  de fonte/TMDB ou conexão de mídia. Componente sem novos listeners por linha.

## Falhas do ciclo

Primeiro comando Node strip-only recusou parameter properties do helper TS;
declarações explícitas mantêm comportamento e compatibilidade do teste direto.
Helper browser inicialmente redeclarou const stable, corrigido no helper.
Ensaio de marca da linha ativa expôs remount intermediário ao acrescentar scope
à key da lista: perdia janela inicial. Scope passou a cancelar somente o gesto
por effect, mantendo key original C123 e paginação/foco. Fixture alinhada às
classes reais de mobile stacked/tablet retrato/quadrado, sem alterar produção
para simular um shell incorreto. Rodadas completas posteriores passaram.
Nenhuma falha técnica pendente; comprovação física continua pendente.

## Artefato e auditoria

tmp/c124-live-favorite-gestures/Xandeflix-v1.0.19-C124.apk,
12.708.979 bytes; SHA256
269ec8c2c78c4a5402fe69b1e9535c2da4d823fb4855056fcabefb6a72056255.
com.xandeflix.prebuilt, code19/name1.0.19, min23/target35. Sete assets dist
conferidos por hash, HTTPS local/logging none/sem dev server, mesma assinatura.
12 DEX e1410 recursos nativos byte a byte iguais ao C123, incluindo branding.
C123 preservado e hash conferido. Sem instalação automática, teste de IR/CEC
ou pacote nativo Tizen/webOS; perfil simulado não certifica SO/hardware.

Auditoria baseline: seis existentes (três UI, três memórias append-only),
quatro novos (helper, teste, spec/evidência). Demais hashes/HEAD/main/origin
preservados; relatórios/helpers/capturas privados em tmp/c124-live-favorite-gestures.

C124 final audit: initial STATUS append was inserted at a repeated anchor.
Moved only the C124 block to EOF; original STATUS bytes/hash restored exactly.
First repair attempt failed its assertion before writing (stdin Unicode match);
ASCII anchored repair and complete audit then PASS. No production impact.
