# C132 — publicacao Git da versao 1.0.21 — 2026-10-16

## Autorizacao e preflight

O usuario solicitou explicitamente: fazer commit e push da atual versao para o
repositorio. Autoriza consolidar os patches locais C107–C131 previamente
implementados/testados; sucede as proibicoes de Git desses ciclos, sem ampliar
escopo funcional. GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM;
GIT_PR_AUTHORIZED=NAO. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

Clone independente ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, branch main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git. HEAD inicial
0f68f169f7728fae17c8311832b7643629e97a02. Preflight completo, AGENTS,
Architecture/Execution/Source Boundary e publicacao anterior C100–C106 lidos.
Fetch origin main confirmou divergencia0/0 e index inicialmente vazio.
Nao operar workspace historico nem projeto protegido.

## Allowlist e procedimento antes do staging

Baseline privada tmp/c132-git-publication/baseline.json captura1106 arquivos,
prefixos das tres memorias e manifesto nominal dos220 arquivos pendentes:
39Android, quatro assets de marca,53docs,42scripts,82src. Auditoria C131
reexecutada PASS antes de qualquer escrita; conteudo corresponde a versao
entregue. Sem arquivo novo de proveniencia desconhecida.

Allowlist: exatamente os220 caminhos nominais desse manifesto, este documento
e docs/evidence/C11_C107_C131_GIT_PUBLICATION.md. Nos tres registros de memoria,
somente apendices deste ciclo. Todos os demais arquivos e APK C131 preservados.
Inclui melhorias de hero/metadados/logos/generos/semelhantes, foco e layouts,
carregamento inicial, favoritos/Live/EPG, gestao de aparelhos, controle parental
local PIN/PUK/faixa etaria/D-pad, anti-piscada Fire e logo instalada1.0.21.

1. Revisar manifesto/diff e proveniencia; auditoria sanitizada de candidatos
   para segredos, literais privados do ambiente e URLs sensiveis. Achados
   mostram somente arquivo/linha/tipo, nunca valores privados.
2. Executar lock canonico, typecheck e regressoes locais pertinentes, sem
   novos testes de produto ou alteracao funcional. Build/APK C131 previamente
   verificados permanecem como entregues; nao gerar outro artefato.
3. Stage nominal e conferir igualdade exata dos caminhos e blobs normalizados
   com os hashes auditados. Excluir .env/credenciais/assinatura/tmp/build/cache,
   APK/AAB/ZIP, dumps de dispositivos e catalogos reais.
4. Criar commit consolidado de codigo/testes/docs e push normal HEAD:main para
   origin esperado. Sem force, amend, rebase, bypass de hooks ou release.
   Confirmar SHA remoto independentemente com ls-remote e divergencia0/0.
5. Um segundo commit exclusivamente documental pode registrar o primeiro
   envio confirmado nos registros/evidencia. Conferir novamente remoto e
   workspace limpo; resposta final informa SHA efetivamente confirmado.

Se o remoto divergir, examinar antes de integrar e preservar todas as mudancas;
nao sobrescrever historico. Nenhuma instalacao/reset, alteracao de backend,
Supabase, updater, licenca, fonte ou publicacao de APK esta autorizada aqui.

## Artefato e limites preservados

APK local Xandeflix-v1.0.21-C131.apk,11378734bytes, SHA256
dc71af63531da4709497f069dd5de33cccb11251c86e009f46daab5a25b9b06c.
Package com.xandeflix.prebuilt/code21/name1.0.21, mesma assinatura C130.
Dez arquivos web iguais ao C130,18PNGs/quatro adaptive XML verificados;
oito DEX binarios iguais, tres disassemblies identicos, um so BuildConfig.
Icone metalico instalado/banner, menu interno com X simples. QA fisica de
launcher/anti-piscada mais recentes ainda depende de atualizacao manual.
Publicacao Git nao homologa reproducao/desempenho nem torna artefatos privados
parte do repositorio. APKs permanecem locais/ignorados.

## Emenda anterior a ajustes de fixtures de regressao

A execucao consolidada revelou cinco harnesses antigos sem dependencias
adicionadas por C124–C128; falham antes de suas assercoes, nao demonstrando
falha de produto. Antes do staging, permitir ajustes somente de isolamento:

- scripts/test-c107-catalog-return-navigation.mjs: bindings parentais locais
  ja existentes e useMemo passivo no harness real do CatalogGrid.
- scripts/test-c107-inline-live-epg.mjs: fornecer favoriteButton ao trecho
  JSX isolado, mantendo as mesmas verificacoes EPG/wide/mobile/square.
- scripts/test-c11-home-special-collections.mjs: bindings parentais existentes.
- scripts/test-c11-series-episode-updates.mjs: bindings parentais existentes
  e fixture do hook useCardGenres no teste de badge do card real.
- scripts/test-c111-exclusive-startup-loading.mjs: declarar na allowlist do
  bundle de teste as novas paginas/gate parentais, sem substituir App/AppShell.

Nao remover assercoes nem relaxar criterios de ativacao, foco, ordem, contagem,
EPG ou seguranca. Reexecutar suites afetadas e conferir os hashes de todos os
arquivos de produto com a baseline anterior. Registrar falhas/solucoes nas
memorias/evidencia. Esses cinco scripts ja integram os220 caminhos autorizados;
hashes revisados devem ter registro privado separado da baseline imutavel.
