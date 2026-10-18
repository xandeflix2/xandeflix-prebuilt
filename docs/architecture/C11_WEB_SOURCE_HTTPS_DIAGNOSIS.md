# C157 — diagnostico de fonte HTTP no navegador HTTPS — 2026-10-17

## Pedido, preflight e evidencia anterior ao codigo

Usuario cadastrou PIN web e relatou falha apos login. Screenshot/console
mostram T4_AUTHORIZATION_READY, SOURCE_READY e entrada PRE_IMPORT_BOUNDARY,
seguidos de8 mensagens Mixed Content (requisicao HTTP bloqueada em pagina
HTTPS). Entrada/autorizacao ocorreram; isso nao certifica download/catalogo.
Usuario identificou Vercel como provedor: Vercel hospeda o site HTTPS, nao
converte em HTTPS a fonte de catalogo/midia cadastrada no painel. Enderecos
reais foram ocultos no log; nao presumir hostname/porta/protocolo da fonte
armazenada nem que as oito requisicoes sejam todas do catalogo.

Clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main, main/origin
canonicos, HEADa66270392ac1b54a83a6bdeb6f7f8551a034790e, arvore limpa.
AGENTS/Architecture/Execution/Source Boundary/C154/C156/Activation Lock lidos.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C157; NEXT_GATE_STARTED=NAO.
Publicacao/Git da correcao web no mesmo projeto equipe2 continuam autorizados;
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO.
Nenhum backend, segredo, fonte/conta real, APK ou dispositivo sera alterado.

## Especificacao e limite da correcao

- Observar somente no wrapper web C136 ja existente a rejeicao de fetch
  cross-origin HTTP em pagina HTTPS (exceto loopback confiavel/abort).
  Registrar somente enum HTTP_IN_HTTPS_BLOCKED em RAM, sem URL/host/path,
  headers, credenciais, corpo ou exception.message. Nao mudar requisição,
  resposta, retry, redirect, timeout, transportes nativos ou URLs da fonte.
- Resetar diagnostico no CHECKING_SOURCE de cada tentativa e ao completar
  READY; notificar React para refletir diagnostico atual sem estado stale.
- Na falha da primeira sincronizacao, mostrar aviso adicional especifico
  sobre requisicoes HTTP bloqueadas e necessidade de HTTPS do fornecedor.
  Separar fato observado de causa exclusiva: recurso HTTP bloqueado nao
  prova sozinho que foi a playlist e nao deve mascarar outras falhas.
  Demais estados/offline/Android e callbacks de tentar/ativacao/portal iguais.
- Acrescentar codigo sanitizado ao diagnostico web existente; nenhuma tela
  solicita PIN/PUK/URL/segredo para diagnosticar. Proteger segredos no texto.
- Sem proxy/relay central, no-cors como contorno, permissoes inseguras ou
  upgrade automatico HTTP->HTTPS. C154 exige fonte com HTTPS/CORS/codecs;
  apenas endpoint real fornecido/validado pelo provedor resolve essa barreira.
  Informacao faltante solicitada ao usuario apenas como protocolo HTTP/HTTPS.
  Nao prometer que mensagem melhorada carrega fonte incompativel.

## Allowlist e verificacao

- Novo src/web/web-source-connection.ts: store observacional sanitizado.
- src/web/web-runtime.ts: observacao/reset no wrapper existente, sem alterar
  chamada/resposta/erro originais. Novo codigo somente em web-validation.
- src/ui/components/FirstRealSyncState.tsx e StartupLoadingScreen.tsx: aviso
  opcional, sem readiness, sincronizacao, liberacao precoce ou callback novo.
- Novo scripts/test-c157-web-source-https.mjs; package.json apenas inclui
  suite no site:build, sem dependencia ou mudanca em builds nativos.
- Este contrato, nova evidencia docs/evidence/C11_WEB_SOURCE_HTTPS_DIAGNOSIS.md;
  tres memorias append-only; baseline/helpers privados tmp/c157-web-https.
  Nenhum outro arquivo permitido. APK1.0.31/C156 preservado por hash.

Testar HTTP rejeitado, HTTPS normal/CORS desconhecido, abort/loopback,
preservacao do fetch/erros e reset por tentativa; nunca copiar URL em store
ou UI. Native flag falsa retorna estado neutro/sem instrumentacao. Lock antes
e em site:build, typecheck e suites C151/C154/C155/C156/C157 completas;
Chrome isolado com fonte sintetica deve reproduzir Mixed Content sem ler
conteudo real. Auditoria hashes/allowlist/memorias/segredos, publicar via Git
e verificar commit correto/HTTP. Fonte real/HTTPS do provedor continua uma
dependencia externa, nao resolvida por deploy Vercel.

## Esclarecimento do usuario e proposta para revisao, sem implementacao

Usuario confirmou que a fonte e HTTP, que consegue baixar M3U por navegacao
direta e que nao consegue obter HTTPS do fornecedor. Navegacao top-level nao
equivale a fetch de subrecurso HTTP em documento HTTPS (W3C Mixed Content,
https://www.w3.org/TR/mixed-content/). Manter HTTP na origem e possivel com
um transporte HTTPS intermediario, mas essa arquitetura NAO esta autorizada
pela presente allowlist. Nao afirmar que o aviso C157 resolve o carregamento.

Proposta concreta para decisao do usuario:

1. Site/login/painel continuam na Vercel em HTTPS. Aplicativos Android/TV e
   Fire Stick continuam com transporte direto da fonte e identidades iguais.
2. Gateway HTTPS dedicado, fora da Vercel/Supabase, acessa a origem HTTP e
   transmite em fluxo somente para sessoes web autorizadas. Exige servidor,
   dominio/certificado e capacidade/custo de banda. Nao contratar hospedagem.
   A Vercel nao sera usada como relay: sua AUP lista proxy entre atividades
   proibidas (https://vercel.com/legal/acceptable-use-policy) e a orientacao
   tecnica descreve Functions como API leve, nao servidor de midia
   (https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).
3. Emenda limitada necessaria aos contratos Architecture secao4, Source
   Boundary e C154 secao4/5: permitir somente este transporte web de
   compatibilidade. Preservar vault cifrado, licenca/C9/revogacao, PIN/PUK,
   catalogo/busca locais, proibicao de storage de video/catalogo e demais
   plataformas. Nao usar proxy publico, desativar seguranca do navegador,
   publicar segredos nem trocar apenas esquema/porta por suposicao.
4. Implementacao futura deve autenticar servidor a servidor/sessao delegada,
   limitar destinos aos da fonte autorizada (anti-SSRF inclusive redirects e
   DNS), ocultar URL/credenciais em identificadores opacos efemeros e logs,
   validar origem/sessao/limites de concorrencia, encerrar ao revogar/sair,
   suportar Range e HLS/segmentos/chaves sem transcodificar/persistir conteudo.
   HTTPS protege o trecho navegador-gateway; origem HTTP continua sem TLS.
5. Antes de liberar, testar fonte real autorizada, inclusive bloqueios por IP
   de origem, CORS/codec e interrupcao de sessao. Nao prometer compatibilidade
   somente com download M3U ou suite sintetica. Contrato/allowlist/testes desse
   transporte precisam preceder codigo em ciclo explicitamente autorizado.

Decisao sobre emenda e infraestrutura pendente. Nenhum gateway, proxy, compra,
servico, mudanca de fonte real ou proximo Gate iniciado por esta proposta.

## Decisao e atualizacao autorizada do mesmo ciclo — anterior ao codigo

Usuario REJEITOU gateway/VPS/custos de banda e nao autorizou emenda para
proxy/relay. Proposta anterior encerrada sem implementacao; proxima estrategia
HTTP via gateway permanece suspensa por pedido explicito. Se conexao direta
nao funcionar, usuario prefere somente painel administrativo. Nao retirar /app
agora: usuario testou HTTPS na fonte e relatou sistema abrindo com capas,
sem complemento TMDB e erro DIRECTORY_SOURCE_NOT_AUTHORIZED na reproducao.
Esse relato nao certifica HTTPS da midia nem todos os redirecionamentos.

Leitura confirmou: C154 exclui credencial TMDB do build publico; contrato
C11_SOURCE_FIRST_TMDB_ARTWORK.md permite VITE_TMDB_API_KEY como credencial
de leitura visivel no cliente, sem valor em Git/docs/logs. ActivationPage
nativa tenta obter chave permanente mesmo no navegador, que corretamente
recusa geracao e cai em falso UNREGISTERED/UNKNOWN/LOCAL_KEY_STATE=ERROR.
Resolver de detalhes C105 nega tanto autorizacao quanto sourceId/versao/
protocolo inconsistentes; nao relaxar esse guard. Troca HTTP->HTTPS pode
exigir atualizar catalogo; isso e hipotese solicitada ao usuario, nao causa
confirmada. Backend lido apenas por booleans da definicao RPC canonica, sem
dados/credenciais de clientes: validacao web e campos de metadata presentes.

Extensao minima de allowlist antes da implementacao:

- vite.app.config.ts: whitelist APENAS VITE_TMDB_API_KEY (32hex opcional),
  define explicita do valor de leitura e boolean configurado; sem token JWT,
  service role, importacao ampla de env ou alteracao do build Android.
- Novo src/web-production/WebAccessStatus.tsx: pagina read-only da sessao
  delegada existente, consulta readActiveSourceStatus existente e diagnostico
  de enums/versoes, sem chaves/URLs/tokens/PIN/PUK. Sem identidade nova ou
  preflight de ativacao nativa. Botao de consulta e de configuracoes existentes.
- src/ui/pages/ActivationPage.tsx: wrapper exclusivo isPublicConsumerWeb
  seleciona nova pagina; corpo/hook/fluxo original nativo em componente separado
  preservado. Nunca substituir estado remoto por autorizacao ficticia.
- scripts/test-c154-public-site.mjs: adicionar import mock do store C157
  exigido pelo harness (falha observada Unexpected import), preservar todas
  as oito verificacoes e ampliar teste de whitelist TMDB permitida/invalida.
- scripts/test-c157-web-source-https.mjs: ampliar suites com pagina web real,
  nenhum acesso a gerador nativo, expiracao e diagnostico sanitizado/versoes.
- docs/VERCEL_APP.md e append a C11_WEB_PUBLICATION.md: login existente,
  whitelist TMDB publica explicita e configuracao Production pelo titular,
  ausencia de gateway e nenhum certificado de HTTPS da midia sem teste.
- Demais arquivos da allowlist inicial e memorias append-only preservados.

Nenhuma alteracao funcional autorizada em source resolver, backend, RLS,
cofre, player, catalogo/search ou APK. Se reprodutor ainda falhar apos catalogo
atualizado, obter evidencia sanitizada da fronteira, sem remover validacao.

Usuario confirmou adiamento mesmo apos recarga. Leitura mostrou que
LOCAL_FIRST_ACTIVE_PRESERVED tambem e retornado para falha de entrega/staging
com campo error; UI C135 o chama sempre de adiamento por playback. Essa
mensagem nao comprova a condicao de bloqueio, nem ausencia de consulta.
Extensao adicional: src/ui/settings/active-source-status.ts apenas no build
publico distingue resultado com erro de adiamento legitimo e registra em
store web enums/booleanos de guard/resultado, sem alterar guard/canPromote,
coordenador, pedidos ou comportamento nativo. WebAccessStatus mostra esses
enums de ultima tentativa. Ampliar suite C157 para provar guard, erro de
preservacao, resultado sem erro e comportamento nativo anterior intacto.
