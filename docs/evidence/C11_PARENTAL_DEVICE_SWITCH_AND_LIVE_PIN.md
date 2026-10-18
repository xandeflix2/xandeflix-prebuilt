# C160 — controle por aparelho e PIN Live — 2026-10-18

Spec/emenda anterior ao codigo em C11_PARENTAL_DEVICE_SWITCH_AND_LIVE_PIN.md.
Preflight clone independente main/origin canonicos HEAD8477a5e limpo, registros
da fonte encerrados antes deste novo pedido, CURRENT_GATE=NONE/cicloC160.
Allowlist13 arquivos, Git/publicacao do reparo autorizados, PR/backend=NAO.

Flag enabled opcional no mesmo registro localv1; legado=true, tipo invalido
falha fechado. Botao de administracao autenticada desativa/reativa restricoes
comuns, preserva verificadores PIN/PUK, politica, regras e tentativas; escrita
verificada e lock de grants/admin. Reativacao restaura mesmas preferencias.
Adulto explicito continua opt-in/18/PIN mesmo com restricoes comuns suspensas.
PIN web, armazenamento nativo, autoridade comercial e source nao mudam.

Live comum nao passa por filtro etario nem alwaysPin; marcacao adulta da fonte
ou regra adulta local e erro do registro continuam protegidos. Selecao direta
de adulto elegivel sem sessao abre prompt existente e somente sucesso concede
sessao15min e grant daquele canal/geracao. Categoria nao concede todos grants.
Antes, authorizeParentalLive recebia ADULT_DISABLED antes de solicitar sessao.
Cancelamento/erro/lock concorrente nao autorizam; setup/opt-in/18 ainda exigidos.

Verificacao: lock antes e novamente no site:build PASS. Site completo PASS:
tsc, Vite painel/app e suitesC151-C160, C16012/12. C12616, C12811, cronometro
C13512, guiaC1489 PASS. Unico casoC128 de idade Live mudou a expectativa por
pedido expresso; demais negativos e asserts de imutabilidade preservados.
React: setter serializado/admin, disabled durante operacao, role switch com
aria-checked/rotulo, status acessivel, secrets limpos, hooks sem novos efeitos.

Chrome proprio com pagina de configuracao/dialogo/store/WebCrypto reais:
PC/Tablete/FireTV/celular logicos PASS, off/on pela UI, PIN errado/correto,
cancelamento e nenhum canal autorizado antes do sucesso. Portas de fonte/
player nao invocadas, busca/dispositivo sinteticos. Sem teste de aparelho
fisico, conta ou conteudo real. tmp/c160-parental-live contem logs/baseline/
relatorios e capturas; nao sao SLA nem evidencias de compatibilidade de fonte.

Falhas privadas corrigidas: CDP inicialmente ocultou erro de serializacao
de elemento DOM com referencias React; predicado agora retorna Boolean.
Fixture nao reproduzia ancestral TV/reset box-sizing do index.css, acusou
overflow artificial; wrapper e CSS canonicos incluidos, sem alterar produto.
Leituras com src/player, LivePage inexistentes e glob posicional vite* foram
corrigidas para caminhos inventariados; nenhuma escrita por essas falhas.
Auditoria deve conferir demais hashes, memorias e APK C156 inalterados.
Publicacao web pendente neste registro; APK/instalacao nao executados.

Pendencia web preservada: usuario diz que conteudos funcionam em localhost
HTTP e HTTPS, usando fonte de terceiro. Comparacao controlada da mesma fonte,
destinos, build e permissoes nao disponivel; nao concluir que apenas mudar
protocolo explica diferenca. Sem proxy/VPS/bypass. NEXT_GATE_STARTED=NAO.
