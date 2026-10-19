# C164 - Autoativacao de um aparelho e cadastro simplificado

## Autoridade e preflight - 2026-10-19

Usuario exige autoativacao exclusiva do proprio aparelho, trial de sete dias
sem renovacao automatica enquanto pagamento nao esta configurado, identidade/
chave/compartilhamento no mesmo bloco, retirada de Copiar chave e do bloco
Ativar sem gestor, abertura direta do formulario com prova do aparelho, campos
Cliente (primeiro nome), Local/Tipo, Plataforma, Tipo da playlist, URL e EPG,
nome visivel nas licencas do gestor e nenhuma escolha de telas adicionais.
Pedido autoriza patch/validacao/publicacao/APK recuperavel desse fluxo; nao
autoriza Git writes, instalacao/reset, pagamento, planos novos ou novo Gate.

CURRENT_GATE=NONE; CYCLE=C164; NEXT_GATE_STARTED=NAO. Clone independente
C:/Xandeflix/xandeflix-prebuilt-c11-main, main, HEAD
510e18a9765d0aae49e4893430e0318c93b9f4fb, origin esperado xandeflix2/
xandeflix-prebuilt. AGENTS/Architecture/Execution/Source Boundary/Activation
Lock lidos. Dirty C161-C163 e diagnostico anterior preservados por baseline.
Nenhuma operacao na pasta historica ou projeto original protegido.

Supabase correto cujbmyhitgomlgwfkaat confirmado na conexao disponivel.
Vercel permitido: projeto prj_OJcEZDNVPI3NV8Z1GfHOB02v20TF, proprietario
team_gHZGQz2zRhEWsyK2jfOLLD5t, dominio xandeflix.vercel.app. Nao usar
xandeflix4. Producao anterior C163 dpl_6roc9JY3GpSiDDNz2EEiQc1mETZB.

## Diagnostico anterior ao codigo

- Pagina, service, Edge e RPC with_screens permitem1-4 telas. Remover apenas
  o select nao basta; clientes antigos/chamadas diretas devem rejeitar >1.
- Core cria TRIAL com NOW()+7days e1/1. Duas licencas SELF_SERVICE/TRIAL
  observadas por agregado anonimo possuem prazo e capacidade corretos.
  evaluate_license_access permite prazo TRIAL nulo e nao limita prazo maior
  que7days: corrigir fail-closed e limitar pelo inicio+7 sem estender trial.
- Nome interno aleatorio trial-* aparece no gestor. Nao modificar o validador
  global de nickname legado (ASCII/min3). Apos sucesso atomico, gravar primeiro
  nome validado nos campos existentes de apresentacao do cliente; manter
  identidade interna/Auth separada, sem novos acessos de gestor.
- Local/Tipo usa devices.device_label; plataforma pode usar tabela privada
  manager_device_presentation existente (updated_by referencia auth.users).
  Alvo vem da sessao validada, nunca de deviceId enviado pelo formulario.

## Especificacao

1. Novo cadastro publico possui max_devices=1/max_concurrent_sessions=1 e
   somente vinculo ao device da capability. RPC antiga with_screens rejeita
   valor distinto de1. Nova RPC atomica aplica metadados apenas em sessao
   OPEN, fonte/politica/identidade/licenca validadas; replay nao altera nome,
   aparelho ou prazo. Negar secundarios e crescimento de licenca existente.
2. Trial inicia na primeira ativacao bem-sucedida pelo servidor e acaba em
   sete dias corridos. Repetir a solicitacao ou editar fonte nao renova esse
   trial; reinstalar nao prorroga a licenca existente. Preservar o canon C5:
   um trial por conta, sem criar fingerprint de hardware neste ciclo.
   Prazo ausente ou vencido nega entitlement; deadline efetivo nunca supera
   trial_started_at+7days. Nao criar checkout, comprovacao automatica, planos
   ou conversao para ACTIVE. Preservar licencas pagas/gerenciadas existentes.
   Verificar que heartbeat/source access continuam usando esse entitlement;
   acrescentar protecao local de prazo somente se a auditoria mostrar lacuna.
3. Botao nativo usa codigo/chave locais existentes para START server-side.
   Com prova valida, abre pagina com codigo e capability curta no fragmento;
   nunca chave permanente, fonte, PIN ou token nativo na URL. Capturar/limpar
   fragmento antes do SDK; RESUME server-side valida capability antes de
   exibir fonte. Sem login/recriacao de identidade. Link sem handoff conserva
   entrada manual codigo/chave. Falha/expiracao nao abre formulario autorizado.
4. Campos requeridos: primeiro nome Unicode (normalizar somente primeiro
   termo;1-32 letras/hifen/apostrofo), Local/Tipo1-100, Plataforma enum existente,
   Tipo M3U/M3U8, URL da playlist, EPG opcional. Fonte tem nome derivado do
   primeiro nome. Nao exibir quantidade de telas, planos ou escolha de fonte
   para secundario. Dados de fonte seguem exclusivamente vault cifrado.
5. Nativo: um unico card contem codigo, chave permanente e compartilhamento
   do par. Remover copiar chave isolada e bloco Ativar sem gestor; manter botao
   Abrir pagina de ativacao junto aos dados, pronto apenas com chave valida.
   Preservar pedido ao gestor de TV, foco/Dpad, suporte, identidade/init/polling/
   delivery, e compartilhar somente par completo por fluxo existente.

## Allowlist

- Este contrato e referencia limitada no Architecture Contract; evidence
  C11_SINGLE_DEVICE_SELF_ACTIVATION.md; append nas tres memorias.
- ActivationPage.tsx/.css; ActivationHandoff.tsx/.css apenas composicao/card/
  compartilhamento; nenhum init/effect de identidade ou source delivery.
- src/ui/activation/public-activation-url.ts e ManagerApplication.tsx para
  handoff efemero; PublicDeviceActivationPage.tsx para formulario/RESUME.
- src/control-plane/client/public-device-activation.service.ts e novo helper
  puro supabase/functions/_shared/public-device-registration.ts compartilhado
  entre cliente e Edge, sem dependencia de env/segredos/runtime servidor.
- supabase/functions/device-public-activation/index.ts e dependencia local
  de validacao; migration gerada pela CLI para RPC atomica, restricao1 e
  endurecimento de trial. Preflight existente recebe somente sessionId na
  resposta de capability validada, necessario ao RESUME; nao muda permissoes
  nem validade. Nenhuma outra Edge, tabela/vault ou cliente real.
- App/guard de prazo somente se lacuna comprovada e emenda antes do patch.
- scripts/test-c163-public-activation-entry.mjs e testes de ativacao afetados
  somente para novo comportamento especificado, novo test-c164; integracao
  C151/CI existente. Nao reduzir invariantes/negativos do lock.
  Inclui test-c11-principal-screen-policy e test-c11-activation-key-visibility:
  trocar expectativa obsoleta de copiar chave isolada por par compartilhado,
  preservando estados LOADING/ERROR/autorizacao/suporte e provas de nao rotacao.
- android/app/build.gradle somente36/1.0.36; saidas normais build/cap/Gradle;
  APKs/evidencias/helpers isolados em tmp/c164-single-device-activation.

## Validacao e implantacao

Baseline de hashes/proveniencia e lock antes/depois/prebuild. Testes reais de
service/formulario/callback/capability, nomes Unicode/primeiro termo, um device,
tentativa2telas, replay/outrodevice e fronteira antes/em/depois7dias.
SQL valida grants/search_path e fixture transacional com ROLLBACK, sem clientes
reais. Edge testes com adapters controlados provam falha antes de Auth/vault e
encaminhamento atomico; migracao reviewed/aplicada somente ao projeto correto.
Advisors relevantes comparados sem refactor fora do escopo. Site/native builds,
Chrome desktop/mobile/TV e hashes/assinatura/assets APK. Publicacao somente
projeto/dominio aprovados, comparacao de assets e sem ativar cliente real.
Sem instalacao automatica nem Git. Explicitar limites fisicos/negocios pendentes.
