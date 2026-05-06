import { useEffect, useState, useMemo } from 'react'
import { useOrdersStore } from '@/stores/orders'
import { useClientsStore } from '@/stores/clients'
import { useProductsStore } from '@/stores/products'
import type { OrderStatus, PaymentStatus, OrderItem, Order } from '@/types/models'

interface OrderDetailPageProps {
  orderId: string
  onBack: () => void
}

export default function OrderDetailPage({ orderId, onBack }: OrderDetailPageProps) {
  const isNew = orderId === 'new'
  
  const { fetchOrders, fetchOrderItems, addOrder, updateOrder, deleteOrder, addOrderItem, updateOrderItem, deleteOrderItem } = useOrdersStore()
  const { clients, fetchClients } = useClientsStore()
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

  useEffect(() => {
    fetchClients()
    fetchProducts()
    if (!isNew) {
      loadOrderData()
    }
  }, [orderId])

  const loadOrderData = async () => {
    setIsLoading(true)
    await fetchOrders()
    const orderItemsData = await fetchOrderItems(orderId)
    setItems(orderItemsData)
    
    // Find order in store
    const order = useOrdersStore.getState().orders.find(o => o.id === orderId)
    if (order) {
      setClientId(order.client_id)
      setStatus(order.status)
      setPaymentStatus(order.payment_status)
      setDueDate(order.due_date ? order.due_date.split('T')[0] : '')
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

    const orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      client_id: clientId,
      status,
      payment_status: paymentStatus,
      order_date: new Date().toISOString(),
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      total_amount: totalAmount,
      paid_amount: 0,
      remaining_amount: totalAmount,
      notes,
    }

    if (isNew) {
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
      await updateOrder(orderId, orderData)
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
      // Reload items
      const newItems = await fetchOrderItems(orderId)
      setItems(newItems)
    }

    setIsItemModalOpen(false)
  }

  const handleRemoveItem = async (itemId: string) => {
    if (isNew) {
      setItems(items.filter(i => i.id !== itemId))
    } else {
      await deleteOrderItem(itemId)
      const newItems = await fetchOrderItems(orderId)
      setItems(newItems)
    }
  }

  const totalOrderValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0)
  }, [items])

  const getProductName = (pid: string) => products.find(p => p.id === pid)?.name || 'Produto'

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
                <label className="label" htmlFor="payment-status">Status Financeiro</label>
                <select id="payment-status" className="select w-full" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}>
                  <option value="unpaid">Não Pago</option>
                  <option value="deposit_paid">Sinal Pago</option>
                  <option value="paid">Pago</option>
                </select>
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
            
            <div className="flex justify-between items-center px-4">
              <span className="font-bold text-lg">Total do Pedido:</span>
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOrderValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  )
}
