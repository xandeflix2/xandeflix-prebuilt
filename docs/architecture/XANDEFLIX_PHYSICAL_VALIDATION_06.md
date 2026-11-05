# XANDEFLIX-PHYSICAL-VALIDATION-06 — especificação prévia

Autorização: pedido nominal do usuário para identificar APKs já instalados e executar homologação física segura, sem novas instalações. Data local de abertura25/10/2026. Não presumir sucesso local como físico. Este gate não altera produto, testes, configuração, fontes ou versões.

Preflight: root ativo C:/Xandeflix/xandeflix-prebuilt-c11-main, origin https://github.com/xandeflix2/xandeflix-prebuilt.git, branch operacional fix/source-output-format-recovery, HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8, baseline/main b3fc8d1e3844bc5601813ab1b298289af5b3f1fd,10 diferenças L1 recebidas. Reutilizar proveniência e exceção operacional já documentadas, sem mover main. Workspace histórico não será operado. AGENTS/Architecture/Execution/Source Boundary e plano físico05 lidos.

Allowlist: somente artefatos novos neste diretório tmp e helper tmp/physical-validation-06-20261025.mjs. Para registros normativos, cópia isolada documental do05 com quatro documentos append-only e nova especificação/evidência; nenhum source/test/config/recibo antigo pode mudar. Preservar root e estágios03/04/05 por hashes. Não gerar/instalar APK, usar Gradle, Git staging/commit/push/merge/PR/deploy ou backend. Diagnóstico não exige reexecutar testes imutáveis; CANON de integridade pode ser executado na cópia documental.

Fase1: adb devices -l e leituras por serial de modelo/API/Android/ABI, pm path, metadata pública e SHA256 dos APKs. Comparar com artefatos locais conhecidos e verificar apksigner no mesmo arquivo por hash. Se necessário, ler apenas APK público instalado para auditoria, nunca /data/data ou armazenamento privado. Inspecionar em RAM ZIP/DEX/assets para presença de ciclo04, gravando somente booleanos/digests e nomes públicos. Ausentes/offline/unauthorized são PENDENTES, sem presumir binário. Nenhuma tela/entrada será alterada nesta fase.

Fases2–4: disponibilidade para interação solicitada antes de navegação, rotação, fullscreen ou abertura normal de app. Esperar confirmação para cada alvo; continuar identificação/coleta passiva independente enquanto pendente. Sem confirmação não injetar teclas/cliques/foco/start/stop. Quando autorizado, usar navegação real e streaming próprio existente; não mudar fonte/política/autoridade, não ultrapassar limites de telas por testes simultâneos involuntários. Testes de reprodução em dispositivos feitos sequencialmente e com acompanhamento. Não coletar URLs/títulos de catálogo sensíveis, credenciais, ativação ou conteúdo privado.

Instrumentação: somente ADB público/memória/CPU/framestats e CDP próprio de Runtime/Performance/input após disponibilidade. Sem Page.captureScreenshot/screencast/Emulation/viewport/escala/CSS/overrides nem captura que afete superfície. ADB forwards temporários no host serão removidos. Não limpar contadores/dados/logs. Logs brutos só em RAM, persistir eventos sanitizados permitidos. Relatar limitações de overhead. Gravação externa depende do usuário; rAF não certifica FPS na TV.

Sessões controladas mínimas10min quando disponíveis, Home/navegação/repouso/ciclos de espera e playing real, background/retorno e liberação. A espera1000ms é prazo de tentativa; não fabricar vídeo pronto nem10min contínuos de playing a partir de ciclos45s. Medir36 setas6direita6esquerda, vertical/repeat/reverso, âncora, paginação e rotas. Cada resultado PASS/FAIL/PENDENTE/INCONCLUSIVO e seu escopo. CPU por jiffies sem HZ presumido, app e renderer; PSS/Graphics próximos, percentis rAF/latência e HWUI delimitados sem misturar histórico.

Ciclo04 só será homologado se encontrado no APK instalado; caso03, registrar literalmente CONTROLE DE DADOS MÓVEIS: NÃO INCLUÍDO NESTE APK. Rede celular real e acompanhamento exigem disponibilidade explícita, sem troca automática de rede. Não classificar função ausente como falha. Falha grave/tela preta persistente/perda funcional encerra cenário afetado preservando evidência sanitizada; não corrigir ou fazer rollback neste gate.

Entrega: matriz por dispositivo, identidade/hash/cert/ciclos, funções realmente testadas, métricas reais e limites, trailer/playing, piscadas, dados móveis, defeitos/recomendações e pendências. Sem prometer60FPS, zero dados perdidos, flicker resolvido ou primeira instalação com base em amostra/cache. NEXT_GATE_STARTED=NAO.

## Disponibilidade confirmada pelo usuário

```json
{
  "userConfirmed": true,
  "fireStick": "Sim, Fire Stick disponível",
  "touchDevices": "Celular e tablet disponíveis",
  "scope": "Navegação automatizada e testes controlados, rotação e fullscreen; sem instalação, fonte, dados ou rollback",
  "cellularNetworkChangeAuthorized": false
}
```
