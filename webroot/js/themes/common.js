// Properties overridden by the Monet color layer. Remove them before applying
// another base theme or disabling Monet so that the selected theme is restored.
const MONET_ONLY_PROPERTIES = [
  '--zu-background',
  '--font',
  '--desc',
  '--status-error-bg',
  '--status-partial-bg',
  '--lock',
  '--dim',
  '--dim-brigther',
  '--icon',
  '--icon-bc',
  '--small-card',
  '--button',
  '--button-enabled',
  '--desktop-navbar',
  '--desktop-navicon',
  '--nav-label-inactive',
  '--nav-icon-active-filter',
  '--nav-icon-inactive-filter',
  '--icon-filter'
]

export function clearMonetTheme(rootCss = document.documentElement) {
  rootCss.classList.remove('monet-theme')
  MONET_ONLY_PROPERTIES.forEach((property) => rootCss.style.removeProperty(property))
}
