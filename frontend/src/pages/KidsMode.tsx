import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Award, Check, ChevronRight, Droplets, LockKeyhole, Moon, Sparkles, Star, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataBadge } from '../components/ui'
import { useStore } from '../services/store'
import { useTheme } from '../services/theme-context'
import { ClimateComparison, DestinationArt, KidsLandscape, Mascot, type MascotKind } from './KidsWorldArt'

type GameId = 'save-water' | 'climate-detective' | 'solar-adventure' | 'green-world' | 'earth-memory' | 'animal-habitats'
type Phase = 'look' | 'discover' | 'play' | 'learn' | 'celebrate'

type WorldGame = {
  id: GameId
  destination: string
  title: string
  invitation: string
  scene: string
  mascot: MascotKind
  badge: string
  look: string
  discover: string
  lesson: string
  note: string
}

const WORLD_GAMES: WorldGame[] = [
  {
    id: 'save-water',
    destination: 'Water Kingdom',
    title: 'Save the Water',
    invitation: 'Help Droppy find a kind way to use water.',
    scene: 'water',
    mascot: 'water',
    badge: 'Water Hero',
    look: 'Droppy is brushing teeth while the tap runs. The water is rushing away!',
    discover: 'Clean water is precious. We can use what we need and turn the tap off while brushing.',
    lesson: 'Turning off a tap while brushing can save water. Fixing leaks and caring for rivers also help protect water.',
    note: 'This is an everyday learning story, not a measurement of anyone’s water use.',
  },
  {
    id: 'climate-detective',
    destination: 'Climate Island',
    title: 'Climate Detective',
    invitation: 'Look closely. What changed in these two scenes?',
    scene: 'climate',
    mascot: 'cloud',
    badge: 'Climate Detective',
    look: 'A hill can look different in two pictures. A careful detective compares the clues.',
    discover: 'Weather can change day to day. Climate is the pattern we learn from many years of observations.',
    lesson: 'The later practice picture has less snow on the hill. Real climate detectives need many observations over time—not just two pictures.',
    note: 'These are made-up learning pictures, not real satellite images or observations.',
  },
  {
    id: 'solar-adventure',
    destination: 'Solar Energy Valley',
    title: 'Solar Adventure',
    invitation: 'Help Sunny turn a solar panel toward the light.',
    scene: 'solar',
    mascot: 'sun',
    badge: 'Sunshine Champion',
    look: 'Sunny brought a panel that can use sunlight to make electricity.',
    discover: 'A solar panel works best when light reaches its surface. Clouds, time, place, and the panel all matter too.',
    lesson: 'You turned the panel toward the Sun. This simple learning simulation shows direction only; it does not measure real electricity.',
    note: 'Learning simulation—not a GEO-FLEX measurement or a prediction of solar power.',
  },
  {
    id: 'green-world',
    destination: 'Forest World',
    title: 'Build a Green World',
    invitation: 'Choose helpful things for a happy little habitat.',
    scene: 'forest',
    mascot: 'leaf',
    badge: 'Forest Friend',
    look: 'Leafy is making a garden where people, plants, and wildlife can share space.',
    discover: 'Healthy places need many kinds of plants, water, soil, and safe places for living things.',
    lesson: 'Native flowers and trees can offer local wildlife food and shelter. What works best depends on the plants and animals that belong in that place.',
    note: 'This is a simple planning game. It is not a real habitat assessment.',
  },
  {
    id: 'earth-memory',
    destination: 'Weather Observatory',
    title: 'Earth Memory',
    invitation: 'Find the matching pairs hiding in the sky.',
    scene: 'weather',
    mascot: 'cloud',
    badge: 'Weather Watcher',
    look: 'Cloudy has hidden four pairs of Earth-friendly pictures.',
    discover: 'A cloud is made of tiny water drops or ice crystals. The Sun gives light and warmth. Plants and water are part of Earth’s story too.',
    lesson: 'You found every pair! Matching pictures can help us remember the many parts of a living Earth.',
    note: 'These are game cards, not live weather data.',
  },
  {
    id: 'animal-habitats',
    destination: 'Earth Discovery Center',
    title: 'Animal Habitats',
    invitation: 'Help three animal friends find their homes.',
    scene: 'habitats',
    mascot: 'earth',
    badge: 'Nature Guardian',
    look: 'A fox, an otter, and a camel are looking for places that suit them.',
    discover: 'Habitats give animals things they need, like food, water, shelter, and room to live.',
    lesson: 'Animals have different needs. A habitat match is a simple example; wild animals and ecosystems are more varied than a game.',
    note: 'These matches are learning examples, not a complete guide to animal ranges.',
  },
]

const PROGRESS_KEY = 'geoflex-kids-world-progress-v1'
const ALL_GAME_IDS = new Set(WORLD_GAMES.map((game) => game.id))
const RANKS = [
  { name: 'Little Explorer', xp: 0 },
  { name: 'Earth Explorer', xp: 200 },
  { name: 'Nature Guardian', xp: 400 },
  { name: 'GEO-FLEX Star', xp: 600 },
]

function readCompletedGames(): { completed: GameId[]; issue: string } {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY)
    if (!saved) return { completed: [], issue: '' }
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid save')
    const raw = (parsed as Record<string, unknown>).completedGames
    const completed = Array.isArray(raw)
      ? [...new Set(raw.filter((id): id is GameId => typeof id === 'string' && ALL_GAME_IDS.has(id as GameId)))]
      : []
    return { completed, issue: '' }
  } catch {
    return { completed: [], issue: 'Your saved adventure could not be read. You can still play, but progress may reset when you leave.' }
  }
}

function phaseTitle(phase: Phase) {
  return { look: 'LOOK', discover: 'DISCOVER', play: 'PLAY', learn: 'LEARN', celebrate: 'CELEBRATE' }[phase]
}

function ActivityPanel({
  game,
  onComplete,
  onBack,
}: {
  game: WorldGame
  onComplete: () => boolean
  onBack: () => void
}) {
  const [phase, setPhase] = useState<Phase>('look')
  const [answer, setAnswer] = useState<string | null>(null)
  const [answerMessage, setAnswerMessage] = useState('')
  const [worldChoices, setWorldChoices] = useState<string[]>([])
  const [panelAngle, setPanelAngle] = useState(0)
  const [flippedCards, setFlippedCards] = useState<string[]>([])
  const [matchedCards, setMatchedCards] = useState<string[]>([])
  const [memoryMessage, setMemoryMessage] = useState('Choose a card to begin.')
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null)
  const [matchedAnimals, setMatchedAnimals] = useState<string[]>([])
  const [habitatMessage, setHabitatMessage] = useState('Choose an animal, then choose its habitat.')
  const [newReward, setNewReward] = useState(false)
  const memoryTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (memoryTimer.current !== null) window.clearTimeout(memoryTimer.current)
  }, [])

  const chooseAnswer = (value: string, correct: boolean, explanation: string) => {
    setAnswer(value)
    if (correct) {
      setAnswerMessage(explanation)
      setPhase('learn')
    } else {
      setAnswerMessage('Not quite—and that is okay! Take another look and try again.')
    }
  }

  const checkGreenWorld = () => {
    const helpfulChoices = ['native-flowers', 'shade-trees', 'clean-water']
    if (helpfulChoices.every((choice) => worldChoices.includes(choice)) && !worldChoices.includes('pave-ground')) {
      setPhase('learn')
      setAnswerMessage('')
    } else {
      setAnswerMessage('Keep exploring! Try adding flowers, shade trees, and clean water.')
    }
  }

  const checkSolarPanel = () => {
    if (panelAngle >= 70) {
      setPhase('learn')
      setAnswerMessage('')
    } else {
      setAnswerMessage('Turn the panel a little more toward Sunny.')
    }
  }

  const revealMemoryCard = (cardId: string, pair: string) => {
    if (matchedCards.includes(pair) || flippedCards.includes(cardId) || flippedCards.length === 2) return
    const nextFlipped = [...flippedCards, cardId]
    setFlippedCards(nextFlipped)
    if (nextFlipped.length === 1) {
      setMemoryMessage('Now find its friend.')
      return
    }
    const first = MEMORY_CARDS.find((card) => card.id === nextFlipped[0])
    if (first?.pair === pair) {
      const nextMatched = [...matchedCards, pair]
      setMemoryMessage('A match! Nice noticing.')
      memoryTimer.current = window.setTimeout(() => {
        setMatchedCards(nextMatched)
        setFlippedCards([])
        if (nextMatched.length === 4) setPhase('learn')
      }, 450)
    } else {
      setMemoryMessage('Not a pair yet. Try another combination.')
      memoryTimer.current = window.setTimeout(() => setFlippedCards([]), 700)
    }
  }

  const matchHabitat = (habitatId: string) => {
    if (!selectedAnimal) return
    if (HABITATS.find((habitat) => habitat.id === habitatId)?.animal === selectedAnimal) {
      const nextMatched = [...matchedAnimals, selectedAnimal]
      setMatchedAnimals(nextMatched)
      setSelectedAnimal(null)
      setHabitatMessage('A great match! Choose another animal.')
      if (nextMatched.length === ANIMALS.length) setPhase('learn')
    } else {
      setSelectedAnimal(null)
      setHabitatMessage('That home does not fit this animal. Try a different one!')
    }
  }

  const collectStar = () => {
    setNewReward(onComplete())
    setPhase('celebrate')
  }

  const nextPhase = () => setPhase((current) => current === 'look' ? 'discover' : 'play')

  return (
    <section className="kids-activity" id="kids-activity" aria-labelledby="kids-activity-title" tabIndex={-1}>
      <div className="kids-activity-topline">
        <p className="kids-step-label"><Sparkles aria-hidden="true" /> {game.destination}</p>
        <button type="button" className="kids-back-button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back to the map</button>
      </div>
      <div className="kids-activity-progress" aria-label="Adventure steps">
        {(['look', 'discover', 'play', 'learn', 'celebrate'] as Phase[]).map((step) => (
          <span key={step} className={phase === step ? 'active' : ''} aria-current={phase === step ? 'step' : undefined}>
            {phaseTitle(step)}
          </span>
        ))}
      </div>
      <div className={`kids-activity-content kids-activity--${phase}`}>
        {(phase === 'look' || phase === 'discover') && (
          <div className="kids-story-screen">
            <div className="kids-story-art">
              <DestinationArt scene={game.scene} />
              <Mascot kind={game.mascot} className="kids-story-mascot" />
            </div>
            <div className="kids-story-copy">
              <p className="kids-step-label">{phaseTitle(phase)} · {game.destination}</p>
              <h2 id="kids-activity-title">{phase === 'look' ? game.title : 'A little Earth discovery'}</h2>
              <p>{phase === 'look' ? game.look : game.discover}</p>
              {phase === 'look' && <p className="kids-simulation-note">{game.note}</p>}
              <button type="button" className="kids-big-button" onClick={nextPhase}>
                {phase === 'look' ? 'Discover the idea' : 'Let’s play!'} <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {phase === 'play' && (
          <div className="kids-play-screen">
            <div className="kids-play-heading">
              <Mascot kind={game.mascot} />
              <div><p className="kids-step-label">YOUR TURN · NO RUSH</p><h2 id="kids-activity-title">{game.invitation}</h2></div>
            </div>
            {game.id === 'save-water' && (
              <div className="kids-quiz-play">
                <p className="kids-play-prompt">What should Droppy do?</p>
                <div className="kids-choice-grid">
                  {[
                    { id: 'tap-off', label: 'Turn off the tap while brushing', good: true },
                    { id: 'tap-on', label: 'Let the tap run the whole time', good: false },
                    { id: 'more-water', label: 'Use more water than needed', good: false },
                  ].map((choice) => (
                    <button key={choice.id} type="button" className={`kids-choice ${answer === choice.id ? 'selected' : ''}`} aria-pressed={answer === choice.id} onClick={() => chooseAnswer(choice.id, choice.good, game.lesson)}>
                      <span className="kids-choice-symbol">{choice.good ? <Droplets aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</span>{choice.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {game.id === 'climate-detective' && (
              <div className="kids-climate-play">
                <ClimateComparison />
                <p className="kids-play-prompt">What changed in these practice pictures?</p>
                <div className="kids-choice-grid kids-choice-grid--compact">
                  {[
                    { id: 'less-snow', label: 'There is less snow on the later hill.', good: true },
                    { id: 'river-up', label: 'The river is flowing uphill.', good: false },
                    { id: 'trees-fast', label: 'The trees grew overnight.', good: false },
                  ].map((choice) => (
                    <button key={choice.id} type="button" className={`kids-choice ${answer === choice.id ? 'selected' : ''}`} aria-pressed={answer === choice.id} onClick={() => chooseAnswer(choice.id, choice.good, game.lesson)}>
                      <span className="kids-choice-symbol"><ChevronRight aria-hidden="true" /></span>{choice.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {game.id === 'green-world' && (
              <div className="kids-build-play">
                <p className="kids-play-prompt">Tap to add helpful things to your world:</p>
                <div className="kids-build-choices">
                  {[
                    { id: 'native-flowers', label: 'Native flowers', icon: '🌼' },
                    { id: 'shade-trees', label: 'Shade trees', icon: '🌳' },
                    { id: 'clean-water', label: 'Clean water', icon: '💧' },
                    { id: 'pave-ground', label: 'Cover the garden in pavement', icon: '🧱' },
                  ].map((choice) => (
                    <button key={choice.id} type="button" className={`kids-build-choice ${worldChoices.includes(choice.id) ? 'selected' : ''}`} aria-pressed={worldChoices.includes(choice.id)} onClick={() => setWorldChoices((current) => current.includes(choice.id) ? current.filter((item) => item !== choice.id) : [...current, choice.id])}>
                      <span aria-hidden="true">{choice.icon}</span>{choice.label}<span className="kids-choice-check"><Check aria-hidden="true" /></span>
                    </button>
                  ))}
                </div>
                <button type="button" className="kids-big-button" onClick={checkGreenWorld}>Grow my world <ArrowRight aria-hidden="true" /></button>
              </div>
            )}
            {game.id === 'solar-adventure' && (
              <div className="kids-solar-play">
                <div className="kids-solar-demo" aria-hidden="true">
                  <Mascot kind="sun" />
                  <span className="kids-solar-rays" />
                  <div className="kids-solar-panel" style={{ transform: `rotate(${-35 + panelAngle * 0.7}deg)` }}><span /><span /><span /><span /></div>
                </div>
                <label className="kids-range-label" htmlFor="kids-panel-angle">Turn the panel toward the Sun</label>
                <input id="kids-panel-angle" type="range" min="0" max="100" step="1" value={panelAngle} onChange={(event) => { setPanelAngle(Number(event.target.value)); setAnswerMessage('') }} />
                <p className="kids-range-hint" aria-live="polite">{panelAngle < 35 ? 'The panel is turned away.' : panelAngle < 70 ? 'Getting closer to Sunny!' : 'Sunny can shine on the panel!'}</p>
                <button type="button" className="kids-big-button" onClick={checkSolarPanel}>Check my panel <ArrowRight aria-hidden="true" /></button>
              </div>
            )}
            {game.id === 'earth-memory' && (
              <div className="kids-memory-play">
                <p className="kids-play-prompt">Find all four picture pairs.</p>
                <div className="kids-memory-grid" role="group" aria-label="Earth picture memory cards">
                  {MEMORY_CARDS.map((card, index) => {
                    const revealed = flippedCards.includes(card.id) || matchedCards.includes(card.pair)
                    return (
                      <button key={card.id} type="button" className={`kids-memory-card ${revealed ? 'revealed' : ''} ${matchedCards.includes(card.pair) ? 'matched' : ''}`} aria-label={revealed ? `${card.name}${matchedCards.includes(card.pair) ? ', matched' : ''}` : `Reveal card ${index + 1}`} aria-pressed={revealed} onClick={() => revealMemoryCard(card.id, card.pair)} disabled={matchedCards.includes(card.pair)}>
                        {revealed ? <Mascot kind={card.kind} /> : <span aria-hidden="true">?</span>}
                      </button>
                    )
                  })}
                </div>
                <p className="kids-live-message" role="status" aria-live="polite">{memoryMessage} {matchedCards.length > 0 && `${matchedCards.length} of 4 pairs found.`}</p>
              </div>
            )}
            {game.id === 'animal-habitats' && (
              <div className="kids-habitat-play">
                <p className="kids-play-prompt">Choose an animal, then tap a home for it.</p>
                <div className="kids-match-columns">
                  <div><h3>Animals</h3>{ANIMALS.map((animal) => (
                    <button key={animal.id} type="button" className={`kids-match-choice ${selectedAnimal === animal.id ? 'selected' : ''} ${matchedAnimals.includes(animal.id) ? 'matched' : ''}`} aria-pressed={selectedAnimal === animal.id} disabled={matchedAnimals.includes(animal.id)} onClick={() => setSelectedAnimal(animal.id)}>
                      <span aria-hidden="true">{animal.icon}</span>{animal.name}{matchedAnimals.includes(animal.id) && <Check aria-label="Matched" />}
                    </button>
                  ))}</div>
                  <div><h3>Homes</h3>{HABITATS.map((habitat) => (
                    <button key={habitat.id} type="button" className="kids-match-choice" disabled={!selectedAnimal || matchedAnimals.includes(habitat.animal)} onClick={() => matchHabitat(habitat.id)}>
                      <span aria-hidden="true">{habitat.icon}</span>{habitat.name}
                    </button>
                  ))}</div>
                </div>
                <p className="kids-live-message" role="status" aria-live="polite">{habitatMessage} {matchedAnimals.length > 0 && `${matchedAnimals.length} of 3 animals matched.`}</p>
              </div>
            )}
            {answerMessage && phase === 'play' && <p className={`kids-live-message ${answerMessage.startsWith('Not quite') || answerMessage.startsWith('Keep') || answerMessage.startsWith('Turn') ? 'gentle-reminder' : ''}`} role="status" aria-live="polite">{answerMessage}</p>}
            <p className="kids-simulation-note">{game.note}</p>
          </div>
        )}

        {phase === 'learn' && (
          <div className="kids-learn-screen" role="status" aria-live="polite">
            <Mascot kind={game.mascot} className="kids-learn-mascot" />
            <p className="kids-step-label">YOU DISCOVERED SOMETHING</p>
            <h2 id="kids-activity-title">Look what you learned!</h2>
            <p>{game.lesson}</p>
            <p className="kids-simulation-note">{game.note}</p>
            <button type="button" className="kids-big-button" onClick={collectStar}>Collect my star <Star aria-hidden="true" fill="currentColor" /></button>
          </div>
        )}

        {phase === 'celebrate' && (
          <div className="kids-celebrate-screen" role="status" aria-live="polite">
            <div className="kids-celebration-art"><Mascot kind={game.mascot} /><span>★</span><span>✦</span></div>
            <p className="kids-step-label">{newReward ? 'NEW ADVENTURE STAR!' : 'ADVENTURE COMPLETE!'}</p>
            <h2 id="kids-activity-title">{newReward ? 'You made a discovery!' : 'Welcome back, explorer!'}</h2>
            <p>{newReward ? 'Every good question helps us learn about Earth.' : 'You already earned this star. Playing again is always welcome!'}</p>
            <div className="kids-earned-badge"><span><Award aria-hidden="true" /></span><div><small>{newReward ? 'BADGE COLLECTED' : 'YOUR BADGE'}</small><strong>{game.badge}</strong></div><Star aria-hidden="true" fill="currentColor" /></div>
            {newReward && <p className="kids-earned-xp"><Sparkles aria-hidden="true" /> +100 XP · +1 adventure star</p>}
            <button type="button" className="kids-big-button" onClick={onBack}>Back to the adventure map <ArrowRight aria-hidden="true" /></button>
          </div>
        )}
      </div>
    </section>
  )
}

const MEMORY_CARDS = [
  { id: 'leaf-one', pair: 'leaf', name: 'Leafy the plant friend', kind: 'leaf' as const },
  { id: 'sun-one', pair: 'sun', name: 'Sunny the sun friend', kind: 'sun' as const },
  { id: 'water-one', pair: 'water', name: 'Droppy the water friend', kind: 'water' as const },
  { id: 'cloud-one', pair: 'cloud', name: 'Cloudy the weather friend', kind: 'cloud' as const },
  { id: 'cloud-two', pair: 'cloud', name: 'Cloudy the weather friend', kind: 'cloud' as const },
  { id: 'water-two', pair: 'water', name: 'Droppy the water friend', kind: 'water' as const },
  { id: 'sun-two', pair: 'sun', name: 'Sunny the sun friend', kind: 'sun' as const },
  { id: 'leaf-two', pair: 'leaf', name: 'Leafy the plant friend', kind: 'leaf' as const },
]

const ANIMALS = [
  { id: 'fox', name: 'Fox', icon: '🦊' },
  { id: 'otter', name: 'Otter', icon: '🦦' },
  { id: 'camel', name: 'Camel', icon: '🐪' },
]
const HABITATS = [
  { id: 'forest', name: 'Forest', icon: '🌳', animal: 'fox' },
  { id: 'river', name: 'River', icon: '💧', animal: 'otter' },
  { id: 'desert', name: 'Desert', icon: '☀️', animal: 'camel' },
]

function KidsHeader({ stars, xp }: { stars: number; xp: number }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <header className="kids-world-header">
      <Link to="/" className="kids-world-brand" aria-label="Back to GEO-FLEX home">
        <span className="kids-world-brand-icon"><Mascot kind="earth" /></span>
        <span><strong>GEO-FLEX</strong><small>EARTH EXPLORERS</small></span>
      </Link>
      <nav className="kids-world-nav" aria-label="Adventure map navigation">
        <a href="#adventure-map">Adventure map</a>
        <a href="#my-badges">My badges</a>
        <a href="#real-earth">Real Earth data</a>
      </nav>
      <div className="kids-world-header-actions">
        <button
          type="button"
          className="kids-theme-toggle"
          aria-label={`Switch site to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-pressed={theme === 'light'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
        <div className="kids-world-score" aria-label={`${stars} adventure stars and ${xp} experience points`}>
          <span><Star aria-hidden="true" fill="currentColor" /> {stars} stars</span>
          <span><Sparkles aria-hidden="true" /> {xp} XP</span>
        </div>
      </div>
    </header>
  )
}

export default function KidsMode() {
  const { analysis, setConfig } = useStore()
  const [saved] = useState(readCompletedGames)
  const [completedGames, setCompletedGames] = useState<GameId[]>(saved.completed)
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null)
  const [progressNotice, setProgressNotice] = useState(saved.issue)
  const activityRef = useRef<HTMLElement | null>(null)
  const xp = completedGames.length * 100
  const stars = completedGames.length
  const rank = [...RANKS].reverse().find((item) => xp >= item.xp) ?? RANKS[0]
  const activeGame = WORLD_GAMES.find((game) => game.id === activeGameId) ?? null
  const unlockedGames = completedGames.length >= 3 ? 6 : completedGames.length >= 1 ? 4 : 2
  const mapHint = completedGames.length >= 3
    ? 'Every place is open now! Explore in any order, whenever you feel curious.'
    : completedGames.length > 0
      ? `${completedGames.length} ${completedGames.length === 1 ? 'adventure' : 'adventures'} complete! Finish ${3 - completedGames.length} more to open the final two places.`
      : 'The first two places are ready. Finish one adventure to discover two more!'
  const finding = analysis?.stats
    ? `GEO-FLEX found a ${analysis.stats.mann_kendall.trend === 'no trend' ? 'pattern with no clear direction' : `${analysis.stats.mann_kendall.trend} pattern`} in ${analysis.variable.name.toLowerCase()} for ${analysis.region}.`
    : null
  const everydayLink = analysis?.variable.id === 'precipitation'
    ? 'Rainfall records can help us ask questions about gardens, rivers, and stored water. One record cannot tell us how much water is available from every tap.'
    : analysis?.variable.id.includes('temperature')
      ? 'Temperature records can help people ask questions about farms, shade, and cooling. The trend by itself cannot tell us what will happen in one neighborhood.'
      : analysis?.variable.id.includes('solar') || analysis?.variable.id.includes('radiation')
        ? 'Sunlight records can help people explore solar energy. Clouds, seasons, location, and the solar panel also matter.'
        : 'Earth observations can help people ask better questions about nature and communities. One measurement cannot explain every local change.'

  useEffect(() => {
    if (!activeGame) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.requestAnimationFrame(() => {
      activityRef.current?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
      activityRef.current?.focus({ preventScroll: true })
    })
  }, [activeGame])

  const completeGame = (gameId: GameId) => {
    if (completedGames.includes(gameId)) return false
    const next = [...completedGames, gameId]
    setCompletedGames(next)
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, completedGames: next }))
    } catch {
      setProgressNotice('Your adventure is saved for this visit, but this device could not keep it for next time.')
    }
    return true
  }

  const openGame = (game: WorldGame, index: number) => {
    if (index >= unlockedGames) return
    setActiveGameId(game.id)
  }

  return (
    <div className="kids-world">
      <KidsHeader stars={stars} xp={xp} />
      {progressNotice && <p className="kids-save-notice" role="status">{progressNotice}</p>}
      <div className="kids-world-content">
        <section className="kids-world-hero" aria-labelledby="kids-welcome">
          <KidsLandscape />
          <div className="kids-world-welcome">
            <p className="kids-world-kicker"><Sparkles aria-hidden="true" /> A LITTLE WORLD OF BIG DISCOVERIES</p>
            <h1 id="kids-welcome">Hello, Earth<br />explorer!</h1>
            <p>Meet friendly Earth characters. Play, notice, and discover how our planet works.</p>
            <a className="kids-big-button" href="#adventure-map">Let’s explore <ArrowDown aria-hidden="true" /></a>
            <p className="kids-local-save"><LockKeyhole aria-hidden="true" /> Your stars stay on this device. No account needed.</p>
          </div>
          <div className="kids-world-friends" aria-label="Meet the GEO-FLEX friends">
            <div className="kids-friend kids-friend--earth"><Mascot kind="earth" /><span>Earthy</span></div>
            <div className="kids-friend kids-friend--sun"><Mascot kind="sun" /><span>Sunny</span></div>
            <div className="kids-friend kids-friend--cloud"><Mascot kind="cloud" /><span>Cloudy</span></div>
            <div className="kids-friend kids-friend--water"><Mascot kind="water" /><span>Droppy</span></div>
            <div className="kids-friend kids-friend--leaf"><Mascot kind="leaf" /><span>Leafy</span></div>
          </div>
          <div className="kids-rank-pill"><Star aria-hidden="true" fill="currentColor" /><span>{rank.name}</span><small>{xp} XP</small></div>
        </section>

        <section className="kids-map-section" id="adventure-map" aria-labelledby="kids-map-title">
          <div className="kids-map-heading">
            <div><p className="kids-world-kicker">PICK A PATH · GO AT YOUR OWN PACE</p><h2 id="kids-map-title">Your adventure map</h2><p>Choose a place to play. Every visit brings a new Earth discovery.</p></div>
            <div className="kids-map-progress"><span className="kids-progress-star"><Star aria-hidden="true" fill="currentColor" /></span><strong>{stars} of 6 stars</strong><span>·</span><strong>{completedGames.length} places explored</strong></div>
          </div>
          <div className="kids-adventure-map">
            <svg className="kids-map-trail" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
              <path d="M75 100c100 0 90 170 245 170s150-170 280-170 145 190 265 190 93-180 170-180" />
            </svg>
            {WORLD_GAMES.map((game, index) => {
              const isUnlocked = index < unlockedGames
              const isComplete = completedGames.includes(game.id)
              const adventuresToUnlock = index < 4 ? 1 : 3
              return (
                <button
                  type="button"
                  key={game.id}
                  className={`kids-destination ${isUnlocked ? '' : 'locked'} ${isComplete ? 'complete' : ''} kids-destination--${index + 1}`}
                  aria-label={`${game.destination}. ${isComplete ? 'Adventure complete' : isUnlocked ? game.invitation : `Locked. Complete ${adventuresToUnlock} ${adventuresToUnlock === 1 ? 'adventure' : 'adventures'} to open.`}`}
                  aria-describedby={`destination-progress-${game.id}`}
                  disabled={!isUnlocked}
                  onClick={() => openGame(game, index)}
                >
                  <DestinationArt scene={game.scene} />
                  <span className="kids-destination-label">
                    <span className="kids-destination-status">{isComplete ? <Check aria-hidden="true" /> : isUnlocked ? <ChevronRight aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}</span>
                    <strong>{game.destination}</strong>
                    <small>{isComplete ? 'Star collected!' : isUnlocked ? game.invitation : `Explore ${adventuresToUnlock} ${adventuresToUnlock === 1 ? 'place' : 'places'} to open`}</small>
                    <span className="kids-destination-progress" id={`destination-progress-${game.id}`}>{isComplete ? '1 of 1 star' : '0 of 1 star'}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <p className="kids-map-hint"><Sparkles aria-hidden="true" /> {mapHint}</p>
        </section>

        {activeGame && (
          <ActivityPanel
            key={activeGame.id}
            game={activeGame}
            onComplete={() => completeGame(activeGame.id)}
            onBack={() => setActiveGameId(null)}
          />
        )}

        <section className="kids-badges-section" id="my-badges" aria-labelledby="kids-badges-title">
          <div className="kids-map-heading">
            <div><p className="kids-world-kicker">YOUR LITTLE WINS</p><h2 id="kids-badges-title">My badges</h2><p>Collect a badge each time you finish a new adventure.</p></div>
            <div className="kids-xp-counter"><Sparkles aria-hidden="true" /><strong>{xp} XP</strong><span>{rank.name}</span></div>
          </div>
          <div className="kids-badge-shelf">
            {WORLD_GAMES.map((game) => {
              const earned = completedGames.includes(game.id)
              return (
                <article className={`kids-shelf-badge ${earned ? 'earned' : ''}`} key={game.id}>
                  <span className="kids-shelf-mascot"><Mascot kind={game.mascot} /></span>
                  <strong>{game.badge}</strong>
                  <span>{earned ? 'Collected!' : 'Ready to discover'}</span>
                  {!earned && <LockKeyhole aria-label="Not collected yet" />}
                </article>
              )
            })}
            <article className={`kids-shelf-badge kids-master-badge ${completedGames.length === WORLD_GAMES.length ? 'earned' : ''}`}>
              <span className="kids-shelf-mascot"><Mascot kind="earth" /></span>
              <strong>GEO-FLEX Master</strong>
              <span>{completedGames.length === WORLD_GAMES.length ? 'All six adventures complete!' : `${completedGames.length} of 6 adventures`}</span>
              {completedGames.length !== WORLD_GAMES.length && <LockKeyhole aria-label="Not collected yet" />}
            </article>
          </div>
          <p className="kids-no-pressure"><Star aria-hidden="true" /> No timers or streaks. Explore when you feel curious.</p>
        </section>

        <section className="kids-real-earth" id="real-earth" aria-labelledby="kids-real-earth-title">
          <div className="kids-real-earth-heading">
            <span className="kids-real-earth-icon"><Sun aria-hidden="true" /></span>
            <div><p className="kids-world-kicker">FROM GEO-FLEX · REAL EARTH SCIENCE</p><h2 id="kids-real-earth-title">What is Earth telling us?</h2></div>
          </div>
          {analysis ? (
            <article className="kids-real-finding">
              <div className="kids-finding-top"><strong>{analysis.variable.name} · {analysis.region}</strong><DataBadge status={analysis.provenance.status} compact /></div>
              <p className="kids-finding-period">{analysis.period.start} to {analysis.period.end} · {analysis.provenance.source_name}</p>
              <p className="kids-finding-main">{finding ?? 'There are not enough valid observations to estimate a trend in this analysis.'}</p>
              {analysis.stats && <p className="kids-finding-rate">Estimated change: {analysis.stats.sen.slope_per_decade.toFixed(2)} {analysis.variable.unit} per decade.</p>}
              <p className="kids-finding-note">This is a pattern in the selected data. It does not show why a change happened or prove what will happen in one local place.</p>
              <div className="kids-real-life-link"><strong>Why might people care?</strong><p>{everydayLink}</p></div>
              <Link to="/analysis" className="kids-analysis-link">See the full GEO-FLEX analysis <ArrowRight aria-hidden="true" /></Link>
            </article>
          ) : (
            <article className="kids-real-empty">
              <Mascot kind="earth" />
              <div><h3>Real observations live in GEO-FLEX.</h3><p>When an Earth-science analysis is ready, its source, place, and time will appear here. Our games use clearly labeled practice examples instead.</p>
                <Link to="/analysis" className="kids-analysis-link" onClick={() => setConfig({ variable: 'surface_temperature' })}>Explore real GEO-FLEX data <ArrowRight aria-hidden="true" /></Link>
              </div>
            </article>
          )}
        </section>
      </div>
      <footer className="kids-world-footer">
        <Link to="/" className="kids-footer-home"><ArrowLeft aria-hidden="true" /> GEO-FLEX home</Link>
        <span>DISCOVER · PLAY · CARE FOR OUR SHARED HOME</span>
        <a href="#adventure-map">Back to the map <ArrowDown aria-hidden="true" /></a>
      </footer>
    </div>
  )
}
