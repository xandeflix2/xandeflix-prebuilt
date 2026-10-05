# C11 — Evidência de visibilidade da chave permanente

## Escopo e proveniência — 2026-10-05

Usuário aprovou a correção e atualização apenas do celular, preservando os dados.
[Spec anterior ao código](../architecture/C11_ACTIVATION_KEY_VISIBILITY.md).
Workspace/toplevel C11, origin xandeflix2/xandeflix-prebuilt, main/HEAD995de5f,
index vazio, dirty anterior conhecido preservado. Contratos integralmente lidos.
CURRENT_GATE=NONE; sem autorização Git/backend/novo Gate. Nenhuma alteração nos
workspaces protegidos ou no package original com.xandeflix.app.

## Causa e correção

Chave/cópia estavam dentro de effectiveStatus!==AUTHORIZED; efeito de carga da
chave já era comum. Hash do arquivo da chave no celular idêntico ao pré-update;
logs recentes sem erro correspondente, nenhum segredo lido em claro. Condição
presente no HEAD, não provocada pelo atalho recém-adicionado à Home.

Somente ActivationPage muda no código existente: cartão comum com a mesma chave,
estados loading/erro, um único Copiar chave e feedback local separado. Formulário
de ativação continua condicional. Instrução A1 indica "exibidos nesta tela".
Nenhum efeito, handler de autorização, fonte, identidade, hashing, geração,
persistência, rotação, licença, boot, playback, navegação ou CSS foi modificado.

## Validações concluídas

- Lock antes/depois/prebuild/entrega:49 casos+9 controles negativos PASS.
- Novo teste18 PASS: JSX real autorizado MANAGED/SELF_SERVICE, pendente e não
  registrado; loading/erro com copy disabled; transição/re-render/remount com a
  mesma chave sintética fornecida; autorização remota divergente continua fail
  closed; callback real de clipboard sucesso/rejeição/ausência; feedback A1 não
  alterado. Comparação AST com HEAD confirma todos os efeitos/handlers/status
  inalterados. Renderer do HEAD reproduz ausência da chave autorizada.
- Fixtures desativam efeitos e substituem serviços; não constituem nova prova
  física de geração/reativação. Essas invariantes continuam cobertas pelo lock.
- Regressões existentes:11 playback e31 fonte exclusiva PASS; typecheck PASS.
- Skills agent-browser/agent-browser-verify/verification orientaram fixture real
  JSX/callbacks → clipboard mock → feedback, sem env/credenciais/rede externa.
  Página não vazia/sem overlay/sem erros; copy sucesso/rejeição; mesma chave na
  transição pendente→AUTHORIZED/SELF_SERVICE; nenhuma chamada externa.
- Chave/cópia únicas e dentro do viewport320x844/390x844/1024x768/960x540. Capturas
  exclusivamente sintéticas em tmp/c11-key-visibility-authorized-phone.png e
  pending-phone.png (nome da segunda não é prova de viewport phone). Captura
  autorizada390x844 inspecionada visualmente; browser/servidor próprios encerrados.
- Primeiro build:414 módulos/tsc/Vite PASS, crypto não externalizado; cap sync PASS;
  assembleDebug PASS13s/142 tarefas. Assinatura/package min23/target35 corretos;
  655 entradas nativas não-web/não-META-INF idênticas ao APK anterior; cinco
  arquivos dist idênticos aos assets embarcados.
- Auditoria405 runtime antes da substituição do APK:404 byte-idênticos e apenas
  ActivationPage diferente. Alterações anteriores preservadas, sem relaxar testes.

## Falhas auxiliares preservadas

Harness inicial CommonJS rejeitou import.meta; primeira substituição apenas
import.meta.env não cobria o cast TypeScript, repetindo a falha. Fixture passou
a substituir import.meta por env vazio, sem ler .env ou mudar produção;18 PASS.
Eval inicial de browser perdeu aspas via PowerShell (ReferenceError: vite), sem
erro de página. Base64 corrigiu quoting; comparação posterior de string acentuada
produziu PENDING_BROWSER_UI_FAILED por UTF8 decodificado como Latin1 via atob.
TextDecoder UTF8 resolveu a avaliação; nova evidência confirmou pending/AUTHORIZED
com a mesma chave/zero erros. Sem ocultar falhas nem alterar critérios para aceitá-las.
Avisos preexistentes node:fs/path de provisioning, imports mistos/chunk grande,
flatDir e metadata META-INF não protegida persistem; nenhum erro crypto novo.

## Entrega física inicial e revisão final

APK intermediário8787228bytes/SHA256
947E4D7ADDF8D40E6B8FEDED3AB1317FD5C1BE410E7537136F9D7C951CB76DFE
instalado somente no Samsung SM-S926B/RXGYB03FL4W por install -r/Success. Hash do
APK instalado correto; cinco arquivos privados e508 arquivos do catálogo
idênticos antes/depois. firstInstallTime user0 permaneceu2026-10-03 23:16:39;
lastUpdateTime2026-10-05 18:53:45. Sem launch/clear/uninstall/reset/outro aparelho.

Revisão final encontrou instrução A1 ainda dizendo "chave abaixo"; correção somente
desse texto com nova execução18 PASS/prebuild. Build final/entrega final em curso;
não considerar APK intermediário a entrega final até o registro abaixo ser fechado.
Backup anterior preservado em tmp/c11-before-authorized-key-visibility.apk,
8751706bytes/SHA2568463607357B9042ACC95FF5037D2747CFEDA98C1899998D90AED17B0225FC6EB.
Nenhum segredo/conteúdo real ou hash privado consta deste relatório.

## Entrega final fechada — 2026-10-05

Após o único ajuste de instrução, testes18 e lock49+9 novamente PASS, incluindo
prebuild e execução final antes da entrega; tsc/Vite414 módulos PASS12,38s,
crypto não externalizado, cap sync PASS e assembleDebug PASS12s/142 tarefas.
Native655/655 e dist5/5 novamente byte-idênticos; assinatura e package conferidos.
Teste browser verificou a apresentação/cópia antes do ajuste exclusivo da frase
A1; JSX autorizado/callbacks não mudaram após essa verificação. Teste final do
renderer real executado novamente com o texto final, sem leitura de ambiente real.

APK final na raiz Xandeflix-v1.0.0-standalone.apk:8785127bytes;
SHA256 F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8.
Assinatura debug SHA256
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d;
com.xandeflix.prebuilt/versionCode1/versionName1.0/min23/target35.
Backup8751706bytes anterior à tarefa preservado e verificado, sem deleções.

Segunda instalação in-place somente no mesmo celular: install -r/Success/exit0,
hash do base.apk instalado idêntico ao APK final. Baseline privada/catalogo
recoletada imediatamente antes desta atualização: cinco privados e508 arquivos
de catálogo idênticos depois, zero diferenças/conjunto de caminhos preservado.
firstInstallTime user0 inalterado2026-10-03 23:16:39;
lastUpdateTime final2026-10-05 18:59:15. Nenhuma abertura automática, screenshot
real de segredo, mídia, reset ou write remoto. Fire Stick/tablet NÃO atualizados.

Auditoria final405 arquivos de runtime:403 preservados byte a byte; somente
ActivationPage e APK final diferentes da baseline pré-tarefa. Código anterior
de fonte exclusiva/atalho Home, core de ativação, Android e sete operacionais
mantidos. Documentos/teste novos exclusivamente na allowlist; nenhum Git/novo Gate.

UI_FIX=PASS; TESTS=18_PASS; NEW_DEVICE_LOCK=49+9_PASS;
PHONE_UPDATE_ONLY=PASS; INSTALLED_FINAL_APK_HASH=PASS;
PRIVATE_FILES_PRESERVED=5/5; CATALOG_FILES_PRESERVED=508/508;
PHONE_VISUAL_ACCEPTANCE=PENDING_USER; TABLET_FIRE_INSTALL=NAO;
GIT_BACKEND_DEPLOY=NAO; NEXT_GATE_STARTED=NAO.
