# C158 — falha de filme e Live no navegador — 2026-10-17

## Pedido e preflight

Usuario substituiu a fonte e confirmou reproducao real de um episodio no
/app de producao. Filme abre/fecha o player; Live mostra somente
LIVE_PREVIEW_PLAYBACK_FAILED. Isso nao comprova protocolo/codec/HTTP de
outros itens. Nao usar credenciais visiveis em screenshots nem buscar midia
real do cliente. Usuario rejeitou proxy, relay, VPS e custo de banda.
Esclarecimento durante a investigacao: filmes de outras categorias abriram;
falha de VOD observada nos lancamentos. Categoria nao comprova codec/formato.

Workspace independente C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, HEAD
67ffa40bddfef19004bb4157751ad891f0c6b27d, arvore/index limpos.
AGENTS, Architecture, Execution, Source Boundary e Activation Lock lidos.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C158; NEXT_GATE_STARTED=NAO.
Publicacao/Git do reparo web continuam autorizados no mesmo projeto equipe2;
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO.
Nao operar equipe4, Supabase, fontes, clientes, dispositivos ou APK.

## Especificacao anterior ao codigo

1. Preservar erros reais das bibliotecas HLS/MPEG-TS e HTMLMediaElement
   apenas como enums fechados, status HTTP inteiro e MediaError.code.
   Capturar etapa VALIDATION/HTML_MEDIA/HLS/MPEGTS/PLAY, formato de URL
   permitido (nao o codec efetivo), protocolo e estado. Nao classificar
   falha de rede como CORS confirmado, nem formato como codec confirmado.
2. Manter em RAM no maximo uma observacao por movie/series/live, sem IDs,
   nomes, host, path, query, headers, corpos, mensagens ou objetos de erro.
   Expor essas linhas no suporte web existente, inclusive apos filme fechar.
   Log de falha pode conter somente as mesmas linhas sanitizadas. Nativo
   desabilitado retorna observacoes neutras, sem escrita ou telemetria remota.
3. Observar validacao antes da montagem para registrar HTTP/headers negados.
   Preservar rejeicao, nao modificar URL/extensao, headers, bibliotecas,
   politicas HTTPS/CORS, source delivery, catalogo, C9, parental ou eventos.
   Autoplay negado continua permitindo controle manual, sem falso erro fatal.
4. Callbacks tardios de transporte/Promise anterior nao podem encerrar um
   preview atualizado. Associar callback e listener de MediaError ao mesmo
   AbortController do carregamento; ignorar depois de abort/troca/stop.
   Erro legitimo continua encerrando VOD e liberando C9 pelo resume existente;
   Live mantem evento sanitizado e cleanup existentes. Nao manter video sem
   autorizacao nem criar retry/fallback/conexao paralela.
5. Nao prometer reproducao de formato nao suportado ou consertar fonte com
   diagnostico. Identificar primeira fronteira real na proxima tentativa do
   usuario, sem solicitar URL, senha, PIN, PUK ou HAR.

## Allowlist estrita

- Novo src/web/web-playback-diagnostic.ts: store e classificadores fechados.
- src/web/web-media.ts: callback de erro tipado, classificacao das bibliotecas,
  sem alterar transporte/configuracao; MediaError em listener do WebPlayer.
- src/web/web-player.ts: observacao de tentativa/erro/playing/autoplay e
  isolamento do controller; mesmos callbacks nativos e teardown.
- src/web-production/WebAccessStatus.tsx: acrescentar linhas sanitizadas.
- Novo scripts/test-c158-web-playback-diagnostic.mjs: falhas reais dos ports
  de bibliotecas, execucao do WebPlayer, sanitizacao/isolamento/native.
- package.json: incluir somente a nova suite no site:build.
- Este contrato, docs/evidence/C11_WEB_PLAYBACK_FAILURE_DIAGNOSIS.md e
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only.
- Helpers/baseline/evidencia sintetica ignorados tmp/c158-web-playback.

Nenhum outro arquivo permitido. Preservar suites anteriores sem relaxamento,
hashes nativos/APK e memoria existente por prefixo. Sem dependencias novas.

## Aceitacao e limites

Lock antes/depois, typecheck e site:build completo; C136 player e C105
details/import; novos testes de HLS/MPEGTS/media/play/validacao, eventos
tardios, status invalidos, entradas maliciosas, autoplay nao fatal e native
sem observacao. Fixture Chrome isolada com codigo real deve comprovar
diagnostico de falha de HTMLMediaElement sem credenciais/fonte real.
Publicar via Git canonico e verificar status/aliases, assets novos e admin
preservado. Reproducao real de filme/Live permanece pendente do diagnostico
do usuario; fixtures e HTTP200 do site nao a certificam.

## Extensao previa — erro ao consultar episodios

Usuario relatou durante o ciclo que algumas series mostram "Nao foi possivel
carregar os episodios - tente novamente". UI atual descarta o codigo do erro
da consulta, embora preserve retry e nao trate a falha como lista vazia.
Ampliar somente a allowlist src/ui/pages/SeriesDetailPage.tsx: envolver a
chamada existente loadEpisodesForSeries em observador web que devolve o
mesmo valor/rejeicao. Guardar em RAM somente estado e codigo fechado da
consulta mais recente; ignorar resultado tardio de consulta substituida.
Sem ID/titulo, conteudo, resposta ou mensagem arbitraria. Mostrar em suporte
e console os enums, preservando UI/retry/parental/resolver/cache/validacao.
Store e suite C158 incluem esses casos; nativo chama operacao sem observador.
Nao aceitar dados malformados nem relaxar contrato C105 sem evidencia real.
