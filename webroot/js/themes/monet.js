import { setDarkNav } from './darkNavbar.js'

const rootCss = document.documentElement

function isDarkColor(color) {
  const match = color.match(/^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/i)
  if (!match) return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true

  const hex = match[1]
  const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  return luminance < 0.5
}

/** Overlay the compatible manager's dynamic color palette on the selected base theme. */
export function setMonet() {
  const sourceColors = getComputedStyle(rootCss)
  const primary = sourceColors.getPropertyValue('--primary').trim()
  const onSurface = sourceColors.getPropertyValue('--onSurface').trim()

  // The manager may not expose Monet colors. In that case leave the already
  // applied AMOLED/Dark/Light/System theme untouched.
  if (!primary || !onSurface) {
    // The base theme has already been applied and cleared previous Monet
    // overrides, so leave it untouched when dynamic colors are unavailable.
    return false
  }

  rootCss.classList.add('monet-theme')
  rootCss.style.setProperty('--zu-background', 'var(--background, #f2f2f2)')
  rootCss.style.setProperty('--font', 'var(--onBackground, var(--onSurface, #222222))')
  rootCss.style.setProperty('--desc', 'var(--onSurfaceVariant, #535353)')
  rootCss.style.setProperty('--status-error-bg', 'var(--errorContainer, #f6d9d6)')
  rootCss.style.setProperty('--status-partial-bg', 'var(--tertiaryContainer, #e8ddf8)')
  rootCss.style.setProperty('--lock', 'var(--onSurface, #222222)')
  rootCss.style.setProperty('--dim', 'var(--tonalSurface, var(--surfaceContainer, #e0e0e0))')
  rootCss.style.setProperty('--dim-brigther', 'var(--surfaceContainerHigh, var(--surfaceVariant, #d0d0d0))')
  rootCss.style.setProperty('--icon', 'var(--outline, #acacac)')
  rootCss.style.setProperty('--icon-bc', 'var(--outlineVariant, #c9c9c9)')
  rootCss.style.setProperty('--small-card', 'var(--surface, #fefefe)')
  rootCss.style.setProperty('--button', 'var(--secondaryContainer, var(--zu-background))')
  rootCss.style.setProperty('--button-enabled', 'var(--primaryContainer, #eeeeee)')
  rootCss.style.setProperty('--desktop-navbar', 'var(--surface, #fefefe)')
  rootCss.style.setProperty('--desktop-navicon', 'var(--surfaceContainer, #eeeeee)')
  rootCss.style.setProperty('--nav-label-inactive', 'var(--onSurfaceVariant, #777777)')
  rootCss.style.setProperty('--nav-icon-active-filter', 'none')
  rootCss.style.setProperty('--nav-icon-inactive-filter', 'none')
  rootCss.style.setProperty('--icon-filter', isDarkColor(sourceColors.getPropertyValue('--background').trim()) ? 'invert(1)' : 'invert(0.12)')

  // Keep the status badge controlled by the live module state. In particular,
  // never replace --bright or --status-text here: the cached Home page sets
  // them for Working!/Not Working and may not rerun its status reader at once.
  // Success colors remain the green values supplied by the selected base theme.
  setDarkNav()
  return true
}
