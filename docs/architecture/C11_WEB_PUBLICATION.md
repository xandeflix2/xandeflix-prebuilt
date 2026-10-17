# C154 - publicacao do aplicativo web - 2026-10-17

## Autorizacao, preflight e destino

Usuario conectado ao painel publico solicitou acesso ao conteudo e depois
"prossiga com essa publicacao". Autoriza publicar o aplicativo web no projeto
existente da equipe xandeflix2, preservando painel, ativacao e fonte real.
Continuam autorizados commit/push de main pela solicitacao de publicacao ativa.
Nao usar xandeflix4, criar banco, mudar roles/RLS/schema ou instalar/resetar APK.

Clone ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, origin esperado
https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
a808826693c8452c96f58841117f9a4521c46596, arvore inicialmente limpa.
AGENTS, Architecture, Execution, Source Boundary e Activation Lock lidos.
Baseline1194/copias em tmp/c154-web-production. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C154_WEB_PUBLICATION; NEXT_GATE_STARTED=NAO.

Destino explicito: https://xandeflix-prebuilt-nm3x.vercel.app/app.
Raiz, /admin, /master, /manager e callback do painel continuam iguais.
Conexao MCP ainda lista somente xandeflix4 e nao sera usada para mutacoes.
GitHub confirma sucesso do commit anterior nos projetos xandeflix-prebuilt e
xandeflix-prebuilt-nm3x da equipe xandeflix2. Publicar pela integracao Git
existente; conferir especificamente nm3x e os arquivos HTTPS publicados.
CUA sem superficies; nao afirmar QA visual/sessao real sem executa-los.

## Especificacao anterior ao codigo

1. Novo build publico independente do build Android e da conferencia local.
   Compor dois artefatos: painel dedicado C151 na raiz; app HTML/JS/CSS sob
   /app/, base Vite /app/. Somente rotas exatas /app e /app/ apontam ao HTML
   publico, sem catch-all de API/catalogo/arquivos privados. Headers existentes
   preservados. Scripts manager:build/web:build/build e config nativa intactos.
2. Novo entry instala somente config publica Supabase canonica e valida HTTPS,
   WebCrypto e IndexedDB antes de importar o main existente. Config invalida
   ou ambiente inseguro exibe erro sanitizado sem inicializar consumidor.
   Build recusa chave privada/projeto diferente; envPrefix vazio e whitelist
   explicita de somente URL/chave publishable. Nenhum segredo TMDB/local ou
   credencial de fonte deve ser embutido. Arte extra usa referencias da fonte;
   enriquecimento TMDB sem chave nao e certificado por esta publicacao.
3. Ativar adaptadores web C136 existentes explicitamente, DEBUG=false; nao
   mudar source delivery, C9, parental, boot, importacao, busca ou playback.
   Manter setup de layout, espaco na busca e leitura local de /DATA/prebuilt;
   ocultar apenas o badge/diagnostico de conferencia no build publico, depois
   de instalar esses recursos. Builds locais/nativos nao recebem esta flag.
4. Pedido atual substitui a restricao C136 de somente local/LAN exclusivamente
   para este aplicativo web HTTPS. Cofre web AES-GCM/IDB com CryptoKey nao
   exportavel e aceito nesta plataforma, sem equivalencia com Keystore ou
   garantia contra um perfil de navegador comprometido. Source Boundary segue
   intacto: fonte cifrada local, contexto efemero, autorizacao remota real,
   busca/catalogo locais, video direto, sem proxy/relay/API de catalogo.
5. Cada origin/browser precisa ativacao legitima. Nao copiar identidade,
   chave permanente, licenca, PIN/PUK ou dados de localhost/dispositivo; login
   do gestor nao autoriza consumo. Fonte deve suportar HTTPS/CORS/codecs do
   navegador; nao contornar browser nem reescrever URLs para simular suporte.
6. Composicao copia somente assets publicos revisados. Limpeza de saida deve
   verificar caminho absoluto gerado dentro de tmp/c154-web-production e
   rejeitar symlinks; nunca remover fontes/dados privados. Sem dependencia nova.

## Allowlist estrita

Novos: app.html, vite.app.config.ts, src/web-production/main.ts,
scripts/build-public-site.mjs, scripts/test-c154-public-site.mjs,
docs/VERCEL_APP.md, este contrato e docs/evidence/C11_WEB_PUBLICATION.md.
Existentes: package.json (um script site:build), vercel.json (build/output e
duas rotas app), src/web/web-runtime.ts (flag e retorno antes do badge),
scripts/test-c151-manager-production.mjs (expectativas de composicao mantendo
todos os casos do painel), docs/VERCEL_MANAGER.md e Source Boundary (append de
referencia publica), tres memorias append-only. Helpers/logs/builds privados
em tmp/c154-web-production; build dedicado painel na saida C151 habitual.

## Aceitacao e publicacao

Lock antes/depois e agregado de site:build obrigatorios, sem bypass. Testar
entry real com portas sinteticas (config antes de import; falhas fechadas),
config Vite publica, rotas, composicao, separacao do painel, bundle real,
ausencia de segredos/env alheio/debug/maps/badge e presenca do player/cofre.
Revalidar suites web de cofre, player e leitura catalogo; C1517 intactos.
Auditoria hashes/inversa, memorias append, APK149 preservado. Stage nominal,
commit/push normal origin/main, verificar SHA/divergencia. Acompanhar status
GitHub/Vercel nm3x e GET HTTPS de /app, /app/, raiz e /admin e seus assets.
HTTP200 nao certifica sessao ativada/catalogo/reproducao da fonte real. Registrar
primeira fronteira nao verificada e orientar ativacao no painel, sem inventar
acesso/credenciais. Nenhum proximo Gate ou recurso extra iniciado.
