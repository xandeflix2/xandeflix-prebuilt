# C113 — remover seletor de áudio/legendas somente no Live

2026-10-15. Pedido explícito e allowlist registrados antes do código na emenda
C113 de architecture/C11_LIVE_PLAYER_CONTROLS.md. Preflight confirmou clone
independente C11-main/main/origin canônico e HEAD
0f68f169f7728fae17c8311832b7643629e97a02. Baseline1026 arquivos em
tmp/c113-live-remove-tracks/baseline.json; dirty C107–C112 preservados.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset/instalação.

Removidos live_tracks do layout Live compartilhado, listener, diálogo e dois
imports exclusivos em LivePlayerControls. Sem placeholder ou alvo de foco
residual. VOD PlayerControls.java e xandeflix_player_controls.xml byte a byte
inalterados: filmes/séries continuam com áudio e legendas. Sem alterar faixas
de mídia, som do canal, mute PiP, C9, fonte, buffer, Cast ou lifecycle.
CH+/− e demais ações do player C112 preservados.

Validação: C73/7 grupos PASS, incluindo ausência do seletor Live e presença
VOD; dispatch Java C112 PASS. Gradle37 JUnit/6 classes PASS (LiveControls4,
Cast2,tap6,awake8,NativePlayerActivity11,buffer6), assembleDebug PASS.
Lock prévio/após patch/pré-Gradle/final26 ativação+27 promoção+9 negativos PASS.
AAPT do APK compilado confirma ausência de legendas no layout Live e presença
no VOD;7 assets dist idênticos, package/certificado anteriores, HTTPS produção
sem devserver. Nenhum novo teste criado, critérios existentes atualizados
para a emenda sem remover proteções. QA física não executada.

APK tmp/c113-live-remove-tracks/Xandeflix-v1.0.19-C113.apk,
11.445.445 bytes; SHA256
14b1058303daa57f68e7af45492c07194d16f2adc4fc0723b000c222e2eb8870.
Code19/name1.0.19 local, min23/target35, sem publicação no updater ou nova
instalação. C112 anterior preservado, auditoria incremental fora da allowlist
PASS. Avisos Gradle flatDir existentes mantidos; nenhuma falha observada.
