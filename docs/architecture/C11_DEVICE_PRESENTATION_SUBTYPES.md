# C11 — seleção de dispositivo em duas etapas

## Autorização e preflight — 2026-10-15

Pedido do usuário: manter três grupos na primeira tela e permitir escolher
o dispositivo dentro de Celular e TV; Tablet permanece escolha direta.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C110_DEVICE_PRESENTATION_SUBTYPES;
NEXT_GATE_STARTED=NAO. Ciclo local de UI, sem commit/push/PR, backend,
instalação em dispositivos, reset de dados ou entrega de APK autorizados.
Clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, main, HEAD
0f68f169f7728fae17c8311832b7643629e97a02, origin canônico verificados.
Baseline: 50 caminhos dirty conhecidos C107–C109 e registro do levantamento.
AGENTS, Architecture, Execution e Activation Lock lidos. Lock prévio PASS:
26 ativação, 27 promoção, 9 controles negativos. Nenhum Gate formal iniciado.

## Comportamento aprovado antes do código

- Primeira etapa: Celular, Tablet, TV / Android TV (três cartões).
- Celular: Celular e Celular dobrável. TV: Fire TV / Fire Stick,
  Android TV / Google TV, TV Box com Android, Samsung Tizen, LG webOS.
- Tablet conclui diretamente. Entrar num grupo não grava preferência nem
  monta App/ativação numa instalação nova; somente a escolha final conclui.
- Voltar na segunda etapa retorna ao grupo sem gravar; na primeira etapa
  obrigatória não permite ultrapassar a seleção. Configurações permite
  cancelar sem mudar a preferência e mostra o nome específico salvo.
- Toque, teclado, D-pad, Enter/Espaço e Back mantêm foco dentro do diálogo;
  troca de etapa foca uma opção válida e retorno restaura o grupo de origem.
- Manter os tipos canônicos PHONE/TABLET/TV e a chave versionada v1. Acrescentar
  apenas o modelo visual opcional, validado conforme o tipo, com persistência
  verificada. Preferência v1 antiga continua válida sem nova exigência.
- Preferência específica deve atualizar a UI também entre dois modelos TV,
  sem remount da aplicação, alterar identidade ou apagar o catálogo.
- Fire específico aplica os ajustes visuais/hero Fire existentes, respeitando
  a escolha explícita; preferências antigas mantêm fallback por user agent.
- Dobrável mantém PHONE como base e a adaptação consolidada por proporção/
  toque/tamanho: não forçar layout quadrado na tela externa estreita.
- Android TV/Google TV/Box/Tizen/webOS compartilham o perfil TV existente.
  Modelo visual não altera plataforma real, player, source, licença, ativação,
  cadastro no gestor, nem certifica APK instalável em Tizen/webOS.

## Allowlist estrita

- src/ui/device-presentation.ts e hooks/useDevicePresentation.ts.
- src/ui/components/DevicePresentationGate.tsx e .css.
- src/ui/components/AppShell.tsx, Hero.tsx e HomeHero.tsx: identificação Fire
  consistente com a preferência, sem alterar regras de mídia/hero.
- src/ui/pages/SettingsPage.tsx: nome do subtipo visual salvo.
- scripts/test-c110-device-presentation-subtypes.mjs: integração real React/
  navegador isolado, persistência, legado, Back/foco e falhas de storage.
- scripts/test-c11-device-presentation.mjs: substituir somente a asserção
  textual obsoleta do nome do hook por verificação da composição atual.
- scripts/test-c106-hero-artwork-tap.mjs e test-c11-home-hero.mjs:
  fornecer import real de apresentação nas fixtures se necessário; completar
  stubs de apresentação das logos C107 ausentes no loader SSR antigo, sem
  remover asserções (logos têm suíte C107 própria).
- Este contrato, docs/evidence/C11_DEVICE_PRESENTATION_SUBTYPES.md,
  docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md.
- tmp/c110-device-presentation para evidências privadas/sintéticas.

## Aceitação

Primeira instalação bloqueia App até a escolha final; três grupos, oito
modelos finais, voltar/cancelar sem efeitos, preferência sobrevive reload.
Mudança Fire→outro TV atualiza perfil mantendo tipo TV; formatos dobráveis
continuam automáticos. Legado e persistência negada/perdida não geram falso
sucesso. Testes existentes relevantes, novo teste de fluxo, typecheck/build
e lock antes/depois PASS. Sem afirmar teste físico nem suporte nativo novo.
