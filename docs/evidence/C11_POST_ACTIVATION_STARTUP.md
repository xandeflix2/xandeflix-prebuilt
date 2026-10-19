# C165 - Abertura do conteudo apos ativacao - 2026-10-19

## Autoridade e preflight

Usuario solicita retornar a abertura/carregamento da fonte apos concluir a
ativacao do aparelho. Ajustes posteriores devem exigir novo acesso a
configuracoes. Spec anterior ao codigo em
[C11_POST_ACTIVATION_STARTUP](../architecture/C11_POST_ACTIVATION_STARTUP.md).
CURRENT_GATE=NONE; CYCLE=C165; NEXT_GATE_STARTED=NAO.
Clone ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb, origin esperado
xandeflix2/xandeflix-prebuilt.git. Preflight/AGENTS/Architecture/Execution/
Source Boundary/Activation Lock lidos; baseline1261 arquivos preserva C161-C164.
Sem Git writes, backend, Vercel, instalacao/reset ou novo Gate.

## Diagnostico e mudanca

O service existente confirma CONSUMED no servidor, salva ativacao verificada,
limpa capability pendente e emite activation-updated. App somente autorizava
e preservava rota/historico/hash de configuracoes; essas rotas precedem a
tela de primeira sincronizacao. Defeito de transicao da UI confirmado.

App agora, no evento nativo existente, invalida navegacao pendente, substitui
rota por home com historico vazio, remove somente hash e solicita Browser.close
da versao instalada (metodo Android confirmado no codigo local). Falha ao
fechar nao bloqueia a abertura nem produz rejeicao pendente. Leitura inicial
antiga nao desfaz confirmacao ja recebida. Nao recarrega processo nem reseta
dados. Primeira sincronizacao reutiliza FirstRealSyncState/StartupLoadingScreen
e boot/promocao existentes; Home abre com catalogo real pronto. Configuracoes
somente voltam por uma nova acao normal; Back nao restaura formularios antigos.
Erro/offline/retry existentes preservados. Aparelho ja autorizado mantem boot
local-first; consumidor web nao sofre reset de rota/fechamento nativo.

Sem alteracao em ActivationPage, service de ativacao, identidade/chave/token,
trial de sete dias, vault, fonte/delivery/catalogo/C9/player/parental. Autoridade
e persistencia continuam exclusivamente nos fluxos anteriores. Pagamento
continua sem integracao; este ciclo nao modifica regra comercial.

## Validacao

Novo teste executa App, rotas, AppShell, loading e syncPendingDeviceActivation
reais, com portas remotas/storage/native controladas e Chrome isolado.
Dez grupos PASS: FireTV/AndroidTV/tablet/phone confirmam save -> loading ->
Home -> novo acesso settings; historico parental/settings limpo; PENDING e
save verificado rejeitado nao iniciam/fecham; close rejeitado nao bloqueia;
leitura inicial atrasada nao reverte; web preservado; boot ja autorizado e
configuracoes normais preservados. Zero chamadas externas/escritas reais;
captura de loading inspecionada. Perfil de navegador nao e aparelho fisico.

Suite C111 nove grupos PASS: importador real/preview, UI exclusiva, layouts/
rotacao, offline/erro/retry/voltar/portal, cache REAL local-first, autorizacao,
reduced motion e background. Fixture antiga atualizada somente para declarar
tres imports acrescentados em ciclos anteriores, com emenda antes do patch;
nenhum assert removido ou criterio reduzido. Testes canonicos nao alterados.

Typecheck, npm run build com prebuild lock, cap copy e Gradle assembleDebug
PASS. Lock antes/depois/prebuild e entrega PASS, com9 controles negativos e
suites26/27/6 preservadas. Auditoria1261 arquivos: App fora do effect de
autorizacao inalterado por AST, allowlist e memorias append-only; backend C164,
fonte/player/ativacao e APK1.0.36 preservados. git diff --check PASS.
JVM anterior206/35 suites nao repetido: nenhum codigo Java modificado.

## APK de testes

Arquivo tmp/c165-post-activation-startup/Xandeflix-v1.0.37-C165.apk.
Package=com.xandeflix.prebuilt; versionName=1.0.37; versionCode=37.
Bytes=11403951; SHA-256=34a5c808878c99923695aecff746c128c451684ea57d447687ad697f3aed7441.
apksigner PASS, mesma assinatura de1.0.36; aapt2 package/versao corretos;
8 assets byte a byte iguais ao dist apos copy, URL publica de ativacao
preservada, Capacitor HTTPS sem dev server. APK debug recuperavel, nao instalado.
Sem ativacao real de cliente ou teste fisico. Evidencias/helpers/logs/capturas
em tmp/c165-post-activation-startup. Publicacao web C164 permanece inalterada.
