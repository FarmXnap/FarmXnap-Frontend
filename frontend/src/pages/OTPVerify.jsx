import { useAutoError } from '../hooks/useAutoError'
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppLogo from '../component/AppLogo'
import StepProgress from '../component/StepProgress'
import { verifyOTP, adminGetAllUsers } from '../services/api'
import { useAuthStore, useToastStore } from '../store'

export default function OTPVerify() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { phone, role, isSignUp, nextRoute } = location.state || {}
  const [otp,       setOtp]       = useState(['','','','','',''])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [countdown, setCountdown] = useState(60)
  const refs        = useRef([])
  const setAuth     = useAuthStore(s => s.setAuth)
  const showToast   = useToastStore(s => s.show)

  useEffect(() => {
    if (!phone) navigate('/')
    // Demo mode: autofill 123456 so testers don't need a real phone
    const demoOtp = sessionStorage.getItem('farmxnap-otp')
    if (demoOtp && demoOtp.length === 6) {
      setOtp(demoOtp.split(''))
    } else {
      // Mock: use 123456 as demo OTP
      setOtp(['1','2','3','4','5','6'])
    }
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  const handleChange = (val, i) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
    if (next.every(d => d)) handleVerify(next.join(''))
  }

  const handleKey = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handleVerify = async (code) => {
    const pin = code || otp.join('')
    if (pin.length !== 6) return
    setLoading(true); setError('')
    try {
      // Dealer signup — update stored OTP with what user typed, then go to details
      if (role === 'dealer' && isSignUp && nextRoute) {
        // Store the typed OTP so submitDealerDetails sends exactly this
        sessionStorage.setItem('farmxnap-otp', pin)
        localStorage.setItem('farmxnap-otp', pin)
        navigate(nextRoute, { state: { phone }, replace: true })
        return
      }
      // Farmer signup — same
      if (role === 'farmer' && isSignUp && nextRoute) {
        sessionStorage.setItem('farmxnap-otp', pin)
        localStorage.setItem('farmxnap-otp', pin)
        navigate(nextRoute, { state: { phone }, replace: true })
        return
      }
      // Sign in — verify OTP, get token + check role matches what they selected
      const res = await verifyOTP(phone, pin, role)

      // Role mismatch guard
      const actualRole   = res.role   // already normalized: 'farmer' | 'dealer'
      const selectedRole = role === 'dealer' ? 'dealer' : 'farmer'
      if (actualRole !== selectedRole) {
        const actualLabel   = actualRole   === 'farmer' ? 'Farmer' : 'Agro-dealer'
        const selectedLabel = selectedRole === 'farmer' ? 'Farmer' : 'Agro-dealer'
        setError(`This number is registered as a ${actualLabel}. Please select "${actualLabel}" to sign in.`)
        setOtp(['','','','','',''])
        refs.current[0]?.focus()
        return
      }

      if (res.role === 'dealer') {
        // Dealers must be verified by admin before accessing dashboard
        // Check verification status via admin endpoint
        let verified = false
        try {
          const { dealers } = await adminGetAllUsers()
          const match = dealers.find(d => d.id === res.user.id)
          verified = match?.is_verified === true
        } catch {
          // Admin check failed — default to unverified (safe)
          verified = false
        }
        setAuth({ ...res.user, is_verified: verified }, res.token, res.role)
        if (!verified) {
          showToast('Your account is pending admin approval.', 'info')
          navigate('/dealer-pending', { replace: true })
          return
        }
        showToast('Welcome back! Login successful.', 'success')
        navigate('/dealer', { replace: true })
      } else {
        // Farmers — never call admin endpoint
        setAuth(res.user, res.token, res.role)
        showToast(res.message || 'Login successful.', 'success')
        navigate('/dashboard', { replace: true })
      }
    } catch (e) {
      const msg = e.message || 'Invalid code. Please try again.'
      setError(msg)
      setOtp(['','','','','',''])
      refs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const isDealer = role === 'dealer'

  return (
    <div className="page-shell grain">
      <div className="orb orb-1" />

      <nav className="app-nav">
        <button className="nav-back" onClick={() => {
          if (isSignUp) {
            navigate(role === 'dealer' ? '/signup/dealer' : '/signup/farmer', { replace: true })
          } else {
            navigate('/signin', { replace: true })
          }
        }}>← Back</button>
        <AppLogo />
        <div className="w-16" />
      </nav>

      <div className="page-body">
        <header className="page-header">
          <p className="page-eyebrow" style={{ color: isDealer ? 'rgba(239,159,39,0.7)' : undefined }}>
            Verification
          </p>
          <h1 className="page-title">Enter code</h1>
          <p className="page-subtitle">
            6-digit code sent to{' '}
            <span className="text-(--tx) font-medium">{phone}</span>
          </p>
        </header>

        <div className="anim-1">
          {/* OTP boxes */}
          <div className={`flex gap-2 mb-6 w-full max-w-xs mx-auto ${isDealer ? 'otp-amber' : ''}`}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                className={`otp-input ${digit ? 'filled' : ''}`}
                type="tel"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, i)}
                onKeyDown={e => handleKey(e, i)}
              />
            ))}
          </div>

          {error && (
            <div className="err-banner mb-4"><span>⚠</span> {error}</div>
          )}

          <p className="text-center text-sm text-(--tx-sub)">
            {countdown > 0 ? (
              <>Resend in <span className="text-(--tx) font-semibold">0:{String(countdown).padStart(2,'0')}</span></>
            ) : (
              <button
                className="underline underline-offset-2 bg-transparent border-none cursor-pointer text-sm font-dm"
                style={{ color: isDealer ? 'rgba(239,159,39,0.8)' : 'rgba(29,158,117,0.8)' }}
                onClick={() => setCountdown(60)}
              >
                Resend code
              </button>
            )}
          </p>
        </div>

        <div className="h-2" />
      </div>

      <div className="page-cta">
        <button
          className={`btn-main ${isDealer ? 'amber' : ''}`}
          onClick={() => handleVerify()}
          disabled={loading || otp.some(d => !d)}
        >
          {loading ? <><span className="spinner" /> Verifying…</> : 'Verify & continue →'}
        </button>
      </div>
    </div>
  )
}