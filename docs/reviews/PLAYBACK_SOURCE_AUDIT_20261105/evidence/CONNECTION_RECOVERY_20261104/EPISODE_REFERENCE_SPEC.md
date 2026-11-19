# Diagnóstico focal de referência de episódio

Baseline atual: filmes reproduzem em ambos os aparelhos; pedido normal de série, após guardas do próprio app e API de detalhes 2xx, falha em DATASOURCE_OPEN com HTTP 403 no tablet / 404 no Fire. Não alterar timeout, URL ou headers do player nesta coleta.

Ler novamente somente os detalhes da mesma série solicitada pelo fluxo normal e autorizada. Selecionar o mesmo ID de episódio a partir da requisição mantida temporariamente em RAM. Usar transporte nativo do próprio dispositivo e configuração selada correspondente ao catálogo. Conferir fonte/versão/snapshot estáveis antes/depois. Limite 16 MiB; cleanup exclusivo do download criado pelo auditor. Não conceder licença, copiar dados de outro dispositivo, buscar mídia ou trocar fonte.

Exportar apenas: sucesso/status/contagem de bytes; formato de temporadas/episódios; presença de campos de URI alternativos e extensão; igualdade com pedido selecionado; correlação da mesma fonte/versão; códigos sanitizados. URI, hostname, credenciais, IDs e nomes privados ficam na memória do aparelho. Preservar erro original e resultado comparativo sem afirmar que alternativa é reproduzível antes de testá-la pelo player normal.
