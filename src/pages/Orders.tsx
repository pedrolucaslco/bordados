import { useEffect, useMemo, useState } from 'react'
import { useOrdersStore } from '@/stores/orders'
import { useClientsStore } from '@/stores/clients'
import { formatLocalDate, isBeforeToday } from '@/utils/date'

export default function OrdersPage({ onNavigate }: { onNavigate: (page: string, orderId?: string) => void }) {
  const { orders, isLoading, fetchOrders } = useOrdersStore()
  const { clients, fetchClients } = useClientsStore()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
    fetchClients()
  }, [fetchOrders, fetchClients])

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido'
  }

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return orders.filter(order => {
      const clientName = getClientName(order.client_id).toLowerCase()
      const matchesQuery = !normalizedQuery
        || clientName.includes(normalizedQuery)
        || order.id.toLowerCase().includes(normalizedQuery)
        || (order.notes || '').toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [orders, clients, query, statusFilter])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      'quote': { label: 'Orçamento', color: 'badge-ghost' },
      'awaiting_confirmation': { label: 'Aguardando Confirmação', color: 'badge-warning' },
      'awaiting_payment': { label: 'Aguardando Pagamento', color: 'badge-warning' },
      'in_production': { label: 'Em Produção', color: 'badge-info' },
      'ready': { label: 'Pronto', color: 'badge-success' },
      'delivered': { label: 'Entregue', color: 'badge-neutral' },
      'cancelled': { label: 'Cancelado', color: 'badge-error' },
    }
    
    const s = statusMap[status] || { label: status, color: 'badge-ghost' }
    return <span className={`badge ${s.color}`}>{s.label}</span>
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pedidos</h2>
        <button className="btn btn-primary" onClick={() => onNavigate('order_detail', 'new')}>
          Novo Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-6">
        <label className="input w-full">
          <svg className="h-4 w-4 opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente, pedido ou observacao" />
        </label>
        <select className="select w-full md:w-60" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="all">Todos os status</option>
          <option value="quote">Orcamento</option>
          <option value="awaiting_confirmation">Aguardando confirmacao</option>
          <option value="awaiting_payment">Aguardando pagamento</option>
          <option value="in_production">Em producao</option>
          <option value="ready">Pronto</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const isOverdue = Boolean(order.due_date && isBeforeToday(order.due_date) && !['delivered', 'cancelled'].includes(order.status))
            return (
            <div key={order.id} className="card bg-base-100 border border-base-300 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => onNavigate('order_detail', order.id)}>
              <div className="card-body p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg line-clamp-1">{getClientName(order.client_id)}</h3>
                  <div className="text-sm opacity-70">#{order.id.slice(0, 6)}</div>
                </div>
                
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70">Data:</span>
                    <span>{formatLocalDate(order.order_date)}</span>
                  </div>
                  {order.due_date && (
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="opacity-70">Entrega:</span>
                      <span className={isOverdue ? 'text-error' : 'text-primary'}>{formatLocalDate(order.due_date)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70">Valor:</span>
                    <span className="font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {getStatusBadge(order.status)}
                    {isOverdue && <span className="badge badge-error">Atrasado</span>}
                  </div>
                  {order.payment_status === 'paid' && <span className="badge badge-success badge-outline">Pago</span>}
                  {order.payment_status !== 'paid' && <span className="badge badge-warning badge-outline">Pendente</span>}
                </div>
              </div>
            </div>
          )})}

          {filteredOrders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-bold mb-2">Nenhum pedido encontrado</h3>
              <p className="text-base-content/60">Crie um pedido ou ajuste os filtros de busca.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
