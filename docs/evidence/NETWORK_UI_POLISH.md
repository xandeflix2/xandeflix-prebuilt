# CANON-01-NETWORK-UI-POLISH — evidência

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

## Transcrição de autorização

```text
PEDIDO EXPRESSO DO USUÁRIO — UTF-8/LF

As imagens em anexo são referentes à implementação do teste de velocidade.

1. Primeiro, preciso que verifique a tela mobile. O alinhamento dos botões no topo estão desalinhados. Preciso que fique esteticamente alinhados para que não fique essa bagunça que está.

2. Em segundo, preciso que faça o ajuste da janela de internet e conexão. A borda da janela está tocando os elementos internos. Preciso que essa janela fique mais esteticamente elegante e viável.

3. E em terceiro, preciso que me faça um relatório informando os testes feitos nos três dispositivos e me informe como devo analisar esses dados.
```


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


## Transcrição cumulativa após orientação adicional

SHA256 e0d2f81db5da0de3cc14db475d982b2800b23f8e99e9302d7152ba2aa3b9aaeb UTF-8/LF.

```text
PEDIDO EXPRESSO DO USUÁRIO — UTF-8/LF

As imagens em anexo são referentes à implementação do teste de velocidade.

1. Primeiro, preciso que verifique a tela mobile. O alinhamento dos botões no topo estão desalinhados. Preciso que fique esteticamente alinhados para que não fique essa bagunça que está.

2. Em segundo, preciso que faça o ajuste da janela de internet e conexão. A borda da janela está tocando os elementos internos. Preciso que essa janela fique mais esteticamente elegante e viável.

3. E em terceiro, preciso que me faça um relatório informando os testes feitos nos três dispositivos e me informe como devo analisar esses dados.

ATUALIZAÇÃO EXPRESSA DO USUÁRIO

REMOVA O BOTAO +18 DA TELA DE CANAIS AO VIVO DO TOPO
```


## Última orientação antes do patch

Todos os ícones, inclusive retorno local do Cast quando conectado, devem ficar na mesma linha. Wi-Fi compacto apenas ícone (cor preserva estado, descrição em aria/title), sem palavra Wi-Fi nem ponto separado; manter contador numérico inline. Grade mobile acomoda Cast com1 ou2 botões em largura auto, sem segunda linha de ação. Título/quantidade são identificação abaixo, não botões. Mesma allowlist11,2 CSS/condição Header, nenhum callback/medidor/contador ou proteção parental modificado. Transcrição cumulativa SHA256 a047f5645fe32b01d9420bc79c8e3fd0ec7c6258b76d7ef70c442b2be80f42ef. Sequência r3 interrompida pela nova orientação antes de conclusão, não PASS.


## Transcrição final da autorização

UTF-8/LF SHA256 a047f5645fe32b01d9420bc79c8e3fd0ec7c6258b76d7ef70c442b2be80f42ef. Hash de transcrição, não assinatura humana.

```text
PEDIDO EXPRESSO DO USUÁRIO — UTF-8/LF

As imagens em anexo são referentes à implementação do teste de velocidade.

1. Primeiro, preciso que verifique a tela mobile. O alinhamento dos botões no topo estão desalinhados. Preciso que fique esteticamente alinhados para que não fique essa bagunça que está.

2. Em segundo, preciso que faça o ajuste da janela de internet e conexão. A borda da janela está tocando os elementos internos. Preciso que essa janela fique mais esteticamente elegante e viável.

3. E em terceiro, preciso que me faça um relatório informando os testes feitos nos três dispositivos e me informe como devo analisar esses dados.

ATUALIZAÇÃO EXPRESSA DO USUÁRIO

REMOVA O BOTAO +18 DA TELA DE CANAIS AO VIVO DO TOPO

ATUALIZAÇÃO EXPRESSA DO USUÁRIO

AINDA ESTA COM DUAS .LINHAS O TOPO. COLOQUE O INDICADOR DE WIFI APENAS COM O ICONE E ALINHANDO TODOS OS ICONES EM UMA LINHA
```


## CANON-01-NETWORK-UI-POLISH — conclusão local — 2026-10-24

RESULT=LOCAL_READY_FOR_DEVICE_TEST. Patch funcional2 CSS e condição visual no Header: botão18+ ausente somente no topo Live; todos ícones de Live mobile, inclusive retorno Cast conectado, em uma única linha com alvos44px e Wi-Fi apenas ícone colorido, indicador diretamente antes de Voltar, título/total abaixo; corpo Internet e conexão com padding20–24px, ritmo16px e cartões adaptáveis. Nenhuma lógica de medição/fonte/player/C9, callback ou código nativo mudou. Baseline3 comandos PASS;13 comandos oficiais finais exit0. Canônico170 controles/28 suítes;21 cenários dedicados anteriores e127 Prebuilt preservados. Android222 testes/37 suítes reexecutados,0 falhas/erros/skips.

Browser QA:14 cenários com Cast real conectado/desconectado, telefone320/360/393 com todos cinco elementos da faixa de ações alinhados/sem sobreposição/altura44; tablet/TV/retrato/quadrado preservados;4 janelas com inset mínimo21px incluindo borda, cards internos, scroll quando necessário, zero teste automático, cancelamento/fechamento/foco PASS. Imagens renderizadas inspecionadas. RED anterior reproduziu desalinhamento/sobreposição mobile e inset1px/cards tocando borda. Primeira execução green usou uma aba sem prontidão de estado confirmado e mostrou contagem indisponível; harness passou a trazer a aba ao primeiro plano e esperar a fixture renderizada, sem alterar produto ou enfraquecer asserts. Uma tentativa inicial de preparação chamou indiretamente o inicializador anterior por nome de argumento e parou antes de escrever; corrigido somente modo do helper. Evidências preservadas. Primeira sequência oficial interrompida durante canon:test pelo executor para tratar ação secundária do Cast (exit4294967295, não PASS); Uma segunda sequência foi interrompida pela orientação adicional do usuário para remover o botão18+ Live, não por falha funcional;13 comandos finais executados novamente sobre o hash final. A sequência r3 também foi interrompida pela última orientação de linha única/ícone Wi-Fi. As três sequências incompletas não são PASS; logs e recibos preliminares preservados. Helpers de registro presumiram inicialmente predecessor do Header; leitura Git comprovou ausência de grant anterior e blob baseline66f5e2e19958214f714659c353604654023f99a1 idêntico ao recebido, usado diretamente sem supersedes inventado. Conferência SSR22 casos preservou todas outras telas e menu adulto.

APK Xandeflix-v1.0.37-internet-layout-linha-unica-20261024.apk,SHA256 5475acf0067e9fb082614d69769713cf454a8d3f285284e603e9cf77e9e1d279,11424266bytes, mesma1.0.37/code37/package/assinatura. Registro Capacitor real3 plugins base e NetworkStatus compilado/registrado, permissões preservadas e assets dist idênticos ao APK. Não instalado neste ciclo. Três medições físicas são capturas fornecidas pelo usuário no APK anterior: celular48,9Mbps/490ms; tablet98,6/212; Fire7,9/441;5MB cada. Não são medições instrumentadas pelo executor nem teste controlado de estabilidade/fonte. Relatório interpretativo em tmp/network-ui-polish-20261024/DEVICE_MEASUREMENTS.md. Congelamento Live continua separado e não corrigido por CSS.

Recibo29,28 anteriores preservados; allowlist11, documentos normativos append-only. Auth SHA256 a047f5645fe32b01d9420bc79c8e3fd0ec7c6258b76d7ef70c442b2be80f42ef, recibo blobLF 2fc3ce79b3a78454e7ad15f1d06002a6bc69d594, recibo SHA256 d86f9e3d7e589a480c9d396bee72601db01109217354df81d623b8a82aa0836c; transcrição não é assinatura humana. Root/L1 e recebido congelados. Nenhum Git add/commit/push/merge/PR/main, install/reset, backend admin, versão nova ou próxima implementação.


## Leitura das capturas do usuário

# Internet e conexão — leitura das três capturas

Data de revisão: 24/10/2026. Origem: imagens enviadas pelo usuário. Estes testes foram executados pelo usuário nos aparelhos; o agente não executou nem cronometrou essas três medições. Cada imagem fornece uma amostra, sem comprovação de mesmas condições, horário simultâneo ou ausência de tráfego concorrente.

| Aparelho identificado pelo usuário/contexto | Download estimado | Resposta HTTP | Payload recebido | Estado mostrado |
| --- | ---: | ---: | ---: | --- |
| Celular | 48,9 Mbps | 490 ms | 5 MB | Wi-Fi; acesso validado pelo aparelho |
| Tablet | 98,6 Mbps | 212 ms | 5 MB | Wi-Fi; acesso validado pelo aparelho |
| Fire Stick | 7,9 Mbps | 441 ms | 5 MB | Wi-Fi; acesso validado pelo aparelho |

O Fire Stick apresentou a menor taxa nessa amostra: cerca de um sexto da taxa do celular e um décimo segundo da do tablet. Isso merece comparação controlada, mas não identifica defeito do APK, limitação do processador, roteador, interferência ou bloqueio do provedor. As três capturas chegaram a “Teste concluído” com 5 MB: esse caminho público respondeu e o download limitado terminou em cada aparelho naquele momento.

## O que cada medida informa

- **Download estimado (Mbps):** taxa de transferência do payload de até 5.000.000 bytes para o serviço público de teste. Mede o caminho até a Cloudflare, não o servidor da fonte. É uma amostra curta; não equivale ao teste completo do site/SDK oficial, que utiliza várias transferências. A implementação usa o endpoint oficial sem incorporar o SDK ou enviar resultados. [Projeto oficial Cloudflare Speedtest](https://github.com/cloudflare/speedtest).
- **Resposta HTTP (ms):** duração até a resposta do pedido inicial de 0 bytes, medida no aplicativo. Pode incluir resolução, conexão, TLS e processamento. Não é ping ICMP e não mede jitter, perda de pacotes ou latência do canal. Portanto, 490 ms não significa que cada quadro de vídeo atrase 490 ms.
- **Dados recebidos (MB):** payload contado pelo teste. Cada execução completa consome até 5 MB de payload; há também cabeçalhos e overhead de rede. Não representa armazenamento permanente do catálogo nem tamanho do buffer. A medição dura no máximo 15 segundos e pode terminar antes ao receber o limite. Fechar/cancelar interrompe o teste.
- **Wi-Fi com ponto verde:** o Android informa esse transporte e validação de acesso à internet. Não mede potência do Wi-Fi nem garante que o servidor da fonte esteja acessível. Uma rede pode ter acesso à internet e falhar com um serviço específico. [Android: estado e capacidades da rede](https://developer.android.com/develop/connectivity/network-ops/reading-network-state).
- **0/1, 1/2 ou 2/2:** dado retornado pelo provedor em `active_cons/max_connections`; não é uma contagem inventada pelo player. Pode atrasar e é atualizado em foreground a cada 60 segundos após a conclusão da consulta. A imagem do celular mostra 0/1 mesmo com vídeo: é uma divergência do dado reportado que precisa de investigação separada se persistir. Este ajuste visual não a converte artificialmente em 1/1. Ausência de resposta válida deve aparecer como indisponível, não como zero.

## Como comparar e relacionar às travadas

1. Faça os testes com a reprodução e o Cast parados. Interrompa também downloads e outras reproduções na rede durante a comparação. Confirme qual conexão cada aparelho usa; não presuma que estão no mesmo roteador ou caminho.
2. Execute três testes por aparelho, um de cada vez, mantendo posição/rede semelhantes e anotando horário, taxa e resposta HTTP. Compare a mediana e a variação. Três testes completos em cada um dos três aparelhos consomem até 45 MB de payload no total, além do overhead.
3. Se somente o Fire Stick continuar muito abaixo dos demais, compare sinal/posição/banda Wi-Fi e caminho de rede. Isso ajuda a isolar uma diferença local; esta amostra sozinha não aponta qual componente falhou.
4. Para vídeo estável, a taxa sustentada precisa superar o bitrate real do conteúdo com margem para variações e outras telas. O bitrate do canal não foi medido aqui. 7,9 Mbps não garante nem impede todo conteúdo FHD: depende da transmissão. Duas telas somam consumo no link compartilhado. Resolução/nome do canal não bastam para calcular a necessidade.
5. Se o teste público estiver estável, mas o canal congelar, ainda é necessário observar o caminho da fonte, a entrega HLS/TS, o buffer e a recuperação do player. O teste público não certifica esses elementos. A queda longa relatada continua uma ocorrência separada e não foi corrigida por CSS.

## Limites das evidências anteriores

O teste instrumentado anterior de 10 min 34 s, sem queda observada no tablet e Fire Stick, pertence ao APK R2 anterior à função de diagnóstico. Ele não é uma homologação deste APK nem invalida o congelamento relatado pelo usuário. A validação automática de layout desta correção usa componentes reais em navegador com rede/fonte sintéticas; seus valores de velocidade não são medições físicas. A aparência corrigida nos aparelhos depende de instalação do APK novo e conferência no dispositivo.
