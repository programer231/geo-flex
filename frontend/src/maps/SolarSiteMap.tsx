import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { SolarSample } from '../services/api'
import type { Theme } from '../services/theme-context'

type Coordinate = [number, number]
export type SolarLayer = 'score' | 'ghi' | 'temperature'

interface Props {
  polygon: Coordinate[]
  drawing: boolean
  samples: SolarSample[]
  layer: SolarLayer
  theme: Theme
  onAddPoint: (point: Coordinate) => void
  onMovePoint: (index: number, point: Coordinate) => void
}

const VERTEX_ICON = L.divIcon({
  className: 'solar-map-vertex',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function MapClicks({ drawing, onAddPoint }: Pick<Props, 'drawing' | 'onAddPoint'>) {
  useMapEvents({
    click(event) {
      if (drawing) onAddPoint([event.latlng.lng, event.latlng.lat])
    },
  })
  return null
}

function FitPolygon({ polygon, enabled }: { polygon: Coordinate[]; enabled: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (enabled && polygon.length >= 3) {
      map.fitBounds(L.latLngBounds(polygon.map(([lon, lat]) => [lat, lon])), { padding: [28, 28], maxZoom: 8 })
    }
  }, [map, polygon, enabled])
  return null
}

function interpolateColor(value: number, min: number, max: number) {
  const colors = ['#d85c5c', '#ec9c57', '#e7d36b', '#70bd83', '#378a74']
  const t = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)))
  const position = t * (colors.length - 1)
  const index = Math.min(colors.length - 2, Math.floor(position))
  const mix = position - index
  const channel = (offset: number) => {
    const from = parseInt(colors[index].slice(offset, offset + 2), 16)
    const to = parseInt(colors[index + 1].slice(offset, offset + 2), 16)
    return Math.round(from + (to - from) * mix).toString(16).padStart(2, '0')
  }
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

function layerValue(sample: SolarSample, layer: SolarLayer) {
  if (layer === 'score') return sample.scores.overall
  if (layer === 'ghi') return sample.mean_daily_ghi_kwh_m2
  return sample.mean_air_temperature_2m_c
}

export default function SolarSiteMap({
  polygon, drawing, samples, layer, theme, onAddPoint, onMovePoint,
}: Props) {
  const values = samples.map((sample) => layerValue(sample, layer)).filter((value): value is number => value !== null)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const vertices = drawing ? polygon : polygon.slice(0, -1)
  const tiles = {
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
    attribution: 'Imagery © NASA GIBS / Blue Marble',
    maxNativeZoom: 8,
  }
  const polygonPositions: L.LatLngExpression[] = polygon.map(([lon, lat]) => [lat, lon])

  return (
    <div className={`solar-map-frame solar-map-frame--${theme}`}>
      <MapContainer
        center={[31.8, -7.2]}
        zoom={4}
        minZoom={2}
        maxZoom={12}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={tiles.url} attribution={tiles.attribution} subdomains="abcd" maxZoom={12} maxNativeZoom={tiles.maxNativeZoom} />
        <MapClicks drawing={drawing} onAddPoint={onAddPoint} />
        <FitPolygon polygon={polygon} enabled={!drawing} />
        {polygon.length >= 3 && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{
              color: '#55d6e5',
              weight: 2,
              fillColor: '#39b8c5',
              fillOpacity: drawing ? 0.06 : 0.12,
              dashArray: drawing ? '7 6' : undefined,
            }}
          />
        )}
        {vertices.map(([lon, lat], index) => (
          <Marker
            key={`vertex-${index}-${lon}-${lat}`}
            position={[lat, lon]}
            icon={VERTEX_ICON}
            draggable={!drawing}
            eventHandlers={{
              dragend(event) {
                const point = event.target.getLatLng()
                onMovePoint(index, [point.lng, point.lat])
              },
            }}
          >
            {!drawing && <Tooltip>Drag to edit this corner</Tooltip>}
          </Marker>
        ))}
        {samples.map((sample) => {
          const value = layerValue(sample, layer)
          const fill = value === null ? '#8794a2' : interpolateColor(value, min, max)
          return (
            <CircleMarker
              key={`${sample.latitude}_${sample.longitude}`}
              center={[sample.latitude, sample.longitude]}
              radius={value === null ? 6 : 8}
              pathOptions={{ color: '#fff', weight: 1.5, fillColor: fill, fillOpacity: 0.92 }}
            >
              <Tooltip>
                <b>{sample.latitude.toFixed(3)}°, {sample.longitude.toFixed(3)}°</b>
                <br />
                {sample.mean_daily_ghi_kwh_m2 === null ? 'GHI unavailable' : `${sample.mean_daily_ghi_kwh_m2.toFixed(2)} kWh/m²/day`}
                {sample.scores.overall === null ? '' : ` · relative score ${sample.scores.overall.toFixed(1)}`}
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
      {samples.length > 0 && (
        <div className="solar-map-legend" aria-label="Map color scale, relative to sampled points">
          <span>{layer === 'score' ? 'Relative score' : layer === 'ghi' ? 'Mean daily GHI' : 'Mean air temperature'}</span>
          <i aria-hidden="true" />
          <span>{layer === 'score' ? 'Higher within area' : 'Lower → higher in sampled area'}</span>
        </div>
      )}
      {drawing && <div className="solar-map-instruction" role="status">Tap or click the map to add boundary corners.</div>}
    </div>
  )
}
