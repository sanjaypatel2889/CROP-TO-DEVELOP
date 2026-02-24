import { useTheme } from '../../context/ThemeContext'

const variants = {
  primary: {
    dark: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
    light: 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600',
  },
  secondary: {
    dark: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
    light: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600',
  },
  danger: {
    dark: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
    light: 'bg-red-500 text-white border-red-600 hover:bg-red-600',
  },
  ghost: {
    dark: 'bg-transparent text-gray-300 border-white/10 hover:bg-white/10',
    light: 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-100',
  },
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const { isDark } = useTheme()
  const mode = isDark ? 'dark' : 'light'
  const variantStyles = variants[variant]?.[mode] || variants.primary[mode]

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl border font-medium
        transition-all duration-200
        ${variantStyles}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
