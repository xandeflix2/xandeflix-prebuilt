# Diagnóstico adicional do HTTP 403 — 05/11/2026

O pedido real de episódio foi aceito pelo player, recebeu **302 para outro host e terminou em HTTP 403 com conteúdo HTML identificado como Cloudflare**, em vez de vídeo. A cadeia foi observada no objeto de resposta OkHttp/Media3 do tablet. Isso localiza a recusa na cadeia HTTP, antes do primeiro frame; não demonstra qual regra, conta, configuração ou serviço a causou. Não foi confirmado desafio JavaScript, bloqueio geográfico ou limite de conexões.

## Evidências e limites

- `TABLET_HTTP_EXCEPTION_DETAILS.log`: resposta 403, corpo de 16.791 bytes; cabeçalho Server classificado como Cloudflare, Content-Type text/html e presença de cabeçalho Cloudflare Ray. Cadeia completa final→inicial: 403 em host diferente, precedido por 302 no host original, sem mudança de esquema. Não exportados host, URL, credenciais, Ray ID ou corpo.
- Os classificadores de frases de desafio, Turnstile, Error 1020, cookies e JavaScript foram negativos. Portanto, não atribuir especificamente a falha a um desafio Cloudflare nem sugerir contorno como correção comprovada.
- `TABLET_EPISODE_REFERENCE.json`: resposta atual de detalhes de série obtida; 24 episódios; correspondência única do episódio examinado; extensão declarada e solicitada MP4; nenhuma referência alternativa nos campos examinados. Configuração/vínculo estáveis na comparação. Sem referências privadas no documento.
- `TABLET_SOURCE_RESIDUE.json`: todos os dois snapshots de nomes seguros foram examinados; ambos têm mesma identidade lógica/versão da fonte ativa; nenhum staging. Não foi fornecida a identidade histórica da fonte de teste. Isso não certifica todos os caches nem prova que nunca houve resíduos, mas não sustenta atribuir esse 403 a um snapshot de outra fonte.
- `TABLET_TRANSPORT_HINTS.json`: configuração e protocolo preferido HTTP; a API anuncia HTTPS em outro host. Não foi reescrita a URL nem testada mudança automática de protocolo/host; o anúncio não comprova que o mesmo arquivo esteja disponível por outra rota.
- `TABLET_HTTP_PROBE_PLAYBACK.json`: erro nativo HTTP 403 / Media3 2004 / DATASOURCE_OPEN, sem duração ou avanço. Instrumentação pode acrescentar latência; não é medição de desempenho de produção.

A comparação anterior está fechada em `../CONNECTION_RECOVERY_20261104/CURRENT_USB_20261105/REPORT.md`: um filme idêntico reproduziu nas versões 1.0.37 e 1.0.52; o mesmo episódio, com URI e headers iguais, recebeu 403 nas duas. Não se conclui que todos os filmes funcionem ou que o aplicativo esteja integralmente recuperado.

## Método e preservação

Observação temporária do aplicativo próprio depurável via WebView/CDP e JDI/JDWP. O código classifica cabeçalhos e corpo dentro da VM do dispositivo e exporta somente booleanos, tamanhos e códigos; não extrai bytes do corpo ou strings privadas para logs. A thread do evento foi retomada e a conexão JDI descartada. Os forwards próprios foram removidos, observadores/listeners e referências privadas em RAM foram limpos em `TABLET_OBSERVER_CLEANUP.json`.

Sem modificação do APK, instalação, limpeza de dados, alteração de fonte, licença, identidade, backend ou Git neste diagnóstico. A correção de isolamento de troca de fonte é outro trabalho, em `../SOURCE_SWITCH_ISOLATION_20261105`; ela não é declarada solução desse 403 sem teste bem-sucedido da mesma mídia.

## Continuidade necessária

O responsável pela fonte/CDN precisa verificar a recusa na cadeia de entrega desse conteúdo com seus próprios registros e autorização. Um estado de conta Active não comprova acesso a cada arquivo VOD. Manter testes sequenciais para não confundir sessões concorrentes. Após corrigir legitimamente o acesso, repetir o mesmo episódio pelo fluxo normal e comprovar primeiro frame, duração e avanço; não substituir isso por resposta da API de catálogo.

Incidentes auxiliares: uma consulta posterior tentou esperar um processo já encerrado e retornou identificador desconhecido; a enumeração contínua `adb jdwp` foi interrompida normalmente pelo executor. Esses eventos não alteram a evidência HTTP. Nenhum processo alheio foi encerrado.

```text
HTTP_CHAIN=302_THEN_403_DIFFERENT_HOST_SAME_SCHEME
FINAL_RESPONSE=HTML_CLOUDFLARE_CLASSIFIED
SPECIFIC_BLOCK_RULE=NOT_PROVEN
JAVASCRIPT_CHALLENGE=NOT_CONFIRMED
OTHER_SOURCE_SNAPSHOT_IN_EXAMINED_SET=NOT_FOUND
ALL_HISTORICAL_CACHES_CERTIFIED=NAO
PLAYER_FIRST_FRAME=NAO
HTTP403_FIXED=NAO
SOURCE_CODE_MODIFIED_BY_THIS_DIAGNOSIS=NAO
RESULT=HTTP_DELIVERY_REFUSAL_LOCALIZED_RECOVERY_PENDING
```
