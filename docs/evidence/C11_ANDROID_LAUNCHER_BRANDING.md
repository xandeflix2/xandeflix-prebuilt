# C122 — ícone e banner Android — 2026-10-15

Pedido e escolha explícita: X vermelho em fundo escuro, como o menu atual.
Plano anterior aos assets em C11_ANDROID_LAUNCHER_BRANDING. Clone ativo
C11-main, main/origin canônicos, HEAD0f68f169f7728fae17c8311832b7643629e97a02;
baseline1050 arquivos após conclusão do C121. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C122_ANDROID_LAUNCHER_BRANDING; NEXT_GATE_STARTED=NAO.
Sem commit/push/PR, instalação, reset, publicação ou operação backend.

## Resultado

Substituída marca genérica Capacitor azul/branca por X#E50914 sobre#080C14.
Três masters SVG reutilizam os traços arredondados da marca da UI; geração
local Chrome/canvas, sem IA, rede ou novas dependências. Quinze PNGs nos
cinco níveis de densidade incluem ícone padrão, redondo e foreground com
transparência. Vetor adaptável108dp usado no v26 e v33; variante v33 contém
monochrome. Também substituídos vetores genéricos de fallback.

Banner TV320×180 xhdpi com X/nome XANDEFLIX. Manifest muda apenas banner
de mipmap quadrado para drawable próprio; package/icon/roundIcon/label,
intents/permissões/backup intactos. APK Android atende celular/dobrável,
tablet/Fire/Android TV/Google TV/Box. Não produz pacote nativo Tizen/webOS.

## Verificações

- PNGs conferidos em dimensões/assinatura; foreground108 tem canto alpha0,
  raio máximo32,7185px dentro da área segura central66dp e nenhum pixel azul.
  Prévias quadrada, circular, squircle e banner inspecionadas visualmente:
  X centralizado, sem corte; nome legível no banner. São renderizações locais,
  não capturas de aparelho. Guia oficial de
  [ícones adaptáveis](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)
  e [banner TV](https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines)
  consultados para dimensões/área segura.
- Lock inicial/final/pre-Gradle26 ativação+27 promoção+9 negativos PASS.
  Gradle assembleDebug PASS; aviso flatDir anterior mantido. Nenhuma falha
  técnica pendente. Inspeção inicial aapt resources excedeu buffer padrão do
  helper privado; repetida com limite explícito, sem alteração de produção.
- APK:16 PNGs empacotados byte a byte iguais aos recursos gerados; quatro
  XMLs adaptáveis v26/v33 compilados com foreground/background corretos e
  monochrome v33; vetor compilado mantém X vermelho. Manifest compilado
  resolve icon/roundIcon/banner corretos e fundo escuro confirmado.
- Sete arquivos do dist conferidos por hash; nove arquivos assets/public do
  APK (incluindo dois gerados pelo Capacitor) idênticos ao C121. Configuração
  HTTPS local, logging none, sem dev server. Mesma assinatura de C121.
  Onze de doze DEX idênticos; DEX de recursos refeito após novos IDs Android.
  Auditoria do baseline protege todos os fontes Java/JS e patches C121.
- C121 inclui gêneros reais nas páginas de filme/série em oito modelos,
  logos na linha dos metadados somente phone, sob poster nos demais perfis,
  e menu mobile flutuante C120. Validações próprias registradas nas respectivas
  evidências; não foram alterados neste ciclo de recursos nativos.

## Artefato e limites

APK local: tmp/c122-launcher-branding/Xandeflix-v1.0.19-C122.apk.
Package com.xandeflix.prebuilt, code19/name1.0.19, min23/target35;
12.708.979 bytes. SHA256:
b78c02f6d95104477dd3708301f2145b00ffabc5e31ff110a4ee64f3f6af677d.
C121 preservado e hash conferido. Sem instalação automática. Conferência
física do launcher em celulares/tablets/TVs permanece pendente; preferências
de ícone temático/máscara pertencem ao sistema/launcher do usuário.

Auditoria final compara baseline/HEAD e allowlist:21 recursos/manifest
existentes, três memórias append-only e oito arquivos novos (três masters,
dois XMLs v33, banner e dois documentos). Demais hashes anteriores intactos.
Relatórios/helpers/prévias privados em tmp/c122-launcher-branding.
