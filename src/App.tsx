import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { processSyncQueue } from '@/services/sync/sync'
import AuthPage from '@/pages/Auth'
import Layout from '@/components/Layout'

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      try {
        await checkAuth()
      } catch (error) {
        console.error('Failed to check auth:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initialize()
  }, [checkAuth])

  // Auto-sync every 30 seconds when online
  useEffect(() => {
    if (!isAuthenticated) return

    const syncInterval = setInterval(() => {
      processSyncQueue().catch((error) =>
        console.error('Auto-sync failed:', error)
      )
    }, 30000)

    return () => clearInterval(syncInterval)
  }, [isAuthenticated])

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return <Layout />
}

export default App
