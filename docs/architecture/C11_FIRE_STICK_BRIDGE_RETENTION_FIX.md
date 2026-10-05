# C11 — Retenção residual da ponte nativa no Fire Stick

## Autoridade e proveniência — 2026-10-04

Usuário respondeu "prossiga" ao pedido de corrigir a retenção residual sem
alterar a ativação nem reinstalar novamente. Ciclo local sucessor do teste
limpo reprovado; CURRENT_GATE=NONE, NEXT_GATE_STARTED=NAO. Workspace único
C:\Xandeflix\xandeflix-prebuilt-c11-main, origin esperado, main/ahead 2,
HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. Preflight, AGENTS, Architecture,
Execution, Source Data Boundary e lock de ativação lidos; dirty preservado.
Lock antes do patch: 49 casos e 9 controles negativos PASS. Sem Git/backend.

## Evidência e hipótese anteriores ao código

Teste físico limpo: V8 OOM, 224,5 -> 224,1 MB após GC, antes de promoção.
CapConfig.java local usa loggingBehavior=debug por padrão; APK assembleDebug
habilita logging. A ponte Capacitor local chama console.dir(call) para cada
requisição e console.dir(result.data) para respostas, incluindo writeFile e
readChunk. Isso pode reter strings/objetos volumosos no console do WebView.
Ainda é hipótese do retentor físico; não equivale a prova de heap nem de 60s.

## Especificação e allowlist anteriores ao patch funcional

- capacitor.config.ts: somente loggingBehavior='none', SE a reprodução usando
  a ponte real demonstrar retenção de payloads com logging e sua ausência sem
  logging. Preservar HTTPS, CapacitorHttp, mixed content, appId e demais opções.
  Não editar node_modules, bridge gerada, player, identidade, boot ou storage.
- scripts/test-c11-native-bridge-retention.mjs: ponte real em VM isolada, console
  que conserva argumentos como controle explícito, fixtures sintéticas, GC e
  processos separados. Verificar roundtrip de leitura/gravação/erro, payload
  Unicode integral, callbacks concluídos e diagnóstico de aplicação preservado.
  O teste prova mecanismo, não reproduz automaticamente o buffer do WebView.
- Este contrato, referência de sucessão no lock, evidência
  docs/evidence/C11_FIRE_STICK_BRIDGE_RETENTION_FIX.md, STATUS,
  EVOLUTION_REPORT e ERRORS_AND_BLOCKERS. Outputs usuais build/sync/Gradle/APK.
- Backup recuperável do APK 045030... em
  Xandeflix-v1.0.0-standalone-before-bridge-retention-fix.apk antes da substituição.

Configuração 'none' desativa logs internos/bridge do Capacitor, não as chamadas
dos plugins nem os avisos sanitizados do player. Logs JS curtos e milestones
continuam no WebView; logs de crash Android continuam disponíveis. Não usar
logs como transporte de fonte/PIN/token nem remover tratamento real de erros.

## Teste físico autorizado preservando a nova ativação

Somente Fire Stick adb -s 192.168.3.104:5555, model AFTSSS/API 28. Permitir
abertura normal para observar flags/heap do baseline; não coletar heap dump
real, console bruto, fonte, PIN, identidade ou token. CDP read-only por único
forward temporário loopback do PID confirmado, removido ao finalizar. CLI
agent-browser ausente: fallback CDP sem novas dependências. Retornar somente
booleans, contagens, flags não sensíveis, memória numérica e milestones.

Após testes/build: atualizar in-place com adb install -r, mesmo package
com.xandeflix.prebuilt e assinatura. Sem uninstall, pm clear, reset, rotação,
restauração/seed, remoção de staging ou alteração de políticas/licença. Se
atualização incompatível, parar; não desinstalar como fallback. Nenhuma operação
no tablet, projeto/package protegido ou painel gestor. Nova ativação fica intacta.

Medir Runtime.getHeapUsage (não performance.memory, que foi quantizado/stale
no teste anterior), memória Android disponível e milestones reais. Não forçar
GC nem apagar console do dispositivo durante a medição de aceitação. Declarar
tempo de Activity, importação, promoção e Home distintos. Sem truncar catálogo
ou chamar shell de Home pronta. Meta <=60s permanece aberta até prova física.

## Aceitação

Controles negativos reproduzem retenção/logging inseguro; config não pode voltar
a debug/production silenciosamente. Plugins continuam retornando dados/erros.
Lock oficial antes/depois/build/APK, testes disponíveis de catálogo/player,
typecheck/build/sync/testes Java/assemble, package/assinatura e assets conferidos.
Hashes fora da allowlist preservados. Teste físico deve completar promoção/Home
e permanecer vivo, registrar tempo e memória sem segredos. Se OOM continuar,
ou tempo >60s, registrar FAIL/PENDING verdadeiro; não equiparar Node a Android.
Não ampliar arquitetura/autoridade ou significado de carregamento sem direção.

## Medição adicional de reabertura, após primeira promoção

Após catálogo e busca completos e estabilidade observada, permitir encerrar
somente o processo com.xandeflix.prebuilt (am force-stop) e abrir MainActivity
normal novamente, para distinguir abertura com cache da importação inicial.
Isso não limpa dados, staging, chave ou licença e não substitui o teste de
primeira carga. Comparar identidade/chave por igualdade local de arquivos sem
expor valores/digests. Remover somente o forward CDP criado nesta medição.
