let env

if (typeof browser !== 'undefined') env = browser
else env = chrome

const mapIcons = {
  0: 'max',
  3: 'fhd',
  4: 'hd',
  5: 'sd',
  6: 'ld',
  '-1': 'pause',
  '-2': 'error',
};

(() => {
  env.runtime.onMessage.addListener(message => {
    if (message.action === 'updateIcon') {
      const type = mapIcons[message.icon]
      env.browserAction.setIcon({
        path: {
          16: `./assets/toolbar/${type}/16.png`,
          24: `./assets/toolbar/${type}/24.png`,
          32: `./assets/toolbar/${type}/32.png`,
        },
      })
    }
  })

  env.runtime.onInstalled.addListener(({ reason }) => {
    switch (reason) {
      case 'install':
        env.tabs.getAllInWindow(null, tabs => {
          tabs.forEach(tab => {
            const { hostname, pathname } = new URL(tab.url)
            if (hostname === 'www.youtube.com' && pathname === '/watch') {
              env.tabs.executeScript(tab.id, { file: 'index.js' })
            }
          })
        })
        break
      default:
        break
    }
  })
})()
