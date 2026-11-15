import type { ReactNode } from 'react'
import type { Analysis } from '../services/api'
import { Card, InfoTip } from './ui'

export function Metric({ label, value, sub, hint, accent }: { label: string; value: ReactNode; sub?: ReactNode; hint?: string; accent?: string }) {
  return (
    <Card className="min-w-0">
      <div className="label flex items-center gap-1.5">{label}{hint && <InfoTip text={hint} />}</div>
      <div className="num mt-2 truncate text-2xl font-semibold sm:text-3xl" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub && <div className="mt-1 text-xs text-neutral">{sub}</div>}
    </Card>
  )
}

export function Sparkline({ values, color = '#36D6E8', height = 36 }: { values?: (number | null)[]; color?: string; height?: number }) {
  const v = (values ?? []).map((x) => (x === null ? NaN : x))
  const ok = v.filter((x) => !Number.isNaN(x))
  if (ok.length < 2) return <div style={{ height }} />
  const lo = Math.min(...ok), hi = Math.max(...ok), W = 120
  const pts = v.map((x, i) => (Number.isNaN(x) ? null : `${((i / (v.length - 1)) * W).toFixed(1)},${(height - 3 - ((x - lo) / (hi - lo || 1)) * (height - 6)).toFixed(1)}`)).filter(Boolean)
  return <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" aria-hidden><polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
}

export const regionOptions = (regions: { id: string; name: string }[]) => regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)

export const analysisTitle = (a: Analysis) => `${a.variable.name} — ${a.region}, ${a.period.start} to ${a.period.end}`
