import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { MerraFeatureCollection, MerraPixelFeature } from '../services/merraApi'
import { fmt, pFmt, signed } from '../services/format'
import { useTheme } from '../services/theme-context'

const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

function Fit({ bounds }: { bounds: [number, number, number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds([[bounds[1], bounds[0]], [bounds[3], bounds[2]]], { padding: [28, 28], maxZoom: 8 })
  }, [map, bounds])
  return null
}

function featureColor(feature: MerraPixelFeature) {
  if (!feature.properties.significant) return '#8EA0B8'
  return feature.properties.trend === 'increasing' ? '#FF9F5A' : '#4DA3FF'
}

export default function Merra2Map({ result }: { result: MerraFeatureCollection }) {
  const { theme } = useTheme()
  const { bounding_box: bounds, variable, units, grid } = result.metadata
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  const maxAbsSlope = Math.max(0, ...result.features.map((feature) => Math.abs(feature.properties.slope ?? 0)))

  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-line" style={{ height: 480 }}>
      <MapContainer bounds={[[bounds[1], bounds[0]], [bounds[3], bounds[2]]]} style={{ width: '100%', height: '100%' }}
        minZoom={1} maxZoom={12} scrollWheelZoom preferCanvas>
        <TileLayer url={tileUrl} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={12} />
        <Fit bounds={bounds} />
        {result.features.map((feature) => {
          const point = feature.geometry.coordinates
          const props = feature.properties
          const color = featureColor(feature)
          const magnitude = maxAbsSlope > 0 ? Math.abs(props.slope ?? 0) / maxAbsSlope : 0
          return (
            <CircleMarker key={`${point[0]}-${point[1]}`} center={[point[1], point[0]]} radius={5 + 4 * magnitude}
              pathOptions={{ color, fillColor: color, fillOpacity: props.significant ? 0.82 : 0.32, weight: 1.2 }}>
              <Popup>
                <div className="min-w-52 space-y-1 text-sm">
                  <b>{props.lat.toFixed(3)}° lat, {props.lon.toFixed(3)}° lon</b>
                  <div>{variable}: {signed(props.slope, 4)} {units ?? 'units'}/month</div>
                  <div>95% CI: {fmt(props.slope_ci_95[0], 4)} to {fmt(props.slope_ci_95[1], 4)} {units ?? 'units'}/month</div>
                  <div>Modified Mann–Kendall p = {pFmt(props.p_value)} · τ = {fmt(props.tau, 3)}</div>
                  <div>{props.significant ? `Significant ${props.trend} trend` : 'No significant trend'} at α = {result.metadata.alpha}</div>
                  <div>{props.n_valid} valid observations of {grid.time_steps}</div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-xl border border-line bg-bg2/90 px-3 py-2.5 text-[11px] backdrop-blur">
        <div className="label mb-1.5">Modified Mann–Kendall trend</div>
        <div className="space-y-1 text-ink">
          <div><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#FF9F5A]" />Significant increase</div>
          <div><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#4DA3FF]" />Significant decrease</div>
          <div><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#8EA0B8]" />Not significant</div>
        </div>
      </div>
      <div className="absolute right-3 top-3 z-[500] rounded-lg border border-line bg-bg2/90 px-2.5 py-1.5 text-[10px] text-neutral backdrop-blur">
        {grid.pixels_analyzed.toLocaleString()} of {grid.pixels_total.toLocaleString()} pixels analyzed
      </div>
    </div>
  )
}
