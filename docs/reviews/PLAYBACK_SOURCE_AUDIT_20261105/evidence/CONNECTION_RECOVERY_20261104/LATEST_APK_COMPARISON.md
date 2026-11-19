# APK fornecido como última geração versus instalações atuais

Conferência dos aparelhos em **05/11/2026, 06:58:58 America/Sao_Paulo** (`2026-11-05T09:58:58Z`). Escopo nominal deste complemento: analisar `C:/Users/Alexandre/Downloads/app-debug.apk` e comparar com os aplicativos instalados. Não instalar, gerar nova build ou modificar produto nesta comparação.

## Conclusão observada

**O tablet já tem exatamente o APK enviado. O celular está na 1.0.37. O Fire USB tem outra compilação 1.0.52, com bytes diferentes.** Isso foi comprovado pelo SHA-256 calculado diretamente nos arquivos `base.apk` instalados, além do PackageManager. A versão textual não basta para identificar essas compilações.

| Alvo | Modelo | Versão / código reais | SHA-256 do APK instalado | Igual ao arquivo enviado? |
|---|---|---|---|---|
| Tablet USB | SM-X610 | 1.0.52 / 52 | `0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29` | **Sim, byte a byte** |
| Celular USB | SM-S926B | 1.0.37 / 37 | `433a60d77669430de4cc09b45db0b3f29760b2578d920d76f60ee9580ce18252` | **Não** |
| Fire USB atual | AFTSS | 1.0.52 / 52 | `f1eb668de79aebd0384424c67a289eea9c5206fa8db901020789f52a8a079358` | **Não, outra build com o mesmo código** |

O usuário informou a troca do Fire Stick. O novo Fire por Wi-Fi usado na noite anterior (`192.168.3.106`) não é o AFTSS USB agora conectado. Os endereços de depuração Wi-Fi anteriores deixaram de responder; o tablet e o celular foram reconectados por USB e identificados novamente. Afirmar que todos os aparelhos continuam na mesma compilação com base no inventário de ontem seria incorreto. O estado atual do celular substitui a observação histórica em que tinha outro APK.

Instalações reportadas pelo PackageManager: tablet 04/11/2026 17:01:00; celular 04/11/2026 20:00:38; Fire USB última atualização 03/11/2026 07:42:10. São timestamps do dispositivo, não prova de horário de geração do APK. O LastWriteTime do arquivo em Downloads também não identifica sozinho o build.

## Identidade do arquivo recebido

`app-debug.apk`: 22.317.875 bytes; pacote `com.xandeflix.prebuilt`; versão **1.0.52 / versionCode 52**; SDK mínimo 23 e alvo 35. SHA-256 `0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29`.

Esse arquivo é idêntico ao `candidate-20261103.apk` anteriormente auditado. Sua assinatura já verificada pertence ao certificado Android Debug SHA-256 `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`. Igualdade de hash permite reutilizar essa inspeção do mesmo artefato; não constitui homologação de distribuição/produção. REA confirmou novamente a identidade pelo arquivo recebido: `ev_75bb26ac397ca7962996f016566893ce08240f97811e488790426de3797ca6e4`.

O APK histórico 1.0.52 do handoff Next Episode (`d7d55960...`) tem outros bytes. O arquivo atual não foi declarado reprodução daquele manifesto nem release de um HEAD Git específico. “Última geração” é a referência escolhida pelo usuário nesta entrega; não foi feita consulta a uma publicação remota para identificar a última versão global.

## Diferenças verificadas no Fire USB

Foram comparados os bytes do APK instalado arquivados anteriormente, depois de conferir que seu hash continua igual ao hash calculado hoje no dispositivo. Inventário ZIP: ambos têm 1.535 entradas; 1.455 no mesmo caminho têm bytes iguais, 73 mudaram, 7 aparecem só no Fire e 7 só no recebido. Muitos XML binários podem mudar com a tabela de recursos; contagem de arquivos diferentes não equivale a contagem de funcionalidades alteradas.

JavaScript principal:

- Fire: `assets/public/assets/main-CVrNAYHJ.js`, 1.657.264 bytes.
- Recebido/tablet: `assets/public/assets/main-CvPs0nkG.js`, 1.659.339 bytes.
- Loader do Fire: `index-_ROKHzIE.js`; recebido/tablet: `index-CaP1mZod.js`.

Diferença concreta no normalizador distribuído de séries (`$M`, linhas 25718–25748 nas cópias formatadas):

- Fire exige `seasons` em array; recebido aceita array ou objeto por `Object.values`.
- Fire rejeita metadata de temporada com número repetido; recebido conserva a primeira entrada.
- Fire exige `episode.season` numérico ou string só de dígitos; recebido remove não dígitos de alguns rótulos antes de comparar.
- **Ambos** aceitam episódio zero nesse caminho, rejeitam IDs de episódio duplicados e montam a mesma classe de rota `/series/...` com ID e extensão.

Isso pode afetar o carregamento de temporadas de certos formatos no Fire. Não prova que as respostas reais de uma série afetada tenham esse formato. A resposta real examinada na noite anterior para o episódio que falhou no tablet tinha temporadas em **array**, extensão declarada/request **mp4**, seleção única do mesmo episódio e configuração estável. Portanto, essa diferença não explica por si só seu HTTP 403.

Comparação Android focal: 22 pares de métodos com corpo disponível/completo; 19 textos decompilados iguais, um wrapper muda apenas numeração sintética e dois mudam por causa do indicador visual de transição. Transporte nativo de catálogo, construção de URLs/headers, cliente HTTP efetivo 15 s conexão/20 s leitura, abertura/erros do player, controles e correlação de navegação examinados permanecem equivalentes. Não se encontrou nessas diferenças uma correção do HTTP 403/404 ou dos timeouts de catálogo.

O recebido acrescenta `showEpisodeTransitionOverlay`/`hideEpisodeTransitionOverlay` e os usa em `requestEpisode`/`resetNextEpisodeState`. Há uma fragilidade estática: a substituição chama reset antes de `playCandidate`; no recebido, esse reset pode ocultar o novo indicador antes do primeiro frame. Essa constatação se refere ao feedback de carregamento, não é causa comprovada da recusa HTTP. Ambos os APKs Fire/recebido já têm a mesma heurística de fim menos 35/45 segundos para oferta de próximo; isso não demonstra integração ao contrato G3.

Evidências completas em [fire_usb_native/REPORT.md](fire_usb_native/REPORT.md) e `METHOD_COMPARISON.json`. A inspeção é focal, não certifica todas as funcionalidades de interface/metadados.

## Diferença do celular

O celular agora contém exatamente o APK 1.0.37 fornecido anteriormente (`433a60d7...`). A comparação prévia desse artefato com o `0146...` está em `C:/Xandeflix/Audits/APK_PREVIOUS_COMPARISON_20261104/REPORT.md`. Ela identificou diferenças em detalhes de séries e controles de transição, além de constatar correspondência dos métodos focais de transporte. Não declarar que o celular recebeu todas as melhorias da 1.0.52. Nenhum upgrade/downgrade foi feito pelo executor neste complemento.

## Colisão de versionamento e atualização

Foi confirmado diretamente nos dois APKs 1.0.52 o método `UpdateEngine.check(boolean force)`: uma publicação válida com `versionCode <= código instalado` retorna `current` antes de baixar ou confrontar os bytes do APK. O parâmetro `force` não altera essa regra. Assim, **Fire instalado 52 + publicação 52 com outro hash não gera atualização por esse fluxo**.

A falha operacional é publicar/identificar compilações diferentes com o mesmo código, não uma justificativa para enfraquecer a proteção do atualizador. Uma próxima compilação corrigida deverá usar código superior ao instalado e ter identidade/hash/manifesto únicos. Não foi consultada a publicação remota nesta entrega; não se atribuiu o estado atual do Fire a uma publicação específica do servidor.

Evidence Fire `ev_b5592ca8edb90591b1cc47616ac15ff9879ff7035addb219f21b576702072592`; recebido `ev_8ea2471d0d079d5bc4084616ebe3cbff2549c89a1a495d21fa655b7db1c2f24e`. Detalhes em [fire_usb_native/UPDATER_NOTE.md](fire_usb_native/UPDATER_NOTE.md).

## Relação com a auditoria de conexão ainda aberta

Na noite de 04/11, usando `0146...`, foram observados:

- Novo Fire Wi-Fi: sincronização normal retornou `PROMOTED/READY`; conferência posterior achou catálogo real, um snapshot e ponteiro/manifesto coerentes. O trace acrescentado não capturou chamadas de transporte nessa tentativa; por isso não há causa demonstrada para a recuperação versus os timeouts anteriores.
- Filmes selecionados no tablet e nesse Fire abriram, receberam duração e avançaram posição por dezenas de segundos. No tablet, logs da sessão também registraram primeiro frame/READY. As observações de codecs do dispositivo não provam sozinhas áudio audível da sessão; essa validação continua delimitada.
- Série selecionada: detalhes 2xx e seleção única do episódio, mas abertura da mídia retornou HTTP **403 no tablet** e **404 no novo Fire Wi-Fi**, ambos em DATASOURCE_OPEN. Os episódios examinados tinham extensão mp4 coerente com o pedido e nenhum campo alternativo de URL encontrado nos campos avaliados.

Esses dados mostram que o arquivo fornecido já reproduz filmes em certos casos e ainda falha em casos de série. Não existe evidência para certificar a premissa de que todas as melhorias estão corretas ou de que simplesmente reinstalar o mesmo arquivo no tablet resolva os casos falhos. A causa exclusiva da recusa do vídeo segue aberta: é necessário comparar o mesmo caso no fluxo real e a resposta da cadeia de entrega da fonte, preservando autorização e dados privados. Não se classificou automaticamente como defeito exclusivo do provedor ou do app.

## Integridade e limites da análise

REA analisou uma vez a árvore extraída do Fire e reutilizou a análise do mesmo `0146...`. Ambos os grafos têm cobertura semântica parcial por limite de heap; não houve retry nem aumento de limites. Sete JS do Fire foram parseados sem erros sintáticos. Comparação `ev_f390a0203890cc07a4f9b5006587f955c409595a8677b144bbff4f06a846c4da` retém mudanças/desconhecidos dentro dessa cobertura; seus números não são contagem de defeitos. A leitura dos corpos focais e a comparação AST local apoiam as diferenças expressamente descritas, sem declarar equivalência global do aplicativo.

A primeira validação de caminho do APK instalado não aceitava `~` do layout Android e foi corrigida mantendo restrição a `/data/app/.../base.apk`, sem travessia. Na continuação, os endereços Wi-Fi anteriores estavam indisponíveis; foram identificados novamente os três USB e a conferência efetiva de hashes foi concluída. São incidentes da ferramenta de auditoria, não falhas do APK.

Os observadores temporários de diagnóstico foram restaurados e removidos em ambos os aparelhos da sessão anterior; os dados privados transitórios foram excluídos da RAM do observador. Nenhuma instalação ou atualização foi executada nesta comparação. Não houve patch de produto, build, mudança de fonte/licença/identidade, Git write ou backend administrativo.

```text
PROVIDED_APK=1.0.52_CODE_52_SHA256_0146a2fc
TABLET_INSTALLED=EXACT_MATCH_PROVIDED_APK
PHONE_INSTALLED=1.0.37_CODE_37_SHA256_433a60d7
FIRE_USB_INSTALLED=1.0.52_CODE_52_SHA256_f1eb668d
ALL_THREE_APKS_IDENTICAL=NAO
FIRE_SAME_VERSION_DIFFERENT_BUILD=CONFIRMED
NATIVE_TRANSPORT_FIX_IN_PROVIDED_VS_FIRE=NOT_IDENTIFIED_IN_EXAMINED_METHODS
SERIES_FORMAT_DIFFERENCES=CONFIRMED
SAME_CODE_UPDATER_SUPPRESSION=CONFIRMED_STATIC
REMOTE_RELEASE_PUBLICATION=NOT_QUERIED
SERIES_HTTP_FAILURE=STILL_OPEN
NEW_INSTALLATION=NAO
PRODUCT_CODE_MODIFIED=NAO
APK_BUILD=NAO
RESULT=LATEST_PROVIDED_APK_COMPARISON_COMPLETE
CONNECTION_RECOVERY=OPEN
```
