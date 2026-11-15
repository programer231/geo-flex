import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Play, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../services/store'

const STEPS = [
  { title: 'Open the dashboard', text: 'The Overview summarises what GEO-FLEX has actually analysed. Check the data-status badge: LIVE, HISTORICAL or DEMO.', route: '/' },
  { title: 'Select surface temperature', text: 'In the Data Explorer, variables are grouped by category; only those with a working connector are enabled.', route: '/data', act: 'variable' },
  { title: 'Select Morocco', text: 'Region and optional comparison region are configured next to the variable.', route: '/data', act: 'region' },
  { title: 'Choose an observation period', text: 'We use 1991-01 to 2025-12 (35 years, monthly) — long enough for a robust trend test.', route: '/data', act: 'period' },
  { title: 'Run the analysis', text: 'Press ANALYZE CHANGES. The progress steps are streamed from the real pipeline.', route: '/data', act: 'run' },
  { title: 'View the time series', text: 'Observations, Sen trend line, 95% band and flagged anomalies.', route: '/analysis' },
  { title: 'Explore geographical patterns', text: 'Each grid cell has its own Mann-Kendall test; click one to inspect its history.', route: '/explore' },
  { title: 'Review statistical significance', text: 'p-values, Kendall\'s tau, Sen\'s slope with confidence interval, autocorrelation-robust checks.', route: '/analysis' },
  { title: 'Ask GEO-FLEX Intelligence', text: 'The assistant explains the computed statistics — it never invents results.', route: '/insights', act: 'ask' },
  { title: 'Generate the scientific report', text: 'Export a PDF or CSV built from the computed results.', route: '/reports' },
]

interface Tour { active: boolean; start: () => void }
const Ctx = createContext<Tour>({ active: false, start: () => {} })
export const useTour = () => useContext(Ctx)
export function TourProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  return <Ctx.Provider value={{ active, start: () => setActive(true) }}>{children}<TourPanel active={active} close={() => setActive(false)} /></Ctx.Provider>
}

function TourPanel({ active, close }: { active: boolean; close: () => void }) {
  const [i, setI] = useState(0)
  const nav = useNavigate()
  const { setConfig, run, ask, analysis } = useStore()
  const step = STEPS[i]
  const go = useCallback(async (n: number) => {
    const s = STEPS[n]
    setI(n)
    if (s.act === 'variable') setConfig({ variable: 'surface_temperature' })
    if (s.act === 'region') setConfig({ region: 'morocco' })
    if (s.act === 'period') setConfig({ start: '1991-01', end: '2025-12', resolution: 'monthly' })
    nav(s.route)
    if (s.act === 'run') { const r = await run({ variable: 'surface_temperature', region: 'morocco', start: '1991-01', end: '2025-12', resolution: 'monthly' }); if (r) nav('/analysis') }
    if (s.act === 'ask') ask('Explain the temperature trend in this region.')
  }, [nav, run, ask, setConfig])
  return (
    <AnimatePresence>
      {active && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="card fixed bottom-5 left-4 z-[90] w-[min(22rem,calc(100vw-2rem))] border-cyan/30 p-4 shadow-2xl lg:left-72">
          <div className="mb-1 flex items-center justify-between">
            <span className="label text-cyan">Guided demo · Morocco temperature · step {i + 1}/{STEPS.length}</span>
            <button onClick={close} aria-label="End demo" className="rounded p-1 text-neutral hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
          <div className="font-display text-base font-semibold">{step.title}</div>
          <p className="mt-1 text-xs text-neutral">{step.text}</p>
          {i >= 5 && !analysis && <p className="mt-2 text-xs text-[#F5B84B]">Run the analysis (step 5) first so these views have results.</p>}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">{STEPS.map((_, k) => <span key={k} className={`h-1 w-3 rounded-full ${k <= i ? 'bg-cyan' : 'bg-white/15'}`} />)}</div>
            <div className="flex gap-2">
              {i === 0 && <button className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => go(0)}>Start</button>}
              {i < STEPS.length - 1 && <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={() => go(i + 1)}>Next <ChevronRight className="h-3.5 w-3.5" /></button>}
              {i === STEPS.length - 1 && <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={close}>Finish</button>}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function StartTourButton({ className = 'btn-ghost' }: { className?: string }) {
  const { start } = useTour()
  return <button className={className} onClick={start}><Play className="h-4 w-4" />Guided demo</button>
}
