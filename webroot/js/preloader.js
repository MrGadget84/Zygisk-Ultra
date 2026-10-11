import { exec, fullScreen } from './kernelsu.js'
import { setDark } from './themes/dark.js'
import { setThemeData, themeList } from './themes/main.js'
import { setLight } from './themes/light.js'
import { loadPage } from './pages/pageLoader.js'

/* INFO: Provide short tactile feedback for user-facing controls. */
const HAPTIC_INTERACTIVE_SELECTOR = [
  'button:not(:disabled)',
  'a[href]',
  'input:not([type="hidden"]):not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'label',
  '[role="button"]',
  '[role="switch"]',
  '.button',
  '.radio',
  '.back_icon',
  '.card_animation',
  '.action_card',
  '[theme-data]',
  '[lang-data]',
  '[credit-link]',
  '[id$="_page_toggle"]',
  '[style*="cursor: pointer"]'
].join(',')

let lastHapticAt = 0

function triggerHapticFeedback() {
  const now = Date.now()
  if (now - lastHapticAt < 70) return
  lastHapticAt = now

  if (typeof ksu !== 'undefined') {
    exec('cmd vibrator_manager synced oneshot 12 >/dev/null 2>&1 || cmd vibrator vibrate 12 >/dev/null 2>&1')
      .catch(() => {})
    return
  }

  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(12)
  } catch {
    /* INFO: Haptics are optional; unsupported devices should still work normally. */
  }
}

document.addEventListener('pointerdown', (event) => {
  if (event.isPrimary === false) return

  const target = event.target instanceof Element
    ? event.target.closest(HAPTIC_INTERACTIVE_SELECTOR)
    : null

  if (!target || target.closest('[inert], [aria-disabled="true"]')) return

  triggerHapticFeedback()
}, { capture: true, passive: true })

/* INFO: This sets the default theme to system if not set */
let sys_theme = localStorage.getItem('/Zygisk-Ultra/theme')
if (!sys_theme) sys_theme = setThemeData('system')
themeList[sys_theme](true)

const ConfigState = JSON.parse(localStorage.getItem('/Zygisk-Ultra/webui_config') || '{}')

if (!ConfigState.disableFullscreen) fullScreen(true)

if (ConfigState.enableSystemFont) {
  const headTag = document.getElementsByTagName('head')[0]
  const styleTag = document.createElement('style')
  styleTag.id = 'font-tag'
  headTag.appendChild(styleTag)
  styleTag.innerHTML = `
    :root {
      --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif
    }`
}

/* INFO: This code are meant to load the link with any card have credit-link attribute inside it */
document.addEventListener('click', async (event) => {
  const getLink = event.target.getAttribute('credit-link')
  if (!getLink || typeof getLink !== 'string') return;

  const ptrace64Cmd = await exec(`am start -a android.intent.action.VIEW -d https://${getLink}`).catch(() => {
    return window.open(`https://${getLink}`, "_blank", 'toolbar=0,location=0,menubar=0')
  })

  if (ptrace64Cmd.errno !== 0) return window.open(`https://${getLink}`, "_blank", 'toolbar=0,location=0,menubar=0')
}, false)

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (sys_theme !== 'system') return

  const newColorScheme = event.matches ? 'dark' : 'light'
  if (newColorScheme === 'dark') setDark()
  else if (newColorScheme === 'light') setLight()
})
