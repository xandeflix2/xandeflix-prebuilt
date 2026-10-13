# C11 — busca/detalhes e hero interno no Fire Stick — 2026-10-06

Contrato: [C11_FIRE_STICK_SEARCH_DETAIL_FIX](../architecture/C11_FIRE_STICK_SEARCH_DETAIL_FIX.md).
Fire AFTSSS/API28 em192.168.3.103:5555. Atualização in-place autorizada; sem reset.

## Observação antes do patch

Matrix retornou4 títulos. A primeira seleção ficou em carregamento por período
prolongado e depois abriu. Protetor retornou11 resultados; duas entradas O Protetor
e a série The Equalizer - A Protetora abriram por DPAD_CENTER. Processo permaneceu
vivo; buffer AndroidRuntime não contém falha do pacote nesses testes.
Encerramento durante harness tinha evento am_finish_activity/app-request após
BACK; não é reprodução do crash ao clicar na capa. Registros históricos LMK e
tombstone existem, sem prova de vínculo causal ao clique observado.

## Correção verificável

SearchResults disparava uma resolução para cada resultado simultaneamente.
CanonicalItemResolver varria segmentos por item e não deduplicava o clique.
O fixture com código anterior congelado/hash conferido reproduziu12 leituras
ativas, incluindo repetição. Patch fez1 leitura ativa e11 varreduras distintas.
Hidratação dos cards agora é sequencial e para antes do próximo item ao trocar
consulta/desmontar. Resolver coordena fila única por instância, dedup kind/id,
até32 pendentes, limpa estado antes de retornar e recupera após erro. Não carrega
o catálogo inteiro nem persiste outro índice. Detalhes tratam falha de leitura
e oferecem retry em lugar de loading indefinido/erro sem tratamento.

Testes adicionais verificam quota, tipo correto, snapshot inicial incompatível,
miss sem envenenamento e efeito real da busca com50 resultados:1 leitura inicial,
zero leituras adicionais/updates após unmount. Nenhum teste foi relaxado.
Isso confirma redução de pressão e uma correção de tratamento de erro; não prova
que todo fechamento relatado tinha essa causa.

## Hero interno

UA AFT ganha classe específica. Hero sobe de220px do compacto para75vh (mínimo350,
máximo620), pôster150×225px e fundo horizontal mais visível com gradiente legível.
Fixture Fire960×540 confirmou405px, backdrop real e apresentação de TV; tablet e
celular não recebem essa regra. Não se aumenta o bitmap original nem se deforma
pôster para inventar uma imagem horizontal.

TMDB retorna filmes distintos chamados O Protetor (2014/2005/2015/1942). A fonte
dessas entradas não apresenta ano/ID ou filename público TMDB confirmável. O cache
mostra correspondência ausente para O Protetor/O Protetor2; A Protetora tem imagem
confirmada1280×720. A regra de confiança foi preservada para não vincular imagens
erradas. Fundo continua condicionado à correspondência segura e imagem disponível.

Typecheck, regressões de busca/semelhantes/capas/home, lock e teste novo PASS.
APK/instalações e repetição física final serão registrados no relatório consolidado.
Logs brutos e conteúdo de fonte não foram persistidos; apenas números/estados seguros.
