// JS for popup.html

jQuery('html').hide().fadeIn('slow')

const filterInput = document.getElementById('filter-input')
filterInput.focus()

const buttons = document.querySelectorAll('.popup-click')
buttons.forEach((el) => el.addEventListener('click', popupClick))

document.getElementById('filter-form').addEventListener('submit', popupClick)
document.addEventListener('DOMContentLoaded', initPopup)

async function initPopup() {
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    if (patterns?.length) {
        document.getElementById('no-filters').remove()
        patterns.forEach(function (value, i) {
            createFilterLink(i.toString(), value)
        })
    }
    const manifest = chrome.runtime.getManifest()
    document.getElementById('version').outerText = `v${manifest.version}`
}

/**
 * Add Form Input for a Filter
 * @function createFilterLink
 * @param {String} number
 * @param {String} value
 */
function createFilterLink(number, value = '') {
    const ul = document.getElementById('filters-ul')
    const li = document.createElement('li')
    ul.appendChild(li)
    const small = document.createElement('small')
    const a = document.createElement('a')
    a.textContent = value
    a.href = '#'
    a.classList.add('dropdown-item')
    a.addEventListener('click', popupClick)
    small.appendChild(a)
    li.appendChild(small)
}

/**
 * Handle Popup Clicks
 * @function popupClick
 * @param {MouseEvent} event
 */
async function popupClick(event) {
    event.preventDefault()
    console.log(event)
    if (event.target.dataset.href) {
        const url = chrome.runtime.getURL(event.target.dataset.href)
        console.log(`url: ${url}`)
        await chrome.tabs.create({ active: true, url })
        window.close()
        return
    }
    if (event.target.id === 'btn-about') {
        const manifest = chrome.runtime.getManifest()
        console.log(`url: ${manifest.homepage_url}`)
        await chrome.tabs.create({ active: true, url: manifest.homepage_url })
        window.close()
        return
    }

    const url = new URL(chrome.runtime.getURL('../html/links.html'))
    if (event.target.id === 'btn-domains') {
        console.log('domains: yes')
        url.searchParams.set('domains', 'yes')
    }

    if (event.target.classList.contains('dropdown-item')) {
        console.log(`event.target.textContent: ${event.target.textContent}`)
        url.searchParams.set('filter', event.target.textContent)
    } else if (filterInput.value) {
        console.log(`filterInput.value: ${filterInput.value}`)
        url.searchParams.set('filter', filterInput.value)
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    console.log(`tab.id: ${tab.id}`)
    url.searchParams.set('tab', tab.id.toString())

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/inject.js'],
    })

    console.log(`url: ${url.toString()}`)
    await chrome.tabs.create({ active: true, url: url.toString() })
    window.close()
}
