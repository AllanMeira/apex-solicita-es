import { useState, useEffect } from 'react'

export function useBreakpoint() {
  const get = () => {
    if (typeof window === 'undefined') return 'desktop'
    const w = window.innerWidth
    if (w < 768) return 'mobile'
    if (w < 1024) return 'tablet'
    if (w < 1920) return 'desktop'
    return 'tv'
  }
  const [bp, setBp] = useState(get)
  useEffect(() => {
    const onResize = () => setBp(get())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return bp
}
