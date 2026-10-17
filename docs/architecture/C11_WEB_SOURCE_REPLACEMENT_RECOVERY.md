# C137 - diagnostico de troca de fonte no navegador - 2026-10-17

## Pedido, preflight e proveniencia

Usuario relata que a fonte de teste de tres horas do navegador PC expirou e
que substituir por fonte ativa no painel nao restabeleceu o sinal. Investigar
a primeira fronteira quebrada, preservando carregamento/busca dos demais
dispositivos e a identidade/ativacao do navegador. Relato nao confirma o
binding remoto, a importacao local nem a compatibilidade da nova fonte.

Clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, origin esperado
https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Preflight read-only e contratos
AGENTS/Architecture/Execution/Source Data Boundary/Activation Lock lidos.
Auditoria anterior C136 PASS: 1128 arquivos baseline, 15 existentes alterados,
18 novos, 1113 preservados; APK anterior preservado. Nova baseline privada
em tmp/c137-web-source-replacement/baseline.json antes desta especificacao.
CURRENT_GATE=NONE; ciclo local de diagnostico autorizado pelo pedido atual;
NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset autorizados neste ciclo.

## Especificacao anterior a qualquer alteracao funcional

- Examinar resolucao autorizada, entrega segura, comparacao sourceId/versao,
  staging/promocao, agendamento e contexto de playback. Distinguir expiracao
  da conta no provedor de expiracao da licenca do aplicativo.
- Usar testes existentes com dados sinteticos para verificar troca de versao,
  atualizacao manual e bloqueios de seguranca; nenhum acesso a fonte comercial
  por shell nem exportacao de configuracao/credenciais do navegador.
- Solicitar pelo painel local Fonte e catalogo a identidade/versao em uso e
  vinculada e o resultado da atualizacao manual. Nenhuma URL, senha ou token.
- CUA nao disponibilizou apps/browsers nesta sessao. Nao afirmar observacao
  direta do dispositivo nem contornar indisponibilidade de acesso remoto.
- Nenhuma mudanca de producao baseada apenas em hipotese. Se defeito local
  for demonstrado, registrar antes a extensao minima de allowlist e criterios,
  executar lock obrigatorio antes/depois quando aplicavel e testar regressao.
- Nao limpar storage, rotacionar identidade, reativar ou liberar fonte antiga
  em caso de divergencia. Nenhuma alteracao de Supabase, proxy, licenca ou
  politica de seguranca. Nenhum build/APK necessario ao diagnostico read-only.

## Allowlist inicial estrita e aceitacao

Este documento, docs/evidence/C11_WEB_SOURCE_REPLACEMENT_RECOVERY.md,
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md (append-only), arquivos
privados ignorados tmp/c137-web-source-replacement e saidas sinteticas usuais
dos testes existentes. Arquivos de producao e testes versionados preservados.

Concluir diagnostico somente com fronteira sustentada por evidencia ou
registrar claramente a dependencia do diagnostico local pendente. Testes
sinteticos nao comprovam o vinculo/sinal real deste navegador. Nenhum fix
especulativo nem declaracao de sinal restabelecido sem verificacao real.
