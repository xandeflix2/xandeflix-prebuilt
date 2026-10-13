# C11 — apresentação de séries exclusiva dos celulares — 2026-10-06

Especificação: [C11_PHONE_SERIES_DETAIL_LAYOUT](../architecture/C11_PHONE_SERIES_DETAIL_LAYOUT.md).
Mesmo workspace/remote/HEAD registrados no contrato. Baseline anterior620 arquivos;
handoff para diagnóstico Fire633 arquivos. Dirty anterior preservado, sem Git/backend.

## Implementação

Phone identificado pelo perfil existente, incluindo paisagem, excluindo tablet,
iPad, desktop largo e UA AFT. A página desktop/tablet/TV continua com pôster lateral.
No celular há mini player16:9 no topo, título, metadados, sinopse, ações e abas.
Extras TMDB são opcionais e consultados somente nessa página; não são adicionados
ao snapshot ou ao fluxo da primeira instalação. BR determina a classificação;
rating ausente não é inventado. Duração é por episódio, preferindo dado local.
Contagem mostra episódios da fonte resolvida; enquanto aguarda, total TMDB é rotulado.

Trailer público preferencialmente oficial pt/en, somente ID YouTube validado.
Player só após toque. Android usa WebView público separado, sem interface JS
privilegiada, sem armazenamento de vídeo, sem acesso à fonte ou chamada C9.
Alinha frame sob header antes de iniciar; plugin recusa abertura inicialmente
invisível. Bounds/scroll/background/sair pausam ou destroem player. Erro ou
ausência mantêm mensagem honesta e alternativa pública quando existe trailer.

Assistir usa o mesmo PlaybackService/C9 e primeiro episódio da temporada escolhida.
Episódios permanecem em lista sem imagens. Abas exibem um painel por vez;
semelhantes só são montados quando escolhidos, até20 títulos da fonte em2 colunas.
Avaliar, Favoritos e Compartilhar são funcionais. Preferências locais versionadas
até256 registros/64KiB e fingerprint opaco; storage indisponível conserva RAM.
Compartilhamento usa plugin oficial Capacitor7 e apenas título/link público TMDB.

Cache extras RAM LRU64/6h, até2 chamadas ativas/32 pendentes, timeout8s, dedup e
cooldown de falha. Teste expôs uma corrida ao concluir promise antes de remover
pending; limpeza agora precede publicação. Não houve mudança na ativação/catalogo.

## Verificação

- Typecheck, testes funcionais extras/persistência/share/perfis e regressões
  source-first/home/busca: PASS. Java inclui3 testes da política pública de trailer.
- Fixture executa componentes reais em StrictMode, resolver local sintético e
  imagens públicas. Phone390×844: sem overflow,4 episódios disponíveis,16+,
  duração local42m; nenhum img no painel de episódios. Assistir selecionou ep1-1
  e ep2-1 após mudar temporada. Nenhum erro capturado.
- Semelhantes:20 cards, duas colunas173,8px, nenhum rail no painel. Avaliação Adorei
  e favorito sobreviveram ao reload. Share capturou só título e TMDB/tv/1399.
- Trailer nativo simulado recebeu ID KPLWWIOCOOQ, bounds390×219,4 abaixo do header,
  visible=false fora da viewport e close ao desmontar. Ausência sem trailer foi
  honesta. Falha explícita do loader apresentou retry e a repetição funcionou.
  O read model existente também pode retornar lista vazia após falha interna;
  esses mocks não transformam tal comportamento em garantia de recuperação física.
- Tablet1280×800 e TV960×540: apresentação antiga, pôster e rail, sem extras/trailer
  de phone. A ampliação Fire posterior é registrada na evidência própria.
- Revisão React: hooks incondicionais, dependências primitivas, efeitos canceláveis,
  listeners removidos, iframe/WebView diferidos até toque, abas acessíveis e dialog
  modal com ações reais. Nenhuma nova dependência de biblioteca visual.

Screenshots e dados de fixture estão em tmp/c11-phone-series-20261006, ignorado.
Verificação final do APK e instalação física serão acrescentadas ao relatório
consolidado; mocks e compilação não certificam reprodução pública no S24.
