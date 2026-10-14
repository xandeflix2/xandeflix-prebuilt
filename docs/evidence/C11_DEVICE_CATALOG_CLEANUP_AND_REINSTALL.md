# C103 — Limpeza e reinstalação — 2026-10-13

[Spec prévia](../architecture/C11_DEVICE_CATALOG_CLEANUP_AND_REINSTALL.md).
Preflight canônico, baseline967 arquivos, dirty C100/C101/C102 preservado.
Lock de ativação obrigatório antes da entrega PASS, promoção27/27. Nenhum
novo build/patch funcional/dependência ou mudança de autoridade/source.

Artefato reutilizado: APK19/1.0.19,11091073bytes, assinatura canônica igual às
instaladas. SHA256401c8dc29e561370a0ffdd7759ba82c1121f62ec5b2ae5032a23c2c078dfba6c.
APK instalado de cada alvo retirado via pull e hash igual ao artefato.

| Aparelho | Catálogos antes KiB | Depois KiB | Liberado KiB | Snapshots antigos removidos | Staging removidos |
|---|---:|---:|---:|---:|---:|
| Fire Stick AFTSSS,192.168.3.101:5555 |1613596|417636|1195960|4|4|
| Tablet SM-X610,192.168.3.119:33541 |2957551|458082|2499469|11|2|

Valores KiB alocados medidos com app parado. Liberação aproximada1,22GB e2,56GB
decimais respectivamente; catálogos restantes408MiB/447MiB. Cache reconstruível
artwork-v1/WebView do próprio package também removido quando presente;
reduções na tabela correspondem somente a files/prebuilt, não ao app inteiro.

Processo somente com.xandeflix.prebuilt/User0 parado antes de inventário; nomes
e caminhos absolutos dos diretórios removidos conferidos dentro do sandbox
próprio. Fire usa /data/data; tablet /data/user/0. Sem remover app_webview,
prefs/bancos/cofre nativo, arquivos root ou packages externos.
Staging corrente interrompido pelo force-stop autorizado e removido junto dos
antigos; app poderá reiniciar sua importação pelo fluxo legítimo posteriormente.

Fire: protegido snap-mv5h768n/snap-mv5gj4xm;412 segmentos declarados validados
por tamanho/hash quando declarado,422 arquivos protegidos iguais antes/depois.
Tablet: protegido snap-mv5s8v3o/snap-mv5c300k;452 segmentos,462 arquivos iguais.
União de active/recovery reread antes/depois; todos IDs protegidos presentes.
Cinco arquivos privados de identidade/chave/ativação/instalação/token iguais
em RAM antes/depois da limpeza e após reinstall. Nenhum plaintext em logs/docs.

Install -r --user0 SUCCESS nos dois alvos. Fire code19 reinstalado sobre19;
tablet atualizado18->19. UID e todas firstInstallTime existentes preservados,
inclusive registros User10 do tablet. Nenhuma limpeza de dados desse perfil.
App não aberto automaticamente; reprodução/gesto/UI física não homologados.

Celular: pareamento explícito em192.168.3.109 bem-sucedido. Porta de conexão da
tela principal solicitada e pendente; ainda não conectado, nenhum dado limpo
ou APK instalado nele. Tarefa completa para Fire/tablet e incompleta no celular.

Retenção automática segue pendente C102: esta manutenção pontual não altera
o código de sincronização. Não afirmar que elimina futuras acumulações.
Registros sanitizados em tmp/c103-device-cleanup/{firestick,tablet}-result.json
e planos de remoção. Sem uninstall/pm clear/downgrade/root/Git/backend.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
