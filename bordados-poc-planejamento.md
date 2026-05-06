# Bordados — Planejamento do Projeto POC

## 1. Visão Geral

**Bordados** é um PWA com experiência de app nativo, focado em gestão de pedidos/encomendas de bordados personalizados.

A aplicação será **offline-first**, permitindo uso completo sem internet, com sincronização automática com a nuvem via Supabase.

O projeto não deve tratar bordados como produtos genéricos. O negócio trabalha com produtos específicos, inicialmente:

- Bastidor 16cm
- Bastidor 20cm
- Ecobag bordada

A estrutura precisa permitir expansão futura para novos produtos, sem perder o controle operacional.

---

## 2. Objetivo do POC

Validar rapidamente:

- Experiência de app nativo usando PWA
- Funcionamento offline completo
- Cadastro e gestão de pedidos
- Controle de produtos específicos
- Agenda/calendário de entregas
- Controle de materiais disponíveis e reservados em produção
- Sincronização local → nuvem

---

## 3. Stack Tecnológica

### Frontend

- Vite
- React
- TypeScript
- Tailwind CSS
- DaisyUI
- vite-plugin-pwa

### Offline / Local DB

- IndexedDB
- Dexie

### Backend / Infra

- Supabase
  - Auth
  - Postgres
  - Realtime futuramente
  - Storage futuramente

### Deploy

- Vercel

---

## 4. Decisão de Framework

### React + Vite

Escolha atual para o app principal.

Motivos:

- App é client-side
- Melhor encaixe para offline-first
- Não depende de SSR
- Mais leve e direto para PWA
- Interface pode carregar rapidamente a partir do cache local

### Next.js

Pode ser usado futuramente apenas para:

- Landing page
- SEO
- Blog/documentação
- Checkout/assinatura

Não é necessário para o app principal neste POC.

---

## 5. Estratégia PWA e Performance

### Regra principal

A interface nunca deve depender do Supabase para abrir ou funcionar.

Fluxo esperado:

```txt
UI → IndexedDB → Renderização imediata
Sync → Supabase em background
```

### Estratégia

1. O app é buildado em arquivos estáticos.
2. O Service Worker cacheia os assets principais.
3. A UI carrega do cache local.
4. Os dados vêm primeiro do IndexedDB.
5. Supabase sincroniza em background.

### Resultado esperado

- Abre rapidamente
- Funciona offline
- Parece um app nativo
- Não bloqueia o usuário quando estiver sem internet

---

## 6. Estratégia Offline-First

### Fluxo de escrita

```txt
Usuário cria/edita dados
↓
Salva no IndexedDB
↓
Adiciona item na sync_queue
↓
Sync envia para Supabase
↓
Marca como sincronizado
```

### Estados de sincronização

- `pending`
- `synced`
- `error`

### Estratégia de conflito

Para o POC:

```txt
last_write_wins
```

Regra importante:

```txt
Nunca sobrescrever dados locais sem comparar updated_at.
```

---

## 7. Autenticação

- Supabase Auth
- Email + senha

Cada usuário deve enxergar apenas seus próprios dados.

Todas as tabelas principais devem possuir `user_id`.

---

## 8. Design System

Baseado em:

- Tailwind CSS
- DaisyUI

A interface deve ser simples, rápida e otimizada para uso diário em celular.

### Elementos visuais importantes

- Cores por status de pedido
- Badge de pagamento
- Indicador online/offline
- Indicador de sincronização
- Indicador de atraso
- Indicador de material insuficiente
- Cards de pedidos para visualização semanal

---

# 9. Módulos do Projeto

## 9.1 Dashboard

Tela inicial com visão rápida do negócio.

### Funcionalidades

- Total de pedidos abertos
- Pedidos em produção
- Pedidos aguardando pagamento
- Pedidos concluídos no mês
- Valor total previsto
- Valor já recebido
- Materiais com estoque baixo
- Pedidos atrasados
- Próximas entregas

---

## 9.2 Clientes

Cadastro dos clientes que fazem encomendas.

### Campos

- Nome
- WhatsApp
- Instagram
- Observações
- Endereço opcional

### Funcionalidades

- Criar cliente
- Editar cliente
- Ver histórico de pedidos
- Buscar por nome ou telefone

---

## 9.3 Produtos

Catálogo controlado dos produtos vendidos.

### Produtos iniciais

- Bastidor 16cm
- Bastidor 20cm
- Ecobag bordada

### Campos

- Nome
- Categoria
- Tamanho/variação
- Preço base
- Tempo médio de produção
- Ativo/inativo
- Observações

### Categorias iniciais

- Bastidor
- Ecobag

### Objetivo

Evitar que o app trate qualquer item como possível produto. O pedido deve ser baseado nos produtos reais que o negócio vende.

---

## 9.4 Pedidos / Encomendas

Módulo principal do app.

### Campos principais

- Cliente
- Data do pedido
- Data prevista de entrega
- Horário previsto de entrega opcional
- Status do pedido
- Status do pagamento
- Valor total
- Valor pago
- Valor restante
- Observações

### Status do pedido

- Orçamento
- Aguardando confirmação
- Aguardando pagamento
- Em produção
- Pronto
- Entregue
- Cancelado

### Funcionalidades

- Criar pedido
- Editar pedido
- Duplicar pedido
- Marcar como em produção
- Marcar como pronto
- Marcar como entregue
- Cancelar pedido
- Filtrar por status
- Filtrar por cliente
- Filtrar por prazo
- Buscar pedido

---

## 9.5 Itens do Pedido / Personalização

Cada pedido pode ter um ou mais itens vinculados a produtos cadastrados.

### Campos

- Produto
- Quantidade
- Texto a bordar
- Cores desejadas
- Tema/estilo
- Observações
- Valor unitário
- Valor final
- Referência visual futuramente

### Exemplo

```txt
Cliente: Maria
Produto: Bastidor 20cm
Personalização: nome + flores
Prazo: sexta-feira
Valor: R$ 85,00
Status: Em produção
```

---

## 9.6 Produção

Área para acompanhar o andamento real dos bordados.

### Funcionalidades

- Lista de pedidos em produção
- Checklist por pedido
- Marcar etapas concluídas
- Prioridade por prazo
- Ver materiais reservados para o pedido

### Etapas sugeridas

- Arte recebida
- Arte aprovada
- Material separado
- Bordado iniciado
- Bordado finalizado
- Revisado
- Embalado

---

## 9.7 Agenda / Calendário

Tela central para visualizar pedidos por prazo.

### Visualizações do POC

- Semana
- Dia
- Lista por prazo

### Futuro

- Calendário mensal
- Arrastar pedido entre dias
- Capacidade de produção por dia

### Visualização semanal

A visualização semanal deve exibir colunas por dia, com cards dos pedidos dentro da data de entrega.

### Card de pedido

Exemplo:

```txt
[Bastidor 20cm] Maria
Entrega: 16h
Status: Em produção
Pagamento: Entrada paga
```

### Funcionalidades

- Ver pedidos da semana
- Ver pedidos do dia
- Ver pedidos atrasados
- Clicar no card para abrir pedido
- Identificar status por cor
- Identificar pagamentos pendentes
- Identificar materiais insuficientes

---

## 9.8 Financeiro Simples

Não será um financeiro completo no POC. O foco é controlar o pagamento relacionado ao pedido.

### Campos

- Valor total
- Valor pago
- Valor restante
- Forma de pagamento
- Status do pagamento

### Status de pagamento

- Não pago
- Entrada paga
- Pago parcialmente
- Pago

### Funcionalidades

- Registrar entrada
- Registrar pagamento final
- Marcar como pago
- Ver pedidos com saldo pendente
- Total a receber
- Total recebido no mês

---

## 9.9 Inventário / Matérias-primas

Controle dos materiais usados na produção dos bordados.

O estoque não deve simplesmente reduzir automaticamente quando um pedido entra em produção. O controle principal deve diferenciar:

```txt
Estoque total
Reservado em produção
Disponível para novos pedidos
```

Cálculo:

```txt
Disponível = Estoque total - Reservado em produção
```

### Exemplos de materiais

- Bastidor 16cm
- Bastidor 20cm
- Tecido
- Linha branca
- Linha preta
- Linha colorida
- Agulhas
- Ecobag lisa
- Embalagens
- Etiquetas

### Campos

- Nome
- Categoria
- Unidade de medida
- Estoque total
- Estoque mínimo
- Custo médio
- Fornecedor
- Ativo/inativo

### Unidades possíveis

- unidade
- metro
- rolo
- pacote
- caixa
- grama

---

## 9.10 Compras de Materiais

Registro de entradas no estoque.

### Campos

- Material comprado
- Quantidade
- Valor total
- Valor unitário calculado
- Data da compra
- Fornecedor
- Observações

### Ao registrar uma compra

```txt
Estoque total aumenta
Custo médio pode ser recalculado
Histórico da compra fica salvo
```

---

## 9.11 Reserva de Materiais por Pedido

Quando um pedido entra em produção, o app deve registrar quais materiais serão usados e marcar como reservados.

### Exemplo

```txt
Material: Bastidor 20cm
Estoque total: 10
Reservado em produção: 3
Disponível: 7
```

### Estados dos materiais no pedido

- Planejado
- Reservado
- Consumido
- Cancelado/liberado

### Fluxo

```txt
Pedido criado
↓
Não altera estoque
↓
Pedido entra em produção
↓
Materiais são reservados
↓
Pedido é concluído
↓
Usuário confirma consumo
↓
Estoque total reduz
Reservado em produção reduz
```

### Regra do POC

Se o material disponível for menor que o necessário, o sistema deve alertar.

Para o POC, pode alertar sem bloquear.

---

## 9.12 Configurações

### Funcionalidades

- Dados do ateliê
- Nome da marca
- WhatsApp
- Moeda padrão
- Preferências de status
- Logout

---

# 10. Fluxos Principais

## 10.1 Novo pedido

```txt
Cliente
↓
Produto
↓
Personalização
↓
Prazo
↓
Valor
↓
Salvar
```

---

## 10.2 Iniciar produção

```txt
Pedido
↓
Marcar como Em produção
↓
Informar materiais planejados
↓
Reservar materiais
↓
Atualizar status
```

---

## 10.3 Finalizar produção

```txt
Pedido em produção
↓
Marcar como Pronto
↓
Confirmar consumo dos materiais
↓
Reduzir estoque total
↓
Reduzir reservado em produção
```

---

## 10.4 Registrar compra de material

```txt
Material
↓
Registrar compra
↓
Informar quantidade e valor
↓
Atualizar estoque total
↓
Atualizar custo médio
```

---

## 10.5 Entregar pedido

```txt
Pedido pronto
↓
Confirmar pagamento final, se houver
↓
Marcar como Entregue
```

---

# 11. Prioridade do POC

Ordem recomendada de implementação:

1. Estrutura do projeto
2. Banco local com Dexie
3. Produtos
4. Clientes
5. Pedidos
6. Itens personalizados do pedido
7. Agenda semanal
8. Materiais / Inventário
9. Compras de materiais
10. Reserva de materiais por pedido
11. Produção
12. Pagamento simples
13. Sync offline-first
14. Dashboard básico

Núcleo do app:

```txt
Produto → Cliente → Pedido → Personalização → Agenda → Materiais → Produção → Pagamento
```

---

# 12. Escopo que não entra no POC

Para evitar complexidade desnecessária no início:

- Upload de imagens
- Integração com WhatsApp
- Multiusuário complexo
- Financeiro completo
- Relatórios avançados
- Checkout/assinatura
- Landing page
- Calendário mensal avançado
- Permissões avançadas

---

# 13. Schema Base

Abaixo está uma proposta de schema base para usar tanto como referência no Dexie quanto no Supabase.

## 13.1 Convenções gerais

Todas as tabelas principais devem conter:

```ts
id: string // uuid
user_id: string
created_at: string
updated_at: string
deleted_at?: string | null
sync_status?: 'pending' | 'synced' | 'error'
```

No Supabase, `sync_status` pode ser opcional ou não existir, pois é mais útil localmente no IndexedDB.

---

## 13.2 users / profiles

Perfil do usuário autenticado.

```ts
type Profile = {
  id: string
  user_id: string
  name: string
  business_name?: string | null
  whatsapp?: string | null
  created_at: string
  updated_at: string
}
```

---

## 13.3 clients

Clientes que fazem encomendas.

```ts
type Client = {
  id: string
  user_id: string
  name: string
  whatsapp?: string | null
  instagram?: string | null
  address?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

---

## 13.4 product_categories

Categorias de produtos.

```ts
type ProductCategory = {
  id: string
  user_id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

Seeds iniciais:

```txt
Bastidor
Ecobag
```

---

## 13.5 products

Produtos vendidos.

```ts
type Product = {
  id: string
  user_id: string
  category_id?: string | null
  name: string
  variation?: string | null
  base_price: number
  average_production_days?: number | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

Seeds iniciais:

```txt
Bastidor 16cm
Bastidor 20cm
Ecobag bordada
```

---

## 13.6 orders

Pedidos/encomendas.

```ts
type OrderStatus =
  | 'quote'
  | 'awaiting_confirmation'
  | 'awaiting_payment'
  | 'in_production'
  | 'ready'
  | 'delivered'
  | 'cancelled'

type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'partially_paid'
  | 'paid'

type Order = {
  id: string
  user_id: string
  client_id: string
  order_number?: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  order_date: string
  due_date?: string | null
  due_time?: string | null
  total_amount: number
  paid_amount: number
  remaining_amount: number
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

---

## 13.7 order_items

Itens personalizados dentro de um pedido.

```ts
type OrderItem = {
  id: string
  user_id: string
  order_id: string
  product_id: string
  quantity: number
  embroidery_text?: string | null
  desired_colors?: string | null
  theme?: string | null
  notes?: string | null
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

---

## 13.8 production_steps

Etapas disponíveis para checklist de produção.

```ts
type ProductionStep = {
  id: string
  user_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

Seeds iniciais:

```txt
Arte recebida
Arte aprovada
Material separado
Bordado iniciado
Bordado finalizado
Revisado
Embalado
```

---

## 13.9 order_production_steps

Status das etapas de produção por pedido.

```ts
type OrderProductionStep = {
  id: string
  user_id: string
  order_id: string
  production_step_id: string
  is_completed: boolean
  completed_at?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

---

## 13.10 material_categories

Categorias de matérias-primas.

```ts
type MaterialCategory = {
  id: string
  user_id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

Exemplos:

```txt
Bastidores
Tecidos
Linhas
Agulhas
Embalagens
Ecobags
```

---

## 13.11 materials

Matérias-primas.

```ts
type MaterialUnit =
  | 'unit'
  | 'meter'
  | 'roll'
  | 'package'
  | 'box'
  | 'gram'

type Material = {
  id: string
  user_id: string
  category_id?: string | null
  name: string
  unit: MaterialUnit
  total_stock: number
  minimum_stock: number
  average_cost: number
  supplier?: string | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

### Campos calculados na UI

Esses dados não precisam necessariamente ser colunas físicas no banco. Podem ser calculados:

```ts
reserved_stock = soma das reservas com status 'reserved'
available_stock = total_stock - reserved_stock
```

---

## 13.12 material_purchases

Compras de materiais.

```ts
type MaterialPurchase = {
  id: string
  user_id: string
  material_id: string
  quantity: number
  total_cost: number
  unit_cost: number
  purchase_date: string
  supplier?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

Ao criar uma compra:

```txt
Incrementar total_stock do material
Recalcular average_cost, se necessário
Adicionar operação na sync_queue
```

---

## 13.13 material_reservations

Reserva de materiais para pedidos em produção.

```ts
type MaterialReservationStatus =
  | 'planned'
  | 'reserved'
  | 'consumed'
  | 'cancelled'

type MaterialReservation = {
  id: string
  user_id: string
  order_id: string
  order_item_id?: string | null
  material_id: string
  quantity: number
  status: MaterialReservationStatus
  reserved_at?: string | null
  consumed_at?: string | null
  cancelled_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

### Regras

- `planned`: material previsto, mas ainda não reservado.
- `reserved`: material comprometido com pedido em produção.
- `consumed`: material efetivamente consumido ao concluir produção.
- `cancelled`: reserva liberada.

### Cálculo de estoque

```txt
Estoque total = materials.total_stock
Reservado = soma material_reservations.quantity onde status = reserved
Disponível = Estoque total - Reservado
```

### Ao consumir material

```txt
materials.total_stock -= material_reservations.quantity
material_reservations.status = consumed
```

---

## 13.14 payments

Pagamentos vinculados aos pedidos.

```ts
type PaymentMethod =
  | 'cash'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'other'

type Payment = {
  id: string
  user_id: string
  order_id: string
  amount: number
  method: PaymentMethod
  payment_date: string
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  sync_status?: 'pending' | 'synced' | 'error'
}
```

Ao registrar pagamento:

```txt
Atualizar orders.paid_amount
Atualizar orders.remaining_amount
Atualizar orders.payment_status
```

---

## 13.15 sync_queue

Fila local de sincronização.

```ts
type SyncOperation = 'create' | 'update' | 'delete'

type SyncQueueItem = {
  id: string
  table_name: string
  record_id: string
  operation: SyncOperation
  payload: any
  status: 'pending' | 'processing' | 'synced' | 'error'
  error_message?: string | null
  retry_count: number
  created_at: string
  updated_at: string
}
```

Essa tabela é local no IndexedDB.

No Supabase, normalmente não precisa existir no POC.

---

# 14. Dexie Schema Sugerido

Exemplo inicial:

```ts
import Dexie, { Table } from 'dexie'

export class BordadosDB extends Dexie {
  clients!: Table<Client, string>
  product_categories!: Table<ProductCategory, string>
  products!: Table<Product, string>
  orders!: Table<Order, string>
  order_items!: Table<OrderItem, string>
  production_steps!: Table<ProductionStep, string>
  order_production_steps!: Table<OrderProductionStep, string>
  material_categories!: Table<MaterialCategory, string>
  materials!: Table<Material, string>
  material_purchases!: Table<MaterialPurchase, string>
  material_reservations!: Table<MaterialReservation, string>
  payments!: Table<Payment, string>
  sync_queue!: Table<SyncQueueItem, string>

  constructor() {
    super('bordados-db')

    this.version(1).stores({
      clients: 'id, user_id, name, whatsapp, updated_at, sync_status',
      product_categories: 'id, user_id, name, updated_at, sync_status',
      products: 'id, user_id, category_id, name, is_active, updated_at, sync_status',
      orders: 'id, user_id, client_id, status, payment_status, due_date, updated_at, sync_status',
      order_items: 'id, user_id, order_id, product_id, updated_at, sync_status',
      production_steps: 'id, user_id, sort_order, is_active, updated_at, sync_status',
      order_production_steps: 'id, user_id, order_id, production_step_id, is_completed, updated_at, sync_status',
      material_categories: 'id, user_id, name, updated_at, sync_status',
      materials: 'id, user_id, category_id, name, is_active, updated_at, sync_status',
      material_purchases: 'id, user_id, material_id, purchase_date, updated_at, sync_status',
      material_reservations: 'id, user_id, order_id, order_item_id, material_id, status, updated_at, sync_status',
      payments: 'id, user_id, order_id, payment_date, updated_at, sync_status',
      sync_queue: 'id, table_name, record_id, operation, status, created_at, updated_at'
    })
  }
}

export const db = new BordadosDB()
```

---

# 15. Supabase Schema Sugerido

## Observação

No Supabase, recomenda-se usar:

- UUID como primary key
- `user_id` vinculado ao `auth.users.id`
- RLS ativo
- `created_at` e `updated_at`
- Soft delete com `deleted_at`

---

## SQL base simplificado

```sql
create table public.clients (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  whatsapp text,
  instagram text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.product_categories (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.products (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.product_categories(id),
  name text not null,
  variation text,
  base_price numeric(10,2) not null default 0,
  average_production_days integer,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.orders (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id),
  order_number text,
  status text not null default 'quote',
  payment_status text not null default 'unpaid',
  order_date date not null default current_date,
  due_date date,
  due_time time,
  total_amount numeric(10,2) not null default 0,
  paid_amount numeric(10,2) not null default 0,
  remaining_amount numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.order_items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(10,2) not null default 1,
  embroidery_text text,
  desired_colors text,
  theme text,
  notes text,
  unit_price numeric(10,2) not null default 0,
  total_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.production_steps (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.order_production_steps (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  production_step_id uuid not null references public.production_steps(id),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.material_categories (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.materials (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.material_categories(id),
  name text not null,
  unit text not null default 'unit',
  total_stock numeric(10,2) not null default 0,
  minimum_stock numeric(10,2) not null default 0,
  average_cost numeric(10,2) not null default 0,
  supplier text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.material_purchases (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  quantity numeric(10,2) not null,
  total_cost numeric(10,2) not null,
  unit_cost numeric(10,2) not null,
  purchase_date date not null default current_date,
  supplier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.material_reservations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  material_id uuid not null references public.materials(id),
  quantity numeric(10,2) not null,
  status text not null default 'planned',
  reserved_at timestamptz,
  consumed_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.payments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(10,2) not null,
  method text not null default 'pix',
  payment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

---

# 16. RLS Supabase

Exemplo de política base para cada tabela:

```sql
alter table public.clients enable row level security;

create policy "Users can manage own clients"
on public.clients
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

A mesma lógica deve ser aplicada para:

- product_categories
- products
- orders
- order_items
- production_steps
- order_production_steps
- material_categories
- materials
- material_purchases
- material_reservations
- payments

---

# 17. Seeds Iniciais

## Produtos

```txt
Bastidor 16cm
Bastidor 20cm
Ecobag bordada
```

## Categorias de produto

```txt
Bastidor
Ecobag
```

## Categorias de material

```txt
Bastidores
Tecidos
Linhas
Agulhas
Embalagens
Ecobags
```

## Etapas de produção

```txt
Arte recebida
Arte aprovada
Material separado
Bordado iniciado
Bordado finalizado
Revisado
Embalado
```

## Status de pedido

```txt
Orçamento
Aguardando confirmação
Aguardando pagamento
Em produção
Pronto
Entregue
Cancelado
```

---

# 18. Telas Principais

## App Shell

- Menu inferior no mobile
- Navegação simples
- Indicador de conexão
- Indicador de sincronização

## Telas

1. Login
2. Dashboard
3. Agenda semanal
4. Pedidos
5. Detalhe do pedido
6. Novo pedido
7. Clientes
8. Produtos
9. Inventário
10. Detalhe do material
11. Registrar compra
12. Produção
13. Configurações

---

# 19. Regras de UX

## Agenda primeiro

A agenda semanal deve ser uma das principais telas do app, pois a operação depende dos prazos.

## Pedido como centro da operação

Tudo deve girar em torno do pedido:

```txt
Cliente
Produto
Personalização
Materiais
Produção
Pagamento
Entrega
```

## Estoque eficiente, não complexo

O estoque não precisa ser um ERP. Ele precisa responder rapidamente:

```txt
Tenho material disponível?
O que está reservado?
O que preciso comprar?
Quanto este pedido deve consumir?
```

---

# 20. Checklist antes de implementar

Antes de iniciar o código, validar:

- [ ] Nomes finais dos produtos iniciais
- [ ] Status finais dos pedidos
- [ ] Etapas finais de produção
- [ ] Materiais iniciais para seed
- [ ] Campos obrigatórios de pedido
- [ ] Visual principal da agenda semanal
- [ ] Regra de reserva de estoque
- [ ] Regra de consumo ao finalizar produção

---

# 21. Resumo Final

O POC deve validar o seguinte núcleo:

```txt
Produto → Cliente → Pedido → Personalização → Agenda → Materiais → Produção → Pagamento → Sync
```

A prioridade é criar um app simples, rápido e confiável para controlar encomendas de bordados, com funcionamento offline e controle eficiente de estoque disponível/reservado.
