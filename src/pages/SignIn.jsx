import { useAutoError } from '../hooks/useAutoError'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLogo from '../component/AppLogo'
import { requestLoginOTP } from '../services/api'

export default function SignIn() {
  const navigate = useNavigate()
  const [role,    setRole]    = useState('farmer')
  const [phone,   setPhone]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useAutoError()

  const isDealer  = role === 'dealer'
  const accent    = isDealer ? '#EF9F27' : '#1D9E75'
  const accentFade = isDealer ? 'rgba(239,159,39,0.5)' : 'rgba(29,158,117,0.5)'
  const eyebrow   = isDealer ? 'Welcome back' : 'Welcome back'

  const handleSend = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 7) { setError('Enter a valid phone number'); return }
    setLoading(true); setError('')
    try {
      await requestLoginOTP(phone)
      navigate('/verify-otp', { state: { phone, role, isSignIn: true }, replace: true })
    } catch (e) { setError(e.message || 'Could not send OTP. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="page-shell grain">
      <div className="orb orb-1" />

      {/* Nav */}
      <nav className="app-nav">
        <button className="nav-back" onClick={() => navigate('/')}>← Back</button>
        <AppLogo />
        <div className="w-16" />
      </nav>

      {/* Body */}
      <div className="page-body">
        <header className="page-header">
          {/* Eyebrow — turns amber for dealer */}
          <p className="page-eyebrow" style={{ color: isDealer ? 'rgba(239,159,39,0.7)' : undefined }}>
            {eyebrow}
          </p>
          <h1 className="page-title">Sign in</h1>
          <p className="page-subtitle">Enter your number to receive a 6-digit code</p>
        </header>

        {/* Role toggle */}
        <div className="field-wrap anim-1">
          <span className="field-label">I am a</span>
          <div className="role-toggle">
            <button className={`role-pill ${role === 'farmer' ? 'farmer-on' : ''}`} onClick={() => setRole('farmer')}>
              🌾 Farmer
            </button>
            <button className={`role-pill ${role === 'dealer' ? 'dealer-on' : ''}`} onClick={() => setRole('dealer')}>
              🏪 Agro-dealer
            </button>
          </div>
        </div>

        {/* Phone — border accent changes with role */}
        <div className="field-wrap anim-2">
          <span className="field-label">Phone number</span>
          <div className="flex items-center rounded-2xl overflow-hidden transition-all"
              style={{ background: 'var(--input-bg)', border: `1.5px solid var(--input-br)` }}
              onFocus={e => e.currentTarget.style.borderColor = accentFade}
              onBlur={e  => e.currentTarget.style.borderColor = 'var(--input-br)'}>
            <span className="pl-4 pr-2 font-mono text-sm font-semibold shrink-0 select-none transition-all"
              style={{ color: accent }}>
              +234
            </span>
            <div className="w-px h-5 shrink-0" style={{ background: 'var(--card-br)' }} />
            <input
              className="flex-1 bg-transparent outline-none px-3 py-3.5 text-sm font-dm"
              style={{ color: 'var(--tx)' }}
              type="tel"
              placeholder="803 456 7890"
              value={phone}
              maxLength={10}
              onChange={e => setPhone(e.target.value.replace(/[^0-9 ]/g, '').replace(/^0+/, '').slice(0, 10))}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
          </div>
          <p className="field-hint">We'll send a 6-digit code to verify it's you</p>
        </div>

        {error && (
          <div className="err-banner anim-3">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="h-20" />
      </div>

      {/* CTA */}
      <div className="page-cta">
        <button
          className={`btn-main ${isDealer ? 'amber' : ''}`}
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? <><span className="spinner" /> Sending code…</> : 'Send OTP code →'}
        </button>
        <p className="cta-note" style={{ "--cta-link-color": isDealer ? "rgba(239,159,39,0.8)" : undefined }}>
          Don't have an account?{' '}
          <button onClick={() => navigate('/role')}>Create one free</button>
        </p>
      </div>
    </div>
  )
}