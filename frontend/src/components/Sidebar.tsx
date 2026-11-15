import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Bot, ChevronsLeft, ChevronsRight, Compass, Database, FileText, Globe2, LayoutDashboard, LineChart, Menu, Settings, Sparkles, User, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useStore } from '../services/store'
import { Modal } from './ui'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/explore', label: 'Explore Earth', icon: Globe2 },
  { to: '/data', label: 'Data Explorer', icon: Database },
  { to: '/analysis', label: 'Change Analysis', icon: LineChart },
  { to: '/discover', label: 'Discover Earth', icon: Compass, accent: true },
  { to: '/insights', label: 'AI Insights', icon: Bot },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/about', label: 'About GEO-FLEX', icon: BookOpen },
]

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#36D6E8" /><stop offset="1" stopColor="#7C83FF" /></linearGradient></defs>
        <rect width="64" height="64" rx="16" fill="#0D1422" stroke="rgba(148,163,184,.2)" />
        <circle cx="32" cy="32" r="17" fill="none" stroke="url(#lg)" strokeWidth="4" />
        <path d="M15 38c8-10 14 6 22-4s10-6 13-9" fill="none" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      {!collapsed && <div className="leading-tight"><div className="font-display text-lg font-semibold tracking-tight">GEO-FLEX</div><div className="text-[10px] uppercase tracking-[0.14em] text-neutral">Earth Intelligence</div></div>}
    </div>
  )
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { status, setConfig, refreshStatus } = useStore()
  const [settings, setSettings] = useState(false)
  const { config } = useStore()
  const power = status?.nasa_power_reachable
  const mode = status?.mode
  const dot = power === true ? 'bg-pos' : power === false ? 'bg-[#F5B84B]' : 'bg-neutral'
  const label = power === true ? 'NASA POWER reachable' : power === false ? 'NASA POWER unreachable' : 'Checking NASA POWER…'
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-5 pt-5"><Logo collapsed={collapsed} /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, accent }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} title={collapsed ? label : undefined}
            className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/[0.07] text-ink' : 'text-neutral hover:bg-white/[0.04] hover:text-ink'}`}>
            {({ isActive }) => (<>
              {isActive && <motion.span layoutId="navbar" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-cyan" />}
              <Icon className={`h-[18px] w-[18px] shrink-0 ${accent ? 'text-violet' : isActive ? 'text-cyan' : ''}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && accent && <Sparkles className="ml-auto h-3.5 w-3.5 text-violet" />}
            </>)}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-line p-3">
        {!collapsed && (
          <div className="rounded-xl border border-line bg-white/[0.02] p-3 text-xs">
            <div className="label mb-1.5">Data sources</div>
            <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${dot}`} /><span className="text-ink/90">{label}</span></div>
            <div className="mt-1 text-neutral">Mode: <b className="text-ink/90">{mode ?? '…'}</b></div>
            <div className="mt-2 text-[10px] leading-snug text-neutral">GEO-FLEX team · Space Apps prototype</div>
          </div>
        )}
        <button onClick={() => setSettings(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral hover:bg-white/[0.04] hover:text-ink" title="Settings">
          <Settings className="h-[18px] w-[18px]" />{!collapsed && 'Settings'}
        </button>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral" title="Profile placeholder">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan/30 to-violet/30"><User className="h-4 w-4 text-ink" /></span>
          {!collapsed && <span className="text-xs">Guest researcher</span>}
        </div>
      </div>
      <Modal open={settings} onClose={() => setSettings(false)} title="Settings">
        <div className="space-y-5 text-sm">
          <div>
            <div className="label mb-2">Dataset</div>
            <select className="input" value={config.dataset} onChange={(e) => setConfig({ dataset: e.target.value })} aria-label="Dataset">
              <option value="auto">Automatic — NASA data, labelled demo fallback if unreachable</option>
              <option value="nasa_power">NASA data only (no fallback)</option>
              <option value="demo">Demonstration data (synthetic, offline)</option>
            </select>
            <p className="mt-2 text-xs text-neutral">The server default is <b>{mode}</b>. Whatever is used, every result carries a LIVE / HISTORICAL / DEMONSTRATION label.</p>
          </div>
          <div>
            <div className="label mb-2">Significance level α</div>
            <input className="input" type="number" min={0.001} max={0.2} step={0.005} value={config.alpha} onChange={(e) => setConfig({ alpha: Math.min(0.2, Math.max(0.001, +e.target.value || 0.05)) })} />
            <p className="mt-2 text-xs text-neutral">Default 0.05. Applies to the next analysis.</p>
          </div>
          <button className="btn-ghost" onClick={() => refreshStatus(true)}>Re-check NASA connectivity</button>
        </div>
      </Modal>
    </div>
  )
}

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-bg/80 backdrop-blur-xl transition-[width] duration-300 lg:block ${collapsed ? 'w-[76px]' : 'w-64'}`}>
      <SidebarBody collapsed={collapsed} />
      <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg2 text-neutral hover:text-ink">
        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur-xl">
        <Logo collapsed={false} />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-white/10"><Menu className="h-5 w-5" /></button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.22 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-line bg-bg">
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-lg p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
              <SidebarBody collapsed={false} onNavigate={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
