# C77 ? Evidencia


### C77 ? Menu Configuracoes e dados de ativacao (2026-10-11)

Ativacao retirada da navegacao principal em todos os layouts. Configuracoes permanece no menu tablet/TV; no celular, engrenagem no topo em todas as telas compactas, com quatro atalhos no rodape. Tela Configuracoes preserva Ver dados de ativacao. Retorno Settings adota icones Home/Voltar existentes; espaco reservado aos alvos44px.
Browser9 layouts x7 telas com AppShell/Header/Settings/hooks reais e portas Live sinteticas PASS: uma engrenagem visivel, nenhuma entrada Ativacao no menu, Settings->ativacao->retorno, TV Search->Settings via D-pad, geometria/sem sobreposicao. Device3/nav18+3 e hook, lock22+27+9 antes/depois, TS/Vite/Gradle assembleDebug PASS. Regras do player/ativacao/source/cat/identidade intactas; Java nao alterado nem suites Java repetidas.
APK 12379300 bytes, SHA256 33C576C70970298FBBE9C8B40BDE4A720D2A7DE46B17BBDA560DE9646BA12D5F, package com.xandeflix.prebuilt v13/1.0, assinatura existente e7 assets byte-match verificados. tmp/c77-settings-navigation/xandeflix-configuracoes-menu.apk. Sem instalacao/backend/env/Git; QA fisica pendente. NEXT_GATE_STARTED=NAO.

Preflight/canon/allowlist em spec anterior ao codigo. Workspace/top-level independente correto, origin esperado/main/HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline864 privada posterior C76; dirty anterior preservado. CURRENT_GATE=NONE, nenhum novo Gate.

Alteracoes funcionais: Header icon/botoes e callback settings; AppShell classe settings mobile retorno; CSS visibilidade/espaco. SettingsPage/App/ActivationPage/identidade/playback/backend intactos. Revisao React aplicada aos dois TSX: mesmos callbacks e icones estaticos, nenhum hook/listener/fetch novo, button type/aria-label/title/aria-current e SVG decorativo, foco existente.

Layouts PHONE320x700/360x780/390x844/600x900/844x390, TABLET800x1280/1280x800, TV960x540/1280x720. Telas Home/Movies/Series/Search/Live/Settings/Activation. Activation no fixture e marcador de rota; nao solicita ativacao real/gera codigo/chave ou altera dados. Fluxo protegido permanece coberto pela suite de lock real com portas isoladas. Navegacao/SettingsPage/hooks reais; Live com ports sinteticos, sem streams reais. Capturas phone320 e TV960 inspecionadas. Testes do harness e screenshots nao equivalem a instalacao/QA fisica.

Erro inicial600/overlap320 e limite de geometria de Debug em dev registrados em ERRORS_AND_BLOCKERS. Build final posterior a CSS corrigido; avisos Vite fs/path/imports mistos/chunk, Gradle flatDir e META-INF apksigner existentes. Verificador privado compara7 arquivos dist com assets ZIP e valida package/assinatura; artefato pronto para teste.
