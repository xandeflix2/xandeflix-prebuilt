# C144 - fontes de canais/EPG iguais as categorias no Android TV - 2026-10-17

Spec anterior ao codigo: [C11_ANDROID_TV_LIVE_FONT_ALIGNMENT](../architecture/C11_ANDROID_TV_LIVE_FONT_ALIGNMENT.md).
Preflight clone ativo/main/origin canonicos, HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d.
Auditoria C143 PASS; baseline1163 arquivos e copias antes do patch.

## Correcao e isolamento

Lista continua virtualizada e EPG embedded usam classes/regras tipograficas
proprias, distintas das categorias. Referencia mantida: var(--tv-font-xs,
0.85rem), isto e10px no media query compacto consolidado,0.85rem fora dele.
Regra nova somente em Android TV/live, com exclusoes Fire Stick e conferencia
web. Nome/formato do canal, cabecalho/contador/filtro/status, resumo/badge do
canal e titulos/horarios/descricao/mensagens da guia usam a mesma referencia.
Pesos e cores preservados. Categorias/contadores nao alterados; nenhum tamanho
de linha virtualizada, icone/logo/player ou parametro de foco foi modificado.

TSX/JS/Java e deteccao de apresentacao permanecem byte a byte iguais; Android
TV/Google TV e TV Box Android seguem o perfil atual. Fire OS explicitamente
excluido; celular/tablet/Tizen/webOS sem a classe Android TV nao recebem a
regra. Modo de conferencia do navegador excluido mesmo com perfil simulado.
Nao altera favoritos/D-pad/EPG/source/catalog/search/parental/startupC143.

## Verificacao e entrega

- Auditoria AST de CSS: regras anteriores intactas; novo bloco unico com
  somente declaracao font-size e guardas de perfil/pagina. Sem teste novo
  que apenas espelha CSS. Auditoria de hashes preserva todo codigo funcional.
- Lock inicial e nos builds web/padrao PASS:26 ativacao +27 promocao +9
  negativos. Typecheck/Vite, cap sync e Gradle assembleDebug/testDebugUnitTest
  PASS.205 testes nativos em35 suites, sem falhas/erros/skips.
- APK com.xandeflix.prebuilt1.0.29/code29, 11388899 bytes,
  SHA256168768ca3ca670296301793fec8d8d778db2b04ed453b1e17bfb999966f92c9f. Assinatura igual ao C143,
  8 assets dist byte a byte,1412 recursos nativos identicos. HTTPS standalone,
  sem server.url ou chunks web de player/cofre. Nova regra tipografica presente;
  janelas/cards C140/C142 presentes e texto intermediario C143 continua ausente.
- Baseline1163/1158 preservados: somente CSS de LiveTvPage,2 constantes Gradle
  e3 memorias append-only alterados;2 documentos novos allowlisted. HEAD/main/
  index intactos e APK C143 preservado por hash.

Distribuivel privado: tmp/c144-android-tv-live-fonts/Xandeflix-v1.0.29-C144.apk.
Logs/auditorias no mesmo diretorio ignorado. Nenhum install/reset ou acesso a
dados privados; configuracao/fontes dos aparelhos nao alteradas pelo agente.
CUA apps=[]/browsers=[]; font-size computado/renderizacao na Philips e demais
aparelhos permanecem pendentes de conferencia fisica. Auditoria de seletores
e pacote nao substitui essa verificacao. Avisos Vite preexistentes de Node
externalizado/chunks/imports mistos, sem falha de build.
Sem backend/Git/proximo Gate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
