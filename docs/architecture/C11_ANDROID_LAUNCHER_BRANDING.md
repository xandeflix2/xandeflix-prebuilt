# C122 — marca Xandeflix no launcher Android — 2026-10-15

Pedido explícito de substituir ícone genérico nos dispositivos. Usuário escolheu
X vermelho em fundo escuro, como a marca atual do menu. C121 concluído com
APK/evidência/auditoria antes deste ciclo; inclui gêneros em oito modelos e
logos inline somente mobile. Preflight novamente no clone ativo C11-main,
main/origin canônicos, HEAD0f68f169f7728fae17c8311832b7643629e97a02;
baseline1050 arquivos em tmp/c122-launcher-branding. AGENTS/Architecture/
Execution/Activation Lock lidos, lock inicial obrigatório. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C122; NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset.

## Diagnóstico e especificação anterior aos assets

Manifest já aponta para ic_launcher/round; PNGs contêm marca padrão Capacitor
azul sobre fundo branco, adaptive usa esses PNGs e TV banner aponta para ícone
quadrado. Recursos drawable não usados ainda contêm Android genérico/grid.

- Reutilizar linguagem vetorial do X do Header (traços cruzados vermelhos com
  pontas arredondadas), dimensionada para legibilidade/safe-zone, fundo#080C14
  e vermelho#E50914. Não gerar nova marca por IA nem usar imagem de terceiros.
  Masters SVG code-native versionados; rasterização local via Chrome/canvas,
  sem dependência/serviço remoto ou edição de fotografia/imagem existente.
- Ícone padrão e round nas cinco densidades existentes (48/72/96/144/192px),
  foreground transparente108dp (108/162/216/324/432px). Todos os recursos
  atuais com esses nomes devem representar a marca, inclusive fallback legado.
- Adaptive v26 usa vetor foreground108dp e background escuro; desenho fica
  dentro da área segura central66dp. Variante v33 acrescenta monochrome para
  ícones temáticos do sistema, com mesmo X. Sem sombra/máscara no foreground.
- TV/Fire/Google TV recebem banner horizontal320×180 xhdpi com X e nome
  XANDEFLIX, mesma paleta. Manifest muda somente referência android:banner;
  android:icon/roundIcon/package/label/intent-filters/permissões/backup intactos.
- Apenas branding do APK Android (phone/dobrável/tablet/Fire/Android TV/Box).
  Não criar pacote nativo Samsung Tizen/LG webOS nem declarar teste nesses SOs.
  UI/web dist e toda lógica C121/ativação/C9/source/storage mantidas byte-a-byte.

## Allowlist e aceitação

assets/branding/{xandeflix-launcher-foreground,xandeflix-launcher,xandeflix-tv-banner}.svg;
android/app/src/main/AndroidManifest.xml (banner apenas);
android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher{,_round,_foreground}.png;
res/mipmap-anydpi-v26/{ic_launcher,ic_launcher_round}.xml;
novos res/mipmap-anydpi-v33/{ic_launcher,ic_launcher_round}.xml;
res/{drawable/ic_launcher_background,drawable-v24/ic_launcher_foreground,
values/ic_launcher_background}.xml; novo res/drawable-xhdpi/xandeflix_tv_banner.png;
este plano, docs/evidence/C11_ANDROID_LAUNCHER_BRANDING.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/capturas tmp/c122-launcher-branding e saídas usuais Gradle/APK ignoradas.

Inspecionar PNGs/máscaras circle/squircle e banner, conferir dimensões/alpha/
safe-zone, XML e mudanças do manifest. Sem suíte funcional nova para assets
reversíveis. Lock inicial/final obrigatório, Gradle/asset packaging/certificado,
manifest compilado e APK C122 incluindo sete assets web idênticos ao C121.
Preservar C121; nenhum uninstall/instalação automática. Conferência física do
launcher pendente; não afirmar screenshot de fixture como aparelho real.

Referências oficiais consultadas:
https://developer.android.com/develop/ui/compose/system/icon_design_adaptive
(108dp, área segura66dp, foreground/background/monochrome);
https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines
(banner16:9, recurso xhdpi320×180). Mudança local, sem publicação em lojas.
