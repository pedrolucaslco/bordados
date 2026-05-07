export type AppUpdateStatus = 'idle' | 'checking' | 'upToDate' | 'available' | 'offline' | 'refreshing' | 'error'

export interface AppBuildInfo {
  commit: string
  shortCommit: string
  builtAt: string
}

export interface AppUpdateState {
  status: AppUpdateStatus
  currentCommit: string
  latestCommit?: string
  lastCheckedAt?: string
  errorMessage?: string
}

export const currentBuildInfo: AppBuildInfo = {
  commit: __APP_BUILD_COMMIT__,
  shortCommit: __APP_BUILD_SHORT_COMMIT__,
  builtAt: __APP_BUILD_BUILT_AT__,
}

const APP_CACHE_PREFIXES = ['bordados-', 'my-app-', 'workbox-', 'google-fonts-cache', 'gstatic-fonts-cache']

export async function checkForAppUpdate(): Promise<AppUpdateState> {
  if (!navigator.onLine) {
    return {
      status: 'offline',
      currentCommit: currentBuildInfo.commit,
      lastCheckedAt: new Date().toISOString(),
    }
  }

  try {
    const response = await fetch(`/app-build.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao verificar atualização (${response.status})`)
    }

    const latestBuild = await response.json() as AppBuildInfo
    const isAvailable = Boolean(latestBuild.commit && latestBuild.commit !== currentBuildInfo.commit)

    return {
      status: isAvailable ? 'available' : 'upToDate',
      currentCommit: currentBuildInfo.commit,
      latestCommit: latestBuild.commit,
      lastCheckedAt: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'error',
      currentCommit: currentBuildInfo.commit,
      lastCheckedAt: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : 'Não foi possível verificar atualizações',
    }
  }
}

async function clearCachesFromWindow() {
  if (!('caches' in window)) return

  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter((cacheName) => APP_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)))
      .map((cacheName) => caches.delete(cacheName))
  )
}

async function askServiceWorkerToClearCaches() {
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready
  const targetWorker = registration.active || registration.waiting || registration.installing
  if (!targetWorker) return

  await new Promise<void>((resolve) => {
    const channel = new MessageChannel()
    const timeout = window.setTimeout(resolve, 1500)

    channel.port1.onmessage = () => {
      window.clearTimeout(timeout)
      resolve()
    }

    targetWorker.postMessage({ type: 'CLEAR_APP_CACHES' }, [channel.port2])
  })
}

export async function refreshApp() {
  if (!navigator.onLine) {
    throw new Error('Conecte-se à internet para atualizar o app')
  }

  await askServiceWorkerToClearCaches()
  await clearCachesFromWindow()

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.update()))
  }

  window.location.reload()
}
