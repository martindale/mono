const assert = require('assert')
const { Given, When, Then } = require('@cucumber/cucumber')
const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome.js')

const By = webdriver.By
const options = new chrome.Options()
options.setLoggingPrefs({
  browser: 'ALL'
})
options.addArguments('--enable-logging')
options.addArguments('--log-level=0')
options.addArguments('--headless')
options.addArguments('--window-size=1920,1096')
options.addArguments('--disable-dev-shm-usage')

let alice, bob

const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

Given('Alice browser is opened - F1', { timeout: 10000 }, async () => {
  alice = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()
  await alice.navigate().to('http://localhost:5173')
})

Given('Bob browser is opened - F1', { timeout: 10000 }, async () => {
  bob = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()
  await bob.navigate().to('http://localhost:5173')
})

When('Alice clicks on login - F1', { timeout: 10000 }, async () => {
  const res = await alice.findElement(By.id('connect-wallet'))
  await res.click()

  await wait(500)

  // Alice Click
  const uls = await alice.findElement(By.className('MuiList-root'))
  const lis = await uls.findElements(By.tagName('li'))
  await lis[1].click()

  await wait(500)
})

When('Bob clicks on login - F1', { timeout: 10000 }, async () => {
  const res = await bob.findElement(By.id('connect-wallet'))
  await res.click()

  await wait(500)

  // bob Click
  const uls = await bob.findElement(By.className('MuiList-root'))
  const lis = await uls.findElements(By.tagName('li'))
  await lis[2].click()

  await wait(500)
})

Then('Alice logs in - F1', async () => {
  const logs = await alice.manage().logs().get('browser')
  const idxLog = logs.findIndex(log => log.message.indexOf('Client Websocket initialized') >= 0)
  assert.ok(idxLog >= 0, 'Alice is not logged in')
})

Then('Bob logs in - F1', async () => {
  const logs = await bob.manage().logs().get('browser')
  const idxLog = logs.findIndex(log => log.message.indexOf('Client Websocket initialized') >= 0)
  assert.ok(idxLog >= 0, 'Bob is not logged in')
})

Given('Alice & Bob is logged in - F1', () => {
  return 'success'
})

When('Alice creates an order from BTCORD to BTC - F1', { timeout: 100000 }, async () => {
  // Quantity Inputs
  const btcAsset = await alice.findElement(By.className('coin-select'))
  await btcAsset.click()

  await wait(500)
  const modal = await alice.findElement(By.className('modal-container'))
  const items = await modal.findElements(By.className('asset-item'))
  await items[4].click()

  const collModal = await alice.findElement(By.className('modal-container'))
  const ordinals = await collModal.findElements(By.className('nft-card'))
  await wait(200)
  await ordinals[0].click()

  // Quantity Inputs
  const inputs = await alice.findElements(By.className('qty-input'))
  await inputs[0].sendKeys('0.0001')

  await wait(500)
  // Swap Button Click
  const swapBtn = await alice.findElement(By.xpath("//button[contains(text(), 'Swap')]"))
  await swapBtn.click()

  await wait(2500)

  const activityList = await alice.findElement(By.className('activitiesContainer'))
  const activities = await activityList.findElements(By.className('activity-item'))
  await activities[0].click()
})

When('Bob creates an order from BTC to BTCORD - F1', { timeout: 100000 }, async () => {
  // Quantity Inputs
  const btcAssets = await bob.findElements(By.className('coin-select'))
  await btcAssets[1].click()

  await wait(500)
  const modal = await bob.findElement(By.className('modal-container'))
  const items = await modal.findElements(By.className('asset-item'))
  await items[4].click()

  await wait(500)
  const collModal = await bob.findElement(By.className('modal-container'))
  const ordinals = await collModal.findElements(By.className('nft-card'))
  await wait(200)
  await ordinals[0].click()

  // Quantity Inputs
  const inputs = await bob.findElements(By.className('qty-input'))
  await inputs[0].sendKeys('0.0001')

  await wait(500)
  // Swap Button Click
  const swapBtn = await bob.findElement(By.xpath("//button[contains(text(), 'Swap')]"))
  await swapBtn.click()

  await wait(1500)

  const activityList = await bob.findElement(By.className('activitiesContainer'))
  const activities = await activityList.findElements(By.className('activity-item'))
  await activities[0].click()
})

Then('Swap fills and completes - F1', { timeout: 100000 }, async () => {
  await wait(10000)
  alice.quit()
  bob.quit()
  return 'success'
})
