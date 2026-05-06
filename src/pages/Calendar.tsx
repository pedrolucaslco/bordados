import { useState, useEffect, useMemo } from 'react'
import { startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, format, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useOrdersStore } from '@/stores/orders'
import { useClientsStore } from '@/stores/clients'
import type { OrderStatus } from '@/types/models'

export default function CalendarPage({ onNavigate }: { onNavigate: (page: string, orderId?: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const { orders, fetchOrders, updateOrder } = useOrdersStore()
  const { clients, fetchClients } = useClientsStore()

  useEffect(() => {
    fetchOrders()
    fetchClients()
  }, [fetchOrders, fetchClients])

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Começa na segunda-feira

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))
  }, [startDate])

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido'
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, orderId: string) => {
    e.stopPropagation()
    const newStatus = e.target.value as OrderStatus
    await updateOrder(orderId, { status: newStatus })
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'quote': return 'border-l-4 border-l-base-300'
      case 'awaiting_payment': return 'border-l-4 border-l-warning'
      case 'in_production': return 'border-l-4 border-l-info'
      case 'ready': return 'border-l-4 border-l-success'
      case 'delivered': return 'border-l-4 border-l-neutral opacity-60'
      case 'cancelled': return 'border-l-4 border-l-error opacity-60'
      default: return 'border-l-4 border-l-base-300'
    }
  }

  return (
    <div className="flex flex-col h-full bg-base-200">
      {/* Header da Agenda */}
      <div className="bg-base-100 p-4 shadow-sm z-10 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold capitalize">
            {format(startDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="join">
            <button className="btn btn-sm join-item" onClick={handlePrevWeek}>&lt;</button>
            <button className="btn btn-sm join-item" onClick={handleToday}>Hoje</button>
            <button className="btn btn-sm join-item" onClick={handleNextWeek}>&gt;</button>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('order_detail', 'new')}>
          + Pedido
        </button>
      </div>

      {/* Grid Semanal */}
      <div className="flex-1 overflow-x-auto p-4 pb-24">
        <div className="flex gap-4 min-w-[800px] h-full">
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date())
            
            // Filtrar pedidos para este dia
            const dayOrders = orders.filter(order => {
              if (!order.due_date) return false
              const dueDate = parseISO(order.due_date)
              return isSameDay(dueDate, day)
            })

            return (
              <div key={day.toISOString()} className="flex-1 flex flex-col min-w-[200px] bg-base-100 rounded-box shadow-sm overflow-hidden border border-base-300">
                {/* Cabecalho da Coluna */}
                <div className={`p-2 text-center border-b border-base-300 ${isToday ? 'bg-primary text-primary-content' : 'bg-base-200'}`}>
                  <div className="text-sm font-semibold capitalize">{format(day, 'EEEE', { locale: ptBR })}</div>
                  <div className={`text-2xl font-bold ${isToday ? '' : 'text-base-content'}`}>{format(day, 'dd')}</div>
                </div>

                {/* Lista de Pedidos (Cards) */}
                <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-2">
                  {dayOrders.map(order => (
                    <div 
                      key={order.id} 
                      className={`card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(order.status)}`}
                      onClick={() => onNavigate('order_detail', order.id)}
                    >
                      <div className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm leading-tight line-clamp-2">
                            {getClientName(order.client_id)}
                          </h4>
                        </div>
                        
                        <div className="text-xs opacity-70 mb-2">#{order.id.slice(0, 5)}</div>
                        
                        <div className="flex justify-between items-center mt-2">
                          <select 
                            className="select select-bordered select-xs w-full max-w-xs"
                            value={order.status}
                            onChange={(e) => handleStatusChange(e, order.id)}
                            onClick={(e) => e.stopPropagation()} // Evita abrir o modal do pedido ao clicar no select
                          >
                            <option value="quote">Orçamento</option>
                            <option value="awaiting_payment">Aguardando Pagamento</option>
                            <option value="in_production">Em Produção</option>
                            <option value="ready">Pronto</option>
                            <option value="delivered">Entregue</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {dayOrders.length === 0 && (
                    <div className="text-center py-4 text-xs opacity-40">
                      Sem entregas
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
