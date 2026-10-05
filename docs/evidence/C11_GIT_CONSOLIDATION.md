# C11 — Checkpoint Git local e publicação retida — 2026-10-05

## Escopo e resultado verificável

Consolidação do código C11 no Git existente xandeflix2/xandeflix-prebuilt,
branch main; não há merge de árvores nem novo backend/banco. Commit local
autorizado no plano; push condicionado, NÃO executado por integração de deploy
desconhecida. Identificar o checkpoint local pelo assunto
`chore(c11): consolidate validated activation playback and responsive UI`.
Plano/allowlist: [C11_GIT_CONSOLIDATION](../architecture/C11_GIT_CONSOLIDATION.md).

Preflight anterior: HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba, main/origin
e99f830a24b5de6dd74b4397f1ed6f0995bc8483 (reconsultado, sem divergência);
dois commits locais anteriores,49 modificados/64 não rastreados, índice vazio.
Manifesto revisado106 arquivos preexistentes+plano/evidência=108 arquivos.
Sete utilitários/captura operacionais excluídos pelo plano, preservados localmente.
Não usar git add .; APKs/env/forensics/tmp/builds/credenciais não entram no índice.

## Validações novas, locais e sem backend real

- Lock antes:22 casos de ativação+27 promoção de catálogo=49 PASS e9 controles.
- Lock após whitespace e no prebuild: mesmos49+9 PASS; sem contornar guard.
- Typecheck: PASS. Git diff --check: PASS após retirada da linha vazia no EOF.
- Avisos de reprodução:11 PASS; sessões playback:10/10; contrato VOD:12/12.
- Política lateral:18 casos+hook real PASS. Orientação mobile: guarda+5 negativos;
  fundo fullscreen: guarda+5 negativos. São testes de política/call sites,
  não novas medições físicas de rotação ou opacidade em aparelhos.
- Retenção de bridge: PASS com controle de logging e4 negativos de configuração.
- Retenção/importação:100000 registros sintéticos,88 segmentos e integridade PASS;
  peak heap observado22,65MiB neste harness, sem certificar heap do Fire Stick.
- Importação bounded:250000 registros sintéticos e83 testes PASS. RSS observado
 89→282MiB em Node com armazenamento em memória, não medição Android ou SLA.
- npm run build: PASS;412 módulos, sem externalização de crypto. Persistem avisos
  de node:fs/node:path nos helpers de provisioning, imports mistos e chunk>500kB.

Testes isolados/mocks, nenhum load test remoto ou stress>100 dispositivos.
Não repetir instalação, desinstalação, cap sync ou Gradle para esta publicação.
Verificação anterior de navegador/aparelhos é histórica, não reexecutada neste ciclo.

## Integridade, provenance e segurança

Antes da edição,107 candidatos congelados por SHA-256. Após testes/build,
única diferença fora dos registros deste checkpoint foi storage: somente uma
linha vazia no fim. Reconstrução em memória do sufixo de newline reproduziu
exatamente o hash pré-edição, sem mudar código funcional.404 dos405 consolidados
byte-idênticos ao baseline entregue; único arquivo distinto é esse whitespace.
Nenhuma relaxação de teste, alteração funcional de ativação/player ou SQL.

APKs atual e último backup mantidos byte-idênticos. APK atual9062069bytes,
SHA256 EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F.
É o APK debug existente, não um novo release assinado nesta etapa.
Backup Git local completo de HEAD/origin/main gerado/verificado em
tmp/c11-git-before-consolidation-20261005.bundle;1372779bytes. Não é backup
de banco, de env/segredos ou das alterações dirty ainda não commitadas.

Varredura literal em502 fontes textuais/8880720bytes, incluindo cada um dos
dois commits inéditos: zero chaves privadas/tokens GitHub/sb_secret/service_role
JWT/Stripe live/AWS detectados. Não é certificação universal de segredos/histórico.
URLs/códigos sinalizados foram revisados como exemplos/fixtures/formato em
testes/docs/sanitizador; nenhum valor privado foi impresso pela varredura.
As duas capturas de ativação são sintéticas e não cadastradas, conforme sua
evidência de origem, inspecionadas visualmente. Recursos PNG/JAR já rastreados
não foram submetidos ao scanner textual. Não incluir captura real nem log operacional.

## Bloqueio do push e limites da beta

Usuário não sabe se há deploy automático. GitHub CLI reportou zero workflows,
runs,deployments,environments,check-runs e statuses do HEAD remoto. Webhooks
HTTP404: acesso indisponível, não evidência de lista vazia. Supabase sem branches
de desenvolvimento não prova que a integração GitHub esteja desligada.
Nenhuma configuração de Apps/integrations/hooks/deploy foi alterada.

Skill Supabase orientou separar checkpoint de código de mudança de ambiente.
Projeto esperado cujbmyhitgomlgwfkaat confirmado ACTIVE_HEALTHY;46 migrações
registradas no remoto versus44 arquivos locais, com timestamps históricos
divergentes. Não executar db push, migration repair/apply ou function deploy.
Antes de publicar main, inspecionar Project Settings>Integrations>GitHub no
Supabase e integrações/Apps/webhooks do repo com permissão administrativa.
Opção Deploy to production habilitada pode aplicar migrações/funções no push:
[documentação oficial](https://supabase.com/docs/guides/deployment/branching/github-integration).

Meta Fire Stick<=60s continua aberta; stress>100 simultâneos não executado.
CI remoto, release/chave de assinatura e revisão formal de TARGETs históricos
ficam para autorização posterior, não afirmar MVP/beta completamente homologado.
Git comum está em C:\Xandeflix\xandeflix-prebuilt\.git: não apagar pasta antiga
ou .git apontador da C11. Push não elimina essa dependência física da worktree.
Original Dropbox/com.xandeflix.app permanece protegido. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; sem backend write, aparelhos/reset, exclusão, PR ou force-push.
