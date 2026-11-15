import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useStore } from '../services/store'
import { Spinner } from './ui'

/** Shows the real pipeline steps streamed from the backend while an analysis runs. */
export function RunOverlay() {
  const { running, steps, config } = useStore()
  return (
    <AnimatePresence>
      {running && (
        <motion.div className="fixed inset-0 z-[110] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-md" />
          <motion.div initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="card relative w-full max-w-md p-6" role="status" aria-live="polite">
            <div className="label mb-1">Analysis in progress</div>
            <h3 className="font-display text-xl font-semibold">{config.variable.replace(/_/g, ' ')} · {config.region}</h3>
            <ul className="mt-5 space-y-3">
              {steps.length === 0 && <li className="flex items-center gap-3 text-sm text-neutral"><Spinner /> Contacting analysis server…</li>}
              {steps.map((s) => (
                <li key={s.key} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${s.state === 'done' ? 'border-pos bg-pos/20 text-pos' : s.state === 'running' ? 'border-cyan text-cyan' : 'border-line text-transparent'}`}>
                    {s.state === 'done' ? <Check className="h-3 w-3" /> : s.state === 'running' ? <Spinner className="h-3 w-3" /> : null}
                  </span>
                  <span className={s.state === 'pending' ? 'text-neutral/60' : 'text-ink'}>
                    {s.label}
                    {s.detail && <span className="block text-xs text-neutral">{s.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[11px] text-neutral">Each step reflects an actual operation on the server.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
