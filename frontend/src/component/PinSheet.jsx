import { useState, useEffect } from 'react'
import { useAutoError } from '../hooks/useAutoError'
import { Shield, X, Delete } from 'lucide-react'
import { usePinStore } from '../store'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

/**
 * PinSheet
 *
 * Two modes:
 * - isCreate (signup): Enter → Confirm → onSuccess(pin)
 * - default (transaction): Single entry → onSuccess(pin), errors handled by backend
 */
export default function PinSheet({ open, title, subtitle, onSuccess, onClose, isCreate = false }) {
  const { recordFailure, isLocked, secondsLeft } = usePinStore()

  const [step,    setStep]    = useState('enter')  // 'enter' | 'confirm'
  const [pin1,    setPin1]    = useState('')
  const [pin2,    setPin2]    = useState('')
  const [error,   setError]   = useAutoError()
  const [shake,   setShake]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [secs,    setSecs]    = useState(0)

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('enter'); setPin1(''); setPin2('')
      setError(''); setLoading(false)
    }
  }, [open])

  // Lockout countdown (only relevant for transaction mode)
  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setSecs(isLocked() ? secondsLeft() : 0), 500)
    return () => clearInterval(t)
  }, [open])

  if (!open) return null

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500) }
  const locked = !isCreate && isLocked()
  const currentPin = step === 'enter' ? pin1 : pin2
  const setCurrentPin = step === 'enter' ? setPin1 : setPin2

  const tap = async (d) => {
    if (loading || locked) return
    if (d === '⌫') {
      setCurrentPin(p => p.slice(0, -1))
      setError('')
      return
    }
    if (currentPin.length >= 4) return
    const next = currentPin + d
    setCurrentPin(next)
    if (next.length === 4) {
      if (isCreate) {
        await handleCreate(next)
      } else {
        await submit(next)
      }
    }
  }

  // Create mode — step 1: save pin1, move to confirm
  // Create mode — step 2: compare, call onSuccess
  const handleCreate = async (code) => {
    if (step === 'enter') {
      setTimeout(() => { setStep('confirm'); setError('') }, 200)
      return
    }
    // Confirm step
    if (code !== pin1) {
      setError("PINs don't match. Try again.")
      triggerShake()
      setTimeout(() => {
        setStep('enter'); setPin1(''); setPin2(''); setError('')
      }, 800)
      return
    }
    setLoading(true)
    try {
      await onSuccess(pin1)
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to set PIN. Please try again.')
      setStep('enter'); setPin1(''); setPin2('')
    } finally { setLoading(false) }
  }

  // Transaction mode — single entry, backend validates
  const submit = async (code) => {
    setLoading(true)
    try {
      await onSuccess(code)
      onClose()
    } catch (e) {
      const attempts = recordFailure()
      setError(
        isLocked()
          ? `Too many attempts. Wait ${secondsLeft()}s`
          : `Wrong PIN — ${3 - attempts} attempt${3 - attempts === 1 ? '' : 's'} left`
      )
      triggerShake()
      setCurrentPin('')
    } finally { setLoading(false) }
  }

  // Dynamic title/subtitle for create mode steps
  const displayTitle    = isCreate
    ? (step === 'enter' ? 'Create transaction PIN' : 'Confirm your PIN')
    : title
  const displaySubtitle = isCreate
    ? (step === 'enter' ? 'Choose a 4-digit PIN to secure your payments' : 'Re-enter your PIN to confirm')
    : subtitle

  // Step indicator for create mode
  const stepDots = isCreate && (
    <div className="flex justify-center gap-2 mb-5">
      {['enter','confirm'].map((s, i) => (
        <div key={s} className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: step === s ? 24 : 16,
            background: (step === 'confirm' && i === 0) || step === s
              ? '#1D9E75' : 'var(--card-br)',
          }} />
      ))}
    </div>
  )

  const statusText = () => {
    if (error) return error
    if (loading) return isCreate ? 'Saving PIN…' : 'Verifying…'
    if (locked) return `Locked — wait ${secs}s`
    if (isCreate) return step === 'enter' ? 'Enter 4 digits' : 'Re-enter to confirm'
    return 'Enter your transaction PIN'
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center max-w-[430px] mx-auto"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full rounded-t-[32px] px-6 pt-4 pb-8"
        style={{ background: 'var(--bg)', border: '1px solid var(--card-br)', animation: 'slide-up 0.28s ease' }}>

        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-6 bg-(--card-br)" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(29,158,117,0.12)', border: '1.5px solid rgba(29,158,117,0.25)' }}>
              <Shield size={17} className="text-brand-green" />
            </div>
            <div>
              <p className="font-syne font-bold text-sm text-(--tx) leading-tight">{displayTitle}</p>
              <p className="text-xs text-(--tx-sub) mt-0.5 leading-snug">{displaySubtitle}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}>
            <X size={15} className="text-(--tx-sub)" />
          </button>
        </div>

        {/* Step dots — create mode only */}
        {stepDots}

        {/* PIN dots */}
        <div className="flex items-center justify-center gap-5 py-4 mb-2"
          style={{ animation: shake ? 'shake 0.4s ease' : undefined }}>
          {[0,1,2,3].map(i => {
            const filled = i < currentPin.length
            return (
              <div key={i} className="transition-all duration-150" style={{ width: 18, height: 18 }}>
                {filled ? (
                  <div className="w-full h-full rounded-full"
                    style={{ background: '#1D9E75', boxShadow: '0 0 10px rgba(29,158,117,0.5)' }} />
                ) : (
                  <div className="w-full h-full rounded-full"
                    style={{ border: '2px solid rgba(29,158,117,0.3)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Status */}
        <p className={`text-center text-xs mb-5 font-medium ${error ? 'text-red-400' : 'text-(--tx-dim)'}`}>
          {statusText()}
        </p>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[300px] mx-auto">
          {KEYS.map((k, i) => {
            const isDelete = k === '⌫'
            const isEmpty  = k === ''
            return (
              <button key={i}
                disabled={!k || loading || locked}
                onClick={() => k && tap(k)}
                className={`flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
                  isEmpty ? 'opacity-0 pointer-events-none' : ''
                }`}
                style={{
                  height: 58,
                  background: isEmpty ? 'transparent' : isDelete ? 'transparent' : 'var(--card-bg)',
                  border: isEmpty || isDelete ? 'none' : '1px solid var(--card-br)',
                  opacity: locked && k ? 0.4 : 1,
                }}>
                {isDelete ? (
                  <Delete size={20} className="text-(--tx-sub)" />
                ) : k ? (
                  <span className="font-syne font-bold text-xl text-(--tx)">{k}</span>
                ) : null}
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}