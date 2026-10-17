# C118 — área de toque do hero no dobrável — 2026-10-15

Spec anterior ao teste/código: docs/architecture/C11_SQUARE_HERO_HIT_AREA.md.
Preflight no clone ativo C11-main/main/origin canônicos, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. AGENTS/Architecture/Execution/Lock/
C106 lidos; baseline privado1.038 arquivos em tmp/c118-square-hero-hit-area.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. C107–C117 preservados.

## Causa reproduzida

Hero/HomeHero e CSS reais, janela800x880/perfil TABLET/quadrado, arte e
metadados simulados. Antes do patch,13/25 pontos do mapa estavam cobertos
por hero-content/hero-title/hero-overview/hero-footer. A camada de conteúdo
z-index2 ocupa largura inteira por C94 e recebia pointer-events nas regiões
transparentes, impedindo atingir hero-artwork-link na camada inferior.
Input.dispatchTouchEvent nos pontos bloqueados não acionou onSelect; ponto
superior livre abriu o item exatamente uma vez. Reproduz o padrão relatado,
sem precisar modificar proporção/resolução do Z Fold.

## Correção mínima

Hero.tsx ganha somente classe condicional hero-banner--artwork-details quando
política C106 já permite abrir detalhes (PHONE/TABLET). Duas regras CSS fazem
o conteúdo passivo transmitir o toque à área de imagem existente; elementos
interativos (button/link/input/select/textarea/role button) retêm eventos.
Sem elevar imagem acima das ações, duplicar handler, aninhar interativos ou
mudar geometria/estilo/radial/dimensões. HomeHero/CategoryHero/gestos/timers,
callbacks, roteamento e perfis intactos. TV/Fire/desktop sem classe/ação nova.

## Verificação

- C118 browser4 grupos PASS, com hit-test real por coordenadas e componentes
  Hero/HomeHero/CategoryHero reais. Contraste negativo remove só as duas regras
  novas e reproduz13/25 bloqueados; não depende de arquivo privado para rodar.
- 160 toques em pontos passivos, nos7 layouts/páginas testados, todos abrem
  exatamente uma vez o item atual: quadrado800x880/880x800, PHONE e TABLET,
  mobile390x844, tablet1280x800, Home/Filmes/Séries/categoria estática.
- Assistir só reproduz; Detalhes abre uma vez; dot troca sem abrir e toque
  seguinte usa item novo. Swipe real nos dois sentidos e cancelamento sem
  clique residual; teclado Enter acessível; TV/Fire/desktop sem área nova.
- C1068 grupos PASS sem mudança de critérios, incluindo scroll/drag vertical,
  stale item, cancelamento, teclas e timer10s/Fire/pausas consolidadas.
- TypeScript/Vite, lock26+27+9 antes/prebuild/final, cap sync/Gradle PASS.
-7 assets iguais ao dist; assinatura/package/versão/config produção PASS.

Revisão React: única classe derivada de boolean já calculado, sem hooks,
dependências ou estado novos, sem IO/re-render adicional. Elemento acessível
existente mantém nome/foco/Enter. Screenshot fold-square-after inspecionado,
arte sintética, sem backend/fonte/rede. Resultados privados em tests.json,
before-hit-report.json e audit.json do tmp C118.

Primeira execução completa parou no caso de teclado: evento CDP Enter sem
text não gerava ativação HTML; fixture passou a enviar text/unmodifiedText
CR, sem mudar produção ou assertion. Reexecução completa PASS. Avisos Vite/
flatDir anteriores permanecem; nenhuma falha técnica pendente identificada.

## Artefato/limites

APK tmp/c118-square-hero-hit-area/Xandeflix-v1.0.19-C118.apk,
com.xandeflix.prebuilt, code19/name1.0.19, min23/target35,11.447.990 bytes,
SHA256ee872966d23438ca3bedcf34e02b4f48e3e97f60e8f0812de1fc31a4bebb6175.
HTTPS/sem dev server, mesmo certificado C117 e APK C117 intacto. Sem nova
dependência, alteração de fonte/catálogo/search/ativação/player/Android,
instalação/publicação/Git/backend/reset ou próximo Gate.
QA física no Z Fold não executada; ensaio comprova o defeito e a correção
no layout simulado, não certifica todo modelo/firmware/WebView real.
