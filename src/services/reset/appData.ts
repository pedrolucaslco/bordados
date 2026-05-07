import { db } from '@/services/db/schema'
import { setInitialDataSeedDisabled } from '@/services/seed/initialData'
import { supabaseClient } from '@/services/supabase/client'
import type { Table } from 'dexie'

const USER_DATA_TABLES = [
  'payments',
  'material_reservations',
  'order_production_steps',
  'order_items',
  'material_purchases',
  'orders',
  'materials',
  'material_categories',
  'products',
  'product_categories',
  'production_steps',
  'clients',
] as const

async function deleteRemoteUserData(userId: string): Promise<void> {
  for (const tableName of USER_DATA_TABLES) {
    const { error } = await supabaseClient
      .from(tableName)
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Falha ao limpar ${tableName}: ${error.message}`)
    }
  }
}

async function deleteLocalUserData(userId: string): Promise<void> {
  for (const tableName of USER_DATA_TABLES) {
    const table = (db as any)[tableName] as Table<any, string>
    const ids = await table
      .where('user_id')
      .equals(userId)
      .primaryKeys()

    if (ids.length > 0) {
      await table.bulkDelete(ids as string[])
    }
  }

  const queueIds = await db.sync_queue
    .filter(item => item.payload?.user_id === userId)
    .primaryKeys()

  if (queueIds.length > 0) {
    await db.sync_queue.bulkDelete(queueIds as string[])
  }
}

export async function resetApplicationData(userId: string): Promise<void> {
  if (!navigator.onLine) {
    throw new Error('Conecte-se à internet para limpar também os dados remotos.')
  }

  await deleteRemoteUserData(userId)
  await deleteLocalUserData(userId)
  setInitialDataSeedDisabled(userId, true)
}
