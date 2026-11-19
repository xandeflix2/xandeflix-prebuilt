# CANON-01-LIVE-SINGLE-TRANSPORT — especificação anterior ao código

Autorização explícita atual: corrigir o GET diagnóstico adicional, gerar APK e atualizar/testar dois aparelhos distintos disponíveis. Emenda local CANON-01; nenhum commit/push/PR/merge. O celular não está no ADB; alvos disponíveis são tablet SM-X610 e Fire Stick AFTSS. Atualização in-place somente no package com.xandeflix.prebuilt e mesma assinatura; preservar dados/identidade/chave/ativação/fonte/parental/catálogo, sem uninstall/reset. Não abrir mais de duas reproduções reais nem contornar C9, PIN ou fonte.

Fonte recebido verificado:1364 arquivos,26 recibos,147 controles/26 suítes,894 protegidos,127 Prebuilt,APK63f3232b049c8052542e0239fa0f1d43bb727bc81d8770a5022227e8b2c3513f. Root/L1, fonte recebido e todos APKs anteriores ficam intactos. Nova cópia Git isolada de histórico completo, branch/HEAD/origin canônicos preservados.

Causa técnica comprovada: NativePlayerActivity.playCandidate e NativeAndroidPlayerPlugin.playPreviewCandidate iniciam SecurePlaybackDiagnosticProbe.run em paralelo à mídia em builds depuráveis. A função faz outro GET com Range até16KiB. O provedor pode contá-lo como conexão adicional, mas a causalidade na queda real relatada permanece hipótese até novo teste.

Patch mínimo: remover apenas os dois disparos automáticos. Manter enabled/newAttemptId/TransferListener e logs sanitizados do transporte Media3 existente. Não alterar o helper histórico de probe nem seu teste R6, buffer, MediaItem/MIME HLS, candidatos/headers/credenciais/URI, timeouts/retries, sessão C9, limites, catálogo, UI, AndroidManifest, package/Gradle/version/Capacitor/dependências ou serviços externos. Helper não terá caller de run no código de produção. Não corrigir corrida de heartbeat ou fixtures auxiliares antigas neste Gate separado.

Aceitação anterior ao patch: nova regressão identifica o defeito nos dois arquivos recebidos (RED esperado). Depois protege ausência de todos os callers ativos de run; preserva transporte/mime/buffer/logs passivos; negativos restauram cada caller e devem ser rejeitados. Fixtures C9 reais em memória validam licença2 com2 dispositivos, negação do terceiro preservando ambos e licença1 negando o segundo sem expulsar o primeiro. Não declarar fixture como provedor/dispositivo real.

Registrar novo recibo com hashes LF reais: ambos arquivos Android supersede CANON-01-OPAQUE-HLS-MIME-RECOVERY; runner supersede CANON-01-HERO-PLATFORM-ALIGNMENT; script de regressão novo before:null. Preservar os26 recibos e prefixos dos4 documentos normativos. Runner mantém147 controles/26 suítes e acrescenta proteção nominal e nova suíte. Sem alteração do verificador/workflows.

Baseline: canon:check e C11 novos; canon:test147/26 da auditoria recente reutilizado somente após conferência de todos1364 bytes/hashes, log/exit0 preservados. Depois executar13 comandos oficiais em sequência, R6 intocado, todos testes unitários Android novamente porque houve alteração nativa, cap copy, assembleDebug e lock antes da entrega. Teste físico: verificar pacote/hash/certificado e preservar dados antes/depois; observar duas sessões autorizadas/buffer sem GET extra; não simular queda desligando Wi-Fi nem extrair credenciais. Sem PIN do usuário, bypass ou quota falsa. Testes físicos indisponíveis ficam PENDING, não PASS.

Allowlist fechada:
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java
- android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java
- scripts/test-live-single-transport.mjs
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-LIVE-SINGLE-TRANSPORT.json
- docs/architecture/LIVE_SINGLE_TRANSPORT.md
- docs/evidence/LIVE_SINGLE_TRANSPORT.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Authorization SHA256 af1f00bdf115b0e1320d4a7945632a5785d51d49bbb8caf0dc243837ba291b39. Hash de transcrição, não assinatura digital humana. Não alterar main/Supabase/Vercel nem iniciar outra implementação.


## Conclusão local — CANON-01-LIVE-SINGLE-TRANSPORT

Treze comandos oficiais exit0,152 controles/27 suítes e895 protegidos,13 cenários dedicados e127 Prebuilt. Todos215 testes nativos/36 suítes executados novamente,0 falhas/erros/skips. Código compilado: 2 callers antigos de probe contra0 novos nos dois players; helper histórico/R6 preservados. Buffer/C9/HLS/versão/fonte/UI não mudam. APK Xandeflix-v1.0.37-live-conexao-unica-20261023.apk SHA256 efc87e066427bd656abcdbefcc063a04b7a8a4ff4c1f35a6d3b131d80ff27f56, mesma assinatura b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

Uma primeira aplicação parou no guard de bloco LF contra arquivo recebido CRLF; ajustado apenas o localizador, preservando EOL e a cópia recebida. Primeiro Gradle não executou testes porque local.properties ignorado tinha escape Windows inválido; caminho SDK verificado corrigido para barras normais e retry real exit0. Logs originais e falhas preservados, sem alteração de timeout/assertion nem código entre13 comandos e retry nativo. Duas falhas auxiliares de harness da auditoria anterior continuam conhecidas e fora da validação ampliada deste patch.

Instalações in-place confirmadas: 2/2; registros privados medidos preservados, sem valores/hashes privados exportados. Homologação física de duas telas: BLOCKED_CATALOG_STARTUP_ERROR. Resultado observado é separado de quota do provedor e de internet lenta controlada. Nenhum Git add/commit/push/PR/merge/main, deploy, mudança administrativa Supabase/Vercel, fonte/licença, reset ou nova implementação.


Resultado físico final: BLOCKED_CATALOG_STARTUP_ERROR. Tablet e Fire Stick exibiram “Não foi possível concluir o carregamento”, após resolver fonte e iniciar sincronização, antes da navegação normal de canais. Nenhum player foi iniciado pelo teste; buffer, queda de rede e duas telas reais NÃO foram medidos/aprovados. A causa detalhada da falha de catálogo e sua relação com este APK permanecem indeterminadas; não atribuir ao provedor ou à correção sem evidência. Metadados privados foram conferidos byte a byte imediatamente após cada instalação, antes da abertura normal; a importação normal posterior pode atualizar catálogo. A primeira tentativa no Fire Stick parou antes da instalação por ausência do executável test no Fire OS, não por ausência dos registros privados: verificação via sh/test comprovou o falso negativo, e a retomada somente no Fire Stick preservou todos os11 registros medidos. Nenhum dado foi limpo. Procedimentos/evidências iniciais preservados. RESULT=BLOCKED_PHYSICAL_VALIDATION; APK_LOCAL=PASS; INSTALLED=2/2; DUAL_PLAYBACK=NOT_RUN; PHYSICAL_BUFFER=NOT_RUN.


## R2 — correção de empacotamento e retomada física — 2026-10-24

A investigação posterior confirmou a causa da regressão de catálogo do R1: o build novo por cap copy omitiu o asset gerado e ignorado capacitor.plugins.json. Filesystem/Browser/Share não eram registrados; a importação terminava em not implemented, embora o download de fonte respondesse HTTP2xx. Os três APKs anteriores tinham o registro. O status bloqueado anterior permanece como evidência histórica e não é a conclusão do R2. Falha de empacotamento assumida pelo executor, sem atribuição ao provedor.

Correção: gerar somente o asset ignorado com writePluginsJson da CLI Capacitor instalada, usando plugins reais. Registro semanticamente igual ao APK anterior; quatro negativos rejeitam R1 sem registro, Filesystem ausente, duplicata e classe errada. Nenhum código/recibo/CLI/dependência/Gradle/configuração mudou. A comparação dos ZIPs R1/R2 comprovou somente capacitor.plugins.json e metadados de assinatura diferentes; DEX/manifest/resources/web idênticos. Cinco verificações adicionais de empacotamento/build/lock/canon exit0.

APK R2 Xandeflix-v1.0.37-live-conexao-unica-corrigido-20261024.apk; SHA256 38f8e421f10d24beeee2b5bde602b41f183943afebbc95dddef05c039722c077; bytes 11482629; package com.xandeflix.prebuilt,1.0.37/code37, mesma assinatura. R1 preservado para auditoria e rejeitado para entrega. Atualizações in-place tablet+Fire Stick concluídas;11 registros privados conferidos em RAM e primeira instalação preservados por aparelho, sem valores/hashes privados registrados. Plugins registrados, stat do ponteiro local e Home/navegação confirmados nos dois. Celular não atualizado: última correção expressa do usuário informa conta diferente. Par de simultaneidade permanece tablet+Fire Stick, mesma conta segundo usuário, sem quota presumida como consultada.

A primeira observação física R2 terminou em EVALUATION_TIMEOUT; o usuário informou ter reiniciado a conexão ruim do Fire Stick. Instante exato não medido, sem atribuir todos os eventos à rede. Evidências iniciais preservadas e classificadas INCONCLUSIVE; a retomada R2B usa o mesmo APK, sem reinstalar. Observação simultânea R2B por 126193ms depois do segundo início: ambos emitiram playing, adquiriram C9 e não emitiram erro de preview/mensagem nem erro nativo observado. Sem novas retomadas/buffering na telemetria observada=true. PROBE_START=0 nos dois. Progresso independente de SurfaceView confirmado em ambos=false; ausência dessa métrica no tablet limita a confirmação independente de vídeo contínuo. Sem interrupção forçada de rede pelo agente, limitação artificial de velocidade, consulta de quota do provedor, PIN/bypass ou terceira reprodução por este teste. Resultado restrito à rede/canais/conta observados; não certifica todas as fontes nem duração de reprodução durante queda. Buffer conserva metas live10–20s/início2,5s/retomada4s, condicionadas à mídia/memória; logs de transição não medem continuamente a reserva. Ao final, navegação normal para Home solicitada para liberar as sessões de teste.

Treze comandos oficiais anteriores exit0,152 controles/27 suítes,895 protegidos,127 Prebuilt e215 testes nativos/36 suítes sem falha/erro/skip permanecem evidências dos mesmos hashes de fonte. Nenhum teste repetido sem necessidade; negativos novos do empacotamento e checks antes/depois registrados separadamente.27 recibos,26 históricos preservados; allowlist11 caminhos e documentos normativos append-only. Sem Git add/commit/push/merge/main, mudança de versão, dados/reset, administração Supabase/Vercel, deploy ou próximo Gate. Evidências: tmp/live-single-transport-20261023/R2_REPORT.md, R2_APK_AUDIT.json, R2_PLUGIN_GENERATION.json, INSTALL_R2_TWO.json, R2_PLUGIN_CAPABILITIES.json, R2B_PHYSICAL_DUAL_RESULT.json.
