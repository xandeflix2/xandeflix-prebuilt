# C149 - APK com guia por foco e update Fire Stick - 2026-10-17

## Autorizacao e preflight

Usuario confirmou os2 fluxos C148 no navegador e pediu novo APK para demais
dispositivos e instalar no Fire Stick conectado. Autoriza build/assinatura
existente e install -r exclusivamente com.xandeflix.prebuilt no Fire identificado
ADB G071CQ070344374G/model AFTSS. Read-only devices mostrou somente esse alvo,
atualmente1.0.28/code28. Tablet/celular recebem arquivo, sem instalar neles.

Clone ativo c11-main/main, origin esperado, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d; contratos/lock lidos no turno,
Source Boundary relido C148. C148 auditoria PASS e confirmacao usuario
registradas antes deste ciclo. Baseline1178/copias em tmp/c149-live-guide-test-apk.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; Git/backend nao autorizados.

## Especificacao anterior ao codigo/build/install

- Alterar somente versao Gradle29->30/1.0.29->1.0.30. Incluir runtime atual
  C148 ja validado, cores web C146/C147, recursos/fontes/startup anteriores,
  sem novos patches funcionais. Preservar package/certificado/recursos/HTTPS.
- Build Android standalone a partir de dist padrao atual, sem mode web,
  server.url ou implementacoes web exclusivas. Lock/typecheck/build padrao
  C148 acabou de passar, sem alterar fonte apos esse build; versao nova exige
  sync/Gradle assembleDebug/testDebugUnitTest e novo lock antes da entrega.
- Artefato Xandeflix-v1.0.30-C149.apk, validar hash/tamanho, package/versao,
  assinatura igual ao APK C144 e ao instalado28, arquivos dist/recursos nativos,
  codigo C148 presente e sem segredos. APK anterior preservado.
- Antes de update, encerrar somente app alvo para estado consistente. Hashes
  privados em RAM de files/prebuilt e identidade/ativacao/chave/instalacao/token
  e prefs cofre/parental antes/depois; nao ler/gravar plaintext, hashes de conta
  ou conteudo da fonte em logs/disco. Provar igualdade antes de reabrir app.
  Pull do APK instalado somente para certificado (artefato, nao dados de conta).
- Sem uninstall/clear/downgrade/reset/recriar chave/ativacao/fonte ou concessao
  PIN. Mesmo package/certificado e firstInstallTime. Install -r no alvo unico
  confirmado, checar version30/hash instalado; sem instalar outros aparelhos.
- Apos preservacao, abrir app e verificar processo permanece ativo; sem
  iniciar midia/PIN/conteudo adulto, alterar preferencias ou alegar QA visual
  via ADB. CUA vazio; relato fisico de UI/EPG no Fire fica para usuario.

## Allowlist e aceitacao

android/app/build.gradle somente2 constantes; este documento e
docs/evidence/C11_LIVE_GUIDE_TEST_APK_FIRE_INSTALL.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
helpers/logs/APKs privados tmp/c149-live-guide-test-apk e saidas ignoradas
dist/Capacitor/Gradle. Nenhum patch funcional/dep/teste/backend/Git permitido.

Auditoria hashes/reversao das2 constantes, memorias append, novos2 docs,
HEAD/main/index e APK C144 preservados. Validar lock/Gradle/testes/certificado/
empacotamento/preservacao RAM+instalacao sem alegar playback confirmado.
Entregar link APK para tablet/celular e status real da instalacao Fire.
