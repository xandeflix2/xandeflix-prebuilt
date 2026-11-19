# CANON-01-NETWORK-UI-POLISH — especificação anterior ao código

Pedido atual autoriza apenas ajuste visual e relatório da funcionalidade de internet. Continuação isolada sobre CANON-01-NETWORK-DIAGNOSTICS; root/L1 e recebido congelados. Sem Git add/commit/push/merge/main, instalação/reset em dispositivos, backend, fonte, player, buffer, C9, versão ou dependências. APK recuperável de teste conserva assinatura/package/versão e registro real de plugins.

Diagnóstico: ações 18+/Configurações estão centralizadas pelo cabeçalho completo, enquanto ações Live ocupam primeira linha; corpo NetworkSettings não tem padding. Patch CSS somente: grade única para todas as ações no telefone (Início, estado+contagem, Voltar, Cast, 18+, Configurações), alvos44px e centralização comum, título/total em linhas próprias. Indicadores compactos podem empilhar internamente para caber320px; preservam informação/aria e posição à esquerda de Voltar. Seletores estritos não atingem tablet/TV. Janela recebe inset20–24px, ritmo16px, cards com largura mínima limitada à disponível, sem overflow e com scroll existente/foco acessível. Não alterar callbacks, DOM React, métrica, endpoint, guards, contador ou native.

Aceitação: todos controles e28 suítes anteriores preservados, pelo menos168 canônicos e222 testes nativos/37 suítes. Baseline canon/check/test/C11 antes do patch;13 comandos oficiais em sequência e build auditado depois. Teste de regressão nominal mais renderização real em Chromium de320/360/393px, tablet1280x800, TV1280x720, portrait800x1280 e square768x768; medir todas ações,44px, centros/bounds/ausência de sobreposição. Janela em320/390/1280 com inset mínimo20px, cards internos, scroll/foco/cancelamento sem solicitações automáticas. Fixtures não substituem teste físico.

Relatório distingue capturas enviadas pelo usuário (celular48,9Mbps/490ms; tablet98,6/212; Fire7,9/441;5MB cada) de testes instrumentados do agente. Não inventar velocidade, ping, bitrate ou simultaneidade; não certificar estabilidade/capacidade do provedor com teste Cloudflare. Teste físico da UI corrigida permanece pendente até instalação manual.

Novo recibo29 encadeado aos grants reais de2 CSS/runner e script novo; preservar28 recibos e prefixos normativos. Autorização SHA256 63c831c00022457ea95374e48e1379335099e704b93a4cf39295b9c77653ed84 é hash da transcrição, não assinatura humana.

Allowlist fechada (11):
- src/ui/components/NetworkDiagnostics.css
- src/ui/pages/LiveTvPage.css
- scripts/test-network-ui-polish.mjs
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-NETWORK-UI-POLISH.json
- docs/architecture/NETWORK_UI_POLISH.md
- docs/evidence/NETWORK_UI_POLISH.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Scope clarification before production patch

Closed allowlist reduced to10 paths; no new product test script or suite. Real browser geometry/interaction QA is an ignored fixture, avoids tests mirroring CSS. Canonical runner receives only required gate registration and receipt protection. Preserve all168/28 controls/suites and existing dedicated21 scenarios.
- src/ui/components/NetworkDiagnostics.css
- src/ui/pages/LiveTvPage.css
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-NETWORK-UI-POLISH.json
- docs/architecture/NETWORK_UI_POLISH.md
- docs/evidence/NETWORK_UI_POLISH.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## CANON-01-NETWORK-UI-POLISH — implementação local — 2026-10-24

Pedido atual autoriza alinhamento das ações mobile, respiro na janela de internet e relatório de três dispositivos. Especificação anterior ao código: docs/architecture/NETWORK_UI_POLISH.md, allowlist10; transcrição UTF-8/LF SHA256 63c831c00022457ea95374e48e1379335099e704b93a4cf39295b9c77653ed84, sem alegação de assinatura humana. Baseline real canon/check/test/C11 PASS,168 controles/28 suítes. Patch funcional restrito a2 CSS; nenhum callback, métrica, endpoint, guarda, contador, código nativo, player/buffer/C9 ou versão muda. Recibo29 encadeia {"src/ui/components/NetworkDiagnostics.css":"CANON-01-NETWORK-DIAGNOSTICS","src/ui/pages/LiveTvPage.css":"CANON-01-NETWORK-DIAGNOSTICS","scripts/test-canonical-regression.mjs":"CANON-01-NETWORK-DIAGNOSTICS"}. Capturas do usuário: celular48,9Mbps/490ms, tablet98,6/212, Fire7,9/441,5MB cada; não são medições instrumentadas pelo executor nem certificam estabilidade/provedor. Resultados finais dos13 comandos/APK serão anexados; nenhum dispositivo instalado/resetado.


## Revisão antes da certificação final

Revisão do Cast real identificou ação secundária de retorno ao aparelho quando conectado. CSS mobile preserva as ações principais na primeira linha e posiciona a secundária abaixo à direita com espaço reservado no título. Mesmo escopo de2 CSS e mesmos handlers. QA com componente Cast real passou14 cenários, incluindo conectado/desconectado em320/360/393px. A primeira sequência oficial foi interrompida pelo executor durante canon:test para incluir esse caso antes da entrega; exit4294967295 não é PASS. Logs/inputs/recibo preliminares preservados no diretório ignorado. Treze comandos serão executados novamente em sequência sobre os hashes refinados; nenhum resultado incompleto é homologação.


## Atualização expressa de escopo antes do patch — 24/10/2026

Usuário: “REMOVA O BOTAO +18 DA TELA DE CANAIS AO VIVO DO TOPO”. Mesmo gate visual, allowlist ampliada nominalmente para11 caminhos incluindo src/ui/components/Header.tsx. Condicionar somente o botão header-adult-button a currentView diferente de live; preservar outros menus e suas proteções/callbacks. Grade mobile redistribui cinco elementos principais, incluindo indicador antes de Voltar; retorno Cast permanece abaixo à direita. Nenhum controle parental/PIN ou rota adulta alterado. Atualizar recibo com grant Header encadeado ao predecessor real e SHA real da transcrição cumulativa e0d2f81db5da0de3cc14db475d982b2800b23f8e99e9302d7152ba2aa3b9aaeb. Sequência anterior interrompida por nova orientação do usuário, não homologada; repetir13 comandos sobre código final.
- src/ui/components/NetworkDiagnostics.css
- src/ui/pages/LiveTvPage.css
- src/ui/components/Header.tsx
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-NETWORK-UI-POLISH.json
- docs/architecture/NETWORK_UI_POLISH.md
- docs/evidence/NETWORK_UI_POLISH.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Última orientação antes do patch

Todos os ícones, inclusive retorno local do Cast quando conectado, devem ficar na mesma linha. Wi-Fi compacto apenas ícone (cor preserva estado, descrição em aria/title), sem palavra Wi-Fi nem ponto separado; manter contador numérico inline. Grade mobile acomoda Cast com1 ou2 botões em largura auto, sem segunda linha de ação. Título/quantidade são identificação abaixo, não botões. Mesma allowlist11,2 CSS/condição Header, nenhum callback/medidor/contador ou proteção parental modificado. Transcrição cumulativa SHA256 a047f5645fe32b01d9420bc79c8e3fd0ec7c6258b76d7ef70c442b2be80f42ef. Sequência r3 interrompida pela nova orientação antes de conclusão, não PASS.


## CANON-01-NETWORK-UI-POLISH — conclusão local — 2026-10-24

RESULT=LOCAL_READY_FOR_DEVICE_TEST. Patch funcional2 CSS e condição visual no Header: botão18+ ausente somente no topo Live; todos ícones de Live mobile, inclusive retorno Cast conectado, em uma única linha com alvos44px e Wi-Fi apenas ícone colorido, indicador diretamente antes de Voltar, título/total abaixo; corpo Internet e conexão com padding20–24px, ritmo16px e cartões adaptáveis. Nenhuma lógica de medição/fonte/player/C9, callback ou código nativo mudou. Baseline3 comandos PASS;13 comandos oficiais finais exit0. Canônico170 controles/28 suítes;21 cenários dedicados anteriores e127 Prebuilt preservados. Android222 testes/37 suítes reexecutados,0 falhas/erros/skips.

Browser QA:14 cenários com Cast real conectado/desconectado, telefone320/360/393 com todos cinco elementos da faixa de ações alinhados/sem sobreposição/altura44; tablet/TV/retrato/quadrado preservados;4 janelas com inset mínimo21px incluindo borda, cards internos, scroll quando necessário, zero teste automático, cancelamento/fechamento/foco PASS. Imagens renderizadas inspecionadas. RED anterior reproduziu desalinhamento/sobreposição mobile e inset1px/cards tocando borda. Primeira execução green usou uma aba sem prontidão de estado confirmado e mostrou contagem indisponível; harness passou a trazer a aba ao primeiro plano e esperar a fixture renderizada, sem alterar produto ou enfraquecer asserts. Uma tentativa inicial de preparação chamou indiretamente o inicializador anterior por nome de argumento e parou antes de escrever; corrigido somente modo do helper. Evidências preservadas. Primeira sequência oficial interrompida durante canon:test pelo executor para tratar ação secundária do Cast (exit4294967295, não PASS); Uma segunda sequência foi interrompida pela orientação adicional do usuário para remover o botão18+ Live, não por falha funcional;13 comandos finais executados novamente sobre o hash final. A sequência r3 também foi interrompida pela última orientação de linha única/ícone Wi-Fi. As três sequências incompletas não são PASS; logs e recibos preliminares preservados. Helpers de registro presumiram inicialmente predecessor do Header; leitura Git comprovou ausência de grant anterior e blob baseline66f5e2e19958214f714659c353604654023f99a1 idêntico ao recebido, usado diretamente sem supersedes inventado. Conferência SSR22 casos preservou todas outras telas e menu adulto.

APK Xandeflix-v1.0.37-internet-layout-linha-unica-20261024.apk,SHA256 5475acf0067e9fb082614d69769713cf454a8d3f285284e603e9cf77e9e1d279,11424266bytes, mesma1.0.37/code37/package/assinatura. Registro Capacitor real3 plugins base e NetworkStatus compilado/registrado, permissões preservadas e assets dist idênticos ao APK. Não instalado neste ciclo. Três medições físicas são capturas fornecidas pelo usuário no APK anterior: celular48,9Mbps/490ms; tablet98,6/212; Fire7,9/441;5MB cada. Não são medições instrumentadas pelo executor nem teste controlado de estabilidade/fonte. Relatório interpretativo em tmp/network-ui-polish-20261024/DEVICE_MEASUREMENTS.md. Congelamento Live continua separado e não corrigido por CSS.

Recibo29,28 anteriores preservados; allowlist11, documentos normativos append-only. Auth SHA256 a047f5645fe32b01d9420bc79c8e3fd0ec7c6258b76d7ef70c442b2be80f42ef, recibo blobLF 2fc3ce79b3a78454e7ad15f1d06002a6bc69d594, recibo SHA256 d86f9e3d7e589a480c9d396bee72601db01109217354df81d623b8a82aa0836c; transcrição não é assinatura humana. Root/L1 e recebido congelados. Nenhum Git add/commit/push/merge/PR/main, install/reset, backend admin, versão nova ou próxima implementação.
