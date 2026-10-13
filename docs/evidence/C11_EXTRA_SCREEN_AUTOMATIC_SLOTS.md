# C87 — Slots automáticos por conferência de telas adicionais

12/10/2026. Preflight workspace independente C11/top-level/origin/main/HEAD `61ec00902be5d0037adf79c68b3a8624b3a2bd6e` confirmado. Baseline de 912 arquivos sem segredos, estado cumulativo anterior preservado. C87 direto, sem próximo Gate/Git/APK/instalação. Skills Supabase, Postgres Best Practices, React Best Practices e Verification aplicadas dentro do escopo autorizado.

## Diagnóstico

Consulta somente leitura ao projeto `cujbmyhitgomlgwfkaat`: principal XF-ZARA-9ENF, cliente ALEXANDRE, papel PRIMARY, capacidade 4, concorrência 4, quatro vínculos ativos, zero telas adicionais conferidas. O formulário C85 registrava autorização de pagamento sem aumentar `maxDevices`. Ao selecionar destino em outra licença, slots eram corretamente calculados pela capacidade daquela conta, que ainda era 4.

## Resultado

Conferência marcada e total válido calculam capacidade `max(capacidade vigente, 4 + total adicional)`, refletida no campo de quantidade em leitura e nos slots do rascunho. O total é cumulativo, não uma nova parcela a somar em cada salvamento. Desmarcar restaura edição manual. Motivo, referência, confirmação e principal continuam obrigatórios antes do salvamento único. Concorrência permanece independente; pode ser ajustada pelo gestor até o limite da conta/50.

Destino em outra licença oferece Editar capacidade do principal, com aviso explícito de descarte dos rascunhos de origem. Usa o editor existente dessa licença; não aumenta licença alheia pelo vínculo ou pela conferência da conta de origem. Sem alteração de RPC/schema/Edge ou preços.

## Verificação

- Browser headless com AdminLicensesView/ManagerLicenseEditor reais e autoridade sintética: desktop 1507×900/mobile390×844; registrar uma extra prepara 5 sem edição manual, checkbox de pagamento bloqueia antes de confirmar, quantidade calculada readonly, slot5 disponível no rascunho, concorrência inicialmente4 e editável para5.
- Salvamento com 1 extra persistiu capacidade5, uma chamada por ação; repetição do total manteve5; total2 criou6. Totais 0/-1/decimal/97/vazio negados; pendências e contorno preservados; desmarcar restaura4; principal ausente bloqueia; falha remota mantém rascunho/retry.
- Atalho navegou para Cliente destino e salvou capacidade5 naquela licença, preservando capacidade4 da origem. Sem mutation ao apenas navegar.
- SQL real no projeto autorizado, fixtures aleatórias dentro de BEGIN/ROLLBACK: quatro aparelhos ocupam conta; quinto negado antes da liberação; prova não confirmada nega salvamento sem writes; edição atômica com uma extra cria capacidade5; reenvio não duplica prova/vagas; quinto recebe slot5/SECONDARY/mesma fonte/código/token preservados. Total2 cria6; slot5 duplicado é negado sem transferência parcial; sexto recebe slot6.
- Marcador SQL `C87_FULL_FOUR_PAID_FIFTH_CUMULATIVE_SIXTH_SAME_SOURCE_IDENTITY_ROLLBACK_DUPLICATE_SLOT_PASS`. Consulta posterior confirmou zero dispositivos de teste remanescentes e conta real ainda com capacidade4/prova0. Sem modificação real de dados de cliente.
- Typecheck/build normal/Activation Lock PASS; regressão C85 cliente/RPC/Edge/AES/retorno três grupos PASS. Compilação privada com VITE_DEBUG_BUILD=true verifica também o Gestor, retirado por tree shaking no build normal. Screenshots desktop/mobile inspecionados. Relatórios/logs/baseline privados em `tmp/c87-extra-screen-automatic-slots/`.
- Revisão React: cálculo derivado durante render sem efeito/sincronização duplicada; quantidade lida pela mesma validação/payload/slots; nova navegação reutiliza instância por chave, callbacks tipados, sem endpoint novo. Fronteiras UI→payload→RPC→capacidade/vínculo→resposta cobertas por browser sintético e SQL real separadamente, sem alegar submissão autenticada pelo browser ao banco real.

Instrumentação corrigida: espera do término assíncrono do salvamento antes da próxima conferência, quoting de seletor no harness; teste SQL renomeou variável `devices` para `fixture_devices` após erro de ambiguidade com a tabela. Tentativa SQL falha sem commit, teste final revertido. Warning preexistente de tamanho de bundle. Patch inicial rejeitado por escaping de contexto antes de modificar arquivos, reaplicado com contexto exato.

Frontend local. Nenhuma publicação/instalação ou teste de reprodução física. NEXT_GATE_STARTED=NAO.
