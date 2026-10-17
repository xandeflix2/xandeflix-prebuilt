# C151 - preparacao do painel online e publicacao Git - 2026-10-17

Spec anterior: docs/architecture/C11_MANAGER_VERCEL_PRODUCTION.md.
Clone ativo/main/origin esperado, HEAD inicial
bd7e10c7c069df66328309105b6b210d04c7cf2d. Baseline1182, continuidade C150
por hashes, allowlist local e memorias append-only. Usuario autorizou depois
expressamente commit e push do projeto, incluindo cumulativo C133-C150 e C151.

## Implementacao e verificacoes

Entrada independente manager.html/src/manager, build manager:build/config Vite
proprio e vercel.json. Reusa ManagerPanelPage/Auth/RPCs/recuperacao existentes,
sem editar esses componentes/servicos. Nao monta App, boot, catalogo, player
ou gate de aparelho. Projeto Supabase canonicamente fixo, chave publica
sb_publishable_ exigida; config ausente/privada/projeto errado falham fechados.
Padrao debug/webvalidation desligados. Ambiente explicito de2 campos publica
somente URL/chave permitidas; TMDB e demais valores locais excluidos do bundle.

Rotas raiz/admin/master/manager e recuperacao apontam ao painel; papeis
continuam vindos do servidor, sem credenciais padrao. Nenhum endpoint de API
local/catch-all/proxy adicionado. .vercelignore exclui segredos/artefatos, mas
mantem XML/fonte Android necessarios ao lock. Guia docs/VERCEL_MANAGER.md.

Testes finais: C1517, C70 escopo8, recuperacao15, guia/foco C1489, PIN clock12
PASS; suite startup5 grupos PASS, web player10/store9/catalog5 PASS.
Todas portas sinteticas, sem enviar emails, alterar senhas ou operar contas
reais. Lock26 ativacao+27 promocao+9 negativos PASS antes e nos builds.
Builds dedicados/typecheck9.85s, padrao24.98s e web26.00s PASS.
6 assets do painel: config publica realmente embutida, sem chave TMDB,
debug/consumer entry/player chunks/sourcemaps. Config real Vite recusou chave
privada sintetica. Revisao React: bootstrap fora de render, sem hooks novos,
inicializacao unica antes do StrictMode e recuperacao capturada antes do SDK.

Motor/native/App/catalog/search/playback/politicas/versao/dependencias atuais
permanecem identicos a baseline C150; somente script novo package e ignore
alem de novos arquivos C151. package-lock dependencies conferem. APK149
44b885186d48d1c96773f7b00fd554a95c95039430a920217aa2a1ae752cce54 intacto.

## Limite da publicacao externa

A integracao Vercel disponivel listou somente equipe xandeflix4 e outro
projeto. Usuario proibiu esse destino e solicitou nova conta/usuario para
xandeflix2. Nenhum recurso foi criado/alterado/publicado em nenhuma conta.
CUA vazio e abertura do cadastro retornou No browser is available. Cadastro,
verificacao e nova conexao devem ocorrer com o usuario; equipe/projeto ainda
nao autenticados. Sem link de producao e sem login real homologado online.
Supabase ja existente preservado, sem novas tabelas/projetos/roles/RLS/Auth
config ou chamada administrativa. Somente exemplos/public docs consultados.

## Falhas e correcoes antes do envio

Primeiro bundle9.73s gerado sem embutir a chave publica ao usar define de
import.meta.env; verificacao de artifact falhou corretamente antes do deploy.
Corrigida somente injecao no entry por constante publica dedicada no
runtime-config consolidado. Teste novo executa o entry e confirma config antes
da criacao do cliente; segundo bundle e verificacao PASS. Nenhuma publicacao
do bundle incorreto. Warnings Vite de externalizacao/chunks anteriores.

Auditoria de segredos marcou2 URLs de fixtures negativas anteriores no HEAD:
teste T13 de nao vazamento usa interpolacao de marcador sintetico; teste T4
rejeita credenciais literais user/pass em host ficticio. Revisao sem imprimir
valores, igualdade exata ao HEAD; classificadas somente essas2 ocorrencias
como fixtures, sem editar testes ou ignorar arquivos inteiros. Zero achados
reais; scan inclui valores locais em RAM e nao os persiste em relatorios.

Erros operacionais read-only: list_projects requer teamId na raiz, corrigido;
caminho Supabase client inferido nao existe, usado integrations/supabase real;
public/ nao existe (nenhum asset publico adicional). Sem escrita/efeito remoto
nessas tentativas. Confirmacao Git/PUSH sera registrada apos execucao real.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## C151 - commit e push confirmados - 2026-10-17

Commit principal 1496c6b9a7c3336ea6895a2be158db8b0803c90f enviado a origin/main e conferido
independentemente por ls-remote, divergencia0/0 e arvore limpa.136 caminhos
e blobs iguais ao manifesto auditado, zero achados reais de segredos,
2 fixtures negativas antigas revisadas; arquivos privados/APK149 excluidos
e preservados. Auditoria C151 baseline1182/1177 preservados,11 novos,
6 assets do painel verificados; builds/testes/lock PASS. GitHub agora contem
a configuracao dedicada Vercel e os patches C133-C150. Este fechamento e
exclusivamente documental, sem nova mudanca funcional. Publicacao Vercel
ainda nao iniciada: nova conta/conexao correta necessarias; nenhum uso ou
mutacao de xandeflix4, Supabase ou dispositivos. NEXT_GATE_STARTED=NAO.
