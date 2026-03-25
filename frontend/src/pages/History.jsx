import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLogo from '../component/AppLogo'
import {
  Leaf, CheckCircle, AlertCircle, X, ChevronRight,
  Phone, Package, ShieldCheck, Clock,
} from 'lucide-react'
import { getFarmerHistory } from '../services/api'
import { useCartStore, useScanStore } from '../store'

const FILTERS = ['All', 'Treated', 'Untreated']

// ── Scan detail bottom sheet ──────────────────────────────────────────────────
function ScanDetailSheet({ scan, onClose, onBuyTreatment }) {
  if (!scan) return null
  const treated = scan.status === 'treated'
  const confColor = scan.confidence >= 85 ? 'red' : scan.confidence >= 70 ? 'amber' : 'green'

  return (
    <div className="sheet-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel" style={{ maxHeight: '88vh' }}>
        <div className="sheet-handle" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`badge ${treated ? 'green' : 'red'}`}>
                {treated ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                {treated ? 'Treated' : 'Untreated'}
              </span>
              <span className="text-(--tx-sub) text-xs">{scan.crop} · {scan.date}</span>
            </div>
            <h3 className="font-syne font-extrabold text-lg text-(--tx) leading-tight">{scan.disease}</h3>
          </div>
          <button onClick={onClose} className="nav-close flex-shrink-0"><X size={15} /></button>
        </div>

        {/* Confidence */}
        <div className="glass-card mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-(--tx-sub) font-medium">AI confidence score</p>
            <p className={`font-syne font-extrabold text-lg ${
              confColor === 'red' ? 'text-red-400' : confColor === 'amber' ? 'text-brand-amber' : 'text-brand-green'
            }`}>{scan.confidence}%</p>
          </div>
          <div className="conf-track">
            <div className={`conf-fill ${confColor}`} style={{ width: `${scan.confidence}%` }} />
          </div>
        </div>

        {/* Symptoms */}
        <div className="glass-card mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-sub) mb-3">Symptoms detected</p>
          <div className="flex flex-col gap-2">
            {scan.symptoms?.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green/60 flex-shrink-0 mt-1.5" />
                <p className="text-sm text-(--tx-sub) leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Remedy */}
        <div className="info-banner green mb-4">
          <span className="text-lg flex-shrink-0">💊</span>
          <div>
            <p className="text-sm font-semibold text-(--tx) mb-1">Recommended treatment</p>
            <p className="text-xs text-(--tx-sub) leading-relaxed">{scan.remedy}</p>
          </div>
        </div>

        {/* ── TREATED: show order details ── */}
        {treated && scan.order && (
          <div className="glass-card mb-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={14} className="text-brand-green" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-sub)">Order details</p>
            </div>
            {[
              { label: 'Product',     val: scan.treatment_product?.name },
              { label: 'Dealer',      val: scan.order.dealer },
              { label: 'Order ref',   val: scan.order.ref },
              { label: 'Amount paid', val: `₦${scan.order.amount.toLocaleString()}` },
              { label: 'Ordered',     val: scan.order.date_ordered },
              { label: 'Delivered',   val: scan.order.date_delivered || '—' },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-(--card-br) last:border-0">
                <span className="text-xs text-(--tx-sub)">{label}</span>
                <span className="text-sm text-(--tx) font-medium text-right max-w-[60%] truncate">{val}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 mt-1">
              <span className="text-xs text-(--tx-sub)">Escrow</span>
              <span className="badge green text-[10px]">
                <CheckCircle size={9} /> Released
              </span>
            </div>
          </div>
        )}

        {/* ── UNTREATED: dispatched order (awaiting confirmation) ── */}
        {!treated && scan.order?.status === 'dispatched' && (
          <div className="info-banner amber mb-4">
            <Package size={14} className="text-brand-amber flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-(--tx) mb-0.5">Order dispatched</p>
              <p className="text-xs text-(--tx-sub) leading-relaxed">
                {scan.order.dealer} has dispatched your order. Confirm delivery to release payment.
              </p>
            </div>
          </div>
        )}

        {/* ── UNTREATED: no order yet ── */}
        {!treated && !scan.order && scan.treatment_product && (
          <div className="glass-card mb-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-(--tx) truncate">{scan.treatment_product.name}</p>
                <p className="text-xs text-(--tx-sub)">Recommended cure product</p>
              </div>
              <p className="font-syne font-extrabold text-brand-green text-base flex-shrink-0">
                ₦{scan.treatment_product.price.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-4 flex flex-col gap-2">
          {!treated && !scan.order && (
            <button className="btn-main" onClick={() => onBuyTreatment(scan)}>
              <ChevronRight size={16} /> Buy treatment now
            </button>
          )}
          {!treated && scan.order?.status === 'dispatched' && (
            <button className="btn-main" onClick={() => onBuyTreatment(scan)}>
              <CheckCircle size={16} /> Confirm delivery & release payment
            </button>
          )}
          {!treated && (
            <button className="btn-main ghost" onClick={() => { onClose(); /* navigate to scan */ }}>
              🔬 Re-scan this crop
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function History() {
  const navigate  = useNavigate()
  const setCart   = useCartStore(s => s.setCart)
  const { setDiagnosis, setCropType } = useScanStore()
  const [history,    setHistory]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('All')
  const [activeScan, setActiveScan] = useState(null)

  useEffect(() => {
    getFarmerHistory().then(d => { setHistory(d); setLoading(false) })
  }, [])

  const filtered = filter === 'All' ? history
    : filter === 'Treated'   ? history.filter(h => h.status === 'treated')
    : history.filter(h => h.status === 'pending')

  const counts = {
    All:       history.length,
    Treated:   history.filter(h => h.status === 'treated').length,
    Untreated: history.filter(h => h.status === 'pending').length,
  }

  // Navigate to checkout pre-loaded with this scan's treatment
  const handleBuyTreatment = (scan) => {
    if (scan.order?.status === 'dispatched') {
      navigate('/order-tracking', { state: { order: scan.order } })
      return
    }
    // Pre-load scan store so Results → Checkout flow works
    setCropType(scan.crop)
    setDiagnosis({
      disease: scan.disease,
      confidence: scan.confidence,
      symptoms: scan.symptoms,
      remedy: scan.remedy,
      treatment_product: scan.treatment_product,
      nearby_dealers: [],
    })
    setActiveScan(null)
    navigate('/results')
  }

  return (
    <div className="page-shell grain">
      <div className="orb orb-1" />

      <nav className="app-nav">
        <button className="nav-back" onClick={() => navigate('/dashboard')}>← Back</button>
        <AppLogo />
        <span className="text-xs text-(--tx-sub) bg-(--card-bg) border border-(--card-br) px-2.5 py-1 rounded-full">
          {counts.All} scans
        </span>
      </nav>

      <div className="page-body pt-4">
        <header className="page-header pb-4">
          <p className="page-eyebrow">Your farm</p>
          <h1 className="page-title">Scan history</h1>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-5 anim-1">
          <div className="glass-card-green text-center">
            <p className="font-syne font-extrabold text-2xl text-brand-green">{counts.Treated}</p>
            <p className="text-xs text-(--tx-sub) mt-0.5">Treated</p>
          </div>
          <div className="text-center rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="font-syne font-extrabold text-2xl text-red-400">{counts.Untreated}</p>
            <p className="text-xs text-(--tx-sub) mt-0.5">Untreated</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 anim-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                filter === f
                  ? f === 'Untreated'
                    ? 'bg-red-500/15 text-red-400 border-red-500/25'
                    : 'bg-brand-green text-white border-transparent'
                  : 'text-(--tx-sub) border-(--card-br) bg-(--card-bg)'
              }`}>
              {f}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                filter === f ? 'bg-white/20 text-white' : 'bg-(--card-bg) text-(--tx-sub)'
              }`}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Scan list */}
        <div className="flex flex-col gap-3 anim-3">
          {loading ? (
            [1,2,3,4].map(i => <div key={i} className="h-24 shimmer" />)
          ) : filtered.length === 0 ? (
            <div className="glass-card text-center py-10">
              <Leaf size={28} className="text-(--tx-dim) mx-auto mb-3" />
              <p className="font-syne font-bold text-(--tx) text-sm mb-1">No scans here</p>
              <p className="text-xs text-(--tx-sub)">
                {filter === 'Untreated' ? 'All crops treated! 🎉' : 'Start scanning your crops to see history.'}
              </p>
            </div>
          ) : (
            filtered.map((scan, idx) => {
              const treated = scan.status === 'treated'
              const hasActiveOrder = scan.order?.status === 'dispatched'
              return (
                <button key={scan.id}
                  className="glass-card text-left w-full active:scale-[0.985] transition-all"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => setActiveScan(scan)}>

                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      treated ? 'bg-brand-green/10' : hasActiveOrder ? 'bg-brand-amber/10' : 'bg-red-500/10'
                    }`}>
                      <Leaf size={15} className={
                        treated ? 'text-brand-green' : hasActiveOrder ? 'text-brand-amber' : 'text-red-400'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-syne font-bold text-sm text-(--tx) truncate mb-0.5">{scan.disease}</p>
                      <p className="text-xs text-(--tx-sub)">{scan.crop} · {scan.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`badge ${
                        treated ? 'green' : hasActiveOrder ? 'amber' : 'red'
                      }`}>
                        {treated
                          ? <><CheckCircle size={9} /> Treated</>
                          : hasActiveOrder
                            ? <><Clock size={9} /> Dispatched</>
                            : <><AlertCircle size={9} /> Untreated</>
                        }
                      </span>
                      <ChevronRight size={12} className="text-(--tx-dim)" />
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-(--tx-dim) w-16 flex-shrink-0">Confidence</span>
                    <div className="conf-track">
                      <div className={`conf-fill ${treated ? 'green' : 'amber'}`}
                        style={{ width: `${scan.confidence}%` }} />
                    </div>
                    <span className={`text-xs font-semibold font-mono flex-shrink-0 ${
                      treated ? 'text-brand-green' : 'text-brand-amber'
                    }`}>{scan.confidence}%</span>
                  </div>

                  {/* Dispatched nudge */}
                  {hasActiveOrder && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(239,159,39,0.07)', border: '1px solid rgba(239,159,39,0.18)' }}>
                      <Package size={12} className="text-brand-amber flex-shrink-0" />
                      <p className="text-xs text-brand-amber">On its way — tap to confirm delivery</p>
                    </div>
                  )}

                  {/* Untreated nudge */}
                  {!treated && !hasActiveOrder && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400">Treatment not purchased — tap to buy</p>
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="h-8" />
      </div>

      {/* Scan detail sheet */}
      {activeScan && (
        <ScanDetailSheet
          scan={activeScan}
          onClose={() => setActiveScan(null)}
          onBuyTreatment={handleBuyTreatment}
        />
      )}
    </div>
  )
}