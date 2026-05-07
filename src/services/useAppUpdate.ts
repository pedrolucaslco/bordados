import { useCallback, useEffect, useState } from 'react'
import { checkForAppUpdate, currentBuildInfo, refreshApp, type AppUpdateState } from '@/services/appUpdate'

const CHECK_INTERVAL_MS = 15 * 60 * 1000

const initialState: AppUpdateState = {
  status: 'idle',
  currentCommit: currentBuildInfo.commit,
}

export function useAppUpdate() {
  const [state, setState] = useState<AppUpdateState>(initialState)

  const checkUpdate = useCallback(async () => {
    setState((current) => ({
      ...current,
      status: navigator.onLine ? 'checking' : 'offline',
      errorMessage: undefined,
    }))

    const result = await checkForAppUpdate()
    setState(result)
    return result
  }, [])

  const refresh = useCallback(async () => {
    setState((current) => ({
      ...current,
      status: 'refreshing',
      errorMessage: undefined,
    }))

    try {
      await refreshApp()
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Não foi possível atualizar o app',
      }))
    }
  }, [])

  useEffect(() => {
    void checkUpdate()

    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        void checkUpdate()
      }
    }, CHECK_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkUpdate()
      }
    }

    const handleOnline = () => {
      void checkUpdate()
    }

    const handleOffline = () => {
      setState((current) => ({
        ...current,
        status: 'offline',
        lastCheckedAt: new Date().toISOString(),
        errorMessage: undefined,
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkUpdate])

  return {
    appUpdate: state,
    checkUpdate,
    refreshApp: refresh,
  }
}
