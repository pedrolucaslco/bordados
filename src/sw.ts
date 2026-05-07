import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import type { PrecacheEntry } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope
interface ServiceWorkerLifecycleEvent extends Event {
  waitUntil(promise: Promise<unknown>): void
}

interface ServiceWorkerFetchEvent extends Event {
  request: Request
  respondWith(response: Promise<Response>): void
}

interface ServiceWorkerMessageEvent extends Event {
  data: {
    type?: string
  }
  ports: readonly MessagePort[]
  waitUntil(promise: Promise<unknown>): void
}

const serviceWorker = self as unknown as {
  skipWaiting(): void
  clients: {
    claim(): Promise<void>
  }
  addEventListener(type: 'activate', listener: (event: ServiceWorkerLifecycleEvent) => void): void
  addEventListener(type: 'fetch', listener: (event: ServiceWorkerFetchEvent) => void): void
  addEventListener(type: 'message', listener: (event: ServiceWorkerMessageEvent) => void): void
}

const CACHE_PREFIX = `bordados-${__APP_BUILD_SHORT_COMMIT__ || 'dev'}`
const ACTIVATION_CACHE_PREFIXES = ['bordados-', 'my-app-', 'google-fonts-cache', 'gstatic-fonts-cache']
const MANUAL_CLEAR_CACHE_PREFIXES = [...ACTIVATION_CACHE_PREFIXES, 'workbox-']

serviceWorker.skipWaiting()

precacheAndRoute(self.__WB_MANIFEST as Array<string | PrecacheEntry>)
cleanupOutdatedCaches()

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}-google-fonts`,
  })
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: `${CACHE_PREFIX}-google-fonts-webfonts`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  })
)

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}-api-cache`,
  })
)

serviceWorker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => ACTIVATION_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)))
          .filter((cacheName) => !cacheName.startsWith(CACHE_PREFIX))
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  )

  serviceWorker.clients.claim()
})

serviceWorker.addEventListener('message', (event) => {
  if (event.data?.type !== 'CLEAR_APP_CACHES') return

  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => MANUAL_CLEAR_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => {
        event.ports[0]?.postMessage({ type: 'APP_CACHES_CLEARED' })
      })
  )
})

serviceWorker.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((response) => response ?? Response.error())
      )
    )
  }
})
