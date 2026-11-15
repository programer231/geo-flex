import type { CSSProperties } from 'react'

export type MascotKind = 'earth' | 'sun' | 'water' | 'leaf' | 'cloud'

export function Mascot({ kind, className = '' }: { kind: MascotKind; className?: string }) {
  return (
    <svg
      className={`kids-mascot kids-mascot--${kind} ${className}`}
      viewBox="0 0 180 180"
      role="img"
      aria-label={`${kind === 'earth' ? 'Earthy' : kind === 'sun' ? 'Sunny' : kind === 'water' ? 'Droppy' : kind === 'leaf' ? 'Leafy' : 'Cloudy'}, GEO-FLEX friend`}
    >
      {kind === 'earth' && (
        <>
          <circle className="mascot-body" cx="90" cy="90" r="67" />
          <path className="mascot-land" d="M47 57l14-10 15 3 6 10-7 9 2 10-12 5-7 14-9-4-5-13-10-4 3-13 10-7zM99 35l12 2 5 9-5 8 7 9-7 10-12-1-4-9-11-3 2-11 9-4zM112 92l14-4 13 8-2 14-9 5-2 13-13 8-10-8 5-12-6-10zM76 111l10 5 2 11-8 8-10-6 1-12z" />
          <path className="mascot-arm" d="M31 108c-9 7-14 3-16-3M148 108c9 7 14 3 16-3" />
        </>
      )}
      {kind === 'sun' && (
        <>
          <g className="mascot-rays">
            <path d="M90 5v17M90 158v17M5 90h17M158 90h17M30 30l12 12M138 138l12 12M150 30l-12 12M42 138l-12 12" />
          </g>
          <circle className="mascot-body" cx="90" cy="90" r="58" />
        </>
      )}
      {kind === 'water' && (
        <path className="mascot-body" d="M90 17C78 38 38 77 38 111a52 52 0 00104 0c0-34-40-73-52-94z" />
      )}
      {kind === 'leaf' && (
        <>
          <path className="mascot-body" d="M151 25C91 24 38 42 32 91c-4 34 22 58 51 54 46-6 67-62 68-120z" />
          <path className="mascot-detail" d="M48 128c24-30 48-52 82-81" />
          <path className="mascot-leaf" d="M73 87c-2-16-12-24-25-27 0 17 7 27 25 27zM100 67c1-16 10-25 23-29 1 17-5 28-23 29zM79 111c3 15-2 26-12 34-7-15-5-26 12-34z" />
        </>
      )}
      {kind === 'cloud' && (
        <path className="mascot-body" d="M47 132a34 34 0 01-1-68 47 47 0 0189 12 30 30 0 01-2 56z" />
      )}
      <g className="mascot-face">
        <ellipse cx="70" cy="83" rx="5" ry="8" />
        <ellipse cx="108" cy="83" rx="5" ry="8" />
        <path d="M73 105c9 11 22 11 32 0" />
      </g>
      <ellipse className="mascot-blush" cx="56" cy="98" rx="8" ry="4" />
      <ellipse className="mascot-blush" cx="122" cy="98" rx="8" ry="4" />
      <path className="mascot-glint" d="M55 49a39 39 0 0122-15" />
    </svg>
  )
}

export function KidsLandscape() {
  return (
    <svg className="kids-landscape" viewBox="0 0 900 390" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="kids-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#91d9f4" />
          <stop offset="1" stopColor="#d7f4e3" />
        </linearGradient>
        <linearGradient id="kids-hill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#8edc9a" />
          <stop offset="1" stopColor="#4dbb82" />
        </linearGradient>
      </defs>
      <rect width="900" height="390" fill="url(#kids-sky)" />
      <circle cx="735" cy="78" r="39" fill="#ffd86f" />
      <path d="M0 235l142-115 127 119 120-151 152 165 136-117 223 122v132H0z" fill="#91b9d1" />
      <path d="M61 207l81-87 78 73-43-17-35 22-33-10zM310 184l79-96 88 105-54-20-34 25-35-14zM628 205l49-72 72 77-41-17-28 17-26-10z" fill="#f3fbff" />
      <path d="M0 265c123-68 242-31 359-4 129 30 216-35 315-27 94 8 167 57 226 76v80H0z" fill="url(#kids-hill)" />
      <path d="M0 319c123-24 211-51 326-26s204 23 295 9 190-24 279 1v87H0z" fill="#74cb83" />
      <path d="M390 390c-2-48 38-72 96-66 44 5 67 31 107 34 51 4 76-20 116-17" fill="none" stroke="#90dce8" strokeWidth="17" strokeLinecap="round" />
      <g fill="#398a66">
        <path d="M113 254h13v55h-13z" /><circle cx="119" cy="242" r="24" fill="#368f69" /><circle cx="103" cy="253" r="17" fill="#4aab76" /><circle cx="136" cy="255" r="17" fill="#5bb67d" />
        <path d="M777 246h13v53h-13z" /><circle cx="784" cy="235" r="23" fill="#368f69" /><circle cx="767" cy="247" r="16" fill="#4aab76" /><circle cx="800" cy="248" r="17" fill="#5bb67d" />
      </g>
      <g fill="#fef8d5">
        <circle cx="220" cy="294" r="4" /><circle cx="236" cy="284" r="3" /><circle cx="700" cy="305" r="4" /><circle cx="721" cy="298" r="3" />
      </g>
    </svg>
  )
}

export function DestinationArt({ scene, className = '' }: { scene: string; className?: string }) {
  const style = { '--scene-tone': scene } as CSSProperties
  return (
    <div className={`kids-destination-art kids-scene--${scene} ${className}`} style={style} aria-hidden="true">
      <span className="kids-scene-sun" />
      <span className="kids-scene-cloud kids-scene-cloud--one" />
      <span className="kids-scene-cloud kids-scene-cloud--two" />
      <span className="kids-scene-mountain kids-scene-mountain--back" />
      <span className="kids-scene-mountain kids-scene-mountain--front" />
      <span className="kids-scene-ground" />
      <span className="kids-scene-river" />
      <span className="kids-scene-tree kids-scene-tree--one" />
      <span className="kids-scene-tree kids-scene-tree--two" />
      {scene === 'solar' && <span className="kids-scene-solar-panel"><i /><i /><i /><i /></span>}
      {scene === 'forest' && <span className="kids-scene-flowers">✿　✿</span>}
      {scene === 'weather' && <span className="kids-scene-raindrops">•••</span>}
      {scene === 'habitats' && <span className="kids-scene-animals">🦊　🦦　🐪</span>}
      {scene === 'water' && <span className="kids-scene-water-drop" />}
    </div>
  )
}

export function ClimateComparison() {
  return (
    <div className="kids-climate-comparison" aria-label="Made-up picture comparison: the later scene has less snow">
      <div className="kids-climate-scene kids-climate-scene--earlier">
        <span className="kids-climate-sun" />
        <span className="kids-climate-hill"><i /></span>
        <span className="kids-climate-label">Earlier scene</span>
      </div>
      <ArrowBetweenScenes />
      <div className="kids-climate-scene kids-climate-scene--later">
        <span className="kids-climate-sun" />
        <span className="kids-climate-hill"><i /></span>
        <span className="kids-climate-label">Later scene</span>
      </div>
    </div>
  )
}

function ArrowBetweenScenes() {
  return <span className="kids-climate-arrow" aria-hidden="true">→</span>
}
