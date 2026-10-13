# C99 — Sincronização autorizada com GitHub — 2026-10-13

Usuário confirmou repositório e solicitou expressamente sincronização. Autoriza
commit e push do conjunto local consolidado em xandeflix2/xandeflix-prebuilt/main.
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; PR não necessário/autorizado.
Não autoriza deploy Supabase, instalação/APK ou dados externos. Não usar force.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; ciclo de publicação do trabalho existente.

## Preflight e proveniência

Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, Git próprio, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD inicial
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture/Execution e
Source Boundary lidos; git fetch confirmou HEAD=origin/main, ahead0/behind0.
Índice inicialmente vazio; mudanças acumuladas C11 pertencem aos contratos e
evidências locais dos ciclos anteriores, incluindo APK18/UI/Manager/C97/C98.

## Allowlist

Conjunto existente src/**, android/app/src/**, android/app/build.gradle,
android/app/capacitor.build.gradle, android/capacitor.settings.gradle,
scripts/test-c11-*.mjs, docs/**, supabase/functions/**, supabase/migrations/**,
supabase/tests/**, package.json/package-lock.json e vite.config.ts, enumerado no
manifesto privado com hashes antes do stage. Sem patch funcional adicional.
Novos registros: este contrato, docs/evidence/C11_GITHUB_SYNCHRONIZATION_20261013.md,
quatro docs de memória e tmp/c99-github-sync/**. .gitignore pode adicionar somente
exclusões de metadados locais IDE/tsbuildinfo e diagnósticos específicos privados.

Preservar localmente, não publicar: env/chaves, tmp/caches/backups/APKs, .settings,
tsconfig.tsbuildinfo, sync_sample.txt e helpers específicos desta máquina
deploy-wifi.ps1, monitor-firetv.ps1, scripts/audit-tablet-final.ps1,
scripts/monitor-sync.ps1, scripts/test-clean-activation-home.ps1 e
scripts/verify-c11-side-navigation-firestick.mjs. Não executar seus comandos físicos.
Não usar git add indiscriminado nem normalizar CRLF ou conteúdo fora do escopo.

## Critérios e sequência

1. Auditar arquivos publicáveis e referências, segredos/binários/arquivos privados;
   sinalizar ocorrência real sem imprimir valores e resolver antes de publicar.
2. Executar build web com prebuild/lock, regressões relevantes UI/gestor/ativação
   e testes JVM Android sem instalar ou reconstruir APK de entrega.
3. Verificar staged manifest/diff/check e preservar hashes dos APKs privados.
4. Commit do conjunto aprovado, push normal main, fetch/verificar igualdade de
   HEAD remoto/local. Se rejeição/divergência, reconciliar preservando alterações;
   nunca force/purge/reset. Registrar resultado factual e exceções locais.
5. Documentação de conclusão pode constituir commit separado após verificar o
   primeiro push, evitando declarar publicação antes de sua confirmação.

## Emenda de harness após falha

Teste manager-scoped-access ainda esperava10 abas; C90 autorizou Atualizações,
resultando11 para MASTER. Permitir somente atualizar esse harness: lista exata
de seções MASTER e ADMIN, exclusão explícita das seções MASTER para ADMIN, e
ports de filhos adicionados pelos ciclos posteriores. Manter testes reais de
sessão/perfil/RPC/ativação; não alterar autorização, runtime, SQL ou relaxar lock.

Segundo harness legado, manager-device-registration, verifica literal antigo
"Mesma fonte:". A tabela aprovada já usa resumo contado e secundários recolhidos.
Permitir atualizar somente a expectativa visual para resumo contado e acrescentar
assert de linha secundária oculta/toggle recolhido; manter testes reais de peers,
normalização, RPC, chave, ciphertext e rejeições comerciais sem alteração.

Harness signal-policy também usa nome de RPC anterior à política de1–4 telas
iniciais. Atualizar ports para rpc_signal_public_complete_with_screens e verificar
p_initial_screens=1 no caso padrão. Preservar bloqueio de duplicatas, rollback,
HMAC privado, validação de capability, ownership e cifragem/AAD sem alteração.

Harness source-first-tmdb-artwork apresenta loader TSX legado: não conhece os
ports de cache/visibilidade e o estado metadata atuais. Modernizar somente ports
de apresentação e páginas compartilhadas; SSR Artwork deve estar ocupado antes
da imagem carregar, conforme contrato C89. Preservar todos testes reais de URI,
importador, matching, limites, cache/timeout e metadados. Validar imagem pronta no
Hero com URI já elegível, além de guards placeholder SSR. Não modificar runtime.

Regressão de visibilidade é exercitada adicionalmente para o estado assíncrono
das imagens; permitir port neutro de NewContentProvider no teste de foco de
MediaCard (artwork-visible-recovery e startup-artwork). Não mudar nenhum assert
de transporte/cache/retry/observadores/reader ou de boot/foco/preparação.

Diff staged detectou somente quatro linhas finais vazias extras em dois relatórios,
c11_license_console.sql e c11_extra_screen_capacity.sql. Permitir remover apenas
o excesso EOF desses quatro arquivos, preservando conteúdo e CRLF existentes.
Não alterar SQL funcional nem executar migration. Auditoria ampliada de URLs
revisou duas fixtures negativas de testes (URI com credenciais rejeitada e máscara
de logging, esta última já versionada), excetuadas por arquivo/hash exatos.
