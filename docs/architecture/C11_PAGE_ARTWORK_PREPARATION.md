# C11 — preparação visual das páginas — 2026-10-06

Pedido explícito: iniciar o carregamento dos elementos definidos pela regra de
exibição ao abrir a página, reduzindo espera e saltos visuais em conexão fraca.
Mesmo clone/main/origin/HEAD deste ciclo. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Sem novo Gate, Git, backend ou escrita no projeto protegido.

Observação anterior ao patch: cards usam lazy e só ativam fallback/cache perto da
viewport; carrossel não prepara seus cards laterais. Prefetch de categoria aquece
apenas oito pôsteres. Fila de imagem limita dois ativos e 24 pendentes; cache
nativo já persiste bytes com limites. Não baixar catálogo inteiro ou vídeo, nem
bloquear entrada da página esperando internet. Metadados locais, episódios e
ações continuam independentes de enriquecimento opcional.

Allowlist: src/ui/components/{Artwork,MediaCard,MediaRail}.tsx,
src/artwork/{image-load-queue,artwork-preload.service}.ts,
src/ui/hooks/useRailArtworkPreparation.ts, src/index.css,
scripts/test-c11-page-artwork-preparation.mjs e somente novos shims de importação
dos testes SSR source-first; este contrato, evidência correspondente, relatório e
memórias append-only. Grid/Search não precisam mudar: MediaCard aplica preparação
aos cards já selecionados por suas regras atuais de 48/50 itens.

Comportamento: preparar os pôsteres do lote renderizado da grade/busca desde sua
abertura. No carrossel, preparar os até 20 cards da faixa quando ela ou a próxima
faixa se aproxima da tela; nunca aquecer todas as categorias da Home simultaneamente.
Hero tem prioridade sobre fila de pôsteres. Fonte é tentada primeiro; falha dispara
o fallback TMDB já existente, mantendo critérios contra homônimos. Imagem somente
é apresentada após carregar/decodificar, com espaço reservado e indicador discreto.
Preparação não torna APIs obrigatórias, não oculta ações e não acrescenta autoplay.

Fila compartilhada: dois ativos, até 128 pendentes e 96 sucessos recentes, mantendo
somente URLs/dimensões em RAM. Cancelar jobs ainda enfileirados quando nenhum
consumidor os usa; um consumidor que compartilha uma imagem impede cancelamento
indevido. Requests em curso conservam timeout de oito segundos. Falhas não são
cacheadas como sucesso; online/reabertura pode tentar novamente. Prefetch de
categoria prepara até 48 pôsteres e respeita cancelamento; hero conserva seleção
até oito candidatos. Cache Android existente não muda seus limites/TTL.

Aceitação: concorrência/prioridade/deduplicação/quota/cancelamento compartilhado,
fallback e reutilização de cache, browser real com carga atrasada e sem saltos de
layout; primeira instalação/ativação/C9/Java preservados. Cold/offline não podem
ter garantia de instantaneidade: a página mantém títulos e ações utilizáveis,
indicador de preparação e cache das imagens já disponíveis.
