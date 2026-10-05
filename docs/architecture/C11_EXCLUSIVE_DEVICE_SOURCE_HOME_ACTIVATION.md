# C11 — Fonte exclusiva por dispositivo e acesso mobile à Ativação

## Autorização e especificação anterior ao código — 2026-10-05

Pedido do usuário: permitir nova URL M3U para um dispositivo já autorizado sem
editar a fonte compartilhada; recuperar o acesso à Ativação somente no canto
direito do cabeçalho da Home do celular, nunca no rodapé.
CURRENT_GATE=NONE; checkpoint local autorizado; NEXT_GATE_STARTED=NAO.
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO.
Preflight C11/toplevel C11, origin xandeflix2/xandeflix-prebuilt, main,
HEAD 995de5f767a14276bc2f4ca58944e4f7af95ca4e; tracked/index limpos;
sete arquivos operacionais não rastreados preservados. Contratos relidos.

## Fluxo e invariantes

- Clientes → Inspecionar → dispositivo → Trocar fonte exclusiva.
- Campo novo e vazio URL da fonte M3U/M3U8; confirmação explícita do aparelho.
- Gestor autenticado; revalidar cliente, licença MANAGED ativa/não expirada,
  aparelho autorizado e vínculo remoto imediatamente antes da operação.
- Criar outro sourceId no vault existente e comutar somente o deviceId escolhido.
  Nunca editar/desabilitar/excluir a fonte anterior, desvincular aparelhos,
  alterar licença, PIN, token, código ou registro de ativação.
- Usar operações remotas existentes, sem fallback local, migrations ou deploy.
  Inspeção read-only confirma require_active_manager e UPDATE do único binding
  na RPC de switch. Create + switch são duas operações, NÃO transação única.
- Só confirmar sucesso após leitura remota verificar o novo vínculo. Em falha
  após criação, reusar o sourceId em memória ao tentar novamente, sem duplicar
  criação nem conservar/reexibir a URL. Falha ambígua na criação exige nova
  inspeção, não repetição automática. Sessão/concorrência externa continuam
  submetidas à autoridade existente; nenhuma nova garantia atômica é afirmada.
- URL sensível só no input transitório e request autenticado para vault; nenhum
  log, persistência browser, fixture, evidência ou Git contém credencial real.
- Home mobile: botão ícone de chave à direita, acessível por nome; navega à
  Ativação existente. Oculto em páginas internas e layouts tablet/Fire/desktop.
  Rodapé permanece quatro ícones; Home sem Voltar/Início; altura 64px preservada.

## Allowlist estrita

- src/ui/components/Header.tsx
- src/index.css
- src/debug/manager/AdminCustomersView.tsx
- src/debug/manager/ManagerPanelPage.tsx
- src/debug/manager/ExclusiveDeviceSourceForm.tsx
- src/debug/manager/exclusive-device-source.ts
- scripts/test-c11-exclusive-device-source.mjs
- scripts/exclusive-device-source-fixture.html
- scripts/exclusive-device-source-fixture.tsx
- scripts/verify-c11-exclusive-device-source.mjs
- este documento; docs/evidence/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md
- docs/STATUS.md; docs/ERRORS_AND_BLOCKERS.md; docs/EVOLUTION_REPORT.md
- artefatos gerados ignorados: dist, android build/assets e APK standalone;
  tmp para backup recuperável e capturas/testes somente sintéticos.

## Aceitação / validação

Lock canônico antes/depois/prebuild; typecheck; testes isolados de sucesso,
recusa de autoridade/target stale, falhas em create/switch/refresh, retry sem
nova fonte e bloqueio de duplo clique. Regressões dos dois fluxos de ativação.
Browser com componentes reais e fixtures/mocks sem rede externa: header phone
320/390, internas sem chave extra, footer quatro; tablet/Fire sem alteração;
form novo, confirmação, erros e sucesso vinculando apenas dispositivo escolhido.
Build local e APK sem instalação/reset. Painel local NÃO significa publicação
remota; trocar fonte real depende de URL exclusiva e confirmação no painel.
HTTP403 do provedor não é declarado corrigido sem teste real de reprodução.

## Emenda de entrega física — somente celular — 2026-10-05

Usuário solicitou instalar somente no celular e confirmou Depuração USB ativa.
Alvo confirmado em preflight ADB: Samsung SM-S926B, characteristics=phone,
serial RXGYB03FL4W. Package com.xandeflix.prebuilt já instalado. Fire Stick
192.168.3.103:5555/AFTSSS está conectado, mas explicitamente FORA do escopo;
tablet também excluído. CURRENT_GATE=NONE; nenhum próximo Gate/Git autorizado.

Permite apenas install -r do APK8751706bytes/SHA256
8463607357B9042ACC95FF5037D2747CFEDA98C1899998D90AED17B0225FC6EB,
mesmo package/assinatura, sem rebuild, uninstall, clear, reset ou mudança de fonte.
Antes: lock canônico obrigatório e hashes privados em memória, sem revelar
conteúdo de identidade/chave/ativação/instalação/token ou catálogo. Depois:
confirmar sucesso do instalador, hash do APK instalado e preservação dos dados
antes de qualquer abertura manual do app. Nenhum teste de mídia/alteração remota.
Allowlist de documentos: esta emenda, evidência deste ciclo, STATUS e EVOLUTION;
ERRORS somente para falha detectada. Nenhum arquivo runtime modificado.
