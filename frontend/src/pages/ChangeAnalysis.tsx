import { ChevronDown, FileText, Globe2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DecompositionChart, DistributionChart, PeriodComparison, SeasonalChart, TimeSeriesChart, TrendComparisonChart } from '../charts/Charts'
import { Metric } from '../components/shared'
import { Card, DataBadge, DemoBanner, EmptyState, InfoTip, PageHeader, TrendBadge } from '../components/ui'
import { classMeta, fmt, pct, pFmt, signed } from '../services/format'
import { useStore } from '../services/store'

export default function ChangeAnalysis() {
  const { analysis: a, run, runError, config } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  if (!a) return (
    <div><PageHeader title="Change Analysis" subtitle="What is changing, where, how, by how much — and is it significant?" />
      <EmptyState title="No analysis yet" text={runError ?? 'Run an analysis from the Data Explorer, or start with the Morocco surface-temperature example.'}
        action={<div className="flex gap-3"><button className="btn-primary" onClick={() => nav('/data')}>Open Data Explorer</button><button className="btn-ghost" onClick={() => run({ variable: 'surface_temperature', region: 'morocco' })}>Run Morocco example</button></div>} /></div>)
  const s = a.stats
  const m = classMeta[a.classification.key]
  const u = a.variable.unit
  return (
    <div>
      <PageHeader title={a.variable.name} subtitle={`${a.region} · ${a.period.start} → ${a.period.end} · ${a.resolution} · α = ${a.alpha}`}
        actions={<><DataBadge status={a.provenance.status} /><button className="btn-ghost" onClick={() => nav('/explore')}><Globe2 className="h-4 w-4" />Map</button><button className="btn-primary" onClick={() => nav('/reports')}><FileText className="h-4 w-4" />Generate report</button></>} />
      <DemoBanner status={a.provenance.status} warnings={a.provenance.warnings} />

      <Card className="mb-5 flex flex-wrap items-center justify-between gap-4" >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl" style={{ background: `${m.color}1f`, color: m.color }}>{m.arrow}</div>
          <div><div className="label">Verdict</div><div className="font-display text-2xl font-semibold" style={{ color: m.color }}>{a.classification.label}</div>
            {a.insufficient_reason && <div className="text-xs text-neutral">{a.insufficient_reason}</div>}</div>
        </div>
        <TrendBadge cls={a.classification.key} />
      </Card>

      {s ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Rate of change" accent={m.color} value={<>{signed(s.sen.slope_per_decade, 3)}<span className="ml-1 text-xs font-normal text-neutral">{u}/decade</span></>}
            sub={`Sen's slope · 95% CI ${fmt(s.sen.ci_per_decade[0], 3)} … ${fmt(s.sen.ci_per_decade[1], 3)}`} hint="Sen's slope is the median of all pairwise slopes — robust to outliers." />
          <Metric label="Estimated change" value={<>{signed(s.change.total, 2)}<span className="ml-1 text-xs font-normal text-neutral">{u}</span></>}
            sub={`over ${fmt(s.span_years, 1)} years${s.change.relative_pct !== null ? ` (${signed(s.change.relative_pct, 1)}%)` : ''}`} />
          <Metric label="Mann-Kendall p-value" value={pFmt(s.mann_kendall.p_value)} sub={`τ = ${fmt(s.mann_kendall.tau, 3)} · z = ${fmt(s.mann_kendall.z, 2)} · ${s.mann_kendall.significant ? 'below' : 'not below'} α`}
            hint="Probability of seeing a trend at least this strong if there were truly no trend. Adjusted for autocorrelation." />
          <Metric label="Data completeness" value={pct(a.data.completeness, 1)} sub={`${a.data.n_valid} of ${a.data.n_expected} observations`} />
        </div>
      ) : <Card className="text-sm text-neutral">Not enough valid observations for trend statistics. {a.insufficient_reason}</Card>}

      {s && (
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2" >
            <h3 className="font-display text-base font-semibold">What the numbers mean</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/90">
              <li><b>Direction:</b> {s.mann_kendall.trend}; the trend is {s.mann_kendall.significant ? '' : 'not '}statistically significant at α = {a.alpha}{a.stats?.methods_agree ? ' and the three methods agree.' : '; methods do not fully agree, so treat the result cautiously.'}</li>
              <li><b>p-value in plain language:</b> if the series had no real trend, a pattern this strong would appear {s.mann_kendall.p_value < 0.001 ? 'less than 0.1%' : `about ${(s.mann_kendall.p_value * 100).toFixed(s.mann_kendall.p_value < 0.01 ? 2 : 1)}%`} of the time. Small values mean chance is an unlikely explanation.</li>
              <li><b>Regression:</b> slope {signed(s.regression.slope_per_decade, 3)} {u}/decade, R² = {fmt(s.regression.r_squared, 3)}, p = {pFmt(s.regression.p_value)} (autocorrelation-robust p = {pFmt(s.regression.p_value_hac)}).</li>
              {s.acceleration && <li><b>Acceleration:</b> {s.acceleration.label} (p = {pFmt(s.acceleration.p_value)}).</li>}
              {a.anomalies && <li><b>Anomalies:</b> {a.anomalies.count} unusual observation(s) flagged — {a.anomalies.criterion}. These are single events, not trends.</li>}
            </ul>
            <p className="mt-3 text-xs text-neutral">This describes the observed dataset; it does not by itself establish the cause of the change.</p>
          </Card>
          <Card><div className="label mb-2">Provenance</div>
            <div className="text-sm">{a.provenance.source_name}</div><div className="mt-1 text-xs text-neutral">{a.provenance.attribution}</div>
            <div className="mt-2 text-xs text-neutral">{a.provenance.spatial_note}</div>
            {a.provenance.warnings.map((w) => <div key={w} className="mt-2 text-xs text-[#F5B84B]">{w}</div>)}</Card>
        </div>
      )}

      <div className="mt-5 space-y-5">
        <TimeSeriesChart a={a} compare={a.comparison?.analysis} />
        {a.comparison && (
          <Card>
            <h3 className="font-display text-base font-semibold">Comparison: {a.region} vs {a.comparison.analysis.region}</h3>
            {a.comparison.slope_test ? (<p className="mt-2 text-sm">Difference in trend: <b>{signed(a.comparison.slope_test.difference_per_decade, 3)} {u}/decade</b> (z = {fmt(a.comparison.slope_test.z, 2)}, p = {pFmt(a.comparison.slope_test.p_value)}) — {a.comparison.slope_test.significant ? 'the regions trend differently.' : 'no significant difference in trend.'}
              <span className="mt-1 block text-xs text-neutral">{a.comparison.slope_test.caution}</span></p>) : <p className="mt-2 text-sm text-neutral">A slope-difference test was not possible.</p>}
            <div className="mt-2 flex gap-3 text-xs"><span>{a.region}: <TrendBadge cls={a.classification.key} size="sm" /></span><span>{a.comparison.analysis.region}: <TrendBadge cls={a.comparison.analysis.classification.key} size="sm" /></span></div>
          </Card>)}
        <TrendComparisonChart a={a} dataset={config.dataset} />
        <SeasonalChart a={a} />
        <div className="grid gap-5 xl:grid-cols-2"><DistributionChart a={a} /><PeriodComparison a={a} /></div>
        <DecompositionChart a={a} />
      </div>

      <Card className="mt-5" pad={false}>
        <button className="flex w-full items-center justify-between p-5 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="font-display text-base font-semibold">Methodology</span><ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} /></button>
        {open && <div className="space-y-3 px-5 pb-5 text-sm">{a.methodology.map((mm) => <div key={mm.name}><b>{mm.name}</b><p className="text-neutral">{mm.detail}</p></div>)}
          <p className="text-xs text-neutral">Each statistic shown is traceable to a calculation in <code>backend/app/statistics</code>. <InfoTip text="Mann-Kendall p-values use a variance correction for autocorrelation; multiple-comparison correction (Benjamini–Hochberg) is applied across grid cells, months and discovery screens." /></p></div>}
      </Card>
    </div>
  )
}
