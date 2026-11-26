import { setDark } from './dark.js'
import { setLight } from './light.js'
import { setMonet } from './monet.js'

/**
 * There is no user-selectable theme anymore. Use the device color scheme as a
 * fallback, then overlay the manager-provided Monet palette whenever available.
 */
export function applyCurrentTheme() {
  const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  if (isDark) setDark(false)
  else setLight(false)

  setMonet()
  return 'system'
}
