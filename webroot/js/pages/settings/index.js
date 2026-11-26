import { loadPage } from '../pageLoader.js'

export async function loadOnce() {
}

export async function loadOnceView() {
}

export async function onceViewAfterUpdate() {
}

export async function load() {
  const customizationToggle = document.getElementById('customization_page_toggle')
  const aboutToggle = document.getElementById('about_module_page_toggle')

  // Assigning onclick on each page load is idempotent. The loader may recreate
  // this HTML after a language change, so a persistent dataset marker is unsafe.
  if (customizationToggle) {
    customizationToggle.onclick = () => { void loadPage('mini_settings_customization') }
  }

  if (aboutToggle) {
    aboutToggle.onclick = () => { void loadPage('mini_settings_about') }
  }
}
