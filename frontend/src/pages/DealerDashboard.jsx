import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLogo from '../component/AppLogo'
import PinSheet from '../component/PinSheet'
import {
  LogOut, Package, TrendingUp, Plus, Pencil, Trash2,
  LayoutDashboard, ClipboardList, AlertTriangle, X, Check, Truck,
  UserCircle, Star, ShieldCheck, Phone, Mail, MapPin, Building2,
  Wallet, ChevronRight, Clock, MessageSquare, Navigation, Leaf, Moon, Sun,
} from 'lucide-react'
import { logoutUser, requestEscrowRelease } from '../services/api'
import { useAuthStore, useToastStore, useThemeStore } from '../store'
import {
  getDealerOrders, getDealerStats, getDealerProducts,
  addProduct, updateProduct, deleteProduct, updateOrderStatus,
  getDealerProfile, updateDealerProfile,
} from '../services/api'

const CATEGORIES = ['Fungicide', 'Insecticide', 'Herbicide', 'Fertilizer', 'Other']
const UNITS      = ['100g', '250g', '500g', '1kg', '100ml', '200ml', '500ml', '1L', 'Pack']
const BANKS      = ['Access Bank', 'GTBank', 'First Bank', 'Zenith Bank', 'UBA', 'Fidelity', 'Sterling', 'Other']
const STATES     = ['Rivers', 'Lagos', 'Kano', 'Oyo', 'Kaduna', 'Enugu', 'Delta', 'Anambra', 'Other']
const TABS = [
  { key: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'orders',    label: 'Orders',    icon: ClipboardList },
  { key: 'payouts',   label: 'Payouts',   icon: Wallet },
  { key: 'profile',   label: 'Profile',   icon: UserCircle },
]
const ORDER_STATUS = {
  pending:    { label: 'New order',   cls: 'badge amber' },
  dispatched: { label: 'Dispatched',  cls: 'badge amber' },
  delivered:  { label: 'Delivered',   cls: 'badge green' },
  refunded:   { label: 'Refunded',    cls: 'badge red'   },
  cancelled:  { label: 'Cancelled',   cls: 'badge red'   },
}

const TAB = ({ children }) => (
  <div className="dash-tab">{children}</div>
)

const SH = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between mb-3">
    <p className="sec-title">{title}</p>
    {action && <button onClick={onAction} className="text-brand-amber text-xs font-semibold">{action}</button>}
  </div>
)

// ── Product Sheet ────────────────────────────────────────────────────────────
function ProductSheet({ product, onClose, onSave }) {
  const isEdit = !!product?.id
  const [form, setForm] = useState({
    name:               product?.name              || '',
    category:           product?.category          || 'Fungicide',
    price:              product?.price             || '',
    stock:              product?.stock_quantity ?? product?.stock ?? '',
    unit:               product?.unit              || '1 kg',
    disease_target:     product?.target_problems   || product?.disease_target || '',
    active_ingredient:  product?.active_ingredient || '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim())                                   e.name  = 'Required'
    if (!form.price || isNaN(form.price) || +form.price <= 0) e.price = 'Enter valid price'
    if (form.stock === '' || isNaN(form.stock) || +form.stock < 0) e.stock = 'Enter valid qty'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form, price: +form.price, stock: +form.stock }
      const result  = isEdit ? await updateProduct(product.id, payload) : await addProduct(payload)
      onSave(result, isEdit)
    } finally { setSaving(false) }
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel">
        <div className="sheet-handle" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-syne font-bold text-lg text-(--tx)">{isEdit ? 'Edit product' : 'Add product'}</h3>
          <button onClick={onClose} className="nav-close"><X size={15} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <span className="field-label">Product name *</span>
            <input className={`field-input ${errors.name ? 'border-red-500/50' : ''}`}
              placeholder="e.g. Mancozeb 80WP" value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div>
            <span className="field-label">Active ingredient *</span>
            <input className="field-input" placeholder="e.g. Mancozeb 80%"
              value={form.active_ingredient} onChange={e => set('active_ingredient', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="field-label">Category</span>
              <select className="field-select" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <span className="field-label">Unit</span>
              <select className="field-select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="field-label">Price (₦) *</span>
              <input className={`field-input ${errors.price ? 'border-red-500/50' : ''}`} type="number" placeholder="4200"
                value={form.price} onChange={e => set('price', e.target.value)} />
              {errors.price && <p className="field-error">{errors.price}</p>}
            </div>
            <div>
              <span className="field-label">Stock qty *</span>
              <input className={`field-input ${errors.stock ? 'border-red-500/50' : ''}`} type="number" placeholder="20"
                value={form.stock} onChange={e => set('stock', e.target.value)} />
              {errors.stock && <p className="field-error">{errors.stock}</p>}
            </div>
          </div>
          <div>
            <span className="field-label">Target disease / pest</span>
            <input className="field-input" placeholder="e.g. Blight, Rust"
              value={form.disease_target} onChange={e => set('disease_target', e.target.value)} />
          </div>
        </div>
        <button className="btn-main mt-5" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" /> Saving…</> : <><Check size={15} /> {isEdit ? 'Save changes' : 'Add product'}</>}
        </button>
      </div>
    </div>
  )
}

// ── Delete Sheet ─────────────────────────────────────────────────────────────
function DeleteSheet({ product, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel text-center">
        <div className="sheet-handle" />
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <p className="font-syne font-bold text-lg text-(--tx) mb-2">Remove product?</p>
        <p className="text-(--tx-sub) text-sm leading-relaxed mb-5">
          "{product.name}" will be removed from your listing.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-main ghost" onClick={onClose}>Cancel</button>
          <button className="btn-main danger" disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(product.id) }}>
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Profile Sheet ───────────────────────────────────────────────────────
function ProfileSheet({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    business_name: profile?.business_name || '', owner_name: profile?.owner_name || '',
    email: profile?.email || '', phone: profile?.phone || '',
    address: profile?.address || '', state: profile?.state || '', lga: profile?.lga || '',
    bank: profile?.bank || '', account_number: profile?.account_number || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try { const res = await updateDealerProfile(form); onSave(res.user) }
    finally { setSaving(false) }
  }

  return (
    <div className="sheet-backdrop">
      <div className="sheet-panel">
        <div className="sheet-handle" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-syne font-bold text-lg text-(--tx)">Edit profile</h3>
          <button onClick={onClose} className="nav-close"><X size={15} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div><span className="field-label">Business name</span><input className="field-input" value={form.business_name} onChange={e => set('business_name', e.target.value)} /></div>
          <div><span className="field-label">Owner name</span><input className="field-input" value={form.owner_name} onChange={e => set('owner_name', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="field-label">Phone</span><input className="field-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><span className="field-label">Email</span><input className="field-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          </div>
          <div><span className="field-label">Address</span><input className="field-input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="field-label">State</span>
              <select className="field-select" value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><span className="field-label">LGA</span><input className="field-input" placeholder="LGA" value={form.lga} onChange={e => set('lga', e.target.value)} /></div>
          </div>
          <p className="text-(--tx-dim) text-[10px] uppercase tracking-widest pt-1">Payout details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="field-label">Bank</span>
              <select className="field-select" value={form.bank} onChange={e => set('bank', e.target.value)}>
                <option value="">Select</option>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div><span className="field-label">Account no.</span><input className="field-input" maxLength={10} value={form.account_number} onChange={e => set('account_number', e.target.value)} /></div>
          </div>
        </div>
        <button className="btn-main amber mt-5" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" /> Saving…</> : <><Check size={15} /> Save changes</>}
        </button>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DealerDashboard() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuthStore()
  const showGlobalToast = useToastStore(s => s.show)
  const { theme, setTheme } = useThemeStore()
  const [tab,         setTab]         = useState('overview')
  const [orders,      setOrders]      = useState([])
  const [stats,       setStats]       = useState(null)
  const [products,    setProducts]    = useState([])
  const [profile,     setProfile]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(null)
  const [orderFilter,    setOrderFilter]    = useState('all')
  const [selectedOrder,  setSelectedOrder]  = useState(null)
  const [showNotifs,     setShowNotifs]     = useState(false)
  const [showSignOut,    setShowSignOut]    = useState(false)
  const [releaseSheet,   setReleaseSheet]   = useState(null) // order object
  const [releaseNote,    setReleaseNote]    = useState('')
  const [releaseSubmitting, setReleaseSubmitting] = useState(false)
  const [releaseSuccess, setReleaseSuccess] = useState(false)

  useEffect(() => {
    Promise.all([getDealerStats(), getDealerOrders(), getDealerProducts(), getDealerProfile()])
      .then(([s,o,p,pr]) => { setStats(s); setOrders(o); setProducts(p); setProfile(pr); setLoading(false) })
  }, [])



  const showToast = (msg, type = 'success') => showGlobalToast(msg, type)

  const handleSaveProduct = (saved, isEdit) => {
    setProducts(prev => isEdit ? prev.map(p => p.id === saved.id ? saved : p) : [...prev, saved])
    showToast(isEdit ? 'Product updated' : 'Product added')
    setModal(null)
  }

  const handleDelete = async (id) => {
    await deleteProduct(id)
    setProducts(prev => prev.filter(p => p.id !== id))
    setModal(null); showToast('Product removed', 'error')
  }

  const handleDeliver = async (orderId) => {
    await updateOrderStatus(orderId, 'dispatched')
    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status: 'dispatched', dispatched_at: new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) }
      : o
    ))
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: 'dispatched', dispatched_at: new Date().toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) }))
    }
    showToast('Order marked as dispatched — farmer notified, escrow held until delivery confirmed')
  }

  // Countdown timer for dispatched orders
  const getDeliveryCountdown = (dispatchedAt) => {
    if (!dispatchedAt) return null
    // Parse date — assume dispatched 5 days ago in mock
    const deadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now in mock
    const diff = deadline - Date.now()
    if (diff <= 0) return { expired: true, label: 'Expired' }
    const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return { expired: false, label: `${days}d ${hours}h left`, urgent: days < 1 }
    return { expired: false, label: `${hours}h left`, urgent: true }
  }

  const filtered   = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter)
  const outOfStock = products.filter(p => !p.in_stock).length
  const lowStock   = products.filter(p => p.in_stock && p.stock <= 10).length

  return (
    <div className="dash-shell">
      {/* Amber ambient glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(239,159,39,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, borderRadius: '50%', flexShrink: 0 }} />
      {/* Amber ambient glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(239,159,39,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0, borderRadius: '50%' }} />

      {/* ── Topbar ── */}
      <div className="flex items-center gap-3 px-5 flex-shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)', paddingBottom: 18, background: 'linear-gradient(135deg, rgba(239,159,39,0.08) 0%, transparent 60%)' }}>
        {/* Avatar */}
        <button onClick={() => setTab('profile')}
          className="w-11 h-11 rounded-full flex items-center justify-center font-syne font-extrabold text-sm flex-shrink-0 active:scale-90 transition-all"
          style={{ background: 'rgba(239,159,39,0.15)', border: '2px solid rgba(239,159,39,0.3)', color: '#EF9F27' }}>
          {(profile?.business_name || user?.business_name || 'Dealer Store')
            .split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
        </button>

        {/* Name */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs mb-0.5 font-semibold" style={{ color: "rgba(239,159,39,0.7)" }}>🏪 Dealer portal</p>
          <h2 className="font-syne font-extrabold text-(--tx) leading-tight truncate"
            style={{ fontSize: 'clamp(14px, 4vw, 20px)' }}>
            {profile?.business_name || user?.business_name || 'My Store'}
          </h2>
        </div>
      {/* iOS safe area fill — matches nav background */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', background: 'var(--bg-nav)', flexShrink: 0 }} />

        {/* Notification bell */}
        <div className="relative">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}
            onClick={() => setShowNotifs(v => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--tx-sub)">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          {orders.filter(o => o.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-amber flex items-center justify-center text-[9px] font-bold text-white"
              style={{ border: '2px solid var(--bg)' }}>
              {orders.filter(o => o.status === 'pending').length}
            </span>
          )}
        </div>
      </div>

      {/* ── Notification panel ── */}
      {showNotifs && (
        <div className="absolute inset-0 z-40 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowNotifs(false)}>
          <div className="mx-4 mt-[calc(env(safe-area-inset-top,0px)+90px)] rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-nav)', border: '1px solid var(--card-br)' }}
            onClick={e => e.stopPropagation()}>

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid var(--card-br)' }}>
              <p className="font-syne font-bold text-sm text-(--tx)">Notifications</p>
              <button onClick={() => setShowNotifs(false)} className="text-(--tx-dim)">
                <X size={16} />
              </button>
            </div>

            {orders.filter(o => o.status === 'pending').length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-(--tx-sub) text-sm">No new notifications</p>
              </div>
            ) : (
              orders.filter(o => o.status === 'pending').map(order => (
                <button key={order.id}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all active:bg-(--card-bg)"
                  style={{ borderBottom: '1px solid var(--card-br)' }}
                  onClick={() => {
                    setShowNotifs(false)
                    setSelectedOrder(order)
                  }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(239,159,39,0.1)', border: '1px solid rgba(239,159,39,0.2)' }}>
                    <Package size={13} className="text-brand-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-(--tx) truncate mb-0.5">{order.product}</p>
                    <p className="text-xs text-(--tx-sub)">New order from {order.farmer}</p>
                    <p className="text-xs text-(--tx-dim) mt-0.5 flex items-center gap-1">
                      <MapPin size={9} /> {order.farmer_location}
                    </p>
                  </div>
                  <ChevronRight size={13} className="text-(--tx-dim) flex-shrink-0 mt-1" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══ OVERVIEW ══ */}
      {tab === 'overview' && (
        <TAB>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Orders today',    val: stats?.orders_today,  color: 'text-brand-amber', emoji: '📦' },
              { label: 'Revenue today',   val: stats ? `₦${stats.revenue_today.toLocaleString()}` : '—', color: 'text-brand-amber', emoji: '💰' },
              { label: 'Products listed', val: products.length,      color: 'text-(--tx)',        emoji: '🏪' },
              { label: 'New leads',       val: stats?.new_leads,     color: 'text-brand-amber',  emoji: '👥' },
            ].map(({ label, val, color, emoji }) => (
              <div key={label} className="stat-card">
                <span className="text-xl mb-2 block">{emoji}</span>
                {loading ? <div className="h-6 w-16 shimmer mb-1" />
                  : <p className={`font-syne font-extrabold text-2xl ${color}`}>{val ?? '—'}</p>}
                <p className="text-(--tx-sub) text-[11px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {!loading && (outOfStock > 0 || lowStock > 0) && (
            <div className="flex flex-col gap-2 mb-4">
              {outOfStock > 0 && (
                <div className="info-banner red">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-400 text-xs font-medium">{outOfStock} product{outOfStock > 1 ? 's' : ''} out of stock</p>
                    <p className="text-red-400/55 text-[11px]">Farmers can't see these</p>
                  </div>
                  <button onClick={() => setTab('inventory')} className="text-red-400 text-xs underline flex-shrink-0">Fix</button>
                </div>
              )}
              {lowStock > 0 && (
                <div className="info-banner amber">
                  <AlertTriangle size={14} className="text-brand-amber flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-amber text-xs font-medium">{lowStock} product{lowStock > 1 ? 's' : ''} running low</p>
                    <p className="text-brand-amber/55 text-[11px]">10 units or below</p>
                  </div>
                  <button onClick={() => setTab('inventory')} className="text-brand-amber text-xs underline flex-shrink-0">View</button>
                </div>
              )}
            </div>
          )}

          <SH title="Recent orders" action="See all" onAction={() => setTab('orders')} />
          <div className="flex flex-col gap-2">
            {loading
              ? [1,2,3].map(i => <div key={i} className="h-16 shimmer" />)
              : orders.slice(0,3).map(o => (
                <div key={o.id} className="glass-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-(--card-bg) flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-brand-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-(--tx) text-sm font-medium truncate">{o.product}</p>
                      <p className="text-(--tx-sub) text-xs">From {o.farmer} · {o.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-(--tx) text-sm font-medium">₦{o.amount.toLocaleString()}</p>
                      <span className={ORDER_STATUS[o.status]?.cls}>{ORDER_STATUS[o.status]?.label}</span>
                    </div>
                  </div>
                  {o.status === 'pending' && (
                    <button onClick={() => handleDeliver(o.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-brand-amber border active:scale-95 transition-all" style={{ borderColor: "rgba(239,159,39,0.3)", background: "rgba(239,159,39,0.06)" }}>
                      <Truck size={12} /> Mark as dispatched
                    </button>
                  )}
                  {o.status === 'dispatched' && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(239,159,39,0.06)', border: '1px solid rgba(239,159,39,0.2)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🔒</span>
                        <p className="text-xs text-brand-amber font-semibold">Escrow held</p>
                      </div>
                      <p className="text-xs text-(--tx-dim)">Awaiting farmer confirmation</p>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </TAB>
      )}

      {/* ══ INVENTORY ══ */}
      {tab === 'inventory' && (
        <TAB>
          <div className="flex gap-2 mb-4">
            {[
              { label: 'Total',        val: products.length,                         color: 'text-(--tx)'        },
              { label: 'In stock',     val: products.filter(p => p.in_stock).length, color: 'text-brand-amber'  },
              { label: 'Out of stock', val: outOfStock,                              color: 'text-red-400'      },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex-1 stat-card text-center">
                <p className={`font-syne font-extrabold text-xl ${color}`}>{val}</p>
                <p className="text-(--tx-sub) text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setModal({ type: 'add' })}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-brand-amber mb-4 active:scale-95 transition-all"
            style={{ border: '1.5px dashed rgba(239,159,39,0.3)', background: 'rgba(239,159,39,0.04)' }}>
            <Plus size={18} /> Add new product
          </button>

          {loading
            ? [1,2,3].map(i => <div key={i} className="h-24 shimmer mb-3" />)
            : products.length === 0
              ? (
                <div className="glass-card text-center py-10">
                  <Package size={28} className="text-(--tx-dim) mx-auto mb-3" />
                  <p className="font-syne font-bold text-(--tx) text-sm mb-1">No products yet</p>
                  <p className="text-(--tx-sub) text-xs">Add your first product so farmers can find you.</p>
                </div>
              )
              : (
                <div className="flex flex-col gap-3">
                  {products.map(p => (
                    <div key={p.id} className="glass-card">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,159,39,0.12)", border: "1.5px solid rgba(239,159,39,0.2)" }}>
                          <span className="font-syne font-bold text-brand-amber text-sm">
                            {p.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '??'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <p className="text-(--tx) text-sm font-semibold truncate">{p.name}</p>
                              <p className="text-(--tx-sub) text-xs">{p.category} · {p.unit}</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => setModal({ type: 'edit', product: p })}
                                className="w-8 h-8 rounded-xl bg-(--card-bg) flex items-center justify-center active:scale-95 transition-all">
                                <Pencil size={13} className="text-(--tx-sub)" />
                              </button>
                              <button onClick={() => setModal({ type: 'delete', product: p })}
                                className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center active:scale-95 transition-all">
                                <Trash2 size={13} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-syne font-bold text-brand-amber text-sm">₦{p.price.toLocaleString()}</span>
                            <span className={`badge text-[10px] ${
                              !p.in_stock ? 'red' : p.stock <= 10 ? 'amber' : 'amber'
                            }`}>
                              {!p.in_stock ? 'Out of stock' : p.stock <= 10 ? `${p.stock} left — low` : `${p.stock} in stock`}
                            </span>
                          </div>
                          {p.disease_target && <p className="text-(--tx-dim) text-xs mt-1 truncate">Targets: {p.disease_target}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
          }
        </TAB>
      )}

      {/* ══ ORDERS ══ */}
      {tab === 'orders' && (
        <TAB>
          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 mb-4">
            {[
              { key: 'all',        label: `All (${orders.length})` },
              { key: 'pending',    label: `New (${orders.filter(o => o.status === 'pending').length})` },
              { key: 'dispatched', label: `Dispatched (${orders.filter(o => o.status === 'dispatched').length})` },
              { key: 'delivered',  label: `Delivered (${orders.filter(o => o.status === 'delivered').length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setOrderFilter(key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all border ${
                  orderFilter === key
                    ? key === 'pending'
                      ? 'bg-brand-amber/15 text-brand-amber border-brand-amber/25'
                      : 'bg-brand-green text-(--tx) border-transparent'
                    : 'text-(--tx-sub) border-(--card-br) bg-(--card-bg)'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {loading
              ? [1,2,3,4].map(i => <div key={i} className="h-20 shimmer" />)
              : filtered.length === 0
                ? (
                  <div className="glass-card text-center py-10">
                    <ClipboardList size={28} className="text-(--tx-dim) mx-auto mb-3" />
                    <p className="font-syne font-bold text-(--tx) text-sm mb-1">No orders here</p>
                    <p className="text-(--tx-sub) text-xs">Orders from farmers will appear here.</p>
                  </div>
                )
                : filtered.map(o => (
                  <button key={o.id} className="glass-card w-full text-left active:scale-[0.985] transition-all"
                    onClick={() => setSelectedOrder(o)}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-(--tx) text-sm font-semibold truncate">{o.product}</p>
                        <p className="text-(--tx-sub) text-xs mt-0.5">{o.farmer} · {o.date}</p>
                        {o.farmer_location && (
                          <p className="text-(--tx-dim) text-xs mt-0.5 flex items-center gap-1">
                            <MapPin size={9} /> {o.farmer_location}
                          </p>
                        )}
                      </div>
                      <span className={ORDER_STATUS[o.status]?.cls + ' flex-shrink-0'}>
                        {ORDER_STATUS[o.status]?.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-(--card-br)">
                      <div>
                        <p className="text-(--tx-dim) text-xs font-mono">{o.ref || 'Order #' + o.id.slice(-5).toUpperCase()}</p>
                        <p className="font-syne font-bold text-brand-amber text-sm mt-0.5">₦{o.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-(--tx-dim) text-xs">
                        <span>View details</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </button>
                ))
            }
          </div>
        </TAB>
      )}

      {/* ══ EARNINGS ══ */}
      {tab === 'payouts' && (
        <TAB>
          {/* Header */}
          <div className="mb-5 anim-1">
            <h2 className="font-syne font-extrabold text-xl text-(--tx) mb-0.5">Earnings</h2>
            <p className="text-(--tx-sub) text-xs">Your sales ledger — money goes directly to your bank via Interswitch</p>
          </div>

          {false ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-20 shimmer" />)}
            </div>
          ) : (
            <>
              {/* Hero earnings card */}
              <div className="rounded-3xl p-5 mb-4 anim-1 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(239,159,39,0.18) 0%, rgba(239,159,39,0.06) 100%)', border: '1.5px solid rgba(239,159,39,0.25)' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'radial-gradient(circle, rgba(239,159,39,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-amber/70 mb-1">Total net earned</p>
                <p className="font-syne font-extrabold text-brand-amber mb-1" style={{ fontSize: 36, lineHeight: 1 }}>
                  ₦{orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.amount * 0.96), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-brand-amber/50 text-xs">After 4% platform fee · via Interswitch</p>
              </div>

              {/* 4-stat ledger */}
              <div className="grid grid-cols-2 gap-2 mb-5 anim-2">
                {[
                  {
                    label: 'In escrow',
                    val: `₦${orders.filter(o => o.status === 'pending' || o.status === 'dispatched').reduce((s,o) => s + o.amount, 0).toLocaleString()}`,
                    sub: 'Awaiting delivery confirmation',
                    color: 'text-brand-amber',
                    icon: '🔒',
                  },
                  {
                    label: 'Released',
                    val: `₦${orders.filter(o => o.status === 'delivered').reduce((s,o) => s + (o.amount * 0.96), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    sub: 'Paid to your bank account',
                    color: 'text-green-400',
                    icon: '✅',
                  },
                  {
                    label: 'Platform fee',
                    val: `₦${orders.filter(o => o.status === 'delivered').reduce((s,o) => s + (o.amount * 0.04), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    sub: '4% of completed orders',
                    color: 'text-(--tx-sub)',
                    icon: '📊',
                  },
                  {
                    label: 'Refunded',
                    val: `₦${orders.filter(o => o.status === 'refunded').reduce((s,o) => s + o.amount, 0).toLocaleString()}`,
                    sub: 'Returned to farmers',
                    color: 'text-red-400',
                    icon: '↩️',
                  },
                ].map(({ label, val, sub, color, icon }) => (
                  <div key={label} className="glass-card">
                    <span className="text-base mb-2 block">{icon}</span>
                    <p className={`font-syne font-bold text-base ${color}`}>{val}</p>
                    <p className="text-(--tx-sub) text-[10px] mt-0.5 leading-tight">{sub}</p>
                    <p className="text-(--tx-dim) text-[10px] mt-1 uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>

              {/* Bank account */}
              <div className="glass-card mb-5 anim-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-(--tx-dim) text-[10px] uppercase tracking-widest">Payout bank account</p>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={11} className="text-brand-amber" />
                    <span className="text-[10px] text-brand-amber font-semibold">Interswitch verified</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239,159,39,0.1)', border: '1px solid rgba(239,159,39,0.2)' }}>
                    <span className="text-lg">🏦</span>
                  </div>
                  <div>
                    <p className="text-(--tx) font-semibold text-sm">{profile?.bank || '—'}</p>
                    <p className="font-mono text-(--tx-sub) text-sm">{profile?.account_number || '—'}</p>
                    <p className="text-(--tx-dim) text-xs mt-0.5">Payments go here automatically when escrow is released</p>
                  </div>
                </div>
              </div>

              {/* Order sales ledger */}
              <div className="mb-3 anim-3">
                <div className="flex items-center justify-between">
                  <p className="sec-title mb-0">Sales ledger</p>
                  <p className="text-[10px] text-(--tx-dim)">{orders.length} orders total</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 anim-3">
                {orders.length === 0 ? (
                  <div className="glass-card text-center py-8">
                    <p className="text-2xl mb-2">📋</p>
                    <p className="font-syne font-bold text-(--tx) text-sm mb-1">No sales yet</p>
                    <p className="text-(--tx-sub) text-xs">Completed orders will appear here</p>
                  </div>
                ) : orders.map(o => {
                  const net = (o.amount * 0.96)
                  const fee = (o.amount * 0.04)
                  const isReleased = o.status === 'delivered'
                  const isEscrow   = o.status === 'pending' || o.status === 'dispatched'
                  const isRefunded = o.status === 'refunded'
                  return (
                    <div key={o.id} className="glass-card">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-(--tx) text-sm font-semibold truncate">{o.product}</p>
                          <p className="text-(--tx-sub) text-xs">{o.farmer} · {o.date}</p>
                        </div>
                        <span className={`badge flex-shrink-0 ${isReleased ? 'green' : isRefunded ? 'red' : 'amber'}`}>
                          {isReleased ? '✓ Released' : isRefunded ? '↩ Refunded' : '🔒 Escrow'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--card-br)' }}>
                        <div>
                          <p className="font-syne font-bold text-brand-amber text-sm">
                            ₦{isReleased ? net.toLocaleString(undefined, { maximumFractionDigits: 0 }) : o.amount.toLocaleString()}
                          </p>
                          {isReleased && (
                            <p className="text-(--tx-dim) text-[10px]">₦{fee.toLocaleString(undefined, { maximumFractionDigits: 0 })} fee deducted</p>
                          )}
                          {isEscrow && (
                            <p className="text-(--tx-dim) text-[10px]">Held by Interswitch</p>
                          )}
                        </div>
                        {o.ref && <p className="text-(--tx-dim) text-[10px] font-mono">{o.ref}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </TAB>
      )}

      {/* ══ PROFILE ══ */}
      {tab === 'profile' && (
        <TAB>
          <h2 className="font-syne font-extrabold text-xl text-(--tx) mb-4">My profile</h2>

          {loading
            ? <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-24 shimmer" />)}</div>
            : profile && (
              <div className="flex flex-col gap-3">
                {/* Business card */}
                <div className="glass-card">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-syne font-extrabold text-lg text-brand-amber"
                      style={{ background: 'rgba(239,159,39,0.12)', border: '2px solid rgba(239,159,39,0.25)' }}>
                      {profile.business_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-syne font-bold text-base text-(--tx) leading-tight">{profile.business_name}</h3>
                        {profile.verified && <ShieldCheck size={13} className="text-brand-green" />}
                      </div>
                      <p className="text-(--tx-sub) text-xs mt-0.5">{profile.owner_name}</p>
                      <p className="text-(--tx-dim) text-xs">CAC: {profile.cac_number}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={10} className={i <= Math.floor(profile.rating) ? 'text-brand-amber fill-brand-amber' : 'opacity-20'} />
                        ))}
                        <span className="text-(--tx-sub) text-[10px] ml-1">{profile.rating} · Since {profile.member_since}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setModal({ type: 'profile' })}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-syne font-bold text-brand-amber active:scale-95 transition-all"
                    style={{ border: '1.5px solid rgba(239,159,39,0.35)', background: 'rgba(239,159,39,0.08)' }}>
                    <Pencil size={13} /> Edit profile
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Orders',   val: profile.total_sales,  color: 'text-(--tx)'        },
                    { label: 'Products', val: products.length,      color: 'text-brand-green'  },
                    { label: 'Revenue',  val: stats ? `₦${(stats.revenue_today/1000).toFixed(0)}k` : '—', color: 'text-brand-amber font-bold' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="stat-card text-center">
                      <p className={`font-syne font-extrabold text-xl ${color}`}>{val}</p>
                      <p className="text-(--tx-sub) text-[10px] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Contact info */}
                <div className="glass-card">
                  <p className="text-(--tx-dim) text-[10px] uppercase tracking-widest mb-3">Contact info</p>
                  <div className="flex flex-col gap-3">
                    {[
                      { icon: Phone,     label: 'Phone',    val: profile.phone },
                      { icon: Mail,      label: 'Email',    val: profile.email || 'Not set' },
                      { icon: MapPin,    label: 'Location', val: profile.lga ? `${profile.lga}, ${profile.state}` : profile.state },
                      { icon: Building2, label: 'Address',  val: profile.address },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-(--card-bg) flex items-center justify-center flex-shrink-0">
                          <Icon size={13} className="text-(--tx-sub)" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-(--tx-sub) text-[10px]">{label}</p>
                          <p className="text-(--tx) text-sm truncate">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payout */}
                <div className="glass-card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-(--tx-dim) text-[10px] uppercase tracking-widest">Payout details</p>
                    <span className="badge green text-[10px]"><ShieldCheck size={9} /> Verified</span>
                  </div>
                  {[
                    { label: 'Bank',           val: profile.bank },
                    { label: 'Account number', val: profile.account_number },
                    { label: 'Account name',   val: profile.account_name || profile.business_name },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-center justify-between mb-2">
                      <p className="text-(--tx-sub) text-xs">{label}</p>
                      <p className="text-(--tx) text-sm font-medium">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Approval */}
                <div className={`rounded-2xl p-4 ${profile.approved ? 'bg-brand-green/[0.07] border border-brand-green/20' : 'bg-brand-amber/[0.07] border border-brand-amber/20'}`}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className={profile.approved ? 'text-brand-green' : 'text-brand-amber'} />
                    <div>
                      <p className={`text-sm font-medium ${profile.approved ? 'text-brand-green' : 'text-brand-amber'}`}>
                        {profile.approved ? 'Account approved' : 'Pending approval'}
                      </p>
                      <p className={`text-xs ${profile.approved ? 'text-brand-green/60' : 'text-brand-amber/60'}`}>
                        {profile.approved ? 'Farmers can find and buy from your store' : 'Review usually takes up to 24 hours'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Theme picker */}
                <div className="glass-card">
                  <div className="flex items-center gap-2 mb-3">
                    {theme === 'dark'  && <Moon size={14} className="text-brand-amber" />}
                    {theme === 'light' && <Sun  size={14} className="text-brand-amber" />}
                    {theme === 'green' && <span className="text-sm">🌿</span>}
                    <p className="text-sm font-medium text-(--tx)">Appearance</p>
                  </div>
                  <div className="theme-switcher">
                    {[
                      { key: 'dark',  label: '🌙 Dark'  },
                      { key: 'light', label: '☀️ Light' },
                      { key: 'green', label: '🌿 Green' },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => setTheme(key)}
                        className={`theme-btn ${theme === key ? 'active' : ''}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => setShowSignOut(true)} className="btn-main danger">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )
          }
        </TAB>
      )}

      {/* ══ BOTTOM NAV ══ */}
      <div className="dash-nav">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button key={key}
            className={`dash-nav-btn ${tab === key ? 'dealer-on' : ''}`}
            onClick={() => setTab(key)}>
            <div className="relative">
              <Icon size={20} strokeWidth={tab === key ? 2.5 : 1.8} />
              {key === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 bg-brand-amber text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 pointer-events-none">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </div>
            {label}
          </button>
        ))}
      </div>

      {/* ── Order detail sheet ── */}
      {selectedOrder && (
        <div className="sheet-backdrop" onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className="sheet-panel">
            <div className="sheet-handle" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={ORDER_STATUS[selectedOrder.status]?.cls}>
                    {ORDER_STATUS[selectedOrder.status]?.label}
                  </span>
                  {selectedOrder.escrow_status === 'held' && (
                    <span className="badge amber text-[10px]">🔒 Escrow held</span>
                  )}
                  {selectedOrder.escrow_status === 'released' && (
                    <span className="badge green text-[10px]">✓ Escrow released</span>
                  )}
                </div>
                <h3 className="font-syne font-extrabold text-lg text-(--tx) leading-tight">{selectedOrder.product}</h3>
                <p className="text-(--tx-dim) text-xs font-mono mt-0.5">{selectedOrder.ref}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="nav-close flex-shrink-0">
                <X size={15} />
              </button>
            </div>

            {/* Farmer contact */}
            <div className="glass-card mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-dim) mb-3">Farmer details</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-syne font-bold text-sm text-brand-green"
                  style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.2)' }}>
                  {selectedOrder.farmer.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div>
                  <p className="font-syne font-bold text-sm text-(--tx)">{selectedOrder.farmer}</p>
                  <p className="text-(--tx-sub) text-xs">{selectedOrder.farmer_state}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: Phone,      label: 'Phone',    val: selectedOrder.farmer_phone,    href: `tel:${selectedOrder.farmer_phone}` },
                  { icon: MapPin,     label: 'Location', val: selectedOrder.farmer_location, href: null },
                  { icon: Leaf,       label: 'Crop',     val: `${selectedOrder.crop} · ${selectedOrder.disease}`, href: null },
                ].map(({ icon: Icon, label, val, href }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-(--card-bg) flex items-center justify-center flex-shrink-0">
                      <Icon size={12} className="text-(--tx-sub)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-(--tx-dim) text-[10px]">{label}</p>
                      {href
                        ? <a href={href} className="text-brand-amber text-sm font-medium">{val}</a>
                        : <p className="text-(--tx) text-sm truncate">{val}</p>
                      }
                    </div>
                    {href && (
                      <a href={href}
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(239,159,39,0.1)', border: '1px solid rgba(239,159,39,0.2)' }}>
                        <Phone size={13} className="text-brand-amber" />
                      </a>
                    )}
                  </div>
                ))}
                {selectedOrder.notes && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-(--card-bg) flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare size={12} className="text-(--tx-sub)" />
                    </div>
                    <div>
                      <p className="text-(--tx-dim) text-[10px]">Delivery note</p>
                      <p className="text-(--tx-sub) text-sm italic">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order breakdown */}
            <div className="glass-card mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-dim) mb-3">Order breakdown</p>
              {[
                { label: selectedOrder.product, val: `₦${(selectedOrder.unit_price || selectedOrder.amount).toLocaleString()}` },
                { label: 'Delivery fee',         val: `₦${(selectedOrder.delivery_fee || 0).toLocaleString()}` },
                { label: 'Platform fee (4%)',    val: `₦${(selectedOrder.platform_fee || 0).toLocaleString()}` },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between mb-2">
                  <span className="text-xs text-(--tx-sub)">{label}</span>
                  <span className="text-xs text-(--tx)">{val}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2.5 border-t border-(--card-br)">
                <span className="font-syne font-bold text-sm text-(--tx)">Farmer paid</span>
                <span className="font-syne font-extrabold text-base text-brand-green">₦{selectedOrder.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-(--tx-dim)">Your payout (after fee)</span>
                <span className="text-xs font-semibold text-brand-amber">
                  ₦{(selectedOrder.amount - (selectedOrder.platform_fee || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-dim) mb-3">Timeline</p>
              {[
                { label: 'Order placed',  val: selectedOrder.date,         done: true  },
                { label: 'Payment made',  val: selectedOrder.paid_at,      done: !!selectedOrder.paid_at  },
                { label: 'Dispatched',    val: selectedOrder.dispatched_at || (selectedOrder.status === 'pending' ? 'Pending' : null), done: selectedOrder.status !== 'pending' },
                { label: 'Delivered',     val: selectedOrder.delivered_at  || (selectedOrder.status === 'delivered' ? 'Confirmed' : 'Awaiting'), done: selectedOrder.status === 'delivered' },
              ].filter(t => t.val).map(({ label, val, done }) => (
                <div key={label} className="flex justify-between mb-2 last:mb-0">
                  <span className="text-xs text-(--tx-sub) flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${done ? 'bg-brand-green' : 'bg-(--card-br)'}`} />
                    {label}
                  </span>
                  <span className={`text-xs font-medium ${done ? 'text-(--tx)' : 'text-(--tx-dim)'}`}>{val}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            {selectedOrder.status === 'pending' && (
              <button className="btn-main amber"
                onClick={() => { handleDeliver(selectedOrder.id) }}>
                <Truck size={15} /> Mark as dispatched
              </button>
            )}

            {selectedOrder.status === 'dispatched' && (() => {
              const countdown = getDeliveryCountdown(selectedOrder.dispatched_at)
              return (
                <div className="flex flex-col gap-2">
                  {/* Timer card */}
                  <div className="rounded-2xl p-3 flex items-center gap-3"
                    style={{ background: countdown?.urgent ? 'rgba(239,68,68,0.08)' : 'rgba(239,159,39,0.08)', border: `1px solid ${countdown?.urgent ? 'rgba(239,68,68,0.2)' : 'rgba(239,159,39,0.2)'}` }}>
                    <span className="text-xl flex-shrink-0">⏱</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-(--tx)">Farmer confirmation window</p>
                      <p className={`text-xs mt-0.5 ${countdown?.urgent ? 'text-red-400' : 'text-brand-amber'}`}>
                        {countdown?.expired ? 'Time expired — you can request release' : `${countdown?.label} to confirm delivery`}
                      </p>
                    </div>
                  </div>
                  {/* Release request button */}
                  {selectedOrder.release_requested ? (
                    <div className="info-banner amber">
                      <span className="flex-shrink-0">📋</span>
                      <p className="text-xs text-(--tx-sub)">Release request submitted — under admin review</p>
                    </div>
                  ) : countdown?.expired ? (
                    <button className="btn-main amber"
                      onClick={() => { setSelectedOrder(null); setReleaseSheet(selectedOrder) }}>
                      📤 Request payment release
                    </button>
                  ) : (
                    <div className="info-banner amber">
                      <span className="flex-shrink-0">🔒</span>
                      <p className="text-xs text-(--tx-sub)">Payment held in escrow. Farmer will confirm once they receive delivery.</p>
                    </div>
                  )}
                </div>
              )
            })()}

            {selectedOrder.status === 'delivered' && (
              <div className="info-banner green">
                <Check size={14} className="text-brand-green flex-shrink-0" />
                <p className="text-xs text-(--tx-sub)">Order completed — payment sent to your bank account via Interswitch</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Release Request Sheet ── */}
      {releaseSheet && !releaseSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-[430px] mx-auto"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => e.target === e.currentTarget && setReleaseSheet(null)}>
          <div className="rounded-t-3xl overflow-hidden" style={{ background: 'var(--bg-nav)', border: '1px solid var(--card-br)', borderBottom: 'none' }}>
            <div className="px-5 pt-4 pb-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--card-br)' }} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-bold text-base text-(--tx)">Request payment release</h3>
                <button onClick={() => setReleaseSheet(null)} className="nav-close"><X size={15} /></button>
              </div>

              {/* Order summary */}
              <div className="rounded-2xl p-3 mb-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-br)' }}>
                <p className="text-(--tx) text-sm font-semibold truncate">{releaseSheet.product}</p>
                <p className="text-(--tx-sub) text-xs">{releaseSheet.farmer} · ₦{releaseSheet.amount?.toLocaleString()}</p>
              </div>

              <p className="text-[10px] uppercase tracking-widest text-(--tx-dim) mb-2">How it works</p>
              <div className="flex flex-col gap-2 mb-4">
                {[
                  '1. Farmer gets notified and has 48hrs to confirm or dispute',
                  '2. If farmer confirms → payment released to your bank',
                  '3. If farmer disputes → admin reviews and decides',
                  '4. If farmer ignores → auto-released to you after 48hrs',
                ].map(s => (
                  <div key={s} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-amber mt-1.5 flex-shrink-0" />
                    <p className="text-(--tx-sub) text-xs leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>

              {/* Proof note */}
              <div className="mb-4">
                <span className="field-label">Delivery note (optional)</span>
                <textarea
                  className="field-input resize-none"
                  rows={3}
                  placeholder="e.g. Delivered on Mar 22 at 2pm. Farmer signed the receipt."
                  value={releaseNote}
                  onChange={e => setReleaseNote(e.target.value)}
                  style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                />
                <p className="field-hint">Describe delivery details to support your request</p>
              </div>

              {/* Proof upload mock */}
              <div className="rounded-2xl p-3 mb-5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
                style={{ background: 'rgba(239,159,39,0.05)', border: '1.5px dashed rgba(239,159,39,0.3)' }}>
                <span className="text-xl">📎</span>
                <div>
                  <p className="text-brand-amber text-sm font-semibold">Attach proof (optional)</p>
                  <p className="text-(--tx-dim) text-xs">Photo, waybill or delivery receipt</p>
                </div>
              </div>

              <button className="btn-main amber w-full" disabled={releaseSubmitting}
                onClick={async () => {
                  setReleaseSubmitting(true)
                  await requestEscrowRelease(releaseSheet.id, { note: releaseNote, proof_filename: 'proof.jpg' })
                  setOrders(prev => prev.map(o => o.id === releaseSheet.id ? { ...o, release_requested: true } : o))
                  setReleaseSubmitting(false)
                  setReleaseSuccess(true)
                  setReleaseNote('')
                }}>
                {releaseSubmitting ? <><span className="spinner" /> Submitting…</> : '📤 Submit release request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Release Request Success ── */}
      {releaseSheet && releaseSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-[430px] mx-auto"
          style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="rounded-t-3xl overflow-hidden text-center px-5 pt-6 pb-8"
            style={{ background: 'var(--bg-nav)', border: '1px solid var(--card-br)', borderBottom: 'none' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'var(--card-br)' }} />
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,159,39,0.12)', border: '2px solid rgba(239,159,39,0.3)' }}>
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="font-syne font-bold text-lg text-(--tx) mb-2">Request submitted!</h3>
            <p className="text-(--tx-sub) text-sm leading-relaxed mb-6">
              The farmer has been notified. They have <span className="text-brand-amber font-semibold">48 hours</span> to confirm or dispute. If no response, payment is auto-released to your bank.
            </p>
            <button className="btn-main amber" onClick={() => { setReleaseSheet(null); setReleaseSuccess(false) }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Sign out confirm sheet ── */}
      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-end justify-center max-w-[430px] mx-auto"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowSignOut(false)}>
          <div className="w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-nav)', border: '1px solid var(--card-br)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5 bg-(--card-br)" />
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <LogOut size={22} className="text-red-400" />
              </div>
              <p className="font-syne font-bold text-lg text-(--tx) mb-2">Sign out?</p>
              <p className="text-sm text-(--tx-sub)">You'll need to sign in again to access your dealer portal.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button className="btn-main danger" onClick={async () => {
                // Logout locally first — instant UX
                setShowSignOut(false)
                logout()
                navigate('/', { replace: true })
                // Invalidate token on server in background
                logoutUser().catch(() => {})
              }}>
                <LogOut size={15} /> Yes, sign me out
              </button>
              <button className="btn-main ghost" onClick={() => setShowSignOut(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <ProductSheet product={modal.product} onClose={() => setModal(null)} onSave={handleSaveProduct} />
      )}
      {modal?.type === 'delete' && (
        <DeleteSheet product={modal.product} onClose={() => setModal(null)} onConfirm={handleDelete} />
      )}
      {modal?.type === 'profile' && (
        <ProfileSheet profile={profile} onClose={() => setModal(null)}
          onSave={updated => {
            setProfile(prev => ({ ...prev, ...updated }))
            updateUser(updated)
            setModal(null)
            showToast('Profile updated')
          }}
        />
      )}
    </div>
  )
}