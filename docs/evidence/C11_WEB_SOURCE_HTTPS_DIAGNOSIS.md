# C157 — evidencia de bloqueio HTTP em pagina HTTPS — 2026-10-17

Contrato e extensoes anteriores ao codigo: C11_WEB_SOURCE_HTTPS_DIAGNOSIS.md.
Preflight clone independente/main/origin canonicos HEADa662703, limpo antes
do ciclo; baseline1225 arquivos. Console do usuario: autorizacao/SOURCE_READY,
depois Mixed Content. Usuario confirmou HTTP, rejeitou gateway/VPS/banda e
em seguida relatou abertura do sistema mudando fonte para HTTPS. Midia e
redirects HTTPS nao foram certificados. DIRECTORY_SOURCE_NOT_AUTHORIZED
persiste e atualizacao informa adiamento, inclusive apos recarga (relato).

## Correcoes e limites

- Wrapper fetch web observa HTTP rejeitado em pagina HTTPS, exceto abort e
  loopback. Sem alterar URL, init, resposta, body ou erro original, sem fetch
  extra. Store guarda somente enums/booleanos em RAM e limpa aviso por retry/
  sucesso. Aviso especifico apenas na falha da primeira carga, sem entrada
  antecipada. Recursos HTTP bloqueados podem ser imagens; nao sao prova
  exclusiva de falha da playlist.
- Tela de Ativacao web separada: usa sessao delegada existente e consulta
  somente proveniencia local/remota; nao chama geradores nativos. Diagnostico
  legado falso UNKNOWN/UNREGISTERED resultava da tentativa correta de bloquear
  geracao de chave na web. Codigo da sessao, versoes/comparacao e enums seguros
  substituem falso erro local; corpo da pagina nativa preservado.
- Atualizacao web: LOCAL_FIRST_ACTIVE_PRESERVED com campo error agora mostra
  falha, preservando catalogo anterior. Esse outcome antes era sempre chamado
  adiamento por playback, mesmo em falha de entrega/staging. Registra resultado,
  codigo allowlisted/erro generico ou motivo do guard em RAM para suporte.
  Guard/canPromote e comportamento nativo permanecem iguais. Nao alegar que
  a tentativa real nao consultou nada: a mensagem anterior era ambigua.
- Build publico permite somente VITE_TMDB_API_KEY v3(32hex), credencial de
  leitura visivel ao cliente prevista no contrato de artwork, nunca valor em
  Git/docs/logs. Prefixo env vazio e whitelist explicita preservados; rejeita
  JWT/formatos invalidos, sem expor outras variaveis. Ausente = metadados extras
  desativados. Usuario nao sabe se chave existe na Vercel; orientacao em
  docs/VERCEL_APP.md. Smoke local somente TMDB/movie550 publico respondeu200,
  ID/backdrop confirmados; nao e prova da configuracao Vercel nem da fonte.
- Nenhum relay, gateway, VPS, compra, fonte real, backend, credencial de
  cliente, dispositivo ou APK alterado. Consulta Supabase read-only confirmou
  projeto canonico e booleans da definicao RPC: sessao web e campos de metadata
  presentes, sem consultar registros de clientes. Sem logs runtime Vercel:
  conector disponivel permanece em outra equipe e nao foi usado para mutacao.

## Verificacao

- Lock previo PASS; site:build com lock/TypeScript/Vite e suites C1517,
  C1548, C15511, C15610 e C15715: conferir log final antes da publicacao.
- C15715 cenarios: fetch original/identidade/erro preservados, sanitizacao,
  HTTP/HTTPS/abort/loopback/native, reset/aviso/callbacks, sessao expirada,
  wrapper de ativacao, whitelist TMDB e erro vs adiamento, guard intacto.
- C105 detalhes/directory12 PASS; C135 fonte/refresh8 PASS. Nao remover ou
  relaxar autorizacao de fonte/versao/protocolo para esconder erro de cliente.
- Chrome isolado, perfil proprio, React real e documento HTTPS sintetico:
  bloqueio Mixed Content real, aviso, retry limpa, nenhum Entrar agora,
  diagnostico web sem ativacao nativa ou segredo. Sem flags de bypass de
  TLS/mixed content. Screenshot revisado com CSS real. Fixture nao acessa
  fonte/sessao de cliente nem certifica reproducao de filmes/canais reais.
- Tentativa extra de C111 original bloqueou compilacao do harness por imports
  App nao declarados (parental store, AdultPage, validation). App e suite
  originais sao identicos ao baseline; falha preexistente de fixture, sem UI
  executada por essa suite. Nao alterar assertions nem anunciar C111 PASS.
- Falhas encontradas/corrigidas no ciclo: mock C154 desconhecia novo import;
  harness C157 sem __dirname; React default import inicialmente sem uso.
  Corrigidos mock/ambiente/tipagem antes das suites finais. Leituras por globs
  posicionais Windows/caminhos supostos falharam; usar inventario real. Uma
  tentativa apply_patch sem contexto correspondente nao modificou arquivo.

Auditoria PASS: baseline1225,1212 preservados,13 modificados e5 novos,
18 arquivos na allowlist nominal; memorias append-only e corpo nativo de
ativacao identico. APK C1561.0.31 SHA256a7012e334e87ec2eac56715b7ae89fef523e9548cd4a9db01f8b7f83b3b8deee
identico; nenhum segredo real nos arquivos rastreados e nenhuma dependencia.
Lock e site:build finais completos PASS com exit0. Publicacao em andamento.
Ultima fonte real ainda depende do diagnostico atualizado; nao alegar resolucao
de DIRECTORY_SOURCE_NOT_AUTHORIZED, TMDB na Vercel ou playback de producao.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C157 — publicacao web verificada, fonte real em diagnostico — 2026-10-17

Commit funcional8f7db18 publicado por origin/main, projeto canonico Vercel
xandeflix2/xandeflix-prebuilt-nm3x READY:
https://vercel.com/xandeflix2/xandeflix-prebuilt-nm3x/B8FGeXpgEBh72DXttrvzaqPCVrzB
Ambos aliases / /admin /app /app/ HTTP200 e entries corretos; .env.local e
api/control-plane/state404, headers DENY/nosniff. Bundle com UI C157 e
TMDB_CONFIGURED=SIM: nao precisa cadastrar variavel agora. Isso nao certifica
consumo TMDB de producao. HTML appSHA256689edf40ef1e5503a553f14dfd19a62917eb7382b48b915cc40986481a78b4cf
e mainSHA256771060cbfb250aea521516c2b0ead567dd14ad1e45009537f016acb0b15ccd38
iguais nos aliases. Chrome isolado remoto: login3campos, senhas mascaradas,
sem identidade/ativacao ou storage antes do login; nao usou sessao real.
Supabase sem escritas; sem logs runtime Vercel acessiveis nesta conexao.
Helper inline de preparo do browser falhou por quoting PowerShell; substituido
por arquivo .mjs e teste remoto PASS, sem alterar fonte ou navegador usuario.
Aguardar diagnostico WEB_SUPPORT apos atualizar para identificar bloqueio/erro
real; nao alegar resolucao de DIRECTORY_SOURCE_NOT_AUTHORIZED ou playback.
Estrategia HTTP por relay/VPS rejeitada e nao implementada.
NEXT_GATE_STARTED=NAO.
