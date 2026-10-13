# C11 - Home, aviso temporario e diagnostico de reproducao

Escopo adicional autorizado pelo usuario em 2026-10-08 dentro do ciclo49.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Workspace ativo independente C11,
main, origin xandeflix2/xandeflix-prebuilt, HEAD61ec009 preservado. Sem Git,
backend, reset, rotacao de identidade/chave, mudanca de fonte ou novo Gate.

## Especificacao anterior ao codigo

1. Na Home, a primeira categoria depois de Series em Destaque deve ser a
categoria de filmes Lancamentos existente. Ordenar apenas as referencias de
categorias na apresentacao, usando isReleaseCategory; manter demais categorias
na ordem relativa atual, sem duplicar, renomear IDs ou mudar o catalogo.
O criterio source-desc ja implementado para os itens permanece intacto.
2. O aviso sanitizado de erro de reproducao deve ser uma notificacao compacta
no canto superior direito, dentro da viewport, abaixo do cabecalho horizontal
e fora do menu lateral. Nao ocupar espaco no fluxo nem deslocar hero/titulo.
Em celulares respeitar largura util; nao cobrir navegacao. Manter role alert,
mensagem controlada e botao Fechar aviso sem roubar foco automaticamente.
3. Fechar automaticamente apos10000ms. Um novo aviso reinicia o prazo; render
sem mudanca da mensagem nao reinicia. Timer usa callback atual e cancela ao
desmontar, trocar ou remover mensagem. Fechar aviso nao interrompe playback,
nao altera sessao, ativacao, source, catalogo ou politica de barras.
4. Diagnosticar o relato atual de falha em tablet/S24 de forma read-only:
categorias/classes/checkpoints sanitizados, sem persistir ou mostrar URI,
headers ou credenciais. Conferir referencia canonica e conectividade limitada
device-to-source, com controle publico. Nao adivinhar endpoint, alterar
credenciais, contornar C9, TLS ou licenca, nem mascarar falha com timeout maior.
Patch funcional de playback depende de defeito comprovado e especificacao
adicional anterior ao codigo; falha externa deve ser relatada como tal.

## Allowlist estrita adicional

- src/ui/pages/HomePage.tsx: ordem de categorias apenas.
- src/ui/components/PlaybackErrorNotice.tsx: lifecycle do timer apenas.
- src/index.css: somente regras do aviso.
- scripts/test-c11-home-release-notice.mjs: novo teste dirigido.
- scripts/test-c11-playback-error-notice.mjs: compatibilidade de hooks no
  harness e assertions do posicionamento solicitado; preservar todas as
  verificacoes de sanitizacao, bridge, cleanup, acessibilidade e callback.
- scripts/test-c11-home-special-collections.mjs: dependencia real de
  category-presentation no loader; assertions existentes preservadas.
- Este documento, spec/evidencia do ciclo49, relatorio detalhado, STATUS,
  DECISIONS, ERRORS_AND_BLOCKERS e EVOLUTION_REPORT: registros factuais.

Arquivos de playback/native/source/control-plane/bootstrap fora desta
allowlist permanecem protegidos; helpers privados de QA em tmp ignorado.

## Aceitacao

Teste real do componente Home: Lancamentos imediatamente apos destaque de
series, cada categoria uma vez, outras na ordem relativa original, ausencia
de Lancamentos valida; botoes e quotas preservados. Teste real do aviso:
timer10000, ausencia antes do prazo, callback recente, render comum nao
reinicia, nova mensagem reinicia, cleanup evita callback tardio, fechar
manual e ausencia de mensagem. Conferencia fisica de geometria/ordem nas
familias conectadas, sem injecao de erro de midia real para validar CSS.
Lock de ativacao antes/depois/prebuild, build, APK assinado/assets iguais,
install-r dos alvos autorizados com hashes privados/firstInstallTime iguais.
Reproducao fisica e estado da fonte devem ser reportados separadamente das
melhorias de UI; timeout nao e prova de codec ou bug no player.

## Regressao observada de Recentes - especificacao antes do ajuste27

Leitura privada read-only do tablet apos promocao4:11registros,9IDs com
fingerprint correspondente; Luke Cage e Ponto Cego ainda existem, cada um com
um unico fingerprint identico e ID M3U diferente. Retirar24H da contagem de
series altera numeros sequenciais. Manter bloqueio de fingerprint e reparar
somente associacao efemera da UI, sem editar historico persistido/canonico.

Allowlist adicional: src/ui/recent-title-resolution.ts, RecentTitles.tsx e
scripts/test-c11-recent-source-rebind.mjs; test-c11-home-special-collections
pode incluir dependencia real no harness. Playback/watch-history e reader
continuam intactos. Nao habilitar retomada por nome aproximado ou primeiro
homonimo. Para ID M3U antigo com fingerprint valido nao correspondente:
scan cooperativo local dos segmentos do mesmo kind, buffer de um segmento,
no maximo60 fingerprints e dois candidatos por fingerprint; somente unico
match pode remapear para o ID canonico atual. Duplicata/ausencia descarta.
Abort/unmount/troca de geracao descarta resultado. Nao carregar streams.

Serie M3U remapeada exige episodeId antigo do proprio item, formato canonico
ser:m3u:N:sS:eE. Conservar suffix temporada/episodio e validar ID novo pela
retomada canonica existente, que exige episodio na serie atual antes de
acionar player/C9. IDs de outros protocolos nunca sao adivinhados. Posicao,
conclusao, cronologia e fingerprint conservados na copia de apresentacao.
Historico original permanece intacto; proximo progresso real usa ID atual.
Se registro antigo remapeado e novo progresso apontam para o mesmo item, exibir
uma vez, mantendo primeiro/mais recente; nao sobrescrever posicao nova com antiga.

Testar ID reassigned de movie/series, duplicata, ano/ID/fingerprint divergente,
suffix de episodio alheio/invalido, retomada com S/E real e posicao, episodio
ausente bloqueado, abort/troca de snapshot e quota60. Conferir tablet recupera
os11registros sem falsa associacao antes de atualizar APK final.
