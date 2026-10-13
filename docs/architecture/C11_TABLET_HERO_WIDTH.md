# C11 — largura do hero no tablet — 2026-10-06

Pedido explícito: aumentar a largura do hero da Home, Filmes e Séries no tablet.
Clone independente/main/remote/HEAD confirmados; CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Correção local autorizada, sem commit/push/PR/backend.

Allowlist: src/ui/components/AppShell.tsx, src/index.css; este contrato,
evidência correspondente, relatório e quatro memórias em modo append-only.
Identificar tablet somente pelo perfil visual Android sem Mobile/TV ou iPad;
não consultar nem alterar identidade/licença/tipo de aparelho registrado.
Reduzir margens laterais das três páginas para 8px, respeitando safe-area,
e ocupar a largura disponível do conteúdo. Hero permanece horizontal,
object-fit cover e sem distorção; altura e layout de detalhes exclusivos
de celulares conservam suas regras. Não ultrapassar sidebar/viewport.

Aceitação: verificar dimensões reais em tablet landscape e portrait, nos
três tipos de página; sem overflow. Conferir telefone e Fire sem nova margem
de tablet. Build e lock canônico obrigatórios para entrega de APK atualizado.
