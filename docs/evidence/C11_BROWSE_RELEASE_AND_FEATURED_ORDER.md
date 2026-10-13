# C11 — Ordem de Lancamentos e Destaques — ciclo54

2026-10-08 America/Sao_Paulo. [Contrato previo](../architecture/C11_BROWSE_RELEASE_AND_FEATURED_ORDER.md).
Clone independente C11-main, main/origin esperado, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e;
baseline728 preservado, CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/reset.

CatalogBrowsePage particiona estavelmente categorias Lancamentos existentes,
insere Filmes em Destaque abaixo e conserva demais categorias na ordem da fonte.
Series inicia com Series em Destaque e conserva plataformas. Ambos usam os
mesmos20 registros/views canonicos da Home. A Home pode embaralhar a ordem
visual por visita; nao afirmar identica ordem visual entre paginas. Sem criar
categoria artificial na fonte ou alterar source-desc/paginacao48/rail20.
Ver todos reutiliza HomeCollectionPage vertical com retorno ao overview de origem;
colecoes exclusivas nao recebem linhas de outras categorias.

4 grupos de teste do componente real PASS, categoria anterior7/HomeColecoes3 e
D-pad53 hook4 PASS; typecheck, checklist React, lock22+27+9, build/sync/assets6,
assinatura/package/standalone e Java143 na entrega D23B PASS. Nenhum teste antigo
relaxado: apenas binding de dependencia MediaRail atualizado.

APK D23BDBC7BFE67C3BDEEE48B54C24F4698998E60AEA76E63ED74550B0A1B6D9E2,
12400179bytes, JSindex-BTBQbeXU.js. Fire anteriormente103 recebeu install-r
com899/856/5 arquivos privados/catalogo/nativos iguais, firstInstallTime e
hashAPK conferidos em2026-10-08T22:50:37.301Z. IP mudou depois para
192.168.0.106:5555: endereco3.106 recusou10061, endereco0.106 conectou;
modelo AFTSSS/API28/hash instalado D23B confirmados antes de operar.

QA fisica Fire/D23B e S24/BKG, com foreground proprio: Filmes primeiras linhas
Lancamentos, Filmes em Destaque, Nacionais, Ficcao, Crime, Guerra, Familia;
Series: Series em Destaque, DESENHOS, DISNEY PLUS, NETFLIX, AMAZON PRIME VIDEO,
PARAMOUNT, HBO MAX. Destaques20cards, Ver todos abre grid20 e Back retorna ao
overview correto. Samsung recebeu depois a implementacao54 no APK7ACE do55:
S24 preservacao integral763/718/5 em2026-10-09T00:29:52.853Z; tablet recebeu
6FAA/mesmoBKG com756/715/5 em00:52:39.467Z. Detalhes posteriores desses APKs e
testes do player pertencem ao55; nao equivalem a homologacao de playback.

Primeira QA Fire usou seletor privado restrito ao header phone e nao encontrou
o menu lateral; helper corrigido para nav-link responsivo, sem alterar produto.
Assert privado via PowerShell stdin trocou acento por '?'; script UTF8/escape
Unicode confirmou os mesmos resultados. Nenhuma dessas tentativas inconclusivas
foi contada PASS antes da repeticao correta. Fire107 permanece sem conexao no IP
anterior, ultima entrega comprovada251E; S23 excluido pelo usuario.

Pedido de ordem54 implementado e conferido nos dois overviews Fire/S24. O
diagnostico separado de Luke/AirScreen continua no55; nenhum sucesso visual
certifica todos os streams, capas universais ou producao.
