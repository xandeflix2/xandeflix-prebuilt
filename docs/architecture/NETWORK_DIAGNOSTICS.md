# CANON-01-NETWORK-DIAGNOSTICS — especificação anterior ao código

Pedido explícito atual autoriza diagnóstico de internet em Configurações e indicador junto/à esquerda de Voltar em Canais, ampliado para conexões ativas/máximas informadas pela fonte. Continuação local isolada sobre R2 corrigido, sem alterar root/L1 nem fonte recebido. Não altera limites/licença/C9/player, boot, catálogo, secrets, versão, main, backend, Vercel, pacote/lock/config/manifest. Não executar Git add/commit/push/PR/merge ou reset. Nenhum teste automático pode inventar aprovação física.

Android: plugin próprio somente leitura de ConnectivityManager, permissão ACCESS_NETWORK_STATE já presente. Estado nativo diferencia transporte Wi-Fi/Ethernet/celular/VPN/outro e VALIDATED/CAPTIVE_PORTAL/sem rede/indeterminado. Callbacks registrados sob demanda e removidos ao sair; sem ping/GET periódico de internet, SSID/IP/localização ou alteração da rede. Web: navigator.onLine indica apenas conectividade, nunca valida internet nem inventa transporte.

Teste manual em Configurações, montado só ao abrir modal; resultado aproximado downloadMbps e tempo de resposta HTTP (não ping ICMP). Endpoint público fixo HTTPS speed.cloudflare.com/__down, sem SDK/telemetria/upload/cookies/credenciais/referrer; até5MB de payload,15s, cancelamento ao fechar/sair/ocultar/ficar offline ou iniciar playback/Cast. Uma execução por vez; não executar se reprodução/Cast ativa ou estado não confirmado. Resultado identifica endpoint e limitações, dados móveis consumidos e ausência de garantia de reprodução. Leitura incremental sem guardar payload/cache. Não medir automaticamente ao abrir página/canal.

Contagem: ler somente user_info autenticado da API player_api.php derivada explicitamente da configuração autorizada/selada, pelo transporte device-direct limitado a64KiB e timeouts curtos. Revalidar autoridade/binding/versão e snapshot antes do fetch e descartar resultado se cancelado; nenhum GET de mídia/catálogo, inferência de credenciais por stream, exposição de URI, persistência ou mudança de fonte. Mostrar active_cons/max_connections só para auth1/status Active e inteiros válidos; zero active é válido, zero max/ausência/inválido significa indisponível. Não confundir com C9/licença nem negar/expulsar sessão com esse dado. Pode haver atraso do provedor. Consultar em foreground com intervalo60s após conclusão, sem sobreposição; cancelar/limpar ao sair, ocultar, offline ou trocar snapshot. Sem contagem sintética/stale fallback.

Aceitação: baseline canon152/27,895 protegidos,27 recibos e C11 PASS antes de código. Novo recibo encadeado aos grants reais; preservar27 recibos e todos controles/suítes anteriores. Testes JS de transporte/contagem/cancelamento/timeout/limite/HTTP inválido/consentimento manual e sem credenciais; negativos impedem bypass/probe e contagem falsa; testes nativos de classificação pura e ciclo de vida revisado. Validar13 comandos, testes Android completos e revisão React/foco/layout nos tamanhos representativos. APK de teste recuperável sem instalar/resetar dispositivos neste novo ciclo até autorização de entrega física; mesma versão/assinatura, plugins gerados verificados. Build/APK não certificam rede física nem quota do provedor.

Documentos normativos somente append; novo gate/recibo/evidência nominal. Git funcional do recebido e root congelados. Auth SHA256 aa62eb5c93cb5e7e9e7b6a01e2e22b3a3a43e3500dce33276729e44067715026 é hash de transcrição, não assinatura humana.

Allowlist fechada (21):
- src/network/diagnostic-policy.ts
- src/network/network-status.ts
- src/network/source-connections.ts
- src/ui/components/ConnectionIndicator.tsx
- src/ui/components/NetworkSettings.tsx
- src/ui/components/NetworkDiagnostics.css
- src/ui/pages/SettingsPage.tsx
- src/ui/pages/LiveTvPage.tsx
- src/ui/pages/LiveTvPage.css
- android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java
- android/app/src/main/java/com/xandeflix/prebuilt/network/NetworkStatusPlugin.java
- scripts/test-network-diagnostics.mjs
- android/app/src/test/java/com/xandeflix/prebuilt/network/NetworkStatusPluginTest.java
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-NETWORK-DIAGNOSTICS.json
- docs/architecture/NETWORK_DIAGNOSTICS.md
- docs/evidence/NETWORK_DIAGNOSTICS.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Referências verificadas: https://developer.android.com/develop/connectivity/network-ops/reading-network-state e https://github.com/cloudflare/speedtest/blob/main/README.md . O endpoint é do projeto oficial; não usar seu SDK com coleta de resultados.


## CANON-01-NETWORK-DIAGNOSTICS — implementação local — 2026-10-24

Pedido atual retomou diagnóstico de internet em Configurações e indicador antes de Voltar em Live, incluindo contagem informada pela fonte. Especificação anterior ao código: docs/architecture/NETWORK_DIAGNOSTICS.md; autorização UTF-8/LF SHA256 aa62eb5c93cb5e7e9e7b6a01e2e22b3a3a43e3500dce33276729e44067715026 (transcrição, não assinatura humana). Trabalho isolado sobre R2, root/L1 e recebido preservados. Grants encadeados: {"scripts/test-canonical-regression.mjs":"CANON-01-LIVE-SINGLE-TRANSPORT"}. Player/buffer/C9, fontes, identidade, versão e dependências preservados; sem instalação/publicação ou escrita administrativa.

Estado nativo sem sondagem, teste manual até5MB/15s com abort/guarda de playback/Cast, contador autenticado até64KiB por minuto em foreground. Nenhum GET de mídia ou contagem fabricada. Preliminar21 cenários PASS; revisão visual refinou título/altura do telefone e5 layouts confirmaram posição antes/centralizada com Voltar. Settings sintético confirmou zero solicitações automáticas, resultado manual, cancelamento sem falso resultado e fechamento. Fixtures não certificam aparelhos. Validações13 comandos/testes nativos/APK PENDING neste registro.


## CANON-01-NETWORK-DIAGNOSTICS — conclusão local — 2026-10-24

RESULT=LOCAL_READY_FOR_DEVICE_TEST. Internet e conexão em Configurações, medição manual de download/resposta HTTP, indicador OS de transporte/internet junto à esquerda de Voltar e contagem active_cons/max_connections quando válida. Sem contagem fabricada, enforcement, GET extra de mídia ou mudança no player/C9. Metadados da fonte atualizados em foreground a cada60s depois de concluir a consulta, com limite64KiB; teste público até5MB/15s, cancelável e bloqueado por reprodução/Cast. Web online permanece acesso não confirmado.

Treze comandos oficiais exit0 na árvore isolada. Canônico168 controles/28 suítes, preservados152/27 anteriores; nova suíte21 cenários. Android222 testes/37 suítes executados com0 falhas/erros/skips. Cinco layouts em navegador e fluxo Settings passaram com fixtures, incluindo zero solicitações automáticas e foco restaurado ao cancelar. Endpoint público respondeu HTTP200/CORS para origem local em GET de0bytes; não foi medido throughput real em aparelhos. Novo plugin compilado/registrado, três plugins base presentes no APK, permissões iguais ao R2, todos assets dist conferidos, sem padrão de credencial privada detectado.

APK de teste Xandeflix-v1.0.37-diagnostico-internet-20261024.apk SHA256 ba3ba5bbc99d1d825f308978a9aab68046a5042e13350a09b5f30e6b8724759a,11423505bytes, mesma versão1.0.37/code37/package/assinatura. Nenhum dispositivo atualizado neste ciclo: validação física do novo recurso PENDING e congelamento Live previamente relatado não corrigido por esta feature. A observação anterior10min34s pertence ao R2 anterior e não é evidência física deste APK.

Vinte e sete recibos anteriores intactos, novo28º recibo LF 80a4d01348eb82b4a7cafd4836c3f221d97e02e5, SHA256 be38ad8db5fc38cf700adebee4be7bb845a10797bc6c0401166705b016a79030. Allowlist21 caminhos; root/L1 e recebido congelados, documentos normativos append-only. Sem Git add/commit/push/PR/merge/main, atualização administrativa Supabase/Vercel, reset, versão nova ou próximo Gate. Preparação: guard Unicode de integração retomado sem descartar import; teste SSR preliminar precisava de React real no harness; revisão de imagem encontrou título/altura do telefone e refinou CSS/asserções antes dos13 comandos. Nenhum teste foi enfraquecido para esconder falha.
