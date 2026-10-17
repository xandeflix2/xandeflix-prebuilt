# C145 - fundo dinamico e menu lateral transparente no navegador - 2026-10-17

## Pedido, preflight e proveniencia

Usuario solicita fundo dinamico no navegador e menu lateral transparente,
como continuidade do comportamento de cores dos demais dispositivos. Ciclo
somente web; preservar carregamento/capas/catalogo/busca e toda versao nativa.

Preflight read-only: clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Dirty C133-C144 conhecido;
auditoria C144 PASS. AGENTS/Architecture/Execution/Activation Lock lidos;
Source Boundary previamente lido e preservado, sem operacao backend/source.
Baseline de hashes/copias em tmp/c145-web-ambient-sidebar antes do patch.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/APK/install/reset.

## Especificacao anterior ao codigo

- Reutilizar extracao/paleta/cores atuais. No browser imagem cross-origin
  exibida sem CORS pode contaminar canvas e impedir getImageData; codigo atual
  captura erro e retorna sem cor. Referencia primaria:
  https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image.
  Reproduzir essa fronteira em fixture antes do patch; nao alegar diagnostico
  instrumentado da aba real se CUA indisponivel.
- Somente quando webValidationBuild e isWebValidation forem verdadeiros e
  amostragem atual falhar, tentar imagem auxiliar da MESMA imagem exibida com
  crossOrigin anonymous. Nao alterar src/crossOrigin/erro/prioridade da capa
  exibida, filas/cache de artwork ou transporte da fonte/player.
- Helper dinamicamente importado somente no web, mapa de trabalhos em voo
  limitado, timeout e falhas deduplicadas limitadas em RAM. Sem cookies ou
  persistencia de URI/paleta, sem API/proxy central ou credenciais novas.
  Reutilizar paletteForImage e cache existente de48 cores, canvas24x24.
- Resultado assincrono somente aplica se effect ativo, imagem conectada,
  URI e pagina ainda iguais. Abort ao sair/trocar titulo impede pintura antiga.
  Atualizar as mesmas propriedades CSS e halo locais existentes; falha/sem
  paleta mantem fallback neutro e a imagem continua visivel.
- CSS apenas web/data-web-validation=true e side-nav: shell com gradiente
  usando navigation-ambient atual; header transparente, sem sombra/borda/filtro
  opacos. Nao alterar botoes/foco/tamanho/centralizacao ou player/modais.
- Hook nativo mantem comportamento anterior; sem helper no bundle padrao e
  sem novos pedidos de imagem em native. Sem mudar rotacao10s ou sincronizacao.

## Allowlist e verificacao

src/web/web-runtime.css (novo bloco isolado);
src/web/web-artwork-palette.ts (helper novo limitado ao web);
src/ui/hooks/useImmersiveArtwork.ts (somente guard/import/abort/fallback web);
scripts/test-c145-web-ambient.mjs (portas sinteticas imagem/canvas/DOM/ciclo);
este documento e docs/evidence/C11_WEB_AMBIENT_TRANSPARENT_SIDEBAR.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs privados tmp/c145-web-ambient-sidebar e saidas usuais dos builds.

Verificar reproducao SecurityError, CORS antes de src, troca de cor e rejeicao
de resultado antigo/abort, falha segura, deduplicacao/limites/timeout/cleanup.
Testar hook nativo sem fallback/requests extras; regressao da paleta existente.
Auditoria inversa preserva codigo nativo no hook e demais arquivos por hashes.
Lock inicial/prebuilds, typecheck/build web e padrao, helper ausente no padrao.
Sem teste que apenas repete CSS. CUA para QA real se disponivel; smoke HTTP do
servidor local nao certifica pixels. Preservar origem/storage da aba ativada.
