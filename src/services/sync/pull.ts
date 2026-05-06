import { db } from '../db/schema'
import { supabaseClient } from '../supabase/client'
import { SyncStatus } from '@/types/models'

export async function clearLocalDatabase() {
  console.log('[SYNC] Cleaning local database...')
  await Promise.all(
    db.tables.map(table => table.clear())
  )
  console.log('[SYNC] Local database cleared.')
}

export async function pullInitialData(userId: string) {
  console.log('[SYNC] Starting initial pull from Supabase for user:', userId)
  
  // Only pull from tables that exist both locally and remotely
  // Excluding sync_queue as it's local only
  const tablesToPull = [
    'clients',
    'product_categories',
    'products',
    'orders',
    'order_items',
    'production_steps',
    'order_production_steps',
    'material_categories',
    'materials',
    'material_purchases',
    'material_reservations',
    'payments'
  ]
  
  const fetchPromises = tablesToPull.map(async (tableName) => {
    try {
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        
      if (error) {
        console.error(`[SYNC] Error pulling data for ${tableName}:`, error.message)
        return { tableName, data: [] }
      }
      
      return { tableName, data: data || [] }
    } catch (err) {
      console.error(`[SYNC] Exception pulling data for ${tableName}:`, err)
      return { tableName, data: [] }
    }
  })
  
  const results = await Promise.all(fetchPromises)
  
  let totalPulled = 0
  
  // Save pulled data to Dexie
  for (const result of results) {
    if (result.data.length > 0) {
      const items = result.data.map(item => ({
        ...item,
        sync_status: 'synced' as SyncStatus
      }))
      
      // @ts-ignore - dynamic table access
      const table = db[result.tableName]
      if (table) {
        await table.bulkPut(items)
        totalPulled += items.length
      }
    }
  }
  
  console.log(`[SYNC] Initial pull finished. ${totalPulled} records saved locally.`)
}
