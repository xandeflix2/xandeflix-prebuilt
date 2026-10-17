# C123 — favoritos unificados — 2026-10-15

Pedido explícito e spec anterior ao código em C11_UNIFIED_FAVORITES.
Preflight: clone ativo C11-main, main/origin canônicos, HEAD
0f68f169f7728fae17c8311832b7643629e97a02; contratos/lock/source boundary lidos.
Baseline1058 arquivos após C122. CURRENT_GATE=NONE;
CURRENT_LOCAL_CYCLE=C123_UNIFIED_FAVORITES; NEXT_GATE_STARTED=NAO.
Sem instalação, reset, Git, backend, publicação ou mudanças de autoridade.

## Implementação

- Botões existentes de filme/série mantêm store local v1, ratings e dados já
  salvos. Store oferece lista e assinatura, com hint kind/ID sanitizado para
  resolver item local fora do first-fold. Nenhum título, URL, stream ou segredo
  adicionado à persistência. Limites anteriores256/64KiB e RAM fallback intactos.
- Uma faixa Favoritos mista na Home, até20 capas, com Ver todos para coleção
  única até256. Cartão abre detalhes por tipo. MediaRail recebe getItemKey
  opcional com default intacto; Favoritos usa kind:id na faixa/grid para evitar
  colisão de ID entre filme e série. Outros rails e rotas App não alterados.
- Resolução imediata em RAM e complementar assíncrona local por hint/fingerprint
  e segmentos, incluindo preferências antigas e M3U reordenado. Um segmento de
  cada vez, yield200/AbortSignal/generation; sem baixar catálogo/fonte/TMDB,
  persistir catálogo, criar índice global ou bloquear hero/boot. Conteúdo ausente
  não é inventado; política adulta de apresentação mantida. Loading inicial
  evita falso vazio antes da consulta; erro oferece retry.
- Categoria virtual Favoritos no topo de Live, também no seletor quadrado/
  dobrável e navegação mobile. Store Live anterior por fonte preservado, até200
  fingerprints. Somente metadados locais em páginas48, coleção bounded e lista
  virtual contínua atual; sem abrir/preparar vídeo adicional. Grupos reais e
  totais canônicos não são alterados; rótulo de categorias inclui a opção extra.
- Botão Favoritar/Favorito web acessível e ações nativas existentes usam o mesmo
  toggle. Remoção atualiza lista sem trocar canal ativo/C9. Versão da lista
  associa snapshot/scope/keys e impede reutilizar janela de favoritos antigos
  durante reload, inclusive remoção do último item. Retorno fullscreen preserva
  foco na categoria virtual, com página/filtro compatíveis.

## Validação final

- scripts/test-c123-favorites.mjs:11 grupos PASS. Mistura/persistência/restart,
  remoção/rating preservado, assinatura/unsubscribe, schema antigo, hints
  allowlist/cópia defensiva, RAM fallback, limites, resolução fora do first-fold,
  M3U reordenado, ausência/adulto/dedup, cancelamento/geração/I/O inválido e
  primeiro render pendente sem falso vazio. Live155 favoritos através de grupos,
  paginação contínua48/filtro final, persistência/isolamento de fonte/remoção,
  aborto/geração/limite/dedup; sem resolver stream ou fazer rede.
- Browser com React/HomePage/HomeCollectionPage/SeriesPersonalActions/
  FavoriteTitles/MediaRail/MediaCard/LiveTvPage/ContinuousLiveChannelList reais:
  três grupos PASS. Oito perfis PHONE/FOLDABLE/TABLET/FIRE_TV/ANDROID_TV/
  ANDROID_BOX/TIZEN/WEBOS: adicionar dois tipos com mesmo ID, única faixa,
  Ver todos, navegação tipo correto, remover, reload; Favoritos primeira categoria
  ou seletor quadrado, toggle/remove último sem restart/troca de mídia/C9.
  Caso155 alcança última página/canal, filtro, ação nativa, fullscreen/foco e
  isolamento de outra fonte. Nenhuma requisição externa/erro de console.
  Capas/hero/EPG/source/bridge/C9 controlados; não é homologação de hardware ou
  reprodução real. Prévias phone com favorito restante e Fire com filtro214
  inspecionadas, sem cortes nos controles adicionados.
- Regressões PASS: detalhes movie phone3, series phone2, tablet/TV7;
  coleções especiais3, ordem browse4, categorias7, Home/aviso2, episódios15;
  lista contínua6, controles Live7, retorno de catálogo11, foco fullscreen10,
  rotação de destaques6. Harnesses antigos receberam bindings das portas atuais;
  assert de props do BrowseHero antigo foi atualizado para modelo/tipo atuais,
  mantendo teste da seleção real no hook imediatamente seguinte. Nenhuma lógica
  de produção modificada para contornar falha de fixture.
- Revisão React: hooks incondicionais, cleanup de timers/listeners/subscriptions
  e AbortController; resposta tardia não altera outra geração/categoria. Nenhuma
  dependência nova/SDK/fetch remoto. Chaves mistas estáveis, aria-pressed/labels,
  ações focáveis, rolagem bounded. Default MediaRail/CatalogGrid preservados.
- Typecheck, build com lock inicial/final26+27+9, Capacitor sync e Gradle
  assembleDebug PASS. Avisos Vite node modules/imports/chunks e flatDir anteriores
  permanecem. Sete assets dist por hash, HTTPS local/logging none/sem dev server,
  certificado/package/versão conferidos.12 DEX e1410 recursos nativos idênticos
  ao C122: player nativo, identidade e branding preservados.

## Falhas encontradas e corrigidas

Primeiro ensaio Live reproduziu linha fantasma depois de remover último favorito:
cache da janela podia receber seed antigo antes do effect. Gate de versão de
dados prontos corrigiu o caso, mantendo a lista normal intacta. Nova rodada
integral passou, incluindo remoção por ação nativa com filtro e retorno de foco.
Revisão encontrou mensagem vazia transitória no primeiro render da coleção;
loading inicial e teste específico corrigiram a apresentação pendente.

Harnesses históricos falharam por imports adicionados antes deste ciclo
(useHeroPlayback/BrowseHero/rotation/startup/retorno/portas de suporte) e modelo
simulado sem categoryLabels. Atualizados só bindings/representação, preservando
asserts semânticos. Extrator de requestGroupPage recebeu constantes/helper novos.
Helper browser teve ciclo fixture/bridge inicializado antes do estado, URL
sintética ausente no stub e seletores mal escapados; corrigidos apenas no helper.
Novo teste de primeiro render colidiu alias fs com fingerprint de série; renomeado
import e11 grupos completos passaram. Auditoria inicialmente desativou
core.autocrlf só no comando de diff, tratando CRLF nativo antigo como whitespace;
repetida com configuração Git normal, sem normalizar arquivos anteriores.
Nenhuma falha técnica pendente.

## Entrega

tmp/c123-unified-favorites/Xandeflix-v1.0.19-C123.apk — 12.708.979 bytes.
SHA256 1af324b08edb372508730de6f989a0c3fab4b992e868b391cf1d37883e81e491.
com.xandeflix.prebuilt, code19/name1.0.19, min23/target35; mesma assinatura de
C122, APK anterior preservado e hash conferido. Sem instalação automática.
Favoritos permanecem neste aparelho; não há sincronização de preferências remota.
QA física e pacotes nativos Tizen/webOS não certificados pelo teste de perfis.

Auditoria final:20 existentes na allowlist (11 produção,6 harnesses,3 memórias
append-only), seis arquivos novos (três módulos, teste, spec/evidência), demais
hashes e HEAD preservados. Relatórios/helpers/capturas privados em
tmp/c123-unified-favorites. Nenhum próximo Gate iniciado.
