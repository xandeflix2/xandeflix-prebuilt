# C11 — Canonização da ativação e diagnóstico de playback

## Autorização e resultado físico relatado — 2026-10-03

O usuário confirmou que conseguiu ativar novos dispositivos e carregar conteúdo
com o APK entregue. Isso atualiza a pendência física dos dois relatórios anteriores
somente para ativação/carregamento, com provenance USER_REPORTED, sem coleta
instrumentada ou verificação do hash instalado pelo agente. Não é evidência de
playback homologado: foram reportadas falhas em filmes/séries. Durante este ciclo,
o usuário refinou o sintoma: alguns filmes abrem, outros não; Clube da Luta falha.

Preflight e allowlist: [contrato canônico](../architecture/C11_NEW_DEVICE_ACTIVATION_LOCK.md).
Workspace `C:\Xandeflix\xandeflix-prebuilt-c11-main`, main, HEAD
`f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`, origin esperado, ahead 2.
AGENTS/Architecture/Execution/Source Data Boundary lidos; baseline de 57 hashes.
Sem novo Gate, Git writes, backend, instalação, reset ou alteração do playback.

## Lock efetivamente instalado

`C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1` foi referenciado obrigatoriamente
em AGENTS e nos contratos arquitetural/de execução. O comando oficial
`npm run c11:new-device:lock` verifica invariantes e executa suites com código real
e dependências nativas/remotas simuladas, sem rede. package.json passou a executar
esse comando via prebuild antes de tsc/Vite. Nenhuma dependência foi alterada.

Regressões cobertas: geração persistente local, fallback SHA sem Node, concorrência,
offline, read/write pendente/negado, retry sem rotação, registro A1 único, status
indeterminado, boot não autorizado sem source lookup/licença inválida, preservação
da autorização e exclusões de backup/transferência. Adicionado caso determinístico
de dois dispositivos isolados: identidades/códigos/tokens/instalações/chaves
independentes, ativação mock e reboot conservando os valores sem novo registro.
O PIN não é globalmente único; isolamento não deve ser confundido com unicidade
matemática de seis dígitos.

O lock também cobre instalação limpa -> staging real -> rename/copy -> catálogo
ativo, falhas obrigatórias e preservação do snapshot/credenciais locais. Não é uma
freeze de arquivos completos: mudanças compatíveis são permitidas se preservam
invariantes e testes. Desativar o guard, reduzir critérios ou contornar o lifecycle
exige autorização e emenda. O lock é local; CI/proteção de branch remota não foram
configurados nem publicados, e nenhum teste elimina todo risco de bug futuro.

## Validação executada

- Comando oficial: PASS, **22 testes de ativação + 27 de promoção = 49**.
- **9 controles negativos PASS**: rejeição de hook ausente, HTTP, imports Node
  crypto estático/dinâmico, shadowing crypto, backup ausente e resultados de suites
  incompletos, exit não-zero ou término/timeout. Suíte ausente bloqueia execução.
- `npm run build`: PASS; output confirma prebuild -> lock PASS -> tsc/Vite.
  Nenhum aviso crypto externalizado; avisos existentes fs/path/chunk/imports mistos.
- `test-c11-playback-session-c9-runtime-wiring.mjs`: **10/10 PASS**.
- `test-c11-vod-direct-stream-contract.mjs`: **12 casos PASS**.
- Diagnóstico sintético novo: executou helpers reais extraídos do hook e classes
  reais CatalogReadModel/CanonicalItemResolver/PlaybackService. Não é teste de
  ExoPlayer, origem real, autorização comercial real ou reprodução de mídia.
- APK e runtime de produção não foram alterados. APK raiz continua com SHA-256
  `8828F12016892A29E3B15D0009315E3A404D4C2495F6FB8A2105DE5D15FD4B8C`.
  Conferência final: 53/57 hashes da baseline idênticos; os quatro alterados são
  apenas o teste de ativação e STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS.
  Arquivos tracked antes limpos alterados: AGENTS, package.json e os dois contratos,
  todos na allowlist. Cinco assets do novo build web continuam idênticos aos do
  APK existente. Syntax checks e diff --check scoped PASS; HEAD/main inalterados.

O primeiro caso novo falhou porque comparava o objeto de token entre VMs por
referência (`assert.equal`), apesar de conteúdo idêntico. Corrigido apenas no
teste: comparação dos valores serializados no reboot e rawDeviceToken/hash
distintos entre dispositivos. O guard propagou exit=1 e bloqueou a validação,
depois passou com o teste corrigido. Não foi alterado runtime nem relaxada a
persistência/autorização para tornar o caso verde.

## Investigação: primeira fronteira local defeituosa

Não há dispositivo conectado: `adb devices -l` retornou lista vazia. Sem log
físico, não é possível identificar o estágio da falha de Clube da Luta.
Não foi acionado playback no backend (start/heartbeat/close são mutações de sessão).
Foram inspecionados código do guard C9 e migrations somente em leitura.

`src/ui/hooks/useActiveCatalog.ts:24` mantém streamSegmentsPromise por toda a
vida do resolver. A factory é memorizada em :145 apenas por service, enquanto
o readModel é recriado em :187 quando activeCatalog muda. Assim, o resolver
compartilhado retém uma lista vazia ou nomes de segmentos de outra geração.
Não há invalidação por snapshotId nem retry do manifest nesse cache.

O stream direto é preservado no importador M3U/segmentos. Filmes/episódios usam
`getStreamRefAsync` antes de abrir o player; ambos interrompem com
STREAM_REF_NOT_FOUND se esse cache não leva ao arquivo correto.

Reprodução controlada (`node scripts/test-c11-clean-install-playback-diagnostic.mjs`):

| Condição | Filme e episódio | Chamadas ao probe nativo |
| --- | --- | --- |
| Resolver criado antes da ativação, primeiro lookup após promoção | NATIVE_PLAYER_OPENED | 2 |
| Lookup vazio antes do manifest, seguido de promoção | STREAM_REF_NOT_FOUND | 0 |
| Geração A consultada, depois geração B com nome de segmento diferente | STREAM_REF_NOT_FOUND | 0 |
| Resolver recriado sobre geração B | NATIVE_PLAYER_OPENED | 2 |

É um defeito real reproduzido no código atual, **condicional ao cache ter sido
previamente preenchido**. Só montar o app antes da ativação não dispara o defeito.
Não afirmar que isso causou a falha física sem essa evidência. First-fold streams
já presentes no readModel não passam por esse resolver; portanto o defeito pode
afetar seletivamente títulos fora do lote inicial. A posição de Clube da Luta
no catálogo real e o estado do cache daquele aparelho não foram observados.

Correção candidata, NÃO implementada neste ciclo: recriar/invalidate resolver
quando snapshotId muda; não congelar manifest ausente; manter leitura limitada
a um segmento por vez e identidade da geração consistente com readModel.
Essa intervenção deve preservar o lock e requer autorização de correção.

## Outras fronteiras não confundidas com ativação

O guard de sessão vem antes da busca de StreamRef e pode bloquear por limite de
telas/revogação/indisponibilidade mesmo com dispositivo autorizado. O controle
sintético de SESSION_LIMIT_REACHED bloqueou filmes/episódios antes do player,
com categoria CONCURRENT_SESSION_LIMIT. Não houve evidência dessa resposta no
aparelho. A migration C9 contém validação de token/binding/acesso e contagem de
sessões: ativação não libera sessões ilimitadas.

Se a Activity abre e o vídeo não toca, a fronteira já é outra: origem HTTP,
conectividade ou decodificação. O Android possui logs sanitizados PLAYER_ERROR,
httpStatus, LAST_PLAYBACK_CHECKPOINT e MOVIE_FIRST_FRAME_RENDERED. Nenhum desses
valores foi coletado para Clube da Luta; não inferir 404/403/codec sem log.
O sucesso de alguns filmes afasta uma indisponibilidade universal do plugin,
mas não prova acesso ao stream específico nem exclui falha intermitente de sessão.

## Informação física solicitada e parada do diagnóstico

Solicitado ao usuário: o player abre preto/carregando ou nem abre e mostra erro
na tela de detalhes? Qual mensagem/captura? Após fechar/reabrir o app, sem limpar
dados ou desinstalar, Clube da Luta continua falhando?

O relato ainda não define essa fronteira. O diagnóstico local para no defeito
reproduzido; não foram tentados fixes de rede, codec, URL, limites ou licença.
Sem alterar APK, identidade, chaves, source store ou player consolidado.

## Coleta física read-only — 2026-10-04

Atualiza as pendências históricas acima: o usuário informou que o player abre
e fecha retornando à tela anterior e conectou um Samsung SM-S926B autorizado
no ADB. Preflight confirmou workspace C11, origin esperado, main/ahead 2 e HEAD
`f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`, com baseline dirty conhecida.
AGENTS, Architecture, Execution, Source Data Boundary e lock relidos.
CURRENT_GATE=NONE; somente diagnóstico e memória documental da allowlist.

O APK instalado foi lido no dispositivo e seu SHA-256 coincide integralmente
com o APK raiz: `8828F12016892A29E3B15D0009315E3A404D4C2495F6FB8A2105DE5D15FD4B8C`.
Sem reinstalação, reset, limpeza de logcat ou alteração dos dados do aparelho.

Foram encontradas duas tentativas já presentes no log do processo do app.
O relógio do dispositivo registra `10-03 23:19:01.874` e `23:19:13.394`;
a data deste relatório segue o contexto do cliente, não corrige o relógio do
aparelho. Ambas têm um candidato MP4 e terminam com:

```text
MOVIE_PLAYBACK_ERROR_CODE=HTTP_ERROR httpStatus=404
category=HTTP_ERROR code=2004 LAST_PLAYBACK_CHECKPOINT=DATASOURCE_OPEN
rootExceptionClass=ExoPlaybackException
InvalidResponseCodeException Response code: 404
```

Leitura limitada a um segmento por vez, em memória, identificou no catálogo
ativo o filme `Clube da Luta` (`mov:m3u:10113`) e a referência
`str:m3u:mov:10113`, em `movies_000011.json`/`streams_000011.json`.
A referência direta possui o mesmo fingerprint SHA-256 truncado que as duas
requisições nativas. O active pointer permaneceu estável durante a leitura.
Nenhuma URL, host, credential, chave de ativação ou token foi emitido ou salvo.

Conclusão instrumentada: nessas duas tentativas de Clube da Luta a origem
respondeu HTTP 404 antes de transferência/primeiro frame. Não é o defeito
pré-player de cache de segmentos, nem evidência de erro de decoder. Ainda não
é possível distinguir entrada obsoleta na playlist, arquivo indisponível ou
negação de acesso pela origem; não foi feita requisição externa especulativa.
Solicitado teste atual de Clube da Luta e de um filme funcional; até a última
leitura não surgiu nova tentativa. Não homologar o restante de filmes/séries.

Mecanismo de retorno confirmado no código: `handlePlaybackError` esgota o único
candidato, emite `NATIVE_ERROR` e chama `finish()`. O listener em App converte o
evento em `stopPlayback('MEDIA_ERROR')`, que retorna a IDLE sem mostrar categoria
ou status HTTP na tela de detalhes. Correção candidata: erro sanitizado visível
e encerramento controlado, preservando sessão/autoridade e URL original. Não
implementada; tratar a mensagem não torna reproduzível um recurso HTTP 404.

Skill de investigação orientou logs primeiro e correlação título -> referência
privada -> erro nativo, evitando fix de codec/licença sem evidência. Sem build,
sync, APK novo, backend, Git writes ou alteração de runtime/testes/ativação.
Ocorrências benignas: `adb shell date` com espaço no formato foi rejeitado;
consulta corrigida para epoch. Busca `rg` incluiu `src/streams` inexistente;
continuada nos caminhos reais. Nenhuma dessas falhas modificou dados.

Verificação final: os 388 arquivos de runtime/configuração/testes/AGENTS/APK
inventariados mantiveram os hashes, sem novos arquivos nesse conjunto.
Somente este relatório e STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS foram
editados. Diff --check documental passou, com avisos LF/CRLF já existentes.
Não foram rerodados build/testes funcionais, pois não houve patch de código.

## Contraprova no tablet Samsung — 2026-10-04

O usuário ampliou o relato: vários conteúdos falham, inclusive 9-1-1, e esses
conteúdos já funcionavam neste mesmo player. Isso é provenance USER_REPORTED,
não comparação instrumentada entre versões. Não limitar a investigação a um
filme nem pressupor incompatibilidade com outros aplicativos. Tablet SM-X610
conectado; preflight e contratos relidos, HEAD/branch/origin/baseline conhecidos.

O SHA-256 do APK instalado no tablet também corresponde ao standalone entregue.
Nenhuma instalação, reset, troca de configuração, rebuild ou patch de runtime.
A coleta inicial não possuía tentativas nativas; as duas abaixo foram acionadas
pelo usuário após a solicitação de teste, sem sessão remota forjada pelo agente:

- **9-1-1 T1E1**: referência `str:m3u:ep:32`, episódio `ser:m3u:2:s1:e1`,
  identificados em segmentos privados. A tentativa começou às `07:47:59.435`
  no relógio do tablet, recebeu primeiro byte às `07:48:00.319`, renderizou
  primeiro frame às `07:48:01.049` e atingiu READY às `07:48:01.072`.
  Usuário confirmou reprodução em andamento. Isso não valida outros episódios
  nem prova que a falha relatada em outro dispositivo não ocorreu.
- **Clube da Luta**: referência privada com o mesmo fingerprint nativo truncado
  das duas requisições HTTP 404 históricas do celular. No tablet, nova tentativa
  às `07:51:28.296`, primeiro byte às `07:51:29.047`, primeiro frame às
  `07:51:33.175`, READY às `07:51:33.190` e posição avançando às `07:51:34.310`.
  Usuário confirmou que o vídeo inicia normalmente.

LATEST_EVIDENCE: não classificar o endereço de Clube da Luta como permanentemente
inválido, nem 404 como explicação global da regressão relatada. Os 404 no celular
são reais e permanecem registrados; a contraprova posterior de reprodução no
tablet exige diagnóstico por tentativa, horário, dispositivo e contexto.
Conectividade/rota, resposta temporal da origem, headers ou sessão são apenas
hipóteses; nenhum desses fatores foi isolado. Não afirmar correção espontânea
de todos os conteúdos nem causa raiz encerrada por dois títulos funcionais.

Diff read-only entre `0eb3272` e HEAD, e diff local, não mostrou alterações nos
arquivos de player nativo/resolvedor/playback. Isso não exclui regressão em
importação, catálogo, cache ou estado: não há APK histórico identificado pelo
usuário nem captura simultânea de falha e sucesso. O defeito de cache sintético
anterior e a perda de erro na UI continuam registrados, sem patch autorizado.

Próxima evidência necessária: reproduzir uma falha atual no dispositivo afetado,
identificando temporada/episódio e rede usada. Não repetir comparação com player
de outro aplicativo como requisito. Só o tablet está conectado neste momento.
Skill de investigação orientou manter os resultados contraditórios e não aplicar
fix especulativo de URL/codec/ativação. Mudanças deste ciclo são documentais.
Ocorrência técnica: rg com wildcard em argumento de diretório Windows foi
rejeitado; leitura continuada nos caminhos reais, sem alteração funcional.

## Reteste no celular afetado — 2026-10-04

SM-S926B reconectado e autorizado no ADB. Preflight completo e contratos relidos;
workspace C11, main/ahead 2, origin e HEAD conhecidos, baseline dirty preservada.
Mesmo APK SHA-256 já registrado. Coleta read-only; não houve instalação, limpeza
de dados/logcat, troca de rede, force-stop, build, código ou write remoto pelo
agente. Inicialmente não havia processo do app; o usuário abriu e fez os testes.

A rede padrão atual do celular tem transport WIFI no dumpsys connectivity.
O usuário confirmou ambos reproduzindo no mesmo Wi-Fi; isso não identifica a
rede/rota das tentativas 404 históricas, portanto não prova causalidade de rede.

Novas tentativas do processo atual, filtradas após o marcador de coleta:

- **9-1-1 T1E1**: referência privada `str:m3u:ep:32` do episódio
  `ser:m3u:2:s1:e1` corresponde ao fingerprint nativo da tentativa. Primeiro
  frame `08:01:45.833`, READY `08:01:45.876` (-03:00).
- **Clube da Luta**: referência `str:m3u:mov:10113` corresponde tanto ao
  fingerprint das requisições 404 anteriores quanto ao da nova tentativa.
  Primeiro frame `08:02:00.300`, READY `08:02:00.321` e posição avançando
  `08:02:01.274` (-03:00).

Horários convertidos do epoch do log para o offset do cliente. Catálogo privado
lido um segmento por vez, sem emitir/salvar URLs, host ou credenciais; active
pointer permaneceu estável. Usuário confirmou ambos reproduzindo e esclareceu
que voltou manualmente: os releasePlayer desse reteste não são fechamento
automático por falha. Nenhum PLAYER_ERROR/404 apareceu nessas duas tentativas.

Status atual: falha não reproduzível nos dois títulos testados, tanto no tablet
quanto no celular, sem correção de código aplicada nesta investigação. Isso não
homologa o catálogo inteiro, todos os episódios, duração completa dos vídeos ou
outras redes. Os 404 históricos e o relato de regressão continuam preservados.
A causa da diferença temporal permanece aberta; não declarar problema de codec,
rede, licença, cache ou origem definitivamente resolvido/isolado por este reteste.

Defeitos de código já demonstrados continuam separados: cache de segmentos
condicional pré-player e perda da causa no retorno de erro nativo. Não foram
corrigidos neste escopo de diagnóstico. Uma eventual correção exige autorização
de patch, especificação mínima e preservação do lock de ativação/catalogo.
Skill de investigação orientou separar falha histórica, contraprova atual e
saída manual, sem transformar reprodução posterior em prova de causa raiz.

## Skills e referências

Investigação orientou logs primeiro e a separação entre prova e hipótese;
verificação orientou percorrer entidade -> StreamRef -> abertura nativa, incluindo
o catálogo segmentado além do first-fold. Skill Supabase orientou preservar
autorização, não contornar RLS/comercial e verificar a API RPC oficial.
Consulta do changelog markdown via web falhou por content-type; leitura pública
via Invoke-WebRequest funcionou. Nenhuma feature Supabase foi implementada.

[RPC JavaScript oficial](https://supabase.com/docs/reference/javascript/rpc),
[changelog oficial](https://supabase.com/changelog.md).
