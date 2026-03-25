/**
 * StepProgress — shared 3-step progress card for signup flows
 *
 * Farmer steps:  1 Role  →  2 Phone + OTP  →  3 Farm details
 * Dealer steps:  1 Role  →  2 Phone + OTP  →  3 Business details
 *
 * currentStep: 1 | 2 | 3
 * role: 'farmer' | 'dealer'
 */
export default function StepProgress({ currentStep = 1, role = 'farmer' }) {
  const isDealer = role === 'dealer'
  const accent   = isDealer ? '#EF9F27' : '#1D9E75'
  const accentBg = isDealer ? 'rgba(239,159,39,0.15)' : 'rgba(29,158,117,0.15)'
  const accentBr = isDealer ? 'rgba(239,159,39,0.4)'  : 'rgba(29,158,117,0.4)'

  const steps = isDealer ? [
    { n: 1, label: 'Choose your role',         desc: 'Agro-dealer selected'      },
    { n: 2, label: 'Verify phone number',       desc: 'SMS code confirmation'     },
    { n: 3, label: 'Business details',          desc: 'Name, location, bank info' },
  ] : [
    { n: 1, label: 'Choose your role',          desc: 'Farmer selected'           },
    { n: 2, label: 'Verify phone number',       desc: 'SMS code confirmation'     },
    { n: 3, label: 'Tell us about your farm',   desc: 'Name, location, crop'      },
  ]

  return (
    <div className="glass-card mt-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-(--tx-dim) mb-3">
        Your progress
      </p>
      {steps.map(({ n, label, desc }) => {
        const done   = n < currentStep
        const active = n === currentStep
        return (
          <div key={n} className="flex items-start gap-3 mb-3 last:mb-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-syne font-bold text-sm transition-all"
              style={{
                background: done || active ? accentBg : 'var(--card-bg)',
                border:     `1.5px solid ${done || active ? accentBr : 'var(--card-br)'}`,
                color:      done || active ? accent : 'var(--tx-dim)',
              }}>
              {done ? '✓' : n}
            </div>
            <div className="pt-0.5">
              <p className={`text-sm font-semibold ${done || active ? 'text-(--tx)' : 'text-(--tx-sub)'}`}>
                {label}
              </p>
              <p className="text-xs text-(--tx-dim) mt-0.5">{desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}