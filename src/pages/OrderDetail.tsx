import { useEffect, useState, useMemo } from 'react'
import { useOrdersStore } from '@/stores/orders'
import { useClientsStore } from '@/stores/clients'
import { usePaymentsStore } from '@/stores/payments'
import { useInventoryStore } from '@/stores/inventory'
import { useProductsStore } from '@/stores/products'
import type { MaterialReservationStatus, OrderStatus, PaymentMethod, PaymentStatus, OrderItem, Order } from '@/types/models'
import { formatLocalDate, todayLocalDate, toLocalDateInputValue } from '@/utils/date'

interface OrderDetailPageProps {
  orderId: string
  onBack: () => void
}

export default function OrderDetailPage({ orderId, onBack }: OrderDetailPageProps) {
  const isNew = orderId === 'new'
  
  const { fetchOrders, fetchOrderItems, addOrder, updateOrder, deleteOrder, addOrderItem, updateOrderItem, deleteOrderItem } = useOrdersStore()
  const { clients, fetchClients } = useClientsStore()
  const { payments, fetchPayments, addPayment, deletePayment } = usePaymentsStore()
  const { materials, reservations, fetchInventory, addReservation, updateReservation } = useInventoryStore()
  const { products, fetchData: fetchProducts } = useProductsStore()

  const [isLoading, setIsLoading] = useState(!isNew)
  const [items, setItems] = useState<OrderItem[]>([])
  
  // Order state
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState<OrderStatus>('quote')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  // Item Modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [embroideryText, setEmbroideryText] = useState('')
  const [theme, setTheme] = useState('')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [paymentDate, setPaymentDate] = useState(todayLocalDate())
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [reservationItemId, setReservationItemId] = useState('')
  const [reservationMaterialId, setReservationMaterialId] = useState('')
  const [reservationQuantity, setReservationQuantity] = useState('')
  const [reservationStatus, setReservationStatus] = useState<MaterialReservationStatus>('reserved')
  const [reservationNotes, setReservationNotes] = useState('')

  useEffect(() => {
    fetchClients()
    fetchProducts()
    fetchInventory()
    if (!isNew) {
      loadOrderData()
    }
  }, [orderId])

  const loadOrderData = async () => {
    setIsLoading(true)
    await fetchOrders()
    const orderItemsData = await fetchOrderItems(orderId)
    setItems(orderItemsData)
    await fetchPayments(orderId)
    
    // Find order in store
    const order = useOrdersStore.getState().orders.find(o => o.id === orderId)
    if (order) {
      setClientId(order.client_id)
      setStatus(order.status)
      setPaymentStatus(order.payment_status)
      setDueDate(toLocalDateInputValue(order.due_date))
      setNotes(order.notes || '')
    }
    setIsLoading(false)
  }

  // Handle Product selection in item modal
  const handleProductSelect = (selectedProductId: string) => {
    setProductId(selectedProductId)
    const product = products.find(p => p.id === selectedProductId)
    if (product) {
      setUnitPrice(product.base_price.toString())
    }
  }

  const handleSaveOrder = async () => {
    if (!clientId) {
      alert('Selecione um cliente')
      return
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)

    if (isNew) {
      const orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        client_id: clientId,
        status,
        payment_status: 'unpaid',
        order_date: todayLocalDate(),
        due_date: dueDate || null,
        total_amount: totalAmount,
        paid_amount: 0,
        remaining_amount: totalAmount,
        notes,
      }
      // Create new order
      const newOrderId = await addOrder(orderData)
      
      // We also need to save items that were added in-memory for this new order
      for (const item of items) {
        await addOrderItem({
          ...item,
          order_id: newOrderId
        })
      }
      onBack()
    } else {
      await updateOrder(orderId, {
        client_id: clientId,
        status,
        due_date: dueDate || null,
        notes,
      })
      onBack()
    }
  }

  const handleDeleteOrder = async () => {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      await deleteOrder(orderId)
      onBack()
    }
  }

  const openItemModal = (item?: OrderItem) => {
    if (item) {
      setEditingItem(item)
      setProductId(item.product_id)
      setQuantity(item.quantity.toString())
      setUnitPrice(item.unit_price.toString())
      setEmbroideryText(item.embroidery_text || '')
      setTheme(item.theme || '')
    } else {
      setEditingItem(null)
      setProductId('')
      setQuantity('1')
      setUnitPrice('')
      setEmbroideryText('')
      setTheme('')
    }
    setIsItemModalOpen(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !quantity || !unitPrice) return

    const itemTotal = parseInt(quantity) * parseFloat(unitPrice)

    const itemData = {
      product_id: productId,
      order_id: isNew ? 'temp' : orderId,
      quantity: parseInt(quantity),
      unit_price: parseFloat(unitPrice),
      total_price: itemTotal,
      embroidery_text: embroideryText,
      theme,
    }

    if (isNew) {
      // In-memory manipulation for new orders
      if (editingItem) {
        setItems(items.map(i => i.id === editingItem.id ? { ...editingItem, ...itemData } : i))
      } else {
        setItems([...items, { ...itemData, id: crypto.randomUUID(), user_id: 'temp', created_at: '', updated_at: '' } as OrderItem])
      }
    } else {
      if (editingItem) {
        await updateOrderItem(editingItem.id, itemData)
      } else {
        await addOrderItem({ ...itemData, order_id: orderId } as Omit<OrderItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
      }
      const newItems = await fetchOrderItems(orderId)
      setItems(newItems)
      const order = await useOrdersStore.getState().recalculateOrderFinancials(orderId)
      if (order) setPaymentStatus(order.payment_status)
    }

    setIsItemModalOpen(false)
  }

  const openPaymentModal = () => {
    const remaining = Math.max(totalOrderValue - payments.reduce((sum, payment) => sum + payment.amount, 0), 0)
    setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '')
    setPaymentMethod('pix')
    setPaymentDate(todayLocalDate())
    setPaymentNotes('')
    setIsPaymentModalOpen(true)
  }

  const openReservationModal = (itemId?: string) => {
    setReservationItemId(itemId || '')
    setReservationMaterialId(materials[0]?.id || '')
    setReservationQuantity('1')
    setReservationStatus('reserved')
    setReservationNotes('')
    setIsReservationModalOpen(true)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNew || !paymentAmount) return

    await addPayment({
      order_id: orderId,
      amount: Number(paymentAmount),
      method: paymentMethod,
      payment_date: paymentDate,
      notes: paymentNotes || null,
    })

    const order = await useOrdersStore.getState().recalculateOrderFinancials(orderId)
    if (order) {
      setPaymentStatus(order.payment_status)
    }
    setIsPaymentModalOpen(false)
  }

  const handleDeletePayment = async (paymentId: string) => {
    await deletePayment(paymentId)
    const order = await useOrdersStore.getState().recalculateOrderFinancials(orderId)
    if (order) {
      setPaymentStatus(order.payment_status)
    }
  }

  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNew || !reservationMaterialId || !reservationQuantity) return

    const material = materials.find(item => item.id === reservationMaterialId)
    const quantityNumber = Number(reservationQuantity || 0)
    if (material && quantityNumber > material.available_stock) {
      const shouldContinue = confirm('Quantidade maior que o disponivel. Deseja registrar a reserva mesmo assim?')
      if (!shouldContinue) return
    }

    await addReservation({
      order_id: orderId,
      order_item_id: reservationItemId || null,
      material_id: reservationMaterialId,
      quantity: quantityNumber,
      status: reservationStatus,
      notes: reservationNotes || null,
    })
    setIsReservationModalOpen(false)
  }

  const handleRemoveItem = async (itemId: string) => {
    if (isNew) {
      setItems(items.filter(i => i.id !== itemId))
    } else {
      await deleteOrderItem(itemId)
      const newItems = await fetchOrderItems(orderId)
      setItems(newItems)
      const order = await useOrdersStore.getState().recalculateOrderFinancials(orderId)
      if (order) setPaymentStatus(order.payment_status)
    }
  }

  const totalOrderValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0)
  }, [items])
  const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const remainingAmount = Math.max(totalOrderValue - paidAmount, 0)
  const displayPaymentStatus: PaymentStatus = totalOrderValue > 0
    ? remainingAmount <= 0
      ? 'paid'
      : paidAmount > 0
        ? 'partially_paid'
        : 'unpaid'
    : paymentStatus
  const orderReservations = reservations.filter(reservation => reservation.order_id === orderId && reservation.status !== 'cancelled')

  const getProductName = (pid: string) => products.find(p => p.id === pid)?.name || 'Produto'
  const getMaterialName = (mid: string) => materials.find(material => material.id === mid)?.name || 'Material'

  if (isLoading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button className="btn btn-circle btn-ghost" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h2 className="text-2xl font-bold">{isNew ? 'Novo Pedido' : `Pedido #${orderId.slice(0, 6)}`}</h2>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <button className="btn btn-error btn-outline" onClick={handleDeleteOrder}>Excluir</button>
          )}
          <button className="btn btn-primary" onClick={handleSaveOrder}>Salvar Pedido</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário Principal */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title mb-4">Detalhes do Pedido</h3>
            
            <fieldset className="fieldset mb-4">
              <label className="label" htmlFor="order-client">Cliente *</label>
              <select id="order-client" className="select w-full" value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">Selecione um cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </fieldset>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <fieldset className="fieldset">
                <label className="label" htmlFor="order-status">Status da Produção</label>
                <select id="order-status" className="select w-full" value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
                  <option value="quote">Orçamento</option>
                  <option value="awaiting_payment">Aguardando Pagamento</option>
                  <option value="in_production">Em Produção</option>
                  <option value="ready">Pronto</option>
                  <option value="delivered">Entregue</option>
                </select>
              </fieldset>
              <fieldset className="fieldset">
                <label className="label">Status Financeiro</label>
                <div className="flex h-12 items-center">
                  <span className={`badge ${
                    displayPaymentStatus === 'paid'
                      ? 'badge-success'
                      : displayPaymentStatus === 'unpaid'
                        ? 'badge-error'
                        : 'badge-warning'
                  }`}>
                    {displayPaymentStatus === 'paid' ? 'Pago' : displayPaymentStatus === 'unpaid' ? 'Nao pago' : 'Parcial'}
                  </span>
                </div>
              </fieldset>
            </div>

            <fieldset className="fieldset mb-4">
              <label className="label" htmlFor="order-due-date">Data de Entrega</label>
              <input id="order-due-date" type="date" className="input w-full" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </fieldset>

            <fieldset className="fieldset">
              <label className="label" htmlFor="order-notes">Observações Gerais</label>
              <textarea id="order-notes" className="textarea h-24 w-full" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
            </fieldset>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">Itens</h3>
              <button className="btn btn-sm btn-outline" onClick={() => openItemModal()}>+ Adicionar Item</button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-bold">{getProductName(item.product_id)}</div>
                        <div className="text-xs opacity-70">
                          {item.embroidery_text && `Texto: ${item.embroidery_text}`}
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-xs btn-ghost" onClick={() => openItemModal(item)}>✏️</button>
                          {!isNew && <button className="btn btn-xs btn-ghost" onClick={() => openReservationModal(item.id)}>Reservar</button>}
                          <button className="btn btn-xs btn-ghost text-error" onClick={() => handleRemoveItem(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-base-content/60">Nenhum item adicionado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="divider my-2"></div>
            
            <div className="flex justify-between items-center px-4 mb-2">
              <span className="font-bold text-lg">Total do Pedido:</span>
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOrderValue)}
              </span>
            </div>
            {!isNew && (
              <div className="px-4">
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/60">Recebido</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-base-content/60">Restante</span>
                  <span className={remainingAmount > 0 ? 'text-warning font-semibold' : 'text-success font-semibold'}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingAmount)}
                  </span>
                </div>
                <button className="btn btn-sm btn-primary w-full" onClick={openPaymentModal}>Registrar pagamento</button>
                <div className="divide-y divide-base-200 mt-3">
                  {payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        <span className="block font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                        </span>
                        <span className="block text-xs text-base-content/60">{formatLocalDate(payment.payment_date)} - {payment.method}</span>
                      </span>
                      <button className="btn btn-xs btn-ghost text-error" onClick={() => handleDeletePayment(payment.id)}>Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isNew && (
        <div className="card bg-base-100 border border-base-300 mt-6">
          <div className="card-body p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="card-title">Reservas de material</h3>
                <p className="text-sm text-base-content/60">Estoque disponivel considera reservas ativas.</p>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => openReservationModal()}>
                Reservar material
              </button>
            </div>
            <div className="divide-y divide-base-200">
              {orderReservations.map(reservation => (
                <div key={reservation.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">{getMaterialName(reservation.material_id)}</div>
                    <div className="text-sm text-base-content/60">
                      {reservation.quantity} reservado(s)
                      {reservation.order_item_id && ` - ${getProductName(items.find(item => item.id === reservation.order_item_id)?.product_id || '')}`}
                    </div>
                  </div>
                  <select
                    className="select select-sm w-full md:w-40"
                    value={reservation.status}
                    onChange={event => updateReservation(reservation.id, { status: event.target.value as MaterialReservationStatus })}
                  >
                    <option value="planned">Planejado</option>
                    <option value="reserved">Reservado</option>
                    <option value="consumed">Consumido</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              ))}
              {orderReservations.length === 0 && (
                <div className="py-6 text-center text-sm text-base-content/60">
                  Nenhum material reservado para este pedido.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{editingItem ? 'Editar Item' : 'Novo Item'}</h3>
            
            <form onSubmit={handleSaveItem}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <fieldset className="fieldset">
                  <label className="label" htmlFor="item-product">Produto *</label>
                  <select id="item-product" className="select w-full" value={productId} onChange={e => handleProductSelect(e.target.value)} required>
                    <option value="">Selecione...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - R$ {p.base_price}</option>
                    ))}
                  </select>
                </fieldset>

                <div className="grid grid-cols-2 gap-4">
                  <fieldset className="fieldset">
                    <label className="label" htmlFor="item-quantity">Quantidade *</label>
                    <input id="item-quantity" type="number" min="1" className="input w-full" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                  </fieldset>
                  <fieldset className="fieldset">
                    <label className="label" htmlFor="item-unit-price">Preço Unit. (R$) *</label>
                    <input id="item-unit-price" type="number" step="0.01" className="input w-full" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required />
                  </fieldset>
                </div>
              </div>

              <div className="divider">Personalização (Opcional)</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <fieldset className="fieldset">
                  <label className="label" htmlFor="item-embroidery-text">Texto a bordar</label>
                  <input id="item-embroidery-text" type="text" className="input w-full" value={embroideryText} onChange={e => setEmbroideryText(e.target.value)} />
                </fieldset>
                <fieldset className="fieldset">
                  <label className="label" htmlFor="item-theme">Tema / Desenho</label>
                  <input id="item-theme" type="text" className="input w-full" value={theme} onChange={e => setTheme(e.target.value)} />
                </fieldset>
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsItemModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Adicionar Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Registrar pagamento</h3>
            <form onSubmit={handleSavePayment}>
              <fieldset className="fieldset mb-2">
                <label className="label" htmlFor="payment-amount">Valor *</label>
                <input id="payment-amount" type="number" step="0.01" min="0.01" className="input w-full" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
              </fieldset>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <fieldset className="fieldset">
                  <label className="label" htmlFor="payment-method">Forma</label>
                  <select id="payment-method" className="select w-full" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
                    <option value="pix">Pix</option>
                    <option value="cash">Dinheiro</option>
                    <option value="credit_card">Credito</option>
                    <option value="debit_card">Debito</option>
                    <option value="bank_transfer">Transferencia</option>
                    <option value="other">Outro</option>
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <label className="label" htmlFor="payment-date">Data</label>
                  <input id="payment-date" type="date" className="input w-full" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                </fieldset>
              </div>
              <fieldset className="fieldset mb-4">
                <label className="label" htmlFor="payment-notes">Observacoes</label>
                <textarea id="payment-notes" className="textarea w-full" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
              </fieldset>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReservationModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Reservar material</h3>
            <form onSubmit={handleSaveReservation}>
              <fieldset className="fieldset mb-2">
                <label className="label" htmlFor="reservation-item">Item do pedido</label>
                <select id="reservation-item" className="select w-full" value={reservationItemId} onChange={event => setReservationItemId(event.target.value)}>
                  <option value="">Pedido geral</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{getProductName(item.product_id)}</option>
                  ))}
                </select>
              </fieldset>
              <fieldset className="fieldset mb-2">
                <label className="label" htmlFor="reservation-material">Material *</label>
                <select id="reservation-material" className="select w-full" value={reservationMaterialId} onChange={event => setReservationMaterialId(event.target.value)} required>
                  <option value="">Selecione...</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} - disponivel: {material.available_stock}
                    </option>
                  ))}
                </select>
              </fieldset>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <fieldset className="fieldset">
                  <label className="label" htmlFor="reservation-quantity">Quantidade *</label>
                  <input id="reservation-quantity" type="number" step="0.01" min="0.01" className="input w-full" value={reservationQuantity} onChange={event => setReservationQuantity(event.target.value)} required />
                </fieldset>
                <fieldset className="fieldset">
                  <label className="label" htmlFor="reservation-status">Status</label>
                  <select id="reservation-status" className="select w-full" value={reservationStatus} onChange={event => setReservationStatus(event.target.value as MaterialReservationStatus)}>
                    <option value="planned">Planejado</option>
                    <option value="reserved">Reservado</option>
                  </select>
                </fieldset>
              </div>
              <fieldset className="fieldset mb-4">
                <label className="label" htmlFor="reservation-notes">Observacoes</label>
                <textarea id="reservation-notes" className="textarea w-full" value={reservationNotes} onChange={event => setReservationNotes(event.target.value)} />
              </fieldset>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsReservationModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
