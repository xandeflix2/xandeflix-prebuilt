# C11 — Viabilidade Google Cast no mobile — 2026-10-06

Usuário perguntou sobre opção mobile e escolheu transmitir vídeo pelo Google
Cast. Viável tecnicamente, não implementado nem homologado neste APK. Documento
de análise, CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO, sem escrita nativa/backend.

Receptor precisa declarar Google Cast: Android TV/Google TV compatível; LG/webOS
com Cast integrado (inclui modelos2024, região/modelo variam); Samsung/Tizen em
modelos selecionados2026. Nome do sistema sozinho não prova suporte. TV sem
Cast pode receber através de Chromecast/Google TV Streamer HDMI compatível.
Smart View/Miracast/AirPlay são protocolos próprios, não equivalentes ao botão
Google Cast. Nenhuma TV do usuário foi identificada/testada nesta análise.

Fontes primárias consultadas:
- https://developers.google.com/cast/docs/android_sender/integrate
- https://developers.google.com/cast/docs/media
- https://support.google.com/chromecast/answer/7022492
- https://www.lg.com/us/press-release/2024_OLED_TV_Pricing_Availability.pdf
- https://news.samsung.com/ca/samsung-brings-full-2026-ai-tv-lineup-to-consumers-worldwide

Integração futura requer sender Android com descoberta/seleção do receptor,
envio de media compatível e controles/status de sessão. O receiver acessa o
vídeo; cada combinação container/codec/HLS/DASH, autenticação/CORS e transporte
deve ser validada. Não presumir suporte a todo TS/MKV/HEVC da fonte nem criar
transcodificação/proxy de backend que armazene conteúdo ou URLs reais.

APK atual minSDK23; documentação atual do SDK Cast exige mínimo24. Selecionar
versão suportada compatível ou especificar variante mobile sem elevar requisito
do APK universal silenciosamente. CastContext lazy somente no perfil sender,
sem descoberta/Google Play Services obrigatórios no Fire/boot limpo.

Preservar source boundary e C9: URI/headers/credenciais em RAM somente; receiver
autorizado, sem logs/metadata pública ou persistência remota de source secrets;
handoff integra a sessão comercial existente, limite/revogação/heartbeat,
falha, desconexão/retorno local e encerramento inclusive processo/background.
Enviar URI irrestrita ao default receiver sem controlar sua continuidade não
prova cumprimento dessas regras. Contrato do handoff e testes de revogação
precedem implementação. Receiver real na mesma rede e modelo da TV necessários
para homologação de reprodução, não inferida de compilação/mock.

## Solicitação posterior e bloqueio delimitado

Usuário pediu ícone funcional no player, detalhes de filmes/séries e página
interna Live, mobile. Essa solicitação autoriza a feature, mas não determina
como reconciliar a entrega de mídia a um receiver com o contrato obrigatório
SOURCE_DATA_BOUNDARY §3: proíbe transportar stream URL/header Authorization/
credenciais fora da boundary autorizada. PLAYER_CONNECTION=DEVICE_TO_SOURCE_DIRECT
e fail-closed também continuam normativos. STOP_ON_CONFLICT exige parar essa
integração; não implementar botão decorativo nem entregar URL irrestrita ao
default receiver. PiP/cache são ciclos independentes preservando a boundary.

## Proposta concreta para revisão antes da implementação

- Sender Android Cast lazy em celular/tablet, excluindo TV/Fire e boot/ativação.
  Ícone com estado/conexão e descoberta nos quatro pontos solicitados. Detalhe
  filme transmite via Assistir; série seleciona episódio; Live usa canal atual.
- C9 adquire uma única sessão antes da resolução canônica, e mantém heartbeat.
  Receiver recebe somente URL efêmera com token de uso da sessão na rede local,
  nunca URL/headers da fonte. Dados privados ficam exclusivamente na RAM do
  dispositivo remetente; nenhuma persistência remota/novo serviço de backend.
- Transporte local limitado: telefone/tablet acessa diretamente source, fornece
  segmentos/ranges ao receiver escolhido pela LAN, sem gravar vídeo, sem
  transcoding. Não é proxy central. Limites de memória/conexões/TTL/lease,
  invalidação por revogação/falha/saída, encerramento no fim/morte do processo.
  Compatibilidade HLS/MP4/codec exige receiver real; TS/MKV não prometidos.
- Antes do código, emenda canônica precisa permitir especificamente transporte
  de mídia local efêmero device-to-selected-receiver e URL de sessão LAN sem
  segredo da fonte. O restante da boundary, C9 e proibição de proxy central
  permanece intacto. Não editar o contrato silenciosamente.
- SDK compatível min23 deve ser comprovado por manifest/dependências e build;
  não elevar SDK do APK universal. Google Maven21.5.0 acessível não equivale a
  confirmação de suporte/segurança atual nem autorização de adotar versão antiga.
- Homologação: seleção real, play/pause/seek/retorno local, desconexão, revogação,
  lease sem heartbeat, morte do sender, nenhum URL/secret exposto em logs/IPC
  de metadados, lock49+9 e nenhuma primeira-instalação dependente do Cast.

## Autorização recebida e implementação — antes do código

Usuário respondeu explicitamente "Autorizar o transporte local para Google
Cast". Bloqueio documental resolvido por exceção delimitada no Source Data
Boundary. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO; backend/Git não autorizados.

Allowlist adicional: Source Data Boundary (somente emenda acima), este plano,
android/app/src/main/res/drawable/ic_cast.xml; scripts/test-c11-mobile-output.mjs;
android/app/build.gradle/Manifest; MainActivity/NativeAndroidPlayerPlugin/
NativePlayerActivity; novos cast/{LocalCastRelay,GoogleCastPlugin,CastOptions,
CastController}.java; testes Java relay/policy; src/playback/google-cast.ts;
native bridge/PlaybackService; CastButton.tsx; detalhes filmes/séries/Live;
src/index.css; testes Cast, relatórios e acréscimos nos quatro arquivos memória.

Relay ServerSocket LAN em porta aleatória, token256bits e rotas opacas somente
RAM; no máximo4 conexões,16 pendentes, buffers32KiB, playlist HLS<=1MiB,
mapa<=2048rotas. GET/HEAD/Range; HLS relativo/URI attributes reescritos para
relay, MP4/WebM progressivo; DASH/TS/MKV não suportados inicialmente, mensagem
honesta sem mudar URL/container. Credenciais upstream nunca entram na URL LAN.
Timeouts/read/write e lease120s; heartbeat C9 bem-sucedido renova lease sem
inventar autoridade. Retorno local/falha/erro revoga antes de liberar slot C9.
Nenhuma descoberta SDK ou socket no boot/Fire. Player pausa local somente após
LOAD receiver confirmado. Cast encerra ao sair da página/fechar player.
Receiver real não disponível para homologação: reportar esse limite claramente.

Aceitação: testes relay HTTP real com upstream fixture localhost sem segredos,
HLS/Range/HEAD/expiração/stop/rotas inválidas e URI ausente nos arquivos; SDK
manifest/minSDK, typecheck/Gradle/lock49+9; ícones apenas mobile nos quatro pontos,
retorno e C9 fail-closed comprovados com mocks. Não inferir compatibilidade
física de codecs/TV da compilação. Entrega/install -r já autorizados.
