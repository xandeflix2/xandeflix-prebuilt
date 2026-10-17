# C108 — sincronização da entrada no Fire Stick — 2026-10-14

Spec: [C11_STARTUP_PRESENTATION_ORDER](../architecture/C11_STARTUP_PRESENTATION_ORDER.md).
Preflight main/HEAD0f68f169/origin esperado, clone independente ativo. Auditoria
C107 anterior PASS: 37 alterações conhecidas e APK f769d1fc recuperável. Baseline
privado C108:1007 arquivos, dos quais999 fora da allowlist incremental preservados.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR/backend/reset.

## Causa e alteração

Antes, o componente nascia inativo e abria o diálogo num efeito passivo,
independentemente da Home já estar pronta. Observador da classe Fire também
podia iniciar a animação após a Home visível. Marcação por snapshot permitia
outra apresentação após troca do catálogo. Fixtures com o componente anterior
reproduziram modal desnecessário na Home rápida e modal tardio no perfil.

Agora a primeira decisão ocorre antes do paint, usando ref de âncora própria
(o ref do main pai ainda pode não ter sido atribuído no layout do filho).
Se já pronto, pula. Se pendente, reserva somente hero/faixas, mantendo DOM,
geometria e carregamento existentes. A primeira amostra em250ms também pode
pular a animação. Se continuar pendente, animação precede a liberação da Home.
Uma decisão por documento; mudar perfil/snapshot e retornar à Home não reabre.
Mesma instância suporta remontagem de efeitos do StrictMode.

Critérios40 capas,8 por faixa,500ms de estabilidade do modal, polling250ms,
deadline20s, Entrar agora/Back/foco/reduced-motion preservados. Cancelar no
update termina o tick sem novo timer. D-pad é liberado no próprio fechamento.
Sem mudanças em bootstrap, licença, ativação, fonte, catálogo, search, player,
arte/cache/download, navegação consolidada ou publicação de atualização.

## Validações

- TypeScript PASS.
- test-c11-startup-artwork:4 grupos PASS, limites40/8, leituras geométricas,
  fallback separado, estabilidade, deadline e cancelamento originais mantidos.
  Expectativas antigas de perfil tardio foram substituídas pela emenda C108.
- test-c108-startup-order:13 cenários PASS, componente/React real em Chrome,
  arte sintética, comparação antes/depois e deadline real20s. Resultado final
  em browser-order.json. Casos: rápido/cache/fallback, lento com/sem StrictMode,
  tablet, perfil tardio, retorno, snapshot/Entrar agora, unmount/Back/deadline.
- Retorno/foco de catálogo C107:11 grupos PASS.
- Lock antes e após patch/prebuild:26 ativação +27 promoção +9 negativos PASS.
- npm run build, cap sync e Gradle assembleDebug PASS. Avisos Vite de módulos
  Node externalizados, imports mistos e chunk grande existentes; não são
  uma falha de compilação nem autorizam refatoração de bundle neste ciclo.
- APK:7 assets dist idênticos,9 public contando2 stubs Cordova vazios,
  package esperado, min23/target35, mesma assinatura do APK C107, produção
  HTTPS local, sem devserver/logging. Snapshot privado confirma999 arquivos
  fora da allowlist inalterados, inclusive todos os demais refinamentos C107.

## Artefato

tmp/c108-startup-order/Xandeflix-v1.0.19-C108.apk
versionCode19/versionName1.0.19 de teste local; sem publicação no updater.
Tamanho:11.441.629 bytes.
SHA256:f1d562d1e6939e41a21fc3aec43ec0838edad5c04e44e93a13c1cb18de0f5582.
APK C107 preservado em tmp/c108-startup-order/Xandeflix-v1.0.19-before-C108.apk.

## Dispositivos e limites

Fire USB AFTSS/G071CQ070344374G estava conectado no preflight e desapareceu
antes da tentativa de instalação: verificação de modelo falhou antes de
pull/force-stop/install. Usuário reconectou; Windows reconheceu AFTSS em USB,
mas ADB permaneceu offline mesmo após reiniciar o servidor. Após solicitação
de habilitar/autorizar depuração, usuário escolheu instalar manualmente.
Instalação remota encerrada sem install/force-stop/reset/uninstall no aparelho.
Tablet SM-X610 conectado não é alvo de instalação deste ajuste Fire. Celular
segue para atualização manual por escolha do usuário. Instalação limpa física,
desempenho de primeiro catálogo e reprodução na Itália não foram certificados
pelos testes sintéticos desta apresentação.

INSTALL_FIRE=MANUAL_APK_BY_USER_CHOICE
PHYSICAL_STARTUP_ORDER=NOT_VALIDATED_REMOTE_INSTALL_CANCELED_BY_USER
ITALY_PLAYBACK=SEPARATE_INVESTIGATION_PENDING_DEVICE_DIAGNOSTIC

## Falha de harness e correção

Ao ampliar a fixture com deadline real20s, o limite original600 frames da
coleta encerrava o registro perto de10s, portanto a espera pelo frame final
expirou. O limite de registro foi aumentado para1800 frames, ainda limitado,
para observar o deadline; não foi alterado timeout, assert de ordenação ou
código de produção para aceitar esse resultado. Reexecução final13 cenários PASS.
