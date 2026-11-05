# CANON-01-HERO-PLATFORM-ALIGNMENT — especificação anterior ao código, 2026-10-23

Pedido explícito: manter a logo32px no local atual, centralizar verticalmente o bloco de gênero na logo e acrescentar12px de respiro mínimo entre a imagem e a sinopse. Reusar o Hero compartilhado por Home/Filmes/Séries/categorias, preservando dimensões, título, metadados, catálogo e carregamento opcional.

Causa CSS: linha flex usa align-items:flex-start; parágrafo tem margin-bottom variável por perfil, e slot32px termina exatamente no início da sinopse. Apenas align-items:center não basta, porque as margens inferiores diferentes deslocam o centro real do texto. Patch planejado: align-items:center na linha, margin-top:0 e margin-bottom:12px no slot. Somente quando o slot tem imagem (:not(:empty)), atribuir a mesma margin-bottom:12px ao parágrafo adjacente, com prioridade suficiente frente aos perfis existentes. Os centros dos conteúdos ficam iguais e a margem do slot separa a sinopse. Slot vazio continua display:none, gênero sem logo mantém suas margens originais e linha sem logo/gênero não ganha espaço vazio. Sem :has, deslocamento absoluto ou transform.

Nova emenda nominal depois do gate anterior encerrado: preservar os25 recibos históricos, inclusive HERO-PLATFORM-COMPOSITION. Criar26º recibo com2 grants (CSS e runner), ambos encadeados ao gate anterior. Runner só acrescenta identidade esperada antes de ANDROID-38; manter todos147 controles/26 suítes, sem mudar assertions/timeouts/skips. Verificador e código TSX/serviços/hooks permanecem byte-idênticos.

Allowlist9 caminhos:

- src/index.css
- scripts/test-canonical-regression.mjs
- docs/governance/authorizations/CANON-01-HERO-PLATFORM-ALIGNMENT.json
- docs/architecture/HERO_PLATFORM_ALIGNMENT.md
- docs/evidence/HERO_PLATFORM_ALIGNMENT.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Baseline: recebido exato por SHA256 de todos os arquivos do release anterior, com13 comandos reais PASS,147 controles/26 suítes,894 protegidos e127 Prebuilt, comprovados em tmp/hero-platform-composition-20261023. Reusar essa evidência por identidade de bytes, sem declarar nova execução do baseline completo. Rodar canon:check e C11 antes do CSS; registrar a falha visual atual por medição, e validar depois em Chrome real com código/CSS reais e fixtures de conteúdo explícitas. Exigir centro gênero/logo delta≤0.6px, logo32px e sinopse≥12px abaixo da imagem, casos longos/sem gênero/sem logo, phone/tablet/TV/web. Não mascarar o pedido de correção como erro de API.

Depois executar os13 comandos do gate, cap copy (sem mudança nativa), assembleDebug, C11 antes de entregar e auditoria de assets/assinatura/credenciais/allowlist/prefixos. Native215 testes/36 suítes anteriores poderão ser reutilizados somente por bytes nativos idênticos, nunca declarados como nova execução. Atualização in-place somente no tablet conforme autorização persistente da sequência UI/ADB; comparar identidade/chave/ativação/fonte/parental/catálogo sem persistir dados privados. Navegar normalmente até plataforma reconhecida e medir o logo real instalado. Sem reset/uninstall, nova fonte, native/version/package/lock/integração, Git add/commit/push/PR/merge/main/Vercel/Supabase ou próximo Gate.

Autorização literal SHA256 83762cc1e81655fd1219e90cbd373268e1d149038b7e8c7ed640fab0e1c4c8d5. Registro de proveniência, não assinatura digital humana. Gate anterior, relatórios/APKs e recibos não serão reescritos. Usar somente a cópia operacional isolada; root ativo/L1 preservado.


## Autorização literal UTF-8/LF

```text
AUTORIZAÇÃO EXPRESSA DO USUÁRIO — UTF-8/LF

A IMAGEM DA LOGO DO STREAMING APARECE NO LOCAL CORRETO. MAS O TEXTO DO GENERO APARECE ALINHADO COM A PARTE DE CIMA DA LOGO. PRECISO QUE FIQUE ALINHADA COM O MEIO DA IMAGEM DA LOGO. A SINOPSE ESTA COLADA NA PARTE INFERIOR DA LOGO. PRECISO QUE OU A MARGEM INFERIO DA LOGO AUMENTE OU A MARGEM SUPERIOR DA SINOPSE SEJA MAIOR PARA NAO FICAR TAO COLADO.
```


## CANON-01-HERO-PLATFORM-ALIGNMENT — registro anterior à validação final, 2026-10-23

Pedido explícito: centralizar o gênero no meio da logo32px e separar a sinopse por12px. Patch CSS mínimo: flex center e margens inferiores iguais apenas para slot não vazio/gênero adjacente. Preservados fundo/canto transparente,32px, antecipação opcional e comportamento sem logo. Novo26º recibo2 grants encadeados ao HERO-PLATFORM-COMPOSITION,25 anteriores íntegros. Auth SHA256 83762cc1e81655fd1219e90cbd373268e1d149038b7e8c7ed640fab0e1c4c8d5. Baseline completo reutilizado por todos os bytes do release anterior, canon/C11 antes do patch exit0. Validação visual/APK/físico finais PENDING. Sem native/versão/fonte/Git/main/backend/reset/outros aparelhos/próximo Gate.


## CANON-01-HERO-PLATFORM-ALIGNMENT — conclusão local e tablet, 2026-10-23

RESULT=PASS. Gênero centralizado pelo centro real do bloco de texto com a logo32px, e sinopse separada por pelo menos12px. CSS somente: align-items:center; slot sem margem superior/com12px inferior; parágrafo adjacente recebe a mesma margem inferior somente quando o slot não está vazio. Nenhum ajuste absoluto/transform/:has. Sem logo, margens anteriores e ausência de spacer preservadas.

Chrome real/CSS e Hero reais com fixtures sintéticas:12 casos PASS, incluindo Home/Filmes/Séries, phone/tablet/Fire/TV/web, gênero longo/ausente e logo ausente. As duas falhas anteriores foram reproduzidas pelas medições de antes; nenhum erro de rede foi usado como causa. A amostra física de baseline Home não tinha logo carregada e foi honestamente registrada como tal. Após update in-place, categoria Netflix aberta por navegação normal confirmou logo real32px carregada/visível, delta de centro gênero/logo 9.5367431640625e-7px, espaço logo/sinopse 12px. Screenshot tablet-alignment.png, sem imagem injetada ou fonte alterada.

Todos13 comandos oficiais exit0,147 controles/26 suítes,894 protegidos,127 Prebuilt. Baseline completo anterior reutilizado por igualdade SHA256 de todos os arquivos; baseline canon/C11 também executados antes do CSS. Cópia Capacitor, assembleDebug, C11 antes da entrega e canon após copy/fechamento exit0. Native215 testes/36 suítes/0 falhas/erros/skips são evidência real reutilizada da etapa anterior com bytes nativos idênticos, não nova execução. Sem redução de assertion/timeout/skip.

APK Xandeflix-v1.0.37-hero-plataforma-alinhada-20261023.apk, SHA256 63f3232b049c8052542e0239fa0f1d43bb727bc81d8770a5022227e8b2c3513f, versão1.0.37/code37/package/certificado preservados, assets conferidos e sem dados/credenciais privadas encontrados. Tablet SM-X610 install-r, sem reset/uninstall/restore. firstInstallTime e todos os registros privados medidos de identidade/chave/ativação/fonte/parental/catálogo preservados por comparação em memória; nenhum valor/hash privado persistido. Nenhum outro aparelho foi instalado.

Gate26 com2 grants; todos25 recibos históricos preservados. Allowlist9 caminhos, prefixos documentais recebidos preservados, CSS anterior mantido como prefixo, runner só acrescenta a identidade da emenda. Nenhuma alteração TSX/hook/serviço/API/fonte/player/Android/version/package/lock. Root ativo/L1/branch/HEAD/main e APKs anteriores intactos; sem Git add/commit/push/PR/merge/Vercel/Supabase administrativo ou próximo Gate. Evidências/diff/hashes em tmp/hero-platform-alignment-20261023.


A primeira inspeção após install-r terminou VISUAL_VERIFICATION_PENDING: Home montada, dados preservados, mas header foi observado durante estado de fundo. A primeira medição de logo tinha geometria correta porém document.visibilityState hidden e ficou FAIL, preservada em PHYSICAL_ALIGNMENT.json. Leitura nativa confirmou tablet acordado e sem keyguard; reaberto normalmente am start -W, sem reset/reinstalação/bypass, e a página voltou visible/focused. TABLET_UI_RECHECK.json confirmou header transparente, Home/fundo/extensão e mesma geometria. PHYSICAL_ALIGNMENT_RECHECK.json confirmou logo real carregada em primeiro plano, centro delta≈0 e12px de respiro. Nenhuma mudança de código ou ajuste de assertion/timeout foi feita entre essas medições. As evidências iniciais continuam intactas; o resultado final usa a nova execução positiva.
