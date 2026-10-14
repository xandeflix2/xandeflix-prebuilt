# C11 — Comparação REA de carregamento dos APKs de referência

**Data da coleta:** 2026-10-13  
**Escopo:** análise estática dos APKs colocados na raiz e do APK 1.0.19 do Xandeflix. Nenhum APK foi executado e nenhuma função do produto foi alterada.

## Artefatos e proveniência

| Artefato | SHA-256 | Pacote/versão | APK | Classes JADX | Recursos JADX | Componentes declarados |
|---|---|---|---:|---:|---:|---|
| `xciptv-7-0.apk` | `f88826d1922410a33ba3e4245f1857e3bca8aded2bf2cbe4b7fcac0a53bf0299` | `com.nathnetwork.xciptv` 7.0 (910) | 97.98 MB | 10.062 | 1.541 | 41 activities, 12 services, 11 receivers |
| `ibop.apk` | `e4fbc9704da7b709d5d6e2cb2b0a55357d3626c7ec04017b2c477524a8f1b154` | `com.ibostore.meplayerib4k` 230.2 (2302000) | 81.68 MB | 3.575 | 2.479 | 73 activities, 3 services, 2 receivers, 2 providers |
| `Xandeflix-v1.0.19-duplo-toque.apk` | `401c8dc29e561370a0ffdd7759ba82c1121f62ec5b2ae5032a23c2c078dfba6c` | `com.xandeflix.prebuilt` 1.0.19 (19) | 11.09 MB | 6.563 | 1.513 | 4 activities, 4 services, 3 receivers, 2 providers |

Os dados de classe/manifesto do JADX foram coletados pelo REA com `jadx-headless-mcp` 0.7.1. Os inventários de ZIP e tamanhos de DEX/native libs são observações locais adicionais para contextualizar o footprint; não são medições de tempo de inicialização.

Evidências REA principais:

- XCIPTV Android: `ev_9ac1be2e3f0434803a0262e7e9d83e717aa6bd10a4c1991025b022f6631c6253` (10.062 classes, 1.541 recursos) e `ev_232e6bba14614566af45f8ce3b63bcce8fc7ddf0a18af05809c1057a7efac527` (`SplashVideoActivity.onCreate`).
- IBO Android: `ev_f0e3ca13af7d7649e866557859953a2c13cdf854f61066fc47d7f52b5df30a2e` e `ev_9eddc28d90cda04a2414c0777c927ea0699035eb0b1421e6c0c139c1c02852cd` (`XRuntimeM3uSeriesActivity.onCreate`).
- Xandeflix Android: `ev_fc9f3492af3c85d8c2ce97b9f9c628aa1c93282e23345ad6ea4f27f8489af7eb` e `ev_79b2237e9174f570d196e490aa03d77c5cec202f0c3a17b48915f8136a294b3e` (`MainActivity.onCreate`).
- Inventário de artefato REA: XCIPTV `ev_2621568f0c60229bd8bf760f7e20ff0809ce220f80884ab1f446d1af81f0b6e4`, IBO `ev_87a0e9f65fa095ca7da6e20f612dffdf7ab17c258f8f52ab31a9e4feb735b812`, Xandeflix `ev_3e1afaa9a343ee0cdbfcc6265304a79885cd7a3b333ce70356d8efc6c4d7b749`.

## O que os APKs mostram

### XCIPTV

O launcher é `SplashVideoActivity`. A `onCreate` fixa orientação, infla um layout de splash, cria um `VideoView`, aponta para um recurso de vídeo local e chama `start()`. Ao terminar ou falhar, segue para `SplashActivity`. A segunda tela inicial verifica conectividade, inicia um servidor local quando aplicável, lê preferências, mede a tela e agenda uma ação após 2 segundos. Isso é uma estratégia visual/compatibilidade, não evidência de boot mais rápido.

O APK contém duas DEX e bibliotecas nativas para quatro ABIs. A principal `libvlc.so` aparece em cada ABI (aproximadamente 39–50 MB descompactada por ABI), além de FFmpeg/VLC. O pacote grande e o conjunto de ABIs são um custo de instalação e de carregamento nativo; não é uma referência segura para reduzir o Xandeflix.

### IBO

O launcher é `HomeActivity`; o fluxo de séries também possui a `XRuntimeM3uSeriesActivity`. A `onCreate` decompilada chama `super`, escolhe o layout por modo de tela, infla a tela completa, localiza muitos controles, configura foco/D-pad, preferências e listeners, e só depois conclui a configuração. Isso confirma forte inicialização síncrona de UI.

O APK contém uma DEX e bibliotecas nativas para quatro ABIs, incluindo VLC, IJK/FFmpeg e GVR. Também declara permissões amplas de instalação, overlay e consulta de pacotes. O número menor de classes não significa menor custo de armazenamento ou de runtime.

### Xandeflix 1.0.19

O launcher é `com.xandeflix.prebuilt.MainActivity`. A `onCreate` registra nove plugins nativos antes de `super.onCreate` — player, fonte segura, transporte de fonte, atualização, cache de artwork, Cast e trailer — e depois configura WebView/insets. Esse é o principal ponto nativo que merece medição de cold start, mas a análise estática não permite afirmar que ele seja o gargalo.

O APK não contém bibliotecas nativas próprias e traz um bundle inicial `assets/public/assets/index-BPjJD7RA.js` de aproximadamente 1,40 MB descompactado, CSS de 120 KB e 12 DEX geradas por Capacitor/AndroidX. A origem React importa as páginas principais de forma estática em `src/App.tsx`; por isso, todas elas entram no bundle inicial mesmo quando o usuário abre apenas a Home.

A persistência local já está melhor preparada para aparelhos fracos: o importador grava segmentos em lotes de 2.500 registros, mantém apenas first-fold no `catalog.json`, carrega episódios/temporadas sob demanda e agenda o índice de busca após a promoção. O hook inicial lê o snapshot local e monta apenas esse read model limitado. Essa proteção deve ser preservada.

## Conclusões seguras

1. Não copiar o splash de vídeo do XCIPTV nem a inicialização síncrona extensa do IBO. Elas aumentariam trabalho antes da interação.
2. Não incorporar VLC/IJK/FFmpeg ou quatro ABIs ao Xandeflix. O footprint nativo dos APKs de referência é muito maior que o do Xandeflix.
3. A oportunidade de menor risco e maior retorno é dividir o JavaScript por rota: manter shell/Home, autorização e catálogo first-fold no chunk inicial e carregar sob demanda Live, detalhes, portal, manager/debug e configurações. O contrato de rotas e os componentes existentes devem permanecer iguais; somente o momento do download/parse do módulo muda.
4. Registrar os plugins nativos de forma tardia é uma hipótese de maior risco. Capacitor pode depender do registro durante a criação da Bridge; qualquer tentativa exige teste em Fire Stick, tablet, celular e TV antes de adoção.
5. `minifyEnabled false` está ativo no release (`android/app/build.gradle`). R8/resource shrinking pode reduzir DEX, mas só deve ser avaliado depois de definir regras de keep para Capacitor, plugins e reflexão. Não é uma alteração segura automática.
6. A leitura/parse do first-fold e a construção do `CatalogReadModel` devem ser medidas com os marcos de boot existentes antes de qualquer mudança. Se o tempo estiver aceitável, não há motivo para trocar a estratégia segmentada já consolidada.

## Análise aprofundada do bundle e do caminho nativo

O diretório extraído do APK 1.0.19 foi analisado pelo REA sem executar JavaScript ou Android. A análise reteve `ev_3060303a5297ed5067df11e6293d8f5d25d0b1b6e8e2fb1383a039511733de0d` e sua visão resumida `ev_b1f6faafbf239d41e378a3d0760d0ba528efc6198bdd6cd656c046f295e245bc`. Foram examinados 9 arquivos relevantes, 1.466.068 bytes de texto e 8 arquivos JavaScript parseados, sem falhas de parsing. A cobertura semântica ficou parcial porque o bundle principal esgotou o limite de heap do worker; essa limitação está explicitamente registrada pelo REA.

O inventário de módulos do REA (`ev_54c2a7849540dd30738d27d7b089838c83d19c907c4883f62d0a92563d1a01cb`) encontrou o bundle principal, `native-bridge.js`, os stubs Web do Capacitor e o módulo de identidade de posters. A inspeção textual do bundle compilado encontrou quatro `import()` dinâmicos, todos associados a adaptadores de plataforma ou serviços auxiliares (`FilesystemWeb`, `BrowserWeb`, `ShareWeb` e identidade de poster), e nenhuma ocorrência de `React.lazy`. Portanto, os imports dinâmicos existentes não dividem as páginas de navegação; o custo das páginas continua concentrado no chunk inicial. Essa conclusão também coincide com os imports estáticos observados em `src/App.tsx`.

No Android, a inspeção direta da classe `MainActivity` (`ev_0a731a9c24ac767a0ba36de8a0c06d2cad6f7cd137d75122b09fde7b18ce3ea1`) e de `onCreate` (`ev_cb06cac58d3e48b56d733355671d5e976a3df482227574ae8abbbf8acfefeb29`) confirma nove chamadas de `registerPlugin` antes de `super.onCreate`. A evidência não demonstra que cada plugin faça trabalho pesado nesse instante; ela identifica apenas o ponto que deve ser medido. O `AppUpdatesPlugin` tem um executor próprio e, em `handleOnResume`, publica o estado local e agenda o restante em worker (`ev_cce3af26bb9e73ae84da077e936a4425102f0fd29a314eb8a3c7ec425bb13a8f`), o que reduz a justificativa para mover esse plugin sem um baseline de tempo.

Essa etapa reforça uma ordem segura: primeiro medir os marcos de boot e o tamanho/tempo de parse do bundle; depois experimentar code splitting apenas para rotas secundárias. A análise não encontrou evidência para copiar o splash de vídeo do XCIPTV, adicionar bibliotecas nativas dos APKs de referência ou remover o registro de plugins de forma ampla.

## Baseline físico inicial

Em 2026-10-13, o Fire Stick conectado por ADB foi identificado como `AFTSS`/Android 9 (`sheldon`, serial `G071CQ070344374G`). Ele possui o pacote Xandeflix `com.xandeflix.prebuilt`, `versionName=1.0` e `versionCode=1`, instalado em 2026-09-30 e atualizado em 2026-10-08.

Após `force-stop` e uma abertura de `com.xandeflix.prebuilt/.MainActivity`, o comando `am start -W` retornou `ThisTime=3562 ms`, `TotalTime=3137 ms` e `WaitTime=4005 ms`. Logo depois, `dumpsys meminfo` informou `TOTAL PSS=125663 kB` e `TOTAL SWAP PSS=5116 kB`. É uma amostra única, sem controle do estado do catálogo, rede ou temperatura; serve como baseline comparativo e não como SLA.

Para medir especificamente o custo pós-instalação, o pacote anterior foi removido e o APK atual foi instalado sem preservar dados. A instalação limpa ficou em `versionCode=19`/`versionName=1.0.19`, com `firstInstallTime=2026-10-13 18:19:30` e SHA-256 `401c8dc29e561370a0ffdd7759ba82c1121f62ec5b2ae5032a23c2c078dfba6c`. Na primeira abertura, `ThisTime=5415 ms`, `TotalTime=5119 ms` e `WaitTime=5695 ms`; o processo informou `TOTAL PSS=92044 kB` e `TOTAL SWAP PSS=57 kB`. Esta é a referência correta para o problema relatado de primeira abertura, ainda sendo uma única amostra.

## Plano incremental proposto (ainda não aplicado)

**Fase A — baseline:** medir `T1_WEBVIEW_READY`, `T2_REACT_MOUNT`, `T5_HOME_SHELL_VISIBLE`, `T6_NAV_INTERACTIVE` e o tamanho dos chunks em um aparelho fraco, com catálogo local ativo e em primeiro sync.

**Fase B — code splitting:** converter imports de páginas não iniciais para `React.lazy`/`Suspense`, com fallback já existente. Validar todas as rotas, back físico, D-pad, Cast, player nativo, atualização, ativação e manager/debug.

**Fase C — nativo opcional:** somente se o baseline apontar custo no `MainActivity.onCreate`, avaliar registro tardio por plugin, um plugin por vez, sem alterar player, fonte segura ou atualização até haver teste físico.

**Fase D — shrink release:** testar R8 e remoção de recursos em build separado, comparar APK, instalação, ativação, importação, busca, artwork, live e reprodução; promover apenas se não houver regressão.

Nenhuma fase acima foi implementada neste relatório. A autorização necessária para uma futura alteração deve indicar a fase e os dispositivos de validação.

## Limitações

- REA é análise estática: os APKs não foram executados e não há conclusão de tempo, RAM, FPS ou consumo de rede.
- A primeira coleta Android do XCIPTV teve limpeza incompleta do processo JADX por volume; a coleta filtrada confirmou o carregamento e a classe de splash. A enumeração de classes do REA também retornou uma inconsistência de inventário; esse ramo foi tratado como limitação, não como evidência de comportamento.
- O APK não revela o código-fonte original nem autoriza copiar implementação. As recomendações são arquiteturais e devem respeitar os contratos do repositório.

## Correção C104 e medição física posterior — 2026-10-14

A falha de primeira sincronização foi investigada por CDP/ADB e código próprio,
sem copiar implementação dos APKs analisados. A interpretação inicial de que o
arquivo53,6MB já estava completo foi superseded: ele cresceu para80,6MB e o APK19
acabou promovendo o catálogo às19:09 em2026-10-13. Telemetria confirmou~40min no
download antes do parser e~3m32s entre início do parse e promoção. REA não provou
essa causa; forneceu somente o comparativo estático anterior.

C104 libera leitura incremental do arquivo Android somente na importação sem
digest anterior, conserva o atalho C60 para conteúdo inalterado e mantém EOF/
integridade/promoção completos. Testes sintéticos e ponte real passaram; usuário
solicitou nova instalação limpa e autorizou depois o novo dispositivo pelo painel.
No fluxo real, parser começou5,8s após fetch e primeiro batch em9,6s, com download
ainda em andamento. Home/hero/capas completos continuam sendo medidos. Nenhuma
fase de code splitting/R8 do plano acima foi implementada. Spec, artefato,
evidência corrigida e limites em [C104](C11_PROGRESSIVE_SOURCE_DOWNLOAD.md).

