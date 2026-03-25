import { useAutoError } from '../hooks/useAutoError'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLogo from '../component/AppLogo'
import PinSheet from '../component/PinSheet'
import { Lock, ChevronRight, Shield, Clock, RefreshCw, CheckCircle } from 'lucide-react'
import { useCartStore, useOrderStore } from '../store'
import { createOrder, initiatePayment } from '../services/api'

const METHODS = [
  { id: 'card',     emoji: '💳', label: 'Card',     sub: 'Debit / credit'  },
  { id: 'transfer', emoji: '🏦', label: 'Transfer', sub: 'Bank transfer'   },
  { id: 'ussd',     emoji: '#️⃣', label: 'USSD',     sub: '*737# & others' },
]

const USSD_CODES = [
  { code: '*737#', bank: 'GTBank'      },
  { code: '*919#', bank: 'Access Bank' },
  { code: '*966#', bank: 'Zenith Bank' },
  { code: '*822#', bank: 'Sterling'    },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { item, dealer, clearCart } = useCartStore()
  const setOrder = useOrderStore(s => s.setOrder)
  const [method,  setMethod]  = useState('card')
  const [step,    setStep]    = useState('review') // review | processing | escrow_locked | done
  const [showPin, setShowPin] = useState(false)
  const [cardNum, setCardNum] = useState('')
  const [expiry,  setExpiry]  = useState('')
  const [cvv,     setCvv]     = useState('')
  const [error, setError] = useAutoError()

  if (!item || !dealer) { navigate('/results'); return null }

  const productPrice = item.price || 0
  const deliveryFee  = 500
  const platformFee  = Math.round(productPrice * 0.04)
  const total        = productPrice + deliveryFee + platformFee
  const dealerNet    = productPrice + deliveryFee   // what dealer receives after platform fee

  const handlePay = async (pin) => {
    setStep('processing')
    setError('')
    try {
      const { order } = await createOrder({ item, dealer, payment_method: method, pin })
      await initiatePayment(order.id, pin)
      setOrder(order)
      clearCart()
      setStep('escrow_locked')
      setTimeout(() => navigate('/order-tracking', { state: { order } }), 2800)
    } catch (e) {
      setStep('review')
      setError(e.message || 'Payment failed. Please try again.')
    }
  }

  // ── Processing ─────────────────────────────────────────────────────────────
  if (step === 'processing') return (
    <div className="page-shell grain flex flex-col items-center justify-center text-center px-8">
      <div className="orb orb-1" />
      <div className="relative z-10 flex flex-col items-center gap-6 anim-1">
        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(29,158,117,0.1)', border: '2px solid rgba(29,158,117,0.25)' }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
          <div className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(29,158,117,0.15)', animation: 'scan-pulse 2s ease-in-out infinite' }} />
        </div>
        <div>
          <p className="font-syne font-extrabold text-xl text-(--tx) mb-2">Connecting to Interswitch…</p>
          <p className="text-sm text-(--tx-sub) leading-relaxed">
            Verifying payment and locking<br />₦{total.toLocaleString()} in escrow
          </p>
        </div>
        {/* Flow steps */}
        <div className="w-full max-w-[280px] flex flex-col gap-2">
          {[
            { label: 'Verifying transaction PIN', done: true  },
            { label: 'Connecting to Interswitch', done: true  },
            { label: 'Locking funds in escrow',   done: false },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}>
              {done
                ? <CheckCircle size={13} className="text-brand-green flex-shrink-0" />
                : <span className="spinner flex-shrink-0" style={{ width: 13, height: 13, borderWidth: 2 }} />
              }
              <p className={`text-xs ${done ? 'text-(--tx-sub)' : 'text-(--tx)'}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Escrow locked ───────────────────────────────────────────────────────────
  if (step === 'escrow_locked') return (
    <div className="page-shell grain flex flex-col items-center justify-center text-center px-8">
      <div className="orb orb-1" />
      <div className="relative z-10 flex flex-col items-center gap-5 anim-1">
        <div className="relative">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: 'rgba(29,158,117,0.1)', border: '2px solid rgba(29,158,117,0.25)' }}>
            🔒
          </div>
          <div className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(29,158,117,0.2)', animation: 'scan-pulse 2s ease-in-out infinite' }} />
        </div>

        <div>
          <p className="text-brand-green text-[11px] font-bold uppercase tracking-[0.2em] mb-2">
            Escrow locked
          </p>
          <p className="font-syne font-extrabold text-2xl text-(--tx) mb-2">
            Payment secured!
          </p>
          <p className="text-sm text-(--tx-sub) leading-relaxed max-w-[260px]">
            <span className="text-(--tx) font-semibold">₦{total.toLocaleString()}</span> is safely held by Interswitch.
            <br />The dealer cannot access it until you confirm delivery.
          </p>
        </div>

        {/* What happens next */}
        <div className="w-full max-w-[300px] flex flex-col gap-2 mt-2">
          {[
            { icon: '📦', title: 'Dealer notified',      desc: 'They see your order and prepare it'          },
            { icon: '🚚', title: 'Delivery dispatched',  desc: 'You get notified when it ships'              },
            { icon: '✅', title: 'You confirm receipt',  desc: 'Interswitch releases payment to dealer'      },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-left"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}>
              <span className="text-base flex-shrink-0">{icon}</span>
              <div>
                <p className="text-xs font-semibold text-(--tx) leading-tight">{title}</p>
                <p className="text-[11px] text-(--tx-sub) mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-(--tx-dim) flex items-center gap-1.5 mt-1">
          <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
          Taking you to order tracking…
        </p>
      </div>
    </div>
  )

  // ── Main checkout ───────────────────────────────────────────────────────────
  return (
    <div className="page-shell grain">
      <div className="orb orb-1" />

      <nav className="app-nav">
        <button className="nav-back" onClick={() => navigate(-1)}>← Back</button>
        <AppLogo />
        <div className="nav-badge">
          <Lock size={11} /> Secured
        </div>
      </nav>

      <div className="page-body pt-4">

        {/* Escrow explainer */}
        <div className="glass-card mb-4 anim-1"
          style={{ background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={15} className="text-brand-green flex-shrink-0" />
            <p className="font-syne font-bold text-sm text-(--tx)">How your payment is protected</p>
          </div>
          <div className="flex items-center gap-0 text-[11px] text-(--tx-sub)">
            {[
              { icon: '💳', label: 'You pay' },
              { icon: '→',  label: null        },
              { icon: '🔒', label: 'Escrow'   },
              { icon: '→',  label: null        },
              { icon: '✅', label: 'Confirm'  },
              { icon: '→',  label: null        },
              { icon: '🏪', label: 'Dealer'   },
            ].map(({ icon, label }, i) => (
              label !== null
                ? <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-base">{icon}</span>
                    <span className="text-center leading-tight">{label}</span>
                  </div>
                : <span key={i} className="text-brand-green/40 font-bold text-base flex-shrink-0">›</span>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-(--card-br) flex items-start gap-2">
            <Clock size={11} className="text-brand-amber flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-(--tx-sub) leading-relaxed">
              Auto-refund if dealer doesn't dispatch in <span className="text-(--tx) font-medium">48hrs</span>.
              Auto-release to dealer if you don't confirm within <span className="text-(--tx) font-medium">72hrs</span> of dispatch.
            </p>
          </div>
        </div>

        {/* Dealer card */}
        <div className="glass-card flex items-center gap-3 mb-3 anim-1">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-green/10 border border-brand-green/20">
            <span className="font-syne font-extrabold text-sm text-brand-green">
              {dealer.name?.slice(0,2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-syne font-bold text-sm text-(--tx)">{dealer.name}</p>
            <p className="text-xs text-(--tx-sub) truncate">{dealer.address}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-(--tx-sub)">⭐ {dealer.rating}</p>
            <p className="text-xs text-(--tx-sub)">🕐 {dealer.delivery_hours}hr</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="glass-card mb-4 anim-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-sub) mb-3">Order summary</p>
          {[
            { label: item.name || 'Treatment product', val: `₦${productPrice.toLocaleString()}`, sub: null },
            { label: 'Delivery fee',                   val: `₦${deliveryFee.toLocaleString()}`,  sub: null },
            { label: 'Platform fee (4%)',              val: `₦${platformFee.toLocaleString()}`,  sub: 'FarmXnap service fee' },
          ].map(({ label, val, sub }) => (
            <div key={label} className="flex justify-between items-start mb-2.5">
              <div>
                <span className="text-sm text-(--tx-sub)">{label}</span>
                {sub && <p className="text-[10px] text-(--tx-dim)">{sub}</p>}
              </div>
              <span className="text-sm text-(--tx)">{val}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 border-t border-(--card-br) mb-2">
            <span className="font-syne font-bold text-sm text-(--tx)">Total (escrow)</span>
            <span className="font-syne font-extrabold text-xl text-brand-green">₦{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-(--tx-dim)">Dealer receives after confirmation</span>
            <span className="text-[11px] text-brand-green font-medium">₦{dealerNet.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="anim-2 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-sub)">Pay via Interswitch</p>
            <div className="flex-1 h-px bg-(--card-br)" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Interswitch_Logo.svg/200px-Interswitch_Logo.svg.png"
              alt="Interswitch" className="h-4 opacity-60" onError={e => e.target.style.display='none'} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(({ id, emoji, label, sub }) => (
              <button key={id} className={`pay-pill ${method === id ? 'on' : ''}`} onClick={() => setMethod(id)}>
                <span className="text-xl">{emoji}</span>
                <span className="font-semibold">{label}</span>
                <span className="text-[10px] opacity-60">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card fields */}
        {method === 'card' && (
          <div className="anim-3">
            <div className="field-wrap">
              <span className="field-label">Card number</span>
              <input className="field-input font-mono tracking-widest"
                placeholder="0000  0000  0000  0000" maxLength={19} value={cardNum}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g,'').slice(0,16)
                  setCardNum(v.replace(/(.{4})/g,'$1 ').trim())
                }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="field-label">Expiry</span>
                <input className="field-input font-mono" placeholder="MM / YY" maxLength={7} value={expiry}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g,'').slice(0,4)
                    setExpiry(v.length > 2 ? `${v.slice(0,2)} / ${v.slice(2)}` : v)
                  }} />
              </div>
              <div>
                <span className="field-label">CVV</span>
                <input className="field-input font-mono" type="password" placeholder="•••" maxLength={3}
                  value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,3))} />
              </div>
            </div>
          </div>
        )}

        {/* Transfer */}
        {method === 'transfer' && (
          <div className="glass-card anim-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-sub) mb-3">Transfer to Interswitch escrow</p>
            {[
              { label: 'Bank',          val: 'Zenith Bank (Interswitch)' },
              { label: 'Account name',  val: 'FarmXnap Escrow'          },
              { label: 'Account no.',   val: '0123456789'               },
              { label: 'Amount',        val: `₦${total.toLocaleString()}` },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between items-center mb-2.5 pb-2.5 border-b border-(--card-br) last:border-0 last:mb-0 last:pb-0">
                <span className="text-xs text-(--tx-sub)">{label}</span>
                <span className="text-sm font-medium text-(--tx)">{val}</span>
              </div>
            ))}
            <div className="mt-3 flex items-start gap-2 pt-3 border-t border-(--card-br)">
              <span className="text-base flex-shrink-0">⚠️</span>
              <p className="text-xs text-(--tx-sub) leading-relaxed">Use your order reference as payment description to ensure funds are correctly matched.</p>
            </div>
          </div>
        )}

        {/* USSD */}
        {method === 'ussd' && (
          <div className="glass-card anim-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-sub) mb-3">Dial your bank's code</p>
            {USSD_CODES.map(({ code, bank }) => (
              <div key={code} className="flex justify-between items-center mb-3 pb-3 border-b border-(--card-br) last:border-0 last:mb-0 last:pb-0">
                <span className="font-mono text-sm font-bold text-(--tx)">{code}</span>
                <span className="text-xs text-(--tx-sub)">{bank}</span>
              </div>
            ))}
            <p className="text-xs text-(--tx-sub) mt-2 pt-3 border-t border-(--card-br) leading-relaxed">
              Follow the prompts to transfer ₦{total.toLocaleString()} to FarmXnap Escrow
            </p>
          </div>
        )}

        {error && <div className="err-banner mt-4 anim-1"><span>⚠</span> {error}</div>}

        <p className="text-center text-xs text-(--tx-dim) mt-4 flex items-center justify-center gap-1.5">
          <Lock size={11} /> Powered by <span className="text-(--tx-sub) font-medium">Interswitch</span> · PCI DSS compliant
        </p>

        <div className="h-24" />
      </div>

      {/* CTA */}
      <div className="page-cta">
        <button className="btn-main" onClick={() => setShowPin(true)}
          disabled={method === 'card' && (!cardNum || !expiry || !cvv)}>
          <Lock size={15} />
          Pay ₦{total.toLocaleString()} — lock in escrow
          <ChevronRight size={15} />
        </button>
        <p className="cta-note">🔒 Money held by Interswitch · Released only when you confirm delivery</p>
      </div>

      <PinSheet
        open={showPin}
        title="Authorise payment"
        subtitle={`Lock ₦${total.toLocaleString()} in Interswitch escrow for ${dealer.name}`}
        onSuccess={handlePay}
        onClose={() => setShowPin(false)}
      />
    </div>
  )
}