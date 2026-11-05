# Comparação estática focal do JavaScript distribuído

Os arquivos foram extraídos dos APKs verificados. Formatação esbuild sem execução do bootstrap; os números de linha abaixo referem-se às cópias `v137-main.formatted.js` e `v152-main.formatted.js`. Os originais minificados permanecem nas respectivas árvores `v137/assets/public/assets` e `v152/assets/public/assets`.

`JS_STRUCTURAL_MATCHES.json` contém candidatos pareados por estrutura AST, propriedades e literais, normalizando a grafia dos identificadores dentro de cada declaração. `JS_SYMBOL_COMPARISON.json` acrescenta conferência de símbolos TypeScript: referências globais devem apontar às declarações pareadas e símbolos locais devem corresponder de forma bijetiva. Isso reduz falsos positivos de minificação; não prova execução, equivalência dinâmica ou igualdade de toda a aplicação.

| Escopo | 1.0.37 | 1.0.52 | Observação |
|---|---|---|---|
| Transporte JS, inicialização/download/chunks/cancelamento | `Dp`, 14900–15005 | `zp`, 14900–15005 | Corpo estrutural e referências estáticas correspondentes; sem divergências ou referências não pareadas nesse corpo |
| Configuração explícita de diretório | `ca`, 15211–15227 | `fa`, 15211–15227 | Mesma validação; M3U precisa ser get.php explícito para derivação |
| URL tipada da mídia | `hy`, 15233–15237 | `Iy`, 15233–15237 | Mesmo host/tipo/usuário/senha/id/extensão; credenciais codificadas por encodeURIComponent |
| Leitura JSON da API | `wh`, 15238–15274 | `Oh`, 15238–15274 | Mesmo limite de 16 MiB e UTF-8 fatal; mesmo tratamento de falha/cleanup |
| Inventário VOD com projeção | `nL`, 15279–15351; `iL`, 15352–15389; `aL`, 15390–15415 | `ND`, `xD`, `OD`, mesmas linhas | Mesmos limites/projeção e referências estáticas |
| Classificação XUI de M3U | `fL`, 15445–15510 | `UD`, mesmas linhas | Mesmas consultas por categoria e limites |
| Importador Xtream/M3U | `CC`, 16809–17091 | `YC`, 16870–17152 | Corpo estrutural correspondente; referência externa de telemetria `yt` não pareada automaticamente. Não declarar equivalência global completa |
| Orquestração de staging | `RC`, 17113–17200 | `XC`, 17174–17261 | Corpo e referências estáticas correspondentes |
| Escolha de modo no boot | `eP`, 17568–17849; seleção em 17770–17778 | `CP`, 17629–17910; seleção em 17831–17839 | Corpo estrutural correspondente; referências externas de autorização/telemetria não completamente pareadas |
| Resolução de mídia para playback | `oP`, 17937–17964 | `LP`, 17998–18025 | Corpo e referências estáticas correspondentes; URI direta tem precedência, default UA IPTVSmarters/1.0 |
| Contextos de fonte Xtream/M3U | `CP`, 18226–18230; `RP`, 18231–18241 | `ZP`, 18287–18291; `QP`, 18292–18302 | Corpos e referências estáticas correspondentes |

## Diferença real no normalizador de episódios

Anterior `h$`, 25652–25682; atual `$M`, 25718–25748:

- Anterior exige `seasons` array; atual aceita array ou objeto usando `Object.values`.
- Anterior rejeita `season_number` repetido; atual conserva a primeira entrada da temporada repetida.
- Anterior exige `episode_num >= 1`; atual aceita zero.
- Anterior exige `season` numérico/string só de dígitos; atual remove não dígitos de rótulos não numéricos antes de comparar à temporada.
- Ambos ainda exigem `season_number` válido no valor da entrada de temporada. A chave do objeto não é fallback para esse campo.
- Ambos validam o lote inteiro. ID inválido/duplicado, `episodes` em formato incompatível, temporada incoerente e outros campos inválidos lançam erro e impedem retorno parcial dos detalhes.

A diferença amplia formatos aceitos no atual, mas a conservação arbitrária da primeira metadata de temporada e a remoção genérica de não dígitos merecem revisão por gate. Não foram comprovadas como causa dos incidentes reais e não explicam, sozinhas, HTTP 403 de filmes.

## Hipótese concreta de compatibilidade de URL, compartilhada

O inventário projetado conserva apenas `stream_id`, `name`, `category_id`, `container_extension`, `stream_icon` e `year`. `direct_source` não faz parte dessa projeção. O importador em modo de diretório monta `directStreamUrl` como `/movie/<usuário>/<senha>/<id>.<extensão>` e o normalizador de episódios monta `/series/...` (anterior 16887/25675; atual 16948/25741).

Isso não significa que a mídia esteja disponível nem que todo provedor aceite essa rota. Se a fonte exigir outra URI de mídia, token, extensão ou cabeçalho, a compatibilidade precisa ser comprovada. O modo M3U pode conservar a URI explícita da playlist. É possível haver diferença de comportamento entre dois dispositivos com a mesma versão, devido a fonte, geração, catálogo e modo de importação diferentes.

Não foi acessado o endpoint privado nem examinada uma resposta real de VOD nesta comparação estática. A ausência de `direct_source` é constatação do código desse caminho; a relação com o 403 do tablet é hipótese, não diagnóstico fechado.

## Limitação do grafo automático

REA analisou uma vez cada árvore. O parsing dos sete JS de cada versão terminou sem erros sintáticos, mas o grafo semântico de cada main excedeu o heap do worker (aprox. 1 GiB). Cobertura parcial foi preservada, sem retry ou aumento de limites. A comparação REA `ev_8a259121344b6335a1f1042277cbc9536836a8c29b92c96219d4f2889aaad10f` reporta 31 mudanças e 92 desconhecidos no escopo parcial; isso não corresponde a 31 defeitos ou regressões. Não inferir adição/remoção pela cobertura incompleta ou pela simples troca de nomes minificados. As conclusões focais acima também se apoiam na leitura direta dos corpos e nas correspondências AST/símbolos, fora do grafo parcial.
