# C11 — Contrato canônico de ativação de novos dispositivos

## Autorização, proveniência e escopo — 2026-10-03

O usuário confirmou ativação e carregamento do catálogo em novos dispositivos
com o APK entregue, e solicitou canonizar esse fluxo e investigar playback.
Confirmação física é relato do usuário, não execução instrumentada do agente.
Não equivale a homologação da reprodução: filmes/séries foram reportados como
não reproduzíveis. A afirmação anterior de validação física pendente dos dois
patches fica atualizada por este registro, limitada a ativação/carregamento.

Preflight: workspace/top-level `C:\Xandeflix\xandeflix-prebuilt-c11-main`,
origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, main, HEAD
`f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`, ahead 2. AGENTS, Architecture,
Execution e Source Data Boundary lidos. Baseline dirty: 57 hashes capturados.
CURRENT_GATE=NONE; ciclo local explicitamente autorizado, nenhum novo Gate.
Não autorizados commit/push/PR, backend, instalação, reset ou correção do player.

## Lock normativo

`LOCK_ID=C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1`

1. Instalação sem dados gera identidade e chave permanente de seis dígitos
   localmente, antes de depender da rede, com persistência verificada.
2. Concorrência, remount, reload e retry não rotacionam valores existentes.
   Leitura negada/pendente não é ausência. Instalações isoladas não herdam
   registros de identidade/chave/instalação/token de outro aparelho. O PIN de
   seis dígitos não exige unicidade global; o pareamento usa também o código
   do dispositivo. Chave não é uma licença nem autorização.
3. SHA-256 funciona sem Node no bundle, mesmo com Web Crypto indisponível,
   rejeitado ou pendente; singleton evita geração/registro A1 concorrentes.
4. Antes de AUTHORIZED, boot fica IDLE, sem resolver fontes nem falso alerta
   de licença inválida. Autoridade remota e políticas comerciais não são relaxadas.
5. Android usa scheme=https e exclui identidade, chave, ativação, token e dados
   WebView de backup/transferência; preservar demais dados e package canônico.
6. Após autorização e entrega, staging/promoção criam diretórios explicitamente
   para rename/copy. Erros de I/O não promovem candidato incompleto nem apagam
   identidade/ativação ou a geração ativa. Diretório existente exige stat directory.
7. Playback é fronteira independente. Falha no player não invalida nem regenera
   o dispositivo. Não contornar guard de sessão, revogação ou source boundary.

## Proteção executável obrigatória

Comando oficial: `npm run c11:new-device:lock`.

- Executa testes reais de ativação e promoção local, com fixtures isoladas.
- Verifica HTTPS, ausência de imports Node crypto na identidade, exclusões de
  backup e integração obrigatória do lock no prebuild.
- Suite ausente, timeout, exit não-zero ou falta do marcador completo = FAIL.
- Controles negativos provam que o verificador rejeita regressões conhecidas;
  não editar testes para aceitar o comportamento quebrado.
- `npm run build` executa o lock por prebuild, antes de tsc/Vite.

Qualquer alteração que toque identidade, ativação, boot, App/UI de ativação,
config Capacitor, backup Android, source delivery, storage ou build deve ler
este contrato, manter invariantes e executar o comando antes/depois do patch.
O comando também é obrigatório antes de cap sync, Gradle ou entrega de APK,
inclusive se o build for invocado sem lifecycle npm. É proibido remover o hook,
usar ignore-scripts para contorná-lo ou relaxar critérios sem autorização
explícita do usuário e emenda deste contrato. Falha bloqueia entrega e registra
erro; latest regression wins. CI futuro deve executar o mesmo comando.

Testes mitigam regressões cobertas; não são garantia matemática contra qualquer
bug, substituto da revisão de segurança ou prova de playback físico. A proteção
é local até publicação autorizada no Git; nenhuma política remota de branch foi
configurada nesta tarefa.

## Allowlist deste ciclo (especificação anterior aos testes novos)

- Este contrato e `docs/evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md`.
- `AGENTS.md`, Architecture Contract e Execution Contract: referência obrigatória
  ao lock, sem alterar Source Data Boundary ou gates anteriores.
- `package.json`: script oficial e hook prebuild, sem mudar dependências.
- `scripts/test-c11-new-device-activation-lock.mjs`: verificação agregada/negativos.
- `scripts/test-c11-new-device-activation.mjs`: caso de dois dispositivos isolados.
- `scripts/test-c11-clean-install-playback-diagnostic.mjs`: reprodução sintética
  read-only de defeito identificado; não altera código de produção.
- `docs/STATUS.md`, `docs/EVOLUTION_REPORT.md`, `docs/ERRORS_AND_BLOCKERS.md`.
- Saídas usuais do build web. APK e runtime consolidados não são reescritos.

## Aceitação

Lock e testes passam; controles negativos falham como esperado; build passa com
hook obrigatório; hash dos arquivos runtime consolidados e APK não muda.
Diagnóstico distingue defeito reproduzido de hipótese no dispositivo e identifica
a primeira fronteira quebrada ou pede evidência física, sem fix especulativo.

Referências: [ativação](C11_NEW_DEVICE_ACTIVATION_FIX.md),
[promoção](C11_CATALOG_PROMOTION_DIRECTORY_FIX.md),
[boundary](XANDEFLIX_PREBUILT_SOURCE_DATA_BOUNDARY.md).

## Sucessão autorizada — 2026-10-04

O usuário autorizou depois do diagnóstico a correção isolada de visibilidade
do erro de reprodução. Escopo/allowlist/aceitação definidos previamente em
[C11_PLAYBACK_ERROR_NOTICE_FIX](C11_PLAYBACK_ERROR_NOTICE_FIX.md). A antiga
proibição de corrigir player/build neste ciclo não impede esse novo patch local
expressamente aprovado. Todas as invariantes e o prebuild do lock permanecem
obrigatórios e intactos; não autoriza alterar ativação, autoridade, source,
cache, Git, backend, instalação ou iniciar próximo Gate.

O pedido posterior de carregamento do Fire Stick em <=60 segundos autoriza
um ciclo local separado de memória/desempenho, especificado antes do código em
[C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX](C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md).
Não modifica nenhuma invariância deste lock, não autoriza reset/rotação de chave,
backend/Git ou próximo Gate. Definição do marco e instalação física dependem
das respostas solicitadas; o tempo exige medição no aparelho, não presunção.

Usuário autorizou posteriormente uninstall/reinstall limpo SOMENTE do package
com.xandeflix.prebuilt no Fire Stick Wi-Fi, para teste físico de primeira
instalação, conforme emenda de teste no contrato acima. Isso permite remover
dados locais daquele package, não alterar lógica de ativação ou autoridade,
restaurar segredos, semear fonte ou operar o tablet/outros packages. Novo código
e nova chave devem surgir naturalmente no app; pareamento permanece legítimo.

Após falha física por OOM, usuário autorizou "prossiga" para corrigir retenção
residual preservando a nova ativação, sem novo uninstall/reset. Especificação e
allowlist prévias em [C11_FIRE_STICK_BRIDGE_RETENTION_FIX](C11_FIRE_STICK_BRIDGE_RETENTION_FIX.md).
Permite atualização APK in-place somente do Fire Stick, mesmo package/assinatura;
não altera invariantes deste lock, source boundary, políticas ou próximo Gate.

Usuário solicitou depois menu lateral apenas em paisagem não-phone, adiando
desempenho. Ciclo visual especificado em [C11_LANDSCAPE_SIDE_NAVIGATION](C11_LANDSCAPE_SIDE_NAVIGATION.md).
Mantém lock/hook prebuild e lógica de ativação/autoridade/catálogo/player intactos;
permite build/APK recuperável, não instalação/reset em aparelho ou próximo Gate.

Em seguida, usuário autorizou explicitamente instalar o APK no Fire Stick
primeiro. Emenda no contrato lateral permite install -r somente nesse aparelho,
mesma assinatura/package, hashes privados antes/depois comparados em memória.
Não permite uninstall/reset ou instalar no tablet/celular; ativação e identidade
continuam protegidas, desempenho adiado e próximo Gate não iniciado.

Usuário autorizou posteriormente atualizar in-place o tablet Samsung SM-X610,
RX2X301Q3KY, com o mesmo APK A806C1B2... já validado no Fire Stick e diagnosticar
busca->detalhes. Emenda em C11_LANDSCAPE_SIDE_NAVIGATION.md permite somente esse
alvo/package, lock/assinatura/hash e comparação privada antes/depois, sem reset,
rotação, outro aparelho, mudança de runtime/backend ou próximo Gate. A proibição
anterior de instalar no tablet é superseded apenas por essa entrega explícita.

Pedido posterior de retirar os dois badges técnicos do cabeçalho Live autoriza
somente remoção JSX de apresentação e testes/build/APK recuperável, conforme
emenda prévia em C11_LANDSCAPE_SIDE_NAVIGATION.md. Não altera nenhum handler,
foco, sessão, player, ativação/source, configuração ou invariância do lock;
não autoriza instalação/reset/backend/Git ou retomada da meta de 60 segundos.

Usuário em seguida autorizou instalar e confirmar o APK já validado do cabeçalho
Live: Fire Stick primeiro e, após resposta específica, tablet Samsung também.
Emenda em C11_LANDSCAPE_SIDE_NAVIGATION.md define alvos, hash, preservação dos
quatro privados/catálogo durante install -r e confirmação UI limitada. Nenhum
novo patch/build/reset/rotação/backend/Git ou próximo Gate autorizado.

Refinamento posterior de controles/identificação do preview Live para Fire e
tablet tem spec prévia em C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md: somente classes,
badge e CSS de apresentação, mesmos callbacks/ref/Media3/C9. Build/update -r
recuperáveis nos dois alvos sem reset; todas as invariantes/prebuild mantidos.
Não autoriza patch de ativação/source/native, backend/Git ou próximo Gate.

Pedido posterior de confirmação do canal/tap tablet para fullscreen tem spec
prévia C11_LIVE_FULLSCREEN_GESTURES.md. Permite somente evento de gesto nativo
sanitizado e reutilização do fullscreen do preview autorizado existente; não
altera ativação/autoridade/C9/source. Lock/prebuild e preservação in-place dos
dois alvos continuam obrigatórios; nenhuma rotação/reset/Git ou próximo Gate.
