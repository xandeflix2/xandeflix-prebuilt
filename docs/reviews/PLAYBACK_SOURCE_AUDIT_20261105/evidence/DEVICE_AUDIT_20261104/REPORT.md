# Xandeflix Prebuilt — auditoria dos aplicativos e da transição operacional

Data: 04/11/2026, America/Sao_Paulo. Escopo: aplicativos instalados no Fire Stick, tablet e celular, comparação do artefato existente, reprodução das falhas após troca da fonte/internet e revisão das demandas do agente anterior. Motor de créditos limitado à especificação futura, conforme resposta expressa do usuário.

**Auditoria física e documental concluída; correções/atualização do Fire bloqueadas no preflight.** O complemento de fechamento registra o resultado real da regressão. Nenhum sucesso de reprodução é declarado onde não houve primeiro quadro/progresso válido.

## 1. Conclusões comprovadas

- Os três aparelhos informam 1.0.52/code52, mas o Fire iniciou esta auditoria com outro binário. Tablet e celular já coincidem byte a byte com o APK local existente de 03/11. Versão igual não comprova mesmo software.
- O parser atual aceita temporadas em mapa e números em texto. Testes sintéticos passaram, mas isso não resolveu as consultas reais que falham no transporte/API da fonte nova.
- Depois de o usuário informar a troca da internet, o celular recebeu HTTP404 na consulta de série e na consulta básica da API. O tablet continuou sem resposta HTTP no cenário auditado. Não foi recebido um payload de episódios válido que pudesse comprovar uma falha desse parser.
- A fonte antiga no Fire forneceu temporadas/episódios de Silo, mas a abertura da mídia falhou nos pedidos capturados, com HTTP403/404. A fonte antiga carregar catálogo não certifica que seus streams reproduzem.
- O loading nativo é removido antes do primeiro quadro em um caminho de substituição de episódio. O relatório anterior descreve uma garantia que o código e o APK não sustentam integralmente.
- Há heurística nativa de créditos em 35/45 segundos e contagem regressiva de cinco segundos sem integração com G2/G3. Não equivale a detecção de créditos validada pelo G3.
- A proposta anterior de tempo universal por TMDB/S/E não comprova edição da mídia. Um worker/tabela remota não foi implementado e depende de decisão arquitetural futura.

## 2. Referências, identidade e preservação

Pacote examinado: exclusivamente `com.xandeflix.prebuilt`. Nenhuma operação sobre `com.xandeflix.app`. Os APKs públicos instalados foram copiados para esta pasta e comparados por SHA-256. Não foram exportadas configurações privadas, URLs de fonte, credenciais, mídia ou dados do usuário.

| Referência | Caminho/estado |
| --- | --- |
| IDE/laboratório | `C:/Xandeflix/xandeflix-prebuilt`, branch `lab/search-compact-index-r2`, HEAD `e99f830a24b5de6dd74b4397f1ed6f0995bc8483` |
| Root associado ao APK recente | `C:/Xandeflix/xandeflix-prebuilt-c11-main`, branch `fix/source-output-format-recovery`, HEAD `d8a74102124fbb8a3f013f6fd8a502519c1db4b8` |
| Candidato isolado Next Episode | `tmp/tmdb-episode-metadata-enrichment-20261027/NEXT_EPISODE_G2_A22_CANDIDATE/workspace`, branch `main`, mesmo HEAD `d8a741...` |
| Origin esperado | `https://github.com/xandeflix2/xandeflix-prebuilt.git` |

O root e o candidato G3 não são a mesma árvore funcional. Não houve checkout, reset, stash, clean, commit, push, PR ou troca de branch. Nenhum código de produto, contrato ou recibo foi editado por esta auditoria. As evidências e os helpers novos estão somente nesta pasta externa; testes originais podem produzir suas fixtures/outputs locais conhecidos. Não se declara preservação histórica integral de árvores sem snapshot anterior.

O último gate técnico Next Episode continua `NEXT_EPISODE_G3_MARKER_CONTRACT_PASS`; G2/G3 permanecem módulos isolados. A aceitação G1C-R4 com limitação histórica e a exceção delimitada do índice G2-R4 não foram removidas. Esta auditoria não inicia G4.

## 3. Versões e artefatos instalados

Inventário inicial em `DEVICES_BEFORE.json`.

| Dispositivo | Modelo / Android | Versão | SHA-256 inicial |
| --- | --- | --- | --- |
| Fire Stick Lite | AFTSS / 9 | 1.0.52 / 52 | `f1eb668de79aebd0384424c67a289eea9c5206fa8db901020789f52a8a079358` |
| Tablet | SM-X610 / 16 | 1.0.52 / 52 | `0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29` |
| Celular | SM-S926B / 17 | 1.0.52 / 52 | `0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29` |

APK local existente: `C:/Xandeflix/xandeflix-prebuilt-c11-main/android/app/build/outputs/apk/debug/app-debug.apk`, 22.317.875 bytes, SHA-256 `0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29`. A cópia auditada é `candidate-20261103.apk`. Não foi gerado novo APK.

`apksigner verify` confirmou o candidato e o APK anterior do Fire, com o mesmo certificado SHA-256 `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`. Ver `SIGNATURES.json`. Isso permite avaliar atualização in-place sem mudar identidade de assinatura; não constitui homologação funcional ou de produção.

O APK histórico 1.0.52 de `CARD_TRAILER_AUDIO_20261029` possui outro hash (`d7d559600ba5265e490b1d79b7009b26598184157dfff914cea237faa02ab553`) e continua sendo referência histórica. Não confundir os três binários por terem o mesmo code52. “Mais recente” nesta auditoria significa o candidato local existente correlacionado aos aparelhos; não se certificou uma release de produção publicada.

## 4. Fonte de conteúdo e mudança da internet

O usuário confirmou fonte de conteúdo nova no tablet/celular e antiga no Fire. Depois informou mudança da internet. As duas alterações foram tratadas como eventos diferentes; os cenários posteriores têm rótulo `network2`.

| Cenário | Resultado observado | Limite da conclusão |
| --- | --- | --- |
| Fire, fonte antiga, Silo | Detalhes carregaram três temporadas; S1 com dez episódios | Um estado inicial de carregamento não foi classificado como falha |
| Tablet/celular, fonte nova, Silo/Ted Lasso | Zero temporadas com erro após a consulta encerrar | Consulta real falhou; não prova que o catálogo da fonte é vazio |
| Tablet, fonte nova, Matéria Escura | Também falhou no transporte | Não confirmou a alegação anterior de que essa série funciona nessa fonte |
| Antes da troca da internet, API por transporte nativo | Falha antes de resposta HTTP; comparação pelo HTTP nativo registrou conexão encerrada/reset | Não comprovou falha de certificado, parser ou autenticação |
| Após troca da internet, celular/Ted Lasso | HTTP4xx; comparação sanitizada confirmou HTTP404 | Não houve `seasons`/`episodes` válido |
| Após troca da internet, API básica no celular | HTTP404, sem `user_info`/`server_info` | Ausência de `user_info` em 404 não prova credencial inválida |
| Após troca da internet, tablet/Silo | `UNKNOWN_TRANSPORT_ERROR`, antes de resposta HTTP | Causa de rede/servidor ainda não individualizada |

A derivação de API pode exigir `player_api.php` no endpoint autorizado da fonte. Uma playlist M3U disponível não comprova que esse endpoint exista. A hipótese de fonte sem a API esperada permanece hipótese; não se alterou host, protocolo ou credencial para forçar resposta. Comparações de transporte usaram a mesma requisição autorizada, mantida na memória do aparelho, sem registrar sua URL ou segredo.

Evidências: `*-scenario.json`, `*-transport-diagnostic.json`, `*-transport-comparison.json`, `phone-httpstatus-network2.json`, `phone-baseapi-network2.json` e capturas `*-silo-details.png`. Não houve comparação com outro player: o usuário informou que ainda não testou.

## 5. Reprodução de mídia

Celular: ação Assistir de “Caju, Meu Amigo (2026)” pelo próprio app. Resultado capturado: `NATIVE_ERROR`, categoria `NETWORK_TIMEOUT`, Media3 `2001`, checkpoint `DATASOURCE_OPEN`, posição/duração zero. Não houve sucesso de reprodução comprovado.

Fire: ações do episódio de Silo capturaram `HTTP_ERROR`, Media3 `2004`, HTTP403 e HTTP404, checkpoint `DATASOURCE_OPEN`, sem progresso. Esses códigos não comprovam erro de codec nem sucesso de decodificação. Não se pode certificar áudio ou estabilidade sem abrir a mídia.

Evidências: `phone-movie-runtime.json`, `phone-movie-checkpoints.json`, `fire-silo-playback.json`. Não foram alterados volume, fonte, autorização, catálogo ou dados do app para contornar as falhas. Não se reproduziu toda a biblioteca; os resultados são dos cenários identificados.

## 6. Parser de temporadas: o que os testes comprovam

Arquivo real: `src/source/source-directory-details.ts`, normalização a partir da linha163. Aceita array ou valores de mapa; números em texto são normalizados. A chave do mapa não substitui automaticamente `season_number` ausente. Temporadas repetidas são conservadas pela primeira entrada; IDs de episódios repetidos fazem rejeitar o payload, em vez de uma deduplicação genérica de episódios inválidos.

Os 12 testes originais C105 não incluem o caso de mapa citado como causa anterior. Foi preparado um harness externo usando o resolver real, sem modificar o teste de produto: 12 casos históricos e três casos adicionais passaram, total15. Novos casos: mapa com strings numéricas, episódio zero preservado e mapa sem `season_number` explícito rejeitado. Ver `map-seasons-probe.mjs` e `build-map-probe.mjs`.

Esse resultado comprova compatibilidade sintática nos casos testados. Atribuir a falha física atual ao formato de temporadas seria incorreto sem payload recebido. Também não comprova que o APK anterior ao patch era a única causa histórica; não havia captura sanitizada da resposta original no relatório recebido.

## 7. Loading nativo e créditos: revisão do código entregue

O APK foi inspecionado por REA/JADX e o método focado de reset foi decompilado. Identidade do pacote e manifesto: Evidence `ev_f0fe51231ac2dbf1a650de9f0dc2e415ea851475efe37a5d3f134e1266817506`. Método `resetNextEpisodeState`: Evidence `ev_4c312783d82b3166ddf1d19015b78779e8b7fee807f053c5dc280c10f880d8e1`.

No fonte nativo `android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java`:

- `requestEpisode` mostra a transição e mantém um guard de30 segundos.
- `replaceEpisode`/`setupFromIntent` chama reset antes de `playCandidate`; o reset oculta `episodeTransitionOverlay`.
- `onRenderedFirstFrame` também oculta o overlay, mas isso não garante sua permanência até esse evento. O método no APK confirma a remoção no reset.
- `failEpisodeTransition` fecha a navegação e termina a atividade em falha. O timeout não foi removido.
- `checkCreditsMarker` calcula um limiar pelo tempo restante (35/45segundos); `startCountdownTimer` solicita avanço após cinco segundos. Não é uso dos módulos G2/G3.
- `onPause` não cancela explicitamente esse timer. Risco de transição em background foi identificado estaticamente; não foi reproduzido fisicamente como fato nesta auditoria.

O XML real usa `LinearLayout` e spinner vermelho, enquanto o relatório descreve `FrameLayout` e branco. Essa diferença visual é menor que a falha do ciclo de vida, mas confirma que o texto não é evidência suficiente do artefato entregue.

O teste nativo de créditos baseado em simulação/fórmula não exercita a atividade real e não cobre o problema do overlay. Os patches mínimos e testes necessários estão em `CORRECTIVE_PLAN.md`. Nenhum deles foi aplicado nesta coleta.

## 8. Layout observado nos aparelhos

Medições em CSS px, no detalhe aberto no instante da captura, sem reconfigurar orientação:

| Aparelho | Viewport | Cabeçalho/hero | Voltar/Cast |
| --- | --- | --- | --- |
| Fire | 960x540 | Navegação lateral; hero top12 | Ausentes do hero |
| Tablet | 1365x775 | Navegação lateral; hero top12 | Dentro do hero, top aproximado20,5 |
| Celular | 411x807 | Cabeçalho top0/altura62,9; hero top74,9, intervalo12 | Ainda visíveis abaixo do conteúdo, top aproximado688,6 |

Ver `*-layout-runtime.json`. Não houve certificação de todas as páginas, cards de elenco, todas as orientações ou de60FPS. O pedido anterior de ocultar os controles no celular ainda não está integralmente atendido pela página examinada. Nenhuma conclusão sobre controles foi obtida apenas pela existência de texto em um dialog fechado.

## 9. Governança: verificações distintas

O verificador canônico original avalia hashes, contratos e cadeia registrada; PASS não autentica por si só a origem humana de uma autorização, nem resolve contradições semânticas do recibo.

O recibo `docs/governance/authorizations/CANON-01-PERF-PARENTAL-HERO-REFINEMENT.json` inclui `androidBuildAuthorized:false` e restrição a alterações de player/UI/build/install, enquanto os arquivos/evidências associados descrevem essas operações. A proveniência da ordem correspondente precisa ser reconciliada. O aspecto visual de um hash não é prova de fabricação; esta auditoria não o declara falso sem evidência.

O root está em uma branch diferente de `main`, e o AGENTS exige parada perante divergência nova de proveniência. Foram permitidas leitura, testes originais e preparação documental; não se começou patch de produto nesse root. Cláusulas relevantes: AGENTS §1/§3/§4 (`EXPECTED_BRANCH=main`, `STOP_ON_CONFLICT=SIM`), Execution Contract §2.11. A autorização atual de auditoria/correções não reescreve o estado histórico dos recibos. Não se editou AGENTS nem se declarou uma branch incorreta como main.

O handoff de02/11 descreve o candidato G3 isolado, e não homologa automaticamente as alterações posteriores no root. A comparação atual de repositórios está em `REPOSITORY_AUDIT.json`; resultados de preservação devem ser lidos com o limite de cada snapshot. Não foi criado snapshot retrospectivo.

## 10. Demandas anteriores e desfecho

| Demanda | Estado nesta auditoria |
| --- | --- |
| Identificar aparelhos e versão real | Inventário por pacote/hash/assinatura concluído; fechamento final em arquivo próprio |
| Instalar candidato recente nos Samsung | Já estavam com o mesmo binário; não reinstalar sem necessidade |
| Alinhar Fire | Não executado: nova divergência do snapshot e proveniência pendente; binário antigo preservado |
| Validar Silo/Ted Lasso na fonte nova | Reproduzida a falha; transporte/API impede certificar correção |
| Validar loading entre episódios | Defeito comprovado estaticamente no fluxo; validação física de sucesso impedida por abertura de mídia falha |
| Assegurar próximo episódio G2/G3 | Módulos isolados preservados; integração não iniciada por esta auditoria |
| Motor externo | Especificado em `FUTURE_CREDITS_SPEC.md`; não implementado |
| Correções adicionais | Plano mínimo concreto em `CORRECTIVE_PLAN.md`; baseline/proveniência e fonte precisam ser resolvidos |

Não declarar “todas as demandas concluídas” nem “sistema100%funcional”. A auditoria entrega diagnóstico e evidências, distinguindo atualização de binário, autorização canônica e funcionamento físico.

## 11. Segurança da coleta e incidentes dos helpers

Os observadores temporários do transporte/player preservaram os retornos originais, registrando somente campos sanitizados de status. Foram removidos/restaurados após a captura. Forwards ADB criados pelos helpers são fechados por seus próprios handles. Não foram lidos/exportados conteúdos de storage privado na coleta de diagnóstico.

Uma tentativa de seletor com acento em comando stdin não localizou o botão por encoding; a ação foi refeita com seletor ASCII e confirmou clique. Uma tentativa de comando inline do auditor de layout falhou no parsing de aspas antes de executar; foi substituída por arquivo `.mjs`. Nenhum desses incidentes foi classificado como defeito do app.

Os helpers de atualização, se executados, calculam hashes dos arquivos privados somente em memória do processo e persistem apenas contagem/igualdade. Não usam uninstall, `pm clear`, reset de identidade, configuração de fonte ou instalação em outro pacote. A evidência pública de software permanece separada dos dados privados.

## 12. Arquivos principais desta entrega

- `DEVICES_BEFORE.json`, `SIGNATURES.json`, APKs públicos e screenshots: identidade/correlação inicial.
- `validation-results.json`, `validation-*.log`: comandos e exitcodes atuais, sem trocar resultado antigo por novo.
- `REPOSITORY_AUDIT.json`: Git atual, comparação integral do candidato G3 e diferenças de arquivos gerenciados no root.
- `DEVICES_FINAL.json` e `FIRE_UPDATE.json`, quando produzidos: resultado final de versão/update e preservação.
- `CORRECTIVE_PLAN.md`: mudanças mínimas, bloqueios e testes necessários.
- `FUTURE_CREDITS_SPEC.md`: proposta de gates futuros, sem implementação.

Nenhuma alteração de backend, fonte, licença, versão de dependência, build de distribuição ou publicação foi realizada. A eventual atualização in-place usa exclusivamente o APK existente verificado e tem resultado registrado separadamente.

## 13. Nova divergência do snapshot G3 e decisão de parada

A conferência integral atual encontrou **7.931/7.958 arquivos iguais**, **27 alterados** e **12 extras**, sem ausência registrada. Os 27 alterados são16 arquivos de cache Gradle dentro de `node_modules` e11 outputs/logs de testes em `tmp`. Os12 extras são caches/relatórios Gradle em `android` e relatórios de quatro módulos Capacitor. Os arquivos de produto e os bytes Git cobertos pelo snapshot não divergiram. Os quatro arquivos de módulo/teste G2/G3 conservaram os hashes aprovados.

Isso restringe o achado: não é prova de adulteração de produto, mas impede repetir a afirmação de igualdade integral7958/7958 do handoff. Não se excluíram `.git`, `tmp` ou dependências da comparação para obter um PASS artificial. Ver `G3_DIVERGENCE_REVIEW.json` para caminhos, hashes, tamanhos, links e timestamps individuais.

Há timestamps em02/11,03/11 e04/11, incluindo caches/relatórios modificados durante esta sessão. Os comandos desta auditoria não executaram Gradle nem suítes no candidato isolado; o horário de modificação não comprova o autor/processo. A causa exata permanece não atribuída e deve ser reconciliada com operações anteriores ou concorrentes. O índice e demais arquivos Git cobertos permaneceram byte a byte iguais ao snapshot, sem aplicar a exceção binária antiga a um caso novo.

Por `STOP_ON_CONFLICT`, nenhuma instalação foi executada e nenhum patch de produto foi iniciado. O helper `fire-update.mjs` ficou preparado, **não executado e desabilitado por uma parada explícita**, para não permitir uso acidental após esse achado. Não houve coleta dos hashes privados prevista no plano de instalação. O estado final dos três APKs foi reconfirmado em `DEVICES_FINAL.json`: Fire conserva `f1eb...`; tablet/celular conservam `0146...`. Os dialogs de atualização estavam fechados nos três, sem anúncio visível de outra versão; isso não certifica catálogo global de releases.

Correção mínima do impedimento: identificar e registrar o produtor/escopo desses39 caminhos, decidir legitimamente o tratamento das saídas geradas, preservar o snapshot anterior e produzir novo marco prospectivo apenas após aceitação, sem apagar a diferença histórica. Em paralelo, reconciliar o recibo/root antes de adotar seus patches. Não é necessário limpar dados de aparelho, recriar identidade ou trocar branch para esse diagnóstico.

## 14. Fechamento dos testes atuais

Execução sequencial no root C11, com `GIT_OPTIONAL_LOCKS=0`. Todos os comandos são os originais; não houve retry, skip, aumento de timeout, mudança de asserção ou patch.

| Comando | Início/fim UTC | Resultado |
| --- | --- | --- |
| `node scripts/verify-canonical-contract.mjs` | 19:23:52–19:24:30 | PASS, exit0;970 protegidos, pacote correto, versão52 |
| `node scripts/test-c11-new-device-activation-lock.mjs` | 19:24:30–19:25:35 | PASS, exit0 |
| `node node_modules/typescript/bin/tsc --noEmit` | 19:25:35–19:27:04 | PASS, exit0 |
| `node scripts/test-canonical-regression.mjs` | 19:27:04–19:39:37 | PASS, exit0;204 controles e42 suítes |

`validation-regression-result.json` foi copiado somente após conferir atualização do resultado original em19:39:37.168Z, posterior ao início do runner atual, encerrado em19:39:37.321Z. Não se usou resultado residual de execução antiga. Os casos sintéticos adicionais do mapa de temporadas são evidência separada, não foram acrescentados artificialmente à contagem de42 suítes.

Esses PASS não anulam HTTP404, ausência de resposta, falhas de mídia, defeito do overlay, controles visíveis no celular ou divergência do snapshot. A revisão de permissões/proveniência também continua distinta da verificação de hashes.

```text
PROJECT=XANDEFLIX_PREBUILT
PHYSICAL_DEVICES_AUDITED=3
INSTALLED_VERSION_NAMES=1.0.52_ALL
PHONE_TABLET_MATCH_LOCAL_CANDIDATE=SIM
FIRE_MATCH_LOCAL_CANDIDATE=NAO
APK_SIGNATURE_COMPATIBILITY=PASS
CANONICAL_VERIFICATION=PASS_970
C11_LOCK=PASS
TYPECHECK=PASS
CANONICAL_REGRESSION=PASS_204_CONTROLS_42_SUITES
MAP_SEASONS_SYNTHETIC_TESTS=PASS_15
SOURCE_API_PHYSICAL=FAILURES_OBSERVED
MEDIA_PLAYBACK_PHYSICAL=NOT_CERTIFIED_FAILURES_OBSERVED
G3_MODULE_AND_TEST_HASHES=PRESERVED
G3_COMPLETE_SNAPSHOT=7931_IDENTICAL_27_CHANGED_12_EXTRA
G3_DIVERGENCE_PROVENANCE=UNRESOLVED
G3_GIT_SNAPSHOT_BYTES=PRESERVED
NATIVE_LOADING_DEFECT=DOCUMENTED
PHONE_BACK_CAST_VISIBILITY=OPEN_DEMAND
CREDITS_ENGINE=FUTURE_SPEC_ONLY
PRODUCT_PATCH=NOT_APPLIED
APK_INSTALL=NAO
SOURCE_CONFIGURATION_CHANGED_BY_AUDIT=NAO
PRIVATE_DATA_EXPORTED=NAO
SOURCE_CODE_MODIFIED=NAO
EXISTING_REPOSITORY_GIT_WRITE=NAO
SUPABASE_WRITE=NAO
DISTRIBUTION_BUILD=NAO
NEXT_GATE_STARTED=NAO
RESULT=DEVICE_AUDIT_COMPLETE_CORRECTIONS_BLOCKED_PREFLIGHT_AND_SOURCE
```
