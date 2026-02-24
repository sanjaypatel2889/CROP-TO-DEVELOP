import { useTheme } from '../../context/ThemeContext'

export default function Input({ label, error, className = '', ...props }) {
  const { isDark } = useTheme()

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-xl border transition-all duration-200
          ${isDark
            ? 'bg-white/[0.06] border-white/[0.12] text-white placeholder-gray-500 focus:border-emerald-500/50 focus:bg-white/[0.1]'
            : 'bg-white/70 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white'
          }
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
