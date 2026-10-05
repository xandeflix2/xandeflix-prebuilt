# C11 — Correção do fundo vazado em tela cheia Live

## Autoridade e preflight — 2026-10-04

Usuário mostrou tablet fullscreen com cabeçalho/rodapé da página nas faixas
externas ao vídeo. [Spec anterior ao código](../architecture/C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP.md).
CURRENT_GATE=NONE, continuação corretiva Live, próximo Gate/60s não iniciados.

Workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, main/ahead2, HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS, Architecture, Execution,
Source Data Boundary, Activation Lock e specs lateral/preview/gestos lidos
integralmente; leitura conjunta truncada foi completada separadamente.
401 hashes iniciais coincidiram com última entrega ED324...; dirty preservado.
Terminais iniciaram por Set-Location do C11. Sem Git/backend/reset/outros alvos
ou escrita nos workspaces histórico/protegido.

## Causa, patch e proveniência

PlayerView era transparente na criação; enter apenas aplicava MATCH_PARENT.
Com FIT e vídeo16:9 na tela16:10 do tablet, o fundo da página aparecia nas
áreas não ocupadas pelo vídeo. Imagem do usuário e caminho nativo sustentam
esse diagnóstico; não foi atribuído a licença, fonte ou decodificador.

Patch de produção em SOMENTE NativeAndroidPlayerPlugin.java:
Color.BLACK antes de expandir o layout no enter válido; Color.TRANSPARENT no
exit ativo quando PlayerView existe, antes de restaurar limites inline.
Back/release usam esse mesmo exit. Nenhuma alteração em FIT, media/request/
source, ExoPlayer/Activity, controle/gestos/bridge/listeners, JSX/CSS, foco,
identidade/ativação/storage/config/backup/políticas ou dependências.

Remover apenas dois setters/guarda novos e restaurar CRLF em três linhas de
contexto que apply_patch normalizou recupera BYTE-EXATAMENTE o hash anterior:
707EBF6002C674CEB1811E5E5B3A5BBC45797724390923C0F74743EBB1D6B3BE.
Hash nativo final:
11276BB71093D037B8FD9ADC4B55F1E472B4C01CC20AA1C7E39A03EA20D74B74.
Auditoria401:399 idênticos, apenas nativo/APK divergem; teste Java de gestos
existente mantém hash29DE1A...AEEA1. Documentos/guard novo/backup allowlisted.

## Testes e build

Novo scripts/test-c11-live-fullscreen-backdrop.mjs:
baseline-negative reproduziu ausência de opacidade antes do patch; guard
final de ordem/call sites/FIT/MATCH_PARENT/restore/Back/release PASS e cinco
mutações negativas rejeitadas (transparência, setter ausente, restore ausente,
ZOOM/corte, cobertura incompleta). É análise de fonte, NÃO prova visual Android.
Hash do guard E3B264530B023F4B1A61675A09CE4D5ECF2ACF295D97C73C5A41EDAE5FA520A1.

- Lock antes e post-patch/prebuild:22 identidade/boot+27 promoção de diretórios
  e nove negativos, PASS; contrato/prebuild intactos.
- [Browser58/zero erros](../../tmp/c11-side-navigation/run-1791160517869/report.json):
  matriz/layout/sidebar/foco/Back/rotação/celular e três áreas de scroll PASS.
- [Interações24/zero erros](../../tmp/c11-side-navigation/run-1791160710610/report.json):
  confirmação/tap/Back, mesmo preview/session, pending/stale/duplicação,
  falha/retry/C9 deny/cleanup PASS. Fixtures/expectativas não alteradas.
- Guards C9 10/10, VOD12/12, Live T127–T14317/17, playback notice11 e bridge
  retention/config/quatro negativos PASS.
- Java96 em13 suites, zero falhas/erros, executado após mudança nativa.
- npm build/tsc/Vite, cap sync android, assembleDebug/testDebugUnitTest PASS.
  Gradle155 tasks,31 executadas124 up-to-date. Cinco assets dist idênticos no APK.
  Sem crypto externalizado; avisos existentes node:fs/path, imports mistos/
  chunks, GradleflatDir/deprecated/META-INF e LF/CRLF fora do recorte.
- Assinatura válida, mesmo certificado debug
  b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d;
  package/version com.xandeflix.prebuilt/1/1.0, HTTPS/CapacitorHttp/mixedContent/
  loggingBehavior=none preservados.

Skills agent-browser/agent-browser-verify/verification orientaram história
gesto -> handler -> mesmo PlayerView com fundo opaco -> Back/inline e checagem
visual real, não só bool DOM. CLI ausente; fallback Chrome/CDP isolado com
gut-check imediato/adapters/rede externa bloqueada, e WebView próprio nos
aparelhos. Sem API/env/data boundary nova ou investigação backend.

Referências primárias de API:
[View.setBackgroundColor](https://developer.android.com/reference/android/view/View)
e [AspectRatioFrameLayout.FIT](https://developer.android.com/reference/androidx/media3/ui/AspectRatioFrameLayout).
Uso local da API e causa foram verificados no código, não inferidos só da doc.

## APK e instalação

APK final Xandeflix-v1.0.0-standalone.apk,9062241 bytes:
6F1C4F36C6086FDD74FD838D999263C0A078A50103751BD455B319160154994B.
Backup recuperável novo Xandeflix-v1.0.0-standalone-before-live-fullscreen-backdrop.apk:
ED324AF7D1528A1F9E7442AA0E3AC4655BD653E77E9176E1971E9E85102B5F09.
Backups anteriores preservados; nenhum arquivo material eliminado.

Install-r Success PRIMEIRO Fire AFTSSS192.168.3.104:5555, DEPOIS Samsung
SM-X610 RX2X301Q3KY. Hash instalado de base.apk exato nos dois. Quatro privados
identidade/chave/instalação/ativação e árvore files/prebuilt idênticos em RAM
antes/depois do install:436 arquivos Fire/505 tablet. Nenhum valor/digest
privado publicado. MainActivity Status ok; nenhum clear/uninstall/reset.

## Confirmação física e visual

[Fire](../../tmp/c11-side-navigation/fire-live-fullscreen-backdrop-1791161121260/report.json):
PID23793 preservado, confirmar canal ativo abre fullscreen, Back real restaura
inline. Sidebar/card/EPG/botão oculto/layout e frame de scroll preservados.
Não houve captura física de margens no Fire; prova visual abaixo é do tablet.

[Samsung final](../../tmp/c11-side-navigation/tablet-live-fullscreen-backdrop-1791161245959/report.json):
PID25515 preservado; confirmar ativo/tap real na camada nativa expandem e
Back real restaura inline. Swipe abaixo da prévia não move header/outras
colunas nem expande indevidamente. Sem escolher outro canal/grupo/conteúdo.

Geometria nativa obtida SOMENTE da MainActivity do package/PID confirmado:
tela2560x1600; SurfaceView atual x0–2560/y80–1520 (2560x1440,16:9).
Captura nativa integral transitória apenas em RAM, nunca gravada/exibida.
Somente recortes de8px dos extremos y0–8 e y1592–1600, comprovadamente
FORA dos bounds do vídeo, foram gravados e inspecionados:
[superior](../../tmp/c11-side-navigation/tablet-live-fullscreen-backdrop-1791161245959/after-top.png),
[inferior](../../tmp/c11-side-navigation/tablet-live-fullscreen-backdrop-1791161245959/after-bottom.png).
100% dos pixels de AMBOS os recortes são pretos (RGB<=3).
Confirma cobertura opaca onde antes vazava UI, sem registrar mídia/URLs/chaves.
Não certifica cada pixel da margem inteira, todos os canais ou estabilidade universal.

Primeira leitura antes da atualização encontrou inline, nenhuma navegação/
captura nesse probe. Tentativa baseline de capture foi recusada: dumpsys
activity top não identificou nossa Activity (outros registros), embora
dumpsys window confirmasse foco próprio; zero mídia gravada. Ajuste do probe
para filtro explícito package/.MainActivity confirmou ownership/PID/geometry.
Primeiro post-patch capture ficou inconclusivo porque layout da SurfaceView
imediatamente após expansão ainda não provava margem superior. Único reteste
com espera bounded15s por geometria real (sem alterar produto/assert) passou
acima; não usou coordenadas presumidas nem relaxou segurança.

Pillow indisponível em checagem de ambiente; fallback System.Drawing existente
processou PNG em RAM, sem instalar dependências. Tentativa inicial de recuperação
de hash sem considerar CRLF do contexto foi insuficiente; três EOL restaurados
somente em RAM provaram hash byte-exato, sem reescrever arquivo/normalizar repo.
Forwards/listeners transitórios limpos, lista final vazia.
Sem primeira instalação/reset, homologação de busca/codec/60s ou próximo Gate.
