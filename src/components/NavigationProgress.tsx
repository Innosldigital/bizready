'use client'
// Top loading bar that fires on link click and completes when pathname changes

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const barRef   = useRef<HTMLDivElement>(null)
  const timer1   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timer2   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Intercept clicks on internal links to start the bar immediately
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || /^https?:/.test(href)) return
      startBar()
    }
    document.addEventListener('click', onLinkClick)
    return () => document.removeEventListener('click', onLinkClick)
  }, [])

  // When navigation completes (pathname changes), finish the bar
  useEffect(() => {
    finishBar()
  }, [pathname])   // eslint-disable-line react-hooks/exhaustive-deps

  function startBar() {
    const bar = barRef.current
    if (!bar) return
    bar.style.transition = 'none'
    bar.style.width = '0%'
    bar.style.opacity = '1'
    requestAnimationFrame(() => {
      bar.style.transition = 'width 25s cubic-bezier(0.1, 0.05, 0, 1)'
      bar.style.width = '85%'
    })
  }

  function finishBar() {
    const bar = barRef.current
    if (!bar) return
    if (timer1.current) clearTimeout(timer1.current)
    if (timer2.current) clearTimeout(timer2.current)
    bar.style.transition = 'width 0.15s ease'
    bar.style.width = '100%'
    timer1.current = setTimeout(() => {
      if (!barRef.current) return
      barRef.current.style.transition = 'opacity 0.25s ease'
      barRef.current.style.opacity = '0'
      timer2.current = setTimeout(() => {
        if (!barRef.current) return
        barRef.current.style.transition = 'none'
        barRef.current.style.width = '0%'
      }, 280)
    }, 180)
  }

  return (
    <div
      ref={barRef}
      style={{
        position: 'fixed', top: 0, left: 0, height: 3, zIndex: 9999,
        background: 'var(--brand-primary, #5B1FA8)',
        width: '0%', opacity: 0,
        borderRadius: '0 2px 2px 0',
        pointerEvents: 'none',
        boxShadow: '0 0 8px var(--brand-primary, #5B1FA8)',
      }}
    />
  )
}
