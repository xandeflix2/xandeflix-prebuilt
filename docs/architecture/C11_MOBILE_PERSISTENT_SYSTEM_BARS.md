# C11 — barras do sistema disponíveis em celulares e tablets — 2026-10-07

Pedido explícito: barra de status superior e navegação inferior sempre disponíveis
em celular/tablet; no tablet, preservar também a barra de aplicativos do Android.
O escopo inclui navegação, vídeo em tela ampliada e retorno ao app. A barra de
aplicativos pertence ao sistema/launcher: o app deixa de solicitar sua ocultação,
sem modificar preferências globais, launcher ou modo de navegação do usuário.

Preflight read-only: clone independente ativo
`C:\Xandeflix\xandeflix-prebuilt-c11-main`, Git próprio, origin canônico
`https://github.com/xandeflix2/xandeflix-prebuilt.git`, branch main,
HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. AGENTS, Architecture,
Execution, Source Boundary e lock lidos. Dirty anterior preservado por baseline
de hashes no diretório ignorado `tmp/c11-system-bars-20261007`.
CURRENT_GATE=NONE; ciclo local solicitado; NEXT_GATE_STARTED=NAO.
Commit/push/PR e backend não autorizados nem necessários. Atualizações in-place
nos três aparelhos e APK continuam autorizados pelos pedidos anteriores.

## Especificação anterior ao código e allowlist

- MainActivity.java: política única identifica TV pelo uiMode mascarado. Apenas
  TV conserva ocultação imersiva. Celular/tablet mostram systemBars, retiram flags
  de ocultação/fullscreen e usam ícones claros sobre fundo escuro. Reaplicar nos
  callbacks existentes; não alterar orientação, plugins, boot ou ativação.
- bindSafeInsets: aplicar uma única vez systemBars/displayCutout/IME no content
  container e consumir insets para evitar margens adicionais do Capacitor. TV
  mantém padding zero. Recalcular por evento nativo na rotação/teclado/taskbar;
  sem valores fixos por modelo nem polling. Respeitar edge-to-edge no SDK35+.
- PublicTrailerPlugin.java: ajustar apenas a origem dos bounds do overlay em
  relação ao content parent com padding, evitando somar a barra superior duas
  vezes. Sem mudança no player público, URLs ou contratos de vídeo.
- NativePlayerActivity.java: atualizar comentários de política obsoletos; já
  reutiliza a mesma política e bindSafeInsets. Nenhuma mudança no engine/sessão.
- Novo SystemBarsPolicyTest.java: telefone/tablet/TV/night-mode/uiMode composto,
  sem confundir orientação/tamanho com TV.
- Este contrato, evidência correspondente, quatro memórias e relatório geral
  append-only; harnesses ignorados; saídas usuais dist/Android/APK.

Não alterar CSS/layout web, dependências, manifest, storage, identidade, chave,
licença/C9, fonte, catálogo, Cast ou PiP. Manter foco/D-pad do Fire Stick.
PiP e janelas externas continuam sujeitos à gestão de barras pelo Android.

## Aceitação e validação

Lock obrigatório antes/depois/prebuild, suíte Java e build passam. APK standalone
HTTPS, mesmo package/assinatura, assets conferidos. install -r preserva hashes
privados/catálogo/firstInstallTime. Conferir status/nav visíveis no S24 e tablet,
tablet retrato/paisagem e barra de aplicativos conforme configuração existente,
Home/Busca/Live/detalhes/player e retorno; geometria sem sobreposição, trailer
e preview alinhados. Fire conserva política TV. Relatar limitações de testes
físicos honestamente; não forçar configurações globais nem gravar segredos.

A conferência pode fixar temporariamente a rotação do tablet pelo WindowManager,
registrando antes o modo existente e restaurando-o após o teste. Não modificar
configuração de navegação/taskbar, launcher, notificações ou outros aplicativos.

Referência primária: [Android — edge-to-edge e insets](https://developer.android.com/develop/ui/views/layout/edge-to-edge).

## Complemento solicitado durante QA — player preenchendo a tela

O usuário pediu que o player preencha a tela inteira e, na escolha de proporção,
confirmou: “Manter a imagem completa, aceitando faixas pretas”. Preservar portanto
o PlayerView MATCH_PARENT dentro da área útil entre barras/cutout, com FIT.
Não introduzir zoom, corte, distorção ou ocultação das barras recém-solicitadas.
Player ampliado Live e Activity de filmes/episódios já têm MATCH_PARENT e FIT;
conferir a área real sem mudar engine, mídia, autorização ou a allowlist.
O trailer inline permanece no espaço próprio da página, sem ocupar a tela toda.

## Correção explícita do usuário — exceção de vídeo em tela cheia

O usuário esclareceu depois: status/navbar/taskbar não devem aparecer SOMENTE
quando um vídeo estiver sendo reproduzido em tela cheia. Este requisito sucede
as frases anteriores de barras visíveis também no vídeo ampliado. Na navegação,
preview inline, trailer inline e após retornar, barras continuam disponíveis.

Allowlist ampliada apenas para NativeAndroidPlayerPlugin.java: entrada Live
marca a janela como fullscreen; saída/release desfaz essa marca. MainActivity
mantém estado fraco por janela/decor e reutiliza essa marca nos callbacks de
foco/resume, para não reaparecer barra no meio da reprodução. NativePlayerActivity
solicita fullscreen explicitamente através da mesma política. bindSafeInsets
zera padding em fullscreen/TV e volta a reservar barras/cutout/IME na navegação.
SystemBarsPolicyTest acrescenta casos fullscreen/navegação. FIT/MATCH_PARENT
permanecem, sem alterar reprodução, sessão, orientação, C9 ou proporção.

Nova rodada obrigatória: lock/Java/build/APK, update-r recuperável nos três alvos;
S24/tablet Home com barras, Live ampliado e filme fullscreen sem barras/padding,
retorno com barras/taskbar e preview/EPG alinhados; TV preservada. Última versão
substitui APK intermediário7EBC87D9… e o comportamento do item45 do relatório
somente para a exceção fullscreen. Nunca usar a primeira rodada como prova
da nova exceção. Capturar novo baseline antes do patch; memórias append-only.
