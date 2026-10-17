# C133 — janela do PIN parental por D-pad

2026-10-16. [Spec anterior](../architecture/C11_PARENTAL_PIN_DIALOG_DPAD.md).
Preflight completo no clone independente ativo, main/origin esperado, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d; baseline1108 arquivos, workspace inicialmente limpo. AGENTS,
Architecture/Execution/Source Boundary/Activation Lock e C126/C129 lidos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset.

## Reproducao e correcao

Janela PIN real e useDpadNavigation reais em navegador, autorizacao Live real
sobre canal sintetico sem classificacao e store/crypto locais reais, somente
persistencia em RAM de fixture. Antes, ArrowDown no campo nao alcanca Cancelar
com PIN vazio; com seis digitos tambem fica no campo em vez de Confirmar.
Distancia/angulo do fallback espacial rejeitam os botoes pequenos alinhados
a esquerda abaixo do campo largo. Captura anterior mostra foco preso.

Janela parental aberta agora usa parentalDpadTarget ja consolidado no editor:
ordem input/Confirmar/Cancelar, controles desabilitados ignorados e foco
contido no modal. Esquerda/direita percorrem acoes; dentro do campo preservam
edicao nativa. Enter/DPAD_CENTER no campo nao sintetizam click pelo hook;
ativacao nativa/IME preservada. OK em acao executa uma vez. Quando verificacao
desabilita o foco atual, fallback procura primeiro controle local do modal.
PIN incorreto limpa campo e efeito devolve foco depois de busy=false.
Cancelamento/Back e retorno ao botao de origem permanecem os existentes.

Nenhuma mudanca em regras/segredos, storage/KDF, faixa etaria, grants/cooldown,
fonte/catalogo/C9, nativo Java ou logo. Versao Android22/name1.0.22 apenas para
distinguir o patch. Atualizacao in-place compativel por package/assinatura.

## Verificacao e ocorrencias

C133 oito perfis PASS: Fire TV960x540, Android TV1280x720, Android Box960x540,
Tizen/webOS1280x720, celular390x844, foldable800x880 e tablet1280x800.
Teclas confiaveis de navegador verificam baixo/cima, acoes esquerda/direita,
edicao de cursor, foco inicial/retorno, input vazio/Confirmar desabilitado,
PIN incorreto/correto e tentativa unica, Escape/Cancelar/DPAD_CENTER,
cancelamento durante validacao ocupada sem grant tardio. Nos tres perfis
touch, cliques reais nos botoes tambem confirmam/cancelam. Regra e limite
permanecem intactos. Zero requests externas ou dados reais usados.

Controle negativo recompila as duas fontes anteriores capturadas e falha
precisamente em esperado Confirmar/observado PIN apos seis digitos e baixo.
Primeira tentativa desse controle apos patch usava filtro de caminho somente
com barra Unix e nao substituiu os arquivos em Windows; detectado por falha
posterior diferente. Filtro corrigido para nome de arquivo; resultado final
confere erro de foco esperado. Helper de diagnostico inicialmente leu texto
do body inteiro no foco transitorio; limitado a tag/input/botao para evitar
saida extensa. Nenhuma alteracao adicional de produto para esses ajustes.

Regressoes C12616, C12811, C129oito perfis, Fire home5/rail10 e retorno de
catalogo11 PASS. Lock inicial e prebuild26ativacao+27promocao+9negativos PASS;
TypeScript/Vite561modulos, sync Android e assembleDebug PASS. Avisos antigos
Node/Vite/chunk e Gradle flatDir mantidos; nao relaxar criterios por warnings.

Browser e viewport simulado nao certificam IME/controle fisico de cada TV,
nem execucao de APK Android em Tizen/webOS. Capturas antes/depois inspecionadas.
Confirmacao fisica no Fire Stick depende da atualizacao manual do usuario.

## APK

[Xandeflix-v1.0.22-C133.apk](../../tmp/c133-parental-pin-dpad/Xandeflix-v1.0.22-C133.apk)

11378855bytes; SHA256 77b54d229a7dc6cc31068d47cb556fbb4993b4abea666f29caa85c735c9061c9. Package com.xandeflix.prebuilt,
code22/name1.0.22/min23/target35; mesma assinatura C131, HTTPS local/logging
none/sem dev server. Oito assets dist e dez public corretos, sem arquivos
antigos adicionais.1412recursos nativos identicos ao C131, incluindo icones
metalicos/banner/adaptive. Onze de12DEX iguais; unico outro difere so nas
duas constantes de versao BuildConfig. APK C131 preservado por hash.

Auditoria final em audit.json deve confirmar seis existentes na allowlist,
tres novos,1102arquivos anteriores intactos, memorias append-only e Git
inalterado. Sem nova publicacao Git, backend, instalacao/reset ou proximo Gate.
