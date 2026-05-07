/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

export { }

declare global {
  const __APP_BUILD_COMMIT__: string
  const __APP_BUILD_SHORT_COMMIT__: string
  const __APP_BUILD_BUILT_AT__: string

  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
