# C11 — Fire Stick: OOM JavaScript na sincronização do catálogo

## Escopo e proveniência — 2026-10-04

Conexão ADB por Wi-Fi solicitada explicitamente pelo usuário. Preflight C11:
workspace/top-level corretos, origin esperado, main/ahead 2, HEAD
`f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`. AGENTS, Architecture, Execution,
Source Data Boundary e lock de ativação lidos integralmente. CURRENT_GATE=NONE;
nenhum próximo Gate nem commit/push/PR autorizado. Apenas diagnóstico read-only
no aparelho e memória documental (este relatório, STATUS, EVOLUTION, ERRORS).

Usuário abriu o app manualmente, informou sincronização e depois fechamento.
O agente não abriu/reinstalou/limpou dados/forçou parada nem alterou identidade,
ativação, autoridade, fonte, código de produção ou APK. Logs selecionados e
sanitizados em memória; nenhum dump bruto de fonte/credenciais salvo.

## Ambiente e APK

- Fire TV Stick `AFTSSS`, Android API 28, ABI arm no relatório nativo.
- Amazon WebView `128.amazon-webview-v128-6613-tv.6613.187.33`.
- MemTotal do kernel: 921136 KiB; amostra não é um limite contratual de memória.
- Pacote com.xandeflix.prebuilt, versionCode 1/versionName 1.0.
- APK instalado SHA-256:
  `8828F12016892A29E3B15D0009315E3A404D4C2495F6FB8A2105DE5D15FD4B8C`.
  Corresponde ao backup do APK anterior, não ao novo aviso de reprodução.
- APK raiz preservado SHA-256:
  `D601864B2E79292980869F47B6CBB34440E2E7F63DCE6C3C353A1AD3CD753385`.
  Não presumir que instalar esse aviso resolveria OOM na importação.

## Reprodução e causalidade confirmada

Horários locais registrados no aparelho; não confundir com duração de ativação
nem extrapolar para SLA/todos os dispositivos:

1. 12:12:44.607: ActivityManager inicia app PID 23077.
2. 12:12:47.571: inicia renderer PID 23179 para WebView deste aplicativo.
3. 12:15:23..28: app grava episódios/streams dos segmentos 221..229; últimos
   registros de trabalho em `prebuilt/staging/<snapshot>/segments/`.
4. 12:15:29.231: V8 imprime Last few GCs, Mark-Compact; último ciclo
   `225.4 (227.6) -> 224.8 (227.7) MB`, com allocation failure.
5. 12:15:29.244: renderer registra
   `V8 javascript OOM (Reached heap limit).`
6. 12:15:33.778: renderer morre; 12:15:33.957 app detecta crash code 5.
7. 12:15:33.978: mensagem fatal informa que a queda do renderer não foi tratada
   por todas as WebViews associadas; 12:15:33.979 SIGTRAP do app. Depois, processo
   desaparece. Intervalo start do app -> SIGTRAP aproximadamente 169 segundos.

`ROOT_CAUSE_CLASS=V8_JAVASCRIPT_HEAP_EXHAUSTION_DURING_CATALOG_IMPORT`.
`SECONDARY_FAILURE=UNHANDLED_WEBVIEW_RENDERER_LOSS_CRASHES_HOST_APP`.
O fechamento observado é durante processamento/gravação do catálogo, não erro
terminal do player ou evidência de chave/licença inválida. Não foi comprovado
qual objeto/alocação específica esgotou o heap: os últimos segmentos indicam a
fase, não tornam o writer isoladamente culpado. Pico RSS não foi amostrado.

Crash anterior 08:31 também mostrou renderer perdido/SIGTRAP do host, mas os
logs antigos do renderer haviam saído do buffer. A nova tentativa forneceu a
evidência V8 que faltava; não atribuir genericamente a morte a um kill do kernel.
Acesso dmesg negado (`Operation not permitted`), sem bypass; logs V8 e sequência
por PIDs já são suficientes para a classe de causa desta reprodução.

## Código observado e limite de conclusão

BridgeWebViewClient da dependência local agrega onRenderProcessGone dos
listeners e retorna false quando nenhum trata. Não encontrado handler/listener
equivalente no código nativo do app. Nenhuma dependência ou Activity foi editada.
Importação usa batches/segmentos e mantém acumuladores de metadata. Não foi
coletado heap snapshot nem identificado um vazamento/retentor individual.

A skill investigation-mode guiou captura por PIDs e separação do primeiro erro
OOM da queda em cascata; investigação encerra esta etapa com causa de classe
confirmada, sem patch por hipótese. Próximo escopo funcional exige autorização
e especificação: reduzir retenção/pico de memória do importador no Fire Stick,
preservar catálogo completo/promoção atômica/ativação e tratar falha nativa de
forma controlada. Apenas suprimir o SIGTRAP não concluiria a importação.

Regressão física permanece aberta. Para correção futura, executar lock oficial
antes/depois/build, testes de catálogo/ativação/playback e validação física por
Wi-Fi sem reset de dados; nenhum APK corretivo foi gerado/instalado neste ciclo.
