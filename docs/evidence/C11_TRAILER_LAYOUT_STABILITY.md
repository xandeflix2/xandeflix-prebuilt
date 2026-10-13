# C11 — estabilidade do mini player público — evidência de 2026-10-06

Contrato: [C11_TRAILER_LAYOUT_STABILITY](../architecture/C11_TRAILER_LAYOUT_STABILITY.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Patch local somente SeriesTrailer.tsx
e PublicTrailerPlugin.java, além de contrato/evidência/relatório/memórias.

## Correção

Após observar mais de100 bounds em3,5s na execução intermediária do S24,
o componente passou a deduplicar mudanças menores que0,5px. Estado é local
à sessão e apagado ao desmontar. Plugin compara dimensões/margens inteiras
antes de setLayoutParams; WebView público não toma foco de entrada.
Não se removem validações de perfil, URL/ID ou visibilidade.

## Verificação e limites

Browser com SeriesTrailer real e adapter nativo simulado:1 open visível,
40 eventos resize sem geometria nova produziram0 bounds adicionais; hero
estável, scroll fora da tela publicou visible=false e desmontagem fechou
player. Zero erros. Compilação Android/Java122 passou e plugin está no APK.

No S24 final a tentativa física recebeu Public trailer unavailable e manteve
heroTop101; outra leitura confirmou document.hidden=true com bloqueio da tela.
Não se usa rejeição/ready como prova de reprodução efetiva nem se atribui toda
falha a uma causa não isolada. Raio Negro também apresentou fallback honesto
na versão intermediária. Reprodução/controles de toque e ausência de loop na
WebView pública física final continuam por homologar com tela desbloqueada.
Alternativa Abrir trailer no YouTube permanece disponível quando há ID público.
YouTube pode recusar um vídeo incorporado: [API oficial e erros](https://developers.google.com/youtube/iframe_api_reference#onError).

Fixtures e estados seguros em tmp/c11-phone-series-20261006 (ignorado).
Entrega e limites: [relatório completo](C11_OPTIMIZATION_REPORT_20261006.md).


## Complemento com aparelho desbloqueado

S24 confirmou visible=true/open resolvido/ready,0 pedidos bounds em3,5s
e heroTop100px estável. Pendência de desbloqueio resolvida; vídeo público
efetivamente reproduzido/controles de toque não certificados. Detalhes e
limites no item39 do relatório. Nenhuma mudança no APK após esse teste.
