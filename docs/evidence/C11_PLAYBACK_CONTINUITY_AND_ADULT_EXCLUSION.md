# C11 — Continuidade de reprodução e exclusão de adultos — ciclo50

2026-10-08. Especificação anterior ao código:
[C11_PLAYBACK_CONTINUITY_AND_ADULT_EXCLUSION](../architecture/C11_PLAYBACK_CONTINUITY_AND_ADULT_EXCLUSION.md).

## Escopo, preflight e proveniência

Workspace ativo independente `C:\Xandeflix\xandeflix-prebuilt-c11-main`, main,
origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`,
HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e` preservado. Get-Location,
top-level, remote, branch, HEAD, status dirty, AGENTS, Architecture Contract,
Execution Contract, Source Data Boundary e lock de ativação conferidos.
Workspace histórico e projeto original protegidos sem escrita.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Pedido explícito autoriza patch local
de continuidade e atualizações; nenhum commit/push/PR, alteração administrativa
no backend, reset, uninstall, troca de fonte/credenciais ou relaxamento de C9.

Baseline privado anterior ao patch: 720 arquivos, incluindo alterações locais
anteriores. Comparação SHA256 por arquivo: 23 paths alterados, todos na allowlist,
703 arquivos fora da allowlist preservados e HEAD igual. Helpers e relatórios
sanitizados ficam em `tmp/c11-continuity-20261008`, ignorado pelo Git. Não salvar
URI, cabeçalhos, credenciais, títulos de vídeos ou payloads privados nos novos
registros de progresso; apenas IDs opacos/fingerprint/posição/duração/tempo.

## Implementação final

1. Recentes v1 mantém limite60/64KiB e os dados antigos. Ledger separado de
   posições v1 limitado1000/256KiB conserva um ponto por filme ou episódio.
   Posicionamento usa identidade/fingerprint e episodeId exatos; não arredonda
   nem perde posições positivas menores que1s. Conclusão real reinicia0.
   Reinício explicitamente solicitado continua0. Seek0 com duração conhecida
   substitui o ponto anterior; evento0 sem duração durante tentativa/buffering
   não apaga progresso válido.
2. PlaybackService consulta o ponto salvo tanto no filme quanto no episódio;
   episódio deve pertencer à série canônica atual. Recentes sincroniza journal
   também no clique e usa o registro mais novo da mesma identidade antes de
   construir opções, evitando episódio/posição obsoletos durante recuperação.
3. Listener pronto antes do player; associação local nonce→identidade limitada
   a4/8KiB. Journal Android privado com4 eventos sanitizados recupera o último
   progresso quando WebView esteve pausado. Evento final conserva conclusão;
   nonce desconhecido/timestamp velho/malformado não sobrescreve estado novo.
   Callbacks periódicos existentes5s, pausa, saída e fim foram preservados.
4. Exclusão canônica de adultos aplica-se a gravação de Recentes e apresentação
   de dados legados/reassociados/first-fold. Categoria/genre explícitos, sem
   inferir pornografia pelo título ou classificar todo filme18 como adulto.
   Adult Swim permanece categoria comum. Filmes adultos podem conservar posição
   privada, mas não entram no rail ou coleção Recentes.
5. Live memoriza apenas canal não adulto que efetivamente iniciou reprodução,
   após evento nativo isPlaying do previewId atual. Preferência única≤2KiB,
   IDs/fingerprint, sem título/URI. Canal adulto não a substitui. Na abertura,
   resolve ID/fingerprint no catálogo ativo, por páginas48 do grupo; remoção,
   reassociação, classificação adulta, abort e troca de snapshot recusam item.
   Fallback primeiro canal seguro; não hidratar catálogo inteiro. Geometria,
   EPG/fullscreen/Cast, PiP e controles de sessão existentes preservados.

### Regressão nativa encontrada no aparelho

JS mantinha115995ms, mas o player reiniciava0. O código local do Capacitor
mostrou que PluginCall.getLong aceita somente Long: um número JSON pequeno
como115995 chega ao Android como Integer. O stub antigo dos testes aceitava
qualquer Number e escondia a divergência real.

Patch mínimo no NativeAndroidPlayerPlugin: ler `call.getData().opt(...)` e
validar Integer/Long/Double integral, finito, não negativo e seguro. Ausência0;
string, booleano, fração e inválidos recusados. Stub do teste alinhado ao
Capacitor real; casos Integer115995/3300000, Long, Double, ausência e inválidos.
Controle negativo de wiring reproduz a regressão ao restaurar getLong.
NativePlayerActivity e transporte/candidatos/headers/timeouts não mudaram neste
ciclo. Testes anteriores ao patch nativo não provam retomada física correta.

## Verificações executadas

| Verificação | Resultado e alcance |
|---|---|
| Lock antes/depois/prebuild e conferência final | PASS:22 ativação,27 promoção,9 controles negativos; mocks isolados |
| test-c11-playback-continuity.mjs | PASS4 grupos com classes/modelo/resolver reais |
| Recent watched / source rebind / Home special collections | PASS3 grupos cada; assertions existentes preservadas |
| C9 runtime wiring | PASS10/10; recusa antes de stream preservada |
| Live screen awake | PASS, incluindo8 controles negativos |
| Playback error notice / artwork visible recovery | PASS11 e13; não certificam disponibilidade remota universal |
| TypeScript/build/Capacitor sync | PASS; bundle final index-r3UQJmy2.js |
| Gradle assembleDebug/testDebugUnitTest | PASS138 testes Java,0 falhas/0 erros |
| APK | PASS package/certificado/standalone/assets6 byte a byte/classes nativas |
| Revisão React e fluxo completo | Listeners e abort com cleanup; storage versionado/limitado; filtro canônico antes da apresentação; UI→progresso→native→recuperação conferidos |

Suite nova: filme3300000/7200000ms, modelo de10 temporadas×20 episódios,
T5E3/T5E4 com posições independentes, explícito0,750ms, pausa/recuperação,
registro recente obsoleto, conclusão sticky, quotas, storage negado, IDs e
fingerprints divergentes, episódio alheio, C9 recusado antes do resolver.
Adultos novos/legados/rebind/first-fold excluídos; filme comum18 e Adult Swim
preservados. Live recupera canal fora da página0, recusa adulto/reassociação,
fallback seguro, abort e mudança de geração. Nenhum adulto real foi reproduzido
ou capturado para esses testes.

O ajuste em test-c11-home-special-collections foi somente nas portas/imports
do harness. Em test-c11-live-screen-awake, o seletor da mutação negativa de
releasePreview foi corrigido para alcançar o corpo real, após limpeza Cast/PiP
preexistente; oito controles e lifecycle mantidos. Erro TS intermediário de
durationMs opcional corrigido antes do build final.

## APK final e instalações verificadas

[Xandeflix-v1.0.0-standalone.apk](../../Xandeflix-v1.0.0-standalone.apk)

- SHA256: `251E6D4BA6AA3DB6A85129B88181A0A87ABBF256A2F2E91973BEBCC385AB07BC`.
- 12400179 bytes; package com.xandeflix.prebuilt; versionCode1/versionName1.0;
  minSdk23/targetSdk35; HTTPSlocalhost sem server.url externo.
- Certificado SHA256: `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.
- Cast/share e duas activities PiP conservados.

Install-r sem reset/uninstall. Antes/depois com app próprio quiescente: SHA256
privados comparados em memória para catálogo, estado nativo, preferências,
WebView Local Storage/IndexedDB e outros; firstInstallTime preservado. Todos
os grupos iguais,0 arquivos alterados, APK instalado idêntico ao final.

| Aparelho | Verificação UTC | Privados / catálogo / estado nativo | Resultado |
|---|---|---|---|
| S24 SM-S926B |18:57:38|760 /718 /5|PASS instalação/hash/preservação |
| Tablet SM-X610 |18:58:29|751 /715 /5|PASS instalação/hash/preservação |
| Fire103 AFTSSS |19:33:21|889 /856 /5|PASS instalação/hash/preservação |
| Fire107 AFTSS |19:33:15|1003 /971 /5|PASS instalação/hash/preservação |

Instalação Samsung intermediária teve auditoria interrompida pelo app reaberto
durante a comparação. Isso não foi PASS; instalação final251E acima foi
integralmente auditada nos dois. Tablet recebido por Wi-Fi com serial validado;
a conexão caiu/porta mudou. 192.168.0.107:44431 expirou apesar de pareamento
visível; usuário conectou USB, retomada da QA via serial validado RX2X301Q3KY.
Hash instalado reconferido no cabo, sem reinstalar nem apagar dados.

Fire103/107 ficaram sem operações após o cancelamento anterior. Novo pedido
explícito “instale nos 2 firesticks uma versao atualizada o aplicativo” autorizou
as duas instalações acima. Somente package próprio foi parado para auditoria;
não abrir app, wake, screenshots ou testar playback nesses alvos. A instalação
não equivale a validação física de continuidade/capas no Fire.

## Resultados físicos de continuidade

| Fronteira real | Evidência | Resultado |
|---|---|---|
| S24 mesmo episódio |Luke CageT1E2 parado15000ms; reabertura15000ms/duração3567254|PASS após patch Integer |
| S24 Recentes série |T1E1 parado30000ms; clique Recentes abreT1E1 em30000/duração3296918|PASS |
| S24 posições por episódio |ApósT1E1, executarT1E2 mantém15000ms|PASS independência |
| S24 filme normal e Recentes |Coyote posição537925ms/duração6166582, reaberturas com mesmo ponto; FIRST_FRAME/READY|PASS |
| S24 último canal seguro |Globo SP SD efetivamente reproduziu; sair Home→Live retornaGlobo SP SD|PASS |
| Tablet mesmo filme |Coyote5477891ms/duração6166582; botão Assistir recupera ponto; FIRST_FRAME/READY|PASS |
| Tablet Recentes e restart |Último ponto posterior5479764ms; force-stop somente app próprio→boot→Recentes; journal5479764 e FIRST_FRAME/READY às16:29:25 locais|PASS persistência entre processos |

Probes imediatos antes de preparação não contaram como imagem reproduzida.
No tablet, tentativa antiga490412 com duração0 coincidiu com401; arquivo de
helper antigo rotulado505412 não prova505412 nem reprodução. Resultado final
usa somente5477891/5479764 com duração conhecida e logs de frame reais.
Variação entre esses dois pontos é progresso registrado antes da saída, não
arredondamento da retomada. S24 mostrou depoisT1E3/32115 como última escolha;
Recentes acompanha o registro atual. S24 desconectou na tentativa de restart:
essa tentativa não foi PASS. Restart foi concluído no tablet. Modelo10×20/T5E3
é teste automatizado, não alegação de temporada5 assistida no aparelho.

## HTTP401 e limites restantes

Pedido paralelo: screenshot S24 em Um Natal Bem Jonas Brothers, erro401;
usuário informa mesma fonte funcionando em outro app. Logs nativos próprios
confirmaram HTTP_AUTH_FAILURE/InvalidResponseCodeException401 antes de dados,
também em Coyote; tablet registrou401 às16:06/16:10. Não é prova de codec ou
credenciais universalmente inválidas. Fonte e versão do catálogo correspondem.
HEAD200 de playlist/mídia não comprova GET/playback. Probes GETRange controlados
em memória: primeiro perfil atual expirou e controle respondeu206; repetição
invertida respondeu206 nos dois perfis, portanto causa por User-Agent não foi
confirmada. Nenhum URI alternativo/header/timeout/TLS foi inventado ou alterado.

Depois, Luke Cage e Coyote produziram FIRST_FRAME/PLAYER_READY; Coyote retomou
no S24 e tablet com o transporte original. Esse sucesso posterior mostra acesso
disponível nesses testes, sem demonstrar correção permanente do401 ou confirmar
o filme Um Natal em particular. Investigação desse401 permanece aberta.

Precisão física depende de seek suportado pela mídia e último progresso salvo.
Pausa/saída normal recuperam o evento final; processo morto sem callbacks pode
conservar somente checkpoint periódico5s. Quotas locais declaradas acima;
não há promessa de histórico ilimitado ou sincronização entre aparelhos.
Classificação adulta depende de identificação explícita correta da fonte.
Cobertura universal de capas/produção e QA física Fire continuam pendentes;
esta atualização de continuidade não certifica essas demandas anteriores.

CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; GIT_COMMIT/PUSH/PR_AUTHORIZED=NAO.
