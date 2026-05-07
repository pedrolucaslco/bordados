import { db } from '@/services/db/schema'
import { supabaseClient } from '@/services/supabase/client'
import * as Models from '@/types/models'
import type { Table } from 'dexie'

// Configuration for sync retry logic
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

interface SyncResult {
  success: boolean
  error?: string
  itemsProcessed?: number
}

/**
 * Add an operation to the sync queue for offline support
 */
export async function addToSyncQueue(
  tableName: string,
  recordId: string,
  operation: Models.SyncOperation,
  payload: any
): Promise<void> {
  const existingPending = await db.sync_queue
    .where('record_id')
    .equals(recordId)
    .filter((item) =>
      item.table_name === tableName &&
      item.operation === operation &&
      (item.status === 'pending' || item.status === 'processing')
    )
    .last()

  if (existingPending) {
    await db.sync_queue.update(existingPending.id, {
      payload,
      status: 'pending',
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    await markRecordAsPending(tableName, recordId)
    return
  }

  const id = `${Date.now()}-${Math.random()}`

  await db.sync_queue.add({
    id,
    table_name: tableName,
    record_id: recordId,
    operation,
    payload,
    status: 'pending',
    error_message: null,
    retry_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  // Immediately update the record's sync_status locally
  await markRecordAsPending(tableName, recordId)
}

/**
 * Mark a record as pending in the local database
 */
async function markRecordAsPending(
  tableName: string,
  recordId: string
): Promise<void> {
  const table = (db as any)[tableName] as Table
  if (table && recordId) {
    await table.update(String(recordId), {
      sync_status: 'pending',
      updated_at: new Date().toISOString(),
    })
  }
}

/**
 * Mark a record as synced in the local database
 */
async function markRecordAsSynced(
  tableName: string,
  recordId: string
): Promise<void> {
  const table = (db as any)[tableName] as Table
  if (table && recordId) {
    await table.update(String(recordId), {
      sync_status: 'synced',
      updated_at: new Date().toISOString(),
    })
  }
}

/**
 * Mark a record as error in the local database
 */
async function markRecordAsError(
  tableName: string,
  recordId: string
): Promise<void> {
  const table = (db as any)[tableName] as Table
  if (table && recordId) {
    await table.update(String(recordId), {
      sync_status: 'error',
      updated_at: new Date().toISOString(),
    })
  }
}

/**
 * Perform last-write-wins conflict resolution
 * Returns true if payload should be applied, false if remote version is newer
 */
async function resolveConflict(
  remoteRecord: any,
  localRecord: any
): Promise<boolean> {
  const remoteUpdated = new Date(remoteRecord.updated_at).getTime()
  const localUpdated = new Date(localRecord.updated_at).getTime()

  // Last write wins: if local is newer or equal, we win
  return localUpdated >= remoteUpdated
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: Models.SyncQueueItem): Promise<boolean> {
  try {
    await db.sync_queue.update(item.id, {
      status: 'processing',
      updated_at: new Date().toISOString(),
    })

    const table = item.table_name
    const recordId = item.record_id
    const { operation, payload } = item

    // Remove local-only fields from payload before sending to Supabase
    const remotePayload = payload ? { ...payload } : null
    if (!remotePayload && operation !== 'delete') {
      throw new Error(`Missing payload for ${operation} on ${table}/${recordId}`)
    }
    if (remotePayload) {
      delete remotePayload.sync_status
    }

    switch (operation) {
      case 'create': {
        console.log(`[SYNC] Executando UPSERT de CREATE para ${table}...`, remotePayload)
        const { error: insertError } = await supabaseClient
          .from(table)
          .upsert([remotePayload], { onConflict: 'id' })
        if (insertError) {
          console.error(`[SYNC] Erro no UPSERT: ${insertError.message}`)
          throw new Error(insertError.message)
        }
        break
      }

      case 'update': {
        console.log(`[SYNC] Executando UPDATE para ${table}/${recordId}...`)
        // Fetch remote record to check conflict using maybeSingle to avoid 406 on missing records
        const { data: remoteRecord, error: fetchError } = await supabaseClient
          .from(table)
          .select('*')
          .eq('id', String(recordId))
          .maybeSingle()

        if (fetchError) {
          console.error(`[SYNC] Erro ao buscar remoto: ${fetchError.message}`)
          throw new Error(fetchError.message)
        }

        if (remoteRecord && !(await resolveConflict(remoteRecord, remotePayload))) {
          // Remote is newer, don't update
          console.log(`[SYNC] Skipping update for ${table}/${recordId} - remote is newer`)
          break
        }

        const { error: updateError } = await supabaseClient
          .from(table)
          .update(remotePayload)
          .eq('id', String(recordId))
          
        if (updateError) {
          console.error(`[SYNC] Erro ao dar UPDATE no supabase: ${updateError.message}`)
          throw new Error(updateError.message)
        }
        break
      }

      case 'delete': {
        const { error: deleteError } = await supabaseClient
          .from(table)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', String(recordId))
          
        if (deleteError) throw new Error(deleteError.message)
        break
      }
    }

    // Mark as synced
    console.log(`[SYNC] Item ${item.id} processado com sucesso. Removendo da fila e marcando como synced.`)
    await markRecordAsSynced(table, recordId)

    // Remove from queue
    await db.sync_queue.delete(item.id)

    return true
  } catch (error) {
    console.error(`[SYNC ERROR] Falha no sync para ${item.table_name}/${item.record_id}:`, error)

    // Increment retry count
    const newRetryCount = (item.retry_count || 0) + 1

    if (newRetryCount < MAX_RETRIES) {
      // Retry later
      await db.sync_queue.update(item.id, {
        retry_count: newRetryCount,
        status: 'pending', // Voltar para pending
        updated_at: new Date().toISOString(),
      })
    } else {
      // Mark as error after max retries
      await markRecordAsError(item.table_name, item.record_id)
      await db.sync_queue.update(item.id, {
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
    }

    return false
  }
}

/**
 * Process the entire sync queue
 * This should be called periodically or after user actions
 */
export async function processSyncQueue(): Promise<SyncResult> {
  try {
    if (!navigator.onLine) {
      return { success: true, itemsProcessed: 0 }
    }

    console.log('[SYNC] Iniciando processamento da fila...')
    const staleProcessingCutoff = Date.now() - 5 * 60 * 1000
    const processingItems = await db.sync_queue
      .where('status')
      .equals('processing')
      .toArray()

    await Promise.all(
      processingItems
        .filter(item => new Date(item.updated_at).getTime() < staleProcessingCutoff)
        .map(item =>
          db.sync_queue.update(item.id, {
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
        )
    )

    const duplicateKeyErrorItems = await db.sync_queue
      .where('status')
      .equals('error')
      .filter(item => item.error_message?.includes('duplicate key value') ?? false)
      .toArray()

    await Promise.all(
      duplicateKeyErrorItems.map(async item => {
        await db.sync_queue.update(item.id, {
          status: 'pending',
          error_message: null,
          retry_count: 0,
          updated_at: new Date().toISOString(),
        })
        await markRecordAsPending(item.table_name, item.record_id)
      })
    )

    const pendingItems = await db.sync_queue
      .where('status')
      .equals('pending')
      .toArray()

    console.log(`[SYNC] Encontrados ${pendingItems.length} itens para sincronizar.`)

    if (pendingItems.length === 0) {
      return { success: true, itemsProcessed: 0 }
    }

    let processed = 0
    for (const item of pendingItems) {
      console.log(`[SYNC] Processando item ${item.id} (Tabela: ${item.table_name}, Operação: ${item.operation})`)
      const result = await processSyncItem(item)
      console.log(`[SYNC] Resultado do item ${item.id}: ${result ? 'Sucesso' : 'Falha'}`)
      if (result) processed++
      // Add small delay between items to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    }

    return { success: true, itemsProcessed: processed }
  } catch (error) {
    console.error('Sync queue processing failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch data from Supabase and merge with local database
 * This is called on app startup or when online status changes
 */
export async function syncFromRemote(
  tableName: string,
  userId: string
): Promise<void> {
  try {
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    if (!data) return

    const table = (db as any)[tableName] as Table

    // Merge strategy: if record doesn't exist locally, add it
    // If it exists and is not marked as pending, update if remote is newer
    for (const remoteRecord of data) {
      const existingLocal = await table.get(remoteRecord.id)

      if (!existingLocal) {
        // New record from remote
        await table.add({
          ...remoteRecord,
          sync_status: 'synced',
        })
      } else if (
        existingLocal.sync_status !== 'pending' &&
        existingLocal.sync_status !== 'error'
      ) {
        // Only update if local is not pending/error
        const remoteTime = new Date(remoteRecord.updated_at).getTime()
        const localTime = new Date(existingLocal.updated_at).getTime()

        if (remoteTime > localTime) {
          await table.update(remoteRecord.id, {
            ...remoteRecord,
            sync_status: 'synced',
          })
        }
      }
    }
  } catch (error) {
    console.error(`Failed to sync from remote for ${tableName}:`, error)
  }
}

/**
 * Get pending sync items count
 */
export async function getPendingSyncCount(): Promise<number> {
  return db.sync_queue
    .where('status')
    .anyOf(['pending', 'processing'])
    .count()
}
