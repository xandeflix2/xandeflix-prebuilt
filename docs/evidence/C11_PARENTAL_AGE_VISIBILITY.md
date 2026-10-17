# C128 — exibição conforme faixa parental — 2026-10-16

Pedido explícito: iniciar implantação para ocultar conteúdos acima da faixa
parental e manter PIN para conteúdos sem classificação. Spec anterior ao código
em C11_PARENTAL_AGE_VISIBILITY, emenda comportamental do C126. C127 (investigação
web) encerrado e preservado; não implementado suporte web neste ciclo.

Preflight no clone independente C11-main/main/origin esperado, HEAD
0f68f169f7728fae17c8311832b7643629e97a02; AGENTS/Architecture/Execution/Source
Boundary/Activation Lock lidos. Baseline1090 e prefixos das memórias capturados
em tmp/c128-parental-visibility. CURRENT_GATE=NONE; ciclo local C128 autorizado.
Não autoriza Git/backend/instalação/reset ou qualquer novo Gate.

## Comportamento entregue

- Limite inclusivo. Com12: L/10/12 visíveis; 14/16/18 ocultos da Home, heros,
  categorias/ver todos, busca, favoritos, semelhantes e Live. O maior valor
  conhecido da fonte, regra manual e TMDB validado prevalece; não se altera
  catálogo, índice ou a classificação original. Sem perfil configurado,
  mantém a apresentação anterior de conteúdos comuns e adulto oculto.
- Sem classificação: capa visível, mas detalhes/trailer/player dependem do PIN.
  Uma classificação obtida depois pode retirar o título. Link direto ou grant
  anterior de título desconhecido não permite acesso acima do limite; idade
  acima do teto é negada sem abrir prompt. Responsável pode mudar o limite na
  administração protegida por PIN. Regra manual Sempre exigir PIN continua
  valendo para títulos dentro da faixa.
- Adulto explícito implica mínimo18. Exige teto18 + opt-in + sessão por PIN;
  PIN não contorna teto inferior. Formulário só oferece liberar sessão quando
  o limite salvo for18. PIN por título e prazo da sessão C126 preservados.
  Editor parental autenticado pode pesquisar capas ocultas e editar regras,
  sem abrir vídeos. Conhecer o PIN não permite trocar o PUK sem o PUK atual.
- Cards observam a visibilidade já existente (300ms); somente com controle
  ativo e classificação desconhecida consultam a apresentação TMDB existente.
  Hero atual também consulta. Não há scan remoto de todo o catálogo ou mudança
  de matching/API. Fila/cache/timeout públicos existentes preservados: duas
  requisições ativas, até32 pendentes, cache64/6h, timeout8s. Overlay RAM de até
  512 chaves derivadas/idades; não vai para o registro cifrado de PIN/PUK.
  Ausência/falha/expiração/evicção de metadata mantém o tratamento desconhecido
  com PIN. Nenhuma nova chamada de classificação com controle não configurado.
- Notificação de idade pública atualizada em cache também cobre metadata que
  chega pelos detalhes/trailer existentes. Revisa a exibição sem esperar outro
  clique. Não altera revisão de conteúdo Live por idade de VOD. Atualização de
  outro título não desmonta detalhes já abertos; a versão do gate deriva da
  idade do título atual. Grants de desconhecidos são retirados ao registrar
  idade acima do teto. Hook ignora conclusão após sua limpeza.
- HomeHero invalida opções memoizadas quando elegibilidade muda, mesmo sem
  novo download. Janela contínua Live usa escopo parental para não reter páginas
  da política anterior; com controle ativo lê a página local filtrada, sem seed
  antigo. Favoritos e dados enviados ao painel nativo são filtrados novamente.
  Não há nova conexão de prefetch, alteração do player Java ou mecanismo de
  gestos/rolagem. Totais canônicos podem incluir conteúdos ocultos.

PIN/PUK, regras, escolha de idade e associações locais não são enviados a
Supabase/gestor. Cofre Android, backup, identidade, ativação, C9 e formato do
registro parental não foram alterados. Atualização in-place não exige novo
perfil/PIN/PUK; não foi feita limpeza ou instalação em nenhum aparelho.

## Verificação e limites

- C128:11 grupos PASS. Matriz inclusiva L–18 e desconhecidos nos dois kinds,
  padrão sem perfil/adulto, grant não contorna idade aprendida, regra manual
  imutável/semprePIN, cache TMDB por kind/ID, overlay512 e ausência de escrita,
  Live filtrado/imutável, adulto18+sessão, hook fora da viewport/desabilitado/
  conhecido/cleanup, HomeHero atualiza opção sem novo download, PlaybackService
  real para desconhecido antes de C9/player, notificação de cache público sem
  revisão Live e sem nova notificação em cache hit. Somente dados sintéticos.
- C126:16 grupos PASS, mantendo PIN/PUK/cooldown/recuperação/corrupção/admin/
  cancelamento/abort. As duas expectativas antigas de idade acima do teto
  foram adaptadas pela emenda: cancelamento testado com desconhecido e
  reprodução18 agora negada imediatamente sem prompt/C9/player. Nova suite
  C128 prova também desconhecido real exigindo PIN antes desses caminhos.
- Regressões PASS: C1259, C1068, C10711, home-hero, category-rails,
  detail-tablet-tv, search-details-related, startup-artwork, C9 wiring10,
  C1056, C12410, C11410 e C12311. Novo hook tem binding sem perfil nos harnesses
  legados, sem relaxar asserções de ativação/autoridade/foco/gestos.
- Revisão React aplicada: hooks incondicionais, condições baratas antes de
  rede, dependências primitivas, limpeza de efeitos, cache limitado, estados
  derivados de elegibilidade e separação entre revisão de metadata e Live.

Perfis geométricos não certificam aparelhos, Keystore real, fonte/TMDB reais,
performance de KDF/rede ou pacotes Samsung/LG. O catálogo comum com idade ainda
desconhecida pode aparecer antes do complemento TMDB, permanecendo protegido
por PIN. Não é promessa de cobertura de classificação para toda a fonte.
PHYSICAL_QA=NOT_EXECUTED; NEXT_GATE_STARTED=NAO.


Browser privado final:10 relatórios PASS nos oito perfis PHONE390x844,
FOLDABLE800x880, TABLET1280x800, FIRE_TV960x540, ANDROID_TV1280x720,
ANDROID_BOX960x540, TIZEN1280x720 e WEBOS1280x720. UI/store/crypto/hero/grade
reais com portas de fonte/search/native isoladas. Filme16/série18 ocultos,
série12 visível, link direto negado sem prompt, desconhecido com PIN,
editor autenticado, regra manual/PIN/cancelamento, metadata tardia retira
capa/dot sem desmontar detalhe de outro título, limite Live18 revela canal16
e voltar12 o remove da janela ativa, adulto exige teto18 e sessão. PUK
recupera PIN sem perder regra; relock esconde Home/busca Live. Zero requests
externos/erros JS; nenhuma certificação de hardware ou source real.

## APK final e auditoria

Typecheck/build Vite560 módulos PASS. Lock inicial e final/prebuild:
26 ativação +27 promoção +9 controles negativos PASS. cap sync android e
Gradle assembleDebug finais PASS depois do último patch. Builds preliminares
foram refeitos após a revisão de adulto18 e atualização de cache público.
Avisos anteriores Vite node:fs/path, dynamic/static/chunk grande e Gradle
flatDir mantidos. Nenhuma dependência nova, mudança Java ou migração de dados.

APK tmp/c128-parental-visibility/Xandeflix-v1.0.19-C128.apk,
12709074 bytes; SHA256 9f2751fc650091def45ea335f3035205f322b87de64e82b82831ed00806d868e.
Package com.xandeflix.prebuilt/code19/name1.0.19/min23/target35; mesmo certificado
C126, oito arquivos dist conferidos por hash, HTTPS localhost/logging none/sem
dev server. 12 DEX e1412 recursos nativos idênticos ao C126; plugin parental
continua empacotado, fixture PUK não incluída no JS público. C126 preservado.
É build debug local de teste; não instalado nem publicado.

Auditoria final baseline1090:17 existentes autorizados (inclui três memórias
append-only), quatro novos (hook, teste, spec/evidence). Demais1073 hashes,
prefixos das memórias, HEAD/main/origin e APK anterior preservados;
git diff --check PASS. Relatórios/helpers/capturas em tmp/c128-parental-visibility.
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; NEXT_GATE_STARTED=NAO.
