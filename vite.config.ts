import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'path'

function getCommitFromGitFiles() {
  const gitHeadPath = path.resolve(__dirname, '.git/HEAD')
  if (!existsSync(gitHeadPath)) return 'dev'

  const head = readFileSync(gitHeadPath, 'utf8').trim()
  if (!head.startsWith('ref:')) return head

  const refPath = path.resolve(__dirname, '.git', head.replace('ref:', '').trim())
  if (existsSync(refPath)) {
    return readFileSync(refPath, 'utf8').trim()
  }

  const packedRefsPath = path.resolve(__dirname, '.git/packed-refs')
  if (!existsSync(packedRefsPath)) return 'dev'

  const refName = head.replace('ref:', '').trim()
  const packedRefLine = readFileSync(packedRefsPath, 'utf8')
    .split('\n')
    .find((line) => line.endsWith(` ${refName}`))

  return packedRefLine?.split(' ')[0] || 'dev'
}

function getBuildCommit() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA
    || process.env.CF_PAGES_COMMIT_SHA
    || process.env.COMMIT_REF
    || getCommitFromGitFiles()

  return {
    commit,
    shortCommit: commit.slice(0, 7),
    builtAt: new Date().toISOString(),
  }
}

const buildInfo = getBuildCommit()

function appBuildManifestPlugin() {
  return {
    name: 'app-build-manifest',
    configureServer(server) {
      server.middlewares.use('/app-build.json', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        response.end(`${JSON.stringify(buildInfo, null, 2)}\n`)
      })
    },
    writeBundle() {
      writeFileSync(
        path.resolve(__dirname, 'dist/app-build.json'),
        `${JSON.stringify(buildInfo, null, 2)}\n`
      )
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_COMMIT__: JSON.stringify(buildInfo.commit),
    __APP_BUILD_SHORT_COMMIT__: JSON.stringify(buildInfo.shortCommit),
    __APP_BUILD_BUILT_AT__: JSON.stringify(buildInfo.builtAt),
  },
  plugins: [
    tailwindcss(),
    react(),
    appBuildManifestPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Bordados - Gestão de Pedidos',
        short_name: 'Bordados',
        description: 'App para gestão de pedidos de bordados personalizados',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
