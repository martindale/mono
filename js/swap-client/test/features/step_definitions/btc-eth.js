const puppeteer = require('puppeteer')
const { Given, When, Then } = require('@cucumber/cucumber')

async function runTests () {
  let aliceSetup, bobSetup
  const aliceLogs = []
  const bobLogs = []
  Given('Alice browser is opened', async function () {
    aliceSetup = await setupBrowser()
  })
  Given('Bob browser is opened', async function () {
    bobSetup = await setupBrowser()
  })

  When('Alice clicks on login', async function () {
    await performLogin(aliceSetup.browser, 1)
  })
  When('Bob clicks on login', async function () {
    await performLogin(bobSetup.browser, 2)
  })

  When('Alice & Bob are logged in', async function () {
  })

  When('Alice creates an order from BTC to ETH', async function () {
    aliceSetup.page.on('console', msg => {
      aliceLogs.push(msg.text())
    })
    await createOrder(aliceSetup.browser, 'alice')
  })
  When('Bob creates an order from ETH to BTC', async function () {
    bobSetup.page.on('console', msg => {
      bobLogs.push(msg.text())
    })
    await createOrder(bobSetup.browser, 'bob')
  })

  Then('Swap fills and completes', { timeout: 20000 }, async function () {
    processLogs(aliceLogs, 'Alice')
    processLogs(bobLogs, 'Bob')

    await finalize()

    await aliceSetup.browser.close()
    await bobSetup.browser.close()
  })
}

function processLogs (logs, user) {
  const events = ['order.created', 'order.matched', 'swap.created', 'swap.opening', 'swap.opened', 'swap.committing', 'swap.committed']
  console.log(`${user}'s logs:`)
  if (logs && logs.length) {
    logs.forEach(log => {
      events.forEach(event => {
        if (log.includes(event)) {
          console.log(event)
        }
      })
    })
  }
}

async function setupBrowser () {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--window-size=1920,1096'] })
  const page = (await browser.pages())[0]
  await page.goto('http://localhost:5173')
  return { browser, page }
}

async function performLogin (browser, index) {
  // Explicitly get the page we want to work with
  const pages = await browser.pages()
  const page = pages[0] // This should be the second tab (index 1)

  // Debugging output
  console.log(`Attempting to login with index: ${index}`)

  await page.waitForSelector('#connect-wallet', { timeout: 10000 }) // Wait up to 1 seconds
  await page.click('#connect-wallet')

  try {
    // Wait for the '.MuiList-root' to be rendered
    await page.waitForSelector('.MuiList-root', { timeout: 5000 }) // waits for 5 seconds
  } catch (error) {
    console.error("Failed to find '.MuiList-root'.", error)
    throw error
  }

  const lis = await page.$$('.MuiList-root li')

  // Ensure the list items are found before trying to click
  if (lis && lis[index]) {
    await lis[index].click()
  } else {
    const error = new Error(`Unable to find list item at index ${index}`)
    console.error(error)
    throw error
  }
}

async function createOrder (browser, identifier) {
  const pages = await browser.pages()
  const page = pages[0] // Get the last page

  if (identifier === 'bob') { // TODO: Remove bob check and manually choose opposite pairs (remove state)
    const exchangeButton = await page.$('.exchange')
    if (!exchangeButton) {
      throw new Error('Exchange button not found for Bob')
    }
    await exchangeButton.click()
  }

  const inputs = await page.$$('.qty-input')
  if (!inputs || inputs.length < 2) {
    throw new Error(`Input fields not found for ${identifier}`)
  }
  await inputs[0].type('.0001')
  await inputs[1].type('.0001')

  const [swapButton] = await page.$x("//button[contains(., 'Swap')]")
  if (!swapButton) {
    throw new Error(`Swap button not found for ${identifier}`)
  }
  await swapButton.click()

  await page.waitForSelector('.activitiesContainer')
  // await page.screenshot({ path: 'debug_screenshot.png' });
  await page.waitForTimeout(1000) // wait for 5 seconds
  const activities = await page.$$('.activitiesContainer .activity-item')
  if (!activities || activities.length === 0) {
    throw new Error(`Activity items not found for ${identifier}`)
  }
  await activities[0].click()
}

async function finalize () {
  await new Promise(resolve => setTimeout(resolve, 10000))
}

// Execute the tests
runTests().catch(error => {
  console.error('Error during tests:', error)
})
