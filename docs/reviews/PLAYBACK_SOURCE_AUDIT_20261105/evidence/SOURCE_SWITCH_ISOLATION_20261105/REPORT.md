# Correção de isolamento de fonte — 1.0.53 — 05/11/2026

Resultado técnico: código de isolamento implementado, testes e build aprovados, migração do tablet/Fire concluída; **reprodução parcialmente validada, HTTP403 de conteúdos ainda pendente**. Não homologado para distribuição geral. Não confundir correção de caches com resolução do acesso a toda a mídia do provedor.

## Local de trabalho e preservação

Único workspace de implementação: `C:/Xandeflix/Audits/SOURCE_SWITCH_ISOLATION_20261105/workspace`, main, HEADd8a74102124fbb8a3f013f6fd8a502519c1db4b8, originhttps://github.com/xandeflix2/xandeflix-prebuilt.git. Git independente legítimo, sem worktree compartilhada, alternates ou hardlinks. Não limpar seu dirty histórico governado.

Fonte reproduzida prospectivamente em SOURCE_MANIFEST.json:1581 arquivos; dependências físicas6760, incluindo saídas Android antigas já presentes. Essa contagem não é manifesto puramente de código. A preparação, regras, allowlist e decisões precedentes estão em PREPARATION_SPEC.md, SPEC.md, BEFORE.json e PREPARATION_RESULT.json. Root C11 e IDE lab foram preservados; a linha NextEpisode/G3/P2.50 não recebeu edição.

## Correção

Novo lifecycle source-replacement exige verificação remota da fonte e autorização comercial antes de preparar limpeza/importação. Mudança de fonte/versão/protocolo ou baseline legado sem comprovação cria novo namespace opaco, bloqueia UI antiga, fecha player pelo fluxo existente, reinicia runtime, limpa metadata e três bancos de apresentação conhecidos, força importação integral e vincula readiness ao snapshot exato promovido. Falhas impedem exposição do catálogo anterior. Importação seguinte normal da mesma fonte mantém comportamento idempotente. Histórico/favoritos permanecem fisicamente no namespace anterior e não são automaticamente associados a outra fonte por igualdade de IDs. Artwork nativo usa chave de escopo sem alterar a URL de rede.

Limites: sourceVersion é geração lógica do Control Plane; configuração alterada sob o mesmo ID/protocolo precisa de atualização legítima de versão no provisionamento. Não derivar versão remota de senha/hash de playlist. Snapshots anteriores permanecem transacionais durante substituição; não afirmar exclusão física geral nesse fluxo. A limpeza física adicional solicitada posteriormente no tablet está em pasta própria.

Player, NativePlayerActivity, PlayerControls, sessão C9, progresso/avanço automático existentes e contratos de mídia não foram substituídos. Nenhum bypass de licença, PIN, certificado, auth ou rede. Dependências/versões não foram instaladas ou atualizadas.

## Governança e validação

Allowlist fechada em SPEC.md. Recibos aditivos CANON-01-SOURCE-SWITCH-ISOLATION e CANON-01-SOURCE-SWITCH-ISOLATION-CACHE-REVIEW, com revisão formal do runner e cadeia supersedes. Proveniência é autorização expressa do usuário nesta sessão; campo de schema não equivale a adjudicação independente. Não reescrever recibos históricos nem afirmar autenticidade retroativa de concessões antigas com ressalvas.

Baseline original: canônico/C11 e204 controles/42 suítes PASS. Final após revisão de cache: TypeScript, C11, canônico,9 testes de isolamento,10 do coordenador,4 de UI/wiring/cache Java e regressão204 controles/45 suítes PASS. As42 suítes originais foram mantidas e3 acrescentadas; expectativa estrita de autorizações preservada, concessão sintética ANDROID-38 continua no fim. Tests de wiring não equivalem a testes físicos de todos os casos A→B→A.

Fixture de new-content já falhava na fonte original por portas ausentes; evidência preservada e harness atualizado minimamente, sem remover negativos. Duas fixtures artwork passaram a usar o escopo real. Verificador/schema/package/lockfile/workflow/AGENTS não foram editados. Gradle offline:259 testes em40 suítes,0 falhas/erros/skips. Java standalone de escopo é teste separado, sem inflar contagem JUnit. Evidências finais: CACHE_REVIEW_VALIDATIONS.json, REVIEW_* e BUILD_RESULTS.json.

Build com seleção em RAM somente de configuração pública, sem copiar .env real. Vite, Capacitor sync e Gradle offline concluídos; C11 e canônico passaram após build. Avisos de imports/chunks/depreciação não foram suprimidos. APK_AUDIT.json conferiu12 assets byte a byte, pacote, versão, assinatura, permissões e ausência de padrões privilegiados; essa busca não é garantia universal de ausência de segredos.

Artefato: Xandeflix-v1.0.53-Source-Isolation-20261105.apk,21056416 bytes, SHA256d849a27e0106006b324ea86b320909b455b11c92c774967b1189b3f8900e1caa, certificado debug SHA256b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.

PRESERVATION_POST_BUILD.json retém a primeira classificação incompleta/exit1; não foi apagado. PRESERVATION_GENERATED_OUTPUT_REVIEW.json documenta depois cada mudança gerada:8 assets anteriores substituídos pelo build/sync e28 outputs Android em dependências copiadas regenerados por tarefas Gradle identificadas. Origem1581/1581, Git original41/41, dependências originais6760/6760 e Git próprio30/30 preservados;6732 entradas de dependência do candidato preservadas,0 divergências injustificadas após classificação.

## Aparelhos e pendências reais

Tablet RX2X301Q3KY e Fire USB G071CQ070344374G receberam atualização inplace52→53, com identidade/chave/instalação/licença/fonte preservadas e catálogo ACTIVE. Reinício subsequente da mesma fonte manteve epoch/snapshot em ambos sem importação nova. Evidências TABLET_UPGRADE.json/FIRE_UPGRADE.json e *_SAME_SOURCE_RESTART.json. Celular adiado expressamente pelo usuário, sem atualização.

Auditoria posterior e limpeza explícita do tablet estão em ../HTTP_TRANSPORT_RECOVERY_20261105 e ../TABLET_SOURCE_CLEANUP_20261105. Filme no tablet com primeiro quadro/avanço; séries e filme do Fire ainda tiveram403. Não declarar todos os aparelhos/conteúdos funcionais. A limpeza manual criou epoch novo contra o planejado e o matcher pessoal foi insuficiente; resultado parcial preservado nessa pasta. A conta e a referência do episódio foram reconferidas com a fonte atual, sem reaproveitar URL antiga. O provedor/CDN recusa algumas mídias; motivo específico de política/arquivo/permissão não foi comprovado.

Sem commit/push/PR, backend administrativo, rotação de identidade, reset completo, instalação de dependências, novo gate NextEpisode ou homologação geral. Instalação de teste e build foram autorizados dentro da recuperação atual; isso não autoriza publicar o APK como versão de produção.
