# C72 — Escolha local da interface Mobile ou TV

2026-10-11, pedido explicito: Mi Stick classificado como celular; usuario
escolhe Celular ou tablet / TV para receber a interface correta.
CURRENT_GATE=NONE, ciclo local autorizado; sem Git, backend ou proximo Gate.
Preflight C11 clone main, origin xandeflix2/xandeflix-prebuilt, HEAD61ec009;
AGENTS, Architecture, Execution, Source Boundary e Activation Lock lidos.
Dirty existente preservado; baseline privada tmp/c72-device-presentation.

## Escopo anterior ao codigo

- Primeira abertura Android sem preferencia mostra seletor acessivel por
  controle remoto e toque antes da UI do aplicativo. Atualizacoes instaladas
  sem preferencia tambem recebem a escolha uma vez. Browser conserva auto.
- Preferencia versionada local, validada e persistida com confirmacao de
  escrita; falha de storage informa erro e permite retry, sem falso sucesso.
- TV prevalece sobre UA/mobile/touch/viewport: menu lateral, artwork horizontal,
  detalhes amplos e live TV. Mobile conserva distincao responsiva celular/tablet.
- Opcao Tipo de tela em navegacao e ativacao permite corrigir escolha sem
  recriar App, identidade, Codigo ID, chave, licenca, catalogo ou fonte.
- Preferencia visual NAO e autoridade de ativacao, dispositivo, licenca ou
  perfil Manager. Nao mudar classificacao registrada de dispositivos antigos.
- Rotas publicas de recuperacao do Manager permanecem independentes.
- Dialog captura foco e D-pad, restaura foco ao fechar; nao deixar cursor ir
  ao aplicativo atras do seletor. Controles exibem foco neon existente.
- Sem Android/player, Supabase, catalogo, instalacao remota ou nova API.

Allowlist: este contrato; docs/evidence/C11_DEVICE_PRESENTATION_CHOICE.md;
src/ui/device-presentation.ts; src/ui/hooks/useDevicePresentation.ts;
src/ui/components/DevicePresentationGate.tsx; DevicePresentationGate.css;
src/main.tsx; src/ui/components/Header.tsx, AppShell.tsx, HomeHero.tsx;
src/ui/pages/ActivationPage.tsx; src/ui/hooks/usePhoneLayout.ts,
useLandscapeNavigation.ts, useLivePresentation.ts; src/ui/playback-support-profile.ts;
scripts/test-c11-device-presentation.mjs; docs/STATUS.md, DECISIONS.md,
ERRORS_AND_BLOCKERS.md, EVOLUTION_REPORT.md (append-only);
tmp/c72-device-presentation e saidas usuais dist/tsconfig.tsbuildinfo.

Aceite: UA Android Mobile enganosa + escolhaTV usa layoutTV, escolhaMobile
conserva celular/tablet; persistencia apos reiniciar, dados invalidos/storage
negado, mudanca em runtime, controle em todas as direcoes e foco isolado,
browser sem backend real, lock antes/depois, typecheck/build PASS.
Validacao fisica Mi Stick depende do aparelho e nao e presumida por screenshot.

## Refinamento explicito do titular antes do codigo

Tres escolhas: Celular (PHONE), Tablet (TABLET), TV (TV). Obrigatorio Android
ANTES de montar App/boot e antes de Codigo ID/chave. detectDefaultDeviceType
usa escolha validada no primeiro registro, preservando geracao/persistencia
canonica de identidade e chave. Tipo enviado ao sistema deriva dessa escolha,
sem transformar classificacao em autorizacao. Preferencia controla UI tanto
em aparelhos novos quanto antigos; nao reescrever IDs/chaves nem registros
remotos existentes para mudar classificacao. Correcao de registro remoto
antigo, se necessaria, requer fluxo administrativo existente e nao SQL direto.
Supersede somente as frases anteriores de duas escolhas/identidade visual.
Allowlist adicional src/device/device-identity.service.ts (somente detector
inicial). Testar que PHONE/TABLET/TV chegam ao detector sem mudar identidade.

Refinamento: usuario pede opcao Configuracoes no menu para corrigir tipo apos
instalacao. O mesmo seletor abre nesse item, atualiza imediatamente o layout,
persiste escolha, preserva identidade/chave/ativacao/catalogo. Acesso tambem
na ativacao ainda sem catalogo. Nao executar troca de autorizacao nem source.

Refinamento final: Configuracoes e pagina interna propria no aplicativo,
route settings, navegacao/voltar normais. Implementar agora somente tipo de
dispositivo e link aos dados existentes de ativacao. Estrutura de secoes pode
receber templates, cache, parental e perfis em ciclos futuros; nao implementar
tais funcoes antecipadamente, nem oferecer controles falsamente funcionais.
Allowlist adicional src/App.tsx (rota/entrada independente de catalogo e
autorizacao), src/ui/navigation/route-state.ts (settings),
src/ui/pages/SettingsPage.tsx e SettingsPage.css. Botao na ativacao navega para
esta pagina por callback opcional; seletor inicial continua anterior ao App.

Allowlist de validacao: scripts/test-c11-landscape-navigation.mjs (port de
imports novos no harness, preservando18 casos e adicionando overrides).
Entrega concreta inclui APK debug para verificacao remota, sem instalar em
aparelhos ou mudar codigo Android; permitir somente saidas usuais de cap copy
android assets/public e capacitor.config.json, build/apk e copia privada tmp.
