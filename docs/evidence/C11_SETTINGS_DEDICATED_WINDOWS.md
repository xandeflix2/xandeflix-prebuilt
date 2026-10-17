# C140 - evidencia das janelas de configuracoes - 2026-10-17

Spec previa: docs/architecture/C11_SETTINGS_DEDICATED_WINDOWS.md.
Baseline1152 arquivos, preflight e auditoria C139 PASS antes da escrita.

## Resultado

Cards continuam compactos. details/summary foi removido; cada botao abre seu
dialog dedicado com titulo, Fechar e detalhes/acoes originais. Janela tem
backdrop, largura limitada ao viewport e rolagem interna; nao expande a grade.
Filhos permanecem montados, preservando feedback/operacoes em andamento.

Helper local registra teclado apenas enquanto aberto: primeira acao disponivel
ou Fechar recebe foco, D-pad/Tab percorrem controles visiveis habilitados,
Escape/Backspace fora de edicao fecham, e foco retorna ao card. Outra janela
aberta conserva prioridade; cleanup remove listeners e fecha janela ao sair.
Enter continua sob o handler existente. App.handleBack ganhou somente duas
linhas para fechar settings-modal antes de navegar para outra rota.

Destinos de parental/ativacao/area18+/seletor de dispositivo fecham a janela
antes do callback original. data-settings-modal separado de data-detail-modal
mantem atualizacao de fonte utilizavel sem alterar seus guardas de seguranca.

## Verificacao

- Novo teste de lifecycle/foco/teclado8/8 PASS com portas DOM sinteticas:
  abertura, retorno, D-pad/Tab sem escapar, disabled/hidden, Escape, outra
  janela, edicao, cleanup, navegacao e reabertura sem acumular listeners.
- Regressao existente fonte8/8 PASS; nenhum teste antigo alterado.
- Lock inicial e repetido pelos builds web/padrao PASS:26 ativacao +27 promocao
  +9 negativos. Typecheck e Vite em ambos PASS; avisos existentes de chunks.
- Dev server3000 serve TSX/CSS novos HTTP200, marcador de dialog presente e
  accordion ausente (dev-smoke.json). Build web separado atualizado.
- Revisao React: helper top-level, refs estaveis e cleanup, filhos mantidos,
  useId para rotulos unicos, botao nativo/aria-haspopup, Fechar focavel, sem
  listeners globais permanentes por card e sem botoes aninhados. Sem nova
  dependencia. Foco e fechamento tratados somente no escopo da janela ativa.
- Auditoria: App identico apos retirar a branch de fechamento; corpo de
  SettingsPage e callbacks originais identicos apos retirar wrappers de
  fechar-antes-de-navegar. CSS fora do bloco dos cards/janelas identico.
  Source/catalog/search/playback/parental/Android preservados por hashes;
  memorias append-only, HEAD/main/index intactos. Apenas3 existentes de UI/
  App e3 memorias alterados,4 novos allowlisted;1146 baseline preservados.

APK C1391.0.25 preservado SHA256
05b0c4b0e58df1b393a49747856c3da4fcb8d2261e23af2213ecd4f171fb6581.
Nenhum novo APK/cap sync/Gradle/install/reset neste ciclo. Logs/helpers privados
em tmp/c140-settings-windows. CUA retornou apps=[]/browsers=[]; QA visual real
e controle fisico ainda pendentes. Testes sinteticos nao certificam renderizacao
ou todos os controles fisicos. Nenhuma automacao alternativa da aba real nem
alteracao de backend/Git. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
