'use client'
// src/components/funnel/InvestmentFunnel.tsx
// The investment readiness funnel — shows strategic, operational, support layers

import type { LendabilityResult } from '@/types'

interface FunnelProps {
  result:    LendabilityResult
  size?:     'sm' | 'md' | 'lg'
  animated?: boolean
}

export default function InvestmentFunnel({ result, size = 'md', animated = true }: FunnelProps) {
  const s  = result.strategic.percentage
  const o  = result.operational.percentage
  const su = result.support.percentage
  const idx = result.lendabilityIndex

  const loanColor  = idx >= 80 ? '#0F6E56' : idx >= 60 ? '#BA7517' : '#A32D2D'
  const loanOpacity = idx >= 80 ? 0.9 : idx >= 60 ? 0.55 : 0.15
  const loanLabel  = idx >= 80 ? 'Loan ready' : idx >= 60 ? 'Conditional' : 'Not yet ready'

  const widths = { sm: 200, md: 260, lg: 320 }
  const w = widths[size]
  const h = Math.round(w * 1.55)

  // Layer opacities based on scores
  const suOpacity  = Math.max(0.12, su  / 100 * 0.9)
  const oOpacity   = Math.max(0.12, o   / 100 * 0.9)
  const sOpacity   = Math.max(0.12, s   / 100 * 0.9)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img"
        aria-label={`Investment readiness funnel. Lendability index: ${idx}%. ${result.classification}`}>
        <title>Investment readiness funnel</title>

        {/* ── GREY OUTLINES (empty state) ── */}
        {/* Loan ready box */}
        <rect x={w*0.3} y={4} width={w*0.4} height={h*0.12} rx="6"
          fill="#F5F5F5" stroke="#D3D1C7" strokeWidth="1"/>
        {/* Strategic trapezoid */}
        <polygon points={`${w*0.15},${h*0.18} ${w*0.85},${h*0.18} ${w*0.93},${h*0.44} ${w*0.07},${h*0.44}`}
          fill="#F5F5F5" stroke="#D3D1C7" strokeWidth="1"/>
        {/* Operational trapezoid */}
        <polygon points={`${w*0.07},${h*0.44} ${w*0.93},${h*0.44} ${w*0.86},${h*0.72} ${w*0.14},${h*0.72}`}
          fill="#F5F5F5" stroke="#D3D1C7" strokeWidth="1"/>
        {/* Support trapezoid */}
        <polygon points={`${w*0.14},${h*0.72} ${w*0.86},${h*0.72} ${w*0.78},${h*0.96} ${w*0.22},${h*0.96}`}
          fill="#F5F5F5" stroke="#D3D1C7" strokeWidth="1"/>

        {/* ── FILLED LAYERS ── */}
        {/* Support — bottom */}
        <polygon points={`${w*0.14},${h*0.72} ${w*0.86},${h*0.72} ${w*0.78},${h*0.96} ${w*0.22},${h*0.96}`}
          fill="#BA7517" opacity={suOpacity}
          style={animated ? { transition: 'opacity 0.6s ease' } : {}} />

        {/* Operational — middle */}
        <polygon points={`${w*0.07},${h*0.44} ${w*0.93},${h*0.44} ${w*0.86},${h*0.72} ${w*0.14},${h*0.72}`}
          fill="#185FA5" opacity={oOpacity}
          style={animated ? { transition: 'opacity 0.6s ease' } : {}} />

        {/* Strategic — top */}
        <polygon points={`${w*0.15},${h*0.18} ${w*0.85},${h*0.18} ${w*0.93},${h*0.44} ${w*0.07},${h*0.44}`}
          fill="#0F6E56" opacity={sOpacity}
          style={animated ? { transition: 'opacity 0.6s ease' } : {}} />

        {/* Loan ready box fill */}
        <rect x={w*0.3} y={4} width={w*0.4} height={h*0.12} rx="6"
          fill={loanColor} opacity={loanOpacity}
          style={animated ? { transition: 'opacity 0.6s ease' } : {}} />

        {/* ── WHITE OUTLINES on top ── */}
        <polygon points={`${w*0.14},${h*0.72} ${w*0.86},${h*0.72} ${w*0.78},${h*0.96} ${w*0.22},${h*0.96}`}
          fill="none" stroke="white" strokeWidth="1.5"/>
        <polygon points={`${w*0.07},${h*0.44} ${w*0.93},${h*0.44} ${w*0.86},${h*0.72} ${w*0.14},${h*0.72}`}
          fill="none" stroke="white" strokeWidth="1.5"/>
        <polygon points={`${w*0.15},${h*0.18} ${w*0.85},${h*0.18} ${w*0.93},${h*0.44} ${w*0.07},${h*0.44}`}
          fill="none" stroke="white" strokeWidth="1.5"/>
        <rect x={w*0.3} y={4} width={w*0.4} height={h*0.12} rx="6"
          fill="none" stroke="white" strokeWidth="1.5"/>

        {/* ── LABELS ── */}
        {/* Loan ready */}
        <text x={w*0.5} y={h*0.08} textAnchor="middle" dominantBaseline="central"
          fontSize="11" fontWeight="500" fill={idx >= 60 ? '#fff' : '#0F6E56'}>{loanLabel}</text>
        <text x={w*0.5} y={h*0.115} textAnchor="middle" dominantBaseline="central"
          fontSize="9" fill={idx >= 60 ? 'rgba(255,255,255,0.8)' : '#0F6E56'}>{idx}%</text>

        {/* Strategic */}
        <text x={w*0.5} y={h*0.30} textAnchor="middle" dominantBaseline="central"
          fontSize="10" fontWeight="500" fill="#fff">Strategic</text>
        <text x={w*0.5} y={h*0.335} textAnchor="middle" dominantBaseline="central"
          fontSize="9" fill="rgba(255,255,255,0.85)">{s}%</text>

        {/* Operational */}
        <text x={w*0.5} y={h*0.57} textAnchor="middle" dominantBaseline="central"
          fontSize="10" fontWeight="500" fill="#fff">Operational</text>
        <text x={w*0.5} y={h*0.605} textAnchor="middle" dominantBaseline="central"
          fontSize="9" fill="rgba(255,255,255,0.85)">{o}%</text>

        {/* Support */}
        <text x={w*0.5} y={h*0.83} textAnchor="middle" dominantBaseline="central"
          fontSize="10" fontWeight="500" fill="#fff">Support</text>
        <text x={w*0.5} y={h*0.865} textAnchor="middle" dominantBaseline="central"
          fontSize="9" fill="rgba(255,255,255,0.85)">{su}%</text>

        {/* Down arrows between layers */}
        <polygon points={`${w*0.47},${h*0.155} ${w*0.53},${h*0.155} ${w*0.5},${h*0.175}`}
          fill="#0F6E56" opacity="0.5"/>
        <polygon points={`${w*0.47},${h*0.438} ${w*0.53},${h*0.438} ${w*0.5},${h*0.455}`}
          fill="#185FA5" opacity="0.5"/>
        <polygon points={`${w*0.47},${h*0.715} ${w*0.53},${h*0.715} ${w*0.5},${h*0.73}`}
          fill="#BA7517" opacity="0.5"/>
      </svg>

      {/* ── LEGEND ── */}
      <div className="flex gap-4 mt-3 flex-wrap justify-center">
        {[
          { color: '#0F6E56', label: `Strategic (30%)` },
          { color: '#185FA5', label: `Operational (45%)` },
          { color: '#BA7517', label: `Support (25%)` },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── BOTTLENECK INDICATOR ──────────────────────────────────
export function BottleneckIndicator({ result }: { result: LendabilityResult }) {
  const scores: Record<string, number> = {
    strategic:   result.strategic.percentage,
    operational: result.operational.percentage,
    support:     result.support.percentage,
  }
  const bottleneck = result.bottleneck
  const score      = scores[bottleneck] || 0
  const color      = bottleneck === 'strategic' ? '#0F6E56'
    : bottleneck === 'operational' ? '#185FA5' : '#BA7517'

  const weights: Record<string, number> = { strategic: 0.30, operational: 0.45, support: 0.25 }
  const impact = Math.round((80 - score) * weights[bottleneck])

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Bottleneck indicator</p>
      <div className="text-center py-2">
        <p className="text-xs text-gray-400 mb-1">Weakest capacity area</p>
        <p className="text-xl font-medium capitalize mb-0.5" style={{ color }}>{bottleneck}</p>
        <p className="text-3xl font-medium" style={{ color }}>{score}%</p>
        <p className="text-xs text-gray-400 mt-2">
          Raising this to 80% would increase your overall index by{' '}
          <strong style={{ color }}>{Math.max(0, impact)} pts</strong>
        </p>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
        <div className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}
