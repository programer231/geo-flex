import { EMPTY_ARCADE_PROGRESS, parseArcadeProgress, type KidsArcadeProgress } from './kidsGames'

const STORAGE_KEY = 'geoflex-kids-arcade-progress-v1'

export function loadArcadeProgress(): { progress: KidsArcadeProgress; issue: string } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { progress: EMPTY_ARCADE_PROGRESS, issue: '' }
    return { progress: parseArcadeProgress(JSON.parse(stored)), issue: '' }
  } catch {
    return {
      progress: EMPTY_ARCADE_PROGRESS,
      issue: 'Saved game progress could not be read on this device. You can still play, but progress may not be retained.',
    }
  }
}

export function saveArcadeProgress(progress: KidsArcadeProgress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}
