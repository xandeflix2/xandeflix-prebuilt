# Diagnóstico de restabelecimento da entrega HTTP — antes dos testes

Pedido atual: concluir funcionamento e identificar o que quebrou. Correção de isolamento gerada em APK1.0.53 e migrada no tablet/Fire; isso não resolveu o HTTP403 de um filme novo. Concluir só tablet/Fire por decisão expressa do usuário; celular adiado.

Investigar a recusa com evidência da VM e testes sequenciais do fluxo normal. Não inferir que HTML Cloudflare seja necessariamente desafio, bloqueio geográfico ou problema de cache. Observar códigos/semântica genérica dentro da VM, sem exportar corpo, URL, credenciais ou IDs de sessão.

Autoriza-se neste diagnóstico testar HTTPS no mesmo hostname configurado, somente na porta HTTPS declarada pela própria API da fonte, preservando caminho e parâmetros. Validar primeiro a API HTTPS com TLS normal e a conta ativa correspondente. Não enviar credenciais a outro hostname, ignorar certificado, forjar Host/Referer/cookies, trocar conta, contornar autorização/C9 ou instalar outro player. Não alterar configurações persistentes da fonte, backend ou APK neste diagnóstico.

Se a API HTTPS do mesmo host for válida, experimentar uma única abertura de mídia pelo próprio botão e fluxo normal de autorização/C9, mudando somente esquema/porta da URI previamente comparada ao host da fonte. O interceptor deve restaurar-se automaticamente depois do único uso e no encerramento. Resultados diferentes podem fundamentar uma correção mínima posterior, especificada antes de código; ainda não são autorização para alterar arbitrariamente os arquivos protegidos ou produzir outro APK.

JDI usa forwards próprios, evento com suspensão somente da thread correspondente, finally de retomada/dispose. WebView/CDP temporário com deadlines e remoção de forwards próprios, inclusive em falha. Instrumentação e sua latência não são medição de desempenho. Interromper mídia antes da próxima tentativa, sem sessões concorrentes de teste.

Escritas deste diagnóstico: somente esta nova pasta de evidências e helpers; nenhum produto, Git, configuração de aparelho ou fonte. Chamadas normais de autorização e sessão do aplicativo continuam possíveis durante testes autorizados.

## Adendo — 05/11, após comprovação do filme no 5G

O filme produziu primeiro quadro e avanço usando a mesma URI/cabeçalhos; o episódio ainda recebeu 302 no host da fonte seguido de 403 HTML Cloudflare em outro host. Investigar HTTPS somente no destino exato fornecido pelo redirecionamento da própria mídia. Primeiro usar HEAD sem seguir redirects, mantendo a requisição atual em RAM; aceitar somente Location HTTP absoluto/relativo, sem userinfo, e não inventar hostname, token, cookies ou cabeçalhos. O teste HTTPS preserva host, caminho, query e porta explícita (porta HTTP padrão passa ao padrão HTTPS), TLS normal e sem redirects automáticos. Nenhuma credencial da API será enviada ao hostname anunciado apenas em server_info. Classificar apenas status/TLS/tipo, sem exportar Location ou corpo. HEAD positivo não certifica reprodução. Qualquer tentativa de player posterior exige novo clique normal e C9, validação do contexto ainda atual e interceptor de uso único com restauração automática; não executar diretamente um payload antigo nem alterar configuração persistente.

HEAD no endereço original respondeu 200 sem Location, portanto não demonstrou a rota GET. Alternativa limitada: no ponto da exceção GET real, usar a URL final da resposta OkHttp (cadeia 302/403) dentro da VM para uma única consulta HTTPS GET Range bytes=0-0 com o User-Agent já utilizado, TLS normal, redirects desativados e timeouts de 8s. Ler somente código/cabeçalhos e desconectar sem ler corpo. Exportar apenas classificações, nunca URL. Não promover esse teste a configuração nem a autorização de reprodução.
