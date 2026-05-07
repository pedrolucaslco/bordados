import type { ReactNode } from 'react'

interface MorePageProps {
  onNavigate: (page: string, param?: string) => void
  onLogout: () => void
  isLogoutDisabled?: boolean
}

interface MoreItem {
  page: string
  title: string
  description: string
  icon: ReactNode
}

function ChevronRightIcon() {
  return (
    <svg className="h-5 w-5 text-base-content/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7" />
    </svg>
  )
}

function IconBox({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-box bg-base-200 text-primary">
      {children}
    </span>
  )
}

function MoreList({ items, onNavigate }: { items: MoreItem[], onNavigate: MorePageProps['onNavigate'] }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <MoreListRows items={items} onNavigate={onNavigate} />
    </div>
  )
}

function MoreListRows({ items, onNavigate }: { items: MoreItem[], onNavigate: MorePageProps['onNavigate'] }) {
  return (
    <>
      {items.map(item => (
        <button
          key={item.page}
          className="flex w-full items-center justify-between gap-4 p-4 text-left"
          onClick={() => onNavigate(item.page)}
        >
          <span className="flex min-w-0 items-center gap-3">
            {item.icon}
            <span className="min-w-0">
              <span className="block font-medium">{item.title}</span>
              <span className="block truncate text-sm text-base-content/60">{item.description}</span>
            </span>
          </span>
          <ChevronRightIcon />
        </button>
      ))}
    </>
  )
}

const operationItems: MoreItem[] = [
  {
    page: 'production',
    title: 'Produção',
    description: 'Checklist e andamento dos pedidos',
    icon: (
      <IconBox>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.33.4.66.6 1h.1a2 2 0 1 1 0 4H20c-.2.34-.4.67-.6 1Z" />
        </svg>
      </IconBox>
    ),
  },
  {
    page: 'inventory',
    title: 'Estoque',
    description: 'Materiais, compras e reservas',
    icon: (
      <IconBox>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
        </svg>
      </IconBox>
    ),
  },
]

const registrationItems: MoreItem[] = [
  {
    page: 'clients',
    title: 'Clientes',
    description: 'Contatos, endereços e histórico',
    icon: (
      <IconBox>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </IconBox>
    ),
  },
  {
    page: 'products',
    title: 'Produtos',
    description: 'Categorias, preços e variações',
    icon: (
      <IconBox>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.6 13.5 13.5 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.7a2 2 0 0 1 0 2.8Z" />
          <circle cx="7.5" cy="7.5" r="1.5" />
        </svg>
      </IconBox>
    ),
  },
]

function LogoutIcon() {
  return (
    <IconBox>
      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M17 16l4-4m0 0l-4-4m4 4H7" />
        <path d="M13 20H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h7" />
      </svg>
    </IconBox>
  )
}

const systemItems: MoreItem[] = [
  {
    page: 'settings',
    title: 'Ajustes',
    description: 'Tema, dados demo e reset',
    icon: (
      <IconBox>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7 2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.3a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.4a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.3a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0 2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7 2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.3a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.4a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.3a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0 2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </IconBox>
    ),
  },
]

export default function MorePage({ onNavigate, onLogout, isLogoutDisabled = false }: MorePageProps) {
  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Mais</h2>
        <p className="text-sm text-base-content/60">Acesso rápido às outras áreas do aplicativo</p>
      </div>

      <section className="mb-6">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Operação
        </h3>
        <MoreList items={operationItems} onNavigate={onNavigate} />
      </section>

      <section className="mb-6">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Cadastros
        </h3>
        <MoreList items={registrationItems} onNavigate={onNavigate} />
      </section>

      <section className="mb-6">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Sistema
        </h3>
        <div className="card bg-base-100 shadow-sm">
          <div className="divide-y divide-base-200">
            <MoreListRows items={systemItems} onNavigate={onNavigate} />
            <button
              className="flex w-full items-center justify-between gap-4 p-4 text-left text-error disabled:opacity-60"
              onClick={onLogout}
              disabled={isLogoutDisabled}
            >
              <span className="flex min-w-0 items-center gap-3">
                <LogoutIcon />
                <span className="min-w-0">
                  <span className="block font-medium">Sair</span>
                  <span className="block truncate text-sm text-error/70">
                    {isLogoutDisabled ? 'Aguarde a sincronização terminar' : 'Encerrar sessão neste aparelho'}
                  </span>
                </span>
              </span>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
