# Limpeza da fonte no tablet — 05/11/2026

Exclusão e reimportação do catálogo concluídas no SM-X610, APK1.0.53. Foram removidas exclusivamente as árvores privadas files/prebuilt e cache/artwork-v1 após validação de caminhos/links e parada do aplicativo; cinco chaves de metadata foram limpas. O boot normal consultou sua autoridade e reimportou a fonte. Não houve pm clear, uninstall, exclusão de identidade/chave/licença ou escrita administrativa no Supabase.

Às17:38:42Z o catálogo estava ACTIVE com cards. O inventário confirmou somente um snapshot REAL da mesma fonte/versão e staging vazio. Identidade, chave de ativação, instalação, campos estáveis da ativação e autorização foram comparados e preservados. O primeiro filme depois da limpeza produziu primeiro quadro e avanço. Outro episódio continuou recebendo403; a limpeza não restabeleceu todos os títulos.

`RESULT.json` permanece PENDING_OR_FAILED porque o epoch final foi novo, ao contrário do plano de conservar o anterior. A ressalva e a insuficiência do matcher de dados pessoais estão integralmente em `OBSERVATION_NOTE.md`. Não declarar preservação integral/associação visual do histórico por esse matcher. Não apagar o resultado parcial nem reatribuir silenciosamente registros antigos ao novo escopo. A constatação de exclusão física e catálogo novo é distinta desse critério adicional não cumprido.

Testes posteriores e conferência da referência atual estão em `../HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md`. Resultado operacional desta pasta: `LOCAL_SOURCE_DATA_REMOVED_AND_REIMPORTED_WITH_NEW_SCOPE`; playback integral continua pendente de resolução da recusa da fonte.
