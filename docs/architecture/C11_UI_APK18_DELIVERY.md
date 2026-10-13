# C96 — APK18 para teste de UI — 2026-10-12

Pedido explícito: gerar APK mais atualizado para testar UI; demais problemas de
fonte/reprodução adiados. Usuário confirmou BAND NEWS SD funcionando. Escopo
somente empacotar estado atual C93/C94, sem nova correção funcional. Preservar
hero sobreposto, Assistir/Ver detalhes, pontos compactos, swipe/10s e Live square.

Preflight workspace ativo independente/main/origin canônicos; HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e, dirty cumulativo preservado.
AGENTS/Architecture/Execution/Boundary/Lock lidos na sessão. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. C95 reconciliação no tablet não mudou código de produção.

Allowlist: este contrato; docs/evidence/C11_UI_APK18_DELIVERY.md; acréscimos
docs/{STATUS,EVOLUTION_REPORT,DECISIONS,ERRORS_AND_BLOCKERS}.md;
tmp/c96-ui-apk18/** e saídas usuais ignoradas de build/Capacitor/Gradle.
Sem patch funcional, Git/backend/upload/publicação/instalação/outros aparelhos.

Aceitação: build web sem painel debug VITE_DEBUG_BUILD=false, prebuild/lock
obrigatórios PASS, Capcopy apenas após build; JVM updater e assemble; APK
com.xandeflix.prebuilt versionCode18 versionName1.0.18, assets iguais ao dist,
assinatura preservada e updater incluído. APK17 preservado por hash. Gerar hash,
bytes e notas para publicação posterior pelo usuário. Auditoria allowlist/HEAD.
UI final depende de teste do usuário no aparelho; não alegar homologação total
de reprodução ou recuperação dos demais dispositivos. Nenhuma instalação aqui.
