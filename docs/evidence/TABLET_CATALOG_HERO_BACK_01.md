# TABLET-CATALOG-HERO-BACK-01 — especificação anterior ao patch
Autorização: usuário esclareceu que deseja retirar Voltar do hero das páginas Filmes e Séries (catálogo), mantendo o botão nos detalhes. Também pediu atualização em tempo real no tablet e reiterou prossiga. Registro dessa autorização não constitui adjudicação independente.
Base: clone independente de 81a1702 em main; código de produto igual à origem do APK 1.0.53, diferenças de assets gerados serão regeneradas. Workspaces existentes preservados.
Alteração funcional única: CSS restrito a #root .app-shell--tablet :is(.movies-page,.series-page) .hero-banner > .hero-top-actions > .btn-back com display:none. Cast e botões fora do hero não entram no seletor. Retorno Android permanece existente.
Allowlist: src/index.css; scripts/test-canonical-regression.mjs somente inclusão estrita do recibo antes da concessão sintética ANDROID-38; docs/governance/authorizations/TABLET-CATALOG-HERO-BACK-01.json; docs/evidence/TABLET_CATALOG_HERO_BACK_01.md; append em docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md, docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md.
Build de teste mantém versão 1.0.53, identificado por hash próprio; assets gerados e android/local.properties apenas no novo workspace. Dependências físicas copiadas da origem íntegra sem instalação ou atualização. C11/cânone/regressão obrigatórios; teste CSS por perfis e verificação física do tablet.
Instalação -r somente no tablet SM-X610 RX2X301Q3KY, package/assinatura iguais; comparar identidade/chave/instalação/ativação/token antes/depois. Não limpar dados nem mudar fonte. Nenhum commit/push/main merge/backend ou outro dispositivo.

Correção de escopo recebida antes de editar código: retirar o botão das páginas de catálogo Filmes/Séries; detalhes mantêm o retorno. Prévia inicial de detalhes é temporária e será substituída, não é a entrega final.

Preparação de baseline: reproduzir somente os bytes exatos de src/main.tsx da origem 1.0.53, após comprovar igualdade normalizada LF. Checkout novo apresentou CRLF e o teste histórico exige SHA-256 bruto LF; nenhum teste/verificador foi alterado. Falha e hashes preservados em EOL_REPRODUCTION.json.

Implementation: one tablet movie/series catalog hero CSS rule; runner changes only exact authorization expectation. Results recorded externally; physical review pending.


### TABLET-CATALOG-HERO-BACK-01 — fechamento técnico local
APK de teste instalado exclusivamente no SM-X610: SHA-256 61940088dd13f87b16ab218525acf9f5b64713e51b08ded96afc61097254fd1d. Verificação física: Back oculto em Filmes/Séries do catálogo; visível em detalhes. Identidade/ativação preservadas. Cânone/C11/typecheck e regressão204/45 PASS. Teste suplementar legado de detalhes falha igualmente na base por harness sem ActorDetailPage; limitação externa documentada, sem alteração do teste. Falhas remotas de CI permanecem; revisão independente e publicação não realizadas. NEXT_GATE_STARTED=NAO.
