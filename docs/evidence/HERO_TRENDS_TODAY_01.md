# HERO-TRENDS-TODAY-01 — especificação anterior ao código

Autorização: pedido atual do usuário para que apenas títulos classificados em Tendências Hoje pelo TMDB e listados no catálogo ativo da fonte apareçam nos heroes de Home, Filmes e Séries. O usuário esclareceu que “disponível” significa listado pela fonte, não reprodução HTTP comprovada. Esta execução não altera mídia, fonte, backend ou o restante dos carrosséis.

## Contrato funcional

- Home segue a ordem de `/trending/all/day`, excluindo pessoas. Filmes usa `/trending/movie/day`; Séries usa `/trending/tv/day`. Cada página limita o tipo mostrado.
- Consultas usam somente metadados públicos do TMDB, com credencial pública já configurada no aplicativo. Resultados são limitados, atualizados em memória por janela horária e não carregam URL ou credencial da fonte.
- Cruzar cada item do ranking com filmes/séries do snapshot local ativo. Identidade TMDB explícita tem prioridade. Sem ID, exigir título normalizado inequívoco e ano compatível quando informado. Conflitos são omitidos.
- Ler segmentos locais cooperativamente, um de cada vez, com cancelamento e verificação de snapshot. Uma fonte alterada não pode reaproveitar seleção da fonte anterior.
- Não incluir títulos apenas por popularidade, ano, importação, atualização de episódios ou TMDB isolado. Sem resultado comprovado, mostrar estado vazio claro; nenhuma seleção antiga ou aleatória como fallback.
- A lista local comprova somente presença no catálogo. Um 403 posterior continua possível e deve seguir o tratamento de erro existente.
- Respeitar filtros parentais e elegibilidade de imagem já aplicados pelo HomeHero. Preservar seleção, foco, D-pad, toque, autoplay do hero e navegação existentes.

## Allowlist estrita

Código: novo `src/catalog/daily-trending-hero.service.ts`; `src/ui/hooks/useHomeHero.ts`; `src/ui/components/HomeHero.tsx` somente estado de preparação/vazio. Testes: novo `scripts/test-daily-trending-hero.mjs`; `scripts/test-c11-home-hero.mjs` e `scripts/test-c11-browse-dynamic-hero.mjs` somente expectativas que contradizem o novo contrato; `scripts/test-canonical-regression.mjs` somente registro estrito do recibo e, se necessário, inclusão da nova suíte sem remover negativos. Governança: este arquivo, novo recibo, apêndice no contrato de expansão e memória STATUS/EVOLUTION/ERRORS. Nenhum outro código autorizado.

## Aceitação

Casos positivos: ordem TMDB preservada, Home misto, páginas por tipo, item em segmento além do primeiro fold, identificação por ID e título/ano, atualização diária/horária, troca de fonte. Negativos: pessoa, item fora da fonte, ID conflitante, título ambíguo, ano diferente, falha/ausência de credencial, snapshot trocado, resposta tardia e ausência de fallback antigo. Testar TypeScript, C11, verificador canônico e regressão integral. Não instalar ou publicar APK automaticamente neste gate; avaliação física pode ser preparada após os testes.

Gate anterior LIVE-AUTO-RECOVERY-01 permanece preservado. Sem commit, push, PR, Supabase, alteração de player, backend ou fonte. O resultado técnico do executor não substitui revisão independente.

## Mudança de requisito durante a validação — 18/11/2026

Após a implementação acima, o usuário esclareceu que o título exibido no hero **precisa poder ser assistido**, mesmo quando já consta do catálogo da fonte. Isso substitui o critério de aceitação descrito no primeiro parágrafo desta especificação. A seleção implementada comprova somente a presença no catálogo local; ela não comprova que o servidor de mídia aceitará a abertura, como demonstrado pelos HTTP 403 anteriores em títulos listados.

O gate não atende ao requisito atualizado e não deve gerar APK para instalação nem ser declarado concluído. Os recibos anteriores permanecem como registro fiel do escopo inicialmente autorizado; não são reescritos para fingir que validaram reprodução. O resolvedor atual não faz requisição de mídia. Não usar HEAD, `streamId`, manifesto HLS ou aceitação da Activity como prova de primeiro quadro. Uma verificação futura exigirá contrato de transporte equivalente ao player, correlação de fonte/conta/rede/edição e expiração, com orçamento de requisições e cancelamento comprovado. A disponibilidade continua temporal: mesmo uma reprodução bem-sucedida não garante acesso futuro. Nenhuma sondagem de mídia ou integração de disponibilidade foi iniciada nesta execução.
