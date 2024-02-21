const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome.js')

const options = new chrome.Options()
options.setLoggingPrefs({
  browser: 'ALL'
})
options.addArguments('--enable-logging')
options.addArguments('--log-level=0')
options.addArguments('--user-data-dir=/Users/dev/Library/Application\ Support/Google/Chrome')
options.addArguments('--profile-directory=Profile 1')

const By = webdriver.By
const driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()

const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

async function main () {
  try {
    await driver.navigate().to('http://localhost:5173')

    const res = await driver.findElement(By.className('connect-bitcoin'))
    await res.click()

    const connectL1 = await driver.findElement(By.id('connect-l1'))
    await connectL1.click()
    await wait(5000)
    await driver.switchTo().alert().accept()

    await wait(20000)

    let windows = await driver.getAllWindowHandles()
    console.log(windows.length)
    await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

    await wait(2000)

    // Unisat control
    const pwdInput = await driver.findElement(By.tagName('input'))
    await pwdInput.sendKeys('TESTPW123')

    const firstDiv = await driver.findElement(By.css('.layout > div:first-child > div:first-child > div:nth-child(2) > div:nth-child(3)'))
    await firstDiv.click()

    await wait(2000)

    windows = await driver.getAllWindowHandles()
    if (windows.length === 1) {
      console.log('Unisat Wallet Connected!')
    } else {
      await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

      const approveBtn = await driver.findElement(By.css('.layout > div:nth-child(3) > div:first-child > div:nth-child(2)'))
      await approveBtn.click()
      console.log('Unisat Wallet Connected!')

      await wait(1000)
    }

    const logs = await driver.manage().logs().get('browser')
    const idxLog = logs.findIndex(log => log.message.indexOf('Unisat Wallet Connected') >= 0)
    if (idxLog >= 0) {
      console.log('Address Detected')
      console.log(logs[idxLog].message)
    }

    await driver.switchTo().window(windows[0])

    const modal = await driver.findElement(By.className('connect-modal-color'))
    const simulate = await modal.findElement(By.className('simulate-l1'))
    await simulate.click()

    await wait(3000)

    windows = await driver.getAllWindowHandles()
    await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window
  } catch (e) {
    console.error(e)
  }
}

main()
