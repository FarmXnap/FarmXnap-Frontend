import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) setInterval(() => r.update(), 60 * 1000)
    },
    onRegisterError(error) {
      console.error('[FarmXnap] SW error:', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      className="fixed left-0 right-0 z-9999 flex justify-center px-4 pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      <div
        className="w-full max-w-97.5 rounded-2xl px-4 py-3 flex items-center gap-3 pointer-events-auto"
        style={{
          background: '#1D9E75',
          boxShadow: '0 4px 24px rgba(29,158,117,0.4)',
          animation: 'slide-up 0.3s ease forwards',
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <RefreshCw size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">Update available</p>
          <p className="text-white/70 text-xs mt-0.5">A new version of FarmXnap is ready</p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-white text-brand-green text-xs font-syne font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-all shrink-0">
          Update
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-white/60 active:scale-95 transition-all shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}