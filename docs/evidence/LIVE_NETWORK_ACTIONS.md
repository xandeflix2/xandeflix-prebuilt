# CANON-01-LIVE-NETWORK-ACTIONS — evidências

# CANON-01-LIVE-NETWORK-ACTIONS — especificação anterior ao código

Pedido explícito atual amplia a UI Live e solicita aparelhos conectados para validação. Continuação isolada do gate encerrado NETWORK-UI-POLISH, recebido e root/L1 congelados. Sem Git/publicação/main, versão, dependências, config/manifest, escrita administrativa, identidade/licença, fonte/catálogo, buffer/C9 ou nativo. Allowlist nominal abaixo.

Telefone: apenas uma linha acima do player com título à esquerda e Início, Wi-Fi clicável, Cast e Configurações à direita; retirar total global, Voltar e contador de fonte do topo. Ícones44px; título reduz/ellipsis acessível quando necessário320px/Cast conectado, sem outra linha ou sobreposição. Wi-Fi verde somente internet validada pelo OS; cinza offline/portal/desconhecido/não confirmado, descrição acessível preserva distinção. Não sondar/provar internet a partir apenas de navigator.onLine. Botão abre modal Internet e conexão reutilizando trap/foco/fechamento existentes.

Tablet/TV: remover cabeçalho Live acima das colunas; preview inicia no topo da página, categorias/lista seguem layout existente. Barra abaixo do player: AO VIVO, Transmitir, Wi-Fi, Favorito, mantendo título/guia. Google Cast nativo já rejeita TV via CAST_NOT_MOBILE; mostrar Transmitir indisponível com descrição nesses aparelhos, sem inventar suporte nem mudar CastController. Tablet mantém funcionalidade existente. Retrato/quadrado entram no mesmo princípio, sem header extra e com ações compactas abaixo.

Modal: NetworkSettings passa a exibir contador informado pela fonte, usando a mesma readSourceConnections que revalida autoridade e ponteiro/generation antes/depois do GET64KiB; não inventar snapshot ou contagem, não mudar fonte/licença/C9. Consultas só durante janela aberta, a cada60s foreground, sem mídia. Sem snapshot prop explícita, a rotina segura resolve/verifica o ativo real; nenhum bypass. No Live, modal é informativo e medição fica bloqueada, com orientação a abrir Configurações com reprodução parada; guardar canUpdateSourceCatalog e Cast intactos. Configurações mantém teste manual5MB/15s e cancelamento. Não realizar download automático.

Modal aberto deve ocultar somente a superfície nativa usando obscured existente, sem interromper sessão, mídia ou heartbeat; combinar com prompt parental e restaurar ao fechar. Não tocar nativo/bridge. Back/Escape do diálogo fecha e devolve foco ao Wi-Fi sem navegar Live.

Baselines canon/check/test/C11 antes do patch:170 controles/28 suítes,904 protegidos,29 recibos. Preservar todos e222 testes Android/37 suítes e127 Prebuilt. Ajustar só assertion histórica do21º conjunto de rede que exige antigo topo/Back; manter seus21 casos e guardas. Recibo30 registra hashes/grants reais, sem predecessor inventado.13 comandos finais em sequência, QA real Chromium com portas simuladas de todos layouts/cliques/offline/cores/contador só no modal/foco/Cast conectado. Build/APK com3 plugins base reais e mesma versão/assinatura.

Entrega física interpretada do pedido de dispositivos ADB disponíveis para testes: update in-place apenas package com.xandeflix.prebuilt no celular SM-S926B, tablet SM-X610 e Fire AFTSS, mesma assinatura; sem uninstall/reset, PIN/PUK/bypass ou alteração de dados/fonte. Comparar privados em RAM antes/depois de install-r, sem exportar valores/hashes privados. Validar layout/modal pelos aparelhos acessíveis e declarar limitações verdadeiras; não impor três streams na mesma conta. Fonte do celular é distinta conforme último esclarecimento anterior; não mudar contas. Se aparelho bloqueado/offline, registrar e continuar nos disponíveis.

Novo recibo e documentos normativos append-only. Transcrição SHA256 cc12f95fd89066aadde151e26c90cacd71a02b3402d0f966bcc266239bc3fb7d registra instrução, não assinatura humana.

Allowlist (16):
- src/ui/components/ConnectionIndicator.tsx
- src/ui/components/NetworkSettings.tsx
- src/ui/components/NetworkConnectionButton.tsx
- src/ui/components/NetworkDiagnostics.css
- src/ui/components/CastButton.tsx
- src/ui/pages/LiveTvPage.tsx
- src/ui/pages/LiveTvPage.css
- scripts/test-network-diagnostics.mjs
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-LIVE-NETWORK-ACTIONS.json
- docs/architecture/LIVE_NETWORK_ACTIONS.md
- docs/evidence/LIVE_NETWORK_ACTIONS.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Test-scope clarification before code

The historical standalone landscape-navigation-browser script contains old UX assertions requiring Live Back/global count. Those assertions are superseded by the explicit current user request; that historical file remains byte-identical and is not claimed as PASS for this gate. Current canonical28 suites/170 controls and all21 network cases are retained; the single historical UI-declaration assertion is adapted without removing a case. New real-browser interaction/geometry coverage and physical ADB checks certify only the authorized new layout. No skips or fabricated results. Dialog is portaled to body to avoid header44px button rules leaking into modal; existing obscured API hides only native surface while open.


## Autorização

```text
PEDIDO EXPRESSO DO USUÁRIO — UTF-8/LF

em telas mobile, preciso que no topo da tela "canais ao vivo", tenha acima da tela do player apenas um linha. remova o quantitativo de canais ao vivo. remova o botao voltar. o indicador de wifi deve ficar verde quando hover internet e cinza quando estiver offline e dentro de um botao que ao ser clicado abre a janela "internet e conexoes". remova o indicador de quantidade de aparelhos conectados 0/1 e coloque dentro da janela "internet e conexao" no menu de configurações. coloque o botao indicador de wifi no lugar do botao voltar e todos os botoes alinhados a direita e o titulo a esquerda. o celular esta conectado via adb e os demais aparelhos. no tablet e no firestick/android tv, coloque o botao "transmitir" ao lado direito de "ao vivo" abaixo do player previo e esquerdo de favorito. coloque o indicdor de wifi aoldo direito do botao "transmitir". remova os botoes "voltar" e o indicadores de aparelhos contectados. como acima do player nao havera nenhum botao, alinhe o topo do player na borda superior da pagina.
```


## CANON-01-LIVE-NETWORK-ACTIONS — implementação local — 2026-10-24

Pedido explícito atual e escopo anterior ao código em docs/architecture/LIVE_NETWORK_ACTIONS.md; transcrição UTF-8/LF SHA256 cc12f95fd89066aadde151e26c90cacd71a02b3402d0f966bcc266239bc3fb7d, sem alegação de assinatura humana. Baseline canon/check/test/C11 PASS:170 controles/28 suítes,904 protegidos,29 recibos. Novo recibo30 registra7 componentes/estilos,1 teste existente e runner;16 caminhos totais. Todos21 casos de rede preservados; somente a assertion de declaração do topo antigo é adaptada ao pedido que remove Back/contador. Script browser histórico preservado com expectativas antigas e não declarado PASS neste gate; novo QA cobre a aceitação atual.

Telefone tem título e ações numa única linha; sem Voltar/total/contador fora do modal. Tablet/TV removem a faixa acima do vídeo e mostram AO VIVO/Transmitir/Wi-Fi/Favorito abaixo. Cast em TV permanece indisponível por restrição nativa existente, sem fingir capacidade. Wi-Fi verde validado/cinza sem confirmação abre modal portal body, com contador autenticado e medição bloqueada no Live. Configurações mantém teste manual/guardas anteriores. Superfície nativa usa obscured já existente, combinado com prompt parental; sessão/mídia/heartbeat não são encerrados para exibir o modal.

QA preliminar12 cenários de navegador passou: cores/linha/topo/ordem, contador somente durante modal, zero downloads automáticos, cancelamento/foco. Imagens são fixtures, não dispositivos. Tablet real antes do patch tinha cabeçalho de73,6px; Fire estava na Home; primeiro CDP do celular indisponível. Os13 comandos finais, APK e instalação física ainda PENDING neste registro. Nenhuma publicação/Git/admin/reset/versão ou próxima implementação.


## Ajuste nominal solicitado antes da compilação

Usuário solicita Transmitir somente ícone em tablet. Mesma allowlist16: CSS sob app-shell--tablet oculta apenas span de texto do botão Cast e fixa alvo44px, preservando SVG/aria-label/title/handler. TV mantém seu estado de disponibilidade; nenhuma regra nativa/Cast/C9 alterada. Transcrição cumulativa UTF-8/LF SHA256 335fbf6134da9868413a034309a650572afa5ab5841032bba298c38536ddb673. Refazer QA do layout sobre esse hash final antes dos13 comandos.


## Cumulative tablet authorization and final receipt inputs

Initial draft receipt and registration preserved in ignored INITIAL_RECEIPT.json and INITIAL_REGISTERED.json. This gate is still in progress; no historical receipt was changed. The cumulative UTF-8/LF request SHA256 is 335fbf6134da9868413a034309a650572afa5ab5841032bba298c38536ddb673. Final CSS keeps tablet Cast at44px with SVG only; aria-label/title/click remain.

```text
PEDIDO EXPRESSO DO USUÁRIO — UTF-8/LF

em telas mobile, preciso que no topo da tela "canais ao vivo", tenha acima da tela do player apenas um linha. remova o quantitativo de canais ao vivo. remova o botao voltar. o indicador de wifi deve ficar verde quando hover internet e cinza quando estiver offline e dentro de um botao que ao ser clicado abre a janela "internet e conexoes". remova o indicador de quantidade de aparelhos conectados 0/1 e coloque dentro da janela "internet e conexao" no menu de configurações. coloque o botao indicador de wifi no lugar do botao voltar e todos os botoes alinhados a direita e o titulo a esquerda. o celular esta conectado via adb e os demais aparelhos. no tablet e no firestick/android tv, coloque o botao "transmitir" ao lado direito de "ao vivo" abaixo do player previo e esquerdo de favorito. coloque o indicdor de wifi aoldo direito do botao "transmitir". remova os botoes "voltar" e o indicadores de aparelhos contectados. como acima do player nao havera nenhum botao, alinhe o topo do player na borda superior da pagina.

ATUALIZAÇÃO EXPRESSA DO USUÁRIO

O BOTAO TRANSMITIR BAIXO DO PLAYER PREVIO EM TABLET DEVE SER APENAS O ICONE SEM O TEXTO
```


## CANON-01-LIVE-NETWORK-ACTIONS — encerramento local — 2026-10-24

RESULT=LOCAL_READY_INSTALLED_AND_UI_VERIFIED. Telefone: uma linha acima do player, título à esquerda, Início/Wi-Fi/Cast/Configurações à direita; removidos Voltar, total global e contador de fonte. Tablet/TV: preview no topo da página e AO VIVO/Transmitir/Wi-Fi/Favorito abaixo. Em tablet Transmitir é apenas SVG, alvo44px, aria-label/title e função existentes mantidos. TV segue Cast indisponível por contrato nativo existente. Wi-Fi verde apenas com internet validada, cinza caso contrário; botão abre Internet e conexão. Contador real do provedor aparece somente nas janelas de conexão abertas. Medição de velocidade continua bloqueada no Live e manual em Configurações com guardas anteriores. Modal combina obscured existente com prompt parental, sem trocar URI, parar player ou suspender C9.

Baseline3 comandos exit0; sequência oficial final13/13 exit0. Canônico173 controles/28 suítes,905 arquivos protegidos,30 recibos com29 anteriores preservados;21 cenários de rede e127 Prebuilt mantidos. Android222 testes/37 suítes,0 falhas/erros/skips. QA Chromium12 cenários de componentes reais com portas simuladas: telefone320/360/393, Cast conectado/desconectado, tablet1365/1024, TV960/1280, retrato800 e quadrado768, Configurações390. Checados geometria, cores verde/cinza, ordem/44px, contador só no modal, zero download automático, cancelamento e retorno de foco. QA não representa medição de velocidade nem teste físico.

APK Xandeflix-v1.0.37-live-rede-acoes-20261024.apk, SHA256 034fe1c2d9aa6cc13cb7a738fe46a740e88dbde8ac9872a611943f4c6a257a0e, 11425238bytes, mesma1.0.37/code37/package/assinatura. Registro real3 plugins Capacitor base e NetworkStatus compilado/registrado, assets dist idênticos, permissões preservadas. Update in-place realizado nos3 aparelhos nominais; backup do APK anterior, certificado e SHA verificados, firstInstallTime e todos os registros privados medidos preservados. Apenas booleanos públicos persistidos, sem conteúdo ou hash privado; sem uninstall/reset. Validação física de UI: 3/3 PASS; resultados individuais anexados ao relatório. Hardware Back fecha modal sem sair de Live e devolve foco nos aparelhos aprovados. Continuidade de mídia/buffer e estabilidade prolongada não instrumentadas nesta emenda; não há alegação de correção do congelamento anterior.

Allowlist16; fonte recebida e root/L1 congelados, index vazio, HEAD/main/branch preservados. Documentos normativos append-only, nenhuma alteração de source transport, credenciais/licença, native/bridge/C9/buffer, versão/package/dependências/workflow/verificador, backend/admin ou publicação. Auth UTF-8/LF SHA256 335fbf6134da9868413a034309a650572afa5ab5841032bba298c38536ddb673; recibo blobLF e345e800a7a52d79241701cb5fd13f34bc699e01, SHA256 8c5e4c2d9e527729ec4c3af1c1d19b3dcc1425869975eba05349b299b45af4eb. Isso registra autorização explícita, não assinatura humana. Nenhum Git add/commit/push/PR/merge/main/deploy ou próxima implementação.


## Comandos oficiais

| Comando | Exit code |
| --- | ---: |
| `npm run canon:check` | 0 |
| `npm run canon:test` | 0 |
| `npm run c11:new-device:lock` | 0 |
| `npm run typecheck` | 0 |
| `npm run update:check` | 0 |
| `npm run security:check` | 0 |
| `npm run playback:check` | 0 |
| `npm run build` | 0 |
| `npm run site:build` | 0 |
| `C:\Program Files\nodejs\node.exe scripts/test-site-build-contract.mjs` | 0 |
| `C:\Program Files\nodejs\node.exe scripts/test-vercel-artifact-contract.mjs` | 0 |
| `C:\Program Files\nodejs\node.exe scripts/verify-vercel-artifact.mjs inspect` | 0 |
| `C:\Program Files\nodejs\node.exe scripts/test-vercel-prebuilt-contract.mjs` | 0 |

## Testes físicos reais

```json
{
  "installs": [
    {
      "model": "SM_X610",
      "at": "2026-10-24T23:49:07.773Z",
      "result": "PASS_IN_PLACE_UPDATE",
      "apkSha256": "034fe1c2d9aa6cc13cb7a738fe46a740e88dbde8ac9872a611943f4c6a257a0e",
      "previousApkSha256": "5475acf0067e9fb082614d69769713cf454a8d3f285284e603e9cf77e9e1d279",
      "packageId": "com.xandeflix.prebuilt",
      "firstInstallPreserved": true,
      "identityPreserved": true,
      "activationKeyPreserved": true,
      "activationPreserved": true,
      "secureSourcePreserved": true,
      "parentalPreserved": true,
      "catalogPointerPreserved": true,
      "allMeasuredRecordsPreserved": true,
      "measuredRecords": 11,
      "privateValuesOrDigestsPersisted": false,
      "reset": false,
      "uninstall": false
    },
    {
      "model": "SM_S926B",
      "at": "2026-10-24T23:50:02.624Z",
      "result": "PASS_IN_PLACE_UPDATE",
      "apkSha256": "034fe1c2d9aa6cc13cb7a738fe46a740e88dbde8ac9872a611943f4c6a257a0e",
      "previousApkSha256": "5475acf0067e9fb082614d69769713cf454a8d3f285284e603e9cf77e9e1d279",
      "packageId": "com.xandeflix.prebuilt",
      "firstInstallPreserved": true,
      "identityPreserved": true,
      "activationKeyPreserved": true,
      "activationPreserved": true,
      "secureSourcePreserved": true,
      "parentalPreserved": true,
      "catalogPointerPreserved": true,
      "allMeasuredRecordsPreserved": true,
      "measuredRecords": 11,
      "privateValuesOrDigestsPersisted": false,
      "reset": false,
      "uninstall": false
    },
    {
      "model": "AFTSS",
      "at": "2026-10-24T23:50:45.416Z",
      "result": "PASS_IN_PLACE_UPDATE",
      "apkSha256": "034fe1c2d9aa6cc13cb7a738fe46a740e88dbde8ac9872a611943f4c6a257a0e",
      "previousApkSha256": "5475acf0067e9fb082614d69769713cf454a8d3f285284e603e9cf77e9e1d279",
      "packageId": "com.xandeflix.prebuilt",
      "firstInstallPreserved": true,
      "identityPreserved": true,
      "activationKeyPreserved": true,
      "activationPreserved": true,
      "secureSourcePreserved": true,
      "parentalPreserved": true,
      "catalogPointerPreserved": true,
      "allMeasuredRecordsPreserved": true,
      "measuredRecords": 11,
      "privateValuesOrDigestsPersisted": false,
      "reset": false,
      "uninstall": false
    }
  ],
  "physical": [
    {
      "model": "SM_X610",
      "at": "2026-10-24T23:49:15.860Z",
      "scope": "OWN_APP_UI_ONLY",
      "privateSourceOrCredentialsRead": false,
      "networkSettingsChanged": false,
      "bandwidthTestRun": false,
      "opening": "NAVIGATED",
      "layout": {
        "live": true,
        "visible": true,
        "width": 1365,
        "height": 775,
        "phone": false,
        "header": {
          "x": 0,
          "y": 0,
          "width": 80.00000762939453,
          "height": 775.4667358398438,
          "right": 80.00000762939453,
          "bottom": 775.4667358398438
        },
        "content": {
          "x": 80.00000762939453,
          "y": 0,
          "width": 1285.3333740234375,
          "height": 775.4667358398438,
          "right": 1365.333381652832,
          "bottom": 775.4667358398438
        },
        "player": {
          "x": 640.0000610351562,
          "y": 0,
          "width": 725.3333740234375,
          "height": 408.0000305175781,
          "right": 1365.3334350585938,
          "bottom": 408.0000305175781
        },
        "title": null,
        "headerButtons": [
          {
            "x": 0,
            "y": 0,
            "width": 0,
            "height": 0,
            "right": 0,
            "bottom": 0
          }
        ],
        "oldBack": false,
        "oldTotal": false,
        "counterOutside": false,
        "network": {
          "x": 1257.7333984375,
          "y": 418.4000244140625,
          "width": 44.000003814697266,
          "height": 44.000003814697266,
          "right": 1301.7334022521973,
          "bottom": 462.40002822875977
        },
        "networkColor": "rgb(74, 222, 128)",
        "cast": {
          "x": 1207.7333984375,
          "y": 418.4000244140625,
          "width": 44.000003814697266,
          "height": 44.000003814697266,
          "right": 1251.7334022521973,
          "bottom": 462.40002822875977
        },
        "castText": "",
        "castLabel": "Transmitir pelo Google Cast",
        "castDisabled": false,
        "actionBoxes": [
          {
            "x": 1131.6083984375,
            "y": 429.4000244140625,
            "width": 70.125,
            "height": 22.000001907348633,
            "right": 1201.7333984375,
            "bottom": 451.40002632141113
          },
          {
            "x": 1207.7333984375,
            "y": 418.4000244140625,
            "width": 44.000003814697266,
            "height": 44.000003814697266,
            "right": 1251.7334022521973,
            "bottom": 462.40002822875977
          },
          {
            "x": 1257.7333984375,
            "y": 418.4000244140625,
            "width": 44.000003814697266,
            "height": 44.000003814697266,
            "right": 1301.7334022521973,
            "bottom": 462.40002822875977
          },
          {
            "x": 1307.7333984375,
            "y": 418.4000244140625,
            "width": 44.000003814697266,
            "height": 44.000003814697266,
            "right": 1351.7334022521973,
            "bottom": 462.40002822875977
          }
        ],
        "modalClosed": true
      },
      "dialog": {
        "open": true,
        "count": "1/2",
        "measurementDisabled": true,
        "portalBody": true,
        "bodyInset": 0.5333251953125,
        "withinViewport": {
          "top": 101.2166748046875,
          "bottom": 674.2500610351562,
          "height": 775
        }
      },
      "hardwareBack": {
        "live": true,
        "closed": true,
        "focusRestored": true,
        "counterUnmounted": true
      },
      "result": "PASS_PHYSICAL_UI",
      "mediaContinuity": "NOT_INSTRUMENTED_NO_BUFFER_STABILITY_CLAIM"
    },
    {
      "model": "SM_S926B",
      "at": "2026-10-24T23:50:12.229Z",
      "scope": "OWN_APP_UI_ONLY",
      "privateSourceOrCredentialsRead": false,
      "networkSettingsChanged": false,
      "bandwidthTestRun": false,
      "opening": "NAVIGATED",
      "layout": {
        "live": true,
        "visible": true,
        "width": 411,
        "height": 807,
        "phone": true,
        "header": {
          "x": 0,
          "y": 0,
          "width": 411.4285888671875,
          "height": 64,
          "right": 411.4285888671875,
          "bottom": 64
        },
        "content": {
          "x": 0,
          "y": 64,
          "width": 411.4285888671875,
          "height": 743.1428833007812,
          "right": 411.4285888671875,
          "bottom": 807.1428833007812
        },
        "player": {
          "x": 0,
          "y": 64,
          "width": 411.4285888671875,
          "height": 231.4285888671875,
          "right": 411.4285888671875,
          "bottom": 295.4285888671875
        },
        "title": {
          "x": 12.000000953674316,
          "y": 22.066965103149414,
          "width": 187.42857360839844,
          "height": 19.866071701049805,
          "right": 199.42857456207275,
          "bottom": 41.93303680419922
        },
        "headerButtons": [
          {
            "x": 205.42857360839844,
            "y": 10,
            "width": 44.000003814697266,
            "height": 44.000003814697266,
            "right": 249.4285774230957,
            "bottom": 54.000003814697266
          },
          {
            "x": 255.4285888671875,
            "y": 10,
            "width": 44.000003814697266,
            "height": 44.000003814697266,
            "right": 299.42859268188477,
            "bottom": 54.000003814697266
          },
          {
            "x": 305.4285888671875,
            "y": 10,
            "width": 44.000003814697266,
            "height": 44.000003814697266,
            "right": 349.42859268188477,
            "bottom": 54.000003814697266
          },
          {
            "x": 355.4285888671875,
            "y": 10,
            "width": 44.000003814697266,
            "height": 44.000003814697266,
            "right": 399.42859268188477,
            "bottom": 54.000003814697266
          }
        ],
        "oldBack": false,
        "oldTotal": false,
        "counterOutside": false,
        "network": {
          "x": 255.4285888671875,
          "y": 10,
          "width": 44.000003814697266,
          "height": 44.000003814697266,
          "right": 299.42859268188477,
          "bottom": 54.000003814697266
        },
        "networkColor": "rgb(74, 222, 128)",
        "cast": null,
        "actionBoxes": [],
        "modalClosed": true
      },
      "dialog": {
        "open": true,
        "count": "1/1",
        "measurementDisabled": true,
        "portalBody": true,
        "bodyInset": 0.8571434020996094,
        "withinViewport": {
          "top": 24.000001907348633,
          "bottom": 783.1428852081299,
          "height": 807
        }
      },
      "hardwareBack": {
        "live": true,
        "closed": true,
        "focusRestored": true,
        "counterUnmounted": true
      },
      "result": "PASS_PHYSICAL_UI",
      "mediaContinuity": "NOT_INSTRUMENTED_NO_BUFFER_STABILITY_CLAIM"
    },
    {
      "model": "AFTSS",
      "at": "2026-10-24T23:51:19.473Z",
      "scope": "OWN_APP_UI_ONLY",
      "privateSourceOrCredentialsRead": false,
      "networkSettingsChanged": false,
      "bandwidthTestRun": false,
      "opening": "NAVIGATED",
      "layout": {
        "live": true,
        "visible": true,
        "width": 960,
        "height": 540,
        "phone": false,
        "header": {
          "x": 0,
          "y": 0,
          "width": 56,
          "height": 540,
          "right": 56,
          "bottom": 540
        },
        "content": {
          "x": 56,
          "y": 0,
          "width": 904,
          "height": 540,
          "right": 960,
          "bottom": 540
        },
        "player": {
          "x": 456,
          "y": 0,
          "width": 504,
          "height": 283.5,
          "right": 960,
          "bottom": 283.5
        },
        "title": null,
        "headerButtons": [
          {
            "x": 0,
            "y": 0,
            "width": 0,
            "height": 0,
            "right": 0,
            "bottom": 0
          }
        ],
        "oldBack": false,
        "oldTotal": false,
        "counterOutside": false,
        "network": {
          "x": 852.40625,
          "y": 293.8984375,
          "width": 44,
          "height": 44,
          "right": 896.40625,
          "bottom": 337.8984375
        },
        "networkColor": "rgb(74, 222, 128)",
        "cast": {
          "x": 741.28125,
          "y": 293.8984375,
          "width": 105.125,
          "height": 44,
          "right": 846.40625,
          "bottom": 337.8984375
        },
        "castText": "Transmitir",
        "castLabel": "Transmitir pelo Google Cast",
        "castDisabled": true,
        "actionBoxes": [
          {
            "x": 664.9765625,
            "y": 304.90625,
            "width": 70.3046875,
            "height": 21.984375,
            "right": 735.28125,
            "bottom": 326.890625
          },
          {
            "x": 741.28125,
            "y": 293.8984375,
            "width": 105.125,
            "height": 44,
            "right": 846.40625,
            "bottom": 337.8984375
          },
          {
            "x": 852.40625,
            "y": 293.8984375,
            "width": 44,
            "height": 44,
            "right": 896.40625,
            "bottom": 337.8984375
          },
          {
            "x": 902.40625,
            "y": 293.8984375,
            "width": 44,
            "height": 44,
            "right": 946.40625,
            "bottom": 337.8984375
          }
        ],
        "modalClosed": true
      },
      "dialog": {
        "open": true,
        "count": "UNAVAILABLE",
        "measurementDisabled": true,
        "portalBody": true,
        "bodyInset": 1,
        "withinViewport": {
          "top": 24,
          "bottom": 516,
          "height": 540
        }
      },
      "hardwareBack": {
        "live": true,
        "closed": true,
        "focusRestored": true,
        "counterUnmounted": true
      },
      "result": "PASS_PHYSICAL_UI",
      "mediaContinuity": "NOT_INSTRUMENTED_NO_BUFFER_STABILITY_CLAIM",
      "providerCountAfterDeadline": {
        "safe": true,
        "open": true,
        "count": "2/2",
        "waitMs": 9000
      }
    }
  ]
}
```
