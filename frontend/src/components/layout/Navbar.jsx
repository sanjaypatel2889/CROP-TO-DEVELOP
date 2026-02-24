import { NavLink } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useFarmer } from '../../context/FarmerContext'
import {
  Home, Bug, CloudSun, TrendingUp, FlaskConical,
  ShieldAlert, Landmark, User, Sun, Moon, Sprout
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/disease-detector', label: 'Disease Detector', icon: Bug },
  { path: '/weather', label: 'Weather Alerts', icon: CloudSun },
  { path: '/market', label: 'Market Prices', icon: TrendingUp },
  { path: '/soil', label: 'Soil Health', icon: FlaskConical },
  { path: '/pest-warning', label: 'Pest Warning', icon: ShieldAlert },
  { path: '/schemes', label: 'Govt Schemes', icon: Landmark },
  { path: '/profile', label: 'My Profile', icon: User },
]

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { farmer } = useFarmer()

  return (
    <aside className={`
      hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 z-40
      ${isDark
        ? 'bg-gray-900/80 border-r border-white/[0.08]'
        : 'bg-white/60 border-r border-gray-200/60'
      }
      backdrop-blur-xl
    `}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Sprout className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>KisanAI</h1>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Farmer Advisory</p>
        </div>
      </div>

      {/* Farmer info */}
      {farmer && (
        <div className={`mx-4 mb-4 p-3 rounded-xl ${isDark ? 'bg-white/[0.05]' : 'bg-emerald-50'}`}>
          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {farmer.name}
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {farmer.district}, {farmer.state}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? isDark
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-emerald-500/10 text-emerald-700'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className="p-4">
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
            ${isDark
              ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  )
}
