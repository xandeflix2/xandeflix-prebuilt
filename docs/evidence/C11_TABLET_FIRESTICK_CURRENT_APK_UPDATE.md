# C11 — Tablet e Fire Stick atualizados sem limpeza — 2026-10-05

## Escopo e artefato

Usuário autorizou instalação da versão atual no tablet e Fire Stick.
[Plano prévio](../architecture/C11_TABLET_FIRESTICK_CURRENT_APK_UPDATE.md).
Workspace C11 independente/main/origin canônico, HEAD61ec009; dirty anterior
conhecido preservado. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Nenhum commit/push/PR, rebuild, patch funcional ou alteração de backend.

APK entregue existente: Xandeflix-v1.0.0-standalone.apk, 8.785.127bytes,
SHA256F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8.
Packagecom.xandeflix.prebuilt, versionCode1/versionName1.0, min23/target35,
assinatura verificada com certificado debug canônico. Cinco assets do APK
byte-idênticos ao dist atual; dois placeholders Cordova vazios do Capacitor
validados separadamente. Standalone/HTTPS sem server.url. Nenhum APK reescrito.
Lock oficial antes da entrega:49 casos e9 controles negativos PASS em mocks.

## Entrega por alvo

Somente os dois alvos conectados receberam comandos, sempre com serial fixo.
Samsung SM-X610 USB/API36 atualizado primeiro; Amazon AFTSSS/API28 via Wi-Fi
192.168.3.103:5555 em seguida. APK anterior diferente do atual nos dois aparelhos.
SM-T561 não conectado; celular não instalado nem operado neste ciclo.

Package parado para congelar gravações durante conferência/install, sem limpar.
Ambos os adb install -r retornaram Success/exit0. Verificação após atualização:

| Alvo | Arquivos privados preservados | Arquivos files/prebuilt preservados | SHA256 instalado igual ao APK |
| --- | --- | --- | --- |
| SM-X610 | 5/5 | 505/505 | SIM |
| AFTSSS | 5/5 | 436/436 | SIM |

Os cinco privados são identidade, chave permanente, ativação, instalação e
token pendente. Hashes completos antes/depois comparados somente em RAM;
nenhum conteúdo, URL, token, chave ou fingerprint privado publicado/salvo.
Todos os firstInstallTime reportados permaneceram inalterados, incluindo
user0 no tablet. Package/versão1.0/min23/target35 confirmados após entrega.
lastUpdateTime reportado pelos dispositivos: tablet2026-10-05 21:17:37;
Fire Stick2026-10-05 21:18:06. Horários observados, não benchmark/SLA.

Nenhum uninstall, pm clear, downgrade, root, grants amplos, rotação ou restauração
de dados de outro aparelho. Aplicativos não reabertos automaticamente; validação
visual e de reprodução cabe ao usuário e não é certificada pelo install Success.

## Consulta auxiliar e relato anterior

Primeira conferência de assets buscou também cordova.js/cordova_plugins.js
em dist e parou com APK_DIST_ASSET_MISSING. Inventário mostrou dois placeholders
de tamanho zero gerados pelo Capacitor, além dos cinco assets web reais. Nova
conferência partiu dos cinco arquivos reais de dist, exigiu igualdade de hashes
e validou estritamente os dois extras vazios. Sem mudança/reempacotamento do APK
ou relaxamento do lock. Avisos META-INF/v1 preexistentes mantidos.

No SM-T561, relato anterior de RPC_FAILED/RPC foi seguido pela informação do
usuário de que ligar internet iniciou sincronização. Conectividade é hipótese,
não causa comprovada; catálogo completo/playback não confirmados nesse alvo.
Nenhuma correção especulativa de ativação ou chamada remota realizada.

Auditoria final:489 arquivos fora do recorte documental byte-idênticos,
incluindo runtime/config/Android/testes, cinco outputs dist, APK e sete
operacionais locais. HEAD61ec009 inalterado, tracked dirty somente três
memórias documentais permitidas; planos/evidências novos não staged. Cache
transitório ignorado; git diff --check PASS, avisos LF→CRLF preexistentes mantidos.
Registros deste ciclo permanecem locais, não publicados. Instalação e
preservação verificadas nos dois alvos; teste visual/playback não executado.
