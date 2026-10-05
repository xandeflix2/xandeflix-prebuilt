# C11 — Remoção dos badges técnicos do cabeçalho Live

Data: 2026-10-04. Resultado local: PASS. Nenhum aparelho atualizado nesta rodada.

## Autoridade e proveniência

Usuário solicitou remover "Conexão direta à fonte" e "Three-pane preview" do
topo de Canais ao Vivo. Spec/allowlist documentadas antes do código na emenda de
[C11_LANDSCAPE_SIDE_NAVIGATION](../architecture/C11_LANDSCAPE_SIDE_NAVIGATION.md),
com referência no lock. CURRENT_GATE=NONE, nenhum próximo Gate ou Git autorizado.

Preflight read-only: workspace/top-level
`C:\Xandeflix\xandeflix-prebuilt-c11-main`; origin
`https://github.com/xandeflix2/xandeflix-prebuilt.git`; main/ahead 2;
HEAD `f0fdb6840c21e7a660f1662f2bbac9f2cd241cba`. AGENTS, Architecture/Execution,
Source Data Boundary, Activation Lock e spec lidos integralmente. Estado dirty
preexistente preservado; 401 hashes coincidiram com baseline da entrega anterior.

## Patch mínimo

Somente um div informativo removido de `src/ui/pages/LiveTvPage.tsx`: os dois
badges, indicador decorativo e o rótulo alternativo MOBILE FLUXO do mesmo badge.
Sem wrapper vazio nem texto substituto. Título, contagem, Voltar, tabs mobile,
categorias, handlers, estado, listeners, seleção/paginação, foco, preview,
fullscreen e C9 não modificados. CSS, source, busca, ativação, native,
Capacitor e dependências intactos.

Auditoria anterior ao patch calculou em RAM o SHA-256 esperado da fonte após
remover exatamente esse bloco, normalizando somente CRLF -> LF. Fonte final
coincide: `f8b839cf56e830d1db8559e6b2644f82731682bcfacd0ec2d80a4a8e90734783`.
Nenhuma outra alteração textual na tela. 398 dos 401 arquivos auditados
byte-idênticos; exceções autorizadas: LiveTvPage, teste browser e APK raiz.
Documentos de spec/status/evidência e saídas usuais de build também no recorte.

## Verificações

- `npm run c11:new-device:lock` antes do patch: PASS 49 testes + 9 negativos.
- Mesmo lock depois do patch, pelo prebuild de `npm run build`: PASS 49+9.
- `tsc && vite build`: PASS, sem aviso de crypto externalizado.
- Browser completo, Live real com adapters sintéticos locais: **41 checks PASS,
  zero erros**, nenhuma chamada backend ou player nativo real.
- Novos checks: badges ausentes, título/contador/Voltar preservados em paisagem;
  celular 390x844 com três tabs e controles preservados, badges ausentes.
- Checks anteriores preservados: categorias com direita/esquerda/cima/baixo,
  rotas, Voltar superior direito, scroll profundo, matriz TV/tablet/phone,
  rotação e descarte de listeners. PNGs desktop/mobile inspecionados visualmente.
- `npx cap sync android`: PASS. `gradlew.bat assembleDebug`: BUILD SUCCESSFUL,
  142 tarefas, 25 executadas/117 up-to-date. Testes unitários nativos não rerodados.
- Assinatura APK v1/v2 válida, mesmo certificado esperado:
  `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.
- Pacote `com.xandeflix.prebuilt`, versionCode 1/name 1.0, minSDK 23/target 35.
- Cinco arquivos dist no APK com hashes idênticos; badges ausentes do bundle.
  Config protegida HTTPS/CapacitorHttp/mixedContent/logging none preservada.

Skills agent-browser, agent-browser-verify e verification orientaram a história
Canais -> render local -> cabeçalho sem badges, conferindo DOM/console/imagens
e foco. Nenhuma API/data boundary nova. CLI indisponível: fallback do harness
Chrome/CDP existente, perfil isolado, rede externa bloqueada, cleanup no finally.
Erro esperado de preview na fixture deriva da ausência deliberada de URL/player;
não é teste nem regressão física de reprodução.

Artefatos sintéticos:

- [Relatório 41 checks](../../tmp/c11-side-navigation/run-1791151214355/report.json)
- [Cabeçalho desktop e foco categoria](../../tmp/c11-side-navigation/run-1791151214355/live-categories-focus.png)
- [Cabeçalho e tabs de celular](../../tmp/c11-side-navigation/run-1791151214355/phone-live-header-clean.png)

## APK e recuperação

Raiz `Xandeflix-v1.0.0-standalone.apk`, **8780976 bytes**, SHA-256:
`9B12B0C1CD18010C18959A2E175C70E7A48C1A4BEDA73F144C470CB751493F08`.
Cópia byte-idêntica ao app-debug.apk assinado/verificado.

Backup novo `Xandeflix-v1.0.0-standalone-before-live-header-cleanup.apk`, SHA-256:
`A806C1B2F70307DD410E437F9425170146FE07B113FB8B456EF3C1DB1447862F`.
Destino previamente conferido; nenhum backup divergente sobrescrito. Backup
histórico before-side-navigation preservado. Samsung/Fire continuam com o APK
anterior já instalado; não houve install, uninstall, reset, leitura de dados
privados ou operação backend nesta rodada.

## Incidentes e limites

Inventário inicial: glob de caminho do rg inválido no Windows, repetido com -g
e diretório. Saída conjunta de hashes/fonte excedeu budget de output; parse
JSON falhou antes de qualquer edição de produção. Inventário separado completo
e validado, 401 hashes coincidentes. Audit node -e perdeu aspas no PowerShell;
stdin literal resolveu aspas, mas encoding do pipe converteu acentos. Unicode
escapado no script transitório preservou o bloco exato e audit PASS. Nenhuma
mudança de produto por esses incidentes.

Primeira execução browser: BROWSER_WAIT_TIMEOUT antes dos seis controles,
captura em branco; encerrou browser/server. Causa do timeout não confirmada.
Uma repetição com observação transitória de exceções/console, sem patch de
produto ou relaxar asserts, passou gut-check e todos os 41 checks/zero erros.
Não atribuir o timeout à remoção dos badges nem esconder a tentativa anterior.

Avisos não bloqueantes de build: node:fs/node:path externalizados nos módulos
de provisionamento existentes, imports estático/dinâmico e tamanho de chunk;
Gradle flatDir e apksigner metadata META-INF. Fora do recorte, não corrigidos.
Sem teste físico de reprodução, busca ou tempo de Home/60s; nenhuma garantia
universal de ausência de regressões além dos checks e fronteiras verificados.

## Sucessão — instalação e confirmação físicas, 2026-10-04

Após a entrega local acima, usuário pediu "instale e confirme a atualização".
Mantida ordem Fire Stick primeiro. Pergunta específica sobre tablet recebeu
"Sim, atualizar também o tablet". Emenda de alvos/preservação/allowlist registrada
antes da instalação no contrato lateral e referenciada no lock. Isso sucede
somente o estado histórico de APK não instalado nos aparelhos acima.

Preflight repetido no mesmo workspace/origin/main/HEAD f0fdb684...; contratos
obrigatórios lidos, dirty preservado, CURRENT_GATE=NONE, Git não autorizado.
401 hashes coincidiram com a entrega no início E no fim, nenhum novo patch,
script versionado, build ou reescrita APK/backup. Apenas docs e outputs
sanitizados dos probes transitórios. Lock oficial rerodado **49+9 PASS** antes
da entrega física, assinatura/certificado/package/hash/8780976 bytes confirmados.

Instalações sequenciais do APK já validado:

| Alvo | Install -r | APK instalado SHA-256 | Privados idênticos | Catálogo idêntico durante install |
|---|---|---|---|---|
| Fire Stick AFTSSS, 192.168.3.104:5555 (primeiro) | Success | 9B12B0C1...493F08 | 4/4 | 436/436 arquivos |
| Samsung SM-X610, RX2X301Q3KY (segundo) | Success | 9B12B0C1...493F08 | 4/4 | 505/505 arquivos |

Ambos anteriormente A806C1B2...; após install o SHA-256 público do base.apk
corresponde exatamente ao APK raiz
`9B12B0C1CD18010C18959A2E175C70E7A48C1A4BEDA73F144C470CB751493F08`.
Quatro arquivos de identidade/chave/instalação/ativação e árvore files/prebuilt
comparados somente por hashes em RAM, sem publicar valores, caminhos internos
do catálogo ou digests privados. Comparação concluída antes do lançamento
normal; não afirma que syncs normais futuros nunca alteram catálogo.
Sem uninstall/clear/reset/regeneração/alteração persistente de orientação.
MainActivity iniciada normalmente com Status ok nos dois alvos.

Confirmação física por WebView/CDP exclusivo do processo do package:

- Fire PID 31297, viewport 960x540: Canais selecionado pela UI observada.
- Samsung PID 6832, viewport 1365x853: Canais já ativo no snapshot inicial,
  sem nova seleção redundante.
- Ambos: título Canais ao Vivo, contador e Voltar visíveis, badges técnicos
  ausentes, sidebar com ícones e 24 controles de categoria/seleção ativa.
- HTTPS secure context e processo preservado durante cada confirmação.
- Capturas recortadas somente ao cabeçalho inspecionadas visualmente; sem
  capturar player/mídia, fonte, tela de chave ou dados privados.
- Skill agent-browser orientou observar menu antes de interagir e confirmar
  DOM/PNG, usando fallback CDP previsto porque CLI indisponível. Sem Runtime/
  console/rede brutos, sem consultas storage WebView/fonte ou ações administrativas.
- Forwards próprios tcp:50545/50546 removidos; lista de forwards final vazia.

Artefatos físicos sanitizados:

- [Fire — relatório](../../tmp/c11-side-navigation/fire-live-header-1791152196948/report.json)
- [Fire — cabeçalho confirmado](../../tmp/c11-side-navigation/fire-live-header-1791152196948/live-header-confirmed.png)
- [Samsung — relatório](../../tmp/c11-side-navigation/tablet-live-header-1791152229493/report.json)
- [Samsung — cabeçalho confirmado](../../tmp/c11-side-navigation/tablet-live-header-1791152229493/live-header-confirmed.png)

Nenhum incidente de instalação/confirmacão observado. Sem escolher canal/grupo,
comandar playback/fullscreen/filmes/séries, modificar backend/Git/outros aparelhos
ou retomar performance de 60s. Preview automático e rede normal da página não
foram interceptados; não constitui nova homologação física de reprodução.
