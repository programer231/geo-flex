import type { Feature, FeatureCollection, Point } from 'geojson'

export interface TrendProperties {
  id: string
  slope: number | null
  mapClass: 'increasing' | 'decreasing' | 'not_significant' | 'insufficient'
  label: string
}

export type TrendFeature = Feature<Point, TrendProperties>
export type TrendFeatureCollection = FeatureCollection<Point, TrendProperties>

export interface TrendPreset {
  id: string
  name: string
  center: [number, number]
  bounds: [[number, number], [number, number]]
  regionId: string | null
  note: string
}
