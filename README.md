# Bordados POC - PWA para Gestão de Pedidos de Bordados

App offline-first com React + Vite + PWA, usando Dexie para dados locais e Supabase para sync.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, DaisyUI
- **Offline DB:** Dexie + IndexedDB
- **Sync:** Fila de sincronização com last-write-wins
- **Backend:** Supabase (Auth, Postgres)
- **PWA:** vite-plugin-pwa com service worker

## Setup

1. **Clonar e instalar dependências**
   ```bash
   npm install
   ```

2. **Configurar Supabase**
   - Criar novo projeto no [supabase.com](https://supabase.com)
   - Copiar as credenciais (URL e anon key)
   - Colar em `.env.local`:
     ```
     VITE_SUPABASE_URL=sua_url
     VITE_SUPABASE_PUBLISHABLE_KEY=sua_key
     ```
   - Executar SQL migration (ver instruções em `docs/sql-migration.sql`)

3. **Rodar em desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Build para produção**
   ```bash
   npm run build
   ```

## Estrutura de Pastas

```
src/
├── components/        # Componentes React reutilizáveis
├── pages/            # Páginas principais (Auth, Dashboard, Orders, etc)
├── services/         # Lógica de negócio
│   ├── db/          # Dexie queries
│   ├── sync/        # Sincronização offline-first
│   └── supabase/    # Client Supabase
├── stores/          # Zustand state management
├── hooks/           # React hooks customizados
├── types/           # TypeScript types
├── utils/           # Helpers
├── styles/          # CSS global e Tailwind
└── sw.ts            # Service Worker
```

## Desenvolvimento

### Adicionar novo recurso (ex: Clientes)

1. **Tipos** (`src/types/models.ts`) - Já existe como `Client`
2. **Dexie** - Já existe em `src/services/db/schema.ts`
3. **Service** - Criar `src/services/db/clients.ts`:
   ```typescript
   import { db } from './schema'
   import { Client } from '@/types/models'

   export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'sync_status'>) {
     const id = crypto.randomUUID()
     const now = new Date().toISOString()
     const newClient = { ...client, id, created_at: now, updated_at: now, sync_status: 'pending' as const }
     await db.clients.add(newClient)
     await addToSyncQueue('clients', id, 'create', newClient)
     return newClient
   }
   ```
4. **Página/Componente** - Criar em `src/pages/` ou `src/components/`
5. **SQL** - Adicionar tabela no Supabase

### Offline-First Pattern

Toda operação segue este padrão:

```
Usuário cria/edita
  ↓
Salva no IndexedDB (sync_status = 'pending')
  ↓
Adiciona na sync_queue
  ↓
UI mostra resultado imediato
  ↓
Quando online, sync envia para Supabase
  ↓
Marca como 'synced'
```

## Deploy

### Vercel

```bash
npm run build
vercel deploy
```

Ao fazer deploy, configure as env vars no Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Troubleshooting

### "Cannot find module '@/...'"
Verificar que `tsconfig.json` tem o path alias configurado.

### Supabase auth não funciona
Confirmar que as env vars estão certas e o projeto Supabase existe.

### Sync não está funcionando
- Verificar se tem internet
- Abrir DevTools → Application → Indexed DB → bordados-db → sync_queue
- Ver se tem itens pendentes

## Roadmap

- [x] Setup Vite + React + TypeScript + PWA
- [x] Dexie schema + tipos
- [x] Auth com Supabase
- [x] Fila de sync offline-first
- [ ] CRUD de clientes
- [ ] CRUD de produtos
- [ ] CRUD de pedidos
- [ ] Agenda semanal visual
- [ ] Produção + checklist
- [ ] Inventário de materiais
- [ ] Dashboard

## License

MIT
