# C73 — controles Live, paginas mobile e comandos PiP

2026-10-11. Preflight no clone independente ativo, main,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, origin esperado.
CURRENT_GATE=NONE; patch local direto autorizado; Git commit/push/PR=NAO;
NEXT_GATE_STARTED=NAO. Baseline833 arquivos em helper privado C73.

Port planejado de harness: scripts/test-c11-mobile-output.mjs verifica literal
`<CastButton />`, incompatível com props iconOnly existentes na baseline C72.
Aceitar o componente com props, sem remover nenhuma assertion de mobile/C9.
Movie/Series deslocaram o botao para PhoneMovieDetail/PhoneSeriesDetail em ciclos
anteriores. Harness confere roteamento do detalhe e presenca no filho mobile;
nenhum arquivo produtivo de Cast/detail foi alterado neste ciclo.
Primeiro browser falhou por servidor local encerrado; helper local reiniciado.
Validacao do navegador real concluida com AppShell/Header/CSS/EpgPanel reais;
somente catalogo local sintetico, C9, Media3 bridge e fonte EPG em ports mock.
Inline8 acoes, categorias sem novo player, fullscreen preservado na troca,
ordem stop/release/acquire/start/fullscreen, evento stale rejeitado, favoritos
apos reinicio, guide ready/unavailable/error, contexto sem URLs PASS.
Mobile390x844: grupos63/105, ultimo item dentro do viewport local apos scroll,
proxima/anterior, scroll/foco inicial, filtro nao oculta paginas, resposta de
pagina antiga nao substitui nova categoria; D-pad e unmount/release PASS.
Paisagem844x390 e TV1280x800 conferidos em screenshots privados C73.

JS7 grupos C73 PASS; regressao Cast2, awake8 controles negativos, series8,
continuidade4 PASS. TS/build e lock22+27+9 PASS. Java21 testDebugUnitTest e
assembleDebug finais PASS:170 testes, zero failures/errors/skipped, incluindo
PiP action2, lifecycle8 e Live2. Device presentation3 e landscape18 PASS.
QA fisica nao realizada; bridge/C9/EPG simulados no browser nao certificam
Media3, PiP Android ou D-pad do aparelho real.

Erros de harness corrigidos: Vite ignora tmp e reteve ports antigos; usar
nomes unicos por rodada. Expressao regex serializada ao CDP perdeu escapes;
assertion agora usa includes. qa apos reload acessado via window.qa; selecao
de categoria aguarda commit React. Nenhum desses erros representa certificado
de sucesso anterior; rodada final usa helpers corrigidos e encerra player/C9.

Hero/menu:12 combinacoes tablet1280x800,960x540,800x1280,600x960 por Home,
Filmes e Series PASS. Hero horizontal16:9, imagem contain inteira, titulo e
acoes dentro do hero, sem overflow horizontal. Retrato rola app-content650px,
header.top permanece0 e window.scrollY=0. Icone SVG de engrenagem24px com
nome acessivel Configuracoes; toque/Enter abrem Settings em phone/tablet/TV.
Phone/TV mantem suas regras anteriores de artwork. Screenshots e metrics
privados em tmp/c73-live-player-controls; imagens sinteticas sem API TMDB.
Revisao React: hooks/cleanup abortam pedidos e eventos stale, portas paginadas
limitadas, C9 serializado, botoes com nomes/foco, falhas storage sem falso
favorito e sem URL/segredo no contexto. Sem refactor ou dependencia adicional.

Rodada CDP concorrente foi invalidada e repetida isoladamente. Startup/account
do browser e timeout localhost resolvidos em perfil headless proprio, Chrome,
porta9705, URL127.0.0.1 e no-proxy-server; sem alterar browser/proxy do usuario.
Warnings de build existentes: node:fs/path externalizados, mixed imports e
bundle grande. Apksigner confirma v1/v2; warnings META-INF de bibliotecas nao
invalidaram a verificacao de assinatura. Nenhum segredo registrado.

APK debug final:tmp/c73-live-player-controls/xandeflix-player-tv-ao-vivo.apk,
12.379.300 bytes; SHA256
E82CA3324DA7467112F37366E6F682B92D73899D552001555F92881337EC969F.
Package com.xandeflix.prebuilt, versionCode13/versionName1.0, minSdk23/target35.
Assinatura debug SHA256
B235C7117C9660E17CF0732CD6493600A812692AF289E627454988EA096E848D.
Os7 arquivos dist conferidos byte a byte contra assets/public do APK PASS.
Provenance final contra baseline833: apenas allowlist C73, nenhum arquivo
excluido/nao autorizado; HEAD inalterado. Nenhuma instalacao/distribuicao,
Supabase/env, commit/push/PR ou proximo Gate. NEXT_GATE_STARTED=NAO.
