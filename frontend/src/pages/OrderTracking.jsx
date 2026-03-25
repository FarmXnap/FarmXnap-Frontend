import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppLogo from '../component/AppLogo'
import PinSheet from '../component/PinSheet'
import { Phone, Copy, Check, Home, Shield, Clock, AlertTriangle, Truck, Package, CheckCircle, RefreshCw, X, ChevronRight } from 'lucide-react'
import { useOrderStore, useToastStore } from '../store'
import { confirmDelivery, fileAppeal, respondToReleaseRequest } from '../services/api'

const STEPS = [
  { key: 'paid',       icon: '🔒', label: 'Payment in escrow',   desc: 'Funds held securely by Interswitch', color: '#1D9E75' },
  { key: 'confirmed',  icon: '📦', label: 'Dealer notified',      desc: 'Dealer is preparing your order',    color: '#1D9E75' },
  { key: 'dispatched', icon: '🚚', label: 'Order dispatched',     desc: 'Treatment is on its way to you',    color: '#EF9F27' },
  { key: 'delivered',  icon: '✅', label: 'Confirm receipt',      desc: 'Releases payment from escrow to dealer', color: '#1D9E75' },
]

const APPEAL_REASONS = [
  { key: 'no_delivery',    label: 'Product never delivered' },
  { key: 'wrong_product',  label: 'Wrong product received' },
  { key: 'damaged',        label: 'Product arrived damaged' },
  { key: 'expired',        label: 'Product is expired' },
  { key: 'partial',        label: 'Incomplete order received' },
]

export default function OrderTracking() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const showToast  = useToastStore(s => s.show)
  const { order: storeOrder, clearOrder } = useOrderStore()
  const order = location.state?.order || storeOrder

  const [step,            setStep]           = useState(() => {
    const s = location.state?.order?.status
    return s === 'dispatched' ? 'dispatched' : s === 'delivered' ? 'delivered' : 'confirmed'
  })
  const [confirming,      setConfirming]     = useState(false)
  const [confirmed,       setConfirmed]      = useState(false)
  const [showPin,         setShowPin]        = useState(false)
  const [copied,          setCopied]         = useState(false)

  // Release request flow
  const [releaseNotif,    setReleaseNotif]   = useState(true) // true = demo: dealer already filed
  const [releaseResponse, setReleaseResponse]= useState(null) // null | 'confirmed' | 'disputed'
  const [responding,      setResponding]     = useState(false)

  // Farmer appeal flow
  const [showAppeal,      setShowAppeal]     = useState(false)
  const [appealReason,    setAppealReason]   = useState('no_delivery')
  const [appealNote,      setAppealNote]     = useState('')
  const [appealSubmitting,setAppealSubmitting]=useState(false)
  const [appealDone,      setAppealDone]     = useState(false)

  // Demo: simulate dealer dispatching after 3.5s
  useEffect(() => {
    if (step === 'confirmed') {
      const t = setTimeout(() => setStep('dispatched'), 3500)
      return () => clearTimeout(t)
    }
  }, [step])

  if (!order) { navigate('/dashboard'); return null }

  const productPrice = order.item?.price || order.amount || 0
  const deliveryFee  = 500
  const platformFee  = Math.round(productPrice * 0.04)
  const total        = productPrice + deliveryFee + platformFee
  const dealerNet    = productPrice + deliveryFee
  const stepIdx      = STEPS.findIndex(s => s.key === step)

  const handleConfirm = async (pin) => {
    setConfirming(true)
    try {
      await confirmDelivery(order.id, pin)
      setConfirmed(true); setStep('delivered')
      showToast('Delivery confirmed! Payment released to dealer.', 'success')
    } catch (e) {
      showToast(e.message || 'Confirmation failed. Please try again.', 'error')
    } finally { setConfirming(false) }
  }

  const handleReleaseResponse = async (action) => {
    setResponding(true)
    try {
      await respondToReleaseRequest('rel-001', { action })
      setReleaseResponse(action)
      if (action === 'confirmed') {
        showToast('Delivery confirmed! Payment released to dealer.', 'success')
        setTimeout(() => { setConfirmed(true) }, 800)
      } else {
        showToast('Dispute filed. Admin will review within 24hrs.', 'info')
      }
    } finally { setResponding(false) }
  }

  const handleAppeal = async () => {
    setAppealSubmitting(true)
    try {
      await fileAppeal(order.id, { reason: appealReason, note: appealNote })
      setAppealDone(true)
      showToast('Appeal submitted. Admin will review within 24–48hrs.', 'info')
    } finally { setAppealSubmitting(false) }
  }

  const copyRef = () => {
    navigator.clipboard?.writeText(order.reference)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Confirmed / Escrow released screen ──────────────────────────────────────
  if (confirmed) return (
    <div className="page-shell grain flex flex-col items-center justify-center text-center px-8">
      <div className="orb orb-1" />
      <div className="relative z-10 flex flex-col items-center gap-5 anim-1">
        <div className="relative">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: 'rgba(29,158,117,0.1)', border: '2px solid rgba(29,158,117,0.25)' }}>✅</div>
          <div className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(29,158,117,0.15)', animation: 'scan-pulse 2s ease-in-out infinite' }} />
        </div>
        <div>
          <p className="text-brand-green text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Escrow released</p>
          <p className="font-syne font-extrabold text-2xl text-(--tx) mb-3 leading-tight">Delivery confirmed!</p>
          <p className="text-sm text-(--tx-sub) leading-relaxed max-w-[260px]">
            Interswitch has released <span className="text-(--tx) font-semibold">₦{dealerNet.toLocaleString()}</span> to{' '}
            <span className="text-(--tx) font-semibold">{order.dealer?.name}</span>
          </p>
        </div>
        <div className="w-full max-w-[300px] glass-card">
          {[
            { label: 'Total paid',         val: `₦${total.toLocaleString()}`,      color: 'text-(--tx)'      },
            { label: 'Released to dealer', val: `₦${dealerNet.toLocaleString()}`,  color: 'text-brand-green' },
            { label: 'Platform fee (4%)',  val: `₦${platformFee.toLocaleString()}`,color: 'text-(--tx-sub)'  },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex justify-between items-center mb-2.5 last:mb-0">
              <span className="text-xs text-(--tx-sub)">{label}</span>
              <span className={`text-sm font-semibold ${color}`}>{val}</span>
            </div>
          ))}
        </div>
        <div className="w-full max-w-[300px] flex flex-col gap-2">
          <button className="btn-main" onClick={() => { clearOrder(); navigate('/dashboard') }}>
            <Home size={16} /> Back to dashboard
          </button>
          <button className="btn-main ghost" onClick={() => navigate('/scan')}>🔬 Scan another crop</button>
        </div>
      </div>
    </div>
  )

  // ── Main tracking ────────────────────────────────────────────────────────────
  return (
    <div className="page-shell grain">
      <div className="orb orb-1" />

      <nav className="app-nav">
        <AppLogo />
        <span className="text-xs text-(--tx-sub) font-medium">Order tracking</span>
        <button className="text-xs text-(--tx-sub) underline underline-offset-2 bg-transparent border-none cursor-pointer font-dm"
          onClick={() => { clearOrder(); navigate('/dashboard') }}>Dashboard</button>
      </nav>

      <div className="page-body pt-4">

        {/* Ref + escrow badge */}
        <div className="flex items-center justify-between mb-4 anim-1">
          <button onClick={copyRef} className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer">
            <span className="font-mono text-xs text-(--tx-sub)">{order.reference}</span>
            {copied ? <Check size={11} className="text-brand-green" /> : <Copy size={11} className="text-(--tx-dim)" />}
          </button>
          <span className="badge green text-[10px]"><Shield size={9} /> Escrow active</span>
        </div>

        {/* Status banner */}
        <div className="glass-card mb-4 anim-1" style={{
          background: step === 'dispatched' ? 'rgba(239,159,39,0.06)' : 'rgba(29,158,117,0.06)',
          border: `1px solid ${step === 'dispatched' ? 'rgba(239,159,39,0.25)' : 'rgba(29,158,117,0.25)'}`,
        }}>
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">
              {step === 'dispatched' ? '🚚' : step === 'delivered' ? '✅' : '🔒'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-syne font-bold text-sm text-(--tx) mb-1">
                {step === 'dispatched' ? 'Order on its way' : step === 'delivered' ? 'Awaiting your confirmation' : 'Escrow active — funds locked'}
              </p>
              <p className="text-xs text-(--tx-sub) leading-relaxed">
                {step === 'dispatched' || step === 'delivered'
                  ? `Confirm receipt to release ₦${dealerNet.toLocaleString()} to ${order.dealer?.name}`
                  : `₦${total.toLocaleString()} held by Interswitch — dealer has 48hrs to dispatch`}
              </p>
            </div>
          </div>
        </div>

        {/* Dealer card */}
        <div className="glass-card flex items-center gap-3 mb-4 anim-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-green/10 border border-brand-green/20">
            <span className="font-syne font-extrabold text-sm text-brand-green">
              {order.dealer?.name?.slice(0,2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-syne font-bold text-sm text-(--tx)">{order.dealer?.name}</p>
            <p className="text-xs text-(--tx-sub) truncate">{order.dealer?.address}</p>
          </div>
          <a href={`tel:${order.dealer?.phone}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-green/10 border border-brand-green/20 flex-shrink-0">
            <Phone size={14} className="text-brand-green" />
          </a>
        </div>

        {/* Amount breakdown */}
        <div className="glass-card mb-4 anim-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-sub) mb-3">Payment breakdown</p>
          {[
            { label: order.item?.name || 'Treatment',   val: `₦${productPrice.toLocaleString()}` },
            { label: 'Delivery + platform fee',         val: `₦${(deliveryFee + platformFee).toLocaleString()}` },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between mb-2">
              <span className="text-xs text-(--tx-sub)">{label}</span>
              <span className="text-xs text-(--tx)">{val}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2.5 mb-2 border-t border-(--card-br)">
            <span className="font-syne font-bold text-sm text-(--tx)">Total in escrow</span>
            <span className="font-syne font-extrabold text-lg text-brand-green">₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-(--tx-dim)">Dealer receives on confirmation</span>
            <span className="text-[11px] text-brand-green font-medium">₦{dealerNet.toLocaleString()}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-card mb-4 anim-3">
          <p className="font-syne font-bold text-sm text-(--tx) mb-4">Order progress</p>
          <div className="timeline">
            {STEPS.map((s, i) => {
              const isDone = i < stepIdx; const isActive = i === stepIdx; const isWait = i > stepIdx
              return (
                <div key={s.key} className="timeline-step">
                  <div className={`timeline-dot ${isDone ? 'done' : isActive ? 'active' : 'wait'}`}>
                    {isDone ? '✓' : s.icon}
                  </div>
                  <div className="pt-0.5 flex-1">
                    <p className={`font-syne font-bold text-sm mb-0.5 ${isWait ? 'text-(--tx-sub)' : 'text-(--tx)'}`}>{s.label}</p>
                    <p className="text-xs text-(--tx-sub) leading-snug">{s.desc}</p>
                    {isActive && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
                        <span className="text-xs font-medium" style={{ color: s.color }}>In progress</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── DEALER RELEASE REQUEST NOTIFICATION ── */}
        {step === 'dispatched' && releaseNotif && !releaseResponse && (
          <div className="rounded-2xl p-4 mb-4 anim-3"
            style={{ background: 'rgba(239,159,39,0.07)', border: '1.5px solid rgba(239,159,39,0.35)' }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,159,39,0.12)', border: '1px solid rgba(239,159,39,0.25)' }}>
                <span className="text-base">📢</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-syne font-bold text-(--tx) mb-0.5">Dealer requested payment release</p>
                <p className="text-xs text-(--tx-sub) leading-relaxed">
                  The dealer claims your order was delivered. Respond within{' '}
                  <span className="text-brand-amber font-semibold">48 hours</span> — otherwise payment auto-releases.
                </p>
              </div>
            </div>
            <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}>
              <p className="text-[10px] uppercase tracking-widest text-(--tx-dim) mb-1">Dealer note</p>
              <p className="text-xs text-(--tx-sub) italic">"Delivered on Mar 22 at 2pm. Farmer was present and signed receipt."</p>
            </div>
            {/* Auto-release countdown */}
            <div className="flex items-center gap-2 mb-4">
              <Clock size={11} className="text-brand-amber" />
              <p className="text-xs text-brand-amber font-semibold">Auto-releases in: <span className="font-mono">47:23:11</span></p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={responding}
                className="flex-1 py-3 rounded-2xl text-sm font-syne font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
                style={{ background: '#1D9E75' }}
                onClick={() => handleReleaseResponse('confirmed')}>
                {responding ? <span className="spinner" /> : <Check size={15} />}
                I received it
              </button>
              <button
                disabled={responding}
                className="flex-1 py-3 rounded-2xl text-sm font-syne font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                onClick={() => handleReleaseResponse('disputed')}>
                <X size={15} /> I didn't get it
              </button>
            </div>
          </div>
        )}

        {/* After farmer confirms release */}
        {releaseResponse === 'confirmed' && (
          <div className="info-banner green mb-4 anim-1">
            <Check size={14} className="text-brand-green flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-(--tx)">Payment released</p>
              <p className="text-xs text-(--tx-sub)">₦{dealerNet.toLocaleString()} sent to dealer's bank via Interswitch</p>
            </div>
          </div>
        )}

        {/* After farmer disputes release */}
        {releaseResponse === 'disputed' && (
          <div className="rounded-2xl p-4 mb-4 anim-1"
            style={{ background: 'rgba(239,159,39,0.06)', border: '1px solid rgba(239,159,39,0.2)' }}>
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-brand-amber flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-(--tx) mb-1">Dispute under admin review</p>
                <p className="text-xs text-(--tx-sub) leading-relaxed">
                  Your money is safe in escrow. Admin will review both sides and resolve within <span className="font-semibold text-(--tx)">24–48 hours</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No release request yet — auto release info + appeal link */}
        {step === 'dispatched' && !releaseNotif && !releaseResponse && (
          <div className="info-banner amber mb-4 anim-3">
            <Clock size={14} className="text-brand-amber flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-(--tx) mb-0.5">Confirm delivery when received</p>
              <p className="text-xs text-(--tx-sub)">Payment auto-releases to dealer in 5 days if no action.</p>
            </div>
            <button className="text-xs text-red-400 underline underline-offset-2 flex-shrink-0 ml-2 bg-transparent border-none cursor-pointer"
              onClick={() => setShowAppeal(true)}>Not delivered?</button>
          </div>
        )}

        {/* Appeal done */}
        {appealDone && (
          <div className="rounded-2xl p-4 mb-4 anim-1"
            style={{ background: 'rgba(239,159,39,0.06)', border: '1px solid rgba(239,159,39,0.2)' }}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">📋</span>
              <div>
                <p className="text-sm font-semibold text-(--tx) mb-1">Appeal submitted</p>
                <p className="text-xs text-(--tx-sub) leading-relaxed">
                  Admin has been notified. Your money stays locked in escrow until resolved. Expected resolution: <span className="text-(--tx) font-semibold">24–48 hours</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Waiting for dispatch */}
        {(step === 'paid' || step === 'confirmed') && (
          <div className="info-banner mb-4 anim-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}>
            <RefreshCw size={13} className="text-(--tx-dim) flex-shrink-0 mt-0.5" />
            <p className="text-xs text-(--tx-sub) leading-relaxed">
              Dealer hasn't dispatched in <span className="text-(--tx) font-medium">48 hours</span>?
              Interswitch automatically refunds your full payment.
            </p>
          </div>
        )}

        <div className="h-28" />
      </div>

      {/* CTA */}
      <div className="page-cta">
        {(step === 'dispatched' || step === 'delivered') && !releaseResponse ? (
          <>
            <button className="btn-main" onClick={() => setShowPin(true)} disabled={confirming}>
              {confirming ? <><span className="spinner" /> Confirming…</> : <><CheckCircle size={16} /> I've received my treatment</>}
            </button>
            <p className="cta-note">Your PIN authorises release of ₦{dealerNet.toLocaleString()} from escrow</p>
          </>
        ) : (step === 'dispatched' || step === 'delivered') && releaseResponse === 'confirmed' ? (
          <button className="btn-main" onClick={() => { clearOrder(); navigate('/dashboard') }}>
            <Home size={16} /> Back to dashboard
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2.5 py-2">
            <span className="w-2 h-2 rounded-full bg-brand-amber" style={{ animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
            <p className="text-sm text-(--tx-sub)">
              {step === 'confirmed' ? 'Waiting for dealer to dispatch…' : 'Processing…'}
            </p>
          </div>
        )}
      </div>

      {/* ── PIN Sheet ── */}
      <PinSheet
        open={showPin}
        title="Confirm delivery"
        subtitle={`Release ₦${dealerNet.toLocaleString()} from escrow to ${order.dealer?.name}`}
        onSuccess={(pin) => handleConfirm(pin)}
        onClose={() => setShowPin(false)}
      />

      {/* ── Appeal Sheet ── */}
      {showAppeal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-[430px] mx-auto"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => e.target === e.currentTarget && setShowAppeal(false)}>
          <div className="rounded-t-3xl overflow-hidden" style={{ background: 'var(--bg-nav)', border: '1px solid var(--card-br)', borderBottom: 'none' }}>
            <div className="px-5 pt-4 pb-6">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--card-br)' }} />
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-syne font-bold text-base text-(--tx)">File an appeal</h3>
                <button onClick={() => setShowAppeal(false)} className="nav-close"><X size={15} /></button>
              </div>
              <p className="text-xs text-(--tx-sub) mb-5">Your payment stays locked in escrow until admin resolves this.</p>

              {!appealDone ? (
                <>
                  <p className="field-label mb-2">Reason for appeal</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {APPEAL_REASONS.map(r => (
                      <button key={r.key}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-[0.98]"
                        style={{
                          background: appealReason === r.key ? 'rgba(239,159,39,0.1)' : 'var(--card-bg)',
                          border: appealReason === r.key ? '1.5px solid rgba(239,159,39,0.4)' : '1px solid var(--card-br)',
                        }}
                        onClick={() => setAppealReason(r.key)}>
                        <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ border: `2px solid ${appealReason === r.key ? '#EF9F27' : 'var(--tx-dim)'}` }}>
                          {appealReason === r.key && <div className="w-2 h-2 rounded-full bg-brand-amber" />}
                        </div>
                        <p className={`text-sm ${appealReason === r.key ? 'text-(--tx) font-semibold' : 'text-(--tx-sub)'}`}>{r.label}</p>
                      </button>
                    ))}
                  </div>

                  <div className="mb-5">
                    <span className="field-label">Additional details (optional)</span>
                    <textarea
                      className="field-input resize-none"
                      rows={3}
                      placeholder="Describe what happened…"
                      value={appealNote}
                      onChange={e => setAppealNote(e.target.value)}
                      style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                    />
                  </div>

                  <button className="btn-main w-full" disabled={appealSubmitting} onClick={handleAppeal}>
                    {appealSubmitting ? <><span className="spinner" /> Submitting…</> : '📋 Submit appeal'}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(29,158,117,0.1)', border: '2px solid rgba(29,158,117,0.25)' }}>
                    <span className="text-3xl">✅</span>
                  </div>
                  <p className="font-syne font-bold text-(--tx) text-lg mb-2">Appeal submitted!</p>
                  <p className="text-xs text-(--tx-sub) leading-relaxed mb-5">
                    Admin will review and respond within 24–48 hours. Your ₦{total.toLocaleString()} stays locked safely in escrow.
                  </p>
                  <button className="btn-main" onClick={() => setShowAppeal(false)}>Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}