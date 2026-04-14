'use client'
// src/app/admin/dashboard/page.tsx
// Platform super-admin dashboard — tenants, global stats, revenue

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ── MOCK DATA ─────────────────────────────────────────────
const MRR_TREND = [
  { month: 'Nov', mrr: 2400 }, { month: 'Dec', mrr: 3100 },
  { month: 'Jan', mrr: 3800 }, { month: 'Feb', mrr: 4500 },
  { month: 'Mar', mrr: 5600 }, { month: 'Apr', mrr: 6700 },
]

const DIAGNOSTICS_TREND = [
  { month: 'Nov', count: 89 },  { month: 'Dec', count: 124 },
  { month: 'Jan', count: 178 }, { month: 'Feb', count: 231 },
  { month: 'Mar', count: 289 }, { month: 'Apr', count: 347 },
]

const TENANTS = [
  { id: '1', name: 'UBA Sierra Leone',   slug: 'uba-sl',   plan: 'growth',     submissions: 247, thisMonth: 38, avgIndex: 64, status: 'active',   mrr: 899 },
  { id: '2', name: 'SLCB',              slug: 'slcb',     plan: 'starter',    submissions: 112, thisMonth: 22, avgIndex: 59, status: 'active',   mrr: 299 },
  { id: '3', name: 'Rokel Commercial',  slug: 'rokel',    plan: 'enterprise', submissions: 543, thisMonth: 71, avgIndex: 68, status: 'active',   mrr: 2500 },
  { id: '4', name: 'GTBank SL',         slug: 'gtbank',   plan: 'growth',     submissions: 198, thisMonth: 29, avgIndex: 62, status: 'active',   mrr: 899 },
  { id: '5', name: 'Ecobank SL',        slug: 'ecobank',  plan: 'starter',    submissions: 44,  thisMonth: 8,  avgIndex: 55, status: 'inactive', mrr: 0 },
  { id: '6', name: 'Vista Bank SL',     slug: 'vista',    plan: 'growth',     submissions: 167, thisMonth: 31, avgIndex: 61, status: 'active',   mrr: 899 },
]

const PLAN_COLOR: Record<string, string> = {
  starter: '#6B7280', growth: '#185FA5', enterprise: '#5B1FA8',
}
const STATUS_COLOR: Record<string, string> = {
  active: '#0F6E56', inactive: '#A32D2D',
}

function MetricCard({ label, value, sub, subColor = '#6B7280' }: {
  label: string; value: string; sub?: string; subColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: subColor }}>{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = TENANTS.filter(t =>
    (planFilter   === 'all' || t.plan   === planFilter) &&
    (statusFilter === 'all' || t.status === statusFilter)
  )

  const totalMRR    = TENANTS.filter(t => t.status === 'active').reduce((s, t) => s + t.mrr, 0)
  const totalSubs   = TENANTS.reduce((s, t) => s + t.submissions, 0)
  const activeTenants = TENANTS.filter(t => t.status === 'active').length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TOPBAR */}
      <div className="bg-white border-b border-gray-100 px-6 h-13 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-sm font-medium text-gray-900">Platform Dashboard — BizReady</h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#EDE9FE', color: '#5B1FA8' }}>Owner plan</span>
          <button className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
            style={{ background: '#5B1FA8' }}>
            Add tenant
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">

        {/* METRIC CARDS */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Active tenants"       value={String(activeTenants)} sub="+1 this month"    subColor="#0F6E56" />
          <MetricCard label="Platform MRR"         value={`$${totalMRR.toLocaleString()}`} sub="+$899 vs last month" subColor="#0F6E56" />
          <MetricCard label="Total diagnostics"    value={totalSubs.toLocaleString()} sub="+347 this month" subColor="#0F6E56" />
          <MetricCard label="Platform ARR"         value={`$${(totalMRR * 12).toLocaleString()}`} sub="Annualised" />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-2 gap-5">

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-900 mb-0.5">Monthly recurring revenue</p>
            <p className="text-xs text-gray-400 mb-4">All active tenant subscriptions</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={MRR_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v}`, 'MRR']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="mrr" stroke="#5B1FA8" strokeWidth={2}
                  dot={{ r: 3, fill: '#5B1FA8' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-medium text-gray-900 mb-0.5">Diagnostic volume</p>
            <p className="text-xs text-gray-400 mb-4">Total submissions across all tenants</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={DIAGNOSTICS_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e5e7eb' }} />
                <Bar dataKey="count" fill="#5B1FA8" radius={[3,3,0,0]} name="Diagnostics" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TENANT TABLE */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">All tenants</p>
              <p className="text-xs text-gray-400">{filtered.length} of {TENANTS.length} tenants</p>
            </div>
            <div className="flex gap-2">
              <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none">
                <option value="all">All plans</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {['Tenant', 'Plan', 'MRR', 'Total diagnostics', 'This month', 'Avg index', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-[10px] text-gray-400">{row.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
                      style={{
                        background: PLAN_COLOR[row.plan] + '18',
                        color: PLAN_COLOR[row.plan],
                      }}>
                      {row.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.mrr > 0 ? `$${row.mrr.toLocaleString()}` : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.submissions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{row.thisMonth}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{
                          width: `${row.avgIndex}%`,
                          background: row.avgIndex >= 70 ? '#0F6E56' : row.avgIndex >= 55 ? '#BA7517' : '#A32D2D',
                        }} />
                      </div>
                      <span className="text-gray-900 font-medium">{row.avgIndex}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium"
                      style={{ color: STATUS_COLOR[row.status] }}>
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ background: STATUS_COLOR[row.status] }} />
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
