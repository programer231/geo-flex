import { Download } from 'lucide-react'
import Plotly from 'plotly.js-cartesian-dist-min'
import createPlotlyComponent from 'react-plotly.js/factory'
import { useRef, type ReactNode } from 'react'
import type { Config, Data, Layout } from 'plotly.js'
import { COLORS, downloadBlob } from '../services/format'
import { Card } from '../components/ui'
import { useTheme } from '../services/theme-context'

// react-plotly.js is CommonJS; unwrap the default export under ESM bundlers.
const factory = ((createPlotlyComponent as unknown as { default?: typeof createPlotlyComponent }).default ?? createPlotlyComponent)
const PlotlyPlot = factory(Plotly)

export const baseLayout = (extra: Partial<Layout> = {}): Partial<Layout> => ({
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, system-ui, sans-serif', color: COLORS.text, size: 12 },
  margin: { l: 56, r: 18, t: 16, b: 44 },
  hovermode: 'x unified',
  hoverlabel: { bgcolor: '#0D1422', bordercolor: 'rgba(148,163,184,0.3)', font: { color: '#F5F7FA', size: 12 } },
  xaxis: { gridcolor: COLORS.grid, zerolinecolor: COLORS.grid, linecolor: 'rgba(148,163,184,0.25)', tickfont: { size: 11 } },
  yaxis: { gridcolor: COLORS.grid, zerolinecolor: COLORS.grid, linecolor: 'rgba(148,163,184,0.25)', tickfont: { size: 11 } },
  legend: { orientation: 'h', y: 1.12, x: 0, font: { size: 11 } },
  ...extra,
})

const config: Partial<Config> = { displaylogo: false, responsive: true, displayModeBar: 'hover', modeBarButtonsToRemove: ['lasso2d', 'select2d', 'sendChartToCloud'] }

interface Props {
  title: string
  subtitle?: ReactNode
  data: Data[]
  layout?: Partial<Layout>
  height?: number
  filename: string
  footer?: ReactNode
  actions?: ReactNode
}

/** Card + Plotly figure with "download PNG". */
export function ChartCard({ title, subtitle, data, layout, height = 340, filename, footer, actions }: Props) {
  const gd = useRef<HTMLElement | null>(null)
  const { theme } = useTheme()
  const download = async () => {
    if (!gd.current) return
    const url: string = await (Plotly as any).toImage(gd.current, { format: 'png', width: 1400, height: Math.round(height * 1.6), scale: 2 })
    const blob = await (await fetch(url)).blob()
    downloadBlob(blob, `${filename}.png`)
  }
  return (
    <Card className="min-w-0">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-neutral">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button onClick={download} title="Download chart as PNG" aria-label="Download chart as PNG" className="rounded-lg border border-line p-1.5 text-neutral hover:bg-white/10 hover:text-ink">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <PlotlyPlot data={data} layout={baseLayout({
        ...layout,
        font: { ...layout?.font, color: theme === 'dark' ? COLORS.text : '#26394D' },
        height,
      })} config={config} useResizeHandler style={{ width: '100%', height }}
        onInitialized={(_f: unknown, g: HTMLElement) => { gd.current = g }} onUpdate={(_f: unknown, g: HTMLElement) => { gd.current = g }} />
      {footer && <div className="mt-2 text-xs text-neutral">{footer}</div>}
    </Card>
  )
}
