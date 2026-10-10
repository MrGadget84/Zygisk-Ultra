import { loadPage, allPages, allMiniPages } from './pageLoader.js'

export function loadNavbar() {
  document.getElementById('nibg_home').classList.add('show')
}

export function setNavbar(page) {
  if (allMiniPages.includes(page)) {
    allPages.forEach((page) => {
      document.getElementById(`n_${page}`).removeAttribute('checked')
    })
    document.getElementById(`n_${page}`).setAttribute('checked', '')
    return
  }

  allPages.forEach((page) => {
    document.getElementById(`n_${page}`).removeAttribute('checked')
    document.getElementById(`nibg_${page}`).classList.remove('show')
    document.getElementById(`ni_${page}`).style.backgroundImage = ''
  })

  document.querySelectorAll('#navbar label.radio').forEach((label) => {
    label.classList.remove('nav-active')
  })
  document.querySelector(`#navbar label[for="n_${page}"]`)?.classList.add('nav-active')

  document.getElementById(`n_${page}`).setAttribute('checked', '')
  document.getElementById(`nibg_${page}`).classList.add('show')
  document.getElementById(`ni_${page}`).style.backgroundImage = `url(./assets/${page}/filled.svg)`
}

export function whichCurrentPage() {
  for (const page of allPages) {
    if (document.getElementById(`n_${page}`).hasAttribute('checked')) return page
  }

  return null
}

document.querySelectorAll('[name=navbutton]').forEach((element) => {
  element.addEventListener('click', async (event) => {
    event.preventDefault()

    const value = event.target.value

    await loadPage(value)
  })
})