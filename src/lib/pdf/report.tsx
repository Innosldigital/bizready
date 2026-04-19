'use client'
// src/lib/pdf/report.tsx
// @react-pdf/renderer diagnostic report template

import React from 'react'
import {
  Document, Page, View, Text, StyleSheet, Font,
} from '@react-pdf/renderer'
import { LEVEL_MAX, CAPACITY_AREAS } from '@/types'
import type { AreaScore, TARecommendation, GapClassification } from '@/types'

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff', fontWeight: 700 },
  ],
})

// ── COLOURS ───────────────────────────────────────────────
const C = {
  strategic: '#4F46E5',
  process:   '#2563EB',
  support:   '#059669',
  highGap:   '#A32D2D',
  highGapBg: '#FCEBEB',
  lowGap:    '#BA7517',
  lowGapBg:  '#FAEEDA',
  ideal:     '#0F6E56',
  idealBg:   '#E1F5EE',
  border:    '#E5E7EB',
  muted:     '#6B7280',
  heading:   '#111827',
  body:      '#374151',
  rowAlt:    '#F9FAFB',
}

function gapColor(gap: GapClassification | string) {
  if (gap === 'ideal_performance') return C.ideal
  if (gap === 'low_priority_gap')  return C.lowGap
  return C.highGap
}
function gapBg(gap: GapClassification | string) {
  if (gap === 'ideal_performance') return C.idealBg
  if (gap === 'low_priority_gap')  return C.lowGapBg
  return C.highGapBg
}
function gapLabel(gap: GapClassification | string) {
  if (gap === 'ideal_performance') return 'Ideal Performance'
  if (gap === 'low_priority_gap')  return 'Low Priority Gap'
  return 'High Priority Gap'
}
function classLabel(c: string) {
  if (c === 'investment_ready')       return 'Investment Ready'
  if (c === 'conditionally_lendable') return 'Conditionally Lendable'
  return 'High Risk'
}
function classColor(c: string) {
  if (c === 'investment_ready')       return C.ideal
  if (c === 'conditionally_lendable') return C.lowGap
  return C.highGap
}
function priorityColor(p: string) {
  if (p === 'critical') return C.highGap
  if (p === 'high')     return '#C04A00'
  if (p === 'medium')   return '#78350F'
  return C.muted
}
function formatDate(d: any) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const s = StyleSheet.create({
  page:      { fontFamily: 'Inter', fontSize: 9, color: C.body, paddingHorizontal: 36, paddingVertical: 40 },
  // header
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: C.border },
  bankName:  { fontSize: 13, fontWeight: 700, color: C.heading, marginBottom: 2 },
  bankSub:   { fontSize: 8, color: C.muted },
  reportLabel: { fontSize: 8, color: C.muted, textAlign: 'right' },
  reportTitle: { fontSize: 11, fontWeight: 700, color: C.heading, textAlign: 'right' },
  // section header
  sectionHead: { fontSize: 10, fontWeight: 700, color: C.heading, marginBottom: 6, marginTop: 14, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  // summary cards
  cardRow:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  card:      { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 8 },
  cardLabel: { fontSize: 7, color: C.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 18, fontWeight: 700, color: C.heading },
  cardBadge: { marginTop: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, alignSelf: 'flex-start' },
  cardBadgeText: { fontSize: 7, fontWeight: 600 },
  // business info
  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  infoCell:  { width: '30%' },
  infoLabel: { fontSize: 7, color: C.muted, marginBottom: 1, textTransform: 'uppercase' },
  infoValue: { fontSize: 8, color: C.heading, fontWeight: 600 },
  // table
  table:     { borderWidth: 1, borderColor: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  tableHead: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: C.border },
  tableRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.rowAlt },
  tableTotalRow: { flexDirection: 'row', backgroundColor: '#EEF2FF' },
  th:        { fontSize: 7, fontWeight: 700, color: C.muted, paddingHorizontal: 6, paddingVertical: 4, textTransform: 'uppercase' },
  td:        { fontSize: 8, paddingHorizontal: 6, paddingVertical: 4, color: C.body },
  tdBold:    { fontSize: 8, paddingHorizontal: 6, paddingVertical: 4, color: C.heading, fontWeight: 700 },
  // badge
  badge:     { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 20, alignSelf: 'center' },
  badgeText: { fontSize: 7, fontWeight: 600 },
  // TA card
  taCard:    { borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 8, marginBottom: 6 },
  taCardHead:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  taArea:    { fontSize: 8, fontWeight: 700, color: C.heading, flex: 1 },
  taRec:     { fontSize: 7.5, color: C.body, marginBottom: 4, lineHeight: 1.4 },
  taTool:    { fontSize: 7, paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 2, borderWidth: 1, borderColor: C.border, marginRight: 3, marginBottom: 2, color: C.body },
  taToolRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  taFooter:  { flexDirection: 'row', justifyContent: 'space-between' },
  taFooterText: { fontSize: 7, color: C.muted },
  // bar
  barWrap:   { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden', flex: 1, marginTop: 2 },
  barFill:   { height: 4, borderRadius: 2 },
  // level group header
  levelHead: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 3, marginBottom: 0 },
  levelText: { fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  // footer
  footer:    { position: 'absolute', bottom: 20, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
  footerText:{ fontSize: 7, color: C.muted },
})

// ── SUB-COMPONENTS ────────────────────────────────────────

function Badge({ gap }: { gap: string }) {
  return (
    <View style={[s.badge, { backgroundColor: gapBg(gap) }]}>
      <Text style={[s.badgeText, { color: gapColor(gap) }]}>{gapLabel(gap)}</Text>
    </View>
  )
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={s.barWrap}>
      <View style={[s.barFill, { width: `${Math.min(100, pct)}%`, backgroundColor: color }]} />
    </View>
  )
}

function SummaryTable({ areaScores, result }: { areaScores: AreaScore[]; result: any }) {
  const strategic = areaScores.filter(a => a.level === 'strategic')
  const process   = areaScores.filter(a => a.level === 'process')
  const support   = areaScores.filter(a => a.level === 'support')

  const strScore  = strategic.reduce((s, a) => s + a.rawScore, 0)
  const procScore = process.reduce((s, a) => s + a.rawScore, 0)
  const suppScore = support.reduce((s, a) => s + a.rawScore, 0)

  const col = { num: '5%', name: '38%', max: '10%', score: '10%', pct: '10%', gap: '27%' }

  const GroupRows = ({ areas, label, total, max, color }: any) => (
    <>
      <View style={[s.levelHead, { backgroundColor: `${color}18` }]}>
        <Text style={[s.levelText, { color }]}>{label}</Text>
      </View>
      {areas.map((row: AreaScore, i: number) => (
        <View key={row.areaKey} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={[s.td, { width: col.num }]}>{row.areaNumber}</Text>
          <Text style={[s.td, { width: col.name }]}>{row.areaName}</Text>
          <Text style={[s.td, { width: col.max, textAlign: 'right' }]}>{row.maxScore}</Text>
          <Text style={[s.tdBold, { width: col.score, textAlign: 'right' }]}>{row.rawScore}</Text>
          <Text style={[s.tdBold, { width: col.pct, textAlign: 'right', color: gapColor(row.gapClassification) }]}>{row.percentage}%</Text>
          <View style={[{ width: col.gap, paddingHorizontal: 6, paddingVertical: 3, justifyContent: 'center' }]}>
            <Badge gap={row.gapClassification} />
          </View>
        </View>
      ))}
      <View style={[s.tableTotalRow, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
        <Text style={[s.tdBold, { width: col.num }]} />
        <Text style={[s.tdBold, { width: col.name, color }]}>{label} Total</Text>
        <Text style={[s.tdBold, { width: col.max, textAlign: 'right', color }]}>{max}</Text>
        <Text style={[s.tdBold, { width: col.score, textAlign: 'right', color }]}>{total}</Text>
        <Text style={[s.tdBold, { width: col.pct, textAlign: 'right', color }]}>{Math.round((total / max) * 100)}%</Text>
        <Text style={[s.td, { width: col.gap }]} />
      </View>
    </>
  )

  const grandTotal = strScore + procScore + suppScore
  const grandMax   = LEVEL_MAX.strategic + LEVEL_MAX.process + LEVEL_MAX.support
  const idx        = result?.lendabilityIndex ?? '-'
  const cls        = result?.classification ?? ''

  return (
    <View style={s.table}>
      <View style={s.tableHead}>
        <Text style={[s.th, { width: col.num }]}>#</Text>
        <Text style={[s.th, { width: col.name }]}>Capacity Area</Text>
        <Text style={[s.th, { width: col.max, textAlign: 'right' }]}>Max</Text>
        <Text style={[s.th, { width: col.score, textAlign: 'right' }]}>Score</Text>
        <Text style={[s.th, { width: col.pct, textAlign: 'right' }]}>%</Text>
        <Text style={[s.th, { width: col.gap }]}>Classification</Text>
      </View>
      <GroupRows areas={strategic} label="Strategic Capacity" total={strScore}  max={LEVEL_MAX.strategic} color={C.strategic} />
      <GroupRows areas={process}   label="Process Capacity"   total={procScore} max={LEVEL_MAX.process}   color={C.process} />
      <GroupRows areas={support}   label="Support Capacity"   total={suppScore} max={LEVEL_MAX.support}   color={C.support} />
      {/* Grand Total */}
      <View style={[s.tableRow, { backgroundColor: '#111827' }]}>
        <Text style={[s.tdBold, { width: col.num, color: '#fff' }]} />
        <Text style={[s.tdBold, { width: col.name, color: '#fff' }]}>Grand Total</Text>
        <Text style={[s.tdBold, { width: col.max, textAlign: 'right', color: '#fff' }]}>{grandMax}</Text>
        <Text style={[s.tdBold, { width: col.score, textAlign: 'right', color: '#fff' }]}>{grandTotal}</Text>
        <Text style={[s.tdBold, { width: col.pct, textAlign: 'right', color: classColor(cls) }]}>{idx}%</Text>
        <View style={[{ width: col.gap, paddingHorizontal: 6, paddingVertical: 3, justifyContent: 'center' }]}>
          {cls && (
            <View style={[s.badge, { backgroundColor: gapBg(cls === 'investment_ready' ? 'ideal_performance' : cls === 'conditionally_lendable' ? 'low_priority_gap' : 'high_priority_gap') }]}>
              <Text style={[s.badgeText, { color: classColor(cls) }]}>{classLabel(cls)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

function ParameterSection({ areas, levelLabel, levelColor }: { areas: AreaScore[]; levelLabel: string; levelColor: string }) {
  if (!areas.length) return null
  const col = { name: '28%', score: '12%', gap: '25%', aspects: '35%' }

  return (
    <View wrap={false}>
      <Text style={[s.sectionHead, { color: levelColor }]}>{levelLabel} — Parameter Breakdown</Text>
      {areas.map(area => (
        <View key={area.areaKey} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={{ fontSize: 8.5, fontWeight: 700, color: C.heading }}>
              Area {area.areaNumber} · {area.areaName}
            </Text>
            <Badge gap={area.gapClassification} />
          </View>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.th, { width: col.name }]}>Parameter</Text>
              <Text style={[s.th, { width: col.score, textAlign: 'center' }]}>Score (0–10)</Text>
              <Text style={[s.th, { width: col.gap }]}>Gap</Text>
              <Text style={[s.th, { width: col.aspects }]}>Aspects Assessed</Text>
            </View>
            {area.parameterScores.map((param, i) => {
              const areaDef  = CAPACITY_AREAS.find(a => a.key === area.areaKey)
              const paramDef = areaDef?.parameters.find(p => p.id === param.parameterId)
              const aspects  = paramDef?.aspects ?? '-'
              return (
                <View key={param.parameterId} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tdBold, { width: col.name }]}>{param.parameterName}</Text>
                  <View style={[{ width: col.score, paddingHorizontal: 6, paddingVertical: 3, alignItems: 'center' }]}>
                    <View style={[s.badge, { backgroundColor: gapBg(param.gapClassification) }]}>
                      <Text style={[s.badgeText, { color: gapColor(param.gapClassification) }]}>{param.score}/10</Text>
                    </View>
                  </View>
                  <View style={[{ width: col.gap, paddingHorizontal: 6, paddingVertical: 3, justifyContent: 'center' }]}>
                    <Badge gap={param.gapClassification} />
                  </View>
                  <Text style={[s.td, { width: col.aspects, fontSize: 7, lineHeight: 1.4 }]}>{aspects}</Text>
                </View>
              )
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={{ fontSize: 7, color: C.muted }}>Area total: {area.rawScore}/{area.maxScore} pts ({area.percentage}%)</Text>
            <ProgressBar pct={area.percentage} color={gapColor(area.gapClassification)} />
          </View>
        </View>
      ))}
    </View>
  )
}

function TASection({ recs, projected }: { recs: TARecommendation[]; projected?: number }) {
  if (!recs.length) return (
    <View style={{ padding: 12, alignItems: 'center' }}>
      <Text style={{ fontSize: 9, color: C.ideal, fontWeight: 700 }}>Excellent Performance — No TA interventions required</Text>
    </View>
  )

  const priorityOrder = ['critical', 'high', 'medium', 'low'] as const
  return (
    <>
      {projected !== undefined && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <View style={{ borderWidth: 1, borderColor: C.idealBg, backgroundColor: C.idealBg, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 7, color: C.ideal, marginBottom: 2 }}>Projected Index After TA Completion</Text>
            <Text style={{ fontSize: 16, fontWeight: 700, color: C.ideal, textAlign: 'center' }}>{projected}%</Text>
          </View>
        </View>
      )}
      {priorityOrder.map(priority => {
        const group = recs.filter(r => r.priority === priority)
        if (!group.length) return null
        return (
          <View key={priority} style={{ marginBottom: 10 }}>
            <View style={[s.badge, { backgroundColor: gapBg(priority === 'low' ? 'ideal_performance' : priority === 'medium' ? 'low_priority_gap' : 'high_priority_gap'), marginBottom: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 }]}>
              <Text style={[s.badgeText, { color: priorityColor(priority), textTransform: 'uppercase', letterSpacing: 0.5 }]}>{priority} priority · {group.length} area{group.length !== 1 ? 's' : ''}</Text>
            </View>
            {group.map((rec, i) => (
              <View key={i} style={s.taCard} wrap={false}>
                <View style={s.taCardHead}>
                  <Text style={s.taArea}>{rec.area}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={[s.badge, { backgroundColor: gapBg(rec.currentScore / 10 >= 0.8 ? 'ideal_performance' : rec.currentScore / 10 >= 0.5 ? 'low_priority_gap' : 'high_priority_gap') }]}>
                      <Text style={[s.badgeText, { color: gapColor(rec.currentScore / 10 >= 0.8 ? 'ideal_performance' : rec.currentScore / 10 >= 0.5 ? 'low_priority_gap' : 'high_priority_gap') }]}>{rec.currentScore}/10</Text>
                    </View>
                    <Text style={{ fontSize: 7, color: C.muted }}>→</Text>
                    <View style={[s.badge, { backgroundColor: C.idealBg }]}>
                      <Text style={[s.badgeText, { color: C.ideal }]}>{rec.targetScore}/10</Text>
                    </View>
                  </View>
                </View>
                <Text style={s.taRec}>{rec.recommendation}</Text>
                {rec.tools.length > 0 && (
                  <>
                    <Text style={{ fontSize: 7, color: C.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tools & Resources</Text>
                    <View style={s.taToolRow}>
                      {rec.tools.map(tool => <Text key={tool} style={s.taTool}>{tool}</Text>)}
                    </View>
                  </>
                )}
                <View style={s.taFooter}>
                  <Text style={s.taFooterText}>Timeframe: {rec.timeframeWeeks} weeks</Text>
                  <Text style={s.taFooterText}>{rec.capacityLevel} capacity</Text>
                </View>
              </View>
            ))}
          </View>
        )
      })}
    </>
  )
}

// ── MAIN DOCUMENT ─────────────────────────────────────────

interface Props {
  business:   any
  diagnostic: any
  tenant:     any
}

export function DiagnosticPDFReport({ business, diagnostic, tenant }: Props) {
  const result     = diagnostic?.result ?? {}
  const areaScores: AreaScore[] = result.areaScores ?? []
  const taRecs: TARecommendation[] = result.taRecommendations ?? []
  const lendIdx    = result.lendabilityIndex ?? null
  const cls        = result.classification ?? ''
  const primary    = tenant.theme?.primary ?? '#5B1FA8'
  const bankName   = tenant.theme?.bankName ?? tenant.name
  const reportDate = formatDate(diagnostic?.scoredAt ?? diagnostic?.createdAt)
  const genDate    = formatDate(new Date())

  const strategicAreas = areaScores.filter(a => a.level === 'strategic')
  const processAreas   = areaScores.filter(a => a.level === 'process')
  const supportAreas   = areaScores.filter(a => a.level === 'support')

  return (
    <Document title={`BizReady Report — ${business.name}`} author={bankName} subject="SME Lendability Diagnostic Report">

      {/* ── PAGE 1: COVER + SUMMARY ──────────────────────── */}
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.bankName, { color: primary }]}>{bankName}</Text>
            <Text style={s.bankSub}>SME Investment Readiness Platform · BizReady</Text>
          </View>
          <View>
            <Text style={s.reportLabel}>Diagnostic Report</Text>
            <Text style={s.reportTitle}>{business.name}</Text>
            <Text style={[s.reportLabel, { marginTop: 2 }]}>Assessment Date: {reportDate}</Text>
          </View>
        </View>

        {/* Score summary cards */}
        <View style={s.cardRow}>
          <View style={s.card}>
            <Text style={s.cardLabel}>Lendability Index</Text>
            {lendIdx !== null ? (
              <>
                <Text style={[s.cardValue, { color: classColor(cls) }]}>{lendIdx}%</Text>
                <View style={[s.cardBadge, { backgroundColor: gapBg(cls === 'investment_ready' ? 'ideal_performance' : cls === 'conditionally_lendable' ? 'low_priority_gap' : 'high_priority_gap') }]}>
                  <Text style={[s.cardBadgeText, { color: classColor(cls) }]}>{classLabel(cls)}</Text>
                </View>
              </>
            ) : (
              <Text style={[s.cardValue, { color: C.muted }]}>—</Text>
            )}
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Strategic Score</Text>
            <Text style={[s.cardValue, { color: C.strategic }]}>{result.strategic?.percentage ?? '—'}%</Text>
            <Text style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>Weight: 30%</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Process Score</Text>
            <Text style={[s.cardValue, { color: C.process }]}>{result.process?.percentage ?? '—'}%</Text>
            <Text style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>Weight: 45%</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Support Score</Text>
            <Text style={[s.cardValue, { color: C.support }]}>{result.support?.percentage ?? '—'}%</Text>
            <Text style={{ fontSize: 7, color: C.muted, marginTop: 2 }}>Weight: 25%</Text>
          </View>
        </View>

        {/* Business profile */}
        <Text style={s.sectionHead}>Business Profile</Text>
        <View style={s.infoGrid}>
          {[
            ['Business Name',     business.name],
            ['CEO / Owner',       business.ceoName],
            ['Sector',            business.sector],
            ['Location',          business.location ?? '-'],
            ['Years Operating',   business.yearsOperating ?? '-'],
            ['Employees',         business.employeeCount ?? '-'],
            ['Annual Revenue',    business.annualRevenue ?? '-'],
            ['Loan Purpose',      business.loanPurpose ?? '-'],
            ['Country',           business.country ?? 'Sierra Leone'],
          ].map(([label, value]) => (
            <View key={label} style={s.infoCell}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Capacity summary table */}
        <Text style={s.sectionHead}>Section A — Capacity Summary</Text>
        {areaScores.length > 0 ? (
          <SummaryTable areaScores={areaScores} result={result} />
        ) : (
          <Text style={{ fontSize: 8, color: C.muted }}>Area scores not available for this diagnostic.</Text>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated {genDate} · BizReady Platform</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ── PAGE 2+: PARAMETER BREAKDOWN ─────────────────── */}
      {areaScores.length > 0 && (
        <Page size="A4" style={s.page}>
          <View style={s.header}>
            <Text style={[s.bankName, { color: primary }]}>{bankName} · {business.name}</Text>
            <Text style={s.reportLabel}>Capacity Parameter Breakdown</Text>
          </View>

          <ParameterSection areas={strategicAreas} levelLabel="Section B — Strategic Capacity" levelColor={C.strategic} />
          <ParameterSection areas={processAreas}   levelLabel="Section C — Process Capacity"   levelColor={C.process} />
          <ParameterSection areas={supportAreas}   levelLabel="Section D — Support Capacity"   levelColor={C.support} />

          <View style={s.footer} fixed>
            <Text style={s.footerText}>Generated {genDate} · BizReady Platform</Text>
            <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      )}

      {/* ── PAGE 3+: TA RECOMMENDATIONS ──────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={[s.bankName, { color: primary }]}>{bankName} · {business.name}</Text>
          <Text style={s.reportLabel}>Section E — TA Recommendations</Text>
        </View>

        <Text style={s.sectionHead}>Technical Assistance Plan</Text>
        <TASection recs={taRecs} projected={result.projectedIndexAfterTA} />

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated {genDate} · BizReady Platform</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
