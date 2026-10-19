# C165 - Abertura do catalogo apos ativacao - 2026-10-19

## Autoridade e preflight

Usuario exige que, concluida a ativacao externa do aparelho, o aplicativo
volte a abertura/carregamento da fonte; novos ajustes exigem novo acesso
as configuracoes apos a abertura. Escopo local de transicao da UI e APK
recuperavel; nao autoriza Git, instalacao/reset, backend ou novo Gate.
CURRENT_GATE=NONE; CYCLE=C165; NEXT_GATE_STARTED=NAO.

Preflight read-only: clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main,
main, origin xandeflix2/xandeflix-prebuilt.git, HEAD
510e18a9765d0aae49e4893430e0318c93b9f4fb. AGENTS, Architecture, Execution,
Source Boundary e Activation Lock lidos. Dirty C161-C164 conhecido e preservado.
Nenhuma operacao no workspace historico ou projeto protegido. Git writes NAO.

## Diagnostico e especificacao anterior ao codigo

syncPendingDeviceActivation confirma CONSUMED, salva estado verificado e
somente entao emite xandeflix:activation-updated. App responde autorizando,
porem preserva rota/historico/hash. Settings tem prioridade de renderizacao;
ativacao aberta manualmente tambem permanece nessa rota. Boot ja usa
FirstRealSyncState/StartupLoadingScreen quando rota home e sem catalogo REAL.
Nao criar novo pipeline, persistencia ou sinal de autorizacao.

Na confirmacao existente, somente no aplicativo nativo:
- substituir rota por home com historico vazio, invalidar navegacao pendente
  e limpar somente o hash de navegacao; nao recarregar/resetar o aplicativo;
- fechar a aba de ativacao pelo Browser.close da versao instalada de
  @capacitor/browser (implementacao Android local possui close); falha de
  fechamento nao pode impedir o carregamento nem causar rejeicao pendente;
- manter o boot/sincronizacao/promocao existentes e a tela exclusiva de
  carregamento, sem campos de configuracao nesse percurso; erro/offline
  continuam com retorno/retry legitimos existentes;
- leitura inicial assíncrona antiga nao deve desfazer confirmacao recebida;
- aparelhos autorizados em abertura normal preservam local-first e acesso
  usual a configuracoes. Consumidor web nao recebe fechamento/reset nativo.
Nao alterar identidade, chave, token, entitlement, trial de sete dias,
fonte/vault/delivery, catalogo, parental ou player.

## Allowlist e validacao

- src/App.tsx somente transicao do evento existente e fechamento Browser;
- novo scripts/test-c165-post-activation-startup.mjs: App/rotas/loading reais
  com autoridades controladas; sucesso a partir de ativacao/settings/parental,
  fechamento, historico/hash, sincronizacao/erro/offline, novo acesso settings,
  leitura antiga, consumidor web e abertura ja autorizada preservados;
- android/app/build.gradle somente versionCode37/versionName1.0.37;
- este contrato, evidence C11_POST_ACTIVATION_STARTUP.md e append nas tres
  memorias; build/cap/Gradle/helpers/logs isolados tmp/c165-post-activation-startup.
Sem alteracao em lock/testes canonicos, APIs/Edge/migrations ou Vercel.

Emenda de validacao antes do patch da fixture: a suite visual de startup C111
nao declara tres imports adicionados em ciclos anteriores (parental store,
AdultPage, web/validation). Permitir somente declarar esses ports existentes
em scripts/test-c111-exclusive-startup-loading.mjs: manter store/validation
reais e usar o mesmo stub de pagina para AdultPage. Nenhum assert removido,
criterio relaxado ou mudanca no lock canonico. Testes de startup nao podem
ficar sem execucao por drift da fixture.

Baseline de hashes antes do patch e lock antes/depois/prebuild/entrega;
teste dedicado com Chrome isolado e teste de startup existente; typecheck,
build, APK package/assinatura/assets comparados ao dist e APK anterior
preservado. Testes sinteticos nao equivalem a homologacao fisica.
