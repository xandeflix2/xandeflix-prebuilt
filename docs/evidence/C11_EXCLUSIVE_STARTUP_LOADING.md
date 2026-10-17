# C111 — apresentação exclusiva do primeiro carregamento

## Proveniência e escopo — 2026-10-15

Pedido e emendas em architecture/C11_EXCLUSIVE_STARTUP_LOADING.md. Preflight
confirmou clone independente C11-main, main, origin canônico, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. Baseline privado de1017 arquivos
inclui alterações C107–C110, que permanecem preservadas fora da allowlist.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/reset/novo Gate.

## Comportamento implementado

Leitura/verificação e primeira sincronização sem catálogo REAL utilizável
têm tela própria antes do AppShell: menu e Home não são montados nessa fase.
Ao surgir catálogo local utilizável, a Home abre mesmo com sync em STAGING.
Catálogo REAL prévio continua abrindo localmente, sem reter a navegação.
Ativação e seleção de dispositivo permanecem anteriores ao catálogo.

Tablet/TV/dobrável quase quadrado: até seis posters à esquerda, estado/barra
à direita e fundo horizontal pelo mesmo resolver validado do hero. Celular:
somente poster vertical de fundo, sem mosaico, textos/barra sobre gradiente.
Crossfade6s após imagem pronta, máximo duas camadas, sem espera adicional
para concluir o boot. Falha de imagem não impede entrada. Respeitados
reduced-motion, visibilidade e pausa em erro/offline. Orientação intocada.

Capas vêm de filmes reais da importação já autorizada; amostra opcional em
RAM limitada a6, prioriza categorias Lançamentos/Cinema. Sem assinante não
coleta; apenas18 notificações no teste20k+12 filmes. Observador com exceção
não falha a importação. Nenhum ID/stream/staging/promoção foi alterado.
Fundo amplo resolve um candidato por vez com prioridade normal, máximo6,
reusando fila/cache/TMDB existentes; sem discovery ou nova busca de catálogo.

Barra usa porcentagem existente quando disponível, limitada99 antes da Home;
na ausência, informa etapa, sem inventar percentual ou prazo. Ações Ver
ativação/Portal ocultas na carga normal, disponíveis como recuperação em
erro/offline com Tentar novamente. Mensagem técnica bruta não é renderizada.

Preparo Fire C108 usa o mesmo visual via portal fora do shell, que fica
oculto/inert com geometria preservada. Restauração de atributos/foco ao sair.
Mantidos40 capas/8 por faixa,250ms para omitir em carga rápida, estabilidade
500ms, deadline20s, Entrar agora/Back e uma apresentação por documento.

## Validação executada

- C111:9 grupos PASS. Coletor RAM, importador M3U real/staging preservado,
  ramo Xtream real com C105/7 casos, App/React reais em Chrome isolado.
  Autoridade/hook de catálogo/páginas finais e resolver horizontal mockados;
  imagens e fonte sintéticas, nenhuma gravação em backend.
- Layouts960x540,800x880,390x844 e844x390: sem overflow horizontal;
  seis capas à esquerda/progresso à direita no amplo; celular sem mosaico
  nem consultas horizontais. Fade após6s, duas camadas e pausa offline PASS.
- Estado real/offline/error/retry, ativações obrigatórias, portal/Back,
  catálogo pronto durante sync e cache sem rebloqueio PASS. Ausência das
  duas ações na carga normal, redução de movimento e pausa oculta PASS.
- C108:13 cenários reais React/browser PASS, incluindo deadline20s, before
  reproduzindo falhas, carga rápida/cache, StrictMode, perfil/snapshot tardio,
  retorno, desmontagem, Back/Entrar agora e restauração de shell/foco.
- Preparo de arte C11:4 grupos PASS, limites/readiness/cancelamento mantidos.
- Importação bounded-memory:83 casos PASS, incluindo250k entradas sintéticas.
- Elegibilidade horizontal/vertical do hero PASS; C110/11 grupos PASS.
- TypeScript/Vite e lock26 ativação+27 promoção+9 negativos PASS antes/depois.
  Avisos Vite existentes de Node externo/imports mistos/chunk grande mantidos.
- Revisão React: hooks incondicionais, cleanup de listeners/timers/abort,
  snapshots estáveis, DOM/IO limitado, aria/progresso/reduced-motion/foco.

Capturas loading-{tv,square,phone,phone-landscape}.png em
tmp/c111-startup-loading usam somente CAPAS/FUNDO ILUSTRATIVOS de fixture,
nunca assets demonstrativos embarcados nem prova de fonte real.

## Entrega e limites

Build web, cap sync e Gradle assembleDebug PASS. APK local de teste
tmp/c111-startup-loading/Xandeflix-v1.0.19-C111.apk,11.445.445 bytes,
SHA2567de8aa2202abdd5c63a7db3b25a1d52ba5cc114d2c96f89bc3bec41c8190a0b6.
Package com.xandeflix.prebuilt, code19/name1.0.19, min23/target35, mesma
assinatura do C108,7 assets dist idênticos, produção HTTPS sem devserver.
Nenhuma versão publicada no updater; APK C108 anterior preservado.

Celular Samsung SM-S926B atualizado via install-r/Wi-Fi. Hash do APK instalado
idêntico;45 arquivos privados comparados em memória preservados, incluindo
identidade, chave/ativação, fonte e catálogo. UID/firstInstallTime preservados.
App aberto; captura inicial mostrou placeholders e captura posterior confirmou
Home/hero/capas reais, sem tela de carga tardia. Catálogo já existente: não é
teste de instalação limpa e não certifica o novo carregamento inicial físico.

Tablet não recebeu install/force-stop/reset; IP sem alcance em tentativas de
pareamento. Usuário escolheu instalar manualmente o mesmo APK, portanto sem
novas tentativas. Lock final26+27+9 PASS. Auditoria incremental preserva todos
os arquivos anteriores fora da allowlist; sem Git/backend/novo Gate.
Medições de primeira instalação física/desempenho não certificadas por este
teste de apresentação. Nenhum novo SLA, correção de playback Itália ou
alteração de fonte/control plane foi incluída.

## Avaliação posterior — troca rápida de canais, somente leitura

Pedido: verificar se buffer poderia abranger categoria/todos os canais.
Nenhum preload foi implementado nem stream adicional aberto nessa análise.

Código observado: android/variables.gradle usa Media3 1.5.1.
PlaybackBufferPolicy.Profile configura live min10s/max20s, início2,5s,
rebuffer4s; alvo16MiB TV/low-RAM ou24MiB handheld, prioridade bytes, backbuffer0.
Esses números são configuração de mídia bufferizada, não tempo de espera
garantido nem teto total da memória. LiveTvPage suspende stream anterior,
libera C9, adquire autorização do novo canal e atualiza o preview mantido.
NativeAndroidPlayerPlugin.updatePreview preserva player/view, mas suspensão
executa stop/clearMediaItems; playPreviewCandidate troca MediaSource/prepare.
Não há buffer compartilhado de outros canais. HTTP usa OkHttp singleton;
reuso do cliente já existe e não deve ser proposto como novidade implementada.

Conclusão: possível protótipo limitado a um candidato extra próximo/focado,
com pequena reserva fresca, após estabilizar o canal principal, desde que a
fonte permita conexão adicional e haja política/autorização expressa para
isso. A sessão C9 atual não certifica quota de streams extra no provedor.
Mídia secundária em RAM com limite global, sem decoder adicional, cancelada
ao sair/trocar fonte/categoria/background ou em pressão de memória/rede.
Em conta de uma conexão, manter apenas canal ativo e preparação de metadata
local; não abrir stream oculto concorrente. Configurações canônicas de buffer
e single-stream não foram alteradas. Implementação futura exige spec/emenda,
testes de autorização/Cast/PiP/Back, RAM/tráfego e fonte real TS/HLS.

Pré-carregar todos/categoria inteira não é indicado: custo cresce por canal,
mesmo que downloads pequenos sejam sequenciais; live envelhece e conexões
simultâneas podem exceder quota da fonte. Exemplo meramente aritmético:
50 canais de4Mb/s mantidos simultaneamente demandam200Mb/s, além de overhead.
HLS precisa validar janela atual; TS progressivo não tem a mesma janela
reposicionável, então não assumir que bytes guardados podem ser retomados
em nova conexão com continuidade. Não prometer troca instantânea: rede,
servidor, keyframes, codecs e autorização continuam no caminho crítico.

Fontes primárias consultadas em2026-10-15:
- [Media3 preload concepts](https://developer.android.com/media/media3/exoplayer/preloading-media/preloadmanager/concepts):
  priorização/duração por item, custo de preload agressivo, builder compartilhado.
- [Media3 1.5.0](https://android-developers.googleblog.com/2025/01/media3-150-whats-new.html):
  DefaultPreloadManager.Builder já existe na família1.5; exemplos atuais têm
  APIs posteriores e não devem ser copiados para1.5.1 sem validar versão.
- [Live streaming](https://developer.android.com/media/media3/exoplayer/live-streaming):
  janela móvel HLS/adaptativo e ausência dela no live progressivo.

Isto é viabilidade de Android/Fire/TV Box/tablet/celular Media3, sem benchmark
de troca nem prova de protocolo/fonte específica. Tizen/webOS exigem validação
separada dos players próprios. Nenhuma mudança adicional entrou no APK C111.
