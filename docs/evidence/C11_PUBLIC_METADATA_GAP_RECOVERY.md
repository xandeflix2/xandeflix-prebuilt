# C11 — Recuperação de metadados públicos e prioridade das capas da fonte

## Proveniência e escopo

Ciclo62, autorizado diretamente pelo usuário em2026-10-10; CURRENT_GATE=NONE,
NEXT_GATE_STARTED=NAO. Clone independente
`C:\Xandeflix\xandeflix-prebuilt-c11-main`, main, origin canônico
`https://github.com/xandeflix2/xandeflix-prebuilt.git`, HEAD
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. Preflight obrigatório, AGENTS,
Architecture, Execution, Source Data Boundary e Activation Lock cumpridos.
Spec anterior ao código em
[C11_PUBLIC_METADATA_GAP_RECOVERY.md](../architecture/C11_PUBLIC_METADATA_GAP_RECOVERY.md).
Baseline776 arquivos e allowlist própria; nenhum Git write, backend/env/source
delivery/reset/rotação de identidade ou acesso ao projeto protegido.

Usuário esclareceu que a fonte frequentemente não fornece ano/ID e solicitou
usar suas capas, com API para dados complementares. Poster da fonte permanece
prioritário. O código é genérico: nenhum ID/ano dos exemplos foi fixado em produção.
Poster, fonte e streams não são enviados a outro serviço para identificação.

## Fonte real e causa

Auditoria read-only dos segmentos locais ativos do tablet SM-X610:17152 filmes.
Todos têm referência de poster; todos apresentam backdrop igual ao poster
vertical. Campos próprios year/overview/TMDBID ausentes nos17152 registros,
embora alguns títulos contenham ano no próprio nome. Isto descreve a fonte,
não a ausência de overlay do TMDB na UI. Não prova disponibilidade HTTP de todas
as capas. Não houve import forçado, promoção ou varredura do catálogo na API.

Os seis nomes fornecidos têm sete registros porque há dois O Matador. As sete
capas estão acessíveis, HTTP200/imagem. A fonte desses registros não contém
sinopse, duração, título original, ano/ID ou trailer. Busca TMDB HTTP200 contém
homônimos reais; rejeição conservadora somente por nome e composição traduzido
+ original impediam o enriquecimento. Quatro capas re-hospedadas preservam
filename oficial. Duas variantes antigas permitem confirmar a obra por pixels.

| Registro da fonte | Obra confirmada no TMDB | Ano |
| --- | --- | --- |
| Ataque Terrorista |655302 — Omerta6/12 |2021 |
| Rastro Mortal |565214 — The Tracker |2019 |
| O Matador |10835 — 喋血雙雄 |1989 |
| Alvo Duplo |70074 — Bullet to the Head |2012 |
| O Matador |9515 — The Matador |2005 |
| Círculo de Fogo - Pacific Rim |68726 — Pacific Rim |2013 |
| Círculo de Fogo |853 — Enemy at the Gates |2001 |

Ano da tabela é o da resposta TMDB. Todos os sete têm sinopse, backdrop e trailer
YouTube retornados pela API. Segredos/URLs de fonte não constam da evidência;
referências completas e imagens são usadas somente no runtime privado autorizado.

## Patch mínimo

- Composição exata de título traduzido e original, nos dois sentidos e com
  hífen/traço espaçado. Não basta remover uma metade; ano/tipo/ambiguidade continuam
  sendo validados.
- Filename re-hospedado é apenas hint:27 caracteres alfanuméricos, sem query ou
  credenciais e diferente de digest hexadecimal. Título forte e imagem oficial
  do candidato precisam confirmar o hint; URI original continua na capa.
- Homônimos sem filename/ID: comparação local estrita da mesma capa com até6
  candidatos fortes e8 variantes oficiais w92 por candidato. RGB24x36, MAE<=10,
  MSE<=225, diferença>24 em no máximo12% dos canais, variância>=484, proporção
  0.5..0.8 e diferença de proporção<=.025. Blank, falha de leitura/CORS, imagem
  parcialmente substituída e duas obras com a mesma capa são rejeitados.
- Transporte/cache nativo existente; comparação limitada a16s, dois samples por
  batch, cache96 samples em RAM e fila de imagens existente. Cache de metadados
 512, deduplicação e concorrência2/TTLs/cooldowns mantidos. Falha transitória não
  se torna negativo24h. `sourcePosterUri` não é persistida no mapping público.
- Chave match6 distingue capas de homônimos com hash opaco. Negativos antigos
  não bloqueiam nova resolução; mappings antigos somente por nome não são
  reutilizados para fonte sem evidência de filename/ID. Positivos antigos seguros
  e chave de ID explícito permanecem compatíveis.
- Identidade completa propagada para metadata, hero, capas e trailer. Layout,
  foco, playback, source refresh, classificação e inventário de selos mantidos.

Não é comparação semântica/IA de imagens. Outro poster da mesma obra, watermark,
capa inválida ou obra ambígua pode continuar sem match; a capa da fonte permanece
disponível se o transporte a decodificar. Browser comum sem CORS pode rejeitar
comparação; a leitura local pelo cache Android foi validada fisicamente no tablet.

## Conferência ampliada

Após pedido do usuário, foram selecionados12 títulos adicionais de forma
determinística, entre15315 registros elegíveis de categorias não adultas, em
posições distribuídas do catálogo. Não há download/consulta de todos os17152
filmes. Todos os12 posters da fonte decodificaram no tablet.

Primeira execução:11/12 metadados recuperados. Para Sempre Cinderela [L] falhou
porque L permanecia no título normalizado. Novo critério foi registrado antes do
fix: retirar somente sufixo literal [L] precedido de espaço, final ou antes do
ano19xx/20xx. L isolado/sem colchetes, tag no meio e título legítimo [REC] preservados;
nome/classificação do catálogo não mudam. Chave resultante diferente permite nova
resolução sem limpar cache. Teste novo falhou antes e passou depois; serviço com
API real confirmou9454/1998, sinopse e backdrop, HTTP200/query normalizada.

| Amostra adicional | ID TMDB identificado | Trailer na API avaliada |
| --- | --- | --- |
| Acampamento Intergaláctico |1006381 |Ausente |
| Prazeres Mortais |72784 |Disponível |
| Voo Mortal |700179 |Disponível |
| Macho Alfa |991565 |Ausente |
| Altos Negocios |658751 |Disponível |
| Conduzindo Miss Daisy |403 |Disponível |
| Atlantique |496967 |Disponível |
| O Misterio de Block Island |731740 |Disponível |
| Para Sempre Cinderela [L] |9454 |Disponível após fix[L] |
| Tubarao Branco: Sangue no Mar (2024) |1326790 |Ausente |
| Para Aqueles que Amamos |1009784 |Disponível |
| Charlie: O Super Cão (2025) |1276521 |Disponível |

Ausência de trailer nos IDs1006381/991565/1326790 confirmada em chamadas públicas
pt/en/null e língua original. Não há novo fornecedor integrado nem vídeo inventado.
Acampamento tem backdrop na API; primeira medição UI antecipou a troca da imagem,
portanto a conferência final espera decodificação horizontal antes de concluir.

## Verificação de código, API e UI

- Nova suite6 grupos PASS, incluindo composição, hints, sufixo[L], negativos,
  transporte transitório, dois homônimos/cache e pixels/variantes limitadas.
  Aliases3 grupos, metadata recovery4 grupos e TypeScript PASS depois do último fix.
- Phone movie3/series2 e hero eligibility1 grupos PASS na primeira revisão.
  React: dependências primitivas completas, cleanup de efeito e identidade
  consistentes, sem alteração de layout/foco ou nova persistência React.
- Suites históricas source-first8 grupos de serviço PASS, visible-recovery2
  e startup1 de serviço PASS. Loaders isolados TSX antigos não fornecem ports
  artwork-file-cache/NewContentProvider atuais; não houve PASS integral dessas
  suites nem relaxamento de assertions para ocultar a incompatibilidade.
- Browser isolado com serviço/API TMDB reais e sete capas locais:7/7 identidades,
  dados e trailers PASS; duplicidade de poster rejeitada. Componentes/CSS reais
  nos perfis412x915,1280x800,960x540: sinopse/trailer/backdrop, sem erros JS.
  Cache nativo modelado com transporte local de miniaturas públicas TMDB; nenhuma
  fonte/proxy de stream em backend. Phone usa preview horizontal já existente;
  tablet/Fire profile apresentam poster da fonte. Isto é QA de perfil, não Fire físico.
- Tablet com APK inicial:7/7 páginas reais, fonte-poster decodificado, sinopse,
  ano correto, mapping match6/ID esperado, backdrop horizontal e ações pessoais.
 7/7 trailers resolvidos em modal aberto/fechado. Matador2005 confirmou comparação
  pelo cache nativo (~9062ms) e Círculo2001 (~7456ms); tempos são observações, não SLA.
  Sem reprodução de conteúdo da fonte. Disponibilidade de trailer/modal não
  certifica reprodução integral do YouTube. Uma desconexão WebView foi superada
  após retorno do próprio aplicativo ao primeiro plano; nenhum unlock de OS.
- Lock22+27+9 controles PASS novamente no build final. Vite/Capacitor sync/Gradle
  assembleDebug/testDebugUnitTest PASS.148 testes Java, zero failures/errors;
  classes nativas sem mudança neste ciclo, tarefa Java final UP-TO-DATE.

## Artefatos e instalações

APK final `Xandeflix-v1.0-build4-standalone.apk`,11076226 bytes, code4/name1.0,
package `com.xandeflix.prebuilt`, SHA256
`D41E0B6A8F54B22CBCE43F867005A23A867BE34B15A0DCF90A145BF7B2B66CEF`.
Bundle `index-Copzy1G4.js`, CSS `index-B5U9QEDx.css`, comparação dinâmica
`poster-identity-BpOb-aHp.js`. Sete assets finais conferidos no APK, HTTPS localhost
sem serverURL e certificado anterior
`b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.
Marcadores de continuidade, D-pad, relatórios, refresh automático e episódios/selos
dos ciclos anteriores presentes. Nenhum mecanismo OTA novo foi criado.

Revisão inicial SHA B875C68E9975E2D3BB104B4FCD6A93471EBAA43A6493DFFCD600802C3C6BDC7E
instalada antes da ampliação: tablet974/925/5 arquivos total/catálogo/nativo em
09:30:39.364Z, S24976/928/5 em09:31:45.754Z, Fire1 AFTSSS1118/1066/5 em09:33:14.386Z.
Hash instalado, firstInstallTime e todos os grupos privados byte-idênticos;
sem reset/desinstalação/abertura automática. Depois o usuário suspendeu testes
Fire: nenhuma interação/QA físico adicional nele, Fire2/S23 excluídos.

Revisão final install-r/hash/firstInstallTime/todos os grupos privados byte-idênticos:
tablet971/925/5 em2026-10-10T10:24:36.111Z, S24976/928/5 em10:25:48.806Z.
Sem abertura automática/reset/desinstalação. Tablet reaberto somente para QA
autorizada, bundle final index-Copzy1G4.js confirmado. Fire1 permanece na revisão
inicial B875 deste ciclo; não recebeu o ajuste posterior[L]. Atualização final e
QA nele ficam fora da rodada suspensa pelo usuário. S24 com tela apagada e fora
do Xandeflix; pedido de disponibilidade pendente, sem desbloqueio/QA visual alegada.

## Fechamento físico e proveniência

Tablet final: sete exemplos e12 adicionais repetidos,19/19 source-posters,
sinopses/metadados e backdrops horizontais decodificados. Sete IDs/anos esperados
dos exemplos mantidos após restart/cachepersistido. Para Sempre Cinderela [L]
confirmado9454/1998, overview/backdrop/trailer, fonte-poster preservado; não mais
negativo no mapping. Acampamento backdrop horizontal confirmado após espera de
decodificação, não há defeito de produção nessa primeira observação antecipada.
16/19 trailers encontrados,19 modais abertos/fechados; três ausências na API
registradas acima. Página final Charlie:9/9 imagens montadas visíveis decodificadas,
zero waiting/failed. Screenshots próprios Matador2005/Cinderela mostram os dados
e layout arredondado; fonte URI nunca exportada em relatório. Navegação de QA usa
handler de seleção real e entidade lida do catálogo ativo, sem fixture de dados
injetada no read model. Não inicia stream, não certifica YouTube/playback integral.

Auditoria final: baseline776,755 arquivos fora da allowlist preservados,
zero alterações não autorizadas, HEAD igual. Servidor Vite privado encerrado;
forward CDP9675 próprio removido, sem tocar forwards/aplicativos de terceiros.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; Git writes=NAO.

## APIs complementares e limites

Documentação primária avaliada:
[TMDB Images](https://developer.themoviedb.org/reference/movie-images),
[idiomas de imagens](https://developer.themoviedb.org/docs/image-languages),
[Fanart API](https://api.fanart.tv/) e
[OMDb](https://www.omdbapi.com/).
Fanart oferece artwork e requer chave/identidade; OMDb requer chave/IMDb ou
identificação por título/ano e não fornece trailers. Chave Fanart não configurada.
Nenhuma conta/chave/assinatura foi criada, segredo exposto ou .env editado.
Outro fornecedor sozinho não resolve a identificação de homônimos, e não é
necessário para recuperar os materiais presentes no TMDB nos sete exemplos.

Não há afirmação de cobertura100%/todas as URLs de capas acessíveis, todos os
filmes vistos, playback/AirScreen corrigido ou Tizen/webOS fisicamente testados.
Limites anteriores de Luke Cage/AirScreen permanecem fora do ciclo62.
Artefatos de QA/provenance ficam ignorados em
`tmp/c11-public-metadata-gaps-20261010`; não contêm streams/credenciais em relatórios.

## Entrega final autorizada no Fire Stick1 — 2026-10-10

Após o fechamento anterior, usuário solicitou instalar no Fire Stick. Emenda
prévia na spec autoriza somente atualização final, mantendo QA físico suspenso.
Alvo confirmado AFTSSS/API28, serial G071EL13142513WK,192.168.3.126:5555,
user0/package com.xandeflix.prebuilt existente; sem NativePlayerActivity em foco.
Lock22 ativação+27 promoção+9 controles negativos PASS antes da entrega. APK
final existente D41E0B6A8F54B22CBCE43F867005A23A867BE34B15A0DCF90A145BF7B2B66CEF
conferido localmente e após install -r no aparelho, code4/name1.0,11076226 bytes.

Entrega verificada em2026-10-10T10:41:36.484Z. Comparação quiescente antes/depois:
1118 arquivos privados,1066 de catálogo e5 de estado nativo; todos os grupos
catalog/native/preferences/webview/other byte-idênticos, diferenças0 e
firstInstallTime preservado. Nenhum uninstall/reset/rotação ou abertura automática;
nenhuma interação com outro app, QA de interface ou reprodução nesta entrega.
Registro inicial B875 preservado como firestick-install-initial.json; registro
final firestick-install.json no diretório privado ignorado. Fire1 agora recebeu
o ajuste[L] e a mesma revisão final do tablet/S24, substituindo somente o estado
anterior de entrega pendente. Limites de QA/playback e exclusão Fire2/S23 mantidos.
Sem rebuild, patch funcional, backend/env/Git ou novo Gate.
