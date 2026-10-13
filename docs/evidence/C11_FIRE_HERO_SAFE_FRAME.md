# C11 — Enquadramento e sinopse dos heros Fire — C67 — 2026-10-10

Preflight read-only do clone C11-main/origin esperado/main/HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e; AGENTS, Architecture, Execution,
Source Boundary e activation lock lidos. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO.
Spec anterior ao código: docs/architecture/C11_FIRE_HERO_SAFE_FRAME.md, com
adendo antes do segundo patch/hook e pedido adicional da sinopse. Baseline
privado793 arquivos; dirty consolidado anterior preservado, sem Git writes.

Regressão do usuário invalida a afirmação C66 de enquadramento integral.
APK8: Home/Filmes/Séries com topo negativo; focusin/D-pad scrollIntoView(start)
consome padding. CSS exclusivo Fire: inset16–24px ou safe-area maior, padding
inicial e scroll-margin no hero/placeholder/detalhes. Altura75vh/min350/max620
mantida em viewports normais e limitada somente nas muito baixas para caber.
Build9 CSS-only passou110 medições em Chrome atual, mas falhou fisicamente:
WebView Chrome128 tinha scroll-margin16.2px e topo ainda -0.61/-0.80px. Nunca
considerar9 entrega final concluída; relatórios/artefato privados preservados.

Correção final: ramo Fire no RAF já existente calcula top absoluto pela
geometria + scrollY menos inset e usa uma window.scrollTo por frame. Mantidos
coalescing/cancelamento, foco/menus/fast paths e rolagem das demais plataformas.
Novo pedido explícito: .hero-overview nos heros Home/Filmes/Séries Fire +3px
(11→14px no aparelho), fallback18px nas resoluções sem variável compacta.
Títulos/gêneros/metadados e sinopse dos detalhes permanecem com seus estilos.
Sem alterações TSX, APIs, fontes de catálogo, cache, player nativo ou deps.

Browser com Hero/HeroPreparing/hook/CSS reais: 110 medições PASS,
3 páginas em960x540,1280x720,1920x1080,960x360; entrada, todos os controles,
troca de item, retorno rail/menu, placeholder; borda/botões inteiros, font+3
e console sem erros. Classes tablet/phone sem novo inset; não equivale a teste
físico nesses aparelhos ou fluxo vertical completo de phone. PNG inspecionado.
Fixture inicial reutilizava botão focado entre páginas sem focusin; corrigida
simulação de entrada, sem relaxar limites nem acomodar produção ao teste.
Suite hero5 grupos e rail/detail10 grupos PASS: casos anteriores retidos,
expectativas Fire atualizadas de chamada start para coordenada com margem;
1 leitura de geometria somente do hero na rolagem, seleção de episódios
continua estrutural. Progresso2 grupos PASS; sem testes de fonte real/backend.

Lock22+27+9 antes de build/sync/Gradle/delivery PASS; TypeScript/Vite/cap sync/
Gradle assembleDebug offline PASS. Warnings históricos chunk/externalização/
flatDir sem falha.162 resultados Java C65 reaproveitados, não rerodados neste
patch web; fontes nativas intactas. Package com.xandeflix.prebuilt/code10/name1.0,
standalone HTTPS, mesmo certificado,7 assets iguais dist/APK; bundle
dist/assets/index-DVPk43ok.js, CSS dist/assets/index-IWyQqsXk.css. APK 11012021 bytes,
SHA256 2DF46BC3E9473BCD98CE86A253A98E1F41D4BD7F82A445F536DB7BA1837E4DCC. PiP C65/buffer C63/Home C64/startup C66 preservados;
fechamento PiP físico anterior permanece pendente, independente desta demanda.

Instalação final10-r SOMENTE Fire Stick1/AFTSSS/serial verificado em
2026-10-10T22:21:44.959Z: APK instalado idêntico, firstInstallTime preservado,
1115 arquivos/1066 catálogo/
5 identidade/ativação/estado nativo e grupos
preferences/WebView/other iguais ao baseline imediatamente anterior a10.
Sem reset/uninstall; tablet/S24/Fire2 sem atualização. Na tentativa9, o app
reabriu antes da comparação integral; retomada confirmou identidade/ativação/
catálogo iguais, mas prefs2/WebView30/other2 registros mudaram após execução.
Não afirmar equivalência integral de todos os hashes desse evento9 e não
restaurar preferências/cache por cima do estado atual. App iniciou licenciado
sem tela de ativação na conferência; nenhuma modificação de licença/backend.

Fire960x540: processo novo com foco inicial observado sem injetar foco;
38 verificações e teclas Android D-pad físicas PASS. Controles do
hero, limite direito, esquerda/menu/retorno, descida ao rail e subida via
Ver todos para hero nas3 páginas. Sinopse14px e botões inteiros; capturas
reais inspecionadas. Entrada de página via botão de menu e movimentos de
retorno/controles por ADB; não afirmar teste exaustivo de todos os títulos.
Harness físico inicialmente exigiu direita no último controle permanecer no
hero principal, mas política espacial anterior pode ir ao rail. Assunção
indevida corrigida no helper, sem alterar produção ou relaxar enquadramento
quando hero focado; retorno por Ver todos e todos os controles conferidos.

| Página | Topo antes px | Topo depois px | Base depois px | Margem de scroll |
|---|---:|---:|---:|---|
| home | -1.00 | 16.20 | 421.20 | 16.2px |
| movies | -0.80 | 16.39 | 421.39 | 16.2px |
| series | -0.80 | 16.39 | 421.39 | 16.2px |

Fim: Home aberta com primeiro botão do hero focado; controle liberado.
Evidência garante o enquadramento observado na viewport deste aparelho,
não ausência de overscan em toda TV nem SLA de performance. Artefato final
Xandeflix-v1.0-build10-standalone.apk. Evidências privadas em tmp/c11-fire-hero-frame-20261010:
baseline/provenance, browser/PNGs, before/after, tentativas9, APK/install/hashes
privados e fire-frame/PNGs. Final exige zero fora da allowlist e HEAD igual.
