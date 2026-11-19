# HERO-PLAYABLE-VERIFICATION-01 — arquitetura bloqueada antes do código

Data: 18/11/2026. Autorização: resposta expressa “SIM” do usuário ao gate de verificação de mídia do hero. Não inclui commit, push, Supabase, build ou instalação. Workspace isolado em `main`, HEAD `81a17020709b0abdb02e912d389a2445bb2fccc8`, origin canônico. Alterações históricas locais foram preservadas.

## Requisito atualizado

O hero de Home, Filmes e Séries deve escolher títulos presentes no catálogo ativo e reproduzíveis para o usuário. Prioridade indicada pelo usuário: Tendências Hoje → Tendências da Semana → títulos de 2026 → títulos de 2025 → títulos aleatórios da fonte, com referência TMDB nas quatro primeiras faixas e filtro por tipo da página. O usuário também pediu conteúdo no hero o tempo todo. A última faixa veio em resposta expressa posterior e não dispensa prova de reprodução.

TMDB fornece ranking e dados descritivos, não autoridade sobre a mídia privada da fonte. O catálogo local contém referências, mas um título listado pode receber HTTP 403 ao abrir, como nas evidências de playback anteriores. Nem `streamId`, HEAD, HTTP 200 do manifesto HLS, `STATE_READY` ou retorno `NATIVE_PLAYER_OPENED` comprovam por si sós que o vídeo foi renderizado. O `onRenderedFirstFrame()` em `NativePlayerActivity.java` é a observação mais forte já presente; hoje só gera checkpoint/log, sem prova associada ao hero. O progresso nativo é observado depois da reprodução real e não cobre títulos ainda não assistidos.

## Resultado da verificação arquitetural

Não existe atualmente adaptador de disponibilidade por título com contrato do provedor. O resolvedor direto apenas produz URI e headers efêmeros. Criar testes automáticos de mídia para preencher o hero demandaria novos fluxos de requisição/decodificação, com equivalência ao player, autorização e limite C9, limite de concorrência/bytes, cancelamento efetivo e correlação de fonte, geração, snapshot, edição e rede. Esses controles não estão demonstrados. A atividade visível atual não oferece um modo de primeiro quadro oculto e limitado. Lançar vídeos em segundo plano para cada candidato sem esses controles arriscaria consumir dados, slots da fonte e decodificadores, inclusive durante uma sessão legítima.

Mesmo um primeiro quadro válido é evidência temporal da abertura, não garantia de reprodução integral nem de acesso futuro. Mudanças de IP, credencial, URL assinada, fonte ou política do servidor podem invalidá-lo antes do clique. Uma prova passiva estrita deixaria o hero sem conteúdo em instalações novas até o usuário reproduzir algo, o que conflita com o requisito “nunca vazio”. A sequência de fallback reduz a chance de falta de candidatos, mas não elimina o caso de catálogo vazio ou de todos os recursos negados; exibir conteúdo nesse caso seria afirmar falsamente que é assistível.

## Contrato proposto para implementação futura

1. Um adaptador por protocolo só pode promover `VERIFIED_START` após prova de mídia real com o mesmo transporte e autorização do player, de preferência primeiro quadro; sucesso de playlist/HEAD é insuficiente. `UNKNOWN` e erro transitório não são sucesso.
2. No máximo uma verificação ativa por vez, nunca durante playback, Cast ou sessão C9 ocupada. Fixar orçamento de dados, tempo e candidatos e comprovar cancelamento no transporte efetivo antes de habilitar por padrão. Não sondar URLs assinadas de uso único sem contrato da fonte.
3. Manter apenas estado local efêmero, vinculado a dispositivo, fonte/versão/epoch, snapshot, stream/episódio, geração de rede e autorização. Descartar resposta tardia e revalidar no clique. Não enviar URL, headers ou catálogo ao TMDB/backend.
4. Ordenar candidatos como Hoje → Semana → discover TMDB por ano 2026 → 2025 → candidatos locais aleatórios da fonte; cruzar com a fonte antes de qualquer verificação. Para séries, verificar o episódio que o botão do hero efetivamente abrirá. Aleatoriedade não é prova de acesso e deve ter limite finito de tentativas.
5. Se nenhuma faixa produzir recurso reproduzível comprovado, apresentar indisponibilidade explícita. Nenhum algoritmo pode cumprir a exigência de conteúdo assistível “sempre” quando a fonte não entrega nenhum recurso.
6. Testes obrigatórios: 403/401/404, GET versus HEAD divergentes, HLS com manifesto 200 e segmento 403, MP4/TS, URL de uso único, fonte/rede trocada, resposta tardia, C9 ocupado, cancelamento e orçamento, primeiro quadro, fallback por faixa, Fire/tablet e preservação do player e histórico.

## Decisão deste gate

`ARCHITECTURE_CHECK=BLOCKED`: falta um transporte de verificação com segurança comprovada e há conflito lógico entre “sempre conteúdo” e “somente assistível” quando a fonte não disponibiliza candidatos. `PRODUCT_CODE_MODIFIED=NAO` neste gate; o seletor anterior de catálogo continua experimental e não foi instalado por este gate. Nenhum probe, build, APK, instalação, alteração de fonte, Supabase ou Git write foi executado. A fase de implementação não começou.
