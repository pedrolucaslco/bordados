import { create } from 'zustand'
import { db } from '@/services/db/schema'
import { addToSyncQueue } from '@/services/sync/sync'
import type { Client } from '@/types/models'
import { useAuthStore } from '@/stores/auth'

interface ClientsState {
  clients: Client[]
  isLoading: boolean
  error: string | null
  fetchClients: () => Promise<void>
  addClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateClient: (id: string, client: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  isLoading: false,
  error: null,

  fetchClients: async () => {
    set({ isLoading: true, error: null })
    try {
      const clients = await db.clients
        .filter((c) => !c.deleted_at)
        .reverse()
        .sortBy('updated_at')
      set({ clients, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addClient: async (clientData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    
    const newClient: Client = {
      ...clientData,
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending'
    }

    await db.clients.add(newClient)
    await addToSyncQueue('clients', id, 'create', newClient)
    
    get().fetchClients()
  },

  updateClient: async (id, clientData) => {
    const now = new Date().toISOString()
    
    await db.clients.update(id, {
      ...clientData,
      updated_at: now,
      sync_status: 'pending'
    })

    const updatedClient = await db.clients.get(id)
    if (updatedClient) {
      await addToSyncQueue('clients', id, 'update', updatedClient)
    }

    get().fetchClients()
  },

  deleteClient: async (id) => {
    const now = new Date().toISOString()
    
    await db.clients.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending'
    })

    await addToSyncQueue('clients', id, 'delete', null)

    get().fetchClients()
  }
}))
