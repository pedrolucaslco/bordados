import { useEffect } from 'react'
import { useOrdersStore } from '@/stores/orders'
import { useClientsStore } from '@/stores/clients'

export default function OrdersPage({ onNavigate }: { onNavigate: (page: string, orderId?: string) => void }) {
  const { orders, isLoading, fetchOrders } = useOrdersStore()
  const { clients, fetchClients } = useClientsStore()

  useEffect(() => {
    fetchOrders()
    fetchClients()
  }, [fetchOrders, fetchClients])

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido'
  }

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

      {isLoading ? (
        <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
            <div key={order.id} className="card bg-base-100 shadow-xl cursor-pointer hover:bg-base-200 transition-colors" onClick={() => onNavigate('order_detail', order.id)}>
              <div className="card-body p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg line-clamp-1">{getClientName(order.client_id)}</h3>
                  <div className="text-sm opacity-70">#{order.id.slice(0, 6)}</div>
                </div>
                
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70">Data:</span>
                    <span>{new Date(order.order_date).toLocaleDateString()}</span>
                  </div>
                  {order.due_date && (
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="opacity-70">Entrega:</span>
                      <span className="text-primary">{new Date(order.due_date).toLocaleDateString()}</span>
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
                  {getStatusBadge(order.status)}
                  {order.payment_status === 'paid' && <span className="badge badge-success badge-outline">Pago</span>}
                  {order.payment_status === 'unpaid' && <span className="badge badge-error badge-outline">Pendente</span>}
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-bold mb-2">Nenhum pedido encontrado</h3>
              <p className="text-base-content/60">Crie seu primeiro pedido para começar a gerenciar sua produção.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
