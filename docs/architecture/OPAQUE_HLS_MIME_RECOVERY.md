# CANON-01-OPAQUE-HLS-MIME-RECOVERY — especificação antes do patch, 2026-10-23

P1 condicional autorizada pelo usuário no pedido de recuperação funcional. Texto integral e hash real preservados na evidência. Causa reproduzida no Fire Stick pelo fluxo normal de canal permitido: Media3 UnrecognizedInputFormatException; catálogo declara m3u8 e URLs têm forma opaca /play/<token>/m3u8, sem extensão .m3u8. Celular apresenta a mesma forma nas amostras, ainda sem confirmação física da causa. Tablet MPEGTS usa /play/<token>/ts e chega ao estado READY.

Proposta mínima: dica MIME application/x-mpegURL somente para HTTP(S) com host válido, sem userinfo, caminho bruto exato /play/[A-Za-z0-9_=-]+/(hls|m3u8). Preservar URI original, query, headers, candidatos, autenticação e política de erros. Aplicar em ambos os MediaItems (preview e fullscreen). Demais formatos mantêm inferência padrão; não adivinhar formato por categoria ou por parâmetro output. HLS convencional continua inferido pela extensão.

Reprodução vermelha: teste Java funcional da dica ausente e proteção de ligação dos dois MediaItems, antes do patch. Positivos HTTP/HTTPS, hls/m3u8, query e pipe headers; negativos TS/MPEGTS/MP4/MKV/DASH, protocolos não HTTP, userinfo, caminhos ambíguos, percent encoding e sufixos extras. Testar MediaItem.mimeType quando possível em JVM; conferir ligação de ambas as entradas por teste. Conservar os 206 testes Android anteriores,135 controles/23 suítes canônicas,127 Prebuilt,21 recibos e todo L1. Recibo novo só para estes cinco arquivos protegidos; verificador/workflows/package/versão imutáveis.

Allowlist fechada de 12 caminhos na cópia isolada:
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeStreamRequest.java
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java
- android/app/src/test/java/com/xandeflix/prebuilt/player/OpaqueHlsMimeRecoveryTest.java
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-OPAQUE-HLS-MIME-RECOVERY.json
- docs/architecture/OPAQUE_HLS_MIME_RECOVERY.md
- docs/evidence/OPAQUE_HLS_MIME_RECOVERY.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Workspace ativo e seus 10 caminhos L1 permanecem byte-idênticos. Sem instalação, exclusão, refresh/importação manual, nova identidade, mudança de fonte/parental/licença, Git add/commit/push/main, Vercel ou backend. APK experimental separado após validações; recuperação física permanece PENDING até teste autorizado. A lentidão de ativação é investigação separada; não alterar importador sem causa comprovada nem prometer SLA.

Referência primária: https://developer.android.com/media/media3/exoplayer/hls — URI sem extensão requer setMimeType(MimeTypes.APPLICATION_M3U8). Não atualizar dependências.
