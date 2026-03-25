import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLogo from '../component/AppLogo'
import { MapPin, Star, ShieldCheck, Clock, CheckCircle, ChevronRight, Zap, Award, TrendingDown } from 'lucide-react'
import { useScanStore, useCartStore } from '../store'

const BADGE = {
  'Top seller':    { icon: Award,        color: 'text-brand-green',  bg: 'bg-brand-green/10  border-brand-green/20' },
  'Best price':    { icon: TrendingDown, color: 'text-blue-400',     bg: 'bg-blue-500/10     border-blue-500/20' },
  'Fast delivery': { icon: Zap,          color: 'text-brand-amber',  bg: 'bg-brand-amber/10  border-brand-amber/20' },
}

export default function Results() {
  const navigate = useNavigate()
  const { diagnosis, capturedImage, cropType } = useScanStore()
  const setCart = useCartStore(s => s.setCart)
  const [selected, setSelected] = useState(null)
  const [sortBy,   setSortBy]   = useState('distance')

  if (!diagnosis) { navigate('/scan'); return null }

  const { disease, confidence, symptoms = [], remedy, treatment_product, nearby_dealers = [] } = diagnosis

  const inStock    = nearby_dealers.filter(d => d.in_stock)
  const outOfStock = nearby_dealers.filter(d => !d.in_stock)
  const sorted     = [...inStock].sort((a, b) =>
    sortBy === 'price' ? a.price - b.price : sortBy === 'rating' ? b.rating - a.rating : a.distance_km - b.distance_km
  )

  const active      = nearby_dealers.find(d => d.id === selected)
  const total       = active ? active.price + 500 : 0
  const highConf    = confidence >= 85
  const confColor   = highConf ? 'red' : confidence >= 70 ? 'amber' : 'green'
  const severity    = highConf ? 'High severity' : confidence >= 70 ? 'Moderate' : 'Low'

  return (
    <div className="page-shell grain">
      <div className="orb orb-1" />

      <nav className="app-nav">
        <button className="nav-back" onClick={() => navigate('/scan')}>← Back</button>
        <AppLogo />
        <span className={`badge ${highConf ? 'red' : 'amber'}`}>{severity}</span>
      </nav>

      <div className="page-body pt-3">
        {/* Captured image */}
        {capturedImage && (
          <div className="h-36 rounded-2xl overflow-hidden mb-4 anim-1">
            <img src={capturedImage} alt="Scanned" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Disease result card */}
        <div className="glass-card mb-3 anim-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-(--tx-sub) mb-1 capitalize">
                {cropType} · Disease detected
              </p>
              <h2 className="font-syne font-extrabold text-lg text-(--tx) leading-snug">{disease}</h2>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`font-syne font-extrabold text-2xl ${highConf ? 'text-red-400' : 'text-brand-amber'}`}>{confidence}%</p>
              <p className="text-[10px] text-(--tx-sub)">confidence</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="conf-track"><div className={`conf-fill ${confColor}`} style={{ width: `${confidence}%` }} /></div>
          </div>
          <div className="flex flex-col gap-1.5">
            {symptoms.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={12} className="text-brand-green flex-shrink-0 mt-0.5" />
                <p className="text-xs text-(--tx-sub) leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Remedy */}
        <div className="info-banner green mb-3 anim-2">
          <span className="text-lg flex-shrink-0">💊</span>
          <div>
            <p className="text-sm font-semibold text-(--tx) mb-1">Recommended treatment</p>
            <p className="text-xs text-(--tx-sub) leading-relaxed">{remedy}</p>
          </div>
        </div>

        {/* Product pill */}
        {treatment_product && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4 anim-2"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}>
            <span className="text-xl flex-shrink-0">📦</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-(--tx) truncate">{treatment_product.name}</p>
              <p className="text-xs text-(--tx-sub)">Recommended cure product</p>
            </div>
          </div>
        )}

        {/* Dealers */}
        {treatment_product && (
          <div className="anim-3">
            <div className="flex items-center justify-between mb-3">
              <p className="font-syne font-bold text-sm text-(--tx)">
                Dealers near you <span className="font-dm font-normal text-xs text-(--tx-sub)">({inStock.length} in stock)</span>
              </p>
              <div className="flex gap-1">
                {['distance','price','rating'].map(s => (
                  <button key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium capitalize transition-all cursor-pointer border-none ${
                      sortBy === s ? 'bg-brand-green text-white' : 'text-(--tx-sub)'
                    }`}
                    style={{ background: sortBy === s ? undefined : 'var(--card-bg)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {sorted.map(d => {
                const isSel  = selected === d.id
                const badge  = d.badge ? BADGE[d.badge] : null
                const BIcon  = badge?.icon
                return (
                  <button key={d.id} className={`dealer-card ${isSel ? 'selected' : ''}`}
                    onClick={() => setSelected(isSel ? null : d.id)}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSel ? 'bg-brand-green/15' : 'bg-white/5'
                      }`}>
                        <span className={`font-syne font-extrabold text-sm ${isSel ? 'text-brand-green' : 'text-(--tx-sub)'}`}>
                          {d.name.slice(0,2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-syne font-bold text-sm text-(--tx)">{d.name}</span>
                          {d.verified && <ShieldCheck size={12} className="text-brand-green" />}
                          {badge && BIcon && (
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color} ${badge.bg}`}>
                              <BIcon size={9} /> {d.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-(--tx-sub) truncate">{d.address}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSel ? 'bg-brand-green border-brand-green' : 'border-white/15'
                      }`}>
                        {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star size={10} className="fill-brand-amber text-brand-amber" />
                        <span className="text-xs font-semibold text-(--tx)">{d.rating}</span>
                        <span className="text-xs text-(--tx-sub)">({d.reviews})</span>
                      </div>
                      <span className="text-(--tx-dim) text-sm">·</span>
                      <span className="text-xs text-(--tx-sub) flex items-center gap-1">
                        <MapPin size={10} /> {d.distance_km} km
                      </span>
                      <span className="text-(--tx-dim) text-sm">·</span>
                      <span className="text-xs text-(--tx-sub) flex items-center gap-1">
                        <Clock size={10} /> {d.delivery_hours}hr
                      </span>
                      <span className="ml-auto font-syne font-extrabold text-base text-brand-green">
                        ₦{d.price.toLocaleString()}
                      </span>
                    </div>

                    {d.stock_count > 0 && d.stock_count <= 10 && (
                      <p className="text-xs text-brand-amber mt-2">⚠ Only {d.stock_count} left in stock</p>
                    )}

                    {isSel && (
                      <div className="mt-3 pt-3 border-t border-brand-green/15">
                        <p className="text-xs text-(--tx-sub) mb-1">📍 {d.address}</p>
                        <p className="text-xs text-(--tx-sub)">📞 {d.phone}</p>
                      </div>
                    )}
                  </button>
                )
              })}

              {outOfStock.length > 0 && (
                <div className="px-4 py-3 rounded-xl opacity-40" style={{ border: '1px solid var(--card-br)', background: 'var(--card-bg)' }}>
                  <p className="text-xs text-(--tx-dim)">Out of stock: {outOfStock.map(d => d.name).join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <button className="btn-main ghost mb-2" onClick={() => navigate('/scan')}>
          🔄 Scan another crop
        </button>

        <div className="h-24" />
      </div>

      {/* Sticky buy CTA */}
      {selected && (
        <div className="page-cta anim-1">
          <button className="btn-main" onClick={() => { setCart(treatment_product, active); navigate('/checkout') }}>
            Buy from {active?.name} · ₦{total.toLocaleString()} <ChevronRight size={16} />
          </button>
          <p className="cta-note">🔒 Payment held in escrow until you confirm delivery</p>
        </div>
      )}
    </div>
  )
}