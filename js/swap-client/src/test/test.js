// TODO: merge with newer, this may be older code

const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome.js')

const options = new chrome.Options()
options.setLoggingPrefs({
  browser: 'ALL'
})
options.addArguments('--enable-logging')
options.addArguments('--log-level=0')
options.addArguments('--window-size=1920,1096')
options.addArguments('--disable-dev-shm-usage')

const driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()
const driver1 = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()
// Instantiate a web browser page
const By = webdriver.By // useful Locator utility to describe a query for a WebElement
const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

async function main () {
  // Connect to the project
  await driver.navigate().to('http://localhost:5173')

  await wait(1500)
  // Connect Wallet Button Click
  const res = await driver.findElement(By.id('connect-wallet'))
  await res.click()

  await wait(500)

  // Alice Click
  const uls = await driver.findElement(By.className('MuiList-root'))
  const lis = await uls.findElements(By.tagName('li'))
  await lis[1].click()

  await wait(500)

  const logs = await driver.manage().logs().get('browser')
  const idxLog = logs.findIndex(log => log.message.indexOf('Client Websocket initialized') >= 0)
  if (idxLog >= 0) {
    console.log(' ============ Alice Websocket Connected!!! ============== ')
  }

  // Quantity Inputs
  const btcAsset = await driver.findElement(By.className('coin-select'))
  await btcAsset.click()

  await wait(500)
  const modal = await driver.findElement(By.className('modal-container'))
  const items = await modal.findElements(By.className('asset-item'))
  await items[4].click()

  const collModal = await driver.findElement(By.className('modal-container'))
  const ordinals = await collModal.findElements(By.className('nft-card'))
  await wait(200)
  await ordinals[0].click()

  // Quantity Inputs
  const inputs = await driver.findElements(By.className('qty-input'))
  await inputs[0].sendKeys('0.0001')

  await wait(500)
  // Swap Button Click
  const swapBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Swap')]"))
  await swapBtn.click()

  await wait(2500)

  const activityList = await driver.findElement(By.className('activitiesContainer'))
  const activities = await activityList.findElements(By.className('activity-item'))
  await activities[0].click()
}

async function main2 () {
  // Connect to the project
  await driver1.navigate().to('http://localhost:5173')

  // Connect Wallet Button Click
  const res = await driver1.findElement(By.id('connect-wallet'))
  await res.click()

  await wait(500)

  // Bob Click
  const uls = await driver1.findElement(By.className('MuiList-root'))
  const lis = await uls.findElements(By.tagName('li'))
  await lis[2].click()

  await wait(500)

  const logs = await driver1.manage().logs().get('browser')
  const idxLog = logs.findIndex(log => log.message.indexOf('Client Websocket initialized') >= 0)
  if (idxLog >= 0) {
    console.log(' ============ Bob Websocket Connected!!! ============== ')
  }

  // Quantity Inputs
  const btcAssets = await driver1.findElements(By.className('coin-select'))
  await btcAssets[1].click()

  await wait(500)
  const modal = await driver1.findElement(By.className('modal-container'))
  const items = await modal.findElements(By.className('asset-item'))
  await items[4].click()

  await wait(500)
  const collModal = await driver1.findElement(By.className('modal-container'))
  const ordinals = await collModal.findElements(By.className('nft-card'))
  await wait(200)
  await ordinals[0].click()

  // Quantity Inputs
  const inputs = await driver1.findElements(By.className('qty-input'))
  await inputs[0].sendKeys('0.0001')

  await wait(500)
  // Swap Button Click
  const swapBtn = await driver1.findElement(By.xpath("//button[contains(text(), 'Swap')]"))
  await swapBtn.click()

  await wait(1500)

  const activityList = await driver1.findElement(By.className('activitiesContainer'))
  const activities = await activityList.findElements(By.className('activity-item'))
  await activities[0].click()
}

module.exports = async function () {
  main()
  main2()
}
