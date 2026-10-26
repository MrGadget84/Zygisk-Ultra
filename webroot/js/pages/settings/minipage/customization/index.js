import { loadPage } from '../../../pageLoader.js'
import { fullScreen } from '../../../../kernelsu.js'

const CONFIG_KEY = '/Zygisk-Ultra/webui_config'

function readConfig() {
  const defaults = {
    disableFullscreen: false,
    enableSystemFont: false
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
  } catch (error) {
    console.warn('Could not read WebUI settings; using defaults.', error)
    return defaults
  }
}

function writeConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

function applySystemFont(enabled) {
  let styleTag = document.getElementById('font-tag')

  if (enabled) {
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'font-tag'
      document.head.appendChild(styleTag)
    }

    styleTag.textContent = `
      :root {
        --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
    `
  } else if (styleTag) {
    styleTag.remove()
  }
}

export async function loadOnce() {
}

export async function loadOnceView() {
}

export async function onceViewAfterUpdate() {
}

export async function load() {
  const config = readConfig()

  const languageToggle = document.getElementById('lang_page_toggle')
  if (languageToggle) {
    languageToggle.onclick = () => { void loadPage('mini_settings_language') }
  }

  const fullscreenSwitch = document.getElementById('rz_webui_fullscreen_switch')
  if (fullscreenSwitch) {
    fullscreenSwitch.checked = !!config.disableFullscreen
    fullScreen(!config.disableFullscreen)
    fullscreenSwitch.onchange = () => {
      const currentConfig = readConfig()
      currentConfig.disableFullscreen = fullscreenSwitch.checked
      writeConfig(currentConfig)
      fullScreen(!currentConfig.disableFullscreen)
    }
  }

  const fontSwitch = document.getElementById('rz_webui_font_switch')
  if (fontSwitch) {
    fontSwitch.checked = !!config.enableSystemFont
    applySystemFont(config.enableSystemFont)
    fontSwitch.onchange = () => {
      const currentConfig = readConfig()
      currentConfig.enableSystemFont = fontSwitch.checked
      applySystemFont(currentConfig.enableSystemFont)
      writeConfig(currentConfig)
    }
  }
}
