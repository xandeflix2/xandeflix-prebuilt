# C11 — Evidência do selo Novidade (ciclo 59)

## Proveniência e comportamento

Spec anterior ao código: C11_NEW_CONTENT_BADGE.md. Preflight clone independente
C11/main, origin esperado, HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e,
baseline privado 762 arquivos. Contratos/AGENTS/Source Boundary/Activation Lock
lidos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; nenhum Git write autorizado.

Movie/Series canônicos e normalização M3U não fornecem data de inserção.
Não confundir estreia/TMDB com inserção no catálogo. Primeiro inventário completo
é referência sem selo; novos títulos detectados depois recebem primeira
observação por dispositivo/fonte e sete dias corridos (604800000 ms).
Isso não comprova uma data global de inserção nem identifica os títulos já
adicionados na semana anterior à instalação desta versão.

Novo inventário local separado IndexedDB v1: somente hash de fonte, snapshot,
hash de tipo/título e timestamp. Fonte/título normalizados não são persistidos
em texto. Tipo movie/series separado; título da fonte inclui ano quando presente.
ID ordinal, capa, categoria e metadados enriquecidos não alteram a identidade.
Homônimos indistinguíveis da fonte compartilham prazo; renomear o título na
fonte pode fazê-lo ser reconhecido como nova entrada. Sem histórico externo
comprovado, esta é a identidade conservadora disponível, não deduplicação global.

Serviço lê um segmento movies/series por vez, lotes200 com yield, limite100000
hashes, verifica manifest/counts/ponteiro e sinal. Inventário só é gravado após
leitura completa, transação atômica com versão anterior/CAS e abort verificado.
Falha, troca de geração ou leitura parcial não promovem baseline/selos parciais.
Snapshot já registrado não é rescaneado; remoção/reinserção não renova a data.
Não lê streams/episódios, consulta TMDB, baixa imagens nem modifica catálogo.

Provider monta somente com catálogo REAL autorizado; processamento opcional
após shell, sem bloquear boot. Display guarda somente hashes ainda recentes,
useSyncExternalStore retorna boolean estável por card, timer compartilhado
programa expiração/reconfere relógio a cada60s enquanto há selos, reconcilia
visibility/focus e remove listeners ao desmontar. Nenhum timer/I/O por capa.
MediaCard comum inclui faixa vermelha/branca no centro inferior do pôster e
Novidade no nome acessível. Ano de título novo fica no canto superior direito,
separado da faixa; badge de tipo e neon permanecem. Não cria novo alvo D-pad.

## Verificação

- Nova suite scripts/test-c11-new-content-badge.mjs: 12 grupos PASS. Baseline
  completo fora do first-fold, inserção inclusive obra antiga, borda exata7dias,
  reboot/resync/reordenação/metadados/capa/reinserção, fonte/tipo separados,
  abort/segmento ausente/malformado/parcial/linha inválida, troca de geração,
  quota/falha de commit, baseline vazio, catálogo completo não segmentado,
  limite100000/nenhum stream lido, subscriptions/expiração e markup real acessível.
- Regressões existentes: categorias7, episódios2 e D-pad Home/detalhe/séries8 PASS.
- Lock22+27+9 PASS por prebuild, TypeScript/Vite/build/sync/Gradle assemble PASS.
  Baseline anterior já coberto pelo lock do ciclo58, sem mudanças intermediárias
  antes deste patch. Evidência Java148/zero failures reaproveitada; nenhum patch
  nativo neste ciclo. Não alegar nova execução física de playback/Java.
- Browser isolado com TSX real, CSS final e covers SVG servidos por HTTP:
  phone412x915, tablet1280x800 e Fire960x540 PASS. Quatro imagens decodificadas,
  dois selos corretos, quatro alvos de foco preservados, branco sobre #e50914,
  selo dentro da capa e ano separado. Screenshots conferidos. Expiração exata
  remove os dois selos em cada perfil sem alterar as capas.
- IndexedDB real do browser em banco exclusivo QA: 14 assertions PASS. Atomic
  commit/read/restart, CAS stale/abort, escopo independente e dados inválidos;
  fluxo completo scan baseline -> nova geração -> persist -> read -> publish
  -> MediaCard -> expiração. Banco QA removido; nenhum ledger de produção semeado.
  Fixtures não equivalem a nova inserção comercial observada num aparelho.
- Review React: hooks incondicionais, memo existente preservado, context/store
  estáveis, subscriptions cleanup, sem rede no render, DOM/foco sem novo alvo,
  fonte real/autorização verificadas. Skills React e Verification aplicadas.

## Entrega e limites

APK final Xandeflix-v1.0.0-standalone.apk, 12400179 bytes, SHA256
5683BE780F02AA11AE171E62EDF87C5DBFAAE7E802745DAA3068A74CADF97520,
bundle index-DvT-8_G7.js, CSS index-BwP8uPUD.css. Assets6 byte-a-byte com dist,
certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d,
package com.xandeflix.prebuilt, version1.0/code1, min23/target35, HTTPS localhost,
sem servidor remoto, recursos anteriores preservados. Intermediário5217 instalado
durante revisão, substituído pela versão final5683; não tratá-lo como atual.

Install -r S24 SM-S926B/RXGYB03FL4W verificado em
2026-10-09T21:47:50.608Z: hash igual, firstInstallTime igual, cinco grupos privados
sem mudanças, 763 arquivos/718 catálogo/cinco nativos preservados. Aplicativo não
aberto pelo instalador. S24 conectado mas UI não visível/desbloqueada: pergunta
de QA pendente, nenhuma conferência visual física alegada. Não desbloquear OS,
iniciar vídeo, enviar mensagens, semear catálogo ou apagar dados para testar.
Tablet/Fire1 mantêm C57; Fire2 sem endereço atual, S23 excluído. Sem atualização
nos outros aparelhos neste ciclo. Luke/AirScreen continuam limites do ciclo55.

Falhas de helpers corrigidas sem mudar a regra do produto: cópia PowerShell
UTF8 do verificador; constructor TS compatível com Node strip-only; export
default de react-dom_client no fixture; espera pelo contexto/navegação/compilação
do browser. Profile Chrome dentro da árvore observada provocou EBUSY no dev
server Windows; QA passa usando profile fora da árvore e config privada que
ignora tmp. Tentativa de remover profile temporário foi rejeitada pela política;
remoção abandonada, nenhum arquivo de usuário apagado. Perfil antigo privado
permanece ignorado. Não relaxados assertions, integridade ou proteção de ativação.

Auditoria final: baseline762, 753 arquivos fora da allowlist preservados,
HEAD igual e zero alteração não autorizada. Evidência privada em
tmp/c11-new-content-badge-20261009; não publicar dados privados dos aparelhos.
