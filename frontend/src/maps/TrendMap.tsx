import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { Circle, MapContainer, Polygon, Rectangle, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { GridCell, GridResult, Region } from '../services/api'
import { COLORS, fmt, pFmt, signed } from '../services/format'

export type Basemap = 'dark' | 'gibs'

const BASE: Record<Basemap, { url: string; attr: string; maxZoom: number }> = {
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', maxZoom: 12,
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>' },
  gibs: { url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg', maxZoom: 8,
    attr: 'Imagery © <a href="https://www.earthdata.nasa.gov/engage/open-data-services-and-software/api/gibs-api">NASA GIBS</a> / Blue Marble' },
}

function Fit({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap()
  useEffect(() => { map.flyToBounds(bounds, { padding: [24, 24], duration: 0.8, maxZoom: 7 }) }, [map, bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
function Clicks({ onPoint }: { onPoint?: (lat: number, lon: number) => void }) {
  useMapEvents({ click: (e) => onPoint?.(e.latlng.lat, e.latlng.lng) })
  return null
}

/** Sequential-by-magnitude colour: stronger significant trend → more saturated. */
function cellStyle(c: GridCell, maxAbs: number) {
  if (c.map_class === 'insufficient') return { color: '#8EA0B8', fillColor: 'transparent', fillOpacity: 0, dashArray: '4 4', weight: 1.2 }
  if (c.map_class === 'not_significant') return { color: COLORS.ns, fillColor: COLORS.ns, fillOpacity: 0.28, weight: 1, dashArray: undefined }
  const k = Math.min(1, Math.abs(c.slope_per_decade ?? 0) / (maxAbs || 1))
  const base = c.map_class === 'increasing' ? COLORS.up : COLORS.down
  return { color: base, fillColor: base, fillOpacity: 0.35 + 0.5 * k, weight: 1.4, dashArray: undefined }
}

interface Props {
  grid?: GridResult | null
  outline: [number, number][]
  regions?: Region[]
  selectedRegion?: string | null
  onRegion?: (id: string) => void
  onCell?: (c: GridCell) => void
  onPoint?: (lat: number, lon: number) => void
  inspected?: { lat: number; lon: number } | null
  bounds: [[number, number], [number, number]]
  basemap?: Basemap
  unit: string
  height?: number | string
  variableName?: string
}

export default function TrendMap({ grid, outline, regions, selectedRegion, onRegion, onCell, onPoint, inspected, bounds, basemap = 'dark', unit, height = 460, variableName }: Props) {
  const cells = grid?.cells ?? []
  const step = grid?.summary?.spacing_deg ?? 1
  const radiusM = step * 111000 * 0.42
  const maxAbs = Math.max(0.0001, ...cells.filter((c) => c.map_class === 'increasing' || c.map_class === 'decreasing').map((c) => Math.abs(c.slope_per_decade ?? 0)))
  const b = BASE[basemap]
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line" style={{ height }}>
      <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }} zoomControl scrollWheelZoom maxZoom={b.maxZoom} minZoom={3} worldCopyJump>
        <TileLayer key={basemap} url={b.url} attribution={b.attr} subdomains="abcd" maxZoom={b.maxZoom} />
        <Fit bounds={bounds} />
        <Clicks onPoint={onPoint} />
        <Polygon positions={outline.map(([lon, lat]) => [lat, lon] as [number, number])} pathOptions={{ color: '#36D6E8', weight: 1.2, fill: false, opacity: 0.55, dashArray: '2 5' }} interactive={false} />
        {regions?.filter((r) => r.id !== 'morocco').map((r) => (
          <Rectangle key={r.id} bounds={r.bounds} eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onRegion?.(r.id) } }}
            pathOptions={{ color: selectedRegion === r.id ? '#36D6E8' : '#7C83FF', weight: selectedRegion === r.id ? 2 : 0.8, fillOpacity: selectedRegion === r.id ? 0.08 : 0.015, opacity: selectedRegion === r.id ? 0.95 : 0.35 }}>
            <Tooltip className="gf-tip" sticky><b>{r.name}</b><br /><span style={{ color: '#94A3B8' }}>{r.description}</span><br />Click to select region</Tooltip>
          </Rectangle>
        ))}
        {cells.map((c) => (
          <Circle key={`${c.lat}_${c.lon}`} center={[c.lat, c.lon]} radius={radiusM} pathOptions={cellStyle(c, maxAbs)}
            eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onCell?.(c) } }}>
            <Tooltip className="gf-tip" sticky>
              <div style={{ minWidth: 190 }}>
                <b>{c.lat.toFixed(1)}°N, {c.lon.toFixed(1)}°E</b>
                {c.map_class === 'insufficient' ? <div style={{ color: '#94A3B8' }}>Insufficient data ({Math.round(c.completeness * 100)}% complete)</div> : (<>
                  <div style={{ color: c.map_class === 'increasing' ? COLORS.up : c.map_class === 'decreasing' ? COLORS.down : '#94A3B8', fontWeight: 600 }}>
                    {c.map_class === 'increasing' ? '↑ Significant increase' : c.map_class === 'decreasing' ? '↓ Significant decrease' : '→ No significant trend'}
                  </div>
                  <div>{variableName ?? 'Trend'}: <b>{signed(c.slope_per_decade, 3)} {unit}/decade</b></div>
                  {c.slope_ci_per_decade && <div style={{ color: '#94A3B8' }}>95% CI {fmt(c.slope_ci_per_decade[0], 3)} … {fmt(c.slope_ci_per_decade[1], 3)}</div>}
                  <div style={{ color: '#94A3B8' }}>p = {pFmt(c.p_value)} · FDR q = {pFmt(c.q_value ?? undefined)} · τ = {fmt(c.tau, 2)}</div>
                  <div style={{ color: '#94A3B8' }}>Click to inspect this cell</div>
                </>)}
              </div>
            </Tooltip>
          </Circle>
        ))}
        {inspected && <Circle center={[inspected.lat, inspected.lon]} radius={radiusM * 1.12} pathOptions={{ color: '#fff', weight: 2, fill: false }} interactive={false} />}
      </MapContainer>
      <Legend maxAbs={maxAbs} unit={unit} />
    </div>
  )
}

function Legend({ maxAbs, unit }: { maxAbs: number; unit: string }) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-xl border border-line bg-bg2/90 px-3 py-2.5 text-[11px] backdrop-blur">
      <div className="label mb-1.5">Trend per decade</div>
      <div className="flex items-center gap-2"><span className="h-2.5 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${COLORS.down}, #2a3547 50%, ${COLORS.up})` }} /><span className="text-neutral">±{fmt(maxAbs, 2)} {unit}</span></div>
      <div className="mt-1.5 space-y-0.5 text-neutral">
        <div className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.up }} />Significant increase</div>
        <div className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.down }} />Significant decrease</div>
        <div className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.ns, opacity: 0.6 }} />No significant trend</div>
        <div className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full border border-dashed" style={{ borderColor: '#8EA0B8' }} />Insufficient data</div>
      </div>
    </div>
  )
}
