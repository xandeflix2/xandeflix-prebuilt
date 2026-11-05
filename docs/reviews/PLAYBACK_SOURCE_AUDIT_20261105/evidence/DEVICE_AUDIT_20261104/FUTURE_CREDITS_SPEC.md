# Motor de créditos — especificação para decisão futura

Estado: proposta documental, sem implementação, backend, build ou autorização automática de próximo gate. Origem do escopo: esclarecimento do usuário para concluir a auditoria dos aplicativos e apenas especificar o motor externo.

## Requisitos que permanecem obrigatórios

1. Preservar o próximo episódio manual e o avanço no término natural. Uma oferta durante os créditos é um fluxo adicional.
2. Usar os contratos existentes G2 (`next-episode-resolver.ts`) e G3 (`credits-marker.ts`) sem presumir que já estejam integrados ao player.
3. Vincular o marcador à edição real da mídia, episódio, fonte local, geração e snapshot. TMDB, título, duração semelhante e identidade S/E isolados não comprovam a edição.
4. Exigir duração real de playback/probe e autoridade/convenção reconhecida. Nenhum marcador válido significa nenhuma oferta antecipada fundamentada; não inventar o começo dos créditos.
5. Não transmitir URLs, credenciais, sessões, catálogo privado, EPG ou mídia para backend. O Source Data Boundary atual não autoriza a tabela remota de episódios proposta pelo relatório anterior. Ser numérico não torna o dado automaticamente permitido.

## Alternativas e decisão proposta

| Alternativa | O que comprova | Limite | Tratamento proposto |
| --- | --- | --- | --- |
| Marcador HLS com convenção documentada | Instante e semântica declarados pelo produtor para aquela edição | DATERANGE/ID3 genérico não identifica créditos por si só | Adaptador futuro, somente com edição e autoridade comprovadas |
| Registro curado por edição | Instante revisado para uma edição identificada | Manutenção, versões diferentes, procedência | Candidato preferencial para piloto local autorizado |
| Análise audiovisual local de mídia autorizada | Evidências de tela preta/texto/movimento | Falsos positivos, cenas pós-créditos, custo e DRM | Apenas gera candidato para revisão; não concede VALID automaticamente |
| Tempo restante/percentual fixo | Proximidade do fim | Não detecta créditos; episódios curtos e cortes variam | Não rotular como detecção nem substituir o G3 |
| Worker remoto com URL da fonte | Acesso à mídia pelo worker | Viola a fronteira atual; expõe fonte e pode baixar mais que o esperado | Não implementar sob o contrato atual |
| Tabela universal por TMDB/S/E | Identidade editorial | Não identifica a edição exibida | Insuficiente para uma ação antecipada segura |

HTTP Range depende do servidor, do contêiner e da posição do índice. `ffmpeg -ss` não garante que somente o final será transferido. MPEG-TS, MP4 e HLS precisam de adaptadores próprios de tempo/edição; o protocolo ou contêiner não fornece a semântica de créditos automaticamente. Nenhum comportamento de fontes reais foi certificado nesta auditoria.

## Gates futuros propostos, ainda não iniciados

### A — decisão de fronteira e aquisição

Definir origem permitida dos marcadores, prova de edição, autoridade, duração e expiração. Se houver serviço remoto, aprovar primeiro uma emenda explícita da fronteira, política de dados e autenticação. Sem essa decisão, manter piloto local. Usar somente amostras autorizadas e novas allowlists nominais.

Aceitação: amostras de edições diferentes do mesmo episódio não compartilham marcador sem evidência; nenhum segredo/URL no marcador/log; fixtures negativas de edição, geração, autoridade, duração, expiração e ambiguidade.

### B — adaptador puro e correlação

Construir contexto G3 por adaptador confiável; mapear explicitamente `sourceIdLocal`/`sourceId`, `catalogSnapshotId`/`snapshotId` e geração da fonte/catálogo. Não equiparar os campos por nome ou coerção. Correlacionar G2 e G3 à mesma sessão/requisição/episódio atual. Não iniciar reprodução nesta etapa.

Aceitação: rejeitar respostas antigas e mudanças de fonte/edição/snapshot; usar relógio explícito; impedir que AUTH desconhecida seja tomada por permitida; manter todos os testes originais e novos negativos.

### C — integração nativa e interface

Somente após autorização nominal: oferta com G3 VALID e G2 AVAILABLE atuais, revalidação no clique, progresso persistido do episódio que sai, transição única entre clique/manual/término natural, cancelamento em pausa/saída/sessão alterada e recuperação de erros. Nenhuma contagem regressiva deve iniciar o próximo episódio em background. Definir explicitamente se há contagem regressiva ou apenas ação do usuário.

Aceitação: testes reais da máquina de estados, foco/D-pad/Voltar no Fire/Android TV, toque em telefone/tablet, ausência de captura indevida de foco, nenhuma transição duplicada, episódio final/catálogo incompleto, troca de fonte durante a oferta e preservação do avanço natural.

### D — artefato e validação física

Gate separado para versão nova, build autorizado, manifesto de código/recibos, hash e assinatura do APK, atualização in-place e matriz física nos três dispositivos. Critérios incluem primeiro quadro, áudio, progresso, retorno e falhas de rede. Teste de ativação ou catálogo não certifica reprodução.

## Riscos e limites atuais

A implementação nativa examinada contém uma heurística de 35/45 segundos com avanço após cinco segundos, sem chamadas aos módulos G2/G3. Ela não é uma implementação do contrato G3. A regularização desse comportamento é uma demanda separada da criação do motor. A auditoria não adicionou parser, overlay, worker, tabela, dependência nem integração.

## Referências primárias consultadas

O protocolo define DATERANGE como intervalo com atributos e ENDLIST como fim da adição de segmentos. A inferência de engenharia é que esses elementos, sozinhos, não identificam créditos; uma convenção adicional precisa fornecer essa semântica. [RFC8216, §§4.3.2.7 e4.3.3.4](https://www.rfc-editor.org/rfc/rfc8216.html#section-4.3.2.7).

O FFmpeg documenta que a busca de entrada por `-ss` pode começar em um ponto anterior ao solicitado e exigir decodificação adicional. A conclusão de que isso não garante um limite de transferência é uma inferência; depende também do transporte e da fonte. [Documentação primária FFmpeg, opção -ss](https://github.com/FFmpeg/FFmpeg/blob/master/doc/ffmpeg.texi).
