import { useState, useEffect, useMemo } from 'react'
import { startOfWeek, addDays, subWeeks, addWeeks, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useOrdersStore } from '@/stores/orders'
import { useClientsStore } from '@/stores/clients'
import type { OrderStatus } from '@/types/models'
import { formatLocalDate, isBeforeToday, isSameLocalDate } from '@/utils/date'

export default function CalendarPage({ onNavigate }: { onNavigate: (page: string, orderId?: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list'>('week')
  
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

  const getOrdersForDay = (day: Date) => {
    return orders.filter(order => isSameLocalDate(order.due_date, day))
  }

  const renderOrderCard = (order: typeof orders[number], compact = false) => {
    const overdue = !['delivered', 'cancelled'].includes(order.status) && isBeforeToday(order.due_date)
    return (
      <div 
        key={order.id} 
        className={`card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(order.status)}`}
        onClick={() => onNavigate('order_detail', order.id)}
      >
        <div className="p-3">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h4 className="font-bold text-sm leading-tight line-clamp-2">
              {getClientName(order.client_id)}
            </h4>
            {!compact && <span className="text-xs opacity-70">#{order.id.slice(0, 5)}</span>}
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {overdue && <span className="badge badge-error badge-outline badge-sm">Atrasado</span>}
            {order.payment_status !== 'paid' && <span className="badge badge-warning badge-outline badge-sm">Pagamento</span>}
            {compact && order.due_date && <span className="badge badge-ghost badge-sm">{formatLocalDate(order.due_date)}</span>}
          </div>
          
          <select 
            className="select select-xs w-full"
            value={order.status}
            onChange={(e) => handleStatusChange(e, order.id)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="quote">Orçamento</option>
            <option value="awaiting_payment">Aguardando Pagamento</option>
            <option value="in_production">Em Produção</option>
            <option value="ready">Pronto</option>
            <option value="delivered">Entregue</option>
          </select>
        </div>
      </div>
    )
  }

  const currentDayOrders = getOrdersForDay(currentDate)
  const listOrders = orders
    .filter(order => order.due_date)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))

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
        <div className="flex items-center gap-2">
          <div className="join hidden md:inline-flex">
            <button className={`btn btn-sm join-item ${viewMode === 'week' ? 'btn-active' : ''}`} onClick={() => setViewMode('week')}>Semana</button>
            <button className={`btn btn-sm join-item ${viewMode === 'day' ? 'btn-active' : ''}`} onClick={() => setViewMode('day')}>Dia</button>
            <button className={`btn btn-sm join-item ${viewMode === 'list' ? 'btn-active' : ''}`} onClick={() => setViewMode('list')}>Lista</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('order_detail', 'new')}>
            + Pedido
          </button>
        </div>
      </div>

      <div className="join mx-4 mt-4 md:hidden">
        <button className={`btn btn-sm join-item flex-1 ${viewMode === 'week' ? 'btn-active' : ''}`} onClick={() => setViewMode('week')}>Semana</button>
        <button className={`btn btn-sm join-item flex-1 ${viewMode === 'day' ? 'btn-active' : ''}`} onClick={() => setViewMode('day')}>Dia</button>
        <button className={`btn btn-sm join-item flex-1 ${viewMode === 'list' ? 'btn-active' : ''}`} onClick={() => setViewMode('list')}>Lista</button>
      </div>

      {/* Grid Semanal */}
      {viewMode === 'week' && <div className="flex-1 overflow-x-auto p-4 pb-24">
        <div className="flex gap-4 min-w-[800px] h-full">
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date())
            const dayOrders = getOrdersForDay(day)

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
                    renderOrderCard(order)
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
      </div>}

      {viewMode === 'day' && (
        <div className="p-4 pb-24 space-y-3">
          <h3 className="font-bold capitalize">{format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h3>
          {currentDayOrders.map(order => renderOrderCard(order, true))}
          {currentDayOrders.length === 0 && (
            <div className="text-center py-12 text-base-content/60">Sem entregas neste dia.</div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="p-4 pb-24 space-y-3">
          {listOrders.map(order => renderOrderCard(order, true))}
          {listOrders.length === 0 && (
            <div className="text-center py-12 text-base-content/60">Nenhuma entrega agendada.</div>
          )}
        </div>
      )}
    </div>
  )
}
