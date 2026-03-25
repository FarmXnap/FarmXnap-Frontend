import { useNavigate } from 'react-router-dom'
import AppLogo from '../component/AppLogo'
import { useAuthStore } from '../store'

export default function NotFound() {
  const navigate = useNavigate()
  const { user, role } = useAuthStore()

  const home = user && role === 'dealer' ? '/dealer' : user ? '/dashboard' : '/'

  return (
    <div className="page-shell grain">
      <div className="orb orb-1" />
      <nav className="app-nav">
        <div className="w-16" />
        <AppLogo />
        <div className="w-16" />
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
      <div className="flex flex-col items-center gap-5 px-8 anim-1">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}>
          🌾
        </div>
        <div>
          <p className="font-syne font-extrabold text-5xl text-(--tx-dim) mb-2">404</p>
          <p className="font-syne font-bold text-xl text-(--tx) mb-2">Page not found</p>
          <p className="text-sm text-(--tx-sub) leading-relaxed">
            This field is empty.<br />Let's get you back on track.
          </p>
        </div>
        <button className="btn-main w-full max-w-xs" onClick={() => navigate(home)}>
          ← Back to {user ? 'dashboard' : 'home'}
        </button>
      </div>
    </div>
      </div>
  )
}