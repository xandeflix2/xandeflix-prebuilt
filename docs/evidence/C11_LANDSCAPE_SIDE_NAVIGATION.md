# C11 — Menu lateral compacto, somente ícones

## Resultado mais recente — Voltar no canto superior direito, instalado no Fire

Último refinamento autorizado: Voltar fora da barra lateral e no canto superior
direito da página, não acima do título. AppShell mantém o callback de histórico;
CSS somente lateral posiciona o controle fora do fluxo e reserva espaço no
cabeçalho. Canais reutiliza seu próprio botão, alinhado à direita por duas
classes visuais. Celular preserva Back no Header e posição original do Back Live.
Cima dos filtros/ações ou primeira linha sem filtros alcança Voltar por D-pad;
entrada da sidebar continua priorizando o conteúdo, não o botão global.

**BROWSER FINAL: 39 checks PASS**, zero erros de console/runtime, fixture local
sem backend. Matriz, ícones, foco/scroll profundo, rotas/histórico, overlays,
formulário, rotação sem remontagem, listener único e cleanup PASS. Novos checks:
Voltar à direita alinhado com título, ocultá-lo não muda Y do título, sem
sobreposição/linha extra; acesso por cima/Enter; Back Live à direita e original
no celular. Artefatos: tmp/c11-side-navigation/run-1791142050014/report.json,
movies-back-top-right.png e live-categories-focus.png, screenshots inspecionados.
O aviso de preview na fixture Live é esperado: adapters proíbem player/sessão
reais; não é diagnóstico do aparelho. Policy 18 casos/hook real também PASS.

Lock prebuild **49 casos + 9 negativos PASS**; profile/live T127..143, C9 10
e VOD 12 PASS. Build/sync finais após o último patch D-pad PASS. Gradle fresh
**155 tarefas, 90 testes nativos/12 suites**, zero failures/errors/skips, 54s.
Assinatura v1/v2 com certificado anterior; package com.xandeflix.prebuilt,
versionCode 1/name 1.0, min SDK 23/target 35. Cinco arquivos dist e sete public
byte-idênticos ao APK; fixtures excluídas. HTTPS/HTTP plugin/mixed content e
logging none preservados. Avisos preexistentes fs/path/chunks/deprecações não
alterados; nenhum aviso crypto no build. Não são metas de tempo de abertura.

**APK FINAL ATUAL**: Xandeflix-v1.0.0-standalone.apk, **8748328 bytes**, SHA-256
**A806C1B2F70307DD410E437F9425170146FE07B113FB8B456EF3C1DB1447862F**.
Atualização -r somente Fire Stick 192.168.3.104:5555/AFTSSS, sem reset/uninstall;
hash APK instalado igual ao raiz, quatro arquivos privados byte-idênticos
antes/depois da instalação, digests privados não publicados. Backup inicial
85EB23B5... preservado. Nenhum tablet/celular atualizado.

**FÍSICO FINAL PASS**, probe --live-only --check-back, PID 12030 estável: Filmes
tem Voltar à direita/alinhado, título sem deslocamento; tecla Android cima (19)
dos filtros alcança botão e centro (23) executa histórico. Canais tem somente
seu próprio Back à direita; direita (22) entra na categoria ativa, esquerda (21)
volta ao menu, direita retorna à categoria. Sidebar 80px/960x540, sem overflow,
secure context. Artefato tmp/c11-side-navigation/firestick-1791142373123/report.json.
Forward próprio removido; sem ler URL/token/console/localStorage ou escolher
filme/episódio/canal. am start normal OK não mede Home/catálogo completo em 60s.

Proveniência final: baseline 394 -> 401, **388 byte-idênticos**, mesmas seis
mudanças e sete arquivos novos da allowlist, nenhuma remoção/violação. Live tem
somente landmark e duas classes visuais: removendo os três em memória, SHA-256
volta exatamente a F606822A9F91438954896EEA2CBA27A94C6175CA04F45901FEB42CD31A1889F0.
Hooks/handlers/sessão/seleção/paginação/preview/fullscreen Live byte-preservados.
Diff-check e syntax-check PASS. Sem alteração de ativação, backend, player,
dependências/config ou Git commit/push/PR; próximo Gate não iniciado.

Incidentes de instrumentação: probe do APK intermediário D406... leu rota antes
do commit React; espera limitada pela rota esperada passou no reteste (36 checks
browser e físico daquela etapa). Na auditoria final, Windows retirou aspas da
expressão inline e depois um hash digitado ficou incompleto; corrigida passagem
de aspas e usado hash do baseline capturado, auditoria PASS. Não foram falhas
de produto nem mudanças extras de código. Etapa de alinhamento intermediária
37 checks PASS foi seguida por rodada limpa final 39 após último patch D-pad.

Resultados abaixo são histórico de etapas intermediárias, não APK atual. Meta
de 60s permanece aberta/adiada; reprodução física não retestada nesta rodada.

## Etapa anterior — foco de Canais corrigido e instalado

Usuário encontrou direita presa no menu ao abrir Canais no APK 187C6BD8...;
regressão supersede homologação genérica anterior. Causa: entrada/foco lembrado
limitados a main, mas LiveTvPage possui raiz div. Correção lateral usa app-content
como boundary, categoria selecionada como entrada, esquerda das categorias ao
menu e retorno ao controle válido. LiveTvPage ganhou SOMENTE um atributo visual
data-dpad-region na coluna; removendo essa linha em memória, SHA-256 retorna
exatamente ao baseline F606822A9F91438954896EEA2CBA27A94C6175CA04F45901FEB42CD31A1889F0.
Nenhum hook/seleção/sessão/C9/paginação/preview/fullscreen/back Live mudou.

Novo teste usa LiveTvPage REAL em raiz div, com adapters virtuais isolados de
catálogo/bridge/sessão, sem URLs/rede/player real. Primeira tentativa não ativou
adapter antes do resolver Vite e mostrou catálogo vazio; enforce=pre corrigiu
instrumentação. Depois reproduziu SIDEBAR_RIGHT_MUST_ENTER_LIVE_CATEGORY antes
do patch do hook. Após patch, **browser completo 34 checks, zero erros, exit 0**:
dois checks Live de entrada/cima/baixo/saída/retorno mais matriz anterior.
Artefatos: tmp/c11-side-navigation/run-1791140074608/report.json e
live-categories-focus.png (foco real da DOM no grupo, inspecionado).

Policy 18/hook real, profile/live T127..143, C9 10 e lock prebuild 49+9
novamente PASS. Build/sync/Gradle fresh 155 tarefas/90 testes nativos/12 suites
zero failures/errors/skips; assinatura/package e 5 dist/7 public bytes/config
conferidos novamente. Fixtures/adapters não entram no APK.

**APK INTERMEDIÁRIO DE CANAIS**: Xandeflix-v1.0.0-standalone.apk, **8747961 bytes**, SHA-256
**A30733787C289AAF48977561D4BC8AEE0AFC1388F40B1C6DE8C48705EA4D8F54**.
Instalado -r SOMENTE no Fire Stick, mesma assinatura/package. Base.apk físico
igual ao raiz, quatro arquivos privados byte-idênticos antes/depois, sem reset.
Mesmo backup inicial 85EB23B5... preservado. Outros aparelhos não atualizados.

Com Canais deixado aberto pelo usuário, **negativo físico** do APK anterior
reproduziu direita presa no menu (PID 2055; não inferir causa da mudança de PID).
Após APK corrigido/abertura normal, probe entrou pela opção Canais do menu,
sem escolher outro canal/grupo nem controlar player. Teclas Android 22/21/22:
direita na categoria ativa PASS, esquerda no menu Canais PASS, direita de volta
à mesma categoria PASS. Mesmo PID 3981 durante teste, sidebar 80px/960x540 sem
overflow, HTTPS secure context. Relatório físico:
tmp/c11-side-navigation/firestick-1791140449213/report.json;
**C11_LIVE_PHYSICAL_SIDEBAR_CATEGORY_FOCUS=PASS**, exit 0.
Forward próprio 50543 removido. Sem leitura de URL/token/console/localStorage.

**Proveniência NA ETAPA CANAIS**: baseline 394 -> 401, **388 byte-idênticos**, seis mudanças:
AppShell/Header/useDpadNavigation/index.css/LiveTvPage (somente atributo)/APK;
mesmos sete arquivos novos permitidos. Sem remoção ou mudança fora da allowlist.
Atualizações abaixo descrevem etapa anterior, supersedidas somente onde esta
correção altera resultado/APK/proveniência. Sem promessa universal de zero bugs,
sem nova sessão física de filme/série, meta de 60s ainda aberta/adiada.

## Autoridade, escopo e resultado — 2026-10-04

Usuário adiou otimização de abertura no Fire Stick e solicitou menu geral à
esquerda em paisagem tablet/TV/Fire, sem afetar celulares ou funções consolidadas.
Depois autorizou instalar primeiro no Fire Stick e refinou opções para somente
ícones. [Spec/allowlist e emendas anteriores ao patch](../architecture/C11_LANDSCAPE_SIDE_NAVIGATION.md).
CURRENT_GATE=NONE; ciclo local autorizado, próximo Gate não iniciado.

Preflight: cwd/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main; origin
https://github.com/xandeflix2/xandeflix-prebuilt.git; main/ahead 2; HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS/Architecture/Execution/Source
Boundary/Activation Lock lidos. Dirty preexistente preservado; sem escrita no
workspace histórico, projeto protegido, backend ou Git commit/push/PR.

Resultado: UI/icon rail e testes locais PASS; APK final instalado in-place
SOMENTE no Fire Stick AFTSSS/192.168.3.104:5555, quatro arquivos privados
preservados. Layout/foco por teclas nativas PASS no recorte físico descrito
abaixo. Celulares/tablet não receberam instalação nessa rodada. Meta de 60s
continua aberta e ADIADA, sem correção de desempenho neste ciclo.

## Implementação cirúrgica

- AppShell adiciona classe visual conforme viewport/UA/mobile/orientação;
  policy/hook não consultam identidade, licença, cadastro ou plugins nativos.
- Sidebar fixa de 80 CSS px somente em paisagem não-phone, sem overlay do
  conteúdo. TV explícita tem precedência sobre hint Mobile; phone largo em
  paisagem preserva layout anterior. Tablet em retrato também permanece igual.
- Header reutiliza seis callbacks existentes: Início/Filmes/Séries/Canais/Busca/
  Ativação, mais Voltar. SVGs locais, sem dependência nova. Nomes visuais ocultos
  só na sidebar, aria-label/title/aria-current preservam acessibilidade; layout
  anterior ainda mostra os textos. Marca/status compactos sem overflow.
- D-pad: esquerda no primeiro card de rail/coluna inicial da grade vai ao menu;
  direita retorna ao controle anterior ainda válido, sem subir a Home. Cima/
  baixo percorrem menu; colunas da grade lateral lidas do CSS real. Modais,
  overlay do player e edição horizontal de texto não escapam para a sidebar.
- Ref transitória de foco é liberada quando página sai; resize/orientation e
  listener de teclas têm cleanup. Rotação muda classe, não remonta páginas.
  Não faz fetch ou cópia de catálogo. Checklist React orientou essas escolhas
  para evitar rerenders por tecla/retenção de DOM/listeners duplicados.
- App/rotas/ativação/boot/parser/writer/storage/source/player/Capacitor/package/
  dependências/código nativo permanecem byte-idênticos ao baseline deste ciclo.

Referências primárias para o fallback visual: [Android WebView e UA de telas
grandes](https://developer.android.com/develop/ui/views/layout/webapps/best-practices)
e [layouts adaptativos](https://developer.android.com/develop/ui/views/layout/responsive-adaptive-design-with-views).
São heurísticas de apresentação, não autoridade para tipo/identidade do aparelho.

## Verificação local

Skill de navegador/verification: CLI agent-browser ausente e superfícies CUA
vazias; fallback Chrome headless/CDP com perfil próprio e Vite fixture local.
Nenhuma dependência instalada, perfil real usado ou chamada backend. Fluxo
testado: controle -> callback existente -> route state real -> render local.

- Policy: 18 cenários (inclusive Fire com Mobile=true, phone largo, iPad,
  teclado/orientação) e hook real resize/orientation/cleanup PASS.
- Browser final completo: **32 checks, zero erros**, exit 0,
  C11_LANDSCAPE_SIDE_NAVIGATION_BROWSER=PASS. Matriz nove viewports; layout sem
  sobreposição/overflow; só ícones lateral e nomes acessíveis/labels anteriores;
  scroll profundo/left/right/same-card, rails horizontal/vertical; controle
  negativo reproduz limitação antiga; menu/Enter/Back; seis rotas; grade CSS;
  input, modal/player overlay; rotação mesma DOM; um listener por evento e zero
  após unmount. Fixture sintética não equivale a reprodução física do player.
- Lock oficial antes/depois/prebuild/primeiro APK PASS: 49 casos +9 negativos;
  prebuild final dos ícones novamente PASS, hook prebuild intacto.
- Source 66, bounded-memory import T1..T83/250 mil records, post-gate
  T84..T126, profile/live T127..T143, VOD 12, C9 10, player notice 11 e guard
  bridge com quatro negativos PASS. Notice repetido após refinamento PASS.
- Typecheck, tsc/Vite (412 módulos), cap sync e Gradle final PASS;
  testDebugUnitTest/assembleDebug --rerun-tasks: 155 tarefas executadas, 12 suites,
  **90 testes nativos, zero failures/errors/skips**. Sem crypto externalized.
  Avisos preexistentes node:fs/path, chunks, imports e APIs deprecated permanecem.
- Suites legadas R2F8 ausentes no baseline não são declaradas PASS.

Artefatos finais: tmp/c11-side-navigation/run-1791138871796/report.json e PNGs
fire-deep-menu/phone-portrait/phone-landscape/tablet/TV. Screenshots finais de
Home profunda e celular inspecionados. Não há fixtures/test probes no APK.

### Incidentes de instrumentação, não ocultados

Antes dos ícones, watcher Vite tentou ler Cookies do perfil de teste (EBUSY):
ignorar tmp resolveu sem alterar produção. Cálculo de colunas no harness tinha
escaping incorreto e atribuição DOM tentou serializar árvore extensa: corrigidos
no teste; 29 checks então cobertos, três restantes em modo parcial. Após pedido
de ícones houve nova execução completa: assert de inline-flex rejeitou a
blockification normal de filhos flex; teste passou a comparar visibilidade
efetiva, mantendo rótulos ocultos/ícones visíveis/nomes acessíveis. A execução
final completa passou. Reloads de relatórios Gradle ocorreram antes da matriz;
nenhum erro nem reinício durante os checks finais.

Primeiro verificador avulso do APK exigiu android.loggingBehavior explícito;
baseline correto usa loggingBehavior global='none'. Conferência corrigida prova
bytes da config e valor efetivo Android (override ou global), sem mudar config.
Tentativa de ler STATUS na raiz falhou; arquivos reais sob docs foram usados.

## APK de ícones anterior à correção de foco Live e instalação física

- Arquivo raiz: Xandeflix-v1.0.0-standalone.apk, **8747852 bytes**.
- SHA-256: **187C6BD86034532CC64D85B927257AD2BA4A5C7448D24995E0BC869B7E19C035**.
- Package com.xandeflix.prebuilt; versionCode 1/versionName 1.0; minSDK 23/target 35.
- Assinaturas v1/v2 válidas, mesmo certificado SHA-256
  b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
- Cinco arquivos dist byte-idênticos aos assets APK; sete arquivos public iguais
  ao sync (incluindo dois Cordova gerados). HTTPS/Http/mixedContent e logging none
  preservados; sem arquivos de identidade/chave/ativação/fixtures no APK.
- Backup recuperável: Xandeflix-v1.0.0-standalone-before-side-navigation.apk,
  SHA-256 85EB23B526FBDEBA4353F32D5493CC358DFD0A0921DE843AF1DE42CEDDBDCAB2.

Primeiro APK lateral 56A35C7A... foi instalado -r e aberto antes do refinamento.
APK final somente ícones 187C6BD8... instalado -r depois; hash do base.apk físico
confere com raiz. Cada atualização comparou em memória os quatro arquivos
privados de identidade/chave/instalação/ativação antes/depois: todos idênticos.
Não publicar valores/digests. Sem uninstall, pm clear, reset, backend, remoção
de catálogo/staging ou atualização do tablet/celular.

Abertura normal via MainActivity PASS. WaitTime final 5992ms é duração am start,
NÃO tempo de catálogo completo/SLA/primeira instalação. Não mediu meta de 60s.
PID final 29724 permaneceu vivo durante teste. WebView físico 960x540, sidebar
80px à esquerda, mainLeft=headerRight=80, seis opções, zero overflow global,
secureContext=true. UA TV verdadeiro mesmo mobile hint=true; ícones/rótulos
ocultos/nome acessível conferidos na DOM. Screenshot físico Home com conteúdo
inspecionado: tmp/c11-side-navigation/firestick-1791139150449/firestick-icons-home.png.

Teste físico de esquerda nativa (ADB keyevent 21) atingiu menu ativo na categoria
profunda sem subir scroll; a captura PNG seguinte teve timeout, não a tecla/UI.
Continuou SOMENTE etapas restantes, a partir desse menu/scroll já confirmados:
direita volta ao card da mesma rail centralizada; próximo/anterior card; voltar
ao menu; cima/baixo; retorno ao conteúdo. PASS via teclas Android, mesmo PID.
Relatório: tmp/c11-side-navigation/firestick-1791139295721/report.json;
C11_SIDE_NAV_FIRE_STICK_PHYSICAL_REMAINING=PASS. Não declarar driver físico
completo exit 0: validação agregada, com timeout de screenshot documentado.
Forwards próprios 50541/50542 (metadados preliminares) e 50543 removidos; nenhum
console/token/source/localStorage lido nem log de payload habilitado.

## Proveniência da etapa anterior e limites

Inventário baseline 394 -> 401 arquivos: **389 byte-idênticos**. Mudaram somente
AppShell/Header/useDpadNavigation/index.css e APK raiz. Sete novos arquivos:
policy/hook visual, quatro scripts/fixtures locais e probe físico autorizado.
Sem remoções e sem diferenças fora da allowlist. Documentos adicionados/atualizados
somente contrato, sucessão do lock, esta evidência e STATUS/EVOLUTION/ERRORS.
Outputs gerados usuais verificados separadamente no APK. Diff scoped/sintaxe
dos scripts PASS; dirty de storage/proveniência preexistente não foi refatorado.

Não há promessa matemática de zero bugs. Há guards locais + amostra física de
layout/D-pad/Home/identidade preservada. Player não foi aberto nessa rodada;
preservação é comprovada por bytes e testes, não por nova sessão de vídeo.
Tablet/celular físico com novo APK ainda não testado. Requisito de primeira
carga <=60s permanece aberto/adiado, sem iniciar próxima demanda/Gate.
