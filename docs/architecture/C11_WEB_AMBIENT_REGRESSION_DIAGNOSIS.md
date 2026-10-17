# C146 - fundo nao acompanha Hero vermelho no browser - 2026-10-17

## Pedido, preflight e proveniencia

Usuario mostra Hit Para Dois com backdrop vermelho e exterior escuro apos
C145. Relato visual invalida afirmacao de resultado visual corrigido; testes
sinteticos C145 nao homologaram a aba real. Investigar primeira fronteira
entre amostragem/paleta/aplicacao CSS, corrigindo apenas web com evidencia.

Preflight read-only clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Dirty C133-C145 conhecido;
auditoria C145 PASS para integridade, nao para cor real. AGENTS/Architecture/
Execution/Activation Lock relidos. Baseline hashes/copias em
tmp/c146-web-ambient-regression. CUA apps=[]/browsers=[]; nao contornar por CDP.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/APK/install/reset.

## Especificacao anterior ao codigo

- Acrescentar ao diagnostico web campos AMBIENT_ somente com estado da
  imagem, etapa de amostragem, presenca/cores RGB de propriedades CSS e
  cores computadas/estado de pintura. Sem titulo/ID/URI/origem/esquema sensivel,
  conteudo da fonte, credenciais, historico ou persistencia.
- Helper web pode registrar estado transitorio na propria imagem atual,
  sem alterar src/crossOrigin/erro/prioridade do elemento exibido. Nao adicionar
  requisicoes, timer, storage ou mudanca de algoritmo para diagnosticar.
- Usar retorno do diagnostico para distinguir falha de probe/hook de camada
  opaca ou cor excessivamente escura; nao fazer nova correcao especulativa.
- Correcao posterior somente na fronteira demonstrada, ainda web. Preservar
  carregamento/busca/catalogo/player/parental e todo nativo/C144 APK.

## Allowlist inicial e aceitacao

src/web/web-runtime.ts (somente campos diagnosticos);
src/web/web-artwork-palette.ts (somente estado diagnostico da imagem atual);
src/web/web-runtime.css (somente correcao web se evidencia justificar);
scripts/test-c146-web-ambient-diagnostic.mjs (campos sem identificadores);
este documento e docs/evidence/C11_WEB_AMBIENT_REGRESSION_DIAGNOSIS.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs privados tmp/c146-web-ambient-regression e saidas usuais builds.

Regressao C1458 testes, paleta existente, campos sanitizados e locks/builds.
Smoke HTTP nao equivale a renderizacao real. Mesmo origin3000/storage preservados.
Se diagnostico exigir alteracao fora da allowlist, emendar spec antes do codigo;
nao relaxar testes ou pedir reset/permissao para operacoes reversiveis autorizadas.

## Emenda apos diagnostico real, anterior a correcao

Usuario reproduziu efeito intermitente ao navegar Home/Filmes/Series. Retorno
AMBIENT_: WEB_BUILD=SIM, IMAGE_READY=SIM, PROBE_STATE=NO_PALETTE,
PAGE_ACTIVE=NAO, PAGE_COLOR=NONE, SHELL_COLOR=NONE; gradiente do shell existe,
inicia rgb(8,12,20), header rgba(0,0,0,0). Fronteira demonstrada: probe sem
paleta; sidebar ja transparente. Causa de transporte/cache ainda inferencia,
nao afirmar que foi comprovado CORS ou timeout pela aba.

Ampliar allowlist de src/web/web-artwork-palette.ts para correcao exclusivamente
web desse probe: apos falha do img auxiliar, uma tentativa CORS da MESMA URI
via fetch credentials=omit/cache=reload/referrerPolicy=no-referrer; resposta
legivel e imagem valida decodificada em img auxiliar com objectURL transitorio.
Nao alterar img exibido, URI original, servico de capas ou modulo de paleta.
Sem no-cors/proxy/API/credenciais. CORS continua obrigatorio. Cache reload
busca nova resposta sem reutilizar a entrada HTTP anterior; esta e uma
recuperacao defensiva para falha de leitura, nao um diagnostico comprovado do
cache do usuario. Referencias primarias:
https://developer.mozilla.org/en-US/docs/Web/API/Request/cache e
https://developer.mozilla.org/en-US/docs/Web/API/Request/mode.

Manter no maximo2 trabalhos simultaneos, uma recuperacao por trabalho,
timeout5s por etapa, cache RAM de48 paletas e falhas48/TTL60s. Liberar img,
objectURL e abortar fetch ao terminar/timeout; descartar resultado apos troca
de imagem/rota. Falha final neutra, sem cor inventada. Diagnostico adicional
AMBIENT_PROBE_FAILURE sanitizado, sem URI/mensagem de excecao. Nativo/shared
hook/CSS ficam exatos. Adicionar scripts/test-c146-web-ambient-recovery.mjs
na allowlist: reproduzir antes, exercitar fallback/ciclo de navegacao/cache,
timeout/liberacao/stale/negativos e preservar os testes anteriores sem edits.
