# C11 — Migração administrativa local para Git independente — 2026-10-05

## Publicação documental autorizada — 2026-10-05

Usuário solicitou expressamente commit e push dos registros para alinhar a C11.
Emenda/allowlist de oito arquivos antes de staging no plano. Autorização somente
commit documental e push normal main/origin; PR/force/deploy/reset não autorizados.
Git independente/main/origin corretos, parent e remoto fd2f561, índice sem staging;
GitHub confirma permissão push e zero workflows. Backup/arquivos locais retidos.
Seções abaixo descrevem o ciclo anterior da migração; seus termos "somente local"
não impedem esta publicação agora aprovada. Nenhuma autorização permanente de Git.
Revisão dos oito candidatos:264.300bytes, zero segredos de alta confiança
detectados (não auditoria universal). Lock49+9 repetido PASS;548 arquivos fora
da allowlist conferidos por hash, zero mudanças, incluindo APK/dist e os sete
operacionais. Diff --check PASS; avisos LF→CRLF preservados, sem reformatar.
Fetch reconfirmou parent/remoto iguais e ancestry de fast-forward. Sem rebuild,
escrita no backend real ou instalação. Staged ainda exige manifesto literal e
nova varredura dos blobs antes do commit. Resultado real do envio será confirmado
pelas refs/árvore/status após execução, não presumido neste registro prévio.

## Escopo e autorização

Pedido: "Execute a migração automática, preservando todos os arquivos locais."
[Spec prévia](../architecture/C11_INDEPENDENT_GIT_MIGRATION.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem novo commit/push/PR/deploy,
instalação/reset ou alteração funcional/backend. Todos os comandos na C11.
Pasta histórica somente leitura; original Dropbox fora do escopo.

## Backup completo antes da troca

Backup privado retido em
`tmp/c11-independent-git-migration-20261005-a86bc73f/` (ignorado pelo Git).
Inclui env/arquivos ignorados, APKs, arquivos operacionais não rastreados,
diretórios vazios e o Git histórico completo, com branches/reflogs/configuração.
Não expor/publicar seu conteúdo nem manifests privados.

- `active-backup`: 8.670 arquivos, 2.242 diretórios, 460.577.069 bytes. Inclui
  os 8.669 arquivos locais anteriores e a nova spec prévia; somente o novo
  destino de backup foi excluído para evitar recursão, nenhum tmp antigo excluído.
- `historical-backup`: 9.594 arquivos, 2.778 diretórios, 2.752.414.654 bytes.
- Robocopy `/E /COPY:DAT /DCOPY:DAT`, sem mirror/purge/move, exit1 em ambas
  (cópia com sucesso). Inventários completos sem reparse points.
- Verificação de todos os tamanhos/SHA256 e diretórios: zero ausências,
  divergências ou extras nas duas cópias. Fontes reconferidas antes da troca:
  zero alterações concorrentes detectadas em ambas as árvores.

## Troca recuperável, sem substituir arquivos de trabalho

Clone HTTPS completo do origin canônico, `--no-checkout`, template vazio,
sem shared/reference/alternates/shallow/partial clone. `git fsck --full --strict
--no-reflogs` PASS. Índice inicializado com `git read-tree HEAD`, sem `-u`;
índice igual ao HEAD. Opções seguras de Windows/newline e exclusões locais
preservadas, sem importar credenciais/hooks ou configurações externas de worktree.

Somente o `.git` apontador antigo foi movido para `original-c11.git-pointer`
no backup; o diretório Git próprio do clone foi anexado à C11. Caminhos absolutos,
tipos e ausência de reparse validados antes dos movimentos. Nenhum checkout,
reset/clean, rename de workspace, exclusão ou edição na pasta histórica.
Backup inclui também o apontador anterior na cópia integral ativa.

Resultado confirmado:

- `.git` é diretório em `C:\Xandeflix\xandeflix-prebuilt-c11-main\.git`.
- Git-dir e Git-common-dir apontam para esse mesmo diretório local.
- Worktree única: C11, branch `main`.
- HEAD/origin/main: `fd2f561f55aa002534b4f724f5b557755d486a95`.
- Árvore: `4311479d4d7d37ce71dfccc844f661764ab34665`.
- Origin fetch/push: `https://github.com/xandeflix2/xandeflix-prebuilt.git`.
- Nenhum alternates, commondir, worktrees externos ou core.worktree externo;
  backup privado continua ignorado no novo Git.
- Primeira conferência após troca: 8.669 arquivos de trabalho idênticos,
  excluindo somente o apontador Git substituído; zero perdas/mudanças não previstas.
  Documentos administrativos serão as únicas mudanças posteriores autorizadas.

## Validações finais

Lock antes da troca e depois da atualização de AGENTS:49 verificações e9 controles
negativos PASS em ambas as execuções, a última também via prebuild obrigatório.
Mocks isolados, sem chamadas/escritas no backend real. Typecheck PASS; testes
de chave permanente16, fonte exclusiva31 e diagnóstico de reprodução11 PASS.
Contagem16 é a suite padrão sem flags opcionais de comparação com HEAD; critérios
não relaxados. Web build414 módulos PASS/8,18s, não evidência de SLA de aparelho.

Build direcionado exclusivamente a `verification-dist` dentro do backup privado,
sem limpar/substituir `dist`: seus cinco arquivos/1.226.878bytes conferem por hash
com o dist local anterior. APK/Android não recompilados; nenhum teste/instalação
física neste ciclo. APK8785127bytes/SHA256
F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8 intacto.
Nenhum aviso de crypto externalized; avisos antigos de provisioning node:fs/
node:path, mixed imports e chunk grande continuam. Diff --check PASS.
Avisos LF→CRLF nos docs seguem a configuração Windows preservada, sem rewrite.
Checagem auxiliar da allowlist interrompida por stderr/NativeCommandError do
PowerShell, não por exitcode Git; reexecução sem redirecionamento PASS/exit0,
allowlists exatas de seis docs modificados/dois novos/sete operacionais,
backup ignorado e índice sem staging. Nenhuma alteração de configuração Git.
Teste legado manager-form14/15 conhecido e fora do escopo não reexecutado;
não declarar todas as suites históricas aprovadas. Consultas auxiliares com nomes
inexistentes registradas/corrigidas no ERRORS_AND_BLOCKERS, sem mudanças funcionais.

Conferência completa após os registros administrativos: PASS, zero perdas.
8.663 arquivos byte-idênticos e seis documentos com mudanças autorizadas; somente
este relatório adicional, além da spec capturada no baseline. Apontador Git
original retido no backup e substituído por diretório próprio. Sete operacionais,
ignorados, env, APK, node_modules, dist e árvore Android preservados. Pasta
histórica:9.594 arquivos/2.778 diretórios idênticos, nenhuma alteração detectada.
Integridade final `git fsck --full --strict --no-reflogs` e diff --check PASS;
índice sem staging, main/origin/main ahead/behind0/0. `git ls-remote` reconferido
após os testes: mesmo HEAD publicado, nenhuma mudança remota. Migração concluída.

## Retenção e limites

Os três documentos dirty e sete arquivos operacionais anteriores permanecem
locais; registros novos desta migração também não serão commitados/publicados.
AGENTS agora identifica `ACTIVE_INDEPENDENT_C11_CLONE`; a pasta histórica é
evidência opcional, não requisito de execução. Ainda não excluída: aguarda
confirmação futura. Branches/reflogs exclusivamente locais antigos permanecem
no backup completo, não são importados automaticamente para o clone canônico.
Migração não certifica beta>100 dispositivos, Fire<=60s ou resolução do HTTP403.
