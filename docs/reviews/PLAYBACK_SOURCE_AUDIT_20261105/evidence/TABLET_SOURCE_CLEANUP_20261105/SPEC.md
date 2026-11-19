# Limpeza local da fonte — tablet — antes da execução

Autorização atual do usuário: “é possivel limpar o cache e dados da fonte no tablet?”. Interpretada no contexto do pedido de restabelecimento e troca limpa como execução da limpeza restrita da fonte. Dispositivo exclusivo RX2X301Q3KY, pacote com.xandeflix.prebuilt, APK1.0.53. Não é reset do aplicativo, remoção de licença, alteração da fonte nem escrita no Supabase.

Allowlist de dados: árvore privada files/prebuilt (catálogo, índices, snapshots, staging e journal), cache/artwork-v1, cinco chaves SOURCE_METADATA_KEYS do módulo source-replacement.ts. Repreparar a fase PREPARED com o mesmo target e epoch já validados para exigir importação integral e limpeza das três SOURCE_PRESENTATION_DATABASES pelo fluxo original do APK. Mesmo epoch conserva a associação dos registros pessoais da mesma fonte. Não modificar target, credenciais, identidade ou decisões de autorização. Não editar código/APK.

Antes: confirmar versão, estado ACTIVE, ponteiro igual ao lifecycle e ausência de links nos dois diretórios. Capturar identidade/chave/instalação/ativação e storage pessoal somente em RAM para comparar depois; nunca persistir valores privados. Parar reprodução pelos controles do aplicativo, remover observadores e encerrar o processo antes da exclusão física. Validar caminhos reais dentro da pasta privada exata do pacote. Não executar pm clear, uninstall, redefinições, limpeza de shared_prefs, app_webview ou Android Keystore.

Depois: verificar diretórios removidos, iniciar o app normalmente, observar CLEANED/ACTIVE e catálogo visível com novo snapshot, mesma fonte/versão/epoch, autorização válida e dados pessoais anteriores intactos. O boot deverá buscar/validar a fonte e importar sem checkpoint anterior. Não tratar sucesso de catálogo como reprodução homologada. Repetir filme e episódio após a limpeza. Falha de importação fica explícita, sem concessão artificial de licença ou reprodução.

Evidências novas somente nesta pasta; os fechamentos anteriores permanecem intactos. Dados fonte realmente removidos não serão copiados como backup com URLs privadas. Não há autorização de operação administrativa no backend.
