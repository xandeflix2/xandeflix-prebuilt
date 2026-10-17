# C121 — gêneros dos detalhes e logos mobile — 2026-10-15

[Especificação prévia](../architecture/C11_DETAIL_GENRES_AND_INLINE_PROVIDERS.md).
Preflight clone C11-main/main/origin esperados, HEAD
0f68f169f7728fae17c8311832b7643629e97a02; baseline1046 arquivos.
Contratos/Source Boundary/lock lidos, patches C107–C120 preservados.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset.

Geral era considerado gênero suficiente pelo teste de length nas páginas,
impedindo enriquecimento e vencendo até gêneros TMDB disponíveis. Helper de
apresentação filtra Geral/vazios/duplicatas sem mutar dados. Gênero local real
continua prioritário; caso ausente usa enriquecimento já existente, com
matching/cache/limites originais. Sem informação confiável, omite gênero e
não usa categorias/plataformas em seu lugar. Nenhuma alteração de source,
catálogo persistido, import, busca, APIs, identidade, ativação ou playback.

Lógica compartilhada dos detalhes corrige os oito modelos cadastrados:
PHONE/FOLDABLE/TABLET/FIRE_TV/ANDROID_TV (Google TV)/ANDROID_BOX/TIZEN/WEBOS.
Usuário confirmou logos abaixo do poster no tablet/TV, inline somente mobile.
Phones mostram ano/classificação conhecida/duração/logos24px na mesma linha;
faixa local rolável preserva até16 plataformas sem overflow global. Contagem
de episódios/classificação ausente/gêneros ficam abaixo, informações mantidas.
Modo padrão WatchProviders/deduplicação/serviço preservados. Sem logos acima
do título no phone; nenhuma mudança no hero da Home ou no menu flutuante.

## Validação

- C1219 grupos PASS: helper e páginas reais de filme/série em oito modelos,
  Geral com outros campos completos solicita enriquecimento, metadata real
  aparece, gênero local prevalece e ausência fica vazia. Arrays imutáveis.
- Browser com páginas/PhoneMovieDetail/PhoneSeriesDetail/WatchProviders/CSS
  reais, portas públicas controladas:3 grupos PASS.16 casos phone (320/390/
  430/600, movie/series,2/16 logos) e14 casos adicionais de modelos/tipos;
  alinhamento geométrico, rolagem de logos, gênero Ação/Drama, contagem e
  logos sob poster tablet/TV. Ausência opcional preserva Assistir filme/episódio.
  Capturas phone-movie/phone-series-many/tablet-movie inspecionadas. Fixtures
  usam imagens/metadados sintéticos, não reprodução ou API comercial real.
- Regressões detalhes tablet/TV7, movie phone3, series phone2, providers10 e
  pending playback5 PASS. Fixture antiga usa agora Ação em genreLabels e
  Lançamentos em categoryLabels, mantendo as assertions existentes. Somente
  binding de helper novo no outro harness, sem relaxar assertions.
- Primeiro build da fixture faltava resolveDir para React nas portas esbuild;
  corrigido só no helper privado. Cenário sem metadata inicialmente ainda
  devolvia classificação pelo stub de apresentação; alinhado stub ao cenário
  e repetido browser integral, sem alterar produção para aceitar o teste.
- Revisão React: hooks não condicionais, mesmos guards/cleanup e dependências
  escalares dos serviços; sem novos fetch/SDK/cache, dados não mutados. Logos
  mantêm alt/agrupamento, rolagem focável e contorno de foco. Alterações CSS
  restritas ao modo inline e linha phone, modo padrão tablet/TV intacto.
- TypeScript e build PASS; lock inicial/prebuild26+27+9 PASS; Capacitor sync,
  Gradle assembleDebug e7 assets/certificado PASS. Avisos prévios Vite Node/
  chunks/imports e Gradle flatDir mantidos. Sem novas falhas técnicas.

APK intermediário local recuperável:
tmp/c121-detail-genres-mobile-providers/Xandeflix-v1.0.19-C121.apk,
11.447.784 bytes; SHA256
7b77e6fd8609ad5ea05aeb57b5ccd51343b6b1a4fb488bd7a50658c9f59533f4.
Package com.xandeflix.prebuilt, code19/name1.0.19, min23/target35, HTTPS local,
sem dev server/logging none, mesma assinatura; C120 preservado e conferido.
Sem instalação/publicação. QA física dos modelos e app nativo Samsung/LG não
certificada por mocks. Pedido posterior de ícone será ciclo local separado,
com novo baseline/spec; C121 concluído antes de editar recursos do launcher.
