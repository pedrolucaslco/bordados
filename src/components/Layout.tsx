import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { getPendingSyncCount } from '@/services/sync/sync'
import ClientsPage from '@/pages/Clients'
import DashboardPage from '@/pages/Dashboard'
import InventoryPage from '@/pages/Inventory'
import ProductsPage from '@/pages/Products'
import ProductionPage from '@/pages/Production'
import OrdersPage from '@/pages/Orders'
import OrderDetailPage from '@/pages/OrderDetail'
import CalendarPage from '@/pages/Calendar'
import SettingsPage from '@/pages/Settings'

export default function Layout() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [currentParam, setCurrentParam] = useState<string | undefined>()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const { logout } = useAuthStore()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const checkPendingSync = async () => {
      const count = await getPendingSyncCount()
      setPendingSyncCount(count)
    }

    const interval = setInterval(checkPendingSync, 5000)
    checkPendingSync()

    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    if (pendingSyncCount > 0) {
      alert("Você tem sincronizações pendentes. Conecte-se à internet e aguarde a sincronização terminar antes de sair.")
      return
    }

    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page)
    setCurrentParam(param)
  }

  return (
    <div className="flex flex-col h-screen bg-base-200">
      {/* Header */}
      <header className="navbar border-b-base-300 z-50">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl normal-case">Bordados</a>
        </div>
        <div className="flex-none gap-2">
          {!isOnline && (
            <div className="badge badge-warning gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Offline
            </div>
          )}
          {pendingSyncCount > 0 && (
            <div className="badge badge-neutral gap-1">
              <span className="loading loading-spinner loading-xs"></span>
              {pendingSyncCount} pendente(s)
            </div>
          )}
          <button
            className={`btn btn-ghost btn-circle ${currentPage === 'settings' ? 'btn-active' : ''}`}
            onClick={() => handleNavigate('settings')}
            title="Ajustes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.296.07 2.572-1.065Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
          <button className="btn btn-ghost btn-circle" onClick={handleLogout} title="Sair">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-base-200 pb-24">
        {currentPage === 'dashboard' && (
          <DashboardPage onNavigate={handleNavigate} />
        )}
        
        {currentPage === 'calendar' && <CalendarPage onNavigate={handleNavigate} />}
        {currentPage === 'clients' && <ClientsPage />}
        {currentPage === 'products' && <ProductsPage />}
        {currentPage === 'orders' && <OrdersPage onNavigate={handleNavigate} />}
        {currentPage === 'production' && <ProductionPage onNavigate={handleNavigate} />}
        {currentPage === 'inventory' && <InventoryPage />}
        {currentPage === 'settings' && (
          <SettingsPage section={currentParam} onNavigate={handleNavigate} />
        )}
        {currentPage === 'order_detail' && currentParam && (
          <OrderDetailPage orderId={currentParam} onBack={() => handleNavigate('orders')} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="dock">
        <button
          onClick={() => handleNavigate('dashboard')}
          className={currentPage === 'dashboard' ? 'dock-active' : ''}
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt"><polyline points="1 11 12 2 23 11" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></polyline><path d="m5,13v7c0,1.105.895,2,2,2h10c1.105,0,2-.895,2-2v-7" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></path><line x1="12" y1="22" x2="12" y2="18" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></line></g></svg>
          <span className="dock-label">Painel</span>
        </button>
        <button
          onClick={() => handleNavigate('calendar')}
          className={currentPage === 'calendar' ? 'dock-active' : ''}
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></g></svg>
          <span className="dock-label">Agenda</span>
        </button>
        <button
          onClick={() => handleNavigate('orders')}
          className={(currentPage === 'orders' || currentPage === 'order_detail') ? 'dock-active' : ''}
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt"><polyline points="3 14 9 14 9 17 15 17 15 14 21 14" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></polyline><rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></rect></g></svg>
          <span className="dock-label">Pedidos</span>
        </button>
        <button
          onClick={() => handleNavigate('production')}
          className={currentPage === 'production' ? 'dock-active' : ''}
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></circle><path d="m22,13.25v-2.5l-2.318-.966c-.167-.581-.395-1.135-.682-1.654l.954-2.318-1.768-1.768-2.318.954c-.518-.287-1.073-.515-1.654-.682l-.966-2.318h-2.5l-.966,2.318c-.581.167-1.135.395-1.654.682l-2.318-.954-1.768,1.768.954,2.318c-.287.518-.515,1.073-.682,1.654l-2.318.966v2.5l2.318.966c.167.581.395,1.135.682,1.654l-.954,2.318,1.768,1.768,2.318-.954c.518.287,1.073.515,1.654.682l.966,2.318h2.5l.966-2.318c.581-.167,1.135-.395,1.654-.682l2.318.954,1.768-1.768-.954-2.318c.287-.518.515-1.073.682-1.654l2.318-.966Z" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></path></g></svg>
          <span className="dock-label">Produção</span>
        </button>
        <button
          onClick={() => handleNavigate('inventory')}
          className={currentPage === 'inventory' ? 'dock-active' : ''}
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></g></svg>
          <span className="dock-label">Estoque</span>
        </button>
      </nav>
    </div>
  )
}
