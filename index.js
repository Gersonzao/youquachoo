// To prevent multiple calls of adjustQuality from different watchers/listeners
let isAdjusting = false
let env

if (typeof browser !== 'undefined') env = browser
else env = chrome

const detectQuality = resolve => {
  env.storage.sync.get('quality', ({ quality }) => {
    if (!quality) {
      env.storage.sync.set({ quality: 3 }, () => {
        resolve(3)
      })
      return
    }

    env.storage.sync.set({ quality }, () => {
      resolve(quality)
    })
  })
}

const clickToSettings = quality => new Promise((resolve, reject) => {
  if (quality === -1) {
    reject('disabled')
  }

  const video = document.querySelector('video.html5-main-video')

  const videoReadinessInterval = setInterval(() => {
    if (video.readyState > 0) {
      document.querySelector('.ytp-settings-button').click()
      clearInterval(videoReadinessInterval)
      resolve()
    }
  }, 100)
})

const clickToQuality = () => {
  const settingsElements = document
    .querySelector('.ytp-settings-menu')
    .querySelectorAll('.ytp-menuitem')

  settingsElements[settingsElements.length - 1].click()
}

const pickQuality = () => {
  env.storage.sync.get('quality', data => {
    const qualityElements = document
      .querySelector('.ytp-quality-menu')
      .querySelectorAll('.ytp-menuitem')

    const missedResolutions = 10 - qualityElements.length

    let qualityToPick = data.quality - missedResolutions
    if (qualityToPick < 0) qualityToPick = 0

    qualityElements[qualityToPick].click()
    isAdjusting = false
  })
}

const onAdjustError = type => {
  if (type === 'disabled') {
    env.runtime.sendMessage({
      action: 'updateIcon',
      icon: '-1',
    })
    console.log('YouQuaChoo plugin disabled!')
    return
  }

  env.runtime.sendMessage({
    action: 'updateIcon',
    icon: '-2',
  })
  throw new Error('YouQuaChoo: Something went wrong while changing quality.')
}

const adjustQuality = () => {
  isAdjusting = true
  new Promise(detectQuality)
    .then(clickToSettings)
    .then(clickToQuality)
    .then(pickQuality)
    .catch(onAdjustError)
}

(() => {
  const onInitialLoad = setInterval(() => {
    if (document.querySelector('.ytp-settings-button') && window.location.pathname === '/watch') {
      adjustQuality()
      clearInterval(onInitialLoad)
    }
  }, 100)

  let pathname = '/'

  // URL change watcher
  setInterval(() => {
    if (pathname !== window.location.pathname) {
      ({ pathname } = window.location)
      if (window.location.pathname === '/watch' && !isAdjusting) {
        adjustQuality()
      }
    }
  }, 500)

  env.runtime.onMessage.addListener(message => {
    if (message.action === 'adjustQuality') {
      if (window.location.pathname === '/watch') {
        adjustQuality()
      }
    }
  })

  env.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.action === 'getDOM') {
      sendResponse({
        document,
      })
    }
  })
})()
