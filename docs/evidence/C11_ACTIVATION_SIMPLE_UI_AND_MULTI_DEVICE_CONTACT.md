# C11 — ativação simples e WhatsApp master — evidência 2026-10-07

Preflight read-only: workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, .git próprio, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, originhttps://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS, Architecture, Execution, Source Data Boundary e lock lidos. Baseline679 e dirty anterior preservados. CURRENT_GATE=NONE; ciclo local por pedido direto; NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados nem executados. Histórico e projeto original não editados.

Especificação: [contrato deste ciclo](../architecture/C11_ACTIVATION_SIMPLE_UI_AND_MULTI_DEVICE_CONTACT.md).

## Apresentação entregue

| Área | Comportamento atual |
|---|---|
| Código do dispositivo | Código existente e status legível. Autorizado só após a decisão efetiva já existente; pendência usa Aguardando autorização/ativação. |
| Chave permanente do dispositivo | A mesma chave persistente antes/depois da ativação, com Copiar chave e confirmação/erro. |
| Uma licença em vários dispositivos | Pergunta abaixo dos dois campos, botão Falar pelo WhatsApp quando configurado. Sem número publicado, informa que o gestor ainda não o cadastrou. |
| Informações para suporte | Começa fechado a cada abertura da página; clique/Enter/D-pad abre e segundo clique fecha. Diagnóstico e operações técnicas anteriores ficam dentro. |
| Copiar diagnóstico | Copia a lista sanitizada de estados para a área de transferência; usuário pode encaminhar ao gestor. Nenhuma mensagem é enviada automaticamente. |

R7B e enums técnicos foram removidos da apresentação inicial. Recovery, A1,
revalidação de entrega, importação e desvinculação permanecem no painel recolhido.
Não há formulários legados ou dados internos visíveis antes da expansão.
No modo individual, configurar fonte permanece acessível no painel de suporte.
Cabeçalho e controles móveis se ajustam a320px; não há overflow horizontal.
Foco visual existente é preservado; suporte usa aria-expanded/controls e botão
48px. Regras antigas TV de compactação30px foram sobrepostas apenas para os
novos controles de suporte/contato desta página.

## Preservação da ativação e privacidade

Comparação AST com a versão local anterior:51 declarações/efeitos/handlers
existentes preservados. Somente o setter do contato legado, sem apresentação
atual, foi removido. A1, polling, identidade, geração/persistência da chave,
preflight efetivo, licença, delivery, importação e boot não foram alterados.
Lock canônico antes, depois/no prebuild final: invariantes e9 negativos,
22 casos de ativação e27 casos de promoção PASS. Testes do lock não editados.

Cópia usa allowlist própria: código legível do dispositivo, estado de ativação,
modo, estado da persistência local, resultados de autorização/preflight,
presença booleana de token, sourceId opaco validado, versão/protocolo e contagens.
Estados não reconhecidos viram UNKNOWN. Não serializa objeto de estado, DOM,
mensagem remota livre, chave permanente, token, credencial, URL, envelope ou
payload. Transportes/erros livres permanecem fora da cópia. Chave só é copiada
pelo seu botão específico. Clipboard moderno e fallback local de textarea/
execCommand com remoção, restauração de foco/scroll e mensagem de falha.

## WhatsApp e painel gestor

Painel gestor existente > Sistema > WhatsApp para múltiplos dispositivos.
Entrar como master, preencher número com DDI/DDD e salvar. Aceita formatação
com +, espaços, parênteses e hífen, normalizada em8–15 dígitos sem zero inicial.
Vazio remove o contato. Gravação só é confirmada após resposta remota válida.
Erros não reexibem mensagens internas. Logout/troca de sessão remonta o formulário
e cancela consultas pendentes. Usuário ADMIN/comum não recebe formulário editável.

Contato é global deste plano de controle: chave multi_device_whatsapp separada
das três support_contact_* legadas. Nenhum número de exemplo é usado como
fallback. No momento desta entrega, **nenhum WhatsApp foi informado**; o master
deve cadastrá-lo. O link é somente https://wa.me/<número validado>, aberto por
ação do usuário. A consulta pública é independente da autorização/source,
cancelável, limitada a8s e com retry de contato/online/reabertura. Não bloqueia
a apresentação de código/chave nem a primeira instalação offline.

Migração20261007134743_c11_multi_device_whatsapp_contact.sql criada pelo CLI
Supabase2.120.0 e aplicada somente em cujbmyhitgomlgwfkaat. Três wrappers
SECURITY INVOKER no public e três helpers em activation_contact_private não
exposto. search_path vazio, PUBLIC execute revogado, grants mínimos. Helpers
manager sempre chamam private.require_master_manager existente, exigindo
auth.uid não nulo e OWNER ACTIVE. Nenhum novo grant no private existente,
nem SELECT/UPDATE direto de control_plane_settings; RLS existente permanece.
Leitura pública retorna só success/whatsapp, por finalidade explícita anterior
à ativação. Nenhuma fonte/licença/dispositivo é lido ou alterado por esse recurso.

Servidor:12 cenários funcionais e verificações de ACL/RLS/invoker em transação
ROLLBACK: master grava/lê/remove; entrada inválida não grava; ADMIN, comum,
sem sessão e anon bloqueados; anon não escreve helper nem lê a tabela.
Número sintético reservado não permaneceu no banco. HTTP com publishable/anon
configurada: leitura pública PASS; escrita anônima/tabela bloqueadas;
schema privado406 confirma que não é exposto pela API. Security advisors:
nenhum finding relacionado às novas funções/schema (5 avisos em outros
objetos, fora deste escopo). Perfil master reutiliza a regra canônica já existente.

## Validação da interface e aparelhos

Typecheck, Vite, Cap sync, Gradle testDebugUnitTest/assembleDebug: PASS.
UI/callback reais em fixture isolada:20 casos; serviço/timeout/cancelamento/
privacidade:9 casos PASS. Navegador320×568,390×844,800×1280,1280×720:
ordem, estados, expansão por teclado, cópia segura, alvo48px, sem overflow,
sem requisição externa ou erro. Formulário gestor e serviço reais com RPC
sintético: salvar válido, inválido sem request, remover, ADMIN/logout, erro
sanitizado e retry PASS. Capturas sintéticas inspecionadas visualmente.

APK final nos três aparelhos: código/chave presentes, status Autorizado,
contato ainda não cadastrado, diagnóstico fechado, expansão/fechamento,
diagnóstico sem chave/URL e confirmação real de clipboard PASS. Fire também
abriu pelo KEYCODE_DPAD_CENTER. Somente resultados booleanos/medidas foram
registrados; nenhum código/chave/token real nem captura desses campos.
S24 bloqueado pausou WebView e expirou consultas em uma rodada intermediária;
desbloqueio e abertura nova verificaram a autoridade sem relaxar as regras.

APK final: SHA-256 08FCDFFB9DEBEAFB445B9520E4E52903F09923BAD9A5C05B519ED6BFEAB517F0; 12400179 bytes. Bundle dist/assets/index-DTghpENe.js; CSS index-BWDAqMH6.css. com.xandeflix.prebuilt, certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d, versionCode1/versionName1.0/min23/target35, standalone HTTPS sem server.url. Assets6 verificados byte a byte; Java124/124 sem falhas.

| Alvo | Arquivos privados antes/depois | Catálogo | Estado nativo | Update-r / firstInstallTime / APK |
|---|---:|---:|---:|---|
| AFTSSS | 468/468 | 436 | 5 | Preservado / preservado / idêntico |
| SM-X610 | 538/538 | 505 | 5 | Preservado / preservado / idêntico |
| SM-S926B | 549/549 | 508 | 5 | Preservado / preservado / idêntico |

APK atual substitui E19DC533 e o intermediário61385150 deste ciclo.
Instalação-r não limpou dados, identidade, catálogo, preferências, WebView ou
firstInstallTime. Atualização de outros aparelhos: usar
[APK final](../../Xandeflix-v1.0.0-standalone.apk) com a mesma assinatura.

## Limites da evidência

Instalação limpa física não executada nos aparelhos do usuário, para preservar
dados; estado novo/offline coberto pelo lock e pela UI sintética. Não certifica
todas as versões Android/TV ou o atendimento real via WhatsApp. Site remoto do
gestor não foi publicado: código/build atual contém o formulário e backend está
ativo; uma instalação web que ainda use bundle anterior precisa receber este
build por seu processo de publicação. Git/push/deploy de site não foram feitos.
Não houve alteração de source/playback, novo proxy nem transporte de vídeo.

Baseline/allowlist e prefixos das quatro memórias/relatório serão auditados ao
final. Artefatos privados de QA em tmp/c11-activation-ux-20261007, ignorado.
