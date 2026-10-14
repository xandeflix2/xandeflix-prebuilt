# C106 — detalhes pela imagem, autoplay e fonte Fire

Data2026-10-14, clone ativo independente/main/HEADd039f883, origin esperado.
Preflight/AGENTS/Architecture/Execution/Source Boundary/Activation Lock lidos.
Spec anterior ao código: architecture/C11_HERO_ARTWORK_DETAILS_TAP.md.
Baseline privado52 arquivos anteriores protegidos; APK C105ac27afc0 preservado
em tmp/c106/Xandeflix-v1.0.19-c105-recovery.apk. Sem Git/backend/reset/publicação.

## Implementação e validação inicial

Hero compartilhado cria ação transparente acessível somente PHONE/TABLET,
independente de orientação, atrás de metadados/botões. Usa exatamente onSelect
e item atual do Ver Detalhes. Teclado também disponível. Movimentos/cancelamento/
troca de item rejeitam clique residual; gesto continua propagando ao carrossel.
HomeHero admite início de swipe na nova área e suprime clique de drag vertical/
lento/cancelado, inclusive quando só há um destaque. Nenhum stream/C9 mudou.

Fire C105 real: hero5 dots, visível, reduced-motion=false, foco Assistir; sem
troca após11,5s. Emenda deixa foco/hover remoto em standby sem bloquear autoplay
SOMENTE Fire. Gestos/loading/playback/hidden/reduced-motion mantêm pausas.
Timer10000ms usa ref com avanço atual; chegada de artes sem mudar item não
reinicia relógio. Outros perfis mantêm pausa de foco/hover. Fonte Live real
antes: categorias10px, canais13,6px. Override Fire do nome usa tv-font-xs,
mesma escala atual da categoria; subtexto não fica maior que nome. Altura64px
da janela e todos os canais permanecem como C105, categorias não alteradas.

Teste novo8 grupos PASS com componentes/handlers reais e ports isolados:
perfis/orientação/exclusão TV/desktop; onSelect único e item atual; acessibilidade;
drag/cancel/stale/teclado; swipe; single-option; botões/dots; timer Fire focado10s
e dependências estáveis na chegada de arte; pausa das demais condições.
Regressões Home/browse/swipe/playback/D-pad e lista contínua executadas.
Mocks de SSR antigo só ganharam ports de apresentação; assertions preservadas.
Nenhuma requisição de rede nos testes, dados sintéticos.

Erros encontrados e corrigidos: fixture inicialmente omitia tmdbPosterPath;
apresentação da fixture adicionada. Build pegou fechamento JSX faltante na
condicional do botão; corrigido sem alterar critério/lock. Timer mock tinha
identificador return1 no lugar de retorno numérico; corrigido para
`return 1`. TranspileModule sozinho não substitui typecheck/build. Registrar
PASS final somente após artefato/QA correspondentes.

Revisão React/CSS identificou regra global `.focusable-item:focus` que muda
position para relative. Área de imagem usa sua própria classe e foco visível,
sem classe de navegação D-pad: botão nativo permanece acessível por Tab/Enter/
Space e mantém hit area absoluta quando focado, sem alterar alvos D-pad antigos.
Refs limitadas a um gesto/handler, sem novas filas/cache/chamadas de rede.

## Transição Live, moldura e artefato final

Emendas explícitas recebidas no mesmo ciclo, especificadas antes do patch.
App registra guard de saída Live: Home/Back/outras rotas aguardam cancelamento
e cleanup confirmado, inclusive start/C9 pendente. Última intenção vence;
cleanup compartilhado evita release duplo. Falha de stop mantém página/ID/C9
e permite retry. Troca de canal mantém superfície/modo e suspende antes de
release. Cast deixa de atrasar o fechamento visual, ficando após stop/suspend.
Nativo stopPreview agora retorna accepted=true; resposta antiga só tinha
previewStopped, incompatível com a leitura accepted do bridge. Stop stale
rejeita ID de outra superfície; releasePreview oculta PlayerView antes de
decoder/Cast/PiP, sem ocultar host/WebView. Nenhum novo acesso/C9/source/lease.

Moldura interna CSS1px branca28% em todos os heroes, pointer-events:none,
raio herdado. Fire Home/Filmes/Séries aproximadamente6% mais baixos, mesma
largura/contain da arte e controles internos. Outros perfis sem redução.
QA real Fire960x540: Home880x465,30 (antes495); Filmes/Séries880x416,98
(antes443,6). Quadro/metadados/ações/dots contidos, arredondamento/rolagem
subpixel até1,11px; helper admite2px por rasterização, não overscan funcional.
Tablet/celular linha computada .533333/.857143px devido zoom/rasterização;
CSS continua1px e moldura não intercepta toque. Dimensões preservadas.

Novo teste Live8/8 com callbacks reais/ports sintéticos: start/stop/Cast/C9
atrasados, cancelamento antes do start, superfície retida em troca de canal,
unmount, intenções repetidas e falha/retry. JVM33 suites/197 testes, zero
falhas/erros, incluindo stale stop nativo. C9 runtime10/10; hero8/8 + regressões
Home/browse/swipe/Assistir/D-pad; seleção Live8/8 e lista contínua6/6 PASS.
Lock26 ativação+27 promoção+9 negativos PASS antes/depois/prebuild; tsc/Vite,
cap sync, assemble e conferência dos7 assets exatos PASS. Mesma assinatura,
package com.xandeflix.prebuilt, versionCode19/versionName1.0.19, min23/target35,
HTTPS, sem dev server/logging. Não publicado no updater.

APK de teste recuperável: tmp/c106/Xandeflix-v1.0.19-c106-hero.apk,
11.435.144bytes (10,9MiB), SHA256
e0ff71de1715bd44c93493cf0585d0465e2dbd850ee2e26f18b191c45c0683de.
APK C105ac27afc0 e7 arquivos congelados C100 preservados. Baseline52 arquivos
pré-C106 preservado; App/Live e mock Live são3 exceções explícitas da emenda,
49 demais conferidos byte a byte;4 cópias pré-transição e mock original retidos.
Mock antigo recebeu somente useLayoutEffect, sem alterar assertions.

Instalações-r Success/hash exato em Fire USB AFTSS, celular USB SM-S926B e
tablet Wi-Fi SM-X610; respectivos67/2471/978 arquivos files+shared_prefs
byte-idênticos entre freeze e pós-instalação ANTES de launch. UID e data da
instalação original iguais. Identidade/chave/ativação/fonte/catálogo preservados;
nenhum uninstall/reset/restauração. Atualização automática posterior normal
pode alterar catálogo/cache, sem invalidar essa conferência anterior ao launch.

QA real após launch: celular/tablet, toque touch/CDP na imagem abre detalhes
do MESMO item em Home/Filmes/Séries (comparação privada no aparelho, sem IDs/
títulos reais exportados). Swipe horizontal muda destaque sem abrir detalhe.
Acessibilidade/keyboard/drag/cancel/stale cobertos nas fixtures; tablet também
verificou foco real absoluto. Fire sem nova ação de imagem; autoplay com foco
Assistir mudou após11,5s em cada uma das3 páginas, foco preservado. Fonte real
categorias10px/canais10px; última linha de234 canais, filtro distante, D-pad
47↔48 e preview preservados. Três saídas Live→Home observaram confirmação
nativa accepted ANTES do mount da Home; intervalos stop→Home1331/1505/1413ms
incluem Cast/C9. Isso verifica ordem de lifecycle, não medição de frame de
vídeo/filmagem da tela. Nativo GONE anterior ao release é conferido em código.

Erros auxiliares corrigidos sem rebaixar critérios: fechamento extra em App
pegou TS1128/typecheck; mock antigo precisava useLayoutEffect; quoting de regex
PowerShell foi substituído por helper estruturado/XML nativo; PID consultado
cedo demais foi relido após launch. Celular bloqueado adiou CDP/QA; usuário
desbloqueou. Probes iniciais usavam nó substituído no RAF, Fiber alternada e
ponto sob cabeçalho em rolagem; medição passou a reler nó após layout, comparar
item do título visível em memória, confirmar hit test real e esperar transição
estabilizar. Toque genuíno sem foco artificial passou nas3 páginas. Não houve
patch de produção motivado por esses erros do harness nem relaxação do lock.

Limites C105 permanecem: Home90s não homologada, playback filme/episódio e
retenção de snapshots C102 pendentes. Sem Git/backend/credenciais/env/publicação/
novo Gate ou instalação em dispositivo desconhecido. Artefato disponibilizado
para instalação manual no outro aparelho solicitado. Forwards/objetos privados
de diagnóstico limpos após QA. Na consulta final ADB estava parado, foi iniciado
pelo CLI, forwards9222/9223 já não existiam e tablet Wi-Fi já desconectado;
isso ocorreu após instalações/hash/preservação/QA completos, sem novo install
ou alegação de conexão posterior. CURRENT_LOCAL_CYCLE=C106_UI_INSTALLED;
NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO.
