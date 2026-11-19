# Incidentes e limites da coleta

1. Acentos em um comando exploratório de seletor foram afetados pela codificação stdin/PowerShell. O seletor não localizou a ação e não foi contado como falha do app; um seletor ASCII confirmou o clique real.
2. Um comando inline do auditor de layout falhou por aspas antes de executar no dispositivo. Corrigido com arquivo `.mjs` externo.
3. Os textos iniciais SPEC/INSTALL_SCOPE preparados pelo auxiliar apresentam substituições de acentos. O escopo inteligível e final está em REPORT.md; esses arquivos não são transcrições originais da ordem do usuário nem recibos de aprovação.
4. Uma tentativa de leitura da documentação FFmpeg pelo navegador de pesquisa terminou em timeout. A documentação primária do mesmo projeto foi consultada no repositório oficial. Não houve requisição a fonte privada por esse navegador.
5. A auditoria integral G3 encontrou27 alterações e12extras em saídas de teste/cache/relatório Gradle. Algumas datas são contemporâneas à coleta; o processo produtor não foi identificado. Nenhum comando Gradle foi executado pelo executor/subagente deste ciclo. Não atribuir causalidade somente por timestamp, nem declarar igualdade integral com o snapshot antigo.

Nenhum desses incidentes foi convertido em autorização, PASS de reprodução ou aprovação independente. O instalador preparado não foi executado e foi desabilitado após o achado de preservação.
