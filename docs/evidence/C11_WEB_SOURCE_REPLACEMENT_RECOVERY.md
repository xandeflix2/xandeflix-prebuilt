# C137 - evidencia de diagnostico da troca de fonte web - 2026-10-17

Spec previa: docs/architecture/C11_WEB_SOURCE_REPLACEMENT_RECOVERY.md.
Pedido: fonte de teste expirou no navegador PC; usuario relata ter substituido
por fonte ativa sem recuperacao do sinal. Binding/estado real nao observados.

## Verificacao read-only

- Auditoria C136 inicial PASS, baseline C137 capturada antes de novos registros.
- CUA retornou apps=[] e browsers=[]; nao ha acesso direto a aba ativada.
- AuthorizedSourceResolver consulta metadata remota; nao mantem cache de binding
  nesse adaptador. O boot compara sourceId/sourceVersion com o ativo local e
  solicita entrega autorizada quando falta registro ou a versao diverge.
- Atualizacao manual em Fonte e catalogo chama o coordenador existente com
  checkContent=true, independente do cooldown do agendador. Fonte vinculada
  difere de fonte em uso ate promocao bem-sucedida. O botao pode adiar durante
  reproducao/Cast/modal, app oculto/offline ou fora de Settings.
- AutomaticSourceRefresh usa intervalo de sucesso15min e retry minimo1min.
  Adia em Live/detalhes/playback, sem interromper sinal. Boot autorizado tambem
  reconcilia troca de configuracao, independentemente do cooldown de conteudo.
- Configuracao de contexto efemero nao explica sozinha uma troca permanentemente
  parada: playback de referencias indiretas solicita forceRefresh quando ja
  havia contexto. Referencias diretas M3U dependem da geracao local importada.
- Expiracao da conta do provedor e expiracao da licenca do app sao fronteiras
  distintas. Troca de binding nao concede renovacao de licenca. Nenhuma dessas
  expiracoes foi confirmada remotamente para o caso relatado.

## Testes existentes executados novamente

Logs privados em tmp/c137-web-source-replacement:

- boot-tests.log:15/15 PASS, incluindo versao5->6 com promocao e licenca
  invalida sem importacao.
- source-status-tests.log:8/8 PASS, incluindo identidade/versao divergentes,
  status remoto negado/offline, atualizacao manual e barreira de promocao.
- web-store-tests.log:9/9 PASS, cofre WebCrypto/IDB com entrega autorizada,
  persistencia e rejeicao de adulteracao/ausencia de chave.
- automatic-refresh-tests.log:19/19 PASS, importacao e digest local,
  falha preserva ativo, cooldown/backoff/singleflight e deferimento por UI.

Total51 casos sinteticos PASS; nao comprovam sinal, credenciais, CORS, codecs
nem binding deste dispositivo real. Nenhum teste foi alterado. Telemetria de
tempo sintetico nao e metrica de desempenho do aparelho nem SLA.

## Estado e dependencia

Solicitado no mesmo navegador: Conferir fonte, informar ID/versao em uso e
vinculada, executar Atualizar catalogo e informar a mensagem. Sem URL/senha/
token. Resposta pendente nesta etapa. Primeira fronteira real ainda nao
identificada; sinal restabelecido NAO confirmado. Nenhum fix especulativo,
build, instalacao, limpeza de dados, reset, nova ativacao ou escrita remota.
Codigo de producao/testes e APK anteriores preservados pela auditoria C137.

## C137 - confirmacao do usuario e encerramento - 2026-10-17

Em resposta ao procedimento Conferir fonte / Atualizar catalogo no mesmo
navegador PC, usuario confirmou "DEU CERTO". Recuperacao do sinal confirmada
pelo usuario apos atualizacao manual; nao foi observacao instrumentada do
agente. Pendencia operacional anterior encerrada por esse relato. IDs/versoes
e etapa exata da falha anterior nao foram enviados; nao atribuir causa-raiz
conclusiva a cache, CORS ou licenca. Nenhuma alteracao funcional foi necessaria
neste ciclo; demais dispositivos, ativacao e APK preservados. Os51 testes
sinteticos anteriores permanecem evidencia separada. Preflight repetido:
clone ativo/main/origin esperado, HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d,
proveniencia dirty conhecida; allowlist documental C137 mantida.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/build/backend/install/reset.
