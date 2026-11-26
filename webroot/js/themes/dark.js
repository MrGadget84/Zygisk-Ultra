import { setDarkNav } from './darkNavbar.js'
import { clearMonetTheme } from './common.js'

const rootCss = document.querySelector(':root')

export function setDark(chooseSet) {
  clearMonetTheme(rootCss)
  rootCss.style.setProperty('--zu-background', '#141414')
  rootCss.style.setProperty('--status-ok-bg', '#193a28')
  rootCss.style.setProperty('--status-ok-text', '#f2fff5')
  rootCss.style.setProperty('--status-error-bg', '#8d1d19')
  rootCss.style.setProperty('--status-partial-bg', '#766000')
  rootCss.style.setProperty('--font', '#ffffff')
  rootCss.style.setProperty('--desc', '#c9c9c9')
  rootCss.style.setProperty('--dim', '#1c1c1c')
  rootCss.style.setProperty('--icon', '#494949')
  rootCss.style.setProperty('--icon-bc', '#292929')
  rootCss.style.setProperty('--desktop-navbar', '#080808')
  rootCss.style.setProperty('--nav-label-inactive', '#777777')
  rootCss.style.setProperty('--nav-icon-active-filter', 'invert(1)')
  rootCss.style.setProperty('--nav-icon-inactive-filter', 'invert(0.42)')
  rootCss.style.setProperty('--button-enabled', '#535353')
  rootCss.style.setProperty('--icon-filter', 'invert(1)')
  rootCss.style.setProperty('--desktop-navicon', '#3a3a3a')
  rootCss.style.setProperty('--button', 'var(--zu-background)')

  if (chooseSet) setData('dark')
  setDarkNav()
}

function setData(mode) {
  localStorage.setItem('/Zygisk-Ultra/theme', mode)

  return mode
}