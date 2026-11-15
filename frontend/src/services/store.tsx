import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, type Analysis, type AnalyzeParams, type AssistantAnswer, type Region, type StatusInfo, type Variable } from './api'

export interface StepState { key: string; label: string; state: 'pending' | 'running' | 'done'; detail: string }
export interface Toast { id: number; kind: 'success' | 'error' | 'info'; text: string }
export interface ChatMessage { id: number; role: 'user' | 'assistant'; text?: string; answer?: AssistantAnswer }
export interface HistoryItem { id: string; label: string; status: string; at: number }

export const DEFAULT_CONFIG: AnalyzeParams = {
  variable: 'surface_temperature', region: 'morocco', start: '1991-01', end: '2025-12', resolution: 'monthly', alpha: 0.05,
  dataset: 'auto', comparison_region: null, split_year: null, include_grid: true,
}

interface Store {
  config: AnalyzeParams
  setConfig: (patch: Partial<AnalyzeParams>) => void
  analysis: Analysis | null
  setAnalysis: (a: Analysis | null) => void
  running: boolean
  steps: StepState[]
  runError: string | null
  run: (override?: Partial<AnalyzeParams>) => Promise<Analysis | null>
  history: HistoryItem[]
  variables: Variable[]
  regions: Region[]
  outline: [number, number][]
  status: StatusInfo | null
  refreshStatus: (recheck?: boolean) => Promise<void>
  toasts: Toast[]
  toast: (kind: Toast['kind'], text: string) => void
  chat: ChatMessage[]
  ask: (q: string) => Promise<void>
  asking: boolean
  clearChat: () => void
  bootError: string | null
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setCfg] = useState<AnalyzeParams>(DEFAULT_CONFIG)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<StepState[]>([])
  const [runError, setRunError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [variables, setVariables] = useState<Variable[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [outline, setOutline] = useState<[number, number][]>([])
  const [status, setStatus] = useState<StatusInfo | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [asking, setAsking] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)
  const idRef = useRef(1)
  const configRef = useRef(config)
  configRef.current = config
  const analysisRef = useRef(analysis)
  analysisRef.current = analysis

  const toast = useCallback((kind: Toast['kind'], text: string) => {
    const id = idRef.current++
    setToasts((t) => [...t, { id, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200)
  }, [])

  const refreshStatus = useCallback(async (recheck = false) => {
    try { setStatus(await (recheck ? api.recheck() : api.status())) } catch { /* shown via bootError */ }
  }, [])

  useEffect(() => {
    Promise.all([api.catalog(), api.regions(), api.status()])
      .then(([c, r, s]) => {
        setVariables(Object.values(c.categories).flat())
        setRegions(r.regions)
        setOutline(r.outline)
        setStatus(s)
      })
      .catch((e) => setBootError(e.message))
    const t = setInterval(() => refreshStatus(), 30000)
    return () => clearInterval(t)
  }, [refreshStatus])

  const setConfig = useCallback((patch: Partial<AnalyzeParams>) => setCfg((c) => ({ ...c, ...patch })), [])

  const run = useCallback(async (override?: Partial<AnalyzeParams>) => {
    const params = { ...configRef.current, ...override }
    if (override) setCfg(params)
    setRunning(true)
    setRunError(null)
    setSteps([])
    let result: Analysis | null = null
    try {
      await api.analyzeStream(params, (ev) => {
        if (ev.event === 'plan') setSteps(ev.steps.map((s) => ({ ...s, state: 'pending', detail: '' })))
        else if (ev.event === 'step') setSteps((ss) => ss.map((s) => (s.key === ev.key ? { ...s, state: ev.state, detail: ev.detail || s.detail } : s)))
        else if (ev.event === 'result') result = ev.data
        else if (ev.event === 'error') throw new Error(ev.message)
      })
      if (!result) throw new Error('The server finished without returning a result.')
      const r: Analysis = result
      setAnalysis(r)
      setHistory((h) => [{ id: r.id, label: `${r.variable.name} · ${r.region}`, status: r.provenance.status, at: Date.now() }, ...h.filter((x) => x.id !== r.id)].slice(0, 12))
      toast('success', r.stats ? `Analysis completed — ${r.classification.label.toLowerCase()}` : 'Analysis completed — insufficient data')
      return r
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setRunError(msg)
      toast('error', msg)
      return null
    } finally {
      setRunning(false)
    }
  }, [toast])

  const ask = useCallback(async (q: string) => {
    const text = q.trim()
    if (!text) return
    setChat((c) => [...c, { id: idRef.current++, role: 'user', text }])
    setAsking(true)
    try {
      const a = await api.assistant(text, analysisRef.current?.id ?? null)
      setChat((c) => [...c, { id: idRef.current++, role: 'assistant', answer: a }])
    } catch (e) {
      setChat((c) => [...c, { id: idRef.current++, role: 'assistant', text: `Could not answer: ${e instanceof Error ? e.message : e}` }])
    } finally {
      setAsking(false)
    }
  }, [])

  const value = useMemo<Store>(() => ({
    config, setConfig, analysis, setAnalysis, running, steps, runError, run, history, variables, regions, outline, status, refreshStatus,
    toasts, toast, chat, ask, asking, clearChat: () => setChat([]), bootError,
  }), [config, setConfig, analysis, running, steps, runError, run, history, variables, regions, outline, status, refreshStatus, toasts, toast, chat, ask, asking, bootError])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
