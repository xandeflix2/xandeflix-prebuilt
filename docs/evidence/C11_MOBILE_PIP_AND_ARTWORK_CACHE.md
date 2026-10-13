# C11 — PiP, cache de imagens e Google Cast — evidência

Preflight e proveniência no plano C11_HOME_HERO_VISIBLE_FIX. Specs precederam
o código. Cast LAN explicitamente autorizado, com emenda limitada no Source
Data Boundary; identidade, licença, boot e catálogo mantêm os contratos C11.

PiP: policy de API/perfil/estado de reprodução/fechamento passou nos testes
Java. MainActivity e NativePlayerActivity possuem configuração PiP no APK.
API 26+, aparelho não-TV e suporte nativo são exigidos. Android 12+ usa
autoEnter; Android 8–11 usa onUserLeaveHint. Mesmo player/sessão.

Cache: testes Java comprovaram hit após recriação sem download, TTL, poda
por bytes/quantidade, limite por imagem e limpeza de escrita parcial.
Limites: 150MiB, 1000 imagens, 30 dias e 8MiB por imagem. Falha volta à URL
remota; o cache é opcional, limitado e pode ser removido pelo SO.

Cast: SDK 22.3.1, minSDK 23 confirmado no AAR e APK. Relay HTTP em fixture
real passou para HLS, Range, HEAD, rotas opacas e expiração. Buffers e
conexões limitados; URL/header da fonte somente em RAM. Sem gravação de
vídeo, transcodificação ou proxy central. Receiver escolhido na LAN.
Lease de 120s; heartbeat a cada 45s só renova com sessão C9 ACTIVE.
Revogação, falha ou morte do processo encerram o transporte.

test-c11-mobile-output.mjs: PASS para guard, negação, heartbeat, eventos
stale e UI mobile. Browser confirmou ícones nos detalhes/Live, picker,
estado conectado e retorno local com adapter simulado; perfil Fire sem
ícone mobile. Player nativo inclui o botão Cast, ocultado em PiP.

Java: 116 testes, zero falhas/erros na rodada registrada.
PHYSICAL_PIP_PLAYBACK=PENDING; PHYSICAL_CAST_RECEIVER=PENDING;
PHYSICAL_ARTWORK_CACHE=PENDING. Não foi reproduzido stream privado nos
aparelhos por automação. Build e instalação não homologam receiver,
codec, seek, PiP em background ou cache durante uso físico.

APK, assinatura, assets e instalações:
[C11_OPTIMIZATION_REPORT_20261006.md](C11_OPTIMIZATION_REPORT_20261006.md).
