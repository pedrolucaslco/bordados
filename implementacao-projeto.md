
## Plan: Bordados POC — Implementação 1-2 semanas (Full Scope + Offline-first)

**TL;DR:** Estruturar projeto rapidamente com Setup (Fase 0) → Paralelizar CRUD operacional (Fase 1) → Agenda visual (Fase 2) → Produção & Materiais (Fase 3) → Pagamento + Dashboard + Deploy (Fases 4-6). Usar Dexie + fila de sync simples (last-write-wins) para validação rápida. **Tempo total: ~10-14 dias.**

### Steps

**FASE 0: Setup (1-2 dias) — BLOCKER**
1. Inicializar React+Vite+TypeScript com vite-plugin-pwa e structure de pastas
2. Criar SQL Supabase completo com RLS por `user_id` + seeds iniciais
3. Dexie schema + TypeScript types compartilhados  
4. Auth básico com Supabase (hook `useAuth`, proteção de rotas)

**FASE 1: Core Operacional (3-4 dias) — Parallelizável após 0.4**
1. CRUD Clientes (list/detail/create/edit + busca)
2. CRUD Produtos com categorias seed (*paralelo com 1.1*)
3. CRUD Pedidos (status: quote → awaiting_payment → in_production → ready → delivered)
4. CRUD Itens do Pedido (adicionar produtos ao pedido + cálculo de totais)
5. Fila de Sync (tabela `sync_queue` local, serviço `addToSyncQueue` + `processSyncQueue`) *com last-write-wins*
6. Auto-sync integrado (ao criar/editar, adiciona na fila; processa periodicamente 30s)

**FASE 2: Agenda Visual (2-3 dias) — Após 1.3**
1. Grid semanal (seg-dom) com colunas por dia
2. Cards de pedidos renderizados na data de entrega
3. Vista semana / Vista dia / Vista lista
4. Marcar pedido como "em produção"/"pronto"/"entregue" direto do card
5. Indicadores: cores por status, badges de atraso/pagamento pendente

**FASE 3: Produção + Materiais (2-3 dias) — Paralelo com Fase 2**
1. Etapas de produção com seed (Arte recebida → Bordado iniciado → Embalado)
2. Checklist por pedido em produção
3. CRUD Materiais (estoque total, estoque mínimo, disponível = total - reservado)
4. Compras de materiais (aumenta estoque total, atualiza custo médio)
5. Reserva de materiais por pedido (status: planned → reserved → consumed; alerta se insuficiente)

**FASE 4: Pagamento (1 dia) — Após 1.3**
1. Registrar pagamentos (formas: Cash, Pix, Cartão, etc)
2. Atualizar `paid_amount` + `payment_status` do pedido

**FASE 5: Dashboard (1 dia) — Após 1.x, 3.x, 4.x**
- Métricas: pedidos abertos, em produção, aguardando pagamento, concluídos (mês)
- Valor previsto / recebido
- Materiais com estoque baixo
- Próximas entregas

**FASE 6: Polimento + Deploy (1-2 dias) — Última**
1. Indicador online/offline + feedback de sync
2. Validação de formulários, error handling
3. Testar PWA offline em mobile
4. Deploy Vercel

### Relevant files
- bordados-poc-planejamento.md — Requisitos base (já lido)
- `/types/models.ts` — Tipos TypeScript (será criado em 0.3)
- `/services/db/schema.ts` — Dexie schema (será criado em 0.3)
- `/services/sync/sync.ts` — Fila de sync com last-write-wins (será criado em 1.5)
- `/pages/Calendar.tsx` — Agenda semanal (prioridade alta, coração da UX)
- `/pages/OrderDetail.tsx` — Core operacional (pedidos + itens)

### Verification

1. **Pós Fase 1:** App abre sem internet → criar pedido offline → ao conectar, sync automático funciona
2. **Pós Fase 2:** Agenda exibe pedidos corretos por data → marcar status direto do card
3. **Pós Fase 3:** Registrar compra incrementa estoque → reserva calcula disponível corretamente
4. **Pós Fase 6:** PWA installável, funciona 100% offline, sync automático sem erros

### Decisions
- **Offline-first desde dia 1:** Sync não-bloqueante com fila. Usuário sempre vê resposta imediata.
- **Last-write-wins simples:** Conflito resolution pragmático. Suficiente para validação.
- **Material alerta, não bloqueia:** MVP permite criar reserva mesmo com estoque baixo (apenas avisa).
- **Agenda é centro:** Semana visual é a tela principal da operação.
- **Sem uploads/WhatsApp/multiusuário complexo:** Fora do escopo para validação rápida.

### Further Considerations

1. **Estrutura de projeto pronta?** Vou criar scaffolding completo (Vite+PWA+Dexie+Auth) ou você quer começar do zero?
   - **Recomendação:** Eu crio scaffolding (setup de 0.1-0.4 integrado) para poupar 2-3 dias.

2. **SQL Supabase pronto?** Entrego SQL completo com RLS + seeds para você copiar direto no SQL Editor?
   - **Recomendação:** Sim, deixo documentado e pronto.

3. **Ordem de prioridade flexible?** Se cliente disser "preciso de X antes de Y", consigo reordenar fases.
   - **Recomendação:** Manter Fase 0 + 1 na ordem, depois flexibilizar 2-3 conforme feedback.