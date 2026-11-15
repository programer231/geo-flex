import { Compass, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, DataBadge, DemoBanner, PageHeader, Segmented, Skeleton, Spinner, TrendBadge } from '../components/ui'
import { api, type Discovery, type DiscoveryItem } from '../services/api'
import { classMeta, fmt, pFmt, signed } from '../services/format'
import { useStore } from '../services/store'

const cls = (i: DiscoveryItem) => (i.significant ? (i.slope_per_decade > 0 ? 'significant_increasing' : 'significant_decreasing') : 'not_significant') as keyof typeof classMeta

export default function Discover() {
  const { config, setConfig, run } = useStore()
  const nav = useNavigate()
  const [d, setD] = useState<Discovery | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'significant' | 'increasing' | 'decreasing' | 'all'>('significant')
  const [variable, setVariable] = useState('all')
  const [busy, setBusy] = useState<string | null>(null)

  const load = (refresh = false) => {
    setLoading(true); setErr(null)
    api.discover({ start: '1991-01', end: '2025-12', resolution: 'monthly', alpha: config.alpha, dataset: config.dataset, ...(refresh ? { refresh: 'true' } : {}) } as never)
      .then(setD).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [config.alpha, config.dataset]) // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => (d?.items ?? []).filter((i) => (variable === 'all' || i.variable_id === variable) &&
    (filter === 'all' || (filter === 'significant' && i.significant) || (filter === 'increasing' && i.significant && i.slope_per_decade > 0) || (filter === 'decreasing' && i.significant && i.slope_per_decade < 0))), [d, filter, variable])
  const vars = useMemo(() => Array.from(new Map((d?.items ?? []).map((i) => [i.variable_id, i.variable]))), [d])
  const investigate = async (i: DiscoveryItem) => {
    const key = i.variable_id + i.region_id; setBusy(key)
    setConfig({ variable: i.variable_id, region: i.region_id })
    const r = await run({ variable: i.variable_id, region: i.region_id, start: '1991-01', end: '2025-12', resolution: 'monthly' })
    setBusy(null); if (r) nav('/analysis')
  }

  return (
    <div>
      <PageHeader title="Discover Earth" subtitle="GEO-FLEX screens every connected variable in every region and ranks what is changing. Only combinations that were actually tested appear here."
        actions={<>{d && <DataBadge status={d.data_status} />}<button className="btn-ghost" onClick={() => load(true)} disabled={loading}>{loading ? <Spinner /> : <Compass className="h-4 w-4" />}Re-run screening</button></>} />
      {d && <DemoBanner status={d.data_status} warnings={d.warnings} />}
      {err && <Card className="mb-4 text-sm text-neg">Discovery failed: {err}</Card>}
      {d && (
        <Card className="mb-5 text-sm text-neutral"><b className="text-ink">Scope:</b> {d.scope.variables.length} variables × {d.scope.regions.length} regions = {d.scope.n_tests} tests, {d.scope.period.start}–{d.scope.period.end}, α = {d.scope.alpha}. <b className="text-ink">Multiple-comparison control:</b> {d.scope.correction}. Ranking is by standardised effect size among significant results.
          {d.errors.length > 0 && <div className="mt-2 text-neg">{d.errors.length} test(s) failed: {d.errors.slice(0, 2).join('; ')}</div>}</Card>)}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={filter} onChange={setFilter} options={[{ value: 'significant', label: 'Significant' }, { value: 'increasing', label: 'Increasing' }, { value: 'decreasing', label: 'Decreasing' }, { value: 'all', label: 'All tested' }]} />
        <select className="input !w-auto" value={variable} onChange={(e) => setVariable(e.target.value)} aria-label="Variable filter"><option value="all">All variables</option>{vars.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        {d && <span className="text-xs text-neutral">{items.length} shown · {d.summary.n_significant} significant · {d.summary.n_increasing} ↑ · {d.summary.n_decreasing} ↓</span>}
      </div>
      {loading && !d && <div className="space-y-3">{[0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-24" />)}</div>}
      <div className="space-y-3">
        {items.map((i, idx) => (
          <Card key={i.variable_id + i.region_id} className="grid items-center gap-4 md:grid-cols-[auto_1fr_auto]">
            <div className="num flex h-11 w-11 items-center justify-center rounded-xl border border-line text-lg font-semibold text-cyan">{idx + 1}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="font-display text-base font-semibold">{i.variable}</span><span className="text-neutral">·</span><span>{i.location}</span><TrendBadge cls={cls(i)} size="sm" /><DataBadge status={i.data_status} compact /></div>
              <div className="mt-1 text-sm"><span className="num font-semibold">{signed(i.slope_per_decade, 3)} {i.unit}/decade</span> <span className="text-xs text-neutral">(95% CI {fmt(i.slope_ci_per_decade[0], 3)} … {fmt(i.slope_ci_per_decade[1], 3)}) · total {signed(i.total_change, 2)} {i.unit}{i.effect_sd_per_decade !== null ? ` · ${fmt(i.effect_sd_per_decade, 2)} SD/decade` : ''}</span></div>
              <div className="mt-0.5 text-xs text-neutral">p = {pFmt(i.p_value)} · FDR q = {pFmt(i.q_value)} · τ = {fmt(i.tau, 2)} · {i.period} · {i.data_source} · completeness {(i.completeness * 100).toFixed(0)}%</div>
            </div>
            <button className="btn-primary whitespace-nowrap !text-xs tracking-wide" onClick={() => investigate(i)} disabled={busy !== null}>{busy === i.variable_id + i.region_id ? <Spinner /> : <Sparkles className="h-4 w-4" />}INVESTIGATE THIS CHANGE</button>
          </Card>))}
        {d && items.length === 0 && <Card className="text-center text-sm text-neutral">No results match this filter.</Card>}
      </div>
      {d && d.unusual.length > 0 && (
        <div className="mt-8"><h2 className="font-display text-lg font-semibold">Unusual recent readings</h2><p className="mb-3 text-xs text-neutral">Anomalies relative to each series' seasonal norm. These are not trends and are listed separately on purpose.</p>
          <div className="grid gap-3 md:grid-cols-2">{d.unusual.map((u) => <Card key={u.variable_id + u.region_id}><div className="font-medium">{u.variable} · {u.location}</div><div className="mt-1 text-sm">{u.reading}</div><div className="mt-1 text-xs text-neutral">robust z = {fmt(u.recent_anomaly_z, 1)} · {u.note}</div></Card>)}</div></div>)}
    </div>
  )
}
