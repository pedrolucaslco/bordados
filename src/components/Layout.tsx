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
import MorePage from '@/pages/More'

type TransitionDirection = 'forward' | 'back' | 'neutral'

function getRoutePosition(page: string, param?: string): number {
  if (page === 'dashboard') return 0
  if (page === 'calendar') return 1
  if (page === 'orders') return 2
  if (page === 'order_detail') return 2.5
  if (page === 'more') return 3
  if (page === 'production') return 4
  if (page === 'inventory') return 4.1
  if (page === 'clients') return 4.2
  if (page === 'products') return 4.3
  if (page === 'settings' && param) return 4.5
  if (page === 'settings') return 4.4
  return 3
}

export default function Layout() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [currentParam, setCurrentParam] = useState<string | undefined>()
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('neutral')
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
    const currentPosition = getRoutePosition(currentPage, currentParam)
    const nextPosition = getRoutePosition(page, param)
    const nextDirection = nextPosition > currentPosition
      ? 'forward'
      : nextPosition < currentPosition
        ? 'back'
        : 'neutral'

    setTransitionDirection(nextDirection)
    setCurrentPage(page)
    setCurrentParam(param)
  }

  const moreSubPages = ['production', 'inventory', 'clients', 'products', 'settings']
  const isMoreSubPage = moreSubPages.includes(currentPage)
  const isMoreActive = currentPage === 'more' || isMoreSubPage

  return (
    <div className="flex flex-col h-screen bg-base-300">
      {/* Header */}
      <header className="navbar border-b border-b-base-300 z-50">
        <div className="flex-1">
          {isMoreSubPage ? (
            <button className="btn btn-ghost gap-2 normal-case" onClick={() => handleNavigate('more')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19 3 12m0 0 7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
          ) : (
            <a className="btn btn-ghost text-xl normal-case">Bordados</a>
          )}
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
              {pendingSyncCount} sincronizando
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content-bg flex-1 overflow-y-auto pb-24">
        <div
          key={`${currentPage}-${currentParam || ''}`}
          className={`page-transition page-transition-${transitionDirection} min-h-full`}
        >
          {currentPage === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} />
          )}
          
          {currentPage === 'calendar' && <CalendarPage onNavigate={handleNavigate} />}
          {currentPage === 'clients' && <ClientsPage />}
          {currentPage === 'products' && <ProductsPage />}
          {currentPage === 'orders' && <OrdersPage onNavigate={handleNavigate} />}
          {currentPage === 'production' && <ProductionPage onNavigate={handleNavigate} />}
          {currentPage === 'inventory' && <InventoryPage />}
          {currentPage === 'more' && (
            <MorePage
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              isLogoutDisabled={pendingSyncCount > 0}
            />
          )}
          {currentPage === 'settings' && (
            <SettingsPage section={currentParam} onNavigate={handleNavigate} />
          )}
          {currentPage === 'order_detail' && currentParam && (
            <OrderDetailPage orderId={currentParam} onBack={() => handleNavigate('orders')} />
          )}
        </div>
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
          onClick={() => handleNavigate('more')}
          className={isMoreActive ? 'dock-active' : ''}
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="19" cy="12" r="2"></circle>
          </svg>
          <span className="dock-label">Mais</span>
        </button>
      </nav>
    </div>
  )
}
