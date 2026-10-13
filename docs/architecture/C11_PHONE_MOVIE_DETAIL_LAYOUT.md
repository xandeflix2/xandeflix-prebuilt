# C11 — detalhes de filmes no celular como os detalhes de séries — 2026-10-07

Pedido explícito: aplicar a disposição da segunda imagem (série The Rookie)
à página interna de cada filme em celulares. Escopo exclusivo de telefone,
conforme preferência anterior do usuário. Tablet, desktop e Fire Stick
conservam a apresentação existente.

## Preflight e proveniência

Clone independente ativo `C:\Xandeflix\xandeflix-prebuilt-c11-main`, top-level
próprio, origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, branch
main, HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. AGENTS, Architecture,
Execution, Source Boundary e lock de novos dispositivos lidos. Dirty anterior
preservado pelo baseline de hashes em `tmp/c11-phone-movie-detail-20261007`.
Lock obrigatório PASS antes de editar. CURRENT_GATE=NONE; ciclo local explícito;
NEXT_GATE_STARTED=NAO. Sem commit/push/PR, backend ou edição do projeto original.
APK e atualização in-place dos três dispositivos permanecem autorizados.

## Especificação anterior ao código e allowlist estrita

- `src/ui/pages/MovieDetailPage.tsx`: usar o mesmo perfil de telefone das séries;
  selecionar o novo componente somente nesse perfil. Preservar resolução local,
  retry, callback de reprodução canônico e ramo de tablet/TV.
- Novo `src/ui/components/PhoneMovieDetail.tsx`: trailer horizontal ocupando o
  topo, título, ano/classificação BR/duração total/gêneros ou categorias, sinopse,
  Assistir em toda a largura, Voltar/Transmitir, Avaliar/Favoritos/Compartilhar
  e títulos semelhantes em grade de duas colunas. Sem abas de episódios para
  filmes. Cabeçalho já oferece Início e Voltar; não duplicar Início no corpo.
- `src/artwork/series-presentation.service.ts`: estender a infraestrutura pública
  existente, com instância/cache separados por tipo. Filmes usam `/movie/{id}`
  com `videos,release_dates`, runtime total e certificação BR; séries continuam
  usando `/tv/{id}` e `videos,content_ratings`. Matching conservador existente.
  Sem dados falsos: ausência de trailer/classificação não impede assistir.
  Limites existentes: duas requisições simultâneas, 32 pendentes, LRU64,
  TTL6h, timeout8s e pausa em 401/403/429. Não baixar vídeo pela API TMDB.
- `SeriesTrailer.tsx`, `SeriesPersonalActions.tsx`, `src/ui/share-series.ts`:
  reutilizar componentes sem renomeação/refatoração estrutural, com tipo de
  conteúdo explícito quando necessário. Rótulos de filme e link público
  `/movie/{id}`; série mantém defaults. Preferências já usam fingerprint com
  tipo, sem credenciais/URL da fonte e sem alterar o formato persistido.
- `src/index.css`: adicionar apenas seletor do novo wrapper e espaçamento do
  bloco de semelhantes, reutilizando estilos de telefone existentes.
- Novo `scripts/test-c11-phone-movie-detail.mjs`: cobertura de parsing público,
  tipos isolados, falhas/timeout/cache, link público seguro, perfil phone-only.
- Este contrato, evidência correspondente, quatro memórias e relatório geral
  append-only; harnesses ignorados; saídas usuais dist/Android/APK.

Sem mudança em fonte, catálogo, search, ativação, chave permanente, C9/licença,
storage canônico, plugins Android, engine, Cast, PiP ou barras do sistema.

## Aceitação

Build/typecheck, teste de séries existente, novo teste e lock PASS. APK com
package/assinatura anteriores e assets conferidos. Conferir no S24 a ordem dos
campos, largura do trailer/Assistir, grade duas colunas, carregamento opcional,
ações e player; no tablet/Fire, confirmar layout anterior. install -r com
hashes privados e firstInstallTime preservados. Barras visíveis na navegação,
ocultas apenas no player fullscreen, proporção original FIT preservada.
Documentar disponibilidade real do trailer e limites de conferência física.

Referências primárias consultadas: [TMDB Movie Details](https://developer.themoviedb.org/reference/movie-details),
[Release Dates/Certifications](https://developer.themoviedb.org/reference/movie-release-dates)
e [Videos](https://developer.themoviedb.org/reference/movie-videos).
