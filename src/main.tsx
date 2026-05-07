import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './styles/index.css'

const storedTheme = localStorage.getItem('bordados-theme')
const themeAliases: Record<string, string> = {
  light: 'autumn',
  dark: 'sunset',
  autumn: 'autumn',
  sunset: 'sunset',
}

if (storedTheme && themeAliases[storedTheme]) {
  document.documentElement.setAttribute('data-theme', themeAliases[storedTheme])
}

// Register service worker
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
