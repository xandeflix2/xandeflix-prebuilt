# C91 — Evidência: hero dinâmico de Filmes e Séries

2026-10-12. Contrato prévio: [C11_BROWSE_DYNAMIC_HERO](../architecture/C11_BROWSE_DYNAMIC_HERO.md).

## Resultado local

Listas gerais Filmes/Séries montam BrowseHero com kind explícito, hook e
carrossel Home reutilizados. Consultas de opções/lotes no índice limitadas ao
tipo solicitado; fallback, extras e séries recentes também respeitam o tipo.
Home conserva defaults mistos e regras atuais de recência/novos lançamentos.
Preparação/generation segmentada existente não muda, sem catálogo remoto.

Rotação dez segundos, fade, anterior/próximo/pausa/contador e detalhes do título
exibido. Foco inicial no main não interativo evita pausar antes da interação;
contorno de foco removido somente desse main, preservando controles. Celular
vertical, tablet/TV horizontais; nome acessível por categoria e título h2 sob
h1 da página. Categoria específica e detalhe individual preservados.

## Verificação

- Preflight: clone ativo independente, origin esperado, main,
  HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline939 hashes sem .env;
  sem escrita na pasta histórica/projeto protegido. Sem Git/backend/instalação.
- Activation Lock antes do patch e nos prebuilds posteriores PASS:
  26 ativação, 27 promoção, 9 controles negativos. Hook não relaxado.
- Nova suite typed: consulta exclusiva por kind, cinco por janela, exclusão
  no lote seguinte, default Home5+5, cache generation, hook real SSR com
  fallback/extras/séries recentes, wrapper e filtro defensivo do carrossel PASS.
- Suite Home existente PASS (seleção/recência/prioridade/generation/reordenação/
  remoção/cancelamento/cache/alternativas e integração hook/hero).
- Hero artwork eligibility/cache/limite de duas requisições/exclusão de imagem
  da fonte PASS. Cinco grupos D-pad Fire/Filmes/Séries/cleanup/inset PASS.
- Regressão C90 de publicação/validação/erros/MASTER PASS; seis testes JVM do
  updater PASS, zero failures/errors. Updater incluído no DEX do novo APK.
- Browser Chrome, TSX/CSS reais, catálogo/storage/imagens/metadados sintéticos
  isolados: Filmes e Séries em PHONE412x915, TABLET1280x800, TV960x540 PASS.
  Imagem decodificada, zero overflow, heading/labels, seleção atual, troca de
  lote/manual/automática, botão estável, pausa/foco/hidden/reduced-motion.
  Timeout real de10segundos comprovado; Home mista e empty state PASS.
  Sem erros window/unhandledrejection. Screenshots dos seis casos inspecionadas.
  Browser não substitui validação do APK/controle remoto em aparelho físico.
- Typecheck, build cliente VITE_DEBUG_BUILD=false, cap copy e Gradle
  testDebugUnitTest/assembleDebug PASS. Diff check PASS. Revisão React:
  hooks estáveis/incondicionais, abort de gerações, deps do escopo, default
  Home intacto, limites de imagens e controles/handlers acessíveis preservados.
- APK com todos os sete assets dist byte-match, mesmo certificado do14,
  package com.xandeflix.prebuilt, versionCode15, versionName1.0.15.
  APK14 privado conservado com hash original.

## Artefato para teste da atualização

`tmp/c91-browse-dynamic-hero/Xandeflix-v1.0.15-hero-dinamico.apk`

- Tamanho exato:11081999bytes.
- SHA256:219fad62a0c26d9234577e6858f739d15c242d21a1a707d07789c2010c2553df.
- Dados do painel:apk-metadata.json/dados-publicacao.txt no mesmo diretório.
- Usuário precisa enviar APK15 ao Dropbox e publicar código15/hash/tamanho/URL
  no MASTER antes da busca manual em aparelho que já tenha APK14. Não houve
  upload/publicação15, conexão/instalação em dispositivo ou alteração de cliente.

## Limites e ajustes do harness

Primeiras execuções corrigiram split/UTF8 do PowerShell, escapes de seletores,
URLs de fixture com query que duplicavam singletons Vite e observação não
atômica entre mudança assíncrona de lote e clique. Fixtures finais usam módulos
canônicos sem query, mocks isolados e leitura/clique atômicos. Windows estava
com reduced-motion; emulação explicitou no-preference para validar rotação e
testou reduce separadamente, sem alterar preferência real do usuário.

Lint global Android permanece não homologado: C90 identificou138 erros em
arquivos pré-existentes; C91 não altera esses arquivos nem repete lint amplo.
Warnings de bundle grande/Node externalizado pertencem ao build existente.
APK debug assinado para validação, teste físico pendente; não afirmar publicação
ou atualização remota já concluída. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
