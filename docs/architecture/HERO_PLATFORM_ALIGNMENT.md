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
