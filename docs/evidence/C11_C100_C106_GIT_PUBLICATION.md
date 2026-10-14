# C100–C106 — commit e push verificados — 2026-10-14

## Autorização e conteúdo publicado

Pedido explícito do usuário: commit e push das otimizações consolidadas.
Preflight/allowlist prévios em
[contrato de publicação](../architecture/C11_C100_C106_GIT_PUBLICATION.md).
Clone ativo independente/main/origin esperado; remoto inicial igual ao HEAD
d039f8837dfcfd44374560a9e6642cb93e59c2cf, index vazio antes do staging.

Commit de código/testes/docs:
[66b6c90445456cf15ad7fd7ab79ea2a6acbec4c8](https://github.com/xandeflix2/xandeflix-prebuilt/commit/66b6c90445456cf15ad7fd7ab79ea2a6acbec4c8).
66 arquivos,5472 inserções/293 remoções. Inclui gesto VOD C100, registros de
instalação/armazenamento/limpeza C101–C103 e comparação REA, transporte bounded
progressivo C104, inventário completo local/busca/detalhes sob demanda/prioridade
de arte/rolagem Live C105 e refinamentos de hero/Fire/saída Live C106.

Staging nominal conferido com manifesto: exatamente66 arquivos conhecidos,
hash raw de cada candidato e igualdade do conteúdo indexado após normalização
CRLF/LF. Auditoria local sanitizada de padrões de tokens/chaves, literais de
segredos do ambiente e URLs sensíveis sem achados.49 patches anteriores
protegidos conferidos e APK C106 entregue preservado. .env/assinatura/credenciais,
APKs próprios/de referência, builds, tmp, caches e payloads reais não enviados.
DECISIONS inclui apenas a emenda C100 já adjudicada, sem nova reescrita.

## Validação e confirmação remota

Neste ciclo Git: lock26 testes de ativação+27 de promoção+9 controles negativos
PASS; hero8/8 e barreira Live8/8 com callbacks reais/ports sintéticos PASS.
Código/testes/Android passaram diff-check de whitespace. Alertas documentais
pré-existentes de hard-break Markdown e linhas vazias finais foram mantidos
para preservar os registros históricos; nenhum relaxamento de teste funcional.
Build197 testes Android/TypeScript/Vite/native e QA físicos C106 são os já
concluídos, sem novo patch/build/reset/instalação neste ciclo Git.

Push normal `git push origin HEAD:main` retornou sucesso, avanço
d039f88→66b6c90. Consulta independente `git ls-remote --heads origin
refs/heads/main` retornou exatamente66b6c90445456cf15ad7fd7ab79ea2a6acbec4c8;
divergência HEAD...origin/main0/0 e workspace limpo antes do registro final.
Sem force/amend/rebase/PR, nenhuma operação no workspace histórico/projeto
protegido, backend ou publicação do updater. Segundo commit é somente este
comprovante e os registros de memória/fechamento; igualdade remota de seu SHA
deve ser conferida após o push e reportada no resultado final.

Erros auxiliares: default hooks directory ausente, confirmado sem configurar/
contornar hooks; regex inicial de exclusão confundiu build.gradle com pasta
build, corrigida para boundary de diretório antes do staging. Nenhum segredo
foi encontrado. Set-Content PowerShell adicionou BOM à mensagem do primeiro
commit, apenas metadado; mensagens posteriores usam escrita UTF-8 sem BOM,
sem reescrever histórico. Esses erros não alteraram código/app/artefato.

## Limites preservados

APK local1.0.19/C106, SHA256
e0ff71de1715bd44c93493cf0585d0465e2dbd850ee2e26f18b191c45c0683de,
continua fora do Git. Código/testes/docs são recuperáveis pelo repositório;
binário entregue permanece local para transferência manual. Home90s não foi
cumprida no teste C105; playback de filme/episódio e retenção C102 continuam
pendentes. Publicação não é nova homologação ou garantia de desempenho.

`CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C106_GIT_PUBLICATION_VERIFIED;
NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM;
GIT_PR_AUTHORIZED=NAO`.
