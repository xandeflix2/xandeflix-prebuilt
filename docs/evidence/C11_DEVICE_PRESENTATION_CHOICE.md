# C72 — Configuracoes e tipo de dispositivo

2026-10-11. Spec previa: architecture/C11_DEVICE_PRESENTATION_CHOICE.md.
Clone C11 main, HEAD61ec009 preservado, sem Git ou backend writes.

## Resultado

- Android sem preferencia: escolha obrigatoria Celular/Tablet/TV antes de
  montar App e antes de identidade/Codigo ID/chave. Detector inicial retorna
  PHONE/TABLET/TV conforme escolha e registro continua no fluxo canonico.
- Configuracoes e pagina interna propria, com tipo de dispositivo e acesso
  a dados da ativacao; acessivel no menu lateral, inferior e ativacao.
- Escolha persistida v1 com read-back; TV vence UA Mobile e usa menu lateral,
  hero horizontal, detalhes amplos e live amplo. Mobile/tablet conservam UI
  responsiva. Mudanca em runtime nao remonta App, nao troca ID/chave/ativacao.
- Seletor captura foco, D-pad/Tab e Voltar nativo; erro de persistencia permite
  retry sem mostrar codigo nem iniciar App. Recuperacao Manager independente.
- Tipos de dispositivos JA registrados remotamente nao foram reescritos.
  Este patch ajusta UI existente e classificacao inicial de novas instalacoes.
- Templates/cache/parental/perfis sao extensoes futuras, nao implementados.

## Verificacao

- Lock prepatch e prebuild final PASS:22 ativacao +27 promocao +9 negativos.
- Testes C72:3 grupos PASS (persistencia/3 tipos/detector real, dados invalidos,
  storage negado/escrita perdida, subscriptions e precedencia antes do App).
- Navegacao:18 casos anteriores +3 overrides +hook real cleanup PASS.
- HomeHero regressao PASS; PlaybackErrorNotice11 PASS; C71 recovery15 PASS.
- Browser real headless, perfil isolado, UA Android Mobile enganosa, viewport
  960x540: dialog antes da geracao, D-pad quatro sentidos, persistencia negada
  e retry, identidade real de teste TV, hero horizontal, menu lateral PASS.
- Configuracoes: mudanca TV->Tablet->Celular sem remount nem troca de codigo
  ou chave; Cancel/Voltar nativo e foco restaurado; reload conserva escolha;
  celular390x844 sem overflow. Screenshots privados revisados visualmente.
- Apenas fixture local; nenhuma Auth/source/chamada backend real ou aparelho
  manipulado. Validacao fisica Mi Stick permanece pendente do titular.
- Checklist React: hooks incondicionais, snapshot primitivo, store cacheado,
  listeners/timeouts com cleanup, botoes semanticos, dialog aria-modal e foco.
- Typecheck/build final PASS: index-B4jd9yIe.js, avisos existentes de chunks.
- cap copy android +Gradle Java21 assembleDebug PASS. Package
  com.xandeflix.prebuilt, versionCode13,1.0, minSDK23/target35.
- Assinatura APK PASS;7 arquivos dist identicos byte a byte no APK. Artefato
  privado tmp/c72-device-presentation/xandeflix-configuracoes-dispositivo.apk.
  Sem instalacao em dispositivos, distribuicao remota ou novo Gate.

## Erros de execucao corrigidos

Node strip-only recusou parameter-property de teste: campo explicito resolve.
Harness antigo de navegacao nao fornecia novos imports; port preserva18 casos
e adiciona overrides. Build encontrou import React nao usado: removido.
Fixture browser inicialmente reutilizou perfil e leu Unicode pelo encoding
default PowerShell; preparador NodeUTF8/perfil novo resolve. Focus test usava
click sintetico sem focus: helper modela foco real e casos continuam completos.
Comando PowerShell de instrumentacao com escaping errado nao executou; usado
arquivo Node em vez de interpolacao. aapt com Select-First retornou exit1 ao
fechar pipe; captura integral anterior ao filtro confirmou metadata e exit0.
Um arquivo placeholder foi criado por engano em C:/Xandflx, fora do clone,
e removido via apply_patch; diretório vazio permaneceu. Revisao automatica
recusou a tentativa de remover esse diretorio (blocked by policy, sem motivo
adicional); nao insistir nem solicitar elevacao. Nenhum arquivo externo fica
alterado. Proveniencia final privada compara baseline824 e allowlist C72.
