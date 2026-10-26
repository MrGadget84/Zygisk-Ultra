import { exec, toast } from '../kernelsu.js'

import { loadNavbar, setNavbar, whichCurrentPage } from './navbar.js'
import { runMainPageTransition, runMiniPageEnter, runMiniPageLeave } from './animator.js'

/* INFO: Prototypes */
import utils from './utils.js'

const moduleName = 'TreatWheel'
const head = document.getElementsByTagName('head')[0]
const miniPageRegex = /mini_(.*)_(.*)/
/* UI parent paths can differ from the storage path. Language is nested in Customization. */
const miniPageParentOverrides = {
  mini_settings_language: 'mini_settings_customization',
  mini_settings_about: 'settings'
}
const miniPageCloseBindings = new Map()

export const allMainPages = [
  'home',
  'modules',
  'actions',
  'settings'
]

export const allMiniPages = [
  'mini_settings_language',
  'mini_settings_customization',
  'mini_settings_about'
]

export const allPages = [ ...allMainPages, ...allMiniPages ]

const loadedPageView = []
/* INFO: Prevent overlapping page transitions when users tap navigation rapidly. */
let isPageTransitioning = false
/* Ignore the root fallback when a mini-page intentionally consumes history.back(). */
let suppressNextGlobalPopstate = false
/* INFO: Direct assignment would link both arrays. We do not want that. */
const sufferedUpdate = [ ...allPages ]
const pageReplacements = allPages.reduce((obj, pageId) => {
  obj[pageId] = []

  return obj
}, {})

async function loadHTML(pageId) {
  if (miniPageRegex.test(pageId)) {
    const miniPageIdData = miniPageRegex.exec(pageId)
    const parentPage = miniPageIdData[1]
    const miniPage = miniPageIdData[2]
    return fetch(`js/pages/${parentPage}/minipage/${miniPage}/index.html`)
      .then((response) => response.text())
      .then((data) => {
        return data
      })
      .catch(() => false)
  } else {
    return fetch(`js/pages/${pageId}/index.html`)
      .then((response) => response.text())
      .then((data) => {
        return data
      })
      .catch(() => false)
  }
}

async function hotReloadStrings(html, pageId) {
  const strings = await getStrings(pageId)
  if (!strings) return html

  pageReplacements[pageId].forEach((replacement, i) => {
    const key = replacement.key.slice(2, -2)

    const split = key.split('.')
    if (split.length === 1) {
      html = html.replace(replacement.value, strings[key])
      pageReplacements[pageId][i].value = strings[key]
    } else {
      let value = strings
      split.forEach((key) => {
        value = value[key]
      })

      html = html.replace(replacement.value, value)
      pageReplacements[pageId][i].value = value
    }
  })

  return html
}

async function solveStrings(html, pageId) {
  const strings = await getStrings(pageId)
  if (!strings) return html

  const regex = /{{(.*?)}}/g
  const matches = html.match(regex)

  if (!matches) return html

  try {
    matches.forEach((match) => {
      const key = match.slice(2, -2)

      const split = key.split('.')
      if (split.length === 1) {
        html = html.replace(match, strings[key])
        pageReplacements[pageId].push({ key: match, value: strings[key] })
      } else {
        let value = strings
        split.forEach((key) => {
          value = value[key]
        })

        html = html.replace(match, value)
        pageReplacements[pageId].push({ key: match, value: value })
      }
    })
  } catch (e) {
    toast(`Failed to load ${localStorage.getItem(`/${moduleName}/language`) || 'en_US'} strings. Entering safe mode.`)
  }

  /* INFO: Perform navbar string replacement */
  allMainPages.forEach((page) => document.getElementById(`nav_${page}_title`).innerText = strings.navbar[page])

  return html
}

async function getPageScripts(pageId) {
  if (miniPageRegex.test(pageId)) {
    const miniPageIdData = miniPageRegex.exec(pageId)
    const parentPage = miniPageIdData[1]
    const miniPage = miniPageIdData[2]
    return fetch(`js/pages/${parentPage}/minipage/${miniPage}/pageScripts`)
      .then((response) => response.text())
      .then((data) => {
        return data
      })
      .catch(() => false)
  } else {
    return fetch(`js/pages/${pageId}/pageScripts`)
      .then((response) => response.text())
      .then((data) => {
        return data
      })
      .catch(() => false)
  }
}

async function getPageCSS(pageId) {
  if (miniPageRegex.test(pageId)) {
    const miniPageIdData = miniPageRegex.exec(pageId)
    const parentPage = miniPageIdData[1]
    const miniPage = miniPageIdData[2]
    return await fetch(`js/pages/${parentPage}/minipage/${miniPage}/index.css`)
      .then((response) => response.text())
      .then((data) => {
        return data
      })
      .catch(() => false)
  } else {
    return fetch(`js/pages/${pageId}/index.css`)
      .then((response) => response.text())
      .then((data) => {
        return data
      })
      .catch(() => false)
  }
}

function importPageJS(pageId) {
  if (miniPageRegex.test(pageId)) {
    const miniPageIdData = miniPageRegex.exec(pageId)
    const parentPage = miniPageIdData[1]
    const miniPage = miniPageIdData[2]
    return import(`./${parentPage}/minipage/${miniPage}/index.js`)
  } else {
    return import(`./${pageId}/index.js`)
  }
}

function isMiniPage(pageId) {
  return miniPageRegex.test(pageId)
}

/* INFO: Every mini page needs its own title and back button, including when
         navigating from one mini page to another (for example Customization -> Theme). */
function ensureMiniPageHeader(pageSpecificContent) {
  if (pageSpecificContent.querySelector('.back_icon')) return

  const minipage_header = `
    <div class="header" style="padding-left: 20px; display: flex; align-items: center; justify-content: initial;">
      <div id="minipage_close" class="back_icon" style="width: 36px; height: 36px; margin-right: 6px;"></div>
      <div id="minipage_title">Zygisk-Ultra: {{title}}</div>
    </div>
  `

  pageSpecificContent.insertAdjacentHTML('afterbegin', minipage_header)
}

function getMiniPageParent(pageId) {
  if (miniPageParentOverrides[pageId]) return miniPageParentOverrides[pageId]

  const miniPageIdData = miniPageRegex.exec(pageId)
  return miniPageIdData ? miniPageIdData[1] : null
}

function getMainPageAncestor(pageId) {
  let parentPage = getMiniPageParent(pageId)
  const visited = new Set([pageId])

  while (parentPage && isMiniPage(parentPage) && !visited.has(parentPage)) {
    visited.add(parentPage)
    parentPage = getMiniPageParent(parentPage)
  }

  return parentPage
}

function goBackWithoutGlobalFallback() {
  suppressNextGlobalPopstate = true
  history.back()
}

function detachMiniPageCloseListener(pageId) {
  const binding = miniPageCloseBindings.get(pageId)
  if (!binding) return

  binding.backIcon.removeEventListener('click', binding.onClick)
  window.removeEventListener('popstate', binding.onPopState)
  miniPageCloseBindings.delete(pageId)
}

function attachMiniPageCloseListener(pageId, pageSpecificContent) {
  /* INFO: Reusing a mini page must not accumulate click/popstate listeners. */
  detachMiniPageCloseListener(pageId)

  const minipage_back_icon = pageSpecificContent.querySelector('.back_icon')
  if (!minipage_back_icon) throw new Error(`Mini page header missing for ${pageId}`)

  let isClosing = false
  async function miniPageCloseListener(isClick) {
    if (isClosing) return true

    const parentPage = getMiniPageParent(pageId)

    /* Route explicit close-button taps through the same transition manager as
       every other navigation. This avoids leaving stale navbar/transition state
       after returning from a nested page such as Language -> Customization. */
    if (isClick) {
      if (!parentPage) return true
      await loadPage(parentPage)
      return true
    }

    /* Browser/system Back already popped the overlay history entry. If the
       parent is another mini page, restore the overlay state and return to it
       without popping the Settings entry underneath. */
    if (isMiniPage(parentPage)) {
      if (isPageTransitioning) return true
      history.pushState(true, '', location.pathname)
      await loadPage(parentPage)
      return true
    }

    isClosing = true
    setNavbar(parentPage)
    await runMiniPageLeave(pageSpecificContent)
    unuseHTML(pageSpecificContent, pageId, false)
    document.getElementById(`${pageId}_css`).media = 'not all'
    detachMiniPageCloseListener(pageId)

    return true
  }

  const onClick = () => { void miniPageCloseListener(true) }
  const onPopState = () => {
    /* INFO: Only the selected mini page may react, and not while loadPage owns
       the transition (for example, tapping a bottom-navigation destination). */
    if (whichCurrentPage() !== pageId || isPageTransitioning) return
    void miniPageCloseListener(false)
  }

  minipage_back_icon.addEventListener('click', onClick)
  window.addEventListener('popstate', onPopState)
  miniPageCloseBindings.set(pageId, { backIcon: minipage_back_icon, onClick, onPopState })
}

function isHTMLUnused(page, pageId) {
  /* INFO: Detect whether this page DOM is currently in the prefixed/inactive state. */
  if (!page || !page.childNodes) return false

  for (const child of page.childNodes) {
    if (child.id && child.id.startsWith(`page_${pageId}:`)) return true

    if (child.classList) {
      for (const className of child.classList) {
        if (className.startsWith(`page_${pageId}:`)) return true
      }
    }
  }

  return false
}

async function initializePage(pageId, pageSpecificContent, shouldApplyHTMLChanges = true) {
  const module = await importPageJS(pageId)

  if (!sufferedUpdate.includes(pageId)) {
    pageSpecificContent.innerHTML = await hotReloadStrings(pageSpecificContent.innerHTML, pageId)
    if (shouldApplyHTMLChanges) applyHTMLChanges(pageSpecificContent, pageId)

    module.onceViewAfterUpdate()

    sufferedUpdate.push(pageId)
  }

  if (!loadedPageView.includes(pageId)) {
    pageSpecificContent.innerHTML = await solveStrings(pageSpecificContent.innerHTML, pageId)
    if (shouldApplyHTMLChanges) applyHTMLChanges(pageSpecificContent, pageId)

    module.loadOnceView()

    loadedPageView.push(pageId)
  } else if (shouldApplyHTMLChanges) {
    applyHTMLChanges(pageSpecificContent, pageId)
  }

  module.load()
}

function unuseHTML(page, pageId, shouldRemoveListeners = true) {
  /* INFO: Remove all event listeners from window */
  if (shouldRemoveListeners) utils.removeAllListeners()
  const pagePrefix = `page_${pageId}:`

  if (page.childNodes) page.childNodes.forEach((child) => {
    /* INFO: Append pageId to id and classes */
    if (child.id && !child.id.startsWith(pagePrefix)) child.id = `${pagePrefix}${child.id}`
    if (child.classList) {
      const newClasses = []
      /* INFO: Remember the checkbox state both ways: a marker that was only ever
                 added made a switch come back checked after it had been
                 turned off and the page was left. */
      if ('checked' in child) child.classList.toggle(`--page_loader:checked=true`, child.checked)

      for (const className of child.classList) {
        if (className.startsWith(pagePrefix)) {
          newClasses.push(className)
          continue
        }

        newClasses.push(`${pagePrefix}${className}`)
      }

      child.classList = []
      for (const className of newClasses) {
        child.classList.add(className)
      }
    }

    unuseHTML(child, pageId, false)
  })
}

async function loadPages() {
  return new Promise((resolve) => {
    /*
      INFO: Usually dynamic HTML leads to a lot of visual problems, which
              can vary from missing CSS for an extremely brief moment to
              a full page re-rendering. This is why we load all pages at
              once and then we just switch between them.
    */

    let amountLoaded = 0
    allPages.forEach(async (page) => {
      const pageHTML = await loadHTML(page)
      if (pageHTML === false) {
        toast('Error loading page')

        return;
      }

      const pageJSScripts = await getPageScripts(page)
      if (pageJSScripts === false) {
        toast(`Error while loading ${page} scripts`)

        return;
      }

      const pageContent = document.getElementById('page_content')
      const pageSpecificContent = document.createElement('div')
      pageSpecificContent.id = `${page}_content`
      pageSpecificContent.innerHTML = pageHTML
      /* INFO: Create mini-page headers before the initial HTML is marked inactive.
                This keeps the header/back button inside the page's normal lifecycle,
                including nested navigation (Customization -> Theme/Language). */
      if (isMiniPage(page)) ensureMiniPageHeader(pageSpecificContent)
      pageSpecificContent.style.display = 'none'
      if (isMiniPage(page)) pageSpecificContent.classList.add('page_loader_mini_layer')

      pageContent.appendChild(pageSpecificContent)
      unuseHTML(pageSpecificContent, page)

      const cssData = await getPageCSS(page)
      if (cssData) {
        const cssCode = document.createElement('style')
        cssCode.id = `${page}_css`
        cssCode.innerHTML = cssData
        cssCode.media = 'not all'

        head.appendChild(cssCode)
      }

      pageJSScripts.split('\n').forEach((line) => {
        if (line.length === 0) return;

        const jsCode = document.createElement('script')
        jsCode.src = line
        jsCode.type = 'module'
        jsCode.id = `${page}_js`

        const first = document.getElementsByTagName('script')[0]
        if (!first) {
          head.appendChild(jsCode)

          return;
        }

        first.parentNode.insertBefore(jsCode, first)
      })

      const pageJS = importPageJS(page)
      pageJS.then((module) => module.loadOnce())

      amountLoaded++
      if (amountLoaded === allPages.length) resolve()
    })
  })
}

function revertHTMLUnuse(page, pageId) {
  const pagePrefix = `page_${pageId}:`

  if (page.childNodes) page.childNodes.forEach((child) => {
    /* INFO: Remove pageId from id and classes */
    if (child.id && child.id.startsWith(pagePrefix)) {
      while (child.id.startsWith(pagePrefix)) {
        child.id = child.id.slice(pagePrefix.length)
      }
    }

    if (child.classList) {
      const newClasses = []

      for (const className of child.classList) {
        let normalizedClassName = className

        while (normalizedClassName.startsWith(pagePrefix)) {
          normalizedClassName = normalizedClassName.slice(pagePrefix.length)
        }

        if (normalizedClassName.length > 0) {
          newClasses.push(normalizedClassName)
        }
      }

      child.classList = []
      for (const className of newClasses) {
        child.classList.add(className)
      }
    }

    revertHTMLUnuse(child, pageId)
  })
}

function applyHTMLChanges(page, pageId) {
  if (page.childNodes) page.childNodes.forEach((child) => {
    /* INFO: Remove pageId from id and classes */
    if (child.classList) {
      const newClasses = []

      for (const className of child.classList) {
        if (className.startsWith(`--page_loader:checked=true`)) {
          child.checked = true
        }

        newClasses.push(className)
      }

      child.classList = []
      for (const className of newClasses) {
        child.classList.add(className)
      }
    }

    applyHTMLChanges(child, pageId)
  })
}

export async function loadPage(pageId) {
  /* INFO: Ignore navigation to the same page or while another transition is still running. */
  const currentPage = whichCurrentPage()

  if (currentPage === pageId) return false
  if (isPageTransitioning) return false

  isPageTransitioning = true

  try {
    const targetIsMiniPage = isMiniPage(pageId)
    const currentIsMiniPage = currentPage ? isMiniPage(currentPage) : false

    /* INFO: A mini page being left must not keep a live Back handler. */
    if (currentIsMiniPage && currentPage !== pageId) detachMiniPageCloseListener(currentPage)
    setNavbar(pageId)

    /* INFO: Main-to-main transitions switch CSS at animation midpoint to avoid style conflicts. */
    const isMainToMain = currentPage && !currentIsMiniPage && !targetIsMiniPage
    const pageSpecificContent = document.getElementById(`${pageId}_content`)
    const targetNeedsRevert = isHTMLUnused(pageSpecificContent, pageId)

    if (targetNeedsRevert) revertHTMLUnuse(pageSpecificContent, pageId)
    if (targetIsMiniPage) ensureMiniPageHeader(pageSpecificContent)
    if (!isMainToMain) document.getElementById(`${pageId}_css`).media = 'all'

    if (!currentPage) {
      await initializePage(pageId, pageSpecificContent, targetNeedsRevert)
      if (targetIsMiniPage) attachMiniPageCloseListener(pageId, pageSpecificContent)
      pageSpecificContent.style.display = 'block'

      return true
    }

    const currentPageContent = document.getElementById(`${currentPage}_content`)
    if (!currentIsMiniPage && targetIsMiniPage) {
      history.pushState(true, '', location.pathname)

      await initializePage(pageId, pageSpecificContent, targetNeedsRevert)
      attachMiniPageCloseListener(pageId, pageSpecificContent)
      await runMiniPageEnter(pageSpecificContent)

      return true
    }

    if (currentIsMiniPage) {
      /* Mini-to-mini navigation reuses the current overlay history entry. */
      if (!targetIsMiniPage) goBackWithoutGlobalFallback()

      await runMiniPageLeave(currentPageContent)
      unuseHTML(currentPageContent, currentPage)
      document.getElementById(`${currentPage}_css`).media = 'not all'
      detachMiniPageCloseListener(currentPage)

      if (!targetIsMiniPage) {
        // A nested mini page can sit above another mini page (Language above
        // Customization). Hide every intermediate layer before returning to a
        // main page, but never hide the actual target page.
        let ancestor = getMiniPageParent(currentPage)
        const visitedAncestors = new Set([currentPage])
        while (ancestor && isMiniPage(ancestor) && ancestor !== pageId && !visitedAncestors.has(ancestor)) {
          visitedAncestors.add(ancestor)
          const ancestorContent = document.getElementById(`${ancestor}_content`)
          if (ancestorContent) {
            ancestorContent.style.display = 'none'
            unuseHTML(ancestorContent, ancestor, false)
          }
          const ancestorCss = document.getElementById(`${ancestor}_css`)
          if (ancestorCss) ancestorCss.media = 'not all'
          detachMiniPageCloseListener(ancestor)
          ancestor = getMiniPageParent(ancestor)
        }

        const mainAncestor = getMainPageAncestor(currentPage)
        if (mainAncestor && mainAncestor !== pageId && allMainPages.includes(mainAncestor)) {
          const mainAncestorContent = document.getElementById(`${mainAncestor}_content`)
          if (mainAncestorContent) {
            mainAncestorContent.style.display = 'none'
            unuseHTML(mainAncestorContent, mainAncestor, false)
          }
          const mainAncestorCss = document.getElementById(`${mainAncestor}_css`)
          if (mainAncestorCss) mainAncestorCss.media = 'not all'
        }
      }

      await initializePage(pageId, pageSpecificContent, targetNeedsRevert)

      if (targetIsMiniPage) {
        attachMiniPageCloseListener(pageId, pageSpecificContent)
        await runMiniPageEnter(pageSpecificContent)
      } else {
        pageSpecificContent.style.display = 'block'
      }

      return true
    }

    const transitionDirection = allMainPages.indexOf(pageId) > allMainPages.indexOf(currentPage) ? 1 : -1

    document.getElementById(`${pageId}_css`).media = 'all'
    utils.removeAllListeners()
    await initializePage(pageId, pageSpecificContent, targetNeedsRevert)

    await runMainPageTransition(currentPageContent, pageSpecificContent, transitionDirection)

    unuseHTML(currentPageContent, currentPage, false)
    document.getElementById(`${currentPage}_css`).media = 'not all'

    return true
  } catch (error) {
    /* INFO: Keep transition errors visible without breaking future navigation attempts. */
    console.error('Page transition failed:', error)
    toast('Error while changing page.')

    return false
  } finally {
    isPageTransitioning = false

    if (pageId === 'home' && currentPage !== 'home' && history.state !== null)
      history.back()
    else if (pageId !== 'home' && currentPage === 'home')
      history.pushState(true, '', location.pathname)
  }
}

function getMiniPage(miniPageId) {
  return fetch(`js/pages/${whichCurrentPage()}/minipages/${miniPageId}.html`)
    .then((response) => response.text())
    .then((data) => {
      return data
    })
    .catch(() => false)
}

export async function loadMiniPage(miniPageId, unloadCb) {
  const minipage_html = await getMiniPage(miniPageId)
  if (!minipage_html) {
    toast('Error loading minipage')

    return;
  }

  const page_content = document.getElementById('page_content')
  const navbar = document.getElementById('navbar')
  const navbar_support_div = document.getElementById('navbar_support_div')

  page_content.style.transition = navbar.style.transition = 'filter 0.1s'
  page_content.style.filter = navbar.style.filter = 'blur(10px)'
  /* INFO: Not allow it to interact with the page, just click to close */
  page_content.style.pointerEvents = navbar_support_div.style.pointerEvents = 'none'

  function cleanup(isClick) {
    if (utils.isDivOrInsideDiv(event.target, 'minipage_content')) return;

    if (isClick) history.back()

    const minipage_content = document.getElementById('minipage_content')
    minipage_content.style.animation = 'fade-out 0.1s'

    page_content.style.transition = navbar.style.transition = 'filter 0.1s'
    page_content.style.filter = navbar.style.filter = null
    page_content.style.pointerEvents = navbar_support_div.style.pointerEvents = null

    setTimeout(() => {
      minipage_content.style.cssText = null
      minipage_content.innerHTML = null

      page_content.style.transition = navbar.style.transition = null
    }, 200)

    unloadCb()

    return true
  }

  window.onceTrueEvent('click', (event) => cleanup(true))
  window.onceTrueEvent('popstate', () => cleanup(false))

  const minipage_content = document.getElementById('minipage_content')
  minipage_content.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    background: none;
    animation: fade-in 0.1s;
  `

  minipage_content.innerHTML = `
    <div class="dim" style="padding: 20px; border-radius: 10px; width: 80vw;">
      <div class="dim" style="border-radius: 10px;">
        ${minipage_html}
      </div>
    </div>
  `

  history.pushState(true, '', location.pathname)
}

export async function reloadPage() {
  const pageId = whichCurrentPage()

  const pageSpecificContent = document.getElementById(`${pageId}_content`)
  pageSpecificContent.innerHTML = await solveStrings(await loadHTML(pageId), pageId)

  const module = await importPageJS(pageId)
  module.load()
  /* INFO: When reloading the page, due to the way the HTML is reloaded, the JavaScript
             listeners are lost, so we need to reapply them to ensure everything works. */
  utils.reapplyListeners()
}

export function getStrings(pageId, forceDefault = false) {
  return fetch(`lang/${forceDefault ? 'en_US' : (localStorage.getItem(`/${moduleName}/language`) || 'en_US')}.json`)
    .then((response) => response.json())
    .then((data) => {
      return {
        ...data.pages[pageId],
        ...data.globals,
        navbar: Object.fromEntries(allPages.map((page) => [page, data.pages[page].title]))
      }
    })
    .catch((err) => {
      if (!forceDefault) {
        toast('Error loading strings for the selected language, loading default (en_US) strings.')

        return getStrings(pageId, true)
      }

      toast('Error loading default strings!')
      console.error(`Failed to load default strings for page ${pageId}: `, err)

      return false
    })
}

export async function setLanguage(langId) {
  const normalizedLangId = String(langId || 'en_US').replace(/\.json$/i, '')
  localStorage.setItem(`/${moduleName}/language`, normalizedLangId)

  /*
   * Existing page content is refreshed lazily by initializePage() when each
   * page is next opened. The bottom navigation, however, stays mounted all the
   * time, so update its labels immediately instead of waiting for the WebUI to
   * be reopened. Invalidate the page cache first so the next page transition
   * uses the newly selected translations as well.
   */
  sufferedUpdate.length = 0

  try {
    const response = await fetch(`lang/${normalizedLangId}.json`, { cache: 'no-store' })
    if (!response.ok) throw new Error(`Language file returned HTTP ${response.status}`)
    const data = await response.json()

    allMainPages.forEach((page) => {
      const titleElement = document.getElementById(`nav_${page}_title`)
      const title = data?.pages?.[page]?.title
      if (titleElement && typeof title === 'string') titleElement.textContent = title
    })
  } catch (error) {
    console.warn('Could not immediately refresh navigation labels for the selected language.', error)
  }
}

(async () => {
  await loadPages()

  loadPage('home')
  loadNavbar()
})()

/* INFO: Global error handling to catch any unhandled errors and log them to a file for debugging purposes. */
window.addEventListener('error', function (event) {
  toast('An error occurred. See log file.')

  console.error('Unhandled error:', event.error)

  exec(`echo "Error: ${event.message}\n\n${event.error.stack}" > /data/adb/zygiskultra/webui_error.log`)
})

window.addEventListener('unhandledrejection', function (event) {
  toast('An error occurred. See log file.')

  console.error('Unhandled promise rejection:', event.reason)

  exec(`echo "Error (Unhandled Rejection): ${event.reason}\n\n${event.reason.stack}" > /data/adb/zygiskultra/webui_error.log`)
})

window.addEventListener('popstate', async () => {
  if (suppressNextGlobalPopstate) {
    suppressNextGlobalPopstate = false
    return
  }

  if (history.state !== null) return

  // Mini pages own their own Back action. Falling through to Home here races
  // with their close handler and can leave Settings' child pages unusable.
  if (isMiniPage(whichCurrentPage())) return

  const currentPage = whichCurrentPage()
  if (currentPage && currentPage !== 'home') await loadPage('home')
})

const setIntervalId = setInterval(() => {
	const toggle = document.getElementById('umount_toggle')

	if (toggle) {
		clearInterval(setIntervalId)

		exec("[[ -e '/data/adb/Zygisk-Ultra/unmount' ]] && echo '1' || echo '0'").then(result => {
			if (result.errno === 0) {
				Boolean(Number(result.stdout)) ? (toggle.checked = true) : (toggle.checked = false)
			}
		})

		document.addEventListener('change', async event => {
			if (event.target && event.target.matches('#umount_toggle')) {
				const toggle = document.getElementById('umount_toggle')
				const enabled = !toggle.checked

				if (enabled) {
					exec('rm -f /data/adb/Zygisk-Ultra/unmount')
				} else {
					exec('mkdir -p /data/adb/Zygisk-Ultra')
					exec('touch /data/adb/Zygisk-Ultra/unmount')
				}
			}
		})
	}
}, 1000)
