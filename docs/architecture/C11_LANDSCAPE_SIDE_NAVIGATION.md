# C11 — Navegação geral lateral em paisagem

## Autoridade e preflight — 2026-10-04

Usuário solicita refinar o menu geral antes de retomar desempenho de abertura
do Fire Stick. Menu superior deve ficar à esquerda em paisagem no tablet/Fire
Stick/TV, acessível a partir das categorias sem voltar ao topo; NÃO no celular.
Preservar todas as funcionalidades consolidadas. CURRENT_GATE=NONE, ciclo local
autorizado de UI/navegação; nenhum próximo Gate ou correção de performance.
Workspace único C:\Xandeflix\xandeflix-prebuilt-c11-main, origin esperado,
main/ahead 2, HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. Contratos AGENTS,
Architecture/Execution/Source Data Boundary/lock lidos, dirty preservado.
394 hashes de baseline capturados; lock prévio 49 casos + 9 negativos PASS.
Sem commit/push/PR, backend, alteração de políticas ou reset/instalação física.

## Especificação anterior ao código e aos testes

1. Uma única navegação principal reutiliza os callbacks/rotas existentes.
   Manter Início, Filmes, Séries, Canais, Busca E Ativação/Voltar, sem remover
   funcionalidades existentes. Não duplicar uma segunda árvore de páginas.
2. Sidebar fixa à esquerda somente em viewport paisagem com largura >=768 CSS
   px em dispositivos não-phone. Identificação de phone por UA/mobile hint;
   TV explícita (Fire/AFT/SmartTV etc.) tem precedência sobre UA Mobile genérico.
   Fallback não-phone exige menor dimensão de tela >=600 ou altura >=480 CSS
   px, contemplando Fire WebView 960x540. Tablet em retrato mantém layout atual;
   teclado em tablet não pode trocar para sidebar enquanto orientação física
   ainda é retrato. Celular em ambas orientações mantém layout consolidado.
   Classificação é só visual, não usa/edita identidade, licença ou tipo cadastrado.
3. Conteúdo recebe espaço lateral real, sem sobreposição nem scroll horizontal
   global. Menu permanece disponível durante scroll profundo; safe areas, foco
   visível, touch/mouse e scroll interno em baixa altura preservados.
4. D-pad em sidebar: cima/baixo percorrem opções, direita retorna ao último
   controle de conteúdo ainda válido/visível (ou primeiro controle local).
   Esquerda no primeiro card de qualquer rail vai ao menu ativo sem subir a
   página; demais cards continuam indo ao anterior. Navegação vertical entre
   rails e Enter/Back mantêm semântica. Grades usam colunas CSS reais no modo
   lateral para não quebrar alinhamento ao reduzir largura de conteúdo.
5. Guardar último foco em ref, sem rerender/consulta global a cada tecla. Não
   interceptar modal/player nem edição esquerda/direita de input/textarea.
   Sidebar usa foco preventScroll; retorno ao conteúdo preserva categoria e
   posição. Trocar orientação não remonta páginas nem rotaciona dados.
6. Não alterar App, ativação, source/backend, parser/persistência, busca,
   catálogo, player nativo, configuração Capacitor (HTTPS/logging none), backup
   ou dependências. Meta de 60s permanece pendente, trabalho não retomado aqui.

## Allowlist estrita

- src/ui/components/AppShell.tsx, Header.tsx; src/index.css.
- src/ui/hooks/useDpadNavigation.ts; novo useLandscapeNavigation.ts.
- Novo src/ui/navigation/landscape-navigation.ts, apenas regras visuais puras.
- scripts/test-c11-landscape-navigation.mjs, scripts/test-c11-landscape-navigation-browser.mjs,
  scripts/landscape-navigation-fixture.html e .tsx: fixtures sintéticas com
  Shell/Header/hook reais e rotas reais; nenhuma ativação/fonte/rede externa.
- Este contrato, referência de sucessão no lock, evidência
  docs/evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md, STATUS/EVOLUTION/ERRORS.
- Outputs normais build/sync/Gradle e APK raiz, com backup recuperável
  Xandeflix-v1.0.0-standalone-before-side-navigation.apk (85EB23B5...).
- Artefatos de teste gerados em tmp/c11-side-navigation: perfil isolado próprio
  de Chrome headless, screenshots sintéticos e cache Vite. Não usar perfil real.

## Verificação e aceitação

Skill browser/verification: fluxo desta mudança é controle/menu -> callback de
rota existente -> render local; NÃO há nova API/data dependency. CLI
agent-browser e superfícies CUA indisponíveis: fallback Chrome/CDP isolado com
recursos locais, sem dependências novas. Ao iniciar fixture Vite, verificar
imediatamente render, console, overlay e elementos, capturar screenshot. Só
depois testes de navegação. Não abrir App real/gestor/backend ou expor segredos.

Matriz: Fire 960x540 e 1280x720, SmartTV 1920x1080, tablet 1280x800 e 1024x600,
tablet retrato 800x1280, phone retrato e paisagem (inclusive largura >768).
Testar rolagem profunda/left/right/restauração, Up/Down/Enter/Back, todos os
destinos existentes/Ativação, grid alinhado, orientação, formulários e modais,
nenhuma sobreposição/overflow global e listeners descartados no unmount.
Checklist React: hooks/dependências/cleanup, refs transitórias, acessibilidade,
sem fetch/cópias de catálogo no layout. Provar fora da allowlist byte-idêntico.

Lock oficial antes/depois/prebuild/APK; guards ponte/notice/C9/VOD/catálogo
disponíveis, typecheck/build/sync, Java/assemble, assinatura/assets/package.
Somente entregar APK após PASS, sem presumir teste físico da nova UI. Instalação
em aparelho não autorizada neste ciclo; nenhum uninstall, clear ou alteração de
dados. Sem garantia matemática de zero bugs: documentar evidência e limites.

## Emenda de autoridade — instalação no Fire Stick primeiro

Após build/verificação local, usuário solicitou explicitamente: "ao concluir,
instale o apk no firestick primeiro". Autoriza atualizar in-place (-r) SOMENTE
com.xandeflix.prebuilt em 192.168.3.104:5555/AFTSSS, mesma assinatura/package;
não autoriza uninstall, pm clear, reset, pareamento artificial ou instalação no
tablet/celular. Substitui a restrição de instalação física anterior apenas
nesse alvo. Conferir hashes privados antes/depois em memória, sem publicar
valores nem digests; confirmar APK instalado por hash e abertura normal.

Allowlist adicional: scripts/verify-c11-side-navigation-firestick.mjs, probe
local com timeout/cleanup, saída sanitizada de DOM/foco/viewport, ponte CDP
temporária própria e eventos D-pad somente na UI. Artefatos/screenshots próprios
em tmp/c11-side-navigation; nenhuma leitura de fonte/token/localStorage ou
conteúdo privado, nenhuma escrita backend. Atualizar evidência/status após
teste físico, inclusive se houver regressão. Desempenho de 60s segue adiado;
não iniciar outro Gate nem otimizar importação nesse teste.

## Refinamento autorizado — opções somente com ícones

Usuário especificou que o menu lateral não precisa de textos Filmes/Séries,
somente ícones. Nesta mesma allowlist de Header/CSS, usar SVGs locais sem
dependência nova, ocultar rótulos VISUAIS apenas no modo lateral e reduzir a
largura para 80 CSS px. Preservar nomes via aria-label/title, callbacks/rotas,
Ativação/Voltar e textos do layout anterior nos celulares/retrato. Marca compacta
e status visual não devem causar overflow. Repetir política, verificação visual/
D-pad e guards/build/APK, atualizar primeiro o Fire Stick in-place, sem reset.
Primeiro APK lateral 56A35C7A... foi instalado com quatro arquivos privados
intactos e layout físico 960x540 PASS; D-pad ficou inconclusivo por timeout ADB,
não equivale a regressão nem a PASS. Próximo APK incorpora o refinamento.

## Regressão reportada — entrada em Categorias de Canais

Usuário constatou que, ao abrir Canais, direita não sai da sidebar para a
coluna Categoria. Evidência de código: LiveTvPage usa raiz div, não main; o novo
fallback de entrada só consultava main. Fixture genérica de rota não exercitava
o componente Live real. Latest regression wins: PASS anterior vale só para o
recorte testado, não homologação global da nova navegação. Corrigir neste mesmo
ciclo, sem avançar Gate ou alterar reprodução/ativação.

Allowlist adicional estrita: src/ui/pages/LiveTvPage.tsx SOMENTE um atributo
data-dpad-region="live-categories" na coluna de grupos. Não editar hooks,
serviços, seleção, paginação, sessão C9, preview, fullscreen ou back dessa tela.
Hook D-pad lateral deve usar .app-content como boundary quando página não tem
main, priorizar categoria ativa/primeira habilitada ao entrar, lembrar foco em
conteúdo div, voltar da coluna Categoria à sidebar e manter modais/player
escopados. Fora do modo lateral, algoritmo anterior permanece igual.

Fixture passa a usar LiveTvPage REAL com adapters virtuais locais sintéticos
de catálogo/bridge/sessão apenas no Vite de teste, sem URLs/rede/backend ou
player real. Espelhar raiz div e incluir regression check de direita do menu
para categoria, cima/baixo, esquerda de volta e retorno. Comprovar falha antes
do patch do hook e PASS depois, repetir matriz/guards/build/APK e atualização
Fire in-place. Probe físico ganha modo --live-only: inspecionar/testar UI já
aberta pelo usuário, sem clicar canais/fontes ou consultar segredos. Meta 60s
continua adiada. Atualizar evidência/proveniência e superseder status anterior.

Para validar após install -r, se abertura normal voltar à Home, probe pode
selecionar somente a opção Canais do menu geral, fluxo solicitado pelo usuário;
não escolher outros canais/grupos, alterar fonte ou controlar vídeo/fullscreen.

## Refinamento autorizado — Voltar fora da barra lateral

Usuário confirmou foco Canais corrigido e solicitou que Voltar não fique dentro
da barra de menu. No modo lateral, Header não renderiza o botão global; AppShell
renderiza o mesmo callback/rótulo acima do conteúdo, em page-back-row. Em Canais
reutilizar Voltar já existente na página, sem duplicação nem mudança do handler
Live. Fora da sidebar, Header/layout anteriores preservados. Sidebar fica só
com opções/ícones, sem botão de histórico. Conteúdo/D-pad devem manter entrada
de página (categoria Live/main) e não priorizar o novo botão global por acaso.

Mesma allowlist de Shell/CSS/hook/tests/docs; não editar rotas, ativação, player,
Header callbacks, página Live (além do atributo já autorizado), fonte ou native.
Testar DOM: Voltar ausente no header lateral/presente no conteúdo/callback de
histórico funcional, sem duplicação Live, mantendo Back no header de celular.
Repetir matriz/guards/build/APK e install -r primeiro no Fire, privado preservado.
Validar DOM/foco físico, sem escolher canais nem controlar playback. Nenhum
novo Gate/performance/60s; APK A3073378... fica registro intermediário.

Probe físico pode selecionar Filmes e usar Voltar global para verificar seu
DOM fora da sidebar/callback, depois selecionar Canais e confirmar categoria.
Somente navegação UI, sem escolher conteúdos/canais ou comandar player.

Usuário refinou: Voltar no canto superior DIREITO da página, não em uma linha
acima do título. CSS lateral deve posicionar o controle fora do fluxo, alinhado
ao topo do cabeçalho, reservar espaço horizontal para título sem empurrá-lo.
Live mantém seu callback e DOM, ganhando apenas classes de apresentação no
cabeçalho/botão para alinhar à direita via CSS lateral; essas duas classes
expandem a allowlist Live (antes somente landmark). Não mudar estilos móveis,
handlers/serviços/preview ou seleção. Fixture deve representar título real de
Filmes/Séries e provar posição direita/sobreposição vertical com título e
mesmo Y do título quando botão ocultado. Repetir DOM/foco físico e update Fire.

Controle remoto: no modo lateral, cima a partir dos filtros/ações Hero alcança
Voltar à direita; primeira linha de grade sem filtro também deve alcançá-lo.
Entrada da sidebar ainda prioriza conteúdo/categoria, não Voltar global antes
da página. Testar acesso D-pad e callback, mantendo algoritmo móvel anterior.

## Emenda — atualização do tablet Samsung e diagnóstico da busca, 2026-10-04

Usuário observou menu superior no tablet; auditoria read-only do APK instalado
8828F120... confirmou ausência de código/CSS lateral. Usuário respondeu "sim"
ao pedido de atualizar com o MESMO APK validado primeiro no Fire Stick, sem
desinstalar/apagar ativação ou catálogo, e retomar testes da busca. Supersede
restrição anterior de instalação em tablet SOMENTE para Samsung SM-X610,
serial RX2X301Q3KY, package com.xandeflix.prebuilt. Nenhum outro alvo autorizado.
CURRENT_GATE=NONE; ciclo de entrega/diagnóstico, nenhum próximo Gate.

APK raiz existente A806C1B2F70307DD410E437F9425170146FE07B113FB8B456EF3C1DB1447862F,
8748328 bytes; não rebuildar nem alterar produção, dependências ou APK. Checar
lock oficial, assinatura/package/hash e instalar -r. Comparar quatro arquivos
privados de identidade/ativação e árvore canônica files/prebuilt antes/depois
em memória, sem publicar conteúdos/digests privados. Não uninstall, pm clear,
reset, injeção de dados, rotação, alteração de orientação persistente ou backend.
Abrir normalmente; verificar sidebar somente em paisagem e controles existentes.

Allowlist deste recorte: este contrato, referência de sucessão no lock,
docs/evidence/C11_TABLET_APK_UPDATE_AND_SEARCH_DETAIL_DIAGNOSIS.md,
STATUS/EVOLUTION/ERRORS; artefatos sanitizados/screenshot seguro da Home em
tmp/c11-side-navigation. Probes efêmeros terminal/CDP próprios, sem scripts
versionados novos, forward temporário exclusivo com cleanup. CLI browser
indisponível: WebView CDP próprio é fallback. Não ler/publicar URLs, credenciais,
token, localStorage, conteúdo bruto de catálogo/console ou tela de chave.

Teste da busca limitado a selecionar Busca, pesquisar título identificado pelo
usuário e abrir detalhes pela UI existente; não acionar player/sessão ou fonte.
Observar carregamento, memória, PID e registros Android sanitizados. Sem título
reproduzível/queda observada, reportar limite e pedir caso, não afirmar causa.
51 leituras simultâneas reproduzidas com resolver/model reais e storage sintético
são evidência de concorrência, NÃO prova da causa do fechamento físico. Falta de
catch nas leituras de detalhes também não prova queda nativa. Correção funcional
da busca não autorizada por esta entrega; exige diagnóstico e escopo posterior.

Aceitação: APK instalado igual ao validado, identidade/ativação/catálogo
preservados durante install -r, menu verificado na orientação presente; buscar
caso sem presumir sucesso/causa. 401 hashes de runtime/scripts/Android/APK
permanecem idênticos. Atualizar evidência/status honestamente. Sem commit/push/PR,
outros aparelhos, nova homologação de playback ou trabalho de desempenho/60s.

## Emenda — remover badges técnicos do cabeçalho Live, 2026-10-04

Usuário solicitou remover "Conexão direta à fonte" e "Three-pane preview" do
topo de Canais ao Vivo, pois não são relevantes ao usuário final. CURRENT_GATE=NONE;
novo recorte local de apresentação, não próximo Gate. Preflight repetido: mesmo
workspace/origin/main/HEAD, dirty preservado; 401 hashes coincidem com baseline
da última entrega. Não autorizados commit/push/PR, backend ou instalação física.
As restrições de não rebuild do recorte anterior eram específicas à entrega
do APK existente no tablet e não impedem este patch visual solicitado.

Especificação anterior ao patch/teste: remover somente o div informativo dos
dois badges em src/ui/pages/LiveTvPage.tsx, incluindo o rótulo alternativo
"MOBILE FLUXO" pertencente ao mesmo badge. Não substituir por texto nem deixar
wrapper vazio. Manter título, contagem de canais, Voltar/handler, tabs mobile,
categorias/canais, landmarks de foco, estilos restantes, seleção, listeners,
paginação, autorização C9, preview/fullscreen e reprodução byte-idênticos.
Ativação/source/storage/busca/native/config/dependências fora do escopo.

Allowlist estrita deste recorte: LiveTvPage.tsx somente a remoção descrita;
scripts/test-c11-landscape-navigation-browser.mjs somente novos asserts de
ausência dos badges e preservação dos controles desktop/mobile; este contrato,
referência de sucessão no lock, nova evidência
docs/evidence/C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md, STATUS/EVOLUTION/ERRORS.
Outputs usuais build web/cap sync/Gradle, APK raiz e backup recuperável novo
Xandeflix-v1.0.0-standalone-before-live-header-cleanup.apk; não sobrescrever
backup existente divergente. Artefatos sintéticos no tmp/c11-side-navigation.

Aceitação: lock oficial antes/depois/prebuild/entrega PASS; typecheck/build e
fixture Live real com adapters locais, zero source/backend/player real. Provar
apenas o div removido na produção e arquivos fora do recorte inalterados; DOM
sem os rótulos, título/contador/Voltar, tabs mobile e foco categoria preservados.
CLI agent-browser indisponível: harness Chrome/CDP próprio já existente,
gut-check imediato de render/console/screenshot pelas skills de verificação.
Build/sync/assemble e assinatura/package/assets antes de entregar APK, sem
instalar/resetar aparelhos ou afirmar teste físico de reprodução/performance.

## Emenda — instalar e confirmar cabeçalho Live nos aparelhos, 2026-10-04

Após entregar o patch, usuário pediu "instale e confirme a atualização". Ordem
mantida: Fire Stick primeiro, AFTSSS 192.168.3.104:5555. Usuário respondeu "Sim,
atualizar também o tablet" à pergunta específica: Samsung SM-X610 RX2X301Q3KY
é segundo alvo autorizado. Somente com.xandeflix.prebuilt, in-place (-r), mesma
assinatura; nenhum uninstall/clear/reset, orientação persistente ou outro pacote.
Supersede restrição de nenhuma instalação do recorte imediatamente anterior
apenas para esses dois alvos. CURRENT_GATE=NONE, nenhum próximo Gate/Git/backend.

APK raiz já validado 9B12B0C1CD18010C18959A2E175C70E7A48C1A4BEDA73F144C470CB751493F08,
8780976 bytes. Não rebuildar, mudar fonte/testes/config/Android/dependências ou
reescrever APK/backup. Repetir lock oficial e verificar identidade do alvo,
assinatura/package/hash. Comparar hashes dos quatro arquivos privados e árvore
canônica files/prebuilt antes/depois do install em RAM, publicar só igualdade/
contagem, jamais valores/digests privados. Confirmar APK instalado por SHA-256
do base.apk público e abrir normalmente sem injetar dados.

Allowlist local: este contrato, referência de sucessão no lock, evidência
C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md, STATUS/EVOLUTION/ERRORS; probes
transitórios de terminal/CDP e relatórios/screenshots sanitizados próprios em
tmp/c11-side-navigation. Nenhum script versionado ou código funcional novo.
401 arquivos produção/scripts/config/Android/APK devem permanecer byte-idênticos
ao recorte entregue. Não modificar documentos históricos de outros ciclos.

Confirmação física: snapshot seguro do menu/estado visual; selecionar somente
Canais pela UI observada; aguardar título/header e verificar ausência dos três
rótulos técnicos, título/contador/Voltar, sidebar e categorias. Sem escolher
canais/grupos, executar fullscreen/filmes/séries, consultar fonte/token/storage
WebView ou console/rede brutos. Preview automático da página é fluxo normal do
app, não novo teste de playback homologado. Skill agent-browser com fallback
WebView/CDP próprio porque CLI indisponível; forward temporário exclusivo com
cleanup. Captura apenas cabeçalho DOM para não registrar mídia/dados privados.
Medidas de boot não são SLA; meta 60s continua adiada. Reportar limites/falhas
honestamente e não presumir PASS físico pela instalação bem-sucedida.

## Sucessão — posição dos controles/identificação do preview Live

Usuário pediu em seguida AO VIVO à direita no card logo/nome, nome ausente
acima do vídeo e Player Nativo abaixo, para Fire/tablet. Especificação prévia
e recorte visual em [C11_LIVE_PREVIEW_CONTROLS_LAYOUT](C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md).
Permite classes/badge/CSS/testes/build/update in-place dos dois alvos nomeados,
sem alterar player/ativação/source, celular/retrato, reset/Git/backend ou Gate.
