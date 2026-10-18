# C158 — diagnostico e isolamento de falhas web — 2026-10-17

Spec previa: docs/architecture/C11_WEB_PLAYBACK_FAILURE_DIAGNOSIS.md.
Usuario confirma episodio e filmes fora de lancamentos reproduzindo; falhas
em lancamentos/Live e mensagem de erro ao buscar episodios de algumas series.
Nao ha evidencias de codec/protocolo/status dessas falhas reais. Credenciais
de screenshots nao foram transcritas nem usadas. Nenhuma fonte real consultada.

Implementado store somente RAM com enums e numeros, separado por tipo e
consulta de episodios, exposto no suporte web existente e console sanitizado.
Respostas tardias de play anterior nao encerram preview atualizado; listeners
e callbacks associados ao controller. Resume/erro/cleanup/C9 existentes iguais.
Consulta de episodios devolve mesmo valor/erro; retry e validacao C105 iguais.
Nenhum backend/fonte/APK/identidade/licenca ou player Android foi alterado.

Validacao: site:build completo PASS (lock, tsc, dois Vite, C151/C154/C155/C156/
C157/C158); C158 14/14, C136 player 10, C105 details 12 e import 7 PASS.
Controle negativo privado retira somente o guard de play no codigo em RAM:
novo teste reproduz falha antiga, preview novo perde transporte. Codigo no
workspace nao e mutado pelo controle. Chrome proprio: MediaError real4 com
MP4 sintetico invalido; hls.js real classifica manifesto sintetico invalido;
React real mostra diagnostico sem URL/segredo, apos fechamento do player.
Chrome anuncia HLS nativo; primeira fixture esperava biblioteca e falhou por
essa suposicao. Fixture final mascara apenas canPlayType para testar branch
hls.js, sem mudar produto/flags de seguranca. Nao e teste de midia real.

React: hooks/dependencias/callbacks existentes preservados; nenhum fetch extra,
assinatura global, pacote novo ou conteudo remoto foi acrescentado. APK C156
1.0.31 preservado SHA256 a7012e334e87ec2eac56715b7ae89fef523e9548cd4a9db01f8b7f83b3b8deee.
Helpers/evidencia sintetica em tmp/c158-web-playback ignorado. Git/allowlist/
prefixos de memorias auditados antes da publicacao. Producao e teste real
do usuario ainda pendentes neste registro; nao afirmar falhas resolvidas.
NEXT_GATE_STARTED=NAO. Sem proxy/relay/VPS ou nova hospedagem.


## C158 — fechamento da publicacao web — 2026-10-17

Publicacao C158 confirmada em producao. Commit funcional e9d568aef979a14a31d0f770453f1dbf8edf8639; Vercel equipe xandeflix2, projeto xandeflix-prebuilt-nm3x, deployment 7RYbkJgd8kLCjcpfiLhLZZjo86GL READY por status GitHub. https://xandeflix.vercel.app e alias nm3x: admin/app200, 14 assets identicos ao build aprovado, headers DENY/nosniff, .env.local e /api/control-plane/state404. Main main-DSLXSd84.js SHA256 086d3a289b2c29de5e8cc64e0d8db26cbbafa8ac93ae45f46ca4a2ef6e01ffce; TMDB_CONFIGURED=SIM. Correcao de evento tardio e diagnostico publicados; reproducao real de lancamentos/Live e carregamento das series que falham NAO certificados. Usuario deve repetir tentativas e fornecer somente WEB_MOVIE_/WEB_LIVE_/WEB_SERIES_DETAILS_ do suporte, sem URLs/credenciais. Nenhum proxy/relay, backend, APK ou dispositivo alterado. Este fechamento modifica somente documentacao. NEXT_GATE_STARTED=NAO.
