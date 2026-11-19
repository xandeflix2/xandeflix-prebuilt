# CANON-01-TMDB-RELEASE-TAGS — evidências

# CANON-01-TMDB-RELEASE-TAGS — especificação anterior ao código

Pedido explícito atual e imagens Mayday4K [DV][HDR] autorizam correção genérica da identidade TMDB e apresentação interna de filmes. Root/L1 e recebido fechado ficam congelados; nova emenda local, sem Git/admin/deploy, versão, native/bridge/player/C9/buffer ou fonte/importador/catálogo/credenciais/controle parental.

Causa lida no serviço real: normalização atual remove4K mas deixa DV/HDR, consulta Mayday DV HDR e seletor conservador rejeita o título. Todas as chamadas de card/hero/detalhes/trailer/provedores/semelhantes usam a identidade compartilhada. Corrigir aí, independentemente do servidor/painel. Não alterar URL de reprodução nem nome/ID no catálogo assinado.

Normalização limitada200 caracteres, NFKC/espaços invisíveis, apenas marcadores técnicos conhecidos: resolução4K/8K/UHD/FHD/HD/SD/2160p/1080p/720p, DV/Dolby Vision/HDR/HDR10+/HLG, codecsH.264/H.265/x264/x265/HEVC/AV1, áudio/idioma e formatos usuais. Retirar grupos técnicos completos []/()/{} e sufixos/prefixos explicitamente separados; não apagar palavras arbitrárias entre colchetes. Preservar títulos significativos, acentos, pontuação, números,4x4/10x10/1917/F1/Blade Runner2049/[REC], palavras que só contêm letrasHDR/DV/HD e letraL genuína. Marcadores[L]/(L) terminais continuam regra anterior; ano explícito da fonte ou delimitado extraído separadamente, sem confundir2049 com ano de lançamento. Ambiguidade continua indisponível, sem relaxar título/ano/tipo/ID/poster/contexto/limites/credenciais.

Metadado opcional passa a incluir título público localizado confirmado pelo TMDB,200 caracteres e allowlist na cache persistida. Na página interna de filme usar esse título quando confirmado, fallback ao nome normalizado. Dados source-first restantes e IDs/handlers/history/playback originais preservados. Campo novo opcional compatível com cache antiga; manter512 entradas/TTL/concorrência2 e cache Match7, sem purge global, download integral ou reimportação. Identidades de nomes corrigidos naturalmente diferem das chaves antigas comDV/HDR, incluindo miss/backdrop; nunca copiar associações ambíguas.

Testes novos reais com fixtures, antes/depois: limpeza genérica/Unicode/grupos/idioma/anos e preservação semântica; busca envia somenteMayday, tipo/ano/poster selecionam candidato correto; homônimo e poster errado continuam rejeitados; misses antigos não prendem nome reparado; warm cache mantém título localizado em allowlist e sem propriedades privadas; queries limitadas e erro transitório não vira miss. Novos testes obrigatórios na suíte29 e runner com176 controles anteriores preservados e três negativos de recibo/mutação. RED esperado deve ser registrado como exit1, não baseline quebrado nem PASS.

Baseline atual verificado por hashes e regressão176/28 real do último ciclo com origem explícita; fresh canon:check/C11 antes do patch. Depois canon:check/test/C11/typecheck/build, cenário29 novo, browser do MovieDetail real com portas simuladas e API pública TMDB autenticada limitada aos exemplos sem logs de credencial/URL da fonte; documentação oficial search/movie e search-and-query-for-details. Gerar APK universal mesma versão/assinatura com registro oficial3 plugins, testes Android e auditoria. Continuidade dos testes in-place autorizados: tablet SM-X610 para conferir Mayday, sem uninstall/reset/PIN/PUK/dados; comparar privados em RAM e persistir só booleanos. Fire/celular não são reinstalados automaticamente nesta demanda de exemplo do tablet. Se necessário por nova evidência, documentar a alteração do escopo antes de qualquer patch.

Allowlist11 fechada:
- src/artwork/tmdb-metadata.service.ts
- src/ui/pages/MovieDetailPage.tsx
- scripts/test-tmdb-release-tags.mjs
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-TMDB-RELEASE-TAGS.json
- docs/architecture/TMDB_RELEASE_TAGS.md
- docs/evidence/TMDB_RELEASE_TAGS.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Auth SHA256 UTF-8/LF 847adabb8663f59d0bf23c8ad47c4b1a6c24ded108471cad13a92d77d34a790b; transcrição, não assinatura humana. Recibo32 com predecessores reais,31 anteriores intocados; normativos append-only. Não iniciar outra implementação.

## Pedido

```text
Na lista atual, há uma categoria denominada UHD 4K. Os filmes que estão listados nessa categoria aparecem com algumas inscrições depois do nome como 4K e entre colchetes aparece DV e HDR. Por causa disso, não está sendo possível fazer a leitura dos metadados referente ao filme quando aberto a página interna de cada categoria. Preciso que, independente da URL fornecida no painel do gestor, todo nome de filme considere apenas os nomes relevantes ao filme que é extraído da API do TMDB, ignorando qualquer tipo de caractere que atrapalhe o carregamento dos metadados na página interna.
```


## CANON-01-TMDB-RELEASE-TAGS — registro — 2026-10-24

Pedido atual e allowlist11 documentados antes do patch. Consulta pública real Mayday DV HDR retornouHTTP200/zero resultados; Mayday retornou o filme2026 entre homônimos. Normalizador reparado genericamente e título localizado confirmado disponível no detalhe, sem fonte/IDs alterados nem purge global. Nova suíte29 testa rótulos/Unicode/anos/subtítulo/números/contexto/poster/cache/privacidade;31 recibos intactos. Auth SHA256 847adabb8663f59d0bf23c8ad47c4b1a6c24ded108471cad13a92d77d34a790b. Baselinefresh canon/check/C11 exit0; referência real176/28 da árvore recebida idêntica.

A primeira tentativa RED tinha erro de sintaxe no próprio novo fixture (apóstrofo), não provava a regressão. Log original preservado RED_HARNESS_SYNTAX; fixture corrigido. RED válido executado depois do patch, contra módulo recebido byte-idêntico congelado, falhou por Mayday DV HDR versus Mayday com exit1. Teste do módulo corrigido passou. Não houve restauração/reescrita do recebido. Validação final/APK/tablet ainda pendentes neste registro. Sem Git/admin/reset/versão ou próxima implementação.

Documentação primária: [Search Movies](https://developer.themoviedb.org/reference/search-movie), [Search & Query for Details](https://developer.themoviedb.org/docs/search-and-query-for-details).


## Revisão nominal anterior ao ajuste do port de teste

Allowlist passa de11 para12 caminhos, incluindo apenas scripts/test-c11-source-first-tmdb-artwork.mjs. Seu mock de módulo não expõe normalizeArtworkIdentity, que MovieDetailPage agora usa. Adicionar a função real já importada ao objeto do port, sem remover ou alterar qualquer asserção. Não tocar testes de visibilidade nem verificador. Primeiro focused passou subtitle/context e falhou composição por TypeError de export ausente no port, não por associação incorreta do produto. Registro canônico falhou CANON_REGRESSION_PLAN_REQUIRED porque requiredTests admite somente SUITES históricas estáticas: manter o plano histórico intacto e declarar novo cenário como comando obrigatório e suíte29 real do runner protegido. Corrigir apenas o recibo32 em andamento, com cópia do rascunho e hash de registro atualizado;31 recibos encerrados intocados. Nenhuma validação oficial final iniciada ainda.


## CANON-01-TMDB-RELEASE-TAGS — encerramento — 2026-10-25

RESULT=LOCAL_READY_TABLET_MAYDAY_CONFIRMED. Regra genérica no normalizador compartilhado retira rótulos técnicos reconhecidos de grupos/prefixos/sufixos e formatação Unicode, preserva nomes significativos, pontuação e números; [L]/(L) terminal mantidos. Ano explícito separado, sem tratar2049 de Blade Runner como lançamento. Mayday4K [DV][HDR] passa a Mayday. A consulta independe do servidor/URL/painel, sem editar fonte, catálogo, IDs, categorias, streams, licença/parental/C9, buffer ou native. Título público localizado confirmado passa à cache allowlisted e à página interna. Cache antiga/Match7/512/TTL/concorrência2 preservados sem purge ou reimportação; misses comDV/HDR não prendem nova identidade.

Antes: tablet real encontrou as variantes Mayday e Mayday4K [DV][HDR]; varianteUHD tinha zero campos de metadados. Poster público /hVXjX1jLZ1ljFSNGXpjJfbTUOa7.jpg corresponde ao filme2026. API pública real retornouHTTP200/zero resultados para Mayday DV HDR. Depois: serviço real corrigido realizou2GETs públicos (search/movie?query=Mayday e movie/1137844), confirmou títuloMayday,2026,1h51min,Ação/Comédia,sinopse209 caracteres e backdrop. Sem URL/credencial da fonte enviados ao TMDB ou persistidos. Tablet atualizado -r preservando11 registros privados/firstInstallTime, mesma assinatura/package; tela real confirmou títuloMayday,ano/gêneros/sinopse preenchidos. Resultado de semelhantes observado: sem mensagem de erro no instante da amostra; não é auditoria completa das recomendações. Sem reprodução de vídeo, nova medição de velocidade/buffer ou estabilidade.

Validação final:5 comandos npm específicos exit0 (canon:check/test,C11,typecheck,build), suíte nova standalone exit0, 179 controles/29 suítes,906 protegidos,32 recibos/31 anteriores íntegros,21 cenários de rede/127 Prebuilt preservados. Android222 testes/37 suítes executados,0 falhas/erros/skips; cap copy/registro oficial3 plugins/C11/assemble offline e auditoria de assets/permissões/assinatura PASS. Não se alega nova execução dos13 comandos L1. Baseline176/28 da execução anterior idêntica documentado com hash real, fresh baseline canon/check/C11 exit0.

Quatro cenários reais de MovieDetailPage/PhoneMovieDetail no Chromium com portas simuladas passaram: normalização→serviço→título localizado/ano/duração/gêneros/sinopse, fonte completa mantém sua sinopse, cliqueAssistir usa ID original e título original permanece no modelo. API/objetos desses cenários são fixtures, não dispositivos. Testes novos incluem homônimos/ano/tipo/poster/privacidade/cache/transiente; todos antigos preservados. Erros de preparação honestos: primeiro RED era SyntaxError do fixture, corrigido; RED válido posterior contra recebido congelado exit1 provou Mayday DV HDR errado. Registro inicial falhou por requiredTests estático; corrigido somente recibo32/registro em andamento, suíte29 obrigatória no runner. MockTSX antigo precisava exportar o normalizador real, uma propriedade adicionada sem alterar assertions. Harness browser teve exports transitivos faltantes, cache warm inesperada para casos cold, erro de quoting no helper e porta DevTools antiga; corrigido somente harness, execuções falhas não são PASS. Notas/logs preservados.

APK Xandeflix-v1.0.37-tmdb-titulos-4k-hdr-20261024.apk, SHA256 e0d3795d2092936e7f6b776b09900fe07e1d562caf95413bbb19e7478a10d201, 11426007bytes; mesma1.0.37/code37/certificado. Somente tablet atualizado neste ciclo; APK universal disponível para instalação manual nos outros aparelhos. Novas regras de TV semCast e demais UI recebidas preservadas. Allowlist12, normativos append-only, root/L1 e recebido congelados, índices vazios e HEAD/main/branch preservados. Auth SHA256 847adabb8663f59d0bf23c8ad47c4b1a6c24ded108471cad13a92d77d34a790b; recibo blobLF 30bcebd64ad85f8d981f09b320cbf3864b6bad7a, SHA256 72b2334e90c10a74eab09c54c3515ea7e81dedbc75ef16dcb293f17080973d01. Sem Git add/commit/push/PR/merge/main, backend/admin/deploy, reset, versão/dependências/manifest/verificador/workflows ou próxima implementação.

Auditoria inicial do APK recusou o exit1 histórico de preparação do recibo; helper original preservado. Correção somente no helper ignorado exige exatamente registered-canon/exit1/CANON_REGRESSION_PLAN_REQUIRED, sua substituição registered-canon-r2/exit0 e todos os demais comandos exit0. Nenhuma falha foi convertida em PASS. Primeira tentativa ADB parou antes de mutação por inventário sem tablet; nova leitura e repetição in-place tiveram sucesso. Primeiro harness de busca após instalar parou em resultado parcial sem a variante UHD, amostra preservada; espera limitada pela variante exata encontrou o registro correto e confirmou metadados. Captura TABLET_MAYDAY_after.png inspecionada visualmente: título Mayday, 2026, 1h51min, Ação/Comédia, sinopse, fundo e lista de semelhantes visíveis. Esses ajustes de observação não alteraram o produto nem relaxaram as verificações.

## Comandos finais

| Comando | Exit code |
| --- | ---: |
| `npm run canon:check` | 0 |
| `npm run canon:test` | 0 |
| `npm run c11:new-device:lock` | 0 |
| `npm run typecheck` | 0 |
| `npm run build` | 0 |

## Observações públicas/privadas preservadas

```json
{
  "api": {
    "publicMetadataOnly": true,
    "sourceCredentialsOrUrlsSent": false,
    "identity": {
      "kind": "movie",
      "title": "Mayday",
      "posterPath": "/hVXjX1jLZ1ljFSNGXpjJfbTUOa7.jpg"
    },
    "result": {
      "tmdbId": 1137844,
      "title": "Mayday",
      "year": 2026,
      "duration": "1h 51min",
      "genres": [
        "Ação",
        "Comédia"
      ],
      "overviewLength": 209,
      "backdropAvailable": true,
      "posterPathMatches": true
    },
    "calls": [
      {
        "path": "/3/search/movie",
        "query": "Mayday",
        "httpStatus": 200
      },
      {
        "path": "/3/movie/1137844",
        "query": null,
        "httpStatus": 200
      }
    ]
  },
  "install": {
    "model": "SM_X610",
    "at": "2026-10-25T05:13:11.497Z",
    "result": "PASS_IN_PLACE_UPDATE",
    "apkSha256": "e0d3795d2092936e7f6b776b09900fe07e1d562caf95413bbb19e7478a10d201",
    "previousApkSha256": "034fe1c2d9aa6cc13cb7a738fe46a740e88dbde8ac9872a611943f4c6a257a0e",
    "packageId": "com.xandeflix.prebuilt",
    "firstInstallPreserved": true,
    "identityPreserved": true,
    "activationKeyPreserved": true,
    "activationPreserved": true,
    "secureSourcePreserved": true,
    "parentalPreserved": true,
    "catalogPointerPreserved": true,
    "allMeasuredRecordsPreserved": true,
    "measuredRecords": 11,
    "privateValuesOrDigestsPersisted": false,
    "reset": false,
    "uninstall": false
  },
  "physical": {
    "model": "SM_X610",
    "mode": "after",
    "privateValuesRead": false,
    "navigation": "NAVIGATED",
    "rows": [
      {
        "label": "Mayday - Filme",
        "title": "Mayday"
      },
      {
        "label": "Mayday (2026) (2026) - Filme",
        "title": "Mayday (2026)"
      },
      {
        "label": "Mayday [L] - Filme",
        "title": "Mayday [L]"
      },
      {
        "label": "Mayday [L] - Filme",
        "title": "Mayday [L]"
      },
      {
        "label": "Mayday 4K [DV][HDR] - Filme",
        "title": "Mayday 4K [DV][HDR]"
      }
    ],
    "selected": {
      "found": true,
      "title": "Mayday 4K [DV][HDR]",
      "sourceTitle": "Mayday 4K [DV][HDR]",
      "posterPath": "/hVXjX1jLZ1ljFSNGXpjJfbTUOa7.jpg"
    },
    "detail": {
      "title": "Mayday",
      "metadata": [
        "2026",
        "1h 51min"
      ],
      "genres": [
        "Ação",
        "Comédia"
      ],
      "overviewLength": 209,
      "relatedError": false
    },
    "result": "NORMALIZED_DETAIL_VISIBLE"
  }
}
```
