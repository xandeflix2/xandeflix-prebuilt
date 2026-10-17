# C130 — Ícone Fire e piscada na Home/categorias

2026-10-16. Spec anterior: [C11_FIRE_LAUNCHER_AND_RENDER_STABILITY](../architecture/C11_FIRE_LAUNCHER_AND_RENDER_STABILITY.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Ciclo local, sem Git/backend,
instalação/reset/uninstall. Baseline1098; HEAD/main/origin preservados.

## Diagnóstico físico

Fire Stick AFTSS, SDK28, uiMode0x14 televisão conectado. APK extraído somente
para comparação privada corresponde ao C126 por SHA256, não ao último C129.
Recursos C122 presentes: marca vermelha, adaptive XML e banner horizontal.
Foto do usuário mostra Capacitor azul no launcher. Atividade launcher herdava
icon/banner da aplicação, e a resolução padrão era adaptive XML. Não foi
comprovado se a foto decorre de cache persistido ou de como o launcher resolve
o ícone. Uma tentativa de abrir lista Apps pela navegação abriu IgnitionActivity
do navegador Amazon; captura preta dessa transição foi descartada. Retorno ao
Xandeflix executado, sem dados alterados, fato comunicado ao usuário.

Na Home, observação CDP de23s em processo real registrou502 frames: hero atingiu
opacity0 nas duas trocas (~10,3s e20,6s), cinco frames quase transparentes.
A paleta do topo ficou vazia entre troca de identidade e carga da nova imagem;
em uma troca a nova cor chegou cerca de1s depois. Shell permaneceu montado,
hero presente, sem tela de sincronização e sem reinício visível do documento.
Isto reproduz piscada no hero/topo, não prova defeito de HDMI ou de toda a tela.

Meminfo inicial167104KiB PSS/87821KiB GL; gfxinfo acumulado60,11% janky
(5877/9777). DOM49 imagens/~21MP e heapJS~23MB. São dados históricos, não
causa isolada nem SLA; nenhuma otimização especulativa de memória foi feita.
Logs filtrados/sanitizados não evidenciaram crash de Xandeflix na leitura;
reinícios de serviços Amazon não foram atribuídos ao aplicativo.
Não houve leitura/exportação de source, PIN/PUK ou credenciais. Forward local
de inspeção removido ao terminar. APK do dispositivo permanece C126.

## Alterações

- HomeHero Fire não anima o carousel inteiro de opacity0 para1 em400ms;
  conteúdo, botões e foco permanecem visíveis. Rotação de10s preservada.
  Outras plataformas mantêm o fade e prefers-reduced-motion anterior.
- Halo Fire conserva a paleta válida enquanto troca de imagem está pendente.
  A nova cor substitui a anterior quando pronta. Erro da imagem principal,
  imagem ilegível, ausência do hero e unmount limpam o estado. Falha de logo
  de plataforma não apaga o fundo. Outros perfis mantêm reset anterior.
- MainActivity declara icon/banner explicitamente. Dois bitmaps96px com
  qualificador television-xhdpi reutilizam X vermelho existente. Adaptive e
 15 PNGs mobile permanecem idênticos. Sem mudança em package/intents/backup.
- VersionCode20/name1.0.20 permite distinguir a atualização; sem dependências,
  permissões ou alterações em ativação/C9/cofres/parental/source.

## Validação

C130 sete testes de efeitos reais PASS, mais dois controles negativos que
reintroduzem os comportamentos antigos em memória e são rejeitados. C107 halo7,
C106 hero8, Fire home D-pad5/rail10, C118 touch4, HomeHero12 e C128 parental11
PASS. Typecheck/build561 módulos, lock inicial e prebuild26+27+9, sync e Gradle
assembleDebug PASS. Limpeza adicional do halo sem ref foi testada e recompilada
antes da entrega; candidato inicial preservado como pre-final-candidate.apk.

UI React real em Chrome isolado: Fire261 frames/cinco trocas, opacity mínima1,
zero frames animando o carousel inteiro. AndroidTV275 frames/cinco trocas,
123 frames com fade e mínimo~0,069, confirmando preservação de outro perfil.
Zero requests externas. Preferência de movimento explicitada no harness;
asserção inicial de capturar opacity<0,1 em outro perfil era dependente de
timing/preferência do ambiente. Ajustada para detectar fade (animação e opacity<1),
mantendo critério Fire exatamente1. Não houve alteração adicional de produto.
Capturas/perfis de navegador não são validação do novo APK em hardware.

## Artefato

[Xandeflix-v1.0.20-C130.apk](../../tmp/c130-fire-launcher-icon/Xandeflix-v1.0.20-C130.apk)

11198257 bytes; SHA256 871b86c5aa12d3dc1cb74d2a922c606be17ac5afa6f9d62d3f6e5eca269c8438.
Package com.xandeflix.prebuilt, code20/name1.0.20, min23/target35.
Assinatura igual ao C129; oito assets conferidos contra dist, dez arquivos
public incluindo dois stubs Capacitor, sem assets antigos adicionais.
HTTPS localhost/logging none/sem dev server. Manifest compilado confirma
icon/banner em MainActivity, dois PNGs TV corretos,15PNG/quatroXML mobile
preservados. Onze de doze DEX idênticos; classes10.dex contém versão BuildConfig
regenerada. Fontes Java de runtime intactos. C129 preservado por hash.

Auditoria final: oito existentes alterados na allowlist, cinco novos,
1090 arquivos anteriores intactos; memórias append-only e Git preservados.
Arquivo privado audit.json registra os resultados efetivos. Avisos anteriores
Vite (Node/chunk/imports) e Gradle flatDir permanecem.

Atualização manual e conferência física do novo ícone e da ausência de piscadas
ainda pendentes. Não certificar todo tipo de piscada, reprodução, HDMI ou
lançadores de terceiros a partir desta investigação.

## Referências primárias

[Amazon: ícone instalado e recursos mipmap](https://developer.amazon.com/docs/fire-app-builder/ja-customize-look-and-feel.html).
[Android: icon da atividade e herança](https://developer.android.com/guide/topics/manifest/activity-element#icon).
[Android: recursos alternativos e television](https://developer.android.com/guide/topics/resources/providing-resources#AlternativeResources).
