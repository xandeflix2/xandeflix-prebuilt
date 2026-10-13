# C11 — Atualização automática da mesma fonte: evidência (ciclo 60)

[Especificação anterior ao código](../architecture/C11_AUTOMATIC_SOURCE_REFRESH.md).
Execução local autorizada pelo usuário em 2026-10-09; horários finais em UTC
podem cair em 2026-10-10. Clone C11/main independente, HEAD/origin canônicos;
baseline privado 767 arquivos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO;
sem commit/push/PR, alteração remota/backend/env ou acesso ao projeto protegido.

## Resultado implementado

O NO_OP baseado apenas em sourceVersion impedia detectar alterações na playlist
existente. checkContent agora verifica o payload autorizado mesmo com a mesma
configuração; chamadas anteriores preservam seu comportamento. No Android,
SHA-256 é calculado durante download limitado com buffer de 64 KB; resultado
inalterado limpa temporário sem parse/staging/nova geração/índice. O digest local
é válido somente para sourceId/sourceVersion/snapshot ativo e perfil atual;
somente promoção confirmada grava nova referência. Fallback web usa hash incremental.

Um scheduler de foreground usa 15 minutos após sucesso, backoff mínimo de
1 minuto após falha e single flight. Inicialização ainda reconcilia configuração;
promoção inicial bem-sucedida evita baixar novamente imediatamente. Retorno/
online/focus verificam quando devido. Details/Live/modal/playback/Cast adiam
atualização; mudança de tela durante download pode descartar só o candidato.
Shell permanece durante refresh, seleção de detalhe pausa durante commit,
histórico de rotas de detalhe da geração anterior é removido para não reutilizar
IDs M3U ordinais de outros títulos. Histórico de reprodução permanece intacto.

Xtream exige handshake autorizado e seis listas válidas; erro HTTP/JSON não se
converte em sucesso vazio. Importação materializa listas inteiras em segmentos,
eliminando truncamento anterior nos primeiros 100. Não adiciona fetch de episódios
Xtream que a API de listagem não fornece. Fontes permanecem device-direct/cofre
local, autoridade remota existente; sem URLs/credenciais em relatórios novos.

Não há evento push da fonte nem distribuição OTA de APK. Verificação periódica
depende de internet/aplicativo em uso, com adiamento durante mídia/detalhes. Outros
usuários precisam instalar o APK novo uma vez. Candidatos dos heroes são renovados
pela geração; critérios existentes continuam selecionando apenas parte dos títulos.
Novidade continua baseada na primeira observação local, sem data global inventada.

## Verificação local

- Suite específica: 19 PASS, incluindo adição/remoção na mesma versão, unchanged
  sem parse nativo, revogação sem fetch, falha de fetch/promoção preservando ativo,
  concorrência, vínculo do digest/perfil/snapshot, web UTF-8, Xtream 205 filmes/
  130 séries/150 canais completos e falha parcial, política de foreground,
  detalhe aberto durante download, cooldown/restart/backoff/cache corrupto.
- Import bounded-memory 250000 registros: T1–T83 PASS. Memória RSS observada
  no Node de 86 a 292 MB: evidência de laboratório, não SLA nem medição no Fire.
- Pre-staging memory A–H PASS; profile/live T127–T143 PASS; Novidade 12 PASS;
  browse/featured 4 PASS; D-pad Home/detail/series 8 PASS; metadata recovery 4 PASS.
- Lock 22+27+9 PASS antes/depois, TypeScript/build/Capacitor/Gradle PASS;
  148 testes Java, zero falhas/erros, digest nativo conferido contra SHA-256 independente.
- Suite histórica artwork-visible-recovery: 2 grupos de serviço PASS, depois
  loader rejeita dependência NewContentProvider adicionada no ciclo 59. Não foi
  modificada fora da allowlist nem tratada como PASS integral. Verificação da capa
  real no tablet abaixo e suite metadata atual PASS.

## APK final e preservação

Xandeflix-v1.0-build2-standalone.apk; versionCode 2, versionName 1.0.
Nome nominal preservado porque RPC de diagnósticos já aplicada exige APP_VERSION=1.0;
nenhuma alteração de backend para renomear versão. Bundle index-D9F5_H4Q.js;
CSS index-BwP8uPUD.css; 11003449 bytes;
SHA-256 9D7052EA18079140F4F9FF5AE13EC585CE3DEF3786ED5E82D66C2E20F2BBE95C.
Package com.xandeflix.prebuilt, scheme HTTPS/localhost sem servidor externo,
minSdk23/target35; seis assets byte-idênticos ao dist, recursos anteriores conferidos.
Mesmo certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

install -r, sem uninstall/reset: S24 SM-S926B RXGYB03FL4W e tablet SM-X610
RX2X301Q3KY PASS/hash instalado correto/versionCode2. Arquivos privados antes/
depois e firstInstallTime preservados; grupos catálogo/nativo/preferences/WebView/
outros byte-idênticos. S24 760 arquivos/718 catálogo/5 nativos, confirmado
2026-10-10T00:49:11.841Z; tablet 758/715/5 em 00:49:50.432Z.
Fire Stick 1 192.168.3.126 AFTSSS G071EL13142513WK: mesmo APK final,
versionCode2/hash instalado/firstInstallTime e todos os grupos preservados,
901 arquivos/856 catálogo/5 nativos, confirmado 2026-10-10T00:55:07.344Z.
Tablet recebeu também um APK intermediário do próprio ciclo, substituído pelo
final com a mesma verificação. APK intermediário removido, artefato anterior C59
retido; não distribuir o intermediário.

## Tablet: fonte real e aplicação compilada

APK final, own foreground/visible, https://localhost, bundle correto, sem devserver.
Primeira observação ativa snap-muzp6frt/sourceVersion1: 17150 filmes, 8913 séries,
15833 temporadas, 221122 episódios, 1028 canais, 206 segmentos, digest ainda ausente.
Após sincronização automática: snap-mv1oi6ye/sourceVersion1, 17152 filmes,
8914 séries, 15834 temporadas, 221132 episódios, 1028 canais e 206 segmentos.
Digest vinculado à geração ativa, clock de sucesso persistido. Aumento líquido
2 filmes/1 série/10 episódios; fonte comercial não foi alterada pelo agente.
Nova chamada real checkContent: NO_OP/READY, mesma geração, 12183 ms observados
(inclui download da fonte; não representa SLA nem dispensa de download).

Home: 15/15 capas presentes decodificadas, 46 Ver todos; Recentes → Filmes em
Destaque → Séries em Destaque → Lançamentos. Navegação real por menu: filmes
Lançamentos → Destaque → Nacionais; séries Destaque → demais categorias.
Retorno Home PASS. Nenhum vídeo iniciado pelo agente, relato enviado, histórico artificial,
avaliação/favorito ou alteração da fonte comercial.

## Fire Stick e S24: fonte real e aplicação compilada

Fire Stick 1: após abertura, snap-muzov4xw/sourceVersion1 ainda tinha
17150 filmes/8913 séries/221122 episódios, sem digest/clock. Atualização automática
promoveu snap-mv1ov4vg/sourceVersion1: 17152 filmes, 8914 séries, 15834 temporadas,
221132 episódios, 1028 canais, 238284 streams, 206 segmentos. Digest vinculado ao
ativo e sucesso persistido. Chamada real posterior checkContent: NO_OP/READY,
mesma geração, 42959 ms observados incluindo download, sem SLA. Home compilada:
53/53 imagens presentes decodificadas, 46 Ver todos, dois selos Novidade e ordem
Recentes → Filmes em Destaque → Séries em Destaque → Lançamentos. São imagens
montadas nessa observação, não certificação de toda a biblioteca.
Depois o usuário iniciou mídia no próprio app (NativePlayerActivity em primeiro
plano). Nenhuma tecla, navegação ou interrupção foi executada durante essa mídia;
conferência D-pad adicional não realizada. Suites de regressão locais passaram.

S24 inicialmente fora do primeiro plano; posteriormente own foreground/visible
confirmados, ambas as barras de sistema visíveis. APK compilado final:
snap-mv1oz6nq/sourceVersion1 com as mesmas contagens atualizadas do tablet/Fire,
digest ligado ao ativo e clock de sucesso. Chamada real checkContent: NO_OP/READY,
mesma geração, 9755 ms observados incluindo download. Home com 9/9 imagens
decodificadas e 46 Ver todos. Screenshot próprio confirma hero completo/Ver todos.
Navegação real: Filmes Lançamentos → Destaque → Nacionais; Séries Destaque →
plataformas; retorno Home PASS. Pendência anterior de QA físico desse ciclo
resolvida quando o usuário tornou o aparelho disponível, sem unlock do agente.

Os três recebem conteúdos/episódios novos pela fonte, independentemente de ADB
ou rede do PC. Adicionar episódios a uma série existente não a promove
automaticamente a Séries em Destaque/heroes nem gera selo Novidade por episódio:
esses seletores seguem critérios de títulos/ano/categoria, não diff de episódios.
Pergunta posterior do usuário foi respondida com esse limite, sem ampliar escopo.
Fire2/S23 não fazem parte desta rodada. Playback Luke/AirScreen permanece nos
limites documentados no ciclo55; esta entrega não declara essas falhas resolvidas.

Proveniência final: baseline 767 arquivos, 752 arquivos fora da allowlist
preservados, zero mudança fora da allowlist e HEAD inalterado. Sem Git writes,
reset/rotação/backend/env ou próximo Gate. Relatório privado provenance-final.json;
APK final permanece disponível para distribuição manual, sem alegar envio global.
