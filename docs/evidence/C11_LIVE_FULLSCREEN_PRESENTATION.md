# C161 - Fullscreen Live, confirmacao de navegacao e APK

Conclusao: 2026-10-19, America/Sao_Paulo.

## Autoridade e proveniencia

Preflight repetido no clone ativo independente C:/Xandeflix/xandeflix-prebuilt-c11-main,
main/origin xandeflix2/xandeflix-prebuilt, HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb.
AGENTS/contratos/Boundary/lock lidos; CURRENT_GATE=NONE; CYCLE=C161;
NEXT_GATE_STARTED=NAO. A pasta historica nao foi editada/buildada/operada.
Spec e emendas anteriores ao codigo em C11_LIVE_FULLSCREEN_PRESENTATION.md.
Dirty previo de quatro docs preservado; tres memorias recebem somente append.
Usuario inicialmente proibiu APK e depois solicitou explicitamente gera-lo.
Sem commit/push/PR, deploy, backend, fonte real, instalacao ou reset.

## Mudancas

- Live web e Android: Voltar circular com chevron no topo esquerdo, nome maior,
  AO VIVO branco/vermelho abaixo, Canal anterior/Proximo canal nas laterais do Play.
- Fullscreen Android: Canais/Categorias/Favoritos em painel escuro lateral direito,
  lista sem radio, foco/paginacao/selecoes existentes; Guia em faixa inferior
  acima do rodape. Bounds reservam header/footer reais. Inline mantem dialogo.
- Web: Guia acima da barra inferior medida, sem tocar no video/transportes.
- Confirmacao web: listener em captura impedia Enter de ativar o botao focado.
  Chrome real reproduziu keydown/keyup trusted com foco correto e zero click.
  Enter/Espaco agora executam o mesmo onclick, preventDefault evita duplicata;
  repeat e disabled nao disparam. Back, PIN, C9 e transportes preservados.

## Verificacao

- Lock oficial antes da compilacao, prebuild e final PASS, negativos intactos.
- npm run build PASS (tsc/Vite); cap copy android PASS; assembleDebug PASS.
- 206 testes JVM, 35 suites, zero falhas/erros/skips;
  Java e recursos compilados, bounds em PC/TV/tablet/telefone/densidade3.
- C136 WebPlayer: 11 testes PASS, incluindo Enter/Espaco/repeat/disabled e cleanup.
- C161: suite real de continuidade com storage parental sintetico isolado e
  checks originais intactos; avancar manual/auto, temporada/lacunas/final,
  evento stale/duplo, C9/revogacao/Back e bridge correlacionado PASS.
- Harness Java executa corpos reais de bind/request/dispatch/emit: toque,
  OK/D-pad, media-next, token, progresso, pending, ultimo episodio, Cast/busy/
  disposal PASS; views/input/IPC sao adaptadores, nao aparelhos Android reais.
- C112 teclas Live, Live controls (7), C148 browse/guide, C160 parental (12),
  C158 diagnostico (14) PASS. Nenhum teste de protecao relaxado.
- Chrome isolado: 6 perfis, 18 paineis; Enter real em Proximo canal e Proximo
  episodio PASS, substituicao correlacionada/ultimo episodio/cleanup PASS.
  Capturas TV-canais e paisagem-guia inspecionadas, alem das capturas iniciais
  TV/paisagem/celular estreito. Midia Canvas sintetica, nenhuma fonte real.
- Auditoria de 1241 arquivos locais: somente allowlist,
  lifecycle web fora da UI e handlers nativos preservados; identidade,
  ativacao, source, catalogo, parental, C9 e diagnostico previo intactos.

## APK

Arquivo: tmp/c161-live-fullscreen/Xandeflix-v1.0.33-C161.apk
Package: com.xandeflix.prebuilt; versionName=1.0.33; versionCode=33.
Bytes=11402630; SHA-256=c9ae534d9062c2ab0f709859054a9cb4666d29c00cc9c265ab6627476ddf8367.
apksigner verifica assinatura e mesmo certificado do APK1.0.32; aapt2 confirma
package/versao. 8 assets do dist comparados byte a byte
com APK; config HTTPS sem server.url de desenvolvimento. APK1.0.32 versionado
preservado. APK de teste debug, nao instalado automaticamente.

## Limites

ADB nao listou aparelhos. Usuario relata que OK nao fazia nada no Fire Stick;
os testes nativos com adaptadores passaram e nao reproduzem a falha fisica.
A correcao de teclado foi demonstrada no browser; nao e prova da causa no
player nativo Fire. Necessario retestar OK/Proximo episodio/Proximo canal no
Fire/TV/tablet/celular com este APK. Nao declarar todos os aparelhos homologados.
Sem teste de codecs/fonte comercial. Vercel/Git nao publicados nesta rodada.
Evidencias tecnicas sinteticas/logs/capturas em tmp/c161-live-fullscreen.
