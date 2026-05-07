import { useEffect, useMemo } from 'react'
import { useClientsStore } from '@/stores/clients'
import { useInventoryStore } from '@/stores/inventory'
import { useOrdersStore } from '@/stores/orders'
import { formatLocalDate, isBeforeToday, todayLocalDate } from '@/utils/date'

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string, param?: string) => void }) {
  const { orders, fetchOrders } = useOrdersStore()
  const { clients, fetchClients } = useClientsStore()
  const { materials, fetchInventory } = useInventoryStore()

  useEffect(() => {
    fetchOrders()
    fetchClients()
    fetchInventory()
  }, [fetchOrders, fetchClients, fetchInventory])

  const metrics = useMemo(() => {
    const currentMonth = todayLocalDate().slice(0, 7)
    const openOrders = orders.filter(order => !['delivered', 'cancelled'].includes(order.status))
    const completedThisMonth = orders.filter(order =>
      order.status === 'delivered' && order.updated_at.slice(0, 7) === currentMonth
    )

    return {
      open: openOrders.length,
      inProduction: orders.filter(order => order.status === 'in_production').length,
      awaitingPayment: orders.filter(order => order.payment_status !== 'paid').length,
      completedThisMonth: completedThisMonth.length,
      expected: openOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      received: orders.reduce((sum, order) => sum + Number(order.paid_amount || 0), 0),
      overdue: orders.filter(order =>
        !['delivered', 'cancelled'].includes(order.status) && isBeforeToday(order.due_date)
      ).length,
      lowStock: materials.filter(material => material.available_stock <= material.minimum_stock).length,
    }
  }, [orders, materials])

  const upcomingOrders = orders
    .filter(order => order.due_date && !['delivered', 'cancelled'].includes(order.status))
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 5)

  const getClientName = (clientId: string) => {
    return clients.find(client => client.id === clientId)?.name || 'Cliente desconhecido'
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Painel</h2>
        <p className="text-sm text-base-content/60">Resumo da operação</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body p-4">
            <span className="text-sm text-base-content/60">Abertos</span>
            <strong className="text-2xl">{metrics.open}</strong>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body p-4">
            <span className="text-sm text-base-content/60">Em produção</span>
            <strong className="text-2xl">{metrics.inProduction}</strong>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body p-4">
            <span className="text-sm text-base-content/60">A receber</span>
            <strong className="text-2xl">{metrics.awaitingPayment}</strong>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body p-4">
            <span className="text-sm text-base-content/60">Concluidos no mes</span>
            <strong className="text-2xl">{metrics.completedThisMonth}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body p-4">
            <span className="text-sm text-base-content/60">Valor previsto</span>
            <strong className="text-xl">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.expected)}
            </strong>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body p-4">
            <span className="text-sm text-base-content/60">Valor recebido</span>
            <strong className="text-xl">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.received)}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button className="card bg-base-100 border border-base-300 text-left" onClick={() => onNavigate('orders')}>
          <div className="card-body p-4">
            <span className="text-sm text-base-content/60">Pedidos atrasados</span>
            <strong className={`text-2xl ${metrics.overdue > 0 ? 'text-error' : ''}`}>{metrics.overdue}</strong>
          </div>
        </button>
        <button className="card bg-base-100 border border-base-300 text-left" onClick={() => onNavigate('inventory')}>
          <div className="card-body p-4">
            <span className="text-sm text-base-content/60">Estoque baixo</span>
            <strong className={`text-2xl ${metrics.lowStock > 0 ? 'text-warning' : ''}`}>{metrics.lowStock}</strong>
          </div>
        </button>
      </div>

      <section className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Proximas entregas</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('calendar')}>Agenda</button>
          </div>
          <div className="divide-y divide-base-200">
            {upcomingOrders.map(order => (
              <button
                key={order.id}
                className="flex w-full items-center justify-between py-3 text-left"
                onClick={() => onNavigate('order_detail', order.id)}
              >
                <span>
                  <span className="block font-medium">{getClientName(order.client_id)}</span>
                  <span className="block text-sm text-base-content/60">{formatLocalDate(order.due_date)}</span>
                </span>
                {order.payment_status !== 'paid' && <span className="badge badge-warning badge-outline">Pagamento</span>}
              </button>
            ))}
            {upcomingOrders.length === 0 && (
              <p className="py-4 text-sm text-base-content/60">Nenhuma entrega agendada.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
