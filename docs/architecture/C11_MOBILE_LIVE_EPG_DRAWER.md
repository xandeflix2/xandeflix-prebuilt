# C11 — guia EPG retrátil mobile — 2026-10-07

Pedido explícito: Guia de Programação sempre visível; abre de baixo para cima
na área de categorias/canais, mostra programa atual e próximos do canal ativo,
e recolhe ao tocar novamente. Escopo mobile existente <600px.

Preflight read-only: clone/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main,
.git independente, origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture,
Execution, Source Data Boundary e lock de ativação lidos. Dirty anterior
preservado em baseline próprio. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Sem commit/push/PR/backend/reset. Entrega APK/update-r nos três aparelhos
anteriores permanece autorizada; não incluir aparelho adicional por conexão.

## Allowlist e especificação anteriores ao código

- src/ui/pages/LiveTvPage.tsx: estado/Back do guia mobile; painel dedicado;
  esconder visualmente listas/abas enquanto aberto sem desmontá-las; preview,
  seleção, paginação, Cast, autorização/C9 e handlers nativos preservados.
- src/ui/components/LiveEpgPanel.tsx: botão acessível de44px, painel animado
  limitado abaixo do preview; altura medida pelo layout real, lista rolável,
  carregamento/erro/ausente/repetir; relógio/atualização só enquanto aberto.
- src/catalog/live/live-epg.service.ts: acesso direto ao EPG da mesma fonte,
  via AuthorizedRuntimeSourceContextProvider fresco e store seguro existente;
  get_short_epg de um canal (limit12), sem importação XMLTV completa/boot.
- src/index.css: apresentação exclusivamente estreita, transição vertical,
  reduced-motion, botão sempre acima da navegação inferior; amplos intactos.
- src/App.tsx: Back físico em rota Live oferece evento cancelável ao painel
  aberto antes do retorno central; guia fechado/amplos conservam fluxo atual.
- Este contrato/evidência, relatório de otimizações e quatro memórias append-only;
  saídas usuais dist/Capacitor/APK; harnesses seguros ignorados em tmp próprio.

EPG atual é fallback estático, não consulta a fonte. Implementar consultas
Xtream configuradas e playlists get.php do mesmo protocolo quando credenciais
estiverem no registro seguro autorizado; nesse caso validar origem/caminho
e conta do stream para extrair apenas stream_id. Não derivar fonte alternativa
nem adivinhar URL XMLTV. M3U sem esse endpoint retorna indisponível explicitamente.
Não alterar configuração/source delivery/importador/cofre/Control Plane/Java.

Fonte deve estar ACTIVE e identidade/versão/protocolo coincidentes no store.
URLs/credenciais são temporárias, não renderizadas, gravadas ou logadas; EPG
somente em RAM da página, descartado ao fechar/sair. Sem Supabase/telemetria
de conteúdos. Não adquirir/liberar sessão de reprodução por abrir o guia.
Busca limitada a256KiB e timeout8s; abort/stale protection na troca/fechamento;
no Android fetch nativo existente pode bufferizar a pequena resposta antes
do limite pós-leitura, portanto não prometer limite rígido de RAM de transporte.
Horários UNIX válidos, ordenar/deduplicar, até12 itens, texto/base64 UTF-8
com limites; descartar intervalos inválidos/passados. Não inventar programa
atual em lacunas; distinguir 'Agora' e 'A seguir', horários locais.
Atualizar a cada60s somente aberto, sem consultas ao iniciar/instalar.

Painel se refere sempre selectedChannel, nunca à categoria navegada. Área
nativa permanece descoberta e sem remontar o player; guia cobre abas/listas
até rodapé da página. Back/Escape primeiro fecha guia (após fullscreen, quando
aplicável); foco retorna ao botão, listas retomam scroll/filtro anteriores.
Botão aria-expanded/controls, região nomeada, carregamento status; animação
respeita preferência de movimento reduzido. Sem dados inventados em fallback.

## Aceitação

Testes significativos: parser UTF-8/base64/tempo/lacuna, fonte revogada/versão
incompatível/ID inválido, endpoint correto e sem rede se fonte indisponível;
timeout/abort/resposta excessiva. Browser real com fixtures de serviço: abrir,
fechar, Back, preservar scroll/canal, troca/retorno, curtas/320/390/411px,
erro/ausente/retry/reduced-motion/resize amplo e sem overlap/overflow.
Build com lock obrigatório; assinatura e assets byte a byte; update-r sem
apagar dados nos três alvos anteriores. S24: guia real e resposta sanitizada
(somente status/contagens/horários; sem payload EPG/URL/credenciais em logs).
Relatar fielmente se fonte não fornece grade ou apenas fonte incompatível.

Referência técnica primária de implementação do protocolo:
[XtreamCodesApi.java](https://github.com/zGrav/xtream-iptv-player/blob/master/src/main/java/Network/XtreamCodesApi.java)
usa get_short_epg por stream_id e timestamps; não certifica disponibilidade
ou correção da grade enviada pelo provedor do usuário.

## Emenda prévia — stream M3U em CDN e ID sem extensão

Conferência read-only no S24: metadata SOURCE_READY/ACTIVE/MANAGED/M3U,
versão do store coincide, playlist get.php com conta; stream selecionado
tem outra origem, três segmentos de caminho (conta/conta/ID), ID numérico
sem extensão. Apenas booleanos foram registrados; nenhum segredo/URL/ID.
Primeira regra de extração rejeitava essa variante legítima. Permitir ID
numérico com extensão ts/m3u8 opcional; para M3U get.php, CDN distinta é
aceita SOMENTE com username/password do caminho coincidentes com a conta
da playlist segura autorizada, esquema HTTP(S). API permanece na origem
provisionada, nunca é derivada da CDN. Conta diferente continua bloqueada.
Não mudar playback/importador/runtime provider/autoridade. Atualizar fixtures
positiva CDN/sem extensão e negativa conta divergente antes de nova entrega.
