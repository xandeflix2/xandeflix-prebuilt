# C11 — Evidência de fonte exclusiva por aparelho e chave na Home mobile

## Escopo / proveniência — 2026-10-05

Implementação local solicitada pelo usuário, após especificação na
[allowlist](../architecture/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md).
C11/main/995de5f; tracked inicialmente limpos, sete arquivos operacionais locais
intactos; nenhum commit/push/PR/deploy ou alteração no projeto original.
Consolidação/publicação continua retida pela integração automática desconhecida.

Home do celular: botão de chave no canto direito do cabeçalho, somente Home,
44x44px com nome acessível. Altura 64px; sem Voltar/Início na Home. Rodapé
permanece quatro ícones. Tablet, Fire/TV e desktop não recebem esse botão extra.
Navegação abre a Ativação existente, sem modificar sua lógica ou dados.

Clientes → Inspecionar → dispositivo autorizado/MANAGED → Trocar fonte exclusiva:
form com URL nova vazia, nome e confirmação específica do aparelho. Validação
remota antes da criação/comutação e depois; create no vault + switch do único
binding; nenhum update/delete/desabilitar da fonte compartilhada, nova ativação,
mudança de licença ou fallback local. Retry de switch conserva apenas sourceId
e sourceId anterior em memória, limpa a URL e não recria fonte. Create sem
confirmação exige inspeção manual da aba Fontes, não retry automático.
Aviso orienta credenciais próprias do usuário: novo sourceId com credenciais
iguais não remove restrições de reprodução do provedor.

## Backend / skills / limitações

Skill Supabase orientou reutilizar o vault e a sessão autenticada existentes,
sem chave privilegiada no client. Revisão Postgres confirmou em leitura as
funções read_control_plane_metadata, bind/switch_device_source_metadata:
require_active_manager; switch atualiza somente o id do binding selecionado.
DTO da leitura pode retornar expiresAtIso=null para licença sem prazo: consumidor
novo aceita null/undefined e rejeita vencimento inválido/expirado; teste dedicado.
Não alterar contratos legados ou migrar schema por essa diferença de tipagem.
Changelog/documentação de autenticação consultados; nenhum upgrade de biblioteca.

Create + switch não são uma única transação e a RPC existente não recebe expected
old source. Preflight e retry detectam vínculo externo divergente observado, mas
não garantem CAS contra alterações concorrentes feitas por outro gestor.
Não houve chamada mutante remota, teste de URL/provedor, decriptação de configuração,
leitura de PIN/token real, alteração de banco, cliente ou fonte. Troca real requer
URL exclusiva e confirmação no painel; HTTP403 externo não declarado resolvido.
Painel alterado no código local, NÃO publicado na hospedagem; o APK não expõe LAB.

Revisão React: inicialização única do workflow por target/key, guard síncrono de
duplo clique, inputs rotulados, confirmação/busy/feedback acessíveis, metadados
separados dos segredos, leituras independentes em Promise.all e nenhum listener
ou persistência adicional. Skills de browser verificaram UI real com mocks.

## Resultados observados

- Lock canônico PASS antes/depois e nos dois prebuilds:49 casos +9 controles
  negativos; nenhuma remoção/relaxamento do lock ou alteração de testes existentes.
- Novo teste exclusivo:31 PASS, incluindo isolamento de fonte/identidade/licença,
  cliente/licença/dispositivo inválidos, expiry JSON null, confirmação, falhas em
  create/switch/refresh, resposta ambígua, retry sem URL, vínculo concorrente e
  duplo clique. Somente mocks, sem backend real.
- Dois fluxos antigos de ativação do gestor:20/20 PASS.
- Layout/policy e hook real resize/orientation/cleanup:18 casos PASS.
- Avisos reais de playback / lifecycle da UI:11 PASS.
- Typecheck PASS; build final414 módulos PASS; crypto NÃO externalizado.
  Avisos preexistentes node:fs/path de provisioning, imports mistos e chunk grande
  continuam. Cap sync PASS; Gradle assembleDebug PASS,142 tarefas,2m22s.
- Browser Header/AppShell/CSS reais:44 verificações PASS (phone320/390, altura,
  posição/sem overflow, footer4, acesso à rota activation, internas sem chave,
  detalhes e layouts1024x768/960x540/1440x900/800x1280 sem botão extra).
- AdminCustomers/form/workflow reais com autoridade sintética: página/form
  renderizam; erro de switch sem falso sucesso; URL limpa; retry cria uma única
  fonte; binding do segundo aparelho e versão/fonte anterior preservados; sucesso
  somente após confirmação remota mock. Console/overlays sem erro.
- Nova execução manager-only após compatibilidade null/copy final também PASS.
  Capturas somente sintéticas em tmp/c11-exclusive-ui-phone.png e manager.png.
  Nenhum teste físico/instalação/reset de dispositivo neste ciclo.

## Falhas encontradas / auditabilidade

Suite legada R2F2B0 manager-form:14/15 PASS. T15 exige literal
“Teste disponivel no dispositivo”, já AUSENTE no HEAD995de5f e worktree; a parte
no fetch/managerTestConnection continua PASS. Diff do ManagerPanel é apenas duas
props. Falha textual preexistente registrada, não corrigida/ocultada fora do
escopo nem classificada como regressão deste patch. Não afirmar todas as suites
do repositório verdes. Requer manutenção separada do teste/contrato de copy.

Auxiliares: quoting PowerShell para JS/CSS path/wildcard precisou correção,
sem efeitos no produto ou exposição de segredo. Repetição browser em sessão
reiniciada dentro de spawnSync teve timeout do harness, inclusive com stdout
JSON success no open; cleanup inicialmente mascarava o erro primário. Harness
passou a registrar erro primário e aceitar sessão previamente aberta pelo
terminal; timeout45s, sem waits>60s. CUA não tinha browser disponível. Sessão
CLI nova pré-aberta permitiu reexecução final PASS e foi fechada. Falhas antigas
não convertidas em sucesso; nova evidência válida identificada explicitamente.

## Preservação / APK

Auditoria405 arquivos da baseline consolidada:400 byte-idênticos; diferenças
apenas Header, index.css, AdminCustomers, duas props ManagerPanel e APK atual.
Arquivos novos estão na allowlist. Identidade, Ativação, boot, player, importer,
source authority, config Capacitor/Android e sete operacionais preservados.

APK raiz Xandeflix-v1.0.0-standalone.apk:8751706 bytes;
SHA256 8463607357B9042ACC95FF5037D2747CFEDA98C1899998D90AED17B0225FC6EB.
Package com.xandeflix.prebuilt; version1/1.0; min23/target35; assinatura debug
SHA256 b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
apksigner verify PASS (avisos de metadata META-INF não coberta persistem);
assets principais no ZIP byte-idênticos ao dist final.711 entradas antes/depois,
somente quatro nomes de bundles web substituídos; nenhum recurso nativo removido.
LAB ausente antes/depois no JS; novo main+232bytes pelo atalho do Header.
Tamanho do ZIP não é contrato de equivalência ou medida de startup.

Backup recuperável do APK anterior, cópia verificada por hash, permanece em
tmp/c11-before-exclusive-source-home-activation.apk:9062069bytes;
SHA256 EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F.
APK root copiado com hash verificado somente após testes e assinatura.
Não instalado nem distribuído ao usuário remoto; ativação/catálogo existentes
nos aparelhos não foram tocados. Fire<=60s/beta>100 continuam fora do escopo.

## Entrega física posterior — somente celular — 2026-10-05

Este registro sucede o ciclo de implementação acima, que não instalou APK.
Usuário pediu somente celular e confirmou Depuração USB. Preflight: C11 é o
toplevel, origin xandeflix2/xandeflix-prebuilt, main/HEAD995de5f, index vazio;
dirty conhecido da implementação anterior preservado. CURRENT_GATE=NONE,
Git/backend/publicação/novo Gate não autorizados. Emenda da spec antes do install.

Alvo identificado por getprop: Samsung SM-S926B, characteristics=phone,
serial RXGYB03FL4W. Fire Stick192.168.3.103:5555/AFTSSS também conectado, mas
explicitamente excluído; tablet excluído. Todos os comandos de mutação usaram
-s do celular. Package com.xandeflix.prebuilt já instalado, run-as disponível.

Lock canônico novamente PASS nesta entrega:49 casos+9 controles negativos.
APK8751706bytes/SHA256
8463607357B9042ACC95FF5037D2747CFEDA98C1899998D90AED17B0225FC6EB
conferido antes do único install -r. Resultado: Performing Streamed Install /
Success, exit0. SHA256 do base.apk instalado idêntico ao APK entregue.
versionCode1/versionName1.0/min23/target35; user0 firstInstallTime preservado
2026-10-03 23:16:39, lastUpdateTime passou a2026-10-05 18:24:03.

Preservação verificada antes de qualquer abertura manual: cinco arquivos de
identidade/chave/ativação/instalação/token e508 arquivos do catálogo idênticos
por SHA256 antes/depois, zero diferenças ou mudanças no conjunto de caminhos.
Hashes privados mantidos somente em memória, sem conteúdo real em relatório.
Nenhum uninstall, clear, reset, force-stop adicional, launch automático, mídia,
troca de fonte ou leitura de PIN/token em claro. Fire Stick/tablet não atualizados.
Nenhuma nova mudança de runtime/build/cap sync/Gradle/Git/backend neste ciclo;
somente registros documentais da allowlist. APK raiz e backup anterior preservados.

Falha auxiliar inicial: comando composto de hash não passou a validação de
formato, CATALOG_HASH_FORMAT_FAILED, antes do install. Causa específica de
quoting/truncagem não estabelecida. Inventário explícito e hashes diretos em
lotes de64 corrigiram a coleta read-only e permitiram comparação completa.
Não confundir essa falha auxiliar com falha de instalação ou perda de catálogo.

INSTALLED_PHONE_ONLY=PASS; INSTALLED_APK_HASH_MATCH=PASS;
PHONE_PRIVATE_FILES_PRESERVED=5/5; PHONE_CATALOG_FILES_PRESERVED=508/508;
TABLET_FIRE_INSTALL=NAO; PHONE_VISUAL_ACCEPTANCE=PENDING_USER;
REMOTE_SOURCE_CHANGE=NAO; HTTP403_RESOLVED=NOT_CONFIRMED;
MANAGER_HOSTING_PUBLICATION=NAO; NEXT_GATE_STARTED=NAO.
