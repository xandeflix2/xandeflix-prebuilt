# Aplicativo web publicado

Acesso ao conteudo: https://xandeflix-prebuilt-nm3x.vercel.app/app.
O painel continua na raiz, /admin, /master e /manager do mesmo dominio.
Cada entrada carrega seu proprio build. Nenhum login administrativo concede
automaticamente licenca de consumo ao navegador.

No primeiro acesso, escolha o dispositivo se solicitado, consulte o codigo e
a chave de ativacao e ative esse navegador pelo painel existente. Vincule
licenca/fonte valida pelo fluxo normal. Volte ao aplicativo para carregar o
catalogo. Nao copie a identidade ou os dados de localhost/outro aparelho.
Atualizacoes com Ctrl+F5 preservam armazenamento; nao limpar dados do site
para atualizar, pois a identidade e o catalogo pertencem ao navegador/origin.

O build `npm run site:build` valida o lock, TypeScript, painel e app e compoe
`tmp/c154-web-production/site`. O vercel.json seleciona esse comando e as
rotas exatas. Os dois parametros publicos Supabase ja usados pelo painel sao
suficientes: VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY, no projeto
canonico. Nao copiar .env.local inteiro para a Vercel nem habilitar debug.
Nenhum segredo/chave TMDB local e incluido. Capas e imagens fornecidas pela
fonte continuam disponiveis; enriquecimento TMDB depende de configuracao
propria autorizada e nao e certificado por esta publicacao.

Catalogo, busca, favoritos e controle parental ficam no navegador; fonte
cifrada com AES-GCM/IndexedDB e chave nao exportavel. O servidor hospeda os
arquivos do aplicativo, sem receber catalogo, PIN/PUK ou video. A reproducao
e direta e exige HTTPS/CORS/codecs compativeis da fonte; fonte HTTP pode ser
bloqueada como conteudo misto. Nao ha proxy ou transcodificacao para contornar
restricoes do navegador. Cofre web nao equivale ao Keystore do Android.

Para atualizar, publicar main pelo fluxo Git autorizado e verificar o status
da implantacao e /app. Os comandos Android/build e web local permanecem
separados. Nenhum APK precisa ser reinstalado para atualizar este site.
