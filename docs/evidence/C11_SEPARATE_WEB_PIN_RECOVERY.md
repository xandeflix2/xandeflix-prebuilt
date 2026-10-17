# C156 — evidencia de PIN web independente e APK — 2026-10-17

Preflight, autorizacao, protocolo, allowlist e criterios anteriores ao codigo
em docs/architecture/C11_SEPARATE_WEB_PIN_RECOVERY.md. Baseline HEAD8d5744e,
clone/main/origin canonicos, projeto Supabase correto confirmado; lock antes
PASS26 ativacao+27 promocao+9 negativos+6 caminhos. Evidencias privadas sem
segredos em tmp/c156-web-pin. Nenhum aparelho/cliente real sera modificado.

Estado inicial: especificacao registrada; implementacao/deploy/APK pendentes.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Implementacao e backend — 2026-10-17

Opcao independente Configuracoes -> PIN web em janela dedicada, montagem
somente ao abrir e limpeza de campos ao sair; entrada publica /app orienta
recuperar no aparelho, nao recebe PUK. Atalho parental de compartilhar PIN
removido. Novo PIN web nao pode ser igual ao parental. PUK local e necessario
no cadastro/redefinicao; nao altera grants, PIN parental, politica ou PUK.
Troca legitima do PUK reencapsula a mesma chave privada e rollback e testado
em falha de persistencia parental. Envelope AES-GCM local e verificado antes
do registro remoto; nao confundir registro corrompido com ausencia.

Chave publica P-256 SPKI no servidor, chave privada PKCS8 cifrada localmente
por chave PBKDF2-SHA256/600000 derivada do PUK. Salt/IV CSPRNG e AAD vinculam
aparelho/chave. PUK e seus verificadores jamais enviados; prova ECDSA vincula
desafio e digest do novo PIN. Challenge60s uso unico, versoes da credencial/
recovery e geracao da chave permanente conferidas no commit atomico; prova
nativa original obrigatoria, token web delegado recusado. PIN remoto/KDF e
login C155 preservados, mudanca revoga web/C9 sem mexer em token/playback nativo.

Migration local20261017221544_c156_separate_web_pin_recovery.sql aplicada pelo
MCP em20261017222123; historia nao reescrita. web-device-access v2 ACTIVE,
verify_jwt=false mantido com autenticacao propria; remoto v1 foi comparado
exatamente ao HEAD anterior antes de substituir. ezbr SHA256
7da28e1b5ff434cdeca7704e59d36538a6145efe4c24fdafa513f70ac3375f9e.
Nenhum cofre/source/delivery, C9, identidade/licenca/ativacao alterado.
Manager SET_PIN agora somente criacao inicial, sem sobrescrever registro.
ENROLL_PIN legado bloqueado na Edge e RPC: nao reusar PIN parental.

SQL real em transacao rollback PASS: ACLs service-only, prova nativa,
registro, nao sobrescrever chave, legacy negado, assinatura falsa/replay,
expiracao/versoes/rotacao, revogacao web/C9 preservando nativo e6o erro3h.
HTTPS real Edge PASS21 verificacoes: cadastro, login, estado sem verificadores,
token web recusado, challenge, PIN adulterado/replay negados, recuperacao
assinada, novo PIN funciona/antigo negado, sessao anterior revogada, prova
nativa preservada, seis PINs errados paralelos e assinatura correta com hora
futura do cliente incapaz de remover bloqueio. Prazo3h confirmado em SQL.
Fixture temporario estritamente sintetico sem URL/cofre/conteudo/auth.users;
manifesto/limpeza antes do seed, todos seus registros removidos e ausencia
confirmada. Nenhum cliente/fonte/licenca/PIN real lido ou alterado.

Advisors: novos privados com RLS/revogacao de grants e sem policies sao
deny-all intencional; RPCs de prova service-only, testes de privilegios PASS.
Avisos preexistentes de funcoes/search_path/auth permanecem fora do escopo;
nao alegar auditoria global limpa. Referencia do achado intencional:
[RLS habilitada sem policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Testes/build e APK

Lock antes e em builds/pre-APK PASS26 ativacao+27 promocao+9 negativos+6
caminhos C153. Typecheck, C12616/16, C15511/11, C15610/10 PASS; C9runtime10/10
e deliveryA-F PASS. C156 usa crypto real e verificacao ECDSA independente
Node, PUK errado/tamper/AAD, novo PIN adulterado, rewrap e rollback reais.
site:build completo PASS (C1517/C1548/C15511/C15610), build Android padrao
com prebuild/lock PASS, cap sync e lock antes de Gradle PASS.
Gradle assembleDebug/testDebugUnitTest PASS205 testes/35 suites, zero falhas.
Chrome isolado com componentes React reais/servico sintetico PASS: opcao
separada,3 campos mascarados, submit limpa campos, fechar desmonta segredos,
Escape restaura foco. Screenshot conferido; nao e teste fisico de TV/tablet.

APK 1.0.31/code31, 11393851 bytes,
package com.xandeflix.prebuilt, arquivo tmp/c156-web-pin/Xandeflix-v1.0.31-C156.apk.
SHA256 a7012e334e87ec2eac56715b7ae89fef523e9548cd4a9db01f8b7f83b3b8deee.
Certificado SHA256 b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d, igual ao C149.
8 assets dist conferidos dentro do APK;1412 recursos nativos identicos ao
C149; HTTPS standalone, sem devserver/player/cofre web. Nova opcao PIN web
e recovery presentes; cards horizontais, fontes AndroidTV, guia/foco Live,
janelas e startup consolidados preservados. C149 original intocado.
Nenhuma instalacao/uninstall/reset efetuado; homologacao fisica pendente.

## Erros encontrados e corrigidos

Harness C156 manteve timers parentais com relogio sintetico parado apos os
asserts; processo proprio encerrado e testes corrigidos para fechar stores,
sem alterar runtime/assercoes. Uma leitura de log ainda aberto falhou; nova
saida independente foi usada. C155 esperava ENROLL_PIN nativo200; esse fluxo
foi explicitamente retirado pelo pedido C156. Antes de editar o teste, spec
foi ampliada: manter negativas e substitui-la por ENROLL legado403 mais
controle positivo DEVICE_STATE nativo e negativas web em todos os endpoints.
Demais asserts preservados; site:build final PASS. UI fixture Vite alias de
sufixo gerou caminho Windows invalido; regex da string inteira corrigida,
sem mudar producao, UI final PASS. Leituras prematuras de logs inexistentes
nao indicaram falha funcional. Nenhum segredo foi impresso/persistido.

## Operacao e limites

Instalar o APK como atualizacao, sem desinstalar/apagar dados. Com PUK local
ja guardado: Configuracoes -> PIN web -> PUK + novo PIN web diferente do
parental + confirmacao. Se o painel ja criou PIN web, informar tambem esse
PIN atual uma vez para vincular a recuperacao. Quem esqueceu um PIN C155
antes de cadastrar recovery nao possui recuperacao retroativa por PUK;
nao fazer reset administrativo que contorne essa garantia. Depois de
preparado, recuperar/redefinir no mesmo aparelho exige PUK e novo PIN.
Troca local do PUK mantem recuperacao com o novo PUK. Sem PUK/envelope local,
nao prometer recuperacao nem resetar dados silenciosamente.

Usar /app com codigo/chave existentes e PIN web. Nenhum PIN web libera
conteudo restrito automaticamente. Fonte/catalogo/playback reais nao
homologados neste ciclo; entrega nao requer contato com fonte real.
Publicacao frontend/Git ainda pendente deste registro; backend ja ativo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Auditoria e publicacao concluidas — 2026-10-17

Auditoria PASS: baseline1217,1198 hashes preservados,19 arquivos existentes
alterados (incluindo remocao do antigo WebPinEnrollment)+9 novos estritamente
allowlisted;3 memorias append-only; source/vault/delivery/catalogo/search/
player/Java/native/AGENTS/package-lock intactos; Gradle somente30->31;
nenhuma dependencia nova, diff --check PASS, sem literais privados conhecidos
ou padroes de segredo no codigo/docs/assets publicos. APK C149 preservado.

28 arquivos staged exatos, blobs/commit/remocao conferidos, commit funcional
33febc619a09ea08f2f9a60617b9d06a36459b6f enviado a origin/main sem force/PR,
arvore limpa e remoto/HEAD iguais. GitHub Vercel status success do projeto:
https://vercel.com/xandeflix2/xandeflix-prebuilt-nm3x/J5UVT8PSrFLqp8NkRUuP84MEN7UJ
Sem operar equipe antiga; integracao Git existente tambem dispara projeto
irmao da equipe2, sem configuracao externa alterada pelo agente.

HTTP real PASS nos origins xandeflix.vercel.app e
xandeflix-prebuilt-nm3x.vercel.app: / e /admin200 painel, /app e /app/200
consumidor separado,4 assets de entrada por origin200/MIME correto,
DENY/nosniff, /.env.local e /api/control-plane/state404. Mesmo HTML /app
SHA25698b2afe2b69affe2b367cde6794669e9c6e4c3c3cbf1593ae0494eb9e8b415ba.
Chrome publico isolado confirma3 campos obrigatorios e mascarados, storage
e IndexedDB vazios antes de login e nenhuma identidade/ativacao nova.
Chrome local confirma namespaces reais Storage/IDB preservando gestor.
Instrucao de recuperar PIN no aparelho presente; nenhum campo PUK no login.
Logs privados/runtime/drains Vercel continuam inacessiveis nesta conexao;
nao foi repetida tentativa sem permissao nem declarado scan limpo.

APK pronto para atualizacao manual in-place nos dispositivos, sem apagar
dados/PUK/ativacao. Fluxo para usuario sem PIN web: PUK + novo PIN diferente
do parental + confirmacao. Cadastro remoto existente exige PIN web atual
uma vez para preparar recovery. Depois disso, recuperacao exige PUK no
aparelho preparado. Atualizacao do aplicativo nao cadastra/recupera PINs de
clientes automaticamente. Nenhum dispositivo real foi instalado ou testado.
Fechamento documental posterior nao modifica os bundles/APK ja verificados.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
