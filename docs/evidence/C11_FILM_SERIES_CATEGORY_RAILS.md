# C11 — Filmes e Séries com linhas horizontais de categorias — 2026-10-07

## Implementação e comportamento

Filmes e Séries mantêm o hero e passam a mostrar uma linha horizontal por categoria
canônica da fonte. Cada linha tem até20 itens e Ver todos no canto superior direito,
em lugar das setas. Home/Recentes/Semelhantes conservam os controles anteriores.
Ver todos abre a coleção do ID exato e do tipo movies/series correto, com título
real e grade vertical. Plataformas como Netflix/Disney/Apple vêm da fonte.
A coleção usa páginas48 e carregamento automático; o limite20 é só da prévia.
Lançamentos conservam a ordem da fonte; outras categorias mantêm randomização
estável durante a visita e ao acrescentar dobras. Não escreve no catálogo.

CatalogBrowsePage compartilha o comportamento entre os dois tipos. useSegmentedBrowse
e seu cache sobrevivem à troca overview/coleção. Foco/hover/touch de Ver todos
antecipa a primeira página; reentrada usa cache local. Faixas novas são lidas
quando próximas da viewport, com fila2, count:false, snapshot e cancelamento.
Histórico existente inclui o ID da categoria: detalhe→categoria→overview pelo Back.
App teve somente duas alterações nos returns de browse; boot/ativação/C9 intactos.
Scroll/foco inicial restaurados no hero. D-pad Up no card alcança Ver todos,
Down volta ao card e Up no botão segue à linha anterior/hero.

## Verificação da navegação

Novo teste executa leitor real com prévia20, categorias90filmes/55séries,
IDs/tipos/plataformas exatos, paginação integral, cache sem novo I/O, rota/back,
ordem de Lançamentos e estabilidade da dobra. Executa os componentes reais para
overview/grid inválido, callbacks/acessibilidade/defaults de Home e cancelamento
antes de iniciar I/O: PASS. Category-preview, page-artwork-preparation,
phone-movie-detail e Fire/search existentes PASS. Typecheck/build/sync/Gradle
PASS; Java130, zero falhas/erros. Lock antes/prebuild/depois:9 negativos,
22 ativação,27 promoção PASS. Modelos de primeira instalação não substituem
conferência de uma instalação limpa física; não houve reset dos aparelhos.

Fire AFTSSS, tablet SM-X610 e S24 SM-S926B:20 linhas de Filmes/23 de Séries,
20/23 botões, zero setas e zero grid geral; prévias até20, sem overflow.
Ver todos Nacionais e Netflix abriu categoria correta, somente tipo esperado,
sem chips nem Carregar mais. Paginação automática chegou a96 IDs distintos,
todos pertencentes à categoria. Há títulos iguais com IDs distintos na fonte;
não são duplicação de IDs. Detalhe abriu e Back retornou categoria e overview
com topo restaurado. Fire permaneceu no aplicativo. Up/Down/Enter físico do
Fire alcançou e ativou Ver todos. S24 manteve hero vertical379,43×569,14px;
Fire856×405px e tablet1269,33×480px. Barras tablet/celular visíveis na navegação.

Limites/ocorrências: WebView tablet estava pausado por player nativo em primeiro
plano; sair do player restaurou barras e permitiu repetir QA. S24 saiu do app,
depois permaneceu aberto conforme confirmação do usuário. Probe de foco inicialmente
esperava atributo de ação do desktop; corrigido para foco dentro do hero, também
válido no telefone. Regex histórico T187/countCategory já falha no baseline,
pois leitor inalterado usa countItems; não modificado nem declarado PASS.
Proveniência:694 arquivos baseline,168
protegidos inalterados, allowlist e somente dois returns de App confirmados.

## Regressão visual reportada durante a conclusão

Usuário enviou imagens de capas quebradas e linhas pendentes em Home/Filmes/Séries,
incluindo dispositivos instalados pelo APK. Isso INVALIDA prontidão visual para
produção: QA de navegação/paginação acima não certifica imagens de todas as linhas.
Auditoria física adicional no S24 reproduziu Apple TV/Legendadas/Lionsgate com
20/20/7 imagens sem src e pendentes após5,4s de rolagem, enquanto primeiras linhas
tinham imagens prontas. Investigação/correção de carregamento fica no próximo
ciclo local explicitamente solicitado pelo usuário, sem iniciar Gate canônico.
Este APK não é apresentado como correção definitiva das capas.

## APK e atualização preservada

APK intermediário de navegação:DF381D54C634B7E4B802E236BC58069DA1D867877014E0AEDF5A1FE66761C90B,12400179 bytes.
Package com.xandeflix.prebuilt, versionCode1/versionName1.0, min23/target35,
standalone HTTPS sem server.url; certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d preservado.
Assets6 idênticos ao dist; bundle dist/assets/index-CzBxI99I.js, CSS index-BlooiuWf.css.
Install-r nos três, hashes de todos os arquivos privados e firstInstallTime
idênticos imediatamente antes/depois:Fire467(436catálogo),tablet537(505),
S24550(508),5 arquivos nativos por alvo. S24 foi incluído após reconexão informada.
Uso posterior pode atualizar caches/recentes normalmente. Sem Git/backend/reset.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Relatório cumulativo item48.
