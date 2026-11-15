import { AnimatePresence, animate, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ClassKey, DataStatus } from '../services/api'
import { classMeta, statusMeta } from '../services/format'
import { useStore } from '../services/store'

export function Card({ children, className = '', pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={`card ${pad ? 'card-pad' : ''} ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-neutral">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}

/** Animated number that eases to its target (runs once per target change). */
export function Counter({ value, decimals = 0, className = '' }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const c = animate(0, value, { duration: 0.9, ease: 'easeOut', onUpdate: (v) => { el.textContent = v.toFixed(decimals) } })
    return () => c.stop()
  }, [value, decimals])
  return <span ref={ref} className={className}>{value.toFixed(decimals)}</span>
}

export function Stat({ label, value, sub, decimals = 0, hint }: { label: string; value: number | string; sub?: string; decimals?: number; hint?: string }) {
  return (
    <Card className="min-w-0">
      <div className="label flex items-center gap-1.5">{label}{hint && <InfoTip text={hint} />}</div>
      <div className="num mt-2 truncate text-4xl font-semibold">
        {typeof value === 'number' ? <Counter value={value} decimals={decimals} /> : value}
      </div>
      {sub && <div className="mt-1 text-xs text-neutral">{sub}</div>}
    </Card>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/[0.04] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  )
}

export function TrendBadge({ cls, size = 'md' }: { cls: ClassKey; size?: 'sm' | 'md' }) {
  const m = classMeta[cls]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'}`}
      style={{ color: m.color, borderColor: `${m.color}55`, background: `${m.color}14` }}>
      <span aria-hidden>{m.arrow}</span>{m.label}
    </span>
  )
}

export function DataBadge({ status, compact = false }: { status: DataStatus | string; compact?: boolean }) {
  const m = statusMeta(status)
  return (
    <span title={String(status)} className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'}`}
      style={{ color: m.color, borderColor: `${m.color}66`, background: `${m.color}14` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />{m.short}
    </span>
  )
}

export function DemoBanner({ status, warnings = [] }: { status: DataStatus | string; warnings?: string[] }) {
  if (!status.startsWith('DEMO')) return null
  const fallback = warnings.find((w) => w.startsWith('Live NASA data'))
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#F5B84B]/40 bg-[#F5B84B]/10 px-4 py-3 text-sm text-[#F8D28A]" role="status">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <b>DEMONSTRATION DATA.</b> These values are synthetic and are not NASA observations; no scientific conclusion can be drawn from them.
        {fallback && <div className="mt-1 text-xs opacity-90">{fallback}</div>}
      </div>
    </div>
  )
}

export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label="More information" onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} className="text-neutral/70 hover:text-cyan">
        <Info className="h-3.5 w-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-line bg-bg2 p-3 text-xs font-normal normal-case tracking-normal text-ink shadow-2xl">
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-label={title} initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, opacity: 0 }}
            className={`card relative max-h-[88vh] w-full overflow-auto p-6 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">{title}</h3>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-neutral hover:bg-white/10 hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  const icon = { success: <CheckCircle2 className="h-4 w-4 text-pos" />, error: <XCircle className="h-4 w-4 text-neg" />, info: <Info className="h-4 w-4 text-cyan" /> }
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-80 max-w-[calc(100vw-2.5rem)] flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-bg2/95 px-4 py-3 text-sm shadow-2xl backdrop-blur">
            <span className="mt-0.5">{icon[t.kind]}</span><span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white/[0.03] text-2xl"><svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12h16M12 4v16M6.5 6.5l11 11M17.5 6.5l-11 11" strokeLinecap="round" /></svg></div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-neutral">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} aria-hidden />
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-bg2 p-1" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${value === o.value ? 'bg-cyan text-bg' : 'text-neutral hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
