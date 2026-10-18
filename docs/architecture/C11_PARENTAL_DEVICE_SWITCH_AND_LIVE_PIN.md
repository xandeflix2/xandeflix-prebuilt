# C160 — controle local opcional e PIN dos canais adultos — 2026-10-18

Pedido expresso: opcao de desativar controle parental neste aparelho;
canais comuns livres do filtro parental e modal de PIN ao selecionar adulto.
Preflight clone independente/main/origin canonicos, HEAD8477a5e21c6b527e16ec9b4653496b4818e28dfb
limpo; AGENTS/Architecture/Execution/Source Boundary/Activation Lock/C126 lidos.
CURRENT_GATE=NONE, ciclo localC160 autorizado pelo pedido, sem proximo Gate.
Git/publicacao continuam autorizados no escopo em curso; PR/backend/install=NAO.

## Emenda limitada antes do codigo

- Desativar significa suspender limites de idade e regras de conteudos comuns
  neste aparelho. Adulto explicito continua excecao protegida: cadastro,
  allowAdult, limite18 e PIN/sessao/grant existentes permanecem necessarios.
  PIN web e autenticacao comercial/licenca/C9 nao mudam.
- Administracao ja autenticada pelo PIN atual oferece botao Ativar/Desativar.
  Persistir boolean enabled opcional no registro v1 local existente; ausente
  significa true, tipo invalido falha fechado. Nao apagar PIN/PUK/regras/politica,
  tentativas/cooldown nem sincronizar. Escrita verificada, erro falha fechado.
  Reativar invalida grants/prompts, atualiza contentRevision e volta a aplicar
  as mesmas preferencias. Nenhuma nova identidade ou recuperacao sem PUK.
- Canais comuns nao pedem PIN nem somem por idade ausente, classificacao ou
  alwaysPin manual. Marcacao adulta da fonte ou regra adulta local permanece.
  Erro do registro parental continua fail closed; nao mudar filtros adultos.
- Correcao identificada: authorizeParentalLive chama authorize de adulto antes
  de desbloquear sessao; recebe ADULT_DISABLED em vez de abrir prompt.
  Selecionar adulto elegivel sem sessao deve solicitar PIN e conceder somente
  sessao adulta e grant do canal selecionado apos sucesso no mesmo prompt.
  Cancelar/erro/PIN errado/lock durante KDF nao troca canal nem concede acesso.
  Categoria continua pedindo sessao sem conceder grant a todos os canais.
  Registro nao configurado/allowAdult=false/idade<18 continuam orientando
  configuracao; nao inventar credencial nem pedir PIN impossivel de validar.

## Allowlist estrita

- src/parental/parental-control.store.ts: flag local, setter admin, bypass
  somente comum desativado, prompt adulto com grant selecionado opcional.
- src/parental/parental-content.ts e parental-access.ts: respeitar flag em
  VOD comum; Live comum livre, adulto com prompt protegido. Sem fonte/catalogo.
- src/ui/pages/ParentalControlPage.tsx: estado/botao e explicacao acessiveis.
- scripts/test-c160-parental-device-switch.mjs novo; caso Live de C128 somente
  expectativa anterior de filtro etario substituida pela exigencia explicita,
  mantendo asserts de imutabilidade e demais casos/negativos.
- package.json: adicionar suiteC160 ao site:build, sem dependencias novas.
- Este contrato; append C11_LOCAL_PARENTAL_CONTROL.md; evidenciaC160 e tres
  memorias append-only. Helpers/logs sinteticos tmp/c160-parental-live ignorado.

Lock antes/depois, suiteC160 com storage/crypto reais sinteticos: legacy,
flag invalida, persistencia/restart, admin necessario, sem reset de segredos/
cooldown, off/on/relock, VOD comum liberado somente off, Live comum sempre,
adulto opt-in/PIN correto/errado/cancel/escopo/lock concorrente. C126/C128/
C135 e C148 adequadas, tsc/site:build; Chrome isolado com pagina e dialogo
reais, sem cliente/fonte real. Nao certificar aparelho fisico/stream externo.
APK/instalacao nao pedidos neste novo ciclo; preservar artefato anterior.

Pendencia anterior preservada: usuario relata localhost HTTP e HTTPS com
conteudos funcionando. Isso nao foi comparado com mesma fonte/browser/
destinos/permissoes de producao; nao atribuir essa diferenca somente ao
protocolo. Vite e servidor estatico lidos nao mostram proxy de midia.
Investigacao web permanece aberta, sem executar relay/VPS/bypass.
NEXT_GATE_STARTED=NAO.

## Entrega APK solicitada — 2026-10-18 — anterior ao build

Usuario pediu expressamente APK atualizado para testes nos dispositivos.
Esta entrega sucede a restricao anterior de nao gerar APK neste ciclo.
Mesmo C160; nenhuma nova alteracao funcional ou proximo Gate. Preflight
clone independente/main/origin canonicos, HEAD076f8169b31280b782271c5a78f55503ee42e82e
limpo, AGENTS/Architecture/Execution/Activation Lock e escopoC160 relidos.
Git de versionamento/registro continua autorizado; PR/backend/install=NAO.

Allowlist adicional estrita: android/app/build.gradle somente versionCode
31->32 e versionName1.0.31->1.0.32; esta emenda, evidenciaC160 e tres memorias
append-only. Build nativo padrao sem validacao/player/cofre web, debug flag
false. Outputs ignorados usuais dist/Android build/assets e
tmp/c160-parental-apk; nao sobrescrever APKs ja entregues, keystores ou dados.
Cap sync nao autoriza mudar configuracoes/plugins/source/backup/ativacao.
Qualquer diferenca rastreada fora da allowlist exige auditoria antes de seguir.

Aceitacao: lock antes da mudanca, npm run build com hook e tsc/Vite; suiteC160;
cap sync android e Gradle testDebugUnitTest/assembleDebug; verificar package
com.xandeflix.prebuilt, v1.0.32/code32, min23/target35, assinatura identica ao
APK C156, configuracao HTTPS standalone sem servidor dev, assets equivalentes
ao dist aprovado, C160 e PIN web inclusos, exclusao de player/cofre browser,
recursos nativos preservados, metadados/sha256 e auditoria final do lock.
APK C156 permanece intacto. Nao instalar nem alegar QA fisica. Oferecer
arquivo assinado para atualizacao manual sobre a versao instalada, preservando
PIN/PUK/identidade/catalogo existentes. NEXT_GATE_STARTED=NAO.
