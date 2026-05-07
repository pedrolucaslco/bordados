import { create } from 'zustand'
import { db } from '@/services/db/schema'
import { addToSyncQueue } from '@/services/sync/sync'
import { useAuthStore } from '@/stores/auth'
import type { Material, MaterialCategory, MaterialPurchase, MaterialReservation } from '@/types/models'
import { todayLocalDate } from '@/utils/date'

export interface MaterialWithAvailability extends Material {
  reserved_stock: number
  available_stock: number
}

interface InventoryState {
  materials: MaterialWithAvailability[]
  categories: MaterialCategory[]
  purchases: MaterialPurchase[]
  reservations: MaterialReservation[]
  isLoading: boolean
  error: string | null
  fetchInventory: () => Promise<void>
  addMaterial: (material: Omit<Material, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateMaterial: (id: string, material: Partial<Material>) => Promise<void>
  deleteMaterial: (id: string) => Promise<void>
  addMaterialPurchase: (purchase: Omit<MaterialPurchase, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'unit_cost'>) => Promise<void>
  addReservation: (reservation: Omit<MaterialReservation, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateReservation: (id: string, reservation: Partial<MaterialReservation>) => Promise<void>
}

async function getMaterialsWithAvailability(): Promise<MaterialWithAvailability[]> {
  const [materials, reservations] = await Promise.all([
    db.materials.filter(material => !material.deleted_at).toArray(),
    db.material_reservations
      .filter(reservation => !reservation.deleted_at && reservation.status === 'reserved')
      .toArray(),
  ])

  return materials.map(material => {
    const reservedStock = reservations
      .filter(reservation => reservation.material_id === material.id)
      .reduce((sum, reservation) => sum + Number(reservation.quantity || 0), 0)

    return {
      ...material,
      reserved_stock: reservedStock,
      available_stock: Number(material.total_stock || 0) - reservedStock,
    }
  })
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  materials: [],
  categories: [],
  purchases: [],
  reservations: [],
  isLoading: false,
  error: null,

  fetchInventory: async () => {
    set({ isLoading: true, error: null })
    try {
      const [materials, categories, purchases, reservations] = await Promise.all([
        getMaterialsWithAvailability(),
        db.material_categories.filter(category => !category.deleted_at).sortBy('name'),
        db.material_purchases.filter(purchase => !purchase.deleted_at).reverse().sortBy('purchase_date'),
        db.material_reservations.filter(reservation => !reservation.deleted_at).toArray(),
      ])

      set({ materials, categories, purchases, reservations, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  addMaterial: async (materialData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const material: Material = {
      ...materialData,
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    }

    await db.materials.add(material)
    await addToSyncQueue('materials', id, 'create', material)
    await get().fetchInventory()
  },

  updateMaterial: async (id, materialData) => {
    const now = new Date().toISOString()
    await db.materials.update(id, {
      ...materialData,
      updated_at: now,
      sync_status: 'pending',
    })

    const updatedMaterial = await db.materials.get(id)
    if (updatedMaterial) {
      await addToSyncQueue('materials', id, 'update', updatedMaterial)
    }
    await get().fetchInventory()
  },

  deleteMaterial: async (id) => {
    const now = new Date().toISOString()
    await db.materials.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending',
    })
    await addToSyncQueue('materials', id, 'delete', null)
    await get().fetchInventory()
  },

  addMaterialPurchase: async (purchaseData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const material = await db.materials.get(purchaseData.material_id)
    if (!material) throw new Error('Material not found')

    const now = new Date().toISOString()
    const quantity = Number(purchaseData.quantity || 0)
    const totalCost = Number(purchaseData.total_cost || 0)
    const unitCost = quantity > 0 ? totalCost / quantity : 0
    const id = crypto.randomUUID()
    const purchase: MaterialPurchase = {
      ...purchaseData,
      id,
      user_id: userId,
      purchase_date: purchaseData.purchase_date || todayLocalDate(),
      unit_cost: unitCost,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    }

    const newTotalStock = Number(material.total_stock || 0) + quantity
    const currentStockValue = Number(material.total_stock || 0) * Number(material.average_cost || 0)
    const averageCost = newTotalStock > 0 ? (currentStockValue + totalCost) / newTotalStock : unitCost

    await db.material_purchases.add(purchase)
    await db.materials.update(material.id, {
      total_stock: newTotalStock,
      average_cost: averageCost,
      updated_at: now,
      sync_status: 'pending',
    })

    const updatedMaterial = await db.materials.get(material.id)
    await addToSyncQueue('material_purchases', id, 'create', purchase)
    if (updatedMaterial) {
      await addToSyncQueue('materials', material.id, 'update', updatedMaterial)
    }
    await get().fetchInventory()
  },

  addReservation: async (reservationData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const reservation: MaterialReservation = {
      ...reservationData,
      id,
      user_id: userId,
      reserved_at: reservationData.status === 'reserved' ? now : reservationData.reserved_at || null,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    }

    await db.material_reservations.add(reservation)
    await addToSyncQueue('material_reservations', id, 'create', reservation)
    await get().fetchInventory()
  },

  updateReservation: async (id, reservationData) => {
    const now = new Date().toISOString()
    const updateData = {
      ...reservationData,
      updated_at: now,
      sync_status: 'pending' as const,
    }

    if (reservationData.status === 'consumed') {
      Object.assign(updateData, { consumed_at: now })
    }
    if (reservationData.status === 'cancelled') {
      Object.assign(updateData, { cancelled_at: now })
    }

    await db.material_reservations.update(id, updateData)
    const updatedReservation = await db.material_reservations.get(id)
    if (updatedReservation) {
      await addToSyncQueue('material_reservations', id, 'update', updatedReservation)
    }
    await get().fetchInventory()
  },
}))
