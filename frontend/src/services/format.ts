import type { ClassKey, DataStatus } from './api'

export const fmt = (x: number | null | undefined, d = 2): string => {
  if (x === null || x === undefined || Number.isNaN(x)) return '—'
  if (Math.abs(x) >= 10000) return x.toExponential(2)
  if (x !== 0 && Math.abs(x) < 0.001) return x.toFixed(Math.max(d, 3))
  return x.toFixed(d)
}
export const signed = (x: number | null | undefined, d = 2): string =>
  x === null || x === undefined || Number.isNaN(x) ? '—' : `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`
export const pFmt = (p: number | null | undefined): string => {
  if (p === null || p === undefined || Number.isNaN(p)) return '—'
  return p < 0.001 ? '<0.001' : p.toFixed(3)
}
export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`

export const COLORS = {
  up: '#FF9F5A', down: '#4DA3FF', ns: '#7B8BA3', cyan: '#36D6E8', violet: '#7C83FF', pos: '#35D39A', neg: '#FF6B75',
  grid: 'rgba(148,163,184,0.12)', text: '#C7D2E1',
}

export const classMeta: Record<ClassKey, { label: string; color: string; arrow: string; short: string }> = {
  significant_increasing: { label: 'Significant increase', color: COLORS.up, arrow: '↑', short: 'Increasing' },
  significant_decreasing: { label: 'Significant decrease', color: COLORS.down, arrow: '↓', short: 'Decreasing' },
  not_significant: { label: 'No significant trend', color: COLORS.ns, arrow: '→', short: 'Stable' },
  insufficient_data: { label: 'Insufficient data', color: '#566275', arrow: '?', short: 'Inconclusive' },
}

export const statusMeta = (s: DataStatus | string) =>
  s.startsWith('DEMO') ? { short: 'DEMO DATA', color: '#F5B84B', tone: 'demo' as const }
    : s.startsWith('LIVE') ? { short: 'LIVE DATA', color: COLORS.pos, tone: 'live' as const }
      : { short: 'HISTORICAL DATA', color: COLORS.cyan, tone: 'historical' as const }

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1]} ${y}`
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
