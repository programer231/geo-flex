import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { TourProvider } from './components/DemoTour'
import { RunOverlay } from './components/RunOverlay'
import { Card, Skeleton, Toasts } from './components/ui'
import { StoreProvider, useStore } from './services/store'
import { ThemeProvider } from './services/theme'
import { useTheme } from './services/theme-context'
import { MathJaxProvider } from './services/mathjax'

const Overview = lazy(() => import('./pages/Overview'))
const Explore = lazy(() => import('./pages/Explore'))
const DataExplorer = lazy(() => import('./pages/DataExplorer'))
const ChangeAnalysis = lazy(() => import('./pages/ChangeAnalysis'))
const Discover = lazy(() => import('./pages/Discover'))
const Insights = lazy(() => import('./pages/Insights'))
const Reports = lazy(() => import('./pages/Reports'))
const About = lazy(() => import('./pages/About'))
const Team = lazy(() => import('./pages/Team'))
const Welcome = lazy(() => import('./pages/Welcome'))
const LoginPage = lazy(() => import('./pages/Authentication').then((module) => ({ default: module.LoginPage })))
const SignupPage = lazy(() => import('./pages/Authentication').then((module) => ({ default: module.SignupPage })))
const KidsMode = lazy(() => import('./pages/KidsMode'))
const SolarSiteIntelligence = lazy(() => import('./pages/SolarSiteIntelligence'))
const StatisticalGuide = lazy(() => import('./pages/StatisticalGuide'))
const Merra2Analysis = lazy(() => import('./pages/Merra2Analysis'))

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/overview', label: 'Overview' },
  { to: '/explore', label: 'Earth Explorer' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/merra2', label: 'MERRA-2' },
  { to: '/discover', label: 'Discovery' },
  { to: '/insights', label: 'Insights' },
  { to: '/kids', label: 'Learning Lab' },
  { to: '/solar', label: 'Solar Site Intelligence' },
  { to: '/guide', label: 'Statistics Guide' },
  { to: '/team', label: 'The Team' },
]

function TopNav() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [active, setActive] = useState('overview')
  const isGuest = sessionStorage.getItem('geoflex-access') === 'guest'

  useEffect(() => {
    const sectionMap: Record<string, string> = {
      '/overview': 'overview',
      '/explore': 'earth-explorer',
      '/analysis': 'analysis',
      '/merra2': 'merra2-analysis',
      '/discover': 'discovery',
      '/insights': 'ai-assistant',
      '/kids': 'learning-lab',
      '/solar': 'solar-sites',
      '/guide': 'statistics-guide',
      '/team': 'team',
    }

    const current = sectionMap[location.pathname] ?? 'overview'
    setActive(current)

    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
    if (!targets.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) {
          const id = visible.target.getAttribute('data-section') ?? current
          setActive(id)
        }
      },
      { threshold: [0.2, 0.4, 0.7], rootMargin: '-12% 0px -25% 0px' },
    )

    targets.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [location.pathname])

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <NavLink to="/" end className="brand" aria-label="GEO-FLEX welcome">
          <span className="brand-mark">GF</span>
          <span className="brand-copy">
            <strong>GEO-FLEX</strong>
            <small>Earth Intelligence</small>
          </span>
        </NavLink>

        <nav className="top-nav-links" aria-label="Main navigation">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              end={label === 'Home' || to === '/'}
              className={({ isActive }) => {
                const routeActive =
                  isActive ||
                  (label === 'Home' && (location.pathname === '/' || active === 'home')) ||
                  (label === 'Overview' && active === 'overview') ||
                  (label === 'Earth Explorer' && active === 'earth-explorer') ||
                  (label === 'Analysis' && active === 'analysis') ||
                  (label === 'MERRA-2' && location.pathname === '/merra2') ||
                  (label === 'Discovery' && active === 'discovery') ||
                  (label === 'Insights' && active === 'ai-assistant') ||
                  (label === 'Learning Lab' && location.pathname === '/kids') ||
                  (label === 'Solar Site Intelligence' && location.pathname === '/solar') ||
                  (label === 'Statistics Guide' && location.pathname === '/guide') ||
                  (label === 'The Team' && (location.pathname.startsWith('/team') || active === 'team'))
                return `top-nav-link ${routeActive ? 'active' : ''}`
              }}
            >
              {label}
            </NavLink>
          ))}
          {isGuest && <span className="guest-access-status"><span aria-hidden="true" /> GUEST ACCESS</span>}
        </nav>
        <button
          type="button"
          className="global-theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-pressed={theme === 'light'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun aria-hidden="true" size={15} /> : <Moon aria-hidden="true" size={15} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  )
}

function SectionRoute({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} data-section={id} className="section-shell">
      {children}
    </section>
  )
}

function Shell() {
  const loc = useLocation()
  const { bootError } = useStore()
  const entryRoute = ['/', '/welcome', '/login', '/signup', '/kids'].includes(loc.pathname)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [loc.pathname])

  return (
    <div className="min-h-full">
      {!entryRoute && <TopNav />}
      <main className={entryRoute ? 'entry-main' : 'main-shell'}>
        <div className={entryRoute ? 'entry-content' : 'mx-auto w-full max-w-[1600px] px-4 pb-10 pt-24 sm:px-6 lg:px-8'}>
          {!entryRoute && bootError && (
            <Card className="mb-6 border-neg/40 text-sm">
              <b className="text-neg">Cannot reach the GEO-FLEX API.</b> Start the backend: <code className="rounded bg-white/10 px-1.5 py-0.5">cd backend &amp;&amp; uvicorn app.main:app --port 5000</code> ({bootError})
            </Card>
          )}
          <Suspense fallback={<div className="space-y-4"><Skeleton className="h-12 w-72" /><Skeleton className="h-64" /></div>}>
            <AnimatePresence mode="wait">
              <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <Routes location={loc}>
                  <Route path="/" element={<Welcome />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/kids" element={<KidsMode />} />
                  <Route path="/solar" element={<SectionRoute id="solar-sites"><SolarSiteIntelligence /></SectionRoute>} />
                  <Route path="/guide" element={<SectionRoute id="statistics-guide"><StatisticalGuide /></SectionRoute>} />
                  <Route path="/overview" element={<SectionRoute id="overview"><Overview /></SectionRoute>} />
                  <Route path="/explore" element={<SectionRoute id="earth-explorer"><Explore /></SectionRoute>} />
                  <Route path="/data" element={<SectionRoute id="earth-explorer"><DataExplorer /></SectionRoute>} />
                  <Route path="/analysis" element={<SectionRoute id="analysis"><ChangeAnalysis /></SectionRoute>} />
                  <Route path="/merra2" element={<SectionRoute id="merra2-analysis"><Merra2Analysis /></SectionRoute>} />
                  <Route path="/discover" element={<SectionRoute id="discovery"><Discover /></SectionRoute>} />
                  <Route path="/insights" element={<SectionRoute id="ai-assistant"><Insights /></SectionRoute>} />
                  <Route path="/reports" element={<SectionRoute id="ai-assistant"><Reports /></SectionRoute>} />
                  <Route path="/about" element={<SectionRoute id="overview"><About /></SectionRoute>} />
                  <Route path="/team" element={<SectionRoute id="team"><Team /></SectionRoute>} />
                  <Route path="*" element={<SectionRoute id="overview"><Overview /></SectionRoute>} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>
      <RunOverlay />
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MathJaxProvider>
        <ThemeProvider>
          <StoreProvider>
            <TourProvider>
              <Shell />
            </TourProvider>
          </StoreProvider>
        </ThemeProvider>
      </MathJaxProvider>
    </BrowserRouter>
  )
}
