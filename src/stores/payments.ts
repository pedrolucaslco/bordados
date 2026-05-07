import { create } from 'zustand'
import { db } from '@/services/db/schema'
import { recalculateOrderFinancials } from '@/services/orders/financials'
import { addToSyncQueue } from '@/services/sync/sync'
import { useAuthStore } from '@/stores/auth'
import type { Payment } from '@/types/models'
import { todayLocalDate } from '@/utils/date'

interface PaymentsState {
  payments: Payment[]
  isLoading: boolean
  error: string | null
  fetchPayments: (orderId: string) => Promise<Payment[]>
  addPayment: (payment: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  deletePayment: (id: string) => Promise<void>
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
  payments: [],
  isLoading: false,
  error: null,

  fetchPayments: async (orderId) => {
    set({ isLoading: true, error: null })
    try {
      const payments = await db.payments
        .where('order_id')
        .equals(orderId)
        .filter(payment => !payment.deleted_at)
        .reverse()
        .sortBy('payment_date')
      set({ payments, isLoading: false })
      return payments
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return []
    }
  },

  addPayment: async (paymentData) => {
    const userId = useAuthStore.getState().userId
    if (!userId) throw new Error('User not authenticated')

    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const payment: Payment = {
      ...paymentData,
      id,
      user_id: userId,
      payment_date: paymentData.payment_date || todayLocalDate(),
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    }

    await db.payments.add(payment)
    await addToSyncQueue('payments', id, 'create', payment)
    await recalculateOrderFinancials(payment.order_id)
    await usePaymentsStore.getState().fetchPayments(payment.order_id)
  },

  deletePayment: async (id) => {
    const payment = await db.payments.get(id)
    if (!payment) return

    const now = new Date().toISOString()
    await db.payments.update(id, {
      deleted_at: now,
      updated_at: now,
      sync_status: 'pending',
    })

    await addToSyncQueue('payments', id, 'delete', null)
    await recalculateOrderFinancials(payment.order_id)
    await usePaymentsStore.getState().fetchPayments(payment.order_id)
  },
}))
