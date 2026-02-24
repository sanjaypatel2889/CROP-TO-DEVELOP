import { useTheme } from '../../context/ThemeContext'

export default function GlassCard({ children, className = '', hover = true, onClick, ...props }) {
  const { isDark } = useTheme()

  return (
    <div
      className={`
        rounded-2xl p-6 transition-all duration-300
        ${isDark
          ? 'bg-white/[0.08] border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
          : 'bg-white/60 border border-white/40 shadow-lg'
        }
        backdrop-blur-xl
        ${hover ? isDark
          ? 'hover:bg-white/[0.12] hover:border-white/[0.2]'
          : 'hover:bg-white/70 hover:shadow-xl'
          : ''
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
