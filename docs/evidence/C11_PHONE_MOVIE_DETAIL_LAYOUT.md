# C11 — filmes com o mesmo layout das séries em celulares — 2026-10-07

Aplicado à página interna de todos os filmes no perfil de telefone. O layout
segue a ordem apresentada na imagem de The Rookie enviada pelo usuário:
trailer no topo, título, metadados, sinopse e ações. Joderism, da outra imagem,
também foi conferido fisicamente com a nova apresentação.

## Alterações realizadas

1. MovieDetailPage usa usePhoneLayout, o mesmo discriminador das séries. Após
   resolver o filme canônico, monta PhoneMovieDetail somente no celular. O
   ramo antigo de tablet/desktop/Fire continua intacto. Resolução lazy, retry,
   callback playMovie e status de reprodução existentes foram preservados.
2. PhoneMovieDetail reutiliza a apresentação das séries: trailer horizontal
   em largura total, título abaixo, ano/classificação/duração total/gêneros
   ou categoria, sinopse sem truncamento e Assistir em toda a largura. Voltar
   e Transmitir ficam abaixo; Início permanece no cabeçalho existente.
3. O enriquecimento público para filmes usa TMDB movie/{id}, com videos e
   release_dates, após o matching conservador existente. Trailer YouTube
   validado (11 caracteres), preferência pt/en e oficial; classificação só BR,
   duração total do filme. Sem trailer, mostra imagem e mensagem específica;
   sem classificação, omite o selo. Nenhum dado é inventado nem escrito no
   catálogo. Os campos disponíveis localmente e Assistir não esperam a API.
4. A infraestrutura de séries foi estendida com opção movie e instância
   separada de cache/fila. Defaults de série continuam tv/{id} e
   content_ratings. Mantidos dedup, LRU64, TTL6h, fila32, concorrência2,
   timeout8s e pausa em 401/403/429. Effects descartam resultados tardios após
   mudança/desmontagem; enriquecimento não reinicia o foco/rolagem.
5. Avaliar, Favoritos e Compartilhar reutilizam os componentes existentes,
   com rótulos de filme. Fingerprint inclui o tipo: filme e série de mesmo
   título têm preferências independentes. Formato persistido v1 e limites
   existentes permanecem. Compartilhamento gera somente título sanitizado
   e link público TMDB movie/{id}; séries mantêm tv/{id}. Sem URL da fonte.
6. Títulos semelhantes ficam em grade de duas colunas e até 20 itens conforme
   seleção existente por gênero/categoria. Sem carrossel ou abas de episódios
   para filmes. CSS de telefone reutilizado; apenas espaçamento do bloco novo.

## Verificações

- Typecheck/build/sync/Gradle PASS; Java 130 testes,
  0 falhas/0 erros.
- Novo teste executa parsing real de filme, ID/tipo/certificação BR/runtime,
  dedup/TTL/429/credencial ausente/offline/timeout, share seguro e isolamento
  persistido filme/série. Executa o componente real para ordem dos elementos,
  callbacks Assistir/Voltar, grade, fallback, estado resolvendo e ausência
  de atualização depois da desmontagem: PASS.
- Teste existente de phone-series e regressão Fire/search (resolver serial,
  dedup/retry/tipo/quota/cancelamento) PASS. Lock canônico antes, prebuild e
  depois: invariantes estáticos, 9 negativos, 22 ativação e 27 promoção PASS.
  Ativação limpa aqui é cobertura com modelos isolados; não houve reset dos
  aparelhos existentes para simular primeira instalação.
- Revisão React da skill react-best-practices: hooks incondicionais, efeitos
  com cleanup, identidade estável/guardas para resultado tardio, acessibilidade
  dos botões/diálogo/status, limites de requests e CSS restrito ao perfil.

## Conferência física

S24 SM-S926B: A Furia do Protetor mostrou trailer carregado e reproduziu o
trailer público no mini player; ano1985, classificação18+, duração1h35min,
sinopse e ações. Largura411,43px; trailer231,43px alto; Assistir379,43px entre
padding16px; sem overflow. Grade185,71px +185,71px, 20 cards, nenhum rail.
Foco inicial no hero. Favoritos alternou e foi restaurado; avaliação abriu
diálogo correto e foi cancelada. Payload de compartilhar validado por teste;
não foi realizado envio a contatos. Cast mantém integração existente.

Joderism: mesma apresentação, ano2019/duração0h25min/sinopse local e imagem
horizontal carregada, mensagem “Trailer indisponível para este filme.”;
Assistir e grade permanecem disponíveis, sem selo de idade inventado.
The Rookie manteve layout de série, rótulo Avaliar série e abas Episódios/
Títulos semelhantes. Screenshots privados no diretório ignorado do ciclo.

Tablet SM-X610 e Fire AFTSSS: poster ao lado do hero de fundo, metadados,
ações e rail de semelhantes anteriores; novo wrapper phone ausente, sem
overflow. Fire manteve app em primeiro plano ao abrir resultado da busca.
Primeira automação foi repetida após boot/hidratação; nenhum patch para
adaptar o produto ao timing do teste. Screenshot Fire inicialmente preta:
power informava Asleep/OFF; wake e recaptura, sem alteração de política.

S24 Assistir abriu NativePlayerActivity real, bounds [0,0][3120,1440], status
e navbar ocultos; saída restaurou ambos e voltou ao detalhe no topo. Navegação
e trailer inline conservaram barras. Código Android/FIT/engine não modificado.
Disponibilidade de trailer/metadata e reprodução externa dependem do conteúdo
publicado pelos provedores; esta conferência não certifica todos os títulos.

## APK e instalação

APK [atual](../../Xandeflix-v1.0.0-standalone.apk), SHA256
**67832339D3EF71A3F57D02F1F6ACC170BFF174E6393ED4CA2C85667BFBD7CE19**, 12400179 bytes.
Standalone HTTPS sem server.url, pacote com.xandeflix.prebuilt, versionCode1/
versionName1.0/minSDK23/targetSDK35. Certificado preservado
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d. Assets6 comparados byte a byte;
bundle dist/assets/index-DTRd8jYo.js, CSS index-CCW2oeLG.css, Cast/PiP/Share e proteção
de recentes/ativação/catalogo presentes. Substitui APK9FA21110… do ciclo anterior.

| Aparelho | Privados antes/depois | Catálogo | Estado nativo | Update-r / firstInstallTime / APK |
|---|---:|---:|---:|---|
| AFTSSS | 467/467 | 436 | 5 | Sim / Sim / idêntico |
| SM-X610 | 540/540 | 505 | 5 | Sim / Sim / idêntico |
| SM-S926B | 550/550 | 508 | 5 | Sim / Sim / idêntico |

Hashes privados, preferências/WebView, identidade/chave e catálogo idênticos
imediatamente antes/depois da instalação em cada alvo. Uso posterior pode
atualizar caches, recentes e preferências normalmente. Sem nova ativação/reset.

Proveniência: baseline690 arquivos e APK anterior no diretório ignorado
tmp/c11-phone-movie-detail-20261007; allowlist/especificação em
[contrato](../architecture/C11_PHONE_MOVIE_DETAIL_LAYOUT.md). Sem backend,
dependências, commit/push/PR ou escrita no projeto histórico/original.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

Referências primárias: [TMDB Movie Details](https://developer.themoviedb.org/reference/movie-details),
[Release Dates/Certifications](https://developer.themoviedb.org/reference/movie-release-dates)
e [Videos](https://developer.themoviedb.org/reference/movie-videos).
