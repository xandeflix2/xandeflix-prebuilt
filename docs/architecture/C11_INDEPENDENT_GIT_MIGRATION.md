# C11 — Migração local para Git independente — 2026-10-05

## Emenda vigente — publicação autorizada dos registros — 2026-10-05

Pedido explícito: "faça o commit e push para manter c11 alinhado com o repositorio".
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Esta emenda autoriza um commit documental
e push normal de `main` ao origin canônico; não autoriza force/amend, outras refs,
exclusão de pastas, backend/deploy, instalação/reset, rebuild ou alteração funcional.
As proibições de publicar registros no ciclo de migração abaixo e nos registros
anteriores da consolidação são históricas e superseded somente por este escopo.

Preflight: C11/main, Git-dir/common-dir próprios, worktree única, origin esperado,
HEAD e main remoto `fd2f561f55aa002534b4f724f5b557755d486a95`; seis documentos
modificados/dois novos, sete operacionais não rastreados, índice sem staging.
Contratos/AGENTS relidos; proveniência é a migração e a publicação anterior já
registradas. Nenhum apontamento ao repositório protegido ou hook ativo detectado;
GitHub confirma repo público/main, permissão de push e zero workflows Actions.

Allowlist literal do commit e das emendas deste ciclo:

- `AGENTS.md`
- `docs/ERRORS_AND_BLOCKERS.md`
- `docs/EVOLUTION_REPORT.md`
- `docs/STATUS.md`
- `docs/architecture/C11_GIT_CONSOLIDATION.md`
- `docs/evidence/C11_GIT_CONSOLIDATION.md`
- `docs/architecture/C11_INDEPENDENT_GIT_MIGRATION.md`
- `docs/evidence/C11_INDEPENDENT_GIT_MIGRATION.md`

Não usar staging amplo: backups/tmp/forensics/env/APKs/builds, os sete operacionais
e arquivos de aparelhos permanecem privados/locais. Helpers e manifests gerados
somente em `tmp/c11-independent-git-publication-20261005/`, fora do commit.
Revisar diff/segredos nos oito candidatos e blobs staged, exigir allowlist exata,
índice sem mudanças funcionais e hashes de runtime/APK/operacionais preservados.
Executar lock canônico como regressão local, sem backend real. Antes do push
reconferir remoto/ancestralidade; divergência exige STOP, nunca force-push.
Após commit e envio, verificar HEAD==origin/main==main remoto, árvore igual,
tracked limpo, somente sete operacionais locais e backups ignorados. Resultado
nominal do commit/push será confirmado na entrega; não antecipar sucesso.
Não reaplicar migrations/funções nem alterar integrações ou iniciar novo Gate.

## Autorização da migração — ciclo anterior

Pedido explícito: "Execute a migração automática, preservando todos os arquivos
locais." Migração administrativa local, não um novo Gate funcional.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO neste ciclo.
Não executar deploy, migração de banco, instalação/limpeza de aparelhos nem
alterar código funcional, testes, dependências, fontes, identidade ou ativação.
A autorização anterior de publicação já foi consumida pela entrega registrada;
não implica publicar os novos registros desta migração.

## Preflight e proveniência

- Workspace/toplevel: `C:\Xandeflix\xandeflix-prebuilt-c11-main`.
- Origin: `https://github.com/xandeflix2/xandeflix-prebuilt.git`; branch `main`.
- HEAD e origin/main: `fd2f561f55aa002534b4f724f5b557755d486a95`.
- Árvore: `4311479d4d7d37ce71dfccc844f661764ab34665`.
- Antes da migração, `.git` é arquivo apontador para a área privada da worktree
  em `C:\Xandeflix\xandeflix-prebuilt\.git\worktrees\xandeflix-prebuilt-c11-main`;
  o Git comum está na pasta histórica.
- Três documentos locais já modificados: ERRORS_AND_BLOCKERS e os dois registros
  C11_GIT_CONSOLIDATION. Sete arquivos operacionais não rastreados serão preservados.
- AGENTS, Architecture/Execution Contracts, Source Data Boundary e lock canônico
  de ativação lidos. Nenhum apontamento para o repositório protegido detectado.
- Inventário inicial: C11 8.669 arquivos/460.571.150 bytes; pasta histórica
  9.594 arquivos/2.752.414.654 bytes; zero reparse points em ambas. Espaço livre
  suficiente para cópia integral. As quantidades finais podem incluir esta spec.

## Allowlist estrita desta migração

1. Este documento, `docs/evidence/C11_INDEPENDENT_GIT_MIGRATION.md`, emenda mínima
   de identidade/armazenamento no AGENTS, registros STATUS/EVOLUTION_REPORT/ERRORS
   e notas de atualização nos dois C11_GIT_CONSOLIDATION, sem apagar histórico.
2. Artefatos privados gerados em
   `tmp/c11-independent-git-migration-20261005-a86bc73f/`: cópias integrais,
   manifests/hashes, clone temporário, helper local e apontador Git original.
3. Troca recuperável somente do `.git` da C11, de arquivo apontador para diretório
   próprio, depois de verificar backups e o clone remoto do mesmo HEAD.
4. Regressões locais, typecheck e web build; outputs ignorados gerados por esses
   comandos. APK existente e árvore Android não serão recompilados/sincronizados.

Todos os comandos começam na C11. Pasta histórica somente leitura para backup;
nenhuma operação Git, edição, rename ou exclusão nela. Projeto original Dropbox
permanece fora do escopo. Não excluir nenhuma das pastas existentes neste ciclo.

## Procedimento conservador

1. Capturar inventários completos privados, incluindo arquivos ocultos, ignorados,
   não rastreados e diretórios vazios. A única exclusão é o novo destino de backup,
   para evitar cópia recursiva dele próprio; nenhum tmp preexistente é excluído.
2. Copiar integralmente as duas árvores para destinos privados dentro da C11,
   sem mirror/purge/move e sem seguir links. Conferir quantidade, tamanhos e SHA256
   de cada arquivo copiado; reconferir as fontes para detectar alteração concorrente.
   Qualquer erro de leitura, link inesperado ou divergência exige STOP antes da troca.
3. Clonar via HTTPS o repositório canônico, sem checkout, shared/reference,
   alternates, shallow/partial clone ou templates de hooks personalizados. Validar
   origin, main, HEAD/árvore e integridade dos objetos. Remoto diferente exige STOP.
4. Inicializar somente o índice do clone com `git read-tree HEAD` (sem `-u`),
   conservar opções locais seguras de newline/Windows e exclusões locais. O backup
   completo mantém branches/reflogs/configuração/arquivos antigos para recuperação;
   não importar credenciais, hooks ou referência ao Git compartilhado.
5. Validar os caminhos absolutos e tipos dos alvos. Mover o `.git` apontador da C11
   para o backup e mover somente o `.git` novo para o lugar. Não mover/substituir
   os arquivos de trabalho, nem usar reset/checkout/clean. Em falha, recuperar o
   apontador original usando movimentos locais controlados, nunca exclusão ampla.
6. Conferir `.git` próprio, git-dir/common-dir locais, worktree única, ausência de
   alternates/commondir/core.worktree externo e mesmas refs/árvore. Comparar todos
   os arquivos locais anteriores, exceto a troca autorizada de metadata/documentos;
   exigir zero perdas. Verificar a pasta histórica completa sem alterá-la.
7. Atualizar identidade canônica para `ACTIVE_INDEPENDENT_C11_CLONE`. A pasta
   histórica torna-se evidência opcional, não dependência operacional da C11.
8. Executar lock de ativação antes/depois, typecheck e web build. Conferir APK e
   arquivos operacionais intactos. Não iniciar novo Gate nem instalar novo APK.

## Critérios de aceitação e retenção

- Backups completos e verificados; originais/arquivos locais não perdidos.
- Mesma branch main, HEAD, árvore e remoto já publicados, sem commit/push/PR novo.
- C11 opera com `.git` próprio e não precisa do Git da pasta histórica.
- Nenhuma mudança funcional ou de backend, APK e dados de aparelhos preservados.
- Lock/typecheck/build aprovados; erros/limites registrados sem relaxar testes.
- Backup privado e pasta histórica retidos. Sua exclusão requer confirmação futura;
  não publicar os backups, env, credenciais, capturas ou manifests privados no Git.

Referências de implementação: [git clone](https://git-scm.com/docs/git-clone),
[git read-tree](https://git-scm.com/docs/git-read-tree) e
[worktrees](https://git-scm.com/docs/git-worktree). Clone sem checkout e read-tree
sem `-u` evitam substituir a árvore de trabalho existente.
