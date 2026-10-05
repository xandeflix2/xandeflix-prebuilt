# C11 — Chave permanente visível após autorização

## Autorização e especificação anterior ao código — 2026-10-05

Usuário confirmou "sim" à correção da exibição da mesma chave antes/depois da
ativação e atualização somente do celular, sem limpar dados ou alterar autorização.
Preflight C11/toplevel correto, origin xandeflix2/xandeflix-prebuilt, main,
HEAD995de5f767a14276bc2f4ca58944e4f7af95ca4e; index vazio, dirty conhecido do
ciclo anterior preservado. AGENTS/Architecture/Execution/Activation Lock/Source
Data Boundary lidos integralmente. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO;
GIT_COMMIT_PUSH_PR_AUTHORIZED=NAO; BACKEND_WRITE_AUTHORIZED=NAO.

Diagnóstico read-only: ActivationPage carrega a chave existente para todos os
status, mas o JSX da chave/cópia está dentro de effectiveStatus!==AUTHORIZED.
Arquivo da chave no celular presente e hash idêntico ao anterior à atualização;
nenhum segredo lido em claro. Condição já presente no HEAD, não introduzida pelo
atalho da Home. Logs recentes sem marcador de erro da chave; não prova ausência
de qualquer falha passada. UI autorizada omite a apresentação, não apaga a chave.

## Alteração mínima e invariantes

- Mover apresentação da chave e Copiar chave para o cartão comum do dispositivo,
  fora do formulário condicional; mostrar uma única chave em todos os status.
- Reutilizar deviceActivationKey/localKeyState carregados pelo efeito existente.
  Feedback da cópia separado do feedback do fluxo de nova ativação.
- Ajustar somente a referência espacial da instrução A1 para "exibidos nesta tela".
- Não modificar efeitos/serviços/geração/persistência/rotação/hashing, handlers de
  ativação/reativação/desvinculação, status efetivo, fonte, licença, boot ou player.
- Loading/erro continuam explícitos e cópia indisponível sem chave pronta; cópia
  usa clipboard local, sem request, log ou persistência adicional de segredo.
- Fluxo A1 e controles de nova ativação continuam ocultos após AUTHORIZED.
  Nenhuma função de troca de fonte ou reativação é acionada por revelar/copiar.

## Allowlist

- src/ui/pages/ActivationPage.tsx: apresentação comum e estado de feedback da cópia.
- scripts/test-c11-activation-key-visibility.mjs: renderer real com dependências
  isoladas, dados sintéticos, testes e servidor local de fixture somente em memória.
- Este documento; docs/evidence/C11_ACTIVATION_KEY_VISIBILITY.md;
  docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md.
- Saídas geradas usuais dist/Android build/assets/APK standalone; tmp para backup
  recuperável do APK anterior e capturas exclusivamente sintéticas.

## Aceitação e entrega

Lock canônico antes/depois/prebuild/antes da entrega; testes reais do JSX nos
status autorizado MANAGED/SELF_SERVICE, pendente/não registrado, transição,
loading/erro e clipboard sucesso/falha. Testar preservação dos efeitos/handlers
comparando AST com HEAD. Browser verifica fixture da página real e clipboard
mock, sem serviços/efeitos ativos, rede externa ou dados reais; celular320/390,
tablet/Fire layouts não recebem nova navegação. Build/cap sync/assembleDebug e
assinatura/package/assets verificados; backup do APK anterior antes de substituí-lo.

Instalação somente em Samsung SM-S926B/RXGYB03FL4W, characteristics=phone,
package com.xandeflix.prebuilt, install -r, mesma assinatura. Antes/depois comparar
cinco arquivos privados e todo catálogo por hashes em memória, sem conteúdo ou
hash particular nos logs/docs. Confirmar APK instalado/firstInstallTime. Sem
uninstall/clear/reset/rotação/launch automático, screenshots reais da chave, outro
dispositivo, publicação do painel/Git/backend ou novo Gate. Se alvo/assinatura/
proteção/preservação falhar, parar sem desinstalação alternativa.

Conferência visual física final pelo usuário; não certificar reprodução, HTTP403,
Fire<=60s ou beta>100. Skills de browser limitadas à fixture sintética local.
