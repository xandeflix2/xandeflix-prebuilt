# C11 — Atualização do tablet e diagnóstico Busca -> detalhes

Data: 2026-10-04. Resultado: entrega do APK existente PASS; queda relatada
NÃO REPRODUZIDA no caso físico nomeado, sem causa original confirmada.

## Autoridade, preflight e proveniência

O usuário autorizou atualizar o tablet Samsung com o mesmo APK já entregue ao
Fire Stick, sem desinstalar ou apagar dados, e retomar o diagnóstico da busca.
Nomeou o filme **Clube da Luta**. Spec/emenda registrada antes da instalação em
[C11_LANDSCAPE_SIDE_NAVIGATION](../architecture/C11_LANDSCAPE_SIDE_NAVIGATION.md),
com sucessão explícita no contrato de proteção da ativação. Gate canônico NONE;
recorte local autorizado, nenhum próximo Gate, commit, push ou PR autorizado.

Preflight read-only: workspace/top-level
`C:\Xandeflix\xandeflix-prebuilt-c11-main`; origin
`https://github.com/xandeflix2/xandeflix-prebuilt.git`; branch `main`, ahead 2;
HEAD `f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`. Status sujo preexistente
preservado. AGENTS, Architecture/Execution Contracts, Source Data Boundary,
Activation Lock e spec de navegação lidos. Nenhuma colisão com projeto protegido.

401 arquivos de src/scripts/Android/runtime/config/package/APK mantiveram
exatamente os hashes do ciclo entregue anterior, antes e depois dos testes.
Nenhum patch funcional, script versionado novo, dependência, build/sync/Gradle
ou reescrita do APK nesta rodada. Escritas locais restritas aos documentos
permitidos e artefatos sanitizados de diagnóstico.

## APK e atualização in-place

- Alvo único: Samsung SM-X610, Android 16, serial `RX2X301Q3KY`.
- Pacote: `com.xandeflix.prebuilt`, versionCode 1/versionName 1.0.
- APK raiz: `Xandeflix-v1.0.0-standalone.apk`, **8748328 bytes**.
- SHA-256 instalado e raiz:
  `A806C1B2F70307DD410E437F9425170146FE07B113FB8B456EF3C1DB1447862F`.
- Assinatura v1/v2 válida, mesmo certificado esperado:
  `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.
- APK anterior do tablet: 9261140 bytes, SHA-256
  `8828F12016892A29E3B15D0009315E3A404D4C2495F6FB8A2105DE5D15FD4B8C`;
  sem código/CSS da sidebar. Divergência de versão explica layout antigo,
  não prova causa da queda da busca.
- `adb install -r`: Success. Sem uninstall, clear/reset, mudança de orientação,
  regeneração de identidade ou ações no painel/backend.
- Quatro arquivos privados byte-idênticos antes/depois da instalação:
  device_identity.json, device_activation_key.json, app_installation.json e
  device_activation.json. Conteúdos e hashes privados mantidos somente em RAM.
- Árvore canônica `files/prebuilt`: **505 arquivos byte-idênticos** antes/depois
  da instalação, inclusive ponteiro ativo; lista de caminhos/hashes não publicada.
  Isso verifica a preservação durante a atualização, não imutabilidade em syncs futuros.
- Abertura normal MainActivity Status ok; processo novo PID 32620 estável nos testes.
  TotalTime do lançamento frio 1185 ms não mede carga completa da Home/catálogo.

`npm run c11:new-device:lock` novamente PASS: 22 testes de ativação, 27 de
promoção e 9 controles negativos (**49+9**). Os 39 checks de browser e 90 testes
nativos pertencem ao ciclo anterior do mesmo APK inalterado; não foram rerodados
nesta rodada. Outros aparelhos não foram atualizados agora.

## Layout físico

WebView em paisagem, viewport CSS 1365x853; sidebar fixa esquerda de ~80 px,
conteúdo iniciando em ~80 px, seis destinos com nomes acessíveis e apenas ícones
visuais. Sem overflow global; secure context verdadeiro. Home e detalhes
inspecionados em PNG: Voltar no topo direito, fora da sidebar. Layout de
celular/retrato não foi alterado nem retestado fisicamente nesta rodada.

## Caso físico nomeado: Clube da Luta

1. Pela Busca, inserir nome completo de uma vez: um resultado de filme com
   título exato. Selecionar o card observado, sem acionar Assistir. Primeiro
   snapshot em carregamento; em aproximadamente **2 segundos**, título/detalhes
   e botão Assistir disponíveis. PID 32620 preservado; heap V8 amostrado 8 -> 7 MiB.
2. Repetir digitando caractere por caractere, intervalo 150 ms: prefixos
   intermediários alcançam 50 cards, consulta completa um resultado. Detalhes
   novamente disponíveis em ~2 segundos; o filme já estava no cache da primeira
   seleção, portanto esta repetição NÃO é prova de hidratação fria por caractere.
3. Manter tela de detalhes por **45 segundos**, 16 snapshots: detalhe presente,
   sem carregamento e mesmo processo. Maior heap V8 observado nas amostras de
   digitação: 53 MiB; durante estabilidade 38 -> 6 MiB. Não equivale a pico total
   de RAM ou prova universal de ausência de pressão de memória.
4. Logs Android filtrados/sanitizados dos testes não mostraram OOM, crash de
   renderer ou rejeição não tratada. Ausência nesses intervalos não refuta a
   ocorrência histórica. Nenhum conteúdo bruto de console/rede/ativação publicado.

Ambos os probes concluíram `DETAIL_LOADED`, exit 0. **Reprodução não iniciada**,
séries/outros títulos/dispositivos não testados. A queixa anterior de queda da
busca permanece diagnóstico aberto, não uma correção funcional homologada.

Artefatos locais sanitizados:

- [Consulta completa — relatório](../../tmp/c11-side-navigation/tablet-search-1791149909983/report.json)
- [Home atualizada — PNG](../../tmp/c11-side-navigation/tablet-search-1791149909983/tablet-home-updated.png)
- [Detalhes — PNG](../../tmp/c11-side-navigation/tablet-search-1791149909983/tablet-clube-da-luta-details.png)
- [Digitação e estabilidade — relatório](../../tmp/c11-side-navigation/tablet-search-1791150061633/report.json)
- [Detalhes na repetição — PNG](../../tmp/c11-side-navigation/tablet-search-1791150061633/tablet-clube-da-luta-details.png)

## Riscos de código e limites do diagnóstico

A inspeção read-only anterior identificou hidratação paralela de resultados em
SearchResults sem cancelamento efetivo de I/O, ausência de coalescência de
promessas pendentes no read model, varreduras por item no CanonicalItemResolver
e resolução de detalhes de filme/série sem catch. Simulação anterior com código
real e storage sintético mediu 51 leituras simultâneas/153 leituras totais para
50 resultados mais detalhe duplicado, versus uma leitura simultânea/3 totais
para um item. Evidência de risco de concorrência, NÃO causa física comprovada.
Esses arquivos permaneceram inalterados; patch funcional requer outro recorte
explicitamente autorizado e spec antes de código.

Skills agent-browser/investigation-mode orientaram logs sanitizados, snapshots
de UI antes de agir e conclusão sem atribuir causa não demonstrada. CLI indisponível:
usado fallback WebView/CDP expressamente permitido pela emenda, somente página
localhost do processo alvo. Forward temporário próprio tcp:50544 removido.

Incidentes exclusivos do harness: tentativa de parse JSON antes da conclusão de
exec assíncrono corrigida verificando session_id; comparação estrita entre altura
fracionária 853.333374 e innerHeight inteiro 853 corrigida com tolerância <1 px
CSS. Nenhuma mudança de produto para satisfazer os probes; retestes PASS.

Rede normal do app não foi interceptada nem suprimida. Não houve operação remota
de administração, mudança de ativação/source/player, reset, Git ou trabalho na
meta de 60 segundos do Fire Stick. Evidência antiga de instalação somente no
Fire permanece histórica; esta autorização a sucede apenas para o tablet.
