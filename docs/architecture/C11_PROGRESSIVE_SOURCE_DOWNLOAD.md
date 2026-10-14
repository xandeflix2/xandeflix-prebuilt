# C11 — Download progressivo da fonte no primeiro catálogo

## Autoridade, problema observado e escopo — 2026-10-13

O usuário informou que, 23 minutos e 44 segundos após uma instalação limpa no
Fire Stick, o catálogo ainda não havia aberto e autorizou prosseguir com uma
correção que preserve os termos canônicos. Este ciclo local corretivo é C104;
não inicia funcionalidade comercial nova. `CURRENT_GATE=NONE` e
`NEXT_GATE_STARTED=NAO` permanecem válidos.

Preflight confirmou o clone independente
`C:\Xandeflix\xandeflix-prebuilt-c11-main`, `main`, origin
`xandeflix2/xandeflix-prebuilt` e package `com.xandeflix.prebuilt`. O workspace
já continha mudanças C100–C103, que devem ser preservadas. Commit, push, PR,
backend, troca de fonte, identidade, ativação e licença não estão autorizados.

Evidência física sanitizada mostrou que `startDownload()` permaneceu pendente
enquanto o arquivo privado crescia para mais de 80 MB. O parser JavaScript ainda
não havia alcançado `IMPORT_STREAM_PARSE` e nenhum primeiro batch de staging
havia sido persistido. A implementação esperava o corpo HTTP inteiro terminar
antes de permitir a leitura do arquivo já gravado, somando download e parsing e
mantendo a tela sem progresso útil em uma fonte grande/lenta.

## Requisitos anteriores ao código

1. No transporte Android, liberar o consumidor somente após resposta HTTP 2xx,
   criação do arquivo privado e validação inicial de tamanho, sem aguardar o EOF.
2. Permitir leitura bounded dos bytes já gravados. EOF temporário durante a
   gravação deve ser representado como pendência, nunca como conclusão.
3. Declarar conclusão somente após EOF real do corpo e flush do arquivo. Falha,
   cancelamento, timeout ou limite excedido após o início devem chegar ao
   consumidor e impedir finalização/promoção.
4. Manter o `Call` cancelável durante todo o corpo, não apenas até os headers.
5. Preservar cálculo SHA-256 completo. Quando o digest nativo ainda não existir
   no início progressivo, o hasher incremental JavaScript existente deve cobrir
   todos os chunks e continuar sendo a autoridade antes da promoção.
6. Preservar arquivo temporário privado, limite máximo, buffers bounded, parser,
   classificação, todos os registros válidos, staging isolado, integridade,
   promoção atômica, snapshot anterior e limpeza final. Catálogo parcial nunca
   pode se tornar ativo.
7. Não alterar source URL/headers, vault, Control Plane, identidade, chave,
   autorização, licença, playback, UI, esquema ou regras de atualização.
8. Tempos físicos são evidência, não SLA. O teste deve separar abertura do
   transporte, primeiro batch e promoção completa; sucesso local não presume
   comportamento de toda fonte ou dispositivo.
9. Preservar C60: consultas com digest anterior válido mantêm download completo
   e comparação nativa antes de qualquer parse/staging. Somente importações sem
   digest anterior solicitam o modo progressivo; chamadas antigas mantêm o modo
   completo como padrão. O importador pode passar essa preferência explícita.
10. Blocos progressivos são bytes em Base64 já suportados pela ponte, decodificados
    em Uint8Array e pelo TextDecoder incremental existente. Nunca converter cada
    bloco isolado em string UTF-8; acentos/emoji e digest devem ser byte-exatos.
11. Preservar os timeouts existentes de conexão/leitura e cancelamento. Não impor
    novo limite total arbitrário que rejeite fontes válidas antes concluídas pelo
    cliente. Timeout efetivo retorna erro sanitizado, limpa apenas temporário e
    impede promoção; nunca tratar silêncio como EOF bem-sucedido.

## Allowlist estrita

- Este contrato.
- `android/app/src/main/java/com/xandeflix/prebuilt/source/LargeSourceTransportPlugin.java`.
- `android/app/src/test/java/com/xandeflix/prebuilt/source/LargeSourceTransportPluginTest.java`.
- `src/source/large-source-transport.bridge.ts`.
- `src/source/device-direct-fetch.ts`.
- `src/source/real-source-importer.service.ts`: somente passar preferência
  progressiva quando não houver digest anterior; parser/promotor intactos.
- `scripts/test-c11-progressive-source-download.mjs` com fixtures sintéticas.
- Teste sintético novo, se necessário, limitado ao protocolo progressivo.
- `docs/evidence/C11_PROGRESSIVE_SOURCE_DOWNLOAD.md`.
- `docs/evidence/C11_REA_REFERENCE_APK_LOADING_COMPARISON.md`: somente apêndice
  factual corrigindo a interpretação inicial e referenciando C104.
- `docs/STATUS.md`, `docs/EVOLUTION_REPORT.md` e
  `docs/ERRORS_AND_BLOCKERS.md` para memória factual.
- Saídas usuais de build/Capacitor/Gradle e APK local de validação.

Nenhuma dependência nova, refatoração ampla, migration, chamada administrativa,
mudança remota ou edição no workspace histórico está autorizada.

## Aceitação

- Lock oficial de ativação passa antes e depois do patch.
- Teste nativo prova: consumidor começa antes do EOF; leitura temporariamente
  sem bytes retorna pendência; bytes posteriores são entregues em ordem; EOF
  final encerra; falha tardia não vira sucesso; cancelamento alcança o `Call`.
- Regressões existentes de transporte/importação, TypeScript, build e JVM passam.
- Fonte sintética grande mantém memória bounded e contagem/conteúdo completos.
- APK de teste, se instalado no mesmo Fire Stick, usa atualização in-place com
  mesmo package e assinatura, preservando identidade/ativação/fonte. Não usar
  uninstall, `pm clear`, seed, troca de fonte ou manipulação manual do catálogo.
- Evidência física deve observar `IMPORT_STREAM_PARSE` antes do término do
  download e somente considerar catálogo pronto após promoção válida.

## Validação física delimitada — 2026-10-14

O catálogo do APK19 anterior acabou sendo promovido no alvo original
`G071CQ070344374G`/AFTSS/API28; não é mais uma primeira instalação sem catálogo.
A autorização corretiva permite instalar o build local testado in-place nesse
mesmo alvo/pacote/assinatura e abrir a Activity normal, preservando cadastro e
catálogo. Confirmar que não há reprodução antes da atualização. Comparar os
cinco arquivos privados de cadastro e os arquivos do catálogo em memória,
retornando somente igualdade/contagem, nunca valores ou hashes de segredos.
Preservar o APK anterior recuperável; sem instalação em outro alvo.

Para provar a fronteira progressiva no Android sem apagar o catálogo real,
permitida fixture HTTP sintética local via um `adb reverse` temporário exclusivo
desse alvo e CDP loopback do PID confirmado. Invocar somente o transporte
nativo com essa fixture, ler blocos bounded e verificar bytes em memória,
EOF pendente/final, cancelamento e limpeza dos temporários dessa sessão. Não
invocar importador/promotor, escrever estado de UI, mudar fonte/configuração,
semear catálogo ou exportar fonte real. Remover forward/reverse ao finalizar.
Esse teste certifica a ponte real, não o tempo de primeira sincronização da
fonte comercial nem a redução da demora imposta pelo provedor/rede.

## Autorização posterior: instalação do zero — 2026-10-14

Após a validação in-place, usuário solicitou explicitamente uma instalação limpa
do zero para testar abertura da Home, hero e capas. Essa autorização supersede
somente a restrição a uninstall/reset no alvo `G071CQ070344374G`/AFTSS/API28 e
package `com.xandeflix.prebuilt`. Permite uninstall sem preservação de dados,
instalar o APK C104 verificado, abrir Activity normal e acompanhar telemetria.
Não exportar/restaurar identidade, ativação, token, fonte ou catálogo. Não operar
outros dispositivos/packages, aprovar licença ou inserir fonte pelo agente.

Confirmar pacote ausente após uninstall e diretório files ausente antes da
primeira abertura; se backup inesperado restaurar dados, clear-data apenas
desse package autorizado. A ativação nasce pelo fluxo canônico: novo código e
chave persistentes, usuário realiza autorização legítima no painel. Até isso
acontecer não há catálogo autorizado. Nenhuma injeção/seed/bypass para medir tempo.

Registrar abertura da Activity, shell, início/fim de download, primeiro batch,
promoção, hero visível e quantidade de capas carregadas/pendentes/falhas através
de booleans/contagens e milestones. Separar espera humana pela ativação e rede
do tempo do processamento. Não confundir shell com Home carregada nem fixture
com fonte comercial. CDP pode observar DOM apenas para extrair esses indicadores,
nunca PIN/código/hash/token, URLs reais, texto bruto ou conteúdo do catálogo.
Adicionar evidência em `docs/evidence/C11_PROGRESSIVE_SOURCE_DOWNLOAD.md` e
memória do ciclo; lock oficial antes da nova instalação. APK anterior recuperável.

## Correção da política de deadline — 2026-10-14

O teste limpo ultrapassou sete minutos com17MB recebidos, ainda crescendo. O
limite total15min introduzido no candidato poderia rejeitar a fonte válida que
o APK anterior concluiu após~40min. Isso contraria a exigência do usuário de
preservar funções consolidadas, ainda que fail-closed proteja a integridade.
Antes do ajuste, retirar esse novo limite default da especificação: manter
timeouts originais/cancelamento durante todo o corpo. Teste de deadline injetado
em fixture continua útil para provar que erros nunca promovem catálogo parcial,
sem criar nova política default no produto. Registar que o APK atual do teste
ainda contém15min até nova entrega; não atribuir sua falha ao provedor somente.

