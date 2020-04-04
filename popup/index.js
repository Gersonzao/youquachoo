let env
let browserName

if (typeof browser !== 'undefined') {
  env = browser
  browserName = 'firefox'
} else {
  env = chrome
  browserName = 'chrome'
}

const mainTemplate = window.Sanitizer.escapeHTML`
  <span class="text text--bold">Choose your default YouTube quality:</span>
  <div class="main__grid grid">
    <button data-quality="0" class="button button--max">Max Available</button>
    <button data-quality="3" class="button button--1080">1080p</button>
    <button data-quality="4" class="button button--720">720p</button>
    <button data-quality="5" class="button button--480">480p</button>
    <button data-quality="6" class="button button--360">360p</button>
    <button data-quality="-1" class="button button--pause">Pause Plugin :(</button>
  </div>
`

const warningTemplate = window.Sanitizer.escapeHTML`
  <div class="warning">
    <span class="text text--centered">In this version, the plugin works only on <a class="link link--text" tabindex="0" target="_blank" href="https://www.youtube.com/">youtube.com</a>. But in the future, we will add support for embedded videos on third-party sites.</span>
    <a class="link link--label link--background link--feedback" tabindex="0" target="_blank" href="mailto:olegaleshkin@gmail.com">Send Feedback & Suggestions</a>
  </div>
`

const renderPopupBody = (resolve, reject) => {
  if (browserName === 'chrome') {
    document.querySelector('.link--twitter').setAttribute('href', 'https://twitter.com/intent/tweet?text=I%27m%20using%20@YouQuaChoo,%20so%20I%20can%20watch%20YouTube%20videos%20with%20automatically%20adjusted%20quality%20&hashtags=stayathome,youquachoo&url=https://chrome.google.com/webstore/detail/agnpidgdllnhnkacjnbpaoelnhabahfk')
  } else if (browserName === 'firefox') {
    document.querySelector('.link--twitter').setAttribute('href', 'https://twitter.com/intent/tweet?text=I%27m%20using%20@YouQuaChoo,%20so%20I%20can%20watch%20YouTube%20videos%20with%20automatically%20adjusted%20quality%20&hashtags=stayathome,youquachoo&url=https://addons.mozilla.org/addon/youquachoo')
  }

  env.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (new URL(tabs[0].url).hostname === 'www.youtube.com') {
      document.querySelector('.main').insertAdjacentHTML('afterbegin', mainTemplate)
      resolve()
    } else {
      document.querySelector('.main').insertAdjacentHTML('afterbegin', warningTemplate)
      reject('warning')
    }
  })
}

const setQuality = () => {
  env.storage.sync.get('quality', ({ quality }) => {
    if (!quality) {
      env.storage.sync.set({ quality: 3 })
      document.querySelector(`[data-quality="${3}"]`).classList.add('button--active')
      return
    }

    if (quality === -1) {
      document.querySelector('.header__logo').src = '../assets/popup/logo-paused.svg'
    }

    document.querySelector(`[data-quality="${quality}"]`).classList.add('button--active')
  })
}

const addQualityButtonsListeners = () => {
  // Quality switch listener
  const qualityButtons = document.querySelectorAll('[data-quality]')

  qualityButtons.forEach(el => {
    el.addEventListener('click', () => {
      env.storage.sync.get('quality', () => {
        const newQualityValue = parseInt(el.getAttribute('data-quality'), 10)

        if (newQualityValue === -1) {
          document.querySelector('.header__logo').src = '../assets/popup/logo-paused.svg'
        } else {
          document.querySelector('.header__logo').src = '../assets/popup/logo.svg'
        }

        document.querySelector('.button--active').classList.remove('button--active')
        document.querySelector(`[data-quality="${newQualityValue}"]`).classList.add('button--active')

        env.storage.sync.set({ quality: newQualityValue })

        env.runtime.sendMessage({
          action: 'updateIcon',
          icon: newQualityValue,
        })

        env.tabs.query({ active: true, currentWindow: true }, tabs => {
          env.tabs.sendMessage(tabs[0].id, { action: 'adjustQuality' })
        })
      })
    })
  })
}

const onPopupLoadingError = type => {
  if (type === 'warning') {
    console.log('YouQuaChoo: Please visit YouTube to manage quality settings.')
    return
  }

  env.runtime.sendMessage({
    action: 'updateIcon',
    icon: '-2',
  })
  throw new Error('YouQuaChoo: Something went wrong while loading extension popup.')
}

const copyExtensionLink = () => {
  // Copying link and animation afterwards
  const copyLinkButton = document.querySelector('.js-copy-link')
  const copyLinkText = document.querySelector('.copy-link__text')

  copyLinkButton.addEventListener('click', () => {
    if (copyLinkText.classList.contains('copy-link--animating')) return

    let linkToCopy

    if (browserName === 'chrome') {
      linkToCopy = 'https://chrome.google.com/webstore/detail/agnpidgdllnhnkacjnbpaoelnhabahfk'
    } else if (browserName === 'firefox') {
      linkToCopy = 'https://addons.mozilla.org/addon/youquachoo'
    }

    navigator.clipboard.writeText(linkToCopy).then(() => {
      copyLinkText.classList.add('copy-link--animating')
      copyLinkText.classList.add('copy-link--fade-in-fade-out')
      setTimeout(() => {
        copyLinkText.innerHTML = 'Link Copied!'
      }, 250)
      setTimeout(() => {
        copyLinkText.classList.remove('copy-link--fade-in-fade-out')
      }, 500)

      setTimeout(() => {
        copyLinkText.classList.add('copy-link--fade-in-fade-out')
        setTimeout(() => {
          copyLinkText.innerHTML = 'Copy Link To Extension'
        }, 250)
        setTimeout(() => {
          copyLinkText.classList.remove('copy-link--fade-in-fade-out')
          copyLinkText.classList.remove('copy-link--animating')
        }, 500)
      }, 1500)
    })
  })
}

(() => {
  new Promise(renderPopupBody)
    .then(setQuality)
    .then(addQualityButtonsListeners)
    .catch(onPopupLoadingError)

  copyExtensionLink()
})()
