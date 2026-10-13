# C79 — Evidência da tabela de licenças

2026-10-12. Escopo e preflight em
[C11_LICENSE_TABLE_RESPONSIVE](../architecture/C11_LICENSE_TABLE_RESPONSIVE.md).

## Resultado

Painel usa toda a largura disponível, retirando o teto interno de 1400 px.
Desktop mantém tabela, com dez colunas proporcionais, textos quebráveis e ações
de 36 px distribuídas em linhas dentro da própria célula. Até 600 px os registros
usam blocos com rótulos. Nenhum campo, handler ou permissão removido.

## Verificação

- Chrome headless, componente real `AdminLicensesView`, CSS real da navegação do
  gestor, menu lateral, espaçamento desktop de 32 px e dados fictícios.
- 1920×1080, 1507×720, 1461×767, 1024×768, 800×1280, 601×900,
  600×900, 390×844 e 360×800: nove larguras aprovadas. Tabela no desktop;
  blocos apenas até 600 px. Nenhuma rolagem horizontal da página ou da tabela;
  todas as células e botões dentro do painel, sem overflow interno.
- Sete ações no primeiro registro, nomes compridos, licenças sem dispositivo,
  múltiplos dispositivos e status ACTIVE/SUSPENDED/REVOKED incluídos.
- Editar abre o diálogo; Escape fecha e devolve foco ao botão; perfil ADMIN
  continua sem ação de excluir cliente. Sem exceções JavaScript no navegador.
- Screenshots desktop/mobile inspecionados visualmente. Evidências brutas,
  fixtures, relatório geométrico e baseline privado em `tmp/c79-license-layout/`.
- `node scripts/test-c11-license-console.mjs`: quatro grupos aprovados.
- `npm run c11:new-device:lock`: aprovado antes do build. Build final também
  executa o lock obrigatório: 22 testes de ativação, 27 de promoção e nove
  controles negativos; `npm run build` aprovado, 513 módulos transformados.
- Revisão React: CSS de apresentação, sem novos hooks, listeners, consultas,
  dependências ou rotas; preservados nomes acessíveis e callbacks.

Os avisos históricos Vite sobre módulos Node externalizados e tamanho de chunks
continuam presentes. Esta conferência não executou operações em contas reais,
não alterou Supabase e não gerou/instalou APK. Sem commit/push/PR. Auditoria
SHA-256 final exige apenas a allowlist deste ciclo e HEAD inalterado.

## Ajustes durante a conferência

Uma tentativa documental com contexto incorreto foi rejeitada sem escrita e
corrigida. Primeiro script privado leu Unicode com encoding padrão do PowerShell,
gerando um seletor incorreto; corrigido para UTF-8. Uma asserção inicial confundiu
os 15 px da scrollbar vertical com overflow; corrigida para comparar scrollWidth
com clientWidth. Os testes finais passaram após ambas as correções. A proporção
das colunas foi refinada após inspeção visual e a validação/build repetidos.

Auditoria final: baseline de 873 arquivos; seis modificados e três adicionados, todos na allowlist; nenhum removido ou não autorizado. HEAD permanece 61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
