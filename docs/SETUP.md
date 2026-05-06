# Setup Guide — Bordados POC

## 1. Clone e instalar

```bash
cd /home/pedro/Development/bordados
npm install
```

## 2. Configurar Supabase

### Criar projeto
1. Vá para [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Escolha região (recomendado: us-east-1 ou sa-east-1)
4. Aguarde inicialização (~2 min)

### Executar migrations
1. Abra o projeto no Supabase
2. Vá para SQL Editor
3. Cole o conteúdo completo de `docs/sql-migration.sql`
4. Clique em "Run"

### Copiar credenciais
1. Vá para Project Settings → API
2. Copie a `Project URL` e `PUBLISHABLE` key
3. Crie `.env.local`:
   ```
   VITE_SUPABASE_URL=cole_aqui_a_url
   VITE_SUPABASE_PUBLISHABLE_KEY=cole_aqui_a_key
   ```

## 3. Rodar localmente

```bash
npm run dev
```

Abra http://localhost:5173

## 4. Criar conta test

Teste app com:
- Email: test@example.com
- Senha: Test123456! (mínimo 6 caracteres)

## 5. Como o offline-first funciona

Quando você cria um pedido:
1. Dados salvam **imediatamente** no IndexedDB (local)
2. UI mostra o pedido criado
3. Um item é adicionado na `sync_queue`
4. Cada 30s, app tenta sincronizar com Supabase
5. Quando sincronizado, `sync_status` muda para `synced`

Se estiver offline:
- Tudo funciona normal (tudo local)
- Quando reconectar, sync acontece automaticamente

## 6. Verificar sincronização

DevTools → Application → Indexed DB → bordados-db → sync_queue

Você verá items pendentes enquanto está sincing.

## 7. Deploy

```bash
npm run build
vercel deploy
```

Configure env vars no Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Troubleshooting

### "Erro de autenticação"
- Verificar que `.env.local` tem as credenciais corretas
- Confirmar que projeto Supabase existe e está ativo

### "Não consegue sincronizar"
- Abrir DevTools → Network
- Verificar requisições para `supabase.co`
- Ver se há CORS issues

### "Dados não aparecem"
- Abrir IndexedDB no DevTools
- Verificar se dados estão sendo salvos localmente
- Verificar se `sync_status` está correto

## Próximos passos

Após confirmar que o setup funciona:
1. Rodar `npm run dev`
2. Criar conta test
3. Testar criar um pedido
4. Verificar que dados sincronizam (check DevTools → Network)
5. Desconectar internet e criar outro pedido
6. Reconectar e verificar sync automático

---

Para mais detalhes, ver [README.md](../README.md)
