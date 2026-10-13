# C11 — guia EPG mobile retrátil — evidência 2026-10-07

Preflight read-only: workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, .git independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, originhttps://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS/Architecture/Execution/Source Data Boundary/lock lidos. Baseline669 e dirty anteriores preservados. Pedidos explícitos UI/EPG/correção fullscreen e update-r nos três alvos autorizados. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados nem executados. Sem edição do workspace histórico/projeto original, backend, credenciais, identidade, C9 ou catálogo.

## Resultado e funcionamento

No celular, o botão Guia de Programação fica acima da navegação inferior.
Abre um painel de baixo para cima, cobrindo abas e listas de canais/categorias
até a base do preview e sua faixa AO VIVO. Vídeo/canal continuam na mesma
sessão. Segundo toque fecha o painel; Escape/Back fecham o guia antes da
navegação, com prioridade do Back nativo de fullscreen. Listas permanecem
montadas e conservam scroll; foco retorna ao botão. Fora de <600px, a
apresentação ampla anterior continua, exceto tablet em retrato (item43). Cabeçalho compacto e ícones preservados.

O guia mostra canal selecionado, Agora/A seguir, horários locais com dia,
sinopse e progresso. Loading animado, indisponibilidade, autorização ausente
e erro com retry são distintos. Sem programa atual informado pela fonte,
há mensagem explícita; não inventa horário nem programação. Movimento reduzido
remove transição e rotação de loading. Não requer consulta no boot fechado.

## Transporte e limites

LiveEpgService resolve autorização fresca pelo provider canônico a cada carga.
Fonte ACTIVE, versão/validade e secure-store coincidentes. XTREAM usa conta
do contexto; M3U get.php usa conta do store autorizado. Canal com caminho
conta/conta/ID numérico pode vir de CDN e sem extensão: somente conta idêntica
é aceita. Endpoint player_api.php permanece na origem provisionada, nunca
na CDN. Sem conta/canal compatíveis: unavailable; sem autorização: bloqueado.
Nenhum decoder de XMLTV arbitrário, proxy central, catálogo remoto ou sessão
de vídeo adicional foi introduzido.

Device → API get_short_epg somente enquanto guia montado. Limite12 programas,
256KiB, prazo total8s e abort na troca/fechamento. Reader limitado no fetch web;
bridge HTTP Android pode bufferizar antes de aplicar limite pós-resposta.
Refresh60s enquanto aberto e relógio15s. Dados só em memória, sem logs de
URL/conta/payload. Parser UTF-8/base64/texto simples com limites, timestamps
absolutos, validação de intervalos, dedupe e descarte de passados; não adivinha
fuso de data textual sem offset. UI usa texto React, sem HTML da fonte.

## Verificação

Browser com AppShell/Header/LiveTvPage/LiveEpgPanel e serviço reais, autoridade/
fetch/preview por adapters sintéticos: 320×568,390×844,411×915,599×650. Botão
visível,2 programas/1 atual, painel sem overlap/overflow, listas ocultas só
durante abertura, scroll120 preservado e foco retornado. Toggle/Escape/evento
cancelável de Back, retry, vazio, loading/abort e resize1280 preservaram layout.
12 cenários do serviço cobriram autorização revogada/expirada/disabled,
ID inválido, tamanho/JSON inválidos, abort, M3U/versão/conta divergentes,
CDN sem extensão e ausência de programa atual. Prazo do fetch que não termina:
8006ms, abort confirmado; cancelamento precoce confirmado.
Não se trata de SLA de rede ou fonte.

No S24 real, consulta autorizada retornou status ready, 12
programas e 1 atual, tela visível. Apenas status/contagens
e geometria foram registrados, sem títulos/grade bruta/URL/segredos. A primeira
versão do parser rejeitava CDN/ID sem extensão: emenda anterior ao patch e
casos positivos/negativos resolveram a variante da fonte real. Capturas do
usuário do APK intermediário e regressão fullscreen não foram tomadas como
sucesso final: correções e verificação na evidência complementar.

Typecheck/Vite, lock22+27+9, Capacitor, Gradle,124 Java/0falhas/0erros,
assinatura/config/assets: PASS. Warnings já existentes de chunks/externalization/
flatDir/deprecated não foram refatorados fora do escopo. Revisão React: hooks
sem condicionais, imports diretos, efeitos com abort/cleanup, fetch adiado até
abertura, aria-expanded/controls/region/status/progress e foco preservados.

APK SHA-256: E19DC5339D89EDDC2AB70E9B5D2FD62CEAFC9C6B300257C2C4EA19F0D107F459; 12400179 bytes. Bundle dist/assets/index-L0bb-QGf.js; CSS index-BzG9xa8_.css. Package com.xandeflix.prebuilt; certificate b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d; versionCode1/versionName1.0/min23/target35, standalone HTTPS sem server.url. Assets6 iguais byte a byte.

| Alvo | Arquivos privados | Catálogo | Dados e firstInstallTime |
|---|---:|---:|---|
| AFTSSS | 467 | 436 | Preservados; APK idêntico |
| SM-X610 | 538 | 505 | Preservados; APK idêntico |
| SM-S926B | 548 | 508 | Preservados; APK idêntico |

Update-r comparou hashes dos arquivos privados antes/depois, com app parado,
antes de abrir para QA; inclui catálogo, estado nativo, prefs/WebView. Hash
instalado foi comparado ao APK entregue. SM-T561 adicional não foi alvo.

Allowlist: App.tsx, index.css, LiveTvPage.tsx, novos LiveEpgPanel.tsx e
live-epg.service.ts, contratos/evidências/relatório/memórias; emenda fullscreen
inclui NativeAndroidPlayerPlugin.java e novo teste de visibilidade. Provenance
conferida contra baseline669 e prefixos anteriores de memórias/relatório.

Limites: uma grade real do canal selecionado exercitada, não todos os1027
canais. Disponibilidade/correção dependem da fonte; M3U genérica sem API
compatível continua com mensagem indisponível. Receiver Cast, PiP e fresh
install físico não são certificados por esta mudança. Sem mudança de Gate.
[Contrato](../architecture/C11_MOBILE_LIVE_EPG_DRAWER.md);
[retorno fullscreen](C11_LIVE_FULLSCREEN_RETURN_AND_CAST.md).
