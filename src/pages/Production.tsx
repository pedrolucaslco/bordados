import { useEffect, useMemo } from 'react'
import { useClientsStore } from '@/stores/clients'
import { useOrdersStore } from '@/stores/orders'
import { useProductionStore } from '@/stores/production'

export default function ProductionPage({ onNavigate }: { onNavigate: (page: string, param?: string) => void }) {
  const { orders, fetchOrders } = useOrdersStore()
  const { clients, fetchClients } = useClientsStore()
  const { steps, orderSteps, fetchSteps, ensureOrderSteps, toggleOrderStep } = useProductionStore()

  useEffect(() => {
    fetchOrders()
    fetchClients()
    fetchSteps()
  }, [fetchOrders, fetchClients, fetchSteps])

  const productionOrders = orders.filter(order =>
    ['awaiting_payment', 'in_production', 'ready'].includes(order.status)
  )

  const stepsByOrder = useMemo(() => {
    return orderSteps.reduce<Record<string, typeof orderSteps>>((acc, step) => {
      acc[step.order_id] = [...(acc[step.order_id] || []), step]
      return acc
    }, {})
  }, [orderSteps])

  const getClientName = (clientId: string) => clients.find(client => client.id === clientId)?.name || 'Cliente desconhecido'
  const getStepName = (stepId: string) => steps.find(step => step.id === stepId)?.name || 'Etapa'
  const getStepOrder = (stepId: string) => steps.find(step => step.id === stepId)?.sort_order ?? 0

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Producao</h2>
        <p className="text-sm text-base-content/60">Checklist dos pedidos em andamento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productionOrders.map(order => {
          const currentSteps = stepsByOrder[order.id] || []
          const completedCount = currentSteps.filter(step => step.is_completed).length
          const totalSteps = Math.max(currentSteps.length, steps.length)

          return (
            <div key={order.id} className="card bg-base-100 border border-base-300">
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{getClientName(order.client_id)}</h3>
                    <p className="text-sm text-base-content/60">#{order.id.slice(0, 6)}</p>
                  </div>
                  <span className="badge badge-info">{completedCount}/{totalSteps}</span>
                </div>

                {currentSteps.length === 0 ? (
                  <button className="btn btn-sm btn-outline" onClick={() => ensureOrderSteps(order.id)}>
                    Criar checklist
                  </button>
                ) : (
                  <div className="space-y-2">
                    {currentSteps
                      .slice()
                      .sort((a, b) => getStepOrder(a.production_step_id) - getStepOrder(b.production_step_id))
                      .map(step => (
                        <label key={step.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={step.is_completed}
                            onChange={event => toggleOrderStep(step.id, event.target.checked)}
                          />
                          <span className={step.is_completed ? 'line-through opacity-60' : ''}>
                            {getStepName(step.production_step_id)}
                          </span>
                        </label>
                      ))}
                  </div>
                )}

                <div className="card-actions justify-end">
                  <button className="btn btn-sm btn-ghost" onClick={() => onNavigate('order_detail', order.id)}>
                    Abrir pedido
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {productionOrders.length === 0 && (
          <div className="col-span-full text-center py-12 text-base-content/60">
            Nenhum pedido em producao.
          </div>
        )}
      </div>
    </div>
  )
}
