# C132 — publicacao Git da versao atual1.0.21

2026-10-16. Autorizacao explicita do usuario para commit e push.
[Spec e emenda de testes anteriores ao staging](../architecture/C11_C107_C131_GIT_PUBLICATION.md).
GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM; GIT_PR_AUTHORIZED=NAO.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Clone independente ativo/main/origin
xandeflix2/xandeflix-prebuilt; HEAD inicial 0f68f169f7728fae17c8311832b7643629e97a02, fetch divergencia0/0,
index inicialmente vazio. Workspace historico/projeto protegido nao operados.

## Conteudo e integridade

Baseline1106 arquivos;220 candidatos conhecidos de C107–C131, mais spec e
esta evidencia (222 caminhos no staging esperado). Codigo/testes/docs/recursos
de versao1.0.21 incluem apresentacao por dispositivo, metadados e arte,
carregamento, favoritos/EPG, gestao de aparelhos e parental local com PIN/PUK,
visibilidade por idade e D-pad, anti-piscada Fire e logo metalica instalada.

Auditoria C131 reexecutada PASS antes das escritas. Cinco fixtures atualizadas
somente para dependencias incorporadas posteriormente: bindings parentais e
useMemo no CatalogGrid, favoriteButton no JSX EPG isolado, bindings parentais
nas colecoes, useCardGenres no badge do card, gate/pagina parental declarados
no bundle isolado de startup. Nenhuma assercao retirada ou criterio relaxado.
Todos os arquivos de produto e APK devem corresponder a baseline; hashes de
teste revisados registrados separadamente. Memorias recebem apenas apendices.

## Validacao antes do commit

43 verificacoes PASS: lock26ativacao+27promocao+9controles negativos,
TypeScript sem emissao e41scripts de regressao presentes no conjunto candidato.
Execucao inicial:38PASS/cincoFAIL por dependencia de fixture nao declarada;
as cinco foram ajustadas em allowlist previa e reexecutadas com todas as
assercoes existentes preservadas, agora PASS. Sem falha de produto encoberta.
Suite C111 mantem App/AppShell reais, autoridades isoladas e zero requests
externas. Testes parentais de seguranca/visibilidade/D-pad e anti-piscada PASS.

Android :app:testDebugUnitTest BUILD SUCCESSFUL: 201 testes em34
suites XML, 0 falhas/0 erros/0 ignorados. Lock passou
antes do Gradle. Avisos flatDir preexistentes, sem novo APK ou cap sync.
Auditoria final/staging devem conferir exatamente222 caminhos, blobs
normalizados, ausencia de segredos e paths privados, whitespace e APK intacto.
Resultados efetivos no registro privado de publicacao; SHA remoto sera
registrado depois do primeiro push confirmado, sem afirmar sucesso antecipado.

## Artefato e limites

APK C1311.0.21,11378734bytes, SHA256 dc71af63531da4709497f069dd5de33cccb11251c86e009f46daab5a25b9b06c.
Mesmo package/assinatura, arquivos de produto intactos neste ciclo Git.
APKs/.env/tmp/builds/caches/chaves/dumps/catalogos reais excluidos do Git.
Sem backend/Supabase/updater, instalacao/reset/release ou novo Gate.
Publicacao nao substitui QA fisica pendente de launcher/anti-piscada nem
homologa desempenho ou reproducao fora das evidencias anteriores.


## C132 - commit e push confirmados - 2026-10-16

Commit de codigo/testes/docs:
[241b2b6608039157e8eb7ea3d952ade87c55f6b3](https://github.com/xandeflix2/xandeflix-prebuilt/commit/241b2b6608039157e8eb7ea3d952ade87c55f6b3).

Push normal HEAD:main concluido; consulta independente git ls-remote retornou
exatamente241b2b6608039157e8eb7ea3d952ade87c55f6b3, divergencia0/0, index/workspace limpos antes deste
fechamento.222caminhos/blobs conferidos contra manifesto auditado apos commit;
zero achados de segredos, todos os arquivos de produto/APK preservados neste
ciclo.43verificacoes PASS e201testes Android em34suites, zero falhas/erros.

Cinco ajustes limitados a fixtures, com assercoes preservadas, documentados
antes do patch. Sem relaxamento do lock, nova funcionalidade ou alteracao no
APK. Memorias append-only. Sem force/amend/rebase/bypass/PR, operacao de
backend/Supabase/updater, instalacao/reset/release ou proximo Gate.

Segundo commit autorizado somente para estes registros documentais; conferir
novamente SHA remoto e workspace limpo apos seu envio e informar no resultado
final. Artefato APK1.0.21 permanece local/ignorado e com SHA256 original.
