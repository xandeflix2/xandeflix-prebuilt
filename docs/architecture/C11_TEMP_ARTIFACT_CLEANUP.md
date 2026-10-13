# C98 — Limpeza seletiva de temporários — 2026-10-13

Usuário solicita sanitizar tmp e remover arquivos que não são mais necessários.
C97 servidor local concluído; este ciclo somente limpeza local, sem próximo Gate.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Workspace/main/origin/HEAD canônicos
confirmados no mesmo turno; contratos/AGENTS/Source Boundary lidos.

## Escopo autorizado

Inventariar tamanho/arquivos sem ler conteúdos sensíveis. Remover somente caches
e perfis de navegador efêmeros produzidos por testes locais, identificados pelo
nome e contexto, sem uso por processo ativo e sem arquivo versionado. Preservar
todos os APKs, scripts, JSONs/logs/evidências, baselines/provenance, estado do
control plane, snapshots, arquivos do tablet e dados de fonte fora desses caches.
Não apagar tmp inteira nem criar link para diretório externo. Demais candidatos
ambíguos ficam preservados. Não iniciar build, instalação, Git ou banco.

## Allowlist e execução

Este contrato, docs/evidence/C11_TEMP_ARTIFACT_CLEANUP.md, quatro docs de memória,
tmp/c98-temp-cleanup/** para inventário/manifesto/resultados. Deleção somente dos
diretórios de perfil/cache explicitamente listados no manifesto após inspeção.
Antes de cada remoção recursiva, resolver caminho absoluto, verificar descendente
real de tmp no workspace, recusar reparse points, recusar paths ativos/versionados
e nomes fora da lista de padrões. Operações de arquivo exclusivamente PowerShell
com Remove-Item -LiteralPath, sem cmd/strings construídas para remoção.

## Aceitação

Registrar bytes/quantidades antes/depois e removidos/falhas; hashes dos APKs e
arquivos fora da allowlist preservados. Servidor localhost continua respondendo.
Não alegar sanitização de segredos nem eliminação de todo temporário; limpeza
seletiva de artefatos comprovadamente descartáveis. Retenção dos relatórios e
pacotes permite rastrear testes históricos mesmo sem seus caches de navegador.
