import { useEffect, useState } from 'react'
import { resetApplicationData } from '@/services/reset/appData'
import { generateDemoData, type DemoDataResult } from '@/services/seed/demoData'
import { useAuthStore } from '@/stores/auth'
import { useClientsStore } from '@/stores/clients'
import { useInventoryStore } from '@/stores/inventory'
import { useOrdersStore } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import { useProductionStore } from '@/stores/production'

type ThemeName = 'autumn' | 'sunset'
type SettingsSection = 'theme'

interface SettingsPageProps {
  section?: string
  onNavigate: (page: string, param?: string) => void
}

const themeLabels: Record<ThemeName, string> = {
  autumn: 'Claro',
  sunset: 'Escuro',
}

function getStoredTheme(): ThemeName {
  const storedTheme = localStorage.getItem('bordados-theme')
  if (storedTheme === 'sunset' || storedTheme === 'dark') return 'sunset'
  return 'autumn'
}

function ChevronRightIcon() {
  return (
    <svg className="h-5 w-5 text-base-content/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 13 4 4L19 7" />
    </svg>
  )
}

function SettingsBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button className="btn btn-ghost btn-circle" onClick={onBack} title="Voltar">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19 3 12m0 0 7-7m-7 7h18" />
      </svg>
    </button>
  )
}

export default function SettingsPage({ section, onNavigate }: SettingsPageProps) {
  const userId = useAuthStore(state => state.userId)
  const { fetchClients } = useClientsStore()
  const { fetchInventory } = useInventoryStore()
  const { fetchOrders } = useOrdersStore()
  const { fetchData: fetchProducts } = useProductsStore()
  const { fetchSteps } = useProductionStore()
  const [theme, setTheme] = useState<ThemeName>(() => getStoredTheme())
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false)
  const [isResettingData, setIsResettingData] = useState(false)
  const [demoResult, setDemoResult] = useState<DemoDataResult | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bordados-theme', theme)
  }, [theme])

  const currentSection = section as SettingsSection | undefined

  const refreshStores = async () => {
    await Promise.all([
      fetchClients(),
      fetchInventory(),
      fetchOrders(),
      fetchProducts(),
      fetchSteps(),
    ])
  }

  const handleGenerateDemoData = async () => {
    if (!userId) return
    const shouldGenerate = confirm('Gerar dados ficticios para este usuario? Eles serao adicionados aos dados atuais e entrarao na fila de sincronizacao.')
    if (!shouldGenerate) return

    setIsGeneratingDemo(true)
    setDemoResult(null)
    try {
      const result = await generateDemoData(userId)
      await refreshStores()
      setDemoResult(result)
    } catch (error) {
      alert(`Nao foi possivel gerar dados de demonstracao: ${(error as Error).message}`)
    } finally {
      setIsGeneratingDemo(false)
    }
  }

  const handleResetApplicationData = async () => {
    if (!userId) return

    const firstConfirm = confirm('Limpar todos os dados do aplicativo para este usuario? Esta acao apaga clientes, produtos, pedidos, pagamentos, producao e estoque.')
    if (!firstConfirm) return

    const typedConfirm = prompt('Digite RESETAR para confirmar.')
    if (typedConfirm !== 'RESETAR') return

    setIsResettingData(true)
    setDemoResult(null)
    try {
      await resetApplicationData(userId)
      await refreshStores()
      alert('Dados do aplicativo limpos com sucesso.')
    } catch (error) {
      alert(`Nao foi possivel limpar os dados: ${(error as Error).message}`)
    } finally {
      setIsResettingData(false)
    }
  }

  if (currentSection === 'theme') {
    return (
      <div className="p-4 pb-24">
        <div className="mb-6 flex items-center gap-3">
          <SettingsBackButton onBack={() => onNavigate('settings')} />
          <div>
            <h2 className="text-2xl font-bold">Tema</h2>
            <p className="text-sm text-base-content/60">Aparência padrão do aplicativo</p>
          </div>
        </div>

        <section className="card bg-base-100 shadow-sm">
          <div className="divide-y divide-base-200">
            {(['autumn', 'sunset'] as ThemeName[]).map((themeOption) => (
              <button
                key={themeOption}
                className="flex w-full items-center justify-between p-4 text-left"
                onClick={() => setTheme(themeOption)}
              >
                <span className="font-medium">{themeLabels[themeOption]}</span>
                {theme === themeOption && <CheckIcon />}
              </button>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Ajustes</h2>
        <p className="text-sm text-base-content/60">Preferências e configurações do aplicativo</p>
      </div>

      <section className="mb-6">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Aparência
        </h3>
        <div className="card bg-base-100 shadow-sm">
          <div className="divide-y divide-base-200">
            <button
              className="flex w-full items-center justify-between gap-4 p-4 text-left"
              onClick={() => onNavigate('settings', 'theme')}
            >
              <span>
                <span className="block font-medium">Tema</span>
                <span className="block text-sm text-base-content/60">{themeLabels[theme]}</span>
              </span>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Dados
        </h3>
        <div className="card bg-base-100 shadow-sm">
          <div className="divide-y divide-base-200">
            <button
              className="flex w-full items-center justify-between gap-4 p-4 text-left disabled:opacity-60"
              onClick={handleGenerateDemoData}
              disabled={isGeneratingDemo || !userId}
            >
              <span>
                <span className="block font-medium">Gerar dados de demonstração</span>
                <span className="block text-sm text-base-content/60">
                  Clientes, pedidos, pagamentos, produção e estoque fictícios
                </span>
              </span>
              {isGeneratingDemo ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <ChevronRightIcon />
              )}
            </button>
            {demoResult && (
              <div className="p-4 text-sm text-success">
                Demo gerado: {demoResult.clients} clientes, {demoResult.orders} pedidos, {demoResult.orderItems} itens, {demoResult.payments} pagamentos, {demoResult.materials} materiais e {demoResult.reservations} reservas.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Zona de risco
        </h3>
        <div className="card bg-base-100 shadow-sm">
          <button
            className="flex w-full items-center justify-between gap-4 p-4 text-left text-error disabled:opacity-60"
            onClick={handleResetApplicationData}
            disabled={isResettingData || !userId}
          >
            <span>
              <span className="block font-medium">Limpar todos os dados</span>
              <span className="block text-sm text-error/70">
                Remove dados locais e remotos deste usuário
              </span>
            </span>
            {isResettingData ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <ChevronRightIcon />
            )}
          </button>
        </div>
      </section>
    </div>
  )
}
