# C162 - Cabecalho de filmes e series - 2026-10-19

## Autoridade e proveniencia

Usuario informou que a fonte causava a falha dos episodios e que ja a corrigiu.
Esse relato encerra a investigacao iniciada, sem patch de fonte/episodios.
Solicitou aplicar Voltar/titulo da apresentacao Live aos players de filmes e
series. Spec anterior ao codigo: C11_VOD_PLAYER_HEADER.md. APK segue pedido
explicito da sequencia de ajustes. Nenhuma instalacao automatica autorizada.

Preflight: clone ativo independente C:/Xandeflix/xandeflix-prebuilt-c11-main,
main, origin xandeflix2/xandeflix-prebuilt, HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb.
AGENTS/Architecture/Execution/Source Boundary/Activation Lock lidos.
CURRENT_GATE=NONE; CYCLE=C162; NEXT_GATE_STARTED=NAO. Baseline de1249 arquivos
preserva dirty/C161, documentos e APK anteriores. Sem operar pasta historica.

## Patch

- Android/Fire/TV: player_back ImageButton48dp, chevron e foco circular do
  Live; mesmo ID/callback. Titulo26sp bold, ate duas linhas/elipse, header
  wrap_content/min48dp. Removido somente override20sp de TV no Java.
- Browser: mesmo SVG/botao acessivel para filmes/series, classe VOD com
  titulo22-36px, padding e botao48px (44px em viewport pequeno). Live preservado.
- Texto de temporada/episodio, controles/Cast, acoes, teclado, playback,
  fonte/episodios/parental/ativacao/licenca/C9 inalterados. Sem novo teste de
  codigo que espelhe CSS ou dependencia adicionada.

## Validacao

Lock oficial antes, prebuild e final PASS, incluindo negativos. npm run build
(tsc/Vite), cap copy android, testDebugUnitTest e assembleDebug PASS.
206 testes nativos/35 suites sem falhas/erros/skips; C13611 testes e C161
continuidade/navegacao real com adaptadores passam. Chrome isolado: 6 tamanhos
PC/tablet/TV/telefone, 12 fluxos movie/series com midia Canvas sintetica; bounds
de titulo/Voltar/Bloquear, icone circular, nome longo, ausencia de badge Live,
Enter real em Voltar e cleanup de transporte passam. Capturas TV-movie e
phone-narrow-series inspecionadas. Nao equivale a teste fisico de dispositivo.

Auditoria de1249 arquivos PASS: allowlist estrita, prefixos das memorias e
APKv1.0.33 preservados. Java nativo muda so override20sp e XML preserva todo
o bloco de controles inferior; CSS anterior mantido byte a byte. Diff-check
com configuracao canonica PASS. Evidencias privadas em tmp/c162-vod-player-header.

## APK

Arquivo: tmp/c162-vod-player-header/Xandeflix-v1.0.34-C162.apk
Package=com.xandeflix.prebuilt; versionName=1.0.34; versionCode=34.
Bytes=11402667; SHA-256=fd137dd6f707c679937faa9e025c57ee5fe18ce2c9baab2169f16c40005c4f72.
apksigner verifica mesma assinatura da1.0.33; aapt2 confirma versao/package;
8 assets identicos ao dist. Config HTTPS sem servidor de
desenvolvimento. Copia versionada1.0.33 preservada. APK debug para testes,
nao instalado automaticamente. Sem teste fisico ou fonte real nesta rodada.
Sem Git writes, PR, deploy Vercel, backend, reset ou proximo Gate.
