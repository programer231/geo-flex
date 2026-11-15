import { useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowDownToLine, ArrowLeft, Check, ChevronDown, CircleHelp, LoaderCircle, MapPin, Pencil, Play, RotateCcw, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataBadge, PageHeader } from '../components/ui'
import SolarSiteMap, { type SolarLayer } from '../maps/SolarSiteMap'
import { api, type Region, type SolarResult, type SolarSample } from '../services/api'
import { useStore } from '../services/store'
import { useTheme } from '../services/theme-context'
import '../styles/solar.css'

type Coordinate = [number, number]
type ReportFormat = 'pdf' | 'csv'

const LATEST_COMPLETE_YEAR = new Date().getUTCFullYear() - 1
const CURRENT_SOURCE =
  'NASA POWER All Sky Surface Shortwave Downward Irradiance (ALLSKY_SFC_SW_DWN), monthly; air temperature (T2M) is contextual only.'

function closeRing(points: Coordinate[]): Coordinate[] {
  if (points.length < 3) return points
  const first = points[0]
  const last = points[points.length - 1]
  return first[0] === last[0] && first[1] === last[1] ? points : [...points, first]
}

function regionPolygon(region: Region): Coordinate[] {
  const [[south, west], [north, east]] = region.bounds
  return [[west, south], [east, south], [east, north], [west, north], [west, south]]
}

function pointKey(sample: Pick<SolarSample, 'latitude' | 'longitude'>) {
  return `${sample.latitude.toFixed(3)},${sample.longitude.toFixed(3)}`
}

function formatValue(value: number | null, digits = 2) {
  return value === null ? 'Not available' : value.toFixed(digits)
}

function AnnualGhiChart({ sample }: { sample: SolarSample }) {
  const values = sample.annual_values
  if (values.length < 2) return <p className="solar-muted">Not enough complete annual records to show a time series.</p>
  const data = values.map((entry) => entry.mean_daily_ghi_kwh_m2)
  const min = Math.min(...data)
  const max = Math.max(...data)
  const points = data.map((value, index) => {
    const x = 4 + index * 252 / Math.max(data.length - 1, 1)
    const y = 52 - (max === min ? 0.5 : (value - min) / (max - min)) * 40
    return `${x},${y}`
  }).join(' ')
  return (
    <figure className="solar-chart">
      <svg viewBox="0 0 260 60" role="img" aria-label={`Annual mean daily solar irradiance from ${values[0].year} to ${values[values.length - 1].year}`}>
        <line x1="4" y1="53" x2="256" y2="53" />
        <polyline points={points} />
      </svg>
      <figcaption>{values[0].year}–{values[values.length - 1].year} · {min.toFixed(1)}–{max.toFixed(1)} kWh/m²/day</figcaption>
    </figure>
  )
}

export default function SolarSiteIntelligence() {
  const { regions, outline } = useStore()
  const { theme } = useTheme()
  const [polygon, setPolygon] = useState<Coordinate[]>([])
  const [drawing, setDrawing] = useState(false)
  const [areaName, setAreaName] = useState('')
  const [startYear, setStartYear] = useState(2001)
  const [endYear, setEndYear] = useState(LATEST_COMPLETE_YEAR)
  const [stabilityWeight, setStabilityWeight] = useState(0.2)
  const [layer, setLayer] = useState<SolarLayer>('score')
  const [result, setResult] = useState<SolarResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reportError, setReportError] = useState('')
  const [downloading, setDownloading] = useState<ReportFormat | null>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

  const samples = result?.samples ?? []
  const selectedSamples = samples.filter((sample) => selectedForCompare.includes(pointKey(sample)))
  const hasBoundary = polygon.length >= 4
  const validYears = startYear >= 1984 && endYear <= LATEST_COMPLETE_YEAR && endYear > startYear

  const selectPreset = (value: string) => {
    setResult(null)
    setError('')
    setSelectedForCompare([])
    if (value === 'morocco-outline') {
      setPolygon(closeRing(outline))
      setAreaName('Morocco · approximate reference outline')
      setDrawing(false)
      return
    }
    const selected = regions.find((region) => region.id === value)
    if (!selected) {
      setPolygon([])
      setAreaName('')
      setDrawing(false)
      return
    }
    setPolygon(regionPolygon(selected))
    setAreaName(`${selected.name} · bounding box`)
    setDrawing(false)
  }

  const startDrawing = () => {
    setPolygon([])
    setResult(null)
    setSelectedForCompare([])
    setAreaName('Drawn polygon')
    setError('')
    setDrawing(true)
  }

  const finishDrawing = () => {
    if (polygon.length < 3) {
      setError('Add at least three boundary corners before finishing the selection.')
      return
    }
    setPolygon(closeRing(polygon))
    setDrawing(false)
    setError('')
  }

  const clearArea = () => {
    setPolygon([])
    setDrawing(false)
    setAreaName('')
    setResult(null)
    setError('')
    setSelectedForCompare([])
  }

  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasBoundary || drawing || !validYears) return
    setBusy(true)
    setError('')
    setReportError('')
    setSelectedForCompare([])
    try {
      const analysis = await api.solarSuitability({
        polygon,
        start_year: startYear,
        end_year: endYear,
        solar_weight: 1 - stabilityWeight,
        stability_weight: stabilityWeight,
      })
      setResult(analysis)
    } catch (reason) {
      setResult(null)
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const downloadReport = async (format: ReportFormat) => {
    if (!result) return
    setDownloading(format)
    setReportError('')
    try {
      const blob = await api.solarReport(result.analysis_id, format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `geoflex-solar-${result.analysis_id}.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (reason) {
      setReportError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setDownloading(null)
    }
  }

  const toggleComparison = (sample: SolarSample) => {
    const key = pointKey(sample)
    setSelectedForCompare((current) => current.includes(key)
      ? current.filter((value) => value !== key)
      : [...current, key].slice(-4))
  }

  const changeVertex = (index: number, point: Coordinate) => {
    setPolygon((current) => {
      const vertices = current.slice(0, -1)
      vertices[index === current.length - 1 ? 0 : index] = point
      return closeRing(vertices)
    })
    setResult(null)
  }

  return (
    <div className="solar-page">
      <PageHeader
        title="Solar Site Intelligence"
        subtitle="Compare broad solar-resource patterns with real NASA POWER observations. This is a preliminary screen, not an engineering recommendation."
        actions={(
          <Link className="solar-back-link" to="/"><ArrowLeft aria-hidden="true" size={16} /> GEO-FLEX home</Link>
        )}
      />

      <div className="solar-workspace">
        <section className="solar-map-panel" aria-label="Select and inspect a study area">
          <div className="solar-panel-heading">
            <div>
              <span className="solar-kicker"><MapPin aria-hidden="true" size={14} /> AREA SELECTION</span>
              <h2>{areaName || 'Choose a study area'}</h2>
            </div>
            {result && <DataBadge status={result.data.status} />}
          </div>
          <div className="solar-map-toolbar">
            <label className="solar-preset">
              <span>Start with a reference area</span>
              <select value="" onChange={(event) => selectPreset(event.target.value)} aria-label="Choose a reference area">
                <option value="">Choose area…</option>
                <option value="morocco-outline">Morocco · approximate outline</option>
                {regions.filter((region) => region.id !== 'morocco').map((region) => (
                  <option key={region.id} value={region.id}>{region.name} · bounding box</option>
                ))}
              </select>
            </label>
            <div className="solar-map-actions">
              <button type="button" className={`solar-tool-button ${drawing ? 'active' : ''}`} onClick={startDrawing}>
                <Pencil aria-hidden="true" size={15} /> Draw area
              </button>
              {drawing && (
                <>
                  <button type="button" className="solar-tool-button" onClick={() => setPolygon((points) => points.slice(0, -1))} disabled={!polygon.length}>
                    <RotateCcw aria-hidden="true" size={15} /> Undo corner
                  </button>
                  <button type="button" className="solar-tool-button solar-tool-button--finish" onClick={finishDrawing} disabled={polygon.length < 3}>
                    <Check aria-hidden="true" size={15} /> Finish
                  </button>
                </>
              )}
              {hasBoundary && !drawing && (
                <span className="solar-edit-hint"><Pencil aria-hidden="true" size={13} /> Drag corners to edit</span>
              )}
              <button type="button" className="solar-clear-button" onClick={clearArea} disabled={!hasBoundary && !drawing}>Clear</button>
            </div>
          </div>
          <SolarSiteMap
            polygon={polygon}
            drawing={drawing}
            samples={samples}
            layer={layer}
            theme={theme}
            onAddPoint={(point) => setPolygon((current) => [...current, point])}
            onMovePoint={changeVertex}
          />
          <div className="solar-map-footnote">
            <CircleHelp aria-hidden="true" size={14} />
            <span>Reference boxes are approximate. Drawn edges and available grid samples do not represent parcel boundaries.</span>
          </div>
        </section>

        <aside className="solar-analysis-panel" aria-labelledby="solar-analysis-title">
          <div className="solar-panel-heading">
            <div>
              <span className="solar-kicker"><Sun aria-hidden="true" size={14} /> SCREENING SETUP</span>
              <h2 id="solar-analysis-title">Choose what to compare</h2>
            </div>
          </div>
          <form onSubmit={analyze}>
            <div className="solar-year-fields">
              <label>
                <span>From year</span>
                <input type="number" min={1984} max={LATEST_COMPLETE_YEAR - 1} value={startYear} onChange={(event) => setStartYear(Number(event.target.value))} />
              </label>
              <label>
                <span>Through year</span>
                <input type="number" min={1985} max={LATEST_COMPLETE_YEAR} value={endYear} onChange={(event) => setEndYear(Number(event.target.value))} />
              </label>
            </div>
            {!validYears && <p className="solar-field-error">Choose a period between 1984 and {LATEST_COMPLETE_YEAR}, with the end year after the start.</p>}

            <label className="solar-weight-control" htmlFor="solar-stability-weight">
              <span><b>Climate stability</b><strong>{Math.round(stabilityWeight * 100)}%</strong></span>
              <input
                id="solar-stability-weight"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={stabilityWeight}
                onChange={(event) => setStabilityWeight(Number(event.target.value))}
              />
              <small>Solar resource: {Math.round((1 - stabilityWeight) * 100)}% · Stability: lower year-to-year GHI variation scores higher.</small>
            </label>

            <div className="solar-method-card">
              <b>Included in the relative score</b>
              <p>Mean all-sky surface solar irradiance and interannual variability. Both are ranked only against sampled points in your selected area.</p>
            </div>
            <div className="solar-method-card solar-method-card--muted">
              <b>Shown as context, not scored</b>
              <p>Near-surface air temperature. Terrain, land cover, protected areas, roads, grid access, ownership, permitting, and costs are unavailable.</p>
            </div>

            {error && <p className="solar-error" role="alert"><AlertTriangle aria-hidden="true" size={16} /> {error}</p>}
            <button type="submit" className="solar-run-button" disabled={!hasBoundary || drawing || busy || !validYears}>
              {busy ? <><LoaderCircle aria-hidden="true" className="solar-spinner" size={17} /> Requesting real NASA data…</> : <><Play aria-hidden="true" size={16} /> Analyze selected area</>}
            </button>
            {busy && <p className="solar-loading-note">NASA POWER is fetching monthly records for up to 24 sample points. Results are not simulated.</p>}
          </form>
          <div className="solar-source-note">
            <b>Source</b>
            <p>{CURRENT_SOURCE}</p>
            <a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">NASA POWER · source details <ArrowDownToLine aria-hidden="true" size={12} /></a>
          </div>
        </aside>
      </div>

      {result && (
        <section className="solar-results" aria-labelledby="solar-results-title" aria-live="polite">
          <div className="solar-results-heading">
            <div>
              <span className="solar-kicker">SCREENING RESULTS</span>
              <h2 id="solar-results-title">What the data shows</h2>
              <p>{result.area_km2.toLocaleString()} km² · {result.sampling.valid_points} valid points · {result.period.start_year}–{result.period.end_year}</p>
            </div>
            <div className="solar-download-actions">
              <button type="button" className="solar-tool-button" onClick={() => void downloadReport('csv')} disabled={downloading !== null}>
                {downloading === 'csv' ? <LoaderCircle className="solar-spinner" size={15} /> : <ArrowDownToLine size={15} />} CSV
              </button>
              <button type="button" className="solar-tool-button" onClick={() => void downloadReport('pdf')} disabled={downloading !== null}>
                {downloading === 'pdf' ? <LoaderCircle className="solar-spinner" size={15} /> : <ArrowDownToLine size={15} />} PDF report
              </button>
            </div>
          </div>
          {reportError && <p className="solar-error" role="alert">{reportError}</p>}
          <div className="solar-result-grid">
            <article className="solar-result-card">
              <span className="solar-kicker">DATA SOURCE</span>
              <strong>{result.data.source}</strong>
              <p><DataBadge status={result.data.status} /> <span>{result.data.valid_points} successful · {result.data.failed_points} failed</span></p>
            </article>
            <article className="solar-result-card">
              <span className="solar-kicker">SAMPLE SPACING</span>
              <strong>≈ {result.sampling.approximate_spacing_km} km</strong>
              <p>{result.sampling.grid_resolution}{result.sampling.downsampled ? ' · downsampled; not interpolated' : ''}</p>
            </article>
            <article className="solar-result-card">
              <span className="solar-kicker">RELATIVE SCREENING POINTS</span>
              <strong>{result.screening_points.length ? result.screening_points.length : 'None meet cutoff'}</strong>
              <p>Top points at or above the 70th relative-score percentile, when scoreable.</p>
            </article>
          </div>

          <div className="solar-layer-tabs" role="group" aria-label="Choose map layer">
            {([
              ['score', 'Relative score'],
              ['ghi', 'Mean GHI'],
              ['temperature', 'Air temperature'],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={layer === id} onClick={() => setLayer(id)}>{label}</button>
            ))}
          </div>

          <div className="solar-results-columns">
            <div className="solar-points-panel">
              <div className="solar-subheading">
                <div><h3>Sample-point findings</h3><p>Select up to four points to compare.</p></div>
              </div>
              <div className="solar-table-scroll">
                <table className="solar-table">
                  <thead><tr>
                    <th scope="col">Compare</th><th scope="col">Location</th><th scope="col">Mean GHI</th>
                    <th scope="col">GHI variability</th><th scope="col">Air temp.</th><th scope="col">Score*</th>
                  </tr></thead>
                  <tbody>
                    {samples.map((sample) => {
                      const key = pointKey(sample)
                      return (
                        <tr key={key}>
                          <td><input type="checkbox" aria-label={`Compare point ${key}`} checked={selectedForCompare.includes(key)} onChange={() => toggleComparison(sample)} /></td>
                          <td>{sample.latitude.toFixed(2)}, {sample.longitude.toFixed(2)}</td>
                          <td>{formatValue(sample.mean_daily_ghi_kwh_m2)} <small>kWh/m²/day</small></td>
                          <td>{sample.annual_cv_percent === null ? 'n/a' : `${sample.annual_cv_percent.toFixed(1)}% CV`}</td>
                          <td>{sample.mean_air_temperature_2m_c === null ? 'n/a' : `${sample.mean_air_temperature_2m_c.toFixed(1)} °C`}</td>
                          <td>{sample.scores.overall === null ? 'n/a' : `${sample.scores.overall.toFixed(1)} / 100`}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="solar-score-footnote">* Relative percentile score within this selected area—not absolute site suitability. Missing criteria are not treated as favorable.</p>
              {selectedSamples.length > 0 && (
                <div className="solar-comparison">
                  <h3>Compare selected points</h3>
                  <div className="solar-comparison-grid">
                    {selectedSamples.map((sample) => (
                      <article key={pointKey(sample)}>
                        <b>{sample.latitude.toFixed(2)}, {sample.longitude.toFixed(2)}</b>
                        <AnnualGhiChart sample={sample} />
                        <p>Trend: {sample.ghi_trend?.class_label ?? 'not enough data for a trend test'}</p>
                        {sample.ghi_trend && <small>Sen slope: {sample.ghi_trend.slope_per_decade.toFixed(3)} kWh/m²/day per decade · unadjusted p={sample.ghi_trend.p_value.toFixed(3)}</small>}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <aside className="solar-methodology-panel">
              <span className="solar-kicker">READ THE RESULTS</span>
              <h3>What a score means</h3>
              <p>{result.score_definition}</p>
              <p>GHI is monthly average daily sunlight energy reaching the surface. It is not expected electricity production, and the score is not a recommendation.</p>
              <details>
                <summary>Data provenance and limits <ChevronDown aria-hidden="true" size={15} /></summary>
                <p>{result.data.attribution}</p>
                <p>Retrieved: {result.data.retrieved_at}</p>
                <p>{result.data.spatial_note}</p>
                <ul>{result.data.notes.map((note) => <li key={note}>{note}</li>)}</ul>
              </details>
              <p className="solar-storage-note">Reports are held in server memory for this running session and are not synced between devices.</p>
            </aside>
          </div>
        </section>
      )}
    </div>
  )
}
