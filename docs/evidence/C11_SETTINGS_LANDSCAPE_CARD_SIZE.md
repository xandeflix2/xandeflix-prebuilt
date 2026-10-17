# C142 - cards uniformes em paisagem e APK de teste - 2026-10-17

Spec anterior ao codigo e emenda de empacotamento:
[C11_SETTINGS_LANDSCAPE_CARD_SIZE](../architecture/C11_SETTINGS_LANDSCAPE_CARD_SIZE.md).
Clone ativo/main/origin canonicos; HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d.
Auditoria C141 PASS, baseline1158 arquivos e copias antes do patch.

## Correcao e isolamento

Adicionado apenas bloco CSS em orientation:landscape, para perfis tablet e
television, com exclusoes explicitas phone e conferencia web. Quatro colunas
de larguras iguais e linhas1fr dimensionadas pelo maior conteudo; o botao
preenche a celula tambem na ultima linha. Altura minima responsiva108-128px,
titulos15-18px, resumos11-13px e padding12-18px. Esses valores sao limites CSS,
nao medicao fisica; textos maiores ainda podem ampliar todas as linhas sem
corte. Foco continua no anel existente, sem escala ou mudanca de geometria.

Nenhuma alteracao em TSX/handlers/janelas/D-pad/fonte/catalogo/busca/player/
parental/Java. CSS anterior preservado, inclusive retrato/phone/web. Somente
constantes Gradle26->27/1.0.27 adicionais para permitir teste in-place.

## Verificacao e pacote

- Lock antes do patch, nos dois builds e antes do cap sync PASS:
  26 testes de ativacao +27 de promocao +9 controles negativos.
- Typecheck/Vite web e padrao PASS; cap sync e Gradle assembleDebug e
  testDebugUnitTest PASS.205 testes nativos/35 suites, sem falhas/erros/skips.
- APK com.xandeflix.prebuilt1.0.27/code27, minSDK23/target35,
  11388382 bytes, SHA256
  82af677cbaad3602bb49765ca8637a832d2422890325016b9b343f7893f0c012.
- Assinatura verificada igual ao C141;8 assets dist conferidos byte a byte,
  1412 recursos nativos identicos. Pacote standalone HTTPS, sem dev server
  e sem chunks de player/cofre do modo de conferencia web. CSS novo de cards
  e janelas dedicadas existentes confirmados dentro do APK.
- Auditoria de proveniencia:1158 baseline/1153 preservados; apenas CSS de
  SettingsPage,2 constantes Gradle e3 memorias append-only alterados.2 docs
  novos allowlisted, HEAD/main/index intactos; APK C141 preservado por hash.

Distribuivel privado: tmp/c142-settings-landscape-size/Xandeflix-v1.0.27-C142.apk.
Logs/auditorias/metadata no mesmo diretorio ignorado. Nenhum teste existente
foi alterado; nao criado teste que apenas repete valores CSS.

CUA retornou apps=[]/browsers=[]; renderizacao real e navegacao fisica nao
homologadas pelo agente. Novo APK entregue para conferir a correcao nos alvos;
nao instalado, nenhum dado privado acessado ou reset efetuado. Avisos Vite
preexistentes de externalizacao Node/chunks grandes permanecem. Sem backend,
Git ou proximo Gate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
