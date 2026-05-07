import { db } from '@/services/db/schema'
import { recalculateOrderFinancials } from '@/services/orders/financials'
import { ensureInitialData, setInitialDataSeedDisabled } from '@/services/seed/initialData'
import { addToSyncQueue } from '@/services/sync/sync'
import type {
  Client,
  Material,
  MaterialPurchase,
  MaterialReservation,
  Order,
  OrderItem,
  OrderProductionStep,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '@/types/models'
import { addLocalDays, todayLocalDate } from '@/utils/date'

interface DemoOrderTemplate {
  clientIndex: number
  status: Order['status']
  dueOffset: number
  paidRatio: number
  paymentMethod: PaymentMethod
  notes: string
  itemIndexes: number[]
  completedSteps: number
}

export interface DemoDataResult {
  clients: number
  orders: number
  orderItems: number
  payments: number
  materials: number
  reservations: number
}

function nowIso() {
  return new Date().toISOString()
}

function demoId() {
  return crypto.randomUUID()
}

function makeBaseRecord(userId: string) {
  const now = nowIso()
  return {
    id: demoId(),
    user_id: userId,
    created_at: now,
    updated_at: now,
    sync_status: 'pending' as const,
  }
}

async function enqueueMany<T extends { id: string }>(tableName: string, records: T[]) {
  await Promise.all(records.map(record => addToSyncQueue(tableName, record.id, 'create', record)))
}

function resolvePaymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return 'unpaid'
  if (paidAmount >= totalAmount) return 'paid'
  return paidAmount <= totalAmount * 0.35 ? 'deposit_paid' : 'partially_paid'
}

export async function generateDemoData(userId: string): Promise<DemoDataResult> {
  setInitialDataSeedDisabled(userId, false)
  await ensureInitialData(userId)

  const today = todayLocalDate()
  const batch = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const clients: Client[] = [
    {
      ...makeBaseRecord(userId),
      name: 'Marina Alves',
      whatsapp: '8599999-0101',
      instagram: '@marina.alves',
      address: 'Rua das Flores, 120',
      notes: `Cliente demo gerado em ${batch}`,
    },
    {
      ...makeBaseRecord(userId),
      name: 'Casa Aurora',
      whatsapp: '8599999-0202',
      instagram: '@casaaurora',
      address: 'Av. Beira Mar, 800',
      notes: `Cliente demo gerado em ${batch}`,
    },
    {
      ...makeBaseRecord(userId),
      name: 'Lia Menezes',
      whatsapp: '8599999-0303',
      instagram: '@liamenezes',
      address: 'Rua Pedro Borges, 45',
      notes: `Cliente demo gerado em ${batch}`,
    },
    {
      ...makeBaseRecord(userId),
      name: 'Atelie Flor de Linha',
      whatsapp: '8599999-0404',
      instagram: '@flordelinha',
      address: 'Centro Comercial, loja 12',
      notes: `Cliente demo gerado em ${batch}`,
    },
    {
      ...makeBaseRecord(userId),
      name: 'Bianca Rocha',
      whatsapp: '8599999-0505',
      instagram: '@biancarocha',
      address: 'Rua dos Tabajaras, 312',
      notes: `Cliente demo gerado em ${batch}`,
    },
  ]

  await db.clients.bulkAdd(clients)
  await enqueueMany('clients', clients)

  const products = await db.products
    .where('user_id')
    .equals(userId)
    .filter(product => !product.deleted_at)
    .toArray()
  if (products.length === 0) {
    throw new Error('Nenhum produto disponivel para criar pedidos de demonstracao.')
  }
  const usableProducts = products

  const materialCategories = await db.material_categories
    .where('user_id')
    .equals(userId)
    .filter(category => !category.deleted_at)
    .toArray()
  const categoryByName = (name: string) => materialCategories.find(category => category.name.toLowerCase() === name.toLowerCase())?.id || null

  const materials: Material[] = [
    {
      ...makeBaseRecord(userId),
      category_id: categoryByName('Linhas'),
      name: `Linha mouliné rose demo ${batch}`,
      unit: 'unit',
      total_stock: 18,
      minimum_stock: 6,
      average_cost: 3.2,
      supplier: 'Armarinho Central',
      is_active: true,
      notes: 'Material de demonstração',
    },
    {
      ...makeBaseRecord(userId),
      category_id: categoryByName('Linhas'),
      name: `Linha verde oliva demo ${batch}`,
      unit: 'unit',
      total_stock: 10,
      minimum_stock: 5,
      average_cost: 3.2,
      supplier: 'Armarinho Central',
      is_active: true,
      notes: 'Material de demonstração',
    },
    {
      ...makeBaseRecord(userId),
      category_id: categoryByName('Bastidores'),
      name: `Bastidor madeira 20cm demo ${batch}`,
      unit: 'unit',
      total_stock: 6,
      minimum_stock: 4,
      average_cost: 12,
      supplier: 'Madeiras & Cia',
      is_active: true,
      notes: 'Material de demonstração',
    },
    {
      ...makeBaseRecord(userId),
      category_id: categoryByName('Ecobags'),
      name: `Ecobag cru demo ${batch}`,
      unit: 'unit',
      total_stock: 4,
      minimum_stock: 5,
      average_cost: 14,
      supplier: 'Têxtil Norte',
      is_active: true,
      notes: 'Material de demonstração com estoque baixo',
    },
  ]

  await db.materials.bulkAdd(materials)
  await enqueueMany('materials', materials)

  const purchases: MaterialPurchase[] = materials.map(material => ({
    ...makeBaseRecord(userId),
    material_id: material.id,
    quantity: material.total_stock,
    total_cost: material.total_stock * material.average_cost,
    unit_cost: material.average_cost,
    purchase_date: addLocalDays(today, -5),
    supplier: material.supplier || null,
    notes: 'Compra inicial de demonstração',
  }))

  await db.material_purchases.bulkAdd(purchases)
  await enqueueMany('material_purchases', purchases)

  const orderTemplates: DemoOrderTemplate[] = [
    {
      clientIndex: 0,
      status: 'quote',
      dueOffset: 10,
      paidRatio: 0,
      paymentMethod: 'pix',
      notes: 'Orçamento para presente de maternidade',
      itemIndexes: [0],
      completedSteps: 0,
    },
    {
      clientIndex: 1,
      status: 'awaiting_payment',
      dueOffset: 3,
      paidRatio: 0.3,
      paymentMethod: 'bank_transfer',
      notes: 'Pedido corporativo com sinal recebido',
      itemIndexes: [2, 1],
      completedSteps: 1,
    },
    {
      clientIndex: 2,
      status: 'in_production',
      dueOffset: 6,
      paidRatio: 0.5,
      paymentMethod: 'pix',
      notes: 'Bordado floral em produção',
      itemIndexes: [1],
      completedSteps: 2,
    },
    {
      clientIndex: 3,
      status: 'ready',
      dueOffset: 0,
      paidRatio: 1,
      paymentMethod: 'credit_card',
      notes: 'Pedido pronto para retirada',
      itemIndexes: [0, 2],
      completedSteps: 3,
    },
    {
      clientIndex: 4,
      status: 'delivered',
      dueOffset: -4,
      paidRatio: 1,
      paymentMethod: 'cash',
      notes: 'Pedido entregue e pago',
      itemIndexes: [2],
      completedSteps: 3,
    },
    {
      clientIndex: 0,
      status: 'in_production',
      dueOffset: -1,
      paidRatio: 0,
      paymentMethod: 'pix',
      notes: 'Pedido atrasado para testar alertas',
      itemIndexes: [1, 0],
      completedSteps: 1,
    },
  ]

  const orders: Order[] = []
  const orderItems: OrderItem[] = []
  const payments: Payment[] = []
  const reservations: MaterialReservation[] = []
  const productionRecords: OrderProductionStep[] = []
  const productionSteps = await db.production_steps
    .where('user_id')
    .equals(userId)
    .filter(step => !step.deleted_at && step.is_active)
    .sortBy('sort_order')

  orderTemplates.forEach((template, orderIndex) => {
    const orderId = demoId()
    const selectedItems = template.itemIndexes.map((productIndex, itemIndex) => {
      const product = usableProducts[productIndex % usableProducts.length]
      const quantity = itemIndex + 1
      const unitPrice = product?.base_price || 50
      const item: OrderItem = {
        ...makeBaseRecord(userId),
        id: demoId(),
        order_id: orderId,
        product_id: product?.id || '',
        quantity,
        embroidery_text: itemIndex === 0 ? ['Luna', 'Aurora', 'Jardim', 'Bem-vindo', 'Sol'][orderIndex] : null,
        desired_colors: null,
        theme: ['floral', 'minimalista', 'botânico', 'infantil', 'praia'][orderIndex] || 'livre',
        notes: 'Item de demonstração',
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
      }
      return item
    })

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.total_price, 0)
    const paidAmount = Math.round(totalAmount * template.paidRatio * 100) / 100
    const order: Order = {
      ...makeBaseRecord(userId),
      id: orderId,
      client_id: clients[template.clientIndex].id,
      order_number: null,
      status: template.status,
      payment_status: resolvePaymentStatus(totalAmount, paidAmount),
      order_date: addLocalDays(today, -orderIndex - 1),
      due_date: addLocalDays(today, template.dueOffset),
      due_time: null,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      remaining_amount: Math.max(totalAmount - paidAmount, 0),
      notes: `${template.notes}. Lote demo ${batch}`,
    }

    orders.push(order)
    orderItems.push(...selectedItems)

    if (paidAmount > 0) {
      payments.push({
        ...makeBaseRecord(userId),
        order_id: orderId,
        amount: paidAmount,
        method: template.paymentMethod,
        payment_date: addLocalDays(today, Math.min(template.dueOffset, -1)),
        notes: 'Pagamento de demonstração',
      })
    }

    if (['awaiting_payment', 'in_production', 'ready', 'delivered'].includes(template.status)) {
      productionSteps.forEach((step, stepIndex) => {
        const isCompleted = stepIndex < template.completedSteps
        productionRecords.push({
          ...makeBaseRecord(userId),
          order_id: orderId,
          production_step_id: step.id,
          is_completed: isCompleted,
          completed_at: isCompleted ? nowIso() : null,
        })
      })
    }

    if (['in_production', 'ready'].includes(template.status)) {
      selectedItems.slice(0, 1).forEach((item, itemIndex) => {
        const material = materials[(orderIndex + itemIndex) % materials.length]
        reservations.push({
          ...makeBaseRecord(userId),
          order_id: orderId,
          order_item_id: item.id,
          material_id: material.id,
          quantity: item.quantity + 1,
          status: template.status === 'ready' ? 'consumed' : 'reserved',
          reserved_at: nowIso(),
          consumed_at: template.status === 'ready' ? nowIso() : null,
          cancelled_at: null,
          notes: 'Reserva de demonstração',
        })
      })
    }
  })

  await db.orders.bulkAdd(orders)
  await db.order_items.bulkAdd(orderItems)
  await enqueueMany('orders', orders)
  await enqueueMany('order_items', orderItems)

  if (payments.length > 0) {
    await db.payments.bulkAdd(payments)
    await enqueueMany('payments', payments)
  }

  if (productionRecords.length > 0) {
    await db.order_production_steps.bulkAdd(productionRecords)
    await enqueueMany('order_production_steps', productionRecords)
  }

  if (reservations.length > 0) {
    await db.material_reservations.bulkAdd(reservations)
    await enqueueMany('material_reservations', reservations)
  }

  await Promise.all(orders.map(order => recalculateOrderFinancials(order.id)))

  return {
    clients: clients.length,
    orders: orders.length,
    orderItems: orderItems.length,
    payments: payments.length,
    materials: materials.length,
    reservations: reservations.length,
  }
}
