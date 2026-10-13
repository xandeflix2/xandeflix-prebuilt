# C74 — Código automático e solicitação de ativação

2026-10-11. Especificação anterior ao código:
[C11_ACTIVATION_HANDOFF_AND_CODE_INPUT](../architecture/C11_ACTIVATION_HANDOFF_AND_CODE_INPUT.md).
Pedidos do usuário: digitar apenas oito caracteres do Código ID; compartilhar
código/chave em mobile/tablet; solicitar ativação pela TV e abrir o formulário
validado ao clicar na mensagem. Ajuste posterior: distinguir os dois ícones.

## Preflight e proveniência

Clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main, main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git; HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Data Boundary e Activation Lock lidos. CURRENT_GATE=NONE, patch direto
autorizado pelos pedidos; NEXT_GATE_STARTED=NAO. Baseline privada de 846 arquivos
sem .env; dirty C11 anterior preservado. Workspace histórico permaneceu read-only.
Sem commit/push/PR, alteração de .env, identidade, chave, fonte real ou catálogo.

## Comportamento entregue

DeviceCodeInput apresenta XF- fixo e separador automático; entrada/paste,
maiúsculas, correção e Backspace mantêm valor canônico e validação final.
Usado nos quatro campos do gestor e na ativação pública, sem gerar identidade.
Primeira ativação PHONE/TABLET usa Share já existente com texto limitado a
código/chave; cancelamento, erro e cópia alternativa têm feedback honesto.
TV respeita escolha manual mesmo com UA Mobile. Nome, plataforma e código de
atendimento opcional são enviados somente ao confirmar. D-pad percorre campos
e botão; esquerda/direita preservam texto e mudam a opção de plataforma.

Cada gestor ativo tem um código de atendimento, que apenas direciona o pedido.
Sem código, o MASTER recebe a solicitação. ADMIN vê pedidos dirigidos a ele ou
de aparelhos sob sua responsabilidade, com bloqueio de ownership alheio;
MASTER vê todos. USER, anônimo e gestor inativo não listam/abrem solicitações.
Sino permanece para erros de reprodução. Solicitações usam tela com +, título
e nome acessível próprios, badge, dialog, leitura por gestor, paginação50 e
polling30s quando visível. Ícones visualmente distintos conferidos em browser.

Ao clicar, o servidor revalida a solicitação, abre aba Ativação com Código ID,
nome e sistema da TV, registra leitura e valida a chave sem devolvê-la. Foco no
nome após montar o formulário. Fonte deve ser informada e ATIVAR confirmado.
Digitação manual continua; alterar código, concluir ou encerrar sessão limpa o
contexto. Solicitação expirada/consumida/chave revogada falha sem liberar fonte.

## Backend e limites de segurança

Migration 20261011221900_c11_activation_handoff aplicada somente ao projeto
cujbmyhitgomlgwfkaat. Três tabelas privadas com RLS e revokes de acesso direto;
helpers definer com search_path vazio e wrappers invoker. Nenhum PIN, hash,
token raw, URL ou configuração de fonte na notificação. Submit pre-auth prova
posse da capability de status A1 existente, exige PENDING e chave ativa/hash
consistente, limita campos, possui idempotência por A1 e rate limit por aparelho.
Não autoriza, consome A1 ou cria fonte. Metadata TV somente na solicitação A1.

Abrir pedido cria receipt de 15min. Edge managed-source-vault-admin versão12
ACTIVE, verify_jwt=true, resolve hash somente server-side por RPC restrita a
service_role, usando gestor obtido de auth.getUser e ignorando managerId do
body. Revalida scope, receipt, pending, código e chave; reutiliza a RPC existente
de ativação com suas políticas de licença/slots/ownership/vault. Hash não sai
na resposta. Baseline remota versão11 comparada com o patch local antes do deploy.
Sem alteração de contas reais ou configuração remota de Auth/env.

Docs/changelog oficiais Supabase consultados; nenhuma mudança aplicável exigiu
alterar o fluxo. Referência de [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
Advisors: três INFO rls_enabled_no_policy nas novas tabelas privadas são
default-deny intencional, sem grants de tabela; helpers restritos são a interface.
Não foi criada policy permissiva para silenciar o aviso. Findings anteriores
fora do escopo preservados.

## Verificação

- C74 JS:7 grupos PASS, funções reais com ports sintéticos: máscara, Share,
  cancelamento/cópia/erro, proof, timeout/abort, respostas inválidas, payload
  manual/handoff, Edge gestor verificado e hash somente servidor, ícones.
- SQL real BEGIN/ROLLBACK PASS: prova forjada, campos inválidos, routing,
  idempotência, isolamento entre ADMINs, MASTER, USER/anônimo/inativo, receipt,
  chave revogada, A1 consumida, ownership posterior, grants/RLS e paginação de
  mais de50 itens com timestamps iguais, sem duplicação/omissão. Consulta após
  rollback:0 instalações e solicitações sintéticas de testes C74.
- Browser real, perfil headless próprio, localhost e cliente isolado: entrada,
  paste, correção/Backspace, validação HTML, Share/cancel/cópia simulados,
  TV com UA Mobile, D-pad ida/volta, plataforma, offline/retry, envio explícito;
  gestor real com ports: lista/paginação, routing, clique abre preenchido,
  nenhum ATIVAR automático, fonte/confirmar, payload sem PIN, stale falha,
  manual preservado, edição/logout limpam contexto. Screenshots privados.
- Regressões: gestor scoped8, relatos14, chave20 e device presentation3 PASS.
  Lock antes/depois22 ativação +27 promoção +9 negativos PASS. Typecheck PASS.
  Build final PASS; warnings anteriores node:fs/path, mixed imports e bundle.

Revisão React: serviços memoizados, estados efêmeros em RAM, efeitos com
cleanup/AbortController/epoch, chamadas limitadas, botão disabled e trava
contra duplo envio, nomes acessíveis/foco, markup condicional de fonte e
nenhuma dependência/refactor fora do escopo. Limite de50 por página confirmado.

Erros corrigidos: imports novos exigiram ports inertes nos harnesses antigos
do gestor/chave, sem relaxar assertions. Loader SSR precisou esModuleInterop;
warning useLayoutEffect é do harness SSR, componente produtivo é client-only.
CDP passou a avaliar condições booleanas para evitar serializar DOM; navegação
do harness não assume main no painel; botão Encerrar sessao usa texto real.
Foco produtivo inicialmente antes do commit foi corrigido com efeito/cleanup
após montagem e revalidado. Read paths inexistentes e quoting de helper local
corrigidos sem alteração de fonte real. Nenhuma rejeição automática de aprovação.

Teste físico de Share Android, teclado/D-pad TV e ativação real de usuário
pendente; browser/ports e SQL não certificam essas operações no aparelho.
Nenhuma instalação ou distribuição realizada neste ciclo.

## Artefato

Java21 assembleDebug PASS; fontes nativas não alteradas neste ciclo.
APK debug tmp/c74-activation-handoff/xandeflix-ativacao-compartilhar.apk,
12.379.300 bytes, SHA256
D084B1D9F41D65020908D95AB944E96AEF5A5F21B3FB3525ABFE41F719AF2F84.
Package com.xandeflix.prebuilt, versionCode13/versionName1.0, minSdk23/target35.
Assinatura v1/v2 válida, mesmo certificado debug SHA256
B235C7117C9660E17CF0732CD6493600A812692AF289E627454988EA096E848D.
Sete arquivos dist comparados byte a byte aos assets/public do APK PASS.
Warnings flatDir/Gradle e META-INF de bibliotecas são anteriores e não
invalidaram o build/verificação da assinatura. Sem instalação/distribuição.
Proveniência contra baseline846: somente allowlist, nenhum arquivo excluído
ou alteração fora do escopo; HEAD inalterado. NEXT_GATE_STARTED=NAO.
