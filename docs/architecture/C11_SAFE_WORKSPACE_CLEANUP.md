# C11 — Limpeza segura e limitada do workspace — 2026-10-05

## Resultado atual das capturas — limpeza manual concluída e auditada

Após o bloqueio automático, usuário pediu guia passo a passo e confirmou a
remoção manual. Guia restrito às três imagens raiz e13 scratch da allowlist,
via Delete normal no Explorador, sem apagar pastas/scripts ou esvaziar Lixeira.
Agente não executou nova exclusão nem contornou o bloqueio do terminal.

Auditoria independente confirma16/16 alvos ausentes e todos os preservados
byte-idênticos:7991 arquivos/1726 diretórios/395523343bytes/902 PNGs/92 relatórios
JSON/dois APKs raiz. Fingerprint pré/pós igual:
37DFFEFF1AECD311C6712DC2EC07086BD6CD825E58F66DFE672D67ED0EB8FF19.
405/405 arquivos consolidados iguais; scratch e seus dois scripts preservados;
154 PNGs forensics/718 tmp/26 recursos Android e APK atual/último backup intactos.
21732500bytes é o tamanho anterior das16 capturas retiradas do workspace, não
medição de espaço livre. Lixeira não inspecionada; recuperação depende de terem
sido enviados à Lixeira e permanecerem nela, conforme a orientação fornecida.
Sem código/build/testes novos/instalação/Git/backend/ativação/player/novo Gate.
Somente os cinco documentos previstos atualizados; nenhuma pendência de limpeza
destes16 alvos. Bloqueio automático abaixo é histórico, não foi removido.

## Emenda prévia — remoção autorizada de16 capturas avulsas

Usuário pediu excluir as imagens avulsas identificadas na auditoria anterior.
Ciclo local exclusivamente no C11, CURRENT_GATE=NONE, sem novo Gate/Git/backend/
dispositivo/build/ativação/player. Auditoria não encontrou referências aos nomes
no código/scripts/docs/config pesquisados. Capturas históricas não usadas pelo
app; removê-las perde esses registros específicos, não recursos do aplicativo.

Allowlist exata de arquivos, sem glob nem exclusão de diretórios:

- tablet_home_ready.png
- tablet_screen.png
- tablet_sync_validated.png
- scratch/activation_clean.png
- scratch/check_display.png
- scratch/clean_code.png
- scratch/phone_activation.png
- scratch/phone_activation_screen.png
- scratch/phone_fresh_activation.png
- scratch/phone_key_screen.png
- scratch/screen_dpad_test3.png
- scratch/screen_dpad_test4.png
- scratch/tablet_activated.png
- scratch/tablet_code.png
- scratch/tablet_screen.png
- scratch/tablet_screen_resync.png

16 arquivos/21732500bytes previstos, nomes/contagens conferidos antes da execução.
Preservar scratch/find_match.cjs e scratch/patch_css.cjs, pasta scratch, todas
imagens em forensics/tmp e recursos Android, código/config/tests/docs/APKs.
Preservação dos APKs refere-se ao estado presente antes deste ciclo: a consulta
anterior autorizou o usuário excluir16 backups históricos, sem execução pelo
agente ou presunção de que o usuário tenha concluído essa exclusão.

Antes de remover: validar cada LiteralPath resolvido e ancestrais dentro do C11,
recusar links/reparse points/arquivos inesperados e imagens referenciadas;
capturar em RAM inventário/hash agregado de todos os outros arquivos presentes.
Uma tentativa normal de exclusão não-recursiva via PowerShell nativo somente
destes novos alvos; não repetir/contornar se a ferramenta bloquear. Nenhuma
tentativa de executar a antiga limpeza recursiva bloqueada de caches.
Documentos permitidos somente este plano/evidência correspondente/STATUS/
EVOLUTION_REPORT/ERRORS_AND_BLOCKERS. Nenhum helper funcional ou script novo.

Aceitação:16 alvos ausentes, inventário/hash de todos preservados idêntico,
scratch com dois scripts intactos, imagens de teste/recursos/APK atual intactos;
sem build para regenerar saídas limpas. PNGs não regeneráveis como registros
históricos exatos; exclusão direta sem Lixeira não tem recuperação garantida.
Se bloqueado, registrar16 presentes e não alegar exclusão/liberação de espaço.

Resultado histórico da tentativa automática: tentativa não-recursiva exclusivamente dos
16 arquivos foi bloqueada pelo terminal antes de iniciar (blocked by policy).
Nenhum PNG removido;16/16 e21732500bytes ainda presentes, dois scripts scratch
e APK atual intactos. Sem repetir por outro método/helper/codificação. Pendência
da exclusão das capturas separada da limpeza anterior de caches já concluída.

## Sucessão: execução manual solicitada pelo usuário e conferida

Após bloqueio da primeira exclusão automatizada, usuário pediu orientação
passo a passo para executar a manutenção manualmente. Mesma allowlist; nenhuma
exclusão automatizada adicional pelo agente nem nova autoridade funcional.
Usuário confirmou diretório/True,97 perfis/zero processos,False no primeiro
perfil,96 perfis restantes removidos,96 caches Vite removidos,cinco pastas
nativas removidas eFalse na cópia APK após igualdade com backup. Scripts locais
limitavam caminhos, verificavam links/ancestrais/processos antes das etapas
em lote e usavam LiteralPath. Não remover outros arquivos ou esvaziar Lixeira.

Conferência independente do agente:199/199 alvos ausentes;405/405 consolidados
idênticos e inventário/hash agregado de8023 arquivos preservados idêntico ao
pré-limpeza, incluindo918 PNGs/92 relatórios JSON/18 APKs raiz. Lock49 casos+9
negativos e tsc --noEmit PASS após limpeza, sem rebuild/sync/instalação/caches
recriados. Limpeza concluída; bloqueio automático anterior permanece histórico,
não representa pendência desta manutenção concluída manualmente.

## Autorização e especificação prévia

Usuário autorizou executar, passo a passo, a limpeza segura identificada na
auditoria somente leitura anterior. CURRENT_GATE=NONE; manutenção local,
sem novo Gate, refactor, alteração funcional, Git, backend ou dispositivo.
Workspace exclusivo C:\Xandeflix\xandeflix-prebuilt-c11-main, origin
xandeflix2/xandeflix-prebuilt, main/ahead2, HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. Contratos/AGENTS/lock relidos.
Dirty conhecido49 entradas modificadas e48 não rastreadas deve ser preservado.

## Allowlist estrita de remoção

1. Somente diretórios profile (97) imediatamente sob
   tmp/c11-side-navigation/run-<dígitos>/, nunca a pasta run ou seu conteúdo
   restante. Perfis headless sintéticos e descartáveis dos testes.
2. Somente diretórios vite-cache (96) imediatamente sob esses mesmos runs.
3. Diretórios regeneráveis exatos: android/app/build/intermediates,
   android/app/build/tmp, android/app/build/generated, android/build,
   android/capacitor-cordova-android-plugins/build.
4. Arquivo exato tmp/c11-phone-update-fa8a6d37779d438dbb24145cc8a088fc/
   installed-before.apk, somente depois de confirmar SHA256 igual ao backup
   raiz Xandeflix-v1.0.0-standalone-before-playback-error-fix.apk e ao valor
   8828F12016892A29E3B15D0009315E3A404D4C2495F6FB8A2105DE5D15FD4B8C.

Allowlist documental: este plano, evidência C11_SAFE_WORKSPACE_CLEANUP.md,
STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS com registro desta manutenção.
Nenhum script ou código funcional novo; operações terminais PowerShell nativas.

## Proteções e sequência

Antes de remover: comparar baseline de405 arquivos consolidados, executar lock
oficial, conferir nenhum browser/build referenciando C11, resolver cada caminho
absoluto, exigir allowlist/contenção no workspace e recusar reparse points nos
ancestrais ou descendentes. Usar Remove-Item com LiteralPath, sem outros shells,
sem glob de exclusão, sem caminho amplo, sem seguir links ou parar processos.
Capturar em RAM inventário/hash agregado de todos os arquivos preservados,
inclusive relatórios/capturas/histórico/configuração, sem publicar hashes ou
conteúdos privados. Documentos desta manutenção são as únicas exceções previstas.

Executar etapas separadas: profiles -> vite-cache -> intermediários nativos ->
cópia APK duplicada. Conferir ausência de cada alvo e registrar bytes/contagens.
Falha de lock/integridade/caminho/processo exige parar, não ampliar allowlist.
Nenhuma exclusão de node_modules, dist, android/.gradle, assets/configuração
Capacitor, plugin Cordova inteiro, outputs/APK, reports/test-results, fonte,
fixtures, schemas, docs, supabase, .git, env/local.properties, APKs/backups da
raiz, forensics/scratch, tmp raiz, manifests/índice ou relatórios/capturas dos runs.

Caches/intermediários serão excluídos diretamente, não enviados à Lixeira;
regeneráveis nos próximos testes/builds. APK duplicado recuperável por cópia
do backup raiz preservado. Não alegar recuperar bytes exatos de caches antigos.

## Aceitação

Todos os alvos validados ausentes e somente eles removidos; inventário/hash dos
preservados idêntico,405/405 consolidados e todos18 APKs raiz idênticos; relatórios/
capturas/49+48 alterações existentes mantidos. Lock49 casos+9 negativos antes e
depois e typecheck PASS. Nenhum rebuild, sync, APK novo ou instalação para não
recriar as saídas limpas. Medida de arquivos removidos não é aumento garantido
idêntico de espaço livre do volume. Documentar resultado/pendências fielmente.

## Resultado da primeira tentativa

Controle do terminal rejeitou a primeira exclusão antes de iniciar o processo
(blocked by policy). Zero arquivos/bytes removidos; execução interrompida, sem
contorno nem etapas posteriores. Todos os alvos continuam presentes, APK atual
e backups intactos. Limpeza pendente de liberação legítima da execução.
Registro em docs/evidence/C11_SAFE_WORKSPACE_CLEANUP.md.
