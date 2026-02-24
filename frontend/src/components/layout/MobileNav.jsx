import { NavLink } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Home, Bug, CloudSun, TrendingUp, Menu } from 'lucide-react'
import { useState } from 'react'
import { FlaskConical, ShieldAlert, Landmark, User, X, Sun, Moon, Sprout } from 'lucide-react'

const mainTabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/disease-detector', label: 'Disease', icon: Bug },
  { path: '/weather', label: 'Weather', icon: CloudSun },
  { path: '/market', label: 'Market', icon: TrendingUp },
]

const moreTabs = [
  { path: '/soil', label: 'Soil Health', icon: FlaskConical },
  { path: '/pest-warning', label: 'Pest Warning', icon: ShieldAlert },
  { path: '/schemes', label: 'Govt Schemes', icon: Landmark },
  { path: '/profile', label: 'My Profile', icon: User },
]

export default function MobileNav() {
  const { isDark, toggleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMoreOpen(false)} />
          <div className={`
            absolute bottom-16 left-0 right-0 mx-4 mb-2 rounded-2xl border p-4 space-y-2
            ${isDark ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-gray-200'}
            backdrop-blur-xl
          `}>
            {moreTabs.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => { toggleTheme(); setMoreOpen(false) }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}
              `}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className={`
        fixed bottom-0 left-0 right-0 lg:hidden z-50
        ${isDark
          ? 'bg-gray-900/90 border-t border-white/[0.08]'
          : 'bg-white/80 border-t border-gray-200/60'
        }
        backdrop-blur-xl
      `}>
        <div className="flex justify-around items-center px-2 py-1">
          {mainTabs.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `
                flex flex-col items-center py-2 px-3 rounded-xl transition-colors min-w-[60px]
                ${isActive
                  ? 'text-emerald-400'
                  : isDark ? 'text-gray-500' : 'text-gray-400'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`
              flex flex-col items-center py-2 px-3 rounded-xl transition-colors min-w-[60px]
              ${moreOpen ? 'text-emerald-400' : isDark ? 'text-gray-500' : 'text-gray-400'}
            `}
          >
            {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
