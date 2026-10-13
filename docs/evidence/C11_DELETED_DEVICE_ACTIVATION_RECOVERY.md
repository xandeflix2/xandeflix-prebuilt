# C89 — Exclusão e nova solicitação de ativação

Contrato prévio: [C11_DELETED_DEVICE_ACTIVATION_RECOVERY](../architecture/C11_DELETED_DEVICE_ACTIVATION_RECOVERY.md).
Workspace independente/main/origin esperado; HEAD inicial e final
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. Sem Git, deploy, migração,
APK, instalação ou reset físico. Baseline privado: 917 arquivos; dirty anterior
preservado, alterações deste ciclo verificadas por allowlist/hash.

## Evidência somente leitura do aparelho informado

Projeto Supabase cujbmyhitgomlgwfkaat: XF-6GV6-ZDFV ausente em devices,
device_activation_requests e vault de chave. Auditoria de exclusão manual
2026-10-12T04:15:04Z (01:15:04 em São Paulo). Instalação OBSERVED novamente
em 2026-10-12T16:20:24Z (13:20:24 em São Paulo), com first_seen igual ao
last_seen observado. É um novo reporte de descoberta após a exclusão; não
prova solicitação, chave cadastrada, autorização ou versão exata do APK.
appVersion 2.0.0/buildNumber 1 são constantes do reporte atual e não foram
usados como evidência da versão física.

O SQL canônico retorna ACTIVATION_NOT_FOUND ao consultar uma solicitação
apagada ou iniciar validação sem solicitação. O cliente interrompia todo
success=false, preservando a referência antiga sem refazer o registro. O
Manager não tinha mensagem específica para ACTIVATION_NOT_FOUND. Estado
privado do aparelho não foi lido; a aplicação desse defeito ao APK físico
permanece hipótese compatível com os dados, não conclusão instrumentada.

## Alteração e verificações

- Recuperação apenas para ACTIVATION_NOT_FOUND explícito; fluxo existente de
  reporte → nova solicitação → registro cifrado, sem mudar identidade/chave.
  Rede/capability desconhecidas e estado local AUTHORIZED continuam intactos.
- Mensagem do Manager orienta abrir aplicativo conectado e atualizar versão
  antiga se persistir, em vez da recusa genérica. Revogação continua distinta.
- Ativação: 26 testes aprovados, incluindo quatro novos grupos: exclusão e
  concorrência com mesma identidade/chave/token/instalação; falha de reporte
  ou nova solicitação preservando capability antiga; erro de capability/rede
  desconhecido sem recriação; falha no registro da chave com retry da nova
  solicitação. Nenhuma autorização automática.
- Teste específico de mensagens sanitizadas aprovado; testes anteriores de
  salvamento atômico/Edge/cabeçalho: três grupos aprovados.
- SQL em BEGIN/ROLLBACK no projeto autorizado, fixtures aleatórias: exclusão
  real via RPC MASTER, status e START ausentes, novo reporte/solicitação/chave,
  capability nova, capability antiga e chave incorreta recusadas, START/claim
  corretos aceitos, identidade/token preservados, nenhum device/licença/fonte
  restaurado pelo registro, revogação não contornada. Marcador
  C89_DELETION_NEW_REQUEST_SAME_IDENTITY_VALIDATION_NO_AUTO_AUTH_REVOCATION_PASS.
  Pós-consulta: zero fixtures persistidas; aparelho e solicitação reais seguem
  ausentes. Nenhum usuário real foi recriado como teste.
- Navegador desktop 1507x900 e mobile 390x844: módulos reais de identidade,
  registro, parsing da resposta Edge e mensagens, com respostas simuladas.
  Após exclusão, mensagem específica visível; após novo registro, validação
  possível; mesma identidade/chave, somente duas solicitações/registrations
  no ciclo e nenhuma autorização. Captura mobile inspecionada visualmente.
- Typecheck e build Manager com VITE_DEBUG_BUILD=true aprovados. Prebuild
  obrigatório: 9 controles negativos, 26 casos de ativação, 27 casos de
  promoção e marcador C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1=PASS.

O primeiro build detectou corretamente marcador histórico de 22 testes no
lock, apesar de a suíte ampliada passar 26. Emenda prévia autorizou exigir o
novo total exato, sem retirar testes/negativos/hook; build completo posterior
aprovado. Harness privado inicial tinha seletor de modal herdado; corrigido
para fixture e rerun desktop/mobile aprovado, sem alteração de produto.

## Limites de entrega

Patch local e compilação web; nenhum APK novo ou atualização física feita.
A versão antiga instalada não recebe correção de cliente por atualizar apenas
o painel. Nova solicitação e ativação física dependem do aplicativo compatível
no aparelho e da conclusão pelo gestor, incluindo cadastro/vínculo da fonte.
Não recuperar registros removidos sem essa ativação; exclusão não é suspensão.
Artefatos privados: tmp/c89-deleted-device-activation-recovery/.
