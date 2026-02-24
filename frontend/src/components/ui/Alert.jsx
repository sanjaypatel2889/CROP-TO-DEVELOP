import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

const typeMap = {
  info: { icon: Info, bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  success: { icon: CheckCircle, bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400' },
  error: { icon: XCircle, bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400' },
}

export default function Alert({ type = 'info', children, className = '' }) {
  const config = typeMap[type] || typeMap.info
  const Icon = config.icon

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${className}`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.text}`} />
      <div className={`text-sm ${config.text}`}>{children}</div>
    </div>
  )
}
