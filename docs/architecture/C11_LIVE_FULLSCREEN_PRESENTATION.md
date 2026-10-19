# C161 - Apresentacao dos controles Live em tela cheia

## Pedido, autoridade e preflight - 2026-10-18

Usuario solicitou Voltar no canto superior esquerdo com icone mais elegante,
nome do canal maior, selo AO VIVO branco sobre vermelho abaixo do titulo,
Canal anterior a esquerda do Play e Proximo canal a direita. Proibiu gerar
APK nesta rodada. Interpretacao: apresentar os mesmos controles nas duas
implementacoes existentes, navegador e Android/TV, sem alterar reproducao.

Clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main; origin
https://github.com/xandeflix2/xandeflix-prebuilt.git; main;
HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb. Dirty previo conhecido: tres
memorias e C11_WEB_SOURCE_HTTPS_DIAGNOSIS.md, preservados. Baseline de hashes
locais e APKs existentes em tmp/c161-live-fullscreen/baseline.json.
AGENTS, Architecture, Execution, Source Data Boundary e Activation Lock lidos.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C161; NEXT_GATE_STARTED=NAO.
Sem operacao Git de escrita/publicacao solicitada nesta rodada; nao executar
commit/push/PR, deploy, backend ou instalacao. APK_BUILD_AUTHORIZED=NAO.

## Especificacao anterior ao codigo

1. Android: manter live_back e callback existentes, trocar somente desenho
   por ImageButton circular com chevron vetorial e foco vermelho acessivel.
   Header no topo esquerdo; aumentar nome de18 para26sp, com elipse; badge
   estatico AO VIVO separado da categoria, branco/vermelho abaixo do nome.
   Categoria continua recebendo texto sanitizado ja existente, sem alterar
   payload. Navegacao central conserva IDs/handlers, com textos completos
   Canal anterior e Proximo canal e largura ajustavel em telas estreitas.
2. Browser: aplicar apresentacao somente no fullscreen Live. VOD/series
   mantem cabecalho e seek existentes. Voltar circular SVG com rotulo acessivel,
   nome maior com elipse, badge abaixo; mover as acoes Live previous/next da
   barra inferior para as laterais do Play, sem duplicar botoes/callbacks.
   Inline continua sem controles sobrepostos. Preservar mesmo video/preview,
   teclado, foco, pausar, esconder/bloquear controles e retorno ao inline.
3. CSS novo escopado ao Live. Cabe titulo longo sem cobrir Voltar/bloquear;
   controles cabem em celular, tablet e TV, com rotulos legiveis e focus ring.
   Ajustar somente distancia do painel Live ao cabecalho maior se necessario.
4. Nenhuma mudanca em URLs, bibliotecas, transportes, source, catalogo, C9,
   parental, autorizaçao, identidade, storage ou lifecycle. Sem nova dependencia,
   segredo, versao Android, cap sync, assemble, bundle ou APK.

## Allowlist estrita

- src/web/web-player.ts: apresentacao/posicao dos controles Live.
- src/web/web-runtime.css: estilos escopados da apresentacao Live.
- android/app/src/main/res/layout/xandeflix_live_controls.xml.
- android/app/src/main/java/com/xandeflix/prebuilt/player/LivePlayerControls.java:
  somente retirar prefixo AO VIVO da categoria, agora badge separado.
- Novos drawables live_back_icon.xml, live_back_focus.xml e
  live_on_air_badge.xml sob android/app/src/main/res/drawable.
- Este contrato, docs/evidence/C11_LIVE_FULLSCREEN_PRESENTATION.md e append
  em docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md.
- Helpers e evidencias sinteticas isoladas em tmp/c161-live-fullscreen;
  saidas de compilacao/teste habituais, nunca pacote instalavel novo.

## Verificacao e limites

Lock oficial antes/depois; tsc sem emissao; suites existentes C136player,
C158diagnostic e Live controls/navegacao. Gradle testDebugUnitTest valida
Java/recursos e testes nativos, sem assembleDebug ou APK. Fixture browser
isolada com WebPlayer real e media sintetica valida header, badge, ordem,
callbacks previous/next, play/pause, Voltar e retorno ao mesmo inline; nomes
longos, dimensoes PC/tablet/TV/celular e foco. Capturas devem ser inspecionadas.
Nenhuma fonte, usuario ou aparelho real sera acessado. QA Android fisica
permanece pendente da futura geracao explicitamente solicitada pelo usuario.
Hash/mtime dos APKs existentes e arquivos fora da allowlist preservados.

## Extensao autorizada antes do codigo - paineis, navegacao e APK

Pedidos seguintes do mesmo usuario ampliam C161: Canais/Categorias no Android
em painel lateral direito como no browser; Guia em faixa inferior acima do
rodape. Depois solicitou verificar Proximo episodio (falha relatada no Fire
Stick), confirmar Proximo canal e gerar APK ao final. Esta ultima instrucao
substitui somente a proibicao anterior de gerar APK. APK_BUILD_AUTHORIZED=SIM;
instalacao, Git, deploy, backend e proximo Gate continuam nao autorizados.

Especificacao: no fullscreen nativo usar painel escuro arredondado, sem chrome
cinza ou radio buttons, com titulo/fechar acessiveis, lista rolavel e paginacao
existente. Reservar altura do header e rodape; Guia ocupa faixa inferior acima
do rodape. Preservar modo inline, contexto em RAM, IDs opacos, selecao, busy,
cancelamento, Back/foco e callbacks existentes. Browser mantem paineis laterais
e posiciona apenas Guia acima da barra real de acoes. Nao fabricar EPG.

Verificacao da navegacao: executar handlers reais nativos com fixtures de
toque/controle remoto e correlacao IPC, sequencia real no PlaybackService
(mesma temporada, troca de temporada, ultimo episodio, stale/duplo evento,
C9/revogacao/Back), e Live (pagina seguinte, primeiro/ultimo, snapshot trocado,
busy e parental). Corrigir somente defeito reproduzido, sem atribuir causa ao
Fire sem evidencia. ADB somente inventario read-only; nenhum aparelho conectado
na verificacao inicial. Testes de implementacoes compartilhadas nao equivalem
a teste fisico em todos os modelos.

Allowlist adicional/atualizada: LivePlayerControls.java permite somente layout
dos paineis; layout live admite IDs de header/rodape; novos drawables
live_panel_background.xml e live_panel_row.xml; LivePlayerControlsTest.java
para limites de posicionamento; scripts/test-c161-player-navigation.mjs para
regressao funcional sintetica; android/app/build.gradle somente versao
1.0.33/code33; saidas usuais build/cap copy e APK versionado recuperavel em
tmp/c161-live-fullscreen. Se teste reproduzir defeito fora desta allowlist,
registrar fronteira e ampliar spec antes de qualquer patch correspondente.

Build com lock/prebuild intactos, tsc, testes web/nativos, browser sintetico
com capturas inspecionadas e APK verificado (package/versao/assinatura/hash).
Preservar copia versionada do APK1.0.32 e identidade/dados de todos os aparelhos;
nenhuma instalacao automatica. O antigo build output app-debug.apk pode ser
substituido pela geracao autorizada. Sem afirmar validacao fisica.

### Defeito reproduzido antes do patch - confirmacao de botao web

Chrome isolado, evento Enter trusted via CDP, document.hasFocus=true e foco
real em Proximo canal: keydown/keyup chegaram, nenhum click/nativeLiveAction.
Mouse click passa. O listener global captura e interrompe propagacao antes
de o botao receber ativacao por teclado. Nao equivale a reproduzir no player
nativo Fire: handlers Java e correlacao nativa passaram com adaptadores.

Allowlist web-player.ts ampliada somente para confirmar o botao focado por
Enter/Espaco com perform click, preventDefault para impedir duplo disparo e
ignorar repeat/disabled; preservar handlers/parental e as regras de foco/Back.
scripts/test-c136-web-player.mjs autorizado para regressao de confirmacao e
repeat. Chrome real deve passar Enter em Proximo canal/Proximo episodio e
troca correlacionada, sem dois transportes ou salto duplo. Sem patch nativo
especulativo para o relato Fire que ainda nao foi reproduzido fisicamente.
