import { Globe2, Map as MapIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TimeSeriesChart } from '../charts/Charts'
import { Metric } from '../components/shared'
import { Card, DataBadge, EmptyState, PageHeader, Segmented, Skeleton, Spinner } from '../components/ui'
import TrendGlobe from '../maps/TrendGlobe'
import TrendMap, { type Basemap } from '../maps/TrendMap'
import { api, type Analysis, type GridResult } from '../services/api'
import { COLORS, fmt, pct, pFmt, signed } from '../services/format'
import { useStore } from '../services/store'

export default function Explore() {
  const { analysis, regions, outline, config, setConfig, run, running, toast } = useStore()
  const nav = useNavigate()
  const [fallback, setFallback] = useState<GridResult | null>(null)
  const [loadedGridRequest, setLoadedGridRequest] = useState<{ key: string; error: string | null }>({ key: '', error: null })
  const [gridRetry, setGridRetry] = useState(0)
  const [mode, setMode] = useState<'map' | 'globe'>('map')
  const [base, setBase] = useState<Basemap>('dark')
  const [point, setPoint] = useState<{ lat: number; lon: number } | null>(null)
  const [pa, setPa] = useState<Analysis | null>(null)
  const [pbusy, setPbusy] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const gridRequestKey = `${config.dataset}:${gridRetry}`
  const grid = analysis?.grid ?? (loadedGridRequest.key === gridRequestKey ? fallback : null)
  useEffect(() => {
    if (analysis) return
    let live = true
    api.overview(config.dataset)
      .then((o) => {
        if (!live) return
        setFallback(o.grid)
        setLoadedGridRequest({ key: gridRequestKey, error: null })
      })
      .catch((e) => {
        if (live) setLoadedGridRequest({ key: gridRequestKey, error: e instanceof Error ? e.message : String(e) })
      })
    return () => { live = false }
  }, [analysis, config.dataset, gridRequestKey])

  const regionId = analysis?.grid ? analysis.region_id : 'morocco'
  const region = regions.find((r) => r.id === regionId) ?? regions[0]
  const isGridLoading = !analysis && loadedGridRequest.key !== gridRequestKey
  const gridLoadError = !analysis && loadedGridRequest.key === gridRequestKey ? loadedGridRequest.error : null
  const unit = grid?.unit ?? 'unit'
  const varName = analysis?.grid ? analysis.variable.name : 'Surface temperature'
  const period = analysis?.grid ? analysis.period : null

  const inspect = async (lat: number, lon: number) => {
    if (!grid) return
    setPoint({ lat, lon }); setPbusy(true); setPa(null)
    try {
      setPa(await api.point({ variable: grid.variable_id, lat, lon, start: period?.start ?? config.start, end: period?.end ?? config.end, resolution: config.resolution, alpha: config.alpha, dataset: config.dataset }))
    } catch (e) { toast('error', `Could not analyse this point: ${e instanceof Error ? e.message : e}`) } finally { setPbusy(false) }
  }
  const pickRegion = (id: string) => { setConfig({ region: id }); setSel(id); toast('info', `Region set to ${regions.find((r) => r.id === id)?.name}. Run the analysis to compute its grid.`) }
  const pickGlobeRegion = (presetId: string | null) => {
    if (!presetId) return
    setSelectedPreset(presetId)
    const regionId = presetId === 'morocco' ? 'morocco' : presetId === 'mediterranean' ? 'rif_med' : null
    if (!regionId) {
      toast('info', 'Amazon is a visual reference only. The backend has no registered Amazon study region, so no scientific analysis can be run for it.')
      return
    }
    if (!regions.some((item) => item.id === regionId)) {
      toast('error', `The ${presetId} study region is not available from the GEO-FLEX API.`)
      return
    }
    setConfig({ region: regionId })
    setSel(null)
    void run({ region: regionId, include_grid: true })
  }
  const sm = grid?.summary

  return (
    <div>
      <PageHeader title="Explore Earth" subtitle="Where is it changing? Every grid cell is tested separately; click a cell or any point on the map to inspect its history."
        actions={<>{analysis && <DataBadge status={analysis.provenance.status} />}
          <Segmented value={mode} onChange={setMode} options={[{ value: 'map', label: '2D map' }, { value: 'globe', label: '3D globe' }]} />
          {mode === 'map' && <Segmented value={base} onChange={setBase} options={[{ value: 'dark', label: 'Dark' }, { value: 'gibs', label: 'NASA GIBS' }]} />}</>} />
      {!grid && isGridLoading && <Skeleton className="h-[520px]" />}
      {!grid && !isGridLoading && gridLoadError && <div role="alert"><Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neg">Trend data could not be loaded: {gridLoadError}</p>
        <button className="btn-ghost" onClick={() => setGridRetry((value) => value + 1)}>Retry</button>
      </Card></div>}
      {!grid && !isGridLoading && !gridLoadError && <div role="status"><Card className="text-sm text-neutral">The API returned no grid trend data. Run an analysis with per-cell grid enabled to populate the explorer.</Card></div>}
      {!grid && mode === 'globe' && <TrendGlobe
        grid={null}
        outline={outline}
        regions={regions}
        selectedRegionId={selectedPreset ?? 'morocco'}
        unit="unit"
        onSelectRegion={pickGlobeRegion}
        onInspect={inspect}
      />}
      {grid && region && (<>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm"><span className="rounded-full border border-line px-3 py-1">{varName} · {analysis?.grid ? analysis.region : 'Morocco'}{period ? ` · ${period.start} → ${period.end}` : ''}</span>
          {sel && sel !== regionId && <button className="btn-primary !py-1.5 !text-xs" disabled={running} onClick={() => run({ region: sel }).then(() => setSel(null))}>{running ? <Spinner /> : null}Run analysis for {regions.find((r) => r.id === sel)?.name}</button>}</div>
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {mode === 'map' ? <TrendMap grid={grid} outline={outline} regions={regions} selectedRegion={sel} onRegion={pickRegion} onCell={(c) => inspect(c.lat, c.lon)} onPoint={inspect} inspected={point}
              bounds={region.bounds} basemap={base} unit={unit} height={560} variableName={varName} />
              : <TrendGlobe
                grid={grid}
                outline={outline}
                regions={regions}
                selectedRegionId={selectedPreset ?? (region.id === 'rif_med' ? 'mediterranean' : 'morocco')}
                unit={unit}
                onSelectRegion={pickGlobeRegion}
                onInspect={inspect}
              />}
            <p className="mt-2 text-xs text-neutral">{grid.note}</p>
          </div>
          <div className="space-y-4">
            {sm && (<div className="grid grid-cols-2 gap-3">
              <Metric label="Cells tested" value={sm.n_cells} sub={`${sm.spacing_deg}° spacing`} />
              <Metric label="Significant (FDR)" value={sm.n_significant_adjusted} sub={`${sm.n_significant_raw} before correction`} hint="Cells whose trend stays significant after correcting for testing many cells at once." />
              <Metric label="Increasing" accent={COLORS.up} value={sm.n_increasing} /><Metric label="Decreasing" accent={COLORS.down} value={sm.n_decreasing} />
              <Metric label="No trend" value={sm.n_not_significant} /><Metric label="Insufficient" value={sm.n_insufficient} sub="shown hollow" />
            </div>)}
            {sm?.fastest_significant_cell && <Card><div className="label">Fastest significant cell</div><div className="num mt-1 text-xl">{signed(sm.fastest_significant_cell.slope_per_decade, 3)} {unit}/dec</div>
              <button className="mt-1 text-xs text-cyan hover:underline" onClick={() => inspect(sm.fastest_significant_cell!.lat, sm.fastest_significant_cell!.lon)}>{sm.fastest_significant_cell.lat.toFixed(1)}°N, {sm.fastest_significant_cell.lon.toFixed(1)}°E — inspect</button></Card>}
            <Card className="text-xs text-neutral"><MapIcon className="mr-1 inline h-3.5 w-3.5" />Click a sub-region rectangle to select it, then run its analysis. Basemap tiles are loaded from CARTO / NASA GIBS and need internet access; trend cells do not.</Card>
          </div>
        </div>
        <div className="mt-5">
          {pbusy && <Card className="flex items-center gap-3 text-sm"><Spinner />Analysing {point?.lat.toFixed(2)}°N, {point?.lon.toFixed(2)}°E…</Card>}
          {pa && !pbusy && (<div className="space-y-4">
            <Card className="flex flex-wrap items-center justify-between gap-3"><div><div className="label">Point inspection · {pa.region}</div>
              <div className="font-display text-lg font-semibold">{pa.classification.label}</div>
              {pa.stats && <div className="text-sm text-neutral">{signed(pa.stats.sen.slope_per_decade, 3)} {pa.variable.unit}/decade · MK p = {pFmt(pa.stats.mann_kendall.p_value)} · completeness {pct(pa.data.completeness)} · {fmt(pa.stats.span_years, 0)} yr</div>}
              <div className="mt-1 text-xs text-[#F5B84B]">Single-location test (uncorrected p). The map uses FDR correction across all cells, so a cell can look grey there yet pass this single test.</div></div>
              <DataBadge status={pa.provenance.status} /></Card>
            <TimeSeriesChart a={pa} />
          </div>)}
          {!pa && !pbusy && <EmptyState title="Inspect a location" text="Click any grid cell or a point on the 2D map to run a trend analysis for that exact location." action={<button className="btn-ghost" onClick={() => nav('/analysis')}><Globe2 className="h-4 w-4" />Back to the full analysis</button>} />}
        </div>
      </>)}
    </div>
  )
}
