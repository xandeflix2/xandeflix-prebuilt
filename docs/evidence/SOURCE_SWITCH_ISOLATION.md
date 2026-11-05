# CANON-01-SOURCE-SWITCH-ISOLATION — evidência de escopo

Implementação isolada solicitada expressamente pelo usuário em 05/11/2026: conferir a fonte no boot e reconstruir seus metadados quando houver troca, preservando identidade/licença. Proveniência em AUTHORIZATION_CAPTURE.json externo; não é adjudicação independente do executor nem aprovação retroativa de recibos antigos. SPEC.md e adendos antecedem os respectivos patches.

Ciclo PREPARED/CLEANED/ACTIVE e epoch por ativação; recarga única após encerramento pelos mecanismos normais C9; staging completo sem checkpoint anterior; revalidação de autoridade antes de promoção; catálogo antigo fisicamente preservado para integridade transacional, sem uso sob fonte diferente. Histórico/favoritos e cache nativo de imagem usam namespaces separados. Não altera NativePlayerActivity, PlayerControls, fluxo de próximo episódio, identidade, PIN, licença ou backend.

Testes novos: 8 cenários de isolamento, 9 de coordenador real com staging/promoção, 3 de política/wiring UI e 1 teste Java real de disco. A inspeção de wiring App é estática; não equivale a interface física. Novidade: falha do harness reproduzida no baseline e preservada; ports faltantes acrescentados sem remover casos/asserts. Dois harnesses de imagem recebem o import real novo; negativos de transporte/fila/TTL preservados. Runner mantém todos os 204 controles e 42 suítes anteriores e acrescenta 3 suítes; lista de autorizações continua estrita e ANDROID-38 sintético permanece por último.

Validação final, build de teste e instalação física ainda pendentes no instante de registro. Nenhum PASS futuro é antecipado. Referência anterior 1.0.52 possui variantes de APK e ambiguidades históricas mantidas. Versão pretendida 1.0.53/code53 distingue os novos bytes para atualização.

O episódio auditado recebe redirect302 para outro host e HTML403 Cloudflare; o isolamento não é declarado correção desse bloqueio externo. O relatório final externo separará os resultados. Sem Git commit/push/PR, distribuição ou Supabase administrativo.
