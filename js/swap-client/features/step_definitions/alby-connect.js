const assert = require('assert')
const { Given, When, Then } = require('@cucumber/cucumber')
const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome.js')
const path = require('path')
const projDir = path.resolve(__dirname, '../../chrome-profile')

const By = webdriver.By
const options = new chrome.Options()
options.setLoggingPrefs({
  browser: 'ALL'
})
options.addArguments('--enable-logging')
options.addArguments('--log-level=0')
options.addArguments('--window-size=1920,1096')
options.addArguments('--disable-dev-shm-usage')
options.addArguments(`--user-data-dir=${projDir}`)
options.addArguments('--profile-directory=Profile 1')

let driver, windows

const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

Given('Test Browser is opened - FA', { timeout: 100000 }, async () => {
  driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()
  await driver.navigate().to('http://localhost:5173')
})

When('Click on Lightning Connect Button - FA', { timeout: 10000 }, async () => {
  const res = await driver.findElement(By.className('connect-bitcoin'))
  await res.click()

  const connectLightning = await driver.findElement(By.id('connect-lightning'))
  await connectLightning.click()

  await wait(2000)

  windows = await driver.getAllWindowHandles()
  await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

  // Unisat control
  const pwdInput = await driver.findElement(By.tagName('input'))
  await pwdInput.sendKeys('TESTPW123')

  const buttons = await driver.findElements(By.tagName('button'))
  await buttons[1].click()

  await wait(2000)

  windows = await driver.getAllWindowHandles()
  if (windows.length === 1) {
    console.log('Alby Wallet Connected!')
  } else {
    await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

    const approveBtn = await driver.findElement(By.className('bg-primary-gradient'))
    await approveBtn.click()
    console.log('Alby Wallet Connected!')

    await wait(1000)
  }
})

Then('Connect Alby Wallet - FA', { timeout: 10000 }, async () => {
  const logs = await driver.manage().logs().get('browser')
  const idxLog = logs.findIndex(log => log.message.indexOf('Alby Wallet Connected') >= 0)
  if (idxLog >= 0) {
    console.log('Address Detected')
    console.log(logs[idxLog].message)
  }
})

Then('Simulate Alby Payment - FA', { timeout: 100000 }, async () => {
  await driver.switchTo().window(windows[0])

  const modal = await driver.findElement(By.className('connect-modal-color'))
  const simulate = await modal.findElement(By.id('simulate-lightning'))
  await simulate.click()

  await wait(3000)

  windows = await driver.getAllWindowHandles()
  await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

  try {
    const approveBtn = await driver.findElement(By.className('bg-primary-gradient'))
    await approveBtn.click()
    console.log('Payment Simulation Done!')
  } catch (e) {
    console.error('Error occured on payment!')
  }

  await wait(3000)
  driver.quit()
})
