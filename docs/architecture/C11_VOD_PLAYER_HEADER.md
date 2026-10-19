# C162 - Cabecalho dos players de filmes e series

## Autoridade e preflight - 2026-10-19

Usuario esclarece que a falha de episodios era na fonte, ja corrigida.
Nenhum patch de fonte/episodios sera feito por esse relato. Solicita aplicar
a filmes/series o Voltar e titulo maiores da apresentacao Live C161. Pedido
de APK ao final da mesma sequencia de ajustes permanece autorizado; entregar
atualizacao recuperavel1.0.34/code34, sem instalacao automatica.

Clone ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb. AGENTS, Architecture,
Execution, Source Data Boundary e Activation Lock lidos. Preflight read-only
completo executado. Dirty previo e C161 conhecido preservados; baseline de
hashes em tmp/c162-vod-player-header/baseline.json.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C162; NEXT_GATE_STARTED=NAO.
Sem Git writes/PR/deploy/backend, fonte real, reset ou instalacao autorizados.

## Especificacao anterior ao codigo

1. Android/Fire/TV: player_back torna-se ImageButton48dp com o mesmo chevron
   e fundo circular/foco existentes do Live. Preservar ID e callback.
   player_title passa a26sp bold em todos os aparelhos; retirar somente
   override20sp de TV. Header wrap_content/min48dp permite titulo longo ate
   duas linhas com elipse, sem cobrir Voltar/Cast/Bloquear. Sem alterar texto
   de temporada/episodio, seek, controles, foco, PiP, Cast ou lifecycle.
2. Browser: reutilizar icone/classe acessivel de Voltar tambem em VOD;
   distinguir aria-label do retorno Live. Classe de header VOD com padding,
   titulo clamp22-36px e botao48px (44px/titulo22px em viewport pequeno), como
   Live. Preservar callback closeVod, Enter/Espaco e demais botoes. Live nao
   ganha mudanca visual ou funcional. Sem badge AO VIVO em filme/serie.
3. Somente apresentacao, sem nova dependencia/segredo/transporte ou patch de
   carregamento/parental/identidade/ativacao/licenca/C9. Preservar APK1.0.33.

## Allowlist estrita

- src/web/web-player.ts: somente header/icone dentro de controls().
- src/web/web-runtime.css: append de estilos VOD escopados.
- android/app/src/main/res/layout/xandeflix_player_controls.xml: header.
- android/app/src/main/java/com/xandeflix/prebuilt/player/PlayerControls.java:
  retirar somente override de tamanho20sp do titulo em TV.
- android/app/build.gradle: somente versionCode34/versionName1.0.34.
- Este contrato e docs/evidence/C11_VOD_PLAYER_HEADER.md.
- Append em docs/STATUS.md, docs/EVOLUTION_REPORT.md e
  docs/ERRORS_AND_BLOCKERS.md; todos os prefixos anteriores intactos.
- Helpers/logs/fixtures/APK recuperavel em tmp/c162-vod-player-header;
  saidas habituais de build/cap copy/Gradle, sem mudar config/lock/deps.

## Aceitacao

Lock antes/depois/prebuild; C136 controles/teclado, C161 navegacao e suites
nativas existentes; tsc/build/resources/Java passam. Chrome isolado usa
WebPlayer real com midia sintetica e verifica Voltar/titulo longos em
filme/serie, viewport PC/tablet/TV/celular, ausencia de badge Live e retorno
com cleanup. Capturas inspecionadas. Nao escrever testes que apenas espelhem
CSS; usar interacao e bounds reais. APK assinado com mesmo certificado,
package/versao/assets/hash verificados. Auditoria da allowlist e preservacao
dos handlers/estado/C161. Nenhuma afirmacao de teste fisico sem aparelho.
