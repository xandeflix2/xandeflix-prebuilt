# Retorno do player ao episódio da série

26/10/2026 America/Sao_Paulo. Gate único CANON-01-SERIES-EPISODE-RETURN, solicitado explicitamente pelo usuário; código anterior integral fechado a70a2146 recebido de C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/phone-header-refinement-20261026/workspace. Preflight C:/Xandeflix/xandeflix-prebuilt-c11-main, origin https://github.com/xandeflix2/xandeflix-prebuilt.git, HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8, branch fix/source-output-format-recovery, main b3fc8d1e3844bc5601813ab1b298289af5b3f1fd; mesmas10 diferenças L1/index vazio preservados. Exceção histórica de branch recebida, não normalizar main. Pasta histórica somente leitura. AGENTS, Architecture/Execution, phased expansion, Source Boundary e C11 lidos.

## Especificação anterior ao código

Ao abrir episódio de uma temporada e fechar o player por Back, restaurar essa temporada, seleção e foco real no botão de reprodução desse episódio, com cartão visível, para tablet/Fire/Android TV. Implementação compartilhada também preserva toque/phone. Evidência de código: ParentalDetailGate refaz autorização ao visibilitychange e desmonta filhos enquanto verifica; SeriesDetailPage guarda índice de temporada só no próprio estado e useDetailInitialFocus escolhe trailer no mount. Não retirar/enfraquecer essa autorização.

Guardar em RAM no App somente uma posição UI {seasonId,episodeId,pendingFocus} para a rota atual series-detail e instância exata de CatalogReadModel. Passar ao filho através do gate já existente: sobrevive à remontagem temporária de autorização, mas descarta ao sair da rota, trocar série/modelo/catálogo. Não persistir posição UI em storage/backend, não registrar IDs reais. Temporada por identidade estável (não índice), seleção capturada antes da resolução. Não derivar retorno de histórico de outra série ou reprodução seguinte automática: retornar ao episódio explicitamente aberto na lista.

Após conteúdo autorizado e episódio materializado/habilitado, focar com preventScroll e tornar cartão visível sem animação. Pular foco inicial no trailer nessa remontagem. Se a página permaneceu montada, restaurar no retorno de visibility/focus depois de blur/hidden; nunca consumir a intenção prematuramente só porque open() resolveu antes da Activity esconder a WebView. Repetição de play/Back deve funcionar. Limpar rAF/listeners próprios no unmount; não roubar foco de dialog/aviso de erro; erro/negação de lançamento continua observável e não deixa intenção de retorno ao player. Se episódio/temporada desaparecer após recarga, fallback somente para controle disponível da temporada/seção, sem iniciar outro conteúdo. Nenhum timeout arbitrário, poll permanente ou mudança em native/player/C9/progresso/parental/autoplay/intro/layout.

## Verificação e entrega

Baseline CANON/check/test e C11 antes do patch. Teste novo de componentes reais em navegador local com catálogo sintético, reprodução simulada e gate parental real: segunda temporada/episódio intermediário, remount após hidden/visible, foco DOM/seleção/scroll, segunda volta, sem remount, carregamento atrasado, erro, remoção de episódio, saída/troca série/modelo, cleanup. Nenhuma mídia ou segredo real. Teste existente do callback mantém todas as expectativas e adiciona portas da intenção UI (sem alterar contratos do player). Runner preserva204 controles/34 suítes e acrescenta suíte nova. Recibo42 preserva41 anteriores; quatro normativos append-only.

Pedidos anteriores de consolidação permanente e APK final continuam aplicáveis ao mesmo produto: gerar APK atualizado e ZIP completo, nomes/hashes novos, sem instalar. CANON/C11/typecheck/update/security/playback/build/site/contratos; Gradle offline testDebugUnitTest/assembleDebug e auditoria assinatura/package/code37/name1.0.37/certificado/dist/1464 entradas nativas idênticas ao a70a2146. Sem Git commit/push/PR/merge/deploy/backend, instalação/reset/clear/reboot/uninstall ou acesso a PIN/PUK. Homologação física do novo APK permanece pendente; FAILs06 fora deste escopo abertos. Outputs ignorados normais e helpers sob tmp permitidos.

## Allowlist estrita

- src/App.tsx
- src/ui/pages/SeriesDetailPage.tsx
- scripts/test-series-episode-return.mjs
- scripts/test-c107-playback-pending-message.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/SERIES_EPISODE_RETURN.md
- docs/evidence/SERIES_EPISODE_RETURN.md
- docs/governance/authorizations/CANON-01-SERIES-EPISODE-RETURN.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

NEXT_GATE_STARTED=NAO.


## Emenda de fixture anterior ao ajuste do teste

O ensaio legado test-c11-episode-continue-row falha igualmente na fonte recebida por imports de apresentacao ausentes no mock (DetailBackdrop primeiro). Acrescentar esse script a allowlist apenas para completar portas herdadas de apresentacao/metadados/diagnostico, conservando todas as assertions de progresso/identidade/callback/cleanup e executando-as de novo. Nao alterar produto para satisfazer fixture nem enfraquecer teste. Estado UI inclui tambem launchPending em RAM para nao restaurar durante autorizacao/abertura ainda em andamento.


## Fechamento do retorno ao episodio

RESULT=SERIES_EPISODE_RETURN_APK_CONSOLIDATED_PHYSICAL_REVIEW_PENDING. APK C:/Users/Alexandre/Downloads/XANDEFLIX_RETORNO_EPISODIO_433a60d7.apk SHA256 433a60d77669430de4cc09b45db0b3f29760b2578d920d76f60ee9580ce18252.204 controles35 suites/939protegidos42recibos,16cenarios browser e ownershipApp, callback5 e continue-row PASS,13 checks e257 testesAndroid39suites PASS. PosicaoUI RAM por rota/serie/modelo, autorizacao preservada; APK novo ainda sem instalacao/homologacao fisica. Codigo integral/ZIP consolidado, root/base/41recibos preservados. Relatorio C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/series-episode-return-20261026/REPORT.md. FAILs06 fora do escopo abertos. NEXT_GATE_STARTED=NAO.
