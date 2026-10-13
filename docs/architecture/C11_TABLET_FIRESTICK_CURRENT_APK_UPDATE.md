# C11 — Atualização do tablet e Fire Stick com APK atual — 2026-10-05

## Autorização, proveniência e escopo

Pedido explícito: "instale a versao atualizada no tablet e no firestick".
Alvos conectados e identificados: Samsung SM-X610 USB/API36 e Amazon AFTSSS
Wi-Fi/API28 em 192.168.3.103:5555. Seriais fixos mantidos em memória, utilizados
em todos os comandos. O novo SM-T561 não está conectado; nenhum outro alvo.
Atualização in-place somente de com.xandeflix.prebuilt, preservando dados.

Preflight: workspace/top-level C11, Git próprio local, branch main,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, origin canônico. AGENTS,
Architecture/Execution Contracts e lock de ativação integralmente relidos.
Dirty inicial conhecido: três memórias documentais da instalação SM-T561,
dois registros novos desse ciclo e sete operacionais locais preservados.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Nenhum conflito de proveniência.
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO.

## Artefato e restrições

APK existente mais recente: Xandeflix-v1.0.0-standalone.apk, 8.785.127bytes,
SHA256F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8.
Package canônico, versionCode1/versionName1.0, minSDK23/target35; os dois alvos
satisfazem o SDK mínimo. Assinatura verificada, certificado debug canônico
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Cinco assets web devem corresponder ao dist atual. Arquivos Cordova vazios
gerados pelo Capacitor são verificados separadamente, não confundidos com dist.
Config standalone exige androidScheme=https e ausência de server.url.

Não modificar código/testes/dependências/Android/APK, rebuildar, alterar backend,
trocar fonte/licença, restaurar dados de outro dispositivo ou operar projeto
histórico/protegido. Proibidos uninstall, pm clear, downgrade, root e grants
amplos. Não iniciar aplicativo automaticamente nem medir/homologar playback.

## Allowlist e procedimento

Documentos locais: este plano, docs/evidence/C11_TABLET_FIRESTICK_CURRENT_APK_UPDATE.md,
docs/STATUS.md, docs/EVOLUTION_REPORT.md e docs/ERRORS_AND_BLOCKERS.md.
Cache npm transitório somente em tmp/c11-tablet-firestick-update-20261005/,
ignorado; fingerprints privados somente em memória, nunca conteúdo de chaves,
tokens ou URLs de fonte. Sete operacionais e APK original devem ficar intactos.

1. Repetir lock oficial antes de entregar APK; exigir49 testes e9 controles
   negativos PASS. Falha bloqueia instalação, sem relaxar critérios.
2. Reconferir APK/config/assets, alvo/modelo/API/package antes de cada entrega.
3. Parar somente o package autorizado para congelar gravações durante a
   atualização; comparar em RAM cinco arquivos privados e árvore files/prebuilt
   antes/depois. Ausência, erro de leitura ou mudança não são PASS.
4. Tablet primeiro, Fire Stick segundo, sempre adb -s <alvo fixo> install -r.
   Exigir Success/exit0; incompatibilidade não autoriza apagar dados.
5. Confirmar SHA256 do base.apk instalado, package/versão, firstInstallTime
   original preservado e igualdade dos fingerprints privados/catálogo.
6. Registrar fatos/limites, conferir arquivos locais preservados e nenhuma
   publicação Git. Abertura e validação visual/playback permanecem com usuário.

## Observação anterior distinta da entrega

Usuário relatou RPC_FAILED/RPC no SM-T561 após instalar e informou que a
sincronização iniciou ao ligar internet. Compatível com hipótese de conectividade,
sem causa técnica comprovada nem conclusão do catálogo/playback. Não modificar
ativação nem reinstalar aquele aparelho a partir deste relato.
