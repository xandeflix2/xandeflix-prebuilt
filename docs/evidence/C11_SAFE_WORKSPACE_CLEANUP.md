# C11 — Limpeza segura manual concluída e verificada — 2026-10-05

## Resultado atual das16 capturas — execução manual e auditoria PASS

IMAGE_CLEANUP_COMPLETED=SIM;IMAGES_ABSENT=16;IMAGES_DELETED_BY_AGENT=0.
Usuário solicitou guia após rejeição do terminal e respondeu "feito" após as
etapas do Explorador: três PNGs raiz e13 scratch, Delete normal sem Shift,
preservando pasta/scripts e sem esvaziar Lixeira. Agente não repetiu exclusão.

Preflight read-only confirmado no C11: origin xandeflix2/xandeflix-prebuilt,
main/ahead2, HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba, dirty conhecido
49 modificados/49 entradas não rastreadas. AGENTS/contratos/plano relidos.
CURRENT_GATE=NONE; allowlist documental de cinco arquivos; Git não autorizado.

Verificação independente, não apenas relato:16/16 alvos ausentes; scratch e
find_match.cjs/patch_css.cjs presentes.405/405 arquivos consolidados idênticos,
zero alterados/ausentes. Inventário completo dos preservados idêntico ao
pré-ciclo:7991 arquivos/1726 diretórios/395523343bytes/902 PNGs/92 relatórios JSON/
dois APKs raiz; agregado SHA256 pré/pós:
37DFFEFF1AECD311C6712DC2EC07086BD6CD825E58F66DFE672D67ED0EB8FF19.
Comparação exclui apenas16 alvos e cinco documentos previstos; não publica
conteúdos ou hashes individuais privados.154 PNGs forensics/718 tmp/26 recursos
Android preservados; fonte/configuração/dependências/dist/evidências/Git intactos.

APKs raiz preservados byte-idênticos:

- Xandeflix-v1.0.0-standalone.apk:9062069bytes/SHA256
  EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F.
- Xandeflix-v1.0.0-standalone-before-phone-detail-header.apk:9062043bytes/SHA256
  0665565390BB35769ED5DF5AAA978E77745D7075328753854501EED1DCD4A964.

Capturas retiradas somavam21732500bytes (~21,7MB decimal) no inventário anterior.
Não é medição de espaço livre no volume: arquivos enviados à Lixeira ainda
ocupam espaço. Lixeira não inspecionada; recuperação condicionada a estarem
nela. Nenhuma instrução para esvaziar toda a Lixeira ou excluir outros alvos.
Sem alteração funcional/build/cap sync/Gradle/testes novos/instalação/dispositivos/
backend/ativação/player/novo Gate/commit/push/PR. Não certificar reprodução física.
Somente documentação prevista atualizada. Limpeza destes16 alvos concluída;
rejeição automática permanece histórica, não foi repetida nem contornada.

## Histórico do pedido de capturas — exclusão automática bloqueada antes do início

IMAGE_CLEANUP_COMPLETED=NAO;IMAGES_REMOVED=0;IMAGE_BYTES_REMOVED=0.
Usuário autorizou excluir somente três PNGs raiz e13 PNGs scratch identificados
na consulta anterior, após informação de perda dos registros históricos.
Allowlist literal no plano antes da tentativa, total16/21732500bytes validado,
ancestrais/links/arquivos/caminhos conferidos.405/405 arquivos consolidados
pré-ciclo iguais ao último estado validado; nenhum código ou build alterado.

Contexto APK: a consulta anterior permitiu ao usuário excluir16 backups antigos
preservando atual e último anterior. Neste preflight aparecem somente dois APKs
na raiz; agente não excluiu APKs e não exigiu baseline histórico de18. APK atual
EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F intacto.
Baseline novo dos arquivos preservados deste ciclo em RAM:7991 arquivos/
1726 diretórios/395523343bytes/902 PNGs/92 relatórios JSON/dois APKs raiz,
fingerprint agregado37DFFEFF1AECD311C6712DC2EC07086BD6CD825E58F66DFE672D67ED0EB8FF19.
Exclui somente allowlist dos16 PNGs e documentos previstos da manutenção.
Sem publicar/persistir conteúdo ou digest individual privado das capturas.

Uma tentativa normal nova via PowerShell/Remove-Item/LiteralPath dos16 arquivos,
sem Recurse e sem remover diretórios, foi rejeitada por exec_command/CreateProcess
antes de iniciar: blocked by policy. Não repetir por outro método, shell,
codificação ou helper. Verificação posterior read-only confirma16/16 presentes,
21732500bytes, scripts find_match.cjs/patch_css.cjs e APK atual preservados.
Nenhuma exclusão parcial, nenhuma imagem histórica perdida, nenhum espaço
liberado nesta tentativa. Não confundir com limpeza manual anterior concluída.

Somente plano/evidência/STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS atualizados.
CURRENT_GATE=NONE; sem build/lock novo/instalação/Git/backend/ativação/player/
novo Gate. Exclusão automática das capturas pendente do controle de execução.

## Resultado atual: etapas manuais confirmadas e auditoria independente PASS

CLEANUP_COMPLETED=SIM;199/199 alvos da allowlist ausentes.
Após o bloqueio da primeira exclusão automatizada, usuário solicitou guia para
executar a manutenção manualmente no PowerShell. Respostas sequenciais: caminho
C11/True;97 perfis/zero processos;False para primeiro perfil;96 perfis removidos;
96 caches Vite removidos;cinco pastas de compilação removidas;False para cópia APK.
Nenhuma nova exclusão executada pelos tools do agente. Mesma allowlist documentada
antes da primeira tentativa, sem código funcional novo, Git ou dispositivos.

Alvos removidos confirmados read-only, não somente presumidos pelos relatos:

| Grupo | Alvos ausentes | Bytes no inventário anterior |
| --- | ---: | ---: |
| Perfis dos testes | 97 | 2419151180 |
| Caches Vite | 96 | 627074592 |
| Intermediários Android permitidos | 5 | 56083838 |
| Cópia temporária APK duplicada | 1 arquivo | 9261140 |

Total3111570750bytes (~3,1GB decimal),40606 arquivos segundo inventário anterior.
É o tamanho auditado dos alvos retirados, não medição exata de espaço livre no
volume. Pastas pais/run mantidas, inclusive pasta agora vazia da cópia APK.

Auditoria independente depois das exclusões:405/405 arquivos consolidados
idênticos ao pré-limpeza. Inventário completo dos preservados também idêntico:
8023 arquivos/1726 diretórios/560929793bytes,918 PNGs,92 relatórios JSON dos
testes,18 APKs raiz. Fingerprint agregado pré/pós exatamente igual:
759296805A044B397C153A1BCAD324173CFFA2AB28FA55CFC6E7994412A56640.
Documentos desta manutenção são as únicas exceções previstas; nenhum conteúdo
ou digest individual privado publicado/persistido. Fonte/tests/native/config,
dependências/dist/assets/reports/test-results/forensics/scratch/manifests/índice/
env/Git e backups protegidos por essa comparação, não apenas por contagem.

APK raiz permanece9062069bytes/SHA256
EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F;
backup da cópia removida preservado/SHA256
8828F12016892A29E3B15D0009315E3A404D4C2495F6FB8A2105DE5D15FD4B8C.
Cópia duplicada recuperável por cópia desse backup. Caches/intermediários excluídos
diretamente, sem Lixeira; regeneráveis pelos respectivos testes/builds, sem
prometer recuperação dos bytes exatos das antigas pastas descartáveis.

Validação posterior: npm run c11:new-device:lock PASS,49 casos+9 negativos,
marcador C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1=PASS; npm run typecheck /
tsc --noEmit PASS. Sem build/cap sync/Gradle/nova instalação ou reprodução física
para não recriar saídas limpas e não ampliar escopo. Ativação/player não tiveram
patch; testes não certificam mídia física. Git ainda dirty49 modificados/49
entradas não rastreadas (48 anteriores+plano novo; evidência fica na pasta já
não rastreada). Não apagamos alterações não publicadas ou fizemos commit/push/PR.
CURRENT_GATE=NONE; sem backend/Settings/reset/novo Gate/alteração de60s.
Nenhuma pendência de limpeza da allowlist.

## Resultado da primeira tentativa automatizada — histórico

FILES_REMOVED=0; BYTES_REMOVED=0; CLEANUP_COMPLETED=NAO.
Usuário autorizou executar a limpeza segura passo a passo. Plano anterior à
execução em docs/architecture/C11_SAFE_WORKSPACE_CLEANUP.md. CURRENT_GATE=NONE;
somente C:\Xandeflix\xandeflix-prebuilt-c11-main, sem Git/backend/dispositivo.

Preflight workspace/top-level/origin/main/ahead2/HEADf0fdb6840c21e7a660f1662f2bbac9f2cd241cba
conferido; AGENTS/contratos/lock relidos. Dirty49 modificados/48 não rastreados
preexistentes preservados, não exigir árvore limpa.193 candidatos cache validados
por nome/posição:97 profile e96 vite-cache, somente sob run-<dígitos>. Nenhum
browser/build referenciando C11 encontrado antes da etapa. Lock49 casos+9
negativos PASS antes de qualquer remoção. Baseline405/405 consolidados idêntica.

Captura em RAM de todos os arquivos fora da allowlist de remoção/documentos
desta manutenção:8023 arquivos/1726 diretórios/560929793bytes, incluindo918 PNGs,
92 relatórios JSON dos testes e18 APKs raiz. Fingerprint agregado SHA256
759296805A044B397C153A1BCAD324173CFFA2AB28FA55CFC6E7994412A56640.
Nenhum conteúdo ou digest individual privado foi publicado/persistido.

## Bloqueio da primeira etapa

Primeira invocação de exclusão pelo terminal foi rejeitada pelo controle de
execução: exec_command / CreateProcess / "rejected: blocked by policy".
Comando não iniciou. Não houve validação/destruição parcial no shell, não
tentar repetir por outro shell, codificação, helper ou método equivalente.
Não alegar limpeza concluída nem liberação dos3,1GB estimados na auditoria.

Verificação read-only após rejeição:193/193 diretórios profile/vite-cache e
cinco/cinco alvos nativos continuam presentes, APK temporário continua presente
e idêntico ao backup raiz8828F120...15FD4B8C. Mesmo APK atualEEBEED35...ADAB338F
e18 APKs raiz preservados. Nenhuma etapa posterior executada.
Alterações somente documentais: plano/evidência/STATUS/EVOLUTION_REPORT/
ERRORS_AND_BLOCKERS.

## Pendência da execução automática — histórico, manutenção concluída manualmente

Execução automática precisa de alteração legítima do controle de execução
para permitir a manutenção autorizada; autorização do usuário não remove o
bloqueio técnico. Interromper limpeza e pedir direção. Fonte, config, testes,
relatórios/capturas, node_modules/dist/native/assets, forensics/scratch e APKs
não foram removidos. Sem build/typecheck/lock posterior pois não houve exclusão.
