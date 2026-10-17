# C136 - conferencia web local/LAN - 2026-10-17

Spec previa e emendas: [contrato](../architecture/C11_BROWSER_LOCAL_VALIDATION.md).
Operacao: [WEB_LOCAL](../WEB_LOCAL.md). CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Proveniencia e isolamento

Preflight do clone independente ativo confirmou main, origin esperado e
HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d. AGENTS, Architecture/Execution,
Source Boundary e Activation Lock lidos. Baseline1128 arquivos anterior ao
codigo C136, memorias por prefixo e APK1.0.24 preservados. Estado dirty C133-135
foi inventariado, nao normalizado. Sem operacoes Git, backend ou Android.

Implementacoes web so em dev/--mode web e excluidas de plataformas nativas.
Cofre AES-GCM/IDB nao exporta chave nem grava fonte em plaintext. Servidor e
estatico, sem proxy/relay, API administrativa ou consulta de midia. Autoridade
remota real, C9, PIN/PUK e vinculo continuam os existentes. Browser nao recebe
identidade/segredos copiados de outro origin.

Usuario pediu preservar outros aparelhos. device-direct-fetch.ts foi restaurado
por hash; diagnostico e adaptador de arquivos ficam somente no novo runtime
web. Todos os arquivos source/bootstrap/catalog/search/Android mantem bytes da
baseline. App altera apenas dois guards de retorno/proximo episodio; callbacks
exatos. Bridge/cofre alteram registro condicional e guards de progresso. Hero
altera somente pausa hover/foco no modo web; nativo mantém politica anterior.

## Defeitos encontrados e correcoes

1. Catalogo VALIDATION_FAILED com fetch2XX: FilesystemWeb produz caminho virtual
   /DATA/prebuilt e convertFileSrc web identidade. Fast path recebia HTML200 do
   Vite. Adaptador web entrega JSON/binario IDB via API Filesystem; leitores
   consolidados nao mudaram. Negativa/positiva usam FilesystemWeb real.
2. Episodio retornou NATIVE_ERROR: resolver compartilhado inclui UA fixo
   IPTVSmarters/1.0, header indisponivel ao JS web. Normalizacao web remove apenas
   esse padrao e usa UA do browser. Headers custom proibidos continuam falha.
   Resolver, URI e Android nao foram alterados.
3. Live tinha menu na previa: overlay e controles agora somente fullscreen.
   PIN esconde superficie/paineis; transicoes/stop liberam transporte unico.
4. UI HTML5 diferia do tablet: controles web personalizados com titulo, Back,
   bloquear, pausa/saltos10s/progresso/volume/ajustar/velocidade/trilhas/episodios.
   Mesmo video/transporte; episodios liberam anterior antes do evento/C9. Sem
   audio/legendas Live. Trilhas ausentes nao sao fabricadas.
5. Desktop tinha teto1440px: Home, Filmes/Series/categorias/detalhes usam largura
   disponivel e gutters16-24px. Apos refinamento explicito, Hero usa cover e
   altura100dvh-170px (min340px; segundo incremento40px), deixando parte da primeira fileira visivel.
   Player continua contain. Sidebar central com scroll acessivel sem barras visiveis.
   Backdrop sem escurecimento global; gradiente radial somente atras de copy
   e acoes, seguindo stops do CSS nativo, com sombra de texto para contraste.
   Fonte da sinopse ampliada para18px nos Heros web e detalhes wide.
   Somente atributo web + viewport/mouse; perfil phone mantido. Quantitativo
   oculto somente no cabecalho inicial de Filmes/Series; contagens intactas.
6. Hero parava por hover/foco e reduced-motion: modo web permite timer10s por
   pedido explicito, sem fade no movimento reduzido; conserva gestos,
   offscreen/hidden/loading/player e elegibilidade existentes. Diagnostico
   local de estado/timer/ticks/contagem/posicao sem ID/URI. Usuario confirmou
   troca apos Ctrl+F5/25s. Previa Live limitada50dvh+50px/teto570px para mais EPG,
   com incremento50px expressamente solicitado apos a reducao inicial.
7. Space na busca era convertido em click pelo D-pad. Capture listener web
   para input.search-input impede esse handler, sem preventDefault da insercao.
   Engine, SearchPage e useDpadNavigation permanecem exatos.

Player web inicia com contain explicito e Android XML/plugin com FIT confirmado
read-only. Preencher e opt-in, com crop esperado; Ajustar mostra video inteiro.

## Verificacao

23 suites locais, incluindo cofre9, arquivos5, player10, servidor4, Hero5,
teclado3; T4bridge11, C9runtime10, parental C126/C128, cronometro, fonte ativa,
leitor adulto, Live teardown/keys, automatic refresh19, boot15, busca completa
e selecao Live8, SSR BrowseHero, swipe e foco Fire. DOM/media/clock/transportes
de teste sao sinteticos, sem requests comerciais. Cofre usa WebCrypto real e
FilesystemWeb usa IndexedDB fixture. Nao sao testes de decodificacao fisica.

Testes historicos exigiram portas atuais, sem relaxar asserts: T4 nao tinha
storage parental nem metadata.snapshotId (mesma falha10/11 com bridge baseline);
C105 nao tinha parentalLiveCatalog nem aguardava verificacao local antes da
arte; SSR BrowseHero sem device-presentation; C128 sem validation web=false.
Falhas iniciais registradas, ultimas execucoes passaram. Helpers privados e
logs em tmp/c136-browser-web, incluindo verificacao consolidada por caso.

Typecheck/build padrao e web passaram com lock26ativacao+27promocao+9negativos.
Build padrao nao contem chunks/JS de WebPlayer/WebSourceStore/HLS/MPEGTS; CSS
novo e condicionado por atributo web que o nativo nao recebe. Aviso de tamanho
de chunk/externals ja conhecido. npm audit identificou somente tres advisories
dev transitivos presentes no lock baseline; nao aplicar atualizacao fora do
escopo. Assinatura/Java/recursos/APK nao recompilados neste ciclo.

Servidor HTTPS3443 iniciado oculto; certificado gerado fora do workspace,
senha PFX protegida por DPAPI. Nenhuma raiz instalada. HTTPS com validacao de
certificado/hostname em loopback e IP local, app200/.env403/API404 PASS.
Outro cliente fisico LAN e confianca de seu navegador ainda exigem configuracao
local pelo usuario. Primeira inicializacao detectou newline no DPAPI; Trim
corrigido, sem recriar certificado. Fixture HTTPS capturou socket antes do end.

Auditoria final exige15 existentes allowlisted,18novos,1113 baseline preservados,
memorias append-only, HEAD/main/origin/index inalterados. Relatorio privado
audit.json verifica inversao minima do delta App/bridge/facade/Hero e todos os
hashes das fronteiras consolidadas. APK anterior SHA256
559cbe905898853765f9f4c3f8ac7373870c62885aa5607912a8a4a1da8514cd.

Apos diagnostico adicional da rotacao, Hero5, C12811 e SSR BrowseHero passaram
novamente. Comparacao dos callbacks reais de timer atual/baseline em todas1024
combinacoes de gates com web=false confirma politica nativa identica e zero
marcadores web. Fora do efeito de timer/observabilidade/flag, corpo do componente
igual a baseline. Novos builds repetem lock e DCE das implementacoes web.

## QA real e limites

CUA nao disponibilizou superficies/browsers; nenhuma automacao alternativa foi
usada na aba real. Usuario confirmou Home com fonte real, canais Live com
imagem, reproducao apos fix UA e controles personalizados funcionando. Imagens
posteriores mostram largura ampliada e primeira categoria. Rotacao10s tambem
confirmada pelo usuario depois do ajuste. Ultimos refinamentos
de Space/quantitativo/layout aguardam conferencia visual manual por Ctrl+F5.
Nao afirmar todos os codecs/fontes, Cast/PiP/controle fisico ou UI nativa
certificados pelo navegador. Nenhum reset de identidade/armazenamento, nova
instalacao, push, PR, publicacao internet ou escrita Supabase.
