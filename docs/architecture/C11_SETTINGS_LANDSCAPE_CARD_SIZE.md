# C142 - dimensoes dos cards de configuracoes em paisagem - 2026-10-17

## Pedido, preflight e proveniencia

Usuario reporta cards de alturas diferentes no tablet e Fire Stick; solicita
dimensoes iguais em telas horizontais e proporcao menor na TV. Celular e
navegador ja corretos devem ser preservados. Ciclo somente de apresentacao.

Preflight read-only: clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Estado dirty C133-C141 conhecido;
auditoria C141 PASS antes do patch. AGENTS, Architecture, Execution e lock
de ativacao lidos; baseline de hashes/copias em tmp/c142-settings-landscape-size.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset/APK novo.

## Especificacao anterior ao codigo

- Acrescentar CSS somente para perfis tablet e television, em paisagem,
  excluindo explicitamente conferencia web e apresentacao phone. Television
  inclui Fire Stick, Android/Google TV, TV Box, Tizen e webOS existentes.
- Manter quatro colunas iguais; todas as linhas usam a mesma altura calculada
  pelo maior conteudo. Card e botao preenchem a celula, inclusive Ativacao na
  segunda linha. Foco nao altera geometria.
- Reduzir fontes, padding e altura minima dos cards proporcionalmente ao
  viewport, principalmente no Fire Stick; conservar os resumos completos,
  sem cortar textos ou usar altura maxima que impeça crescimento acessivel.
- Preservar celular, web e retrato; nao alterar janelas dedicadas, conteudo,
  handlers, D-pad, foco, atualizacao, fonte, busca, catalogo ou player.

## Allowlist e aceitacao

src/ui/pages/SettingsPage.css (somente novo bloco isolado);
este documento e docs/evidence/C11_SETTINGS_LANDSCAPE_CARD_SIZE.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md somente append;
helpers/logs privados tmp/c142-settings-landscape-size e saidas usuais de build.

Lock antes/depois, typecheck/build web e padrao. Auditoria de hashes deve
confirmar TSX/JS/Java/config/APKs e CSS anterior intactos, alem das exclusoes
phone/web/retrato. Sem testes redundantes que espelham CSS. QA visual somente
pela ferramenta de navegador se houver superficie; indisponibilidade deve
ser declarada, sem alegar homologacao fisica ou instalar pacote anterior.

## Emenda de entrega anterior ao empacotamento

Para tornar a correcao verificavel nos aparelhos que motivaram o pedido,
entregar tambem novo APK de teste recuperavel, sem instala-lo. Esta etapa
substitui somente a exclusao de APK acima: acrescentar android/app/build.gradle
a allowlist apenas para versionCode27/versionName1.0.27. Preservar package,
assinatura, recursos nativos e todos os outros parametros de build. Baseline
Gradle26 e APK C141 preservados; sem install/reset ou acesso a dados privados.

Apos build padrao com lock, executar cap sync e Gradle assembleDebug/testDebugUnitTest,
validar assinatura/package/versao/HTTPS standalone e igualdade de assets dist,
confirmar novo CSS presente e recursos nativos iguais ao APK anterior. Saidas
Android geradas usuais e APK privado em tmp/c142-settings-landscape-size.
Nao alterar os testes ou codigo de funcionamento para empacotar a correcao.
