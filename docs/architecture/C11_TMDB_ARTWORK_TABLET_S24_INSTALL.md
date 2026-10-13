# C11 — Build e instalação de capas/hero no tablet e S24

## Autorização e preflight — 2026-10-06

Usuário solicitou: instalar no tablet conectado e posteriormente no celular
S24. Autoriza build APK e instalação recuperável in-place exclusivamente nesses
dois aparelhos, nessa ordem, package com.xandeflix.prebuilt. Não autoriza Fire
Stick, outro package, uninstall/clear, downgrade, reset/rotação, backend ou Git.
Não abrir app automaticamente nem modificar fonte/licença para testar capas.

Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, Git próprio,
main, HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS,
Architecture/Execution e lock de ativação lidos. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Sem commit/push/PR. Estado dirty dos ciclos C11 existentes
e do patch local de capas preservado por baseline de hashes antes do build.

Tablet identificado Samsung SM-X610, characteristics=tablet, API36, package
já instalado. Serial fixo apenas em memória. S24 ainda não visível no primeiro
inventário ADB; solicitar conexão/depuração e aguardar identificação/modelo.
O Fire Stick presente no ADB permanece fora do escopo.

## Allowlist e procedimento

- Este plano, docs/evidence/C11_TMDB_ARTWORK_TABLET_S24_INSTALL.md e acréscimos
  a docs/STATUS.md, EVOLUTION_REPORT.md e ERRORS_AND_BLOCKERS.md.
- Outputs usuais dist, Capacitor/Gradle gerados, assets públicos Android,
  APK raiz e backup em tmp/c11-tmdb-artwork-install-20261006/ ignorados.
  Nenhuma edição manual de código, configuração ou dependência.

1. Lock oficial 49 cenários + 9 controles negativos antes do build/cap sync/
   Gradle/entrega; npm build preserva prebuild obrigatório. Falha bloqueia entrega.
2. Rodar suite de capas e regressões Java, build web, cap sync android e
   assembleDebug. Guardar APK anterior e validar package/SDK/assinatura/config
   standalone e igualdade byte a byte dos assets dist no APK.
3. Confirmar o modelo/alvo e estado ADB antes de cada instalação; tablet
   primeiro, S24 depois. Compatibilidade por SDK e mesmo certificado quando
   package já existe. Se S24 não estiver conectado, não substituir por outro alvo.
4. Congelar somente o package autorizado durante a atualização. Fingerprints
   dos arquivos privados e árvore files/prebuilt antes/depois somente em RAM;
   nunca registrar conteúdo, chaves, URLs de fonte ou digests privados.
5. adb -s <serial validado> install -r <APK validado>; exigir Success/exit0.
   Incompatibilidade de assinatura não autoriza apagar dados nem usar downgrade.
6. Confirmar SHA-256 do APK instalado, package/versão, firstInstallTime e
   igualdade de estado privado. Primeira instalação só se ausência constatada,
   sem fabricar instalação limpa. Abertura/validação física pelo usuário.
7. Lock após build e antes de entrega; conferir hashes congelados e registrar
   resultados reais. Instalação não certifica ativação, catálogo/capas ou playback.

## Continuação S24 conectado — 2026-10-06

Usuário informou S24 conectado; pedido anterior de instalação permanece
explicitamente autorizado. Tablet já instalado e preservado no ciclo anterior.
Preflight repetido: mesmo workspace/top-level/origin/main/HEAD; AGENTS e contratos
lidos, estado dirty conhecido preservado. CURRENT_GATE=NONE, NEXT_GATE_STARTED=NAO.
Allowlist permanece este plano/evidência e acréscimos às três memórias; backups
APK/resultados sanitizados em tmp ignorado. Sem novo build/patch/Git/backend.

Alvo validado Samsung SM-S926B (S24+), phone, API36, currentUser=0, ADB device;
package com.xandeflix.prebuilt já instalado, v1/1.0, run-as disponível. Serial
somente em memória. Atualizar exclusivamente esse alvo com o APK
1BEACE82713AA02BB1FB38953B1E8CDEEB7A4049D0C62DDC2C0877F17C1628E4
já entregue ao tablet. Validar novamente lock/assinaturas, preservar backups e
comparar dados privados/firstInstallTime em RAM antes/depois de install -r.
Não abrir app automaticamente; nenhuma reinstalação/clear/reset/downgrade.
