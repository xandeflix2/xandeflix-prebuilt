# C93 — Canais em janela touch quase quadrada — 2026-10-12

## Escopo e proveniência

Usuário autorizou PROSSIGA para o modelo B50/50 previamente mostrado e pediu
CONTINUE durante a compilação. Especificação anterior ao código em
[C11_SQUARE_LIVE_LAYOUT](../architecture/C11_SQUARE_LIVE_LAYOUT.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem commit/push/PR, backend,
publicação, instalação ou alteração de cadastro. Clone ativo independente
C:/Xandeflix/xandeflix-prebuilt-c11-main, main, origin esperado,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e preservado. AGENTS/contratos,
boundary e lock lidos; baseline privado de946 hashes captura dirty anterior.
Nenhuma alteração em Header/index.css/player nativo/autoridade/fonte/sessões.

## Implementação

Somente Canais: janela touch com menor dimensão >=600 CSSpx, razão0.8–1.25 e
apresentação não-TV recebe duas metades iguais. Resize/orientação/pointer e
escolha de apresentação recalculam o modo, sem depender da marca do aparelho.
Prévia16:9 limitada a30dvh e EPG inline à esquerda; seletor de categoria,
filtro/paginação48 e canais à direita. Listas rolam independentemente, frame
limitado ao viewport/safe-area. Botões principais >=44px; textos longos
contidos; mensagens de reprodução podem rolar dentro da superfície.

EPG reutiliza componente/service existentes e sua autorização, refresh e abort.
Categorias não trocam o canal em execução. Ref/superfície mantidos ao resize;
medição nativa usa bounds existentes. Fullscreen aproveita o preview atual.
Mobile alongado mantém drawer/Back; TV e desktop sem toque mantêm layout.
Revisão React: hooks incondicionais, listeners e observers com cleanup,
dependências primitivas, sem nova requisição de playback por apresentação,
select com label e filtro com aria-label; imports diretos e zero dependências.

## Verificação local

- Classificador:18/18 limites, toque/TV, dimensões inválidas e janela alongada.
- Regressões mobile/Cast, landscape18 casos+hook real e hero swipe PASS.
- Browser Chromium touch:700x777,777x700,600x600,600x750,750x600,900x1000 PASS.
  Shell/Header/Live/EPG/Cast atuais com portas sintéticas; somente flag do
  Header fixada como build cliente, sem controles MASTER. Sem dados reais.
  Touch scroll separado de canais/EPG;16:9/30dvh, frame sem overflow; seletor,
  filtro/vazio/paginação, títulos longos, EPG pronto/erro/retry/indisponível,
  Cast conectado/erro e erro do preview. Bounds enviados iguais ao DOM.
  Fullscreen/Escape mantêm previewId. Resize para phone412x915 e tablet800x1280,
  retorno square e overrideTV preservam DOM/preview/sessão e não geram novos
  starts/acquires. Desktop sem toque e TV1920x1080 excluídos. Drawer/Back
  mobile e tablet alongado continuam funcionando.
- Typecheck e build cliente VITE_DEBUG_BUILD=false PASS; prebuild lock intacto.
  Avisos já conhecidos de bundle >500kB e módulos Node externalizados presentes.
- Lock antes/depois e no prebuild PASS. Capacitor copy PASS. Gradle assemble
  e seis testes JVM AppUpdateTest:6 testes,0 falhas/erros/skip, BUILD SUCCESSFUL.
- APK package/versão, sete assets iguais ao dist e updater DEX verificados.
  Assinatura igual às versões anteriores; hashes de APK14 e16 preservados.
- Auditoria SHA256 contra baseline: somente allowlist; HEAD preservado.
  git diff --check exit0, com avisos de line endings anteriores.

Logs/fixtures/screenshots e relatório detalhado ficam privados em
tmp/c93-square-live. Browser testa apresentação e portas, não reprodução
nativa/instalação física no Z Fold. Lint Android amplo não foi homologado;
pendência pré-existente de C90 permanece fora deste escopo.

## Artefato local

tmp/c93-square-live/Xandeflix-v1.0.17-tela-quadrada.apk

- versionCode17; versionName1.0.17; com.xandeflix.prebuilt.
-11084739bytes.
- SHA256933115f30da66310298f877bfb0f241c79d2e8a09bd57bb79d50ca8daf29edd7.
- Certificado SHA256b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

Dados do formulário MASTER em tmp/c93-square-live/dados-publicacao.txt.
Upload em Dropbox/publicação e teste físico pendentes; não realizados.
Requer updater14+ já instalado para receber download pelo fluxo de atualização.

## Ocorrências de desenvolvimento

Seletores iniciais de CSS não correspondiam ao prefixo live-preview; corrigidos
após inspeção da renderização. Especificidade ajustada contra regras mobile
de600px para remover reserva do bottom-nav e dar espaço ao header completo.
Fixtures privadas em tmp tiveram cache do dev server: módulos/HTML passam a
usar nomes novos. Falhas do harness por serializar referência DOM, escapar
selector, chamar bounds x/y em vez de left/top e esperar texto errado de retry
foram corrigidas, preservando os critérios. Execução final completa PASS.
Durante retomada, houve consulta read-only inicial ao workspace histórico;
contrato do clone ativo confirmou a migração. Nenhuma escrita/build no histórico.
