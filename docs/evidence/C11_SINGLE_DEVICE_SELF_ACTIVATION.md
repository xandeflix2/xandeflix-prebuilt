# C164 - Autoativacao de um aparelho - 2026-10-19

## Autoridade e proveniencia

Pedido do usuario: autoativacao do proprio aparelho, trial de sete dias sem
renovacao automatica, codigo/chave/compartilhamento no mesmo bloco, abertura
direta validada do cadastro, primeiro nome no gestor e nenhuma escolha de
telas adicionais. Spec anterior ao codigo em
[C11_SINGLE_DEVICE_SELF_ACTIVATION](../architecture/C11_SINGLE_DEVICE_SELF_ACTIVATION.md).
CURRENT_GATE=NONE; CYCLE=C164; NEXT_GATE_STARTED=NAO.

Clone ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
HEAD510e18a9765d0aae49e4893430e0318c93b9f4fb, origin esperado
https://github.com/xandeflix2/xandeflix-prebuilt.git. Preflight/AGENTS/contratos/
boundary/lock lidos; baseline1256 arquivos preserva dirty C161-C163. Sem
commit, push, PR, instalacao/reset ou operacao no projeto original protegido.

## Comportamento entregue

- Codigo ID, chave permanente, Compartilhar codigo e chave e Abrir pagina de
  ativacao no mesmo card. Removidos Copiar chave e bloco Ativar sem gestor.
  Compartilhar usa o par completo pelo fluxo existente. Pedido ao gestor da
  TV e suporte preservados.
- Abrir pagina valida o codigo/chave atuais no servidor e abre capability
  curta no fragmento. Chave permanente e token nativo nao entram na URL.
  Fragmento removido antes do SDK; RESUME valida a sessao antes do formulario.
  Link expirado/invalido volta a entrada manual, sem acesso a dados da fonte.
- Formulario: Cliente (primeiro nome), Local/Tipo, Plataforma, Tipo da playlist
  M3U/M3U8, URL da playlist e URL EPG opcional. Nome Unicode normalizado ao
  primeiro termo; fonte derivada do nome. Sem quantidade de telas ou planos.
- RPC atomica limita a um aparelho/uma sessao, deriva o alvo da capability,
  preserva politica de sinal/vault e grava primeiro nome em customer_accounts
  e customer_profiles. A coluna Cliente de AdminLicensesView usa customerNickname
  desses dados. Local e plataforma alteram somente o proprio aparelho.
- Trial termina em sete dias corridos desde a ativacao inicial. Prazo ausente
  nega acesso; prazo efetivo nao ultrapassa inicio+7dias. Replay nao modifica
  prazo/nome/fonte. RPC antiga e Edge tambem rejeitam telas adicionais.
  Nao cria pagamento, comprovacao, conversao automatica ou novo trial para
  conta existente. Preservado canon de um trial por conta, sem fingerprint
  de hardware. Licencas pagas/gerenciadas e permissoes administrativas intactas.
- Source/C9 consultam entitlement; heartbeat existente encerra sessao negada.
  Nenhuma mudanca em App, player, C9, catalogo, source delivery ou identidade.
  Nao alegar corte fisico instantaneo: runtime usa o heartbeat existente.

## Servidor publicado e verificacao

Supabase exclusivo cujbmyhitgomlgwfkaat. Migration
20261019051832_c164_single_device_self_activation.sql aplicada e registrada;
RPC nova SECURITY DEFINER/search_path vazio, anon/authenticated sem EXECUTE,
service_role com EXECUTE. Preflight existente recebe somente sessionId.
device-public-activation v12 ACTIVE, verify_jwt=false preservado do fluxo
anterior, com autenticacao propria codigo/chave/capability. Helper puro de
metadados compartilhado entre cliente/Edge, sem dependencias de segredos.
Backup da Edge anterior e definicoes SQL em tmp privado; comparacao anterior
Edge local/remota diferia somente na quebra de linha final, nao em logica.

Fixtures reais Postgres com BEGIN/ROLLBACK PASS: antes7dias por1ms permite;
no prazo exato/depois/null/overlong nega;2telas negadas; grants corretos.
Integracao RPC PASS: preflight, capability de outro codigo negada, somente
aparelho alvo criado,1/1 e sete dias, nome Joao com acento preservado, label/
plataforma, replay sem mutacao e segundo aparelho negado. Zero usuarios Auth
ou instalacoes residuais das fixtures apos rollback. Nenhum cliente real
ativado ou alterado nos testes. Nenhum backfill de licencas existentes.

Edge HTTP real negativo PASS: codigo vazio400/DISPLAY_CODE_INVALID;
2telas400/INITIAL_SCREEN_LIMIT; nome ausente400/CUSTOMER_FIRST_NAME_INVALID;
capability sintetica403/ACTIVATION_SESSION_NOT_OPEN. Sem ativacao real.
Advisors antes/depois:5 avisos herdados, zero novo; sem refactor fora do ciclo.

## Testes locais, navegador e build

C164 sete grupos PASS: validacao Unicode, limite/whitelist de campos,
RESUME, handoff efemero, callback nativo real/duplo clique, Edge validando
antes de Auth/vault e RESUME sem bootstrap. C163 quatro grupos e C151 oito
grupos PASS, C164 integrado ao build existente. Principal-screen-policy tres
grupos e key-visibility16 testes PASS. Expectativas obsoletas de quatro telas
e copiar chave isolada substituidas pelas exigencias autorizadas, mantendo
negativos de autorizacao, readiness, suporte e preservacao de identidade.

Chrome isolado com React/callback/compartilhamento reais e portas sinteticas:
FireTV960x540, AndroidTV, Tizen, webOS, phone390 e tablet PASS. OK/Enter
executa exatamente uma acao; um card, sem chave permanente na URL, sessao
StrictMode retomada uma vez, primeiro nome/uma tela, falha preservada e
capability expirada negada. Mobile sem overflow; capturas inspecionadas.
Perfis de navegador nao sao testes fisicos dessas plataformas.

Typecheck, npm run site:build (suites C151-C160), npm run build,
cap copy android e Gradle :app:assembleDebug PASS. Lock obrigatorio antes,
depois/prebuild e antes da entrega PASS, controles negativos preservados.
Testes JVM206/35 suites passaram em C162; nao repetidos neste ciclo sem
mudanca Java/player. Auditoria1256 arquivos PASS: allowlist, lifecycle/
polling/identidade/delivery via AST, App/player/C9/signal-policy inalterados,
memorias append-only, APK anterior e HEAD preservados. git diff --check PASS.

## Vercel

Conexao xandeflix_prebuilt correta, projeto
prj_OJcEZDNVPI3NV8Z1GfHOB02v20TF/xandeflix-prebuilt-nm3x, owner
team_gHZGQz2zRhEWsyK2jfOLLD5t. Nenhuma operacao xandeflix4.
Deploy production dpl_3C3EGi59Uxc2C2vyvUgAmh6HqVa1 READY/aliasError=null,
https://xandeflix.vercel.app/activate-device.
URL tecnica xandeflix-prebuilt-nm3x-5skby8zr7-xandeflix2.vercel.app.
Anterior C163 dpl_6roc9JY3GpSiDDNz2EEiQc1mETZB preservado.

23 arquivos estaticos/3481084 bytes verificados, mais config isolada de
deployment; oito rotas e quatro headers canonicos preservados. Sem .env,
APKs ou codigo privado no upload. Framework/install/build/output adaptados
somente ao pacote estatico; configuracao persistente Vite e protecoes do
projeto conferidas antes/depois. Root vercel.json inalterado neste ciclo.
Oito rotas200 e todos23 arquivos/SHA-256 identicos ao build PASS.
Chrome real em producao: direto/legado/mobile/admin PASS, fonte oculta antes
da validacao, campos vazios bloqueados, aviso sete dias, sem seletor de telas,
zero escritas backend. Fluxo positivo de cadastro validado por navegador
controlado e transacao real com rollback, sem ativar cliente em producao.

## APK de testes

Arquivo tmp/c164-single-device-activation/Xandeflix-v1.0.36-C164.apk.
Package=com.xandeflix.prebuilt; versionCode=36; versionName=1.0.36.
Bytes=11403869.
SHA-256=84912cf347957be42cc1065bf5a5578201b5e34aa500e7cd0ac5690d43196dcb.
apksigner PASS, mesma assinatura de1.0.35; aapt2 confirma package/versao.
Oito assets iguais ao dist; URL publica canonica presente; Capacitor HTTPS
sem server.url de desenvolvimento. APK debug recuperavel, nao instalado.
Versoes anteriores preservadas. Pagamento ainda nao configurado; nenhuma
promessa de pagamento automatico ou homologacao fisica. Evidencias/helpers/
logs/capturas/manifestos em tmp/c164-single-device-activation.
