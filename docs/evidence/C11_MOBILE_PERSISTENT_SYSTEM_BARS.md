# C11 — barras persistentes e player na área inteira — 2026-10-07

## Resultado e comportamento

Celulares e tablets deixam de ocultar status, navegação e barra de aplicativos
no Xandeflix. A política é reaplicada ao abrir, retomar e recuperar foco,
inclusive no player nativo de filmes/episódios e na expansão Live. TV continua
imersiva. O usuário confirmou preservar a imagem completa, aceitando faixas
pretas: PlayerView ocupa MATCH_PARENT na área útil, FIT preservado, sem zoom,
corte ou distorção. Status/cutout/navegação ficam fora dos controles do player.

A taskbar pertence ao sistema/launcher: o app mostra navigationBars e não
solicita sua ocultação. No Samsung SM-X610 conectado, a taskbar foi observada
em retrato, paisagem, Live e player nativo. Não foi alterada a configuração
global de taskbar, gestos/botões, launcher, notificações ou bloqueio de tela.
Não se promete alterar a preferência de taskbar de todos os fabricantes.

## Mudanças específicas

- MainActivity: TV identificada por uiMode mascarado, sem usar largura/orientação
  como substituto. Mobile limpa FLAG_FULLSCREEN e bits de ocultação, mostra
  systemBars com comportamento normal e ícones claros sobre fundo escuro.
- bindSafeInsets: content container reserva systemBars/displayCutout/IME por
  evento de insets. Insets consumidos; listener/margens da WebView não adicionam
  espaço novamente. Sem alturas fixas por modelo ou polling. Rotação, teclado
  e taskbar redimensionam a área útil. TV mantém padding zero.
- PublicTrailerPlugin: bounds relativos ao content parent descontam localização
  e padding desse parent. O trailer não soma duas vezes a barra superior.
- NativePlayerActivity: comentários antigos de imersão universal atualizados.
  Código executável do player é idêntico ao baseline (comparação sem comentários).
- SystemBarsPolicyTest: quatro casos de UI normal, noturno, TV com flags
  combinadas, configuração desconhecida e demais tipos de aparelho.

Não houve mudança em TSX/CSS, manifest, dependências, Capacitor config, fonte,
C9/licença, identidade/chave, catálogo, Cast, PiP ou algoritmo de reprodução.
Não houve backend, commit, push, PR, reset ou instalação limpa.

## Preflight, contratos e proveniência

Workspace/top-level clone independente C11-main, Git próprio, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git;
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS/Architecture/Execution/
Source Boundary/lock lidos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Baseline688 arquivos em tmp/c11-system-bars-20261007, APK anterior preservado.
Spec anterior ao código: [contrato](../architecture/C11_MOBILE_PERSISTENT_SYSTEM_BARS.md).
Dirty anterior preservado e quatro memórias/relatório geral append-only.

## Verificações

- Lock antes da alteração e no prebuild final: estático +9 negativos +22
  ativação +27 promoção PASS; hook original mantido.
- npm run build PASS, cap sync PASS; web assets/bundle/CSS idênticos ao ciclo
  anterior, por ser ajuste nativo. Gradle testDebugUnitTest/assembleDebug PASS:
  **128 testes, zero falhas/erros**, incluindo quatro novos de barras.
- Assinatura/package/SDK/standalone HTTPS/6 assets byte a byte PASS.
- Proveniência: somente allowlist alterada; código do NativePlayerActivity e
  demais handlers/manifest/web/storage/C9 preservados.
- Histórico test-c11-phone-ui-orientation.mjs tem assert de atributos contíguos
  no manifest que não contempla supportsPictureInPicture já existente. Falhou
  da mesma forma com MainActivity do baseline; script/manifest não modificados.
  Não declarar esse script PASS. Os testes Java de orientação atuais passaram.

## Evidência física

| Cenário | S24 | Tablet SM-X610 |
|---|---|---|
| Home e busca | Barras visíveis, sem overflow | Barras + taskbar visíveis, sem overflow |
| Live inline | Preview alinhado | Retrato empilhado/alinhado; paisagem preservada |
| Live ampliado | Status/navegação visíveis; paisagem | Barras/taskbar visíveis; expansão confirmada |
| Retorno e EPG | Bounds restaurados; painel ocupa área prevista | Bounds restaurados; painel ocupa área prevista |
| Filme/série internos | Barras visíveis | Barras/taskbar visíveis |
| Player de filme | NativePlayerActivity, barras visíveis | NativePlayerActivity, barras/taskbar visíveis |
| Teclado de busca | Viewport411x807 →411x519; input visível | Não exercitado neste ciclo |
| Trailer público | Overlay alinhado, sem duplicar inset | Layout phone não aplicado |

Player nativo S24: bounds **[126,105][2952,1440]**, tela3120x1440;
status[0,0][3120,105], navegação[2952,0][3120,1440], cutout126px.
Player nativo tablet: **[0,56][2560,1510]**, tela2560x1600;
status56px e navegação/taskbar90px. Player preenche toda a área segura.
Trailer S24: slot começa em64 CSS px; top nativo **351=127+64×3,5**;
bounds[0,351][1440,1162]. Conferência por UIAutomator + DOM, sem segredo.

Tablet rotacionado temporariamente para retrato, modo anterior **free**
restaurado. Fire Stick: viewport960x540, política imersiva física **0x170e**,
UI Home sem overflow; sem alteração de D-pad. A reprodução Live foi observada
em screenshots de QA; não é homologação de todos os streams/receivers/PiP.

UIAutomator não inclui sempre barras do SystemUI na árvore do app. QA passou
após usar fontes reais de insets do WindowManager e inspeção visual, sem
confundir ausência de nós com barras ocultas. Timeout de idle no tablet e uma
rodada fora do foreground foram superados por repetição com o app ativo;
última leitura do player/barras nos dois alvos PASS. Sem relaxar autorização.

## APK e atualização preservando os dados

Arquivo: [Xandeflix-v1.0.0-standalone.apk](../../Xandeflix-v1.0.0-standalone.apk).
SHA256 **7EBC87D91CABC00032CE57CF5AD3DA815E3889B146BE041DF4462DBAE8D6196E**, 12400179 bytes.
Package com.xandeflix.prebuilt; versionCode1/versionName1.0; min23/target35;
certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d; sem server.url.
Bundle index-DTghpENe.js/CSS index-BWDAqMH6.css, 6 assets iguais ao dist.
APK substitui 08FCDFFB… da atualização de ativação anterior.

| Dispositivo autorizado | install-r/hash | Arquivos privados iguais | Catálogo | Estado nativo |
|---|---|---:|---:|---:|
| S24 SM-S926B | PASS | 548/548 | 508 | 5 |
| Tablet SM-X610 | PASS | 539/539 | 505 | 5 |
| Fire Stick AFTSSS | PASS | 469/469 | 436 | 5 |

Hashes comparados em memória, sem conteúdo privado em logs. firstInstallTime,
preferences, WebView, identidade/chave/ativação e geração ativa preservados.

Referências primárias: [Android — edge-to-edge/insets](https://developer.android.com/develop/ui/views/layout/edge-to-edge),
[Media3 1.5.1 — FIT e proporção](https://github.com/androidx/media/blob/1.5.1/libraries/ui/src/main/java/androidx/media3/ui/AspectRatioFrameLayout.java).


## Atualização final — barras ocultas somente no vídeo fullscreen — 2026-10-07

**Esta atualização sucede o comportamento anterior de barras presentes também
no vídeo ampliado e o APK7EBC87D9… acima.** A regra final solicitada é:

| Contexto celular/tablet | Status/navbar/taskbar | Player |
|---|---|---|
| Home/Filmes/Séries/Busca/Ativação e detalhes | Visíveis | Layout da página |
| Canal inline e trailer inline | Visíveis | Espaço próprio |
| Vídeo de filme/episódio ou canal em tela cheia | Ocultas | Tela inteira, FIT |
| Saída de tela cheia | Restauradas automaticamente | Preview/página restaurados |

A imagem inteira e sua proporção original são preservadas: sem zoom, crop ou
stretch. As faixas necessárias à diferença de formatos são mantidas, conforme
a escolha explícita do usuário. Não reservar espaço artificial para barras no
vídeo fullscreen. O Android mantém o gesto padrão para barras transitórias.

MainActivity conserva uma marca fraca por decor da janela. Callbacks de foco/
resume reaplicam o mesmo estado, evitando reaparecimento de barras durante o
Live ampliado. A entrada Live marca true; saída/release marca false. Activity
nativa de filmes/episódios solicita true. bindSafeInsets zera padding em TV/
fullscreen e volta a reservar insets ao retornar. Os métodos de mídia, source,
licença/C9, Cast, PiP, orientação e proporção permanecem intactos. Trailer mantém
a correção de origem/padding da primeira rodada.

Baseline adicional690 arquivos e backup do APK intermediário. Spec/emenda
antes do código; mesmo workspace/main/HEAD/origin e CURRENT_GATE=NONE. Alterações
adicionais restritas aos três arquivos nativos de política/chamadas, dois casos
novos em SystemBarsPolicyTest e documentos append-only. Web/manifest/Capacitor/
Supabase/storage/source não foram alterados. NEXT_GATE_STARTED=NAO; sem Git.

Lock22+27+9 PASS imediatamente antes do Gradle. Gradle testDebugUnitTest e
assembleDebug PASS: **130 testes, zero falhas/erros**. Não houve patch web;
assets6 mantidos byte a byte no APK. APK standalone HTTPS, package/assinatura
originais, min23/target35 PASS. Teste histórico de orientação já descrito acima
permanece inalterado; não foi usado para certificar esta rodada.

### Evidência física da versão final

S24 e SM-X610: Home com status/nav visíveis; Live ampliado com ambos ocultos;
retorno restaura ambos e guia/preview alinhados. Tablet em retrato testado e
rotação anterior free restaurada; taskbar inspecionada visualmente ausente
fullscreen e presente no retorno. A propriedade histórica initiallyVisible
do controle de taskbar não foi tratada como visibilidade atual: fontes de
InsetsSource e screenshots são a evidência de exibição real.

Player nativo de filme no S24: **[0,0][3120,1440]**. No tablet:
**[0,0][2560,1600]**. Ambos NativePlayerActivity no foreground, status/nav
visible=false. Sem padding de barras/cutout reduzindo a área de fullscreen.
Após Back: status/nav visible=true, tela da página restaurada. FIT/MATCH_PARENT
conferidos no runtime/XML; imagem não foi recortada nem distorcida. Screenshots
Live inspecionadas para formato, barras e player; não certificam estabilidade
ou qualidade de todos os streams, Cast receiver ou PiP. Fire mantém imersão
0x170e e viewport960x540, Home sem overflow.

### APK final para distribuição

[Xandeflix-v1.0.0-standalone.apk](../../Xandeflix-v1.0.0-standalone.apk)
SHA256 **9FA211109DF2AE9E4422D29FDBBF4A298DD5617D14860CFD44552B6DAC788135**, 12400179 bytes.
Certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d; com.xandeflix.prebuilt, versionCode1/
versionName1.0, min23/target35; sem server.url. Mesmo bundle/CSS da primeira
rodada, 6 assets verificados. Substitui7EBC87D9…/08FCDFFB… como APK atual.

| Alvo | install-r/hash | Privados preservados | Catálogo | Estado nativo |
|---|---|---:|---:|---:|
| S24 SM-S926B | PASS | 551/551 | 508 | 5 |
| Tablet SM-X610 | PASS | 537/537 | 505 | 5 |
| Fire Stick AFTSSS | PASS | 467/467 | 436 | 5 |

firstInstallTime/preferences/WebView/identidade/chave/ativação preservados.
Contagens refletem o snapshot específico desta atualização, após uso legítimo
no intervalo; comparações feitas antes/depois do install-r, não entre sessões.
Não houve limpeza, uninstall, rotação de chave, backend ou publicação Git.
