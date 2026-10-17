# C108 — investigação de reprodução na Itália — 2026-10-14

## Relato e limite da evidência

Usuário informa que um aparelho na Itália abre o player, mas nenhum conteúdo
reproduz. Confirmou falha em todos os conteúdos. Modelo, código XF, versão/bundle
e diagnóstico de uma tentativa ainda não foram recebidos; usuário respondeu
“ok” ao pedido de coleta. Não houve acesso ao aparelho/rede italiana, teste de
transmissão nesse local ou alteração de fonte. O HTTP401/Media3 2004 relatado
em 12/10 por outro aparelho não constitui evidência para este caso.

## Inspeção efetivamente realizada

- DirectStreamResolver resolve a mídia com a referência/local source context,
  sem condição de país, idioma ou fuso. Headers aprovados seguem para a fonte.
- NativePlayerActivity usa Media3/OkHttp device-to-source; DNS do sistema
  primeiro, redirects HTTP/HTTPS habilitados, connect15s/read20s. ResilientDns
  consulta resolvers públicos apenas como fallback da resolução. Nenhum IP
  brasileiro fixado nem teste de localização encontrado nesse caminho.
- Manifesto tem INTERNET e ACCESS_NETWORK_STATE, touchscreen/leanback opcionais,
  e política HTTP configurada; não há seleção de país no manifesto. APK de teste
  é com.xandeflix.prebuilt/minSdk23. Instalação e disponibilidade da fonte são
  fronteiras distintas; o player abrir já indica instalação/entrada na tela,
  não prova acesso à mídia ou recebimento do primeiro byte/frame.
- HTTP status e Media3 errorCode/checkpoint são projetados pelo diagnóstico
  existente. UI permite Copiar diagnóstico e envio explícito ao gestor. Não
  requisitamos URLs, senhas, tokens, playlist ou dados do catálogo.
- Busca textual específica por bloqueio geográfico em src, Android e funções
  do projeto não encontrou uma regra de país. Isso não audita as regras da
  infraestrutura/provedor externo nem prova acesso internacional à fonte.

## Como concluir o diagnóstico

1. Repetir uma tentativa nesse aparelho; após o retorno do player, usar Copiar
   diagnóstico. Solicitação pendente: texto XANDEFLIX_PLAYBACK_DIAGNOSTIC_V1,
   modelo e código XF. O bundle identifica o código efetivamente instalado,
   pois o campo legado APP_VERSION do relatório é fixo e não distingue builds.
2. HTTP401 aponta falha de autenticação; HTTP403, recusa do servidor. Nenhum
   dos dois comprova geobloqueio. É necessário verificar no provedor a permissão
   internacional da conta, limites de conexões/IP e o evento correspondente.
3. Media3 2001/2002 aponta conexão/timeout. Distinguir DNS, TCP, TLS e resposta
   com a evidência disponível; comparar, no próprio aparelho, outra conexão
   autorizada (por exemplo Wi-Fi e dados móveis). Não presumir que DNS/TLS ou
   timeout maior resolveria o problema sem dados.
4. Erro de decoder/parser requer modelo, versão e código do erro, não uma
   alteração geográfica. Um conteúdo público autorizado no mesmo player pode
   separar incompatibilidade/transportes do acesso à conta do provedor.
5. Se confirmado bloqueio do provedor, utilizar a liberação oficial ou uma
   fonte autorizada com atendimento à Itália. Não introduzir proxy central,
   troca de credenciais, bypass de licença ou desativação de validação TLS.

Referências primárias consultadas: [Media3 PlaybackException](https://developer.android.com/reference/androidx/media3/common/PlaybackException),
[Media3 troubleshooting](https://developer.android.com/media/media3/exoplayer/troubleshooting)
e [HTTP Semantics, RFC9110, seções15.5.2/15.5.4](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.2).

## Verificações locais

- scripts/test-c11-playback-support-diagnostic.mjs: 8 grupos PASS, incluindo
  HTTP/Media3/checkpoint reais em fixtures, campos fechados e ausência de secrets.
- scripts/validate-direct-playback.mjs: 12 grupos PASS com catálogo/contexto
  sintéticos; resolução direta, bridge, rejeições e sanitização. Não equivale
  a reprodução real nem foi executado a partir da Itália.
- Nenhum código de playback/transporte/source, backend, DNS, certificado,
  autorização ou credencial modificado. Investigação remota permanece aberta.

ITALY_PLAYBACK_CAUSE=UNCONFIRMED_PENDING_DEVICE_DIAGNOSTIC
ITALY_PLAYBACK_FIXED=NAO
ITALY_PHYSICAL_OR_REMOTE_TEST=NAO
NO_COUNTRY_GATE_FOUND_IN_REVIEWED_PLAYBACK_PATH=SIM
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; GIT_WRITES=NAO.
