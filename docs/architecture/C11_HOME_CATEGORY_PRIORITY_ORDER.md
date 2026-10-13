# C11 — Ordem prioritária das categorias da Home (ciclo64)

2026-10-10. Pedido direto: Lançamentos, Recentes, Filmes em Destaque,
Séries em Destaque, depois as demais categorias na ordem relativa atual.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Ciclo local, sem commit/push/PR.
Preflight no clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main,
main/origin canônico/HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
AGENTS, Architecture, Execution, Source Data Boundary e Activation Lock lidos.
Capturar baseline antes de código; preservar alterações C11 anteriores.

## Especificação anterior ao código

Substitui somente a ordem de Home do ciclo49 em
C11_HOME_RELEASE_AND_PLAYBACK_NOTICE.md, anteriormente Lançamentos depois
de Séries em Destaque. O hero permanece acima de todas as fileiras.
Usar as categorias de filmes existentes reconhecidas por isReleaseCategory:
renderizá-las antes de Recentes e retirá-las da posição anterior, sem duplicar.
Se houver mais de uma categoria de lançamentos, manter sua ordem relativa.
Se não existir, não fabricar fileira. Recentes mantém sua regra de ausência
quando o histórico não contém itens elegíveis; adultos continuam excluídos.

Separar somente a apresentação das referências de categorias. Reutilizar o
mesmo renderer JSX de AsyncCategoryRail nas duas posições, extraído localmente
para evitar duplicação; mesmos keys/IDs, callbacks, fila, previews, inicial20,
loadWhenVisible e quota de preparação da primeira categoria. Manter demais
filmes e séries na ordem relativa existente. Recentes entra no mesmo container
das fileiras; sem alterar rotas, hero, catálogo, ordenação source-desc dos itens,
atualização automática, selos, retomada, foco neon ou buffer do ciclo63.

## Allowlist

Este documento; docs/evidence/C11_HOME_CATEGORY_PRIORITY_ORDER.md;
docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md;
docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md;
src/ui/pages/HomePage.tsx somente separação/posição das fileiras;
scripts/test-c11-home-release-notice.mjs somente dependências atuais de Home
e expectativas da nova ordem, mantendo verificações de categorias/quotas;
android/app/build.gradle somente versionCode6/name1.0; tsconfig.tsbuildinfo,
saídas ignoradas de build/Capacitor/APK e helpers privados em
tmp/c11-home-category-order-20261010. Nenhum novo teste de implementação,
componente, CSS, player, hook, backend, env ou fonte.

## Aceitação e entrega

Verificar ordem, ausência de duplicatas, preservação do catálogo e demais
categorias, callbacks Ver todos e navegação existentes. Usar suites atuais
Home/coleções/D-pad; incompatibilidade histórica de harness deve ser registrada,
sem declarar suite integral PASS ou relaxar invariantes. TypeScript/build/lock,
sync e assembleDebug; assets/certificado/package mantidos. Nenhuma mudança nativa
além do versionCode; testes nativos154/0 do ciclo63 podem ser reutilizados.

Disponibilidade anterior e autorização de atualização/teste Fire1/S24 persistem.
Install-r nos mesmos alvos quando conectados e sem reprodução ativa, preservando
SHA dos arquivos privados e firstInstallTime. Fire1 é AFTSSS/G071EL13142513WK/
192.168.3.126:5555; S24 SM-S926B/RXGYB03FL4W com transporte Wi-Fi autorizado.
Não interromper usuário/player, desbloquear sistema ou instalar em outro alvo.
Tablet/Fire2/S23 fora desta entrega. Se indisponível, registrar entrega física
pendente; gerar APK recuperável e validar código sem pedir aprovação redundante.
