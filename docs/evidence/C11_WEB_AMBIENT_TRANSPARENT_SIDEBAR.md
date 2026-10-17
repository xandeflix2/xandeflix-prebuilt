# C145 - fundo dinamico e sidebar transparente no web - 2026-10-17

Spec anterior ao codigo: [C11_WEB_AMBIENT_TRANSPARENT_SIDEBAR](../architecture/C11_WEB_AMBIENT_TRANSPARENT_SIDEBAR.md).
Preflight clone ativo/main/origin canonicos, HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d.
Auditoria C144 PASS; baseline1165 arquivos/copias antes do patch.

## Fronteira identificada e correcao

Header web usava fundo opaco. Amostragem atual captura SecurityError de canvas
cross-origin e retorna sem paleta; reproduzido antes do patch em portas
sinteticas. Isto demonstra o caminho no codigo, sem afirmar instrumentacao da
aba real. Referencia primaria: [MDN CORS image](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image).

Novo helper web recebe apenas a imagem atual ja exibida. Quando a leitura
atual falha, probe CORS anonymous/no-referrer da mesma URI calcula paleta pela
funcao existente, canvas24x24/cache48. Capas e filas originais intactas. Maximo
2 probes em voo,5s timeout, falhas em RAM48/60s; sem persistencia/proxy/API nova.
URIs nao HTTP(S), userinfo e mesma origem nao geram probe. Cross-origin
anonymous evita cookies de outros dominios. Erro/ausencia de cor conserva
fallback neutro. Imagem original nao e substituida nem recebe CORS forcado.

Hook recebe somente additions guardadas por webValidationBuild/isWebValidation:
import dinamico e AbortController web. URI atual/conexao/containment/sinal
impedem escrita atrasada. Mesmas propriedades CSS de paleta/halo/navigation
sao atualizadas; cleanup cancela aplicacao antiga. Operacao visual nao aguarda
catalogo, nao altera source/search/player/parental ou intervalo10s do Hero.

CSS adicional somente html data-web-validation=true e side-nav: shell usa cor
navigation-ambient com gradiente escuro; header transparente, sem sombra/borda
opacas ou backdrop-filter. Botoes, foco, centralizacao/dimensoes preservados.

## Evidencias e limites

-8 testes novos PASS: probe CORS antes de src, imagem original intacta, troca
  para nova cor, rejeicao de resultado antigo/abort/detach, deduplicacao/limite2/
  timeout/TTL/cleanup, URIs/native rejeitados, hook nativo sem import/probes e
  retencao Fire/reset demais preservados, hook web integrado e abort antes do
  import lazy. SSR/DOM/canvas/Imagem simulados; nao prova pixels do browser.
- Regressao existente test-c11-artwork-palette PASS, sem alterar seus asserts.
- Lock inicial e builds web/padrao PASS:26 ativacao +27 promocao +9 negativos.
  Typecheck/Vite ambos PASS; helper existe no web e nao esta no bundle padrao.
- Servidor localhost3000 retorna200 e novos marcadores nos3 modulos CSS/hook/
  helper. Nenhuma leitura de storage/identidade/fonte da aba ativada.
- HEAD HTTP do exemplo publico da [documentacao TMDB](https://developer.themoviedb.org/docs/image-basics)
  retorna200 e Access-Control-Allow-Origin:*. Evidencia do provedor publico,
  nao validacao das imagens particulares do usuario ou canvas real.
- Auditoria1165/1160 preservados: somente hook com guard web, CSS web e3
  memorias alterados;4 novos allowlisted (helper/teste/2 docs). Inversao dos
  additions no hook reproduz o anterior inteiro. Demais codigo funcional,
  Android/Gradle/APK C144, HEAD/main/index intactos. Sem cap sync/Gradle/APK
  novo/install/reset/backend/Git/proximo Gate.

Erro inicial no fixture novo: imagem simulada nativa sem dataset. Corrigido
o fixture para representar img[data-immersive-artwork] e closest por perfil,
sem mudar codigo produtivo/relaxar asserts; acrescentada verificacao da
retencao Fire. Suite final8/8 PASS, log inicial privado preservado. Lookup
opcional de HeroArtwork.tsx inexistente resolvido no Hero.tsx existente.
Avisos Vite preexistentes de Node/chunks/imports mistos permanecem.

CUA apps=[]/browsers=[]; transparencia e cores computadas na aba real ainda
pendentes de conferencia visual. Nenhuma automacao alternativa do browser.
Probes de cor acrescentam somente leitura de imagem no web quando necessaria;
nenhuma dessas requisicoes foi introduzida em native. APK1.0.29 C144 preservado
SHA256168768ca3ca670296301793fec8d8d778db2b04ed453b1e17bfb999966f92c9f.
Logs/auditorias em tmp/c145-web-ambient-sidebar. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
