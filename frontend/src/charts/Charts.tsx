import { useEffect, useMemo, useState } from 'react'
import type { Data } from 'plotly.js'
import { api, type Analysis, type Discovery } from '../services/api'
import { COLORS, fmt, pFmt, signed } from '../services/format'
import { Card, Skeleton } from '../components/ui'
import { ChartCard } from './Plot'

const slug = (a: Analysis, what: string) => `geoflex_${a.variable.id}_${a.region_id}_${what}`
const nn = (v: (number | null)[] | undefined) => (v ?? []).map((x) => (x === null ? null : x))

/** A — observations, trend, confidence band, anomalies. */
export function TimeSeriesChart({ a, compare }: { a: Analysis; compare?: Analysis | null }) {
  const s = a.series
  const monthly = a.resolution === 'monthly'
  const x = s.labels
  const data: Data[] = []
  if (s.ci_upper && s.ci_lower) {
    data.push({ x, y: nn(s.ci_upper), type: 'scatter', mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false, connectgaps: false })
    data.push({ x, y: nn(s.ci_lower), type: 'scatter', mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(54,214,232,0.16)', name: '95% band (OLS)', hoverinfo: 'skip' })
  }
  data.push({ x, y: nn(s.value), type: 'scatter', mode: 'lines', name: 'Observed', line: { color: 'rgba(148,163,184,0.75)', width: 1 }, connectgaps: false,
    hovertemplate: `%{y:.2f} ${a.variable.unit}` })
  if (monthly && s.adjusted) data.push({ x, y: nn(s.adjusted), type: 'scatter', mode: 'lines', name: 'Seasonally adjusted', line: { color: COLORS.cyan, width: 1.4 }, connectgaps: false })
  if (s.trend_line) data.push({ x, y: s.trend_line, type: 'scatter', mode: 'lines', name: `Sen trend (${signed(a.stats?.sen.slope_per_decade, 3)} ${a.variable.unit}/dec)`, line: { color: COLORS.up, width: 2.5 } })
  if (s.anomaly && s.anomaly.some(Boolean)) {
    const idx = s.anomaly.map((f, i) => (f ? i : -1)).filter((i) => i >= 0)
    data.push({ x: idx.map((i) => x[i]), y: idx.map((i) => s.value[i]), type: 'scatter', mode: 'markers', name: 'Anomaly', marker: { color: '#E879F9', size: 9, line: { color: '#0D1422', width: 1.5 } },
      hovertemplate: '%{x}<br>%{y:.2f} (unusual)' })
  }
  if (compare) {
    data.push({ x: compare.series.labels, y: nn(compare.series.adjusted ?? compare.series.value), type: 'scatter', mode: 'lines', name: `${compare.region} (adjusted)`, line: { color: COLORS.violet, width: 1.3, dash: 'dot' } })
  }
  return (
    <ChartCard title="Time series" filename={slug(a, 'timeseries')} height={380}
      subtitle={`${a.variable.name} · ${a.region} · ${a.resolution}. Orange line: Sen's slope; shaded band: 95% OLS confidence interval of the fitted mean.`}
      layout={{ yaxis: { title: { text: a.variable.unit }, gridcolor: COLORS.grid }, xaxis: { gridcolor: COLORS.grid, rangeslider: { visible: false }, type: 'date' } }}
      data={data} />
  )
}

/** B — compares regions by slope with 95% CI, using screening results actually computed. */
export function TrendComparisonChart({ a, dataset }: { a: Analysis; dataset: string }) {
  const [d, setD] = useState<Discovery | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    setD(null); setErr(null)
    api.discover({ start: a.period.start, end: a.period.end, resolution: a.resolution, alpha: a.alpha, dataset }).then((r) => live && setD(r)).catch((e) => live && setErr(e.message))
    return () => { live = false }
  }, [a.period.start, a.period.end, a.resolution, a.alpha, dataset])
  if (err) return <Card className="text-sm text-neg">Could not load the regional comparison: {err}</Card>
  if (!d) return <Card><Skeleton className="h-[300px]" /></Card>
  const items = d.items.filter((i) => i.variable_id === a.variable.id).sort((p, q) => p.slope_per_decade - q.slope_per_decade)
  if (items.length === 0) return <Card className="text-sm text-neutral">No regional results are available for this variable.</Card>
  const colour = (i: typeof items[number]) => (i.significant ? (i.slope_per_decade > 0 ? COLORS.up : COLORS.down) : COLORS.ns)
  return (
    <ChartCard title="Trend comparison across regions" filename={slug(a, 'regions')} height={Math.max(300, items.length * 38 + 80)}
      subtitle="Same variable, same period. Orange = significant increase, blue = significant decrease, grey = not significant (FDR-adjusted across all screened tests)."
      data={[{ type: 'bar', orientation: 'h', y: items.map((i) => i.location), x: items.map((i) => i.slope_per_decade),
        marker: { color: items.map(colour) }, error_x: { type: 'data', symmetric: false, array: items.map((i) => i.slope_ci_per_decade[1] - i.slope_per_decade), arrayminus: items.map((i) => i.slope_per_decade - i.slope_ci_per_decade[0]), color: '#C7D2E1', thickness: 1.2, width: 4 },
        customdata: items.map((i) => [i.direction, pFmt(i.q_value)]), hovertemplate: '%{y}<br>%{x:.3f} per decade<br>%{customdata[0]} · q = %{customdata[1]}<extra></extra>' }]}
      layout={{ hovermode: 'closest', margin: { l: 190, r: 20, t: 8, b: 44 }, xaxis: { title: { text: `${a.variable.unit} per decade (Sen's slope, 95% CI)` }, gridcolor: COLORS.grid, zerolinecolor: 'rgba(245,247,250,0.4)' }, yaxis: { automargin: true } }}
      footer={d.data_status.startsWith('DEMO') ? 'DEMONSTRATION DATA — synthetic.' : undefined} />
  )
}

/** C — seasonal cycle and per-month trends. */
export function SeasonalChart({ a }: { a: Analysis }) {
  const s = a.seasonal
  if (!s) return <Card className="text-sm text-neutral">Seasonal analysis needs monthly resolution and at least three years of data.</Card>
  const names = s.monthly_climatology.map((m) => m.name)
  const mean = s.monthly_climatology.map((m) => m.mean)
  const sd = s.monthly_climatology.map((m) => m.std ?? 0)
  const trends = s.monthly_trends
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Seasonal cycle" filename={slug(a, 'seasonal')} height={300}
        subtitle={`Peak ${s.peak_month}, trough ${s.trough_month}; amplitude ${fmt(s.amplitude)} ${a.variable.unit}. Seasonal strength ${fmt(s.seasonal_strength)} (0–1).`}
        data={[
          { x: names, y: mean.map((m, i) => (m ?? 0) + sd[i]), type: 'scatter', mode: 'lines', line: { width: 0 }, hoverinfo: 'skip', showlegend: false },
          { x: names, y: mean.map((m, i) => (m ?? 0) - sd[i]), type: 'scatter', mode: 'lines', line: { width: 0 }, fill: 'tonexty', fillcolor: 'rgba(124,131,255,0.18)', name: '±1 SD (year to year)', hoverinfo: 'skip' },
          { x: names, y: mean, type: 'scatter', mode: 'lines+markers', name: 'Mean', line: { color: COLORS.violet, width: 2.4 }, marker: { size: 6 }, hovertemplate: `%{y:.2f} ${a.variable.unit}` },
        ]}
        layout={{ yaxis: { title: { text: a.variable.unit }, gridcolor: COLORS.grid } }} />
      <ChartCard title="When in the year is it changing?" filename={slug(a, 'monthly_trends')} height={300}
        subtitle="Sen's slope per calendar month. Solid = significant after Benjamini-Hochberg correction across the 12 months."
        data={[{ type: 'bar', x: trends.map((t) => t.name), y: trends.map((t) => t.slope_per_decade),
          marker: { color: trends.map((t) => (t.significant ? ((t.slope_per_decade ?? 0) > 0 ? COLORS.up : COLORS.down) : 'rgba(123,139,163,0.45)')) },
          customdata: trends.map((t) => [pFmt(t.p_adjusted), t.n]), hovertemplate: '%{x}<br>%{y:.3f} per decade<br>adjusted p = %{customdata[0]} (n=%{customdata[1]})<extra></extra>' }]}
        layout={{ hovermode: 'closest', yaxis: { title: { text: `${a.variable.unit} / decade` }, gridcolor: COLORS.grid, zerolinecolor: 'rgba(245,247,250,0.4)' } }} />
    </div>
  )
}

/** D — distribution of values. */
export function DistributionChart({ a }: { a: Analysis }) {
  const vals = useMemo(() => a.series.value.filter((v): v is number => v !== null), [a])
  const adj = useMemo(() => (a.series.adjusted ?? []).filter((v): v is number => v !== null), [a])
  return (
    <ChartCard title="Distribution of values" filename={slug(a, 'distribution')} height={300}
      subtitle={`${vals.length} observations. Raw values are bimodal when the seasonal cycle is strong; the adjusted series shows variability around the seasonal norm.`}
      data={[
        { x: vals, type: 'histogram', name: 'Observed', marker: { color: 'rgba(148,163,184,0.55)' }, nbinsx: 32, hovertemplate: '%{x}<br>%{y} obs<extra></extra>' },
        ...(a.resolution === 'monthly' && adj.length ? [{ x: adj, type: 'histogram', name: 'Seasonally adjusted', marker: { color: 'rgba(54,214,232,0.55)' }, nbinsx: 32, hovertemplate: '%{x}<br>%{y} obs<extra></extra>' } as Data] : []),
      ]}
      layout={{ barmode: 'overlay', hovermode: 'closest', xaxis: { title: { text: a.variable.unit }, gridcolor: COLORS.grid }, yaxis: { title: { text: 'count' }, gridcolor: COLORS.grid } }} />
  )
}

/** E — two periods. */
export function PeriodComparison({ a }: { a: Analysis }) {
  const c = a.period_comparison
  const adj = a.series.adjusted ?? a.series.value
  const t = a.series.t
  if (!c) return <Card className="text-sm text-neutral">Not enough data in each period for a comparison.</Card>
  const before: number[] = [], after: number[] = []
  adj.forEach((v, i) => { if (v === null) return; (t[i] < c.split_year ? before : after).push(v) })
  const first = a.period.start.slice(0, 4), last = a.period.end.slice(0, 4)
  return (
    <ChartCard title="Historical comparison" filename={slug(a, 'periods')} height={300}
      subtitle={`${first}–${c.split_year - 1} vs ${c.split_year}–${last}, seasonally adjusted. Difference ${signed(c.difference, 3)} ${a.variable.unit} (95% CI ${fmt(c.difference_ci[0])} to ${fmt(c.difference_ci[1])}); Mann-Whitney p ${pFmt(c.p_mann_whitney)}.`}
      data={[
        { x: before, type: 'histogram', name: `${first}–${c.split_year - 1}`, opacity: 0.65, marker: { color: COLORS.down }, nbinsx: 28, histnorm: 'probability density' },
        { x: after, type: 'histogram', name: `${c.split_year}–${last}`, opacity: 0.65, marker: { color: COLORS.up }, nbinsx: 28, histnorm: 'probability density' },
      ]}
      layout={{ barmode: 'overlay', hovermode: 'closest', xaxis: { title: { text: a.variable.unit }, gridcolor: COLORS.grid }, yaxis: { title: { text: 'density' }, gridcolor: COLORS.grid },
        shapes: [{ type: 'line', x0: c.mean_before, x1: c.mean_before, yref: 'paper', y0: 0, y1: 1, line: { color: COLORS.down, dash: 'dash', width: 2 } }, { type: 'line', x0: c.mean_after, x1: c.mean_after, yref: 'paper', y0: 0, y1: 1, line: { color: COLORS.up, dash: 'dash', width: 2 } }] }}
      footer={c.note} />
  )
}

/** STL components (monthly only). */
export function DecompositionChart({ a }: { a: Analysis }) {
  const s = a.series
  if (!s.stl_trend || !s.stl_seasonal || !s.stl_resid) return null
  const x = s.labels
  return (
    <ChartCard title="STL decomposition" filename={slug(a, 'stl')} height={420}
      subtitle="The record split into slow trend, repeating seasonal cycle and residual. Anomalies are flagged on the residual only."
      data={[
        { x, y: s.stl_trend, type: 'scatter', mode: 'lines', name: 'Trend', line: { color: COLORS.up, width: 2 }, xaxis: 'x', yaxis: 'y' },
        { x, y: s.stl_seasonal, type: 'scatter', mode: 'lines', name: 'Seasonal', line: { color: COLORS.violet, width: 1.2 }, xaxis: 'x2', yaxis: 'y2' },
        { x, y: s.stl_resid, type: 'scatter', mode: 'lines', name: 'Residual', line: { color: COLORS.cyan, width: 1 }, xaxis: 'x3', yaxis: 'y3' },
      ]}
      layout={{ grid: { rows: 3, columns: 1, pattern: 'independent', roworder: 'top to bottom' }, showlegend: false, margin: { l: 56, r: 18, t: 10, b: 30 },
        xaxis: { type: 'date', gridcolor: COLORS.grid }, xaxis2: { type: 'date', gridcolor: COLORS.grid }, xaxis3: { type: 'date', gridcolor: COLORS.grid },
        yaxis: { title: { text: 'trend' }, gridcolor: COLORS.grid }, yaxis2: { title: { text: 'seasonal' }, gridcolor: COLORS.grid }, yaxis3: { title: { text: 'residual' }, gridcolor: COLORS.grid } }} />
  )
}
