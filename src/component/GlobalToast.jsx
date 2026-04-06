import { useToastStore } from '../store'
import { Check, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: Check,
  error:   AlertCircle,
  info:    Info,
}

const COLORS = {
  success: { bg: '#1D9E75', shadow: 'rgba(29,158,117,0.4)'  },
  error:   { bg: '#EF4444', shadow: 'rgba(239,68,68,0.4)'   },
  info:    { bg: '#EF9F27', shadow: 'rgba(239,159,39,0.4)'   },
}

export default function GlobalToast() {
  const { toast, hide } = useToastStore()

  if (!toast) return null

  const Icon  = ICONS[toast.type]  || Check
  const color = COLORS[toast.type] || COLORS.success

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
    >
      <div
        className="w-full max-w-[390px] flex items-center gap-3 px-4 py-3.5 rounded-2xl pointer-events-auto"
        style={{
          background:  color.bg,
          boxShadow:   `0 8px 32px ${color.shadow}`,
          animation:   'slide-up 0.3s ease forwards',
        }}
      >
        {/* Icon */}
        <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon size={14} className="text-white" strokeWidth={2.5} />
        </div>

        {/* Message */}
        <p className="flex-1 text-white text-sm font-medium leading-snug">
          {toast.message}
        </p>

        {/* Dismiss */}
        <button
          onClick={hide}
          className="text-white/70 hover:text-white transition-colors shrink-0 active:scale-90"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}