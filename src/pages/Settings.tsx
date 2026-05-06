import { useEffect, useState } from 'react'

type ThemeName = 'light' | 'dark'
type SettingsSection = 'theme'

interface SettingsPageProps {
  section?: string
  onNavigate: (page: string, param?: string) => void
}

const themeLabels: Record<ThemeName, string> = {
  light: 'Claro',
  dark: 'Escuro',
}

function getStoredTheme(): ThemeName {
  const storedTheme = localStorage.getItem('bordados-theme')
  return storedTheme === 'dark' ? 'dark' : 'light'
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
  const [theme, setTheme] = useState<ThemeName>(() => getStoredTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bordados-theme', theme)
  }, [theme])

  const currentSection = section as SettingsSection | undefined

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
            {(['light', 'dark'] as ThemeName[]).map((themeOption) => (
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
    </div>
  )
}
