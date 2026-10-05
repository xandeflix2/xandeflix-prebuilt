# C11 — Teste físico limpo no Fire Stick: importação ainda fecha por OOM

## Autoridade e isolamento — 2026-10-04

Usuário pediu explicitamente uninstall/reinstall limpo para simular primeira
instalação e medir abertura com conteúdo. Emenda anterior à operação em
../architecture/C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md; lock referenciado.
Preflight C11/origin/main/HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba revalidado,
dirty conhecido preservado. CURRENT_GATE=NONE, nenhum próximo Gate/Git/backend.
Contratos AGENTS/Architecture/Execution/Source Data Boundary/lock lidos.

Alvo único: 192.168.3.104:5555, model AFTSSS/API 28. Package único
com.xandeflix.prebuilt. Tablet RX2X301Q3KY e projetos protegidos não operados.
Nenhuma alteração de produção, rebuild, troca de APK, seed de fonte ou bypass.
Lock antes da instalação: 22 ativação + 27 promoção + 9 controles negativos PASS.

## Desinstalação e nova instalação

APK verificado localmente por SHA-256, package e certificado antes da remoção:
0450304141F162E0C3C912D416407B40A3B0620F1CB72D458B43C77E6EAC3781;
certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

Uninstall SEM -k: Success; pm path depois confirma package ausente. Install
APK: Success. SHA-256 do base.apk no aparelho corresponde integralmente ao APK
local. Antes da primeira abertura, run-as ls expõe somente cache/code_cache,
sem diretório files; nenhum processo do app. Não houve restauração dos dados
anteriores, pm clear não foi necessário. Dados privados anteriores (identidade,
chave, ativação, fonte/catálogo/cache) removidos conforme pedido; não exportados
nem respaldados para recuperação. APKs anteriores do workspace preservados.

Activity aberta normalmente por am start -W, sem intents/flags debug. PID 1964,
renderer 2073. Protetor de tela :dream cobria a janela durante inspeção; retirado
com Wakeup/D-pad normal, sem alterar ajustes do aparelho ou reiniciar app.
UIAutomator não expõe labels do WebView; não utilizado como falso vazio.

Skill investigation-mode guiou logs primeiro; agent-browser aplicável à consulta
da página mas CLI ausente. Fallback CDP read-only via socket confirmado do PID,
forward loopback temporário tcp:50526. Retorna só booleans/contagens/milestones,
nunca DOM bruto, PIN/hash/token/URL de fonte ou catálogo. Nenhuma captura de
ativação salva. Forward removido ao finalizar; lista de forwards vazia.

## Ativação limpa

UI sanitizada: activationNew=true, keyGenerating=false, keyCopyEnabled=true,
deviceCodePresent=true, invalidLicense=false, secureContext=true. Arquivos novos
device_identity.json, device_activation_key.json, app_installation.json e
pending_device_token.json presentes. Nenhum valor/chave extraído ou registrado.
Usuário confirmou dados de ativação visíveis, perguntou se podia ativar e
realizou pareamento pelo painel gestor. Agente não operou administração remota.

App saiu da tela de ativação, resolveu source e iniciou sincronização pelo
fluxo normal. device_activation.json presente depois. Campo authorized=false
no monitor era APENAS presença do texto "Dispositivo Autorizado" na página atual,
não leitura/status da autorização; Home em sincronização não mostra esse label.
Não interpretar como licença inválida. Nova identidade/ativação não apagadas
depois do crash, nem novo retry/reload/reinstall disparado neste teste.

## Tempos medidos e falha

Horários abaixo em America/Sao_Paulo (UTC-3), client date 2026-10-04. Milestones
monotônicos do WebView convertidos por performance.timeOrigin; não misturar T4
(leitura do estado) ou T5 (shell, mesmo não autorizado) com Home carregada.

| Marco | Horário local | Observação |
| --- | --- | --- |
| ActivityManager start PID 1964 | 13:07:16.668 | Primeira abertura após instalação |
| Activity Displayed | 13:07:22.880 | +6215ms; am TotalTime=5989ms; não é catálogo pronto |
| T8_CATALOG_SYNC_STARTED | 13:15:45.672 | Após pareamento pelo usuário; início medido de sync |
| IMPORT_FETCH_STARTED | 13:15:48.621 | Fetch autorizado device-direct |
| IMPORT_STREAM_PARSE | 13:15:59.999 | Fetch/download aproximadamente 11,378s |
| IMPORT_BATCH_PERSISTED | 13:16:02.330 | Primeiro batch persistido |
| Renderer V8 OOM | 13:17:22.520 | 96,847s desde T8 |
| Host SIGTRAP | 13:17:27.384 | 101,711s desde T8 |

Usuário relata fechamento após aproximadamente 1min30; logs instrumentados
registram aproximadamente 1min37 até OOM / 1min42 até saída do host, tomando
T8 como marco. Não corrigir relato do usuário nem confundir tempos arredondados
com milestones distintos. Espera humana pelo painel é separada e não prova
desempenho de importação. Tempo até Home com conteúdo NÃO EXISTE neste teste:
promoção T11 não observada, zero media-cards nas amostras, sem Home pronta.

Renderer 2073:

`V8 javascript OOM (Ineffective mark-compacts near heap limit)`.
Últimos Mark-Compact reduzem aproximadamente 224,5 -> 224,1 MB, permanecendo
quase todo heap ocupado. Host 1964 registra Fatal signal 5 (SIGTRAP) depois.
CDP fecha em seguida; isso é efeito da queda, não causa primária do crash.
Processos ausentes depois. files/prebuilt contém somente staging; du de staging
106872 KiB (~104 MiB). Nenhum snapshot completo promovido nem active pointer.

performance.memory retornou repetidamente 9,5367 MiB apesar da falha V8 com
224 MB. Essa amostra é estática/não confiável neste ambiente, DESCARTADA como
evidência de pico/consumo real. Heap limit informado aproximadamente 242 MiB
também não substitui logs de GC nem mede RSS. Não afirmar memória baixa por isso.

## Resultado e próxima fronteira

`CLEAN_UNINSTALL_REINSTALL=PASS`; `NEW_DEVICE_ACTIVATION_UI_AND_PAIRING=PASS`.
`FULL_CATALOG_IMPORT_AND_HOME=FAIL_PHYSICAL_V8_OOM`.
`FIRE_STICK_MAX_60_SECONDS=FAIL_THIS_CLEAN_TEST`.
`LATEST_PHYSICAL_REGRESSION_SUPERSEDES_LOCAL_FIX_CONFIDENCE=SIM`.

Patch de linhas detached/batch 2500 resolve mecanismo sintético coberto, mas
NÃO resolveu o fechamento físico nem homologou a importação. Manter PASS local
limitado aos seus testes, retirar qualquer inferência de correção física.

Inspeção local adicional observou bridge Capacitor que, quando logging habilitado,
envia objetos completos de calls/results a console.dir (incluindo opções de
writeFile/dataText); configuração não especifica loggingBehavior. Retenção de
payload no console é HIPÓTESE a isolar, não causa individual comprovada nem patch
autorizado por este relatório. Nenhuma dependência/config/produção modificada.
Próximo ciclo de correção deve medir heap real/retentores com dados sintéticos,
preservar privacidade/ativação e especificar nova allowlist antes de código.

Agente não reabriu automaticamente nem limpou staging/ativação após a falha.
APK no workspace continua mesmo hash; logs selecionados/sanitizados em memória.
Nenhum dump bruto, heap snapshot real, source payload ou credencial persistido.
