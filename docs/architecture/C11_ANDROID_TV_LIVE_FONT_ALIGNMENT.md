# C144 - fontes de canais e guia no Android TV - 2026-10-17

## Pedido, preflight e proveniencia

Usuario reporta categorias com fonte correta, mas canais/guia grandes em TV
Philips Google Android TV. Igualar fontes a referencia atual das categorias
em todos os perfis Android TV, preservando os demais dispositivos.

Preflight read-only: clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Dirty C133-C143 conhecido;
auditoria C143 PASS. AGENTS/Architecture/Execution/Source Boundary/Activation
Lock lidos. Hashes/copias antes do patch em tmp/c144-android-tv-live-fonts.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset.

## Especificacao anterior ao codigo

- Acrescentar bloco CSS de tipografia somente em app-shell--android-tv na
  pagina live, excluindo app-shell--fire-stick e conferencia web explicitamente.
  Usar perfis existentes; nao alterar deteccao/modelos ou media queries globais.
- Referencia igual as categorias: var(--tv-font-xs, 0.85rem), equivalente aos
  10px no viewport compacto existente e0.85rem fora dessa densidade. Nao alterar
  coluna categorias, seus contadores ou regras responsivas consolidadas.
- Aplicar a nomes/formatos/status/filtro/cabecalho da coluna canais, nome e
  identificador do canal no resumo e textos/badges/horarios/titulos/descricao/
  mensagens da guia de programacao. Preservar pesos e cores de hierarquia.
- Sem modificar altura de linhas virtualizadas, icones/logos, dimensoes do
  player, focos, D-pad, dados/EPG, handlers, parental ou carregamento/busca.
- Entregar novo APK de teste1.0.29/code29 para conferir na TV; preservar APK
  C143, package e assinatura. Nenhuma instalacao ou acesso aos aparelhos.

## Allowlist e aceitacao

src/ui/pages/LiveTvPage.css (somente novo bloco isolado de font-size);
android/app/build.gradle (somente2 constantes de versao);
este documento e docs/evidence/C11_ANDROID_TV_LIVE_FONT_ALIGNMENT.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs privados tmp/c144-android-tv-live-fonts e saidas usuais build/APK.

Auditar sintaxe/seletores e isolamento por perfis; CSS anterior intacto e
todos os seletores novos limitados ao font-size. Nao criar testes que apenas
espelhem CSS. Lock antes/depois, typecheck/build web e padrao; sync/Gradle e
assinatura/package/versao/HTTPS/assets/CSS incluidos/recursos nativos iguais.
Hashes preservam todo runtime TSX/JS/Java/source/catalog/search/EPG/parental.
QA visual por CUA se houver superficie; nao substituir por automacao direta
do navegador. Declarar a conferencia fisica pendente quando indisponivel.
