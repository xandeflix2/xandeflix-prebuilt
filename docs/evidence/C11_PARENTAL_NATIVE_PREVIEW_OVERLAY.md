# C134 — preview durante PIN e ativacao por D-pad

2026-10-16. [Spec e emendas anteriores ao codigo](../architecture/C11_PARENTAL_NATIVE_PREVIEW_OVERLAY.md).
Preflight no clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
main/origin esperado, HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d. AGENTS, Architecture/Execution,
Source Boundary e Activation Lock lidos. Baseline1111 arquivos/prefixos e
APK C133 capturados em tmp/c134-parental-preview-overlay. C133 previamente
auditado PASS e preservado. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Sem Git/backend/install/reset. Novos pedidos de D-pad e Voltar incorporados
ao mesmo APK ainda nao entregue, com emendas previas e allowlist explicita.

## Resultado implementado

PlayerView/SurfaceView Android estao acima do WebView; z-index do dialog nao
controla essa composicao. Live agora envia updatePreview com obscured e ID
ativo durante solicitacao de PIN. Oculta somente apresentacao, fecha eventual
fullscreen/painel nativo e conserva ExoPlayer/midia/buffer/conexao existente.
Atalhos nativos e promocao fullscreen ficam indisponiveis enquanto oculto.
Cancelar/PIN valido restauram o mesmo preview; erro mantem oculto. Nenhum
novo canal e autorizado antes do PIN nem e criada conexao antecipada.

Visibilidade e serializada em fila distinta do handoff, que pode esperar o
PIN: verifica ID/montagem/saida, cobre criacao tardia e alternancia rapida.
Native rejeita ID ausente/stale, tipo nao-live e pedidos misturados com URI,
headers/suspendPlayback; nao muda bounds/candidatos/playWhenReady/C9.
Release limpa flag. Back do Live respeita evento consumido e modal aberto:
cancelamento parental nao executa tambem saida da pagina.

Na ativacao, Back externo procurava um hero inexistente e ficava preso;
fallback espacial tambem podia rejeitar acoes desalinhadas. Percurso agora
e escopado a .activation-page, com controles visiveis/habilitados por ordem,
entrada pelo Back/menu, retorno lateral e rolagem de diagnostico focavel.
Ao atingir bordas do diagnostico, cima/baixo passam a acao anterior/seguinte.
TV recebe foco inicial; sem roubo de foco de touch. Prop showBackButton,
default true, omite somente o Back interno quando shell possui historico e
ja oferece seu proprio Voltar. App muda apenas essa prop na rota activation.
Todas as declaracoes anteriores de auth/identidade/chave/source da pagina
foram comparadas por AST e continuam exatas. Nenhuma politica remota muda.

## Verificacao e limites

- C134 preview e ativacao: oito perfis cada PASS, com JSX/hooks reais e portas
  sinteticas; Fire960x540, AndroidTV1280x720, Box960x540, Tizen/webOS1280x720,
  phone390x844, tablet1280x800 e foldable800x880. Zero requests externas.
- Preview: PIN antes de start/acquire; erro/cancelamento preservam midia/C9;
  PIN valido troca no mesmo player; maximo uma conexao. Corrida hide/reveal,
  criacao tardia, fullscreen e unmount cobertos no Fire. Controle negativo
  com Live anterior tem modal aberto e ocultacao false: bug detectado.
- Ativacao: Settings real abre pagina; foco inicial, Back/menu, todas as acoes,
  copia unica de fixture, suporte abre/fecha, rolagem ate bordas, skip disabled/
  hidden, um Voltar no shell e default standalone preservado. Hook anterior
  falha esperado Configuracoes/observado Voltar externo. Capturas inspecionadas.
- Quatorze suites de regressao/novos fluxos PASS: C133 oito perfis novamente,
  C12616, C12811, C129 oito, C114 retorno Live, C112 teclas, C9 wiring, C106
  oito, chave de ativacao20, handoff7 grupos, Fire home/rail e os dois C134.
- Lock antes do patch, antes da extensao de ativacao e prebuild final PASS:
  26 ativacao,27 promocao,9 controles negativos. TypeScript/Vite561 modulos,
  sync Android e Gradle :app:testDebugUnitTest assembleDebug PASS.
- Android203 testes/34 suites, zero falha/erro/skip. Dois novos testes reais
  do plugin verificam flag/ID/media/ExoPlayer intactos e rejeicoes/reset.
  Revisao react-best-practices limitada a efeitos/refs/dependencias primitivas,
  acessibilidade e custo escopado; listeners/cleanup anteriores preservados.

Ocorrencias: teste integrado revelou Escape cancelando PIN e saindo Live no
mesmo evento; guard corrigido antes da rodada final. Harness novo precisou
ports watch-history. C112/C106 antigos faltavam estado novo/autorizacao
parental sintetica; corrigidas somente fixtures, assercoes preservadas.
Fixture do diagnostico inicial tinha oito linhas sem overflow; estado
sintetico completo cobre rolagem real sem mudar expectativa do produto.
Primeiro verificador APK previa apenas um DEX alterado (versao), herdado de
C133; C134 altera tambem o plugin. Inspecao de ambos confirmou somente plugin
e BuildConfig, descontados encoding/offsets/indices resolvidos de pool e
annotations. Nenhum outro codigo foi liberado por essa correcao do verificador.
Avisos antigos Vite/chunk/Node/Gradle flatDir mantidos, sem relaxar criterios.

Navegador simulado/ports e JUnit headless nao certificam composicao fisica
SurfaceView/IME/controle de cada TV. Tizen/webOS sao perfis web simulados,
nao instalacao de APK nesses sistemas. QA fisica Fire Stick pendente de
atualizacao manual; nenhum aparelho foi alterado neste ciclo.

## APK e proveniencia

[Xandeflix-v1.0.23-C134.apk](../../tmp/c134-parental-preview-overlay/Xandeflix-v1.0.23-C134.apk)

11450328 bytes; SHA256 625cae391a3260f290c99c17659488b66ffb9d52d9a61260ed22f5500b365301. Package com.xandeflix.prebuilt,
code23/name1.0.23/min23/target35, mesma assinatura C133, HTTPS local,
logging none e sem dev server. Oito assets dist/dez public verificados,
1412 recursos nativos identicos (incluindo marca metalica/banner/adaptive).
Dez de12DEX identicos; classes9 tem110 classes com unica mudanca semantica
no NativeAndroidPlayerPlugin; classes10 tem4 classes e muda apenas duas
constantes de versao BuildConfig. APK anterior preservado por SHA256.

Auditoria final audit.json:14 existentes permitidos,4 novos,1097 arquivos
anteriores intactos, prefixos das tres memorias append-only e Git/index
inalterados. C133 dialog/regras/segredos/storage, identidade, fonte/catalogo,
sessao C9 e demais nativos mantidos. Nao inicia proximo Gate/publicacao.
