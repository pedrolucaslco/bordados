import { create } from 'zustand'
import { db } from '@/services/db/schema'
import { addToSyncQueue } from '@/services/sync/sync'
import { useAuthStore } from '@/stores/auth'
import type { OrderProductionStep, ProductionStep } from '@/types/models'

interface ProductionState {
  steps: ProductionStep[]
  orderSteps: OrderProductionStep[]
  isLoading: boolean
  error: string | null
  fetchSteps: () => Promise<void>
  fetchOrderSteps: (orderId: string) => Promise<OrderProductionStep[]>
  ensureOrderSteps: (orderId: string) => Promise<OrderProductionStep[]>
  toggleOrderStep: (orderStepId: string, isCompleted: boolean) => Promise<void>
}

export const useProductionStore = create<ProductionState>((set, get) => ({
  steps: [],
  orderSteps: [],
  isLoading: false,
  error: null,

  fetchSteps: async () => {
    set({ isLoading: true, error: null })
    try {
      const steps = await db.production_steps
        .filter(step => !step.deleted_at && step.is_active)
        .sortBy('sort_order')
      set({ steps, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchOrderSteps: async (orderId) => {
    const orderSteps = await db.order_production_steps
      .where('order_id')
      .equals(orderId)
      .filter(step => !step.deleted_at)
      .toArray()
    set({ orderSteps })
    return orderSteps
  },

  ensureOrderSteps: async (orderId) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    await get().fetchSteps()
    const steps = useProductionStore.getState().steps
    const existing = await get().fetchOrderSteps(orderId)
    const existingStepIds = new Set(existing.map(step => step.production_step_id))
    const now = new Date().toISOString()
    const missingSteps: OrderProductionStep[] = steps
      .filter(step => !existingStepIds.has(step.id))
      .map(step => ({
        id: crypto.randomUUID(),
        user_id: userId,
        order_id: orderId,
        production_step_id: step.id,
        is_completed: false,
        completed_at: null,
        created_at: now,
        updated_at: now,
        sync_status: 'pending',
      }))

    if (missingSteps.length > 0) {
      await db.order_production_steps.bulkAdd(missingSteps)
      await Promise.all(missingSteps.map(step =>
        addToSyncQueue('order_production_steps', step.id, 'create', step)
      ))
    }

    return get().fetchOrderSteps(orderId)
  },

  toggleOrderStep: async (orderStepId, isCompleted) => {
    const now = new Date().toISOString()
    await db.order_production_steps.update(orderStepId, {
      is_completed: isCompleted,
      completed_at: isCompleted ? now : null,
      updated_at: now,
      sync_status: 'pending',
    })

    const updatedStep = await db.order_production_steps.get(orderStepId)
    if (updatedStep) {
      await addToSyncQueue('order_production_steps', orderStepId, 'update', updatedStep)
      await get().fetchOrderSteps(updatedStep.order_id)
    }
  },
}))
