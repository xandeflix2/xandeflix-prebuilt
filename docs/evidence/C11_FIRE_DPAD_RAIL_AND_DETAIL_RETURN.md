# C11 — D-pad Fire entre linhas e retorno ao hero — ciclo53

2026-10-08. [Especificacao e emenda anteriores ao codigo](../architecture/C11_FIRE_DPAD_RAIL_AND_DETAIL_RETURN.md).
Clone C11-main, origin esperado/main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Baseline728 e patches antigos
preservados; novo escopo somente hook D-pad/teste/registros, sem refatoracao
de catalogo/capas/source/player, backend, reset ou Git.

## Regressao reproduzida e patch

No APK EC412, Recentes dentro de RecentTitles e destaques dentro de
home-rails-container nao eram irmaos. ArrowDown permanecia em Recentes
apesar de20 cards carregados na proxima linha. Em detalhes Coyote, ArrowUp
de semelhantes focava Inicio no menu porque so procurava .hero-actions
e ignorava .detail-actions do hero atual. Ambos reproduzidos com tecla ADB.

Navegacao vertical agora consulta carrosseis montados em ordem no mesmo main,
atravessa wrappers, ignora linhas sem cards e conserva coluna com clamp.
Ver todos permanece acessivel por Up; outra subida vai a linha anterior ou
ao hero desse main. Primeira linha de relacionados de filme sobe a acao
Assistir do hero atual. Foco em detalhes Fire rola o hero completo para o
inicio, usando o mesmo frame cancelavel dos heroes Home/Filmes/Series.
Up no hero acessa Voltar acima dele. Horizontal/menu/grid/inputs intactos.

Verificacao adicional demonstrou dialog filho do hero disparando a nova
rolagem do fundo: teste contado4 versus3 falhou. Escopos .modal-content e
.player-overlay foram excluidos desse restauro; teste passou. Nao alterar
tratamento proprio de modal/Back ou navegar para fundo durante dialog.

## Aceitacao e entrega

Hook real4 grupos PASS: wrappers/coluna/linha vazia/Ver todos, horizontal/menu/
eventos locais/cleanup, relacionados/hero inteiro/desabilitado/toolbar/dialog,
isolamento main e scroll nao-Fire. Passos verticais desses fixtures fazem
zero leituras geometricas, sem promessa de O(1) para a consulta de linhas
ou SLA de velocidade. Hero anterior4 e detalhes7 PASS; continuidade4/suporte8
anteriormente PASS e codigo dessas funcoes inalterado no53. Typecheck/prebuild
lock22+27+9/build/sync/Gradle PASS;143 Java sem falhas (native inalterado neste
patch; tarefas up-to-date),6assets byte-identicos e assinatura canonica.

APK final **EB66904E1F626E835AEB6393E668D8F3BB8FD5E68B948DEE211E8A860D9BA47F**,12400179bytes,
JSindex-DPP6IYm9.js; [download](../../Xandeflix-v1.0.0-standalone.apk).
Fire103 AFTSSS install-r/hashAPK/firstInstallTime PASS em2026-10-08T22:32:44.736Z;
897/856/5 arquivos privados/catalogo/nativos,
zero alteracoes em catalogo/nativos/preferencias/WebView/outros. Duas amostras
completas iguais antes e depois e comparacao integral antes/depois; nenhum PID
de runtime observado nessa instalacao final. Sem limpar dados.

QA fisica no APK final, foreground proprio e11 passos com teclasADB:
Recentes -> Filmes destaque -> Series destaque -> Lancamentos; Right em cards;
Up -> Ver todos -> linhas anteriores -> hero Home. Hero Home top-1,
bottom404,height405 CSSpx em viewport960x540 (tolerancia1px).
Coyote semelhantes -> Assistir no hero; top17.5,bottom290,
height272.5, inteiro na viewport. Up seguinte -> Voltar do toolbar.
Dialog Avaliar abriu com fundo estavel, Down foi para Gostei dentro dele e
Back fechou/restaurou foco no hero. Nenhuma avaliacao gravada ou compartilhada.
Screenshots privados desses percursos conferidos. Tentativa inicial de QA
ocorreu antes de Recentes montar; outra foi bloqueada pelo protetor de tela
DREAM. Sequencia DOM parcial teve troca de pagina no fim, sem causa atribuida;
nao foi contada PASS. Sequencia final completa/teclas confiaveis sem Enter
extra e dialog substituem as verificacoes inconclusivas.

Tablet/S24 mantem EC412 do ciclo51/52 com UI/diagnostico atualizados; nao afirmar
EB instalado neles. Fire107 nao respondeu ao endereco192.168.3.107:5555 mesmo
apos usuario informar disponivel: timeout10060, ping limitado sem resposta e
porta nao acessivel. Solicitado IP atual/ADB; nao instalado ou aberto nesta
rodada. Ultima entrega107 comprovada251E do ciclo50. S23 excluido pelo usuario.
Correcao desses percursos Fire103 concluida; entrega107 depende de conexao.
Falhas externas de playback/401 e capas universais/producão permanecem com
os limites registrados nos ciclos anteriores. Sem Git/backend/reset/novo Gate.
