# C11 — Gestos de tela cheia e rolagem independente de Live

## Autoridade e proveniência — 2026-10-04

Usuário solicitou confirmar novamente o canal selecionado para tela cheia e,
no tablet, também tocar na prévia inline. Acrescentou isolamento da rolagem
das categorias/canais e, depois da primeira confirmação física, retirada do
botão Player Nativo. [Spec e emendas anteriores aos patches](../architecture/C11_LIVE_FULLSCREEN_GESTURES.md).
CURRENT_GATE=NONE, continuação local Live; nenhum próximo Gate ou trabalho 60s.

Workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, main/ahead 2, HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS, Architecture, Execution,
Source Data Boundary, Activation Lock e specs anteriores lidos integralmente.
401 hashes iniciais coincidiram com entrega anterior, dirty conhecido
preservado. Terminais iniciaram por Set-Location do C11; workspace histórico
e projeto protegido sem escrita. Commit/push/PR/backend/reset não autorizados.

## Alteração mínima consolidada

- Selecionar canal diferente mantém prévia inline; confirmar canal já
  selecionado/pronto chama o mesmo handler de expansão. Sem novo player,
  MediaItem/Activity, source lookup ou acquireSession para expandir.
- Tablet nativo live: GestureDetector emite apenas previewId; React aceita
  somente preview atual/pronto. Usa o mesmo handler, nunca promoção direta
  sem autorização em Java. TV/phone excluídos da política nativa de toque.
  Controles de fullscreen preservados; Back retorna à mesma prévia.
- Lock transient de comando por preview impede duplicações concorrentes;
  resultado assíncrono stale é ignorado. Listener tem disposed/cleanup.
  Falha de expansão mantém página e mensagem sanitizada existente.
- Só Shell Live com menu lateral recebe limite de viewport/min-height:0;
  categorias, canais e prévia têm rolagem interna/overscroll containment.
  Nenhum bloqueio global de body/Home, listener wheel/touch ou overlay cobrindo
  alertas. Sidebar/rodapé/banner continuam na árvore flex existente.
- Pedido final: live-preview-controls display:none no modo lateral em
  paisagem; nenhum botão Player Nativo visível/focável nem espaço residual.
  DOM/handler original preservados em celular e retrato, sem retirar acesso
  consolidado desses modos. Gestos e serviços não mudaram nessa emenda CSS.

Produção: LiveTvPage.tsx, bridge, NativeAndroidPlayerPlugin.java, uma classe
derivada em AppShell.tsx e bloco CSS escopado. Testes: harness existente e
novo NativeLivePreviewTapTest.java (hash público
29DE1A967BBDB21224EFE7A39814C173C71C78488F7C4241A7FF26D08C9AEEA1).
Identidade/ativação/boot/storage/source/C9/config/dependências/player Activity
e busca não alterados nesta rodada.

Auditoria final: 394/401 arquivos runtime/scripts/config/Android/APK
byte-idênticos ao início. Sete diferenças autorizadas: cinco produção acima,
harness e APK. Documentos/teste novo/backups explicitamente allowlisted.

## Testes e build

Lock oficial antes/depois/prebuild do patch e antes/prebuild da emenda CSS:
22 identidade/boot +27 promoção de diretórios, nove controles negativos, PASS.
Não foram relaxados testes, prebuild ou limites de licença.

Controle negativo de rolagem anterior ao CSS reproduziu deslocamento externo:
PREVIEW_EDGE_MUST_NOT_SCROLL_OUTER_DOCUMENT, 176 !== 0.
Correção passou cenário focado e matriz completa. Cenário longo usa filler
somente no DOM sintético: wheel real nas três colunas, scrollTop independente
e tentativa no limite sem deslocar window/header/outras colunas.

Resultados finais do APK sem botão:

- [Browser layout](../../tmp/c11-side-navigation/run-1791158174822/report.json):
  58 checks, zero erros. Matriz Fire 960/1280, TV1920, tablet1280/1024,
  celular/retrato/rotação; vídeo/card/EPG/sidebar/foco/Back/cleanup preservados.
  Botão invisível e não focável em paisagem; original visível nos outros modos.
- [Interações](../../tmp/c11-side-navigation/run-1791158253641/report.json):
  24 checks, zero erros. Seleção vs confirmação, sem acquire/start extra,
  native Back event, tablet tap, stale/pending/concorrência, falha/retry, deny C9
  e cleanup. Paisagem exercida sem botão visível.
- Java: 96 testes em 13 suites, zero falhas/erros; seis novos de política
  tablet/TV/phone e allowlist de payload. Execução real na primeira compilação,
  testDebugUnitTest up-to-date na emenda CSS sem mudança Java.
- Guards nesta rodada: C9 10/10, VOD direto12/12, Live T127–T14317/17,
  playback notice11 e bridge retention/config com quatro negativos, PASS.
- npm run build (inclui lock/tsc/Vite), cap sync android, assembleDebug e
  testDebugUnitTest PASS. Último Gradle155 tasks,27executadas128up-to-date.
  Cinco assets dist idênticos no APK; package/version com.xandeflix.prebuilt/1/1.0,
  HTTPS/CapacitorHttp/mixedContent/loggingBehavior=none preservados.
  Assinatura válida, mesmo certificado debug
  b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

Skills browser/verify/verification orientaram gut-check imediato e história
UI -> handler existente -> bridge -> PlayerView -> Back. CLI ausente, fallback
Chrome/CDP isolado com adapters e rede externa bloqueada; nenhuma API/env/data
nova. React review orientou refs/hooks/deps/cleanup/a11y e patch mínimo dos dois
TSX; não motivou refactor. Screenshots sintéticas Fire/tablet/phone inspecionadas.
Erro de prévia do adapter sem native é esperado, não erro físico do produto.

## APK, instalação e confirmação física

APK FINAL Xandeflix-v1.0.0-standalone.apk: 9062241 bytes.
SHA-256 ED324AF7D1528A1F9E7442AA0E3AC4655BD653E77E9176E1971E9E85102B5F09.

Backups recuperáveis novos, anteriores não sobrescritos:

- before-live-fullscreen-gestures.apk: baseline3B3673C8ED5D0F54DB802E1F86E0B3D3B6D6D23A92C30A040188406590A75E07.
- before-live-native-button-removal.apk: intermediário9B4A4932A541E710DFD57BFDA0C079F0CB9EC54212EE8C99AE0DAD908A0D00AD.

Ambos têm prefixo Xandeflix-v1.0.0-standalone- e ficam na raiz C11.
Intermediário9B4A... foi instalado/testado nos dois antes do último pedido;
não é a entrega final. APK finalED324... install -r Success PRIMEIRO Fire
AFTSSS 192.168.3.104:5555, DEPOIS Samsung SM-X610 RX2X301Q3KY.
Hash de base.apk exato em ambos. Quatro privados identidade/chave/instalação/
ativação e árvore files/prebuilt comparados somente em RAM antes/depois:
Fire436 arquivos e tablet505 idênticos em ambas atualizações. Nenhum valor
ou digest privado publicado. MainActivity Status ok, sem clear/uninstall/reset.

[Samsung final](../../tmp/c11-side-navigation/tablet-live-fullscreen-gestures-1791158558666/report.json):
PID18846 preservado, botão sem dimensão/visibilidade; toque no canal ativo
abre tela cheia, Back restaura inline, tap real ADB na superfície nativa também
expande e Back restaura. Swipe real abaixo do vídeo não deslocou window,
header, categorias/canais nem expandiu player. Conteúdo atual cabe na prévia
(scrollTop0); prova de rolagem de conteúdo longo é o teste sintético acima.

[Fire final instrumentado](../../tmp/c11-side-navigation/fire-live-fullscreen-gestures-1791158667320/instrumented-confirmation.json):
PID17311 preservado, botão sem dimensão/visibilidade. Key real23 entregue
como Enter13 e click no canal ativo, fullscreen=true; Back real4 devolveu
inline no mesmo canal/foco, sem erro. Layout vídeo480x270, identificação/
programação compactas e sidebar preservados. Nenhum canal/grupo novo escolhido.

Primeira tentativa do Fire final expirou ACTIVE_CHANNEL_CONFIRM_DID_NOT_OPEN_FULLSCREEN.
[Diagnóstico seguro](../../tmp/c11-side-navigation/fire-live-fullscreen-gestures-1791158557119/safe-diagnostic.json)
encontrou outra tela, sem superfície Live, com mesmo PID; reteste iniciou em
Filmes. Causa da mudança de rota NÃO confirmada/não atribuída ao usuário,
crash ou CSS. Único reteste instrumentado acima passou sem mudar produto ou
relaxar asserção de fullscreen/Back; incidente inicial não omitido.
Listeners transitórios/forwards exclusivos removidos; lista de forwards vazia.

Probes observam só menu/booleans/geometria/eventos sanitizados da UI e promovem
preview já autorizado. Sem console/rede/storage privado extra, captura de
mídia, URLs/tokens/chaves/IDs de conteúdo ou persistência de orientação.
Confirmam gestos/estado/retorno, não first-frame/codec ou estabilidade universal.
Queda histórica da busca e performance60s não passam a resolvidas por este ciclo.

## Incidentes de execução e limites

Dois wrappers de apply_patch (ReferenceError/SyntaxError) falharam antes de
executar; placeholders corrigidos, nenhuma edição parcial. Leitura read-only
usou inicialmente nomes docs/EVOLUTION.md e docs/ERRORS.md inexistentes;
inventário identificou EVOLUTION_REPORT.md/ERRORS_AND_BLOCKERS.md e foram lidos.
Pipe aapt | Select-Object -First1 reportou exit1 após fornecer package;
captura completa repetida confirmou exit0/package/assinatura sem mudar APK.
Avisos existentes node:fs/path, imports mistos/chunks, GradleflatDir/META-INF
e LF/CRLF fora do escopo; nenhum aviso crypto externalizado.
Nenhuma promessa universal, Git/backend/novo Gate ou retomada60s.
