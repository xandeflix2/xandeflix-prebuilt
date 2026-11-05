# Espaçamento superior móvel — Home, Filmes e Séries

Gate CANON-01-MOBILE-CATALOG-HEADER-SPACING. Pedido explícito do usuário e continuação, SHA256 da transcrição 3c8d9b7948d274b09f4d39a1d6f7c4e0807ff6767fbb308eb463eacda448e09b. Alteração local mínima e geração de APK de teste para revisão autorizadas pelo pedido de ajuste do app; nenhuma instalação nova autorizada. O consentimento anterior de instalarfd82 era nominal ao celular e àquele binário. Não estender para novo APK/Fire/tablet. Conexões Wi-Fi dos três aparelhos autorizadas; trust existente foi suficiente, nenhum código de pareamento persistido.

Preflight: root operacional C:/Xandeflix/xandeflix-prebuilt-c11-main, HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8, branch fix/source-output-format-recovery, main b3fc8d1e3844bc5601813ab1b298289af5b3f1fd, origin canônico https://github.com/xandeflix2/xandeflix-prebuilt.git. Mesmas10 diferenças L1/index vazio. Clone isolado com overlay integral do último candidato fechadoC:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/intro-video-phone-update-20261026; não reconstruir da main e não editar pasta histórica. AGENTS, Architecture/Execution Contract, phased expansion, C11 e Source Data Boundary lidos. Fechamento anterior confirma intro somente vídeo no celular, sem alteração funcional posterior; fonte/testes/config/39 recibos recebidos imutáveis fora da allowlist.

## Especificação anterior ao código

A leitura DOM somente de geometria no celular confirmou viewport411×807 CSS/DPR3.5, header64px, padding8px acima/abaixo, ações44px, hero y80px e padding da página16px. Não houve navegação, captura CDP, CSS injetado ou alteração de viewport no aparelho; forward próprio fechado. Reduzir header para56px e padding vertical6px; reduzir espaço entre final do header e hero para8px. Preservar safe-area-inset-top/left/right/bottom, statusbar nativa, áreas de toque44px, rótulos/foco, logo, tamanho do hero e seus botões. Adicionar classe de apresentação ao AppShell somente para rotas home/movies/series, limitando regras a telas até600px sem sidebar/tablet/television/square. Não mudar Busca/Configurações/Detalhes/Live, tablet/TV/Fire/desktop, orientação, inset nativo, dados, navegação, players, intro ou marca.

## Verificação e governança

Executar baseline CANON/check/test e C11 antes do patch. Novo recibo40 protege deltas reais e preserva39 anteriores; runner apenas reconhece nova emenda, sem remover controles204/suítes34. No teste de navegador existente, substituir somente expectativa64px de Home/Filmes/Séries pelo requisito56px; Busca continua64px. Exigir botões44px contidos e centrados, padding8px, ausência de sobreposição/overflow em320/390/430px; verificar demais layouts preservados. Comparação visual/geométrica local antes/depois com componentes/CSS reais e dados sintéticos sem rede/credenciais. Testes locais não são homologação física de um APK ainda não instalado.

Após fontes congeladas: CANON/check/test/C11, typecheck, update/security/playback/build/site e contratos oficiais de artefato; browser focado; Gradle unit/assembleDebug offline com C11 antes e depois. Registry oficial Capacitor, auditoria SHA/package/cert/assets/dist e ausência04. Versão1.0.37/code37/package/cert originais preservados; APK com novo nome/hash, sem sobrescrever anteriores. Não enfraquecer verificador nem atualizar recibo histórico. Sem install/uninstall/clear/reset/reboot, fonte/backend/Git/publicação. FAILs06 permanecem abertos. Rollback local: stage fechado recebido; físico requer autorização nominal. Quatro normativos append-only. NEXT_GATE_STARTED=NAO.

## Allowlist estrita

- src/index.css
- src/ui/components/AppShell.tsx
- scripts/test-c11-landscape-navigation-browser.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/MOBILE_CATALOG_HEADER_SPACING.md
- docs/evidence/MOBILE_CATALOG_HEADER_SPACING.md
- docs/governance/authorizations/CANON-01-MOBILE-CATALOG-HEADER-SPACING.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Ajuste do ensaio herdado, antes do patch funcional

O browser herdado falhou antes de renderizar (root vazio), ainda na baseline: o adaptador isolado de native-android-player.bridge.ts n?o exportava addNativeLiveActionListener e setNativeLiveControls, j? importados pela LiveTvPage recebida. Diagn?stico CDP isolado confirmou SyntaxError de export ausente. Completar somente esses exports no stub de testes (listener remov?vel sem eventos, controls sem opera??o), sem alterar bridge/player real nem crit?rios de sucesso. Mesma allowlist. Validar baseline do browser com stub completo antes da mudan?a de CSS. Timeout secund?rio Fetch.continueRequest durante fechamento n?o certifica falha do produto. Um helper diagn?stico inicialmente foi chamado do cwd root; guard RUN_ONLY_IN_C11_WORKSPACE parou sem muta??o e chamada foi corrigida para stage.

A leitura completa dos imports do Live confirmou tamb?m addNativePreviewPlayingListener ausente no mesmo stub. Completar os tr?s exports de listener/controles apenas no adaptador isolado. Nenhuma API de produ??o muda.


## Plano final de compara??o local, ainda antes do produto

Com os exports completados somente na c?pia diagn?stica externa, a baseline renderizou root=1. O helper antigo continuou esperando seis itens de menu, enquanto Header recebido possui sete (inclui Configura??es); seu cen?rio amplo tamb?m usa Ativa??o removida desse menu. N?o ampliar este patch para refazer o ensaio antigo de navega??o/Live. Na allowlist do teste herdado, atualizar somente as duas expectativas de altura substitu?das pelo pedido e verificar padding8px; nenhum stub novo ser? inclu?do no arquivo gerenciado. O runner oficial n?o usa esse browser antigo. Usar compara??o visual/geom?trica focada em servidor isolado com AppShell/Header/CSS reais antes/depois, renderiza??o SSR, hooks de apresenta??o/parental sint?ticos e hero delimitador com classes reais, sem players/backend. Confirmar baseline64/16 e candidato56/8, a??es/foco/overflow e igualdade de geometria em rotas/layouts exclu?dos. O ensaio amplo antigo fica INCONCLUSIVO por harness desatualizado; n?o chamar a tentativa de PASS.


## Cabeçalho móvel compacto — fechamento local

RESULT=MOBILE_CATALOG_HEADER_SPACING_APK_VALIDATED_PHYSICAL_PENDING. Home/Filmes/Séries móveis:56px header com inset,6px padding,8px até hero; redução16px nas larguras320–430,4px na fronteira600. Comparador SSR 42 casos PASS;204 controles/34 suítes,13 checks oficiais,257 testes Android/39 suítes, build e auditoria PASS. Native/intro byte idênticos; APK C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-cabecalho-compacto-20261026.apk SHA256 01b14a17b0db81ed2e7ac3243652d2acb306683f5e4da4d2c3d281ee20a726ec. Três aparelhos conectados via Wi-Fi; novo FireAFTSSS identificado. Nenhuma instalação nova. Ensaio amplo herdado inconclusivo por fixture/menu desatualizados; comparador focado final válido, tentativas preservadas.40 recibos,39 históricos e base/root preservados. Relatório C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/mobile-header-spacing-20261026/REPORT.md. NEXT_GATE_STARTED=NAO.
