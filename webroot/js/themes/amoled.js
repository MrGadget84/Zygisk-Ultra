import { setDarkNav } from './darkNavbar.js'

const rootCss = document.querySelector(':root')

export function setAmoled(chooseSet) {
  rootCss.style.setProperty('--background', '#000000')
  rootCss.style.setProperty('--status-ok-bg', '#193a28')
  rootCss.style.setProperty('--status-ok-text', '#f2fff5')
  rootCss.style.setProperty('--status-error-bg', '#8d1d19')
  rootCss.style.setProperty('--status-partial-bg', '#766000')
  rootCss.style.setProperty('--font', '#d9d9d9')
  rootCss.style.setProperty('--desc', '#a9a9a9')
  rootCss.style.setProperty('--dim', '#0e0e0eff')
  rootCss.style.setProperty('--icon', '#292929ff')
  rootCss.style.setProperty('--icon-bc', '#202020ff')
  rootCss.style.setProperty('--desktop-navbar', '#000000')
  rootCss.style.setProperty('--nav-label-inactive', '#777777')
  rootCss.style.setProperty('--nav-icon-active-filter', 'invert(1)')
  rootCss.style.setProperty('--nav-icon-inactive-filter', 'invert(0.42)')
  rootCss.style.setProperty('--desktop-navicon', '#242424ff')
  rootCss.style.setProperty('--icon-filter', 'invert(1)')
  rootCss.style.setProperty('--button', 'var(--background)')

  if (chooseSet) setData('amoled')
  setDarkNav()
}

function setData(mode) {
  localStorage.setItem('/Zygisk-Ultra/theme', mode)

  return mode
}