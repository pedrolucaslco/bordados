import { db } from '@/services/db/schema'
import { addToSyncQueue } from '@/services/sync/sync'
import type { Order, PaymentStatus } from '@/types/models'

export function resolvePaymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return 'unpaid'
  if (paidAmount >= totalAmount && totalAmount > 0) return 'paid'
  return 'partially_paid'
}

export async function recalculateOrderFinancials(orderId: string): Promise<Order | null> {
  const order = await db.orders.get(orderId)
  if (!order || order.deleted_at) return null

  const [items, payments] = await Promise.all([
    db.order_items.where('order_id').equals(orderId).filter(item => !item.deleted_at).toArray(),
    db.payments.where('order_id').equals(orderId).filter(payment => !payment.deleted_at).toArray(),
  ])

  const totalAmount = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
  const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const remainingAmount = Math.max(totalAmount - paidAmount, 0)
  const paymentStatus = resolvePaymentStatus(totalAmount, paidAmount)
  const now = new Date().toISOString()

  await db.orders.update(orderId, {
    total_amount: totalAmount,
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,
    payment_status: paymentStatus,
    updated_at: now,
    sync_status: 'pending',
  })

  const updatedOrder = await db.orders.get(orderId)
  if (updatedOrder) {
    await addToSyncQueue('orders', orderId, 'update', updatedOrder)
  }

  return updatedOrder || null
}
