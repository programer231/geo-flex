import { ArrowRight, BookOpenText, Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Mascot } from './KidsWorldArt'
import { useTheme } from '../services/theme-context'

function LearningWorldArt() {
  return (
    <svg className="welcome-learning-scene" viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="learning-world-sky" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#0A1B33" />
          <stop offset="1" stopColor="#103E5B" />
        </linearGradient>
        <radialGradient id="learning-world-glow">
          <stop offset="0" stopColor="#50C5D2" stopOpacity=".42" />
          <stop offset="1" stopColor="#50C5D2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="420" fill="url(#learning-world-sky)" />
      <circle cx="455" cy="142" r="155" fill="url(#learning-world-glow)" />
      <g fill="#B5F1F1" opacity=".8">
        <circle cx="112" cy="84" r="2" /><circle cx="218" cy="132" r="1.5" /><circle cx="540" cy="72" r="2" />
        <circle cx="582" cy="214" r="1.5" /><circle cx="310" cy="58" r="1.5" />
      </g>
      <path d="M0 285c96-78 167-86 257-35 77 44 131 25 189-15 76-51 136-24 194 19v166H0z" fill="#0B2D4B" />
      <path d="M0 326c102-39 177-40 277 2 108 45 191 20 363-32v124H0z" fill="#104864" />
      <path d="M0 378c126-34 235-11 327 8 104 22 207 12 313-18v52H0z" fill="#167184" opacity=".72" />
      <path d="M50 326c77-17 127-15 196 6M416 324c68-27 111-36 167-35" fill="none" stroke="#6DD5D5" strokeOpacity=".4" strokeWidth="2" />
      <g fill="none" stroke="#64C9C9" strokeLinecap="round" strokeWidth="3" opacity=".55">
        <path d="M77 302v-31m0 12-12-11m12 18 12-12" />
        <path d="M546 290v-38m0 14-14-13m14 22 14-15" />
      </g>
    </svg>
  )
}

function GuideWorldArt() {
  return (
    <span className="welcome-guide-art" aria-hidden="true">
      <span className="welcome-guide-orbit" />
      <span className="welcome-guide-symbol welcome-guide-symbol--sigma">Σ</span>
      <span className="welcome-guide-symbol welcome-guide-symbol--mu">μ</span>
      <span className="welcome-guide-symbol welcome-guide-symbol--zero">H₀</span>
      <span className="welcome-guide-book"><BookOpenText /></span>
    </span>
  )
}

export default function Welcome() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={`welcome-screen welcome-screen--${theme}`}>
      <header className="welcome-header">
        <div className="welcome-brand">
          <h1>GEO-FLEX</h1>
          <p>Explore Earth&apos;s changing systems.</p>
        </div>
        <button
          type="button"
          className="welcome-theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-pressed={theme === 'light'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
      </header>

      <section className="welcome-destinations" aria-label="Choose your GEO-FLEX experience">
        <Link
          to="/explore"
          className="welcome-destination welcome-destination--earth"
          onClick={() => sessionStorage.setItem('geoflex-access', 'guest')}
        >
          <img className="welcome-earth-image" src="/earth-hero.jpg" alt="" fetchPriority="high" />
          <span className="welcome-earth-atmosphere" aria-hidden="true" />
          <span className="welcome-destination-content">
            <span className="welcome-destination-kicker">01 · EARTH SCIENCE</span>
            <strong className="welcome-destination-title">Explore Earth</strong>
            <span className="welcome-destination-description">Discover environmental changes through Earth science data.</span>
            <span className="welcome-destination-action">Enter Earth Explorer <ArrowRight aria-hidden="true" /></span>
          </span>
        </Link>

        <Link to="/kids" className="welcome-destination welcome-destination--learning">
          <span className="welcome-learning-art" aria-hidden="true">
            <LearningWorldArt />
            <span className="welcome-learning-orbit" />
            <Mascot kind="earth" className="welcome-learning-earth" />
          </span>
          <span className="welcome-destination-content">
            <span className="welcome-destination-kicker">02 · PLAY & DISCOVER</span>
            <strong className="welcome-destination-title">Learning Lab</strong>
            <span className="welcome-destination-description">Discover, experiment and learn about our planet.</span>
            <span className="welcome-destination-action">Enter Kids World <ArrowRight aria-hidden="true" /></span>
          </span>
        </Link>

        <Link to="/solar" className="welcome-destination welcome-destination--solar">
          <span className="welcome-solar-art" aria-hidden="true">
            <svg viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="solar-sky" x1="0" x2="0.9" y1="0" y2="1">
                  <stop offset="0" stopColor="#0A1B31" />
                  <stop offset="1" stopColor="#1B4E62" />
                </linearGradient>
                <radialGradient id="solar-glow">
                  <stop offset="0" stopColor="#FFD98B" stopOpacity=".72" />
                  <stop offset="1" stopColor="#FFC45D" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="640" height="420" fill="url(#solar-sky)" />
              <circle cx="460" cy="115" r="155" fill="url(#solar-glow)" />
              <circle cx="460" cy="115" r="42" fill="#FFD47D" />
              <path d="M0 266c118-38 205-45 314-8 118 39 210 8 326-35v197H0z" fill="#244F55" />
              <path d="M0 327c136-32 248-16 361 16 87 24 174 8 279-21v98H0z" fill="#30735D" />
              <g transform="translate(145 220) skewY(-8)">
                <path d="M0 0h225l-26 108H-26z" fill="#132B4A" stroke="#81DCE8" strokeWidth="3" />
                <path d="M18 7 1 101m57-94-11 94m58-94-5 94m59-94 1 94m58-94 8 94M-9 37h222m-230 34h222" fill="none" stroke="#58BCD5" strokeWidth="2" opacity=".8" />
                <path d="M-18 113h218m-169 0-22 31m137-31 22 31" fill="none" stroke="#A8D9DD" strokeWidth="4" strokeLinecap="round" />
              </g>
              <path d="M0 380c121-22 223-9 321 13 95 21 191 16 319-9v36H0z" fill="#519274" opacity=".8" />
            </svg>
          </span>
          <span className="welcome-destination-content">
            <span className="welcome-destination-kicker">03 · SOLAR RESOURCE</span>
            <strong className="welcome-destination-title">Solar Site Intelligence</strong>
            <span className="welcome-destination-description">Screen a region with real NASA POWER solar data.</span>
            <span className="welcome-destination-action">Explore solar potential <ArrowRight aria-hidden="true" /></span>
          </span>
        </Link>

        <Link to="/guide" className="welcome-destination welcome-destination--guide">
          <GuideWorldArt />
          <span className="welcome-destination-content">
            <span className="welcome-destination-kicker">04 · HIGH SCHOOL SCIENCE</span>
            <strong className="welcome-destination-title">High School Guide</strong>
            <span className="welcome-destination-description">Understand the statistics behind Earth&apos;s changing data.</span>
            <span className="welcome-destination-action">Open the full guide <ArrowRight aria-hidden="true" /></span>
          </span>
        </Link>
      </section>

    </div>
  )
}
