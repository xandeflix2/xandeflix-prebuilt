# C146 - recuperacao da leitura de cor no navegador - 2026-10-17

Spec: docs/architecture/C11_WEB_AMBIENT_REGRESSION_DIAGNOSIS.md, incluida
emenda anterior ao codigo funcional. Clone ativo c11-main/main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Baseline1169 em
tmp/c146-web-ambient-regression. Workspace historico somente leitura.

## Evidencia real e limite do diagnostico

Usuario informou efeito temporario em Filmes, perdido apos navegar entre
Home/Filmes/Series, e enviou diagnostico sanitizado da aba localhost3000:

```
AMBIENT_WEB_BUILD=SIM
AMBIENT_IMAGE_READY=SIM
AMBIENT_PROBE_STATE=NO_PALETTE
AMBIENT_PAGE_ACTIVE=NAO
AMBIENT_PAGE_COLOR=NONE
AMBIENT_SHELL_COLOR=NONE
AMBIENT_PAGE_GRADIENT=NAO
AMBIENT_SHELL_GRADIENT=SIM
AMBIENT_SHELL_GRADIENT_START=rgb(8, 12, 20)
AMBIENT_HEADER_COLOR=rgba(0, 0, 0, 0)
```

Isto demonstra falha de obter paleta, sem cor aplicada na pagina/shell, e
confirma transparencia do header. Nao identifica isoladamente cache, rede,
timeout ou erro de pixels. C145 visual nao homologado: screenshot/relato
mais recente prevalecem sobre seus testes sinteticos anteriores.

## Patch minimo

Somente helper/diagnostico web. Quando img auxiliar CORS falha ou nao produz
paleta, uma recuperacao fetch da mesma URI usa cors/credentials omit/cache
reload/no-referrer. Resposta CORS legivel, ok e Blob image/* de ate5MiB sao
decodificados num img auxiliar com objectURL temporario. Usar mesmo algoritmo
24x24 existente; imagem exibida e filas/shared caches de capas intactos.
Falha final continua neutra. Nao usa no-cors/proxy/fonte/API/backend.

Cache reload evita reutilizar entrada HTTP anterior, como documentado em
[Request.cache](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).
E uma recuperacao para a fronteira demonstrada; nao prova que cache era a
causa na aba. [Request.mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/mode)
documenta que resposta no-cors e opaca; a implementacao exige CORS.

Maximo2 trabalhos, deduplicacao URI, uma recuperacao/trabalho, timeout5s por
etapa,48 paletas RAM/48 falhas TTL60s. Finalizacao revoga objectURL, solta img,
limpa timer e aborta fetch. Signal/URI atual/conexao impedem pintar pagina
apos sair ou trocar titulo. Paleta recuperada reutilizada ao voltar a rota.
AMBIENT_PROBE_FAILURE adicional somente enum sanitizado, sem URI/excecao.
CSS e hook compartilhado identicos ao baseline; bundle padrao exclui helper.

## Verificacoes e limitacoes

- Instrumentacao inicial:3 testes de campos reais extraidos via AST,
  sanitizacao e ausencia de elementos PASS. Primeiro fixture falhou por
  newline inicial do bloco; trim no assert corrige fixture, sem mudar codigo
  produtivo ou retirar asserts de privacidade. Logs preservados.
- Antes do patch funcional, test-c146-web-ambient-recovery --baseline
  reproduziu img auxiliar falho, nenhuma recuperacao, NO_PALETTE e nenhuma
  cor aplicada. recovery-before.log.
-7 testes finais recuperacao PASS: fetch opcoes/same URI/capa intacta;
  retorno a rota cacheado; resultado atrasado apos abort/troca/desconexao;
  falha CORS/opaque/HTTP/MIME/tamanho/backoff; timeout/abort/liberacao;
  native/URI insegura sem pedidos; deduplicacao/max2 durante recuperacao.
-8 testes C145 anteriores intactos PASS; regressao original de paleta PASS;
 3 testes diagnosticos PASS. Nao sao testes de pixels do navegador real.
- Locks26 ativacao+27 promocao+9 controles negativos PASS nos builds.
  Typecheck/Vite web e padrao PASS antes do patch funcional; build web final
  PASS21.66s. Build padrao final e auditoria registrados no fechamento abaixo.

CUA apps=[]/browsers=[]; sem CDP alternativo. Foi solicitada conferencia
Home -> Filmes -> Series -> Home na mesma aba, sem limpar dados/identidade.
Resultado visual final depende do retorno do usuario; nao alegar homologacao
do efeito pela instrumentacao ou smoke HTTP. Sem APK/cap sync/Gradle/install,
reset/backend/commit/push/PR. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Fechamento tecnico

Build padrao final PASS17.66s; artefatos JS/CSS com mesmos nomes/hash de C145,
sem helper web. Smoke2 modulos200 com novo marcador de recuperacao/diagnostico.
Primeiro smoke node -e tinha quoting PowerShell invalido e nem executou;
substituido por .mjs privado; resultado correto em smoke.json.
Auditoria final por hashes cobre1169 arquivos-base: somente helper web e
runtime diagnostico alterados, alem de3 memorias append-only;4 arquivos novos
allowlisted (2docs/2tests). Hook/CSS/shared/Android e APK C144 exatos,
HEAD/main/index intactos. Evidencias privadas audit.json e logs neste ciclo.
Conferencia visual solicitada na aba real ainda pendente neste registro.
