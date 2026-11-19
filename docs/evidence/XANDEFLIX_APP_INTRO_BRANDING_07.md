# XANDEFLIX-APP-INTRO-BRANDING-07 — especificação antes do código

Gate nominal autorizado em26/10/2026. Somente implementação local, recursos, testes/web build e compilação nativa de testes. Sem APK instalável/assemble/package/bundle de distribuição, instalação, operações em aparelhos, publicação Git/deploy/backend. Nenhuma mudança em trailer/retorno/FPS/rede/C9/autoridade. As falhas06 continuam abertas. Nenhum04 incorporado.

Base integral: physical-validation-06-20261025/workspace (1439 arquivos,37 recibos,924 protegidos), fonte funcional03. CLOSURE/manifests/artefatos03/04/05/06 e root verificados e congelados. Clone independente com overlay integral, sem reconstruir da main incompleta. Origin canônico, HEADd8a74102124fbb8a3f013f6fd8a502519c1db4b8, branch fix/source-output-format-recovery, root mainb3fc8d1;10 diferenças L1 preservadas. Pasta histórica somente leitura. Não normalizar estados ou recibos.

## Recursos e autoridade

Vídeos originais conferem76fb4e…(vertical) e41741f8…(horizontal),8s declarados; integrar bytes exatos em res/raw, sem cortar/reencode. Auditoria MP4 independente verificará dimensões/duração/codec/amostras/áudio; não confundir metadata com decoder físico. O PNG anexado cf422e99… difere do1de24356… descrito na ordem. Após esclarecimento, o usuário determinou literalmente “preciso que use a ogo anexada”; essa instrução mais recente substitui a escolha anterior. Fonte efetiva cf422e99…, original preservado em drawable-nodpi/intro_brand.png. Derivados determinísticos por recorte técnico do símbolo/escala contain/mascara, sem geração por IA/redesenho/retoque de marca. Nova sidebar NÃO alterada. Manifesto com crop, dimensões e hashes de cada derivado.

## Arquitetura e estados

MainActivity/Capacitor7 preservados, sem segunda Activity. Um AppIntroController nativo possui um PlayerView/SurfaceView local e um ExoPlayer Media3 1.5.1, dependência já existente. Não usa PublicTrailerPlugin nem qualquer player/C9 do catálogo. Bridge criado pelo caminho original do Capacitor; sem override de load e sem simular onStart/onResume do bridge. Index aponta a um entry mínimo intro-main.ts que espera AppIntro.ready antes de importar uma única vez main.tsx INALTERADO. CSS original carregado no prelude e WebView com fundo preto evitam flash branco. Não montar React nem iniciar bootstrap/autenticação/catálogo atrás da intro. Web e entradas públicas existentes continuam sem vídeo Android; falha/ausência/timeout da ponte nunca bloqueia a importação normal.

Mermaid:

    launcher frio elegível → WAITING → PREPARING → PLAYING → FINISHED → entrada web original
                                         ↓           ↓
                              erro/timeout/memória/lifecycle/skip → liberar → estática → entrada web original
    deep link/restauração/processo vivo → FINISHED inelegível → entrada original sem intro

Admissão explícita única em RAM por processo para a primeira criação lógica da MainActivity: ACTION_MAIN + LAUNCHER/LEANBACK_LAUNCHER, sem URI e savedInstanceState ausente. Qualquer primeiro ingresso não elegível consome a decisão, impedindo replay posterior no processo. Sem persistência ligada a auth/home. onNewIntent nunca reinicia. saved state/restauração e Activity recriada não repetem. Um processo futuro frio permite nova intro. Serviços sem UI não criam player; não afirmar medição de cold-process a partir de metadados locais.

Escolha no primeiro layout visível da área real: TV/Leanback por capabilities usa horizontal; janela retrato usa vertical, paisagem/quadrada horizontal. Nenhum modelo comercial. Escolha fica congelada na sessão. Rotações/redimensionamentos ajustam contain/fit mantendo posição, sem segundo player ou alternar recursos. PhoneUiOrientation original é adiada somente enquanto intro ativa, restaurada ao final. Demais layouts/perfis e rotas originais permanecem.

Iniciar prepare somente em onResume/área pronta. Primeiro quadro via onRenderedFirstFrame; fim normal somente STATE_ENDED. Deadline primeiro quadro4s (mídia local, não há espera de rede); teto total13s =4s preparação+8s mídia+1s de entrega de evento, terminando só em falha se exceder. Não truncar vídeo normal por timer8s. Fallback estático250ms no foreground, imediato se lifecycle inviável. Pressão de memória do ActivityManager ou trim encerra/evita player. Liberação idempotente: callbacks próprios, playerView.player=null, release do ExoPlayer, itens/surface/decoder/áudio/foco, overlay removido, um único resultado. Nenhum timer permanente.

Áudio original sem modificar volume do SO: somente ringer normal, volume de mídia>0 e nenhuma música externa ativa; request transitório MAY_DUCK enquanto Activity resumed. Negado/erro/perda de foco/música ativa → reprodução silenciosa restante, sem roubar/retomar foco. Media3 handleAudioFocus=false porque o controller mantém esse lease explícito e o abandona na liberação. Uma única trilha/player. Background/onPause/onStop/onDestroy cancelam e liberam, sem replay no retorno; confirmação de som/decoder físico pendente.

Pular: botão acessível “Pular introdução” no canto inferior com insets seguros; Enter/DPAD_CENTER/NUMPAD_ENTER/Back, keydown e keyup/repeat consumidos até soltar a tecla. Back dispatcher AndroidX exclusivo durante intro; depois removido e comportamento anterior intacto. Nenhuma confirmação, finish da Activity, navegação forçada à Home ou propagação da tecla à tela seguinte. A ponte entrega apenas motivo técnico, sem aceitar URI/credenciais/conteúdo.

## Identidade e recursos

Gerar legacy/round/foreground por densidade, símbolo XF na zona segura circular do adaptive icon (diagonal do conteúdo≤64dp no canvas108dp). Fundo preto; monochrome separado para máscara Android13. Banner Leanback320×180 com símbolo e nome completo. Splashs mantêm dimensões existentes com contain da composição completa e fundo preto; Theme.SplashScreen usa preto/postSplashScreenTheme e ícone nativo, nunca MP4 no recurso da splash. installSplashScreen antes de super.onCreate. PNG oficial original intocado, hashes separados dos derivados. Package/manifest/versão/dependências/assinatura/backup intactos.

## Testes e aceite

Antes de produto: fresh canon:check, canon:test, C11. Testes Java reais da política usada pelo controller: orientações Phone/Tablet/TV, entrada fria/restauração/deep link/warm, rotação sem duplicação, fim/skip/erros/timeouts/lifecycle/memória idempotentes, barreira de tecla e áudio permitido/negado. Integração Node/TS real da porta de entrada: aguarda nativo, web imediato, timeout/falha/reentrada, cancelamento e importação única; original main.tsx/players/auth/catalog byte-identical; símbolos/PNG/MP4 e XML válidos. Registrar suíte nova no runner canônico, preservar196 controles/33 suítes; acrescentar negativos para ausência/tamper de intro/ativos, sem alterar verificadores/negativos antigos. Grants novos com predecessores reais e hashes LF/binários antes/depois;37 recibos antigos congelados.

Após código congelado: canon:check/test/C11, typecheck, update/security/playback checks, build web, site:build/contratos de artefato quando pertinente ao index, Gradle --offline testDebugUnitTest somente, sem assemble/package/install. Revalidar CANON/C11 após tarefas. Logs com exit codes, erros intermediários preservados, nenhuma assertion removida/timeout ampliado para PASS. Inspecionar montagem técnica dos recursos e previews derivados. Física/CPU/PSS/primeiro quadro/splash/primeira tela/catalogo sem APK novo ficam PENDENTES, não fabricar números; medir tamanho byte-a-byte e delta de assets/build local. Plano para teste futuro em AFTSS/SM-S926B/SM-X610/outraTV, offline, skip, áudio, lifecycle e recursos. Rollback local preserva baseline06 e APK03; não executar rollback físico. Resultado esperado só após todos testes locais aprovados, sem blocker; NEXT_GATE_STARTED=NAO.

Fontes primárias consultadas: [splash Android](https://developer.android.com/develop/ui/views/launch/splash-screen/migrate), [lifecycle Media3](https://developer.android.com/media/implement/playback-app), [audio focus](https://developer.android.com/media/optimize/audio-focus), [eventos do player](https://developer.android.com/media/media3/exoplayer/listening-to-player-events). APIs compiladas contra Media31.5.1 existente; não adotar versão nova da documentação. BridgeActivity do Capacitor7 foi inspecionada localmente.

## Allowlist fechada

- android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java
- android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroPolicy.java
- android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroController.java
- android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroPlugin.java
- src/intro-main.ts
- src/bootstrap/app-intro-gate.ts
- index.html
- android/app/src/main/res/layout/app_intro.xml
- android/app/src/main/res/values/styles.xml
- android/app/src/main/res/values/strings.xml
- android/app/src/main/res/raw/intro_vertical.mp4
- android/app/src/main/res/raw/intro_horizontal.mp4
- android/app/src/main/res/drawable-nodpi/intro_brand.png
- android/app/src/main/res/drawable-nodpi/intro_monochrome.png
- android/app/src/main/res/drawable/ic_launcher_background.xml
- android/app/src/main/res/drawable/splash.png
- android/app/src/main/res/drawable-land-hdpi/splash.png
- android/app/src/main/res/drawable-land-mdpi/splash.png
- android/app/src/main/res/drawable-land-xhdpi/splash.png
- android/app/src/main/res/drawable-land-xxhdpi/splash.png
- android/app/src/main/res/drawable-land-xxxhdpi/splash.png
- android/app/src/main/res/drawable-port-hdpi/splash.png
- android/app/src/main/res/drawable-port-mdpi/splash.png
- android/app/src/main/res/drawable-port-xhdpi/splash.png
- android/app/src/main/res/drawable-port-xxhdpi/splash.png
- android/app/src/main/res/drawable-port-xxxhdpi/splash.png
- android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml
- android/app/src/main/res/drawable-xhdpi/xandeflix_tv_banner.png
- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
- android/app/src/main/res/mipmap-anydpi-v33/ic_launcher.xml
- android/app/src/main/res/mipmap-anydpi-v33/ic_launcher_round.xml
- android/app/src/main/res/mipmap-hdpi/ic_launcher.png
- android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-television-xhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-television-xhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
- android/app/src/main/res/values/ic_launcher_background.xml
- scripts/test-app-intro-branding-07.mjs
- scripts/test-canonical-regression.mjs
- android/app/src/test/java/com/xandeflix/prebuilt/intro/AppIntroPolicyTest.java
- docs/architecture/XANDEFLIX_APP_INTRO_BRANDING_07.md
- docs/evidence/XANDEFLIX_APP_INTRO_BRANDING_07.md
- docs/governance/authorizations/CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Autorização UTF8/LF SHA256 43b7e53495291945e38729cb514547bfedd214509dc3bd32c8fa001cbd6a42f2. Última escolha de PNG em ASSET_AUTHORITY_ADDENDUM.json. Novos grants cobrem somente o delta efetivo; quatro documentos normativos append-only.

## Ordem nominal

```text
# XANDEFLIX PREBUILT — IMPLEMENTAÇÃO DA INTRO CINEMATOGRÁFICA E NOVA IDENTIDADE VISUAL

**GATE PROPOSTO:** XANDEFLIX-APP-INTRO-BRANDING-07  
**TIPO:** Implementação funcional e atualização de identidade visual  
**PRIORIDADE:** ALTA  
**MODALIDADE:** SPEC-BEFORE-CODE + IMPLEMENTAÇÃO LOCAL CONTROLADA  
**REPOSITÓRIO:** xandeflix2/xandeflix-prebuilt  
**APLICATIVO:** com.xandeflix.prebuilt  
**PLATAFORMAS:** Android Phone, Android Tablet, Fire Stick e Android TV  
**PUBLICAÇÃO:** NÃO AUTORIZADA

## 1. CONTEXTO E ESTADO DO PROJETO

O Xandeflix concluiu o desenvolvimento local dos candidatos 03 e 04.

O candidato 03 foi instalado e submetido à homologação física parcial no gate XANDEFLIX-PHYSICAL-VALIDATION-06.

Resultados relevantes:

- O APK candidato 03 foi confirmado nos três dispositivos avaliados.
- O controle de dados móveis desenvolvido no ciclo 04 não integra o APK instalado.
- Foram identificadas falhas na exibição do trailer fora dos limites do cartão no Fire Stick.
- Foi identificada falha de retorno à grade após navegação para Detalhes.
- A meta de 60 FPS no Fire Stick continua não homologada.
- A causa das piscadas intermitentes permanece aberta.

Essas pendências não deverão ser confundidas com a nova funcionalidade de abertura.

**DETERMINAÇÃO:** criar um ciclo independente de implementação, preservando integralmente as evidências, os candidatos anteriores e o estado dos dispositivos.

Não incorporar automaticamente o ciclo 04, alterar o player de trailers da Home ou tentar corrigir as pendências do gate 06 dentro desta demanda.

## 2. OBJETIVO PRINCIPAL

Implementar uma abertura cinematográfica nativa ou adequadamente integrada ao ciclo de inicialização Android, utilizando os vídeos originais fornecidos pelo proprietário do projeto.

O vídeo deverá ser apresentado após a etapa de splash controlada pelo sistema operacional, durante a entrada inicial no aplicativo.

A funcionalidade também deverá atualizar os recursos de identidade visual utilizados na apresentação e no launcher do Xandeflix.

Objetivos:

1. Exibir uma intro cinematográfica ao iniciar o aplicativo pelo launcher em uma abertura fria.
2. Selecionar automaticamente a versão vertical ou horizontal apropriada.
3. Preservar integralmente a identidade original da marca.
4. Permitir que o usuário pule a intro.
5. Evitar reprodução repetida durante navegação interna ou retorno do segundo plano.
6. Garantir fallback seguro se a reprodução falhar.
7. Não prejudicar o carregamento, a autenticação ou o catálogo.
8. Preservar o desempenho em dispositivos de baixo processamento.

## 3. ARQUIVOS OFICIAIS FORNECIDOS

Os arquivos anexados são os recursos de referência obrigatórios desta demanda.

### 3.1. Vídeo vertical

Arquivo:

`Intro Vertical(1).mp4`

Características verificadas:

- Resolução: 1080 × 1920.
- Proporção: 9:16.
- Duração: 8 segundos.
- Codec: H.264 High Profile.
- Frame rate: 24 FPS.
- Pixel format: yuv420p.
- Áudio: AAC-LC, estéreo, 48 kHz.
- Tamanho: 853.983 bytes.

SHA256 original:

`76fb4e7366173b1764441299b188ff93c2af9bd5969f4618a0688d7bae2d113b`

### 3.2. Vídeo horizontal

Arquivo:

`XANDEFLIX_logo_animation_guide_1080p_20261026010139(1).mp4`

Características verificadas:

- Resolução: 1920 × 1080.
- Proporção: 16:9.
- Duração: 8 segundos.
- Codec: H.264 High Profile.
- Frame rate: 24 FPS.
- Pixel format: yuv420p.
- Áudio: AAC-LC, estéreo, 48 kHz.
- Tamanho: 905.945 bytes.

SHA256 original:

`41741f8df356ad5440fb7eebf7da3edb8ef93353610ff54e29f8e22067cad83f`

### 3.3. Nova identidade visual

Arquivo:

`Logótipo XANDEFLIX em Metal e Vermelho(2).png`

Características:

- Resolução: 1536 × 1024.
- Formato PNG.
- Marca XANDEFLIX com símbolo XF em vermelho e grafite.
- Fundo preto opaco.

SHA256 original:

`1de243561b55d59f499c6bd01fe095c7e3c526a320ae67af6856df2930ecbcfc`

A imagem deverá ser a referência oficial para os novos recursos visuais do aplicativo.

Os arquivos originais são imutáveis. Qualquer adaptação necessária deverá gerar um arquivo derivado separado, com sua própria identificação e hash.

Se os arquivos não estiverem acessíveis no workspace do executor, interromper somente a etapa dependente desses recursos e informar exatamente quais arquivos precisam ser disponibilizados. Não criar substitutos fictícios.

## 4. ARQUITETURA DE INICIALIZAÇÃO

### 4.1. Requisito obrigatório

Examinar a implementação atual da inicialização do Xandeflix, incluindo:

- MainActivity.
- Splash screen Android.
- Capacitor 7.
- WebView principal.
- Fluxo de bootstrap.
- Autenticação e ativação.
- Inicialização do catálogo local.
- Fluxo de loading da Home.
- Eventos de lifecycle Android.
- Recuperação de Activities.
- Player Media3 existente.

Identificar a arquitetura mais segura para incluir a intro sem causar conflitos com o bootstrap atual.

### 4.2. Fluxo esperado

A sequência lógica deverá ser:

1. Usuário toca ou seleciona o ícone do Xandeflix.
2. Android inicia o processo e apresenta sua splash nativa.
3. O aplicativo inicializa os componentes essenciais.
4. A interface de intro é apresentada.
5. O vídeo adequado começa a reproduzir.
6. Em paralelo, o aplicativo pode preparar os recursos necessários à próxima tela, sem disputas excessivas de CPU ou memória.
7. Ao terminar ou pular o vídeo, a intro libera seus recursos.
8. O aplicativo apresenta a próxima tela legítima de acordo com o estado de autenticação, ativação e carregamento.

Não assumir que a Home será sempre o destino. Respeitar as etapas de segurança e inicialização existentes.

### 4.3. Restrição de plataforma

O MP4 não deve ser tratado como um recurso diretamente reproduzível pela splash nativa do Android.

O vídeo deverá iniciar em uma superfície de reprodução pertencente ao aplicativo, após a inicialização necessária para isso.

Avaliar uma solução nativa Android com Media3/ExoPlayer ou mecanismo equivalente já disponível, comparando custo, compatibilidade e lifecycle com uma solução baseada em WebView.

Não utilizar o PublicTrailerPlugin da Home como atalho sem comprovação de segurança. Sua apresentação em WebView nativa ainda possui um FAIL visual aberto no Fire Stick.

A intro deverá ser isolada dessa implementação defeituosa.

## 5. SELEÇÃO AUTOMÁTICA DO VÍDEO

### Android Phone

- Orientação retrato: vídeo vertical.
- Orientação paisagem: vídeo horizontal.
- Respeitar o espaço disponível e a proporção do vídeo.

### Android Tablet

- Orientação retrato: vídeo vertical.
- Orientação paisagem: vídeo horizontal.
- Preservar layouts específicos do aparelho.

### Fire Stick / Android TV

- Utilizar o vídeo horizontal.
- Priorizar reprodução local com hardware decoder quando disponível.
- Não criar grandes superfícies adicionais de vídeo.

### Regras complementares

Detectar a orientação efetiva da janela, não apenas resolução ou nome comercial do aparelho.

Em aparelhos dobráveis ou com múltiplas janelas, adotar o formato correspondente à área de apresentação disponível.

Se houver rotação durante a intro, evitar reiniciar o vídeo repetidamente. Definir uma política segura para manter a mídia em execução ou fazer uma única adaptação controlada.

Não iniciar simultaneamente as duas versões do vídeo.

## 6. REPRODUÇÃO CINEMATOGRÁFICA

### 6.1. Duração

Preservar inicialmente os 8 segundos completos dos arquivos originais.

Não cortar, acelerar, desacelerar ou modificar o conteúdo dos vídeos sem justificativa aprovada.

### 6.2. Apresentação

- Fundo preto.
- Vídeo centralizado.
- Proporção preservada.
- Sem esticamento.
- Sem barras de controle.
- Sem botões do player principal.
- Sem overlays de catálogo.
- Sem imagem distorcida.
- Sem tela branca entre splash e intro.
- Sem reinicialização da navegação.

Priorizar `contain` ou comportamento equivalente, evitando cortes da marca e dos textos existentes no vídeo.

### 6.3. Áudio

Os vídeos originais contêm áudio AAC.

Preservar a trilha original quando a plataforma permitir.

Respeitar o volume e o estado de áudio do sistema, inclusive modo silencioso e políticas de audio focus.

Não interromper indevidamente outros aplicativos de áudio.

Não iniciar múltiplas instâncias de áudio.

Caso não seja possível obter reprodução com áudio de forma segura, usar fallback silencioso e registrar o motivo.

### 6.4. Encerramento

A intro deverá ser finalizada por:

- Evento real de término do vídeo.
- Comando de pular.
- Falha de decoder.
- Indisponibilidade do recurso.
- Condição de lifecycle que impeça sua continuidade.
- Timeout de segurança tecnicamente justificado.

O fim da intro deverá ocorrer apenas uma vez.

Evitar eventos duplicados que abram a Home duas vezes ou recriem o bootstrap.

## 7. FUNÇÃO PULAR INTRO

### Fire Stick e Android TV

Permitir pular pelos comandos:

- Enter.
- OK.
- Back.

Esses comandos deverão ser tratados exclusivamente pela interface de intro enquanto ela estiver ativa.

Ao pressionar Back durante a intro, o comportamento esperado é encerrar a intro e prosseguir para a próxima tela adequada, sem sair acidentalmente do aplicativo.

### Android Phone e Tablet

Permitir pular por toque em um controle visual discreto e acessível.

O controle poderá ser denominado:

**Pular introdução**

Não posicionar controles sobre o símbolo principal da marca.

### Requisitos

- Resposta imediata.
- Nenhuma confirmação adicional.
- Nenhuma segunda Activity criada indevidamente.
- Nenhum áudio residual.
- Liberação do decoder.
- Nenhuma interferência no player principal.
- Nenhum bloqueio permanente da UI.

Evitar que a mesma tecla utilizada para pular a intro seja propagada imediatamente para um botão da Home, causando seleção involuntária.

## 8. POLÍTICA DE QUANDO EXIBIR A INTRO

Implementar a intro somente em entradas apropriadas pelo launcher em inicializações frias do aplicativo.

Não reproduzir automaticamente quando:

- O usuário navega entre páginas.
- Abre ou fecha filmes e séries.
- Retorna do player.
- Volta da tela de Detalhes.
- Retorna à Home.
- Alterna entre aplicativos mantendo o processo vivo.
- Retoma o aplicativo do background.
- Ocorre simples recriação de Activity ou mudança de orientação sem novo lançamento lógico.

Evitar loops de intro por eventos de lifecycle.

Ao abrir o aplicativo por um deep link ou ação específica do sistema, preservar o destino legítimo e evitar interceptação indevida.

A elegibilidade da intro deverá ser controlada por estado explícito, separado do estado de autenticação, da Home e dos players.

## 9. NOVA IDENTIDADE VISUAL DO APLICATIVO

### 9.1. Objetivo

Utilizar o PNG oficial anexado como referência para atualizar o ícone e os recursos de apresentação do aplicativo Android.

### 9.2. Recursos necessários

Avaliar e gerar os recursos apropriados para:

- Launcher icon.
- Adaptive icon.
- Ícone foreground.
- Ícone background.
- Versões mipmap adequadas.
- Recursos de densidade.
- Splash estática.
- Android TV launcher.
- Banner/arte de apresentação Leanback, quando exigido.
- Recursos de marca em telas de inicialização.

### 9.3. Regras de identidade

Preservar:

- Desenho do símbolo XF.
- Cores originais.
- Proporções.
- Tipografia.
- Acabamento metálico.
- Identidade XANDEFLIX.

É permitido gerar versões derivadas para adequação às máscaras e proporções exigidas pelas plataformas.

Como a imagem possui fundo preto opaco, avaliar a extração técnica do símbolo para foreground transparente quando necessária ao ícone adaptativo.

Não redesenhar a marca ou criar outro logotipo.

Não utilizar o arquivo panorâmico inteiro como foreground de um ícone pequeno se isso comprometer sua legibilidade.

Para ícones compactos, priorizar o símbolo XF original. Para banners e apresentações amplas, permitir a composição com o nome completo XANDEFLIX.

### 9.4. Preservação

Não alterar automaticamente a logo interna da sidebar, já implementada no candidato 03, a menos que isso seja explicitamente necessário para a identidade de inicialização e esteja dentro da nova allowlist.

Não alterar package name, assinatura, identidade do aplicativo, configurações de licença ou canais de atualização.

## 10. DESEMPENHO E ISOLAMENTO

O Fire Stick apresentou desempenho insatisfatório durante a homologação do candidato 03.

A intro não deverá introduzir novos gargalos permanentes.

Requisitos:

1. Um único player de intro ativo.
2. Um único decoder em uso para a intro.
3. Liberação completa de recursos ao terminar ou pular.
4. Nenhuma instância residual de reprodução.
5. Sem carregamento simultâneo dos vídeos vertical e horizontal.
6. Sem requisição de streaming para obter a intro.
7. Sem dependência de TMDB, fontes, Supabase ou internet.
8. Sem timers ou observers permanentes desnecessários.
9. Sem reconstrução global da interface.
10. Sem retenção de buffers de vídeo após a intro.

Avaliar se a preparação paralela da Home pode ocorrer sem competir excessivamente com a decodificação de vídeo.

Se o dispositivo estiver sob pressão de memória ou não conseguir iniciar a intro de maneira segura, utilizar fallback estático.

A intro deverá ser empacotada localmente e funcionar offline.

Não introduzir uma regressão no tempo de bootstrap técnico do aplicativo além do tempo deliberadamente destinado à apresentação da marca.

Medir separadamente:

- Início do processo.
- Apresentação da splash nativa.
- Primeiro quadro da intro.
- Tempo de reprodução da intro.
- Liberação do player.
- Primeira tela interativa.
- Tempo de preparação do catálogo.
- CPU e memória durante a intro.
- Memória após encerramento.

Não utilizar o tempo de vídeo como justificativa para ocultar travamentos ou falhas de inicialização.

## 11. TRATAMENTO DE FALHAS E FALLBACK

O aplicativo deverá continuar funcionando mesmo que a intro não seja reproduzida.

Prever:

- Arquivo ausente.
- Erro de decodificação.
- Codec não suportado no aparelho.
- Erro de inicialização do player.
- Surface indisponível.
- Recriação de Activity.
- Processo enviado ao background.
- Falha de áudio.
- Timeout.
- Falta de memória.
- Falha na apresentação do primeiro quadro.

Fallback obrigatório:

1. Encerrar a tentativa defeituosa.
2. Liberar recursos.
3. Apresentar a identidade estática apropriada.
4. Continuar o fluxo normal do aplicativo.
5. Registrar diagnóstico sanitizado.

Não reiniciar indefinidamente a intro.

Não reiniciar o processo inteiro para tratar falha exclusivamente visual.

Não invalidar autenticação, fontes ou catálogo.

## 12. TESTES AUTOMATIZADOS OBRIGATÓRIOS

Criar testes para os seguintes cenários:

| Cenário | Resultado esperado |
|---|---|
| Cold start no celular retrato | Intro vertical |
| Cold start no celular paisagem | Intro horizontal |
| Tablet retrato | Intro vertical |
| Tablet paisagem | Intro horizontal |
| Fire Stick | Intro horizontal |
| Android TV | Intro horizontal |
| Reprodução normal | Encerra após vídeo |
| Enter/OK | Pula imediatamente |
| Back durante intro | Pula sem sair indevidamente |
| Toque em Pular | Prossegue ao aplicativo |
| Reabertura com processo ativo | Não repete intro |
| Retorno do background | Não repete intro |
| Rotação da tela | Sem loop ou players duplicados |
| Falha de decoder | Fallback estático |
| Arquivo indisponível | Entrada normal preservada |
| Aplicativo offline | Intro local funciona |
| Intro encerrada | Nenhum player residual |
| Inicialização com ativação pendente | Fluxo de ativação preservado |
| Ícones Android | Recursos válidos e integrados |
| Ícones TV | Recursos válidos e proporcionais |

Testes automatizados não equivalem a homologação física de decoder, áudio ou exibição da splash.

## 13. VALIDAÇÃO FÍSICA NECESSÁRIA

Após autorização específica de APK e instalação, testar em:

**Fire Stick AFTSS**

- Abertura a frio.
- Reprodução horizontal.
- Audio focus.
- Enter/Back.
- Encerramento e liberação de recursos.
- Memória e CPU antes/depois.
- Ausência de telas pretas anormais ou piscadas.
- Retorno à interface normal.

**Galaxy S24+ / SM-S926B**

- Retrato e paisagem.
- Intro vertical e horizontal.
- Toque para pular.
- Background/foreground.
- Fullscreen.
- Áudio.
- Retorno ao aplicativo sem repetição.

**Tablet SM-X610**

- Retrato e paisagem.
- Alteração de orientação.
- Reprodução sem distorção.
- Toque e controle externo, quando aplicável.
- Liberação de recursos.
- Navegação após a intro.

Validar também outro Android TV quando disponível, sem declarar PASS na ausência do dispositivo.

## 14. GOVERNANÇA CANON/C11

Antes de qualquer alteração:

1. Identificar o workspace operacional correto.
2. Conferir a baseline fechada de origem.
3. Conferir hashes, CLOSURE e recibos.
4. Identificar diferenças locais preexistentes.
5. Definir allowlist de arquivos.
6. Registrar especificação antes do código.
7. Identificar arquivos protegidos.
8. Preparar grants e recibos necessários.
9. Preservar todos os recibos históricos.
10. Definir rollback e critérios de aceitação.

**Base proposta:** candidato 03 fechado, para manter compatibilidade com os APKs atualmente instalados.

O candidato 04 deverá permanecer preservado e independente. Não incorporá-lo neste gate sem análise explícita de integração e autorização correspondente.

Não utilizar HEAD ou main incompleta como substitutos da baseline operacional fechada.

Respeitar contratos de identidade, licenciamento, segurança, fonte, importação, cache, arte e atualização.

## 15. EXECUÇÃO AUTÔNOMA DO AGENTE

### FASE A — Auditoria dos arquivos e arquitetura

- Confirmar integridade dos arquivos recebidos.
- Inspecionar splash e inicialização existentes.
- Identificar estratégia de reprodução mais segura.
- Examinar recursos de ícones e banners.
- Determinar os pontos mínimos de alteração.

### FASE B — Especificação técnica

Criar a especificação antes do código, contendo:

- Diagrama de estados da intro.
- Critérios de cold start.
- Seleção de mídia.
- Lifecycle.
- Política de cancelamento.
- Tratamento de audio focus.
- Fallback.
- Integração com bootstrap.
- Plano de testes.
- Allowlist.
- Riscos e rollback.

### FASE C — Implementação local

Implementar autonomamente os recursos autorizados.

Preservar os arquivos originais.

Não misturar correções de trailers, FPS, D-pad ou rede com a intro.

### FASE D — Validação

Executar as verificações oficiais pertinentes:

- CANON.
- C11.
- Typecheck.
- Testes unitários e de integração.
- Build web.
- Compilação nativa de testes Android.
- Validação dos recursos visuais.
- Testes de lifecycle e fallback.
- Regressões do fluxo de inicialização.

Executar os comandos oficiais adequados à arquitetura e registrar seus exit codes.

Não alterar testes ou limites apenas para conseguir PASS.

### FASE E — Fechamento

Consolidar o estado final, os arquivos alterados e os resultados.

Não gerar APK instalável nem realizar instalação sem gate/autorização específica.

## 16. RELATÓRIO FINAL OBRIGATÓRIO

Produzir:

**XANDEFLIX — RELATÓRIO DE IMPLEMENTAÇÃO DA INTRO E IDENTIDADE VISUAL — GATE 07**

O documento deverá conter:

1. Resumo executivo.
2. Estado e integridade do candidato-base.
3. Arquitetura escolhida para a intro.
4. Motivo da escolha técnica.
5. Arquivos originais utilizados.
6. Hashes dos recursos.
7. Arquivos derivados de ícones e banners.
8. Comportamento por dispositivo.
9. Fluxo de inicialização.
10. Regras de cold start e skip.
11. Tratamento de áudio.
12. Fallback e timeout.
13. Alterações realizadas.
14. Testes e resultados.
15. Impacto medido em desempenho e tamanho do aplicativo.
16. Riscos residuais.
17. Pendências de validação física.
18. Compatibilidade com o candidato 03.
19. Situação do candidato 04.
20. Procedimento de geração futura do APK.
21. Plano de rollback.
22. Recomendação final de homologação.

Classificar cada funcionalidade como:

- IMPLEMENTADA E VALIDADA LOCALMENTE.
- IMPLEMENTADA, AGUARDANDO VALIDAÇÃO FÍSICA.
- PARCIAL.
- BLOQUEADA.
- NÃO INICIADA.

## 17. PROIBIÇÕES

O agente não está autorizado a:

- Realizar commit.
- Realizar push.
- Executar merge.
- Publicar PR.
- Realizar deploy.
- Instalar APK.
- Desinstalar versões existentes.
- Limpar dados.
- Reiniciar dispositivos.
- Alterar banco ou backend.
- Alterar licenças ou autenticação.
- Incorporar silenciosamente o ciclo 04.
- Modificar o PublicTrailerPlugin para mascarar o FAIL visual do gate 06.
- Declarar FPS ou desempenho físico sem medições reais.
- Declarar homologação física a partir de testes desktop.

## 18. CRITÉRIO FINAL DE ACEITAÇÃO

A implementação local somente poderá ser considerada concluída quando:

1. Os vídeos originais estiverem integrados corretamente.
2. O aplicativo selecionar a intro adequada à orientação e ao dispositivo.
3. A intro reproduzir ou entrar em fallback sem bloquear a inicialização.
4. O comando Pular funcionar.
5. Não houver repetição indevida em retorno do background.
6. O fluxo de autenticação e catálogo permanecer preservado.
7. O novo ícone e os recursos gráficos estiverem devidamente gerados.
8. Nenhum arquivo de origem tiver sido modificado indevidamente.
9. Os testes autorizados estiverem concluídos.
10. A governança CANON/C11 estiver íntegra.

**RESULTADO ESPERADO: APP_INTRO_BRANDING_07_LOCAL_VALIDATED_PHYSICAL_PENDING.**

Não declarar esse resultado caso existam bloqueios ou testes obrigatórios pendentes de execução local.

---

# ORDEM FINAL AO EXECUTOR

Conduza de forma autônoma o gate XANDEFLIX-APP-INTRO-BRANDING-07, utilizando os vídeos e a arte oficial anexados.

Realize auditoria da arquitetura, especificação prévia, implementação local, geração de recursos de identidade visual, testes e relatório final.

Preserve o candidato 03, o ciclo 04 e todos os artefatos de homologação física anteriores.

A intro deverá ser cinematográfica, reproduzida localmente, adaptada à orientação de tela e capaz de ser pulada sem causar travamentos.

Não altere o sistema de reprodução do catálogo nem tente resolver outros FAILs neste gate.

**IMPLEMENTAÇÃO LOCAL AUTORIZADA DENTRO DA GOVERNANÇA. INSTALAÇÃO, APK DE DISTRIBUIÇÃO E PUBLICAÇÃO NÃO AUTORIZADOS.**
```

## Esclarecimento de autoridade da imagem

```json
{
  "gate": "XANDEFLIX-APP-INTRO-BRANDING-07",
  "orderedLogoSha256": "1de243561b55d59f499c6bd01fe095c7e3c526a320ae67af6856df2930ecbcfc",
  "attachedLogoSha256": "cf422e99b87efc7e7127670ce2d6b7c108b5c2f92aeb8b955612f9bd765439fa",
  "clarification1": "Usar o PNG descrito na ordem (1de24356…)",
  "latestUserInstruction": "preciso que use a ogo anexada",
  "effectiveAuthority": "LATEST_EXPLICIT_USER_INSTRUCTION_ATTACHED_PNG",
  "originalsImmutable": true
}
```


## Registro de grants CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07

50 grants reais;38 recibos totais. Ponte somente read-only e player nativo local. Código principal em src/main.tsx preservado. Testes físicos continuam pendentes.


## Registro de grants CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07

49 grants reais;38 recibos totais. Ponte somente read-only e player nativo local. Código principal em src/main.tsx preservado. Testes físicos continuam pendentes.


## Registro de grants CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07

49 grants reais;38 recibos totais. Ponte somente read-only e player nativo local. Código principal em src/main.tsx preservado. Testes físicos continuam pendentes.


## Registro de grants CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07

49 grants reais;38 recibos totais. Ponte somente read-only e player nativo local. Código principal em src/main.tsx preservado. Testes físicos continuam pendentes.


## Emenda posterior — APK de teste autorizado ao final

# Emenda nominal — APK de teste ao final do gate07

Data do usuário:26/10/2026, America/Sao_Paulo. Instrução expressa posterior, literal:

> AO FINAL GERE O APK PARA TESTE NOS DISPOSITIVOS

Autoriza gerar e auditar APK de teste depois da implementação e verificações locais deste mesmo gate. Substitui apenas a proibição anterior de geração de APK/assemble para o artefato de teste. Não autoriza instalação, desinstalação, clear/reset/reboot, publicação/deploy/Git/backend, mudança de versão/package/assinatura/autoridade ou novo gate. Preservar os aparelhos e os ciclos03/04/05/06.

Procedimento após checks locais: fresh C11; build web válido, cap copy Android oficial, registry oficial dos mesmos plugins públicos instalados, Gradle offline assembleDebug com package/code37/name1.0.37/assinatura existentes. Auditar assinatura/package/versão/assets/recursos/bundle e SHA256; conferir ausência04, integridade dos dois MP4s e PNG original, presença das classes da intro, recursos de ícones/splash/Leanback e exclusões de backup. Comparar certificado do APK03 conhecido. Registrar o binário final distinguido pelo SHA256, sem instalar em nenhum alvo.

NEXT_GATE_STARTED=NAO.



## Registro de grants CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07

49 grants reais;38 recibos totais. Ponte somente read-only e player nativo local. Código principal em src/main.tsx preservado. Testes físicos continuam pendentes.


## Registro de grants CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07

49 grants reais;38 recibos totais. Ponte somente read-only e player nativo local. Código principal em src/main.tsx preservado. Testes físicos continuam pendentes.


## XANDEFLIX-APP-INTRO-BRANDING-07 — fechamento local — 2026-10-26

RESULT=APP_INTRO_BRANDING_07_LOCAL_VALIDATED_PHYSICAL_PENDING. Emenda posterior autoriza APK de teste, não instalação. APK SHA256 734e6ca9b89c8639d1e45d70caf81bf4c6fcbd2611278a163ca00431ef5c9ac2, package com.xandeflix.prebuilt/code37/name1.0.37/certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d. CANON201 controles34 suítes/936 protegidos38 recibos;257 testes Android39 suítes e13 casos intro PASS.13 checks oficiais/assemble/auditoria PASS. Primeiro canon:test final falhou por interceptação textual do negativo antigo de orientação; reposicionamento do método sem mudar comportamento preservou o teste, repetido integralmente com PASS. Originais MP4/PNG e37 recibos preservados;03/04/05/06/root congelados. Classes04 ausentes; FAILs06 abertos. Relatório C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/app-intro-branding-07-20261026/REPORT.md; nenhuma instalação/operação de aparelho/publicação/Git/backend. Física pendente; NEXT_GATE_STARTED=NAO.


# XANDEFLIX — RELATÓRIO DE IMPLEMENTAÇÃO DA INTRO E IDENTIDADE VISUAL — GATE07

**Gate: XANDEFLIX-APP-INTRO-BRANDING-07. Data:26/10/2026, America/Sao_Paulo. RESULT=APP_INTRO_BRANDING_07_LOCAL_VALIDATED_PHYSICAL_PENDING.** A intro e a identidade Android estão implementadas e validadas localmente. O APK de teste foi gerado por autorização expressa posterior, com assinatura e recursos auditados. **Nenhuma instalação ou operação em dispositivos foi executada. Homologação física pendente.**

## 1. Resumo executivo

Intro nativa local, um player isolado, mídias originais, proporção FIT/contain, entrada fria pelo launcher, escolha por janela/TV, skip e fallback limitados. O bootstrap original aguarda a conclusão e mantém seu destino legítimo de ativação/carregamento. Nova marca de launcher, adaptive/round/themed, banner Leanback e recursos de splash a partir do PNG anexado confirmado pelo usuário. Os FAILs06 de trailer fora do card, retorno à grade e desempenho/piscadas continuam abertos e não foram alterados.

## 2. Estado e integridade da base

Base integral fechada06: C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/physical-validation-06-20261025/workspace, 1439 arquivos gerenciados, funcionalidade03 e documentos05/06. Não reconstruída da main/HEAD incompletos. Clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/app-intro-branding-07-20261026/workspace, origin https://github.com/xandeflix2/xandeflix-prebuilt.git, branch operacional fix/source-output-format-recovery, HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8; baseline main b3fc8d1e3844bc5601813ab1b298289af5b3f1fd. Divergência histórica de branch mantida,10 diferenças L1 do root preservadas; 1346 arquivos do root conferidos. Pasta histórica permaneceu somente leitura.

Manifests completos e artefatos externos03(1435),04(1452),05(1437) e06(1439) reconferidos com os snapshots anteriores. Os37 recibos históricos continuam idênticos. Novo recibo38: docs/governance/authorizations/CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07.json, blobLF b806f61070d8dc03652b310983c2e165a5ff5e5d, SHA256 9b8fa554713b9cda5afb1a97d5276ef86cf524fc99e07e475a5f2c3d160ac1eb;49 grants reais com predecessores existentes. CANON final:936 protegidos/38 recibos. Nenhum verificador foi relaxado.

## 3. Arquitetura da intro

AppIntroPolicy controla admissão e estados; AppIntroController possui overlay nativo, PlayerView com SurfaceView padrão e um ExoPlayer Media3. AppIntroPlugin é uma ponte read-only de conclusão. Tudo está na MainActivity existente; nenhuma segunda Activity, player público ou player de catálogo é usado para a intro. Somente a mídia selecionada é preparada. A fonte é RawResourceDataSource, sem URI externa/streaming.

## 4. Motivo da escolha

Media3 1.5.1 já existe no aplicativo: não foi adicionada biblioteca nem alterada versão. O mecanismo nativo permite controlar surface, áudio e lifecycle sem reutilizar a WebView defeituosa do trailer público. Uma solução WebView acrescentaria dependência de autoplay/eventos e uma camada de vídeo concorrente com o bootstrap. Escolheu-se adiar a montagem React até liberar a intro, reduzindo a disputa de preparação do catálogo com decoder no Fire. Não se promete ganho de CPU nem tempo de bootstrap além do vídeo sem medição física.

## 5. Arquivos originais usados

Vídeos locais de Downloads sem os sufixos(1), com bytes/digests exatos da ordem. PNG efetivo é o anexo1536×1024 de1163950bytes. A ordem trazia digest1de24356… e o usuário primeiro o escolheu; depois determinou literalmente “preciso que use a ogo anexada”. Esta escolha posterior autoriza o arquivo cf422e99… encontrado. ASSET_AUTHORITY_ADDENDUM.json preserva as duas respostas, sem inventar o arquivo ausente. Nenhum original foi editado.

## 6. Hashes dos recursos

| Papel | Bytes | SHA256 original |
| --- | ---: | --- |
| vertical | 853983 | `76fb4e7366173b1764441299b188ff93c2af9bd5969f4618a0688d7bae2d113b` |
| horizontal | 905945 | `41741f8df356ad5440fb7eebf7da3edb8ef93353610ff54e29f8e22067cad83f` |
| logo | 1163950 | `cf422e99b87efc7e7127670ce2d6b7c108b5c2f92aeb8b955612f9bd765439fa` |

Os MP4s foram auditados por parser ISO BMFF/H264SPS: H264 High/Level4.0,8bit/4:2:0,24FPS,192 amostras de vídeo,8s; AAC-LC estéreo48kHz com8,042667s de áudio. Não há reencode, corte, aceleração ou modificação de trilha. moov após mdat é mantido; acesso local permite seek. Metadata não prova suporte do decoder do aparelho.

## 7. Derivados e inspeção visual

Recorte técnico do símbolo(466,234,586,388) e marca completa(286,232,964,521); contain sobre preto e escala por densidade, sem redesenho/IA. Foreground usa símbolo XF com diagonal64dp em canvas108dp, dentro da safe zone circular66dp. Somente fundo quase preto foi tornado transparente no derivado; máscara monochrome é separada. Original RGB/PNG preservado. Banner320×180 inclui nome completo; sidebar03 é byte idêntica ao recebido.

BRANDING_PREVIEW.png foi inspecionada visualmente; teste também decodifica os pixels RGBA e confere a safe zone de cada densidade. Validação visual de launcher/splash OEM continua física. 31 PNGs no manifesto, incluindo original e máscara:

| Arquivo | Dimensões | Bytes | SHA256 derivado/original |
| --- | --- | ---: | --- |
| `android/app/src/main/res/drawable/splash.png` | 480×320 | 131546 | `37c80972ab63082fa07b9ccf4dca119594b98b224d4773f3292d2339fafb755a` |
| `android/app/src/main/res/drawable-land-hdpi/splash.png` | 800×480 | 335300 | `ec1a915467721d6ca84ae6c1852525949a27b5e62ffd572fe4847f7391e8451e` |
| `android/app/src/main/res/drawable-land-mdpi/splash.png` | 480×320 | 131546 | `37c80972ab63082fa07b9ccf4dca119594b98b224d4773f3292d2339fafb755a` |
| `android/app/src/main/res/drawable-land-xhdpi/splash.png` | 1280×720 | 730053 | `16515910a8d25dcd7196faa9f1b52e98f578accd386cee945c0d8cfed6239fb8` |
| `android/app/src/main/res/drawable-land-xxhdpi/splash.png` | 1600×960 | 1018439 | `ffccb23f444c9126842e837b6743ce96c8883e2ac8de03e1857d2d5008faa0a6` |
| `android/app/src/main/res/drawable-land-xxxhdpi/splash.png` | 1920×1280 | 1325980 | `e1f4f699beb8f98127bef0726f1b403d87524cf4961ab23634b5cc3ac86d9aba` |
| `android/app/src/main/res/drawable-port-hdpi/splash.png` | 480×800 | 136685 | `6c5743753a9b1bb5163f0414a399708bf0e12907fd717b831f3ce8011990345c` |
| `android/app/src/main/res/drawable-port-mdpi/splash.png` | 320×480 | 64011 | `a775194ed952c6dbfb9207eca44d8625a1fde5fc3cf25398c550751d0e32e460` |
| `android/app/src/main/res/drawable-port-xhdpi/splash.png` | 720×1280 | 286930 | `34e90bb8a658db000c2b5386891e343504ddf21c68c75cd78fb76cf2947e77f8` |
| `android/app/src/main/res/drawable-port-xxhdpi/splash.png` | 960×1600 | 468467 | `e73ea48df2c8c4708f4072c883d7bf5b85d1f56a3e2238e7c3eca1f438f6feec` |
| `android/app/src/main/res/drawable-port-xxxhdpi/splash.png` | 1280×1920 | 744965 | `4aa74b3936eb1efe95aedd145faf150b6c75b8e6842861a977d32b4c3baaa11b` |
| `android/app/src/main/res/drawable-xhdpi/xandeflix_tv_banner.png` | 320×180 | 61559 | `98bcc0f8862419ec0dd1575d7defdb3c9438ef6200ac68f4474f5626990e9dae` |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` | 72×72 | 3221 | `c3998b8642546c8f0c952f3b5ec8005b81298c485e268cbff96ca73a44c05d81` |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png` | 162×162 | 7088 | `18691a5325ffbe844d305127c4e954d4edbc084bee3c1c9b513d40c71d32c2a9` |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` | 72×72 | 3722 | `bc163e7693dd6377f45328749815ec5aeb66b1769be84e4b2575c055627d276a` |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` | 48×48 | 1814 | `788e7b0e6e7685fca8220f2916854afd915b216f174e244c2366ae5987828003` |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png` | 108×108 | 3822 | `04ad5b586dd46a67f4bf7d7b977566e36b1d505a1daca57129858e20bb260491` |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` | 48×48 | 2176 | `ed19a3c42a1f85ff1d36accce517c8361d979a125dc0911a42b9fa24069a49cd` |
| `android/app/src/main/res/mipmap-television-xhdpi/ic_launcher.png` | 96×96 | 5102 | `7f6a95fd6eaebc7a31796f64a16df8ecf3fc92bc26110eaf5879ebb0b49552fc` |
| `android/app/src/main/res/mipmap-television-xhdpi/ic_launcher_round.png` | 96×96 | 5745 | `2a0baadadf51c841bf18881107c1ce697e2cf5d7df8e396c58fc9b5dc40e7434` |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` | 96×96 | 5102 | `7f6a95fd6eaebc7a31796f64a16df8ecf3fc92bc26110eaf5879ebb0b49552fc` |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png` | 216×216 | 10944 | `78e67331639c2801a3f128e2513bd0b0e259faaaf44c2644140943a631c3dec5` |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` | 96×96 | 5745 | `2a0baadadf51c841bf18881107c1ce697e2cf5d7df8e396c58fc9b5dc40e7434` |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` | 144×144 | 9511 | `a977f504aa3712ca9da1f7b5c8a9c2d005ba640ce91ca9081932d1bc52efde02` |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png` | 324×324 | 22049 | `e07519bc281a792289c8640ada6dcd4b9bf5adfa6c90885359abec28bb6fcf42` |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` | 144×144 | 10501 | `d48a1dd7048220a1b6201b0a48a834c657060c8cab9a9814d156492f067099f6` |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | 192×192 | 15467 | `71b88789e25546271a62ab4afdd0034e58d2a046b5df468bfb0bfa6b601cb5a1` |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` | 432×432 | 35783 | `312aa5b226bb7c39a74f0c804c21b94e3809b470fc1af01f2ce999e2f0cd3f74` |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` | 192×192 | 16945 | `b5aadd59e5a73d309112dbaa742f4ee2abfede687f59899b7ba96f05004a4414` |
| `android/app/src/main/res/drawable-nodpi/intro_brand.png` | original/máscara, dimensões em APK_RESOURCES.json | 1163950 | `cf422e99b87efc7e7127670ce2d6b7c108b5c2f92aeb8b955612f9bd765439fa` |
| `android/app/src/main/res/drawable-nodpi/intro_monochrome.png` | original/máscara, dimensões em APK_RESOURCES.json | 6380 | `e8f4f48c11769dde56f62eb5a278858359b5521b007c5145c51769278457a377` |

## 8. Comportamento por dispositivo

| Alvo | Seleção | Classificação |
| --- | --- | --- |
| Phone/Tablet retrato | Vertical pela janela efetiva | IMPLEMENTADA, AGUARDANDO VALIDAÇÃO FÍSICA |
| Phone/Tablet paisagem/quadrada | Horizontal pela janela efetiva | IMPLEMENTADA, AGUARDANDO VALIDAÇÃO FÍSICA |
| Fire/Android TV | Horizontal por UI_MODE/capabilities TV/Leanback | IMPLEMENTADA, AGUARDANDO VALIDAÇÃO FÍSICA |
| Rotação/multiwindow | Mídia da sessão não muda; FIT adapta a área sem novo player | IMPLEMENTADA, AGUARDANDO VALIDAÇÃO FÍSICA |
| Web/entradas públicas | Sem espera nativa Android e sem intro | IMPLEMENTADA E VALIDADA LOCALMENTE |

Alvos históricos: AFTSS/API28, SM-S926B/API37, SM-X610/API36. Nenhuma conexão/inventário ADB novo neste gate; não presumir disponibilidade/estado atual. Outra Android TV não foi homologada.

## 9. Fluxo de inicialização

SplashScreen.installSplashScreen antes de super.onCreate, fundo preto e postSplashScreenTheme. Vídeo é superfície do aplicativo, não recurso reproduzível da splash do sistema. BridgeActivity/Capacitor7 seguem seu load/lifecycle originais, sem override de load nem chamadas artificiais de onStart/onResume. index.html aponta a intro-main.ts; um gate limitado aguarda AppIntro.ready e importa uma vez src/main.tsx, que conserva SHA256 aefd904186e289cd4dc56b21ee40ccc876909991099e50dcf2f904e38e9269c7. DevicePresentationGate, autenticação/ativação, catálogo e loading continuam os originais. Não se navega forçadamente para Home.

Estado: launcher frio elegível→WAITING→PREPARING→PLAYING→FINISHED→entrada original; skip/erro/memória/lifecycle terminam no mesmo FINISHED após liberar. Ingressos inelegíveis seguem diretamente à entrada normal. Ausência/falha da ponte ou15s de espera máxima liberam o entry; não há bloqueio permanente por plugin indisponível.

## 10. Cold start e skip

Admissão explícita uma vez em RAM por processo: primeira MainActivity com ACTION_MAIN e LAUNCHER/LEANBACK, sem URI nem saved state. Deep link/restauração consomem a primeira decisão sem vídeo; reabertura, navegação interna, retorno de player/background e recriação não repetem. onNewIntent cancela a sessão sem reiniciar. PhoneUiOrientation normal é adiada somente durante a intro e restaurada ao concluir.

Botão acessível “Pular introdução”, alvo mínimo48dp e insets, Enter/OK/DPAD_CENTER/NUMPAD_ENTER/Back encerram sem confirmação. Tecla/repeat/keyup do skip são consumidos antes dos handlers existentes. Caso o background suprima keyup, uma nova pressão distinta após a intro é aceita. Back AndroidX só durante a intro; removido ao fim. Políticas e bridge são validados localmente; latência real/gesto/Bluetooth e ausência de seleção acidental dependem da física.

## 11. Áudio

Trilha original mantida, sem alterar volume do sistema. Só habilitar áudio em ringer normal, mídia>0, sem música externa e MODE_NORMAL. Lease transitório MAY_DUCK explícito; handleAudioFocus Media3=false para não haver segundo solicitante. Negado/perdido/erro de foco torna a sessão silenciosa e desabilita áudio, sem reaprender/requisitar foco. Falha identificada especificamente no renderer de áudio pode fazer uma única recuperação silenciosa no mesmo player/mídia/posição e sem reiniciar deadlines. Som/áudio residual real e compatibilidade com outras aplicações: IMPLEMENTADA, AGUARDANDO VALIDAÇÃO FÍSICA.

## 12. Fallback, timeout e lifecycle

Fim normal por STATE_ENDED, sem timer que corte aos8s. Limite de primeiro quadro/área pronta4s; teto total13s(4s preparação+8s mídia+1s margem de evento), tratados como falhas de segurança. Erro de decoder/recurso/surface/inicialização/memória libera player e mostra marca estática250ms em foreground; background termina imediatamente. Sob lowMemory evitar criar player e usar ícone compacto no fallback. onPause/onStop/onDestroy e pressão de memória encerram, sem replay.

Release idempotente remove callbacks, desliga PlayerView, stop/clear/release do player, abandona foco, remove surface/overlay/backcallback e resolve a ponte uma vez. Logs XF_INTRO07 contêm evento/motivo/elapsedMs sem URLs ou identidade privada. Testes do estado e inspeção de chamadas não provam liberação física de decoder/áudio/PSS: não foi afirmada ausência de leak.

## 13. Alterações e escopo

Allowlist60, delta real57; todos listados abaixo. Fontes/dependências/manifest/package/backup/catálogo/auth/players/sidebar fora deste delta permanecem byte idênticos. Quatro documentos normativos são append-only. Alterações de testes: uma suíte nova13 casos,15 testes JVM e cinco negativos no runner, conservando196 controles/33 suítes anteriores. O teste legado de orientação não foi editado.

- `android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java`
- `android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroController.java`
- `android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroPlugin.java`
- `android/app/src/main/java/com/xandeflix/prebuilt/intro/AppIntroPolicy.java`
- `android/app/src/main/res/drawable-land-hdpi/splash.png`
- `android/app/src/main/res/drawable-land-mdpi/splash.png`
- `android/app/src/main/res/drawable-land-xhdpi/splash.png`
- `android/app/src/main/res/drawable-land-xxhdpi/splash.png`
- `android/app/src/main/res/drawable-land-xxxhdpi/splash.png`
- `android/app/src/main/res/drawable-nodpi/intro_brand.png`
- `android/app/src/main/res/drawable-nodpi/intro_monochrome.png`
- `android/app/src/main/res/drawable-port-hdpi/splash.png`
- `android/app/src/main/res/drawable-port-mdpi/splash.png`
- `android/app/src/main/res/drawable-port-xhdpi/splash.png`
- `android/app/src/main/res/drawable-port-xxhdpi/splash.png`
- `android/app/src/main/res/drawable-port-xxxhdpi/splash.png`
- `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`
- `android/app/src/main/res/drawable-xhdpi/xandeflix_tv_banner.png`
- `android/app/src/main/res/drawable/splash.png`
- `android/app/src/main/res/layout/app_intro.xml`
- `android/app/src/main/res/mipmap-anydpi-v33/ic_launcher.xml`
- `android/app/src/main/res/mipmap-anydpi-v33/ic_launcher_round.xml`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-television-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-television-xhdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png`
- `android/app/src/main/res/raw/intro_horizontal.mp4`
- `android/app/src/main/res/raw/intro_vertical.mp4`
- `android/app/src/main/res/values/ic_launcher_background.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/test/java/com/xandeflix/prebuilt/intro/AppIntroPolicyTest.java`
- `docs/ERRORS_AND_BLOCKERS.md`
- `docs/EVOLUTION_REPORT.md`
- `docs/STATUS.md`
- `docs/architecture/XANDEFLIX_APP_INTRO_BRANDING_07.md`
- `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md`
- `docs/evidence/XANDEFLIX_APP_INTRO_BRANDING_07.md`
- `docs/governance/authorizations/CANON-01-XANDEFLIX-APP-INTRO-BRANDING-07.json`
- `index.html`
- `scripts/test-app-intro-branding-07.mjs`
- `scripts/test-canonical-regression.mjs`
- `src/bootstrap/app-intro-gate.ts`
- `src/intro-main.ts`

## 14. Testes e resultados

Baseline fresh CANON196/33 e C11 antes do código: PASS. Final fresh **201 controles/34 suítes PASS**. Suíte específica13 casos PASS e Android **257 testes/39 suítes, zero falhas/erros/skips**. Os15 casos novos exercitam política compartilhada com o controller; testes TS executam entry real transpilado e gate em VM; checks de wiring/callback/isolamento são estruturais. Não são testes instrumentados de Activity/SurfaceView Android.

Os dois MP4s tiveram decode/progresso/192 callbacks de quadro/fim real no Chromium desktop headless, muted. Isso verifica os arquivos, sem medir decoder Android, áudio ou apresentação da TV. BRANDING_PREVIEW inspecionada; PNGs/recursos e compilação AAPT aprovados. Ativação pendente é preservação do entry original, não login físico novo. Nenhum cenário físico07 recebeu PASS.

13 verificações oficiais finais e comandos nativos/APK:

| Etapa | Comando | Exit | Segundos |
| --- | --- | ---: | ---: |
| final2-01 | `cmd.exe /d /s /c npm run canon:check` | 0 | 3.6 |
| final2-02 | `cmd.exe /d /s /c npm run canon:test` | 0 | 228.4 |
| final2-03 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 14.8 |
| final2-04 | `cmd.exe /d /s /c npm run typecheck` | 0 | 26.6 |
| final2-05 | `cmd.exe /d /s /c npm run update:check` | 0 | 2.2 |
| final2-06 | `cmd.exe /d /s /c npm run security:check` | 0 | 2.2 |
| final2-07 | `cmd.exe /d /s /c npm run playback:check` | 0 | 14.3 |
| final2-08 | `cmd.exe /d /s /c npm run build` | 0 | 53.9 |
| final2-09 | `cmd.exe /d /s /c npm run site:build` | 0 | 102.6 |
| final2-10 | `C:\Program Files\nodejs\node.exe scripts/test-site-build-contract.mjs` | 0 | 8.9 |
| final2-11 | `C:\Program Files\nodejs\node.exe scripts/test-vercel-artifact-contract.mjs` | 0 | 0.3 |
| final2-12 | `C:\Program Files\nodejs\node.exe scripts/verify-vercel-artifact.mjs inspect` | 0 | 0.5 |
| final2-13 | `C:\Program Files\nodejs\node.exe scripts/test-vercel-prebuilt-contract.mjs` | 0 | 10.8 |
| final2-intro-suite | `C:\Program Files\nodejs\node.exe scripts/test-app-intro-branding-07.mjs` | 0 | 0.9 |
| final2-native-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 15.5 |
| final2-native-unit | `cmd.exe /d /s /c gradlew.bat --offline --no-daemon --max-workers=2 --console=plain testDebugUnitTest` | 0 | 80.0 |
| apk-preflight-canon | `cmd.exe /d /s /c npm run canon:check` | 0 | 4.0 |
| apk-preflight-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 16.1 |
| apk-capacitor-copy | `C:\Program Files\nodejs\node.exe C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/app-intro-branding-07-20261026/workspace/node_modules/@capacitor/cli/bin/capacitor copy android` | 0 | 1.8 |
| apk-before-gradle-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 17.7 |
| apk-assemble | `cmd.exe /d /s /c gradlew.bat --offline --no-daemon --max-workers=2 --console=plain assembleDebug` | 0 | 107.3 |
| apk-after-canon | `cmd.exe /d /s /c npm run canon:check` | 0 | 7.0 |
| apk-after-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 15.9 |

Primeira rodada final: canon:check PASS e canon:test FAIL no negativo ui-landscape. O teste faz replace da primeira chamada textual; completeAppIntro estava antes de onCreate e interceptava a mutação. Addendum prévio definiu mover o método para depois de onCreate sem mudar corpo/comportamento. O teste e todos negativos foram preservados; repetição isolada e regressão completa passaram. results.json/final-02.log mantêm a falha, sem promovê-la a PASS. Não se aumentou timeout/assertion para aprovar.

Outros incidentes locais: path Unicode em PowerShell5 corrigido antes dos derivados; grant de index.html inicialmente recusado por não ser caminho protegido suportado, retirado somente do recibo38 mantendo allowlist/auditoria integral. Nenhum verificador foi relaxado. Prévia de geração inicial e clarificações de hash permanecem documentadas. Warnings de flatDir, externalização Node e tamanho de chunks existentes não foram mascarados.

## 15. Impacto medido em tamanho e desempenho

APK03: 12433860bytes. Novo APK: **20534424bytes**, delta **8100564bytes**. Recursos Android selecionados: 449500→8535090bytes, delta8085590; inclui os dois MP4s e variantes PNG substituídas/novas, sem reencode. Dist atual2821911bytes; conjunto web público do APK032820658bytes. São conjuntos explicitados, não estimativa de download/instalação/RAM. OriginalPNG1536×1024 tem potencial de bitmap~6MiB em ARGB antes de overhead; isso é cálculo, não medição no aparelho.

Somente compilação/decode desktop/tamanhos foram medidos. Processo→splash, primeiro quadro, duração percebida, liberação física, primeira tela interativa, preparação do catálogo, CPU e PSS Android durante/depois: **PENDENTES**. A apresentação deliberada8s não comprova ausência de regressão adicional. Vídeo24FPS não é a meta60 da navegação. Não atribuir desempenho físico aos tempos da tabela de compilação.

## 16. Riscos residuais

Decodificação H264 High1080p, áudio e SurfaceView dependem de hardware/OEM; splash/máscara/gesto Back/orientação/insets precisam dos aparelhos. Teto de segurança pode acionar fallback em hardware pressionado. Os PNGs e MP4s acrescentam bytes; arquivos originais não foram reduzidos. Troca de processo/restauração e tempo técnico do bootstrap carecem de observação física. Release chamado não é prova isolada de todos subprocessos liberados. Os FAILs06 permanecem sem causa/correção nova.

## 17. Pendências físicas

PHYSICAL_TEST_PLAN.md contém protocolo por Phone/Tablet/Fire/outraTV, cold/warm, retrato/paisagem/rotação/multiwindow, Enter/Back/toque, offline, áudio/foco/silencioso/música externa, background/recriação/deep link, fallback e recursos. Cronometrar etapas separadas, CPU/PSS/Graphics em fases equivalentes e gravação externa para pixels/piscadas. Nenhuma captura CDP/Emulation em Fire nem operação ADB foi realizada. **Tudo isso permanece IMPLEMENTADO, AGUARDANDO VALIDAÇÃO FÍSICA, onde depende do binário em execução.**

## 18. Compatibilidade com03

Package **com.xandeflix.prebuilt**, versionName **1.0.37**, versionCode **37**, minSdk23/targetSdk35. Certificado SHA256 **b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d**, mesmo03; apksigner v1=true,v2=true,v3=false. Manifesto fonte idêntico; manifesto compilado semanticamente igual após normalizar apenas IDs de recursos/linhas. Permissões, componentes, package, backup e bibliotecas ABI não alterados. 120 caminhos de main/persistência/segurança/player/config conferidos.

Compatibilidade estática com atualização in-place é favorável; execução e preservação após atualização não foram testadas. Mesmo code37 exige identificar por SHA, sem garantia de rollback transacional. APK é debug/teste, não release de produção.

## 19. Situação04

Candidato04 fechado preservado integralmente. Classes/recibo/marcadores exclusivos04 ausentes de fonte, DEX e bundle. **CONTROLE DE DADOS MÓVEIS: NÃO INCLUÍDO NESTE APK.** Ausência deliberada, não defeito. Integração04 e correções06: NÃO INICIADAS neste gate.

## 20. Geração e auditoria do APK de teste

A ordem inicial vedava APK sem autorização específica. A instrução posterior literal **“AO FINAL GERE O APK PARA TESTE NOS DISPOSITIVOS”** foi registrada em APK_AUTHORIZATION_ADDENDUM.md e no recibo38; autoriza gerar/auditar localmente ao final, sem instalação/publicação. Checks concluídos antes de Capacitor copy android e gerador oficial instalado writePluginsJson para Browser/Filesystem/Share. C11 antes de Gradle offline assembleDebug e CANON/C11 após build. AppIntro é plugin próprio registrado em MainActivity, sem alterar registry de plugins oficiais.

APK: **C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-intro-branding07-20261026.apk**.

**SHA256: 734e6ca9b89c8639d1e45d70caf81bf4c6fcbd2611278a163ca00431ef5c9ac2.**

ZIP CRC de todas entradas, assinatura criptográfica, recursos AAPT, 11 arquivos dist byte a byte, 33 imagens/mídias de recurso(33 byte idênticos), classes nativas intro/players/plugins e ausência04 verificados. MP4s originais byte idênticos dentro do APK. Sidebar original preservada. Todos os arquivos web copiados correspondem a dist; shims Cordova são as únicas extras permitidas. Busca limitada de nomes/padrões privados: zero ocorrências, não prova absoluta. APK_AUDIT.json/APK_RESOURCES.json/DIST_MANIFEST.json têm detalhes. Nenhuma chave privada foi lida ou registrada. Não haverá rebuild necessário para entregar este arquivo fechado; eventual novo build requer nova conferência de hashes/locks e produz identidade própria.

## 21. Reversão

Rollback local: recebido06/03 e artefatos completos congelados; novo patch isolado, sem descarte de root. APK03 dd885bdd… e referência ec7f53f7… conservam hashes/certificado. Se teste futuro autorizado regredir, planejar substituição in-place com pacote compatível após nova conferência/ordem física. Sem uninstall/clear; APK não é backup nem restaura dados privados perdidos. Nenhum backup, restore, instalação ou rollback foi executado.

## 22. Recomendação final

**APTO COMO APK DE TESTE LOCAL AUDITADO; HOMOLOGAÇÃO FÍSICA PENDENTE.** Implementação/recursos/testes/artefato: IMPLEMENTADOS E VALIDADOS LOCALMENTE no alcance descrito. Decoder, áudio, splash OEM, cold starts reais, skip físico/recursos e impacto Android: IMPLEMENTADOS, AGUARDANDO VALIDAÇÃO FÍSICA. Não aprovar como entrega integralmente homologada. Instalação depende de autorização expressa; o usuário recebeu um APK concreto para testes, nenhum aparelho foi modificado pelo executor.

Sem commit/push/merge/PR/deploy/backend, incorporação04, correção06, instalação/desinstalação/clear/reset/reboot ou publicação. Fonte e autoridade do produto preservadas. **NEXT_GATE_STARTED=NAO.**
