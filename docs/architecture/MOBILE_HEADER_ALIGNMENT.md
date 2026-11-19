# CANON-01-MOBILE-HEADER-ALIGNMENT

Pedido atual: somente em telas de celular, alinhar o espa?o superior do cabe?alho de Home, Filmes e S?ries ao espa?amento aprovado de Canais ao Vivo. Preservar o respiro de12px entre p?gina e hero.

Hip?tese verific?vel: a regra final hero-top usa max(6px, env(safe-area-inset-top)), ao contr?rio da regra Live fixa12px; o Android j? preserva as barras/insets nativos. Remover somente o cat?logo phone da regra final de hero-header permite a regra recebida de cat?logo12px/6px (igual Live) atuar sem duplicar o inset. Validar CSS real/React Header com env0 e env superior positivo e perfis tablet/TV inalterados.

Base isolada: entrega1.0.49 validada, sem alterar seus bytes. Candidato1.0.50/code50 para teste manual mobile. Sem instala??o em aparelho neste gate: o Fire permanece1.0.49 e seu monitor somente de leitura permanece ativo. Sem backend, Git publica??o, promo??o root, credenciais investigadas, native/player/ativa??o/refactor ou pr?ximo gate.

Allowlist fechada: src/index.css (somente seletor mobile do cat?logo), android/app/build.gradle (49->50), scripts/test-identity-hero-recovery.mjs (expectativa de padding Home/Filmes/S?ries para12px e teste de safe-area), scripts/test-canonical-regression.mjs (somente identidade do novo gate), docs/architecture/MOBILE_HEADER_ALIGNMENT.md, docs/evidence/MOBILE_HEADER_ALIGNMENT.md, docs/governance/authorizations/CANON-01-MOBILE-HEADER-ALIGNMENT.json e4 normativos append-only. Preservar52 recibos e204controles/42su?tes. Preflight canon/C11, regress?o final, build oficial com configura??o p?blica preaprovada em mem?ria, ativos/APK/certificado e preserva??o. Sem teste f?sico de celular alegado.

Implementation clarification before code: append a narrow phone catalog header rule (max-width600px, same profile exclusions) overriding only padding-top to12px; keep the received internal-page safe-area rule intact. This also covers the600px boundary. New comparison uses CDP Emulation.setSafeAreaInsetsOverride against the real CSS/Header and a synthetic Live header slot. No native/API data dependency for this geometry.
