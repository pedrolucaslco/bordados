import { create } from 'zustand'
import { db } from '@/services/db/schema'
import { addToSyncQueue } from '@/services/sync/sync'
import { recalculateOrderFinancials } from '@/services/orders/financials'
import type { Order, OrderItem } from '@/types/models'
import { useAuthStore } from '@/stores/auth'

interface OrdersState {
  orders: Order[]
  orderItems: OrderItem[]
  isLoading: boolean
  error: string | null
  
  fetchOrders: () => Promise<void>
  fetchOrderItems: (orderId: string) => Promise<OrderItem[]>
  
  addOrder: (order: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<string>
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  recalculateOrderFinancials: (id: string) => Promise<Order | null>
  
  addOrderItem: (item: Omit<OrderItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateOrderItem: (id: string, item: Partial<OrderItem>) => Promise<void>
  deleteOrderItem: (id: string) => Promise<void>
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  orderItems: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const orders = await db.orders
        .filter(o => !o.deleted_at)
        .reverse()
        .sortBy('updated_at')
      set({ orders, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchOrderItems: async (orderId: string) => {
    try {
      const items = await db.order_items
        .where('order_id')
        .equals(orderId)
        .filter(i => !i.deleted_at)
        .toArray()
      return items
    } catch (error) {
      console.error('Failed to fetch order items', error)
      return []
    }
  },

  addOrder: async (orderData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    
    const newOrder: Order = {
      ...orderData,
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending'
    }

    await db.orders.add(newOrder)
    await addToSyncQueue('orders', id, 'create', newOrder)
    
    get().fetchOrders()
    return id
  },

  updateOrder: async (id, orderData) => {
    const now = new Date().toISOString()
    const currentOrder = await db.orders.get(id)
    const nextTotal = orderData.total_amount ?? currentOrder?.total_amount ?? 0
    const nextPaid = orderData.paid_amount ?? currentOrder?.paid_amount ?? 0
    
    await db.orders.update(id, {
      ...orderData,
      remaining_amount: Math.max(nextTotal - nextPaid, 0),
      updated_at: now,
      sync_status: 'pending'
    })

    const updatedOrder = await db.orders.get(id)
    if (updatedOrder) {
      await addToSyncQueue('orders', id, 'update', updatedOrder)
    }

    get().fetchOrders()
  },

  deleteOrder: async (id) => {
    const now = new Date().toISOString()
    
    await db.orders.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending'
    })

    await addToSyncQueue('orders', id, 'delete', null)

    get().fetchOrders()
  },

  addOrderItem: async (itemData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    
    const newItem: OrderItem = {
      ...itemData,
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending'
    }

    await db.order_items.add(newItem)
    await addToSyncQueue('order_items', id, 'create', newItem)
    await recalculateOrderFinancials(newItem.order_id)
  },

  updateOrderItem: async (id, itemData) => {
    const now = new Date().toISOString()
    
    await db.order_items.update(id, {
      ...itemData,
      updated_at: now,
      sync_status: 'pending'
    })

    const updatedItem = await db.order_items.get(id)
    if (updatedItem) {
      await addToSyncQueue('order_items', id, 'update', updatedItem)
      await recalculateOrderFinancials(updatedItem.order_id)
    }
  },

  deleteOrderItem: async (id) => {
    const now = new Date().toISOString()
    
    const existingItem = await db.order_items.get(id)

    await db.order_items.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending'
    })

    await addToSyncQueue('order_items', id, 'delete', null)
    if (existingItem) {
      await recalculateOrderFinancials(existingItem.order_id)
    }
  },

  recalculateOrderFinancials: async (id) => {
    const order = await recalculateOrderFinancials(id)
    await get().fetchOrders()
    return order
  }
}))
