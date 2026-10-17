# C154 - aplicativo web publico - 2026-10-17

Preflight e especificacao em C11_WEB_PUBLICATION.md. Baseline1194, HEAD
a808826693c8452c96f58841117f9a4521c46596, main/origin canonicos, limpos antes.
Git/publicacao autorizados pela continuacao do pedido do usuario. Destino
nm3x/app; rotas do painel e scripts dedicados existentes preservados.

Novo entry injeta config publica antes do import real do main e bloqueia
ambiente inseguro/projeto/chave invalidos. Novo build compoe painel na raiz
e consumidor em /app, sem API/proxy/servidor de catalogo. Envio de somente
URL/chave Supabase publishable; credencial TMDB local excluida deliberadamente.
O artefato publico precisa usar imagens da fonte; enriquecimento TMDB sem
configuracao propria autorizada nao foi certificado.

Validacao local: lock antes/depois e no site:build PASS (26 ativacao,27
promocao,9 negativos,6 paths). site:build integral PASS: TypeScript, Vite
painel, Vite app, composicao segura, C1517/7 e C1548/8. Cofre web9, player10,
catalogo5 PASS com portas sinteticas, crypto/IDB/lifecycle conforme suites.
Avisos Vite de chunks grandes e externalizacao Node no app nao foram tratados
como erro nem justificativa para refatorar o runtime consolidado.

Chrome real headless isolado, perfil exclusivo no temporario do SO, sem
anexar navegador do usuario: HTML/JS/CSS carregados e tela de ativacao renderizada,
contexto seguro, layout web ativo e badge ausente. DOM/estado/chaves do
dispositivo ficaram somente em RAM/perfil privado, sem logs de valores.
Nao houve ativacao/vinculacao de fonte ou teste de catalogo/video real; o
fluxo normal de inicializacao pode registrar metadata da nova instalacao.
Nao equivale a QA visual manual ou acesso ao navegador ja ativado do usuario.

Ocorrencias de verificacao: leituras de nomes presumidos de arquivos C136 e
browser-runtime-bootstrap nao encontrados, corrigidas por inventario rg;
nenhum arquivo funcional ausente. A primeira expectativa headless exigia
picker, mas requiresDevicePresentation exige escolha apenas no Android: web
deve abrir ativacao. Dump com relogio virtual tambem nao aguardava readiness
de forma deterministica. Substituido helper privado por espera do DOM com
relogio real, somente em Chrome criado pelo proprio teste; PASS. Nenhum
guard do produto, fixture de ativacao ou prazo foi alterado para isso.

MCP Vercel ainda aponta somente para xandeflix4; nenhuma mutacao nessa conta.
Publicacao usa Git integrado a main em xandeflix2. CUA sem superficies; nao
contornado para acessar perfil do usuario. Pedido adicional de dominio
xandeflix.vercel.app: GET200, propriedade/disponibilidade nao confirmadas;
perguntado ao usuario, sem tomar/revincular dominio ou alterar DNS/projeto.

Antes do envio: auditar9 existentes +8 novos,1185 arquivos baseline preservados,
inversa dos patches, prefixos das memorias/docs, segredos em arquivos e assets,
APK149 e stage nominal. Confirmacao Git e HTTPS remota sera registrada apos
execucao real. NEXT_GATE_STARTED=NAO.


## C154 - envio e publicacao HTTPS confirmados - 2026-10-17

Commit funcional 4505bcef8e374a3c589162bad0f72cd970f2b105 enviado a origin/main e conferido
por ls-remote/divergencia0/0,17 caminhos/blobs auditados,1185 arquivos baseline
preservados, APK149 intacto. Implantacao Vercel nm3x9sSdkmMfqSwCSitMhSntipiye18Y
com check GitHub success. HTTPS real: raiz/admin e /app(/)200 com entradas
separadas, assets200 e headers; /.env.local e /api/control-plane/state404.
Chrome isolado real-time no dominio publico renderizou ativacao, contexto
seguro e layout web sem badge. Fonte/catalogo/video reais nao certificados:
o novo origin exige ativacao legitima pelo gestor, sem copiar localhost.
Monitor auxiliar inicialmente comparou contexto com travessao Unicode que
PowerShell codificou diferente; corrigido para sufixo ASCII do projeto. Nao
era ausencia de deployment nem falha do produto.

Usuario confirmou que xandeflix.vercel.app pertence ao seu projeto
xandeflix4s-projects/xandeflix. Perguntou sobre excluir/mudar endereco; nenhuma
exclusao, transferencia, tomada de alias ou mutacao da equipe antiga foi
realizada. Conexao correta xandeflix2 ainda nao disponivel ao agente; orientar
alterar somente dominio no painel, preservando projeto/dados, e adicionar ao
projeto novo apos liberacao. Alterar nome do projeto sozinho nao comprova
reatribuicao do dominio. Este fechamento altera somente evidencia/memorias.
Publicacao /app concluida; troca de dominio ainda nao concluida.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
