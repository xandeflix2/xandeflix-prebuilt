# C102 — Excesso de armazenamento confirmado — 2026-10-13

[Spec prévia](../architecture/C11_FIRESTICK_STORAGE_DIAGNOSIS.md).
Diagnóstico somente leitura no Amazon AFTSSS/API28,192.168.3.101:5555,
com.xandeflix.prebuilt19/1.0.19. Nenhum arquivo do aparelho apagado, processo
parado, sync provocado, APK instalado ou configuração alterada neste ciclo.

Primeira medição du em KiB alocados: files/prebuilt1586428; app inteiro1592600;
files1586456; app_webview6092; cache4; code_cache4; shared_prefs32.
APK19 tem11091073 bytes. Consumo principal anterior ao update: C101 já havia
registrado e preservado1603 arquivos de catálogo e ~1,5GiB na instalação.

Seis snapshots completos de206–208 segmentos, gerados entre4 e12/outubro:

| Papel | Snapshot | KiB alocados | MiB aproximados |
|---|---|---:|---:|
| Ativo/last-known-good | snap-mv5h768n |208880|204|
| Anterior no recovery journal | snap-mv5gj4xm |208736|204|
| Quatro sem referência nos ponteiros | snap-muzov4xw, snap-mv1ov4vg, snap-muu28kdt, snap-muznsmiw |834552|815|
| Três staging antigos sem manifest | snap-muu1q12v, snap-muu0w14l, snap-mv31r45h |334244|326|

Ativo e journal concordam; recovery atual referencia somente ativo e anterior.
Quatro snapshots não referenciados e três staging antigos somam1168796KiB,
~1,20GB decimais, candidatos à futura manutenção após controles de segurança.
Não foram apagados nem foi validada integridade completa de fallback neste ciclo.

Durante a medição, processo do app em execução e novo staging snap-mv724pel,
datado13/outubro16:11, cresceu de12816 para25164 e27168KiB. Total prebuilt na
última leitura1613596KiB (~1,65GB). Medição ao vivo não é snapshot atômico;
esse staging crescente não pode ser classificado como órfão ou apagado.
Sem manifest indica importação ainda não finalizada, não comprova por si só
causa de interrupção dos três antigos. Datas dos antigos:4/outubro e10/outubro.

Manifest ativo:17156 filmes,8927 séries,221324 episódios,1028 canais;
bytes declarados por tipo: episodes147093370, streams41997586,
movies12622573, series6413258, seasons1326203, live415453. São dados locais
de catálogo/referências e índices. Maior parcela de uma geração são episódios.
Nenhuma URL, credencial ou conteúdo de registro retornado nos relatórios.

Análise local:
- CapacitorFilesystemStorage.promoteStaging promove somente o candidato; não
  contém política de poda das demais gerações permanentes.
- PackageImporter atualiza active/recovery e chama cleanupStaging(snapshotId)
  somente do candidato. Não realiza coleta das gerações antigas.
- cleanupStaging ignora erros; finalização/catch não executam se processo morrer.
  Não há varredura de staging órfão ao reiniciar no fluxo analisado. Isso explica
  a possibilidade de acumular importações parciais; evento histórico específico
  que deixou cada staging não foi reproduzido.
- RecoveryService recupera IDs do journal (ativo/last-known-good/anterior),
  sem percorrer automaticamente todos os snapshots antigos.
- Métrica totalAppDataBytes do importer calcula geração atual+4096; não mede
  o total físico com históricos/staging, podendo subestimar consumo do app.

Correção proposta para ciclo funcional posterior: retenção bounded após promoção
confirmada preservando todas as referências ativas/recovery e leitores em uso;
coleta de staging antigo apenas sob exclusão de importação em andamento, com
erros visíveis/retry e medição física agregada. Manutenção no aparelho exige
identificar novamente ponteiros e job ativo, congelar gravações autorizado,
verificar integridade ativo/fallback e comparar identidade/ativação antes/depois.
Redução estimada em repouso: ~1,20GB, mantendo ~408MiB de ativo+fallback,
mais app/WebView/cache; próxima importação precisa espaço temporário adicional.
Não fixar esse número como limite/SLA nem fazer clear-data/reset.

Diagnóstico concluído; defeito de retenção e limpeza permanece sem correção.
Baseline965 arquivos e auditoria documental/HEAD: PASS, C100/C101 preservados.
Logs privados sanitizados em tmp/c102-firestick-storage/; sem backend/Git.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
