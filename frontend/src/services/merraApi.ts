export interface MerraVariable {
  name: string
  units: string | null
  long_name: string | null
}

export interface MerraMetadata {
  source: string
  variables: MerraVariable[]
  time_range: [string, string]
  spatial_bounds: [number, number, number, number]
}

export interface TestUnavailable {
  available: false
  reason: string
}

export interface TestAvailable {
  available: true
  reason?: string
}

export type OptionalTest = TestUnavailable | TestAvailable

export type MerraChangePoint = OptionalTest & {
  statistic?: number
  index?: number
  p_value?: number
  change?: boolean
  method?: string
}

export interface MerraRegionalSummary {
  test_basis: string
  record_note: string | null
  mann_kendall: {
    s: number | null
    z: number | null
    tau: number | null
    p_value: number | null
    trend: string
    significant: boolean
  }
  hamed_rao_modified_mann_kendall: {
    z: number | null
    p_value: number | null
    variance_correction: number | null
    trend: string
    significant: boolean
  }
  seasonal_mann_kendall: OptionalTest & {
    z?: number | null
    p_value?: number | null
    slope_per_year?: number | null
    trend?: string
  }
  sen_slope: {
    per_month: number | null
    per_decade: number | null
    intercept: number | null
    ci_95_per_month: [number | null, number | null]
    ci_95_per_decade: [number | null, number | null]
  }
  spearman: { rho: number | null; p_value: number | null; significant: boolean | null }
  stationarity: OptionalTest & {
    warnings?: string[]
    adf_statistic?: number | null
    adf_p_value?: number | null
    adf_stationary?: boolean | null
    kpss_statistic?: number | null
    kpss_p_value?: number | null
    kpss_stationary?: boolean | null
    kpss_p_value_at_table_bound?: boolean
    adf_trend_statistic?: number | null
    adf_trend_p_value?: number | null
    adf_trend_stationary?: boolean | null
    kpss_trend_statistic?: number | null
    kpss_trend_p_value?: number | null
    kpss_trend_stationary?: boolean | null
  }
  ljung_box: { lag: number; statistic: number | null; p_value: number | null }[]
  change_points: {
    pettitt: MerraChangePoint
    snht: MerraChangePoint
    buishand: MerraChangePoint
    note: string
  }
}

export interface MerraTimeseries {
  timestamps: string[]
  raw_median: (number | null)[]
  deseasonalized: (number | null)[]
  seasonal: (number | null)[]
  trend: (number | null)[]
}

export interface MerraPixelProperties {
  lat: number
  lon: number
  n_valid: number
  slope: number | null
  slope_intercept: number | null
  slope_ci_95: [number | null, number | null]
  p_value: number | null
  z: number | null
  tau: number | null
  trend: 'increasing' | 'decreasing' | 'no trend'
  significant: boolean
  mann_kendall_significant: boolean
  seasonal_mk_p_value: number | null
  seasonal_mk_significant: boolean | null
  adf_stationary: boolean | null
  kpss_stationary: boolean | null
}

export interface MerraPixelFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: MerraPixelProperties
}

export interface MerraFeatureCollection {
  type: 'FeatureCollection'
  metadata: {
    source: string
    variable: string
    units: string | null
    bounding_box: [number, number, number, number]
    start_date: string
    end_date: string
    alpha: number
    seasonal_period: number
    grid: {
      time_steps: number
      latitudes: number
      longitudes: number
      pixels_total: number
      pixels_analyzed: number
      pixels_significant: number
      significant_percent: number
    }
    regional_summary: MerraRegionalSummary
    regional_timeseries: MerraTimeseries
  }
  features: MerraPixelFeature[]
}

async function responseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const body = await response.json() as { error?: string; detail?: string; message?: string }
      message = body.error ?? body.detail ?? body.message ?? message
    } catch {
      // Retain the HTTP status when the server does not return JSON.
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    return await responseJson<T>(await fetch(url, init))
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Could not connect to the MERRA-2 API. Check that the backend is running on port 5000.')
    }
    throw error
  }
}

export interface MerraAnalyzeParams {
  variable: string
  west: number
  south: number
  east: number
  north: number
  start_date: string
  end_date: string
  alpha: number
}

export const merraApi = {
  metadata: () => request<MerraMetadata>('/api/metadata'),
  analyze: (params: MerraAnalyzeParams, signal?: AbortSignal) =>
    request<MerraFeatureCollection>('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    }),
}
