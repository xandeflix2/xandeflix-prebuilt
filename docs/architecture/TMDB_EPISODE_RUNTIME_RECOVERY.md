# CANON-01-TMDB-EPISODE-RUNTIME-RECOVERY

## Autorização e causa antes do código

Pedido atual: corrigir no Fire os metadados/imagens dos episódios de Uma Nova Mulher, continuando autonomamente a entrega local. Confirmação específica posterior: **Usar série confirmada por título e pôster + temporada/SxxExx explícitos, rejeitando conflitos e edições alteradas**. Esta decisão substitui SOMENTE as duas exigências que impedem esse caso: ano obrigatório mesmo com título/pôster exatos e prova individual adicional para o nome completo da série seguido por SxxExx. Título semelhante, número isolado, posição e quantidade continuam insuficientes.

DIAGNOSIS_INITIAL, PANEL_CASE_BEFORE, PANEL_CORROBORATION e PROVIDER_FIELDS comprovam: configuração TMDB aprovada existe mas não está no bundle1.0.39; série206180 resolvida com mesmo título/pôster, sem ano na fonte;24 episódios locais em3 temporadas,8 na temporada1; nomes explícitos S01E01…08, sem IDs individuais/sinopses/duração/stills corroborados; temporada pública1 fornece8 sinopses/stills. O primeiro helper usou seletor de página errado e outro leu season.title opcional: falhas dos leitores, corrigidas apenas fora do produto. PUBLIC_CASE_BEFORE usou objetos locais crus; PANEL_CASE_BEFORE usa exatamente os props reais da tela. Nenhuma suposição desses leitores será tratada como causa do app.

## Escopo e preservação

Novo clone independente com Git próprio, sem hardlinks, em EPISODE_TMDB_RECOVERY_20261028/workspace, overlay integral dos1493 caminhos aprovados de P2_50D_R1/workspace1.0.39. Dependências físicas, sem links; caches Gradle dos plugins podem ser regenerados. Preservar integralmente o1.0.39,1.0.38, workspace congelado, root histórico e51APKs. Registrar identidade/allowlist/hashes e comparar no fechamento. Sem commit/push/PR/deploy/backend administrativo/SET01; apenas atualização -r no mesmo Fire G071CQ070344374G, package/certificado existentes, sem reset/uninstall/clear/force-stop/reboot/troca de fonte. APK1.0.40/code40 será distinguível do1.0.39. Outros aparelhos somente recebem o APK para teste manual, sem instalação automática.

## Alterações mínimas autorizadas

1. src/catalog/episode-presentation.ts: confirmar série por título exato normalizado+pôster público exato quando o ano da fonte faltar; qualquer ano fornecido deve continuar exato. Manter ID explícito/kind válidos. Acrescentar caminho numerado apenas com identidade confirmada, título COMPLETO da série + marcador ancorado SxxExx, números iguais à hierarquia local e candidato público. Rejeitar IDs conflitantes/inválidos, números/temporadas divergentes, títulos adicionais/edições reunidas, duplicatas/distribuição incompatível e duração fortemente divergente. Nenhuma criação/remoção/reordenação de episódios ou alteração de fonte/streams/progresso; projeção somente de apresentação. Sem caso especial para o título informado.
2. src/ui/hooks/useEpisodeMetadata.ts: encaminhar a identidade confirmada ao projetor; mesmos efeitos/chave/cleanup/guardas.
3. scripts/build-isolated-public-config.mjs (novo): resolver explicitamente a configuração do root indicado pelo executor e injetar no env do subprocesso oficial npm run build SOMENTE a URL Supabase canônica, publishable e a chave TMDB existente de32hex. Não copiar .env, não gerar/rotacionar credenciais, não imprimir valores, não executar chamadas remotas; falhar antes do build se configuração necessária faltar. Preservar hooks/checkers/prebuild.
4. android/app/build.gradle: somente39→40 e1.0.39→1.0.40, mesmo package/certificado/player/segurança.
5. scripts/test-tmdb-episode-runtime-recovery.mjs (novo): casos reais sintéticos RED/GREEN de configuração, série sem ano com pôster exato, identificador completo, negativos acima, source/IDs/streams imutáveis. Testes herdados permanecem intactos. scripts/test-canonical-regression.mjs: apenas acrescentar46ºrecibo esperado e38ªsuite; todos204controles/37suites anteriores permanecem.
6. Nova spec/evidência/recibo canônicos e quatro normativos append-only. Não editar recibos históricos ou verifier. Se nova integração exigir outro caminho, revisar primeiro esta spec.

## Aceitação

Baseline CANON/check/test204/37+C11 antes do patch; novo RED e depois GREEN; typecheck, status8/refresh19, retorno/progresso/parental/episódios/imagens e regressão completa204/38, C11, security/playback/update, builds oficiais. Bundle avaliado com todas as três configurações em RAM, sem segredo administrativo. Capacitor oficial, Gradle offline257/39+assembleDebug; assinatura/manifest/package/version/CRC/assets/inventário DEX auditados contra1.0.39.

No Fire: snapshots privados comparados SOMENTE em RAM antes/depois de -r; hash/versão/firstInstallTime, mesma série e temporadas locais. Comparar sinopses/stills efetivamente exibidos com a resposta pública, imagens carregadas (não apenas URLs), troca de temporada e retorno/foco/controle de progresso, sem inventar homologação móvel ou disponibilidade universal. Concluir somente depois de corrigir e comprovar o caso informado; preservar todas as tentativas. Nada enviado ao Chat Mestre.

## Acompanhamento ao vivo solicitado durante o trabalho

Pedido posterior do usuário: manter conexão para acompanhar alterações no Fire e fechar empacotamento dos demais aparelhos ao final. Permite sessão CDP persistente e prévia transitória dos assets WEB locais já validados, mantendo https://localhost e o native1.0.39 instalado. Interceptar exclusivamente os arquivos públicos conhecidos do dist, sem mudar origem, configuração de segurança, backend ou dados. Recarregar após build aprovado, sem publicar build incompleto. Nenhum proxy de fonte/stream, credencial persistida ou endpoint remoto novo. Demais requisições seguem o caminho normal do app. A sessão deve poder restaurar imediatamente os assets instalados ao encerrar. Registrar a prévia separadamente de teste do APK1.0.40 final; só empacotar/instalar a entrega final depois da validação dessa prévia e regressões. Helpers/live session somente nesta pasta, sem novo código nativo ou caminho gerenciado.

### Refinamento antes do build Android de teste

A primeira tentativa Fetch/CDP foi inconclusiva: o documento continuou referindo o bundle instalado index-9AwXxFb6.js, enquanto o candidato é index-D701_Au4.js. Não há prova de que os assets candidatos foram executados. LIVE_INITIAL_OBSERVATION/LIVE_DIAGNOSTIC/LIVE_IDENTITY_DIAGNOSTIC e o FAIL LIVE_SYNOPSIS_MISMATCH permanecem; não são regressão do candidato não executado. Encerrar interceptação e restaurar cache/reload. Não contornar origem, CSP, bridge ou duplicar bootstrap por document.write para produzir prévia favorável.

O pedido de acompanhamento será atendido por conexão de observação persistente e atualização -r de APK de teste SOMENTE no Fire, depois de regressão/auditoria. Atualização foi autorizada no escopo inicial. O empacotamento público para os demais dispositivos ocorrerá só depois da prova no Fire. Nenhum novo caminho de produto, código nativo, chave ou dado privado alterado. Reconectar a observação após a troca de processo do Android, identificando o hash realmente executado.
