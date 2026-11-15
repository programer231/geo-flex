// Typed client for the GEO-FLEX API.

export type Direction = 'increasing' | 'decreasing' | 'no trend'
export type ClassKey = 'significant_increasing' | 'significant_decreasing' | 'not_significant' | 'insufficient_data'
export type DataStatus = 'LIVE DATA' | 'HISTORICAL DATA' | 'DEMONSTRATION DATA'

export interface Variable {
  id: string; name: string; category: string; description: string; unit: string
  temporal_resolution: string; spatial_resolution: string; data_source: string; dataset: string
  enabled: boolean; connector: string | null; unavailable_reason: string; scope: 'regional' | 'global'
  ratio_scale: boolean; is_temperature: boolean; higher_means: string
}
export interface Region {
  id: string; name: string; description: string; center: [number, number]
  bounds: [[number, number], [number, number]]; n_samples: number; step: number
}
export interface SolarSample {
  latitude: number; longitude: number; mean_daily_ghi_kwh_m2: number | null
  annual_cv_percent: number | null; annual_values: { year: number; mean_daily_ghi_kwh_m2: number }[]
  valid_months: number; expected_months: number; mean_air_temperature_2m_c: number | null
  ghi_trend: { direction: string; class_label: string; slope_per_decade: number; p_value: number } | null
  scores: { solar_resource: number | null; climate_stability: number | null; overall: number | null }
  provenance: Provenance
}
export interface SolarResult {
  analysis_id: string; created_at: string; area_km2: number; polygon: [number, number][]
  period: { start_year: number; end_year: number }
  weights: { solar_resource: number; climate_stability: number }
  sampling: { valid_points: number; requested_points: number; downsampled: boolean; approximate_spacing_km: number; grid_resolution: string }
  data: { source: string; attribution: string; status: DataStatus; retrieved_at: string; spatial_note: string
    valid_points: number; failed_points: number; notes: string[] }
  score_definition: string; samples: SolarSample[]
  screening_points: { latitude: number; longitude: number; score: number; mean_daily_ghi_kwh_m2: number }[]
}
export interface Provenance {
  connector_id: string; source_name: string; status: DataStatus; attribution: string
  retrieved_at: string; url: string; spatial_note: string; warnings: string[]
}
export interface Connector {
  id: string; name: string; description: string; spatial_coverage: string; temporal_coverage: string
  spatial_resolution: string; temporal_resolution: string; retrieval_method: string; attribution: string
  requires_auth: boolean; url: string; is_demo: boolean; variables: string[]
}
export interface StatusInfo {
  mode: string; nasa_power_reachable: boolean | null; probe_error: string | null; probe_checked_at: string | null
  connectors: Connector[]; now: string
}

export interface MK { S: number; z: number; p_value: number; p_value_uncorrected: number; tau: number; trend: Direction
  significant: boolean; autocorr_factor: number; n: number }
export interface Series {
  labels: string[]; t: number[]; value: (number | null)[]; adjusted?: (number | null)[]; trend_line?: number[]
  ci_lower?: (number | null)[]; ci_upper?: (number | null)[]; anomaly?: boolean[]
  stl_trend?: number[] | null; stl_seasonal?: number[] | null; stl_resid?: number[] | null
}
export interface MonthTrend { month: number; name: string; n: number; slope_per_decade: number | null; p_value: number | null
  p_adjusted: number | null; significant: boolean }
export interface GridCell {
  lat: number; lon: number; n: number; completeness: number; class: ClassKey; map_class: 'increasing' | 'decreasing' | 'not_significant' | 'insufficient'
  slope_per_decade?: number; slope_ci_per_decade?: [number, number]; total_change?: number; p_value?: number; q_value?: number | null
  tau?: number; mean?: number; relative_change_pct?: number
}
export interface GridResult {
  variable_id: string; region_id: string; unit: string; cells: GridCell[]; note: string; outline: [number, number][]
  summary: { n_cells: number; n_significant_raw: number; n_significant_adjusted: number; n_increasing: number; n_decreasing: number
    n_not_significant: number; n_insufficient: number; fastest_cell: GridCell | null; fastest_significant_cell: GridCell | null; spacing_deg: number } | null
}
export interface Analysis {
  id: string; region_id: string
  variable: { id: string; name: string; unit: string; category: string; higher_means: string; ratio_scale: boolean }
  region: string; period: { start: string; end: string }; resolution: 'monthly' | 'annual'; alpha: number
  data: { n_valid: number; n_expected: number; completeness: number; n_missing: number }
  classification: { key: ClassKey; label: string }
  insufficient_reason?: string
  provenance: Provenance
  request: { variable: string; region: string; start: string; end: string; resolution: string; alpha: number; dataset: string
    comparison_region: string | null; split_year: number | null }
  stats: null | {
    span_years: number; mean_level: number; methods_agree: boolean; resid_sd: number
    regression: { slope: number; slope_per_decade: number; slope_ci_per_decade: number[]; intercept: number; r_squared: number
      p_value: number; p_value_hac: number; slope_ci_hac_per_decade: number[] }
    mann_kendall: MK
    sen: { slope_per_decade: number; ci_per_decade: [number, number]; intercept: number; ci_confidence: number }
    change: { total: number; per_decade: number; total_ci: [number, number]; relative_pct: number | null; effect_sd_per_decade: number | null }
    acceleration: { curvature_coef: number; p_value: number; label: string } | null
  }
  seasonal: null | { monthly_climatology: { month: number; name: string; mean: number | null; std: number | null; n: number }[]
    amplitude: number; peak_month: string; trough_month: string; seasonal_strength: number | null; trend_strength: number | null
    monthly_trends: MonthTrend[] }
  anomalies?: { count: number; criterion: string; items: { label: string; value: number; robust_z: number; confirmed_by_isolation_forest: boolean }[] }
  period_comparison?: null | { mean_before: number; mean_after: number; n_before: number; n_after: number; difference: number
    difference_ci: number[]; p_welch: number; p_mann_whitney: number; significant: boolean; split_year: number; note: string }
  series: Series
  methodology: { name: string; detail: string }[]
  grid?: GridResult
  comparison?: { analysis: Analysis; slope_test: null | { difference_per_decade: number; z: number; p_value: number; significant: boolean; caution: string } }
}

export interface DiscoveryItem {
  rank: number; variable_id: string; variable: string; unit: string; region_id: string; location: string; period: string
  data_source: string; data_status: DataStatus; completeness: number; direction: string; significant: boolean
  slope_per_decade: number; slope_ci_per_decade: [number, number]; total_change: number; relative_change_pct: number | null; p_value: number; q_value: number | null
  effect_sd_per_decade: number | null; tau: number
}
export interface UnusualItem { variable_id: string; variable: string; unit: string; region_id: string; location: string; recent_anomaly_z: number
  reading: string; note: string; data_status: DataStatus }
export interface Discovery {
  scope: { variables: string[]; regions: string[]; n_tests: number; n_requested: number; period: { start: string; end: string }
    resolution: string; alpha: number; correction: string }
  data_status: DataStatus; warnings: string[]; errors: string[]; label: string
  summary: { n_significant: number; n_increasing: number; n_decreasing: number; n_unusual: number }
  items: DiscoveryItem[]; unusual: UnusualItem[]
}
export interface Overview {
  period: { start: string; end: string }
  discovery: Omit<Discovery, 'items' | 'unusual'>
  recent: DiscoveryItem[]; unusual: UnusualItem[]
  cards: { variable_id: string; name: string; unit: string; category: string; enabled: boolean; item?: DiscoveryItem | null
    sparkline?: (number | null)[]; years?: number[]; reason?: string; source?: string }[]
  grid: GridResult | null
  metrics: { variables_analysed: number; regions_monitored: number; significant_trends: number; tests: number; latest_period: string }
}
export interface AssistantAnswer {
  short_answer: string; key_evidence: string[]; statistical_context: string[]; limitations: string[]; next_steps: string[]
  markdown: string; engine: string
}

export interface AnalyzeParams {
  variable: string; region: string; start: string; end: string; resolution: 'monthly' | 'annual'; alpha: number
  dataset: string; comparison_region: string | null; split_year: number | null; include_grid: boolean
}
export type StreamEvent =
  | { event: 'plan'; steps: { key: string; label: string }[] }
  | { event: 'step'; key: string; state: 'running' | 'done'; detail: string }
  | { event: 'result'; data: Analysis }
  | { event: 'error'; message: string }

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try { const b = await res.json(); msg = b.detail || b.message || msg } catch { /* keep default */ }
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}
const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const api = {
  status: () => fetch('/api/status').then(j<StatusInfo>),
  recheck: () => post('/api/status/recheck', {}).then(j<StatusInfo>),
  catalog: () => fetch('/api/catalog').then(j<{ categories: Record<string, Variable[]>; n_enabled: number; n_total: number }>),
  regions: () => fetch('/api/regions').then(j<{ regions: Region[]; outline: [number, number][]; outline_note: string }>),
  overview: (dataset: string) => fetch(`/api/overview?dataset=${dataset}`).then(j<Overview>),
  discover: (p: { start: string; end: string; resolution: string; alpha: number; dataset: string }) =>
    fetch(`/api/discover?${new URLSearchParams({ ...p, alpha: String(p.alpha) })}`).then(j<Discovery>),
  point: (p: { variable: string; lat: number; lon: number; start: string; end: string; resolution: string; alpha: number; dataset: string }) =>
    post('/api/analyze/point', p).then(j<Analysis>),
  assistant: (question: string, analysis_id: string | null) => post('/api/assistant', { question, analysis_id }).then(j<AssistantAnswer>),
  solarSuitability: (params: {
    polygon: [number, number][]; start_year: number; end_year: number
    solar_weight: number; stability_weight: number
  }) => post('/api/solar/suitability', params).then(j<SolarResult>),
  solarReport: async (analysisId: string, format: 'pdf' | 'csv') => {
    const res = await fetch(`/api/solar/reports/${encodeURIComponent(analysisId)}.${format}`)
    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`
      try { const body = await res.json(); message = body.detail || body.message || message } catch { /* keep default */ }
      throw new Error(message)
    }
    return res.blob()
  },

  /** Streams real progress events (NDJSON) from the analysis pipeline. */
  async analyzeStream(params: AnalyzeParams, onEvent: (e: StreamEvent) => void, signal?: AbortSignal): Promise<void> {
    const res = await post('/api/analyze/stream', params)
    if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText}`)
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    for (;;) {
      if (signal?.aborted) { reader.cancel(); return }
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (line) onEvent(JSON.parse(line) as StreamEvent)
      }
    }
  },
}
