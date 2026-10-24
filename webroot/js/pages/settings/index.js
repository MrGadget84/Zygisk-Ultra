import { loadPage } from '../pageLoader.js'
import utils from '../utils.js'

export async function loadOnce() {
}

export async function loadOnceView() {
}

export async function onceViewAfterUpdate() {
}

export async function load() {
  utils.addListener(document.getElementById('customization_page_toggle'), 'click', () => {
    loadPage('mini_settings_customization')
  })
}
