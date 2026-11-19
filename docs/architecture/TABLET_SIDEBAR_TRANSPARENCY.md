# CANON-01-TABLET-SIDEBAR-TRANSPARENCY — especificação antes do código, 2026-10-23

Pedido atual autoriza transparência do menu lateral TABLET, igual à composição Fire/web. Implementação local isolada baseada no APK de primeira carga em fluxo já validado. Não copiar a densidade TV de36px nem mudar touch targets/ícones/rail do tablet. A proibição anterior de atingir tablets em TV-SIDEBAR-COMPOSITION fica substituída somente nesta composição de fundo explicitamente solicitada.

Causa por código: .app-header do tablet já é transparente, porém app-shell continua com fundo escuro e a extensão pointer-inert de .page-container.immersive-background::before só existe no seletor TV que exclui tablet. Reutilizar o mesmo background herdado na faixa lateral tablet, sem fetch de imagem, blur, animação, escala ou novas camadas nativas.

Patch fechado: acrescentar regras exclusivas #root .app-shell--tablet.app-shell--side-nav:not(.app-shell--tablet-portrait), base shell var(--bg-dark), page-container imersiva relative e ::before pointer-events:none com width calc(var(--side-nav-width,80px) + env(safe-area-inset-left,0px)). Não alterar regras TV, phone, tablet retrato, JSX, handlers, foco, atalhos, largura, padding, tamanho de ícones ou links.

Allowlist:

- src/index.css
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-TABLET-SIDEBAR-TRANSPARENCY.json
- docs/architecture/TABLET_SIDEBAR_TRANSPARENCY.md
- docs/evidence/TABLET_SIDEBAR_TRANSPARENCY.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Novo recibo encadeado: src/index.css supersedes CANON-01-TV-SIDEBAR-COMPOSITION; runner supersedes CANON-01-STREAMED-VOD-INVENTORY-RECOVERY. Apenas acrescentar identidade da nova emenda na expectativa já existente, preservando147 controles/24 suítes e46 dedicados/127Prebuilt. Verificador/workflows/recibos23 anteriores não mudam.

Baseline antes do patch: canon:check, canon:test e C11. Depois: canon:check, canon:test, C11, typecheck, update/security/playback check, build/site:build, testes site/artifact/inspect/Prebuilt; cap sync/Gradle/lock para APK. Verificação CSS calculada compara rail/fundo e dimensões tablet landscape; phone/tablet retrato/TV devem manter geometria e estilos anteriores. Sem teste unitário que espelhe CSS; verificar renderização real ou navegador explicitamente identificados.

Build/APK recuperável para instalação manual faz parte da entrega atual. Não instalar/resetar dispositivos nesta demanda. Preservar fonte, ativação, importador em fluxo/HLS, armazenamento, dados, versão1.0.37/code37/certificado, Git/main e serviços externos. Sem commit/push/PR/merge, Vercel, Supabase, próximo Gate. Não reescrever a cópia recebida nem APKs anteriores.

Autorização SHA256 ee28dda02649c27d6bcf4517aa2fedeac038f44055a6df3df4e42ed58f57bd98. Registro de proveniência, não assinatura digital humana. Baseline/validação/auditoria e homologação física são estados distintos; nunca fabricar PASS.


## Autorização complementar antes do patch — 2026-10-23

Usuário confirmou o tablet conectado e solicitou atualização via ADB. Permitido install -r apenas no tablet SM-X610 já existente, pacote com.xandeflix.prebuilt e mesmo certificado/versão, depois do APK validado. Conferir identidade/chave/ativação/fonte/parental e ponteiro de catálogo por hashes somente em memória antes/depois; nunca persistir hash de PIN/chave curta. Nenhum uninstall, pm clear, semeadura, rotação, ativação, fonte nova, alteração no Fire/phone ou backup/restore. Se dados divergirem antes de abrir o app, parar e reportar. Preservar fonte e catálogo; abertura normal da MainActivity para confirmar o estilo. Caso tablet não acessível, entregar APK e estado PENDING físico.

Autorização completa UTF-8/LF SHA256 eed871d7101e7c757650d09709e8af97004106176d2aae259ee3955388698401. A especificação inicial acima precedeu qualquer código e é preservada como prefixo.
