'use client'
// src/components/funnel/InvestmentFunnel.tsx
// Reusable SVG trapezoid investment funnel component

export interface FunnelStage {
  label: string
  count: number
  color: string
}

export interface FunnelProps {
  stages: FunnelStage[]
  height?: number
  showConversion?: boolean
}

const DEFAULT_STAGES: FunnelStage[] = [
  { label: 'Forms Sent',              count: 0, color: '#0F6E56' },
  { label: 'Diagnostics Completed',   count: 0, color: '#1D9E75' },
  { label: 'Scored 60%+',            count: 0, color: '#185FA5' },
  { label: 'TA Programme Started',    count: 0, color: '#BA7517' },
  { label: 'Loan Approved',           count: 0, color: '#C8102E' },
]

export default function InvestmentFunnel({
  stages = DEFAULT_STAGES,
  height = 320,
  showConversion = true,
}: FunnelProps) {
  const svgWidth     = 400
  const svgHeight    = height
  const stageHeight  = svgHeight / stages.length
  const paddingRight = 70  // space on right for conversion %

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth + paddingRight} ${svgHeight}`}
        width="100%"
        style={{ maxWidth: svgWidth + paddingRight }}
        role="img"
        aria-label="Investment readiness funnel"
      >
        <title>Investment Readiness Funnel</title>

        {stages.map((stage, i) => {
          // Trapezoid widths - narrows from top (100%) to bottom (40%)
          const topWidth    = svgWidth * (1 - i       * 0.12)
          const bottomWidth = svgWidth * (1 - (i + 1) * 0.12)
          const topY        = i * stageHeight
          const bottomY     = (i + 1) * stageHeight
          const topLeft     = (svgWidth - topWidth)    / 2
          const bottomLeft  = (svgWidth - bottomWidth) / 2

          const points = [
            `${topLeft},${topY}`,
            `${topLeft + topWidth},${topY}`,
            `${bottomLeft + bottomWidth},${bottomY}`,
            `${bottomLeft},${bottomY}`,
          ].join(' ')

          const midY    = topY + stageHeight / 2
          const prevCount = i > 0 ? stages[i - 1].count : null
          const convPct   = prevCount && prevCount > 0
            ? Math.round((stage.count / prevCount) * 100)
            : null

          return (
            <g key={stage.label}>
              {/* Trapezoid fill */}
              <polygon points={points} fill={stage.color} opacity={0.92} />

              {/* Subtle inner border */}
              <polygon points={points} fill="none" stroke="white" strokeWidth="1.5" opacity={0.4} />

              {/* Count label - large */}
              <text
                x={svgWidth / 2}
                y={midY - 7}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="18"
                fontWeight="700"
                fill="white"
              >
                {stage.count.toLocaleString()}
              </text>

              {/* Stage label - small */}
              <text
                x={svgWidth / 2}
                y={midY + 11}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fill="rgba(255,255,255,0.85)"
              >
                {stage.label}
              </text>

              {/* Conversion % on right side (between stages) */}
              {showConversion && convPct !== null && (
                <text
                  x={svgWidth + 8}
                  y={topY + 4}
                  dominantBaseline="hanging"
                  fontSize="9"
                  fill="#6B7280"
                >
                  {convPct}%
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── BANK FUNNEL WRAPPER ───────────────────────────────────

export interface BankFunnelStats {
  formsSent:           number
  diagnosticsComplete: number
  scored60Plus:        number
  taStarted:           number
  loanApproved:        number
}

export function BankFunnel({
  stats,
  height,
  showConversion,
}: {
  stats: BankFunnelStats
  height?: number
  showConversion?: boolean
}) {
  const stages: FunnelStage[] = [
    { label: 'Forms Sent',            count: stats.formsSent,           color: '#0F6E56' },
    { label: 'Diagnostics Completed', count: stats.diagnosticsComplete, color: '#1D9E75' },
    { label: 'Scored 60%+',          count: stats.scored60Plus,        color: '#185FA5' },
    { label: 'TA Programme Started',  count: stats.taStarted,           color: '#BA7517' },
    { label: 'Loan Approved',         count: stats.loanApproved,        color: '#C8102E' },
  ]

  return <InvestmentFunnel stages={stages} height={height} showConversion={showConversion} />
}
