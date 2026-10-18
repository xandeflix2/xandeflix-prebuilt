# Aplicativo web publicado

Acesso ao conteudo: https://xandeflix-prebuilt-nm3x.vercel.app/app.
O painel continua na raiz, /admin, /master e /manager do mesmo dominio.
Cada entrada carrega seu proprio build. Nenhum login administrativo concede
automaticamente licenca de consumo ao navegador.

Use codigo de aparelho existente, chave de acesso e PIN web cadastrado em
Configuracoes -> PIN web do aplicativo atualizado. O navegador nao gera nova
identidade/chave nem requer nova ativacao. PIN web e separado do parental;
recuperacao exige PUK no aparelho. Credenciais somente no formulario HTTPS,
nunca em URL, conversa ou log. Configuracoes -> Ativacao na web exibe a sessao
existente e a comparacao entre a fonte vinculada e o catalogo local.
Atualizacoes com Ctrl+F5 preservam armazenamento; nao limpar dados do site
para atualizar, pois o catalogo esta isolado por aparelho/origin.

O build `npm run site:build` valida o lock, TypeScript, painel e app e compoe
`tmp/c154-web-production/site`. O vercel.json seleciona esse comando e as
rotas exatas. Os dois parametros publicos Supabase ja usados pelo painel sao
suficientes: VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY, no projeto
canonico. Nao copiar .env.local inteiro para a Vercel nem habilitar debug.
Para complemento TMDB, configure VITE_TMDB_API_KEY no projeto correto da equipe
xandeflix2, Settings -> Environment Variables -> Production, e publique nova
versao. Aceita somente chave de leitura do aplicativo v3 de32digitos hex,
publica no cliente conforme C11_SOURCE_FIRST_TMDB_ARTWORK.md; nao usar token
privado/read-access JWT nem credencial que deva permanecer secreta. Nao copiar
.env.local inteiro nem enviar valor por chat. Build usa whitelist exata,
recusa formato invalido e nao inclui outras variaveis. Sem essa configuracao,
capas da fonte continuam, mas complemento TMDB fica desativado. Diagnostico
web mostra somente TMDB_CONFIGURED=SIM/NAO, nunca o valor.

Catalogo, busca, favoritos e controle parental ficam no navegador; fonte
cifrada com AES-GCM/IndexedDB e chave nao exportavel. O servidor hospeda os
arquivos do aplicativo, sem receber catalogo, PIN/PUK ou video. A reproducao
e direta e exige HTTPS/CORS/codecs compativeis da fonte; fonte HTTP pode ser
bloqueada como conteudo misto. Nao ha proxy ou transcodificacao para contornar
restricoes do navegador. Cofre web nao equivale ao Keystore do Android.

Baixar M3U navegando diretamente por HTTP nao prova acesso de fetch/video
dentro de site HTTPS. Nao trocar esquema/porta por suposicao; confirmar que
catalogo e midia/redirects aceitam HTTPS/CORS. O usuario rejeitou gateway/VPS
ou hospedagem de banda. Nao ha relay Vercel/Supabase. Se a fonte mudou de
versao, atualizar catalogo em Configuracoes -> Fonte e catalogo. Atualizacao
adiada nao atesta consulta; encerrar reproducao/transmissao, ou recarregar e
abrir configuracoes antes de reproduzir, sem apagar armazenamento/ativacao.
DIRECTORY_SOURCE_NOT_AUTHORIZED tambem pode indicar geracao da fonte/catalogo
inconsistente, alem de negativa comercial: nunca contornar esse guard.

Para atualizar, publicar main pelo fluxo Git autorizado e verificar o status
da implantacao e /app. Os comandos Android/build e web local permanecem
separados. Nenhum APK precisa ser reinstalado para atualizar este site.
