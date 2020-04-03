(() => {
  const mapIcons = {
    0: 'max',
    3: 'fhd',
    4: 'hd',
    5: 'sd',
    6: 'ld',
    '-1': 'pause',
    '-2': 'error',
  }

  chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'updateIcon') {
      const type = mapIcons[message.icon]
      chrome.browserAction.setIcon({
        path: {
          16: `./assets/toolbar/${type}/16.png`,
          24: `./assets/toolbar/${type}/24.png`,
          32: `./assets/toolbar/${type}/32.png`,
        },
      })
    }
  })
})()
