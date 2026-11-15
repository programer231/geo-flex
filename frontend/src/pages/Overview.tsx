import { ArrowRight, Compass, Play, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkline } from '../components/shared'
import { Card, DataBadge, DemoBanner, Skeleton, Stat, TrendBadge } from '../components/ui'
import GlobeScene, { type GlobeMarker } from '../maps/GlobeScene'
import TrendMap from '../maps/TrendMap'
import { api, type Discovery, type DiscoveryItem, type Overview as OV } from '../services/api'
import { classMeta, COLORS, fmt, pFmt, signed } from '../services/format'
import { useStore } from '../services/store'

const clsOf = (i: DiscoveryItem) => (i.significant ? (i.slope_per_decade > 0 ? 'significant_increasing' : 'significant_decreasing') : 'not_significant') as keyof typeof classMeta

export default function Overview() {
  const { config, regions, outline, run, setConfig } = useStore()
  const nav = useNavigate()
  const [ov, setOv] = useState<OV | null>(null)
  const [disc, setDisc] = useState<Discovery | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [sel, setSel] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    setOv(null); setErr(null)
    api.overview(config.dataset).then((o) => {
      if (!live) return
      setOv(o)
      api.discover({ start: o.period.start, end: o.period.end, resolution: 'monthly', alpha: 0.05, dataset: config.dataset }).then((d) => live && setDisc(d)).catch(() => {})
    }).catch((e) => live && setErr(e.message))
    return () => { live = false }
  }, [config.dataset])

  const markers = useMemo<GlobeMarker[]>(() => {
    const items = disc?.items.filter((i) => i.variable_id === 'surface_temperature') ?? []
    return regions.filter((r) => r.id !== 'morocco').map((r) => {
      const it = items.find((i) => i.region_id === r.id)
      return { id: r.id, lat: r.center[0], lon: r.center[1], color: it ? (it.significant ? (it.slope_per_decade > 0 ? COLORS.up : COLORS.down) : COLORS.ns) : COLORS.cyan,
        label: r.name, detail: it ? `Surface temperature: ${signed(it.slope_per_decade, 2)} ${it.unit}/decade · ${classMeta[clsOf(it)].label}` : r.description }
    })
  }, [regions, disc])

  const morocco = regions.find((r) => r.id === 'morocco')
  const selItems = disc?.items.filter((i) => i.region_id === sel) ?? []
  const investigate = async (i: DiscoveryItem) => { setConfig({ variable: i.variable_id, region: i.region_id }); const r = await run({ variable: i.variable_id, region: i.region_id }); if (r) nav('/analysis') }
  return (
    <div className="space-y-6">
      <section className="mission-hero">
        <div className="mission-overlay" aria-hidden="true" />
        <div className="mission-grid">
          <div className="hero-copy-wrap">
            <div className="mission-eyebrow">EARTH OBSERVATION &amp; CLIMATE INTELLIGENCE</div>
            <h1 className="mission-title">OUR PLANET.<br />OUR DATA.<br />OUR FUTURE.</h1>
            <p className="mission-copy">Explore the changing dynamics of our planet through satellite observations, environmental data, and scientific intelligence.</p>
            <div className="mission-actions">
              <button className="btn-primary" onClick={() => nav('/explore')}><Play className="h-4 w-4" />EXPLORE EARTH</button>
              <button className="btn-ghost" onClick={() => nav('/discover')}><Compass className="h-4 w-4" />DISCOVER GEO-FLEX</button>
            </div>
            <div className="hero-meta-row">
              <span>EARTH INTELLIGENCE PLATFORM</span>
              <span>SATELLITE-BASED OBSERVATIONS</span>
              <span>TEMPORAL ENVIRONMENTAL ANALYSIS</span>
            </div>
          </div>
        </div>
      </section>

      {ov && <DemoBanner status={ov.discovery.data_status} warnings={ov.discovery.warnings} />}
      {err && <Card className="mb-5 text-sm text-neg">Could not load the overview: {err}</Card>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ov ? (<>
          <Stat label="Variables analysed" value={ov.metrics.variables_analysed} sub="with a working connector" />
          <Stat label="Regions monitored" value={ov.metrics.regions_monitored} sub="Morocco + sub-regions" />
          <Stat label="Significant trends" value={ov.metrics.significant_trends} sub={`of ${ov.metrics.tests} tests (FDR-adjusted)`} hint="Counts only trends that stay significant after correcting for running many tests at once (Benjamini–Hochberg)." />
          <Stat label="Analysis period" value={`${ov.period.start.slice(0, 4)}–${ov.period.end.slice(0, 4)}`} sub={`monthly · ${ov.period.start} → ${ov.period.end}`} />
        </>) : [0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-[118px]" />)}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-2" pad={false}>
          <div className="flex items-center justify-between px-5 pt-5"><div><h3 className="font-display text-base font-semibold">Earth</h3><p className="text-xs text-neutral">Drag to rotate · click a region marker. Colour = surface-temperature trend.</p></div></div>
          <div className="relative h-[420px]">
            <GlobeScene markers={markers} outline={outline} selectedId={sel} onSelect={setSel} focus={morocco ? { lat: morocco.center[0], lon: morocco.center[1] } : undefined} className="h-full w-full" />
          </div>
          {sel && (
            <div className="border-t border-line px-5 py-3 text-sm">
              <b>{regions.find((r) => r.id === sel)?.name}</b>
              <div className="mt-1 space-y-1">{selItems.length === 0 ? <span className="text-xs text-neutral">No screening results for this region.</span> : selItems.slice(0, 4).map((i) => (
                <div key={i.variable_id} className="flex items-center justify-between gap-2 text-xs"><span>{i.variable}</span><TrendBadge cls={clsOf(i)} size="sm" /></div>))}</div>
            </div>
          )}
        </Card>
        <Card className="xl:col-span-3" pad={false}>
          <div className="px-5 pt-5"><h3 className="font-display text-base font-semibold">Where is it changing? — Morocco surface temperature</h3>
            <p className="text-xs text-neutral">Per-cell Mann-Kendall tests on a grid{ov?.grid ? ` (${ov.grid.summary?.spacing_deg}° spacing)` : ''}. Cells are only as precise as the underlying dataset.</p></div>
          <div className="p-4">
            {ov?.grid && morocco ? <TrendMap grid={ov.grid} outline={outline} bounds={morocco.bounds} unit={ov.grid.unit} height={380} variableName="Surface temperature" onCell={() => nav('/explore')} /> : <Skeleton className="h-[380px]" />}
          </div>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold">Environmental change overview <span className="ml-2 text-xs font-normal text-neutral">Morocco · {ov?.period.start}–{ov?.period.end}</span></h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(ov?.cards ?? []).filter((c) => ['surface_temperature', 'precipitation', 'vegetation_index', 'sea_level'].includes(c.variable_id)).map((c) => {
          const it = c.item
          return (
            <Card key={c.variable_id} className={c.enabled ? '' : 'opacity-70'}>
              <div className="flex items-start justify-between gap-2"><div className="font-display text-sm font-semibold">{c.name}</div>
                {c.enabled && it ? <TrendBadge cls={clsOf(it)} size="sm" /> : <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-neutral">Not connected</span>}</div>
              {c.enabled && it ? (<>
                <div className="num mt-2 text-2xl font-semibold">{signed(it.slope_per_decade, 2)} <span className="text-xs font-normal text-neutral">{c.unit}/decade</span></div>
                <Sparkline values={c.sparkline} color={classMeta[clsOf(it)].color} />
                <div className="mt-1 text-[11px] text-neutral">p = {pFmt(it.p_value)} · annual means</div>
              </>) : <p className="mt-3 text-xs text-neutral">{c.reason ?? 'No result.'}<br />Source: {c.source}</p>}
            </Card>
          )
        })}
        {!ov && [0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-36" />)}
      </div>

      <div className="mt-8 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Recent discoveries</h2>
        <button className="text-sm text-cyan hover:underline" onClick={() => nav('/discover')}><Compass className="mr-1 inline h-4 w-4" />Open Discover Earth <ArrowRight className="inline h-3.5 w-3.5" /></button></div>
      <Card className="mt-3 overflow-x-auto" pad={false}>
        <table className="w-full min-w-[860px] text-sm">
          <thead className="label text-left"><tr><th className="px-4 py-3">Variable</th><th>Location</th><th>Period</th><th>Direction</th><th>Magnitude</th><th>Significance</th><th /></tr></thead>
          <tbody>
            {(ov?.recent ?? []).map((i) => (
              <tr key={`${i.variable_id}${i.region_id}`} className="border-t border-line hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium">{i.variable}</td><td>{i.location}</td><td className="text-neutral">{i.period}</td>
                <td><TrendBadge cls={clsOf(i)} size="sm" /></td>
                <td className="num">{signed(i.slope_per_decade, 2)} {i.unit}/dec</td>
                <td className="text-xs text-neutral">q = {pFmt(i.q_value)}<span className="ml-1"><DataBadge status={i.data_status} compact /></span></td>
                <td className="pr-4 text-right"><button className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => investigate(i)}>View analysis</button></td>
              </tr>))}
            {!ov && <tr><td colSpan={7} className="p-4"><Skeleton className="h-24" /></td></tr>}
          </tbody>
        </table>
      </Card>
      {ov?.unusual && ov.unusual.length > 0 && (
        <Card className="mt-5"><div className="label mb-2 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-violet" />Unusual recent readings <span className="normal-case text-neutral/70">(anomalies — not long-term trends)</span></div>
          <ul className="space-y-1.5 text-sm">{ov.unusual.map((u) => <li key={u.variable_id + u.region_id}><b>{u.variable}</b> · {u.location} — {u.reading} <span className="text-xs text-neutral">(robust z = {fmt(u.recent_anomaly_z, 1)})</span></li>)}</ul></Card>)}
    </div>
  )
}
