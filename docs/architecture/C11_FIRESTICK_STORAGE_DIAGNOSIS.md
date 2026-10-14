# C102 — Diagnóstico de armazenamento do Fire Stick — 2026-10-13

Pedido: verificar por que o aplicativo instalado ocupa1,69GB de dados.
Escopo autorizado: diagnóstico somente leitura no Amazon AFTSSS em
192.168.3.101:5555 e análise do código local. Sem limpeza, force-stop,
sincronização, playback, build, instalação, backend ou operações Git.

Preflight: workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main,
HEAD d039f8837dfcfd44374560a9e6642cb93e59c2cf. AGENTS, Architecture/Execution,
Source Data Boundary e lock previamente lidos, sem alteração desde C101.
Dirty conhecido C100/C101 preservado. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados.

Allowlist documental: este plano, docs/evidence/C11_FIRESTICK_STORAGE_DIAGNOSIS.md,
docs/STATUS.md, EVOLUTION_REPORT.md, ERRORS_AND_BLOCKERS.md, DECISIONS.md;
tmp/c102-firestick-storage/** ignorado para baseline/helpers/resultados.
Nenhum código funcional/teste/configuração modificado; lock/build não necessários
para leitura e documentação. Não imprimir conteúdos de catálogo, credenciais,
chave ou token. Extrair em RAM apenas ponteiros de snapshot, datas, tamanhos,
contagens e nomes de artefatos lógicos, sem URLs ou registros de conteúdo.

Critérios: decompor espaço físico por diretório/geração, identificar ativo e
referências de recuperação, distinguir staging incompleto de geração permanente;
localizar no código a política de promoção/limpeza/retenção. Quantificar excesso
sem presumir que diretórios possam ser apagados durante sync. Descrever correção
segura proposta preservando ativo, recuperação, identidade e autorização;
registrar limites da medição ao vivo e auditar proveniência/HEAD intactos.
