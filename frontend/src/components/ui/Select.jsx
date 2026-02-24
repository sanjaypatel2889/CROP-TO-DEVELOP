import { useTheme } from '../../context/ThemeContext'

export default function Select({ label, options = [], placeholder = 'Select...', error, className = '', ...props }) {
  const { isDark } = useTheme()

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 rounded-xl border transition-all duration-200 appearance-none
          ${isDark
            ? 'bg-white/[0.06] border-white/[0.12] text-white focus:border-emerald-500/50'
            : 'bg-white/70 border-gray-300 text-gray-900 focus:border-emerald-500'
          }
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt} className={isDark ? 'bg-gray-900' : 'bg-white'}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
