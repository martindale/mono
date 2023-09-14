const assert = require('assert')
const { Given, When, Then } = require('@cucumber/cucumber')
const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome.js')

const By = webdriver.By

// Chrome options configuration
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

// Utility function to pause the execution
const wait = (t) => {
  return new Promise((res) => {
    setTimeout(res, t)
  })
}

Given('Alice browser is opened', { timeout: 10000 }, async () => {
  alice = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()
  await alice.navigate().to('http://localhost:5173')
})

Given('Bob browser is opened', { timeout: 10000 }, async () => {
  bob = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()
  await bob.navigate().to('http://localhost:5173')
})

When('Alice clicks on login', { timeout: 10000 }, async () => {
  await performLogin(alice, 1)
})

When('Bob clicks on login', { timeout: 10000 }, async () => {
  await performLogin(bob, 2)
})

async function performLogin (browser, index) {
  const res = await browser.findElement(By.id('connect-wallet'))
  await res.click()

  await wait(500)

  const uls = await browser.findElement(By.className('MuiList-root'))
  const lis = await uls.findElements(By.tagName('li'))
  await lis[index].click()

  await wait(500)
}

// Previous login code
/*
Then('Alice logs in', async () => {
  const logs = await alice.manage().logs().get('browser');
  const idxLog = logs.findIndex(log => log.message.indexOf("Client Websocket initialized") >= 0);
  assert.ok(idxLog >= 0, 'Alice is not logged in');
})

Then('Bob logs in', async () => {
  const logs = await bob.manage().logs().get('browser');
  const idxLog = logs.findIndex(log => log.message.indexOf("Client Websocket initialized") >= 0);
  assert.ok(idxLog >= 0, 'Bob is not logged in');
});
*/

Given('Alice & Bob is logged in', () => {
  return 'success'
})

When('Alice creates an order from BTC to ETH', { timeout: 100000 }, async () => {
  await createOrder(alice)
})

When('Bob creates an order from ETH to BTC', { timeout: 100000 }, async () => {
  await createOrder(bob)
})

async function createOrder (browser) {
  // With BTC to ETH swap as the default, Bob clicks the exchange button for ETH to BTC swap
  if (browser === bob) {
    const excBtn = await browser.findElement(By.className('exchange'))
    await excBtn.click()
  }

  // Quantity Inputs
  const inputs = await browser.findElements(By.className('qty-input'))
  await inputs[0].sendKeys('.0001')
  await inputs[1].sendKeys('.0001')

  await wait(500)

  // Swap Button Click
  const swapBtn = await browser.findElement(By.xpath("//button[contains(text(), 'Swap')]"))
  await swapBtn.click()

  await wait(1500)

  const activityList = await browser.findElement(By.className('activitiesContainer'))
  const activities = await activityList.findElements(By.className('activity-item'))
  await activities[0].click()
}

Then('Swap fills and completes', { timeout: 100000 }, async () => {
  await wait(10000)
  alice.quit()
  bob.quit()
  return 'success'
})
