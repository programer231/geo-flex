import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { Data } from 'plotly.js'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, PageHeader, Spinner } from '../components/ui'
import { ChartCard } from '../charts/Plot'
import Merra2Map from '../maps/Merra2Map'
import { fmt, pFmt, signed } from '../services/format'
import { merraApi, type MerraAnalyzeParams, type MerraFeatureCollection, type MerraMetadata, type OptionalTest } from '../services/merraApi'
import { useStore } from '../services/store'

interface AnalysisForm {
  variable: string
  west: string
  south: string
  east: string
  north: string
  start_date: string
  end_date: string
  alpha: string
}

function initialForm(metadata: MerraMetadata): AnalysisForm {
  const [west, south, east, north] = metadata.spatial_bounds
  const centerLon = (west + east) / 2
  const centerLat = (south + north) / 2
  const width = Math.min(1.25, east - west)
  const height = Math.min(1, north - south)
  const variable = metadata.variables.find((item) => item.name === 'TS') ?? metadata.variables[0]
  const number = (value: number) => Number(value.toFixed(4)).toString()
  return {
    variable: variable?.name ?? '',
    west: number(Math.max(west, centerLon - width / 2)),
    south: number(Math.max(south, centerLat - height / 2)),
    east: number(Math.min(east, centerLon + width / 2)),
    north: number(Math.min(north, centerLat + height / 2)),
    start_date: metadata.time_range[0],
    end_date: metadata.time_range[1],
    alpha: '0.05',
  }
}

function fieldNumber(value: string, label: string) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`${label} must be a finite number.`)
  return number
}

function flag(value: boolean | null | undefined) {
  if (value === null || value === undefined) return 'Unavailable'
  return value ? 'Yes' : 'No'
}

function AvailableTest({ test, children }: { test: OptionalTest; children: ReactNode }) {
  if (!test.available) return <p className="mt-2 text-sm text-neutral">Unavailable: {test.reason}</p>
  return <div className="mt-2 text-sm">{children}</div>
}

function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="min-w-0">
      <div className="label">{title}</div>
      <div className="mt-2 text-sm text-ink">{children}</div>
    </Card>
  )
}

export default function Merra2Analysis() {
  const { toast } = useStore()
  const [metadata, setMetadata] = useState<MerraMetadata | null>(null)
  const [form, setForm] = useState<AnalysisForm | null>(null)
  const [loadingMetadata, setLoadingMetadata] = useState(true)
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [result, setResult] = useState<MerraFeatureCollection | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const unit = result?.metadata.units ?? metadata?.variables.find((variable) => variable.name === form?.variable)?.units ?? ''
  const summary = result?.metadata.regional_summary

  useEffect(() => {
    let active = true
    merraApi.metadata()
      .then((response) => {
        if (!active) return
        setMetadata(response)
        setForm(initialForm(response))
        setMetadataError(null)
      })
      .catch((error: unknown) => {
        if (active) setMetadataError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => { if (active) setLoadingMetadata(false) })
    return () => { active = false }
  }, [])

  const chartData = useMemo(() => {
    if (!result) return null
    const series = result.metadata.regional_timeseries
    const x = series.timestamps
    const aligned = (values: (number | null)[]) => x.map((_, index) => values[index] ?? null)
    const raw: Data[] = [
      { x, y: aligned(series.raw_median), type: 'scatter', mode: 'lines', name: 'Raw spatial median',
        line: { color: 'rgba(148,163,184,0.85)', width: 1.2 }, connectgaps: false },
      { x, y: aligned(series.deseasonalized), type: 'scatter', mode: 'lines', name: 'Deseasonalized',
        line: { color: '#36D6E8', width: 1.6 }, connectgaps: false },
    ]
    if (series.trend.some((value) => value !== null)) {
      raw.push({ x, y: aligned(series.trend), type: 'scatter', mode: 'lines', name: 'STL trend',
        line: { color: '#FF9F5A', width: 2.4 }, connectgaps: false })
    }
    const seasonal: Data[] = [{
      x,
      y: aligned(series.seasonal),
      type: 'scatter',
      mode: 'lines',
      name: 'STL seasonal component',
      line: { color: '#7C83FF', width: 1.8 },
      connectgaps: false,
    }]
    return { x, raw, seasonal, hasSeasonal: series.seasonal.some((value) => value !== null) }
  }, [result])

  const updateForm = (patch: Partial<AnalysisForm>) => setForm((current) => current ? { ...current, ...patch } : current)

  const run = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || !metadata || running) return
    setRequestError(null)
    setResult(null)
    let params: MerraAnalyzeParams
    try {
      params = {
        variable: form.variable,
        west: fieldNumber(form.west, 'West'),
        south: fieldNumber(form.south, 'South'),
        east: fieldNumber(form.east, 'East'),
        north: fieldNumber(form.north, 'North'),
        start_date: form.start_date,
        end_date: form.end_date,
        alpha: fieldNumber(form.alpha, 'Significance threshold'),
      }
      if (params.west < -180 || params.west > 180 || params.east < -180 || params.east > 180
        || params.south < -90 || params.south > 90 || params.north < -90 || params.north > 90) {
        throw new Error('Longitude must be in [-180, 180] and latitude in [-90, 90].')
      }
      if (params.west >= params.east || params.south >= params.north) {
        throw new Error('West must be less than east and south must be less than north.')
      }
      if (params.start_date < metadata.time_range[0] || params.end_date > metadata.time_range[1]) {
        throw new Error(`Dates must stay within the available range ${metadata.time_range[0]} to ${metadata.time_range[1]}.`)
      }
      if (params.start_date > params.end_date) throw new Error('End date must be on or after start date.')
      if (params.alpha <= 0 || params.alpha >= 1) throw new Error('Significance threshold must be strictly between 0 and 1.')
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error))
      return
    }

    setRunning(true)
    try {
      setResult(await merraApi.analyze(params))
      toast('success', 'MERRA-2 trend analysis completed.')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRequestError(message)
      toast('error', message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <PageHeader title="MERRA-2 Trend Analysis"
        subtitle="Analyze real monthly MERRA-2 grid data by variable, bounding box, and inclusive date range."
        actions={<span className="rounded-full border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-xs font-semibold text-cyan">Hugging Face Zarr · lazy remote reads</span>} />

      <Card className="mb-5 flex items-start gap-3 border-cyan/30">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
        <p className="text-sm text-neutral">
          MERRA-2 is a model-based reanalysis, not a direct measurement at every grid cell. Statistical trends describe the selected record;
          they do not establish causes or predict local impacts. Pixel requests are limited to 5,000 cells.
        </p>
      </Card>

      {loadingMetadata && <Card className="mb-5 flex items-center gap-3 text-sm text-neutral"><Spinner />Loading MERRA-2 metadata from the API…</Card>}
      {metadataError && (
        <div role="alert">
          <Card className="mb-5 border-neg/40">
            <div className="font-semibold text-neg">MERRA-2 metadata could not be loaded</div>
            <p className="mt-1 text-sm text-neutral">{metadataError}</p>
            <button type="button" className="btn-ghost mt-3" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" />Retry</button>
          </Card>
        </div>
      )}

      {metadata && form && (
        <>
          <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card>
              <h2 className="font-display text-lg font-semibold">Configure analysis</h2>
              <p className="mb-4 mt-1 text-xs text-neutral">Variable names, units, dates and map bounds are loaded from the backend metadata endpoint.</p>
              <form className="space-y-4" onSubmit={run}>
                <div>
                  <label htmlFor="merra-variable" className="label mb-1.5 block">MERRA-2 variable</label>
                  <select id="merra-variable" className="input" value={form.variable} onChange={(event) => updateForm({ variable: event.target.value })} required>
                    {metadata.variables.map((variable) => <option key={variable.name} value={variable.name}>
                      {variable.name}{variable.long_name ? ` — ${variable.long_name}` : ''}{variable.units ? ` (${variable.units})` : ''}
                    </option>)}
                  </select>
                </div>
                <fieldset>
                  <legend className="label mb-1.5">Bounding box · west, south, east, north</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['west', 'West longitude', -180, 180],
                      ['south', 'South latitude', -90, 90],
                      ['east', 'East longitude', -180, 180],
                      ['north', 'North latitude', -90, 90],
                    ] as const).map(([key, label, min, max]) => (
                      <div key={key}>
                        <label htmlFor={`merra-${key}`} className="sr-only">{label}</label>
                        <input id={`merra-${key}`} className="input" type="number" step="any" min={min} max={max}
                          value={form[key]} onChange={(event) => updateForm({ [key]: event.target.value })} aria-label={label} required />
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-neutral">Dataset bounds: [{metadata.spatial_bounds.join(', ')}] · coordinates follow [west, south, east, north].</p>
                </fieldset>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="merra-start" className="label mb-1.5 block">Start date</label>
                    <input id="merra-start" type="date" className="input" min={metadata.time_range[0]} max={metadata.time_range[1]}
                      value={form.start_date} onChange={(event) => updateForm({ start_date: event.target.value })} required />
                  </div>
                  <div>
                    <label htmlFor="merra-end" className="label mb-1.5 block">End date</label>
                    <input id="merra-end" type="date" className="input" min={metadata.time_range[0]} max={metadata.time_range[1]}
                      value={form.end_date} onChange={(event) => updateForm({ end_date: event.target.value })} required />
                  </div>
                </div>
                <div>
                  <label htmlFor="merra-alpha" className="label mb-1.5 block">Significance threshold α</label>
                  <input id="merra-alpha" type="number" className="input" min="0.001" max="0.999" step="0.005"
                    value={form.alpha} onChange={(event) => updateForm({ alpha: event.target.value })} required />
                </div>
                {requestError && <p className="rounded-xl border border-neg/40 bg-neg/10 px-3 py-2 text-sm text-neg" role="alert">{requestError}</p>}
                <button className="btn-primary w-full !py-3" type="submit" disabled={running || !form.variable}>
                  {running ? <><Spinner />Analyzing real MERRA-2 data…</> : 'RUN MERRA-2 ANALYSIS'}
                </button>
              </form>
            </Card>

            <Card>
              <h2 className="font-display text-lg font-semibold">Dataset metadata</h2>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="text-neutral">Source</dt><dd className="min-w-0 break-all text-ink">{metadata.source}</dd>
                <dt className="text-neutral">Available period</dt><dd className="text-ink">{metadata.time_range[0]} → {metadata.time_range[1]}</dd>
                <dt className="text-neutral">Spatial bounds</dt><dd className="text-ink">{metadata.spatial_bounds.map((value) => fmt(value, 3)).join(', ')}</dd>
                <dt className="text-neutral">Variables</dt><dd className="text-ink">{metadata.variables.length} returned by the dataset</dd>
              </dl>
              <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-neutral">
                The backend opens the Zarr store lazily and loads only the selected time and spatial subset. No synthetic data or local fallback is used by this workflow.
              </p>
            </Card>
          </div>
          {result && summary && chartData && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard title="Primary trend">
                  <b>{summary.hamed_rao_modified_mann_kendall.trend}</b>
                  <div>Modified Mann–Kendall p = {pFmt(summary.hamed_rao_modified_mann_kendall.p_value)}</div>
                  <div>{summary.hamed_rao_modified_mann_kendall.significant ? 'Statistically significant' : 'Not statistically significant'} at α = {result.metadata.alpha}</div>
                </SummaryCard>
                <SummaryCard title="Sen’s slope">
                  <b>{signed(summary.sen_slope.per_decade, 3)} {unit || 'units'}/decade</b>
                  <div>95% CI {fmt(summary.sen_slope.ci_95_per_decade[0], 3)} to {fmt(summary.sen_slope.ci_95_per_decade[1], 3)}</div>
                  <div>{summary.sen_slope.per_month === null ? 'Slope unavailable' : `${fmt(summary.sen_slope.per_month, 5)} ${unit || 'units'}/month`}</div>
                </SummaryCard>
                <SummaryCard title="Spatial coverage">
                  <b>{result.metadata.grid.pixels_analyzed.toLocaleString()} / {result.metadata.grid.pixels_total.toLocaleString()} pixels</b>
                  <div>{result.metadata.grid.pixels_significant.toLocaleString()} significant · {fmt(result.metadata.grid.significant_percent, 1)}%</div>
                  <div>{result.metadata.grid.time_steps} monthly time steps · {unit || 'units unavailable'}</div>
                </SummaryCard>
                <SummaryCard title="Observed rank correlation">
                  <b>Spearman ρ = {fmt(summary.spearman.rho, 3)}</b>
                  <div>p = {pFmt(summary.spearman.p_value)}</div>
                  <div>Correlation is not evidence of causation.</div>
                </SummaryCard>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                <Card className="min-w-0">
                  <h2 className="mb-3 font-display text-lg font-semibold">Analyzed grid cells</h2>
                  {result.features.length > 0
                    ? <Merra2Map result={result} />
                    : <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-line px-5 text-center text-sm text-neutral">
                      No pixel met the backend’s minimum valid-observation requirement. The map intentionally contains no invented features.
                    </div>}
                </Card>
                <div className="space-y-4">
                  <SummaryCard title="Mann–Kendall tests">
                    <div>Ordinary MK: {summary.mann_kendall.trend}, p = {pFmt(summary.mann_kendall.p_value)}, τ = {fmt(summary.mann_kendall.tau, 3)}</div>
                    <div>Hamed–Rao modified MK: {summary.hamed_rao_modified_mann_kendall.trend}, p = {pFmt(summary.hamed_rao_modified_mann_kendall.p_value)}</div>
                    <div className="mt-2 text-xs text-neutral">{summary.test_basis}. Statistical significance does not imply practical importance.</div>
                  </SummaryCard>
                  <SummaryCard title="Seasonal Mann–Kendall">
                    <AvailableTest test={summary.seasonal_mann_kendall}>
                      {summary.seasonal_mann_kendall.trend ?? 'Trend unavailable'} · p = {pFmt(summary.seasonal_mann_kendall.p_value)}
                      {summary.seasonal_mann_kendall.slope_per_year !== undefined && <> · {fmt(summary.seasonal_mann_kendall.slope_per_year, 4)} {unit || 'units'}/year</>}
                    </AvailableTest>
                  </SummaryCard>
                  <SummaryCard title="Stationarity">
                    <AvailableTest test={summary.stationarity}>
                      <div>ADF: {flag(summary.stationarity.adf_stationary)} (p = {pFmt(summary.stationarity.adf_p_value)})</div>
                      <div>KPSS: {flag(summary.stationarity.kpss_stationary)} (p = {pFmt(summary.stationarity.kpss_p_value)})</div>
                      <div className="mt-1 text-xs text-neutral">ADF null: unit root. KPSS null: stationarity. Disagreement can be informative.</div>
                    </AvailableTest>
                  </SummaryCard>
                  <SummaryCard title="Autocorrelation · Ljung–Box">
                    {summary.ljung_box.length
                      ? summary.ljung_box.map((test) => <div key={test.lag}>Lag {test.lag}: statistic {fmt(test.statistic, 3)}, p = {pFmt(test.p_value)}</div>)
                      : <p className="text-neutral">No Ljung–Box results are available.</p>}
                  </SummaryCard>
                </div>
              </div>

              <Card>
                <h2 className="font-display text-lg font-semibold">Change-point screens</h2>
                <p className="mt-1 text-xs text-neutral">{summary.change_points.note}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {(['pettitt', 'snht', 'buishand'] as const).map((name) => {
                    const test = summary.change_points[name]
                    return <div key={name} className="rounded-xl border border-line bg-bg2/50 p-4">
                      <div className="label">{name === 'snht' ? 'SNHT' : name === 'buishand' ? 'Buishand' : 'Pettitt'}</div>
                      <AvailableTest test={test}>
                        <div>{test.change ? 'Change-point signal' : 'No signal at selected α'} · p = {pFmt(test.p_value)}</div>
                        <div className="text-xs text-neutral">Candidate step index: {test.index ?? '—'}</div>
                      </AvailableTest>
                    </div>
                  })}
                </div>
              </Card>

              {summary.record_note && <Card className="text-sm text-neutral">{summary.record_note}</Card>}
              <ChartCard title="Regional time series" filename={`merra2_${result.metadata.variable}_regional`}
                subtitle={`Spatial median · ${result.metadata.start_date} to ${result.metadata.end_date} · ${unit || 'units unavailable'}`}
                data={chartData.raw} height={380}
                layout={{ xaxis: { type: 'date', title: { text: 'Date' } }, yaxis: { title: { text: unit || 'Value' } } }} />
              {chartData.hasSeasonal && (
                <ChartCard title="STL seasonal component" filename={`merra2_${result.metadata.variable}_seasonal`}
                  subtitle="Robust STL decomposition, period = 12 monthly samples. This component is not an independent causal signal."
                  data={chartData.seasonal} height={300}
                  layout={{ xaxis: { type: 'date', title: { text: 'Date' } }, yaxis: { title: { text: unit || 'Seasonal component' } } }} />
              )}
              <Card className="text-xs leading-relaxed text-neutral">
                All chart arrays use the response timestamps as their shared x-axis; missing values remain gaps. The fitted STL trend and seasonal component are omitted when the record is too short.
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
