# C11 — Entrega Live mobile limpa e orientação do telefone

## Cabeçalho phone de detalhes corrigido — 2026-10-05

Pedido: igualar o cabeçalho de movie-detail/series-detail ao de listagens/Home
no celular, com64px+safe-area e seta SVG centralizada em alvo44px à direita.
Causa: ambas as rotas não recebiam a classe phone-header-back; o margin-left0
da dupla Início/Back também não serve para detalhe sem Início. Patch restrito:
AppShell deriva detailPage no render e acrescenta classes; CSS max599 restaura
margin-left:auto somente no Back desses detalhes. Header real, páginas de
detalhes, botões de conteúdo, Assistir/episódios, callbacks e histórico intactos.
Não adicionar Início às duas rotas: política anterior das quatro rotas mantida.
Home permanece sem retornos e rodapé phone com quatro ícones; tablet/Fire/TV
não recebem mudança visual. Nenhum hook/listener/estado/IO novo.

PreflightC11/origin/main/ahead2/HEADf0fdb6840c21e7a660f1662f2bbac9f2cd241cba,
AGENTS/contratos/boundary/lock lidos, dirty conhecido preservado. Baseline405/405
idêntica à entrega0665 antes da edição. Emenda prévia no contrato e testes
antes do código; usuário autorizou a entrega atual com "sim", na ordem
celular -> Fire -> tablet, sem limpar dados. CURRENT_GATE=NONE.

Negativo antes do patch: PHONE_DETAIL_HEADER_MUST_SHARE_64PX_HEIGHT rejeita0665
em tmp/c11-side-navigation/run-1791214881010. Positivo novo30 checks/zero erros
em run-1791214979864: card real da listagem/Home -> route-state -> Header/Shell
reais -> detalhe -> clique/Enter/Escape Back, em320/390/430; marca, altura64,
alvo/centragem, direita, ausência de texto/Início, footer4 e overflow verificados.
Cinco layouts não phone preservados. Screenshot phone390-series-detail-right-back
revisto visualmente. Corpo de detalhes sintético no fixture: não certifica dados
reais, carregamento de episódios ou reprodução física.

Regressões anteriores reexecutadas, todas PASS/zero erros:

| Suíte | Checks | Pasta em tmp/c11-side-navigation |
| --- | ---: | --- |
| Detalhes phone | 30 | run-1791214979864 |
| Quatro ícones | 41 | run-1791215080978 |
| Header phone | 35 | run-1791215115361 |
| Home sem Back | 21 | run-1791215142540 |
| Retenção de canal | 43 | run-1791215171383 |
| Live mobile | 26 | run-1791215194306 |
| Interações Live | 25 | run-1791215210144 |
| Navegação/layout geral | 59 | run-1791215225869 |

Total280. Skills browser/verify/verification guiaram o story real de navegação
e gut-check imediato no Chrome/CDP isolado (CLI indisponível), sem backend/mídia.
Revisão React guiou classe derivada em render, sem efeito ou estado adicional,
reuso do SVG/handlers/nome acessível existentes. Não se alterou React funcional
fora desse seletor. Suítes de ativação/catalog lock49 casos+9 negativos PASS
antes, no prebuild e após build. Guards phone orientação5, backdrop5, notice11,
C9 playback-session10 e VOD direct-stream12 PASS.

npm run build/tsc/Vite, cap sync android, assembleDebug/testDebugUnitTest PASS.
Java sem patch; testDebugUnitTest UP-TO-DATE, relatórios existentes102 testes/
14 suítes/zero falhas/erros, não alegar execução nova. Sem warning de externalização
de crypto; avisos já existentes fs/path/chunks/flatDir não fazem parte deste patch.
Cinco assets dist byte-idênticos no APK; packagecom.xandeflix.prebuilt/code1/version1.0,
HTTPS/CapacitorHttp/mixedContent/loggingnone preservados. Assinatura SHA256
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d validada.

APK raiz Xandeflix-v1.0.0-standalone.apk,9062069bytes, SHA256
EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F.
Backup recuperável Xandeflix-v1.0.0-standalone-before-phone-detail-header.apk
preserva0665565390BB35769ED5DF5AAA978E77745D7075328753854501EED1DCD4A964.
Audit pós-build401/405 hashes anteriores iguais: somente Shell/CSS/harness/APK
mudaram; Header/páginas reais/App/route-state/ativação/source/search/Live/native/
config byte-idênticos. Demais backups preservados. Sem Git/backend/gestor/Settings/
reset/desinstalação/chave nova/novo Gate/alteração da demanda de60s.

Entrega concluída na ordem autorizada, mesmo APK EE BE nos três:

1. CelularSM-S926B/RXGYB03FL4W: install-r SUCCESS primeiro, hash anterior0665 e
   instaladoEEBE conferidos; privados4/catálogo508 idênticos em RAM imediatamente
   antes/depois e antes de abrir. Abertura normal Status:ok/PID19565.
2. FireAFTSSS/192.168.3.103:5555: somente após celular confirmado, install-r SUCCESS;
   anterior0665/instaladoEEBE conferidos, privados4/catálogo436 idênticos em RAM
   antes/depois, antes de abrir. Abertura normal Status:ok/PID5980.
3. TabletSM-X610/RX2X301Q3KY: reconectado pelo usuário e identificado na lista ADB
   após Fire concluído, install-r SUCCESS por último; anterior0665/instaladoEEBE,
   privados4/catálogo505 idênticos em RAM antes/depois, antes de abrir.
   Abertura normal Status:ok/PID24178.

Nenhuma limpeza/desinstalação/novo pairing; identidade/chave/instalação/ativação
e catálogo preservados nos três. Conteúdos/digests privados nunca publicados
ou persistidos. Igualdade/contagens/hash público são a evidência sanitizada.
405/405 hashes finais locais idênticos após instalação; diff --check escopado
PASS, zero processos Chrome isolados próprios restantes. Entrega sem pendência
nos três; abertura/processo não certifica mídia física.

## Entrega sequencial concluída — celular, Fire, tablet — 2026-10-05

Usuário autorizou instalar APK0665565390BB35769ED5DF5AAA978E77745D7075328753854501EED1DCD4A964
primeiro celular, depois Fire Stick e por último tablet. Emenda prévia no contrato
sucede geração sem instalação. Mesmo artifact9062043bytes, packagecom.xandeflix.prebuilt/
certificadob235c711...96e848d conferidos junto ao backupCE39. Nenhum rebuild ou patch
funcional/testes/config/APK nesta entrega. PreflightC11/origin/main/ahead2/HEADf0f
e contratos/boundary/lock revistos, baseline405/405 idêntica antes/depois.
Lock oficial49 casos+9 negativos PASS antes de entrega; não iniciar novo Gate.

Ordem executada:

1. Samsung SM-S926B/RXGYB03FL4W: install-r SUCCESS, APK anteriorCE39 e instalado0665
   conferidos. Quatro privados e508 arquivos de catálogo byte-idênticos por hashes
   comparados em RAM imediatamente antes/depois e antes da abertura. Status:ok/PID1738.
2. Fire Stick AFTSSS/192.168.3.103:5555: somente após celular confirmado, install-r
   SUCCESS; anteriorCE39/instalado0665 conferidos, quatro privados e436 arquivos
   de catálogo iguais em RAM antes/depois. Abertura normal Status:ok/PID1381.
3. Tablet SM-X610/RX2X301Q3KY: inicialmente ausente, reconectado após solicitação
   ao concluir primeiras duas entregas e identificado na lista ADB durante a
   consolidação. Somente então, por último, install-r SUCCESS; anteriorCE39 e
   instalado0665 conferidos. Quatro privados e505 arquivos de catálogo iguais
   em RAM antes/depois da instalação, antes de abrir. Status:ok/PID20355.

Identidade/chave/instalação/ativação e catálogo preservados nas três atualizações,
sem limpar/desinstalar/regenerar/pairing/Settings. Digests/conteúdos privados nunca
persistidos/publicados. Hashes públicos/igualdade/contagens são a evidência sanitizada.
Nenhuma seleção de novo canal/fonte ou mídia capturada/testada. Abertura/processo
não certifica reprodução física. Sem backend/gestor/Git/60s;CURRENT_GATE=NONE.
405/405 hashes locais novamente idênticos após última instalação; mesmo APK
final confirmado nos três aparelhos, na ordem explicitamente solicitada.

## Navegação phone com quatro ícones — APK gerado, não instalado — 2026-10-05

Pedido atual implementado: rodapé phone<600 somente Filmes/Séries/Canais/Busca,
ícones SVG32px sem texto visível, alvos>=44px/aria-label/aria-current preservados.
Início somente no Header direito de Filmes/Séries/Busca/Ativação, junto a Voltar;
Home sem Início/Voltar, Live mantém seu único retorno. Ativação também usa64px
e Back vetorial centralizado quando existe histórico; Início independe dele.
Tablet/Fire/TV mantêm seis ações, sem novo Início visível no topo. Footer56px,
geometria Live, orientação nativa, histórico e callbacks permanecem existentes.

Preflight: workspace/top-levelC11, originxandeflix2/xandeflix-prebuilt, main/ahead2,
HEADf0fdb6840c21e7a660f1662f2bbac9f2cd241cba. Contratos/AGENTS/boundary/lock lidos,
baselineCE39 de405 hashes idêntica antes da edição. SPEC_BEFORE_CODE cumprido.
Allowlist funcional: Header/Shell/CSS/harness/APK;400/405 hashes prévios iguais
após build/sync/cópia, ativação/source/search/Live/Java/config preservados.
CURRENT_GATE=NONE; nenhum Git/gestor/backend/Settings/novo Gate/reset/60s.

Negativo de seis botões rejeitado por PHONE_FOOTER_MUST_HAVE_ONLY_FOUR_ROUTES_IN_ORDER
(run-1791211876494), antes do patch. Teste adicional de status durante ativação
revelou sobreposição do texto com os novos alvos em320px (run-1791212232696).
Refinamento pré-especificado: somente quatro rotas phone mostram dot e texto
visualmente oculto mas acessível de Sincronizando..., sem mudar condição/status.
Novo teste prova ausência de sobreposição com e sem histórico em320/390/430.

Skills browser/verify/verification guiaram gut-check imediato e story de quatro
atalhos -> rota real -> Início/Back -> Home, Chrome/CDP isolado (CLI ausente),
sem API/backend/mídia. Revisão React guiou condições derivadas em render sem
novos hooks/listeners/IO, reuso de NavigationIcon e nomes acessíveis. Screenshots
phone390 Filmes/phone320 Ativação revistos. Setup Ativação no fixture usa nav
desktop oculta: não prova novo atalho físico de acesso à ativação, cujo fluxo
inicial/links de recuperação existentes não foram modificados.

250 checks/zero erros em sete suítes:

- Quatro ícones41: tmp/c11-side-navigation/run-1791212308472/report.json.
- Header35: tmp/c11-side-navigation/run-1791212062117/report.json.
- Home21: tmp/c11-side-navigation/run-1791212123312/report.json.
- Categoria43: tmp/c11-side-navigation/run-1791212167868/report.json.
- Mobile26: tmp/c11-side-navigation/run-1791212385806/report.json.
- Gestos25: tmp/c11-side-navigation/run-1791212400977/report.json.
- Matriz lateral59: tmp/c11-side-navigation/run-1791212417401/report.json.

Typecheck/lock49+9 prévio/prebuild/final/guards orientation5 e backdrop5 PASS,
notice11/C9runtime10/VODdirect12 PASS. Build/cap sync/assembleDebug/testDebugUnitTest
PASS. Java fontes/testes byte-idênticos, task de teste UP-TO-DATE; resultados
cacheados102 testes/14 suítes/zero erros, não alegar nova execução desses testes.
Avisos anteriores node:fs/path/chunks/flatDir fora escopo mantidos; sem crypto.

APK raiz9062043bytes, SHA256
0665565390BB35769ED5DF5AAA978E77745D7075328753854501EED1DCD4A964,
igual ao app-debug.apk; cinco assets dist idênticos/configHTTPS/CapHttp/mixedContent/
loggingnone corretos. Packagecom.xandeflix.prebuilt/code1/version1.0 e certificado
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d verificados no novo
APK e backup recuperável Xandeflix-v1.0.0-standalone-before-phone-four-icon-navigation.apk
=CE39CA717A00B52604BF1C9D106D6335D7F900E04B54333A81F4D1F26AFBCC6C.
Outros backups preservados. Verificador inline de assets teve quoting Windows
inválido na primeira chamada; repetido via código base64 em memória passou,
sem arquivo/código de produto alterado para contornar teste.

Esta versão não instalada: pedido atual não autorizou nova entrega física e a
pergunta opcional enviada não recebeu resposta até esta consolidação. APK anterior
CE39 continua nos aparelhos previamente atualizados; não confundir geração com
instalação/teste de mídia. Nenhuma consulta/mutação ADB neste ciclo. Reprodução
física não certificada por browser sintético; testes mitigam regressões cobertas.

## Complemento final — mesma altura na Home phone — 2026-10-05

Usuário observou que64px estavam só em Filmes/Séries/Busca e pediu também Home.
Spec prévia: uma linha acrescenta seletor Home phone ao mesmo bloco de altura,
sem criar botão. Home permanece sem Voltar universal, tablet/Fire/Live/Header/
Shell/Java/ativação byte-idênticos a5C34. Novo assert rejeitou5C34 com
PHONE_HOME_HEADER_MUST_MATCH_OTHER_64PX_HEADERS (run-1791210329228), antes do patch.
Finais209 checks/zero erros em seis suites; Home320/390/430 mesma altura64px,
sem Back, screenshot Home390 revisto. Skills de verificação guiaram gut-check/
geometria/retorno local, sem API/backend/mídia. Reports:

- Header35: tmp/c11-side-navigation/run-1791210410711/report.json.
- Home21: tmp/c11-side-navigation/run-1791210440967/report.json.
- Canal ativo43: tmp/c11-side-navigation/run-1791210475861/report.json.
- Mobile26: tmp/c11-side-navigation/run-1791210498415/report.json.
- Gestos25: tmp/c11-side-navigation/run-1791210513196/report.json.
- Matriz lateral59: tmp/c11-side-navigation/run-1791210532228/report.json.

Lock49+9 antes/prebuild/final PASS; build/cap sync/assembleDebug/testDebugUnitTest
PASS (Java/testes UP-TO-DATE, fontes intocadas). Baseline5C34405:402/405 iguais;
só CSS/harness/APK mudaram. Nenhum TSX/handler/player/native/fonte/ativação alterado
neste complemento. Avisos anteriores fora do recorte mantidos, sem crypto.

APK final raiz9062044bytes, SHA256
CE39CA717A00B52604BF1C9D106D6335D7F900E04B54333A81F4D1F26AFBCC6C,
igual ao app-debug.apk; cinco assets idênticos/configHTTPS/CapHttp/mixedContent/
loggingnone intactos. Mesmo package/code/version e certificado b235c711...96e848d
verificados no novo APK e no backup recuperável
Xandeflix-v1.0.0-standalone-before-home-header-height.apk =5C34E11D...7052AFC.
Demais backups preservados; nenhum Git/backend/Settings/reset/novo Gate/60s.

Celular SM-S926B recebeu CE39 por install-r, quatro privados/508 arquivos de
catálogo iguais em comparação RAM antes/depois, hash público confirmado e
abertura Status:ok/PID19146. Fire103 recebeu o mesmo APK, quatro privados/
436 arquivos de catálogo iguais e abertura normal. Sem dados limpos/identidade
nova ou digests/conteúdos privados persistidos. Tablet estava ausente ao iniciar
esse complemento e foi reconectado pelo usuário durante a entrega. Também recebeu
CE39 por install-r: quatro privados/505 arquivos de catálogo iguais, hash público
confirmado, Status:ok/PID14895. Celular/Fire/tablet têm o MESMO artefato final.
405/405 hashes finais idênticos após instalar; scoped diff --check limpo e zero
browsers próprios restantes. Reprodução física segue para teste do usuário,
não certificada por essas suites/instalação.

## Home sem Voltar universal e Header phone refinado — entrega final — 2026-10-05

Pedidos adicionais durante a entrega B3B: Home é tela inicial em TODOS os
dispositivos, portanto não pode apresentar Voltar; Filmes/Séries/Busca phone
precisam de cabeçalho mais alto e seta centralizada. Emendas registradas antes
de cada código/teste. A preservação anterior de Home Back tablet/Fire está
superseded apenas por esse pedido. Histórico e Back hardware não modificados.

AppShell acrescenta guard currentView !== home tanto no Header quanto na linha
Back do conteúdo. Home não renderiza nenhum desses controles, mesmo havendo
histórico. Header mantém callbacks/props/aria-label/status; wrapper decorativo
preserva glifo legado nos outros layouts e mostra SVG20px apenas nas três rotas
phone<600. CSS adicional nessas rotas:64px+safe-area top, botão44px inteiramente
contido e ícone centralizado por flex, marca à esquerda. Home/Live/Ativação e
outros cabeçalhos não mudam de altura, tablet/Fire mantêm demais layouts.
Revisão React orientou derivação direta em render, sem state/effect/listener/IO
novo, SVG focusablefalse/aria-hidden e mesmo callback/nome acessível.

### Verificação e limites

Negativo Home rejeitou B3B por HOME_MUST_NOT_RENDER_BACK_IN_ANY_LAYOUT
(tmp/c11-side-navigation/run-1791209417266). Negativo altura rejeitou B3B por
PHONE_HEADER_MUST_HAVE_ROOM_FOR_CENTERED_BACK (run-1791209596941). Finais:

- Home universal21: tmp/c11-side-navigation/run-1791209691896/report.json.
- Header/centragem/retorno35: tmp/c11-side-navigation/run-1791209730694/report.json.
- Canal ativo/categorias43: tmp/c11-side-navigation/run-1791209768714/report.json.
- Mobile26: tmp/c11-side-navigation/run-1791209794190/report.json.
- Gestos/sessão25: tmp/c11-side-navigation/run-1791209811416/report.json.
- Matriz lateral/rotas/foco/scroll59: tmp/c11-side-navigation/run-1791209836767/report.json.

Total209 checks, zero erros/backend real. Skills browser/verify/verification:
Chrome/CDP isolado existente, gut-check imediato e visual phone390/Séries revisto
com seta centralizada/64px/sem corte. Fixtures não homologam mídia física Android.
Lock oficial49+9 antes/prebuild/final PASS; tsc/Vite/cap sync/assembleDebug/
testDebugUnitTest PASS. Java permanece byte-idêntico, testes UP-TO-DATE com
resultados102 testes/14 suites/zero failures/errors. Guard lateral18+hook,
orientação5/backdrop5/playback-notice11/C9runtime10/VOD12 novamente PASS.
Avisos antigos node:fs/node:path/chunk/flatDir permanecem fora do recorte;
nenhum crypto externalized. Scoped diff --check sem erro.

Baseline B3B405;400/405 byte-idênticos, somente AppShell/Header/index.css/harness/
APK previstos mudaram. Live/identidade/chave/ativação/boot/source/catalog/native/
config intactos. Após instalar,405/405 hashes finais permanecem iguais. Sem
Git/backend/gestor/Settings/reset/chave nova/próximo Gate/performance60s.

### APK final e atualização dos três dispositivos

Xandeflix-v1.0.0-standalone.apk,9062044bytes, SHA256
5C34E11D7A817E367BDFC215BC947C050C51AD1AE602D4CF1884097FE7052AFC,
igual ao APK gerado; cinco assets dist idênticos e HTTPS/CapHttp/mixedContent/
loggingnone intactos. Package com.xandeflix.prebuilt/code1/version1.0, assinatura
SHA256 b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Backup novo Xandeflix-v1.0.0-standalone-before-home-no-back-all.apk =B3B0D71E...4D3623,
sem sobrescrever backups anteriores. APK e backup têm assinatura/package verificados.

Install-r SUCCESS nos três; APK anterior B3B e hash final5C34 confirmados em cada:

| Aparelho | Privados iguais | Catálogo igual | Abertura normal |
| --- | --- | --- | --- |
| Celular SM-S926B/RXGYB03FL4W | 4 | 508 arquivos | Status:ok/PID12716 |
| Fire AFTSSS/192.168.3.103:5555 | 4 | 436 arquivos | Status:ok/PID24487 |
| Tablet SM-X610/RX2X301Q3KY reconectado | 4 | 505 arquivos | Status:ok/PID12857 |

Comparação em RAM imediatamente antes/depois da instalação, antes de abertura:
nenhum conteúdo/digest privado persistido, apenas igualdade/contagens. Usuário
desconectou celular após receber final e reconectou tablet; entrega final dele
concluída após confirmação. Nunca limpar dados/desinstalar/recriar identidade.
Usuário pode testar UI/reprodução; instalação e testes sintéticos não certificam
stream/codec/orientação/gestos físicos. Teste limpo segue para ciclo autorizado futuro.
Seções abaixo são histórico das versões anteriores, não estado da entrega final.

## Voltar mobile à direita/só ícone e atualização dos três aparelhos — 2026-10-05

Pedido atual executado com spec anterior ao código: somente Filmes/Séries/Busca
recebem classe visual adicional no Shell. CSS max-width599 reposiciona o MESMO
botão à direita da marca, oculta back-label e mantém alvo touch44px. Marca fica
ancorada à esquerda; aria-label/callback/foco/histórico intactos. Home continua
sem Voltar, Live usa seu controle próprio; outras rotas e tablet/Fire não mudam.
Header.tsx, route-state, LiveTvPage, Java/config/ativação/boot/source byte-idênticos.
Nenhum hook/listener novo ou refactor. Prefixo CSS anterior recupera seu hash
original removendo somente separador/bloco acrescentado; regras antigas intactas.

Preflight obrigatório/read-only confirmou workspace C11/origin/main/HEAD esperados,
dirty adjudicado; contratos/lock/spec/skills lidos integralmente. Baseline405
idêntico antes. Final401/405 idênticos: somente AppShell/index.css/harness/APK
mudaram, todos previstos na emenda. CURRENT_GATE=NONE, sem Git/gestor/backend/
Settings/reset/identidade nova/próximo Gate/retomada60s.

### Verificação executada

Skills browser/verify/verification orientaram story navegação -> Header real ->
ícone acessível -> callback existente -> Home sem Voltar, sem API/env/source.
CLI ausente, fallback Chrome/CDP isolado existente com gut-check imediato;
fixtures/adapters sem backend/mídia, browsers/server próprios fechados (zero
browsers da fixture restantes). Revisão visual do screenshot phone390/Séries
confirmou marca à esquerda e seta à direita, sem texto. Não é mídia real Android.

- Novo modo --phone-header-back-only:35 checks, zero erros, phone320/390/430,
  marca sem deslocamento, botão à direita/44px/só seta/nome acessível, clique e
  Enter preservam retorno; Home/Live/Ativação e tablet portrait/landscape/Fire/
  phone largo inalterados. tmp/c11-side-navigation/run-1791208576705/report.json.
- Home14: tmp/c11-side-navigation/run-1791208627916/report.json.
- Canal ativo/categorias43: tmp/c11-side-navigation/run-1791208655774/report.json.
- Mobile preview26: tmp/c11-side-navigation/run-1791208681401/report.json.
- Gestos/sessão/concorrência25: tmp/c11-side-navigation/run-1791208702279/report.json.
- Matriz lateral/foco/rotas/scroll59: tmp/c11-side-navigation/run-1791208722829/report.json.
  Total202 checks, zero erros nos seis reports; nenhuma chamada backend real.
- Typecheck/política lateral18+hook/orientação5/backdrop5/playback-notice11,
  C9runtime10/VOD12/R7C13 PASS. Lock oficial49+9 antes/prebuild/pré-entrega PASS.
- npm build/cap sync/assembleDebug/testDebugUnitTest PASS; Java UP-TO-DATE,
  resultados preservados102 testes/14 suites/zero failures/errors, Java intocado.
  Sem aviso crypto externalized; avisos antigos node:fs/node:path/chunks/flatDir
  não corrigidos fora do recorte. Scoped diff --check limpo.

Controle negativo antes do patch reproduziu PHONE_BACK_MUST_FOLLOW_BRAND_AT_RIGHT
(tmp/c11-side-navigation/run-1791208416859). Primeiro positivo passou celular,
mas teste usava margem32px artificial no tablet landscape; trocado por comparação
exata com gutter computado já existente, tolerância1px. Nenhuma regra/layout
tablet alterada para satisfazer o teste; segundo positivo e regressões passaram.

### Artefato e entrega sem limpeza

APK raiz: Xandeflix-v1.0.0-standalone.apk,9061967bytes, SHA256
B3B0D71E10D42FBA238F433BDA4D12B947E5DBF8C82C1B8B3302B106FC4D3623,
igual ao app-debug.apk gerado; cinco assets idênticos a dist, HTTPS/CapHttp/
mixedContent/loggingnone mantidos. Package com.xandeflix.prebuilt/code1/version1.0.
Certificado SHA256 b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d
verificado no novo APK e nos backups9FF/4B66/6F1. Backup recuperável novo
Xandeflix-v1.0.0-standalone-before-phone-header-back.apk =9FF23801...F9CF80;
backups anteriores preservados. Nenhum rebuild adicional após validação final.

Usuário informou novo IP Fire192.168.3.103 e posteriormente reconectou celular/
desconectou tablet. Atualizações install-r do mesmo package/assinatura:

| Aparelho | APK anterior | APK instalado | Privados iguais | Catálogo igual | Abertura normal |
| --- | --- | --- | --- | --- | --- |
| SM-X610/RX2X301Q3KY | 6F1C4F36...9494B | B3B0D71E...4D3623 | 4 | 505 arquivos | Status:ok/PID8992 |
| AFTSSS/192.168.3.103:5555 | 6F1C4F36...9494B | B3B0D71E...4D3623 | 4 | 436 arquivos | Status:ok/PID20142 |
| SM-S926B/RXGYB03FL4W | 9FF23801...F9CF80 | B3B0D71E...4D3623 | 4 | 508 arquivos | Status:ok/PID3800 |

Hash público instalado confirmado nos três. Comparações privadas/catálogo em
RAM imediatamente antes/depois da instalação, antes de abrir; só contagens/
igualdade publicadas, sem persistir digests/conteúdos privados. Tablet já tinha
sido atualizado/aberto antes de ser desconectado; diagnóstico posterior combinado
ficou indisponível nessa desconexão, não prova crash. Fire e celular checados
separadamente após instalar: ambos processos ativos; Fire MainActivity em
primeiro plano, celular fora de primeiro plano nesse diagnóstico (não crash).
Sem limpeza/desinstalação/chave nova/fonte/canal selecionado pelo agente.
Teste limpo segue adiado; reprodução/gestos/orientação física dependem do usuário.
Entrega total desta versão concluída; registros de pendência abaixo são históricos.

## Entrega solicitada nos três aparelhos — celular concluído, dois pendentes — 2026-10-05

Autoridade atual: usuário solicitou instalar em todos os dispositivos usados
nos testes, mantendo celular primeiro e sem limpeza. Emenda de entrega registrada
antes da instalação; CURRENT_GATE=NONE, nenhum próximo Gate ou alteração funcional.
Preflight obrigatório e leitura dos contratos/lock/spec concluídos, workspace C11,
origin/main/HEAD esperados. Lock oficial novamente PASS:49 casos/9 negativos.
Baseline atual405/405 byte-idêntico antes e depois deste ciclo de entrega.

APK raiz9FF238019553263CCADE6964FBE471C2BF575030A62A7E4B45C601DE13F9CF80,
9061949bytes, package com.xandeflix.prebuilt/versionCode1/versionName1.0.
Assinatura verificada no APK novo e nos backups4B66D7BF...FF835A/6F1C4F36...9494B:
certificado SHA256 b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Nenhum rebuild, APK/produção/testes/Java/config/ativação alterado nesta entrega.

- Celular SM-S926B/RXGYB03FL4W: APK anterior4B66D7BF...FF835A confirmado;
  adb install -r SUCCESS, APK instalado igual ao9FF23801...F9CF80. Quatro
  arquivos privados e508 arquivos do catálogo comparados em RAM imediatamente
  antes/depois da instalação, todos idênticos. Somente igualdade/contagens
  publicadas, nenhum conteúdo/digest privado persistido. Abertura normal
  Status:ok; PID14944 permanece ativo e MainActivity em primeiro plano no
  diagnóstico posterior. Sem reset/desinstalação/rotação de identidade.
- Tablet SM-X610/RX2X301Q3KY: ausente em adb devices -l. Não instalado.
- Fire Stick AFTSSS/192.168.3.104:5555: conexão ADB recusada10061 na tentativa
  inicial e na confirmação final; ausente da lista de dispositivos. Não instalado.

Pedido assíncrono solicita reconexão USB do tablet e confirmação de IP/depuração
ADB do Fire Stick. Nenhum outro alvo procurado ou package protegido acessado.
Instalação em todos permanece pendente dessas conexões; não declarar sucesso
nos dois aparelhos inacessíveis. Reprodução/gestos/orientação física não foram
homologados nesta rodada; usuário testará o celular atualizado. Somente registros
permitidos alterados, sem Git/gestor/Settings/fonte/canal/teste limpo/prazo60s.
As seções anteriores abaixo são histórico e não negam a entrega parcial atual.

## Canal ativo preservado e Home phone sem Voltar — 2026-10-05

Pedidos adicionais executados com spec/emendas anteriores ao código. Navegar
categorias/páginas/filtro só altera lista: LiveChannel ativo é estado estável
independente, sem mudar previewId/DOM/start/stop/acquire/release. Primeiro canal
do primeiro grupo mantém inicialização automática; depois só clique explícito
em outro canal troca playback. Grupo/logo/EPG continuam do canal ativo. Categoria
vazia/falha/reseleção/rápida não trocam canal nem escondem erro de reprodução.
Resselecionar categoria não esvazia página sem recarga. Fullscreen/tap/Back/C9
mantêm callbacks/listeners/guard anteriores, nenhum Java/ponte/source alterado.

Home phone estreita<600 agora recebe classe de rota e display:none só no botão
Header Back. Histórico/callbacks são preservados; Back nas outras páginas/Live
permanece; apresentação de tablet portrait/landscape e Fire comprovadamente igual.
CSS adicional, nenhuma regra antiga removida/formatter/UA/device hook novo.

Preflight workspace/top-level/origin/main/HEAD esperados e dirty conhecido;
contratos/spec/lock/skills completamente lidos. Baseline405 coincidia antes.
Final400/405 byte-idênticos: só LiveTvPage/AppShell/index.css/harness/APK mudaram.
Identidade/chave/ativação/boot/catalog/source/config/backup/native/VOD intactos.
CURRENT_GATE=NONE, sem Git/backend/gestor/reset/Settings/novo Gate/retomada60s.

### Verificação final

Skills verification/browser/verify orientaram story UI -> página local -> canal
ativo -> preview/sessão. CLI ausente; Chrome/CDP isolado existente, gut-check
imediato, rede externa bloqueada/adapters sintéticos. React review manteve objeto
ativo/setState funcional, dependência do grupo, cancelamento/cleanup existentes;
Shell só classe visual, nenhuma nova IO/listener ou refactor fora do recorte.

- Retenção de canal/categoria:43 checks, zero erros, phone390/tablet1280/Fire960,
  página assíncrona, grupo normal/vazio/falha/reseleção/rápido, paginação/filtro,
  troca explícita uma vez, confirmação/tap/Back/C9/erro/cleanup.
  tmp/c11-side-navigation/run-1791205961083/report.json
- Home phone320/390/430 sem Back com histórico + outras rotas/Live/tablet/Fire:
  14 checks, zero erros. tmp/c11-side-navigation/run-1791205935875/report.json
- Mobile preview/layout/persistência:26 checks, zero erros.
  tmp/c11-side-navigation/run-1791205989912/report.json
- Gestos/concorrência/stale/falha/retry/C9 negado/cleanup:25 checks, zero erros.
  tmp/c11-side-navigation/run-1791206009342/report.json
- Matriz lateral/rotas/foco/scroll/layout:59 checks, zero erros.
  tmp/c11-side-navigation/run-1791206034275/report.json
- Lock oficial49 casos/9 negativos antes/prebuild/final PASS. Typecheck/build/
  cap sync/assembleDebug/testDebugUnitTest PASS; Java task UP-TO-DATE, resultados
  preservados102 testes/14 suites/zero failures/errors, Java byte-idêntico.
- C9runtime10/VOD12/LiveT127–T14317/repair20/exaustivo20/política lateral18+hook,
  playback-notice11/bridge4 negativos/orientação5/backdrop5 negativos PASS.
- Scoped git diff --check exit0/zero erros; warnings de EOL preexistentes apenas.
  Browser/server próprios fechados; nenhum Chrome isolado restante.

Screenshot Home390 revisado sem Back; screenshot Live tablet mostra erro injetado
deliberadamente no fixture e canal49 retido com lista da categoriaB. Não são
mídia real ou falha física. Browser não homologa rotação/codec/stream Android.

### Artefato e limites

APK raiz e app-debug.apk iguais,9061949 bytes, SHA256
9FF238019553263CCADE6964FBE471C2BF575030A62A7E4B45C601DE13F9CF80.
5 assets dist/APK idênticos, packagecom.xandeflix.prebuilt e signature verificados,
certificateSHA256b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
HTTPS/CapacitorHttp/mixedContent/loggingnone preservados. Backup novo recuperável
Xandeflix-v1.0.0-standalone-before-live-category-retention.apk é exatamente4B66D7BF...
FF835A; backups anteriores intactos. Build intermediário só categoria nunca foi
entregue/instalado; artefato final contém também Home Back.

NÃO instalado nesta rodada: pergunta explícita de atualização do celular ainda
sem resposta. Atualização anterior4B66... continua evidência histórica abaixo,
não prova que o novo9FF... está no aparelho. Nenhum uninstall/limpeza, leitura
privada/captura de mídia/fonte, outro aparelho ou teste de versão limpa executado.
Testes novos consolidados no contrato para futuras mudanças Live/Home; proteção
local, sem política Git/CI remoto criada ou promessa de ausência universal de bugs.

### Incidentes e negativos

Retenção rejeitou baseline4B66...: mudança de categoria aumentou start/acquire
de1 para2 e stop/release de0 para1 (run-1791205207520). Reteste revelou defeito
preexistente do handler em categoria já selecionada: esvaziava lista mas ID não
mudava/efeito não rodava (run-1791205279971); corrigido dentro da emenda prévia.
Parser do novo fixture tratou botão Próximos canais como canal com metadados e
lançou Uncaught (run-1791205346679); passou a contar só cartões de canais e enviar
ArrowDown ao último canal real, mantendo assert48 (não relaxado).

Backup escrito paralelamente acionou watcher Vite com EBUSY no APK, encerrando
uma rodada antes de validação completa. Watch.ignored do harness inclui agora
**/*.apk, somente artefatos de distribuição; rerun bounded passou. Cleanup
read-only confirmou zero Chrome isolado órfão; nenhum browser pessoal tocado.
Home negativo também rejeitou baseline:1 botão visível com histórico onde
esperado0 (run-1791205868529). Todos os testes finais acima passam. Avisos
node:fs/path externalized/mixed chunks/flatDir são preexistentes; nenhum crypto
externalized, dependência nova ou correção oportunista executada.

## Atualização autorizada no celular primeiro — 2026-10-05

Pedido posterior autoriza somente atualização sem limpar o aplicativo. Instalado
no Samsung SM-S926B/RXGYB03FL4W com adb install -r, package com.xandeflix.prebuilt.
APK instalado SHA2564B66D7BF13A4E32B5F684E965C8A593568F6A03D0573644FBDBA5A781BFF835A
é exatamente o artefato já validado. Anterior8828F120...FD4B8C; assinatura de ambos
verificada e idêntica, certificateSHA256b235c711...848d. Nenhum rebuild/patch
de produção ou mudança em outro aparelho.

Quatro privados (identidade, chave, instalação, ativação) e todos508 arquivos
do catálogo têm hashes idênticos imediatamente antes/depois do install -r,
comparados somente em RAM. Publicadas apenas igualdade/contagens; nenhum dado
privado, URL de fonte, token, chave ou imagem de mídia capturado/publicado.
Install SUCCESS, abertura normal Status:ok, PID30587 continua vivo e MainActivity
em primeiro plano no check posterior. Não executado teste físico de rotação,
fullscreen/mídia ou primeira instalação; esses limites permanecem explícitos.

Preflight atualizado confirmou workspace/top-level/origin/main/HEAD esperados,
dirty conhecido e contratos integralmente lidos. Lock oficial49 casos/9 negativos
PASS antes da entrega.405/405 hashes de produção/config/testes/APK idênticos antes
e depois. CURRENT_GATE=NONE, nenhuma operação Git/backend/gestor/reset/uninstall,
rotação de identidade, Settings de orientação ou trabalho60s. Teste de versão
limpa fica para autorização posterior; não foi antecipado.

Cópia pública recuperável do APK previamente instalado está no tmp próprio
c11-phone-update-fa8a6d37779d438dbb24145cc8a088fc/installed-before.apk.
Primeiro pull concluiu, mas mensagem de progresso em stderr foi interpretada
como erro pelo PowerShell ErrorActionPreference=Stop. Confirmado arquivo/hash e
assinaturas em comando read-only seguinte; nenhum install havia começado nessa
falha de wrapper. Instalação posterior usou helper sanitizado com exit code real,
sem relaxar verificação ou expor conteúdo privado.

Auditoria git diff --check global também identificou blank line at EOF na linha
723 de capacitor-filesystem.storage.ts, arquivo já pertencente ao dirty anterior
e com hash idêntico ao baseline405. Não é nova regressão deste ciclo de entrega;
nenhuma normalização ou correção fora da allowlist executada.
Check documental com override temporário core.autocrlf=false classificou CRLF
histórico como trailing whitespace; repetição com configuração normal do repo
passou (exit0/zero erros), sem normalizar arquivos nem mudar configuração Git.

## Resultado do build — anterior à autorização de instalar — 2026-10-05

APK gerado e validado, NÃO instalado nesta rodada. Celular conectado Samsung
SM-S926B/RXGYB03FL4W ainda usa APK8828F120...FD4B8C (checagem pública read-only).
Atualização foi perguntada ao usuário; não houve resposta explícita até a entrega.
Fire/tablet não estavam conectados. Nenhum reset, fonte/gestor/backend/Git ou60s.

- Um Voltar local em Live; outras rotas mantêm callback/histórico originais.
- Nenhuma versão do catálogo no Header de qualquer layout/rota; Sincronizando...
  continua como status quando fornecido pelo bootstrap. Metadados intocados.
- Prévia mobile permanente100% da largura, sem gutter/borda lateral,16:9;
  abaixo do título/contador e acima de somente Categorias/Canais. Sem aba Player,
  Trocar Categoria, Voltar para Lista ou botão Player Nativo em nenhum layout.
- Segundo clique no canal ativo e toque nativo inline em telefone/tablet expandem
  MESMO PlayerView/preview/sessão. Fire permanece confirmação pelo controle.
- Interface phone0<smallestWidthDp<600/não-TV em PORTRAIT; fullscreen Live solicita
  SENSOR_LANDSCAPE; exit/Back/release restaura PORTRAIT. Tablet/TV/undefined não
  recebem orientação. VOD já sensorLandscape e continua byte-idêntico.
- Geometria observa montagem após catálogo assíncrono; abas/filtro/scroll não
  reiniciam preview/session. Listas mobile e colunas landscape rolam localmente.

## Proveniência e escopo

Preflight workspace/origin/main/HEAD/dirty conferidos; contratos/specs/lock lidos
completamente. Spec prévia e emendas por pedidos sucessivos em
[C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW](../architecture/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).
CURRENT_GATE=NONE; nenhum próximo Gate. Baseline401 coincidiu com6F1C4F36...9494B.
Final393/401 byte-idênticos; só Header/Shell/Live/CSS/MainActivity/NativePlugin,
harness e APK mudaram. Mais teste Java de tap atualizado, novo teste Java de
orientação e guard Node; guard backdrop anterior permanece E3B26453...20A1.
Baseline seguinte405 hashes inclui esses quatro guard/test files antes ausentes.
Identidade/ativação/boot/source/backup/config/App/ponte/VOD/dependências intactos.

CSS prefixo anterior tem só UMA normalização CRLF->LF de contexto pelo apply_patch;
restaurá-la em RAM recupera SHA25613A0D8EB686F6A226ED327FB31218478C309B3F2CA45AD044046D2AE26CE502E.
Nenhuma regra antiga mudou; sem formatter/refactor global. Native mudou somente
elegibilidade touch (helper renomeado/>0, exclui TV), dois calls de orientação e
EOLs dos contextos tocados. Fundo opaco/restore/FIT/MediaItem/player/source iguais.

## Testes executados

Skills agent-browser/agent-browser-verify/verification/React aplicadas: CLI ausente,
fallback Chrome/CDP isolado com gut-check imediato, rede externa bloqueada e
adapters sintéticos. Revisão React manteve um ref/árvore, dependência primitiva de
presença da superfície, cleanup de observer/listeners e aria-pressed das duas abas.
Nenhuma IO nova; sessão só muda legitimamente ao selecionar outro canal.

- Matriz layout/foco/rotas/rotação/scroll:59 checks, zero erros.
  tmp/c11-side-navigation/run-1791203290540/report.json
- Mobile320x568/390x844/430x932:26 checks, zero erros. Largura320/390/430 exata,
  duas abas/Back/no-version/no-button, mesmo preview ao alternar abas/filtro,
  scroll preserva vídeo, first-different/second-selected/tap/Back/session.
  tmp/c11-side-navigation/run-1791203196227/report.json
- Interação Fire/tablet/pending/stale/duplicação/falha/retry/C9/cleanup:25 checks,
  zero erros. tmp/c11-side-navigation/run-1791203409133/report.json
- Java102 testes/14 suites, zero falhas/erros (inclui6 orientação e6 tap).
- Phone orientation guard +5 negativos; backdrop guard +5 negativos PASS.
- Lock oficial49 casos +9 negativos antes/depois/prebuild/entrega PASS.
- C9 runtime10, VOD12, playback-notice11, LiveT127–T14317, bridge +4 negativos,
  Live exaustivo20, browse/playback repair20, política lateral18+hook PASS.
- Typecheck/build/cap sync/assembleDebug/testDebugUnitTest PASS. Gradle155 tasks,
 29 executadas/126 up-to-date. Nenhum Module crypto externalized.

Fixtures NÃO provam WindowManager/gesto Android físico, conteúdo real, codec ou
rotação de hardware. Screenshots revisados são sintéticos, nunca mídia privada.
Sem homologação física nova, sem promessa universal de zero regressão/SLA.
Alguns nomes históricos de checks referem layout original; asserts atuais exigem
zero botões NativePlayer em todos layouts, supersedendo expectativa antiga.

## APK e preservação

Xandeflix-v1.0.0-standalone.apk,9061936 bytes, SHA256
4B66D7BF13A4E32B5F684E965C8A593568F6A03D0573644FBDBA5A781BFF835A.
Igual ao app-debug.apk;5 assets dist/APK idênticos; packagecom.xandeflix.prebuilt,
versionCode1/versionName1.0, certificateSHA256
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
HTTPS/CapacitorHttp/mixedContent/loggingnone mantidos. Backup recuperável
Xandeflix-v1.0.0-standalone-before-live-mobile-cleanup.apk, SHA256
6F1C4F36C6086FDD74FD838D999263C0A078A50103751BD455B319160154994B.
Demais backups não sobrescritos. Nenhuma instalação/leitura de privados nesta
rodada; aparelhos/dados atuais não modificados. Forwardlist vazio; harness fecha
Chrome/server próprios. Instalação/teste físico aguardam confirmação explícita.

## Incidentes/limites registrados

Primeiro guard visual rejeitou versão no baseline antigo como esperado, antes do
patch funcional (run-1791201687165). Ausência de preview e terceira aba foram
observadas em fonte; não alegar negativo físico. Fixture incluía dois launchers
de overlay ausentes no App, consumindo88px: removidos só no DOM do teste.
Revisão320x568 revelou lista sem altura; primeiro limite de largura foi superseded
por exigência edge-to-edge do usuário. Corrigidos só padding/EPG de viewport curta;
lista final48px mantém scroll, vídeo320x180. Assert48 não relaxado. EPG inteiro
continua acessível por scroll em área compacta (28px na tela curta,44px nas demais).
Guard orientação inicialmente aceitava6000 por regex prefixo600; negativo falhou,
word-boundary corrigiu o VERIFICADOR; política de produção nunca foi relaxada.
Leitura combinada truncada foi relida completa; caminho inicial guessed do lock
inexistente resolvido por rg; nenhuma edição antes da leitura correta. Um patch
documental sem contexto exato foi recusado e reaplicado com contexto observado.
Probe de prefixo CSS byte-exato inicialmente FAIL por1EOL; recuperação em RAM
confirmou ausência de alteração de regras. Avisos node:fs/path/mixed chunks,
flatDir/deprecated/LF-CRLF preexistentes fora do recorte; sem dependências novas.
