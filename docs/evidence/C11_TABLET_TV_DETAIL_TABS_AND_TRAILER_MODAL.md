# C11 — Detalhes tablet/Fire, abas, trailer e hero — ciclo51

2026-10-08. [Especificacao e emendas anteriores ao codigo](../architecture/C11_TABLET_TV_DETAIL_TABS_AND_TRAILER_MODAL.md).
Clone independente C11-main, main/origin esperado, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline privado728 arquivos,
alteracoes anteriores preservadas. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Resultado visual e funcional

Series tablet/Fire usam Episodios inicialmente ativo e Titulos semelhantes
em painel separado; temporadas/episodios/resolver/retomada originais.
Avaliar/Favoritos/Compartilhar ao lado de Assistir trailer, dentro do hero;
filmes reutilizam as mesmas acoes genericas com kind=movie e fingerprint
canonico. Sem duplicar grupos ou armazenamento. Phone preservado.
Toolbar Voltar acima do hero; Cast iconOnly ao lado somente tablet, ausente
Fire. Hero de detalhes com radius16, clipping/contorno e altura determinada
pelo conteudo, sem min-height Fire350/75vh/620. Poster/padding responsivos.

Trailer publico do titulo atual em dialog, carregamento/indisponibilidade
honestos, autoplay e controles play/pause/Close. Sessao publica e ID YouTube
validados; WebView separada sem bridge/source/arquivo local. Back fecha modal
antes de navegar, restaura foco e remove player/listener. Phone inline mantido.

## Verificacao

Componentes reais:7 grupos PASS (abas/default/teclado/retry; identidade canonica
de acoes series e filmes; Cast tablet versus Fire/phone/desktop; modal/foco/
cancelamento; geometria/controles/sessao nativa; Back antes da rota e negativos).
PhoneMovie3/PhoneSeries2, continuidade4, heroFire4, typecheck e lock22+27+9 PASS.
Build/sync/Gradle,143 testes Java sem falhas,6 assets byte-identicos e certificado
canonico b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d PASS.

QA fisica em foreground proprio:

- Tablet Coyote: viewport1365x775, toolbar bottom56/hero top80, hero1269x467,
  radius16/minHeight0, layout dentro do hero, um grupo de acoes na mesma linha,
  Cast topo1/baixo0. The Rookie: hero432 de altura,8 temporadas/20 episodios;
  aba semelhante20 cards. Sem altura vazia artificial.
- Fire103 Coyote: viewport960x540, toolbar bottom44/hero top54, hero856x266,
  radius16/minHeight0, acoes dentro/alinhadas, nenhum Cast. The Rookie: hero273,
  abas inicialmente Episodios e acoes na mesma linha. X-Men D-pad alternou abas
  e abriu Avaliar; Back fechou dialog e restaurou foco.
- Trailer Coyote tocou em tablet/Fire com eventos ready/playing; play/pause
  confirmados. Luke Cage tinha trailer indisponivel, sem substituicao indevida.
  The Rookie no APK EC412/tablet teve ready/playing, modal900x646 e frame899x506
  dentro da viewport; Back nativo fechou mantendo detalhes e foco no trailer.

## Entrega EC412 e regressao posterior

APK **EC412FD36F1D3FFEC472E01D9E033EF190FA59A0ECD16A44B25EC27F3C66FBFE**,
12400179bytes, JSindex-ZUJYN1Zo.js, package com.xandeflix.prebuilt,1.0/1,
min23/target35, standalone https://localhost,2PiP/Cast/Share mantidos.
Install-r, hash instalado e firstInstallTime confirmados:

| Aparelho | Privados/catalogo/nativos | Verificacao UTC | Preservacao final |
|---|---:|---|---|
| Tablet | 757/715/5 | 21:55:48 | Todos os grupos iguais |
| S24 | 761/718/5 | 21:56:05 | Todos os grupos iguais |
| Fire103 | 899/856/5 | 22:04:23 | Todos os grupos iguais |

Fire103 reabria durante a auditoria que exigia PID ausente. Essas tentativas
pararam antes de instalar. Entrega final comparou duas amostras completas
identicas antes e duas depois, igualdade integral antes/depois, firstInstallTime
e APK; PID observado isoladamente nao significa mutacao. Player nativo ativo
continuou impedindo essa alternativa. Nenhum reset ou exclusao de arquivos.

Primeira atualizacao intermediaria S24 para8EBA teve diferencas em2 preferencias,
19 WebView e2 outros arquivos: nao foi contada como preservacao integral.
Catalogo/identidade permaneceram iguais; repeticao8EBA e entregaEC412 posteriores
passaram em todos os grupos. Causa das diferencas nao estabelecida.

Depois da entrega o usuario relatou regressao D-pad Fire103. Reproduzidos
Recentes sem descer e relacionados de filme subindo ao menu. Sucesso visual
deste ciclo nao certifica esses percursos; correcao/evidencia separadas em
[ciclo53](C11_FIRE_DPAD_RAIL_AND_DETAIL_RETURN.md), que sucede EC412 no Fire.
Fire107 nao conectou neste intervalo; S23 excluido posteriormente pelo usuario.
Sem Git/backend administrativo/reset; sem iniciar novo Gate.
