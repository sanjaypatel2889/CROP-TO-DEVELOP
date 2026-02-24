import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function Modal({ isOpen, onClose, title, children }) {
  const { isDark } = useTheme()

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`
        relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border p-6
        ${isDark
          ? 'bg-gray-900/95 border-white/10'
          : 'bg-white/95 border-gray-200'
        }
        backdrop-blur-xl shadow-2xl
      `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
