import { useMemo } from 'react'
import { COLORS, signed } from '../services/format'
import type { GridResult, Region } from '../services/api'
import GlobeScene, { type GlobeMarker } from './GlobeScene'
import type { TrendFeatureCollection, TrendPreset } from './TrendGlobe.types'

interface Props {
  grid: GridResult | null
  outline: [number, number][]
  regions: Region[]
  selectedRegionId: string | null
  unit: string
  onSelectRegion: (regionId: string | null) => void
  onInspect: (lat: number, lon: number) => void
}

const PRESETS: TrendPreset[] = [
  {
    id: 'morocco',
    name: 'Morocco',
    center: [28.6, -8.1],
    bounds: [[21.3, -17.1], [35.9, -1.0]],
    regionId: 'morocco',
    note: 'Backend region available',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    center: [-3.5, -62.0],
    bounds: [[-15.0, -75.0], [5.0, -45.0]],
    regionId: null,
    note: 'Visual reference only — no registered analysis region',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    center: [35.1, -4.3],
    bounds: [[34.4, -6.3], [35.8, -2.3]],
    regionId: 'rif_med',
    note: 'Uses the registered Rif & Mediterranean coast region',
  },
]

export default function TrendGlobe({ grid, outline, regions, selectedRegionId, unit, onSelectRegion, onInspect }: Props) {
  const features = useMemo<TrendFeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: (grid?.cells ?? []).map((cell) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [cell.lon, cell.lat] },
      properties: {
        id: `${cell.lat}_${cell.lon}`,
        slope: cell.slope_per_decade ?? null,
        mapClass: cell.map_class,
        label: `${cell.lat.toFixed(1)}°, ${cell.lon.toFixed(1)}°`,
      },
    })),
  }), [grid])

  const selectedPreset = PRESETS.find((preset) => preset.id === selectedRegionId) ?? PRESETS[0]
  const maxSlope = Math.max(0, ...features.features.map((feature) => Math.abs(feature.properties.slope ?? 0)))

  const markers = useMemo<GlobeMarker[]>(() => features.features
    .filter((feature) => feature.properties.mapClass !== 'insufficient' && feature.properties.slope !== null)
    .map((feature) => {
      const { id, slope, mapClass, label } = feature.properties
      const amount = Math.abs(slope ?? 0)
      const color = (slope ?? 0) > 0 ? COLORS.up : (slope ?? 0) < 0 ? COLORS.down : COLORS.ns
      const classification = mapClass === 'increasing' ? 'Significant increase'
        : mapClass === 'decreasing' ? 'Significant decrease'
          : 'No significant trend'
      return {
        id,
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        color,
        label,
        detail: `${classification} · ${signed(slope ?? 0, 3)} ${unit}/decade`,
        size: maxSlope ? 0.018 + 0.018 * (amount / maxSlope) : 0.02,
      }
    }), [features, maxSlope, unit])

  const selectedRegion = regions.find((region) => region.id === selectedPreset.regionId)
  const selectedAreaBounds = selectedRegion?.bounds ?? selectedPreset.bounds
  const focus = { lat: selectedPreset.center[0], lon: selectedPreset.center[1] }

  return (
    <div className="trend-globe">
      <div className="trend-globe-controls" aria-label="Predefined demonstration regions">
        {PRESETS.map((preset) => {
          const active = selectedPreset.id === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              className={`trend-region-button ${active ? 'active' : ''}`}
              aria-pressed={active}
              onClick={() => onSelectRegion(preset.id)}
            >
              {preset.name}
            </button>
          )
        })}
        <span className="trend-preset-note">{selectedPreset.note}</span>
      </div>

      <div className="trend-globe-canvas">
        <GlobeScene
          markers={markers}
          outline={outline}
          selectionBounds={selectedAreaBounds}
          focus={focus}
          onSelect={(id) => {
            const [lat, lon] = id.split('_').map(Number)
            if (Number.isFinite(lat) && Number.isFinite(lon)) onInspect(lat, lon)
          }}
          className="h-full w-full"
        />
        {!grid?.cells.length && (
          <div className="trend-globe-empty" role="status">
            No grid trend results are available yet. Run an analysis for a supported region to map its cell trends.
          </div>
        )}
      </div>

      <div className="trend-globe-legend" aria-label="Trend legend">
        <span><i className="trend-key increasing" /> Positive slope</span>
        <span><i className="trend-key decreasing" /> Negative slope</span>
        <span><i className="trend-key neutral" /> Zero slope</span>
        <span className="trend-legend-note">Marker size reflects absolute slope; values and significance class are shown on hover.</span>
      </div>
    </div>
  )
}
