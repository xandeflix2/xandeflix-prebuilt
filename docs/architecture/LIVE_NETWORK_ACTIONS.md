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


## CANON-01-LIVE-NETWORK-ACTIONS — implementação local — 2026-10-24

Pedido explícito atual e escopo anterior ao código em docs/architecture/LIVE_NETWORK_ACTIONS.md; transcrição UTF-8/LF SHA256 cc12f95fd89066aadde151e26c90cacd71a02b3402d0f966bcc266239bc3fb7d, sem alegação de assinatura humana. Baseline canon/check/test/C11 PASS:170 controles/28 suítes,904 protegidos,29 recibos. Novo recibo30 registra7 componentes/estilos,1 teste existente e runner;16 caminhos totais. Todos21 casos de rede preservados; somente a assertion de declaração do topo antigo é adaptada ao pedido que remove Back/contador. Script browser histórico preservado com expectativas antigas e não declarado PASS neste gate; novo QA cobre a aceitação atual.

Telefone tem título e ações numa única linha; sem Voltar/total/contador fora do modal. Tablet/TV removem a faixa acima do vídeo e mostram AO VIVO/Transmitir/Wi-Fi/Favorito abaixo. Cast em TV permanece indisponível por restrição nativa existente, sem fingir capacidade. Wi-Fi verde validado/cinza sem confirmação abre modal portal body, com contador autenticado e medição bloqueada no Live. Configurações mantém teste manual/guardas anteriores. Superfície nativa usa obscured já existente, combinado com prompt parental; sessão/mídia/heartbeat não são encerrados para exibir o modal.

QA preliminar12 cenários de navegador passou: cores/linha/topo/ordem, contador somente durante modal, zero downloads automáticos, cancelamento/foco. Imagens são fixtures, não dispositivos. Tablet real antes do patch tinha cabeçalho de73,6px; Fire estava na Home; primeiro CDP do celular indisponível. Os13 comandos finais, APK e instalação física ainda PENDING neste registro. Nenhuma publicação/Git/admin/reset/versão ou próxima implementação.


## Ajuste nominal solicitado antes da compilação

Usuário solicita Transmitir somente ícone em tablet. Mesma allowlist16: CSS sob app-shell--tablet oculta apenas span de texto do botão Cast e fixa alvo44px, preservando SVG/aria-label/title/handler. TV mantém seu estado de disponibilidade; nenhuma regra nativa/Cast/C9 alterada. Transcrição cumulativa UTF-8/LF SHA256 335fbf6134da9868413a034309a650572afa5ab5841032bba298c38536ddb673. Refazer QA do layout sobre esse hash final antes dos13 comandos.


## CANON-01-LIVE-NETWORK-ACTIONS — encerramento local — 2026-10-24

RESULT=LOCAL_READY_INSTALLED_AND_UI_VERIFIED. Telefone: uma linha acima do player, título à esquerda, Início/Wi-Fi/Cast/Configurações à direita; removidos Voltar, total global e contador de fonte. Tablet/TV: preview no topo da página e AO VIVO/Transmitir/Wi-Fi/Favorito abaixo. Em tablet Transmitir é apenas SVG, alvo44px, aria-label/title e função existentes mantidos. TV segue Cast indisponível por contrato nativo existente. Wi-Fi verde apenas com internet validada, cinza caso contrário; botão abre Internet e conexão. Contador real do provedor aparece somente nas janelas de conexão abertas. Medição de velocidade continua bloqueada no Live e manual em Configurações com guardas anteriores. Modal combina obscured existente com prompt parental, sem trocar URI, parar player ou suspender C9.

Baseline3 comandos exit0; sequência oficial final13/13 exit0. Canônico173 controles/28 suítes,905 arquivos protegidos,30 recibos com29 anteriores preservados;21 cenários de rede e127 Prebuilt mantidos. Android222 testes/37 suítes,0 falhas/erros/skips. QA Chromium12 cenários de componentes reais com portas simuladas: telefone320/360/393, Cast conectado/desconectado, tablet1365/1024, TV960/1280, retrato800 e quadrado768, Configurações390. Checados geometria, cores verde/cinza, ordem/44px, contador só no modal, zero download automático, cancelamento e retorno de foco. QA não representa medição de velocidade nem teste físico.

APK Xandeflix-v1.0.37-live-rede-acoes-20261024.apk, SHA256 034fe1c2d9aa6cc13cb7a738fe46a740e88dbde8ac9872a611943f4c6a257a0e, 11425238bytes, mesma1.0.37/code37/package/assinatura. Registro real3 plugins Capacitor base e NetworkStatus compilado/registrado, assets dist idênticos, permissões preservadas. Update in-place realizado nos3 aparelhos nominais; backup do APK anterior, certificado e SHA verificados, firstInstallTime e todos os registros privados medidos preservados. Apenas booleanos públicos persistidos, sem conteúdo ou hash privado; sem uninstall/reset. Validação física de UI: 3/3 PASS; resultados individuais anexados ao relatório. Hardware Back fecha modal sem sair de Live e devolve foco nos aparelhos aprovados. Continuidade de mídia/buffer e estabilidade prolongada não instrumentadas nesta emenda; não há alegação de correção do congelamento anterior.

Allowlist16; fonte recebida e root/L1 congelados, index vazio, HEAD/main/branch preservados. Documentos normativos append-only, nenhuma alteração de source transport, credenciais/licença, native/bridge/C9/buffer, versão/package/dependências/workflow/verificador, backend/admin ou publicação. Auth UTF-8/LF SHA256 335fbf6134da9868413a034309a650572afa5ab5841032bba298c38536ddb673; recibo blobLF e345e800a7a52d79241701cb5fd13f34bc699e01, SHA256 8c5e4c2d9e527729ec4c3af1c1d19b3dcc1425869975eba05349b299b45af4eb. Isso registra autorização explícita, não assinatura humana. Nenhum Git add/commit/push/PR/merge/main/deploy ou próxima implementação.
