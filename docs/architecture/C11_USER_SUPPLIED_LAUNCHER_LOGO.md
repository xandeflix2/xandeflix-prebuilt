# C131 — Logo enviada pelo usuário no ícone instalado

## Autorização e proveniência — 2026-10-16

Usuário solicitou substituir a marca do ícone pela imagem anexada: X vermelho
metálico com play central, fundo preto. Substitui a escolha anterior de X simples
somente nos recursos do launcher/banner. Não redesenhar ou gerar outra logo.

Preflight no clone independente ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
main, origin xandeflix2/xandeflix-prebuilt, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. AGENTS, Architecture, Execution,
Activation Lock e specs C122/C130 lidos. Baseline1103 arquivos/prefixos das três
memórias em tmp/c131-user-logo. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Sem Git/backend/instalação/reset/uninstall. APK C130 preservado.

Anexo original recuperado somente do último input_image da mensagem atual no
registro local da própria conversa; nenhum outro texto foi exportado. PNG
1254×1254,1527622bytes, SHA256
6541036992545ed1563e01d47fe782eca68fdcec6b02e201438ec19ee49e924c.
Arquivo inspecionado e corresponde visualmente ao anexo. Arquivos diferentes
de logo encontrados em Downloads foram descartados como entrada, sem alteração.

## Especificação anterior aos recursos

- Guardar PNG original byte a byte como assets/branding/xandeflix-user-logo.png.
  Apenas reamostragem/empacotamento determinísticos em canvas para tamanhos de
  recursos Android; nenhuma geração de imagem ou alteração criativa da marca.
- Ícones quadrado/round nas cinco densidades existentes (48/72/96/144/192px),
  margem preta e enquadramento seguro. Round recorta somente a área externa;
  conferir que a marca inteira permanece dentro do círculo.
- Foreground adaptável108dp nas mesmas densidades: original centralizado em56dp
  com margem transparente, fundo da aplicação preto para unir ao fundo do anexo.
  Wrapper drawable bitmap substitui vetor antigo, preservando referências v26.
- v33 mantém adaptive colorido e remove monochrome antigo de X simples: usar o
  raster preto como máscara monocromática produziria um quadrado incorreto.
  Tema/máscara final do launcher pertence ao sistema do aparelho.
- Bitmaps television-xhdpi recebem a mesma logo; banner320×180 mantém o nome
  XANDEFLIX ao lado da imagem, sem esticar/cortar o X. Ícone e banner explícitos
  na MainActivity, conforme C130, permanecem intactos.
- VersionCode21/name1.0.21 para distinguir atualização e renovar os recursos
  pelo evento normal de substituição. Preservar package/assinatura/dados locais.
- Não alterar marca da UI interna, C130 anti-piscada, C129 D-pad, parental,
  ativação, fonte, nativo Java, dependências ou web dist consolidado.

## Allowlist estrita

assets/branding/xandeflix-user-logo.png (novo);
android/app/build.gradle (versão apenas);
android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher{,_round,_foreground}.png;
res/mipmap-television-xhdpi/ic_launcher{,_round}.png;
res/drawable-xhdpi/xandeflix_tv_banner.png;
res/drawable-v24/ic_launcher_foreground.xml;
res/drawable/ic_launcher_background.xml;
res/values/ic_launcher_background.xml;
res/mipmap-anydpi-v33/{ic_launcher,ic_launcher_round}.xml;
este documento/docs/evidence/C11_USER_SUPPLIED_LAUNCHER_LOGO.md;
apêndices em docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md.
Helpers/prévias e saídas usuais Gradle/APK ignorados em tmp/c131-user-logo.

## Aceitação

Inspecionar visualmente ícone/round/adaptive mascarado/banner. Conferir dimensões,
legibilidade, margens e original por hash. Sem suíte artificial nova para assets
reversíveis. Lock antes/depois/pré-Gradle obrigatório. APK separado validado por
assets PNG/XML/manifest/certificado, versão21 e oito assets web idênticos ao C130.
Auditoria protege todos os arquivos anteriores fora da allowlist, prefixos das
memórias e Git. Não instalar automaticamente; QA física do launcher pendente.
