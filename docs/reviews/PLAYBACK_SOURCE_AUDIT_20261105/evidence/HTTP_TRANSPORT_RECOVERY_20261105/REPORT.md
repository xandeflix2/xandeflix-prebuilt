# Entrega de mídia — atualização de 05/11/2026

Resultado: **PLAYBACK_PARTIAL_PROVIDER_HTTP403_UNRESOLVED**. O tablet reproduziu um filme no 5G antes e depois da limpeza local. Dois títulos de séries e um filme no Fire ainda receberam HTTP403. Não declarar funcionamento integral, homologação ou causa exata da política do provedor.

## Evidências atuais

- `TABLET_5G_MOVIE_PROOF.json`: clique normal/C9 às 17:27:59Z, mesma URI e mesmos cabeçalhos retidos em RAM do teste anterior, FIRST_FRAME, READY e posição crescente. A mudança de rede relatada pelo usuário coincidiu com sucesso; tempo/estado do servidor também mudaram, portanto não foi provada causalidade exclusiva da operadora anterior.
- `TABLET_5G_SERIES_HTTP.log`: GET real retornou 302 no host configurado e 403 HTML Cloudflare no destino, sem mudança de esquema. Não demonstrou desafio de navegador, erro 1020, bloqueio geográfico ou limite de conexões.
- `TABLET_5G_SERIES_HTTPS_TARGET.log`: no ponto da exceção real, somente esquema da URL final foi trocado em RAM para consulta HTTPS GET Range0-0; TLS normal, sem seguir redirects, sem ler corpo; resposta403 HTML. Não houve mudança persistente ou bypass de certificado. O primeiro HEAD original havia retornado200 sem Location; isso não comprovou a rota GET.
- `TABLET_TLS_DETAIL.json`: HTTPS da API no mesmo host configurado falhou com SSLHandshakeException e indicação de trust anchor. Não se provou certificado expirado ou hostname incorreto. Nenhuma credencial foi enviada nesse teste anônimo fracassado. Não enviar credenciais da API ao outro hostname apenas anunciado em server_info.
- `FIRE_5G_MOVIE_RETRY_FOLLOWUP.json`: segundo clique no Fire, HTTP403/Media32004/DATASOURCE_OPEN. A primeira tentativa retornou sem erro explícito e o aparelho foi observado no screensaver; não é prova de falha de mídia nem de reprodução.
- `TABLET_AFTER_CLEAN_MOVIE_PROOF.json`: após exclusão e importação integral, DATASOURCE_OPEN_SUCCESS, FIRST_FRAME, READY, duração positiva e avanço. Áudio audível não foi homologado.
- `TABLET_AFTER_CLEAN_SERIES_PROOF.json`: outro card de série, 86 botões de episódio disponíveis; clique normal/C9 às17:41:46Z, HTTP403 às17:41:52Z, sem primeiro quadro. O diagnóstico colado pelo usuário às17:41:52.553Z corresponde a esta tentativa.
- `TABLET_AFTER_CLEAN_EPISODE_REFERENCE.json`: nova consulta get_series_info, 146 episódios totais, uma correspondência do episódio escolhido, MP4 declarado/solicitado, sem referência alternativa publicada nos campos examinados.
- `TABLET_AFTER_CLEAN_REQUEST_BINDING.json`: origem, usuário, senha, posição do episódio e extensão da requisição coincidem com a fonte/conta e a resposta atuais, comparados exclusivamente em RAM. Sem valores privados exportados.
- `TABLET_AFTER_CLEAN_ACCOUNT.json`: conta Active/AUTHORIZED, 0/2 conexões informadas e vínculo estável. A lista m3u8/ts de formatos não prova indisponibilidade de MP4/VOD; um filme MP4 reproduziu. Metadata de conta não comprova direito/acessibilidade de cada título.

## Limpeza local solicitada

Executada somente no tablet e documentada em `../TABLET_SOURCE_CLEANUP_20261105`. Catálogo físico anterior e cache artwork foram removidos, cinco chaves de metadata limpas, nova importação ativa com um único snapshot REAL e staging vazio. Identidade, chave, instalação, campos de licença e autorização foram comparados e preservados. Há ressalvas explícitas sobre epoch novo e verificação de dados pessoais no `OBSERVATION_NOTE.md`; preservar o resultado parcial do helper, sem convertê-lo em PASS.

## Versão e limites

Tablet e Fire foram atualizados em operação anterior desta mesma correção para1.0.53/code53, APK SHA256d849a27e0106006b324ea86b320909b455b11c92c774967b1189b3f8900e1caa. O bundle index-CaKLtAjp.js pertence ao artefato auditado. `APP_VERSION=1.0` é literal do formato atual de playback-support-diagnostic.ts, não leitura da versão Android. Não alterar o APK apenas para mascarar esse campo nesta investigação.

O celular ficou adiado por decisão do usuário. Não usar o outro Fire Wi-Fi como se fosse o mesmo aparelho. Não houve nova instalação/build, alteração de produto, configuração persistente da fonte, conta, Supabase administrativo, licença, certificado, player ou Git neste diagnóstico. As chamadas normais de autorização/C9 do aplicativo foram mantidas. Todos os observadores temporários foram removidos, JDI desconectado e lista de forwards ADB vazia às17:45Z. Nenhuma URI/credencial/corpo HTTP privado foi persistido.

## Conclusão operacional

Há comprovação de catálogo fresco e filme reproduzindo no tablet. A falha restante observada é recusa HTTP na abertura da mídia fornecida pela fonte, inclusive com referência conferida na API atual. O próximo responsável precisa verificar a entrega VOD/séries, o redirecionamento/CDN, a disponibilidade dos arquivos e a regra de acesso da conta com o administrador do provedor. Não foi provado qual desses fatores determina o403. Reinstalar, limpar Supabase, modificar codecs ou inventar headers/extensões não constitui correção demonstrada.

Incidentes auxiliares: consulta CDP inline com escape incorreto falhou antes de ação, substituída por helper; leituras de caminhos inexistentes corrigidas após inventário rg; VM emitiu linhas `Ignoring cmd` sem valores privados. Nenhuma dessas ocorrências foi usada como causa do erro de produto. Testes HTTPS foram especificados em adendos antes da execução.
