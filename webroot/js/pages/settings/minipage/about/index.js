async function loadModuleInfo() {
  const versionElement = document.getElementById('about_version_value')
  const nameElement = document.getElementById('about_module_name')
  const avatarElement = document.getElementById('about_author_avatar')
  const avatarFallback = document.getElementById('about_author_avatar_fallback')

  if (avatarElement && avatarFallback) {
    const handleAvatarLoad = () => { avatarFallback.style.display = 'none' }
    const handleAvatarError = () => { avatarElement.style.display = 'none' }
    avatarElement.addEventListener('load', handleAvatarLoad, { once: true })
    avatarElement.addEventListener('error', handleAvatarError, { once: true })
    if (avatarElement.complete) {
      if (avatarElement.naturalWidth > 0) handleAvatarLoad()
      else handleAvatarError()
    }
  }

  try {
    const response = await fetch('module-info.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`module-info.json returned HTTP ${response.status}`)
    const info = await response.json()

    if (nameElement && info.name) nameElement.textContent = info.name
    if (avatarElement && info.avatarUrl && avatarElement.getAttribute('src') !== info.avatarUrl) {
      avatarElement.src = info.avatarUrl
    }
    if (versionElement && info.version) {
      // Keep the displayed version free of the release-tag prefix.
      versionElement.textContent = String(info.version).replace(/^v/i, '')
    }
  } catch (error) {
    // Keep a useful fallback in development builds or if metadata is unavailable.
    console.warn('Could not load module metadata for About page.', error)
  }
}

let moduleInfoLoaded = false

export async function loadOnce() {
}

export async function loadOnceView() {
  if (moduleInfoLoaded) return
  moduleInfoLoaded = true
  await loadModuleInfo()
}

export async function onceViewAfterUpdate() {
  // Module metadata is independent of UI language.
}

export async function load() {
}
