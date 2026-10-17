# Publicar o painel administrativo Xandeflix

O repositorio possui um build dedicado ao painel ADMIN/MASTER. Ele nao inicia
o aplicativo de consumo, nao exige ativacao do navegador e nao carrega catalogo
ou player. Login e permissoes usam o Supabase existente. ADMIN recebe seu
escopo; MASTER recebe as funcoes globais permitidas pelo servidor.

## Conta e importacao

Usar a nova conta solicitada para xandeflix2. Nao criar/vincular/publicar em
xandeflix4's projects. Cadastro/verificacao e autorizacao GitHub devem ocorrer
diretamente na Vercel. Nenhuma senha/token deve ser colada em chat/commits.

1. Criar ou entrar na conta correta em https://vercel.com/signup.
2. Em Add New > Project, autorizar somente o repositorio GitHub
   xandeflix2/xandeflix-prebuilt. Se a conta GitHub for diferente, ela precisa
   ter acesso legitimo ao repositorio; nao copiar o repo para outra identidade.
3. Importar main, Root Directory ./, preset Vite. O vercel.json versionado
   define npm ci, npm run manager:build e a pasta de saida correta.
   Conferir Node.js 24.x no projeto, a mesma versao principal validada localmente.
4. Adicionar as variaveis abaixo no ambiente Production antes do deploy.
   Preview deve ser configurado deliberadamente se for usado para testes.

| Variavel | Valor |
| --- | --- |
| VITE_SUPABASE_URL | https://cujbmyhitgomlgwfkaat.supabase.co |
| VITE_SUPABASE_PUBLISHABLE_KEY | Chave publica sb_publishable_ do mesmo projeto |

Obter a chave publica no painel Supabase do projeto existente. Nao criar
outro banco nem adicionar integracao que provisione outro Supabase. Nao usar
service_role, sb_secret_, senha de banco ou chave do vault. Nao habilitar
VITE_DEBUG_BUILD. O build recusa projeto errado/chave privada e expoe somente
essas duas variaveis publicas. Nao enviar .env.local ou arquivos privados.

## Enderecos e acesso

A raiz / abre o login do painel. /admin, /master e /manager abrem a mesma
interface: o endereco nao concede privilegios, que sempre vem do servidor.
Usar os usuarios ADMIN/MASTER existentes no Supabase; nao ha senha padrao.

A recuperacao usa /manager-reset-password. Apos obter o dominio definitivo,
em Supabase > Authentication > URL Configuration, adicionar o callback exato
https://SEU-DOMINIO/manager-reset-password e conferir Site URL. Preservar URLs
anteriores usadas legitimamente. Nao liberar wildcards amplos nem sobrescrever
configuracao de outros clientes. A rota e o callback nao mudam usuarios/roles.

## Validar e atualizar

Build local: npm run manager:build. Usa lock de ativacao, TypeScript e Vite;
saida tmp/c151-manager-production/site. Regressao do painel:
node scripts/test-c151-manager-production.mjs.

Depois da publicacao, conferir HTTPS, login MASTER e ADMIN, escopo de cada
papel, logout/reentrada e rota de recuperacao. Nao testar funcoes destrutivas
em contas reais. Acesso anonimo/USER nao deve obter dados administrativos.
Build/HTTP200 isolados nao certificam uma sessao real autorizada.

Com integracao Git conectada a main, futuros pushes autorizados usam essa
configuracao. Publicar painel nao altera APKs instalados nem a fonte/catalogo
local dos dispositivos. Se build falhar por variavel ausente, configure na
Vercel e crie novo deployment; nao habilite modo debug como alternativa.

Referencias oficiais: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite),
[Node.js suportado](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions),
[URLs de retorno Supabase](https://supabase.com/docs/guides/auth/redirect-urls).
