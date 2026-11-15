import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TimeSeriesChart } from '../charts/Charts'
import { Card, DataBadge, DemoBanner, EmptyState, PageHeader, Spinner, TrendBadge } from '../components/ui'
import TrendMap from '../maps/TrendMap'
import { api, type AssistantAnswer } from '../services/api'
import { downloadBlob, fmt, pct, pFmt, signed } from '../services/format'
import { useStore } from '../services/store'

export default function Reports() {
  const { analysis: a, outline, regions, toast } = useStore()
  const nav = useNavigate()
  const [ex, setEx] = useState<AssistantAnswer | null>(null)
  const [busy, setBusy] = useState<'pdf' | 'csv' | null>(null)
  useEffect(() => {
    if (!a) return
    let live = true
    setEx(null)
    api.assistant('Explain the trend in this region.', a.id).then((r) => live && setEx(r)).catch(() => {})
    return () => { live = false }
  }, [a])

  if (!a) return (<div><PageHeader title="Reports" subtitle="Professional, reproducible reports built from computed results." />
    <EmptyState title="Nothing to report yet" text="Run an analysis first — reports contain only results that were actually computed." action={<button className="btn-primary" onClick={() => nav('/data')}>Open Data Explorer</button>} /></div>)

  const download = async (kind: 'pdf' | 'csv') => {
    setBusy(kind)
    try {
      const res = await fetch(`/api/report/${a.id}.${kind}`)
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.detail ?? res.statusText)
      downloadBlob(await res.blob(), `geoflex_${a.variable.id}_${a.region_id}.${kind}`)
      toast('success', `${kind.toUpperCase()} downloaded`)
    } catch (e) { toast('error', `Export failed: ${e instanceof Error ? e.message : e}`) } finally { setBusy(null) }
  }
  const s = a.stats
  const region = regions.find((r) => r.id === a.region_id)
  return (
    <div>
      <PageHeader title="Reports" subtitle="Preview of the scientific report. PDF and CSV exports are generated server-side from the same computed results."
        actions={<><button className="btn-primary" onClick={() => download('pdf')} disabled={busy !== null}>{busy === 'pdf' ? <Spinner /> : <FileText className="h-4 w-4" />}Export PDF</button>
          <button className="btn-ghost" onClick={() => download('csv')} disabled={busy !== null}>{busy === 'csv' ? <Spinner /> : <FileSpreadsheet className="h-4 w-4" />}Export CSV</button></>} />
      <DemoBanner status={a.provenance.status} warnings={a.provenance.warnings} />
      <Card className="mx-auto max-w-5xl space-y-8 !p-6 sm:!p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div><div className="font-display text-sm font-semibold tracking-widest text-cyan">GEO-FLEX · EARTH INTELLIGENCE PLATFORM</div>
            <h2 className="mt-2 font-display text-3xl font-semibold">{a.variable.name} — {a.region}</h2><p className="mt-1 text-sm text-neutral">Environmental change analysis · {a.period.start} to {a.period.end} · generated {new Date().toLocaleDateString('en-GB')}</p></div>
          <div className="flex flex-col items-end gap-2"><DataBadge status={a.provenance.status} /><TrendBadge cls={a.classification.key} /></div>
        </header>
        <section><h3 className="label mb-2">1 · Scope & data</h3>
          <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex justify-between"><dt className="text-neutral">Variable</dt><dd>{a.variable.name} ({a.variable.unit})</dd></div>
            <div className="flex justify-between"><dt className="text-neutral">Region</dt><dd>{a.region}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral">Period / resolution</dt><dd>{a.period.start} → {a.period.end} · {a.resolution}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral">Dataset</dt><dd className="text-right">{a.provenance.source_name}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral">Completeness</dt><dd>{pct(a.data.completeness, 1)} ({a.data.n_valid}/{a.data.n_expected})</dd></div>
            <div className="flex justify-between"><dt className="text-neutral">Significance level</dt><dd>α = {a.alpha}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-neutral">Attribution: {a.provenance.attribution}</p></section>
        <section><h3 className="label mb-2">2 · Time series</h3><TimeSeriesChart a={a} /></section>
        {a.grid && region && <section><h3 className="label mb-2">3 · Geographical pattern</h3><TrendMap grid={a.grid} outline={outline} bounds={region.bounds} unit={a.grid.unit} height={360} variableName={a.variable.name} /><p className="mt-2 text-xs text-neutral">{a.grid.note}</p></section>}
        <section><h3 className="label mb-2">4 · Statistical analysis</h3>
          {s ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="label text-left"><tr><th className="py-2">Method</th><th>Result</th><th>p-value</th></tr></thead><tbody className="[&_td]:border-t [&_td]:border-line [&_td]:py-2">
            <tr><td>Linear regression (OLS)</td><td>{signed(s.regression.slope_per_decade, 3)} {a.variable.unit}/dec · R² {fmt(s.regression.r_squared, 3)} · intercept {fmt(s.regression.intercept, 2)}</td><td>{pFmt(s.regression.p_value)} (HAC {pFmt(s.regression.p_value_hac)})</td></tr>
            <tr><td>Mann-Kendall</td><td>S = {fmt(s.mann_kendall.S, 0)} · z = {fmt(s.mann_kendall.z, 2)} · τ = {fmt(s.mann_kendall.tau, 3)} · {s.mann_kendall.trend}</td><td>{pFmt(s.mann_kendall.p_value)}</td></tr>
            <tr><td>Sen's slope</td><td>{signed(s.sen.slope_per_decade, 3)} {a.variable.unit}/dec · CI {fmt(s.sen.ci_per_decade[0], 3)} … {fmt(s.sen.ci_per_decade[1], 3)}</td><td>—</td></tr>
            <tr><td>Total change</td><td>{signed(s.change.total, 2)} {a.variable.unit} over {fmt(s.span_years, 1)} yr (CI {fmt(s.change.total_ci[0], 2)} … {fmt(s.change.total_ci[1], 2)})</td><td>—</td></tr></tbody></table></div>
            : <p className="text-sm text-neutral">Insufficient data. {a.insufficient_reason}</p>}</section>
        <section><h3 className="label mb-2">5 · Interpretation</h3>
          {ex ? <div className="space-y-2 text-sm"><p className="font-semibold">{ex.short_answer}</p><ul className="list-disc space-y-1 pl-5 text-ink/90">{[...ex.key_evidence, ...ex.statistical_context].map((x, i) => <li key={i}>{x}</li>)}</ul></div> : <Spinner />}</section>
        <section><h3 className="label mb-2">6 · Data limitations</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">{(ex?.limitations ?? []).map((x, i) => <li key={i}>{x}</li>)}<li>{a.provenance.spatial_note}</li>{a.provenance.warnings.map((w) => <li key={w}>{w}</li>)}</ul></section>
        <section><h3 className="label mb-2">7 · Conclusion</h3>
          <p className="text-sm">{s ? `For ${a.region}, ${a.variable.name.toLowerCase()} shows a ${a.classification.label.toLowerCase()} over ${a.period.start}–${a.period.end}, at ${signed(s.sen.slope_per_decade, 3)} ${a.variable.unit} per decade (Mann-Kendall p ${pFmt(s.mann_kendall.p_value)}).` : 'No conclusion can be drawn: the data are insufficient.'} This describes the observed dataset and does not establish cause.{a.provenance.status.startsWith('DEMO') ? ' The data used are synthetic demonstration data, not NASA observations.' : ''}</p></section>
        <footer className="flex items-center gap-2 border-t border-line pt-4 text-xs text-neutral"><Download className="h-3.5 w-3.5" />Chart PNGs: use the download icon on each chart. Methodology: Mann-Kendall (autocorrelation-corrected), Sen's slope, OLS, STL, robust-z + isolation-forest anomalies.</footer>
      </Card>
    </div>
  )
}
