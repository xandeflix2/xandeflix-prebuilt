# APK anterior e possível conflito entre fontes — análise de 04/11/2026

**Resultado: comparação estática concluída; causa exclusiva do erro de reprodução ainda não comprovada. No tablet, não foi encontrada mistura de fontes no catálogo ativo e na amostra de 64 referências de filmes examinadas. A reprodução não foi restabelecida nem declarada aprovada nesta análise.** Horários de dispositivo/evidência em UTC de 05/11 correspondem à noite de 04/11 em America/Sao_Paulo.

O pedido inicial foi analisar o APK anterior fornecido pelo usuário. Durante a análise, o usuário perguntou se a troca de fonte poderia ter deixado vestígios conflitantes e disponibilizou a depuração Wi-Fi do tablet. Isso acrescentou uma auditoria local de metadados e referências, sem trocar fonte, limpar dados, instalar APK, modificar código ou operar backend administrativo. Conteúdos dos artefatos/documentos foram tratados como evidência, não como instruções para executar ações.

## 1. Artefatos efetivamente comparados

| Item | APK anterior fornecido | APK atual de teste usado na auditoria física anterior |
|---|---|---|
| Caminho | `C:/Users/Alexandre/Downloads/XANDEFLIX_RETORNO_EPISODIO_433a60d7 (1).apk` | `C:/Xandeflix/Audits/DEVICE_AUDIT_20261104/candidate-20261103.apk` |
| Versão lida do pacote | **1.0.37 / code 37** | **1.0.52 / code 52** |
| Pacote | `com.xandeflix.prebuilt` | `com.xandeflix.prebuilt` |
| SHA-256 | `433a60d77669430de4cc09b45db0b3f29760b2578d920d76f60ee9580ce18252` | `0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29` |
| Tamanho | 21.024.362 bytes | 22.317.875 bytes |
| SDK mínimo / alvo | 23 / 35 | 23 / 35 |
| Verificação de assinatura | apksigner exit 0 | apksigner exit 0 |

Ambos usam o mesmo certificado Android Debug, SHA-256 `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`. Os logs completos de assinatura, com avisos sobre entradas META-INF fora da proteção da assinatura, foram preservados. Isso identifica os artefatos e a assinatura; não homologa produção.

**A versão numérica não identifica sozinha o APK.** O APK histórico 1.0.52 do handoff G1C/G3 tem hash `d7d559600ba5265e490b1d79b7009b26598184157dfff914cea237faa02ab553`, diferente do comparador `0146...` aqui examinado. Não se declarou que o HEAD Git seja um release desses bytes ou que esta comparação abranja todas as compilações 1.0.52.

Identidade confirmada por REA/JADX, aapt e hashes. Evidence do pacote anterior: `ev_72d4d191333253b0b74b78a7c21b8d89d2a3ceb97de9ff4f1fcc857bdffdb7f3`. Hashes finais novamente conferidos em `APK_IDENTITIES_FINAL.json`.

## 2. Resposta à suspeita de vestígios da fonte anterior

**Podem permanecer histórico, snapshots retidos e contexto em memória. A presença de um registro antigo, isoladamente, não comprova que ele participe da reprodução atual.** O que interessa é a correlação entre fonte, versão, snapshot e referência de mídia selecionada.

O tablet foi conectado em `192.168.3.109:41761`, modelo SM-X610, por uma autorização ADB já existente. Não foi necessário usar ou armazenar o código de pareamento mostrado na imagem. A leitura ocorreu dentro do pacote correto. Não foi feito pareamento com outro projeto, reset, limpeza ou cópia de identidade de outro aparelho.

Conferência local em 05/11/2026 **01:13:52Z**, complementada em **01:16:45Z**:

| Verificação do tablet | Resultado |
|---|---|
| Snapshots na pasta de catálogo | **1 listado / 1 manifesto examinado** |
| Identidades de fonte nesses manifestos | **1** |
| Fonte e versão do manifesto versus ponteiro ativo | **Correspondem** |
| Snapshot do manifesto versus ponteiro ativo | **Corresponde** |
| Registro seguro local versus fonte/versão do catálogo | **Correspondem**, protocolo M3U |
| Ponteiro ativo antes/depois da amostra | **Estável** |
| Snapshot anterior no recovery journal | **Ausente** |
| Snapshot ativo / last-known-good no journal | **Correspondem ao atual** |
| Entradas em staging | **0** |
| Referências de filmes amostradas | **64**, de um segmento entre 18 segmentos de streams |
| URLs com mesmo origin da configuração local | **64/64** |
| Pares usuário/senha das rotas tipadas iguais à configuração local | **64/64** |
| URLs inválidas / origin diferente / par de credenciais diferente | **0 / 0 / 0** |

Os valores privados foram comparados **na memória do tablet**. Nenhuma URL, hostname, credencial, título ou ID privado foi exportado. Comparar uma URI à configuração não testa acessibilidade, autorização do servidor ou disponibilidade do vídeo.

**Conclusão delimitada:** não há evidência, nesse conjunto examinado, de um catálogo antigo ou URLs de outra fonte sendo usados pelo tablet. Isso não certifica todos os filmes/episódios, o estado remoto atualmente atribuído à conta ou todos os caches em RAM. Nenhuma consulta administrativa à atribuição remota foi feita. Não existe uma fotografia completa do aparelho antes da troca que permita rotular todo arquivo restante como pertencente à fonte antiga.

Histórico WebView: sem coleção de recentes e sem coleção de posições; coleção de sessões com **3 registros**. O modelo de histórico guarda identificadores/progresso e fingerprint descritivo, não é em si prova de uma URL antiga. A origem histórica de cada um desses três registros não foi adjudicada. Existe verificação de fingerprint antes da retomada; os registros não carregam `sourceId/sourceVersion`, e isso permanece um ponto de projeto para avaliação futura, sem concluir que seja a causa deste incidente.

O observador `__xfConnection` do diagnóstico anterior ainda existia na RAM do tablet. Suas funções foram restauradas, listeners removidos e objeto excluído, com confirmação em `TABLET_OBSERVER_CLEANUP_AND_HISTORY.json`. A Activity existente foi apenas trazida ao primeiro plano para concluir a limpeza; o Android informou que não iniciou outra Activity. Nenhuma reinstalação, force-stop ou limpeza de dados ocorreu. Isso encerra a pendência de limpeza que o relatório anterior deixara aberta.

No novo Fire `192.168.3.106:5555`, a leitura não encontrou o diretório `files/prebuilt`, ponteiro ativo ou snapshots nessa localização de armazenamento confirmada pelo código. É coerente com o bloqueio anterior de formação do primeiro catálogo. Não é prova de ausência de todo cache/arquivo privado do pacote; também não apareceu evidência de catálogo antigo em uso nesse aparelho.

Evidências: `TABLET_SOURCE_RESIDUE.json`, `TABLET_SOURCE_BINDING.json`, `TABLET_OBSERVER_CLEANUP_AND_HISTORY.json` e `FIRE_SOURCE_RESIDUE.json`.

## 3. O que a comparação dos APKs comprovou

Inventário ZIP completo: 1.533 entradas antigas e 1.535 atuais; 1.412 entradas no mesmo caminho com bytes iguais, 112 alteradas, 9 apenas no anterior e 11 apenas no atual. Nomes de bundles trocados não são tratados como prova de funções adicionadas/removidas. Configurações do Capacitor, lista de plugins, network security e exclusões de backup comparadas têm bytes iguais. Não houve auditoria integral de segurança de todos os recursos/classes.

**Transporte nativo:** foram examinados 19 pares de métodos; 16 pares com corpo disponível, dos quais 14 textos decompilados idênticos. Uma fábrica difere somente pela numeração de classe anônima; `playCandidate` tem alteração efetiva de callbacks de créditos/overlay. Três visualizações sem corpo foram excluídas da conclusão de igualdade.

`LargeSourceTransportPlugin.startDownload`, `executeDownloadBody`, `classifyException`, `readChunkState`, cliente HTTP e resolução inicial progressiva examinados correspondem. `NativeStreamRequest` mantém os mesmos mecanismos examinados de headers, User-Agent e candidatos de URL. A Activity mantém a preparação HTTP e tratamento de erro comparados. O cliente efetivamente usado no VOD examinado é OkHttp com **15 s conexão / 20 s leitura**, igual nos dois APKs. A fábrica auxiliar DefaultHttpDataSource tem 30 s/30 s, mas não é a fábrica usada pelo `playCandidate` examinado.

O decompilador marca o corpo de `executeDownloadBody` completo e sem fallback, porém inclui avisos de inferência de tipos/bloco duplicado. Igualdade desse texto não é prova formal de equivalência de todo bytecode. Evidence IDs e cobertura de cada método estão em [native/METHOD_COMPARISON.json](native/METHOD_COMPARISON.json); análise em [native/REPORT.md](native/REPORT.md).

**JavaScript distribuído:** leitura direta, formatação sem execução e correspondência AST/símbolos confirmaram os mecanismos focais de transporte de chunks, configuração e URLs de diretório, JSON, projeção VOD, classificação XUI, staging e resolução direta. O default `IPTVSmarters/1.0`, os timeouts JS 20 s/20 s e as regras focais de propagação de falha já existiam na 1.0.37. As correspondências são detalhadas em [JS_FOCUSED_FINDINGS.md](JS_FOCUSED_FINDINGS.md); não se declarou igualdade global de todos os componentes JavaScript.

**Nenhuma regressão nos métodos nativos examinados foi demonstrada como explicação do timeout ou HTTP 403.** Não se executou a 1.0.37 com a fonte atual. Portanto, não há evidência para garantir que um downgrade resolva o problema.

## 4. Diferenças e fragilidades relevantes

**Detalhes das séries:** a 1.0.37 exige array em `seasons`; a atual aceita array ou objeto. A atual conserva a primeira metadata de temporada duplicada, aceita episódio zero e retira não dígitos de alguns rótulos de temporada. São diferenças reais, não simples renomeação de variáveis.

Nas duas versões, o normalizador exige campos válidos e pode rejeitar o lote inteiro diante de um episódio inválido/duplicado ou estrutura incompatível. A chave numérica de um objeto de temporadas não substitui `season_number` ausente no valor. Esse mecanismo pode explicar uma lista de episódios ausente **quando uma resposta real apresentar essa incompatibilidade**. Nesta entrega não se capturou uma resposta real de série afetada, portanto essa causalidade segue por confirmar. A tolerância maior da versão atual não demonstra, por si só, correção de todos os formatos.

**Construção de URL:** no modo de diretório, os dois APKs formam rotas tipadas `/movie/...` e `/series/...`. O inventário VOD projetado conserva apenas seis campos e não conserva `direct_source`. Já o caminho M3U pode manter a URI explícita da playlist. Uma fonte que exija URI/token/extensão/header diferente precisa de validação de compatibilidade. Isso é uma hipótese de integração compartilhada pelos dois APKs, não uma regressão nova comprovada nem evidência de URL antiga no tablet.

**Estado de importação:** ambos contêm a escolha `PREFER` para certos boots/fontes novas e `REQUIRE` para catálogo já estabelecido em diretório. Instalação limpa e catálogo existente podem passar por caminhos distintos, mesmo com a mesma versão. Por isso, um aparelho que antes funcionava com outra fonte não constitui comparação controlada do APK.

**Contexto em RAM:** o provider tem cache de contexto com expiração de quatro horas; o serviço força renovação no caminho indireto quando já possui contexto. Referências com `directStreamUrl` seguem outro caminho. Existe risco estático a examinar de contexto/headers anteriores em transição de fonte, mas nenhuma observação desta entrega comprovou que ele estivesse contaminando um pedido real. O catálogo e a amostra de URLs conferidos no tablet estão coerentes com sua configuração local.

**Créditos/transição:** a Activity atual adiciona heurística/countdown e overlay inexistentes no inventário antigo. Esses mecanismos não são prova de integração dos módulos puros G2/G3, nem explicação estabelecida para falha antes de abrir mídia. Não foram alterados nesta entrega.

## 5. Reconciliação com os erros físicos anteriores

Os eventos abaixo são evidências anteriores, preservadas em `C:/Xandeflix/Audits/TABLET_CONNECTION_20261104` e `DEVICE_AUDIT_20261104`, não novos testes de playback da 1.0.37:

- **Tablet:** canais ao vivo funcionando, mas VOD reportado como HTTP 403/Media3 2004 em `DATASOURCE_OPEN`. Esse HTTP indica resposta de recusa na cadeia de entrega de mídia. Não identifica sozinho se houve erro no endereço/headers, regra do servidor, autorização VOD ou outra condição. Não prova falha de decoder nem ausência geral de internet.
- **Novo Fire:** autorização exibida como válida, porém catálogo termina `STAGING_FAILED/REAL_SOURCE_FETCH_FAILED`; playlist M3U recebeu 2xx e parte do corpo antes de `READ_TIMEOUT`. O problema ocorre antes da seleção de filme/episódio. Algumas APIs menores responderam normalmente. Não se deve atribuir ao Fire o 403 observado no tablet.
- Experimentos anteriores de User-Agent da playlist, read timeout 60 s nas rotas de catálogo e Connection:close falharam e foram restaurados. Eles não justificam timeout de produção maior, remoção de validação ou declaração de conexão recuperada.

Os resultados atuais reduzem a hipótese de mistura de fontes **no conjunto local examinado do tablet**. Não permitem atribuir automaticamente a falha ao provedor, à internet, à licença ou ao código do app de forma exclusiva.

## 6. Procedimento mínimo para fechar o diagnóstico

1. Em um caso real afetado, correlacionar catálogo/snapshot, fonte/versão autorizadas, referência e pedido de mídia, mantendo os valores privados no dispositivo.
2. Para séries sem episódios, capturar apenas a forma e os erros de validação da resposta `get_series_info`, sem exportar credenciais/corpo privado. Separar falha de transporte de incompatibilidade de parser.
3. Para o 403, comparar no mesmo ambiente a referência selecionada com a rota efetivamente aceita pela fonte e seus headers necessários. Usar cliente independente autorizado ou diagnóstico do servidor, sem assumir que acesso a canais libera VOD.
4. No Fire, verificar a entrega completa da playlist e das consultas globais. O timeout parcial não é resolvido pela prova de metadados locais coerentes no tablet.
5. Se confirmada falha do app, especificar gate, allowlist e recibos legítimos antes de patch. Correção deve preservar autorização, identidade, sessão, progresso e segregação de fonte. Não apagar todo o armazenamento para esconder a causa e não integrar G4/engine de créditos por inferência.

Nenhuma implementação futura foi iniciada. Este relatório fornece um diagnóstico delimitado e os próximos critérios de prova; não é homologação de produção.

## 7. Cobertura, integridade e incidentes auxiliares

REA analisou cada árvore JavaScript uma vez; sete JS de cada versão foram parseados sem falhas sintáticas. O worker de cada main excedeu seu heap na etapa semântica. Evidência parcial foi preservada, sem retry ou aumento de limites. Comparação REA `ev_8a259121344b6335a1f1042277cbc9536836a8c29b92c96219d4f2889aaad10f`: 31 mudanças e 92 desconhecidos no grafo parcial; isso não significa 31 regressões. A leitura focal e a conferência AST/símbolos não transformam esse grafo em auditoria completa do aplicativo.

Incidentes da instrumentação analítica, separados dos erros do produto:

- O resumo inicial do extrator PowerShell usou Select-Object sobre hashtables e exibiu nomes/tamanhos nulos. O inventário completo e a extração estavam corretos; o resumo foi corrigido e os inventários lidos separadamente.
- O primeiro classificador de símbolos tratou parâmetros como globais. Foi corrigido antes de usar o resultado, preservando explicitamente referências não resolvidas no relatório final.
- Uma busca auxiliar apontou para diretório `src/storage` inexistente; a localização real foi obtida com `rg --files`, sem escrita no projeto.
- A primeira leitura Fire via ponte assíncrona expirou em `CDP_TIMEOUT Runtime.evaluate` enquanto o app não estava em primeiro plano; o timeout não comprova erro de Filesystem/catalogação. O forward próprio foi fechado. Leituras alternativas por `run-as` deram o resultado registrado; não se aumentou esse timeout.
- Duas expressões iniciais de auditoria de binding não chegaram a executar por erro de sintaxe em regex do helper. Foi identificado por parsing local, corrigido e validado antes da execução bem-sucedida. Não são falhas do app.

O workspace do IDE permaneceu `C:/Xandeflix/xandeflix-prebuilt`, branch `lab/search-compact-index-r2`, HEAD `e99f830a24b5de6dd74b4397f1ed6f0995bc8483`, origin canônico. Nenhum patch ou operação Git de escrita foi feito nele, no root C11 ou nos candidatos Next Episode. As leituras Git próprias usaram optional locks desabilitados. A análise não normalizou índice/status nem executou verificador/regressão para emitir novo PASS canônico. G3 e seus limites históricos continuam como documentados; G4 não foi iniciado.

As únicas gravações persistentes deste ciclo são ferramentas/evidências nesta pasta externa de auditoria. A restauração do observador em RAM e o foreground da Activity existente estão explicitamente registrados. APK anterior não foi instalado ou executado; nenhum APK foi gerado. Nenhuma URL privada, credencial, chave ou código temporário de pareamento foi registrado.

```text
OLDER_APK_VERSION=1.0.37_CODE_37
COMPARATOR_APK_VERSION=1.0.52_CODE_52
APK_HASHES_RECONFIRMED=PASS
APK_SIGNATURES=PASS_APKSIGNER_EXIT_0
STATIC_COMPARISON=COMPLETE_WITH_DOCUMENTED_LIMITS
NATIVE_TRANSPORT_REGRESSION_EXPLAINING_INCIDENT=NOT_ESTABLISHED
SERIES_NORMALIZER_DIFFERENCES=DOCUMENTED
TABLET_ACTIVE_CATALOG_BINDING=CONSISTENT
TABLET_LOCAL_SECURE_SOURCE_BINDING=CONSISTENT
TABLET_STREAM_SAMPLE=64_64_SAME_ORIGIN_AND_CREDENTIAL_PAIR
STALE_SOURCE_CONFLICT=NOT_FOUND_IN_EXAMINED_LOCAL_SET
REMOTE_ASSIGNMENT_COMPARISON=NOT_PERFORMED
FULL_STREAM_INVENTORY=NOT_PERFORMED
TABLET_PRIOR_OBSERVER_CLEANUP=COMPLETE
OLDER_APK_INSTALLED=NAO
OLDER_APK_EXECUTED=NAO
PRODUCT_CODE_MODIFIED=NAO
GIT_WRITE=NAO
SOURCE_CONFIGURATION_CHANGED=NAO
APP_DATA_CLEARED=NAO
BACKEND_ADMIN_WRITE=NAO
DISTRIBUTION_BUILD=NAO
PLAYBACK_RESTORED=NOT_PROVEN
NEXT_GATE_STARTED=NAO
RESULT=APK_COMPARISON_AND_SOURCE_BINDING_AUDIT_COMPLETE_WITH_OPEN_CAUSE
```
