// src/components/ui/index.tsx
'use client'

import React from 'react'
import { clsx } from 'clsx'

// ── BUTTON ────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'secondary', size = 'md',
  loading, children, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 border',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-brand text-white border-brand hover:opacity-90 active:scale-[0.98]':
            variant === 'primary',
          'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-[0.98]':
            variant === 'secondary',
          'bg-transparent border-transparent text-gray-500 hover:bg-gray-100':
            variant === 'ghost',
          'bg-red-50 text-red-700 border-red-200 hover:bg-red-100':
            variant === 'danger',
          'text-xs px-3 py-1.5': size === 'sm',
          'text-sm px-4 py-2':   size === 'md',
          'text-base px-6 py-3': size === 'lg',
        },
        className
      )}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  )
}

// ── CARD ─────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; className?: string; padding?: boolean }

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={clsx(
      'bg-white border border-gray-100 rounded-xl',
      padding && 'p-4',
      className
    )}>
      {children}
    </div>
  )
}

// ── BADGE ─────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
      {
        'bg-teal-light text-teal-dark':       variant === 'green',
        'bg-amber-light text-amber-dark':     variant === 'amber',
        'bg-danger-light text-danger-dark':   variant === 'red',
        'bg-blue-50 text-blue-800':           variant === 'blue',
        'bg-purple-50 text-purple-800':       variant === 'purple',
        'bg-gray-100 text-gray-600':          variant === 'gray',
      },
      className
    )}>
      {children}
    </span>
  )
}

export function ClassificationBadge({ index }: { index: number }) {
  if (index >= 80) return <Badge variant="green">Investment Ready</Badge>
  if (index >= 60) return <Badge variant="amber">Conditionally Lendable</Badge>
  return <Badge variant="red">High Risk</Badge>
}

// ── INPUT ──────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; hint?: string; error?: string
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>}
      <input
        {...props}
        className={clsx(
          'w-full text-sm px-3 py-2 border rounded-lg bg-white text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
          error ? 'border-red-300' : 'border-gray-200',
          className
        )}
      />
      {hint  && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── SELECT ─────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; options: { value: string; label: string }[]; error?: string
}

export function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>}
      <select {...props} className={clsx(
        'w-full text-sm px-3 py-2 border rounded-lg bg-white text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
        error ? 'border-red-300' : 'border-gray-200',
        className
      )}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── PROGRESS BAR ───────────────────────────────────────────
interface ProgressBarProps { value: number; max?: number; color?: string; height?: string; className?: string }

export function ProgressBar({ value, max = 100, color, height = 'h-1.5', className }: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  const barColor = color || (pct >= 80 ? '#0F6E56' : pct >= 60 ? '#BA7517' : '#A32D2D')
  return (
    <div className={clsx('w-full bg-gray-100 rounded-full overflow-hidden', height, className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: barColor }}
      />
    </div>
  )
}

// ── METRIC CARD ────────────────────────────────────────────
interface MetricCardProps { label: string; value: string | number; sub?: string; subColor?: string }

export function MetricCard({ label, value, sub, subColor }: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p className="text-2xl font-medium text-gray-900">{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: subColor || '#6B7280' }}>{sub}</p>}
    </div>
  )
}

// ── SKELETON ───────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse bg-gray-200 rounded', className)} />
}

// ── DIVIDER ────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <hr className={clsx('border-gray-100', className)} />
}

// ── SCORE CIRCLE ────────────────────────────────────────────
export function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 80 ? '#0F6E56' : score >= 60 ? '#BA7517' : '#A32D2D'
  const sizes = { sm: 'w-12 h-12 text-sm', md: 'w-20 h-20 text-xl', lg: 'w-28 h-28 text-3xl' }
  return (
    <div
      className={clsx('rounded-full flex flex-col items-center justify-center flex-shrink-0', sizes[size])}
      style={{ border: `3px solid ${color}`, color }}
    >
      <span className="font-medium leading-none">{score}%</span>
    </div>
  )
}
