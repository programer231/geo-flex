import { Card, DataBadge, PageHeader } from '../components/ui'
import { useStore } from '../services/store'

const Q = [['WHAT', 'Variables with measurable change', 'Discover Earth screens every connected variable.'], ['WHERE', 'Regions and grid cells', 'Per-cell Mann-Kendall maps with FDR control.'], ['HOW', 'Direction and acceleration', 'Mann-Kendall direction, curvature test.'],
  ['HOW MUCH', 'Rate in real units', "Sen's slope per decade with 95% CI."], ['SIGNIFICANT?', 'Beyond random fluctuation', 'p-values with autocorrelation and multiple-test corrections.']]

export default function About() {
  const { status, refreshStatus } = useStore()
  return (
    <div className="max-w-5xl">
      <PageHeader title="About GEO-FLEX" subtitle="Understand Earth. Detect Change. Reveal the Future." />
      <Card className="mb-5"><p className="text-sm leading-relaxed text-ink/90">GEO-FLEX is an AI-assisted Earth science change-detection prototype built for the NASA Space Apps Challenge. It lets anyone choose a measured Earth science variable, a region and a period, and returns what is changing, where, how, by how much — and whether the change is statistically significant. It was designed so that a variable can trend one way in one region and the opposite way in another, and say so clearly.</p></Card>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Q.map(([k, t, d]) => <Card key={k}><div className="font-display text-sm font-semibold text-cyan">{k}</div><div className="mt-1 text-sm">{t}</div><div className="mt-1 text-xs text-neutral">{d}</div></Card>)}</div>
      <h2 className="mb-3 font-display text-lg font-semibold">Scientific principles</h2>
      <Card className="mb-5"><ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
        <li>Every statistic is computed by code in <code>backend/app/statistics</code> and is unit-tested (including against <code>pymannkendall</code>).</li>
        <li>Significance is never inferred from how a chart looks; α is configurable (default 0.05).</li>
        <li>Autocorrelation is handled in Mann-Kendall and regression; seasonality is removed before trend testing; multiple comparisons use Benjamini–Hochberg.</li>
        <li>Anomalies (unusual single readings) are reported separately from trends.</li>
        <li>Grid maps never claim more spatial precision than the dataset supports; sparse cells are shown hollow.</li>
        <li>Data are always labelled LIVE, HISTORICAL or DEMONSTRATION. Demonstration data are synthetic and never NASA observations.</li></ul></Card>
      <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Data connectors</h2><button className="btn-ghost !py-1.5 !text-xs" onClick={() => refreshStatus(true)}>Re-check connectivity</button></div>
      <div className="grid gap-3 md:grid-cols-2">
        {status?.connectors.map((c) => (
          <Card key={c.id}><div className="flex items-start justify-between gap-2"><div className="font-display text-sm font-semibold">{c.name}</div><DataBadge status={c.is_demo ? 'DEMONSTRATION DATA' : status.nasa_power_reachable ? 'LIVE DATA' : 'HISTORICAL DATA'} compact /></div>
            <p className="mt-1 text-xs text-neutral">{c.description}</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]"><dt className="text-neutral">Coverage</dt><dd>{c.spatial_coverage} · {c.temporal_coverage}</dd><dt className="text-neutral">Resolution</dt><dd>{c.spatial_resolution} · {c.temporal_resolution}</dd><dt className="text-neutral">Retrieval</dt><dd>{c.retrieval_method}</dd><dt className="text-neutral">Auth</dt><dd>{c.requires_auth ? 'Required — see README' : 'None'}</dd><dt className="text-neutral">Variables</dt><dd>{c.variables.join(', ')}</dd></dl>
            <p className="mt-2 text-[11px] text-neutral">{c.attribution}</p></Card>))}
      </div>
      <Card className="mt-5 text-xs text-neutral">Planned connectors (not yet integrated, shown as unavailable in the Data Explorer): NASA Earthdata (MODIS NDVI, soil moisture, sea level), Giovanni, GIBS imagery layers beyond the basemap. NASA Earthdata requires a free account and token — see the README.</Card>

    </div>
  )
}
