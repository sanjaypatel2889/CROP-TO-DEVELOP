import { Outlet } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import MobileNav from './components/layout/MobileNav'
import { useTheme } from './context/ThemeContext'

export default function App() {
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen ${isDark
      ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-blue-950'
      : 'bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50'
    }`}>
      {/* Ambient gradient orbs for glassmorphism */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl ${
          isDark ? 'bg-emerald-500/20' : 'bg-emerald-400/20'
        }`} />
        <div className={`absolute top-60 right-20 w-96 h-96 rounded-full blur-3xl ${
          isDark ? 'bg-blue-500/15' : 'bg-blue-400/15'
        }`} />
        <div className={`absolute bottom-40 left-1/3 w-80 h-80 rounded-full blur-3xl ${
          isDark ? 'bg-purple-500/10' : 'bg-purple-400/10'
        }`} />
      </div>

      <div className="relative z-10 flex">
        <Navbar />
        <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-6">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
