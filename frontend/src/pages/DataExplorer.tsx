import { Search, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { regionOptions } from '../components/shared'
import { Card, InfoTip, PageHeader, Segmented, Spinner } from '../components/ui'
import { useStore } from '../services/store'

const CATS = ['All', 'Climate', 'Ocean', 'Land', 'Atmosphere', 'Cryosphere']

export default function DataExplorer() {
  const { variables, regions, config, setConfig, run, running, status } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [onlyAvail, setOnlyAvail] = useState(false)
  const filtered = useMemo(() => variables.filter((v) =>
    (cat === 'All' || v.category.toLowerCase() === cat.toLowerCase()) && (!onlyAvail || v.enabled) &&
    `${v.name} ${v.description} ${v.dataset} ${v.data_source}`.toLowerCase().includes(q.toLowerCase())), [variables, q, cat, onlyAvail])
  const selected = variables.find((v) => v.id === config.variable)
  const regional = regions.filter((r) => r.id !== config.region)
  const dateBad = config.start > config.end
  const go = async () => { const r = await run(); if (r) nav('/analysis') }

  return (
    <div>
      <PageHeader title="Data Explorer" subtitle="Pick a variable, a region and a period. Only variables with a working dataset connector can be analysed — the rest are shown honestly as unavailable."
        actions={<button className="btn-ghost" onClick={() => nav('/merra2')}>Open MERRA-2 trend analysis</button>} />
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
              <input className="input !pl-9" placeholder="Search variables, datasets, sources…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search variables" /></div>
            <Segmented value={cat} onChange={setCat} options={CATS.map((c) => ({ value: c, label: c }))} />
            <label className="flex items-center gap-2 text-xs text-neutral"><input type="checkbox" checked={onlyAvail} onChange={(e) => setOnlyAvail(e.target.checked)} />Available only</label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((v) => {
              const active = v.id === config.variable
              return (
                <button key={v.id} disabled={!v.enabled} onClick={() => setConfig({ variable: v.id })} aria-pressed={active}
                  className={`card card-pad text-left transition ${active ? '!border-cyan/70 ring-1 ring-cyan/40' : v.enabled ? 'hover:border-white/25' : 'cursor-not-allowed opacity-55'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div><div className="font-display text-sm font-semibold">{v.name}</div><div className="mt-0.5 text-[11px] uppercase tracking-wider text-neutral">{v.category} · {v.unit}</div></div>
                    {v.enabled ? <span className="rounded-full border border-pos/40 bg-pos/10 px-2 py-0.5 text-[10px] font-semibold text-pos">Available</span>
                      : <span className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-neutral"><Lock className="h-3 w-3" />Not connected</span>}
                  </div>
                  <p className="mt-2 text-xs text-neutral">{v.description}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <dt className="text-neutral">Dataset</dt><dd className="truncate text-right" title={v.dataset}>{v.dataset}</dd>
                    <dt className="text-neutral">Temporal</dt><dd className="text-right">{v.temporal_resolution}</dd>
                    <dt className="text-neutral">Spatial</dt><dd className="text-right">{v.spatial_resolution}</dd>
                    <dt className="text-neutral">Source</dt><dd className="truncate text-right" title={v.data_source}>{v.data_source}</dd>
                  </dl>
                  {!v.enabled && v.unavailable_reason && <p className="mt-2 text-[11px] text-[#F5B84B]">{v.unavailable_reason}</p>}
                </button>)
            })}
            {filtered.length === 0 && <Card className="md:col-span-2 text-center text-sm text-neutral">No variables match your search.</Card>}
          </div>
        </div>

        <Card className="h-fit xl:sticky xl:top-6">
          <h3 className="font-display text-base font-semibold">Analysis configuration</h3>
          <p className="mb-4 text-xs text-neutral">{selected ? <>Selected: <b className="text-ink">{selected.name}</b> ({selected.unit})</> : 'Choose a variable.'}</p>
          <div className="space-y-4 text-sm">
            <div><label className="label mb-1.5 block" htmlFor="region">Geographical area</label>
              <select id="region" className="input" value={config.region} onChange={(e) => setConfig({ region: e.target.value, comparison_region: config.comparison_region === e.target.value ? null : config.comparison_region })}>{regionOptions(regions)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label mb-1.5 block" htmlFor="start">Start</label><input id="start" type="month" min="1981-01" max="2025-12" className="input" value={config.start} onChange={(e) => setConfig({ start: e.target.value })} /></div>
              <div><label className="label mb-1.5 block" htmlFor="end">End</label><input id="end" type="month" min="1981-01" max="2025-12" className="input" value={config.end} onChange={(e) => setConfig({ end: e.target.value })} /></div>
            </div>
            {dateBad && <p className="text-xs text-neg">The start date must be before the end date.</p>}
            <div><div className="label mb-1.5">Temporal resolution</div>
              <Segmented value={config.resolution} onChange={(v) => setConfig({ resolution: v })} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'annual', label: 'Annual' }]} /></div>
            <div><label className="label mb-1.5 block" htmlFor="ds">Dataset</label>
              <select id="ds" className="input" value={config.dataset} onChange={(e) => setConfig({ dataset: e.target.value })}>
                <option value="auto">Automatic (NASA POWER; labelled demo fallback)</option><option value="nasa_power">NASA POWER only</option><option value="demo">Demonstration data</option></select>
              <p className="mt-1 text-[11px] text-neutral">NASA POWER: {status?.nasa_power_reachable === true ? 'reachable' : status?.nasa_power_reachable === false ? 'unreachable from this server — automatic mode will use labelled demo data' : 'checking…'}</p></div>
            <div><label className="label mb-1.5 flex items-center gap-1.5" htmlFor="cmp">Comparison region (optional)<InfoTip text="The same variable can trend differently in different places. A comparison region adds a slope-difference test." /></label>
              <select id="cmp" className="input" value={config.comparison_region ?? ''} onChange={(e) => setConfig({ comparison_region: e.target.value || null })}><option value="">None</option>{regionOptions(regional)}</select></div>
            <div><label className="label mb-1.5 flex items-center gap-1.5" htmlFor="alpha">Significance level α<InfoTip text="Trends are called significant only when p < α. Default 0.05." /></label>
              <input id="alpha" type="number" min={0.001} max={0.2} step={0.005} className="input" value={config.alpha} onChange={(e) => setConfig({ alpha: Math.min(0.2, Math.max(0.001, +e.target.value || 0.05)) })} /></div>
            <label className="flex items-center gap-2 text-xs text-neutral"><input type="checkbox" checked={config.include_grid} onChange={(e) => setConfig({ include_grid: e.target.checked })} />Compute per-cell geographical grid</label>
            <button className="btn-primary w-full !py-3 tracking-wide" onClick={go} disabled={running || !selected?.enabled || dateBad}>{running ? <><Spinner />Analyzing…</> : 'ANALYZE CHANGES'}</button>
          </div>
        </Card>
      </div>
    </div>
  )
}
