# TABLET-PIP-LIVE-01

Pedido recebido em 19/11/2026, após a proposta nominal das duas correções e do APK de teste. Resposta do usuário: “PROSSIGA COM A INSTALAÇAO NO TABLET”. O escopo é a correção da orientação ao voltar do PiP e a navegação completa da categoria no painel lateral. A instalação autorizada é uma atualização sobre o app existente do Samsung SM-X610. A verificação independente é posterior à entrega do executor.

## Base preservada e composição do APK

Workspace autorizado `C:/Xandeflix/Audits/TABLET_DETAIL_BACK_20261117/workspace`, branch `main`, HEAD `81a17020709b0abdb02e912d389a2445bb2fccc8`. Origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, Git próprio, índice semanticamente igual ao HEAD e ancestralidade A22 confirmada. O APK no tablet tem SHA-256 `a27d167ee74797f823da1969cd7fbe501788fe418a6b503d5c7279f351f04dbb`. O inventário anterior confirma os seis arquivos consultados de orientação e de painel com os mesmos hashes. A comparação de toda a fonte encontrou apenas as diferenças conhecidas da linha anterior do hero e de seus registros. Esse trabalho anterior do hero integra a base local aprovada, preservado byte a byte. O build de teste usa a configuração pública existente, com TMDB configurado, e continua em 1.0.53, código 53.

## Comportamento a corrigir

- A tela principal usa as dimensões máximas da janela do dispositivo para aplicar a regra de celular. Não pede orientação durante PiP ou tela dividida. Quando volta à tela normal, uma Activity de tablet que tenha ficado com orientação solicitada devolve o controle ao Android. Reaplicar a regra no retorno e em alterações de configuração com a janela ativa. TV, política normal de celular e orientação da Activity de vídeo preservadas.
- A ação Canais em fullscreen abre a categoria do canal ativo. O painel mantém a página rolável de até 48 itens, mostra intervalo e total da página válida e diferencia botões desabilitados. Avanço e retorno paginado usam o leitor local que valida o snapshot e reporta erro em segmento ausente ou inválido. Descartar resposta atrasada ao fechar, sair, trocar categoria ou snapshot. Preservar ordenação, política parental, sessão, controles de busca e troca explícita de canal. Carregar o painel não abre mídia nova.
- Atualização APK somente sobre `com.xandeflix.prebuilt` do tablet e com a assinatura existente. Preservar dados, identidade, ativação e catálogo, verificando os digests no dispositivo. A entrega é local ao tablet.

## Arquivos autorizados neste escopo

- `android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java`
- `android/app/src/main/java/com/xandeflix/prebuilt/player/LivePlayerControls.java`
- `src/ui/pages/LiveTvPage.tsx`
- `src/playback/native-android-player.bridge.ts`
- `android/app/src/test/java/com/xandeflix/prebuilt/PhoneUiOrientationPolicyTest.java`
- `android/app/src/test/java/com/xandeflix/prebuilt/player/LivePlayerControlsTest.java`
- `scripts/test-c11-live-player-controls.mjs`
- `scripts/test-canonical-regression.mjs`
- `docs/evidence/TABLET_PIP_LIVE_01.md`
- `docs/governance/authorizations/TABLET-PIP-LIVE-01.json`
- `docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md`
- `docs/STATUS.md`
- `docs/EVOLUTION_REPORT.md`
- `docs/ERRORS_AND_BLOCKERS.md`

O runner canônico recebe apenas a atualização da lista estrita de autorizações. As alterações de testes acrescentam cobertura sem reduzir os controles existentes. Saídas geradas de teste e empacotamento seguem os diretórios próprios do workspace e da auditoria, sem editar configurações de build. Nesta revisão, o fluxo PiP do plugin nativo e a Activity dos filmes e séries são usados como estão.

## Aceitação

- Verificador canônico, lock C11 antes e depois e regressão completa, testes direcionados à paginação, orientação, recuperação Live e verificação de tipos. Casos Java de liberação de orientação em tablet e intervalo de páginas. Confirmar que a proteção anterior de orientação de celular continua passando.
- Canais em categorias com 1, 48, 49, 63 e 105 itens, do primeiro ao último sem perda nem duplicação. Rotas de toque e D-pad, inválidos/atrasados e regressão de troca de canal. Conferir na categoria disponível no tablet e registrar a cobertura física observada.
- PiP Live e filmes/séries em retrato e paisagem, fechamento e expansão, rotação após o retorno e tela dividida. Preservar o fluxo de mídia. Verificar APK instalado e interface após iniciar, com evidência separada para o que depender da interação física do operador.

`NEXT_GATE_STARTED=NAO`


## Complemento documentado antes da correção da validação

A suíte Java completa de 19/11 rodou 262 testes e encontrou uma falha na fixture de ocultação parental do player. A pilha aponta para a leitura de getPlaybackState no envio de nativePreviewState. Os bytes do plugin e desse teste coincidiam com os do snapshot anterior. A tentativa legada da fixture não fornece requestId. A verificação de identidades já existia ao construir os dados do evento, depois de consultar o player.

Recuperação no mesmo escopo autorizado. Reincorporar NativeAndroidPlayerPlugin.java, já incluído na proposta nominal, apenas para verificar os dois IDs antes das leituras do player. Sem evento correlacionável, o resultado que antes seria descartado é encerrado no início. Preservar o teste original, todos os getters e o payload para tentativas válidas. Nenhuma mudança no transporte, C9, parentalidade ou fonte. Novo recibo aditivo TABLET-PIP-LIVE-01-VALIDATION, vinculado ao mesmo gate, e inclusão estrita na lista do runner.

A captura inicial BEFORE.json registrou um caractere do pedido como ponto de interrogação por causa da codificação do shell. A mensagem original permanece registrada em AUTHORIZATION_REQUEST.txt. Nenhum inventário de bytes ou histórico Git foi reescrito.

## Revisão do comportamento solicitada no tablet

Pedido de 19/11/2026 após a primeira instalação de teste: “PRECISO QUE SEJA UMA LISTA CONTINUA SEM PAGINAÇÃO”. A execução física do APK 9115bba1 confirmou as faixas 1 a 48 e 49 a 96 de 100 canais. A lista principal reporta a página calculada pela posição superior visível e podia sobrescrever a página lateral quando a última faixa é menor que a altura da janela. A revisão substitui a paginação visível do painel Canais em tela cheia por uma única lista rolável.

- A lista nativa tem o tamanho autorizado total da categoria. Ela requisita blocos locais de até 48 quando a janela visível se aproxima deles, guarda até três blocos e preserva posição e foco ao receber dados. Carregamento limitado ao viewport e arredores. Navegar pela lista não troca a mídia. Itens ainda em carregamento não são selecionáveis.
- O painel possui escopo próprio por abertura, categoria, autorização, canal atual e catálogo. A lista de canais atrás do vídeo não atualiza a janela do painel nativo. O pedido aditivo loadChannelWindow devolve somente offset limitado e ID efêmero do painel. As respostas antigas são descartadas. Ao selecionar um item do cache nativo, confirmar a identidade na categoria e no snapshot pelo catálogo local e reaproveitar os guards e a seleção já existentes.
- Canais em tela cheia perde Anterior e Próxima. Categorias, Favoritos e Guia conservam seus fluxos. Amostra física deve rolar da primeira até a última linha na categoria de 100, sem paginação visível. Preservar C11 e revalidar o retorno de PiP no aparelho.
- Alterações dentro da allowlist anterior em LiveTvPage.tsx, native-android-player.bridge.ts, LivePlayerControls.java, testes direcionados de Live, runner canônico e documentos aditivos. Recibo adicional TABLET-PIP-LIVE-01-CONTINUOUS para essa revisão expressa dentro do mesmo ciclo. Mantém package, assinatura e versão 1.0.53 de teste. Atualização novamente sobre a instalação existente do mesmo tablet.



O operador informou que a rede corporativa restringe filmes e séries e permite Canais ao Vivo. A validação funcional neste ambiente se concentra na lista e na volta do PiP Live. A validação de reprodução de VOD deste APK fica pendente.


## TABLET-PIP-LIVE-01 — 19/11/2026

Rolagem física verificada do primeiro ao último canal e de volta ao início. Os 100 canais de Filmes e Séries em Canais ao Vivo coincidiram, na mesma ordem, com o catálogo ativo. O painel abriu sem botões Anterior e Próxima. O último canal foi selecionado pelo painel e o Media3 voltou ao estado READY. O player de Canais ao Vivo entrou em PiP e voltou em paisagem. A orientação da Activity principal ficou sem bloqueio de retrato. A rede corporativa informada pelo usuário restringe a reprodução de filmes e séries. A validação física de VOD para este APK fica pendente. APK SHA-256 `b298287c374caf3c9216b1a07d09a32099b52ebf5bc8239aabfc92ffa017eb14`. Resultado `TABLET_PIP_LIVE_CONTINUOUS_INSTALLED_AND_LIVE_VERIFIED`.
